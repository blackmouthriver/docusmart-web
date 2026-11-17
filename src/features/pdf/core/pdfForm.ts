/**
 * Formularios PDF (AcroForm): leer los campos rellenables y llenarlos.
 * Las posiciones de los campos se devuelven como fracción de la página vista,
 * para dibujarlos encima de la vista previa.
 */
import {
  PDFButton,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFRef,
  PDFSignature,
  PDFString,
  PDFHexString,
  PDFTextField,
  type PDFField,
} from 'pdf-lib'
import { sanitizeWinAnsi } from './pdfTools'

export type FieldKind = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'list'
export type FieldRect = { page: number; x: number; y: number; w: number; h: number }
export type FormField = {
  name: string
  label: string
  kind: FieldKind
  value: string | boolean | string[]
  options: string[]
  multiline: boolean
  maxLength: number | null
  readOnly: boolean
  required: boolean
  /** Página (base 1) del primer recuadro del campo. */
  page: number
  rects: FieldRect[]
}
export type FormInfo = { fields: FormField[]; hasXfa: boolean; unsupported: number }
export type FormValues = Record<string, string | boolean | string[]>

type Box = { x: number; y: number; width: number; height: number }
const quarterTurns = (rotation: number) => ((Math.round(rotation / 90) % 4) + 4) % 4

/** Punto del PDF a fracción de la página vista (inversa de viewToPdf). */
export function pdfToView(px: number, py: number, box: Box, rotation: number): [number, number] {
  const fx = (px - box.x) / box.width
  const fy = (py - box.y) / box.height
  switch (quarterTurns(rotation)) {
    case 1:
      return [fy, fx]
    case 2:
      return [1 - fx, fy]
    case 3:
      return [1 - fy, 1 - fx]
    default:
      return [fx, 1 - fy]
  }
}

