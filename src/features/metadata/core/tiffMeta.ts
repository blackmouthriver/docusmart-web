/**
 * Metadatos de TIFF (W-147.9) sin tocar la imagen: en cada directorio (IFD) se quitan las
 * entradas con datos personales (cámara, programa, fechas, autor, derechos, EXIF, GPS, XMP,
 * IPTC, Photoshop y las de Windows) y se borran sus valores (se ponen en cero), para que no
 * queden escondidos en el archivo. Se conserva todo lo necesario para ver la imagen
 * (tamaño, compresión, tiras o mosaicos, perfil de color, orientación…).
 */
import { readExif } from './exif'
import { MetaError, type MetaField } from './types'

const SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4 }
const EXIF_IFD = 0x8769
const GPS_IFD = 0x8825
const INTEROP_IFD = 0xa005
const XMP = 0x02bc
const IPTC = 0x83bb
const PHOTOSHOP = 0x8649

/** Entradas que se quitan: todo lo que identifica a la persona, el equipo o el momento. */
export const TIFF_PRIVATE_TAGS: ReadonlySet<number> = new Set([
  0x010d, // DocumentName
  0x010e, // ImageDescription
  0x010f, // Make
  0x0110, // Model
  0x011d, // PageName
  0x0131, // Software
  0x0132, // DateTime
  0x013b, // Artist
  0x013c, // HostComputer
  0x8298, // Copyright
  XMP,
  IPTC,
  PHOTOSHOP,
  EXIF_IFD,
  GPS_IFD,
  0x9c9b, 0x9c9c, 0x9c9d, 0x9c9e, 0x9c9f, // XPTitle, XPComment, XPAuthor, XPKeywords, XPSubject
  0xa430, 0xa431, 0xa434, // CameraOwnerName, BodySerialNumber, LensModel (si vienen en IFD0)
])

export const isTiff = (b: Uint8Array) => b.length >= 8 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 42 && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 42))

type Reader = { le: boolean; u16: (o: number) => number; u32: (o: number) => number; set16: (o: number, v: number) => void; set32: (o: number, v: number) => void }

function reader(b: Uint8Array): Reader {
  if (b.length >= 4 && ((b[0] === 0x49 && b[2] === 43) || (b[0] === 0x4d && b[3] === 43))) throw new MetaError('unsupported') // BigTIFF
  if (!isTiff(b)) throw new MetaError('damaged')
  const le = b[0] === 0x49
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const ok = (o: number, n: number) => o >= 0 && o + n <= b.length
  return {
    le,
    u16: (o) => (ok(o, 2) ? v.getUint16(o, le) : 0),
    u32: (o) => (ok(o, 4) ? v.getUint32(o, le) : 0),
    set16: (o, x) => ok(o, 2) && v.setUint16(o, x, le),
    set32: (o, x) => ok(o, 4) && v.setUint32(o, x, le),
  }
}

type Entry = { tag: number; type: number; count: number; raw: Uint8Array; value: number; bytes: number }

/** Las entradas de un IFD en `at` y el desplazamiento del siguiente (0 si no hay). */
function readIfd(b: Uint8Array, r: Reader, at: number): { entries: Entry[]; next: number } | null {
  if (!at || at + 2 > b.length) return null
  const n = r.u16(at)
  if (at + 2 + n * 12 + 4 > b.length) return null
  const entries: Entry[] = []
  for (let i = 0; i < n; i++) {
    const e = at + 2 + i * 12
    const type = r.u16(e + 2)
    const count = r.u32(e + 4)
    entries.push({ tag: r.u16(e), type, count, raw: b.slice(e, e + 12), value: r.u32(e + 8), bytes: (SIZE[type] ?? 1) * count })
  }
  return { entries, next: r.u32(at + 2 + n * 12) }
}

/** Pone en cero los valores que están fuera de la entrada (más de 4 bytes). */
function zeroValue(b: Uint8Array, e: Entry) {
  if (e.bytes > 4 && e.value + e.bytes <= b.length) b.fill(0, e.value, e.value + e.bytes)
}

/** Borra un sub-IFD entero (EXIF, GPS): sus valores y el propio directorio. */
function zeroSubIfd(b: Uint8Array, r: Reader, at: number, seen: Set<number>) {
  if (seen.has(at)) return
  seen.add(at)
  const ifd = readIfd(b, r, at)
  if (!ifd) return
  for (const e of ifd.entries) {
    if (e.tag === INTEROP_IFD) zeroSubIfd(b, r, e.value, seen)
    zeroValue(b, e)
  }
  b.fill(0, at, at + 2 + ifd.entries.length * 12 + 4)
}

export function readTiff(b: Uint8Array): MetaField[] {
  const r = reader(b)
  const fields = readExif(b)
  const ifd0 = readIfd(b, r, r.u32(4))
  const has = (tag: number) => ifd0?.entries.find((e) => e.tag === tag)
  const xmp = has(XMP)
  if (xmp) fields.push({ key: 'xmp', value: `${Math.max(1, Math.round(xmp.bytes / 1024))} KB` })
  if (has(IPTC) || has(PHOTOSHOP)) fields.push({ key: 'iptc', value: `${Math.max(1, Math.round(((has(IPTC)?.bytes ?? 0) + (has(PHOTOSHOP)?.bytes ?? 0)) / 1024))} KB` })
  const xp = [0x9c9b, 0x9c9c, 0x9c9d, 0x9c9e, 0x9c9f].filter((t) => has(t))
  if (xp.length) fields.push({ key: 'custom', value: 'Windows (XP*)' })
  if (has(0x010d) || has(0x011d) || has(0x013c)) fields.push({ key: 'custom', value: 'DocumentName / PageName / HostComputer' })
  return fields
}

/** Copia del TIFF sin datos personales (en todas las páginas), del mismo tamaño y con la misma imagen. */
export function stripTiff(input: Uint8Array): Uint8Array {
  const b = input.slice()
  const r = reader(b)
  const seenIfd = new Set<number>()
  const seenSub = new Set<number>()
  let at = r.u32(4)
  while (at && !seenIfd.has(at) && seenIfd.size < 1000) {
    seenIfd.add(at)
    const ifd = readIfd(b, r, at)
    if (!ifd) break
    const keep: Entry[] = []
    for (const e of ifd.entries) {
      if (!TIFF_PRIVATE_TAGS.has(e.tag)) {
        keep.push(e)
        continue
      }
      if (e.tag === EXIF_IFD || e.tag === GPS_IFD) zeroSubIfd(b, r, e.value, seenSub)
      zeroValue(b, e)
    }
    // Se reescribe el directorio en el mismo lugar con las entradas que quedan (en orden),
    // el siguiente IFD justo después y el resto en cero.
    const end = at + 2 + ifd.entries.length * 12 + 4
    b.fill(0, at, end)
    r.set16(at, keep.length)
    keep.forEach((e, i) => b.set(e.raw, at + 2 + i * 12))
    r.set32(at + 2 + keep.length * 12, ifd.next)
    at = ifd.next
  }
  return b
}
