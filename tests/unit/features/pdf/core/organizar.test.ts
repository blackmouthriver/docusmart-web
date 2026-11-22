// Organizar PDF tras la auditoría W-146.1: numerar en páginas giradas y recortadas, unir sin
// perder formularios ni marcadores, dividir en varios archivos y armar páginas.
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, StandardFonts, degrees } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { composePages, splitGroups } from '../../../../../src/features/pdf/core/pdfTools'
import { mergePdfs } from '../../../../../src/features/pdf/core/pdfMerge'
import { NUMBER_POSITIONS, numberPages, pageLabels, toPdfPoint } from '../../../../../src/features/pdf/core/pdfNumber'
import { chunkPages, parseRangeGroups } from '../../../../../src/shared/files/files'

const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer

async function sample(n: number, setup?: (doc: PDFDocument) => void | Promise<void>) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < n; i++) doc.addPage([595, 842]).drawText(`Contenido ${i + 1}`, { x: 60, y: 200, size: 18, font })
  await setup?.(doc)
  return doc.save()
}

/** Cada texto de la página tal como se ve: posición, ángulo y si queda dentro de lo visible. */
async function seen(bytes: Uint8Array, match: RegExp) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: Array<{ page: number; str: string; x: number; y: number; angle: number; w: number; h: number }> = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    for (const it of (await page.getTextContent()).items as Array<{ str: string; transform: number[] }>) {
      if (!match.test(it.str)) continue
      const [x, y] = vp.convertToViewportPoint(it.transform[4], it.transform[5])
      const [x2, y2] = vp.convertToViewportPoint(it.transform[4] + it.transform[0], it.transform[5] + it.transform[1])
      out.push({ page: i, str: it.str, x, y, angle: Math.round((Math.atan2(y2 - y, x2 - x) * 180) / Math.PI), w: vp.width, h: vp.height })
    }
  }
  await task.destroy()
  return out
}

describe('numerar páginas', () => {
  it('el texto de cada página: número inicial, portada sin número y {total}', () => {
    expect(pageLabels(4, { template: 'Página {n} de {total}', start: 1, skip: 1 })).toEqual([null, 'Página 1 de 3', 'Página 2 de 3', 'Página 3 de 3'])
    expect(pageLabels(3, { template: '{n}', start: 10, skip: 0 })).toEqual(['10', '11', '12'])
    // Sin {n}, el número va al final; saltar más páginas de las que hay no numera ninguna.
    expect(pageLabels(2, { template: 'Pág.', start: 1, skip: 0 })).toEqual(['Pág. 1', 'Pág. 2'])
    expect(pageLabels(2, { template: '{n}', start: 1, skip: 9 })).toEqual([null, null])
  })

  it('convierte la posición vista a coordenadas del PDF en las 4 rotaciones', () => {
    const box = { x: 10, y: 20, width: 100, height: 200 }
    expect(toPdfPoint(5, 7, box, 0)).toEqual({ x: 15, y: 27 })
    expect(toPdfPoint(5, 7, box, 90)).toEqual({ x: 103, y: 25 })
    expect(toPdfPoint(5, 7, box, 180)).toEqual({ x: 105, y: 213 })
    expect(toPdfPoint(5, 7, box, 270)).toEqual({ x: 17, y: 215 })
    expect(toPdfPoint(5, 7, box, -90)).toEqual(toPdfPoint(5, 7, box, 270))
  })

  it('en páginas giradas y recortadas el número sale derecho, abajo y dentro de lo visible', async () => {
    const src = await sample(5, (doc) => {
      doc.getPage(1).setRotation(degrees(90))
      doc.getPage(2).setCropBox(100, 100, 395, 642)
      doc.getPage(3).setRotation(degrees(180))
      doc.getPage(4).setRotation(degrees(270))
    })
    const marks = await seen(await numberPages(ab(src), { template: '{n} / {total}' }), /\d+ \/ 5/)
    expect(marks.map((m) => m.page)).toEqual([1, 2, 3, 4, 5])
    for (const m of marks) {
      expect(m.angle, `página ${m.page}`).toBe(0)
      expect(m.x, `página ${m.page}`).toBeGreaterThan(m.w * 0.3)
      expect(m.x, `página ${m.page}`).toBeLessThan(m.w * 0.7)
      expect(m.y, `página ${m.page}`).toBeGreaterThan(m.h * 0.9)
      expect(m.y, `página ${m.page}`).toBeLessThanOrEqual(m.h)
    }
  })

  it('las 6 posiciones quedan en su esquina o centro, con el tamaño pedido', async () => {
    const src = await sample(1)
    for (const position of NUMBER_POSITIONS) {
      const [m] = await seen(await numberPages(ab(src), { position, size: 14 }), /^1$/)
      const [vert, horiz] = position.split('-')
      expect(m.y < m.h / 2, position).toBe(vert === 'top')
      const third = m.x < m.w / 3 ? 'left' : m.x > (m.w * 2) / 3 ? 'right' : 'center'
      expect(third, position).toBe(horiz)
    }
  })

  it('con texto no latino usa las fuentes de DocuSmart', async () => {
    const out = await numberPages(ab(await sample(2)), { template: 'Страница {n}' })
    expect((await seen(out, /Страница/)).length).toBe(2)
  })
})

