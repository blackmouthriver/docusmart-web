import { describe, expect, it } from 'vitest'
import { MAX_ANGLE, NEUTRAL, applyAdjustments, clampAdjust, isNeutral, signed, straightenSize, toneTable } from '../../../../../src/features/image/core/adjust'

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba)

describe('valores', () => {
  it('neutro, límites y signo', () => {
    expect(isNeutral(NEUTRAL)).toBe(true)
    expect(isNeutral({ ...NEUTRAL, grayscale: true })).toBe(false)
    expect(isNeutral({ ...NEUTRAL, angle: -0.5 })).toBe(false)
    expect(clampAdjust(150)).toBe(100)
    expect(clampAdjust(-150)).toBe(-100)
    expect(clampAdjust(20, MAX_ANGLE)).toBe(15)
    expect(clampAdjust(2.34)).toBe(2.3)
    expect(clampAdjust(Number.NaN)).toBe(0)
    expect(signed(20)).toBe('+20')
    expect(signed(-5)).toBe('-5')
    expect(signed(0)).toBe('0')
  })
})

describe('brillo y contraste', () => {
  it('sin cambios, la tabla es la identidad', () => {
    const lut = toneTable(0, 0)
    for (let v = 0; v < 256; v++) expect(lut[v]).toBe(v)
  })

  it('el brillo sube o baja todos los tonos por igual (sin pasarse de 0 o 255)', () => {
    const up = toneTable(50, 0)
    expect(up[100]).toBe(164)
    expect(up[250]).toBe(255)
    const down = toneTable(-50, 0)
    expect(down[100]).toBe(36)
    expect(down[10]).toBe(0)
  })

  it('el contraste separa los tonos del gris medio (o los junta si es negativo)', () => {
    const more = toneTable(0, 50)
    expect(more[128]).toBe(128)
    expect(more[64]).toBeLessThan(64)
    expect(more[192]).toBeGreaterThan(192)
    const less = toneTable(0, -50)
    expect(less[64]).toBeGreaterThan(64)
    expect(less[192]).toBeLessThan(192)
    // Siempre crece: nunca invierte los tonos.
    for (const lut of [more, less, toneTable(0, 100), toneTable(0, -100)]) for (let v = 1; v < 256; v++) expect(lut[v]).toBeGreaterThanOrEqual(lut[v - 1])
  })
})

describe('color', () => {
  it('blanco y negro deja los tres canales iguales y conserva la luz', () => {
    const p = applyAdjustments(px(200, 100, 50, 255, 0, 0, 255, 128), { ...NEUTRAL, grayscale: true })
    expect(p[0]).toBe(p[1])
    expect(p[1]).toBe(p[2])
    expect(p[0]).toBe(Math.round(0.299 * 200 + 0.587 * 100 + 0.114 * 50))
    expect(p[4]).toBe(p[6])
    // La transparencia no cambia.
    expect(p[3]).toBe(255)
    expect(p[7]).toBe(128)
  })

  it('la saturación aumenta o reduce la diferencia con el gris', () => {
    const more = applyAdjustments(px(200, 100, 100, 255), { ...NEUTRAL, saturation: 50 })
    expect(more[0] - more[1]).toBeGreaterThan(100)
    const less = applyAdjustments(px(200, 100, 100, 255), { ...NEUTRAL, saturation: -50 })
    expect(less[0] - less[1]).toBeLessThan(100)
    const gray = applyAdjustments(px(200, 100, 100, 255), { ...NEUTRAL, saturation: -100 })
    expect(gray[0]).toBe(gray[1])
  })

  it('sin ajustes los pixeles quedan iguales', () => {
    expect(Array.from(applyAdjustments(px(12, 34, 56, 78), NEUTRAL))).toEqual([12, 34, 56, 78])
  })
})

describe('enderezar', () => {
  it('sin giro, el tamaño no cambia', () => {
    expect(straightenSize(1200, 800, 0)).toEqual({ width: 1200, height: 800 })
  })

  it('con giro, recorta conservando la proporción y sin esquinas vacías', () => {
    for (const angle of [3, -3, 10, 15]) {
      const { width, height } = straightenSize(1200, 800, angle)
      expect(width).toBeLessThan(1200)
      expect(width / height).toBeCloseTo(1.5, 2)
      // Las cuatro esquinas del recorte, giradas al revés, caen dentro de la foto original.
      const t = (angle * Math.PI) / 180
      for (const [x, y] of [[width / 2, height / 2], [width / 2, -height / 2]]) {
        const u = x * Math.cos(t) + y * Math.sin(t)
        const v = -x * Math.sin(t) + y * Math.cos(t)
        expect(Math.abs(u)).toBeLessThanOrEqual(600 + 1e-6)
        expect(Math.abs(v)).toBeLessThanOrEqual(400 + 1e-6)
      }
    }
  })

  it('el mismo giro a un lado o al otro da el mismo tamaño, y no pasa de 15°', () => {
    expect(straightenSize(1000, 1000, 7)).toEqual(straightenSize(1000, 1000, -7))
    expect(straightenSize(1000, 600, 40)).toEqual(straightenSize(1000, 600, MAX_ANGLE))
  })
})
