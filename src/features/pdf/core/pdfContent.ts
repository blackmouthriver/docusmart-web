/**
 * Edición del contenido de una página PDF (W-140): lee los operadores de dibujo, sigue la
 * posición del texto (matrices, fuente, tamaño, espaciados) y quita los operadores que
 * escriben el texto que cae dentro de unas zonas. Así "reemplazar texto" borra de verdad el
 * texto original (ya no se puede seleccionar ni buscar, y no queda un parche blanco sobre
 * fondos de color), en vez de solo taparlo.
 *
 * Solo toca el contenido directo de la página: el texto dentro de formularios (Form XObject)
 * no se borra y quien llama lo tapa como antes.
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, decodePDFRawStream, type PDFDocument, type PDFPage } from 'pdf-lib'
import { Encodings, Font, type IFontNames } from '@pdf-lib/standard-fonts'

/* ───────────── Tokens y operaciones ───────────── */

export type Operand = number | string | { name: string } | { bytes: Uint8Array } | Operand[] | { dict: true }
/** Una operación: sus operandos, el operador y dónde está en el contenido (para quitarla). */
export type Op = { op: string; args: Operand[]; start: number; end: number }

const WS = new Set([0, 9, 10, 12, 13, 32])
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37])

/** Separa el contenido (bytes de los content streams) en operaciones. */
export function parseContent(data: Uint8Array): Op[] {
  const ops: Op[] = []
  let i = 0
  let args: Operand[] = []
  let opStart = -1
  const n = data.length
  const skipWs = () => {
    while (i < n) {
      if (WS.has(data[i])) i++
      else if (data[i] === 37) while (i < n && data[i] !== 10 && data[i] !== 13) i++ // comentario
      else break
    }
  }
  const literal = (): Uint8Array => {
    // (texto con \escapes y paréntesis anidados)
    i++
    const out: number[] = []
    let depth = 1
    while (i < n) {
      const c = data[i++]
      if (c === 92) {
        const e = data[i++]
        const map: Record<number, number> = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12 }
        if (e in map) out.push(map[e])
        else if (e >= 48 && e <= 55) {
          let v = e - 48
          for (let k = 0; k < 2 && data[i] >= 48 && data[i] <= 55; k++) v = v * 8 + (data[i++] - 48)
          out.push(v & 255)
        } else if (e === 13) {
          if (data[i] === 10) i++
        } else if (e !== 10) out.push(e)
      } else if (c === 40) {
        depth++
        out.push(c)
      } else if (c === 41) {
        if (--depth === 0) break
        out.push(c)
      } else out.push(c)
    }
    return Uint8Array.from(out)
  }
  const hex = (): Uint8Array => {
    i++
    let s = ''
    while (i < n && data[i] !== 62) {
      if (!WS.has(data[i])) s += String.fromCharCode(data[i])
      i++
    }
    i++
    if (s.length % 2) s += '0'
    return Uint8Array.from(s.match(/../g) ?? [], (h) => parseInt(h, 16))
  }
  const regular = () => {
    const s0 = i
    while (i < n && !WS.has(data[i]) && !DELIM.has(data[i])) i++
    return String.fromCharCode(...data.subarray(s0, i))
  }
  const value = (): Operand | null => {
    skipWs()
    if (i >= n) return null
    const c = data[i]
    if (c === 40) return { bytes: literal() }
    if (c === 60 && data[i + 1] === 60) {
      // Diccionario (propiedades de contenido marcado): se salta.
      let depth = 0
      while (i < n) {
        if (data[i] === 60 && data[i + 1] === 60) (depth++, (i += 2))
        else if (data[i] === 62 && data[i + 1] === 62) {
          i += 2
          if (--depth === 0) break
        } else if (data[i] === 40) literal()
        else i++
      }
      return { dict: true }
    }
    if (c === 60) return { bytes: hex() }
    if (c === 91) {
      i++
      const arr: Operand[] = []
      for (;;) {
        skipWs()
        if (i >= n) break
        if (data[i] === 93) {
          i++
          break
        }
        const v = value()
        if (v === null) break
        arr.push(v)
      }
      return arr
    }
    if (c === 47) {
      i++
      return { name: regular() }
    }
    if (c === 41 || c === 62 || c === 93 || c === 123 || c === 125) {
      i++
      return value()
    }
    const word = regular()
    const num = Number(word)
    return word !== '' && Number.isFinite(num) && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(word) ? num : word
  }
  while (i < n) {
    skipWs()
    if (i >= n) break
    if (opStart < 0) opStart = i
    const v = value()
    if (v === null) break
    if (typeof v === 'string') {
      // Un operador cierra la operación.
      const end = i
      if (v === 'BI') {
        // Imagen en línea: BI … ID <datos binarios> EI.
        while (i < n && !(data[i] === 73 && data[i + 1] === 68 && WS.has(data[i + 2] ?? 32) && WS.has(data[i - 1] ?? 32))) i++
        i += 3
        while (i < n && !(data[i] === 69 && data[i + 1] === 73 && WS.has(data[i - 1]) && (i + 2 >= n || WS.has(data[i + 2])))) i++
        i += 2
        ops.push({ op: 'BI', args: [], start: opStart, end: i })
      } else ops.push({ op: v, args, start: opStart, end })
      args = []
      opStart = -1
    } else args.push(v)
  }
  return ops
}

