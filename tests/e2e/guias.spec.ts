// Guías (W-19): índice, una guía y sus enlaces a las herramientas.
import { expect, makePdf, test } from './helpers'

test('el índice de guías muestra las 22 guías en español (6 + 16 por herramienta) @movil', async ({ page }) => {
  await page.goto('/guias')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guías paso a paso')
  await expect(page.locator('.gd-cards > li')).toHaveCount(22)
})

test('una guía lleva a su herramienta y a otras guías', async ({ page }) => {
  await page.goto('/guias/unir-pdf-en-el-celular')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo unir PDF en el celular sin subir tus archivos')
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('"@type": "HowTo"')
  await expect(page.locator('.tp-related a[href^="/guias/"]')).toHaveCount(21)
  const toTool = page.locator('.gd-article').getByRole('link', { name: 'Unir PDF', exact: true }).first()
  await expect(toTool).toHaveAttribute('href', '/unir-pdf')
  await page.goto('/unir-pdf')
  await expect(page.locator('a[href="/guias/unir-pdf-en-el-celular"]')).toHaveCount(1)
})

test('las páginas enlazan a las guías de su idioma', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer a[href="/guias"]')).toHaveCount(1)
  await page.goto('/en/')
  await expect(page.locator('footer a[href="/en/guides"]')).toHaveCount(1)
  await page.goto('/en/merge-pdf')
  await expect(page.locator('a[href="/en/guides/merge-pdf-on-your-phone"]')).toHaveCount(1)
  await page.goto('/fr/')
  await expect(page.locator('footer a[href="/fr/guides"]')).toHaveCount(1)
  await page.goto('/ja/merge-pdf')
  await expect(page.locator('a[href="/ja/guides/merge-pdf-on-your-phone"]')).toHaveCount(1)
})

test('una guía en inglés enlaza a las herramientas en inglés y ofrece las otras versiones', async ({ page }) => {
  await page.goto('/en/guides/merge-pdf-on-your-phone')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.gd-article a[href="/en/merge-pdf"]').first()).toBeVisible()
  await expect(page.locator('.gd-article a[href="/unir-pdf"]')).toHaveCount(0)
  await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', 'https://docusmart.online/pt/guias/juntar-pdf-no-celular')
  await page.goto('/pt/guias')
  // Las 6 de W-19 y las 8 del lote 1 por herramienta (W-101), ya traducidas.
  await expect(page.locator('.gd-cards > li')).toHaveCount(14)
})

test('las guías muestran capturas de la herramienta, en su idioma y sin mover la página (W-100) @movil', async ({ page }) => {
  await page.goto('/guias/unir-pdf-en-el-celular')
  const shots = page.locator('.gd-shot img')
  await expect(shots).toHaveCount(2)
  const first = shots.first()
  await expect(first).toHaveAttribute('alt', /^Unir PDF con tres archivos en la lista/)
  await expect(first).toHaveAttribute('loading', 'lazy')
  await expect(first).toHaveAttribute('width', /^\d+$/)
  await expect(first).toHaveAttribute('height', /^\d+$/)
  await first.scrollIntoViewIfNeeded()
  // Carga la del ancho de la pantalla (celular o escritorio).
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0)
  const wide = (page.viewportSize()?.width ?? 1280) > 600
  expect(await first.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(wide ? /\/img\/guides\/es\/unir-pdf\/lista-1280\.webp$/ : /\/img\/guides\/es\/unir-pdf\/lista-390\.webp$/)
  // La caja ya tiene la proporción de la imagen antes de cargarla (sin saltos).
  const box = await first.boundingBox()
  const ratio = await first.evaluate((img: HTMLImageElement) => img.naturalHeight / img.naturalWidth)
  expect(Math.abs(box!.height / box!.width - ratio)).toBeLessThan(0.02)

  await page.goto('/ja/guides/merge-pdf-on-your-phone')
  await expect(page.locator('.gd-shot img').first()).toHaveAttribute('src', '/img/guides/ja/unir-pdf/lista-1280.webp')
  // Todas las guías traen al menos una captura.
  for (const path of ['/guias/pasar-fotos-a-pdf', '/guias/reducir-tamano-pdf', '/guias/firmar-pdf-sin-imprimir', '/guias/escanear-documentos-con-el-celular', '/guias/proteger-pdf-con-contrasena']) {
    await page.goto(path)
    expect(await page.locator('.gd-shot img').count()).toBeGreaterThan(0)
  }
})

test('en el celular, la lista de unir PDF deja ver el nombre y dice "1 página" @movil', async ({ page }) => {
  await page.goto('/unir-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles([
    { name: 'contrato.pdf', mimeType: 'application/pdf', buffer: makePdf(3) },
    { name: 'recibo.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  const rows = tool.locator('.file-item')
  await expect(rows.nth(1)).toContainText('1 página')
  await expect(rows.nth(1)).not.toContainText('1 páginas')
  await expect(rows.first()).toContainText('3 páginas')
  // El nombre entra completo (antes quedaba en "c…" con los datos uno por renglón).
  const name = rows.first().locator('.file-meta b')
  expect(await name.evaluate((b) => b.scrollWidth <= b.clientWidth)).toBe(true)
  const meta = await rows.first().locator('.file-meta').boundingBox()
  expect(meta!.width).toBeGreaterThan(100)
})

test('una guía por herramienta traducida (W-101): sus capturas en el idioma y enlaces entre idiomas', async ({ page }) => {
  await page.goto('/guias/tapar-datos-personales-en-un-pdf')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo tapar datos personales en un PDF (de verdad)')
  const shot = page.locator('.gd-shot img').first()
  await expect(shot).toHaveAttribute('src', '/img/guides/es/censurar-pdf/zonas-1280.webp')
  await expect(shot).toHaveAttribute('alt', /^Censurar PDF con el buscador/)
  await shot.scrollIntoViewIfNeeded()
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  // Traducida: hreflang a los otros idiomas y el menú de idioma los ofrece todos.
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://docusmart.online/en/guides/redact-personal-data-in-pdf')
  await expect(page.locator('.tp-lang a[hreflang]')).toHaveCount(12)
  // En inglés: su captura en inglés y la herramienta en inglés, que enlaza a su guía.
  await page.goto('/en/guides/redact-personal-data-in-pdf')
  await expect(page.locator('.gd-shot img').first()).toHaveAttribute('src', '/img/guides/en/censurar-pdf/zonas-1280.webp')
  await expect(page.locator('.gd-article a[href="/en/redact-pdf"]').first()).toBeVisible()
  await page.goto('/en/redact-pdf')
  await expect(page.locator('a[href="/en/guides/redact-personal-data-in-pdf"]')).toHaveCount(1)
})

test('una guía por herramienta sin traducir (lote 2, W-101) solo existe en español', async ({ page }) => {
  await page.goto('/guias/reparar-un-pdf-que-no-abre')
  await expect(page.locator('.gd-shot img').first()).toHaveAttribute('src', '/img/guides/es/reparar-pdf/resultado-1280.webp')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0)
  await expect(page.locator('.tp-lang a[hreflang]')).toHaveCount(1)
  await page.goto('/reparar-pdf')
  await expect(page.locator('a[href="/guias/reparar-un-pdf-que-no-abre"]')).toHaveCount(1)
  await page.goto('/en/repair-pdf')
  await expect(page.locator('a[href*="reparar-un-pdf"]')).toHaveCount(0)
  await page.goto('/en/guides')
  await expect(page.locator('.gd-cards > li')).toHaveCount(14)
})

