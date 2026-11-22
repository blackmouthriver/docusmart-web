/**
 * PDF a Word: un PDF guarda letras sueltas con su posición, no párrafos ni
 * tablas. Aquí se reconstruye el documento (líneas → párrafos, títulos por
 * tamaño, listas, tablas por columnas alineadas, imágenes en su lugar) y se
 * escribe un .docx a mano (es un ZIP con XML), sin dependencias.
 * Las coordenadas son puntos desde la esquina superior izquierda de la página.
 */
import { strToU8, zipSync } from 'fflate'

export type Family = 'serif' | 'sans' | 'mono'
/** Un fragmento de texto: `y` es la línea base; `w` el ancho; `size` el tamaño de letra. */
/** `font`: nombre real de la familia (p. ej. "Calibri"), si el PDF lo trae. */
export type TextFrag = { page: number; str: string; x: number; y: number; w: number; size: number; bold: boolean; italic: boolean; family: Family; font?: string; color?: string; spacing?: number }
/** Rectángulo relleno (fondo de una columna, franja de color): `color` es "RRGGBB". */
export type RectFrag = { page: number; x: number; y: number; w: number; h: number; color: string }
/** Texto en el orden en que se dibuja, con su color (de la lista de operadores). */
export type ColorRun = { color: string; text: string }
export type ImageFrag = { page: number; x: number; y: number; w: number; h: number; png: Uint8Array }
export type PageInfo = { width: number; height: number }

/** `color`: "RRGGBB" (sin él, negro); `spacing`: espacio extra entre letras, en puntos. */
export type Run = { text: string; bold: boolean; italic: boolean; size: number; family: Family; font?: string; color?: string; spacing?: number }
export type Para = { kind: 'para'; runs: Run[]; align: 'left' | 'center' | 'right'; heading: 0 | 1 | 2 | 3; bullet: boolean; indent: number }
export type Table = { kind: 'table'; rows: Run[][][]; widths: number[] }
/** Zona a dos (o más) columnas: va como una tabla sin bordes, con el fondo de cada columna. */
export type Columns = { kind: 'columns'; widths: number[]; cells: Block[][]; fills: Array<string | undefined> }
export type Block = Para | Table | Columns | { kind: 'image'; img: ImageFrag; align: 'left' | 'center' } | { kind: 'band'; color: string; height: number } | { kind: 'pagebreak' }
export type WordDoc = { blocks: Block[]; page: PageInfo; margins: { top: number; right: number; bottom: number; left: number }; bodySize: number; bodyFamily: Family; bodyFont: string }

/* ───────────── Líneas ───────────── */

export type Segment = { x0: number; x1: number; runs: Run[] }
export type Line = { page: number; y: number; x0: number; x1: number; size: number; segments: Segment[] }

const sameStyle = (a: Run, b: Run) =>
  a.bold === b.bold && a.italic === b.italic && a.family === b.family && a.font === b.font && Math.abs(a.size - b.size) < 0.6 && a.color === b.color && a.spacing === b.spacing

/**
 * El color de cada fragmento de texto: se recorren a la par los textos (en el orden de
 * getTextContent) y lo dibujado con su color (en el orden de la lista de operadores), que es el
 * mismo. Negro queda sin color.
 */
export function assignColors(items: string[], runs: ColorRun[]): Array<string | undefined> {
  return matchDrawn(items, runs).map((m) => m?.color)
}

/**
 * Para cada texto de getTextContent, lo que se dibujó en la lista de operadores: su color y el
 * texto tal como está en el PDF (con sus espacios reales).
 */
export function matchDrawn(items: string[], runs: ColorRun[]): Array<{ color?: string; text: string } | undefined> {
  const all: Array<{ c: string; color: string }> = runs.flatMap((r) => [...r.text].map((c) => ({ c, color: r.color })))
  // Posiciones de los caracteres que no son espacio (con esos se compara).
  const idx = all.map((x, i) => (x.c.trim() ? i : -1)).filter((i) => i >= 0)
  let k = 0
  return items.map((str) => {
    const want = [...str].filter((c) => c.trim())
    if (!want.length) return undefined
    let at = -1
    for (let j = k; j < Math.min(idx.length, k + 400); j++)
      if (all[idx[j]].c === want[0] && (want.length < 2 || all[idx[j + 1]]?.c === want[1])) {
        at = j
        break
      }
    if (at < 0) return undefined
    k = at + want.length
    const color = all[idx[at]].color
    const end = idx[Math.min(idx.length - 1, at + want.length - 1)]
    return {
      color: /^[0-9A-F]{6}$/.test(color) && color !== '000000' ? color : undefined,
      text: all.slice(idx[at], end + 1).map((x) => x.c).join(''),
    }
  })
}

