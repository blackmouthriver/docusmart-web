// Base de conocimiento del asistente (W-70a): une las entradas propias (tools/assistant/<idioma>.mjs)
// con las generadas desde cada herramienta (qué hace, pasos y preguntas frecuentes de tools/pages.mjs y
// sus traducciones) y resuelve las acciones a enlaces. scripts/generate-tool-pages.mjs la escribe en
// public/assistant/<idioma>.json (estático, se descarga solo al abrir el asistente).
import { FACEBOOK_URL, INSTAGRAM_URL, pages } from '../pages.mjs'
import { guidesIndexPath } from '../guides/index.mjs'
import { LANGS, homePath, hubPath, localized, pagePath } from '../locales/index.mjs'
import es from './es.mjs'
import en from './en.mjs'
import pt from './pt.mjs'
import fr from './fr.mjs'
import it from './it.mjs'
import de from './de.mjs'
import ca from './ca.mjs'
import eu from './eu.mjs'
import ru from './ru.mjs'
import ja from './ja.mjs'
import ko from './ko.mjs'
import zh from './zh.mjs'

/** Base propia de los 12 idiomas del sitio (W-70e). */
export const KB_OWN = { es, en, pt, fr, it, de, ca, eu, ru, ja, ko, zh }
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.docsmart'
export const SUPPORT_EMAIL = 'supportdocusmart@docusmart.online'

/** Páginas y pantallas a las que puede llevar una respuesta (["page", clave]). `app`: ruta dentro de /app/. */
export const PAGES = {
  privacy: (loc) => ({ href: '/privacidad' }),
  tools: (loc) => ({ href: hubPath(loc) }),
  app: () => ({ href: '/app/', app: '' }),
  home: (loc) => ({ href: homePath(loc) }),
  study: () => ({ href: '/app/#/estudio', app: 'estudio' }),
  qr: () => ({ href: '/app/#/qr', app: 'qr' }),
  viewer: () => ({ href: '/app/#/', app: '' }),
  convert: () => ({ href: '/app/#/convertir', app: 'convertir' }),
  facebook: () => ({ href: FACEBOOK_URL, external: true }),
  instagram: () => ({ href: INSTAGRAM_URL, external: true }),
  guides: (loc) => ({ href: guidesIndexPath(loc.lang) }),
}

/** Ruta de la herramienta dentro de la app web (#/pdf/unir…), como en src/features/tools/core/catalog.ts. */
export function appRoute(tool) {
  if (tool.kind === 'pdf') return `pdf/${tool.id}`
  if (tool.kind === 'conv') return `convertir/${tool.id}`
  if (tool.kind === 'img') return `imagen/${tool.id}`
  if (tool.kind === 'archive') return `archivos/${tool.id}`
  if (tool.kind === 'meta') return 'metadatos/quitar'
  if (tool.kind === 'hash') return 'hash/calcular'
  if (tool.kind === 'media') return `multimedia/${tool.id}`
  if (tool.kind === 'doc') return `documentos/${tool.id}`
  return `qr/${tool.id ?? 'crear'}`
}

function resolveAction(action, loc, labels, where) {
  const [kind, key] = action
  if (kind === 'tool') {
    const page = pages.find((p) => p.slug === key)
    if (!page) throw new Error(`${where}: herramienta desconocida "${key}"`)
    return { kind: 'tool', label: labels.openTool.replace('{tool}', localized(page, loc).h1), href: pagePath(page, loc), app: appRoute(page.tool) }
  }
  if (kind === 'page') {
    const make = PAGES[key]
    if (!make) throw new Error(`${where}: página desconocida "${key}"`)
    if (!labels[key]) throw new Error(`${where}: falta labels.${key}`)
    return { kind: 'link', label: labels[key], ...make(loc) }
  }
  if (kind === 'play') return { kind: 'link', label: labels.play, href: PLAY_URL, external: true }
  if (kind === 'mail') return { kind: 'link', label: labels.mail, href: `mailto:${SUPPORT_EMAIL}`, external: true }
  throw new Error(`${where}: acción desconocida ${JSON.stringify(action)}`)
}

/** Entradas generadas de cada herramienta: qué hace (con sus pasos) y cada pregunta frecuente. */
function toolEntries(loc, labels) {
  const lowerFirst = (s) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
  return pages.flatMap((page) => {
    const p = localized(page, loc)
    const open = resolveAction(['tool', page.slug], loc, labels, page.slug)
    const howTo = p.howTo ?? loc.ui.howTo.replace('{tool}', lowerFirst(p.h1))
    const main = {
      id: `tool:${page.slug}`,
      q: [p.h1, p.short, howTo, p.description],
      a: `${p.lead}\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      actions: [open],
      tool: page.slug,
      related: p.faq.slice(0, 2).map((_, i) => `tool:${page.slug}:faq${i + 1}`),
    }
    const faq = p.faq.map(([q, a], i) => ({ id: `tool:${page.slug}:faq${i + 1}`, q: [q, p.h1], a, actions: [open], tool: page.slug }))
    return [main, ...faq]
  })
}

/** Base completa de un idioma, validada. */
export function buildKb(lang) {
  const own = KB_OWN[lang]
  const loc = LANGS.find((l) => l.lang === lang)
  if (!own || !loc) throw new Error(`Sin base del asistente para "${lang}"`)
  // Mismos ids, textos y etiquetas que el español.
  const ids = new Set(es.entries.map((e) => e.id))
  const mine = own.entries.map((e) => e.id)
  const missing = [...ids].filter((id) => !mine.includes(id))
  const extra = mine.filter((id) => !ids.has(id))
  if (missing.length || extra.length || mine.length !== ids.size) throw new Error(`tools/assistant/${lang}.mjs: faltan ${missing.join(', ') || '-'}; sobran o repetidos ${extra.join(', ') || '-'}`)
  for (const k of Object.keys(es.ui)) if (!own.ui[k]) throw new Error(`tools/assistant/${lang}.mjs: falta ui.${k}`)
  for (const k of Object.keys(es.labels)) if (!own.labels[k]) throw new Error(`tools/assistant/${lang}.mjs: falta labels.${k}`)

  const entries = [
    ...own.entries.map((e) => ({
      id: e.id,
      q: e.q,
      a: e.a,
      ...(e.actions ? { actions: e.actions.map((a) => resolveAction(a, loc, own.labels, `tools/assistant/${lang}.mjs ${e.id}`)) } : {}),
      ...(e.related ? { related: e.related } : {}),
    })),
    ...toolEntries(loc, own.labels),
  ]
  const all = new Set(entries.map((e) => e.id))
  if (all.size !== entries.length) throw new Error(`Base del asistente (${lang}): ids repetidos`)
  for (const e of entries) for (const r of e.related ?? []) if (!all.has(r)) throw new Error(`Base del asistente (${lang}): ${e.id} relaciona "${r}", que no existe`)
  return { lang, ui: own.ui, entries }
}

/** JSON con una entrada por línea (diferencias legibles en git). */
export function kbJson(kb) {
  return `{"lang":${JSON.stringify(kb.lang)},"ui":${JSON.stringify(kb.ui)},"entries":[\n${kb.entries.map((e) => JSON.stringify(e)).join(',\n')}\n]}\n`
}
