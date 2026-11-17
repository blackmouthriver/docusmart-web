/**
 * Estadísticas de estudio (W-66) en localStorage, compartidas por Lectura y Pomodoro
 * (que las registran) y la vista de Estadísticas (que las muestra al instante).
 */
import { addPomodoro, addReading, parseStats, type StudyStats } from '../core/stats'

const KEY = 'ds-study-stats'
const listeners = new Set<() => void>()
let cache: StudyStats | null = null

export function getStats(): StudyStats {
  if (cache) return cache
  try {
    cache = parseStats(localStorage.getItem(KEY))
  } catch {
    cache = parseStats(null)
  }
  return cache
}

function save(next: StudyStats) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* almacenamiento bloqueado: quedan solo por esta visita */
  }
  listeners.forEach((l) => l())
}

export const recordReading = (ms: number) => save(addReading(getStats(), ms))
export const recordPomodoro = (at = Date.now()) => save(addPomodoro(getStats(), at))

export function subscribeStats(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
