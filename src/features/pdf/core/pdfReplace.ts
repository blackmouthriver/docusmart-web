/**
 * Reemplazar texto en Editar PDF (W-81). Un PDF no guarda párrafos editables sino
 * letras dibujadas, así que "reemplazar" una línea es: taparla con blanco y escribir
 * el texto nuevo en el mismo lugar y tamaño, con la fuente estándar más parecida.
 * Todo con capas de Editar PDF (pdfEdit.ts); el contenido original no se toca.
 */
import { BASELINE, type BoxItem, type FontName, type TextItem } from './pdfEdit'
import type { Family, TextFrag } from '../../convert/core/pdfWord'

/** Una línea de texto de la página, en puntos (y = línea base, desde arriba). */
export type TextLineBox = { text: string; x: number; y: number; w: number; size: number; bold: boolean; family: Family }

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
    } else {
      lines.push({ text: f.str, x: f.x, y: f.y, w: f.w, size: f.size, bold: f.bold, family: f.family, right: f.x + f.w })
    }
  }
  return lines.map(({ right: _r, ...l }) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text)
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
  return { x: line.x / pageW, y: top / pageH, w: line.w / pageW, h: (line.size * 1.25) / pageH }
}

/**
 * Las dos capas que reemplazan una línea: un tapado blanco un poco más grande que el
 * texto original y el texto (editable) con la misma posición, tamaño y estilo.
 */
export function replacementFor(line: TextLineBox, page: number, pageW: number, pageH: number): [BoxItem, TextItem] {
  const pad = line.size * 0.12
  const top = line.y - line.size * 0.95 - pad
  const bottom = line.y + line.size * 0.3 + pad
  const box: BoxItem = {
    kind: 'whiteout',
    page,
    x: Math.max(0, (line.x - pad) / pageW),
    y: Math.max(0, top / pageH),
    w: Math.min(1, (line.w + pad * 2) / pageW),
    h: Math.min(1, (bottom - top) / pageH),
    stroke: null,
    fill: null,
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
    color: '#1C1B1A',
    font,
    bold: line.bold,
  }
  return [box, text]
}
