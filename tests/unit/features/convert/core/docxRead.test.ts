import { describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { DocxError, bulletChar, docxText, familyOf, formatNumber, readDocx } from '../../../../../src/features/convert/core/docxRead'
import { layoutPdf, type OImage, type OPara, type OTable } from '../../../../../src/features/convert/core/officePdf'
import { writeDocx, type WordDoc } from '../../../../../src/features/convert/core/pdfWord'
import { encodePng } from '../../../../../src/features/pdf/core/pdfImages'

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'

const STYLES = `<w:styles ${W}>
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Ttulo1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi"/><w:color w:val="2F5496"/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Cita"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
  <w:style w:type="character" w:styleId="Hipervnculo"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
  <w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/></w:style>
  <w:style w:type="table" w:styleId="Tablaconcuadrcula"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`

const NUMBERING = `<w:numbering ${W}>
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
    <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%1.%2)"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="&#xF0B7;"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
  <w:num w:numId="3"><w:abstractNumId w:val="2"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="4"/></w:lvlOverride></w:num>
</w:numbering>`

const THEME = '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Cambria"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>'

const PNG = encodePng(new Uint8Array(4 * 2 * 4).fill(180), 4, 2)

/** Un .docx armado a mano: cuerpo, estilos, numeración, tema, imagen, encabezado y pie. */
function docx(body: string, extra: { header?: string; footer?: string; sect?: string } = {}): Uint8Array {
  const refs = (extra.header ? '<w:headerReference w:type="default" r:id="rH"/>' : '') + (extra.footer ? '<w:footerReference w:type="default" r:id="rF"/>' : '')
  const sect = extra.sect ?? `<w:sectPr>${refs}<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1800" w:header="708" w:footer="708"/></w:sectPr>`
  return zipSync({
    '[Content_Types].xml': strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
    'word/document.xml': strToU8(`<w:document ${W}><w:body>${body}${sect}</w:body></w:document>`),
    'word/styles.xml': strToU8(STYLES),
    'word/numbering.xml': strToU8(NUMBERING),
    'word/theme/theme1.xml': strToU8(THEME),
    'word/media/image1.png': PNG,
    'word/header1.xml': strToU8(`<w:hdr ${W}>${extra.header ?? ''}</w:hdr>`),
    'word/footer1.xml': strToU8(`<w:ftr ${W}>${extra.footer ?? ''}</w:ftr>`),
    'word/_rels/header1.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rImg" Type="x/image" Target="media/image1.png"/></Relationships>'),
    'word/_rels/document.xml.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rImg" Type="x/image" Target="media/image1.png"/><Relationship Id="rH" Type="x/header" Target="header1.xml"/><Relationship Id="rF" Type="x/footer" Target="footer1.xml"/><Relationship Id="rLink" Type="x/hyperlink" Target="https://docusmart.online" TargetMode="External"/></Relationships>',
    ),
  })
}
const p = (inner: string, pPr = '') => `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${inner}</w:p>`
const r = (text: string, rPr = '') => `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`
const paras = (blocks: unknown[]) => blocks.filter((b): b is OPara => (b as OPara).kind === 'para')
const text = (x: OPara) => x.runs.map((y) => y.text).join('')

