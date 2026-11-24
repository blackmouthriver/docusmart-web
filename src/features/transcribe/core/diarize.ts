/**
 * Distinguir hablantes en "Audio a texto" (W-147.4): las partes puras de la diarización al estilo
 * de pyannote 3.1, para correrla en el navegador con onnxruntime-web.
 *
 * 1. Segmentación (pyannote/segmentation-3.0, MIT) en ventanas de 10 s que se solapan la mitad:
 *    por cada cuadro de ~17 ms dice cuál de hasta 3 hablantes "locales" suena (codificación
 *    powerset: nadie, uno solo o dos a la vez).
 * 2. Huella de voz (WeSpeaker ResNet34, CC BY 4.0) de cada hablante local, con el banco de
 *    filtros de Kaldi (fbank) sobre los trozos donde habla solo.
 * 3. Agrupamiento aglomerativo de las huellas: dos hablantes de la misma ventana nunca se unen.
 * 4. Turnos por hablante y asignación de cada segmento de Whisper al que más habla en él.
 */
import { SAMPLE_RATE, fft, formatTimestamp, type Segment } from './whisper'

/** Los modelos, servidos desde docusmart.online (public/models/diarization/) y verificados. */
export const DIARIZE_MODEL = {
  base: '/models/diarization/',
  segmentation: { file: 'segmentation.v1.bin', bytes: 5986908, sha256: '057ee564753071c0b09b5b611648b50ac188d50846bff5f01e9f7bbf1591ea25' },
  embedding: { file: 'embedding.v1.bin', bytes: 6685134, sha256: 'f73f647730ae440ae411c2241290f42ff5b2106dd3176c897fe6fbb1950d5393' },
} as const
export const DIARIZE_BYTES = DIARIZE_MODEL.segmentation.bytes + DIARIZE_MODEL.embedding.bytes

/* ───────────── Segmentación ───────────── */

export const WINDOW_SAMPLES = 10 * SAMPLE_RATE
export const WINDOW_STEP = WINDOW_SAMPLES / 2
/** Cuadros de la segmentación: paso y campo receptivo, en muestras (preprocessor_config.json). */
export const FRAME_STEP = 270
export const FRAME_SPAN = 990
export const LOCAL_SPEAKERS = 3

/** Cuántos cuadros devuelve el modelo para una entrada de `samples` muestras. */
export const frameCount = (samples: number) => Math.floor((samples - FRAME_SPAN) / FRAME_STEP) + 1
/** Centro del cuadro `i`, en muestras desde el inicio de la ventana. */
export const frameCenter = (i: number) => i * FRAME_STEP + FRAME_SPAN / 2

/** Inicio de cada ventana: cada 5 s, hasta que la última llega al final (se rellena con silencio). */
export function windowStarts(samples: number): number[] {
  const out = [0]
  while (out[out.length - 1] + WINDOW_SAMPLES < samples) out.push(out[out.length - 1] + WINDOW_STEP)
  return out
}

/** Ventana `start` del audio, de 10 s exactos (lo que falta, en silencio). */
export function windowAudio(audio: Float32Array, start: number): Float32Array {
  if (start + WINDOW_SAMPLES <= audio.length) return audio.subarray(start, start + WINDOW_SAMPLES)
  const out = new Float32Array(WINDOW_SAMPLES)
  out.set(audio.subarray(start))
  return out
}

/** Clases del powerset: qué hablantes locales suenan en cada una. */
const POWERSET: ReadonlyArray<readonly number[]> = [[], [0], [1], [2], [0, 1], [0, 2], [1, 2]]

/**
 * Logits [cuadros × 7] → actividad [cuadros × 3] (1 si el hablante local suena en el cuadro).
 */
export function powersetToActivity(logits: Float32Array, frames: number): Uint8Array {
  const classes = POWERSET.length
  const out = new Uint8Array(frames * LOCAL_SPEAKERS)
  for (let f = 0; f < frames; f++) {
    let best = 0
    for (let c = 1; c < classes; c++) if (logits[f * classes + c] > logits[f * classes + best]) best = c
    for (const s of POWERSET[best]) out[f * LOCAL_SPEAKERS + s] = 1
  }
  return out
}

/** Mínimo de voz de un hablante local para sacar su huella (más corto no es confiable). */
export const MIN_SPEECH_SECONDS = 0.4

/**
 * Muestras de la ventana donde suena el hablante local `k`: las que habla solo, o todas las suyas
 * si solo no alcanza. Vacío si casi no habla.
 */
