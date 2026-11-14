// Tipos de tools/pages.mjs (lo importan vite.config.ts y el generador de páginas).
export type ToolSpec =
  | { kind: 'pdf'; id: 'unir' | 'dividir' | 'rotar' | 'reordenar' | 'numerar' | 'marca' | 'comprimir' | 'proteger' | 'desbloquear' | 'reparar' }
  | { kind: 'conv'; id: 'img-pdf' | 'img-jpg' | 'img-png' | 'img-webp' | 'img-bmp' | 'pdf-img' | 'pdf-txt' }
  | { kind: 'qr'; id?: undefined }
  | { kind: 'archive'; id: 'crear' | 'extraer' }

export interface ToolPage {
  slug: string
  tool: ToolSpec
  title: string
  description: string
  h1: string
  lead: string
  short: string
  steps: string[]
  faq: Array<[string, string]>
}

export const SITE: string
export const pages: ToolPage[]
