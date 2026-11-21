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
  return out
}

export function stripOffice(bytes: Uint8Array): Uint8Array {
  const files = unzip(bytes)
  const out: Zippable = {}
  for (const [name, data] of Object.entries(files)) {
    if (name === CUSTOM) continue
    if (name === CORE) out[name] = strToU8(EMPTY_CORE)
    else if (name === APP) {
      let xml = strFromU8(data)
      for (const tag of APP_DROP) xml = xml.replace(new RegExp(`<${tag}>[^<]*</${tag}>|<${tag}\\s*/>`, 'g'), '')
      out[name] = strToU8(xml)
    } else if (name === '[Content_Types].xml' && files[CUSTOM]) {
      out[name] = strToU8(strFromU8(data).replace(/<Override\b[^>]*PartName="\/docProps\/custom\.xml"[^>]*\/>/g, ''))
    } else if (name === '_rels/.rels' && files[CUSTOM]) {
      out[name] = strToU8(strFromU8(data).replace(/<Relationship\b[^>]*Target="\/?docProps\/custom\.xml"[^>]*\/>/g, ''))
    } else out[name] = data
  }
  return zipSync(out, { level: 6 })
}
