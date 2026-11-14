/**
 * Compresión fuerte de PDF: cada página se vuelve a dibujar como imagen JPEG
 * a menor resolución. Reduce mucho el peso de PDF escaneados o con fotos,
 * a cambio de que el texto deje de ser seleccionable. La compresión sin
 * pérdida (que no toca la calidad) está en pdfSecurity.ts.
 */
import { PDFDocument } from 'pdf-lib'
import { canvasToBlob, closePdf, openPdf, renderPage } from './pdf'
import type { CompressResult } from './pdfSecurity'

export type StrongLevel = 'media' | 'alta'

/** Resolución (puntos por pulgada) y calidad JPEG de cada nivel. */
export const STRONG_LEVELS: Record<StrongLevel, { dpi: number; quality: number }> = {
  media: { dpi: 144, quality: 0.72 },
  alta: { dpi: 96, quality: 0.55 },
}

export async function compressStrong(
  bytes: ArrayBuffer | Uint8Array,
  level: StrongLevel,
  onProgress?: (done: number, total: number) => void,
): Promise<CompressResult> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const { dpi, quality } = STRONG_LEVELS[level]
  const src = await openPdf(input)
  const out = await PDFDocument.create()
  try {
    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i)
      const { width, height } = page.getViewport({ scale: 1 }) // en puntos (1/72")
      page.cleanup()
      const canvas = await renderPage(src, i, Math.round((width / 72) * dpi), 'print')
      // JPEG no tiene transparencia: fondo blanco para que no quede negro.
      const flat = document.createElement('canvas')
      flat.width = canvas.width
      flat.height = canvas.height
      const ctx = flat.getContext('2d')
      if (!ctx) throw new Error('Canvas no disponible')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, flat.width, flat.height)
      ctx.drawImage(canvas, 0, 0)
      const jpg = await out.embedJpg(await (await canvasToBlob(flat, 'image/jpeg', quality)).arrayBuffer())
      out.addPage([width, height]).drawImage(jpg, { x: 0, y: 0, width, height })
      onProgress?.(i, src.numPages)
    }
  } finally {
    await closePdf(src)
  }
  const result = await out.save()
  const improved = result.length < input.length
  return { bytes: improved ? result : input, before: input.length, after: improved ? result.length : input.length, improved }
}
