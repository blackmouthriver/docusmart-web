// Más formatos de imagen (W-124): abrir SVG y TIFF, y guardar en GIF, AVIF e ICO. Las librerías se
// cargan solo al usarlas. Excluido de la cobertura como los demás adaptadores con canvas y wasm.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { ICO_SIZES, containSquare, icoFromPngs, specialImage, svgRenderSize } from '../core/formats'

function newCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas no disponible')
  return { canvas, ctx }
}

/**
 * Un SVG dibujado en un canvas. Se abre como imagen (<img>), así sus scripts nunca se ejecutan,
 * con un tamaño cómodo si el dibujo es pequeño (es vectorial: se agranda sin perder nitidez).
 */
export async function svgToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const text = await file.text()
  const size = svgRenderSize(text)
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    const { canvas, ctx } = newCanvas(size.width, size.height)
    ctx.drawImage(img, 0, 0, size.width, size.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** La primera página de un TIFF en un canvas (UTIF, MIT: sin compresión, LZW, Deflate, PackBits y JPEG). */
export async function tiffToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const UTIF = (await import('utif2')).default
  const buffer = await file.arrayBuffer()
  const [page] = UTIF.decode(buffer)
  if (!page) throw new Error('TIFF sin imágenes')
  UTIF.decodeImage(buffer, page)
  const rgba = UTIF.toRGBA8(page)
  const { canvas, ctx } = newCanvas(page.width, page.height)
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.subarray(0, page.width * page.height * 4)), page.width, page.height), 0, 0)
  return canvas
}

/** Abre un HEIC, SVG o TIFF (o null si no es ninguno de ellos). */
export async function specialToCanvas(file: Blob): Promise<HTMLCanvasElement | null> {
  const kind = specialImage(new Uint8Array(await file.slice(0, 2048).arrayBuffer()))
  if (kind === 'heic') return (await import('./heicDecoder')).heicToCanvas(file)
  if (kind === 'svg') return svgToCanvas(file)
  if (kind === 'tiff') return tiffToCanvas(file)
  return null
}

const pixels = (canvas: HTMLCanvasElement) => canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height)

/** GIF de hasta 256 colores; lo transparente queda transparente (GIF solo admite todo o nada). */
export async function encodeGif(canvas: HTMLCanvasElement): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const { data, width, height } = pixels(canvas)
  const palette = quantize(data, 256, { format: 'rgba4444', oneBitAlpha: true })
  const index = applyPalette(data, palette, 'rgba4444')
  const transparentIndex = palette.findIndex((c) => c[3] === 0)
  const gif = GIFEncoder()
  gif.writeFrame(index, width, height, { palette, transparent: transparentIndex >= 0, transparentIndex: Math.max(0, transparentIndex) })
  gif.finish()
  return new Blob([gif.bytes() as Uint8Array<ArrayBuffer>], { type: 'image/gif' })
}

type AvifModule = { encode(data: Uint8Array, width: number, height: number, options: Record<string, unknown>): Uint8Array | null }
let avif: Promise<AvifModule> | null = null

/** AVIF con el codificador de libavif en wasm (3,5 MB que se descargan la primera vez desde /avif/). */
export async function encodeAvif(canvas: HTMLCanvasElement, quality = 60): Promise<Blob> {
  avif ??= (async () => {
    // Solo la versión de un hilo: la de varios hilos necesita aislamiento entre orígenes y su propio worker.
    const { default: factory } = await import('@jsquash/avif/codec/enc/avif_enc.js')
    return (factory as unknown as (o: Record<string, unknown>) => Promise<AvifModule>)({ noInitialRun: true, locateFile: () => '/avif/avif_enc.wasm' })
  })().catch((e: unknown) => {
    avif = null
    throw e
  })
  const [module, { defaultOptions }] = await Promise.all([avif, import('@jsquash/avif/meta.js')])
  const { data, width, height } = pixels(canvas)
  const out = module.encode(new Uint8Array(data.buffer), width, height, { ...defaultOptions, quality })
  if (!out) throw new Error('No se pudo crear el AVIF')
  return new Blob([out as Uint8Array<ArrayBuffer>], { type: 'image/avif' })
}

/** Favicon .ico con la imagen completa y centrada en 16, 32, 48, 64, 128 y 256 px. */
export async function encodeIco(source: HTMLCanvasElement): Promise<Blob> {
  const entries: Array<{ size: number; png: Uint8Array }> = []
  for (const size of ICO_SIZES) {
    const { canvas, ctx } = newCanvas(size, size)
    const r = containSquare(source.width, source.height, size)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, r.x, r.y, r.width, r.height)
    entries.push({ size, png: new Uint8Array(await (await canvasToBlob(canvas, 'image/png')).arrayBuffer()) })
    canvas.width = canvas.height = 0
  }
  return new Blob([icoFromPngs(entries) as Uint8Array<ArrayBuffer>], { type: 'image/x-icon' })
}
