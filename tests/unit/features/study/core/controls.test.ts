import { describe, expect, it } from 'vitest'
import { readerKeyAction, silentWav } from '../../../../../src/features/study/core/controls'

describe('atajos del lector', () => {
  const body = { tagName: 'BODY' }
  it('traduce las teclas a acciones', () => {
    expect(readerKeyAction({ key: ' ', target: body })).toBe('toggle')
    expect(readerKeyAction({ key: 'k', target: body })).toBe('toggle')
    expect(readerKeyAction({ key: 'ArrowLeft', target: body })).toBe('prev')
    expect(readerKeyAction({ key: 'ArrowRight', target: body })).toBe('next')
    expect(readerKeyAction({ key: 'M', target: body })).toBe('mark')
    expect(readerKeyAction({ key: 'x', target: body })).toBeNull()
  })

  it('no interfiere al escribir, con modificadores ni con un botón enfocado', () => {
    expect(readerKeyAction({ key: ' ', target: { tagName: 'textarea' } })).toBeNull()
    expect(readerKeyAction({ key: 'm', target: { tagName: 'INPUT' } })).toBeNull()
    expect(readerKeyAction({ key: 'k', target: { tagName: 'DIV', isContentEditable: true } })).toBeNull()
    expect(readerKeyAction({ key: 'ArrowLeft', ctrlKey: true, target: body })).toBeNull()
    expect(readerKeyAction({ key: ' ', target: { tagName: 'BUTTON' } })).toBeNull()
    expect(readerKeyAction({ key: 'ArrowRight', target: null })).toBe('next')
  })
})

describe('audio silencioso', () => {
  it('es un WAV válido lleno de silencio', () => {
    const wav = silentWav(0.5, 8000)
    const text = (a: number, b: number) => String.fromCharCode(...wav.slice(a, b))
    expect(text(0, 4)).toBe('RIFF')
    expect(text(8, 12)).toBe('WAVE')
    expect(text(36, 40)).toBe('data')
    expect(wav.length).toBe(44 + 4000)
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(8000)
    expect(wav.slice(44).every((v) => v === 128)).toBe(true)
    expect(silentWav(0).length).toBe(45)
  })
})
