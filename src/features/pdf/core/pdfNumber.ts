/**
 * Numerar páginas (W-146.1). El número se ubica en la página TAL COMO SE VE: respeta la
 * rotación de cada página (/Rotate) y su área visible (CropBox), así que en una página girada
 * o recortada sale derecho y dentro de lo visible. Opciones como las de PDF24 o iLovePDF:
 * 6 posiciones, número inicial, saltar las primeras páginas (portada), texto propio con
 * {n} y {total}, tamaño y color (W-147.6). Con texto no latino usa las fuentes incrustadas de DocuSmart.
 */
import { degrees } from 'pdf-lib'
import { drawPieces, fontsForText, piecesWidth } from '../../../shared/pdf/pdfFonts'
import { hexToRgb } from './pdfEdit'
import { loadPdf } from '../../security/core/openPdf'

export type NumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export const NUMBER_POSITIONS: readonly NumberPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']

export type NumberOptions = {
  position: NumberPosition
  /** Texto de cada página: {n} es el número y {total} el último número. */
  template: string
  /** Número de la primera página numerada. */
  start: number
  /** Cuántas páginas del inicio quedan sin número (por ejemplo, la portada). */
  skip: number
  /** Tamaño de la letra en puntos. */
  size: number
  /** Color del número, en hexadecimal (#RRGGBB). */
  color: string
}

export const DEFAULT_NUMBER_OPTIONS: NumberOptions = { position: 'bottom-center', template: '{n}', start: 1, skip: 0, size: 10, color: '#555555' }

const EDGE = 24
const SIDE = 36

/** El texto de cada página (null en las que quedan sin número). */
export function pageLabels(pageCount: number, o: Pick<NumberOptions, 'template' | 'start' | 'skip'>): Array<string | null> {
  const skip = Math.max(0, Math.min(pageCount, Math.floor(o.skip)))
  const start = Math.floor(o.start)
  const total = start + (pageCount - skip) - 1
  const template = o.template.includes('{n}') ? o.template : `${o.template} {n}`.trim()
  return Array.from({ length: pageCount }, (_, i) =>
    i < skip ? null : template.replaceAll('{n}', String(start + i - skip)).replaceAll('{total}', String(total)),
  )
}

/**
 * Convierte un punto de la página como se ve (u desde la izquierda, v desde abajo) a las
 * coordenadas del PDF, para una caja visible (x, y, w, h) y una rotación de 0, 90, 180 o 270.
 */
export function toPdfPoint(u: number, v: number, box: { x: number; y: number; width: number; height: number }, rotation: number): { x: number; y: number } {
  const { x, y, width: w, height: h } = box
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { x: x + w - v, y: y + u }
    case 180:
      return { x: x + w - u, y: y + h - v }
    case 270:
      return { x: x + v, y: y + h - u }
    default:
      return { x: x + u, y: y + v }
  }
}

export async function numberPages(bytes: ArrayBuffer | Uint8Array, opts: Partial<NumberOptions> = {}): Promise<Uint8Array> {
  const o = { ...DEFAULT_NUMBER_OPTIONS, ...opts }
  const size = Math.max(6, Math.min(36, o.size))
  const doc = await loadPdf(bytes)
  const labels = pageLabels(doc.getPageCount(), o)
  const color = hexToRgb(/^#[0-9a-f]{6}$/i.test(o.color) ? o.color : DEFAULT_NUMBER_OPTIONS.color)
  const fonts = await fontsForText(doc, 'sans', ['regular'], labels.filter(Boolean).join(' ') || '0')
  doc.getPages().forEach((page, i) => {
    const label = labels[i]
    if (!label) return
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const turned = ((rotation % 180) + 180) % 180 === 90
    // Tamaño de la página como se ve.
    const W = turned ? box.height : box.width
    const H = turned ? box.width : box.height
    const pieces = fonts.pieces(label, 'regular')
    const tw = piecesWidth(pieces, size)
    const [vert, horiz] = o.position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']
    const u = horiz === 'left' ? SIDE : horiz === 'right' ? W - tw - SIDE : (W - tw) / 2
    const v = vert === 'bottom' ? EDGE : H - EDGE - size * 0.75
    const { x, y } = toPdfPoint(u, v, box, rotation)
    drawPieces(page, pieces, { x, y, size, color, rotateDeg: ((rotation % 360) + 360) % 360, degrees })
  })
  return doc.save()
}
