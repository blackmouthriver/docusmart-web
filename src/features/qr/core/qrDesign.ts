/**
 * Diseño del QR (W-85), como QrDesignSection/QrColorValidation de la app: 8 colores
 * fijos sobre fondo blanco, un contraste mínimo para que la cámara lo lea, y un logo
 * centrado que obliga a subir la corrección de errores.
 */

/** Los mismos colores y en el mismo orden que la app (el amarillo no pasa el contraste a propósito). */
export const QR_COLORS = [
  { id: 'black', hex: '#000000' },
  { id: 'blue', hex: '#1976D2' },
  { id: 'purple', hex: '#7B1FA2' },
  { id: 'green', hex: '#2E7D32' },
  { id: 'red', hex: '#C62828' },
  { id: 'orange', hex: '#E65100' },
  { id: 'teal', hex: '#00695C' },
  { id: 'yellow', hex: '#FBC02D' },
] as const

export type QrColorId = (typeof QR_COLORS)[number]['id']

/** Por debajo de 3:1 un QR empieza a fallar con cámaras comunes (umbral de la app). */
export const MIN_CONTRAST = 3

/** Luminancia relativa WCAG de un color `#RRGGBB`. */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0
  const n = parseInt(m[1], 16)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export const hasSufficientContrast = (hex: string, background = '#FFFFFF') => contrastRatio(hex, background) >= MIN_CONTRAST

/** Niveles de corrección a probar en orden: con logo, alto (H, si no entra Q); sin logo, M (si no entra L). */
export const errorLevels = (hasLogo: boolean): Array<'H' | 'Q' | 'M' | 'L'> => (hasLogo ? ['H', 'Q'] : ['M', 'L'])

/** Caja del logo dentro de un QR de `size` px: 22 % del ancho, centrado, con un margen blanco del 10 %. */
export function logoBox(size: number): { x: number; y: number; side: number; pad: number } {
  const side = Math.round(size * 0.22)
  const x = Math.round((size - side) / 2)
  return { x, y: x, side, pad: Math.round(side * 0.1) }
}

/** Tamaños de la imagen descargada. */
export const QR_SIZES = { s: 512, m: 1024, l: 2048 } as const
export type QrSize = keyof typeof QR_SIZES

/** Solo se incrusta un logo ya pasado a PNG/JPEG/WebP en base64 (nada de SVG ni HTML dentro). */
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

/**
 * SVG del QR (W-86, vector para imprimir sin perder calidad) con el logo encima, circular como
 * en el PNG (W-85b) y en la misma proporción (22 %), en las unidades del viewBox.
 */
export function svgWithLogo(svg: string, logoDataUrl: string | null): string {
  if (!logoDataUrl) return svg
  if (!LOGO_DATA_URL.test(logoDataUrl)) throw new Error('Logo inválido')
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!m) return svg
  const size = parseFloat(m[1])
  const side = size * 0.22
  const x = (size - side) / 2
  const pad = side * 0.1
  const n = (v: number) => +v.toFixed(3)
  const c = x + side / 2
  // Logo circular (W-85b): un círculo blanco de fondo y la imagen recortada en círculo.
  const extra =
    `<circle cx="${n(c)}" cy="${n(c)}" r="${n(side / 2 + pad)}" fill="#FFFFFF"/>` +
    `<clipPath id="ds-qr-logo"><circle cx="${n(c)}" cy="${n(c)}" r="${n(side / 2)}"/></clipPath>` +
    `<image x="${n(x)}" y="${n(x)}" width="${n(side)}" height="${n(side)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ds-qr-logo)" href="${logoDataUrl}"/>`
  return svg.replace(/<\/svg>\s*$/, `${extra}</svg>`)
}

/**
 * Recorte cuadrado del logo (W-85b): con zoom 1 toma el cuadrado más grande centrado; al
 * acercar se achica y el desplazamiento (en pixeles de la imagen) lo mueve sin salirse.
 */
export function cropSquare(width: number, height: number, zoom: number, offsetX: number, offsetY: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height) / Math.max(1, zoom)
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max))
  return { sx: clamp((width - size) / 2 + offsetX, width - size), sy: clamp((height - size) / 2 + offsetY, height - size), size }
}
