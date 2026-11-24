// W-147.4: distinguir hablantes en Audio a texto (segmentación, huellas, grupos y turnos).
// El diálogo de prueba (tests/fixtures/audio/dialogo.wav) es sintetizado con dos voces de Windows.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as ort from 'onnxruntime-web'
import { describe, expect, it } from 'vitest'
import {
  DIARIZE_MODEL,
  FBANK_BINS,
  FRAME_STEP,
  LOCAL_SPEAKERS,
  WINDOW_SAMPLES,
  WINDOW_STEP,
  assignSpeakers,
  buildTurns,
  clusterVoiceprints,
  frameCenter,
  frameCount,
  kaldiFbank,
  normalize,
  powersetToActivity,
  renumber,
  speakerBlocks,
  speakerCount,
  speakerSamples,
  speakerSrt,
  speakerText,
  speakerVtt,
  windowAudio,
  windowStarts,
  type Voiceprint,
} from '../../../../../src/features/transcribe/core/diarize'
import { SAMPLE_RATE } from '../../../../../src/features/transcribe/core/whisper'
import { diarize } from '../../../../../src/features/transcribe/infra/diarizeEngine'

const FRAMES = frameCount(WINDOW_SAMPLES)

/** Actividad de una ventana: el hablante local `k` suena entre `from` y `to` segundos. */
function activityOf(...spans: Array<[k: number, from: number, to: number]>): Uint8Array {
  const a = new Uint8Array(FRAMES * LOCAL_SPEAKERS)
  for (const [k, from, to] of spans)
    for (let f = 0; f < FRAMES; f++) {
      const t = frameCenter(f) / SAMPLE_RATE
      if (t >= from && t < to) a[f * LOCAL_SPEAKERS + k] = 1
    }
  return a
}

const vec = (...v: number[]) => Float32Array.from(v)
const print = (window: number, local: number, v: Float32Array, seconds = 5): Voiceprint => ({ window, local, vector: v, seconds })

describe('ventanas y segmentación', () => {
  it('ventanas de 10 s cada 5 s hasta cubrir el audio, la última rellena con silencio', () => {
    expect(windowStarts(WINDOW_SAMPLES)).toEqual([0])
    expect(windowStarts(WINDOW_SAMPLES + 1)).toEqual([0, WINDOW_STEP])
    expect(windowStarts(3 * SAMPLE_RATE)).toEqual([0])
    expect(windowStarts(23 * SAMPLE_RATE)).toEqual([0, WINDOW_STEP, 2 * WINDOW_STEP, 3 * WINDOW_STEP])
    const audio = new Float32Array(12 * SAMPLE_RATE).fill(0.5)
    const last = windowAudio(audio, WINDOW_STEP)
    expect(last).toHaveLength(WINDOW_SAMPLES)
    expect(last[0]).toBe(0.5)
    expect(last[WINDOW_SAMPLES - 1]).toBe(0)
    expect(windowAudio(audio, 0)).toHaveLength(WINDOW_SAMPLES)
    expect(FRAMES).toBe(589)
  })

  it('powerset: cada clase dice quién suena (nadie, uno o dos a la vez)', () => {
    const logits = new Float32Array(7 * 7)
    for (let c = 0; c < 7; c++) logits[c * 7 + c] = 5
    const a = powersetToActivity(logits, 7)
    const rows = Array.from({ length: 7 }, (_, f) => [...a.subarray(f * 3, f * 3 + 3)])
    expect(rows).toEqual([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]])
  })

  it('la voz de cada hablante: donde habla solo; si no alcanza, toda la suya; si casi no habla, nada', () => {
    const window = Float32Array.from({ length: WINDOW_SAMPLES }, (_, i) => i / WINDOW_SAMPLES)
    // 0 habla de 0 a 4 s; 1 de 3 a 6 s (pisándose de 3 a 4); 2 solo 0,1 s.
    const act = activityOf([0, 0, 4], [1, 3, 6], [2, 8, 8.1])
    const solo = speakerSamples(window, act, FRAMES, 0)
    expect(solo.length / SAMPLE_RATE).toBeCloseTo(3, 1)
    expect(solo[solo.length - 1]).toBeLessThan(3.1 / 10)
    expect(speakerSamples(window, act, FRAMES, 2)).toHaveLength(0)
    // Siempre pisado: se usa todo lo suyo.
    const both = activityOf([0, 0, 2], [1, 0, 2])
    expect(speakerSamples(window, both, FRAMES, 1).length / SAMPLE_RATE).toBeCloseTo(2, 1)
  })
})

