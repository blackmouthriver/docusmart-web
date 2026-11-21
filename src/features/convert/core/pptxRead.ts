/**
 * Lectura de PowerPoint (.pptx) para pasarlo a PDF (W-114). Convierte cada diapositiva en un
 * modelo simple: fondo, cuadros de texto (con lo heredado del diseño y del patrón: posición de
 * los marcadores, tamaños, viñetas y colores del tema), imágenes PNG/JPG, formas, tablas y
 * grupos. Lo que no se puede dibujar (gráficos, SmartArt, EMF) se cuenta para avisar.
 */
import { strFromU8, unzipSync } from 'fflate'
import { child, children, find, parseXml, path, type XNode } from './xml'

export type PRun = { text: string; size: number; bold: boolean; italic: boolean; underline: boolean; color: string }
export type PPara = { runs: PRun[]; align: 'l' | 'ctr' | 'r' | 'just'; bullet: string | null; level: number }
export type PBox = { x: number; y: number; w: number; h: number }
export type PText = PBox & {
  kind: 'text'
  paras: PPara[]
  fill: string | null
  line: string | null
  shape: 'rect' | 'ellipse' | 'roundRect'
  anchor: 't' | 'ctr' | 'b'
  insets: { l: number; t: number; r: number; b: number }
  scale: number
}
export type PImage = PBox & { kind: 'image'; data: Uint8Array; type: 'png' | 'jpg' }
export type PTable = PBox & { kind: 'table'; cols: number[]; rows: Array<{ h: number; cells: Array<{ paras: PPara[]; fill: string | null }> }> }
export type PItem = PText | PImage | PTable
export type PSlide = { background: string; backgroundImage: PImage | null; items: PItem[] }
/** `skipped`: elementos que no se pudieron dibujar (gráficos, SmartArt, imágenes EMF/SVG…). */
export type PDeck = { width: number; height: number; slides: PSlide[]; skipped: number }

export class PptxError extends Error {
  constructor(message = 'pptx') {
    super(message)
    this.name = 'PptxError'
  }
}

/* ───────────── Archivos del paquete ───────────── */

type Part = { path: string; xml: XNode; rels: Map<string, string> }

function dirOf(p: string) {
  return p.slice(0, p.lastIndexOf('/') + 1)
}
/** "ppt/slides/" + "../media/image1.png" → "ppt/media/image1.png" (o un destino absoluto "/ppt/..."). */
export function resolvePath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = (dirOf(base) + target).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.' && p !== '') out.push(p)
  }
  return out.join('/')
}

/* ───────────── Colores ───────────── */

