import { describe, expect, it } from 'vitest'
import { CONSENT_LANGS, consentText } from './consentText'
import { LANGS } from '../app/i18n/languages'

describe('consentText', () => {
  it('tiene textos para los 12 idiomas de la app', () => {
    expect(CONSENT_LANGS.sort()).toEqual(LANGS.map((l) => l.code).sort())
  })

  it('cada idioma trae todos los textos y el marcador {state}', () => {
    for (const lang of CONSENT_LANGS) {
      const t = consentText(lang)
      for (const v of Object.values(t)) expect(v.trim()).not.toBe('')
      expect(t.current).toContain('{state}')
    }
  })

  it('acepta etiquetas con región y cae al español si no conoce el idioma', () => {
    expect(consentText('en-GB').accept).toBe('Accept')
    expect(consentText('PT').accept).toBe('Aceitar')
    expect(consentText('xx').accept).toBe('Aceptar')
    expect(consentText(null).accept).toBe('Aceptar')
    expect(consentText(undefined).deny).toBe('Rechazar')
  })
})
