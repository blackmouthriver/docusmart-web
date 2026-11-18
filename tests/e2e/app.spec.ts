// App web (/app/): navegación, ajustes, QR, asistente y ayuda de DocuSmart Desktop (W-11).
import { expect, test } from './helpers'

test('la app carga y la barra lateral lleva a Todas las herramientas, con carrusel y buscador', async ({ page }) => {
  await page.goto('/app/')
  await expect(page.locator('.shell')).toBeVisible()
  await page.getByRole('link', { name: 'Todas las herramientas' }).first().click()
  await expect(page).toHaveURL(/#\/herramientas/)
  await expect(page.locator('.tools-marquee .tools-track')).toHaveCount(2)
  await page.getByPlaceholder(/Por ejemplo/).fill('marca de agua')
  await expect(page.locator('.tools-grid .quick')).toHaveCount(1)
})

test('Ajustes se abre, cambia el tema y se cierra con Esc', async ({ page }) => {
  await page.goto('/app/')
  await page.locator('.side-settings:not(.side-install)').click()
  const panel = page.getByRole('dialog', { name: 'Ajustes' })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Oscuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

test('crear un código QR', async ({ page }) => {
  await page.goto('/app/#/qr/crear')
  await page.getByPlaceholder('https://docusmart.online').fill('https://docusmart.online/herramientas')
  await page.getByRole('button', { name: 'Generar QR' }).click()
  await expect(page.locator('.screen img[src^="blob:"], .screen img[src^="data:"], .screen canvas').first()).toBeVisible()
})

test('el asistente responde una pregunta', async ({ page }) => {
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill('como uno dos pdf')
  await input.press('Enter')
  await expect(page.locator('.assistant-bubble.bot').last()).toContainText(/PDF/, { timeout: 15_000 })
  await expect(page.getByRole('link', { name: /Unir PDF/ }).first()).toBeVisible()
})

test('la ayuda de DocuSmart Desktop explica cómo instalarla', async ({ page }) => {
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Instalar DocuSmart Desktop' }).click()
  const panel = page.getByRole('dialog', { name: 'DocuSmart Desktop' })
  await expect(panel.getByRole('heading', { name: 'Cómo instalarla' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
