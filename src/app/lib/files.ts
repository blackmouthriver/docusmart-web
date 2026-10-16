import { zipSync } from 'fflate'

export type Kind = 'pdf' | 'image' | 'text' | 'other'

export function kindOf(file: File): Kind {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/.test(name)) return 'image'
  if (file.type.startsWith('text/') || /\.(txt|csv|md|html?)$/.test(name)) return 'text'
  return 'other'
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

export function download(data: Blob | Uint8Array, filename: string, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Un solo archivo se descarga tal cual; varios se agrupan en un .zip. */
export async function downloadMany(files: Array<{ name: string; data: Blob | Uint8Array }>, zipName: string) {
  if (files.length === 1) return download(files[0].data, files[0].name)
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) {
    entries[f.name] = f.data instanceof Blob ? new Uint8Array(await f.data.arrayBuffer()) : f.data
  }
  download(zipSync(entries, { level: 0 }), zipName, 'application/zip')
}

export function parsePageRanges(input: string, pageCount: number): number[] | null {
  // "1-3, 5, 8-" → índices base 0. null si el texto no es válido.
  const out = new Set<number>()
  for (const raw of input.split(',')) {
    const part = raw.trim()
    if (!part) continue
    const m = part.match(/^(\d+)?\s*(-)?\s*(\d+)?$/)
    if (!m || (!m[1] && !m[3])) return null
    const start = m[1] ? Number(m[1]) : 1
    const end = m[2] ? (m[3] ? Number(m[3]) : pageCount) : start
    if (start < 1 || end > pageCount || start > end) return null
    for (let p = start; p <= end; p++) out.add(p - 1)
  }
  return out.size ? [...out].sort((a, b) => a - b) : null
}
