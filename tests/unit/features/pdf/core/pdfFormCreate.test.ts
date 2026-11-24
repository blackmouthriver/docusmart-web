// W-147.2: crear campos de formulario sobre un PDF (texto, texto largo, casilla, opciones y lista).
import { PDFDocument, degrees } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { addFormFields, cleanOptions, uniqueName, viewRectToPdf, type NewField } from '../../../../../src/features/pdf/core/pdfFormCreate'
import { fillForm, readForm } from '../../../../../src/features/pdf/core/pdfForm'

const field = (patch: Partial<NewField>): NewField => ({ kind: 'text', name: 'Campo', page: 0, x: 0.1, y: 0.1, w: 0.4, h: 0.05, options: [], required: false, ...patch })
const round = (r: { x: number; y: number; w: number; h: number }) => [r.x, r.y, r.w, r.h].map((v) => Math.round(v * 100) / 100)

async function sample(rotated = false) {
  const d = await PDFDocument.create()
  d.addPage([600, 800])
  const p = d.addPage([600, 800])
  if (rotated) p.setRotation(degrees(90))
  return d.save()
}

describe('piezas', () => {
  it('opciones sin vacías ni repetidas, por comas o líneas', () => {
    expect(cleanOptions('Sí, No\n Tal vez ;Sí,,')).toEqual(['Sí', 'No', 'Tal vez'])
    expect(cleanOptions(Array.from({ length: 60 }, (_, i) => `o${i}`).join(','))).toHaveLength(50)
  })

  it('nombres sin puntos y sin repetir', () => {
    const used = new Set(['Nombre'])
    expect(uniqueName('Nombre', used)).toBe('Nombre 2')
    expect(uniqueName('Nombre', used)).toBe('Nombre 3')
    expect(uniqueName('a.b', used)).toBe('a b')
    expect(uniqueName('   ', used)).toBe('Campo')
  })

  it('el recuadro de la vista pasa a coordenadas del PDF (también girada)', () => {
    const box = { x: 0, y: 0, width: 600, height: 800 }
    expect(viewRectToPdf({ x: 0.1, y: 0.1, w: 0.5, h: 0.05 }, box, 0)).toEqual({ x: 60, y: 680, width: 300, height: 40 })
    // Girada 90°: lo ancho en la vista es alto en el PDF.
    const r = viewRectToPdf({ x: 0.1, y: 0.1, w: 0.5, h: 0.05 }, box, 90)
    expect(r.width).toBeCloseTo(30, 6)
    expect(r.height).toBeCloseTo(400, 6)
  })
})

describe('crear campos', () => {
  it('cada tipo queda en su lugar, con su nombre, opciones y si es obligatorio', async () => {
    const out = await addFormFields(await sample(), [
      field({ name: 'Nombre completo', required: true }),
      field({ kind: 'multiline', name: 'Comentarios', y: 0.2, h: 0.15 }),
      field({ kind: 'checkbox', name: 'Acepto', y: 0.4, w: 0.04, h: 0.03 }),
      field({ kind: 'radio', name: 'Talla', y: 0.5, w: 0.3, h: 0.12, options: ['S', 'M', 'Ñandú'] }),
      field({ kind: 'dropdown', name: 'Ciudad', page: 1, y: 0.1, options: ['Bogotá', 'Cali'] }),
    ])
    const f = (await readForm(out)).fields
    expect(f.map((x) => [x.name, x.kind])).toEqual([
      ['Nombre completo', 'text'],
      ['Comentarios', 'text'],
      ['Acepto', 'checkbox'],
      ['Talla', 'radio'],
      ['Ciudad', 'dropdown'],
    ])
    expect(f[0].required).toBe(true)
    expect(f[1].multiline).toBe(true)
    expect(f[3].options).toEqual(['S', 'M', 'Ñandú'])
    expect(f[3].rects).toHaveLength(3)
    expect(f[4].options).toEqual(['Bogotá', 'Cali'])
    expect(f[4].page).toBe(2)
    expect(round(f[0].rects[0])).toEqual([0.1, 0.1, 0.4, 0.05])
    // Los textos de las opciones quedan escritos en la página.
    const task = getDocument({ data: out.slice() })
    const text = (await (await (await task.promise).getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join('|')
    await task.destroy()
    expect(text).toContain('Ñandú')
  })

  it('en una página girada el campo queda donde se dibujó', async () => {
    const out = await addFormFields(await sample(true), [field({ page: 1, x: 0.2, y: 0.3, w: 0.5, h: 0.05 })])
    expect(round((await readForm(out)).fields[0].rects[0])).toEqual([0.2, 0.3, 0.5, 0.05])
  })

  it('no pisa los campos que ya tenía el PDF, y lo creado se puede llenar', async () => {
    const first = await addFormFields(await sample(), [field({ name: 'Nombre' })])
    const second = await addFormFields(first, [field({ name: 'Nombre', y: 0.3 }), field({ kind: 'checkbox', name: 'Acepto', y: 0.5, w: 0.04, h: 0.03 })])
    const names = (await readForm(second)).fields.map((x) => x.name)
    expect(names).toEqual(['Nombre', 'Nombre 2', 'Acepto'])
    const filled = await fillForm(second, { Nombre: 'Ana', 'Nombre 2': 'Pérez', Acepto: true })
    const back = Object.fromEntries((await readForm(filled)).fields.map((x) => [x.name, x.value]))
    expect(back).toEqual({ Nombre: 'Ana', 'Nombre 2': 'Pérez', Acepto: true })
  })

  it('opciones vacías: valores por defecto; una página que no existe se salta', async () => {
    const out = await addFormFields(await sample(), [field({ kind: 'radio', name: 'R', options: [] }), field({ kind: 'dropdown', name: 'D', y: 0.4, options: [] }), field({ name: 'X', page: 9 })])
    const f = (await readForm(out)).fields
    expect(f.map((x) => [x.name, x.options])).toEqual([['R', ['1', '2']], ['D', ['—']]])
  })
})
