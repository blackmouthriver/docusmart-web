/**
 * Resumen local del Modo Estudio (W-64), port de TextSummarizer de la app: 100 % en el
 * navegador, sin IA en la nube. Es extractivo: elige las oraciones del propio documento
 * cuyas palabras significativas son más frecuentes (variante simple de Luhn) y las
 * devuelve en el orden original para que se lean como un resumen coherente.
 *
 * Mejora de la web: detecta el idioma del documento y descarta las palabras vacías de
 * los 12 idiomas de la app (la app solo tenía español e inglés). En chino y japonés,
 * que no separan palabras con espacios, se cuentan pares de caracteres.
 *
 * Resumir PDF (W-142) suma: centralidad tipo TextRank (las oraciones que más se parecen al
 * resto son las que mejor representan el documento), un poco de peso a las primeras
 * oraciones, abreviaturas que no cortan la oración, tres largos y palabras clave.
 */

const TARGET_FRACTION = 0.12
const MIN_SENTENCES = 5
export const MAX_SENTENCES = 15
const MIN_SENTENCE_LENGTH = 15
const MIN_SENTENCE_LENGTH_CJK = 6
const MIN_WORD_LENGTH = 3

const words = (s: string) => s.split(/\s+/).filter(Boolean)
const STOPWORDS: Record<string, Set<string>> = {
  es: new Set(words('de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros es son fue ser ha han había era está están puede pueden cada tiene tienen')),
  en: new Set(words('the and for with that this these those from have has had will would can could should does did his her their our your which whom what when where why how all each other some such nor only own same than too very just was were been being not are its into about also there then them they you she him who any more most')),
  pt: new Set(words('o a os as e do da em de que não uma para com por mais como mas foi ele das tem seu sua ser quando muito nos já está eu também pelo pela até isso ela entre era depois sem mesmo aos ter seus quem nas esse eles estão você tinha foram essa num nem suas meu minha numa pelos elas havia seja qual será nós tenho lhe deles essas esses pelas este fosse dele são pode podem cada')),
  fr: new Set(words('le la de et du au en un les des est une que dans qui pour pas par sur plus avec son ses aux ont été être cette mais comme sont nous vous leur leurs elle elles ils ont aussi tout tous fait peut sans entre très même dont alors ces cet ainsi encore donc après avant chez sous lui avait était')),
  it: new Set(words('il lo la di e che per non una sono della delle dei degli del con come anche più dalla dalle nella nelle nel questo questa quello quella essere stato stata hanno aveva erano può sua suo suoi sue loro tra fra molto tutto tutti dopo prima senza ogni quando dove anche alla alle agli')),
  de: new Set(words('der die das und ist den dem des ein eine einer eines einem einen nicht mit sich auf für von zu im in an auch als aus bei nach wie wird werden wurde wurden sind war hat haben oder aber noch nur schon über um vor sie er es wir ihr ihre ihren seine seiner kann können dass diese dieser dieses durch zum zur')),
  ca: new Set(words('el la els les de i que per una els les del amb com més són està han pel als seu seva seus seves però també quan molt tot tots ser era fou entre sense sobre fins això aquest aquesta aquests aquestes ells elles cada pot poden després abans perquè')),
  eu: new Set(words('eta bat edo baina ere izan da dira zen ziren du dute zuen hau hori hura honek horrek dela dute egin oso beste bere haien gure zure ditu bezala gabe arte baino nahiz ezin daiteke behar')),
  ru: new Set(words('и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это также')),
  ko: new Set(words('그리고 그러나 하지만 그래서 또는 및 등 이 그 저 것 수 있다 있는 없는 하는 하고 한다 했다 에서 으로 에게 의 를 을 는 은 가 이다 입니다 합니다 됩니다 그것 이것 저것 때문에 위해 대한 통해')),
}

/** Idioma del texto: por la escritura (chino, japonés, coreano, ruso) o, si es latino, por sus palabras vacías. */
export function detectLanguage(text: string): string {
  const sample = text.slice(0, 4000)
  const count = (re: RegExp) => (sample.match(re) ?? []).length
  const letters = Math.max(1, count(/\p{L}/gu))
  if (count(/[぀-ヿ]/g) / letters > 0.05) return 'ja'
  if (count(/\p{Script=Han}/gu) / letters > 0.3) return 'zh'
  if (count(/\p{Script=Hangul}/gu) / letters > 0.3) return 'ko'
  if (count(/\p{Script=Cyrillic}/gu) / letters > 0.3) return 'ru'
  const tokens = sample.toLowerCase().match(/\p{L}+/gu) ?? []
  let best = 'en'
  let bestHits = 0
  for (const lang of ['es', 'en', 'pt', 'fr', 'it', 'de', 'ca', 'eu']) {
    const hits = tokens.filter((t) => STOPWORDS[lang].has(t)).length
    if (hits > bestHits) {
      best = lang
      bestHits = hits
    }
  }
  return best
}