type Theme = { scheme: Record<string, string>; map: Record<string, string> }

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex, 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}
function hslToHex(h: number, s: number, l: number): string {
  const f = (p: number, q: number, t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    return u < 1 / 6 ? p + (q - p) * 6 * u : u < 1 / 2 ? q : u < 2 / 3 ? p + (q - p) * (2 / 3 - u) * 6 : p
  }
  let r = l
  let g = l
  let b = l
  if (s) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, h + 1 / 3)
    g = f(p, q, h)
    b = f(p, q, h - 1 / 3)
  }
  return [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Mezcla un color con blanco: `amount` es la parte del color que queda (0,2 = muy claro). */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(255 - (255 - c) * amount).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Aplica los modificadores de DrawingML más comunes (lumMod, lumOff, tint, shade). */
function applyMods(hex: string, node: XNode): string {
  let [h, s, l] = hexToHsl(hex)
  for (const m of node.children) {
    const v = Number(m.attrs.val) / 100000
    if (!Number.isFinite(v)) continue
    if (m.name === 'a:lumMod') l *= v
    else if (m.name === 'a:lumOff') l += v
    else if (m.name === 'a:tint') l = l + (1 - l) * (1 - v)
    else if (m.name === 'a:shade') l *= v
  }
  return hslToHex(h, s, Math.min(1, Math.max(0, l)))
}

/** Color de un nodo que contiene srgbClr, schemeClr, sysClr o prstClr. */
export function colorOf(n: XNode | undefined, theme: Theme): string | null {
  if (!n) return null
  for (const c of n.children) {
    if (c.name === 'a:srgbClr' && /^[0-9a-f]{6}$/i.test(c.attrs.val)) return applyMods(c.attrs.val.toUpperCase(), c)
    if (c.name === 'a:sysClr') return applyMods((c.attrs.lastClr ?? (c.attrs.val === 'window' ? 'FFFFFF' : '000000')).toUpperCase(), c)
    if (c.name === 'a:schemeClr') {
      const key = theme.map[c.attrs.val] ?? c.attrs.val
      const base = theme.scheme[key] ?? (c.attrs.val === 'bg1' || c.attrs.val === 'lt1' ? 'FFFFFF' : '000000')
      return applyMods(base, c)
    }
    if (c.name === 'a:prstClr') return applyMods(c.attrs.val === 'white' ? 'FFFFFF' : '000000', c)
  }
  return null
}

/** Relleno sólido (o el primer color de un degradado); null si no tiene relleno. */
function fillOf(spPr: XNode | undefined, theme: Theme): string | null | undefined {
  if (!spPr) return undefined
  if (child(spPr, 'a:noFill')) return null
  const solid = child(spPr, 'a:solidFill')
  if (solid) return colorOf(solid, theme)
  const grad = child(spPr, 'a:gradFill')
  if (grad) return colorOf(find(grad, 'a:gs'), theme)
  return undefined
}

/* ───────────── Lectura ───────────── */

const num = (v: string | undefined, d = 0) => (v !== undefined && Number.isFinite(Number(v)) ? Number(v) : d)

type Ph = { type: string; idx: string | undefined }
const phOf = (sp: XNode): Ph | null => {
  const ph = find(child(sp, 'p:nvSpPr') ?? child(sp, 'p:nvPicPr') ?? child(sp, 'p:nvGraphicFramePr'), 'p:ph')
  return ph ? { type: ph.attrs.type ?? 'body', idx: ph.attrs.idx } : null
}
const sameKind = (a: string, b: string) => {
  const norm = (t: string) => (t === 'ctrTitle' ? 'title' : t === 'subTitle' || t === 'obj' ? 'body' : t)
  return norm(a) === norm(b)
}

/** Busca el marcador equivalente en el diseño o el patrón (por índice y, si no, por tipo). */
function findPlaceholder(part: Part | undefined, ph: Ph): XNode | undefined {
  if (!part) return undefined
  const tree = path(rootOf(part), 'p:cSld', 'p:spTree')
  const shapes = tree ? flatShapes(tree) : []
  const withPh = shapes.map((s) => ({ s, p: phOf(s) })).filter((x) => x.p)
  return (ph.idx !== undefined ? withPh.find((x) => x.p!.idx === ph.idx)?.s : undefined) ?? withPh.find((x) => sameKind(x.p!.type, ph.type))?.s
}
const ROOTS: Record<string, true> = { 'p:sld': true, 'p:sldLayout': true, 'p:sldMaster': true }
const rootOf = (part: Part) => part.xml.children.find((c) => ROOTS[c.name])

function flatShapes(tree: XNode): XNode[] {
  return tree.children.flatMap((c) => (c.name === 'p:grpSp' ? flatShapes(c) : c.name === 'p:sp' || c.name === 'p:pic' ? [c] : []))
}

type Ctx = {
  files: Record<string, Uint8Array>
  theme: Theme
  layout?: Part
  master?: Part
  slide: Part
  skipped: number
}

const xfrmOf = (sp: XNode) => path(sp, 'p:spPr', 'a:xfrm') ?? path(sp, 'p:xfrm') ?? path(sp, 'p:grpSpPr', 'a:xfrm')
function boxOf(x: XNode | undefined): PBox | null {
  const off = child(x, 'a:off')
  const ext = child(x, 'a:ext')
  return off && ext ? { x: num(off.attrs.x), y: num(off.attrs.y), w: num(ext.attrs.cx), h: num(ext.attrs.cy) } : null
}

/** Estilo por defecto del texto según el tipo de marcador: tamaño, negrita, color y viñeta por nivel. */
type LvlStyle = { size?: number; bold?: boolean; italic?: boolean; color?: string | null; bullet?: string | null; align?: PPara['align'] }

function lvlStyles(list: XNode | undefined, theme: Theme): Record<number, LvlStyle> {
  const out: Record<number, LvlStyle> = {}
  if (!list) return out
  for (let i = 1; i <= 9; i++) {
    const p = child(list, `a:lvl${i}pPr`)
    if (!p) continue
    const d = child(p, 'a:defRPr')
    const bullet = child(p, 'a:buNone') ? null : child(p, 'a:buChar') ? child(p, 'a:buChar')!.attrs.char : child(p, 'a:buAutoNum') ? '#' : undefined
    out[i - 1] = {
      size: d?.attrs.sz ? num(d.attrs.sz) / 100 : undefined,
      bold: d?.attrs.b !== undefined ? d.attrs.b === '1' : undefined,
      italic: d?.attrs.i !== undefined ? d.attrs.i === '1' : undefined,
      color: d ? (colorOf(child(d, 'a:solidFill'), theme) ?? undefined) : undefined,
      bullet,
      align: (p.attrs.algn as PPara['align']) || undefined,
    }
  }
  return out
}
const merge = (...ls: Array<Record<number, LvlStyle>>) => {
  const out: Record<number, LvlStyle> = {}
  for (let i = 0; i < 9; i++) for (const l of ls) for (const [k, v] of Object.entries(l[i] ?? {})) if (v !== undefined) (out[i] ??= {})[k as keyof LvlStyle] = v as never
  return out
}

function paragraphs(txBody: XNode | undefined, defaults: Record<number, LvlStyle>, theme: Theme, scale: number): PPara[] {
  if (!txBody) return []
  const own = lvlStyles(child(txBody, 'a:lstStyle'), theme)
  const styles = merge(defaults, own)
  const text1 = theme.scheme[theme.map.tx1 ?? 'dk1'] ?? '000000'
  let autoNum = 0
  return children(txBody, 'a:p').map((p) => {
    const pPr = child(p, 'a:pPr')
    const level = num(pPr?.attrs.lvl)
    const st = styles[level] ?? {}
    let bullet = pPr && child(pPr, 'a:buNone') ? null : pPr && child(pPr, 'a:buChar') ? child(pPr, 'a:buChar')!.attrs.char : pPr && child(pPr, 'a:buAutoNum') ? '#' : (st.bullet ?? null)
    const runs: PRun[] = []
    for (const r of p.children) {
      if (r.name !== 'a:r' && r.name !== 'a:fld' && r.name !== 'a:br') continue
      if (r.name === 'a:br') {
        runs.push({ text: '\n', size: (st.size ?? 18) * scale, bold: false, italic: false, underline: false, color: st.color ?? text1 })
        continue
      }
      const rPr = child(r, 'a:rPr')
      const text = child(r, 'a:t')?.text ?? ''
      if (!text) continue
      runs.push({
        text,
        size: (rPr?.attrs.sz ? num(rPr.attrs.sz) / 100 : (st.size ?? 18)) * scale,
        bold: rPr?.attrs.b !== undefined ? rPr.attrs.b === '1' : !!st.bold,
        italic: rPr?.attrs.i !== undefined ? rPr.attrs.i === '1' : !!st.italic,
        underline: !!rPr?.attrs.u && rPr.attrs.u !== 'none',
        color: colorOf(child(rPr, 'a:solidFill'), theme) ?? st.color ?? text1,
      })
    }
    const hasText = runs.some((r) => r.text.trim())
    if (bullet === '#') bullet = hasText ? `${++autoNum}.` : null
    else if (!hasText) bullet = null
    return { runs, align: (pPr?.attrs.algn as PPara['align']) || st.align || 'l', bullet, level }
  })
}

function textDefaults(ctx: Ctx, ph: Ph | null): Record<number, LvlStyle> {
  const tx = path(rootOf(ctx.master ?? ctx.slide), 'p:txStyles')
  const kind = ph ? (sameKind(ph.type, 'title') ? 'p:titleStyle' : ph.type === 'body' || ph.type === 'obj' || ph.type === 'subTitle' ? 'p:bodyStyle' : 'p:otherStyle') : 'p:otherStyle'
  let base = lvlStyles(child(tx, kind), ctx.theme)
  // Un subtítulo no lleva viñetas aunque el estilo del cuerpo las tenga.
  if (ph?.type === 'subTitle') base = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, bullet: null }]))
  if (!ph) return base
  const layers = [ctx.master, ctx.layout].map((part) => findPlaceholder(part, ph)).filter(Boolean) as XNode[]
  return merge(base, ...layers.map((s) => lvlStyles(path(s, 'p:txBody', 'a:lstStyle'), ctx.theme)))
}

