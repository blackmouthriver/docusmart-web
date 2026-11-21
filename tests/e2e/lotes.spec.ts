// Procesamiento por lotes (W-111): renombrar varios archivos y comprimir varios PDF en un ZIP.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { strFromU8, unzipSync } from 'fflate'
import { expect, makePdf, test } from './helpers'

test('renombra varios archivos con numeración y los entrega en un ZIP', async ({ page }) => {
  await page.goto('/app/#/archivos/renombrar')
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'IMG_0001.txt', mimeType: 'text/plain', buffer: Buffer.from('uno') },
    { name: 'IMG_0002.txt', mimeType: 'text/plain', buffer: Buffer.from('dos') },
  ])
  await page.getByLabel('Nombre nuevo (reemplaza todo el nombre)').fill('viaje')
  await page.getByLabel('Numerar (1, 2, 3…)').check()
  const preview = page.getByRole('region', { name: 'Así quedarán' })
  await expect(preview).toContainText('viaje 001.txt')
  await expect(preview).toContainText('viaje 002.txt')

  await page.getByRole('button', { name: 'Renombrar y descargar ZIP (2)' }).click()
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  expect(file.suggestedFilename()).toBe('archivos-renombrados.zip')
  const files = unzipSync(new Uint8Array(await readFile((await file.path())!)))
  expect(Object.keys(files).sort()).toEqual(['viaje 001.txt', 'viaje 002.txt'])
  expect(strFromU8(files['viaje 002.txt'])).toBe('dos')
})

test('comprime varios PDF a la vez y los entrega en un ZIP', async ({ page }) => {
  await page.goto('/comprimir-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles([
    { name: 'uno.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'dos.pdf', mimeType: 'application/pdf', buffer: makePdf(3) },
  ])
  await tool.getByRole('button', { name: 'Comprimir 2 PDF' }).click()
  await expect(tool.getByText(/^2 PDF: /)).toBeVisible({ timeout: 60_000 })
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  expect(file.suggestedFilename()).toBe('pdf-comprimidos.zip')
  const files = unzipSync(new Uint8Array(await readFile((await file.path())!)))
  const names = Object.keys(files).sort()
  expect(names).toHaveLength(2)
  for (const n of names) expect(strFromU8(files[n].subarray(0, 5))).toBe('%PDF-')
})
