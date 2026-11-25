/**
 * Quitar metadatos (W-106): detecta el tipo de archivo por su contenido, lee qué datos
 * ocultos trae y devuelve una copia sin ellos, con el informe de antes y después.
 */
import { readJpeg, readPng, readWebp, stripJpeg, stripPng, stripWebp } from './images'
import { readOffice, stripOffice } from './officeMeta'
import { readPdf, stripPdf, type StripPdfOptions } from './pdfMeta'
import { isTiff, readTiff, stripTiff } from './tiffMeta'
import { bmffKind, readHeif, readVideo, stripHeif, stripVideo } from './bmffMeta'
import { MetaError, type MetaField, type MetaKind, type StripResult } from './types'

export { MetaError }
export type { MetaField, MetaKey, MetaKind, StripResult } from './types'

const OFFICE_EXT = ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm']

// Por extensión también: algunos sistemas no les ponen tipo.
export const META_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/tiff,application/pdf,video/mp4,video/quicktime,video/3gpp,' +
  '.jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.tif,.tiff,.pdf,.mp4,.mov,.m4v,.3gp,' +
  OFFICE_EXT.map((e) => '.' + e).join(',')

/** Tipo de archivo por su contenido (y la extensión para distinguir Office de otros ZIP). */
export function detectKind(name: string, b: Uint8Array): MetaKind | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (isTiff(b)) return 'tiff'
  const bmff = bmffKind(b)
  if (bmff) return bmff
  if (ascii(0, Math.min(b.length, 1024)).includes('%PDF-')) return 'pdf'
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (ascii(0, 4) === 'PK\u0003\u0004' && OFFICE_EXT.includes(ext)) return 'office'
  return null
}

/** Extensiones que la herramienta sabe limpiar: si el contenido no se reconoce, está dañado. */
const KNOWN_EXT = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'heic', 'heif', 'avif', 'mp4', 'mov', 'm4v', 'pdf', ...OFFICE_EXT]

function kindOf(name: string, bytes: Uint8Array): MetaKind {
  if (!bytes.length) throw new MetaError('empty')
  const kind = detectKind(name, bytes)
  if (kind) return kind
  // Un .jpg que no empieza como JPG no es "otro tipo": está dañado (o es otra cosa renombrada).
  const ext = name.toLowerCase().split('.').pop() ?? ''
  throw new MetaError(KNOWN_EXT.includes(ext) ? 'damaged' : 'unsupported')
}

export async function readMetadata(name: string, bytes: Uint8Array): Promise<MetaField[]> {
  const kind = kindOf(name, bytes)
  if (kind === 'jpeg') return readJpeg(bytes)
  if (kind === 'png') return readPng(bytes)
  if (kind === 'webp') return readWebp(bytes)
  if (kind === 'pdf') return readPdf(bytes)
  if (kind === 'tiff') return readTiff(bytes)
  if (kind === 'heif') return readHeif(bytes)
  if (kind === 'video') return readVideo(new Blob([bytes as Uint8Array<ArrayBuffer>]))
  return readOffice(bytes)
}

export type StripOptions = StripPdfOptions

export async function stripMetadata(name: string, bytes: Uint8Array, opts: StripOptions = {}): Promise<StripResult> {
  const kind = kindOf(name, bytes)
  const before = await readMetadata(name, bytes)
  const out = await stripBytes(kind, bytes, opts)
  return { bytes: out, before, after: await readMetadata(name, out) }
}

async function stripBytes(kind: MetaKind, bytes: Uint8Array, opts: StripOptions): Promise<Uint8Array> {
  switch (kind) {
    case 'jpeg':
      return stripJpeg(bytes)
    case 'png':
      return stripPng(bytes)
    case 'webp':
      return stripWebp(bytes)
    case 'pdf':
      return stripPdf(bytes, opts)
    case 'tiff':
      return stripTiff(bytes)
    case 'heif':
      return stripHeif(bytes)
    case 'video':
      return new Uint8Array(await (await stripVideo(new Blob([bytes as Uint8Array<ArrayBuffer>]))).arrayBuffer())
    default:
      return stripOffice(bytes)
  }
}

/**
 * Lo mismo, a partir del archivo (W-147.9): los videos se leen y limpian por partes, sin cargar
 * el archivo entero (pueden pesar varios GB); lo demás, en memoria.
 */
export async function readMetadataFile(file: File): Promise<MetaField[]> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  if (detectKind(file.name, head) === 'video') return readVideo(file)
  return readMetadata(file.name, new Uint8Array(await file.arrayBuffer()))
}

export async function stripMetadataFile(file: File, opts: StripOptions = {}): Promise<{ data: Blob | Uint8Array; before: MetaField[]; after: MetaField[] }> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  if (detectKind(file.name, head) === 'video') {
    const before = await readVideo(file)
    const data = await stripVideo(file)
    return { data, before, after: await readVideo(data) }
  }
  const r = await stripMetadata(file.name, new Uint8Array(await file.arrayBuffer()), opts)
  return { data: r.bytes, before: r.before, after: r.after }
}

/** Contenido del PDF que se quita solo si el usuario lo pide (no es un metadato, es parte del documento). */
export const HIDDEN_KEYS: ReadonlySet<MetaField['key']> = new Set(['comments', 'attachments', 'javascript'])

/** "foto.JPG" + "sin-metadatos" → "foto-sin-metadatos.JPG" (misma extensión). */
export function cleanFileName(name: string, suffix: string): string {
  const m = name.match(/^(.*?)(\.[^./\\]+)?$/)
  const base = (m?.[1] ?? '').trim() || 'archivo'
  return `${base}-${suffix}${m?.[2] ?? ''}`
}

/** Datos que se conservan a propósito (la orientación, para que la foto no aparezca girada). */
export const isKept = (f: MetaField) => f.key === 'orientation'

/** Lo que quedó y no debería (para avisar si algo no se pudo quitar). Sin `hidden`, los comentarios, adjuntos y JavaScript se conservan a propósito. */
export const leftovers = (after: MetaField[], opts?: StripOptions) => {
  const hidden = opts?.hidden ?? true
  return after.filter((f) => !isKept(f) && (hidden || !HIDDEN_KEYS.has(f.key)))
}
