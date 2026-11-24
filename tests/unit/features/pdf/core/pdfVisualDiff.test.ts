// W-147.7: comparar PDF visualmente, pixel a pixel.
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { cellBoxes, diffPages, visualReportPdf, visualSummary, type Pixels } from '../../../../../src/features/pdf/core/pdfVisualDiff'

/** Página blanca de w × h con rectángulos de color [x, y, w, h, r, g, b]. */
function page(w: number, h: number, rects: number[][] = []): Pixels {
  const data = new Uint8ClampedArray(w * h * 4).fill(255)
  for (const [x0, y0, rw, rh, r, g, b] of rects)
    for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) data.set([r, g, b, 255], (y * w + x) * 4)
  return { data, width: w, height: h }
}
const at = (p: Pixels, x: number, y: number) => [...p.data.slice((y * p.width + x) * 4, (y * p.width + x) * 4 + 3)]

describe('diffPages', () => {
  it('dos páginas iguales no tienen cambios', () => {
    const a = page(60, 80, [[10, 10, 20, 5, 0, 0, 0]])
    const d = diffPages(a, page(60, 80, [[10, 10, 20, 5, 0, 0, 0]]))
    expect(d.changed).toBe(0)
    expect(d.boxes).toEqual([])
    // Lo igual queda en gris claro (lo negro, gris; lo blanco, blanco).
    expect(at(d.overlay, 12, 12)[0]).toBeGreaterThan(170)
    expect(at(d.overlay, 50, 50)).toEqual([255, 255, 255])
  })

  it('marca en rojo lo quitado, en verde lo agregado, y agrupa cada cambio en una zona', () => {
    const a = page(120, 120, [[10, 10, 20, 10, 0, 0, 0]])
    const b = page(120, 120, [[80, 90, 20, 10, 0, 0, 0]])
    const d = diffPages(a, b, { cell: 10 })
    expect(d.changed).toBeCloseTo(400 / 14400, 5)
    expect(at(d.overlay, 15, 15)).toEqual([220, 38, 38])
    expect(at(d.overlay, 85, 95)).toEqual([22, 163, 74])
    expect(d.boxes).toHaveLength(2)
    // De arriba abajo, cubriendo cada rectángulo.
    const [first, second] = d.boxes
    expect(first.x * 120).toBeLessThanOrEqual(10)
    expect((first.x + first.w) * 120).toBeGreaterThanOrEqual(30)
    expect(second.y * 120).toBeLessThanOrEqual(90)
    expect((second.y + second.h) * 120).toBeGreaterThanOrEqual(100)
  })

  it('un cambio de color también cuenta (en ámbar); uno muy leve no', () => {
    const a = page(40, 40, [[0, 0, 40, 40, 200, 30, 30]])
    const recolored = diffPages(a, page(40, 40, [[0, 0, 40, 40, 30, 30, 200]]))
    expect(recolored.changed).toBe(1)
    // Contenido en las dos versiones con otro color: ámbar, ni quitado ni agregado.
    expect(at(recolored.overlay, 20, 20)).toEqual([217, 119, 6])
    expect(diffPages(a, page(40, 40, [[0, 0, 40, 40, 210, 40, 30]])).changed).toBe(0)
  })

  it('con distinto alto, lo que falta cuenta como blanco; lo transparente también', () => {
    const tall = page(30, 60, [[0, 40, 30, 10, 0, 0, 0]])
    const d = diffPages(page(30, 30), tall)
    expect(d.overlay.height).toBe(60)
    expect(d.changed).toBeCloseTo(300 / 1800, 5)
    const clear = { data: new Uint8ClampedArray(30 * 30 * 4), width: 30, height: 30 }
    expect(diffPages(clear, page(30, 30)).changed).toBe(0)
  })
})

describe('zonas y resumen', () => {
  it('celdas que se tocan (también en diagonal) forman una sola zona', () => {
    // 4 × 3: dos celdas en diagonal y una aparte.
    const cells = new Uint8Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1])
    expect(cellBoxes(cells, 4, 3)).toEqual([
      { x0: 0, y0: 0, x1: 1, y1: 1 },
      { x0: 3, y0: 2, x1: 3, y1: 2 },
    ])
  })

  it('resume páginas cambiadas y las que están solo en uno', () => {
    const s = visualSummary([
      { page: 1, status: 'same', changed: 0, boxes: [] },
      { page: 2, status: 'changed', changed: 0.1, boxes: [] },
      { page: 3, status: 'onlyB', changed: 1, boxes: [] },
    ])
    expect(s).toEqual({ changed: [2], onlyA: [], onlyB: [3], same: false })
    expect(visualSummary([{ page: 1, status: 'same', changed: 0, boxes: [] }]).same).toBe(true)
  })

  it('el informe tiene una página por imagen, a ancho A4 y con su proporción', async () => {
    const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
    const doc = await PDFDocument.load(await visualReportPdf([{ jpg: JPG, width: 1000, height: 1414 }, { jpg: JPG, width: 1000, height: 707 }], 'Comparación visual'))
    expect(doc.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([[595, 841], [595, 421]])
    expect(doc.getTitle()).toBe('Comparación visual')
  })
})
