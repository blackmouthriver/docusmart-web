import { describe, expect, it } from 'vitest'
import {
  dateKey,
  dueReminders,
  durationMinutes,
  escapeText,
  foldLine,
  icsName,
  isValidDate,
  mergeImported,
  nthDate,
  occurrences,
  parseEvents,
  parseIcs,
  toIcs,
  unescapeText,
  upsertEvent,
  type AgendaEvent,
} from '../../../../../src/features/study/core/agenda'

const ev = (over: Partial<AgendaEvent> = {}): AgendaEvent => ({
  id: 'e1',
  title: 'Examen de cálculo',
  date: '2026-11-25',
  time: '09:30',
  minutes: 90,
  repeat: 'none',
  reminder: 30,
  notes: '',
  createdAt: 1,
  updatedAt: 1,
  ...over,
})
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min)

describe('guardar y validar', () => {
  it('fechas reales', () => {
    expect(isValidDate('2026-02-28')).toBe(true)
    expect(isValidDate('2028-02-29')).toBe(true)
    expect(isValidDate('2026-02-29')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('26-1-1')).toBe(false)
  })

  it('parseEvents descarta lo dañado y completa lo que falta', () => {
    const list = parseEvents(JSON.stringify([ev(), { id: 'x', title: 'Sin fecha' }, { id: 'y', title: 'Malo', date: '2026-02-30' }, { id: 'z', title: 'Mínimo', date: '2026-12-01', time: '25:00', repeat: 'cada rato', reminder: 7 }]))
    expect(list.map((e) => e.id)).toEqual(['e1', 'z'])
    expect(list[1]).toMatchObject({ time: null, minutes: 60, repeat: 'none', reminder: null, notes: '' })
    expect(parseEvents('{nada')).toEqual([])
    expect(parseEvents(null)).toEqual([])
  })

  it('upsertEvent reemplaza por id', () => {
    const list = upsertEvent([ev(), ev({ id: 'e2' })], ev({ title: 'Cambiado' }))
    expect(list).toHaveLength(2)
    expect(list.find((e) => e.id === 'e1')?.title).toBe('Cambiado')
  })
})

describe('repeticiones', () => {
  it('diaria, semanal, mensual (sin desbordar el mes) y anual', () => {
    expect(nthDate(ev({ repeat: 'daily', date: '2026-12-31' }), 1)).toBe('2027-01-01')
    expect(nthDate(ev({ repeat: 'weekly' }), 2)).toBe('2026-12-09')
    expect(nthDate(ev({ repeat: 'monthly', date: '2026-01-31' }), 1)).toBe('2026-02-28')
    expect(nthDate(ev({ repeat: 'monthly', date: '2026-01-31' }), 2)).toBe('2026-03-31')
    expect(nthDate(ev({ repeat: 'yearly', date: '2028-02-29' }), 1)).toBe('2029-02-28')
    expect(nthDate(ev({ repeat: 'none' }), 5)).toBe('2026-11-25')
  })

  it('occurrences lista solo lo que cae en el rango, ordenado', () => {
    const list = [ev({ id: 'a', repeat: 'weekly' }), ev({ id: 'b', title: 'Entrega', date: '2026-11-27', time: null }), ev({ id: 'c', date: '2026-10-01' })]
    const occ = occurrences(list, local(2026, 11, 20), local(2026, 12, 10))
    expect(occ.map((o) => `${o.event.id}:${o.date}`)).toEqual(['a:2026-11-25', 'b:2026-11-27', 'a:2026-12-02', 'a:2026-12-09'])
    // Un evento de todo el día dura el día entero.
    expect(occ[1].end.getTime() - occ[1].start.getTime()).toBe(24 * 60 * 60_000)
  })

  it('un evento en curso todavía aparece', () => {
    const occ = occurrences([ev()], local(2026, 11, 25, 10, 0), local(2026, 11, 26))
    expect(occ).toHaveLength(1)
  })
})

describe('avisos', () => {
  it('avisa una vez, en el momento indicado, y no si ya pasó hace mucho', () => {
    const e = ev() // 09:30 con aviso 30 min antes → 09:00
    expect(dueReminders([e], local(2026, 11, 25, 8, 59), new Set())).toHaveLength(0)
    const due = dueReminders([e], local(2026, 11, 25, 9, 1), new Set())
    expect(due.map((d) => d.key)).toEqual(['e1@2026-11-25'])
    expect(dueReminders([e], local(2026, 11, 25, 9, 1), new Set(['e1@2026-11-25']))).toHaveLength(0)
    expect(dueReminders([e], local(2026, 11, 25, 9, 20), new Set())).toHaveLength(0)
    expect(dueReminders([ev({ reminder: null })], local(2026, 11, 25, 9, 1), new Set())).toHaveLength(0)
  })

  it('cada repetición tiene su propio aviso', () => {
    const e = ev({ repeat: 'daily', reminder: 0 })
    expect(dueReminders([e], local(2026, 11, 27, 9, 31), new Set()).map((d) => d.key)).toEqual(['e1@2026-11-27'])
  })
})

