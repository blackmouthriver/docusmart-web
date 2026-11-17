/**
 * Censurar PDF de verdad: las páginas con zonas censuradas se reemplazan por una
 * imagen de la página con esas zonas en negro, así el texto, las imágenes y los
 * enlaces de debajo dejan de existir. Las demás páginas se copian tal cual.
 *
 * Las zonas se expresan como fracción (0 a 1) de la página tal como se ve, con
 * el origen arriba a la izquierda (igual que en Firmar y Recortar).
 */
import { PDFDocument } from 'pdf-lib'

export type Area = { page: number; x: number; y: number; w: number; h: number }

/** Página ya dibujada con las zonas en negro (la hace el navegador con un canvas). */
export type RasterPage = { image: Uint8Array; format: 'jpg' | 'png'; widthPt: number; heightPt: number }
export type Rasterizer = (pageIndex: number, areas: Area[]) => Promise<RasterPage>

/** Zonas agrupadas por página (base 0), solo las páginas que tienen alguna. */
export function groupByPage(areas: Area[]): Map<number, Area[]> {
  const map = new Map<number, Area[]>()
  for (const a of areas) map.set(a.page, [...(map.get(a.page) ?? []), a])
  return map
}

/** Mantiene la zona dentro de la página, con un tamaño mínimo visible. */
export function clampArea(a: Area, min = 0.005): Area {
  const w = Math.min(1, Math.max(min, a.w))
  const h = Math.min(1, Math.max(min, a.h))
  return { page: a.page, w, h, x: Math.min(1 - w, Math.max(0, a.x)), y: Math.min(1 - h, Math.max(0, a.y)) }
}

/** Zona a partir de dos esquinas cualesquiera (al dibujarla arrastrando en cualquier dirección). */
export function areaFromCorners(page: number, x1: number, y1: number, x2: number, y2: number): Area {
  const c = (n: number) => Math.min(1, Math.max(0, n))
  const [ax, bx] = [c(x1), c(x2)].sort((p, q) => p - q)
  const [ay, by] = [c(y1), c(y2)].sort((p, q) => p - q)
  return { page, x: ax, y: ay, w: bx - ax, h: by - ay }
}

/**
 * Arma el PDF censurado en un documento nuevo: así tampoco se arrastran los
 * metadatos (autor, título…), los marcadores ni los adjuntos del original.
 */
export async function redactPdf(bytes: ArrayBuffer | Uint8Array, areas: Area[], rasterize: Rasterizer): Promise<Uint8Array> {
  const byPage = groupByPage(areas)
  if (!byPage.size) throw new Error('Marca al menos una zona para censurar.')
  const src = await PDFDocument.load(bytes)
  const out = await PDFDocument.create()
  for (const i of src.getPageIndices()) {
    const pageAreas = byPage.get(i)
    if (!pageAreas) {
      const [copy] = await out.copyPages(src, [i])
      out.addPage(copy)
      continue
    }
    const r = await rasterize(i, pageAreas)
    const image = r.format === 'png' ? await out.embedPng(r.image) : await out.embedJpg(r.image)
    const page = out.addPage([r.widthPt, r.heightPt])
    page.drawImage(image, { x: 0, y: 0, width: r.widthPt, height: r.heightPt })
  }
  return out.save()
}

/* ───────────── Buscar texto para censurar ───────────── */

/** Un fragmento de texto de pdf.js: `transform` es la matriz [a, b, c, d, e, f]. */
export type TextItem = { str: string; transform: number[]; width: number }
/** Convierte un punto del PDF a fracción de la página vista (lo da el viewport de pdf.js). */
export type ToView = (x: number, y: number) => [number, number]

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Texto sin tildes ni mayúsculas, conservando la posición de cada carácter original. */
export function foldText(s: string): string {
  return Array.from(s, (ch) => stripAccents(ch).charAt(0) || ch).join('')
}

export type Matcher = (folded: string) => Array<[number, number]>

/** Busca una palabra o frase (sin importar tildes ni mayúsculas). */
export function phraseMatcher(query: string): Matcher {
  const q = foldText(query.trim())
  return (text) => {
    const found: Array<[number, number]> = []
    if (!q) return found
    for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + q.length)) found.push([i, i + q.length])
    return found
  }
}

function regexMatcher(re: RegExp): Matcher {
  return (text) => [...text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))].map((m) => [m.index, m.index + m[0].length])
}

/** Búsquedas listas para lo más común. */
export const PRESETS = {
  correos: regexMatcher(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/),
  // Cédulas, teléfonos, cuentas, tarjetas: 6 dígitos o más, con espacios, puntos o guiones.
  numeros: regexMatcher(/\+?\d[\d .-]{4,}\d/),
} satisfies Record<string, Matcher>

/**
 * Zonas de la página que cubren cada coincidencia. Calcula el ancho de la
 * coincidencia en proporción a su posición dentro del fragmento de texto.
 */
export function findTextAreas(page: number, items: TextItem[], match: Matcher, toView: ToView): Area[] {
  const areas: Area[] = []
  for (const item of items) {
    if (!item.str.trim()) continue
    const folded = foldText(item.str)
    const len = Array.from(item.str).length
    const [a, b, c, d, e, f] = item.transform
    const size = Math.hypot(c, d) || Math.hypot(a, b) || 10
    const dirLen = Math.hypot(a, b) || 1
    const ux = a / dirLen
    const uy = b / dirLen
    for (const [start, end] of match(folded)) {
      const x0 = (item.width * start) / len
      const x1 = (item.width * end) / len
      // Un poco por debajo de la línea base (descendentes) y hasta el alto de la letra.
      const corners = [
        [x0, -0.25 * size],
        [x1, -0.25 * size],
        [x0, 0.95 * size],
        [x1, 0.95 * size],
      ].map(([along, up]) => toView(e + ux * along - uy * up, f + uy * along + ux * up))
      const us = corners.map((p) => p[0])
      const vs = corners.map((p) => p[1])
      const pad = 0.002
      areas.push(clampArea({ page, x: Math.min(...us) - pad, y: Math.min(...vs) - pad, w: Math.max(...us) - Math.min(...us) + 2 * pad, h: Math.max(...vs) - Math.min(...vs) + 2 * pad }))
    }
  }
  return areas
}
