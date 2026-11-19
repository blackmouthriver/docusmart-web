// Accesibilidad (W-17): revisión automática con axe (WCAG 2.2 A y AA) de las páginas públicas,
// la app, sus diálogos y el asistente, en escritorio y celular. Se emula "reducir movimiento" para
// que no queden elementos a medio aparecer (alterarían la medición del contraste).
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './helpers'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

const PAGES = ['/', '/en/', '/privacidad', '/herramientas', '/unir-pdf', '/ja/image-to-webp', '/guias', '/guias/reducir-tamano-pdf', '/app/', '/app/#/herramientas', '/app/#/pdf', '/app/#/convertir', '/app/#/qr/crear', '/app/#/estudio/notas']

for (const path of PAGES) {
  test(`sin problemas de accesibilidad: ${path} @movil`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await audit(page)).toEqual([])
  })
}

test('sin problemas de accesibilidad en los diálogos de la app y el asistente', async ({ page }) => {
  await page.goto('/app/')
  await page.locator('.side-settings:not(.side-install)').click()
  await expect(page.getByRole('dialog', { name: 'Ajustes' })).toBeVisible()
  expect(await audit(page), 'Ajustes').toEqual([])
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Instalar DocuSmart Desktop' }).click()
  await expect(page.getByRole('dialog', { name: 'DocuSmart Desktop' })).toBeVisible()
  expect(await audit(page), 'DocuSmart Desktop').toEqual([])
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill('como uno dos pdf')
  await input.press('Enter')
  await expect(page.locator('.assistant-bubble.bot').last()).toContainText(/PDF/)
  expect(await audit(page), 'Asistente').toEqual([])
})

test('sin problemas de accesibilidad en modo oscuro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  for (const path of ['/', '/herramientas', '/unir-pdf', '/guias/firmar-pdf-sin-imprimir', '/app/', '/app/#/convertir']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await audit(page), path).toEqual([])
  }
})
