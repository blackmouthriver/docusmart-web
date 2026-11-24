// W-147.9: rescatar las páginas de un PDF cortado, quitar metadatos de HEIC, TIFF y video, y
// verificar una lista SHA256SUMS (y el hash por partes de archivos grandes).
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync } from 'fflate'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { expect, test } from './helpers'
import { box, cat, has, heicWithExif, tiff, u16, u32 } from './metaFixtures'
import { recordVideo } from './mediaClips'

async function save(page: Page, click: () => Promise<void>) {
  const wait = page.waitForEvent('download')
  await click()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

test('reparar un PDF cortado: rescata las páginas que llegaron @movil', async ({ page }) => {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < 6; i++) {
    const p = doc.addPage([300, 400])
    for (let l = 0; l < 25; l++) p.drawText(`Pagina ${i + 1} linea ${l} ${'x'.repeat(30)}`, { x: 10, y: 380 - l * 14, size: 8, font })
  }
  const full = await doc.save({ useObjectStreams: false })
  const cut = Buffer.from(full.slice(0, Math.floor(full.length * 0.6)))
  await page.goto('/app/#/pdf/reparar')
  await page.locator('input[type=file]').first().setInputFiles({ name: 'descarga-interrumpida.pdf', mimeType: 'application/pdf', buffer: cut })
  await page.getByRole('button', { name: 'Reparar PDF' }).click()
  await expect(page.getByText('se rescataron 3 de 6 páginas', { exact: false })).toBeVisible({ timeout: 30_000 })
  const out = await save(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).first().click())
  expect((await PDFDocument.load(out.bytes)).getPageCount()).toBe(3)
})

test('quitar metadatos de una foto HEIC y un TIFF: GPS, cámara y autor', async ({ page }) => {
  await page.goto('/app/#/metadatos/quitar')
  const heic = heicWithExif()
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'IMG_0001.HEIC', mimeType: 'image/heic', buffer: Buffer.from(heic.bytes) },
    { name: 'escaneo.tif', mimeType: 'image/tiff', buffer: Buffer.from(tiff()) },
  ])
  await expect(page.getByText('Ubicación GPS').first()).toBeVisible()
  await expect(page.getByText('Esta foto guarda el lugar exacto', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Quitar metadatos de 2 archivos' }).click()
  await expect(page.getByRole('heading', { name: '2 archivos sin metadatos' })).toBeVisible()
  await expect(page.getByText('No se pudo quitar')).toHaveCount(0)
  const zip = await save(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).click())
  const files = unzipSync(zip.bytes)
  expect(Object.keys(files).sort()).toEqual(['IMG_0001-sin-metadatos.HEIC', 'escaneo-sin-metadatos.tif'])
  for (const secret of ['iPhone', 'Ana P', 'Credit']) {
    expect(has(files['IMG_0001-sin-metadatos.HEIC'], secret)).toBe(false)
    expect(has(files['escaneo-sin-metadatos.tif'], secret)).toBe(false)
  }
  // La imagen de la foto HEIC quedó igual, byte por byte.
  const [at, len] = heic.image
  expect(Buffer.from(files['IMG_0001-sin-metadatos.HEIC'].subarray(at, at + len)).equals(Buffer.from(heic.bytes.subarray(at, at + len)))).toBe(true)
})

test('quitar metadatos de un video MP4: ubicación y fecha, y se sigue reproduciendo', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/app/#/metadatos/quitar')
  const clip = await recordVideo(page, 2)
  test.skip(!clip.type.includes('mp4'), 'Este navegador no graba MP4')
  // Como un celular: la ubicación y el programa al final del archivo.
  const qt = (type: string, s: string) => cat(u32(12 + s.length), new Uint8Array([0xa9]), new TextEncoder().encode(type), u16(s.length), u16(0x15c7), new TextEncoder().encode(s))
  const video = Buffer.from(cat(new Uint8Array(clip.buffer), box('udta', qt('xyz', '+04.6097-074.0817/'), qt('too', 'Camara de prueba'))))
  await page.locator('input[type=file]').first().setInputFiles({ name: 'paseo.mp4', mimeType: 'video/mp4', buffer: video })
  await expect(page.getByText('+04.6097-074.0817/')).toBeVisible()
  await page.getByRole('button', { name: 'Quitar metadatos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu archivo ya no tiene metadatos' })).toBeVisible()
  const out = await save(page, () => page.getByRole('button', { name: 'Descargar', exact: true }).click())
  expect(out.name).toBe('paseo-sin-metadatos.mp4')
  expect(out.bytes.length).toBe(video.length)
  expect(has(out.bytes, '+04.6097')).toBe(false)
  // El video limpio se sigue reproduciendo.
  const duration = await page.evaluate(async (b64) => {
    const v = document.createElement('video')
    v.muted = true
    v.src = URL.createObjectURL(await (await fetch('data:video/mp4;base64,' + b64)).blob())
    await new Promise((ok, fail) => {
      v.onloadedmetadata = ok
      v.onerror = fail
    })
    return v.duration
  }, Buffer.from(out.bytes).toString('base64'))
  expect(duration).toBeGreaterThan(1)
})

test('verificar una lista SHA256SUMS: correctos, cambiados y faltantes @movil', async ({ page }) => {
  const a = Buffer.from('contenido del archivo A')
  const b = Buffer.from('contenido del archivo B')
  const sha = (x: Buffer) => createHash('sha256').update(x).digest('hex')
  const list = [`${sha(a)}  dist/a.txt`, `${sha(Buffer.from('otro contenido'))} *b.txt`, `${sha(a)}  falta.zip`].join('\n')
  await page.goto('/app/#/hash/lista')
  await page.getByRole('button', { name: 'Cargar la lista' }).click()
  await page.locator('input[type=file][accept*=".sha256"]').setInputFiles({ name: 'SHA256SUMS', mimeType: 'text/plain', buffer: Buffer.from(list) })
  await expect(page.getByText('SHA256SUMS · 3 archivos en la lista')).toBeVisible()
  await page.locator('main input[type=file]:not([accept*=".sha256"])').first().setInputFiles([
    { name: 'a.txt', mimeType: 'text/plain', buffer: a },
    { name: 'b.txt', mimeType: 'text/plain', buffer: b },
    { name: 'extra.txt', mimeType: 'text/plain', buffer: b },
  ])
  await expect(page.getByText('2 de 3 archivos de la lista encontrados por su nombre.')).toBeVisible()
  await page.getByRole('button', { name: 'Verificar la lista' }).click()
  await expect(page.getByText('1 de 3 correctos: revisa los marcados.')).toBeVisible()
  await expect(page.locator('.hash-item.is-ok')).toContainText('dist/a.txt')
  await expect(page.locator('.hash-item.is-bad')).toContainText('No coincide')
  await expect(page.locator('.hash-item.is-missing')).toContainText('No elegiste este archivo')
  await expect(page.getByText('No están en la lista: extra.txt.')).toBeVisible()
})
