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

test('con la publicidad apagada no se descarga nada de AdSense ni se reserva espacio (W-90)', async ({ page }) => {
  const ads: string[] = []
  page.on('request', (r) => {
    if (/googlesyndication|doubleclick|adtrafficquality/.test(r.url())) ads.push(r.url())
  })
  for (const path of ['/unir-pdf', '/herramientas', '/app/', '/app/#/convertir']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.ad-slot, ins.adsbygoogle'), path).toHaveCount(0)
  }
  expect(ads).toEqual([])
})
