// Idiomas de las páginas para buscadores. El español es la fuente (tools/pages.mjs
// e index.html); cada idioma traducido vive en tools/locales/<idioma>.mjs con:
//   - ui: los textos fijos de la plantilla de herramienta (mismas claves que ES_UI).
//   - pages: por slug español, la página traducida con su propio slug.
//   - landing: pares [texto en español, traducción] que se reemplazan en index.html.
// Para sumar un idioma: crea su archivo y agrégalo a LOCALES.
import { CATEGORIES, pages } from '../pages.mjs'
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
  // Categorías y página "Todas las herramientas" (W-76/W-78)
  cats: { organizar: "Organizar PDF", editar: "Editar y firmar", seguridad: "Seguridad", optimizar: "Optimizar y archivar", convertir: "Convertir", imagen: "Imagen", escanear: "Escanear y OCR", archivos: "Archivos comprimidos", qr: "Códigos QR" },
  hubSlug: "herramientas",
  hubTitle: "Todas las herramientas gratis: PDF, imagen, QR y más | DocuSmart",
  hubDescription: "Todas las herramientas de DocuSmart por categoría: unir, convertir, firmar y comprimir PDF, editar imágenes, OCR, QR y archivos ZIP. Gratis y sin subir tus archivos.",
  hubH1: "Todas las herramientas",
  hubLead: "{n} herramientas gratis que funcionan en tu navegador, sin subir tus archivos. Elige una categoría o busca por nombre.",
  hubSearch: "Buscar herramienta",
  hubSearchHint: "Por ejemplo: unir, Word, foto…",
  hubEmpty: "Ninguna herramienta coincide con tu búsqueda.",
  hubJump: "Categorías",
  toolsOne: "1 herramienta",
  toolsMany: "{n} herramientas",
  seeAll: "Ver las {n} herramientas",
}

export const ES = { lang: 'es', label: 'Español', ogLocale: 'es_ES', ui: ES_UI, pages: {}, landing: [] }
export const LOCALES = [en, pt, fr, it, de, ca, eu, ru, ja, ko, zh]
export const LANGS = [ES, ...LOCALES]

// Cada idioma debe traer todas las páginas y todos los textos de la plantilla.
for (const loc of LOCALES) {
  const missing = pages.filter((p) => !loc.pages[p.slug]).map((p) => p.slug)
  if (missing.length) throw new Error(`tools/locales/${loc.lang}.mjs: faltan páginas ${missing.join(', ')}`)
  const extra = Object.keys(loc.pages).filter((s) => !pages.some((p) => p.slug === s))
  if (extra.length) throw new Error(`tools/locales/${loc.lang}.mjs: sobran páginas ${extra.join(', ')}`)
  const missingUi = Object.keys(ES_UI).filter((k) => !(k in loc.ui))
  if (missingUi.length) throw new Error(`tools/locales/${loc.lang}.mjs: faltan textos ${missingUi.join(', ')}`)
  const missingCats = CATEGORIES.filter((c) => !loc.ui.cats?.[c.id]).map((c) => c.id)
  if (missingCats.length) throw new Error(`tools/locales/${loc.lang}.mjs: faltan categorías ${missingCats.join(', ')}`)
  if (!/^[a-z0-9-]+$/.test(loc.ui.hubSlug)) throw new Error(`tools/locales/${loc.lang}.mjs: hubSlug inválido "${loc.ui.hubSlug}"`)
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
/** Página "Todas las herramientas" (W-78): /herramientas o /en/tools. */
export const hubPath = (loc) => (loc.lang === 'es' ? `/${ES_UI.hubSlug}` : `/${loc.lang}/${loc.ui.hubSlug}`)
/** Su archivo generado, relativo a site/. */
export const hubFile = (loc) => (loc.lang === 'es' ? `${ES_UI.hubSlug}.html` : `${loc.lang}/${loc.ui.hubSlug}.html`)
/** "1 herramienta" / "5 herramientas" en el idioma. */
export const toolCount = (loc, n) => (n === 1 ? loc.ui.toolsOne : loc.ui.toolsMany.replace('{n}', String(n)))
/** Archivo generado, relativo a la raíz del proyecto. */
export const filePath = (page, loc) => (loc.lang === 'es' ? `${page.slug}.html` : `${loc.lang}/${loc.pages[page.slug].slug}.html`)

// Ninguna ruta puede repetirse entre idiomas.
const seen = new Set()
for (const loc of LANGS)
  for (const path of [...pages.map((p) => pagePath(p, loc)), hubPath(loc)]) {
    if (seen.has(path)) throw new Error(`Ruta repetida: ${path}`)
    seen.add(path)
  }
// Toda página debe tener una categoría conocida.
for (const p of pages)
  if (!CATEGORIES.some((c) => c.id === p.category)) throw new Error(`tools/pages.mjs: ${p.slug} sin categoría válida (${p.category})`)

/** Todos los HTML generados (herramientas y portadas traducidas), para las entradas de Vite. */
export const generatedHtml = () => [
  ...LANGS.flatMap((loc) => pages.map((p) => filePath(p, loc))),
  ...LOCALES.map((loc) => `${loc.lang}/index.html`),
  ...LANGS.map(hubFile),
]
