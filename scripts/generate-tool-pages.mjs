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
import { CATEGORIES, FACEBOOK_URL, INSTAGRAM_URL, SITE, TIKTOK_URL, pages } from '../tools/pages.mjs'
import { KB_OWN, buildKb, kbJson } from '../tools/assistant/build.mjs'
import { GUIDES_UPDATED, guides } from '../tools/guides.mjs'
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
const IMG_ICONS = { comprimir: 'compress', redimensionar: 'resize', recortar: 'crop', rotar: 'rotate' }
const CONV_ICONS = { 'img-pdf': 'image', 'img-png': 'image', 'img-jpg': 'image', 'img-webp': 'image', 'pdf-img': 'images', 'pdf-txt': 'text' }
function toolIcon({ kind, id }) {
  if (kind === 'pdf') return PDF_ICONS[id] ?? 'pdf'
  if (kind === 'img') return IMG_ICONS[id] ?? 'image'
  if (kind === 'conv') return CONV_ICONS[id] ?? 'convert'
  if (kind === 'archive') return id === 'extraer' ? 'folder' : 'archive'
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

// ── Guías relacionadas en las páginas de herramientas (W-19, solo español) ──
/** Enlace a las guías en el pie de las páginas en español. */
const guidesFootLink = (loc) => (loc.lang === 'es' ? '      <a href="/guias">Guías</a>\n' : '')

function relatedGuides(page, loc) {
  if (loc.lang !== 'es') return ''
  const list = guides.filter((g) => g.tools.includes(page.slug))
  if (!list.length) return ''
  return `  <section class="tp-wrap tp-section reveal">
    <h2>Guías relacionadas</h2>
    <ul class="tp-related">
${list.map((g) => `      <li><a href="/guias/${g.slug}"><b>${esc(g.h1)}</b><span>${g.minutes} min de lectura</span></a></li>`).join('\n')}
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
function toolsIn(cat, loc) {
  const collator = new Intl.Collator(loc.lang, { sensitivity: 'base', numeric: true })
  return pages
    .filter((p) => p.category === cat.id)
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
      itemListElement: CATEGORIES.flatMap((c) => toolsIn(c, loc)).map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.l.h1, url: `${SITE}${pagePath(t.page, loc)}` })),
    },
  }
  const sections = CATEGORIES.map((c) => {
    const items = toolsIn(c, loc)
    return `    <section class="th-cat reveal" id="cat-${c.id}" data-cat aria-labelledby="h-${c.id}">
      <div class="th-cat-head"><span class="th-cat-ico">${svg(c.icon, 'th-svg')}</span><h2 id="h-${c.id}">${esc(ui.cats[c.id])}</h2><span class="th-count">${esc(toolCount(loc, items.length))}</span></div>
      <ul class="th-grid">
${items.map((t) => `        <li data-tool data-search="${esc([t.l.h1, t.l.short, ui.cats[c.id]].join(' '))}"><a href="${pagePath(t.page, loc)}"><span class="th-tool-ico">${svg(toolIcon(t.page.tool), 'th-svg')}</span><span class="th-tool-text"><b>${esc(t.l.h1)}</b><span>${esc(t.l.short)}</span></span></a></li>`).join('\n')}
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

// ── Guías (W-19): /guias y /guias/<slug>, por ahora solo en español ─────────
const guidePath = (g) => `/guias/${g.slug}`
const toolBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
/** Rutas internas válidas para los enlaces del contenido de las guías. */
const knownPaths = new Set([...pages.map((p) => pagePath(p, ES)), hubPath(ES), '/guias', ...guides.map(guidePath), '/app/', '/privacidad'])
/** Texto con **negrita** y enlaces internos [texto](/ruta); todo lo demás se escapa. */
function rich(text, where) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_, label, href) => {
      if (!knownPaths.has(href)) throw new Error(`tools/guides.mjs (${where}): enlace a una ruta que no existe: ${href}`)
      return `<a href="${href}">${label}</a>`
    })
}
function guideBlock(b, where) {
  if (typeof b === 'string') return `      <p>${rich(b, where)}</p>`
  if (b.ul) return `      <ul>\n${b.ul.map((li) => `        <li>${rich(li, where)}</li>`).join('\n')}\n      </ul>`
  if (b.tip) return `      <aside class="gd-tip">${svg('info', 'gd-tip-ico')}<p>${rich(b.tip, where)}</p></aside>`
  throw new Error(`tools/guides.mjs (${where}): bloque desconocido ${JSON.stringify(b)}`)
}
const toolCards = (slugs, where) =>
  slugs
    .map((s) => {
      const t = toolBySlug[s]
      if (!t) throw new Error(`tools/guides.mjs (${where}): herramienta desconocida ${s}`)
      return `      <li><a href="${pagePath(t, ES)}"><b>${esc(t.h1)}</b><span>${esc(t.short)}</span></a></li>`
    })
    .join('\n')
