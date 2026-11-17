/**
 * Contenido de los códigos QR por tipo (W-83), port de QrContentFormat.kt de la app:
 * los mismos formatos estándar que reconocen la cámara del celular, Google Lens y la
 * app (WIFI:, vCard 3.0, iCalendar VEVENT, mailto:, tel:) y las mismas reglas de escape.
 */

export type WifiSecurity = 'WPA' | 'WEP' | 'NONE'
export type WifiContent = { ssid: string; password: string; security: WifiSecurity }
export type ContactContent = { name: string; phone: string; email: string }
/** Fechas en hora local "flotante" (sin zona), como la app: `YYYY-MM-DDTHH:mm[:ss]`. */
export type EventContent = { title: string; location: string; start: string; end: string }

const CRLF = '\r\n'

/** `\ ; , : "` son separadores del formato WIFI: y se escapan con `\`. */
export const escapeWifiField = (v: string) => v.replace(/[\\;,:"]/g, (c) => `\\${c}`)

/** vCard e iCalendar escapan `\ ; ,` y los saltos de línea (no `:`). */
export const escapeVCardField = (v: string) =>
  v
    .replace(/\r\n?/g, '\n')
    .replace(/[\\;,]/g, (c) => `\\${c}`)
    .replace(/\n/g, '\\n')

/** Reverso de los dos escapes, en una sola pasada (un `\\n` literal no se confunde con un salto). */
export const unescapeReservedField = (v: string) =>
  v.replace(/\\(\\|;|,|:|"|n|N)/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))

export function wifiPayload(w: WifiContent): string {
  const type = w.security === 'NONE' ? 'nopass' : w.security
  const pass = w.security === 'NONE' ? '' : `P:${escapeWifiField(w.password)};`
  return `WIFI:T:${type};S:${escapeWifiField(w.ssid)};${pass};`
}

export function contactPayload(c: ContactContent): string {
  const name = c.name.trim()
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escapeVCardField(name)};;;;`, `FN:${escapeVCardField(name)}`]
  if (c.phone.trim()) lines.push(`TEL:${escapeVCardField(c.phone.trim())}`)
  if (c.email.trim()) lines.push(`EMAIL:${escapeVCardField(c.email.trim())}`)
  lines.push('END:VCARD')
  return lines.join(CRLF)
}

/** `2026-11-17T09:30` → `20261117T093000` (hora local flotante, sin `Z`). */
export function icalDateTime(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(local)
  if (!m) throw new Error('Fecha inválida')
  return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6] ?? '00'}`
}

export function eventPayload(e: EventContent): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${escapeVCardField(e.title.trim())}`, `DTSTART:${icalDateTime(e.start)}`, `DTEND:${icalDateTime(e.end)}`]
  if (e.location.trim()) lines.push(`LOCATION:${escapeVCardField(e.location.trim())}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join(CRLF)
}

/** Sin esquema se asume https://; los espacios se codifican. */
export function urlPayload(input: string): string {
  const t = input.trim().replace(/\s+/g, '%20')
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`
}

export function emailPayload(input: string): string {
  const t = input.trim().replace(/\s+/g, '%20')
  return `mailto:${t.replace(/^mailto:/i, '')}`
}

/** Solo dígitos, `*`, `#` y un `+` inicial (como la app). */
export function phonePayload(input: string): string {
  const number = input.trim().replace(/^tel:/i, '').trim()
  const cleaned = [...number].filter((c, i) => /[0-9*#]/.test(c) || (c === '+' && i === 0)).join('')
  return `tel:${cleaned || number}`
}

// ── Lectura (para el lector inteligente, W-84) ─────────────────────────

function wifiField(payload: string, key: string): string | null {
  const body = payload.trim().replace(/^WIFI:/i, '')
  const m = new RegExp(`(?:^|;)${key}:((?:\\\\.|[^;])*)(?:;|$)`).exec(body)
  if (!m) return null
  const raw = m[1].length >= 2 && m[1].startsWith('"') && m[1].endsWith('"') ? m[1].slice(1, -1) : m[1]
  return unescapeReservedField(raw)
}

export function parseWifi(payload: string): WifiContent | null {
  if (!/^\s*WIFI:/i.test(payload)) return null
  const ssid = wifiField(payload, 'S')
  if (ssid === null) return null
  const password = wifiField(payload, 'P') ?? ''
  const type = (wifiField(payload, 'T') ?? '').toUpperCase()
  const security: WifiSecurity = type === 'WEP' ? 'WEP' : type === '' || type === 'NOPASS' ? (password ? 'WPA' : 'NONE') : 'WPA'
  return { ssid, password, security }
}

/** Líneas con los plegados de vCard/iCalendar deshechos (línea siguiente que empieza con espacio). */
const unfolded = (p: string) => p.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
const propKey = (raw: string) => raw.split(';')[0].trim().split('.').pop()!.toUpperCase()

export function parseContact(payload: string): ContactContent | null {
  if (!/BEGIN:VCARD/i.test(payload)) return null
  let name = ''
  let structured = ''
  let phone = ''
  let email = ''
  for (const line of unfolded(payload)) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    const key = propKey(line.slice(0, i))
    const value = line.slice(i + 1).trim()
    if (key === 'FN') name = unescapeReservedField(value)
    else if (key === 'N') {
      const [family = '', given = ''] = value.split(';')
      structured = unescapeReservedField([given.trim(), family.trim()].filter(Boolean).join(' '))
    } else if (key === 'TEL' && !phone) phone = unescapeReservedField(value).replace(/^tel:/i, '').trim()
    else if (key === 'EMAIL' && !email) email = unescapeReservedField(value)
  }
  const finalName = name.trim() || structured
  return finalName || phone || email ? { name: finalName, phone, email } : null
}

/** `20261117T093000` (local) o `...Z` (UTC, se pasa a la hora local) → `YYYY-MM-DDTHH:mm:ss`. */
export function parseIcalDateTime(value: string): string | null {
  const v = value.trim()
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/i.exec(v)
  if (!m) return null
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m
  if (!z) return `${y}-${mo}-${d}T${h}:${mi}:${s}`
  const local = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`
}

export function parseEvent(payload: string): EventContent | null {
  if (!/BEGIN:VEVENT/i.test(payload)) return null
  let title = ''
  let location = ''
  let start: string | null = null
  let end: string | null = null
  for (const line of unfolded(payload)) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    const key = propKey(line.slice(0, i))
    const value = unescapeReservedField(line.slice(i + 1).trim())
    if (key === 'SUMMARY') title = value
    else if (key === 'LOCATION') location = value
    else if (key === 'DTSTART') start = parseIcalDateTime(value)
    else if (key === 'DTEND') end = parseIcalDateTime(value)
  }
  return start ? { title, location, start, end: end ?? start } : null
}

// ── Validación del formulario (los mismos casos que la app) ────────────

export type QrKind = 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'contact' | 'event'
export type QrFormError = 'empty' | 'wifiIncomplete' | 'contactName' | 'eventTitle' | 'eventEndBeforeStart'

export type QrForm = {
  kind: QrKind
  value: string
  wifi: WifiContent
  contact: ContactContent
  event: EventContent
}

/** Contenido listo para el QR, o el motivo por el que todavía no se puede generar. */
export function buildPayload(f: QrForm): { payload: string } | { error: QrFormError } {
  switch (f.kind) {
    case 'url':
    case 'text':
    case 'email':
    case 'phone': {
      if (!f.value.trim()) return { error: 'empty' }
      const payload = f.kind === 'url' ? urlPayload(f.value) : f.kind === 'email' ? emailPayload(f.value) : f.kind === 'phone' ? phonePayload(f.value) : f.value
      return { payload }
    }
    case 'wifi':
      if (!f.wifi.ssid.trim() || (f.wifi.security !== 'NONE' && !f.wifi.password)) return { error: 'wifiIncomplete' }
      return { payload: wifiPayload({ ...f.wifi, ssid: f.wifi.ssid.trim() }) }
    case 'contact':
      if (!f.contact.name.trim()) return { error: 'contactName' }
      return { payload: contactPayload(f.contact) }
    case 'event':
      if (!f.event.title.trim()) return { error: 'eventTitle' }
      if (!f.event.start || !f.event.end || f.event.end <= f.event.start) return { error: 'eventEndBeforeStart' }
      return { payload: eventPayload(f.event) }
  }
}