const isCjk = (lang: string) => lang === 'zh' || lang === 'ja'

/** Abreviaturas comunes que terminan en punto sin cerrar la oración ("Sr. Pérez", "p. ej. esto"). */
const ABBREVIATIONS = /(?:^|\s)(?:sr|sra|srta|dr|dra|lic|ing|prof|arq|av|art|núm|nro|pág|págs|cap|vol|ej|aprox|tel|cía|ltda|mr|mrs|ms|st|vs|fig|inc|jr|e\.g|i\.e|p\. ej|z\.b|bzw|usw|ggf|ca|mme|mlle)\.$/i

/** Oraciones del texto: corta tras . ! ? (seguido de mayúscula, cifra o comilla) y tras 。！？ sin espacio. */
export function splitSentences(text: string, lang = 'es'): string[] {
  const min = isCjk(lang) ? MIN_SENTENCE_LENGTH_CJK : MIN_SENTENCE_LENGTH
  const parts = text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=["'«“¿¡(\p{Lu}\d])|(?<=[。！？])/u)
  // Una abreviatura o una inicial ("J. García") no termina la oración: se une con lo que sigue.
  const joined: string[] = []
  for (const p of parts) {
    const last = joined[joined.length - 1]
    if (last !== undefined && (ABBREVIATIONS.test(last) || /(?:^|\s)\p{Lu}\.$/u.test(last))) joined[joined.length - 1] = last + ' ' + p
    else joined.push(p)
  }
  return joined.map((s) => s.trim()).filter((s) => s.length >= min)
}

/** Palabras que cuentan para puntuar una oración. */
export function significantTerms(sentence: string, lang: string): string[] {
  const lower = sentence.toLowerCase()
  if (isCjk(lang)) {
    const out: string[] = []
    for (const run of lower.match(/[\p{Script=Han}぀-ヿ]+/gu) ?? []) {
      const chars = [...run]
      for (let i = 0; i + 1 < chars.length; i++) out.push(chars[i] + chars[i + 1])
    }
    return out
  }
  const stop = STOPWORDS[lang] ?? STOPWORDS.en
  const minLength = lang === 'ko' ? 2 : MIN_WORD_LENGTH
  return (lower.match(/\p{L}+/gu) ?? []).filter((w) => w.length >= minLength && !stop.has(w))
}

/** `indices`: posición de cada oración elegida entre todas; `keywords`: términos más representativos. */
export type Summary = { sentences: string[]; total: number; lang: string; indices: number[]; keywords: string[] }

/** Largo del resumen: fracción de las oraciones y mínimo y máximo de oraciones. */
export type SummaryLength = 'short' | 'medium' | 'long'
const LENGTHS: Record<SummaryLength, { fraction: number; min: number; max: number }> = {
  short: { fraction: 0.06, min: 3, max: 7 },
  medium: { fraction: TARGET_FRACTION, min: MIN_SENTENCES, max: MAX_SENTENCES },
  long: { fraction: 0.22, min: 8, max: 30 },
}
/** Con más oraciones que esto no se calcula la centralidad (sería lenta) y se usa solo la frecuencia. */
const MAX_TEXTRANK = 1500

/** Palabras clave: los términos significativos más frecuentes que aparecen en varias oraciones. */
export function keywords(tokenized: readonly string[][], n = 8): string[] {
  const freq = new Map<string, number>()
  const spread = new Map<string, number>()
  for (const terms of tokenized) {
    for (const t of terms) freq.set(t, (freq.get(t) ?? 0) + 1)
    for (const t of new Set(terms)) spread.set(t, (spread.get(t) ?? 0) + 1)
  }
  return [...freq.keys()]
    .filter((t) => (spread.get(t) ?? 0) >= 2)
    .sort((a, b) => freq.get(b)! * Math.log(1 + spread.get(b)!) - freq.get(a)! * Math.log(1 + spread.get(a)!) || a.localeCompare(b))
    .slice(0, n)
}

/** Centralidad de cada oración (TextRank): cuánto se parece al resto, propagado como en PageRank. */
export function centrality(sets: readonly ReadonlySet<string>[], iterations = 30, damping = 0.85): number[] {
  const n = sets.length
  const weights: number[][] = sets.map(() => [])
  const totals = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const w = similarity(sets[i], sets[j])
      if (w > 0 && sets[i].size && sets[j].size) {
        weights[i][j] = w
        weights[j][i] = w
        totals[i] += w
        totals[j] += w
      }
    }
  let rank = new Array<number>(n).fill(1)
  for (let k = 0; k < iterations; k++) {
    const next = new Array<number>(n).fill(1 - damping)
    for (let i = 0; i < n; i++)
      for (const j in weights[i]) {
        const jj = Number(j)
        if (totals[jj]) next[i] += (damping * weights[i][jj] * rank[jj]) / totals[jj]
      }
    rank = next
  }
  return rank
}

