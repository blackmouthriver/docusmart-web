import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { integrityCertificate, type CertificateLabels } from '../../../../../src/features/integrity/core/certificate'

async function pdfText(bytes: Uint8Array): Promise<string> {
  const doc = await getDocument({ data: bytes.slice() }).promise
  const tc = await (await doc.getPage(1)).getTextContent()
  return tc.items.map((it) => ('str' in it ? it.str : '')).join(' ')
}

const ES: CertificateLabels = {
  title: 'Certificado de integridad de archivos',
  intro: 'Este certificado registra el hash de cada archivo.',
  date: 'Fecha',
  algorithm: 'Algoritmo',
  file: 'Archivo',
  size: 'Tamaño',
  footer: 'Generado con DocuSmart en el dispositivo.',
}

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

  it('escribe los textos y los nombres en cualquier alfabeto', async () => {
    const pdf = await integrityCertificate({
      labels: { ...ES, title: 'ファイル整合性証明書', file: 'Файл', size: '크기' },
      results: [{ name: '契約書.pdf', size: 10, hash: 'b'.repeat(64) }],
      algorithm: 'SHA-256',
      dateText: '2026/11/20',
      formatSize,
    })
    const doc = await PDFDocument.load(pdf)
    expect(doc.getTitle()).toBe('ファイル整合性証明書')
    const text = (await pdfText(pdf)).replace(/ /g, '')
    for (const s of ['ファイル整合性証明書', 'Файл:', '契約書.pdf', '크기:', 'b'.repeat(64)]) expect(text).toContain(s)
  })

  it('agrega páginas cuando hay muchos archivos', async () => {
    const results = Array.from({ length: 40 }, (_, i) => ({ name: `archivo-${i}.pdf`, size: i, hash: 'c'.repeat(64) }))
    const pdf = await integrityCertificate({ labels: ES, results, algorithm: 'SHA-256', dateText: 'hoy', formatSize })
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThan(1)
  })
})