/* ───────────── Fuentes: ancho de cada código ───────────── */

type FontMetrics = { bytesPerCode: 1 | 2; width: (code: number) => number; spaceIsWordSpace: boolean }

const STANDARD = new Map<string, IFontNames>([
  ['Helvetica', 'Helvetica'], ['Helvetica-Bold', 'Helvetica-Bold'], ['Helvetica-Oblique', 'Helvetica-Oblique'], ['Helvetica-BoldOblique', 'Helvetica-BoldOblique'],
  ['Times-Roman', 'Times-Roman'], ['Times-Bold', 'Times-Bold'], ['Times-Italic', 'Times-Italic'], ['Times-BoldItalic', 'Times-BoldItalic'],
  ['Courier', 'Courier'], ['Courier-Bold', 'Courier-Bold'], ['Courier-Oblique', 'Courier-Oblique'], ['Courier-BoldOblique', 'Courier-BoldOblique'],
  ['Arial', 'Helvetica'], ['ArialMT', 'Helvetica'], ['Arial-BoldMT', 'Helvetica-Bold'], ['TimesNewRoman', 'Times-Roman'], ['TimesNewRomanPSMT', 'Times-Roman'],
])
let winAnsiNames: Map<number, string> | null = null
const winAnsi = () => {
  if (!winAnsiNames) {
    winAnsiNames = new Map()
    for (const cp of Encodings.WinAnsi.supportedCodePoints) {
      const { code, name } = Encodings.WinAnsi.encodeUnicodeCodePoint(cp)
      winAnsiNames.set(code, name)
    }
  }
  return winAnsiNames
}

const num = (o: unknown, d = 0) => (o instanceof PDFNumber ? o.asNumber() : d)

