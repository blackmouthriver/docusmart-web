import { describe, expect, it } from 'vitest'
import { PDFDocument, degrees } from 'pdf-lib'
import { MIN_KEEP, NO_MARGINS, clampMargins, cropPdf, detectContentMargins, isNoCrop, ptToMm, toUnrotated, type Margins } from './pdfCrop'

async function makePdf(opts: { pages?: number; rotate?: number; trim?: boolean } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < (opts.pages ?? 1); i++) {
    const p = doc.addPage([200, 400])
    if (opts.rotate) p.setRotation(degrees(opts.rotate))
    if (opts.trim) p.setTrimBox(0, 0, 200, 400)
  }
  return doc.save()
}

const boxes = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getCropBox())
const m = (top: number, right: number, bottom: number, left: number): Margins => ({ top, right, bottom, left })

describe('clampMargins', () => {
  it('deja intactos los márgenes válidos', () => {
    expect(clampMargins(m(0.1, 0.2, 0.3, 0.4))).toEqual(m(0.1, 0.2, 0.3, 0.4))
  })

  it('corrige valores fuera de rango o no numéricos', () => {
    expect(clampMargins(m(-1, Number.NaN, 0.2, 2))).toEqual(m(0, 0, 0.2, 1 - MIN_KEEP))
  })

  it('siempre deja al menos un 5 % de página, repartiendo el exceso', () => {
    const r = clampMargins(m(0.6, 0, 0.6, 0))
    expect(r.top + r.bottom).toBeCloseTo(1 - MIN_KEEP)
    expect(r.top).toBeCloseTo(r.bottom)
  })
})

describe('toUnrotated', () => {
  const view = m(0.1, 0.2, 0.3, 0.4)
  it('sin rotación no cambia', () => expect(toUnrotated(view, 0)).toEqual(view))
  it('90°: arriba en pantalla es la izquierda del PDF', () => expect(toUnrotated(view, 90)).toEqual({ left: 0.1, top: 0.2, right: 0.3, bottom: 0.4 }))
  it('180°: todo al revés', () => expect(toUnrotated(view, 180)).toEqual({ top: 0.3, right: 0.4, bottom: 0.1, left: 0.2 }))
  it('270° y -90° son lo mismo', () => {
    expect(toUnrotated(view, 270)).toEqual({ right: 0.1, bottom: 0.2, left: 0.3, top: 0.4 })
    expect(toUnrotated(view, -90)).toEqual(toUnrotated(view, 270))
  })
})

describe('cropPdf', () => {
  it('recorta todas las páginas con los márgenes pedidos', async () => {
    const out = await cropPdf(await makePdf({ pages: 2 }), m(0.25, 0.1, 0.25, 0.1))
    for (const b of await boxes(out)) {
      expect(b.x).toBeCloseTo(20)
      expect(b.y).toBeCloseTo(100)
      expect(b.width).toBeCloseTo(160)
      expect(b.height).toBeCloseTo(200)
    }
  })

  it('solo toca las páginas indicadas', async () => {
    const [a, b] = await boxes(await cropPdf(await makePdf({ pages: 2 }), m(0.5, 0, 0, 0), [1]))
    expect(a.height).toBeCloseTo(400)
    expect(b.height).toBeCloseTo(200)
    expect(b.y).toBeCloseTo(0)
  })

  it('respeta la rotación de la página', async () => {
    // Página de 200x400 girada 90°: se ve apaisada. Recortar "arriba" quita la izquierda del PDF.
    const [b] = await boxes(await cropPdf(await makePdf({ rotate: 90 }), m(0.5, 0, 0, 0)))
    expect(b.x).toBeCloseTo(100)
    expect(b.width).toBeCloseTo(100)
    expect(b.height).toBeCloseTo(400)
  })

  it('se acumula sobre un recorte anterior y alinea la TrimBox', async () => {
    const once = await cropPdf(await makePdf({ trim: true }), m(0, 0, 0, 0.5))
    const twice = await cropPdf(once, m(0, 0, 0, 0.5))
    const page = (await PDFDocument.load(twice)).getPage(0)
    expect(page.getCropBox().x).toBeCloseTo(150)
    expect(page.getCropBox().width).toBeCloseTo(50)
    expect(page.getTrimBox().x).toBeCloseTo(150)
  })
})

describe('detectContentMargins', () => {
  /** Imagen blanca de w×h con un rectángulo negro (o nada). */
  function img(w: number, h: number, rect?: [number, number, number, number], transparent = false) {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const inside = rect && x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3]
        const v = inside ? 0 : 255
        data.set([v, v, v, transparent && !inside ? 0 : 255], i)
      }
    return { data, width: w, height: h }
  }

  it('encuentra el contenido y deja un pequeño respiro', () => {
    const r = detectContentMargins(img(100, 200, [20, 40, 79, 159]), 245, 0)
    expect(r.left).toBeCloseTo(0.2)
    expect(r.right).toBeCloseTo(0.2)
    expect(r.top).toBeCloseTo(0.2)
    expect(r.bottom).toBeCloseTo(0.2)
    expect(detectContentMargins(img(100, 200, [20, 40, 79, 159])).left).toBeCloseTo(0.19)
  })

  it('el fondo transparente cuenta como blanco', () => {
    expect(detectContentMargins(img(50, 50, [10, 10, 39, 39], true), 245, 0).top).toBeCloseTo(0.2)
  })

  it('una página en blanco no se recorta', () => {
    expect(detectContentMargins(img(30, 30))).toEqual(NO_MARGINS)
    expect(isNoCrop(NO_MARGINS)).toBe(true)
    expect(isNoCrop(m(0.01, 0, 0, 0))).toBe(false)
  })
})

it('convierte puntos a milímetros', () => {
  expect(ptToMm(595.28)).toBe(210)
  expect(ptToMm(72)).toBe(25)
})
