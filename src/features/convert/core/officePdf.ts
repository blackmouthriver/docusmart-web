/**
 * Diagramación de documentos a PDF con pdf-lib (Word y Excel a PDF, hoja de vida, cobros,
 * apuntes): cortes de línea por palabra, títulos, listas, tablas con encabezado repetido en cada
 * página, imágenes y saltos de página. Recibe un modelo simple, independiente de cómo se leyó el
 * archivo.
 *
 * Los campos opcionales (color, resaltado, espaciado, sangrías, márgenes, encabezado y pie…) los
 * llena el lector de Word (docxRead.ts) para que el PDF se parezca al documento original; los
 * demás generadores no los usan y quedan como antes.
 */
import { PDFDocument, PDFFont, PDFPage, rgb, setCharacterSpacing, type RGB } from 'pdf-lib'
import { loadFonts, type FontFamily, type FontSet, type FontStyle } from '../../../shared/pdf/pdfFonts'

export type ORun = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  size?: number
  /** Color del texto, "RRGGBB". */
  color?: string
  strike?: boolean
  script?: 'sup' | 'sub'
  /** Color de resaltado, "RRGGBB". */
  highlight?: string
  family?: FontFamily
  /** Número de página o total de páginas (encabezados y pies). */
  field?: 'page' | 'pages'
  /** Espacio extra entre letras, en puntos. */
  spacing?: number
}
export type OStyle = 'title' | 'h1' | 'h2' | 'h3' | 'normal'
/** `marker`: el texto de la viñeta o del número tal como se ve ("a)", "iii.", "•"). */
export type OList = { ordered: boolean; level: number; index: number; marker?: string }
export type OLineSpacing = { auto: number } | { exact: number } | { atLeast: number }
export type OPara = {
  kind: 'para'
  runs: ORun[]
  style?: OStyle
  align?: 'left' | 'center' | 'right' | 'justify'
  list?: OList
  /** Tamaños, negrita y espacios tal como vienen (sin los del estilo). */
  exact?: boolean
  /** Espacio antes y después, en puntos. */
  spaceBefore?: number
  spaceAfter?: number
  line?: OLineSpacing
  /** Sangrías en puntos; `firstLine` negativa es sangría francesa. */
  indent?: { left?: number; right?: number; firstLine?: number }
  keepNext?: boolean
  pageBreakBefore?: boolean
  /** Imagen dentro de una celda de tabla (en el cuerpo las imágenes van como bloque). */
  image?: OImage
  /** Fondo del párrafo, "RRGGBB" (de margen a margen). */
  shade?: string
}
/** Formato de una celda: fondo, cuántas columnas ocupa y si continúa la celda de arriba (combinada). */
export type OCell = { fill?: string; span?: number; merged?: boolean }
export type OTable = {
  kind: 'table'
  rows: OPara[][][]
  header?: boolean
  title?: string
  /** Ancho de cada columna de la cuadrícula, en puntos. */
  widths?: number[]
  cells?: Array<Array<OCell | undefined>>
  /** false: sin bordes (tablas usadas para acomodar el contenido). */
  borders?: boolean
  /** Márgenes de las celdas (horizontal y vertical), en puntos. Sin esto: 4 y 4, con alto mínimo de fila. */
  pad?: { x: number; y: number }
  /** Alto mínimo de cada fila, en puntos. */
  rowHeights?: Array<number | undefined>
}
export type OImage = { kind: 'image'; data: Uint8Array; type: 'png' | 'jpg'; width: number; height: number; align?: 'left' | 'center' | 'right' }
export type OMargins = { top: number; right: number; bottom: number; left: number }
/** Página de una sección de Word: tamaño, márgenes, encabezado y pie (W-146.7). */
export type OPageSetup = { pageSize: [number, number]; margins: OMargins; header: OBlock[]; footer: OBlock[]; headerDistance: number; footerDistance: number }
/** `setup`: un salto de sección; las páginas que siguen usan esa página. */
export type OBlock = OPara | OTable | OImage | { kind: 'pagebreak'; setup?: OPageSetup }
export type LayoutOptions = {
  pageSize?: [number, number]
  margin?: number
  margins?: OMargins
  family?: FontFamily
  baseSize?: number
  title?: string
  header?: OBlock[]
  footer?: OBlock[]
  /** Distancia del borde de la hoja al encabezado y al pie, en puntos. */
  headerDistance?: number
  footerDistance?: number
}

