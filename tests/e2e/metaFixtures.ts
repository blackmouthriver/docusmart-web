// Archivos de prueba con metadatos (W-147.9): un TIFF, una foto HEIC con EXIF y XMP, y un MP4 con
// GPS y datos de la cámara. Los usan las pruebas unitarias y las de punta a punta.
import { HEIC_SQUARES } from './fixtures'

export const enc = (s: string) => new TextEncoder().encode(s)
export const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
export const u32 = (n: number) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255])
export const u16 = (n: number) => new Uint8Array([(n >>> 8) & 255, n & 255])
export const box = (type: string, ...body: Uint8Array[]) => {
  const payload = cat(...body)
  return cat(u32(8 + payload.length), enc(type), payload)
}
export const has = (b: Uint8Array, text: string) => new TextDecoder('latin1').decode(b).includes(text)


/**
 * TIFF big-endian de 4 × 2 en gris con cámara, programa, fecha, autor, orientación 6, EXIF
 * (fecha de la foto y número de serie) y GPS (Bogotá).
 */
export function tiff(): Uint8Array {
  const b = new Uint8Array(1024)
  const v = new DataView(b.buffer)
  b.set(enc('MM'), 0)
  v.setUint16(2, 42)
  v.setUint32(4, 8)
  let data = 600
  const text = (s: string) => {
    const at = data
    b.set(enc(s + '\0'), at)
    data += s.length + 1 + ((s.length + 1) % 2)
    return { at, count: s.length + 1 }
  }
  const ifd = (at: number, entries: Array<[number, number, number, number]>, next = 0) => {
    v.setUint16(at, entries.length)
    entries.forEach(([tag, type, count, value], i) => {
      const e = at + 2 + i * 12
      v.setUint16(e, tag)
      v.setUint16(e + 2, type)
      v.setUint32(e + 4, count)
      if (type === 3 && count === 1) v.setUint16(e + 8, value)
      else v.setUint32(e + 8, value)
    })
    v.setUint32(at + 2 + entries.length * 12, next)
  }
  const make = text('Apple')
  const model = text('iPhone 15')
  const soft = text('Photos 9.0')
  const date = text('2026:11:20 10:30:00')
  const artist = text('Ana Pérez')
  const taken = text('2026:11:20 10:29:59')
  const serial = text('SN-12345')
  const rat = data
  // 4°36'35" N, 74°4'54" W
  ;[4, 1, 36, 1, 35, 1, 74, 1, 4, 1, 54, 1].forEach((x, i) => v.setUint32(rat + i * 4, x))
  data += 48
  b.set([10, 20, 30, 40, 50, 60, 70, 80], 900) // los píxeles
  ifd(8, [
    [0x0100, 3, 1, 4], [0x0101, 3, 1, 2], [0x0102, 3, 1, 8], [0x0103, 3, 1, 1], [0x0106, 3, 1, 1],
    [0x010f, 2, make.count, make.at], [0x0110, 2, model.count, model.at], [0x0111, 4, 1, 900], [0x0112, 3, 1, 6],
    [0x0116, 3, 1, 2], [0x0117, 4, 1, 8], [0x0131, 2, soft.count, soft.at], [0x0132, 2, date.count, date.at],
    [0x013b, 2, artist.count, artist.at], [0x8769, 4, 1, 300], [0x8825, 4, 1, 400],
  ])
  ifd(300, [[0x9003, 2, taken.count, taken.at], [0xa431, 2, serial.count, serial.at]])
  ifd(400, [[0x0001, 2, 2, 0x4e000000], [0x0002, 5, 3, rat], [0x0003, 2, 2, 0x57000000], [0x0004, 5, 3, rat + 24]])
  return b
}

/**
 * La foto HEIC real de las pruebas con un ítem EXIF (GPS y cámara) y uno XMP agregados al
 * final, como las del iPhone. Se reescribe la caja meta y se corren los desplazamientos.
 */
