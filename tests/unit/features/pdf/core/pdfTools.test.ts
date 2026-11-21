import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib'
import { extractPages, merge, numberPages, pageCount, rotate, sanitizeWinAnsi, splitEach, watermark } from '../../../../../src/features/pdf/core/pdfTools'

async function makePdf(pages: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= pages; i++) doc.addPage([300, 400]).drawText(`Pagina ${i}`, { x: 20, y: 200, size: 12, font })
  const bytes = await doc.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer

describe('pdfTools', () => {
  it('une varios PDFs conservando todas las páginas', async () => {
    expect(await pageCount(buf(await merge([await makePdf(3), await makePdf(2)])))).toBe(5)
  })

  it('extrae solo las páginas pedidas y en ese orden', async () => {
    const out = await PDFDocument.load(await extractPages(await makePdf(4), [3, 0]))
    expect(out.getPageCount()).toBe(2)
  })

  it('separa cada página en un PDF', async () => {
    const parts = await splitEach(await makePdf(3))
    expect(parts).toHaveLength(3)
    for (const p of parts) expect(await pageCount(buf(p))).toBe(1)
  })

  it('rota solo las páginas indicadas y acumula la rotación', async () => {
    const once = await rotate(await makePdf(3), [1], 90)
    const twice = await rotate(buf(once), [1], 270)
    expect((await PDFDocument.load(once)).getPages().map((p) => p.getRotation().angle)).toEqual([0, 90, 0])
    expect((await PDFDocument.load(twice)).getPages().map((p) => p.getRotation().angle)).toEqual([0, 0, 0])
  })

  it('numera y aplica marca de agua sin cambiar la cantidad de páginas', async () => {
    const src = await makePdf(2)
    expect(await pageCount(buf(await numberPages(src, { position: 'bottom-right', format: 'n-of-total' })))).toBe(2)
    expect(await pageCount(buf(await watermark(src, 'Confidencial ✓ ñ')))).toBe(2)
  })

  it('la marca de agua usa la Helvetica con latín y la fuente incrustada con otros alfabetos', async () => {
    const src = await makePdf(1)
    const baseFonts = async (bytes: Uint8Array) =>
      (await PDFDocument.load(bytes)).context
        .enumerateIndirectObjects()
        .map(([, o]) => String((o as { get?: (k: unknown) => unknown }).get?.(PDFName.of('BaseFont')) ?? ''))
        .filter(Boolean)
    expect(await baseFonts(await watermark(src, 'Borrador'))).toContain('/Helvetica-Bold')
    const ru = await baseFonts(await watermark(src, 'Конфиденциально 机密'))
    expect(ru.some((f) => f.includes('Carlito-Bold'))).toBe(true)
    expect(ru.some((f) => f.includes('DroidSansFallback'))).toBe(true)
  })

  it('rechaza archivos que no son PDF', async () => {
    await expect(pageCount(new TextEncoder().encode('hola').buffer as ArrayBuffer)).rejects.toThrow()
  })

  it('deja solo caracteres que las fuentes estándar de PDF pueden dibujar', () => {
    expect(sanitizeWinAnsi('  Año 2026 ✓ 🔒 ')).toBe('Año 2026')
  })
})
