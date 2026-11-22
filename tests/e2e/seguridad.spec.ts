// Seguridad tras la auditoría W-146.3: contraseñas largas, proteger solo con restricciones,
// cambiar la contraseña, y quitar metadatos de fotos dentro del PDF, comentarios y autores.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFDocument, PDFName, PDFString } from 'pdf-lib'
import { strToU8, zipSync, unzipSync, strFromU8 } from 'fflate'
import { expect, makePdf, test, upload } from './helpers'
import { buildExif, docxWithMeta, jpegWithMeta } from '../shared/metaFixtures'

async function save(page: Page): Promise<Uint8Array> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 30_000 })
  return new Uint8Array(await readFile((await (await wait).path())!))
}

test('proteger: avisa si la contraseña es demasiado larga y permite proteger solo con restricciones @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/proteger')
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  const passwords = page.locator('input[type=password]')
  const long = 'ñ'.repeat(70)
  await passwords.nth(0).fill(long)
  await passwords.nth(1).fill(long)
  await expect(page.getByText('Demasiado larga: máximo 127 bytes', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Proteger PDF' })).toBeDisabled()

  await page.getByRole('group', { name: 'Tipo de protección' }).getByRole('button', { name: 'Solo restricciones' }).click()
  await expect(page.getByText('Desmarca al menos un permiso', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Proteger PDF' })).toBeDisabled()
  await page.getByLabel('Imprimir').uncheck()
  await expect(page.getByText('Cualquiera podrá abrir el PDF', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Proteger PDF' }).click()
  const out = await save(page)
  // Abre sin contraseña, pero queda cifrado con las restricciones.
  const doc = await PDFDocument.load(out, { ignoreEncryption: true })
  expect(doc.isEncrypted).toBe(true)
})

test('proteger un PDF que ya tiene contraseña: con la actual se cambia', async ({ page }) => {
  // Primero se protege con "vieja1234"…
  await page.goto('/app/#/pdf/proteger')
  await upload(page, [{ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  let passwords = page.locator('input[type=password]')
  await passwords.nth(0).fill('vieja1234')
  await passwords.nth(1).fill('vieja1234')
  await page.getByRole('button', { name: 'Proteger PDF' }).click()
  const locked = await save(page)

  // …y luego se cambia a "nueva5678" con la actual.
  await page.reload()
  await upload(page, [{ name: 'contrato-protegido.pdf', mimeType: 'application/pdf', buffer: Buffer.from(locked) }])
  await expect(page.getByText('Este PDF ya tiene contraseña', { exact: false })).toBeVisible()
  await page.getByLabel('Contraseña actual').fill('vieja1234')
  passwords = page.locator('input[type=password]')
  await passwords.nth(1).fill('nueva5678')
  await passwords.nth(2).fill('nueva5678')
  await page.getByRole('button', { name: 'Cambiar protección' }).click()
  await expect(page.getByText('Así quedó tu PDF protegido')).toBeVisible({ timeout: 20_000 })
})

test('quitar metadatos: el GPS de las fotos dentro del PDF, y comentarios, adjuntos y JavaScript', async ({ page }) => {
  await page.goto('/app/#/metadatos/quitar')
  // Una foto real (hecha en el navegador) con EXIF de celular y GPS, dentro de un PDF con un comentario.
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(32, 24)
    c.getContext('2d')!.fillRect(0, 0, 32, 24)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  const photo = jpegWithMeta(new Uint8Array(Buffer.from(b64, 'base64')), buildExif({ make: 'Apple', model: 'iPhone 15', gps: [4.6, -74.08] }))
  const doc = await PDFDocument.create()
  const p = doc.addPage([300, 300])
  p.drawImage(await doc.embedJpg(photo), { x: 0, y: 0, width: 100, height: 75 })
  const note = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [10, 10, 30, 30], T: PDFString.of('Juan Revisor'), Contents: PDFString.of('Ojo') }))
  p.node.set(PDFName.of('Annots'), doc.context.obj([note]))
  await doc.attach(strToU8('privado'), 'nomina.txt', { mimeType: 'text/plain' })
  await upload(page, [{ name: 'escaneo.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }])

  await expect(page.getByText('Fotos con datos (cámara, GPS…)')).toBeVisible()
  await expect(page.getByText('Juan Revisor')).toBeVisible()
  await expect(page.getByText('Archivos adjuntos', { exact: true })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Quitar también comentarios, adjuntos y JavaScript' })).toBeChecked()
  await page.getByRole('button', { name: 'Quitar metadatos' }).click()
  await expect(page.getByText('No quedó ningún dato oculto.')).toBeVisible()
  const out = await PDFDocument.load(await save(page))
  const raw = out.context.enumerateIndirectObjects().map(([, o]) => o.toString()).join('\n')
  expect(raw).not.toContain('Juan Revisor')
  expect(out.getPage(0).node.get(PDFName.of('Annots'))).toBeUndefined()
})

test('quitar metadatos de Word: los autores de comentarios y cambios pasan a "Autor"', async ({ page }) => {
  await page.goto('/app/#/metadatos/quitar')
  const files = unzipSync(docxWithMeta())
  files['word/comments.xml'] = strToU8('<w:comments xmlns:w="w"><w:comment w:id="0" w:author="Pedro Jefe"><w:p/></w:comment></w:comments>')
  await upload(page, [{ name: 'acta.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(zipSync(files)) }])
  await expect(page.getByText('Autores de comentarios y cambios')).toBeVisible()
  await expect(page.getByText('Pedro Jefe')).toBeVisible()
  await page.getByRole('button', { name: 'Quitar metadatos' }).click()
  const out = unzipSync(await save(page))
  expect(strFromU8(out['word/comments.xml'])).toContain('w:author="Autor"')
  expect(Object.values(out).map((b) => strFromU8(b)).join('')).not.toContain('Pedro Jefe')
})
