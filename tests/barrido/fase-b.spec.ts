// Barrido, fase B: cada herramienta hace su trabajo de verdad, en escritorio y celular, con un PDF
// "difícil" (página girada, página horizontal, imagen y campo de formulario) o la muestra que le
// toque. Se procesa, se descarga y se valida el resultado según su tipo (que el PDF abra y tenga
// páginas, que la imagen tenga la firma de su formato, que el ZIP se abra…). Anota sin cortar el
// barrido; el informe queda en test-results/barrido-b/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { Locator, Page } from '@playwright/test'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { unzipSync } from 'fflate'
import { pages } from '../../tools/pages.mjs'
import { sniff } from '../../src/shared/files/sniff'
import { test } from '../e2e/helpers'
import { muestraPara, type Muestra } from './muestras'

test.use({ allowConsoleErrors: true })

const OUT = 'test-results/barrido-b'
mkdirSync(`${OUT}/capturas`, { recursive: true })

/** Herramientas que se prueban aparte (modelos de IA de decenas de MB, cámara o solo texto). */
const APARTE: Record<string, string> = {
  'quitar-fondo': 'modelo de IA de 86 MB: tiene su prueba E2E propia',
  'foto-tamano-documento': 'modelo de IA de 86 MB: tiene su prueba E2E propia',
  'audio-a-texto': 'modelo Whisper de 77 MB: se revisa aparte (W-133)',
  'cuenta-de-cobro': 'formulario sin archivo: tiene sus pruebas E2E',
  'hoja-de-vida': 'formulario sin archivo: tiene sus pruebas E2E',
  'contador-de-palabras': 'solo texto: tiene sus pruebas E2E',
  'comparar-textos': 'solo texto: tiene sus pruebas E2E',
  'generador-de-contrasenas': 'solo texto: tiene sus pruebas E2E',
  'calcular-hash': 'muestra el resultado en pantalla: tiene sus pruebas E2E',
  'resumir-pdf': 'muestra el resultado en pantalla: tiene sus pruebas E2E',
}

const primary = (host: Locator) => host.locator('.btn-primary:not([disabled])').last()
const byName = (host: Locator, name: string | RegExp) => host.getByRole('button', { name, exact: typeof name === 'string' })

/** Preparación propia de cada herramienta antes de procesar (lo que haría una persona). */
const PREP: Record<string, (page: Page, host: Locator) => Promise<void>> = {
  'rotar-pdf': async (_p, h) => byName(h, 'Todas a la derecha').click(),
  'dividir-pdf': async (_p, h) => h.locator('button.thumb').nth(1).click(),
  'ordenar-paginas-pdf': async (_p, h) => h.locator('.thumb').first().locator('.thumb-actions button').nth(1).click(),
  'proteger-pdf': async (_p, h) => {
    const pw = h.locator('input[type=password]')
    await pw.first().waitFor()
    for (let i = 0; i < (await pw.count()); i++) await pw.nth(i).fill('clave de prueba')
  },
  'firmar-pdf': async (page, h) => {
    const pad = h.locator('.sign-pad')
    await pad.scrollIntoViewIfNeeded()
    const b = (await pad.boundingBox())!
    await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.6)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) await page.mouse.move(b.x + b.width * (0.2 + i * 0.025), b.y + b.height * (0.6 - Math.sin(i / 3) * 0.2))
    await page.mouse.up()
    await primary(h).click()
    await h.locator('.sign-stage').first().waitFor()
  },
  'editar-pdf': async (page, h) => {
    const img = h.getByRole('img', { name: 'Página 1' })
    await img.scrollIntoViewIfNeeded()
    const b = (await img.boundingBox())!
    await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.5)
    await h.locator('textarea').fill('Revisado')
  },
  'censurar-pdf': async (_p, h) => {
    await h.locator('button.btn-sm').filter({ hasText: '(' }).first().click()
    await h.page().waitForTimeout(1500)
  },
  'llenar-formulario-pdf': async (_p, h) => h.getByRole('textbox').first().fill('Ana Prueba'),
  'rotar-imagen': async (_p, h) => byName(h, 'Derecha').click(),
  'ajustar-imagen': async (_p, h) => h.getByText('Mejora automática', { exact: false }).first().click(),
  'marca-de-agua-imagen': async (_p, h) => h.getByLabel('Texto de la marca').fill('COPIA'),
  'escanear-documento': async (_p, h) => {
    await byName(h, 'Listo').click() // bordes detectados
    await h.page().waitForTimeout(1500)
  },
  'recortar-pdf': async (_p, h) => {
    await h.getByRole('slider', { name: 'Borde superior' }).focus()
    await h.page().keyboard.press('ArrowRight')
    await h.page().keyboard.press('ArrowRight')
  },
  'comparar-pdf': async (_p, h) => {
    const segunda = (await muestraPara('dividir-pdf', h.page()))!
    await h.locator('input[type=file]').first().setInputFiles(segunda)
  },
}