function fontMetrics(doc: PDFDocument, font: PDFDict | undefined): FontMetrics {
  const fallback: FontMetrics = { bytesPerCode: 1, width: () => 500, spaceIsWordSpace: true }
  if (!font) return fallback
  const get = (d: PDFDict, k: string) => {
    const v = d.get(PDFName.of(k))
    return v instanceof PDFRef ? doc.context.lookup(v) : v
  }
  const subtype = String(get(font, 'Subtype') ?? '')
  if (subtype === '/Type0') {
    const desc = get(font, 'DescendantFonts')
    const cid = desc instanceof PDFArray ? (doc.context.lookup(desc.get(0)) as PDFDict | undefined) : undefined
    const widths = new Map<number, number>()
    const dw = cid ? num(get(cid, 'DW'), 1000) : 1000
    const w = cid && get(cid, 'W')
    if (w instanceof PDFArray) {
      // [c [w1 w2 …]] o [c1 c2 w]
      for (let k = 0; k < w.size(); ) {
        const first = num(w.lookup(k))
        const next = w.lookup(k + 1)
        if (next instanceof PDFArray) {
          for (let m = 0; m < next.size(); m++) widths.set(first + m, num(next.lookup(m)))
          k += 2
        } else {
          const last = num(next)
          const width = num(w.lookup(k + 2))
          for (let c = first; c <= last && c - first < 65536; c++) widths.set(c, width)
          k += 3
        }
      }
    }
    return { bytesPerCode: 2, width: (c) => widths.get(c) ?? dw, spaceIsWordSpace: false }
  }
  const first = num(get(font, 'FirstChar'))
  const ws = get(font, 'Widths')
  if (ws instanceof PDFArray) {
    const arr = Array.from({ length: ws.size() }, (_, k) => num(ws.lookup(k)))
    const missing = num(get(get(font, 'FontDescriptor') as PDFDict, 'MissingWidth'), 500)
    return { bytesPerCode: 1, width: (c) => arr[c - first] ?? missing, spaceIsWordSpace: true }
  }
  // Las 14 fuentes estándar no traen anchos: salen de sus métricas.
  const base = String(get(font, 'BaseFont') ?? '').replace(/^\/([A-Z]{6}\+)?/, '').replace(/,/g, '-')
  const std = STANDARD.get(base)
  if (std) {
    const metrics = Font.load(std)
    const names = winAnsi()
    return { bytesPerCode: 1, width: (c) => metrics.getWidthOfGlyph(names.get(c) ?? 'space') ?? 500, spaceIsWordSpace: true }
  }
  return fallback
}

/* ───────────── Posición del texto ───────────── */

type M = [number, number, number, number, number, number]
const mul = (a: M, b: M): M => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]]
const I: M = [1, 0, 0, 1, 0, 0]

/** Lo que dibuja cada operación de texto: su caja en el espacio de la página (y hacia arriba). */
export type TextRun = { index: number; x0: number; x1: number; y: number; size: number }

/** Recorre las operaciones y devuelve, para cada una que escribe texto, dónde lo escribe. */
export function textRuns(ops: Op[], fontFor: (name: string) => FontMetrics): TextRun[] {
  const runs: TextRun[] = []
  let ctm: M = I
  const stack: M[] = []
  let tm: M = I
  let tlm: M = I
  let font: FontMetrics = { bytesPerCode: 1, width: () => 500, spaceIsWordSpace: true }
  let size = 12
  let tc = 0
  let tw = 0
  let th = 1
  let tl = 0
  let rise = 0
  const nums = (o: Op) => o.args.map((a) => (typeof a === 'number' ? a : 0))
  const td = (x: number, y: number) => {
    tlm = mul([1, 0, 0, 1, x, y], tlm)
    tm = tlm
  }
  const show = (index: number, items: Operand[]) => {
    const trm0 = mul([size * th, 0, 0, size, 0, rise], mul(tm, ctm))
    let adv = 0
    for (const it of items) {
      if (typeof it === 'number') adv -= (it / 1000) * size * th
      else if (it && typeof it === 'object' && 'bytes' in it) {
        const b = it.bytes
        for (let k = 0; k + font.bytesPerCode <= b.length; k += font.bytesPerCode) {
          const code = font.bytesPerCode === 2 ? (b[k] << 8) | b[k + 1] : b[k]
          adv += ((font.width(code) / 1000) * size + tc + (font.spaceIsWordSpace && code === 32 ? tw : 0)) * th
        }
      }
    }
    const end = mul([1, 0, 0, 1, adv, 0], tm)
    const trm1 = mul([size * th, 0, 0, size, 0, rise], mul(end, ctm))
    // Tamaño visible: la escala vertical de la matriz.
    const vis = Math.hypot(trm0[2], trm0[3])
    runs.push({ index, x0: Math.min(trm0[4], trm1[4]), x1: Math.max(trm0[4], trm1[4]), y: trm0[5], size: vis })
    tm = end
  }
  for (const [k, o] of ops.entries()) {
    const a = nums(o)
    switch (o.op) {
      case 'q':
        stack.push(ctm)
        break
      case 'Q':
        ctm = stack.pop() ?? ctm
        break
      case 'cm':
        ctm = mul(a as M, ctm)
        break
      case 'BT':
        tm = tlm = I
        break
      case 'Tf': {
        const name = o.args[0]
        if (name && typeof name === 'object' && 'name' in name) font = fontFor(name.name)
        size = a[1] ?? size
        break
      }
      case 'Tc':
        tc = a[0]
        break
      case 'Tw':
        tw = a[0]
        break
      case 'Tz':
        th = a[0] / 100
        break
      case 'TL':
        tl = a[0]
        break
      case 'Ts':
        rise = a[0]
        break
      case 'Td':
        td(a[0], a[1])
        break
      case 'TD':
        tl = -a[1]
        td(a[0], a[1])
        break
      case 'Tm':
        tm = tlm = a as M
        break
      case 'T*':
        td(0, -tl)
        break
      case 'Tj':
        show(k, [o.args[0]])
        break
      case 'TJ':
        show(k, Array.isArray(o.args[0]) ? o.args[0] : [])
        break
      case "'":
        td(0, -tl)
        show(k, [o.args[0]])
        break
      case '"':
        tw = a[0]
        tc = a[1]
        td(0, -tl)
        show(k, [o.args[2]])
        break
    }
  }
  return runs
}

