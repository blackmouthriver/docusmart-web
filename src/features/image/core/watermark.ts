/**
 * Marca de agua en imágenes (W-123): dónde y de qué tamaño va el texto o el logo.
 * Partes puras (sin canvas), para poder probarlas; el dibujo está en infra/watermarkCanvas.ts.
 */

export const WATERMARK_POSITIONS = ['tl', 'tc', 'tr', 'ml', 'c', 'mr', 'bl', 'bc', 'br', 'diagonal', 'tile'] as const
export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number]

/** Ángulo de la marca en diagonal y en mosaico (en radianes, sube hacia la derecha). */
export const DIAGONAL = -Math.PI / 6

/** Separación con el borde: 3 % del lado más corto de la imagen. */
export const edgeMargin = (imgW: number, imgH: number) => Math.round(Math.min(imgW, imgH) * 0.03)

/** Un porcentaje dentro de sus límites (o el valor por defecto si no es un número). */
export function clampPercent(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Tamaño de la marca: su ancho es `percent` % del ancho de la imagen, sin pasarse del alto. */
export function markSize(imgW: number, imgH: number, markW: number, markH: number, percent: number): { width: number; height: number } {
  if (markW <= 0 || markH <= 0) return { width: 0, height: 0 }
  let width = (imgW * clampPercent(percent, 1, 100, 25)) / 100
  let height = (width * markH) / markW
  if (height > imgH) {
    height = imgH
    width = (height * markW) / markH
  }
  return { width, height }
}

/** Centro de la marca y su giro, para una posición que no es el mosaico. */
export function markPlacement(imgW: number, imgH: number, markW: number, markH: number, pos: Exclude<WatermarkPosition, 'tile'>): { cx: number; cy: number; angle: number } {
  if (pos === 'diagonal') return { cx: imgW / 2, cy: imgH / 2, angle: DIAGONAL }
  const m = edgeMargin(imgW, imgH)
  const col = pos === 'tl' || pos === 'ml' || pos === 'bl' ? 0 : pos === 'tc' || pos === 'c' || pos === 'bc' ? 1 : 2
  const row = pos[0] === 't' ? 0 : pos[0] === 'b' ? 2 : 1
  const cx = col === 0 ? m + markW / 2 : col === 1 ? imgW / 2 : imgW - m - markW / 2
  const cy = row === 0 ? m + markH / 2 : row === 1 ? imgH / 2 : imgH - m - markH / 2
  return { cx, cy, angle: 0 }
}

/**
 * Centros de las copias del mosaico (todas giradas en DIAGONAL): una cuadrícula que, girada,
 * sigue cubriendo toda la imagen, con filas alternadas para que no queden columnas.
 */
export function tileCenters(imgW: number, imgH: number, markW: number, markH: number): Array<{ cx: number; cy: number }> {
  if (markW <= 0 || markH <= 0) return []
  const stepX = markW * 1.6
  const stepY = Math.max(markH * 3, markW * 0.5)
  // La diagonal de la imagen alcanza para cubrirla girada en cualquier ángulo.
  const reach = Math.hypot(imgW, imgH) / 2 + Math.max(stepX, stepY)
  const cos = Math.cos(DIAGONAL)
  const sin = Math.sin(DIAGONAL)
  const out: Array<{ cx: number; cy: number }> = []
  let row = 0
  for (let v = -reach; v <= reach; v += stepY, row++) {
    for (let u = -reach + (row % 2 ? stepX / 2 : 0); u <= reach; u += stepX) {
      // Del sistema girado al de la imagen.
      const cx = imgW / 2 + u * cos - v * sin
      const cy = imgH / 2 + u * sin + v * cos
      // Solo las que tocan la imagen.
      if (cx > -markW && cx < imgW + markW && cy > -markW && cy < imgH + markW) out.push({ cx, cy })
    }
  }
  return out
}

/** Color #rrggbb válido o el blanco. */
export const parseColor = (value: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : '#ffffff')

/** ¿Es un color claro? (para elegir una sombra que lo haga legible sobre cualquier foto). */
export function isLight(hex: string): boolean {
  const c = parseColor(hex)
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}
