// OCR de las páginas escaneadas de un PDF para PDF a Word y PDF a Excel (W-147.3). Dibuja cada
// página con pdf.js y la reconoce con el OCR local (corrige la orientación): nada sale del equipo.
// Usa el canvas del navegador, por eso queda fuera de la cobertura como los demás infra/.
import { closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { createRecognizer, recognizeOriented, type OcrLang, type OcrProgress } from '../../ocr/core/ocr'
import { OCR_DPI, rotateImage } from '../../ocr/infra/ocrSources'
import { ocrLinesToFrags } from '../core/ocrLayout'
import type { PageInfo, TextFrag } from '../core/pdfWord'

/**
 * `texts`: las palabras de cada página reconocida, en puntos. `sizes`: el tamaño con que queda la
 * página (ancho y alto se intercambian si venía de lado). `rotated`: cuántas venían giradas.
 */
export async function ocrScannedPages(file: File, pages: readonly number[], lang: OcrLang, onProgress?: (p: OcrProgress) => void): Promise<{ texts: TextFrag[]; sizes: Map<number, PageInfo>; rotated: number }> {
  const texts: TextFrag[] = []
  const sizes = new Map<number, PageInfo>()
  let rotated = 0
  let current = 0
  const recognizer = await createRecognizer(lang, (fraction, status) => {
    const reconociendo = /recogniz/i.test(status)
    onProgress?.({ page: Math.max(1, current), pages: pages.length, fraction: reconociendo ? (current - 1 + fraction) / pages.length : 0, stage: reconociendo ? 'reconociendo' : 'preparando' })
  })
  const doc = await openPdf(await file.arrayBuffer())
  try {
    for (const index of pages) {
      current++
      const page = await doc.getPage(index + 1)
      const { width, height } = page.getViewport({ scale: 1 })
      page.cleanup()
      const canvas = await renderPage(doc, index + 1, Math.round((width / 72) * OCR_DPI), 'print')
      const scale = width / canvas.width
      try {
        const { result, rotation } = await recognizeOriented(recognizer, canvas, false, rotateImage, true)
        if (rotation) rotated++
        texts.push(...ocrLinesToFrags(result.lines ?? [], index, scale))
        sizes.set(index, rotation % 180 ? { width: height, height: width } : { width, height })
      } finally {
        canvas.width = canvas.height = 0
      }
      onProgress?.({ page: current, pages: pages.length, fraction: current / pages.length, stage: 'reconociendo' })
    }
  } finally {
    await recognizer.terminate()
    await closePdf(doc)
  }
  return { texts, sizes, rotated }
}
