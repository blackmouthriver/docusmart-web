/**
 * Plan de varios pasos del asistente (W-151.8): «une estos pdf y luego comprímelos a 1 mega». La persona lo
 * confirma una vez («Hacer») y después avanza paso a paso con «Continuar»: el resultado de cada paso pasa al
 * siguiente con el traspaso de W-110, y las opciones con la interfaz común de W-151.5.
 *
 * Se guarda en sessionStorage (solo esta pestaña, nunca en la URL) por 30 minutos y nunca con contraseñas. Si
 * un paso falla, el plan se detiene (`stopChain`).
 */
import type { Options } from '../../features/assistant/core/actions'

/** Un paso: la herramienta (slug), su pantalla en la app («pdf/comprimir») y las opciones del pedido. */
export type ChainStep = { tool: string; route: string; options?: Options }
type Stored = { steps: ChainStep[]; index: number; at: number }

const KEY = 'ds-assistant-chain'
export const CHAIN_MAX_AGE_MS = 30 * 60_000

const storage = (): Storage | null => {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}
const read = (now: number): Stored | null => {
  try {
    const raw = storage()?.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Stored
    return now - v.at <= CHAIN_MAX_AGE_MS && v.index < v.steps.length ? v : null
  } catch {
    return null
  }
}
const write = (v: Stored | null) => {
  try {
    if (v) storage()?.setItem(KEY, JSON.stringify(v))
    else storage()?.removeItem(KEY)
  } catch {
    /* sin almacenamiento: el plan llega solo hasta el primer paso */
  }
}

/** Empieza un plan (sin contraseñas). El primer paso lo abre quien lo llama. */
export function startChain(steps: ChainStep[], now = Date.now()): void {
  write({ steps: steps.map(({ options, ...s }) => ({ ...s, ...(options ? { options: withoutPassword(options) } : {}) })), index: 0, at: now })
}

const withoutPassword = (o: Options): Options => {
  const { password: _never, ...rest } = o
  return rest
}

/**
 * Si en esta pantalla terminó el paso actual del plan: en qué paso va, cuántos son y cuál sigue (null si era
 * el último).
 */
export function chainStepFor(route: string, now = Date.now()): { index: number; total: number; next: ChainStep | null } | null {
  const v = read(now)
  if (!v || v.steps[v.index].route !== route) return null
  return { index: v.index, total: v.steps.length, next: v.steps[v.index + 1] ?? null }
}

/** Pasa al paso siguiente (y termina el plan si era el último). Devuelve el paso al que se pasa. */
export function advanceChain(now = Date.now()): ChainStep | null {
  const v = read(now)
  if (!v) return null
  const index = v.index + 1
  if (index >= v.steps.length) {
    write(null)
    return null
  }
  write({ ...v, index, at: now })
  return v.steps[index]
}

/** Detiene el plan (un paso falló o la persona lo terminó). */
export function stopChain(): void {
  write(null)
}

/** ¿Hay un plan en marcha? */
export const chainActive = (now = Date.now()): boolean => read(now) !== null
