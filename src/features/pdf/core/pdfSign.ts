/**
 * Firmar PDF: estampa la imagen de una firma (PNG con fondo transparente) en
 * las posiciones elegidas. Es una firma visual, como la de la app Android, no
 * una firma digital con certificado.
 *
 * Las posiciones se expresan como fracción (0 a 1) de la página tal como se ve,
 * con el origen arriba a la izquierda y su rotación aplicada.
 */
import { LineCapStyle, PDFDocument, degrees } from 'pdf-lib'
import { drawPieces, fontsForText, piecesWidth } from '../../../shared/pdf/pdfFonts'
import type { Pixels } from './pdfCrop'
import { hexToRgb } from './pdfEdit'
import { loadPdf } from '../../security/core/openPdf'

/**
 * Qué va en cada recuadro (W-146.2): la firma, las iniciales (imágenes), la fecha o un texto
 * (texto real del PDF) o una marca ✓. Sin `kind`, es la firma.
 */
export type StampKind = 'signature' | 'initials' | 'date' | 'text' | 'check'
export type Placement = { page: number; x: number; y: number; w: number; h: number; kind?: StampKind; text?: string }
export type SignImages = { signature?: Uint8Array; initials?: Uint8Array }
export const isImageStamp = (p: Placement) => !p.kind || p.kind === 'signature' || p.kind === 'initials'
type Box = { x: number; y: number; width: number; height: number }

const quarterTurns = (rotation: number) => ((Math.round(rotation / 90) % 4) + 4) % 4

/** Un punto de la página vista (u, v en fracción) a coordenadas del PDF. */
export function viewToPdf(u: number, v: number, box: Box, rotation: number): { x: number; y: number } {
  const { x: bx, y: by, width: W, height: H } = box
  switch (quarterTurns(rotation)) {
    case 1:
      return { x: bx + v * W, y: by + u * H }
    case 2:
      return { x: bx + (1 - u) * W, y: by + v * H }
    case 3:
      return { x: bx + (1 - v) * W, y: by + (1 - u) * H }
    default:
      return { x: bx + u * W, y: by + (1 - v) * H }
  }
}

/**
 * Rectángulo para `drawImage` de pdf-lib: esquina inferior izquierda de la
 * imagen, tamaño y giro, para que se vea derecha aunque la página esté rotada.
 */
export function placementToPdf(p: Placement, box: Box, rotation: number) {
  const turns = quarterTurns(rotation)
  const viewW = turns % 2 ? box.height : box.width
  const viewH = turns % 2 ? box.width : box.height
  const anchor = viewToPdf(p.x, p.y + p.h, box, rotation)
  return { x: anchor.x, y: anchor.y, width: p.w * viewW, height: p.h * viewH, rotate: degrees(turns * 90) }
}

/** Posición inicial: ancho del 30 % de la página, abajo a la derecha. */
export function defaultPlacement(page: number, signatureAspect: number, pageAspect: number): Placement {
  const w = 0.3
  // h en fracción de la altura vista: (ancho real / aspecto de la firma) / alto real.
  const h = Math.min(0.4, (w * pageAspect) / signatureAspect)
  return { page, w, h, x: 1 - w - 0.06, y: 1 - h - 0.06 }
}

/** Mantiene el recuadro dentro de la página y con un tamaño mínimo. */
export function clampPlacement(p: Placement, min = 0.03): Placement {
  const w = Math.min(1, Math.max(min, p.w))
  const h = Math.min(1, Math.max(min, p.h))
  return { ...p, w, h, x: Math.min(1 - w, Math.max(0, p.x)), y: Math.min(1 - h, Math.max(0, p.y)) }
}

/** Puntos de la marca ✓ dentro de su recuadro (fracciones, origen arriba a la izquierda). */
const CHECK: Array<[number, number]> = [
  [0.14, 0.55],
  [0.4, 0.8],
  [0.86, 0.2],
]

/**
 * Estampa la firma y los demás campos en cada posición (páginas en base 0). `images` es el PNG de
 * la firma o, con iniciales, `{ signature, initials }`. `ink` es el color de la fecha, los textos y ✓.
 */
export async function signPdf(bytes: ArrayBuffer | Uint8Array, images: Uint8Array | SignImages, placements: Placement[], ink = '#1C1B1A'): Promise<Uint8Array> {
  if (!placements.length) throw new Error('Coloca la firma en al menos una página.')
  const doc = await loadPdf(bytes)
  const pngs: SignImages = images instanceof Uint8Array ? { signature: images } : images
  const embedded = new Map<StampKind, Awaited<ReturnType<PDFDocument['embedPng']>>>()
  for (const kind of ['signature', 'initials'] as const) {
    const png = pngs[kind]
    if (png && placements.some((p) => (p.kind ?? 'signature') === kind)) embedded.set(kind, await doc.embedPng(png))
  }
  const texts = placements.filter((p) => (p.kind === 'date' || p.kind === 'text') && p.text?.trim())
  const fonts = texts.length ? await fontsForText(doc, 'sans', ['regular'], texts.map((p) => p.text).join('\n')) : null
  const color = hexToRgb(ink)

  for (const p of placements) {
    const page = doc.getPage(p.page)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const kind = p.kind ?? 'signature'
    const turns = quarterTurns(rotation)
    const viewW = turns % 2 ? box.height : box.width
    const viewH = turns % 2 ? box.width : box.height
    if (kind === 'signature' || kind === 'initials') {
      const image = embedded.get(kind)
      if (image) page.drawImage(image, placementToPdf(p, box, rotation))
    } else if (kind === 'check') {
      const pts = CHECK.map(([cu, cv]) => viewToPdf(p.x + cu * p.w, p.y + cv * p.h, box, rotation))
      const thickness = Math.max(1, Math.min(p.w * viewW, p.h * viewH) * 0.12)
      for (let i = 0; i + 1 < pts.length; i++) page.drawLine({ start: pts[i], end: pts[i + 1], thickness, color, lineCap: LineCapStyle.Round })
    } else if (fonts && p.text?.trim()) {
      // El texto ocupa el recuadro: tan alto como entre, sin pasarse del ancho.
      const pieces = fonts.pieces(p.text.trim())
      const boxW = p.w * viewW
      const boxH = p.h * viewH
      const size = Math.max(4, Math.min(boxH / 1.15, boxW / (piecesWidth(pieces, 1) || 1)))
      const at = viewToPdf(p.x, p.y + (boxH / 2 + size * 0.36) / viewH, box, rotation)
      drawPieces(page, pieces, { x: at.x, y: at.y, size, color, rotateDeg: turns * 90, degrees })
    }
  }
  return doc.save()
}

/**
 * Para firmas fotografiadas o escaneadas: vuelve transparente el fondo claro
 * y deja el trazo con su color. Modifica los pixeles en el mismo arreglo.
 */
export function removeLightBackground(img: Pixels, threshold = 200): void {
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    const light = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (light >= threshold) data[i + 3] = 0
    else if (light > threshold - 60) {
      // Borde suave: los grises intermedios quedan semitransparentes.
      data[i + 3] = Math.round((data[i + 3] * (threshold - light)) / 60)
    }
  }
}

/** Rectángulo (en pixeles) que contiene todo lo no transparente, o null si no hay nada. */
export function opaqueBounds(img: Pixels, minAlpha = 16): { x: number; y: number; width: number; height: number } | null {
  const { data, width, height } = img
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < minAlpha) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
