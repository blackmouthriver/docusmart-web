import { describe, expect, it } from 'vitest'
import { OCR_LANGS, ocrBaseFor, ocrLang, ocrLangName } from '../../../../../src/features/ocr/core/ocrLangs'
import { LANGS as SITE } from '../../../../../src/shared/i18n/languages'

const LANGS = SITE.map((l) => l.code)

describe('idiomas del OCR', () => {
  it('hay un modelo por cada idioma del sitio', () => {
    for (const l of LANGS) expect(OCR_LANGS).toContain(ocrBaseFor(l))
    expect(new Set(LANGS.map(ocrBaseFor)).size).toBe(LANGS.length)
    expect(ocrBaseFor('xx')).toBe('spa')
  })

  it('suma inglés para documentos mezclados (salvo en inglés)', () => {
    expect(ocrLang('rus', true)).toBe('rus+eng')
    expect(ocrLang('rus', false)).toBe('rus')
    expect(ocrLang('eng', true)).toBe('eng')
  })

  it('nombra cada idioma en el idioma de la web', () => {
    expect(ocrLangName('por', 'es')).toBe('Portugués')
    expect(ocrLangName('jpn', 'en')).toBe('Japanese')
    expect(ocrLangName('chi_sim', 'es')).toMatch(/^Chino/)
    expect(ocrLangName('deu', 'de')).toBe('Deutsch')
  })
})
