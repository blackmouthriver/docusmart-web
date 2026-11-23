// W-147.3: PDF escaneado a Word y a Excel con OCR en un paso, PDF a imagen con resolución,
// calidad y páginas, y GIF animado que conserva la animación.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { strFromU8, unzipSync } from 'fflate'
import gifenc from 'gifenc'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { expect, test } from './helpers'

async function convert(page: Page, files: Array<{ name: string; mimeType: string; buffer: Buffer }>, before?: () => Promise<void>, timeout = 60_000) {
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(files)
  await before?.()
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  const wait = page.waitForEvent('download', { timeout })
  await tool.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** Una hoja escaneada (imagen dentro del PDF, sin texto) con un título y una tabla de 3 columnas. */
async function scannedPdf(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(1700, 1100)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1700, 1100)
    ctx.fillStyle = '#000'
    ctx.font = 'bold 64px Arial, sans-serif'
    ctx.fillText('FACTURA DE VENTA', 120, 140)
    ctx.font = '52px Arial, sans-serif'
    const rows = [['CANTIDAD', 'PRODUCTO', 'VALOR'], ['2', 'CUADERNO', '8000'], ['5', 'LAPIZ', '6500'], ['1', 'MORRAL', '95000']]
    rows.forEach((r, i) => r.forEach((cell, j) => ctx.fillText(cell, 120 + j * 560, 330 + i * 150)))
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  const doc = await PDFDocument.create()
  const img = await doc.embedPng(Buffer.from(b64, 'base64'))
  doc.addPage([612, 396]).drawImage(img, { x: 0, y: 0, width: 612, height: 396 })
  return Buffer.from(await doc.save())
}

test('PDF escaneado a Word: reconoce el texto en el mismo paso', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/pdf-a-word')
  const out = await convert(page, [{ name: 'factura.pdf', mimeType: 'application/pdf', buffer: await scannedPdf(page) }], undefined, 200_000)
  expect(out.name).toBe('factura.docx')
  const xml = strFromU8(unzipSync(out.bytes)['word/document.xml'])
  const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(' ')
  expect(text).toMatch(/FACTURA/)
  expect(text).toMatch(/CUADERNO/)
  // La foto del escaneo no se repite en el Word: el texto ya está como texto.
  expect(Object.keys(unzipSync(out.bytes)).filter((f) => f.startsWith('word/media/'))).toHaveLength(0)
  await expect(page.getByText('1 página escaneada se reconoció con OCR.', { exact: false })).toBeVisible()
})

test('PDF escaneado a Excel: cada columna de la tabla en su celda', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/pdf-a-excel')
  const out = await convert(page, [{ name: 'factura.pdf', mimeType: 'application/pdf', buffer: await scannedPdf(page) }], undefined, 200_000)
  const files = unzipSync(out.bytes)
  const shared = files['xl/sharedStrings.xml'] ? [...strFromU8(files['xl/sharedStrings.xml']).matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]) : []
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])
  const rows = [...sheet.matchAll(/<row[^>]*>(.*?)<\/row>/g)].map((r) =>
    [...r[1].matchAll(/<c r="[A-Z]+\d+"([^>]*)>(.*?)<\/c>/g)].map((c) => {
      const v = /<v>([^<]*)<\/v>/.exec(c[2])?.[1] ?? /<t[^>]*>([^<]*)<\/t>/.exec(c[2])?.[1] ?? ''
      return c[1].includes('t="s"') ? shared[Number(v)] : v
    }),
  )
  const product = rows.find((r) => r.some((c) => /CUADERNO/.test(c)))!
  expect(product).toHaveLength(3)
  expect(product[2]).toMatch(/8\.?000/)
})

test('Sin OCR, el PDF escaneado avisa que no tiene texto @movil', async ({ page }) => {
  await page.goto('/pdf-a-word')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'factura.pdf', mimeType: 'application/pdf', buffer: await scannedPdf(page) })
  await tool.getByLabel('Reconocer el texto de las páginas escaneadas (OCR en tu navegador)').uncheck()
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  await expect(tool.locator('.notice').filter({ hasText: /texto/ }).first()).toBeVisible({ timeout: 30_000 })
})

async function threePages(): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= 3; i++) doc.addPage([595, 842]).drawText(`Pagina ${i}`, { x: 60, y: 760, size: 30, font })
  return Buffer.from(await doc.save())
}

const jpegWidth = (b: Uint8Array) => {
  for (let i = 2; i < b.length; ) {
    const marker = b[i + 1]
    if (marker >= 0xc0 && marker <= 0xc2) return (b[i + 7] << 8) | b[i + 8]
    i += 2 + ((b[i + 2] << 8) | b[i + 3])
  }
  return 0
}

test('PDF a JPG: solo las páginas elegidas, a 72 ppp y con calidad a elección @movil', async ({ page }) => {
  await page.goto('/pdf-a-jpg')
  const tool = page.locator('#tool')
  const out = await convert(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: await threePages() }], async () => {
    await tool.getByRole('button', { name: 'JPG', exact: true }).click()
    await tool.getByRole('button', { name: '72 ppp (pantalla)' }).click()
    await tool.getByRole('slider').fill('60')
    await tool.getByLabel('Páginas (vacío = todas)').fill('2-3')
  })
  const files = unzipSync(out.bytes)
  expect(Object.keys(files).sort()).toEqual(['informe-pagina-2.jpg', 'informe-pagina-3.jpg'])
  expect(jpegWidth(files['informe-pagina-2.jpg'])).toBe(595)

  // Páginas que no existen: avisa en vez de fallar.
  await tool.getByLabel('Páginas (vacío = todas)').fill('7-9')
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  await expect(tool.getByText('Las páginas no son válidas', { exact: false })).toBeVisible()
})

function animatedGif(): Buffer {
  // gifenc es CommonJS para Node: se toma del export por defecto.
  const { GIFEncoder, applyPalette, quantize } = gifenc
  const gif = GIFEncoder()
  for (const [r, g, b] of [[220, 0, 0], [0, 180, 0], [0, 0, 220]]) {
    const data = new Uint8Array(24 * 24 * 4)
    for (let i = 0; i < data.length; i += 4) data.set([r, g, b, 255], i)
    const palette = quantize(data, 16)
    gif.writeFrame(applyPalette(data, palette), 24, 24, { palette, delay: 200 })
  }
  gif.finish()
  return Buffer.from(gif.bytes())
}
/** Cuadros de un GIF: uno por cada bloque de control gráfico (21 F9 04). */
const gifFrames = (b: Uint8Array) => b.reduce((n, _, i) => n + (b[i] === 0x21 && b[i + 1] === 0xf9 && b[i + 2] === 0x04 ? 1 : 0), 0)

test('Imagen a GIF: un GIF animado conserva sus cuadros', async ({ page }) => {
  await page.goto('/imagen-a-gif')
  const src = animatedGif()
  expect(gifFrames(src)).toBe(3)
  const out = await convert(page, [{ name: 'semaforo.gif', mimeType: 'image/gif', buffer: src }])
  expect(out.name).toBe('semaforo.gif')
  expect(gifFrames(out.bytes)).toBe(3)
})
