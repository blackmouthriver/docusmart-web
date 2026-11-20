// Fotos HEIC del iPhone en las herramientas de Imagen y en las conversiones (después de W-107).
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test, upload } from './helpers'
import { HEIC_SQUARES } from './fixtures'

const PHOTO = { name: 'IMG_0001.HEIC', mimeType: 'image/heic', buffer: HEIC_SQUARES }

async function download(page: Page) {
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  const file = await wait
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) }
}

async function size(page: Page, data: Buffer) {
  return page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:application/octet-stream;base64,' + b64)).blob())
    return [bmp.width, bmp.height]
  }, data.toString('base64'))
}

test('comprimir una foto HEIC devuelve un JPG (nunca la HEIC original)', async ({ page }) => {
  await page.goto('/comprimir-imagen')
  await expect(page.locator('#tool').getByText('JPG, PNG, WebP, HEIC, GIF o BMP')).toBeVisible()
  await upload(page, [PHOTO])
  await page.locator('#tool').getByRole('button', { name: 'Comprimir', exact: true }).click()
  const r = await download(page)
  expect(r.name).toMatch(/^IMG_0001-.+\.jpg$/)
  expect(r.data.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]))
  expect(await size(page, r.data)).toEqual([64, 48])
})

test('recortar una foto HEIC: se ve en el editor y sale en JPG', async ({ page }) => {
  await page.goto('/recortar-imagen')
  await upload(page, [PHOTO])
  const tool = page.locator('#tool')
  await expect(tool.getByText('64×48 px')).toBeVisible()
  // La vista del editor es una copia en JPG que el navegador sí puede mostrar.
  const preview = tool.locator('img').first()
  await expect.poll(() => preview.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(64)
  await tool.getByRole('button', { name: 'Recortar imagen' }).click()
  const r = await download(page)
  expect(r.name).toBe('IMG_0001-recortada.jpg')
  expect(r.data.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]))
})

test('JPG a PNG también acepta fotos HEIC', async ({ page }) => {
  await page.goto('/jpg-a-png')
  await upload(page, [PHOTO])
  await page.locator('#tool').getByRole('button', { name: 'Convertir' }).click()
  const r = await download(page)
  expect(r.name).toBe('IMG_0001.png')
  expect(r.data.subarray(1, 4).toString('latin1')).toBe('PNG')
  expect(await size(page, r.data)).toEqual([64, 48])
})
