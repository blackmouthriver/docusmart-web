/**
 * Metadatos de PDF (W-106): el diccionario de información (título, autor, programa, fechas…),
 * los bloques XMP, los datos privados de programas (PieceInfo) y el identificador del archivo.
 * Al quitarlos también se borran los objetos que quedaban sueltos, para que el autor no siga
 * escondido dentro del archivo.
 */
import { EncryptedPDFError, PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream, PDFString, type PDFObject } from 'pdf-lib'
import { readJpeg, stripJpeg } from './images'
import { MetaError, type MetaField, type MetaKey } from './types'

export type StripPdfOptions = {
  /** Quitar también comentarios, adjuntos y JavaScript (no solo los datos del autor). */
  hidden?: boolean
}

/** Anotaciones que son comentarios de una persona (no enlaces ni campos de formulario). */
const MARKUP = new Set(['Text', 'FreeText', 'Highlight', 'Underline', 'StrikeOut', 'Squiggly', 'Ink', 'Stamp', 'Line', 'Square', 'Circle', 'Polygon', 'PolyLine', 'Caret', 'FileAttachment', 'Sound', 'Popup', 'Redact'])
const name = (o: PDFObject | undefined) => (o instanceof PDFName ? o.decodeText() : '')

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

/** Imágenes JPEG guardadas tal cual en el PDF (solo DCTDecode): ahí viaja el EXIF de las fotos. */
function jpegStreams(doc: PDFDocument): Array<[PDFRef, PDFRawStream]> {
  return doc.context.enumerateIndirectObjects().flatMap(([ref, o]) => {
    if (!(o instanceof PDFRawStream)) return []
    const f = o.dict.get(PDFName.of('Filter'))
    const only = f instanceof PDFArray ? (f.size() === 1 ? f.get(0) : undefined) : f
    return name(only) === 'DCTDecode' ? [[ref, o] as [PDFRef, PDFRawStream]] : []
  })
}

/** ¿La foto trae datos además de la orientación? */
function photoHasData(s: PDFRawStream): boolean {
  try {
    return readJpeg(s.getContents()).some((f) => f.key !== 'orientation')
  } catch {
    return false
  }
}

/** Las anotaciones de todas las páginas, con el arreglo donde está cada una. */
function annotations(doc: PDFDocument): Array<{ list: PDFArray; index: number; dict: PDFDict }> {
  const out: Array<{ list: PDFArray; index: number; dict: PDFDict }> = []
  for (const page of doc.getPages()) {
    const list = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray)
    if (!list) continue
    for (let index = 0; index < list.size(); index++) {
      const dict = list.lookupMaybe(index, PDFDict)
      if (dict) out.push({ list, index, dict })
    }
  }
  return out
}

/** Entradas con nombre de un árbol de nombres (/Names → EmbeddedFiles o JavaScript). */
function nameTreeSize(tree: PDFDict | undefined, budget = { n: 2000 }): number {
  if (!tree || budget.n-- <= 0) return 0
  const pairs = tree.lookupMaybe(PDFName.of('Names'), PDFArray)
  let count = pairs ? Math.floor(pairs.size() / 2) : 0
  const kids = tree.lookupMaybe(PDFName.of('Kids'), PDFArray)
  if (kids) for (let i = 0; i < kids.size(); i++) count += nameTreeSize(kids.lookupMaybe(i, PDFDict), budget)
  return count
}

const isScriptAction = (o: PDFObject | undefined, doc: PDFDocument): boolean => {
  const d = o instanceof PDFRef ? doc.context.lookup(o) : o
  return d instanceof PDFDict && ['JavaScript', 'Launch', 'ImportData', 'SubmitForm'].includes(name(d.get(PDFName.of('S'))))
}

