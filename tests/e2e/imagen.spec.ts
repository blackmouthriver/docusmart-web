// Imagen tras la auditoría W-146.8: PNG con paleta que sigue siendo PNG, comprimir a un tamaño,
// medidas de redes y centímetros con su resolución, girar un JPG sin pérdida y la mejora automática.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './helpers'

async function canvasFile(page: Page, kind: 'screenshot' | 'photo', type: 'image/png' | 'image/jpeg', w: number, h: number): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ kind, type, w, h }) => {
      const c = new OffscreenCanvas(w, h)
      const ctx = c.getContext('2d')!
      if (kind === 'screenshot') {
        ctx.fillStyle = '#f5f6fa'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(0, 0, w, 60)
        ctx.fillStyle = '#141414'
        ctx.font = '18px Arial'
        for (let i = 0; i < 25; i++) ctx.fillText(`Línea ${i} de la factura 2026 — total $ ${i * 1500}`, 40, 100 + i * 28)
      } else {
        const img = ctx.createImageData(w, h)
        let seed = 3
        for (let i = 0; i < img.data.length; i += 4) {
          seed = (seed * 1103515245 + 12345) % 2147483648
          const n = (seed >>> 16) & 63
          img.data.set([((i / 4) % w) / w * 200 + n, (i / 4 / w / h) * 200 + n, 120 + n, 255], i)
        }
        ctx.putImageData(img, 0, 0)
      }
      const bytes = new Uint8Array(await (await c.convertToBlob({ type, quality: 0.95 })).arrayBuffer())
      let s = ''
      for (const b of bytes) s += String.fromCharCode(b)
      return btoa(s)
    },
    { kind, type, w, h },
  )
  return Buffer.from(b64, 'base64')
}

async function process(page: Page, sub: string, file: { name: string; mimeType: string; buffer: Buffer }, setup: () => Promise<void>, button: string) {
  await page.goto(`/app/#/imagen/${sub}`)
  // Se recarga: la ruta con # no cambia de página y la imagen anterior seguiría elegida.
  await page.reload()
  await page.locator('main input[type=file]').first().setInputFiles(file)
  await setup()
  await page.getByRole('button', { name: button, exact: true }).click()
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

const pngSize = (b: Uint8Array) => [new DataView(b.buffer, b.byteOffset).getUint32(16), new DataView(b.buffer, b.byteOffset).getUint32(20)]
/** Ancho y alto de un JPG (del primer SOF). */
function jpegSize(b: Uint8Array): number[] {
  let i = 2
  while (i < b.length) {
    const m = b[i + 1]
    const len = (b[i + 2] << 8) | b[i + 3]
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [(b[i + 7] << 8) | b[i + 8], (b[i + 5] << 8) | b[i + 6]]
    i += 2 + len
  }
  return []
}

test('comprimir una captura PNG: sigue siendo PNG, con paleta, y pesa menos', async ({ page }) => {
  await page.goto('/app/#/imagen/comprimir')
  const png = await canvasFile(page, 'screenshot', 'image/png', 1280, 800)
  const out = await process(page, 'comprimir', { name: 'captura.png', mimeType: 'image/png', buffer: png }, async () => {
    await expect(page.getByRole('group', { name: 'Formato' }).getByRole('button', { name: 'Igual que la original' })).toHaveAttribute('aria-pressed', 'true')
  }, 'Comprimir')
  expect(out.name).toBe('captura-comprimida.png')
  expect(Array.from(out.bytes.subarray(1, 4))).toEqual([0x50, 0x4e, 0x47])
  expect(out.bytes[25]).toBe(3) // tipo de color 3: paleta
  expect(out.bytes.length).toBeLessThan(png.length * 0.8)
  expect(pngSize(out.bytes)).toEqual([1280, 800])
})

test('comprimir a un tamaño máximo: una foto pesada queda bajo 100 KB @movil', async ({ page }) => {
  await page.goto('/app/#/imagen/comprimir')
  const jpg = await canvasFile(page, 'photo', 'image/jpeg', 2000, 1500)
  expect(jpg.length).toBeGreaterThan(300 * 1024)
  const out = await process(page, 'comprimir', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }, async () => {
    await page.getByRole('group', { name: 'Tamaño máximo' }).getByRole('button', { name: '100 KB' }).click()
    await expect(page.getByText('Se baja la calidad', { exact: false })).toBeVisible()
  }, 'Comprimir')
  expect(out.name.endsWith('.jpg')).toBe(true)
  expect(out.bytes.length).toBeLessThanOrEqual(100 * 1024)
})

