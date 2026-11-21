/**
 * Editar PDF: agrega texto, imágenes y formas sobre las páginas, como capas
 * nuevas. Las posiciones son fracciones (0 a 1) de la página tal como se ve,
 * igual que en Firmar y Censurar. La capa "erase" (Reemplazar texto, W-140) sí
 * quita del contenido de la página el texto original que cae dentro de ella.
 */
import { PDFDocument, degrees, rgb, type PDFImage } from 'pdf-lib'
import { drawPieces, fontsForText, wrapPieces, type FontFamily, type FontSet } from '../../../shared/pdf/pdfFonts'
import { viewToPdf } from './pdfSign'
import { eraseText, type Zone } from './pdfContent'

export type FontName = 'helvetica' | 'times' | 'courier'
/**
 * `width`: ancho del párrafo (fracción de la página) para cortar las líneas largas, como un
 * párrafo reemplazado; `lineHeight`: interlineado en tamaños de letra (sin él, 1.2).
 */
export type TextItem = { kind: 'text'; page: number; x: number; y: number; text: string; size: number; color: string; font: FontName; bold: boolean; width?: number; lineHeight?: number }
/** `erase`: borra el texto original de la zona (si no lo encuentra, la tapa con `fill` o blanco). */
export type BoxKind = 'rect' | 'ellipse' | 'highlight' | 'whiteout' | 'erase'
export type BoxItem = { kind: BoxKind; page: number; x: number; y: number; w: number; h: number; stroke: string | null; fill: string | null; strokeWidth: number }
export type ImageItem = { kind: 'image'; page: number; x: number; y: number; w: number; h: number; data: Uint8Array; format: 'png' | 'jpg' }
export type EditItem = TextItem | BoxItem | ImageItem

/** Distancia del borde superior de la caja a la línea base, en tamaños de letra (igual que el navegador con line-height 1.2). */
export const BASELINE: Record<FontName, number> = { helvetica: 1.005, times: 0.991, courier: 0.933 }
export const LINE_HEIGHT = 1.2

/** Con texto latino, la fuente estándar del PDF; con otros alfabetos, la libre de la misma familia. */
const FAMILY: Record<FontName, FontFamily> = { helvetica: 'sans', times: 'serif', courier: 'mono' }

