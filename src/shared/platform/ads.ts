/**
 * Espacios de publicidad (W-90). Reglas:
 *  - Solo si hay ID para ese lugar (adsConfig.ts) y el visitante aceptó en el
 *    aviso de cookies. Sin las dos cosas no se descarga nada de Google.
 *  - Nunca encima de la herramienta, del resultado ni del visor: en las páginas
 *    de herramientas va antes de las preguntas frecuentes; en /herramientas,
 *    después de la tercera categoría; en la app, al pie de la pantalla.
 *  - Carga diferida: el bloque se pide cuando está por entrar en pantalla.
 *  - Si el visitante retira el consentimiento, los espacios desaparecen.
 */
import { AD_SLOTS, ADS_CLIENT, ADS_SCRIPT, type AdPlace } from './adsConfig'
import { adAllowed, adLabel, CONSENT_EVENT } from './adsPolicy'

export { adAllowed, CONSENT_EVENT }

let script: HTMLScriptElement | null = null

function loadScript() {
  if (script) return
  void import('./ads.css').catch(() => undefined)
  script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = ADS_SCRIPT
  document.head.append(script)
}

/** Arma el espacio (etiqueta visible + bloque adaptable) y lo pide al acercarse a la pantalla. */
export function createAdSlot(place: AdPlace, lang = document.documentElement.lang): HTMLElement {
  const box = document.createElement('aside')
  box.className = 'ad-slot'
  box.dataset.ad = place
  box.setAttribute('aria-label', adLabel(lang))
  const label = document.createElement('span')
  label.className = 'ad-label'
  label.setAttribute('aria-hidden', 'true')
  label.textContent = adLabel(lang)
  const ins = document.createElement('ins')
  ins.className = 'adsbygoogle'
  ins.dataset.adClient = ADS_CLIENT
  ins.dataset.adSlot = AD_SLOTS[place]
  ins.dataset.adFormat = 'auto'
  ins.dataset.fullWidthResponsive = 'true'
  box.append(label, ins)

  const request = () => {
    loadScript()
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      ;(w.adsbygoogle = w.adsbygoogle ?? []).push({})
    } catch {
      /* un anuncio que falla nunca interrumpe al usuario */
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        request()
      },
      { rootMargin: '400px 0px' },
    )
    queueMicrotask(() => io.observe(box))
  } else request()
  return box
}

/** Dónde va el anuncio en las páginas estáticas: antes de las preguntas o tras la 3.ª categoría. */
function anchorFor(place: AdPlace): { node: Element; before: boolean } | null {
  if (place === 'tool') {
    const faq = document.querySelector('.tp-faq')?.closest('section')
    return faq ? { node: faq, before: true } : null
  }
  if (place === 'hub') {
    const third = document.querySelectorAll('[data-cat]')[2]
    return third ? { node: third, before: false } : null
  }
  return null
}

/** Páginas de herramientas y /herramientas: coloca el espacio y lo sigue según el consentimiento. */
export function mountPageAd(place: 'tool' | 'hub') {
  if (AD_SLOTS[place].trim() === '') return
  const sync = () => {
    const current = document.querySelector(`.ad-slot[data-ad="${place}"]`)
    if (!adAllowed(place)) {
      current?.remove()
      return
    }
    if (current) return
    const anchor = anchorFor(place)
    if (!anchor) return
    const slot = createAdSlot(place)
    if (anchor.before) anchor.node.before(slot)
    else anchor.node.after(slot)
  }
  window.addEventListener(CONSENT_EVENT, sync)
  sync()
}
