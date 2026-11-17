/**
 * Firmar PDF: estampa la imagen de una firma (PNG con fondo transparente) en
 * las posiciones elegidas. Es una firma visual, como la de la app Android, no
 * una firma digital con certificado.
 *
 * Las posiciones se expresan como fracción (0 a 1) de la página tal como se ve,
 * con el origen arriba a la izquierda y su rotación aplicada.
 */
import { PDFDocument, degrees } from 'pdf-lib'
import type { Pixels } from './pdfCrop'

export type Placement = { page: number; x: number; y: number; w: number; h: number }
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
  return { page: p.page, w, h, x: Math.min(1 - w, Math.max(0, p.x)), y: Math.min(1 - h, Math.max(0, p.y)) }
}

/** Estampa la firma en cada posición (páginas en base 0). */
export async function signPdf(bytes: ArrayBuffer | Uint8Array, png: Uint8Array, placements: Placement[]): Promise<Uint8Array> {
  if (!placements.length) throw new Error('Coloca la firma en al menos una página.')
  const doc = await PDFDocument.load(bytes)
  const image = await doc.embedPng(png)
  for (const p of placements) {
    const page = doc.getPage(p.page)
    page.drawImage(image, placementToPdf(p, page.getCropBox(), page.getRotation().angle))
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
