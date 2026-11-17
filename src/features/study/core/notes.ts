/**
 * Notas del Modo Estudio (W-65), como en la app: título, texto, imágenes adjuntas,
 * edición y exportar una o todas a TXT o PDF. Las notas viven solo en este navegador.
 */
import type { OBlock, OImage } from '../../convert/core/officePdf'

export type StudyNote = {
  id: string
  title: string
  text: string
  /** Creada y modificada (milisegundos). */
  at: number
  updatedAt: number
  /** Ids de las imágenes adjuntas (guardadas aparte, en IndexedDB), en orden. */
  images: string[]
}

/** Máximo de imágenes por nota, para no llenar el almacenamiento del navegador. */
export const MAX_NOTE_IMAGES = 4

/** Lista guardada a lista válida. Acepta las notas antiguas de la web ({ id, text, at }). */
export function parseNotes(json: string | null): StudyNote[] {
  let raw: unknown
  try {
    raw = JSON.parse(json ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  const out: StudyNote[] = []
  for (const n of raw) {
    if (!n || typeof n !== 'object' || typeof n.id !== 'string' || typeof n.text !== 'string' || !Number.isFinite(n.at)) continue
    out.push({
      id: n.id,
      title: typeof n.title === 'string' ? n.title : '',
      text: n.text,
      at: n.at,
      updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : n.at,
      images: Array.isArray(n.images) ? n.images.filter((i: unknown): i is string => typeof i === 'string').slice(0, MAX_NOTE_IMAGES) : [],
    })
  }
  return out
}

/** Agrega o reemplaza una nota; la recién guardada queda primero. */
export const upsertNote = (list: readonly StudyNote[], note: StudyNote): StudyNote[] => [note, ...list.filter((n) => n.id !== note.id)]

/** Ids de imágenes que ya no usa ninguna nota (para borrarlas). */
export function orphanImages(list: readonly StudyNote[], storedIds: readonly string[]): string[] {
  const used = new Set(list.flatMap((n) => n.images))
  return storedIds.filter((id) => !used.has(id))
}

export type NoteLabels = { untitled: string; date: (ms: number) => string; image: string }

/** Una nota como texto plano: título, fecha y texto (las imágenes se indican, un TXT no puede llevarlas). */
export function noteToText(n: StudyNote, l: NoteLabels): string {
  const lines = [n.title.trim() || l.untitled, l.date(n.at), '', n.text.trim()]
  if (n.images.length) lines.push('', ...n.images.map((_, i) => `[${l.image} ${i + 1}]`))
  return lines.join('\n')
}

export const notesToText = (notes: readonly StudyNote[], l: NoteLabels) => notes.map((n) => noteToText(n, l)).join('\n\n────────────\n\n')

/**
 * Bloques para el generador de PDF (el mismo de Word a PDF): por nota, el título,
 * la fecha, el texto línea por línea y las imágenes en su orden; una nota por página.
 */
export function notesToBlocks(notes: readonly StudyNote[], images: ReadonlyMap<string, Omit<OImage, 'kind' | 'align'>>, l: NoteLabels): OBlock[] {
  const blocks: OBlock[] = []
  notes.forEach((n, i) => {
    if (i > 0) blocks.push({ kind: 'pagebreak' })
    blocks.push({ kind: 'para', style: 'h1', runs: [{ text: n.title.trim() || l.untitled, bold: true }] })
    blocks.push({ kind: 'para', runs: [{ text: l.date(n.at), italic: true, size: 9 }] })
    for (const line of n.text.split('\n')) blocks.push({ kind: 'para', runs: [{ text: line || ' ' }] })
    for (const id of n.images) {
      const img = images.get(id)
      if (img) blocks.push({ kind: 'image', align: 'center', ...img })
    }
  })
  return blocks
}

/** Nombre de archivo para exportar: el título de la nota (o "notas" si son todas). */
export function exportName(notes: readonly StudyNote[], allLabel: string, ext: 'txt' | 'pdf'): string {
  const base = notes.length === 1 ? notes[0].title.trim() || allLabel : allLabel
  return `${base.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60)}.${ext}`
}
