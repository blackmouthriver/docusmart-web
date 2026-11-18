// Política de privacidad (W-71): mismo tema que la web, índice que marca la sección visible,
// aparición suave de las tarjetas y botón para volver arriba. El texto legal está en el HTML.
import '../shared/platform/trustedTypes'
import { registerServiceWorker } from '../shared/platform/pwa'
import '../shared/platform/fonts'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import { initMotion, scrollBehavior } from '../shared/platform/motion'
import { mountAssistantLauncher } from '../features/assistant/ui/launcher'

applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
// Aparición suave al entrar en pantalla (sistema de movimiento común, W-72).
initMotion()
// Asistente (W-70d): el mismo botón flotante de todo el sitio; el panel se descarga al abrirlo.
mountAssistantLauncher({ lang: document.documentElement.lang })

// Índice: marca la sección que se está leyendo (y la deja a la vista en el celular).
const links = new Map<string, HTMLAnchorElement>()
document.querySelectorAll<HTMLAnchorElement>('.pv-toc a[href^="#"]').forEach((a) => links.set(a.hash.slice(1), a))
let current: HTMLAnchorElement | null = null
const spy = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    const id = visible?.target.querySelector('h2')?.id
    const link = id ? links.get(id) : undefined
    if (!link || link === current) return
    current?.removeAttribute('aria-current')
    link.setAttribute('aria-current', 'true')
    current = link
    link.scrollIntoView({ block: 'nearest', inline: 'center', behavior: scrollBehavior() })
  },
  { rootMargin: '-20% 0px -65% 0px' },
)
document.querySelectorAll('.pv-main section').forEach((s) => spy.observe(s))

// Volver arriba.
const top = document.querySelector<HTMLButtonElement>('.pv-top')
if (top) {
  const toggle = () => (top.hidden = scrollY < 600)
  addEventListener('scroll', toggle, { passive: true })
  toggle()
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: scrollBehavior() }))
}

// App instalable y sin conexión (W-16).
registerServiceWorker()
