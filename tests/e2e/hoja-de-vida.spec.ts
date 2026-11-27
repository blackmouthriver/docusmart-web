// Hoja de vida (W-131): formulario, PDF y Word, borrador en .json y plantilla con foto.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync, strFromU8 } from 'fflate'
import { PDFDocument, PDFName } from 'pdf-lib'
import { expect, test } from './helpers'

// Retrato de 300 × 400 para la plantilla con foto.
async function portrait(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(300, 400)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#3366cc'
    ctx.fillRect(0, 0, 300, 400)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  return Buffer.from(b64, 'base64')
}

test('hoja de vida clásica en PDF y Word, y el borrador se guarda y se vuelve a abrir', async ({ page }) => {
  await page.goto('/hoja-de-vida')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Crear PDF' })).toBeDisabled()
  await expect(tool.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled()

  const personal = tool.getByRole('region', { name: 'Datos personales' })
  await personal.getByLabel('Nombre completo').fill('Ana María Pérez')
  await personal.getByLabel('Cargo o profesión').fill('Contadora pública')
  await personal.getByLabel('Ciudad').fill('Bogotá')
  await personal.getByLabel('Correo').fill('ana@example.com')
  await tool.getByRole('region', { name: 'Perfil profesional' }).locator('textarea').fill('Contadora con 5 años de experiencia.')

  const exp = tool.getByRole('region', { name: 'Experiencia laboral' })
  await exp.getByLabel('Cargo').fill('Analista contable')
  await exp.getByLabel('Empresa').fill('Empresa S.A.S.')
  await exp.getByLabel('Desde').fill('2020')
  await exp.getByLabel('Trabajo aquí actualmente').check()
  await expect(exp.getByLabel('Hasta')).toBeDisabled()
  await exp.getByLabel('Logros y funciones').fill('Reduje en 20 % los tiempos de cierre.\nLideré la migración contable.')
  // Una segunda experiencia, que luego se sube al primer lugar.
  await exp.getByRole('button', { name: 'Agregar experiencia' }).click()
  await exp.getByLabel('Cargo').nth(1).fill('Auxiliar contable')
  await exp.getByRole('button', { name: 'Subir 2' }).click()
  await expect(exp.getByLabel('Cargo').first()).toHaveValue('Auxiliar contable')
  await exp.getByRole('button', { name: 'Quitar 1' }).click()
  await expect(exp.getByLabel('Cargo')).toHaveCount(1)
  await expect(exp.getByLabel('Cargo')).toHaveValue('Analista contable')

  await tool.getByRole('region', { name: 'Educación' }).getByLabel('Título').fill('Contaduría Pública')
  await tool.getByRole('region', { name: 'Habilidades' }).locator('textarea').fill('Excel avanzado, NIIF, SIIGO')
  const langs = tool.getByRole('region', { name: 'Idiomas' })
  await langs.getByRole('button', { name: 'Agregar idioma' }).click()
  await langs.getByLabel('Idioma').fill('Inglés')
  await langs.getByLabel('Nivel').fill('B2')

  // PDF.
  await tool.getByRole('button', { name: 'Crear PDF' }).click()
  await expect(tool.getByRole('heading', { name: 'Así quedó tu hoja de vida' })).toBeVisible({ timeout: 30_000 })
  let wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  let file = await wait
  expect(file.suggestedFilename()).toBe('hoja-de-vida-ana-maria-perez.pdf')
  const pdf = await readFile((await file.path())!)
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  // La plantilla clásica no lleva imágenes.
  expect(pdf.toString('latin1')).not.toMatch(/\/Subtype\s*\/Image/)

  // Word.
  await tool.getByRole('button', { name: 'Crear Word (.docx)' }).click()
  // El título ya se ve desde el PDF: hay que esperar a que el resultado sea el Word (en Safari tarda más).
  await expect(tool.getByText('hoja-de-vida-ana-maria-perez.docx').first()).toBeVisible({ timeout: 30_000 })
  wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  file = await wait
  expect(file.suggestedFilename()).toBe('hoja-de-vida-ana-maria-perez.docx')
  const xml = strFromU8(unzipSync(new Uint8Array(await readFile((await file.path())!)))['word/document.xml'])
  expect(xml).toContain('Ana María Pérez')
  expect(xml).toContain('Analista contable')
  expect(xml).toContain('Reduje en 20 % los tiempos de cierre.')
  expect(xml).toContain('Inglés')

  // Borrador: se descarga un .json y, en una página nueva, se vuelve a cargar.
  wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Guardar borrador' }).click()
  file = await wait
  expect(file.suggestedFilename()).toBe('hoja-de-vida-ana-maria-perez.json')
  const draft = await readFile((await file.path())!)
  expect(JSON.parse(draft.toString('utf8')).app).toBe('docusmart-cv')
  // Con el guardado automático (W-146.4) queda solo en este navegador; al apagarlo se borra.
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('cv')))).toEqual(['ds-cv-autosave-v1'])
  await tool.getByRole('switch', { name: 'Guardar automáticamente en este navegador' }).uncheck()
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('cv') && k !== 'ds-cv-autosave-off'))).toEqual([])

  await page.reload()
  await expect(tool.getByRole('region', { name: 'Datos personales' }).getByLabel('Nombre completo')).toHaveValue('')
  await tool.getByLabel('Abrir borrador').setInputFiles({ name: 'borrador.json', mimeType: 'application/json', buffer: draft })
  await expect(tool.getByRole('region', { name: 'Datos personales' }).getByLabel('Nombre completo')).toHaveValue('Ana María Pérez')
  await expect(tool.getByRole('region', { name: 'Experiencia laboral' }).getByLabel('Trabajo aquí actualmente')).toBeChecked()
  await expect(tool.getByRole('region', { name: 'Idiomas' }).getByLabel('Nivel')).toHaveValue('B2')

  // Un archivo que no es borrador muestra un error.
  await tool.getByLabel('Abrir borrador').setInputFiles({ name: 'otro.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') })
  await expect(tool.getByRole('alert')).toHaveText('Ese archivo no es un borrador de hoja de vida de DocuSmart.')
})

