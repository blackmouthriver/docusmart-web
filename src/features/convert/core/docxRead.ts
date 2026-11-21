/**
 * Lector de Word (.docx) para Word a PDF (W-137). Lee el XML del documento directamente (como
 * pptxRead.ts con PowerPoint) para conservar lo que se ve: estilos con herencia, viñetas y
 * numeración reales, colores, resaltado, tachado, superíndice, familia de la fuente, espaciado,
 * sangrías, justificado, tamaño de página, márgenes, encabezado y pie con número de página,
 * anchos de tabla, celdas combinadas y sombreadas, el tamaño de las imágenes y los cuadros de
 * texto. Lo que no se puede dibujar (gráficos, imágenes EMF/SVG) se cuenta en `skippedImages`.
 */
import { strFromU8, unzipSync } from 'fflate'
import type { FontFamily } from '../../../shared/pdf/pdfFonts'
import { child, children, find, parseXml, path, type XNode } from './xml'
import { imageSize } from './officeModels'
import type { OBlock, OCell, OImage, OLineSpacing, OMargins, OPara, ORun, OTable } from './officePdf'

export class DocxError extends Error {}

export type DocxDoc = {
  blocks: OBlock[]
  pageSize: [number, number]
  margins: OMargins
  header: OBlock[]
  footer: OBlock[]
  headerDistance: number
  footerDistance: number
  skippedImages: number
}

type RProps = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  size?: number
  highlight?: string
  family?: FontFamily
  caps?: boolean
  script?: 'sup' | 'sub'
  hidden?: boolean
}
type PProps = {
  align?: OPara['align']
  spaceBefore?: number
  spaceAfter?: number
  line?: OLineSpacing
  left?: number
  right?: number
  firstLine?: number
  numId?: string
  ilvl?: number
  keepNext?: boolean
  pageBreakBefore?: boolean
  contextual?: boolean
}
type Style = { type: string; basedOn?: string; p: PProps; r: RProps; name: string; borders?: boolean; cellMar?: XNode }
type Level = { fmt: string; text: string; start: number; p: PProps; r: RProps }

const twip = (v: string | undefined) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v) / 20)
const attr = (n: XNode | undefined, a: string) => n?.attrs[`w:${a}`]
/** Propiedad de sí/no de Word: `<w:b/>` es sí; `w:val="0"`, "false" u "off" es no. */
const flag = (n: XNode | undefined) => (n ? !['0', 'false', 'off', 'none'].includes(attr(n, 'val') ?? '') : undefined)
const defined = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>
const merge = <T extends object>(...parts: Array<T | undefined>): T => Object.assign({}, ...parts.map((p) => (p ? defined(p) : {})))

const HIGHLIGHT: Record<string, string> = {
  yellow: 'FFFF00', green: '00FF00', cyan: '00FFFF', magenta: 'FF00FF', blue: '0000FF', red: 'FF0000',
  darkBlue: '000080', darkCyan: '008080', darkGreen: '008000', darkMagenta: '800080', darkRed: '800000',
  darkYellow: '808000', darkGray: '808080', lightGray: 'C0C0C0', black: '000000', white: 'FFFFFF',
}

/** Serif, monoespaciada o sans según el nombre de la fuente. */
export function familyOf(font: string | undefined): FontFamily | undefined {
  if (!font) return undefined
  if (/courier|consolas|mono|cousine|lucida console|menlo|monaco/i.test(font)) return 'mono'
  if (/times|georgia|cambria|garamond|book antiqua|palatino|serif|tinos|baskerville|bookman|century schoolbook/i.test(font) && !/sans/i.test(font)) return 'serif'
  return 'sans'
}

