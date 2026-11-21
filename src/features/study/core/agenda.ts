/**
 * Agenda del Modo Estudio (W-126): eventos y recordatorios guardados solo en este navegador,
 * con exportar e importar .ics (iCalendar, RFC 5545), el formato que abren Outlook, Google
 * Calendar y el calendario del iPhone. Partes puras, para poder probarlas.
 */

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export const REPEATS: readonly Repeat[] = ['none', 'daily', 'weekly', 'monthly', 'yearly']
/** Aviso: minutos antes del inicio (0 = a la hora). */
export const REMINDERS = [null, 0, 10, 30, 60, 1440] as const
export type Reminder = (typeof REMINDERS)[number]

export type AgendaEvent = {
  id: string
  title: string
  /** Fecha "AAAA-MM-DD" (hora local). */
  date: string
  /** Hora "HH:MM" (hora local) o null si dura todo el día. */
  time: string | null
  /** Duración en minutos (los de todo el día duran el día). */
  minutes: number
  repeat: Repeat
  reminder: Reminder
  notes: string
  createdAt: number
  updatedAt: number
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const isReminder = (v: unknown): v is Reminder => (REMINDERS as readonly unknown[]).includes(v)

/** ¿Una fecha "AAAA-MM-DD" real? (rechaza el 31 de febrero). */
export function isValidDate(date: string): boolean {
  if (!DATE.test(date)) return false
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d
}

/** Lista guardada a lista válida (descarta lo dañado). */
export function parseEvents(json: string | null): AgendaEvent[] {
  let raw: unknown
  try {
    raw = JSON.parse(json ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  const out: AgendaEvent[] = []
  for (const e of raw) {
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || typeof e.title !== 'string' || typeof e.date !== 'string' || !isValidDate(e.date)) continue
    out.push({
      id: e.id,
      title: e.title,
      date: e.date,
      time: typeof e.time === 'string' && TIME.test(e.time) ? e.time : null,
      minutes: Number.isFinite(e.minutes) && e.minutes > 0 ? Math.min(e.minutes, 24 * 60 * 14) : 60,
      repeat: REPEATS.includes(e.repeat) ? e.repeat : 'none',
      reminder: isReminder(e.reminder) ? e.reminder : null,
      notes: typeof e.notes === 'string' ? e.notes : '',
      createdAt: Number.isFinite(e.createdAt) ? e.createdAt : 0,
      updatedAt: Number.isFinite(e.updatedAt) ? e.updatedAt : 0,
    })
  }
  return out
}

/** Agrega o reemplaza un evento. */
export const upsertEvent = (list: readonly AgendaEvent[], e: AgendaEvent): AgendaEvent[] => [...list.filter((x) => x.id !== e.id), e]

/** Inicio del evento (o de su repetición en `date`) como fecha local. */
export function startOf(e: Pick<AgendaEvent, 'time'>, date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = e.time ? e.time.split(':').map(Number) : [0, 0]
  return new Date(y, m - 1, d, hh, mm)
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0')
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Suma meses sin desbordar: el 31 de enero + 1 mes es el 28/29 de febrero. */
function addMonths(base: Date, months: number, day: number): Date {
  const t = new Date(base.getFullYear(), base.getMonth() + months, 1, base.getHours(), base.getMinutes())
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  t.setDate(Math.min(day, last))
  return t
}

/** Fecha de la repetición número `n` (0 = la original). */
export function nthDate(e: Pick<AgendaEvent, 'date' | 'repeat' | 'time'>, n: number): string {
  const s = startOf(e, e.date)
  const day = s.getDate()
  if (e.repeat === 'daily') return dateKey(new Date(s.getFullYear(), s.getMonth(), day + n))
  if (e.repeat === 'weekly') return dateKey(new Date(s.getFullYear(), s.getMonth(), day + 7 * n))
  if (e.repeat === 'monthly') return dateKey(addMonths(s, n, day))
  if (e.repeat === 'yearly') return dateKey(addMonths(s, 12 * n, day))
  return e.date
}

export type Occurrence = { event: AgendaEvent; date: string; start: Date; end: Date }

/**
 * Las veces que ocurren los eventos entre `from` y `to` (incluidas las repeticiones), ordenadas.
 * Un evento cuenta si todavía no terminó en `from`.
 */
export function occurrences(events: readonly AgendaEvent[], from: Date, to: Date, limit = 200): Occurrence[] {
  const out: Occurrence[] = []
  for (const e of events) {
    const length = e.time ? e.minutes : 24 * 60
    for (let n = 0; n < 5000; n++) {
      const date = nthDate(e, n)
      const start = startOf(e, date)
      if (start > to) break
      const end = new Date(start.getTime() + length * 60_000)
      if (end > from) out.push({ event: e, date, start, end })
      if (e.repeat === 'none') break
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || a.event.title.localeCompare(b.event.title)).slice(0, limit)
}

/** Avisos que tocan ahora: ocurrencias cuyo momento de aviso ya pasó (hace menos de `window` ms) y no se avisaron. */
export function dueReminders(events: readonly AgendaEvent[], now: Date, fired: ReadonlySet<string>, window = 10 * 60_000): Array<{ key: string; occ: Occurrence }> {
  const out: Array<{ key: string; occ: Occurrence }> = []
  const ahead = new Date(now.getTime() + 2 * 24 * 60 * 60_000)
  for (const occ of occurrences(events.filter((e) => e.reminder !== null), new Date(now.getTime() - window), ahead)) {
    const at = occ.start.getTime() - (occ.event.reminder ?? 0) * 60_000
    const key = `${occ.event.id}@${occ.date}`
    if (at <= now.getTime() && now.getTime() - at < window && !fired.has(key)) out.push({ key, occ })
  }
  return out
}

/* ───────────── iCalendar (.ics) ───────────── */

/** Texto escapado para iCalendar: barras, comas, punto y coma y saltos de línea. */
export const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
export const unescapeText = (s: string) => s.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))

/** Corta una línea a 75 bytes como pide el estándar (sin partir caracteres UTF-8). */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  const parts: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    const max = parts.length ? 74 : 75 // las continuaciones empiezan con un espacio
    if (bytes + n > max) {
      parts.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

const nextDay = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + 1))
}
const utcStamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
const compactDate = (date: string) => date.replace(/-/g, '')
const RRULE: Record<Exclude<Repeat, 'none'>, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }

