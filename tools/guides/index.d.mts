// Tipos de tools/guides/index.mjs (guías en varios idiomas, W-19).
import type { Guide } from '../guides.mjs'

export interface GuideUi {
  guides: string
  guidesSlug: string
  indexTitle: string
  indexDescription: string
  indexH1: string
  indexLead: string
  minutes: string
  updated: string
  summary: string
  toolsTitle: string
  moreGuides: string
  related: string
}

export const ES_GUIDE_UI: GuideUi
export const GUIDE_LANGS: string[]
export function hasGuides(lang: string): boolean
/** Idiomas en que existe una guía (el español siempre). */
export function guideLangs(guide: Guide): string[]
export function hasGuideIn(guide: Guide, lang: string): boolean
/** Las guías de un idioma (las que ya tienen traducción). */
export function guidesIn(lang: string): Guide[]
export function guideUi(lang: string): GuideUi
export function localizedGuide(guide: Guide, lang: string): Guide & { esSlug?: string }
export function guidesIndexPath(lang: string): string
export function guidePath(guide: Guide, lang: string): string
export function guidesIndexFile(lang: string): string
export function guideFile(guide: Guide, lang: string): string
export function guideHtmlFiles(): string[]
export const guides: Guide[]
