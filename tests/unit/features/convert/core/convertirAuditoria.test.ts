// Auditoría W-146.7 (Convertir): CSV en Windows-1252, SVG, Imagen a PDF, Excel con formato y
// hojas ocultas, tablas de PDF a Word/Excel y secciones, encabezados y notas de Word a PDF.
import { describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { decodeText, parseCsv } from '../../../../../src/features/convert/core/csv'
import { prepareSvg, svgRenderSize } from '../../../../../src/features/convert/core/formats'
import { imagePageLayout, jpegInfo } from '../../../../../src/features/convert/core/imagePdf'
import { XlsxError, columnIndex, excelDate, isDateFormat, readXlsx } from '../../../../../src/features/convert/core/xlsxRead'
import { cellText, columnGroups, columnLetter, formatParts, fromSheets } from '../../../../../src/features/convert/core/officeModels'
import { bandOf, buildDocument, buildLines, findColumns, tableColumns, type Table, type TextFrag } from '../../../../../src/features/convert/core/pdfWord'
import { pageRows } from '../../../../../src/features/convert/core/pdfExcel'
import { readDocx } from '../../../../../src/features/convert/core/docxRead'
import { layoutPdf, type OPara, type OTable } from '../../../../../src/features/convert/core/officePdf'

describe('CSV: codificación (W-146.7)', () => {
  const text = 'Nombre;Ciudad\nJosé Pérez;Bogotá\n'
  it('UTF-8 con y sin BOM, UTF-16 y Windows-1252 (el CSV de Excel en español)', () => {
    expect(decodeText(strToU8(text))).toBe(text)
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, ...strToU8(text)]))).toBe(text)
    const cp1252 = Uint8Array.from([...text].map((c) => c.charCodeAt(0)))
    expect(decodeText(cp1252)).toBe(text)
    expect(parseCsv(decodeText(cp1252))[1]).toEqual(['José Pérez', 'Bogotá'])
    const le = new Uint8Array(2 + text.length * 2)
    le.set([0xff, 0xfe])
    ;[...text].forEach((c, i) => le.set([c.charCodeAt(0), 0], 2 + i * 2))
    expect(decodeText(le)).toBe(text)
    const be = new Uint8Array(2 + text.length * 2)
    be.set([0xfe, 0xff])
    ;[...text].forEach((c, i) => be.set([0, c.charCodeAt(0)], 2 + i * 2))
    expect(decodeText(be)).toBe(text)
    // "€" en Windows-1252 es 0x80.
    expect(decodeText(new Uint8Array([0x80, 0x31]))).toBe('€1')
  })
})

describe('SVG (W-146.7)', () => {
  it('agrega el xmlns que falta (y el de xlink si se usa)', () => {
    expect(prepareSvg('<svg width="10" height="10"><rect/></svg>')).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect/></svg>')
    const x = prepareSvg('<svg><use xlink:href="#a"/></svg>')
    expect(x).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"')
    expect(x).toContain('xmlns="http://www.w3.org/2000/svg"')
    const ok = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    expect(prepareSvg(ok)).toBe(ok)
  })

  it('quita las imágenes con enlaces externos y deja las incrustadas', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://x.com/a.png" width="9"/><image xlink:href="//cdn/b.png"></image><image href="data:image/png;base64,AA"/><filter><feImage href="http://x/c.png"/></filter><rect/></svg>'
    const out = prepareSvg(svg)
    expect(out).not.toContain('x.com')
    expect(out).not.toContain('cdn')
    expect(out).not.toContain('http://x/c.png')
    expect(out).toContain('data:image/png;base64,AA')
    expect(out).toContain('<rect/>')
    expect(svgRenderSize(prepareSvg('<svg width="64" height="32"></svg>'))).toEqual({ width: 1024, height: 512 })
  })
})

