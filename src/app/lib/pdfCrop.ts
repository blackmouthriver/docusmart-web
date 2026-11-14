/**
 * Recortar PDF: cambia la caja de recorte (CropBox) de las páginas.
 * Los márgenes se expresan como fracción (0 a 1) de la página tal como se ve,
 * es decir, con su rotación aplicada; aquí se traducen a las coordenadas del PDF.
 */
import { PDFDocument } from 'pdf-lib'

export type Margins = { top: number; right: number; bottom: number; left: number }

export const NO_MARGINS: Margins = { top: 0, right: 0, bottom: 0, left: 0 }
/** Lo mínimo que puede quedar de la página en cada eje (5 %). */
export const MIN_KEEP = 0.05

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/** Deja los márgenes en rango y garantiza que quede al menos MIN_KEEP de página. */
export function clampMargins(m: Margins): Margins {
  const fit = (a: number, b: number): [number, number] => {
    a = clamp01(a)
    b = clamp01(b)
    const excess = a + b - (1 - MIN_KEEP)
    if (excess <= 0) return [a, b]
    // Se reparte el exceso en proporción, para no castigar solo a un lado.
    const total = a + b
    return [a - (excess * a) / total, b - (excess * b) / total]
  }
  const [top, bottom] = fit(m.top, m.bottom)
  const [left, right] = fit(m.left, m.right)
  return { top, right, bottom, left }
}

export const isNoCrop = (m: Margins) => m.top + m.right + m.bottom + m.left < 1e-4

/**
 * Traduce márgenes de la página vista a la página sin rotar.
 * Con /Rotate 90 (horario), el borde izquierdo original queda arriba, etc.
 */
export function toUnrotated(m: Margins, rotation: number): Margins {
  switch (((Math.round(rotation / 90) % 4) + 4) % 4) {
    case 1:
      return { left: m.top, top: m.right, right: m.bottom, bottom: m.left }
    case 2:
      return { top: m.bottom, right: m.left, bottom: m.top, left: m.right }
    case 3:
      return { right: m.top, bottom: m.right, left: m.bottom, top: m.left }
    default:
      return { ...m }
  }
}

/** Recorta las páginas indicadas (base 0; todas si se omite) con los mismos márgenes. */
export async function cropPdf(bytes: ArrayBuffer | Uint8Array, margins: Margins, pages?: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  const m = clampMargins(margins)
  const indices = pages ?? doc.getPageIndices()
  for (const i of indices) {
    const page = doc.getPage(i)
    const box = page.getCropBox()
    const o = toUnrotated(m, page.getRotation().angle)
    const x = box.x + o.left * box.width
    const y = box.y + o.bottom * box.height
    const width = box.width * (1 - o.left - o.right)
    const height = box.height * (1 - o.top - o.bottom)
    page.setCropBox(x, y, width, height)
    // Algunos lectores usan TrimBox o ArtBox si existen: se alinean con el recorte.
    if (page.node.TrimBox()) page.setTrimBox(x, y, width, height)
    if (page.node.ArtBox()) page.setArtBox(x, y, width, height)
  }
  return doc.save()
}

/** Pixeles RGBA como los de ImageData (sin depender del canvas). */
export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number }

/**
 * Márgenes en blanco de una página dibujada: busca el rectángulo con contenido
 * (pixeles más oscuros que `threshold`) y deja un respiro de `pad`.
 * Si la página está en blanco, no recorta nada.
 */
export function detectContentMargins(img: Pixels, threshold = 245, pad = 0.01): Margins {
  const { data, width, height } = img
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const alpha = data[i + 3]
      // Transparente cuenta como blanco (así dibuja pdf.js el fondo vacío).
      if (alpha < 16) continue
      if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { ...NO_MARGINS }
  return clampMargins({
    left: Math.max(0, minX / width - pad),
    right: Math.max(0, (width - 1 - maxX) / width - pad),
    top: Math.max(0, minY / height - pad),
    bottom: Math.max(0, (height - 1 - maxY) / height - pad),
  })
}

/** Puntos PDF (1/72 de pulgada) a milímetros, redondeado. */
export const ptToMm = (pt: number) => Math.round((pt * 25.4) / 72)
