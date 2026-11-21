/**
 * Lectura mínima de EXIF (TIFF) para mostrar qué datos trae una foto: cámara, programa,
 * fechas, autor y ubicación GPS. Sin dependencias; tolera datos truncados o corruptos.
 */
import type { MetaField } from './types'

const ASCII = 2
const SHORT = 3
const LONG = 4
const RATIONAL = 5
const SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

type Entry = { tag: number; type: number; count: number; at: number }

/** Quita el prefijo "Exif\0\0" si viene (JPEG y algunos WebP lo traen). */
export function tiffStart(b: Uint8Array): number {
  return b.length >= 6 && b[0] === 0x45 && b[1] === 0x78 && b[2] === 0x69 && b[3] === 0x66 && b[4] === 0 && b[5] === 0 ? 6 : 0
}

/** Campos legibles de un bloque EXIF/TIFF. Devuelve [] si no se entiende. */
export function readExif(data: Uint8Array): MetaField[] {
  const base = tiffStart(data)
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength)
  if (data.length < base + 8) return []
  const order = String.fromCharCode(data[base], data[base + 1])
  if (order !== 'II' && order !== 'MM') return []
  const le = order === 'II'
  const u16 = (o: number) => (o + 2 <= data.length ? v.getUint16(o, le) : 0)
  const u32 = (o: number) => (o + 4 <= data.length ? v.getUint32(o, le) : 0)

  const ifd = (off: number): Entry[] => {
    const at = base + off
    if (!off || at + 2 > data.length) return []
    const n = Math.min(u16(at), 256)
    const out: Entry[] = []
    for (let i = 0; i < n; i++) {
      const e = at + 2 + i * 12
      if (e + 12 > data.length) break
      const type = u16(e + 2)
      const count = u32(e + 4)
      const bytes = (SIZE[type] ?? 1) * count
      out.push({ tag: u16(e), type, count, at: bytes <= 4 ? e + 8 : base + u32(e + 8) })
    }
    return out
  }
  const text = (e?: Entry) => {
    if (!e || e.type !== ASCII || e.at + e.count > data.length) return ''
    let s = ''
    for (let i = 0; i < e.count && data[e.at + i]; i++) s += String.fromCharCode(data[e.at + i])
    return s.trim()
  }
  const num = (e?: Entry) => (!e ? 0 : e.type === SHORT ? u16(e.at) : e.type === LONG ? u32(e.at) : 0)
  const rationals = (e?: Entry) => {
    if (!e || e.type !== RATIONAL || e.at + e.count * 8 > data.length) return []
    return Array.from({ length: e.count }, (_, i) => {
      const d = u32(e.at + i * 8 + 4)
      return d ? u32(e.at + i * 8) / d : 0
    })
  }

  const ifd0 = ifd(u32(base + 4))
  const get = (list: Entry[], tag: number) => list.find((e) => e.tag === tag)
  const exif = ifd(num(get(ifd0, 0x8769)))
  const gps = ifd(num(get(ifd0, 0x8825)))

  const fields: MetaField[] = []
  const add = (key: MetaField['key'], value: string) => value && fields.push({ key, value })
  add('camera', [text(get(ifd0, 0x010f)), text(get(ifd0, 0x0110))].filter(Boolean).join(' '))
  add('lens', text(get(exif, 0xa434)))
  add('serial', text(get(exif, 0xa431)))
  add('dateTaken', text(get(exif, 0x9003)) || text(get(ifd0, 0x0132)))
  add('software', text(get(ifd0, 0x0131)))
  add('author', text(get(ifd0, 0x013b)) || text(get(exif, 0xa430)))
  add('copyright', text(get(ifd0, 0x8298)))
  add('description', text(get(ifd0, 0x010e)))
  const lat = rationals(get(gps, 2))
  const lon = rationals(get(gps, 4))
  if (lat.length === 3 && lon.length === 3) {
    const deg = (r: number[], neg: boolean) => (neg ? -1 : 1) * (r[0] + r[1] / 60 + r[2] / 3600)
    const la = deg(lat, text(get(gps, 1)) === 'S')
    const lo = deg(lon, text(get(gps, 3)) === 'W')
    if (Number.isFinite(la) && Number.isFinite(lo) && (la || lo)) add('gps', `${la.toFixed(5)}, ${lo.toFixed(5)}`)
  }
  const orientation = num(get(ifd0, 0x0112))
  if (orientation > 1 && orientation <= 8) add('orientation', String(orientation))
  return fields
}

/** Orientación EXIF (1–8) o 1 si no hay. */
export function exifOrientation(data: Uint8Array): number {
  const o = readExif(data).find((f) => f.key === 'orientation')
  return o ? Number(o.value) : 1
}

/**
 * EXIF mínimo con solo la orientación (para que la foto no aparezca girada al quitar el resto).
 * Formato TIFF big-endian: cabecera, un IFD con una entrada y sin siguiente IFD.
 */
export function orientationOnlyExif(orientation: number): Uint8Array {
  return new Uint8Array([
    0x45, 0x78, 0x69, 0x66, 0, 0, // "Exif\0\0"
    0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, // "MM", 42, IFD en 8
    0, 1, // una entrada
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation & 0xff, 0, 0, // Orientation SHORT ×1
    0, 0, 0, 0, // sin siguiente IFD
  ])
}