function rProps(rPr: XNode | undefined, theme: { minor?: string; major?: string }): RProps {
  if (!rPr) return {}
  const fonts = child(rPr, 'w:rFonts')
  const themeFont = attr(fonts, 'asciiTheme') ?? attr(fonts, 'hAnsiTheme')
  const font = attr(fonts, 'ascii') ?? attr(fonts, 'hAnsi') ?? (themeFont ? (themeFont.startsWith('major') ? theme.major : theme.minor) : undefined)
  const color = attr(child(rPr, 'w:color'), 'val')
  const hl = attr(child(rPr, 'w:highlight'), 'val')
  const shd = attr(child(rPr, 'w:shd'), 'fill')
  const u = child(rPr, 'w:u')
  const va = attr(child(rPr, 'w:vertAlign'), 'val')
  const sz = attr(child(rPr, 'w:sz'), 'val')
  return {
    bold: flag(child(rPr, 'w:b')),
    italic: flag(child(rPr, 'w:i')),
    underline: u ? (attr(u, 'val') ?? 'single') !== 'none' : undefined,
    strike: flag(child(rPr, 'w:strike')) ?? flag(child(rPr, 'w:dstrike')),
    color: color && /^[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : color === 'auto' ? '' : undefined,
    size: sz ? Number(sz) / 2 : undefined,
    highlight: hl ? (HIGHLIGHT[hl] ?? '') : shd && /^[0-9a-f]{6}$/i.test(shd) ? shd.toUpperCase() : undefined,
    family: familyOf(font),
    caps: flag(child(rPr, 'w:caps')),
    script: va === 'superscript' ? 'sup' : va === 'subscript' ? 'sub' : undefined,
    hidden: flag(child(rPr, 'w:vanish')),
  }
}

function pProps(pPr: XNode | undefined): PProps {
  if (!pPr) return {}
  const jc = attr(child(pPr, 'w:jc'), 'val')
  const sp = child(pPr, 'w:spacing')
  const ind = child(pPr, 'w:ind')
  const num = child(pPr, 'w:numPr')
  const lineV = attr(sp, 'line')
  const rule = attr(sp, 'lineRule') ?? 'auto'
  let line: OLineSpacing | undefined
  if (lineV && !Number.isNaN(Number(lineV))) line = rule === 'exact' ? { exact: Number(lineV) / 20 } : rule === 'atLeast' ? { atLeast: Number(lineV) / 20 } : { auto: Number(lineV) / 240 }
  const hanging = twip(attr(ind, 'hanging'))
  const firstLine = twip(attr(ind, 'firstLine'))
  return {
    align: jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc === 'both' || jc === 'distribute' ? 'justify' : jc ? 'left' : undefined,
    spaceBefore: attr(sp, 'beforeAutospacing') === '1' ? 14 : twip(attr(sp, 'before')),
    spaceAfter: attr(sp, 'afterAutospacing') === '1' ? 14 : twip(attr(sp, 'after')),
    line,
    left: twip(attr(ind, 'left') ?? attr(ind, 'start')),
    right: twip(attr(ind, 'right') ?? attr(ind, 'end')),
    firstLine: hanging !== undefined ? -hanging : firstLine,
    numId: attr(child(num, 'w:numId'), 'val'),
    ilvl: num ? Number(attr(child(num, 'w:ilvl'), 'val') ?? 0) : undefined,
    keepNext: flag(child(pPr, 'w:keepNext')),
    pageBreakBefore: flag(child(pPr, 'w:pageBreakBefore')),
    contextual: flag(child(pPr, 'w:contextualSpacing')),
  }
}

/* ───────────── Numeración ───────────── */

const ROMAN: Array<[number, string]> = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
function roman(n: number): string {
  let s = ''
  for (const [v, r] of ROMAN) while (n >= v) (s += r), (n -= v)
  return s
}
function letters(n: number): string {
  // a, b, … z, aa, bb… (como Word).
  const c = String.fromCharCode(97 + ((n - 1) % 26))
  return c.repeat(Math.floor((n - 1) / 26) + 1)
}
export function formatNumber(n: number, fmt: string): string {
  switch (fmt) {
    case 'lowerLetter': return letters(n)
    case 'upperLetter': return letters(n).toUpperCase()
    case 'lowerRoman': return roman(n)
    case 'upperRoman': return roman(n).toUpperCase()
    case 'decimalZero': return n < 10 ? `0${n}` : String(n)
    case 'none': return ''
    default: return String(n)
  }
}
/** Viñetas de las fuentes de símbolos (Symbol, Wingdings) en su carácter Unicode. */
export function bulletChar(text: string): string {
  const map: Record<string, string> = { '': '•', '': '▪', '': '✓', '': '➢', '': '❖', '': '◆', o: '◦', '': '•' }
  return map[text] ?? (/^[-]$/.test(text) ? '•' : text)
}

/* ───────────── Lectura ───────────── */

export function readDocx(bytes: Uint8Array): DocxDoc {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new DocxError('old')
  }
  const xml = (name: string) => (files[name] ? parseXml(strFromU8(files[name])) : undefined)
  const document = xml('word/document.xml')
  const body = path(document, 'w:document', 'w:body')
  if (!body) throw new DocxError('old')

  const rels = (part: string) => {
    const dir = part.slice(0, part.lastIndexOf('/') + 1)
    const relsXml = xml(`${dir}_rels/${part.slice(dir.length)}.rels`)
    const out = new Map<string, string>()
    for (const r of children(child(relsXml, 'Relationships'), 'Relationship')) {
      const target = r.attrs.Target ?? ''
      if (r.attrs.TargetMode === 'External') continue
      // Rutas relativas a la carpeta de la parte ("media/x.png", "../media/x.png" o "/word/media/x.png").
      const parts = (target.startsWith('/') ? target.slice(1) : dir + target).split('/')
      const norm: string[] = []
      for (const p of parts) p === '..' ? norm.pop() : p !== '.' && norm.push(p)
      out.set(r.attrs.Id, norm.join('/'))
    }
    return out
  }

  // Tema: las fuentes "del tema" (Calibri, Aptos, Cambria…).
  const themeXml = xml('word/theme/theme1.xml')
  const fontScheme = find(themeXml, 'a:fontScheme')
  const theme = { minor: path(fontScheme, 'a:minorFont', 'a:latin')?.attrs.typeface, major: path(fontScheme, 'a:majorFont', 'a:latin')?.attrs.typeface }

  // Estilos.
  const stylesXml = child(xml('word/styles.xml'), 'w:styles')
  const defaults = child(stylesXml, 'w:docDefaults')
  const docR = rProps(path(defaults, 'w:rPrDefault', 'w:rPr'), theme)
  const docP = pProps(path(defaults, 'w:pPrDefault', 'w:pPr'))
  const styles = new Map<string, Style>()
  let defaultPara: string | undefined
  let defaultTable: string | undefined
  for (const s of children(stylesXml, 'w:style')) {
    const id = attr(s, 'styleId') ?? ''
    const type = attr(s, 'type') ?? 'paragraph'
    const tblBorders = path(s, 'w:tblPr', 'w:tblBorders')
    styles.set(id, {
      type,
      basedOn: attr(child(s, 'w:basedOn'), 'val'),
      p: pProps(child(s, 'w:pPr')),
      r: rProps(child(s, 'w:rPr'), theme),
      name: (attr(child(s, 'w:name'), 'val') ?? id).toLowerCase(),
      borders: tblBorders ? tblBorders.children.some((b) => !['nil', 'none'].includes(attr(b, 'val') ?? 'nil')) : undefined,
      cellMar: path(s, 'w:tblPr', 'w:tblCellMar'),
    })
    if (attr(s, 'default') === '1' && type === 'paragraph') defaultPara = id
    if (attr(s, 'default') === '1' && type === 'table') defaultTable = id
  }
  const chain = (id: string | undefined): Style[] => {
    const out: Style[] = []
    const seen = new Set<string>()
    while (id && styles.has(id) && !seen.has(id)) {
      seen.add(id)
      out.unshift(styles.get(id)!)
      id = styles.get(id)!.basedOn
    }
    return out
  }
  const styleP = (id: string | undefined) => merge<PProps>(...chain(id).map((s) => s.p))
  const styleR = (id: string | undefined) => merge<RProps>(...chain(id).map((s) => s.r))
  const tableBorders = (id: string | undefined) => chain(id).reduce<boolean | undefined>((b, s) => s.borders ?? b, undefined)
  const cellMargins = (id: string | undefined) => chain(id).reduce<XNode | undefined>((m, s) => s.cellMar ?? m, undefined)

  // Numeración.
  const numXml = child(xml('word/numbering.xml'), 'w:numbering')
  const abstract = new Map<string, Level[]>()
  for (const a of children(numXml, 'w:abstractNum')) {
    const lvls: Level[] = []
    for (const l of children(a, 'w:lvl')) {
      lvls[Number(attr(l, 'ilvl') ?? 0)] = {
        fmt: attr(child(l, 'w:numFmt'), 'val') ?? 'decimal',
        text: attr(child(l, 'w:lvlText'), 'val') ?? '',
        start: Number(attr(child(l, 'w:start'), 'val') ?? 1),
        p: pProps(child(l, 'w:pPr')),
        r: rProps(child(l, 'w:rPr'), theme),
      }
    }
    abstract.set(attr(a, 'abstractNumId') ?? '', lvls)
  }
  const nums = new Map<string, { levels: Level[]; starts: Record<number, number> }>()
  for (const n of children(numXml, 'w:num')) {
    const starts: Record<number, number> = {}
    for (const o of children(n, 'w:lvlOverride')) {
      const s = attr(child(o, 'w:startOverride'), 'val')
      if (s) starts[Number(attr(o, 'ilvl') ?? 0)] = Number(s)
    }
    nums.set(attr(n, 'numId') ?? '', { levels: abstract.get(attr(child(n, 'w:abstractNumId'), 'val') ?? '') ?? [], starts })
  }
  const counters = new Map<string, number[]>()
  const listOf = (numId: string, ilvl: number): { list: OPara['list']; p: PProps } | null => {
    const num = nums.get(numId)
    const lvl = num?.levels[ilvl]
    if (!num || !lvl) return null
    const c = counters.get(numId) ?? []
    for (let i = 0; i < ilvl; i++) if (c[i] === undefined) c[i] = num.starts[i] ?? num.levels[i]?.start ?? 1
    c[ilvl] = c[ilvl] === undefined ? (num.starts[ilvl] ?? lvl.start) : c[ilvl] + 1
    c.length = ilvl + 1
    counters.set(numId, c)
    const ordered = lvl.fmt !== 'bullet'
    const marker = ordered
      ? lvl.text.replace(/%(\d)/g, (_, d: string) => formatNumber(c[Number(d) - 1] ?? 1, num.levels[Number(d) - 1]?.fmt ?? 'decimal'))
      : bulletChar(lvl.text)
    return { list: { ordered, level: ilvl, index: c[ilvl], marker }, p: lvl.p }
  }

  let skippedImages = 0
  // Espaciado contextual: entre párrafos seguidos del mismo estilo no va el espacio antes ni después.
  let previous: { para: OPara; styleId?: string; contextual?: boolean } | null = null
  const docRels = rels('word/document.xml')

  const image = (drawing: XNode, relMap: Map<string, string>, align: OPara['align']): OImage | null => {
    const blip = find(drawing, 'a:blip')
    const target = blip && relMap.get(blip.attrs['r:embed'] ?? '')
    const data = target ? files[target] : undefined
    const size = data && imageSize(data)
    if (!data || !size) return null
    const ext = find(drawing, 'wp:extent')
    const cx = Number(ext?.attrs.cx)
    const cy = Number(ext?.attrs.cy)
    // EMU a pixeles (914400 por pulgada, 96 ppp).
    const width = cx > 0 ? cx / 9525 : size.width
    const height = cy > 0 ? cy / 9525 : size.height
    return { kind: 'image', data, type: size.type, width, height, align: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left' }
  }

  /**
   * Un párrafo de Word en bloques: el párrafo (partido en los saltos de página), sus imágenes y
   * el contenido de sus cuadros de texto. `inHeader`: los campos PÁGINA se numeran al dibujar.
   */
  const paragraph = (p: XNode, relMap: Map<string, string>, inHeader = false): OBlock[] => {
    const pPr = child(p, 'w:pPr')
    const direct = pProps(pPr)
    const styleId = attr(child(pPr, 'w:pStyle'), 'val') ?? defaultPara
    const sp = styleP(styleId)
    const numId = direct.numId ?? sp.numId
    const ilvl = direct.ilvl ?? sp.ilvl ?? 0
    const numbered = numId && numId !== '0' ? listOf(numId, ilvl) : null
    const props = merge<PProps>(docP, sp, numbered?.p, direct)
    const baseR = merge<RProps>(docR, styleR(styleId))
    const name = styles.get(styleId ?? '')?.name ?? ''
    const heading = /^heading (\d)|^título (\d)/.exec(name)
    const style: OPara['style'] = name === 'title' || name === 'título' ? 'title' : heading ? (['h1', 'h2', 'h3'][Math.min(2, Number(heading[1] ?? heading[2]) - 1)] as OPara['style']) : undefined

    const out: OBlock[] = []
    const after: OBlock[] = []
    let runs: ORun[] = []
    let first = true
    const flush = (end: boolean) => {
      const para: OPara = {
        kind: 'para',
        runs,
        exact: true,
        style,
        align: props.align,
        spaceBefore: first ? (props.spaceBefore ?? 0) : 0,
        spaceAfter: end ? (props.spaceAfter ?? 0) : 0,
        line: props.line,
        indent: { left: props.left, right: props.right, firstLine: props.firstLine },
        keepNext: props.keepNext,
        pageBreakBefore: first ? props.pageBreakBefore : false,
        list: first && numbered ? numbered.list : undefined,
      }
      // Tamaño de un párrafo vacío (ocupa su línea, como en Word).
      if (!runs.length) runs.push({ text: '', size: baseR.size ?? 10 })
      if (first && previous && previous.styleId === styleId && (props.contextual || previous.contextual)) {
        if (props.contextual) para.spaceBefore = 0
        if (previous.contextual) previous.para.spaceAfter = 0
      }
      if (end) previous = { para, styleId, contextual: props.contextual }
      out.push(para)
      runs = []
      first = false
    }

    // Campos complejos (fldChar): PAGE y NUMPAGES se numeran; de los demás se muestra el resultado.
    const fields: Array<{ instr: string; result: boolean }> = []
    const inInstr = () => fields.some((f) => !f.result)
    const hideResult = () => fields.some((f) => f.result && /^\s*(PAGE|NUMPAGES)\b/i.test(f.instr))

    const emit = (text: string, r: RProps) => {
      if (!text || r.hidden || inInstr() || hideResult()) return
      runs.push(defined({
        text: r.caps ? text.toUpperCase() : text,
        bold: r.bold, italic: r.italic, underline: r.underline, strike: r.strike,
        color: r.color || undefined, size: r.size ?? 10, highlight: r.highlight || undefined,
        family: r.family, script: r.script,
      }) as ORun)
    }
    const field = (instr: string, r: RProps) => {
      const kind = /^\s*NUMPAGES\b/i.test(instr) ? 'pages' : /^\s*PAGE\b/i.test(instr) ? 'page' : null
      if (!kind) return false
      if (inHeader) runs.push(defined({ text: '', field: kind, size: r.size ?? 10, bold: r.bold, italic: r.italic, color: r.color || undefined, family: r.family }) as ORun)
      return true
    }

    const drawing = (d: XNode) => {
      // Cuadros de texto: sus párrafos van después del párrafo.
      const box = find(d, 'w:txbxContent')
      if (box) {
        for (const c of box.children) if (c.name === 'w:p') after.push(...paragraph(c, relMap, inHeader))
        return
      }
      if (find(d, 'c:chart') || find(d, 'dgm:relIds')) {
        skippedImages++
        return
      }
      const img = image(d, relMap, props.align)
      if (!img) {
        if (find(d, 'a:blip')) skippedImages++
        return
      }
      if (runs.length) flush(false)
      out.push(img)
    }

    const run = (r: XNode, inherited: RProps) => {
      const rPr = child(r, 'w:rPr')
      const props = merge<RProps>(inherited, styleR(attr(child(rPr, 'w:rStyle'), 'val')), rProps(rPr, theme))
      for (const c of r.children) {
        switch (c.name) {
          case 'w:t':
            emit(c.text, props)
            break
          case 'w:tab':
            emit('\t', props)
            break
          case 'w:br':
            if (attr(c, 'type') === 'page') {
              if (runs.length) flush(false)
              out.push({ kind: 'pagebreak' })
            } else emit('\n', props)
            break
          case 'w:cr':
            emit('\n', props)
            break
          case 'w:noBreakHyphen':
            emit('-', props)
            break
          case 'w:sym': {
            const ch = attr(c, 'char')
            if (ch) emit(bulletChar(String.fromCharCode(parseInt(ch, 16))), props)
            break
          }
          case 'w:fldChar': {
            const t = attr(c, 'fldCharType')
            if (t === 'begin') fields.push({ instr: '', result: false })
            else if (t === 'separate' && fields.length) {
              const f = fields[fields.length - 1]
              f.result = true
              field(f.instr, props)
            } else if (t === 'end') {
              const f = fields.pop()
              // Campo sin resultado guardado (separate): PÁGINA igual se numera.
              if (f && !f.result) field(f.instr, props)
            }
            break
          }
          case 'w:instrText':
            if (fields.length) fields[fields.length - 1].instr += c.text
            break
          case 'w:drawing':
            drawing(c)
            break
          case 'w:pict':
          case 'w:object':
            if (find(c, 'w:txbxContent')) drawing(c)
            else skippedImages++
            break
          case 'mc:AlternateContent': {
            const choice = child(c, 'mc:Choice') ?? child(c, 'mc:Fallback')
            if (choice) run({ ...r, children: choice.children }, inherited)
            break
          }
        }
      }
    }

    const walk = (n: XNode, inherited: RProps) => {
      for (const c of n.children) {
        switch (c.name) {
          case 'w:r':
            run(c, inherited)
            break
          case 'w:fldSimple': {
            const instr = attr(c, 'instr') ?? ''
            if (!field(instr, inherited)) walk(c, inherited)
            break
          }
          case 'w:hyperlink':
          case 'w:ins':
          case 'w:smartTag':
          case 'w:customXml':
          case 'w:sdtContent':
          case 'w:moveTo':
            walk(c, inherited)
            break
          case 'w:sdt':
            walk(child(c, 'w:sdtContent') ?? c, inherited)
            break
          case 'mc:AlternateContent': {
            const choice = child(c, 'mc:Choice') ?? child(c, 'mc:Fallback')
            if (choice) walk(choice, inherited)
            break
          }
        }
      }
    }
    walk(p, baseR)
    if (runs.length || !out.some((b) => b.kind === 'image')) flush(true)
    else {
      // El párrafo terminaba en una imagen: el espacio de después va en el último párrafo.
      const lastPara = [...out].reverse().find((b): b is OPara => b.kind === 'para')
      if (lastPara) lastPara.spaceAfter = props.spaceAfter ?? 0
    }
    // Un salto de sección "página siguiente" dentro del párrafo.
    const sect = child(pPr, 'w:sectPr')
    if (sect && (attr(child(sect, 'w:type'), 'val') ?? 'nextPage') !== 'continuous') after.push({ kind: 'pagebreak' })
    return [...out, ...after]
  }

  const table = (tbl: XNode, relMap: Map<string, string>, inHeader = false): OTable => {
    const tblPr = child(tbl, 'w:tblPr')
    const styleId = attr(child(tblPr, 'w:tblStyle'), 'val') ?? defaultTable
    const direct = child(tblPr, 'w:tblBorders')
    const borders = direct ? direct.children.some((b) => !['nil', 'none'].includes(attr(b, 'val') ?? 'nil')) : (tableBorders(styleId) ?? false)
    const widths = children(child(tbl, 'w:tblGrid'), 'w:gridCol').map((g) => twip(attr(g, 'w')) ?? 0)
    // Márgenes de celda: los de la tabla, los de su estilo o los de Word (5,4 pt a los lados, 0 arriba).
    const cellMar = child(tblPr, 'w:tblCellMar') ?? cellMargins(styleId)
    const pad = { x: twip(attr(child(cellMar, 'w:left') ?? child(cellMar, 'w:start'), 'w')) ?? 5.4, y: twip(attr(child(cellMar, 'w:top'), 'w')) ?? 0 }
    const rowHeights: Array<number | undefined> = []
    const rows: OPara[][][] = []
    const cells: OCell[][] = []
    let header = false
    children(tbl, 'w:tr').forEach((tr, r) => {
      if (r === 0) header = flag(path(tr, 'w:trPr', 'w:tblHeader')) ?? false
      rowHeights.push(twip(attr(path(tr, 'w:trPr', 'w:trHeight'), 'val')))
      const row: OPara[][] = []
      const styleRow: OCell[] = []
      for (const tc of tr.children.flatMap((c) => (c.name === 'w:sdt' ? children(child(c, 'w:sdtContent'), 'w:tc') : c.name === 'w:tc' ? [c] : []))) {
        const tcPr = child(tc, 'w:tcPr')
        const vMerge = child(tcPr, 'w:vMerge')
        const fill = attr(child(tcPr, 'w:shd'), 'fill')
        const paras: OPara[] = []
        const add = (n: XNode) => {
          for (const c of n.children) {
            if (c.name === 'w:p')
              for (const b of paragraph(c, relMap, inHeader)) {
                if (b.kind === 'para') paras.push(b)
                // Una imagen en la celda va como párrafo con imagen.
                else if (b.kind === 'image') paras.push({ kind: 'para', runs: [], exact: true, image: b, align: b.align === 'left' ? 'left' : b.align })
              }
            else if (c.name === 'w:tbl') for (const tr2 of table(c, relMap, inHeader).rows) for (const cell of tr2) paras.push(...cell)
            else if (c.name === 'w:sdt') add(child(c, 'w:sdtContent') ?? c)
          }
        }
        add(tc)
        row.push(paras)
        styleRow.push(defined({
          fill: fill && /^[0-9a-f]{6}$/i.test(fill) ? fill.toUpperCase() : undefined,
          span: Number(attr(child(tcPr, 'w:gridSpan'), 'val') ?? 1) > 1 ? Number(attr(child(tcPr, 'w:gridSpan'), 'val')) : undefined,
          merged: vMerge && (attr(vMerge, 'val') ?? 'continue') === 'continue' ? true : undefined,
        }))
      }
      rows.push(row)
      cells.push(styleRow)
    })
    return { kind: 'table', rows, cells, widths: widths.some((w) => w > 0) ? widths : undefined, borders, header, pad, rowHeights }
  }

  const blocksOf = (container: XNode | undefined, relMap: Map<string, string>, inHeader = false): OBlock[] => {
    const out: OBlock[] = []
    for (const c of container?.children ?? []) {
      if (c.name === 'w:p') out.push(...paragraph(c, relMap, inHeader))
      else if (c.name === 'w:tbl') out.push(table(c, relMap, inHeader))
      else if (c.name === 'w:sdt') out.push(...blocksOf(child(c, 'w:sdtContent'), relMap, inHeader))
      else if (c.name === 'w:customXml') out.push(...blocksOf(c, relMap, inHeader))
    }
    return out
  }

  const blocks = blocksOf(body, docRels)
  // Un salto de sección justo al final no deja una hoja en blanco.
  while (blocks.length && blocks[blocks.length - 1].kind === 'pagebreak') blocks.pop()

  // Página, márgenes, encabezado y pie: los de la última sección.
  const sect = child(body, 'w:sectPr')
  const pgSz = child(sect, 'w:pgSz')
  const pgMar = child(sect, 'w:pgMar')
  const pageSize: [number, number] = [twip(attr(pgSz, 'w')) ?? 595.28, twip(attr(pgSz, 'h')) ?? 841.89]
  const margins: OMargins = {
    top: Math.abs(twip(attr(pgMar, 'top')) ?? 72),
    right: twip(attr(pgMar, 'right') ?? attr(pgMar, 'end')) ?? 72,
    bottom: Math.abs(twip(attr(pgMar, 'bottom')) ?? 72),
    left: twip(attr(pgMar, 'left') ?? attr(pgMar, 'start')) ?? 72,
  }
  const part = (kind: 'header' | 'footer'): OBlock[] => {
    const refs = children(sect, `w:${kind}Reference`)
    const ref = refs.find((r) => attr(r, 'type') === 'default') ?? refs[0]
    const target = ref && docRels.get(ref.attrs['r:id'] ?? '')
    const root = target ? child(xml(target), kind === 'header' ? 'w:hdr' : 'w:ftr') : undefined
    if (!root) return []
    const blocks = blocksOf(root, rels(target!), true).filter((b) => b.kind !== 'pagebreak')
    // Sin nada que mostrar (solo párrafos vacíos), no se dibuja.
    const shows = (b: OBlock): boolean => b.kind === 'image' || (b.kind === 'para' && (!!b.image || b.runs.some((r) => !!r.text.trim() || !!r.field))) || (b.kind === 'table' && b.rows.some((row) => row.some((cell) => cell.some(shows))))
    return blocks.some(shows) ? blocks : []
  }
  return {
    blocks,
    pageSize,
    margins,
    header: part('header'),
    footer: part('footer'),
    headerDistance: twip(attr(pgMar, 'header')) ?? 36,
    footerDistance: twip(attr(pgMar, 'footer')) ?? 36,
    skippedImages,
  }
}

/** Texto del documento, con una línea en blanco entre párrafos (para leerlo en voz alta). */
export function docxText(doc: DocxDoc): string {
  const out: string[] = []
  const para = (p: OPara) => out.push((p.list?.marker ? p.list.marker + ' ' : '') + p.runs.map((r) => r.text).join(''))
  for (const b of doc.blocks) {
    if (b.kind === 'para') para(b)
    else if (b.kind === 'table') for (const row of b.rows) for (const cell of row) cell.forEach(para)
  }
  return out.filter((s) => s.trim()).join('\n\n')
}
