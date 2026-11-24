// Worker de "Audio a texto" (W-133): ejecuta Whisper con onnxruntime-web (wasm) fuera del hilo
// principal, para que la página siga respondiendo mientras transcribe. También separa a los
// hablantes (W-147.4) con los modelos de pyannote y WeSpeaker.
import * as ort from 'onnxruntime-web/wasm'
import type * as Ort from 'onnxruntime-web'
import { transcribe, type Engine, type TranscribeOptions } from './whisperEngine'
import { diarize, type DiarizeEngine } from './diarizeEngine'
import type { LanguageCode, Segment } from '../core/whisper'
import type { Turn } from '../core/diarize'

ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
ort.env.logLevel = 'error'

export type WorkerRequest =
  | { type: 'load'; encoder: ArrayBuffer; decoder: ArrayBuffer; vocab: string[] }
  // Con `speakers`, después de transcribir separa a los hablantes del mismo audio (sin copiarlo).
  | { type: 'run'; id: number; audio: Float32Array; options: TranscribeOptions; speakers?: { count?: number } }
  | { type: 'cancel'; id: number }
  | { type: 'loadDiarize'; segmentation: ArrayBuffer; embedding: ArrayBuffer }
export type WorkerResponse =
  | { type: 'loaded' }
  | { type: 'diarizeLoaded' }
  | { type: 'diarizeProgress'; id: number; fraction: number }
  | { type: 'progress'; id: number; fraction: number; segments: Segment[]; language: LanguageCode }
  | { type: 'done'; id: number; segments: Segment[]; language: LanguageCode; turns?: Turn[] }
  | { type: 'error'; id?: number; load?: 'diarize'; message: string }

let engine: Engine | null = null
let speakers: DiarizeEngine | null = null
const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' as const }
const running = new Map<number, AbortController>()
const post = (m: WorkerResponse) => self.postMessage(m)

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  // Solo mensajes de la propia página.
  if (e.origin && e.origin !== self.location.origin) return
  const m = e.data
  try {
    if (m.type === 'load') {
      const [encoder, decoder] = await Promise.all([ort.InferenceSession.create(new Uint8Array(m.encoder), opts), ort.InferenceSession.create(new Uint8Array(m.decoder), opts)])
      engine = { ort: ort as unknown as typeof Ort, encoder, decoder, vocab: m.vocab }
      post({ type: 'loaded' })
    } else if (m.type === 'run') {
      if (!engine) throw new Error('Modelo no cargado')
      const ctrl = new AbortController()
      running.set(m.id, ctrl)
      const r = await transcribe(engine, m.audio, m.options, (p) => post({ type: 'progress', id: m.id, ...p }), ctrl.signal)
      let turns: Turn[] | undefined
      if (m.speakers && r.segments.length) {
        if (!speakers) throw new Error('Modelo no cargado')
        turns = await diarize(speakers, m.audio, m.speakers.count, (fraction) => post({ type: 'diarizeProgress', id: m.id, fraction }), ctrl.signal)
      }
      post({ type: 'done', id: m.id, ...r, turns })
    } else if (m.type === 'loadDiarize') {
      const [segmentation, embedding] = await Promise.all([ort.InferenceSession.create(new Uint8Array(m.segmentation), opts), ort.InferenceSession.create(new Uint8Array(m.embedding), opts)])
      speakers = { ort: ort as unknown as typeof Ort, segmentation, embedding }
      post({ type: 'diarizeLoaded' })
    } else if (m.type === 'cancel') running.get(m.id)?.abort()
  } catch (err) {
    const loading = m.type === 'load' || m.type === 'loadDiarize'
    post({ type: 'error', id: loading ? undefined : m.id, load: m.type === 'loadDiarize' ? 'diarize' : undefined, message: err instanceof Error ? err.name === 'AbortError' ? 'aborted' : err.message : String(err) })
  } finally {
    if (m.type === 'run') running.delete(m.id)
  }
}
