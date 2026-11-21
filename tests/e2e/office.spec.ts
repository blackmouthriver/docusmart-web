// Más Office (W-114): PowerPoint a PDF, PDF a PowerPoint y CSV ↔ Excel.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { strFromU8, unzipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { expect, makePdf, test } from './helpers'
import { writeXlsx } from '../../src/features/convert/core/pdfExcel'

async function convert(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(file)
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

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
