/**
 * Quitar metadatos (W-106): detecta el tipo de archivo por su contenido, lee qué datos
 * ocultos trae y devuelve una copia sin ellos, con el informe de antes y después.
 */
import { readJpeg, readPng, readWebp, stripJpeg, stripPng, stripWebp } from './images'
import { readOffice, stripOffice } from './officeMeta'
import { readPdf, stripPdf, type StripPdfOptions } from './pdfMeta'
import { MetaError, type MetaField, type MetaKind, type StripResult } from './types'

export { MetaError }
export type { MetaField, MetaKey, MetaKind, StripResult } from './types'

const OFFICE_EXT = ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm']

// Por extensión también: algunos sistemas no les ponen tipo.
export const META_ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf,' + OFFICE_EXT.map((e) => '.' + e).join(',')

/** Tipo de archivo por su contenido (y la extensión para distinguir Office de otros ZIP). */
export function detectKind(name: string, b: Uint8Array): MetaKind | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(0, Math.min(b.length, 1024)).includes('%PDF-')) return 'pdf'
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (ascii(0, 4) === 'PK\u0003\u0004' && OFFICE_EXT.includes(ext)) return 'office'
  return null
}

function kindOf(name: string, bytes: Uint8Array): MetaKind {
  const kind = detectKind(name, bytes)
  if (!kind) throw new MetaError('unsupported')
  return kind
}

export async function readMetadata(name: string, bytes: Uint8Array): Promise<MetaField[]> {
  const kind = kindOf(name, bytes)
  if (kind === 'jpeg') return readJpeg(bytes)
  if (kind === 'png') return readPng(bytes)
  if (kind === 'webp') return readWebp(bytes)
  if (kind === 'pdf') return readPdf(bytes)
  return readOffice(bytes)
}

export type StripOptions = StripPdfOptions

export async function stripMetadata(name: string, bytes: Uint8Array, opts: StripOptions = {}): Promise<StripResult> {
  const kind = kindOf(name, bytes)
  const before = await readMetadata(name, bytes)
  const out = kind === 'jpeg' ? stripJpeg(bytes) : kind === 'png' ? stripPng(bytes) : kind === 'webp' ? stripWebp(bytes) : kind === 'pdf' ? await stripPdf(bytes, opts) : stripOffice(bytes)
  return { bytes: out, before, after: await readMetadata(name, out) }
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
