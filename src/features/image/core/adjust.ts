/**
 * Ajustar imagen (W-125): brillo, contraste, saturación, blanco y negro y enderezar.
 * Partes puras (los pixeles como arreglos), para poder probarlas; el dibujo está en infra/adjustCanvas.ts.
 */

export type Adjustments = {
  /** -100 a 100 */
  brightness: number
  /** -100 a 100 */
  contrast: number
  /** -100 (gris) a 100 (el doble de color) */
  saturation: number
  grayscale: boolean
  /** Giro para enderezar, en grados (-15 a 15). */
  angle: number
}

export const NEUTRAL: Adjustments = { brightness: 0, contrast: 0, saturation: 0, grayscale: false, angle: 0 }
export const MAX_ANGLE = 15

export const isNeutral = (a: Adjustments) => !a.brightness && !a.contrast && !a.saturation && !a.grayscale && !a.angle

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Un ajuste dentro de sus límites (0 si no es un número). */
export const clampAdjust = (v: number, limit = 100) => (Number.isFinite(v) ? clamp(Math.round(v * 10) / 10, -limit, limit) : 0)

/** "+20", "-5" o "0", para mostrar el valor junto al control. */
export const signed = (v: number) => (v > 0 ? `+${v}` : String(v))

/**
 * Tabla de 256 valores con el brillo y el contraste (lo mismo para los tres canales).
 * El contraste estira o encoge los tonos alrededor del gris medio; el brillo los desplaza.
 */
export function toneTable(brightness: number, contrast: number): Uint8ClampedArray {
  const c = clampAdjust(contrast) * 1.28
  const factor = (259 * (c + 255)) / (255 * (259 - c))
  const shift = clampAdjust(brightness) * 1.28
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) lut[v] = Math.round((v - 128) * factor + 128 + shift)
  return lut
}

/** Aplica los ajustes de color a pixeles RGBA, en el lugar (la transparencia no cambia). */
export function applyAdjustments(rgba: Uint8ClampedArray, a: Adjustments): Uint8ClampedArray {
  const lut = toneTable(a.brightness, a.contrast)
  const s = a.grayscale ? 0 : 1 + clampAdjust(a.saturation) / 100
  for (let i = 0; i < rgba.length; i += 4) {
    let r = lut[rgba[i]]
    let g = lut[rgba[i + 1]]
    let b = lut[rgba[i + 2]]
    if (s !== 1) {
      // Luminancia (lo que el ojo percibe como claro u oscuro), para que el gris conserve la luz.
      const y = 0.299 * r + 0.587 * g + 0.114 * b
      r = y + (r - y) * s
      g = y + (g - y) * s
      b = y + (b - y) * s
    }
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
  }
  return rgba
}

/**
 * Al enderezar, el recorte más grande con la misma proporción que no deja esquinas vacías:
 * su ancho y alto en pixeles (la imagen girada se centra en él).
 */
export function straightenSize(w: number, h: number, angleDeg: number): { width: number; height: number } {
  const t = (Math.abs(clamp(angleDeg, -MAX_ANGLE, MAX_ANGLE)) * Math.PI) / 180
  if (!t) return { width: w, height: h }
  const cos = Math.cos(t)
  const sin = Math.sin(t)
  const k = Math.min(w / (w * cos + h * sin), h / (w * sin + h * cos))
  return { width: Math.max(1, Math.floor(w * k)), height: Math.max(1, Math.floor(h * k)) }
}
