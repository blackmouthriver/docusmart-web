import { describe, expect, it } from 'vitest'
import mammoth from 'mammoth'
import readXlsxFile from 'read-excel-file/node'
import { cellText, fromMammoth, fromSheets, imageSize, type MNode, type SheetData } from './officeModels'
import { writeDocx, type WordDoc } from './pdfWord'
import { writeXlsx } from './pdfExcel'
import { encodePng } from './pdfImages'
import type { OPara, OTable } from './officePdf'

const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))

/** Árbol de mammoth de un .docx (para probar con documentos reales). */
async function tree(docx: Uint8Array): Promise<MNode> {
  let doc: MNode = { type: 'document' }
  await mammoth.convertToHtml({ buffer: Buffer.from(docx) }, { transformDocument: (d: MNode) => (doc = d) } as never)
  return doc
}

describe('imageSize', () => {
  it('lee el tamaño de PNG y JPEG', () => {
    expect(imageSize(encodePng(new Uint8Array(3 * 2 * 4).fill(255), 3, 2))).toEqual({ width: 3, height: 2, type: 'png' })
    expect(imageSize(JPG)).toEqual({ width: 1, height: 1, type: 'jpg' })
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull()
    expect(imageSize(new Uint8Array([0xff, 0xd8, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull()
  })
})

describe('fromMammoth (con un .docx real)', () => {
  it('títulos, formato, listas, tablas, imágenes y saltos de página', async () => {
    const png = encodePng(new Uint8Array(4 * 4 * 4).fill(200), 4, 4)
    const run = (text: string, o = {}) => ({ text, bold: false, italic: false, size: 11, family: 'sans' as const, ...o })
    const word: WordDoc = {
      page: { width: 595, height: 842 },
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      bodySize: 11,
      bodyFamily: 'sans',
      bodyFont: 'Arial',
      blocks: [
        { kind: 'para', runs: [run('Informe')], align: 'center', heading: 1, bullet: false, indent: 0 },
        { kind: 'para', runs: [run('Hola '), run('mundo', { bold: true }), run(' feliz', { italic: true })], align: 'left', heading: 0, bullet: false, indent: 0 },
        { kind: 'para', runs: [run('Punto uno')], align: 'left', heading: 0, bullet: true, indent: 0 },
        { kind: 'para', runs: [run('Punto dos')], align: 'left', heading: 0, bullet: true, indent: 0 },
        { kind: 'image', img: { page: 0, x: 0, y: 0, w: 40, h: 40, png }, align: 'center' },
        { kind: 'table', rows: [[[run('A', { bold: true })], [run('B', { bold: true })]], [[run('1')], [run('2')]]], widths: [100, 100] },
        { kind: 'pagebreak' },
        { kind: 'para', runs: [run('Anexo')], align: 'right', heading: 2, bullet: false, indent: 0 },
      ],
    }
    const { blocks, skippedImages } = await fromMammoth(await tree(writeDocx(word)))
    expect(skippedImages).toBe(0)
    const kinds = blocks.map((b) => b.kind)
    expect(kinds).toEqual(['para', 'para', 'para', 'para', 'image', 'table', 'pagebreak', 'para'])
    const [title, body, li1, li2] = blocks as OPara[]
    expect(title).toMatchObject({ style: 'h1', align: 'center' })
    expect(body.runs).toEqual([{ text: 'Hola ' }, { text: 'mundo', bold: true }, { text: ' feliz', italic: true }].map((r) => ({ bold: undefined, italic: undefined, underline: undefined, size: undefined, ...r })))
    expect(li1.list).toEqual({ ordered: false, level: 0, index: 1 })
    expect(li2.list?.index).toBe(2)
    expect(blocks[4]).toMatchObject({ kind: 'image', type: 'png', width: 4, height: 4, align: 'center' })
    const t = blocks[5] as OTable
    expect(t.header).toBe(true)
    expect(t.rows.map((r) => r.map((c) => c.map((p) => p.runs.map((x) => x.text).join('')).join('')))).toEqual([['A', 'B'], ['1', '2']])
    expect(blocks[7]).toMatchObject({ style: 'h2', align: 'right' })
  })

  it('nodos sueltos: saltos de línea, tabulaciones, imágenes ilegibles y estilos en español', async () => {
    const doc: MNode = {
      type: 'document',
      children: [
        { type: 'paragraph', styleName: 'Título', children: [{ type: 'run', children: [{ type: 'text', value: 'Portada' }] }] },
        { type: 'paragraph', styleId: 'Heading4', children: [{ type: 'run', isUnderline: true, fontSize: 9, children: [{ type: 'text', value: 'a' }, { type: 'tab' }, { type: 'break', breakType: 'line' }, { type: 'text', value: 'b' }] }] },
        { type: 'paragraph', children: [{ type: 'run', children: [{ type: 'image', read: async () => btoa('xy') }, { type: 'image', read: async () => Promise.reject(new Error('x')) }] }] },
        { type: 'paragraph', numbering: { isOrdered: true, level: '1' }, children: [{ type: 'hyperlink', children: [{ type: 'run', children: [{ type: 'text', value: 'enlace' }] }] }] },
        { type: 'paragraph', children: [{ type: 'run', children: [{ type: 'text', value: '   ' }] }] },
      ],
    }
    const { blocks, skippedImages } = await fromMammoth(doc)
    expect(skippedImages).toBe(2)
    expect(blocks.map((b) => (b.kind === 'para' ? `${b.style}:${b.runs.map((r) => r.text).join('')}` : b.kind))).toEqual(['title:Portada', 'h3:a\t\nb', 'normal:enlace'])
    expect((blocks[1] as OPara).runs[0]).toMatchObject({ underline: true, size: 9 })
    expect((blocks[2] as OPara).list).toEqual({ ordered: true, level: 1, index: 1 })
  })
})

describe('Excel', () => {
  it('formatea celdas', () => {
    expect(cellText(1234567.891)).toBe('1.234.567,89')
    expect(cellText(new Date(Date.UTC(2026, 10, 16)))).toBe('16/11/2026')
    expect([cellText(true), cellText(false), cellText(null), cellText('x')]).toEqual(['Sí', 'No', '', 'x'])
  })

  it('una tabla por hoja desde un .xlsx real, sin filas ni columnas vacías al final', async () => {
    const xlsx = writeXlsx([
      { name: 'Ventas', rows: [[{ v: 'Producto' }, { v: 'Total' }], [{ v: 'Cuadernos' }, { v: 1200000 }], [], []] },
      { name: 'Vacía', rows: [] },
      { name: 'Notas', rows: [[{ v: 'Ok' }]] },
    ])
    // read-excel-file 9 devuelve todas las hojas como [{ sheet, data }]
    const all = (await readXlsxFile(Buffer.from(xlsx))) as unknown as SheetData[]
    expect(all.map((s) => s.sheet)).toEqual(['Ventas', 'Vacía', 'Notas'])
    const { blocks, maxColumns } = fromSheets(all)
    expect(maxColumns).toBe(2)
    expect(blocks.map((b) => b.kind)).toEqual(['table', 'pagebreak', 'table'])
    const t = blocks[0] as OTable
    expect(t.title).toBe('Ventas')
    expect(t.rows.map((r) => r.map((c) => c[0].runs[0].text))).toEqual([['Producto', 'Total'], ['Cuadernos', '1.200.000']])
    expect(t.rows[0][0][0].runs[0].bold).toBe(true)
    expect(t.rows[1][1][0].align).toBe('right')
  })
})
