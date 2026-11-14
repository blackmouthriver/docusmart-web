/**
 * Editar PDF: agrega texto, imágenes y formas sobre las páginas, como capas
 * nuevas (el contenido original no se toca). Las posiciones son fracciones
 * (0 a 1) de la página tal como se ve, igual que en Firmar y Censurar.
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage } from 'pdf-lib'
import { viewToPdf } from './pdfSign'
import { sanitizeWinAnsi } from './pdfTools'

export type FontName = 'helvetica' | 'times' | 'courier'
export type TextItem = { kind: 'text'; page: number; x: number; y: number; text: string; size: number; color: string; font: FontName; bold: boolean }
export type BoxKind = 'rect' | 'ellipse' | 'highlight' | 'whiteout'
export type BoxItem = { kind: BoxKind; page: number; x: number; y: number; w: number; h: number; stroke: string | null; fill: string | null; strokeWidth: number }
export type ImageItem = { kind: 'image'; page: number; x: number; y: number; w: number; h: number; data: Uint8Array; format: 'png' | 'jpg' }
export type EditItem = TextItem | BoxItem | ImageItem

/** Distancia del borde superior de la caja a la línea base, en tamaños de letra (igual que el navegador con line-height 1.2). */
export const BASELINE: Record<FontName, number> = { helvetica: 1.005, times: 0.991, courier: 0.933 }
export const LINE_HEIGHT = 1.2

const FONTS: Record<FontName, [StandardFonts, StandardFonts]> = {
  helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold],
  times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold],
  courier: [StandardFonts.Courier, StandardFonts.CourierBold],
}

/** "#RRGGBB" (o "#RGB") a color de pdf-lib; cualquier otra cosa, negro. */
export function hexToRgb(hex: string) {
  let h = hex.replace('#', '').trim()
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return rgb(0, 0, 0)
  const n = Number.parseInt(h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Las fuentes estándar de PDF solo dibujan latín (WinAnsi): se limpia cada línea. */
export const printableLines = (text: string) => text.split(/\r?\n/).map((l) => sanitizeWinAnsi(l.replace(/\t/g, '    ')))

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
  const fonts = new Map<string, PDFFont>()
  const font = async (name: FontName, bold: boolean) => {
    const key = name + bold
    if (!fonts.has(key)) fonts.set(key, await doc.embedFont(FONTS[name][bold ? 1 : 0]))
    return fonts.get(key)!
  }
  const images = new Map<Uint8Array, PDFImage>()

  for (const item of items) {
    const page = doc.getPage(item.page)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const turns = quarterTurns(rotation)
    const viewH = turns % 2 ? box.width : box.height

    if (item.kind === 'text') {
      const f = await font(item.font, item.bold)
      printableLines(item.text).forEach((line, i) => {
        if (!line) return
        const v = item.y + (BASELINE[item.font] * item.size + i * LINE_HEIGHT * item.size) / viewH
        const at = viewToPdf(item.x, v, box, rotation)
        page.drawText(line, { x: at.x, y: at.y, size: item.size, font: f, color: hexToRgb(item.color), rotate: degrees(turns * 90) })
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

function boxStyle(item: BoxItem) {
  if (item.kind === 'highlight') return { color: hexToRgb(item.fill ?? '#FDE047'), opacity: 0.4, borderWidth: 0 }
  if (item.kind === 'whiteout') return { color: rgb(1, 1, 1), borderWidth: 0 }
  return {
    color: item.fill ? hexToRgb(item.fill) : undefined,
    borderColor: item.stroke ? hexToRgb(item.stroke) : undefined,
    borderWidth: item.stroke ? item.strokeWidth : 0,
  }
}
