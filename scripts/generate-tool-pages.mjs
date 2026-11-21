// Genera las páginas para buscadores a partir de tools/pages.mjs (español) y de
// tools/locales/<idioma>.mjs (traducciones):
//   - Una página por herramienta: /unir-pdf (español) y /en/merge-pdf, etc.
//   - La portada en cada idioma: /en/ se arma desde site/index.html con la tabla
//     de reemplazos del idioma, así hay una sola portada que mantener.
//   - hreflang entre todas las versiones, selector de idioma y sitemap.xml.
// Las páginas se escriben en site/ (la raíz de Vite). El texto queda en el HTML
// para que los buscadores lo lean sin ejecutar JavaScript; la herramienta se
// monta encima con src/entries/tool-page.tsx.
// Se ejecuta antes de `dev` y `build`; los archivos generados se versionan y el
// CI verifica que estén al día (`npm run pages:check`).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CATEGORIES, FACEBOOK_URL, INSTAGRAM_URL, PAGES_UPDATED, PRIVACY_UPDATED, SITE, TIKTOK_URL, pages } from '../tools/pages.mjs'
import { KB_OWN, buildKb, kbJson } from '../tools/assistant/build.mjs'
import { GUIDES_UPDATED } from '../tools/guides.mjs'
import { GUIDE_LANGS, guideFile, guidePath, guideUi, guides, guidesIndexFile, guidesIndexPath, hasGuides, localizedGuide } from '../tools/guides/index.mjs'
import { ES, LANGS, LOCALES, filePath, homePath, hubFile, hubPath, localized, pagePath, toolCount } from '../tools/locales/index.mjs'

const root = join(import.meta.dirname, '..')
/** Carpeta de las páginas HTML (raíz de Vite), relativa al proyecto. */
const SITE_DIR = 'site'
/** Ruta del script de entrada desde una página a cierta profundidad bajo site/. */
const entryScript = (name, depth) => `${'../'.repeat(depth + 1)}src/entries/${name}`
const check = process.argv.includes('--check')
const stale = []

/** Escribe el archivo si cambió (o lo anota como desactualizado con --check). */
function emit(rel, content) {
  const file = join(root, rel)
  let current = null
  try {
    current = readFileSync(file, 'utf-8')
  } catch {
    /* todavía no existe */
  }
  if (current === content) return
  if (check) stale.push(rel)
  else {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
}

// ── Íconos (W-73): los mismos trazos que src/shared/ui/Icon.tsx, para no duplicarlos ──
const ICON_PATHS = Object.fromEntries(
  [...readFileSync(join(root, 'src/shared/ui/Icon.tsx'), 'utf-8').matchAll(/^ {2}([a-z]+): '([^']+)'/gm)].map((m) => [m[1], m[2]]),
)
/** SVG decorativo (aria-hidden) con un ícono de la app. */
function svg(name, cls) {
  const d = ICON_PATHS[name]
  if (!d) throw new Error(`Ícono desconocido: ${name}`)
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`
}
/** Ícono de cada herramienta, el mismo que usa en la app web (PdfTools, ImageTools, Converter…). */
const PDF_ICONS = { unir: 'merge', reordenar: 'reorder', numerar: 'hash', marca: 'stamp', dividir: 'split', rotar: 'rotate', escanear: 'camera', formulario: 'form', editar: 'edit', imagenes: 'images', comparar: 'compare', censurar: 'redact', firmar: 'pen', recortar: 'crop', comprimir: 'compress', proteger: 'lock', desbloquear: 'unlock', reparar: 'wrench', ocr: 'text', pdfa: 'archive' }
const IMG_ICONS = { comprimir: 'compress', redimensionar: 'resize', recortar: 'crop', rotar: 'rotate', fondo: 'eraser', documento: 'user', marca: 'stamp', ajustar: 'settings', texto: 'text' }
const CONV_ICONS = { 'img-pdf': 'image', 'img-png': 'image', 'img-jpg': 'image', 'img-webp': 'image', 'heic-jpg': 'image', 'img-gif': 'image', 'img-avif': 'image', 'img-ico': 'image', 'svg-png': 'image', 'tiff-jpg': 'image', 'pdf-img': 'images', 'pdf-txt': 'text' }
function toolIcon({ kind, id }) {
  if (kind === 'pdf') return PDF_ICONS[id] ?? 'pdf'
  if (kind === 'img') return IMG_ICONS[id] ?? 'image'
  if (kind === 'conv') return CONV_ICONS[id] ?? 'convert'
  if (kind === 'archive') return id === 'extraer' ? 'folder' : 'archive'
  if (kind === 'meta') return 'eraser'
  if (kind === 'hash') return 'fingerprint'
  if (kind === 'media') return { audio: 'music', convertir: 'convert', recortar: 'scissors', comprimir: 'compress' }[id] ?? 'video'
  if (kind === 'doc') return id === 'cv' ? 'user' : 'file'
  return 'qr'
}
/** Los tres pasos: elegir → la herramienta → descargar (escribir en el QR, cámara al escanear). */
function stepIcons(tool) {
  const first = tool.kind === 'qr' ? 'type' : tool.id === 'escanear' ? 'camera' : 'upload'
  return [first, toolIcon(tool), 'download']
}

/** Primera letra en minúscula para "Cómo unir PDF…", salvo siglas como OCR. */
const lowerFirst = (s) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// JSON-LD dentro de <script>: evita que un "</" del texto cierre la etiqueta.
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')

/** <link rel="alternate" hreflang> de una página en todos los idiomas (más x-default = español). */
function alternates(pathFor) {
  return [
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l.lang}" href="${SITE}${pathFor(l)}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${pathFor(ES)}">`,
  ].join('\n')
}

