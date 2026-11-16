import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { applyFilter, boxBlur, detectDocument, homography, insetQuad, otsu, outputSize, rotate90, scansToPdf, toGray, warpPerspective, type Pixels, type Quad } from './scan'

/** Imagen de w×h con fondo oscuro y un cuadrilátero claro (prueba de punto en polígono convexo). */
function photo(w: number, h: number, quad: Quad, bg = 40, paper = 230): Pixels {
  const data = new Uint8ClampedArray(w * h * 4)
  const inside = (x: number, y: number) =>
    quad.every((a, i) => {
      const b = quad[(i + 1) % 4]
      return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) >= 0
    })
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = inside(x + 0.5, y + 0.5) ? paper : bg
      data.set([v, v, v, 255], (y * w + x) * 4)
    }
  return { data, width: w, height: h }
}

const px = (p: Pixels, x: number, y: number) => [...p.data.slice((y * p.width + x) * 4, (y * p.width + x) * 4 + 4)]

describe('utilidades', () => {
  it('pasa a gris con pesos de luminancia', () => {
    const p = { data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]), width: 2, height: 1 }
    const g = toGray(p)
    expect(g[0]).toBeCloseTo(76.245)
    expect(g[1]).toBeCloseTo(29.07)
  })

  it('desenfoca promediando y deja igual una imagen pareja', () => {
    const flat = new Float32Array(25).fill(100)
    expect([...boxBlur(flat, 5, 5, 2)].every((v) => Math.abs(v - 100) < 1e-4)).toBe(true)
    const dot = new Float32Array(9)
    dot[4] = 90
    expect(boxBlur(dot, 3, 3, 1)[4]).toBeCloseTo(10)
    expect(boxBlur(dot, 3, 3, 0)).toEqual(dot)
  })

  it('Otsu separa dos grupos', () => {
    const g = new Float32Array([...Array(50).fill(30), ...Array(50).fill(220)])
    const t = otsu(g)
    expect(t).toBeGreaterThanOrEqual(30)
    expect(t).toBeLessThan(220)
  })
})

describe('detectDocument', () => {
  it('encuentra las esquinas de una hoja inclinada', () => {
    const q: Quad = [
      { x: 60, y: 40 },
      { x: 330, y: 70 },
      { x: 310, y: 380 },
      { x: 40, y: 350 },
    ]
    const found = detectDocument(photo(400, 420, q))!
    expect(found).not.toBeNull()
    found.forEach((c, i) => {
      expect(Math.abs(c.x * 400 - q[i].x)).toBeLessThan(6)
      expect(Math.abs(c.y * 420 - q[i].y)).toBeLessThan(6)
    })
  })

  it('devuelve null si no hay un documento claro', () => {
    // Todo de un solo color: nada que separar.
    expect(detectDocument(photo(100, 100, insetQuad(0).map((p) => ({ x: p.x * 100, y: p.y * 100 })) as Quad))).toBeNull()
    // Un papel diminuto
    expect(detectDocument(photo(200, 200, [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 30, y: 30 }, { x: 10, y: 30 }]))).toBeNull()
  })

  it('recuadro por defecto', () => {
    expect(insetQuad(0.1)[2]).toEqual({ x: 0.9, y: 0.9 })
  })
})

describe('perspectiva', () => {
  const q: Quad = [
    { x: 10, y: 20 },
    { x: 210, y: 5 },
    { x: 230, y: 300 },
    { x: 0, y: 280 },
  ]

  it('la homografía lleva cada esquina de la salida a la del documento', () => {
    const map = homography(q, 300, 400)
    const corners = [map(0, 0), map(300, 0), map(300, 400), map(0, 400)]
    corners.forEach((c, i) => {
      expect(c.x).toBeCloseTo(q[i].x)
      expect(c.y).toBeCloseTo(q[i].y)
    })
  })

  it('rechaza esquinas degeneradas', () => {
    const p = { x: 5, y: 5 }
    expect(() => homography([p, p, p, p], 10, 10)).toThrow('cuadrilátero')
  })

  it('el tamaño de salida usa los lados más largos y respeta el máximo', () => {
    expect(outputSize([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 120, y: 200 }, { x: 0, y: 200 }])).toEqual({ width: 120, height: 201 }) // lado derecho: √(20² + 200²) ≈ 201
    expect(outputSize([{ x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 3000 }, { x: 0, y: 3000 }])).toEqual({ width: 2400, height: 1200 })
  })

  it('endereza una hoja inclinada: el resultado es todo papel', () => {
    const doc: Quad = [
      { x: 60, y: 40 },
      { x: 330, y: 70 },
      { x: 310, y: 380 },
      { x: 40, y: 350 },
    ]
    const out = warpPerspective(photo(400, 420, doc), doc, 120, 160)
    expect([out.width, out.height]).toEqual([120, 160])
    // Lejos de los bordes, todo es papel claro.
    for (const [x, y] of [[10, 10], [60, 80], [110, 150], [5, 150]]) expect(px(out, x, y)[0]).toBeGreaterThan(200)
  })

  it('gira 90° en sentido horario', () => {
    // 2×1: rojo, azul → 1×2: rojo arriba, azul abajo
    const p = { data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]), width: 2, height: 1 }
    const r = rotate90(p)
    expect([r.width, r.height]).toEqual([1, 2])
    expect(px(r, 0, 0)).toEqual([255, 0, 0, 255])
    expect(px(r, 0, 1)).toEqual([0, 0, 255, 255])
  })
})

describe('filtros', () => {
  /** Papel con sombra (de 140 a 230 de izquierda a derecha) y una línea de texto oscura. */
  function shadowed(): Pixels {
    const w = 200
    const h = 100
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const paper = 140 + (90 * x) / w
        const v = y >= 48 && y < 52 ? paper * 0.3 : paper
        data.set([v, v * 0.95, v * 0.9, 255], (y * w + x) * 4)
      }
    return { data, width: w, height: h }
  }

  it('original no cambia nada', () => {
    const p = shadowed()
    expect(applyFilter(p, 'original')).toBe(p)
  })

  it('gris deja los tres canales iguales', () => {
    const [r, g, b, a] = px(applyFilter(shadowed(), 'gris'), 10, 10)
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(a).toBe(255)
  })

  it('documento blanquea el papel aunque tenga sombra y conserva el texto oscuro', () => {
    const out = applyFilter(shadowed(), 'documento')
    expect(px(out, 20, 10)[0]).toBeGreaterThan(235) // zona en sombra
    expect(px(out, 180, 10)[0]).toBeGreaterThan(235) // zona iluminada
    // Texto bien oscuro frente al papel (en esta imagen chica el fondo estimado incluye algo del texto).
    expect(px(out, 100, 50)[0]).toBeLessThan(90)
  })

  it('blanco y negro deja solo 0 o 255', () => {
    const out = applyFilter(shadowed(), 'bn')
    expect(px(out, 20, 10)[0]).toBe(255)
    expect(px(out, 100, 50)[0]).toBe(0)
    expect(new Set(Array.from(out.data).filter((_, i) => i % 4 === 0))).toEqual(new Set([0, 255]))
  })
})

describe('scansToPdf', () => {
  const JPG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))

  it('una página por documento, de ancho A4 y alto proporcional', async () => {
    const pdf = await PDFDocument.load(await scansToPdf([{ jpg: JPG, width: 1000, height: 1414 }, { jpg: JPG, width: 1600, height: 1000 }]))
    expect(pdf.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([[595, 841], [595, 372]])
  })

  it('exige al menos una página', async () => {
    await expect(scansToPdf([])).rejects.toThrow('al menos una página')
  })
})
