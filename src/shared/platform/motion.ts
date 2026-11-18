/**
 * Sistema de movimiento común (W-72), pareja de `shared/ui/motion.css`:
 * aparición al desplazar, escalonado, "reducir movimiento" y transiciones de vista.
 * Sin dependencias: si el navegador no tiene IntersectionObserver o View Transitions,
 * el contenido se muestra igual, sin animación.
 */

/** Retraso escalonado para el elemento `index` de una lista, con un tope para listas largas. */
export function staggerDelay(index: number, step = 80, max = 400): number {
  if (!Number.isFinite(index) || index <= 0) return 0
  return Math.min(Math.floor(index) * step, max)
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Marca con `is-in` cada elemento cuando entra en pantalla (una sola vez).
 * Sin IntersectionObserver o con "reducir movimiento", los muestra de inmediato.
 * Devuelve una función para dejar de observar.
 */
export function observeReveal(targets: Iterable<Element>, rootMargin = '0px 0px -8% 0px'): () => void {
  const list = Array.from(targets)
  if (typeof IntersectionObserver !== 'function' || prefersReducedMotion()) {
    list.forEach((el) => el.classList.add('is-in'))
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }),
    { rootMargin },
  )
  list.forEach((el) => io.observe(el))
  return () => io.disconnect()
}

/** Escalona los hijos `.reveal` de cada `[data-stagger]` (si no traen ya su propio `--d`). */
export function applyStagger(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const step = Number(group.dataset.stagger) || 80
    Array.from(group.children)
      .filter((c): c is HTMLElement => c.classList.contains('reveal'))
      .forEach((c, i) => {
        if (!c.style.getPropertyValue('--d')) c.style.setProperty('--d', `${staggerDelay(i, step)}ms`)
      })
  })
}

/** Activa el movimiento de una página: clase `js`, escalonado y aparición de los `.reveal`. */
export function initMotion(root: Document = document): () => void {
  quietPageTransitions(root.defaultView ?? undefined)
  root.documentElement.classList.add('js')
  applyStagger(root)
  return observeReveal(root.querySelectorAll('.reveal'))
}

type ViewTransitionDoc = { startViewTransition?: (update: () => void) => unknown }

/** Cambia la vista con una transición suave donde exista (View Transitions); si no, al instante. */
export function withViewTransition(update: () => void, doc: ViewTransitionDoc | undefined = globalThis.document): void {
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }
  doc.startViewTransition.call(doc, update)
}

type Settled = { catch?: (onRejected: () => void) => unknown }
type PageTransitionEvent = Event & { viewTransition?: { ready?: Settled; updateCallbackDone?: Settled; finished?: Settled } | null }

/**
 * Las transiciones entre páginas se saltan cuando la pestaña está en segundo plano
 * (o la página ya se mostró) y el navegador rechaza sus promesas sin que nadie las
 * atienda, lo que deja un error en consola. Saltarse la animación es lo esperado:
 * se atienden para que la navegación siga sin ruido.
 */
export function quietPageTransitions(target: Pick<EventTarget, 'addEventListener'> | undefined = globalThis.window): void {
  if (!target) return
  const quiet = (e: Event) => {
    const vt = (e as PageTransitionEvent).viewTransition
    if (!vt) return
    for (const p of [vt.ready, vt.updateCallbackDone, vt.finished]) p?.catch?.(() => {})
  }
  target.addEventListener('pageswap', quiet)
  target.addEventListener('pagereveal', quiet)
}

/** Desplaza respetando "reducir movimiento". */
export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')