export function speakerSamples(window: Float32Array, activity: Uint8Array, frames: number, k: number): Float32Array {
  const alone: number[] = []
  const any: number[] = []
  for (let f = 0; f < frames; f++) {
    if (!activity[f * LOCAL_SPEAKERS + k]) continue
    any.push(f)
    let others = 0
    for (let j = 0; j < LOCAL_SPEAKERS; j++) if (j !== k) others += activity[f * LOCAL_SPEAKERS + j]
    if (!others) alone.push(f)
  }
  const minFrames = (MIN_SPEECH_SECONDS * SAMPLE_RATE) / FRAME_STEP
  const chosen = alone.length >= minFrames ? alone : any
  if (chosen.length < minFrames) return new Float32Array(0)
  const out = new Float32Array(chosen.length * FRAME_STEP)
  let at = 0
  for (const f of chosen) {
    const from = Math.max(0, frameCenter(f) - FRAME_STEP / 2)
    const part = window.subarray(from, Math.min(window.length, from + FRAME_STEP))
    out.set(part, at)
    at += part.length
  }
  return out.subarray(0, at)
}

/* ───────────── Huella de voz: fbank de Kaldi ───────────── */

export const FBANK_BINS = 80
const FRAME_LEN = 400 // 25 ms
const FRAME_SHIFT = 160 // 10 ms
const FFT_SIZE = 512
const PREEMPH = 0.97
const LOW_HZ = 20
const EPS = 1.1920928955078125e-7

const kaldiMel = (hz: number) => 1127 * Math.log(1 + hz / 700)

let BANKS: Float32Array[] | null = null
let HAMMING: Float64Array | null = null

/** Filtros triangulares en la escala mel de Kaldi, sobre los primeros 256 bins de la FFT de 512. */
function melBanks(): Float32Array[] {
  const bins = FFT_SIZE / 2
  const width = SAMPLE_RATE / FFT_SIZE
  const low = kaldiMel(LOW_HZ)
  const high = kaldiMel(SAMPLE_RATE / 2)
  const delta = (high - low) / (FBANK_BINS + 1)
  return Array.from({ length: FBANK_BINS }, (_, b) => {
    const left = low + b * delta
    const center = left + delta
    const right = center + delta
    const row = new Float32Array(bins)
    for (let i = 0; i < bins; i++) {
      const m = kaldiMel(width * i)
      if (m > left && m < right) row[i] = m <= center ? (m - left) / (center - left) : (right - m) / (right - center)
    }
    return row
  })
}

/**
 * Banco de filtros log-mel de Kaldi (80 bandas, 25 ms cada 10 ms, Hamming, sin dither), con la
 * media restada por banda: lo que espera WeSpeaker. Devuelve [cuadros × 80].
 */
export function kaldiFbank(samples: Float32Array): { data: Float32Array; frames: number } {
  const frames = samples.length < FRAME_LEN ? 0 : Math.floor((samples.length - FRAME_LEN) / FRAME_SHIFT) + 1
  const data = new Float32Array(frames * FBANK_BINS)
  if (!frames) return { data, frames }
  BANKS ??= melBanks()
  HAMMING ??= Float64Array.from({ length: FRAME_LEN }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME_LEN - 1)))
  const re = new Float64Array(FFT_SIZE)
  const im = new Float64Array(FFT_SIZE)
  const power = new Float64Array(FFT_SIZE / 2)
  for (let f = 0; f < frames; f++) {
    const off = f * FRAME_SHIFT
    let mean = 0
    for (let i = 0; i < FRAME_LEN; i++) mean += samples[off + i]
    mean = (mean / FRAME_LEN) * 32768
    re.fill(0)
    im.fill(0)
    for (let i = 0; i < FRAME_LEN; i++) re[i] = samples[off + i] * 32768 - mean
    for (let i = FRAME_LEN - 1; i > 0; i--) re[i] -= PREEMPH * re[i - 1]
    re[0] -= PREEMPH * re[0]
    for (let i = 0; i < FRAME_LEN; i++) re[i] *= HAMMING[i]
    fft(re, im)
    for (let k = 0; k < power.length; k++) power[k] = re[k] * re[k] + im[k] * im[k]
    for (let b = 0; b < FBANK_BINS; b++) {
      const row = BANKS[b]
      let s = 0
      for (let k = 0; k < power.length; k++) s += row[k] * power[k]
      data[f * FBANK_BINS + b] = Math.log(Math.max(s, EPS))
    }
  }
  for (let b = 0; b < FBANK_BINS; b++) {
    let m = 0
    for (let f = 0; f < frames; f++) m += data[f * FBANK_BINS + b]
    m /= frames
    for (let f = 0; f < frames; f++) data[f * FBANK_BINS + b] -= m
  }
  return { data, frames }
}

/* ───────────── Agrupamiento ───────────── */

/** Huella de un hablante local: de qué ventana es y cuánto habla en ella. */
export type Voiceprint = { window: number; local: number; vector: Float32Array; seconds: number }