/** ¿Hay JavaScript o acciones automáticas (al abrir, al pasar el mouse…)? */
function hasScripts(doc: PDFDocument, dicts: PDFDict[]): boolean {
  const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)
  if (nameTreeSize(names?.lookupMaybe(PDFName.of('JavaScript'), PDFDict)) > 0) return true
  if (isScriptAction(doc.catalog.get(PDFName.of('OpenAction')), doc)) return true
  return dicts.some((d) => d.has(PDFName.of('AA')) || (d.has(PDFName.of('A')) && isScriptAction(d.get(PDFName.of('A')), doc)))
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
  // W-146.3: fotos con EXIF, comentarios y sus autores, adjuntos y JavaScript.
  const photos = jpegStreams(doc).filter(([, s]) => photoHasData(s)).length
  if (photos) out.push({ key: 'photos', value: String(photos) })
  const notes = annotations(doc).filter((a) => MARKUP.has(name(a.dict.get(PDFName.of('Subtype')))))
  if (notes.length) out.push({ key: 'comments', value: String(notes.length) })
  const authors = [...new Set(annotations(doc).map((a) => text(a.dict.get(PDFName.of('T')))).filter(Boolean))]
  if (authors.length) out.push({ key: 'commentAuthors', value: authors.join(', ') })
  const files = nameTreeSize(doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)?.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict))
  const fileNotes = notes.filter((a) => name(a.dict.get(PDFName.of('Subtype'))) === 'FileAttachment').length
  if (files + fileNotes) out.push({ key: 'attachments', value: String(files + fileNotes) })
  if (hasScripts(doc, dicts)) out.push({ key: 'javascript', value: '✓' })
  return out
}

export async function stripPdf(bytes: Uint8Array, opts: StripPdfOptions = {}): Promise<Uint8Array> {
  const doc = await open(bytes)
  const ctx = doc.context
  const drop = (o: PDFObject | undefined) => o instanceof PDFRef && ctx.delete(o)

  // Fotos: se quita el EXIF (cámara, GPS, autor) sin recomprimir la imagen.
  for (const [ref, stream] of jpegStreams(doc)) {
    if (!photoHasData(stream)) continue
    try {
      const clean = stripJpeg(stream.getContents())
      const dict = stream.dict.clone(ctx)
      dict.set(PDFName.of('Length'), PDFNumber.of(clean.length))
      ctx.assign(ref, PDFRawStream.of(dict, clean))
    } catch {
      // Una imagen que no se puede leer como JPEG se deja como está.
    }
  }

  // Comentarios: siempre se borra quién los escribió y cuándo; con `hidden`, se quitan enteros.
  const removeAt = new Map<PDFArray, number[]>()
  for (const a of annotations(doc)) {
    for (const key of ['T', 'M', 'CreationDate']) a.dict.delete(PDFName.of(key))
    if (opts.hidden) {
      if (MARKUP.has(name(a.dict.get(PDFName.of('Subtype'))))) removeAt.set(a.list, [...(removeAt.get(a.list) ?? []), a.index])
      a.dict.delete(PDFName.of('AA'))
      if (isScriptAction(a.dict.get(PDFName.of('A')), doc)) a.dict.delete(PDFName.of('A'))
    }
  }
  for (const [list, indexes] of removeAt) for (const i of indexes.sort((p, q) => q - p)) list.remove(i)
  // Una página sin comentarios no necesita la lista vacía.
  for (const page of doc.getPages()) if (page.node.lookupMaybe(PDFName.of('Annots'), PDFArray)?.size() === 0) page.node.delete(PDFName.of('Annots'))

  if (opts.hidden) {
    // Adjuntos y JavaScript del documento, y las acciones automáticas de páginas y campos.
    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)
    for (const key of ['EmbeddedFiles', 'JavaScript']) names?.delete(PDFName.of(key))
    if (isScriptAction(doc.catalog.get(PDFName.of('OpenAction')), doc)) doc.catalog.delete(PDFName.of('OpenAction'))
    for (const d of allDicts(doc)) d.delete(PDFName.of('AA'))
  }
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
