import { describe, expect, it } from 'vitest'
import { layoutPdf } from '../../../../../src/features/convert/core/officePdf'
import { MAX_NOTE_IMAGES, exportName, noteToText, notesToBlocks, notesToText, orphanImages, parseNotes, upsertNote, type StudyNote } from '../../../../../src/features/study/core/notes'

const labels = { untitled: 'Nota sin título', date: (ms: number) => `día ${ms}`, image: 'Imagen' }
const note = (id: string, extra: Partial<StudyNote> = {}): StudyNote => ({ id, title: `Título ${id}`, text: 'Línea 1\nLínea 2', at: 1, updatedAt: 1, images: [], ...extra })

describe('notas', () => {
  it('lee notas nuevas y las antiguas de la web, descartando las dañadas', () => {
    const list = parseNotes(JSON.stringify([{ id: 'a', text: 'vieja', at: 5 }, note('b', { images: ['x', 3, 'y'] as never }), { id: 'c' }, null]))
    expect(list).toEqual([
      { id: 'a', title: '', text: 'vieja', at: 5, updatedAt: 5, images: [] },
      { ...note('b'), images: ['x', 'y'] },
    ])
    expect(parseNotes(JSON.stringify([note('z', { images: Array(9).fill('i') })]))[0].images).toHaveLength(MAX_NOTE_IMAGES)
    expect(parseNotes('roto')).toEqual([])
    expect(parseNotes('{}')).toEqual([])
    expect(parseNotes(null)).toEqual([])
  })

  it('guarda una nota nueva o editada primero', () => {
    const list = upsertNote([note('a'), note('b')], note('b', { text: 'editada' }))
    expect(list.map((n) => n.id)).toEqual(['b', 'a'])
    expect(list[0].text).toBe('editada')
  })

  it('encuentra imágenes que ya no usa ninguna nota', () => {
    expect(orphanImages([note('a', { images: ['i1'] })], ['i1', 'i2'])).toEqual(['i2'])
  })

  it('exporta como texto con título, fecha y marcas de imagen', () => {
    expect(noteToText(note('a', { images: ['i'] }), labels)).toBe('Título a\ndía 1\n\nLínea 1\nLínea 2\n\n[Imagen 1]')
    expect(noteToText(note('b', { title: ' ' }), labels).startsWith('Nota sin título')).toBe(true)
    expect(notesToText([note('a'), note('b')], labels)).toContain('────────────')
  })

  it('arma los bloques del PDF con una nota por página y sus imágenes en orden', () => {
    const img = { data: new Uint8Array([1]), type: 'png' as const, width: 10, height: 10 }
    const blocks = notesToBlocks([note('a', { images: ['i1', 'falta'] }), note('b')], new Map([['i1', img]]), labels)
    expect(blocks.filter((b) => b.kind === 'pagebreak')).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ kind: 'para', style: 'h1', runs: [{ text: 'Título a' }] })
    expect(blocks.filter((b) => b.kind === 'image')).toHaveLength(1)
    expect(blocks.filter((b) => b.kind === 'para' && b.runs[0].text === 'Línea 2')).toHaveLength(2)
  })

  it('nombra el archivo con el título o "notas"', () => {
    expect(exportName([note('a', { title: 'Repaso: tema 1/2' })], 'notas', 'pdf')).toBe('Repaso_ tema 1_2.pdf')
    expect(exportName([note('a'), note('b')], 'notas', 'txt')).toBe('notas.txt')
    expect(exportName([note('a', { title: '' })], 'notas', 'txt')).toBe('notas.txt')
  })
})

it('genera un PDF válido con las notas', async () => {
  const pdf = await layoutPdf(notesToBlocks([note('a'), note('b', { title: '' })], new Map(), labels), { title: 'Notas' })
  expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-')
  expect(pdf.length).toBeGreaterThan(500)
})
