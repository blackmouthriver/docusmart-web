/**
 * Extraer imágenes de un PDF con su calidad original, sin re-dibujar páginas:
 * - Las JPEG (DCTDecode) se copian tal cual, byte por byte.
 * - Las demás se decodifican (Flate, LZW, RunLength… y predictores PNG) y se
 *   guardan como PNG, con su transparencia (SMask) si la tienen.
 * Todo corre sin canvas: el PNG se arma aquí mismo con fflate.
 */
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream, PDFString, decodePDFRawStream, type PDFObject } from 'pdf-lib'
import { zlibSync } from 'fflate'

export type ExtractedImage = { page: number; index: number; width: number; height: number; format: 'jpg' | 'png'; data: Uint8Array }
export type ExtractResult = { images: ExtractedImage[]; skipped: number; small: number }

const N = (s: string) => PDFName.of(s)
const num = (o: PDFObject | undefined, def: number) => (o instanceof PDFNumber ? o.asNumber() : def)

/* ───────────── Recorrer el documento ───────────── */

/** Imágenes del PDF en orden de aparición, cada una una sola vez (aunque se repita en varias páginas). */
export async function extractImages(bytes: ArrayBuffer | Uint8Array, opts: { minSize?: number } = {}): Promise<ExtractResult> {
  const doc = await PDFDocument.load(bytes)
  const minSize = opts.minSize ?? 0
  const seen = new Set<string>()
  const result: ExtractResult = { images: [], skipped: 0, small: 0 }
  doc.getPages().forEach((page, p) => {
    let index = 0
    const visit = (resources: PDFDict | undefined, depth: number) => {
      const xobjects = resources?.lookupMaybe(N('XObject'), PDFDict)
      if (!xobjects || depth > 8) return
      for (const [, value] of xobjects.entries()) {
        const key = value instanceof PDFRef ? value.toString() : null
        if (key && seen.has(key)) continue
        if (key) seen.add(key)
        const obj = doc.context.lookup(value)
        if (!(obj instanceof PDFStream)) continue
        const subtype = obj.dict.lookup(N('Subtype'))
        if (subtype === N('Form')) {
          visit(obj.dict.lookupMaybe(N('Resources'), PDFDict), depth + 1)
          continue
        }
        if (subtype !== N('Image') || !(obj instanceof PDFRawStream)) continue
        const width = num(obj.dict.lookup(N('Width')), 0)
        const height = num(obj.dict.lookup(N('Height')), 0)
        if (width < minSize || height < minSize) {
          result.small++
          continue
        }
        const converted = safeConvert(obj, doc)
        if (!converted) {
          result.skipped++
          continue
        }
        result.images.push({ page: p + 1, index: ++index, width, height, ...converted })
      }
    }
    visit(page.node.Resources(), 0)
  })
  return result
}

function safeConvert(stream: PDFRawStream, doc: PDFDocument): { format: 'jpg' | 'png'; data: Uint8Array } | null {
  try {
    return convertImage(stream, doc)
  } catch {
    return null
  }
}

function filtersOf(dict: PDFDict): string[] {
  const f = dict.lookup(N('Filter'))
  if (f instanceof PDFName) return [f.decodeText()]
  if (f instanceof PDFArray) return f.asArray().map((x) => (x instanceof PDFName ? x.decodeText() : ''))
  return []
}

/* ───────────── Convertir una imagen ───────────── */

export function convertImage(stream: PDFRawStream, doc: PDFDocument): { format: 'jpg' | 'png'; data: Uint8Array } | null {
  const dict = stream.dict
  const filters = filtersOf(dict)
  if (filters.length === 1 && filters[0] === 'DCTDecode') return { format: 'jpg', data: stream.contents }
  // JPEG 2000, fax (CCITT) y JBIG2 no se decodifican en el navegador sin librerías extra.
  if (filters.some((f) => ['DCTDecode', 'JPXDecode', 'CCITTFaxDecode', 'JBIG2Decode'].includes(f))) return null

  const width = num(dict.lookup(N('Width')), 0)
  const height = num(dict.lookup(N('Height')), 0)
  if (!width || !height) return null
  const isMask = dict.lookup(N('ImageMask'))?.toString() === 'true'
  const bpc = isMask ? 1 : num(dict.lookup(N('BitsPerComponent')), 8)
  const cs = isMask ? ({ kind: 'gray', n: 1 } as const) : resolveColorSpace(dict.lookup(N('ColorSpace')), doc)
  if (!cs) return null

  const raw = decodeData(stream)
  const n = cs.kind === 'indexed' ? 1 : cs.n
  const values = unpackSamples(raw, width, height, n, bpc, cs.kind !== 'indexed')
  const decode = dict.lookupMaybe(N('Decode'), PDFArray)?.asArray().map((x) => num(x, 0))
  if (decode && cs.kind !== 'indexed' && decode[0] > decode[1]) for (let i = 0; i < values.length; i++) values[i] = 255 - values[i]

  const rgba = new Uint8Array(width * height * 4)
  toRgba(values, cs, rgba, isMask)

  const smask = dict.lookup(N('SMask'))
  if (smask instanceof PDFRawStream) applySoftMask(smask, rgba, width, height)
  return { format: 'png', data: encodePng(rgba, width, height) }
}

