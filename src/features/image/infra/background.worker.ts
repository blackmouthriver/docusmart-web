// Worker de "Quitar fondo" (W-121): ejecuta el modelo con onnxruntime-web (wasm) fuera
// del hilo principal, para que la página no se congele mientras recorta.
// La CSP (con Trusted Types) también rige aquí: onnxruntime solo carga su motor desde /ort/.
import * as ort from 'onnxruntime-web/wasm'
import { MODEL_SIZE, applyAlpha, maskToRgba, toMask, toModelInput, type Background } from '../core/background'

ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
// Solo errores reales en la consola (onnxruntime avisa, por ejemplo, que no reconoce la CPU).
ort.env.logLevel = 'error'

export type WorkerRequest =
  | { type: 'load'; model: ArrayBuffer }
  | { type: 'run'; id: number; image: ImageBitmap; background: Background; maxSide: number }
export type WorkerResponse =
  | { type: 'loaded' }
  | { type: 'done'; id: number; blob: Blob; width: number; height: number }
  | { type: 'error'; id?: number; message: string }

let session: ort.InferenceSession | null = null

function ctx2d(c: OffscreenCanvas) {
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

async function cutOut(image: ImageBitmap, background: Background, maxSide: number) {
  if (!session) throw new Error('Modelo no cargado')
  // 1) La foto en 1024 × 1024 para el modelo.
  const small = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE)
  const sctx = ctx2d(small)
  sctx.drawImage(image, 0, 0, MODEL_SIZE, MODEL_SIZE)
  const input = toModelInput(sctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data)
  const feeds = { [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]) }
  const out = await session.run(feeds)
  const result = out[session.outputNames[0]]
  const mask = toMask(result.data as Float32Array)
  Object.values(out).forEach((t) => t.dispose())

  // 2) La máscara escalada al tamaño final (las fotos enormes se reducen a maxSide).
  const k = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * k))
  const height = Math.max(1, Math.round(image.height * k))
  sctx.putImageData(new ImageData(maskToRgba(mask), MODEL_SIZE, MODEL_SIZE), 0, 0)
  const full = new OffscreenCanvas(width, height)
  const fctx = ctx2d(full)
  fctx.drawImage(small, 0, 0, width, height)
  const maskPixels = fctx.getImageData(0, 0, width, height).data

  // 3) La foto con la máscara como transparencia.
  fctx.clearRect(0, 0, width, height)
  fctx.drawImage(image, 0, 0, width, height)
  const photo = fctx.getImageData(0, 0, width, height)
  applyAlpha(photo.data, maskPixels)
  fctx.putImageData(photo, 0, 0)

  // 4) Fondo de color, si se eligió.
  let final = full
  if (background.kind === 'color') {
    final = new OffscreenCanvas(width, height)
    const c = ctx2d(final)
    c.fillStyle = background.color
    c.fillRect(0, 0, width, height)
    c.drawImage(full, 0, 0)
  }
  const blob = await final.convertToBlob({ type: 'image/png' })
  return { blob, width, height }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  // Un worker dedicado solo recibe mensajes de la página que lo creó (origen vacío o el propio);
  // cualquier otro origen, o un mensaje que no es de los esperados, se ignora.
  if (e.origin && e.origin !== self.location.origin) return
  const msg = e.data
  if (msg?.type !== 'load' && msg?.type !== 'run') return
  try {
    if (msg.type === 'load') {
      session ??= await ort.InferenceSession.create(new Uint8Array(msg.model), { executionProviders: ['wasm'], graphOptimizationLevel: 'all', logSeverityLevel: 3 })
      self.postMessage({ type: 'loaded' } satisfies WorkerResponse)
    } else {
      const r = await cutOut(msg.image, msg.background, msg.maxSide)
      msg.image.close()
      self.postMessage({ type: 'done', id: msg.id, ...r } satisfies WorkerResponse)
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.type === 'run' ? msg.id : undefined, message: err instanceof Error ? err.message : String(err) } satisfies WorkerResponse)
  }
}
