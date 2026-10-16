import '../shared/fonts'
import { initAnalytics, track } from '../shared/analytics'
import { mountConsentBanner } from '../shared/consent'

document.documentElement.classList.add('js')

const nav = document.getElementById('nav') as HTMLElement
const toggle = document.getElementById('menu-toggle') as HTMLButtonElement

// Barra oscura sobre secciones oscuras (hero y privacidad), clara sobre el resto
const darkSections = [document.querySelector('.hero'), document.getElementById('privacidad')].filter(
  (el): el is HTMLElement => el instanceof HTMLElement,
)
let ticking = false
const updateNav = () => {
  const y = 40
  const overDark = darkSections.some((el) => {
    const r = el.getBoundingClientRect()
    return r.top <= y && r.bottom >= y
  })
  nav.classList.toggle('is-light', !overDark)
  ticking = false
}
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(updateNav)
    }
  },
  { passive: true },
)
updateNav()

const closeMenu = () => {
  nav.classList.remove('is-open')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.setAttribute('aria-label', 'Abrir menú')
}
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open')
  toggle.setAttribute('aria-expanded', String(open))
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú')
})
document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', closeMenu))
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu()
})

// Entradas al hacer scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }
    })
  },
  { threshold: 0, rootMargin: '0px 0px -8% 0px' },
)
document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

// Altura real del recorrido de la línea de escaneo del teléfono
const phoneScreen = document.querySelector<HTMLElement>('#hero-phone .phone-screen')
if (phoneScreen) {
  const setScan = () => phoneScreen.style.setProperty('--scan-h', phoneScreen.clientHeight + 'px')
  setScan()
  addEventListener('resize', setScan)
}

// QR decorativo (determinista, con los tres marcadores de esquina)
const qr = document.getElementById('qr')
if (qr) {
  const N = 11
  const inBox = (r: number, c: number, r0: number, c0: number) => r >= r0 && r < r0 + 3 && c >= c0 && c < c0 + 3
  const finder = (r: number, c: number) => inBox(r, c, 0, 0) || inBox(r, c, 0, 8) || inBox(r, c, 8, 0)
  let seed = 7
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const i = document.createElement('i')
      const nearFinder =
        (r === 3 && (c < 4 || c > 6)) || (c === 3 && r < 4) || (c === 7 && r < 4) || (r === 7 && c < 4) || (c === 3 && r > 6)
      if (!(finder(r, c) || (!nearFinder && rnd() > 0.48))) i.className = 'o'
      qr.appendChild(i)
    }
}

// Enlaces configurables y año
const playUrl = import.meta.env.VITE_PLAY_STORE_URL as string | undefined
if (playUrl) document.querySelectorAll<HTMLAnchorElement>('a[data-track^="play_store"]').forEach((a) => (a.href = playUrl))
const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

// Analítica: clics en CTAs, secciones vistas y preguntas abiertas
initAnalytics()
mountConsentBanner()
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-track]')
  if (!a) return
  const id = a.dataset.track ?? ''
  track('landing_cta_click', { cta: id, destination: id.startsWith('play_store') ? 'play_store' : 'web_app' })
})
const seen = new Set<string>()
const sectionIo = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      const id = (e.target as HTMLElement).id
      if (e.isIntersecting && id && !seen.has(id)) {
        seen.add(id)
        track('landing_section_view', { section: id })
      }
    }),
  { threshold: 0.3 },
)
document.querySelectorAll('section[id]').forEach((s) => sectionIo.observe(s))
document.querySelectorAll('details').forEach((d, i) =>
  d.addEventListener('toggle', () => {
    if (d.open) track('landing_faq_open', { question_index: i + 1 })
  }),
)
