import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { child, decodeXml, find, parseXml, path } from '../../../../../src/features/convert/core/xml'
import { PptxError, colorOf, readPptx, resolvePath, tint } from '../../../../../src/features/convert/core/pptxRead'
import { deckToPdf, hexColor, layoutParagraph } from '../../../../../src/features/convert/core/pptxPdf'
import { buildPptx, fitImage, slideSize } from '../../../../../src/features/convert/core/pptxWrite'
import { StandardFonts } from 'pdf-lib'

// Presentación hecha con PowerPoint (portada, lista con viñetas, forma, tabla e imagen), sin metadatos.
const REAL = new Uint8Array(readFileSync('tests/fixtures/office/presentacion.pptx'))

describe('parseXml', () => {
  it('etiquetas, atributos, texto, entidades, CDATA y autocierres', () => {
    const doc = parseXml('<?xml version="1.0"?><!-- c --><a:p x="1" y=\'2 &amp; 3\'><a:r><a:t>Hola &lt;mundo&gt; &#233;&#xE9;</a:t></a:r><a:br/><a:t><![CDATA[<raw>]]></a:t></a:p>')
    const p = child(doc, 'a:p')!
    expect(p.attrs).toEqual({ x: '1', y: '2 & 3' })
    expect(path(p, 'a:r', 'a:t')?.text).toBe('Hola <mundo> éé')
    expect(child(p, 'a:br')?.children).toEqual([])
    expect(p.children[2].text).toBe('<raw>')
    expect(find(doc, 'a:t')?.text).toBe('Hola <mundo> éé')
    expect(find(undefined, 'x')).toBeUndefined()
  })
  it('tolera cierres sobrantes y entidades desconocidas', () => {
    const doc = parseXml('<a><b>x</b></c></a>')
    expect(path(doc, 'a', 'b')?.text).toBe('x')
    expect(decodeXml('&foo; &quot;')).toBe('&foo; "')
  })
})

describe('utilidades de pptx', () => {
  it('rutas relativas y absolutas', () => {
    expect(resolvePath('ppt/slides/slide1.xml', '../media/image1.png')).toBe('ppt/media/image1.png')
    expect(resolvePath('ppt/presentation.xml', 'slides/slide1.xml')).toBe('ppt/slides/slide1.xml')
    expect(resolvePath('ppt/slides/slide1.xml', '/ppt/media/a.png')).toBe('ppt/media/a.png')
    expect(resolvePath('ppt/slides/slide1.xml', './x.xml')).toBe('ppt/slides/x.xml')
  })
  it('colores del tema con modificadores', () => {
    const theme = { scheme: { accent1: '4472C4', dk1: '000000', lt1: 'FFFFFF' }, map: { tx1: 'dk1', bg1: 'lt1' } }
    const n = (xml: string) => parseXml(`<x>${xml}</x>`).children[0]
    expect(colorOf(n('<a:srgbClr val="ff0000"/>'), theme)).toBe('FF0000')
    expect(colorOf(n('<a:schemeClr val="tx1"/>'), theme)).toBe('000000')
    expect(colorOf(n('<a:schemeClr val="bg1"/>'), theme)).toBe('FFFFFF')
    expect(colorOf(n('<a:schemeClr val="accent1"><a:lumMod val="50000"/></a:schemeClr>'), theme)).not.toBe('4472C4')
    expect(colorOf(n('<a:schemeClr val="accent1"><a:lumMod val="20000"/><a:lumOff val="80000"/></a:schemeClr>'), theme)).toMatch(/^[D-F]/)
    expect(colorOf(n('<a:schemeClr val="accent1"><a:tint val="50000"/><a:shade val="90000"/></a:schemeClr>'), theme)).toMatch(/^[0-9A-F]{6}$/)
    expect(colorOf(n('<a:sysClr val="window" lastClr="FFFFFF"/>'), theme)).toBe('FFFFFF')
    expect(colorOf(n('<a:sysClr val="windowText"/>'), theme)).toBe('000000')
    expect(colorOf(n('<a:prstClr val="white"/>'), theme)).toBe('FFFFFF')
    expect(colorOf(n('<a:schemeClr val="accent9"/>'), theme)).toBe('000000')
    expect(colorOf(n('<a:srgbClr val="nope"/>'), theme)).toBeNull()
    expect(colorOf(undefined, theme)).toBeNull()
    expect(colorOf(n('<a:srgbClr val="808080"/>'), { scheme: {}, map: {} })).toBe('808080')
    expect(tint('000000', 0.2)).toBe('CCCCCC')
    expect(hexColor('zz')).toEqual(hexColor('000000'))
  })
})

