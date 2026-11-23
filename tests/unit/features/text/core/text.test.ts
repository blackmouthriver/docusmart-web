import { describe, expect, it } from 'vitest'
import { durationParts, minWordLength, textStats, topWords, wordsOf } from '../../../../../src/features/text/core/stats'
import { DEFAULT_DIFF, diffReport, diffTexts } from '../../../../../src/features/text/core/textDiff'
import { DEFAULT_PASSWORD, MAX_LENGTH, MIN_LENGTH, clampLength, entropyBits, generatePassword, pools, randomInt, strength, type Rng } from '../../../../../src/features/text/core/password'

describe('textStats', () => {
  it('cuenta caracteres, palabras, frases, párrafos y líneas', () => {
    const s = textStats('Hola, mundo. ¿Cómo estás?\n\nBien, gracias.', 'es')
    expect(s.words).toBe(6)
    expect(s.sentences).toBe(3)
    expect(s.paragraphs).toBe(2)
    expect(s.lines).toBe(3)
    expect(s.characters).toBe(41)
    expect(s.charactersNoSpaces).toBe(35)
  })
  it('un emoji o una tilde combinada cuentan como un carácter', () => {
    expect(textStats('👍🏽', 'es').characters).toBe(1)
    expect(textStats('é', 'es').characters).toBe(1)
  })
  it('texto vacío', () => {
    expect(textStats('', 'es')).toMatchObject({ characters: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0, readingMinutes: 0 })
  })
  it('separa palabras en japonés y respeta las contracciones', () => {
    expect(wordsOf('私は学生です', 'ja').length).toBeGreaterThan(1)
    expect(wordsOf("l'homme c'est-à-dire", 'fr').length).toBeGreaterThanOrEqual(2)
  })
  it('sin Intl.Segmenter usa expresiones regulares', () => {
    // Simulamos un navegador sin Intl.Segmenter.
    const intl = Intl as { Segmenter?: unknown }
    const original = intl.Segmenter
    intl.Segmenter = undefined
    try {
      const s = textStats('Hola mundo. Otra frase!', 'es')
      expect(s.words).toBe(4)
      expect(s.sentences).toBe(2)
      expect(s.characters).toBe(23)
    } finally {
      intl.Segmenter = original
    }
  })
  it('tiempos de lectura', () => {
    const s = textStats(Array(400).fill('palabra').join(' '), 'es')
    expect(s.readingMinutes).toBe(2)
    expect(durationParts(s.speakingMinutes)).toEqual({ minutes: 3, seconds: 5 })
    expect(durationParts(0.5)).toEqual({ minutes: 0, seconds: 30 })
  })
})

describe('topWords', () => {
  it('las más repetidas, sin palabras cortas ni números', () => {
    const top = topWords('El gato y el GATO comen. El perro come 100 veces 100.', 'es', 3)
    expect(top[0]).toEqual({ word: 'gato', count: 2, percent: 16.7 })
    expect(top.map((t) => t.word)).not.toContain('el')
    expect(top.map((t) => t.word)).not.toContain('100')
    expect(topWords('', 'es')).toEqual([])
  })
  it('largo mínimo por idioma', () => {
    expect(minWordLength('ja')).toBe(2)
    expect(minWordLength('es')).toBe(3)
  })
})

