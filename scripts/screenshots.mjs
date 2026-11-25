// Capturas de las guías (W-99): abre cada herramienta del sitio ya compilado con archivos de
// muestra (PDF y fotos generados aquí: nunca documentos reales) y guarda sus pasos clave en
// public/img/guides/<idioma>/<herramienta>/<paso>-<ancho>.webp, en los 12 idiomas, a 1280 px
// (escritorio) y 390 px (celular), en tema claro y sin anuncios ni avisos encima.
//
// Uso (después de `npm run build`):
//   node scripts/screenshots.mjs                       todas
//   node scripts/screenshots.mjs unir-pdf es,en        solo esa herramienta e idiomas
//
// Escribe también tools/guide-shots.json con el tamaño de cada captura (el generador de páginas
// lo usa para poner width/height y no mover la página al cargar).
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { LANGS, pagePath } from '../tools/locales/index.mjs'
import { pages } from '../tools/pages.mjs'
import { SHOT_WIDTHS, SHOTS } from '../tools/guide-shots.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public', 'img', 'guides')
const MANIFEST = join(root, 'tools', 'guide-shots.json')
const PORT = 5493
const BASE = `http://localhost:${PORT}`
const MAX_BYTES = 80 * 1024

/* ───────────── Archivos de muestra ───────────── */

/** PDF de muestra: páginas A4 con un encabezado de color y renglones grises (sin texto real). */
async function samplePdf(pageCount, hue) {
  const doc = await PDFDocument.create()
  const colors = [rgb(0.15, 0.39, 0.92), rgb(0.06, 0.6, 0.5), rgb(0.85, 0.35, 0.2)]
  for (let p = 0; p < pageCount; p++) {
    const page = doc.addPage([595, 842])
    page.drawRectangle({ x: 56, y: 760, width: 140, height: 26, color: colors[hue % colors.length] })
    page.drawRectangle({ x: 56, y: 730, width: 300, height: 10, color: rgb(0.55, 0.58, 0.63) })
    let y = 690
    for (let line = 0; line < 22; line++) {
      const w = line % 6 === 5 ? 220 : 483 - ((line * 37) % 60)
      page.drawRectangle({ x: 56, y, width: w, height: 7, color: rgb(0.78, 0.8, 0.84) })
      y -= line % 6 === 5 ? 34 : 22
    }
    page.drawRectangle({ x: 280, y: 40, width: 35, height: 7, color: rgb(0.78, 0.8, 0.84) })
  }
  return Buffer.from(await doc.save())
}

/** Foto de muestra: una hoja algo girada sobre una mesa, como la toma un celular. */
async function samplePhoto(page, tilt) {
  const b64 = await page.evaluate((tilt) => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 1600
    const g = c.getContext('2d')
    const wood = g.createLinearGradient(0, 0, 1200, 1600)
    wood.addColorStop(0, '#6b4a2f')
    wood.addColorStop(1, '#8a6240')
    g.fillStyle = wood
    g.fillRect(0, 0, 1200, 1600)
    g.translate(600, 800)
    g.rotate(tilt)
    g.shadowColor = 'rgba(0,0,0,.45)'
    g.shadowBlur = 40
    g.fillStyle = '#fbfbf8'
    g.fillRect(-430, -600, 860, 1200)
    g.shadowBlur = 0
    g.fillStyle = '#2563eb'
    g.fillRect(-370, -540, 220, 40)
    g.fillStyle = '#8c939f'
    g.fillRect(-370, -470, 420, 16)
    g.fillStyle = '#c8ccd4'
    for (let i = 0; i < 24; i++) g.fillRect(-370, -410 + i * 40, i % 6 === 5 ? 380 : 740 - ((i * 37) % 80), 12)
    return c.toDataURL('image/jpeg', 0.97).split(',')[1]
  }, tilt)
  return Buffer.from(b64, 'base64')
}

