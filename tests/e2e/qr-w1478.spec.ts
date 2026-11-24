// W-147.8: QR con color libre y fondo, descarga en PDF y varios QR desde una lista (CSV).
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test } from './helpers'

async function save(page: Page, button: () => Promise<void>): Promise<{ name: string; bytes: Uint8Array }> {
  const wait = page.waitForEvent('download')
  await button()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** Lee un QR con el lector de la propia app (desde una imagen). */
async function readBack(page: Page, png: Uint8Array) {
  await page.goto('/app/#/qr/leer')
  await page.getByRole('group', { name: 'Origen' }).getByRole('button', { name: 'Desde imagen' }).click()
  await page.locator('main input[type=file]').first().setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(png) })
}

test('QR con color libre y fondo de color: se ve con esos colores, se lee y sale en PDF @movil', async ({ page }) => {
  await page.goto('/app/#/qr/crear')
  await page.getByLabel('URL del sitio web').fill('https://docusmart.online/qr')
  await page.getByText('Personalizar diseño').click()
  await page.getByLabel('Otro color', { exact: true }).fill('#1e3a8a')
  await page.getByRole('radio', { name: 'Fondo #FFF8E1' }).click()
  await page.getByRole('button', { name: 'Generar QR' }).click()
  // La esquina es del fondo y hay módulos del color elegido.
  const colors = await page.getByRole('img', { name: 'Código QR generado' }).evaluate(async (img: HTMLImageElement) => {
    const bmp = await createImageBitmap(await (await fetch(img.src)).blob())
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data
    const hex = (i: number) => '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')
    const seen = new Set<string>()
    for (let i = 0; i < d.length; i += 4 * 97) seen.add(hex(i))
    return { corner: hex(0), seen: [...seen] }
  })
  expect(colors.corner).toBe('#fff8e1')
  expect(colors.seen).toContain('#1e3a8a')
  const pdf = await save(page, () => page.getByRole('button', { name: 'PDF (10 cm)' }).click())
  expect(pdf.name).toBe('docusmart-qr.pdf')
  expect((await PDFDocument.load(pdf.bytes)).getPage(0).getWidth()).toBeCloseTo(283.46, 1)
  const png = await save(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).first().click())
  await readBack(page, png.bytes)
  await expect(page.getByText('https://docusmart.online/qr', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
})

test('QR con colores invertidos o sin contraste: avisa y no deja generar', async ({ page }) => {
  await page.goto('/app/#/qr/crear')
  await page.getByLabel('URL del sitio web').fill('https://docusmart.online')
  await page.getByText('Personalizar diseño').click()
  await page.getByLabel('Otro color', { exact: true }).fill('#ffffff')
  await page.getByLabel('Otro fondo').fill('#1e3a8a')
  await expect(page.getByText('El código es más claro que el fondo', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generar QR' })).toBeDisabled()
  await page.getByLabel('Otro color', { exact: true }).fill('#000000')
  await page.getByLabel('Otro fondo').fill('#333333')
  await expect(page.getByText('Estos colores tienen poco contraste', { exact: false })).toBeVisible()
  await page.getByRole('radio', { name: 'Transparente' }).click()
  await expect(page.getByText('Sin fondo, para ponerlo sobre tu diseño', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generar QR' })).toBeEnabled()
})

test('varios QR desde un CSV: hoja para imprimir y ZIP de PNG, saltando la línea que no cabe @movil', async ({ page }) => {
  await page.goto('/app/#/qr/crear')
  await page.getByText('Varios QR desde una lista').click()
  const csv = ['url;nombre', 'https://docusmart.online/mesa/1;Mesa 1', 'https://docusmart.online/mesa/2;Mesa 2', `${'x'.repeat(3500)};Demasiado largo`].join('\n')
  await page.locator('input[type=file][accept*=".csv"]').setInputFiles({ name: 'mesas.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByText('3 QR en la lista')).toBeVisible()
  await expect(page.getByText('QR de 5 cm en hojas A4 (12 por hoja)', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Crear 3 QR' }).click()
  await expect(page.getByText('Listo: 2 QR.')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('se saltaron: 3.', { exact: false })).toBeVisible()
  const sheet = await save(page, () => page.locator('.qr-batch').getByRole('button', { name: 'Descargar', exact: true }).click())
  expect(sheet.name).toBe('docusmart-qr.pdf')
  const task = getDocument({ data: sheet.bytes.slice() })
  const text = (await (await (await task.promise).getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join('|')
  await task.destroy()
  expect(text).toContain('Mesa 1')
  expect(text).toContain('Mesa 2')

  await page.getByRole('group', { name: 'Cómo descargarlos' }).getByRole('button', { name: 'Imágenes PNG (ZIP)' }).click()
  await page.getByRole('button', { name: 'Crear 3 QR' }).click()
  await expect(page.getByText('Listo: 2 QR.')).toBeVisible({ timeout: 30_000 })
  const zip = await save(page, () => page.locator('.qr-batch').getByRole('button', { name: 'Descargar', exact: true }).click())
  const files = unzipSync(zip.bytes)
  expect(Object.keys(files)).toEqual(['001-Mesa-1.png', '002-Mesa-2.png'])
  await readBack(page, files['002-Mesa-2.png'])
  await expect(page.getByText('https://docusmart.online/mesa/2', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
})
