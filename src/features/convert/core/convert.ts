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
  // Un GIF, WebP o PNG animado a GIF conserva la animación (W-147.3); si el navegador no puede
  // leer los cuadros, queda el primero como antes.
  if (target === 'gif' && /^image\/(gif|webp|png|apng)$/.test(file.type)) {
    const animated = await (await import('../infra/formatCodecs')).encodeAnimatedGif(file)
    if (animated) return [animated]
  }
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

/** Lado máximo de la imagen de una página (300 ppp de un A3 entra; un plano A0 se achica). */
export const MAX_RENDER_SIDE = 7000
export const PDF_IMAGE_DPIS = [72, 150, 300] as const

/** Ancho en píxeles de una página de `widthPts` puntos a `dpi` ppp, sin pasar del máximo por ningún lado. */
export function renderWidth(widthPts: number, heightPts: number, dpi: number): number {
  const k = Math.min(dpi / 72, MAX_RENDER_SIDE / Math.max(1, widthPts, heightPts))
  return Math.max(1, Math.round(widthPts * k))
}

/** Las páginas escritas no son válidas ("1-3, 5" con un PDF de 2 páginas, letras…). */
export class PageRangeError extends Error {
  constructor() {
    super('Páginas no válidas')
    this.name = 'PageRangeError'
  }
}

/**
 * Cada página (o las elegidas) como imagen. Con `dpi` (W-147.3) el tamaño depende de la página
 * (72 ppp para pantalla, 300 para imprimir); sin él, `width` píxeles de ancho. `quality`: JPG de 0 a 1.
 * `pages`: "1-3, 5" (vacío = todas). Devuelve también el número de cada página (desde 1).
 */
export async function pdfToImages(
  bytes: ArrayBuffer,
  target: 'png' | 'jpg',
  width = 1600,
  onProgress?: (done: number, total: number) => void,
  opts: { dpi?: number; quality?: number; pages?: string } = {},
): Promise<Blob[]> {
  return (await pdfToNumberedImages(bytes, target, width, onProgress, opts)).map((p) => p.blob)
}

export async function pdfToNumberedImages(
  bytes: ArrayBuffer,
  target: 'png' | 'jpg',
  width = 1600,
  onProgress?: (done: number, total: number) => void,
  opts: { dpi?: number; quality?: number; pages?: string } = {},
): Promise<Array<{ page: number; blob: Blob }>> {
  const doc = await openPdf(bytes)
  const out: Array<{ page: number; blob: Blob }> = []
  try {
    const { parsePageRanges } = await import('../../../shared/files/files')
    const wanted = opts.pages?.trim() ? parsePageRanges(opts.pages, doc.numPages) : Array.from({ length: doc.numPages }, (_, i) => i)
    if (!wanted?.length) throw new PageRangeError()
    for (const [k, index] of wanted.entries()) {
      const n = index + 1
      let w = width
      if (opts.dpi) {
        const page = await doc.getPage(n)
        const vp = page.getViewport({ scale: 1 })
        w = renderWidth(vp.width, vp.height, opts.dpi)
        page.cleanup()
      }
      const canvas = await renderPage(doc, n, w, 'print')
      if (target === 'jpg') {
        const flat = document.createElement('canvas')
        flat.width = canvas.width
        flat.height = canvas.height
        const ctx = flat.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, flat.width, flat.height)
        ctx.drawImage(canvas, 0, 0)
        out.push({ page: n, blob: await canvasToBlob(flat, 'image/jpeg', opts.quality ?? 0.9) })
        flat.width = flat.height = 0
      } else {
        out.push({ page: n, blob: await canvasToBlob(canvas, 'image/png') })
      }
      canvas.width = canvas.height = 0
      onProgress?.(k + 1, wanted.length)
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
