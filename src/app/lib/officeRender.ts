// Word y Excel a PDF en el navegador (mammoth / read-excel-file + officePdf.ts).
// Lo usan el Convertidor y la vista previa de documentos de Office. Excluido de la
// cobertura: necesita las versiones de navegador de mammoth y read-excel-file
// (las piezas que transforman los datos se prueban en officeModels/officePdf).
import type { MNode, SheetData } from './officeModels'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const isDocx = (f: Blob & { name?: string }) => f.type === DOCX || !!f.name?.toLowerCase().endsWith('.docx')
export const isXlsx = (f: Blob & { name?: string }) => f.type === XLSX || !!f.name?.toLowerCase().endsWith('.xlsx')

/** Archivo de Office en un formato antiguo (.doc, .xls) que no se puede leer. */
export class OfficeFormatError extends Error {
  constructor(app: 'Word' | 'Excel') {
    super(app === 'Word' ? 'Solo se pueden convertir documentos .docx. Si tienes un .doc antiguo, ábrelo en Word y guárdalo como .docx.' : 'Solo se pueden convertir libros .xlsx. Si tienes un .xls antiguo, ábrelo en Excel y guárdalo como .xlsx.')
    this.name = 'OfficeFormatError'
  }
}

export async function docxToPdf(file: Blob, title: string): Promise<{ pdf: Uint8Array; skippedImages: number }> {
  const [{ default: mammoth }, { fromMammoth }, { layoutPdf }] = await Promise.all([import('mammoth'), import('./officeModels'), import('./officePdf')])
  // Se usa el árbol del documento que arma mammoth, no su HTML.
  let tree: MNode = { type: 'document' }
  await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { transformDocument: (d: MNode) => (tree = d) } as never)
  const { blocks, skippedImages } = await fromMammoth(tree)
  if (!blocks.length) throw new Error('El documento no tiene contenido que convertir.')
  return { pdf: await layoutPdf(blocks, { title }), skippedImages }
}

export async function xlsxToPdf(file: Blob, title: string): Promise<Uint8Array> {
  const [{ default: readXlsxFile }, { fromSheets }, { layoutPdf }] = await Promise.all([import('read-excel-file/browser'), import('./officeModels'), import('./officePdf')])
  const sheets = (await readXlsxFile(file)) as unknown as SheetData[]
  const { blocks, maxColumns } = fromSheets(sheets)
  if (!blocks.length) throw new Error('El libro no tiene datos que convertir.')
  // Muchas columnas: página horizontal y letra más chica.
  const wide = maxColumns > 6
  return layoutPdf(blocks, { title, pageSize: wide ? [841.89, 595.28] : undefined, baseSize: maxColumns > 10 ? 7.5 : wide ? 9 : 10, margin: 40 })
}
