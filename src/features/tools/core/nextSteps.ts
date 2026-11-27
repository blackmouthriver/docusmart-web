/**
 * "¿Y ahora?" (W-110): qué herramienta sugerir cuando una termina, según el tipo del resultado y de dónde viene.
 * Lógica pura: la pantalla solo pinta lo que devuelve y pasa el archivo con `setHandoff`.
 */
import { CATALOG, type CatalogTool } from './catalog'

export type ResultKind = 'pdf' | 'image' | 'word' | 'excel' | 'other'

/** Tipo del resultado, por su tipo MIME o, si falta, por la extensión. */
export function resultKind(file: Pick<File, 'name' | 'type'>): ResultKind {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|avif|ico|tiff?|heic|heif)$/.test(name)) return 'image'
  if (name.endsWith('.docx')) return 'word'
  if (name.endsWith('.xlsx')) return 'excel'
  return 'other'
}

/** Nombre de analítica de cada herramienta (`toolName` de SaveOptions) -> clave del catálogo. */
const TOOL_KEY: Record<string, string> = {
  merge: 'pdf/unir',
  split: 'pdf/dividir',
  rotate: 'pdf/rotar',
  reorder_pages: 'pdf/reordenar',
  number_pages: 'pdf/numerar',
  watermark: 'pdf/marca',
  compress: 'pdf/comprimir',
  protect: 'pdf/proteger',
  unlock: 'pdf/desbloquear',
  repair: 'pdf/reparar',
  sign: 'pdf/firmar',
  crop: 'pdf/recortar',
  redact: 'pdf/censurar',
  edit: 'pdf/editar',
  form: 'pdf/formulario',
  ocr: 'pdf/ocr',
  compare: 'pdf/comparar',
  extract_images: 'pdf/imagenes',
  pdfa: 'pdf/pdfa',
  scan: 'pdf/escanear',
  crop_image: 'imagen/recortar',
  id_photo: 'imagen/documento',
}

/** Herramientas cuyo resultado no continúa en otra herramienta (un PDF protegido no se puede seguir procesando sin la clave). */
const NO_NEXT = new Set(['protect', 'compare', 'extract_images', 'split'])

/** Pantallas que guardan un archivo pero no producen un documento que tenga sentido seguir trabajando. */
const isDocumentTool = (toolName: string) => !NO_NEXT.has(toolName) && !/^(qr|study_|archive_|hash)/.test(toolName)

const PDF_DEFAULT = ['pdf/comprimir', 'pdf/firmar', 'pdf/proteger', 'pdf/unir', 'pdf/ocr', 'pdf/numerar', 'pdf/marca', 'pdf/rotar', 'convertir/pdf-word']

/** Lo que más se hace después de cada herramienta (unir → comprimir → firmar → proteger). */
const PDF_FLOWS: Record<string, string[]> = {
  merge: ['pdf/comprimir', 'pdf/firmar', 'pdf/proteger'],
  compress: ['pdf/firmar', 'pdf/proteger', 'pdf/unir'],
  sign: ['pdf/proteger', 'pdf/comprimir', 'pdf/unir'],
  unlock: ['pdf/comprimir', 'pdf/editar', 'pdf/firmar'],
  repair: ['pdf/comprimir', 'pdf/ocr', 'pdf/firmar'],
  ocr: ['pdf/comprimir', 'pdf/proteger', 'convertir/pdf-word'],
  scan: ['pdf/ocr', 'pdf/comprimir', 'pdf/firmar'],
  rotate: ['pdf/comprimir', 'pdf/numerar', 'pdf/firmar'],
  reorder_pages: ['pdf/comprimir', 'pdf/numerar', 'pdf/firmar'],
  number_pages: ['pdf/comprimir', 'pdf/firmar', 'pdf/proteger'],
  watermark: ['pdf/comprimir', 'pdf/proteger', 'pdf/firmar'],
  crop: ['pdf/comprimir', 'pdf/firmar', 'pdf/proteger'],
  redact: ['pdf/comprimir', 'pdf/proteger', 'pdf/firmar'],
  edit: ['pdf/firmar', 'pdf/comprimir', 'pdf/proteger'],
  form: ['pdf/firmar', 'pdf/comprimir', 'pdf/proteger'],
  pdfa: ['pdf/firmar', 'pdf/proteger'],
}

const IMAGE_DEFAULT = ['convertir/img-pdf', 'imagen/comprimir', 'imagen/redimensionar', 'imagen/marca']

const BY_KIND: Partial<Record<ResultKind, string[]>> = { word: ['convertir/word-pdf'], excel: ['convertir/excel-pdf'] }

/**
 * Hasta `limit` herramientas para seguir con este resultado, sin repetir la que acaba de usarse.
 * Devuelve [] si el resultado no sigue en ninguna otra (un archivo ZIP, un QR, un PDF protegido…).
 */
export function suggestNextSteps(kind: ResultKind, toolName: string, limit = 3, catalog: readonly CatalogTool[] = CATALOG): CatalogTool[] {
  if (!isDocumentTool(toolName)) return []
  const current = TOOL_KEY[toolName]
  const wanted = [
    ...(kind === 'pdf' ? [...(PDF_FLOWS[toolName] ?? []), ...PDF_DEFAULT] : kind === 'image' ? IMAGE_DEFAULT : (BY_KIND[kind] ?? [])),
  ]
  const unique = wanted.filter((key, i) => key !== current && wanted.indexOf(key) === i)
  return unique
    .map((key) => catalog.find((c) => c.key === key))
    .filter((c): c is CatalogTool => !!c)
    .slice(0, limit)
}

/** Abrir con DocuSmart Desktop (W-150.4): lo que más se hace con cada tipo de archivo, en ese orden. */
const OPEN_WITH: Record<ResultKind, string[]> = {
  pdf: ['pdf/comprimir', 'pdf/unir', 'pdf/editar', 'pdf/firmar', 'pdf/dividir', 'convertir/pdf-word', 'pdf/ocr', 'pdf/proteger', 'pdf/rotar', 'convertir/pdf-img', 'convertir/pdf-excel', 'pdf/reparar'],
  image: ['convertir/img-pdf', 'imagen/comprimir', 'imagen/redimensionar', 'imagen/recortar', 'imagen/texto', 'imagen/fondo', 'imagen/rotar', 'imagen/marca', 'convertir/img-jpg', 'convertir/img-png'],
  word: ['convertir/word-pdf'],
  excel: ['convertir/excel-pdf', 'convertir/excel-csv'],
  other: [],
}

/**
 * Herramientas para los archivos abiertos con DocuSmart Desktop. Varios PDF empiezan por Unir y varias imágenes
 * por Imagen a PDF; con tipos mezclados, solo lo que sirve para todos (si nada sirve, la lista queda vacía).
 */
export function openWithTools(files: ReadonlyArray<Pick<File, 'name' | 'type'>>, catalog: readonly CatalogTool[] = CATALOG): CatalogTool[] {
  const kinds = [...new Set(files.map(resultKind))]
  if (kinds.length !== 1) return []
  let keys = OPEN_WITH[kinds[0]]
  if (files.length > 1 && kinds[0] === 'pdf') keys = ['pdf/unir', ...keys.filter((k) => k !== 'pdf/unir')]
  return keys.map((key) => catalog.find((c) => c.key === key)).filter((c): c is CatalogTool => !!c)
}
