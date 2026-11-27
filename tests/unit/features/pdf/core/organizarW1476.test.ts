// W-147.6: al unir, elegir páginas de cada archivo; dividir por marcadores o por tamaño; color del
// número de página.
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, StandardFonts, rgb } from 'pdf-lib'
import { OPS, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { mergePdfs, pickPages, topBookmarks } from '../../../../../src/features/pdf/core/pdfMerge'
import { bookmarkGroups, fileSafe, splitBySize } from '../../../../../src/features/pdf/core/pdfSplit'
import { numberPages } from '../../../../../src/features/pdf/core/pdfNumber'

/** PDF de n páginas con "Página k" escrito y, si se pide, marcadores en esas páginas (base 0). */
async function sample(n: number, marks: Array<[string, number]> = [], tag = 'P') {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < n; i++) doc.addPage([300, 400]).drawText(`${tag}${i + 1}`, { x: 40, y: 200, size: 18, font })
  if (marks.length) {
    const ctx = doc.context
    const root = ctx.nextRef()
    const refs = marks.map(() => ctx.nextRef())
    const pages = doc.getPages()
    marks.forEach(([title, page], i) =>
      ctx.assign(refs[i], ctx.obj({ Title: PDFHexString.fromText(title), Parent: root, ...(i && { Prev: refs[i - 1] }), ...(i < refs.length - 1 && { Next: refs[i + 1] }), Dest: [pages[page].ref, 'Fit'] })),
    )
    ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[refs.length - 1], Count: refs.length }))
    doc.catalog.set(PDFName.of('Outlines'), root)
  }
  return doc.save()
}