test('redimensionar: medida de redes (historia) y 10 cm a 300 ppp con la resolución guardada', async ({ page }) => {
  await page.goto('/app/#/imagen/redimensionar')
  const jpg = await canvasFile(page, 'photo', 'image/jpeg', 1600, 1200)
  const story = await process(page, 'redimensionar', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }, async () => {
    await page.getByRole('button', { name: 'Redes sociales' }).click()
    await page.locator('main select').selectOption('story')
  }, 'Redimensionar')
  expect(jpegSize(story.bytes)).toEqual([1080, 1920])

  const cm = await process(page, 'redimensionar', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }, async () => {
    await page.getByRole('button', { name: 'En centímetros' }).click()
    await page.getByLabel('Ancho (cm)').fill('10')
    await expect(page.getByRole('group', { name: 'Resolución para imprimir' }).getByRole('button', { name: '300 ppp' })).toHaveAttribute('aria-pressed', 'true')
  }, 'Redimensionar')
  expect(jpegSize(cm.bytes)).toEqual([1181, 886])
  // JFIF: unidades en ppp (1) y 300 × 300.
  expect(Array.from(cm.bytes.subarray(13, 18))).toEqual([1, 1, 44, 1, 44])
})

test('girar un JPG sin perder calidad: la imagen queda igual y solo cambia la orientación', async ({ page }) => {
  await page.goto('/app/#/imagen/rotar')
  const jpg = await canvasFile(page, 'photo', 'image/jpeg', 800, 600)
  const out = await process(page, 'rotar', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }, async () => {
    await page.getByRole('button', { name: 'Derecha' }).click()
    await page.getByText('Girar sin perder calidad (JPG)').click()
    await expect(page.getByText('La foto no se vuelve a comprimir', { exact: false })).toBeVisible()
  }, 'Aplicar giro')
  // El EXIF mínimo: orientación 6 (girar 90° a la derecha).
  const text = Buffer.from(out.bytes).toString('latin1')
  expect(text).toContain('Exif')
  const at = text.indexOf('MM\u0000*')
  expect(out.bytes[at + 19]).toBe(6)
  // Los datos de la imagen son los mismos.
  expect(Buffer.from(out.bytes.subarray(out.bytes.length - 5000)).equals(jpg.subarray(jpg.length - 5000))).toBe(true)
  // El navegador la muestra girada: 600 × 800.
  const shown = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob(), { imageOrientation: 'from-image' })
    return [bmp.width, bmp.height]
  }, Buffer.from(out.bytes).toString('base64'))
  expect(shown).toEqual([600, 800])
})

test('ajustar: mejora automática y nitidez @movil', async ({ page }) => {
  await page.goto('/app/#/imagen/ajustar')
  const jpg = await canvasFile(page, 'photo', 'image/jpeg', 600, 400)
  const out = await process(page, 'ajustar', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }, async () => {
    await page.getByText('Mejora automática (tonos y color)').click()
    const slider = page.locator('main input[type=range]').nth(4)
    await slider.fill('50')
    await expect(page.getByText('Nitidez: 50')).toBeVisible()
  }, 'Aplicar ajustes')
  expect(out.name).toBe('foto-ajustada.jpg')
  expect(jpegSize(out.bytes)).toEqual([600, 400])
})
