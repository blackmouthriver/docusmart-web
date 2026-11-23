// Auditoría W-146.12 (Texto): contador exacto, nivel de lectura, comparar lado a lado,
// diferencias por letra y frase de contraseña.
import { describe, expect, it } from 'vitest'
import { CHAR_LIMITS, hasReadability, readability, readingLevel, syllablesEn, syllablesEs, textStats, topWords, wordsOf } from '../../../../../src/features/text/core/stats'
import { DEFAULT_DIFF, diffTexts, refineParts, sideBySide } from '../../../../../src/features/text/core/textDiff'
import { DEFAULT_PASSPHRASE, MAX_LENGTH, clampWords, entropyBits, generatePassphrase, generatePassword, passphraseBits, passphraseLang, pools, type Rng } from '../../../../../src/features/text/core/password'
import es from '../../../../../src/features/text/core/words/es'
import en from '../../../../../src/features/text/core/words/en'

describe('contador exacto', () => {
  it('un enlace, un correo y una palabra con guion son una palabra (como Word)', () => {
    expect(textStats('Visita https://docusmart.online/app/ hoy').words).toBe(3)
    expect(textStats('Visita www.docusmart.online, hoy').words).toBe(3)
    expect(textStats('Escribe a soporte@docusmart.online ya').words).toBe(4)
    expect(textStats('bien-estar e-mail post-COVID').words).toBe(3)
    expect(wordsOf('Ver https://a.co/x?y=1.')).toEqual(['Ver', 'https://a.co/x?y=1'])
    // Un guion suelto entre espacios no une palabras.
    expect(textStats('uno - dos').words).toBe(2)
    expect(textStats('Cuesta $1.500.000 o 3,14 USD').words).toBe(5)
  })

  it('las abreviaturas, las iniciales y los enlaces no cortan la oración', () => {
    expect(textStats('El Sr. Pérez llegó. La Dra. Gómez no.').sentences).toBe(2)
    expect(textStats('Lo firmó J. García ayer. Bien.').sentences).toBe(2)
    expect(textStats('Entra a docusmart.online y www.google.com hoy. Listo.').sentences).toBe(2)
  })

  it('las palabras más repetidas no cuentan los enlaces', () => {
    expect(topWords('https://a.com https://a.com casa casa casa').map((w) => w.word)).toEqual(['casa'])
  })
})

describe('nivel de lectura', () => {
  it('cuenta sílabas en español con diptongos e hiatos', () => {
    expect(syllablesEs('casa')).toBe(2)
    expect(syllablesEs('ciudad')).toBe(2)
    expect(syllablesEs('leer')).toBe(2)
    expect(syllablesEs('día')).toBe(2)
    expect(syllablesEs('aéreo')).toBe(4)
    expect(syllablesEs('muy')).toBe(1)
    expect(syllablesEs('y')).toBe(1)
    expect(syllablesEs('murciélago')).toBe(4)
  })

  it('cuenta sílabas en inglés sin la e muda', () => {
    expect(syllablesEn('make')).toBe(1)
    expect(syllablesEn('table')).toBe(2)
    expect(syllablesEn('reading')).toBe(2)
    expect(syllablesEn('beautiful')).toBe(3)
  })

  it('un texto simple es fácil y uno técnico es difícil', () => {
    const simple = 'El sol sale. La casa es azul. Mi gato come pan. El perro juega en el patio. Hoy hace calor. Vamos a la playa.'
    const hard =
      'La implementación de metodologías interdisciplinarias contemporáneas, fundamentadas en epistemologías constructivistas, requiere consideraciones administrativas, organizacionales y presupuestarias extraordinariamente complejas para garantizar resultados significativos.'
    const s = readability(simple, 'es')!
    const h = readability(hard, 'es')!
    expect(s.score).toBeGreaterThan(80)
    expect(h.score).toBeLessThan(30)
    expect(s.formula).toBe('Fernández Huerta')
    expect(h.level).toBe('veryHard')
    expect(readability('The cat sat on the mat. The dog ran to the park. It was a fine day. We had fun in the sun all day long.', 'en')!.score).toBeGreaterThan(90)
  })

  it('sin fórmula para el idioma o con muy pocas palabras, no hay puntaje', () => {
    expect(readability('私は学生です。'.repeat(20), 'ja')).toBeNull()
    expect(readability('Hola mundo.', 'es')).toBeNull()
    expect(hasReadability('es') && hasReadability('de') && !hasReadability('ru')).toBe(true)
    expect([95, 85, 75, 65, 55, 40, 10].map(readingLevel)).toEqual(['veryEasy', 'easy', 'fairlyEasy', 'standard', 'fairlyHard', 'hard', 'veryHard'])
    expect(CHAR_LIMITS.find((l) => l.id === 'x')?.max).toBe(280)
  })
})

