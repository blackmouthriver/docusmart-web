// Word y Excel a PDF en el navegador (docxRead / xlsxRead + officePdf.ts).
// Lo usan el Convertidor y la vista previa de documentos de Office. Excluido de la
// cobertura como los demás adaptadores (las piezas que transforman los datos se prueban en
// docxRead/xlsxRead/officeModels/officePdf).
import type { SheetData } from '../core/officeModels'
import type { CsvOptions } from '../core/csv'
import { tr } from '../../../shared/i18n/translate'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const isDocx = (f: Blob & { name?: string }) => f.type === DOCX || !!f.name?.toLowerCase().endsWith('.docx')
export const isXlsx = (f: Blob & { name?: string }) => f.type === XLSX || !!f.name?.toLowerCase().endsWith('.xlsx')

/** Archivo de Office en un formato antiguo (.doc, .xls, .ppt) que no se puede leer. */
export class OfficeFormatError extends Error {
  constructor(app: 'Word' | 'Excel' | 'PowerPoint') {
    super(app === 'Word' ? tr('libErr.officeDocx') : app === 'Excel' ? tr('libErr.officeXlsx') : tr('conv.pptOld'))
    this.name = 'OfficeFormatError'
  }
}

/** Documento o libro sin nada que convertir (el mensaje se muestra tal cual). */
function emptyError(message: string): Error {
  const e = new Error(message)
  e.name = 'OfficeEmptyError'
  return e
}

/** Word (.docx) leído con docxRead.ts y diagramado con officePdf.ts: página, márgenes, encabezado y pie del documento. */
async function readWord(file: Blob) {
  const { readDocx, DocxError } = await import('../core/docxRead')
  try {
    return readDocx(new Uint8Array(await file.arrayBuffer()))
  } catch (e) {
    if (e instanceof DocxError) throw new OfficeFormatError('Word')
    throw e
  }
}

export async function docxToPdf(file: Blob, title: string): Promise<{ pdf: Uint8Array; skippedImages: number }> {
  const [doc, { layoutPdf }] = await Promise.all([readWord(file), import('../core/officePdf')])
  if (!doc.blocks.some((b) => b.kind !== 'para' || b.runs.some((r) => r.text.trim()))) throw emptyError(tr('libErr.officeEmptyDoc'))
  const pdf = await layoutPdf(doc.blocks, {
    title,
    pageSize: doc.pageSize,
    margins: doc.margins,
    header: doc.header,
    footer: doc.footer,
    headerDistance: doc.headerDistance,
    footerDistance: doc.footerDistance,
    baseSize: 10,
  })
  return { pdf, skippedImages: doc.skippedImages }
}

/** Texto de un Word (.docx), con una línea en blanco entre párrafos. Para leerlo en voz alta. */
export async function docxToText(file: Blob): Promise<string> {
  const [doc, { docxText }] = await Promise.all([readWord(file), import('../core/docxRead')])
  return docxText(doc)
}

/** PowerPoint (.pptx) a PDF: una página por diapositiva (pptxRead + pptxPdf). */
export async function pptxToPdf(file: Blob, title: string): Promise<{ pdf: Uint8Array; skipped: number }> {
  const [{ readPptx, PptxError }, { deckToPdf }] = await Promise.all([import('../core/pptxRead'), import('../core/pptxPdf')])
  try {
    const deck = readPptx(new Uint8Array(await file.arrayBuffer()))
    return { pdf: await deckToPdf(deck, title), skipped: deck.skipped }
  } catch (e) {
    if (e instanceof PptxError) throw emptyError(e.message === 'empty' ? tr('conv.pptEmpty') : tr('conv.pptOld'))
    throw e
  }
}

/** Las hojas de un libro de Excel, con su formato de número y si están ocultas (xlsxRead.ts). */
async function readBook(file: Blob): Promise<SheetData[]> {
  const { readXlsx, XlsxError } = await import('../core/xlsxRead')
  try {
    return readXlsx(new Uint8Array(await file.arrayBuffer()))
  } catch (e) {
    if (e instanceof XlsxError) throw new OfficeFormatError('Excel')
    throw e
  }
}

/** Cada hoja visible y con datos de un libro de Excel, como texto CSV (las ocultas no se exportan). */
export async function xlsxToCsv(file: Blob, o: CsvOptions): Promise<Array<{ sheet: string; text: string }>> {
  const [book, { toCsv }] = await Promise.all([readBook(file), import('../core/csv')])
  const sheets = book.filter((s) => !s.hidden && s.data.some((r) => r.some((c) => c !== null && c !== '')))
  if (!sheets.length) throw emptyError(tr('libErr.officeEmptyBook'))
  return sheets.map((s) => ({ sheet: s.sheet.replace(/[^\p{L}\p{N} _-]+/gu, '-'), text: toCsv(s.data, o) }))
}

export async function xlsxToPdf(file: Blob, title: string): Promise<Uint8Array> {
  const [sheets, { fromSheets }, { layoutPdf }] = await Promise.all([readBook(file), import('../core/officeModels'), import('../core/officePdf')])
  const { maxColumns } = fromSheets(sheets)
  // Muchas columnas: página horizontal y letra más chica.
  const wide = maxColumns > 6
  const baseSize = maxColumns > 10 ? 7.5 : wide ? 9 : 10
  const pageWidth = wide ? 841.89 : 595.28
  // Caracteres que caben a lo ancho (unos 0,6 em por letra, con la negrita del encabezado).
  const { blocks } = fromSheets(sheets, Math.floor((pageWidth - 80) / (baseSize * 0.6)))
  if (!blocks.length) throw emptyError(tr('libErr.officeEmptyBook'))
  return layoutPdf(blocks, { title, pageSize: wide ? [841.89, 595.28] : undefined, baseSize, margin: 40 })
}