/**
 * Texto espaciado (tracking): pdf.js lo entrega letra por letra ("E S P . G E S T I Ó N"), sin
 * distinguir los espacios entre palabras. Si lo dibujado dice lo mismo con espacios reales, se usa
 * eso y el hueco entre letras se estima del ancho. Si no, null.
 */
export function untrack(str: string, drawn: string | undefined, width: number, size: number): { str: string; spacing: number } | null {
  const t = str.trim()
  if (!drawn || !/^(\S )+\S$/u.test(t) || [...t].length < 3) return null
  const real = drawn.replace(/\s+/g, ' ').trim()
  if (real.replace(/ /g, '') !== t.replace(/ /g, '') || !/\S\S/u.test(real)) return null
  const n = [...real].length
  // Ancho natural aproximado de cada letra (mayúsculas más anchas).
  const natural = [...real].reduce((s, c) => s + (c === ' ' ? 0.28 : /\p{Lu}/u.test(c) ? 0.62 : 0.5) * size, 0)
  return { str: real, spacing: Math.max(0, Math.round(((width - natural) / n) * 10) / 10) }
}

/**
 * Nombre de familia a partir del nombre de la fuente incrustada:
 * "ABCDEF+Calibri-Bold" → "Calibri", "TimesNewRomanPSMT" → "Times New Roman".
 */
export function cleanFontName(name?: string): string | undefined {
  if (!name || /^g_d\d/.test(name)) return undefined
  let n = name.replace(/^[A-Z]{6}\+/, '').split(/[,-]/)[0]
  n = n.replace(/(PSMT|PS|MT)$/, '').replace(/(Bold|Italic|Oblique|Regular|Light|Medium|Semibold|Black)+$/i, '')
  n = n.replace(/([a-z])([A-Z])/g, '$1 $2').trim()
  return n || undefined
}

function pushRun(runs: Run[], r: Run) {
  const last = runs[runs.length - 1]
  if (last && sameStyle(last, r)) last.text += r.text
  else runs.push({ ...r })
}

/**
 * Agrupa los fragmentos de una página en líneas, y cada línea en segmentos separados por huecos
 * mayores que `splitGap` tamaños de letra (2 para Word: no parte párrafos justificados).
 */
export function buildLines(frags: TextFrag[], splitGap = 2): Line[] {
  // Los fragmentos que son solo espacios no cuentan para la geometría: Word los usa para
  // rellenar el hueco entre columnas de una tabla y ocultarían ese hueco.
  const sorted = frags.filter((f) => f.str.trim()).sort((a, b) => a.y - b.y || a.x - b.x)
  const groups: TextFrag[][] = []
  for (const f of sorted) {
    const g = groups[groups.length - 1]
    // Misma línea si la base está cerca (tolera subíndices y letras de otro tamaño).
    if (g && Math.abs(f.y - g[0].y) <= 0.45 * Math.max(f.size, g[0].size)) g.push(f)
    else groups.push([f])
  }
  return groups.map((g) => {
    g.sort((a, b) => a.x - b.x)
    const size = g.reduce((m, f) => Math.max(m, f.size), 0)
    // Letras sueltas con el mismo hueco entre sí: texto espaciado. El hueco entre letras va como
    // espaciado de caracteres y solo un hueco claramente mayor es un espacio entre palabras.
    const singles = g.filter((f) => [...f.str.trim()].length === 1).length
    let tracking = 0
    // Palabras ya espaciadas (de untrack): toda la línea con el mismo espaciado, también las letras sueltas ("Y").
    const spaced = g.map((f) => f.spacing).filter((v): v is number => !!v).sort((a, b) => a - b)
    const lineSpacing = spaced.length ? spaced[Math.floor(spaced.length / 2)] : undefined
    if (g.length >= 5 && singles >= 0.7 * g.length) {
      const gaps = g.slice(1).map((f, k) => f.x - (g[k].x + g[k].w)).filter((d) => d > 0).sort((a, b) => a - b)
      const med = gaps[Math.floor(gaps.length / 2)] ?? 0
      if (med > 0.08 * size) tracking = med
    }
    const segments: Segment[] = []
    let seg: Segment | null = null
    let prev: TextFrag | null = null
    for (const f of g) {
      const gap = prev ? f.x - (prev.x + prev.w) : 0
      if (!seg || gap > splitGap * size) {
        seg = { x0: f.x, x1: f.x + f.w, runs: [] }
        segments.push(seg)
      } else if (gap > (tracking ? tracking + 0.2 * f.size : 0.15 * f.size) && !/\s$/.test(seg.runs[seg.runs.length - 1]?.text ?? '') && !/^\s/.test(f.str)) {
        // El espacio toma el estilo de la palabra anterior (como en Word: "Hola **mundo**", no "Hola** mundo**").
        const last = seg.runs[seg.runs.length - 1]
        if (last) last.text += ' '
      }
      pushRun(seg.runs, { text: f.str, bold: f.bold, italic: f.italic, size: f.size, family: f.family, font: f.font, color: f.color, spacing: lineSpacing && (f.spacing || [...f.str.trim()].length === 1) ? lineSpacing : tracking ? Math.round(tracking * 10) / 10 : undefined })
      seg.x1 = Math.max(seg.x1, f.x + f.w)
      prev = f
    }
    for (const s of segments) trimRuns(s.runs)
    return { page: g[0].page, y: g[0].y, x0: segments[0].x0, x1: segments[segments.length - 1].x1, size, segments: segments.filter((s) => s.runs.length) }
  }).filter((l) => l.segments.length)
}

