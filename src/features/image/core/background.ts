/**
 * Quitar fondo (W-121): partes puras (sin canvas ni red) del recorte con IA.
 * El modelo es IS-Net "isnet-general-use" (Apache-2.0), servido desde docusmart.online
 * en dos partes y ejecutado con onnxruntime-web dentro del navegador.
 */

/** El modelo trabaja con imágenes cuadradas de 1024 × 1024. */
export const MODEL_SIZE = 1024

export const MODEL = {
  base: '/models/isnet/',
  parts: [
    { file: 'isnet-general-use-h16.v1.part0.bin', bytes: 45326629 },
    { file: 'isnet-general-use-h16.v1.part1.bin', bytes: 45326628 },
  ],
  bytes: 90653257,
  sha256: '3ade1e51e6923c025f03545cd1dafb765841f1a8a7fc25f2452dde64b857695f',
} as const

/**
 * Pixeles RGBA (ya escalados a MODEL_SIZE²) → tensor 1×3×H×W en float32, como lo entrenaron:
 * valores entre 0 y 1 (divididos por el máximo de la imagen) menos 0,5.
 */
export function toModelInput(rgba: Uint8ClampedArray, size = MODEL_SIZE): Float32Array {
  const n = size * size
  if (rgba.length !== n * 4) throw new Error('Tamaño de imagen inesperado')
  let max = 1
  for (let i = 0; i < rgba.length; i++) if (i % 4 !== 3 && rgba[i] > max) max = rgba[i]
  const out = new Float32Array(3 * n)
  for (let p = 0; p < n; p++) {
    out[p] = rgba[p * 4] / max - 0.5
    out[n + p] = rgba[p * 4 + 1] / max - 0.5
    out[2 * n + p] = rgba[p * 4 + 2] / max - 0.5
  }
  return out
}

/** Salida del modelo → máscara de 0 a 255 (normalizada entre su mínimo y su máximo). */
export function toMask(output: Float32Array): Uint8ClampedArray<ArrayBuffer> {
  let min = Infinity
  let max = -Infinity
  for (const v of output) {
    if (v < min) min = v
    if (v > max) max = v
  }
  const range = max - min || 1
  const mask = new Uint8ClampedArray(output.length)
  for (let i = 0; i < output.length; i++) mask[i] = Math.round(((output[i] - min) / range) * 255)
  return mask
}

/** La máscara como imagen RGBA en escala de grises con alfa (para escalarla con canvas). */
export function maskToRgba(mask: Uint8ClampedArray): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(mask.length * 4)
  for (let i = 0; i < mask.length; i++) {
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255
    out[i * 4 + 3] = mask[i]
  }
  return out
}

/** Aplica la máscara (ya del tamaño de la foto) como transparencia de la foto, en el lugar. */
export function applyAlpha(photo: Uint8ClampedArray, maskRgba: Uint8ClampedArray): Uint8ClampedArray {
  if (photo.length !== maskRgba.length) throw new Error('La máscara no coincide con la imagen')
  for (let i = 3; i < photo.length; i += 4) photo[i] = Math.round((photo[i] * maskRgba[i]) / 255)
  return photo
}

export type Background = { kind: 'transparent' } | { kind: 'color'; color: string }

/** Color de fondo válido (#rrggbb); cualquier otra cosa queda transparente. */
export function parseBackground(value: string): Background {
  return /^#[0-9a-f]{6}$/i.test(value) ? { kind: 'color', color: value.toLowerCase() } : { kind: 'transparent' }
}

/** Nombre del resultado: "foto.jpg" → "foto-sin-fondo.png" (siempre PNG, para conservar la transparencia). */
export function backgroundOutputName(name: string, suffix: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'imagen'
  return `${base}-${suffix}.png`
}

/** Une las partes descargadas en un solo buffer. */
export function joinParts(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/* ───────────── Fondo nuevo y pincel (W-147.5) ───────────── */

/**
 * Lo que va detrás del recorte: nada (transparente), un color, la misma foto difuminada o otra
 * imagen. La IA siempre entrega el recorte transparente; el fondo se pone después, así el pincel
 * puede corregir el recorte sin volver a pasar por el modelo.
 */
export type Backdrop = { kind: 'transparent' } | { kind: 'color'; color: string } | { kind: 'blur' } | { kind: 'image'; image: Blob }

/** Desenfoque del fondo difuminado: proporcional a la foto (en una de 3000 px, unos 50 px). */
export const blurPx = (width: number, height: number) => Math.max(4, Math.round(Math.max(width, height) / 60))

/** Parte de una imagen que llena un rectángulo sin deformarse (como `object-fit: cover`). */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number): { sx: number; sy: number; sw: number; sh: number } {
  const k = Math.max(dstW / srcW, dstH / srcH)
  const sw = dstW / k
  const sh = dstH / k
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh }
}

export type BrushMode = 'erase' | 'restore'
/** Un trazo del pincel en pixeles de la foto: borrar (transparente) o recuperar (vuelve el original). */
export type BrushStroke = { mode: BrushMode; radius: number; points: Array<[number, number]> }

/**
 * Los círculos que pinta un trazo: los puntos del mouse y, entre dos puntos alejados, círculos
 * intermedios a un tercio del radio, para que un movimiento rápido no deje huecos.
 */
export function strokeDabs(points: ReadonlyArray<[number, number]>, radius: number): Array<[number, number]> {
  if (!points.length) return []
  const step = Math.max(1, radius / 3)
  const out: Array<[number, number]> = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / step)
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  return out
}
