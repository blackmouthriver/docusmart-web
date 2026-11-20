// Tipos de tools/locales/index.mjs (lo importan vite.config.ts y las pruebas).
import type { ToolPage } from '../pages.mjs'

export interface Locale {
  lang: string
  label: string
  ogLocale: string
  ui: Record<string, unknown>
}

export const generatedHtml: () => string[]
export const LANGS: Locale[]
/** La página de una herramienta en un idioma (textos traducidos). */
export function localized(page: ToolPage, loc: Locale): ToolPage
