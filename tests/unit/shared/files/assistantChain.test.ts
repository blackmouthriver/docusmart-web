// Plan de varios pasos del asistente (W-151.8).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAIN_MAX_AGE_MS, advanceChain, chainActive, chainStepFor, startChain, stopChain } from '../../../../src/shared/files/assistantChain'
import { reportError, resetScreenContext, screenSnapshot } from '../../../../src/shared/files/screenContext'

describe('plan de varios pasos (W-151.8)', () => {
  let store: Record<string, string>
  beforeEach(() => {
    store = {}
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] })
    vi.stubGlobal('location', { pathname: '/app/', hash: '#/pdf/unir' })
    resetScreenContext()
  })
  afterEach(() => vi.unstubAllGlobals())

  const steps = [
    { tool: 'unir-pdf', route: 'pdf/unir' },
    { tool: 'comprimir-pdf', route: 'pdf/comprimir', options: { targetSize: 1024 * 1024 } },
    { tool: 'proteger-pdf', route: 'pdf/proteger', options: { password: 'Secreta123' } },
  ]

  it('avanza paso a paso y termina después del último', () => {
    startChain(steps, 0)
    expect(chainStepFor('pdf/comprimir', 1)).toBeNull()
    expect(chainStepFor('pdf/unir', 1)).toEqual({ index: 0, total: 3, next: steps[1] })
    expect(advanceChain(2)).toEqual(steps[1])
    expect(chainStepFor('pdf/comprimir', 3)?.index).toBe(1)
    expect(advanceChain(4)?.tool).toBe('proteger-pdf')
    expect(chainStepFor('pdf/proteger', 5)).toEqual({ index: 2, total: 3, next: null })
    expect(advanceChain(6)).toBeNull()
    expect(chainActive(7)).toBe(false)
  })

  it('nunca guarda contraseñas y vence a los 30 minutos', () => {
    startChain(steps, 0)
    expect(store['ds-assistant-chain']).not.toContain('Secreta123')
    expect(chainActive(CHAIN_MAX_AGE_MS + 1)).toBe(false)
  })

  it('un error en un paso detiene el plan y el asistente lo sabe', () => {
    startChain(steps)
    reportError('pdf-danado', 'Dañado')
    expect(chainActive()).toBe(false)
    expect(screenSnapshot().error).toMatchObject({ entry: 'pdf-danado', chainStopped: true })
    stopChain()
    reportError('pdf-danado', 'Dañado')
    expect(screenSnapshot().error?.chainStopped).toBeUndefined()
  })
})
