// Tarjetas nuevas del asistente con teclado, lector de pantalla y en el celular (W-151.17): «Hacer /
// Cambiar» (W-151.5), el aviso de error (W-151.6) y el siguiente paso (W-151.7).
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, makePdf, test, upload } from './helpers'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']
/** Revisa solo el panel del asistente, ya en su estado final (fuentes cargadas, sin transiciones). */
async function auditPanel(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
  const { violations } = await new AxeBuilder({ page }).include('.assistant-panel').withTags(TAGS).analyze()
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
}
/** El panel cabe en la pantalla: nada se sale por los costados. */
async function fitsWidth(page: Page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.assistant-panel')!.getBoundingClientRect()
    const wide = [...document.querySelectorAll('.assistant-panel *')].filter((el) => el.getBoundingClientRect().right > panel.right + 1)
    return { inside: panel.left >= 0 && panel.right <= window.innerWidth + 1, overflowing: wide.length }
  })
}
async function ask(page: Page, text: string) {
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  const input = page.getByPlaceholder('Escribe tu pregunta…')
  await input.fill(text)
  await input.press('Enter')
}

test('tarjeta «Hacer / Cambiar»: sin problemas de accesibilidad y cabe en la pantalla @movil', async ({ page }) => {
  await page.goto('/app/')
  await ask(page, 'gira las paginas 2 a 3 del pdf a la derecha')
  await expect(page.locator('.assistant-plan')).toContainText('Giro: 90°')
  expect(await auditPanel(page)).toEqual([])
  expect(await fitsWidth(page)).toEqual({ inside: true, overflowing: 0 })
})

test('aviso de error y siguiente paso: sin problemas de accesibilidad y caben en la pantalla @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/dividir')
  await upload(page, [{ name: 'roto.pdf', mimeType: 'application/pdf', buffer: Buffer.from('esto no es un pdf') }])
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  await expect(page.locator('.assistant-screen-error')).toBeVisible()
  expect(await auditPanel(page)).toEqual([])
  expect(await fitsWidth(page)).toEqual({ inside: true, overflowing: 0 })
  // Esc cierra el panel (si no, en el celular tapa los botones de la pantalla).
  await page.keyboard.press('Escape')
  await expect(page.locator('.assistant-panel')).toHaveCount(0)

  await page.goto('/app/#/pdf/unir')
  await upload(page, [{ name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }, { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) }])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await expect(page.getByRole('heading', { name: '¿Y ahora?' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).click()
  await expect(page.getByText('Lo que suele venir después:')).toBeVisible()
  expect(await auditPanel(page)).toEqual([])
  expect(await fitsWidth(page)).toEqual({ inside: true, overflowing: 0 })
})

test('solo con el teclado: «comprime este pdf a 1 mega» termina con el PDF comprimido @movil', async ({ page }) => {
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Asistente de DocuSmart' }).focus()
  await page.keyboard.press('Enter')
  // Al abrirse, el foco va al campo de la pregunta.
  await expect(page.getByPlaceholder('Escribe tu pregunta…')).toBeFocused()
  await page.keyboard.type('comprime este pdf a 1 mega')
  await page.keyboard.press('Enter')
  const doIt = page.getByRole('button', { name: 'Hacer' })
  await expect(doIt).toBeVisible()
  // Con Tab se llega a «Hacer» sin salir del panel (el foco queda atrapado en el diálogo).
  for (let i = 0; i < 12 && !(await doIt.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(doIt).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/pdf\/comprimir$/)
  await upload(page, [{ name: 'informe.pdf', mimeType: 'application/pdf', buffer: makePdf(3) }])
  await expect(page.getByRole('combobox', { name: /Tamaño máximo/ })).toHaveValue('1')
  await page.getByRole('button', { name: /^Comprimir/ }).last().click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 60_000 })
})
