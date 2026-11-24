/**
 * Metadatos de archivos ISO BMFF (W-147.9): fotos HEIC/AVIF (iPhone y muchos Android) y videos
 * MP4, MOV, M4V y 3GP. Todo en el mismo lugar, sin cambiar el tamaño de nada: así no se mueve la
 * imagen ni el video, y no hay que recalcular los desplazamientos que guardan estos formatos.
 * - HEIC/AVIF: los ítems EXIF y XMP se ponen en cero. La orientación de la foto no está en el
 *   EXIF sino en la propiedad `irot`, así que se ve igual.
 * - Video: las cajas de metadatos (`udta`, `meta`, XMP) pasan a ser `free` (que los reproductores
 *   ignoran) con el contenido en cero, y las fechas de creación y modificación quedan en cero.
 *   Se lee y escribe por partes (Blob): sirve para videos de varios GB sin cargarlos enteros.
 */
import { readExif } from './exif'
import { MetaError, type MetaField } from './types'

const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif', 'avis', 'mif2'])
const XMP_UUID = 'be7acfcb97a942e89c71999491e3afac'

const fourcc = (b: Uint8Array, at: number) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3])
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`

/** Si los primeros bytes son de un archivo ISO BMFF: 'heif' (foto), 'video' o null. */
export function bmffKind(head: Uint8Array): 'heif' | 'video' | null {
  if (head.length < 12) return null
  const type = fourcc(head, 4)
  // La marca principal dice si es una foto (HEIC/AVIF) o un video.
  if (type === 'ftyp') return HEIF_BRANDS.has(fourcc(head, 8)) ? 'heif' : 'video'
  // QuickTime viejo, sin ftyp.
  return ['moov', 'mdat', 'wide', 'free', 'skip'].includes(type) ? 'video' : null
}

type Box = { type: string; start: number; header: number; end: number }

/** Las cajas dentro de [from, to) de un arreglo de bytes. */
function boxes(b: Uint8Array, from: number, to: number): Box[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const out: Box[] = []
  let at = from
  while (at + 8 <= to) {
    let size = v.getUint32(at)
    let header = 8
    if (size === 1) {
      if (at + 16 > to) break
      size = Number(v.getBigUint64(at + 8))
      header = 16
    } else if (size === 0) size = to - at
    if (size < header || at + size > to) break
    out.push({ type: fourcc(b, at + 4), start: at, header, end: at + size })
    at += size
  }
  return out
}

/* ───────────── HEIC / AVIF ───────────── */

type Item = { id: number; type: string; contentType: string; extents: Array<[number, number]> }

/** Los ítems de la caja `meta` (tipo, y dónde están sus datos). */
function heifItems(b: Uint8Array): Item[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const meta = boxes(b, 0, b.length).find((x) => x.type === 'meta')
  if (!meta) return []
  const inner = boxes(b, meta.start + meta.header + 4, meta.end)
  const items = new Map<number, Item>()
  const iinf = inner.find((x) => x.type === 'iinf')
  if (iinf) {
    const version = b[iinf.start + iinf.header]
    const first = iinf.start + iinf.header + 4 + (version === 0 ? 2 : 4)
    for (const infe of boxes(b, first, iinf.end).filter((x) => x.type === 'infe')) {
      const p = infe.start + infe.header
      const ver = b[p]
      if (ver < 2) continue
      const id = ver === 2 ? v.getUint16(p + 4) : v.getUint32(p + 4)
      let q = p + 4 + (ver === 2 ? 2 : 4) + 2
      const type = fourcc(b, q)
      q += 4
      while (q < infe.end && b[q]) q++ // nombre
      q++
      let contentType = ''
      if (type === 'mime') while (q < infe.end && b[q]) contentType += String.fromCharCode(b[q++])
      items.set(id, { id, type, contentType, extents: [] })
    }
  }
  const iloc = inner.find((x) => x.type === 'iloc')
  const idat = inner.find((x) => x.type === 'idat')
  if (iloc) {
    let p = iloc.start + iloc.header
    const version = b[p]
    p += 4
    const offsetSize = b[p] >> 4
    const lengthSize = b[p] & 15
    const baseSize = b[p + 1] >> 4
    const indexSize = version > 0 ? b[p + 1] & 15 : 0
    p += 2
    const read = (n: number) => {
      let x = 0
      for (let i = 0; i < n; i++) x = x * 256 + b[p + i]
      p += n
      return x
    }
    const count = version < 2 ? read(2) : read(4)
    for (let i = 0; i < count && p < iloc.end; i++) {
      const id = version < 2 ? read(2) : read(4)
      const method = version > 0 ? read(2) & 15 : 0
      read(2) // data_reference_index
      const base = read(baseSize)
      const n = read(2)
      const extents: Array<[number, number]> = []
      for (let k = 0; k < n; k++) {
        read(indexSize)
        const offset = read(offsetSize)
        const length = read(lengthSize)
        // Método 0: en el archivo; 1: dentro de `idat`.
        const at = method === 1 && idat ? idat.start + idat.header + base + offset : base + offset
        if (method <= 1) extents.push([at, length])
      }
      const item = items.get(id)
      if (item) item.extents = extents
    }
  }
  return [...items.values()]
}

const isXmpItem = (it: Item) => it.type === 'mime' && /xmp|rdf/i.test(it.contentType)
const itemBytes = (b: Uint8Array, it: Item) => {
  const parts = it.extents.filter(([at, n]) => at + n <= b.length).map(([at, n]) => b.subarray(at, at + n))
  const out = new Uint8Array(parts.reduce((s, x) => s + x.length, 0))
  let o = 0
  for (const x of parts) {
    out.set(x, o)
    o += x.length
  }
  return out
}

export function readHeif(b: Uint8Array): MetaField[] {
  const fields: MetaField[] = []
  for (const it of heifItems(b)) {
    if (it.type === 'Exif') {
      const data = itemBytes(b, it)
      // Los primeros 4 bytes dicen dónde empieza la cabecera TIFF.
      const skip = data.length >= 4 ? 4 + new DataView(data.buffer, data.byteOffset).getUint32(0) : 0
      fields.push(...readExif(data.subarray(Math.min(skip, data.length))).filter((f) => f.key !== 'orientation'))
    } else if (isXmpItem(it)) {
      const n = it.extents.reduce((s, [, len]) => s + len, 0)
      if (itemBytes(b, it).some((x) => x)) fields.push({ key: 'xmp', value: kb(n) })
    }
  }
  return fields
}

export function stripHeif(input: Uint8Array): Uint8Array {
  const b = input.slice()
  const items = heifItems(b)
  if (!items.length && !boxes(b, 0, b.length).some((x) => x.type === 'meta')) throw new MetaError('damaged')
  for (const it of items) if (it.type === 'Exif' || isXmpItem(it)) for (const [at, n] of it.extents) if (at + n <= b.length) b.fill(0, at, at + n)
  return b
}

/* ───────────── Video (MP4, MOV, M4V, 3GP) ───────────── */

/** Lee [start, end) del archivo. */
const slice = async (file: Blob, start: number, end: number) => new Uint8Array(await file.slice(start, end).arrayBuffer())

/** Las cajas del primer nivel leyendo solo sus cabeceras. */
async function topBoxes(file: Blob): Promise<Box[]> {
  const out: Box[] = []
  let at = 0
  while (at + 8 <= file.size && out.length < 10000) {
    const h = await slice(file, at, Math.min(file.size, at + 16))
    const v = new DataView(h.buffer)
    let size = v.getUint32(0)
    let header = 8
    if (size === 1 && h.length >= 16) {
      size = Number(v.getBigUint64(8))
      header = 16
    } else if (size === 0) size = file.size - at
    if (size < header || at + size > file.size) break
    out.push({ type: fourcc(h, 4), start: at, header, end: at + size })
    at += size
  }
  return out
}

/** Contenedores donde puede haber metadatos (se recorren por dentro). */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf'])
/** Cajas con fechas (versión 0: segundos de 32 bits; 1: de 64 bits) desde 1904. */
const TIMED = new Set(['mvhd', 'tkhd', 'mdhd'])
const EPOCH_1904 = Date.UTC(1904, 0, 1)

type Found = { meta: Box[]; timed: Box[] }

function scanMoov(b: Uint8Array, from: number, to: number, found: Found, depth = 0) {
  if (depth > 8) return
  for (const x of boxes(b, from, to)) {
    if (x.type === 'udta' || x.type === 'meta' || (x.type === 'uuid' && uuidOf(b, x) === XMP_UUID)) found.meta.push(x)
    else if (TIMED.has(x.type)) found.timed.push(x)
    else if (CONTAINERS.has(x.type)) scanMoov(b, x.start + x.header, x.end, found, depth + 1)
  }
}

const uuidOf = (b: Uint8Array, x: Box) => Array.from(b.subarray(x.start + x.header, x.start + x.header + 16), (c) => c.toString(16).padStart(2, '0')).join('')

/** Fecha guardada en mvhd (0 si no tiene). */
function boxDate(b: Uint8Array, x: Box): Date | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const p = x.start + x.header
  const secs = b[p] === 1 ? Number(v.getBigUint64(p + 4)) : v.getUint32(p + 4)
  return secs ? new Date(EPOCH_1904 + secs * 1000) : null
}

/** Textos de las cajas de metadatos: ©xyz (GPS), ©nam, ©ART, ©too, ©day y claves de Apple. */
function readMetaTexts(b: Uint8Array, box: Box, fields: MetaField[]) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const add = (key: MetaField['key'], value: string) => value.trim() && !fields.some((f) => f.key === key) && fields.push({ key, value: value.trim().slice(0, 120) })
  const text = (from: number, to: number) => new TextDecoder().decode(b.subarray(from, to)).replace(/\0/g, '')
  const keyFor = (name: string): MetaField['key'] | null => {
    const n = name.toLowerCase()
    if (n.endsWith('location.iso6709') || n === '©xyz') return 'gps'
    if (n.endsWith('.make') || n.endsWith('.model')) return 'camera'
    if (n.endsWith('.software') || n === '©too' || n === '©swr') return 'software'
    if (n.endsWith('creationdate') || n === '©day') return 'dateTaken'
    if (n.endsWith('.author') || n === '©art' || n === '©aut') return 'author'
    if (n.endsWith('.title') || n === '©nam') return 'title'
    if (n.endsWith('.comment') || n === '©cmt' || n.endsWith('.description') || n === '©des') return 'comment'
    return null
  }
  const walk = (from: number, to: number, keys: string[], depth: number) => {
    if (depth > 6) return
    for (const x of boxes(b, from, to)) {
      const p = x.start + x.header
      if (x.type === 'meta') {
        // En MP4 es una "full box" (4 bytes de versión); en QuickTime no.
        const full = !(fourcc(b, p + 4) === 'hdlr' || fourcc(b, p + 4) === 'keys')
        walk(p + (full ? 4 : 0), x.end, keys, depth + 1)
      } else if (x.type === 'keys') {
        const n = v.getUint32(p + 4)
        let q = p + 8
        const list: string[] = []
        for (let i = 0; i < n && q + 8 <= x.end; i++) {
          const size = v.getUint32(q)
          list.push(text(q + 8, q + size))
          q += Math.max(8, size)
        }
        keys.splice(0, keys.length, ...list)
      } else if (x.type === 'ilst') {
        for (const entry of boxes(b, p, x.end)) {
          const idx = v.getUint32(entry.start + 4)
          const name = idx >= 1 && idx <= keys.length ? keys[idx - 1] : fourcc(b, entry.start + 4)
          const data = boxes(b, entry.start + entry.header, entry.end).find((d) => d.type === 'data')
          const key = keyFor(name)
          if (data && key) add(key, text(data.start + data.header + 8, data.end))
        }
      } else if (x.type.charCodeAt(0) === 0xa9) {
        // QuickTime: ©xyz, ©nam… (largo de 16 bits, idioma, texto).
        const key = keyFor(x.type)
        const len = v.getUint16(p)
        if (key) add(key, text(p + 4, Math.min(x.end, p + 4 + len)))
      } else if (x.type === 'udta') walk(p, x.end, keys, depth + 1)
    }
  }
  if (box.type === 'uuid') add('xmp', kb(box.end - box.start))
  else walk(box.start, box.end, [], 0)
}

export async function readVideo(file: Blob): Promise<MetaField[]> {
  const top = await topBoxes(file)
  const moov = top.find((x) => x.type === 'moov')
  if (!moov) throw new MetaError('damaged')
  const b = await slice(file, moov.start, moov.end)
  const found: Found = { meta: [], timed: [] }
  scanMoov(b, 0, b.length, found)
  const fields: MetaField[] = []
  for (const m of found.meta) readMetaTexts(b, m, fields)
  const mvhd = found.timed.find((x) => x.type === 'mvhd')
  const created = mvhd && boxDate(b, mvhd)
  if (created && created.getUTCFullYear() > 1970) fields.push({ key: 'created', value: created.toISOString().slice(0, 16).replace('T', ' ') })
  for (const x of top) {
    if (x.type === 'uuid' && uuidOf(await slice(file, x.start, Math.min(x.end, x.start + x.header + 16)), { ...x, start: 0 }) === XMP_UUID) fields.push({ key: 'xmp', value: kb(x.end - x.start) })
    // Algunos programas dejan udta o meta fuera de moov (al final del archivo).
    if ((x.type === 'udta' || x.type === 'meta') && x.end - x.start < 16 * 1024 * 1024) {
      const b2 = await slice(file, x.start, x.end)
      readMetaTexts(b2, { ...x, start: 0, end: b2.length }, fields)
    }
  }
  return fields
}

/** La caja pasa a `free` con el contenido en cero (mismo tamaño: nada más se mueve). */
function blank(b: Uint8Array, x: Box) {
  b.set([0x66, 0x72, 0x65, 0x65], x.start + 4) // "free"
  b.fill(0, x.start + x.header, x.end)
}

/** Copia del video sin metadatos ni fechas: el mismo tamaño y el mismo contenido de imagen y sonido. */
export async function stripVideo(file: Blob): Promise<Blob> {
  const top = await topBoxes(file)
  const moov = top.find((x) => x.type === 'moov')
  if (!moov) throw new MetaError('damaged')
  const parts: BlobPart[] = []
  let at = 0
  const replace = (x: Box, bytes: Uint8Array) => {
    parts.push(file.slice(at, x.start), bytes as Uint8Array<ArrayBuffer>)
    at = x.end
  }
  for (const x of top) {
    if (x.type === 'moov') {
      const b = await slice(file, x.start, x.end)
      const found: Found = { meta: [], timed: [] }
      scanMoov(b, 0, b.length, found)
      for (const m of found.meta) blank(b, m)
      for (const t of found.timed) {
        const p = t.start + t.header
        // Fechas de creación y modificación en cero.
        b.fill(0, p + 4, p + 4 + (b[p] === 1 ? 16 : 8))
      }
      replace(x, b)
    } else if (x.type === 'udta' || x.type === 'meta' || x.type === 'uuid') {
      const head = await slice(file, x.start, Math.min(x.end, x.start + x.header + 16))
      if (x.type === 'uuid' && uuidOf(head, { ...x, start: 0 }) !== XMP_UUID) continue
      const b = new Uint8Array(x.end - x.start)
      b.set(head.subarray(0, x.header))
      blank(b, { ...x, start: 0, end: b.length })
      replace(x, b)
    }
  }
  parts.push(file.slice(at))
  return new Blob(parts, { type: file.type || 'video/mp4' })
}
