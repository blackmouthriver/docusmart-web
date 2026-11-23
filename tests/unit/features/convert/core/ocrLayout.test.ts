// W-147.3: PDF escaneado a Word y Excel en un paso, resolución de PDF a imagen y tamaño de la
// presentación en PDF a PowerPoint.
import { describe, expect, it } from 'vitest'
import { dropPageScans, ocrLinesToFrags, pagesWithoutText, type OcrLine } from '../../../../../src/features/convert/core/ocrLayout'
import { buildDocument, type TextFrag } from '../../../../../src/features/convert/core/pdfWord'
import { buildSheets } from '../../../../../src/features/convert/core/pdfExcel'
import { MAX_RENDER_SIDE, renderWidth } from '../../../../../src/features/convert/core/convert'
import { dominantPage, slideSize } from '../../../../../src/features/convert/core/pptxWrite'

const frag = (page: number, str: string): TextFrag => ({ page, str, x: 50, y: 100, w: 100, size: 11, bold: false, italic: false, family: 'sans' })

/** Una línea de palabras a 220 ppp: cada palabra de 18 px por letra, separadas como se indica. */
function line(y: number, words: Array<[string, number]>): OcrLine {
  return { baseline: y, height: 40, words: words.map(([text, x]) => ({ text, x0: x, y0: y - 32, x1: x + text.length * 18, y1: y + 8, confidence: 90 })) }
}
const SCALE = 72 / 220

describe('OCR en un paso', () => {
  it('las páginas sin texto digital son las que se reconocen', () => {
    expect(pagesWithoutText(3, [frag(0, 'Contrato de arrendamiento de vivienda'), frag(2, '3')])).toEqual([1, 2])
    expect(pagesWithoutText(1, [])).toEqual([0])
  })

  it('las palabras quedan en puntos, en su lugar y con el tamaño de la línea', () => {
    const frags = ocrLinesToFrags([line(300, [['FACTURA', 200], ['2026', 400]])], 1, SCALE)
    expect(frags).toHaveLength(2)
    expect(frags[0]).toMatchObject({ page: 1, str: 'FACTURA', bold: false, family: 'sans' })
    expect(frags[0].x).toBeCloseTo(200 * SCALE)
    expect(frags[0].y).toBeCloseTo(300 * SCALE)
    expect(frags[0].w).toBeCloseTo(7 * 18 * SCALE)
    expect(frags[0].size).toBe(10.5)
    // El ruido (poca confianza) y lo vacío no pasan.
    const noisy: OcrLine = { baseline: 100, height: 40, words: [{ text: '~', x0: 0, y0: 0, x1: 10, y1: 10, confidence: 5 }, { text: ' ', x0: 20, y0: 0, x1: 30, y1: 10 }] }
    expect(ocrLinesToFrags([noisy], 0, SCALE)).toEqual([])
  })

  it('el Word arma párrafos y el Excel separa las columnas de una tabla escaneada', () => {
    const lines = [line(200, [['Extracto', 150], ['bancario', 330]]), line(400, [['Fecha', 150], ['Concepto', 600], ['Valor', 1300]]), line(460, [['01/11', 150], ['Arriendo', 600], ['1.500.000', 1300]])]
    const texts = ocrLinesToFrags(lines, 0, SCALE)
    const page = { width: 612, height: 792 }
    const doc = buildDocument([page], texts)
    const all = JSON.stringify(doc.blocks)
    expect(all).toContain('Extracto bancario')
    const [sheet] = buildSheets([page], texts)
    const row = sheet.rows.find((r) => r.some((c) => String(c.v).includes('Arriendo')))!
    expect(row.filter((c) => String(c.v).trim()).length).toBe(3)
  })

  it('quita la foto del escaneo de las páginas reconocidas, no las demás imágenes', () => {
    const page = { width: 600, height: 800 }
    const png = new Uint8Array([1])
    const images = [
      { page: 0, x: 0, y: 0, w: 600, h: 800, png },
      { page: 0, x: 10, y: 10, w: 100, h: 60, png },
      { page: 1, x: 0, y: 0, w: 600, h: 800, png },
    ]
    expect(dropPageScans(images, [page, page], new Set([0]))).toEqual([images[1], images[2]])
  })
})

describe('PDF a imagen y a PowerPoint', () => {
  it('el ancho depende de la resolución y nunca pasa del máximo', () => {
    expect(renderWidth(595, 842, 72)).toBe(595)
    expect(renderWidth(595, 842, 150)).toBe(1240)
    expect(renderWidth(595, 842, 300)).toBe(2479)
    // Un plano A0 a 300 ppp se achica para que el lado mayor no pase del máximo.
    const w = renderWidth(2384, 3370, 300)
    expect(Math.round((w * 3370) / 2384)).toBeLessThanOrEqual(MAX_RENDER_SIDE)
  })

  it('la presentación toma la proporción que más se repite, no la de la primera página', () => {
    const cover = { width: 1920, height: 1080 }
    const portrait = { width: 1240, height: 1754 }
    expect(dominantPage([cover, portrait, portrait, portrait])).toBe(portrait)
    expect(dominantPage([cover, portrait])).toBe(cover)
    expect(slideSize(dominantPage([cover, portrait, portrait])).cy).toBeGreaterThan(slideSize(cover).cy)
  })
})
