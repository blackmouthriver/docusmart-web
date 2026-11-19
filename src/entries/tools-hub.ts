// Página "Todas las herramientas" (W-78): el listado viene en el HTML (para buscadores);
// aquí solo el buscador que filtra mientras se escribe y el movimiento común.
import '../shared/platform/trustedTypes'
import { registerServiceWorker } from '../shared/platform/pwa'
import '../shared/platform/fonts'
import '../shared/ui/motion.css'
import '../app/app.css'
import './tool-page.css'
import './tools-hub.css'
import { initAnalytics, trackScreen } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import { mountPageAd } from '../shared/platform/ads'
import { rememberLangChoice } from '../shared/platform/langChoice'
import { initMotion } from '../shared/platform/motion'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import { matchesQuery } from '../shared/i18n/search'
import { mountAssistantLauncher } from '../features/assistant/ui/launcher'

initAnalytics()
mountConsentBanner()
// Publicidad (W-90): apagada mientras no haya ID del bloque ni consentimiento.
mountPageAd('hub')
rememberLangChoice()
initMotion()
// Tema, acento y tamaño de letra elegidos en Ajustes de la app (también en estas páginas).
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
trackScreen('ToolsHub')
// Asistente (W-70d): el mismo botón flotante de todo el sitio; el panel se descarga al abrirlo.
mountAssistantLauncher({ lang: document.documentElement.lang })

const input = document.querySelector<HTMLInputElement>('#th-q')
const sections = [...document.querySelectorAll<HTMLElement>('[data-cat]')]
const empty = document.querySelector<HTMLElement>('.th-empty')
/** Accesos de cada categoría (el carrusel tiene dos copias de cada uno). */
const jumps = new Map<string, HTMLAnchorElement[]>()
document.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) => {
  const id = `cat-${a.dataset.jump}`
  jumps.set(id, [...(jumps.get(id) ?? []), a])
})

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
    jumps.get(section.id)?.forEach((a) => a.toggleAttribute('aria-disabled', shown === 0))
    total += shown
  }
  if (empty) empty.hidden = total > 0
}

input?.addEventListener('input', () => filter(input.value))
// Si el navegador recuerda lo escrito al volver atrás, se aplica de entrada.
if (input?.value) filter(input.value)

// App instalable y sin conexión (W-16).
registerServiceWorker()
