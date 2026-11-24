// Cliente del worker de "Audio a texto" (W-133): descarga el modelo una vez, lo entrega al worker
// y transcribe un audio a la vez, con progreso y cancelación; si se pide, también separa a los
// hablantes (W-147.4) con sus propios modelos. Excluido de la cobertura.
import type { LanguageCode, Segment } from '../core/whisper'
import type { Turn } from '../core/diarize'
import type { TranscribeOptions } from './whisperEngine'
import type { WorkerRequest, WorkerResponse } from './transcribe.worker'
import { loadWhisper } from './whisperModel'
import { loadDiarize } from './diarizeModel'

let worker: Worker | null = null
let ready: Promise<void> | null = null
let speakersReady: Promise<void> | null = null
let nextId = 0

function getWorker(): Worker {
  worker ??= new Worker(new URL('./transcribe.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

function reset() {
  ready = null
  speakersReady = null
  worker?.terminate()
  worker = null
}

/** Prepara el modelo (descarga con progreso la primera vez) y el motor. */
export function prepareTranscriber(onProgress: (fraction: number) => void): Promise<void> {
  ready ??= (async () => {
    const files = await loadWhisper(onProgress)
    const w = getWorker()
    await new Promise<void>((resolve, reject) => {
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.type === 'loaded') resolve()
        else if (e.data.type === 'error' && e.data.id === undefined && !e.data.load) reject(new Error(e.data.message))
        else return
        w.removeEventListener('message', onMsg)
      }
      w.addEventListener('message', onMsg)
      const encoder = files.encoder.buffer as ArrayBuffer
      const decoder = files.decoder.buffer as ArrayBuffer
      w.postMessage({ type: 'load', encoder, decoder, vocab: files.vocab } satisfies WorkerRequest, [encoder, decoder])
    })
  })().catch((e: unknown) => {
    // Si falla (sin conexión, sin memoria…), el próximo intento vuelve a empezar.
    reset()
    throw e
  })
  return ready
}

/** Prepara los modelos de hablantes (descarga con progreso la primera vez). Después de prepareTranscriber. */
export function prepareSpeakers(onProgress: (fraction: number) => void): Promise<void> {
  speakersReady ??= (async () => {
    const files = await loadDiarize(onProgress)
    const w = getWorker()
    await new Promise<void>((resolve, reject) => {
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.type === 'diarizeLoaded') resolve()
        else if (e.data.type === 'error' && e.data.load === 'diarize') reject(new Error(e.data.message))
        else return
        w.removeEventListener('message', onMsg)
      }
      w.addEventListener('message', onMsg)
      const segmentation = files.segmentation.buffer as ArrayBuffer
      const embedding = files.embedding.buffer as ArrayBuffer
      w.postMessage({ type: 'loadDiarize', segmentation, embedding } satisfies WorkerRequest, [segmentation, embedding])
    })
  })().catch((e: unknown) => {
    speakersReady = null
    throw e
  })
  return speakersReady
}

export class TranscribeCanceled extends Error {
  constructor() {
    super('aborted')
    this.name = 'TranscribeCanceled'
  }
}

export type RunProgress = { fraction: number; segments: Segment[]; language: LanguageCode } | { speakers: number }

/**
 * Transcribe un audio mono de 16 kHz; con `speakers` también separa a los hablantes (y avisa su
 * progreso como `{ speakers }`). `signal` cancela.
 */
export async function runTranscription(
  audio: Float32Array,
  options: TranscribeOptions,
  onProgress: (p: RunProgress) => void,
  signal?: AbortSignal,
  speakers?: { count?: number },
): Promise<{ segments: Segment[]; language: LanguageCode; turns?: Turn[] }> {
  const w = getWorker()
  const id = ++nextId
  return new Promise((resolve, reject) => {
    const onAbort = () => w.postMessage({ type: 'cancel', id } satisfies WorkerRequest)
    signal?.addEventListener('abort', onAbort, { once: true })
    const onMsg = (e: MessageEvent<WorkerResponse>) => {
      const m = e.data
      if (!('id' in m) || m.id !== id) return
      if (m.type === 'progress') return onProgress(m)
      if (m.type === 'diarizeProgress') return onProgress({ speakers: m.fraction })
      w.removeEventListener('message', onMsg)
      signal?.removeEventListener('abort', onAbort)
      if (m.type === 'done') resolve(m)
      else if (m.type === 'error') reject(m.message === 'aborted' ? new TranscribeCanceled() : new Error(m.message))
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ type: 'run', id, audio, options, speakers } satisfies WorkerRequest, [audio.buffer as ArrayBuffer])
  })
}
