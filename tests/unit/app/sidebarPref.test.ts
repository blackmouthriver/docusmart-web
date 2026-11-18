import { describe, expect, it } from 'vitest'
import { SIDEBAR_KEY, loadCollapsed, saveCollapsed } from '../../../src/app/sidebarPref'

function store() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

describe('barra lateral plegable', () => {
  it('por defecto desplegada y recuerda la elección', () => {
    const s = store()
    expect(loadCollapsed(s)).toBe(false)
    saveCollapsed(s, true)
    expect(s.m.get(SIDEBAR_KEY)).toBe('collapsed')
    expect(loadCollapsed(s)).toBe(true)
    saveCollapsed(s, false)
    expect(loadCollapsed(s)).toBe(false)
  })
  it('sin almacenamiento o bloqueado: desplegada y sin errores', () => {
    expect(loadCollapsed(null)).toBe(false)
    const blocked = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(loadCollapsed(blocked)).toBe(false)
    expect(() => saveCollapsed(blocked, true)).not.toThrow()
  })
})
