/**
 * Audio a texto (W-133): las partes puras de Whisper (OpenAI, MIT) para correrlo en el
 * navegador con onnxruntime-web: espectrograma log-mel, remuestreo a 16 kHz, decodificación
 * de tokens, reglas de marcas de tiempo, segmentos y subtítulos. El modelo (whisper-base,
 * ONNX cuantizado) lo ejecuta infra/transcribe.worker.ts.
 */

export const SAMPLE_RATE = 16000
export const N_FFT = 400
export const HOP = 160
export const N_MELS = 80
export const CHUNK_SECONDS = 30
export const CHUNK_SAMPLES = SAMPLE_RATE * CHUNK_SECONDS
export const N_FRAMES = CHUNK_SAMPLES / HOP // 3000

/* ───────────── Tokens especiales (whisper multilingüe) ───────────── */

export const EOT = 50257
export const SOT = 50258
export const TRANSLATE = 50358
export const TRANSCRIBE = 50359
export const NO_SPEECH = 50362
export const NO_TIMESTAMPS = 50363
export const TIMESTAMP_BEGIN = 50364
export const VOCAB_SIZE = 51865
/** Segundos por paso de marca de tiempo. */
export const TIME_PRECISION = 0.02
export const MAX_NEW_TOKENS = 224

export const LANGUAGES = {
  es: 50262,
  en: 50259,
  pt: 50267,
  fr: 50265,
  it: 50274,
  de: 50261,
  ca: 50270,
  eu: 50310,
  ru: 50263,
  ja: 50266,
  ko: 50264,
  zh: 50260,
} as const
export type LanguageCode = keyof typeof LANGUAGES
export const LANGUAGE_IDS: ReadonlyArray<[LanguageCode, number]> = Object.entries(LANGUAGES) as Array<[LanguageCode, number]>

/** Tokens que nunca se generan (signos sueltos, símbolos, tokens de control). */
export const SUPPRESS_TOKENS = [
  1, 2, 7, 8, 9, 10, 14, 25, 26, 27, 28, 29, 31, 58, 59, 60, 61, 62, 63, 90, 91, 92, 93, 359, 503, 522, 542, 873, 893, 902, 918, 922, 931, 1350, 1853, 1982, 2460, 2627, 3246, 3253, 3268, 3536, 3846, 3961, 4183, 4667, 6585, 6647, 7273, 9061, 9383, 10428, 10929, 11938, 12033, 12331, 12562,
  13793, 14157, 14635, 15265, 15618, 16553, 16604, 18362, 18956, 20075, 21675, 22520, 26130, 26161, 26435, 28279, 29464, 31650, 32302, 32470, 36865, 42863, 47425, 49870, 50254, 50258, 50358, 50359, 50360, 50361, 50362,
]

/** El modelo, servido desde docusmart.online (public/models/whisper-base/) y verificado. */
export const WHISPER_MODEL = {
  base: '/models/whisper-base/',
  encoder: { parts: [{ file: 'encoder.v1.bin', bytes: 23201314 }], bytes: 23201314, sha256: '5862993336bf33acd23736071aae2b32261d3b1b2f37780194460d4ef974dd46' },
  decoder: {
    parts: [
      { file: 'decoder.v1.part0.bin', bytes: 26846658 },
      { file: 'decoder.v1.part1.bin', bytes: 26846657 },
    ],
    bytes: 53693315,
    sha256: 'fa3ef9902734ce5ae6f9ef2bdb2ba9a6c4b5785b09f4f420ce036573dc9d090b',
  },
  tokens: { file: 'tokens.v1.json', bytes: 545096, sha256: 'c3793c6eeb9d72bb5908f0341af745e8dc2d462848ecbc1d97d2f3f6aa7a57a2' },
} as const
export const WHISPER_BYTES = WHISPER_MODEL.encoder.bytes + WHISPER_MODEL.decoder.bytes + WHISPER_MODEL.tokens.bytes

/* ───────────── Audio ───────────── */

/** Mezcla los canales en mono. */
export function toMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0]
  const n = Math.min(...channels.map((c) => c.length))
  const out = new Float32Array(n)
  for (const c of channels) for (let i = 0; i < n; i++) out[i] += c[i] / channels.length
  return out
}

/**
 * Remuestrea a 16 kHz promediando las muestras que caen en cada salida (un filtro de caja,
 * que además evita el aliasing al bajar de 44,1 o 48 kHz). Para subir, interpola.
 */
