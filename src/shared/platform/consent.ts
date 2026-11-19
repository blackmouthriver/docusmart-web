/**
 * Banner de consentimiento de analítica, compartido por la landing y la app
 * web. Aparece solo si Firebase está configurado: la primera vez que el
 * visitante entra, o cuando pulsa "Preferencias de analítica" para cambiar
 * su decisión. "Rechazar" tiene el mismo peso visual que "Aceptar".
 */
import { consentNeeded, getConsent, setConsent } from './analytics'
import { adsEnabled } from './adsConfig'
import { consentText } from './consentText'

/** Los estilos del banner se descargan solo cuando se muestra: así no bloquean el primer pintado. */
const loadStyles = () => import('./consent.css').catch(() => undefined)

const PRIVACY_HREF = '/privacidad.html#sitio-web'

function showBanner() {
  void loadStyles().then(buildBanner)
}

function buildBanner() {
  document.querySelector('.ds-consent')?.remove()
  const current = getConsent()
  // El idioma de la página: el de la portada o herramienta (/en/…) o el elegido en la app.
  const t = consentText(document.documentElement.lang)
  // Con anuncios activos (W-90) el aviso cubre también la publicidad.
  const ads = adsEnabled()
  const title = ads ? t.adsTitle : t.title

  // Se arma con APIs del DOM (no innerHTML): compatible con Trusted Types.
  const el = document.createElement('div')
  el.className = 'ds-consent'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-label', title)

  const p = document.createElement('p')
  p.append(ads ? t.adsBody : t.body)
  if (current) {
    const state = document.createElement('b')
    state.textContent = current === 'granted' ? t.on : t.off
    const [before, after = ''] = t.current.split('{state}')
    p.append(' ', before, state, after)
  }
  const more = document.createElement('a')
  more.href = PRIVACY_HREF
  more.textContent = t.more
  p.append(' ', more)

  const actions = document.createElement('div')
  actions.className = 'ds-consent-actions'
  for (const [value, label] of [
    ['denied', t.deny],
    ['granted', t.accept],
  ] as const) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = value
    b.textContent = label
    actions.append(b)
  }
  el.append(p, actions)
  el.addEventListener('click', (e) => {
    const v = (e.target as HTMLElement).closest('button')?.dataset.v
    if (v !== 'granted' && v !== 'denied') return
    setConsent(v)
    el.classList.add('is-leaving')
    setTimeout(() => el.remove(), 220)
  })
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('is-in'))
  el.querySelector<HTMLButtonElement>(`button[data-v="${current ?? 'granted'}"]`)?.focus({ preventScroll: true })
}

export function mountConsentBanner() {
  // Los enlaces "Preferencias de analítica" ([data-consent-open]) reabren el banner;
  // si la analítica no está configurada no hay nada que elegir y se ocultan.
  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((el) => {
    el.hidden = !consentNeeded
  })
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-consent-open]')) return
    e.preventDefault()
    if (consentNeeded) showBanner()
  })
  if (consentNeeded && getConsent() === null) showBanner()
}
