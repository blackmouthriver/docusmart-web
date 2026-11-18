// Página "Todas las herramientas" (W-78): el listado viene en el HTML (para buscadores);
// aquí solo el buscador que filtra mientras se escribe y el movimiento común.
import '../shared/platform/trustedTypes'
import '../shared/platform/fonts'
import '../shared/ui/motion.css'
import '../app/app.css'
import './tool-page.css'
import './tools-hub.css'
import { initAnalytics, trackScreen } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import { rememberLangChoice } from '../shared/platform/langChoice'
import { initMotion } from '../shared/platform/motion'
import { matchesQuery } from '../shared/i18n/search'

initAnalytics()
mountConsentBanner()
rememberLangChoice()
initMotion()
trackScreen('ToolsHub')

const input = document.querySelector<HTMLInputElement>('#th-q')
const sections = [...document.querySelectorAll<HTMLElement>('[data-cat]')]
const empty = document.querySelector<HTMLElement>('.th-empty')
const jumps = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-jump]')].map((a) => [`cat-${a.dataset.jump}`, a]))

function filter(query: string) {
  let total = 0
  for (const section of sections) {
    let shown = 0
    section.querySelectorAll<HTMLElement>('[data-tool]').forEach((li) => {
      const ok = matchesQuery(li.dataset.search ?? '', query)
      li.hidden = !ok
      if (ok) shown++
    })
    section.hidden = shown === 0
    // Al filtrar, la sección se muestra ya visible (sin esperar a desplazarse).
    if (query) section.classList.add('is-in')
    jumps.get(section.id)?.toggleAttribute('aria-disabled', shown === 0)
    total += shown
  }
  if (empty) empty.hidden = total > 0
}

input?.addEventListener('input', () => filter(input.value))
// Si el navegador recuerda lo escrito al volver atrás, se aplica de entrada.
if (input?.value) filter(input.value)
