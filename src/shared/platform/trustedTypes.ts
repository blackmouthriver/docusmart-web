/**
 * Política por defecto de Trusted Types (la CSP exige `require-trusted-types-for 'script'`).
 *
 * Con Trusted Types el navegador rechaza cualquier string que llegue a un
 * "sink" peligroso (innerHTML, script.src, new Worker, eval…) salvo que pase
 * por una política. Esta es la única política del sitio:
 *  - HTML como texto: nunca. El sitio arma el DOM con APIs seguras.
 *  - Código como texto (eval, new Function): nunca.
 *  - URLs de scripts/workers: solo del propio dominio, blob: creados por la
 *    página (pdf.js) y Google Tag Manager (analítica, solo con consentimiento).
 *
 * Debe importarse antes que cualquier otro módulo en cada punto de entrada.
 */
const ALLOWED_SCRIPT_ORIGINS = ['https://www.googletagmanager.com']

export function isAllowedScriptUrl(raw: string, base = location.href): boolean {
  let url: URL
  try {
    url = new URL(raw, base)
  } catch {
    return false
  }
  if (url.protocol === 'blob:') return url.href.startsWith(`blob:${new URL(base).origin}/`)
  return url.origin === new URL(base).origin || ALLOWED_SCRIPT_ORIGINS.includes(url.origin)
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
