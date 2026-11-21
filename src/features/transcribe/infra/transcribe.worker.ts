// Worker de "Audio a texto" (W-133): ejecuta Whisper con onnxruntime-web (wasm) fuera del hilo
// principal, para que la página siga respondiendo mientras transcribe.
import * as ort from 'onnxruntime-web/wasm'
import type * as Ort from 'onnxruntime-web'
import { transcribe, type Engine, type TranscribeOptions } from './whisperEngine'
import type { LanguageCode, Segment } from '../core/whisper'

ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
ort.env.logLevel = 'error'

export type WorkerRequest =
  | { type: 'load'; encoder: ArrayBuffer; decoder: ArrayBuffer; vocab: string[] }
  | { type: 'run'; id: number; audio: Float32Array; options: TranscribeOptions }
  | { type: 'cancel'; id: number }
export type WorkerResponse =
  | { type: 'loaded' }
  | { type: 'progress'; id: number; fraction: number; segments: Segment[]; language: LanguageCode }
  | { type: 'done'; id: number; segments: Segment[]; language: LanguageCode }
  | { type: 'error'; id?: number; message: string }

let engine: Engine | null = null
const running = new Map<number, AbortController>()
const post = (m: WorkerResponse) => self.postMessage(m)

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  // Solo mensajes de la propia página.
  if (e.origin && e.origin !== self.location.origin) return
  const m = e.data
  try {
    if (m.type === 'load') {
      const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' as const }
      const [encoder, decoder] = await Promise.all([ort.InferenceSession.create(new Uint8Array(m.encoder), opts), ort.InferenceSession.create(new Uint8Array(m.decoder), opts)])
      engine = { ort: ort as unknown as typeof Ort, encoder, decoder, vocab: m.vocab }
      post({ type: 'loaded' })
    } else if (m.type === 'run') {
      if (!engine) throw new Error('Modelo no cargado')
      const ctrl = new AbortController()
      running.set(m.id, ctrl)
      const r = await transcribe(engine, m.audio, m.options, (p) => post({ type: 'progress', id: m.id, ...p }), ctrl.signal)
      post({ type: 'done', id: m.id, ...r })
    } else if (m.type === 'cancel') running.get(m.id)?.abort()
  } catch (err) {
    post({ type: 'error', id: m.type === 'load' ? undefined : m.id, message: err instanceof Error ? err.name === 'AbortError' ? 'aborted' : err.message : String(err) })
  } finally {
    if (m.type === 'run') running.delete(m.id)
  }
}
