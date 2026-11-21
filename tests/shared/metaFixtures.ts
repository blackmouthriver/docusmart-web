// Archivos de prueba con metadatos (W-106), armados byte a byte: EXIF con cámara y GPS,
// PNG con textos, WebP con EXIF/XMP y documentos de Office con propiedades.
import { strToU8, zipSync } from 'fflate'

export const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
const latin1 = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))
const u16 = (n: number) => new Uint8Array([n & 255, (n >> 8) & 255])
const u32 = (n: number) => new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255])
const be32 = (n: number) => new Uint8Array([(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255])

type Entry = { tag: number; type: number; count: number; data: Uint8Array }
const ascii = (tag: number, s: string): Entry => ({ tag, type: 2, count: s.length + 1, data: concat([latin1(s), new Uint8Array([0])]) })
const short = (tag: number, n: number): Entry => ({ tag, type: 3, count: 1, data: concat([u16(n), u16(0)]) })
const long = (tag: number, n: number): Entry => ({ tag, type: 4, count: 1, data: u32(n) })
const dms = (tag: number, deg: number): Entry => {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = Math.round(((deg - d) * 60 - m) * 60 * 100)
  return { tag, type: 5, count: 3, data: concat([u32(d), u32(1), u32(m), u32(1), u32(s), u32(100)]) }
}

function ifd(entries: Entry[], at: number, next = 0): Uint8Array {
  const head = 2 + entries.length * 12 + 4
  let extra = at + head
  const table: Uint8Array[] = [u16(entries.length)]
  const data: Uint8Array[] = []
  for (const e of entries) {
    table.push(u16(e.tag), u16(e.type), u32(e.count))
    if (e.data.length <= 4) table.push(concat([e.data, new Uint8Array(4 - e.data.length)]))
    else {
      table.push(u32(extra))
      const padded = e.data.length & 1 ? concat([e.data, new Uint8Array(1)]) : e.data
      data.push(padded)
      extra += padded.length
    }
  }
  table.push(u32(next))
  return concat([...table, ...data])
}
const ifdSize = (entries: Entry[]) => 2 + entries.length * 12 + 4 + entries.reduce((n, e) => n + (e.data.length > 4 ? e.data.length + (e.data.length & 1) : 0), 0)

export type ExifOptions = { make?: string; model?: string; software?: string; artist?: string; date?: string; orientation?: number; gps?: [number, number] }

/** Bloque "Exif\0\0" + TIFF (little-endian) con los datos pedidos. */
export function buildExif(o: ExifOptions): Uint8Array {
  const base: Entry[] = []
  if (o.make) base.push(ascii(0x010f, o.make))
  if (o.model) base.push(ascii(0x0110, o.model))
  if (o.orientation) base.push(short(0x0112, o.orientation))
  if (o.software) base.push(ascii(0x0131, o.software))
  if (o.date) base.push(ascii(0x0132, o.date))
  if (o.artist) base.push(ascii(0x013b, o.artist))
  const gps: Entry[] = o.gps
    ? [ascii(1, o.gps[0] < 0 ? 'S' : 'N'), dms(2, Math.abs(o.gps[0])), ascii(3, o.gps[1] < 0 ? 'W' : 'E'), dms(4, Math.abs(o.gps[1]))]
    : []
  const ifd0 = gps.length ? [...base, long(0x8825, 0)] : base
  const gpsAt = 8 + ifdSize(ifd0)
  if (gps.length) ifd0[ifd0.length - 1] = long(0x8825, gpsAt)
  return concat([latin1('Exif\0\0'), latin1('II'), u16(42), u32(8), ifd(ifd0, 8), ...(gps.length ? [ifd(gps, gpsAt)] : [])])
}

const segment = (marker: number, body: Uint8Array) => concat([new Uint8Array([0xff, marker]), new Uint8Array([((body.length + 2) >> 8) & 255, (body.length + 2) & 255]), body])

/** Inserta en un JPEG (justo después de SOI/APP0) EXIF, XMP, IPTC y un comentario. */
export function jpegWithMeta(jpeg: Uint8Array, exif: Uint8Array, extras = true): Uint8Array {
  let at = 2
  if (jpeg[2] === 0xff && jpeg[3] === 0xe0) at = 4 + ((jpeg[4] << 8) | jpeg[5])
  const parts = [segment(0xe1, exif)]
  if (extras) {
    parts.push(segment(0xe1, latin1('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta><dc:creator>Ana Secreta</dc:creator></x:xmpmeta>')))
    parts.push(segment(0xed, latin1('Photoshop 3.0\x008BIM\x04\x04\0\0\0\0\0\x0aAna Secreta')))
    parts.push(segment(0xfe, latin1('Hecho por Ana Secreta')))
    parts.push(segment(0xe2, latin1('ICC_PROFILE\0\x01\x01perfil')))
  }
  return concat([jpeg.subarray(0, at), ...parts, jpeg.subarray(at)])
}

/** JPEG mínimo (no decodificable, solo estructura): SOI, APP0, SOS con datos y EOI. */
export function fakeJpeg(): Uint8Array {
  return concat([new Uint8Array([0xff, 0xd8]), segment(0xe0, latin1('JFIF\0\x01\x01\0\0\x01\0\x01\0\0')), segment(0xda, new Uint8Array([1, 2, 3])), new Uint8Array([9, 8, 7, 0xff, 0xd9])])
}

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(b: Uint8Array) {
  let c = 0xffffffff
  for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
export function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const td = concat([latin1(type), data])
  return concat([be32(data.length), td, be32(crc32(td))])
}

/** Inserta en un PNG (después de IHDR) textos, EXIF y fecha. */
export function pngWithMeta(png: Uint8Array): Uint8Array {
  const ihdrEnd = 8 + 12 + 13
  const chunks = [
    pngChunk('tEXt', latin1('Author\0Ana Secreta')),
    pngChunk('tEXt', latin1('Software\0Editor 3000')),
    pngChunk('iTXt', concat([latin1('Description\0\0\0\0\0'), strToU8('Foto de la casa')])),
    pngChunk('tEXt', latin1('Proyecto\0Cliente X')),
    pngChunk('tIME', new Uint8Array([0x07, 0xe8, 1, 2, 10, 30, 0])),
    pngChunk('eXIf', buildExif({ make: 'Canon', gps: [4.6097, -74.0817] }).subarray(6)),
  ]
  return concat([png.subarray(0, ihdrEnd), ...chunks, png.subarray(ihdrEnd)])
}

/** PNG mínimo (estructura): firma, IHDR, IDAT falso e IEND. */
export function fakePng(): Uint8Array {
  return concat([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk('IHDR', new Uint8Array(13)), pngChunk('IDAT', new Uint8Array([1, 2])), pngChunk('IEND', new Uint8Array())])
}

const riff = (id: string, data: Uint8Array) => concat([latin1(id), u32(data.length), data, data.length & 1 ? new Uint8Array(1) : new Uint8Array()])

/** WebP con VP8X (banderas EXIF y XMP), una imagen falsa, EXIF y XMP. */
export function webpWithMeta(): Uint8Array {
  const vp8x = new Uint8Array(10)
  vp8x[0] = 0x0c
  const body = concat([riff('VP8X', vp8x), riff('VP8 ', new Uint8Array([1, 2, 3])), riff('EXIF', buildExif({ model: 'Pixel 8', software: 'Fotos' }).subarray(6)), riff('XMP ', latin1('<x:xmpmeta/>'))])
  return concat([latin1('RIFF'), u32(body.length + 4), latin1('WEBP'), body])
}

/** .docx mínimo con propiedades del documento y una propiedad personalizada. */
export function docxWithMeta(): Uint8Array {
  return zipSync({
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>',
    ),
    'docProps/core.xml': strToU8(
      '<?xml version="1.0"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Informe</dc:title><dc:creator>Ana Secreta</dc:creator><cp:lastModifiedBy>Luis &amp; Co</cp:lastModifiedBy><cp:revision>7</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2024-01-02T10:30:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2024-03-04T08:00:00Z</dcterms:modified></cp:coreProperties>',
    ),
    'docProps/app.xml': strToU8(
      '<?xml version="1.0"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Template>Normal.dotm</Template><TotalTime>42</TotalTime><Pages>1</Pages><Application>Microsoft Office Word</Application><Company>Empresa Secreta S.A.S.</Company><AppVersion>16.0000</AppVersion></Properties>',
    ),
    'docProps/custom.xml': strToU8(
      '<?xml version="1.0"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="Cliente"><vt:lpwstr>Cliente X</vt:lpwstr></property></Properties>',
    ),
    'word/document.xml': strToU8('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hola mundo</w:t></w:r></w:p></w:body></w:document>'),
  })
}