/** Selector de idioma sin JavaScript: enlaces a la misma página en cada idioma. */
function langMenu(current, pathFor, cls, indent) {
  const items = LANGS.map(
    (l) =>
      `    <li><a href="${pathFor(l)}" hreflang="${l.lang}" lang="${l.lang}" data-set-lang="${l.lang}"${l.lang === current.lang ? ' aria-current="page"' : ''}>${esc(l.label)}</a></li>`,
  )
  return [
    `<details class="${cls}">`,
    `  <summary aria-label="${current.lang.toUpperCase()} · ${esc(current.ui.langMenu)}: ${esc(current.label)}"><span aria-hidden="true">🌐</span> ${current.lang.toUpperCase()}</summary>`,
    '  <ul>',
    ...items,
    '  </ul>',
    '</details>',
  ]
    .map((l) => indent + l)
    .join('\n')
}

// ── Guías relacionadas en las páginas de herramientas (W-19) ──────────────
/** Enlace a las guías en el pie, en los idiomas que las tienen. */
const guidesFootLink = (loc) =>
  hasGuides(loc.lang) ? `      <a href="${guidesIndexPath(loc.lang)}">${esc(guideUi(loc.lang).guides)}</a>\n` : ''

function relatedGuides(page, loc) {
  if (!hasGuides(loc.lang)) return ''
  const list = guides.filter((g) => g.tools.includes(page.slug))
  if (!list.length) return ''
  const gui = guideUi(loc.lang)
  return `  <section class="tp-wrap tp-section reveal">
    <h2>${esc(gui.related)}</h2>
    <ul class="tp-related">
${list.map((g) => `      <li><a href="${guidePath(g, loc.lang)}"><b>${esc(localizedGuide(g, loc.lang).h1)}</b><span>${esc(gui.minutes.replace('{n}', String(g.minutes)))}</span></a></li>`).join('\n')}
    </ul>
  </section>

`
}

// ── Página de cada herramienta ───────────────────────────────────────────────
function render(page, loc) {
  const p = localized(page, loc)
  const ui = loc.ui
  const url = `${SITE}${pagePath(page, loc)}`
  const pathFor = (l) => pagePath(page, l)
  const related = pages.filter((x) => x.slug !== page.slug)
  const toolAttrs = `data-kind="${esc(page.tool.kind)}"${page.tool.id ? ` data-id="${esc(page.tool.id)}"` : ''} data-slug="${esc(page.slug)}"`
  const home = homePath(loc)

  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${p.h1} · DocuSmart`,
      url,
      description: p.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: ui.os,
      isAccessibleForFree: true,
      inLanguage: loc.lang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'DocuSmart', url: SITE, sameAs: [FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL] },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}${home}` },
        { '@type': 'ListItem', position: 2, name: p.h1, item: url },
      ],
    },
  ]

  return `<!doctype html>
<!-- Generado por scripts/generate-tool-pages.mjs desde tools/pages.mjs. No editar a mano. -->
<html lang="${loc.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="theme-color" content="#0B1020">
<link rel="canonical" href="${url}">
${alternates(pathFor)}
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DocuSmart">
<meta property="og:locale" content="${loc.ogLocale}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og/${loc.lang}.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${jsonLd(structured)}
</script>
</head>
<body class="tool-page">
<header class="tp-nav">
  <div class="tp-wrap tp-nav-inner">
    <a class="tp-brand" href="${home}"><img src="/img/icon.svg" alt="" width="30" height="30">DocuSmart</a>
    <nav aria-label="${esc(ui.navMain)}">
      <a href="#herramientas">${esc(ui.navTools)}</a>
      <a href="/app/">${esc(ui.navWebApp)}</a>
${langMenu(loc, pathFor, 'tp-lang', '      ')}
      <a class="tp-nav-cta" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool">${esc(ui.navDownload)}</a>
    </nav>
  </div>
</header>

<main>
  <section class="tp-hero">
    <div class="tp-wrap tp-hero-grid">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(ui.crumbs)}"><a href="${home}">DocuSmart</a><span aria-hidden="true">›</span><span>${esc(p.h1)}</span></nav>
      <h1>${esc(p.h1)}</h1>
      <p class="tp-lead">${esc(p.lead)}</p>
      <ul class="tp-badges">
${ui.badges.map((b) => `        <li>${esc(b)}</li>`).join('\n')}
      </ul>
      </div>
      <div class="tp-hero-art" aria-hidden="true">
        <span class="tp-ring"></span><span class="tp-ring tp-ring-2"></span>
        <span class="tp-tile">${svg(toolIcon(page.tool), 'tp-tile-ico')}<span class="tp-scan"></span></span>
        <span class="tp-chip tp-chip-a">${svg('shield', 'tp-chip-ico')}</span>
        <span class="tp-chip tp-chip-b">${svg('check', 'tp-chip-ico')}</span>
      </div>
    </div>
  </section>

  <section class="tp-wrap tp-tool" aria-label="${esc(ui.toolAria)}">
    <div id="tool" ${toolAttrs}>
      <noscript><p class="tp-noscript">${esc(ui.noscript)}</p></noscript>
    </div>
  </section>

  <section class="tp-wrap tp-section reveal">
    <h2>${esc(p.howTo ?? ui.howTo.replace('{tool}', lowerFirst(p.h1)))}</h2>
    <ol class="tp-steps" data-stagger="120">
${p.steps.map((s, i) => `      <li class="reveal"><span class="tp-step-ico">${svg(stepIcons(page.tool)[i] ?? 'check', 'tp-step-svg')}</span><span>${esc(s)}</span></li>`).join('\n')}
    </ol>
  </section>

  <section class="tp-wrap tp-section tp-privacy reveal">
    <h2>${esc(ui.privacyTitle)}</h2>
    <p>${esc(ui.privacyText)} <a href="/privacidad">${esc(ui.privacyLink)}</a>.</p>
  </section>

  <section class="tp-wrap tp-section reveal">
    <h2>${esc(ui.faqTitle)}</h2>
    <div class="tp-faq">
${p.faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <p>${esc(a)}</p>\n      </details>`).join('\n')}
    </div>
  </section>

