/**
 * Reemplazar texto en Editar PDF (W-81, W-140). Un PDF no guarda párrafos editables sino
 * letras dibujadas, así que "reemplazar" un párrafo es: borrar del contenido de la página el
 * texto original (capa "erase"; si no se puede, se tapa con el color de fondo) y escribir el
 * texto nuevo en el mismo lugar, tamaño, color e interlineado, cortado al mismo ancho.
 */
import { BASELINE, type BoxItem, type FontName, type TextItem } from './pdfEdit'
import type { Family, TextFrag } from '../../convert/core/pdfWord'

/** Una línea de texto de la página, en puntos (y = línea base, desde arriba). */
/** `color`: "RRGGBB" del texto original; `lines` y `gap`: líneas del párrafo y distancia entre sus líneas base. */
export type TextLineBox = { text: string; x: number; y: number; w: number; size: number; bold: boolean; family: Family; color?: string; lines?: number; gap?: number }

const FONT_OF: Record<Family, FontName> = { sans: 'helvetica', serif: 'times', mono: 'courier' }

/**
 * Agrupa los trozos de texto de una página en líneas: misma línea base (con tolerancia)
 * y sin un hueco grande entre trozos, para no unir dos columnas.
 */
export function groupLines(frags: readonly TextFrag[]): TextLineBox[] {
  const sorted = frags.filter((f) => f.str.trim()).slice().sort((a, b) => a.y - b.y || a.x - b.x)
  const lines: Array<TextLineBox & { right: number }> = []
  for (const f of sorted) {
    const last = lines.at(-1)
    const sameRow = last && Math.abs(f.y - last.y) < Math.max(f.size, last.size) * 0.35
    const gap = last ? f.x - last.right : 0
    if (last && sameRow && gap < Math.max(f.size, last.size) * 1.5 && gap > -last.size) {
      const space = gap > f.size * 0.15 && !last.text.endsWith(' ') && !f.str.startsWith(' ') ? ' ' : ''
      last.text += space + f.str
      last.right = Math.max(last.right, f.x + f.w)
      last.w = last.right - last.x
      last.size = Math.max(last.size, f.size)
      last.bold = last.bold && f.bold
      last.color ??= f.color
    } else {
      lines.push({ text: f.str, x: f.x, y: f.y, w: f.w, size: f.size, bold: f.bold, family: f.family, color: f.color, right: f.x + f.w })
    }
  }
  return lines.map(({ right: _r, ...l }) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text)
}

/**
 * Une en párrafos las líneas seguidas que empiezan a la misma altura, con la misma letra y un
 * interlineado normal, para reemplazar el párrafo entero y que el texto nuevo se reacomode.
 */
export function groupParagraphs(lines: readonly TextLineBox[]): TextLineBox[] {
  const out: Array<TextLineBox & { last: TextLineBox }> = []
  for (const l of lines) {
    const p = out.at(-1)
    const gap = p ? l.y - p.last.y : 0
    const same =
      p &&
      Math.abs(l.x - p.x) <= 0.6 * l.size &&
      Math.abs(l.size - p.size) <= 0.1 * p.size &&
      l.bold === p.bold &&
      l.family === p.family &&
      l.color === p.color &&
      gap >= 0.95 * l.size &&
      gap <= 1.9 * l.size &&
      (p.lines === 1 || Math.abs(gap - (p.gap ?? gap)) <= 0.15 * l.size)
    if (p && same) {
      // Palabra cortada con guion al final de la línea: se une sin espacio.
      p.text = /[\p{L}]-$/u.test(p.text) && /^\p{Ll}/u.test(l.text) ? p.text.slice(0, -1) + l.text : p.text + ' ' + l.text
      p.w = Math.max(p.x + p.w, l.x + l.w) - p.x
      p.gap = p.lines === 1 ? gap : p.gap
      p.lines = (p.lines ?? 1) + 1
      p.last = l
    } else out.push({ ...l, lines: 1, last: l })
  }
  return out.map(({ last: _l, ...p }) => p)
}

