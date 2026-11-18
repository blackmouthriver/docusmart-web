import { describe, expect, it } from 'vitest'
import { LAUNCHER_TEXT, SEEN_KEY, attentionState, launcherText, markSeen } from '../../../../src/features/assistant/core/launcher'

function store(initial?: string) {
  const m = new Map<string, string>(initial ? [[SEEN_KEY, initial]] : [])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

describe('textos del botón', () => {
  it('12 idiomas y el inglés para los demás', () => {
    expect(Object.keys(LAUNCHER_TEXT)).toHaveLength(12)
    expect(launcherText('ja').label).toContain('DocuSmart')
    expect(launcherText('xx')).toBe(LAUNCHER_TEXT.en)
  })
})

describe('llamados de atención', () => {
  it('primera vez: burbuja y destellos', () => {
    expect(attentionState(store())).toEqual({ teaser: true, sparkle: true })
  })
  it('ya vio la burbuja: solo destellos', () => {
    expect(attentionState(store('teased'))).toEqual({ teaser: false, sparkle: true })
  })
  it('ya abrió el asistente: nada', () => {
    expect(attentionState(store('opened'))).toEqual({ teaser: false, sparkle: false })
  })
  it('recuerda lo visto sin retroceder de "abierto" a "visto"', () => {
    const s = store()
    markSeen(s, 'teased')
    expect(s.m.get(SEEN_KEY)).toBe('teased')
    markSeen(s, 'opened')
    markSeen(s, 'teased')
    expect(s.m.get(SEEN_KEY)).toBe('opened')
  })
  it('sin almacenamiento o bloqueado: funciona igual', () => {
    expect(attentionState(null)).toEqual({ teaser: true, sparkle: true })
    const blocked = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(attentionState(blocked)).toEqual({ teaser: true, sparkle: true })
    expect(() => markSeen(blocked, 'opened')).not.toThrow()
  })
})

describe('pausa de "escribiendo…"', () => {
  it('crece con el largo de la respuesta, entre un mínimo y un tope', async () => {
    const { typingDelay, TYPING_MIN_MS, TYPING_MAX_MS } = await import('../../../../src/features/assistant/core/launcher')
    expect(typingDelay(0)).toBe(TYPING_MIN_MS)
    expect(typingDelay(-5)).toBe(TYPING_MIN_MS)
    expect(typingDelay(100)).toBe(1100)
    expect(typingDelay(5000)).toBe(TYPING_MAX_MS)
  })
})