describe('unir PDFs', () => {
  const withForm = (name: string) =>
    sample(1, (doc) => {
      doc.getForm().createTextField(name).addToPage(doc.getPage(0), { x: 50, y: 600 })
      doc.getForm().getTextField(name).setText('hola')
      doc.setTitle('Contrato')
    })

  /** PDF con dos marcadores: uno con /Dest directo y otro con acción GoTo a un destino con nombre. */
  const withOutline = () =>
    sample(3, (doc) => {
      const ctx = doc.context
      const root = ctx.nextRef()
      const a = ctx.nextRef()
      const b = ctx.nextRef()
      const pages = doc.getPages()
      ctx.assign(a, ctx.obj({ Title: PDFHexString.fromText('Capítulo 1'), Parent: root, Next: b, Dest: [pages[0].ref, 'Fit'] }))
      ctx.assign(b, ctx.obj({ Title: PDFHexString.fromText('Capítulo 2'), Parent: root, Prev: a, A: { S: 'GoTo', D: PDFHexString.fromText('cap2') } }))
      ctx.assign(root, ctx.obj({ Type: 'Outlines', First: a, Last: b, Count: 2 }))
      doc.catalog.set(PDFName.of('Outlines'), root)
      const names = ctx.obj({ Names: [PDFHexString.fromText('cap2'), ctx.obj([pages[2].ref, 'Fit'])] })
      doc.catalog.set(PDFName.of('Names'), ctx.obj({ Dests: names }))
    })

  /** Marcadores del resultado: título y número de página de destino (base 1), con sus hijos. */
  function outline(doc: PDFDocument) {
    const pageNo = new Map(doc.getPages().map((p, i) => [p.ref.toString(), i + 1]))
    const walk = (first: unknown): unknown[] => {
      const list = []
      let item = first ? doc.context.lookupMaybe(first as PDFRef, PDFDict) : undefined
      while (item) {
        const dest = item.lookupMaybe(PDFName.of('Dest'), PDFArray)
        const kids = walk(item.get(PDFName.of('First')))
        list.push({ title: (item.get(PDFName.of('Title')) as PDFHexString).decodeText(), page: dest ? pageNo.get(dest.get(0).toString()) : null, ...(kids.length && { kids }) })
        const next = item.get(PDFName.of('Next'))
        item = next ? doc.context.lookupMaybe(next as PDFRef, PDFDict) : undefined
      }
      return list
    }
    return walk(doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)?.get(PDFName.of('First')))
  }

  it('conserva los campos de formulario de cada archivo, sin que se pisen los nombres, y el título', async () => {
    const out = await PDFDocument.load(await mergePdfs([{ bytes: await withForm('nombre') }, { bytes: await withForm('nombre') }, { bytes: await sample(1) }]))
    expect(out.getPageCount()).toBe(3)
    const fields = out.getForm().getFields().map((f) => f.getName())
    expect(fields).toEqual(['nombre', 'nombre_2'])
    expect(out.getForm().getTextField('nombre_2').getText()).toBe('hola')
    expect(out.getTitle()).toBe('Contrato')
  })

  it('conserva los marcadores apuntando a las páginas nuevas (también los de destino con nombre)', async () => {
    const out = await PDFDocument.load(await mergePdfs([{ bytes: await sample(2) }, { bytes: await withOutline() }]))
    expect(outline(out)).toEqual([
      { title: 'Capítulo 1', page: 3 },
      { title: 'Capítulo 2', page: 5 },
    ])
  })

  it('con "un marcador por archivo", cada archivo tiene el suyo con sus marcadores adentro', async () => {
    const out = await PDFDocument.load(await mergePdfs([{ bytes: await sample(2), name: 'portada.pdf' }, { bytes: await withOutline(), name: 'informe.pdf' }], { bookmarks: 'perFile' }))
    expect(outline(out)).toEqual([
      { title: 'portada', page: 1 },
      { title: 'informe', page: 3, kids: [{ title: 'Capítulo 1', page: 3 }, { title: 'Capítulo 2', page: 5 }] },
    ])
  })

  it('resuelve destinos con nombre antiguos (/Dests), árboles con hijos y descarta los que no apuntan a nada', async () => {
    const src = await sample(3, (doc) => {
      const ctx = doc.context
      const pages = doc.getPages()
      const root = ctx.nextRef()
      const refs = [ctx.nextRef(), ctx.nextRef(), ctx.nextRef(), ctx.nextRef()]
      const items = [
        { Title: PDFHexString.fromText('Antiguo'), Dest: PDFName.of('viejo') },
        { Title: PDFHexString.fromText('En hijos'), Dest: PDFHexString.fromText('hondo') },
        { Title: PDFHexString.fromText('Con diccionario'), A: { S: 'GoTo', D: PDFHexString.fromText('dicc') } },
        { Title: PDFHexString.fromText('Roto'), Dest: PDFHexString.fromText('no-existe') },
      ]
      items.forEach((it, i) => ctx.assign(refs[i], ctx.obj({ ...it, Parent: root, ...(i < 3 && { Next: refs[i + 1] }) })))
      ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[3], Count: 4 }))
      doc.catalog.set(PDFName.of('Outlines'), root)
      doc.catalog.set(PDFName.of('Dests'), ctx.obj({ viejo: [pages[1].ref, 'Fit'] }))
      const leaf = ctx.obj({ Names: [PDFHexString.fromText('dicc'), ctx.obj({ D: [pages[0].ref, 'Fit'] }), PDFHexString.fromText('hondo'), ctx.register(ctx.obj([pages[2].ref, 'XYZ', 0, 0, 0]))] })
      doc.catalog.set(PDFName.of('Names'), ctx.obj({ Dests: ctx.obj({ Kids: [ctx.register(leaf)] }) }))
    })
    const out = await PDFDocument.load(await mergePdfs([{ bytes: src }]))
    expect(outline(out)).toEqual([
      { title: 'Antiguo', page: 2 },
      { title: 'En hijos', page: 3 },
      { title: 'Con diccionario', page: 1 },
      { title: 'Roto', page: null },
    ])
  })

  it('un grupo de opciones (varios widgets, un campo) se agrega una sola vez', async () => {
    const radios = () =>
      sample(1, (doc) => {
        const group = doc.getForm().createRadioGroup('pago')
        group.addOptionToPage('efectivo', doc.getPage(0), { x: 50, y: 500 })
        group.addOptionToPage('tarjeta', doc.getPage(0), { x: 50, y: 450 })
      })
    const out = await PDFDocument.load(await mergePdfs([{ bytes: await radios() }, { bytes: await radios() }]))
    expect(out.getForm().getFields().map((f) => f.getName())).toEqual(['pago', 'pago_2'])
  })

  it('sin formularios ni marcadores no agrega nada de más', async () => {
    const out = await PDFDocument.load(await mergePdfs([{ bytes: await sample(1) }, { bytes: await sample(1) }]))
    expect(out.catalog.has(PDFName.of('AcroForm'))).toBe(false)
    expect(out.catalog.has(PDFName.of('Outlines'))).toBe(false)
  })
})

