// Cliente del worker de "Audio a texto" (W-133): descarga el modelo una vez, lo entrega al worker
// y transcribe un audio a la vez, con progreso y cancelación. Excluido de la cobertura.
import type { LanguageCode, Segment } from '../core/whisper'
import type { TranscribeOptions } from './whisperEngine'
import type { WorkerRequest, WorkerResponse } from './transcribe.worker'
import { loadWhisper } from './whisperModel'

let worker: Worker | null = null
let ready: Promise<void> | null = null
let nextId = 0

function getWorker(): Worker {
  worker ??= new Worker(new URL('./transcribe.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

function reset() {
  ready = null
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
        else if (e.data.type === 'error' && e.data.id === undefined) reject(new Error(e.data.message))
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

export class TranscribeCanceled extends Error {
  constructor() {
    super('aborted')
    this.name = 'TranscribeCanceled'
  }
}

/** Transcribe un audio mono de 16 kHz; `signal` cancela. */
export async function runTranscription(
  audio: Float32Array,
  options: TranscribeOptions,
  onProgress: (p: { fraction: number; segments: Segment[]; language: LanguageCode }) => void,
  signal?: AbortSignal,
): Promise<{ segments: Segment[]; language: LanguageCode }> {
  const w = getWorker()
  const id = ++nextId
  return new Promise((resolve, reject) => {
    const onAbort = () => w.postMessage({ type: 'cancel', id } satisfies WorkerRequest)
    signal?.addEventListener('abort', onAbort, { once: true })
    const onMsg = (e: MessageEvent<WorkerResponse>) => {
      const m = e.data
      if (!('id' in m) || m.id !== id) return
      if (m.type === 'progress') return onProgress(m)
      w.removeEventListener('message', onMsg)
      signal?.removeEventListener('abort', onAbort)
      if (m.type === 'done') resolve(m)
      else if (m.type === 'error') reject(m.message === 'aborted' ? new TranscribeCanceled() : new Error(m.message))
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ type: 'run', id, audio, options } satisfies WorkerRequest, [audio.buffer as ArrayBuffer])
  })
}
