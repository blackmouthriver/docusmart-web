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

export type SheetData = { sheet: string; data: unknown[][] }

/** Valor de celda como texto: números con separadores colombianos, fechas dd/mm/aaaa. */
export function cellText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return v.toLocaleString('es-CO', { maximumFractionDigits: 2 })
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (v instanceof Date) {
    const d = (n: number) => String(n).padStart(2, '0')
    return `${d(v.getUTCDate())}/${d(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`
  }
  return String(v)
}

/** Una tabla por hoja (sin filas y columnas vacías al final), con un salto de página entre hojas. */
export function fromSheets(sheets: SheetData[]): { blocks: OBlock[]; maxColumns: number } {
  const blocks: OBlock[] = []
  let maxColumns = 0
  sheets.forEach((s, i) => {
    const rows = s.data.map((r) => r.map(cellText))
    while (rows.length && rows[rows.length - 1].every((c) => !c)) rows.pop()
    const cols = Math.max(0, ...rows.map((r) => r.reduce((last, c, j) => (c ? j + 1 : last), 0)))
    if (!rows.length || !cols) return
    maxColumns = Math.max(maxColumns, cols)
    if (i > 0 && blocks.length) blocks.push({ kind: 'pagebreak' })
    blocks.push({
      kind: 'table',
      title: sheets.length > 1 ? s.sheet : undefined,
      header: true,
      rows: rows.map((r, ri) =>
        Array.from({ length: cols }, (_, c) => [{ kind: 'para' as const, runs: [{ text: r[c] ?? '', bold: ri === 0 }], align: typeof s.data[ri]?.[c] === 'number' ? ('right' as const) : ('left' as const) }]),
      ),
    })
  })
  return { blocks, maxColumns }
}
