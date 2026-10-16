/**
 * Banner de consentimiento de analítica, compartido por la landing y la app
 * web. Solo aparece si Firebase está configurado y el visitante aún no eligió.
 * "Rechazar" tiene el mismo peso visual que "Aceptar".
 */
import { analyticsConfigured, getConsent, setConsent } from './analytics'
import './consent.css'

export function mountConsentBanner(opts: { onPrivacyHref?: string } = {}) {
  if (!analyticsConfigured || getConsent() !== null) return

  const el = document.createElement('div')
  el.className = 'ds-consent'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-label', 'Preferencias de analítica')
  el.innerHTML = `
    <p>Usamos Google Analytics (Firebase) para saber qué funciones se usan y mejorar DocuSmart. Nunca enviamos tus archivos ni su contenido. <a href="${opts.onPrivacyHref ?? '/privacidad.html'}">Más información</a></p>
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
}
