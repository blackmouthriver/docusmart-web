// Idiomas de las páginas para buscadores. El español es la fuente (tools/pages.mjs
// e index.html); cada idioma traducido vive en tools/locales/<idioma>.mjs con:
//   - ui: los textos fijos de la plantilla de herramienta (mismas claves que ES_UI).
//   - pages: por slug español, la página traducida con su propio slug.
//   - landing: pares [texto en español, traducción] que se reemplazan en index.html.
// Para sumar un idioma: crea su archivo y agrégalo a LOCALES.
import { pages } from '../pages.mjs'
import en from './en.mjs'
import pt from './pt.mjs'
import fr from './fr.mjs'
import it from './it.mjs'

/** Textos fijos de la plantilla de herramienta, en español. */
export const ES_UI = {
  navMain: 'Principal',
  navTools: 'Herramientas',
  navWebApp: 'App web',
  navDownload: 'Descargar app',
  langMenu: 'Idioma',
  crumbs: 'Ruta',
  badges: ['Sin subir tus archivos', 'Gratis y sin registro', 'Funciona en el navegador'],
  toolAria: 'Herramienta',
  noscript: 'Para usar esta herramienta activa JavaScript en tu navegador. Todo el proceso ocurre en tu equipo.',
  howTo: 'Cómo {tool} en 3 pasos',
  privacyTitle: 'Tus archivos no salen de tu equipo',
  privacyText:
    'A diferencia de otras herramientas en línea, DocuSmart no sube tus documentos a ningún servidor: todo se procesa dentro de tu navegador. Puedes usarla con contratos, facturas o documentos de identidad con total tranquilidad.',
  privacyLink: 'Lee nuestra política de privacidad',
  faqTitle: 'Preguntas frecuentes',
  moreTools: 'Más herramientas gratis',
  allTools: 'Todas las herramientas',
  openWeb: 'Abre DocuSmart Web',
  ctaTitle: 'Lleva DocuSmart en tu celular',
  ctaText:
    'La app para Android suma escáner con detección de bordes, carpeta segura con PIN, Word, Excel y PowerPoint, y OCR. Funciona sin conexión.',
  ctaBtn: 'Descargar en Google Play',
  footAria: 'Pie de página',
  footHome: 'Inicio',
  footPrivacy: 'Política de privacidad',
  footConsent: 'Preferencias de analítica',
  os: 'Cualquiera (navegador web)',
}

export const ES = { lang: 'es', label: 'Español', ogLocale: 'es_ES', ui: ES_UI, pages: {}, landing: [] }
export const LOCALES = [en, pt, fr, it]
export const LANGS = [ES, ...LOCALES]

// Cada idioma debe traer todas las páginas y todos los textos de la plantilla.
for (const loc of LOCALES) {
  const missing = pages.filter((p) => !loc.pages[p.slug]).map((p) => p.slug)
  if (missing.length) throw new Error(`tools/locales/${loc.lang}.mjs: faltan páginas ${missing.join(', ')}`)
  const extra = Object.keys(loc.pages).filter((s) => !pages.some((p) => p.slug === s))
  if (extra.length) throw new Error(`tools/locales/${loc.lang}.mjs: sobran páginas ${extra.join(', ')}`)
  const missingUi = Object.keys(ES_UI).filter((k) => !(k in loc.ui))
  if (missingUi.length) throw new Error(`tools/locales/${loc.lang}.mjs: faltan textos ${missingUi.join(', ')}`)
  for (const [slug, p] of Object.entries(loc.pages)) {
    const src = pages.find((x) => x.slug === slug)
    if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`tools/locales/${loc.lang}.mjs: slug inválido "${p.slug}"`)
    if (p.steps.length !== src.steps.length) throw new Error(`tools/locales/${loc.lang}.mjs: ${slug} tiene ${p.steps.length} pasos (en español, ${src.steps.length})`)
    if (p.faq.length !== src.faq.length) throw new Error(`tools/locales/${loc.lang}.mjs: ${slug} tiene ${p.faq.length} preguntas (en español, ${src.faq.length})`)
  }
  // La portada: todos los idiomas reemplazan los mismos textos que el inglés (la referencia).
  const ref = new Set(en.landing.map(([from]) => from))
  const own = new Set(loc.landing.map(([from]) => from))
  const missingLanding = [...ref].filter((s) => !own.has(s))
  const extraLanding = [...own].filter((s) => !ref.has(s))
  if (missingLanding.length || extraLanding.length)
    throw new Error(`tools/locales/${loc.lang}.mjs: portada sin traducir ${JSON.stringify(missingLanding)}; sobran ${JSON.stringify(extraLanding)}`)
}

/** La página de una herramienta en un idioma (en español, la original). */
export const localized = (page, loc) => (loc.lang === 'es' ? page : { ...page, ...loc.pages[page.slug] })
/** Ruta pública: /unir-pdf o /en/merge-pdf. */
export const pagePath = (page, loc) => (loc.lang === 'es' ? `/${page.slug}` : `/${loc.lang}/${loc.pages[page.slug].slug}`)
/** Portada: / o /en/. */
export const homePath = (loc) => (loc.lang === 'es' ? '/' : `/${loc.lang}/`)
/** Archivo generado, relativo a la raíz del proyecto. */
export const filePath = (page, loc) => (loc.lang === 'es' ? `${page.slug}.html` : `${loc.lang}/${loc.pages[page.slug].slug}.html`)

// Ninguna ruta puede repetirse entre idiomas.
const seen = new Set()
for (const loc of LANGS)
  for (const p of pages) {
    const path = pagePath(p, loc)
    if (seen.has(path)) throw new Error(`Ruta repetida: ${path}`)
    seen.add(path)
  }

/** Todos los HTML generados (herramientas y portadas traducidas), para las entradas de Vite. */
export const generatedHtml = () => [
  ...LANGS.flatMap((loc) => pages.map((p) => filePath(p, loc))),
  ...LOCALES.map((loc) => `${loc.lang}/index.html`),
]
