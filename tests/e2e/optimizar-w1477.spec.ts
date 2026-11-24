// W-147.7: comparar PDF visualmente (página por página) y PDF/A-1b y 3b.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFArray, PDFDocument, PDFName, PDFRawStream, StandardFonts, rgb } from 'pdf-lib'
import { expect, test } from './helpers'

async function save(page: Page): Promise<{ name: string; bytes: Uint8Array }> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** PDF con el mismo texto en cada página y, en la página indicada, un sello de otro color. */
async function stamped(pages: number, stamp: { page: number; color: [number, number, number] } | null) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([595, 842])
    p.drawText(`Contrato, página ${i + 1}`, { x: 60, y: 760, size: 18, font })
    p.drawRectangle({ x: 380, y: 80, width: 140, height: 80, color: rgb(0.1, 0.3, 0.8) })
  }
  if (stamp) doc.getPage(stamp.page - 1).drawRectangle({ x: 380, y: 80, width: 140, height: 80, color: rgb(...stamp.color) })
  return Buffer.from(await doc.save())
}

test('comparar visualmente: encuentra la página donde cambió el sello y arma el informe @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/comparar')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles({ name: 'v1.pdf', mimeType: 'application/pdf', buffer: await stamped(3, null) })
  // El texto es igual en las dos: solo cambia el color del sello de la página 2 y hay una página más.
  await inputs.nth(0).setInputFiles({ name: 'v2.pdf', mimeType: 'application/pdf', buffer: await stamped(4, { page: 2, color: [0.85, 0.1, 0.1] }) })
  await page.getByRole('group', { name: 'Cómo comparar' }).getByRole('button', { name: 'Visual (página por página)' }).click()
  await expect(page.getByLabel('Ignorar mayúsculas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Cambió 1 página' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Páginas que solo están en la nueva versión: 4.')).toBeVisible()
  const pages = page.getByRole('group', { name: 'Páginas con cambios' })
  await expect(pages.getByRole('button')).toHaveText(['Página 2', 'Página 4'])
  await expect(pages.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/^1 zona con cambios/)).toBeVisible()
  // La zona marcada está sobre el sello (abajo a la derecha).
  const box = page.locator('.visual-box').first()
  const frame = page.locator('.visual-frame').first()
  const [b, f] = [(await box.boundingBox())!, (await frame.boundingBox())!]
  expect((b.x - f.x) / f.width).toBeGreaterThan(0.55)
  expect((b.y - f.y) / f.height).toBeGreaterThan(0.7)
  await page.getByRole('button', { name: 'Superpuesto' }).click()
  await expect(page.getByRole('img', { name: 'Superpuesto' })).toBeVisible()
  await expect(page.getByText('Quitado (solo en el original)')).toBeVisible()
  await pages.getByRole('button', { name: 'Página 4' }).click()
  await expect(page.getByText('Esta página no está en el original.')).toBeVisible()
  // Informe: la página 2 superpuesta y la 4, que es nueva.
  const report = await save(page)
  expect(report.name).toBe('comparacion-v1-visual.pdf')
  expect((await PDFDocument.load(report.bytes)).getPageCount()).toBe(2)
})

test('comparar visualmente dos PDF iguales', async ({ page }) => {
  await page.goto('/app/#/pdf/comparar')
  const inputs = page.locator('input[type=file]')
  const same = await stamped(2, null)
  await inputs.nth(0).setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: same })
  await inputs.nth(0).setInputFiles({ name: 'b.pdf', mimeType: 'application/pdf', buffer: same })
  await page.getByRole('button', { name: 'Visual (página por página)' }).click()
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Las páginas se ven iguales' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Se compararon 2 páginas pixel a pixel')).toBeVisible()
})

/** El número de parte en el XMP del resultado. */
async function partOf(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes)
  const xmp = new TextDecoder().decode((doc.catalog.lookup(PDFName.of('Metadata')) as PDFRawStream).getContents())
  return { part: /<pdfaid:part>(\d)<\/pdfaid:part>/.exec(xmp)?.[1], doc }
}

test('PDF/A: elegir 1b (la transparencia pasa a imagen) o 3b (conserva el adjunto) @movil', async ({ page }) => {
  const src = await PDFDocument.create()
  src.addPage([300, 400]).drawRectangle({ x: 20, y: 20, width: 100, height: 100, color: rgb(1, 0, 0), opacity: 0.5 })
  await src.attach(new TextEncoder().encode('<factura/>'), 'factura.xml', { mimeType: 'application/xml' })
  const file = { name: 'factura.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await src.save()) }

  await page.goto('/app/#/pdf/pdfa')
  await page.locator('input[type=file]').setInputFiles(file)
  const version = page.getByRole('group', { name: 'Versión' })
  await expect(version.getByRole('button', { name: 'PDF/A-2b' })).toHaveAttribute('aria-pressed', 'true')
  await version.getByRole('button', { name: 'PDF/A-1b' }).click()
  await expect(page.getByText('La más antigua (PDF 1.4)', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Convertir a PDF/A' }).click()
  await expect(page.getByText('Listo: el PDF cumple PDF/A-1b.')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('usaba transparencias, que PDF/A-1b no admite', { exact: false })).toBeVisible()
  let out = await save(page)
  expect(out.name).toBe('factura-pdfa-1b.pdf')
  expect((await partOf(out.bytes)).part).toBe('1')

  await version.getByRole('button', { name: 'PDF/A-3b' }).click()
  await page.getByRole('button', { name: 'Convertir a PDF/A' }).click()
  await expect(page.getByText('Listo: el PDF cumple PDF/A-3b.')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Se conservó el archivo adjunto', { exact: false })).toBeVisible()
  out = await save(page)
  expect(out.name).toBe('factura-pdfa-3b.pdf')
  const r = await partOf(out.bytes)
  expect(r.part).toBe('3')
  expect(r.doc.catalog.lookup(PDFName.of('AF'), PDFArray).size()).toBe(1)
})
