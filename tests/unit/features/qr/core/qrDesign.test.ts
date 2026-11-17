import { describe, expect, it } from 'vitest'
import { MIN_CONTRAST, QR_COLORS, contrastRatio, errorLevels, hasSufficientContrast, logoBox, luminance } from '../../../../../src/features/qr/core/qrDesign'

describe('diseño del QR', () => {
  it('calcula luminancia y contraste WCAG', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1)
    expect(luminance('#000000')).toBe(0)
    expect(luminance('no es color')).toBe(0)
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21)
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21)
  })

  it('como en la app, los 7 primeros colores pasan el contraste y el amarillo no', () => {
    const ok = QR_COLORS.map((c) => hasSufficientContrast(c.hex))
    expect(ok).toEqual([true, true, true, true, true, true, true, false])
    expect(MIN_CONTRAST).toBe(3)
  })

  it('sube la corrección de errores con logo', () => {
    expect(errorLevels(true)).toEqual(['H', 'Q'])
    expect(errorLevels(false)).toEqual(['M', 'L'])
  })

  it('centra el logo en el 22 % del ancho con margen', () => {
    expect(logoBox(1000)).toEqual({ x: 390, y: 390, side: 220, pad: 22 })
  })
})