/** Calendario .ics con los eventos (horas en UTC, así cada calendario las muestra en su zona). */
export function toIcs(events: readonly AgendaEvent[], now: Date, domain = 'docusmart.online'): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DocuSmart//Agenda//ES', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@${domain}`, `DTSTAMP:${utcStamp(now)}`)
    if (e.time) {
      const start = startOf(e, e.date)
      lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(new Date(start.getTime() + e.minutes * 60_000))}`)
    } else {
      // En iCalendar el fin de un evento de todo el día es el día siguiente (no incluido).
      lines.push(`DTSTART;VALUE=DATE:${compactDate(e.date)}`, `DTEND;VALUE=DATE:${compactDate(nextDay(e.date))}`)
    }
    lines.push(`SUMMARY:${escapeText(e.title)}`)
    if (e.notes.trim()) lines.push(`DESCRIPTION:${escapeText(e.notes.trim())}`)
    if (e.repeat !== 'none') lines.push(`RRULE:FREQ=${RRULE[e.repeat]}`)
    if (e.reminder !== null) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.title)}`, `TRIGGER:${e.reminder ? `-PT${e.reminder}M` : 'PT0S'}`, 'END:VALARM')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

type Prop = { name: string; params: Record<string, string>; value: string }

/** Líneas desplegadas ("unfolding") y separadas en nombre, parámetros y valor. */
function props(text: string): Prop[] {
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '')
  const out: Prop[] = []
  for (const line of unfolded.split('\n')) {
    const colon = line.indexOf(':')
    if (colon < 1) continue
    const [name, ...rest] = line.slice(0, colon).split(';')
    const params: Record<string, string> = {}
    for (const p of rest) {
      const eq = p.indexOf('=')
      if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1)
    }
    out.push({ name: name.toUpperCase(), params, value: line.slice(colon + 1) })
  }
  return out
}

/** "20261121", "20261121T150000" (hora local o con zona) o "20261121T150000Z" (UTC) → fecha y hora locales. */
function parseIcsDate(p: Prop): { date: string; time: string | null } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(p.value.trim())
  if (!m) return null
  const [, y, mo, d, hh, mm, , z] = m
  if (!hh || p.params.VALUE === 'DATE') return isValidDate(`${y}-${mo}-${d}`) ? { date: `${y}-${mo}-${d}`, time: null } : null
  // UTC se pasa a la hora de este equipo; con TZID (o sin zona) se toma tal cual, como hora local.
  const t = z ? new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm)) : new Date(+y, +mo - 1, +d, +hh, +mm)
  return { date: dateKey(t), time: `${pad(t.getHours())}:${pad(t.getMinutes())}` }
}

