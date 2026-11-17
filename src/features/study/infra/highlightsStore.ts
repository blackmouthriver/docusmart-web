/**
 * Párrafos resaltados (W-63) compartidos entre Lectura y Notas: viven en localStorage
 * (solo en este navegador) y avisan a quien escucha cuando cambian, así Notas se
 * actualiza al instante aunque las dos vistas estén abiertas a la vez.
 */
import { parseHighlights, type Highlight } from '../core/highlights'

const KEY = 'ds-study-highlights'
const listeners = new Set<() => void>()
let cache: Highlight[] | null = null

export function getHighlights(): Highlight[] {
  if (cache) return cache
  try {
    cache = parseHighlights(localStorage.getItem(KEY))
  } catch {
    cache = []
  }
  return cache
}

export function setHighlights(list: Highlight[]): void {
  cache = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* almacenamiento lleno o bloqueado: quedan solo por esta visita */
  }
  listeners.forEach((l) => l())
}

/** Para useSyncExternalStore. */
export function subscribeHighlights(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
