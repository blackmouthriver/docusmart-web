// Extracción para "PDF a Word" con pdf.js: texto con su fuente y posición, e
// imágenes con su lugar en la página. Necesita el canvas del navegador para
// las imágenes, así que queda excluido de la cobertura como los demás *Sources.ts.
import { ImageKind, OPS, Util, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist'
import { canvasToBlob, closePdf, openPdf } from './pdf'
import { cleanFontName, type Family, type ImageFrag, type PageInfo, type TextFrag } from './pdfWord'

type Matrix = number[]
// Con fontExtraProperties, pdf.js copia al objeto de la fuente su nombre real (p. ej. "ABCDEF+Calibri-Bold").
type FontInfo = { bold?: boolean; italic?: boolean; black?: boolean; fallbackName?: string; name?: string; isSerifFont?: boolean; isMonospace?: boolean }

const BOLD = /bold|black|heavy|semibold|demibold|extrabold|ultrabold|-bd\b/i
const ITALIC = /italic|oblique|-it\b/i

const familyOf = (name: string | undefined): Family => (/mono|courier/i.test(name ?? '') ? 'mono' : /serif|times|georgia|garamond|cambria/i.test(name ?? '') && !/sans/i.test(name ?? '') ? 'serif' : 'sans')

/** Espera un objeto de pdf.js (fuente o imagen) que puede no estar listo todavía. */
function getObj<T>(page: PDFPageProxy, id: string): Promise<T | null> {
  const store = id.startsWith('g_') ? page.commonObjs : page.objs
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 3000)
    try {
      store.get(id, (obj: T) => {
        clearTimeout(timer)
        resolve(obj)
      })
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

/** Imagen de pdf.js (bitmap o pixeles crudos) a PNG, achicada si es enorme. */
async function imageToPng(img: { width: number; height: number; bitmap?: ImageBitmap; data?: Uint8ClampedArray; kind?: number }): Promise<Uint8Array | null> {
  const k = Math.min(1, 1600 / Math.max(img.width, img.height))
  const src = document.createElement('canvas')
  src.width = img.width
  src.height = img.height
  const ctx = src.getContext('2d')!
  if (img.bitmap) ctx.drawImage(img.bitmap, 0, 0)
  else if (img.data) {
    const rgba = new Uint8ClampedArray(img.width * img.height * 4)
    if (img.kind === ImageKind.RGBA_32BPP) rgba.set(img.data.subarray(0, rgba.length))
    else if (img.kind === ImageKind.RGB_24BPP) for (let i = 0, j = 0; j < rgba.length; i += 3, j += 4) rgba.set([img.data[i], img.data[i + 1], img.data[i + 2], 255], j)
    else if (img.kind === ImageKind.GRAYSCALE_1BPP) {
      const rowBytes = Math.ceil(img.width / 8)
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < img.width; x++) {
          const v = (img.data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0
          rgba.set([v, v, v, 255], (y * img.width + x) * 4)
        }
    } else return null
    ctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0)
  } else return null
  let out = src
  if (k < 1) {
    out = document.createElement('canvas')
    out.width = Math.round(img.width * k)
    out.height = Math.round(img.height * k)
    out.getContext('2d')!.drawImage(src, 0, 0, out.width, out.height)
  }
  const blob = await canvasToBlob(out, 'image/png')
  src.width = src.height = out.width = out.height = 0
  return new Uint8Array(await blob.arrayBuffer())
}

async function pageImages(page: PDFPageProxy, index: number, viewport: Matrix): Promise<ImageFrag[]> {
  const ops = await page.getOperatorList()
  const found: Array<{ id: string | null; inline: unknown; ctm: Matrix }> = []
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  const stack: Matrix[] = []
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i] as unknown[]
    if (fn === OPS.save) stack.push(ctm)
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args as Matrix)
    else if (fn === OPS.paintImageXObject) found.push({ id: args[0] as string, inline: null, ctm })
    else if (fn === OPS.paintInlineImageXObject) found.push({ id: null, inline: args[0], ctm })
  }
  const out: ImageFrag[] = []
  for (const f of found.slice(0, 60)) {
    // La imagen ocupa el cuadrado unitario transformado por la matriz actual.
    const m = Util.transform(viewport, f.ctm)
    const xs = [m[4], m[0] + m[4], m[2] + m[4], m[0] + m[2] + m[4]]
    const ys = [m[5], m[1] + m[5], m[3] + m[5], m[1] + m[3] + m[5]]
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    const w = Math.max(...xs) - x
    const h = Math.max(...ys) - y
    if (w < 24 || h < 24) continue
    const data = (f.id ? await getObj(page, f.id) : f.inline) as Parameters<typeof imageToPng>[0] | null
    if (!data) continue
    const png = await imageToPng(data).catch(() => null)
    if (png) out.push({ page: index, x, y, w, h, png })
  }
  return out
}

export async function extractForWord(file: File, onProgress?: (done: number, total: number) => void, opts: { images?: boolean } = {}) {
  const doc: PDFDocumentProxy = await openPdf(await file.arrayBuffer(), undefined, { fontExtraProperties: true })
  try {
    const pages: PageInfo[] = []
    const texts: TextFrag[] = []
    const images: ImageFrag[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      pages.push({ width: vp.width, height: vp.height })
      // La lista de operadores carga las fuentes (negrita/cursiva) y las imágenes.
      if (opts.images !== false) images.push(...(await pageImages(page, n - 1, vp.transform)))
      // Sin imágenes igual hace falta la lista de operadores: carga las fuentes (negrita).
      else await page.getOperatorList()
      const content = await page.getTextContent()
      const fonts = new Map<string, FontInfo | null>()
      for (const item of content.items) {
        if (!('str' in item) || !item.str) continue
        const m = Util.transform(vp.transform, item.transform)
        // Solo texto horizontal; el texto girado o vertical rompería las líneas.
        if (Math.abs(m[1]) > 0.01 * Math.abs(m[0]) || m[0] <= 0) continue
        if (!fonts.has(item.fontName)) fonts.set(item.fontName, await getObj<FontInfo>(page, item.fontName))
        const font = fonts.get(item.fontName)
        const size = Math.hypot(m[2], m[3])
        texts.push({
          page: n - 1,
          str: item.str,
          x: m[4],
          y: m[5],
          w: item.width,
          size: Math.round(size * 2) / 2,
          bold: !!(font?.bold || font?.black || BOLD.test(font?.name ?? '')),
          italic: !!(font?.italic || ITALIC.test(font?.name ?? '')),
          family: font?.isMonospace ? 'mono' : font?.isSerifFont ? 'serif' : familyOf(font?.name ?? font?.fallbackName ?? content.styles[item.fontName]?.fontFamily),
          font: cleanFontName(font?.name),
        })
      }
      page.cleanup()
      onProgress?.(n, doc.numPages)
    }
    return { pages, texts, images }
  } finally {
    await closePdf(doc)
  }
}
