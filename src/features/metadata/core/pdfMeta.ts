/**
 * Metadatos de PDF (W-106): el diccionario de información (título, autor, programa, fechas…),
 * los bloques XMP, los datos privados de programas (PieceInfo) y el identificador del archivo.
 * Al quitarlos también se borran los objetos que quedaban sueltos, para que el autor no siga
 * escondido dentro del archivo.
 */
import { EncryptedPDFError, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFStream, PDFString, type PDFObject } from 'pdf-lib'
import { MetaError, type MetaField, type MetaKey } from './types'

const INFO_KEYS: Record<string, MetaKey> = {
  Title: 'title',
  Author: 'author',
  Subject: 'subject',
  Keywords: 'keywords',
  Creator: 'creator',
  Producer: 'producer',
  CreationDate: 'created',
  ModDate: 'modified',
}

/** "D:20240102103000-05'00'" → "2024-01-02 10:30". Si no lo entiende, lo deja igual. */
export function pdfDate(s: string): string {
  const m = s.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/)
  if (!m) return s
  const [, y, mo = '01', d = '01', h, mi] = m
  return `${y}-${mo}-${d}` + (h ? ` ${h}:${mi ?? '00'}` : '')
}

const text = (o: PDFObject | undefined): string => (o instanceof PDFString || o instanceof PDFHexString ? o.decodeText().trim() : o instanceof PDFName ? o.decodeText() : '')

async function open(bytes: Uint8Array) {
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false })
    return doc
  } catch (e) {
    // pdf-lib está compilado a ES5: `instanceof` no reconoce su error, así que se mira también el mensaje.
    if (e instanceof EncryptedPDFError || /encrypted/i.test(e instanceof Error ? e.message : '')) throw new MetaError('encrypted')
    throw new MetaError('damaged')
  }
}

function infoDict(doc: PDFDocument): PDFDict | undefined {
  const info = doc.context.trailerInfo.Info
  const d = info instanceof PDFRef ? doc.context.lookup(info) : info
  return d instanceof PDFDict ? d : undefined
}

/** Diccionarios de todos los objetos (también los de los streams). */
function allDicts(doc: PDFDocument): PDFDict[] {
  return doc.context.enumerateIndirectObjects().flatMap(([, o]) => (o instanceof PDFDict ? [o] : o instanceof PDFStream ? [o.dict] : []))
}

export async function readPdf(bytes: Uint8Array): Promise<MetaField[]> {
  const doc = await open(bytes)
  const out: MetaField[] = []
  const info = infoDict(doc)
  if (info) {
    for (const [k, v] of info.entries()) {
      const name = k.decodeText()
      const value = text(v)
      if (!value) continue
      const key = INFO_KEYS[name]
      if (key) out.push({ key, value: key === 'created' || key === 'modified' ? pdfDate(value) : value })
      else out.push({ key: 'custom', value: `${name}: ${value}` })
    }
  }
  const dicts = allDicts(doc)
  const xmp = dicts.filter((d) => d.has(PDFName.of('Metadata'))).length
  if (xmp) out.push({ key: 'xmp', value: String(xmp) })
  if (dicts.some((d) => d.has(PDFName.of('PieceInfo')))) out.push({ key: 'custom', value: 'PieceInfo' })
  if (doc.context.trailerInfo.ID) out.push({ key: 'docId', value: '✓' })
  return out
}

export async function stripPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await open(bytes)
  const ctx = doc.context
  const drop = (o: PDFObject | undefined) => o instanceof PDFRef && ctx.delete(o)
  // Información del documento.
  drop(ctx.trailerInfo.Info)
  ctx.trailerInfo.Info = undefined
  ctx.trailerInfo.ID = undefined
  // XMP y datos privados en el catálogo, las páginas, las imágenes…
  for (const d of allDicts(doc)) {
    for (const key of ['Metadata', 'PieceInfo']) {
      const name = PDFName.of(key)
      if (!d.has(name)) continue
      drop(d.get(name))
      d.delete(name)
    }
  }
  try {
    return await doc.save({ updateFieldAppearances: false })
  } catch {
    throw new MetaError('damaged')
  }
}
