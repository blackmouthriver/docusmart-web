// Guías (W-19): índice, una guía y sus enlaces a las herramientas.
import { expect, test } from './helpers'

test('el índice de guías muestra las 6 guías @movil', async ({ page }) => {
  await page.goto('/guias')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guías paso a paso')
  await expect(page.locator('.gd-cards > li')).toHaveCount(6)
})

test('una guía lleva a su herramienta y a otras guías', async ({ page }) => {
  await page.goto('/guias/unir-pdf-en-el-celular')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo unir PDF en el celular sin subir tus archivos')
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('"@type": "HowTo"')
  await expect(page.locator('.tp-related a[href^="/guias/"]')).toHaveCount(5)
  const toTool = page.locator('.gd-article').getByRole('link', { name: 'Unir PDF', exact: true }).first()
  await expect(toTool).toHaveAttribute('href', '/unir-pdf')
  await page.goto('/unir-pdf')
  await expect(page.locator('a[href="/guias/unir-pdf-en-el-celular"]')).toHaveCount(1)
})

test('las páginas enlazan a las guías de su idioma, o a ninguna si no hay', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer a[href="/guias"]')).toHaveCount(1)
  await page.goto('/en/')
  await expect(page.locator('footer a[href="/en/guides"]')).toHaveCount(1)
  await page.goto('/en/merge-pdf')
  await expect(page.locator('a[href="/en/guides/merge-pdf-on-your-phone"]')).toHaveCount(1)
  await page.goto('/fr/')
  await expect(page.locator('a[href*="/guias"], a[href*="/guides"]')).toHaveCount(0)
})

test('una guía en inglés enlaza a las herramientas en inglés y ofrece las otras versiones', async ({ page }) => {
  await page.goto('/en/guides/merge-pdf-on-your-phone')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.gd-article a[href="/en/merge-pdf"]').first()).toBeVisible()
  await expect(page.locator('.gd-article a[href="/unir-pdf"]')).toHaveCount(0)
  await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', 'https://docusmart.online/pt/guias/juntar-pdf-no-celular')
  await page.goto('/pt/guias')
  await expect(page.locator('.gd-cards > li')).toHaveCount(6)
})
