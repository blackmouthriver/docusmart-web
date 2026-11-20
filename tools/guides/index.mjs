// Guías en varios idiomas (W-19). El español (tools/guides.mjs) es la fuente; cada idioma
// traducido vive en tools/guides/<idioma>.mjs con { ui, guides: { [slugEs]: guía traducida } }.
// Las guías traducidas heredan del español `minutes`, `icon` y `tools`.
// Para sumar un idioma: crea su archivo y agrégalo a TRANSLATIONS.
import { guides } from '../guides.mjs'
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

/** Textos fijos de las páginas de guías, en español. */
export const ES_GUIDE_UI = {
  guides: 'Guías',
  guidesSlug: 'guias',
  indexTitle: 'Guías de DocuSmart: PDF, fotos y documentos paso a paso',
  indexDescription:
    'Guías cortas y prácticas para unir, comprimir, firmar, escanear y proteger documentos desde el celular o el computador, gratis y sin subir tus archivos.',
  indexH1: 'Guías paso a paso',
  indexLead:
    'Tareas de todos los días con PDF, fotos y documentos, explicadas en pocos minutos. Todas se hacen en tu navegador, sin subir tus archivos.',
  minutes: '{n} min de lectura',
  updated: 'Actualizada el {date}',
  summary: 'Resumen rápido',
  toolsTitle: 'Herramientas de esta guía',
  moreGuides: 'Más guías',
  related: 'Guías relacionadas',
}

// Mismo orden que los idiomas del sitio (tools/locales).
const TRANSLATIONS = { en, pt, fr, it, de, ca, eu, ru, ja, ko, zh }

/** Idiomas que tienen guías (el español primero). */
export const GUIDE_LANGS = ['es', ...Object.keys(TRANSLATIONS)]

export const hasGuides = (lang) => GUIDE_LANGS.includes(lang)
export const guideUi = (lang) => (lang === 'es' ? ES_GUIDE_UI : TRANSLATIONS[lang].ui)

/** La guía en un idioma (texto traducido + lo que hereda del español). */
export function localizedGuide(guide, lang) {
  if (lang === 'es') return guide
  const t = TRANSLATIONS[lang].guides[guide.slug]
  if (!t) throw new Error(`tools/guides/${lang}.mjs: falta la guía ${guide.slug}`)
  return { ...t, minutes: guide.minutes, icon: guide.icon, tools: guide.tools, esSlug: guide.slug }
}

const prefix = (lang) => (lang === 'es' ? '' : `/${lang}`)
export const guidesIndexPath = (lang) => `${prefix(lang)}/${guideUi(lang).guidesSlug}`
export const guidePath = (guide, lang) => `${guidesIndexPath(lang)}/${localizedGuide(guide, lang).slug}`
export const guidesIndexFile = (lang) => `${guidesIndexPath(lang).slice(1)}.html`
export const guideFile = (guide, lang) => `${guidePath(guide, lang).slice(1)}.html`

/** Todos los HTML de guías, para las entradas de Vite. */
export const guideHtmlFiles = () => GUIDE_LANGS.flatMap((lang) => [guidesIndexFile(lang), ...guides.map((g) => guideFile(g, lang))])

export { guides }
