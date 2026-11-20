// Páginas de herramientas: que carguen y que las herramientas funcionen de verdad (W-11).
import { expect, makePdf, PNG, test, upload } from './helpers'

test('/herramientas lista todas, filtra al buscar y tiene el carrusel de categorías @movil', async ({ page }) => {
  await page.goto('/herramientas')
  await expect(page.locator('.th-marquee .th-track')).toHaveCount(2)
  const cards = page.locator('.th-grid a')
  const total = await cards.count()
  expect(total).toBeGreaterThanOrEqual(37)
  await page.locator('#th-q').fill('webp')
  await expect(page.locator('.th-grid a:visible')).toHaveCount(1)
})

test('unir dos PDF y descargar el resultado', async ({ page }) => {
  await page.goto('/unir-pdf')
  await upload(page, [
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/)
})

test('el resultado se puede renombrar antes de descargarlo @movil', async ({ page }) => {
  await page.goto('/unir-pdf')
  await upload(page, [
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  const name = page.getByRole('textbox', { name: 'Nombre del archivo' })
  await expect(name).toBeVisible()
  await name.fill('Contrato: final')
  // Al salir del campo, el nombre queda limpio y confirmado antes de descargar.
  await name.blur()
  await expect(name).toHaveValue('Contrato- final')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  expect((await download).suggestedFilename()).toBe('Contrato- final.pdf')
})

test('convertir PNG a JPG @movil', async ({ page }) => {
  await page.goto('/png-a-jpg')
  await upload(page, [{ name: 'logo.png', mimeType: 'image/png', buffer: PNG }])
  await page.getByRole('button', { name: 'Convertir', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.jpg$/)
})

test('proteger un PDF con contraseña (qpdf en WebAssembly, permitido por la CSP)', async ({ page }) => {
  await page.goto('/proteger-pdf')
  await upload(page, [{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  const passwords = page.locator('input[type=password]')
  await passwords.nth(0).fill('Prueba123')
  await passwords.nth(1).fill('Prueba123')
  await page.getByRole('button', { name: 'Proteger PDF' }).click()
  await expect(page.getByText('Así quedó tu PDF protegido')).toBeVisible({ timeout: 20_000 })
})

test('la página de una herramienta en otro idioma usa su imagen y sus textos', async ({ page }) => {
  await page.goto('/ja/image-to-webp')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://docusmart.online/img/og/ja.jpg')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('画像をWebPに')
})

test('las conversiones de imagen también aparecen en Imagen, sin duplicarse al buscar (W-119)', async ({ page }) => {
  await page.goto('/herramientas')
  await expect(page.locator('#cat-imagen a[href="/jpg-a-png"]')).toHaveCount(1)
  await expect(page.locator('#cat-convertir a[href="/jpg-a-png"]')).toHaveCount(1)
  await page.locator('#th-q').fill('png')
  await expect(page.locator('.th-grid a[href="/jpg-a-png"]:visible')).toHaveCount(1)

  await page.goto('/app/#/imagen')
  await expect(page.getByRole('heading', { name: 'Cambiar de formato' })).toBeVisible()
  await page.getByRole('button', { name: /Imagen a PNG/ }).click()
  await expect(page).toHaveURL(/#\/convertir\/img-png$/)
})

test('rotar imagen ofrece voltear en horizontal y en vertical (W-120)', async ({ page }) => {
  await page.goto('/rotar-imagen')
  await upload(page, [{ name: 'foto.png', mimeType: 'image/png', buffer: PNG }])
  const h = page.getByRole('button', { name: 'Voltear horizontal' })
  await h.click()
  await expect(h).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Voltear vertical' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Aplicar giro' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.png$/)
})