export function resample(input: Float32Array, fromRate: number, toRate = SAMPLE_RATE): Float32Array {
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const n = Math.floor(input.length / ratio)
  const out = new Float32Array(n)
  if (ratio < 1) {
    for (let i = 0; i < n; i++) {
      const x = i * ratio
      const a = Math.floor(x)
      const b = Math.min(input.length - 1, a + 1)
      out[i] = input[a] + (input[b] - input[a]) * (x - a)
    }
    return out
  }
  for (let i = 0; i < n; i++) {
    const start = i * ratio
    const end = start + ratio
    let sum = 0
    let weight = 0
    for (let j = Math.floor(start); j < Math.ceil(end) && j < input.length; j++) {
      const w = Math.min(j + 1, end) - Math.max(j, start)
      sum += input[j] * w
      weight += w
    }
    out[i] = weight ? sum / weight : 0
  }
  return out
}

/**
 * Remuestreo por partes sin perder alineación: guarda lo que sobra de cada parte para la
 * siguiente, así los tiempos no se corren aunque el audio llegue en miles de trozos.
 */
export class StreamResampler {
  private carry = new Float32Array(0)
  private produced = 0
  private consumed = 0
  constructor(
    private readonly fromRate: number,
    private readonly toRate = SAMPLE_RATE,
  ) {}
  push(chunk: Float32Array): Float32Array {
    if (this.fromRate === this.toRate) return chunk
    const data = new Float32Array(this.carry.length + chunk.length)
    data.set(this.carry)
    data.set(chunk, this.carry.length)
    const ratio = this.fromRate / this.toRate
    // Cuántas salidas completas caben con lo que hay (posición absoluta, sin acumular error).
    const available = this.consumed + data.length
    const n = Math.floor(available / ratio) - this.produced
    const out = new Float32Array(Math.max(0, n))
    for (let i = 0; i < out.length; i++) {
      const start = (this.produced + i) * ratio - this.consumed
      const end = start + ratio
      let sum = 0
      let weight = 0
      for (let j = Math.max(0, Math.floor(start)); j < Math.ceil(end) && j < data.length; j++) {
        const w = Math.min(j + 1, end) - Math.max(j, start)
        sum += data[j] * w
        weight += w
      }
      out[i] = weight ? sum / weight : 0
    }
    this.produced += out.length
    // Se conserva desde la primera muestra que todavía se necesita.
    const keepFrom = Math.max(0, Math.floor(this.produced * ratio - this.consumed))
    this.carry = data.slice(keepFrom)
    this.consumed += keepFrom
    return out
  }
}

/* ───────────── Espectrograma log-mel ───────────── */

type Plan = { n: number; p: number; m: number; cos: Float64Array; sin: Float64Array; subRe: Float64Array[]; subIm: Float64Array[]; outRe: Float64Array; outIm: Float64Array }
const PLANS = new Map<number, Plan>()

/** Tablas de senos y cosenos y búferes reutilizables para un tamaño (se calculan una vez). */
function planFor(n: number): Plan {
  let plan = PLANS.get(n)
  if (plan) return plan
  let p = 2
  while (n % p) p++
  const m = n / p
  plan = {
    n,
    p,
    m,
    cos: Float64Array.from({ length: n }, (_, i) => Math.cos((-2 * Math.PI * i) / n)),
    sin: Float64Array.from({ length: n }, (_, i) => Math.sin((-2 * Math.PI * i) / n)),
    subRe: p === n ? [] : Array.from({ length: p }, () => new Float64Array(m)),
    subIm: p === n ? [] : Array.from({ length: p }, () => new Float64Array(m)),
    outRe: new Float64Array(n),
    outIm: new Float64Array(n),
  }
  PLANS.set(n, plan)
  return plan
}

