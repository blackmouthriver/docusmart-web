/**
 * OCR en el navegador con Tesseract (tesseract.js, Apache-2.0). El motor, el
 * worker y los modelos de idioma se sirven desde el propio dominio (/ocr/,
 * scripts/copy-wasm-assets.mjs): ninguna imagen sale del equipo.
 *
 * Resultado: el texto reconocido y, si se pide, un "PDF buscable" (la imagen
 * de cada página con una capa de texto invisible encima, que se puede
 * seleccionar y buscar).
 */
import { PDFDocument } from 'pdf-lib'

import type { OcrLang } from './ocrLangs'
import type { OcrLine } from '../../convert/core/ocrLayout'
import { loadPdf } from '../../security/core/openPdf'
export * from './ocrLangs'
export type OcrImage = Blob | HTMLCanvasElement
/** `lines`, `width` y `height` (en píxeles de la imagen) solo si se pidió el diseño (W-147.3). */
export type OcrPageResult = { text: string; confidence: number; pdf: Uint8Array | null; lines?: OcrLine[]; width?: number; height?: number }

export interface Recognizer {
  recognize(image: OcrImage, wantPdf: boolean, layout?: boolean): Promise<OcrPageResult>
  terminate(): Promise<void>
}

export type OcrProgress = { page: number; pages: number; fraction: number; stage: 'preparando' | 'reconociendo' }

/** Crea el reconocedor con los recursos locales. Se descarga el modelo la primera vez y queda en caché. */
export async function createRecognizer(lang: OcrLang, onStatus?: (fraction: number, status: string) => void): Promise<Recognizer> {
  const { createWorker, OEM } = await import('tesseract.js')
  const worker = await createWorker(lang, OEM.LSTM_ONLY, {
    workerPath: '/ocr-worker.js',
    workerBlobURL: false,
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    gzip: true,
    logger: (m) => onStatus?.(m.progress ?? 0, m.status ?? ''),
  })
  return {
    async recognize(image, wantPdf, layout = false) {
      const { data } = await worker.recognize(image, { pdfTitle: 'DocuSmart OCR' }, { text: true, pdf: wantPdf, blocks: layout })
      const result: OcrPageResult = {
        text: data.text ?? '',
        confidence: data.confidence ?? 0,
        pdf: wantPdf && data.pdf ? new Uint8Array(data.pdf) : null,
      }
      if (layout) {
        // Cada línea con sus palabras y su caja, para armar Word y Excel con el diseño de la página.
        result.lines = (data.blocks ?? []).flatMap((b) =>
          b.paragraphs.flatMap((p) =>
            p.lines.map((l) => ({
              words: l.words.map((w) => ({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1, confidence: w.confidence })),
              baseline: Math.max(l.baseline.y0, l.baseline.y1),
              height: l.bbox.y1 - l.bbox.y0,
            })),
          ),
        )
        const size = image instanceof Blob ? await createImageBitmap(image) : image
        result.width = size.width
        result.height = size.height
        if ('close' in size) size.close()
      }
      return result
    },
    terminate: async () => {
      await worker.terminate()
    },
  }
}

/** Quita espacios al final de cada línea y deja como máximo una línea en blanco seguida. */
export function normalizeOcrText(text: string): string {
  return text
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * `pageTexts`: el texto de cada página por separado (Modo Estudio lo necesita para leer por páginas).
 * `kept`: páginas que ya tenían texto y se copiaron sin reconocer; `rotated`: páginas que se
 * reconocieron giradas porque venían de lado o de cabeza (W-146.6).
 */
export type OcrResult = { text: string; confidence: number; pdf: Uint8Array | null; pages: number; pageTexts: string[]; kept: number; rotated: number }

/** Tamaño de una página en puntos (ancho, alto). */
export type PageSize = [number, number]
/**
 * Una página para reconocer: una función que produce la imagen (como antes), o un objeto con la
 * imagen y el tamaño que debe tener en el PDF, o el texto que la página ya tenía (no se reconoce).
 */
export type OcrPage = (() => Promise<OcrImage>) | { image: () => Promise<OcrImage>; size?: PageSize } | { text: string; size?: PageSize }
export type Rotation = 0 | 90 | 180 | 270
/** Gira una imagen (en el navegador, con un canvas) para volver a intentar el reconocimiento. */
export type Rotator = (image: OcrImage, degrees: Exclude<Rotation, 0>) => Promise<OcrImage>

/** Por debajo de esta confianza, una página con texto se prueba girada. */
export const ORIENTATION_THRESHOLD = 60

/**
 * Reconoce una página y, si la confianza es baja y se puede girar, la prueba a 90°, 270° y 180°
 * y se queda con la de mayor confianza: así los escaneos de lado o de cabeza se leen bien.
 */
export async function recognizeOriented(recognizer: Recognizer, image: OcrImage, wantPdf: boolean, rotate?: Rotator, layout = false): Promise<{ result: OcrPageResult; rotation: Rotation }> {
  const first = await recognizer.recognize(image, wantPdf, layout)
  // Una página casi vacía tiene poca confianza pero no está girada: no vale la pena insistir.
  if (!rotate || first.confidence >= ORIENTATION_THRESHOLD || first.text.replace(/\s/g, '').length < 5) return { result: first, rotation: 0 }
  let best = { result: first, rotation: 0 as Rotation }
  for (const deg of [90, 270, 180] as const) {
    const r = await recognizer.recognize(await rotate(image, deg), wantPdf, layout)
    if (r.confidence > best.result.confidence) best = { result: r, rotation: deg }
    if (best.result.confidence >= ORIENTATION_THRESHOLD + 15) break
  }
  return best
}

/** Una parte del PDF final: una página del original (que ya tenía texto) o el PDF buscable de una página. */
export type PdfPart = { kind: 'original'; index: number } | { kind: 'ocr'; pdf: Uint8Array; size?: PageSize }

/**
 * Arma el PDF buscable: las páginas que ya tenían texto se copian tal cual del original, y las
 * reconocidas se dibujan en una página del tamaño que deben tener (Tesseract las entrega con el
 * tamaño en píxeles, que tomado como puntos daba páginas de 66 cm).
 */
export async function assembleSearchablePdf(parts: PdfPart[], original?: Uint8Array): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  const src = original && parts.some((p) => p.kind === 'original') ? await loadPdf(original) : null
  for (const part of parts) {
    if (part.kind === 'original') {
      if (!src) continue
      const [page] = await out.copyPages(src, [part.index])
      out.addPage(page)
      continue
    }
    const ocr = await loadPdf(part.pdf)
    if (!part.size) {
      // Sin tamaño pedido, la página va tal cual.
      const [page] = await out.copyPages(ocr, [0])
      out.addPage(page)
      continue
    }
    const [w, h] = part.size
    const page = out.addPage([w, h])
    const source = ocr.getPage(0)
    // Una página sin contenido no se puede incrustar (pdf-lib falla recién al guardar): queda en blanco, del tamaño correcto.
    if (!source.node.Contents()) continue
    const [embedded] = await out.embedPages([source])
    const k = Math.min(w / embedded.width, h / embedded.height)
    page.drawPage(embedded, { x: (w - embedded.width * k) / 2, y: (h - embedded.height * k) / 2, width: embedded.width * k, height: embedded.height * k })
  }
  out.setTitle('DocuSmart OCR')
  return out.save()
}

