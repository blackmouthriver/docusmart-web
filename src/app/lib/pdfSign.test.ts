import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFName, degrees } from 'pdf-lib'
import { clampPlacement, defaultPlacement, opaqueBounds, placementToPdf, removeLightBackground, signPdf, viewToPdf, type Placement } from './pdfSign'

const box = { x: 0, y: 0, width: 200, height: 400 }

// PNG de 1x1 transparente
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

describe('viewToPdf', () => {
  it('sin rotación: arriba a la izquierda es (x, y + alto)', () => {
    expect(viewToPdf(0, 0, box, 0)).toEqual({ x: 0, y: 400 })
    expect(viewToPdf(1, 1, box, 0)).toEqual({ x: 200, y: 0 })
  })
  it('con la caja desplazada', () => {
    expect(viewToPdf(0.5, 0.5, { x: 10, y: 20, width: 100, height: 100 }, 0)).toEqual({ x: 60, y: 70 })
  })
  it('90°: la esquina superior izquierda vista es el origen del PDF', () => {
    expect(viewToPdf(0, 0, box, 90)).toEqual({ x: 0, y: 0 })
    expect(viewToPdf(1, 0, box, 90)).toEqual({ x: 0, y: 400 })
    expect(viewToPdf(0, 1, box, 90)).toEqual({ x: 200, y: 0 })
  })
  it('180° y 270° (o -90°)', () => {
    expect(viewToPdf(0, 0, box, 180)).toEqual({ x: 200, y: 0 })
    expect(viewToPdf(0, 0, box, 270)).toEqual({ x: 200, y: 400 })
    expect(viewToPdf(1, 1, box, -90)).toEqual({ x: 0, y: 0 })
  })
})

describe('placementToPdf', () => {
  const p: Placement = { page: 0, x: 0.5, y: 0.5, w: 0.25, h: 0.1 }
  it('sin rotación usa la esquina inferior izquierda del recuadro', () => {
    const r = placementToPdf(p, box, 0)
    expect([r.x, r.y, r.width, r.height]).toEqual([100, 160, 50, 40])
    expect(r.rotate).toEqual(degrees(0))
  })
  it('con 90° gira la imagen y cambia los lados de la página vista', () => {
    // Vista apaisada de 400x200: el recuadro mide 100x20 y su esquina inferior izquierda vista es (0.5, 0.6).
    const r = placementToPdf(p, box, 90)
    expect([r.x, r.y, r.width, r.height]).toEqual([120, 200, 100, 20])
    expect(r.rotate).toEqual(degrees(90))
  })
})

describe('posición de la firma', () => {
  it('por defecto queda abajo a la derecha, con la proporción de la firma', () => {
    const p = defaultPlacement(2, 3, 0.75)
    expect(p.page).toBe(2)
    expect(p.w).toBeCloseTo(0.3)
    // ancho real = 0.3 * 0.75 (en altos de página); alto real = ancho / 3
    expect(p.h).toBeCloseTo(0.075)
    expect(p.x + p.w).toBeCloseTo(0.94)
    expect(p.y + p.h).toBeCloseTo(0.94)
  })
  it('una firma muy alta no pasa del 40 % de la página', () => {
    expect(defaultPlacement(0, 0.1, 1).h).toBe(0.4)
  })
  it('clampPlacement la mantiene dentro de la página', () => {
    expect(clampPlacement({ page: 0, x: 0.9, y: -1, w: 0.3, h: 0.001 })).toEqual({ page: 0, x: 0.7, y: 0, w: 0.3, h: 0.03 })
    expect(clampPlacement({ page: 0, x: -0.2, y: 0.5, w: 5, h: 0.2 })).toEqual({ page: 0, x: 0, y: 0.5, w: 1, h: 0.2 })
  })
})

describe('signPdf', () => {
  async function makePdf(rotate = 0) {
    const d = await PDFDocument.create()
    d.addPage([200, 400])
    d.addPage([200, 400]).setRotation(degrees(rotate))
    return d.save()
  }

  it('estampa la firma en las páginas elegidas', async () => {
    const out = await signPdf(await makePdf(90), PNG, [
      { page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.1 },
      { page: 1, x: 0.5, y: 0.5, w: 0.3, h: 0.1 },
    ])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(2)
    // Cada página referencia la imagen en sus recursos.
    for (const page of doc.getPages()) expect(page.node.Resources()?.get(PDFName.of('XObject'))).toBeDefined()
  })

  it('exige al menos una posición', async () => {
    await expect(signPdf(await makePdf(), PNG, [])).rejects.toThrow('al menos una página')
  })
})

describe('imagen de la firma', () => {
  const px = (rgba: number[][]) => ({ data: new Uint8ClampedArray(rgba.flat()), width: rgba.length, height: 1 })

  it('vuelve transparente el fondo claro y suaviza los grises', () => {
    const img = px([[255, 255, 255, 255], [20, 20, 120, 255], [170, 170, 170, 255]])
    removeLightBackground(img)
    expect(img.data[3]).toBe(0)
    expect(img.data[7]).toBe(255)
    expect(img.data[11]).toBe(128)
  })

  it('encuentra el área con trazo', () => {
    const data = new Uint8ClampedArray(5 * 4 * 4)
    data[(1 * 5 + 1) * 4 + 3] = 255
    data[(2 * 5 + 3) * 4 + 3] = 255
    expect(opaqueBounds({ data, width: 5, height: 4 })).toEqual({ x: 1, y: 1, width: 3, height: 2 })
    expect(opaqueBounds({ data: new Uint8ClampedArray(16), width: 2, height: 2 })).toBeNull()
  })
})
