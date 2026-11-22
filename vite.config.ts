/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { generatedHtml } from './tools/locales/index.mjs'

// Estructura: las páginas HTML viven en site/ (raíz de Vite), el código en src/,
// los archivos estáticos en public/ y las pruebas en tests/.
const ROOT = import.meta.dirname
const SITE = resolve(ROOT, 'site')

// `npm run preview` usa las mismas cabeceras de seguridad que producción (firebase.json),
// para detectar en local cualquier recurso que la CSP bloquee.
type FirebaseHeaders = { source: string; headers: Array<{ key: string; value: string }> }
const firebase = JSON.parse(readFileSync(resolve(ROOT, 'firebase.json'), 'utf-8'))
const prodHeaders = Object.fromEntries(
  (firebase.hosting.headers as FirebaseHeaders[])
    .find((h) => h.source === '**')!
    .headers.filter((h) => h.key !== 'Strict-Transport-Security')
    .map((h) => [h.key, h.key === 'Content-Security-Policy' ? h.value.replace('; upgrade-insecure-requests', '') : h.value]),
)

// En local, /unir-pdf o /privacidad sirven su .html igual que Firebase con cleanUrls.
const cleanUrls = (): Plugin => {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    const [path, query = ''] = (req.url ?? '').split('?')
    // /unir-pdf y /en/merge-pdf → su .html; /en o /en/ → en/index.html (como cleanUrls en Firebase).
    if (/^(\/[a-z]{2})?(\/[a-z]+)?\/[a-z0-9-]+$/.test(path) && (existsSync(resolve(SITE, `.${path}.html`)) || existsSync(resolve(ROOT, `public${path}.html`)))) {
      req.url = `${path}.html${query ? `?${query}` : ''}`
    } else if (/^\/[a-z]{2}\/?$/.test(path) && existsSync(resolve(SITE, `.${path.replace(/\/$/, '')}/index.html`))) {
      req.url = `${path.replace(/\/$/, '')}/index.html${query ? `?${query}` : ''}`
    }
    next()
  }
  return {
    name: 'clean-urls',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

// Las páginas de site/ cargan su entrada con "../src/entries/…". En el build Vite resuelve
// esa ruta relativa; en desarrollo el navegador la pediría como /src/…, fuera de la raíz.
// Se reescribe a la URL /@fs/ que Vite usa para ese archivo, para que cada módulo tenga
// una sola URL (con dos, la entrada se ejecutaría dos veces y React montaría dos raíces).
const ROOT_URL = `/@fs/${ROOT.replace(/\\/g, '/').replace(/^\//, '')}`
const serveSrcInDev = (): Plugin => ({
  name: 'serve-src-in-dev',
  apply: 'serve',
  // 'pre': antes de que Vite procese y precargue los <script> de la página.
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace(/(src|href)="(?:\.\.\/)+src\//g, `$1="${ROOT_URL}/src/`) },
})

// Precarga la fuente de los títulos (Bricolage, alfabeto latino): así llega junto con el CSS y el
// título de la portada, que la espera para no reacomodarse (CLS), aparece antes.
const preloadDisplayFont = (): Plugin => ({
  name: 'preload-display-font',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html, ctx) => {
      const font = Object.keys(ctx.bundle ?? {}).find((f) => /bricolage-grotesque-latin-opsz-normal-[\w-]+\.woff2$/.test(f))
      if (!font) return html
      return html.replace('</head>', `<link rel="preload" href="/${font}" as="font" type="font/woff2" crossorigin>\n</head>`)
    },
  },
})

// App instalable (W-16): cada página enlaza el manifest y el ícono para iOS; la que no tiene
// color de barra lo recibe. Va aquí y no en cada plantilla para que ninguna página quede afuera.
// Solo en el build: el servidor de desarrollo (localhost) no se ofrece para instalar, así no queda
// un segundo DocuSmart Desktop instalado desde otro origen.
const ICON_LINK = '<link rel="icon" href="/img/icon.svg" type="image/svg+xml">'
const pwaHead = (): Plugin => ({
  name: 'pwa-head',
  apply: 'build',
  transformIndexHtml: (html) => {
    if (!html.includes(ICON_LINK)) return html
    const extra = ['<link rel="manifest" href="/manifest.webmanifest">', '<link rel="apple-touch-icon" href="/img/pwa/apple-touch-icon.png">']
    if (!html.includes('name="theme-color"')) extra.push('<meta name="theme-color" content="#0B1020">')
    return html.replace(ICON_LINK, [ICON_LINK, ...extra].join('\n'))
  },
})

/** Archivos de public/ que usan las herramientas (wasm de qpdf y 7z, datos de pdf.js), sin licencias. */
function publicToolFiles(): string[] {
  const out: string[] = []
  const walk = (rel: string) => {
    const dir = resolve(ROOT, 'public', rel)
    if (!existsSync(dir)) return
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const path = `${rel}/${e.name}`
      if (e.isDirectory()) walk(path)
      else if (!/license/i.test(e.name)) out.push(`/${path}`)
    }
  }
  ;['pdfjs', 'qpdf', '7z'].forEach(walk)
  return out.sort()
}

// El service worker (src/sw/sw.js) se publica como /sw.js con la versión del build (cada
// publicación instala uno nuevo y borra la caché de páginas de la anterior) y con la lista de
// todo el código de las herramientas, que la app instalada descarga para funcionar sin conexión.
const swVersion = (): Plugin => ({
  name: 'sw-version',
  apply: 'build',
  generateBundle(_opts, bundle) {
    const version = createHash('sha256').update(Object.keys(bundle).sort().join('\n')).digest('hex').slice(0, 12)
    const source = readFileSync(resolve(ROOT, 'src', 'sw', 'sw.js'), 'utf-8').replace("'__SW_VERSION__'", `'${version}'`)
    this.emitFile({ type: 'asset', fileName: 'sw.js', source })
  },
  // La lista se arma al final, con lo que de verdad quedó en dist/assets (el bundle incluye
  // módulos de cada página HTML que después se descartan). La copia de 7zz.wasm que emite el
  // paquete no se usa: va /7z/7zz.wasm.
  closeBundle() {
    const dist = resolve(ROOT, 'dist')
    const sw = resolve(dist, 'sw.js')
    // Se lee una sola vez (sin comprobar antes si existe) para no abrir una carrera entre la
    // comprobación y el uso; si no hay sw.js (build parcial) no hay nada que completar.
    let source: string
    try {
      source = readFileSync(sw, 'utf-8')
    } catch {
      return
    }
    const assets: string[] = []
    const walk = (rel: string) => {
      for (const e of readdirSync(resolve(dist, rel), { withFileTypes: true })) {
        const path = `${rel}/${e.name}`
        if (e.isDirectory()) walk(path)
        else if (/\.(js|mjs|css|woff2)$/.test(e.name)) assets.push(`/${path}`)
      }
    }
    walk('assets')
    const tools = [...assets.sort(), ...publicToolFiles()]
    writeFileSync(sw, source.replace('/*__SW_TOOLS__*/ []', JSON.stringify(tools)))
  },
})

// Multipágina: landing en "/", política en "/privacidad", app web en "/app/" y una página por herramienta.
export default defineConfig({
  root: SITE,
  publicDir: resolve(ROOT, 'public'),
  plugins: [react(), cleanUrls(), serveSrcInDev(), preloadDisplayFont(), pwaHead(), swVersion()],
  // Las páginas de site/ cargan su código desde ../src: en desarrollo se permite leer todo el proyecto.
  server: { fs: { allow: [ROOT] } },
  build: {
    outDir: resolve(ROOT, 'dist'),
    emptyOutDir: true,
    // Vite incrusta como data: los archivos chicos, pero la CSP (`font-src 'self'`)
    // bloquea fuentes data:. Las fuentes siempre van como archivo aparte.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    rollupOptions: {
      input: {
        landing: resolve(SITE, 'index.html'),
        privacidad: resolve(SITE, 'privacidad.html'),
        app: resolve(SITE, 'app/index.html'),
        // Páginas generadas: herramientas en cada idioma y portadas traducidas (/en/…).
        ...Object.fromEntries(generatedHtml().map((f) => [f.replace(/\.html$/, ''), resolve(SITE, f)])),
      },
    },
  },
  preview: {
    headers: prodHeaders,
  },
  test: {
    root: ROOT,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/shared/pdfFontsSetup.ts', 'tests/shared/i18nSetup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})
