/**
 * Comprimir imagen (W-146.8): PNG con paleta (como TinyPNG: hasta 256 colores, con
 * transparencia, y sigue siendo PNG), el formato de salida según lo elegido y comprimir hasta
 * un tamaño máximo. Partes puras, para poder probarlas; el dibujo está en infra/imageCanvas.ts.
 */
import { zlibSync } from 'fflate'
import { applyPalette, quantize, type Palette } from 'gifenc'
import { pngChunk } from '../../pdf/core/pdfImages'
import { MAX_SIDE, type CompressLevel, type OutputMime } from './imageTools'

/** "same": el mismo formato que la original (un PNG sigue siendo PNG). */
export type CompressFormat = 'same' | 'jpg' | 'webp'
/** 'custom': calidad elegida a mano. */
export type CompressMode = CompressLevel | 'custom'

export type CompressPlan2 = {
  mime: OutputMime
  /** Calidad de JPG o WebP (0 a 1). */
  quality: number
  maxSide: number
  /** Para PNG: la menor fidelidad (PSNR, en dB) aceptable al pasar a paleta. */
  minPsnr: number
}

const QUALITY: Record<CompressLevel, number> = { baja: 0.86, media: 0.74, alta: 0.6 }
const SIDE: Record<CompressLevel, number> = { baja: MAX_SIDE, media: 2560, alta: 1600 }
const PSNR: Record<CompressLevel, number> = { baja: 40, media: 35, alta: 31 }

/**
 * Cómo comprimir: el formato (el de la original, o JPG o WebP si se eligen), la calidad y el lado
 * máximo según el nivel. Lo que no es JPG, PNG ni WebP (HEIC, BMP, GIF, TIFF…) sale como JPG, o
 * como PNG si tiene transparencia.
 */
export function compressPlan(mode: CompressMode, format: CompressFormat, inputMime: string, hasAlpha: boolean, customQuality = 0.8): CompressPlan2 {
  let mime: OutputMime
  if (format === 'jpg') mime = 'image/jpeg'
  else if (format === 'webp') mime = 'image/webp'
  else if (inputMime === 'image/jpeg' || inputMime === 'image/png' || inputMime === 'image/webp') mime = inputMime
  else mime = hasAlpha ? 'image/png' : 'image/jpeg'
  if (mode === 'custom') {
    const q = Math.min(1, Math.max(0.1, customQuality))
    return { mime, quality: q, maxSide: MAX_SIDE, minPsnr: 28 + q * 12 }
  }
  return { mime, quality: QUALITY[mode], maxSide: SIDE[mode], minPsnr: PSNR[mode] }
}

/** Reduce los colores a una paleta (con transparencia): el índice de cada pixel y los colores RGBA. */
export function quantizeRgba(rgba: Uint8Array | Uint8ClampedArray, maxColors = 256): { palette: number[][]; index: Uint8Array } {
  const raw: Palette = quantize(rgba, maxColors, { format: 'rgba4444' })
  const palette = raw.map((c) => [c[0], c[1], c[2], c[3] ?? 255])
  const index = applyPalette(rgba, raw, 'rgba4444')
  // gifenc a veces da un color opaco a un pixel transparente (o al revés): esos se reasignan al
  // color más cercano contando también la transparencia.
  for (let i = 0; i < index.length; i++) {
    const a = rgba[i * 4 + 3]
    if (Math.abs(palette[index[i]][3] - a) <= 32) continue
    let best = index[i]
    let dist = Infinity
    palette.forEach((c, k) => {
      const w = Math.min(a, c[3]) / 255
      const d = 4 * (c[3] - a) ** 2 + w * ((c[0] - rgba[i * 4]) ** 2 + (c[1] - rgba[i * 4 + 1]) ** 2 + (c[2] - rgba[i * 4 + 2]) ** 2)
      if (d < dist) [best, dist] = [k, d]
    })
    index[i] = best
  }
  return { palette, index }
}

/** Los pixeles RGBA que resultan de una paleta (para comparar con la original). */
export function paletteToRgba(index: Uint8Array, palette: number[][]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(index.length * 4)
  index.forEach((k, i) => out.set(palette[k] ?? [0, 0, 0, 0], i * 4))
  return out
}

/**
 * Parecido entre dos imágenes RGBA del mismo tamaño (PSNR, en dB): 99 si son iguales; más de
 * 40 no se nota y menos de 30 ya se ve. Lo transparente cuenta solo por su transparencia.
 */