export function normalize(v: Float32Array): Float32Array {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  return v.map((x) => x / n)
}

const dot = (a: Float32Array, b: Float32Array) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Similitud mínima (coseno) para que dos grupos sean la misma persona. */
export const SAME_SPEAKER = 0.5
/** Un grupo con menos voz que esto se suma al más parecido (suelen ser ruidos o risas). */
export const MIN_CLUSTER_SECONDS = 2

/**
 * Agrupa las huellas (aglomerativo por centroides, de a una unión, la más parecida primero).
 * Dos huellas de la misma ventana son personas distintas y nunca se unen. Con `count` (cuántas
 * personas hablan, si el usuario lo sabe) se une hasta llegar a ese número, sin umbral. Devuelve
 * el grupo de cada huella, numerado por orden de aparición.
 */
export function clusterVoiceprints(prints: readonly Voiceprint[], count?: number, threshold = SAME_SPEAKER): number[] {
  type Group = { sum: Float32Array; unit: Float32Array; members: number[]; windows: Set<number>; seconds: number }
  const groups: Array<Group | null> = prints.map((p, i) => {
    const unit = normalize(p.vector)
    return { sum: unit.slice(), unit, members: [i], windows: new Set([p.window]), seconds: p.seconds }
  })
  const clash = (a: Group, b: Group) => [...a.windows].some((w) => b.windows.has(w))
  const live = () => groups.filter((g): g is Group => g !== null)
  const merge = (i: number, j: number) => {
    const a = groups[i]!
    const b = groups[j]!
    for (let d = 0; d < a.sum.length; d++) a.sum[d] += b.sum[d]
    a.unit = normalize(a.sum)
    a.members.push(...b.members)
    b.windows.forEach((w) => a.windows.add(w))
    a.seconds += b.seconds
    groups[j] = null
  }
  for (;;) {
    let best = -Infinity
    let bi = -1
    let bj = -1
    for (let i = 0; i < groups.length; i++) {
      const a = groups[i]
      if (!a) continue
      for (let j = i + 1; j < groups.length; j++) {
        const b = groups[j]
        if (!b || clash(a, b)) continue
        const s = dot(a.unit, b.unit)
        if (s > best) {
          best = s
          bi = i
          bj = j
        }
      }
    }
    if (bi < 0 || (count ? live().length <= count : best < threshold)) break
    merge(bi, bj)
  }
  // Los grupos chicos van con el grupo grande más parecido (si lo hay y no se pidió un número).
  const big = live().filter((g) => g.seconds >= MIN_CLUSTER_SECONDS)
  if (big.length && !count)
    for (const g of live()) {
      if (g.seconds >= MIN_CLUSTER_SECONDS) continue
      let target = big[0]
      for (const b of big) if (dot(g.unit, b.unit) > dot(g.unit, target.unit)) target = b
      target.members.push(...g.members)
      groups[groups.indexOf(g)] = null
    }
  const label = new Array<number>(prints.length).fill(-1)
  const order = live()
    .map((g) => ({ g, first: Math.min(...g.members.map((m) => prints[m].window * 10 + prints[m].local)) }))
    .sort((a, b) => a.first - b.first)
  order.forEach(({ g }, n) => g.members.forEach((m) => (label[m] = n)))
  return label
}

/* ───────────── Turnos ───────────── */

/** Un tramo en que habla una persona. */
export type Turn = { speaker: number; start: number; end: number }

/** Ventana ya analizada: dónde empieza, su actividad y a qué hablante global va cada local. */
export type WindowResult = { start: number; activity: Uint8Array; frames: number; speakers: number[] }

/** Une tramos del mismo hablante separados por menos de esto (respiraciones, pausas cortas). */
const JOIN_GAP = 0.5
/** Tramos más cortos que esto no cuentan. */
const MIN_TURN = 0.2

/**
 * Turnos de todo el audio. Cada instante lo decide la ventana en la que queda más al centro (los
 * bordes de una ventana son lo menos preciso de la segmentación).
 */
