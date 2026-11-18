// Política de privacidad (W-71): mismo tema que la web, índice que marca la sección visible,
// aparición suave de las tarjetas y botón para volver arriba. El texto legal está en el HTML.
import '../shared/platform/trustedTypes'
import '../shared/platform/fonts'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'

applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
document.documentElement.classList.add('js')

// Aparición suave al entrar en pantalla.
const reveal = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      reveal.unobserve(e.target)
    }),
  { rootMargin: '0px 0px -8% 0px' },
)
document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))

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
    link.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
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
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
}
