/**
 * Editar PDF: agrega texto, imágenes y formas sobre las páginas, como capas
 * nuevas. Las posiciones son fracciones (0 a 1) de la página tal como se ve,
 * igual que en Firmar y Censurar. La capa "erase" (Reemplazar texto, W-140) sí
 * quita del contenido de la página el texto original que cae dentro de ella.
 */
import { LineCapStyle, LineJoinStyle, PDFArray, PDFDocument, PDFName, PDFString, closePath, degrees, fill, lineTo, moveTo, popGraphicsState, pushGraphicsState, rgb, setFillingRgbColor, setLineCap, setLineJoin, setLineWidth, setStrokingRgbColor, stroke, type PDFImage, type PDFPage } from 'pdf-lib'
import { drawPieces, fontsForText, wrapPieces, type FontFamily, type FontSet } from '../../../shared/pdf/pdfFonts'
import { viewToPdf } from './pdfSign'
import { eraseText, type Zone } from './pdfContent'
import { loadPdf } from '../../security/core/openPdf'

export type FontName = 'helvetica' | 'times' | 'courier'
/**
 * `width`: ancho del párrafo (fracción de la página) para cortar las líneas largas, como un
 * párrafo reemplazado; `lineHeight`: interlineado en tamaños de letra (sin él, 1.2).
 */
export type TextItem = { kind: 'text'; page: number; x: number; y: number; text: string; size: number; color: string; font: FontName; bold: boolean; width?: number; lineHeight?: number }
/** `erase`: borra el texto original de la zona (si no lo encuentra, la tapa con `fill` o blanco). */
export type BoxKind = 'rect' | 'ellipse' | 'highlight' | 'whiteout' | 'erase'
export type BoxItem = { kind: BoxKind; page: number; x: number; y: number; w: number; h: number; stroke: string | null; fill: string | null; strokeWidth: number }
export type ImageItem = { kind: 'image'; page: number; x: number; y: number; w: number; h: number; data: Uint8Array; format: 'png' | 'jpg' }
/**
 * Dibujo a mano alzada (W-147.2): la caja (x, y, w, h) y los puntos como fracciones de esa caja,
 * así se mueve y se estira igual que una forma. `width`: grosor del trazo en puntos.
 */
export type InkItem = { kind: 'ink'; page: number; x: number; y: number; w: number; h: number; points: Array<[number, number]>; color: string; width: number }
/**
 * Línea o flecha (W-147.2): va de una esquina de la caja a la opuesta; `flipX`/`flipY` dicen desde
 * cuál (sin ellos, de arriba a la izquierda hacia abajo a la derecha). La flecha apunta al final.
 */
export type LineItem = { kind: 'line' | 'arrow'; page: number; x: number; y: number; w: number; h: number; flipX: boolean; flipY: boolean; color: string; width: number }
/** Enlace (W-147.2): zona que abre un sitio web (`url`) o lleva a una página del documento (`target`, desde 0). */
export type LinkItem = { kind: 'link'; page: number; x: number; y: number; w: number; h: number; url: string; target: number | null }
export type EditItem = TextItem | BoxItem | ImageItem | InkItem | LineItem | LinkItem

/** Distancia del borde superior de la caja a la línea base, en tamaños de letra (igual que el navegador con line-height 1.2). */
export const BASELINE: Record<FontName, number> = { helvetica: 1.005, times: 0.991, courier: 0.933 }
export const LINE_HEIGHT = 1.2

/** Con texto latino, la fuente estándar del PDF; con otros alfabetos, la libre de la misma familia. */
const FAMILY: Record<FontName, FontFamily> = { helvetica: 'sans', times: 'serif', courier: 'mono' }

