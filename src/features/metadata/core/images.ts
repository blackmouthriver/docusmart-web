/**
 * Metadatos de fotos sin recomprimir la imagen (W-106): se quitan los bloques de datos
 * (EXIF, XMP, IPTC, comentarios, textos) y se copian los píxeles tal cual, sin perder calidad.
 * Se conservan el perfil de color (ICC) y, en JPG, la orientación, para que la foto se vea igual.
 */
import { unzlibSync } from 'fflate'
import { exifOrientation, orientationOnlyExif, readExif } from './exif'
import { MetaError, type MetaField } from './types'

const latin1 = (b: Uint8Array) => {
  let s = ''
  for (const c of b) s += String.fromCharCode(c)
  return s
}
const utf8 = (b: Uint8Array) => new TextDecoder().decode(b)
/** La norma dice Latin-1, pero muchos programas guardan UTF-8: se usa UTF-8 si es válido. */
const lenientText = (b: Uint8Array) => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b)
  } catch {
    return latin1(b)
  }
}
const startsWith = (b: Uint8Array, at: number, text: string) => {
  for (let i = 0; i < text.length; i++) if (b[at + i] !== text.charCodeAt(i)) return false
  return true
}
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`
const short = (s: string) => (s.length > 120 ? s.slice(0, 117) + '…' : s)

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/* ───────────── JPEG ───────────── */

type Segment = { marker: number; start: number; end: number }

function jpegSegments(b: Uint8Array): { segments: Segment[]; scan: number } {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new MetaError('damaged')
  const segments: Segment[] = []
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) throw new MetaError('damaged')
    while (b[i] === 0xff && b[i + 1] === 0xff) i++
    const marker = b[i + 1]
    if (marker === 0xda || marker === 0xd9) return { segments, scan: i }
    // Marcadores sin longitud (RSTn, TEM).
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      segments.push({ marker, start: i, end: i + 2 })
      i += 2
      continue
    }
    if (i + 4 > b.length) throw new MetaError('damaged')
    const len = (b[i + 2] << 8) | b[i + 3]
    if (len < 2) throw new MetaError('damaged')
    segments.push({ marker, start: i, end: Math.min(b.length, i + 2 + len) })
    i += 2 + len
  }
  return { segments, scan: b.length }
}

type JpegPart = 'exif' | 'xmp' | 'iptc' | 'comment' | 'keep' | 'drop'

function classify(b: Uint8Array, s: Segment): JpegPart {
  const d = s.start + 4
  if (s.marker === 0xe1) return startsWith(b, d, 'Exif\0') ? 'exif' : startsWith(b, d, 'http://ns.adobe.com/') ? 'xmp' : 'drop'
  if (s.marker === 0xed) return 'iptc'
  if (s.marker === 0xfe) return 'comment'
  if (s.marker === 0xe2) return startsWith(b, d, 'ICC_PROFILE') ? 'keep' : 'drop'
  // APP0 (JFIF) y APP14 (Adobe: transformación de color) se necesitan para ver la imagen bien.
  if (s.marker === 0xe0 || s.marker === 0xee) return 'keep'
  if (s.marker >= 0xe3 && s.marker <= 0xef) return 'drop'
  return 'keep'
}

export function readJpeg(b: Uint8Array): MetaField[] {
  const { segments } = jpegSegments(b)
  const out: MetaField[] = []
  for (const s of segments) {
    const part = classify(b, s)
    const body = b.subarray(s.start + 4, s.end)
    if (part === 'exif') out.push(...readExif(body))
    else if (part === 'xmp') out.push({ key: 'xmp', value: kb(body.length) })
    else if (part === 'iptc') out.push({ key: 'iptc', value: kb(body.length) })
    else if (part === 'comment') {
      const text = latin1(body).replace(/\0+$/, '').trim()
      if (text) out.push({ key: 'comment', value: short(text) })
    }
  }
  return dedupe(out)
}

export function stripJpeg(b: Uint8Array): Uint8Array {
  const { segments, scan } = jpegSegments(b)
  let orientation = 1
  const kept: Uint8Array[] = []
  let afterApp0 = 0
  for (const s of segments) {
    const part = classify(b, s)
    if (part === 'exif') orientation = Math.max(orientation, exifOrientation(b.subarray(s.start + 4, s.end)))
    if (part !== 'keep') continue
    kept.push(b.subarray(s.start, s.end))
    if (s.marker === 0xe0 && kept.length === afterApp0 + 1) afterApp0 = kept.length
  }
  if (orientation > 1) {
    const exif = orientationOnlyExif(orientation)
    const seg = new Uint8Array(4 + exif.length)
    seg.set([0xff, 0xe1, ((exif.length + 2) >> 8) & 0xff, (exif.length + 2) & 0xff])
    seg.set(exif, 4)
    kept.splice(afterApp0, 0, seg)
  }
  return concat([b.subarray(0, 2), ...kept, b.subarray(scan)])
}

/* ───────────── PNG ───────────── */

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG_META = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'])

type Chunk = { type: string; start: number; end: number; data: Uint8Array }

function pngChunks(b: Uint8Array): Chunk[] {
  if (!PNG_SIG.every((x, i) => b[i] === x)) throw new MetaError('damaged')
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const out: Chunk[] = []
  let i = 8
  while (i + 12 <= b.length) {
    const len = v.getUint32(i)
    const type = latin1(b.subarray(i + 4, i + 8))
    const end = i + 12 + len
    if (end > b.length) throw new MetaError('damaged')
    out.push({ type, start: i, end, data: b.subarray(i + 8, i + 8 + len) })
    i = end
    if (type === 'IEND') break
  }
  return out
}

const PNG_KEYS: Record<string, MetaField['key']> = {
  title: 'title',
  author: 'author',
  description: 'description',
  copyright: 'copyright',
  'creation time': 'created',
  software: 'software',
  comment: 'comment',
  source: 'camera',
}

function pngText(c: Chunk): { keyword: string; text: string } | null {
  const z = c.data.indexOf(0)
  if (z < 1) return null
  const keyword = latin1(c.data.subarray(0, z))
  try {
    if (c.type === 'tEXt') return { keyword, text: lenientText(c.data.subarray(z + 1)) }
    if (c.type === 'zTXt') return { keyword, text: latin1(unzlibSync(c.data.subarray(z + 2))) }
    // iTXt: palabra\0 compresión método idioma\0 palabra traducida\0 texto
    const compressed = c.data[z + 1] === 1
    let p = z + 3
    p = c.data.indexOf(0, p) + 1
    p = c.data.indexOf(0, p) + 1
    if (p <= 0) return { keyword, text: '' }
    const raw = c.data.subarray(p)
    return { keyword, text: utf8(compressed ? unzlibSync(raw) : raw) }
  } catch {
    return { keyword, text: '' }
  }
}

export function readPng(b: Uint8Array): MetaField[] {
  const out: MetaField[] = []
  for (const c of pngChunks(b)) {
    if (c.type === 'eXIf') out.push(...readExif(c.data))
    else if (c.type === 'tIME' && c.data.length >= 7) {
      const y = (c.data[0] << 8) | c.data[1]
      const p = (n: number) => String(n).padStart(2, '0')
      out.push({ key: 'modified', value: `${y}-${p(c.data[2])}-${p(c.data[3])} ${p(c.data[4])}:${p(c.data[5])}:${p(c.data[6])}` })
    } else if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
      const t = pngText(c)
      if (!t) continue
      if (/^XML:com\.adobe\.xmp$/i.test(t.keyword)) out.push({ key: 'xmp', value: kb(c.data.length) })
      else {
        const key = PNG_KEYS[t.keyword.toLowerCase()]
        const text = short(t.text.trim())
        if (key) text && out.push({ key, value: text })
        else out.push({ key: 'custom', value: short(`${t.keyword}: ${t.text.trim()}`) })
      }
    }
  }
  return dedupe(out)
}

export function stripPng(b: Uint8Array): Uint8Array {
  const chunks = pngChunks(b)
  return concat([b.subarray(0, 8), ...chunks.filter((c) => !PNG_META.has(c.type)).map((c) => b.subarray(c.start, c.end))])
}

/* ───────────── WebP ───────────── */

type RiffChunk = { id: string; start: number; end: number; data: Uint8Array }

function webpChunks(b: Uint8Array): RiffChunk[] {
  if (!startsWith(b, 0, 'RIFF') || !startsWith(b, 8, 'WEBP')) throw new MetaError('damaged')
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const out: RiffChunk[] = []
  let i = 12
  while (i + 8 <= b.length) {
    const size = v.getUint32(i + 4, true)
    const end = i + 8 + size + (size & 1)
    if (i + 8 + size > b.length) throw new MetaError('damaged')
    out.push({ id: latin1(b.subarray(i, i + 4)), start: i, end: Math.min(end, b.length), data: b.subarray(i + 8, i + 8 + size) })
    i = end
  }
  return out
}

export function readWebp(b: Uint8Array): MetaField[] {
  const out: MetaField[] = []
  for (const c of webpChunks(b)) {
    if (c.id === 'EXIF') out.push(...readExif(c.data))
    else if (c.id === 'XMP ') out.push({ key: 'xmp', value: kb(c.data.length) })
  }
  return dedupe(out)
}

export function stripWebp(b: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = []
  for (const c of webpChunks(b)) {
    if (c.id === 'EXIF' || c.id === 'XMP ') continue
    const raw = b.slice(c.start, c.end)
    // VP8X: se apagan las banderas de EXIF (0x08) y XMP (0x04).
    if (c.id === 'VP8X' && raw.length > 8) raw[8] &= ~0x0c
    parts.push(raw)
  }
  const body = concat(parts)
  const out = new Uint8Array(12 + body.length)
  out.set(b.subarray(0, 12))
  new DataView(out.buffer).setUint32(4, out.length - 8, true)
  out.set(body, 12)
  return out
}

/** Sin repetir el mismo dato (p. ej. la fecha en EXIF y en XMP). */
export function dedupe(fields: MetaField[]): MetaField[] {
  const seen = new Set<string>()
  return fields.filter((f) => {
    const k = f.key + '\u0000' + f.value
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
