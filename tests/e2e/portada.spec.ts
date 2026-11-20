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

test('ads.txt y app-ads.txt autorizan al editor de Google (AdSense y AdMob)', async ({ request }) => {
  for (const file of ['/ads.txt', '/app-ads.txt']) {
    const res = await request.get(file)
    expect(res.status(), file).toBe(200)
    expect(await res.text(), file).toContain('google.com, pub-1109506701099935, DIRECT, f08c47fec0942fa0')
  }
})

test('assetlinks.json autoriza a la app de Play a abrir los enlaces (W-18)', async ({ request }) => {
  const res = await request.get('/.well-known/assetlinks.json', { maxRedirects: 0 })
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('application/json')
  const [link] = await res.json()
  expect(link.relation).toEqual(['delegate_permission/common.handle_all_urls'])
  expect(link.target.package_name).toBe('com.docsmart')
  // Certificado de la clave de firma de apps de Play (no el de subida ni el de depuración).
  expect(link.target.sha256_cert_fingerprints).toEqual(['0D:90:B5:7C:BF:D5:B4:87:BB:2B:04:21:2B:25:71:90:AC:40:7D:0C:1C:DA:AB:A5:03:A4:D3:70:AC:4A:E8:9C'])
})

test('la portada cuenta lo nuevo y enlaza a las guías y herramientas de su idioma (W-103)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Lo nuevo en DocuSmart' })).toBeVisible()
  await expect(page.locator('.wt-news-grid > li')).toHaveCount(4)
  await expect(page.locator('a[data-news="guides"]')).toHaveAttribute('href', '/guias')
  await page.goto('/en/')
  await expect(page.locator('a[data-news="guides"]')).toHaveAttribute('href', '/en/guides')
  await expect(page.locator('a[data-track="news_cloud"]')).toHaveAttribute('href', '/en/tools')
  await expect(page.locator('.wt-news-title')).not.toHaveText('Lo nuevo en DocuSmart')
})
