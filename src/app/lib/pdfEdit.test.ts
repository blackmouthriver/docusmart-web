import { describe, expect, it } from 'vitest'
import { PDFDocument, degrees } from 'pdf-lib'
import { inflateSync } from 'fflate'
import { BASELINE, applyEdits, hexToRgb, printableLines, viewRectToPdf, type EditItem } from './pdfEdit'
import { encodePng } from './pdfImages'

async function makePdf(rotate = 0) {
  const d = await PDFDocument.create()
  d.addPage([200, 400])
  d.addPage([200, 400]).setRotation(degrees(rotate))
  return d.save()
}

/** Texto de los content streams de una página (descomprimidos), para revisar los operadores. */
async function pageOps(bytes: Uint8Array, index: number): Promise<string> {
  const doc = await PDFDocument.load(bytes)
  const contents = doc.getPage(index).node.Contents()
  const refs = contents && 'asArray' in contents ? (contents as { asArray(): unknown[] }).asArray() : [contents]
  return refs
    .map((r) => {
      const s = doc.context.lookup(r as never) as unknown as { contents: Uint8Array; dict: { toString(): string } }
      const raw = s.dict.toString().includes('FlateDecode') ? inflateSync(s.contents.subarray(2)) : s.contents
      return new TextDecoder('latin1').decode(raw)
    })
    .join('\n')
}

describe('utilidades', () => {
  it('convierte colores hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ type: 'RGB', red: 1, green: 0, blue: 0 })
    expect(hexToRgb('0f0')).toEqual({ type: 'RGB', red: 0, green: 1, blue: 0 })
    expect(hexToRgb('rojo')).toEqual({ type: 'RGB', red: 0, green: 0, blue: 0 })
  })

  it('deja solo lo que las fuentes estándar pueden dibujar', () => {
    expect(printableLines('Año ✓\r\n\tfin 🎉')).toEqual(['Año', 'fin'])
  })

  it('traduce rectángulos de la página vista, también rotada', () => {
    const box = { x: 0, y: 0, width: 200, height: 400 }
    expect(viewRectToPdf(0.1, 0.1, 0.5, 0.25, box, 0)).toEqual({ x: 20, y: 260, width: 100, height: 100 })
    // Rotada 90°: la vista es de 400x200
    const r = viewRectToPdf(0.1, 0.1, 0.5, 0.25, box, 90)
    expect([r.x, r.y, r.width, r.height].map((n) => Math.round(n))).toEqual([20, 40, 50, 200])
  })
})

describe('applyEdits', () => {
  it('escribe texto en varias líneas con la fuente, el color y la posición pedidos', async () => {
    const items: EditItem[] = [{ kind: 'text', page: 0, x: 0.1, y: 0.1, text: 'Hola\n\nMundo', size: 20, color: '#2563EB', font: 'times', bold: true }]
    const out = await applyEdits(await makePdf(), items)
    const ops = await pageOps(out, 0)
    // Primera línea base: 40 (10 %) + 0.991 * 20 desde arriba → y = 400 - 59.82
    expect(ops).toMatch(/0\.1450\d* 0\.3882\d* 0\.9215\d* rg/)
    expect(ops).toMatch(/1 0 0 1 20 340\.1\d* Tm/)
    // Tercera línea (la segunda está vacía): 2 × 24 más abajo
    expect(ops).toMatch(/1 0 0 1 20 292\.18 Tm/)
    expect(ops).toMatch(/\/Times-Bold-\d+ 20 Tf/)
    expect(BASELINE.times).toBe(0.991)
  })

  it('gira el texto y las imágenes en páginas rotadas', async () => {
    const png = encodePng(new Uint8Array([255, 0, 0, 255]), 1, 1)
    const items: EditItem[] = [
      { kind: 'text', page: 1, x: 0, y: 0, text: 'A', size: 10, color: '#000', font: 'courier', bold: false },
      { kind: 'image', page: 1, x: 0, y: 0, w: 0.5, h: 0.5, data: png, format: 'png' },
      { kind: 'image', page: 0, x: 0, y: 0, w: 0.5, h: 0.5, data: png, format: 'png' },
    ]
    const out = await applyEdits(await makePdf(90), items)
    const ops = await pageOps(out, 1)
    // Rotación de 90°: matriz [cos sen -sen cos] ≈ [0 1 -1 0]; texto anclado en x = 0.933 × 10 / 200 × 200
    expect(ops).toMatch(/[\d.e-]+ 1 -1 [\d.e-]+ 9\.33 0 Tm/)
    expect(ops).toMatch(/1 0 0 1 100 0 cm\n[\d.e-]+ 1 -1 [\d.e-]+ 0 0 cm\n200 0 0 100 0 0 cm/)
    // La misma imagen se incrusta una sola vez
    const doc = await PDFDocument.load(out)
    const images = doc.context.enumerateIndirectObjects().filter(([, o]) => String((o as { dict?: unknown }).dict ?? '').includes('/Subtype /Image'))
    expect(images).toHaveLength(1)
  })

  it('dibuja rectángulos, elipses, resaltado y tapado', async () => {
    const box = { page: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.1, strokeWidth: 2 }
    const items: EditItem[] = [
      { ...box, kind: 'rect', stroke: '#DC2626', fill: null },
      { ...box, kind: 'ellipse', stroke: null, fill: '#16A34A' },
      { ...box, kind: 'highlight', stroke: null, fill: null },
      { ...box, kind: 'whiteout', stroke: '#000', fill: '#000' },
    ]
    const ops = await pageOps(await applyEdits(await makePdf(), items), 0)
    expect(ops).toMatch(/0\.8627\d* 0\.1490\d* 0\.1490\d* RG/) // borde rojo
    expect(ops).toMatch(/0\.0862\d* 0\.6392\d* 0\.2901\d* rg/) // relleno verde de la elipse
    expect(ops).toMatch(/0\.9921\d* 0\.8784\d* 0\.2784\d* rg/) // amarillo del resaltador
    expect(ops).toMatch(/1 1 1 rg/) // tapado blanco
    expect(ops).toContain(' c\n') // curvas de la elipse
  })

  it('exige al menos un elemento', async () => {
    await expect(applyEdits(await makePdf(), [])).rejects.toThrow('al menos')
  })

  it('acepta JPEG', async () => {
    const jpg = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
    const out = await applyEdits(await makePdf(), [{ kind: 'image', page: 0, x: 0, y: 0, w: 1, h: 1, data: jpg, format: 'jpg' }])
    expect(new TextDecoder('latin1').decode(out)).toContain('/DCTDecode')
  })
})