function readText(sp: XNode, box: PBox, ctx: Ctx): PText {
  const ph = phOf(sp)
  const inherited = ph ? ([ctx.layout, ctx.master].map((p) => findPlaceholder(p, ph)).filter(Boolean) as XNode[]) : []
  const bodyPr = [path(sp, 'p:txBody', 'a:bodyPr'), ...inherited.map((s) => path(s, 'p:txBody', 'a:bodyPr'))]
  const attr = (k: string) => bodyPr.map((b) => b?.attrs[k]).find((v) => v !== undefined)
  const fit = child(bodyPr[0], 'a:normAutofit')
  const scale = fit?.attrs.fontScale ? num(fit.attrs.fontScale) / 100000 : 1
  const spPr = child(sp, 'p:spPr')
  const style = child(sp, 'p:style')
  let fill = fillOf(spPr, ctx.theme)
  if (fill === undefined) fill = ph ? null : (colorOf(child(style, 'a:fillRef'), ctx.theme) ?? null)
  const ln = child(spPr, 'a:ln')
  let line: string | null = null
  if (ln && !child(ln, 'a:noFill')) line = colorOf(child(ln, 'a:solidFill'), ctx.theme)
  else if (!ln && !ph && style) line = colorOf(child(style, 'a:lnRef'), ctx.theme)
  const geom = path(spPr, 'a:prstGeom')?.attrs.prst
  // En las formas, el color del texto por defecto viene del estilo de la forma (blanco sobre el acento).
  let defaults = textDefaults(ctx, ph)
  const fontColor = !ph ? colorOf(child(style, 'a:fontRef'), ctx.theme) : null
  if (fontColor) defaults = merge(defaults, Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i, { color: fontColor }])))
  return {
    kind: 'text',
    ...box,
    paras: paragraphs(child(sp, 'p:txBody'), defaults, ctx.theme, scale),
    fill,
    line,
    shape: geom === 'ellipse' ? 'ellipse' : geom === 'roundRect' ? 'roundRect' : 'rect',
    anchor: (attr('anchor') as PText['anchor']) ?? (ph && sameKind(ph.type, 'title') ? 'ctr' : 't'),
    insets: { l: num(attr('lIns'), 91440), t: num(attr('tIns'), 45720), r: num(attr('rIns'), 91440), b: num(attr('bIns'), 45720) },
    scale,
  }
}

