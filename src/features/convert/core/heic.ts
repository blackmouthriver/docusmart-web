/**
 * HEIC a JPG (W-107): reconocer las fotos HEIC/HEIF (las del iPhone) y nombrar el resultado.
 * Partes puras, para poder probarlas; la decodificación está en infra/heicDecoder.ts.
 */

/** Marcas de un archivo HEIF con imágenes HEVC (las que DocuSmart sabe abrir). */
const HEVC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'])
/** Marcas genéricas de HEIF: el contenido se sabe por las marcas compatibles. */
const GENERIC_BRANDS = new Set(['mif1', 'msf1', 'mif2'])

const fourcc = (b: Uint8Array, at: number) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3])

/**
 * ¿Es una foto HEIC? Mira la caja `ftyp` del inicio (bastan los primeros 64 bytes): la marca
 * principal o, si es genérica (mif1), las compatibles. Un AVIF (también HEIF, pero AV1) no cuenta.
 */
export function isHeic(head: Uint8Array): boolean {
  if (head.length < 16 || fourcc(head, 4) !== 'ftyp') return false
  const major = fourcc(head, 8)
  if (HEVC_BRANDS.has(major)) return true
  if (!GENERIC_BRANDS.has(major)) return false
  const boxSize = ((head[0] << 24) | (head[1] << 16) | (head[2] << 8) | head[3]) >>> 0
  const end = Math.min(head.length, boxSize || head.length)
  for (let at = 16; at + 4 <= end; at += 4) if (HEVC_BRANDS.has(fourcc(head, at))) return true
  return false
}

/** Por nombre o tipo (antes de leer el archivo): .heic / .heif o image/heic / image/heif. */
export const looksLikeHeic = (name: string, type: string) => /\.(heic|heif)$/i.test(name) || /^image\/hei[cf](-sequence)?$/i.test(type)

export type HeicTarget = 'jpg' | 'png'

/** "IMG_0001.HEIC" → "IMG_0001.jpg" */
export function heicOutputName(name: string, target: HeicTarget): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'foto'
  return `${base}.${target}`
}

/** Calidad del JPG en porcentaje (50 a 100) → valor para el canvas (0,5 a 1). */
export function jpegQuality(percent: number): number {
  if (!Number.isFinite(percent)) return 0.9
  return Math.min(100, Math.max(50, Math.round(percent))) / 100
}