${relatedGuides(page, loc)}  <section class="tp-wrap tp-section reveal" id="herramientas">
    <h2>${esc(ui.moreTools)}</h2>
    <ul class="tp-related">
${related.map((r) => `      <li><a href="${pagePath(r, loc)}"><b>${esc(localized(r, loc).h1)}</b><span>${esc(localized(r, loc).short)}</span></a></li>`).join('\n')}
      <li><a href="${hubPath(loc)}"><b>${esc(ui.allTools)}</b><span>${esc(toolCount(loc, pages.length))}</span></a></li>
    </ul>
  </section>

  <section class="tp-wrap tp-section reveal" data-reveal="scale">
    <div class="tp-cta">
      <div>
        <h2>${esc(ui.ctaTitle)}</h2>
        <p>${esc(ui.ctaText)}</p>
      </div>
      <a class="btn btn-primary ds-press" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool_cta">${esc(ui.ctaBtn)}</a>
    </div>
  </section>
</main>

<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="${esc(ui.footAria)}">
      <a href="${home}">${esc(ui.footHome)}</a>
      <a href="/app/">DocuSmart Web</a>
${guidesFootLink(loc)}      <a href="/privacidad">${esc(ui.footPrivacy)}</a>
      <a href="${FACEBOOK_URL}" target="_blank" rel="noopener">Facebook</a>
      <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>
      <a href="${TIKTOK_URL}" target="_blank" rel="noopener">TikTok</a>
      <button type="button" class="link-btn" data-consent-open hidden>${esc(ui.footConsent)}</button>
    </nav>
  </div>
</footer>
<script type="module" src="${entryScript('tool-page.tsx', loc.lang === 'es' ? 0 : 1)}"></script>
</body>
</html>
`
}

for (const loc of LANGS) for (const page of pages) emit(`${SITE_DIR}/${filePath(page, loc)}`, render(page, loc))

// ── Página "Todas las herramientas" (W-78) ──────────────────────────────────
/** Herramientas de una categoría, en orden alfabético según el idioma. */
/** ¿La página se lista en la categoría? (la suya o una de alsoIn, W-119). */
const inCategory = (p, id) => p.category === id || (p.alsoIn ?? []).includes(id)
function toolsIn(cat, loc) {
  const collator = new Intl.Collator(loc.lang, { sensitivity: 'base', numeric: true })
  return pages
    .filter((p) => inCategory(p, cat.id))
    .map((p) => ({ page: p, l: localized(p, loc) }))
    .sort((a, b) => collator.compare(a.l.h1, b.l.h1))
}

function renderHub(loc) {
  const ui = loc.ui
  const url = `${SITE}${hubPath(loc)}`
  const home = homePath(loc)
  const n = pages.length
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: ui.hubTitle,
    url,
    description: ui.hubDescription,
    inLanguage: loc.lang,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: n,
      itemListElement: CATEGORIES.flatMap((c) => toolsIn(c, loc).filter((t) => t.page.category === c.id)).map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.l.h1, url: `${SITE}${pagePath(t.page, loc)}` })),
    },
  }
  const sections = CATEGORIES.map((c) => {
    const items = toolsIn(c, loc)
    return `    <section class="th-cat reveal" id="cat-${c.id}" data-cat aria-labelledby="h-${c.id}">
      <div class="th-cat-head"><span class="th-cat-ico">${svg(c.icon, 'th-svg')}</span><h2 id="h-${c.id}">${esc(ui.cats[c.id])}</h2><span class="th-count">${esc(toolCount(loc, items.length))}</span></div>
      <ul class="th-grid">
${items.map((t) => `        <li data-tool${t.page.category === c.id ? '' : ' data-also'} data-search="${esc([t.l.h1, t.l.short, ui.cats[c.id]].join(' '))}"><a href="${pagePath(t.page, loc)}"><span class="th-tool-ico">${svg(toolIcon(t.page.tool), 'th-svg')}</span><span class="th-tool-text"><b>${esc(t.l.h1)}</b><span>${esc(t.l.short)}</span></span></a></li>`).join('\n')}
      </ul>
    </section>`
  }).join('\n')

  return `<!doctype html>
