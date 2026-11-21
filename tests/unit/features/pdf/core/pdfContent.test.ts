import { describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { eraseText, parseContent, textRuns } from '../../../../../src/features/pdf/core/pdfContent'
import { loadFonts } from '../../../../../src/shared/pdf/pdfFonts'

async function pageText(bytes: Uint8Array, page = 1): Promise<string[]> {
  const d = await getDocument({ data: bytes.slice() }).promise
  return (await (await d.getPage(page)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).filter((s) => s.trim())
}

describe('parseContent', () => {
  it('lee números, nombres, cadenas (con escapes y paréntesis), arreglos, diccionarios e imágenes en línea', () => {
    const src = '% comentario\nq 1 0 0 1 10 20 cm BT /F1 12 Tf (a\\(b\\) \\101) Tj [(x) -250 <4142>] TJ ET /P <</MCID 3>> BDC EMC BI /W 2 /H 1 ID \x00\xffEI\x00 EI Q'
    const ops = parseContent(Uint8Array.from(src, (c) => c.charCodeAt(0)))
    expect(ops.map((o) => o.op)).toEqual(['q', 'cm', 'BT', 'Tf', 'Tj', 'TJ', 'ET', 'BDC', 'EMC', 'BI', 'Q'])
    const tj = ops[4].args[0] as { bytes: Uint8Array }
    expect(String.fromCharCode(...tj.bytes)).toBe('a(b) A')
    const arr = ops[5].args[0] as Array<number | { bytes: Uint8Array }>
    expect(arr[1]).toBe(-250)
    expect(String.fromCharCode(...(arr[2] as { bytes: Uint8Array }).bytes)).toBe('AB')
    expect(ops[3].args).toEqual([{ name: 'F1' }, 12])
  })

  it('sigue la posición del texto con Td, TD, T*, Tm y la matriz actual', () => {
    const src = 'q 2 0 0 2 0 0 cm BT /F1 10 Tf 5 10 Td (ab) Tj 0 -12 TD (c) Tj T* (d) Tj 1 0 0 1 100 50 Tm (e) Tj ET Q'
    const ops = parseContent(Uint8Array.from(src, (c) => c.charCodeAt(0)))
    const runs = textRuns(ops, () => ({ bytesPerCode: 1, width: () => 500, spaceIsWordSpace: true }))
    expect(runs.map((r) => [r.x0, r.y, r.x1])).toEqual([
      [10, 20, 30],
      [10, -4, 20],
      [10, -28, 20],
      [200, 100, 210],
    ])
    expect(runs[0].size).toBe(20)
  })
})

describe('eraseText', () => {
  async function sample(embedded: boolean) {
    const doc = await PDFDocument.create()
    const page = doc.addPage([400, 300])
    const font = embedded ? (await loadFonts(doc, 'sans', [], '')).font() : await doc.embedFont(StandardFonts.Helvetica)
    page.drawRectangle({ x: 0, y: 0, width: 400, height: 300, color: rgb(0.9, 0.95, 1) })
    page.drawText('Primera línea', { x: 40, y: 250, size: 14, font })
    page.drawText('Texto que se borra', { x: 40, y: 220, size: 14, font })
    page.drawText('Tercera línea', { x: 40, y: 190, size: 14, font })
    page.drawText('Al lado', { x: 300, y: 220, size: 14, font })
    return doc
  }

  for (const embedded of [false, true])
    it(`quita solo el texto dentro de la zona (${embedded ? 'fuente incrustada' : 'Helvetica'})`, async () => {
      const doc = await sample(embedded)
      // Zona de la segunda línea (sin llegar a "Al lado").
      const found = eraseText(doc, 0, [{ x: 36, y: 215, width: 140, height: 20 }, { x: 36, y: 20, width: 50, height: 20 }])
      expect(found).toEqual([true, false])
      const text = await pageText(await doc.save())
      expect(text.join('|')).toBe('Primera línea|Tercera línea|Al lado')
      // El fondo de color sigue ahí (no hay parche blanco).
      expect((await PDFDocument.load(await doc.save())).getPageCount()).toBe(1)
    })

  it('sin zonas o sin texto en la zona no cambia nada', async () => {
    const doc = await sample(false)
    expect(eraseText(doc, 0, [])).toEqual([])
    expect(eraseText(doc, 0, [{ x: 0, y: 0, width: 10, height: 10 }])).toEqual([false])
    expect((await pageText(await doc.save())).length).toBe(4)
  })
})
