/**
 * Certificado de integridad en PDF (W-105): deja constancia del nombre, tamaño y
 * hash de uno o varios archivos en una fecha. Si alguien cambia el archivo, aunque
 * sea un byte, su hash ya no coincide con el del certificado.
 *
 * Usa las fuentes incrustadas de los PDF de DocuSmart (Carlito y Cousine, más las de
 * chino, japonés y coreano cuando hacen falta), así los textos y los nombres de archivo
 * se ven en cualquier idioma.
 */
import { PDFDocument, rgb, type PDFPage } from 'pdf-lib'
import { loadFonts, wrapPieces, drawPieces, type FontSet, type FontStyle } from '../../../shared/pdf/pdfFonts'
import type { HashAlgorithm, HashResult } from './hash'

export type CertificateLabels = {
  title: string
  intro: string
  date: string
  algorithm: string
  file: string
  size: string
  footer: string
}

const PAGE: [number, number] = [595.28, 841.89] // A4
const MARGIN = 56
const INK = rgb(0.07, 0.09, 0.16)
const MUTED = rgb(0.38, 0.42, 0.5)
const ACCENT = rgb(0.24, 0.35, 0.95)

export async function integrityCertificate(opts: {
  labels: CertificateLabels
  results: readonly HashResult[]
  algorithm: HashAlgorithm
  /** Fecha ya formateada en el idioma del usuario. */
  dateText: string
  /** Tamaño ya formateado ("1,2 MB"), en el idioma del usuario. */
  formatSize: (bytes: number) => string
}): Promise<Uint8Array> {
  const labels = opts.labels
  const doc = await PDFDocument.create()
  doc.setTitle(labels.title)
  doc.setProducer('DocuSmart')
  doc.setCreator('DocuSmart — docusmart.online')
  const all = [...Object.values(labels), opts.dateText, ...opts.results.map((r) => r.name)].join(' ')
  const sans = await loadFonts(doc, 'sans', ['bold'], all)
  const mono = await loadFonts(doc, 'mono', [], '')
  const width = PAGE[0] - MARGIN * 2

  let page: PDFPage = doc.addPage(PAGE)
  let y = PAGE[1] - MARGIN
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 30) {
      page = doc.addPage(PAGE)
      y = PAGE[1] - MARGIN
    }
  }
  const text = (s: string, fonts: FontSet, style: FontStyle, size: number, color = INK, gap = 4) => {
    for (const line of wrapPieces(fonts.pieces(s, style), size, width)) {
      ensure(size + gap)
      y -= size
      drawPieces(page, line, { x: MARGIN, y, size, color })
      y -= gap
    }
  }

  page.drawRectangle({ x: MARGIN, y: y - 4, width: 40, height: 4, color: ACCENT })
  y -= 22
  text(labels.title, sans, 'bold', 22, INK, 10)
  text(labels.intro, sans, 'regular', 10.5, MUTED, 4)
  y -= 8
  text(`${labels.date}: ${opts.dateText}`, sans, 'regular', 10.5)
  text(`${labels.algorithm}: ${opts.algorithm}`, sans, 'regular', 10.5)
  y -= 10

  for (const r of opts.results) {
    ensure(70)
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + width, y }, thickness: 0.6, color: rgb(0.85, 0.87, 0.92) })
    y -= 14
    text(`${labels.file}: ${r.name}`, sans, 'bold', 11, INK, 3)
    text(`${labels.size}: ${opts.formatSize(r.size)} (${r.size} bytes)`, sans, 'regular', 9.5, MUTED, 5)
    // El hash en líneas de 64 caracteres (SHA-512 no cabe en una sola).
    for (const chunk of r.hash.match(/.{1,64}/g) ?? []) text(chunk, mono, 'regular', 9.5, INK, 2)
    y -= 10
  }

  const pages = doc.getPages()
  pages.forEach((p, i) => {
    const footer = pages.length > 1 ? `${labels.footer}  ·  ${i + 1}/${pages.length}` : labels.footer
    const lines = wrapPieces(sans.pieces(footer), 8, width)
    lines.forEach((line, j) => drawPieces(p, line, { x: MARGIN, y: MARGIN - 20 - j * 10, size: 8, color: MUTED }))
  })
  return doc.save()
}
