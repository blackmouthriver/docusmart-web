/**
 * PDF a Excel: cada línea del PDF es una fila y las columnas salen de la
 * alineación del texto (igual que las tablas de PDF a Word). Los números se
 * guardan como números de Excel (con formato de moneda, porcentaje o
 * decimales) para poder sumarlos. El .xlsx se escribe a mano con fflate.
 */
import { strToU8, zipSync } from 'fflate'
import { buildLines, columnAnchors, xmlText, type Line, type PageInfo, type TextFrag } from './pdfWord'
import { tr } from '../i18n/translate'

export type NumFmt = 'integer' | 'decimal' | 'currency' | 'currency2' | 'percent'
export type Cell = { v: string | number; bold?: boolean; fmt?: NumFmt }
export type Sheet = { name: string; rows: Cell[][] }

/* ───────────── Números ───────────── */

/**
 * Convierte "1.500.000", "1,234.56", "$ 2.000", "45%" o "-3,5" en número.
 * Con punto y coma a la vez, el último es el decimal; con uno solo, grupos de
 * 3 cifras indican miles (formato colombiano "1.500" = 1500).
 */
export function parseNumber(raw: string): { value: number; fmt: NumFmt } | null {
  let s = raw.trim().replace(/ /g, ' ')
  if (!s || s.length > 30) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  if (s.startsWith('-') || s.startsWith('−')) {
    negative = !negative
    s = s.slice(1).trim()
  }
  const currency = /^(\$|COP|USD|€)\s?/i.test(s)
  s = s.replace(/^(\$|COP|USD|€)\s?/i, '').trim()
  const percent = s.endsWith('%')
  if (percent) s = s.slice(0, -1).trim()
  if (!/^\d[\d.,\s]*$/.test(s) || /[.,]$/.test(s)) return null
  s = s.replace(/\s/g, '')
  let normalized: string
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ','
    normalized = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.')
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ','
    const groups = s.split(sep)
    const thousands = groups.length > 1 && groups.slice(1).every((g) => g.length === 3) && groups[0].length <= 3
    normalized = thousands ? groups.join('') : groups.length === 2 ? groups.join('.') : ''
  } else normalized = s
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) return null
  let value = Number(normalized) * (negative ? -1 : 1)
  const hasDecimals = normalized.includes('.')
  if (percent) {
    value /= 100
    return { value, fmt: 'percent' }
  }
  return { value, fmt: currency ? (hasDecimals ? 'currency2' : 'currency') : hasDecimals ? 'decimal' : 'integer' }
}

/* ───────────── Hojas ───────────── */

const segText = (l: Line, i: number) => l.segments[i].runs.map((r) => r.text).join('')
const segBold = (l: Line, i: number) => l.segments[i].runs.every((r) => r.bold)

function toCell(text: string, bold: boolean): Cell {
  const n = parseNumber(text)
  return n ? { v: n.value, fmt: n.fmt, bold } : { v: text, bold }
}

/** Filas de una página: columnas según la alineación; líneas de un solo bloque, en la columna A. */
export function pageRows(lines: Line[]): Cell[][] {
  const multi = lines.filter((l) => l.segments.length >= 2)
  const size = lines[0]?.size ?? 10
  const anchors = multi.length >= 2 ? columnAnchors(multi, 1.5 * size) : []
  const colOf = (x: number) => anchors.reduce((col, a, i) => (x >= a - 1.5 * size ? i : col), 0)
  // Espaciado típico entre líneas de la página (las tablas de Word tienen filas más altas que el texto).
  const gaps = lines.slice(1).map((l, k) => l.y - lines[k].y).sort((a, b) => a - b)
  const typical = gaps.length ? gaps[Math.floor(gaps.length / 2)] : size
  const rows: Cell[][] = []
  lines.forEach((l, k) => {
    const prev = lines[k - 1]
    const gap = prev ? l.y - prev.y : 0
    // Texto que sigue en la línea de abajo dentro de una celda ("Transferencia / recibida").
    if (prev && prev.segments.length >= 2 && l.segments.length === 1 && anchors.length >= 2 && gap <= 1.6 * l.size && colOf(l.segments[0].x0) > 0) {
      const cell = rows[rows.length - 1][colOf(l.segments[0].x0)]
      if (cell && typeof cell.v === 'string' && cell.v !== '') {
        cell.v += ' ' + segText(l, 0)
        return
      }
    }
    // Un espacio claramente mayor que el habitual deja una fila vacía, como en el documento.
    if (prev && gap > Math.max(1.8 * typical, 1.6 * Math.max(l.size, prev.size))) rows.push([])
    if (l.segments.length < 2 || anchors.length < 2) {
      rows.push([toCell(l.segments.map((_, i) => segText(l, i)).join(' '), l.segments.every((_, i) => segBold(l, i)))])
      return
    }
    const row: Cell[] = []
    l.segments.forEach((s, i) => {
      const col = colOf(s.x0)
      while (row.length < col) row.push({ v: '' })
      const prev = row[col]
      const text = segText(l, i)
      // Dos bloques en la misma columna: se unen en la celda.
      row[col] = prev && prev.v !== '' ? { v: `${prev.v} ${text}`, bold: prev.bold } : toCell(text, segBold(l, i))
    })
    rows.push(row)
  })
  return rows
}

