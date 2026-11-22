// App web (/app/): navegación, ajustes, QR, asistente y ayuda de DocuSmart Desktop (W-11).
import { expect, test } from './helpers'

test('la app carga y la barra lateral lleva a Todas las herramientas, con carrusel y buscador', async ({ page }) => {
  await page.goto('/app/')
  await expect(page.locator('.shell')).toBeVisible()
  await page.getByRole('link', { name: 'Todas las herramientas' }).first().click()
  await expect(page).toHaveURL(/#\/herramientas/)
  await expect(page.locator('.tools-marquee .tools-track')).toHaveCount(2)
  await page.getByPlaceholder(/Por ejemplo/).fill('marca de agua')
  // La de PDF y la de imágenes (W-123), una vez cada una.
  const found = page.locator('.tools-grid .quick')
  await expect(found).toHaveCount(2)
  await expect(found.filter({ hasText: 'Texto o logo sobre las páginas del PDF' })).toHaveCount(1)
  await expect(found.filter({ hasText: 'Texto o logo sobre tus fotos, por lotes' })).toHaveCount(1)
})

test('Ajustes se abre, cambia el tema y se cierra con Esc', async ({ page }) => {
  await page.goto('/app/')
  await page.locator('.side-settings:not(.side-install)').click()
  const panel = page.getByRole('dialog', { name: 'Ajustes' })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Oscuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  // "Sistema" copia el modo del sistema operativo y lo dice, para que no parezca igual a Claro sin razón.
  await panel.getByRole('button', { name: 'Sistema' }).click()
  await expect(panel.getByTestId('theme-system-hint')).toHaveText('Tu sistema usa ahora el modo claro.')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

test('la barra lateral muestra las herramientas por categoría, busca y cambia de estilo (W-145)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/app/#/pdf/unir')
  const nav = page.getByRole('navigation', { name: 'Secciones' })
  // La categoría de la herramienta abierta se despliega sola, con la herramienta marcada.
  const organize = nav.getByRole('button', { name: /Organizar PDF/ })
  await expect(organize).toHaveAttribute('aria-expanded', 'true')
  await expect(nav.getByRole('link', { name: 'Unir PDFs' })).toHaveAttribute('aria-current', 'page')
  // Las demás categorías se despliegan al tocarlas y llevan a sus herramientas.
  const security = nav.getByRole('button', { name: /Seguridad/ })
  await expect(security).toHaveAttribute('aria-expanded', 'false')
  await security.click()
  await expect(security).toHaveAttribute('aria-expanded', 'true')
  await nav.getByRole('link', { name: 'Proteger PDF' }).click()
  await expect(page).toHaveURL(/#\/pdf\/proteger/)
  await expect(nav.getByRole('link', { name: 'Proteger PDF' })).toHaveAttribute('aria-current', 'page')
  // Un grupo abierto se vuelve a cerrar (con la misma transición de alto en los dos sentidos).
  const height = (id: string) => page.locator(`#nav-cat-${id}`).evaluate((el) => el.getBoundingClientRect().height)
  await organize.click()
  await expect(organize).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => height('organizar')).toBe(0)
  await organize.click()
  await expect.poll(() => height('organizar')).toBeGreaterThan(100)
  // Modo Estudio se despliega y se cierra como las categorías, con su cantidad de funciones.
  const study = nav.getByRole('button', { name: /Modo Estudio/ })
  await expect(study).toContainText('5')
  await expect(study).toHaveAttribute('aria-expanded', 'false')
  await study.click()
  await expect(study).toHaveAttribute('aria-expanded', 'true')
  await nav.getByRole('link', { name: 'Notas' }).click()
  await expect(page).toHaveURL(/#\/estudio\/notas/)
  await study.click()
  await expect(study).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => height('estudio')).toBe(0)
  // Ningún nombre ni contador se sale de la barra.
  const overflow = await nav.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  // El buscador filtra la barra y Esc lo limpia.
  const search = nav.getByRole('searchbox', { name: 'Buscar herramienta' })
  await search.fill('unir')
  await expect(nav.getByRole('link', { name: 'Unir PDFs' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveCount(0)
  await search.fill('zzzz')
  await expect(nav.getByText('Ninguna herramienta coincide')).toBeVisible()
  await search.press('Escape')
  await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible()
  // Ajustes: la barra toma el estilo elegido (clara, acento o según el tema).
  await page.locator('.side-settings:not(.side-install)').click()
  const panel = page.getByRole('dialog', { name: 'Ajustes' })
  const sidebar = panel.getByRole('group', { name: 'Barra lateral' })
  await sidebar.getByRole('button', { name: 'Clara' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'light')
  await sidebar.getByRole('button', { name: 'Color de acento' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'accent')
  await panel.getByRole('button', { name: 'Oscuro' }).click()
  await sidebar.getByRole('button', { name: 'Según el tema' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'dark')
  await page.keyboard.press('Escape')
  // Plegada, cada categoría es un ícono que lleva a ella en "Todas las herramientas".
  await page.getByRole('button', { name: 'Contraer menú' }).click()
  await nav.getByRole('link', { name: 'Seguridad' }).click()
  await expect(page).toHaveURL(/#\/herramientas\/seguridad/)
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

test('el menú lateral se desplaza en ventanas bajas y la pestaña de plegar no tapa la marca', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto('/app/#/pdf')
  const scroll = page.locator('.side-scroll')
  const { scrollable, overflowY } = await scroll.evaluate((el) => ({ scrollable: el.scrollHeight > el.clientHeight, overflowY: getComputedStyle(el).overflowY }))
  expect(scrollable).toBe(true)
  expect(overflowY).toBe('auto')
  await scroll.evaluate((el) => { el.scrollTop = el.scrollHeight })
  await expect(page.locator('.sidebar .side-play')).toBeInViewport()
  // La pestaña queda a media altura, fuera de la zona de la marca.
  const toggle = await page.getByRole('button', { name: 'Contraer menú' }).boundingBox()
  const brand = await page.locator('.side-brand').boundingBox()
  expect(toggle!.y).toBeGreaterThan(brand!.y + brand!.height)
  // Y queda entera fuera de la barra: no tapa la barra de desplazamiento del menú.
  const sidebar = await page.locator('.sidebar').boundingBox()
  expect(toggle!.x).toBeGreaterThanOrEqual(sidebar!.x + sidebar!.width - 0.5)
  await page.getByRole('button', { name: 'Contraer menú' }).click()
  await expect(page.getByRole('button', { name: 'Expandir menú' })).toBeVisible()
  await page.getByRole('button', { name: 'Expandir menú' }).click()
})

test('el asistente conoce las novedades: renombrar, guardar en la nube, guías y anuncios (W-104)', async ({ page }) => {
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  const ask = async (q: string, expected: RegExp) => {
    await input.fill(q)
    await input.press('Enter')
    await expect(page.locator('.assistant-bubble.bot').last()).toContainText(expected, { timeout: 15_000 })
  }
  await ask('cómo le cambio el nombre al archivo', /Nombre del archivo/)
  await ask('puedo guardar en google drive', /carpeta DocuSmart/)
  await ask('hay tutoriales', /Guías/)
  await ask('por qué hay anuncios', /Privacidad y cookies/)
})
