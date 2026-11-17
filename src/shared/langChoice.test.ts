import { afterEach, describe, expect, it, vi } from 'vitest'
import { LANG_KEY, rememberLangChoice, saveLangChoice } from './langChoice'

function stubStorage(fail = false) {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail) throw new Error('bloqueado')
      store.set(k, v)
    },
  })
  return store
}

afterEach(() => vi.unstubAllGlobals())

describe('saveLangChoice', () => {
  it('guarda un código de idioma válido', () => {
    const store = stubStorage()
    saveLangChoice('en')
    expect(store.get(LANG_KEY)).toBe('en')
  })

  it('ignora valores vacíos o raros', () => {
    const store = stubStorage()
    saveLangChoice(undefined)
    saveLangChoice('english')
    saveLangChoice('<x>')
    expect(store.size).toBe(0)
  })

  it('no falla si el almacenamiento está bloqueado', () => {
    stubStorage(true)
    expect(() => saveLangChoice('ja')).not.toThrow()
  })
})

describe('rememberLangChoice', () => {
  it('guarda el idioma del enlace pulsado', () => {
    const store = stubStorage()
    let handler: ((e: Event) => void) | undefined
    rememberLangChoice({ addEventListener: (_: string, h: EventListenerOrEventListenerObject) => void (handler = h as (e: Event) => void) } as Pick<Document, 'addEventListener'>)
    const link = { dataset: { setLang: 'fr' } }
    handler!({ target: { closest: () => link } } as unknown as Event)
    expect(store.get(LANG_KEY)).toBe('fr')
  })

  it('no hace nada si el clic no es en un enlace de idioma', () => {
    const store = stubStorage()
    let handler: ((e: Event) => void) | undefined
    rememberLangChoice({ addEventListener: (_: string, h: EventListenerOrEventListenerObject) => void (handler = h as (e: Event) => void) } as Pick<Document, 'addEventListener'>)
    handler!({ target: { closest: () => null } } as unknown as Event)
    handler!({ target: null } as unknown as Event)
    expect(store.size).toBe(0)
  })
})
