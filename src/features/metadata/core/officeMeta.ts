/**
 * Metadatos de Word, Excel y PowerPoint (.docx, .xlsx, .pptx) (W-106): las propiedades del
 * documento (autor, última persona que lo modificó, fechas, empresa, plantilla, tiempo de
 * edición) y las propiedades personalizadas. El contenido del documento no se toca.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import { MetaError, type MetaField, type MetaKey } from './types'

const CORE = 'docProps/core.xml'
const APP = 'docProps/app.xml'
const CUSTOM = 'docProps/custom.xml'

const CORE_KEYS: Record<string, MetaKey> = {
  title: 'title',
  subject: 'subject',
  creator: 'author',
  keywords: 'keywords',
  description: 'description',
  lastModifiedBy: 'lastModifiedBy',
  revision: 'revision',
  created: 'created',
  modified: 'modified',
  category: 'category',
  lastPrinted: 'modified',
}
const APP_KEYS: Record<string, MetaKey> = {
  Application: 'software',
  Company: 'company',
  Manager: 'manager',
  Template: 'template',
  TotalTime: 'editTime',
  HyperlinkBase: 'custom',
}
const APP_DROP = Object.keys(APP_KEYS).concat('AppVersion')

const EMPTY_CORE =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>'

const unescape = (s: string) =>
  s.replace(/&(lt|gt|quot|apos|amp);/g, (_, e: string) => ({ lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[e] ?? '')

/** ¿Es un documento de Office (ZIP con [Content_Types].xml)? */
export function isOfficeZip(files: Record<string, Uint8Array>): boolean {
  return '[Content_Types].xml' in files
}

function unzip(bytes: Uint8Array): Record<string, Uint8Array> {
  try {
    const files = unzipSync(bytes)
    if (!isOfficeZip(files)) throw new MetaError('unsupported')
    return files
  } catch (e) {
    throw e instanceof MetaError ? e : new MetaError('damaged')
  }
}

const isoDate = (s: string) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) ? s.slice(0, 16).replace('T', ' ') : s)

/* ───────────── Autores de comentarios y cambios (W-146.3) ───────────── */

/** Nombre que reemplaza a las personas en comentarios y control de cambios. */
export const ANONYMOUS = 'Autor'
/** Partes con nombres de personas (Word, Excel y PowerPoint). */
const PEOPLE_PARTS = /^(word\/people\.xml|xl\/persons\/person\d*\.xml)$/
/** Partes de contenido donde viven comentarios y revisiones. */
const isContentXml = (name: string) => /^(word|xl|ppt)\/.+\.xml$/.test(name) && !name.includes('/media/')

/** Los nombres de las personas que comentaron o hicieron cambios. */
export function commentAuthors(files: Record<string, Uint8Array>): string[] {
  const names = new Set<string>()
  for (const [name, data] of Object.entries(files)) {
    if (!isContentXml(name)) continue
    const xml = strFromU8(data)
    // Word (w:author), PowerPoint (name en p:cmAuthor), Excel moderno (displayName en person; en
    // otras partes de Excel displayName es el nombre de una tabla y no se toca).
    for (const m of xml.matchAll(/\b(?:w:author|w15:author)="([^"]*)"/g)) names.add(unescape(m[1]).trim())
    if (PEOPLE_PARTS.test(name)) for (const m of xml.matchAll(/\bdisplayName="([^"]*)"/g)) names.add(unescape(m[1]).trim())
    if (name === 'ppt/commentAuthors.xml') for (const m of xml.matchAll(/<p:cmAuthor\b[^>]*\bname="([^"]*)"/g)) names.add(unescape(m[1]).trim())
    // Excel clásico: <authors><author>Nombre</author></authors>
    if (/^xl\/comments\d*\.xml$/.test(name)) for (const m of xml.matchAll(/<author>([^<]*)<\/author>/g)) names.add(unescape(m[1]).trim())
  }
  names.delete('')
  names.delete(ANONYMOUS)
  return [...names]
}

