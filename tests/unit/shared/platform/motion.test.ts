import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyStagger,
  initMotion,
  observeReveal,
  prefersReducedMotion,
  quietPageTransitions,
  scrollBehavior,
  staggerDelay,
  withViewTransition,
} from '../../../../src/shared/platform/motion'

/** Elemento mínimo para el entorno Node: clases, estilo e hijos. */
interface FakeEl {
  classList: { add: (c: string) => void; contains: (c: string) => boolean }
  style: { getPropertyValue: (k: string) => string; setProperty: (k: string, v: string) => void }
  children: FakeEl[]
  dataset: Record<string, string>
  has: (c: string) => boolean
  prop: (k: string) => string | undefined
}
function el(classes: string[] = [], children: FakeEl[] = [], dataset: Record<string, string> = {}): FakeEl {
  const set = new Set(classes)
  const props = new Map<string, string>()
  return {
    classList: { add: (c: string) => void set.add(c), contains: (c: string) => set.has(c) },
    style: { getPropertyValue: (k: string) => props.get(k) ?? '', setProperty: (k: string, v: string) => void props.set(k, v) },
    children,
    dataset,
    has: (c: string) => set.has(c),
    prop: (k: string) => props.get(k),
  }
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce') }))
}

/** IntersectionObserver simulado: guarda el callback para disparar entradas a mano. */
function stubObserver() {
  const state = { cb: null as null | ((e: unknown[]) => void), observed: [] as unknown[], unobserved: [] as unknown[], disconnected: false, options: null as unknown }
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (e: unknown[]) => void, options: unknown) {
        state.cb = cb
        state.options = options
      }
      observe(t: unknown) {
        state.observed.push(t)
      }
      unobserve(t: unknown) {
        state.unobserved.push(t)
      }
      disconnect() {
        state.disconnected = true
      }
    },
  )
  return state
}

afterEach(() => vi.unstubAllGlobals())

describe('staggerDelay', () => {
  it('escalona por índice con tope', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(1)).toBe(80)
    expect(staggerDelay(3, 50)).toBe(150)
    expect(staggerDelay(20)).toBe(400)
    expect(staggerDelay(2.7, 100, 1000)).toBe(200)
  })
  it('ignora índices negativos o no numéricos', () => {
    expect(staggerDelay(-2)).toBe(0)
    expect(staggerDelay(Number.NaN)).toBe(0)
  })
})

describe('prefersReducedMotion y scrollBehavior', () => {
  it('sin matchMedia no reduce', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
    expect(scrollBehavior()).toBe('smooth')
  })
  it('respeta la preferencia del sistema', () => {
    stubReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
    expect(scrollBehavior()).toBe('auto')
  })
})

describe('observeReveal', () => {
  it('sin IntersectionObserver muestra todo de inmediato', () => {
    stubReducedMotion(false)
    vi.stubGlobal('IntersectionObserver', undefined)
    const a = el(['reveal'])
    observeReveal([a as unknown as Element])()
    expect(a.has('is-in')).toBe(true)
  })
  it('con "reducir movimiento" muestra todo de inmediato', () => {
    stubReducedMotion(true)
    const io = stubObserver()
    const a = el(['reveal'])
    observeReveal([a as unknown as Element])
    expect(a.has('is-in')).toBe(true)
    expect(io.observed).toHaveLength(0)
  })
  it('marca al entrar en pantalla una sola vez y se puede desconectar', () => {
    stubReducedMotion(false)
    const io = stubObserver()
    const a = el(['reveal'])
    const b = el(['reveal'])
    const stop = observeReveal([a, b] as unknown as Element[], '0px')
    expect(io.observed).toEqual([a, b])
    expect(io.options).toEqual({ rootMargin: '0px' })
    io.cb?.([
      { isIntersecting: true, target: a },
      { isIntersecting: false, target: b },
    ])
    expect(a.has('is-in')).toBe(true)
    expect(b.has('is-in')).toBe(false)
    expect(io.unobserved).toEqual([a])
    stop()
    expect(io.disconnected).toBe(true)
  })
})

describe('applyStagger e initMotion', () => {
  it('escalona solo los hijos .reveal y respeta un --d propio', () => {
    const own = el(['reveal'])
    own.style.setProperty('--d', '500ms')
    const kids = [el(['reveal']), el(['other']), el(['reveal']), own]
    const group = el([], kids, { stagger: '60' })
    const plain = el([], [el(['reveal']), el(['reveal'])], { stagger: '' })
    applyStagger({ querySelectorAll: () => [group, plain] } as unknown as ParentNode)
    expect(kids[0].prop('--d')).toBe('0ms')
    expect(kids[1].prop('--d')).toBeUndefined()
    expect(kids[2].prop('--d')).toBe('60ms')
    expect(own.prop('--d')).toBe('500ms')
    expect(plain.children[1].prop('--d')).toBe('80ms')
  })
  it('initMotion agrega la clase js y observa los .reveal', () => {
    stubReducedMotion(false)
    const io = stubObserver()
    const html = el()
    const r = el(['reveal'])
    const doc = {
      documentElement: html,
      querySelectorAll: (sel: string) => (sel === '.reveal' ? [r] : []),
    }
    initMotion(doc as unknown as Document)
    expect(html.has('js')).toBe(true)
    expect(io.observed).toEqual([r])
  })
})

describe('withViewTransition', () => {
  it('usa View Transitions cuando existe', () => {
    stubReducedMotion(false)
    const update = vi.fn()
    const doc = { startViewTransition: vi.fn(function (this: unknown, u: () => void) { expect(this).toBe(doc); u() }) }
    withViewTransition(update, doc)
    expect(doc.startViewTransition).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
  })
  it('sin soporte o con "reducir movimiento" cambia al instante', () => {
    stubReducedMotion(true)
    const update = vi.fn()
    const doc = { startViewTransition: vi.fn() }
    withViewTransition(update, doc)
    expect(doc.startViewTransition).not.toHaveBeenCalled()
    stubReducedMotion(false)
    withViewTransition(update, {})
    withViewTransition(update, undefined)
    expect(update).toHaveBeenCalledTimes(3)
  })
})

describe('quietPageTransitions', () => {
  it('atiende las promesas de la transición en pageswap y pagereveal', async () => {
    const handlers = new Map<string, (e: Event) => void>()
    quietPageTransitions({ addEventListener: (type: string, fn: unknown) => void handlers.set(type, fn as (e: Event) => void) })
    expect([...handlers.keys()]).toEqual(['pageswap', 'pagereveal'])
    const ready = Promise.reject(new Error('Page already revealed'))
    const finished = { catch: vi.fn() }
    handlers.get('pageswap')?.({ viewTransition: { ready, finished } } as unknown as Event)
    expect(finished.catch).toHaveBeenCalledOnce()
    await expect(ready).rejects.toThrow('Page already revealed')
    handlers.get('pagereveal')?.({ viewTransition: null } as unknown as Event)
    handlers.get('pagereveal')?.({ viewTransition: { ready: {} } } as unknown as Event)
  })
  it('sin ventana no hace nada', () => {
    expect(() => quietPageTransitions(undefined)).not.toThrow()
  })
})
