/** Conversiones de imagen y PDF en el navegador (subconjunto de las 17 de la app). */
import { PDFDocument } from 'pdf-lib'
import { canvasToBlob, closePdf, extractText, openPdf, renderPage } from './pdf'

export type ImageTarget = 'jpg' | 'png' | 'webp' | 'bmp'

export const IMAGE_MIME: Record<ImageTarget, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
}

export async function fileToCanvas(file: Blob, background?: string): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}

/** BMP de 24 bits sin compresión (los navegadores no exportan BMP con toBlob). */
export function canvasToBmp(canvas: HTMLCanvasElement): Blob {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  const rgba = ctx.getImageData(0, 0, w, h).data
  const rowSize = Math.ceil((w * 3) / 4) * 4
  const size = 54 + rowSize * h
  const buf = new ArrayBuffer(size)
  const v = new DataView(buf)
  v.setUint16(0, 0x424d) // "BM"
  v.setUint32(2, size, true)
  v.setUint32(10, 54, true)
  v.setUint32(14, 40, true)
  v.setInt32(18, w, true)
  v.setInt32(22, h, true)
  v.setUint16(26, 1, true)
  v.setUint16(28, 24, true)
  v.setUint32(34, rowSize * h, true)
  v.setInt32(38, 2835, true)
  v.setInt32(42, 2835, true)
  const bytes = new Uint8Array(buf)
  for (let y = 0; y < h; y++) {
    const row = 54 + (h - 1 - y) * rowSize // BMP guarda de abajo hacia arriba
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      const d = row + x * 3
      bytes[d] = rgba[s + 2]
      bytes[d + 1] = rgba[s + 1]
      bytes[d + 2] = rgba[s]
    }
  }
  return new Blob([buf], { type: 'image/bmp' })
}

export async function convertImage(file: File, target: ImageTarget, quality = 0.92): Promise<Blob> {
  // JPG y BMP no tienen transparencia: fondo blanco, como en la app.
  const canvas = await fileToCanvas(file, target === 'jpg' || target === 'bmp' ? '#ffffff' : undefined)
  if (target === 'bmp') return canvasToBmp(canvas)
  return canvasToBlob(canvas, IMAGE_MIME[target], quality)
}

/** Varias imágenes en un solo PDF, una por página, del tamaño de cada imagen. */
export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (const file of files) {
    const type = file.type || ''
    let image
    if (type === 'image/jpeg') image = await doc.embedJpg(await file.arrayBuffer())
    else if (type === 'image/png') image = await doc.embedPng(await file.arrayBuffer())
    else {
      const canvas = await fileToCanvas(file, '#ffffff')
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
      image = await doc.embedJpg(await blob.arrayBuffer())
    }
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }
  return doc.save()
}

export async function pdfToImages(
  bytes: ArrayBuffer,
  target: 'png' | 'jpg',
  width = 1600,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob[]> {
  const doc = await openPdf(bytes)
  const out: Blob[] = []
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const canvas = await renderPage(doc, i, width, 'print')
      if (target === 'jpg') {
        const flat = document.createElement('canvas')
        flat.width = canvas.width
        flat.height = canvas.height
        const ctx = flat.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, flat.width, flat.height)
        ctx.drawImage(canvas, 0, 0)
        out.push(await canvasToBlob(flat, 'image/jpeg', 0.9))
      } else {
        out.push(await canvasToBlob(canvas, 'image/png'))
      }
      onProgress?.(i, doc.numPages)
    }
  } finally {
    await closePdf(doc)
  }
  return out
}

export async function pdfToText(bytes: ArrayBuffer): Promise<string> {
  const doc = await openPdf(bytes)
  try {
    return await extractText(doc)
  } finally {
    await closePdf(doc)
  }
}
