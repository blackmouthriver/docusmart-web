// Más formatos de imagen (W-124): GIF, AVIF e ICO de salida; SVG y TIFF de entrada. Con la CSP de producción.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test, upload } from './helpers'
import { SVG_LOGO, tinyTiff } from './fixtures'

/** PNG de 200 × 100: mitad izquierda verde opaca y mitad derecha transparente. */
async function halfTransparent(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(200, 100)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#16a34a'
    ctx.fillRect(0, 0, 100, 100)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  return Buffer.from(b64, 'base64')
}

/** Tamaño y color (RGBA) de algunos puntos de una imagen descargada, decodificada por el navegador. */
async function probe(page: Page, data: Buffer, mime: string, points: Array<[number, number]>) {
  return page.evaluate(
    async ({ b64, mime, points }) => {
      const bmp = await createImageBitmap(await (await fetch(`data:${mime};base64,${b64}`)).blob())
      const c = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      return { size: [bmp.width, bmp.height], px: points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data)) }
    },
    { b64: data.toString('base64'), mime, points },
  )
}

async function convert(page: Page, timeout = 30_000) {
  await page.locator('#tool').getByRole('button', { name: 'Convertir' }).click()
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeVisible({ timeout })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) }
}

test('imagen a GIF conserva la transparencia', async ({ page }) => {
  await page.goto('/imagen-a-gif')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imagen a GIF')
  await expect(page.locator('#tool').getByText(/GIF admite hasta 256 colores/)).toBeVisible()
  await upload(page, [{ name: 'mitad.png', mimeType: 'image/png', buffer: await halfTransparent(page) }])
  const r = await convert(page)
  expect(r.name).toBe('mitad.gif')
  expect(r.data.subarray(0, 6).toString('latin1')).toBe('GIF89a')
  const p = await probe(page, r.data, 'image/gif', [[50, 50], [150, 50]])
  expect(p.size).toEqual([200, 100])
  expect(p.px[0][1]).toBeGreaterThan(130) // verde
  expect(p.px[0][3]).toBe(255)
  expect(p.px[1][3]).toBe(0) // transparente
})

test('imagen a AVIF con el codificador en wasm', async ({ page }) => {
  test.setTimeout(120_000)
  const wasm = page.waitForRequest((req) => req.url().endsWith('/avif/avif_enc.wasm'))
  await page.goto('/imagen-a-avif')
  await upload(page, [{ name: 'mitad.png', mimeType: 'image/png', buffer: await halfTransparent(page) }])
  const r = await convert(page, 100_000)
  await wasm
  expect(r.name).toBe('mitad.avif')
  expect(r.data.subarray(4, 12).toString('latin1')).toBe('ftypavif')
  const p = await probe(page, r.data, 'image/avif', [[50, 50], [150, 50]])
  expect(p.size).toEqual([200, 100])
  expect(p.px[0][1]).toBeGreaterThan(110)
  expect(p.px[1][3]).toBeLessThan(10)
})

test('PNG a ICO arma un favicon con 6 tamaños', async ({ page }) => {
  await page.goto('/png-a-ico')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PNG a ICO (favicon)')
  await upload(page, [{ name: 'logo.png', mimeType: 'image/png', buffer: await halfTransparent(page) }])
  const r = await convert(page)
  expect(r.name).toBe('logo.ico')
  expect(r.data.readUInt16LE(2)).toBe(1)
  expect(r.data.readUInt16LE(4)).toBe(6)
  const sizes = [0, 1, 2, 3, 4, 5].map((i) => r.data[6 + 16 * i] || 256)
  expect(sizes).toEqual([16, 32, 48, 64, 128, 256])
  // Cada imagen es un PNG.
  const firstAt = r.data.readUInt32LE(6 + 12)
  expect(r.data.subarray(firstAt + 1, firstAt + 4).toString('latin1')).toBe('PNG')
})

test('SVG a PNG en alta resolución y con fondo transparente', async ({ page }) => {
  await page.goto('/svg-a-png')
  await upload(page, [{ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: SVG_LOGO }])
  const r = await convert(page)
  expect(r.name).toBe('logo.png')
  const p = await probe(page, r.data, 'image/png', [[256, 256], [768, 256], [1020, 4]])
  expect(p.size).toEqual([1024, 512])
  expect(p.px[0].slice(0, 3)).toEqual([29, 78, 216]) // azul
  expect(p.px[1][0]).toBeGreaterThan(200) // rojo
  expect(p.px[2][3]).toBe(0) // esquina transparente
})

test('TIFF a JPG, y un TIFF también se abre en Comprimir imagen', async ({ page }) => {
  await page.goto('/tiff-a-jpg')
  const tiff = tinyTiff(40, 30, [200, 30, 30])
  await upload(page, [{ name: 'escaneo.tif', mimeType: 'image/tiff', buffer: tiff }])
  const r = await convert(page)
  expect(r.name).toBe('escaneo.jpg')
  const p = await probe(page, r.data, 'image/jpeg', [[20, 15]])
  expect(p.size).toEqual([40, 30])
  expect(p.px[0][0]).toBeGreaterThan(170)
  expect(p.px[0][1]).toBeLessThan(70)

  await page.goto('/comprimir-imagen')
  await upload(page, [{ name: 'escaneo.tif', mimeType: 'image/tiff', buffer: tiff }])
  await page.locator('#tool').getByRole('button', { name: 'Comprimir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).click()
  // Nunca devuelve el TIFF original: siempre una imagen que se puede abrir.
  expect((await wait).suggestedFilename()).toMatch(/^escaneo-.+\.jpg$/)
})
