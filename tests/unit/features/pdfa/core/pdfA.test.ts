import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef, StandardFonts, cmyk, decodePDFRawStream, rgb } from 'pdf-lib'
import { convertToPdfA, isForbiddenAction, planFont, PdfAEncryptedError, srgbIcc, standardFontName, usesCmykOperator, xmpPacket, type PdfAOptions } from '../../../../../src/features/pdfa/core/pdfA'

const N = PDFName.of
const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
const loadFont = async (file: string) => new Uint8Array(readFileSync(`node_modules/pdfjs-dist/standard_fonts/${file}`))
const rasterized: number[] = []
const opts: PdfAOptions = {
  loadFont,
  rasterize: async (i) => {
    rasterized.push(i)
    return { image: JPG, format: 'jpg', widthPt: 300, heightPt: 400 }
  },
  now: new Date(Date.UTC(2026, 10, 16, 12, 0, 0)),
}
const text = (s: string) => new TextEncoder().encode(s)
// Ejemplo de la referencia de PDF: "-----A---B" comprimido con LZW.
const LZW = new Uint8Array([0x80, 0x0b, 0x60, 0x50, 0x22, 0x0c, 0x0c, 0x85, 0x01])

describe('piezas', () => {
  it('perfil sRGB válido', () => {
    const icc = srgbIcc()
    const v = new DataView(icc.buffer)
    const s = (o: number) => String.fromCharCode(...icc.subarray(o, o + 4))
    expect(v.getUint32(0)).toBe(icc.length)
    expect([s(12), s(16), s(20), s(36)]).toEqual(['mntr', 'RGB ', 'XYZ ', 'acsp'])
    expect(v.getUint32(128)).toBe(9)
    expect(icc.length % 4).toBe(0)
  })

  it('XMP con pdfaid y los datos escapados', () => {
    const x = xmpPacket({ title: 'Año <1> & "dos"\u0001', author: 'Ana', subject: 'Tema', keywords: 'a, b', creator: 'Word', producer: 'DocuSmart', created: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)), modified: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)) })
    expect(x).toContain('<pdfaid:part>2</pdfaid:part>')
    expect(x).toContain('<pdfaid:conformance>B</pdfaid:conformance>')
    expect(x).toContain('Año &lt;1&gt; &amp; "dos"</rdf:li>')
    expect(x).toContain('<rdf:Seq><rdf:li>Ana</rdf:li></rdf:Seq>')
    expect(x).toContain('<xmp:CreateDate>2026-01-02T03:04:05Z</xmp:CreateDate>')
    const min = xmpPacket({ producer: 'P', created: new Date(0), modified: new Date(0) })
    expect(min).not.toContain('dc:title')
    expect(min).not.toContain('Keywords')
  })

  it('nombres estándar de fuentes, también Arial y Times New Roman', () => {
    expect(standardFontName('Helvetica')).toBe('Helvetica')
    expect(standardFontName('Arial,BoldItalic')).toBe('Helvetica-BoldOblique')
    expect(standardFontName('ArialMT')).toBe('Helvetica')
    expect(standardFontName('TimesNewRomanPS-BoldMT')).toBe('Times-Bold')
    expect(standardFontName('Times-Italic')).toBe('Times-Italic')
    expect(standardFontName('Times New Roman')).toBe('Times-Roman')
    expect(standardFontName('CourierNew,Italic')).toBe('Courier-Oblique')
    expect(standardFontName('Courier-Bold')).toBe('Courier-Bold')
    expect(standardFontName('Symbol')).toBe('Symbol')
    expect(standardFontName('ZapfDingbats')).toBe('ZapfDingbats')
    expect(standardFontName('Calibri')).toBeNull()
  })

  it('plan para cada tipo de fuente', async () => {
    const d = await PDFDocument.create()
    const f = (o: Record<string, unknown>) => d.context.obj(o as never) as unknown as PDFDict
    const embeddedFd = d.context.register(d.context.obj({ Type: 'FontDescriptor', FontFile2: d.context.register(d.context.flateStream(new Uint8Array(4))) }))
    expect(planFont(f({ Subtype: 'Type3' })).status).toBe('ok')
    expect(planFont(f({ Subtype: 'TrueType', BaseFont: 'Calibri', FontDescriptor: embeddedFd })).status).toBe('ok')
    expect(planFont(f({ Subtype: 'Type0', DescendantFonts: [f({ Subtype: 'CIDFontType2', FontDescriptor: embeddedFd })] })).status).toBe('ok')
    expect(planFont(f({ Subtype: 'Type0', DescendantFonts: [f({ Subtype: 'CIDFontType2' })] })).status).toBe('broken')
    expect(planFont(f({ Subtype: 'MMType1', BaseFont: 'Helvetica' })).status).toBe('broken')
    expect(planFont(f({ Subtype: 'TrueType', BaseFont: 'Calibri' })).status).toBe('broken')
    expect(planFont(f({ Subtype: 'Type1', BaseFont: 'Helvetica', Encoding: 'WinAnsiEncoding' }))).toEqual({ status: 'fix', std: 'Helvetica', encoding: 'winansi' })
    expect(planFont(f({ Subtype: 'Type1', BaseFont: 'Times-Roman' }))).toEqual({ status: 'fix', std: 'Times-Roman', encoding: 'standard' })
    expect(planFont(f({ Subtype: 'Type1', BaseFont: 'Symbol' }))).toEqual({ status: 'fix', std: 'Symbol', encoding: 'builtin' })
    expect(planFont(f({ Subtype: 'Type1', BaseFont: 'Helvetica', Encoding: 'MacRomanEncoding' })).status).toBe('broken')
  })

  it('detecta los operadores de color CMYK', () => {
    expect(usesCmykOperator('q 0 0.5 1 0 k 10 10 50 50 re f Q')).toBe(true)
    expect(usesCmykOperator('0 0 0 1 K\n1 w')).toBe(true)
    expect(usesCmykOperator('q .2 -1 +3 4.5 k Q')).toBe(true)
    expect(usesCmykOperator('0 0 1 rg BT /F1 12 Tf (k) Tj ET')).toBe(false)
    expect(usesCmykOperator('1 0 0 k')).toBe(false)
    expect(usesCmykOperator('/k 1 2 3 4 Tj')).toBe(false)
  })

  it('acciones prohibidas, también encadenadas', async () => {
    const ctx = (await PDFDocument.create()).context
    expect(isForbiddenAction(ctx, ctx.obj({ S: 'JavaScript', JS: 'x' }))).toBe(true)
    expect(isForbiddenAction(ctx, ctx.obj({ S: 'URI', URI: 'x' }))).toBe(false)
    expect(isForbiddenAction(ctx, ctx.obj({ S: 'Named', N: 'NextPage' }))).toBe(false)
    expect(isForbiddenAction(ctx, ctx.obj({ S: 'Named', N: 'Print' }))).toBe(true)
    const js = ctx.register(ctx.obj({ S: 'Launch' }))
    expect(isForbiddenAction(ctx, ctx.register(ctx.obj({ S: 'GoTo', D: [], Next: [js] })))).toBe(true)
    expect(isForbiddenAction(ctx, ctx.obj({ S: 'GoTo', D: [], Next: ctx.obj({ S: 'URI' }) }))).toBe(false)
    expect(isForbiddenAction(ctx, undefined)).toBe(false)
  })
})

