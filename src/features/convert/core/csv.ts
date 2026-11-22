/**
 * CSV ↔ Excel (W-114). Lee CSV con comillas, saltos de línea dentro de los campos y cualquier
 * separador (coma, punto y coma, tabulación o barra), y escribe CSV que Excel abre bien
 * (con BOM para que reconozca las tildes). Para pasar a Excel usa writeXlsx de PDF a Excel.
 */
import { parseNumber, type Cell, type Sheet } from './pdfExcel'

export type Delimiter = ',' | ';' | '\t' | '|'
export const DELIMITERS: readonly Delimiter[] = [',', ';', '\t', '|']

const stripBom = (s: string) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s)

/**
 * El texto de un CSV en la codificación correcta (W-146.7): UTF-8 (con o sin BOM), UTF-16 con BOM
 * o, si no es UTF-8 válido, Windows-1252, que es como guarda Excel en español el "CSV delimitado".
 */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  try {
    return stripBom(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/** Separador más probable: el que aparece el mismo número de veces (y más) en las primeras líneas, fuera de comillas. */
export function detectDelimiter(text: string): Delimiter {
  const lines: string[] = []
  let current = ''
  let quoted = false
  for (const ch of stripBom(text).slice(0, 20000)) {
    if (ch === '"') quoted = !quoted
    if (ch === '\n' && !quoted) {
      if (current.trim()) lines.push(current)
      current = ''
      if (lines.length >= 10) break
    } else if (!quoted) current += ch
  }
  if (current.trim() && lines.length < 10) lines.push(current)
  let best: Delimiter = ','
  let bestScore = 0
  for (const d of DELIMITERS) {
    const counts = lines.map((l) => l.split(d).length - 1)
    if (!counts.length || counts[0] === 0) continue
    const consistent = counts.filter((c) => c === counts[0]).length / counts.length
    const score = counts[0] * consistent * consistent
    if (score > bestScore) {
      best = d
      bestScore = score
    }
  }
  return best
}

/** Filas de un CSV (RFC 4180): comillas dobles, "" como comilla, saltos de línea dentro de comillas. */
export function parseCsv(text: string, delimiter: Delimiter = detectDelimiter(text)): string[][] {
  const s = stripBom(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"' && field === '') quoted = true
    else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  // Sin filas vacías al final.
  while (rows.length && rows[rows.length - 1].every((c) => c === '')) rows.pop()
  return rows
}

/**
 * ¿Se puede guardar como número sin perder nada? No si tiene ceros a la izquierda (cédulas,
 * códigos), espacios internos (teléfonos) o más de 15 cifras (Excel las redondea).
 */
function asNumber(raw: string): ReturnType<typeof parseNumber> {
  const t = raw.trim()
  if (!t || /\d\s+\d/.test(t)) return null
  const digits = t.replace(/\D/g, '')
  if (digits.length > 15) return null
  if (/^[-−(]?\s*0\d/.test(t.replace(/^(\$|COP|USD|€)\s?/i, ''))) return null
  return parseNumber(t)
}

/** Una hoja de Excel a partir de las filas del CSV; la primera en negrita si parece encabezado. */
export function csvToSheet(rows: string[][], name: string): Sheet {
  const header = rows.length > 1 && rows[0].every((c) => c.trim() === '' || !asNumber(c))
  const out: Cell[][] = rows.map((r, ri) =>
    r.map((raw) => {
      if (ri === 0 && header) return { v: raw.trim(), bold: true }
      const n = asNumber(raw)
      return n ? { v: n.value, fmt: n.fmt } : { v: raw }
    }),
  )
  return { name: sheetName(name), rows: out }
}

/** Nombre de hoja válido para Excel: sin \ / ? * [ ] :, hasta 31 caracteres. */
export function sheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Hoja1'
}

export type CsvOptions = { delimiter: Delimiter; decimalComma: boolean }

function cellToText(v: unknown, o: CsvOptions): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') {
    const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 1e10) / 1e10)
    return o.decimalComma ? s.replace('.', ',') : s
  }
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (v instanceof Date) {
    const d = (n: number) => String(n).padStart(2, '0')
    const date = `${v.getUTCFullYear()}-${d(v.getUTCMonth() + 1)}-${d(v.getUTCDate())}`
    return v.getUTCHours() || v.getUTCMinutes() ? `${date} ${d(v.getUTCHours())}:${d(v.getUTCMinutes())}` : date
  }
  return String(v)
}

/** Texto CSV (con BOM y saltos CRLF, como lo guarda Excel). */
export function toCsv(rows: unknown[][], o: CsvOptions): string {
  const quote = (s: string) => (s.includes(o.delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  // Sin filas y columnas vacías al final.
  const trimmed = rows.map((r) => r.map((v) => cellToText(v, o)))
  while (trimmed.length && trimmed[trimmed.length - 1].every((c) => !c)) trimmed.pop()
  const cols = Math.max(0, ...trimmed.map((r) => r.reduce((last, c, j) => (c ? j + 1 : last), 0)))
  return '﻿' + trimmed.map((r) => Array.from({ length: cols }, (_, j) => quote(r[j] ?? '')).join(o.delimiter)).join('\r\n') + '\r\n'
}

/** En los idiomas que escriben decimales con coma, Excel espera punto y coma como separador. */
export function defaultCsvOptions(lang: string): CsvOptions {
  const comma = (1.5).toLocaleString(lang).includes(',')
  return comma ? { delimiter: ';', decimalComma: true } : { delimiter: ',', decimalComma: false }
}
