// Agenda del Modo Estudio (W-126): eventos, avisos, exportar/importar .ics y notas en Markdown.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './helpers'

/** Fecha local "AAAA-MM-DD" de hoy + `days`, calculada en el navegador (su zona horaria). */
const dayKey = (page: Page, days: number) =>
  page.evaluate((d) => {
    const t = new Date()
    t.setDate(t.getDate() + d)
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, days)

async function downloadExport(page: Page) {
  const panel = page.getByRole('region', { name: 'Exportación lista' })
  const wait = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  return { name: file.suggestedFilename(), text: (await readFile((await file.path())!)).toString('utf-8') }
}

test('agregar, exportar, importar, editar y borrar eventos', async ({ page }) => {
  await page.goto('/app/#/estudio/agenda')
  const agenda = page.locator('.card', { has: page.getByRole('heading', { name: 'Agenda', level: 3 }) })
  await expect(agenda.getByText(/Todavía no hay eventos próximos/)).toBeVisible()
  await expect(agenda.getByRole('button', { name: 'Agregar a la agenda' })).toBeDisabled()

  // 1. Un examen mañana a las 10:00.
  await agenda.getByLabel('Título').fill('Examen de prueba')
  await agenda.getByLabel('Fecha').fill(await dayKey(page, 1))
  await agenda.getByLabel('Hora', { exact: true }).fill('10:00')
  await agenda.getByLabel('Notas').fill('Aula 3, llevar calculadora')
  await agenda.getByRole('button', { name: 'Agregar a la agenda' }).click()
  const day = agenda.getByRole('region', { name: /^Mañana · / })
  await expect(day.getByText('Examen de prueba')).toBeVisible()
  await expect(day.getByText('Aula 3, llevar calculadora')).toBeVisible()
  await expect(day.getByText('30 minutos antes')).toBeVisible()

  // 2. Exportar todo a .ics.
  await agenda.getByRole('button', { name: 'Exportar todo (.ics)' }).click()
  const ics = await downloadExport(page)
  expect(ics.name).toBe('agenda.ics')
  expect(ics.text).toContain('BEGIN:VCALENDAR')
  expect(ics.text).toContain('SUMMARY:Examen de prueba')
  expect(ics.text).toContain('DESCRIPTION:Aula 3\\, llevar calculadora')
  expect(ics.text).toContain('TRIGGER:-PT30M')

  // 3. Importar un .ics de otro calendario (evento de todo el día dentro de 3 días).
  const inThree = (await dayKey(page, 3)).replace(/-/g, '')
  const file = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:otro@calendario', `DTSTART;VALUE=DATE:${inThree}`, 'SUMMARY:Entrega del proyecto', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  await agenda.locator('input[type=file][accept*=".ics"]').setInputFiles({ name: 'calendario.ics', mimeType: 'text/calendar', buffer: Buffer.from(file) })
  await expect(page.getByText('Se importaron 1 eventos.')).toBeVisible()
  const imported = agenda.locator('.agenda-item', { hasText: 'Entrega del proyecto' })
  await expect(imported.getByText('Todo el día')).toBeVisible()

  // 4. Editar el examen.
  await agenda.locator('.agenda-item', { hasText: 'Examen de prueba' }).getByRole('button', { name: 'Editar evento' }).click()
  await expect(agenda.getByText('Editando evento')).toBeVisible()
  await agenda.getByLabel('Título').fill('Examen final')
  await agenda.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(agenda.getByText('Examen final')).toBeVisible()
  await expect(agenda.getByText('Examen de prueba')).toHaveCount(0)

  // 5. Borrar el importado y comprobar que lo demás se conserva al recargar.
  await imported.getByRole('button', { name: 'Borrar evento' }).click()
  await expect(agenda.getByText('Entrega del proyecto')).toHaveCount(0)
  await page.reload()
  await expect(agenda.getByText('Examen final')).toBeVisible()
})

test('un evento que empieza ahora avisa en pantalla', async ({ page }) => {
  await page.goto('/app/#/estudio/agenda')
  const agenda = page.locator('.card', { has: page.getByRole('heading', { name: 'Agenda', level: 3 }) })
  const now = await page.evaluate(() => {
    const t = new Date()
    return { date: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`, time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` }
  })
  await agenda.getByLabel('Título').fill('Clase de inglés')
  await agenda.getByLabel('Fecha').fill(now.date)
  await agenda.getByLabel('Hora', { exact: true }).fill(now.time)
  await agenda.getByLabel('Aviso').selectOption({ label: 'A la hora' })
  await agenda.getByRole('button', { name: 'Agregar a la agenda' }).click()
  await expect(page.getByText(`Recordatorio: Clase de inglés · Empieza a las ${now.time}`)).toBeVisible({ timeout: 10_000 })
  // Ya avisó: al recargar no vuelve a avisar.
  await page.reload()
  await expect(agenda.getByText('Clase de inglés')).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(page.getByText(/Recordatorio: Clase de inglés/)).toHaveCount(0)
})

test('las notas se exportan a Markdown', async ({ page }) => {
  await page.goto('/app/#/estudio/notas')
  await page.getByPlaceholder(/título/i).first().fill('Resumen tema 1')
  await page.locator('textarea').first().fill('- Punto uno\n- Punto dos')
  await page.getByRole('button', { name: 'Guardar nota' }).click()
  await page.locator('.note', { hasText: 'Resumen tema 1' }).getByRole('button', { name: 'MD' }).click()
  const md = await downloadExport(page)
  expect(md.name).toBe('Resumen tema 1.md')
  expect(md.text.startsWith('# Resumen tema 1\n\n*')).toBe(true)
  expect(md.text).toContain('- Punto uno\n- Punto dos')
})