test('plantilla con foto: la foto va en el PDF', async ({ page }) => {
  await page.goto('/hoja-de-vida')
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Elegir foto' })).toHaveCount(0)
  await tool.getByRole('group', { name: 'Plantilla' }).getByRole('button', { name: 'Con foto' }).click()
  await tool.getByRole('region', { name: 'Datos personales' }).getByLabel('Nombre completo').fill('Luis Gómez')
  await tool.getByLabel('Elegir foto').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: await portrait(page) })
  await expect(tool.getByRole('img', { name: 'Foto' })).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Cambiar foto' })).toBeVisible()

  await tool.getByRole('button', { name: 'Crear PDF' }).click()
  await expect(tool.getByRole('heading', { name: 'Así quedó tu hoja de vida' })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const pdf = await readFile((await (await wait).path())!)
  expect(pdf.toString('latin1')).toMatch(/\/Subtype\s*\/Image/)
})

test('con otros alfabetos el PDF lleva las fuentes incrustadas (cirílico, chino y coreano)', async ({ page }) => {
  await page.goto('/hoja-de-vida')
  const tool = page.locator('#tool')
  const personal = tool.getByRole('region', { name: 'Datos personales' })
  await personal.getByLabel('Nombre completo').fill('Анна Петрова 李娜 김민지')
  await personal.getByLabel('Cargo o profesión').fill('Бухгалтер')
  const fonts = page.waitForResponse((r) => r.url().includes('/pdf-fonts/Carlito-'))
  await tool.getByRole('button', { name: 'Crear PDF' }).click()
  expect((await fonts).status()).toBe(200)
  await expect(tool.getByRole('heading', { name: 'Así quedó tu hoja de vida' })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const doc = await PDFDocument.load(await readFile((await (await wait).path())!))
  const baseFonts = doc.context
    .enumerateIndirectObjects()
    .map(([, o]) => String((o as { get?: (k: unknown) => unknown }).get?.(PDFName.of('BaseFont')) ?? ''))
    .filter(Boolean)
  expect(baseFonts.some((f) => f.includes('Carlito'))).toBe(true)
  expect(baseFonts.some((f) => f.includes('DroidSansFallback'))).toBe(true)
  expect(baseFonts.some((f) => f.includes('NanumGothic'))).toBe(true)
})