/** Reemplaza los nombres, iniciales y cuentas de las personas en una parte del documento. */
function anonymize(name: string, xml: string): string {
  let out = xml.replace(/\b(w:author|w15:author)="[^"]*"/g, `$1="${ANONYMOUS}"`).replace(/\b(w:initials)="[^"]*"/g, '$1="A"')
  if (PEOPLE_PARTS.test(name))
    out = out
      .replace(/\b(displayName)="[^"]*"/g, `$1="${ANONYMOUS}"`)
      .replace(/\b(userId)="[^"]*"/g, '$1=""')
      .replace(/\b(providerId)="[^"]*"/g, '$1="None"')
  if (name === 'ppt/commentAuthors.xml') out = out.replace(/(<p:cmAuthor\b[^>]*\bname=")[^"]*"/g, `$1${ANONYMOUS}"`).replace(/(<p:cmAuthor\b[^>]*\binitials=")[^"]*"/g, '$1A"')
  if (/^xl\/comments\d*\.xml$/.test(name)) out = out.replace(/<author>[^<]*<\/author>/g, `<author>${ANONYMOUS}</author>`)
  return out
}

export function readOffice(bytes: Uint8Array): MetaField[] {
  const files = unzip(bytes)
  const out: MetaField[] = []
  if (files[CORE]) {
    for (const m of strFromU8(files[CORE]).matchAll(/<(?:dc|cp|dcterms):(\w+)[^>]*>([^<]*)(?=<)/g)) {
      const key = CORE_KEYS[m[1]]
      const value = unescape(m[2]).trim()
      if (key && value) out.push({ key, value: key === 'created' || key === 'modified' ? isoDate(value) : value })
    }
  }
  if (files[APP]) {
    for (const m of strFromU8(files[APP]).matchAll(/<(\w+)>([^<]+)<\/\1>/g)) {
      const key = APP_KEYS[m[1]]
      const value = unescape(m[2]).trim()
      // TotalTime 0 o vacío no dice nada.
      if (key && value && !(key === 'editTime' && value === '0')) out.push({ key, value: key === 'editTime' ? `${value} min` : value })
    }
  }
  if (files[CUSTOM]) {
    for (const m of strFromU8(files[CUSTOM]).matchAll(/<property\b[^>]*\bname="([^"]*)"[^>]*>\s*<vt:\w+>([^<]*)</g)) out.push({ key: 'custom', value: `${unescape(m[1])}: ${unescape(m[2])}` })
  }
  const authors = commentAuthors(files)
  if (authors.length) out.push({ key: 'commentAuthors', value: authors.join(', ') })
  return out
}

export function stripOffice(bytes: Uint8Array): Uint8Array {
  const files = unzip(bytes)
  const out: Zippable = {}
  // Word guarda las cuentas de quienes comentaron en people.xml: se quita la parte y sus referencias.
  const dropPeople = 'word/people.xml' in files
  for (const [name, data] of Object.entries(files)) {
    if (name === CUSTOM) continue
    if (name === 'word/people.xml') continue
    if (PEOPLE_PARTS.test(name) || (isContentXml(name) && !name.endsWith('.rels'))) {
      out[name] = strToU8(anonymize(name, strFromU8(data)))
      continue
    }
    if (dropPeople && name === 'word/_rels/document.xml.rels') {
      out[name] = strToU8(strFromU8(data).replace(/<Relationship\b[^>]*Target="people\.xml"[^>]*\/>/g, ''))
      continue
    }
    if (name === CORE) out[name] = strToU8(EMPTY_CORE)
    else if (name === APP) {
      let xml = strFromU8(data)
      for (const tag of APP_DROP) xml = xml.replace(new RegExp(`<${tag}>[^<]*</${tag}>|<${tag}\\s*/>`, 'g'), '')
      out[name] = strToU8(xml)
    } else if (name === '[Content_Types].xml' && (files[CUSTOM] || dropPeople)) {
      out[name] = strToU8(
        strFromU8(data)
          .replace(/<Override\b[^>]*PartName="\/docProps\/custom\.xml"[^>]*\/>/g, '')
          .replace(/<Override\b[^>]*PartName="\/word\/people\.xml"[^>]*\/>/g, ''),
      )
    } else if (name === '_rels/.rels' && files[CUSTOM]) {
      out[name] = strToU8(strFromU8(data).replace(/<Relationship\b[^>]*Target="\/?docProps\/custom\.xml"[^>]*\/>/g, ''))
    } else out[name] = data
  }
  return zipSync(out, { level: 6 })
}
