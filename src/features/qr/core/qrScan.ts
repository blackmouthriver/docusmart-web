/**
 * Leer QR en imágenes grandes (W-146.11): en qué escalas y zonas buscar. En una foto de 12 MP o
 * en una página escaneada, el QR de una factura queda demasiado chico si toda la imagen se
 * reduce a 1024 px; por eso, si no aparece, se busca a más resolución y por zonas. Parte pura;
 * el dibujo y jsQR están en infra/qrScan.ts.
 */

export type ScanStep = { x: number; y: number; w: number; h: number; /** Lado mayor al que se lleva la zona. */ maxSide: number }

/** Lado mayor de la pasada rápida (la de siempre). */
export const FAST_SIDE = 1024
/** Lado mayor de una zona en las pasadas detalladas (más es lento con jsQR). */
export const DETAIL_SIDE = 1600

/** Zonas de una cuadrícula de `n` × `n` que se superponen un 20 % (un QR en el borde queda entero en alguna). */
export function grid(w: number, h: number, n: number): Array<{ x: number; y: number; w: number; h: number }> {
  const tw = Math.ceil((w / n) * 1.2)
  const th = Math.ceil((h / n) * 1.2)
  const out: Array<{ x: number; y: number; w: number; h: number }> = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = n === 1 ? 0 : Math.round(((w - tw) * c) / (n - 1))
      const y = n === 1 ? 0 : Math.round(((h - th) * r) / (n - 1))
      out.push({ x: Math.max(0, x), y: Math.max(0, y), w: Math.min(tw, w), h: Math.min(th, h) })
    }
  }
  return out
}

/**
 * Las pasadas en orden: toda la imagen reducida (rápida); después, si la imagen es grande, toda
 * a más resolución y en zonas de 2 × 2 y 3 × 3 a casi su tamaño real.
 */
export function scanSteps(w: number, h: number): { fast: ScanStep[]; detail: ScanStep[] } {
  const fast: ScanStep[] = [{ x: 0, y: 0, w, h, maxSide: FAST_SIDE }]
  const detail: ScanStep[] = []
  const long = Math.max(w, h)
  if (long > FAST_SIDE) {
    detail.push({ x: 0, y: 0, w, h, maxSide: Math.min(long, 2048) })
    for (const n of long > 2400 ? [2, 3] : [2]) for (const z of grid(w, h, n)) detail.push({ ...z, maxSide: DETAIL_SIDE })
  }
  return { fast, detail }
}

/** Un código leído: el texto y su formato (qr_code, ean_13, pdf417…). */
export type ScannedCode = { value: string; format: string }

/** Agrega los códigos nuevos (el mismo texto y formato no se repite). */
export function mergeCodes(list: ScannedCode[], more: readonly ScannedCode[]): ScannedCode[] {
  const seen = new Set(list.map((c) => `${c.format}\u0000${c.value}`))
  for (const c of more) {
    const key = `${c.format}\u0000${c.value}`
    if (!seen.has(key) && c.value) {
      seen.add(key)
      list.push(c)
    }
  }
  return list
}

/** Nombre corto para mostrar el formato de un código de barras. */
export function formatLabel(format: string): string {
  const map: Record<string, string> = { qr_code: 'QR', ean_13: 'EAN-13', ean_8: 'EAN-8', upc_a: 'UPC-A', upc_e: 'UPC-E', code_128: 'Code 128', code_39: 'Code 39', code_93: 'Code 93', codabar: 'Codabar', itf: 'ITF', pdf417: 'PDF417', data_matrix: 'Data Matrix', aztec: 'Aztec' }
  return map[format] ?? format.toUpperCase()
}