async function pdfText(bytes: Uint8Array): Promise<string[]> {
  const d = await getDocument({ data: bytes.slice() }).promise
  const out: string[] = []
  for (let i = 1; i <= d.numPages; i++) out.push((await (await d.getPage(i)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim())
  return out
}

describe('utilidades', () => {
  it('numeración, viñetas y familias de fuente', () => {
    expect([1, 4, 9, 14, 40].map((n) => formatNumber(n, 'upperRoman'))).toEqual(['I', 'IV', 'IX', 'XIV', 'XL'])
    expect([1, 26, 27].map((n) => formatNumber(n, 'lowerLetter'))).toEqual(['a', 'z', 'aa'])
    expect(formatNumber(3, 'decimalZero')).toBe('03')
    expect(formatNumber(3, 'none')).toBe('')
    expect(bulletChar('')).toBe('•')
    expect(bulletChar('o')).toBe('◦')
    expect(bulletChar('')).toBe('•')
    expect(bulletChar('–')).toBe('–')
    expect([familyOf('Times New Roman'), familyOf('Calibri'), familyOf('Courier New'), familyOf('Open Sans'), familyOf(undefined)]).toEqual(['serif', 'sans', 'mono', 'sans', undefined])
  })

  it('rechaza lo que no es un .docx', () => {
    expect(() => readDocx(new Uint8Array([1, 2, 3]))).toThrow(DocxError)
    expect(() => readDocx(zipSync({ 'a.txt': strToU8('x') }))).toThrow(DocxError)
  })
})

describe('readDocx', () => {
  it('página, márgenes, estilos heredados y formato de cada corrida', () => {
    const doc = readDocx(
      docx(
        p(r('Informe anual'), '<w:pStyle w:val="Ttulo1"/>') +
          p(r('Texto ') + r('rojo', '<w:color w:val="FF0000"/><w:b/>') + r(' resaltado', '<w:highlight w:val="yellow"/>') + r(' tachado', '<w:strike/>') + r('2', '<w:vertAlign w:val="superscript"/>') + r(' mayúsculas', '<w:caps/>') + r('oculto', '<w:vanish/>') + r(' Courier', '<w:rFonts w:ascii="Courier New"/>')) +
          p(r('Cita centrada'), '<w:pStyle w:val="Cita"/>') +
          p(r('Justificado con sangría'), '<w:jc w:val="both"/><w:ind w:left="720" w:right="360" w:firstLine="360"/><w:spacing w:before="120" w:after="240" w:line="360" w:lineRule="auto"/>') +
          p(r('Exacto'), '<w:spacing w:line="300" w:lineRule="exact"/>') +
          p(`<w:hyperlink r:id="rLink"><w:r><w:rPr><w:rStyle w:val="Hipervnculo"/></w:rPr><w:t>enlace</w:t></w:r></w:hyperlink>`) +
          p(''),
      ),
    )
    expect(doc.pageSize).toEqual([612, 792])
    expect(doc.margins).toEqual({ top: 72, right: 54, bottom: 72, left: 90 })
    expect(doc.headerDistance).toBeCloseTo(35.4)
    const [title, body, quote, just, exact, link, empty] = paras(doc.blocks)
    expect(title).toMatchObject({ style: 'h1', keepNext: true, spaceBefore: 12, spaceAfter: 0 })
    expect(title.runs[0]).toMatchObject({ color: '2F5496', size: 16, family: 'serif' })
    expect(body.runs.map((x) => x.text)).toEqual(['Texto ', 'rojo', ' resaltado', ' tachado', '2', ' MAYÚSCULAS', ' Courier'])
    expect(body.runs[0]).toMatchObject({ size: 11, family: 'sans' })
    expect(body.runs[1]).toMatchObject({ color: 'FF0000', bold: true })
    expect(body.runs[2].highlight).toBe('FFFF00')
    expect(body.runs[3].strike).toBe(true)
    expect(body.runs[4].script).toBe('sup')
    expect(body.runs[6].family).toBe('mono')
    expect(body).toMatchObject({ spaceAfter: 8, line: { auto: 259 / 240 } })
    expect(quote).toMatchObject({ align: 'center' })
    expect(quote.runs[0].italic).toBe(true)
    expect(just).toMatchObject({ align: 'justify', indent: { left: 36, right: 18, firstLine: 18 }, spaceBefore: 6, spaceAfter: 12, line: { auto: 1.5 } })
    expect(exact.line).toEqual({ exact: 15 })
    expect(link.runs[0]).toMatchObject({ text: 'enlace', color: '0563C1', underline: true })
    expect(empty.runs).toEqual([{ text: '', size: 11 }])
  })

  it('listas numeradas por nivel, viñetas y número inicial', () => {
    const li = (t: string, num: number, lvl = 0) => p(r(t), `<w:numPr><w:ilvl w:val="${lvl}"/><w:numId w:val="${num}"/></w:numPr>`)
    const doc = readDocx(docx(li('Uno', 1) + li('Sub a', 1, 1) + li('Sub b', 1, 1) + li('Dos', 1) + li('Sub otra vez', 1, 1) + li('Viñeta', 2) + li('Romano', 3) + li('Romano 2', 3)))
    expect(paras(doc.blocks).map((x) => x.list?.marker)).toEqual(['1.', '1.a)', '1.b)', '2.', '2.a)', '•', 'IV.', 'V.'])
    expect(paras(doc.blocks)[1]).toMatchObject({ indent: { left: 72, firstLine: -18 }, list: { ordered: true, level: 1, index: 1 } })
    expect(paras(doc.blocks)[5].list).toMatchObject({ ordered: false })
  })

  it('tablas: anchos, bordes del estilo, celdas combinadas, fondo y encabezado repetido', () => {
    const tc = (t: string, tcPr = '') => `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${p(r(t))}</w:tc>`
    const grid = '<w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="3000"/><w:gridCol w:w="1000"/></w:tblGrid>'
    const doc = readDocx(
      docx(
        `<w:tbl><w:tblPr><w:tblStyle w:val="Tablaconcuadrcula"/></w:tblPr>${grid}` +
          `<w:tr><w:trPr><w:tblHeader/></w:trPr>${tc('Título', '<w:gridSpan w:val="2"/><w:shd w:fill="D9E2F3"/>')}${tc('C')}</w:tr>` +
          `<w:tr>${tc('a', '<w:vMerge w:val="restart"/>')}${tc('b')}${tc('c')}</w:tr>` +
          `<w:tr>${tc('', '<w:vMerge/>')}${tc('e')}${tc('f')}</w:tr></w:tbl>` +
          `<w:tbl><w:tblPr/>${grid}<w:tr>${tc('sin bordes')}</w:tr></w:tbl>`,
      ),
    )
    const [t, plain] = doc.blocks as OTable[]
    expect(t.widths).toEqual([100, 150, 50])
    expect(t.borders).toBe(true)
    expect(t.header).toBe(true)
    expect(t.cells?.[0]).toEqual([{ fill: 'D9E2F3', span: 2 }, {}])
    expect(t.cells?.[2][0]).toEqual({ merged: true })
    expect(t.rows[1].map((c) => c.map(text).join(''))).toEqual(['a', 'b', 'c'])
    expect(plain.borders).toBe(false)
  })

  it('imágenes con su tamaño en el documento, cuadros de texto, saltos y lo que no se puede dibujar', () => {
    const drawing = (cx: number, cy: number) => `<w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><a:graphic><a:graphicData><pic:pic xmlns:pic="x"><pic:blipFill><a:blip r:embed="rImg"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
    const box = '<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wps:txbx xmlns:wps="x"><w:txbxContent><w:p><w:r><w:t>En el cuadro</w:t></w:r></w:p></w:txbxContent></wps:txbx></w:drawing></mc:Choice><mc:Fallback><w:pict><w:txbxContent><w:p><w:r><w:t>Repetido</w:t></w:r></w:p></w:txbxContent></w:pict></mc:Fallback></mc:AlternateContent></w:r>'
    const doc = readDocx(
      docx(
        p(r('Antes ') + drawing(1905000, 952500) + r(' después'), '<w:jc w:val="center"/>') +
          p(box) +
          p(r('Hoja 1') + '<w:r><w:br w:type="page"/></w:r>' + r('Hoja 2')) +
          p('<w:r><w:drawing><c:chart xmlns:c="x"/></w:drawing></w:r><w:r><w:drawing><a:blip r:embed="noexiste"/></w:drawing></w:r><w:r><w:pict/></w:r>') +
          p(r('Fin de sección'), '<w:sectPr/>') +
          p(r('Sección 2')),
      ),
    )
    const kinds = doc.blocks.map((b) => (b.kind === 'para' ? text(b) || '¶' : b.kind))
    expect(kinds).toEqual(['Antes ', 'image', ' después', '¶', 'En el cuadro', 'Hoja 1', 'pagebreak', 'Hoja 2', '¶', 'Fin de sección', 'pagebreak', 'Sección 2'])
    expect(doc.blocks[1]).toMatchObject({ kind: 'image', width: 200, height: 100, align: 'center' } satisfies Partial<OImage>)
    expect(doc.skippedImages).toBe(3)
  })

  it('encabezado y pie con número de página (campo simple y campo complejo)', () => {
    const doc = readDocx(
      docx(p(r('Cuerpo')), {
        header: p(r('Empresa S.A.S.'), '<w:jc w:val="right"/>'),
        footer: p(r('Página ') + '<w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple>' + r(' de ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> NUMPAGES </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>9</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>', '<w:jc w:val="center"/>'),
      }),
    )
    expect(paras(doc.header).map(text)).toEqual(['Empresa S.A.S.'])
    expect(paras(doc.footer)[0].runs.map((x) => x.field ?? x.text)).toEqual(['Página ', 'page', ' de ', 'pages'])
    expect(readDocx(docx(p(r('x')), { header: p('') })).header).toEqual([])
  })

  it('encabezado con tabla: logo en una celda combinada, campos de página, márgenes y alto de fila', async () => {
    const logo = '<w:r><w:drawing><wp:anchor><wp:extent cx="952500" cy="476250"/><a:blip r:embed="rImg"/></wp:anchor></w:drawing></w:r>'
    const tc = (inner: string, tcPr = '') => `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${inner}</w:tc>`
    const tr = (cells: string, h = '') => `<w:tr>${h ? `<w:trPr><w:trHeight w:val="${h}"/></w:trPr>` : ''}${cells}</w:tr>`
    const header =
      '<w:tbl><w:tblPr><w:tblStyle w:val="Tablaconcuadrcula"/><w:tblCellMar><w:left w:w="100"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="4000"/></w:tblGrid>' +
      tr(tc(p(logo, '<w:jc w:val="center"/>'), '<w:vMerge w:val="restart"/>') + tc(p(r('Código: X-1'))), '400') +
      tr(tc(p(''), '<w:vMerge/>') + tc(p(r('Página ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText>PAGE</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>7</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>' + r(' de ') + '<w:fldSimple w:instr="NUMPAGES"/>'))) +
      '</w:tbl>'
    const body = Array.from({ length: 70 }, (_, i) => p(r(`Línea ${i + 1}`))).join('')
    const doc = readDocx(docx(body, { header }))
    const t = doc.header[0] as OTable
    expect(t).toMatchObject({ kind: 'table', borders: true, pad: { x: 5, y: 0 }, rowHeights: [20, undefined] })
    expect(t.rows[0][0][0].image).toMatchObject({ width: 100, height: 50 })
    expect(t.rows[0][0][0].align).toBe('center')
    expect(t.rows[1][1][0].runs.map((x) => x.field ?? x.text)).toEqual(['Página ', 'page', ' de ', 'pages'])

    // Margen superior chico (36 pt): el encabezado empuja el cuerpo hacia abajo, como en Word.
    const pdf = await layoutPdf(doc.blocks, { pageSize: doc.pageSize, margins: { ...doc.margins, top: 36 }, header: doc.header, headerDistance: doc.headerDistance })
    const d = await getDocument({ data: pdf.slice() }).promise
    const items = (await (await d.getPage(1)).getTextContent()).items.filter((it): it is { str: string; transform: number[] } & typeof it => 'str' in it && !!it.str.trim())
    const yOf = (s: string) => items.find((it) => it.str.startsWith(s))!.transform[5]
    expect(yOf('Línea 1')).toBeLessThan(yOf('Página') - 12)
    const all = (await pdfText(pdf)).join(' | ')
    expect(all).toContain(`Página 1 de ${d.numPages}`)
    expect(all).toContain(`Página ${d.numPages} de ${d.numPages}`)
    // El logo se incrusta una sola vez aunque se dibuje en cada hoja (la imagen y su máscara de transparencia).
    expect(new TextDecoder('latin1').decode(pdf).match(/\/Subtype\s*\/Image/g)).toHaveLength(2)
  })

  it('espaciado contextual entre párrafos seguidos del mismo estilo', () => {
    const doc = readDocx(
      docx(
        p(r('Uno'), '<w:pStyle w:val="Cita"/><w:contextualSpacing/><w:spacing w:before="100" w:after="100"/>') +
          p(r('Dos'), '<w:pStyle w:val="Cita"/><w:contextualSpacing/><w:spacing w:before="100" w:after="100"/>') +
          p(r('Otro estilo'), '<w:spacing w:before="100" w:after="100"/>'),
      ),
    )
    expect(paras(doc.blocks).map((x) => [x.spaceBefore, x.spaceAfter])).toEqual([[5, 0], [0, 5], [5, 5]])
  })

  it('texto para leer en voz alta', () => {
    const doc = readDocx(docx(p(r('Hola')) + p('') + p(r('Uno'), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>') + `<w:tbl><w:tr><w:tc>${p(r('celda'))}</w:tc></w:tr></w:tbl>`))
    expect(docxText(doc)).toBe('Hola\n\n1. Uno\n\ncelda')
  })
})

describe('Word a PDF de punta a punta', () => {
  it('el PDF tiene el tamaño de página, el texto, la numeración y el pie del documento', async () => {
    const li = (t: string) => p(r(t), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    const many = Array.from({ length: 60 }, (_, i) => p(r(`Párrafo ${i + 1} con texto suficiente para ocupar una línea.`), '<w:jc w:val="both"/>')).join('')
    const doc = readDocx(
      docx(p(r('Informe'), '<w:pStyle w:val="Ttulo1"/>') + li('Primero') + li('Segundo') + p(r('Тест 中文 한국어')) + many, {
        footer: p(r('Página ') + '<w:fldSimple w:instr="PAGE"/>' + r(' de ') + '<w:fldSimple w:instr="NUMPAGES"/>', '<w:jc w:val="center"/>'),
      }),
    )
    const pdf = await layoutPdf(doc.blocks, { pageSize: doc.pageSize, margins: doc.margins, footer: doc.footer, footerDistance: doc.footerDistance })
    const loaded = await PDFDocument.load(pdf)
    expect(loaded.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
    const pages = await pdfText(pdf)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0]).toMatch(/^Informe 1\. Primero 2\. Segundo Тест 中 ?文 한국어/)
    pages.forEach((t, i) => expect(t.endsWith(`Página ${i + 1} de ${pages.length}`)).toBe(true))
  })

  it('lee un .docx real hecho por el generador de PDF a Word', () => {
    const png = encodePng(new Uint8Array(4 * 4 * 4).fill(200), 4, 4)
    const run = (t: string, o = {}) => ({ text: t, bold: false, italic: false, size: 11, family: 'sans' as const, ...o })
    const word: WordDoc = {
      page: { width: 595, height: 842 },
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      bodySize: 11,
      bodyFamily: 'serif',
      bodyFont: 'Times New Roman',
      blocks: [
        { kind: 'para', runs: [run('Informe')], align: 'center', heading: 1, bullet: false, indent: 0 },
        { kind: 'para', runs: [run('Hola '), run('mundo', { bold: true }), run(' feliz', { italic: true })], align: 'left', heading: 0, bullet: false, indent: 0 },
        { kind: 'para', runs: [run('Punto uno')], align: 'left', heading: 0, bullet: true, indent: 0 },
        { kind: 'image', img: { page: 0, x: 0, y: 0, w: 40, h: 40, png }, align: 'center' },
        { kind: 'table', rows: [[[run('A', { bold: true })], [run('B', { bold: true })]], [[run('1')], [run('2')]]], widths: [100, 100] },
        { kind: 'pagebreak' },
        { kind: 'para', runs: [run('Anexo')], align: 'right', heading: 2, bullet: false, indent: 0 },
      ],
    }
    const doc = readDocx(writeDocx(word))
    expect(doc.pageSize).toEqual([595, 842])
    const kinds = doc.blocks.map((b) => (b.kind === 'para' ? text(b) : b.kind))
    // El párrafo del salto de página deja su línea vacía arriba de la hoja siguiente, como en Word.
    expect(kinds).toEqual(['Informe', 'Hola mundo feliz', 'Punto uno', 'image', 'table', 'pagebreak', '', 'Anexo'])
    const [title, body, li] = paras(doc.blocks)
    expect(title).toMatchObject({ style: 'h1', align: 'center' })
    expect(body.runs.map((x) => !!x.bold)).toEqual([false, true, false])
    expect(li.list?.marker).toBe('•')
    expect(doc.blocks[3]).toMatchObject({ kind: 'image', width: expect.closeTo(53.3, 0), align: 'center' })
    expect((doc.blocks[4] as OTable).rows.map((row) => row.map((c) => c.map(text).join('')))).toEqual([['A', 'B'], ['1', '2']])
    expect(doc.skippedImages).toBe(0)
  })
})
