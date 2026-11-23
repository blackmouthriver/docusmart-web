/**
 * Contenido de los códigos QR por tipo (W-83), port de QrContentFormat.kt de la app:
 * los mismos formatos estándar que reconocen la cámara del celular, Google Lens y la
 * app (WIFI:, vCard 3.0, iCalendar VEVENT, mailto:, tel:) y las mismas reglas de escape.
 */

export type WifiSecurity = 'WPA' | 'WEP' | 'NONE'
export type WifiContent = { ssid: string; password: string; security: WifiSecurity }
/** Contacto (vCard): empresa, cargo, dirección y web son opcionales (W-146.11). */
export type ContactContent = { name: string; phone: string; email: string; company?: string; title?: string; address?: string; website?: string }
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
  if (c.company?.trim()) lines.push(`ORG:${escapeVCardField(c.company.trim())}`)
  if (c.title?.trim()) lines.push(`TITLE:${escapeVCardField(c.title.trim())}`)
  // ADR: apartado;extendida;calle;ciudad;región;código;país — la dirección completa va en "calle".
  if (c.address?.trim()) lines.push(`ADR:;;${escapeVCardField(c.address.trim())};;;;`)
  if (c.website?.trim()) lines.push(`URL:${escapeVCardField(c.website.trim())}`)
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

/**
 * WhatsApp (W-146.11): un enlace wa.me que abre el chat con el número y, si hay, el mensaje ya
 * escrito. El número va con el indicativo del país; un celular colombiano de 10 dígitos (3xx)
 * sin indicativo recibe el 57.
 */
export function whatsappPayload(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) digits = '57' + digits
  return `https://wa.me/${digits}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`
}

/** SMS con el número y el mensaje (el formato SMSTO: que leen las cámaras de Android e iPhone). */
export function smsPayload(phone: string, message: string): string {
  const number = phonePayload(phone).slice(4)
  return `SMSTO:${number}:${message.replace(/\r?\n/g, ' ').trim()}`
}

/**
 * Ubicación: un enlace de Google Maps con la dirección o las coordenadas ("4.6097, -74.0817"),
 * que abre el mapa en cualquier celular (geo: no lo entiende la cámara del iPhone).
 */
export function locationPayload(place: string): string {
  const coords = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(place)
  const query = coords ? `${coords[1]},${coords[2]}` : place.trim().replace(/\s+/g, ' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
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
  const extra: Pick<ContactContent, 'company' | 'title' | 'address' | 'website'> = {}
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
    // ORG: empresa;área — se separa solo por ";" sin escapar (un "\;" es parte del nombre).
    else if (key === 'ORG' && !extra.company) extra.company = unescapeReservedField(value.split(/(?<!\\);/)[0])
    else if (key === 'TITLE' && !extra.title) extra.title = unescapeReservedField(value)
    else if (key === 'ADR' && !extra.address) extra.address = unescapeReservedField(value.split(/(?<!\\);/).filter((p) => p.trim()).join(', '))
    else if (key === 'URL' && !extra.website) extra.website = unescapeReservedField(value)
  }
  const finalName = name.trim() || structured
  return finalName || phone || email ? { name: finalName, phone, email, ...extra } : null
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

export type QrKind = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'wifi' | 'contact' | 'event'
export type QrFormError = 'empty' | 'wifiIncomplete' | 'contactName' | 'eventTitle' | 'eventEndBeforeStart'

export type QrForm = {
  kind: QrKind
  value: string
  /** Mensaje de WhatsApp o SMS (opcional). */
  message: string
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
    case 'whatsapp':
    case 'sms':
      if (!/\d{3,}/.test(f.value.replace(/\D/g, ''))) return { error: 'empty' }
      return { payload: f.kind === 'whatsapp' ? whatsappPayload(f.value, f.message) : smsPayload(f.value, f.message) }
    case 'location':
      if (!f.value.trim()) return { error: 'empty' }
      return { payload: locationPayload(f.value) }
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

// ── Lector inteligente (W-84) ──────────────────────────────────────────

export type ReadType = 'url' | 'email' | 'phone' | 'sms' | 'location' | 'wifi' | 'contact' | 'event' | 'text'

/** Tipo de un QR leído (como detectQrContentType de la app; los archivos locales del celular cuentan como texto). */
export function detectType(value: string): ReadType {
  const t = value.trim()
  if (/^https?:\/\//i.test(t)) return 'url'
  if (/^mailto:/i.test(t)) return 'email'
  if (/^tel:/i.test(t)) return 'phone'
  if (/^(smsto|sms):/i.test(t)) return 'sms'
  if (/^geo:/i.test(t)) return 'location'
  if (/^wifi:/i.test(t)) return 'wifi'
  if (/BEGIN:VCARD/i.test(t)) return 'contact'
  if (/BEGIN:VEVENT/i.test(t)) return 'event'
  return 'text'
}

export type SafeLink = { href: string; host: string; secure: boolean; lookalike: boolean }

/**
 * Enlace que se puede abrir: solo http/https (nunca javascript:, data:, file:…). Devuelve el
 * dominio para mostrarlo antes de abrir y avisa si no está cifrado o si el dominio usa
 * caracteres de otros alfabetos (punycode, `xn--`) que pueden imitar a otro sitio.
 */
export function safeLink(value: string): SafeLink | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!url.hostname) return null
  return { href: url.href, host: url.hostname, secure: url.protocol === 'https:', lookalike: url.hostname.split('.').some((p) => p.startsWith('xn--')) }
}

/** Dirección de un `mailto:` (sin asunto ni otros parámetros). */
export function emailAddress(payload: string): string {
  const raw = payload.trim().replace(/^mailto:/i, '').split('?')[0]
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export const phoneNumber = (payload: string) => payload.trim().replace(/^tel:/i, '').trim()

/** Número y mensaje de un SMS leído ("SMSTO:número:mensaje" o "sms:número?body=mensaje"). */
export function parseSms(payload: string): { phone: string; message: string } | null {
  const t = payload.trim()
  if (/^smsto:/i.test(t)) {
    // Sin expresión regular: "número:mensaje" se separa en el primer ":".
    const rest = t.slice(6)
    const i = rest.indexOf(':')
    return i < 0 ? { phone: rest.trim(), message: '' } : { phone: rest.slice(0, i).trim(), message: rest.slice(i + 1).trim() }
  }
  const sms = /^sms:([^?]*)(?:\?body=([\s\S]*))?$/i.exec(t)
  if (!sms) return null
  let message = sms[2] ?? ''
  try {
    message = decodeURIComponent(message)
  } catch {
    /* se deja tal cual */
  }
  return { phone: sms[1].trim(), message }
}

/** Coordenadas de un "geo:lat,lng" leído, y el enlace del mapa para abrirlas. */
export function parseGeo(payload: string): { lat: number; lng: number; mapUrl: string } | null {
  const m = /^geo:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i.exec(payload.trim())
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng, mapUrl: locationPayload(`${lat}, ${lng}`) }
}

/** Un `mailto:`/`tel:` solo se usa como enlace si no trae nada raro (sin espacios ni comillas). */
export const isPlainScheme = (payload: string) => /^(mailto|tel):[^\s"'<>]+$/i.test(payload.trim())