describe('Imagen a PDF (W-146.7)', () => {
  it('A4 y Carta, vertical u horizontal según la imagen o a elección, centrada y sin deformarse', () => {
    const a = imagePageLayout(1000, 2000, { paper: 'a4', orientation: 'auto', margin: 'none' })
    expect(a.size).toEqual([595.28, 841.89])
    expect(a.height).toBeCloseTo(841.89)
    expect(a.width).toBeCloseTo(420.945)
    expect(a.x).toBeCloseTo((595.28 - 420.945) / 2)
    expect(imagePageLayout(2000, 1000, { paper: 'a4', orientation: 'auto', margin: 'none' }).size).toEqual([841.89, 595.28])
    expect(imagePageLayout(2000, 1000, { paper: 'letter', orientation: 'portrait', margin: 'none' }).size).toEqual([612, 792])
    expect(imagePageLayout(500, 1000, { paper: 'letter', orientation: 'landscape', margin: 'none' }).size).toEqual([792, 612])
  })

  it('márgenes y "como la imagen"', () => {
    const m = imagePageLayout(1000, 1000, { paper: 'a4', orientation: 'portrait', margin: 'big' })
    expect(m.width).toBeCloseTo(595.28 - 100)
    expect(m.x).toBeCloseTo(50)
    const fit = imagePageLayout(6000, 4000, { paper: 'fit', orientation: 'landscape', margin: 'none' })
    expect(fit.size).toEqual([595, 397])
    const fitM = imagePageLayout(1000, 1000, { paper: 'fit', orientation: 'auto', margin: 'small' })
    expect(fitM.size).toEqual([595, 595])
    expect(fitM.x).toBeCloseTo(20)
    expect(imagePageLayout(0, 0, { paper: 'fit', orientation: 'auto', margin: 'none' }).size).toEqual([595, 595])
  })

  /** Un JPEG mínimo: SOI, APP1 con EXIF (orientación) si se pide, SOF0 con `components` canales y EOI. */
  function jpeg(opts: { orientation?: number; little?: boolean; components?: number } = {}): Uint8Array {
    const out: number[] = [0xff, 0xd8]
    if (opts.orientation) {
      const le = opts.little ?? true
      const u16 = (v: number) => (le ? [v & 255, v >> 8] : [v >> 8, v & 255])
      const u32 = (v: number) => (le ? [v & 255, (v >> 8) & 255, 0, 0] : [0, 0, (v >> 8) & 255, v & 255])
      const tiff = [...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...u16(1), ...u16(0x0112), ...u16(3), ...u32(1), ...u16(opts.orientation), 0, 0, ...u32(0)]
      const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
      out.push(0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 255, ...payload)
    }
    const c = opts.components ?? 3
    const sof = [8, 0, 10, 0, 20, c, ...Array.from({ length: c * 3 }, () => 1)]
    out.push(0xff, 0xc0, (sof.length + 2) >> 8, (sof.length + 2) & 255, ...sof)
    out.push(0xff, 0xda, 0, 2, 0xff, 0xd9)
    return Uint8Array.from(out)
  }

  it('jpegInfo: orientación EXIF (Intel y Motorola) y CMYK', () => {
    expect(jpegInfo(jpeg())).toEqual({ orientation: 1, components: 3 })
    expect(jpegInfo(jpeg({ orientation: 6 }))).toEqual({ orientation: 6, components: 3 })
    expect(jpegInfo(jpeg({ orientation: 8, little: false }))).toEqual({ orientation: 8, components: 3 })
    expect(jpegInfo(jpeg({ components: 4 }))).toEqual({ orientation: 1, components: 4 })
    expect(jpegInfo(jpeg({ orientation: 9 }))?.orientation).toBe(1)
    expect(jpegInfo(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
    expect(jpegInfo(new Uint8Array([0xff, 0xd8, 0x00, 0x01, 0, 0]))).toBeNull()
  })
})

/* ───────────── Excel ───────────── */

function xlsx(sheets: Array<{ name: string; xml: string; state?: string }>, opts: { shared?: string[]; styles?: string; date1904?: boolean; absolute?: boolean } = {}): Uint8Array {
  const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  const files: Record<string, Uint8Array> = {
    'xl/workbook.xml': strToU8(`<workbook ${NS}>${opts.date1904 ? '<workbookPr date1904="1"/>' : ''}<sheets>${sheets.map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 1}"${s.state ? ` state="${s.state}"` : ''}/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Target="${opts.absolute ? '/xl/' : ''}worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`),
  }
  if (opts.shared) files['xl/sharedStrings.xml'] = strToU8(`<sst ${NS}>${opts.shared.map((s) => (s.startsWith('<') ? `<si>${s}</si>` : `<si><t>${s}</t></si>`)).join('')}</sst>`)
  if (opts.styles) files['xl/styles.xml'] = strToU8(`<styleSheet ${NS}>${opts.styles}</styleSheet>`)
  sheets.forEach((s, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<worksheet ${NS}><sheetData>${s.xml}</sheetData></worksheet>`)))
  return zipSync(files)
}

const STYLES =
  '<numFmts><numFmt numFmtId="164" formatCode="&quot;$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="#,##0.0 [$€-C0A]"/><numFmt numFmtId="166" formatCode="yyyy-mm-dd"/></numFmts>' +
  '<cellXfs><xf/><xf numFmtId="14"/><xf numFmtId="10"/><xf numFmtId="164"/><xf numFmtId="165"/><xf numFmtId="166"/><xf numFmtId="3"/></cellXfs>'

describe('Excel: lector propio (W-146.7)', () => {
  it('textos compartidos y en línea, números, booleanos, errores, fórmulas y fechas', () => {
    const book = xlsx(
      [
        {
          name: 'Ventas',
          xml:
            '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Total</t></is></c><c r="C1" t="s"><v>1</v></c></row>' +
            '<row r="3"><c r="A3" s="1"><v>46023</v></c><c r="B3" s="3"><f>B1*2</f><v>1500.5</v></c><c r="C3" s="2"><v>0.126</v></c><c r="D3" t="b"><v>1</v></c><c r="E3" t="e"><v>#DIV/0!</v></c><c r="F3" t="str"><v>hola</v></c><c r="G3" s="5"><v>46024</v></c></row>' +
            '<row><c s="4"><v>-12.25</v></c><c><v></v></c><c t="s"><v></v></c></row>',
        },
        { name: 'Oculta', xml: '<row r="1"><c r="A1" t="inlineStr"><is><t>secreto</t></is></c></row>', state: 'hidden' },
        { name: 'Muy oculta', xml: '', state: 'veryHidden' },
      ],
      { shared: ['Fecha', '<r><t>Ri</t></r><r><t>co</t></r>'], styles: STYLES },
    )
    const [s, hidden, very] = readXlsx(book)
    expect(s.sheet).toBe('Ventas')
    expect(s.hidden).toBe(false)
    expect(s.data[0]).toEqual(['Fecha', 'Total', 'Rico', null, null, null, null])
    expect(s.data[1]).toEqual([null, null, null, null, null, null, null])
    expect(s.data[2][0]).toEqual(new Date(Date.UTC(2026, 0, 1)))
    expect(s.data[2].slice(1, 6)).toEqual([1500.5, 0.126, true, '#DIV/0!', 'hola'])
    expect(s.data[2][6]).toEqual(new Date(Date.UTC(2026, 0, 2)))
    expect(s.data[3][0]).toBe(-12.25)
    expect(s.formats?.[2][1]).toBe('"$"\\ #,##0.00')
    expect(s.formats?.[2][2]).toBe('0.00%')
    expect([hidden.hidden, very.hidden]).toEqual([true, true])
    const { blocks } = fromSheets(readXlsx(book))
    const t = blocks[0] as OTable
    expect(blocks.filter((b) => b.kind === 'table')).toHaveLength(1)
    expect(t.title).toBeUndefined()
    expect(t.rows[2].map((c) => c[0].runs[0].text).slice(0, 3)).toEqual(['01/01/2026', '$ 1.500,50', '12,60 %'])
    expect(t.rows[3][0][0].runs[0].text).toBe('-12,3 €')
  })

  it('libro de 1904, rutas absolutas y sin estilos', () => {
    const [s] = readXlsx(xlsx([{ name: 'A', xml: '<row r="1"><c r="B1"><v>3</v></c></row>' }], { date1904: true, absolute: true }))
    expect(s.data).toEqual([[null, 3]])
    expect(() => readXlsx(new Uint8Array([1, 2, 3]))).toThrow(XlsxError)
    expect(() => readXlsx(zipSync({ 'a.txt': strToU8('x') }))).toThrow(XlsxError)
  })

  it('utilidades: columnas, fechas y formatos', () => {
    expect([columnIndex('A1'), columnIndex('Z9'), columnIndex('AA1'), columnIndex('ab12')]).toEqual([0, 25, 26, 27])
    expect(excelDate(1, true)).toEqual(new Date(Date.UTC(1904, 0, 2)))
    expect(excelDate(45658.5)).toEqual(new Date(Date.UTC(2025, 0, 1, 12)))
    expect(['dd/mm/yyyy', 'h:mm', 'yyyy-mm-dd;@', '[$-409]mmmm d', '"Día" d'].every(isDateFormat)).toBe(true)
    expect(['0.00', '#,##0', '0%', '"$" #,##0', '[Red]0.0', 'General'].some(isDateFormat)).toBe(false)
    expect([0, 25, 26, 27, 701, 702].map(columnLetter)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA'])
  })

  it('formatParts: comillas, escapes y corchetes en una sola pasada (también sin cerrar)', () => {
    expect(formatParts('[Red]"$" #,##0\\ "u"')).toEqual({ bare: ' #,##0', quoted: ['$', ' ', 'u'], brackets: ['Red'] })
    expect(formatParts('0.00"abc')).toEqual({ bare: '0.00', quoted: ['abc'], brackets: [] })
    expect(formatParts('[h:mm')).toEqual({ bare: '', quoted: [], brackets: ['h:mm'] })
  })

  it('cellText con formato: porcentaje, moneda antes o después, decimales fijos', () => {
    expect(cellText(0.126, '0.00%')).toBe('12,60 %')
    expect(cellText(0.5, '0%')).toBe('50 %')
    expect(cellText(1500.5, '"$"\\ #,##0.00')).toBe('$ 1.500,50')
    expect(cellText(-20, '[$US$-409]#,##0')).toBe('-US$ 20')
    expect(cellText(7, '#,##0.00 €')).toBe('7,00 €')
    expect(cellText(1234.567, '#,##0')).toBe('1.235')
    expect(cellText(-3.14159, '0.000')).toBe('-3,142')
    expect(cellText(1234.567, 'General')).toBe('1.234,57')
    expect(cellText(2, '@')).toBe('2')
  })

  it('una hoja ancha sigue en otra página con las columnas que no caben (sin partir palabras)', () => {
    const rows = [Array.from({ length: 6 }, (_, i) => `Columna ${i + 1}`), Array.from({ length: 6 }, (_, i) => String(i))]
    expect(columnGroups(rows, 6, 30)).toEqual([[0, 3], [3, 6]])
    expect(columnGroups(rows, 6, Infinity)).toEqual([[0, 6]])
    // Una columna más ancha que todo igual va sola.
    expect(columnGroups([['x'.repeat(50), 'y']], 2, 10)).toEqual([[0, 1], [1, 2]])
    const { blocks } = fromSheets([{ sheet: 'Ancha', data: rows }, { sheet: 'Otra', data: [['a']] }], 30)
    const tables = blocks.filter((b): b is OTable => b.kind === 'table')
    expect(tables.map((t) => t.title)).toEqual(['Ancha · A–C', 'Ancha · D–F', 'Otra'])
    expect(blocks.map((b) => b.kind)).toEqual(['table', 'pagebreak', 'table', 'pagebreak', 'table'])
    expect(tables[1].rows[0].map((c) => c[0].runs[0].text)).toEqual(['Columna 4', 'Columna 5', 'Columna 6'])
  })
})

/* ───────────── PDF a Word y Excel: tablas ───────────── */

const t = (str: string, x: number, y: number, o: Partial<TextFrag> = {}): TextFrag => ({ page: 0, str, x, y, w: str.length * 5, size: 10, bold: false, italic: false, family: 'sans', ...o })

/** Un extracto: título centrado, encabezados a la izquierda y montos alineados a la derecha. */
function statement(): TextFrag[] {
  const out = [t('Extracto bancario marzo 2026', 200, 60, { size: 16, w: 220 })]
  out.push(t('Fecha', 57, 100, { bold: true }), t('Descripción', 137, 100, { bold: true }), t('Valor', 363, 100, { bold: true }), t('Saldo', 453, 100, { bold: true }))
  for (let i = 1; i <= 20; i++) {
    const y = 100 + i * 18
    const valor = `${(i * 1234.5).toFixed(2)}`
    const saldo = `${(100000 - i * 500).toFixed(2)}`
    out.push(t(`${String(i).padStart(2, '0')}/03/2026`, 57, y), t(`Movimiento número ${i}`, 137, y), t(valor, 441 - valor.length * 5, y), t(saldo, 531 - saldo.length * 5, y))
  }
  return out
}

describe('Tablas con columnas alineadas a la derecha (W-146.7)', () => {
  it('tableColumns y bandOf: los montos y su encabezado en la misma columna', () => {
    const lines = buildLines(statement()).slice(1)
    const bands = tableColumns(lines, 10)
    expect(bands).toHaveLength(4)
    expect(bandOf(bands, { x0: 363, x1: 388 })).toBe(2)
    expect(bandOf(bands, { x0: 0, x1: 5 })).toBe(0)
    expect(tableColumns([], 10)).toEqual([])
  })

  it('un extracto no es una página a dos columnas: sale una sola tabla con el título aparte', () => {
    const page = { width: 595, height: 842 }
    expect(findColumns(buildLines(statement()), page)).toBeNull()
    const doc = buildDocument([page], statement())
    expect(doc.blocks[0]).toMatchObject({ kind: 'para' })
    const table = doc.blocks.find((b): b is Table => b.kind === 'table')!
    const cells = (r: number) => table.rows[r].map((c) => c.map((x) => x.text).join(''))
    expect(cells(0)).toEqual(['Fecha', 'Descripción', 'Valor', 'Saldo'])
    expect(cells(1)).toEqual(['01/03/2026', 'Movimiento número 1', '1234.50', '99500.00'])
    expect(table.rows).toHaveLength(21)
  })

  it('dos columnas angostas de una tabla tampoco son columnas de página', () => {
    const frags: TextFrag[] = []
    for (let i = 0; i < 12; i++) frags.push(t(`Item ${i}`, 60, 100 + i * 16), t(`${i * 3}`, 400, 100 + i * 16))
    expect(findColumns(buildLines(frags), { width: 595, height: 842 })).toBeNull()
  })

  it('PDF a Excel: el encabezado de una columna de montos queda sobre los montos', () => {
    const rows = pageRows(buildLines(statement(), 0.6))
    const header = rows.find((r) => r[0]?.v === 'Fecha')!
    expect(header.map((c) => c.v)).toEqual(['Fecha', 'Descripción', 'Valor', 'Saldo'])
    expect(rows[rows.indexOf(header) + 1].map((c) => c.v)).toEqual(['01/03/2026', 'Movimiento número 1', 1234.5, 99500])
  })
})

/* ───────────── Word a PDF: secciones, encabezados heredados y notas ───────────── */

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
const para = (text: string, extra = '') => `<w:p>${extra}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`

function sectionedDocx(): Uint8Array {
  const first = '<w:sectPr><w:headerReference w:type="default" r:id="rH"/><w:footerReference w:type="default" r:id="rF"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708"/></w:sectPr>'
  const cont = '<w:sectPr><w:type w:val="continuous"/><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>'
  const last = '<w:sectPr><w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/></w:sectPr>'
  const body =
    para('Contrato vertical') +
    `<w:p><w:r><w:t xml:space="preserve">Con nota</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="2"/></w:r><w:r><w:endnoteReference w:id="1"/></w:r><w:r><w:footnoteReference w:id="9"/></w:r></w:p>` +
    `<w:p><w:pPr>${first}</w:pPr></w:p>` +
    para('Sigue sin salto') +
    `<w:p><w:pPr>${cont}</w:pPr></w:p>` +
    para('Anexo horizontal')
  return zipSync({
    'word/document.xml': strToU8(`<w:document ${W}><w:body>${body}${last}</w:body></w:document>`),
    'word/header1.xml': strToU8(`<w:hdr ${W}>${para('ENCABEZADO EMPRESA')}</w:hdr>`),
    'word/footer1.xml': strToU8(`<w:ftr ${W}><w:p><w:r><w:t xml:space="preserve">Página </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`),
    'word/footnotes.xml': strToU8(`<w:footnotes ${W}><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:id="2"><w:p><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> Nota al pie</w:t></w:r></w:p></w:footnote></w:footnotes>`),
    'word/endnotes.xml': strToU8(`<w:endnotes ${W}><w:endnote w:id="1"><w:p><w:r><w:t>Nota final</w:t></w:r></w:p></w:endnote></w:endnotes>`),
    'word/_rels/document.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rH" Type="x/header" Target="header1.xml"/><Relationship Id="rF" Type="x/footer" Target="footer1.xml"/></Relationships>'),
  })
}

async function pdfPages(bytes: Uint8Array): Promise<Array<{ size: number[]; text: string }>> {
  const task = getDocument({ data: bytes.slice() })
  const d = await task.promise
  const out = []
  for (let i = 1; i <= d.numPages; i++) {
    const p = await d.getPage(i)
    const v = p.getViewport({ scale: 1 })
    out.push({ size: [Math.round(v.width), Math.round(v.height)], text: (await p.getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ') })
  }
  await task.destroy()
  return out
}

describe('Word a PDF: secciones y notas (W-146.7)', () => {
  it('cada sección con su página; la última hereda el encabezado y el pie; las notas al final', async () => {
    const doc = readDocx(sectionedDocx())
    expect(doc.pageSize).toEqual([612, 792])
    expect(doc.header).toHaveLength(1)
    const breaks = doc.blocks.flatMap((b) => (b.kind === 'pagebreak' && b.setup ? [b.setup] : []))
    // El salto continuo a una página horizontal también pasa de hoja (como en Word).
    expect(breaks.map((s) => s.pageSize)).toEqual([[612, 792], [792, 612]])
    expect(breaks[1].header).toBe(doc.header)
    const texts = doc.blocks.filter((b): b is OPara => b.kind === 'para').map((p) => p.runs.map((r) => r.text).join(''))
    expect(texts).toContain('Con nota123')
    expect(texts).toContain('1 Nota al pie')
    expect(texts).toContain('2Nota final')

    const pdf = await layoutPdf(doc.blocks, { pageSize: doc.pageSize, margins: doc.margins, header: doc.header, footer: doc.footer, headerDistance: doc.headerDistance, footerDistance: doc.footerDistance })
    const pages = await pdfPages(pdf)
    expect(pages.map((p) => p.size)).toEqual([[612, 792], [612, 792], [792, 612]])
    expect(pages[0].text).toContain('ENCABEZADO EMPRESA')
    expect(pages[0].text).toContain('Página 1')
    expect(pages[1].text).toContain('Sigue sin salto')
    expect(pages[2].text).toContain('Anexo horizontal')
    expect(pages[2].text).toContain('ENCABEZADO EMPRESA')
    expect(pages[2].text).toContain('Página 3')
    expect(pages[2].text).toContain('Nota al pie')
  })

  it('un salto de sección al principio de una hoja no deja una hoja vacía', async () => {
    const setup = { pageSize: [400, 300] as [number, number], margins: { top: 20, right: 20, bottom: 20, left: 20 }, header: [], footer: [], headerDistance: 10, footerDistance: 10 }
    const pdf = await layoutPdf([{ kind: 'pagebreak' }, { kind: 'pagebreak', setup }, { kind: 'para', runs: [{ text: 'Hola' }] }], { pageSize: [200, 200] })
    const doc = await PDFDocument.load(pdf)
    expect(doc.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([[400, 300]])
  })
})
