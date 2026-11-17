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
import { FACEBOOK_URL, INSTAGRAM_URL, SITE, pages } from '../tools/pages.mjs'
import { ES, LANGS, LOCALES, filePath, homePath, localized, pagePath } from '../tools/locales/index.mjs'

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
    `  <summary aria-label="${esc(current.ui.langMenu)}: ${esc(current.label)}"><span aria-hidden="true">🌐</span> ${current.lang.toUpperCase()}</summary>`,
    '  <ul>',
    ...items,
    '  </ul>',
    '</details>',
  ]
    .map((l) => indent + l)
    .join('\n')
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
      publisher: { '@type': 'Organization', name: 'DocuSmart', url: SITE, sameAs: [FACEBOOK_URL, INSTAGRAM_URL] },
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
<meta property="og:image" content="${SITE}/img/screen-home.webp">
<meta name="twitter:card" content="summary">
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
    <div class="tp-wrap">
      <nav class="tp-crumbs" aria-label="${esc(ui.crumbs)}"><a href="${home}">DocuSmart</a><span aria-hidden="true">›</span><span>${esc(p.h1)}</span></nav>
      <h1>${esc(p.h1)}</h1>
      <p class="tp-lead">${esc(p.lead)}</p>
      <ul class="tp-badges">
${ui.badges.map((b) => `        <li>${esc(b)}</li>`).join('\n')}
      </ul>
    </div>
  </section>

  <section class="tp-wrap tp-tool" aria-label="${esc(ui.toolAria)}">
    <div id="tool" ${toolAttrs}>
      <noscript><p class="tp-noscript">${esc(ui.noscript)}</p></noscript>
    </div>
  </section>

  <section class="tp-wrap tp-section">
    <h2>${esc(p.howTo ?? ui.howTo.replace('{tool}', lowerFirst(p.h1)))}</h2>
    <ol class="tp-steps">
${p.steps.map((s) => `      <li>${esc(s)}</li>`).join('\n')}
    </ol>
  </section>

  <section class="tp-wrap tp-section tp-privacy">
    <h2>${esc(ui.privacyTitle)}</h2>
    <p>${esc(ui.privacyText)} <a href="/privacidad">${esc(ui.privacyLink)}</a>.</p>
  </section>

  <section class="tp-wrap tp-section">
    <h2>${esc(ui.faqTitle)}</h2>
    <div class="tp-faq">
${p.faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <p>${esc(a)}</p>\n      </details>`).join('\n')}
    </div>
  </section>

  <section class="tp-wrap tp-section" id="herramientas">
    <h2>${esc(ui.moreTools)}</h2>
    <ul class="tp-related">
${related.map((r) => `      <li><a href="${pagePath(r, loc)}"><b>${esc(localized(r, loc).h1)}</b><span>${esc(localized(r, loc).short)}</span></a></li>`).join('\n')}
      <li><a href="/app/"><b>${esc(ui.allTools)}</b><span>${esc(ui.openWeb)}</span></a></li>
    </ul>
  </section>

  <section class="tp-wrap tp-section">
    <div class="tp-cta">
      <div>
        <h2>${esc(ui.ctaTitle)}</h2>
        <p>${esc(ui.ctaText)}</p>
      </div>
      <a class="btn btn-primary" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool_cta">${esc(ui.ctaBtn)}</a>
    </div>
  </section>
</main>

<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="${esc(ui.footAria)}">
      <a href="${home}">${esc(ui.footHome)}</a>
      <a href="/app/">DocuSmart Web</a>
      <a href="/privacidad">${esc(ui.footPrivacy)}</a>
      <a href="${FACEBOOK_URL}" target="_blank" rel="noopener">Facebook</a>
      <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>
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

// ── Portada ──────────────────────────────────────────────────────────────────
/** Reemplaza el bloque entre <!-- name:start --> y <!-- name:end -->. */
function block(html, name, content, file) {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`)
  if (!re.test(html)) throw new Error(`${file} no tiene los marcadores ${name}:start/${name}:end`)
  return html.replace(re, () => `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`)
}

function landingBlocks(html, loc, file) {
  const items = pages
    .map((p) => `        <li><a href="${pagePath(p, loc)}"><b>${esc(localized(p, loc).h1)}</b><span>${esc(localized(p, loc).short)}</span></a></li>`)
    .join('\n')
  let out = block(html, 'tools', items, file)
  out = block(out, 'hreflang', alternates(homePath), file)
  out = block(out, 'langs', langMenu(loc, homePath, 'lang-menu', '  '), file)
  return out
}

const landingEs = landingBlocks(readFileSync(join(root, SITE_DIR, 'index.html'), 'utf-8'), ES, `${SITE_DIR}/index.html`)
emit(`${SITE_DIR}/index.html`, landingEs)

for (const loc of LOCALES) {
  let html = landingEs
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
    .replace('<!doctype html>', '<!doctype html>\n<!-- Generado por scripts/generate-tool-pages.mjs desde site/index.html. No editar a mano. -->')
    // Un nivel más abajo (site/en/index.html): el script de entrada está un "../" más arriba.
    .replace(`src="${entryScript('landing.ts', 0)}"`, `src="${entryScript('landing.ts', 1)}"`)
  if (!html.includes(entryScript('landing.ts', 1))) throw new Error(`${SITE_DIR}/index.html no carga ${entryScript('landing.ts', 0)}`)
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
${pages.map((p) => entry((l) => pagePath(p, l), 'monthly', '0.9')).join('\n')}
  <url><loc>${SITE}/app/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/privacidad</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
`
emit('public/sitemap.xml', sitemap)

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
console.log(`Páginas: ${pages.length} herramientas × ${LANGS.length} idiomas ${check ? 'al día' : 'generadas'}`)
