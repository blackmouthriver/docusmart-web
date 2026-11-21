// Tipos de tools/pages.mjs (lo importan vite.config.ts y el generador de páginas).
export type ToolSpec =
  | { kind: 'pdf'; id: 'unir' | 'dividir' | 'rotar' | 'reordenar' | 'numerar' | 'marca' | 'comprimir' | 'proteger' | 'desbloquear' | 'reparar' | 'ocr' | 'recortar' | 'firmar' | 'censurar' | 'comparar' | 'imagenes' | 'editar' | 'formulario' | 'escanear' | 'pdfa' }
  | { kind: 'conv'; id: 'img-pdf' | 'img-jpg' | 'img-png' | 'img-webp' | 'img-bmp' | 'pdf-img' | 'pdf-txt' | 'pdf-word' | 'pdf-excel' | 'word-pdf' | 'excel-pdf' }
  | { kind: 'qr'; id?: undefined }
  | { kind: 'doc'; id: 'cobro' }
  | { kind: 'archive'; id: 'crear' | 'extraer' }
  | { kind: 'img'; id: 'comprimir' | 'redimensionar' | 'recortar' | 'rotar' }

export type CategoryId = 'organizar' | 'editar' | 'documentos' | 'seguridad' | 'optimizar' | 'convertir' | 'imagen' | 'escanear' | 'archivos' | 'qr'

export interface ToolPage {
  slug: string
  /** Categoría (W-76): una de CATEGORIES. */
  category: CategoryId
  tool: ToolSpec
  title: string
  description: string
  h1: string
  /** Título de la sección de pasos cuando "Cómo {h1} en 3 pasos" no suena natural. */
  howTo?: string
  lead: string
  short: string
  steps: string[]
  faq: Array<[string, string]>
}

export const SITE: string
export const FACEBOOK_URL: string
export const INSTAGRAM_URL: string
export const TIKTOK_URL: string
export const PAGES_UPDATED: string
export const PRIVACY_UPDATED: string
/** Categorías de herramientas (W-76), en orden de presentación; el nombre está en ui.cats de cada idioma. */
export const CATEGORIES: Array<{ id: CategoryId; icon: string }>
export const pages: ToolPage[]
