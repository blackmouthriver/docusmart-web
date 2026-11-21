import { describe, expect, it } from 'vitest'
import { DEFAULT_RENAME, changesAnything, renameAll, type RenameOptions } from '../../../../src/features/archive/core/renameBatch'

const opts = (o: Partial<RenameOptions>): RenameOptions => ({ ...DEFAULT_RENAME, ...o })

describe('renameAll', () => {
  it('sin cambios devuelve los mismos nombres', () => {
    const names = ['a.pdf', 'Foto 1.JPG', 'sin-extension']
    expect(renameAll(names, DEFAULT_RENAME)).toEqual(names)
    expect(changesAnything(names, DEFAULT_RENAME)).toBe(false)
  })

  it('busca y reemplaza solo en el nombre, nunca en la extensión', () => {
    expect(renameAll(['informe pdf.pdf', 'pdf.pdf'], opts({ find: 'pdf', replace: 'doc' }))).toEqual(['informe doc.pdf', 'doc.pdf'])
  })

  it('agrega texto al inicio y al final', () => {
    expect(renameAll(['a.txt', 'b.txt'], opts({ prefix: '2026-', suffix: ' final' }))).toEqual(['2026-a final.txt', '2026-b final.txt'])
  })

  it('numera con ceros a la izquierda y desde el número elegido', () => {
    expect(renameAll(['x.jpg', 'y.jpg', 'z.jpg'], opts({ newName: 'Vacaciones', numbering: true, start: 8, digits: 3 }))).toEqual([
      'Vacaciones 008.jpg',
      'Vacaciones 009.jpg',
      'Vacaciones 010.jpg',
    ])
  })

  it('cambia mayúsculas y minúsculas solo en el nombre', () => {
    expect(renameAll(['Hola Mundo.PDF'], opts({ caseMode: 'lower' }))).toEqual(['hola mundo.PDF'])
    expect(renameAll(['Hola Mundo.pdf'], opts({ caseMode: 'upper' }))).toEqual(['HOLA MUNDO.pdf'])
  })

  it('reemplaza los caracteres que los sistemas de archivos no aceptan', () => {
    expect(renameAll(['a.pdf'], opts({ prefix: 'x/y:' }))).toEqual(['x-y-a.pdf'])
  })

  it('distingue los nombres repetidos sin importar mayúsculas', () => {
    expect(renameAll(['uno.pdf', 'dos.pdf', 'tres.PDF'], opts({ find: 'uno', replace: 'dos' }))).toEqual(['dos.pdf', 'dos (2).pdf', 'tres.PDF'])
    expect(renameAll(['a.pdf', 'b.pdf', 'B.pdf'], opts({ find: 'a', replace: 'b' }))).toEqual(['b.pdf', 'b (2).pdf', 'B (3).pdf'])
  })

  it('un archivo oculto no pierde su nombre', () => {
    expect(renameAll(['.gitignore'], opts({ prefix: 'x' }))).toEqual(['x.gitignore'])
  })

  it('un nombre que queda vacío usa el de reserva', () => {
    expect(renameAll(['a.pdf'], opts({ find: 'a', replace: '' }))).toEqual(['archivo.pdf'])
    expect(renameAll(['a.pdf'], opts({ find: 'a', replace: '' }), 'file')).toEqual(['file.pdf'])
  })

  it('un nombre nuevo reemplaza todo el nombre y conserva la extensión', () => {
    expect(renameAll(['IMG_0001.JPG', 'IMG_0002.jpg'], opts({ newName: 'Foto', suffix: ' playa' }))).toEqual(['Foto playa.JPG', 'Foto playa (2).jpg'])
    // el nombre nuevo manda sobre buscar y reemplazar
    expect(renameAll(['a.pdf'], opts({ newName: 'Z', find: 'a', replace: 'q' }))).toEqual(['Z.pdf'])
  })

  it('acota las cifras y el número inicial', () => {
    expect(renameAll(['a.txt'], opts({ numbering: true, digits: 99, start: -5 }))[0]).toBe('a 000000.txt')
    expect(renameAll(['a.txt'], opts({ numbering: true, digits: 0, start: 7 }))[0]).toBe('a 7.txt')
    expect(renameAll(['a.txt'], opts({ numbering: true, digits: Number.NaN, start: Number.NaN }))[0]).toBe('a 0.txt')
  })

  it('detecta si algo cambia', () => {
    expect(changesAnything(['a.pdf'], opts({ prefix: 'x' }))).toBe(true)
    expect(changesAnything(['a.pdf'], opts({ find: 'zzz', replace: 'y' }))).toBe(false)
  })
})
