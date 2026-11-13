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
  const status =
    current === 'granted' ? ' Ahora mismo la tienes <b>activada</b>.' : current === 'denied' ? ' Ahora mismo la tienes <b>desactivada</b>.' : ''

  const el = document.createElement('div')
  el.className = 'ds-consent'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-label', 'Preferencias de analítica')
  el.innerHTML = `
    <p>Usamos Google Analytics (Firebase) para saber qué funciones se usan y mejorar DocuSmart. Nunca enviamos tus archivos ni su contenido.${status} <a href="${PRIVACY_HREF}">Más información</a></p>
    <div class="ds-consent-actions">
      <button type="button" data-v="denied">Rechazar</button>
      <button type="button" data-v="granted">Aceptar</button>
    </div>`
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
