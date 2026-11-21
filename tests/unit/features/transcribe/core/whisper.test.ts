import { describe, expect, it } from 'vitest'
import {
  CHUNK_SAMPLES,
  EOT,
  LANGUAGES,
  NO_TIMESTAMPS,
  N_FRAMES,
  N_MELS,
  SAMPLE_RATE,
  SOT,
  StreamResampler,
  TIMESTAMP_BEGIN,
  TRANSCRIBE,
  TRANSLATE,
  VOCAB_SIZE,
  WHISPER_BYTES,
  applyRules,
  argmax,
  decodeTokens,
  detectLanguage,
  fft,
  formatTimestamp,
  isSilence,
  logMel,
  melFilters,
  prompt,
  resample,
  segmentsToText,
  toMono,
  toSrt,
  toVtt,
  tokenLogProb,
  windowSegments,
} from '../../../../../src/features/transcribe/core/whisper'

const ts = (s: number) => TIMESTAMP_BEGIN + Math.round(s / 0.02)

describe('audio', () => {
  it('mezcla a mono', () => {
    expect(Array.from(toMono([Float32Array.from([1, 0]), Float32Array.from([0, 1, 5])]))).toEqual([0.5, 0.5])
    const one = Float32Array.from([1])
    expect(toMono([one])).toBe(one)
  })
  it('remuestrea hacia abajo promediando y hacia arriba interpolando', () => {
    expect(Array.from(resample(Float32Array.from([1, 3, 5, 7]), 32000))).toEqual([2, 6])
    expect(Array.from(resample(Float32Array.from([0, 2]), 8000))).toEqual([0, 1, 2, 2])
    const same = Float32Array.from([1])
    expect(resample(same, SAMPLE_RATE)).toBe(same)
  })
  it('remuestreo por partes igual al de una vez', () => {
    const src = Float32Array.from({ length: 44100 }, (_, i) => Math.sin(i / 20))
    const whole = resample(src, 44100)
    const r = new StreamResampler(44100)
    const parts: number[] = []
    for (let i = 0; i < src.length; i += 777) parts.push(...r.push(src.subarray(i, i + 777)))
    expect(parts.length).toBe(whole.length)
    expect(Math.max(...parts.map((v, i) => Math.abs(v - whole[i])))).toBeLessThan(1e-6)
    const same = new StreamResampler(16000)
    const x = Float32Array.from([1, 2])
    expect(same.push(x)).toBe(x)
  })
})

describe('espectrograma', () => {
  it('la FFT de base mixta coincide con la DFT directa (tamaños compuestos y primos)', () => {
    for (const n of [400, 12, 7]) {
      const x = Array.from({ length: n }, (_, i) => Math.sin(i * 0.3) + (i % 3))
      const re = Float64Array.from(x)
      const im = new Float64Array(n)
      fft(re, im)
      for (const k of [0, 1, Math.floor(n / 3)]) {
        let r = 0
        let s = 0
        for (let t = 0; t < n; t++) {
          r += x[t] * Math.cos((-2 * Math.PI * k * t) / n)
          s += x[t] * Math.sin((-2 * Math.PI * k * t) / n)
        }
        expect(re[k]).toBeCloseTo(r, 6)
        expect(im[k]).toBeCloseTo(s, 6)
      }
    }
    const one = Float64Array.from([3])
    fft(one, new Float64Array(1))
    expect(one[0]).toBe(3)
  })
  it('filtros mel triangulares que cubren hasta 8 kHz', () => {
    const f = melFilters()
    expect(f).toHaveLength(N_MELS)
    expect(f[0].length).toBe(201)
    expect(f[0][0]).toBe(0)
    expect(Math.max(...f[0])).toBeGreaterThan(0)
    expect(f.every((row) => row.every((v) => v >= 0))).toBe(true)
  })
  // Un solo espectrograma completo (30 s de cuadros): en el CI, con cobertura, tarda varios segundos.
  it('log-mel: forma, recorte a 30 s, piso de silencio y un tono que sube su banda', { timeout: 60_000 }, () => {
    // 1 s de tono de 1 kHz y luego silencio, en un audio más largo que 30 s (se recorta).
    const audio = new Float32Array(CHUNK_SAMPLES + 10)
    for (let i = 0; i < SAMPLE_RATE; i++) audio[i] = Math.sin((2 * Math.PI * 1000 * i) / SAMPLE_RATE)
    const mel = logMel(audio)
    expect(mel.length).toBe(N_MELS * N_FRAMES)
    const frame = 50
    const col = Array.from({ length: N_MELS }, (_, m) => mel[m * N_FRAMES + frame])
    const peak = col.indexOf(Math.max(...col))
    // 1 kHz cae cerca de la banda mel 28 en la escala de Whisper.
    expect(peak).toBeGreaterThan(20)
    expect(peak).toBeLessThan(36)
    // El silencio queda en el piso: 8 unidades (log10) por debajo del máximo, normalizado.
    const max = Math.max(...col)
    expect(mel[2000]).toBeCloseTo(max - 2, 5)
  })
})

