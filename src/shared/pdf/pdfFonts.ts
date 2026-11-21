/**
 * Fuentes para los PDF que genera DocuSmart. Las fuentes estándar de PDF solo dibujan latín
 * básico (WinAnsi): el ruso, el griego, el polaco o el japonés se perdían. Aquí se incrustan
 * fuentes libres, solo con las letras usadas (subconjunto):
 *   sans  → Carlito (mismas medidas que Calibri)      serif → Tinos (Times New Roman)
 *   mono  → Cousine (Courier New)                     chino y japonés → Droid Sans Fallback
 *   coreano → Nanum Gothic
 * Se sirven desde /pdf-fonts/ y se descargan solo las que hacen falta. Sin conexión (y sin las
 * fuentes en caché) se vuelve a las fuentes estándar de antes, para que el PDF se genere igual.
 */
import { StandardFonts, type PDFDocument, type PDFFont } from 'pdf-lib'
import * as fontkit from 'fontkit'

export type FontFamily = 'sans' | 'serif' | 'mono'
export type FontStyle = 'regular' | 'bold' | 'italic' | 'boldItalic'
export const FONT_STYLES: readonly FontStyle[] = ['regular', 'bold', 'italic', 'boldItalic']

export const FONT_BASE = '/pdf-fonts/'
const FILES: Record<FontFamily, Record<FontStyle, string>> = {
  sans: { regular: 'Carlito-Regular.ttf', bold: 'Carlito-Bold.ttf', italic: 'Carlito-Italic.ttf', boldItalic: 'Carlito-BoldItalic.ttf' },
  serif: { regular: 'Tinos-Regular.ttf', bold: 'Tinos-Bold.ttf', italic: 'Tinos-Italic.ttf', boldItalic: 'Tinos-BoldItalic.ttf' },
  mono: { regular: 'Cousine-Regular.ttf', bold: 'Cousine-Bold.ttf', italic: 'Cousine-Regular.ttf', boldItalic: 'Cousine-Bold.ttf' },
}
const CJK_FILE = 'DroidSansFallbackFull.ttf'
const HANGUL_FILE = 'NanumGothic-Regular.ttf'

const STANDARD: Record<FontFamily, Record<FontStyle, StandardFonts>> = {
  sans: { regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold, italic: StandardFonts.HelveticaOblique, boldItalic: StandardFonts.HelveticaBoldOblique },
  serif: { regular: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold, italic: StandardFonts.TimesRomanItalic, boldItalic: StandardFonts.TimesRomanBoldItalic },
  mono: { regular: StandardFonts.Courier, bold: StandardFonts.CourierBold, italic: StandardFonts.CourierOblique, boldItalic: StandardFonts.CourierBoldOblique },
}

/* ───────────── Escrituras ───────────── */

export const isHangul = (cp: number) => (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f) || (cp >= 0xa960 && cp <= 0xa97f) || (cp >= 0xd7b0 && cp <= 0xd7ff)
/** Chino, kana japonés y signos de ancho completo (donde se puede cortar la línea entre dos caracteres). */
export const isCjk = (cp: number) =>
  !isHangul(cp) &&
  ((cp >= 0x2e80 && cp <= 0x2fdf) || (cp >= 0x3000 && cp <= 0x30ff) || (cp >= 0x3190 && cp <= 0x31ff) || (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xffef) || (cp >= 0x20000 && cp <= 0x2fa1f))

/** ¿Lo dibujan las fuentes estándar de PDF (WinAnsi)? */
export const isWinAnsiChar = (ch: string) => /^[\x20-\x7E\xA0-\xFF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]$/.test(ch)
export const isWinAnsi = (text: string) => [...text].every((ch) => ch === '\n' || isWinAnsiChar(ch))

export function scriptsOf(text: string): { cjk: boolean; hangul: boolean } {
  let cjk = false
  let hangul = false
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    if (isHangul(cp)) hangul = true
    else if (isCjk(cp)) cjk = true
    if (cjk && hangul) break
  }
  return { cjk, hangul }
}

/* ───────────── Carga ───────────── */

export type FontLoader = (file: string) => Promise<Uint8Array>

const fetchLoader: FontLoader = async (file) => {
  const res = await fetch(FONT_BASE + file)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}
let loader: FontLoader = fetchLoader
const bytesCache = new Map<string, Promise<Uint8Array>>()