export function psnr(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0
  let n = 0
  for (let i = 0; i < a.length; i += 4) {
    const alpha = Math.max(a[i + 3], b[i + 3]) / 255
    for (let c = 0; c < 3; c++) sum += alpha * (a[i + c] - b[i + c]) ** 2
    sum += (a[i + 3] - b[i + 3]) ** 2
    n += 4
  }
  if (!n || sum === 0) return 99
  return Math.min(99, 10 * Math.log10((255 * 255) / (sum / n)))
}

/** PNG de paleta (tipo 3, 8 bits): los colores en PLTE y su transparencia en tRNS. */
export function encodeIndexedPng(index: Uint8Array, palette: number[][], w: number, h: number): Uint8Array {
  if (!palette.length || palette.length > 256) throw new Error('Paleta inválida')
  const raw = new Uint8Array(h * (w + 1))
  for (let y = 0; y < h; y++) raw.set(index.subarray(y * w, y * w + w), y * (w + 1) + 1)
  const ihdr = new Uint8Array(13)
  const v = new DataView(ihdr.buffer)
  v.setUint32(0, w)
  v.setUint32(4, h)
  ihdr.set([8, 3, 0, 0, 0], 8)
  const plte = new Uint8Array(palette.length * 3)
  palette.forEach((c, i) => plte.set([c[0], c[1], c[2]], i * 3))
  // Solo hasta el último color con algo de transparencia (los demás se dan por opacos).
  let last = -1
  palette.forEach((c, i) => {
    if ((c[3] ?? 255) < 255) last = i
  })
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('PLTE', plte)]
  if (last >= 0) parts.push(pngChunk('tRNS', Uint8Array.from(palette.slice(0, last + 1).map((c) => c[3] ?? 255))))
  parts.push(pngChunk('IDAT', zlibSync(raw, { level: 9 })), pngChunk('IEND', new Uint8Array()))
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/**
 * Un PNG con paleta si se parece lo suficiente a la original (`minPsnr`); si no (una foto con
 * muchos colores), null y se guarda sin perder nada.
 */
export function palettePng(rgba: Uint8Array | Uint8ClampedArray, w: number, h: number, minPsnr: number): { png: Uint8Array; psnr: number } | null {
  const { palette, index } = quantizeRgba(rgba)
  const quality = psnr(rgba, paletteToRgba(index, palette))
  return quality >= minPsnr ? { png: encodeIndexedPng(index, palette, w, h), psnr: quality } : null
}

/** Tamaños máximos más pedidos por portales y formularios, en bytes. */
export const TARGET_SIZES = [50, 100, 200, 500, 1000].map((kb) => kb * 1024)

/**
 * Comprime hasta que entre en `target` bytes: primero baja la calidad (búsqueda binaria entre
 * `maxQuality` y `minQuality`) y, si no alcanza, achica la imagen de a 20 %. Para formatos sin
 * calidad (PNG) solo achica. `encode(quality, scale)` produce el archivo.
 */
export async function fitToSize(
  encode: (quality: number, scale: number) => Promise<Blob>,
  target: number,
  opts: { lossy: boolean; maxQuality: number; minQuality?: number; minScale?: number },
): Promise<{ blob: Blob; quality: number; scale: number; fits: boolean }> {
  const minQ = opts.minQuality ?? 0.35
  const minScale = opts.minScale ?? 0.05
  let best: { blob: Blob; quality: number; scale: number } | null = null
  for (let scale = 1; scale >= minScale; scale *= 0.8) {
    if (!opts.lossy) {
      const blob = await encode(opts.maxQuality, scale)
      if (blob.size <= target) return { blob, quality: opts.maxQuality, scale, fits: true }
      if (!best || blob.size < best.blob.size) best = { blob, quality: opts.maxQuality, scale }
      continue
    }
    const top = await encode(opts.maxQuality, scale)
    if (top.size <= target) return { blob: top, quality: opts.maxQuality, scale, fits: true }
    const bottom = await encode(minQ, scale)
    if (!best || bottom.size < best.blob.size) best = { blob: bottom, quality: minQ, scale }
    if (bottom.size > target) continue
    // La mayor calidad que entra.
    let lo = minQ
    let hi = opts.maxQuality
    let fit = { blob: bottom, quality: minQ }
    for (let k = 0; k < 6; k++) {
      const q = (lo + hi) / 2
      const b = await encode(q, scale)
      if (b.size <= target) {
        fit = { blob: b, quality: q }
        lo = q
      } else hi = q
    }
    return { ...fit, scale, fits: true }
  }
  return { ...best!, fits: false }
}
