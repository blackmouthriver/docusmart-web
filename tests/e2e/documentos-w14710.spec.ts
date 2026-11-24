// W-147.10: comparar la hoja de vida con una oferta, carta de presentación y valor en letras en
// portugués e inglés.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test } from './helpers'

async function save(page: Page, click: () => Promise<void>) {
  const wait = page.waitForEvent('download')
  await click()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

async function pdfText(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  return text
}

const OFFER = `Analista de datos. Buscamos profesional con experiencia en análisis de datos.
Requisitos: Excel avanzado, SQL y Power BI. Conocimientos en Python.
Funciones: reportes en Power BI, consultas SQL y análisis de datos de ventas.`

test('hoja de vida contra una oferta: lo que falta se agrega, y la carta usa lo que coincide @movil', async ({ page }) => {
  await page.goto('/app/#/documentos/cv')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByRole('region', { name: 'Datos personales' }).getByLabel('Ciudad').fill('Bogotá')
  await page.getByRole('region', { name: 'Habilidades' }).getByRole('textbox').fill('Excel, SQL')

  await page.getByText('Comparar con una oferta de trabajo').click()
  await page.getByLabel('Texto de la oferta').fill(OFFER)
  const missing = page.getByRole('list', { name: /^Te faltan/ })
  await expect(missing).toContainText('Power BI')
  await expect(page.getByRole('list', { name: /^Ya las tienes/ })).toContainText('SQL')
  const before = Number((await page.getByText(/% de coincidencia con la oferta/).textContent())!.match(/\d+/)![0])
  // Agregar "Power BI" a Habilidades sube la coincidencia.
  await missing.getByRole('button', { name: 'Agregar «Power BI» a Habilidades' }).click()
  await expect(page.getByRole('region', { name: 'Habilidades' }).getByRole('textbox')).toHaveValue('Excel, SQL, Power BI')
  await expect(page.getByRole('list', { name: /^Ya las tienes/ })).toContainText('Power BI')
  const after = Number((await page.getByText(/% de coincidencia con la oferta/).textContent())!.match(/\d+/)![0])
  expect(after).toBeGreaterThan(before)

  await page.getByText('Carta de presentación', { exact: true }).click()
  const card = page.locator('details.cv-extra').filter({ hasText: 'Carta de presentación' })
  await card.getByLabel('Empresa', { exact: true }).fill('Datos SAS')
  await card.getByLabel('Cargo al que aplicas').fill('Analista de datos')
  await page.getByRole('button', { name: 'Escribir la carta' }).click()
  const letter = page.getByLabel('Texto de la carta (puedes editarlo)')
  await expect(letter).toHaveValue(/Equipo de Datos SAS:/)
  await expect(letter).toHaveValue(/postularme al cargo de Analista de datos en Datos SAS/)
  await expect(letter).toHaveValue(/Entre mis fortalezas están .*Power BI/)
  await letter.fill((await letter.inputValue()).replace('Cordialmente,', 'Saludos cordiales,'))
  await page.getByRole('button', { name: 'Carta en PDF' }).click()
  const pdf = await save(page, () => page.locator('.cv-extra').getByRole('button', { name: 'Descargar', exact: true }).click())
  expect(pdf.name).toBe('carta-de-presentacion-ana-perez.pdf')
  const text = await pdfText(pdf.bytes)
  expect(text).toContain('Datos SAS')
  expect(text).toContain('Saludos cordiales,')
})

for (const [lang, desc, price, words] of [
  ['pt', 'Descrição', 'Valor unitário', 'Mil duzentos e cinquenta reais'],
  ['en', 'Description', 'Unit price', 'One thousand two hundred fifty dollars'],
] as const) {
  test(`cuenta de cobro: valor en letras en ${lang}`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('ds-lang', l), lang)
    await page.goto('/app/#/documentos/cobro')
    if (lang === 'pt') await page.locator('select').filter({ has: page.locator('option[value="BRL"]') }).first().selectOption('BRL')
    else await page.locator('select').filter({ has: page.locator('option[value="USD"]') }).first().selectOption('USD')
    await page.getByLabel(desc).fill('Design')
    await page.getByLabel(price).fill('1250')
    await expect(page.locator('.bill-words')).toHaveText(new RegExp(`^${words}`))
  })
}
