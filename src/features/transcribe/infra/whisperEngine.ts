/**
 * Motor de Whisper (W-133): ejecuta el encoder y el decoder ONNX con onnxruntime-web, ventana de
 * 30 s por ventana, con caché de claves y valores en el decoder y búsqueda voraz. Recibe el
 * módulo de onnxruntime como parámetro, así corre igual en el worker y en las pruebas en Node.
 * Excluido de la cobertura (necesita el modelo); se prueba de punta a punta.
 */
import type * as Ort from 'onnxruntime-web'
import { deflateSync } from 'fflate'
import {
  CHUNK_SAMPLES,
  EOT,
  MAX_NEW_TOKENS,
  N_FRAMES,
  N_MELS,
  NO_SPEECH,
  SAMPLE_RATE,
  SOT,
  TEMPERATURES,
  applyRules,
  attemptScore,
  compressionRatio,
  decodeTokens,
  isSilence,
  languageCandidates,
  needsFallback,
  sampleToken,
  logMel,
  prompt,
  tokenLogProb,
  windowSegments,
  type LanguageCode,
  type Segment,
} from '../core/whisper'

export type Engine = { ort: typeof Ort; encoder: Ort.InferenceSession; decoder: Ort.InferenceSession; vocab: readonly string[] }
/** `preferred`: idioma de la página, que se prueba siempre en el modo automático. */
export type TranscribeOptions = { language: LanguageCode | 'auto'; translate: boolean; preferred?: LanguageCode }
export type Progress = { fraction: number; segments: Segment[]; language: LanguageCode }

const LAYERS = 6
const HEADS = 8
const HEAD_DIM = 64

function softmaxAt(logits: Float32Array, id: number): number {
  let max = -Infinity
  for (const v of logits) if (v > max) max = v
  let s = 0
  for (const v of logits) s += Math.exp(v - max)
  return Math.exp(logits[id] - max) / s
}

/** Logits de la posición `pos` (copiados: el tensor se libera después). */
function logitsAt(t: Ort.Tensor, pos: number): Float32Array {
  const [, , vocab] = t.dims
  return (t.data as Float32Array).slice(pos * vocab, (pos + 1) * vocab)
}

async function encode(e: Engine, window: Float32Array): Promise<Ort.Tensor> {
  const mel = logMel(window)
  const out = await e.encoder.run({ input_features: new e.ort.Tensor('float32', mel, [1, N_MELS, N_FRAMES]) })
  return out.last_hidden_state
}

type Cache = Record<string, Ort.Tensor>

function emptyCache(e: Engine): Cache {
  const c: Cache = {}
  for (let i = 0; i < LAYERS; i++)
    for (const kind of ['decoder', 'encoder'])
      for (const kv of ['key', 'value']) c[`past_key_values.${i}.${kind}.${kv}`] = new e.ort.Tensor('float32', new Float32Array(0), [1, HEADS, 0, HEAD_DIM])
  return c
}

async function step(e: Engine, ids: number[], hidden: Ort.Tensor, cache: Cache, useCache: boolean) {
  const feeds: Record<string, Ort.Tensor> = {
    input_ids: new e.ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    encoder_hidden_states: hidden,
    use_cache_branch: new e.ort.Tensor('bool', new Uint8Array([useCache ? 1 : 0]), [1]),
    ...cache,
  }
  return e.decoder.run(feeds)
}

/** Caché para el siguiente paso: la del decoder es la nueva; la del encoder se calcula en el primer paso. */
function nextCache(out: Record<string, Ort.Tensor>, prev: Cache | null): Cache {
  const c: Cache = {}
  for (let i = 0; i < LAYERS; i++)
    for (const kv of ['key', 'value']) {
      c[`past_key_values.${i}.decoder.${kv}`] = out[`present.${i}.decoder.${kv}`]
      c[`past_key_values.${i}.encoder.${kv}`] = prev ? prev[`past_key_values.${i}.encoder.${kv}`] : out[`present.${i}.encoder.${kv}`]
    }
  return c
}

/** Logits del token que sigue a <|startoftranscript|> (el idioma hablado según el modelo). */
async function languageLogits(e: Engine, hidden: Ort.Tensor): Promise<Float32Array> {
  const out = await step(e, [SOT], hidden, emptyCache(e), false)
  return logitsAt(out.logits, 0)
}

// Semilla fija: el mismo audio da siempre el mismo texto.
function seeded(seed = 1) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

