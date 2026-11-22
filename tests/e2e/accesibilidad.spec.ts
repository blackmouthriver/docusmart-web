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

const PAGES = ['/', '/en/', '/privacidad', '/herramientas', '/unir-pdf', '/ja/image-to-webp', '/guias', '/guias/reducir-tamano-pdf', '/en/guides/sign-pdf-without-printing', '/pt/guias', '/de/anleitungen/pdf-verkleinern', '/ja/guides/photos-to-pdf', '/app/', '/app/#/herramientas', '/app/#/pdf', '/app/#/convertir', '/app/#/qr/crear', '/app/#/estudio/notas']

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

test.describe('aviso de privacidad y cookies', () => {
  test.use({ presetConsent: 'none' })
  test('sin problemas de accesibilidad @movil', async ({ page }) => {
    await page.goto('/unir-pdf')
    await expect(page.getByRole('dialog', { name: 'Privacidad y cookies' })).toBeVisible()
    expect(await audit(page)).toEqual([])
  })
})

test('sin problemas de accesibilidad en la barra lateral clara y de color de acento, con cada acento (W-145)', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  const accents = ['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'red', 'amber', 'cyan']
  for (const theme of ['light', 'dark']) {
    for (const sidebar of ['light', 'accent']) {
      for (const accent of accents) {
        await page.evaluate((look) => localStorage.setItem('ds-appearance', JSON.stringify(look)), { theme, accent, sidebar, font: 'normal', animatedBg: false }).catch(() => {})
        await page.goto('/app/#/pdf/unir')
        await page.evaluate((look) => localStorage.setItem('ds-appearance', JSON.stringify(look)), { theme, accent, sidebar, font: 'normal', animatedBg: false })
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('data-sidebar', sidebar)
        const { violations } = await new AxeBuilder({ page }).include('.sidebar').withTags(TAGS).analyze()
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`), `${theme}/${sidebar}/${accent}`).toEqual([])
      }
    }
  }
})
