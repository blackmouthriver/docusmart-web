// Cliente del worker de "Quitar fondo" (W-121): descarga el modelo una vez, lo entrega al
// worker y recorta una imagen a la vez. Excluido de la cobertura (worker, canvas y red).
import type { Background } from '../core/background'
import type { WorkerRequest, WorkerResponse } from './background.worker'
import { loadBackgroundModel } from './backgroundModel'
import { loadImage } from './imageCanvas'

/** Lado máximo del resultado: las fotos más grandes se reducen para no agotar la memoria. */
const MAX_SIDE = 4096

let worker: Worker | null = null
let ready: Promise<void> | null = null
let nextId = 0
const pending = new Map<number, { resolve: (r: { blob: Blob; width: number; height: number }) => void; reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./background.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const m = e.data
    if (m.type === 'done') pending.get(m.id)?.resolve(m)
    if (m.type === 'error' && m.id !== undefined) pending.get(m.id)?.reject(new Error(m.message))
    if (m.type === 'done' || (m.type === 'error' && m.id !== undefined)) pending.delete(m.id!)
  }
  return worker
}

/** Prepara el modelo (descarga con progreso la primera vez) y el motor. */
export function prepareBackgroundRemover(onProgress: (fraction: number) => void): Promise<void> {
  ready ??= (async () => {
    const model = await loadBackgroundModel(onProgress)
    const w = getWorker()
    await new Promise<void>((resolve, reject) => {
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.type === 'loaded') resolve()
        else if (e.data.type === 'error' && e.data.id === undefined) reject(new Error(e.data.message))
        else return
        w.removeEventListener('message', onMsg)
      }
      w.addEventListener('message', onMsg)
      w.postMessage({ type: 'load', model: model.buffer as ArrayBuffer } satisfies WorkerRequest, [model.buffer as ArrayBuffer])
    })
  })().catch((e: unknown) => {
    // Si falla (sin conexión, sin memoria…), el próximo intento vuelve a empezar.
    ready = null
    worker?.terminate()
    worker = null
    throw e
  })
  return ready
}

export async function removeBackground(file: Blob, background: Background): Promise<{ blob: Blob; width: number; height: number }> {
  const { bmp: image } = await loadImage(file)
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ type: 'run', id, image, background, maxSide: MAX_SIDE } satisfies WorkerRequest, [image])
  })
}
