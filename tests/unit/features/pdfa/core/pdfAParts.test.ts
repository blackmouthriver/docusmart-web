// W-147.7: PDF/A-1b (sin transparencias ni capas) y PDF/A-3b (con adjuntos). La validez completa
// se comprobó con veraPDF; aquí se prueban las reglas que cambian con cada versión.
import { readFileSync } from 'node:fs'
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRawStream, PDFStream, StandardFonts, rgb } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { annotAllowed, convertToPdfA, mimeOf, usesTransparency, xmpPacket, type PdfAOptions, type PdfAPart } from '../../../../../src/features/pdfa/core/pdfA'

const N = PDFName.of
const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
const opts = (part: PdfAPart): PdfAOptions => ({
  part,
  loadFont: async (file) => new Uint8Array(readFileSync(`node_modules/pdfjs-dist/standard_fonts/${file}`)),
  rasterize: async () => ({ image: JPG, format: 'jpg', widthPt: 300, heightPt: 400 }),
  now: new Date(Date.UTC(2026, 10, 24, 12, 0, 0)),
})

/** Una página con texto, un rectángulo semitransparente, una capa, un polígono y un adjunto XML. */
async function sample() {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([300, 400])
  page.drawText('Factura', { x: 30, y: 350, size: 20, font })
  doc.addPage([300, 400]).drawRectangle({ x: 30, y: 30, width: 100, height: 100, color: rgb(1, 0, 0), opacity: 0.4 })
  await doc.attach(new TextEncoder().encode('<factura/>'), 'factura.xml', { description: 'XML' })
  const ctx = doc.context
  const ocg = ctx.register(ctx.obj({ Type: 'OCG', Name: PDFHexString.fromText('Capa') }))
  doc.catalog.set(N('OCProperties'), ctx.obj({ OCGs: [ocg], D: { ON: [ocg] } }))
  const ap = ctx.register(ctx.stream('0 0 1 RG 10 10 m 90 10 l s', { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 100, 100] }))
  const poly = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Polygon', Rect: [100, 100, 200, 200], Vertices: [110, 110, 190, 110, 150, 190], F: 4, CA: 0.5, AP: { N: ap } }))
  page.node.set(N('Annots'), ctx.obj([poly]))
  return doc.save()
}

const xmp = (doc: PDFDocument) => new TextDecoder().decode((doc.catalog.lookup(N('Metadata')) as PDFRawStream).getContents())

describe('reglas por versión', () => {
  it('anotaciones permitidas en cada parte', () => {
    expect(annotAllowed('Polygon', 1)).toBe(false)
    expect(annotAllowed('Polygon', 2)).toBe(true)
    expect(annotAllowed('Link', 1)).toBe(true)
    expect(annotAllowed('FileAttachment', 1)).toBe(false)
    expect(annotAllowed('FileAttachment', 2)).toBe(false)
    expect(annotAllowed('FileAttachment', 3)).toBe(true)
    expect(annotAllowed('3D', 3)).toBe(false)
  })

  it('transparencia en un estado gráfico', async () => {
    const ctx = (await PDFDocument.create()).context
    const gs = (o: Record<string, unknown>) => ctx.obj(o as never) as unknown as PDFDict
    expect(usesTransparency(gs({ ca: 0.5 }))).toBe(true)
    expect(usesTransparency(gs({ CA: 1, ca: 1, BM: 'Normal', SMask: 'None' }))).toBe(false)
    expect(usesTransparency(gs({ BM: 'Multiply' }))).toBe(true)
    expect(usesTransparency(gs({ BM: ['Compatible', 'Normal'] }))).toBe(false)
    expect(usesTransparency(gs({ SMask: { S: 'Luminosity' } }))).toBe(true)
  })

  it('tipo de archivo por la extensión y parte en el XMP', () => {
    expect(mimeOf('factura.XML')).toBe('application/xml')
    expect(mimeOf('hoja.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(mimeOf('sin-extension')).toBe('application/octet-stream')
    const m = { producer: 'P', created: new Date(0), modified: new Date(0) }
    expect(xmpPacket(m, 1)).toContain('<pdfaid:part>1</pdfaid:part>')
    expect(xmpPacket(m, 3)).toContain('<pdfaid:part>3</pdfaid:part>')
    expect(xmpPacket(m)).toContain('<pdfaid:part>2</pdfaid:part>')
  })
})

describe('convertir a cada versión', () => {
  it('1b: la página con transparencia pasa a imagen, sin capas, sin polígono ni adjunto', async () => {
    const { pdf, report } = await convertToPdfA(await sample(), opts(1))
    expect(report.rasterPages).toEqual([{ page: 2, reason: 'transparency' }])
    expect(report.layers).toBe(true)
    expect(report.removed.attachments).toBe(1)
    expect(report.removed.annotations).toBe(1)
    const doc = await PDFDocument.load(pdf)
    expect(xmp(doc)).toContain('<pdfaid:part>1</pdfaid:part>')
    expect(doc.catalog.has(N('OCProperties'))).toBe(false)
    expect(doc.catalog.has(N('AF'))).toBe(false)
    expect(doc.getPage(0).node.has(N('Annots'))).toBe(false)
    expect(doc.getPage(0).node.has(N('Group'))).toBe(false)
  })

  it('2b: conserva la transparencia, las capas y el polígono; quita el adjunto', async () => {
    const { pdf, report } = await convertToPdfA(await sample(), opts(2))
    expect(report.rasterPages).toEqual([])
    expect(report.layers).toBe(false)
    expect(report.removed.attachments).toBe(1)
    const doc = await PDFDocument.load(pdf)
    expect(doc.catalog.has(N('OCProperties'))).toBe(true)
    expect(doc.getPage(0).node.lookup(N('Annots'), PDFArray).size()).toBe(1)
  })

  it('3b: conserva el adjunto con nombre, tipo, fecha y relación, listado en /AF', async () => {
    const { pdf, report } = await convertToPdfA(await sample(), opts(3))
    expect(report.attachments).toBe(1)
    expect(report.removed.attachments).toBe(0)
    const doc = await PDFDocument.load(pdf)
    expect(xmp(doc)).toContain('<pdfaid:part>3</pdfaid:part>')
    const af = doc.catalog.lookup(N('AF'), PDFArray)
    expect(af.size()).toBe(1)
    const spec = af.lookup(0, PDFDict)
    expect(spec.get(N('AFRelationship'))).toBe(N('Unspecified'))
    expect((spec.lookup(N('UF')) as PDFHexString).decodeText()).toBe('factura.xml')
    const file = spec.lookup(N('EF'), PDFDict).lookup(N('F')) as PDFStream
    expect(file.dict.get(N('Subtype'))).toBe(N('application/xml'))
    expect(file.dict.lookup(N('Params'), PDFDict).has(N('ModDate'))).toBe(true)
  })

  it('3b: un adjunto sin archivo se quita y no queda /AF', async () => {
    const doc = await PDFDocument.create()
    doc.addPage([200, 200])
    const ctx = doc.context
    const spec = ctx.register(ctx.obj({ Type: 'Filespec', F: 'roto.txt' }))
    doc.catalog.set(N('Names'), ctx.obj({ EmbeddedFiles: { Names: [PDFHexString.fromText('roto.txt'), spec] } }))
    const { pdf, report } = await convertToPdfA(await doc.save(), opts(3))
    expect(report.attachments).toBe(0)
    expect((await PDFDocument.load(pdf)).catalog.has(N('AF'))).toBe(false)
  })
})
