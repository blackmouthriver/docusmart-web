/**
 * Banner de consentimiento de analítica, compartido por la landing y la app
 * web. Aparece solo si Firebase está configurado: la primera vez que el
 * visitante entra, o cuando pulsa "Preferencias de analítica" para cambiar
 * su decisión. "Rechazar" tiene el mismo peso visual que "Aceptar".
 */
import { analyticsConfigured, getConsent, setConsent } from './analytics'
import './consent.css'

const PRIVACY_HREF = '/privacidad.html#sitio-web'

function showBanner() {
  document.querySelector('.ds-consent')?.remove()
  const current = getConsent()

  // Se arma con APIs del DOM (no innerHTML): compatible con Trusted Types.
  const el = document.createElement('div')
  el.className = 'ds-consent'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-label', 'Preferencias de analítica')

  const p = document.createElement('p')
  p.append('Usamos Google Analytics (Firebase) para saber qué funciones se usan y mejorar DocuSmart. Nunca enviamos tus archivos ni su contenido.')
  if (current) {
    const state = document.createElement('b')
    state.textContent = current === 'granted' ? 'activada' : 'desactivada'
    p.append(' Ahora mismo la tienes ', state, '.')
  }
  const more = document.createElement('a')
  more.href = PRIVACY_HREF
  more.textContent = 'Más información'
  p.append(' ', more)

  const actions = document.createElement('div')
  actions.className = 'ds-consent-actions'
  for (const [value, label] of [
    ['denied', 'Rechazar'],
    ['granted', 'Aceptar'],
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
    el.hidden = !analyticsConfigured
  })
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-consent-open]')) return
    e.preventDefault()
    if (analyticsConfigured) showBanner()
  })
  if (analyticsConfigured && getConsent() === null) showBanner()
}