describe('readPptx con una presentación de PowerPoint', () => {
  const deck = readPptx(REAL)
  it('tamaño, diapositivas y nada omitido', () => {
    expect(deck.width).toBe(12192000)
    expect(deck.height).toBe(6858000)
    expect(deck.slides).toHaveLength(3)
    expect(deck.skipped).toBe(0)
  })
  it('portada: título y subtítulo con la posición y el tamaño heredados del diseño', () => {
    const [title, sub] = deck.slides[0].items
    expect(title.kind === 'text' && title.paras[0].runs[0].text).toBe('Informe trimestral')
    expect(title.kind === 'text' && title.paras[0].runs[0].size).toBe(60)
    expect(title.kind === 'text' && title.paras[0].align).toBe('ctr')
    expect(sub.kind === 'text' && sub.paras[0].bullet).toBeNull()
    expect(deck.slides[0].background).toBe('FFFFFF')
  })
  it('lista con viñetas por nivel', () => {
    const body = deck.slides[1].items[1]
    expect(body.kind).toBe('text')
    if (body.kind !== 'text') return
    expect(body.paras.map((p) => [p.level, p.bullet, p.runs[0].size])).toEqual([
      [0, '•', 28],
      [0, '•', 28],
      [1, '•', 24],
      [0, '•', 28],
    ])
  })
  it('forma con relleno del tema y texto blanco, tabla con estilo e imagen', () => {
    const items = deck.slides[2].items
    const shape = items.find((i) => i.kind === 'text' && i.paras[0].runs[0]?.text === 'Meta cumplida')
    expect(shape?.kind === 'text' && shape.fill).toBe('4472C4')
    expect(shape?.kind === 'text' && shape.paras[0].runs[0].color).toBe('FFFFFF')
    const table = items.find((i) => i.kind === 'table')
    expect(table?.kind === 'table' && table.rows.map((r) => r.cells.map((c) => c.paras[0].runs[0]?.text))).toEqual([
      ['Ciudad', 'Ventas'],
      ['Bogotá', '1.250'],
      ['Medellín', '980'],
    ])
    expect(table?.kind === 'table' && table.rows[0].cells[0].paras[0].runs[0].color).toBe('FFFFFF')
    expect(table?.kind === 'table' && table.rows[1].cells[0].fill).not.toBe(table?.kind === 'table' && table.rows[2].cells[0].fill)
    expect(items.some((i) => i.kind === 'image' && i.type === 'png')).toBe(true)
  })
  it('el PDF tiene una página por diapositiva, del mismo tamaño', async () => {
    const pdf = await PDFDocument.load(await deckToPdf(deck, 'Prueba'))
    expect(pdf.getPageCount()).toBe(3)
    expect(pdf.getPage(0).getSize()).toEqual({ width: 960, height: 540 })
    expect(pdf.getTitle()).toBe('Prueba')
  })
})

/** Presentación mínima hecha a mano, para los casos que PowerPoint no genera por defecto. */
function handmade(slideXml: string, extra: Record<string, string | Uint8Array> = {}, slideRels = '') {
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
  const rel = (id: string, type: string, target: string) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`
  const files: Record<string, Uint8Array> = {
    'ppt/presentation.xml': strToU8(`<p:presentation ${NS}><p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId9"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`),
    'ppt/_rels/presentation.xml.rels': strToU8(`<Relationships>${rel('rId1', 'slide', 'slides/slide1.xml')}${rel('rId9', 'slide', 'slides/missing.xml')}</Relationships>`),
    'ppt/slides/slide1.xml': strToU8(`<p:sld ${NS}>${slideXml}</p:sld>`),
    'ppt/slides/_rels/slide1.xml.rels': strToU8(`<Relationships>${slideRels}<Relationship Id="rX" Type="x/hyperlink" Target="https://a" TargetMode="External"/></Relationships>`),
  }
  for (const [k, v] of Object.entries(extra)) files[k] = typeof v === 'string' ? strToU8(v) : v
  return zipSync(files)
}

