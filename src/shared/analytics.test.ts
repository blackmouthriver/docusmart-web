import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Firebase simulado: se verifica qué se llama, sin red.
const fa = {
  isSupported: vi.fn(async () => true),
  initializeAnalytics: vi.fn(() => ({ id: 'analytics' })),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
}
vi.mock('@firebase/analytics', () => fa)
vi.mock('@firebase/app', () => ({ initializeApp: vi.fn(() => ({ id: 'app' })) }))

/** localStorage, document.cookie y location mínimos para el entorno Node. */
function stubBrowser(hostname = 'docusmart.online') {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  const cookies = new Map<string, string>()
  const removed: string[] = []
  vi.stubGlobal('document', {
    get cookie() {
      return [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    set cookie(raw: string) {
      const [pair, ...attrs] = raw.split(';')
      const [name, value] = pair.split('=')
      if (attrs.some((a) => a.trim() === 'Max-Age=0')) {
        cookies.delete(name.trim())
        removed.push(raw)
      } else cookies.set(name.trim(), value)
    },
  })
  vi.stubGlobal('location', { hostname })
  return { store, cookies, removed }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

async function loadModule(configured: boolean) {
  vi.resetModules()
  if (configured) {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'k')
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:0:web:x')
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-TEST')
  }
  return import('./analytics')
}

beforeEach(() => {
  Object.values(fa).forEach((f) => f.mockClear())
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('analytics sin configuración de Firebase', () => {
  it('no carga Firebase aunque el visitante acepte', async () => {
    stubBrowser()
    const a = await loadModule(false)
    expect(a.analyticsConfigured).toBe(false)
    a.setConsent('granted')
    a.track('conversion_started', { conversion_type: 'IMAGE_TO_PDF' })
    a.initAnalytics()
    await flush()
    expect(fa.initializeAnalytics).not.toHaveBeenCalled()
    expect(fa.logEvent).not.toHaveBeenCalled()
  })

  it('guarda y lee la decisión de consentimiento', async () => {
    const { store } = stubBrowser()
    const a = await loadModule(false)
    expect(a.getConsent()).toBeNull()
    a.setConsent('denied')
    expect(store.get('ds-consent')).toBe('denied')
    expect(a.getConsent()).toBe('denied')
    store.set('ds-consent', 'otra-cosa')
    expect(a.getConsent()).toBeNull()
  })

  it('no falla si el navegador bloquea el almacenamiento', async () => {
    stubBrowser()
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    })
    const a = await loadModule(false)
    expect(a.getConsent()).toBeNull()
    expect(() => a.setConsent('granted')).not.toThrow()
  })
})

describe('analytics con Firebase configurado', () => {
  it('no envía nada sin consentimiento', async () => {
    stubBrowser()
    const a = await loadModule(true)
    expect(a.analyticsConfigured).toBe(true)
    a.track('pdf_tool_used', { tool_name: 'merge' })
    a.initAnalytics()
    await flush()
    expect(fa.initializeAnalytics).not.toHaveBeenCalled()
  })

  it('al aceptar carga Firebase con IP anónima y sin señales de anuncios, y envía los eventos en cola', async () => {
    stubBrowser()
    const a = await loadModule(true)
    a.setConsent('granted')
    a.track('pdf_tool_used', { tool_name: 'merge' })
    await vi.waitFor(() => expect(fa.logEvent).toHaveBeenCalled())
    expect(fa.initializeAnalytics).toHaveBeenCalledWith(expect.anything(), {
      config: { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false },
    })
    expect(fa.logEvent).toHaveBeenCalledWith(expect.anything(), 'pdf_tool_used', { platform: 'web', tool_name: 'merge' })

    a.trackScreen('Home')
    await vi.waitFor(() =>
      expect(fa.logEvent).toHaveBeenCalledWith(expect.anything(), 'screen_view', {
        platform: 'web',
        firebase_screen: 'Home',
        firebase_screen_class: 'Home',
      }),
    )
  })

  it('al retirar el consentimiento apaga la recolección y borra las cookies _ga', async () => {
    const { cookies } = stubBrowser('www.docusmart.online')
    const a = await loadModule(true)
    a.setConsent('granted')
    await vi.waitFor(() => expect(fa.initializeAnalytics).toHaveBeenCalled())
    cookies.set('_ga', 'GA1.1.1')
    cookies.set('_ga_TEST', 'GS1.1.1')
    cookies.set('otra', 'x')

    a.setConsent('denied')
    await vi.waitFor(() => expect(fa.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), false))
    expect([...cookies.keys()]).toEqual(['otra'])

    fa.logEvent.mockClear()
    a.track('note_created')
    await flush()
    expect(fa.logEvent).not.toHaveBeenCalled()

    a.setConsent('granted')
    await vi.waitFor(() => expect(fa.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), true))
  })

  it('arranca sola si el visitante ya había aceptado antes', async () => {
    const { store } = stubBrowser()
    store.set('ds-consent', 'granted')
    const a = await loadModule(true)
    a.initAnalytics()
    await vi.waitFor(() => expect(fa.initializeAnalytics).toHaveBeenCalledTimes(1))
  })

  it('si el navegador no soporta Analytics, no lo inicializa', async () => {
    stubBrowser()
    fa.isSupported.mockResolvedValueOnce(false)
    const a = await loadModule(true)
    a.setConsent('granted')
    await flush()
    await flush()
    expect(fa.initializeAnalytics).not.toHaveBeenCalled()
  })
})
