// Dibujo de "Ajustar imagen" (W-125): enderezar con recorte y ajustes de color. Excluido de la
// cobertura como los demás archivos que usan canvas; los cálculos están en core/adjust.ts.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { NEUTRAL, applyAdjustments, applyLevels, autoLevels, changesPixels, sharpen, straightenSize, type Adjustments } from '../core/adjust'
import type { OutputMime } from '../core/imageTools'
import { loadImage } from './imageCanvas'

/** Dibuja la imagen enderezada (centrada en el recorte) y le aplica los colores. */
function paint(canvas: HTMLCanvasElement, bmp: ImageBitmap, a: Adjustments, background?: string) {
  const size = straightenSize(bmp.width, bmp.height, a.angle)
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, size.width, size.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.save()
  ctx.translate(size.width / 2, size.height / 2)
  ctx.rotate((a.angle * Math.PI) / 180)
  ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2)
  ctx.restore()
  if (changesPixels(a)) {
    const px = ctx.getImageData(0, 0, size.width, size.height)
    if (a.auto) applyLevels(px.data, autoLevels(px.data))
    applyAdjustments(px.data, a)
    if (a.sharpen) sharpen(px.data, size.width, size.height, a.sharpen)
    ctx.putImageData(px, 0, 0)
  }
  return size
}

/** La imagen ajustada, en el formato pedido. Sin metadatos: el EXIF (y la ubicación GPS) no se copia. */
export async function renderAdjusted(file: Blob, a: Adjustments, mime: OutputMime): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  try {
    // JPEG no tiene transparencia: fondo blanco en vez de negro.
    const size = paint(canvas, img.bmp, a, mime === 'image/jpeg' ? '#fff' : undefined)
    return { blob: await canvasToBlob(canvas, mime, 0.92), ...size }
  } finally {
    img.bmp.close()
    canvas.width = canvas.height = 0
  }
}

/** Vista previa: la copia reducida con los ajustes (o tal cual, para comparar). */
export function drawAdjustedPreview(target: HTMLCanvasElement, bmp: ImageBitmap, a: Adjustments, original = false) {
  paint(target, bmp, original ? NEUTRAL : a)
}
