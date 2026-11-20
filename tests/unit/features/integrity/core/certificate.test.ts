import { describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import {
  ENGLISH_LABELS,
  integrityCertificate,
  isWinAnsi,
  printableLabels,
  toWinAnsi,
  wrapText,
  type CertificateLabels,
} from '../../../../../src/features/integrity/core/certificate'

const ES: CertificateLabels = {
  title: 'Certificado de integridad de archivos',
  intro: 'Este certificado registra el hash de cada archivo.',
  date: 'Fecha',
  algorithm: 'Algoritmo',
  file: 'Archivo',
  size: 'Tamaño',
  footer: 'Generado con DocuSmart en el dispositivo.',
}

describe('textos del certificado', () => {
  it('isWinAnsi acepta latín con tildes y rechaza otros alfabetos', () => {
    expect(isWinAnsi('Tamaño, café, Größe, l·l, “hola” – €')).toBe(true)
    expect(isWinAnsi('Размер')).toBe(false)
    expect(isWinAnsi('ファイル')).toBe(false)
  })

  it('toWinAnsi reemplaza lo que no cabe por "?"', () => {
    expect(toWinAnsi('informe_年.pdf')).toBe('informe_?.pdf')
  })

  it('printableLabels usa inglés si algún texto no cabe', () => {
    expect(printableLabels(ES)).toBe(ES)
    expect(printableLabels({ ...ES, title: 'Сертификат' })).toBe(ENGLISH_LABELS)
  })

  it('wrapText corta por palabras y parte las muy largas', async () => {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const lines = wrapText('uno dos tres cuatro cinco seis siete', font, 10, 60)
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines) expect(font.widthOfTextAtSize(l, 10)).toBeLessThanOrEqual(60)
    const long = wrapText('x'.repeat(200), font, 10, 100)
    expect(long.join('')).toBe('x'.repeat(200))
    for (const l of long) expect(font.widthOfTextAtSize(l, 10)).toBeLessThanOrEqual(100)
  })
})

describe('integrityCertificate', () => {
  const formatSize = (n: number) => `${n} B`

  it('genera un PDF válido con los datos', async () => {
    const pdf = await integrityCertificate({
      labels: ES,
      results: [{ name: 'contrato.pdf', size: 1234, hash: 'a'.repeat(128) }],
      algorithm: 'SHA-512',
      dateText: '20 de noviembre de 2026',
      formatSize,
    })
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-')
    const doc = await PDFDocument.load(pdf)
    expect(doc.getPageCount()).toBe(1)
    expect(doc.getTitle()).toBe(ES.title)
  })

  it('usa inglés y no falla con nombres en otros alfabetos', async () => {
    const pdf = await integrityCertificate({
      labels: { ...ES, title: 'ファイル整合性証明書' },
      results: [{ name: '契約書.pdf', size: 10, hash: 'b'.repeat(64) }],
      algorithm: 'SHA-256',
      dateText: '2026/11/20',
      formatSize,
    })
    const doc = await PDFDocument.load(pdf)
    expect(doc.getTitle()).toBe(ENGLISH_LABELS.title)
  })

  it('agrega páginas cuando hay muchos archivos', async () => {
    const results = Array.from({ length: 40 }, (_, i) => ({ name: `archivo-${i}.pdf`, size: i, hash: 'c'.repeat(64) }))
    const pdf = await integrityCertificate({ labels: ES, results, algorithm: 'SHA-256', dateText: 'hoy', formatSize })
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThan(1)
  })
})
