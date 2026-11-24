// Quitar metadatos (W-106): muestra los datos ocultos de una foto, un PDF y un Word y los borra.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync, strFromU8 } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from './helpers'
import { buildExif, docxWithMeta, jpegWithMeta } from '../shared/metaFixtures'

/** JPEG real (decodificable) de 64 × 48, hecho en el navegador. */
async function realJpeg(page: Page): Promise<Uint8Array> {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(64, 48)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#2a7'
    ctx.fillRect(0, 0, 64, 48)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.9 })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

async function pdfWithAuthor() {
  const doc = await PDFDocument.create()
  doc.addPage()
  doc.setAuthor('Ana Secreta')
  doc.setTitle('Contrato privado')
  return Buffer.from(await doc.save())
}

test('muestra los datos ocultos de foto, PDF y Word y los quita en un ZIP', async ({ page }) => {
  await page.goto('/quitar-metadatos')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quitar metadatos (EXIF, GPS y autor)')
  const tool = page.locator('#tool')
  const photo = jpegWithMeta(await realJpeg(page), buildExif({ make: 'Apple', model: 'iPhone 15', artist: 'Ana Secreta', gps: [4.6097, -74.0817] }))
  await tool.locator('input[type=file]').first().setInputFiles([
    { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(photo) },
    { name: 'contrato.pdf', mimeType: 'application/pdf', buffer: await pdfWithAuthor() },
    { name: 'informe.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(docxWithMeta()) },
    { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') },
  ])

  // Lo que se encontró, con la ubicación resaltada.
  await expect(tool.getByText('Ubicación GPS')).toBeVisible()
  await expect(tool.getByText('4.60970, -74.08170')).toBeVisible()
  await expect(tool.getByText('Apple iPhone 15')).toBeVisible()
  await expect(tool.getByText('Esta foto guarda el lugar exacto donde se tomó. Quien la reciba puede verlo.')).toBeVisible()
  await expect(tool.getByText('Contrato privado')).toBeVisible()
  await expect(tool.getByText('Empresa Secreta S.A.S.')).toBeVisible()
  // El .txt no es compatible y no cuenta.
  await expect(tool.getByText('Este tipo de archivo no es compatible. Usa JPG, PNG, WebP, HEIC, TIFF, MP4, MOV, PDF, Word, Excel o PowerPoint.')).toBeVisible()
  await tool.getByRole('button', { name: 'Quitar de la lista nota.txt' }).click()
  await expect(tool.getByText('Este tipo de archivo no es compatible', { exact: false })).toHaveCount(0)

  await tool.getByRole('button', { name: 'Quitar metadatos de 3 archivos' }).click()
  await expect(tool.getByRole('heading', { name: '3 archivos sin metadatos' })).toBeVisible({ timeout: 30_000 })
  await expect(tool.getByText('No quedó ningún dato oculto.')).toHaveCount(3)

  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  expect(file.suggestedFilename()).toBe('archivos-sin-metadatos.zip')
  const files = unzipSync(new Uint8Array(await readFile((await file.path())!)))
  expect(Object.keys(files).sort()).toEqual(['contrato-sin-metadatos.pdf', 'foto-sin-metadatos.jpg', 'informe-sin-metadatos.docx'])
  const cleanPhoto = files['foto-sin-metadatos.jpg']
  expect(Buffer.from(cleanPhoto).includes(Buffer.from('Ana Secreta'))).toBe(false)
  expect(Buffer.from(cleanPhoto).includes(Buffer.from('iPhone'))).toBe(false)
  // La foto sigue abriéndose igual.
  const size = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob())
    return [bmp.width, bmp.height]
  }, Buffer.from(cleanPhoto).toString('base64'))
  expect(size).toEqual([64, 48])
  const pdf = await PDFDocument.load(files['contrato-sin-metadatos.pdf'], { updateMetadata: false })
  expect(pdf.getAuthor()).toBeUndefined()
  expect(pdf.getPageCount()).toBe(1)
  expect(strFromU8(unzipSync(files['informe-sin-metadatos.docx'])['docProps/core.xml'])).not.toContain('Ana')
})

test('una foto sola, sin metadatos, se descarga con su nombre', async ({ page }) => {
  await page.goto('/quitar-metadatos')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'limpia.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(await realJpeg(page)) })
  await expect(tool.getByText('No encontramos metadatos en este archivo.')).toBeVisible()
  await tool.getByRole('button', { name: 'Quitar metadatos', exact: true }).click()
  await expect(tool.getByRole('heading', { name: 'Tu archivo ya no tiene metadatos' })).toBeVisible()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  expect((await wait).suggestedFilename()).toBe('limpia-sin-metadatos.jpg')
})