/** Antes de subir el archivo (elegir el modo, por ejemplo). */
const ANTES: Record<string, (page: Page, host: Locator) => Promise<void>> = {
  'leer-codigo-qr': async (_p, h) => byName(h, 'Desde imagen').click(),
}
/** Selector de archivos a usar (si no es el primero). */
const INPUT: Record<string, number> = { 'escanear-documento': 1 }
/** Herramientas sin archivo: lo que se hace en vez de subirlo. */
const SIN_ARCHIVO: Record<string, (page: Page, host: Locator) => Promise<void>> = {
  'crear-codigo-qr': async (page, h) => {
    await page.getByPlaceholder('https://docusmart.online').first().fill('https://docusmart.online/guias')
    await byName(h, 'Generar QR').click()
  },
}

/** Valida el archivo descargado según su extensión; devuelve un problema o null. */
async function validar(name: string, bytes: Buffer): Promise<string | null> {
  if (!bytes.length) return 'archivo vacío'
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  const head = new Uint8Array(bytes.subarray(0, 1024))
  try {
    if (ext === 'pdf') {
      // pdf.js (como un lector) abre también los cifrados, con la contraseña de la prueba.
      const task = getDocument({ data: new Uint8Array(bytes), password: 'clave de prueba' })
      const doc = await task.promise
      const n = doc.numPages
      await task.destroy()
      return n > 0 ? null : 'PDF sin páginas'
    }
    const img: Record<string, string> = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp', gif: 'gif', avif: 'avif', tif: 'tiff', tiff: 'tiff', bmp: 'bmp', svg: 'svg' }
    if (img[ext]) return sniff(head) === img[ext] ? null : `la imagen .${ext} no tiene la firma de su formato (${sniff(head)})`
    if (ext === 'ico') return bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 ? null : 'ICO sin la firma de su formato'
    if (['zip', 'docx', 'xlsx', 'pptx'].includes(ext)) {
      const files = Object.keys(unzipSync(new Uint8Array(bytes)))
      const main: Record<string, string> = { docx: 'word/document.xml', xlsx: 'xl/workbook.xml', pptx: 'ppt/presentation.xml' }
      if (main[ext] && !files.includes(main[ext])) return `al .${ext} le falta ${main[ext]}`
      return files.length ? null : 'ZIP vacío'
    }
    if (['txt', 'csv', 'srt', 'vtt'].includes(ext)) return bytes.toString('utf8').trim() ? null : 'texto vacío'
    if (['mp3', 'mp4', 'webm', 'm4a', 'ogg', 'wav', 'mov'].includes(ext)) return bytes.length > 1000 ? null : 'audio/video demasiado chico'
    return null
  } catch (e) {
    return `no se pudo abrir: ${e instanceof Error ? e.message.slice(0, 120) : e}`
  }
}

/** Botón que descarga el resultado (el primero que diga Descargar, o el de .txt). */
async function botonDescarga(host: Locator): Promise<Locator | null> {
  for (const name of [/^Descargar$/, /^Descargar/, /\.txt$/, /^Guardar/]) {
    const b = host.getByRole('button', { name }).first()
    if (await b.isVisible().catch(() => false)) return b
  }
  return null
}

