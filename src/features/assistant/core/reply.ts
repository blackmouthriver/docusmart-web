/**
 * Respuesta del asistente (W-70c): elige la entrada o el "no sé" con sugerencias, resuelve las
 * relacionadas y deduce la herramienta de la pantalla abierta para dar contexto a la búsqueda.
 */
import { search, suggestionsFor, type Index, type KbEntry } from './engine'

/** Idiomas con base propia (los 12 del sitio, W-70e); cualquier otro usa el inglés. */
export const KB_LANGS = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ca', 'eu', 'ru', 'ja', 'ko', 'zh'] as const

export function kbLangFor(lang: string): (typeof KB_LANGS)[number] {
  return (KB_LANGS as readonly string[]).includes(lang) ? (lang as (typeof KB_LANGS)[number]) : 'en'
}

/** Herramienta (slug) de una pantalla de la app (#/pdf/unir → "unir-pdf"), si la hay. */
export function contextForRoute(index: Index, section: string, sub?: string): string | undefined {
  if (!section) return undefined
  const route = sub ? `${section}/${sub}` : section
  const tools = index.docs.map((d) => d.entry).filter((e) => e.tool && e.id === `tool:${e.tool}`)
  const exact = tools.find((e) => e.actions?.[0]?.kind === 'tool' && e.actions[0].app === route)
  if (exact) return exact.tool
  // Códigos QR: crear y leer comparten herramienta.
  return section === 'qr' ? tools.find((e) => e.actions?.[0]?.app?.startsWith('qr/'))?.tool : undefined
}

export type Reply =
  | { kind: 'answer'; entry: KbEntry; related: KbEntry[] }
  | { kind: 'fallback'; suggestions: KbEntry[]; contact?: KbEntry }

/** Respuesta a una pregunta escrita. */
export function reply(index: Index, query: string, context?: string): Reply {
  const out = search(index, query, { context, limit: 4 })
  if (!out.confident) return { kind: 'fallback', suggestions: suggestionsFor(index, context, 3), contact: index.byId.get('contacto') }
  return answerFor(index, out.results[0].entry, out.results.slice(1).map((r) => r.entry))
}

/** Respuesta a una entrada elegida (sugerencia o relacionada), con hasta 3 relacionadas. */
export function answerFor(index: Index, entry: KbEntry, alsoMatched: KbEntry[] = []): Reply {
  const fromEntry = (entry.related ?? []).map((id) => index.byId.get(id)).filter((e): e is KbEntry => !!e)
  const seen = new Set([entry.id])
  const related = [...fromEntry, ...alsoMatched].filter((e) => !seen.has(e.id) && seen.add(e.id)).slice(0, 3)
  return { kind: 'answer', entry, related }
}