function media(ctx: Ctx, part: Part, rid: string | undefined): { data: Uint8Array; type: 'png' | 'jpg' } | null {
  const target = rid ? part.rels.get(rid) : undefined
  const data = target ? ctx.files[target] : undefined
  if (!data) return null
  if (data[0] === 0x89 && data[1] === 0x50) return { data, type: 'png' }
  if (data[0] === 0xff && data[1] === 0xd8) return { data, type: 'jpg' }
  return null
}

function readTable(frame: XNode, box: PBox, ctx: Ctx): PTable | null {
  const tbl = find(frame, 'a:tbl')
  if (!tbl) return null
  const cols = children(child(tbl, 'a:tblGrid'), 'a:gridCol').map((c) => num(c.attrs.w))
  const defaults = textDefaults(ctx, null)
  // Estilo de tabla predeterminado (los estilos integrados no vienen en el archivo): encabezado
  // con el color de acento y texto blanco en negrita, y filas alternas en tonos claros del acento.
  const tblPr = child(tbl, 'a:tblPr')
  const styled = !!child(tblPr, 'a:tableStyleId') || tblPr?.attrs.firstRow === '1'
  const accent = ctx.theme.scheme.accent1 ?? '4472C4'
  const header = styled && tblPr?.attrs.firstRow === '1'
  const banded = styled && tblPr?.attrs.bandRow === '1'
  const rows = children(tbl, 'a:tr').map((tr, ri) => {
    const isHeader = header && ri === 0
    const band = banded ? (((header ? ri - 1 : ri) % 2 === 0 ? 0.4 : 0.2)) : 0
    const rowDefaults = isHeader ? merge(defaults, Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i, { color: 'FFFFFF', bold: true }]))) : defaults
    return {
      h: num(tr.attrs.h),
      cells: children(tr, 'a:tc').map((tc) => {
        const own = fillOf(child(tc, 'a:tcPr'), ctx.theme)
        const fill = own !== undefined ? own : isHeader ? accent : band ? tint(accent, band) : null
        return { paras: paragraphs(child(tc, 'a:txBody'), rowDefaults, ctx.theme, 1), fill }
      }),
    }
  })
  return { kind: 'table', ...box, cols, rows }
}

