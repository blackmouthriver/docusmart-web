// Dibujo de imágenes con canvas para las herramientas de imagen (excluido de la
// cobertura como los demás archivos que necesitan el canvas del navegador).
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { capSize, rotatedSize, type OutputMime, type Transform } from '../core/imageTools'
import { specialImage } from '../../convert/core/formats'
import { tr } from '../../../shared/i18n/translate'

export type LoadedImage = { bmp: ImageBitmap; width: number; height: number }

/**
 * Abre la imagen ya girada según su EXIF (las fotos de celular vienen "acostadas" si no). Las
 * fotos HEIC del iPhone (W-107), los SVG y los TIFF (W-124), que el navegador no abre solo, se
 * abren con sus decodificadores.
 */
export async function loadImage(file: Blob): Promise<LoadedImage> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { bmp, width: bmp.width, height: bmp.height }
  } catch {
    if (specialImage(new Uint8Array(await file.slice(0, 2048).arrayBuffer()))) {
      const { specialToCanvas } = await import('../../convert/infra/formatCodecs')
      const canvas = (await specialToCanvas(file))!
      try {
        const bmp = await createImageBitmap(canvas)
        return { bmp, width: bmp.width, height: bmp.height }
      } finally {
        canvas.width = canvas.height = 0
      }
    }
    const e = new Error(tr('libErr.imageOpen'))
    e.name = 'ImageOpenError'
    throw e
  }
}

/** Copia en JPG (de hasta 2048 px) para ver en pantalla una imagen que el navegador no muestra (HEIC, TIFF, SVG). */
export async function previewBlob(file: Blob): Promise<Blob> {
  const img = await loadImage(file)
  try {
    return await renderImage(img, { ...capSize(img.width, img.height, 2048), mime: 'image/jpeg', quality: 0.85 })
  } finally {
    img.bmp.close()
  }
}

/** ¿Tiene pixeles transparentes? Se revisa una versión pequeña, que alcanza para decidir el formato. */
export function hasAlpha(bmp: ImageBitmap): boolean {
  const k = Math.min(1, 256 / Math.max(bmp.width, bmp.height))
  const c = new OffscreenCanvas(Math.max(1, Math.round(bmp.width * k)), Math.max(1, Math.round(bmp.height * k)))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true
  return false
}

export type RenderOptions = {
  /** Zona de la imagen original, en pixeles (toda si se omite). */
  crop?: { x: number; y: number; width: number; height: number }
  /** Tamaño final antes de girar (el del recorte si se omite). */
  width?: number
  height?: number
  transform?: Transform
  mime: OutputMime
  quality?: number
}

/**
 * Comprimir (W-146.8): la imagen a `width` × `height` en el formato del plan. Un PNG se pasa a
 * paleta si se parece lo suficiente (como TinyPNG); si no, se guarda sin perder nada.
 */
export async function encodeCompressed(img: LoadedImage, width: number, height: number, plan: { mime: OutputMime; minPsnr: number }, quality: number): Promise<Blob> {
  if (plan.mime !== 'image/png') return renderImage(img, { width, height, mime: plan.mime, quality })
  const { palettePng } = await import('../core/imageCompress')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img.bmp, 0, 0, width, height)
  try {
    const pal = palettePng(ctx.getImageData(0, 0, width, height).data, width, height, plan.minPsnr)
    return pal ? new Blob([pal.png as Uint8Array<ArrayBuffer>], { type: 'image/png' }) : await canvasToBlob(canvas, 'image/png')
  } finally {
    canvas.width = canvas.height = 0
  }
}

/** Recorta, escala, gira o voltea y codifica. Sin metadatos: el EXIF (y la ubicación GPS) no se copia. */
export async function renderImage(img: LoadedImage, o: RenderOptions): Promise<Blob> {
  const src = o.crop ?? { x: 0, y: 0, width: img.width, height: img.height }
  const w = o.width ?? src.width
  const h = o.height ?? src.height
  const t = o.transform ?? { rotate: 0, flipH: false, flipV: false }
  const out = rotatedSize(w, h, t)
  const canvas = document.createElement('canvas')
  canvas.width = out.width
  canvas.height = out.height
  const ctx = canvas.getContext('2d')!
  // JPEG no tiene transparencia: fondo blanco en vez de negro.
  if (o.mime === 'image/jpeg') {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, out.width, out.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate((t.rotate * Math.PI) / 180)
  ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
  ctx.drawImage(img.bmp, src.x, src.y, src.width, src.height, -w / 2, -h / 2, w, h)
  try {
    return await canvasToBlob(canvas, o.mime, o.quality)
  } finally {
    canvas.width = canvas.height = 0
  }
}

/** Copia reducida (hasta `maxSide`) de la imagen, para redibujar la vista previa al instante. */
export async function previewBitmap(file: Blob, maxSide = 900): Promise<ImageBitmap> {
  const img = await loadImage(file)
  const k = Math.min(1, maxSide / Math.max(img.width, img.height))
  if (k === 1) return img.bmp
  try {
    return await createImageBitmap(img.bmp, { resizeWidth: Math.max(1, Math.round(img.width * k)), resizeHeight: Math.max(1, Math.round(img.height * k)), resizeQuality: 'high' })
  } finally {
    img.bmp.close()
  }
}