<!-- Generado por scripts/generate-tool-pages.mjs desde tools/pages.mjs. No editar a mano. -->
<html lang="${loc.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(ui.hubTitle)}</title>
<meta name="description" content="${esc(ui.hubDescription)}">
<meta name="theme-color" content="#0B1020">
<link rel="canonical" href="${url}">
${alternates(hubPath)}
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DocuSmart">
<meta property="og:locale" content="${loc.ogLocale}">
<meta property="og:title" content="${esc(ui.hubTitle)}">
<meta property="og:description" content="${esc(ui.hubDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og/${loc.lang}.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${jsonLd(structured)}
</script>
</head>
<body class="tool-page tools-hub">
<header class="tp-nav">
  <div class="tp-wrap tp-nav-inner">
    <a class="tp-brand" href="${home}"><img src="/img/icon.svg" alt="" width="30" height="30">DocuSmart</a>
    <nav aria-label="${esc(ui.navMain)}">
      <a href="/app/">${esc(ui.navWebApp)}</a>
${langMenu(loc, hubPath, 'tp-lang', '      ')}
      <a class="tp-nav-cta" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool">${esc(ui.navDownload)}</a>
    </nav>
  </div>
</header>

<main>
  <section class="tp-hero th-hero">
    <div class="tp-wrap">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(ui.crumbs)}"><a href="${home}">DocuSmart</a><span aria-hidden="true">›</span><span>${esc(ui.hubH1)}</span></nav>
      <h1>${esc(ui.hubH1)}</h1>
      <p class="tp-lead">${esc(ui.hubLead.replace('{n}', String(n)))}</p>
      <div class="th-search">
        <label class="th-search-label" for="th-q">${esc(ui.hubSearch)}</label>
        ${svg('search', 'th-search-ico')}
        <input id="th-q" type="search" placeholder="${esc(ui.hubSearchHint)}" autocomplete="off" enterkeyhint="search" aria-controls="th-results">
      </div>
      </div>
    </div>
  </section>

  <div class="tp-wrap th-body">
    <nav class="th-jump" aria-label="${esc(ui.hubJump)}">
      <div class="th-marquee">
        <div class="th-track">
${CATEGORIES.map((c) => `          <a href="#cat-${c.id}" data-jump="${c.id}">${svg(c.icon, 'th-svg')}${esc(ui.cats[c.id])}</a>`).join('\n')}
        </div>
        <div class="th-track" aria-hidden="true">
${CATEGORIES.map((c) => `          <a href="#cat-${c.id}" data-jump="${c.id}" tabindex="-1">${svg(c.icon, 'th-svg')}${esc(ui.cats[c.id])}</a>`).join('\n')}
        </div>
      </div>
    </nav>
    <div id="th-results" aria-live="polite">
${sections}
      <p class="th-empty" hidden>${esc(ui.hubEmpty)}</p>
    </div>
  </div>

  <section class="tp-wrap tp-section reveal" data-reveal="scale">
    <div class="tp-cta">
      <div>
        <h2>${esc(ui.ctaTitle)}</h2>
        <p>${esc(ui.ctaText)}</p>
      </div>
      <a class="btn btn-primary ds-press" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool_cta">${esc(ui.ctaBtn)}</a>
    </div>
  </section>
</main>

<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="${esc(ui.footAria)}">
      <a href="${home}">${esc(ui.footHome)}</a>
      <a href="/app/">DocuSmart Web</a>
${guidesFootLink(loc)}      <a href="/privacidad">${esc(ui.footPrivacy)}</a>
      <a href="${FACEBOOK_URL}" target="_blank" rel="noopener">Facebook</a>
      <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>
      <a href="${TIKTOK_URL}" target="_blank" rel="noopener">TikTok</a>
      <button type="button" class="link-btn" data-consent-open hidden>${esc(ui.footConsent)}</button>
    </nav>
  </div>
