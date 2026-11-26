// Partes del escáner que necesitan el canvas del navegador (excluidas de la
// cobertura, como los demás *Sources.ts e imageCanvas.ts).
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { MAX_OUTPUT_SIDE, applyFilter, detectDocument, insetQuad, outputSize, rotate90, warpPerspective, type Pixels, type Quad, type ScanFilter } from '../core/scan'

export type Photo = {
  /** La foto ya derecha (EXIF) y reducida a lo que hace falta para el resultado. */
  pixels: Pixels
  /** Versión liviana para mostrar en el editor de esquinas. */
  previewUrl: string
  /** Esquinas detectadas (fracciones), o null si no se encontró el documento. */
  detected: Quad | null
}

function toCanvas(src: CanvasImageSource, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  return { c, ctx }
}

// ImageData guarda data/width/height como getters del prototipo: hay que copiarlos uno por uno.
const asPixels = (id: ImageData): Pixels => ({ data: id.data, width: id.width, height: id.height })

function scaled(w: number, h: number, maxSide: number) {
  const k = Math.min(1, maxSide / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

export async function loadPhoto(file: Blob): Promise<Photo> {
  // El mismo cargador que las herramientas de imagen: además de JPG, PNG y WebP abre las fotos
  // HEIC del iPhone y los TIFF (con sus decodificadores), girados según su EXIF.
  const { loadImage } = await import('../../image/infra/imageCanvas')
  const { bmp } = await loadImage(file)
  try {
    // Un poco más grande que la salida, para que enderezar no pierda nitidez.
    const full = scaled(bmp.width, bmp.height, Math.round(MAX_OUTPUT_SIDE * 1.25))
    const { c, ctx } = toCanvas(bmp, full.w, full.h)
    const pixels = asPixels(ctx.getImageData(0, 0, full.w, full.h))

    const small = scaled(bmp.width, bmp.height, 420)
    const s = toCanvas(bmp, small.w, small.h)
    const detected = detectDocument(asPixels(s.ctx.getImageData(0, 0, small.w, small.h)))
    s.c.width = s.c.height = 0

    const prev = scaled(bmp.width, bmp.height, 1400)
    const p = toCanvas(bmp, prev.w, prev.h)
    const previewUrl = URL.createObjectURL(await canvasToBlob(p.c, 'image/jpeg', 0.85))
    p.c.width = p.c.height = 0
    c.width = c.height = 0
    return { pixels, previewUrl, detected }
  } finally {
    bmp.close()
  }
}

export const defaultQuad = (photo: Photo): Quad => photo.detected ?? insetQuad()

export async function pixelsToJpeg(p: Pixels, quality = 0.85): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = p.width
  c.height = p.height
  c.getContext('2d')!.putImageData(new ImageData(p.data as Uint8ClampedArray<ArrayBuffer>, p.width, p.height), 0, 0)
  try {
    return await canvasToBlob(c, 'image/jpeg', quality)
  } finally {
    c.width = c.height = 0
  }
}

/** Endereza, gira y filtra una página; devuelve el JPEG final. */
export async function processPage(photo: Photo, quad: Quad, turns: number, filter: ScanFilter) {
  const { width: W, height: H } = photo.pixels
  const q = quad.map((p) => ({ x: p.x * W, y: p.y * H })) as Quad
  const size = outputSize(q)
  let out = warpPerspective(photo.pixels, q, size.width, size.height)
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) out = rotate90(out)
  out = applyFilter(out, filter)
  const blob = await pixelsToJpeg(out, filter === 'bn' ? 0.8 : 0.85)
  return { blob, width: out.width, height: out.height }
}
