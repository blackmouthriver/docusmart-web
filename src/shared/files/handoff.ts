/**
 * Pasa un archivo de una pantalla de la app a otra (p. ej. de Lectura a Editar PDF)
 * sin volver a pedirlo. Queda en memoria, nunca sale del navegador, y la pantalla de
 * destino lo toma una sola vez.
 */

/** Pantalla de Editar PDF (ruta #/pdf/editar). */
export const EDIT_PDF = 'pdf/editar'

let pending: { target: string; file: File } | null = null

export function handOff(target: string, file: File): void {
  pending = { target, file }
}

/** El archivo dejado para esa pantalla, sin consumirlo (seguro en el doble render de React). */
export const peekHandOff = (target: string): File | null => (pending?.target === target ? pending.file : null)

/** Lo descarta una vez usado, para que no vuelva a aparecer al entrar de nuevo. */
export function clearHandOff(target: string): void {
  if (pending?.target === target) pending = null
}