/** Documento con todo lo que PDF/A no admite. */
export async function messyPdf(): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  const ctx = d.context
  const h = await d.embedFont(StandardFonts.Helvetica)
  d.setTitle('Informe & <anexos>')
  d.setAuthor('Ana Peña')
  d.setSubject('Pruebas')
  d.setKeywords(['pdf', 'archivo'])
  d.setCreator('Pruebas')
  // 1: texto normal, JavaScript, adjunto, enlaces y una nota sin apariencia
  const p1 = d.addPage()
  p1.drawText('Pagina normal', { x: 50, y: 700, font: h, color: rgb(0, 0, 0.5) })
  await d.attach(text('hola'), 'nota.txt', { mimeType: 'text/plain' })
  d.addJavaScript('saludo', 'app.alert("hola")')
  ctx.lookup(ctx.trailerInfo.Root, PDFDict).set(N('OpenAction'), ctx.obj({ S: 'JavaScript', JS: 'x' }))
  ctx.lookup(ctx.trailerInfo.Root, PDFDict).set(N('AA'), ctx.obj({ WC: { S: 'JavaScript', JS: 'x' } }))
  const annots = [
    ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [50, 690, 200, 720], A: { S: 'URI', URI: 'https://docusmart.online' } }),
    ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [50, 600, 200, 620], A: { S: 'JavaScript', JS: 'x' } }),
    ctx.obj({ Type: 'Annot', Subtype: 'Text', Rect: [300, 700, 320, 720], Contents: 'nota' }),
    ctx.obj({ Type: 'Annot', Subtype: 'Sound', Rect: [300, 600, 320, 620] }),
    ctx.obj({ Type: 'Annot', Subtype: 'Popup', Rect: [0, 0, 0, 0], F: 2 }),
  ].map((a) => ctx.register(a))
  p1.node.set(N('Annots'), ctx.obj(annots))
  // 2: colores CMYK
  const p2 = d.addPage()
  p2.drawRectangle({ x: 50, y: 500, width: 200, height: 100, color: cmyk(0, 0.5, 1, 0) })
  // 3: Arial sin incrustar con Differences (no se puede sustituir)
  const p3 = d.addPage()
  p3.node.setFontDictionary(N('FA'), ctx.register(ctx.obj({ Type: 'Font', Subtype: 'TrueType', BaseFont: 'Arial', Encoding: { Type: 'Encoding', Differences: [65, N('A')] } })))
  p3.node.set(N('Contents'), ctx.register(ctx.flateStream(text('BT /FA 24 Tf 50 700 Td (A) Tj ET'))))
  // 4: Times y Symbol sin incrustar, campo sin apariencia, estado gráfico e imagen prohibidos
  const p4 = d.addPage()
  p4.node.setFontDictionary(N('FT'), ctx.register(ctx.obj({ Type: 'Font', Subtype: 'Type1', BaseFont: 'Times-Roman' })))
  p4.node.setFontDictionary(N('FS'), ctx.register(ctx.obj({ Type: 'Font', Subtype: 'Type1', BaseFont: 'Symbol' })))
  p4.node.setExtGState(N('GS'), ctx.register(ctx.obj({ Type: 'ExtGState', TR: 'Identity', TR2: 'Identity', HTP: [] })))
  const img = ctx.register(ctx.stream(new Uint8Array(3), { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Interpolate: true }))
  p4.node.setXObject(N('Im'), img)
  // LZW recomprimible y LZW con predictor (este último obliga a pasar la página a imagen)
  const lzw = ctx.register(ctx.stream(LZW, { Filter: 'LZWDecode' }))
  p4.node.set(N('Contents'), ctx.register(ctx.flateStream(text("q /GS gs /Im Do Q BT /FT 20 Tf 50 700 Td (It's) Tj /FS 20 Tf (abg) Tj ET"))))
  p4.node.set(N('PieceInfo'), ctx.obj({ Datos: lzw })) // un stream cualquiera (no es contenido)
  const form = d.getForm()
  const tf = form.createTextField('nombre')
  tf.setText('Ana Peña')
  tf.addToPage(p4, { x: 50, y: 600, width: 200, height: 24 })
  await d.flush()
  form.updateFieldAppearances()
  for (const w of tf.acroField.getWidgets()) w.dict.delete(N('AP'))
  form.acroForm.dict.set(N('NeedAppearances'), ctx.obj(true))
  const p5 = d.addPage()
  p5.node.setXObject(N('X'), ctx.register(ctx.stream(LZW, { Filter: 'LZWDecode', DecodeParms: { Predictor: 2 }, Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 1, 1] })))
  // Contenido opcional sin nombre
  ctx.lookup(ctx.trailerInfo.Root, PDFDict).set(N('OCProperties'), ctx.obj({ OCGs: [], D: { AS: [] }, Configs: [ctx.obj({})] }))
  return d.save({ updateFieldAppearances: false })
}

