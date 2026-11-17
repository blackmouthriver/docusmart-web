import { describe, expect, it } from 'vitest'
import { MAX_HIGHLIGHTS, groupByDoc, isHighlighted, parseHighlights, quoteNote, removeDocHighlights, removeHighlight, toggleHighlight, type Highlight } from '../../../../../src/features/study/core/highlights'

const h = (docId: string, paragraph: number, at = 1, extra: Partial<Highlight> = {}): Highlight => ({ docId, docName: `${docId}.pdf`, paragraph, page: 1, text: `Párrafo ${paragraph}`, at, ...extra })

describe('resaltados', () => {
  it('marca y desmarca un párrafo', () => {
    let list = toggleHighlight([], h('a', 2))
    expect(isHighlighted(list, h('a', 2))).toBe(true)
    list = toggleHighlight(list, h('a', 3))
    expect(list.map((x) => x.paragraph)).toEqual([3, 2])
    list = toggleHighlight(list, h('a', 2))
    expect(isHighlighted(list, h('a', 2))).toBe(false)
  })

  it('un párrafo con el mismo número pero otro texto (el documento cambió) no cuenta como resaltado', () => {
    expect(isHighlighted([h('a', 2)], h('a', 2, 1, { text: 'Otro texto' }))).toBe(false)
  })

  it('no pasa del máximo', () => {
    let list: Highlight[] = []
    for (let i = 0; i < MAX_HIGHLIGHTS + 5; i++) list = toggleHighlight(list, h('a', i))
    expect(list).toHaveLength(MAX_HIGHLIGHTS)
    expect(list[0].paragraph).toBe(MAX_HIGHLIGHTS + 4)
  })

  it('quita uno o todos los de un documento', () => {
    const list = [h('a', 1), h('a', 2), h('b', 1)]
    expect(removeHighlight(list, h('a', 1))).toHaveLength(2)
    expect(removeDocHighlights(list, 'a')).toEqual([h('b', 1)])
  })

  it('agrupa por documento, el más reciente primero, y ordena por párrafo', () => {
    const groups = groupByDoc([h('a', 5, 1), h('b', 2, 9), h('a', 1, 3)])
    expect(groups.map((g) => g.docId)).toEqual(['b', 'a'])
    expect(groups[1].items.map((x) => x.paragraph)).toEqual([1, 5])
    expect(groupByDoc([])).toEqual([])
  })

  it('arma la nota con las citas y su origen', () => {
    expect(quoteNote([{ text: 'Uno' }, { text: 'Dos' }], 'libro.pdf')).toBe('“Uno”\n\n“Dos”\n— libro.pdf')
  })

  it('lee la lista guardada descartando lo dañado', () => {
    const ok = h('a', 1)
    expect(parseHighlights(JSON.stringify([ok, { ...ok, text: '' }, null, { docId: 1 }]))).toEqual([ok])
    expect(parseHighlights('nope')).toEqual([])
    expect(parseHighlights('{}')).toEqual([])
    expect(parseHighlights(null)).toEqual([])
  })
})
