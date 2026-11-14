// Partes de "Censurar PDF" que necesitan pdf.js y el canvas del navegador
// (excluidas de la cobertura, como ocrSources.ts y pdfCompress.ts).
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { canvasToBlob, renderPage } from './pdf'
import { findTextAreas, type Area, type Matcher, type RasterPage, type Rasterizer, type TextItem } from './pdfRedact'

/** Resolución de las páginas censuradas: nítida para leer e imprimir sin pesar demasiado. */
export const REDACT_DPI = 200

/** Dibuja la página con las zonas tapadas en negro y la devuelve como JPEG. */
export function makeRasterizer(doc: PDFDocumentProxy): Rasterizer {
  return async (pageIndex: number, areas: Area[]): Promise<RasterPage> => {
    const page = await doc.getPage(pageIndex + 1)
    const vp = page.getViewport({ scale: 1 })
    const canvas = await renderPage(doc, pageIndex + 1, Math.round((vp.width / 72) * REDACT_DPI), 'print')
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    for (const a of areas) {
      // Se redondea hacia afuera: ningún pixel del borde queda sin tapar.
      const x = Math.floor(a.x * canvas.width)
      const y = Math.floor(a.y * canvas.height)
      ctx.fillRect(x, y, Math.ceil((a.x + a.w) * canvas.width) - x, Math.ceil((a.y + a.h) * canvas.height) - y)
    }
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9)
    canvas.width = canvas.height = 0
    return { image: new Uint8Array(await blob.arrayBuffer()), format: 'jpg', widthPt: vp.width, heightPt: vp.height }
  }
}

/** Busca en todas las páginas y devuelve las zonas que cubren cada coincidencia. */
export async function searchAreas(doc: PDFDocumentProxy, match: Matcher): Promise<Area[]> {
  const areas: Area[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const items = content.items.filter((it): it is TextItem & (typeof content.items)[number] => 'str' in it)
    areas.push(
      ...findTextAreas(i - 1, items, match, (x, y) => {
        const [vx, vy] = vp.convertToViewportPoint(x, y)
        return [vx / vp.width, vy / vp.height]
      }),
    )
    page.cleanup()
  }
  return areas
}
