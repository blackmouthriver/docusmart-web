// DocuSmart Desktop en Mac y Linux (W-150): la ayuda cambia según el sistema, y los archivos abiertos con la app
// instalada llegan a la pantalla "Abrir con" y de ahí a la herramienta elegida.
import type { Page } from '@playwright/test'
import { expect, makePdf, test } from './helpers'

const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const UBUNTU_FIREFOX = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0'
const LINUX_CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** Simula otro sistema: el agente de usuario y sin userAgentData (que si no diría el sistema real). */
async function asSystem(page: Page, ua: string) {
  await page.addInitScript((ua) => {
    Object.defineProperty(navigator, 'userAgent', { get: () => ua })
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
  }, ua)
}

async function openHelp(page: Page) {
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Instalar DocuSmart Desktop' }).click()
  return page.getByRole('dialog', { name: 'DocuSmart Desktop' })
}

test('en una Mac con Safari: Agregar al Dock, y dónde queda la app', async ({ page }) => {
  await asSystem(page, MAC_SAFARI)
  const panel = await openHelp(page)
  await expect(panel).toContainText('Archivo → Agregar al Dock')
  await expect(panel).toContainText('macOS Sonoma')
  await expect(panel.getByRole('heading', { name: 'Dónde queda' })).toBeVisible()
  await expect(panel).toContainText('Launchpad')
})

test('en Linux con Chrome: dónde queda; con Firefox, que no se puede instalar', async ({ page, browser }) => {
  await asSystem(page, LINUX_CHROME)
  let panel = await openHelp(page)
  await expect(panel).toContainText('menú de aplicaciones de tu escritorio')
  const other = await browser.newPage()
  await asSystem(other, UBUNTU_FIREFOX)
  panel = await openHelp(other)
  await expect(panel).toContainText('Firefox no instala sitios como programa')
  await expect(panel.getByRole('heading', { name: 'Dónde queda' })).toHaveCount(0)
  await other.close()
})

test('en una Mac, los atajos de teclado se escriben con ⌘', async ({ page }) => {
  await asSystem(page, MAC_SAFARI)
  await page.goto('/app/#/qr/leer')
  await expect(page.getByText('(⌘+V)', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('Ctrl+V', { exact: false })).toHaveCount(0)
})

test('un PDF abierto con DocuSmart Desktop: elegir la herramienta y el archivo llega a ella', async ({ page }) => {
  // La cola de lanzamiento (launchQueue) que el navegador usa con los file_handlers del manifest.
  await page.addInitScript(() => {
    const w = window as unknown as { __launch: (files: File[]) => void }
    let consumer: ((p: { files: Array<{ getFile: () => Promise<File> }> }) => void) | null = null
    let pending: File[] | null = null
    // Chrome ya trae un launchQueue propio (sin archivos en una prueba): se reemplaza por uno que podemos disparar.
    Object.defineProperty(window, 'launchQueue', {
      configurable: true,
      value: { setConsumer: (c: typeof consumer) => ((consumer = c), pending && c!({ files: pending.map((f) => ({ getFile: async () => f })) })) },
    })
    w.__launch = (files) => (consumer ? consumer({ files: files.map((f) => ({ getFile: async () => f })) }) : (pending = files))
  })
  await page.goto('/app/')
  const pdf = makePdf(3).toString('base64')
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    ;(window as unknown as { __launch: (f: File[]) => void }).__launch([new File([bytes], 'contrato.pdf', { type: 'application/pdf' })])
  }, pdf)
  await expect(page).toHaveURL(/#\/abrir$/)
  await expect(page.getByRole('heading', { name: 'Abrir con DocuSmart' })).toBeVisible()
  await expect(page.getByText('¿Qué quieres hacer con este archivo?')).toBeVisible()
  await expect(page.getByText('contrato.pdf')).toBeVisible()
  await expect(page).toHaveTitle(/^Abrir con DocuSmart · /)
  await page.getByRole('button', { name: 'Comprimir PDF' }).click()
  await expect(page).toHaveURL(/#\/pdf\/comprimir$/)
  // La herramienta recibe el archivo sin volver a elegirlo.
  await expect(page.locator('main').getByText('contrato.pdf')).toBeVisible()
})

test('Abrir con sin archivos explica cómo usarlo', async ({ page }) => {
  await page.goto('/app/#/abrir')
  await expect(page.getByText('No hay archivos para abrir', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Ver todas las herramientas' }).click()
  await expect(page).toHaveURL(/#\/herramientas$/)
})
