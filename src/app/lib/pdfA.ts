/**
 * PDF a PDF/A-2b (archivo a largo plazo) con pdf-lib, todo en el navegador.
 *
 * Qué hace para cumplir la norma (validado con veraPDF):
 * - Perfil de color sRGB (escrito aquí mismo, ~500 bytes) como OutputIntent.
 * - Metadatos XMP con la identificación PDF/A, coherentes con el diccionario Info.
 * - Identificador del archivo, sin cifrado.
 * - Quita JavaScript, acciones prohibidas, adjuntos, XFA y anotaciones sin apariencia.
 * - Anotaciones imprimibles y con apariencia normal solamente.
 * - Incrusta las 14 fuentes estándar (Helvetica, Times, Courier…) con fuentes libres
 *   equivalentes que trae pdf.js, con los anchos leídos de esas fuentes (pdfaFonts.json).
 * - Las páginas que no se pueden arreglar (colores CMYK de imprenta, fuentes no
 *   incluidas que no son estándar, compresión LZW con predictor) se convierten en
 *   imagen con el `rasterize` que se recibe.
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  decodePDFRawStream,
  type PDFContext,
} from 'pdf-lib'
import FONTS from './pdfaFonts.json'
import type { RasterPage } from './pdfRedact'
import { tr } from '../i18n/translate'

export type FontLoader = (file: string) => Promise<Uint8Array>
export type PageRasterizer = (pageIndex: number) => Promise<RasterPage>
export type RasterReason = 'cmyk' | 'font' | 'other'
export type PdfAReport = {
  /** Fuentes estándar que se incrustaron. */
  fonts: string[]
  /** Páginas (desde 1) convertidas en imagen y por qué. */
  rasterPages: Array<{ page: number; reason: RasterReason }>
  removed: { actions: number; attachments: number; annotations: number }
  /** Se generó la apariencia de campos de formulario que no la tenían. */
  formAppearances: boolean
}

export class PdfAEncryptedError extends Error {
  constructor() {
    super(tr('err.lockedPdf'))
    this.name = 'PdfAEncryptedError'
  }
}

type StdFont = {
  file: string
  kind: 'ttf' | 'cff'
  symbolic: boolean
  bbox: number[]
  italicAngle: number
  ascent: number
  descent: number
  capHeight: number
  widths: number[]
  names?: Array<string | null>
}
const STD = FONTS as Record<string, StdFont>

const N = (s: string) => PDFName.of(s)

/* ───────────── Perfil ICC sRGB (v2, pantalla) ───────────── */

