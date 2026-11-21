/**
 * Imagen a texto (W-108): reglas puras para unir el texto reconocido de varias imágenes,
 * armar párrafos para Word y nombrar los archivos. El reconocimiento lo hace ocr.ts (Tesseract).
 */
import type { WordDoc } from '../../convert/core/pdfWord'

// HEIC, AVIF, TIFF y SVG también, por extensión (algunos sistemas no les ponen tipo).
export const IMAGE_OCR_ACCEPT = 'image/*,.heic,.heif,.avif,.tif,.tiff,.svg'

export type ImageText = { name: string; text: string }

/**
 * Une el texto de varias imágenes. Con `withNames`, cada bloque lleva el nombre de su imagen
 * como título; las imágenes sin texto se omiten.
 */
export function combineTexts(items: ImageText[], withNames: boolean): string {
  const filled = items.filter((i) => i.text.trim())
  if (filled.length <= 1 || !withNames) return filled.map((i) => i.text.trim()).join('\n\n')
  return filled.map((i) => `${i.name}\n${i.text.trim()}`).join('\n\n')
}

const LIST_ITEM = /^\s*([-•*–·]|\d{1,3}[.)]|[a-zA-Z][.)])\s+/

/**
 * Convierte el texto del OCR (que corta las líneas donde las corta la imagen) en párrafos:
 * une las líneas de un mismo bloque, repara palabras partidas con guion al final de línea
 * y deja las viñetas y numeraciones en líneas propias.
 */
export function toParagraphs(text: string): string[] {
  const out: string[] = []
  for (const block of text.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    let current = ''
    for (const raw of block.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (LIST_ITEM.test(line) && current) {
        out.push(current)
        current = line
      } else if (!current) current = line
      else if (/[A-Za-zÀ-ÿ]-$/.test(current)) current = current.slice(0, -1) + line
      else current += ' ' + line
    }
    if (current) out.push(current)
  }
  return out
}

/** Documento de Word con el texto en párrafos (A4, márgenes de 2,5 cm). */
export function textWordDoc(text: string): WordDoc {
  const blocks = toParagraphs(text).map((p) => ({
    kind: 'para' as const,
    runs: [{ text: p, bold: false, italic: false, size: 11, family: 'sans' as const }],
    align: 'left' as const,
    heading: 0 as const,
    bullet: false,
    indent: 0,
  }))
  return { blocks, page: { width: 595, height: 842 }, margins: { top: 71, right: 71, bottom: 71, left: 71 }, bodySize: 11, bodyFamily: 'sans', bodyFont: 'Calibri' }
}

/** Nombre base del resultado: el de la imagen si es una, o el sufijo genérico si son varias. */
export function textFileBase(names: string[], generic: string): string {
  if (names.length === 1) return (names[0].replace(/\.[^./\\]+$/, '').trim() || generic) + '-' + generic
  return generic
}

/** Nombre para una imagen pegada desde el portapapeles: "captura-1.png", "captura-2.png"… */
export function pastedName(base: string, n: number, type: string): string {
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '') || 'png'
  return `${base}-${n}.${ext}`
}
