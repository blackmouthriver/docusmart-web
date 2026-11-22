// Editar y firmar tras la auditoría W-146.2: formularios en cualquier alfabeto, marca de agua
// derecha y con opciones, y campos rápidos al firmar (fecha, iniciales, texto y ✓).
import { PDFArray, PDFDocument, PDFName, PDFRawStream, StandardFonts, decodePDFRawStream, degrees } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { fillForm } from '../../../../../src/features/pdf/core/pdfForm'
import { markCenters, watermarkPdf, WATERMARK_POSITIONS } from '../../../../../src/features/pdf/core/pdfWatermark'
import { clampPlacement, signPdf } from '../../../../../src/features/pdf/core/pdfSign'

const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer
// PNG de 1×1 rojo.
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

async function sample(n: number, setup?: (doc: PDFDocument) => void | Promise<void>, updateFieldAppearances = true) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < n; i++) doc.addPage([595, 842]).drawText(`Contenido ${i + 1}`, { x: 60, y: 300, size: 18, font })
  await setup?.(doc)
  return doc.save({ updateFieldAppearances })
}

/** Textos de cada página tal como se ven: centro aproximado, ángulo en pantalla y tamaño de la página. */
async function seen(bytes: Uint8Array, match: RegExp) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: Array<{ page: number; str: string; cx: number; cy: number; angle: number; w: number; h: number }> = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    for (const it of (await page.getTextContent()).items as Array<{ str: string; transform: number[]; width: number }>) {
      if (!match.test(it.str)) continue
      const [a, b, , , e, f] = it.transform
      const len = Math.hypot(a, b) || 1
      // Punto medio de la línea base (en unidades del PDF) y luego a la vista.
      const [x, y] = vp.convertToViewportPoint(e + (a / len) * (it.width / 2), f + (b / len) * (it.width / 2))
      const [x0, y0] = vp.convertToViewportPoint(e, f)
      const [x1, y1] = vp.convertToViewportPoint(e + a, f + b)
      out.push({ page: i, str: it.str, cx: x, cy: y, angle: Math.round((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI), w: vp.width, h: vp.height })
    }
  }
  await task.destroy()
  return out
}

describe('formulario en cualquier alfabeto', () => {
  const form = () =>
    sample(1, (doc) => {
      const f = doc.getForm()
      f.createTextField('nombre').addToPage(doc.getPage(0), { x: 50, y: 700, width: 300, height: 24 })
      f.createTextField('ciudad').addToPage(doc.getPage(0), { x: 50, y: 660, width: 300, height: 24 })
      const dd = f.createDropdown('pais')
      dd.addOptions(['Colombia', 'Россия'])
      dd.addToPage(doc.getPage(0), { x: 50, y: 620, width: 200, height: 24 })
      const list = f.createOptionList('idiomas')
      list.addToPage(doc.getPage(0), { x: 50, y: 540, width: 200, height: 60 })
      list.addOptions(['Español', '日本語'])
    }, false)

  it('guarda el texto en ruso, japonés y coreano, y los signos latinos como la raya', async () => {
    const out = await PDFDocument.load(await fillForm(await form(), { nombre: 'Иван Петров', ciudad: 'Bogotá – Ñuñoa', pais: 'Россия', idiomas: ['日本語'] }))
    const f = out.getForm()
    expect(f.getTextField('nombre').getText()).toBe('Иван Петров')
    expect(f.getTextField('ciudad').getText()).toBe('Bogotá – Ñuñoa')
    expect(f.getDropdown('pais').getSelected()).toEqual(['Россия'])
    expect(f.getOptionList('idiomas').getSelected()).toEqual(['日本語'])
  })

  it('al aplanar, el texto no latino queda visible en la página', async () => {
    const flat = await fillForm(await form(), { nombre: '山田太郎', ciudad: '서울' }, { flatten: true })
    const texts = (await seen(flat, /./)).map((t) => t.str).join(' ')
    expect(texts).toContain('山田太郎')
    expect(texts).toContain('서울')
  })
})

