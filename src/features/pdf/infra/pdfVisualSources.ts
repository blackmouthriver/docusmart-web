// Comparar PDF visualmente (W-147.7): dibuja las páginas con pdf.js y las compara con
// core/pdfVisualDiff.ts (excluido de la cobertura como los demás *Sources.ts).
import { canvasToBlob, closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { diffPages, type Pixels, type VisualPage } from '../core/pdfVisualDiff'

/** Ancho al que se dibujan las páginas: suficiente para ver un cambio de una letra. */
const RENDER_WIDTH = 1000
/** Menos pixeles distintos que esto se toma como ruido del dibujo. */
const MIN_PIXELS = 6

export type VisualImages = { a?: string; b?: string; overlay?: string }
export type VisualResult = {
  pages: VisualPage[]
  /** Imágenes (URL de objeto) de las páginas que cambiaron o están solo en uno. */
  images: Map<number, VisualImages>
  /** JPEG de cada página con cambios, para el informe en PDF. */
  report: Array<{ jpg: Uint8Array; width: number; height: number; page: number }>
}

const pixelsOf = (c: HTMLCanvasElement): Pixels => {
  const id = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height)
  return { data: id.data, width: id.width, height: id.height }
}

async function toJpeg(c: HTMLCanvasElement) {
  return canvasToBlob(c, 'image/jpeg', 0.85)
}

function pixelsCanvas(p: Pixels) {
  const c = document.createElement('canvas')
  c.width = p.width
  c.height = p.height
  c.getContext('2d')!.putImageData(new ImageData(p.data as Uint8ClampedArray<ArrayBuffer>, p.width, p.height), 0, 0)
  return c
}

export async function visualCompare(fileA: File, fileB: File, onProgress?: (done: number, total: number) => void): Promise<VisualResult> {
  const [docA, docB] = await Promise.all([openPdf(await fileA.arrayBuffer()), openPdf(await fileB.arrayBuffer())])
  const result: VisualResult = { pages: [], images: new Map(), report: [] }
  try {
    const total = Math.max(docA.numPages, docB.numPages)
    for (let n = 1; n <= total; n++) {
      const ca = n <= docA.numPages ? await renderPage(docA, n, RENDER_WIDTH, 'print') : null
      const cb = n <= docB.numPages ? await renderPage(docB, n, RENDER_WIDTH, 'print') : null
      try {
        if (ca && cb) {
          const d = diffPages(pixelsOf(ca), pixelsOf(cb))
          const pixels = Math.round(d.changed * d.overlay.width * d.overlay.height)
          if (pixels < MIN_PIXELS) result.pages.push({ page: n, status: 'same', changed: 0, boxes: [] })
          else {
            result.pages.push({ page: n, status: 'changed', changed: d.changed, boxes: d.boxes })
            const oc = pixelsCanvas(d.overlay)
            const [a, b, overlay] = await Promise.all([toJpeg(ca), toJpeg(cb), toJpeg(oc)])
            result.images.set(n, { a: URL.createObjectURL(a), b: URL.createObjectURL(b), overlay: URL.createObjectURL(overlay) })
            result.report.push({ jpg: new Uint8Array(await overlay.arrayBuffer()), width: oc.width, height: oc.height, page: n })
            oc.width = oc.height = 0
          }
        } else {
          const only = (ca ?? cb)!
          const blob = await toJpeg(only)
          result.pages.push({ page: n, status: ca ? 'onlyA' : 'onlyB', changed: 1, boxes: [] })
          result.images.set(n, ca ? { a: URL.createObjectURL(blob) } : { b: URL.createObjectURL(blob) })
          result.report.push({ jpg: new Uint8Array(await blob.arrayBuffer()), width: only.width, height: only.height, page: n })
        }
      } finally {
        for (const c of [ca, cb]) if (c) c.width = c.height = 0
      }
      onProgress?.(n, total)
    }
    return result
  } finally {
    await Promise.all([closePdf(docA), closePdf(docB)])
  }
}

export function revokeVisual(r: VisualResult | null) {
  r?.images.forEach((i) => [i.a, i.b, i.overlay].forEach((u) => u && URL.revokeObjectURL(u)))
}
