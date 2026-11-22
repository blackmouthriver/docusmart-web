/**
 * Redimensionar y girar (W-146.8): medidas listas para redes sociales, centímetros a una
 * resolución, la resolución (ppp) guardada en el archivo y el giro de un JPG sin volver a
 * comprimirlo (solo cambia la orientación EXIF). Partes puras, para poder probarlas.
 */
import { pngChunk } from '../../pdf/core/pdfImages'
import { setJpegDpi } from './idPhoto'
import type { Transform } from './imageTools'

/** Medidas recomendadas por cada red (en pixeles). Los nombres están en `imgt.preset.<id>`. */
export const RESIZE_PRESETS = [
  { id: 'igSquare', w: 1080, h: 1080 },
  { id: 'igPortrait', w: 1080, h: 1350 },
  { id: 'story', w: 1080, h: 1920 },
  { id: 'fbCover', w: 1640, h: 624 },
  { id: 'liCover', w: 1584, h: 396 },
  { id: 'xHeader', w: 1500, h: 500 },
  { id: 'ytThumb', w: 1280, h: 720 },
  { id: 'wallpaper', w: 1920, h: 1080 },
] as const
export type ResizePresetId = (typeof RESIZE_PRESETS)[number]['id']

/** La zona de la imagen (en pixeles) que llena `tw` × `th` sin deformarse: lo que sobra se recorta parejo. */
export function coverCrop(w: number, h: number, tw: number, th: number): { x: number; y: number; width: number; height: number } {
  const target = tw / th
  if (w / h > target) {
    const width = Math.max(1, Math.round(h * target))
    return { x: Math.round((w - width) / 2), y: 0, width, height: h }
  }
  const height = Math.max(1, Math.round(w / target))
  return { x: 0, y: Math.round((h - height) / 2), width: w, height }
}

/** Centímetros a pixeles a una resolución. */
export const cmToPx = (cm: number, dpi: number) => Math.max(1, Math.round((cm / 2.54) * dpi))

const isPng = (b: Uint8Array) => b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
const isJpeg = (b: Uint8Array) => b.length > 4 && b[0] === 0xff && b[1] === 0xd8

/** La resolución guardada en un JPG (JFIF) o un PNG (pHYs), en ppp; null si no la trae. */
export function readDpi(b: Uint8Array): number | null {
  if (isJpeg(b) && b[2] === 0xff && b[3] === 0xe0 && String.fromCharCode(...b.subarray(6, 11)) === 'JFIF\0') {
    const unit = b[13]
    const x = (b[14] << 8) | b[15]
    if (!x || unit === 0) return null
    return unit === 2 ? Math.round(x * 2.54) : x
  }
  if (isPng(b)) {
    let i = 8
    while (i + 12 <= b.length) {
      const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
      const type = String.fromCharCode(...b.subarray(i + 4, i + 8))
      if (type === 'pHYs' && b[i + 16] === 1) {
        const ppm = ((b[i + 8] << 24) | (b[i + 9] << 16) | (b[i + 10] << 8) | b[i + 11]) >>> 0
        return ppm ? Math.round(ppm * 0.0254) : null
      }
      if (type === 'IDAT') break
      i += 12 + len
    }
  }
  return null
}

/** El mismo archivo con la resolución guardada (JPG: JFIF; PNG: pHYs). WebP y otros quedan igual. */
export function writeDpi(b: Uint8Array, dpi: number): Uint8Array {
  if (isJpeg(b)) return setJpegDpi(b, dpi)
  if (!isPng(b)) return b
  const ppm = Math.round(dpi / 0.0254)
  const data = new Uint8Array(9)
  new DataView(data.buffer).setUint32(0, ppm)
  new DataView(data.buffer).setUint32(4, ppm)
  data[8] = 1
  const phys = pngChunk('pHYs', data)
  // Se quita el pHYs que hubiera y se pone el nuevo después de IHDR (que siempre es el primero).
  const parts: Uint8Array[] = [b.subarray(0, 8)]
  let i = 8
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
    const type = String.fromCharCode(...b.subarray(i + 4, i + 8))
    const end = i + 12 + len
    if (type !== 'pHYs') parts.push(b.subarray(i, end))
    if (type === 'IHDR') parts.push(phys)
    i = end
  }
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/* ───────────── Girar un JPG sin pérdida ───────────── */

type M = [number, number, number, number]
/** Cómo cada orientación EXIF (1 a 8) lleva los pixeles guardados a como se ven (y hacia abajo). */
const ORIENT: Record<number, M> = {
  1: [1, 0, 0, 1], 2: [-1, 0, 0, 1], 3: [-1, 0, 0, -1], 4: [1, 0, 0, -1],
  5: [0, 1, 1, 0], 6: [0, -1, 1, 0], 7: [0, -1, -1, 0], 8: [0, 1, -1, 0],
}
const mul = (a: M, b: M): M => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]]

/**
 * La orientación EXIF que deja la foto como se ve con la orientación `current` y, encima, el giro
 * y volteo de `t` (girar primero y voltear después, como se dibuja en el canvas).
 */
export function composeOrientation(current: number, t: Transform): number {
  const r = ((t.rotate / 90) % 4 + 4) % 4
  const rot: M = [[1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0]][r] as M
  const flip: M = [t.flipH ? -1 : 1, 0, 0, t.flipV ? -1 : 1]
  const total = mul(mul(rot, flip), ORIENT[current] ?? ORIENT[1])
  return Number(Object.keys(ORIENT).find((k) => ORIENT[Number(k)].every((v, i) => v === total[i])) ?? 1)
}

/**
 * El mismo JPG con otra orientación, sin volver a comprimir la imagen. Se quitan los EXIF, XMP e
 * IPTC que tuviera (con la ubicación GPS) y se deja un EXIF mínimo con solo la orientación.
 */
export function jpegWithOrientation(b: Uint8Array, orientation: number): Uint8Array {
  if (!isJpeg(b)) throw new Error('No es un JPG')
  const segments: Uint8Array[] = []
  let i = 2
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1]
    if (marker === 0xda || marker === 0xd9) break
    const len = (b[i + 2] << 8) | b[i + 3]
    const end = i + 2 + len
    // APP1 (EXIF y XMP) y APP13 (IPTC) fuera: pueden traer la ubicación y otros datos personales.
    if (marker !== 0xe1 && marker !== 0xed) segments.push(b.subarray(i, end))
    i = end
  }
  const tiff = [0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation & 0xff, 0, 0, 0, 0, 0, 0]
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const app1 = Uint8Array.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload])
  // JFIF (APP0) va primero si existe; el EXIF, justo después.
  const app0 = segments.length && segments[0][1] === 0xe0 ? [segments.shift()!] : []
  const parts = [b.subarray(0, 2), ...app0, app1, ...segments, b.subarray(i)]
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}
