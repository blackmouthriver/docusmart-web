// Dibujo de la marca de agua en imágenes (W-123). Excluido de la cobertura como los demás
// archivos que usan canvas; los cálculos están en core/watermark.ts.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { DIAGONAL, isLight, markPlacement, markSize, parseColor, tileCenters, type WatermarkPosition } from '../core/watermark'
import type { OutputMime } from '../core/imageTools'
import { loadImage } from './imageCanvas'

export type Mark =
  | { kind: 'text'; text: string; color: string; size: number; opacity: number; position: WatermarkPosition }
  | { kind: 'logo'; logo: ImageBitmap; size: number; opacity: number; position: WatermarkPosition }

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'

/** Dibuja la marca sobre lo que ya tiene el contexto (una imagen de width × height). */
export function drawMark(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, mark: Mark) {
  let markW: number
  let markH: number
  let paint: () => void
  if (mark.kind === 'text') {
    const text = mark.text.trim()
    if (!text) return
    // Se mide a 100 px y se escala para que ocupe el ancho pedido.
    ctx.font = `700 100px ${FONT}`
    const at100 = Math.max(1, ctx.measureText(text).width)
    const size = markSize(width, height, at100, 120, mark.size)
    const px = Math.max(4, (size.width / at100) * 100)
    markW = size.width
    markH = px * 1.2
    const color = parseColor(mark.color)
    paint = () => {
      ctx.font = `700 ${px}px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      // Una sombra suave del color contrario lo hace legible sobre fotos claras u oscuras.
      ctx.shadowColor = isLight(color) ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)'
      ctx.shadowBlur = px * 0.12
      ctx.fillText(text, 0, 0)
    }
  } else {
    const size = markSize(width, height, mark.logo.width, mark.logo.height, mark.size)
    markW = size.width
    markH = size.height
    paint = () => ctx.drawImage(mark.logo, -markW / 2, -markH / 2, markW, markH)
  }
  if (markW <= 0 || markH <= 0) return
  const centers = mark.position === 'tile' ? tileCenters(width, height, markW, markH).map((c) => ({ ...c, angle: DIAGONAL })) : [markPlacement(width, height, markW, markH, mark.position)]
  ctx.save()
  ctx.globalAlpha = Math.min(1, Math.max(0.05, mark.opacity / 100))
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  for (const c of centers) {
    ctx.save()
    ctx.translate(c.cx, c.cy)
    ctx.rotate(c.angle)
    paint()
    ctx.restore()
  }
  ctx.restore()
}

/** La imagen con la marca, en el formato pedido. Sin metadatos: el EXIF (y la ubicación GPS) no se copia. */
export async function applyWatermark(file: Blob, mark: Mark, mime: OutputMime): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  try {
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    // JPEG no tiene transparencia: fondo blanco en vez de negro.
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, img.width, img.height)
    }
    ctx.drawImage(img.bmp, 0, 0)
    drawMark(ctx, img.width, img.height, mark)
    return { blob: await canvasToBlob(canvas, mime, 0.92), width: img.width, height: img.height }
  } finally {
    img.bmp.close()
    canvas.width = canvas.height = 0
  }
}

/** Vista previa: la copia reducida con la marca, en un canvas de la página. */
export function drawPreview(target: HTMLCanvasElement, bmp: ImageBitmap, mark: Mark | null) {
  target.width = bmp.width
  target.height = bmp.height
  const ctx = target.getContext('2d')!
  ctx.clearRect(0, 0, bmp.width, bmp.height)
  ctx.drawImage(bmp, 0, 0)
  if (mark) drawMark(ctx, bmp.width, bmp.height, mark)
}
