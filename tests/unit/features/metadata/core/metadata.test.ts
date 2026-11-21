import { describe, expect, it, vi } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { EncryptedPDFError, PDFDict, PDFDocument, PDFHexString, PDFName } from 'pdf-lib'
import { META_ACCEPT, MetaError, cleanFileName, detectKind, isKept, leftovers, readMetadata, stripMetadata } from '../../../../../src/features/metadata/core/metadata'
import { exifOrientation, orientationOnlyExif, readExif, tiffStart } from '../../../../../src/features/metadata/core/exif'
import { dedupe } from '../../../../../src/features/metadata/core/images'
import { pdfDate } from '../../../../../src/features/metadata/core/pdfMeta'
import { buildExif, concat, docxWithMeta, fakeJpeg, fakePng, jpegWithMeta, pngChunk, pngWithMeta, webpWithMeta } from '../../../../shared/metaFixtures'

const keys = (f: { key: string }[]) => f.map((x) => x.key)
const value = (f: { key: string; value: string }[], k: string) => f.find((x) => x.key === k)?.value
const has = (b: Uint8Array, text: string) => Buffer.from(b).includes(Buffer.from(text, 'latin1'))

describe('EXIF', () => {
  it('lee cámara, programa, fecha, autor, GPS y orientación', () => {
    const f = readExif(buildExif({ make: 'Apple', model: 'iPhone 15', software: '17.1', artist: 'Ana', date: '2024:05:06 07:08:09', orientation: 6, gps: [4.6097, -74.0817] }))
    expect(value(f, 'camera')).toBe('Apple iPhone 15')
    expect(value(f, 'software')).toBe('17.1')
    expect(value(f, 'author')).toBe('Ana')
    expect(value(f, 'dateTaken')).toBe('2024:05:06 07:08:09')
    expect(value(f, 'gps')).toBe('4.60970, -74.08170')
    expect(value(f, 'orientation')).toBe('6')
  })
  it('tolera bloques vacíos, rotos o sin prefijo', () => {
    expect(readExif(new Uint8Array())).toEqual([])
    expect(readExif(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toEqual([])
    const noPrefix = buildExif({ make: 'X' }).subarray(6)
    expect(tiffStart(noPrefix)).toBe(0)
    expect(value(readExif(noPrefix), 'camera')).toBe('X')
    expect(readExif(buildExif({ make: 'X' }).subarray(0, 20))).toEqual([])
  })
  it('la EXIF mínima solo trae la orientación', () => {
    const e = orientationOnlyExif(8)
    expect(readExif(e)).toEqual([{ key: 'orientation', value: '8' }])
    expect(exifOrientation(e)).toBe(8)
    expect(exifOrientation(buildExif({ make: 'X' }))).toBe(1)
  })
})

describe('detectKind', () => {
  it('reconoce por contenido', () => {
    expect(detectKind('x', fakeJpeg())).toBe('jpeg')
    expect(detectKind('x', fakePng())).toBe('png')
    expect(detectKind('x', webpWithMeta())).toBe('webp')
    expect(detectKind('x', new TextEncoder().encode('%PDF-1.7\n'))).toBe('pdf')
    expect(detectKind('a.docx', docxWithMeta())).toBe('office')
    expect(detectKind('a.zip', docxWithMeta())).toBeNull()
    expect(detectKind('a.txt', new TextEncoder().encode('hola'))).toBeNull()
    expect(META_ACCEPT).toContain('.pptx')
  })
  it('un archivo no compatible da error', async () => {
    await expect(readMetadata('a.txt', new TextEncoder().encode('hola'))).rejects.toBeInstanceOf(MetaError)
  })
})

describe('JPEG', () => {
  const jpg = jpegWithMeta(fakeJpeg(), buildExif({ make: 'Apple', model: 'iPhone 15', artist: 'Ana Secreta', orientation: 6, gps: [4.6, -74.08] }))
  it('muestra todo lo que trae', async () => {
    const f = await readMetadata('a.jpg', jpg)
    expect(keys(f)).toEqual(expect.arrayContaining(['camera', 'author', 'gps', 'orientation', 'xmp', 'iptc', 'comment']))
    expect(value(f, 'comment')).toBe('Hecho por Ana Secreta')
  })
  it('quita EXIF, XMP, IPTC y comentarios; conserva ICC, la orientación y la imagen', async () => {
    const r = await stripMetadata('a.jpg', jpg)
    expect(r.after).toEqual([{ key: 'orientation', value: '6' }])
    expect(leftovers(r.after)).toEqual([])
    expect(has(r.bytes, 'Ana Secreta')).toBe(false)
    expect(has(r.bytes, 'iPhone')).toBe(false)
    expect(has(r.bytes, 'ICC_PROFILE')).toBe(true)
    // Los datos de la imagen (desde SOS) siguen idénticos.
    const tail = (b: Uint8Array) => Buffer.from(b.subarray(b.indexOf(0xda) - 1)).toString('hex')
    expect(tail(r.bytes)).toBe(tail(jpg))
  })
  it('sin orientación no agrega EXIF', async () => {
    const r = await stripMetadata('a.jpg', jpegWithMeta(fakeJpeg(), buildExif({ make: 'X' }), false))
    expect(r.after).toEqual([])
    expect(has(r.bytes, 'Exif')).toBe(false)
  })
  it('un JPEG roto da error', async () => {
    await expect(readMetadata('a.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 1]))).rejects.toBeInstanceOf(MetaError)
    await expect(readMetadata('a.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0x00, 1, 2, 3]))).resolves.toEqual([])
  })
})

describe('PNG', () => {
  const png = pngWithMeta(fakePng())
  it('lee textos, EXIF y fecha', async () => {
    const f = await readMetadata('a.png', png)
    expect(value(f, 'author')).toBe('Ana Secreta')
    expect(value(f, 'software')).toBe('Editor 3000')
    expect(value(f, 'description')).toBe('Foto de la casa')
    expect(value(f, 'custom')).toBe('Proyecto: Cliente X')
    expect(value(f, 'modified')).toBe('2024-01-02 10:30:00')
    expect(value(f, 'camera')).toBe('Canon')
    expect(value(f, 'gps')).toBe('4.60970, -74.08170')
  })
  it('los quita sin tocar la imagen', async () => {
    const r = await stripMetadata('a.png', png)
    expect(r.after).toEqual([])
    expect(has(r.bytes, 'Ana Secreta')).toBe(false)
    expect(Buffer.from(r.bytes).toString('hex')).toBe(Buffer.from(fakePng()).toString('hex'))
  })
  it('lee zTXt comprimido, XMP y textos rotos', async () => {
    const { zlibSync } = await import('fflate')
    const extra = concat([
      pngChunk('zTXt', concat([new TextEncoder().encode('Comment\0\0'), zlibSync(new TextEncoder().encode('comprimido'))])),
      pngChunk('iTXt', new TextEncoder().encode('XML:com.adobe.xmp\0\0\0\0\0<x/>')),
      pngChunk('zTXt', new TextEncoder().encode('Title\0\0basura')),
      pngChunk('tEXt', new TextEncoder().encode('\0sinclave')),
      pngChunk('tEXt', new TextEncoder().encode('Author\0María Pérez')),
      pngChunk('tEXt', Uint8Array.from([...new TextEncoder().encode('Copyright\0'), 0xa9, 0x20, 0x41])),
    ])
    const base = fakePng()
    const f = await readMetadata('a.png', concat([base.subarray(0, 33), extra, base.subarray(33)]))
    expect(value(f, 'comment')).toBe('comprimido')
    // UTF-8 (lo que guardan muchos programas) y Latin-1 (la norma).
    expect(value(f, 'author')).toBe('María Pérez')
    expect(value(f, 'copyright')).toBe('© A')
    expect(keys(f)).toContain('xmp')
    expect(keys(f)).not.toContain('title')
  })
  it('un PNG roto da error', async () => {
    const bad = fakePng().slice(0, 20)
    bad[11] = 200
    await expect(readMetadata('a.png', bad)).rejects.toBeInstanceOf(MetaError)
    await expect(readMetadata('a.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).rejects.toBeInstanceOf(MetaError)
    const cut = fakePng()
    cut[8 + 3] = 99
    await expect(readMetadata('a.png', cut)).rejects.toBeInstanceOf(MetaError)
  })
})

describe('WebP', () => {
  it('quita EXIF y XMP y apaga sus banderas', async () => {
    const webp = webpWithMeta()
    const before = await readMetadata('a.webp', webp)
    expect(value(before, 'camera')).toBe('Pixel 8')
    expect(keys(before)).toContain('xmp')
    const r = await stripMetadata('a.webp', webp)
    expect(r.after).toEqual([])
    expect(has(r.bytes, 'Pixel')).toBe(false)
    const v = new DataView(r.bytes.buffer, r.bytes.byteOffset)
    expect(v.getUint32(4, true)).toBe(r.bytes.length - 8)
    expect(r.bytes[20] & 0x0c).toBe(0)
  })
  it('un WebP roto da error', async () => {
    const b = webpWithMeta().slice(0, 40)
    await expect(readMetadata('a.webp', b)).rejects.toBeInstanceOf(MetaError)
  })
})

describe('PDF', () => {
  async function pdfWithMeta() {
    const doc = await PDFDocument.create()
    doc.addPage()
    doc.setTitle('Contrato')
    doc.setAuthor('Ana Secreta')
    doc.setCreator('Word')
    doc.setProducer('Acrobat')
    doc.setCreationDate(new Date(Date.UTC(2024, 0, 2, 10, 30)))
    ;(doc as unknown as { getInfoDict(): PDFDict }).getInfoDict().set(PDFName.of('Cliente'), PDFHexString.fromText('Cliente X'))
    const xmp = doc.context.stream('<x:xmpmeta><dc:creator>Ana Secreta</dc:creator></x:xmpmeta>', { Type: 'Metadata', Subtype: 'XML' })
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(xmp))
    doc.getPage(0).node.set(PDFName.of('PieceInfo'), doc.context.obj({ App: 'x' }))
    return doc.save({ useObjectStreams: false })
  }
  it('lee la información, XMP y datos privados', async () => {
    const f = await readMetadata('a.pdf', await pdfWithMeta())
    expect(value(f, 'title')).toBe('Contrato')
    expect(value(f, 'author')).toBe('Ana Secreta')
    expect(value(f, 'producer')).toBe('Acrobat')
    expect(value(f, 'created')).toMatch(/^2024-01-0[12]/)
    expect(f).toContainEqual({ key: 'custom', value: 'Cliente: Cliente X' })
    expect(value(f, 'xmp')).toBe('1')
    expect(f).toContainEqual({ key: 'custom', value: 'PieceInfo' })
  })
  it('lo quita todo, también los objetos sueltos', async () => {
    const r = await stripMetadata('a.pdf', await pdfWithMeta())
    expect(r.after).toEqual([])
    const doc = await PDFDocument.load(r.bytes, { updateMetadata: false })
    expect(doc.getPageCount()).toBe(1)
    const strings = doc.context.enumerateIndirectObjects().flatMap(([, o]) => o.toString())
    expect(strings.join(' ')).not.toContain('Ana Secreta')
    expect(doc.getAuthor()).toBeUndefined()
  })
  it('fechas de PDF y archivos cifrados o rotos', async () => {
    expect(pdfDate("D:20240102103000-05'00'")).toBe('2024-01-02 10:30')
    expect(pdfDate('D:2024')).toBe('2024-01-01')
    expect(pdfDate('ayer')).toBe('ayer')
    const spy = vi.spyOn(PDFDocument, 'load').mockRejectedValueOnce(new Error('roto'))
    await expect(readMetadata('a.pdf', new TextEncoder().encode('%PDF-1.7\n'))).rejects.toMatchObject({ reason: 'damaged' })
    spy.mockRestore()
    const enc = vi.spyOn(PDFDocument, 'load').mockRejectedValueOnce(new EncryptedPDFError())
    await expect(readMetadata('a.pdf', new TextEncoder().encode('%PDF-1.7\n'))).rejects.toMatchObject({ reason: 'encrypted' })
    enc.mockRestore()
    // Un PDF que no se puede volver a guardar también se informa como dañado.
    const pdf = await pdfWithMeta()
    const save = vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValueOnce(new Error('roto'))
    await expect(stripMetadata('a.pdf', pdf)).rejects.toMatchObject({ reason: 'damaged' })
    save.mockRestore()
  })
})

describe('Office', () => {
  it('lee las propiedades del documento y las personalizadas', async () => {
    const f = await readMetadata('a.docx', docxWithMeta())
    expect(value(f, 'title')).toBe('Informe')
    expect(value(f, 'author')).toBe('Ana Secreta')
    expect(value(f, 'lastModifiedBy')).toBe('Luis & Co')
    expect(value(f, 'created')).toBe('2024-01-02 10:30')
    expect(value(f, 'company')).toBe('Empresa Secreta S.A.S.')
    expect(value(f, 'template')).toBe('Normal.dotm')
    expect(value(f, 'editTime')).toBe('42 min')
    expect(value(f, 'software')).toBe('Microsoft Office Word')
    expect(value(f, 'custom')).toBe('Cliente: Cliente X')
  })
  it('las quita sin tocar el contenido y deja el paquete coherente', async () => {
    const r = await stripMetadata('a.docx', docxWithMeta())
    expect(r.after).toEqual([])
    const files = unzipSync(r.bytes)
    expect(files['docProps/custom.xml']).toBeUndefined()
    expect(strFromU8(files['word/document.xml'])).toContain('Hola mundo')
    expect(strFromU8(files['[Content_Types].xml'])).not.toContain('custom.xml')
    expect(strFromU8(files['_rels/.rels'])).not.toContain('custom.xml')
    expect(strFromU8(files['docProps/app.xml'])).toContain('<Pages>1</Pages>')
    expect(strFromU8(files['docProps/app.xml'])).not.toContain('Empresa')
    expect(strFromU8(files['docProps/core.xml'])).not.toContain('Ana')
  })
  it('un ZIP que no es de Office o roto da error', async () => {
    const { zipSync, strToU8 } = await import('fflate')
    await expect(readMetadata('a.docx', zipSync({ 'a.txt': strToU8('x') }))).rejects.toMatchObject({ reason: 'unsupported' })
    await expect(readMetadata('a.docx', new Uint8Array([0x50, 0x4b, 3, 4, 1, 2]))).rejects.toMatchObject({ reason: 'damaged' })
  })
})

describe('utilidades', () => {
  it('nombres, datos conservados y duplicados', () => {
    expect(cleanFileName('foto.JPG', 'sin-metadatos')).toBe('foto-sin-metadatos.JPG')
    expect(cleanFileName('informe', 'limpio')).toBe('informe-limpio')
    expect(cleanFileName('.pdf', 'x')).toBe('archivo-x.pdf')
    expect(isKept({ key: 'orientation', value: '6' })).toBe(true)
    expect(isKept({ key: 'gps', value: '1, 2' })).toBe(false)
    expect(dedupe([{ key: 'author', value: 'A' }, { key: 'author', value: 'A' }, { key: 'author', value: 'B' }])).toHaveLength(2)
  })
})
