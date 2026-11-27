/**
 * Contexto de la pantalla para el asistente (W-151.6): qué archivos eligió la persona y cuál fue el último
 * error, para responder «¿por qué no me deja?» con la causa y la solución (contraseña → Desbloquear PDF;
 * dañado → Reparar PDF).
 *
 * Solo se guarda el nombre, el tipo y el tamaño de cada archivo: nunca su contenido. Todo queda en la
 * memoria de la pestaña (no se guarda ni se envía, tampoco a la analítica) y vale solo para la pantalla
 * donde ocurrió.
 */

export type ScreenFile = { name: string; type: string; size: number }
/** `entry`: respuesta de la base que explica y resuelve el error (null si no hay una específica). */
export type ScreenError = { entry: string | null; message: string }
export type ScreenSnapshot = { files: ScreenFile[]; error: ScreenError | null }

/** Un error deja de ser «el último» a los 10 minutos. */
export const SCREEN_ERROR_MAX_AGE_MS = 10 * 60_000

let state: { where: string; files: ScreenFile[]; error: (ScreenError & { at: number }) | null } = { where: '', files: [], error: null }

/** La pantalla actual (página y, en la app, la ruta del hash). */
const here = () => (typeof location === 'undefined' ? '' : location.pathname + location.hash)

/** Archivos que la persona acaba de elegir (borra el error anterior: es un intento nuevo). */
export function reportFiles(files: readonly File[]): void {
  state = { where: here(), files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })), error: null }
}

/** Error que se le mostró a la persona en esta pantalla. */
export function reportError(entry: string | null, message: string, now = Date.now()): void {
  const where = here()
  state = { where, files: state.where === where ? state.files : [], error: { entry, message, at: now } }
}

/** Lo que se sabe de la pantalla actual (vacío si cambió de pantalla). */
export function screenSnapshot(now = Date.now()): ScreenSnapshot {
  if (state.where !== here()) return { files: [], error: null }
  const fresh = state.error && now - state.error.at <= SCREEN_ERROR_MAX_AGE_MS
  return { files: state.files, error: fresh ? { entry: state.error!.entry, message: state.error!.message } : null }
}

/** Solo para pruebas. */
export function resetScreenContext(): void {
  state = { where: '', files: [], error: null }
}
