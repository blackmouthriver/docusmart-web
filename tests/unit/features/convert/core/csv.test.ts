import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { csvToSheet, defaultCsvOptions, detectDelimiter, parseCsv, sheetName, toCsv } from '../../../../../src/features/convert/core/csv'
import { writeXlsx } from '../../../../../src/features/convert/core/pdfExcel'

describe('detectDelimiter', () => {
  it('reconoce coma, punto y coma, tabulación y barra', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
    expect(detectDelimiter('nombre;valor\n"Pérez, Ana";1,5\nLuis;2')).toBe(';')
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t')
    expect(detectDelimiter('a|b|c\n1|2|3')).toBe('|')
    expect(detectDelimiter('una sola columna\nsin separador')).toBe(',')
  })
})

describe('parseCsv', () => {
  it('comillas, comillas dobles, saltos dentro de campos, CRLF y BOM', () => {
    const text = '﻿nombre,nota\r\n"Pérez, Ana","dijo ""hola"""\r\n"Luis","línea 1\nlínea 2"\r\n,\r\n\r\n'
    expect(parseCsv(text, ',')).toEqual([
      ['nombre', 'nota'],
      ['Pérez, Ana', 'dijo "hola"'],
      ['Luis', 'línea 1\nlínea 2'],
    ])
  })
  it('detecta el separador solo y acepta la última línea sin salto', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('a,b\rc,d', ',')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('csvToSheet', () => {
  it('números como números, pero no cédulas, teléfonos ni códigos largos', () => {
    const s = csvToSheet(
      [
        ['Nombre', 'Cédula', 'Teléfono', 'Total', 'Código', 'Porcentaje'],
        ['Ana', '0012345', '300 123 4567', '1.500.000', '1234567890123456789', '45%'],
        ['Luis', '79876543', '3001234567', '2,5', 'ABC', '-0,5'],
      ],
      'datos',
    )
    expect(s.rows[0][0]).toEqual({ v: 'Nombre', bold: true })
    const [, ana, luis] = s.rows
    expect(ana[1].v).toBe('0012345')
    expect(ana[2].v).toBe('300 123 4567')
    expect(ana[3]).toEqual({ v: 1500000, fmt: 'integer' })
    expect(ana[4].v).toBe('1234567890123456789')
    expect(ana[5]).toEqual({ v: 0.45, fmt: 'percent' })
    expect(luis[1].v).toBe(79876543)
    expect(luis[3]).toEqual({ v: 2.5, fmt: 'decimal' })
    expect(luis[5].v).toBe(-0.5)
  })
  it('sin encabezado si la primera fila tiene números', () => {
    const s = csvToSheet([['1', '2'], ['3', '4']], 'x')
    expect(s.rows[0][0]).toEqual({ v: 1, fmt: 'integer' })
  })
  it('el Excel resultante tiene los datos', () => {
    const xlsx = writeXlsx([csvToSheet([['a', 'b'], ['x', '7']], 'hoja/rara:[1]')])
    const files = unzipSync(xlsx)
    expect(strFromU8(files['xl/workbook.xml'])).toContain('name="hoja rara  1"')
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toContain('<v>7</v>')
  })
  it('nombres de hoja válidos', () => {
    expect(sheetName('a'.repeat(40))).toHaveLength(31)
    expect(sheetName('???')).toBe('Hoja1')
  })
})

describe('toCsv', () => {
  it('cita lo que hace falta, formatea fechas y números y quita lo vacío del final', () => {
    const csv = toCsv(
      [
        ['Nombre', 'Monto', 'Fecha', 'Activo', null],
        ['Pérez; Ana', 1234.5, new Date(Date.UTC(2024, 0, 2)), true, ''],
        ['Dijo "hola"', 3, new Date(Date.UTC(2024, 0, 2, 9, 5)), false, undefined],
        [null, '', undefined],
      ],
      { delimiter: ';', decimalComma: true },
    )
    expect(csv).toBe('﻿Nombre;Monto;Fecha;Activo\r\n"Pérez; Ana";1234,5;2024-01-02;TRUE\r\n"Dijo ""hola""";3;2024-01-02 09:05;FALSE\r\n')
  })
  it('con coma y punto decimal; espacios al borde entre comillas', () => {
    expect(toCsv([[' a', 0.1 + 0.2, 'b,c']], { delimiter: ',', decimalComma: false })).toBe('﻿" a",0.3,"b,c"\r\n')
    expect(toCsv([], { delimiter: ',', decimalComma: false })).toBe('﻿\r\n')
  })
  it('separador según el idioma', () => {
    expect(defaultCsvOptions('es')).toEqual({ delimiter: ';', decimalComma: true })
    expect(defaultCsvOptions('en')).toEqual({ delimiter: ',', decimalComma: false })
  })
  it('ida y vuelta', () => {
    const rows = [['a', 'b;c', 'x\ny'], ['1', '2', '3']]
    expect(parseCsv(toCsv(rows, { delimiter: ';', decimalComma: true }))).toEqual(rows)
  })
})
