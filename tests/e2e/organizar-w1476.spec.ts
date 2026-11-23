// W-147.6: unir eligiendo páginas de cada archivo, miniaturas que se dibujan al verse, dividir
// por marcadores o por tamaño, y color del número de página.
import { readFile } from 'node:fs/promises'
import type { Download, Page } from '@playwright/test'
import { unzipSync } from 'fflate'
import { PDFDocument, PDFHexString, PDFName, StandardFonts } from 'pdf-lib'
import { OPS, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test, upload } from './helpers'

async function save(page: Page): Promise<{ name: string; bytes: Uint8Array }> {
  const download: Promise<Download> = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).first().click()
  const d = await download
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** PDF con "<tag><n>" en cada página y, si se pide, marcadores del primer nivel. */
async function sample(n: number, tag: string, marks: Array<[string, number]> = [], lines = 1) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Courier)
  for (let i = 0; i < n; i++) {
    const page = doc.addPage([300, 400])
    page.drawText(`${tag}${i + 1}`, { x: 40, y: 360, size: 18, font })
    for (let l = 1; l < lines; l++) page.drawText(`${i}.${l} ${Math.sin(i * 97 + l)} ${'#'.repeat(20)}`, { x: 10, y: 340 - l * 7, size: 5, font })
  }
  if (marks.length) {
    const ctx = doc.context
    const root = ctx.nextRef()
    const refs = marks.map(() => ctx.nextRef())
    marks.forEach(([title, p], i) =>
      ctx.assign(refs[i], ctx.obj({ Title: PDFHexString.fromText(title), Parent: root, ...(i && { Prev: refs[i - 1] }), ...(i < refs.length - 1 && { Next: refs[i + 1] }), Dest: [doc.getPage(p).ref, 'Fit'] })),
    )
    ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[refs.length - 1], Count: refs.length }))
    doc.catalog.set(PDFName.of('Outlines'), root)
  }
  return Buffer.from(await doc.save({ useObjectStreams: false }))
}

/** El texto de la primera línea de cada página. */
async function texts(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const items = (await (await doc.getPage(i)).getTextContent()).items
    out.push('str' in items[0] ? items[0].str : '')
  }
  await task.destroy()
  return out
}

const file = (name: string, buffer: Buffer) => ({ name, mimeType: 'application/pdf', buffer })

test('unir: solo algunas páginas de cada PDF @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/unir')
  await upload(page, [file('a.pdf', await sample(5, 'A')), file('b.pdf', await sample(3, 'B'))])
  await expect(page.locator('.file-item').first()).toContainText('5 páginas')
  await page.getByText('Elegir páginas de cada PDF').click()
  await page.getByRole('textbox', { name: /#1 a\.pdf/ }).fill('4, 1-2')
  await page.getByRole('textbox', { name: /#2 b\.pdf/ }).fill('9')
  await expect(page.getByText('Rango no válido para un PDF de 3 páginas.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unir 2 PDFs' })).toBeDisabled()
  await page.getByRole('textbox', { name: /#2 b\.pdf/ }).fill('3')
  await expect(page.locator('.file-item').first()).toContainText('3 de 5 págs.')
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  // Las páginas elegidas se ordenan de menor a mayor.
  expect(await texts((await save(page)).bytes)).toEqual(['A1', 'A2', 'A4', 'B3'])
})

test('miniaturas: en un PDF largo solo se dibujan las que se ven', async ({ page }) => {
  await page.goto('/app/#/pdf/rotar')
  await upload(page, [file('largo.pdf', await sample(120, 'L'))])
  await expect(page.locator('.file-item')).toContainText('120 páginas')
  await expect(page.locator('.thumb img[data-page="1"]')).toBeVisible()
  await page.waitForTimeout(1500)
  const drawn = await page.locator('.thumb img[data-page]').count()
  expect(drawn).toBeLessThan(120)
  // Al bajar hasta la última, se dibuja.
  await page.locator('.thumb').last().scrollIntoViewIfNeeded()
  await expect(page.locator('.thumb img[data-page="120"]')).toBeVisible()
  // Las 120 están para elegir aunque no se hayan dibujado todas.
  await expect(page.locator('.thumb')).toHaveCount(120)
})

test('dividir por marcadores: un PDF por capítulo con su título', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  await upload(page, [file('libro.pdf', await sample(7, 'P', [['Introducción', 1], ['Capítulo: "Uno"', 3], ['Anexos', 6]]))])
  await page.getByRole('group', { name: /modo/i }).getByRole('button', { name: 'Por marcadores' }).click()
  const list = page.getByRole('list', { name: 'Capítulos según los marcadores' })
  await expect(list.getByRole('listitem')).toHaveCount(4)
  await expect(list.getByRole('listitem').first()).toContainText('Antes del primer marcador')
  await expect(list.getByRole('listitem').nth(2)).toContainText('Páginas 4 a 6')
  await page.getByRole('button', { name: 'Crear 4 PDF' }).click()
  const zip = unzipSync((await save(page)).bytes)
  expect(Object.keys(zip)).toEqual(['libro-01.pdf', 'libro-02-Introducción.pdf', 'libro-03-Capítulo Uno.pdf', 'libro-04-Anexos.pdf'])
  expect(await Promise.all(Object.values(zip).map(texts))).toEqual([['P1'], ['P2', 'P3'], ['P4', 'P5', 'P6'], ['P7']])
})

test('dividir por marcadores: sin marcadores lo dice', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  await upload(page, [file('plano.pdf', await sample(3, 'P'))])
  await page.getByRole('group', { name: /modo/i }).getByRole('button', { name: 'Por marcadores' }).click()
  await expect(page.getByText('Este PDF no tiene marcadores', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear 0 PDF' })).toBeDisabled()
})

test('dividir por tamaño: partes bajo el máximo con todas las páginas @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  const bytes = await sample(10, 'S', [], 45)
  await upload(page, [file('grande.pdf', bytes)])
  await page.getByRole('group', { name: /modo/i }).getByRole('button', { name: 'Por tamaño' }).click()
  await page.getByRole('spinbutton', { name: 'Tamaño máximo de cada parte (MB)' }).fill('0.01')
  await page.getByRole('button', { name: 'Dividir en partes de 0.01 MB' }).click()
  const zip = unzipSync((await save(page)).bytes)
  const parts = Object.values(zip)
  expect(parts.length).toBeGreaterThan(1)
  parts.forEach((p) => expect(p.length).toBeLessThanOrEqual(0.01 * 1024 * 1024))
  expect((await Promise.all(parts.map(texts))).flat()).toEqual(Array.from({ length: 10 }, (_, i) => `S${i + 1}`))
})

test('numerar con color', async ({ page }) => {
  await page.goto('/app/#/pdf/numerar')
  await upload(page, [file('doc.pdf', await sample(2, 'N'))])
  await page.getByRole('group', { name: 'Color' }).getByRole('button', { name: 'Azul marino' }).click()
  await expect(page.getByRole('button', { name: 'Azul marino' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Numerar páginas' }).click()
  const out = (await save(page)).bytes
  const task = getDocument({ data: out.slice() })
  const ops = await (await (await task.promise).getPage(1)).getOperatorList()
  const colors = ops.fnArray.flatMap((fn, i) => (fn === OPS.setFillRGBColor ? [String(ops.argsArray[i][0]).toLowerCase()] : []))
  await task.destroy()
  expect(colors).toContain('#1e3a8a')
})
