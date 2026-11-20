// Marca de agua en imágenes (W-123): texto, mosaico y logo, con la CSP de producción.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Locator, Page } from '@playwright/test'
import { expect, test, upload } from './helpers'

/** PNG de un solo color hecho en la página. */
async function solid(page: Page, w: number, h: number, color: string): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ w, h, color }) => {
      const c = new OffscreenCanvas(w, h)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
      let s = ''
      for (const b of bytes) s += String.fromCharCode(b)
      return btoa(s)
    },
    { w, h, color },
  )
  return Buffer.from(b64, 'base64')
}

/** Cuántos pixeles de cada zona (en tercios de la imagen) cumplen la condición. */
async function zones(page: Page, png: Buffer, test: 'bright' | 'red') {
  return page.evaluate(
    async ({ b64, test }) => {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob())
      const c = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data
      const out = Array.from({ length: 9 }, () => 0)
      for (let y = 0; y < bmp.height; y++)
        for (let x = 0; x < bmp.width; x++) {
          const i = (y * bmp.width + x) * 4
          const ok = test === 'bright' ? d[i] > 150 && d[i + 1] > 150 && d[i + 2] > 150 : d[i] > 150 && d[i + 1] < 90 && d[i + 2] < 90
          if (ok) out[Math.min(2, Math.floor((3 * y) / bmp.height)) * 3 + Math.min(2, Math.floor((3 * x) / bmp.width))]++
        }
      return { size: [bmp.width, bmp.height], zones: out }
    },
    { b64: png.toString('base64'), test },
  )
}

/** Mueve un control deslizante (React escucha el evento input con el valor nativo). */
async function setRange(input: Locator, value: number) {
  await input.evaluate((el: HTMLInputElement, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

async function apply(page: Page, button = 'Aplicar marca de agua') {
  await page.locator('#tool').getByRole('button', { name: button }).click()
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) }
}

test('texto blanco en el centro y luego en mosaico', async ({ page }) => {
  await page.goto('/marca-de-agua-imagen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marca de agua en imágenes')
  await upload(page, [{ name: 'negra.png', mimeType: 'image/png', buffer: await solid(page, 600, 400, '#000000') }])
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Aplicar marca de agua' })).toBeDisabled()
  await expect(tool.getByText('Escribe el texto de la marca.')).toBeVisible()
  await tool.getByLabel('Texto de la marca').fill('DOCUSMART')
  await tool.getByLabel('Posición').selectOption('c')
  await setRange(tool.getByLabel(/^Opacidad/), 100)
  await expect(tool.getByRole('img', { name: 'Vista previa con la marca de agua' })).toBeVisible()

  const centro = await apply(page)
  expect(centro.name).toBe('negra-marca.png')
  const c = await zones(page, centro.data, 'bright')
  expect(c.size).toEqual([600, 400])
  expect(c.zones[4]).toBeGreaterThan(300) // el texto, en el centro
  expect(c.zones[0] + c.zones[2] + c.zones[6] + c.zones[8]).toBe(0) // las esquinas, negras

  await tool.getByLabel('Posición').selectOption('tile')
  const mosaico = await apply(page)
  const t = await zones(page, mosaico.data, 'bright')
  for (const z of t.zones) expect(z).toBeGreaterThan(50) // repetido en toda la imagen
})

test('logo abajo a la derecha, en varias imágenes a la vez', async ({ page }) => {
  await page.goto('/marca-de-agua-imagen')
  const black = await solid(page, 600, 400, '#000000')
  await upload(page, [
    { name: 'uno.png', mimeType: 'image/png', buffer: black },
    { name: 'dos.png', mimeType: 'image/png', buffer: black },
  ])
  const tool = page.locator('#tool')
  await tool.getByRole('button', { name: 'Logo', exact: true }).click()
  await expect(tool.getByText('Elige el logo.')).toBeVisible()
  await tool.locator('input[type=file]').nth(1).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: await solid(page, 100, 50, '#ff0000') })
  await setRange(tool.getByLabel(/^Opacidad/), 100)
  await expect(tool.getByText('La misma marca se aplica a las 2 imágenes.')).toBeVisible()
  const zip = await apply(page, 'Aplicar a 2 imágenes')
  expect(zip.name).toBe('imagenes-con-marca.zip')
  expect(zip.data.subarray(0, 2).toString('latin1')).toBe('PK')

  // La primera, sola: el logo rojo queda en la esquina de abajo a la derecha (la posición por defecto).
  await page.reload()
  await upload(page, [{ name: 'uno.png', mimeType: 'image/png', buffer: black }])
  await tool.getByRole('button', { name: 'Logo', exact: true }).click()
  await tool.locator('input[type=file]').nth(1).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: await solid(page, 100, 50, '#ff0000') })
  await setRange(tool.getByLabel(/^Opacidad/), 100)
  const one = await apply(page)
  const r = await zones(page, one.data, 'red')
  expect(r.zones[8]).toBeGreaterThan(1000)
  expect(r.zones[0] + r.zones[1] + r.zones[3] + r.zones[4]).toBe(0)
})
