/**
 * Contador de palabras y caracteres (W-113). Usa Intl.Segmenter cuando existe, que separa
 * bien las palabras también en japonés, chino o coreano (sin espacios) y cuenta un emoji o
 * una letra con tilde combinada como un solo carácter.
 *
 * Auditoría W-146.12: cuenta como Word y Google Docs (un enlace, un correo y una palabra con
 * guion son una palabra; "Sr." no corta la oración), mide el nivel de lectura y los límites
 * de caracteres más comunes.
 */
import { ABBREVIATIONS } from '../../study/core/summarize'

export type TextStats = {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  /** Minutos de lectura (200 palabras por minuto) y en voz alta (130). */
  readingMinutes: number
  speakingMinutes: number
}

export const READING_WPM = 200
export const SPEAKING_WPM = 130

type Granularity = 'grapheme' | 'word' | 'sentence'
const segmenter = (locale: string, granularity: Granularity) => (typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(locale, { granularity }) : null)

const WORD_RE = /[\p{L}\p{N}]+(?:['’\-‐][\p{L}\p{N}]+)*/gu
/**
 * Enlaces (con http, https o www) y correos: cada uno es una sola palabra. Se buscan recorriendo
 * los trozos sin espacios (tiempo lineal, sin expresiones con retroceso; SonarCloud S8786).
 */
const LEADING = new Set('(["\'«“¿¡<')
const TRAILING = new Set('.,;:!?)]}"\'’»”>')
const EMAIL_PART = /^[\p{L}\p{N}._%+-]+$/u
const DOMAIN_PART = /^[\p{L}\p{N}-]+$/u

/** ¿El trozo (ya sin puntuación alrededor) es un enlace o un correo? */
export function isLink(token: string): boolean {
  const t = token.toLowerCase()
  if (t.startsWith('http://') || t.startsWith('https://')) return t.length > t.indexOf('//') + 2
  if (t.startsWith('www.')) return t.length > 4
  const at = token.indexOf('@')
  if (at <= 0 || at !== token.lastIndexOf('@')) return false
  const domain = token.slice(at + 1).split('.')
  return EMAIL_PART.test(token.slice(0, at)) && domain.length >= 2 && domain.every((d) => DOMAIN_PART.test(d)) && /^\p{L}{2,}$/u.test(domain[domain.length - 1])
}

type Span = { start: number; end: number }
/** Posición de cada enlace o correo del texto, sin la puntuación que lo rodea. */
function linkSpans(text: string): Span[] {
  const spans: Span[] = []
  for (const m of text.matchAll(/\S+/g)) {
    let start = m.index
    let end = m.index + m[0].length
    while (start < end && LEADING.has(text[start])) start++
    while (end > start && TRAILING.has(text[end - 1])) end--
    if (end > start && isLink(text.slice(start, end))) spans.push({ start, end })
  }
  return spans
}
/** Reemplaza cada enlace o correo (la puntuación de alrededor se queda: un punto sigue cerrando la oración). */
function replaceLinks(text: string, by: string): string {
  let out = ''
  let last = 0
  for (const { start, end } of linkSpans(text)) {
    out += text.slice(last, start) + by
    last = end
  }
  return out + text.slice(last)
}
const HYPHENS = new Set(['-', '‐', '‑'])

/** Palabras de un trozo sin enlaces: las que el segmentador separa, unidas por guiones internos. */
function plainWords(text: string, locale: string): string[] {
  const seg = segmenter(locale, 'word')
  if (!seg) return text.match(WORD_RE) ?? []
  const out: string[] = []
  // "bien-estar": palabra, guion y palabra pegados se cuentan como una sola.
  let joinNext = false
  let prevWord = false
  for (const s of seg.segment(text)) {
    if (s.isWordLike) {
      if (joinNext && out.length) out[out.length - 1] += '-' + s.segment
      else out.push(s.segment)
      joinNext = false
      prevWord = true
    } else {
      joinNext = prevWord && HYPHENS.has(s.segment)
      prevWord = false
    }
  }
  return out
}

/** Las palabras del texto, en orden (sin signos ni espacios). */
export function wordsOf(text: string, locale = 'es'): string[] {
  const out: string[] = []
  let last = 0
  for (const { start, end } of linkSpans(text)) {
    out.push(...plainWords(text.slice(last, start), locale), text.slice(start, end))
    last = end
  }
  out.push(...plainWords(text.slice(last), locale))
  return out
}

function graphemes(text: string, locale: string): string[] {
  const seg = segmenter(locale, 'grapheme')
  return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text)
}

function sentenceCount(text: string, locale: string): number {
  // Los puntos de los enlaces y correos no cortan la oración.
  const plain = replaceLinks(text, 'x')
  const seg = segmenter(locale, 'sentence')
  const parts = seg ? Array.from(seg.segment(plain), (s) => s.segment) : plain.split(/(?<=[.!?。！？])\s*/)
  // Una abreviatura ("Sr.", "Dra.") o una inicial ("J. García") no termina la oración.
  const joined: string[] = []
  for (const p of parts) {
    const prev = joined[joined.length - 1]?.trimEnd()
    if (prev !== undefined && (ABBREVIATIONS.test(prev) || /(?:^|\s)\p{Lu}\.$/u.test(prev))) joined[joined.length - 1] += p
    else joined.push(p)
  }
  return joined.filter((p) => /[\p{L}\p{N}]/u.test(p)).length
}

export function textStats(text: string, locale = 'es'): TextStats {
  const g = graphemes(text, locale)
  const words = wordsOf(text, locale).length
  return {
    characters: g.length,
    charactersNoSpaces: g.filter((c) => !/^\s+$/.test(c)).length,
    words,
    sentences: sentenceCount(text, locale),
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    readingMinutes: words / READING_WPM,
    speakingMinutes: words / SPEAKING_WPM,
  }
}

/** 2.5 → { minutes: 2, seconds: 30 }. */
export function durationParts(minutes: number): { minutes: number; seconds: number } {
  const total = Math.round(minutes * 60)
  return { minutes: Math.floor(total / 60), seconds: total % 60 }
}

export type WordCount = { word: string; count: number; percent: number }

/**
 * Las palabras que más se repiten (densidad de palabras clave), en minúsculas. Se omiten las
 * muy cortas (artículos y preposiciones) y los números.
 */
export function topWords(text: string, locale = 'es', limit = 10, minLength = 3): WordCount[] {
  const words = wordsOf(text, locale)
  if (!words.length) return []
  const counts = new Map<string, number>()
  for (const w of words) {
    const k = w.toLocaleLowerCase(locale)
    if (Array.from(k).length < minLength || /^\p{N}+$/u.test(k) || isLink(w)) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, percent: Math.round((count / words.length) * 1000) / 10 }))
}