/** El texto de cada página, leído con pdf.js. */
async function labels(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: string[] = []
  for (let i = 1; i <= doc.numPages; i++) out.push((await (await doc.getPage(i)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(''))
  await task.destroy()
  return out
}

function outline(doc: PDFDocument) {
  const pageNo = new Map(doc.getPages().map((p, i) => [p.ref.toString(), i + 1]))
  const list: Array<{ title: string; page: number | null }> = []
  let item = doc.context.lookupMaybe(doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)?.get(PDFName.of('First')) as PDFRef, PDFDict)
  while (item) {
    const dest = item.lookupMaybe(PDFName.of('Dest'), PDFArray)
    list.push({ title: (item.get(PDFName.of('Title')) as PDFHexString).decodeText(), page: dest ? pageNo.get(dest.get(0).toString())! : null })
    const next = item.get(PDFName.of('Next'))
    item = next ? doc.context.lookupMaybe(next as PDFRef, PDFDict) : undefined
  }
  return list
}

describe('unir eligiendo páginas de cada archivo', () => {
  it('entran solo las páginas pedidas, en ese orden, y los marcadores de las que quedaron afuera se quitan', async () => {
    const a = await sample(4, [['Intro', 0], ['Anexo', 3]], 'A')
    const b = await sample(3, [], 'B')
    const out = await PDFDocument.load(await mergePdfs([{ bytes: a, pages: [3, 1] }, { bytes: b }]))
    expect(await labels(await out.save())).toEqual(['A4', 'A2', 'B1', 'B2', 'B3'])
    expect(outline(out)).toEqual([{ title: 'Anexo', page: 1 }])
  })

  it('una página repetida entra dos veces y el marcador va a la primera', async () => {
    const a = await sample(2, [['Uno', 1]], 'A')
    const out = await PDFDocument.load(await mergePdfs([{ bytes: a, pages: [1, 0, 1] }, { bytes: await sample(1, [], 'B') }]))
    expect(await labels(await out.save())).toEqual(['A2', 'A1', 'A2', 'B1'])
    expect(outline(out)).toEqual([{ title: 'Uno', page: 1 }])
  })

  it('descarta páginas que no existen y avisa si no queda ninguna', () => {
    expect(pickPages([0, 5, -1, 1.5, 2], 3)).toEqual([0, 2])
    expect(() => pickPages([7], 3)).toThrow(RangeError)
  })
})

describe('dividir por marcadores', () => {
  it('lee los marcadores del primer nivel con su página', async () => {
    const r = await topBookmarks(await sample(6, [['Capítulo 1', 1], ['Capítulo 2', 4]]))
    expect(r).toEqual({ count: 6, marks: [{ title: 'Capítulo 1', page: 1 }, { title: 'Capítulo 2', page: 4 }] })
    expect((await topBookmarks(await sample(2))).marks).toEqual([])
  })

  it('un grupo por capítulo, más las páginas de antes del primero', () => {
    expect(bookmarkGroups(6, [{ title: 'Uno', page: 1 }, { title: 'Dos', page: 4 }])).toEqual([
      { title: null, pages: [0] },
      { title: 'Uno', pages: [1, 2, 3] },
      { title: 'Dos', pages: [4, 5] },
    ])
  })

  it('ordena por página, junta los que empiezan en la misma y descarta los que no existen', () => {
    expect(bookmarkGroups(5, [{ title: 'B', page: 3 }, { title: 'A', page: 0 }, { title: 'A bis', page: 0 }, { title: 'X', page: 9 }, { title: '', page: 4 }])).toEqual([
      { title: 'A', pages: [0, 1, 2] },
      { title: 'B', pages: [3] },
      { title: null, pages: [4] },
    ])
    expect(bookmarkGroups(3, [])).toEqual([])
  })

  it('el título sirve como nombre de archivo', () => {
    expect(fileSafe('  Capítulo 1: "Inicio" / parte\t2? ')).toBe('Capítulo 1 Inicio parte 2')
    expect(fileSafe('a'.repeat(80))).toHaveLength(60)
    expect(fileSafe('Fin...')).toBe('Fin')
  })
})

describe('dividir por tamaño', () => {
  /** Páginas con mucho texto distinto, para que cada una pese algo parecido. */
  async function heavy(n: number) {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Courier)
    for (let i = 0; i < n; i++) {
      const page = doc.addPage([300, 400])
      for (let l = 0; l < 40; l++) page.drawText(`${i}-${l} ${'x'.repeat(30)}${Math.sin(i * 40 + l)}`, { x: 10, y: 390 - l * 9, size: 6, font, color: rgb(0, 0, 0) })
    }
    return doc.save({ useObjectStreams: false })
  }

  it('cada parte queda bajo el máximo, son páginas seguidas y no falta ninguna', async () => {
    const bytes = await heavy(12)
    const progress: number[] = []
    const max = 9000
    const r = await splitBySize(bytes, max, (done) => progress.push(done))
    expect(r.groups.length).toBeGreaterThan(1)
    expect(r.groups.flat()).toEqual(Array.from({ length: 12 }, (_, i) => i))
    expect(r.oversize).toEqual([])
    r.files.forEach((f) => expect(f.length).toBeLessThanOrEqual(max))
    for (const [i, f] of r.files.entries()) expect((await PDFDocument.load(f)).getPageCount()).toBe(r.groups[i].length)
    // Cada parte es la más grande posible: con una página más se pasaría. El margen de 32 bytes es porque la
    // fecha de guardado va comprimida y el tamaño puede cambiar un byte de un segundo a otro; una página pesa cientos.
    const one = await splitBySize(bytes, r.files[0].length + 32)
    expect(one.groups[0]).toEqual(r.groups[0])
    expect(progress.at(-1)).toBe(12)
  })

  it('si todo cabe sale un solo archivo; una página que sola ya pasa queda aparte', async () => {
    const bytes = await heavy(3)
    expect((await splitBySize(bytes, 10_000_000)).groups).toEqual([[0, 1, 2]])
    const tiny = await splitBySize(bytes, 100)
    expect(tiny.groups).toEqual([[0], [1], [2]])
    expect(tiny.oversize).toEqual([0, 1, 2])
  })
})

describe('color del número de página', () => {
  /** El color de relleno con que se dibuja el número (r, g, b de 0 a 255). */
  const fill = async (bytes: Uint8Array) => {
    const task = getDocument({ data: bytes.slice() })
    const page = await (await task.promise).getPage(1)
    const ops = await page.getOperatorList()
    const i = ops.fnArray.indexOf(OPS.setFillRGBColor)
    const arg = ops.argsArray[i] as unknown[]
    await task.destroy()
    // pdf.js lo entrega como "#rrggbb" (o como tres números en versiones anteriores).
    if (typeof arg[0] === 'string') return [1, 3, 5].map((k) => Number.parseInt((arg[0] as string).slice(k, k + 2), 16))
    return (arg as number[]).map((v) => Math.round(v))
  }
  it('usa el color elegido y, si no es válido, el gris de siempre', async () => {
    const doc = await PDFDocument.create()
    doc.addPage([300, 400])
    const blank = await doc.save()
    expect(await fill(await numberPages(blank, { color: '#1E3A8A' }))).toEqual([0x1e, 0x3a, 0x8a])
    expect(await fill(await numberPages(blank, { color: 'rojo' }))).toEqual([0x55, 0x55, 0x55])
    expect(await fill(await numberPages(blank))).toEqual([0x55, 0x55, 0x55])
  })
})
