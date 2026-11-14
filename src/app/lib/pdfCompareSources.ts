// Texto de un PDF por líneas y con su página, para "Comparar PDF" (usa pdf.js,
// excluido de la cobertura como los demás *Sources.ts).
import { closePdf, openPdf } from './pdf'
import type { Line } from './pdfCompare'

export async function pdfLines(file: File): Promise<{ lines: Line[]; pages: number }> {
  const doc = await openPdf(await file.arrayBuffer())
  try {
    const lines: Line[] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      let line = ''
      for (const item of content.items) {
        if (!('str' in item)) continue
        line += item.str
        if (item.hasEOL) {
          lines.push({ text: line, page: p })
          line = ''
        }
      }
      if (line) lines.push({ text: line, page: p })
      page.cleanup()
    }
    return { lines, pages: doc.numPages }
  } finally {
    await closePdf(doc)
  }
}
