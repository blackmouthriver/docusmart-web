// Extracción para "PDF a Word" con pdf.js: texto con su fuente y posición, e
// imágenes con su lugar en la página. Necesita el canvas del navegador para
// las imágenes, así que queda excluido de la cobertura como los demás *Sources.ts.
import { ImageKind, OPS, Util, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist'
import { canvasToBlob, closePdf, openPdf } from '../../../shared/pdf/pdf'
import { cleanFontName, matchDrawn, untrack, type ColorRun, type Family, type ImageFrag, type PageInfo, type RectFrag, type TextFrag } from '../core/pdfWord'

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

/** Caja (en coordenadas de la página vista) de un rectángulo del espacio de usuario. */
function box(viewport: Matrix, ctm: Matrix, x0: number, y0: number, x1: number, y1: number) {
  const m = Util.transform(viewport, ctm)
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

/**
 * Una pasada por la lista de operadores: imágenes, rectángulos rellenos (fondos, franjas de
 * color) y el color con que se escribe cada texto (en el orden en que se dibuja).
 */
async function pageGraphics(page: PDFPageProxy, index: number, viewport: Matrix, withImages: boolean, pageWidth: number, pageHeight: number): Promise<{ images: ImageFrag[]; rects: RectFrag[]; colors: ColorRun[] }> {
  const ops = await page.getOperatorList()
  const found: Array<{ id: string | null; inline: unknown; ctm: Matrix }> = []
  const rects: RectFrag[] = []
  const colors: ColorRun[] = []
  type Box = { x: number; y: number; w: number; h: number }
  // Estado gráfico: matriz, color de relleno, opacidad y recorte (en coordenadas de la página).
  // `group`: opacidad de los grupos que lo contienen (un grupo al 5 % aclara todo lo de adentro).
  type State = { ctm: Matrix; fill: string; alpha: number; group: number; clip: Box | null }
  let st: State = { ctm: [1, 0, 0, 1, 0, 0], fill: '#000000', alpha: 1, group: 1, clip: null }
  const stack: State[] = []
  const intersect = (a: Box, b: Box | null): Box => {
    if (!b) return a
    const x = Math.max(a.x, b.x)
    const y = Math.max(a.y, b.y)
    return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) }
  }
  const bboxOf = (mm: unknown) => {
    const m = mm as ArrayLike<number> | undefined
    return m && m.length >= 4 && Number.isFinite(m[0]) && Number.isFinite(m[2]) ? box(viewport, st.ctm, m[0], m[1], m[2], m[3]) : null
  }
  const FILLS = new Set<number>([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke])
  // Fondo de la página (un relleno que la cubre entera), para mezclar los colores semitransparentes.
  let base = [255, 255, 255]
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i] as unknown[]
    if (fn === OPS.save) stack.push({ ...st })
    else if (fn === OPS.restore) st = stack.pop() ?? st
    else if (fn === OPS.beginGroup) {
      stack.push({ ...st })
      st.group *= st.alpha
      st.alpha = 1
    } else if (fn === OPS.endGroup) st = stack.pop() ?? st
    else if (fn === OPS.paintFormXObjectBegin) {
      // Un formulario (grupo de dibujo) con su propia matriz y su caja de recorte.
      stack.push({ ...st })
      st.group *= st.alpha
      st.alpha = 1
      if (Array.isArray(args[0]) && args[0].length === 6) st.ctm = Util.transform(st.ctm, args[0] as Matrix)
      const b = bboxOf(args[1])
      if (b) st.clip = intersect(b, st.clip)
    } else if (fn === OPS.paintFormXObjectEnd) st = stack.pop() ?? st
    else if (fn === OPS.transform) st.ctm = Util.transform(st.ctm, args as Matrix)
    else if (fn === OPS.setFillRGBColor && typeof args[0] === 'string') st.fill = args[0]
    else if (fn === OPS.setGState && Array.isArray(args[0])) {
      for (const [k, v] of args[0] as Array<[string, unknown]>) if (k === 'ca' && typeof v === 'number') st.alpha = v
    } else if (fn === OPS.showText && Array.isArray(args[0])) {
      // Un desplazamiento grande dentro del texto (TJ) hace de espacio entre palabras.
      const text = (args[0] as Array<{ unicode?: string } | number | null>).map((g) => (g && typeof g === 'object' ? (g.unicode ?? '') : typeof g === 'number' && Math.abs(g) > 180 ? ' ' : '')).join('')
      if (text) colors.push({ color: st.fill.slice(1).toUpperCase(), text })
    } else if (fn === OPS.constructPath && args[0] === OPS.endPath) {
      // Trazado de recorte (W n): lo que se dibuje después solo se ve dentro de él.
      const b = bboxOf(args[2])
      if (b) st.clip = intersect(b, st.clip)
    } else if (fn === OPS.constructPath && FILLS.has(args[0] as number)) {
      // [operación, [trazado], [minX, minY, maxX, maxY]]: basta la caja del trazado, recortada.
      const raw = bboxOf(args[2])
      const alpha = st.alpha * st.group
      if (!raw || alpha < 0.02) continue
      const b = intersect(raw, st.clip)
      if (b.w < 2 || b.h < 2) continue
      // Semitransparente: el color que se ve sobre el fondo de la página.
      const rgbOf = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
      const c = rgbOf(st.fill).map((v, k) => Math.round(v * alpha + base[k] * (1 - alpha)))
      const hex = c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
      if (b.w >= pageWidth * 0.95 && b.h >= pageHeight * 0.95) base = c
      rects.push({ page: index, ...b, color: hex })
    } else if (withImages && fn === OPS.paintImageXObject) found.push({ id: args[0] as string, inline: null, ctm: st.ctm })
    else if (withImages && fn === OPS.paintInlineImageXObject) found.push({ id: null, inline: args[0], ctm: st.ctm })
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
  return { images: out, rects, colors }
}