export function buildTurns(windows: readonly WindowResult[], totalSamples: number): Turn[] {
  const open = new Map<number, Turn>()
  const done: Turn[] = []
  const t = (s: number) => s / SAMPLE_RATE
  for (let pos = 0; pos < totalSamples; pos += FRAME_STEP) {
    // La ventana cuyo centro está más cerca.
    let w = windows[0]
    for (const c of windows) if (Math.abs(c.start + WINDOW_SAMPLES / 2 - pos) < Math.abs(w.start + WINDOW_SAMPLES / 2 - pos)) w = c
    const f = Math.min(w.frames - 1, Math.max(0, Math.round((pos - w.start - FRAME_SPAN / 2) / FRAME_STEP)))
    const now = new Set<number>()
    for (let k = 0; k < LOCAL_SPEAKERS; k++) if (w.activity[f * LOCAL_SPEAKERS + k] && w.speakers[k] >= 0) now.add(w.speakers[k])
    for (const s of now) {
      const turn = open.get(s)
      if (turn) turn.end = t(pos + FRAME_STEP)
      else open.set(s, { speaker: s, start: t(pos), end: t(pos + FRAME_STEP) })
    }
    for (const [s, turn] of open)
      if (!now.has(s) && t(pos) - turn.end >= JOIN_GAP) {
        done.push(turn)
        open.delete(s)
      }
  }
  done.push(...open.values())
  const end = t(totalSamples)
  const turns = done
    .map((x) => ({ ...x, end: Math.min(x.end, end) }))
    .filter((x) => x.end - x.start >= MIN_TURN)
    .sort((a, b) => a.start - b.start || a.speaker - b.speaker)
  // El primero que habla es el 0, el segundo el 1…
  const ids = renumber(turns.map((x) => x.speaker))
  return turns.map((x, i) => ({ ...x, speaker: ids[i] }))
}

/**
 * Hablante de cada segmento de Whisper: el que más suena en él; si nadie (Whisper a veces corre
 * un poco los tiempos), el del turno más cercano. -1 si no hay turnos.
 */
export function assignSpeakers(segments: readonly Segment[], turns: readonly Turn[]): number[] {
  return segments.map((seg) => {
    const time = new Map<number, number>()
    for (const t of turns) {
      const o = Math.min(seg.end, t.end) - Math.max(seg.start, t.start)
      if (o > 0) time.set(t.speaker, (time.get(t.speaker) ?? 0) + o)
    }
    if (time.size) return [...time].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
    let best = -1
    let gap = Infinity
    for (const t of turns) {
      const d = Math.max(t.start - seg.end, seg.start - t.end)
      if (d < gap) {
        gap = d
        best = t.speaker
      }
    }
    return best
  })
}

/** Renumera por orden de aparición en el texto (el primero que habla es el 1). */
export function renumber(speakers: readonly number[]): number[] {
  const map = new Map<number, number>()
  return speakers.map((s) => {
    if (s < 0) return s
    if (!map.has(s)) map.set(s, map.size)
    return map.get(s)!
  })
}

/** Cuántas personas distintas hablan. */
export const speakerCount = (speakers: readonly number[]) => new Set(speakers.filter((s) => s >= 0)).size

/* ───────────── Texto con hablantes ───────────── */

const nameOf = (names: readonly string[], s: number) => (s >= 0 ? names[s] || `#${s + 1}` : '')

/** Bloques de texto: un párrafo cada vez que cambia quien habla, con su nombre y la hora. */
export function speakerBlocks(segments: readonly Segment[], speakers: readonly number[]): Array<{ speaker: number; start: number; text: string }> {
  const out: Array<{ speaker: number; start: number; text: string }> = []
  segments.forEach((s, i) => {
    const last = out[out.length - 1]
    if (last && last.speaker === speakers[i]) last.text += ' ' + s.text
    else out.push({ speaker: speakers[i], start: s.start, text: s.text })
  })
  return out
}

/** Texto corrido con hablantes: «Ana (00:01:05): …». */
export function speakerText(segments: readonly Segment[], speakers: readonly number[], names: readonly string[]): string {
  return speakerBlocks(segments, speakers)
    .map((b) => (b.speaker >= 0 ? `${nameOf(names, b.speaker)} (${formatTimestamp(b.start).slice(0, 8)}): ${b.text}` : b.text))
    .join('\n\n')
}

/** Subtítulos SRT con el nombre delante. */
export function speakerSrt(segments: readonly Segment[], speakers: readonly number[], names: readonly string[]): string {
  return segments
    .map((s, i) => `${i + 1}\n${formatTimestamp(s.start)} --> ${formatTimestamp(s.end)}\n${speakers[i] >= 0 ? `${nameOf(names, speakers[i])}: ` : ''}${s.text}\n`)
    .join('\n')
}

const vttEscape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** WebVTT con etiquetas de voz (<v Ana>), que los reproductores muestran como hablante. */
export function speakerVtt(segments: readonly Segment[], speakers: readonly number[], names: readonly string[]): string {
  return (
    'WEBVTT\n\n' +
    segments
      .map((s, i) => `${formatTimestamp(s.start, '.')} --> ${formatTimestamp(s.end, '.')}\n${speakers[i] >= 0 ? `<v ${vttEscape(nameOf(names, speakers[i]))}>` : ''}${vttEscape(s.text)}\n`)
      .join('\n')
  )
}