describe('dividir y armar páginas', () => {
  it('rangos: un grupo por parte, en el orden escrito', () => {
    expect(parseRangeGroups('1-3, 4-8, 10', 10)).toEqual([[0, 1, 2], [3, 4, 5, 6, 7], [9]])
    expect(parseRangeGroups('5, 1-2', 5)).toEqual([[4], [0, 1]])
    expect(parseRangeGroups('8-', 10)).toEqual([[7, 8, 9]])
    expect(parseRangeGroups('1-3, x', 10)).toBeNull()
    expect(parseRangeGroups(' , ', 10)).toBeNull()
    expect(parseRangeGroups('11', 10)).toBeNull()
  })

  it('cada N páginas', () => {
    expect(chunkPages(7, 3)).toEqual([[0, 1, 2], [3, 4, 5], [6]])
    expect(chunkPages(2, 5)).toEqual([[0, 1]])
    expect(chunkPages(3, 0)).toEqual([[0], [1], [2]])
  })

  it('splitGroups hace un PDF por grupo', async () => {
    const parts = await splitGroups(ab(await sample(6)), [[0, 1], [5, 2]])
    const counts = await Promise.all(parts.map(async (p) => (await PDFDocument.load(p)).getPageCount()))
    expect(counts).toEqual([2, 2])
    expect((await seen(parts[1], /Contenido/)).map((m) => m.str)).toEqual(['Contenido 6', 'Contenido 3'])
  })

  it('composePages: duplica páginas e inserta hojas en blanco del tamaño de la vecina', async () => {
    const src = await sample(2, (doc) => doc.getPage(1).setSize(300, 400))
    const out = await composePages(ab(src), [0, 'blank', 1, 1, 'blank'])
    const doc = await PDFDocument.load(out)
    expect(doc.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([
      [595, 842],
      [595, 842],
      [300, 400],
      [300, 400],
      [300, 400],
    ])
    expect((await seen(out, /Contenido/)).map((m) => `${m.page}:${m.str}`)).toEqual(['1:Contenido 1', '3:Contenido 2', '4:Contenido 2'])
    // Solo hojas en blanco: tamaño A4.
    const blank = await PDFDocument.load(await composePages(ab(src), ['blank']))
    expect(Math.round(blank.getPage(0).getWidth())).toBe(595)
  })
})