describe('tokens', () => {
  // Vocabulario mínimo con la codificación por bytes de GPT-2: "Ġ" es el espacio; "Ã" + "±" son la ñ en UTF-8.
  const vocab = ['Hola', 'Ġmundo', 'Ã', '±', 'o']
  it('decodifica bytes, ignora especiales y marcas', () => {
    expect(decodeTokens([0, 1], vocab)).toBe('Hola mundo')
    expect(decodeTokens([2, 3, 4, EOT, SOT, TIMESTAMP_BEGIN, -1], vocab)).toBe('ño')
    expect(decodeTokens([99], vocab)).toBe('')
  })
  it('prompt, idioma, argmax y probabilidad', () => {
    expect(prompt('es', false)).toEqual([SOT, LANGUAGES.es, TRANSCRIBE])
    expect(prompt('en', true)).toEqual([SOT, LANGUAGES.en, TRANSLATE])
    const logits = new Float32Array(VOCAB_SIZE)
    logits[LANGUAGES.ja] = 5
    expect(detectLanguage(logits)).toBe('ja')
    expect(argmax(Float32Array.from([1, 9, 3]))).toBe(1)
    expect(tokenLogProb(Float32Array.from([0, 0]), 0)).toBeCloseTo(Math.log(0.5))
    expect(isSilence(0.9, -2)).toBe(true)
    expect(isSilence(0.9, -0.5)).toBe(false)
  })
})

describe('reglas de marcas de tiempo', () => {
  const fresh = () => new Float32Array(VOCAB_SIZE)
  it('empieza con una marca de como mucho 1 s', () => {
    const l = fresh()
    l[100] = 10
    l[ts(2)] = 9
    applyRules(l, [])
    const t = argmax(l)
    expect(t).toBeGreaterThanOrEqual(TIMESTAMP_BEGIN)
    expect(t).toBeLessThanOrEqual(ts(1))
    expect(l[NO_TIMESTAMPS]).toBe(-Infinity)
    expect(l[EOT]).toBe(-Infinity)
  })
  it('tras abrir un par, sigue texto o una marca igual o posterior; tras cerrarlo, solo texto', () => {
    const open = fresh()
    open[ts(0.5)] = 1
    open[300] = 2
    applyRules(open, [ts(1), 300, ts(2)])
    // El par se cerró con 2 s tras texto: ahora debe venir una marca ≥ 2 s (o EOT).
    expect(open[300]).toBe(-Infinity)
    expect(open[ts(1)]).toBe(-Infinity)
    expect(open[ts(2)]).not.toBe(-Infinity)
    const closed = fresh()
    closed[300] = 1
    applyRules(closed, [ts(1), 300, ts(2), ts(2)])
    expect(closed[ts(3)]).toBe(-Infinity)
    expect(argmax(closed)).toBe(300)
  })
  it('fuerza una marca cuando las marcas, juntas, son más probables que cualquier palabra', () => {
    const l = fresh().fill(-50)
    l[300] = 0
    for (let i = ts(3); i < ts(6); i++) l[i] = -0.5
    applyRules(l, [ts(0), 300])
    expect(argmax(l)).toBeGreaterThanOrEqual(TIMESTAMP_BEGIN)
  })
})

describe('segmentos', () => {
  const vocab = ['Hola', 'Ġmundo', 'ĠAdiós']
  it('pares de marcas y avance hasta la última marca completa', () => {
    const r = windowSegments([ts(0), 0, ts(1), ts(1.5), 1, ts(3), ts(3.2), 2], vocab, 30, CHUNK_SAMPLES)
    expect(r.segments).toEqual([
      { start: 30, end: 31, text: 'Hola' },
      { start: 31.5, end: 33, text: 'mundo' },
    ])
    expect(r.advance).toBe(3 * SAMPLE_RATE)
  })
  it('una marca suelta al final consume la ventana entera', () => {
    const r = windowSegments([ts(0), 0, ts(1), ts(1), 1, ts(2.5)], vocab, 0, CHUNK_SAMPLES)
    expect(r.segments.map((s) => s.text)).toEqual(['Hola', 'mundo'])
    expect(r.advance).toBe(CHUNK_SAMPLES)
  })
  it('sin pares: un solo segmento hasta la última marca o la ventana', () => {
    expect(windowSegments([ts(0), 0, 1, ts(4)], vocab, 0, 100).segments).toEqual([{ start: 0, end: 4, text: 'Hola mundo' }])
    expect(windowSegments([0, 1], vocab, 0, 8000).segments).toEqual([{ start: 0, end: 0.5, text: 'Hola mundo' }])
    expect(windowSegments([], vocab, 0, 8000).segments).toEqual([])
    // Una marca en 0 al cerrar no avanza: se consume la ventana para no quedarse en un bucle.
    expect(windowSegments([ts(0), ts(0)], vocab, 0, 8000).advance).toBe(8000)
  })
  it('texto, SRT y VTT', () => {
    const segs = [
      { start: 0, end: 1.5, text: 'Hola.' },
      { start: 1.6, end: 3, text: 'Sigo.' },
      { start: 6, end: 3725.5, text: 'Otro párrafo.' },
    ]
    expect(segmentsToText(segs)).toBe('Hola. Sigo.\n\nOtro párrafo.')
    expect(segmentsToText([])).toBe('')
    expect(formatTimestamp(3725.5)).toBe('01:02:05,500')
    expect(formatTimestamp(-1, '.')).toBe('00:00:00.000')
    expect(toSrt(segs.slice(0, 1))).toBe('1\n00:00:00,000 --> 00:00:01,500\nHola.\n')
    expect(toVtt(segs.slice(0, 1))).toBe('WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nHola.\n')
    expect(WHISPER_BYTES).toBeGreaterThan(70_000_000)
  })
})
