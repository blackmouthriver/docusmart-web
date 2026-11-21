import { describe, expect, it } from 'vitest'
import { MAX_SENTENCES, detectLanguage, significantTerms, similarity, splitSentences, summarize, centrality, keywords } from '../../../../../src/features/study/core/summarize'

const filler = (n: number, word: string) => Array.from({ length: n }, (_, i) => `La oración de relleno número ${i + 1} habla de ${word} sin decir mucho.`).join(' ')

describe('detectLanguage', () => {
  it('reconoce la escritura y las palabras vacías', () => {
    expect(detectLanguage('La fotosíntesis es el proceso por el que las plantas usan la luz del sol para crecer.')).toBe('es')
    expect(detectLanguage('Photosynthesis is the process that plants use with the light from the sun.')).toBe('en')
    expect(detectLanguage('Die Photosynthese ist der Prozess, mit dem die Pflanzen das Licht nutzen.')).toBe('de')
    expect(detectLanguage('La photosynthèse est le processus par lequel les plantes utilisent la lumière.')).toBe('fr')
    expect(detectLanguage('Фотосинтез — это процесс, при котором растения используют свет.')).toBe('ru')
    expect(detectLanguage('光合作用是植物利用光能的过程。')).toBe('zh')
    expect(detectLanguage('光合成は植物が光を使う仕組みです。')).toBe('ja')
    expect(detectLanguage('광합성은 식물이 빛을 이용하는 과정입니다.')).toBe('ko')
    expect(detectLanguage('')).toBe('en')
  })
})

describe('splitSentences', () => {
  it('corta por puntuación seguida de mayúscula y descarta fragmentos cortos', () => {
    expect(splitSentences('Primera oración bastante larga. ¿Segunda oración también larga? Sí. Tercera oración de prueba aquí.')).toEqual([
      'Primera oración bastante larga.',
      '¿Segunda oración también larga?',
      // Como en la app, los fragmentos muy cortos ("Sí.") no cuentan como oración.
      'Tercera oración de prueba aquí.',
    ])
  })

  it('en chino y japonés corta tras 。 aunque no haya espacio', () => {
    expect(splitSentences('光合作用是植物利用光能的过程。叶绿体是进行光合作用的地方。', 'zh')).toEqual(['光合作用是植物利用光能的过程。', '叶绿体是进行光合作用的地方。'])
  })
})

describe('significantTerms', () => {
  it('quita palabras vacías y cortas', () => {
    expect(significantTerms('La célula es la unidad de la vida', 'es')).toEqual(['célula', 'unidad', 'vida'])
    expect(significantTerms('The cell is the unit of life', 'en')).toEqual(['cell', 'unit', 'life'])
  })

  it('usa pares de caracteres en chino', () => {
    expect(significantTerms('光合作用', 'zh')).toEqual(['光合', '合作', '作用'])
  })
})

describe('summarize', () => {
  it('devuelve el texto completo si ya es corto', () => {
    const r = summarize('Una oración de prueba bastante larga. Otra oración de prueba más larga todavía.')
    expect(r.sentences).toHaveLength(2)
    expect(r.total).toBe(2)
  })

  it('elige oraciones del tema principal, descarta las que se salen del tema y conserva el orden', () => {
    const topic = ['luz', 'agua', 'hojas', 'clorofila', 'energía', 'glucosa', 'oxígeno', 'raíces']
    const sentences: string[] = []
    for (let i = 0; i < 50; i++) {
      if (i % 10 === 5) sentences.push(`Ayer mi perro número ${i} comió croquetas con mucho apetito.`)
      else sentences.push(`La fotosíntesis de la planta usa ${topic[i % topic.length]} y produce energía para la planta.`)
    }
    const r = summarize(sentences.join(' '))
    expect(r.lang).toBe('es')
    expect(r.total).toBe(50)
    expect(r.sentences).toHaveLength(6)
    expect(r.sentences.every((s) => s.includes('fotosíntesis'))).toBe(true)
    const positions = r.sentences.map((s) => sentences.indexOf(s))
    expect(positions).toEqual([...positions].sort((x, y) => x - y))
  })

  it('no repite oraciones casi iguales (repasos) mientras haya otras', () => {
    const facts = [
      'La fotosíntesis ocurre en los cloroplastos de las hojas verdes.',
      'La clorofila de las hojas absorbe la luz para la fotosíntesis.',
      'La fotosíntesis produce glucosa y libera oxígeno al aire.',
      'Las raíces llevan el agua hasta las hojas para la fotosíntesis.',
      'La glucosa de la fotosíntesis da energía a la planta.',
      'Los estomas de las hojas dejan entrar el carbono para la fotosíntesis.',
    ]
    const text = Array.from({ length: 8 }, (_, r) => facts.map((f) => f.replace('.', ` en el repaso ${r + 1}.`)).join(' ')).join(' ')
    const r = summarize(text)
    expect(r.sentences).toHaveLength(5)
    const distinct = new Set(r.sentences.map((s) => s.replace(/ en el repaso \d+\./, '.')))
    expect(distinct.size).toBe(5)
  })

  it('mide el parecido entre oraciones', () => {
    expect(similarity(new Set(['a', 'b']), new Set(['a', 'b']))).toBe(1)
    expect(similarity(new Set(['a', 'b']), new Set(['c']))).toBe(0)
    expect(similarity(new Set(), new Set())).toBe(1)
  })

  it('no pasa del máximo y respeta un máximo menor que el mínimo', () => {
    expect(summarize(filler(400, 'temas')).sentences).toHaveLength(MAX_SENTENCES)
    expect(summarize(filler(40, 'temas'), { maxSentences: 2 }).sentences).toHaveLength(2)
  })

  it('sin texto devuelve un resumen vacío', () => {
    expect(summarize('   ')).toEqual({ sentences: [], total: 0, lang: 'en', indices: [], keywords: [] })
  })
})

