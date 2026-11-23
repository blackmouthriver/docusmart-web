// Cámara en vivo del escáner (W-147.1): partes que necesitan el navegador (excluidas de la
// cobertura, como scanCanvas.ts). La decisión de cuándo tomar la foto está en core/liveCapture.ts.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { detectDocument, type Quad } from '../core/scan'

/** La cámara de atrás, con la mayor resolución que dé (la foto sale del cuadro del video). */
export function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
  })
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

export function hasTorch(stream: MediaStream | null): boolean {
  const track = stream?.getVideoTracks()[0]
  try {
    return !!(track?.getCapabilities?.() as TorchCapabilities | undefined)?.torch
  } catch {
    return false
  }
}

export async function setTorch(stream: MediaStream | null, on: boolean) {
  const track = stream?.getVideoTracks()[0]
  await track?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
}

/** Lado del cuadro que se analiza: chico para que sea rápido (detectDocument pide ~400 px). */
const ANALYZE_SIDE = 320

/** Busca la hoja en el cuadro actual del video. `canvas` se reutiliza entre cuadros. */
export function analyzeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Quad | null {
  const { videoWidth: vw, videoHeight: vh } = video
  if (!vw || !vh) return null
  const k = Math.min(1, ANALYZE_SIDE / Math.max(vw, vh))
  const w = Math.max(1, Math.round(vw * k))
  const h = Math.max(1, Math.round(vh * k))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(video, 0, 0, w, h)
  const id = ctx.getImageData(0, 0, w, h)
  return detectDocument({ data: id.data, width: id.width, height: id.height })
}

/** El cuadro actual en la resolución completa, como JPEG. */
export async function grabFrame(video: HTMLVideoElement): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = video.videoWidth
  c.height = video.videoHeight
  c.getContext('2d')!.drawImage(video, 0, 0)
  try {
    return await canvasToBlob(c, 'image/jpeg', 0.92)
  } finally {
    c.width = c.height = 0
  }
}