/** PDF con una foto grande adentro (para que comprimir muestre una reducción real). */
async function photoPdf(photo) {
  const doc = await PDFDocument.create()
  const img = await doc.embedJpg(photo)
  const page = doc.addPage([595, 842])
  page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 })
  return Buffer.from(await doc.save())
}

/**
 * Contrato de muestra con texto de verdad (para comparar y censurar). Todo es inventado: nombres,
 * número de documento y valores. `version` 2 cambia el canon, la fecha y suma una cláusula.
 */
async function contractPdf(version) {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const lines = [
    ['CONTRATO DE ARRENDAMIENTO DE VIVIENDA', bold, 15],
    ['', regular, 11],
    ['Arrendador: Ana María Ejemplo, documento 1.023.456.789.', regular, 11],
    ['Arrendatario: Luis Prueba Gómez, documento 79.654.321.', regular, 11],
    ['Inmueble: apartamento 302, Calle 10 # 20-30.', regular, 11],
    ['', regular, 11],
    ['PRIMERA. Duración: doce (12) meses desde el 1 de febrero de 2026.', regular, 11],
    [version === 1 ? 'SEGUNDA. Canon mensual: un millón doscientos mil pesos ($1.200.000).' : 'SEGUNDA. Canon mensual: un millón trescientos mil pesos ($1.300.000).', regular, 11],
    ['TERCERA. El pago se hará dentro de los primeros cinco días de cada mes.', regular, 11],
    [version === 1 ? 'CUARTA. Servicios públicos a cargo del arrendatario.' : 'CUARTA. Servicios públicos y administración a cargo del arrendatario.', regular, 11],
    ...(version === 2 ? [['QUINTA. Se permite una mascota pequeña.', regular, 11]] : []),
    ['', regular, 11],
    [`Firmado en Bogotá el ${version === 1 ? '15' : '20'} de enero de 2026.`, regular, 11],
  ]
  const page = doc.addPage([595, 842])
  let y = 770
  for (const [text, font, size] of lines) {
    if (text) page.drawText(text, { x: 60, y, size, font, color: rgb(0.1, 0.1, 0.12) })
    y -= size + 12
  }
  for (let p = 2; p <= 2; p++) doc.addPage([595, 842]).drawText(`Página ${p}: anexos del contrato.`, { x: 60, y: 770, size: 11, font: regular })
  return Buffer.from(await doc.save())
}

/* ───────────── Servidor y navegador ───────────── */

function startPreview() {
  // Node directo (sin shell), así al terminar se cierra el servidor y no queda ocupando el puerto.
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' })
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('vite preview no arrancó')), 30_000)
    child.stdout.on('data', (d) => {
      if (String(d).includes(String(PORT))) {
        clearTimeout(timer)
        resolve(child)
      }
    })
    child.on('exit', (code) => reject(new Error(`vite preview terminó (${code})`)))
  })
}

/** Lo que no debe salir en una captura: asistente, aviso de cookies, anuncios y animaciones. */
const HIDE = `
  .assistant-root, .ds-consent, .ds-ad, ins.adsbygoogle, [data-ad-slot], .toast-wrap { display: none !important; }
  .tp-nav { position: static !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
`

/** PNG → WebP de hasta 80 KB (bajando la calidad si hace falta), con el navegador. */
async function toWebp(page, png) {
  return page.evaluate(
    async ({ b64, max }) => {
      const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
      const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
      const c = document.createElement('canvas')
      c.width = bmp.width
      c.height = bmp.height
      c.getContext('2d').drawImage(bmp, 0, 0)
      let out = null
      for (const q of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32]) {
        out = await new Promise((r) => c.toBlob(r, 'image/webp', q))
        if (out.size <= max) break
      }
      const buf = new Uint8Array(await out.arrayBuffer())
      let s = ''
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
      return { b64: btoa(s), width: c.width, height: c.height, size: out.size }
    },
    { b64: png.toString('base64'), max: MAX_BYTES },
  )
}

/* ───────────── Captura ───────────── */

