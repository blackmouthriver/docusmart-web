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

describe('SVG del QR (W-86)', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path d="M0 0h25v25H0z"/></svg>\n'
  const logo = 'data:image/png;base64,iVBORw0KGgo='

  it('agrega el círculo blanco y el logo recortado en círculo en el centro', async () => {
    const { svgWithLogo } = await import('../../../../../src/features/qr/core/qrDesign')
    const out = svgWithLogo(svg, logo)
    expect(out).toContain('<circle cx="12.5" cy="12.5" r="3.3" fill="#FFFFFF"/>')
    expect(out).toContain('<clipPath id="ds-qr-logo"><circle cx="12.5" cy="12.5" r="2.75"/></clipPath>')
    expect(out).toContain(`<image x="9.75" y="9.75" width="5.5" height="5.5" preserveAspectRatio="xMidYMid slice" clip-path="url(#ds-qr-logo)" href="${logo}"/></svg>`)
    expect(out.endsWith('</svg>')).toBe(true)
  })

  it('sin logo queda igual y rechaza lo que no sea una imagen en base64', async () => {
    const { svgWithLogo } = await import('../../../../../src/features/qr/core/qrDesign')
    expect(svgWithLogo(svg, null)).toBe(svg)
    expect(() => svgWithLogo(svg, 'data:image/svg+xml;base64,PHN2Zz4=')).toThrow()
    expect(() => svgWithLogo(svg, 'data:image/png;base64,"><script>')).toThrow()
    expect(svgWithLogo('<svg></svg>', logo)).toBe('<svg></svg>')
  })
})

it('arma un SVG real con la librería de QR y el logo encima', async () => {
  const [{ default: QRCode }, { svgWithLogo }] = await Promise.all([import('qrcode'), import('../../../../../src/features/qr/core/qrDesign')])
  const svg = await QRCode.toString('https://docusmart.online', { type: 'svg', margin: 2, errorCorrectionLevel: 'H', color: { dark: '#1976D2', light: '#FFFFFF' } })
  const out = svgWithLogo(svg, 'data:image/png;base64,iVBORw0KGgo=')
  expect(out.startsWith('<svg')).toBe(true)
  expect(out).toContain('stroke="#1976D2"')
  expect(out.indexOf('<image')).toBeGreaterThan(out.indexOf('<path'))
  expect(out.trim().endsWith('</svg>')).toBe(true)
})

it('recorta un cuadrado del logo con zoom y desplazamiento sin salirse de la imagen', async () => {
  const { cropSquare } = await import('../../../../../src/features/qr/core/qrDesign')
  expect(cropSquare(400, 200, 1, 0, 0)).toEqual({ sx: 100, sy: 0, size: 200 })
  expect(cropSquare(400, 200, 2, 0, 0)).toEqual({ sx: 150, sy: 50, size: 100 })
  expect(cropSquare(400, 200, 2, 1000, -1000)).toEqual({ sx: 300, sy: 0, size: 100 })
  expect(cropSquare(400, 200, 0.5, 0, 0)).toEqual({ sx: 100, sy: 0, size: 200 })
})