const STYLE_SIZE: Record<OStyle, number> = { title: 2.2, h1: 1.65, h2: 1.3, h3: 1.12, normal: 1 }
const A4: [number, number] = [595.28, 841.89]
const INK = '1A1A1A'
/** Alto de una línea "sencilla" de Word según la fuente (Calibri/Carlito, Times/Tinos, Courier/Cousine). */
const WORD_SINGLE: Record<FontFamily, number> = { sans: 1.22, serif: 1.15, mono: 1.133 }

type Token = {
  text: string
  font: PDFFont
  size: number
  underline: boolean
  width: number
  space: boolean
  color?: string
  strike?: boolean
  highlight?: string
  /** Desplazamiento de la línea base (superíndice y subíndice). */
  rise?: number
  spacing?: number
  field?: 'page' | 'pages'
}
type Line = { tokens: Token[]; width: number; height: number }
type Pick = (family?: FontFamily) => FontSet

export const styleOf = (r: { bold?: boolean; italic?: boolean }): FontStyle => (r.bold && r.italic ? 'boldItalic' : r.bold ? 'bold' : r.italic ? 'italic' : 'regular')

export function hexRgb(hex: string | undefined, fallback = INK): RGB {
  const h = hex && /^[0-9a-f]{6}$/i.test(hex) ? hex : fallback
  const n = parseInt(h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/**
 * Divide el texto en palabras y espacios con su fuente y ancho; "\n" fuerza un salto. El chino y
 * el japonés van carácter por carácter (ahí se puede cortar la línea) con su propia fuente.
 */
export function tokenize(runs: ORun[], fonts: FontSet | Pick, baseSize: number): Array<Token | 'br'> {
  const pick: Pick = typeof fonts === 'function' ? fonts : () => fonts
  const out: Array<Token | 'br'> = []
  for (const r of runs) {
    const style = styleOf(r)
    const set = pick(r.family)
    const full = r.size ?? baseSize
    const size = r.script ? full * 0.65 : full
    const rise = r.script === 'sup' ? full * 0.33 : r.script === 'sub' ? -full * 0.14 : undefined
    const extra = { underline: !!r.underline, color: r.color, strike: r.strike || undefined, highlight: r.highlight, rise, spacing: r.spacing || undefined }
    const extraW = (text: string) => (r.spacing ? r.spacing * [...text].length : 0)
    if (r.field) {
      // Se mide con dos cifras y se reemplaza al dibujar.
      const font = set.font(style)
      out.push({ text: '99', font, size, width: font.widthOfTextAtSize('99', size), space: false, field: r.field, ...extra })
      continue
    }
    r.text.split('\n').forEach((part, i) => {
      if (i > 0) out.push('br')
      for (const p of set.pieces(part, style)) out.push({ text: p.text, font: p.font, size, width: p.font.widthOfTextAtSize(p.text, size) + extraW(p.text), space: p.space, ...extra })
    })
  }
  return out
}

/** Cada familia que usa el documento con su texto y sus estilos, para cargar solo esas fuentes. */
export function fontNeeds(paras: Iterable<OPara>, family: FontFamily): Map<FontFamily, { text: string[]; styles: Set<FontStyle> }> {
  const needs = new Map<FontFamily, { text: string[]; styles: Set<FontStyle> }>()
  const need = (f: FontFamily) => needs.get(f) ?? needs.set(f, { text: [], styles: new Set(['regular']) }).get(f)!
  need(family)
  for (const p of paras) {
    const forced = !p.exact && ((p.style && p.style !== 'normal') || p.list?.ordered)
    if (p.list?.marker) need(family).text.push(p.list.marker)
    if (forced) need(family).styles.add('bold')
    for (const r of p.runs) {
      const n = need(r.family ?? family)
      n.styles.add(styleOf(r))
      if (forced) n.styles.add(styleOf({ ...r, bold: true }))
      n.text.push(r.text)
    }
  }
  return needs
}

/** Todos los párrafos (también los de las tablas), con el título de cada tabla. */
function* allParas(blocks: OBlock[]): Generator<OPara> {
  for (const b of blocks) {
    if (b.kind === 'para') yield b
    else if (b.kind === 'table') {
      if (b.title) yield { kind: 'para', runs: [{ text: b.title, bold: true }] }
      for (const row of b.rows) for (const cell of row) yield* cell
    }
  }
}

/**
 * Corta en líneas que caben en `width` (la primera en `firstWidth`); una palabra más larga que la
 * línea se parte por letras. `emptySize`: tamaño de letra de un párrafo sin texto.
 */
export function wrap(tokens: Array<Token | 'br'>, width: number, lineHeight: number, firstWidth = width, emptySize?: number): Line[] {
  const lines: Line[] = []
  let cur: Line = { tokens: [], width: 0, height: 0 }
  const avail = () => (lines.length ? width : firstWidth)
  const fallback = () => (emptySize ?? tokens.find((x): x is Token => x !== 'br')?.size ?? 10) * lineHeight
  const push = () => {
    while (cur.tokens.length && cur.tokens[cur.tokens.length - 1].space) cur.width -= cur.tokens.pop()!.width
    lines.push(cur)
    cur = { tokens: [], width: 0, height: 0 }
  }
  const add = (t: Token) => {
    cur.tokens.push(t)
    cur.width += t.width
    cur.height = Math.max(cur.height, (t.rise ? t.size / 0.65 : t.size) * lineHeight)
  }
  for (const t of tokens) {
    if (t === 'br') {
      if (!cur.height) cur.height = emptySize ? emptySize * lineHeight : lineHeight * 10
      push()
      continue
    }
    if (t.space && !cur.tokens.length) continue
    if (cur.width + t.width <= avail() || (t.space && cur.tokens.length)) {
      add(t)
      continue
    }
    if (cur.tokens.length) push()
    if (t.width <= avail()) add(t)
    else {
      // Palabra enorme (una URL, un número largo): se corta donde llegue.
      let rest = t.text
      while (rest) {
        let n = rest.length
        while (n > 1 && t.font.widthOfTextAtSize(rest.slice(0, n), t.size) > avail()) n--
        const text = rest.slice(0, n)
        add({ ...t, text, width: t.font.widthOfTextAtSize(text, t.size) })
        rest = rest.slice(n)
        if (rest) push()
      }
    }
  }
  if (cur.tokens.length || !lines.length) {
    if (!cur.height) cur.height = fallback()
    push()
  }
  return lines
}

export async function layoutPdf(blocks: OBlock[], opts: LayoutOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  if (opts.title) doc.setTitle(opts.title)
  const family: FontFamily = opts.family ?? 'sans'
  const setups = blocks.flatMap((b) => (b.kind === 'pagebreak' && b.setup ? [b.setup] : []))
  const needs = fontNeeds([...allParas(blocks), ...allParas(opts.header ?? []), ...allParas(opts.footer ?? []), ...setups.flatMap((st) => [...allParas(st.header), ...allParas(st.footer)])], family)
  const sets = new Map<FontFamily, FontSet>()
  for (const [f, n] of needs) sets.set(f, await loadFonts(doc, f, n.styles, n.text.join('\n')))
  const pick: Pick = (f) => sets.get(f ?? family) ?? sets.get(family)!
  const main = pick()

  // Página de la sección actual (cambia en cada salto de sección de Word, W-146.7).
  let [W, H] = opts.pageSize ?? A4
  const m = opts.margin ?? 56
  let M: OMargins = opts.margins ?? { top: m, right: m, bottom: m, left: m }
  const base = opts.baseSize ?? 11
  let contentW = W - M.left - M.right
  let page!: PDFPage
  let y = 0
  // Arriba y abajo del cuerpo (el encabezado o el pie pueden empujarlos, como en Word).
  let top = H - M.top
  let bottom = M.bottom
  // Encabezado y pie: se dibujan en su lugar, sin saltos de página.
  let fixed = false
  type Decor = { header: OBlock[]; footer: OBlock[]; headerTop: number; footerBase: number; headerH: number; footerH: number }
  let decor: Decor = { header: [], footer: [], headerTop: 0, footerBase: 0, headerH: 0, footerH: 0 }
  /** El encabezado y el pie de cada página (de su sección). */
  const pageDecor: Decor[] = []
  const atTop = () => y >= top
  const newPage = () => {
    page = doc.addPage([W, H])
    pageDecor.push(decor)
    y = top
  }
  const ensure = (h: number) => {
    if (!fixed && y - h < bottom && !atTop()) newPage()
  }
  // Cada imagen se incrusta una sola vez (el logo del encabezado se repite en todas las hojas).
  const images = new Map<OImage, Awaited<ReturnType<PDFDocument['embedPng']>>>()
  const embed = async (img: OImage) => images.get(img) ?? images.set(img, img.type === 'png' ? await doc.embedPng(img.data) : await doc.embedJpg(img.data)).get(img)!
  // Número de página para los campos (se dibuja al final, cuando ya se sabe el total).
  let fieldValues = { page: 0, pages: 0 }

  const drawLine = (line: Line, x: number, width: number, align: OPara['align'], last = true) => {
    const spaces = line.tokens.filter((t) => t.space).length
    const justify = align === 'justify' && !last && spaces > 0 && line.width < width
    const gap = justify ? (width - line.width) / spaces : 0
    let cx = x + (align === 'center' ? (width - line.width) / 2 : align === 'right' ? width - line.width : 0)
    const baseline = y - line.height * 0.78
    for (const t of line.tokens) {
      const w = t.width + (t.space ? gap : 0)
      const color = hexRgb(t.color)
      if (t.highlight) page.drawRectangle({ x: cx, y: baseline - t.size * 0.24, width: w, height: t.size * 1.18, color: hexRgb(t.highlight) })
      if (!t.space) {
        const text = t.field ? String(fieldValues[t.field]) : t.text
        // Espaciado entre letras: el operador Tc del PDF (pdf-lib no lo expone en drawText).
        if (t.spacing) page.pushOperators(setCharacterSpacing(t.spacing))
        page.drawText(text, { x: cx, y: baseline + (t.rise ?? 0), size: t.size, font: t.font, color })
        if (t.spacing) page.pushOperators(setCharacterSpacing(0))
      }
      const th = Math.max(0.5, t.size / 18)
      if (t.underline) page.drawLine({ start: { x: cx, y: baseline - t.size * 0.13 }, end: { x: cx + w, y: baseline - t.size * 0.13 }, thickness: th, color })
      if (t.strike) page.drawLine({ start: { x: cx, y: baseline + t.size * 0.3 + (t.rise ?? 0) }, end: { x: cx + w, y: baseline + t.size * 0.3 + (t.rise ?? 0) }, thickness: th, color })
      cx += w
    }
  }

  /** Líneas de un párrafo ya cortadas al ancho, con sus sangrías. */
  const paraLines = (p: OPara, width: number) => {
    const style = p.style ?? 'normal'
    const size = base * STYLE_SIZE[style]
    const runs = p.exact || style === 'normal' ? p.runs : p.runs.map((r) => ({ ...r, bold: true, size: r.size ?? size }))
    if (p.exact) {
      const left = p.indent?.left ?? 0
      const right = p.indent?.right ?? 0
      // En una lista la viñeta va en la sangría francesa y el texto empieza en `left`.
      const first = p.list ? 0 : (p.indent?.firstLine ?? 0)
      const ls = p.line ?? { auto: 1 }
      const single = Math.max(...(p.runs.length ? p.runs : [{ text: '' }]).map((r: ORun) => WORD_SINGLE[r.family ?? family]))
      const lh = 'auto' in ls ? single * ls.auto : single
      const emptySize = p.runs[0]?.size ?? base
      const lines = wrap(tokenize(runs, pick, size), width - left - right, lh, width - left - right - first, emptySize)
      if ('exact' in ls) lines.forEach((l) => (l.height = ls.exact))
      else if ('atLeast' in ls) lines.forEach((l) => (l.height = Math.max(l.height, ls.atLeast)))
      return { lines, indent: left, first, right, size: emptySize }
    }
    const indent = p.list ? 18 * (p.list.level + 1) : 0
    const lines = wrap(tokenize(runs, pick, size), width - indent, 1.3)
    return { lines, indent, first: 0, right: 0, size }
  }

  const markerOf = (p: OPara) => {
    const list = p.list!
    const raw = list.marker ?? (list.ordered ? `${list.index}.` : '•')
    return main.printable(raw) || (list.ordered ? `${list.index}.` : '•')
  }

  const drawPara = (p: OPara) => {
    const { lines, indent, first, right, size } = paraLines(p, contentW)
    const heading = !!p.style && p.style !== 'normal'
    if (p.pageBreakBefore && !fixed && !atTop()) newPage()
    const before = p.spaceBefore ?? (heading ? size * 0.6 : 0)
    if (before && !atTop()) y -= before
    lines.forEach((line, i) => {
      if (p.shade) {
        ensure(line.height)
        page.drawRectangle({ x: M.left + indent, y: y - line.height, width: contentW - indent - right, height: line.height, color: hexRgb(p.shade) })
      }
      // Un título (o un párrafo que va con el siguiente) no queda solo al final de la página.
      ensure(line.height + (i === 0 && (heading || p.keepNext) ? base * 2.6 : 0))
      if (i === 0 && p.list) {
        const marker = markerOf(p)
        const markSize = p.exact ? (line.tokens[0]?.size ?? size) : base
        const mw = main.font().widthOfTextAtSize(marker, markSize)
        const hanging = p.exact ? -(p.indent?.firstLine ?? -18) : 0
        const mx = p.exact
          ? M.left + indent - Math.max(hanging, mw + 4)
          : M.left + indent - (p.list.ordered ? mw + 4 : 10)
        const color = p.exact ? line.tokens.find((t) => !t.space)?.color : undefined
        page.drawText(marker, { x: mx, y: y - line.height * 0.78, size: markSize, font: main.font(), color: hexRgb(color) })
      }
      const x = M.left + indent + (i === 0 ? first : 0)
      drawLine(line, x, contentW - indent - right - (i === 0 ? first : 0), p.list && !p.exact ? 'left' : p.align, i === lines.length - 1)
      y -= line.height
    })
    y -= p.spaceAfter ?? base * 0.55
  }

  const drawTable = async (t: OTable) => {
    if (t.title) drawPara({ kind: 'para', runs: [{ text: t.title }], style: 'h2' })
    const pad = t.pad?.x ?? 4
    const padY = t.pad?.y ?? 4
    const borders = t.borders ?? true
    const spanOf = (r: number, i: number) => Math.max(1, t.cells?.[r]?.[i]?.span ?? 1)
    const cols = Math.max(1, ...t.rows.map((row, r) => row.reduce((n, _, i) => n + spanOf(r, i), 0)), t.widths?.length ?? 0)
    let widths: number[]
    if (t.widths?.length) {
      // Anchos del documento; si no caben, se achican en proporción.
      const given = Array.from({ length: cols }, (_, c) => t.widths![c] ?? t.widths![t.widths!.length - 1])
      const sum = given.reduce((a, b) => a + b, 0)
      widths = given.map((w) => (sum > contentW ? (w * contentW) / sum : w))
    } else {
      // Anchos proporcionales al texto más largo de cada columna (con mínimo y máximo).
      const longest = Array.from({ length: cols }, (_, c) =>
        Math.max(3, ...t.rows.map((r) => Math.min(40, (r[c] ?? []).reduce((n, p) => n + p.runs.reduce((k, x) => k + x.text.length, 0), 0)))),
      )
      const total = longest.reduce((a, b) => a + b, 0)
      // Cada columna mide al menos su palabra más ancha (así un monto no se parte);
      // el ancho que sobra se reparte en proporción al texto.
      const minW = Array.from({ length: cols }, (_, c) => {
        const words = t.rows.flatMap((r) => (r[c] ?? []).flatMap((p) => tokenize(p.runs, pick, base * STYLE_SIZE[p.style ?? 'normal'])))
        const widest = Math.max(0, ...words.map((w) => (w === 'br' || w.space ? 0 : w.width)))
        return Math.min(contentW / cols, widest + 2 * pad + 1)
      })
      const spare = contentW - minW.reduce((a, b) => a + b, 0)
      widths = minW.map((mw, c) => mw + (spare * longest[c]) / total)
    }
    const xAt = (g: number) => M.left + widths.slice(0, g).reduce((a, b) => a + b, 0)
    // Columna de la cuadrícula donde empieza cada celda.
    const starts = t.rows.map((row, r) => {
      let g = 0
      return row.map((_, i) => {
        const s = g
        g += spanOf(r, i)
        return s
      })
    })
    const mergedAt = (r: number, g: number) => {
      const i = starts[r]?.indexOf(g) ?? -1
      return i >= 0 && !!t.cells?.[r]?.[i]?.merged
    }
    const geometry = (r: number) =>
      t.rows[r].map((paras, i) => {
        const g = starts[r][i]
        const span = spanOf(r, i)
        const w = widths.slice(g, g + span).reduce((a, b) => a + b, 0)
        return { paras, g, x: xAt(g), w, cell: t.cells?.[r]?.[i] }
      })
    // Imágenes de las celdas (un logo en el encabezado, una foto…).
    for (const row of t.rows) for (const cell of row) for (const p of cell) if (p.image) await embed(p.image)
    type CellLine = { l: Line; p: OPara; img?: { w: number; h: number } }
    const cellLines = (r: number): CellLine[][] =>
      geometry(r).map(({ paras, w, cell }) =>
        cell?.merged
          ? []
          : paras.flatMap((p): CellLine[] => {
              if (p.image) {
                const k = Math.min(1, (w - 2 * pad) / (p.image.width * 0.75))
                const iw = p.image.width * 0.75 * k
                const ih = p.image.height * 0.75 * k
                return [{ l: { tokens: [], width: iw, height: ih + 2 }, p, img: { w: iw, h: ih } }]
              }
              const ls: CellLine[] = paraLines({ ...p, list: undefined }, w - 2 * pad).lines.map((l) => ({ l, p }))
              // En Word el espacio antes y después de los párrafos también cuenta dentro de la celda.
              const gap = (h: number): CellLine => ({ l: { tokens: [], width: 0, height: h }, p: { kind: 'para', runs: [] } })
              if (p.exact && p.spaceBefore) ls.unshift(gap(p.spaceBefore))
              if (p.exact && p.spaceAfter) ls.push(gap(p.spaceAfter))
              return ls
            }),
      )
    // Alto de cada fila. Una celda combinada hacia abajo reparte su alto entre las filas que ocupa.
    const all = t.rows.map((_, r) => cellLines(r))
    const contentH = (ls: CellLine[]) => ls.reduce((h, { l }) => h + l.height, 0)
    const rowsDown = (r: number, g: number) => {
      let n = 1
      while (r + n < t.rows.length && mergedAt(r + n, g)) n++
      return n
    }
    const minRow = t.pad ? 0 : base * 1.3
    const heights = all.map((lines, r) =>
      Math.max(t.rowHeights?.[r] ?? 0, Math.max(minRow, ...lines.map((ls, i) => (rowsDown(r, starts[r][i]) > 1 ? 0 : contentH(ls)))) + 2 * padY),
    )
    all.forEach((lines, r) =>
      lines.forEach((ls, i) => {
        const n = rowsDown(r, starts[r][i])
        if (n < 2) return
        const need = contentH(ls) + 2 * padY
        const have = heights.slice(r, r + n).reduce((a, b) => a + b, 0)
        if (need > have) heights[r + n - 1] += need - have
      }),
    )
    const border = rgb(0.55, 0.55, 0.55)
    const drawRow = (r: number, shade: boolean) => {
      const lines = all[r]
      const h = heights[r]
      if (!fixed && y - h < bottom && !atTop()) {
        newPage()
        if (t.header && r !== 0) drawRow(0, true)
      }
      geometry(r).forEach(({ g, x, w, cell }, i) => {
        const fill = cell?.fill ?? (shade ? 'EDEFF5' : undefined)
        if (fill) page.drawRectangle({ x, y: y - h, width: w, height: h, color: hexRgb(fill) })
        if (borders) {
          const line = (x1: number, y1: number, x2: number, y2: number) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.6, color: border })
          if (!cell?.merged) line(x, y, x + w, y)
          if (!mergedAt(r + 1, g)) line(x, y - h, x + w, y - h)
          line(x, y, x, y - h)
          line(x + w, y, x + w, y - h)
        }
        const saved = y
        y -= padY
        for (const { l, p, img } of lines[i]) {
          if (img && p.image) {
            const ix = p.align === 'center' ? x + (w - img.w) / 2 : p.align === 'right' ? x + w - pad - img.w : x + pad
            page.drawImage(images.get(p.image)!, { x: ix, y: y - img.h, width: img.w, height: img.h })
            y -= l.height
            continue
          }
          drawLine(l, x + pad + (p.exact ? (p.indent?.left ?? 0) : 0), w - 2 * pad - (p.exact ? (p.indent?.left ?? 0) + (p.indent?.right ?? 0) : 0), p.align ?? 'left')
          y -= l.height
        }
        y = saved
      })
      y -= h
    }
    t.rows.forEach((_, r) => drawRow(r, !!t.header && r === 0))
    y -= t.pad ? 0 : base * 0.8
  }

  const drawImage = async (img: OImage) => {
    const embedded = await embed(img)
    // Pixeles a puntos (96 ppp), sin pasar del ancho ni del alto útil.
    let w = img.width * 0.75
    let h = img.height * 0.75
    const k = Math.min(1, contentW / w, (top - bottom) / h)
    w *= k
    h *= k
    ensure(h)
    const x = img.align === 'center' ? M.left + (contentW - w) / 2 : img.align === 'right' ? M.left + contentW - w : M.left
    page.drawImage(embedded, { x, y: y - h, width: w, height: h })
    y -= h + base * 0.6
  }

  const drawBlocks = async (list: OBlock[]) => {
    for (const b of list) {
      if (b.kind === 'para') drawPara(b)
      else if (b.kind === 'table') await drawTable(b)
      else if (b.kind === 'image') await drawImage(b)
      else if (fixed) continue
      else if (b.setup) {
        // Salto de sección: la hoja vacía que quedó se reemplaza por una con la nueva página.
        if (atTop()) {
          doc.removePage(doc.getPageCount() - 1)
          pageDecor.pop()
        }
        await applySetup(b.setup)
        newPage()
      } else if (!atTop()) newPage()
    }
  }
  /** Alto que ocupan unos bloques (se dibujan en una hoja de prueba que luego se quita). */
  const measure = async (list: OBlock[] | undefined) => {
    if (!list?.length) return 0
    page = doc.addPage([W, H])
    fixed = true
    y = H
    await drawBlocks(list)
    doc.removePage(doc.getPageCount() - 1)
    fixed = false
    return H - y
  }
  /** Pasa a la página de una sección: tamaño, márgenes, y el alto que ocupan su encabezado y su pie. */
  async function applySetup(st: Partial<OPageSetup>) {
    ;[W, H] = st.pageSize ?? A4
    M = st.margins ?? { top: m, right: m, bottom: m, left: m }
    contentW = W - M.left - M.right
    top = H - M.top
    bottom = M.bottom
    const headerTop = H - (st.headerDistance ?? 36)
    const footerBase = st.footerDistance ?? 36
    const headerH = await measure(st.header)
    const footerH = await measure(st.footer)
    if (headerH) top = Math.min(top, headerTop - headerH)
    if (footerH) bottom = Math.max(bottom, footerBase + footerH)
    decor = { header: st.header ?? [], footer: st.footer ?? [], headerTop, footerBase, headerH, footerH }
  }

  await applySetup({ ...opts, margins: M })
  newPage()
  await drawBlocks(blocks)

  // Encabezado y pie en cada página (los de su sección), con el número de página.
  const pages = doc.getPages()
  fixed = true
  for (const [i, pg] of pages.entries()) {
    const d = pageDecor[i]
    if (!d || (!d.headerH && !d.footerH)) continue
    page = pg
    fieldValues = { page: i + 1, pages: pages.length }
    y = d.headerTop
    await drawBlocks(d.header)
    y = d.footerBase + d.footerH
    await drawBlocks(d.footer)
  }
  return doc.save()
}
