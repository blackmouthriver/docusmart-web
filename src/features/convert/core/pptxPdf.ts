/**
 * PowerPoint a PDF (W-114): dibuja con pdf-lib el modelo de pptxRead.ts, una página por
 * diapositiva del mismo tamaño. Texto con las fuentes estándar de PDF (latín; lo demás se
 * omite, como en Word a PDF), ajustado al ancho de cada cuadro.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import { winAnsi } from './officePdf'
import type { PDeck, PImage, PItem, PPara, PRun, PTable, PText } from './pptxRead'

const EMU_PER_PT = 12700
const pt = (emu: number) => emu / EMU_PER_PT

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }
const fontOf = (f: Fonts, r: PRun) => (r.bold && r.italic ? f.boldItalic : r.bold ? f.bold : r.italic ? f.italic : f.regular)

export function hexColor(hex: string) {
  const n = parseInt(/^[0-9a-f]{6}$/i.test(hex) ? hex : '000000', 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

type Word = { text: string; font: PDFFont; size: number; color: string; underline: boolean; width: number; space: boolean }
type Line = { words: Word[]; width: number; size: number }

/** Corta un párrafo en líneas que caben en `width`; una palabra más larga se parte por letras. */
export function layoutParagraph(p: PPara, fonts: Fonts, width: number): Line[] {
  const lines: Line[] = []
  const base = p.runs.find((r) => r.text.trim())?.size ?? p.runs[0]?.size ?? 18
  let cur: Line = { words: [], width: 0, size: 0 }
  const push = () => {
    while (cur.words.length && cur.words[cur.words.length - 1].space) cur.width -= cur.words.pop()!.width
    lines.push({ ...cur, size: cur.size || base })
    cur = { words: [], width: 0, size: 0 }
  }
  const add = (w: Word) => {
    if (w.space && !cur.words.length) return
    if (!w.space && cur.width + w.width > width && cur.words.length) push()
    if (!w.space && w.width > width) {
      // Palabra más larga que el cuadro: se parte.
      let piece = ''
      for (const ch of w.text) {
        const test = piece + ch
        if (w.font.widthOfTextAtSize(test, w.size) > width && piece) {
          cur.words.push({ ...w, text: piece, width: w.font.widthOfTextAtSize(piece, w.size) })
          cur.size = Math.max(cur.size, w.size)
          push()
          piece = ch
        } else piece = test
      }
      w = { ...w, text: piece, width: w.font.widthOfTextAtSize(piece, w.size) }
    }
    cur.words.push(w)
    cur.width += w.width
    cur.size = Math.max(cur.size, w.size)
  }
  for (const r of p.runs) {
    const font = fontOf(fonts, r)
    r.text.split('\n').forEach((part, i) => {
      if (i > 0) push()
      for (const piece of winAnsi(part).split(/(\s+)/)) {
        if (!piece) continue
        const space = /^\s+$/.test(piece)
        const text = space ? ' ' : piece
        add({ text, font, size: r.size, color: r.color, underline: r.underline, width: font.widthOfTextAtSize(text, r.size), space })
      }
    })
  }
  if (cur.words.length || !lines.length) push()
  return lines
}

const LINE = 1.2
const indentOf = (p: PPara, size: number) => (p.bullet ? size * 1.1 : 0) + p.level * 24

function drawParas(page: PDFPage, fonts: Fonts, paras: PPara[], box: { x: number; top: number; w: number; h: number }, anchor: PText['anchor'], pageH: number) {
  const laid = paras.map((p) => {
    const size = p.runs.find((r) => r.text.trim())?.size ?? p.runs[0]?.size ?? 18
    const indent = indentOf(p, size)
    return { p, size, indent, lines: layoutParagraph(p, fonts, Math.max(10, box.w - indent)) }
  })
  const gap = (s: number) => s * 0.25
  const total = laid.reduce((h, l) => h + l.lines.reduce((a, ln) => a + ln.size * LINE, 0) + gap(l.size), 0)
  let y = box.top + (anchor === 'ctr' ? Math.max(0, (box.h - total) / 2) : anchor === 'b' ? Math.max(0, box.h - total) : 0)
  for (const { p, size, indent, lines } of laid) {
    lines.forEach((ln, li) => {
      const baseline = y + ln.size * 0.95
      const avail = box.w - indent
      let x = box.x + indent + (p.align === 'ctr' ? (avail - ln.width) / 2 : p.align === 'r' ? avail - ln.width : 0)
      if (li === 0 && p.bullet) {
        const first = ln.words.find((w) => !w.space)
        const bullet = winAnsi(p.bullet.length === 1 && !/[\x20-\x7E\xA0-\xFF•–—]/.test(p.bullet) ? '•' : p.bullet) || '•'
        page.drawText(bullet, { x: box.x + p.level * 24, y: pageH - baseline, size: size * 0.9, font: fonts.regular, color: hexColor(first?.color ?? '000000') })
      }
      for (const w of ln.words) {
        if (!w.space) {
          page.drawText(w.text, { x, y: pageH - baseline, size: w.size, font: w.font, color: hexColor(w.color) })
          if (w.underline) page.drawLine({ start: { x, y: pageH - baseline - w.size * 0.12 }, end: { x: x + w.width, y: pageH - baseline - w.size * 0.12 }, thickness: Math.max(0.5, w.size / 18), color: hexColor(w.color) })
        }
        x += w.width
      }
      y += ln.size * LINE
    })
    y += gap(size)
  }
}