/** Perfil sRGB mínimo: primarios adaptados a D50 y curva gamma 2,2. */
export function srgbIcc(): Uint8Array {
  const s15 = (v: number) => Math.round(v * 65536)
  const tags: Array<[string, Uint8Array]> = []
  const ascii = (b: Uint8Array, at: number, s: string) => {
    for (let i = 0; i < s.length; i++) b[at + i] = s.charCodeAt(i)
  }
  const desc = new Uint8Array(12 + 17 + 4 + 4 + 2 + 1 + 67)
  ascii(desc, 0, 'desc')
  new DataView(desc.buffer).setUint32(8, 17)
  ascii(desc, 12, 'sRGB (DocuSmart)')
  tags.push(['desc', desc])
  const cprt = new Uint8Array(8 + 14)
  ascii(cprt, 0, 'text')
  ascii(cprt, 8, 'Public domain')
  tags.push(['cprt', cprt])
  const xyz = (sig: string, x: number, y: number, z: number) => {
    const b = new Uint8Array(20)
    const v = new DataView(b.buffer)
    ascii(b, 0, 'XYZ ')
    v.setInt32(8, s15(x))
    v.setInt32(12, s15(y))
    v.setInt32(16, s15(z))
    tags.push([sig, b])
  }
  xyz('wtpt', 0.9642, 1, 0.8249)
  xyz('rXYZ', 0.4361, 0.2225, 0.0139)
  xyz('gXYZ', 0.3851, 0.7169, 0.0971)
  xyz('bXYZ', 0.1431, 0.0606, 0.7141)
  const curv = new Uint8Array(14)
  ascii(curv, 0, 'curv')
  new DataView(curv.buffer).setUint32(8, 1)
  new DataView(curv.buffer).setUint16(12, 0x0233) // gamma 2,2 (u8Fixed8)

  const pad4 = (n: number) => (n + 3) & ~3
  let offset = 128 + 4 + 12 * (tags.length + 3)
  const table: Array<[string, number, number]> = []
  const blobs: Array<[number, Uint8Array]> = []
  for (const [sig, b] of tags) {
    table.push([sig, offset, b.length])
    blobs.push([offset, b])
    offset = pad4(offset + b.length)
  }
  for (const sig of ['rTRC', 'gTRC', 'bTRC']) table.push([sig, offset, curv.length])
  blobs.push([offset, curv])
  offset = pad4(offset + curv.length)

  const out = new Uint8Array(offset)
  const v = new DataView(out.buffer)
  v.setUint32(0, offset)
  v.setUint32(8, 0x02100000)
  ascii(out, 12, 'mntrRGB XYZ ')
  v.setUint16(24, 2026)
  v.setUint16(26, 1)
  v.setUint16(28, 1)
  ascii(out, 36, 'acsp')
  v.setInt32(68, s15(0.9642))
  v.setInt32(72, s15(1))
  v.setInt32(76, s15(0.8249))
  v.setUint32(128, table.length)
  table.forEach(([s, o, n], i) => {
    ascii(out, 132 + 12 * i, s)
    v.setUint32(136 + 12 * i, o)
    v.setUint32(140 + 12 * i, n)
  })
  for (const [o, b] of blobs) out.set(b, o)
  return out
}

/* ───────────── Metadatos XMP ───────────── */

export type XmpInfo = { title?: string; author?: string; subject?: string; keywords?: string; creator?: string; producer: string; created: Date; modified: Date }

/** Caracteres válidos en XML 1.0 (sin controles ni sustitutos sueltos). */
const xmlChar = (c: string) => {
  const n = c.codePointAt(0)!
  return n === 9 || n === 10 || n === 13 || (n >= 0x20 && n <= 0xd7ff) || (n >= 0xe000 && n <= 0xfffd) || n >= 0x10000
}
const xmlEsc = (s: string) =>
  Array.from(s)
    .filter(xmlChar)
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
const isoDate = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

/** Paquete XMP con pdfaid (parte 2, nivel B) y los mismos datos que el diccionario Info. */
export function xmpPacket(m: XmpInfo): string {
  const alt = (tag: string, v?: string) => (v ? `<${tag}><rdf:Alt><rdf:li xml:lang="x-default">${xmlEsc(v)}</rdf:li></rdf:Alt></${tag}>` : '')
  return [
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">',
    '<pdfaid:part>2</pdfaid:part>',
    '<pdfaid:conformance>B</pdfaid:conformance>',
    alt('dc:title', m.title),
    m.author ? `<dc:creator><rdf:Seq><rdf:li>${xmlEsc(m.author)}</rdf:li></rdf:Seq></dc:creator>` : '',
    alt('dc:description', m.subject),
    m.keywords ? `<pdf:Keywords>${xmlEsc(m.keywords)}</pdf:Keywords>` : '',
    m.creator ? `<xmp:CreatorTool>${xmlEsc(m.creator)}</xmp:CreatorTool>` : '',
    `<xmp:CreateDate>${isoDate(m.created)}</xmp:CreateDate>`,
    `<xmp:ModifyDate>${isoDate(m.modified)}</xmp:ModifyDate>`,
    `<pdf:Producer>${xmlEsc(m.producer)}</pdf:Producer>`,
    '</rdf:Description>',
    '</rdf:RDF>',
    '</x:xmpmeta>',
    '<?xpacket end="w"?>',
  ]
    .filter(Boolean)
    .join('\n')
}

