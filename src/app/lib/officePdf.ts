/**
 * Diagramación de documentos a PDF con pdf-lib (Word y Excel a PDF): cortes de
 * línea por palabra, títulos, listas, tablas con encabezado repetido en cada
 * página, imágenes y saltos de página. Recibe un modelo simple, independiente
 * de cómo se leyó el archivo.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'

export type ORun = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; size?: number }
export type OStyle = 'title' | 'h1' | 'h2' | 'h3' | 'normal'
export type OList = { ordered: boolean; level: number; index: number }
export type OPara = { kind: 'para'; runs: ORun[]; style?: OStyle; align?: 'left' | 'center' | 'right'; list?: OList }
export type OTable = { kind: 'table'; rows: OPara[][][]; header?: boolean; title?: string }
export type OImage = { kind: 'image'; data: Uint8Array; type: 'png' | 'jpg'; width: number; height: number; align?: 'left' | 'center' }
export type OBlock = OPara | OTable | OImage | { kind: 'pagebreak' }
export type LayoutOptions = { pageSize?: [number, number]; margin?: number; family?: 'sans' | 'serif'; baseSize?: number; title?: string }

const STYLE_SIZE: Record<OStyle, number> = { title: 2.2, h1: 1.65, h2: 1.3, h3: 1.12, normal: 1 }
const A4: [number, number] = [595.28, 841.89]

/** Las fuentes estándar de PDF solo codifican WinAnsi (latín): lo demás se quita. */
export const winAnsi = (s: string) =>
  s.replace(/\t/g, '    ').replace(/[^\x20-\x7E\xA0-\xFF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, '')

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }
type Token = { text: string; font: PDFFont; size: number; underline: boolean; width: number; space: boolean }
type Line = { tokens: Token[]; width: number; height: number }

const fontOf = (f: Fonts, r: ORun) => (r.bold && r.italic ? f.boldItalic : r.bold ? f.bold : r.italic ? f.italic : f.regular)

/** Divide el texto en palabras y espacios con su fuente y ancho; "\n" fuerza un salto. */
export function tokenize(runs: ORun[], fonts: Fonts, baseSize: number): Array<Token | 'br'> {
  const out: Array<Token | 'br'> = []
  for (const r of runs) {
    const font = fontOf(fonts, r)
    const size = r.size ?? baseSize
    r.text.split('\n').forEach((part, i) => {
      if (i > 0) out.push('br')
      for (const piece of winAnsi(part).split(/(\s+)/)) {
        if (!piece) continue
        const space = /^\s+$/.test(piece)
        const text = space ? ' ' : piece
        out.push({ text, font, size, underline: !!r.underline, width: font.widthOfTextAtSize(text, size), space })
      }
    })
  }
  return out
}

/** Corta en líneas que caben en `width`; una palabra más larga que la línea se parte por letras. */
export function wrap(tokens: Array<Token | 'br'>, width: number, lineHeight: number): Line[] {
  const lines: Line[] = []
  let cur: Line = { tokens: [], width: 0, height: 0 }
  const push = () => {
    while (cur.tokens.length && cur.tokens[cur.tokens.length - 1].space) cur.width -= cur.tokens.pop()!.width
    lines.push(cur)
    cur = { tokens: [], width: 0, height: 0 }
  }
  const add = (t: Token) => {
    cur.tokens.push(t)
    cur.width += t.width
    cur.height = Math.max(cur.height, t.size * lineHeight)
  }
  for (const t of tokens) {
    if (t === 'br') {
      if (!cur.height) cur.height = lineHeight * 10
      push()
      continue
    }
    if (t.space && !cur.tokens.length) continue
    if (cur.width + t.width <= width || (t.space && cur.tokens.length)) {
      add(t)
      continue
    }
    if (cur.tokens.length) push()
    if (t.width <= width) add(t)
    else {
      // Palabra enorme (una URL, un número largo): se corta donde llegue.
      let rest = t.text
      while (rest) {
        let n = rest.length
        while (n > 1 && t.font.widthOfTextAtSize(rest.slice(0, n), t.size) > width) n--
        const text = rest.slice(0, n)
        add({ ...t, text, width: t.font.widthOfTextAtSize(text, t.size) })
        rest = rest.slice(n)
        if (rest) push()
      }
    }
  }
  if (cur.tokens.length || !lines.length) {
    if (!cur.height) cur.height = (tokens.find((x): x is Token => x !== 'br')?.size ?? 10) * lineHeight
    push()
  }
  return lines
}