/**
 * FFT de cualquier tamaño compuesto (Cooley-Tukey de base mixta, recursiva) sobre los mismos
 * arreglos. Para N = 400 son ~7 200 operaciones por cuadro en vez de 160 000 de la DFT directa.
 */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  if (n <= 1) return
  const { p, m, cos, sin, subRe, subIm, outRe, outIm } = planFor(n)
  if (p === n) {
    // Tamaño primo: DFT directa con las tablas.
    for (let k = 0; k < n; k++) {
      let sr = 0
      let si = 0
      for (let t = 0; t < n; t++) {
        const j = (k * t) % n
        sr += re[t] * cos[j] - im[t] * sin[j]
        si += re[t] * sin[j] + im[t] * cos[j]
      }
      outRe[k] = sr
      outIm[k] = si
    }
    re.set(outRe)
    im.set(outIm)
    return
  }
  for (let t = 0; t < m; t++)
    for (let r = 0; r < p; r++) {
      subRe[r][t] = re[t * p + r]
      subIm[r][t] = im[t * p + r]
    }
  // Los búferes de los subproblemas son de otro tamaño: no se pisan en la recursión.
  for (let r = 0; r < p; r++) fft(subRe[r], subIm[r])
  for (let k = 0; k < n; k++) {
    let sr = 0
    let si = 0
    const km = k % m
    for (let r = 0; r < p; r++) {
      const j = (r * k) % n
      const xr = subRe[r][km]
      const xi = subIm[r][km]
      sr += xr * cos[j] - xi * sin[j]
      si += xr * sin[j] + xi * cos[j]
    }
    outRe[k] = sr
    outIm[k] = si
  }
  re.set(outRe)
  im.set(outIm)
}

const hzToMel = (f: number) => (f < 1000 ? (3 * f) / 200 : 15 + (27 * Math.log(f / 1000)) / Math.log(6.4))
const melToHz = (m: number) => (m < 15 ? (200 * m) / 3 : 1000 * Math.exp(((m - 15) * Math.log(6.4)) / 27))

/** Banco de filtros mel (escala y normalización "slaney", como librosa y Whisper): N_MELS × 201. */
export function melFilters(): Float32Array[] {
  const bins = N_FFT / 2 + 1
  const fftFreqs = Array.from({ length: bins }, (_, i) => (i * SAMPLE_RATE) / N_FFT)
  const minMel = hzToMel(0)
  const maxMel = hzToMel(SAMPLE_RATE / 2)
  const hz = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz(minMel + ((maxMel - minMel) * i) / (N_MELS + 1)))
  return Array.from({ length: N_MELS }, (_, m) => {
    const row = new Float32Array(bins)
    const enorm = 2 / (hz[m + 2] - hz[m])
    for (let k = 0; k < bins; k++) {
      const lower = (fftFreqs[k] - hz[m]) / (hz[m + 1] - hz[m])
      const upper = (hz[m + 2] - fftFreqs[k]) / (hz[m + 2] - hz[m + 1])
      row[k] = Math.max(0, Math.min(lower, upper)) * enorm
    }
    return row
  })
}

let FILTERS: Float32Array[] | null = null
let WINDOW: Float64Array | null = null

/**
 * Espectrograma log-mel de 30 s (se rellena con silencio), en el formato que espera el modelo:
 * N_MELS × N_FRAMES, fila por fila.
 */
export function logMel(samples: Float32Array): Float32Array {
  FILTERS ??= melFilters()
  WINDOW ??= Float64Array.from({ length: N_FFT }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N_FFT))
  const audio = new Float32Array(CHUNK_SAMPLES)
  audio.set(samples.subarray(0, CHUNK_SAMPLES))
  // STFT centrada: relleno por reflexión de N_FFT/2 a cada lado.
  const pad = N_FFT / 2
  const padded = new Float32Array(CHUNK_SAMPLES + 2 * pad)
  padded.set(audio, pad)
  for (let i = 0; i < pad; i++) {
    padded[pad - 1 - i] = audio[i + 1]
    padded[pad + CHUNK_SAMPLES + i] = audio[CHUNK_SAMPLES - 2 - i]
  }
  const bins = N_FFT / 2 + 1
  const mel = new Float32Array(N_MELS * N_FRAMES)
  const re = new Float64Array(N_FFT)
  const im = new Float64Array(N_FFT)
  const power = new Float64Array(bins)
  let maxLog = -Infinity
  for (let f = 0; f < N_FRAMES; f++) {
    const off = f * HOP
    for (let i = 0; i < N_FFT; i++) {
      re[i] = padded[off + i] * WINDOW[i]
      im[i] = 0
    }
    fft(re, im)
    for (let k = 0; k < bins; k++) power[k] = re[k] * re[k] + im[k] * im[k]
    for (let m = 0; m < N_MELS; m++) {
      const row = FILTERS[m]
      let s = 0
      for (let k = 0; k < bins; k++) s += row[k] * power[k]
      const v = Math.log10(Math.max(s, 1e-10))
      mel[m * N_FRAMES + f] = v
      if (v > maxLog) maxLog = v
    }
  }
  for (let i = 0; i < mel.length; i++) mel[i] = (Math.max(mel[i], maxLog - 8) + 4) / 4
  return mel
}