</footer>
<script type="module" src="${entryScript('tools-hub.ts', loc.lang === 'es' ? 0 : 1)}"></script>
</body>
</html>
`
}

for (const loc of LANGS) emit(`${SITE_DIR}/${hubFile(loc)}`, renderHub(loc))

// ── Guías (W-19): índice y cada guía en los idiomas de tools/guides ─────────
const LOC_BY_LANG = Object.fromEntries(LANGS.map((l) => [l.lang, l]))
const toolBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]))
const minutesLabel = (n, lang) => fill(guideUi(lang).minutes, { n })
const dateLabel = (iso, lang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const PLAY = 'https://play.google.com/store/apps/details?id=com.docsmart'

/**
 * Los textos de las guías enlazan con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug>); aquí se
 * traducen a la ruta del idioma. Una ruta desconocida corta el build.
 */
function localHref(href, lang, where) {
  const loc = LOC_BY_LANG[lang]
  const tool = pages.find((p) => pagePath(p, ES) === href)
  if (tool) return pagePath(tool, loc)
  if (href === hubPath(ES)) return hubPath(loc)
  if (href === '/guias') return guidesIndexPath(lang)
  const guide = guides.find((g) => `/guias/${g.slug}` === href)
  if (guide) return guidePath(guide, lang)
  if (href === '/app/' || href === '/privacidad') return href
  throw new Error(`guías (${where}): enlace a una ruta que no existe: ${href}`)
}
/** Texto con **negrita** y enlaces internos [texto](/ruta); todo lo demás se escapa. */
function rich(text, lang, where) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_, label, href) => `<a href="${localHref(href, lang, where)}">${label}</a>`)
}
function guideBlock(b, lang, where) {
  if (typeof b === 'string') return `      <p>${rich(b, lang, where)}</p>`
  if (b.ul) return `      <ul>\n${b.ul.map((li) => `        <li>${rich(li, lang, where)}</li>`).join('\n')}\n      </ul>`
  if (b.tip) return `      <aside class="gd-tip">${svg('info', 'gd-tip-ico')}<p>${rich(b.tip, lang, where)}</p></aside>`
  throw new Error(`guías (${where}): bloque desconocido ${JSON.stringify(b)}`)
}
const toolCards = (slugs, lang, where) =>
  slugs
    .map((s) => {
      const t = toolBySlug[s]
      if (!t) throw new Error(`guías (${where}): herramienta desconocida ${s}`)
      const l = localized(t, LOC_BY_LANG[lang])
      return `      <li><a href="${pagePath(t, LOC_BY_LANG[lang])}"><b>${esc(l.h1)}</b><span>${esc(l.short)}</span></a></li>`
    })
    .join('\n')

/** hreflang entre los idiomas que tienen la guía (más x-default = español). */
const guideAlternates = (pathFor) =>
  [...GUIDE_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${pathFor(l)}">`), `<link rel="alternate" hreflang="x-default" href="${SITE}${pathFor('es')}">`].join('\n')

/** Selector de idioma de las guías: solo los idiomas que las tienen. */
function guideLangMenu(lang, pathFor) {
  const loc = LOC_BY_LANG[lang]
  const items = GUIDE_LANGS.map((l) => {
    const o = LOC_BY_LANG[l]
    return `          <li><a href="${pathFor(l)}" hreflang="${l}" lang="${l}" data-set-lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${esc(o.label)}</a></li>`
  })
  return [
    '      <details class="tp-lang">',
    `        <summary aria-label="${lang.toUpperCase()} · ${esc(loc.ui.langMenu)}: ${esc(loc.label)}"><span aria-hidden="true">🌐</span> ${lang.toUpperCase()}</summary>`,
    '        <ul>',
    ...items,
    '        </ul>',
    '      </details>',
  ].join('\n')
}

function guideHead({ lang, title, description, url, pathFor, structured }) {
  const loc = LOC_BY_LANG[lang]
  return `<!doctype html>
<!-- Generado por scripts/generate-tool-pages.mjs desde tools/guides. No editar a mano. -->
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0B1020">
<link rel="canonical" href="${url}">
${guideAlternates(pathFor)}
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DocuSmart">
<meta property="og:locale" content="${loc.ogLocale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og/${lang}.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${jsonLd(structured)}
</script>
</head>`
}

function guideNav(lang, pathFor) {
  const loc = LOC_BY_LANG[lang]
  const ui = loc.ui
  return `<header class="tp-nav">
  <div class="tp-wrap tp-nav-inner">
    <a class="tp-brand" href="${homePath(loc)}"><img src="/img/icon.svg" alt="" width="30" height="30">DocuSmart</a>
    <nav aria-label="${esc(ui.navMain)}">
      <a href="${hubPath(loc)}">${esc(ui.navTools)}</a>
      <a href="${guidesIndexPath(lang)}">${esc(guideUi(lang).guides)}</a>
      <a href="/app/">${esc(ui.navWebApp)}</a>
${guideLangMenu(lang, pathFor)}
      <a class="tp-nav-cta" href="${PLAY}" target="_blank" rel="noopener" data-track="play_store_guide">${esc(ui.navDownload)}</a>
    </nav>
  </div>
</header>`
}

function guideFoot(lang, depth) {
  const loc = LOC_BY_LANG[lang]
  const ui = loc.ui
  return `<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="${esc(ui.footAria)}">
      <a href="${homePath(loc)}">${esc(ui.footHome)}</a>
      <a href="${hubPath(loc)}">${esc(ui.allTools)}</a>
      <a href="${guidesIndexPath(lang)}">${esc(guideUi(lang).guides)}</a>
      <a href="/app/">DocuSmart Web</a>
      <a href="/privacidad">${esc(ui.footPrivacy)}</a>
      <a href="${FACEBOOK_URL}" target="_blank" rel="noopener">Facebook</a>
      <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>
      <a href="${TIKTOK_URL}" target="_blank" rel="noopener">TikTok</a>
      <button type="button" class="link-btn" data-consent-open hidden>${esc(ui.footConsent)}</button>
    </nav>
  </div>
</footer>
<script type="module" src="${entryScript('guide.ts', depth)}"></script>
</body>
</html>
`
}

const guideCta = (lang) => {
  const ui = LOC_BY_LANG[lang].ui
  return `  <section class="tp-wrap tp-section reveal" data-reveal="scale">
    <div class="tp-cta">
      <div>
        <h2>${esc(ui.ctaTitle)}</h2>
        <p>${esc(ui.ctaText)}</p>
      </div>
      <a class="btn btn-primary ds-press" href="${PLAY}" target="_blank" rel="noopener" data-track="play_store_guide_cta">${esc(ui.ctaBtn)}</a>
    </div>
  </section>`
}

