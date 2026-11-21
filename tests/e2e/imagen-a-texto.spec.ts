// Imagen a texto (W-108): reconoce el texto de imágenes con Tesseract en el navegador.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync, strFromU8 } from 'fflate'
import { expect, test } from './helpers'

/** PNG con texto negro grande sobre blanco, hecho en el navegador. */
async function textImage(page: Page, lines: string[]): Promise<Buffer> {
  const b64 = await page.evaluate(async (ls) => {
    const c = new OffscreenCanvas(900, 90 + ls.length * 70)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#000'
    ctx.font = '48px Arial, sans-serif'
    ls.forEach((l, i) => ctx.fillText(l, 40, 90 + i * 70))
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  }, lines)
  return Buffer.from(b64, 'base64')
}

test('reconoce el texto de dos imágenes, se edita y se descarga en .txt y Word', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/imagen-a-texto')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imagen a texto (OCR)')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles([
    { name: 'cartel.png', mimeType: 'image/png', buffer: await textImage(page, ['HOLA MUNDO', 'DOCUMENTO 2026']) },
    { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
  ])
  await expect(tool.getByText('Algunos archivos no son imágenes y no se agregaron.')).toBeVisible()

  // Una captura pegada con Ctrl+V se agrega a la lista.
  const second = (await textImage(page, ['SEGUNDA IMAGEN'])).toString('base64')
  await page.evaluate(async (b64) => {
    const blob = await (await fetch('data:image/png;base64,' + b64)).blob()
    const dt = new DataTransfer()
    dt.items.add(new File([blob], 'image.png', { type: 'image/png' }))
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }))
  }, second)
  await expect(tool.getByText('captura-1.png')).toBeVisible()

  await tool.getByRole('button', { name: 'Reconocer texto de 2 imágenes' }).click()
  const box = tool.getByLabel('Puedes corregir el texto aquí antes de copiarlo o descargarlo.')
  await expect(box).toBeVisible({ timeout: 120_000 })
  await expect(box).toHaveValue(/HOLA MUNDO/)
  await expect(box).toHaveValue(/DOCUMENTO 2026/)
  await expect(box).toHaveValue(/SEGUNDA IMAGEN/)
  // Separado por imagen, con el nombre de cada una; se puede quitar.
  await expect(box).toHaveValue(/cartel\.png/)
  await tool.getByLabel('Separar el texto por imagen').uncheck()
  await expect(box).not.toHaveValue(/cartel\.png/)

  await box.fill('Texto corregido\nen dos líneas')
  let wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.txt' }).click()
  let file = await wait
  expect(file.suggestedFilename()).toBe('texto.txt')
  expect((await readFile((await file.path())!)).toString('utf8')).toBe('Texto corregido\nen dos líneas')

  wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Word (.docx)' }).click()
  file = await wait
  expect(file.suggestedFilename()).toBe('texto.docx')
  const xml = strFromU8(unzipSync(new Uint8Array(await readFile((await file.path())!)))['word/document.xml'])
  expect(xml).toContain('Texto corregido en dos líneas')
})

test('reconoce texto en ruso eligiendo el idioma del documento (W-139)', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/imagen-a-texto')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles([{ name: 'ruso.png', mimeType: 'image/png', buffer: await textImage(page, ['ПРИВЕТ МИР', 'ДОКУМЕНТ']) }])
  const select = tool.getByLabel('Idioma', { exact: true })
  // El idioma de la página primero; se elige ruso y se puede sumar inglés.
  await expect(select).toHaveValue('spa')
  await select.selectOption('rus')
  await expect(tool.getByLabel('El documento también tiene texto en inglés')).not.toBeChecked()
  const model = page.waitForResponse((r) => r.url().includes('/ocr/lang/rus.traineddata'))
  await tool.getByRole('button', { name: /Reconocer texto/ }).click()
  expect((await model).status()).toBe(200)
  const box = tool.getByLabel('Puedes corregir el texto aquí antes de copiarlo o descargarlo.')
  await expect(box).toBeVisible({ timeout: 120_000 })
  await expect(box).toHaveValue(/ПРИВЕТ МИР/)
  await expect(box).toHaveValue(/ДОКУМЕНТ/)
})
