import { describe, expect, it } from 'vitest'
import { COUNTRIES, countryFromLocale, countryName, defaultIdType, findCountry, fold, idsFor, matchCountry } from '../../../../../src/features/billing/core/countries'
import { CURRENCIES, minorDigits } from '../../../../../src/features/billing/core/billing'

const names = COUNTRIES.map((c) => ({ code: c.code, name: countryName(c.code, 'es') }))

describe('países', () => {
  it('cada país tiene moneda conocida, impuesto y al menos un documento', () => {
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length)
    for (const c of COUNTRIES) {
      expect(CURRENCIES as readonly string[], c.code).toContain(c.currency)
      expect(c.tax.label, c.code).not.toBe('')
      expect(c.ids.length, c.code).toBeGreaterThan(0)
      expect(Number.isFinite(minorDigits(c.currency)), c.code).toBe(true)
    }
  })

  it('el impuesto y los documentos de cada país', () => {
    expect(findCountry('CO')).toMatchObject({ currency: 'COP', tax: { label: 'IVA', rate: 19 }, withholding: 'Retención en la fuente' })
    expect(findCountry('PE')?.tax).toEqual({ label: 'IGV', rate: 18 })
    expect(findCountry('DO')?.tax.label).toBe('ITBIS')
    expect(findCountry('PA')?.tax.label).toBe('ITBMS')
    expect(findCountry('HN')?.tax.label).toBe('ISV')
    expect(findCountry('BR')?.tax.rate).toBeNull()
    expect(findCountry('ZZ')).toBeNull()
  })

  it('documento sugerido: el de persona para quien cobra y el de empresa para el cliente', () => {
    const co = findCountry('CO')
    expect(defaultIdType(co, 'persona')).toBe('C.C.')
    expect(defaultIdType(co, 'empresa')).toBe('NIT')
    expect(defaultIdType(findCountry('BR'), 'persona')).toBe('CPF')
    expect(defaultIdType(findCountry('BR'), 'empresa')).toBe('CNPJ')
    expect(defaultIdType(findCountry('MX'), 'persona')).toBe('CURP')
    // Si no hay uno solo de empresa, el que sirve para ambos.
    expect(defaultIdType(findCountry('MX'), 'empresa')).toBe('RFC')
    expect(defaultIdType(null, 'persona')).toBe('')
    expect(idsFor(co, 'empresa').map((i) => i.code)).toEqual(['NIT'])
  })
})

describe('buscar el país', () => {
  it('sin tildes ni mayúsculas, por nombre, código o el único que empieza así', () => {
    expect(fold(' Perú ')).toBe('peru')
    expect(matchCountry('peru', names)).toBe('PE')
    expect(matchCountry('Colombia', names)).toBe('CO')
    expect(matchCountry('mx', names)).toBe('MX')
    expect(matchCountry('Arg', names)).toBe('AR')
    // "C" es ambiguo (Colombia, Chile, Costa Rica, Canadá…): todavía no elige.
    expect(matchCountry('c', names)).toBeNull()
    expect(matchCountry('', names)).toBeNull()
  })

  it('el nombre sale en el idioma de la persona', () => {
    expect(countryName('DE', 'es')).toBe('Alemania')
    expect(countryName('DE', 'en')).toBe('Germany')
    expect(countryName('CO', 'xx-invalid-!!')).toBe('CO')
  })

  it('país por defecto según el idioma del navegador', () => {
    expect(countryFromLocale(['es-CO', 'es'])).toBe('CO')
    expect(countryFromLocale(['en', 'es_MX'])).toBe('MX')
    expect(countryFromLocale(['es', 'en-ZZ'])).toBeNull()
  })
})
