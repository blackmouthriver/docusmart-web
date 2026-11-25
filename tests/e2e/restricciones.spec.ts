// Unir PDF con un PDF que se abre sin contraseña pero trae restricciones (no imprimir, no copiar):
// antes decía "Este PDF tiene contraseña". El archivo de prueba lo protegió DocuSmart en modo
// "Solo restricciones" (tests/fixtures/pdf/solo-restricciones.pdf).
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { expect, makePdf, test } from './helpers'

test('une un PDF con solo restricciones sin pedir contraseña @movil', async ({ page }) => {
  await page.goto('/unir-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles([
    { name: 'carta.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
    { name: 'extracto.pdf', mimeType: 'application/pdf', buffer: await readFile('tests/fixtures/pdf/solo-restricciones.pdf') },
  ])
  // Las páginas del PDF con restricciones se cuentan como las de cualquier otro.
  await expect(tool.locator('.file-item').nth(1)).toContainText('2 páginas')
  await tool.locator('.btn-primary:not([disabled])').last().click()
  await expect(tool.getByText('Este PDF tiene contraseña', { exact: false })).toHaveCount(0)
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).first().click()
  const merged = await PDFDocument.load(await readFile((await (await wait).path())!))
  expect(merged.getPageCount()).toBe(3)
})

test('desbloquear y comprimir un PDF con solo restricciones, sin contraseña', async ({ page }) => {
  const restricted = { name: 'extracto.pdf', mimeType: 'application/pdf', buffer: await readFile('tests/fixtures/pdf/solo-restricciones.pdf') }
  await page.goto('/desbloquear-pdf')
  let tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(restricted)
  await expect(tool.getByText('Este PDF se abre sin contraseña, pero tiene restricciones', { exact: false })).toBeVisible()
  await expect(tool.locator('input[type=password]')).toHaveCount(0)
  await tool.locator('.btn-primary:not([disabled])').last().click()
  await expect(tool.getByRole('button', { name: 'Descargar', exact: true }).first()).toBeVisible({ timeout: 30_000 })

  await page.goto('/comprimir-pdf')
  tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(restricted)
  await tool.locator('.btn-primary:not([disabled])').last().click()
  await expect(tool.getByRole('button', { name: 'Descargar', exact: true }).first()).toBeVisible({ timeout: 30_000 })
  await expect(tool.getByText('Este PDF tiene contraseña', { exact: false })).toHaveCount(0)
})
