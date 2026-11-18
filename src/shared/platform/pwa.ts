/**
 * App instalable (W-16): registra el service worker (public/sw.js) y guarda el aviso de
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

/** Registra el service worker cuando la página ya cargó, para no competir con lo importante. */
export function registerServiceWorker(win: Window = window, prod = import.meta.env.PROD): void {
  const nav = win.navigator
  if (!canRegisterServiceWorker({ prod, secure: win.isSecureContext, supported: 'serviceWorker' in nav })) return
  const register = () =>
    void nav.serviceWorker
      .register('/sw.js')
      .then(() => nav.serviceWorker.ready)
      .then((reg) => {
        const loaded = win.performance.getEntriesByType('resource').map((e) => e.name)
        reg.active?.postMessage({ type: 'cache', urls: urlsToCache(loaded, win.location.origin) })
      })
      .catch(() => undefined)
  if (win.document.readyState === 'complete') register()
  else win.addEventListener('load', register, { once: true })
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<(available: boolean) => void>()
const notify = () => listeners.forEach((l) => l(deferred !== null))

/**
 * Escucha si se puede ofrecer la instalación. Devuelve la función para dejar de escuchar.
 * Al instalarse (o si el navegador retira el aviso) avisa `false`.
 */
export function watchInstallPrompt(onChange: (available: boolean) => void, win: Window = window): () => void {
  const standalone = win.matchMedia?.('(display-mode: standalone)').matches ?? false
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
