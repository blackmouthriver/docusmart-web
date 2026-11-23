// W-147.2: dibujo a mano alzada, líneas, flechas y enlaces en Editar PDF; guardar y cargar las
// respuestas de un formulario; censurar dejando buscable el resto del texto.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString, StandardFonts } from 'pdf-lib'
import { OPS, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, makePdf, test, upload } from './helpers'

async function save(page: Page): Promise<Uint8Array> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 30_000 })
  return new Uint8Array(await readFile((await (await wait).path())!))
}

/** Arrastra sobre la página de una fracción a otra, pasando por los puntos intermedios. */
async function drag(page: Page, points: Array<[number, number]>) {
  const img = page.locator('.edit-stage img').first()
  await img.scrollIntoViewIfNeeded()
  const b = (await img.boundingBox())!
  const at = ([u, v]: [number, number]) => [b.x + b.width * u, b.y + b.height * v] as const
  await page.mouse.move(...at(points[0]))
  await page.mouse.down()
  for (const p of points.slice(1)) await page.mouse.move(...at(p), { steps: 4 })
  await page.mouse.up()
}

test('editar: dibujo a mano alzada, línea, flecha y enlaces a un sitio y a una página', async ({ page }) => {
  await page.goto('/app/#/pdf/editar')
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(2) }])
  await page.getByRole('button', { name: 'Dibujar', exact: true }).click()
  await drag(page, [[0.2, 0.3], [0.25, 0.35], [0.3, 0.3], [0.35, 0.36], [0.4, 0.3]])
  // Se puede seguir dibujando sin volver a elegir la herramienta.
  await drag(page, [[0.2, 0.45], [0.4, 0.5]])
  await page.getByRole('button', { name: 'Línea', exact: true }).click()
  await drag(page, [[0.1, 0.6], [0.8, 0.6]])
  await page.getByRole('button', { name: 'Flecha', exact: true }).click()
  await drag(page, [[0.1, 0.7], [0.5, 0.65]])
  await expect(page.getByText('4 elementos')).toBeVisible()

  await page.getByRole('button', { name: 'Enlace', exact: true }).click()
  await drag(page, [[0.1, 0.1], [0.5, 0.15]])
  // Una dirección peligrosa no se acepta; una normal sí, sin escribir https://.
  const url = page.getByLabel('Dirección')
  await url.fill('javascript:alert(1)')
  await expect(page.getByText('Esa dirección no es válida', { exact: false })).toBeVisible()
  await url.fill('docusmart.online')
  await expect(page.locator('.edit-link-label').first()).toContainText('docusmart.online')
  await page.getByRole('button', { name: 'Enlace', exact: true }).click()
  await drag(page, [[0.1, 0.8], [0.4, 0.85]])
  await page.getByRole('button', { name: 'Página del documento' }).click()
  await page.getByLabel('Número de página').fill('2')
  await expect(page.getByText('6 elementos')).toBeVisible()

  await page.getByRole('button', { name: 'Aplicar cambios' }).click()
  const bytes = await save(page)
  const out = await PDFDocument.load(bytes)
  const annots = out.getPage(0).node.lookup(PDFName.of('Annots'), PDFArray)
  expect(annots.size()).toBe(2)
  const uri = annots.lookup(0, PDFDict).lookup(PDFName.of('A'), PDFDict).lookup(PDFName.of('URI')) as PDFString
  expect(uri.decodeText()).toBe('https://docusmart.online')
  expect(annots.lookup(1, PDFDict).lookup(PDFName.of('Dest'), PDFArray).get(0)).toEqual(out.getPage(1).ref)
  // Los 4 trazos (2 dibujos, la línea y la flecha) y la punta rellena de la flecha: 5 rutas
  // (pdf.js junta cada ruta con su trazo o relleno en una sola operación).
  const task = getDocument({ data: bytes.slice() })
  const ops = (await (await (await task.promise).getPage(1)).getOperatorList()).fnArray
  await task.destroy()
  expect(ops.filter((o) => o === OPS.constructPath || o === OPS.stroke || o === OPS.fill).length).toBeGreaterThanOrEqual(5)
})

test('formulario: guardar las respuestas y volver a cargarlas en otro PDF @movil', async ({ page }) => {
  const doc = await PDFDocument.create()
  const p = doc.addPage([595, 842])
  doc.getForm().createTextField('nombre').addToPage(p, { x: 60, y: 700, width: 300, height: 24 })
  doc.getForm().createTextField('cedula').addToPage(p, { x: 60, y: 650, width: 300, height: 24 })
  const pdf = Buffer.from(await doc.save())
  await page.goto('/app/#/pdf/formulario')
  await upload(page, [{ name: 'solicitud.pdf', mimeType: 'application/pdf', buffer: pdf }])
  await page.getByRole('textbox', { name: /nombre/i }).fill('Ana Pérez')
  await page.getByRole('textbox', { name: /cedula/i }).fill('1020304050')
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Guardar respuestas' }).click()
  const d = await wait
  expect(d.suggestedFilename()).toBe('solicitud-respuestas.json')
  const json = await readFile((await d.path())!)

  // Otro PDF igual, vacío: las respuestas vuelven a su lugar.
  await page.getByRole('button', { name: 'Cambiar' }).first().click()
  await upload(page, [{ name: 'solicitud-2.pdf', mimeType: 'application/pdf', buffer: pdf }])
  await expect(page.getByRole('textbox', { name: /nombre/i })).toHaveValue('')
  await page.locator('input[type=file][accept*="json"]').setInputFiles({ name: 'respuestas.json', mimeType: 'application/json', buffer: json })
  await expect(page.getByRole('textbox', { name: /nombre/i })).toHaveValue('Ana Pérez')
  await expect(page.getByRole('textbox', { name: /cedula/i })).toHaveValue('1020304050')
  await expect(page.getByText('Se cargaron 2 respuestas.')).toBeVisible()
})

test('censurar: lo tapado desaparece y el resto del texto se sigue pudiendo buscar', async ({ page }) => {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const p = doc.addPage([595, 842])
  p.drawText('Contrato de arrendamiento de vivienda', { x: 60, y: 760, size: 16, font })
  p.drawText('Arrendatario: Ana Perez, cedula 1020304050', { x: 60, y: 720, size: 12, font })
  await page.goto('/censurar-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) })
  await tool.getByPlaceholder('Un nombre, un número, una palabra…').fill('1020304050')
  await tool.getByRole('button', { name: 'Buscar', exact: true }).click()
  await tool.getByRole('button', { name: 'Censurar PDF' }).click()
  const bytes = await save(page)
  const task = getDocument({ data: bytes.slice() })
  const text = (await (await (await task.promise).getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  expect(text).toContain('Contrato')
  expect(text).toContain('Arrendatario:')
  expect(text).not.toContain('1020304050')
})