const minutesLabel = (n) => `${n} min de lectura`
const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const PLAY = 'https://play.google.com/store/apps/details?id=com.docsmart'

function guideHead({ title, description, url, structured }) {
  return `<!doctype html>
<!-- Generado por scripts/generate-tool-pages.mjs desde tools/guides.mjs. No editar a mano. -->
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0B1020">
<link rel="canonical" href="${url}">
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DocuSmart">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og/es.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${jsonLd(structured)}
</script>
</head>`
}

function guideNav() {
  const ui = ES.ui
  return `<header class="tp-nav">
  <div class="tp-wrap tp-nav-inner">
    <a class="tp-brand" href="/"><img src="/img/icon.svg" alt="" width="30" height="30">DocuSmart</a>
    <nav aria-label="${esc(ui.navMain)}">
      <a href="${hubPath(ES)}">${esc(ui.navTools)}</a>
      <a href="/guias">Guías</a>
      <a href="/app/">${esc(ui.navWebApp)}</a>
      <a class="tp-nav-cta" href="${PLAY}" target="_blank" rel="noopener" data-track="play_store_guide">${esc(ui.navDownload)}</a>
    </nav>
  </div>
</header>`
}

function guideFoot(depth) {
  const ui = ES.ui
  return `<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="${esc(ui.footAria)}">
      <a href="/">${esc(ui.footHome)}</a>
      <a href="${hubPath(ES)}">${esc(ui.allTools)}</a>
      <a href="/guias">Guías</a>
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

const guideCta = () => `  <section class="tp-wrap tp-section reveal" data-reveal="scale">
    <div class="tp-cta">
      <div>
        <h2>${esc(ES.ui.ctaTitle)}</h2>
        <p>${esc(ES.ui.ctaText)}</p>
      </div>
      <a class="btn btn-primary ds-press" href="${PLAY}" target="_blank" rel="noopener" data-track="play_store_guide_cta">${esc(ES.ui.ctaBtn)}</a>
    </div>
  </section>`

const faqBlock = (faq) => `  <section class="tp-wrap tp-section reveal">
    <h2>${esc(ES.ui.faqTitle)}</h2>
    <div class="tp-faq">
${faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <p>${esc(a)}</p>\n      </details>`).join('\n')}
    </div>
  </section>`

function renderGuide(g) {
  const url = `${SITE}${guidePath(g)}`
  const where = g.slug
  const others = guides.filter((x) => x.slug !== g.slug)
  const org = { '@type': 'Organization', name: 'DocuSmart', url: SITE }
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.h1,
      description: g.description,
      url,
      inLanguage: 'es',
      datePublished: GUIDES_UPDATED,
      dateModified: GUIDES_UPDATED,
      image: `${SITE}/img/og/es.jpg`,
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
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Guías', item: `${SITE}/guias` },
        { '@type': 'ListItem', position: 3, name: g.h1, item: url },
      ],
    },
  ]
  return `${guideHead({ title: g.title, description: g.description, url, structured })}
<body class="tool-page guide-page">
${guideNav()}

<main>
  <section class="tp-hero gd-hero">
    <div class="tp-wrap tp-hero-grid">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(ES.ui.crumbs)}"><a href="/">DocuSmart</a><span aria-hidden="true">›</span><a href="/guias">Guías</a><span aria-hidden="true">›</span><span>${esc(g.h1)}</span></nav>
      <h1>${esc(g.h1)}</h1>
      <p class="tp-lead">${esc(g.lead)}</p>
      <p class="gd-meta"><span>${svg('clock', 'gd-meta-ico')}${minutesLabel(g.minutes)}</span><span>Actualizada el <time datetime="${GUIDES_UPDATED}">${dateLabel(GUIDES_UPDATED)}</time></span></p>
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
${s.body.map((b) => guideBlock(b, where)).join('\n')}
    </section>`,
  )
  .join('\n')}
    <section class="gd-section reveal">
      <h2>Resumen rápido</h2>
      <ol class="gd-steps">
${g.steps.map((s) => `        <li><b>${esc(s.name)}.</b> ${esc(s.text)}</li>`).join('\n')}
      </ol>
    </section>
  </article>

  <section class="tp-wrap tp-section reveal">
    <h2>Herramientas de esta guía</h2>
    <ul class="tp-related">
${toolCards(g.tools, where)}
    </ul>
  </section>

${faqBlock(g.faq)}

  <section class="tp-wrap tp-section reveal">
    <h2>Más guías</h2>
    <ul class="tp-related">
${others.map((o) => `      <li><a href="${guidePath(o)}"><b>${esc(o.h1)}</b><span>${minutesLabel(o.minutes)}</span></a></li>`).join('\n')}
    </ul>
  </section>

${guideCta()}
</main>