const faqBlock = (faq, lang) => `  <section class="tp-wrap tp-section reveal">
    <h2>${esc(LOC_BY_LANG[lang].ui.faqTitle)}</h2>
    <div class="tp-faq">
${faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <p>${esc(a)}</p>\n      </details>`).join('\n')}
    </div>
  </section>`

/** Profundidad del HTML bajo site/ (para la ruta del script de entrada). */
const depthOf = (file) => file.split('/').length - 1

function renderGuide(guide, lang) {
  const g = localizedGuide(guide, lang)
  const gui = guideUi(lang)
  const loc = LOC_BY_LANG[lang]
  const path = guidePath(guide, lang)
  const url = `${SITE}${path}`
  const where = `${lang}/${g.slug}`
  const others = guides.filter((x) => x.slug !== guide.slug)
  const org = { '@type': 'Organization', name: 'DocuSmart', url: SITE }
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.h1,
      description: g.description,
      url,
      inLanguage: lang,
      datePublished: GUIDES_UPDATED,
      dateModified: GUIDES_UPDATED,
      image: `${SITE}/img/og/${lang}.jpg`,
      author: org,
      publisher: { ...org, logo: { '@type': 'ImageObject', url: `${SITE}/img/pwa/icon-512.png` } },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: g.h1,
      totalTime: `PT${g.minutes}M`,
      step: g.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}${homePath(loc)}` },
        { '@type': 'ListItem', position: 2, name: gui.guides, item: `${SITE}${guidesIndexPath(lang)}` },
        { '@type': 'ListItem', position: 3, name: g.h1, item: url },
      ],
    },
  ]
  const [before, after = ''] = gui.updated.split('{date}')
  return `${guideHead({ lang, title: g.title, description: g.description, url, pathFor: (l) => guidePath(guide, l), structured })}
<body class="tool-page guide-page">
${guideNav(lang, (l) => guidePath(guide, l))}

<main>
  <section class="tp-hero gd-hero">
    <div class="tp-wrap tp-hero-grid">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(loc.ui.crumbs)}"><a href="${homePath(loc)}">DocuSmart</a><span aria-hidden="true">›</span><a href="${guidesIndexPath(lang)}">${esc(gui.guides)}</a><span aria-hidden="true">›</span><span>${esc(g.h1)}</span></nav>
      <h1>${esc(g.h1)}</h1>
      <p class="tp-lead">${esc(g.lead)}</p>
      <p class="gd-meta"><span>${svg('clock', 'gd-meta-ico')}${esc(minutesLabel(g.minutes, lang))}</span><span>${esc(before)}<time datetime="${GUIDES_UPDATED}">${esc(dateLabel(GUIDES_UPDATED, lang))}</time>${esc(after)}</span></p>
      </div>
      <div class="tp-hero-art" aria-hidden="true">
        <span class="tp-ring"></span><span class="tp-ring tp-ring-2"></span>
        <span class="tp-tile">${svg(g.icon, 'tp-tile-ico')}<span class="tp-scan"></span></span>
        <span class="tp-chip tp-chip-a">${svg('shield', 'tp-chip-ico')}</span>
        <span class="tp-chip tp-chip-b">${svg('check', 'tp-chip-ico')}</span>
      </div>
    </div>
  </section>

  <article class="tp-wrap gd-article">
${g.sections
  .map(
    (s) => `    <section class="gd-section reveal">
      <h2>${esc(s.h2)}</h2>
${s.body.map((b) => guideBlock(b, lang, where)).join('\n')}
    </section>`,
  )
  .join('\n')}
    <section class="gd-section reveal">
      <h2>${esc(gui.summary)}</h2>
      <ol class="gd-steps">
${g.steps.map((s) => `        <li><b>${esc(s.name)}.</b> ${esc(s.text)}</li>`).join('\n')}
      </ol>
    </section>
  </article>

  <section class="tp-wrap tp-section reveal">
    <h2>${esc(gui.toolsTitle)}</h2>
    <ul class="tp-related">
${toolCards(g.tools, lang, where)}
    </ul>
  </section>

${faqBlock(g.faq, lang)}

  <section class="tp-wrap tp-section reveal">
    <h2>${esc(gui.moreGuides)}</h2>
    <ul class="tp-related">
${others.map((o) => `      <li><a href="${guidePath(o, lang)}"><b>${esc(localizedGuide(o, lang).h1)}</b><span>${esc(minutesLabel(o.minutes, lang))}</span></a></li>`).join('\n')}
    </ul>
  </section>

${guideCta(lang)}
</main>

${guideFoot(lang, depthOf(guideFile(guide, lang)))}`
}

function renderGuidesIndex(lang) {
  const gui = guideUi(lang)
  const loc = LOC_BY_LANG[lang]
  const url = `${SITE}${guidesIndexPath(lang)}`
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: gui.indexH1,
      url,
      description: gui.indexDescription,
      inLanguage: lang,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: guides.length,
        itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: localizedGuide(g, lang).h1, url: `${SITE}${guidePath(g, lang)}` })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}${homePath(loc)}` },
        { '@type': 'ListItem', position: 2, name: gui.guides, item: url },
      ],
    },
  ]
  return `${guideHead({ lang, title: gui.indexTitle, description: gui.indexDescription, url, pathFor: guidesIndexPath, structured })}
