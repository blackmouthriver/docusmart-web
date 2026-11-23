// W-147.1: cuándo la cámara en vivo toma la foto sola.
import { describe, expect, it } from 'vitest'
import { MIN_AREA, REARM_DISTANCE, STEADY_FRAMES, afterManual, initialLive, quadArea, quadDistance, stepLive, type LiveState } from '../../../../../src/features/scan/core/liveCapture'
import { insetQuad, type Quad } from '../../../../../src/features/scan/core/scan'

const page = insetQuad(0.2)
const shift = (q: Quad, dx: number, dy = 0): Quad => q.map((p) => ({ x: p.x + dx, y: p.y + dy })) as Quad

/** Pasa `n` cuadros con la misma hoja y devuelve el último paso. */
function run(s: LiveState, frames: Array<Quad | null>) {
  let step = stepLive(s, frames[0])
  for (const q of frames.slice(1)) step = stepLive(step.state, q)
  return step
}

describe('medidas de la hoja', () => {
  it('distancia entre esquinas y área', () => {
    expect(quadDistance(page, page)).toBe(0)
    expect(quadDistance(page, shift(page, 0.03, 0.04))).toBeCloseTo(0.05)
    expect(quadArea(insetQuad(0))).toBeCloseTo(1)
    expect(quadArea(page)).toBeCloseTo(0.36)
  })
})

describe('captura automática', () => {
  it('toma la foto cuando la hoja se queda quieta y no la repite', () => {
    const frames = Array.from({ length: STEADY_FRAMES + 1 }, () => page)
    const before = run(initialLive(), frames.slice(0, -1))
    expect(before.capture).toBe(false)
    expect(before.status).toBe('hold')
    expect(before.progress).toBeCloseTo((STEADY_FRAMES - 1) / STEADY_FRAMES)
    const shot = stepLive(before.state, page)
    expect(shot.capture).toBe(true)
    expect(shot.status).toBe('next')
    // La misma hoja sigue ahí: no se toma otra.
    const again = run(shot.state, Array.from({ length: STEADY_FRAMES * 3 }, () => page))
    expect(again.capture).toBe(false)
    expect(again.status).toBe('next')
  })

  it('un temblor pequeño cuenta como quieta; moverla reinicia la cuenta', () => {
    const jitter = run(initialLive(), [page, shift(page, 0.01), page, shift(page, -0.01)])
    expect(jitter.state.steady).toBe(3)
    expect(stepLive(jitter.state, shift(page, 0.06)).state.steady).toBe(0)
  })

  it('al sacar la hoja o cambiarla de lugar se puede tomar la siguiente', () => {
    const steady = Array.from({ length: STEADY_FRAMES + 1 }, () => page)
    const first = run(initialLive(), steady)
    expect(first.capture).toBe(true)
    // Sin hoja: vuelve a buscar.
    const gone = stepLive(first.state, null)
    expect(gone.state.armed).toBe(true)
    expect(gone.status).toBe('next')
    expect(run(gone.state, steady).capture).toBe(true)
    // Otra hoja en otro lugar, sin sacar la primera de la vista.
    const moved = shift(page, REARM_DISTANCE + 0.02)
    expect(run(first.state, Array.from({ length: STEADY_FRAMES + 1 }, () => moved)).capture).toBe(true)
  })

  it('una hoja muy chica o ninguna no se toma', () => {
    const tiny = insetQuad(0.5 - Math.sqrt(MIN_AREA) / 2 + 0.02)
    expect(quadArea(tiny)).toBeLessThan(MIN_AREA)
    const r = run(initialLive(), Array.from({ length: STEADY_FRAMES * 2 }, () => tiny))
    expect(r.capture).toBe(false)
    expect(r.status).toBe('searching')
    expect(stepLive(initialLive(), null).status).toBe('searching')
  })

  it('después de una foto a mano no se toma otra sola de la misma hoja', () => {
    const s = afterManual(stepLive(initialLive(), page).state, page)
    expect(run(s, Array.from({ length: STEADY_FRAMES * 2 }, () => page)).capture).toBe(false)
    // Sin hoja detectada se usa la última vista.
    expect(afterManual({ ...initialLive(), last: page }, null).captured).toEqual(page)
  })
})