function trimRuns(runs: Run[]) {
  if (runs[0]) runs[0].text = runs[0].text.trimStart()
  const last = runs[runs.length - 1]
  if (last) last.text = last.text.trimEnd()
  for (let i = runs.length - 1; i >= 0; i--) if (!runs[i].text) runs.splice(i, 1)
}

/** Línea toda en negrita (un subtítulo como "Optómetra" sobre el detalle del puesto). */
const allBold = (l: Line) => l.segments.every((s) => s.runs.every((r) => r.bold || !r.text.trim()))
const lineText = (l: Line) => l.segments.map((s) => s.runs.map((r) => r.text).join('')).join(' ')

/** Tamaño de letra más usado (ponderado por cantidad de caracteres). */
export function dominant<T extends string | number>(frags: TextFrag[], key: (f: TextFrag) => T): T | undefined {
  const count = new Map<T, number>()
  for (const f of frags) count.set(key(f), (count.get(key(f)) ?? 0) + f.str.length)
  let best: T | undefined
  let max = -1
  for (const [k, n] of count) if (n > max) [best, max] = [k, n]
  return best
}

/* ───────────── Tablas ───────────── */

/** Columnas: agrupa los inicios de segmento que caen cerca (tolerancia en puntos). */
export function columnAnchors(lines: Line[], tol: number): number[] {
  const xs = lines.flatMap((l) => l.segments.map((s) => s.x0)).sort((a, b) => a - b)
  const clusters: number[][] = []
  for (const x of xs) {
    const c = clusters[clusters.length - 1]
    if (c && x - c[c.length - 1] <= tol) c.push(x)
    else clusters.push([x])
  }
  return clusters.filter((c) => c.length >= 2).map((c) => Math.min(...c))
}

export type Band = { x0: number; x1: number }

/**
 * Columnas de una tabla según el espacio que ocupa el texto (W-146.7): una columna es una franja
 * con texto en casi todas las filas, y el hueco entre columnas, una franja casi vacía. A diferencia
 * de alinear por el borde izquierdo, así una columna de montos alineados a la derecha queda en una
 * sola columna, y su encabezado (alineado a la izquierda) se asigna a la columna más cercana.
 */
export function tableColumns(lines: Line[], size: number): Band[] {
  const body = lines
  const segs = body.flatMap((l) => l.segments)
  if (!segs.length) return []
  const left = Math.floor(Math.min(...segs.map((s) => s.x0)))
  const right = Math.ceil(Math.max(...segs.map((s) => s.x1)))
  const cover = new Array<number>(right - left + 1).fill(0)
  for (const l of body) {
    const hit = new Uint8Array(cover.length)
    for (const s of l.segments) for (let x = Math.floor(s.x0) - left; x <= Math.ceil(s.x1) - left; x++) hit[x] = 1
    hit.forEach((h, x) => (cover[x] += h))
  }
  // Una columna tiene texto en al menos 2 filas: una celda que cruza el hueco no lo tapa, y una
  // palabra suelta no arma una columna nueva (se une a la columna más cercana).
  const need = Math.min(body.length, 2)
  const bands: Band[] = []
  cover.forEach((n, x) => {
    if (n < need) return
    const last = bands[bands.length - 1]
    if (last && x + left - last.x1 <= 0.5 * size) last.x1 = x + left
    else bands.push({ x0: x + left, x1: x + left })
  })
  return bands
}

/**
 * La columna de un segmento: la que más se le superpone o, si no toca ninguna, la más cercana. Una
 * columna a su derecha cuenta como el doble de cerca: el encabezado de una columna de montos
 * alineados a la derecha suele quedar a la izquierda de los montos.
 */
export function bandOf(bands: Band[], s: { x0: number; x1: number }): number {
  let best = 0
  let score = -Infinity
  bands.forEach((b, i) => {
    const overlap = Math.min(b.x1, s.x1) - Math.max(b.x0, s.x0)
    const v = overlap > 0 ? overlap : b.x0 >= s.x1 ? -(b.x0 - s.x1) / 2 : -(s.x0 - b.x1)
    if (v > score) [best, score] = [i, v]
  })
  return best
}