<body class="tool-page guide-page">
${guideNav(lang, guidesIndexPath)}

<main>
  <section class="tp-hero gd-hero">
    <div class="tp-wrap">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(loc.ui.crumbs)}"><a href="${homePath(loc)}">DocuSmart</a><span aria-hidden="true">›</span><span>${esc(gui.guides)}</span></nav>
      <h1>${esc(gui.indexH1)}</h1>
      <p class="tp-lead">${esc(gui.indexLead)}</p>
      </div>
    </div>
  </section>

  <section class="tp-wrap tp-section">
    <ul class="gd-cards">
${guides
  .map((guide) => {
    const g = localizedGuide(guide, lang)
    return `      <li class="reveal"><a href="${guidePath(guide, lang)}">
        <span class="gd-card-ico">${svg(g.icon, 'gd-card-svg')}</span>
        <b>${esc(g.h1)}</b>
        <span>${esc(g.lead)}</span>
        <small>${svg('clock', 'gd-meta-ico')}${esc(minutesLabel(g.minutes, lang))}</small>
      </a></li>`
  })
  .join('\n')}
    </ul>
  </section>

${guideCta(lang)}
</main>

${guideFoot(lang, depthOf(guidesIndexFile(lang)))}`
}

for (const lang of GUIDE_LANGS) {
  emit(`${SITE_DIR}/${guidesIndexFile(lang)}`, renderGuidesIndex(lang))
  for (const g of guides) emit(`${SITE_DIR}/${guideFile(g, lang)}`, renderGuide(g, lang))
}

// ── Portada ──────────────────────────────────────────────────────────────────
/** Reemplaza el bloque entre <!-- name:start --> y <!-- name:end -->. */
function block(html, name, content, file) {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`)
  if (!re.test(html)) throw new Error(`${file} no tiene los marcadores ${name}:start/${name}:end`)
  return html.replace(re, () => `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`)
}

/** Datos estructurados de la portada: organización, sitio, app de Android y app web (sin valoraciones inventadas). */
function landingLd(html, loc, file) {
  const m = html.match(/<meta name="description" content="([^"]*)">/)
  if (!m) throw new Error(`${file} no tiene <meta name="description">`)
  const description = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  const url = `${SITE}${homePath(loc)}`
  const org = { '@id': `${SITE}/#org` }
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        ...org,
        name: 'DocuSmart',
        url: `${SITE}/`,
        logo: `${SITE}/img/pwa/icon-512.png`,
        email: 'supportdocusmart@docusmart.online',
        sameAs: [PLAY, FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL],
      },
      { '@type': 'WebSite', '@id': `${url}#website`, name: 'DocuSmart', url, description, inLanguage: loc.lang, publisher: org },
      {
        '@type': 'MobileApplication',
        name: 'DocuSmart',
        operatingSystem: 'Android',
        applicationCategory: 'BusinessApplication',
        description,
        inLanguage: loc.lang,
        image: `${SITE}/img/pwa/icon-512.png`,
        installUrl: PLAY,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: org,
      },
      {
        '@type': 'WebApplication',
        name: 'DocuSmart Web',
        url: `${SITE}/app/`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: loc.ui.os,
        browserRequirements: 'requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: org,
      },
    ],
  }
  return `<script type="application/ld+json">\n${jsonLd(graph)}\n</script>`
}

function landingBlocks(html, loc, file) {
  const hub = hubPath(loc)
  const cards = CATEGORIES.map((c) => {
    const n = pages.filter((p) => inCategory(p, c.id)).length
    return `        <li class="reveal"><a href="${hub}#cat-${c.id}"><span class="wt-ico">${svg(c.icon, 'wt-svg')}</span><span class="wt-text"><b>${esc(loc.ui.cats[c.id])}</b><span>${esc(toolCount(loc, n))}</span></span></a></li>`
  }).join('\n')
  const items = `      <ul class="web-tools wt-cats" data-stagger="60">
${cards}
      </ul>
      <div class="wt-more reveal"><a class="btn btn-primary" href="${hub}">${esc(loc.ui.seeAll.replace('{n}', String(pages.length)))} <span aria-hidden="true">→</span></a></div>`
  let out = block(html, 'tools', items, file)
  out = block(out, 'ldjson', landingLd(html, loc, file), file)
  out = block(out, 'hreflang', alternates(homePath), file)
  out = block(out, 'langs', langMenu(loc, homePath, 'lang-menu', '  '), file)
  return out
}

const landingEs = landingBlocks(readFileSync(join(root, SITE_DIR, 'index.html'), 'utf-8'), ES, `${SITE_DIR}/index.html`)
emit(`${SITE_DIR}/index.html`, landingEs)

