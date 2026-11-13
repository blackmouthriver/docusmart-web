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

// Tipos que el sitio genera a propósito. Cualquier otro (text/html, image/svg+xml…)
// se descarga como binario: aunque alguien abriera el blob, el navegador no lo interpreta.
const SAFE_DOWNLOAD_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
])

export function safeMimeType(type: string): string {
  const base = type.split(';')[0].trim().toLowerCase()
  return SAFE_DOWNLOAD_TYPES.has(base) ? type : 'application/octet-stream'
}

/** Nombre de archivo sin rutas ni caracteres de control. */
export function safeFilename(name: string): string {
  // eslint-disable-next-line no-control-regex
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_').trim()
  return (clean || 'archivo').slice(0, 180)
}

/** Solo URLs blob: creadas por este mismo sitio. */
export function isOwnBlobUrl(url: string, origin = location.origin): boolean {
  return url.startsWith(`blob:${origin}/`)
}

export function download(data: Blob | Uint8Array, filename: string, type = 'application/octet-stream') {
  const source = data instanceof Blob ? data : new Blob([data as BlobPart], { type })
  // El contenido puede venir de archivos o textos del usuario: se re-empaqueta con un tipo seguro.
  const blob = new Blob([source], { type: safeMimeType(source.type || type) })
  const url = URL.createObjectURL(blob)
  if (!isOwnBlobUrl(url)) throw new Error('URL de descarga inesperada')
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename(filename)
  a.rel = 'noopener'
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
    // Sin expresiones regulares con retroceso: "a", "a-b", "a-" o "-b".
    const dash = part.indexOf('-')
    const left = (dash === -1 ? part : part.slice(0, dash)).trim()
    const right = dash === -1 ? '' : part.slice(dash + 1).trim()
    const isNum = (s: string) => /^\d+$/.test(s)
    if ((left && !isNum(left)) || (right && !isNum(right)) || (!left && !right)) return null
    const start = left ? Number(left) : 1
    let end = start
    if (dash !== -1) end = right ? Number(right) : pageCount
    if (start < 1 || end > pageCount || start > end) return null
    for (let p = start; p <= end; p++) out.add(p - 1)
  }
  return out.size ? [...out].sort((a, b) => a - b) : null
}
