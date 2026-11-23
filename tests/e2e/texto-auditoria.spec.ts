// Auditoría W-146.12 (Texto): contador exacto con nivel de lectura y límites, comparar lado a
// lado y con archivos, frase de contraseña y resumen de listas, encabezados y PDF escaneados.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { expect, test } from './helpers'

test('contador: enlaces, correos y guiones cuentan como una palabra; nivel de lectura y límites @movil', async ({ page }) => {
  await page.goto('/contador-de-palabras')
  const tool = page.locator('#tool')
  const stat = (label: string) => tool.locator('.txt-stats > div', { has: page.getByText(label, { exact: true }) }).locator('dd')
  await tool.getByLabel('Escribe o pega tu texto').fill('El Sr. Pérez visitó https://docusmart.online/app/ y escribió a soporte@docusmart.online sobre el bien-estar.')
  // El, Sr, Pérez, visitó, [enlace], y, escribió, a, [correo], sobre, el, bien-estar = 12
  await expect(stat('Palabras')).toHaveText('12')
  await expect(stat('Frases')).toHaveText('1')
  await expect(tool.getByTestId('readability')).toHaveCount(0)

  await tool.getByLabel('Escribe o pega tu texto').fill('El sol sale. La casa es azul. Mi gato come pan. El perro juega en el patio. Hoy hace calor. Vamos a la playa con mi hermano.')
  await expect(tool.getByTestId('readability')).toContainText(/\d+ de 100 · (muy fácil|fácil)/)
  await expect(tool.getByTestId('readability')).toContainText('Fernández Huerta')
  const limits = tool.getByTestId('char-limits')
  await expect(limits.locator('li', { hasText: 'X (Twitter)' })).toContainText('/ 280')
  await expect(limits.locator('li', { hasText: 'Título en Google' })).toContainText('Sobran')
  await expect(limits.locator('li', { hasText: 'X (Twitter)' })).not.toContainText('Sobran')
})

async function pdfWith(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const p = doc.addPage([595, 842])
  lines.forEach((l, i) => p.drawText(l, { x: 40, y: 780 - i * 20, size: 11, font }))
  return Buffer.from(await doc.save())
}

test('comparar: lado a lado, ignorar tildes, letra que cambió y abrir un PDF', async ({ page }) => {
  await page.goto('/comparar-textos')
  const tool = page.locator('#tool')
  // El original se abre desde un PDF (antes solo .txt).
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: await pdfWith(['Contrato de arriendo', 'El canon es de un millon al mes.', 'El plazo es de un ano.']) })
  await expect(tool.getByLabel('Texto original')).toHaveValue(/Contrato de arriendo[\s\S]*plazo es de un ano/)
  await tool.getByLabel('Texto modificado').fill('Contrato de arriendo\nEl canon es de un millon al mes.\nEl plazo es de dos anos.\nSe permite una mascota.')
  await tool.getByRole('button', { name: 'Comparar textos' }).click()
  // Solo la "s" de "anos" queda marcada como agregada dentro de la palabra.
  await expect(tool.locator('.txt-diff ins', { hasText: /^s$/ })).toHaveCount(1)
  await tool.getByRole('button', { name: 'Lado a lado' }).click()
  const rows = tool.locator('.txt-side-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).not.toHaveClass(/is-changed/)
  await expect(rows.nth(2)).toHaveClass(/is-changed/)
  await expect(rows.nth(3).locator('.txt-side-cell').first()).toHaveClass(/is-empty/)
  await expect(rows.nth(3)).toContainText('Se permite una mascota.')

  // Con "Ignorar tildes", "Canción" y "Cancion" son iguales.
  await tool.getByLabel('Texto original').fill('La Canción del árbol')
  await tool.getByLabel('Texto modificado').fill('La Cancion del arbol')
  await tool.getByLabel('Ignorar tildes').check()
  await tool.getByRole('button', { name: 'Comparar textos' }).click()
  await expect(tool.getByText('Los dos textos son iguales.')).toBeVisible()
})

