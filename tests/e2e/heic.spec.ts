// HEIC a JPG (W-107): libheif (wasm) en el navegador, con la CSP de producción.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test, upload } from './helpers'
import { HEIC_SQUARES } from './fixtures'

async function pixels(page: Page, data: Buffer, mime: string) {
  return page.evaluate(
    async ({ b64, mime }) => {
      const bmp = await createImageBitmap(await (await fetch(`data:${mime};base64,${b64}`)).blob())
      const c = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      const at = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3))
      return { size: [bmp.width, bmp.height], tl: at(8, 8), tr: at(56, 8), bl: at(8, 40), br: at(56, 40) }
    },
    { b64: data.toString('base64'), mime },
  )
}

const near = (got: number[], want: number[]) => got.every((v, i) => Math.abs(v - want[i]) < 35)

async function convertAndDownload(page: Page) {
  await page.locator('#tool').getByRole('button', { name: 'Convertir' }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 30_000 })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  const file = await download
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) }
}

test('convierte una foto HEIC a JPG con sus colores y del mismo tamaño', async ({ page }) => {
  const wasm = page.waitForRequest((r) => r.url().endsWith('/heic/libheif.wasm'))
  await page.goto('/heic-a-jpg')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('HEIC a JPG')
  await upload(page, [{ name: 'IMG_0001.HEIC', mimeType: 'image/heic', buffer: HEIC_SQUARES }])
  await expect(page.locator('#tool').getByText('Calidad del JPG: 90 %')).toBeVisible()
  const r = await convertAndDownload(page)
  await wasm
  expect(r.name).toBe('IMG_0001.jpg')
  expect(r.data.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]))
  const p = await pixels(page, r.data, 'image/jpeg')
  expect(p.size).toEqual([64, 48])
  expect(near(p.tl, [220, 30, 30])).toBe(true)
  expect(near(p.tr, [30, 200, 60])).toBe(true)
  expect(near(p.bl, [30, 60, 220])).toBe(true)
  expect(near(p.br, [240, 220, 40])).toBe(true)
})

test('varias fotos a PNG en un ZIP, y un archivo que no es HEIC avisa', async ({ page }) => {
  await page.goto('/heic-a-jpg')
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'PNG' }).click()
  await expect(tool.getByText(/Calidad del JPG/)).toHaveCount(0)
  await upload(page, [
    { name: 'uno.heic', mimeType: 'image/heic', buffer: HEIC_SQUARES },
    { name: 'dos.heif', mimeType: '', buffer: HEIC_SQUARES },
  ])
  const r = await convertAndDownload(page)
  expect(r.name).toBe('docusmart-png.zip')
  expect(r.data.subarray(0, 2).toString('latin1')).toBe('PK')

  await page.reload()
  // Un archivo que no es una foto se rechaza al elegirlo (barrido 2026-11-25), con su nombre.
  await upload(page, [{ name: 'falsa.heic', mimeType: 'image/heic', buffer: Buffer.from('esto no es una foto') }])
  await expect(tool.getByText(/^falsa\.heic: No se pudo abrir la imagen/)).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Convertir' })).toBeDisabled()
})
