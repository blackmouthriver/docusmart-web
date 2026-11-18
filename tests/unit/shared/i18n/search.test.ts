import { describe, expect, it } from 'vitest'
import { matchesQuery, normalizeForSearch, queryTokens, sortByName } from '../../../../src/shared/i18n/search'

describe('normalizeForSearch', () => {
  it('quita tildes, mayúsculas y espacios de más', () => {
    expect(normalizeForSearch('  Extraer   Imágenes ')).toBe('extraer imagenes')
    expect(normalizeForSearch('Ñandú ÇA')).toBe('nandu ca')
  })
  it('deja intactos los alfabetos sin marcas', () => {
    expect(normalizeForSearch('PDF の整理')).toBe('pdf の整理')
    expect(normalizeForSearch('Объединить')).toBe('объединить')
  })
})

describe('queryTokens y matchesQuery', () => {
  it('separa la búsqueda en palabras normalizadas', () => {
    expect(queryTokens(' PDF  a Wórd ')).toEqual(['pdf', 'a', 'word'])
    expect(queryTokens('   ')).toEqual([])
  })
  it('todas las palabras deben aparecer, en cualquier orden', () => {
    const text = 'PDF a Word · Documento editable (.docx) · Convertir'
    expect(matchesQuery(text, 'word pdf')).toBe(true)
    expect(matchesQuery(text, 'convertir docx')).toBe(true)
    expect(matchesQuery(text, 'excel')).toBe(false)
  })
  it('una búsqueda vacía coincide con todo', () => {
    expect(matchesQuery('Unir PDF', '')).toBe(true)
  })
  it('encuentra sin tildes ni mayúsculas', () => {
    expect(matchesQuery('Extraer imágenes de un PDF', 'IMAGENES')).toBe(true)
  })
})

describe('sortByName', () => {
  it('ordena según el idioma sin cambiar la lista original', () => {
    const list = [{ n: 'Rotar' }, { n: 'Árbol' }, { n: 'unir' }, { n: 'Ñu' }, { n: 'Nube' }]
    const sorted = sortByName(list, (x) => x.n, 'es').map((x) => x.n)
    expect(sorted).toEqual(['Árbol', 'Nube', 'Ñu', 'Rotar', 'unir'])
    expect(list[0].n).toBe('Rotar')
  })
  it('usa orden numérico natural', () => {
    expect(sortByName(['a10', 'a2', 'a1'], (x) => x, 'en')).toEqual(['a1', 'a2', 'a10'])
  })
})
