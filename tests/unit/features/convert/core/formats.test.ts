import { describe, expect, it } from 'vitest'
import UTIF from 'utif2'
import {
  ICO_SIZES,
  SVG_MAX_SIDE,
  SVG_MIN_SIDE,
  containSquare,
  icoFromPngs,
  isSvg,
  isTiff,
  looksSpecial,
  specialImage,
  svgRenderSize,
} from '../../../../../src/features/convert/core/formats'
import { HEIC_SQUARES, SVG_LOGO, tinyTiff } from '../../../../e2e/fixtures'

const text = (s: string) => new TextEncoder().encode(s)

describe('reconocer formatos', () => {
  it('TIFF Intel y Motorola', () => {
    expect(isTiff(new Uint8Array(tinyTiff(2, 2, [1, 2, 3])))).toBe(true)
    expect(isTiff(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8]))).toBe(true)
    expect(isTiff(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false)
    expect(isTiff(new Uint8Array([0x49, 0x49]))).toBe(false)
  })

  it('SVG con declaración XML, comentarios o DOCTYPE delante', () => {
    expect(isSvg(new Uint8Array(SVG_LOGO))).toBe(true)
    expect(isSvg(text('<svg viewBox="0 0 1 1"></svg>'))).toBe(true)
    expect(isSvg(text('﻿  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x"><!-- a --><svg>'))).toBe(true)
    expect(isSvg(text('<html><svg></svg></html>'))).toBe(false)
    expect(isSvg(text('<svgfoo>'))).toBe(false)
    expect(isSvg(text('hola'))).toBe(false)
  })

  it('specialImage distingue HEIC, TIFF y SVG del resto', () => {
    expect(specialImage(new Uint8Array(HEIC_SQUARES))).toBe('heic')
    expect(specialImage(new Uint8Array(tinyTiff(1, 1, [0, 0, 0])))).toBe('tiff')
    expect(specialImage(new Uint8Array(SVG_LOGO))).toBe('svg')
    expect(specialImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBeNull()
  })

  it('looksSpecial por nombre o tipo', () => {
    expect(looksSpecial('logo.SVG', '')).toBe(true)
    expect(looksSpecial('escaneo.tif', '')).toBe(true)
    expect(looksSpecial('x', 'image/tiff')).toBe(true)
    expect(looksSpecial('x', 'image/svg+xml')).toBe(true)
    expect(looksSpecial('IMG.heic', '')).toBe(true)
    expect(looksSpecial('foto.jpg', 'image/jpeg')).toBe(false)
  })
})

describe('tamaño de un SVG', () => {
  it('uno pequeño se agranda hasta el lado mínimo, conservando la proporción', () => {
    expect(svgRenderSize(SVG_LOGO.toString('utf-8'))).toEqual({ width: SVG_MIN_SIDE, height: SVG_MIN_SIDE / 2 })
  })

  it('usa el viewBox si no hay width/height, y completa el lado que falta', () => {
    expect(svgRenderSize('<svg viewBox="0 0 2000 1000">')).toEqual({ width: 2000, height: 1000 })
    expect(svgRenderSize('<svg width="1500" viewBox="0 0 300 100">')).toEqual({ width: 1500, height: 500 })
    expect(svgRenderSize("<svg height='1200px' viewBox='0,0,100,200'>")).toEqual({ width: 600, height: 1200 })
  })

  it('nunca pasa del lado máximo, y sin medidas usa 300 × 150 como el navegador', () => {
    expect(svgRenderSize('<svg width="10000" height="5000">')).toEqual({ width: SVG_MAX_SIDE, height: SVG_MAX_SIDE / 2 })
    expect(svgRenderSize('<svg>')).toEqual({ width: SVG_MIN_SIDE, height: SVG_MIN_SIDE / 2 })
    // Medidas en porcentaje o em no se pueden usar: se ignoran.
    expect(svgRenderSize('<svg width="100%" height="50%" viewBox="0 0 1200 600">')).toEqual({ width: 1200, height: 600 })
  })
})

describe('favicon .ico', () => {
  it('containSquare centra la imagen completa', () => {
    expect(containSquare(200, 100, 32)).toEqual({ x: 0, y: 8, width: 32, height: 16 })
    expect(containSquare(100, 200, 32)).toEqual({ x: 8, y: 0, width: 16, height: 32 })
    expect(containSquare(50, 50, 16)).toEqual({ x: 0, y: 0, width: 16, height: 16 })
  })

  it('arma la cabecera y el directorio con cada PNG en su lugar', () => {
    const pngs = ICO_SIZES.map((size, i) => ({ size, png: new Uint8Array(10 + i).fill(i + 1) }))
    const ico = icoFromPngs(pngs)
    const v = new DataView(ico.buffer)
    expect(v.getUint16(0, true)).toBe(0)
    expect(v.getUint16(2, true)).toBe(1)
    expect(v.getUint16(4, true)).toBe(ICO_SIZES.length)
    pngs.forEach((e, i) => {
      const at = 6 + 16 * i
      expect(ico[at]).toBe(e.size === 256 ? 0 : e.size)
      expect(v.getUint16(at + 6, true)).toBe(32)
      const len = v.getUint32(at + 8, true)
      const off = v.getUint32(at + 12, true)
      expect(len).toBe(e.png.length)
      expect(Array.from(ico.subarray(off, off + len))).toEqual(Array.from(e.png))
    })
    expect(ico.length).toBe(6 + 16 * pngs.length + pngs.reduce((n, e) => n + e.png.length, 0))
  })

  it('rechaza un ícono vacío o de un tamaño imposible', () => {
    expect(() => icoFromPngs([])).toThrow()
    expect(() => icoFromPngs([{ size: 300, png: new Uint8Array(1) }])).toThrow()
  })
})

describe('TIFF de prueba', () => {
  it('UTIF (el decodificador que usa la web) lo lee con su color', () => {
    const tiff = tinyTiff(3, 2, [200, 50, 10])
    const buf = new Uint8Array(tiff).buffer
    const [page] = UTIF.decode(buf)
    UTIF.decodeImage(buf, page)
    expect([page.width, page.height]).toEqual([3, 2])
    expect(Array.from(UTIF.toRGBA8(page).slice(0, 4))).toEqual([200, 50, 10, 255])
  })
})