/** "PT1H30M", "P1D", "-PT15M" → minutos (con su signo). */
export function durationMinutes(value: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim())
  if (!m || value.trim().replace(/^[+-]/, '') === 'P') return null
  const [, sign, w, d, h, min] = m
  const total = (+(w ?? 0)) * 7 * 1440 + (+(d ?? 0)) * 1440 + (+(h ?? 0)) * 60 + +(min ?? 0)
  return sign === '-' ? -total : total
}

const nearestReminder = (minutesBefore: number): Reminder => {
  const options = REMINDERS.filter((r): r is Exclude<Reminder, null> => r !== null)
  return options.reduce((best, r) => (Math.abs(r - minutesBefore) < Math.abs(best - minutesBefore) ? r : best), options[0])
}

/**
 * Eventos de un .ics (de Outlook, Google Calendar, el iPhone…). Toma lo que la agenda sabe
 * guardar: título, inicio, duración, notas, repetición simple y el primer aviso.
 */
export function parseIcs(text: string, now: number, newId: () => string): AgendaEvent[] {
  const out: AgendaEvent[] = []
  let cur: Prop[] | null = null
  let inAlarm = false
  let trigger: string | null = null
  for (const p of props(text)) {
    if (p.name === 'BEGIN' && p.value.toUpperCase() === 'VEVENT') {
      cur = []
      trigger = null
    } else if (p.name === 'BEGIN' && p.value.toUpperCase() === 'VALARM') inAlarm = true
    else if (p.name === 'END' && p.value.toUpperCase() === 'VALARM') inAlarm = false
    else if (p.name === 'TRIGGER' && inAlarm && trigger === null) trigger = p.value
    else if (p.name === 'END' && p.value.toUpperCase() === 'VEVENT' && cur) {
      const get = (n: string) => cur!.find((x) => x.name === n)
      const dtstart = get('DTSTART')
      const start = dtstart && parseIcsDate(dtstart)
      if (start) {
        const dtend = get('DTEND')
        const end = dtend && parseIcsDate(dtend)
        let minutes = 60
        const dur = get('DURATION') && durationMinutes(get('DURATION')!.value)
        if (dur && dur > 0) minutes = dur
        else if (end && start.time && end.time) minutes = Math.max(1, Math.round((startOf(end, end.date).getTime() - startOf(start, start.date).getTime()) / 60_000))
        const freq = /FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i.exec(get('RRULE')?.value ?? '')?.[1].toLowerCase() as Repeat | undefined
        const before = trigger !== null ? durationMinutes(trigger) : null
        out.push({
          id: get('UID')?.value.replace(/@docusmart\.online$/, '') || newId(),
          title: unescapeText(get('SUMMARY')?.value ?? '').trim() || '—',
          date: start.date,
          time: start.time,
          minutes: Math.min(minutes, 24 * 60 * 14),
          repeat: freq ?? 'none',
          reminder: before === null ? null : nearestReminder(Math.max(0, -before)),
          notes: unescapeText(get('DESCRIPTION')?.value ?? '').trim(),
          createdAt: now,
          updatedAt: now,
        })
      }
      cur = null
    } else if (cur && !inAlarm) cur.push(p)
  }
  return out
}

/** Une los importados con los existentes: un mismo UID reemplaza al anterior. Devuelve también cuántos son nuevos. */
export function mergeImported(list: readonly AgendaEvent[], imported: readonly AgendaEvent[]): { list: AgendaEvent[]; added: number; updated: number } {
  let next = [...list]
  let added = 0
  let updated = 0
  for (const e of imported) {
    if (next.some((x) => x.id === e.id)) updated++
    else added++
    next = upsertEvent(next, e)
  }
  return { list: next, added, updated }
}

/** Nombre del archivo .ics: el título del evento (o "agenda" si son todos). */
export function icsName(events: readonly AgendaEvent[], allLabel: string): string {
  const base = events.length === 1 ? events[0].title.trim() || allLabel : allLabel
  return `${base.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60)}.ics`
}
