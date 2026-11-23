// W-147.5: retocar el recorte de Quitar fondo con pincel, fondo difuminado y encuadre automático
// de la foto documento. Usan el modelo real (IS-Net) en el navegador.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test, upload } from './helpers'
import { APPLE } from './fixtures'

/** Transparencia (y color) del PNG descargado en algunos puntos. */
async function pixels(page: Page, png: Buffer, points: Array<[number, number]>) {
  return page.evaluate(
    async ({ b64, points }) => {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob())
      const c = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      return points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data))
    },
    { b64: png.toString('base64'), points },
  )
}

async function download(page: Page): Promise<Buffer> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).first().click()
  return readFile((await (await wait).path())!)
}

/** Arrastra sobre el lienzo del pincel de una fracción a otra. */
async function brush(page: Page, from: [number, number], to: [number, number]) {
  const canvas = page.getByLabel('Imagen para retocar con el pincel')
  // El lienzo puede ser más alto que la ventana: se centra para que los trazos caigan en él.
  await canvas.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const b = (await canvas.boundingBox())!
  await page.mouse.move(b.x + b.width * from[0], b.y + b.height * from[1])
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * to[0], b.y + b.height * to[1], { steps: 12 })
  await page.mouse.up()
}

test('retocar con pincel: borrar lo que sobra y recuperar lo que se cortó', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/quitar-fondo')
  await upload(page, [{ name: 'manzana.png', mimeType: 'image/png', buffer: APPLE }])
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'Quitar fondo' }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 200_000 })
  const before = await pixels(page, await download(page), [[100, 100], [5, 100]])
  expect(before[0][3]).toBeGreaterThan(230)
  expect(before[1][3]).toBeLessThan(20)

  await tool.getByRole('button', { name: 'Retocar con pincel' }).click()
  // Borrar: una franja por el centro de la manzana.
  await tool.getByLabel('Tamaño').fill('60')
  await brush(page, [0.3, 0.5], [0.7, 0.5])
  // Recuperar: el borde izquierdo a media altura (fondo original, fuera de la manzana).
  await tool.getByRole('button', { name: 'Recuperar', exact: true }).click()
  await brush(page, [0.01, 0.45], [0.06, 0.55])
  // Deshacer y rehacer el último trazo.
  await tool.getByRole('button', { name: 'Deshacer' }).click()
  await tool.getByRole('button', { name: 'Rehacer' }).click()
  await tool.getByRole('button', { name: 'Aplicar retoques' }).click()
  const after = await pixels(page, await download(page), [[100, 100], [5, 100]])
  expect(after[0][3]).toBeLessThan(20)
  expect(after[1][3]).toBeGreaterThan(230)
})

test('fondo difuminado: el resultado no tiene transparencia', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/quitar-fondo')
  await upload(page, [{ name: 'manzana.png', mimeType: 'image/png', buffer: APPLE }])
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'Difuminado', exact: true }).click()
  await tool.getByRole('button', { name: 'Quitar fondo' }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 200_000 })
  const [corner, center] = await pixels(page, await download(page), [[3, 3], [100, 100]])
  expect(corner[3]).toBe(255)
  expect(center[3]).toBe(255)
})

/** Retrato de prueba: una silueta oscura (cabeza y hombros) abajo a la derecha, sobre fondo claro. */
async function person(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(600, 800)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#e8e4da'
    ctx.fillRect(0, 0, 600, 800)
    ctx.fillStyle = '#2b2b2b'
    ctx.beginPath()
    ctx.arc(400, 420, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(375, 470, 50, 60)
    ctx.beginPath()
    ctx.roundRect(260, 520, 280, 280, 60)
    ctx.fill()
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  return Buffer.from(b64, 'base64')
}

test('foto documento: encuadrar automáticamente lleva el recuadro a la cabeza', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/foto-tamano-documento')
  await upload(page, [{ name: 'retrato.png', mimeType: 'image/png', buffer: await person(page) }])
  const tool = page.locator('#tool')
  const rect = tool.locator('.crop-rect')
  await expect(rect).toBeVisible()
  const start = await rect.getAttribute('style')
  await tool.getByRole('button', { name: 'Encuadrar automáticamente' }).click()
  await expect(rect).not.toHaveAttribute('style', start!, { timeout: 200_000 })
  // El recuadro queda a la derecha, donde está la persona.
  const img = (await tool.locator('.crop-stage img').boundingBox())!
  const box = (await rect.boundingBox())!
  const cx = (box.x + box.width / 2 - img.x) / img.width
  expect(cx).toBeGreaterThan(0.55)
  expect(cx).toBeLessThan(0.78)
  await expect(tool.getByText('No se encontró a una persona')).toHaveCount(0)
})
