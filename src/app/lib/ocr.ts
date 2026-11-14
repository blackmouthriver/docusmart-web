/**
 * OCR en el navegador con Tesseract (tesseract.js, Apache-2.0). El motor, el
 * worker y los modelos de idioma se sirven desde el propio dominio (/ocr/,
 * scripts/copy-wasm-assets.mjs): ninguna imagen sale del equipo.
 *
 * Resultado: el texto reconocido y, si se pide, un "PDF buscable" (la imagen
 * de cada página con una capa de texto invisible encima, que se puede
 * seleccionar y buscar).
 */
import { merge } from './pdfTools'

export type OcrLang = 'spa' | 'eng' | 'spa+eng'
export type OcrImage = Blob | HTMLCanvasElement
export type OcrPageResult = { text: string; confidence: number; pdf: Uint8Array | null }

export interface Recognizer {
  recognize(image: OcrImage, wantPdf: boolean): Promise<OcrPageResult>
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
    async recognize(image, wantPdf) {
      const { data } = await worker.recognize(image, { pdfTitle: 'DocuSmart OCR' }, { text: true, pdf: wantPdf })
      return {
        text: data.text ?? '',
        confidence: data.confidence ?? 0,
        pdf: wantPdf && data.pdf ? new Uint8Array(data.pdf) : null,
      }
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

export type OcrResult = { text: string; confidence: number; pdf: Uint8Array | null; pages: number }

/**
 * Reconoce una serie de páginas (imágenes o páginas de PDF ya dibujadas).
 * `pages` son funciones que producen cada imagen bajo demanda, para no tener
 * todas las páginas en memoria a la vez.
 */
export async function runOcr(
  pages: Array<() => Promise<OcrImage>>,
  opts: {
    lang: OcrLang
    wantPdf: boolean
    onProgress?: (p: OcrProgress) => void
    recognizerFactory?: (lang: OcrLang, onStatus?: (f: number, s: string) => void) => Promise<Recognizer>
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
  const pdfs: Uint8Array[] = []
  let confidenceSum = 0
  try {
    for (const getImage of pages) {
      current++
      const result = await recognizer.recognize(await getImage(), opts.wantPdf)
      texts.push(normalizeOcrText(result.text))
      confidenceSum += result.confidence
      if (result.pdf) pdfs.push(result.pdf)
      opts.onProgress?.({ page: current, pages: total, fraction: current / total, stage: 'reconociendo' })
    }
  } finally {
    await recognizer.terminate()
  }
  let pdf: Uint8Array | null = null
  if (opts.wantPdf && pdfs.length) {
    pdf = pdfs.length === 1 ? pdfs[0] : await merge(pdfs.map((p) => p.buffer.slice(p.byteOffset, p.byteOffset + p.byteLength) as ArrayBuffer))
  }
  return {
    text: texts.filter(Boolean).join(total > 1 ? '\n\n' : '\n'),
    confidence: Math.round(confidenceSum / total),
    pdf,
    pages: total,
  }
}