describe('comparar textos', () => {
  it('ignora tildes (pero la ñ sigue siendo otra letra)', () => {
    const o = { ...DEFAULT_DIFF, ignoreAccents: true }
    expect(diffTexts('Canción ÁRBOL pingüino', 'Cancion ARBOL pinguino', o).identical).toBe(true)
    expect(diffTexts('año', 'ano', o).identical).toBe(false)
    expect(diffTexts('Canción', 'Cancion').identical).toBe(false)
  })

  it('con algún cambio, el parecido nunca dice 100 %', () => {
    const big = Array.from({ length: 3000 }, (_, i) => 'palabra' + (i % 50)).join(' ')
    const d = diffTexts(big, big + ' extra')
    expect(d.identical).toBe(false)
    expect(d.similarity).toBe(99)
    expect(diffTexts('igual', 'igual').similarity).toBe(100)
  })

  it('marca solo la letra que cambió dentro de una palabra', () => {
    expect(refineParts([{ type: 'del', text: 'contrato' }, { type: 'ins', text: 'contratos' }])).toEqual([
      { type: 'same', text: 'contrato' },
      { type: 'ins', text: 's' },
    ])
    expect(refineParts([{ type: 'del', text: 'gato' }, { type: 'ins', text: 'pato' }])).toEqual([
      { type: 'del', text: 'g' },
      { type: 'ins', text: 'p' },
      { type: 'same', text: 'ato' },
    ])
    // Lo agregado después de la palabra se conserva aparte.
    expect(refineParts([{ type: 'del', text: 'ano' }, { type: 'ins', text: 'anos.\nOtra línea' }])).toEqual([
      { type: 'same', text: 'ano' },
      { type: 'ins', text: 's' },
      { type: 'ins', text: '.\nOtra línea' },
    ])
    // Palabras distintas se muestran enteras.
    expect(refineParts([{ type: 'del', text: 'perro' }, { type: 'ins', text: 'gato' }])).toHaveLength(2)
  })

  it('lado a lado: filas alineadas con número de línea', () => {
    const rows = sideBySide('uno\ndos\ntres\ncuatro', 'uno\ndós más\ntres\ncinco\nseis')
    expect(rows.map((r) => [r.left?.n ?? null, r.right?.n ?? null, r.changed])).toEqual([
      [1, 1, false],
      [2, 2, true],
      [3, 3, false],
      [4, 4, true],
      [null, 5, true],
    ])
    expect(rows[1].left!.parts.some((p) => p.type === 'del')).toBe(true)
    expect(rows[1].right!.parts.map((p) => p.text).join('')).toBe('dós más')
    expect(rows[4].right!.parts).toEqual([{ type: 'ins', text: 'seis' }])
  })
})

describe('contraseñas y frases', () => {
  const seq = (values: number[]): Rng => {
    let i = 0
    return (buf) => {
      buf[0] = values[i++ % values.length]
      return buf
    }
  }

  it('llega a 128 caracteres y excluye los que se pidan', () => {
    expect(MAX_LENGTH).toBe(128)
    expect(generatePassword({ length: 200, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false })).toHaveLength(128)
    const o = { length: 64, lower: false, upper: false, digits: true, symbols: true, avoidAmbiguous: false, exclude: '0123456789' }
    // Sin cifras posibles, el grupo desaparece (no queda vacío) y solo hay símbolos.
    expect(pools(o)).toHaveLength(1)
    expect(generatePassword(o)).toMatch(/^[^0-9]{64}$/)
    expect(entropyBits({ ...o, exclude: '' })).toBeGreaterThan(entropyBits(o))
  })

  it('listas de palabras: más de 1024, sin repetir, sin tildes', () => {
    for (const list of [es, en]) {
      expect(list.length).toBeGreaterThanOrEqual(1024)
      expect(new Set(list).size).toBe(list.length)
      expect(list.every((w) => /^[a-z]{3,9}$/.test(w))).toBe(true)
    }
  })

  it('frase con separador, mayúscula y una cifra', () => {
    const p = generatePassphrase(DEFAULT_PASSPHRASE, ['sol', 'mar', 'luna'], seq([0, 1, 2, 0, 1, 2, 7]))
    expect(p).toMatch(/^([A-Z][a-z]+\d?-){5}[A-Z][a-z]+\d?$/)
    expect(p.match(/\d/g)).toHaveLength(1)
    expect(generatePassphrase({ words: 3, separator: ' ', capitalize: false, number: false }, ['sol'])).toBe('sol sol sol')
    expect(generatePassphrase(DEFAULT_PASSPHRASE, [])).toBe('')
    expect(clampWords(99)).toBe(12)
    expect(clampWords(1)).toBe(3)
  })

  it('entropía de la frase e idioma de la lista', () => {
    expect(passphraseBits({ words: 5, separator: '-', capitalize: false, number: false }, 1024)).toBe(50)
    expect(passphraseBits({ words: 5, separator: '-', capitalize: false, number: true }, 1024)).toBe(56)
    expect(passphraseBits(DEFAULT_PASSPHRASE, 0)).toBe(0)
    expect([passphraseLang('es'), passphraseLang('eu'), passphraseLang('fr')]).toEqual(['es', 'es', 'en'])
  })
})
