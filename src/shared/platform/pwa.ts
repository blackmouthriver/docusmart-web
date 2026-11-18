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

type LaunchQueue = { setConsumer: (consumer: (params: { targetURL?: string }) => void) => void }

/**
 * Una sola ventana de DocuSmart Desktop: el manifest pide enfocar la que ya está abierta
 * ("launch_handler": focus-existing). Al abrirla desde el ícono se queda donde estaba (no se
 * pierde lo que el usuario hacía); desde un acceso directo (#/pdf/unir…) va a esa herramienta.
 */
export function handleLaunches(win: Window = window): void {
  const queue = (win as Window & { launchQueue?: LaunchQueue }).launchQueue
  queue?.setConsumer(({ targetURL }) => {
    if (!targetURL) return
    let url: URL
    try {
      url = new URL(targetURL)
    } catch {
      return
    }
    if (url.origin === win.location.origin && url.hash && url.hash !== win.location.hash) win.location.hash = url.hash
  })
}

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
        watchForUpdates(reg, win)
      })
      .catch(() => undefined)
  win.addEventListener('appinstalled', precacheTools)
  sw.addEventListener?.('controllerchange', () => isStandalone(win) && precacheTools())
  if (win.document.readyState === 'complete') register()
  else win.addEventListener('load', register, { once: true })
}

/** Cada cuánto se busca una versión nueva mientras la app sigue abierta. */
export const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * El navegador solo busca un service worker nuevo al navegar; la app (una sola página) puede
 * quedar abierta horas. Por eso se revisa al volver a la ventana y cada hora.
 */
export function watchForUpdates(reg: { update: () => Promise<unknown> }, win: Window = window): () => void {
  const check = () => void reg.update().catch(() => undefined)
  const onVisible = () => win.document.visibilityState === 'visible' && check()
  win.document.addEventListener?.('visibilitychange', onVisible)
  const timer = win.setInterval(check, UPDATE_CHECK_MS)
  return () => {
    win.document.removeEventListener?.('visibilitychange', onVisible)
    win.clearInterval(timer)
  }
}

/**
 * Avisa (una vez) que hay una versión nueva publicada mientras la página seguía abierta:
 *  - el service worker nuevo tomó el control de una página que ya tenía uno (la primera
 *    instalación no cuenta), o
 *  - falló la carga de un módulo porque ya no existe en el servidor (Vite: vite:preloadError);
 *    en ese caso se evita el error y se ofrece actualizar.
 */
export function onUpdateReady(cb: () => void, win: Window = window): () => void {
  const sw = win.navigator.serviceWorker
  const hadController = !!sw?.controller
  let fired = false
  const fire = () => {
    if (fired) return
    fired = true
    cb()
  }
  const onControllerChange = () => hadController && fire()
  const onPreloadError = (e: Event) => {
    e.preventDefault()
    fire()
  }
  sw?.addEventListener?.('controllerchange', onControllerChange)
  win.addEventListener('vite:preloadError', onPreloadError)
  return () => {
    sw?.removeEventListener?.('controllerchange', onControllerChange)
    win.removeEventListener('vite:preloadError', onPreloadError)
  }
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

const capturing = new WeakSet<Window>()

/**
 * Empieza a guardar el aviso de instalación del navegador. Hay que llamarla al arrancar la
 * página: el navegador puede avisar antes de que la interfaz termine de montarse, y si nadie
 * escucha en ese momento el aviso se pierde (y el botón "Instalar" no aparece).
 */
export function captureInstallPrompt(win: Window = window): void {
  if (capturing.has(win) || !shouldOfferInstall(win.navigator.userAgent, isStandalone(win))) return
  capturing.add(win)
  win.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    notify()
  })
  win.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

/**
 * Escucha si se puede ofrecer la instalación. Devuelve la función para dejar de escuchar.
 * Al instalarse (o si el navegador retira el aviso) avisa `false`.
 */
export function watchInstallPrompt(onChange: (available: boolean) => void, win: Window = window): () => void {
  if (!shouldOfferInstall(win.navigator.userAgent, isStandalone(win))) {
    onChange(false)
    return () => undefined
  }
  captureInstallPrompt(win)
  listeners.add(onChange)
  onChange(deferred !== null)
  return () => {
    listeners.delete(onChange)
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
