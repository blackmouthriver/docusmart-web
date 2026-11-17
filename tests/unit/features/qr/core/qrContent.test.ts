import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  contactPayload,
  emailPayload,
  escapeVCardField,
  escapeWifiField,
  eventPayload,
  icalDateTime,
  parseContact,
  parseEvent,
  parseIcalDateTime,
  parseWifi,
  phonePayload,
  unescapeReservedField,
  urlPayload,
  wifiPayload,
  type QrForm,
} from '../../../../../src/features/qr/core/qrContent'

describe('formatos al crear (iguales a la app)', () => {
  it('Wi-Fi con escape de caracteres reservados y red abierta sin clave', () => {
    expect(wifiPayload({ ssid: 'Casa;Wi:Fi', password: 'p"a,ss\\', security: 'WPA' })).toBe('WIFI:T:WPA;S:Casa\\;Wi\\:Fi;P:p\\"a\\,ss\\\\;;')
    expect(wifiPayload({ ssid: 'Libre', password: 'x', security: 'NONE' })).toBe('WIFI:T:nopass;S:Libre;;')
    expect(escapeWifiField('a\\b')).toBe('a\\\\b')
  })

  it('vCard 3.0 con CRLF, campos opcionales y escape (sin escapar ":")', () => {
    expect(contactPayload({ name: ' Ana Peña ', phone: '+57 300', email: '' })).toBe('BEGIN:VCARD\r\nVERSION:3.0\r\nN:Ana Peña;;;;\r\nFN:Ana Peña\r\nTEL:+57 300\r\nEND:VCARD')
    expect(escapeVCardField('a;b,c\\d\r\ne:f')).toBe('a\\;b\\,c\\\\d\\ne:f')
  })

  it('evento iCalendar en hora local flotante', () => {
    expect(icalDateTime('2026-11-17T09:30')).toBe('20261117T093000')
    expect(() => icalDateTime('mañana')).toThrow()
    expect(eventPayload({ title: 'Examen, cap. 3', location: 'Aula 2', start: '2026-11-17T09:30', end: '2026-11-17T11:00' })).toBe(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Examen\\, cap. 3\r\nDTSTART:20261117T093000\r\nDTEND:20261117T110000\r\nLOCATION:Aula 2\r\nEND:VEVENT\r\nEND:VCALENDAR',
    )
  })

  it('URL, correo y teléfono', () => {
    expect(urlPayload(' docusmart.online/app ')).toBe('https://docusmart.online/app')
    expect(urlPayload('http://a.com/b c')).toBe('http://a.com/b%20c')
    expect(emailPayload('MAILTO:ana@x.com')).toBe('mailto:ana@x.com')
    expect(phonePayload(' tel: +57 (300) 000-0000 ')).toBe('tel:+573000000000')
    expect(phonePayload('1+2*3#')).toBe('tel:12*3#')
    expect(phonePayload('abc')).toBe('tel:abc')
  })
})

describe('lectura (para el lector inteligente)', () => {
  it('lee Wi-Fi, con o sin comillas, y deduce la seguridad', () => {
    expect(parseWifi('WIFI:T:WPA;S:Casa\\;Wi\\:Fi;P:p\\"a\\,ss\\\\;;')).toEqual({ ssid: 'Casa;Wi:Fi', password: 'p"a,ss\\', security: 'WPA' })
    expect(parseWifi('WIFI:S:"Mi red";T:WEP;P:123;;')).toEqual({ ssid: 'Mi red', password: '123', security: 'WEP' })
    expect(parseWifi('WIFI:T:nopass;S:Libre;;')).toEqual({ ssid: 'Libre', password: '', security: 'NONE' })
    expect(parseWifi('WIFI:T:;S:X;P:clave;;')?.security).toBe('WPA')
    expect(parseWifi('hola')).toBeNull()
    expect(parseWifi('WIFI:T:WPA;;')).toBeNull()
  })

  it('un backslash literal seguido de n no se convierte en salto de línea', () => {
    expect(unescapeReservedField('Test\\\\network')).toBe('Test\\network')
    expect(unescapeReservedField('a\\nb\\Nc')).toBe('a\nb\nc')
  })

  it('lee contactos vCard (con N, líneas plegadas y prefijos)', () => {
    expect(parseContact(contactPayload({ name: 'Ana', phone: '300', email: 'a@x.co' }))).toEqual({ name: 'Ana', phone: '300', email: 'a@x.co' })
    expect(parseContact('BEGIN:VCARD\nN:Peña;Ana;;;\nitem1.TEL;TYPE=CELL:tel:+57 30\n 0\nEND:VCARD')).toEqual({ name: 'Ana Peña', phone: '+57 300', email: '' })
    expect(parseContact('BEGIN:VCARD\nEND:VCARD')).toBeNull()
    expect(parseContact('texto')).toBeNull()
  })

  it('lee eventos, con fin opcional y fechas UTC o de día completo', () => {
    const p = eventPayload({ title: 'Clase', location: '', start: '2026-11-17T09:30', end: '2026-11-17T11:00' })
    expect(parseEvent(p)).toEqual({ title: 'Clase', location: '', start: '2026-11-17T09:30:00', end: '2026-11-17T11:00:00' })
    expect(parseEvent('BEGIN:VEVENT\nSUMMARY:X\nDTSTART:20261117\nEND:VEVENT')).toEqual({ title: 'X', location: '', start: '2026-11-17T00:00:00', end: '2026-11-17T00:00:00' })
    expect(parseIcalDateTime('20261117T120000Z')).toMatch(/^2026-11-1[67]T\d{2}:00:00$/)
    expect(parseIcalDateTime('ayer')).toBeNull()
    expect(parseEvent('BEGIN:VEVENT\nSUMMARY:X\nEND:VEVENT')).toBeNull()
    expect(parseEvent('nada')).toBeNull()
  })
})

