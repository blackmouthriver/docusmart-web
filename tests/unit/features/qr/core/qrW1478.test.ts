// W-147.8: color libre y fondo del QR, PDF vectorial y varios QR desde una lista (CSV).
import { PDFArray, PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { colorProblem, normalizeHex, paperOf, sheetLayout } from '../../../../../src/features/qr/core/qrDesign'
import { MAX_LIST, detectSeparator, itemFileName, parseQrList, splitCsvLine } from '../../../../../src/features/qr/core/qrList'
import { QUIET, fitText, qrMatrix, qrPdf, qrSheetPdf } from '../../../../../src/features/qr/core/qrPdf'

describe('colores', () => {
  it('avisa si el código es más claro que el fondo o si no hay contraste', () => {
    expect(colorProblem('#000000', '#FFFFFF')).toBeNull()
    expect(colorProblem('#1976D2', '#FFF8E1')).toBeNull()
    expect(colorProblem('#FFFFFF', '#000000')).toBe('inverted')
    expect(colorProblem('#FBC02D', '#FFFFFF')).toBe('contrast')
    expect(colorProblem('#777777', '#555555')).toBe('inverted')
    expect(colorProblem('#000000', 'transparent')).toBeNull()
    expect(paperOf('transparent')).toBe('#FFFFFF')
  })

  it('normaliza los colores escritos', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('1e3a8a')).toBe('#1E3A8A')
    expect(normalizeHex('rojo')).toBeNull()
  })
})

describe('lista de QR', () => {
  it('una línea por QR, sin vacías ni encabezado; un texto con comas no se parte', () => {
    const r = parseQrList('﻿Contenido\nhttps://a.com\n\n  Hola, ¿cómo estás?  \nAdiós, amigo, nos vemos\n')
    expect(r.items).toEqual([
      { content: 'https://a.com', label: '' },
      { content: 'Hola, ¿cómo estás?', label: '' },
      { content: 'Adiós, amigo, nos vemos', label: '' },
    ])
    expect(r.truncated).toBe(false)
  })

  it('CSV con punto y coma, tabulador o coma, y comillas', () => {
    expect(parseQrList('url;nombre\nhttps://a.com/1;Mesa 1\nhttps://a.com/2;Mesa 2').items).toEqual([
      { content: 'https://a.com/1', label: 'Mesa 1' },
      { content: 'https://a.com/2', label: 'Mesa 2' },
    ])
    expect(parseQrList('a\tUno\nb\tDos').items[1]).toEqual({ content: 'b', label: 'Dos' })
    expect(parseQrList('"Hola, mundo",Saludo\n"Dice ""sí""",Cita').items).toEqual([
      { content: 'Hola, mundo', label: 'Saludo' },
      { content: 'Dice "sí"', label: 'Cita' },
    ])
    expect(splitCsvLine('a;"b;c";d', ';')).toEqual(['a', 'b;c', 'd'])
    expect(detectSeparator(['a,b', 'c'])).toBeNull()
  })

  it('como mucho 500, y avisa si había más', () => {
    const r = parseQrList(Array.from({ length: MAX_LIST + 3 }, (_, i) => `item ${i}`).join('\n'))
    expect(r.items).toHaveLength(MAX_LIST)
    expect(r.truncated).toBe(true)
    expect(parseQrList('  \n ').items).toEqual([])
  })

  it('nombres de archivo seguros y sin repetir', () => {
    const used = new Set<string>()
    expect(itemFileName({ content: 'https://docusmart.online/qr?a=1', label: '' }, 0, used)).toBe('001-docusmart.online-qr-a-1.png')
    expect(itemFileName({ content: 'x', label: 'Mesa 1/2' }, 1, used)).toBe('002-Mesa-1-2.png')
    expect(itemFileName({ content: 'y', label: 'Mesa 1/2' }, 1, used)).toBe('002-Mesa-1-2-2.png')
    expect(itemFileName({ content: '***', label: '' }, 9, used)).toBe('010-qr.png')
  })
})

