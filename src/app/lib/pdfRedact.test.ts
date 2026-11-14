import { describe, expect, it, vi } from 'vitest'
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib'
import { PRESETS, areaFromCorners, clampArea, findTextAreas, foldText, groupByPage, phraseMatcher, redactPdf, type Area, type TextItem } from './pdfRedact'

// PNG de 1x1
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

async function makePdf() {
  const d = await PDFDocument.create()
  d.setTitle('Expediente confidencial de Ana')
  d.setAuthor('Ana Pérez')
  const font = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= 3; i++) d.addPage([200, 400]).drawText(`Secreto ${i}`, { x: 20, y: 300, size: 12, font })
  d.getPage(2).setRotation(degrees(90))
  return d.save()
}

describe('zonas', () => {
  it('agrupa por página', () => {
    const a: Area = { page: 2, x: 0, y: 0, w: 0.1, h: 0.1 }
    const m = groupByPage([a, { ...a, page: 0 }, { ...a, x: 0.5 }])
    expect([...m.keys()]).toEqual([2, 0])
    expect(m.get(2)).toHaveLength(2)
  })

  it('mantiene la zona dentro de la página', () => {
    expect(clampArea({ page: 0, x: 0.95, y: -0.2, w: 0.2, h: 0 })).toEqual({ page: 0, x: 0.8, y: 0, w: 0.2, h: 0.005 })
  })

  it('arma la zona desde dos esquinas en cualquier orden', () => {
    expect(areaFromCorners(1, 0.6, 0.9, 0.2, 0.4)).toEqual({ page: 1, x: 0.2, y: 0.4, w: expect.closeTo(0.4), h: expect.closeTo(0.5) })
    expect(areaFromCorners(0, -1, 0.5, 2, 0.5)).toEqual({ page: 0, x: 0, y: 0.5, w: 1, h: 0 })
  })
})

describe('redactPdf', () => {
  it('rasteriza solo las páginas censuradas y copia las demás', async () => {
    const rasterize = vi.fn(async (_i: number, _a: Area[]) => ({ image: PNG, format: 'png' as const, widthPt: 400, heightPt: 200 }))
    const out = await redactPdf(await makePdf(), [{ page: 2, x: 0.1, y: 0.1, w: 0.2, h: 0.1 }], rasterize)
    expect(rasterize).toHaveBeenCalledTimes(1)
    expect(rasterize).toHaveBeenCalledWith(2, [expect.objectContaining({ page: 2 })])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(3)
    // La página censurada queda con el tamaño visto y sin rotación.
    expect(doc.getPage(2).getSize()).toEqual({ width: 400, height: 200 })
    expect(doc.getPage(2).getRotation().angle).toBe(0)
    expect(doc.getPage(0).getSize()).toEqual({ width: 200, height: 400 })
  })

  it('no arrastra los metadatos del original', async () => {
    const out = await redactPdf(await makePdf(), [{ page: 0, x: 0, y: 0, w: 1, h: 1 }], async () => ({ image: PNG, format: 'png', widthPt: 200, heightPt: 400 }))
    const doc = await PDFDocument.load(out)
    expect(doc.getTitle()).toBeUndefined()
    expect(doc.getAuthor()).toBeUndefined()
    expect(new TextDecoder('latin1').decode(out)).not.toContain('Secreto 1')
  })

  it('acepta JPEG', async () => {
    const fakeJpg = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
    const out = await redactPdf(await makePdf(), [{ page: 1, x: 0, y: 0, w: 1, h: 1 }], async () => ({ image: fakeJpg, format: 'jpg', widthPt: 200, heightPt: 400 }))
    expect((await PDFDocument.load(out)).getPageCount()).toBe(3)
  })

  it('exige al menos una zona', async () => {
    await expect(redactPdf(await makePdf(), [], vi.fn())).rejects.toThrow('al menos una zona')
  })
})

describe('buscar texto', () => {
  it('ignora tildes y mayúsculas sin mover las posiciones', () => {
    expect(foldText('José PÉREZ Ñandú')).toBe('jose perez nandu')
    expect(foldText('José').length).toBe(4)
  })

  it('encuentra todas las apariciones de una frase', () => {
    expect(phraseMatcher('Perez')('ana perez y luis perez')).toEqual([[4, 9], [17, 22]])
    expect(phraseMatcher('   ')('algo')).toEqual([])
  })

  it('reconoce correos y números largos', () => {
    expect(PRESETS.correos('escribe a ana.perez+1@correo.com.co hoy')).toEqual([[10, 35]])
    expect(PRESETS.numeros('cédula 1.020.345.678 y tel +57 300 123 4567, año 2026')).toEqual([[7, 20], [27, 43]])
  })

  // Página de 200x400 sin rotar: (x, y) del PDF → (x/200, 1 - y/400).
  const toView = (x: number, y: number): [number, number] => [x / 200, 1 - y / 400]

  it('ubica la coincidencia dentro del fragmento', () => {
    const items: TextItem[] = [
      { str: 'Nombre: José', transform: [10, 0, 0, 10, 20, 300], width: 120 },
      { str: '   ', transform: [10, 0, 0, 10, 0, 0], width: 10 },
    ]
    const [a] = findTextAreas(0, items, phraseMatcher('jose'), toView)
    // "José" ocupa los caracteres 8 a 12 de 12 → x de 100 a 140 en el PDF.
    expect(a.page).toBe(0)
    expect(a.x).toBeCloseTo(100 / 200 - 0.002)
    expect(a.w).toBeCloseTo(40 / 200 + 0.004)
    // Desde 2.5 por debajo de la línea base hasta 9.5 por encima.
    expect(a.y).toBeCloseTo(1 - 309.5 / 400 - 0.002)
    expect(a.h).toBeCloseTo(12 / 400 + 0.004)
  })

  it('funciona con texto vertical', () => {
    // Texto girado 90°: avanza hacia arriba.
    const [a] = findTextAreas(1, [{ str: 'AB', transform: [0, 10, -10, 0, 100, 100], width: 20 }], phraseMatcher('b'), toView)
    expect(a.h).toBeCloseTo(10 / 400 + 0.004)
    expect(a.w).toBeCloseTo(12 / 200 + 0.004)
  })
})