describe('convertToPdfA', () => {
  it('arregla lo que puede y pasa a imagen lo que no', async () => {
    rasterized.length = 0
    const { pdf, report } = await convertToPdfA(await messyPdf(), opts)
    expect(report.rasterPages).toEqual([
      { page: 2, reason: 'cmyk' },
      { page: 3, reason: 'font' },
      { page: 5, reason: 'other' },
    ])
    expect(rasterized).toEqual([1, 2, 4])
    expect(report.fonts.sort()).toEqual(['Helvetica', 'Symbol', 'Times-Roman'])
    // Acciones: OpenAction, /AA del catálogo, JavaScript del documento y el del enlace.
    // Anotaciones: la nota sin apariencia y el sonido.
    expect(report.removed).toEqual({ actions: 4, attachments: 1, annotations: 2 })
    expect(report.formAppearances).toBe(true)

    const doc = await PDFDocument.load(pdf, { updateMetadata: false })
    const ctx = doc.context
    const cat = doc.catalog
    // Perfil de color, metadatos e identificador
    const intent = (cat.lookup(N('OutputIntents'), PDFArray)).lookup(0, PDFDict)
    expect(intent.get(N('S'))).toBe(N('GTS_PDFA1'))
    const xmp = new TextDecoder().decode((cat.lookup(N('Metadata')) as PDFRawStream).getContents())
    expect(xmp).toContain('<pdfaid:part>2</pdfaid:part>')
    expect(xmp).toContain('Informe &amp; &lt;anexos&gt;')
    expect(xmp).toContain('<pdf:Keywords>pdf archivo</pdf:Keywords>')
    expect(doc.getTitle()).toBe('Informe & <anexos>')
    expect(doc.getProducer()).toBe('DocuSmart')
    expect(doc.getModificationDate()?.toISOString()).toBe('2026-11-16T12:00:00.000Z')
    expect((ctx.trailerInfo.ID as PDFArray).size()).toBe(2)
    // Fuera scripts, adjuntos y acciones
    expect(cat.has(N('OpenAction'))).toBe(false)
    expect(cat.has(N('AA'))).toBe(false)
    expect(cat.lookup(N('Names'), PDFDict).has(N('EmbeddedFiles'))).toBe(false)
    expect(cat.lookup(N('Names'), PDFDict).has(N('JavaScript'))).toBe(false)
    expect(cat.lookup(N('AcroForm'), PDFDict).has(N('NeedAppearances'))).toBe(false)
    // Anotaciones: queda el enlace web (imprimible) y el popup; el enlace JavaScript pierde su acción
    const [p1, , , p4, p5] = doc.getPages()
    const kept = p1.node.lookup(N('Annots'), PDFArray).asArray().map((r) => ctx.lookup(r) as PDFDict)
    expect(kept.map((a) => a.get(N('Subtype'))?.toString())).toEqual(['/Link', '/Link', '/Popup'])
    expect((kept[0].get(N('F')) as PDFNumber).asNumber()).toBe(4)
    expect(kept[1].has(N('A'))).toBe(false)
    // El campo conserva su lugar y ahora tiene apariencia
    expect(doc.getForm().getTextField('nombre').getText()).toBe('Ana Peña')
    const widget = p4.node.lookup(N('Annots'), PDFArray).lookup(0, PDFDict)
    expect(widget.lookup(N('AP'), PDFDict).has(N('N'))).toBe(true)
    // Todas las fuentes en uso quedan incrustadas
    for (const [, obj] of ctx.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFDict) || obj.get(N('Type')) !== N('Font')) continue
      const fd = obj.lookup(N('FontDescriptor'), PDFDict)
      expect(['FontFile', 'FontFile2', 'FontFile3'].some((k) => fd.has(N(k)))).toBe(true)
    }
    // Times sin codificación: WinAnsi con las comillas de StandardEncoding
    const times = p4.node.Resources()!.lookup(N('Font'), PDFDict).lookup(N('FT'), PDFDict)
    expect(times.get(N('Subtype'))).toBe(N('Type1'))
    expect(times.lookup(N('Encoding'), PDFDict).lookup(N('Differences'), PDFArray).asArray().map(String)).toEqual(['39', '/quoteright', '96', '/quoteleft'])
    const symbol = p4.node.Resources()!.lookup(N('Font'), PDFDict).lookup(N('FS'), PDFDict)
    expect(symbol.lookup(N('Encoding'), PDFDict).lookup(N('Differences'), PDFArray).asArray().map(String)).toContain('/alpha')
    // Estado gráfico, imagen y LZW
    const gs = p4.node.Resources()!.lookup(N('ExtGState'), PDFDict).lookup(N('GS'), PDFDict)
    expect([gs.has(N('TR')), gs.has(N('HTP')), gs.get(N('TR2'))]).toEqual([false, false, N('Default')])
    const im = p4.node.Resources()!.lookup(N('XObject'), PDFDict).lookup(N('Im')) as PDFRawStream
    expect(im.dict.has(N('Interpolate'))).toBe(false)
    const lzw = p4.node.lookup(N('PieceInfo'), PDFDict).lookup(N('Datos')) as PDFRawStream
    expect(lzw.dict.get(N('Filter'))).toBe(N('FlateDecode'))
    expect(new TextDecoder().decode(decodePDFRawStream(lzw).decode())).toBe('-----A---B')
    // Página pasada a imagen: solo la imagen, sin anotaciones
    expect(p5.getSize()).toEqual({ width: 300, height: 400 })
    expect(p5.node.Resources()!.lookup(N('XObject'), PDFDict).keys().map(String)).toEqual(['/Im0'])
    // Contenido opcional con nombre
    const oc = cat.lookup(N('OCProperties'), PDFDict)
    expect(oc.lookup(N('D'), PDFDict).has(N('AS'))).toBe(false)
    expect(oc.lookup(N('D'), PDFDict).has(N('Name'))).toBe(true)
    expect((oc.lookup(N('Configs'), PDFArray).lookup(0, PDFDict)).has(N('Name'))).toBe(true)
    // El adjunto y lo que dejaron las páginas pasadas a imagen ya no está en el archivo
    expect(new TextDecoder('latin1').decode(pdf)).not.toContain('nota.txt')
  })

  it('un PDF limpio queda igual, solo con lo que exige la norma', async () => {
    const d = await PDFDocument.create()
    d.addPage().drawText('Hola', { x: 50, y: 700, font: await d.embedFont(StandardFonts.CourierBold) })
    const { pdf, report } = await convertToPdfA(await d.save(), { loadFont })
    expect(report).toEqual({ fonts: ['Courier-Bold'], rasterPages: [], removed: { actions: 0, attachments: 0, annotations: 0 }, attachments: 0, layers: false, formAppearances: false })
    const out = await PDFDocument.load(pdf, { updateMetadata: false })
    const font = out.getPages()[0].node.Resources()!.lookup(N('Font'), PDFDict)
    const f = font.lookup(font.keys()[0], PDFDict)
    expect(f.lookup(N('FontDescriptor'), PDFDict).has(N('FontFile3'))).toBe(true)
    expect(f.lookup(N('Widths'), PDFArray).size()).toBe(224)
    expect(out.getTitle()).toBeUndefined()
  })

  it('pide pasar a imagen si no hay rasterizador, y rechaza PDF cifrados', async () => {
    await expect(convertToPdfA(await messyPdf(), { loadFont })).rejects.toThrow('imagen')
    const d = await PDFDocument.create()
    d.addPage()
    d.context.trailerInfo.Encrypt = d.context.register(d.context.obj({ Filter: 'Standard', V: 2 })) as PDFRef
    await expect(convertToPdfA(await d.save(), opts)).rejects.toBeInstanceOf(PdfAEncryptedError)
    await expect(convertToPdfA(new Uint8Array([1, 2, 3]), opts)).rejects.toThrow()
  })
})
