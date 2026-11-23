// Texto de un archivo en el navegador: PDF (con pdf.js, por páginas), Word (.docx) o texto plano.
// Lo usan Resumir, Comparar textos y el Contador de palabras (auditoría W-146.12).
import { needsOcr } from '../../study/core/reading'

export const DOCUMENT_ACCEPT = 'application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md,.csv,text/plain,text/markdown'

/** `pages`: el texto de cada página (una sola si no es PDF). `scanned`: PDF sin texto (necesita OCR). */
export async function readDocument(file: File): Promise<{ pages: string[]; scanned: boolean }> {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const { openPdf, extractPagesText, closePdf } = await import('../../../shared/pdf/pdf')
    const doc = await openPdf(await file.arrayBuffer())
    try {
      const pages = await extractPagesText(doc)
      return { pages, scanned: needsOcr(pages) }
    } finally {
      await closePdf(doc)
    }
  }
  if (name.endsWith('.docx')) {
    const { docxToText } = await import('../../convert/infra/officeRender')
    return { pages: [await docxToText(file)], scanned: false }
  }
  return { pages: [await file.text()], scanned: false }
}