type Transform = (b: PBox) => PBox
const identity: Transform = (b) => b

function readTree(tree: XNode, ctx: Ctx, part: Part, transform: Transform, out: PItem[]) {
  for (const n of tree.children) {
    if (n.name === 'p:grpSp') {
      const x = path(n, 'p:grpSpPr', 'a:xfrm')
      const off = boxOf(x)
      const chOff = child(x, 'a:chOff')
      const chExt = child(x, 'a:chExt')
      const inner: Transform =
        off && chOff && chExt && num(chExt.attrs.cx) && num(chExt.attrs.cy)
          ? (b) => {
              const kx = off.w / num(chExt.attrs.cx)
              const ky = off.h / num(chExt.attrs.cy)
              return transform({ x: off.x + (b.x - num(chOff.attrs.x)) * kx, y: off.y + (b.y - num(chOff.attrs.y)) * ky, w: b.w * kx, h: b.h * ky })
            }
          : transform
      readTree(n, ctx, part, inner, out)
      continue
    }
    if (n.name !== 'p:sp' && n.name !== 'p:pic' && n.name !== 'p:graphicFrame') continue
    let box = boxOf(xfrmOf(n))
    const ph = phOf(n)
    if (!box && ph) {
      const inherited = [ctx.layout, ctx.master].map((p) => findPlaceholder(p, ph)).find((s) => s && boxOf(xfrmOf(s)))
      box = inherited ? boxOf(xfrmOf(inherited)) : null
    }
    if (!box) continue
    const b = transform(box)
    if (n.name === 'p:pic') {
      const img = media(ctx, part, find(n, 'a:blip')?.attrs['r:embed'])
      if (img) out.push({ kind: 'image', ...b, ...img })
      else ctx.skipped++
    } else if (n.name === 'p:graphicFrame') {
      const t = readTable(n, b, ctx)
      if (t) out.push(t)
      else ctx.skipped++
    } else {
      // Un marcador vacío (sin texto propio) no se dibuja: en la presentación no se ve.
      const t = readText(n, b, ctx)
      const empty = !t.paras.some((p) => p.runs.some((r) => r.text.trim()))
      if (ph && empty) continue
      if (!empty || t.fill || t.line) out.push(t)
      // Imagen como relleno de la forma.
      const blipFill = path(n, 'p:spPr', 'a:blipFill')
      if (blipFill) {
        const img = media(ctx, part, find(blipFill, 'a:blip')?.attrs['r:embed'])
        if (img) out.push({ kind: 'image', ...b, ...img })
      }
    }
  }
}

function background(parts: Array<Part | undefined>, ctx: Ctx): { color: string; image: PImage | null } {
  for (const part of parts) {
    if (!part) continue
    const bg = path(rootOf(part), 'p:cSld', 'p:bg')
    if (!bg) continue
    const bgPr = child(bg, 'p:bgPr')
    if (bgPr) {
      const blip = path(bgPr, 'a:blipFill')
      if (blip) {
        const img = media(ctx, part, find(blip, 'a:blip')?.attrs['r:embed'])
        if (img) return { color: 'FFFFFF', image: { kind: 'image', x: 0, y: 0, w: 0, h: 0, ...img } }
      }
      const fill = fillOf(bgPr, ctx.theme)
      if (fill) return { color: fill, image: null }
    }
    const ref = child(bg, 'p:bgRef')
    if (ref) return { color: colorOf(ref, ctx.theme) ?? 'FFFFFF', image: null }
  }
  return { color: 'FFFFFF', image: null }
}

