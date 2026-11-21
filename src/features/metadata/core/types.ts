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

export type MetaField = { key: MetaKey; value: string }

export type MetaKind = 'jpeg' | 'png' | 'webp' | 'pdf' | 'office'

export type StripResult = { bytes: Uint8Array; before: MetaField[]; after: MetaField[] }

export class MetaError extends Error {
  constructor(readonly reason: 'unsupported' | 'encrypted' | 'damaged') {
    super(reason)
  }
}
