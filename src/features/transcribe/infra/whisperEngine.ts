/**
 * Motor de Whisper (W-133): ejecuta el encoder y el decoder ONNX con onnxruntime-web, ventana de
 * 30 s por ventana, con caché de claves y valores en el decoder y búsqueda voraz. Recibe el
 * módulo de onnxruntime como parámetro, así corre igual en el worker y en las pruebas en Node.
 * Excluido de la cobertura (necesita el modelo); se prueba de punta a punta.
 */
import type * as Ort from 'onnxruntime-web'
import {
  CHUNK_SAMPLES,
  EOT,
  MAX_NEW_TOKENS,
  N_FRAMES,
  N_MELS,
  NO_SPEECH,
  SAMPLE_RATE,
  SOT,
  applyRules,
  argmax,
  detectLanguage,
  isSilence,
  logMel,
  prompt,
  tokenLogProb,
  windowSegments,
  type LanguageCode,
  type Segment,
} from '../core/whisper'

export type Engine = { ort: typeof Ort; encoder: Ort.InferenceSession; decoder: Ort.InferenceSession; vocab: readonly string[] }
export type TranscribeOptions = { language: LanguageCode | 'auto'; translate: boolean }
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

/** Idioma hablado en la ventana (logits del token que sigue a <|startoftranscript|>). */
async function languageOf(e: Engine, hidden: Ort.Tensor): Promise<LanguageCode> {
  const out = await step(e, [SOT], hidden, emptyCache(e), false)
  return detectLanguage(logitsAt(out.logits, 0))
}

async function decodeWindow(e: Engine, hidden: Ort.Tensor, language: LanguageCode, translate: boolean, signal?: AbortSignal) {
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
    const tok = argmax(logits)
    logProb += tokenLogProb(logits, tok)
    if (tok === EOT || generated.length >= MAX_NEW_TOKENS) break
    generated.push(tok)
    out = await step(e, [tok], hidden, cache, true)
    logits = logitsAt(out.logits, 0)
    cache = nextCache(out, cache)
  }
  return { tokens: generated, noSpeech, avgLogProb: logProb / Math.max(1, generated.length + 1) }
}

/**
 * Transcribe un audio mono de 16 kHz. Avanza como Whisper: cada ventana empieza donde terminó
 * el último segmento completo de la anterior, para no cortar frases.
 */
export async function transcribe(e: Engine, audio: Float32Array, o: TranscribeOptions, onProgress?: (p: Progress) => void, signal?: AbortSignal): Promise<{ language: LanguageCode; segments: Segment[] }> {
  const segments: Segment[] = []
  let language: LanguageCode = o.language === 'auto' ? 'es' : o.language
  let seek = 0
  let first = true
  while (seek < audio.length) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    const windowSamples = Math.min(CHUNK_SAMPLES, audio.length - seek)
    // Los últimos instantes (menos de 0,2 s) no alcanzan para una palabra.
    if (windowSamples < SAMPLE_RATE * 0.2) break
    const hidden = await encode(e, audio.subarray(seek, seek + windowSamples))
    if (first && o.language === 'auto') language = await languageOf(e, hidden)
    first = false
    const w = await decodeWindow(e, hidden, language, o.translate, signal)
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
