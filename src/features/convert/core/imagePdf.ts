/**
 * Imagen a PDF (W-146.7): tamaño de página, orientación y márgenes, como en iLovePDF, y lectura
 * de la cabecera de un JPEG (orientación EXIF y CMYK). Partes puras, para poder probarlas.
 */

/** A4 o Carta; "fit": como la imagen (ancho A4 y alto en proporción, como en el escáner). */
export type PdfPaper = 'a4' | 'letter' | 'fit'
/** "auto": vertical u horizontal según cada imagen. */
export type PdfOrientation = 'auto' | 'portrait' | 'landscape'
export type PdfMargin = 'none' | 'small' | 'big'
export type ImagePdfOptions = { paper: PdfPaper; orientation: PdfOrientation; margin: PdfMargin }

export const DEFAULT_IMAGE_PDF: ImagePdfOptions = { paper: 'fit', orientation: 'auto', margin: 'none' }

const PAPER: Record<Exclude<PdfPaper, 'fit'>, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] }
/** Márgenes en puntos: unos 7 mm y 18 mm. */
export const MARGIN_PT: Record<PdfMargin, number> = { none: 0, small: 20, big: 50 }
const FIT_WIDTH = 595

/** El tamaño de la página y dónde va la imagen (en puntos), completa, centrada y sin deformarse. */
export function imagePageLayout(width: number, height: number, opts: ImagePdfOptions): { size: [number, number]; x: number; y: number; width: number; height: number } {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const m = MARGIN_PT[opts.margin]
  let W: number
  let H: number
  if (opts.paper === 'fit') {
    W = FIT_WIDTH
    H = Math.round((FIT_WIDTH - 2 * m) * (h / w) + 2 * m)
  } else {
    const [pw, ph] = PAPER[opts.paper]
    const landscape = opts.orientation === 'landscape' || (opts.orientation === 'auto' && w > h)
    ;[W, H] = landscape ? [ph, pw] : [pw, ph]
  }
  const k = Math.min((W - 2 * m) / w, (H - 2 * m) / h)
  const iw = w * k
  const ih = h * k
  return { size: [W, H], x: (W - iw) / 2, y: (H - ih) / 2, width: iw, height: ih }
}

/**
 * Lo que importa de un JPEG para meterlo tal cual en un PDF: la orientación EXIF (1 = derecha) y
 * cuántos canales tiene (4 = CMYK). Con orientación distinta de 1 o CMYK hay que pasarlo por un canvas.
 */
export function jpegInfo(bytes: Uint8Array): { orientation: number; components: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let orientation = 1
  let components = 3
  let i = 2
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null
    const marker = bytes[i + 1]
    if (marker === 0xd9 || marker === 0xda) break
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    if (marker === 0xe1 && bytes[i + 4] === 0x45 && bytes[i + 5] === 0x78 && bytes[i + 6] === 0x69 && bytes[i + 7] === 0x66) {
      orientation = exifOrientation(bytes, i + 10) ?? orientation
    }
    // SOF0–SOF15, salvo DHT (C4), JPG (C8) y DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) components = bytes[i + 9]
    i += 2 + len
  }
  return { orientation, components }
}

/** La etiqueta 0x0112 del primer IFD de un bloque TIFF que empieza en `start`. */
function exifOrientation(b: Uint8Array, start: number): number | null {
  const little = b[start] === 0x49
  const u16 = (o: number) => (little ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1])
  const u32 = (o: number) => (little ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 2 ** 24 : b[o] * 2 ** 24 + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]))
  const ifd = start + u32(start + 4)
  if (ifd + 2 > b.length) return null
  const count = u16(ifd)
  for (let n = 0; n < count; n++) {
    const e = ifd + 2 + n * 12
    if (e + 12 > b.length) return null
    if (u16(e) === 0x0112) {
      const v = u16(e + 8)
      return v >= 1 && v <= 8 ? v : null
    }
  }
  return null
}