/** En japonés, chino y coreano las palabras son cortas: se cuentan desde 2 caracteres. */
export const minWordLength = (lang: string) => (['ja', 'zh', 'ko'].includes(lang) ? 2 : 3)

/* ───────────── Nivel de lectura ───────────── */

const STRONG = new Set('aeoáéíóúàèìòùâêîôû')
const VOWELS = new Set('aeiouáéíóúüàèìòùâêîôûëïöäy')

/**
 * Sílabas de una palabra en español (y aproximadas en las demás lenguas romances): cada grupo
 * de vocales es una sílaba, salvo dos vocales fuertes seguidas (hiato: "le-er") o una débil
 * con tilde ("dí-a"). La "y" final cuenta como vocal solo si no hay otra ("y", "muy" = 1).
 */
export function syllablesEs(word: string): number {
  const w = word.toLowerCase().replace(/[^\p{L}]/gu, '')
  let count = 0
  let prev = ''
  for (let i = 0; i < w.length; i++) {
    const c = w[i]
    const vowel = c !== 'y' ? VOWELS.has(c) : i === w.length - 1 && !VOWELS.has(prev)
    if (!vowel) {
      prev = c
      continue
    }
    const prevVowel = prev !== '' && prev !== 'y' && VOWELS.has(prev)
    if (!prevVowel || (STRONG.has(c) && STRONG.has(prev))) count++
    prev = c
  }
  return Math.max(1, count)
}

