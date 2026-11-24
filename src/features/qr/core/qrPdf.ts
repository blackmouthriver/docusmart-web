/**
 * QR en PDF (W-147.8): vectorial, del tamaño de impresión elegido, y una hoja A4 con varios QR
 * y su nombre debajo para imprimir y recortar. Los módulos se dibujan como rectángulos: se ve
 * nítido a cualquier tamaño.
 */
import QRCode from 'qrcode'
import { PDFDocument, rgb, type PDFImage, type PDFPage } from 'pdf-lib'
import { errorLevels, sheetLayout } from './qrDesign'
import { drawPieces, fontsForText, piecesWidth } from '../../../shared/pdf/pdfFonts'

/** Los módulos del QR (sin el margen): `dark(x, y)` es true en los cuadritos oscuros. */
export type QrMatrix = { size: number; dark: (x: number, y: number) => boolean }

/** Margen blanco alrededor, en módulos (el mismo de la imagen PNG). */
export const QUIET = 2
const MM = 72 / 25.4

/** La matriz del QR, con la corrección que corresponde (alta si lleva logo). */
export function qrMatrix(payload: string, hasLogo: boolean): QrMatrix {
  let failure: unknown = null
  for (const level of errorLevels(hasLogo)) {
    try {
      const m = QRCode.create(payload, { errorCorrectionLevel: level }).modules
      return { size: m.size, dark: (x, y) => !!m.get(y, x) }
    } catch (e) {
      failure = e
    }
  }
  throw failure
}

const color = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export type QrColors = { dark: string; background: string }

/**
 * Dibuja el QR en (x, y) —abajo a la izquierda— con lado `side` (margen incluido). Une los
 * módulos oscuros seguidos de cada fila en un solo rectángulo (archivo más chico y sin rayitas).
 */
export function drawQr(page: PDFPage, m: QrMatrix, x: number, y: number, side: number, c: QrColors, logo?: PDFImage) {
  const cell = side / (m.size + QUIET * 2)
  if (c.background !== 'transparent') page.drawRectangle({ x, y, width: side, height: side, color: color(c.background) })
  const dark = color(c.dark)
  for (let row = 0; row < m.size; row++) {
    let col = 0
    while (col < m.size) {
      if (!m.dark(col, row)) {
        col++
        continue
      }
      let end = col
      while (end + 1 < m.size && m.dark(end + 1, row)) end++
      // Un pelín más ancho y alto para que no queden líneas entre módulos al imprimir.
      page.drawRectangle({ x: x + (QUIET + col) * cell, y: y + side - (QUIET + row + 1) * cell - 0.01, width: (end - col + 1) * cell + 0.01, height: cell + 0.02, color: dark })
      col = end + 1
    }
  }
  if (logo) {
    // Como en la imagen: 22 % del lado, círculo blanco con un margen del 10 % alrededor.
    const logoSide = side * 0.22
    const cx = x + side / 2
    const cy = y + side / 2
    page.drawCircle({ x: cx, y: cy, size: logoSide / 2 + logoSide * 0.1, color: rgb(1, 1, 1) })
    page.drawImage(logo, { x: cx - logoSide / 2, y: cy - logoSide / 2, width: logoSide, height: logoSide })
  }
}

/** Un QR en una página de su mismo tamaño (`cm` de lado), listo para imprimir. `logoPng`: el logo ya recortado en círculo. */
export async function qrPdf(m: QrMatrix, opts: QrColors & { cm: number; logoPng?: Uint8Array | null; title?: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  if (opts.title) doc.setTitle(opts.title)
  const side = opts.cm * 10 * MM
  const page = doc.addPage([side, side])
  drawQr(page, m, 0, 0, side, opts, opts.logoPng ? await doc.embedPng(opts.logoPng) : undefined)
  return doc.save()
}

export type SheetItem = { matrix: QrMatrix; label: string }

/** Recorta el texto con "…" hasta que entre en `max` puntos (con la función que mide el ancho). */
export function fitText(text: string, max: number, width: (t: string) => number): string {
  if (width(text) <= max) return text
  const chars = Array.from(text)
  while (chars.length > 1 && width(chars.join('') + '…') > max) chars.pop()
  return chars.join('') + '…'
}

/** Escribe el nombre centrado debajo de cada QR, con fuentes que admiten cualquier idioma. */
async function labelWriter(doc: PDFDocument, texts: string[]) {
  const fonts = await fontsForText(doc, 'sans', ['regular'], texts.join(' ') || 'a')
  const size = 9
  return (page: PDFPage, text: string, cx: number, y: number, maxWidth: number) => {
    const fitted = fitText(text, maxWidth, (t) => piecesWidth(fonts.pieces(t, 'regular'), size))
    const pieces = fonts.pieces(fitted, 'regular')
    drawPieces(page, pieces, { x: cx - piecesWidth(pieces, size) / 2, y, size, color: rgb(0.2, 0.2, 0.2) })
  }
}

/** Hoja A4 con todos los QR (de `cm` de lado), varios por página, con su nombre debajo. */
export async function qrSheetPdf(items: SheetItem[], opts: QrColors & { cm: number; logoPng?: Uint8Array | null; title?: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  if (opts.title) doc.setTitle(opts.title)
  const logo = opts.logoPng ? await doc.embedPng(opts.logoPng) : undefined
  const labels = items.map((it) => it.label).filter(Boolean)
  const write = labels.length ? await labelWriter(doc, labels) : null
  const L = sheetLayout(opts.cm)
  const margin = 12 * MM
  const perPage = L.cols * L.rows
  let page: PDFPage | null = null
  items.forEach((it, i) => {
    const k = i % perPage
    if (k === 0) page = doc.addPage([595.28, 841.89])
    const col = k % L.cols
    const row = Math.floor(k / L.cols)
    const x = margin + col * (L.side + L.gapX)
    const top = 841.89 - margin - row * (L.side + L.label + L.gapY)
    drawQr(page!, it.matrix, x, top - L.side, L.side, opts, logo)
    if (write && it.label) write(page!, it.label, x + L.side / 2, top - L.side - 10, L.side)
  })
  return doc.save()
}
