import { describe, expect, it } from 'vitest'
import {
  DIAGONAL,
  WATERMARK_POSITIONS,
  clampPercent,
  edgeMargin,
  isLight,
  markPlacement,
  markSize,
  parseColor,
  tileCenters,
} from '../../../../../src/features/image/core/watermark'

describe('tamaño de la marca', () => {
  it('ocupa el porcentaje pedido del ancho y conserva su proporción', () => {
    expect(markSize(1000, 800, 200, 50, 30)).toEqual({ width: 300, height: 75 })
  })

  it('en una imagen muy apaisada no se pasa del alto', () => {
    const s = markSize(2000, 100, 100, 100, 50)
    expect(s.height).toBe(100)
    expect(s.width).toBe(100)
  })

  it('una marca vacía no ocupa nada', () => {
    expect(markSize(1000, 800, 0, 50, 30)).toEqual({ width: 0, height: 0 })
  })

  it('clampPercent limita y tiene valor por defecto', () => {
    expect(clampPercent(150, 5, 90, 30)).toBe(90)
    expect(clampPercent(1, 5, 90, 30)).toBe(5)
    expect(clampPercent(42.4, 5, 90, 30)).toBe(42)
    expect(clampPercent(Number.NaN, 5, 90, 30)).toBe(30)
  })
})

describe('posición', () => {
  const W = 1000
  const H = 600
  const m = edgeMargin(W, H)

  it('el margen es el 3 % del lado corto', () => {
    expect(m).toBe(18)
  })

  it('las esquinas quedan pegadas al margen', () => {
    expect(markPlacement(W, H, 200, 40, 'tl')).toEqual({ cx: m + 100, cy: m + 20, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'br')).toEqual({ cx: W - m - 100, cy: H - m - 20, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'tr')).toEqual({ cx: W - m - 100, cy: m + 20, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'bl')).toEqual({ cx: m + 100, cy: H - m - 20, angle: 0 })
  })

  it('los bordes y el centro quedan centrados en su eje', () => {
    expect(markPlacement(W, H, 200, 40, 'tc')).toEqual({ cx: W / 2, cy: m + 20, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'ml')).toEqual({ cx: m + 100, cy: H / 2, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'c')).toEqual({ cx: W / 2, cy: H / 2, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'mr')).toEqual({ cx: W - m - 100, cy: H / 2, angle: 0 })
    expect(markPlacement(W, H, 200, 40, 'bc')).toEqual({ cx: W / 2, cy: H - m - 20, angle: 0 })
  })

  it('en diagonal va al centro, girada', () => {
    expect(markPlacement(W, H, 200, 40, 'diagonal')).toEqual({ cx: W / 2, cy: H / 2, angle: DIAGONAL })
  })

  it('todas las posiciones tienen nombre único', () => {
    expect(new Set(WATERMARK_POSITIONS).size).toBe(WATERMARK_POSITIONS.length)
  })
})

describe('mosaico', () => {
  it('cubre toda la imagen: cualquier punto tiene una copia cerca', () => {
    const W = 1200
    const H = 800
    const c = tileCenters(W, H, 240, 40)
    expect(c.length).toBeGreaterThan(6)
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2], [W / 3, (2 * H) / 3]]) {
      const nearest = Math.min(...c.map((p) => Math.hypot(p.cx - x, p.cy - y)))
      expect(nearest).toBeLessThan(240 * 1.6)
    }
  })

  it('solo copias que tocan la imagen', () => {
    for (const p of tileCenters(500, 500, 100, 20)) {
      expect(p.cx).toBeGreaterThan(-100)
      expect(p.cx).toBeLessThan(600)
      expect(p.cy).toBeGreaterThan(-100)
      expect(p.cy).toBeLessThan(600)
    }
  })

  it('una marca vacía no da copias', () => {
    expect(tileCenters(500, 500, 0, 20)).toEqual([])
  })
})

describe('color', () => {
  it('parseColor acepta solo #rrggbb', () => {
    expect(parseColor('#FF0000')).toBe('#ff0000')
    expect(parseColor('red')).toBe('#ffffff')
  })

  it('isLight distingue colores claros y oscuros', () => {
    expect(isLight('#ffffff')).toBe(true)
    expect(isLight('#ffeb3b')).toBe(true)
    expect(isLight('#000000')).toBe(false)
    expect(isLight('#1e3a8a')).toBe(false)
  })
})
