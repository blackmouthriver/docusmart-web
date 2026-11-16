import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFName, PDFString, degrees } from 'pdf-lib'
import { autoFontSize, fieldLabel, fillForm, pdfToView, readForm } from './pdfForm'
import { viewToPdf } from './pdfSign'

async function makeForm(rotate = 0) {
  const doc = await PDFDocument.create()
  const p1 = doc.addPage([200, 400])
  const p2 = doc.addPage([200, 400])
  if (rotate) p2.setRotation(degrees(rotate))
  const form = doc.getForm()
  const nombre = form.createTextField('datos.nombre_completo')
  nombre.addToPage(p1, { x: 20, y: 300, width: 100, height: 20 })
  nombre.acroField.dict.set(PDFName.of('TU'), PDFString.of('Nombre y apellido'))
  const notas = form.createTextField('Notas')
  notas.enableMultiline()
  notas.setMaxLength(10)
  notas.addToPage(p1, { x: 20, y: 200, width: 150, height: 60 })
  const acepto = form.createCheckBox('Acepto')
  acepto.addToPage(p1, { x: 20, y: 350, width: 15, height: 15 })
  const genero = form.createRadioGroup('Genero')
  genero.addOptionToPage('F', p2, { x: 20, y: 300, width: 15, height: 15 })
  genero.addOptionToPage('M', p2, { x: 60, y: 300, width: 15, height: 15 })
  const ciudad = form.createDropdown('Ciudad')
  ciudad.addOptions(['Bogotá', 'Medellín'])
  ciudad.addToPage(p2, { x: 20, y: 200, width: 100, height: 20 })
  const temas = form.createOptionList('Temas')
  temas.addOptions(['Arte', 'Ciencia', 'Deporte'])
  temas.enableMultiselect()
  temas.addToPage(p2, { x: 20, y: 100, width: 100, height: 60 })
  const fijo = form.createTextField('Codigo')
  fijo.setText('ABC')
  fijo.enableReadOnly()
  fijo.enableRequired()
  fijo.addToPage(p2, { x: 120, y: 350, width: 60, height: 20 })
  form.createButton('Enviar').addToPage('Enviar', p2, { x: 120, y: 20, width: 60, height: 20 })
  return doc.save()
}

describe('pdfToView', () => {
  it('es la inversa de viewToPdf en las 4 rotaciones', () => {
    const box = { x: 10, y: 20, width: 200, height: 400 }
    for (const rot of [0, 90, 180, 270]) {
      const p = viewToPdf(0.25, 0.7, box, rot)
      const [u, v] = pdfToView(p.x, p.y, box, rot)
      expect(u).toBeCloseTo(0.25)
      expect(v).toBeCloseTo(0.7)
    }
  })
})

describe('fieldLabel', () => {
  it('usa la descripción o limpia el nombre técnico', () => {
    expect(fieldLabel('x', ' Teléfono ')).toBe('Teléfono')
    expect(fieldLabel('form1.datos.fecha_nacimiento[0]')).toBe('fecha nacimiento')
    expect(fieldLabel('apellidoPaterno')).toBe('apellido Paterno')
    expect(fieldLabel('txtNumeroDocumento')).toBe('Numero Documento')
    expect(fieldLabel('chk_acepto')).toBe('acepto')
    expect(fieldLabel('cmbCiudad')).toBe('Ciudad')
    expect(fieldLabel('texto')).toBe('texto') // no es un prefijo
    expect(fieldLabel('___')).toBe('___')
  })
})

