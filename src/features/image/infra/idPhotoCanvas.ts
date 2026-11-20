// Dibujo de "Foto tamaño documento" (W-122): recorte, fondo con IA (opcional), tamaño a 300 ppp
// y hoja para imprimir. Excluido de la cobertura como los demás archivos que usan canvas.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import type { Background } from '../core/background'
import { ID_DPI, idPixels, mmToPx, setJpegDpi, sheetLayout, type IdSize } from '../core/idPhoto'
import { loadImage, renderImage } from './imageCanvas'

export type IdPhotoOptions = {
  /** Zona de la foto original, en pixeles. */
  crop: { x: number; y: number; width: number; height: number }
  size: IdSize
  /** Fondo nuevo (con la IA de Quitar fondo, ya preparada) o null para dejar el original. */
  background: Background | null
  layout: 'single' | 'sheet'
}

async function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  try {
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
    return new Blob([setJpegDpi(new Uint8Array(await blob.arrayBuffer())) as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
  } finally {
    canvas.width = canvas.height = 0
  }
}

function whiteCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

export async function renderIdPhoto(file: Blob, o: IdPhotoOptions): Promise<{ blob: Blob; width: number; height: number }> {
  const px = idPixels(o.size)
  // 1) El recorte, al doble del tamaño final (la IA marca mejor el borde con más detalle).
  const img = await loadImage(file)
  let cut: Blob
  try {
    const k = Math.min(2, Math.max(1, o.crop.width / px.width))
    cut = await renderImage(img, { crop: o.crop, width: Math.round(px.width * k), height: Math.round(px.height * k), mime: 'image/png' })
  } finally {
    img.bmp.close()
  }
  // 2) El fondo nuevo, si se pidió.
  if (o.background) {
    const { removeBackground } = await import('./backgroundRemover')
    cut = (await removeBackground(cut, o.background)).blob
  }
  // 3) La foto a su tamaño exacto, sobre blanco (JPG no tiene transparencia).
  const photo = await loadImage(cut)
  try {
    if (o.layout === 'single') {
      const { canvas, ctx } = whiteCanvas(px.width, px.height)
      ctx.drawImage(photo.bmp, 0, 0, px.width, px.height)
      return { blob: await toJpeg(canvas), ...px }
    }
    // 4) Hoja de 10 × 15 cm con todas las copias que quepan y una línea suave para recortar.
    const layout = sheetLayout(o.size)
    const sheet = { width: mmToPx(layout.sheet.w), height: mmToPx(layout.sheet.h) }
    const { canvas, ctx } = whiteCanvas(sheet.width, sheet.height)
    ctx.strokeStyle = '#c8c8c8'
    ctx.lineWidth = 1
    for (const c of layout.cells) {
      const x = Math.round((c.x / 25.4) * ID_DPI)
      const y = Math.round((c.y / 25.4) * ID_DPI)
      ctx.drawImage(photo.bmp, x, y, px.width, px.height)
      ctx.strokeRect(x - 0.5, y - 0.5, px.width + 1, px.height + 1)
    }
    return { blob: await toJpeg(canvas), ...sheet }
  } finally {
    photo.bmp.close()
  }
}
