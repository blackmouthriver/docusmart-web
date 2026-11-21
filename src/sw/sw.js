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
// /models/ (Quitar fondo, ~90 MB) no pasa por aquí: la herramienta lo guarda en su propia caché.
const STATIC_PREFIXES = ['/pdfjs/', '/qpdf/', '/7z/', '/ocr/', '/ort/', '/heic/', '/avif/', '/img/', '/assistant/']
// Los archivos son del propio sitio y no cambian según quién los pida: se ignora Vary (el
// servidor manda Vary: Origin / accept-encoding, y los módulos y fuentes se piden con Origin).
const MATCH = { ignoreVary: true }

/**
 * Todo el código de las herramientas (lo arma el build): la app instalada lo descarga de fondo
 * para que cualquier herramienta funcione sin conexión. Queda afuera el OCR (~17 MB): ese se
 * guarda la primera vez que se usa con conexión.
 */
const TOOLS = /*__SW_TOOLS__*/ []

/** Archivos /assets/ que carga una página (script, estilos, precargas): para tenerla completa sin conexión. */
function assetsIn(html) {
  return [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
}

/** Guarda los archivos que falten, de a pocos a la vez. Devuelve cuántos descargó y cuántos fallaron. */
async function store(urls) {
  const pages = await caches.open(PAGES)
  const statics = await caches.open(STATIC)
  const todo = urls.filter((u) => typeof u === 'string' && u.startsWith('/'))
  let added = 0
  let failed = 0
  for (let i = 0; i < todo.length; i += 6) {
    await Promise.all(
      todo.slice(i, i + 6).map(async (u) => {
        const cache = u.startsWith('/assets/') ? pages : STATIC_PREFIXES.some((p) => u.startsWith(p)) ? statics : null
        if (!cache || (await cache.match(u, MATCH))) return
        try {
          await cache.add(u)
          added++
        } catch {
          failed++
        }
      }),
    )
  }
  return { added, failed }
}

// Mensajes de las páginas (src/shared/platform/pwa.ts):
//  - "cache": lo que la página ya descargó (en la primera visita llegó antes de que este
//    service worker la controlara).
//  - "precache-tools": la app instalada pide todas las herramientas; al terminar se le avisa.
self.addEventListener('message', (event) => {
  // Solo páginas del propio sitio pueden pedirlo.
  if (event.origin !== self.location.origin) return
  const data = event.data
  if (data?.type === 'cache' && Array.isArray(data.urls)) event.waitUntil(store(data.urls))
  if (data?.type === 'precache-tools')
    event.waitUntil(
      store(TOOLS).then(({ added, failed }) => {
        if (added > 0 && failed === 0) event.source?.postMessage({ type: 'offline-ready' })
      }),
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
    // Si no se puede guardar (por ejemplo, sin espacio), la página igual se muestra.
    if (res.ok && res.type === 'basic') await cache.put(request, res.clone()).catch(() => undefined)
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
  if (res.ok && res.type === 'basic') await cache.put(request, res.clone()).catch(() => undefined)
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
