// W-147.2: dibujo a mano alzada, líneas, flechas y enlaces en Editar PDF; guardar y cargar
// respuestas de un formulario; texto buscable fuera de lo censurado.
import { describe, expect, it } from 'vitest'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString } from 'pdf-lib'
import { applyEdits, arrowHead, inkFromPoints, inkPoints, lineEnds, lineFromPoints, linkAction, normalizeUrl, simplify, type LinkItem } from '../../../../../src/features/pdf/core/pdfEdit'
import { ANSWERS_FORMAT, answersFromJson, answersToJson, type FormField } from '../../../../../src/features/pdf/core/pdfForm'
import { keptWords, redactPdf, type TextItem } from '../../../../../src/features/pdf/core/pdfRedact'

async function blankPdf(pages = 2) {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage([600, 800])
  return doc.save()
}

describe('dibujo, líneas y flechas', () => {
  it('el trazo guarda su caja y los puntos relativos; al moverlo, los puntos lo siguen', () => {
    const ink = inkFromPoints(0, [[0.1, 0.2], [0.2, 0.25], [0.3, 0.2]], '#DC2626', 2.5)!
    expect(ink).toMatchObject({ kind: 'ink', page: 0, x: 0.1, y: 0.2 })
    expect(ink.w).toBeCloseTo(0.2)
    expect(ink.h).toBeCloseTo(0.05)
    expect(inkPoints({ ...ink, x: 0.5 }).map(([x]) => Number(x.toFixed(3)))).toEqual([0.5, 0.6, 0.7])
    // Un toque (o un solo punto) no es un trazo.
    expect(inkFromPoints(0, [[0.1, 0.1]], '#000', 2)).toBeNull()
    expect(inkFromPoints(0, [[0.1, 0.1], [0.101, 0.1]], '#000', 2)).toBeNull()
  })

  it('simplifica los puntos casi en línea recta sin cambiar la forma', () => {
    const straight = Array.from({ length: 200 }, (_, i) => [i / 200, 0.5] as [number, number])
    expect(simplify(straight)).toEqual([straight[0], straight[199]])
    const corner: Array<[number, number]> = [[0, 0], [0.25, 0], [0.5, 0], [0.5, 0.25], [0.5, 0.5]]
    expect(simplify(corner)).toEqual([[0, 0], [0.5, 0], [0.5, 0.5]])
  })

  it('una línea va de una esquina a la opuesta, en cualquier dirección', () => {
    const down = lineFromPoints('line', 0, 0.1, 0.1, 0.4, 0.3, '#000', 2)!
    expect(lineEnds(down).flat().map((n) => Number(n.toFixed(6)))).toEqual([0.1, 0.1, 0.4, 0.3])
    const up = lineFromPoints('arrow', 0, 0.4, 0.3, 0.1, 0.1, '#000', 2)!
    expect(up).toMatchObject({ flipX: true, flipY: true })
    const [a, b] = lineEnds(up)
    expect(a[0]).toBeCloseTo(0.4)
    expect(b[0]).toBeCloseTo(0.1)
    // Horizontal: alto casi cero, sin dividir por cero.
    const flat = lineFromPoints('line', 0, 0.1, 0.5, 0.6, 0.5, '#000', 2)!
    expect(flat.h).toBeGreaterThan(0)
    expect(lineFromPoints('line', 0, 0.1, 0.1, 0.101, 0.1, '#000', 2)).toBeNull()
  })

  it('la punta de la flecha toca el final y crece con el grosor', () => {
    const head = arrowHead([0, 0], [100, 0], 2)
    expect(head[0]).toEqual([100, 0])
    expect(head[1][0]).toBeCloseTo(91)
    expect(Math.abs(head[1][1] - head[2][1])).toBeGreaterThan(7)
    expect(arrowHead([0, 0], [100, 0], 6)[1][0]).toBeLessThan(head[1][0])
  })

  it('el PDF lleva los trazos dibujados', async () => {
    const ink = inkFromPoints(0, [[0.1, 0.1], [0.2, 0.2], [0.3, 0.1]], '#DC2626', 3)!
    const arrow = lineFromPoints('arrow', 0, 0.1, 0.5, 0.6, 0.5, '#2563EB', 2)!
    const out = await PDFDocument.load(await applyEdits(await blankPdf(1), [ink, arrow]))
    const content = out.getPage(0).node.Contents()
    expect(content).toBeDefined()
  })
})

