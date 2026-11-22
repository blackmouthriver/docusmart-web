/**
 * Convierte un PDF o una imagen en las "páginas" que recibe runOcr (ocr.ts).
 * Usa pdf.js y el canvas del navegador, por eso vive aparte de ocr.ts.
 */
import { closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { imagePageSize, type OcrImage, type OcrPage, type Rotator } from '../core/ocr'

/** Resolución a la que se dibuja cada página para reconocerla (ppp). */
export const OCR_DPI = 220
/** Una página con al menos esta cantidad de letras ya tiene texto: no se reconoce (W-146.6). */
export const MIN_TEXT_CHARS = 25

/** `kept`: cuántas páginas ya tenían texto. `original`: el PDF de entrada, para copiar esas páginas. */
export type OcrSource = { pages: OcrPage[]; close: () => Promise<void>; original?: Uint8Array; kept: number }

/**
 * Las páginas de un PDF o una imagen. Con `force`, todas se reconocen; si no, las que ya tienen
 * texto se usan tal cual (no se vuelven imagen ni pierden calidad).
 */
export async function sourceFromFile(file: File, opts: { force?: boolean } = {}): Promise<OcrSource> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf) {
    let size: [number, number] | undefined
    try {
      const bmp = await createImageBitmap(file)
      size = imagePageSize(bmp.width, bmp.height)
      bmp.close()
    } catch {
      size = undefined
    }
    return { pages: [{ image: async () => file, size }], close: async () => {}, kept: 0 }
  }

  const original = new Uint8Array(await file.arrayBuffer())
  const doc = await openPdf(original.slice())
  const pages: OcrPage[] = []
  let kept = 0
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const { width, height } = page.getViewport({ scale: 1 }) // puntos (1/72")
    const size: [number, number] = [width, height]
    if (!opts.force) {
      const content = await page.getTextContent()
      const text = content.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join('')
      if (text.replace(/\s/g, '').length >= MIN_TEXT_CHARS) {
        pages.push({ text, size })
        kept++
        page.cleanup()
        continue
      }
    }
    page.cleanup()
    pages.push({ image: () => renderPage(doc, i, Math.round((width / 72) * OCR_DPI), 'print'), size })
  }
  return { pages, close: () => closePdf(doc), original, kept }
}

/** Gira una imagen (Blob o canvas) para reintentar el reconocimiento con otra orientación. */
export const rotateImage: Rotator = async (image: OcrImage, degrees) => {
  const src: CanvasImageSource & { width: number; height: number } = image instanceof Blob ? await createImageBitmap(image) : image
  const turned = degrees % 180 !== 0
  const c = document.createElement('canvas')
  c.width = turned ? src.height : src.width
  c.height = turned ? src.width : src.height
  const ctx = c.getContext('2d')!
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  if (src instanceof ImageBitmap) src.close()
  return c
}
