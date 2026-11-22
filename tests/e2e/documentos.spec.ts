// Documentos tras la auditoría W-146.4: hoja de vida con guardado automático, Carta/A4, secciones
// propias y orden; cuenta de cobro con descuento, logo, historial y convertir una cotización.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, PNG, test } from './helpers'

async function save(page: Page): Promise<Uint8Array> {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 30_000 })
  return new Uint8Array(await readFile((await (await wait).path())!))
}

async function pdfInfo(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const page = await doc.getPage(1)
  const vp = page.getViewport({ scale: 1 })
  const text = (await page.getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  return { width: Math.round(vp.width), height: Math.round(vp.height), text }
}

test('hoja de vida: se guarda sola, en Carta, con una sección propia y el orden elegido @movil', async ({ page }) => {
  await page.goto('/app/#/documentos/cv')
  await page.getByLabel('Nombre completo').fill('Ana Prueba')
  await page.getByRole('group', { name: 'Tamaño de la hoja' }).getByRole('button', { name: 'Carta' }).click()
  const custom = page.getByRole('region', { name: 'Otras secciones' })
  await custom.getByRole('button', { name: 'Agregar sección' }).click()
  await custom.getByLabel('Título de la sección').fill('Proyectos')
  await custom.getByLabel('Contenido').fill('App de inventario')
  await page.getByRole('region', { name: 'Habilidades' }).locator('textarea').fill('SQL, Python')
  // "Otras secciones" (7.ª) sube tres lugares hasta quedar antes de Habilidades (4.ª).
  const order = page.getByRole('region', { name: 'Orden de las secciones' })
  for (let i = 0; i < 3; i++) await order.getByRole('button', { name: 'Subir Otras secciones' }).click()
  await expect(order.locator('li').nth(3)).toContainText('Otras secciones')

  // Se guarda sola: al recargar sigue ahí.
  await page.waitForTimeout(800)
  await page.reload()
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana Prueba')
  await expect(page.getByRole('region', { name: 'Otras secciones' }).getByLabel('Título de la sección')).toHaveValue('Proyectos')

  await page.getByRole('button', { name: 'Crear PDF' }).click()
  const info = await pdfInfo(await save(page))
  expect([info.width, info.height]).toEqual([612, 792])
  expect(info.text.indexOf('PROYECTOS')).toBeGreaterThan(-1)
  expect(info.text.indexOf('PROYECTOS')).toBeLessThan(info.text.indexOf('HABILIDADES'))

  // Empezar de nuevo borra todo (también lo guardado).
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
  await expect(page.getByLabel('Nombre completo')).toHaveValue('')
  await page.reload()
  await expect(page.getByLabel('Nombre completo')).toHaveValue('')
})

test('cuenta de cobro: descuento, logo, historial y convertir una cotización', async ({ page }) => {
  await page.goto('/app/#/documentos/cobro')
  await page.getByRole('group', { name: 'Tipo de documento' }).getByRole('button', { name: 'Cotización' }).click()
  await page.getByRole('group', { name: 'Cliente' }).getByLabel('Nombre o razón social').fill('Empresa S.A.S.')
  await page.getByLabel('Descripción').fill('Diseño de logo')
  await page.getByLabel('Valor unitario').fill('1.000.000')
  await page.getByLabel('Descuento (%)').fill('10')
  await expect(page.locator('.bill-totals')).toContainText('Descuento')
  await page.locator('input[type=file][accept*="image/png"]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByRole('img', { name: 'Logo' })).toBeVisible()
  await page.getByLabel(/^Recordar en este navegador mis datos/).check()
  await page.getByRole('button', { name: 'Crear PDF' }).click()
  const quote = await pdfInfo(await save(page))
  expect(quote.text).toContain('Descuento (10 %)')

  // El historial muestra la cotización y la convierte en cuenta de cobro, con el mismo cliente y concepto.
  const history = page.getByRole('region', { name: 'Documentos emitidos' })
  await expect(history).toContainText('Empresa S.A.S.')
  await history.getByRole('button', { name: 'Pasar a cuenta de cobro' }).click()
  await expect(page.getByLabel('Número', { exact: true })).toHaveValue(/^CC-/)
  await expect(page.getByLabel('Descripción')).toHaveValue('Diseño de logo')
  await expect(page.getByLabel('Fecha límite de pago')).toBeVisible()
  await page.getByLabel('Fecha límite de pago').fill('2030-01-15')
  await page.getByRole('button', { name: 'Crear PDF' }).click()
  const bill = await pdfInfo(await save(page))
  expect(bill.text).toContain('Empresa S.A.S.')
  expect(bill.text).toMatch(/Fecha límite de pago: 15 de enero de 2030/)

  // Al volver, el cliente y el concepto se ofrecen guardados; borrar el historial los quita.
  await page.reload()
  await expect(page.getByLabel('Clientes guardados')).toBeVisible()
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Borrar historial' }).click()
  await expect(page.getByRole('region', { name: 'Documentos emitidos' })).toHaveCount(0)
})
