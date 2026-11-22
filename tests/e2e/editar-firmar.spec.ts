// Editar y firmar tras la auditoría W-146.2: formulario en otros alfabetos, marca de agua con
// opciones, campos rápidos y firma recordada al firmar, y deshacer en Editar.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFDocument, PDFName } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, makePdf, PNG, test, upload } from './helpers'

async function save(page: Page): Promise<Uint8Array> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 30_000 })
  return new Uint8Array(await readFile((await (await wait).path())!))
}

async function textOf(bytes: Uint8Array, pageNo = 1) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const text = (await (await doc.getPage(pageNo)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  return text
}

test('llenar un formulario en ruso y japonés: el texto queda guardado y visible al aplanar', async ({ page }) => {
  const doc = await PDFDocument.create()
  const p = doc.addPage([595, 842])
  doc.getForm().createTextField('nombre').addToPage(p, { x: 60, y: 700, width: 300, height: 24 })
  doc.getForm().createTextField('ciudad').addToPage(p, { x: 60, y: 650, width: 300, height: 24 })
  await page.goto('/app/#/pdf/formulario')
  await upload(page, [{ name: 'solicitud.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }])
  await page.getByRole('textbox', { name: /nombre/i }).fill('Иван Петров')
  await page.getByRole('textbox', { name: /ciudad/i }).fill('東京')
  await page.getByLabel(/Aplanar el formulario/).check()
  await page.getByRole('button', { name: 'Llenar formulario' }).click()
  const text = await textOf(await save(page))
  expect(text).toContain('Иван Петров')
  expect(text).toContain('東京')
})

test('marca de agua: imagen en mosaico, detrás del contenido y solo en la página 1 @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/marca')
  await upload(page, [{ name: 'catalogo.pdf', mimeType: 'application/pdf', buffer: makePdf(2) }])
  await page.getByRole('group', { name: 'Tipo de marca' }).getByRole('button', { name: 'Imagen o logo' }).click()
  await page.locator('input[type=file][accept*="image/png"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('logo.png')).toBeVisible()
  await page.getByRole('button', { name: 'Mosaico (repetir en toda la página)' }).click()
  await page.getByRole('group', { name: 'Ubicación' }).getByRole('button', { name: 'Detrás del contenido' }).click()
  await expect(page.getByText('Detrás no se ve sobre páginas escaneadas', { exact: false })).toBeVisible()
  await page.getByRole('textbox', { name: 'Páginas' }).fill('9')
  await expect(page.getByText('Revisa las páginas', { exact: false })).toBeVisible()
  await page.getByRole('textbox', { name: 'Páginas' }).fill('1')
  await page.screenshot({ path: `test-results/editar-marca-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Aplicar marca de agua', exact: false }).click()
  const out = await PDFDocument.load(await save(page))
  const images = (i: number) => {
    const xo = out.getPage(i).node.Resources()?.lookup(PDFName.of('XObject'))
    return xo && 'keys' in xo ? (xo as unknown as { keys(): unknown[] }).keys().length : 0
  }
  // pdf-lib agrega una referencia a la misma imagen por cada copia del mosaico.
  expect(images(0)).toBeGreaterThan(1)
  expect(images(1)).toBe(0)
})

test('firmar con fecha, texto, ✓ e iniciales, y recordar la firma en este equipo', async ({ page }) => {
  await page.goto('/app/#/pdf/firmar')
  await upload(page, [{ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  await page.getByRole('button', { name: 'Escribir' }).click()
  await page.getByLabel('Tu nombre').fill('Ana Prueba')
  await page.getByRole('button', { name: 'Usar esta firma' }).click()
  await page.getByRole('switch', { name: /Recordar mi firma en este equipo/ }).check()

  const fields = page.locator('.sign-fields')
  await fields.getByRole('button', { name: 'Fecha' }).click()
  await fields.getByRole('button', { name: 'Texto' }).click()
  await page.getByRole('textbox', { name: 'Texto' }).fill('Aprobado')
  await page.getByRole('button', { name: 'Agregar una marca de verificación' }).click()
  await page.getByRole('textbox', { name: 'Tus iniciales' }).fill('AP')
  await page.getByRole('button', { name: 'Agregar iniciales' }).click()
  await expect(page.locator('.sign-box')).toHaveCount(5)
  await page.screenshot({ path: `test-results/editar-firmar-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Firmar PDF' }).click()
  const bytes = await save(page)
  const text = await textOf(bytes)
  expect(text).toContain('Aprobado')
  expect(text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
  // Firma e iniciales: dos imágenes.
  const xo = (await PDFDocument.load(bytes)).getPage(0).node.Resources()?.lookup(PDFName.of('XObject'))
  expect((xo as unknown as { keys(): unknown[] }).keys().length).toBe(2)

  // Al volver, la firma ya está lista y colocada, sin dibujarla otra vez.
  await page.reload()
  await upload(page, [{ name: 'otro.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  await expect(page.getByRole('img', { name: 'Tu firma' })).toBeVisible()
  await expect(page.locator('.sign-box')).toHaveCount(1)
  // Apagarlo la borra del equipo.
  await page.getByRole('switch', { name: /Recordar mi firma en este equipo/ }).uncheck()
  expect(await page.evaluate(() => localStorage.getItem('ds-signature-v1'))).toBeNull()
})

test('editar: deshacer y rehacer con los botones y con Ctrl+Z / Ctrl+Y', async ({ page }) => {
  await page.goto('/app/#/pdf/editar')
  await upload(page, [{ name: 'hoja.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  const undo = page.getByRole('button', { name: 'Deshacer' })
  const redo = page.getByRole('button', { name: 'Rehacer' })
  await expect(undo).toBeDisabled()
  await page.getByRole('button', { name: 'Rectángulo' }).click()
  const stage = page.locator('.edit-stage img').first()
  await stage.scrollIntoViewIfNeeded()
  const box = (await stage.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByText('1 elemento')).toBeVisible()
  await undo.click()
  await expect(page.getByText('1 elemento')).toHaveCount(0)
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect(page.getByText('1 elemento')).toBeVisible()
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+z')
  await expect(page.getByText('1 elemento')).toHaveCount(0)
  await page.keyboard.press('Control+y')
  await expect(page.getByText('1 elemento')).toBeVisible()
})