/** Para las pruebas (en Node las fuentes se leen del disco). */
export function setFontLoader(l: FontLoader | null): void {
  loader = l ?? fetchLoader
  bytesCache.clear()
}

function load(file: string): Promise<Uint8Array> {
  let p = bytesCache.get(file)
  if (!p) {
    p = loader(file)
    bytesCache.set(file, p)
    // Si falla, la próxima vez se intenta de nuevo.
    p.catch(() => bytesCache.delete(file))
  }
  return p
}

/**
 * pdf-lib espera el API de @pdf-lib/fontkit (subset.encodeStream con eventos), cuyo subconjunto
 * pierde letras con estas fuentes; fontkit 2 lo hace bien y tiene encode(): se adapta.
 */
const fontkitAdapter = {
  create(data: Uint8Array) {
    const font = fontkit.create(data) as fontkit.FontkitFont & { createSubset(): fontkit.FontkitSubset & { encodeStream?: unknown } }
    const createSubset = font.createSubset.bind(font)
    font.createSubset = () => {
      const subset = createSubset() as fontkit.FontkitSubset & { encodeStream?: unknown }
      subset.encodeStream = () => {
        const on: Record<string, (x?: unknown) => void> = {}
        const stream = {
          on(ev: string, fn: (x?: unknown) => void) {
            on[ev] = fn
            return stream
          },
        }
        queueMicrotask(() => {
          try {
            on.data?.(subset.encode())
            on.end?.()
          } catch (e) {
            on.error?.(e)
          }
        })
        return stream
      }
      return subset
    }
    return font
  },
}

/* ───────────── Juego de fuentes ───────────── */

export type Piece = { text: string; font: PDFFont; space: boolean }
type Face = { font: PDFFont; has: (cp: number) => boolean }

export class FontSet {
  constructor(
    private readonly faces: Partial<Record<FontStyle, Face>>,
    private readonly cjk?: Face,
    private readonly hangul?: Face,
    /** true si se usaron las fuentes estándar (sin conexión). */
    readonly standard = false,
  ) {}

  /** Fuente de un estilo (si no se cargó, la normal). */
  font(style: FontStyle = 'regular'): PDFFont {
    return (this.faces[style] ?? this.faces.regular)!.font
  }

  private faceFor(cp: number, style: FontStyle): Face | null {
    const main = this.faces[style] ?? this.faces.regular!
    if (isHangul(cp)) return this.hangul?.has(cp) ? this.hangul : null
    if (main.has(cp)) return main
    if (this.cjk?.has(cp)) return this.cjk
    if (this.hangul?.has(cp)) return this.hangul
    return null
  }

  /**
   * El texto en piezas para diagramar: espacios, palabras (cortadas donde cambia la fuente) y
   * cada carácter chino o japonés por separado, porque ahí se puede cortar la línea. Lo que
   * ninguna fuente dibuja (por ejemplo, emojis) se omite.
   */
  pieces(text: string, style: FontStyle = 'regular'): Piece[] {
    const out: Piece[] = []
    let word = ''
    let wordFont: PDFFont | null = null
    const flush = () => {
      if (word && wordFont) out.push({ text: word, font: wordFont, space: false })
      word = ''
      wordFont = null
    }
    for (const raw of text.replace(/\t/g, '    ')) {
      if (/\s/.test(raw)) {
        flush()
        const last = out[out.length - 1]
        if (last?.space) continue
        out.push({ text: ' ', font: this.font(style), space: true })
        continue
      }
      const cp = raw.codePointAt(0)!
      const face = this.faceFor(cp, style)
      if (!face) continue
      if (isCjk(cp)) {
        flush()
        out.push({ text: raw, font: face.font, space: false })
        continue
      }
      if (wordFont && wordFont !== face.font) flush()
      word += raw
      wordFont = face.font
    }
    flush()
    return out
  }

  /** El texto sin lo que ninguna fuente dibuja (para medirlo o dibujarlo con una sola fuente). */
  printable(text: string, style: FontStyle = 'regular'): string {
    return this.pieces(text, style)
      .map((p) => p.text)
      .join('')
  }
}

/** Ancho de una línea de piezas. */
export const piecesWidth = (pieces: readonly Piece[], size: number) => pieces.reduce((w, p) => w + p.font.widthOfTextAtSize(p.text, size), 0)

/**
 * Corta las piezas en líneas que caben en `width` (por palabras y entre caracteres chinos o
 * japoneses); una palabra más larga que la línea se parte por letras.
 */
