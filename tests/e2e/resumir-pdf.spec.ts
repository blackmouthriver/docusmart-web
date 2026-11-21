// Resumir PDF (W-142): resumen extractivo de un PDF en el navegador.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { expect, test } from './helpers'

const SENTENCES = [
  'La energia solar es una fuente renovable que aprovecha la radiacion del sol para producir electricidad.',
  'Los paneles solares convierten la radiacion en electricidad mediante celdas fotovoltaicas de silicio.',
  'El costo de los paneles solares bajo mucho y la energia solar ya compite con el carbon.',
  'Mi primo tiene un perro que se llama Max y le gusta correr en el parque los domingos.',
  'La energia solar necesita baterias para guardar la electricidad que se produce durante el dia.',
  'Las baterias de litio permiten usar la energia solar de noche y en dias nublados.',
  'Ayer llovio mucho en la ciudad y el trafico estuvo lento por varias horas.',
  'Muchos paises instalan parques de energia solar para reducir las emisiones de carbono.',
  'La electricidad solar en los techos de las casas reduce la factura de energia de las familias.',
  'En resumen, la energia solar y las baterias son clave para la transicion energetica.',
]

async function textPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([595, 842])
  SENTENCES.forEach((s, i) => page.drawText(s, { x: 40, y: 780 - i * 22, size: 9, font }))
  return Buffer.from(await doc.save())
}

test('resume un PDF: ideas principales, palabras clave y descarga en .txt', async ({ page }) => {
  await page.goto('/resumir-pdf')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resumir PDF')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'informe.pdf', mimeType: 'application/pdf', buffer: await textPdf() })
  await tool.getByRole('button', { name: 'Corto' }).click()
  await tool.getByRole('button', { name: 'Resumir', exact: true }).click()
  await expect(tool.getByRole('heading', { name: 'Resumen' })).toBeVisible({ timeout: 30_000 })
  const items = tool.locator('.sum-list li')
  await expect(items).toHaveCount(3)
  await expect(tool.locator('.sum-list')).not.toContainText('perro')
  await expect(tool.locator('.chip').first()).toHaveText(/energia|solar/)

  // El largo cambia el resumen al instante.
  await tool.getByRole('button', { name: 'Largo' }).click()
  expect(await items.count()).toBeGreaterThan(3)

  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.txt' }).click()
  const d = await wait
  expect(d.suggestedFilename()).toBe('informe-resumen.txt')
  expect(await readFile((await d.path())!, 'utf8')).toContain('energia solar')
})

test('con muy poco texto avisa que no hay suficiente para resumir', async ({ page }) => {
  await page.goto('/resumir-pdf')
  const tool = page.locator('#tool')
  await tool.getByPlaceholder('Pega aquí el texto que quieres resumir…').fill('Hola mundo.')
  await tool.getByRole('button', { name: 'Resumir', exact: true }).click()
  await expect(tool.getByText('No hay suficiente texto para resumir.')).toBeVisible()
})