/* ───────────── Fuentes ───────────── */

/** Nombre estándar de PDF para una fuente (también Arial, Times New Roman, Courier New). */
export function standardFontName(baseFont: string): string | null {
  const n = baseFont.toLowerCase().replace(/[^a-z]/g, '')
  const family = /^(helvetica|arial)/.test(n) ? 'Helvetica' : /^times/.test(n) ? 'Times' : /^courier/.test(n) ? 'Courier' : /^symbol/.test(n) ? 'Symbol' : /^zapfdingbats/.test(n) ? 'ZapfDingbats' : null
  if (!family || family === 'Symbol' || family === 'ZapfDingbats') return family
  const bold = n.includes('bold')
  const italic = /italic|oblique/.test(n)
  if (family === 'Times') return bold && italic ? 'Times-BoldItalic' : bold ? 'Times-Bold' : italic ? 'Times-Italic' : 'Times-Roman'
  const suffix = bold && italic ? '-BoldOblique' : bold ? '-Bold' : italic ? '-Oblique' : ''
  return family + suffix
}

const FONT_FILES = ['FontFile', 'FontFile2', 'FontFile3']
const isEmbedded = (fd: unknown) => fd instanceof PDFDict && FONT_FILES.some((k) => fd.has(N(k)))

type FontPlan = { status: 'ok' } | { status: 'broken' } | { status: 'fix'; std: string; encoding: 'winansi' | 'standard' | 'builtin' }

/** Qué hacer con un diccionario de fuente: dejarlo, incrustar una sustituta o no se puede. */
export function planFont(font: PDFDict): FontPlan {
  const sub = font.get(N('Subtype'))
  if (sub === N('Type3')) return { status: 'ok' }
  if (sub === N('Type0')) {
    const desc = font.lookup(N('DescendantFonts'))
    const cid = desc instanceof PDFArray ? desc.lookup(0) : null
    return cid instanceof PDFDict && isEmbedded(cid.lookup(N('FontDescriptor'))) ? { status: 'ok' } : { status: 'broken' }
  }
  if (isEmbedded(font.lookup(N('FontDescriptor')))) return { status: 'ok' }
  if (sub !== N('Type1') && sub !== N('TrueType')) return { status: 'broken' }
  const base = font.get(N('BaseFont'))
  const std = base instanceof PDFName ? standardFontName(base.decodeText()) : null
  if (!std) return { status: 'broken' }
  if (STD[std].symbolic) return { status: 'fix', std, encoding: 'builtin' }
  const enc = font.get(N('Encoding'))
  if (enc === N('WinAnsiEncoding')) return { status: 'fix', std, encoding: 'winansi' }
  if (enc === undefined || enc === N('StandardEncoding')) return { status: 'fix', std, encoding: 'standard' }
  return { status: 'broken' } // Differences o MacRoman: harían falta anchos por nombre de glifo
}