/** "#RRGGBB" (o "#RGB") a color de pdf-lib; cualquier otra cosa, negro. */
export function hexToRgb(hex: string) {
  let h = hex.replace('#', '').trim()
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return rgb(0, 0, 0)
  const n = Number.parseInt(h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Las líneas del texto, con los tabuladores como cuatro espacios y sin espacios al final. */
export const textLines = (text: string) => text.split(/\r?\n/).map((l) => l.replace(/\t/g, '    ').trimEnd())

type Box = { x: number; y: number; width: number; height: number }
const quarterTurns = (rotation: number) => ((Math.round(rotation / 90) % 4) + 4) % 4

/** Rectángulo de la página vista (fracciones) en coordenadas del PDF, siempre alineado a los ejes. */
export function viewRectToPdf(x: number, y: number, w: number, h: number, box: Box, rotation: number) {
  const a = viewToPdf(x, y, box, rotation)
  const b = viewToPdf(x + w, y + h, box, rotation)
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }
}

export async function applyEdits(bytes: ArrayBuffer | Uint8Array, items: EditItem[]): Promise<Uint8Array> {
  if (!items.length) throw new Error('Agrega al menos un texto, una imagen o una forma.')
  if (items.every((i) => i.kind === 'link' && !linkAction(i))) throw new Error('Completa el enlace: escribe la dirección o elige la página.')
  const doc = await loadPdf(bytes)
  // Una carga de fuentes por familia, con todo el texto que se va a escribir en ella.
  const texts = items.filter((i): i is TextItem => i.kind === 'text')
  const fonts = new Map<FontName, FontSet>()
  for (const name of new Set(texts.map((t) => t.font))) {
    const mine = texts.filter((t) => t.font === name)
    const styles = mine.some((t) => t.bold) ? (['bold'] as const) : []
    fonts.set(name, await fontsForText(doc, FAMILY[name], styles, mine.map((t) => t.text).join('\n')))
  }
  const images = new Map<Uint8Array, PDFImage>()

  // Primero se borra el texto original de las zonas "erase", página por página.
  const erased = new Set<EditItem>()
  const erases = items.filter((i): i is BoxItem => i.kind === 'erase' && isPlaceable(i))
  for (const p of new Set(erases.map((e) => e.page))) {
    const page = doc.getPage(p)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const mine = erases.filter((e) => e.page === p)
    const zones: Zone[] = mine.map((e) => viewRectToPdf(e.x, e.y, e.w, e.h, box, rotation))
    let found: boolean[] = []
    try {
      found = eraseText(doc, p, zones)
    } catch {
      // Contenido que no se pudo leer: se tapa como antes.
    }
    mine.forEach((e, k) => found[k] && erased.add(e))
  }

  for (const item of items) {
    if (!isPlaceable(item) || erased.has(item)) continue
    const page = doc.getPage(item.page)
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const turns = quarterTurns(rotation)
    const viewH = turns % 2 ? box.width : box.height

    if (item.kind === 'text') {
      const set = fonts.get(item.font)!
      const viewW = turns % 2 ? box.height : box.width
      const style = item.bold ? 'bold' : 'regular'
      // Cada línea del texto; con ancho, las largas se cortan por palabras como en un párrafo.
      const rows = textLines(item.text).flatMap((line) => {
        const pieces = set.pieces(line, style)
        return item.width ? wrapPieces(pieces, item.size, item.width * viewW) : [pieces]
      })
      const lh = item.lineHeight ?? LINE_HEIGHT
      rows.forEach((pieces, i) => {
        if (!pieces.some((p) => !p.space)) return
        const v = item.y + (BASELINE[item.font] * item.size + i * lh * item.size) / viewH
        const at = viewToPdf(item.x, v, box, rotation)
        drawPieces(page, pieces, { x: at.x, y: at.y, size: item.size, color: hexToRgb(item.color), rotateDeg: turns * 90, degrees })
      })
    } else if (item.kind === 'image') {
      let img = images.get(item.data)
      if (!img) {
        img = item.format === 'png' ? await doc.embedPng(item.data) : await doc.embedJpg(item.data)
        images.set(item.data, img)
      }
      const viewW = turns % 2 ? box.height : box.width
      const anchor = viewToPdf(item.x, item.y + item.h, box, rotation)
      page.drawImage(img, { x: anchor.x, y: anchor.y, width: item.w * viewW, height: item.h * viewH, rotate: degrees(turns * 90) })
    } else if (item.kind === 'ink' || item.kind === 'line' || item.kind === 'arrow') {
      const pts = (item.kind === 'ink' ? inkPoints(item) : lineEnds(item)).map(([u, v]) => viewToPdf(u, v, box, rotation))
      strokePath(page, pts.map((q) => [q.x, q.y] as [number, number]), item.color, item.width)
      if (item.kind === 'arrow' && pts.length === 2) {
        const head = arrowHead([pts[0].x, pts[0].y], [pts[1].x, pts[1].y], item.width)
        fillPolygon(page, head, item.color)
      }
    } else if (item.kind === 'link') {
      const action = linkAction(item)
      if (action) addLink(doc, page, viewRectToPdf(item.x, item.y, item.w, item.h, box, rotation), action)
    } else {
      const r = viewRectToPdf(item.x, item.y, item.w, item.h, box, rotation)
      const style = boxStyle(item as BoxItem)
      if (item.kind === 'ellipse') {
        page.drawEllipse({ x: r.x + r.width / 2, y: r.y + r.height / 2, xScale: r.width / 2, yScale: r.height / 2, ...style })
      } else page.drawRectangle({ ...r, ...style })
    }
  }
  return doc.save()
}

/** Posición y tamaño numéricos y dentro de la página (una posición inválida haría fallar todo el guardado). */
export function isPlaceable(item: EditItem): boolean {
  const nums = item.kind === 'text' ? [item.x, item.y, item.size] : [item.x, item.y, item.w, item.h]
  return nums.every(Number.isFinite) && item.x >= 0 && item.y >= 0 && item.x <= 1 && item.y <= 1
}

function boxStyle(item: BoxItem) {
  if (item.kind === 'highlight') return { color: hexToRgb(item.fill ?? '#FDE047'), opacity: 0.4, borderWidth: 0 }
  if (item.kind === 'whiteout') return { color: rgb(1, 1, 1), borderWidth: 0 }
  if (item.kind === 'erase') return { color: item.fill ? hexToRgb(item.fill) : rgb(1, 1, 1), borderWidth: 0 }
  return {
    color: item.fill ? hexToRgb(item.fill) : undefined,
    borderColor: item.stroke ? hexToRgb(item.stroke) : undefined,
    borderWidth: item.stroke ? item.strokeWidth : 0,
  }
}

/* ───────────── Dibujo, líneas, flechas y enlaces (W-147.2) ───────────── */

type Pt = [number, number]
/** Una caja nunca mide cero (una línea horizontal tiene alto 0): así los puntos relativos no dividen por cero. */
const MIN_SPAN = 1e-4

/** Trazo a mano alzada desde los puntos de la página (fracciones), con su caja. null si es solo un toque. */
export function inkFromPoints(page: number, points: readonly Pt[], color: string, width: number): InkItem | null {
  if (points.length < 2) return null
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  const w = Math.max(MIN_SPAN, Math.max(...xs) - x)
  const h = Math.max(MIN_SPAN, Math.max(...ys) - y)
  if (w < 0.003 && h < 0.003) return null
  return { kind: 'ink', page, x, y, w, h, points: simplify(points).map(([u, v]) => [(u - x) / w, (v - y) / h]), color, width }
}

/** Los puntos del trazo en la página (fracciones), según dónde esté y cuánto mida su caja ahora. */
export const inkPoints = (it: InkItem): Pt[] => it.points.map(([u, v]) => [it.x + u * it.w, it.y + v * it.h])

/**
 * Quita los puntos casi en línea recta (Ramer–Douglas–Peucker): un trazo de 500 puntos del mouse
 * queda en unas decenas sin cambiar su forma, y el PDF pesa menos.
 */
export function simplify(points: readonly Pt[], tolerance = 0.0008): Pt[] {
  if (points.length < 3) return points.slice()
  const [a, b] = [points[0], points[points.length - 1]]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  let far = 0
  let at = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i][0] - dx * points[i][1] + b[0] * a[1] - b[1] * a[0]) / len
    if (d > far) {
      far = d
      at = i
    }
  }
  if (far <= tolerance) return [a, b]
  return [...simplify(points.slice(0, at + 1), tolerance).slice(0, -1), ...simplify(points.slice(at), tolerance)]
}

