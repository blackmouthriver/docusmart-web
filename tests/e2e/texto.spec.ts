// Herramientas de texto (W-113): contador de palabras, comparar textos y generador de contraseñas.
import { expect, test } from './helpers'

test('contador de palabras: cuenta mientras se escribe', async ({ page }) => {
  await page.goto('/contador-de-palabras')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contador de palabras y caracteres')
  const tool = page.locator('#tool')
  await tool.getByLabel('Escribe o pega tu texto').fill('El gato duerme. El gato come.\n\nOtro párrafo aquí.')
  const stat = (label: string) => tool.locator('.txt-stats > div', { has: page.getByText(label, { exact: true }) }).locator('dd')
  await expect(stat('Palabras')).toHaveText('9')
  await expect(stat('Frases')).toHaveText('3')
  await expect(stat('Párrafos')).toHaveText('2')
  // 15 + 1 + 13 + 2 saltos + 18 = 49
  await expect(stat('Caracteres')).toHaveText('49')
  await expect(tool.locator('.txt-top li').first()).toContainText('gato')
  await expect(tool.locator('.txt-top li').first()).toContainText('2 veces')
  await tool.getByRole('button', { name: 'Borrar' }).click()
  await expect(stat('Palabras')).toHaveText('0')
})

test('comparar textos: marca lo borrado y lo agregado', async ({ page }) => {
  await page.goto('/comparar-textos')
  const tool = page.locator('#tool')
  await tool.getByLabel('Texto original').fill('El gato negro duerme.')
  await tool.getByLabel('Texto modificado').fill('El gato blanco duerme mucho.')
  await tool.getByRole('button', { name: 'Comparar textos' }).click()
  await expect(tool.locator('.txt-diff del')).toHaveText('negro')
  await expect(tool.locator('.txt-diff ins').first()).toHaveText('blanco')
  await expect(tool.getByText('2 palabras agregadas y 1 borradas', { exact: false })).toBeVisible()
  // Iguales si se ignoran mayúsculas.
  await tool.getByLabel('Texto modificado').fill('EL GATO NEGRO DUERME.')
  await tool.getByLabel('Ignorar mayúsculas').check()
  await tool.getByRole('button', { name: 'Comparar textos' }).click()
  await expect(tool.getByText('Los dos textos son iguales.')).toBeVisible()
})

test('generador de contraseñas: largo, tipos y fuerza', async ({ page }) => {
  await page.goto('/generador-de-contrasenas')
  const tool = page.locator('#tool')
  const out = tool.getByLabel('Generador de contraseñas')
  await expect(out).toHaveText(/^.{16}$/)
  const first = await out.textContent()
  await tool.getByRole('button', { name: 'Generar otra' }).click()
  await expect(out).not.toHaveText(first!)
  await expect(tool.getByText(/^Fuerza: muy fuerte/)).toBeVisible()
  // Solo números y 8 caracteres: más débil.
  await tool.getByLabel('Minúsculas (a-z)').uncheck()
  await tool.getByLabel('Mayúsculas (A-Z)').uncheck()
  await tool.getByLabel('Símbolos (!@#…)').uncheck()
  await tool.getByRole('slider').fill('8')
  await expect(out).toHaveText(/^\d{8}$/)
  await expect(tool.getByText(/^Fuerza: débil/)).toBeVisible()
  await tool.getByLabel('Números (0-9)').uncheck()
  await expect(tool.getByText('Elige al menos un tipo de carácter.')).toBeVisible()
})
