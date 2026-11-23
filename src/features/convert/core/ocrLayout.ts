/**
 * PDF escaneado a Word y a Excel en un paso (W-147.3): el OCR local entrega cada palabra con su
 * caja en la imagen de la página; aquí se pasan a fragmentos de texto en puntos, como los que
 * pdf.js da de un PDF digital, para que PDF a Word arme párrafos y PDF a Excel arme columnas.
 */
import type { ImageFrag, TextFrag } from './pdfWord'

/** Una palabra reconocida y su caja en píxeles de la imagen. */
export type OcrWord = { text: string; x0: number; y0: number; x1: number; y1: number; confidence?: number }
/** Una línea reconocida: sus palabras, la altura de la línea y dónde está la línea base (en píxeles). */
export type OcrLine = { words: OcrWord[]; baseline: number; height: number }

/** Una página con menos de esta cantidad de letras se trata como escaneada (igual que en OCR). */
export const MIN_PAGE_CHARS = 25
/** Por debajo de esta confianza, una palabra suele ser ruido del escaneo (manchas, bordes). */
const MIN_WORD_CONFIDENCE = 30

/** Páginas (desde 0) sin texto digital: las que hay que reconocer con OCR. */
export function pagesWithoutText(pageCount: number, texts: readonly TextFrag[]): number[] {
  const chars = new Array<number>(pageCount).fill(0)
  for (const t of texts) if (t.page >= 0 && t.page < pageCount) chars[t.page] += t.str.replace(/\s/g, '').length
  return chars.flatMap((n, i) => (n < MIN_PAGE_CHARS ? [i] : []))
}

/**
 * Las palabras de una página reconocida como fragmentos de texto. `scale` pasa de píxeles de la
 * imagen a puntos de la página (72 / ppp con que se dibujó). El tamaño de letra sale de la altura
 * de la línea, y cada palabra queda en su lugar: así se respetan las columnas de una tabla.
 */
export function ocrLinesToFrags(lines: readonly OcrLine[], page: number, scale: number): TextFrag[] {
  const out: TextFrag[] = []
  for (const line of lines) {
    const size = Math.min(72, Math.max(6, Math.round(line.height * scale * 0.8 * 2) / 2))
    for (const w of line.words) {
      const str = w.text.trim()
      if (!str || (w.confidence !== undefined && w.confidence < MIN_WORD_CONFIDENCE)) continue
      out.push({ page, str, x: w.x0 * scale, y: line.baseline * scale, w: Math.max(1, (w.x1 - w.x0) * scale), size, bold: false, italic: false, family: 'sans' })
    }
  }
  return out
}

/**
 * Quita la foto del escaneo de las páginas reconocidas (la que cubre casi toda la página): su
 * texto ya va como texto, y dejarla duplicaría todo en el Word.
 */
export function dropPageScans(images: readonly ImageFrag[], pages: ReadonlyArray<{ width: number; height: number }>, recognized: ReadonlySet<number>): ImageFrag[] {
  return images.filter((img) => {
    if (!recognized.has(img.page)) return true
    const p = pages[img.page]
    return !p || (img.w * img.h) / (p.width * p.height) < 0.5
  })
}
