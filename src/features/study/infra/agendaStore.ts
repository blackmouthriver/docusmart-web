/**
 * Eventos de la Agenda (W-126): viven en localStorage (solo en este navegador) y avisan a quien
 * escucha cuando cambian, así la Agenda y los recordatorios de la app comparten los mismos datos.
 * También aquí: los recordatorios mientras DocuSmart está abierto.
 */
import { dueReminders, parseEvents, type AgendaEvent } from '../core/agenda'

const KEY = 'ds-agenda'
const FIRED_KEY = 'ds-agenda-fired'
const listeners = new Set<() => void>()
let cache: AgendaEvent[] | null = null
let saveFailed = false

export function getEvents(): AgendaEvent[] {
  if (cache) return cache
  try {
    cache = parseEvents(localStorage.getItem(KEY))
  } catch {
    cache = []
  }
  return cache
}

/** Guarda la lista; devuelve false si el navegador no dejó guardarla (quedan solo por esta visita). */
export function setEvents(list: AgendaEvent[]): boolean {
  cache = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    saveFailed = false
  } catch {
    saveFailed = true
  }
  listeners.forEach((l) => l())
  return !saveFailed
}

export const lastSaveFailed = () => saveFailed

/** Para useSyncExternalStore. */
export function subscribeEvents(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** ¿Hay algún evento con aviso? (para no cargar nada si no hace falta). */
export function hasReminders(): boolean {
  return getEvents().some((e) => e.reminder !== null)
}

function readFired(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) ?? '[]') as unknown
    return new Set(Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveFired(fired: Set<string>) {
  try {
    // Solo los últimos, para no crecer sin fin.
    localStorage.setItem(FIRED_KEY, JSON.stringify([...fired].slice(-300)))
  } catch {
    /* sin almacenamiento: puede repetirse un aviso al recargar */
  }
}

export type ReminderNotice = { title: string; body: string }

let timer: number | undefined

/**
 * Revisa cada 30 segundos si toca algún aviso y llama a `notify` (una vez por evento y día).
 * Funciona solo mientras la página está abierta: la web no tiene servidor que mande avisos.
 */
export function startReminders(notify: (event: AgendaEvent, date: string) => void): () => void {
  const check = () => {
    const fired = readFired()
    const due = dueReminders(getEvents(), new Date(), fired)
    if (!due.length) return
    for (const d of due) {
      fired.add(d.key)
      notify(d.occ.event, d.occ.date)
    }
    saveFired(fired)
  }
  window.clearInterval(timer)
  check()
  timer = window.setInterval(check, 30_000)
  const onChange = () => check()
  listeners.add(onChange)
  return () => {
    window.clearInterval(timer)
    listeners.delete(onChange)
  }
}