describe('fbank de Kaldi', () => {
  it('80 bandas cada 10 ms, con la media restada; un tono cae en su banda', () => {
    const tone = (hz: number) => Float32Array.from({ length: SAMPLE_RATE }, (_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE) + 0.001 * Math.sin(i))
    const { data, frames } = kaldiFbank(tone(1000))
    expect(frames).toBe(98)
    expect(data).toHaveLength(98 * FBANK_BINS)
    for (const b of [0, 40, 79]) {
      let m = 0
      for (let f = 0; f < frames; f++) m += data[f * FBANK_BINS + b]
      expect(Math.abs(m / frames)).toBeLessThan(1e-3)
    }
    // Antes de restar la media, la banda más fuerte es la del tono: se ve comparando dos tonos.
    const peak = (hz: number) => {
      const r = kaldiFbank(Float32Array.from([...tone(hz), ...tone(100)]))
      // Primera mitad (tono) menos la segunda (otro tono): la diferencia mayor es la banda del tono.
      const diff = Array.from({ length: FBANK_BINS }, (_, b) => r.data[10 * FBANK_BINS + b] - r.data[(r.frames - 10) * FBANK_BINS + b])
      return diff.indexOf(Math.max(...diff))
    }
    expect(peak(500)).toBeLessThan(peak(1000))
    expect(peak(1000)).toBeLessThan(peak(4000))
    expect(kaldiFbank(new Float32Array(100)).frames).toBe(0)
  })
})

describe('grupos de voces', () => {
  const a = vec(1, 0.1, 0)
  const a2 = vec(0.95, 0.2, 0.05)
  const b = vec(0, 1, 0.1)
  const b2 = vec(0.1, 0.9, 0)

  it('une a la misma persona de ventanas distintas y numera por aparición', () => {
    expect(clusterVoiceprints([print(0, 0, b), print(0, 1, a), print(1, 0, a2), print(1, 1, b2)])).toEqual([0, 1, 1, 0])
  })

  it('dos voces de la misma ventana nunca se unen, aunque se parezcan', () => {
    expect(clusterVoiceprints([print(0, 0, a), print(0, 1, a2)])).toEqual([0, 1])
  })

  it('con un número pedido, une hasta llegar a él', () => {
    const c = vec(0.1, 0.2, 1)
    const prints = [print(0, 0, a), print(1, 0, b), print(2, 0, c)]
    expect(new Set(clusterVoiceprints(prints)).size).toBe(3)
    expect(new Set(clusterVoiceprints(prints, 2)).size).toBe(2)
    expect(new Set(clusterVoiceprints(prints, 5)).size).toBe(3)
  })

  it('un grupo con muy poca voz va con el más parecido', () => {
    const c = vec(0.5, 0.2, 0.8)
    expect(clusterVoiceprints([print(0, 0, a), print(1, 0, b), print(2, 0, c, 0.5)])).toEqual([0, 1, 0])
    // Si todos son chicos, se quedan como están.
    expect(clusterVoiceprints([print(0, 0, a, 1), print(1, 0, b, 1)])).toEqual([0, 1])
    expect(clusterVoiceprints([])).toEqual([])
  })

  it('normalize deja largo 1 (y el vector nulo, nulo)', () => {
    expect([...normalize(vec(3, 4))].map((x) => Math.round(x * 10) / 10)).toEqual([0.6, 0.8])
    expect([...normalize(vec(0, 0))]).toEqual([0, 0])
  })
})

