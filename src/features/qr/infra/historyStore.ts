/**
 * Historial de QR (W-87) en localStorage de este navegador, compartido por Crear y Leer
 * (que lo registran) y la vista Historial (que lo muestra al instante).
 */
import { addEntry, parseHistory, removeEntry, type QrHistoryEntry } from '../core/qrHistory'

const KEY = 'ds-qr-history'
const listeners = new Set<() => void>()
let cache: QrHistoryEntry[] | null = null

export function getQrHistory(): QrHistoryEntry[] {
  if (cache) return cache
  try {
    cache = parseHistory(localStorage.getItem(KEY))
  } catch {
    cache = []
  }
  return cache
}

function save(next: QrHistoryEntry[]) {
  cache = next
  try {
    if (next.length) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    /* almacenamiento bloqueado: queda solo por esta visita */
  }
  listeners.forEach((l) => l())
}

export const recordQr = (e: Omit<QrHistoryEntry, 'id' | 'at'>) => save(addEntry(getQrHistory(), { ...e, id: crypto.randomUUID(), at: Date.now() }))
export const forgetQr = (id: string) => save(removeEntry(getQrHistory(), id))
export const clearQrHistory = () => save([])

export function subscribeQrHistory(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
