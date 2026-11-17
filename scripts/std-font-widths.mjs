// Genera src/app/lib/pdfaFonts.json: para cada una de las 14 fuentes estándar de
// PDF, la fuente libre de pdf.js que la reemplaza al convertir a PDF/A y el ancho
// de cada código (32–255) leído del propio programa de fuente. PDF/A exige que
// los anchos del diccionario coincidan con los de la fuente incrustada.
// Uso: node scripts/std-font-widths.mjs (solo hace falta al actualizar pdfjs-dist).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const root = join(import.meta.dirname, '..')
const require = createRequire(join(root, 'package.json'))
const { Font, Encodings } = require('@pdf-lib/standard-fonts')
const fontsDir = join(root, 'node_modules', 'pdfjs-dist', 'standard_fonts')

// Cadenas estándar de CFF (las mismas que usa pdf.js)
const worker = readFileSync(join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'), 'utf8')
const STD_STRINGS = JSON.parse(/CFFStandardStrings = (\[[^\]]*\])/.exec(worker)[1])

const FILES = {
  Helvetica: 'LiberationSans-Regular.ttf',
  'Helvetica-Bold': 'LiberationSans-Bold.ttf',
  'Helvetica-Oblique': 'LiberationSans-Italic.ttf',
  'Helvetica-BoldOblique': 'LiberationSans-BoldItalic.ttf',
  'Times-Roman': 'FoxitSerif.pfb',
  'Times-Bold': 'FoxitSerifBold.pfb',
  'Times-Italic': 'FoxitSerifItalic.pfb',
  'Times-BoldItalic': 'FoxitSerifBoldItalic.pfb',
  Courier: 'FoxitFixed.pfb',
  'Courier-Bold': 'FoxitFixedBold.pfb',
  'Courier-Oblique': 'FoxitFixedItalic.pfb',
  'Courier-BoldOblique': 'FoxitFixedBoldItalic.pfb',
  Symbol: 'FoxitSymbol.pfb',
  ZapfDingbats: 'FoxitDingbats.pfb',
}

/* ───────── TrueType: cmap (3,1) formato 4 + hmtx ───────── */
function ttfWidths(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const tables = {}
  for (let i = 0, n = v.getUint16(4); i < n; i++) {
    const o = 12 + 16 * i
    tables[String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3])] = v.getUint32(o + 8)
  }
  const upem = v.getUint16(tables.head + 18)
  const nMetrics = v.getUint16(tables.hhea + 34)
  const advance = (gid) => v.getUint16(tables.hmtx + 4 * Math.min(gid, nMetrics - 1))
  let sub = -1
  for (let i = 0, n = v.getUint16(tables.cmap + 2); i < n; i++) {
    const o = tables.cmap + 4 + 8 * i
    if (v.getUint16(o) === 3 && v.getUint16(o + 2) === 1) sub = tables.cmap + v.getUint32(o + 4)
  }
  const segX2 = v.getUint16(sub + 6)
  const ends = sub + 14
  const starts = ends + segX2 + 2
  const deltas = starts + segX2
  const ranges = deltas + segX2
  const gidOf = (cp) => {
    for (let s = 0; s < segX2 / 2; s++) {
      if (cp > v.getUint16(ends + 2 * s)) continue
      const start = v.getUint16(starts + 2 * s)
      if (cp < start) return 0
      const ro = v.getUint16(ranges + 2 * s)
      if (!ro) return (cp + v.getInt16(deltas + 2 * s)) & 0xffff
      const g = v.getUint16(ranges + 2 * s + ro + 2 * (cp - start))
      return g ? (g + v.getInt16(deltas + 2 * s)) & 0xffff : 0
    }
    return 0
  }
  return (cp) => {
    const gid = gidOf(cp)
    return gid ? Math.round((advance(gid) * 1000) / upem) : null
  }
}

