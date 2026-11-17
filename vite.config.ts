/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { generatedHtml } from './tools/locales/index.mjs'

// `npm run preview` usa las mismas cabeceras de seguridad que producción (firebase.json),
// para detectar en local cualquier recurso que la CSP bloquee.
type FirebaseHeaders = { source: string; headers: Array<{ key: string; value: string }> }
const firebase = JSON.parse(readFileSync(resolve(import.meta.dirname, 'firebase.json'), 'utf-8'))
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
    if (/^(\/[a-z]{2})?\/[a-z0-9-]+$/.test(path) && (existsSync(resolve(import.meta.dirname, `.${path}.html`)) || existsSync(resolve(import.meta.dirname, `public${path}.html`)))) {
      req.url = `${path}.html${query ? `?${query}` : ''}`
    } else if (/^\/[a-z]{2}\/?$/.test(path) && existsSync(resolve(import.meta.dirname, `.${path.replace(/\/$/, '')}/index.html`))) {
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

// Multipágina: landing en "/", política en "/privacidad", app web en "/app/" y una página por herramienta.
export default defineConfig({
  plugins: [react(), cleanUrls()],
  build: {
    // Vite incrusta como data: los archivos chicos, pero la CSP (`font-src 'self'`)
    // bloquea fuentes data:. Las fuentes siempre van como archivo aparte.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        // Páginas generadas: herramientas en cada idioma y portadas traducidas (/en/…).
        ...Object.fromEntries(generatedHtml().map((f) => [f.replace(/\.html$/, ''), resolve(import.meta.dirname, f)])),
      },
    },
  },
  preview: {
    headers: prodHeaders,
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})
