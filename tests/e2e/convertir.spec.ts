// Convertir tras la auditoría W-146.7: CSV de Excel en español, Imagen a PDF con tamaño y márgenes,
// Excel con formato y hojas ocultas, Word con secciones y notas, tablas de PDF a Excel, TIFF de
// varias páginas y SVG sin xmlns.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test } from './helpers'

async function convert(page: Page, files: Array<{ name: string; mimeType: string; buffer: Buffer }>, before?: () => Promise<void>) {
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles(files)
  await before?.()
  await tool.getByRole('button', { name: 'Convertir', exact: true }).click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

async function pdfPages(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: Array<{ size: number[]; text: string }> = []
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i)
    const v = p.getViewport({ scale: 1 })
    out.push({ size: [Math.round(v.width), Math.round(v.height)], text: (await p.getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ') })
  }
  await task.destroy()
  return out
}

test('CSV guardado por Excel en español (Windows-1252): las tildes llegan bien', async ({ page }) => {
  await page.goto('/csv-a-excel')
  const csv = 'Nombre;Ciudad;Código\r\nJosé Pérez;Bogotá;007\r\nÑandú;Medellín;010\r\n'
  const out = await convert(page, [{ name: 'clientes.csv', mimeType: 'text/csv', buffer: Buffer.from([...csv].map((c) => c.charCodeAt(0))) }])
  const files = unzipSync(out.bytes)
  const all = strFromU8(files['xl/worksheets/sheet1.xml']) + (files['xl/sharedStrings.xml'] ? strFromU8(files['xl/sharedStrings.xml']) : '')
  for (const s of ['José Pérez', 'Bogotá', 'Código', 'Ñandú', 'Medellín']) expect(all).toContain(s)
  expect(all).not.toContain('�')
})

test('Imagen a PDF: A4, horizontal según la foto y con márgenes @movil', async ({ page }) => {
  await page.goto('/imagen-a-pdf')
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(1200, 800)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#2a6'
    ctx.fillRect(0, 0, 1200, 800)
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  })
  const tool = page.locator('#tool')
  const out = await convert(page, [{ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') }], async () => {
    await tool.getByRole('group', { name: 'Tamaño de página' }).getByRole('button', { name: 'A4' }).click()
    await expect(tool.getByRole('group', { name: 'Orientación' }).getByRole('button', { name: 'Automática' })).toHaveAttribute('aria-pressed', 'true')
    await tool.getByRole('group', { name: 'Márgenes' }).getByRole('button', { name: 'Grande' }).click()
  })
  const pdf = await PDFDocument.load(out.bytes)
  const [p] = pdf.getPages()
  expect([Math.round(p.getWidth()), Math.round(p.getHeight())]).toEqual([842, 595])
  // "Como la foto" quita la opción de orientación.
  await tool.getByRole('group', { name: 'Tamaño de página' }).getByRole('button', { name: 'Como la foto' }).click()
  await expect(tool.getByRole('group', { name: 'Orientación' })).toHaveCount(0)
})

const XNS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
function book(): Buffer {
  return Buffer.from(
    zipSync({
      'xl/workbook.xml': strToU8(`<workbook ${XNS}><sheets><sheet name="Ventas" sheetId="1" r:id="rId1"/><sheet name="Oculta" sheetId="2" r:id="rId2" state="hidden"/></sheets></workbook>`),
      'xl/_rels/workbook.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>'),
      'xl/styles.xml': strToU8(`<styleSheet ${XNS}><numFmts><numFmt numFmtId="164" formatCode="&quot;$&quot; #,##0"/></numFmts><cellXfs><xf/><xf numFmtId="10"/><xf numFmtId="164"/></cellXfs></styleSheet>`),
      'xl/worksheets/sheet1.xml': strToU8(`<worksheet ${XNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Producto</t></is></c><c r="B1" t="inlineStr"><is><t>Precio</t></is></c><c r="C1" t="inlineStr"><is><t>Margen</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Cuaderno</t></is></c><c r="B3" s="2"><v>12500</v></c><c r="C3" s="1"><v>0.126</v></c></row></sheetData></worksheet>`),
      'xl/worksheets/sheet2.xml': strToU8(`<worksheet ${XNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>SALARIOS CONFIDENCIALES</t></is></c></row></sheetData></worksheet>`),
    }),
  )
}
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

