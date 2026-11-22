/**
 * Excel al modelo de officePdf.ts (read-excel-file entrega las filas de cada hoja) y lectura del
 * tamaño de imágenes PNG/JPEG (también para Word, en docxRead.ts).
 */
import type { OBlock } from './officePdf'

/** Ancho y alto en pixeles de un PNG o JPEG (lee el encabezado). */
export function imageSize(b: Uint8Array): { width: number; height: number; type: 'png' | 'jpg' } | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b.length >= 24) {
    const v = new DataView(b.buffer, b.byteOffset)
    return { width: v.getUint32(16), height: v.getUint32(20), type: 'png' }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null
      const marker = b[i + 1]
      const len = (b[i + 2] << 8) | b[i + 3]
      // SOF0..SOF15 (menos DHT/JPG/DAC) traen el tamaño.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8], type: 'jpg' }
      }
      i += 2 + len
    }
  }
  return null
}

/* ───────────── Excel ───────────── */

/**
 * Una hoja: sus valores y, si se conocen (xlsxRead.ts), el formato de número de cada celda y si
 * está oculta.
 */
export type SheetData = { sheet: string; data: unknown[][]; formats?: (string | undefined)[][]; hidden?: boolean }

/** Decimales fijos de un formato de número ("0.00" → 2, "#,##0" → 0), o null si no los fija. */
function fixedDecimals(fmt: string): number | null {
  const section = fmt.split(';')[0].replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '')
  if (!/[0#]/.test(section)) return null
  const m = /\.([0#]+)/.exec(section)
  return m ? m[1].length : 0
}

/** Símbolo de moneda de un formato ("$", "€", "[$US$-409]"…) y si va antes del número. */
function currencyOf(fmt: string): { symbol: string; before: boolean } | null {
  const section = fmt.split(';')[0]
  const bracket = /\[\$([^\]-]*)(-[^\]]*)?\]/.exec(section)
  const symbol = bracket?.[1] || /"([^"]*[$€£¥][^"]*)"/.exec(section)?.[1]?.trim() || /[$€£¥]/.exec(section.replace(/\[[^\]]*\]/g, ''))?.[0]
  if (!symbol) return null
  const at = section.indexOf(bracket?.[0] ?? symbol)
  const digit = section.search(/[0#]/)
  return { symbol, before: digit < 0 || at < digit }
}

/**
 * Valor de celda como texto: números con separadores colombianos, fechas dd/mm/aaaa y, si se
 * conoce el formato de Excel, porcentaje, moneda y decimales fijos (W-146.7).
 */
export function cellText(v: unknown, fmt?: string): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') {
    if (!fmt) return v.toLocaleString('es-CO', { maximumFractionDigits: 2 })
    const dec = fixedDecimals(fmt)
    const opts = dec === null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: dec, maximumFractionDigits: dec }
    const section = fmt.split(';')[0].replace(/"[^"]*"/g, '')
    if (section.includes('%')) return `${(v * 100).toLocaleString('es-CO', opts)} %`
    const money = currencyOf(fmt)
    const n = Math.abs(v).toLocaleString('es-CO', opts)
    const sign = v < 0 ? '-' : ''
    if (money) return money.before ? `${sign}${money.symbol} ${n}` : `${sign}${n} ${money.symbol}`
    return sign + n
  }
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (v instanceof Date) {
    const d = (n: number) => String(n).padStart(2, '0')
    return `${d(v.getUTCDate())}/${d(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`
  }
  return String(v)
}

/** Letra de una columna de Excel: 0 → A, 26 → AA. */
export function columnLetter(n: number): string {
  let s = ''
  for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s
  return s
}

/**
 * Agrupa las columnas para que cada grupo quepa a lo ancho (`maxChars`, en caracteres): cada
 * columna ocupa su palabra más larga más 2 de margen. Así no se parten palabras: lo que no cabe
 * sigue en otra página, como al imprimir en Excel.
 */
export function columnGroups(rows: string[][], cols: number, maxChars: number): Array<[number, number]> {
  const need = Array.from({ length: cols }, (_, c) => Math.max(3, ...rows.map((r) => Math.max(0, ...(r[c] ?? '').split(/\s+/).map((w) => w.length)))) + 2)
  const groups: Array<[number, number]> = []
  let start = 0
  let used = 0
  need.forEach((w, c) => {
    if (c > start && used + w > maxChars) {
      groups.push([start, c])
      start = c
      used = 0
    }
    used += w
  })
  groups.push([start, cols])
  return groups
}

/**
 * Una tabla por hoja (sin filas y columnas vacías al final), con un salto de página entre hojas.
 * Las hojas ocultas no se imprimen, como en Excel, y una hoja muy ancha sigue en otra página con
 * las columnas que no caben (W-146.7).
 */
export function fromSheets(all: SheetData[], maxChars = Infinity): { blocks: OBlock[]; maxColumns: number } {
  const blocks: OBlock[] = []
  let maxColumns = 0
  const sheets = all.filter((s) => !s.hidden)
  sheets.forEach((s) => {
    const rows = s.data.map((r, ri) => r.map((v, ci) => cellText(v, s.formats?.[ri]?.[ci])))
    while (rows.length && rows[rows.length - 1].every((c) => !c)) rows.pop()
    const cols = Math.max(0, ...rows.map((r) => r.reduce((last, c, j) => (c ? j + 1 : last), 0)))
    if (!rows.length || !cols) return
    maxColumns = Math.max(maxColumns, cols)
    const groups = columnGroups(rows, cols, maxChars)
    for (const [from, to] of groups) {
      if (blocks.length) blocks.push({ kind: 'pagebreak' })
      const range = groups.length > 1 ? `${columnLetter(from)}–${columnLetter(to - 1)}` : ''
      blocks.push({
        kind: 'table',
        title: [sheets.length > 1 ? s.sheet : '', range].filter(Boolean).join(' · ') || undefined,
        header: true,
        rows: rows.map((r, ri) =>
          Array.from({ length: to - from }, (_, k) => {
            const c = from + k
            return [{ kind: 'para' as const, runs: [{ text: r[c] ?? '', bold: ri === 0 }], align: typeof s.data[ri]?.[c] === 'number' ? ('right' as const) : ('left' as const) }]
          }),
        ),
      })
    }
  })
  return { blocks, maxColumns }
}
