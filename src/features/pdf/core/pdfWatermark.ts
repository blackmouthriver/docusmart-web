/**
 * Marca de agua (W-146.2). Se dibuja en la página TAL COMO SE VE: respeta la rotación de cada
 * página y su área visible (antes salía de cabeza en páginas giradas 180° y fuera de lo visible
 * en páginas recortadas). Opciones como las de iLovePDF o Adobe: texto o imagen (logo),
 * 9 posiciones o mosaico, rotación, transparencia, tamaño, color, encima o detrás del
 * contenido y qué páginas.
 */
import { PDFArray, PDFDocument, PDFName, degrees, type PDFImage, type PDFPage, type PDFRef } from 'pdf-lib'
import { drawPieces, fontsForText, piecesWidth, type FontSet, type Piece } from '../../../shared/pdf/pdfFonts'
import { hexToRgb } from './pdfEdit'
import { toPdfPoint } from './pdfNumber'

export type WatermarkPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'mosaic'
export const WATERMARK_POSITIONS: readonly WatermarkPosition[] = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']
export type WatermarkSize = 'small' | 'medium' | 'large'

export type WatermarkOptions = {
  /** Texto de la marca (si no hay imagen). */
  text: string
  /** Imagen o logo: reemplaza al texto. */
  image?: { data: Uint8Array; format: 'png' | 'jpg' }
  position: WatermarkPosition
  /** Giro en grados, en sentido contrario a las agujas del reloj (45 = diagonal hacia arriba). */
  rotation: number
  /** 0 (invisible) a 1 (opaca). */
  opacity: number
  size: WatermarkSize
  /** "#RRGGBB" (solo para texto). */
  color: string
  /** Encima del contenido o detrás (detrás no se ve sobre páginas escaneadas, que son una imagen). */
  layer: 'over' | 'under'
  /** Páginas (base 0); todas si se omite. */
  pages?: number[]
}

export const DEFAULT_WATERMARK: WatermarkOptions = { text: 'DocuSmart', position: 'center', rotation: 45, opacity: 0.2, size: 'medium', color: '#2563EB', layer: 'over' }

/** Ancho de la marca como fracción del lado menor de la página vista. */
const WIDTH: Record<WatermarkSize, number> = { small: 0.3, medium: 0.55, large: 0.85 }
const MARGIN = 0.05

type Mark = { width: number; height: number; draw: (page: PDFPage, x: number, y: number, rotateDeg: number) => void }

/**
 * Centro de cada copia de la marca (u, v desde abajo a la izquierda de la página vista), para una
 * marca de ancho w y alto h girada `rotation` grados en una página de W × H.
 */
export function markCenters(position: WatermarkPosition, W: number, H: number, w: number, h: number, rotation: number): Array<[number, number]> {
  const a = (rotation * Math.PI) / 180
  // Medio ancho y medio alto del rectángulo que ocupa la marca girada.
  const ex = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2
  const ey = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2
  if (position === 'mosaic') {
    const stepX = Math.max(2 * ex * 1.35, W / 6)
    const stepY = Math.max(2 * ey * 1.6, H / 8)
    const centers: Array<[number, number]> = []
    for (let row = 0, v = stepY / 2; v < H; row++, v += stepY)
      for (let u = (row % 2 ? stepX : stepX / 2); u < W + stepX / 2; u += stepX) centers.push([u, v])
    return centers
  }
  const m = MARGIN * Math.min(W, H)
  const [vert, horiz] = position === 'center' ? ['middle', 'center'] : position.split('-')
  const u = horiz === 'left' ? m + ex : horiz === 'right' ? W - m - ex : W / 2
  const v = vert === 'bottom' ? m + ey : vert === 'top' ? H - m - ey : H / 2
  return [[u, v]]
}

async function makeMark(doc: PDFDocument, o: WatermarkOptions): Promise<(W: number, H: number) => Mark> {
  if (o.image) {
    const img: PDFImage = o.image.format === 'png' ? await doc.embedPng(o.image.data) : await doc.embedJpg(o.image.data)
    const aspect = img.width / img.height
    return (W, H) => {
      const width = WIDTH[o.size] * (o.position === 'mosaic' ? 0.5 : 1) * Math.min(W, H)
      const height = width / aspect
      return { width, height, draw: (page, x, y, rotateDeg) => page.drawImage(img, { x, y, width, height, opacity: o.opacity, rotate: degrees(rotateDeg) }) }
    }
  }
  const wanted = o.text.replace(/\s+/g, ' ').trim() || DEFAULT_WATERMARK.text
  const fonts: FontSet = await fontsForText(doc, 'sans', ['bold'], wanted)
  let pieces: Piece[] = fonts.pieces(wanted, 'bold')
  if (!pieces.some((p) => !p.space)) pieces = fonts.pieces(DEFAULT_WATERMARK.text, 'bold')
  const at1 = piecesWidth(pieces, 1) || 1
  const color = hexToRgb(o.color)
  return (W, H) => {
    const width = WIDTH[o.size] * (o.position === 'mosaic' ? 0.5 : 1) * Math.min(W, H)
    const size = width / at1
    // Alto de las mayúsculas, para centrar la línea.
    const height = size * 0.72
    return { width, height, draw: (page, x, y, rotateDeg) => drawPieces(page, pieces, { x, y, size, color, opacity: o.opacity, rotateDeg, degrees }) }
  }
}

/** Referencias a los contenidos de la página (para mover la marca detrás). */
function contentRefs(page: PDFPage): PDFRef[] {
  const c = page.node.get(PDFName.of('Contents'))
  if (c instanceof PDFArray) return c.asArray() as PDFRef[]
  return c ? [c as PDFRef] : []
}

export async function watermarkPdf(bytes: ArrayBuffer | Uint8Array, opts: Partial<WatermarkOptions> = {}): Promise<Uint8Array> {
  const o = { ...DEFAULT_WATERMARK, ...opts, opacity: Math.min(1, Math.max(0.02, opts.opacity ?? DEFAULT_WATERMARK.opacity)) }
  const doc = await PDFDocument.load(bytes)
  const markFor = await makeMark(doc, o)
  const indices = o.pages?.length ? o.pages.filter((i) => i >= 0 && i < doc.getPageCount()) : doc.getPageIndices()
  for (const i of indices) {
    const page = doc.getPage(i)
    const box = page.getCropBox()
    const turn = ((page.getRotation().angle % 360) + 360) % 360
    const turned = turn % 180 === 90
    const W = turned ? box.height : box.width
    const H = turned ? box.width : box.height
    const mark = markFor(W, H)
    const a = (o.rotation * Math.PI) / 180
    const before = contentRefs(page)
    for (const [cu, cv] of markCenters(o.position, W, H, mark.width, mark.height, o.rotation)) {
      // Esquina inferior izquierda de la marca (línea base del texto), girada alrededor del centro.
      const u = cu - (mark.width / 2) * Math.cos(a) + (mark.height / 2) * Math.sin(a)
      const v = cv - (mark.width / 2) * Math.sin(a) - (mark.height / 2) * Math.cos(a)
      const { x, y } = toPdfPoint(u, v, box, turn)
      mark.draw(page, x, y, turn + o.rotation)
    }
    if (o.layer === 'under') {
      // pdf-lib agrega la marca al final (y envuelve lo original en q…Q): lo agregado pasa al
      // principio para que quede detrás.
      const refs = contentRefs(page)
      const added = refs.filter((r) => !before.includes(r))
      const rest = refs.filter((r) => before.includes(r))
      page.node.set(PDFName.of('Contents'), doc.context.obj([...added, ...rest]))
    }
  }
  return doc.save()
}
