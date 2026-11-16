/**
 * Word y Excel al modelo de officePdf.ts.
 * - Word: mammoth lee el .docx; se usa su árbol de documento (transformDocument),
 *   no su HTML, así no hace falta interpretar HTML (y Trusted Types no interviene).
 * - Excel: read-excel-file entrega las filas de cada hoja.
 */
import type { OBlock, OImage, OPara, ORun, OStyle, OTable } from './officePdf'

/* ───────────── Word (árbol de mammoth) ───────────── */

/** Nodo del árbol de mammoth (solo lo que se usa). */
export type MNode = {
  type: string
  children?: MNode[]
  value?: string
  styleId?: string
  styleName?: string
  alignment?: string
  numbering?: { isOrdered: boolean; level: string | number } | null
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  fontSize?: number
  breakType?: string
  contentType?: string
  read?: (encoding?: string) => Promise<Uint8Array | ArrayBuffer | string>
}

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

function styleOf(n: MNode): OStyle {
  const id = `${n.styleId ?? ''} ${n.styleName ?? ''}`.toLowerCase().replace(/\s+/g, '')
  if (/title|título/.test(id) && !/subtitle/.test(id)) return 'title'
  const m = /heading(\d)|título(\d)/.exec(id)
  const level = m ? Number(m[1] ?? m[2]) : 0
  return level === 1 ? 'h1' : level === 2 ? 'h2' : level >= 3 ? 'h3' : 'normal'
}

const alignOf = (a?: string): OPara['align'] => (a === 'center' ? 'center' : a === 'right' || a === 'end' ? 'right' : 'left')

/** Árbol de mammoth → bloques. `counters` numera las listas ordenadas por nivel. */
export async function fromMammoth(doc: MNode): Promise<{ blocks: OBlock[]; skippedImages: number }> {
  const blocks: OBlock[] = []
  let skippedImages = 0
  let counters: number[] = []

  const readImage = async (n: MNode, align: OPara['align']): Promise<OImage | null> => {
    try {
      // En base64: sin codificación, mammoth usa Buffer, que en el navegador no existe.
      const b64 = String(await n.read!('base64'))
      const data = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const size = imageSize(data)
      if (!size) return null
      return { kind: 'image', data, type: size.type, width: size.width, height: size.height, align: align === 'center' ? 'center' : 'left' }
    } catch {
      return null
    }
  }

  /** Corridas de un párrafo; las imágenes y los saltos de página salen como bloques aparte. */
  const paragraph = async (n: MNode): Promise<OBlock[]> => {
    const out: OBlock[] = []
    const runs: ORun[] = []
    const align = alignOf(n.alignment)
    const style = styleOf(n)
    let list: OPara['list']
    if (n.numbering) {
      const level = Number(n.numbering.level) || 0
      counters = counters.slice(0, level + 1)
      counters[level] = (counters[level] ?? 0) + 1
      list = { ordered: n.numbering.isOrdered, level, index: counters[level] }
    } else counters = []
    const flush = () => {
      if (runs.some((r) => r.text.trim())) out.push({ kind: 'para', runs: runs.splice(0), style, align, list })
      else runs.length = 0
    }
    const walk = async (node: MNode, fmt: Omit<ORun, 'text'>) => {
      if (node.type === 'run') {
        const f = { bold: node.isBold || fmt.bold, italic: node.isItalic || fmt.italic, underline: node.isUnderline || fmt.underline, size: node.fontSize ?? fmt.size }
        for (const c of node.children ?? []) await walk(c, f)
      } else if (node.type === 'text') runs.push({ text: node.value ?? '', ...fmt })
      else if (node.type === 'tab') runs.push({ text: '\t', ...fmt })
      else if (node.type === 'break') {
        if (node.breakType === 'page') {
          flush()
          out.push({ kind: 'pagebreak' })
        } else runs.push({ text: '\n', ...fmt })
      } else if (node.type === 'image') {
        flush()
        const img = await readImage(node, align)
        if (img) out.push(img)
        else skippedImages++
      } else for (const c of node.children ?? []) await walk(c, fmt)
    }
    for (const c of n.children ?? []) await walk(c, {})
    flush()
    return out
  }

  const table = async (n: MNode): Promise<OTable> => {
    const rows: OPara[][][] = []
    for (const row of (n.children ?? []).filter((c) => c.type === 'tableRow')) {
      const cells: OPara[][] = []
      for (const cell of (row.children ?? []).filter((c) => c.type === 'tableCell')) {
        const paras: OPara[] = []
        for (const c of cell.children ?? []) if (c.type === 'paragraph') paras.push(...(await paragraph(c)).filter((b): b is OPara => b.kind === 'para'))
        cells.push(paras)
      }
      rows.push(cells)
    }
    const first = rows[0] ?? []
    const header = first.length > 0 && first.every((c) => c.every((p) => p.runs.every((r) => r.bold || !r.text.trim())))
    return { kind: 'table', rows, header }
  }

  for (const n of doc.children ?? []) {
    if (n.type === 'paragraph') blocks.push(...(await paragraph(n)))
    else if (n.type === 'table') blocks.push(await table(n))
  }
  return { blocks, skippedImages }
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