type ColorSpace = { kind: 'gray' | 'rgb' | 'cmyk'; n: 1 | 3 | 4 } | { kind: 'indexed'; base: { kind: 'gray' | 'rgb' | 'cmyk'; n: 1 | 3 | 4 }; hival: number; lookup: Uint8Array }

const SIMPLE: Record<string, { kind: 'gray' | 'rgb' | 'cmyk'; n: 1 | 3 | 4 }> = {
  DeviceGray: { kind: 'gray', n: 1 },
  CalGray: { kind: 'gray', n: 1 },
  G: { kind: 'gray', n: 1 },
  DeviceRGB: { kind: 'rgb', n: 3 },
  CalRGB: { kind: 'rgb', n: 3 },
  RGB: { kind: 'rgb', n: 3 },
  DeviceCMYK: { kind: 'cmyk', n: 4 },
  CMYK: { kind: 'cmyk', n: 4 },
}

export function resolveColorSpace(obj: PDFObject | undefined, doc: PDFDocument): ColorSpace | null {
  const o = obj instanceof PDFRef ? doc.context.lookup(obj) : obj
  if (o instanceof PDFName) return SIMPLE[o.decodeText()] ?? null
  if (!(o instanceof PDFArray) || !o.size()) return null
  const family = o.lookup(0)
  const name = family instanceof PDFName ? family.decodeText() : ''
  if (SIMPLE[name]) return SIMPLE[name]
  if (name === 'ICCBased') {
    const profile = o.lookup(1)
    const n = profile instanceof PDFStream ? num(profile.dict.lookup(N('N')), 3) : 3
    return n === 1 ? SIMPLE.DeviceGray : n === 4 ? SIMPLE.DeviceCMYK : SIMPLE.DeviceRGB
  }
  if (name === 'Indexed' || name === 'I') {
    const base = resolveColorSpace(o.get(1), doc)
    if (!base || base.kind === 'indexed') return null
    const table = o.lookup(3)
    let lookup: Uint8Array | null = null
    if (table instanceof PDFString || table instanceof PDFHexString) lookup = table.asBytes()
    else if (table instanceof PDFRawStream) lookup = decodeData(table)
    if (!lookup) return null
    return { kind: 'indexed', base, hival: num(o.lookup(2), 255), lookup }
  }
  return null
}

/** Datos ya descomprimidos, con el predictor PNG revertido si lo tiene. */
function decodeData(stream: PDFRawStream): Uint8Array {
  const data = filtersOf(stream.dict).length ? decodePDFRawStream(stream).decode() : stream.contents
  const parms = stream.dict.lookup(N('DecodeParms'))
  const p = parms instanceof PDFArray ? parms.lookup(parms.size() - 1) : parms
  if (!(p instanceof PDFDict)) return data
  const predictor = num(p.lookup(N('Predictor')), 1)
  if (predictor < 10) return data
  return undoPngPredictor(data, num(p.lookup(N('Columns')), 1), num(p.lookup(N('Colors')), 1), num(p.lookup(N('BitsPerComponent')), 8))
}

/** Revierte los filtros PNG por fila (None, Sub, Up, Average, Paeth). */
export function undoPngPredictor(data: Uint8Array, columns: number, colors: number, bpc: number): Uint8Array {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8))
  const rowLen = Math.ceil((columns * colors * bpc) / 8)
  const rows = Math.floor(data.length / (rowLen + 1))
  const out = new Uint8Array(rows * rowLen)
  for (let r = 0; r < rows; r++) {
    const type = data[r * (rowLen + 1)]
    const src = r * (rowLen + 1) + 1
    const dst = r * rowLen
    for (let i = 0; i < rowLen; i++) {
      const left = i >= bpp ? out[dst + i - bpp] : 0
      const up = r > 0 ? out[dst - rowLen + i] : 0
      const upLeft = r > 0 && i >= bpp ? out[dst - rowLen + i - bpp] : 0
      let pred = 0
      if (type === 1) pred = left
      else if (type === 2) pred = up
      else if (type === 3) pred = (left + up) >> 1
      else if (type === 4) {
        const pa = Math.abs(up - upLeft)
        const pb = Math.abs(left - upLeft)
        const pc = Math.abs(left + up - 2 * upLeft)
        pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      }
      out[dst + i] = (data[src + i] + pred) & 0xff
    }
  }
  return out
}