describe('enlaces', () => {
  it('solo direcciones seguras: web, correo y teléfono', () => {
    expect(normalizeUrl('docusmart.online')).toBe('https://docusmart.online')
    expect(normalizeUrl('https://docusmart.online/app/')).toBe('https://docusmart.online/app/')
    expect(normalizeUrl('ana@correo.com')).toBe('mailto:ana@correo.com')
    expect(normalizeUrl('tel:+573001234567')).toBe('tel:+573001234567')
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('data:text/html,hola')).toBeNull()
    expect(normalizeUrl('file:///C:/x')).toBeNull()
    expect(normalizeUrl('no es una url')).toBeNull()
    expect(normalizeUrl('https://')).toBeNull()
  })

  const link = (patch: Partial<LinkItem>): LinkItem => ({ kind: 'link', page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.05, url: '', target: null, ...patch })

  it('el enlace a un sitio y a una página quedan como anotaciones del PDF', async () => {
    expect(linkAction(link({}))).toBeNull()
    expect(linkAction(link({ target: 1 }))).toEqual({ page: 1 })
    const bytes = await applyEdits(await blankPdf(2), [link({ url: 'docusmart.online' }), link({ y: 0.5, target: 1 })])
    const out = await PDFDocument.load(bytes)
    const annots = out.getPage(0).node.lookup(PDFName.of('Annots'), PDFArray)
    expect(annots.size()).toBe(2)
    const [web, page] = [0, 1].map((i) => annots.lookup(i, PDFDict))
    expect(web.lookup(PDFName.of('Subtype'))).toEqual(PDFName.of('Link'))
    expect((web.lookup(PDFName.of('A'), PDFDict).lookup(PDFName.of('URI')) as PDFString).decodeText()).toBe('https://docusmart.online')
    expect(page.lookup(PDFName.of('Dest'), PDFArray).get(0)).toEqual(out.getPage(1).ref)
  })

  it('solo enlaces vacíos: pide completarlos', async () => {
    await expect(applyEdits(await blankPdf(1), [link({})])).rejects.toThrow('Completa el enlace')
  })
})

const field = (patch: Partial<FormField>): FormField => ({ name: 'n', label: 'n', kind: 'text', value: '', options: [], multiline: false, maxLength: null, readOnly: false, required: false, page: 1, rects: [], ...patch })

describe('respuestas del formulario', () => {
  const fields = [
    field({ name: 'nombre' }),
    field({ name: 'acepto', kind: 'checkbox', value: false }),
    field({ name: 'ciudad', kind: 'dropdown', options: ['Bogotá', 'Cali'] }),
    field({ name: 'intereses', kind: 'list', options: ['PDF', 'QR'] }),
    field({ name: 'codigo', maxLength: 4 }),
    field({ name: 'fijo', readOnly: true }),
  ]

  it('guarda solo lo respondido y lo vuelve a cargar', () => {
    const json = answersToJson({ nombre: 'Ana', acepto: true, ciudad: 'Cali', intereses: ['QR'], codigo: '', fijo: 'x' }, fields, 'f.pdf')
    const data = JSON.parse(json)
    expect(data.format).toBe(ANSWERS_FORMAT)
    expect(Object.keys(data.fields)).toEqual(['nombre', 'acepto', 'ciudad', 'intereses'])
    expect(answersFromJson(json, fields)).toEqual({ values: { nombre: 'Ana', acepto: true, ciudad: 'Cali', intereses: ['QR'] }, used: 4, skipped: 0 })
  })

  it('no usa respuestas que no encajan con este formulario', () => {
    const json = JSON.stringify({ format: ANSWERS_FORMAT, version: 1, fields: { nombre: 5, ciudad: 'Lima', intereses: ['Otro'], codigo: '12345', fijo: 'x', otro: 'y', acepto: 'sí' } })
    expect(answersFromJson(json, fields)).toEqual({ values: {}, used: 0, skipped: 7 })
    expect(answersFromJson('{"fields":{}}', fields)).toBeNull()
    expect(answersFromJson('no es json', fields)).toBeNull()
  })
})

describe('censurar dejando buscable el resto', () => {
  // Una línea de texto horizontal en (100, 700) de 300 pt de ancho, a 12 pt; página de 600 × 800.
  const item: TextItem = { str: 'Nombre: Ana Pérez Cédula 123456', transform: [12, 0, 0, 12, 100, 700], width: 300 }
  const toView = (x: number, y: number): [number, number] => [x / 600, 1 - y / 800]

  it('quita la palabra que toca una zona y deja las demás', () => {
    const all = keptWords([item], [], toView).map((w) => w.str)
    expect(all).toEqual(['Nombre:', 'Ana', 'Pérez', 'Cédula', '123456'])
    // Zona sobre "123456" (los últimos caracteres de la línea).
    const zone = { page: 0, x: 0.6, y: 0.1, w: 0.2, h: 0.05 }
    const kept = keptWords([item], [zone], toView).map((w) => w.str)
    expect(kept).not.toContain('123456')
    expect(kept).toContain('Ana')
  })

  it('el PDF censurado lleva la capa de texto invisible', async () => {
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
    const bytes = await redactPdf(await blankPdf(1), [{ page: 0, x: 0, y: 0, w: 0.1, h: 0.1 }], async () => ({
      image: png,
      format: 'png',
      widthPt: 600,
      heightPt: 800,
      words: [{ str: 'Contrato', x: 0.1, y: 0.1, w: 0.2, h: 0.02 }],
    }))
    const out = await PDFDocument.load(bytes)
    expect(out.getPageCount()).toBe(1)
    const fonts = out.getPage(0).node.Resources()?.lookup(PDFName.of('Font'))
    expect(fonts).toBeDefined()
  })
})
