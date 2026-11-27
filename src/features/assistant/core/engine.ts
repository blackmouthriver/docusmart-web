/**
 * Motor del asistente (W-70b): búsqueda local tipo BM25 sobre la base de conocimiento, sin enviar
 * nada fuera del navegador. Las preguntas de cada entrada pesan más que la respuesta; tolera errores
 * de tipeo y da un plus a las entradas de la herramienta de la página actual.
 */
import { editDistance, tokenize, typoBudget } from './text'
import { normalizeForSearch } from '../../../shared/i18n/search'

export type KbAction =
  | { kind: 'tool'; label: string; href: string; app: string }
  | { kind: 'link'; label: string; href: string; app?: string; external?: boolean }

export type KbEntry = { id: string; q: string[]; a: string; actions?: KbAction[]; tool?: string; related?: string[] }
export type Kb = { lang: string; ui: Record<string, string>; entries: KbEntry[] }

/** qTerms: palabras de las preguntas; qSeqs: cada pregunta como secuencia, para premiar el mismo orden. */
type Doc = { entry: KbEntry; tf: Map<string, number>; len: number; qTerms: Set<string>; qSeqs: string[][] }
export type Index = { lang: string; docs: Doc[]; df: Map<string, number>; avgLen: number; vocab: string[]; byId: Map<string, KbEntry>; exact: Map<string, KbEntry> }

/** Letras de chino, japonés y coreano (se indexan por pares de caracteres). */
const CJK_WORD = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

/** Peso de las preguntas frente a la respuesta. */
const QUESTION_WEIGHT = 3
const K1 = 1.2
const B = 0.75
/** Peso de una palabra corregida por tipeo frente a una exacta. */
const TYPO_FACTOR = 0.7
/** Plus por palabra en el mismo orden que en una pregunta ("pdf a word" ≠ "word a pdf"). */
const ORDER_STEP = 0.15
/** Plus cuando una pregunta completa está dentro de lo escrito ("leer en voz alta" en "leer en voz alta un pdf"). */
const PHRASE_BOOST = 1.5
/** Sin herramienta en contexto, las respuestas generales priman sobre las preguntas repetidas de cada herramienta. */
const GENERAL_BOOST = 1.2
/** La entrada principal de cada herramienta (qué hace y sus pasos) responde el "cómo"; sus FAQ, lo específico. */
const MAIN_TOOL_BOOST = 1.25
/** Plus para las entradas de la herramienta de la página actual. */
const CONTEXT_BOOST = 1.3
/** Puntaje mínimo y proporción mínima de palabras encontradas para responder con confianza. */
export const MIN_SCORE = 2.2
export const MIN_COVERAGE = 0.5

export function buildIndex(kb: Kb): Index {
  const docs: Doc[] = kb.entries.map((entry) => {
    const tf = new Map<string, number>()
    const add = (text: string, w: number) => tokenize(text, kb.lang).forEach((t) => tf.set(t, (tf.get(t) ?? 0) + w))
    entry.q.forEach((q) => add(q, QUESTION_WEIGHT))
    add(entry.a, 1)
    let len = 0
    tf.forEach((v) => (len += v))
    const qSeqs = entry.q.map((q) => tokenize(q, kb.lang))
    return { entry, tf, len, qTerms: new Set(qSeqs.flat()), qSeqs }
  })
  const df = new Map<string, number>()
  docs.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)))
  const avgLen = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length)
  // Preguntas exactas (también las hechas solo de palabras vacías, como "what can you do").
  const exact = new Map<string, KbEntry>()
  kb.entries.forEach((e) => e.q.forEach((q) => exact.has(normalizeForSearch(q)) || exact.set(normalizeForSearch(q), e)))
  return { lang: kb.lang, docs, df, avgLen, vocab: [...df.keys()], byId: new Map(kb.entries.map((e) => [e.id, e])), exact }
}

/** Palabras de la búsqueda con su peso: exactas (1) o corregidas por tipeo (TYPO_FACTOR). */
export function expandQuery(index: Index, query: string): Array<{ term: string; weight: number; source: string }> {
  const out: Array<{ term: string; weight: number; source: string }> = []
  for (const word of new Set(tokenize(query, index.lang))) {
    if (index.df.has(word)) {
      out.push({ term: word, weight: 1, source: word })
      continue
    }
    const budget = typoBudget(word)
    if (!budget) continue
    // Corrección: las palabras de la base más cercanas (o que empiezan igual, para palabras cortadas).
    const near = index.vocab
      .map((v) => ({ v, d: v.startsWith(word) && word.length >= 4 ? 0.5 : editDistance(word, v, budget) }))
      .filter((x) => x.d <= budget)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    near.forEach((x) => out.push({ term: x.v, weight: TYPO_FACTOR, source: word }))
  }
  return out
}