function toTable(lines: Line[], size: number): Table | null {
  const bands = tableColumns(lines, size)
  if (bands.length < 2) return null
  const rows = lines.map((l) => {
    const cells: Run[][] = bands.map(() => [])
    for (const s of l.segments) {
      const col = bandOf(bands, s)
      if (cells[col].length) pushRun(cells[col], { ...s.runs[0], text: ' ' })
      for (const r of s.runs) pushRun(cells[col], r)
    }
    return cells
  })
  // Anchos de columna según la posición de cada una (la última, hasta donde llega su texto).
  const widths = bands.map((b, i) => (i < bands.length - 1 ? bands[i + 1].x0 - b.x0 : Math.max(b.x1 - b.x0 + 2 * size, 4 * size)))
  return { kind: 'table', rows, widths }
}

/* ───────────── Párrafos ───────────── */

const BULLET = /^[•·▪◦‣●○■□–—*-]\s*/
const NUMBERED = /^(\d{1,3}|[a-zA-Z])[.)]\s/

/**
 * Dos columnas en la página: un corte vertical `x` que, desde la línea `top` hacia abajo, ningún
 * texto cruza, con bastante texto a cada lado y a la misma altura (hojas de vida, folletos,
 * boletines). Arriba de `top` queda lo que ocupa todo el ancho (el nombre, el título).
 */
export function findColumns(lines: Line[], page: PageInfo, rects: RectFrag[] = []): { x: number; top: number } | null {
  const segs = lines.flatMap((l) => l.segments.map((s) => ({ y: l.y, x0: s.x0, x1: s.x1 })))
  // Un fondo de color alto y angosto (la columna lateral de una hoja de vida): su borde es el corte,
  // aunque de un lado haya poco texto.
  for (const r of rects.filter((rc) => rc.h >= 0.4 * page.height && rc.w <= 0.7 * page.width && rc.w >= 0.15 * page.width && !isWhite(rc.color))) {
    const x = r.x < page.width / 2 ? r.x + r.w : r.x
    const inside = segs.filter((s) => s.y > r.y && s.y < r.y + r.h)
    if (inside.some((s) => s.x0 < x - 1 && s.x1 > x + 1)) continue
    if (!inside.some((s) => s.x1 <= x) || !inside.some((s) => s.x0 >= x)) continue
    const top = Math.max(-Infinity, ...segs.filter((s) => s.y <= r.y + 2).map((s) => s.y))
    return { x, top }
  }
  if (segs.length < 8) return null
  // Una tabla (un extracto, una factura) tampoco tiene texto que cruce entre sus columnas, pero no
  // es una página a dos columnas: la mayoría de sus líneas tiene tres bloques o más (W-146.7).
  if (lines.filter((l) => l.segments.length >= 3).length >= 0.5 * lines.length) return null
  const median = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)] ?? 0
  let best: { x: number; top: number; count: number } | null = null
  for (let x = page.width * 0.2; x <= page.width * 0.8; x += 2) {
    const crossing = segs.filter((s) => s.x0 < x - 1 && s.x1 > x + 1)
    const top = crossing.length ? Math.max(...crossing.map((s) => s.y)) : -Infinity
    const below = segs.filter((s) => s.y > top)
    const left = below.filter((s) => s.x1 <= x)
    const right = below.filter((s) => s.x0 >= x)
    if (left.length < 3 || right.length < 3) continue
    const ys = (a: typeof segs) => a.map((s) => s.y)
    const overlap = Math.min(Math.max(...ys(left)), Math.max(...ys(right))) - Math.max(Math.min(...ys(left)), Math.min(...ys(right)))
    if (overlap < page.height * 0.2) continue
    if (Math.min(...right.map((s) => s.x0)) - Math.max(...left.map((s) => s.x1)) < 8) continue
    // Bloques angostos a los dos lados: dos columnas de una tabla, no de texto.
    if (median(left.map((s) => s.x1 - s.x0)) < 0.18 * page.width && median(right.map((s) => s.x1 - s.x0)) < 0.18 * page.width) continue
    const count = left.length + right.length
    if (!best || count > best.count) best = { x, top, count }
  }
  if (!best) return null
  // El corte en el medio del hueco entre las dos columnas.
  const below = segs.filter((s) => s.y > best.top)
  const lx = Math.max(...below.filter((s) => s.x1 <= best.x).map((s) => s.x1))
  const rx = Math.min(...below.filter((s) => s.x0 >= best.x).map((s) => s.x0))
  return { x: (lx + rx) / 2, top: best.top }
}

/** Las líneas de un lado del corte (cada línea solo con sus segmentos de ese lado). */
function side(lines: Line[], keep: (s: Segment) => boolean): Line[] {
  return lines
    .map((l) => {
      const segments = l.segments.filter(keep)
      return segments.length ? { ...l, segments, x0: segments[0].x0, x1: segments[segments.length - 1].x1 } : null
    })
    .filter((l): l is Line => !!l)
}