/** Incrusta la fuente libre equivalente y reescribe anchos y descriptor. */
async function embedStandard(ctx: PDFContext, font: PDFDict, plan: Extract<FontPlan, { status: 'fix' }>, load: FontLoader) {
  const m = STD[plan.std]
  const bytes = await load(m.file)
  const widths = [...m.widths]
  if (plan.encoding === 'standard') {
    // StandardEncoding = WinAnsi salvo las comillas simples (39 y 96).
    widths[39 - 32] = m.widths[146 - 32]
    widths[96 - 32] = m.widths[145 - 32]
    font.set(N('Encoding'), ctx.obj({ Type: 'Encoding', BaseEncoding: 'WinAnsiEncoding', Differences: [39, N('quoteright'), 96, N('quoteleft')] }))
  } else if (plan.encoding === 'winansi') font.set(N('Encoding'), N('WinAnsiEncoding'))
  else {
    // Symbol y ZapfDingbats: los códigos se nombran explícitamente (la CFF no trae su codificación).
    const diffs: Array<number | PDFName> = []
    m.names!.forEach((name, i) => {
      if (!name) return
      if (!diffs.length || i === 0 || !m.names![i - 1]) diffs.push(i + 32)
      diffs.push(N(name))
    })
    font.set(N('Encoding'), ctx.obj({ Type: 'Encoding', Differences: diffs }))
  }
  let file: PDFRawStream
  let key: string
  if (m.kind === 'ttf') {
    key = 'FontFile2'
    file = ctx.flateStream(bytes, { Length1: bytes.length })
    font.set(N('Subtype'), N('TrueType'))
  } else {
    // Los .pfb de pdf.js son CFF "desnudo".
    key = 'FontFile3'
    file = ctx.flateStream(bytes, { Subtype: 'Type1C' })
    font.set(N('Subtype'), N('Type1'))
  }
  const flags = m.symbolic ? 4 : 32 | (/Oblique|Italic/.test(plan.std) ? 64 : 0) | (plan.std.startsWith('Courier') ? 1 : 0) | (plan.std.startsWith('Times') ? 2 : 0)
  const fd = ctx.obj({
    Type: 'FontDescriptor',
    FontName: N(plan.std),
    Flags: flags,
    FontBBox: m.bbox,
    ItalicAngle: m.italicAngle,
    Ascent: m.ascent,
    Descent: m.descent,
    CapHeight: m.capHeight,
    StemV: 80,
    [key]: ctx.register(file),
  })
  font.set(N('BaseFont'), N(plan.std))
  font.set(N('FontDescriptor'), ctx.register(fd))
  font.set(N('FirstChar'), PDFNumber.of(32))
  font.set(N('LastChar'), PDFNumber.of(255))
  font.set(N('Widths'), ctx.obj(widths))
}

/* ───────────── Recorrido del documento ───────────── */

const FORBIDDEN_ACTIONS = new Set(['Launch', 'Sound', 'Movie', 'ResetForm', 'ImportData', 'Hide', 'SetOCGState', 'Rendition', 'Trans', 'GoTo3DView', 'JavaScript'])
const NAMED_OK = new Set(['NextPage', 'PrevPage', 'FirstPage', 'LastPage'])
const FORBIDDEN_ANNOTS = new Set(['3D', 'Sound', 'Screen', 'Movie', 'FileAttachment', 'RichMedia'])

const dictOf = (o: unknown): PDFDict | null => (o instanceof PDFDict ? o : o instanceof PDFStream ? o.dict : null)
const nameOf = (o: unknown) => (o instanceof PDFName ? o.decodeText() : undefined)

/** ¿La acción (o alguna de su cadena /Next) está prohibida en PDF/A? */
export function isForbiddenAction(ctx: PDFContext, a: unknown, seen = new Set<unknown>()): boolean {
  const d = a instanceof PDFRef ? ctx.lookup(a) : a
  if (!(d instanceof PDFDict) || seen.has(d)) return false
  seen.add(d)
  const s = nameOf(d.get(N('S')))
  if (s && FORBIDDEN_ACTIONS.has(s)) return true
  if (s === 'Named' && !NAMED_OK.has(nameOf(d.get(N('N'))) ?? '')) return true
  const next = d.lookup(N('Next'))
  const list = next instanceof PDFArray ? next.asArray() : next ? [next] : []
  return list.some((x) => isForbiddenAction(ctx, x, seen))
}

/** Todos los objetos alcanzables desde un punto (con el nombre de la clave por la que se llegó). */
function walk(ctx: PDFContext, start: PDFObject | undefined, visit: (obj: PDFObject, key: string) => void, skip = new Set<string>()) {
  const seen = new Set<unknown>()
  const stack: Array<[PDFObject | undefined, string]> = [[start, '']]
  while (stack.length) {
    const [raw, key] = stack.pop()!
    if (!raw) continue
    const obj = raw instanceof PDFRef ? ctx.lookup(raw) : raw
    if (!obj || seen.has(obj)) continue
    seen.add(obj)
    visit(obj, key)
    const d = dictOf(obj)
    if (d) for (const [k, v] of d.entries()) if (!skip.has(k.decodeText())) stack.push([v, k.decodeText()])
    if (obj instanceof PDFArray) for (const v of obj.asArray()) stack.push([v, key])
  }
}

