/**
 * Historial de códigos QR (W-87), como QrHistoryLogic de la app: los QR creados y leídos,
 * solo en este navegador. La vista previa nunca muestra el contenido protegido, la clave
 * Wi-Fi ni los datos de un contacto (solo el nombre de la red o de la persona).
 */
import { parseContact, parseWifi, type ReadType } from './qrContent'

export type QrHistoryKind = ReadType | 'protected'
export type QrHistoryEntry = {
  id: string
  source: 'created' | 'scanned'
  /** Contenido exacto del QR (en un QR protegido, el texto cifrado). */
  payload: string
  kind: QrHistoryKind
  at: number
  /** Color con el que se creó (para volver a dibujarlo igual). */
  color?: string
}

export const MAX_HISTORY = 50

/** Agrega una entrada primero; si el mismo QR ya estaba (mismo contenido y origen), lo sube. */
export function addEntry(list: readonly QrHistoryEntry[], entry: QrHistoryEntry, max = MAX_HISTORY): QrHistoryEntry[] {
  return [entry, ...list.filter((e) => !(e.payload === entry.payload && e.source === entry.source))].slice(0, max)
}

export const removeEntry = (list: readonly QrHistoryEntry[], id: string) => list.filter((e) => e.id !== id)

const KINDS = new Set(['url', 'email', 'phone', 'wifi', 'contact', 'event', 'text', 'protected'])

export function parseHistory(json: string | null): QrHistoryEntry[] {
  let raw: unknown
  try {
    raw = JSON.parse(json ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is QrHistoryEntry =>
      !!e && typeof e === 'object' && typeof e.id === 'string' && (e.source === 'created' || e.source === 'scanned') && typeof e.payload === 'string' && !!e.payload && KINDS.has(e.kind) && Number.isFinite(e.at),
  )
}

export type HistoryPreview = { kind: 'protected' } | { kind: 'wifi'; ssid: string | null } | { kind: 'contact'; name: string | null } | { kind: 'plain'; text: string }

/** Qué se puede mostrar en la lista sin revelar datos sensibles. */
export function previewOf(e: Pick<QrHistoryEntry, 'kind' | 'payload'>, maxLength = 120): HistoryPreview {
  if (e.kind === 'protected') return { kind: 'protected' }
  if (/^\s*WIFI:/i.test(e.payload)) return { kind: 'wifi', ssid: parseWifi(e.payload)?.ssid.trim() || null }
  if (/BEGIN:VCARD/i.test(e.payload)) return { kind: 'contact', name: parseContact(e.payload)?.name.trim() || null }
  const text = e.payload.replace(/\s+/g, ' ').trim()
  return { kind: 'plain', text: text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text }
}
