/**
 * Compresión "recomendada" (W-146.5): solo se recomprimen las fotos del PDF (menos resolución y
 * JPEG), y todo lo demás queda igual: el texto sigue siendo texto (seleccionable y buscable),
 * con sus enlaces, marcadores y formularios. Es lo que hacen iLovePDF, Smallpdf o Adobe.
 *
 * La decodificación usa la de "Extraer imágenes"; el JPEG nuevo lo hace el `encode` que se
 * recibe (en el navegador, un canvas), así esta parte se puede probar sin navegador.
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, type PDFObject } from 'pdf-lib'
import { convertImage, resolveColorSpace } from '../../pdf/core/pdfImages'
import type { CompressResult } from './pdfSecurity'
import { loadPdf } from './openPdf'

export type ImageTarget = { maxSide: number; quality: number; gray: boolean }
export type EncodedImage = { data: Uint8Array; width: number; height: number }
/** Recibe la imagen ya decodificada (JPEG o PNG) y devuelve un JPEG nuevo (o null si no pudo). */
export type ImageEncoder = (img: { format: 'jpg' | 'png'; data: Uint8Array; width: number; height: number }, target: ImageTarget) => Promise<EncodedImage | null>

/** Niveles que conservan el texto: el lado más largo de cada foto y la calidad JPEG. */
export const IMAGE_LEVELS = {
  recomendada: { maxSide: 1600, quality: 0.75 },
  fuerte: { maxSide: 1100, quality: 0.6 },
} as const
export type ImageLevel = keyof typeof IMAGE_LEVELS

/** Imágenes más chicas que esto (en píxeles o en bytes) no vale la pena tocarlas. */
const MIN_SIDE = 96
const MIN_BYTES = 6 * 1024

const N = (s: string) => PDFName.of(s)
const num = (o: PDFObject | undefined) => (o instanceof PDFNumber ? o.asNumber() : 0)
const filters = (d: PDFDict) => {
  const f = d.lookup(N('Filter'))
  return f instanceof PDFName ? [f.decodeText()] : f instanceof PDFArray ? f.asArray().map((x) => (x instanceof PDFName ? x.decodeText() : '')) : []
}

export type ImageCompressResult = CompressResult & { images: number; changed: number }

export async function compressImages(bytes: ArrayBuffer | Uint8Array, target: ImageTarget, encode: ImageEncoder, onProgress?: (done: number, total: number) => void): Promise<ImageCompressResult> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const doc = await loadPdf(input)
  const ctx = doc.context
  const all = ctx.enumerateIndirectObjects()

  // Las máscaras (SMask, Mask) se dejan como están: son la transparencia de otra imagen.
  const masks = new Set<string>()
  for (const [, o] of all) {
    if (!(o instanceof PDFRawStream)) continue
    for (const key of ['SMask', 'Mask']) {
      const m = o.dict.get(N(key))
      if (m instanceof PDFRef) masks.add(m.toString())
    }
  }
  const candidates = all.filter(([ref, o]) => {
    if (!(o instanceof PDFRawStream) || masks.has(ref.toString())) return false
    const d = o.dict
    if (d.lookup(N('Subtype')) !== N('Image') || d.lookup(N('ImageMask'))?.toString() === 'true') return false
    if (num(d.lookup(N('Width'))) < MIN_SIDE || num(d.lookup(N('Height'))) < MIN_SIDE || o.contents.length < MIN_BYTES) return false
    const f = filters(d)
    // Un JPEG CMYK o con /Decode se ve distinto al pasarlo por el navegador: se deja.
    if (f.includes('DCTDecode')) {
      const cs = resolveColorSpace(d.lookup(N('ColorSpace')), doc)
      if (!cs || cs.kind === 'cmyk' || (cs.kind !== 'indexed' && cs.n === 4) || d.has(N('Decode'))) return false
    }
    return true
  }) as Array<[PDFRef, PDFRawStream]>

  let changed = 0
  for (const [i, [ref, stream]] of candidates.entries()) {
    onProgress?.(i, candidates.length)
    let decoded: ReturnType<typeof convertImage> = null
    try {
      decoded = convertImage(stream, doc)
    } catch {
      decoded = null
    }
    if (!decoded) continue
    const width = num(stream.dict.lookup(N('Width')))
    const height = num(stream.dict.lookup(N('Height')))
    const out = await encode({ ...decoded, width, height }, target)
    // Solo si queda más liviana (y si no se agrandó por error).
    if (!out || out.data.length >= stream.contents.length || out.width > width || out.height > height) continue
    const dict = stream.dict.clone(ctx)
    for (const key of ['DecodeParms', 'Decode', 'Intent']) dict.delete(N(key))
    dict.set(N('Filter'), N('DCTDecode'))
    dict.set(N('Width'), PDFNumber.of(out.width))
    dict.set(N('Height'), PDFNumber.of(out.height))
    dict.set(N('ColorSpace'), N('DeviceRGB'))
    dict.set(N('BitsPerComponent'), PDFNumber.of(8))
    dict.set(N('Length'), PDFNumber.of(out.data.length))
    ctx.assign(ref, PDFRawStream.of(dict, out.data))
    changed++
  }
  onProgress?.(candidates.length, candidates.length)
  const result = changed ? await doc.save() : input
  const improved = result.length < input.length
  return { bytes: improved ? result : input, before: input.length, after: improved ? result.length : input.length, improved, images: candidates.length, changed: improved ? changed : 0 }
}

/* ───────────── Comprimir a un tamaño máximo ───────────── */

export type SizeAttempt<L extends string> = { level: L; run: () => Promise<CompressResult> }
export type SizeResult<L extends string> = { result: CompressResult; level: L; reached: boolean }

/**
 * Prueba los niveles en orden (de menos a más pérdida) y se queda con el primero que entra en
 * `maxBytes`; si ninguno entra, devuelve el más liviano para que la persona decida.
 */
export async function compressToSize<L extends string>(attempts: Array<SizeAttempt<L>>, maxBytes: number): Promise<SizeResult<L>> {
  let best: SizeResult<L> | null = null
  for (const a of attempts) {
    const result = await a.run()
    if (result.after <= maxBytes) return { result, level: a.level, reached: true }
    if (!best || result.after < best.result.after) best = { result, level: a.level, reached: false }
  }
  if (!best) throw new Error('No compression levels')
  return best
}

/** "2 MB" → 2 097 152 (MB de 1024 × 1024, como los cuentan los portales y el explorador de archivos). */
export const megabytes = (mb: number) => Math.round(mb * 1024 * 1024)