const NUMBER = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/

/** ¿El contenido usa los operadores de color CMYK ("c m y k k" / "K")? Recorrido lineal por tokens. */
export function usesCmykOperator(content: string): boolean {
  let numbers = 0
  for (const token of content.split(/[\s[\]()<>/]+/)) {
    if (token === 'k' || token === 'K') {
      if (numbers >= 4) return true
    }
    numbers = NUMBER.test(token) ? numbers + 1 : 0
  }
  return false
}

function decodeText(s: PDFRawStream): string {
  try {
    return new TextDecoder('latin1').decode(decodePDFRawStream(s).decode())
  } catch {
    return ''
  }
}

/** Motivo por el que una página tiene que pasar a imagen, o null si se puede conservar. */
function pageProblem(ctx: PDFContext, page: PDFDict, fontPlans: Map<PDFDict, FontPlan>, bad: Set<unknown>): RasterReason | null {
  let reason: RasterReason | null = null
  const contentStreams: PDFRawStream[] = []
  const check = (obj: PDFObject, key: string) => {
    if (reason === 'font') return
    if (bad.has(obj)) reason ??= 'other'
    if (obj === N('DeviceCMYK') || obj === N('CMYK')) reason ??= 'cmyk'
    const d = dictOf(obj)
    if (!d) return
    if (d.get(N('Type')) === N('Font') || (d.has(N('BaseFont')) && d.has(N('Subtype')))) {
      if (fontPlans.get(d)?.status === 'broken' || (!fontPlans.has(d) && planFont(d).status === 'broken')) reason = 'font'
    }
    if (obj instanceof PDFRawStream && (d.get(N('Subtype')) === N('Form') || d.has(N('PatternType')) || key === 'N' || key === 'Contents' || key === 'CharProcs')) contentStreams.push(obj)
  }
  const contents = page.get(N('Contents'))
  walk(ctx, contents, (o, k) => check(o, k || 'Contents'))
  const resources = page.get(N('Resources')) ?? inherited(page, 'Resources')
  walk(ctx, resources, check, new Set(['Parent', 'P']))
  const annots = page.lookup(N('Annots'))
  if (annots instanceof PDFArray) for (const a of annots.asArray()) {
    const ad = ctx.lookup(a)
    if (ad instanceof PDFDict) walk(ctx, ad.get(N('AP')), check, new Set(['Parent', 'P']))
  }
  if (reason) return reason
  // Streams de contenido: operadores de color CMYK
  for (const s of contentStreams) if (usesCmykOperator(decodeText(s))) return 'cmyk'
  return null
}

function inherited(node: PDFDict, key: string): PDFObject | undefined {
  let cur: PDFDict | undefined = node
  for (let i = 0; cur && i < 50; i++) {
    const v = cur.get(N(key))
    if (v) return v
    const parent: unknown = cur.lookup(N('Parent'))
    cur = parent instanceof PDFDict ? parent : undefined
  }
  return undefined
}

/** Borra los objetos que ya nadie usa (adjuntos quitados, páginas pasadas a imagen…). */
function dropUnreachable(ctx: PDFContext) {
  const reach = new Set<string>()
  const stack: PDFObject[] = [ctx.trailerInfo.Root, ctx.trailerInfo.Info].filter(Boolean) as PDFObject[]
  const seen = new Set<unknown>()
  while (stack.length) {
    const o = stack.pop()!
    if (o instanceof PDFRef) {
      if (reach.has(o.toString())) continue
      reach.add(o.toString())
      const t = ctx.lookup(o)
      if (t) stack.push(t)
      continue
    }
    if (seen.has(o)) continue
    seen.add(o)
    const d = dictOf(o)
    if (d) stack.push(...d.values())
    if (o instanceof PDFArray) stack.push(...o.asArray())
  }
  for (const [ref] of ctx.enumerateIndirectObjects()) if (!reach.has(ref.toString())) ctx.delete(ref)
}

