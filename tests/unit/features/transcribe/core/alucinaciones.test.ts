// Audio a texto: lo que evita los bucles ("de la crisis de la crisis…") y el idioma equivocado.
import { describe, expect, it } from 'vitest'
import { deflateSync } from 'fflate'
import {
  LANGUAGES,
  VOCAB_SIZE,
  attemptScore,
  compressionRatio,
  languageCandidates,
  needsFallback,
  sampleToken,
} from '../../../../../src/features/transcribe/core/whisper'

describe('compresión del texto', () => {
  it('un bucle se comprime mucho más que una frase normal', () => {
    const normal = 'Buenos días a todos y gracias por venir a la reunión de hoy. Vamos a revisar el presupuesto.'
    const bucle = 'El reporte de la crisis' + ' de la crisis'.repeat(40)
    expect(compressionRatio(normal, deflateSync)).toBeLessThan(2.4)
    expect(compressionRatio(bucle, deflateSync)).toBeGreaterThan(2.4)
    expect(compressionRatio('', deflateSync)).toBe(0)
  })
})

describe('cuándo reintentar', () => {
  it('reintenta con bucles o texto poco probable, no con silencio', () => {
    expect(needsFallback({ compression: 1.3, avgLogProb: -0.3, noSpeech: 0.01 })).toBe(false)
    expect(needsFallback({ compression: 3.1, avgLogProb: -0.2, noSpeech: 0.01 })).toBe(true)
    expect(needsFallback({ compression: 1.3, avgLogProb: -1.4, noSpeech: 0.1 })).toBe(true)
    expect(needsFallback({ compression: 1.3, avgLogProb: -1.4, noSpeech: 0.9 })).toBe(false)
  })

  it('puntaje: un bucle o un texto vacío pierden siempre', () => {
    expect(attemptScore({ compression: 1.2, avgLogProb: -0.8, noSpeech: 0 }, 20)).toBe(-0.8)
    expect(attemptScore({ compression: 3, avgLogProb: -0.1, noSpeech: 0 }, 20)).toBe(-Infinity)
    expect(attemptScore({ compression: 1, avgLogProb: -0.1, noSpeech: 0 }, 0)).toBe(-Infinity)
  })
})

describe('muestreo con temperatura', () => {
  const logits = Float32Array.from([0, 5, 1, -Infinity])
  it('sin temperatura elige el más probable', () => {
    expect(sampleToken(logits, 0, () => 0.99)).toBe(1)
  })
  it('con temperatura respeta la probabilidad y nunca elige un token prohibido', () => {
    expect(sampleToken(logits, 1, () => 0)).toBe(0)
    expect(sampleToken(logits, 1, () => 0.5)).toBe(1)
    expect(sampleToken(logits, 1, () => 0.999999)).toBe(2)
    for (let i = 0; i < 50; i++) expect(sampleToken(logits, 1, Math.random)).not.toBe(3)
  })
})

describe('idiomas candidatos', () => {
  const logits = new Float32Array(VOCAB_SIZE)
  logits[LANGUAGES.es] = 16.6
  logits[LANGUAGES.en] = 13.2
  logits[LANGUAGES.eu] = 11.2
  logits[LANGUAGES.it] = 11
  it('los más probables, más el idioma de la página', () => {
    expect(languageCandidates(logits, 3)).toEqual(['es', 'en', 'eu'])
    expect(languageCandidates(logits, 3, 'fr')).toEqual(['es', 'en', 'eu', 'fr'])
    expect(languageCandidates(logits, 3, 'en')).toEqual(['es', 'en', 'eu'])
  })
})