describe('marca de agua', () => {
  it('derecha y centrada en páginas giradas (90, 180, 270) y con área visible desplazada', async () => {
    const src = await sample(5, (doc) => {
      doc.getPage(1).setRotation(degrees(90))
      doc.getPage(2).setRotation(degrees(180))
      doc.getPage(3).setRotation(degrees(270))
      doc.getPage(4).setCropBox(300, 400, 295, 442)
    })
    const marks = await seen(await watermarkPdf(ab(src), { text: 'CONFIDENCIAL', rotation: 0 }), /CONFIDENCIAL/)
    expect(marks.map((m) => m.page)).toEqual([1, 2, 3, 4, 5])
    for (const m of marks) {
      expect(m.angle, `página ${m.page}`).toBe(0)
      expect(Math.abs(m.cx - m.w / 2), `página ${m.page}`).toBeLessThan(m.w * 0.05)
      expect(Math.abs(m.cy - m.h / 2), `página ${m.page}`).toBeLessThan(m.h * 0.05)
    }
  })

  it('la rotación pedida se ve igual en todas las páginas, sea cual sea su giro', async () => {
    const src = await sample(2, (doc) => doc.getPage(1).setRotation(degrees(180)))
    const marks = await seen(await watermarkPdf(ab(src), { text: 'BORRADOR', rotation: 45 }), /BORRADOR/)
    // 45° hacia arriba: en pantalla (y hacia abajo) el ángulo es −45.
    expect(marks.map((m) => m.angle)).toEqual([-45, -45])
  })

  it('las 9 posiciones quedan en su lugar y el mosaico llena la página', () => {
    for (const p of WATERMARK_POSITIONS) {
      const [[u, v]] = markCenters(p, 600, 800, 200, 40, 0)
      const col = u < 200 ? 'left' : u > 400 ? 'right' : 'center'
      const row = v < 800 / 3 ? 'bottom' : v > (800 * 2) / 3 ? 'top' : 'middle'
      const want = p === 'center' ? ['middle', 'center'] : p.split('-')
      expect([row, col], p).toEqual(want)
    }
    const tiles = markCenters('mosaic', 600, 800, 120, 30, 45)
    expect(tiles.length).toBeGreaterThan(6)
    expect(Math.min(...tiles.map((t) => t[1]))).toBeLessThan(200)
    expect(Math.max(...tiles.map((t) => t[1]))).toBeGreaterThan(600)
  })

  it('solo en las páginas pedidas, con imagen, y detrás del contenido', async () => {
    const src = await sample(3)
    const only = await seen(await watermarkPdf(ab(src), { text: 'COPIA', pages: [0, 2] }), /COPIA/)
    expect(only.map((m) => m.page)).toEqual([1, 3])

    const withImage = await PDFDocument.load(await watermarkPdf(ab(src), { image: { data: PNG, format: 'png' }, position: 'mosaic' }))
    const xobjects = withImage.getPage(0).node.Resources()?.lookup(PDFName.of('XObject'))
    expect(xobjects).toBeDefined()

    // Detrás: el contenido de la marca va antes que el contenido original.
    const under = await PDFDocument.load(await watermarkPdf(ab(src), { text: 'FONDO', layer: 'under' }))
    const contents = under.getPage(0).node.get(PDFName.of('Contents')) as PDFArray
    const streams = contents.asArray().map((r) => {
      const st = under.context.lookup(r)
      return new TextDecoder('latin1').decode(st instanceof PDFRawStream ? decodePDFRawStream(st).decode() : (st as unknown as { getContents(): Uint8Array }).getContents())
    })
    // El original escribe "Contenido 1" (en hexadecimal con pdf-lib); la marca, "FONDO".
    const hex = (t: string) => Array.from(t, (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase()
    const has = (st: string, t: string) => st.includes(t) || st.toUpperCase().includes(hex(t))
    const markAt = streams.findIndex((st) => has(st, 'FONDO'))
    const originalAt = streams.findIndex((st) => has(st, 'Contenido'))
    expect(markAt).toBeGreaterThanOrEqual(0)
    expect(markAt).toBeLessThan(originalAt)
    expect((await seen(await under.save(), /FONDO/)).map((m) => m.page)).toEqual([1, 2, 3])
  })
})

describe('firmar con campos rápidos', () => {
  it('fecha y texto como texto real, dentro de su recuadro; iniciales y ✓ dibujados', async () => {
    const src = await sample(1, (doc) => doc.getPage(0).setRotation(degrees(90)))
    const out = await signPdf(
      src,
      { signature: PNG, initials: PNG },
      [
        { page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.1 },
        { page: 0, x: 0.6, y: 0.1, w: 0.1, h: 0.05, kind: 'initials' },
        { page: 0, x: 0.1, y: 0.5, w: 0.25, h: 0.05, kind: 'date', text: '22/11/2026' },
        { page: 0, x: 0.5, y: 0.5, w: 0.3, h: 0.05, kind: 'text', text: 'Иван Петров' },
        { page: 0, x: 0.8, y: 0.8, w: 0.05, h: 0.05, kind: 'check' },
      ],
      '#1D3FA8',
    )
    const marks = await seen(out, /22\/11\/2026|Иван/)
    expect(marks.map((m) => m.str)).toEqual(['22/11/2026', 'Иван Петров'])
    for (const m of marks) expect(m.angle).toBe(0)
    // La fecha queda dentro de su recuadro (x 10–35 %, y 50–55 % de la página vista).
    const date = marks[0]
    expect(date.cx / date.w).toBeGreaterThan(0.1)
    expect(date.cx / date.w).toBeLessThan(0.35)
    expect(date.cy / date.h).toBeGreaterThan(0.49)
    expect(date.cy / date.h).toBeLessThan(0.56)
    // Dos imágenes (firma e iniciales) y la ✓ como líneas.
    const doc = await PDFDocument.load(out)
    const names = doc.getPage(0).node.Resources()!.lookup(PDFName.of('XObject')) as unknown as { keys(): unknown[] }
    expect(names.keys().length).toBe(2)
  })

  it('al mover o cambiar el tamaño de un campo, conserva su tipo y su texto', () => {
    expect(clampPlacement({ page: 0, x: 0.95, y: -1, w: 0.2, h: 0.05, kind: 'date', text: '1/1/2027' })).toEqual({ page: 0, x: 0.8, y: 0, w: 0.2, h: 0.05, kind: 'date', text: '1/1/2027' })
  })

  it('sigue aceptando solo el PNG de la firma, como antes', async () => {
    const doc = await PDFDocument.load(await signPdf(await sample(1), PNG, [{ page: 0, x: 0.5, y: 0.5, w: 0.2, h: 0.1 }]))
    expect(doc.getPageCount()).toBe(1)
  })
})
