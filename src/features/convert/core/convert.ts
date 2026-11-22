/** Conversiones de imagen y PDF en el navegador (subconjunto de las 17 de la app). */
import { PDFDocument } from 'pdf-lib'
import { canvasToBlob, closePdf, extractText, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { specialImage } from './formats'
import { DEFAULT_IMAGE_PDF, imagePageLayout, jpegInfo, type ImagePdfOptions } from './imagePdf'

export type ImageTarget = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif' | 'avif' | 'ico'

export const IMAGE_MIME: Record<ImageTarget, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
  gif: 'image/gif',
  avif: 'image/avif',
  ico: 'image/x-icon',
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

/**
 * Como fileToCanvas, pero también abre lo que el navegador no abre solo: fotos HEIC del iPhone
 * (W-107), dibujos SVG y escaneos TIFF (W-124), con decodificadores que se cargan solo si hacen falta.
 */
export async function openImage(file: Blob, background?: string): Promise<HTMLCanvasElement> {
  try {
    return await fileToCanvas(file, background)
  } catch (e) {
    if (!specialImage(new Uint8Array(await file.slice(0, 2048).arrayBuffer()))) throw e
    const { specialToCanvas } = await import('../infra/formatCodecs')
    const photo = await specialToCanvas(file)
    if (!photo) throw e
    if (!background) return photo
    const ctx = photo.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = background
    ctx.fillRect(0, 0, photo.width, photo.height)
    return photo
  }
}

/** JPG y BMP no tienen transparencia: fondo blanco, como en la app. */
const needsBackground = (target: ImageTarget) => target === 'jpg' || target === 'bmp'

async function encodeCanvas(canvas: HTMLCanvasElement, target: ImageTarget, quality: number): Promise<Blob> {
  if (target === 'bmp') return canvasToBmp(canvas)
  if (target === 'gif' || target === 'avif' || target === 'ico') {
    const codecs = await import('../infra/formatCodecs')
    if (target === 'gif') return codecs.encodeGif(canvas)
    if (target === 'avif') return codecs.encodeAvif(canvas)
    return codecs.encodeIco(canvas)
  }
  return canvasToBlob(canvas, IMAGE_MIME[target], quality)
}

export async function convertImage(file: File, target: ImageTarget, quality = 0.92): Promise<Blob> {
  return encodeCanvas(await openImage(file, needsBackground(target) ? '#ffffff' : undefined), target, quality)
}

const isTiffFile = async (file: Blob) => specialImage(new Uint8Array(await file.slice(0, 2048).arrayBuffer())) === 'tiff'

/** Pone un fondo detrás de lo transparente del canvas. */
function flatten(canvas: HTMLCanvasElement, background: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

/** Como convertImage, pero un TIFF de varias páginas da una imagen por página (W-146.7). */
export async function convertImagePages(file: File, target: ImageTarget, quality = 0.92): Promise<Blob[]> {
  if (!(await isTiffFile(file))) return [await convertImage(file, target, quality)]
  const { tiffToCanvases } = await import('../infra/formatCodecs')
  const out: Blob[] = []
  for (const canvas of await tiffToCanvases(file)) {
    if (needsBackground(target)) flatten(canvas, '#ffffff')
    out.push(await encodeCanvas(canvas, target, quality))
    canvas.width = canvas.height = 0
  }
  return out
}

/**
 * Varias imágenes en un solo PDF, una por página, del tamaño, orientación y márgenes elegidos
 * (W-146.7). Los JPEG derechos y en RGB entran tal cual (sin perder calidad); los girados por EXIF
 * y los CMYK pasan por un canvas para que salgan derechos y con los colores correctos.
 */
export async function imagesToPdf(files: File[], opts: ImagePdfOptions = DEFAULT_IMAGE_PDF): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const embedCanvas = async (canvas: HTMLCanvasElement) => {
    flatten(canvas, '#ffffff')
    const image = await doc.embedJpg(await (await canvasToBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer())
    canvas.width = canvas.height = 0
    return image
  }
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const jpeg = jpegInfo(bytes)
    const images = []
    if (jpeg && jpeg.orientation === 1 && jpeg.components !== 4) images.push(await doc.embedJpg(bytes))
    else if (!jpeg && file.type === 'image/png') images.push(await doc.embedPng(bytes))
    else if (await isTiffFile(file)) {
      const { tiffToCanvases } = await import('../infra/formatCodecs')
      for (const canvas of await tiffToCanvases(file)) images.push(await embedCanvas(canvas))
    } else images.push(await embedCanvas(await openImage(file, '#ffffff')))
    for (const image of images) {
      const { size, ...box } = imagePageLayout(image.width, image.height, opts)
      doc.addPage(size).drawImage(image, box)
    }
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
