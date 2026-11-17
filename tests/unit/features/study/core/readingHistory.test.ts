import { describe, expect, it } from 'vitest'
import { MAX_ENTRIES, documentId, entryPercent, filesToDrop, parseEntries, removeEntry, resumeParagraph, upsertEntry, type ReadingEntry } from '../../../../../src/features/study/core/readingHistory'

const entry = (id: string, updatedAt: number, extra: Partial<ReadingEntry> = {}): ReadingEntry => ({
  id,
  name: `${id}.pdf`,
  kind: 'pdf',
  paragraph: 4,
  totalParagraphs: 20,
  page: 3,
  totalPages: 12,
  finished: false,
  updatedAt,
  ...extra,
})

describe('historial de lectura', () => {
  it('identifica el archivo por nombre, tamaño y fecha', () => {
    expect(documentId({ name: 'a.pdf', size: 10, lastModified: 5 })).toBe('a.pdf|10|5')
  })

  it('deja primero el más reciente, actualiza sin duplicar y respeta el máximo', () => {
    let list: ReadingEntry[] = []
    for (let i = 0; i < MAX_ENTRIES + 2; i++) list = upsertEntry(list, entry(`d${i}`, i))
    expect(list).toHaveLength(MAX_ENTRIES)
    expect(list[0].id).toBe(`d${MAX_ENTRIES + 1}`)
    list = upsertEntry(list, entry('d5', 100, { paragraph: 9 }))
    expect(list[0]).toMatchObject({ id: 'd5', paragraph: 9 })
    expect(list.filter((e) => e.id === 'd5')).toHaveLength(1)
    expect(removeEntry(list, 'd5').some((e) => e.id === 'd5')).toBe(false)
  })

  it('indica qué copias de archivos ya no hacen falta', () => {
    const list = [entry('a', 9), entry('b', 8), entry('c', 7)]
    expect(filesToDrop(list, ['a', 'c', 'x'], 2)).toEqual(['c', 'x'])
  })

  it('lee la lista guardada descartando lo dañado', () => {
    const good = entry('ok', 1)
    expect(parseEntries(JSON.stringify([good, { id: '' }, null, 'x', { ...good, id: 'k', kind: 'doc' }]))).toEqual([good])
    expect(parseEntries('{no json')).toEqual([])
    expect(parseEntries('{"a":1}')).toEqual([])
    expect(parseEntries(null)).toEqual([])
  })

  it('calcula el porcentaje por páginas o por párrafos', () => {
    expect(entryPercent(entry('a', 1))).toBe(16)
    expect(entryPercent(entry('a', 1, { totalPages: 0, page: 0, kind: 'text' }))).toBe(20)
    expect(entryPercent(entry('a', 1, { finished: true }))).toBe(100)
    expect(entryPercent(entry('a', 1, { totalPages: 0, totalParagraphs: 0 }))).toBe(0)
  })

  it('retoma desde el párrafo guardado solo si el texto coincide y no terminó', () => {
    expect(resumeParagraph(entry('a', 1), 20)).toBe(4)
    expect(resumeParagraph(entry('a', 1), 21)).toBe(0)
    expect(resumeParagraph(entry('a', 1, { finished: true }), 20)).toBe(0)
    expect(resumeParagraph(undefined, 20)).toBe(0)
    expect(resumeParagraph(entry('a', 1, { paragraph: 50, totalParagraphs: 20 }), 20)).toBe(19)
  })
})