/** Nombre legible: la descripción del campo (TU) si existe, si no el nombre sin prefijos ni guiones bajos. */
export function fieldLabel(name: string, tooltip?: string): string {
  if (tooltip?.trim()) return tooltip.trim()
  const last = (name.split('.').pop() || name)
    .replace(/\[\d+\]$/, '')
    // Prefijos técnicos habituales: txtNombre, cmbCiudad, chkAcepto, rbJornada…
    .replace(/^(txt|text|cmb|cbo|combo|ddl|chk|cb|check|rb|rdo|opt|radio|lst|list|lb|fld|field)(?=[A-Z_\d])_?/, '')
  return last.replace(/[_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || name
}

function kindOf(f: PDFField): FieldKind | null {
  if (f instanceof PDFTextField) return 'text'
  if (f instanceof PDFCheckBox) return 'checkbox'
  if (f instanceof PDFRadioGroup) return 'radio'
  if (f instanceof PDFDropdown) return 'dropdown'
  if (f instanceof PDFOptionList) return 'list'
  return null
}

function valueOf(f: PDFField): string | boolean | string[] {
  if (f instanceof PDFTextField) return f.getText() ?? ''
  if (f instanceof PDFCheckBox) return f.isChecked()
  if (f instanceof PDFRadioGroup) return f.getSelected() ?? ''
  if (f instanceof PDFDropdown) return f.getSelected()[0] ?? ''
  if (f instanceof PDFOptionList) return f.getSelected()
  return ''
}

function optionsOf(f: PDFField): string[] {
  if (f instanceof PDFRadioGroup || f instanceof PDFDropdown || f instanceof PDFOptionList) return f.getOptions()
  return []
}

export async function readForm(bytes: ArrayBuffer | Uint8Array): Promise<FormInfo> {
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  const hasXfa = form.hasXFA()
  const pages = doc.getPages()
  const pageIndex = new Map(pages.map((p, i) => [p.ref.toString(), i]))
  // Si un recuadro no dice su página (/P), se busca en las anotaciones de cada página.
  const annotPage = new Map<string, number>()
  pages.forEach((p, i) => p.node.Annots()?.asArray().forEach((a) => a instanceof PDFRef && annotPage.set(a.toString(), i)))

  const fields: FormField[] = []
  let unsupported = 0
  for (const f of form.getFields()) {
    const kind = kindOf(f)
    if (!kind) {
      if (!(f instanceof PDFButton) && !(f instanceof PDFSignature)) unsupported++
      continue
    }
    const rects: FieldRect[] = []
    for (const w of f.acroField.getWidgets()) {
      const ref = w.P()?.toString() ?? doc.context.getObjectRef(w.dict)?.toString()
      const idx = ref ? (pageIndex.get(ref) ?? annotPage.get(ref)) : undefined
      if (idx === undefined) continue
      const page = pages[idx]
      const r = w.getRectangle()
      const a = pdfToView(r.x, r.y, page.getCropBox(), page.getRotation().angle)
      const b = pdfToView(r.x + r.width, r.y + r.height, page.getCropBox(), page.getRotation().angle)
      rects.push({ page: idx, x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) })
    }
    const tu = f.acroField.dict.lookup(PDFName.of('TU'))
    const tooltip = tu instanceof PDFString || tu instanceof PDFHexString ? tu.decodeText() : undefined
    fields.push({
      name: f.getName(),
      label: fieldLabel(f.getName(), tooltip),
      kind,
      value: valueOf(f),
      options: optionsOf(f),
      multiline: f instanceof PDFTextField && f.isMultiline(),
      maxLength: f instanceof PDFTextField ? (f.getMaxLength() ?? null) : null,
      readOnly: f.isReadOnly(),
      required: f.isRequired(),
      page: (rects[0]?.page ?? 0) + 1,
      rects,
    })
  }
  // Orden de lectura: por página y de arriba hacia abajo, de izquierda a derecha.
  fields.sort((p, q) => p.page - q.page || (p.rects[0]?.y ?? 0) - (q.rects[0]?.y ?? 0) || (p.rects[0]?.x ?? 0) - (q.rects[0]?.x ?? 0))
  return { fields, hasXfa, unsupported }
}

export const MULTILINE_SIZE = 10
const MAX_MULTILINE_SIZE = 24

/**
 * true si el tamaño de letra de un campo de varias líneas hay que corregirlo:
 * automático ("/Helv 0 Tf" o sin "Tf") o desmedido, como el que deja pdf-lib
 * al calcular el tamaño automático con el campo vacío (p. ej. 51 pt).
 */
export function autoFontSize(da: string | undefined): boolean {
  const m = /([\d.]+)\s+Tf/.exec(da ?? '')
  const size = m ? Number(m[1]) : 0
  return size === 0 || size > MAX_MULTILINE_SIZE
}

/** El tamaño del recuadro (widget) manda sobre el del campo: se corrigen ambos. */
function fixAutoSize(f: PDFTextField) {
  const widgets = f.acroField.getWidgets()
  const da = widgets[0]?.getDefaultAppearance() ?? f.acroField.getDefaultAppearance()
  if (!autoFontSize(da)) return
  f.setFontSize(MULTILINE_SIZE)
  for (const w of widgets) {
    const wda = w.getDefaultAppearance()
    if (wda) w.setDefaultAppearance(wda.replace(/[\d.]+(\s+Tf)/, `${MULTILINE_SIZE}$1`))
  }
}

/** Llena los campos indicados. `flatten` los convierte en contenido fijo (ya no se pueden editar). */
export async function fillForm(bytes: ArrayBuffer | Uint8Array, values: FormValues, opts: { flatten?: boolean } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  for (const [name, value] of Object.entries(values)) {
    const f = form.getFieldMaybe(name)
    if (!f || f.isReadOnly()) continue
    if (f instanceof PDFTextField) {
      // Las fuentes estándar solo dibujan latín: se limpia línea por línea.
      let text = String(value ?? '').split('\n').map(sanitizeWinAnsi).join('\n')
      const max = f.getMaxLength()
      if (max !== undefined) text = text.slice(0, max)
      // Tamaño automático en un campo de varias líneas: pdf-lib lo agranda hasta que
      // entra la primera palabra. Se fija un tamaño de lectura normal.
      if (f.isMultiline()) fixAutoSize(f)
      f.setText(text || undefined)
    } else if (f instanceof PDFCheckBox) {
      if (value === true) f.check()
      else f.uncheck()
    } else if (f instanceof PDFRadioGroup) {
      if (typeof value === 'string' && f.getOptions().includes(value)) f.select(value)
      else if (!value) f.clear()
    } else if (f instanceof PDFDropdown) {
      const v = String(value ?? '')
      if (!v) f.clear()
      else if (f.getOptions().includes(v) || f.isEditable()) f.select(v)
    } else if (f instanceof PDFOptionList) {
      const vs = (Array.isArray(value) ? value : [String(value)]).filter((v) => f.getOptions().includes(v))
      if (vs.length) f.select(vs)
      else f.clear()
    }
  }
  if (opts.flatten) form.flatten()
  return doc.save()
}
