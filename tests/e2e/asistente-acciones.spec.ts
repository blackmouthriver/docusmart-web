// Tarjeta «Hacer / Cambiar» del asistente (W-151.5): el pedido abre la herramienta con las opciones puestas,
// sin pasar nada por la URL.
import type { Page } from '@playwright/test'
import { expect, makePdf, test, upload } from './helpers'

async function ask(page: Page, text: string) {
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill(text)
  await input.press('Enter')
}

test('«comprime este pdf a menos de 2 megas»: tarjeta, «Hacer» y Comprimir PDF con 2 MB elegido', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'comprime este pdf a menos de 2 megas')
  const card = page.locator('.assistant-plan')
  await expect(card).toContainText('Puedo dejarlo listo:')
  await expect(card).toContainText('Comprimir PDF')
  await expect(card).toContainText('Tamaño máximo: 2 MB')
  await page.getByRole('button', { name: 'Hacer' }).click()
  await expect(page).toHaveURL(/#\/pdf\/comprimir$/)
  // Nada de las opciones en la URL.
  expect(page.url()).not.toMatch(/2097152|targetSize/)
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(2) }])
  await expect(page.getByRole('combobox', { name: /Tamaño máximo/ })).toHaveValue('2')
})

test('«Cambiar» abre la herramienta sin las opciones', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'redimensiona la imagen a 1080 px de ancho')
  await expect(page.locator('.assistant-plan')).toContainText('Ancho: 1080 px')
  await page.getByRole('button', { name: 'Cambiar' }).click()
  await expect(page).toHaveURL(/#\/imagen\/redimensionar$/)
  await expect(page.locator('#tool input[type=number]')).toHaveCount(0)
})

test('desde una página de herramienta: dividir las páginas 2 a 3 con el PDF ya abierto', async ({ page }) => {
  await page.goto('/dividir-pdf')
  await upload(page, [{ name: 'libro.pdf', mimeType: 'application/pdf', buffer: makePdf(4) }])
  const range = page.getByLabel(/Páginas \(ej\./)
  await expect(range).toBeVisible()
  await ask(page, 'separa las paginas 2 a 3')
  await page.getByRole('button', { name: 'Hacer' }).click()
  // La herramienta ya estaba abierta: las opciones le llegan sin recargar y el PDF sigue elegido.
  await expect(range).toHaveValue('2-3')
  await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-pressed', 'true')
})

test('una pregunta normal sigue dando la respuesta de siempre (sin tarjeta)', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'es gratis?')
  await expect(page.locator('.assistant-bubble.bot').last()).toBeVisible()
  await expect(page.locator('.assistant-plan')).toHaveCount(0)
})