export function wrapPieces(pieces: readonly Piece[], size: number, width: number): Piece[][] {
  const lines: Piece[][] = []
  let line: Piece[] = []
  let w = 0
  const push = () => {
    while (line.length && line[line.length - 1].space) line.pop()
    if (line.length) lines.push(line)
    line = []
    w = 0
  }
  for (const p of pieces) {
    if (p.space && !line.length) continue
    const pw = p.font.widthOfTextAtSize(p.text, size)
    if (w + pw <= width || p.space) {
      line.push(p)
      w += pw
      continue
    }
    push()
    if (pw <= width) {
      line.push(p)
      w = pw
      continue
    }
    let rest = p.text
    while (rest) {
      let n = rest.length
      while (n > 1 && p.font.widthOfTextAtSize(rest.slice(0, n), size) > width) n--
      line.push({ ...p, text: rest.slice(0, n) })
      rest = rest.slice(n)
      if (rest) push()
      else w = p.font.widthOfTextAtSize(line[line.length - 1].text, size)
    }
  }
  push()
  return lines
}

/** Dibuja una línea de piezas desde (x, y) en la dirección del ángulo (en grados). */
export function drawPieces(
  page: { drawText(text: string, o: object): void },
  pieces: readonly Piece[],
  o: { x: number; y: number; size: number; color?: unknown; opacity?: number; rotateDeg?: number; degrees?: (d: number) => unknown },
): void {
  const a = ((o.rotateDeg ?? 0) * Math.PI) / 180
  let advance = 0
  for (const p of pieces) {
    const w = p.font.widthOfTextAtSize(p.text, o.size)
    if (!p.space)
      page.drawText(p.text, {
        x: o.x + advance * Math.cos(a),
        y: o.y + advance * Math.sin(a),
        size: o.size,
        font: p.font,
        ...(o.color !== undefined && { color: o.color }),
        ...(o.opacity !== undefined && { opacity: o.opacity }),
        ...(o.rotateDeg && o.degrees && { rotate: o.degrees(o.rotateDeg) }),
      })
    advance += w
  }
}

const has = (data: Uint8Array) => {
  const f = fontkit.create(data)
  return (cp: number) => f.hasGlyphForCodePoint(cp)
}

async function standardSet(doc: PDFDocument, family: FontFamily, styles: Iterable<FontStyle>): Promise<FontSet> {
  const faces: Partial<Record<FontStyle, Face>> = {}
  for (const s of new Set<FontStyle>(['regular', ...styles])) faces[s] = { font: await doc.embedFont(STANDARD[family][s]), has: (cp) => isWinAnsiChar(String.fromCodePoint(cp)) }
  return new FontSet(faces, undefined, undefined, true)
}

/**
 * Las fuentes para un documento: la familia en los estilos pedidos (la normal siempre) y, si el
 * texto tiene chino, japonés o coreano, su fuente. `text` es todo el texto que se va a dibujar.
 */
export async function loadFonts(doc: PDFDocument, family: FontFamily, styles: Iterable<FontStyle>, text: string): Promise<FontSet> {
  const wanted = new Set<FontStyle>(['regular', ...styles])
  try {
    doc.registerFontkit(fontkitAdapter as never)
    const faces: Partial<Record<FontStyle, Face>> = {}
    for (const s of wanted) {
      const data = await load(FILES[family][s])
      faces[s] = { font: await doc.embedFont(data, { subset: true }), has: has(data) }
    }
    const scripts = scriptsOf(text)
    const extra = async (file: string): Promise<Face> => {
      const data = await load(file)
      return { font: await doc.embedFont(data, { subset: true }), has: has(data) }
    }
    const cjk = scripts.cjk ? await extra(CJK_FILE) : undefined
    const hangul = scripts.hangul ? await extra(HANGUL_FILE) : undefined
    return new FontSet(faces, cjk, hangul)
  } catch {
    // Sin conexión o sin las fuentes: las estándar de PDF (solo latín básico), como antes.
    return standardSet(doc, family, wanted)
  }
}

/**
 * Para agregar texto a un PDF existente (marca de agua, texto editado): si alcanza con las fuentes
 * estándar no se descarga nada; si no, se usa la fuente libre de la misma familia.
 */
export async function fontsForText(doc: PDFDocument, family: FontFamily, styles: Iterable<FontStyle>, text: string): Promise<FontSet> {
  return isWinAnsi(text) ? standardSet(doc, family, styles) : loadFonts(doc, family, styles, text)
}