${guideFoot(1)}`
}

function renderGuidesIndex() {
  const url = `${SITE}/guias`
  const title = 'Guías de DocuSmart: PDF, fotos y documentos paso a paso'
  const description =
    'Guías cortas y prácticas para unir, comprimir, firmar, escanear y proteger documentos desde el celular o el computador, gratis y sin subir tus archivos.'
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Guías de DocuSmart',
      url,
      description,
      inLanguage: 'es',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: guides.length,
        itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.h1, url: `${SITE}${guidePath(g)}` })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Guías', item: url },
      ],
    },
  ]
  return `${guideHead({ title, description, url, structured })}
<body class="tool-page guide-page">
${guideNav()}

<main>
  <section class="tp-hero th-hero gd-hero">
    <div class="tp-wrap">
      <div class="tp-hero-text">
      <nav class="tp-crumbs" aria-label="${esc(ES.ui.crumbs)}"><a href="/">DocuSmart</a><span aria-hidden="true">›</span><span>Guías</span></nav>
      <h1>Guías paso a paso</h1>
      <p class="tp-lead">Tareas de todos los días con PDF, fotos y documentos, explicadas en pocos minutos. Todas se hacen en tu navegador, sin subir tus archivos.</p>
      </div>
    </div>
  </section>

  <section class="tp-wrap tp-section">
    <ul class="gd-cards">
${guides
  .map(
    (g) => `      <li class="reveal"><a href="${guidePath(g)}">
        <span class="gd-card-ico">${svg(g.icon, 'gd-card-svg')}</span>
        <b>${esc(g.h1)}</b>
        <span>${esc(g.lead)}</span>
        <small>${svg('clock', 'gd-meta-ico')}${minutesLabel(g.minutes)}</small>
      </a></li>`,
  )
  .join('\n')}
    </ul>
  </section>

${guideCta()}
</main>

${guideFoot(0)}`
}

emit(`${SITE_DIR}/guias.html`, renderGuidesIndex())
for (const g of guides) emit(`${SITE_DIR}/guias/${g.slug}.html`, renderGuide(g))

// ── Portada ──────────────────────────────────────────────────────────────────
/** Reemplaza el bloque entre <!-- name:start --> y <!-- name:end -->. */
function block(html, name, content, file) {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`)
  if (!re.test(html)) throw new Error(`${file} no tiene los marcadores ${name}:start/${name}:end`)
  return html.replace(re, () => `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`)
}

function landingBlocks(html, loc, file) {
  const hub = hubPath(loc)
  const cards = CATEGORIES.map((c) => {
    const n = pages.filter((p) => p.category === c.id).length
    return `        <li class="reveal"><a href="${hub}#cat-${c.id}"><span class="wt-ico">${svg(c.icon, 'wt-svg')}</span><span class="wt-text"><b>${esc(loc.ui.cats[c.id])}</b><span>${esc(toolCount(loc, n))}</span></span></a></li>`
  }).join('\n')
  const items = `      <ul class="web-tools wt-cats" data-stagger="60">
${cards}
      </ul>
      <div class="wt-more reveal"><a class="btn btn-primary" href="${hub}">${esc(loc.ui.seeAll.replace('{n}', String(pages.length)))} <span aria-hidden="true">→</span></a></div>`
  let out = block(html, 'tools', items, file)
  out = block(out, 'hreflang', alternates(homePath), file)
  out = block(out, 'langs', langMenu(loc, homePath, 'lang-menu', '  '), file)
  return out
}

const landingEs = landingBlocks(readFileSync(join(root, SITE_DIR, 'index.html'), 'utf-8'), ES, `${SITE_DIR}/index.html`)
emit(`${SITE_DIR}/index.html`, landingEs)

for (const loc of LOCALES) {
  // Las guías (W-19) solo existen en español: las portadas traducidas no las enlazan.
  let html = landingEs.replace('      <a href="/guias" data-track="guides_footer">Guías</a>\n', '')
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
  emit(`${SITE_DIR}/${loc.lang}/index.html`, landingBlocks(html, loc, `${SITE_DIR}/${loc.lang}/index.html`))
}

// ── sitemap.xml con las versiones de cada página ─────────────────────────────
const entry = (pathFor, freq, prio) => {
  const links = [...LANGS.map((l) => [l.lang, pathFor(l)]), ['x-default', pathFor(ES)]]
    .map(([hl, p]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${SITE}${p}"/>`)
    .join('\n')
  return LANGS.map((l) => `  <url>\n    <loc>${SITE}${pathFor(l)}</loc>\n${links}\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`).join('\n')
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/generate-tool-pages.mjs. No editar a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry(homePath, 'monthly', '1.0')}
${entry(hubPath, 'monthly', '0.9')}
${pages.map((p) => entry((l) => pagePath(p, l), 'monthly', '0.9')).join('\n')}
  <url><loc>${SITE}/guias</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
${guides.map((g) => `  <url><loc>${SITE}/guias/${g.slug}</loc><lastmod>${GUIDES_UPDATED}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}
  <url><loc>${SITE}/app/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/privacidad</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
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
console.log(`Páginas: ${pages.length} herramientas × ${LANGS.length} idiomas y ${guides.length} guías ${check ? 'al día' : 'generadas'}`)
