/**
 * Lector de libros de Excel (.xlsx) para Excel a PDF y a CSV (W-146.7). A diferencia de
 * read-excel-file, conserva el formato de número de cada celda (porcentaje, moneda, decimales) y
 * sabe qué hojas están ocultas, para no imprimirlas.
 */
import { strFromU8, unzipSync } from 'fflate'
import { child, children, parseXml, type XNode } from './xml'
import { formatParts, type SheetData } from './officeModels'

/** Formatos de número que Excel trae incorporados y que importan para mostrar el valor. */
const BUILTIN: Record<number, string> = {
  1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 11: '0.00E+00',
  14: 'dd/mm/yyyy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'dd/mm/yyyy h:mm',
  37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)', 45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mm:ss.0', 49: '@',
}

/** ¿El formato es de fecha u hora? (letras d, m, y, h o s fuera de comillas y corchetes de color). */
export function isDateFormat(code: string): boolean {
  const { bare } = formatParts(code)
  return /[dmyhs]/i.test(bare) && !/[0#]/.test(bare.split(';')[0])
}

/** Columna (0, 1, …) de una referencia como "AB12". */
export function columnIndex(ref: string): number {
  let n = 0
  for (const ch of ref.toUpperCase()) {
    const c = ch.charCodeAt(0)
    if (c < 65 || c > 90) break
    n = n * 26 + (c - 64)
  }
  return n - 1
}

/** Número de serie de Excel a fecha (UTC), en el sistema de 1900 o de 1904. */
export function excelDate(serial: number, date1904 = false): Date {
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30)
  return new Date(base + Math.round(serial * 86400000))
}

const textOf = (n: XNode | undefined): string => (n ? (n.name === 't' ? n.text : n.children.map(textOf).join('')) : '')

export class XlsxError extends Error {}

export function readXlsx(bytes: Uint8Array): SheetData[] {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new XlsxError('zip')
  }
  const read = (p: string) => (files[p] ? parseXml(strFromU8(files[p])) : undefined)
  const wb = read('xl/workbook.xml')
  if (!wb) throw new XlsxError('workbook')
  const book = child(wb, 'workbook')
  const date1904 = ['1', 'true'].includes(child(book, 'workbookPr')?.attrs.date1904 ?? '')
  const rels = new Map(children(child(read('xl/_rels/workbook.xml.rels'), 'Relationships'), 'Relationship').map((r) => [r.attrs.Id, r.attrs.Target]))
  const shared = children(child(read('xl/sharedStrings.xml'), 'sst'), 'si').map(textOf)
  const styles = child(read('xl/styles.xml'), 'styleSheet')
  const custom = new Map(children(child(styles, 'numFmts'), 'numFmt').map((f) => [Number(f.attrs.numFmtId), f.attrs.formatCode]))
  const xfs = children(child(styles, 'cellXfs'), 'xf').map((x) => {
    const id = Number(x.attrs.numFmtId ?? 0)
    return custom.get(id) ?? BUILTIN[id]
  })

  return children(child(book, 'sheets'), 'sheet').map((s) => {
    const target = (rels.get(s.attrs['r:id']) ?? '').replace(/^\/?(xl\/)?/, '')
    const ws = child(read(`xl/${target}`), 'worksheet')
    const data: SheetData['data'] = []
    const formats: (string | undefined)[][] = []
    let rowGuess = 0
    for (const row of children(child(ws, 'sheetData'), 'row')) {
      const r = row.attrs.r ? Number(row.attrs.r) - 1 : rowGuess
      rowGuess = r + 1
      let colGuess = 0
      for (const c of children(row, 'c')) {
        const col = c.attrs.r ? columnIndex(c.attrs.r) : colGuess
        colGuess = col + 1
        const fmt = c.attrs.s ? xfs[Number(c.attrs.s)] : undefined
        const v = child(c, 'v')?.text
        let value: unknown = null
        switch (c.attrs.t) {
          case 's':
            value = v === undefined ? null : (shared[Number(v)] ?? '')
            break
          case 'inlineStr':
            value = textOf(child(c, 'is'))
            break
          case 'str':
          case 'e':
            value = v ?? null
            break
          case 'b':
            value = v === '1'
            break
          default:
            if (v !== undefined && v !== '') {
              const n = Number(v)
              value = fmt && isDateFormat(fmt) ? excelDate(n, date1904) : n
            }
        }
        if (value === null || value === '') continue
        ;(data[r] ??= [])[col] = value
        if (fmt && typeof value === 'number') (formats[r] ??= [])[col] = fmt
      }
    }
    // Filas y celdas que faltan, como null (como read-excel-file). Con un for: las filas que
    // faltan son huecos del arreglo y Math.max(...map) daría NaN.
    let width = 0
    for (let i = 0; i < data.length; i++) width = Math.max(width, data[i]?.length ?? 0)
    for (let i = 0; i < data.length; i++) data[i] = Array.from({ length: width }, (_, j) => data[i]?.[j] ?? null)
    return { sheet: s.attrs.name ?? '', data, formats, hidden: s.attrs.state === 'hidden' || s.attrs.state === 'veryHidden' }
  })
}
