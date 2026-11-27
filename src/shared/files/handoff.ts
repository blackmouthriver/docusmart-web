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

/*
 * Flujos encadenados (W-110): el resultado de una herramienta pasa a la siguiente, sin saber de antemano cuál pantalla
 * lo va a pedir. A diferencia de `handOff` (que tiene destino fijo), aquí lo recoge la primera zona de carga que
 * acepte el archivo. Es de un solo uso y caduca, para que no quede colgado si el usuario no llega a otra herramienta.
 */

/** Cuánto vale un traspaso sin recoger (la otra pantalla se monta al instante; esto es solo un seguro). */
export const CHAIN_MAX_AGE_MS = 15_000

let chained: { files: File[]; at: number } | null = null

/** ¿El archivo cumple el atributo `accept` de un input de archivos ("application/pdf", "image/*", ".zip,.7z" o cualquiera)? */
export function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (!tokens.length) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return tokens.some((t) => {
    if (t === '*/*') return true
    if (t.startsWith('.')) return name.endsWith(t)
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1))
    return type === t
  })
}

/** Deja el archivo listo para la próxima zona de carga que lo acepte. */
export function setChainedFiles(files: File[], now = Date.now()): void {
  chained = files.length ? { files, at: now } : null
}

/**
 * Entrega (una sola vez) los archivos del traspaso que esta zona de carga acepta. Si ninguno encaja o ya caducó
 * no consume nada: otra zona de la misma pantalla puede aceptarlo.
 */
export function takeChainedFiles(accept: string, multiple: boolean, now = Date.now()): File[] | null {
  if (!chained) return null
  if (now - chained.at > CHAIN_MAX_AGE_MS) {
    chained = null
    return null
  }
  const files = chained.files.filter((f) => matchesAccept(f, accept))
  if (!files.length) return null
  chained = null
  return multiple ? files : files.slice(0, 1)
}

/** Descarta cualquier traspaso encadenado pendiente (para las pruebas). */
export function clearChainedFiles(): void {
  chained = null
}

/*
 * Abrir con DocuSmart Desktop (W-150.4): los archivos que el sistema le pasa a la app instalada esperan en la
 * pantalla "Abrir con" hasta que el usuario elige una herramienta (sin plazo: puede tardar en decidir).
 */
let opened: File[] = []

/** Avisa a la pantalla "Abrir con" si llegan archivos nuevos mientras ya está a la vista. */
export const OPENED_FILES_EVENT = 'ds-opened-files'

export function setOpenedFiles(files: File[], win: Window | undefined = typeof window === 'undefined' ? undefined : window): void {
  opened = files
  win?.dispatchEvent(new Event(OPENED_FILES_EVENT))
}

export const peekOpenedFiles = (): File[] => opened

export function clearOpenedFiles(): void {
  opened = []
}
