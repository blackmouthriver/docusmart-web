// Tipos de tools/pages.mjs (lo importan vite.config.ts y el generador de páginas).
export type ToolSpec =
  | { kind: 'pdf'; id: 'unir' | 'dividir' | 'rotar' | 'reordenar' | 'numerar' | 'marca' | 'comprimir' | 'proteger' | 'desbloquear' | 'reparar' | 'ocr' | 'recortar' }
  | { kind: 'conv'; id: 'img-pdf' | 'img-jpg' | 'img-png' | 'img-webp' | 'img-bmp' | 'pdf-img' | 'pdf-txt' }
  | { kind: 'qr'; id?: undefined }
  | { kind: 'archive'; id: 'crear' | 'extraer' }

export interface ToolPage {
  slug: string
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
export const pages: ToolPage[]
