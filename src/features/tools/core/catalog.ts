/**
 * Catálogo de herramientas de la app web (W-79): las mismas 9 categorías que la portada
 * y /herramientas (tools/pages.mjs, aprobadas por el usuario), pero con todas las
 * herramientas de la app, también las que no tienen página propia (reordenar, numerar,
 * marca de agua, imagen a PNG…). Cada entrada sabe a qué pantalla lleva.
 */
import type { IconName } from '../../../shared/ui/Icon'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { matchesQuery, sortByName } from '../../../shared/i18n/search'

export type CategoryId = 'organizar' | 'editar' | 'seguridad' | 'optimizar' | 'convertir' | 'imagen' | 'escanear' | 'archivos' | 'qr'

/** En el mismo orden e íconos que CATEGORIES de tools/pages.mjs (una prueba lo verifica). */
export const CATEGORIES: ReadonlyArray<{ id: CategoryId; icon: IconName }> = [
  { id: 'organizar', icon: 'merge' },
  { id: 'editar', icon: 'pen' },
  { id: 'seguridad', icon: 'lock' },
  { id: 'optimizar', icon: 'compress' },
  { id: 'convertir', icon: 'convert' },
  { id: 'imagen', icon: 'image' },
  { id: 'escanear', icon: 'camera' },
  { id: 'archivos', icon: 'archive' },
  { id: 'qr', icon: 'qr' },
]

export type CatalogTool = {
  /** Único en el catálogo: "pdf/unir", "convertir/img-pdf"… */
  key: string
  category: CategoryId
  icon: IconName
  name: MessageKey
  desc: MessageKey
  /** Pantalla de destino: go(section, sub). */
  section: string
  sub: string
}

const pdf = (id: string, category: CategoryId, icon: IconName): CatalogTool => ({
  key: `pdf/${id}`, category, icon, name: `tool.${id}` as MessageKey, desc: `tool.${id}.desc` as MessageKey, section: 'pdf', sub: id,
})
const conv = (id: string, icon: IconName, desc: MessageKey): CatalogTool => ({
  key: `convertir/${id}`, category: 'convertir', icon, name: `conv.name.${id}` as MessageKey, desc, section: 'convertir', sub: id,
})
const img = (id: string, icon: IconName, name: MessageKey): CatalogTool => ({
  key: `imagen/${id}`, category: 'imagen', icon, name, desc: `${name}.desc` as MessageKey, section: 'imagen', sub: id,
})

export const CATALOG: readonly CatalogTool[] = [
  pdf('unir', 'organizar', 'merge'),
  pdf('dividir', 'organizar', 'split'),
  pdf('rotar', 'organizar', 'rotate'),
  pdf('reordenar', 'organizar', 'reorder'),
  pdf('numerar', 'organizar', 'hash'),
  pdf('editar', 'editar', 'edit'),
  pdf('firmar', 'editar', 'pen'),
  pdf('formulario', 'editar', 'form'),
  pdf('marca', 'editar', 'stamp'),
  pdf('recortar', 'editar', 'crop'),
  pdf('censurar', 'editar', 'redact'),
  pdf('proteger', 'seguridad', 'lock'),
  pdf('desbloquear', 'seguridad', 'unlock'),
  pdf('reparar', 'seguridad', 'wrench'),
  pdf('comprimir', 'optimizar', 'compress'),
  pdf('pdfa', 'optimizar', 'archive'),
  pdf('comparar', 'optimizar', 'compare'),
  pdf('imagenes', 'optimizar', 'images'),
  pdf('escanear', 'escanear', 'camera'),
  pdf('ocr', 'escanear', 'text'),
  conv('img-pdf', 'image', 'conv.desc.imgPdf'),
  conv('img-jpg', 'image', 'conv.desc.imgJpg'),
  conv('img-png', 'image', 'conv.desc.imgPng'),
  conv('img-webp', 'image', 'conv.desc.imgWebp'),
  conv('img-bmp', 'image', 'conv.desc.imgBmp'),
  conv('pdf-img', 'images', 'conv.desc.pdfImg'),
  conv('pdf-txt', 'text', 'conv.desc.pdfTxt'),
  conv('pdf-word', 'convert', 'conv.desc.pdfWord'),
  conv('pdf-excel', 'convert', 'conv.desc.pdfExcel'),
  conv('word-pdf', 'convert', 'conv.desc.wordPdf'),
  conv('excel-pdf', 'convert', 'conv.desc.excelPdf'),
  img('comprimir', 'compress', 'imgt.compress'),
  img('redimensionar', 'resize', 'imgt.resize'),
  img('recortar', 'crop', 'imgt.crop'),
  img('rotar', 'rotate', 'imgt.rotate'),
  { key: 'archivos/crear', category: 'archivos', icon: 'archive', name: 'tools.arch.create', desc: 'tools.arch.create.desc', section: 'archivos', sub: 'crear' },
  { key: 'archivos/extraer', category: 'archivos', icon: 'folder', name: 'tools.arch.extract', desc: 'tools.arch.extract.desc', section: 'archivos', sub: 'extraer' },
  { key: 'qr/crear', category: 'qr', icon: 'qr', name: 'qr.create', desc: 'quick.makeQr.hint', section: 'qr', sub: 'crear' },
  { key: 'qr/leer', category: 'qr', icon: 'camera', name: 'qr.read', desc: 'quick.readQr.hint', section: 'qr', sub: 'leer' },
]

export type CategoryGroup = { id: CategoryId; icon: IconName; tools: CatalogTool[] }

/**
 * Herramientas agrupadas por categoría (en el orden de CATEGORIES), cada grupo en orden
 * alfabético del idioma y filtradas por la búsqueda (nombre, descripción o categoría).
 * Las categorías sin resultados no aparecen.
 */
export function groupTools(t: (key: MessageKey) => string, lang: string, query = '', catalog: readonly CatalogTool[] = CATALOG): CategoryGroup[] {
  return CATEGORIES.map((c) => {
    const catName = t(`cat.${c.id}` as MessageKey)
    const tools = catalog.filter((x) => x.category === c.id && matchesQuery(`${t(x.name)} ${t(x.desc)} ${catName}`, query))
    return { ...c, tools: sortByName(tools, (x) => t(x.name), lang) }
  }).filter((g) => g.tools.length > 0)
}

/** Cuántas herramientas tiene cada categoría (para los accesos del inicio). */
export const countByCategory = (catalog: readonly CatalogTool[] = CATALOG): Record<CategoryId, number> =>
  Object.fromEntries(CATEGORIES.map((c) => [c.id, catalog.filter((x) => x.category === c.id).length])) as Record<CategoryId, number>