/* ───────────── Borrar texto de una página ───────────── */

/** Zona en el espacio de la página (y hacia arriba), como la devuelve viewRectToPdf. */
export type Zone = { x: number; y: number; width: number; height: number }

function pageContent(page: PDFPage): Uint8Array {
  const doc = page.doc
  const contents = page.node.Contents()
  const refs = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : []
  const parts = refs.map((r) => {
    const s = r instanceof PDFRef ? doc.context.lookup(r) : r
    if (s instanceof PDFRawStream) return decodePDFRawStream(s).decode()
    // Contenido agregado con pdf-lib y todavía sin guardar.
    const u = s as { getUnencodedContents?: () => Uint8Array } | undefined
    return u?.getUnencodedContents ? u.getUnencodedContents() : new Uint8Array()
  })
  const total = parts.reduce((t, p) => t + p.length + 1, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
    out[o++] = 10
  }
  return out
}

/**
 * Quita el texto que la página escribe dentro de cada zona. Devuelve, por zona, si encontró
 * y quitó algo (si no, quien llama la tapa como antes).
 */
export function eraseText(doc: PDFDocument, pageIndex: number, zones: Zone[]): boolean[] {
  const page = doc.getPage(pageIndex)
  const found = zones.map(() => false)
  if (!zones.length) return found
  const data = pageContent(page)
  const ops = parseContent(data)
  const fonts = page.node.Resources()?.lookup(PDFName.of('Font'))
  const cache = new Map<string, FontMetrics>()
  const fontFor = (name: string) => {
    if (!cache.has(name)) {
      const ref = fonts instanceof PDFDict ? fonts.get(PDFName.of(name)) : undefined
      const dict = ref instanceof PDFRef ? doc.context.lookup(ref) : ref
      cache.set(name, fontMetrics(doc, dict instanceof PDFDict ? dict : undefined))
    }
    return cache.get(name)!
  }
  const remove = new Set<number>()
  for (const r of textRuns(ops, fontFor)) {
    zones.forEach((z, k) => {
      // La línea base dentro de la zona y la mayor parte del texto dentro de su ancho.
      const inY = r.y >= z.y - r.size * 0.1 && r.y <= z.y + z.height
      const overlap = Math.min(r.x1, z.x + z.width) - Math.max(r.x0, z.x)
      const wide = Math.max(0.5, r.x1 - r.x0)
      if (inY && overlap >= 0.5 * wide) {
        remove.add(r.index)
        found[k] = true
      }
    })
  }
  if (!remove.size) return found
  // El contenido nuevo: el original sin esas operaciones (las de ' y " siguen bajando de línea).
  const dec = new TextDecoder('latin1')
  let out = ''
  let pos = 0
  for (const [k, o] of ops.entries()) {
    if (!remove.has(k)) continue
    out += dec.decode(data.subarray(pos, o.start))
    if (o.op === "'") out += 'T* '
    else if (o.op === '"') out += `${o.args[0]} Tw ${o.args[1]} Tc T* `
    pos = o.end
  }
  out += dec.decode(data.subarray(pos))
  const bytes = Uint8Array.from(out, (c) => c.charCodeAt(0))
  page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(bytes)))
  return found
}