/** Línea o flecha de un punto a otro (fracciones de la página). null si es casi un punto. */
export function lineFromPoints(kind: 'line' | 'arrow', page: number, x1: number, y1: number, x2: number, y2: number, color: string, width: number): LineItem | null {
  if (Math.hypot(x2 - x1, y2 - y1) < 0.01) return null
  return { kind, page, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(MIN_SPAN, Math.abs(x2 - x1)), h: Math.max(MIN_SPAN, Math.abs(y2 - y1)), flipX: x2 < x1, flipY: y2 < y1, color, width }
}

/** Inicio y fin de la línea en la página (fracciones). */
export function lineEnds(it: LineItem): [Pt, Pt] {
  const left = it.x
  const right = it.x + it.w
  const top = it.y
  const bottom = it.y + it.h
  return [
    [it.flipX ? right : left, it.flipY ? bottom : top],
    [it.flipX ? left : right, it.flipY ? top : bottom],
  ]
}

/** Punta de flecha (triángulo) en el extremo `to`, proporcional al grosor de la línea. */
export function arrowHead(from: Pt, to: Pt, width: number): Pt[] {
  const len = Math.max(8, width * 4.5)
  const half = len * 0.45
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const d = Math.hypot(dx, dy) || 1
  const ux = dx / d
  const uy = dy / d
  const bx = to[0] - ux * len
  const by = to[1] - uy * len
  return [to, [bx - uy * half, by + ux * half], [bx + uy * half, by - ux * half]]
}