/* ───────────── Conversión ───────────── */

export type PdfAOptions = { loadFont: FontLoader; rasterize?: PageRasterizer; now?: Date }

export async function convertToPdfA(bytes: Uint8Array, opts: PdfAOptions): Promise<{ pdf: Uint8Array; report: PdfAReport }> {
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true })
  } catch (e) {
    if (/encrypt/i.test(String(e))) throw new PdfAEncryptedError()
    throw e
  }
  if (doc.isEncrypted) throw new PdfAEncryptedError()
  const ctx = doc.context
  const cat = doc.catalog
  const report: PdfAReport = { fonts: [], rasterPages: [], removed: { actions: 0, attachments: 0, annotations: 0 }, formAppearances: false }

  // 1. Formularios: apariencia para los campos que no la tienen (antes de las fuentes:
  //    pdf-lib la dibuja con Helvetica, que luego se incrusta como las demás).
  const acro = cat.lookup(N('AcroForm'))
  if (acro instanceof PDFDict) {
    try {
      const form = doc.getForm()
      const lacksAp = (w: { dict: PDFDict }) => {
        const ap = w.dict.lookup(N('AP'))
        return !(ap instanceof PDFDict && ap.has(N('N')))
      }
      if (form.getFields().some((f) => f.acroField.getWidgets().some(lacksAp))) {
        // pdf-lib dibuja la apariencia de los campos que no la tienen.
        form.updateFieldAppearances()
        // pdf-lib escribe la fuente al guardar; se fuerza ahora para poder incrustarla.
        await doc.flush()
        report.formAppearances = true
      }
    } catch {
      // Campos raros: se dejan como están.
    }
    acro.delete(N('XFA'))
    acro.delete(N('NeedAppearances'))
  }

  // 2. Catálogo: acciones automáticas, JavaScript, adjuntos, portafolios.
  if (cat.has(N('AA'))) report.removed.actions++
  for (const k of ['AA', 'Collection']) cat.delete(N(k))
  if (isForbiddenAction(ctx, cat.get(N('OpenAction')))) {
    cat.delete(N('OpenAction'))
    report.removed.actions++
  }
  const names = cat.lookup(N('Names'))
  if (names instanceof PDFDict) {
    if (names.has(N('JavaScript'))) report.removed.actions++
    names.delete(N('JavaScript'))
    const ef = names.lookup(N('EmbeddedFiles'))
    if (ef instanceof PDFDict) {
      const list = ef.lookup(N('Names'))
      report.removed.attachments += list instanceof PDFArray ? Math.floor(list.size() / 2) : 1
      names.delete(N('EmbeddedFiles'))
    }
  }
  cat.delete(N('AF'))

  // 3. Todos los objetos: fuentes, imágenes, estados gráficos, acciones, contenido opcional.
  const fontPlans = new Map<PDFDict, FontPlan>()
  const bad = new Set<unknown>()
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    const d = dictOf(obj)
    if (!d) continue
    const type = d.get(N('Type'))
    if (d.has(N('AA'))) {
      d.delete(N('AA'))
      report.removed.actions++
    }
    if (d.has(N('A')) && isForbiddenAction(ctx, d.get(N('A')))) {
      d.delete(N('A'))
      report.removed.actions++
    }
    if (type === N('Font') || (d.has(N('BaseFont')) && d.has(N('Subtype')) && !d.has(N('Type')))) {
      fontPlans.set(d, planFont(d))
    } else if (type === N('FontDescriptor')) {
      // CIDSet y CharSet son opcionales y, si están incompletos, no cumplen.
      d.delete(N('CIDSet'))
      d.delete(N('CharSet'))
    } else if (type === N('ExtGState')) {
      for (const k of ['TR', 'HTP', 'HT']) d.delete(N(k))
      if (d.has(N('TR2')) && d.get(N('TR2')) !== N('Default')) d.set(N('TR2'), N('Default'))
    } else if (type === N('OutputIntent')) {
      // Se reemplazan por el perfil sRGB.
    }
    if (d.get(N('Subtype')) === N('Image')) {
      d.delete(N('Interpolate'))
      d.delete(N('Alternates'))
      d.delete(N('OPI'))
    }
    if (d.get(N('Subtype')) === N('Form')) {
      d.delete(N('OPI'))
      d.delete(N('Ref'))
      if (d.get(N('Subtype2')) === N('PS')) bad.add(obj)
    }
    if (d.get(N('Subtype')) === N('PS')) bad.add(obj)
    if (obj instanceof PDFStream) for (const k of ['F', 'FFilter', 'FDecodeParms']) d.delete(N(k))
    // LZW (prohibido): se recomprime con Flate si no usa predictor.
    if (obj instanceof PDFRawStream && /LZW/.test(String(d.get(N('Filter'))))) {
      const filter = d.get(N('Filter'))
      if (filter === N('LZWDecode') && !d.has(N('DecodeParms'))) {
        const decoded = decodePDFRawStream(obj).decode()
        const fresh = ctx.flateStream(decoded)
        for (const [k, v] of d.entries()) if (!['Filter', 'Length', 'DecodeParms'].includes(k.decodeText())) fresh.dict.set(k, v)
        ctx.assign(ref, fresh)
      } else bad.add(obj)
    }
  }
  // Contenido opcional: cada configuración con nombre y sin /AS.
  const oc = cat.lookup(N('OCProperties'))
  if (oc instanceof PDFDict) {
    const configs = [oc.lookup(N('D')), ...((oc.lookup(N('Configs')) as PDFArray | undefined)?.asArray().map((r) => ctx.lookup(r)) ?? [])]
    configs.forEach((c, i) => {
      if (!(c instanceof PDFDict)) return
      if (!c.has(N('Name'))) c.set(N('Name'), PDFString.of(i ? `Config ${i}` : 'Default'))
      c.delete(N('AS'))
    })
  }

  // 4. Páginas: anotaciones y, si hace falta, pasar a imagen.
  const pages = doc.getPages()
  const toRaster: Array<{ index: number; reason: RasterReason }> = []
  pages.forEach((page, index) => {
    const node = page.node
    node.delete(N('AA'))
    node.delete(N('OutputIntents'))
    const annots = node.lookup(N('Annots'))
    if (annots instanceof PDFArray) {
      const keep: PDFObject[] = []
      for (const ref of annots.asArray()) {
        const a = ctx.lookup(ref)
        if (!(a instanceof PDFDict)) continue
        const sub = nameOf(a.get(N('Subtype'))) ?? ''
        const ap = a.lookup(N('AP'))
        const rect = a.lookup(N('Rect'))
        const r = rect instanceof PDFArray ? rect.asArray().map((x) => (x instanceof PDFNumber ? x.asNumber() : 0)) : [0, 0, 0, 0]
        const hasArea = Math.abs(r[2] - r[0]) > 0 && Math.abs(r[3] - r[1]) > 0
        const needsAp = !['Popup', 'Link'].includes(sub) && hasArea
        if (FORBIDDEN_ANNOTS.has(sub) || (needsAp && !(ap instanceof PDFDict && ap.has(N('N'))))) {
          report.removed.annotations++
          continue
        }
        if (ap instanceof PDFDict) for (const k of ['D', 'R']) ap.delete(N(k))
        const f = a.lookup(N('F'))
        const flags = f instanceof PDFNumber ? f.asNumber() : 0
        // Imprimible (4); nunca invisible (1), oculta (2), "no ver" (32) ni alternable (256).
        a.set(N('F'), PDFNumber.of((flags | 4) & ~(1 | 2 | 32 | 256)))
        a.delete(N('AA'))
        keep.push(ref)
      }
      if (keep.length) node.set(N('Annots'), ctx.obj(keep))
      else node.delete(N('Annots'))
    }
    const reason = pageProblem(ctx, node, fontPlans, bad)
    if (reason) toRaster.push({ index, reason })
  })

  if (toRaster.length) {
    if (!opts.rasterize) throw new Error(tr('libErr.pdfaRaster'))
    for (const { index, reason } of toRaster) {
      const r = await opts.rasterize(index)
      const node = pages[index].node
      const img = r.format === 'png' ? await doc.embedPng(r.image) : await doc.embedJpg(r.image)
      const content = ctx.flateStream(new TextEncoder().encode(`q ${r.widthPt} 0 0 ${r.heightPt} 0 0 cm /Im0 Do Q`))
      for (const k of ['CropBox', 'BleedBox', 'TrimBox', 'ArtBox', 'Rotate', 'Annots', 'Group', 'Resources']) node.delete(N(k))
      node.set(N('MediaBox'), ctx.obj([0, 0, r.widthPt, r.heightPt]))
      node.set(N('Resources'), ctx.obj({ XObject: { Im0: img.ref } }))
      node.set(N('Contents'), ctx.register(content))
      report.rasterPages.push({ page: index + 1, reason })
    }
  }

  // 5. Fuentes estándar: se incrustan las que siguen en uso.
  dropUnreachable(ctx)
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    const d = dictOf(obj)
    const plan = d && fontPlans.get(d)
    if (!d || !plan || plan.status !== 'fix') continue
    await embedStandard(ctx, d, plan, opts.loadFont)
    if (!report.fonts.includes(plan.std)) report.fonts.push(plan.std)
    void ref
  }

  // 6. Perfil de color, metadatos e identificador.
  const icc = ctx.register(ctx.flateStream(srgbIcc(), { N: 3 }))
  const intent = ctx.obj({ Type: 'OutputIntent', S: 'GTS_PDFA1', OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'), Info: PDFString.of('sRGB IEC61966-2.1'), DestOutputProfile: icc })
  cat.set(N('OutputIntents'), ctx.obj([ctx.register(intent)]))

  const now = opts.now ?? new Date()
  const meta: XmpInfo = {
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
    subject: doc.getSubject() || undefined,
    keywords: doc.getKeywords() || undefined,
    creator: doc.getCreator() || undefined,
    producer: 'DocuSmart',
    created: safeDate(doc.getCreationDate()) ?? now,
    modified: now,
  }
  // Info solo con los datos que también van en el XMP.
  const info = ctx.obj({}) as PDFDict
  ctx.trailerInfo.Info = ctx.register(info)
  if (meta.title) doc.setTitle(meta.title)
  if (meta.author) doc.setAuthor(meta.author)
  if (meta.subject) doc.setSubject(meta.subject)
  if (meta.keywords) info.set(N('Keywords'), PDFHexString.fromText(meta.keywords))
  if (meta.creator) doc.setCreator(meta.creator)
  doc.setProducer(meta.producer)
  doc.setCreationDate(meta.created)
  doc.setModificationDate(meta.modified)
  cat.set(N('Metadata'), ctx.register(ctx.stream(new TextEncoder().encode(xmpPacket(meta)), { Type: 'Metadata', Subtype: 'XML' })))
  cat.delete(N('PieceInfo'))

  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
  const oldId = ctx.trailerInfo.ID
  ctx.trailerInfo.ID = oldId instanceof PDFArray && oldId.size() === 2 ? ctx.obj([oldId.get(0), PDFHexString.of(id)]) : ctx.obj([PDFHexString.of(id), PDFHexString.of(id)])
  ctx.trailerInfo.Encrypt = undefined

  return { pdf: await doc.save({ useObjectStreams: false, updateFieldAppearances: false }), report }
}

const safeDate = (d: Date | undefined) => (d && !Number.isNaN(d.getTime()) ? d : undefined)
