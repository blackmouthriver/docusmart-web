/**
 * Escáner de documentos sin librerías pesadas: detectar el papel en la foto,
 * enderezar la perspectiva y mejorar la imagen. Todo trabaja sobre pixeles
 * RGBA (como ImageData) para poder probarlo sin canvas.
 */
import { PDFDocument } from 'pdf-lib'

export type Pixels = { data: Uint8ClampedArray; width: number; height: number }
export type Point = { x: number; y: number }
/** Esquinas en orden: arriba-izquierda, arriba-derecha, abajo-derecha, abajo-izquierda. */
export type Quad = [Point, Point, Point, Point]
export type ScanFilter = 'original' | 'gris' | 'documento' | 'bn'

/** Lado máximo del resultado: ~200 ppp para una hoja A4, nítido y liviano. */
export const MAX_OUTPUT_SIDE = 2400

/* ───────────── Utilidades de imagen ───────────── */

export function toGray(p: Pixels): Float32Array {
  const g = new Float32Array(p.width * p.height)
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = 0.299 * p.data[j] + 0.587 * p.data[j + 1] + 0.114 * p.data[j + 2]
  return g
}

/** Desenfoque de caja separable de radio r (promedio del vecindario), O(n) por pasada. */
export function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r < 1) return src.slice()
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const pass = (from: Float32Array, to: Float32Array, len: number, lines: number, at: (line: number, i: number) => number) => {
    for (let line = 0; line < lines; line++) {
      let sum = 0
      // Bordes: se repite el pixel del extremo.
      for (let i = -r; i <= r; i++) sum += from[at(line, Math.min(len - 1, Math.max(0, i)))]
      for (let i = 0; i < len; i++) {
        to[at(line, i)] = sum / (2 * r + 1)
        sum += from[at(line, Math.min(len - 1, i + r + 1))] - from[at(line, Math.max(0, i - r))]
      }
    }
  }
  pass(src, tmp, w, h, (y, x) => y * w + x)
  pass(tmp, out, h, w, (x, y) => y * w + x)
  return out
}

/** Umbral de Otsu: el valor que mejor separa dos grupos (papel claro y fondo). */
export function otsu(gray: Float32Array): number {
  const hist = new Array<number>(256).fill(0)
  for (const v of gray) hist[Math.min(255, Math.max(0, Math.round(v)))]++
  const total = gray.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0
  let wB = 0
  let best = 0
  let threshold = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (!wB) continue
    const wF = total - wB
    if (!wF) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > best) {
      best = between
      threshold = t
    }
  }
  return threshold
}

/* ───────────── Detectar el documento ───────────── */

/**
 * Busca el papel: la zona clara más grande (umbral de Otsu sobre la imagen
 * suavizada) y sus 4 esquinas extremas. Devuelve fracciones (0 a 1) de la
 * imagen, o null si no hay un documento claro (muy chico o toda la foto).
 * Conviene pasar una versión pequeña de la foto (unos 400 px de lado).
 */
export function detectDocument(p: Pixels): Quad | null {
  const { width: w, height: h } = p
  const gray = boxBlur(toGray(p), w, h, Math.max(1, Math.round(Math.min(w, h) / 120)))
  const t = otsu(gray)
  const mask = new Uint8Array(w * h)
  for (let i = 0; i < mask.length; i++) mask[i] = gray[i] > t ? 1 : 0

  // Componente conexa más grande (4 vecinos), con una pila para no desbordar la recursión.
  const label = new Int32Array(w * h).fill(-1)
  let bestSize = 0
  let bestLabel = -1
  const stack = new Int32Array(w * h)
  let current = 0
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start] !== -1) continue
    let top = 0
    stack[top++] = start
    label[start] = current
    let size = 0
    while (top) {
      const i = stack[--top]
      size++
      const x = i % w
      const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]
      for (const n of neighbors) {
        if (n < 0 || n >= mask.length || !mask[n] || label[n] !== -1) continue
        label[n] = current
        stack[top++] = n
      }
    }
    if (size > bestSize) {
      bestSize = size
      bestLabel = current
    }
    current++
  }
  const fraction = bestSize / (w * h)
  if (fraction < 0.12 || fraction > 0.97) return null

  // Esquinas: extremos de x+y y x−y dentro de la zona.
  let tl = { x: 0, y: 0, s: Infinity }
  let br = { x: 0, y: 0, s: -Infinity }
  let tr = { x: 0, y: 0, s: -Infinity }
  let bl = { x: 0, y: 0, s: Infinity }
  for (let i = 0; i < label.length; i++) {
    if (label[i] !== bestLabel) continue
    const x = i % w
    const y = (i - x) / w
    if (x + y < tl.s) tl = { x, y, s: x + y }
    if (x + y > br.s) br = { x, y, s: x + y }
    if (x - y > tr.s) tr = { x, y, s: x - y }
    if (x - y < bl.s) bl = { x, y, s: x - y }
  }
  const f = (q: { x: number; y: number }): Point => ({ x: (q.x + 0.5) / w, y: (q.y + 0.5) / h })
  return [f(tl), f(tr), f(br), f(bl)]
}