const isWhite = (c: string) => /^(F[89A-F]){3}$/i.test(c)

export function buildDocument(pages: PageInfo[], texts: TextFrag[], images: ImageFrag[] = [], rects: RectFrag[] = []): WordDoc {
  const bodySize = dominant(texts, (f) => Math.round(f.size * 2) / 2) ?? 11
  const bodyFamily = dominant(texts, (f) => f.family) ?? 'sans'
  const bodyFont = dominant(texts, (f) => f.font ?? FONT[f.family]) ?? FONT[bodyFamily]
  const page = pages[0] ?? { width: 595, height: 842 }

  // Márgenes: el contenido de todas las páginas (con límites razonables).
  const allLines = pages.map((_, p) => buildLines(texts.filter((t) => t.page === p)))
  const flat = allLines.flat()
  const clamp = (v: number) => Math.min(144, Math.max(28, v))
  // El margen derecho sale de las líneas de texto normal: un título largo o centrado no debe definirlo.
  const body = flat.filter((l) => Math.abs(l.size - bodySize) <= 0.15 * bodySize)
  const ref = body.length ? body : flat
  const left = flat.length ? Math.min(...flat.map((l) => l.x0)) : 72
  const right = ref.length ? page.width - Math.max(...ref.map((l) => l.x1)) : 72
  // Franjas de color de lado a lado (decoración de hojas de vida y portadas), sin texto encima.
  const bands = rects.filter((r) => r.w >= 0.6 * page.width && r.h <= 40 && !isWhite(r.color) && !flat.some((l) => l.y > r.y && l.y - l.size < r.y + r.h))
  const firstBand = Math.min(Infinity, ...bands.filter((b) => b.page === 0).map((b) => b.y))
  const textTop = flat.length ? Math.min(...flat.map((l) => l.y - l.size)) : 72
  const top = Math.min(clamp(textTop), Math.max(10, firstBand))
  const margins = { top, right: clamp(right), bottom: 56, left: clamp(left) }
  const textLeft = left
  const textRight = page.width - right

  // Títulos: los tamaños claramente mayores que el cuerpo, de mayor a menor, son los niveles 1, 2 y 3
  // (Word usa 14 y 13 pt para títulos con cuerpo de 11: no sirve un umbral fijo alto).
  const headingSizes = [...new Set(flat.filter((l) => l.size >= bodySize * 1.12).map((l) => l.size))].sort((a, b) => b - a).slice(0, 3)
  const headingLevel = (size: number) => (headingSizes.indexOf(size) + 1) as Para['heading']

  /** Párrafos, tablas e imágenes de un bloque de texto entre `l` y `r`, en orden vertical. */
  const flow = (lines: Line[], imgs: ImageFrag[], l: number, r: number): Array<{ y: number; block: Block }> => {
    const width = Math.max(1, r - l)
    // Para centrar: el medio del bloque (en la página entera, el de la hoja).
    const center = l <= textLeft + 1 && r >= textRight - 1 ? page.width : l + r
    const placed: Array<{ y: number; block: Block }> = []
    let i = 0
    while (i < lines.length) {
      // ¿Comienza una tabla? Dos o más líneas seguidas con varias columnas.
      if (lines[i].segments.length >= 2) {
        let j = i
        while (j + 1 < lines.length && lines[j + 1].segments.length >= 2 && lines[j + 1].y - lines[j].y <= 3 * lines[j].size) j++
        if (j > i) {
          const table = toTable(lines.slice(i, j + 1), bodySize)
          if (table) {
            placed.push({ y: lines[i].y - lines[i].size, block: table })
            i = j + 1
            continue
          }
        }
      }
      // Párrafo: se agregan líneas mientras parezcan continuar.
      const first = lines[i]
      const para: Line[] = [first]
      while (i + 1 < lines.length) {
        const prev = para[para.length - 1]
        const next = lines[i + 1]
        const text = lineText(next)
        const gap = next.y - prev.y
        const breaks =
          next.segments.length >= 2 ||
          gap > 1.75 * Math.max(prev.size, next.size) ||
          Math.abs(next.size - prev.size) > 0.15 * prev.size ||
          BULLET.test(text) ||
          NUMBERED.test(text) ||
          (Math.abs(next.x0 - first.x0) > 2 * next.size && !(BULLET.test(lineText(first)) || NUMBERED.test(lineText(first)))) ||
          // La línea anterior terminó antes del margen derecho con un punto: fin de párrafo.
          (prev.x1 < r - 0.12 * width && /[.:!?;]$/.test(lineText(prev))) ||
          allBold(prev) !== allBold(next) ||
          isCentered(prev, l, r, center) !== isCentered(next, l, r, center)
        if (breaks) break
        para.push(next)
        i++
      }
      i++
      placed.push({ y: first.y - first.size, block: makePara(para, headingLevel, l, r, center) })
    }
    for (const img of imgs) placed.push({ y: img.y, block: { kind: 'image', img, align: Math.abs(img.x + img.w / 2 - center / 2) < 0.03 * width ? 'center' : 'left' } })
    return placed.sort((a, b) => a.y - b.y)
  }

  const blocks: Block[] = []
  pages.forEach((_, p) => {
    if (p > 0) blocks.push({ kind: 'pagebreak' })
    const lines = allLines[p]
    const imgs = images.filter((im) => im.page === p && im.w >= 24 && im.h >= 24)
    const placed: Array<{ y: number; block: Block }> = bands.filter((b) => b.page === p).map((b) => ({ y: b.y, block: { kind: 'band', color: b.color, height: b.h } }))
    const cols = findColumns(lines, pages[p] ?? page, rects.filter((rc) => rc.page === p))
    if (!cols) placed.push(...flow(lines, imgs, textLeft, textRight))
    else {
      const above = lines.filter((l) => l.y <= cols.top)
      const below = lines.filter((l) => l.y > cols.top)
      const regionTop = below.length ? Math.min(...below.map((l) => l.y - l.size)) : 0
      const imgAbove = imgs.filter((im) => im.y + im.h <= regionTop)
      placed.push(...flow(above, imgAbove, textLeft, textRight))
      const imgIn = imgs.filter((im) => !imgAbove.includes(im))
      const leftLines = side(below, (s) => s.x1 <= cols.x)
      const rightLines = side(below, (s) => s.x0 >= cols.x)
      const leftEnd = Math.max(cols.x, ...leftLines.map((l) => l.x1))
      const rightEnd = Math.max(textRight, ...rightLines.map((l) => l.x1))
      const parts = [
        { lines: leftLines, imgs: imgIn.filter((im) => im.x + im.w / 2 < cols.x), l: textLeft, r: leftEnd, x0: textLeft, x1: cols.x },
        { lines: rightLines, imgs: imgIn.filter((im) => im.x + im.w / 2 >= cols.x), l: cols.x, r: rightEnd, x0: cols.x, x1: rightEnd },
      ]
      const regionBottom = Math.max(...below.map((l) => l.y))
      // Fondo de cada columna: el rectángulo de color que la cubre (el más chico que alcance).
      const fills = parts.map((c) => {
        const cover = rects
          .filter((rc) => rc.page === p && !isWhite(rc.color) && rc.w * rc.h < 0.9 * page.width * page.height)
          .filter((rc) => Math.min(rc.x + rc.w, c.x1) - Math.max(rc.x, c.x0) >= 0.7 * (c.x1 - c.x0) && Math.min(rc.y + rc.h, regionBottom) - Math.max(rc.y, regionTop) >= 0.5 * (regionBottom - regionTop))
          .sort((a, b) => a.w * b.h - b.w * a.h)
        return cover[0]?.color
      })
      placed.push({
        y: regionTop,
        block: {
          kind: 'columns',
          widths: parts.map((c) => c.x1 - c.x0),
          cells: parts.map((c) => flow(c.lines, c.imgs, c.l, c.r).map((x) => x.block)),
          fills,
        },
      })
    }
    placed.sort((a, b) => a.y - b.y)
    blocks.push(...placed.map((x) => x.block))
  })
  return { blocks, page, margins, bodySize, bodyFamily, bodyFont }
}

