// Tipos de tools/guides.mjs (los usan las pruebas y vite.config.ts vía tools/locales).
export type GuideBlock = string | { ul: string[] } | { tip: string }

export interface Guide {
  slug: string
  title: string
  description: string
  h1: string
  lead: string
  minutes: number
  /** Ícono de src/shared/ui/Icon.tsx. */
  icon: string
  /** Slugs de tools/pages.mjs que la guía recomienda. */
  tools: string[]
  sections: Array<{ h2: string; body: GuideBlock[] }>
  steps: Array<{ name: string; text: string }>
  faq: Array<[string, string]>
}

export const GUIDES_UPDATED: string
export const guides: Guide[]
