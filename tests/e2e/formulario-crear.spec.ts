// W-147.2: crear campos de formulario en un PDF sin campos, llenarlo enseguida y descargarlo.
import { readFile } from 'node:fs/promises'
import type { Locator, Page } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'
import { expect, makePdf, test } from './helpers'

/** Arrastra sobre la página de (x1, y1) a (x2, y2), en fracciones del recuadro. */
async function drawOn(page: Page, stage: Locator, x1: number, y1: number, x2: number, y2: number) {
  await stage.scrollIntoViewIfNeeded()
  const b = (await stage.boundingBox())!
  await page.mouse.move(b.x + b.width * x1, b.y + b.height * y1)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * x2, b.y + b.height * y2, { steps: 6 })
  await page.mouse.up()
}

test('crear campos en un PDF sin campos y llenarlo enseguida @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/formulario')
  await page.locator('input[type=file]').first().setInputFiles({ name: 'solicitud.pdf', mimeType: 'application/pdf', buffer: makePdf(1) })
  await expect(page.getByText('Este PDF no tiene campos rellenables. Puedes crearlos tú:')).toBeVisible()
  await page.getByRole('button', { name: 'Crear campos' }).last().click()
  const stage = page.getByRole('application', { name: 'Página 1: dibuja aquí los campos' })
  await expect(stage.locator('img')).toBeVisible()

  // Un campo de texto dibujado, una casilla con un toque y opciones dibujadas.
  await drawOn(page, stage, 0.1, 0.1, 0.6, 0.15)
  const kinds = page.getByRole('group', { name: 'Tipo de campo' })
  await kinds.getByRole('button', { name: 'Casilla' }).click()
  await stage.scrollIntoViewIfNeeded()
  const b = (await stage.boundingBox())!
  await page.mouse.click(b.x + b.width * 0.1, b.y + b.height * 0.3)
  await kinds.getByRole('button', { name: 'Opciones' }).click()
  await drawOn(page, stage, 0.1, 0.45, 0.5, 0.6)
  await expect(page.getByRole('heading', { name: 'Campos nuevos (3)' })).toBeVisible()

  // Nombres y opciones.
  const names = page.getByLabel('Nombre del campo')
  await names.nth(0).fill('Nombre completo')
  await page.getByLabel('Obligatorio').first().check()
  await names.nth(1).fill('Acepto los términos')
  await page.getByRole('textbox', { name: /^Opciones/ }).fill('Mañana, Tarde, Noche')
  await names.nth(2).fill('Jornada')
  await expect(stage.getByRole('button', { name: /Campo «Nombre completo»/ })).toBeVisible()

  await page.getByRole('button', { name: 'Crear PDF rellenable' }).click()
  await expect(page.getByText('Listo: el PDF ya tiene 3 campos', { exact: false })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Llenarlo ahora' }).click()

  // Ya en "Llenar campos", con los campos creados.
  await expect(page.locator('.file-item')).toContainText('3 campos')
  await page.getByLabel(/^Nombre completo/).fill('Ana Pérez')
  await page.getByLabel('Acepto los términos').check()
  await page.getByLabel('Tarde').check()
  await page.getByRole('button', { name: 'Llenar formulario' }).click()
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click()
  const d = await wait
  const form = (await PDFDocument.load(await readFile((await d.path())!))).getForm()
  expect(form.getTextField('Nombre completo').getText()).toBe('Ana Pérez')
  expect(form.getCheckBox('Acepto los términos').isChecked()).toBe(true)
  expect(form.getRadioGroup('Jornada').getSelected()).toBe('Tarde')
})