describe('readForm', () => {
  it('lee cada tipo de campo con su página, posición y opciones, en orden de lectura', async () => {
    const info = await readForm(await makeForm())
    expect(info.hasXfa).toBe(false)
    expect(info.unsupported).toBe(0)
    expect(info.fields.map((f) => [f.page, f.kind, f.label])).toEqual([
      [1, 'checkbox', 'Acepto'],
      [1, 'text', 'Nombre y apellido'],
      [1, 'text', 'Notas'],
      [2, 'text', 'Codigo'],
      [2, 'radio', 'Genero'],
      [2, 'dropdown', 'Ciudad'],
      [2, 'list', 'Temas'],
    ])
    const nombre = info.fields[1]
    expect(nombre.name).toBe('datos.nombre_completo')
    // pdf-lib agranda un poco el recuadro para incluir el borde del widget.
    const r = nombre.rects[0]
    expect(r.page).toBe(0)
    ;[[r.x, 0.1], [r.y, 0.2], [r.w, 0.5], [r.h, 0.05]].forEach(([got, want]) => expect(Math.abs(got - want)).toBeLessThan(0.01))
    const notas = info.fields[2]
    expect([notas.multiline, notas.maxLength]).toEqual([true, 10])
    const codigo = info.fields[3]
    expect([codigo.value, codigo.readOnly, codigo.required]).toEqual(['ABC', true, true])
    const genero = info.fields[4]
    expect(genero.options).toEqual(['F', 'M'])
    expect(genero.rects).toHaveLength(2)
    expect(info.fields[5].options).toEqual(['Bogotá', 'Medellín'])
    expect(info.fields[6].value).toEqual([])
  })

  it('ubica los campos en páginas rotadas', async () => {
    const info = await readForm(await makeForm(90))
    const ciudad = info.fields.find((f) => f.name === 'Ciudad')!
    // En la vista apaisada (400x200), el campo x 20..120, y 200..220 queda en u 0.5..0.55, v 0.1..0.6.
    const r = ciudad.rects[0]
    ;[[r.x, 0.5], [r.y, 0.1], [r.w, 0.05], [r.h, 0.5]].forEach(([got, want]) => expect(Math.abs(got - want)).toBeLessThan(0.01))
  })

  it('un PDF sin formulario', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    expect(await readForm(await doc.save())).toEqual({ fields: [], hasXfa: false, unsupported: 0 })
  })
})

describe('fillForm', () => {
  it('llena cada tipo de campo y respeta los de solo lectura', async () => {
    const out = await fillForm(await makeForm(), {
      'datos.nombre_completo': 'José Peña 🎉',
      Notas: 'una nota demasiado larga',
      Acepto: true,
      Genero: 'M',
      Ciudad: 'Medellín',
      Temas: ['Arte', 'Deporte', 'Otro'],
      Codigo: 'XYZ',
      NoExiste: 'x',
    })
    const info = await readForm(out)
    const v = Object.fromEntries(info.fields.map((f) => [f.name, f.value]))
    expect(v).toEqual({
      'datos.nombre_completo': 'José Peña',
      Notas: 'una nota d',
      Acepto: true,
      Genero: 'M',
      Ciudad: 'Medellín',
      Temas: ['Arte', 'Deporte'],
      Codigo: 'ABC',
    })
  })

  it('vacía campos y desmarca', async () => {
    const filled = await fillForm(await makeForm(), { 'datos.nombre_completo': 'Ana', Acepto: true, Genero: 'F', Ciudad: 'Bogotá', Temas: ['Arte'] })
    const cleared = await fillForm(filled, { 'datos.nombre_completo': '', Acepto: false, Genero: '', Ciudad: '', Temas: [] })
    const v = Object.fromEntries((await readForm(cleared)).fields.map((f) => [f.name, f.value]))
    expect(v).toMatchObject({ 'datos.nombre_completo': '', Acepto: false, Genero: '', Ciudad: '', Temas: [] })
  })

  it('en campos de varias líneas con tamaño automático usa 10 pt', async () => {
    const out = await fillForm(await makeForm(), { Notas: 'Hola' })
    const doc = await PDFDocument.load(out)
    expect(doc.getForm().getTextField('Notas').acroField.getDefaultAppearance()).toMatch(/ 10 Tf/)
    expect(autoFontSize('/Helv 0 Tf 0 g')).toBe(true)
    expect(autoFontSize(undefined)).toBe(true)
    expect(autoFontSize('/Helv 12 Tf 0 g')).toBe(false)
    expect(autoFontSize('0 0 0 rg /Helvetica 51 Tf')).toBe(true)
  })

  it('aplanar deja el contenido fijo, sin campos', async () => {
    const out = await fillForm(await makeForm(), { 'datos.nombre_completo': 'Ana' }, { flatten: true })
    expect((await readForm(out)).fields).toEqual([])
  })
})