/* ───────── CFF: charset + ancho de cada charstring Type 2 ───────── */
function cffWidths(b) {
  let p = b[2]
  const index = () => {
    const count = (b[p] << 8) | b[p + 1]
    if (!count) {
      p += 2
      return []
    }
    const os = b[p + 2]
    const off = (i) => {
      let x = 0
      for (let k = 0; k < os; k++) x = (x << 8) | b[p + 3 + i * os + k]
      return x
    }
    const base = p + 3 + (count + 1) * os - 1
    const items = Array.from({ length: count }, (_, i) => b.subarray(base + off(i), base + off(i + 1)))
    p = base + off(count)
    return items
  }
  const dict = (d) => {
    const out = {}
    let ops = []
    for (let i = 0; i < d.length; ) {
      const x = d[i]
      if (x <= 21) {
        const key = x === 12 ? 1200 + d[++i] : x
        out[key] = ops
        ops = []
        i++
      } else if (x === 28) (ops.push((((d[i + 1] << 8) | d[i + 2]) << 16) >> 16), (i += 3))
      else if (x === 29) (ops.push((d[i + 1] << 24) | (d[i + 2] << 16) | (d[i + 3] << 8) | d[i + 4]), (i += 5))
      else if (x === 30) {
        i++
        while ((d[i] & 0x0f) !== 0x0f && (d[i] >> 4) !== 0x0f) i++
        i++
        ops.push(0)
      } else if (x >= 32 && x <= 246) (ops.push(x - 139), i++)
      else if (x >= 247 && x <= 250) (ops.push((x - 247) * 256 + d[i + 1] + 108), (i += 2))
      else if (x >= 251 && x <= 254) (ops.push(-(x - 251) * 256 - d[i + 1] - 108), (i += 2))
      else i++
    }
    return out
  }
  index() // nombres
  const top = dict(index()[0])
  const strings = index()
  const globalSubrs = index()
  const sid = (n) => (n < STD_STRINGS.length ? STD_STRINGS[n] : new TextDecoder().decode(strings[n - STD_STRINGS.length]))
  p = top[17][0]
  const chars = index()
  const [privSize, privOff] = top[18]
  const priv = dict(b.subarray(privOff, privOff + privSize))
  const defaultW = priv[20]?.[0] ?? 0
  const nominalW = priv[21]?.[0] ?? 0
  let localSubrs = []
  if (priv[19]) {
    p = privOff + priv[19][0]
    localSubrs = index()
  }
  // charset
  const names = ['.notdef']
  let c = top[15][0]
  const fmt = b[c++]
  while (names.length < chars.length) {
    const first = (b[c] << 8) | b[c + 1]
    if (fmt === 0) {
      names.push(sid(first))
      c += 2
    } else {
      const left = fmt === 1 ? b[c + 2] : (b[c + 2] << 8) | b[c + 3]
      for (let k = 0; k <= left; k++) names.push(sid(first + k))
      c += fmt === 1 ? 3 : 4
    }
  }
  // Ancho: el primer operando sobrante antes del primer operador (siguiendo
  // las subrutinas locales y globales, que pueden ir antes).
  const bias = (n) => (n < 1240 ? 107 : n < 33900 ? 1131 : 32768)
  const widthOf = (glyph) => {
    const stack = []
    const run = (cs) => {
      for (let i = 0; i < cs.length; ) {
        const x = cs[i]
        if (x === 28) {
          stack.push((((cs[i + 1] << 8) | cs[i + 2]) << 16) >> 16)
          i += 3
        } else if (x >= 32 && x <= 246) (stack.push(x - 139), i++)
        else if (x >= 247 && x <= 250) (stack.push((x - 247) * 256 + cs[i + 1] + 108), (i += 2))
        else if (x >= 251 && x <= 254) (stack.push(-(x - 251) * 256 - cs[i + 1] - 108), (i += 2))
        else if (x === 255) (stack.push(((cs[i + 1] << 24) | (cs[i + 2] << 16) | (cs[i + 3] << 8) | cs[i + 4]) / 65536), (i += 5))
        else if (x === 10 || x === 29) {
          const subrs = x === 10 ? localSubrs : globalSubrs
          const r = run(subrs[stack.pop() + bias(subrs.length)])
          if (r !== undefined) return r
          i++
        } else if (x === 11) return undefined
        else {
          const n = stack.length
          const has = [1, 3, 18, 23, 19, 20].includes(x) ? n % 2 === 1 : x === 21 ? n === 3 : x === 4 || x === 22 ? n === 2 : x === 14 ? n === 1 || n === 5 : null
          if (has === null) throw new Error(`operador ${x} antes del ancho`)
          return has ? nominalW + stack[0] : defaultW
        }
      }
      return undefined
    }
    return run(glyph) ?? defaultW
  }
  const byName = new Map(names.map((nm, i) => [nm, Math.round(widthOf(chars[i]))]))
  return (name) => byName.get(name) ?? null
}

const winAnsi = {}
for (const cp of Encodings.WinAnsi.supportedCodePoints) {
  const { code, name } = Encodings.WinAnsi.encodeUnicodeCodePoint(cp)
  winAnsi[code] = { name, cp }
}

// Códigos de la codificación propia de Symbol y ZapfDingbats
const builtIn = { Symbol: {}, ZapfDingbats: {} }
for (const enc of ['Symbol', 'ZapfDingbats']) {
  for (const cp of Encodings[enc].supportedCodePoints) {
    const { code, name } = Encodings[enc].encodeUnicodeCodePoint(cp)
    builtIn[enc][code] = name
  }
}

const out = {}
for (const [base, file] of Object.entries(FILES)) {
  const bytes = new Uint8Array(readFileSync(join(fontsDir, file)))
  const symbolic = base === 'Symbol' || base === 'ZapfDingbats'
  const afm = Font.load(base)
  const ttf = file.endsWith('.ttf')
  const lookup = ttf ? ttfWidths(bytes) : cffWidths(bytes)
  const widths = []
  const names = []
  for (let code = 32; code <= 255; code++) {
    let w = null
    let name = null
    if (symbolic) {
      name = builtIn[base][code] ?? null
      w = name ? lookup(name) : null
    } else if (winAnsi[code]) {
      name = winAnsi[code].name
      w = ttf ? lookup(winAnsi[code].cp) : lookup(name)
    }
    widths.push(w ?? 0)
    names.push(w === null ? null : name)
  }
  const [x1, y1, x2, y2] = afm.FontBBox
  out[base] = {
    file,
    kind: ttf ? 'ttf' : 'cff',
    symbolic,
    bbox: [x1, y1, x2, y2],
    italicAngle: afm.ItalicAngle ?? 0,
    ascent: afm.Ascender ?? y2,
    descent: afm.Descender ?? y1,
    capHeight: afm.CapHeight ?? y2,
    widths,
    // Códigos sin glifo en la fuente sustituta (no se pueden dibujar).
    missing: names.map((n, i) => (n === null ? i + 32 : -1)).filter((c) => c >= 0 && (symbolic ? builtIn[base][c] : winAnsi[c])),
    ...(symbolic ? { names } : {}),
  }
}
writeFileSync(join(root, 'src', 'app', 'lib', 'pdfaFonts.json'), JSON.stringify(out) + '\n')
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(22), v.file.padEnd(28), 'sin glifo:', v.missing.length ? v.missing.join(',') : '—')
