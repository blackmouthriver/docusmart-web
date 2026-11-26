// Publicidad (W-90): solo con consentimiento, en los 3 lugares acordados y nunca en la portada,
// la política de privacidad ni el Visor. El script de AdSense se simula: no sale nada a la red.
import type { Page } from '@playwright/test'
import { expect, test } from './helpers'

test.use({ presetConsent: 'none' })

async function fakeAdSense(page: Page) {
  const requested: string[] = []
  await page.route(/googlesyndication|doubleclick|adtrafficquality|fundingchoices/, (route) => {
    requested.push(route.request().url())
    return route.fulfill({ contentType: 'text/javascript', body: 'window.__fakeAds = (window.__fakeAds || 0) + 1' })
  })
  return requested
}
const decide = (page: Page, value: 'granted' | 'denied') =>
  page.addInitScript((v) => {
    localStorage.setItem('ds-consent', v)
    localStorage.setItem('ds-consent-scope', 'ads')
  }, value)

test('sin decidir aparece el aviso de privacidad y cookies, y no se carga nada de Google', async ({ page }) => {
  const requested = await fakeAdSense(page)
  await page.goto('/unir-pdf')
  await expect(page.getByRole('dialog', { name: 'Privacidad y cookies' })).toBeVisible()
  await expect(page.locator('.ad-slot')).toHaveCount(0)
  expect(requested).toEqual([])
})

test('una decisión anterior a los anuncios se vuelve a preguntar', async ({ page }) => {
  await fakeAdSense(page)
  await page.addInitScript(() => localStorage.setItem('ds-consent', 'granted'))
  await page.goto('/unir-pdf')
  await expect(page.getByRole('dialog', { name: 'Privacidad y cookies' })).toBeVisible()
})

test('al aceptar, el anuncio va antes de las preguntas y se pide al acercarse', async ({ page }) => {
  const requested = await fakeAdSense(page)
  await page.goto('/unir-pdf')
  await page.getByRole('dialog', { name: 'Privacidad y cookies' }).getByRole('button', { name: 'Aceptar' }).click()
  const slot = page.locator('.ad-slot[data-ad="tool"]')
  await expect(slot).toHaveCount(1)
  expect(await slot.evaluate((el) => !!el.nextElementSibling?.querySelector('.tp-faq'))).toBe(true)
  await expect(slot.locator('ins.adsbygoogle')).toHaveAttribute('data-ad-slot', '2392088871')
  await slot.scrollIntoViewIfNeeded()
  // El script de AdSense o, en WebKit (donde la simulación no siempre lo intercepta), el pedido del anuncio.
  await expect.poll(() => requested.some((u) => u.includes('adsbygoogle.js') || u.includes('/pagead/ads?'))).toBe(true)
})

test('en /herramientas va después de la tercera categoría', async ({ page }) => {
  await fakeAdSense(page)
  await decide(page, 'granted')
  await page.goto('/herramientas')
  const slot = page.locator('.ad-slot[data-ad="hub"]')
  await expect(slot).toHaveCount(1)
  expect(await slot.evaluate((el) => el.previousElementSibling?.matches('[data-cat]:nth-of-type(3), [data-cat]'))).toBe(true)
  await expect(slot.locator('ins')).toHaveAttribute('data-ad-slot', '5485156078')
})

test('en la app va al pie de la pantalla y nunca en el Visor', async ({ page }) => {
  const requested = await fakeAdSense(page)
  await decide(page, 'granted')
  await page.goto('/app/#/convertir')
  const slot = page.locator('.ad-slot[data-ad="app"]')
  await expect(slot.locator('ins')).toHaveAttribute('data-ad-slot', '3739783383')
  await slot.scrollIntoViewIfNeeded()
  await expect.poll(() => requested.length).toBeGreaterThan(0)
  await page.goto('/app/#/ver')
  await expect(page.locator('.ad-slot')).toHaveCount(0)
})

test('nunca hay anuncios en la portada ni en la política de privacidad', async ({ page }) => {
  await fakeAdSense(page)
  await decide(page, 'granted')
  for (const path of ['/', '/en/', '/privacidad']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.ad-slot'), path).toHaveCount(0)
  }
})

test('si se rechaza, no hay espacios ni se carga nada', async ({ page }) => {
  const requested = await fakeAdSense(page)
  await decide(page, 'denied')
  for (const path of ['/unir-pdf', '/herramientas', '/app/#/convertir']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.ad-slot'), path).toHaveCount(0)
  }
  expect(requested).toEqual([])
})