describe('buildPayload', () => {
  const base: QrForm = {
    kind: 'text',
    value: '',
    wifi: { ssid: '', password: '', security: 'WPA' },
    contact: { name: '', phone: '', email: '' },
    event: { title: '', location: '', start: '2026-11-17T09:00', end: '2026-11-17T10:00' },
  }

  it('valida cada tipo como la app', () => {
    expect(buildPayload(base)).toEqual({ error: 'empty' })
    expect(buildPayload({ ...base, value: 'hola' })).toEqual({ payload: 'hola' })
    expect(buildPayload({ ...base, kind: 'url', value: 'a.com' })).toEqual({ payload: 'https://a.com' })
    expect(buildPayload({ ...base, kind: 'email', value: 'a@b.c' })).toEqual({ payload: 'mailto:a@b.c' })
    expect(buildPayload({ ...base, kind: 'phone', value: '300' })).toEqual({ payload: 'tel:300' })
    expect(buildPayload({ ...base, kind: 'wifi', wifi: { ssid: 'X', password: '', security: 'WPA' } })).toEqual({ error: 'wifiIncomplete' })
    expect(buildPayload({ ...base, kind: 'wifi', wifi: { ssid: ' X ', password: '', security: 'NONE' } })).toEqual({ payload: 'WIFI:T:nopass;S:X;;' })
    expect(buildPayload({ ...base, kind: 'contact' })).toEqual({ error: 'contactName' })
    expect('payload' in buildPayload({ ...base, kind: 'contact', contact: { name: 'Ana', phone: '', email: '' } })).toBe(true)
    expect(buildPayload({ ...base, kind: 'event' })).toEqual({ error: 'eventTitle' })
    expect(buildPayload({ ...base, kind: 'event', event: { ...base.event, title: 'X', end: '2026-11-17T08:00' } })).toEqual({ error: 'eventEndBeforeStart' })
    expect('payload' in buildPayload({ ...base, kind: 'event', event: { ...base.event, title: 'X' } })).toBe(true)
  })
})

describe('lector inteligente (W-84)', () => {
  it('detecta el tipo como la app', async () => {
    const { detectType } = await import('../../../../../src/features/qr/core/qrContent')
    expect(detectType(' https://a.com/foto.png')).toBe('url')
    expect(detectType('MAILTO:a@b.c')).toBe('email')
    expect(detectType('tel:300')).toBe('phone')
    expect(detectType('WIFI:S:x;;')).toBe('wifi')
    expect(detectType('BEGIN:VCARD\nEND:VCARD')).toBe('contact')
    expect(detectType('BEGIN:VCALENDAR\nBEGIN:VEVENT')).toBe('event')
    expect(detectType('file:///sdcard/a.pdf')).toBe('text')
    expect(detectType('hola')).toBe('text')
  })

  it('solo abre http/https y avisa de enlaces sin cifrar o que imitan otro sitio', async () => {
    const { safeLink } = await import('../../../../../src/features/qr/core/qrContent')
    expect(safeLink('https://docusmart.online/app?x=1')).toEqual({ href: 'https://docusmart.online/app?x=1', host: 'docusmart.online', secure: true, lookalike: false })
    expect(safeLink('http://ejemplo.com')).toMatchObject({ secure: false })
    expect(safeLink('https://xn--pypal-4ve.com/login')).toMatchObject({ lookalike: true })
    expect(safeLink('https://pаypal.com')?.lookalike).toBe(true)
    expect(safeLink('javascript:alert(1)')).toBeNull()
    expect(safeLink('data:text/html,hola')).toBeNull()
    expect(safeLink('file:///etc/hosts')).toBeNull()
    expect(safeLink('no es un enlace')).toBeNull()
  })

  it('extrae correo y teléfono, y solo los usa como enlace si son limpios', async () => {
    const { emailAddress, isPlainScheme, phoneNumber } = await import('../../../../../src/features/qr/core/qrContent')
    expect(emailAddress('mailto:ana%40x.co?subject=Hola')).toBe('ana@x.co')
    expect(emailAddress('mailto:%E0%A4%A')).toBe('%E0%A4%A')
    expect(phoneNumber(' TEL: +57300 ')).toBe('+57300')
    expect(isPlainScheme('mailto:ana@x.co')).toBe(true)
    expect(isPlainScheme('tel:+57300')).toBe(true)
    expect(isPlainScheme('mailto:a@b.c" onclick="x')).toBe(false)
  })
})
