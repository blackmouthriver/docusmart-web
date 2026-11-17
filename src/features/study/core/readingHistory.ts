/**
 * Retomar lectura (W-62), como StudyReadingProgressStorage de la app: por documento
 * se recuerda en qué párrafo y página quedó la lectura, para seguir desde ahí.
 * Solo vive en este navegador.
 */

export type ReadingEntry = {
  /** Identifica el archivo: nombre, tamaño y fecha de modificación. */
  id: string
  name: string
  kind: 'pdf' | 'text'
  paragraph: number
  totalParagraphs: number
  /** Página actual y total (0 si no es un PDF). */
  page: number
  totalPages: number
  finished: boolean
  updatedAt: number
}

/** Máximo de documentos recordados (igual que la app). */
export const MAX_ENTRIES = 10
/** Documentos cuyo archivo se guarda para reabrirlos con un toque (los más recientes). */
export const MAX_STORED_FILES = 5
/** Tamaño máximo del archivo guardado: los más grandes se recuerdan sin copia y hay que volver a cargarlos. */
export const MAX_STORED_BYTES = 30 * 1024 * 1024

export const documentId = (f: Pick<File, 'name' | 'size' | 'lastModified'>) => `${f.name}|${f.size}|${f.lastModified}`

/** Agrega o actualiza un documento y deja primero el más reciente, sin pasar del máximo. */
export function upsertEntry(list: readonly ReadingEntry[], entry: ReadingEntry, max = MAX_ENTRIES): ReadingEntry[] {
  return [entry, ...list.filter((e) => e.id !== entry.id)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, max)
}

export const removeEntry = (list: readonly ReadingEntry[], id: string) => list.filter((e) => e.id !== id)

/** Ids cuyo archivo guardado ya no hace falta: los que salieron de la lista o pasan del máximo de copias. */
export function filesToDrop(list: readonly ReadingEntry[], storedIds: readonly string[], maxFiles = MAX_STORED_FILES): string[] {
  const keep = new Set(list.slice(0, maxFiles).map((e) => e.id))
  return storedIds.filter((id) => !keep.has(id))
}

/** Lista guardada a lista válida: descarta lo dañado sin perder el resto (como la app). */
export function parseEntries(json: string | null): ReadingEntry[] {
  let raw: unknown
  try {
    raw = JSON.parse(json ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is ReadingEntry =>
      !!e && typeof e === 'object' && typeof e.id === 'string' && !!e.id && typeof e.name === 'string' && (e.kind === 'pdf' || e.kind === 'text') && Number.isFinite(e.paragraph) && Number.isFinite(e.totalParagraphs) && Number.isFinite(e.updatedAt),
  )
}

/** Porcentaje leído de una entrada: por páginas en un PDF, por párrafos en un texto. */
export function entryPercent(e: ReadingEntry): number {
  if (e.finished) return 100
  if (e.totalPages > 0) return Math.floor((Math.max(0, e.page - 1) / e.totalPages) * 100)
  return e.totalParagraphs > 0 ? Math.floor((e.paragraph / e.totalParagraphs) * 100) : 0
}

/** Párrafo desde el que retomar: el guardado, o el principio si ya terminó o no coincide con el texto. */
export function resumeParagraph(e: ReadingEntry | undefined, totalParagraphs: number): number {
  if (!e || e.finished || e.totalParagraphs !== totalParagraphs) return 0
  return Math.min(Math.max(0, e.paragraph), Math.max(0, totalParagraphs - 1))
}
