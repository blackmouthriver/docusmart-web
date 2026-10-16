/**
 * Analítica web de DocuSmart sobre el mismo proyecto Firebase que la app
 * Android (docusmart-8904e). Los nombres de eventos replican los de
 * `DocuSmartAnalytics.kt` para poder comparar plataformas en un solo
 * panel; cada evento lleva además `platform: "web"`.
 *
 * Reglas:
 *  - Firebase solo se descarga si hay configuración (.env.local) y el
 *    visitante aceptó en el banner de consentimiento.
 *  - Un fallo de analítica nunca interrumpe al usuario: se descarta.
 *  - Jamás se envían nombres de archivo ni contenido, solo tipos y conteos.
 */
import type { Analytics } from '@firebase/analytics'

type Params = Record<string, string | number | boolean>

const CONSENT_KEY = 'ds-consent'
export type Consent = 'granted' | 'denied'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

export const analyticsConfigured = Boolean(config.apiKey && config.appId && config.measurementId)

let analytics: Analytics | null = null
let loading: Promise<void> | null = null
// Eventos ocurridos antes de que Firebase termine de cargar.
const queue: Array<[string, Params | undefined]> = []

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* almacenamiento bloqueado: el consentimiento dura solo esta visita */
  }
  if (value === 'granted') void load()
  else queue.length = 0
}

async function load() {
  if (!analyticsConfigured || analytics || loading) return loading ?? undefined
  loading = (async () => {
    try {
      const [{ initializeApp }, fa] = await Promise.all([
        import('@firebase/app'),
        import('@firebase/analytics'),
      ])
      if (!(await fa.isSupported())) return
      const app = initializeApp(config)
      analytics = fa.initializeAnalytics(app, {
        config: { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false },
      })
      for (const [name, params] of queue.splice(0)) fa.logEvent(analytics, name, { platform: 'web', ...params })
    } catch {
      analytics = null
    }
  })()
  return loading
}

export function track(name: string, params?: Params) {
  if (!analyticsConfigured || getConsent() !== 'granted') return
  if (!analytics) {
    queue.push([name, params])
    void load()
    return
  }
  void import('@firebase/analytics')
    .then(({ logEvent }) => analytics && logEvent(analytics, name, { platform: 'web', ...params }))
    .catch(() => {})
}

/** Vista de pantalla con el mismo evento que la app (screen_view). */
export function trackScreen(screenName: string) {
  track('screen_view', { firebase_screen: screenName, firebase_screen_class: screenName })
}

/** Arranca la analítica si el visitante ya había aceptado antes. */
export function initAnalytics() {
  if (getConsent() === 'granted') void load()
}
