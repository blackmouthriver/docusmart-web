// Portada y páginas públicas (W-11).
import { expect, test } from './helpers'

test('la portada carga con su título, la imagen para compartir y sin errores @movil', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Tus documentos, en un solo lugar.')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://docusmart.online/img/og/es.jpg')
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Ver las \d+ herramientas/ })).toBeVisible()
})

test('la portada en inglés está traducida', async ({ page }) => {
  await page.goto('/en/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('All your documents, in one place.')
  await expect(page.getByText('Install DocuSmart Desktop')).toBeVisible()
})

test('en el celular el menú se abre y se cierra @movil', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo en el celular')
  await page.goto('/')
  const toggle = page.locator('#menu-toggle')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('la tarjeta de DocuSmart Desktop solo aparece en pantallas anchas @movil', async ({ page, isMobile }) => {
  await page.goto('/')
  const card = page.locator('.wt-desktop')
  if (isMobile) await expect(card).toBeHidden()
  else await expect(card).toBeVisible()
})

test('la política de privacidad carga', async ({ page }) => {
  await page.goto('/privacidad')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Política de Privacidad')
})
