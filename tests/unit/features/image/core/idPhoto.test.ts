import { describe, expect, it } from 'vitest'
import {
  ID_PRESETS,
  PRINT_SHEET,
  formatMm,
  idPhotoName,
  idPixels,
  mmToPx,
  parseSizeMm,
  portraitCrop,
  setJpegDpi,
  sheetLayout,
} from '../../../../../src/features/image/core/idPhoto'
import { lockAspect } from '../../../../../src/features/image/core/imageTools'

describe('medidas', () => {
  it('mm a pixeles a 300 ppp', () => {
    expect(mmToPx(25.4)).toBe(300)
    expect(idPixels({ w: 35, h: 45 })).toEqual({ width: 413, height: 531 })
    expect(idPixels({ w: 50.8, h: 50.8 })).toEqual({ width: 600, height: 600 })
    expect(mmToPx(0)).toBe(1)
  })

  it('las medidas predefinidas son retratos o cuadradas y con ids únicos', () => {
    expect(new Set(ID_PRESETS.map((p) => p.id)).size).toBe(ID_PRESETS.length)
    for (const p of ID_PRESETS) expect(p.h).toBeGreaterThanOrEqual(p.w)
  })

  it('parseSizeMm acepta coma o punto y rechaza lo que se sale de los límites', () => {
    expect(parseSizeMm('35', '45')).toEqual({ w: 35, h: 45 })
    expect(parseSizeMm(' 35,5 ', '45.5')).toEqual({ w: 35.5, h: 45.5 })
    expect(parseSizeMm('', '45')).toBeNull()
    expect(parseSizeMm('9', '45')).toBeNull()
    expect(parseSizeMm('35', '151')).toBeNull()
    expect(parseSizeMm('abc', '45')).toBeNull()
  })

  it('formatMm usa el separador decimal del idioma', () => {
    expect(formatMm({ w: 50.8, h: 50.8 }, 'es')).toBe('50,8 × 50,8 mm')
    expect(formatMm({ w: 50.8, h: 50.8 }, 'en')).toBe('50.8 × 50.8 mm')
    expect(formatMm({ w: 35, h: 45 }, 'es')).toBe('35 × 45 mm')
  })

  it('el nombre del resultado siempre es JPG', () => {
    expect(idPhotoName('selfie.png', 'foto-documento')).toBe('selfie-foto-documento.jpg')
    expect(idPhotoName('.jpg', 'foto-documento')).toBe('foto-foto-documento.jpg')
  })
})

describe('encuadre', () => {
  // La proporción es en pixeles (ancho / alto), como en Recortar; el recuadro, en fracciones de la imagen.
  const pxRatio = (r: { w: number; h: number }, imgW: number, imgH: number) => (r.w * imgW) / (r.h * imgH)

  it('en una foto vertical alta, ocupa todo el ancho y queda algo arriba del centro', () => {
    const r = portraitCrop(1000, 2000, 35 / 45)
    expect(r.x).toBe(0)
    expect(r.w).toBe(1)
    expect(pxRatio(r, 1000, 2000)).toBeCloseTo(35 / 45)
    expect(r.y).toBeGreaterThan(0)
    expect(r.y).toBeLessThan((1 - r.h) / 2)
  })

  it('en una foto horizontal, ocupa todo el alto y queda centrado a lo ancho', () => {
    const r = portraitCrop(2000, 1000, 35 / 45)
    expect(r).toMatchObject({ y: 0, h: 1 })
    expect(r.x + r.w / 2).toBeCloseTo(0.5)
    expect(pxRatio(r, 2000, 1000)).toBeCloseTo(35 / 45)
  })

  it('lockAspect mantiene la proporción y no se sale por abajo', () => {
    const a = 35 / 45
    const r = lockAspect({ x: 0.1, y: 0.1, w: 0.2, h: 0.2 }, 1600, 900, a)
    expect(pxRatio(r, 1600, 900)).toBeCloseTo(a)
    expect(r.w).toBe(0.2)
    const low = lockAspect({ x: 0, y: 0.8, w: 0.9, h: 0.1 }, 1600, 900, a)
    expect(low.y + low.h).toBeCloseTo(1)
    expect(pxRatio(low, 1600, 900)).toBeCloseTo(a)
  })
})

describe('hoja para imprimir', () => {
  it('3,5 × 4,5 cm: 8 copias en la hoja acostada', () => {
    const l = sheetLayout({ w: 35, h: 45 })
    expect(l.cells).toHaveLength(8)
    expect(l.sheet).toEqual({ w: PRINT_SHEET.h, h: PRINT_SHEET.w })
    expect([l.cols, l.rows]).toEqual([4, 2])
  })

  it('2 × 2 in: 2 copias en la hoja derecha', () => {
    const l = sheetLayout({ w: 50.8, h: 50.8 })
    expect(l.cells.length).toBeGreaterThanOrEqual(2)
  })

  it('las copias quedan dentro de la hoja, sin tocarse y centradas', () => {
    for (const p of ID_PRESETS) {
      const l = sheetLayout(p)
      expect(l.cells.length).toBeGreaterThan(0)
      for (const c of l.cells) {
        expect(c.x).toBeGreaterThanOrEqual(3 - 1e-9)
        expect(c.y).toBeGreaterThanOrEqual(3 - 1e-9)
        expect(c.x + p.w).toBeLessThanOrEqual(l.sheet.w - 3 + 1e-9)
        expect(c.y + p.h).toBeLessThanOrEqual(l.sheet.h - 3 + 1e-9)
      }
      const xs = l.cells.map((c) => c.x)
      expect(Math.min(...xs) + Math.max(...xs) + p.w).toBeCloseTo(l.sheet.w)
    }
  })

  it('una foto más grande que la hoja no da copias', () => {
    expect(sheetLayout({ w: 150, h: 150 }).cells).toHaveLength(0)
  })
})

describe('resolución del JPG', () => {
  const jfif = () =>
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0xff, 0xd9])

  it('cambia la cabecera JFIF a 300 ppp sin tocar el resto', () => {
    const src = jfif()
    const out = setJpegDpi(src)
    expect(out.length).toBe(src.length)
    expect(Array.from(out.subarray(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c])
    expect(Array.from(out.subarray(18))).toEqual(Array.from(src.subarray(18)))
    // No modifica el original.
    expect(src[13]).toBe(0)
  })

  it('si no hay cabecera JFIF, la agrega después del inicio', () => {
    const src = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9])
    const out = setJpegDpi(src, 300)
    expect(out.length).toBe(src.length + 18)
    expect(Array.from(out.subarray(0, 4))).toEqual([0xff, 0xd8, 0xff, 0xe0])
    expect(String.fromCharCode(...out.subarray(6, 11))).toBe('JFIF\0')
    expect(Array.from(out.subarray(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c])
    expect(Array.from(out.subarray(20))).toEqual(Array.from(src.subarray(2)))
  })

  it('rechaza lo que no es JPG', () => {
    expect(() => setJpegDpi(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrow()
  })
})