describe('turnos y texto', () => {
  it('cada instante lo decide la ventana más centrada; une pausas cortas y quita lo muy corto', () => {
    const total = 15 * SAMPLE_RATE
    const w0 = { start: 0, activity: activityOf([0, 0, 3], [0, 3.3, 6], [1, 7, 7.1]), frames: FRAMES, speakers: [0, 5, -1] }
    // La segunda ventana (5 s a 15 s) ve a otra persona desde los 8 s (local 1 → global 1).
    const w1 = { start: WINDOW_STEP, activity: activityOf([0, 0, 1], [1, 3, 9.5]), frames: FRAMES, speakers: [0, 1, -1] }
    const turns = buildTurns([w0, w1], total).map((t) => ({ ...t, start: Math.round(t.start * 10) / 10, end: Math.round(t.end * 10) / 10 }))
    expect(turns).toEqual([
      { speaker: 0, start: 0, end: 6 },
      { speaker: 1, start: 8, end: 14.5 },
    ])
  })

  it('cada segmento va con quien más habla en él, o con el turno más cercano', () => {
    const turns = [{ speaker: 1, start: 0, end: 4 }, { speaker: 0, start: 4, end: 10 }]
    const segs = [{ start: 0, end: 3, text: 'Hola.' }, { start: 3, end: 8, text: 'Qué tal.' }, { start: 12, end: 13, text: 'Fin.' }]
    expect(assignSpeakers(segs, turns)).toEqual([1, 0, 0])
    expect(assignSpeakers(segs, [])).toEqual([-1, -1, -1])
    expect(renumber([1, 0, 1, -1, 2])).toEqual([0, 1, 0, -1, 2])
    expect(speakerCount([0, 1, 0, -1])).toBe(2)
  })

  it('texto por bloques con nombre y hora; subtítulos con el nombre y voces en VTT', () => {
    const segs = [{ start: 0, end: 2, text: 'Hola.' }, { start: 2, end: 4, text: '¿Cómo vas?' }, { start: 65, end: 67, text: 'Bien <3' }]
    const who = [0, 0, 1]
    expect(speakerBlocks(segs, who)).toHaveLength(2)
    expect(speakerText(segs, who, ['Ana', 'Luis'])).toBe('Ana (00:00:00): Hola. ¿Cómo vas?\n\nLuis (00:01:05): Bien <3')
    expect(speakerText(segs, [0, 0, -1], ['Ana'])).toBe('Ana (00:00:00): Hola. ¿Cómo vas?\n\nBien <3')
    expect(speakerSrt(segs, who, ['Ana'])).toContain('3\n00:01:05,000 --> 00:01:07,000\n#2: Bien <3\n')
    const vtt = speakerVtt(segs, who, ['Ana & Co', 'Luis'])
    expect(vtt.startsWith('WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n<v Ana &amp; Co>Hola.\n')).toBe(true)
    expect(vtt).toContain('<v Luis>Bien &lt;3')
    expect(speakerVtt(segs, [-1, -1, -1], [])).toContain('\nHola.\n')
  })
})

describe('con los modelos reales', () => {
  const dir = resolve(__dirname, '../../../../../public/models/diarization')
  const load = (f: { file: string; sha256: string }) => {
    const data = readFileSync(resolve(dir, f.file))
    expect(createHash('sha256').update(data).digest('hex')).toBe(f.sha256)
    return ort.InferenceSession.create(data)
  }
  const wav = (name: string) => {
    const buf = readFileSync(resolve(__dirname, '../../../../fixtures/audio', name))
    return Float32Array.from(new Int16Array(buf.buffer, buf.byteOffset + 44, (buf.length - 44) >> 1), (x) => x / 32768)
  }

  it('un diálogo de dos voces alterna entre dos hablantes; una sola voz es una persona', async () => {
    ort.env.wasm.numThreads = 1
    const engine = { ort: ort as never, segmentation: await load(DIARIZE_MODEL.segmentation), embedding: await load(DIARIZE_MODEL.embedding) }
    const turns = await diarize(engine, wav('dialogo.wav'))
    // Seis intervenciones: A, B, A, B, A, B (cada una puede partirse en una pausa).
    const order = turns.map((t) => t.speaker).filter((s, i, all) => i === 0 || s !== all[i - 1])
    expect(order).toEqual([0, 1, 0, 1, 0, 1])
    expect(turns[0].start).toBeLessThan(0.5)
    const progress: number[] = []
    const one = await diarize(engine, wav('voz-es.wav'), undefined, (f) => progress.push(f))
    expect(new Set(one.map((t) => t.speaker))).toEqual(new Set([0]))
    expect(progress[progress.length - 1]).toBe(1)
    const ctrl = new AbortController()
    ctrl.abort()
    await expect(diarize(engine, wav('voz-es.wav'), undefined, undefined, ctrl.signal)).rejects.toThrow('aborted')
    expect(FRAME_STEP).toBe(270)
  }, 120_000)
})
