/**
 * Estadísticas de estudio (W-66), como StudyStatsStorage de la app: tiempo total
 * escuchado en voz alta y pomodoros completados (por día de la semana actual y en
 * total). Solo en este navegador.
 */

export type StudyStats = {
  /** Tiempo total escuchado, en milisegundos. */
  readingMs: number
  /** Momentos en que se completó cada pomodoro (últimos 90 días, como la app). */
  pomodoros: number[]
  /** Pomodoros completados desde siempre (el historial de fechas se recorta). */
  totalPomodoros: number
}

export const RETENTION_DAYS = 90
const DAY = 24 * 60 * 60 * 1000

export const emptyStats = (): StudyStats => ({ readingMs: 0, pomodoros: [], totalPomodoros: 0 })

export function parseStats(json: string | null): StudyStats {
  try {
    const raw = JSON.parse(json ?? 'null')
    if (!raw || typeof raw !== 'object') return emptyStats()
    const pomodoros = Array.isArray(raw.pomodoros) ? raw.pomodoros.filter((t: unknown): t is number => Number.isFinite(t)) : []
    return {
      readingMs: Number.isFinite(raw.readingMs) && raw.readingMs > 0 ? raw.readingMs : 0,
      pomodoros,
      totalPomodoros: Number.isFinite(raw.totalPomodoros) ? Math.max(raw.totalPomodoros, pomodoros.length) : pomodoros.length,
    }
  } catch {
    return emptyStats()
  }
}

/** Suma tiempo escuchado (se ignoran valores negativos o de más de un día: relojes cambiados). */
export const addReading = (s: StudyStats, ms: number): StudyStats => (ms > 0 && ms < DAY ? { ...s, readingMs: s.readingMs + ms } : s)

/** Registra un pomodoro y descarta las fechas de más de 90 días. */
export function addPomodoro(s: StudyStats, at: number): StudyStats {
  const cutoff = at - RETENTION_DAYS * DAY
  return { ...s, pomodoros: [...s.pomodoros.filter((t) => t >= cutoff), at], totalPomodoros: s.totalPomodoros + 1 }
}

/**
 * Pomodoros por día de la semana actual (índice 0 = primer día de la semana de la región).
 * Los límites de cada día se calculan con el calendario local, así un cambio de hora
 * no corre un pomodoro al día siguiente (el mismo cuidado que tuvo la app).
 * `firstDay`: 0 = domingo … 6 = sábado.
 */
export function weekCounts(timestamps: readonly number[], now: number, firstDay = 1): number[] {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() - firstDay + 7) % 7))
  const bounds = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.getTime()
  })
  const counts = Array(7).fill(0)
  for (const t of timestamps) {
    for (let i = 0; i < 7; i++) {
      if (t >= bounds[i] && t < bounds[i + 1]) {
        counts[i]++
        break
      }
    }
  }
  return counts
}

/** Fechas (una por día) de la semana actual, para rotular las barras. */
export function weekDays(now: number, firstDay = 1): Date[] {
  const start = new Date(now)
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() - firstDay + 7) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/** Primer día de la semana de la región (0 = domingo, 1 = lunes…), con lunes por defecto. */
export function firstDayOfWeek(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    if (info && Number.isFinite(info.firstDay)) return info.firstDay % 7
  } catch {
    /* región no válida */
  }
  return 1
}

/** Horas y minutos de un tiempo en milisegundos. */
export function hoursMinutes(ms: number): { h: number; m: number } {
  const total = Math.floor(Math.max(0, ms) / 60000)
  return { h: Math.floor(total / 60), m: total % 60 }
}
