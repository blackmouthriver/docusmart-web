import { describe, expect, it } from 'vitest'
import { RETENTION_DAYS, addPomodoro, addReading, emptyStats, firstDayOfWeek, hoursMinutes, parseStats, weekCounts, weekDays } from '../../../../../src/features/study/core/stats'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('estadísticas de estudio', () => {
  it('lee lo guardado y tolera datos dañados', () => {
    expect(parseStats(JSON.stringify({ readingMs: 5000, pomodoros: [1, 'x', 2], totalPomodoros: 10 }))).toEqual({ readingMs: 5000, pomodoros: [1, 2], totalPomodoros: 10 })
    expect(parseStats(JSON.stringify({ readingMs: -3, pomodoros: [1, 2, 3], totalPomodoros: 1 }))).toEqual({ readingMs: 0, pomodoros: [1, 2, 3], totalPomodoros: 3 })
    expect(parseStats('roto')).toEqual(emptyStats())
    expect(parseStats(null)).toEqual(emptyStats())
    expect(parseStats('5')).toEqual(emptyStats())
  })

  it('suma tiempo escuchado e ignora valores imposibles', () => {
    let s = addReading(emptyStats(), 90_000)
    s = addReading(s, -5)
    s = addReading(s, 2 * 24 * 60 * 60 * 1000)
    expect(s.readingMs).toBe(90_000)
  })

  it('registra pomodoros y descarta fechas de más de 90 días sin bajar el total', () => {
    const now = at(2026, 11, 17)
    let s = addPomodoro(emptyStats(), now - (RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000)
    s = addPomodoro(s, now)
    expect(s.pomodoros).toEqual([now])
    expect(s.totalPomodoros).toBe(2)
  })

  it('cuenta pomodoros por día de la semana actual (lunes o domingo primero)', () => {
    const now = at(2026, 11, 18) // miércoles
    const ts = [at(2026, 11, 16, 9), at(2026, 11, 16, 23), at(2026, 11, 18, 0), at(2026, 11, 22, 23), at(2026, 11, 15), at(2026, 11, 23, 1)]
    expect(weekCounts(ts, now, 1)).toEqual([2, 0, 1, 0, 0, 0, 1])
    expect(weekCounts(ts, now, 0)).toEqual([1, 2, 0, 1, 0, 0, 0])
  })

  it('rotula los días de la semana desde el primer día', () => {
    const days = weekDays(at(2026, 11, 18), 1)
    expect(days.map((d) => d.getDate())).toEqual([16, 17, 18, 19, 20, 21, 22])
    expect(weekDays(at(2026, 11, 18), 0)[0].getDay()).toBe(0)
  })

  it('obtiene el primer día de la semana de la región', () => {
    expect([0, 1, 6]).toContain(firstDayOfWeek('en-US'))
    expect(firstDayOfWeek('es-ES')).toBe(1)
    expect(firstDayOfWeek('no válido')).toBe(1)
  })

  it('pasa milisegundos a horas y minutos', () => {
    expect(hoursMinutes(0)).toEqual({ h: 0, m: 0 })
    expect(hoursMinutes((2 * 60 + 5) * 60000 + 59000)).toEqual({ h: 2, m: 5 })
    expect(hoursMinutes(-1)).toEqual({ h: 0, m: 0 })
  })
})
