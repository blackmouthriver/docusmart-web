// Organizar PDF tras la auditoría W-146.1: arrastrar y soltar, dividir en varios archivos,
// rotar a la izquierda, duplicar y agregar páginas en blanco, y las opciones de numerar.
import { readFile } from 'node:fs/promises'
import type { Download, Locator, Page } from '@playwright/test'
import { unzipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { expect, makePdf, test, upload } from './helpers'

const pdf = (name: string, pages: number) => ({ name, mimeType: 'application/pdf', buffer: makePdf(pages) })

/** Descarga el resultado de la pantalla (PDF o ZIP) y devuelve sus bytes. */
async function save(page: Page): Promise<{ name: string; bytes: Buffer }> {
  const download: Promise<Download> = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).first().click()
  const d = await download
  return { name: d.suggestedFilename(), bytes: await readFile((await d.path())!) }
}

const pagesOf = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPageCount()

/** Arrastra con el puntero (mouse) de un agarre a otro elemento. */
async function drag(page: Page, from: Locator, to: Locator) {
  await to.scrollIntoViewIfNeeded()
  await from.scrollIntoViewIfNeeded()
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  await page.mouse.up()
}

test('unir: arrastrar para ordenar, marcador por archivo y resultado completo', async ({ page }) => {
  await page.goto('/app/#/pdf/unir')
  await upload(page, [pdf('a.pdf', 1), pdf('b.pdf', 2), pdf('c.pdf', 3)])
  const rows = page.locator('.file-list.sortable > li')
  await expect(rows).toHaveCount(3)
  // c.pdf (tercero) arrastrado al primer lugar.
  await drag(page, page.getByRole('button', { name: 'Arrastra para mover c.pdf' }), rows.first())
  await expect(rows.first()).toContainText('c.pdf')
  await expect(rows.nth(1)).toContainText('a.pdf')
  // Con el teclado: en el agarre, la flecha abajo mueve un lugar.
  await page.getByRole('button', { name: 'Arrastra para mover a.pdf' }).press('ArrowDown')
  await expect(rows.nth(2)).toContainText('a.pdf')
  await page.getByRole('group', { name: 'Marcadores' }).getByRole('button', { name: 'Uno por archivo' }).click()
  await expect(page.getByText('Se conservan los formularios, los marcadores y el título de los PDF.')).toBeVisible()
  await page.getByRole('button', { name: 'Unir 3 PDFs' }).click()
  const out = await save(page)
  expect(out.name).toBe('c-unido.pdf')
  expect(await pagesOf(out.bytes)).toBe(6)
  await page.screenshot({ path: 'test-results/organizar-unir.png', fullPage: true })
})

test('dividir por rangos y cada N páginas en varios PDF (ZIP)', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  await upload(page, [pdf('informe.pdf', 7)])
  await expect(page.locator('.file-item').getByText('7 páginas')).toBeVisible()
  const mode = page.getByRole('group', { name: /modo/i })
  await mode.getByRole('button', { name: 'Por rangos' }).click()
  await page.getByRole('textbox', { name: 'Rangos (cada uno será un PDF)' }).fill('1-3, 6, 4-5')
  await expect(page.getByText('Se crearán 3 PDF')).toBeVisible()
  await page.getByRole('button', { name: 'Crear 3 PDF' }).click()
  let zip = unzipSync(new Uint8Array((await save(page)).bytes))
  expect(Object.keys(zip)).toEqual(['informe-1-3.pdf', 'informe-6.pdf', 'informe-4-5.pdf'])
  expect(await Promise.all(Object.values(zip).map(pagesOf))).toEqual([3, 1, 2])

  await mode.getByRole('button', { name: 'Cada N páginas' }).click()
  await page.getByRole('spinbutton', { name: 'Páginas por PDF' }).fill('3')
  await page.getByRole('button', { name: 'Crear 3 PDF' }).click()
  zip = unzipSync(new Uint8Array((await save(page)).bytes))
  expect(await Promise.all(Object.values(zip).map(pagesOf))).toEqual([3, 3, 1])
  await page.screenshot({ path: 'test-results/organizar-dividir.png', fullPage: true })
})

test('rotar a la izquierda y a la derecha', async ({ page }) => {
  await page.goto('/app/#/pdf/rotar')
  await upload(page, [pdf('scan.pdf', 2)])
  await page.getByRole('button', { name: 'Rotar página 1 a la izquierda' }).click()
  await expect(page.locator('.thumb').first()).toContainText('270°')
  await page.getByRole('button', { name: 'Todas a la derecha' }).click()
  await expect(page.locator('.thumb').first()).toContainText('0°')
  await expect(page.locator('.thumb').nth(1)).toContainText('90°')
  await page.getByRole('button', { name: 'Rotar PDF' }).click()
  const doc = await PDFDocument.load((await save(page)).bytes)
  expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90])
})

test('reordenar: arrastrar, duplicar y agregar una página en blanco @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/reordenar')
  await upload(page, [pdf('doc.pdf', 3)])
  await expect(page.getByText('Arrastra las páginas para cambiar el orden', { exact: false })).toBeVisible()
  const thumbs = page.locator('.thumbs.sortable > .thumb')
  await expect(thumbs).toHaveCount(3)
  await drag(page, page.getByRole('button', { name: 'Arrastra para mover: Pág. 3' }), thumbs.first())
  await expect(thumbs.first()).toContainText('Pág. 3')
  await page.getByRole('button', { name: 'Duplicar Pág. 3' }).click()
  await page.getByRole('button', { name: 'Agregar una página en blanco después de Pág. 1' }).click()
  await expect(thumbs).toHaveCount(5)
  await expect(thumbs.nth(3)).toContainText('En blanco')
  await page.screenshot({ path: `test-results/organizar-reordenar-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Aplicar nuevo orden' }).click()
  expect(await pagesOf((await save(page)).bytes)).toBe(5)
})

test('numerar: posición, texto propio, número inicial y portada sin número @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/numerar')
  await upload(page, [pdf('tesis.pdf', 3)])
  await expect(page.locator('.file-item').getByText('3 páginas')).toBeVisible()
  await page.getByRole('radio', { name: 'Arriba a la derecha' }).click()
  await expect(page.getByRole('radio', { name: 'Arriba a la derecha' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'Página 1 de 10' }).click()
  await expect(page.getByRole('textbox', { name: 'Texto' })).toHaveValue('Página {n} de {total}')
  await page.getByRole('spinbutton', { name: 'Sin número en las primeras' }).fill('1')
  await page.getByRole('group', { name: 'Tamaño' }).getByRole('button', { name: 'Grande' }).click()
  await page.screenshot({ path: `test-results/organizar-numerar-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Numerar páginas' }).click()
  const out = await save(page)
  expect(out.name).toMatch(/tesis.*\.pdf$/)
  expect(await pagesOf(out.bytes)).toBe(3)
  // Solo las páginas 2 y 3 reciben el número (un contenido más); la portada queda igual.
  const doc = await PDFDocument.load(out.bytes)
  const streams = doc.getPages().map((p) => {
    const c = p.node.Contents()
    return c && 'size' in c ? c.size() : 1
  })
  expect(streams[0]).toBe(1)
  expect(streams[1]).toBeGreaterThan(1)
  expect(streams[2]).toBeGreaterThan(1)
})
