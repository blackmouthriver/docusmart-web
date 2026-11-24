// Capturas de las guías (W-99) y dónde se muestran (W-100).
//
// SHOTS: qué pasos de cada herramienta se capturan (scripts/screenshots.mjs los recorre en orden
// y guarda public/img/guides/<idioma>/<herramienta>/<paso>-<ancho>.webp). Los pasos no buscan
// botones por su texto, así sirven en los 12 idiomas. Dónde va cada captura en las guías está en
// tools/guide-images.mjs.

export const SHOT_WIDTHS = { escritorio: 1280, movil: 390 }

const upload = (host, list) => host.locator('input[type=file]').first().setInputFiles(list)
const pdf = (name, buffer) => ({ name, mimeType: 'application/pdf', buffer })
const jpg = (name, buffer) => ({ name, mimeType: 'image/jpeg', buffer })
const primary = (host) => host.locator('.btn-primary:not([disabled])').last()
/** Pulsa el botón principal y espera el resultado (el "Después" deja de estar vacío). */
async function runAndWait(host) {
  await primary(host).click()
  await host.locator('.doc-placeholder').waitFor({ state: 'detached', timeout: 60_000 })
  await host.locator('.compare-panel canvas, .compare-panel img').last().waitFor()
  await host.page().waitForTimeout(800)
}
const panel = (host) => host.locator('.compare-panel')

/** Una firma a mano alzada (bucles que avanzan, como una letra cursiva), dibujada con el mouse. */
async function drawSignature(page, pad) {
  await pad.scrollIntoViewIfNeeded()
  const b = await pad.boundingBox()
  const x0 = b.x + b.width * 0.18
  const y0 = b.y + b.height * 0.55
  const r = Math.min(b.height * 0.2, 28)
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  for (let i = 1; i <= 90; i++) {
    const t = (i / 90) * Math.PI * 9
    const x = x0 + (b.width * 0.5 * i) / 90 - r * 0.9 * Math.sin(t)
    const y = y0 - r * (1 - Math.cos(t)) * (i < 30 ? 1.4 : 0.8) + (b.height * 0.06 * i) / 90
    await page.mouse.move(x, y)
  }
  await page.mouse.up()
}

export const SHOTS = [
  {
    tool: 'unir-pdf',
    steps: [
      {
        id: 'lista',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.pdfs[0]), pdf('recibo.pdf', files.pdfs[1]), pdf('formulario.pdf', files.pdfs[2])])
          await host.locator('.file-item').nth(2).waitFor()
          await host.locator('.compare-panel img, .compare-panel canvas').nth(2).waitFor()
        },
        maxHeight: 640,
      },
      { id: 'resultado', run: async ({ host }) => runAndWait(host), target: panel, maxHeight: { escritorio: 660, movil: 540 } },
    ],
  },
  {
    tool: 'imagen-a-pdf',
    steps: [
      {
        id: 'fotos',
        run: async ({ host, files }) => {
          await upload(host, [jpg('foto-1.jpg', files.photos[0]), jpg('foto-2.jpg', files.photos[1])])
          await host.locator('img').nth(1).waitFor()
        },
        maxHeight: { escritorio: 760, movil: 770 },
      },
    ],
  },
  {
    tool: 'comprimir-pdf',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('escaneo.pdf', files.scanned)])
          await host.locator('.file-item').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 660, movil: 560 },
      },
    ],
  },
  {
    tool: 'proteger-pdf',
    steps: [
      {
        id: 'clave',
        run: async ({ host, files }) => {
          await upload(host, [pdf('documento.pdf', files.pdfs[2])])
          const fields = host.locator('input[type=password]')
          await fields.first().waitFor()
          for (let i = 0; i < (await fields.count()); i++) await fields.nth(i).fill('muestra de guía')
          await fields.last().blur()
          // La vista previa no aporta aquí: se ven las pestañas, las contraseñas y los permisos.
          await host.locator('.compare-panel').evaluate((el) => (el.style.display = 'none'))
        },
      },
    ],
  },
  {
    tool: 'escanear-documento',
    steps: [
      {
        id: 'bordes',
        run: async ({ host, files }) => {
          await upload(host, [jpg('foto.jpg', files.photos[0])])
          await host.locator('.card').first().locator('img, canvas').first().waitFor()
        },
        target: (host) => host.locator('.card').first(),
      },
    ],
  },
  {
    tool: 'firmar-pdf',
    steps: [
      {
        id: 'firma',
        run: async ({ page, host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.pdfs[0])])
          await drawSignature(page, host.locator('.sign-pad'))
        },
      },
      {
        id: 'colocar',
        run: async ({ host }) => {
          await primary(host).click()
          await host.locator('.sign-stage img, .sign-stage canvas').first().waitFor()
        },
        target: (host) => host.locator('.card').nth(1),
        maxHeight: { escritorio: 760, movil: 900 },
      },
    ],
  },
]

