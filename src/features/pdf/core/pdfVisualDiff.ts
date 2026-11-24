/**
 * Comparar PDF visualmente (W-147.7), como Adobe e iLovePDF: las dos versiones de cada página se
 * dibujan al mismo ancho y se comparan pixel a pixel. Así se ven también los cambios en imágenes,
 * colores, firmas o diseño, que la comparación de texto no detecta.
 *
 * Todo trabaja sobre pixeles RGBA (como ImageData), para probarlo sin canvas.
 */

export type Pixels = { data: Uint8ClampedArray; width: number; height: number }
/** Zona que cambió, en fracciones de la página (0 a 1). */
export type Box = { x: number; y: number; w: number; h: number }

export type PageDiff = {
  /** Parte de la página que cambió (0 a 1). */
  changed: number
  /** Zonas que cambiaron, de arriba abajo. */
  boxes: Box[]
  /** Imagen superpuesta: lo igual en gris claro, lo quitado en rojo, lo agregado en verde y lo que cambió de color en ámbar. */
  overlay: Pixels
}

export type DiffOptions = {
  /** Diferencia mínima (0 a 255) en algún canal para contar un pixel como distinto. */
  threshold?: number
  /** Lado de la cuadrícula con que se agrupan los pixeles distintos en zonas. */
  cell?: number
}

const REMOVED = [220, 38, 38]
const ADDED = [22, 163, 74]
const RECOLORED = [217, 119, 6]
/** Más claro que esto es papel (fondo), no contenido. */
const PAPER = 235

const lum = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]

/**
 * Compara dos páginas dibujadas al mismo ancho (pueden tener distinto alto: lo que falta cuenta
 * como blanco). Los pixeles transparentes se toman como blanco, como se ve el papel.
 */
export function diffPages(a: Pixels, b: Pixels, o: DiffOptions = {}): PageDiff {
  const threshold = o.threshold ?? 48
  const cell = Math.max(2, Math.round(o.cell ?? 12))
  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const out = new Uint8ClampedArray(width * height * 4)
  const cols = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)
  const cells = new Uint8Array(cols * rows)
  const white = new Uint8ClampedArray([255, 255, 255, 255])
  /** El color de un pixel sobre papel blanco (aplica la transparencia). */
  const px = (p: Pixels, x: number, y: number, into: Uint8ClampedArray) => {
    if (x >= p.width || y >= p.height) return into.set(white)
    const i = (y * p.width + x) * 4
    const alpha = p.data[i + 3] / 255
    for (let c = 0; c < 3; c++) into[c] = p.data[i + c] * alpha + 255 * (1 - alpha)
    into[3] = 255
  }
  const pa = new Uint8ClampedArray(4)
  const pb = new Uint8ClampedArray(4)
  let changed = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      px(a, x, y, pa)
      px(b, x, y, pb)
      const o4 = (y * width + x) * 4
      const diff = Math.max(Math.abs(pa[0] - pb[0]), Math.abs(pa[1] - pb[1]), Math.abs(pa[2] - pb[2]))
      if (diff >= threshold) {
        changed++
        cells[Math.floor(y / cell) * cols + Math.floor(x / cell)] = 1
        // Contenido en las dos: cambió de color. Solo en el original: se quitó. Solo en la nueva: se agregó.
        const la = lum(pa, 0)
        const lb = lum(pb, 0)
        if (la < PAPER && lb < PAPER) out.set(RECOLORED, o4)
        else out.set(la < lb ? REMOVED : ADDED, o4)
      } else {
        // Lo que no cambió, en gris claro para que resalten los cambios.
        const v = 255 - (255 - lum(pb, 0)) * 0.3
        out[o4] = out[o4 + 1] = out[o4 + 2] = v
      }
      out[o4 + 3] = 255
    }
  }
  const boxes = cellBoxes(cells, cols, rows).map((r) => {
    const x0 = Math.max(0, r.x0 * cell - 4)
    const y0 = Math.max(0, r.y0 * cell - 4)
    const x1 = Math.min(width, (r.x1 + 1) * cell + 4)
    const y1 = Math.min(height, (r.y1 + 1) * cell + 4)
    return { x: x0 / width, y: y0 / height, w: (x1 - x0) / width, h: (y1 - y0) / height }
  })
  return { changed: changed / Math.max(1, width * height), boxes, overlay: { data: out, width, height } }
}

/** Celdas marcadas que se tocan (también en diagonal) → rectángulos, de arriba abajo. */
export function cellBoxes(cells: Uint8Array, cols: number, rows: number): Array<{ x0: number; y0: number; x1: number; y1: number }> {
  const seen = new Uint8Array(cells.length)
  const out: Array<{ x0: number; y0: number; x1: number; y1: number }> = []
  const stack: number[] = []
  for (let start = 0; start < cells.length; start++) {
    if (!cells[start] || seen[start]) continue
    const box = { x0: cols, y0: rows, x1: -1, y1: -1 }
    seen[start] = 1
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      const x = i % cols
      const y = (i - x) / cols
      box.x0 = Math.min(box.x0, x)
      box.y0 = Math.min(box.y0, y)
      box.x1 = Math.max(box.x1, x)
      box.y1 = Math.max(box.y1, y)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const n = ny * cols + nx
          if (cells[n] && !seen[n]) {
            seen[n] = 1
            stack.push(n)
          }
        }
    }
    out.push(box)
  }
  return out.sort((p, q) => p.y0 - q.y0 || p.x0 - q.x0)
}

/** Resultado de una página al comparar dos PDF. */
export type VisualPage = { page: number; status: 'same' | 'changed' | 'onlyA' | 'onlyB'; changed: number; boxes: Box[] }

/** Resumen de la comparación visual: cuántas páginas cambiaron y cuáles están solo en uno. */
export function visualSummary(pages: VisualPage[]): { changed: number[]; onlyA: number[]; onlyB: number[]; same: boolean } {
  const pick = (s: VisualPage['status']) => pages.filter((p) => p.status === s).map((p) => p.page)
  const changed = pick('changed')
  const onlyA = pick('onlyA')
  const onlyB = pick('onlyB')
  return { changed, onlyA, onlyB, same: !changed.length && !onlyA.length && !onlyB.length }
}

/** Informe en PDF: una página por cada página con cambios (la imagen superpuesta), a ancho A4. */
export async function visualReportPdf(items: Array<{ jpg: Uint8Array; width: number; height: number }>, title: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  for (const it of items) {
    const img = await doc.embedJpg(it.jpg)
    const W = 595
    const H = Math.round((W * it.height) / Math.max(1, it.width))
    doc.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H })
  }
  return doc.save()
}
