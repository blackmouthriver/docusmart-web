/** Tipos comunes de Quitar metadatos (W-106). */

/** Clave del dato; la pantalla la traduce ("Autor", "Ubicación GPS"…). */
export type MetaKey =
  | 'title'
  | 'author'
  | 'subject'
  | 'keywords'
  | 'description'
  | 'creator'
  | 'producer'
  | 'software'
  | 'created'
  | 'modified'
  | 'lastModifiedBy'
  | 'company'
  | 'manager'
  | 'template'
  | 'revision'
  | 'editTime'
  | 'category'
  | 'camera'
  | 'lens'
  | 'serial'
  | 'dateTaken'
  | 'gps'
  | 'copyright'
  | 'orientation'
  | 'comment'
  | 'xmp'
  | 'iptc'
  | 'custom'
  | 'docId'
  // W-146.3: lo que no es metadato "clásico" pero revela datos personales.
  /** Fotos dentro del PDF que traen EXIF (cámara, GPS…). */
  | 'photos'
  /** Comentarios y notas del PDF. */
  | 'comments'
  /** Quién escribió comentarios o hizo cambios (PDF y Office). */
  | 'commentAuthors'
  /** Archivos adjuntos dentro del PDF. */
  | 'attachments'
  /** JavaScript o acciones automáticas del PDF. */
  | 'javascript'

export type MetaField = { key: MetaKey; value: string }

export type MetaKind = 'jpeg' | 'png' | 'webp' | 'pdf' | 'office' | 'tiff' | 'heif' | 'video'

export type StripResult = { bytes: Uint8Array; before: MetaField[]; after: MetaField[] }

export class MetaError extends Error {
  constructor(readonly reason: 'unsupported' | 'encrypted' | 'damaged' | 'empty') {
    super(reason)
  }
}
