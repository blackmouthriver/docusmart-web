// Más Office (W-114): PowerPoint a PDF, PDF a PowerPoint y CSV ↔ Excel.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { strFromU8, unzipSync } from 'fflate'
import { PDFDocument, PDFName } from 'pdf-lib'
import { expect, makePdf, test } from './helpers'
import { writeXlsx } from '../../src/features/convert/core/pdfExcel'
import { writeDocx } from '../../src/features/convert/core/pdfWord'

async function convert(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(file)
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

test('Word a PDF: tamaño carta, títulos, viñetas, tabla y otros alfabetos (W-137)', async ({ page }) => {
  await page.goto('/word-a-pdf')
  const run = (text: string, o = {}) => ({ text, bold: false, italic: false, size: 11, family: 'serif' as const, ...o })
  const docx = writeDocx({
    page: { width: 612, height: 792 },
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
    bodySize: 11,
    bodyFamily: 'serif',
    bodyFont: 'Times New Roman',
    blocks: [
      { kind: 'para', runs: [run('Informe trimestral', { size: 18, bold: true })], align: 'center', heading: 1, bullet: false, indent: 0 },
      { kind: 'para', runs: [run('Resumen en español y Русский текст.')], align: 'left', heading: 0, bullet: false, indent: 0 },
      { kind: 'para', runs: [run('Primer punto')], align: 'left', heading: 0, bullet: true, indent: 0 },
      { kind: 'table', rows: [[[run('Mes', { bold: true })], [run('Total', { bold: true })]], [[run('Enero')], [run('1.200')]]], widths: [200, 100] },
    ],
  })
  const out = await convert(page, { name: 'informe.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(docx) })
  expect(out.name).toBe('informe.pdf')
  const pdf = await PDFDocument.load(out.bytes)
  expect(pdf.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
  // Times New Roman se dibuja con Tinos (mismas medidas), incrustada, y el ruso con la misma fuente.
  const fonts = pdf.context.enumerateIndirectObjects().map(([, o]) => String((o as { get?: (k: unknown) => unknown }).get?.(PDFName.of('BaseFont')) ?? '')).filter(Boolean)
  expect(fonts.some((f) => f.includes('Tinos'))).toBe(true)
})

test('Word a PDF: un .doc antiguo da un mensaje claro', async ({ page }) => {
  await page.goto('/word-a-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'viejo.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('no es un zip') })
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  await expect(tool.getByText(/Solo se pueden convertir documentos .docx/)).toBeVisible()
})

test('PowerPoint a PDF: una página por diapositiva', async ({ page }) => {
  await page.goto('/powerpoint-a-pdf')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PowerPoint a PDF')
  const out = await convert(page, {
    name: 'informe.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    buffer: await readFile('tests/fixtures/office/presentacion.pptx'),
  })
  expect(out.name).toBe('informe.pdf')
  const pdf = await PDFDocument.load(out.bytes)
  expect(pdf.getPageCount()).toBe(3)
  expect(pdf.getPage(0).getSize()).toEqual({ width: 960, height: 540 })
})

test('PowerPoint a PDF: un archivo que no es .pptx da un mensaje claro', async ({ page }) => {
  await page.goto('/powerpoint-a-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'viejo.ppt', mimeType: 'application/vnd.ms-powerpoint', buffer: Buffer.from('x') })
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  await expect(tool.getByText(/Ese archivo no es una presentación \.pptx/)).toBeVisible()
})

test('PDF a PowerPoint: una diapositiva por página', async ({ page }) => {
  await page.goto('/pdf-a-powerpoint')
  const out = await convert(page, { name: 'folleto.pdf', mimeType: 'application/pdf', buffer: makePdf(2) })
  expect(out.name).toBe('folleto.pptx')
  const files = unzipSync(out.bytes)
  expect(Object.keys(files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort()).toEqual(['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml'])
  expect(Object.keys(files).filter((n) => n.startsWith('ppt/media/'))).toHaveLength(2)
})

test('CSV a Excel: separa columnas y conserva los ceros a la izquierda', async ({ page }) => {
  await page.goto('/csv-a-excel')
  const csv = 'Nombre;Cédula;Total\r\n"Pérez; Ana";0012345;1.500.000\r\nLuis;79876543;2,5\r\n'
  const out = await convert(page, { name: 'clientes.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') })
  expect(out.name).toBe('clientes.xlsx')
  const sheet = strFromU8(unzipSync(out.bytes)['xl/worksheets/sheet1.xml'])
  expect(sheet).toContain('Pérez; Ana')
  expect(sheet).toContain('>0012345<')
  expect(sheet).toContain('<v>1500000</v>')
  expect(sheet).toContain('<v>2.5</v>')
})

test('Excel a CSV: con punto y coma por defecto en español', async ({ page }) => {
  await page.goto('/excel-a-csv')
  const xlsx = writeXlsx([
    {
      name: 'Datos',
      rows: [
        [{ v: 'Ciudad', bold: true }, { v: 'Ventas', bold: true }],
        [{ v: 'Bogotá' }, { v: 1250.5 }],
      ],
    },
  ])
  const tool = page.locator('#tool')
  await expect(tool.getByRole('group', { name: 'Separador' }).getByRole('button', { name: 'Punto y coma (;)' })).toHaveAttribute('aria-pressed', 'true')
  const out = await convert(page, { name: 'ventas.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(xlsx) })
  expect(out.name).toBe('ventas.csv')
  expect(Buffer.from(out.bytes).toString('utf8')).toBe('﻿Ciudad;Ventas\r\nBogotá;1250,5\r\n')
})
