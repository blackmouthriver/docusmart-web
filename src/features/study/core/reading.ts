/**
 * Lectura por párrafos del Modo Estudio (W-60), como en la app: el texto se muestra
 * por párrafos y cada uno se lee en trozos cortos, porque Chrome corta en silencio
 * las frases largas (~15 s) y así además se puede pausar o cambiar la velocidad
 * sin perder la posición.
 */
import { ocrBaseFor, ocrLang, type OcrLang } from '../../ocr/core/ocrLangs'

/** `page`: página del PDF (desde 1) de la que sale el párrafo; sin PDF no hay página. */
export type Paragraph = { text: string; chunks: string[]; page?: number }

/** Largo máximo de cada trozo que se envía a la voz. */
export const MAX_CHUNK = 280

const ENDS_SENTENCE = /[.!?…:;]["'»”’)\]]*$/
const STARTS_UPPER = /^["'«“¿¡(]*\p{Lu}/u
const STARTS_ITEM = /^([-•*·–]\s|\d{1,3}[.)]\s|[a-z][.)]\s)/i

/**
 * Arma párrafos a partir del texto: bloques separados por una línea en blanco y, dentro
 * de cada bloque, une las líneas cortadas por el ancho de la página del PDF. Un párrafo
 * termina cuando la línea cierra una oración y es más corta que las del resto del
 * bloque, cuando es un título (línea corta y la siguiente empieza en mayúscula) o cuando
 * la siguiente empieza una lista.
 */
export function splitParagraphs(text: string): string[] {
  const out: string[] = []
  for (const block of text.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/)) {
    const lines = block
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    if (!lines.length) continue
    const widest = Math.max(...lines.map((l) => l.length))
    let current = ''
    lines.forEach((line, i) => {
      if (/\p{L}-$/u.test(current) && /^\p{Ll}/u.test(line)) current = current.slice(0, -1) + line
      else current = current ? `${current} ${line}` : line
      const next = lines[i + 1]
      const shortEnd = ENDS_SENTENCE.test(line) && line.length < widest * 0.8
      // Títulos: una línea corta, sin coma al final, seguida de otra que empieza en mayúscula.
      const heading = !!next && line.length < widest * 0.6 && !/[,;\-–]$/.test(line) && STARTS_UPPER.test(next)
      if (!next || shortEnd || heading || STARTS_ITEM.test(next)) {
        out.push(current)
        current = ''
      }
    })
  }
  return out
}

/** Divide un párrafo en trozos de hasta `max` caracteres, cortando por oraciones, luego por comas y, si no queda otra, por espacios. */
export function chunkParagraph(text: string, max = MAX_CHUNK): string[] {
  if (text.length <= max) return [text]
  const pieces = text.split(/(?<=[.!?…;:])\s+/)
  const chunks: string[] = []
  let current = ''
  const push = (piece: string) => {
    if (piece.length > max) {
      if (current) chunks.push(current)
      current = ''
      for (const part of splitLong(piece, max)) chunks.push(part)
      return
    }
    if (current && current.length + 1 + piece.length > max) {
      chunks.push(current)
      current = piece
    } else current = current ? `${current} ${piece}` : piece
  }
  pieces.forEach(push)
  if (current) chunks.push(current)
  return chunks
}

function splitLong(text: string, max: number): string[] {
  const out: string[] = []
  let current = ''
  for (const word of text.split(/(?<=,)\s+|\s+/)) {
    if (current && current.length + 1 + word.length > max) {
      out.push(current)
      current = word
    } else current = current ? `${current} ${word}` : word
  }
  if (current) out.push(current)
  return out
}

export const toParagraphs = (text: string): Paragraph[] => splitParagraphs(text).map((p) => ({ text: p, chunks: chunkParagraph(p) }))

/** Párrafos de un PDF, cada uno con la página de la que sale (W-60b). */
export const toPagedParagraphs = (pages: readonly string[]): Paragraph[] =>
  pages.flatMap((text, i) => toParagraphs(text).map((p) => ({ ...p, page: i + 1 })))

/** Primer párrafo de una página (o del siguiente con texto); -1 si no queda ninguno. */
export const firstParagraphOfPage = (paragraphs: readonly Paragraph[], page: number) => paragraphs.findIndex((p) => (p.page ?? 0) >= page)

/**
 * Avance por páginas, como en la app: la página que se lee todavía no cuenta como leída;
 * al terminar se cuentan todas.
 */
export function pageProgress(currentPage: number, totalPages: number, finished: boolean): { read: number; percent: number } {
  if (totalPages <= 0) return { read: 0, percent: 0 }
  const read = finished ? totalPages : Math.min(totalPages, Math.max(0, currentPage - 1))
  return { read, percent: Math.floor((read / totalPages) * 100) }
}

/** Porcentaje escuchado: párrafos ya leídos sobre el total (100 al terminar). */
export function listenedPercent(paragraph: number, total: number, finished: boolean): number {
  if (finished) return 100
  if (total <= 0 || paragraph < 0) return 0
  return Math.min(100, Math.floor((paragraph / total) * 100))
}

/** Siguiente posición de lectura: el próximo trozo del párrafo o el primero del siguiente; null al terminar. */
export function nextPosition(paragraphs: readonly Paragraph[], p: number, c: number): { p: number; c: number } | null {
  if (c + 1 < (paragraphs[p]?.chunks.length ?? 0)) return { p, c: c + 1 }
  return p + 1 < paragraphs.length ? { p: p + 1, c: 0 } : null
}

/**
 * ¿El PDF parece escaneado? (W-61) Casi sin letras para su cantidad de páginas: en ese
 * caso se ofrece reconocer el texto con OCR en vez de decir "sin texto".
 */
export function needsOcr(pages: readonly string[]): boolean {
  if (!pages.length) return false
  const letters = pages.join('').match(/\p{L}/gu)?.length ?? 0
  return letters < Math.max(30, pages.length * 20)
}

/** Idioma del OCR según el de la web; con inglés además (los documentos suelen mezclarlo), salvo en inglés. */
export const ocrLangFor = (lang: string): OcrLang => ocrLang(ocrBaseFor(lang), lang !== 'en')