/**
 * Color de fondo detrás de un texto a partir de sus pixeles: el color claro más frecuente
 * (para tapar sin parche blanco cuando el texto no se puede borrar).
 */
export function backgroundColor(rgba: ArrayLike<number>, fallback = '#FFFFFF'): string {
  const count = new Map<number, number>()
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]
    count.set(key, (count.get(key) ?? 0) + 1)
  }
  let best = -1
  let n = 0
  for (const [k, c] of count) if (c > n) [best, n] = [k, c]
  return best < 0 ? fallback : '#' + best.toString(16).padStart(6, '0').toUpperCase()
}

/**
 * Color de la tinta de una línea a partir de sus pixeles (RGBA) en la vista previa:
 * el color oscuro más frecuente, ignorando el fondo claro y los bordes suavizados.
 * pdf.js no informa el color del texto, así que se mide en la imagen ya dibujada.
 */
export function inkColor(rgba: ArrayLike<number>, fallback = '#1C1B1A'): string {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const [r, g, b, a] = [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]
    if (a < 128 || 0.299 * r + 0.587 * g + 0.114 * b > 190) continue
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const s = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    s.n++
    s.r += r
    s.g += g
    s.b += b
    buckets.set(key, s)
  }
  let best: { n: number; r: number; g: number; b: number } | null = null
  for (const s of buckets.values()) if (!best || s.n > best.n) best = s
  if (!best) return fallback
  const hex = (v: number) => Math.round(v / best!.n).toString(16).padStart(2, '0')
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`.toUpperCase()
}

/** Caja de la línea en fracciones de la página (para dibujar la zona tocable). */
export function lineFrame(line: TextLineBox, pageW: number, pageH: number) {
  const top = line.y - line.size * 0.95
  const extra = ((line.lines ?? 1) - 1) * (line.gap ?? line.size * 1.2)
  return { x: line.x / pageW, y: top / pageH, w: line.w / pageW, h: (line.size * 1.25 + extra) / pageH }
}

/**
 * Las dos capas que reemplazan un párrafo (o una línea): el borrado del texto original, un
 * poco más grande que él (`background` es el color con que se tapa si no se puede borrar), y
 * el texto (editable) con la misma posición, tamaño, estilo, color e interlineado.
 */
export function replacementFor(line: TextLineBox, page: number, pageW: number, pageH: number, background: string | null = null): [BoxItem, TextItem] {
  const pad = line.size * 0.12
  const lines = line.lines ?? 1
  const gap = line.gap ?? line.size * 1.2
  const top = line.y - line.size * 0.95 - pad
  const bottom = line.y + (lines - 1) * gap + line.size * 0.3 + pad
  const box: BoxItem = {
    kind: 'erase',
    page,
    x: Math.max(0, (line.x - pad) / pageW),
    y: Math.max(0, top / pageH),
    w: Math.min(1, (line.w + pad * 2) / pageW),
    h: Math.min(1, (bottom - top) / pageH),
    stroke: null,
    fill: background,
    strokeWidth: 0,
  }
  const font = FONT_OF[line.family]
  const size = Math.round(line.size * 2) / 2
  const text: TextItem = {
    kind: 'text',
    page,
    x: line.x / pageW,
    y: Math.max(0, (line.y - BASELINE[font] * size) / pageH),
    text: line.text,
    size,
    color: line.color ? '#' + line.color : '#1C1B1A',
    font,
    bold: line.bold,
    // Un párrafo se corta al mismo ancho (con un poco de margen: la fuente puede ser más ancha) y con su interlineado.
    ...(lines > 1 ? { width: Math.min(1 - line.x / pageW, (line.w * 1.04) / pageW), lineHeight: gap / size } : {}),
  }
  return [box, text]
}
