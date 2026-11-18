/**
 * App instalable (W-16): registra el service worker (src/sw/sw.js, publicado como /sw.js) y guarda el aviso de
 * instalación del navegador para ofrecerlo con un botón propio ("Instalar en este equipo").
 *
 * En Android no se ofrece: ahí conviene la app nativa de Google Play, que hace más cosas
 * (escáner con bordes, OCR, carpeta segura) y funciona sin conexión.
 */

/** Evento `beforeinstallprompt` (Chrome, Edge): todavía no está en los tipos del DOM. */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Solo en producción, con conexión segura (o localhost) y si el navegador lo soporta. */
export function canRegisterServiceWorker(env: { prod: boolean; secure: boolean; supported: boolean }): boolean {
  return env.prod && env.secure && env.supported
}

/** Ofrecer instalar la web: no si ya corre instalada ni en Android (ahí va la app de Play). */
export function shouldOfferInstall(userAgent: string, standalone: boolean): boolean {
  return !standalone && !/Android/i.test(userAgent)
}

/** Carpetas del sitio que el service worker guarda (las mismas que src/sw/sw.js). */
export const CACHEABLE_PREFIXES = ['/assets/', '/pdfjs/', '/qpdf/', '/7z/', '/ocr/', '/img/', '/assistant/']

/**
 * De lo que la página ya descargó, lo que conviene guardar para usarla sin conexión: en la
 * primera visita los módulos se bajan antes de que el service worker controle la página.
 */
export function urlsToCache(loaded: string[], origin: string): string[] {
  const out = new Set<string>()
  for (const raw of loaded) {
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      continue
    }
    if (url.origin === origin && CACHEABLE_PREFIXES.some((p) => url.pathname.startsWith(p))) out.add(url.pathname)
  }
  return [...out]
}

/** ¿Corre como app instalada (ventana propia)? */
export const isStandalone = (win: Window): boolean => win.matchMedia?.('(display-mode: standalone)').matches ?? false

/**
 * Registra el service worker cuando la página ya cargó, para no competir con lo importante.
 * En la app instalada, además pide descargar todas las herramientas para usarlas sin conexión:
 * al abrirla, al instalarla y cuando se activa una versión nueva (que empieza sin ese código).
 */
export function registerServiceWorker(win: Window = window, prod = import.meta.env.PROD): void {
  const nav = win.navigator
  if (!canRegisterServiceWorker({ prod, secure: win.isSecureContext, supported: 'serviceWorker' in nav })) return
  const sw = nav.serviceWorker
  const precacheTools = () => void sw.ready.then((reg) => reg.active?.postMessage({ type: 'precache-tools' })).catch(() => undefined)
  const register = () =>
    void sw
      .register('/sw.js')
      .then(() => sw.ready)
      .then((reg) => {
        const loaded = win.performance.getEntriesByType('resource').map((e) => e.name)
        reg.active?.postMessage({ type: 'cache', urls: urlsToCache(loaded, win.location.origin) })
        if (isStandalone(win)) precacheTools()
      })
      .catch(() => undefined)
  win.addEventListener('appinstalled', precacheTools)
  sw.addEventListener?.('controllerchange', () => isStandalone(win) && precacheTools())
  if (win.document.readyState === 'complete') register()
  else win.addEventListener('load', register, { once: true })
}

/** Avisa cuando la app instalada ya tiene todas las herramientas para usar sin conexión. */
export function onOfflineReady(cb: () => void, win: Window = window): () => void {
  const sw = win.navigator.serviceWorker
  if (!sw?.addEventListener) return () => undefined
  const onMessage = (e: MessageEvent) => {
    if (e.origin === win.location.origin && (e.data as { type?: string } | null)?.type === 'offline-ready') cb()
  }
  sw.addEventListener('message', onMessage)
  return () => sw.removeEventListener('message', onMessage)
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<(available: boolean) => void>()
const notify = () => listeners.forEach((l) => l(deferred !== null))

/**
 * Escucha si se puede ofrecer la instalación. Devuelve la función para dejar de escuchar.
 * Al instalarse (o si el navegador retira el aviso) avisa `false`.
 */
export function watchInstallPrompt(onChange: (available: boolean) => void, win: Window = window): () => void {
  const standalone = isStandalone(win)
  if (!shouldOfferInstall(win.navigator.userAgent, standalone)) {
    onChange(false)
    return () => undefined
  }
  const onPrompt = (e: Event) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    notify()
  }
  const onInstalled = () => {
    deferred = null
    notify()
  }
  listeners.add(onChange)
  win.addEventListener('beforeinstallprompt', onPrompt)
  win.addEventListener('appinstalled', onInstalled)
  onChange(deferred !== null)
  return () => {
    listeners.delete(onChange)
    win.removeEventListener('beforeinstallprompt', onPrompt)
    win.removeEventListener('appinstalled', onInstalled)
  }
}

/** Muestra el diálogo de instalación del navegador. true si el usuario aceptó. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  // El aviso se puede usar una sola vez.
  deferred = null
  notify()
  await e.prompt()
  return (await e.userChoice).outcome === 'accepted'
}