export function readPptx(bytes: Uint8Array): PDeck {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new PptxError()
  }
  if (!files['ppt/presentation.xml']) throw new PptxError()
  const xmlOf = (p: string) => parseXml(files[p] ? strFromU8(files[p]) : '')
  const relsOf = (p: string) => {
    const r = xmlOf(`${dirOf(p)}_rels/${p.slice(p.lastIndexOf('/') + 1)}.rels`)
    const map = new Map<string, string>()
    const types = new Map<string, string>()
    for (const rel of children(child(r, 'Relationships'), 'Relationship')) {
      if (rel.attrs.TargetMode === 'External') continue
      map.set(rel.attrs.Id, resolvePath(p, rel.attrs.Target))
      types.set(rel.attrs.Id, rel.attrs.Type?.split('/').pop() ?? '')
    }
    return { map, types }
  }
  const partOf = (p: string): Part => ({ path: p, xml: xmlOf(p), rels: relsOf(p).map })
  const relTarget = (p: string, type: string) => {
    const { map, types } = relsOf(p)
    for (const [id, t] of types) if (t === type) return map.get(id)
    return undefined
  }

  const pres = xmlOf('ppt/presentation.xml')
  const presRoot = child(pres, 'p:presentation')
  const size = child(presRoot, 'p:sldSz')
  const width = num(size?.attrs.cx, 12192000)
  const height = num(size?.attrs.cy, 6858000)
  const presRels = relsOf('ppt/presentation.xml').map
  const slidePaths = children(child(presRoot, 'p:sldIdLst'), 'p:sldId')
    .map((s) => presRels.get(s.attrs['r:id']))
    .filter((p): p is string => !!p && !!files[p])

  const themes = new Map<string, Theme>()
  let skipped = 0
  const slides: PSlide[] = []
  for (const sp of slidePaths) {
    const slide = partOf(sp)
    const sld = child(slide.xml, 'p:sld')
    if (sld?.attrs.show === '0') continue
    const layoutPath = relTarget(sp, 'slideLayout')
    const layout = layoutPath ? partOf(layoutPath) : undefined
    const masterPath = layoutPath ? relTarget(layoutPath, 'slideMaster') : undefined
    const master = masterPath ? partOf(masterPath) : undefined
    const themePath = masterPath ? relTarget(masterPath, 'theme') : undefined
    let theme = themePath ? themes.get(themePath) : undefined
    if (!theme) {
      const scheme: Record<string, string> = {}
      const clr = find(themePath ? xmlOf(themePath) : undefined, 'a:clrScheme')
      for (const c of clr?.children ?? []) {
        const v = colorOf(c, { scheme: {}, map: {} })
        if (v) scheme[c.name.replace('a:', '')] = v
      }
      const map = { ...(path(master ? rootOf(master) : undefined, 'p:clrMap')?.attrs ?? { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' }) }
      theme = { scheme, map }
      if (themePath) themes.set(themePath, theme)
    }
    const ctx: Ctx = { files, theme, layout, master, slide, skipped: 0 }
    const items: PItem[] = []
    // Las formas del patrón y del diseño que no son marcadores (logos, franjas) también se ven.
    for (const part of [master, layout]) {
      if (!part) continue
      const showMaster = part === master ? sld?.attrs.showMasterSp !== '0' && child(layout?.xml, 'p:sldLayout')?.attrs.showMasterSp !== '0' : sld?.attrs.showMasterSp !== '0'
      const tree = showMaster ? path(rootOf(part), 'p:cSld', 'p:spTree') : undefined
      if (!tree) continue
      readTree({ ...tree, children: tree.children.filter((c) => !phOf(c)) }, ctx, part, identity, items)
    }
    const tree = path(sld, 'p:cSld', 'p:spTree')
    if (tree) readTree(tree, ctx, slide, identity, items)
    const bg = background([slide, layout, master], ctx)
    const backgroundImage = bg.image ? { ...bg.image, w: width, h: height } : null
    slides.push({ background: bg.color, backgroundImage, items })
    skipped += ctx.skipped
  }
  if (!slides.length) throw new PptxError('empty')
  return { width, height, slides, skipped }
}