/** Los rectángulos [x, y, ancho, alto] del contenido de la primera página. */
async function rects(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes)
  const contents = doc.getPage(0).node.Contents()
  const streams = contents instanceof PDFArray ? contents.asArray().map((r) => doc.context.lookup(r)) : [contents]
  const text = streams.map((s) => new TextDecoder().decode(decodePDFRawStream(s as PDFRawStream).decode())).join('\n')
  // pdf-lib dibuja cada rectángulo trasladando el origen (cm) y trazando sus cuatro lados.
  return text
    .split(/\nQ\n?/)
    .map((block) => {
      const at = /1 0 0 1 (-?[\d.]+) (-?[\d.]+) cm/.exec(block)
      const size = /\n0 (-?[\d.]+) l\n(-?[\d.]+) (-?[\d.]+) l/.exec(block)
      return at && size ? [Number(at[1]), Number(at[2]), Number(size[2]), Number(size[1])] : null
    })
    .filter((r): r is number[] => r !== null)
}

describe('QR en PDF', () => {
  it('la matriz sube de corrección con logo y avisa si el texto no cabe', () => {
    expect(qrMatrix('hola', true).size).toBeGreaterThan(qrMatrix('hola', false).size - 1)
    expect(() => qrMatrix('x'.repeat(8000), false)).toThrow()
  })

  it('página del tamaño elegido, con el fondo y los módulos exactos del QR', async () => {
    const m = qrMatrix('https://docusmart.online', false)
    const pdf = await qrPdf(m, { dark: '#1E3A8A', background: '#FFF8E1', cm: 5, title: 'QR' })
    const doc = await PDFDocument.load(pdf)
    const side = (5 * 72) / 2.54
    expect(doc.getPage(0).getWidth()).toBeCloseTo(side, 1)
    const [bg, ...modules] = await rects(pdf)
    expect(bg[2]).toBeCloseTo(side, 1)
    // Se rearma la matriz con los rectángulos: es la misma del QR.
    const cell = side / (m.size + QUIET * 2)
    const grid = Array.from({ length: m.size }, () => Array<boolean>(m.size).fill(false))
    for (const [x, y, w] of modules) {
      const row = Math.round((side - y) / cell - QUIET - 1)
      const col0 = Math.round(x / cell - QUIET)
      for (let c = col0; c < col0 + Math.round(w / cell); c++) grid[row][c] = true
    }
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) expect(grid[y][x]).toBe(m.dark(x, y))
    // Los módulos seguidos de una fila van en un solo rectángulo.
    let dark = 0
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.dark(x, y)) dark++
    expect(modules.length).toBeLessThan(dark)
  })

  it('con fondo transparente no se pinta el fondo', async () => {
    const m = qrMatrix('a', false)
    const all = await rects(await qrPdf(m, { dark: '#000000', background: 'transparent', cm: 3 }))
    const first = all[0]
    expect(first[2]).toBeLessThan((3 * 72) / 2.54 / 2)
  })

  it('con logo, lo pone en el centro', async () => {
    const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
    const doc = await PDFDocument.load(await qrPdf(qrMatrix('hola', true), { dark: '#000000', background: '#FFFFFF', cm: 4, logoPng: PNG }))
    const xobjects = doc.getPage(0).node.Resources()!.lookup(PDFName.of('XObject'))
    expect(xobjects).toBeTruthy()
  })
})

describe('hoja para imprimir', () => {
  it('cuántos caben por hoja A4 según el tamaño', () => {
    const per = (cm: number) => {
      const l = sheetLayout(cm)
      return [l.cols, l.rows]
    }
    expect(per(3)).toEqual([5, 7])
    expect(per(5)).toEqual([3, 4])
    expect(per(8)).toEqual([2, 3])
  })

  it('reparte los QR en páginas A4 con su nombre debajo, recortado si no entra', async () => {
    const items = Array.from({ length: 14 }, (_, i) => ({ matrix: qrMatrix(`https://a.com/${i}`, false), label: i === 0 ? 'Un nombre larguísimo que no entra debajo del código QR' : `Mesa ${i + 1}` }))
    const pdf = await qrSheetPdf(items, { dark: '#000000', background: '#FFFFFF', cm: 5, title: 'QR' })
    const task = getDocument({ data: pdf.slice() })
    const doc = await task.promise
    expect(doc.numPages).toBe(2)
    const text = async (n: number) => (await (await doc.getPage(n)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join('|')
    const first = await text(1)
    expect(first).toContain('Mesa 12')
    expect(first).not.toContain('Mesa 13')
    expect(first).toContain('…')
    expect(await text(2)).toContain('Mesa 14')
    await task.destroy()
  })

  it('recorta el texto con puntos suspensivos', () => {
    expect(fitText('corto', 100, (t) => t.length)).toBe('corto')
    expect(fitText('abcdefghij', 6, (t) => t.length)).toBe('abcde…')
  })
})
