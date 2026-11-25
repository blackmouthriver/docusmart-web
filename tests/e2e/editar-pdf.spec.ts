// Editar PDF: reemplazar el texto que ya tiene el PDF (W-140). El original se borra del
// documento (no solo se tapa) y el nuevo queda en su lugar.
import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, makePdf, test } from './helpers'

test('reemplazar texto: el original se borra del PDF y el nuevo queda en su lugar', async ({ page }) => {
  await page.goto('/editar-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'hoja.pdf', mimeType: 'application/pdf', buffer: makePdf(1) })
  await tool.getByRole('button', { name: 'Reemplazar', exact: true }).click()
  await tool.getByRole('button', { name: 'Reemplazar: Pagina 1' }).click()
  // Se crean dos capas: el texto original borrado y el texto nuevo (editable).
  await expect(tool.getByText('2 elementos')).toBeVisible()
  const box = tool.locator('textarea')
  await expect(box).toHaveValue('Pagina 1')
  await box.fill('Hoja corregida')
  await tool.getByRole('button', { name: 'Aplicar cambios' }).click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click({ timeout: 30_000 })
  const bytes = new Uint8Array(await readFile((await (await wait).path())!))
  const doc = await getDocument({ data: bytes }).promise
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  expect(text).toContain('Hoja corregida')
  expect(text).not.toContain('Pagina 1')
})

test('la × de quitar no tapa el final de un texto nuevo @movil', async ({ page }) => {
  await page.goto('/editar-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'hoja.pdf', mimeType: 'application/pdf', buffer: makePdf(1) })
  const pageImg = tool.getByRole('img', { name: 'Página 1' })
  await pageImg.scrollIntoViewIfNeeded()
  const b = (await pageImg.boundingBox())!
  await page.mouse.click(b.x + b.width * 0.2, b.y + b.height * 0.3)
  await tool.locator('textarea').fill('Aprobado por la gerencia general')
  const item = tool.locator('.edit-item.edit-text')
  await expect(item).toHaveText('Aprobado por la gerencia general')
  // La × (visible mientras está elegido) no se monta sobre ninguna letra.
  const overlap = await item.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el.firstChild!)
    const t = range.getBoundingClientRect()
    const x = el.querySelector('.sign-del')!.getBoundingClientRect()
    const w = Math.max(0, Math.min(t.right, x.right) - Math.max(t.left, x.left))
    const h = Math.max(0, Math.min(t.bottom, x.bottom) - Math.max(t.top, x.top))
    return w * h
  })
  expect(overlap).toBe(0)
})
