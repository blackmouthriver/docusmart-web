import { describe, expect, it } from 'vitest'
import { baseName, formatBytes, kindOf, parsePageRanges } from './files'

const file = (name: string, type = '') => new File([''], name, { type })

describe('files', () => {
  it('interpreta rangos de páginas en base 0, ordenados y sin repetir', () => {
    expect(parsePageRanges('1-3, 5', 6)).toEqual([0, 1, 2, 4])
    expect(parsePageRanges('4-', 6)).toEqual([3, 4, 5])
    expect(parsePageRanges('-2', 6)).toEqual([0, 1])
    expect(parsePageRanges('2, 2, 1', 6)).toEqual([0, 1])
  })

  it('rechaza rangos fuera del documento o mal escritos', () => {
    expect(parsePageRanges('9', 6)).toBeNull()
    expect(parsePageRanges('3-1', 6)).toBeNull()
    expect(parsePageRanges('0', 6)).toBeNull()
    expect(parsePageRanges('a-b', 6)).toBeNull()
    expect(parsePageRanges(' , ', 6)).toBeNull()
  })

  it('reconoce el tipo de archivo por MIME o por extensión', () => {
    expect(kindOf(file('a.bin', 'application/pdf'))).toBe('pdf')
    expect(kindOf(file('scan.PDF'))).toBe('pdf')
    expect(kindOf(file('foto.webp'))).toBe('image')
    expect(kindOf(file('notas.md'))).toBe('text')
    expect(kindOf(file('hoja.xlsx'))).toBe('other')
  })

  it('formatea tamaños y quita la extensión', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(baseName('informe.final.pdf')).toBe('informe.final')
  })
})