export async function layoutPdf(blocks: OBlock[], opts: LayoutOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  if (opts.title) doc.setTitle(opts.title)
  const serif = opts.family === 'serif'
  const fonts: Fonts = {
    regular: await doc.embedFont(serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica),
    bold: await doc.embedFont(serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold),
    italic: await doc.embedFont(serif ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(serif ? StandardFonts.TimesRomanBoldItalic : StandardFonts.HelveticaBoldOblique),
  }
  const [W, H] = opts.pageSize ?? A4
  const margin = opts.margin ?? 56
  const base = opts.baseSize ?? 11
  const contentW = W - 2 * margin
  let page: PDFPage = doc.addPage([W, H])
  let y = H - margin
  const newPage = () => {
    page = doc.addPage([W, H])
    y = H - margin
  }
  const ensure = (h: number) => {
    if (y - h < margin && y < H - margin) newPage()
  }

  const drawLine = (line: Line, x: number, width: number, align: OPara['align']) => {
    let cx = x + (align === 'center' ? (width - line.width) / 2 : align === 'right' ? width - line.width : 0)
    const baseline = y - line.height * 0.78
    for (const t of line.tokens) {
      if (!t.space) page.drawText(t.text, { x: cx, y: baseline, size: t.size, font: t.font, color: rgb(0.1, 0.1, 0.1) })
      if (t.underline) page.drawLine({ start: { x: cx, y: baseline - 1.5 }, end: { x: cx + t.width, y: baseline - 1.5 }, thickness: 0.6, color: rgb(0.1, 0.1, 0.1) })
      cx += t.width
    }
  }

  /** Líneas de un párrafo ya cortadas al ancho, con el prefijo de lista si corresponde. */
  const paraLines = (p: OPara, width: number) => {
    const style = p.style ?? 'normal'
    const size = base * STYLE_SIZE[style]
    const runs = style === 'normal' ? p.runs : p.runs.map((r) => ({ ...r, bold: true, size: r.size ?? size }))
    const indent = p.list ? 18 * (p.list.level + 1) : 0
    const lines = wrap(tokenize(runs, fonts, size), width - indent, 1.3)
    return { lines, indent, size }
  }

  const drawPara = (p: OPara) => {
    const { lines, indent, size } = paraLines(p, contentW)
    const before = p.style && p.style !== 'normal' ? size * 0.6 : 0
    if (before && y < H - margin) y -= before
    lines.forEach((line, i) => {
      // Un título no queda solo al final de la página.
      ensure(line.height + (i === 0 && p.style && p.style !== 'normal' ? base * 2.6 : 0))
      if (i === 0 && p.list) {
        const marker = p.list.ordered ? `${p.list.index}.` : '•'
        const mx = margin + indent - (p.list.ordered ? fonts.regular.widthOfTextAtSize(marker, base) + 4 : 10)
        page.drawText(marker, { x: mx, y: y - line.height * 0.78, size: base, font: fonts.regular, color: rgb(0.1, 0.1, 0.1) })
      }
      drawLine(line, margin + indent, contentW - indent, p.list ? 'left' : p.align)
      y -= line.height
    })
    y -= base * 0.55
  }

  const drawTable = (t: OTable) => {
    if (t.title) drawPara({ kind: 'para', runs: [{ text: t.title }], style: 'h2' })
    const cols = Math.max(1, ...t.rows.map((r) => r.length))
    // Anchos proporcionales al texto más largo de cada columna (con mínimo y máximo).
    const longest = Array.from({ length: cols }, (_, c) =>
      Math.max(3, ...t.rows.map((r) => Math.min(40, (r[c] ?? []).reduce((n, p) => n + p.runs.reduce((m, x) => m + x.text.length, 0), 0)))),
    )
    const total = longest.reduce((a, b) => a + b, 0)
    const pad = 4
    // Cada columna mide al menos su palabra más ancha (así un monto no se parte);
    // el ancho que sobra se reparte en proporción al texto.
    const minW = Array.from({ length: cols }, (_, c) => {
      const words = t.rows.flatMap((r) =>
        (r[c] ?? []).flatMap((p) => tokenize(p.runs, fonts, base * STYLE_SIZE[p.style ?? 'normal'])),
      )
      const widest = Math.max(0, ...words.map((w) => (w === 'br' || w.space ? 0 : w.width)))
      return Math.min(contentW / cols, widest + 2 * pad + 1)
    })
    const spare = contentW - minW.reduce((a, b) => a + b, 0)
    const widths = minW.map((m, c) => m + (spare * longest[c]) / total)
    const cellLines = (row: OPara[][]) =>
      widths.map((w, c) => (row[c] ?? []).flatMap((p) => paraLines({ ...p, list: undefined }, w - 2 * pad).lines))
    const rowHeight = (lines: Line[][]) => Math.max(base * 1.3, ...lines.map((ls) => ls.reduce((h, l) => h + l.height, 0))) + 2 * pad
    const drawRow = (row: OPara[][], shade: boolean) => {
      const lines = cellLines(row)
      const h = rowHeight(lines)
      if (y - h < margin && y < H - margin) {
        newPage()
        if (t.header && row !== t.rows[0]) drawRow(t.rows[0], true)
      }
      let x = margin
      widths.forEach((w, c) => {
        page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: rgb(0.55, 0.55, 0.55), borderWidth: 0.6, color: shade ? rgb(0.93, 0.94, 0.96) : undefined })
        const saved = y
        y -= pad
        for (const l of lines[c]) {
          drawLine(l, x + pad, w - 2 * pad, (row[c]?.[0]?.align) ?? 'left')
          y -= l.height
        }
        y = saved
        x += w
      })
      y -= h
    }
    t.rows.forEach((row, i) => drawRow(row, !!t.header && i === 0))
    y -= base * 0.8
  }

  const drawImage = async (img: OImage) => {
    const embedded = img.type === 'png' ? await doc.embedPng(img.data) : await doc.embedJpg(img.data)
    // Pixeles a puntos (96 ppp), sin pasar del ancho ni del alto útil.
    let w = img.width * 0.75
    let h = img.height * 0.75
    const k = Math.min(1, contentW / w, (H - 2 * margin) / h)
    w *= k
    h *= k
    ensure(h)
    const x = img.align === 'center' ? margin + (contentW - w) / 2 : margin
    page.drawImage(embedded, { x, y: y - h, width: w, height: h })
    y -= h + base * 0.6
  }

  for (const b of blocks) {
    if (b.kind === 'para') drawPara(b)
    else if (b.kind === 'table') drawTable(b)
    else if (b.kind === 'image') await drawImage(b)
    else if (y < H - margin) newPage()
  }
  return doc.save()
}
