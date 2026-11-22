// Cuenta de cobro, cotización y recibo (W-130): formulario, totales, firma, PDF y numeración.
import { readFile } from 'node:fs/promises'
import { expect, test } from './helpers'

test('cuenta de cobro con firma, en PDF, y la numeración y los datos se recuerdan', async ({ page }) => {
  await page.goto('/cuenta-de-cobro')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuenta de cobro, cotización y recibo')
  const tool = page.locator('#tool')
  await expect(tool.getByLabel('Número', { exact: true })).toHaveValue('CC-0001')
  await expect(tool.getByRole('button', { name: 'Crear PDF' })).toBeDisabled()

  // El país (sin tildes ni mayúsculas) llena la moneda, el impuesto y los tipos de documento.
  await tool.getByLabel('País').fill('colombia')
  await expect(tool.getByLabel('Moneda')).toHaveValue('COP')
  await expect(tool.getByLabel('Impuesto', { exact: true })).toHaveValue('IVA')
  const issuer = tool.getByRole('group', { name: 'Tus datos' })
  await expect(issuer.getByLabel('Tipo de documento')).toHaveValue('C.C.')
  await expect(tool.getByRole('group', { name: 'Cliente' }).getByLabel('Tipo de documento')).toHaveValue('NIT')
  await issuer.getByLabel('Nombre o razón social').fill('Ana Pérez')
  await issuer.getByLabel('Número de documento').fill('1.020.304')
  const client = tool.getByRole('group', { name: 'Cliente' })
  await client.getByLabel('Nombre o razón social').fill('Empresa S.A.S.')
  await tool.getByLabel('Descripción').fill('Diseño de logo')
  await tool.getByLabel('Valor unitario').fill('1.200.000')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/1\.200\.000/)
  await expect(tool.getByText('Un millón doscientos mil pesos')).toBeVisible()

  // La tarifa no se pone sola (muchos independientes no cobran IVA): se ofrece con un botón.
  await expect(tool.getByLabel('Impuesto (%)')).toHaveValue('')
  await tool.getByRole('button', { name: 'Usar la tarifa general de IVA: 19 %' }).click()
  await expect(tool.getByLabel('Impuesto (%)')).toHaveValue('19')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/1\.428\.000/)

  // Recordar viene desmarcado: se marca a mano. La cuenta para el pago nunca se guarda.
  const remember = tool.getByLabel(/^Recordar en este navegador mis datos/)
  await expect(remember).not.toBeChecked()
  await remember.check()
  await tool.getByLabel('Datos para el pago').fill('Bancolombia ahorros 123-456789-00')

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
  await expect(tool.getByLabel('Número', { exact: true })).toHaveValue('CC-0002')
  await page.reload()
  await expect(tool.getByLabel('Número', { exact: true })).toHaveValue('CC-0002')
  await expect(tool.getByRole('group', { name: 'Tus datos' }).getByLabel('Nombre o razón social')).toHaveValue('Ana Pérez')
  await expect(tool.getByRole('group', { name: 'Cliente' }).getByLabel('Nombre o razón social')).toHaveValue('')
  // El país también se recuerda; la cuenta para el pago, no.
  await expect(tool.getByLabel('País')).toHaveValue('Colombia')
  await expect(tool.getByLabel('Datos para el pago')).toHaveValue('')
  await expect(tool.getByLabel(/^Recordar en este navegador mis datos/)).toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('ds-billing-issuer'))).not.toContain('Bancolombia')
})

test('Perú: IGV, RUC y DNI, soles y la retención con su nombre', async ({ page }) => {
  await page.goto('/cuenta-de-cobro')
  const tool = page.locator('#tool')
  await tool.getByLabel('País').fill('peru')
  // Al salir del campo se completa con el nombre del país.
  await tool.getByLabel('País').blur()
  await expect(tool.getByLabel('País')).toHaveValue('Perú')
  await expect(tool.getByLabel('Moneda')).toHaveValue('PEN')
  await expect(tool.getByLabel('Impuesto', { exact: true })).toHaveValue('IGV')
  const issuer = tool.getByRole('group', { name: 'Tus datos' })
  await expect(issuer.getByLabel('Tipo de documento')).toHaveValue('DNI')
  await expect(issuer.getByLabel('Tipo de documento').locator('option')).toHaveText(['RUC', 'DNI', 'Carné de extranjería (C.E.)', 'Otro'])
  await expect(tool.getByRole('group', { name: 'Cliente' }).getByLabel('Tipo de documento')).toHaveValue('RUC')
  await tool.getByLabel('Valor unitario').fill('1000')
  await tool.getByLabel('Retención (%)').fill('8')
  await expect(tool.locator('.bill-totals')).toContainText('Retención de 4.ª categoría')
  await expect(tool.locator('.bill-totals .bill-grand').last()).toHaveText(/920/)
})

test('cotización: su propia numeración y fecha de vigencia; recibo con "Recibido de"', async ({ page }) => {
  await page.goto('/cuenta-de-cobro')
  const tool = page.locator('#tool')
  await expect(tool.getByLabel('Válida hasta')).toHaveCount(0)
  await tool.getByRole('button', { name: 'Cotización' }).click()
  await expect(tool.getByLabel('Número', { exact: true })).toHaveValue('COT-0001')
  await expect(tool.getByLabel('Válida hasta')).toBeVisible()
  await tool.getByRole('button', { name: 'Recibo' }).click()
  await expect(tool.getByLabel('Número', { exact: true })).toHaveValue('REC-0001')
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
