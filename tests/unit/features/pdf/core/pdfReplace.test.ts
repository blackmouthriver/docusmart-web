import { describe, expect, it } from 'vitest'
import { backgroundColor, groupLines, groupParagraphs, inkColor, lineFrame, replacementFor } from '../../../../../src/features/pdf/core/pdfReplace'
import { BASELINE } from '../../../../../src/features/pdf/core/pdfEdit'
import type { TextFrag } from '../../../../../src/features/convert/core/pdfWord'

const frag = (str: string, x: number, y: number, w: number, extra: Partial<TextFrag> = {}): TextFrag => ({ page: 0, str, x, y, w, size: 12, bold: false, italic: false, family: 'sans', ...extra })

describe('groupLines', () => {
  it('une los trozos de una misma línea y separa las líneas', () => {
    const lines = groupLines([
      frag('Hola', 60, 100, 26),
      frag('mundo', 90, 100.5, 34),
      frag('Segunda línea', 60, 118, 80),
    ])
    expect(lines.map((l) => l.text)).toEqual(['Hola mundo', 'Segunda línea'])
    expect(lines[0]).toMatchObject({ x: 60, y: 100, w: 64, size: 12 })
  })

  it('no une dos columnas separadas por un hueco grande', () => {
    const lines = groupLines([frag('Izquierda', 60, 100, 50), frag('Derecha', 320, 100, 45)])
    expect(lines.map((l) => l.text)).toEqual(['Izquierda', 'Derecha'])
  })

  it('no agrega espacio entre trozos pegados, ignora vacíos y conserva negrita solo si toda la línea lo es', () => {
    const lines = groupLines([frag('Pala', 60, 100, 24, { bold: true }), frag('bra', 84, 100, 18, { bold: true }), frag('   ', 120, 100, 6)])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ text: 'Palabra', bold: true })
    expect(groupLines([frag('A', 60, 100, 8, { bold: true }), frag('b', 70, 100, 8)])[0].bold).toBe(false)
    expect(groupLines([])).toEqual([])
  })
})

describe('inkColor', () => {
  const px = (...colors: Array<[number, number, number, number?]>) => colors.flatMap(([r, g, b, a = 255]) => [r, g, b, a])

  it('toma el color oscuro más frecuente e ignora el fondo y los bordes claros', () => {
    const blue: [number, number, number] = [47, 84, 150]
    const data = px(...Array(30).fill([255, 255, 255]), ...Array(10).fill(blue), [200, 210, 230], [180, 190, 220], [0, 0, 0])
    expect(inkColor(data)).toBe('#2F5496')
  })

  it('sin tinta (página en blanco o transparente) devuelve el color por defecto', () => {
    expect(inkColor(px([255, 255, 255], [10, 10, 10, 0]))).toBe('#1C1B1A')
    expect(inkColor([], '#000000')).toBe('#000000')
  })
})

describe('replacementFor', () => {
  const line = { text: 'Total: $2.000.000', x: 60, y: 200, w: 100, size: 12, bold: true, family: 'serif' as const }

  it('borra la línea y escribe el texto en el mismo lugar, tamaño y estilo', () => {
    const [box, text] = replacementFor(line, 1, 600, 800)
    expect(box).toMatchObject({ kind: 'erase', page: 1, fill: null })
    expect(box.x).toBeLessThan(60 / 600)
    expect(box.x + box.w).toBeGreaterThan(160 / 600)
    expect(box.y).toBeLessThan((200 - 12) / 800)
    expect(box.y + box.h).toBeGreaterThan(200 / 800)
    expect(text).toMatchObject({ kind: 'text', page: 1, text: 'Total: $2.000.000', size: 12, font: 'times', bold: true })
    expect(text.x).toBeCloseTo(60 / 600)
    // La línea base del texto nuevo cae en la del original.
    expect(text.y * 800 + BASELINE.times * 12).toBeCloseTo(200)
  })

  it('elige la fuente estándar según la familia', () => {
    expect(replacementFor({ ...line, family: 'mono' }, 0, 600, 800)[1].font).toBe('courier')
    expect(replacementFor({ ...line, family: 'sans' }, 0, 600, 800)[1].font).toBe('helvetica')
  })

  it('no se sale de la página', () => {
    const [box] = replacementFor({ ...line, x: 0, y: 5 }, 0, 600, 800)
    expect(box.x).toBe(0)
    expect(box.y).toBe(0)
  })

  it('da la caja tocable de la línea en fracciones', () => {
    const f = lineFrame(line, 600, 800)
    expect(f.x).toBeCloseTo(0.1)
    expect(f.y).toBeLessThan(0.25)
    expect(f.y + f.h).toBeGreaterThan(0.25)
  })
})

describe('párrafos (W-140)', () => {
  const L = (text: string, y: number, o = {}) => ({ text, x: 60, y, w: 300, size: 12, bold: false, family: 'sans' as const, color: '1F3A5F', ...o })

  it('une las líneas seguidas del mismo párrafo y separa al cambiar el estilo o el interlineado', () => {
    const paras = groupParagraphs([
      L('Título del informe', 100, { size: 18, bold: true }),
      L('Primera línea del párrafo que se cor-', 130),
      L('ta con guion y sigue en la siguiente', 145),
      L('línea del mismo párrafo.', 160, { w: 140 }),
      L('Otro párrafo más abajo', 200),
      L('En rojo', 215, { color: 'C00000' }),
    ])
    expect(paras.map((p) => [p.text, p.lines])).toEqual([
      ['Título del informe', 1],
      ['Primera línea del párrafo que se corta con guion y sigue en la siguiente línea del mismo párrafo.', 3],
      ['Otro párrafo más abajo', 1],
      ['En rojo', 1],
    ])
    expect(paras[1]).toMatchObject({ y: 130, gap: 15, w: 300, color: '1F3A5F' })
    expect(lineFrame(paras[1], 600, 800).h * 800).toBeCloseTo(12 * 1.25 + 30)
  })

  it('el reemplazo de un párrafo lo borra entero y escribe con el mismo color, ancho e interlineado', () => {
    const [p] = groupParagraphs([L('Una línea', 130), L('y otra', 145)])
    const [box, text] = replacementFor(p, 0, 600, 800, '#EAF2FF')
    expect(box).toMatchObject({ kind: 'erase', fill: '#EAF2FF' })
    expect((box.y + box.h) * 800).toBeGreaterThan(145)
    expect(text).toMatchObject({ text: 'Una línea y otra', color: '#1F3A5F', lineHeight: 15 / 12 })
    expect(text.width! * 600).toBeCloseTo(312)
    // Una sola línea no se corta: queda como antes.
    expect(replacementFor(L('Sola', 100), 0, 600, 800)[1].width).toBeUndefined()
  })

  it('backgroundColor: el color más frecuente de la zona', () => {
    const px = (...colors: number[][]) => colors.flatMap((c) => [...c, 255])
    expect(backgroundColor(px([234, 242, 255], [234, 242, 255], [20, 20, 20]))).toBe('#EAF2FF')
    expect(backgroundColor([])).toBe('#FFFFFF')
  })
})