async function embed(doc: PDFDocument, img: PImage, cache: Map<Uint8Array, Awaited<ReturnType<PDFDocument['embedPng']>>>) {
  let e = cache.get(img.data)
  if (!e) {
    e = img.type === 'png' ? await doc.embedPng(img.data) : await doc.embedJpg(img.data)
    cache.set(img.data, e)
  }
  return e
}

function drawText(page: PDFPage, fonts: Fonts, t: PText, pageH: number) {
  const x = pt(t.x)
  const y = pt(t.y)
  const w = pt(t.w)
  const h = pt(t.h)
  if (t.fill || t.line) {
    const color = t.fill ? hexColor(t.fill) : undefined
    const borderColor = t.line ? hexColor(t.line) : undefined
    if (t.shape === 'ellipse') page.drawEllipse({ x: x + w / 2, y: pageH - y - h / 2, xScale: w / 2, yScale: h / 2, color, borderColor, borderWidth: t.line ? 1 : 0 })
    else page.drawRectangle({ x, y: pageH - y - h, width: w, height: h, color, borderColor, borderWidth: t.line ? 1 : 0 })
  }
  const ins = t.insets
  drawParas(page, fonts, t.paras, { x: x + pt(ins.l), top: y + pt(ins.t), w: Math.max(1, w - pt(ins.l) - pt(ins.r)), h: Math.max(1, h - pt(ins.t) - pt(ins.b)) }, t.anchor, pageH)
}

function drawTable(page: PDFPage, fonts: Fonts, t: PTable, pageH: number) {
  const totalW = t.cols.reduce((a, b) => a + b, 0) || t.w
  const kx = t.w / totalW
  let y = pt(t.y)
  for (const row of t.rows) {
    // La fila crece si su texto no cabe.
    const heights = row.cells.map((cell, ci) => {
      const w = pt((t.cols[ci] ?? 0) * kx) - 10
      return cell.paras.reduce((h, p) => h + layoutParagraph(p, fonts, Math.max(10, w)).reduce((a, l) => a + l.size * LINE, 0), 0) + 8
    })
    const h = Math.max(pt(row.h), ...heights)
    let x = pt(t.x)
    row.cells.forEach((cell, ci) => {
      const w = pt((t.cols[ci] ?? 0) * kx)
      page.drawRectangle({ x, y: pageH - y - h, width: w, height: h, color: cell.fill ? hexColor(cell.fill) : undefined, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.75 })
      drawParas(page, fonts, cell.paras, { x: x + 5, top: y + 4, w: Math.max(1, w - 10), h: h - 8 }, 't', pageH)
      x += w
    })
    y += h
  }
}

/** El PDF de la presentación: una página por diapositiva visible. */
export async function deckToPdf(deck: PDeck, title = 'DocuSmart'): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setProducer('DocuSmart')
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  }
  const W = pt(deck.width)
  const H = pt(deck.height)
  const cache = new Map<Uint8Array, Awaited<ReturnType<PDFDocument['embedPng']>>>()
  for (const s of deck.slides) {
    const page = doc.addPage([W, H])
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hexColor(s.background) })
    const draw = async (it: PItem) => {
      if (it.kind === 'image') {
        const e = await embed(doc, it, cache)
        page.drawImage(e, { x: pt(it.x), y: H - pt(it.y) - pt(it.h), width: pt(it.w), height: pt(it.h) })
      } else if (it.kind === 'table') drawTable(page, fonts, it, H)
      else drawText(page, fonts, it, H)
    }
    if (s.backgroundImage) await draw(s.backgroundImage)
    for (const it of s.items) await draw(it)
  }
  return doc.save()
}
