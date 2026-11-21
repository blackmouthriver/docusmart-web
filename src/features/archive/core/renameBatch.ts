/**
 * Renombrar varios archivos a la vez (W-111): buscar y reemplazar, texto al inicio o al final, numeración y
 * mayúsculas o minúsculas. Lógica pura: calcula los nombres nuevos; la pantalla muestra el resultado y arma el ZIP.
 * La extensión no se toca, los caracteres que los sistemas de archivos no aceptan se reemplazan y los nombres
 * repetidos se distinguen con " (2)", " (3)"…
 */
import { baseName, cleanBaseName, extensionOf } from '../../../shared/files/files'

export type CaseMode = 'keep' | 'lower' | 'upper'

export type RenameOptions = {
  /** Nombre nuevo que reemplaza todo el nombre original (la extensión se conserva); vacío = se parte del original. */
  newName: string
  /** Texto a buscar en el nombre (sin la extensión); vacío = no reemplaza. */
  find: string
  replace: string
  prefix: string
  suffix: string
  /** Agrega un número al final del nombre: "Foto 001". */
  numbering: boolean
  start: number
  /** Cifras del número, con ceros a la izquierda (1 a 6). */
  digits: number
  caseMode: CaseMode
}

export const DEFAULT_RENAME: RenameOptions = { newName: '', find: '', replace: '', prefix: '', suffix: '', numbering: false, start: 1, digits: 3, caseMode: 'keep' }

const MAX_DIGITS = 6
const MAX_START = 999_999

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.trunc(n) : min))

/** Nombre y extensión; un archivo oculto (".gitignore") no tiene extensión. */
function split(name: string): { base: string; ext: string } {
  const base = baseName(name)
  return base ? { base, ext: extensionOf(name) } : { base: name, ext: '' }
}

function applyCase(text: string, mode: CaseMode): string {
  return mode === 'lower' ? text.toLowerCase() : mode === 'upper' ? text.toUpperCase() : text
}

/** Nombres nuevos, en el mismo orden que los originales. */
export function renameAll(names: readonly string[], o: RenameOptions, fallback = 'archivo'): string[] {
  const digits = clamp(o.digits, 1, MAX_DIGITS)
  const start = clamp(o.start, 0, MAX_START)
  const taken = new Set<string>()
  return names.map((name, i) => {
    const { base, ext } = split(name)
    let next = o.newName || (o.find ? base.split(o.find).join(o.replace) : base)
    next = o.prefix + next + o.suffix
    next = applyCase(next, o.caseMode)
    if (o.numbering) next = `${next} ${String(start + i).padStart(digits, '0')}`
    const clean = cleanBaseName(next, fallback)
    let candidate = clean + ext
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${clean} (${n})${ext}`
    taken.add(candidate.toLowerCase())
    return candidate
  })
}

/** ¿Algún nombre cambia con estas opciones? */
export const changesAnything = (names: readonly string[], o: RenameOptions): boolean => renameAll(names, o).some((n, i) => n !== names[i])