/** Alto máximo de una captura, en píxeles CSS (las más largas se cortan abajo). */
const MAX_HEIGHT = 1100
/** `maxHeight` de un paso: un número o uno por ancho ({ escritorio, movil }). */
const heightFor = (h, w) => (typeof h === 'object' ? (h[w] ?? MAX_HEIGHT) : (h ?? MAX_HEIGHT))

/** Captura de un elemento, cortada a `maxHeight` si es muy alto. */
async function capture(page, target, maxHeight) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('el elemento a capturar no se ve')
  if (box.height <= maxHeight) return target.screenshot({ animations: 'disabled' })
  const scrollY = await page.evaluate(() => window.scrollY)
  return page.screenshot({ animations: 'disabled', fullPage: true, clip: { x: box.x, y: box.y + scrollY, width: box.width, height: maxHeight } })
}

const [onlyTool, onlyLangs] = process.argv.slice(2)
const langs = LANGS.filter((l) => !onlyLangs || onlyLangs.split(',').includes(l.lang))
// Herramientas separadas por comas (o todas).
const shots = SHOTS.filter((s) => !onlyTool || onlyTool.split(',').includes(s.tool))

/** Tamaños ya guardados (si todavía no hay, se empieza de cero). */
function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'))
  } catch {
    return {}
  }
}
const manifest = readManifest()
const server = await startPreview()
// En CI, el Chromium de Playwright; en un equipo, el Chrome instalado (como las pruebas).
const browser = await chromium.launch(process.env.CI ? {} : { channel: 'chrome' })
let failures = 0
try {
  const helper = await browser.newPage()
  const photos = [await samplePhoto(helper, -0.06), await samplePhoto(helper, 0.04)]
  const files = {
    pdfs: [await samplePdf(3, 0), await samplePdf(1, 1), await samplePdf(2, 2)],
    photos,
    scanned: await photoPdf(photos[1]),
    contract: [await contractPdf(1), await contractPdf(2)],
  }
  for (const [w, width] of Object.entries(SHOT_WIDTHS)) {
    const context = await browser.newContext({
      viewport: { width, height: w === 'movil' ? 844 : 900 },
      deviceScaleFactor: w === 'movil' ? 2 : 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })
    await context.addInitScript(() => {
      try {
        localStorage.setItem('ds-consent', 'denied')
        localStorage.setItem('ds-consent-scope', 'ads')
        sessionStorage.setItem('ds-assistant-seen', '1')
      } catch {
        /* sin almacenamiento */
      }
    })
    for (const loc of langs) {
      for (const shot of shots) {
        const tool = pages.find((p) => p.slug === shot.tool)
        const page = await context.newPage()
        try {
          await page.goto(BASE + pagePath(tool, loc))
          await page.addStyleTag({ content: HIDE })
          const host = page.locator('#tool')
          await host.locator('input[type=file]').first().waitFor({ state: 'attached' })
          // Cada paso de la herramienta, en orden; se captura el que corresponde.
          for (const step of shot.steps) {
            await step.run({ page, host, files, lang: loc.lang })
            await page.waitForTimeout(400)
            const name = `${loc.lang}/${shot.tool}/${step.id}-${width}`
            const png = await capture(page, step.target ? step.target(host) : host, heightFor(step.maxHeight, w))
            const webp = await toWebp(helper, png)
            const file = join(OUT, `${name}.webp`)
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, Buffer.from(webp.b64, 'base64'))
            manifest[name] = [webp.width, webp.height]
            console.log(`${name}  ${webp.width}×${webp.height}  ${Math.round(webp.size / 1024)} KB`)
          }
        } catch (e) {
          failures++
          console.error(`✗ ${loc.lang} ${shot.tool} (${w}): ${e instanceof Error ? e.message.split('\n')[0] : e}`)
        } finally {
          await page.close()
        }
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
  server.kill()
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + '\n')
}
if (failures) {
  console.error(`${failures} capturas fallaron`)
  process.exit(1)
}
