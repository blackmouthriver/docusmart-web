// Hash e integridad de archivos (W-105): calcular, verificar, comparar y descargar.
import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { expect, test, upload } from './helpers'

const A = Buffer.from('Contrato firmado por ambas partes.\n')
const B = Buffer.from('Contrato firmado por ambas partes!\n')
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const md5 = (b: Buffer) => createHash('md5').update(b).digest('hex')
const file = (name: string, buffer: Buffer) => ({ name, mimeType: 'text/plain', buffer })

test('calcular SHA-256 y MD5, descargar la lista y el certificado PDF @movil', async ({ page }) => {
  await page.goto('/calcular-hash')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Calcular y verificar hash (SHA-256, MD5)')
  await upload(page, [file('contrato.txt', A), file('copia.txt', B)])
  await page.getByRole('button', { name: 'Calcular hash' }).click()
  await expect(page.locator('.hash-value').first()).toHaveText(sha256(A))
  await expect(page.locator('.hash-value').nth(1)).toHaveText(sha256(B))

  const list = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar lista' }).click()
  const listFile = await list
  expect(listFile.suggestedFilename()).toBe('hashes.sha256')
  expect(await readFile((await listFile.path())!, 'utf-8')).toBe(`${sha256(A)}  contrato.txt\n${sha256(B)}  copia.txt\n`)

  const cert = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Certificado PDF' }).click()
  const certFile = await cert
  expect(certFile.suggestedFilename()).toBe('certificado-de-integridad.pdf')
  expect((await readFile((await certFile.path())!)).subarray(0, 5).toString()).toBe('%PDF-')

  // Otro algoritmo: el resultado anterior se descarta y se vuelve a calcular.
  await page.getByRole('button', { name: 'MD5', exact: true }).click()
  await expect(page.locator('.hash-value')).toHaveCount(0)
  await expect(page.locator('#tool').getByText(/MD5 y SHA-1 sirven para comparar/)).toBeVisible()
  await page.getByRole('button', { name: 'Calcular hash' }).click()
  await expect(page.locator('.hash-value').first()).toHaveText(md5(A))
})

test('verificar un archivo contra el hash pegado', async ({ page }) => {
  await page.goto('/calcular-hash')
  await page.getByRole('button', { name: 'Verificar', exact: true }).click()
  await upload(page, [file('contrato.txt', A)])
  const expected = page.getByLabel('Hash esperado')
  await expected.fill('no-es-un-hash')
  await expect(page.getByText('Esto no parece un hash: revisa que esté completo.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verificar hash' })).toBeDisabled()

  // Como lo publica sha256sum, en mayúsculas y con el nombre del archivo.
  await expected.fill(`${sha256(A).toUpperCase()}  contrato.txt`)
  await expect(page.getByText('Algoritmo detectado: SHA-256')).toBeVisible()
  await page.getByRole('button', { name: 'Verificar hash' }).click()
  await expect(page.getByText('Coincide: el archivo es idéntico al original.')).toBeVisible()

  await expected.fill(md5(B))
  await expect(page.getByText('Algoritmo detectado: MD5')).toBeVisible()
  await page.getByRole('button', { name: 'Verificar hash' }).click()
  await expect(page.getByText('No coincide: el archivo es distinto o fue modificado.')).toBeVisible()
})

test('comparar dos archivos', async ({ page }) => {
  await page.goto('/calcular-hash')
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await page.locator('input[type=file]').nth(0).setInputFiles([file('a.txt', A)])
  await page.locator('input[type=file]').nth(0).setInputFiles([file('b.txt', B)])
  await page.getByRole('button', { name: 'Comparar archivos' }).click()
  await expect(page.getByText('Los archivos son distintos.')).toBeVisible()

  await page.getByRole('button', { name: 'Cambiar' }).nth(1).click()
  await page.locator('input[type=file]').nth(0).setInputFiles([file('a-copia.txt', A)])
  await page.getByRole('button', { name: 'Comparar archivos' }).click()
  await expect(page.getByText('Los dos archivos son idénticos.')).toBeVisible()
})

test('la herramienta está en la app web, en Seguridad', async ({ page }) => {
  await page.goto('/app/#/hash/verificar')
  await expect(page.getByRole('heading', { name: 'Hash e integridad de archivos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verificar', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await expect(page).toHaveURL(/#\/hash\/comparar$/)
})