describe('readPptx con casos especiales', () => {
  const sp = (inner: string, x = 0) => `<p:sp><p:nvSpPr><p:cNvPr id="2" name="s"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm>${inner}</p:spPr><p:txBody><a:bodyPr anchor="b"><a:normAutofit fontScale="50000"/></a:bodyPr><a:p><a:pPr algn="r"><a:buAutoNum type="arabicPeriod"/></a:pPr><a:r><a:rPr sz="2000" b="1" i="1" u="sng"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:rPr><a:t>Uno</a:t></a:r><a:br/><a:fld type="slidenum"><a:t>2</a:t></a:fld></a:p><a:p><a:pPr><a:buAutoNum type="arabicPeriod"/></a:pPr><a:r><a:t>Dos</a:t></a:r></a:p><a:p><a:pPr><a:buChar char="-"/></a:pPr><a:r><a:t></a:t></a:r></a:p></p:txBody></p:sp>`
  it('grupos, numeración, escala, fondo de color, imagen de fondo y elementos no compatibles', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 1])
    const emf = new Uint8Array([1, 0, 0, 0])
    const slide =
      `<p:cSld><p:bg><p:bgPr><a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="112233"/></a:gs></a:gsLst></a:gradFill></p:bgPr></p:bg><p:spTree>` +
      `<p:grpSp><p:grpSpPr><a:xfrm><a:off x="1000" y="1000"/><a:ext cx="2000" cy="2000"/><a:chOff x="0" y="0"/><a:chExt cx="1000" cy="1000"/></a:xfrm></p:grpSpPr>${sp('<a:prstGeom prst="ellipse"/><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="0000FF"/></a:solidFill></a:ln>', 100)}</p:grpSp>` +
      `<p:pic><p:nvPicPr><p:cNvPr id="3" name="i"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rJ"/></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="10" cy="10"/></a:xfrm></p:spPr></p:pic>` +
      `<p:pic><p:nvPicPr><p:cNvPr id="4" name="e"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rE"/></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="10" cy="10"/></a:xfrm></p:spPr></p:pic>` +
      `<p:graphicFrame><p:xfrm><a:off x="0" y="0"/><a:ext cx="10" cy="10"/></p:xfrm><a:graphic><a:graphicData><c:chart/></a:graphicData></a:graphic></p:graphicFrame>` +
      `<p:sp><p:nvSpPr><p:cNvPr id="5" name="sin caja"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>` +
      `<p:sp><p:nvSpPr><p:cNvPr id="6" name="relleno"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="10" cy="10"/></a:xfrm><a:noFill/><a:blipFill><a:blip r:embed="rP"/></a:blipFill></p:spPr></p:sp>` +
      `</p:spTree></p:cSld>`
    const deck = readPptx(
      handmade(slide, { 'ppt/media/a.jpg': jpg, 'ppt/media/a.emf': emf, 'ppt/media/a.png': png }, '<Relationship Id="rJ" Type="x/image" Target="../media/a.jpg"/><Relationship Id="rE" Type="x/image" Target="../media/a.emf"/><Relationship Id="rP" Type="x/image" Target="../media/a.png"/>'),
    )
    expect(deck.width).toBe(9144000)
    expect(deck.slides).toHaveLength(1)
    const s = deck.slides[0]
    expect(s.background).toBe('112233')
    const shape = s.items[0]
    expect(shape.kind).toBe('text')
    if (shape.kind !== 'text') return
    expect([shape.x, shape.w]).toEqual([1200, 1828800])
    expect(shape.shape).toBe('ellipse')
    expect([shape.fill, shape.line, shape.anchor, shape.scale]).toEqual(['00FF00', '0000FF', 'b', 0.5])
    expect(shape.paras.map((p) => p.bullet)).toEqual(['1.', '2.', null])
    expect(shape.paras[0].runs.map((r) => r.text)).toEqual(['Uno', '\n', '2'])
    expect(shape.paras[0].runs[0]).toMatchObject({ size: 10, bold: true, italic: true, underline: true, color: 'FF0000' })
    expect(shape.paras[0].align).toBe('r')
    expect(s.items.filter((i) => i.kind === 'image').map((i) => i.kind === 'image' && i.type)).toEqual(['jpg', 'png'])
    expect(deck.skipped).toBe(2)
  })
  it('diapositivas ocultas y archivos que no son presentaciones', async () => {
    expect(() => readPptx(handmade(''))).not.toThrow()
    expect(() => readPptx(new Uint8Array([1, 2, 3]))).toThrow(PptxError)
    expect(() => readPptx(zipSync({ 'a.txt': strToU8('x') }))).toThrow(PptxError)
    const hidden = handmade('').slice()
    const files = unzipSync(hidden)
    files['ppt/slides/slide1.xml'] = strToU8(strFromU8(files['ppt/slides/slide1.xml']).replace('<p:sld ', '<p:sld show="0" '))
    expect(() => readPptx(zipSync(files))).toThrow('empty')
  })
  it('imagen de fondo', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1])
    const deck = readPptx(handmade('<p:cSld><p:bg><p:bgPr><a:blipFill><a:blip r:embed="rB"/></a:blipFill></p:bgPr></p:bg><p:spTree/></p:cSld>', { 'ppt/media/b.png': png }, '<Relationship Id="rB" Type="x/image" Target="../media/b.png"/>'))
    expect(deck.slides[0].backgroundImage).toMatchObject({ type: 'png', w: 9144000, h: 6858000 })
  })
})

