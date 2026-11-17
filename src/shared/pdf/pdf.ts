/** Lectura y render de PDFs con pdf.js, todo en el navegador. */
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { linesToText, type TextLine } from './textLayout'

GlobalWorkerOptions.workerSrc = workerUrl

// En pdf.js 6 se libera la tarea de carga, no el documento: se guarda la relación.
const tasks = new WeakMap<PDFDocumentProxy, ReturnType<typeof getDocument>>()

/** `fontExtraProperties`: incluye el nombre real de cada fuente (lo necesita PDF a Word para saber si es negrita o cursiva). */
export async function openPdf(data: ArrayBuffer | Uint8Array, password?: string, opts: { fontExtraProperties?: boolean } = {}): Promise<PDFDocumentProxy> {
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
    fontExtraProperties: opts.fontExtraProperties ?? false,
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

/** Texto del PDF completo, con una línea en blanco entre páginas. */
export async function extractText(doc: PDFDocumentProxy): Promise<string> {
  return (await extractPagesText(doc)).join('\n\n')
}

/** Texto de cada página por separado (para saber en qué página va la lectura). */
export async function extractPagesText(doc: PDFDocumentProxy): Promise<string[]> {
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let line: TextLine | null = null
    const lines: TextLine[] = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      // La altura de la línea es la de su primer trozo con texto.
      const current: TextLine = line ?? { text: '', y: item.transform[5], h: item.height }
      if (!current.text.trim() && item.str.trim()) {
        current.y = item.transform[5]
        current.h = item.height
      }
      current.text += item.str
      line = current
      if (item.hasEOL) {
        lines.push(line)
        line = null
      }
    }
    if (line) lines.push(line)
    pages.push(linesToText(lines))
    page.cleanup()
  }
  return pages
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), type, quality),
  )
}