/** Centrada respecto del bloque de texto o de la página (los márgenes suelen ser simétricos). */
function isCentered(l: Line, left: number, right: number, pageWidth: number) {
  const width = right - left
  const mid = (l.x0 + l.x1) / 2
  const nearCenter = Math.abs(mid - (left + right) / 2) < 0.04 * width || Math.abs(mid - pageWidth / 2) < 0.04 * width
  // Un título ancho apenas se separa del margen, pero su centro coincide casi exacto con el de la página.
  const exactlyCentered = Math.abs(mid - pageWidth / 2) < 0.015 * width && l.x0 - left > l.size
  return (nearCenter && l.x0 - left > 0.12 * width) || exactlyCentered
}

function makePara(lines: Line[], headingLevel: (size: number) => Para['heading'], textLeft: number, textRight: number, pageWidth: number): Para {
  const runs: Run[] = []
  lines.forEach((l, k) => {
    const lr: Run[] = []
    l.segments.forEach((s, si) => {
      if (si) pushRun(lr, { ...s.runs[0], text: ' ' })
      for (const r of s.runs) pushRun(lr, r)
    })
    if (k > 0 && runs.length) {
      const last = runs[runs.length - 1]
      // Palabra cortada con guion al final de la línea: se une sin espacio.
      if (/[a-záéíóúñü]-$/i.test(last.text) && /^[a-záéíóúñü]/.test(lr[0]?.text ?? '')) last.text = last.text.slice(0, -1)
      else last.text += ' ' // el espacio entre líneas va con el estilo de la palabra anterior
    }
    for (const r of lr) pushRun(runs, r)
  })
  // Viñeta: se quita el carácter (Word pone la suya). Suele venir en su propia corrida, con
  // otra fuente (Symbol), así que esa corrida puede quedar vacía.
  let bullet = false
  if (runs[0] && BULLET.test(runs[0].text) && lineText(lines[0]).replace(BULLET, '').trim()) {
    runs[0].text = runs[0].text.replace(BULLET, '')
    if (!runs[0].text) runs.shift()
    bullet = true
  }
  const size = Math.max(...lines.map((l) => l.size))
  const chars = runs.reduce((n, r) => n + r.text.length, 0)
  const heading: Para['heading'] = chars <= 200 ? headingLevel(size) : 0
  const centered = lines.every((l) => isCentered(l, textLeft, textRight, pageWidth))
  const width = textRight - textLeft
  const rightAligned = !centered && lines.every((l) => textRight - l.x1 < 0.03 * width && l.x0 - textLeft > 0.4 * width)
  const indent = Math.max(0, Math.round(lines[0].x0 - textLeft))
  return { kind: 'para', runs, align: centered ? 'center' : rightAligned ? 'right' : 'left', heading, bullet, indent: centered || rightAligned || indent < lines[0].size ? 0 : indent }
}

