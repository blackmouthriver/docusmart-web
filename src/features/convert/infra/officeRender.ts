// Word y Excel a PDF en el navegador (mammoth / read-excel-file + officePdf.ts).
// Lo usan el Convertidor y la vista previa de documentos de Office. Excluido de la
// cobertura: necesita las versiones de navegador de mammoth y read-excel-file
// (las piezas que transforman los datos se prueban en officeModels/officePdf).
import type { MNode, SheetData } from '../core/officeModels'
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

export async function docxToPdf(file: Blob, title: string): Promise<{ pdf: Uint8Array; skippedImages: number }> {
  const [{ default: mammoth }, { fromMammoth }, { layoutPdf }] = await Promise.all([import('mammoth'), import('../core/officeModels'), import('../core/officePdf')])
  // Se usa el árbol del documento que arma mammoth, no su HTML.
  let tree: MNode = { type: 'document' }
  await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { transformDocument: (d: MNode) => (tree = d) } as never)
  const { blocks, skippedImages } = await fromMammoth(tree)
  if (!blocks.length) throw emptyError(tr('libErr.officeEmptyDoc'))
  return { pdf: await layoutPdf(blocks, { title }), skippedImages }
}

/** Texto de un Word (.docx), con una línea en blanco entre párrafos. Para leerlo en voz alta. */
export async function docxToText(file: Blob): Promise<string> {
  const { default: mammoth } = await import('mammoth')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
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

/** Cada hoja con datos de un libro de Excel, como texto CSV. */
export async function xlsxToCsv(file: Blob, o: CsvOptions): Promise<Array<{ sheet: string; text: string }>> {
  const [{ default: readXlsxFile }, { toCsv }] = await Promise.all([import('read-excel-file/browser'), import('../core/csv')])
  const sheets = ((await readXlsxFile(file)) as unknown as SheetData[]).filter((s) => s.data.some((r) => r.some((c) => c !== null && c !== '')))
  if (!sheets.length) throw emptyError(tr('libErr.officeEmptyBook'))
  return sheets.map((s) => ({ sheet: s.sheet.replace(/[^\p{L}\p{N} _-]+/gu, '-'), text: toCsv(s.data, o) }))
}

export async function xlsxToPdf(file: Blob, title: string): Promise<Uint8Array> {
  const [{ default: readXlsxFile }, { fromSheets }, { layoutPdf }] = await Promise.all([import('read-excel-file/browser'), import('../core/officeModels'), import('../core/officePdf')])
  const sheets = (await readXlsxFile(file)) as unknown as SheetData[]
  const { blocks, maxColumns } = fromSheets(sheets)
  if (!blocks.length) throw emptyError(tr('libErr.officeEmptyBook'))
  // Muchas columnas: página horizontal y letra más chica.
  const wide = maxColumns > 6
  return layoutPdf(blocks, { title, pageSize: wide ? [841.89, 595.28] : undefined, baseSize: maxColumns > 10 ? 7.5 : wide ? 9 : 10, margin: 40 })
}
