/**
 * Dividir por marcadores y por tamaño (W-147.6), como Sejda:
 * - Por marcadores: un PDF por cada marcador del primer nivel (un capítulo), desde su página
 *   hasta antes del siguiente. Las páginas antes del primer marcador van en su propio archivo.
 * - Por tamaño: partes de páginas seguidas que no pasan de un tamaño máximo (por ejemplo, para
 *   mandarlas por correo). Se mide guardando cada parte, así el tamaño es el real.
 */
import { PDFDocument } from 'pdf-lib'

export type BookmarkGroup = { title: string | null; pages: number[] }

/**
 * Los grupos de páginas de cada marcador. Los marcadores que apuntan a la misma página que el
 * anterior se juntan (se usa el primer título); el orden es el de las páginas.
 */
export function bookmarkGroups(count: number, marks: Array<{ title: string; page: number }>): BookmarkGroup[] {
  const starts = new Map<number, string>()
  for (const m of [...marks].sort((a, b) => a.page - b.page)) {
    if (m.page >= 0 && m.page < count && !starts.has(m.page)) starts.set(m.page, m.title)
  }
  const pages = [...starts.keys()]
  if (!pages.length) return []
  const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i)
  const groups: BookmarkGroup[] = pages[0] > 0 ? [{ title: null, pages: range(0, pages[0]) }] : []
  pages.forEach((p, i) => groups.push({ title: starts.get(p) || null, pages: range(p, pages[i + 1] ?? count) }))
  return groups
}

/** Un título como parte de un nombre de archivo: sin caracteres prohibidos y corto. */
export function fileSafe(title: string, max = 60): string {
  const clean = Array.from(title.normalize('NFC'))
    .map((c) => (c < ' ' || '\\/:*?"<>|'.includes(c) ? ' ' : c))
    .join('')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
  return Array.from(clean).slice(0, max).join('').replace(/[ .]+$/, '')
}

export type SizeSplit = {
  groups: number[][]
  files: Uint8Array[]
  /** Índices de las partes que pasan del máximo porque tienen una sola página que ya es más grande. */
  oversize: number[]
}

/**
 * Parte el PDF en archivos de páginas seguidas de hasta `maxBytes`. Para cada parte busca
 * cuántas páginas caben duplicando y luego por bisección: unas pocas veces guardar por parte.
 */
export async function splitBySize(bytes: ArrayBuffer | Uint8Array, maxBytes: number, onProgress?: (done: number, total: number) => void): Promise<SizeSplit> {
  const src = await PDFDocument.load(bytes)
  const total = src.getPageCount()
  const save = async (from: number, n: number) => {
    const out = await PDFDocument.create()
    const pages = await out.copyPages(src, Array.from({ length: n }, (_, i) => from + i))
    pages.forEach((p) => out.addPage(p))
    return out.save()
  }
  const result: SizeSplit = { groups: [], files: [], oversize: [] }
  let from = 0
  while (from < total) {
    const left = total - from
    let best = await save(from, 1)
    let fit = 1
    if (best.length > maxBytes) result.oversize.push(result.groups.length)
    else {
      // Duplicar hasta pasarse (o llegar al final)…
      let over = 0
      for (let n = 2; ; n = Math.min(left, n * 2)) {
        const data = await save(from, n)
        if (data.length > maxBytes) {
          over = n
          break
        }
        best = data
        fit = n
        if (n === left) break
      }
      // …y buscar entre lo que cupo y lo que no.
      while (over && over - fit > 1) {
        const mid = Math.floor((fit + over) / 2)
        const data = await save(from, mid)
        if (data.length > maxBytes) over = mid
        else {
          best = data
          fit = mid
        }
      }
    }
    result.groups.push(Array.from({ length: fit }, (_, i) => from + i))
    result.files.push(best)
    from += fit
    onProgress?.(from, total)
  }
  return result
}