type Attempt = { tokens: number[]; noSpeech: number; avgLogProb: number; compression: number; text: string }

async function decodeWindow(e: Engine, hidden: Ort.Tensor, language: LanguageCode, translate: boolean, temperature: number, random: () => number, signal?: AbortSignal): Promise<Attempt> {
  const ids = prompt(language, translate)
  let out = await step(e, ids, hidden, emptyCache(e), false)
  const noSpeech = softmaxAt(logitsAt(out.logits, 0), NO_SPEECH)
  let logits = logitsAt(out.logits, ids.length - 1)
  let cache = nextCache(out, null)
  const generated: number[] = []
  let logProb = 0
  for (;;) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    applyRules(logits, generated)
    const tok = sampleToken(logits, temperature, random)
    logProb += tokenLogProb(logits, tok)
    if (tok === EOT || generated.length >= MAX_NEW_TOKENS) break
    generated.push(tok)
    out = await step(e, [tok], hidden, cache, true)
    logits = logitsAt(out.logits, 0)
    cache = nextCache(out, cache)
  }
  const text = decodeTokens(generated, e.vocab).trim()
  return { tokens: generated, noSpeech, avgLogProb: logProb / Math.max(1, generated.length + 1), compression: compressionRatio(text, deflateSync), text }
}

/**
 * Decodifica la ventana como Whisper de OpenAI: primero sin azar; si el texto se repite en bucle
 * o es poco probable, otra vez con más temperatura. Se queda con el mejor intento.
 */
async function decodeBest(e: Engine, hidden: Ort.Tensor, language: LanguageCode, translate: boolean, random: () => number, signal?: AbortSignal): Promise<Attempt> {
  let best: Attempt | null = null
  for (const t of TEMPERATURES) {
    const a = await decodeWindow(e, hidden, language, translate, t, random, signal)
    if (!best || attemptScore(a, a.text.length) > attemptScore(best, best.text.length)) best = a
    if (!needsFallback(a)) return a
  }
  return best!
}

/**
 * Transcribe un audio mono de 16 kHz. Avanza como Whisper: cada ventana empieza donde terminó
 * el último segmento completo de la anterior, para no cortar frases.
 */
export async function transcribe(e: Engine, audio: Float32Array, o: TranscribeOptions, onProgress?: (p: Progress) => void, signal?: AbortSignal): Promise<{ language: LanguageCode; segments: Segment[] }> {
  const segments: Segment[] = []
  let language: LanguageCode = o.language === 'auto' ? (o.preferred ?? 'es') : o.language
  // En automático, el idioma se decide en la primera ventana con voz y queda fijo: así no cambia
  // de idioma a mitad del audio.
  let decided = o.language !== 'auto'
  const random = seeded()
  let seek = 0
  while (seek < audio.length) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    const windowSamples = Math.min(CHUNK_SAMPLES, audio.length - seek)
    // Los últimos instantes (menos de 0,2 s) no alcanzan para una palabra.
    if (windowSamples < SAMPLE_RATE * 0.2) break
    const hidden = await encode(e, audio.subarray(seek, seek + windowSamples))
    let w: Attempt
    if (decided) w = await decodeBest(e, hidden, language, o.translate, random, signal)
    else {
      // Cada candidato se prueba de verdad: gana el que da el texto más probable sin bucles.
      const candidates = languageCandidates(await languageLogits(e, hidden), 3, o.preferred)
      let best: { lang: LanguageCode; a: Attempt } | null = null
      for (const lang of candidates) {
        const a = await decodeWindow(e, hidden, lang, o.translate, 0, random, signal)
        if (!best || attemptScore(a, a.text.length) > attemptScore(best.a, best.a.text.length)) best = { lang, a }
      }
      language = best!.lang
      w = needsFallback(best!.a) ? await decodeBest(e, hidden, language, o.translate, random, signal) : best!.a
      // Una ventana de silencio no decide el idioma: se vuelve a probar en la siguiente.
      decided = !isSilence(w.noSpeech, w.avgLogProb)
    }
    if (isSilence(w.noSpeech, w.avgLogProb)) seek += windowSamples
    else {
      const r = windowSegments(w.tokens, e.vocab, seek / SAMPLE_RATE, windowSamples)
      segments.push(...r.segments)
      seek += r.advance
    }
    onProgress?.({ fraction: Math.min(1, seek / audio.length), segments: [...segments], language })
  }
  return { language, segments }
}
