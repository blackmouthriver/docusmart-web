import { describe, expect, it } from 'vitest'
import {
  IDENTITY,
  MAX_SIDE,
  capSize,
  centeredCrop,
  cropPixels,
  fitSize,
  isIdentity,
  marginsToRect,
  outputMime,
  outputName,
  planCompression,
  rectToMargins,
  rotateBy,
  rotatedSize,
  savedPercent,
} from './imageTools'

describe('formatos y nombres', () => {
  it('conserva JPG, PNG y WebP; lo demás sale como PNG', () => {
    expect(outputMime('image/jpeg')).toBe('image/jpeg')
    expect(outputMime('image/webp')).toBe('image/webp')
    expect(outputMime('image/gif')).toBe('image/png')
    expect(outputMime('')).toBe('image/png')
  })

  it('arma el nombre de salida', () => {
    expect(outputName('foto.final.JPG', 'comprimida', 'image/jpeg')).toBe('foto.final-comprimida.jpg')
    expect(outputName('logo', 'recortada', 'image/png')).toBe('logo-recortada.png')
    expect(outputName('.png', 'x', 'image/webp')).toBe('imagen-x.webp')
  })
})

describe('fitSize', () => {
  it('por porcentaje', () => {
    expect(fitSize(1000, 500, { mode: 'percent', percent: 50 })).toEqual({ width: 500, height: 250 })
    expect(fitSize(3, 3, { mode: 'percent', percent: 0 })).toEqual({ width: 1, height: 1 })
  })

  it('por pixeles conservando la proporción', () => {
    expect(fitSize(1000, 500, { mode: 'pixels', width: 400, height: null, keepRatio: true })).toEqual({ width: 400, height: 200 })
    expect(fitSize(1000, 500, { mode: 'pixels', width: null, height: 100, keepRatio: true })).toEqual({ width: 200, height: 100 })
    // Con los dos lados, manda el que más reduce
    expect(fitSize(1000, 500, { mode: 'pixels', width: 400, height: 100, keepRatio: true })).toEqual({ width: 200, height: 100 })
    expect(fitSize(1000, 500, { mode: 'pixels', width: null, height: null, keepRatio: true })).toEqual({ width: 1000, height: 500 })
  })

  it('por pixeles libres (puede deformar)', () => {
    expect(fitSize(1000, 500, { mode: 'pixels', width: 300, height: 300, keepRatio: false })).toEqual({ width: 300, height: 300 })
    expect(fitSize(1000, 500, { mode: 'pixels', width: 300, height: null, keepRatio: false })).toEqual({ width: 300, height: 500 })
  })

  it('nunca pasa del lado máximo y conserva la proporción al limitar', () => {
    expect(fitSize(10000, 5000, { mode: 'percent', percent: 400 })).toEqual({ width: MAX_SIDE, height: MAX_SIDE / 2 })
  })
})

describe('comprimir', () => {
  it('elige formato según la transparencia y calidad según el nivel', () => {
    expect(planCompression('baja', false)).toEqual({ mime: 'image/jpeg', quality: 0.86, maxSide: MAX_SIDE })
    expect(planCompression('media', true)).toEqual({ mime: 'image/webp', quality: 0.74, maxSide: 2560 })
    expect(planCompression('alta', false)).toMatchObject({ quality: 0.6, maxSide: 1600 })
  })

  it('limita el lado sin agrandar', () => {
    expect(capSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(capSize(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('calcula el ahorro', () => {
    expect(savedPercent(1000, 250)).toBe(75)
    expect(savedPercent(1000, 1100)).toBe(-10)
    expect(savedPercent(0, 10)).toBe(0)
  })
})

describe('rotar', () => {
  it('acumula giros en ambos sentidos', () => {
    expect(rotateBy(IDENTITY, 90).rotate).toBe(90)
    expect(rotateBy(IDENTITY, -90).rotate).toBe(270)
    expect(rotateBy(rotateBy({ ...IDENTITY, rotate: 270 }, 90), 90).rotate).toBe(90)
  })

  it('intercambia ancho y alto al girar 90° o 270°', () => {
    expect(rotatedSize(400, 300, { ...IDENTITY, rotate: 90 })).toEqual({ width: 300, height: 400 })
    expect(rotatedSize(400, 300, { ...IDENTITY, rotate: 180 })).toEqual({ width: 400, height: 300 })
  })

  it('reconoce la transformación nula', () => {
    expect(isIdentity(IDENTITY)).toBe(true)
    expect(isIdentity({ ...IDENTITY, flipH: true })).toBe(false)
  })
})

describe('recortar', () => {
  it('recuadro centrado con la proporción pedida', () => {
    expect(centeredCrop(400, 200, null)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    // Imagen 2:1 recortada a 1:1 → ancho de la mitad, centrado
    expect(centeredCrop(400, 200, 1)).toEqual({ x: 0.25, y: 0, w: 0.5, h: 1 })
    // Imagen 2:1 recortada a 4:1 → alto de la mitad
    expect(centeredCrop(400, 200, 4)).toEqual({ x: 0, y: 0.25, w: 1, h: 0.5 })
  })

  it('pasa a pixeles enteros dentro de la imagen', () => {
    expect(cropPixels(400, 200, { x: 0.25, y: 0, w: 0.5, h: 1 })).toEqual({ x: 100, y: 0, width: 200, height: 200 })
    expect(cropPixels(10, 10, { x: 0.99, y: 1.2, w: 0.5, h: 0 })).toEqual({ x: 9, y: 9, width: 1, height: 1 })
  })

  it('convierte entre márgenes y recuadro', () => {
    const r = { x: 0.1, y: 0.2, w: 0.5, h: 0.6 }
    const m = rectToMargins(r)
    expect(m.right).toBeCloseTo(0.4)
    expect(m.bottom).toBeCloseTo(0.2)
    const back = marginsToRect(m)
    expect(back.w).toBeCloseTo(0.5)
    expect(back.h).toBeCloseTo(0.6)
  })
})