for (const tool of pages) {
  test(`B · ${tool.slug}`, async ({ page, consoleErrors }, info) => {
    test.setTimeout(240_000)
    const result: Record<string, unknown> = { slug: tool.slug, proyecto: info.project.name }
    const save = () => writeFileSync(`${OUT}/${info.project.name}-${tool.slug}.json`, JSON.stringify(result, null, 1))
    if (APARTE[tool.slug]) {
      result.aparte = APARTE[tool.slug]
      return save()
    }
    await page.goto(`/${tool.slug}`)
    const host = page.locator('#tool')
    await host.waitFor()
    let files: Muestra[] | null = await muestraPara(tool.slug, page)
    if (tool.slug === 'desbloquear-pdf') files = [{ name: 'extracto.pdf', mimeType: 'application/pdf', buffer: readFileSync('tests/fixtures/pdf/solo-restricciones.pdf') }]
    const started = Date.now()
    try {
      if (ANTES[tool.slug]) await ANTES[tool.slug](page, host)
      if (files && !SIN_ARCHIVO[tool.slug]) await host.locator('input[type=file]').nth(INPUT[tool.slug] ?? 0).setInputFiles(files)
      await page.waitForTimeout(2500)
      if (PREP[tool.slug]) await PREP[tool.slug](page, host)
      if (SIN_ARCHIVO[tool.slug]) {
        result.boton = 'Generar QR'
        await SIN_ARCHIVO[tool.slug](page, host)
      } else if (tool.slug !== 'leer-codigo-qr') {
        const go = primary(host)
        await go.waitFor({ timeout: 20_000 })
        result.boton = (await go.innerText()).trim()
        await go.click()
      }
      if (tool.slug === 'leer-codigo-qr') {
        // Lee el QR de la imagen sola: basta con que muestre el resultado o diga que no hay QR.
        const out = (await host.innerText()).replace(/\s+/g, ' ')
        result.ok = true
        result.texto = out.slice(0, 200)
        throw new Error('__fin__')
      }
      if (tool.slug === 'comparar-pdf') {
        await host.locator('.compare-hunks, .notice-success').first().waitFor({ timeout: 90_000 })
        result.ok = true
      } else {
        // Espera el botón de descarga (o un error visible).
        const deadline = Date.now() + 150_000
        let dl: Locator | null = null
        while (!dl && Date.now() < deadline) {
          dl = await botonDescarga(host)
          // Sin esperar: innerText de un elemento que no existe esperaría para siempre.
          const alert = host.locator('.notice-error, [role="alert"]').first()
          const err = (await alert.count()) ? await alert.innerText({ timeout: 2000 }).catch(() => '') : ''
          if (!dl && err) throw new Error(`mensaje de error: ${err.slice(0, 200)}`)
          if (!dl) await page.waitForTimeout(800)
        }
        if (!dl) throw new Error('no apareció el botón de descarga')
        const wait = page.waitForEvent('download', { timeout: 30_000 })
        await dl.click({ timeout: 15_000 })
        const d = await wait
        const name = d.suggestedFilename()
        const bytes = readFileSync((await d.path())!)
        result.descarga = { name, bytes: bytes.length }
        result.problema = await validar(name, bytes)
        result.ok = !result.problema
      }
    } catch (e) {
      if (e instanceof Error && e.message === '__fin__') {
        result.segundos = Math.round((Date.now() - started) / 1000)
        return save()
      }
      result.ok = false
      result.fallo = e instanceof Error ? e.message.split('\n')[0].slice(0, 300) : String(e)
    }
    result.segundos = Math.round((Date.now() - started) / 1000)
    result.errores = consoleErrors.filter((e) => !/favicon/.test(e))
    await host.screenshot({ path: `${OUT}/capturas/${info.project.name}-${tool.slug}.png` }).catch(() => undefined)
    save()
  })
}
