/**
 * Varios QR desde una lista (W-147.8): una línea por QR, pegada o desde un CSV/TXT. Si el archivo
 * tiene columnas (separadas por punto y coma, tabulador o coma, siempre las mismas en todas las
 * líneas), la primera es el contenido y la segunda el nombre que va debajo del QR y en el archivo.
 */

export type QrListItem = { content: string; label: string }

/** Más que esto no tiene sentido en el navegador (ni para imprimir). */
export const MAX_LIST = 500

const HEADER = /^(contenido|content|url|urls|texto|text|enlace|enlaces|link|links|dato|datos|data|qr|valor|value)$/i

/** Separa una línea en campos con el separador dado, respetando las comillas de CSV. */
export function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"' && cur.trim() === '') {
      quoted = true
      cur = ''
    } else if (c === sep) {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out.map((f) => f.trim())
}

/**
 * El separador de columnas, si lo hay: el primero (tabulador, punto y coma, coma) con el que
 * todas las líneas tienen la misma cantidad de campos, y al menos dos. Una lista de textos con
 * comas sueltas no se parte.
 */
export function detectSeparator(lines: string[]): string | null {
  for (const sep of ['\t', ';', ',']) {
    const counts = lines.map((l) => splitCsvLine(l, sep).length)
    if (counts[0] >= 2 && counts.every((n) => n === counts[0])) return sep
  }
  return null
}

/** Lee la lista: sin líneas vacías ni encabezado, como mucho MAX_LIST. `truncated` si había más. */
export function parseQrList(text: string): { items: QrListItem[]; truncated: boolean } {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
  if (!lines.length) return { items: [], truncated: false }
  const sep = detectSeparator(lines)
  let rows = lines.map((l) => (sep ? splitCsvLine(l, sep) : [l.trim()]))
  if (HEADER.test(rows[0][0])) rows = rows.slice(1)
  const items = rows
    .map(([content, label]) => ({ content: content ?? '', label: (label ?? '').trim() }))
    .filter((it) => it.content)
  return { items: items.slice(0, MAX_LIST), truncated: items.length > MAX_LIST }
}

/** Nombre del archivo de cada QR: el nombre de la lista (o el contenido) sin caracteres prohibidos. */
export function itemFileName(item: QrListItem, index: number, used: Set<string>): string {
  const base =
    Array.from(item.label || item.content.replace(/^[a-z][a-z0-9+.-]*:\/*/i, ''))
      .map((c) => (c < ' ' || '\\/:*?"<>|#%&{}$!\'@+`='.includes(c) ? ' ' : c))
      .join('')
      .split(/\s+/)
      .filter(Boolean)
      .join('-')
      .slice(0, 40) || 'qr'
  let name = `${String(index + 1).padStart(3, '0')}-${base}`
  for (let n = 2; used.has(name.toLowerCase()); n++) name = `${String(index + 1).padStart(3, '0')}-${base}-${n}`
  used.add(name.toLowerCase())
  return `${name}.png`
}