/** Tamaño para una imagen suelta: el ancho de una hoja A4 y el alto en proporción (como el escáner). */
export const imagePageSize = (width: number, height: number): PageSize => [595, Math.round((595 * height) / Math.max(1, width))]

/**
 * Reconoce una serie de páginas (imágenes o páginas de PDF ya dibujadas).
 * `pages` producen cada imagen bajo demanda, para no tener todas en memoria a la vez.
 * `original`: el PDF de entrada, para copiar tal cual las páginas que ya tenían texto.
 * `rotate`: para corregir la orientación de las páginas de lado o de cabeza.
 */
export async function runOcr(
  pages: OcrPage[],
  opts: {
    lang: OcrLang
    wantPdf: boolean
    onProgress?: (p: OcrProgress) => void
    recognizerFactory?: (lang: OcrLang, onStatus?: (f: number, s: string) => void) => Promise<Recognizer>
    original?: Uint8Array
    rotate?: Rotator
  },
): Promise<OcrResult> {
  if (pages.length === 0) throw new Error('No hay páginas para reconocer.')
  const total = pages.length
  let current = 0
  const factory = opts.recognizerFactory ?? createRecognizer
  const recognizer = await factory(opts.lang, (fraction, status) => {
    // Antes de la primera página, el progreso es la carga del motor y del idioma.
    const reconociendo = /recogniz/i.test(status)
    opts.onProgress?.({
      page: Math.max(1, current),
      pages: total,
      fraction: reconociendo ? (current - 1 + fraction) / total : 0,
      stage: reconociendo ? 'reconociendo' : 'preparando',
    })
  })
  const texts: string[] = []
  const parts: PdfPart[] = []
  let confidenceSum = 0
  let recognized = 0
  let kept = 0
  let rotated = 0
  try {
    for (const [index, page] of pages.entries()) {
      current++
      if (typeof page === 'object' && 'text' in page) {
        // La página ya tenía texto: se usa tal cual (y en el PDF, la página original).
        texts.push(normalizeOcrText(page.text))
        parts.push(opts.original ? { kind: 'original', index } : { kind: 'ocr', pdf: new Uint8Array(), size: page.size })
        kept++
      } else {
        const getImage = typeof page === 'function' ? page : page.image
        const size = typeof page === 'function' ? undefined : page.size
        const { result, rotation } = await recognizeOriented(recognizer, await getImage(), opts.wantPdf, opts.rotate)
        texts.push(normalizeOcrText(result.text))
        confidenceSum += result.confidence
        recognized++
        if (rotation) rotated++
        // Girada 90° o 270°, la página queda derecha: se intercambian ancho y alto.
        const fixed: PageSize | undefined = size && rotation % 180 ? [size[1], size[0]] : size
        if (result.pdf) parts.push({ kind: 'ocr', pdf: result.pdf, size: fixed })
      }
      opts.onProgress?.({ page: current, pages: total, fraction: current / total, stage: 'reconociendo' })
    }
  } finally {
    await recognizer.terminate()
  }
  let pdf: Uint8Array | null = null
  const usable = parts.filter((p) => p.kind === 'original' || p.pdf.length)
  if (opts.wantPdf && usable.length) pdf = await assembleSearchablePdf(usable, opts.original)
  return {
    text: texts.filter(Boolean).join(total > 1 ? '\n\n' : '\n'),
    // Solo cuentan las páginas reconocidas (las que ya tenían texto son exactas).
    confidence: recognized ? Math.round(confidenceSum / recognized) : 100,
    pdf,
    pages: total,
    pageTexts: texts,
    kept,
    rotated,
  }
}