describe('iCalendar', () => {
  it('escapa y desescapa el texto', () => {
    const s = 'Repaso: cap. 1, 2; y\\o notas\nsegunda línea'
    expect(escapeText(s)).toBe('Repaso: cap. 1\\, 2\\; y\\\\o notas\\nsegunda línea')
    expect(unescapeText(escapeText(s))).toBe(s)
  })

  it('corta las líneas a 75 bytes sin partir letras', () => {
    const long = 'SUMMARY:' + 'ñ'.repeat(60)
    const folded = foldLine(long)
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe(long)
    expect(foldLine('corta')).toBe('corta')
  })

  it('duraciones', () => {
    expect(durationMinutes('PT1H30M')).toBe(90)
    expect(durationMinutes('-PT15M')).toBe(-15)
    expect(durationMinutes('P1D')).toBe(1440)
    expect(durationMinutes('P1W')).toBe(10080)
    expect(durationMinutes('PT0S')).toBe(0)
    expect(durationMinutes('P')).toBeNull()
    expect(durationMinutes('mañana')).toBeNull()
  })

  it('exporta horas en UTC, todo el día como fecha, repetición y aviso', () => {
    const ics = toIcs([ev({ notes: 'Llevar calculadora, lápiz', repeat: 'weekly' }), ev({ id: 'e2', title: 'Entrega', date: '2026-12-31', time: null, reminder: null })], new Date(Date.UTC(2026, 10, 20, 12)))
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    const start = local(2026, 11, 25, 9, 30)
    const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    expect(ics).toContain(`DTSTART:${utc(start)}`)
    expect(ics).toContain(`DTEND:${utc(new Date(start.getTime() + 90 * 60_000))}`)
    expect(ics).toContain('UID:e1@docusmart.online')
    expect(ics).toContain('DESCRIPTION:Llevar calculadora\\, lápiz')
    expect(ics).toContain('RRULE:FREQ=WEEKLY')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231')
    expect(ics).toContain('DTEND;VALUE=DATE:20270101')
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1)
  })

  it('lo exportado se vuelve a importar igual', () => {
    const original = [ev({ notes: 'Línea 1\nLínea 2; con, comas', repeat: 'monthly', reminder: 1440 }), ev({ id: 'e2', title: 'Feriado', date: '2026-12-08', time: null, minutes: 60, reminder: 0 })]
    // (Un evento de todo el día no usa la duración: dura el día.)
    const back = parseIcs(toIcs(original, new Date()), 5, () => 'nuevo')
    expect(back).toEqual(original.map((e) => ({ ...e, createdAt: 5, updatedAt: 5 })))
  })

  it('importa un .ics de otro calendario (líneas plegadas, zona, duración y aviso)', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Bogota:20261203T140000',
      'DURATION:PT45M',
      'SUMMARY:Reunión del grupo de',
      '  estudio',
      'DESCRIPTION:Sala 3\\nTraer apuntes',
      'UID:abc123@google.com',
      'BEGIN:VALARM',
      'TRIGGER:-PT12M',
      'DESCRIPTION:no es el título',
      'END:VALARM',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'SUMMARY:Sin fecha',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART:20261210T150000Z',
      'DTEND:20261210T170000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    let n = 0
    const list = parseIcs(ics, 9, () => `id${++n}`)
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: 'abc123@google.com', title: 'Reunión del grupo de estudio', date: '2026-12-03', time: '14:00', minutes: 45, repeat: 'none', reminder: 10, notes: 'Sala 3\nTraer apuntes' })
    const utcStart = new Date(Date.UTC(2026, 11, 10, 15))
    expect(list[1]).toMatchObject({ id: 'id1', title: '—', date: dateKey(utcStart), minutes: 120, reminder: null })
    expect(list[1].time).toBe(`${String(utcStart.getHours()).padStart(2, '0')}:00`)
  })

  it('mergeImported reemplaza por UID y cuenta nuevos y actualizados', () => {
    const r = mergeImported([ev()], [ev({ title: 'Otra vez' }), ev({ id: 'e9' })])
    expect(r.added).toBe(1)
    expect(r.updated).toBe(1)
    expect(r.list).toHaveLength(2)
    expect(r.list.find((e) => e.id === 'e1')?.title).toBe('Otra vez')
  })

  it('nombre del archivo', () => {
    expect(icsName([ev({ title: 'Examen: final/2' })], 'agenda')).toBe('Examen_ final_2.ics')
    expect(icsName([ev(), ev({ id: 'x' })], 'agenda')).toBe('agenda.ics')
  })
})
