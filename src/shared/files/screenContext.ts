/**
 * Contexto de la pantalla para el asistente (W-151.6): qué archivos eligió la persona y cuál fue el último
 * error, para responder «¿por qué no me deja?» con la causa y la solución (contraseña → Desbloquear PDF;
 * dañado → Reparar PDF).
 *
 * Solo se guarda el nombre, el tipo y el tamaño de cada archivo: nunca su contenido. Todo queda en la
 * memoria de la pestaña (no se guarda ni se envía, tampoco a la analítica) y vale solo para la pantalla
 * donde ocurrió.
 */

import { signalMood } from '../platform/mood'

export type ScreenFile = { name: string; type: string; size: number }
/** `entry`: respuesta de la base que explica y resuelve el error (null si no hay una específica). */
export type ScreenError = { entry: string | null; message: string }
/**
 * Resultado listo en la pantalla (W-151.7): de qué herramienta salió y cómo abrir la siguiente con él. El
 * archivo no se guarda aquí: `open` es la misma acción de «¿Y ahora?» (W-110), que ya lo tiene.
 */
export type ScreenResult = { toolName: string; kind: string; open: (toolKey: string) => void }
export type ScreenSnapshot = { files: ScreenFile[]; error: ScreenError | null; result: ScreenResult | null }

/** Un error deja de ser «el último» a los 10 minutos. */
export const SCREEN_ERROR_MAX_AGE_MS = 10 * 60_000

let state: { where: string; files: ScreenFile[]; error: (ScreenError & { at: number }) | null; result: ScreenResult | null } = { where: '', files: [], error: null, result: null }

/** La pantalla actual (página y, en la app, la ruta del hash). */
const here = () => (typeof location === 'undefined' ? '' : location.pathname + location.hash)

/** Archivos que la persona acaba de elegir (borra el error anterior: es un intento nuevo). */
export function reportFiles(files: readonly File[]): void {
  state = { where: here(), files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })), error: null, result: null }
}

/** Error que se le mostró a la persona en esta pantalla. */
export function reportError(entry: string | null, message: string, now = Date.now()): void {
  const where = here()
  state = { where, files: state.where === where ? state.files : [], error: { entry, message, at: now }, result: null }
  signalMood('error')
}

/** Lo que se sabe de la pantalla actual (vacío si cambió de pantalla). */
export function screenSnapshot(now = Date.now()): ScreenSnapshot {
  if (state.where !== here()) return { files: [], error: null, result: null }
  const fresh = state.error && now - state.error.at <= SCREEN_ERROR_MAX_AGE_MS
  return { files: state.files, error: fresh ? { entry: state.error!.entry, message: state.error!.message } : null, result: state.result }
}

/** Una herramienta terminó y su resultado está a la vista (W-151.7). null: ya no lo está. */
export function reportResult(result: ScreenResult | null): void {
  const where = here()
  state = { ...state, where, files: state.where === where ? state.files : [], result }
  if (result) signalMood('success')
}

/** Solo para pruebas. */
export function resetScreenContext(): void {
  state = { where: '', files: [], error: null, result: null }
}
