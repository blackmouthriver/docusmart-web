import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { buildSheets, pageRows, parseNumber, summarizeSheets, writeXlsx } from './pdfExcel'
import { buildLines, type TextFrag } from './pdfWord'

const t = (str: string, x: number, y: number, o: Partial<TextFrag> = {}): TextFrag => ({
  page: 0,
  str,
  x,
  y,
  w: str.length * 5.5,
  size: 11,
  bold: false,
  italic: false,
  family: 'sans',
  ...o,
})

describe('parseNumber', () => {
  it.each([
    ['120', 120, 'integer'],
    ['1.500.000', 1500000, 'integer'],
    ['1,500,000', 1500000, 'integer'],
    ['1.234,56', 1234.56, 'decimal'],
    ['1,234.56', 1234.56, 'decimal'],
    ['3,5', 3.5, 'decimal'],
    ['0.75', 0.75, 'decimal'],
    ['$2.000.000', 2000000, 'currency'],
    ['$ 1.250,50', 1250.5, 'currency2'],
    ['COP 900', 900, 'currency'],
    ['45%', 0.45, 'percent'],
    ['-12', -12, 'integer'],
    ['(300)', -300, 'integer'],
    ['− 4,25', -4.25, 'decimal'],
  ])('%s → %s', (raw, value, fmt) => {
    expect(parseNumber(raw)).toEqual({ value, fmt })
  })

  it.each(['', 'Producto', '12/05/2026', '1.2.3', '300 123 4567x', 'abc123', '12.', '1.23.456', 'x'.repeat(40)])('no es número: %s', (raw) => {
    expect(parseNumber(raw)).toBeNull()
  })
})

describe('pageRows', () => {
  const frags = [
    t('Reporte de ventas', 72, 80, { size: 16, bold: true }),
    t('Producto', 72, 130, { bold: true }),
    t('Unidades', 250, 130, { bold: true }),
    t('Total', 400, 130, { bold: true }),
    t('Cuadernos', 72, 144),
    t('120', 250, 144),
    t('$1.200.000', 400, 144),
    t('Lápices', 72, 158),
    t('$450.000', 400, 158),
  ]

  it('arma filas con columnas alineadas, números reales y una fila vacía entre bloques', () => {
    const rows = pageRows(buildLines(frags))
    expect(rows[0]).toEqual([{ v: 'Reporte de ventas', bold: true }])
    expect(rows[1]).toEqual([])
    expect(rows[2].map((c) => c.v)).toEqual(['Producto', 'Unidades', 'Total'])
    expect(rows[2][0].bold).toBe(true)
    expect(rows[3]).toEqual([
      { v: 'Cuadernos', bold: false },
      { v: 120, fmt: 'integer', bold: false },
      { v: 1200000, fmt: 'currency', bold: false },
    ])
    // Celda vacía donde falta un dato
    expect(rows[4].map((c) => c.v)).toEqual(['Lápices', '', 450000])
  })

  it('estilo extracto de Word: filas altas sin filas vacías, celdas en dos líneas y columnas juntas', () => {
    const texts = [
      t('Fecha', 72, 100, { bold: true }), t('Descripción', 150, 100, { bold: true }), t('Débito', 300, 100, { bold: true }),
      t('01/11/2026', 72, 125), t('Transferencia', 150, 125), t('$ 250.000', 300, 125),
      t('recibida', 150, 138),
      t('05/11/2026', 72, 163), t('Servicios públicos del mes', 150, 163), t('$ 212.300', 300, 163),
    ]
    const [sheet] = buildSheets([{ width: 595, height: 842 }], texts)
    expect(sheet.rows.map((r) => r.map((c) => c.v))).toEqual([
      ['Fecha', 'Descripción', 'Débito'],
      ['01/11/2026', 'Transferencia recibida', 250000],
      // La descripción termina a 7 pt de la columna siguiente: igual se separan.
      ['05/11/2026', 'Servicios públicos del mes', 212300],
    ])
  })

  it('sin columnas, cada línea va en la columna A', () => {
    const rows = pageRows(buildLines([t('Hola', 72, 100), t('mundo', 72, 114)]))
    expect(rows).toEqual([[{ v: 'Hola', bold: false }], [{ v: 'mundo', bold: false }]])
  })

  it('dos bloques que caen en la misma columna se unen', () => {
    const lines = buildLines([t('A', 72, 100), t('B', 300, 100), t('C', 72, 114), t('D', 300, 114), t('x', 72, 128), t('y', 100, 128), t('z', 300, 128)])
    const rows = pageRows(lines)
    expect(rows[2].map((c) => c.v)).toEqual(['x y', 'z'])
  })
})

describe('buildSheets', () => {
  const pages = [
    { width: 595, height: 842 },
    { width: 595, height: 842 },
  ]
  const texts = [t('Uno', 72, 100), t('Dos', 72, 100, { page: 1 })]

  it('una hoja por página o todo en una', () => {
    expect(buildSheets(pages, texts).map((s) => s.name)).toEqual(['Página 1', 'Página 2'])
    const [single] = buildSheets(pages, texts, 'single')
    expect(single.rows.map((r) => r[0]?.v)).toEqual(['Uno', undefined, 'Dos'])
    expect(buildSheets([pages[0]], [texts[0]])[0].name).toBe('Hoja 1')
  })
})

describe('writeXlsx', () => {
  const sheets = [
    {
      name: 'Ventas [2026]',
      rows: [
        [{ v: 'Producto & total', bold: true }],
        [],
        [{ v: 'Cuadernos' }, { v: 1200000, fmt: 'currency' as const, bold: true }, { v: 0.45, fmt: 'percent' as const }],
        Array.from({ length: 28 }, (_, i) => ({ v: i })),
      ],
    },
    { name: 'Otra', rows: [] },
  ]
  const files = unzipSync(writeXlsx(sheets))
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])

  it('arma el paquete con libro, estilos y una hoja por cada una', () => {
    expect(Object.keys(files).sort()).toEqual(
      ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'].sort(),
    )
    expect(strFromU8(files['xl/workbook.xml'])).toContain('<sheet name="Ventas [2026]" sheetId="1" r:id="rId1"/>')
  })

  it('texto como celda en línea, números como números con su formato y estilo', () => {
    expect(sheet).toContain('<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Producto &amp; total</t></is></c>')
    expect(sheet).toContain('<row r="2"></row>')
    expect(sheet).toContain('<c r="B3" s="9"><v>1200000</v></c>') // moneda en negrita
    expect(sheet).toContain('<c r="C3" s="6"><v>0.45</v></c>') // porcentaje
    expect(sheet).toContain('<c r="AB4"') // columnas después de la Z
    expect(sheet).toMatch(/<cols><col min="1" max="1" width="\d+" customWidth="1"\/>/)
    expect(strFromU8(files['xl/styles.xml'])).toContain('formatCode="&quot;$&quot;#,##0"')
  })

  it('el ancho de columna cuenta el formato (moneda, miles, decimales)', () => {
    const xml = strFromU8(unzipSync(writeXlsx([{ name: 'A', rows: [[{ v: 385420.5, fmt: 'currency2' }], [{ v: -0.5, fmt: 'percent' }]] }]))['xl/worksheets/sheet1.xml'])
    // $385.420,50 = 11 caracteres + 2 de margen
    expect(xml).toContain('width="13"')
  })

  it('resume hojas, filas y números', () => {
    expect(summarizeSheets(sheets)).toEqual({ sheets: 2, rows: 4, numbers: 30 })
  })
})
