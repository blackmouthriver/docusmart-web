// Verificación en el navegador: PDF que se abren sin contraseña pero traen restricciones, con los
// 4 cifrados que existen (RC4 40 y 128, AES 128 y 256). Ninguna pantalla debe decir que tienen
// contraseña. Los PDF se cifran aquí con el mismo qpdf (wasm) de la app.
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import type { Page } from '@playwright/test'
import { QPDF_OK, QPDF_WARNINGS, runQpdf, setQpdfWasmUrl } from '../../src/features/security/infra/qpdf'
import { expect, test } from './helpers'

setQpdfWasmUrl(resolve(process.cwd(), 'node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm'))

async function restricted(bits: '40' | '128' | '256', aes: boolean): Promise<Buffer> {
  const d = await PDFDocument.create()
  const font = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < 2; i++) d.addPage([595, 842]).drawText(`Pagina ${i + 1}`, { font, x: 60, y: 760, size: 18 })
  const f = d.getForm().createTextField('Nombre')
  f.addToPage(d.getPage(0), { x: 60, y: 600, width: 200, height: 24 })
  const perms = bits === '40' ? ['--print=n', '--modify=n', '--extract=n'] : ['--print=none', '--modify=none', '--extract=n']
  const weak = bits === '256' || aes ? [] : ['--allow-weak-crypto']
  const use = bits === '128' ? [`--use-aes=${aes ? 'y' : 'n'}`] : []
  const r = await runQpdf([...weak, '--encrypt', '', 'propietario-de-prueba', bits, ...perms, ...use, '--', '{in}', '{out}'], await d.save())
  if ((r.code !== QPDF_OK && r.code !== QPDF_WARNINGS) || !r.output) throw new Error(r.messages.join(' '))
  return Buffer.from(r.output)
}

const LOCKED = /tiene contraseña/i
async function open(page: Page, path: string, files: Array<{ name: string; buffer: Buffer }>) {
  await page.goto(path)
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(files.map((f) => ({ ...f, mimeType: 'application/pdf' })))
  return tool
}
async function runAndDownload(page: Page, tool: ReturnType<Page['locator']>): Promise<PDFDocument> {
  await tool.locator('.btn-primary:not([disabled])').last().click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 30_000 })
  return PDFDocument.load(await readFile((await (await wait).path())!))
}

for (const [name, bits, aes] of [['RC4 40', '40', false], ['RC4 128', '128', false], ['AES 128', '128', true], ['AES 256', '256', false]] as const) {
  test(`solo restricciones (${name}): unir, rotar, dividir, proteger, firmar y llenar sin pedir contraseña`, async ({ page }) => {
    test.setTimeout(120_000)
    const pdf = await restricted(bits, aes)
    const file = { name: `extracto-${bits}.pdf`, buffer: pdf }

    // Unir: cuenta sus páginas y une sin avisar contraseña.
    let tool = await open(page, '/unir-pdf', [file, { name: 'otro.pdf', buffer: pdf }])
    await expect(tool.locator('.file-item').first()).toContainText('2 páginas')
    expect((await runAndDownload(page, tool)).getPageCount()).toBe(4)
    await expect(tool.getByText(LOCKED)).toHaveCount(0)

    // Rotar.
    tool = await open(page, '/rotar-pdf', [file])
    await tool.getByRole('button', { name: 'Todas a la derecha' }).click()
    await expect(tool.getByText(LOCKED)).toHaveCount(0)
    const rotated = await runAndDownload(page, tool)
    expect(rotated.getPageCount()).toBe(2)
    expect(rotated.getPage(0).getRotation().angle).toBe(90)

    // Dividir: se abre y muestra sus páginas.
    tool = await open(page, '/dividir-pdf', [file])
    await expect(tool.getByText('2 páginas', { exact: false }).first()).toBeVisible()
    await expect(tool.getByText(LOCKED)).toHaveCount(0)

    // Proteger: no pide una "contraseña actual" que no existe.
    tool = await open(page, '/proteger-pdf', [file])
    await expect(tool.locator('input[type=password]')).toHaveCount(2)
    await expect(tool.getByText(LOCKED)).toHaveCount(0)

    // Firmar: llega a dibujar la firma.
    tool = await open(page, '/firmar-pdf', [file])
    await expect(tool.locator('.sign-pad')).toBeVisible()
    await expect(tool.getByText(LOCKED)).toHaveCount(0)

    // Llenar formulario: encuentra el campo.
    tool = await open(page, '/llenar-formulario-pdf', [file])
    await expect(tool.locator('.file-item')).toContainText('1 campo')
    await expect(tool.getByText(LOCKED)).toHaveCount(0)
  })
}
