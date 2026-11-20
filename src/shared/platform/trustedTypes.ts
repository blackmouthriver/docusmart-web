/**
 * Política por defecto de Trusted Types (la CSP exige `require-trusted-types-for 'script'`).
 *
 * Con Trusted Types el navegador rechaza cualquier string que llegue a un
 * "sink" peligroso (innerHTML, script.src, new Worker, eval…) salvo que pase
 * por una política. Esta es la única política del sitio:
 *  - HTML como texto: nunca. El sitio arma el DOM con APIs seguras.
 *  - Código como texto (eval, new Function): nunca.
 *  - URLs de scripts/workers: solo del propio dominio, blob: creados por la
 *    página (pdf.js), Google Tag Manager (analítica, solo con consentimiento)
 *    y AdSense únicamente cuando los anuncios están activos (W-90).
 *
 * Debe importarse antes que cualquier otro módulo en cada punto de entrada.
 */
import { adsEnabled, ADS_ORIGIN } from './adsConfig'

/** Scripts que carga AdSense además del principal: verificación de tráfico y mensaje de consentimiento. */
const ADS_EXTRA_ORIGINS = ['https://tpc.googlesyndication.com', 'https://fundingchoicesmessages.google.com']
const ADS_HOST_SUFFIX = '.adtrafficquality.google'

export function scriptOrigins(ads = adsEnabled()): string[] {
  return ['https://www.googletagmanager.com', ...(ads ? [ADS_ORIGIN, ...ADS_EXTRA_ORIGINS] : [])]
}

export function isAllowedScriptUrl(raw: string, base = location.href, ads = adsEnabled()): boolean {
  let url: URL
  try {
    url = new URL(raw, base)
  } catch {
    return false
  }
  if (url.protocol === 'blob:') return url.href.startsWith(`blob:${new URL(base).origin}/`)
  if (ads && url.protocol === 'https:' && url.hostname.endsWith(ADS_HOST_SUFFIX)) return true
  return url.origin === new URL(base).origin || scriptOrigins(ads).includes(url.origin)
}

type TrustedTypesFactory = {
  createPolicy: (
    name: string,
    rules: {
      createHTML?: (s: string) => string
      createScript?: (s: string) => string
      createScriptURL?: (s: string) => string
    },
  ) => unknown
  defaultPolicy?: unknown
}

export function installTrustedTypesPolicy() {
  const tt = (globalThis as { trustedTypes?: TrustedTypesFactory }).trustedTypes
  // Navegadores sin Trusted Types (Firefox, Safari antiguos): no hay nada que instalar.
  if (!tt || tt.defaultPolicy) return
  tt.createPolicy('default', {
    createHTML: () => {
      throw new TypeError('Trusted Types: no se permite insertar HTML como texto.')
    },
    createScript: () => {
      throw new TypeError('Trusted Types: no se permite ejecutar código como texto.')
    },
    createScriptURL: (s) => {
      if (isAllowedScriptUrl(s)) return s
      throw new TypeError(`Trusted Types: script bloqueado (${s}).`)
    },
  })
}

installTrustedTypesPolicy()
