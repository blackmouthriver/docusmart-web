/**
 * Preferencias del asistente que la persona elige en Ajustes. Se guardan en este navegador; si no hay
 * almacenamiento (modo privado estricto), se usa el valor por defecto.
 */
const NEXT_KEY = 'ds-assistant-next'

/** W-151.7: al terminar una herramienta, el asistente sugiere el siguiente paso (por defecto, sí). */
export function nextStepsEnabled(): boolean {
  try {
    return localStorage.getItem(NEXT_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setNextStepsEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(NEXT_KEY)
    else localStorage.setItem(NEXT_KEY, 'off')
  } catch {
    /* sin almacenamiento: vale solo mientras la página siga abierta */
  }
}
