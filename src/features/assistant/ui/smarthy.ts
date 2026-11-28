// Smarthy en el botón flotante (W-153, prototipo con poses). Sin React y sin innerHTML: dos <img> que se
// turnan para cambiar de pose con un fundido corto, una sombra suave debajo y la flotación por CSS.
// La pose la decide `core/smarthy.ts` con las señales de la pantalla (`shared/platform/mood.ts`).
import { IDLE_BLINK_MIN_MS, IDLE_BLINK_SPREAD_MS, SMARTHY_POSES, fabPose, fabReduce, flash, initialFab, smarthySrc, type Pose } from '../core/smarthy'
import { onMood } from '../../../shared/platform/mood'

/** El saludo llega cuando termina la entrada del botón (`fab-in`: 600 ms de espera + 700 ms). */
const GREET_AFTER_MS = 1400

export function mountSmarthy(fab: HTMLElement, opts: { tool: () => string }): () => void {
  const wrap = document.createElement('span')
  wrap.className = 'fab-smarthy'
  wrap.setAttribute('aria-hidden', 'true')
  const body = document.createElement('span')
  body.className = 'smarthy-body'
  const shadow = document.createElement('span')
  shadow.className = 'smarthy-shadow'
  const imgs = [0, 1].map(() => {
    const img = document.createElement('img')
    img.className = 'smarthy-img'
    img.alt = ''
    img.decoding = 'async'
    img.draggable = false
    img.width = img.height = 256
    body.append(img)
    return img
  })
  wrap.append(shadow, body)
  fab.append(wrap)

  let state = initialFab
  let hover = false
  let pose: Pose = 'idle'
  let front = 0
  let token = 0
  const timers = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  // Primera pose: si no carga, se quita Smarthy y queda el ícono de chat de siempre.
  imgs[0].classList.add('is-front')
  imgs[0].addEventListener('load', () => fab.classList.add('has-smarthy'), { once: true })
  imgs[0].addEventListener('error', () => (fab.classList.remove('has-smarthy'), wrap.remove()), { once: true })
  imgs[0].src = smarthySrc('idle')

  const show = (next: Pose) => {
    if (next === pose) return
    pose = next
    const mine = ++token
    const back = imgs[1 - front]
    back.src = smarthySrc(next)
    // Se cambia cuando la imagen ya está decodificada (sin parpadeo en blanco).
    const swap = () => {
      if (mine !== token) return
      imgs[front].classList.remove('is-front')
      back.classList.add('is-front')
      front = 1 - front
      // Pequeño «salto» al cambiar de pose (reinicia la animación).
      body.classList.remove('is-pop')
      void body.offsetWidth
      body.classList.add('is-pop')
    }
    back.decode().then(swap, swap)
  }

  const render = () => {
    const now = Date.now()
    show(fabPose(state, { now, hover, tool: opts.tool() }))
    if (state.flash && state.flash.until > now) later(render, state.flash.until - now + 20)
  }

  const isOpen = () => fab.classList.contains('is-open')

  // En reposo, cada tanto guiña un ojo.
  const blink = () =>
    later(() => {
      if (!state.busy && !hover && !isOpen() && !document.hidden && pose === 'idle') {
        state = flash(state, 'curious', Date.now())
        render()
      }
      blink()
    }, IDLE_BLINK_MIN_MS + Math.random() * IDLE_BLINK_SPREAD_MS)
  blink()

  // Saluda una vez al aparecer.
  later(() => {
    if (isOpen()) return
    state = flash(state, 'wave', Date.now())
    render()
  }, GREET_AFTER_MS)

  // Con mouse: saluda mientras el puntero está encima (en pantallas táctiles no hay «encima»).
  const enter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    hover = true
    render()
  }
  const leave = () => {
    hover = false
    render()
  }
  fab.addEventListener('pointerenter', enter)
  fab.addEventListener('pointerleave', leave)

  const offMood = onMood((signal) => {
    state = fabReduce(state, signal, Date.now())
    render()
  })

  // El resto de las poses se descarga cuando el navegador está libre (~120 KB en total).
  const preload = () => SMARTHY_POSES.forEach((p) => (new Image().src = smarthySrc(p)))
  if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 4000 })
  else later(preload, 2500)

  return () => {
    timers.forEach(clearTimeout)
    offMood()
    fab.removeEventListener('pointerenter', enter)
    fab.removeEventListener('pointerleave', leave)
    fab.classList.remove('has-smarthy')
    wrap.remove()
  }
}