test('contraseñas: frase fácil de recordar, 128 caracteres y excluir @movil', async ({ page }) => {
  await page.goto('/generador-de-contrasenas')
  const tool = page.locator('#tool')
  const out = tool.getByLabel('Generador de contraseñas')
  await tool.getByLabel('Excluir caracteres (los que un sitio no acepta)').fill('!@#$%&*-_=+?.:;,~^()[]{}')
  await tool.getByRole('slider').fill('128')
  await expect(out).toHaveText(/^[A-Za-z0-9]{128}$/)

  await tool.getByRole('button', { name: 'Frase fácil de recordar' }).click()
  // 6 palabras con mayúscula, separadas por guion, y una cifra.
  await expect(out).toHaveText(/^([A-Z][a-z]+\d?-){5}[A-Z][a-z]+\d?$/)
  await expect(tool.getByText(/^Fuerza: fuerte/)).toBeVisible()
  await tool.getByRole('button', { name: 'Espacio' }).click()
  await tool.getByRole('slider').fill('3')
  await expect(out).toHaveText(/^([A-Z][a-z]+\d? ){2}[A-Z][a-z]+\d?$/)
  await tool.getByRole('button', { name: 'English' }).click()
  await expect(tool.getByText(/de una lista de 1\.?2\d\d/)).toBeVisible()
})

/** PDF de 3 páginas con encabezado y número de página repetidos, y una lista con viñetas. */
async function reportPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const body = [
    'La energia solar es una fuente renovable que aprovecha la radiacion del sol.',
    'Los paneles solares convierten la radiacion en electricidad limpia y barata.',
    'Las baterias guardan la energia solar para usarla durante la noche.',
    'Muchos paises instalan parques de energia solar para reducir emisiones.',
    '- paneles solares en los techos de las casas',
    '- baterias de litio para la noche',
    '- parques solares en zonas desiertas',
  ]
  for (let n = 1; n <= 3; n++) {
    const p = doc.addPage([595, 842])
    p.drawText('INFORME CONFIDENCIAL DE ENERGIA', { x: 40, y: 800, size: 10, font })
    body.forEach((l, i) => p.drawText(l, { x: 40, y: 760 - i * 20, size: 11, font }))
    p.drawText(`Pagina ${n} de 3`, { x: 260, y: 30, size: 10, font })
  }
  return Buffer.from(await doc.save())
}

test('resumir: sin encabezados repetidos, viñetas como oraciones y formato en párrafos', async ({ page }) => {
  await page.goto('/resumir-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'informe.pdf', mimeType: 'application/pdf', buffer: await reportPdf() })
  await tool.getByRole('button', { name: 'Largo' }).click()
  await tool.getByRole('button', { name: 'Resumir', exact: true }).click()
  await expect(tool.getByRole('heading', { name: 'Resumen' })).toBeVisible({ timeout: 30_000 })
  const list = tool.locator('.sum-list')
  await expect(list).not.toContainText('INFORME CONFIDENCIAL')
  await expect(list).not.toContainText('Pagina')
  // Ninguna oración junta varias viñetas.
  for (const li of await list.locator('li').all()) expect((await li.textContent())!.length).toBeLessThan(120)

  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.txt' }).click()
  expect(await readFile((await (await wait).path())!, 'utf8')).toMatch(/^• /)
  await tool.getByRole('button', { name: 'Párrafos' }).click()
  await expect(list).toHaveCount(0)
})

async function scannedPdf(page: Page): Promise<Buffer> {
  const lines = ['LA ENERGIA SOLAR ES LIMPIA', 'LOS PANELES DAN ELECTRICIDAD', 'LAS BATERIAS GUARDAN ENERGIA', 'EL SOL SALE TODOS LOS DIAS', 'LA FACTURA DE LUZ BAJA MUCHO', 'MUCHAS CASAS USAN PANELES']
  const b64 = await page.evaluate(async (ls) => {
    const c = new OffscreenCanvas(1400, 1000)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1400, 1000)
    ctx.fillStyle = '#000'
    ctx.font = '56px Arial, sans-serif'
    ls.forEach((l, i) => ctx.fillText(l + '.', 60, 120 + i * 120))
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  }, lines)
  const doc = await PDFDocument.create()
  const img = await doc.embedPng(Buffer.from(b64, 'base64'))
  doc.addPage([595, 842]).drawImage(img, { x: 0, y: 842 - 425, width: 595, height: 425 })
  return Buffer.from(await doc.save())
}

test('resumir un PDF escaneado: reconoce el texto y resume en el mismo paso', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/resumir-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'escaneo.pdf', mimeType: 'application/pdf', buffer: await scannedPdf(page) })
  await tool.getByRole('button', { name: 'Resumir', exact: true }).click()
  await tool.getByRole('button', { name: 'Reconocer y resumir' }).click()
  await expect(tool.getByRole('heading', { name: 'Resumen' })).toBeVisible({ timeout: 200_000 })
  await expect(tool.locator('.sum-list')).toContainText(/ENERGIA|PANELES|BATERIAS/i)
})
