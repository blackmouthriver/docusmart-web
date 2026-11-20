/**
 * Foto tamaño documento (W-122): medidas, encuadre, hoja de impresión y resolución del JPG.
 * Partes puras (sin canvas), para poder probarlas; el dibujo está en infra/idPhotoCanvas.ts.
 */
import type { CropRect } from './imageTools'

/** Resolución de impresión: a 300 ppp la foto sale del tamaño exacto en cualquier impresora o laboratorio. */
export const ID_DPI = 300

/** Medida de la foto en milímetros (ancho × alto). */
export type IdSize = { w: number; h: number }

/** Medidas más pedidas. Los nombres (y para qué sirve cada una) están en los mensajes `idp.p.<id>`. */
export const ID_PRESETS = [
  { id: '35x45', w: 35, h: 45 },
  { id: '50x50', w: 50.8, h: 50.8 },
  { id: '30x40', w: 30, h: 40 },
  { id: '40x50', w: 40, h: 50 },
  { id: '25x30', w: 25, h: 30 },
] as const
export type IdPresetId = (typeof ID_PRESETS)[number]['id']

/** Límites de una medida escrita a mano, en mm. */
export const ID_MIN_MM = 10
export const ID_MAX_MM = 150

export const mmToPx = (mm: number, dpi = ID_DPI) => Math.max(1, Math.round((mm / 25.4) * dpi))

/** Tamaño en pixeles de la foto a 300 ppp. */
export const idPixels = (s: IdSize, dpi = ID_DPI) => ({ width: mmToPx(s.w, dpi), height: mmToPx(s.h, dpi) })

/** Medida escrita a mano ("35", "35,5"…) → mm, o null si falta o se sale de los límites. */
export function parseSizeMm(w: string, h: string): IdSize | null {
  const num = (v: string) => Number(v.trim().replace(',', '.'))
  const a = num(w)
  const b = num(h)
  const ok = (n: number) => Number.isFinite(n) && n >= ID_MIN_MM && n <= ID_MAX_MM
  return ok(a) && ok(b) ? { w: a, h: b } : null
}

/**
 * Recuadro inicial: el más grande con esa proporción, centrado a lo ancho y algo más arriba
 * que el centro (en un retrato la cara suele estar en la parte de arriba).
 */
export function portraitCrop(imgW: number, imgH: number, aspect: number): CropRect {
  const imgAspect = imgW / imgH
  if (aspect >= imgAspect) {
    const h = imgAspect / aspect
    return { x: 0, y: (1 - h) * 0.3, w: 1, h }
  }
  const w = aspect / imgAspect
  return { x: (1 - w) / 2, y: 0, w, h: 1 }
}

/** Hoja de papel fotográfico "10 × 15" (en realidad 4 × 6 pulgadas), en mm. */
export const PRINT_SHEET: IdSize = { w: 101.6, h: 152.4 }

export type SheetLayout = {
  /** La hoja, ya en la orientación que más copias admite. */
  sheet: IdSize
  cols: number
  rows: number
  /** Esquina superior izquierda de cada copia, en mm. */
  cells: Array<{ x: number; y: number }>
}

/** Cuántas copias caben y dónde van, centradas, con separación para recortar. */
export function sheetLayout(photo: IdSize, sheet: IdSize = PRINT_SHEET, gap = 2, margin = 3): SheetLayout {
  const fit = (s: IdSize) => {
    const cols = Math.max(0, Math.floor((s.w - 2 * margin + gap) / (photo.w + gap)))
    const rows = Math.max(0, Math.floor((s.h - 2 * margin + gap) / (photo.h + gap)))
    return { s, cols, rows }
  }
  const portrait = fit({ w: Math.min(sheet.w, sheet.h), h: Math.max(sheet.w, sheet.h) })
  const landscape = fit({ w: Math.max(sheet.w, sheet.h), h: Math.min(sheet.w, sheet.h) })
  const best = landscape.cols * landscape.rows > portrait.cols * portrait.rows ? landscape : portrait
  const { s, cols, rows } = best
  const x0 = (s.w - cols * photo.w - Math.max(0, cols - 1) * gap) / 2
  const y0 = (s.h - rows * photo.h - Math.max(0, rows - 1) * gap) / 2
  const cells: SheetLayout['cells'] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: x0 + c * (photo.w + gap), y: y0 + r * (photo.h + gap) })
  return { sheet: s, cols, rows, cells }
}

/**
 * Marca el JPG con su resolución (JFIF, en puntos por pulgada) para que al imprimirlo salga
 * del tamaño real. El canvas lo guarda sin unidades; si no trae cabecera JFIF, se agrega.
 */
export function setJpegDpi(jpeg: Uint8Array, dpi = ID_DPI): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('No es un JPG')
  const d = Math.max(1, Math.min(65535, Math.round(dpi)))
  const hi = d >> 8
  const lo = d & 0xff
  const jfif = jpeg.length >= 18 && jpeg[2] === 0xff && jpeg[3] === 0xe0 && String.fromCharCode(...jpeg.subarray(6, 11)) === 'JFIF\0'
  if (jfif) {
    const out = jpeg.slice()
    out[13] = 1 // unidades: puntos por pulgada
    out[14] = hi
    out[15] = lo
    out[16] = hi
    out[17] = lo
    return out
  }
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, hi, lo, hi, lo, 0x00, 0x00]
  const out = new Uint8Array(jpeg.length + app0.length)
  out.set(jpeg.subarray(0, 2))
  out.set(app0, 2)
  out.set(jpeg.subarray(2), 2 + app0.length)
  return out
}

/** "35 × 45 mm" o "50,8 × 50,8 mm" (con la coma o el punto del idioma). */
export function formatMm(s: IdSize, locale: string): string {
  const f = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 })
  return `${f(s.w)} × ${f(s.h)} mm`
}

/** "selfie.heic.jpg" + "foto-documento" → "selfie.heic-foto-documento.jpg" (siempre JPG). */
export function idPhotoName(name: string, suffix: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'foto'
  return `${base}-${suffix}.jpg`
}
