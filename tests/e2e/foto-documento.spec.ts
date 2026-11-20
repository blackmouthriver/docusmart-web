// Foto tamaño documento (W-122): medida exacta a 300 ppp, hoja para imprimir y fondo con IA.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test, upload } from './helpers'
import { APPLE } from './fixtures'

// 300 × 400 en degradado: arriba azul, abajo rojo (el recorte se nota en los colores).
async function portrait(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(300, 400)
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 400)
    g.addColorStop(0, '#0000ff')
    g.addColorStop(1, '#ff0000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 300, 400)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  return Buffer.from(b64, 'base64')
}

async function jpegInfo(page: Page, jpg: Buffer) {
  return page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob())
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    return { size: [bmp.width, bmp.height], corner: Array.from(ctx.getImageData(2, 2, 1, 1).data.slice(0, 3)) }
  }, jpg.toString('base64'))
}

/** Unidades y densidad de la cabecera JFIF (1 = puntos por pulgada). */
const dpi = (jpg: Buffer) => ({ jfif: jpg.subarray(6, 11).toString('latin1'), units: jpg[13], x: jpg.readUInt16BE(14), y: jpg.readUInt16BE(16) })

async function create(page: Page) {
  await page.locator('#tool').getByRole('button', { name: 'Crear foto' }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 200_000 })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  const file = await download
  return { name: file.suggestedFilename(), jpg: await readFile((await file.path())!) }
}

test('foto 3,5 × 4,5 cm con el fondo original: JPG de 413 × 531 a 300 ppp', async ({ page }) => {
  await page.goto('/foto-tamano-documento')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Foto tamaño documento')
  await upload(page, [{ name: 'retrato.png', mimeType: 'image/png', buffer: await portrait(page) }])
  const tool = page.locator('#tool')
  await expect(tool.getByText('Se imprime a 35 × 45 mm (413 × 531 px a 300 ppp).')).toBeVisible()
  await tool.getByRole('button', { name: 'Original' }).click()
  // Sin IA no se avisa de la descarga del modelo.
  await expect(tool.getByText(/La primera vez se descarga el modelo de IA/)).toHaveCount(0)
  const r = await create(page)
  expect(r.name).toBe('retrato-foto-documento.jpg')
  expect(dpi(r.jpg)).toEqual({ jfif: 'JFIF\0', units: 1, x: 300, y: 300 })
  const info = await jpegInfo(page, r.jpg)
  expect(info.size).toEqual([413, 531])
  // Arriba del recorte domina el azul (la foto se recortó, no se deformó ni se rellenó).
  expect(info.corner[2]).toBeGreaterThan(info.corner[0])
})

test('hoja de 10 × 15 cm con 8 copias y otra medida escrita a mano', async ({ page }) => {
  await page.goto('/foto-tamano-documento')
  await upload(page, [{ name: 'retrato.png', mimeType: 'image/png', buffer: await portrait(page) }])
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'Original' }).click()
  await tool.getByRole('button', { name: 'Hoja 10 × 15 cm' }).click()
  await expect(tool.getByText(/^8 copias para imprimir/)).toBeVisible()
  const r = await create(page)
  expect(r.name).toBe('retrato-hoja-fotos-documento.jpg')
  expect(dpi(r.jpg).x).toBe(300)
  const info = await jpegInfo(page, r.jpg)
  expect(info.size).toEqual([1800, 1200])
  // El margen de la hoja es blanco.
  for (const v of info.corner) expect(v).toBeGreaterThan(245)

  // Una medida inválida desactiva el botón y avisa; una válida lo vuelve a activar.
  await tool.getByLabel('Medida').selectOption('custom')
  await tool.getByLabel('Ancho (mm)').fill('5')
  await expect(tool.getByText('Escribe un ancho y un alto entre 10 y 150 mm.')).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Crear foto' })).toBeDisabled()
  await tool.getByLabel('Ancho (mm)').fill('20')
  await tool.getByLabel('Alto (mm)').fill('25')
  await expect(tool.getByRole('button', { name: 'Crear foto' })).toBeEnabled()
})

test('fondo de color con la IA de Quitar fondo', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/foto-tamano-documento')
  await upload(page, [{ name: 'manzana.png', mimeType: 'image/png', buffer: APPLE }])
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'Color', exact: true }).click()
  await tool.getByLabel('Color del fondo').fill('#00ff00')
  await expect(tool.getByText(/La primera vez se descarga el modelo de IA/)).toBeVisible()
  const r = await create(page)
  expect(dpi(r.jpg).x).toBe(300)
  const info = await jpegInfo(page, r.jpg)
  expect(info.size).toEqual([413, 531])
  // La esquina (fondo claro de la foto) queda del verde elegido.
  const [red, green, blue] = info.corner
  expect(green).toBeGreaterThan(200)
  expect(red).toBeLessThan(80)
  expect(blue).toBeLessThan(80)
})