/** Muestras de n componentes y `bpc` bits a un byte por componente (escaladas a 0–255 si `scale`). */
export function unpackSamples(raw: Uint8Array, w: number, h: number, n: number, bpc: number, scale: boolean): Uint8Array {
  const out = new Uint8Array(w * h * n)
  if (bpc === 8) {
    out.set(raw.subarray(0, out.length))
    return out
  }
  const rowBytes = Math.ceil((w * n * bpc) / 8)
  const max = (1 << Math.min(bpc, 8)) - 1
  let k = 0
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < w * n; i++) {
      let v: number
      if (bpc === 16) v = raw[y * rowBytes + i * 2]
      else {
        const bit = i * bpc
        v = (raw[y * rowBytes + (bit >> 3)] >> (8 - bpc - (bit & 7))) & max
        if (scale) v = Math.round((v * 255) / max)
      }
      out[k++] = v
    }
  }
  return out
}

function toRgba(values: Uint8Array, cs: ColorSpace, rgba: Uint8Array, isMask: boolean) {
  const px = rgba.length / 4
  const put = (i: number, kind: 'gray' | 'rgb' | 'cmyk', src: ArrayLike<number>, o: number) => {
    if (kind === 'gray') rgba.set([src[o], src[o], src[o], 255], i * 4)
    else if (kind === 'rgb') rgba.set([src[o], src[o + 1], src[o + 2], 255], i * 4)
    else {
      // CMYK simple, sin perfil de color: suficiente para ver y reutilizar la imagen.
      const k = 255 - src[o + 3]
      rgba.set([((255 - src[o]) * k) / 255, ((255 - src[o + 1]) * k) / 255, ((255 - src[o + 2]) * k) / 255, 255], i * 4)
    }
  }
  for (let i = 0; i < px; i++) {
    if (isMask) {
      // Máscara de esténcil: 0 pinta (negro), 1 es transparente.
      rgba.set(values[i] ? [0, 0, 0, 0] : [0, 0, 0, 255], i * 4)
    } else if (cs.kind === 'indexed') {
      put(i, cs.base.kind, cs.lookup, Math.min(values[i], cs.hival) * cs.base.n)
    } else put(i, cs.kind, values, i * cs.n)
  }
}

/** Transparencia: la SMask es una imagen en gris; se escala al tamaño de la imagen si hace falta. */
function applySoftMask(smask: PDFRawStream, rgba: Uint8Array, w: number, h: number) {
  const mw = num(smask.dict.lookup(N('Width')), 0)
  const mh = num(smask.dict.lookup(N('Height')), 0)
  if (!mw || !mh || filtersOf(smask.dict).some((f) => f !== 'FlateDecode' && f !== 'LZWDecode' && f !== 'RunLengthDecode')) return
  const alpha = unpackSamples(decodeData(smask), mw, mh, 1, num(smask.dict.lookup(N('BitsPerComponent')), 8), true)
  for (let y = 0; y < h; y++) {
    const my = Math.min(mh - 1, Math.floor((y * mh) / h))
    for (let x = 0; x < w; x++) rgba[(y * w + x) * 4 + 3] = alpha[my * mw + Math.min(mw - 1, Math.floor((x * mw) / w))]
  }
}

/* ───────────── PNG ───────────── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** PNG a partir de pixeles RGBA; si no hay transparencia se guarda como RGB (más liviano). */
export function encodePng(rgba: Uint8Array, w: number, h: number): Uint8Array {
  let opaque = true
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) { opaque = false; break }
  const channels = opaque ? 3 : 4
  const raw = new Uint8Array(h * (1 + w * channels))
  for (let y = 0; y < h; y++) {
    let o = y * (1 + w * channels) + 1 // el byte 0 de cada fila es el filtro (0 = ninguno)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      raw[o++] = rgba[i]
      raw[o++] = rgba[i + 1]
      raw[o++] = rgba[i + 2]
      if (!opaque) raw[o++] = rgba[i + 3]
    }
  }
  const ihdr = new Uint8Array(13)
  const v = new DataView(ihdr.buffer)
  v.setUint32(0, w)
  v.setUint32(4, h)
  ihdr.set([8, opaque ? 2 : 6, 0, 0, 0], 8)
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlibSync(raw, { level: 6 })), chunk('IEND', new Uint8Array())]
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}