/* ───────────── Escribir el .docx ───────────── */

const FONT: Record<Family, string> = { serif: 'Times New Roman', sans: 'Arial', mono: 'Courier New' }
const twip = (pt: number) => Math.round(pt * 20)
const emu = (pt: number) => Math.round(pt * 12700)
const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'

/** Escapa para XML y quita los caracteres de control que Word no acepta. */
export const xmlText = (s: string) =>
  s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** `explicit`: en los títulos se escriben tamaño y negrita reales, por encima del estilo. */
function runXml(r: Run, doc: WordDoc, explicit = false): string {
  const font = r.font ?? FONT[r.family]
  const props = [
    font !== doc.bodyFont ? `<w:rFonts w:ascii="${xmlText(font)}" w:hAnsi="${xmlText(font)}" w:cs="${xmlText(font)}"/>` : '',
    r.bold ? '<w:b/>' : explicit ? '<w:b w:val="0"/>' : '',
    r.italic ? '<w:i/>' : '',
    r.color ? '<w:color w:val="' + r.color + '"/>' : '',
    r.spacing ? '<w:spacing w:val="' + twip(r.spacing) + '"/>' : '',
    explicit || Math.abs(r.size - doc.bodySize) >= 0.5 ? `<w:sz w:val="${Math.round(r.size * 2)}"/><w:szCs w:val="${Math.round(r.size * 2)}"/>` : '',
  ].join('')
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${xmlText(r.text)}</w:t></w:r>`
}

function paraXml(p: Para, doc: WordDoc): string {
  const props = [
    p.heading ? `<w:pStyle w:val="Heading${p.heading}"/>` : '',
    p.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '',
    p.indent && !p.bullet ? `<w:ind w:left="${twip(p.indent)}"/>` : '',
    p.align !== 'left' ? `<w:jc w:val="${p.align}"/>` : '',
  ].join('')
  // En los títulos el estilo marca la estructura (navegación de Word), pero se respeta el aspecto del PDF.
  return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ''}${p.runs.map((r) => runXml(r, doc, p.heading > 0)).join('')}</w:p>`
}

function tableXml(t: Table, doc: WordDoc, maxWidth: number): string {
  // Anchos proporcionales a las columnas del PDF, sin pasar del ancho del texto.
  const k = Math.min(1, maxWidth / t.widths.reduce((s, w) => s + w, 0))
  const colW = t.widths.map((w) => twip(w * k))
  const width = colW.reduce((s, w) => s + w, 0)
  const grid = colW.map((w) => `<w:gridCol w:w="${w}"/>`).join('')
  const cellPara = '<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
  const rows = t.rows
    .map(
      (row) =>
        `<w:tr>${row
          .map((cell, i) => `<w:tc><w:tcPr><w:tcW w:w="${colW[i]}" w:type="dxa"/></w:tcPr><w:p>${cellPara}${cell.map((r) => runXml(r, doc)).join('')}</w:p></w:tc>`)
          .join('')}</w:tr>`,
    )
    .join('')
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="${width}" w:type="dxa"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows}</w:tbl>`
}

function imageXml(img: ImageFrag, rid: string, id: number, maxW: number, align: 'left' | 'center'): string {
  const k = Math.min(1, maxW / img.w)
  const cx = emu(img.w * k)
  const cy = emu(img.h * k)
  return (
    `<w:p>${align === 'center' ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : ''}<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Imagen ${id}"/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="imagen${id}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  )
}

