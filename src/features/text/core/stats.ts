/**
 * Contador de palabras y caracteres (W-113). Usa Intl.Segmenter cuando existe, que separa
 * bien las palabras también en japonés, chino o coreano (sin espacios) y cuenta un emoji o
 * una letra con tilde combinada como un solo carácter.
 */

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

const WORD_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu

/** Las palabras del texto, en orden (sin signos ni espacios). */
export function wordsOf(text: string, locale = 'es'): string[] {
  const seg = segmenter(locale, 'word')
  if (!seg) return text.match(WORD_RE) ?? []
  const out: string[] = []
  for (const s of seg.segment(text)) if (s.isWordLike) out.push(s.segment)
  return out
}

function graphemes(text: string, locale: string): string[] {
  const seg = segmenter(locale, 'grapheme')
  return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text)
}

function sentenceCount(text: string, locale: string): number {
  const seg = segmenter(locale, 'sentence')
  const parts = seg ? Array.from(seg.segment(text), (s) => s.segment) : text.split(/(?<=[.!?。！？])\s*/)
  return parts.filter((p) => /[\p{L}\p{N}]/u.test(p)).length
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
    if (Array.from(k).length < minLength || /^\p{N}+$/u.test(k)) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, percent: Math.round((count / words.length) * 1000) / 10 }))
}

/** En japonés, chino y coreano las palabras son cortas: se cuentan desde 2 caracteres. */
export const minWordLength = (lang: string) => (['ja', 'zh', 'ko'].includes(lang) ? 2 : 3)
