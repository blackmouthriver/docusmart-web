// Optimizar tras la auditoría W-146.5: compresión que conserva el texto, a un tamaño máximo y en
// gris; comparar ignorando mayúsculas y marcando bloques movidos.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test, upload } from './helpers'

async function save(page: Page): Promise<Uint8Array> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 })
  return new Uint8Array(await readFile((await (await wait).path())!))
}

/** Un PDF con texto y una foto pesada (ruido en JPEG de alta calidad, hecho en el navegador). */
async function heavyPdf(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(1800, 1400)
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(1800, 1400)
    for (let i = 0; i < img.data.length; i++) img.data[i] = i % 4 === 3 ? 255 : (i * 2654435761) >>> 24
    ctx.putImageData(img, 0, 0)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.95 })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  const doc = await PDFDocument.create()
  const p = doc.addPage([595, 842])
  p.drawText('Informe anual con texto seleccionable', { x: 40, y: 800, size: 16, font: await doc.embedFont(StandardFonts.Helvetica) })
  p.drawImage(await doc.embedJpg(Buffer.from(b64, 'base64')), { x: 40, y: 200, width: 515, height: 400 })
  return Buffer.from(await doc.save())
}

async function textOf(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  return text
}

test('comprimir "Recomendada": baja el peso y el texto sigue siendo texto', async ({ page }) => {
  await page.goto('/app/#/pdf/comprimir')
  const input = await heavyPdf(page)
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: input }])
  await expect(page.getByRole('group', { name: 'Nivel de compresión' }).getByRole('button', { name: 'Recomendada' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Comprime solo las fotos y deja el texto como texto', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Comprimir PDF' }).click()
  const out = await save(page)
  expect(out.length).toBeLessThan(input.length * 0.6)
  expect(await textOf(out)).toContain('Informe anual con texto seleccionable')
})

test('comprimir a un tamaño máximo y en gris @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/comprimir')
  const input = await heavyPdf(page)
  expect(input.length).toBeGreaterThan(600 * 1024)
  await upload(page, [{ name: 'escaneo.pdf', mimeType: 'application/pdf', buffer: input }])
  await page.getByLabel('Tamaño máximo').selectOption('0.5')
  await expect(page.getByRole('group', { name: 'Nivel de compresión' })).toHaveCount(0)
  await page.getByLabel(/Pasar a escala de grises/).check()
  await page.getByRole('button', { name: 'Comprimir PDF' }).click()
  await expect(page.getByText(/Entró en 0[.,]5 MB con el nivel/)).toBeVisible({ timeout: 60_000 })
  const out = await save(page)
  expect(out.length).toBeLessThanOrEqual(512 * 1024)
})

test('comparar: ignorar mayúsculas y marcar el párrafo movido', async ({ page }) => {
  const pdf = async (lines: string[]) => {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const p = doc.addPage([595, 842])
    lines.forEach((t, i) => p.drawText(t, { x: 40, y: 780 - i * 30, size: 12, font }))
    return Buffer.from(await doc.save())
  }
  const base = ['Primera clausula del contrato de arriendo.', 'El canon mensual es de un millon quinientos mil pesos.', 'El arrendatario paga los servicios publicos.', 'La duracion es de doce meses.']
  await page.goto('/app/#/pdf/comparar')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles({ name: 'v1.pdf', mimeType: 'application/pdf', buffer: await pdf(base) })
  // 1) El canon pasó al final: se marca como movido, sin palabras agregadas ni quitadas.
  await inputs.nth(0).setInputFiles({ name: 'v2.pdf', mimeType: 'application/pdf', buffer: await pdf([base[0], base[2], base[3], base[1]]) })
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await expect(page.getByText('bloques movidos')).toBeVisible()
  await expect(page.getByText('se movió de aquí')).toBeVisible()
  await expect(page.getByText('se movió aquí', { exact: true })).toBeVisible()

  // 2) Otra versión donde solo cambió a mayúsculas la primera línea: con la opción, no cuenta.
  await page.getByRole('button', { name: 'Cambiar' }).nth(1).click()
  await page.locator('input[type=file]').last().setInputFiles({ name: 'v3.pdf', mimeType: 'application/pdf', buffer: await pdf([base[0].toUpperCase(), base[1], base[2], base[3]]) })
  await page.getByRole('button', { name: 'Comparar', exact: true }).click()
  await expect(page.getByRole('heading', { name: '1 cambio' })).toBeVisible()
  await page.getByLabel('Ignorar mayúsculas').check()
  await expect(page.getByRole('heading', { name: 'El texto es igual' })).toBeVisible()
})