/* ───────────── Texto ───────────── */

let BYTE_OF: Map<string, number> | null = null
/** Inverso de bytes_to_unicode de GPT-2: cada carácter del vocabulario vuelve a su byte. */
function byteOf(): Map<string, number> {
  if (BYTE_OF) return BYTE_OF
  const bs: number[] = []
  for (let b = 33; b <= 126; b++) bs.push(b)
  for (let b = 161; b <= 172; b++) bs.push(b)
  for (let b = 174; b <= 255; b++) bs.push(b)
  const cs = [...bs]
  let n = 0
  for (let b = 0; b < 256; b++)
    if (!bs.includes(b)) {
      bs.push(b)
      cs.push(256 + n++)
    }
  BYTE_OF = new Map(cs.map((c, i) => [String.fromCharCode(c), bs[i]]))
  return BYTE_OF
}

/** Texto de una lista de tokens (se ignoran los especiales y las marcas de tiempo). */
export function decodeTokens(ids: readonly number[], vocab: readonly string[]): string {
  const map = byteOf()
  const bytes: number[] = []
  for (const id of ids) {
    if (id >= EOT || id < 0) continue
    for (const ch of vocab[id] ?? '') bytes.push(map.get(ch) ?? 63)
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

/* ───────────── Decodificación ───────────── */

export const isTimestamp = (id: number) => id >= TIMESTAMP_BEGIN

/** Índice del mayor valor. */
export function argmax(v: Float32Array): number {
  let best = 0
  for (let i = 1; i < v.length; i++) if (v[i] > v[best]) best = i
  return best
}

/** log(Σ exp) estable. */
function logSumExp(v: Float32Array, from: number, to: number): number {
  let max = -Infinity
  for (let i = from; i < to; i++) if (v[i] > max) max = v[i]
  if (max === -Infinity) return -Infinity
  let s = 0
  for (let i = from; i < to; i++) s += Math.exp(v[i] - max)
  return max + Math.log(s)
}

/** Probabilidad (log) del token elegido, para descartar ventanas que son solo ruido. */
export function tokenLogProb(logits: Float32Array, id: number): number {
  return logits[id] - logSumExp(logits, 0, logits.length)
}

/**
 * Prepara los logits del siguiente token (los modifica): tokens suprimidos y las reglas de
 * marcas de tiempo de Whisper (empiezan con una marca, van en pares, no retroceden, y se fuerza
 * una marca cuando es más probable que cualquier palabra).
 */
export function applyRules(logits: Float32Array, generated: readonly number[]): void {
  for (const t of SUPPRESS_TOKENS) logits[t] = -Infinity
  logits[NO_TIMESTAMPS] = -Infinity
  const n = generated.length
  if (n === 0) {
    logits[220] = -Infinity
    logits[EOT] = -Infinity
  }
  const lastTs = n >= 1 && isTimestamp(generated[n - 1])
  const penultTs = n < 2 || isTimestamp(generated[n - 2])
  if (lastTs) {
    if (penultTs) logits.fill(-Infinity, TIMESTAMP_BEGIN)
    else logits.fill(-Infinity, 0, EOT)
  }
  const stamps = generated.filter(isTimestamp)
  if (stamps.length) {
    const last = stamps[stamps.length - 1]
    // Tras el cierre de un par, la siguiente marca debe ser posterior; dentro del par, igual o posterior.
    logits.fill(-Infinity, TIMESTAMP_BEGIN, lastTs && !penultTs ? last : last + 1)
  }
  if (n === 0) {
    // La primera marca es de como mucho 1 s.
    logits.fill(-Infinity, 0, TIMESTAMP_BEGIN)
    logits.fill(-Infinity, TIMESTAMP_BEGIN + 51)
  }
  const total = logSumExp(logits, 0, logits.length)
  const tsLogProb = logSumExp(logits, TIMESTAMP_BEGIN, logits.length) - total
  let maxText = -Infinity
  for (let i = 0; i < TIMESTAMP_BEGIN; i++) if (logits[i] > maxText) maxText = logits[i]
  if (tsLogProb > maxText - total) logits.fill(-Infinity, 0, TIMESTAMP_BEGIN)
}

/** Idioma más probable según los logits del token que sigue a <|startoftranscript|>. */
export function detectLanguage(logits: Float32Array): LanguageCode {
  let best: LanguageCode = 'es'
  let bestValue = -Infinity
  for (const [code, id] of LANGUAGE_IDS)
    if (logits[id] > bestValue) {
      best = code
      bestValue = logits[id]
    }
  return best
}

/* ───────────── Segmentos ───────────── */

export type Segment = { start: number; end: number; text: string }

/**
 * Segmentos de una ventana a partir de los tokens generados (sin el prompt ni EOT), con su
 * tiempo absoluto, y cuántas muestras avanzar para la siguiente ventana (como Whisper: hasta la
 * última marca si el texto quedó cortado; la ventana entera si terminó en una marca suelta).
 */
export function windowSegments(tokens: readonly number[], vocab: readonly string[], offsetSeconds: number, windowSamples: number): { segments: Segment[]; advance: number } {
  const toSec = (id: number) => (id - TIMESTAMP_BEGIN) * TIME_PRECISION
  const segments: Segment[] = []
  const push = (start: number, end: number, ids: readonly number[]) => {
    const text = decodeTokens(ids, vocab).trim()
    if (text) segments.push({ start: offsetSeconds + start, end: offsetSeconds + Math.max(end, start), text })
  }
  const consecutive: number[] = []
  for (let i = 1; i < tokens.length; i++) if (isTimestamp(tokens[i - 1]) && isTimestamp(tokens[i])) consecutive.push(i)
  const singleEnding = tokens.length >= 2 && isTimestamp(tokens[tokens.length - 1]) && !isTimestamp(tokens[tokens.length - 2])
  if (consecutive.length) {
    const slices = singleEnding ? [...consecutive, tokens.length] : consecutive
    let last = 0
    for (const cur of slices) {
      const piece = tokens.slice(last, cur)
      push(toSec(piece[0]), toSec(piece[piece.length - 1]), piece)
      last = cur
    }
    if (singleEnding) return { segments, advance: windowSamples }
    const lastTs = toSec(tokens[last - 1])
    const advance = Math.round(lastTs * SAMPLE_RATE)
    return { segments, advance: advance > 0 ? Math.min(advance, windowSamples) : windowSamples }
  }
  const stamps = tokens.filter(isTimestamp)
  const duration = stamps.length && stamps[stamps.length - 1] !== TIMESTAMP_BEGIN ? toSec(stamps[stamps.length - 1]) : windowSamples / SAMPLE_RATE
  push(0, duration, tokens)
  return { segments, advance: windowSamples }
}

/** Texto corrido: un párrafo nuevo cuando hay una pausa larga entre segmentos. */
export function segmentsToText(segments: readonly Segment[], pause = 2): string {
  let out = ''
  segments.forEach((s, i) => {
    if (i === 0) out = s.text
    else out += (s.start - segments[i - 1].end > pause ? '\n\n' : ' ') + s.text
  })
  return out
}

/** 3725.5 → "01:02:05,500" (SRT) o "01:02:05.500" (VTT). */
export function formatTimestamp(seconds: number, sep: ',' | '.' = ','): string {
  const ms = Math.max(0, Math.round(seconds * 1000))
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))}${sep}${p(ms % 1000, 3)}`
}

/** Subtítulos SRT. */
export function toSrt(segments: readonly Segment[]): string {
  return segments.map((s, i) => `${i + 1}\n${formatTimestamp(s.start)} --> ${formatTimestamp(s.end)}\n${s.text}\n`).join('\n')
}

/** Subtítulos WebVTT (para la web y los reproductores). */
export function toVtt(segments: readonly Segment[]): string {
  return 'WEBVTT\n\n' + segments.map((s) => `${formatTimestamp(s.start, '.')} --> ${formatTimestamp(s.end, '.')}\n${s.text}\n`).join('\n')
}

/** Prompt de cada ventana: inicio, idioma y tarea (con marcas de tiempo). */
export const prompt = (language: LanguageCode, translate: boolean) => [SOT, LANGUAGES[language], translate ? TRANSLATE : TRANSCRIBE]

/** ¿La ventana es solo silencio o ruido? (probabilidad de "sin voz" alta y texto poco probable) */
export const isSilence = (noSpeechProb: number, avgLogProb: number) => noSpeechProb > 0.6 && avgLogProb < -1