describe('diffTexts', () => {
  it('textos iguales', () => {
    const d = diffTexts('hola mundo', 'hola mundo')
    expect(d).toMatchObject({ identical: true, added: 0, removed: 0, similarity: 100 })
    expect(diffTexts('', '').similarity).toBe(100)
  })
  it('marca palabras agregadas y borradas conservando los espacios', () => {
    const d = diffTexts('El gato negro duerme.', 'El gato blanco duerme mucho.')
    expect(d.identical).toBe(false)
    expect(d.removed).toBe(1)
    expect(d.added).toBe(2)
    expect(diffReport(d)).toBe('El gato [-negro-]{+blanco+} duerme{+ mucho+}.')
    expect(d.parts.filter((p) => p.type !== 'ins').map((p) => p.text).join('')).toBe('El gato negro duerme.')
    expect(d.parts.filter((p) => p.type !== 'del').map((p) => p.text).join('')).toBe('El gato blanco duerme mucho.')
  })
  it('puede ignorar mayúsculas y espacios', () => {
    expect(diffTexts('Hola  Mundo', 'hola mundo').identical).toBe(false)
    expect(diffTexts('Hola  Mundo', 'hola mundo', { ...DEFAULT_DIFF, ignoreCase: true, ignoreSpaces: true }).identical).toBe(true)
    expect(diffTexts('a b ', 'a b', { ...DEFAULT_DIFF, ignoreSpaces: true }).identical).toBe(true)
  })
  it('línea por línea', () => {
    const d = diffTexts('uno\ndos\ntres\n', 'uno\nDOS\ntres\n', { ...DEFAULT_DIFF, by: 'lines' })
    expect(diffReport(d)).toBe('uno\n[-dos\n-]{+DOS\n+}tres\n')
    expect(diffTexts('uno\n  dos \n', 'uno\ndos\n', { by: 'lines', ignoreCase: false, ignoreSpaces: true }).identical).toBe(true)
    expect(diffTexts('UNO\n', 'uno\n', { by: 'lines', ignoreCase: true, ignoreSpaces: false }).identical).toBe(true)
  })
  it('textos muy distintos: pasa a líneas y, si no alcanza, muestra los dos enteros', () => {
    const many = (seed: string, n: number) => Array.from({ length: n }, (_, i) => `${seed}${i}`).join(' ')
    const a = many('a', 6000)
    const b = many('b', 6000)
    const d = diffTexts(a, b)
    expect(d.tooDifferent).toBe(false)
    expect(d.similarity).toBe(0)
    const lines = (seed: string) => Array.from({ length: 4000 }, (_, i) => `${seed}${i}`).join('\n')
    const far = diffTexts(lines('x'), lines('y'))
    expect(far.tooDifferent).toBe(true)
    expect(far.parts.map((p) => p.type)).toEqual(['del', 'ins'])
    expect(far.removed).toBe(4000)
  })
})

describe('contraseñas', () => {
  // Generador determinista para las pruebas.
  const seq = (values: number[]): Rng => {
    let i = 0
    return (buf) => {
      buf[0] = values[i++ % values.length]
      return buf
    }
  }
  it('respeta el largo y los tipos elegidos', () => {
    for (let n = 0; n < 50; n++) {
      const p = generatePassword({ ...DEFAULT_PASSWORD, length: 12 })
      expect(p).toHaveLength(12)
      expect(p).toMatch(/[a-z]/)
      expect(p).toMatch(/[A-Z]/)
      expect(p).toMatch(/\d/)
      expect(p).toMatch(/[^a-zA-Z0-9]/)
    }
    expect(generatePassword({ ...DEFAULT_PASSWORD, upper: false, symbols: false, digits: false })).toMatch(/^[a-z]{16}$/)
  })
  it('sin tipos no genera nada; evita los ambiguos si se pide', () => {
    expect(generatePassword({ ...DEFAULT_PASSWORD, lower: false, upper: false, digits: false, symbols: false })).toBe('')
    const p = Array.from({ length: 20 }, () => generatePassword({ ...DEFAULT_PASSWORD, length: 64, avoidAmbiguous: true })).join('')
    expect(p).not.toMatch(/[Il1O0o]/)
    expect(pools({ ...DEFAULT_PASSWORD, avoidAmbiguous: true })[0]).not.toContain('o')
  })
  it('largo dentro de los límites', () => {
    expect(clampLength(2)).toBe(MIN_LENGTH)
    expect(clampLength(500)).toBe(MAX_LENGTH)
    expect(MAX_LENGTH).toBe(128)
    expect(clampLength(Number.NaN)).toBe(16)
    expect(clampLength(20.4)).toBe(20)
  })
  it('randomInt descarta los valores que causarían sesgo', () => {
    // 0xffffffff está por encima del límite para max = 10: se descarta y se usa el siguiente.
    expect(randomInt(10, seq([0xffffffff, 7]))).toBe(7)
    expect(generatePassword({ ...DEFAULT_PASSWORD, length: 6 }, seq([1, 2, 3, 4, 5]))).toHaveLength(6)
  })
  it('entropía y fuerza', () => {
    expect(entropyBits({ ...DEFAULT_PASSWORD, length: 16 })).toBe(Math.round(16 * Math.log2(86)))
    expect(entropyBits({ ...DEFAULT_PASSWORD, lower: false, upper: false, digits: false, symbols: false })).toBe(0)
    expect(strength(30)).toBe('weak')
    expect(strength(50)).toBe('fair')
    expect(strength(80)).toBe('strong')
    expect(strength(100)).toBe('veryStrong')
  })
})
