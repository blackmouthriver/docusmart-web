/*
 * Service worker de DocuSmart Web (W-16): instalar el sitio y usarlo sin conexión.
 * Solo guarda archivos del propio sitio (código, páginas, librerías); nunca los documentos
 * del usuario, que no pasan por la red. Las peticiones a otros dominios no se tocan.
 *
 *  - Páginas: primero la red (siempre la versión publicada); sin conexión, la última guardada.
 *  - /assets/ (nombres con hash, no cambian): de la caché si está; si no, de la red y se guarda.
 *  - Librerías y datos sin hash (pdf.js, qpdf, 7z, OCR, imágenes, asistente): de la caché al
 *    instante y se actualizan de fondo.
 *
 * Se publica como /sw.js desde vite.config.ts, que reemplaza __SW_VERSION__ en cada build: así el navegador
 * instala el service worker nuevo y se borra la caché de la versión anterior.
 */
const VERSION = '__SW_VERSION__'
const PAGES = `ds-pages-${VERSION}`
const STATIC = 'ds-static'
const SHELL = ['/app/', '/']
const STATIC_PREFIXES = ['/pdfjs/', '/qpdf/', '/7z/', '/ocr/', '/img/', '/assistant/']
// Los archivos son del propio sitio y no cambian según quién los pida: se ignora Vary (el
// servidor manda Vary: Origin / accept-encoding, y los módulos y fuentes se piden con Origin).
const MATCH = { ignoreVary: true }

/** Archivos /assets/ que carga una página (script, estilos, precargas): para tenerla completa sin conexión. */
function assetsIn(html) {
  return [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
}

// La página avisa qué archivos ya descargó (src/shared/platform/pwa.ts): en la primera visita
// llegaron antes de que este service worker la controlara, así que se guardan ahora.
self.addEventListener('message', (event) => {
  const data = event.data
  if (data?.type !== 'cache' || !Array.isArray(data.urls)) return
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES)
      const statics = await caches.open(STATIC)
      await Promise.allSettled(
        data.urls
          .filter((u) => typeof u === 'string' && u.startsWith('/'))
          .map(async (u) => {
            const cache = u.startsWith('/assets/') ? pages : STATIC_PREFIXES.some((p) => u.startsWith(p)) ? statics : null
            if (cache && !(await cache.match(u, MATCH))) await cache.add(u)
          }),
      )
    })(),
  )
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES)
      await Promise.allSettled(
        SHELL.map(async (url) => {
          const res = await fetch(url, { cache: 'reload' })
          if (!res.ok) return
          const html = await res.clone().text()
          await cache.put(url, res)
          await Promise.allSettled(assetsIn(html).map((a) => cache.add(a)))
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('ds-pages-') && k !== PAGES).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

async function networkFirst(request) {
  const cache = await caches.open(PAGES)
  try {
    const res = await fetch(request)
    if (res.ok && res.type === 'basic') cache.put(request, res.clone())
    return res
  } catch {
    const url = new URL(request.url)
    return (
      (await cache.match(request, { ...MATCH, ignoreSearch: true })) ??
      (await cache.match(url.pathname.startsWith('/app') ? '/app/' : '/', MATCH)) ??
      Response.error()
    )
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(PAGES)
  const hit = await cache.match(request, MATCH)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') cache.put(request, res.clone())
  return res
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(event.request, MATCH)
  const update = fetch(event.request)
    .then((res) => {
      if (res.ok && res.type === 'basic') return cache.put(event.request, res.clone()).then(() => res)
      return res
    })
    .catch(() => hit ?? Response.error())
  if (hit) {
    event.waitUntil(update.then(() => undefined))
    return hit
  }
  return update
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.headers.has('range')) return
  const url = new URL(request.url)
  // Solo el propio sitio; Firebase reservado (/__/) y el retorno de OAuth van siempre a la red.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/__/') || url.pathname.startsWith('/oauth')) return
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request))
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(request))
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return event.respondWith(staleWhileRevalidate(event))
})
