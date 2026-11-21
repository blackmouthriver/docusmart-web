// Ajustar imagen (W-125): brillo, blanco y negro y enderezar, con la CSP de producción.
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

/** Tamaño y color del centro de una imagen descargada. */
async function center(page: Page, png: Buffer) {
  return page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob())
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    return { size: [bmp.width, bmp.height], rgb: Array.from(ctx.getImageData(bmp.width >> 1, bmp.height >> 1, 1, 1).data.slice(0, 3)) }
  }, png.toString('base64'))
}

/** Mueve un control deslizante (React escucha el evento input con el valor nativo). */
async function setRange(input: Locator, value: number) {
  await input.evaluate((el: HTMLInputElement, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

async function apply(page: Page, button = 'Aplicar ajustes') {
  await page.locator('#tool').getByRole('button', { name: button }).click()
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) }
}

test('más brillo aclara la foto y enderezar la recorta sin cambiar la proporción', async ({ page }) => {
  await page.goto('/ajustar-imagen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ajustar imagen')
  await upload(page, [{ name: 'gris.png', mimeType: 'image/png', buffer: await solid(page, 600, 400, '#646464') }])
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Aplicar ajustes' })).toBeDisabled()
  await expect(tool.getByText('Mueve algún ajuste para ver el cambio.')).toBeVisible()
  await setRange(tool.getByLabel(/^Brillo/), 50)
  await expect(tool.getByText('Brillo: +50')).toBeVisible()
  await expect(tool.getByRole('img', { name: 'Vista previa con los ajustes' })).toBeVisible()
  // Comparar muestra la original y vuelve a los ajustes.
  await tool.getByRole('button', { name: 'Comparar con la original' }).click()
  await expect(tool.getByRole('img', { name: 'Vista previa de la imagen original' })).toBeVisible()
  await tool.getByRole('button', { name: 'Comparar con la original' }).click()

  const bright = await apply(page)
  expect(bright.name).toBe('gris-ajustada.png')
  const b = await center(page, bright.data)
  expect(b.size).toEqual([600, 400])
  expect(b.rgb[0]).toBeGreaterThan(150) // 100 + 64
  expect(b.rgb[0]).toBe(b.rgb[2])

  await setRange(tool.getByLabel(/^Enderezar/), 10)
  await expect(tool.getByText(/se recortan un poco los bordes/)).toBeVisible()
  const straight = await apply(page)
  const s = await center(page, straight.data)
  expect(s.size[0]).toBeLessThan(600)
  expect(s.size[0] / s.size[1]).toBeCloseTo(1.5, 1)
})

test('blanco y negro en varias imágenes a la vez', async ({ page }) => {
  await page.goto('/ajustar-imagen')
  const red = await solid(page, 300, 200, '#c83232')
  await upload(page, [
    { name: 'uno.png', mimeType: 'image/png', buffer: red },
    { name: 'dos.png', mimeType: 'image/png', buffer: red },
  ])
  const tool = page.locator('#tool')
  await tool.getByLabel('Blanco y negro').check()
  // En blanco y negro la saturación no aplica.
  await expect(tool.getByLabel(/^Saturación/)).toBeDisabled()
  await expect(tool.getByText('Los mismos ajustes se aplican a las 2 imágenes.')).toBeVisible()
  const zip = await apply(page, 'Aplicar a 2 imágenes')
  expect(zip.name).toBe('imagenes-ajustadas.zip')
  expect(zip.data.subarray(0, 2).toString('latin1')).toBe('PK')

  // Una sola: los tres canales quedan iguales.
  await page.reload()
  await upload(page, [{ name: 'uno.png', mimeType: 'image/png', buffer: red }])
  await tool.getByLabel('Blanco y negro').check()
  const one = await apply(page)
  const c = await center(page, one.data)
  expect(c.rgb[0]).toBe(c.rgb[1])
  expect(c.rgb[1]).toBe(c.rgb[2])
  // Restablecer vuelve todo a cero.
  await tool.getByRole('button', { name: 'Restablecer' }).click()
  await expect(tool.getByLabel('Blanco y negro')).not.toBeChecked()
  await expect(tool.getByRole('button', { name: 'Aplicar ajustes' })).toBeDisabled()
})
