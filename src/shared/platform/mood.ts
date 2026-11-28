/**
 * Señales de la pantalla para Smarthy, el asistente animado (W-153): un proceso empieza o termina, sale
 * un resultado o un error. Solo el tipo de señal: nunca nombres de archivo ni contenido.
 *
 * Es un evento del navegador para que `shared` no dependa del asistente (que vive en `features`).
 */
export type MoodSignal = 'busy-start' | 'busy-end' | 'success' | 'error'

export const MOOD_EVENT = 'ds-mood'

export function signalMood(signal: MoodSignal): void {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return
  window.dispatchEvent(new CustomEvent<MoodSignal>(MOOD_EVENT, { detail: signal }))
}

/** Escucha las señales; devuelve cómo dejar de escuchar. */
export function onMood(listener: (signal: MoodSignal) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => listener((e as CustomEvent<MoodSignal>).detail)
  window.addEventListener(MOOD_EVENT, handler)
  return () => window.removeEventListener(MOOD_EVENT, handler)
}
