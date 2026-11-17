/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
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
    if (/^(\/[a-z]{2})?\/[a-z0-9-]+$/.test(path) && (existsSync(resolve(SITE, `.${path}.html`)) || existsSync(resolve(ROOT, `public${path}.html`)))) {
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
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace(/src="(?:\.\.\/)+src\//g, `src="${ROOT_URL}/src/`) },
})

// Multipágina: landing en "/", política en "/privacidad", app web en "/app/" y una página por herramienta.
export default defineConfig({
  root: SITE,
  publicDir: resolve(ROOT, 'public'),
  plugins: [react(), cleanUrls(), serveSrcInDev()],
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
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})