describe('Resumir PDF (W-142)', () => {
  const doc = [
    'La energía solar es una fuente renovable que aprovecha la radiación del sol para producir electricidad.',
    'Los paneles solares convierten la radiación en electricidad mediante celdas fotovoltaicas de silicio.',
    'El costo de los paneles solares bajó mucho en la última década y la energía solar ya compite con el carbón.',
    'Mi primo tiene un perro que se llama Max y le gusta correr en el parque los domingos.',
    'La energía solar necesita baterías para guardar la electricidad que se produce durante el día.',
    'Las baterías de litio permiten usar la energía solar de noche y en días nublados.',
    'El Dr. Pérez, experto en energía solar, explicó que la eficiencia de los paneles sigue mejorando.',
    'Ayer llovió mucho en la ciudad y el tráfico estuvo lento por varias horas.',
    'Muchos países instalan parques de energía solar para reducir las emisiones de carbono.',
    'La electricidad solar en los techos de las casas reduce la factura de energía de las familias.',
    'La radiación del sol varía según la estación, por eso los paneles se inclinan hacia el sol.',
    'En resumen, la energía solar y las baterías son clave para la transición energética.',
  ].join(' ')

  it('no corta la oración en abreviaturas ni en iniciales', () => {
    expect(splitSentences('El Dr. Pérez llegó temprano a la reunión. La Sra. J. García lo saludó con alegría.')).toEqual([
      'El Dr. Pérez llegó temprano a la reunión.',
      'La Sra. J. García lo saludó con alegría.',
    ])
    // Pero "no." al final sí cierra la oración.
    expect(splitSentences('Le pregunté si venía y dijo que no. Después se fue a su casa.')).toHaveLength(2)
  })

  it('los tres largos, en orden, sin las oraciones fuera de tema y con palabras clave', () => {
    const short = summarize(doc, { length: 'short' })
    const long = summarize(doc, { length: 'long' })
    expect(short.sentences.length).toBe(3)
    expect(long.sentences.length).toBeGreaterThan(short.sentences.length)
    expect(short.indices).toEqual([...short.indices].sort((a, b) => a - b))
    for (const s of short.sentences) expect(s).not.toMatch(/perro|llovió/)
    expect(short.keywords.slice(0, 3)).toEqual(expect.arrayContaining(['energía', 'solar']))
    expect(short.keywords).not.toContain('perro')
  })

  it('centralidad: la oración que más se parece al resto queda primera', () => {
    const sets = [new Set(['a', 'b', 'c']), new Set(['a', 'b']), new Set(['b', 'c']), new Set(['x', 'y'])]
    const r = centrality(sets)
    expect(r.indexOf(Math.max(...r))).toBe(0)
    expect(r[3]).toBeLessThan(r[0])
    expect(keywords([['a', 'b'], ['a'], ['c']])).toEqual(['a'])
  })
})