/**
 * Resumen del texto: por defecto entre 5 y 15 oraciones (12 % del total), en su orden original.
 * Si el documento ya es corto, lo devuelve completo: no tiene sentido resumir 3 oraciones.
 */
export function summarize(text: string, opts: { lang?: string; maxSentences?: number; length?: SummaryLength } = {}): Summary {
  const lang = opts.lang ?? detectLanguage(text)
  const sentences = splitSentences(text, lang)
  const size = LENGTHS[opts.length ?? 'medium']
  const upper = Math.min(opts.maxSentences ?? size.max, sentences.length)
  const lower = Math.min(size.min, upper)
  const target = Math.min(upper, Math.max(lower, Math.floor(sentences.length * size.fraction)))
  const tokenized = sentences.map((s) => significantTerms(s, lang))
  const kw = keywords(tokenized)
  if (!sentences.length || sentences.length <= target) return { sentences, total: sentences.length, lang, indices: sentences.map((_, i) => i), keywords: kw }

  const frequency = new Map<string, number>()
  for (const terms of tokenized) for (const t of terms) frequency.set(t, (frequency.get(t) ?? 0) + 1)
  const luhn = (i: number) => {
    const terms = tokenized[i]
    return terms.length ? terms.reduce((sum, t) => sum + (frequency.get(t) ?? 0), 0) / terms.length : 0
  }
  // Mejora de la web: una oración casi igual a otra ya elegida (p. ej. un repaso) se salta.
  const sets = tokenized.map((t) => new Set(t))
  // Puntaje: frecuencia (Luhn) + centralidad (TextRank) + un poco de peso a las primeras oraciones.
  const lu = sentences.map((_, i) => luhn(i))
  const ranks = sentences.length <= MAX_TEXTRANK ? centrality(sets) : null
  const maxLu = Math.max(...lu) || 1
  const maxRank = ranks ? Math.max(...ranks) || 1 : 1
  const lead = Math.max(1, Math.ceil(sentences.length * 0.1))
  const scores = sentences.map((_, i) => (ranks ? 0.55 * (lu[i] / maxLu) + 0.35 * (ranks[i] / maxRank) : 0.9 * (lu[i] / maxLu)) + (i < lead ? 0.1 * (1 - i / lead) : 0))
  const score = (i: number) => scores[i]
  const ranked = sentences.map((_, i) => i).sort((a, b) => score(b) - score(a) || a - b)
  const chosen: number[] = []
  // Solo entre las oraciones bien puntuadas: saltar repetidas nunca debe colar algo fuera de tema.
  const floor = score(ranked[0]) * 0.5
  for (const i of ranked) {
    if (chosen.length >= target || score(i) < floor) break
    if (!chosen.some((j) => similarity(sets[i], sets[j]) >= NEAR_DUPLICATE)) chosen.push(i)
  }
  // Si quitar casi duplicados dejó muy pocas oraciones, se completa con las siguientes.
  for (const i of ranked) {
    if (chosen.length >= target) break
    if (!chosen.includes(i)) chosen.push(i)
  }
  chosen.sort((a, b) => a - b)
  return { sentences: chosen.map((i) => sentences[i]), total: sentences.length, lang, indices: chosen, keywords: kw }
}

/** Parecido entre dos oraciones (Jaccard de sus palabras significativas): 1 = mismas palabras. */
export function similarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (!a.size && !b.size) return 1
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return shared / (a.size + b.size - shared)
}
const NEAR_DUPLICATE = 0.7