export async function extractForWord(file: File, onProgress?: (done: number, total: number) => void, opts: { images?: boolean } = {}) {
  const doc: PDFDocumentProxy = await openPdf(await file.arrayBuffer(), undefined, { fontExtraProperties: true })
  try {
    const pages: PageInfo[] = []
    const texts: TextFrag[] = []
    const images: ImageFrag[] = []
    const rects: RectFrag[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      pages.push({ width: vp.width, height: vp.height })
      // La lista de operadores carga las fuentes (negrita/cursiva) y da imágenes, fondos y colores.
      const g = await pageGraphics(page, n - 1, vp.transform, opts.images !== false, vp.width, vp.height)
      images.push(...g.images)
      rects.push(...g.rects)
      const content = await page.getTextContent()
      const drawn = matchDrawn(content.items.map((it) => ('str' in it ? it.str : '')), g.colors)
      const fonts = new Map<string, FontInfo | null>()
      for (const [k, item] of content.items.entries()) {
        if (!('str' in item) || !item.str) continue
        const m = Util.transform(vp.transform, item.transform)
        // Solo texto horizontal; el texto girado o vertical rompería las líneas.
        if (Math.abs(m[1]) > 0.01 * Math.abs(m[0]) || m[0] <= 0) continue
        if (!fonts.has(item.fontName)) fonts.set(item.fontName, await getObj<FontInfo>(page, item.fontName))
        const font = fonts.get(item.fontName)
        const size = Math.hypot(m[2], m[3])
        const tracked = untrack(item.str, drawn[k]?.text, item.width, size)
        texts.push({
          page: n - 1,
          str: tracked?.str ?? item.str,
          x: m[4],
          y: m[5],
          w: item.width,
          size: Math.round(size * 2) / 2,
          bold: !!(font?.bold || font?.black || BOLD.test(font?.name ?? '')),
          italic: !!(font?.italic || ITALIC.test(font?.name ?? '')),
          family: font?.isMonospace ? 'mono' : font?.isSerifFont ? 'serif' : familyOf(font?.name ?? font?.fallbackName ?? content.styles[item.fontName]?.fontFamily),
          font: cleanFontName(font?.name),
          color: drawn[k]?.color,
          spacing: tracked?.spacing || undefined,
        })
      }
      page.cleanup()
      onProgress?.(n, doc.numPages)
    }
    return { pages, texts, images, rects }
  } finally {
    await closePdf(doc)
  }
}
