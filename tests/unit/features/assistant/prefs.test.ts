// Preferencia «Sugerencias del asistente» (W-151.7) y el resultado a la vista en el contexto de la pantalla.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextStepsEnabled, setNextStepsEnabled } from '../../../../src/features/assistant/core/prefs'
import { reportError, reportFiles, reportResult, resetScreenContext, screenSnapshot } from '../../../../src/shared/files/screenContext'

describe('sugerencias del asistente (W-151.7)', () => {
  let store: Record<string, string>
  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] })
    vi.stubGlobal('location', { pathname: '/app/', hash: '#/pdf/unir' })
    resetScreenContext()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('vienen encendidas y se apagan y encienden en este navegador', () => {
    expect(nextStepsEnabled()).toBe(true)
    setNextStepsEnabled(false)
    expect(store['ds-assistant-next']).toBe('off')
    expect(nextStepsEnabled()).toBe(false)
    setNextStepsEnabled(true)
    expect(nextStepsEnabled()).toBe(true)
  })

  it('sin almacenamiento, siguen encendidas y no fallan', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') }, removeItem: () => { throw new Error('bloqueado') } })
    expect(nextStepsEnabled()).toBe(true)
    expect(() => setNextStepsEnabled(false)).not.toThrow()
  })

  it('el resultado a la vista se guarda con su acción y se borra al elegir otro archivo o con un error', () => {
    const open = vi.fn()
    reportResult({ toolName: 'merge', kind: 'pdf', open })
    const snap = screenSnapshot()
    expect(snap.result).toMatchObject({ toolName: 'merge', kind: 'pdf' })
    snap.result!.open('pdf/comprimir')
    expect(open).toHaveBeenCalledWith('pdf/comprimir')
    reportFiles([])
    expect(screenSnapshot().result).toBeNull()
    reportResult({ toolName: 'merge', kind: 'pdf', open })
    reportError('pdf-danado', 'Dañado')
    expect(screenSnapshot().result).toBeNull()
    reportResult({ toolName: 'merge', kind: 'pdf', open })
    reportResult(null)
    expect(screenSnapshot().result).toBeNull()
  })
})
