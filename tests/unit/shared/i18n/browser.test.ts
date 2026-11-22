import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { DEFAULT_APPEARANCE, loadAppearance, saveAppearance, watchSystemTheme } from '../../../../src/app/appearance'
import { I18nProvider, initialLanguage, useT } from '../../../../src/shared/i18n/I18n'

afterEach(() => vi.unstubAllGlobals())

describe('apariencia en el navegador', () => {
  it('lee y guarda, también con el almacenamiento bloqueado', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) })
    expect(loadAppearance()).toEqual(DEFAULT_APPEARANCE)
    saveAppearance({ theme: 'dark', accent: 'teal', font: 'large', animatedBg: false, sidebar: 'accent' })
    expect(loadAppearance()).toEqual({ theme: 'dark', accent: 'teal', font: 'large', animatedBg: false, sidebar: 'accent' })
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    })
    expect(loadAppearance()).toEqual(DEFAULT_APPEARANCE)
    expect(() => saveAppearance(DEFAULT_APPEARANCE)).not.toThrow()
  })

  it('con "Sistema" sigue el cambio de tema del sistema operativo', () => {
    let listener: (() => void) | null = null
    const mq = { matches: true, addEventListener: (_: string, f: () => void) => (listener = f), removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', () => mq)
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '', setProperty: () => {} } }
    vi.stubGlobal('document', { documentElement: root })
    const stop = watchSystemTheme(() => ({ ...DEFAULT_APPEARANCE, theme: 'system' }))
    listener!()
    expect(root.dataset.theme).toBe('dark')
    stop()
    expect(mq.removeEventListener).toHaveBeenCalled()
    // Con otra forma de aplicar (la portada aplica solo el tema).
    const apply = vi.fn()
    watchSystemTheme(() => ({ ...DEFAULT_APPEARANCE, theme: 'system' }), apply)
    listener!()
    expect(apply).toHaveBeenCalledOnce()
    vi.stubGlobal('matchMedia', undefined)
    expect(typeof watchSystemTheme(() => DEFAULT_APPEARANCE)).toBe('function')
  })
})

describe('idioma inicial y proveedor', () => {
  it('guardado, navegador y almacenamiento bloqueado', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'ko' })
    expect(initialLanguage()).toBe('ko')
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
    })
    vi.stubGlobal('navigator', { languages: ['de-AT'], language: 'de-AT' })
    expect(initialLanguage()).toBe('de')
  })

  it('el proveedor traduce con el diccionario dado (sin proveedor, la clave)', () => {
    const Probe = () => createElement('span', null, useT().t('nav.home'))
    expect(renderToString(createElement(I18nProvider, { initialLang: 'en', initialDict: { 'nav.home': 'Home' }, children: createElement(Probe) }))).toContain('Home')
    expect(renderToString(createElement(Probe))).toContain('nav.home')
  })
})
