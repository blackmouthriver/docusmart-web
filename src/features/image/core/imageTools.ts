/**
 * Herramientas de imagen (comprimir, redimensionar, recortar y rotar): los
 * cálculos, sin canvas, para poder probarlos. El dibujo está en imageCanvas.ts.
 */
import { looksLikeHeic } from '../../convert/core/heic'

/** Lado máximo que se acepta para no agotar la memoria del navegador (y el límite de canvas de Safari). */
export const MAX_SIDE = 16384
export type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp'

/**
 * Formato de salida: se conserva JPG, PNG o WebP; las fotos HEIC del iPhone pasan a JPG (casi
 * nada las abre y en PNG pesarían muchísimo) y lo demás (GIF, BMP, AVIF…) se guarda como PNG.
 */
export function outputMime(inputType: string, name = ''): OutputMime {
  if (inputType === 'image/jpeg' || inputType === 'image/png' || inputType === 'image/webp') return inputType
  if (looksLikeHeic(name, inputType)) return 'image/jpeg'
  return 'image/png'
}

export const extOf = (mime: OutputMime) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[mime]

/** "foto.final.JPG" + "comprimida" + jpg → "foto.final-comprimida.jpg" */
export function outputName(name: string, suffix: string, mime: OutputMime): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'imagen'
  return `${base}-${suffix}.${extOf(mime)}`
}

/* ───────────── Redimensionar ───────────── */

export type ResizeSpec = { mode: 'percent'; percent: number } | { mode: 'pixels'; width: number | null; height: number | null; keepRatio: boolean }

/** Nuevo tamaño en pixeles (enteros, al menos 1 y sin pasar de MAX_SIDE, conservando la proporción al limitar). */
export function fitSize(w: number, h: number, spec: ResizeSpec): { width: number; height: number } {
  let width: number
  let height: number
  if (spec.mode === 'percent') {
    const k = Math.max(1, spec.percent) / 100
    width = w * k
    height = h * k
  } else {
    const { width: tw, height: th, keepRatio } = spec
    if (keepRatio) {
      // Con proporción fija, manda el lado que se haya escrito (o el que más reduzca, si están los dos).
      const kx = tw ? tw / w : Infinity
      const ky = th ? th / h : Infinity
      const k = Math.min(kx, ky)
      width = Number.isFinite(k) ? w * k : w
      height = Number.isFinite(k) ? h * k : h
    } else {
      width = tw || w
      height = th || h
    }
  }
  const cap = Math.min(1, MAX_SIDE / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * cap)), height: Math.max(1, Math.round(height * cap)) }
}

/* ───────────── Comprimir ───────────── */

export type CompressLevel = 'baja' | 'media' | 'alta'
export type CompressPlan = { mime: OutputMime; quality: number; maxSide: number }

/**
 * Cómo comprimir según el nivel: JPEG para fotos opacas y WebP para las que
 * tienen transparencia (JPEG no la admite y PNG casi no comprime fotos).
 */
export function planCompression(level: CompressLevel, hasAlpha: boolean): CompressPlan {
  const mime: OutputMime = hasAlpha ? 'image/webp' : 'image/jpeg'
  if (level === 'baja') return { mime, quality: 0.86, maxSide: MAX_SIDE }
  if (level === 'media') return { mime, quality: 0.74, maxSide: 2560 }
  return { mime, quality: 0.6, maxSide: 1600 }
}

/** Tamaño para no pasar del lado máximo del plan (sin agrandar nunca). */
export function capSize(w: number, h: number, maxSide: number) {
  const k = Math.min(1, maxSide / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) }
}

/** Porcentaje ahorrado (negativo si creció). */
export const savedPercent = (before: number, after: number) => (before ? Math.round((1 - after / before) * 100) : 0)

/* ───────────── Rotar ───────────── */

export type Transform = { rotate: 0 | 90 | 180 | 270; flipH: boolean; flipV: boolean }
export const IDENTITY: Transform = { rotate: 0, flipH: false, flipV: false }

export const rotateBy = (t: Transform, deg: 90 | -90): Transform => ({ ...t, rotate: ((((t.rotate + deg) % 360) + 360) % 360) as Transform['rotate'] })

/** Tamaño del resultado después de girar. */
export const rotatedSize = (w: number, h: number, t: Transform) => (t.rotate % 180 ? { width: h, height: w } : { width: w, height: h })

export const isIdentity = (t: Transform) => t.rotate === 0 && !t.flipH && !t.flipV

/* ───────────── Recortar ───────────── */

export type CropRect = { x: number; y: number; w: number; h: number } // fracciones de la imagen
export const ASPECTS = { libre: null, '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 } as const
export type AspectName = keyof typeof ASPECTS

/** El recuadro más grande con esa proporción, centrado en la imagen. */
export function centeredCrop(imgW: number, imgH: number, aspect: number | null): CropRect {
  if (!aspect) return { x: 0, y: 0, w: 1, h: 1 }
  const imgAspect = imgW / imgH
  if (aspect > imgAspect) {
    const h = imgAspect / aspect
    return { x: 0, y: (1 - h) / 2, w: 1, h }
  }
  const w = aspect / imgAspect
  return { x: (1 - w) / 2, y: 0, w, h: 1 }
}

/** Con proporción fija (ancho/alto en pixeles), el alto sigue al ancho; si no cabe, manda el alto. */
export function lockAspect(r: CropRect, imgW: number, imgH: number, aspect: number): CropRect {
  let h = (r.w * imgW) / aspect / imgH
  let w = r.w
  if (r.y + h > 1) {
    h = 1 - r.y
    w = (h * imgH * aspect) / imgW
  }
  return { x: r.x, y: r.y, w, h }
}

/** Recorte en pixeles enteros, siempre dentro de la imagen y de al menos 1×1. */
export function cropPixels(imgW: number, imgH: number, r: CropRect) {
  const x = Math.min(imgW - 1, Math.max(0, Math.round(r.x * imgW)))
  const y = Math.min(imgH - 1, Math.max(0, Math.round(r.y * imgH)))
  const width = Math.max(1, Math.min(imgW - x, Math.round(r.w * imgW)))
  const height = Math.max(1, Math.min(imgH - y, Math.round(r.h * imgH)))
  return { x, y, width, height }
}

/** Márgenes de Recortar PDF (top/right/bottom/left) a recuadro, para reutilizar su editor. */
export const marginsToRect = (m: { top: number; right: number; bottom: number; left: number }): CropRect => ({ x: m.left, y: m.top, w: 1 - m.left - m.right, h: 1 - m.top - m.bottom })
export const rectToMargins = (r: CropRect) => ({ top: r.y, left: r.x, right: 1 - r.x - r.w, bottom: 1 - r.y - r.h })
