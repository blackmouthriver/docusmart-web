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

/** La tarjeta de Crear QR (la de al lado, Leer QR, también tiene un botón principal). */
const qrCard = (host) => host.locator('input[type=url]').first().locator('xpath=ancestor::*[contains(@class,"card")][1]')

const pdfButton = (host, name) => host.getByRole('button', { name, exact: true })

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
  // ── Lote 1 de guías por herramienta (W-101) ──
  {
    tool: 'dividir-pdf',
    steps: [
      {
        id: 'elegir',
        run: async ({ host, files }) => {
          await upload(host, [pdf('informe.pdf', files.pdfs[0])])
          await host.locator('img').nth(2).waitFor()
          // Se eligen las páginas 2 y 3 tocándolas (el número de página no depende del idioma).
          const thumbs = host.locator('button.thumb')
          await thumbs.nth(1).click()
          await thumbs.nth(2).click()
        },
        maxHeight: { escritorio: 760, movil: 1000 },
      },
      { id: 'resultado', run: async ({ host }) => runAndWait(host), target: panel, maxHeight: { escritorio: 660, movil: 560 } },
    ],
  },
  {
    tool: 'rotar-pdf',
    steps: [
      {
        id: 'paginas',
        run: async ({ host, files }) => {
          await upload(host, [pdf('escaneo.pdf', files.pdfs[0])])
          await host.locator('img').nth(2).waitFor()
          // Gira la segunda página 90° (tocar la miniatura).
          await host.locator('.thumb-hit').nth(1).click()
        },
        maxHeight: { escritorio: 760, movil: 1000 },
      },
    ],
  },
  {
    tool: 'ordenar-paginas-pdf',
    steps: [
      {
        id: 'paginas',
        run: async ({ host, files }) => {
          await upload(host, [pdf('presentacion.pdf', files.pdfs[0])])
          await host.locator('img').nth(2).waitFor()
          // La página 1 pasa después de la 2 ("mover después" de la primera tarjeta): orden 2, 1, 3.
          await host.locator('.thumb').first().locator('.thumb-actions button').nth(1).click()
        },
        maxHeight: { escritorio: 760, movil: 1000 },
      },
    ],
  },
  {
    tool: 'numerar-paginas-pdf',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('tesis.pdf', files.pdfs[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          // "Página 1 de 10", tamaño grande, abajo a la derecha (los grupos van en ese orden).
          await host.getByRole('radio').nth(5).check()
          await host.locator('[role="group"]').nth(0).locator('button').nth(2).click()
          await host.locator('[role="group"]').nth(1).locator('button').nth(2).click()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 660, movil: 620 },
      },
    ],
  },
  {
    tool: 'marca-de-agua-pdf',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('propuesta.pdf', files.pdfs[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 660, movil: 620 },
      },
    ],
  },
  {
    tool: 'editar-pdf',
    steps: [
      {
        id: 'texto',
        run: async ({ page, host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0])])
          const stage = host.locator('img').first()
          await stage.waitFor()
          await stage.scrollIntoViewIfNeeded()
          const b = await stage.boundingBox()
          await page.mouse.click(b.x + b.width * 0.12, b.y + b.height * 0.47)
          // Se espera a que el cuadro de texto tenga el foco antes de escribir.
          await page.waitForFunction(() => ['TEXTAREA', 'INPUT'].includes(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable === true)
          await page.keyboard.type('Aprobado - 20/01/2026')
          await page.waitForTimeout(300)
        },
        maxHeight: { escritorio: 760, movil: 1000 },
      },
    ],
  },
  {
    tool: 'comparar-pdf',
    steps: [
      {
        id: 'diferencias',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato-v1.pdf', files.contract[0])])
          await host.locator('input[type=file]').first().setInputFiles([pdf('contrato-v2.pdf', files.contract[1])])
          await primary(host).click()
          await host.locator('.compare-hunks').waitFor({ timeout: 60_000 })
        },
        // La lista de cambios (con la leyenda de agregados y quitados), no el formulario.
        target: (host) => host.locator('.compare-hunks').locator('xpath=..'),
        maxHeight: { escritorio: 600, movil: 900 },
      },
    ],
  },
  {
    tool: 'censurar-pdf',
    steps: [
      {
        id: 'zonas',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0])])
          await host.locator('img').first().waitFor()
          // "Números (cédulas, teléfonos, cuentas)": el segundo botón de marcado rápido (en japonés y chino
          // el paréntesis es de ancho completo).
          await host.locator('button.btn-sm').filter({ hasText: /[(（]/ }).first().click()
          await host.page().waitForTimeout(1500)
        },
        maxHeight: { escritorio: 640, movil: 900 },
      },
    ],
  },
  // Lote 2 de guías (W-101).
  {
    tool: 'ocr-pdf',
    steps: [
      {
        id: 'texto',
        run: async ({ host, files }) => {
          await upload(host, [pdf('constancia.pdf', files.textScan)])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          // La muestra está en español: se elige ese idioma en cualquier idioma de la página.
          await host.locator('select').first().selectOption('spa')
          await primary(host).click()
          await host.locator('pre.text-view').waitFor({ timeout: 120_000 })
          await host.page().waitForTimeout(800)
        },
        // El texto reconocido, con la página de donde sale cada parte.
        target: (host) => host.locator('pre.text-view').locator('xpath=..'),
        maxHeight: { escritorio: 560, movil: 760 },
      },
    ],
  },
  {
    tool: 'imagen-a-texto',
    steps: [
      {
        id: 'texto',
        run: async ({ host, files }) => {
          await upload(host, [jpg('constancia.jpg', files.textPhoto)])
          await host.locator('.file-item').first().waitFor()
          await host.locator('select').first().selectOption('spa')
          await primary(host).click()
          await host.page().waitForFunction(() => (document.querySelector('#tool textarea')?.value ?? '').length > 40, null, { timeout: 120_000 })
          await host.page().waitForTimeout(500)
        },
        maxHeight: { escritorio: 900, movil: 1300 },
      },
    ],
  },
  {
    tool: 'pdf-a-word',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 700, movil: 640 },
      },
    ],
  },
  {
    tool: 'pdf-a-excel',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('extracto.pdf', files.statement)])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 700, movil: 640 },
      },
    ],
  },
  {
    tool: 'pdf-a-texto',
    steps: [
      {
        id: 'texto',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await primary(host).click()
          await host.locator('pre.text-view').last().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(500)
        },
        // La tarjeta del texto (el "Después" de la vista previa también lo muestra, más chico).
        target: (host) => host.locator('pre.text-view').last().locator('xpath=..'),
        maxHeight: { escritorio: 520, movil: 700 },
      },
    ],
  },
  {
    tool: 'pdf-a-jpg',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('informe.pdf', files.pdfs[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 700, movil: 700 },
      },
    ],
  },
  {
    tool: 'extraer-imagenes-pdf',
    steps: [
      {
        id: 'imagenes',
        run: async ({ host, files }) => {
          await upload(host, [pdf('catalogo.pdf', files.scanned)])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await primary(host).click()
          await host.locator('.img-grid img').first().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(500)
        },
        target: (host) => host.locator('.img-grid').locator('xpath=..'),
        maxHeight: { escritorio: 560, movil: 760 },
      },
    ],
  },
  {
    tool: 'pdf-a-pdfa',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('demanda.pdf', files.contract[0])])
          await host.locator('.compare-panel img, .compare-panel canvas').first().waitFor()
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 720, movil: 700 },
      },
    ],
  },
  {
    tool: 'reparar-pdf',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('informe.pdf', files.broken)])
          await host.page().waitForTimeout(1500)
          await primary(host).click()
          await host.locator('.compare-panel .notice').first().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(800)
        },
        target: panel,
        maxHeight: { escritorio: 720, movil: 760 },
      },
    ],
  },
  // Lote 3 (W-101): documentos que se llenan, imágenes, ZIP y QR.
  {
    tool: 'cuenta-de-cobro',
    steps: [
      {
        id: 'conceptos',
        run: async ({ host }) => {
          const parties = host.locator('.bill-party')
          const fill = async (box, values) => {
            const inputs = box.locator('input.input')
            for (const [i, v] of values) await inputs.nth(i).fill(v)
          }
          await host.locator('.bill-meta input').nth(2).fill('Bogotá')
          await fill(parties.nth(0), [[0, 'Laura Gómez Ruiz'], [1, '1.020.456.789'], [3, '300 123 4567'], [4, 'laura@correo.co']])
          await fill(parties.nth(1), [[0, 'Estudio Creativo Andes S.A.S.'], [1, '901.234.567-8']])
          await host.locator('.bill-item .bill-desc input').first().fill('Diseño de logo y manual de marca')
          await host.locator('.bill-item .bill-price input').first().fill('1800000')
          await host.locator('.bill-taxes input').nth(3).fill('10')
          await host.locator('textarea').first().fill('Cuenta de ahorros 123-456789-00, a nombre de Laura Gómez Ruiz')
          await host.page().waitForTimeout(300)
        },
        target: (host) => host.locator('.bill-items').locator('xpath=ancestor::div[contains(@class,"card")][1]'),
        maxHeight: { escritorio: 520, movil: 900 },
      },
      {
        id: 'resultado',
        run: async ({ host }) => {
          await primary(host).click()
          await host.locator('.card[aria-live] canvas, .card[aria-live] img').first().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(800)
        },
        target: (host) => host.locator('.card[aria-live]').first(),
        maxHeight: { escritorio: 760, movil: 760 },
      },
    ],
  },
  {
    tool: 'hoja-de-vida',
    steps: [
      {
        id: 'resultado',
        run: async ({ host }) => {
          const personal = host.locator('.card').nth(1).locator('input.input')
          await personal.nth(0).fill('Laura Gómez Ruiz')
          await personal.nth(1).fill('Diseñadora gráfica')
          await personal.nth(2).fill('Bogotá')
          await personal.nth(3).fill('300 123 4567')
          await personal.nth(4).fill('laura@correo.co')
          await host.locator('textarea').nth(1).fill('Diseñadora gráfica con 6 años de experiencia en identidad de marca y piezas digitales para pequeñas empresas.')
          // Experiencia (tarjeta 3), educación (4) y habilidades.
          const job = host.locator('.card').nth(3).locator('input.input')
          for (const [i, v] of [[0, 'Diseñadora gráfica'], [1, 'Estudio Creativo Andes'], [2, 'Bogotá'], [3, '2021']]) await job.nth(i).fill(v)
          await host.locator('.card').nth(3).locator('input[type=checkbox]').first().check()
          await host.locator('textarea').nth(2).fill('Creé la identidad de marca de más de 40 pequeñas empresas.\nReduje en 30 % los tiempos de entrega con plantillas reutilizables.')
          const study = host.locator('.card').nth(4).locator('input.input')
          for (const [i, v] of [[0, 'Diseño gráfico'], [1, 'Universidad Nacional de Colombia'], [2, 'Bogotá'], [3, '2015'], [4, '2020']]) await study.nth(i).fill(v)
          await host.locator('textarea').nth(3).fill('Illustrator, Photoshop, Figma, identidad de marca, diseño editorial')
          await primary(host).click()
          await host.locator('.card[aria-live] canvas, .card[aria-live] img').first().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(800)
        },
        target: (host) => host.locator('.card[aria-live]').first(),
        maxHeight: { escritorio: 760, movil: 760 },
      },
    ],
  },
  {
    tool: 'crear-codigo-qr',
    steps: [
      {
        id: 'resultado',
        run: async ({ host }) => {
          const card = qrCard(host)
          await card.locator('input[type=url]').fill('https://docusmart.online')
          await card.locator('.btn-primary').first().click()
          await card.locator('.qr-preview img').waitFor({ timeout: 30_000 })
          await host.page().waitForTimeout(500)
        },
        target: (host) => qrCard(host),
        maxHeight: { escritorio: 900, movil: 800 },
      },
    ],
  },
  {
    tool: 'redimensionar-imagen',
    steps: [
      {
        id: 'opciones',
        run: async ({ host, files }) => {
          await upload(host, [jpg('foto.jpg', files.photos[0])])
          await host.page().waitForTimeout(800)
          // «Por pixeles» (el segundo modo) con 1080 de ancho: el alto se calcula solo.
          await host.locator('.segmented button').nth(1).click()
          await host.locator('input[type=number]').first().fill('1080')
          await host.page().waitForTimeout(300)
        },
        maxHeight: { escritorio: 640, movil: 900 },
      },
    ],
  },
  {
    tool: 'comprimir-archivos',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0]), pdf('informe.pdf', files.pdfs[0]), jpg('foto.jpg', files.photos[0])])
          await host.locator('.file-item').nth(2).waitFor()
          await primary(host).click()
          await host.locator('.compare-panel').first().waitFor({ timeout: 60_000 })
          await host.page().waitForTimeout(800)
        },
        target: panel,
        maxHeight: { escritorio: 640, movil: 760 },
      },
    ],
  },
  {
    tool: 'recortar-pdf',
    steps: [
      {
        id: 'recorte',
        run: async ({ host, files }) => {
          await upload(host, [pdf('contrato.pdf', files.contract[0])])
          await host.locator('canvas, img').first().waitFor({ timeout: 30_000 })
          await host.page().waitForTimeout(800)
          // «Quitar márgenes en blanco»: el recuadro se ajusta al contenido.
          await host.locator('.btn-soft.btn-sm').first().click()
          await host.page().waitForTimeout(800)
        },
        maxHeight: { escritorio: 900, movil: 900 },
      },
    ],
  },
  {
    tool: 'imagen-a-webp',
    steps: [
      {
        id: 'resultado',
        run: async ({ host, files }) => {
          await upload(host, [jpg('foto.jpg', files.photos[0])])
          await host.page().waitForTimeout(800)
          await runAndWait(host)
        },
        target: panel,
        maxHeight: { escritorio: 700, movil: 760 },
      },
    ],
  },
  {
    tool: 'quitar-metadatos',
    steps: [
      {
        id: 'datos',
        run: async ({ host, files }) => {
          await upload(host, [jpg('IMG_2041.jpg', files.metaPhoto)])
          await host.locator('.meta-list').first().waitFor({ timeout: 30_000 })
          await host.page().waitForTimeout(500)
        },
        target: (host) => host.locator('.meta-item').first(),
        maxHeight: { escritorio: 700, movil: 900 },
      },
    ],
  },
]
