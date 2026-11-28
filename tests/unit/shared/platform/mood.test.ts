import { afterEach, describe, expect, it, vi } from 'vitest'
import { onMood, signalMood, type MoodSignal } from '../../../../src/shared/platform/mood'

afterEach(() => vi.unstubAllGlobals())

describe('señales para Smarthy', () => {
  it('sin navegador no hace nada', () => {
    expect(() => signalMood('success')).not.toThrow()
    const off = onMood(() => {})
    expect(off).toBeTypeOf('function')
    off()
  })

  it('llegan a quien escucha hasta que deja de escuchar', () => {
    vi.stubGlobal('window', new EventTarget())
    const got: MoodSignal[] = []
    const off = onMood((s) => got.push(s))
    signalMood('busy-start')
    signalMood('error')
    off()
    signalMood('success')
    expect(got).toEqual(['busy-start', 'error'])
  })
})