test('Excel a PDF: porcentaje y moneda con formato, y sin la hoja oculta', async ({ page }) => {
  await page.goto('/excel-a-pdf')
  const out = await convert(page, [{ name: 'ventas.xlsx', mimeType: XLSX, buffer: book() }])
  const text = (await pdfPages(out.bytes)).map((p) => p.text).join(' ')
  expect(text).toContain('12,60 %')
  expect(text).toContain('$ 12.500')
  expect(text).not.toContain('SALARIOS')
})

test('Excel a CSV: la hoja oculta no se exporta', async ({ page }) => {
  await page.goto('/excel-a-csv')
  const out = await convert(page, [{ name: 'ventas.xlsx', mimeType: XLSX, buffer: book() }])
  expect(out.name).toBe('ventas.csv')
  const text = Buffer.from(out.bytes).toString('utf8')
  expect(text).toContain('Cuaderno;12500;0,126')
  expect(text).not.toContain('SALARIOS')
})

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
const para = (t: string) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`

test('Word a PDF: cada sección con su tamaño, el encabezado y el pie en todas, y la nota al pie', async ({ page }) => {
  await page.goto('/word-a-pdf')
  const first = '<w:sectPr><w:headerReference w:type="default" r:id="rH"/><w:footerReference w:type="default" r:id="rF"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708"/></w:sectPr>'
  const body = `${para('Contrato de servicios')}<w:p><w:r><w:t>Cláusula con nota</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="1"/></w:r></w:p><w:p><w:pPr>${first}</w:pPr></w:p>${para('Anexo horizontal')}<w:sectPr><w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/></w:sectPr>`
  const docx = zipSync({
    'word/document.xml': strToU8(`<w:document ${W}><w:body>${body}</w:body></w:document>`),
    'word/header1.xml': strToU8(`<w:hdr ${W}>${para('EMPRESA SAS')}</w:hdr>`),
    'word/footer1.xml': strToU8(`<w:ftr ${W}><w:p><w:r><w:t xml:space="preserve">Página </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`),
    'word/footnotes.xml': strToU8(`<w:footnotes ${W}><w:footnote w:id="1"><w:p><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> Según la ley 1581</w:t></w:r></w:p></w:footnote></w:footnotes>`),
    'word/_rels/document.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rH" Type="x/header" Target="header1.xml"/><Relationship Id="rF" Type="x/footer" Target="footer1.xml"/></Relationships>'),
  })
  const out = await convert(page, [{ name: 'contrato.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(docx) }])
  const pages = await pdfPages(out.bytes)
  expect(pages.map((p) => p.size)).toEqual([[612, 792], [792, 612]])
  for (const [i, p] of pages.entries()) {
    expect(p.text).toContain('EMPRESA SAS')
    expect(p.text).toContain(`Página ${i + 1}`)
  }
  expect(pages[1].text).toContain('Según la ley 1581')
})

test('PDF a Excel: un extracto con montos alineados a la derecha deja cada encabezado sobre su columna', async ({ page }) => {
  await page.goto('/pdf-a-excel')
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const p = doc.addPage([595, 842])
  const top = (y: number) => 842 - y
  p.drawText('Extracto bancario marzo 2026', { x: 180, y: top(60), size: 16, font: bold })
  ;[['Fecha', 57], ['Descripción', 137], ['Valor', 363], ['Saldo', 453]].forEach(([t, x]) => p.drawText(String(t), { x: Number(x), y: top(100), size: 10, font: bold }))
  for (let i = 1; i <= 15; i++) {
    const y = top(100 + i * 18)
    const valor = (i * 1234.5).toLocaleString('es-CO', { minimumFractionDigits: 2 })
    const saldo = (100000 - i * 500).toLocaleString('es-CO', { minimumFractionDigits: 2 })
    p.drawText(`${String(i).padStart(2, '0')}/03/2026`, { x: 57, y, size: 10, font })
    p.drawText(`Movimiento número ${i}`, { x: 137, y, size: 10, font })
    p.drawText(valor, { x: 441 - font.widthOfTextAtSize(valor, 10), y, size: 10, font })
    p.drawText(saldo, { x: 531 - font.widthOfTextAtSize(saldo, 10), y, size: 10, font })
  }
  const out = await convert(page, [{ name: 'extracto.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }])
  const files = unzipSync(out.bytes)
  const shared = files['xl/sharedStrings.xml'] ? [...strFromU8(files['xl/sharedStrings.xml']).matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]) : []
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])
  const cell = (ref: string) => {
    const m = new RegExp(`<c r="${ref}"([^>]*)>(.*?)</c>`).exec(sheet)
    if (!m) return ''
    const v = /<v>([^<]*)<\/v>/.exec(m[2])?.[1] ?? /<t[^>]*>([^<]*)<\/t>/.exec(m[2])?.[1] ?? ''
    return m[1].includes('t="s"') ? shared[Number(v)] : v
  }
  const headerRow = [...sheet.matchAll(/<c r="A(\d+)"/g)].map((m) => m[1]).find((r) => cell(`A${r}`) === 'Fecha')!
  expect(['A', 'B', 'C', 'D'].map((c) => cell(`${c}${headerRow}`))).toEqual(['Fecha', 'Descripción', 'Valor', 'Saldo'])
  const next = Number(headerRow) + 1
  expect(['A', 'B', 'C', 'D'].map((c) => cell(`${c}${next}`))).toEqual(['01/03/2026', 'Movimiento número 1', '1234.5', '99500'])
})

/** TIFF sin compresión, RGB, con una página por color (varias IFD encadenadas). */
function multiTiff(width: number, height: number, colors: Array<[number, number, number]>): Buffer {
  const pixels = width * height * 3
  const ifdSize = 2 + 9 * 12 + 4
  const pageSize = ifdSize + 6 + pixels
  const out = Buffer.alloc(8 + colors.length * pageSize)
  out.write('II', 0, 'latin1')
  out.writeUInt16LE(42, 2)
  out.writeUInt32LE(8, 4)
  colors.forEach(([r, g, b], i) => {
    const at = 8 + i * pageSize
    const bps = at + ifdSize
    const data = bps + 6
    const tags: Array<[number, number, number, number]> = [
      [256, 3, 1, width], [257, 3, 1, height], [258, 3, 3, bps], [259, 3, 1, 1], [262, 3, 1, 2],
      [273, 4, 1, data], [277, 3, 1, 3], [278, 3, 1, height], [279, 4, 1, pixels],
    ]
    out.writeUInt16LE(tags.length, at)
    tags.forEach(([tag, type, count, value], k) => {
      const e = at + 2 + k * 12
      out.writeUInt16LE(tag, e)
      out.writeUInt16LE(type, e + 2)
      out.writeUInt32LE(count, e + 4)
      if (type === 3 && count === 1) out.writeUInt16LE(value, e + 8)
      else out.writeUInt32LE(value, e + 8)
    })
    out.writeUInt32LE(i < colors.length - 1 ? at + pageSize : 0, at + 2 + tags.length * 12)
    for (let k = 0; k < 3; k++) out.writeUInt16LE(8, bps + k * 2)
    for (let px = 0; px < width * height; px++) out.set([r, g, b], data + px * 3)
  })
  return out
}

test('TIFF de varias páginas a JPG: una imagen por página', async ({ page }) => {
  await page.goto('/tiff-a-jpg')
  const out = await convert(page, [{ name: 'fax.tif', mimeType: 'image/tiff', buffer: multiTiff(30, 20, [[200, 0, 0], [0, 200, 0], [0, 0, 200]]) }])
  expect(out.name.endsWith('.zip')).toBe(true)
  expect(Object.keys(unzipSync(out.bytes)).sort()).toEqual(['fax-pagina-1.jpg', 'fax-pagina-2.jpg', 'fax-pagina-3.jpg'])
})

test('SVG sin xmlns a PNG @movil', async ({ page }) => {
  await page.goto('/svg-a-png')
  const out = await convert(page, [{ name: 'icono.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg width="40" height="20"><rect width="40" height="20" fill="#7c3aed"/></svg>') }])
  expect(out.name).toBe('icono.png')
  const px = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob())
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    return [bmp.width, bmp.height, ...ctx.getImageData(bmp.width / 2, bmp.height / 2, 1, 1).data]
  }, Buffer.from(out.bytes).toString('base64'))
  expect(px.slice(0, 2)).toEqual([1024, 512])
  expect(px[2]).toBe(124)
  expect(px[5]).toBe(255)
})
