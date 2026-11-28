// Tarjeta «Hacer / Cambiar» del asistente (W-151.5): el pedido abre la herramienta con las opciones puestas,
// sin pasar nada por la URL.
import type { Page } from '@playwright/test'
import { expect, makePdf, test, upload } from './helpers'

/** La herramienta se carga después de navegar: hasta que no aparece su título, el archivo iría a la pantalla anterior. */
async function toolReady(page: Page, title: string) {
  await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible()
}

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
  await toolReady(page, 'Comprimir PDF')
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

test('marca de agua en el PDF: el texto y la posición quedan puestos', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'marca de agua "Borrador" abajo a la derecha en el pdf')
  await expect(page.locator('.assistant-plan')).toContainText('Posición: Abajo a la derecha')
  await page.getByRole('button', { name: 'Hacer' }).click()
  await expect(page).toHaveURL(/#\/pdf\/marca$/)
  await toolReady(page, 'Marca de agua')
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(2) }])
  await expect(page.getByRole('textbox', { name: 'Texto' })).toHaveValue('Borrador')
  await expect(page.getByRole('radio', { name: 'Abajo a la derecha' })).toHaveAttribute('aria-checked', 'true')
})

test('PDF a imagen a 300 ppp en PNG', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'convierte el pdf a png a 300 ppp')
  await expect(page.locator('.assistant-plan')).toContainText('Resolución: 300 ppp')
  await page.getByRole('button', { name: 'Hacer' }).click()
  await expect(page).toHaveURL(/#\/convertir\/pdf-img$/)
  await toolReady(page, 'PDF → Imagen')
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(2) }])
  await expect(page.getByRole('button', { name: '300 ppp (imprimir)' })).toHaveAttribute('aria-pressed', 'true')
})

test('contexto de la pantalla (W-151.6): tras un PDF dañado, el asistente explica el aviso y ofrece Reparar PDF', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  await upload(page, [{ name: 'roto.pdf', mimeType: 'application/pdf', buffer: Buffer.from('esto no es un pdf') }])
  await expect(page.locator('main')).toContainText('roto.pdf')
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  await expect(page.locator('.assistant-screen-error')).toContainText('Vi que salió este aviso')
  await expect(page.locator('.assistant-screen-error')).toContainText('roto.pdf')
  await expect(page.getByRole('link', { name: /Reparar PDF/ }).first()).toBeVisible()
  // Y si escribe «¿por qué no me deja?», responde con ese aviso.
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill('por que no me deja')
  await input.press('Enter')
  await expect(page.locator('.assistant-screen-error')).toHaveCount(2)
})

test('siguiente paso (W-151.7): tras unir, el asistente sugiere el siguiente y lleva el resultado; se apaga en Ajustes', async ({ page }) => {
  const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: makePdf(1) })
  await page.goto('/app/#/pdf/unir')
  // Unir acepta varios archivos: se espera su selector (el de la pantalla anterior podía seguir montado).
  await page.locator('input[type=file][multiple]').first().waitFor({ state: 'attached' })
  await upload(page, [pdf('a.pdf'), pdf('b.pdf')])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await expect(page.getByRole('heading', { name: '¿Y ahora?' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  await expect(page.locator('.assistant-bubble.bot').last()).toContainText('Lo que suele venir después:')
  const first = page.locator('.assistant-panel .assistant-actions button').first()
  const name = (await first.textContent())!.trim()
  await first.click()
  await expect(page).not.toHaveURL(/#\/pdf\/unir$/)
  // La herramienta siguiente recibe el resultado de unir, sin volver a elegirlo.
  await expect(page.locator('main')).toContainText('unido.pdf')
  expect(name.length).toBeGreaterThan(0)

  // Apagado en Ajustes: después de unir, el asistente ya no lo sugiere.
  await page.goto('/app/#/pdf/unir')
  // Unir acepta varios archivos: se espera su selector (el de la pantalla anterior podía seguir montado).
  await page.locator('input[type=file][multiple]').first().waitFor({ state: 'attached' })
  await page.getByRole('button', { name: 'Idioma y apariencia' }).first().click()
  await page.getByRole('switch', { name: /Sugerencias del asistente/ }).uncheck()
  await page.keyboard.press('Escape')
  await upload(page, [pdf('a.pdf'), pdf('b.pdf')])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await expect(page.getByRole('heading', { name: '¿Y ahora?' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  await expect(page.locator('.assistant-bubble.bot').first()).toBeVisible()
  await expect(page.getByText('Lo que suele venir después:')).toHaveCount(0)
})

test('aviso honesto (W-151.16): cada respuesta dice de dónde salió', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'es gratis?')
  await expect(page.locator('.assistant-ai-badge').last()).toHaveText('Respuesta de la base de DocuSmart')
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill('comprime este pdf a 2 megas')
  await input.press('Enter')
  await expect(page.locator('.assistant-ai-badge').last()).toHaveText('Entendí tu pedido: revisa antes de tocar «Hacer»')
  // Y la nota de privacidad sigue en la cabecera del panel.
  await expect(page.locator('.assistant-head')).toContainText('Todo ocurre en tu navegador')
})

test('varios pasos (W-151.8): «une estos pdf y luego giralos 90 grados» se hace paso a paso con «Continuar»', async ({ page }) => {
  const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: makePdf(1) })
  await page.goto('/app/')
  await ask(page, 'une estos pdf y luego giralos 90 grados')
  const card = page.locator('.assistant-plan')
  await expect(card).toContainText('Puedo hacerlo en 2 pasos:')
  await expect(card.locator('ol > li')).toHaveCount(2)
  await expect(card.locator('ol > li').nth(1)).toContainText('Giro: 90°')
  await page.getByRole('button', { name: 'Hacer' }).click()
  // Paso 1: Unir.
  await expect(page).toHaveURL(/#\/pdf\/unir$/)
  await page.locator('input[type=file][multiple]').first().waitFor({ state: 'attached' })
  await upload(page, [pdf('a.pdf'), pdf('b.pdf')])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await expect(page.getByText('Plan del asistente: paso 1 de 2 listo. Sigue: Rotar páginas.')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Continuar' }).click()
  // Paso 2: Rotar, con el PDF unido ya cargado y las páginas giradas 90°.
  await expect(page).toHaveURL(/#\/pdf\/rotar$/)
  await expect(page.locator('main')).toContainText('unido.pdf')
  await expect(page.locator('main')).toContainText('1 · 90°')
  const go = page.getByRole('button', { name: 'Rotar PDF', exact: true })
  await go.scrollIntoViewIfNeeded()
  await go.click()
  await expect(page.getByText('Plan del asistente: paso 2 de 2 listo. Plan terminado.')).toBeVisible({ timeout: 60_000 })
})
