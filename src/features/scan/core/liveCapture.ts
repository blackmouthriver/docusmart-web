/**
 * Cámara en vivo del escáner (W-147.1): decide cuándo tomar la foto sola. Se analiza un cuadro
 * cada poco tiempo con detectDocument; si la hoja aparece y se queda quieta unos cuadros, se
 * toma la foto. Después hay que cambiar de hoja (sacarla o moverla) para que se tome otra, así
 * no se repite la misma página.
 */
import type { Quad } from './scan'

/** Cuadros quietos seguidos antes de tomar la foto (~1 s con un análisis cada 120 ms). */
export const STEADY_FRAMES = 8
/** Cuánto se puede mover una esquina entre dos cuadros y seguir "quieta" (fracción de la imagen). */
export const STEADY_TOLERANCE = 0.02
/** Cuánto tiene que moverse la hoja después de una foto para que se tome otra. */
export const REARM_DISTANCE = 0.12
/** Área mínima de la hoja (fracción de la imagen) para tomar la foto sola. */
export const MIN_AREA = 0.15

/** La mayor distancia entre esquinas correspondientes. */
export function quadDistance(a: Quad, b: Quad): number {
  let max = 0
  for (let i = 0; i < 4; i++) max = Math.max(max, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y))
  return max
}

/** Área del cuadrilátero (fórmula del zapatero), en fracción de la imagen. */
export function quadArea(q: Quad): number {
  let s = 0
  for (let i = 0; i < 4; i++) {
    const a = q[i]
    const b = q[(i + 1) % 4]
    s += a.x * b.y - b.x * a.y
  }
  return Math.abs(s) / 2
}

export type LiveState = {
  /** Esquinas del cuadro anterior. */
  last: Quad | null
  /** Cuadros quietos seguidos. */
  steady: number
  /** Si se puede tomar la próxima foto sola. */
  armed: boolean
  /** Dónde estaba la hoja en la última foto. */
  captured: Quad | null
}

export const initialLive = (): LiveState => ({ last: null, steady: 0, armed: true, captured: null })

export type LiveStatus = 'searching' | 'hold' | 'next'

export type LiveStep = {
  state: LiveState
  /** Tomar la foto ahora. */
  capture: boolean
  /** Avance hacia la foto (0 a 1), para mostrarlo. */
  progress: number
  status: LiveStatus
}

/** Un cuadro más: `quad` es la hoja detectada, o null si no se ve. */
export function stepLive(s: LiveState, quad: Quad | null): LiveStep {
  if (!quad || quadArea(quad) < MIN_AREA) {
    // Sin hoja: la próxima que aparezca ya es otra página.
    const state = { ...s, last: null, steady: 0, armed: true }
    return { state, capture: false, progress: 0, status: s.armed || !s.captured ? 'searching' : 'next' }
  }
  const armed = s.armed || (s.captured !== null && quadDistance(quad, s.captured) > REARM_DISTANCE)
  const steady = s.last && quadDistance(quad, s.last) <= STEADY_TOLERANCE ? s.steady + 1 : 0
  if (!armed) return { state: { ...s, last: quad, steady: 0, armed }, capture: false, progress: 0, status: 'next' }
  if (steady >= STEADY_FRAMES) return { state: { last: quad, steady: 0, armed: false, captured: quad }, capture: true, progress: 1, status: 'next' }
  return { state: { ...s, last: quad, steady, armed }, capture: false, progress: steady / STEADY_FRAMES, status: 'hold' }
}

/** Después de una foto a mano: no tomar otra sola de la misma hoja. */
export const afterManual = (s: LiveState, quad: Quad | null): LiveState => ({ ...s, steady: 0, armed: false, captured: quad ?? s.last })
