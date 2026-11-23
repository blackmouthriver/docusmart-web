/**
 * Lee todos los códigos de una imagen, una foto HEIC o un PDF (W-146.11): el lector nativo del
 * navegador (con todos los formatos que sepa: QR y códigos de barras) y jsQR, en varias escalas
 * y zonas (core/qrScan.ts). Cada QR encontrado se tapa y se vuelve a buscar, para hallar varios.
 * Excluido de la cobertura: necesita el canvas del navegador.
 */
import jsQR from 'jsqr'
import { mergeCodes, scanSteps, type ScanStep, type ScannedCode } from '../core/qrScan'

type Detector = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>> }
type DetectorClass = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> }

let native: Promise<Detector | null> | undefined
/** El lector nativo con todos los formatos que admite (null si el navegador no tiene). */
export function nativeDetector(): Promise<Detector | null> {
  native ??= (async () => {
    try {
      const BD = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector
      if (!BD) return null
      const formats = (await BD.getSupportedFormats?.()) ?? ['qr_code']
      return new BD({ formats: formats.length ? formats : ['qr_code'] })
    } catch {
      return null
    }
  })()
  return native
}

/** jsQR sobre una zona del lienzo, hasta 8 QR: cada uno que aparece se tapa y se busca otra vez. */
function jsqrAll(source: CanvasImageSource, step: ScanStep): ScannedCode[] {
  const k = Math.min(1, step.maxSide / Math.max(step.w, step.h))
  const w = Math.max(1, Math.round(step.w * k))
  const h = Math.max(1, Math.round(step.h * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, step.x, step.y, step.w, step.h, 0, 0, w, h)
  const out: ScannedCode[] = []
  try {
    for (let n = 0; n < 8; n++) {
      const r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)
      if (!r) break
      out.push({ value: r.data, format: 'qr_code' })
      // Se tapa con blanco (con margen) para que la próxima búsqueda encuentre otro.
      const l = r.location
      const pts = [l.topLeftCorner, l.topRightCorner, l.bottomRightCorner, l.bottomLeftCorner]
      const cx = pts.reduce((s, p) => s + p.x, 0) / 4
      const cy = pts.reduce((s, p) => s + p.y, 0) / 4
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      pts.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, cx + (p.x - cx) * 1.35, cy + (p.y - cy) * 1.35))
      ctx.closePath()
      ctx.fill()
    }
  } finally {
    canvas.width = canvas.height = 0
  }
  return out
}

/**
 * Todos los códigos de un lienzo o un bitmap de `w` × `h`. Con `thorough` en false (la cámara,
 * cuadro a cuadro) solo la pasada rápida.
 */
export async function scanSource(source: CanvasImageSource & ImageBitmapSource, w: number, h: number, thorough = true): Promise<ScannedCode[]> {
  const found: ScannedCode[] = []
  const detector = await nativeDetector()
  if (detector) {
    try {
      mergeCodes(found, (await detector.detect(source)).map((c) => ({ value: c.rawValue, format: c.format })))
    } catch {
      /* se sigue con jsQR */
    }
  }
  const { fast, detail } = scanSteps(w, h)
  if (!thorough && found.length) return found
  for (const step of fast) mergeCodes(found, jsqrAll(source, step))
  // Si no apareció nada, o la imagen es grande (puede haber más de uno), se busca con detalle.
  if (thorough && (!found.length || detail.length)) {
    for (const step of detail) mergeCodes(found, jsqrAll(source, step))
  }
  return found
}

/** Tope de páginas de un PDF que se revisan. */
export const MAX_PDF_PAGES = 30

/**
 * Los códigos de un archivo: imagen (también HEIC, TIFF y SVG) o PDF (cada página dibujada a
 * unos 200 ppp). `onProgress` recibe de 0 a 1.
 */
export async function scanFile(file: File, onProgress?: (p: number) => void): Promise<ScannedCode[]> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (isPdf) {
    const { openPdf, renderPage, closePdf } = await import('../../../shared/pdf/pdf')
    const doc = await openPdf(new Uint8Array(await file.arrayBuffer()))
    const found: ScannedCode[] = []
    try {
      const pages = Math.min(doc.numPages, MAX_PDF_PAGES)
      for (let i = 1; i <= pages; i++) {
        const page = await doc.getPage(i)
        const { width } = page.getViewport({ scale: 1 })
        page.cleanup()
        const canvas = await renderPage(doc, i, Math.round((width / 72) * 200), 'print')
        try {
          mergeCodes(found, await scanSource(canvas, canvas.width, canvas.height))
        } finally {
          canvas.width = canvas.height = 0
        }
        onProgress?.(i / pages)
      }
    } finally {
      await closePdf(doc)
    }
    return found
  }
  const { openImage } = await import('../../convert/core/convert')
  const canvas = await openImage(file, '#ffffff')
  try {
    return await scanSource(canvas, canvas.width, canvas.height)
  } finally {
    canvas.width = canvas.height = 0
    onProgress?.(1)
  }
}
