// W-147.5: fondo difuminado o de imagen, pincel para retocar el recorte y encuadre automático
// de la foto documento a partir de la silueta.
import { describe, expect, it } from 'vitest'
import { blurPx, coverRect, strokeDabs } from '../../../../../src/features/image/core/background'
import { HEAD_RATIO, TOP_MARGIN, frameFromMask } from '../../../../../src/features/image/core/idPhoto'

describe('fondo nuevo', () => {
  it('el desenfoque crece con la foto, con un mínimo', () => {
    expect(blurPx(3000, 2000)).toBe(50)
    expect(blurPx(100, 80)).toBe(4)
  })

  it('una imagen de fondo llena el recuadro sin deformarse', () => {
    // Fondo horizontal detrás de una foto vertical: se toma la franja del centro.
    expect(coverRect(1600, 900, 900, 1600)).toEqual({ sx: 546.875, sy: 0, sw: 506.25, sh: 900 })
    expect(coverRect(1000, 1000, 500, 500)).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 1000 })
  })
})

describe('pincel', () => {
  it('rellena con círculos intermedios un movimiento rápido', () => {
    const dabs = strokeDabs([[0, 0], [30, 0]], 9)
    // Paso de un tercio del radio (3 px): 10 círculos más el primero.
    expect(dabs).toHaveLength(11)
    expect(dabs[0]).toEqual([0, 0])
    expect(dabs[10]).toEqual([30, 0])
    expect(dabs.every(([, y]) => y === 0)).toBe(true)
    expect(strokeDabs([], 5)).toEqual([])
    expect(strokeDabs([[4, 4]], 5)).toEqual([[4, 4]])
  })
})

/** Silueta de prueba: cabeza (círculo) y hombros (rectángulo ancho) en una imagen de w × h. */
function silhouette(w: number, h: number, head: { cx: number; top: number; r: number }) {
  const a = new Uint8ClampedArray(w * h)
  const cy = head.top + head.r
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inHead = (x - head.cx) ** 2 + (y - cy) ** 2 <= head.r ** 2
      const neck = y > cy && y < cy + head.r * 1.4 && Math.abs(x - head.cx) < head.r * 0.45
      const shoulders = y >= cy + head.r * 1.4 && Math.abs(x - head.cx) < head.r * 2.6
      if (inHead || neck || shoulders) a[y * w + x] = 255
    }
  return a
}

describe('encuadre automático', () => {
  it('pone la cabeza con su margen arriba, centrada y con la proporción pedida', () => {
    const w = 400
    const h = 500
    const alpha = silhouette(w, h, { cx: 240, top: 60, r: 50 })
    const r = frameFromMask(alpha, w, h, 35 / 45)!
    expect(r).not.toBeNull()
    // Proporción 35 × 45 en pixeles.
    expect((r.w * w) / (r.h * h)).toBeCloseTo(35 / 45, 3)
    // La cabeza (ancho 101 px → alto ~131) ocupa la parte que piden los documentos.
    expect(r.h * h).toBeCloseTo((101 * 1.3) / HEAD_RATIO, 0)
    // La coronilla queda a la distancia del borde de arriba que se espera (±2 px: se toma la
    // primera fila con al menos un 2 % de ancho, no el punto más alto del círculo).
    expect(Math.abs(60 - r.y * h - TOP_MARGIN * r.h * h)).toBeLessThan(2)
    // Centrada a lo ancho sobre la cabeza.
    expect(r.x * w + (r.w * w) / 2).toBeCloseTo(240, 0)
  })

  it('si no cabe, se achica pero queda dentro de la foto', () => {
    const w = 200
    const h = 220
    const r = frameFromMask(silhouette(w, h, { cx: 30, top: 10, r: 60 }), w, h, 35 / 45)!
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.x + r.w).toBeLessThanOrEqual(1.0000001)
    expect(r.y + r.h).toBeLessThanOrEqual(1.0000001)
  })

  it('sin persona no hay encuadre', () => {
    expect(frameFromMask(new Uint8ClampedArray(100 * 100), 100, 100, 1)).toBeNull()
  })
})
