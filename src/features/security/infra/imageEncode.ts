// Codificador JPEG del navegador para la compresión que conserva el texto (W-146.5): achica la
// foto hasta `maxSide`, la pasa a gris si se pide y la guarda como JPEG. Usa canvas, por eso
// vive en infra (excluida de la cobertura, como pdfCompress.ts).
import { canvasToBlob } from '../../../shared/pdf/pdf'
import type { ImageEncoder } from '../core/pdfImageCompress'

/** Pasa a gris los píxeles RGBA (luminancia BT.601). */
export function toGray(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const y = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = data[i + 1] = data[i + 2] = y
  }
}

export const encodeImage: ImageEncoder = async (img, target) => {
  const type = img.format === 'jpg' ? 'image/jpeg' : 'image/png'
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(new Blob([img.data as BlobPart], { type }))
  } catch {
    return null
  }
  const k = Math.min(1, target.maxSide / Math.max(bmp.width, bmp.height))
  const width = Math.max(1, Math.round(bmp.width * k))
  const height = Math.max(1, Math.round(bmp.height * k))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: target.gray })
  if (!ctx) return null
  // JPEG no tiene transparencia: fondo blanco (la transparencia la sigue dando la máscara del PDF).
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, width, height)
  bmp.close()
  if (target.gray) {
    const px = ctx.getImageData(0, 0, width, height)
    toGray(px.data)
    ctx.putImageData(px, 0, 0)
  }
  const blob = await canvasToBlob(canvas, 'image/jpeg', target.quality)
  canvas.width = canvas.height = 0
  return { data: new Uint8Array(await blob.arrayBuffer()), width, height }
}