describe('layoutParagraph', () => {
  it('corta por palabras y parte las muy largas', async () => {
    const doc = await PDFDocument.create()
    const f = await doc.embedFont(StandardFonts.Helvetica)
    const fonts = { regular: f, bold: f, italic: f, boldItalic: f }
    const run = (text: string) => ({ text, size: 12, bold: false, italic: false, underline: false, color: '000000' })
    const lines = layoutParagraph({ runs: [run('uno dos tres cuatro cinco seis siete')], align: 'l', bullet: null, level: 0 }, fonts, 60)
    expect(lines.length).toBeGreaterThan(2)
    for (const l of lines) expect(l.width).toBeLessThanOrEqual(60.01)
    const long = layoutParagraph({ runs: [run('a'.repeat(80))], align: 'l', bullet: null, level: 0 }, fonts, 50)
    expect(long.length).toBeGreaterThan(2)
    expect(layoutParagraph({ runs: [], align: 'l', bullet: null, level: 0 }, fonts, 50)).toHaveLength(1)
    expect(layoutParagraph({ runs: [run('a\nb')], align: 'l', bullet: null, level: 0 }, fonts, 50)).toHaveLength(2)
  })
})

describe('buildPptx (PDF a PowerPoint)', () => {
  it('tamaño de diapositiva y ajuste de la imagen', () => {
    expect(slideSize({ width: 1920, height: 1080 })).toEqual({ cx: 12192000, cy: 6858000 })
    expect(slideSize({ width: 0, height: 0 }).cy).toBe(9144000)
    expect(fitImage({ width: 100, height: 200 }, { cx: 1000, cy: 1000 })).toEqual({ x: 250, y: 0, cx: 500, cy: 1000 })
  })
  it('un paquete completo, con una diapositiva y una imagen por página', () => {
    const img = (type: 'png' | 'jpg') => ({ data: new Uint8Array([1, 2, 3]), type, width: 800, height: 600 })
    const files = unzipSync(buildPptx([img('jpg'), img('png')], 'Mi <PDF>'))
    expect(Object.keys(files)).toEqual(expect.arrayContaining(['ppt/presentation.xml', 'ppt/slides/slide2.xml', 'ppt/media/image1.jpeg', 'ppt/media/image2.png', 'ppt/theme/theme1.xml', 'ppt/slideMasters/slideMaster1.xml']))
    expect(strFromU8(files['docProps/core.xml'])).toContain('Mi &lt;PDF&gt;')
    expect(strFromU8(files['ppt/presentation.xml'])).toContain('<p:sldSz cx="12192000" cy="9144000"/>')
    expect(strFromU8(files['[Content_Types].xml'])).toContain('/ppt/slides/slide2.xml')
    expect(() => buildPptx([])).toThrow()
    // Lo que genera se vuelve a leer como presentación.
    const deck = readPptx(buildPptx([{ data: new Uint8Array([0xff, 0xd8, 0xff]), type: 'jpg', width: 4, height: 3 }]))
    expect(deck.slides[0].items[0].kind).toBe('image')
  })
})