for (const loc of LOCALES) {
  // Guías (W-19): la portada traducida enlaza a las de su idioma, o no las enlaza si no hay.
  const guidesLink = '      <a href="/guias" data-track="guides_footer">Guías</a>\n'
  let html = landingEs.replace(
    guidesLink,
    hasGuides(loc.lang) ? `      <a href="${guidesIndexPath(loc.lang)}" data-track="guides_footer">${guideUi(loc.lang).guides}</a>\n` : '',
  )
  // Primero los textos más largos, para que uno corto no pise parte de otro.
  const pairs = [...loc.landing].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of pairs) {
    if (!html.includes(from)) throw new Error(`tools/locales/${loc.lang}.mjs: la portada ya no contiene ${JSON.stringify(from)}`)
    html = html.split(from).join(to)
  }
  html = html
    .replace('<html lang="es">', `<html lang="${loc.lang}">`)
    .replace(`<link rel="canonical" href="${SITE}/">`, `<link rel="canonical" href="${SITE}/${loc.lang}/">`)
    .replace(`<meta property="og:url" content="${SITE}/">`, `<meta property="og:url" content="${SITE}/${loc.lang}/">`)
    .replace('<meta property="og:locale" content="es_ES">', `<meta property="og:locale" content="${loc.ogLocale}">`)
    // Imagen para compartir en el idioma de la portada (W-12, scripts/og-images.py).
    .replace(`<meta property="og:image" content="${SITE}/img/og/es.jpg">`, `<meta property="og:image" content="${SITE}/img/og/${loc.lang}.jpg">`)
    .replace('<!doctype html>', '<!doctype html>\n<!-- Generado por scripts/generate-tool-pages.mjs desde site/index.html. No editar a mano. -->')
    // Un nivel más abajo (site/en/index.html): el script de entrada está un "../" más arriba.
    .replace(`src="${entryScript('landing.ts', 0)}"`, `src="${entryScript('landing.ts', 1)}"`)
    .replace(`href="${entryScript('landing.css', 0)}"`, `href="${entryScript('landing.css', 1)}"`)
  if (!html.includes(entryScript('landing.ts', 1))) throw new Error(`${SITE_DIR}/index.html no carga ${entryScript('landing.ts', 0)}`)
  if (!html.includes(entryScript('landing.css', 1))) throw new Error(`${SITE_DIR}/index.html no carga ${entryScript('landing.css', 0)}`)
  // Lo nuevo (W-103): la tarjeta de guías lleva al índice de guías del idioma.
  html = html.replace('href="/guias" data-news="guides"', `href="${guidesIndexPath(loc.lang)}" data-news="guides"`)
  html = html.replaceAll('href="/herramientas" data-track="news_', `href="${hubPath(loc)}" data-track="news_`)
  emit(`${SITE_DIR}/${loc.lang}/index.html`, landingBlocks(html, loc, `${SITE_DIR}/${loc.lang}/index.html`))
}

// ── sitemap.xml con las versiones de cada página ─────────────────────────────
const entry = (pathFor, freq, prio) => {
  const links = [...LANGS.map((l) => [l.lang, pathFor(l)]), ['x-default', pathFor(ES)]]
    .map(([hl, p]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${SITE}${p}"/>`)
    .join('\n')
  return LANGS.map((l) => `  <url>\n    <loc>${SITE}${pathFor(l)}</loc>\n${links}\n    <lastmod>${PAGES_UPDATED}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`).join('\n')
}
/** Guías en el sitemap: una <url> por idioma, con sus alternativas. */
function guideEntries() {
  const entryFor = (pathFor, prio, lastmod) => {
    const links = [...GUIDE_LANGS.map((l) => [l, pathFor(l)]), ['x-default', pathFor('es')]]
      .map(([hl, p]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${SITE}${p}"/>`)
      .join('\n')
    return GUIDE_LANGS.map(
      (l) => `  <url>\n    <loc>${SITE}${pathFor(l)}</loc>\n${links}\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>monthly</changefreq>\n    <priority>${prio}</priority>\n  </url>`,
    ).join('\n')
  }
  return [entryFor(guidesIndexPath, '0.8', GUIDES_UPDATED), ...guides.map((g) => entryFor((l) => guidePath(g, l), '0.7', GUIDES_UPDATED))].join('\n')
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/generate-tool-pages.mjs. No editar a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry(homePath, 'monthly', '1.0')}
${entry(hubPath, 'monthly', '0.9')}
${pages.map((p) => entry((l) => pagePath(p, l), 'monthly', '0.9')).join('\n')}
${guideEntries()}
  <url><loc>${SITE}/app/</loc><lastmod>${PAGES_UPDATED}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/privacidad</loc><lastmod>${PRIVACY_UPDATED}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
`
emit('public/sitemap.xml', sitemap)

// ── Base de conocimiento del asistente (W-70a) ──────────────────────────────
for (const lang of Object.keys(KB_OWN)) emit(`public/assistant/${lang}.json`, kbJson(buildKb(lang)))

// ── Slugs por idioma para la app ─────────────────────────────────────────────
// Los enlaces de compartir/recomendar llevan a la página del idioma del usuario
// (/en/merge-pdf…). Solo los slugs, para no meter los textos SEO en el bundle.
const slugs = Object.fromEntries(pages.map((p) => [p.slug, Object.fromEntries(LOCALES.map((l) => [l.lang, l.pages[p.slug].slug]))]))
emit('src/shared/files/toolPageSlugs.json', `${JSON.stringify(slugs, null, 2)}
`)

if (check && stale.length) {
  console.error(`Páginas desactualizadas: ${stale.join(', ')}. Ejecuta: npm run pages`)
  process.exit(1)
}
console.log(`Páginas: ${pages.length} herramientas × ${LANGS.length} idiomas y ${guides.length} guías × ${GUIDE_LANGS.length} idiomas ${check ? 'al día' : 'generadas'}`)
