import { describe, expect, it } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import { cellText, fromSheets, imageSize, type SheetData } from '../../../../../src/features/convert/core/officeModels'
import { writeXlsx } from '../../../../../src/features/convert/core/pdfExcel'
import { encodePng } from '../../../../../src/features/pdf/core/pdfImages'
import type { OTable } from '../../../../../src/features/convert/core/officePdf'

const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))

describe('imageSize', () => {
  it('lee el tamaño de PNG y JPEG', () => {
    expect(imageSize(encodePng(new Uint8Array(3 * 2 * 4).fill(255), 3, 2))).toEqual({ width: 3, height: 2, type: 'png' })
    expect(imageSize(JPG)).toEqual({ width: 1, height: 1, type: 'jpg' })
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull()
    expect(imageSize(new Uint8Array([0xff, 0xd8, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull()
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
