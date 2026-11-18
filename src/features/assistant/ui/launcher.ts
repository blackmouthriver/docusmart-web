// Botón flotante del asistente en TODO el sitio (W-70d): portada, páginas de herramientas,
// /herramientas, privacidad y la app web. Sin React y sin innerHTML (Trusted Types): es liviano;
// el panel (React) y la base se descargan solo al abrirlo.
// UX: entra con un pequeño rebote, destellos y un halo que late suave; una burbuja de bienvenida
// una vez por visita; al abrirlo por primera vez, halo y destellos pasan a un modo tranquilo.
import './assistant.css'
import { TEASER_DELAY_MS, TEASER_VISIBLE_MS, attentionState, launcherText, markSeen } from '../core/launcher'

/** Trazos de los íconos (los mismos de src/shared/ui/Icon.tsx). */
const CHAT = 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'
const CLOSE = 'M6 6l12 12M18 6 6 18'
const SVG_NS = 'http://www.w3.org/2000/svg'

export type LauncherOptions = {
  lang: string
  /** Herramienta de la página (slug), fuera de la app. */
  context?: string
  /** Dentro de la app web: las acciones navegan sin recargar y el contexto sale de la pantalla actual. */
  inApp?: boolean
  /** Ocultar el botón en ciertas pantallas (en la app, el Visor). Se revisa en cada cambio de ruta. */
  hideWhen?: () => boolean
}

function icon(d: string, cls: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.9')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('class', cls)
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', d)
  svg.append(path)
  return svg
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string) => {
  const e = document.createElement(tag)
  e.className = cls
  return e
}

const session = () => {
  try {
    return sessionStorage
  } catch {
    return null
  }
}

/** Monta el botón y devuelve cómo quitarlo. */
export function mountAssistantLauncher(opts: LauncherOptions): () => void {
  const text = launcherText(opts.lang)
  const attention = attentionState(session())

  const root = el('div', 'assistant-root' + (opts.inApp ? ' in-app' : '') + (attention.sparkle ? '' : ' is-quiet'))
  const fab = el('button', 'assistant-fab')
  fab.type = 'button'
  fab.setAttribute('aria-label', text.label)
  fab.setAttribute('aria-haspopup', 'dialog')
  fab.setAttribute('aria-expanded', 'false')
  fab.title = text.label
  fab.append(el('span', 'fab-halo'), el('span', 'fab-halo fab-halo-2'), icon(CHAT, 'fab-icon fab-chat'), icon(CLOSE, 'fab-icon fab-close'), el('i', 'fab-spark s1'), el('i', 'fab-spark s2'), el('i', 'fab-spark s3'))

  // Burbuja de bienvenida (una vez por visita).
  const teaser = el('div', 'assistant-teaser')
  teaser.hidden = true
  const teaserText = el('button', 'teaser-text')
  teaserText.type = 'button'
  teaserText.textContent = text.teaser
  const teaserClose = el('button', 'teaser-close')
  teaserClose.type = 'button'
  teaserClose.setAttribute('aria-label', text.dismiss)
  teaserClose.append(icon(CLOSE, 'teaser-x'))
  teaser.append(teaserText, teaserClose)

  const host = el('div', 'assistant-host')
  root.append(teaser, fab, host)
  document.body.append(root)

  let open = false
  let unmountPanel: (() => void) | null = null
  const timers: number[] = []

  const hideTeaser = () => {
    if (teaser.hidden) return
    teaser.classList.add('is-leaving')
    timers.push(window.setTimeout(() => (teaser.hidden = true), 250))
  }
  if (attention.teaser) {
    timers.push(
      window.setTimeout(() => {
        if (open || root.hidden) return
        teaser.hidden = false
        markSeen(session(), 'teased')
        timers.push(window.setTimeout(hideTeaser, TEASER_VISIBLE_MS))
      }, TEASER_DELAY_MS),
    )
  }

  const setOpen = (value: boolean) => {
    open = value
    fab.classList.toggle('is-open', value)
    fab.setAttribute('aria-expanded', String(value))
  }
  const closePanel = () => {
    unmountPanel?.()
    unmountPanel = null
    setOpen(false)
    fab.focus()
  }
  const openPanel = async () => {
    hideTeaser()
    setOpen(true)
    markSeen(session(), 'opened')
    root.classList.add('is-quiet')
    const { mountPanel } = await import('./standalone')
    if (!open) return
    unmountPanel = mountPanel(host, { lang: opts.lang, context: opts.context, inApp: opts.inApp, onClose: closePanel })
  }
  const toggle = () => (open ? closePanel() : void openPanel())

  fab.addEventListener('click', toggle)
  teaserText.addEventListener('click', () => void openPanel())
  teaserClose.addEventListener('click', hideTeaser)

  // En la app: se oculta en ciertas pantallas (el Visor).
  const sync = () => {
    const hide = !!opts.hideWhen?.()
    root.hidden = hide
    if (hide && open) closePanel()
  }
  sync()
  addEventListener('hashchange', sync)

  return () => {
    timers.forEach(clearTimeout)
    removeEventListener('hashchange', sync)
    unmountPanel?.()
    root.remove()
  }
}
