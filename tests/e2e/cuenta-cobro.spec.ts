// Cuenta de cobro, cotización y recibo (W-130): formulario, totales, firma, PDF y numeración.
import { readFile } from 'node:fs/promises'
import { expect, test } from './helpers'

test('cuenta de cobro con firma, en PDF, y la numeración y los datos se recuerdan', async ({ page }) => {
  await page.goto('/cuenta-de-cobro')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuenta de cobro, cotización y recibo')
  const tool = page.locator('#tool')
  await expect(tool.getByLabel('Número')).toHaveValue('CC-0001')
  await expect(tool.getByRole('button', { name: 'Crear PDF' })).toBeDisabled()

  const issuer = tool.getByRole('group', { name: 'Tus datos' })
  await issuer.getByLabel('Nombre o razón social').fill('Ana Pérez')
  await issuer.getByLabel('Documento o NIT').fill('C.C. 1.020.304')
  const client = tool.getByRole('group', { name: 'Cliente' })
  await client.getByLabel('Nombre o razón social').fill('Empresa S.A.S.')
  await tool.getByLabel('Descripción').fill('Diseño de logo')
  await tool.getByLabel('Valor unitario').fill('1.200.000')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/1\.200\.000/)
  await expect(tool.getByText('Un millón doscientos mil pesos')).toBeVisible()

  // Con IVA del 19 % el total sube.
  await tool.getByLabel('Impuesto (%)').fill('19')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/1\.428\.000/)

  // Firma escrita.
  await tool.getByRole('button', { name: 'Agregar firma' }).click()
  await tool.getByRole('button', { name: 'Escribir' }).click()
  await tool.getByLabel('Tu nombre').fill('Ana Pérez')
  await tool.getByRole('button', { name: 'Usar esta firma' }).click()
  await expect(tool.getByRole('img', { name: 'Firma' })).toBeVisible()

  await tool.getByRole('button', { name: 'Crear PDF' }).click()
  await expect(tool.getByRole('heading', { name: 'Así quedó tu documento' })).toBeVisible({ timeout: 30_000 })
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  expect(file.suggestedFilename()).toBe('cuenta-de-cobro-CC-0001.pdf')
  const pdf = await readFile((await file.path())!)
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  // Lleva la firma como imagen.
  expect(pdf.toString('latin1')).toMatch(/\/Subtype\s*\/Image/)

  // Documento nuevo: el número avanza; al volver, los datos de quien cobra siguen ahí.
  await tool.getByRole('button', { name: 'Nuevo documento' }).click()
  await expect(tool.getByLabel('Número')).toHaveValue('CC-0002')
  await page.reload()
  await expect(tool.getByLabel('Número')).toHaveValue('CC-0002')
  await expect(tool.getByRole('group', { name: 'Tus datos' }).getByLabel('Nombre o razón social')).toHaveValue('Ana Pérez')
  await expect(tool.getByRole('group', { name: 'Cliente' }).getByLabel('Nombre o razón social')).toHaveValue('')
})

test('cotización: su propia numeración y fecha de vigencia; recibo con "Recibido de"', async ({ page }) => {
  await page.goto('/cuenta-de-cobro')
  const tool = page.locator('#tool')
  await expect(tool.getByLabel('Válida hasta')).toHaveCount(0)
  await tool.getByRole('button', { name: 'Cotización' }).click()
  await expect(tool.getByLabel('Número')).toHaveValue('COT-0001')
  await expect(tool.getByLabel('Válida hasta')).toBeVisible()
  await tool.getByRole('button', { name: 'Recibo' }).click()
  await expect(tool.getByLabel('Número')).toHaveValue('REC-0001')
  await expect(tool.getByRole('group', { name: 'Recibido de' })).toBeVisible()
  // Varios conceptos y borrar uno.
  await tool.getByLabel('Descripción').fill('Hora de clase')
  await tool.getByLabel('Cantidad').fill('3')
  await tool.getByLabel('Valor unitario').fill('50.000')
  await tool.getByRole('button', { name: 'Agregar concepto' }).click()
  await tool.getByLabel('Descripción').nth(1).fill('Material')
  await tool.getByLabel('Valor unitario').nth(1).fill('20.000')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/170\.000/)
  await tool.getByRole('button', { name: 'Quitar concepto 2' }).click()
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/150\.000/)
})
