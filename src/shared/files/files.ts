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

/** Extensión con el punto (".pdf"), o "" si no tiene. */
export function extensionOf(name: string): string {
  return /\.[^.]+$/.exec(name)?.[0] ?? ''
}

/**
 * Nombre que eligió el usuario para el resultado: sin caracteres que los sistemas de archivos
 * no aceptan, sin espacios sobrantes y de largo razonable; vacío = el nombre original.
 */
export function cleanBaseName(input: string, fallback: string): string {
  const clean = input
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 120)
  return clean || fallback
}

/** El mismo archivo con otro nombre (conserva la extensión y el tipo); si no cambia, el mismo objeto. */
export function renamed(file: File, base: string): File {
  const name = cleanBaseName(base, baseName(file.name)) + extensionOf(file.name)
  return name === file.name ? file : new File([file], name, { type: file.type, lastModified: file.lastModified })
}

// Tipos que el sitio genera a propósito. Cualquier otro (text/html, image/svg+xml…)
// se descarga como binario: aunque alguien abriera el blob, el navegador no lo interpreta.
const SAFE_DOWNLOAD_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/vcard',
  'text/calendar',
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

/** Imagen SVG (por tipo o extensión): puede traer scripts si se abre como página. */
export const isSvgFile = (file: { type: string; name: string }) => /^image\/svg\+xml\b/i.test(file.type) || /\.svgz?$/i.test(file.name)

/**
 * SVG del usuario como `data:` para un `<img>` (ahí sus scripts no corren). A diferencia de un
 * `blob:` del mismo origen, el navegador no deja abrir un `data:` como página ("abrir imagen en
 * pestaña nueva"), así que su código nunca se ejecuta con el origen del sitio.
 */
export async function svgDataUrl(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:image/svg+xml;base64,${btoa(bin)}`
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

/**
 * "1-3, 4-8, 10" → un grupo por cada parte separada por comas (índices base 0), en el orden
 * escrito: Dividir hace un PDF por grupo. "8-" llega hasta el final y "-3" empieza en la 1.
 * null si alguna parte no es válida.
 */
export function parseRangeGroups(input: string, pageCount: number): number[][] | null {
  const groups: number[][] = []
  for (const raw of input.split(',')) {
    if (!raw.trim()) continue
    const pages = parsePageRanges(raw, pageCount)
    if (!pages) return null
    groups.push(pages)
  }
  return groups.length ? groups : null
}

/** Grupos de `size` páginas seguidas (la última puede quedar más corta). */
export function chunkPages(pageCount: number, size: number): number[][] {
  const n = Math.max(1, Math.floor(size))
  const groups: number[][] = []
  for (let i = 0; i < pageCount; i += n) groups.push(Array.from({ length: Math.min(n, pageCount - i) }, (_, k) => i + k))
  return groups
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

/** Copia de la lista con el elemento `from` movido a la posición `to` (arrastrar y soltar). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = list.slice()
  if (from < 0 || from >= copy.length) return copy
  const [item] = copy.splice(from, 1)
  copy.splice(Math.max(0, Math.min(copy.length, to)), 0, item)
  return copy
}

/** Recorta por el medio, para que se vea el final (lo que suele diferenciar: "-3.pdf"). */
export function middleEllipsis(name: string, max: number): string {
  if (name.length <= max) return name
  // Un comienzo corto (5) y el final lo más largo posible: el número y la extensión.
  const head = Math.min(5, Math.max(1, Math.floor((max - 1) / 3)))
  const tail = max - 1 - head
  return `${name.slice(0, head)}…${name.slice(name.length - tail)}`
}

/**
 * Nombres cortos para varios archivos que se muestran juntos (resultados de dividir, de PDF a
 * imagen…): si comparten el comienzo, se muestra desde la última palabra de lo común
 * ("pagina-3.pdf" en vez de "contrato-d…" igual en todos), y lo largo se recorta por el medio.
 */
export function distinctLabels(names: readonly string[], max = 18): string[] {
  if (names.length < 2) return names.map((n) => middleEllipsis(n, max))
  let common = names[0]
  for (const n of names) {
    let i = 0
    while (i < common.length && i < n.length && common[i] === n[i]) i++
    common = common.slice(0, i)
  }
  // Se corta en un separador para no partir una palabra ("contrato-de-…-pagina-" → desde "pagina").
  const words = common.split(/[-_ .]/)
  const keep = words.length > 1 ? common.length - words[words.length - 1].length - (words[words.length - 2]?.length ?? 0) - 1 : 0
  const cut = keep > 3 ? keep : 0
  return names.map((n) => middleEllipsis(n.slice(cut), max))
}
