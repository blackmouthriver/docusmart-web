/**
 * Crear campos de formulario (W-147.2): convierte un PDF en uno rellenable (AcroForm), como Adobe
 * y Sejda. Los campos se dibujan sobre la página vista (fracciones de 0 a 1) y aquí pasan a
 * coordenadas del PDF, también en páginas giradas o recortadas. Los nombres no se repiten con
 * los campos que ya traía el documento.
 */
import { PDFDocument, PDFHexString, PDFName, degrees, rgb, type PDFField, type PDFPage } from 'pdf-lib'
import { drawPieces, fontsForText, piecesWidth } from '../../../shared/pdf/pdfFonts'
import { viewToPdf } from './pdfSign'

export type NewFieldKind = 'text' | 'multiline' | 'checkbox' | 'radio' | 'dropdown'
export type NewField = {
  kind: NewFieldKind
  /** El nombre que se ve al llenarlo ("Nombre completo"). */
  name: string
  /** Página (base 0) y recuadro en fracciones de la página vista. */
  page: number
  x: number
  y: number
  w: number
  h: number
  /** Opciones de "opciones" y "lista desplegable". */
  options: string[]
  required: boolean
}

type Box = { x: number; y: number; width: number; height: number }

/** Opciones escritas una por línea o separadas por comas: sin vacías ni repetidas (hasta 50). */
export function cleanOptions(text: string): string[] {
  const out: string[] = []
  for (const raw of text.split(/[\n,;]/)) {
    const o = raw.trim()
    if (o && !out.includes(o)) out.push(o)
  }
  return out.slice(0, 50)
}

/**
 * Un nombre de campo válido y que no se repite: sin puntos (en PDF separan niveles) y con
 * " 2", " 3"… si ya existe.
 */
export function uniqueName(name: string, used: Set<string>): string {
  const base = name.replaceAll('.', ' ').replace(/\s+/g, ' ').trim() || 'Campo'
  let out = base
  for (let n = 2; used.has(out); n++) out = `${base} ${n}`
  used.add(out)
  return out
}

/** El recuadro dibujado en la página vista, en coordenadas del PDF (esquina inferior izquierda y tamaño). */
export function viewRectToPdf(f: Pick<NewField, 'x' | 'y' | 'w' | 'h'>, box: Box, rotation: number) {
  const a = viewToPdf(f.x, f.y, box, rotation)
  const b = viewToPdf(f.x + f.w, f.y + f.h, box, rotation)
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }
}

const BORDER = { borderWidth: 1, borderColor: rgb(0.55, 0.6, 0.7), backgroundColor: rgb(0.95, 0.97, 1) }

/**
 * Marca el campo como obligatorio, le pone el nombre para mostrar (TU) y, en páginas giradas, gira
 * su contenido para que se lea derecho (el recuadro ya está en coordenadas del PDF).
 */
function finish(field: PDFField, f: NewField, label: string, rotation: number) {
  if (f.required) field.enableRequired()
  if (rotation % 360) for (const w of field.acroField.getWidgets()) w.getOrCreateAppearanceCharacteristics().setRotation(((rotation % 360) + 360) % 360)
  field.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(label))
}

/** Agrega los campos al PDF y devuelve el documento rellenable. */
export async function addFormFields(bytes: ArrayBuffer | Uint8Array, fields: NewField[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  const form = doc.getForm()
  const used = new Set(form.getFields().map((x) => x.getName()))
  const pages = doc.getPages()
  // Los textos de las opciones se escriben con fuentes que admiten cualquier idioma.
  const labels = fields.flatMap((f) => (f.kind === 'radio' ? f.options : []))
  const fonts = labels.length ? await fontsForText(doc, 'sans', ['regular'], labels.join(' ')) : null
  for (const f of fields) {
    const page: PDFPage | undefined = pages[f.page]
    if (!page) continue
    const box = page.getCropBox()
    const rotation = page.getRotation().angle
    const rect = viewRectToPdf(f, box, rotation)
    const name = uniqueName(f.name, used)
    if (f.kind === 'text' || f.kind === 'multiline') {
      const tf = form.createTextField(name)
      if (f.kind === 'multiline') tf.enableMultiline()
      tf.addToPage(page, { ...rect, ...BORDER })
      finish(tf, f, f.name, rotation)
    } else if (f.kind === 'checkbox') {
      // Cuadrado, del lado más corto, arriba a la izquierda del recuadro.
      const side = Math.min(rect.width, rect.height)
      const cb = form.createCheckBox(name)
      cb.addToPage(page, { x: rect.x, y: rect.y + rect.height - side, width: side, height: side, ...BORDER })
      finish(cb, f, f.name, rotation)
    } else if (f.kind === 'dropdown') {
      const dd = form.createDropdown(name)
      dd.addOptions(f.options.length ? f.options : ['—'])
      dd.addToPage(page, { ...rect, ...BORDER })
      finish(dd, f, f.name, rotation)
    } else {
      // Opciones (una sola): una fila por opción, con el botón a la izquierda y el texto al lado.
      const options = f.options.length ? f.options : ['1', '2']
      const rg = form.createRadioGroup(name)
      const turns = ((Math.round(rotation / 90) % 4) + 4) % 4
      const viewW = turns % 2 ? box.height : box.width
      const viewH = turns % 2 ? box.width : box.height
      const rowH = f.h / options.length
      options.forEach((opt, i) => {
        const sideView = Math.min(rowH * viewH * 0.8, 14) / viewH
        const sideX = (sideView * viewH) / viewW
        const top = f.y + i * rowH + (rowH - sideView) / 2
        const r = viewRectToPdf({ x: f.x, y: top, w: sideX, h: sideView }, box, rotation)
        rg.addOptionToPage(opt, page, { ...r, ...BORDER })
        if (fonts) {
          const size = Math.max(6, Math.min(11, sideView * viewH * 0.9))
          const pieces = fonts.pieces(opt, 'regular')
          // Línea base del texto, a la derecha del botón y centrada en la fila.
          const at = viewToPdf(f.x + sideX + 4 / viewW, top + sideView / 2 + (size * 0.35) / viewH, box, rotation)
          const maxW = (f.w - sideX) * viewW - 6
          if (piecesWidth(pieces, size) > 0) drawPieces(page, pieces, { x: at.x, y: at.y, size: Math.min(size, size * Math.max(0.5, maxW / piecesWidth(pieces, size))), color: rgb(0.15, 0.15, 0.15), rotateDeg: turns * 90, degrees })
        }
      })
      finish(rg, f, f.name, rotation)
    }
  }
  return doc.save()
}
