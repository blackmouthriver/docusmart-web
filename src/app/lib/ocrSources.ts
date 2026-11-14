/**
 * Convierte un PDF o una imagen en las "páginas" que recibe runOcr (ocr.ts).
 * Usa pdf.js y el canvas del navegador, por eso vive aparte de ocr.ts.
 */
import { closePdf, openPdf, renderPage } from './pdf'
import type { OcrImage } from './ocr'

/** Resolución a la que se dibuja cada página para reconocerla (ppp). */
export const OCR_DPI = 220

export type OcrSource = { pages: Array<() => Promise<OcrImage>>; close: () => Promise<void> }

export async function sourceFromFile(file: File): Promise<OcrSource> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf) return { pages: [async () => file], close: async () => {} }

  const doc = await openPdf(await file.arrayBuffer())
  const pages: Array<() => Promise<OcrImage>> = []
  for (let i = 1; i <= doc.numPages; i++) {
    pages.push(async () => {
      const page = await doc.getPage(i)
      const { width } = page.getViewport({ scale: 1 }) // puntos (1/72")
      page.cleanup()
      return renderPage(doc, i, Math.round((width / 72) * OCR_DPI), 'print')
    })
  }
  return { pages, close: () => closePdf(doc) }
}
