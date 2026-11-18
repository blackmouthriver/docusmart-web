import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { canRegisterServiceWorker, promptInstall, registerServiceWorker, shouldOfferInstall, urlsToCache, watchInstallPrompt } from '../../../../src/shared/platform/pwa'

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'

/** Ventana mínima con eventos, para probar sin navegador. */
function fakeWindow(opts: { ua?: string; standalone?: boolean; ready?: string; secure?: boolean; sw?: boolean } = {}) {
  const target = new EventTarget()
  const register = vi.fn().mockResolvedValue(undefined)
  const postMessage = vi.fn()
  const win = {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    isSecureContext: opts.secure ?? true,
    location: { origin: 'https://docusmart.online' },
    performance: { getEntriesByType: () => [{ name: 'https://docusmart.online/assets/search-abc.js' }, { name: 'https://www.googletagmanager.com/gtag/js' }] },
    document: { readyState: opts.ready ?? 'complete' },
    matchMedia: () => ({ matches: opts.standalone ?? false }),
    navigator: {
      userAgent: opts.ua ?? DESKTOP,
      ...(opts.sw === false ? {} : { serviceWorker: { register, ready: Promise.resolve({ active: { postMessage } }) } }),
    },
  }
  return { win: win as unknown as Window, register, postMessage, dispatch: (e: Event) => target.dispatchEvent(e) }
}

function installEvent(outcome: 'accepted' | 'dismissed') {
  const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
  e.prompt = vi.fn().mockResolvedValue(undefined)
  e.userChoice = Promise.resolve({ outcome })
  return e
}

describe('service worker', () => {
  it('solo en producción, con conexión segura y soporte', () => {
    expect(canRegisterServiceWorker({ prod: true, secure: true, supported: true })).toBe(true)
    expect(canRegisterServiceWorker({ prod: false, secure: true, supported: true })).toBe(false)
    expect(canRegisterServiceWorker({ prod: true, secure: false, supported: true })).toBe(false)
    expect(canRegisterServiceWorker({ prod: true, secure: true, supported: false })).toBe(false)
  })

  it('registra /sw.js ya cargada la página, o al terminar de cargar', () => {
    const a = fakeWindow()
    registerServiceWorker(a.win, true)
    expect(a.register).toHaveBeenCalledWith('/sw.js')

    const b = fakeWindow({ ready: 'loading' })
    registerServiceWorker(b.win, true)
    expect(b.register).not.toHaveBeenCalled()
    b.dispatch(new Event('load'))
    expect(b.register).toHaveBeenCalledTimes(1)
  })

  it('al quedar activo le pasa lo ya descargado del propio sitio', async () => {
    const a = fakeWindow()
    registerServiceWorker(a.win, true)
    await vi.waitFor(() => expect(a.postMessage).toHaveBeenCalled())
    expect(a.postMessage).toHaveBeenCalledWith({ type: 'cache', urls: ['/assets/search-abc.js'] })
  })

  it('solo guarda archivos del propio sitio y de sus carpetas cacheables', () => {
    const o = 'https://docusmart.online'
    expect(
      urlsToCache(
        [`${o}/assets/a.js`, `${o}/assets/a.js`, `${o}/pdfjs/pdf.worker.mjs`, `${o}/__/firebase/init.js`, `${o}/app/`, 'https://otro.com/assets/x.js', 'no es url'],
        o,
      ),
    ).toEqual(['/assets/a.js', '/pdfjs/pdf.worker.mjs'])
  })

  it('no registra en desarrollo ni sin soporte', () => {
    const a = fakeWindow()
    registerServiceWorker(a.win, false)
    expect(a.register).not.toHaveBeenCalled()
    const b = fakeWindow({ sw: false })
    expect(() => registerServiceWorker(b.win, true)).not.toThrow()
  })
})

describe('instalar la web', () => {
  it('no se ofrece en Android ni si ya está instalada', () => {
    expect(shouldOfferInstall(DESKTOP, false)).toBe(true)
    expect(shouldOfferInstall(ANDROID, false)).toBe(false)
    expect(shouldOfferInstall(DESKTOP, true)).toBe(false)
  })

  it('guarda el aviso del navegador, lo muestra una vez y avisa el resultado', async () => {
    const { win, dispatch } = fakeWindow()
    const seen: boolean[] = []
    const stop = watchInstallPrompt((v) => seen.push(v), win)
    expect(seen).toEqual([false])

    const e = installEvent('accepted')
    dispatch(e)
    expect(e.defaultPrevented).toBe(true)
    expect(seen.at(-1)).toBe(true)

    await expect(promptInstall()).resolves.toBe(true)
    expect(e.prompt).toHaveBeenCalledTimes(1)
    expect(seen.at(-1)).toBe(false)
    await expect(promptInstall()).resolves.toBe(false)

    dispatch(installEvent('dismissed'))
    await expect(promptInstall()).resolves.toBe(false)

    dispatch(installEvent('accepted'))
    dispatch(new Event('appinstalled'))
    expect(seen.at(-1)).toBe(false)
    stop()
  })

  it('en Android avisa que no hay instalación y no escucha', () => {
    const { win, dispatch } = fakeWindow({ ua: ANDROID })
    const seen: boolean[] = []
    watchInstallPrompt((v) => seen.push(v), win)()
    dispatch(installEvent('accepted'))
    expect(seen).toEqual([false])
  })
})

describe('manifest', () => {
  const root = process.cwd()
  const m = JSON.parse(readFileSync(join(root, 'public', 'manifest.webmanifest'), 'utf-8'))
  it('es instalable: nombre, inicio en la app, standalone e íconos de 192 y 512', () => {
    expect(m.name).toBeTruthy()
    expect(m.start_url).toBe('/app/')
    expect(m.display).toBe('standalone')
    const sizes = m.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
  })
  it('todos los íconos existen', () => {
    const files = [...m.icons, ...m.shortcuts.flatMap((s: { icons: unknown[] }) => s.icons)].map((i: { src: string }) => i.src)
    for (const src of files) expect(existsSync(join(root, 'public', src)), src).toBe(true)
  })
  it('el service worker trae la marca de versión que reemplaza el build', () => {
    expect(readFileSync(join(root, 'src', 'sw', 'sw.js'), 'utf-8')).toContain("'__SW_VERSION__'")
  })
})
