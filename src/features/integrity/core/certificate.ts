/**
 * Certificado de integridad en PDF (W-105): deja constancia del nombre, tamaño y
 * hash de uno o varios archivos en una fecha. Si alguien cambia el archivo, aunque
 * sea un byte, su hash ya no coincide con el del certificado.
 *
 * Usa la Helvetica de PDF (sin incrustar fuentes, para que el PDF pese poco), que solo
 * cubre el alfabeto latino: los idiomas que no caben (ruso, japonés, coreano, chino)
 * usan los textos en inglés, y en los nombres de archivo lo que no cabe se reemplaza por "?".
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
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

/** Textos de respaldo cuando los del idioma no caben en la fuente del PDF. */
export const ENGLISH_LABELS: CertificateLabels = {
  title: 'File integrity certificate',
  intro: 'This certificate records the hash of each file. If a file changes, even by a single byte, its hash will no longer match.',
  date: 'Date',
  algorithm: 'Algorithm',
  file: 'File',
  size: 'Size',
  footer: 'Generated with DocuSmart (docusmart.online) on the device: the files were not uploaded.',
}

// Caracteres de WinAnsi (la codificación de Helvetica en PDF) fuera de Latin-1.
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'

function isWinAnsiChar(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch)
}

export function isWinAnsi(text: string): boolean {
  return [...text].every(isWinAnsiChar)
}

/** El texto con "?" en lugar de lo que la fuente no puede mostrar. */
export function toWinAnsi(text: string): string {
  return [...text].map((ch) => (isWinAnsiChar(ch) ? ch : '?')).join('')
}

/** Los textos del idioma si caben en la fuente; si no, los de inglés. */
export function printableLabels(labels: CertificateLabels): CertificateLabels {
  return Object.values(labels).every(isWinAnsi) ? labels : ENGLISH_LABELS
}

/** Corta el texto en líneas que caben en `width` (por palabras; parte las palabras muy largas). */
export function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const fits = (s: string) => font.widthOfTextAtSize(s, size) <= width
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (fits(candidate)) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    line = ''
    let rest = word
    while (!fits(rest)) {
      let n = rest.length - 1
      while (n > 1 && !fits(rest.slice(0, n))) n--
      lines.push(rest.slice(0, n))
      rest = rest.slice(n)
    }
    line = rest
  }
  if (line) lines.push(line)
  return lines
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
  const labels = printableLabels(opts.labels)
  const doc = await PDFDocument.create()
  doc.setTitle(labels.title)
  doc.setProducer('DocuSmart')
  doc.setCreator('DocuSmart — docusmart.online')
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)
  const width = PAGE[0] - MARGIN * 2

  let page: PDFPage = doc.addPage(PAGE)
  let y = PAGE[1] - MARGIN
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 30) {
      page = doc.addPage(PAGE)
      y = PAGE[1] - MARGIN
    }
  }
  const text = (s: string, font: PDFFont, size: number, color = INK, gap = 4) => {
    for (const line of wrapText(toWinAnsi(s), font, size, width)) {
      ensure(size + gap)
      y -= size
      page.drawText(line, { x: MARGIN, y, size, font, color })
      y -= gap
    }
  }

  page.drawRectangle({ x: MARGIN, y: y - 4, width: 40, height: 4, color: ACCENT })
  y -= 22
  text(labels.title, bold, 22, INK, 10)
  text(labels.intro, regular, 10.5, MUTED, 4)
  y -= 8
  text(`${labels.date}: ${opts.dateText}`, regular, 10.5)
  text(`${labels.algorithm}: ${opts.algorithm}`, regular, 10.5)
  y -= 10

  for (const r of opts.results) {
    ensure(70)
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + width, y }, thickness: 0.6, color: rgb(0.85, 0.87, 0.92) })
    y -= 14
    text(`${labels.file}: ${r.name}`, bold, 11, INK, 3)
    text(`${labels.size}: ${opts.formatSize(r.size)} (${r.size} bytes)`, regular, 9.5, MUTED, 5)
    // El hash en líneas de 64 caracteres (SHA-512 no cabe en una sola).
    for (const chunk of r.hash.match(/.{1,64}/g) ?? []) text(chunk, mono, 9.5, INK, 2)
    y -= 10
  }

  const pages = doc.getPages()
  pages.forEach((p, i) => {
    const footer = toWinAnsi(pages.length > 1 ? `${labels.footer}  ·  ${i + 1}/${pages.length}` : labels.footer)
    p.drawText(footer, { x: MARGIN, y: MARGIN - 20, size: 8, font: regular, color: MUTED, maxWidth: width })
  })
  return doc.save()
}