function stylesXml(doc: WordDoc): string {
  const font = xmlText(doc.bodyFont)
  const size = Math.round(doc.bodySize * 2)
  const heading = (n: number, k: number) =>
    `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="${240 - n * 40}" w:after="120"/><w:outlineLvl w:val="${n - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${Math.round(size * k)}"/><w:szCs w:val="${Math.round(size * k)}"/></w:rPr></w:style>`
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="es-CO"/></w:rPr></w:rPrDefault>` +
    `<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
    heading(1, 1.8) +
    heading(2, 1.45) +
    heading(3, 1.2) +
    `<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>` +
    `</w:styles>`
  )
}

// Viñeta como la escribe Word: el carácter U+F0B7 de la fuente Symbol ("•" en Calibri sale como un cuadro).
const NUMBERING =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum>' +
  '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'

/** El .docx: un ZIP con el documento, los estilos, las viñetas y las imágenes. */
export function writeDocx(doc: WordDoc): Uint8Array {
  const media: Record<string, Uint8Array> = {}
  const rels: string[] = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
  ]
  const maxW = doc.page.width - doc.margins.left - doc.margins.right
  let imageId = 0
  const NONE = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((b) => '<w:' + b + ' w:val="nil"/>').join('')
  const blockXml = (b: Block, width: number): string => {
    if (b.kind === 'para') return paraXml(b, doc)
    if (b.kind === 'table') return tableXml(b, doc, width)
    if (b.kind === 'pagebreak') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    // Franja de color: un párrafo vacío sombreado con el alto exacto de la franja.
    if (b.kind === 'band') return '<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="' + b.color + '"/><w:spacing w:before="0" w:after="0" w:line="' + Math.max(20, twip(b.height)) + '" w:lineRule="exact"/></w:pPr></w:p>'
    if (b.kind === 'columns') {
      // Columnas: una tabla sin bordes de una fila, con el fondo de cada columna.
      const k = Math.min(1, width / b.widths.reduce((a, w) => a + w, 0))
      const colW = b.widths.map((w) => twip(w * k))
      const cells = b.cells
        .map((blocks, i) => {
          const fill = b.fills[i] ? '<w:shd w:val="clear" w:color="auto" w:fill="' + b.fills[i] + '"/>' : ''
          const inner = blocks.map((x) => blockXml(x, colW[i] / 20 - 11)).join('')
          // Una celda termina siempre en un párrafo.
          const end = blocks.length && blocks[blocks.length - 1].kind === 'para' ? '' : '<w:p/>'
          return '<w:tc><w:tcPr><w:tcW w:w="' + colW[i] + '" w:type="dxa"/>' + fill + '</w:tcPr>' + inner + end + '</w:tc>'
        })
        .join('')
      return (
        '<w:tbl><w:tblPr><w:tblW w:w="' + colW.reduce((a, w) => a + w, 0) + '" w:type="dxa"/><w:tblBorders>' + NONE + '</w:tblBorders><w:tblLayout w:type="fixed"/>' +
        '<w:tblCellMar><w:top w:w="113" w:type="dxa"/><w:left w:w="113" w:type="dxa"/><w:bottom w:w="113" w:type="dxa"/><w:right w:w="113" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        '<w:tblGrid>' + colW.map((w) => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid><w:tr>' + cells + '</w:tr></w:tbl>' +
        '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>'
      )
    }
    imageId++
    const rid = 'rIdImg' + imageId
    media['word/media/imagen' + imageId + '.png'] = b.img.png
    rels.push('<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/imagen' + imageId + '.png"/>')
    return imageXml(b.img, rid, imageId, width, b.align)
  }
  const body = doc.blocks.map((b) => blockXml(b, maxW)).join('')
  const m = doc.margins
  const sect = `<w:sectPr><w:pgSz w:w="${twip(doc.page.width)}" w:h="${twip(doc.page.height)}"${doc.page.width > doc.page.height ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${twip(m.top)}" w:right="${twip(m.right)}" w:bottom="${twip(m.bottom)}" w:left="${twip(m.left)}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>`
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}${sect}</w:body></w:document>`

  return zipSync(
    {
      '[Content_Types].xml': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>',
      ),
      '_rels/.rels': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      'word/document.xml': strToU8(document),
      'word/styles.xml': strToU8(stylesXml(doc)),
      'word/numbering.xml': strToU8(NUMBERING),
      'word/_rels/document.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`),
      ...media,
    },
    { level: 6 },
  )
}

/** Resumen para mostrar al usuario. */
export function summarize(doc: WordDoc) {
  // También lo que va dentro de las columnas.
  const all = doc.blocks.flatMap((b) => (b.kind === 'columns' ? b.cells.flat() : [b]))
  const count = (k: Block['kind']) => all.filter((b) => b.kind === k).length
  return { paragraphs: count('para'), tables: count('table'), images: count('image'), headings: all.filter((b) => b.kind === 'para' && b.heading).length }
}