export function heicWithExif(): { bytes: Uint8Array; image: [number, number] } {
  const src = HEIC_SQUARES
  const v = new DataView(src.buffer, src.byteOffset, src.byteLength)
  const ftypLen = v.getUint32(0)
  const metaLen = v.getUint32(ftypLen)
  const meta = src.subarray(ftypLen, ftypLen + metaLen)
  const mdat = src.subarray(ftypLen + metaLen)
  // Caja meta: versión/flags y sus hijas.
  const kids: Array<{ type: string; bytes: Uint8Array }> = []
  for (let at = 12; at < meta.length; ) {
    const size = new DataView(meta.buffer, meta.byteOffset + at).getUint32(0)
    kids.push({ type: String.fromCharCode(...meta.subarray(at + 4, at + 8)), bytes: meta.subarray(at, at + size) })
    at += size
  }
  const exifTiff = tiff()
  const exif = cat(u32(0), enc('Exif\0\0').subarray(0, 0), exifTiff)
  const xmp = enc('<x:xmpmeta><rdf:RDF><rdf:Description photoshop:Credit="Ana"/></rdf:RDF></x:xmpmeta>')
  const infe = (id: number, type: string, extra = new Uint8Array()) => box('infe', new Uint8Array([2, 0, 0, 0]), u16(id), u16(0), enc(type), new Uint8Array([0]), extra)
  // iloc versión 0: offset 4, length 4, base 4.
  const iloc = (entries: Array<[number, number, number]>) =>
    box('iloc', new Uint8Array([0, 0, 0, 0, 0x44, 0x40]), u16(entries.length), ...entries.map(([id, off, len]) => cat(u16(id), u16(0), u32(off), u16(1), u32(0), u32(len))))
  // El ítem 1 (la imagen) estaba en la iloc original.
  const ilocOld = kids.find((k) => k.type === 'iloc')!.bytes
  const io = new DataView(ilocOld.buffer, ilocOld.byteOffset)
  const imgOff = io.getUint32(20)
  const imgLen = io.getUint32(30)
  const build = (delta: number, exifAt: number, xmpAt: number) => {
    const newKids = kids.map((k) => {
      if (k.type === 'iinf') return box('iinf', new Uint8Array([0, 0, 0, 0]), u16(3), infe(1, 'hvc1'), infe(2, 'Exif'), infe(3, 'mime', cat(enc('application/rdf+xml'), new Uint8Array([0]))))
      if (k.type === 'iloc') return iloc([[1, imgOff + delta, imgLen], [2, exifAt, exif.length], [3, xmpAt, xmp.length]])
      return k.bytes
    })
    return box('meta', new Uint8Array([0, 0, 0, 0]), ...newKids)
  }
  const draft = build(0, 0, 0)
  const delta = draft.length - meta.length
  const tailStart = ftypLen + draft.length + mdat.length
  const extra = box('mdat', exif, xmp)
  const metaNew = build(delta, tailStart + 8, tailStart + 8 + exif.length)
  const bytes = cat(src.subarray(0, ftypLen), metaNew, mdat, extra)
  return { bytes, image: [imgOff + delta, imgLen] }
}

/** MP4 mínimo: ftyp, moov (mvhd con fecha, trak con tkhd y mdhd, udta con GPS y programa, meta de Apple) y mdat. */
export function mp4(extraTop: Uint8Array[] = []) {
  const created = Math.round((Date.UTC(2026, 10, 20, 15, 30) - Date.UTC(1904, 0, 1)) / 1000)
  const timed = (type: string) => box(type, new Uint8Array([0, 0, 0, 0]), u32(created), u32(created), new Uint8Array(80))
  const qtText = (type: string, s: string) => cat(u32(12 + enc(s).length), new Uint8Array([0xa9]), enc(type), u16(enc(s).length), u16(0x15c7), enc(s))
  const udta = box('udta', qtText('xyz', '+04.6097-074.0817/'), qtText('too', 'Lavf60.3.100'))
  const keys = box('keys', new Uint8Array([0, 0, 0, 0]), u32(2), ...['com.apple.quicktime.make', 'com.apple.quicktime.model'].map((k) => cat(u32(8 + k.length), enc('mdta'), enc(k))))
  const item = (idx: number, s: string) => cat(u32(8 + 16 + enc(s).length), u32(idx), box('data', u32(1), u32(0), enc(s)))
  const meta = box('meta', box('hdlr', new Uint8Array(4), u32(0), enc('mdta'), new Uint8Array(13)), keys, box('ilst', item(1, 'Apple'), item(2, 'iPhone 15 Pro')))
  const moov = box('moov', timed('mvhd'), box('trak', timed('tkhd'), box('mdia', timed('mdhd'))), udta, meta)
  const media = box('mdat', new Uint8Array(Array.from({ length: 64 }, (_, i) => i)))
  return cat(box('ftyp', enc('isom'), u32(512), enc('isommp41')), moov, media, ...extraTop)
}