const sheetName = (s: string) => s.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)

/** Una hoja por página, o todo seguido en una sola hoja. */
export function buildSheets(pages: PageInfo[], texts: TextFrag[], mode: 'pages' | 'single' = 'pages'): Sheet[] {
  // Umbral fino para separar columnas (entre celdas de Word hay al menos ~1 tamaño de letra; entre
  // palabras, ~0,25): en una hoja de cálculo una columna de más no molesta.
  const perPage = pages.map((_, p) => pageRows(buildLines(texts.filter((t) => t.page === p), 0.6)))
  if (mode === 'single' || pages.length === 1) {
    const rows = perPage.flatMap((r, i) => (i > 0 && r.length ? [[], ...r] : r))
    return [{ name: 'Hoja 1', rows }]
  }
  return perPage.map((rows, i) => ({ name: sheetName(tr('out.sheetPage', { n: i + 1 })), rows }))
}

/* ───────────── Escribir el .xlsx ───────────── */

const colName = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : colName(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)))

// Estilos: 0 normal, 1 negrita; 2..6 formatos numéricos; 7..11 los mismos en negrita.
const FMT_ORDER: NumFmt[] = ['integer', 'decimal', 'currency', 'currency2', 'percent']
const styleOf = (c: Cell) => (c.fmt ? 2 + FMT_ORDER.indexOf(c.fmt) + (c.bold ? 5 : 0) : c.bold ? 1 : 0)

/** Caracteres que ocupa la celda ya con formato ("$1.234.567,50"), para que no salga "#####". */
function displayWidth(c: Cell): number {
  if (typeof c.v !== 'number') return c.v.length
  const digits = String(Math.trunc(Math.abs(c.fmt === 'percent' ? c.v * 100 : c.v))).length
  const separators = Math.floor((digits - 1) / 3)
  const extra = (c.fmt?.startsWith('currency') ? 1 : 0) + (c.fmt === 'currency2' || c.fmt === 'decimal' ? 3 : 0) + (c.fmt === 'percent' ? 1 : 0) + (c.v < 0 ? 1 : 0)
  return digits + separators + extra + (c.bold ? 1 : 0)
}

function sheetXml(sheet: Sheet): string {
  const widths: number[] = []
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((c, i) => {
          widths[i] = Math.max(widths[i] ?? 8, Math.min(60, displayWidth(c) + 2))
          if (c.v === '') return ''
          const ref = `${colName(i)}${r + 1}`
          const s = styleOf(c)
          const style = s ? ` s="${s}"` : ''
          return typeof c.v === 'number' ? `<c r="${ref}"${style}><v>${c.v}</v></c>` : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlText(c.v)}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join('')
  const cols = widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/><numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="166" formatCode="#,##0.##########"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="12">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  [0, 1].map((bold) => ['3', '166', '164', '165', '9'].map((id) => `<xf numFmtId="${id}" fontId="${bold}" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"${bold ? ' applyFont="1"' : ''}/>`).join('')).join('') +
  '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

export function writeXlsx(sheets: Sheet[]): Uint8Array {
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
        .map((s, i) => `<sheet name="${xmlText(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join('')}<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
    'xl/styles.xml': strToU8(STYLES),
  }
  sheets.forEach((s, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s))))
  return zipSync(files, { level: 6 })
}

/** Cuántas filas y celdas con números hay, para el resumen. */
export function summarizeSheets(sheets: Sheet[]) {
  const cells = sheets.flatMap((s) => s.rows.flat())
  return { sheets: sheets.length, rows: sheets.reduce((n, s) => n + s.rows.length, 0), numbers: cells.filter((c) => typeof c.v === 'number').length }
}