/** Sílabas en inglés (heurística habitual): grupos de vocales, sin la "e" muda final. */
export function syllablesEn(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 1
  if (w.length > 3) w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, '')
  return Math.max(1, (w.match(/[aeiouy]+/g) ?? []).length)
}

/** Germánicas (alemán): grupos de vocales. */
const syllablesGroups = (word: string) => Math.max(1, (word.toLowerCase().match(/[aeiouyäöüáéíóúàèìòù]+/g) ?? []).length)

export type ReadingLevel = 'veryEasy' | 'easy' | 'fairlyEasy' | 'standard' | 'fairlyHard' | 'hard' | 'veryHard'
export type Readability = { score: number; level: ReadingLevel; formula: string }

/**
 * Fórmulas de legibilidad por idioma (0 = muy difícil, 100 = muy fácil). `asl`: palabras por
 * oración; `asw`: sílabas por palabra.
 */
const FORMULAS: Record<string, { name: string; syllables: (w: string) => number; score: (asl: number, asw: number) => number }> = {
  // Fernández Huerta (1959), con la corrección de Law (2011): P y F por cada 100 palabras.
  es: { name: 'Fernández Huerta', syllables: syllablesEs, score: (asl, asw) => 206.84 - 60 * asw - 102 / asl },
  ca: { name: 'Fernández Huerta', syllables: syllablesEs, score: (asl, asw) => 206.84 - 60 * asw - 102 / asl },
  en: { name: 'Flesch', syllables: syllablesEn, score: (asl, asw) => 206.835 - 1.015 * asl - 84.6 * asw },
  pt: { name: 'Flesch (Martins)', syllables: syllablesEs, score: (asl, asw) => 248.835 - 1.015 * asl - 84.6 * asw },
  fr: { name: 'Kandel y Moles', syllables: syllablesGroups, score: (asl, asw) => 207 - 1.015 * asl - 73.6 * asw },
  it: { name: 'Flesch-Vacca', syllables: syllablesEs, score: (asl, asw) => 217 - 1.3 * asl - 60 * asw },
  de: { name: 'Amstad', syllables: syllablesGroups, score: (asl, asw) => 180 - asl - 58.5 * asw },
}
/** Con menos palabras el puntaje no dice mucho. */
export const MIN_READABILITY_WORDS = 20

export const hasReadability = (lang: string) => lang in FORMULAS

/** Nivel de lectura del texto, o null si el idioma no tiene fórmula o el texto es muy corto. */
export function readability(text: string, lang: string): Readability | null {
  const f = FORMULAS[lang]
  if (!f) return null
  const words = wordsOf(replaceLinks(text, ' '), lang).filter((w) => /\p{L}/u.test(w))
  if (words.length < MIN_READABILITY_WORDS) return null
  const sentences = Math.max(1, sentenceCount(text, lang))
  const syllables = words.reduce((n, w) => n + f.syllables(w), 0)
  const score = Math.round(Math.min(100, Math.max(0, f.score(words.length / sentences, syllables / words.length))))
  return { score, level: readingLevel(score), formula: f.name }
}

export function readingLevel(score: number): ReadingLevel {
  if (score >= 90) return 'veryEasy'
  if (score >= 80) return 'easy'
  if (score >= 70) return 'fairlyEasy'
  if (score >= 60) return 'standard'
  if (score >= 50) return 'fairlyHard'
  if (score >= 30) return 'hard'
  return 'veryHard'
}

/* ───────────── Límites de caracteres ───────────── */

export type CharLimit = { id: 'x' | 'sms' | 'seoTitle' | 'seoDesc' | 'instagram'; max: number }
/** Límites que más se consultan al escribir: X (Twitter), SMS, título y descripción para buscadores e Instagram. */
export const CHAR_LIMITS: readonly CharLimit[] = [
  { id: 'x', max: 280 },
  { id: 'sms', max: 160 },
  { id: 'seoTitle', max: 60 },
  { id: 'seoDesc', max: 160 },
  { id: 'instagram', max: 2200 },
]
