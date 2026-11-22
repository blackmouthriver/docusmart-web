/** Herramientas PDF con pdf-lib: mismas operaciones que la pestaña PDF de la app. */
import { PDFDocument, degrees } from 'pdf-lib'
import { mergePdfs } from './pdfMerge'
import { watermarkPdf } from './pdfWatermark'

export { numberPages, NUMBER_POSITIONS, DEFAULT_NUMBER_OPTIONS, type NumberOptions, type NumberPosition } from './pdfNumber'
export { mergePdfs, type MergeInput, type MergeOptions } from './pdfMerge'
export { watermarkPdf, DEFAULT_WATERMARK, WATERMARK_POSITIONS, type WatermarkOptions, type WatermarkPosition, type WatermarkSize } from './pdfWatermark'

const load = (bytes: ArrayBuffer | Uint8Array) => PDFDocument.load(bytes, { ignoreEncryption: false })

export async function pageCount(bytes: ArrayBuffer): Promise<number> {
  return (await load(bytes)).getPageCount()
}

/** Une varios PDF en uno, conservando formularios, marcadores y título (ver pdfMerge). */
export const merge = (files: ArrayBuffer[]): Promise<Uint8Array> => mergePdfs(files.map((bytes) => ({ bytes })))

/** Un PDF nuevo con solo las páginas indicadas (base 0), en ese orden. */
export async function extractPages(bytes: ArrayBuffer, indices: number[]): Promise<Uint8Array> {
  const src = await load(bytes)
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  pages.forEach((p) => out.addPage(p))
  return out.save()
}

/** Cada página como un PDF independiente. */
export async function splitEach(bytes: ArrayBuffer): Promise<Uint8Array[]> {
  const src = await load(bytes)
  const result: Uint8Array[] = []
  for (const i of src.getPageIndices()) {
    const out = await PDFDocument.create()
    const [p] = await out.copyPages(src, [i])
    out.addPage(p)
    result.push(await out.save())
  }
  return result
}

/** Varios PDF, uno por grupo de páginas (base 0), en el orden de cada grupo. */
export async function splitGroups(bytes: ArrayBuffer, groups: number[][]): Promise<Uint8Array[]> {
  const src = await load(bytes)
  const result: Uint8Array[] = []
  for (const group of groups) {
    const out = await PDFDocument.create()
    const pages = await out.copyPages(src, group)
    pages.forEach((p) => out.addPage(p))
    result.push(await out.save())
  }
  return result
}

/** Una hoja del nuevo orden: una página del original (base 0) o una hoja en blanco. */
export type Sheet = number | 'blank'

/**
 * Arma un PDF con las páginas en el orden dado, que puede repetir páginas (duplicar) e
 * incluir hojas en blanco del mismo tamaño que la página anterior (o la siguiente).
 */
export async function composePages(bytes: ArrayBuffer, sheets: Sheet[]): Promise<Uint8Array> {
  const src = await load(bytes)
  const out = await PDFDocument.create()
  const used = [...new Set(sheets.filter((s): s is number => s !== 'blank'))]
  const copies = new Map(used.map((idx, i) => [idx, i]))
  const copied = await out.copyPages(src, used)
  const sizeNear = (pos: number): [number, number] => {
    for (let d = 1; d < sheets.length; d++)
      for (const j of [pos - d, pos + d]) {
        const s = sheets[j]
        if (typeof s === 'number') {
          const { width, height } = src.getPage(s).getSize()
          return [width, height]
        }
      }
    return [595.28, 841.89] // A4
  }
  const placed = new Set<number>()
  for (const [pos, s] of sheets.entries()) {
    if (s === 'blank') {
      out.addPage(sizeNear(pos))
    } else if (!placed.has(s)) {
      placed.add(s)
      out.addPage(copied[copies.get(s)!])
    } else {
      // Una página repetida necesita su propia copia.
      const [again] = await out.copyPages(src, [s])
      out.addPage(again)
    }
  }
  return out.save()
}

/** Rota las páginas indicadas (base 0) sumando `angle` a su rotación actual. */
export async function rotate(bytes: ArrayBuffer, indices: number[], angle: 90 | 180 | 270): Promise<Uint8Array> {
  const doc = await load(bytes)
  for (const i of indices) {
    const page = doc.getPage(i)
    page.setRotation(degrees((page.getRotation().angle + angle) % 360))
  }
  return doc.save()
}

// Las fuentes estándar de PDF solo cubren WinAnsi (latín): se descarta lo demás.
export const sanitizeWinAnsi = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '').trim()

/** Marca de agua de texto con las opciones por defecto (ver pdfWatermark para todas). */
export const watermark = (bytes: ArrayBuffer, text: string, opacity = 0.18): Promise<Uint8Array> => watermarkPdf(bytes, { text, opacity })