/** "#RRGGBB" (o "#RGB") a color de pdf-lib; cualquier otra cosa, negro. */
export function hexToRgb(hex: string) {
  let h = hex.replace('#', '').trim()
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return rgb(0, 0, 0)
  const n = Number.parseInt(h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Las líneas del texto, con los tabuladores como cuatro espacios y sin espacios al final. */
export const textLines = (text: string) => text.split(/\r?\n/).map((l) => l.replace(/\t/g, '    ').trimEnd())

type Box = { x: number; y: number; width: number; height: number }
const quarterTurns = (rotation: number) => ((Math.round(rotation / 90) % 4) + 4) % 4

/** Rectángulo de la página vista (fracciones) en coordenadas del PDF, siempre alineado a los ejes. */
export function viewRectToPdf(x: number, y: number, w: number, h: number, box: Box, rotation: number) {
  const a = viewToPdf(x, y, box, rotation)
  const b = viewToPdf(x + w, y + h, box, rotation)
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }
}

export async function applyEdits(bytes: ArrayBuffer | Uint8Array, items: EditItem[]): Promise<Uint8Array> {
  if (!items.length) throw new Error('Agrega al menos un texto, una imagen o una forma.')
  const doc = await PDFDocument.load(bytes)
  // Una carga de fuentes por familia, con todo el texto que se va a escribir en ella.
  const texts = items.filter((i): i is TextItem => i.kind === 'text')
  const fonts = new Map<FontName, FontSet>()
  for (const name of new Set(texts.map((t) => t.font))) {
    const mine = texts.filter((t) => t.font === name)
    const styles = mine.some((t) => t.bold) ? (['bold'] as const) : []
    fonts.set(name, await fontsForText(doc, FAMILY[name], styles, mine.map((t) => t.text).join('\n')))
  }
  const images = new Map<Uint8Array, PDFImage>()

  // Primero se borra el texto original de las zonas "erase", página por página.
  const erased = new Set<EditItem>()
  const erases = items.filter((i): i is BoxItem => i.kind === 'erase' && isPlaceable(i))
  for (const p of new Set(erases.map((e) => e.page))) {
    const page = doc.getPage(p)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const mine = erases.filter((e) => e.page === p)
    const zones: Zone[] = mine.map((e) => viewRectToPdf(e.x, e.y, e.w, e.h, box, rotation))
    let found: boolean[] = []
    try {
      found = eraseText(doc, p, zones)
    } catch {
      // Contenido que no se pudo leer: se tapa como antes.
    }
    mine.forEach((e, k) => found[k] && erased.add(e))
  }

  for (const item of items) {
    if (!isPlaceable(item) || erased.has(item)) continue
    const page = doc.getPage(item.page)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const turns = quarterTurns(rotation)
    const viewH = turns % 2 ? box.width : box.height

    if (item.kind === 'text') {
      const set = fonts.get(item.font)!
      const viewW = turns % 2 ? box.height : box.width
      const style = item.bold ? 'bold' : 'regular'
      // Cada línea del texto; con ancho, las largas se cortan por palabras como en un párrafo.
      const rows = textLines(item.text).flatMap((line) => {
        const pieces = set.pieces(line, style)
        return item.width ? wrapPieces(pieces, item.size, item.width * viewW) : [pieces]
      })
      const lh = item.lineHeight ?? LINE_HEIGHT
      rows.forEach((pieces, i) => {
        if (!pieces.some((p) => !p.space)) return
        const v = item.y + (BASELINE[item.font] * item.size + i * lh * item.size) / viewH
        const at = viewToPdf(item.x, v, box, rotation)
        drawPieces(page, pieces, { x: at.x, y: at.y, size: item.size, color: hexToRgb(item.color), rotateDeg: turns * 90, degrees })
      })
    } else if (item.kind === 'image') {
      let img = images.get(item.data)
      if (!img) {
        img = item.format === 'png' ? await doc.embedPng(item.data) : await doc.embedJpg(item.data)
        images.set(item.data, img)
      }
      const viewW = turns % 2 ? box.height : box.width
      const anchor = viewToPdf(item.x, item.y + item.h, box, rotation)
      page.drawImage(img, { x: anchor.x, y: anchor.y, width: item.w * viewW, height: item.h * viewH, rotate: degrees(turns * 90) })
    } else {
      const r = viewRectToPdf(item.x, item.y, item.w, item.h, box, rotation)
      const style = boxStyle(item)
      if (item.kind === 'ellipse') {
        page.drawEllipse({ x: r.x + r.width / 2, y: r.y + r.height / 2, xScale: r.width / 2, yScale: r.height / 2, ...style })
      } else page.drawRectangle({ ...r, ...style })
    }
  }
  return doc.save()
}

/** Posición y tamaño numéricos y dentro de la página (una posición inválida haría fallar todo el guardado). */
export function isPlaceable(item: EditItem): boolean {
  const nums = item.kind === 'text' ? [item.x, item.y, item.size] : [item.x, item.y, item.w, item.h]
  return nums.every(Number.isFinite) && item.x >= 0 && item.y >= 0 && item.x <= 1 && item.y <= 1
}

function boxStyle(item: BoxItem) {
  if (item.kind === 'highlight') return { color: hexToRgb(item.fill ?? '#FDE047'), opacity: 0.4, borderWidth: 0 }
  if (item.kind === 'whiteout') return { color: rgb(1, 1, 1), borderWidth: 0 }
  if (item.kind === 'erase') return { color: item.fill ? hexToRgb(item.fill) : rgb(1, 1, 1), borderWidth: 0 }
  return {
    color: item.fill ? hexToRgb(item.fill) : undefined,
    borderColor: item.stroke ? hexToRgb(item.stroke) : undefined,
    borderWidth: item.stroke ? item.strokeWidth : 0,
  }
}