/**
 * Dirección segura para un enlace: http(s), correo o teléfono; "docusmart.online" pasa a
 * "https://docusmart.online". null para lo demás (javascript:, data:, archivos locales…).
 */
export function normalizeUrl(raw: string): string | null {
  const s = raw.trim()
  if (!s || /\s/.test(s)) return null
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s.length > 8 || /^(mailto|tel):./i.test(s) ? s : null
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null
  if (s.includes('@') && !s.includes('/')) return 'mailto:' + s
  return /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+(?:[/?#].*)?$/u.test(s) ? 'https://' + s : null
}

/** Qué hace el enlace: abrir una dirección o ir a una página. null si todavía no tiene ninguna. */
export function linkAction(it: LinkItem): { url: string } | { page: number } | null {
  if (it.target !== null && Number.isInteger(it.target) && it.target >= 0) return { page: it.target }
  const url = normalizeUrl(it.url)
  return url ? { url } : null
}

/** Trazo con puntas y uniones redondeadas (se ve igual que en la pantalla). */
function strokePath(page: PDFPage, pts: Pt[], color: string, width: number) {
  if (pts.length < 2) return
  const c = hexToRgb(color)
  page.pushOperators(
    pushGraphicsState(),
    setStrokingRgbColor(c.red, c.green, c.blue),
    setLineWidth(width),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    moveTo(pts[0][0], pts[0][1]),
    ...pts.slice(1).map(([x, y]) => lineTo(x, y)),
    stroke(),
    popGraphicsState(),
  )
}

function fillPolygon(page: PDFPage, pts: Pt[], color: string) {
  const c = hexToRgb(color)
  page.pushOperators(pushGraphicsState(), setFillingRgbColor(c.red, c.green, c.blue), moveTo(pts[0][0], pts[0][1]), ...pts.slice(1).map(([x, y]) => lineTo(x, y)), closePath(), fill(), popGraphicsState())
}

/** Anotación de enlace sin borde: abre la dirección o salta a la página (ajustada a la ventana). */
function addLink(doc: PDFDocument, page: PDFPage, r: { x: number; y: number; width: number; height: number }, action: { url: string } | { page: number }) {
  const target = 'page' in action ? doc.getPages()[Math.min(action.page, doc.getPageCount() - 1)] : null
  const annot = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [r.x, r.y, r.x + r.width, r.y + r.height],
    Border: [0, 0, 0],
    ...(target ? { Dest: [target.ref, 'Fit'] } : { A: { Type: 'Action', S: 'URI', URI: PDFString.of((action as { url: string }).url) } }),
  })
  const ref = doc.context.register(annot)
  const annots = page.node.lookup(PDFName.of('Annots'))
  if (annots instanceof PDFArray) annots.push(ref)
  else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]))
}
