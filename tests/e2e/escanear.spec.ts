// Escanear tras la auditoría W-146.6: el PDF buscable conserva el tamaño de cada página, respeta
// las páginas que ya tienen texto, lee las que vienen de lado y se exporta a Word; el escáner
// arma el PDF en A4, Carta o "como la foto".
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync, strFromU8 } from 'fflate'
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test, upload } from './helpers'

async function downloaded(page: Page, click: () => Promise<void>): Promise<{ name: string; bytes: Uint8Array }> {
  const wait = page.waitForEvent('download')
  await click()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** PNG con texto negro grande sobre blanco, hecho en el navegador. */
async function textImage(page: Page, lines: string[], w = 1200, h = 900): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ ls, w, h }) => {
      const c = new OffscreenCanvas(w, h)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#000'
      ctx.font = '56px Arial, sans-serif'
      ls.forEach((l, i) => ctx.fillText(l, 60, 120 + i * 90))
      const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
      let s = ''
      for (const b of bytes) s += String.fromCharCode(b)
      return btoa(s)
    },
    { ls: lines, w, h },
  )
  return Buffer.from(b64, 'base64')
}

/** Un PDF de 3 páginas: una con texto digital (A4), una escaneada (Carta) y una escaneada de lado (A4). */
async function mixedPdf(page: Page): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  doc.addPage([595, 842]).drawText('Contrato de arrendamiento con texto digital', { x: 40, y: 780, size: 16, font })
  const scan = await doc.embedPng(await textImage(page, ['FACTURA NUMERO 2026', 'TOTAL A PAGAR', 'GRACIAS POR SU COMPRA']))
  doc.addPage([612, 792]).drawImage(scan, { x: 0, y: 792 - 459, width: 612, height: 459 })
  // La misma clase de escaneo, girada 90°: el texto queda de lado.
  const side = await doc.embedPng(await textImage(page, ['RECIBO DE CAJA MENOR', 'CONCEPTO PAPELERIA', 'VALOR CIEN MIL']))
  doc.addPage([595, 842]).drawImage(side, { x: 500, y: 60, width: 720, height: 480, rotate: degrees(90) })
  return Buffer.from(await doc.save())
}

async function pdfInfo(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const pages: { size: number[]; text: string }[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i)
    const v = p.getViewport({ scale: 1 })
    const text = (await p.getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
    pages.push({ size: [Math.round(v.width), Math.round(v.height)], text })
  }
  await task.destroy()
  return pages
}

test('OCR de un PDF mixto: tamaños reales, respeta el texto digital, lee la página de lado y exporta a Word', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/app/#/pdf/ocr')
  await upload(page, [{ name: 'mixto.pdf', mimeType: 'application/pdf', buffer: await mixedPdf(page) }])
  await page.getByRole('button', { name: 'Reconocer texto' }).click()
  await expect(page.getByText('1 página ya tenía texto y se dejó tal cual.', { exact: false })).toBeVisible({ timeout: 200_000 })
  await expect(page.getByText('1 página venía girada y se leyó derecha.', { exact: false })).toBeVisible()
  const view = page.locator('pre.text-view')
  await expect(view).toContainText('Contrato de arrendamiento con texto digital')
  await expect(view).toContainText('FACTURA')
  await expect(view).toContainText('RECIBO')

  const pdf = await downloaded(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 }))
  const pages = await pdfInfo(pdf.bytes)
  // Antes, cada página escaneada salía del tamaño de sus píxeles (1869 × 2645 pt).
  expect(pages.map((p) => p.size)).toEqual([[595, 842], [612, 792], [842, 595]])
  expect(pages[0].text).toContain('Contrato de arrendamiento con texto digital')
  expect(pages[1].text).toContain('FACTURA')
  expect(pages[2].text).toContain('RECIBO')

  const word = await downloaded(page, () => page.getByRole('button', { name: 'Word', exact: true }).click())
  expect(word.name).toBe('mixto-ocr.docx')
  const xml = strFromU8(unzipSync(word.bytes)['word/document.xml'])
  expect(xml).toContain('FACTURA')
  expect(xml).toContain('Contrato de arrendamiento')
})

test('OCR: con "Reconocer también las páginas que ya tienen texto" no se copia ninguna @movil', async ({ page }) => {
  test.setTimeout(200_000)
  await page.goto('/app/#/pdf/ocr')
  const doc = await PDFDocument.create()
  doc.addPage([595, 842]).drawText('Texto digital que se reconoce de nuevo', { x: 40, y: 780, size: 28, font: await doc.embedFont(StandardFonts.Helvetica) })
  await upload(page, [{ name: 'digital.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }])
  await page.getByText('Reconocer también las páginas que ya tienen texto').click()
  await page.getByRole('button', { name: 'Reconocer texto' }).click()
  await expect(page.locator('pre.text-view')).toContainText('digital', { timeout: 180_000 })
  await expect(page.getByText('ya tenía texto', { exact: false })).toHaveCount(0)
})

test('escáner: el PDF en A4, Carta o como la foto @movil', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/app/#/pdf/escanear')
  // Una "foto" horizontal: el PDF en A4 sale horizontal.
  await page.locator('input[type=file][multiple]').setInputFiles([{ name: 'foto.png', mimeType: 'image/png', buffer: await textImage(page, ['HOJA'], 1200, 800) }])
  await page.getByRole('button', { name: 'Listo' }).click({ timeout: 60_000 })
  const paper = page.getByRole('group', { name: 'Tamaño de página' })
  await expect(paper).toBeVisible()

  const sizes: number[][] = []
  for (const option of ['A4', 'Carta', 'Como la foto']) {
    await paper.getByRole('button', { name: option, exact: true }).click()
    await expect(paper.getByRole('button', { name: option, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Crear PDF' }).click()
    const pdf = await downloaded(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 }))
    sizes.push((await pdfInfo(pdf.bytes))[0].size)
  }
  expect(sizes[0]).toEqual([842, 595])
  expect(sizes[1]).toEqual([792, 612])
  expect(sizes[2][0]).toBe(595)
})
