/** Lectura y render de PDFs con pdf.js, todo en el navegador. */
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

// En pdf.js 6 se libera la tarea de carga, no el documento: se guarda la relación.
const tasks = new WeakMap<PDFDocumentProxy, ReturnType<typeof getDocument>>()

export async function openPdf(data: ArrayBuffer | Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  // pdf.js transfiere el buffer al worker: se pasa una copia para no invalidar el original.
  const bytes = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0))
  // Recursos servidos desde el propio dominio (scripts/copy-pdfjs-assets.mjs).
  const task = getDocument({
    data: bytes,
    password,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    iccUrl: '/pdfjs/iccs/',
    wasmUrl: '/pdfjs/wasm/',
  })
  const doc = await task.promise
  tasks.set(doc, task)
  return doc
}

export async function closePdf(doc: PDFDocumentProxy) {
  await tasks.get(doc)?.destroy()
  tasks.delete(doc)
}

/**
 * `intent: 'print'` no espera a requestAnimationFrame: sirve para exportar
 * páginas aunque la pestaña quede en segundo plano. 'display' es para mostrar.
 */
export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number,
  intent: 'display' | 'print' = 'display',
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = targetWidth / base.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await page.render({ canvas, viewport, intent }).promise
  page.cleanup()
  return canvas
}

export async function extractText(doc: PDFDocumentProxy): Promise<string> {
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let line = ''
    const lines: string[] = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line)
        line = ''
      }
    }
    if (line) lines.push(line)
    pages.push(lines.join('\n').trim())
    page.cleanup()
  }
  return pages.join('\n\n')
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), type, quality),
  )
}