/** Recuadro por defecto cuando no se detecta el documento: casi toda la foto. */
export const insetQuad = (m = 0.04): Quad => [
  { x: m, y: m },
  { x: 1 - m, y: m },
  { x: 1 - m, y: 1 - m },
  { x: m, y: 1 - m },
]

/* ───────────── Enderezar la perspectiva ───────────── */

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Tamaño del documento enderezado (en pixeles), sin pasar de maxSide. */
export function outputSize(q: Quad, maxSide = MAX_OUTPUT_SIDE): { width: number; height: number } {
  const width = Math.max(dist(q[0], q[1]), dist(q[3], q[2]))
  const height = Math.max(dist(q[0], q[3]), dist(q[1], q[2]))
  const k = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) }
}

/** Resuelve A·x = b (8×8) por eliminación de Gauss con pivoteo parcial. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-12) throw new Error('Las esquinas no forman un cuadrilátero válido.')
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const k = M[r][c] / M[c][c]
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]
    }
  }
  return M.map((row, i) => row[n] / row[i])
}

/**
 * Homografía que lleva el rectángulo de salida (0..W, 0..H) a las esquinas del
 * documento en la foto: x = (a·u + b·v + c) / (g·u + h·v + 1), igual para y.
 */
export function homography(quad: Quad, W: number, H: number): (u: number, v: number) => Point {
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ]
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = dst[i]
    const { x, y } = quad[i]
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x])
    b.push(x)
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y])
    b.push(y)
  }
  const [a, bb, c, d, e, f, g, h] = solve(A, b)
  return (u, v) => {
    const z = g * u + h * v + 1
    return { x: (a * u + bb * v + c) / z, y: (d * u + e * v + f) / z }
  }
}

/** Endereza el documento: `quad` en pixeles de la imagen de origen. Interpolación bilineal. */
export function warpPerspective(src: Pixels, quad: Quad, width: number, height: number): Pixels {
  const map = homography(quad, width, height)
  const out = new Uint8ClampedArray(width * height * 4)
  const { data, width: sw, height: sh } = src
  for (let v = 0; v < height; v++) {
    for (let u = 0; u < width; u++) {
      const p = map(u + 0.5, v + 0.5)
      const x = Math.min(sw - 1, Math.max(0, p.x - 0.5))
      const y = Math.min(sh - 1, Math.max(0, p.y - 0.5))
      const x0 = Math.floor(x)
      const y0 = Math.floor(y)
      const x1 = Math.min(sw - 1, x0 + 1)
      const y1 = Math.min(sh - 1, y0 + 1)
      const fx = x - x0
      const fy = y - y0
      const o = (v * width + u) * 4
      for (let c = 0; c < 4; c++) {
        const top = data[(y0 * sw + x0) * 4 + c] * (1 - fx) + data[(y0 * sw + x1) * 4 + c] * fx
        const bottom = data[(y1 * sw + x0) * 4 + c] * (1 - fx) + data[(y1 * sw + x1) * 4 + c] * fx
        out[o + c] = top * (1 - fy) + bottom * fy
      }
    }
  }
  return { data: out, width, height }
}

/** Gira 90° en sentido horario. */
export function rotate90(p: Pixels): Pixels {
  const { width: w, height: h, data } = p
  const out = new Uint8ClampedArray(data.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      const d = (x * h + (h - 1 - y)) * 4
      out.set(data.subarray(s, s + 4), d)
    }
  }
  return { data: out, width: h, height: w }
}

/* ───────────── Filtros ───────────── */

/**
 * - gris: escala de grises.
 * - documento: divide por la iluminación de fondo (un desenfoque grande) para
 *   blanquear el papel y quitar sombras, y oscurece un poco el texto.
 * - bn: blanco y negro con umbral adaptativo (texto nítido, ideal para imprimir o enviar).
 */
export function applyFilter(p: Pixels, filter: ScanFilter): Pixels {
  if (filter === 'original') return p
  const { width: w, height: h } = p
  const gray = toGray(p)
  const out = new Uint8ClampedArray(p.data.length)
  let values: (i: number) => number
  if (filter === 'gris') values = (i) => gray[i]
  else {
    const bg = boxBlur(gray, w, h, Math.max(4, Math.round(Math.min(w, h) / 24)))
    values =
      filter === 'documento'
        ? (i) => 255 * Math.pow(Math.min(1, gray[i] / Math.max(1, bg[i] * 0.94)), 1.8)
        : (i) => (gray[i] < bg[i] * 0.86 ? 0 : 255)
  }
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
    const v = values(i)
    out[j] = out[j + 1] = out[j + 2] = v
    out[j + 3] = 255
  }
  return { data: out, width: w, height: h }
}

/* ───────────── PDF ───────────── */

export type ScannedPage = { jpg: Uint8Array; width: number; height: number }

/** Un PDF con una página por documento, de ancho A4 (595 pt) y alto proporcional. */
export async function scansToPdf(pages: ScannedPage[]): Promise<Uint8Array> {
  if (!pages.length) throw new Error('Agrega al menos una página.')
  const doc = await PDFDocument.create()
  doc.setTitle('Documento escaneado con DocuSmart')
  for (const p of pages) {
    const img = await doc.embedJpg(p.jpg)
    const width = 595
    const height = Math.round((595 * p.height) / p.width)
    doc.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height })
  }
  return doc.save()
}
