import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildIndex, expandQuery, search, suggestionsFor, type Kb } from '../../../../src/features/assistant/core/engine'
import { cjkBigrams, editDistance, stem, tokenize, typoBudget } from '../../../../src/features/assistant/core/text'
import { OFF_TOPIC_EN, OFF_TOPIC_ES, QUESTIONS_EN, QUESTIONS_ES, QUESTIONS_OTHER } from './questions'

const load = (lang: string): Kb => JSON.parse(readFileSync(join(process.cwd(), 'public', 'assistant', `${lang}.json`), 'utf-8')) as Kb
const ES = buildIndex(load('es'))
const EN = buildIndex(load('en'))

function hitRate(index: ReturnType<typeof buildIndex>, cases: Array<[string, string | string[]]>) {
  const misses: string[] = []
  for (const [q, expected] of cases) {
    const ok = Array.isArray(expected) ? expected : [expected]
    const out = search(index, q)
    const top = out.results[0]?.entry.id
    if (!out.confident || !top || !ok.includes(top)) misses.push(`${q} → ${top ?? '∅'}${out.confident ? '' : ' (sin confianza)'}`)
  }
  return { rate: 1 - misses.length / cases.length, misses }
}

describe('texto', () => {
  it('normaliza, quita vacías, une sinónimos y plurales', () => {
    expect(tokenize('¿Cómo junto 2 PDFs?', 'es')).toEqual(['unir', '2', 'pdf'])
    expect(tokenize('How do I combine my files?', 'en')).toEqual(['merge', 'file'])
    expect(tokenize('Imágenes', 'es')).toEqual(['imagen'])
    expect(tokenize('hola', 'xx')).toEqual(['hola'])
  })
  it('plurales simples', () => {
    expect(stem('archivos', 'es')).toBe('archivo')
    expect(stem('versiones', 'es')).toBe('version')
    expect(stem('pdf', 'es')).toBe('pdf')
    expect(stem('class', 'en')).toBe('class')
    expect(stem('files', 'en')).toBe('file')
  })
  it('distancia de edición con tope', () => {
    expect(editDistance('comprimir', 'comprmir', 2)).toBe(1)
    expect(editDistance('unir', 'unir', 1)).toBe(0)
    expect(editDistance('a', 'abcdef', 2)).toBe(3)
    expect(editDistance('abcdef', 'uvwxyz', 1)).toBe(2)
    expect(typoBudget('pdf')).toBe(0)
    expect(typoBudget('firma')).toBe(1)
    expect(typoBudget('hora')).toBe(0)
    expect(typoBudget('comprimir')).toBe(2)
  })
})

describe('motor', () => {
  it('corrige errores de tipeo y palabras cortadas', () => {
    const terms = expandQuery(ES, 'comprmir dividr')
    expect(terms.map((t) => t.term)).toEqual(expect.arrayContaining(['comprimir', 'dividir']))
    expect(terms.every((t) => t.weight < 1)).toBe(true)
    expect(expandQuery(ES, 'xyz')).toEqual([])
  })
  it('sin palabras útiles no responde', () => {
    expect(search(ES, 'de la que')).toEqual({ results: [], confident: false, coverage: 0 })
  })
  it('la herramienta de la página actual tiene prioridad', () => {
    const plain = search(ES, 'cuántos archivos puedo', { limit: 3 })
    const inMerge = search(ES, 'cuántos archivos puedo', { context: 'unir-pdf', limit: 3 })
    expect(inMerge.results[0].entry.tool).toBe('unir-pdf')
    expect(plain.results.length).toBeLessThanOrEqual(3)
  })
  it('sugerencias por página', () => {
    const merge = suggestionsFor(ES, 'unir-pdf')
    expect(merge).toHaveLength(4)
    expect(merge[0].tool).toBe('unir-pdf')
    expect(suggestionsFor(ES, undefined, 3).map((e) => e.id)).toEqual(['que-es', 'privacidad', 'precio'])
  })
  it('fuera de tema no responde con confianza', () => {
    for (const q of OFF_TOPIC_ES) expect(search(ES, q).confident, q).toBe(false)
    for (const q of OFF_TOPIC_EN) expect(search(EN, q).confident, q).toBe(false)
  })
})

describe('chino, japonés y coreano (sin espacios entre palabras)', () => {
  it('se indexan por pares de caracteres, y lo latino por palabras', () => {
    expect(cjkBigrams('合并PDF')).toEqual(['合并', '并P', 'PD', 'DF'])
    expect(cjkBigrams('字')).toEqual(['字'])
    expect(tokenize('合并PDF文件', 'zh')).toEqual(['合并', 'pdf', '文件'])
    expect(tokenize('PDFを結合', 'ja')).toEqual(['pdf', 'を結', '結合'])
    expect(tokenize('PDF 합치기', 'ko')).toEqual(['pdf', '합치', '치기'])
  })
  it('las marcas del japonés y las sílabas del coreano no se rompen al normalizar', () => {
    expect(tokenize('ガイド', 'ja')).toEqual(['ガイ', 'イド'])
    expect(tokenize('합치기', 'ko')[0]).toBe('합치')
  })
  it('los plurales solo se quitan en los idiomas con -s', () => {
    expect(stem('dateien', 'de')).toBe('dateien')
    expect(stem('fichiers', 'fr')).toBe('fichier')
  })
})

describe('los otros 10 idiomas (≥ 75 % de aciertos)', () => {
  for (const [lang, cases] of Object.entries(QUESTIONS_OTHER)) {
    it(lang, () => {
      const index = buildIndex(load(lang))
      const { rate, misses } = hitRate(index, cases)
      expect(cases.length).toBeGreaterThanOrEqual(16)
      expect(rate, misses.join(' | ')).toBeGreaterThanOrEqual(0.75)
    })
  }
})

describe('conjunto de preguntas de prueba (≥ 85 % de aciertos)', () => {
  it('español', () => {
    const { rate, misses } = hitRate(ES, QUESTIONS_ES)
    expect(QUESTIONS_ES.length).toBeGreaterThanOrEqual(60)
    expect(rate, misses.join('\n')).toBeGreaterThanOrEqual(0.85)
  })
  it('inglés', () => {
    const { rate, misses } = hitRate(EN, QUESTIONS_EN)
    expect(QUESTIONS_EN.length).toBeGreaterThanOrEqual(60)
    expect(rate, misses.join('\n')).toBeGreaterThanOrEqual(0.85)
  })
})