export type SearchResult = { entry: KbEntry; score: number }
export type SearchOutcome = { results: SearchResult[]; confident: boolean; coverage: number }

/** Busca la mejor respuesta. `context`: slug de la herramienta de la página actual (plus a sus entradas). */
/** true si `seq` contiene todas las palabras de `words` en el mismo orden (no necesariamente seguidas). */
export function inOrder(words: string[], seq: string[]): boolean {
  let i = 0
  for (const w of seq) if (w === words[i]) i++
  return words.length > 1 && i === words.length
}

/** Plus por el orden: la pregunta con más palabras de lo escrito en el mismo orden. */
export function orderBoost(asked: string[], seqs: string[][]): number {
  let best = 0
  for (const seq of seqs) {
    const words = asked.filter((w) => seq.includes(w))
    if (inOrder(words, seq)) best = Math.max(best, words.length)
  }
  return 1 + ORDER_STEP * best
}

export function search(index: Index, query: string, opts: { context?: string; limit?: number } = {}): SearchOutcome {
  const exactHit = index.exact.get(normalizeForSearch(query).replace(/[¿?¡!.]+/g, '').trim())
  if (exactHit) return { results: [{ entry: exactHit, score: Infinity }], confident: true, coverage: 1 }
  const normalized = normalizeForSearch(query)
  const terms = expandQuery(index, query)
  const asked = new Set(tokenize(query, index.lang))
  if (!terms.length) return { results: [], confident: false, coverage: 0 }
  const n = index.docs.length
  const scored: Array<SearchResult & { matched: Set<string> }> = []
  for (const doc of index.docs) {
    let score = 0
    let inQuestion = false
    const matched = new Set<string>()
    for (const { term, weight, source } of terms) {
      const f = doc.tf.get(term)
      if (!f) continue
      const df = index.df.get(term) ?? 0
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5))
      score += weight * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.len) / index.avgLen)))
      matched.add(source)
      if (doc.qTerms.has(term)) inQuestion = true
    }
    // Solo cuenta si alguna palabra está en sus preguntas, no únicamente en el texto de la respuesta.
    if (!score || !inQuestion) continue
    score *= orderBoost([...asked], doc.qSeqs)
    if (doc.qSeqs.some((seq, i) => seq.length > 1 && normalized.includes(normalizeForSearch(doc.entry.q[i])))) score *= PHRASE_BOOST
    if (!opts.context && !doc.entry.tool) score *= GENERAL_BOOST
    if (doc.entry.tool && doc.entry.id === `tool:${doc.entry.tool}`) score *= MAIN_TOOL_BOOST
    if (opts.context && doc.entry.tool === opts.context) score *= CONTEXT_BOOST
    scored.push({ entry: doc.entry, score, matched })
  }
  scored.sort((a, b) => b.score - a.score)
  const top = scored[0]
  // En chino, japonés y coreano cada par de caracteres es una «palabra»: los pares que no están en ninguna parte
  // de la base (de relleno, como 了发 o 发不) cuentan la mitad para la cobertura; las palabras latinas, siempre entero.
  const weightOf = (w: string) => (CJK_WORD.test(w) && !index.df.has(w) ? 0.5 : 1)
  const total = [...asked].reduce((n, w) => n + weightOf(w), 0)
  const coverage = top ? [...top.matched].reduce((n, w) => n + weightOf(w), 0) / Math.max(1, total) : 0
  return {
    results: scored.slice(0, opts.limit ?? 5).map(({ entry, score }) => ({ entry, score })),
    confident: !!top && top.score >= MIN_SCORE && coverage >= MIN_COVERAGE,
    coverage,
  }
}

/** Sugerencias para una página: las de su herramienta (si hay) y luego generales. */
export function suggestionsFor(index: Index, context: string | undefined, count = 4): KbEntry[] {
  const general = ['que-es', 'privacidad', 'precio', 'formatos', 'app-android', 'estudio'].map((id) => index.byId.get(id)).filter((e): e is KbEntry => !!e)
  const own = context ? index.docs.map((d) => d.entry).filter((e) => e.tool === context && e.id !== `tool:${context}`) : []
  return [...own, ...general].slice(0, count)
}
