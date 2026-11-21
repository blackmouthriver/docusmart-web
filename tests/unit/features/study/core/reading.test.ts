import { describe, expect, it } from 'vitest'
import { MAX_CHUNK, chunkParagraph, firstParagraphOfPage, listenedPercent, needsOcr, nextPosition, ocrLangFor, pageProgress, splitParagraphs, toPagedParagraphs, toParagraphs } from '../../../../../src/features/study/core/reading'

describe('splitParagraphs', () => {
  it('une las líneas cortadas por el ancho de la página y separa por oraciones cortas al final', () => {
    const text = [
      'La fotosíntesis es el proceso mediante el cual las plantas',
      'transforman la luz del sol en energía química que pueden',
      'usar para crecer.',
      'Las hojas contienen cloroplastos, donde ocurre la mayor parte',
      'de este proceso.',
    ].join('\n')
    expect(splitParagraphs(text)).toEqual([
      'La fotosíntesis es el proceso mediante el cual las plantas transforman la luz del sol en energía química que pueden usar para crecer.',
      'Las hojas contienen cloroplastos, donde ocurre la mayor parte de este proceso.',
    ])
  })

  it('respeta las líneas en blanco, las listas y las palabras cortadas con guion', () => {
    const text = 'Título\n\nIntroduc-\nción al tema\n- primer punto\n- segundo punto\n\r\n\r\nFin'
    expect(splitParagraphs(text)).toEqual(['Título', 'Introducción al tema', '- primer punto', '- segundo punto', 'Fin'])
  })

  it('separa los títulos del texto que sigue', () => {
    const text = [
      'Cláusulas',
      'Primera: objeto',
      'El contratista se compromete a prestar sus servicios de consultoría en gestión',
      'documental durante seis meses, con entregas mensuales.',
      'La entrega final incluye un informe, la capacitación y el soporte',
      'durante el primer mes',
    ].join('\n')
    expect(splitParagraphs(text)).toEqual([
      'Cláusulas',
      'Primera: objeto',
      'El contratista se compromete a prestar sus servicios de consultoría en gestión documental durante seis meses, con entregas mensuales.',
      'La entrega final incluye un informe, la capacitación y el soporte durante el primer mes',
    ])
  })

  it('ignora bloques vacíos y espacios de más', () => {
    expect(splitParagraphs('  \n\n   uno   dos  \n\n\n')).toEqual(['uno dos'])
    expect(splitParagraphs('')).toEqual([])
  })
})

describe('chunkParagraph', () => {
  it('deja igual un párrafo corto', () => {
    expect(chunkParagraph('Hola mundo.')).toEqual(['Hola mundo.'])
  })

  it('corta por oraciones sin pasar el máximo', () => {
    const s = 'Una oración de prueba bastante larga para el lector. '
    const chunks = chunkParagraph(s.repeat(20).trim(), 120)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((c) => c.length <= 120)).toBe(true)
    expect(chunks.join(' ')).toBe(s.repeat(20).trim())
  })

  it('corta una oración larguísima por comas o espacios', () => {
    const long = Array.from({ length: 200 }, (_, i) => `palabra${i}`).join(' ')
    const chunks = chunkParagraph(long)
    expect(chunks.every((c) => c.length <= MAX_CHUNK)).toBe(true)
    expect(chunks.join(' ')).toBe(long)
  })

  it('combina oraciones cortas y una larga en el mismo párrafo', () => {
    const text = `Corta. ${'x '.repeat(200).trim()}. Otra corta.`
    const chunks = chunkParagraph(text, 100)
    expect(chunks[0]).toBe('Corta.')
    expect(chunks.at(-1)).toBe('Otra corta.')
    expect(chunks.every((c) => c.length <= 100)).toBe(true)
  })
})

describe('páginas del PDF', () => {
  const pages = ['Título\n\nPrimer párrafo.', '', 'Tercera página.']
  const ps = toPagedParagraphs(pages)

  it('cada párrafo sabe de qué página sale', () => {
    expect(ps.map((p) => [p.text, p.page])).toEqual([
      ['Título', 1],
      ['Primer párrafo.', 1],
      ['Tercera página.', 3],
    ])
  })

  it('encuentra el primer párrafo de una página o del siguiente con texto', () => {
    expect(firstParagraphOfPage(ps, 1)).toBe(0)
    expect(firstParagraphOfPage(ps, 2)).toBe(2)
    expect(firstParagraphOfPage(ps, 4)).toBe(-1)
  })

  it('cuenta las páginas leídas y el porcentaje', () => {
    expect(pageProgress(1, 12, false)).toEqual({ read: 0, percent: 0 })
    expect(pageProgress(4, 12, false)).toEqual({ read: 3, percent: 25 })
    expect(pageProgress(5, 12, true)).toEqual({ read: 12, percent: 100 })
    expect(pageProgress(20, 12, false)).toEqual({ read: 12, percent: 100 })
    expect(pageProgress(3, 0, false)).toEqual({ read: 0, percent: 0 })
  })
})

describe('progreso', () => {
  it('calcula el porcentaje escuchado', () => {
    expect(listenedPercent(0, 10, false)).toBe(0)
    expect(listenedPercent(5, 10, false)).toBe(50)
    expect(listenedPercent(3, 10, true)).toBe(100)
    expect(listenedPercent(-1, 10, false)).toBe(0)
    expect(listenedPercent(2, 0, false)).toBe(0)
  })

  it('avanza por trozos y párrafos y termina', () => {
    const ps = toParagraphs(`${'Frase de relleno. '.repeat(40).trim()}\n\nSegundo.`)
    expect(ps[0].chunks.length).toBeGreaterThan(1)
    expect(nextPosition(ps, 0, 0)).toEqual({ p: 0, c: 1 })
    expect(nextPosition(ps, 0, ps[0].chunks.length - 1)).toEqual({ p: 1, c: 0 })
    expect(nextPosition(ps, 1, 0)).toBeNull()
    expect(nextPosition([], 0, 0)).toBeNull()
  })
})

describe('documentos escaneados (W-61)', () => {
  it('detecta un PDF casi sin texto', () => {
    expect(needsOcr(['', '', ''])).toBe(true)
    expect(needsOcr(['Pág. 1', '2'])).toBe(true)
    expect(needsOcr(['Este es un párrafo normal con bastante texto para leer en voz alta.'])).toBe(false)
    expect(needsOcr([])).toBe(false)
  })

  it('elige el idioma del OCR según el de la web', () => {
    // El idioma de la web, más inglés (salvo en inglés).
    expect(ocrLangFor('es')).toBe('spa+eng')
    expect(ocrLangFor('en')).toBe('eng')
    expect(ocrLangFor('fr')).toBe('fra+eng')
    expect(ocrLangFor('ja')).toBe('jpn+eng')
  })
})
