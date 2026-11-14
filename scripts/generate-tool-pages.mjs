// Genera un HTML por herramienta (unir-pdf.html, imagen-a-pdf.html…) a partir
// de tools/pages.mjs. El texto queda en el HTML para que los buscadores lo lean
// sin ejecutar JavaScript; la herramienta se monta encima con src/tools/main.tsx.
// Se ejecuta antes de `dev` y `build`; los archivos generados se versionan y el
// CI verifica que estén al día (`npm run pages:check`).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SITE, pages } from '../tools/pages.mjs'

/** Primera letra en minúscula para "Cómo unir PDF…", salvo siglas como OCR. */
const lowerFirst = (s) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))

const root = join(import.meta.dirname, '..')
const check = process.argv.includes('--check')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// JSON-LD dentro de <script>: evita que un "</" del texto cierre la etiqueta.
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')

function render(page) {
  const url = `${SITE}/${page.slug}`
  const related = pages.filter((p) => p.slug !== page.slug)
  const toolAttrs = `data-kind="${esc(page.tool.kind)}"${page.tool.id ? ` data-id="${esc(page.tool.id)}"` : ''} data-slug="${esc(page.slug)}"`

  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${page.h1} · DocuSmart`,
      url,
      description: page.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Cualquiera (navegador web)',
      isAccessibleForFree: true,
      inLanguage: 'es',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'DocuSmart', url: SITE },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DocuSmart', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: url },
      ],
    },
  ]

  return `<!doctype html>
<!-- Generado por scripts/generate-tool-pages.mjs desde tools/pages.mjs. No editar a mano. -->
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="theme-color" content="#0B1020">
<link rel="canonical" href="${url}">
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DocuSmart">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
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
    <a class="tp-brand" href="/"><img src="/img/icon.svg" alt="" width="30" height="30">DocuSmart</a>
    <nav aria-label="Principal">
      <a href="#herramientas">Herramientas</a>
      <a href="/app/">App web</a>
      <a class="tp-nav-cta" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool">Descargar app</a>
    </nav>
  </div>
</header>

<main>
  <section class="tp-hero">
    <div class="tp-wrap">
      <nav class="tp-crumbs" aria-label="Ruta"><a href="/">DocuSmart</a><span aria-hidden="true">›</span><span>${esc(page.h1)}</span></nav>
      <h1>${esc(page.h1)}</h1>
      <p class="tp-lead">${esc(page.lead)}</p>
      <ul class="tp-badges">
        <li>Sin subir tus archivos</li>
        <li>Gratis y sin registro</li>
        <li>Funciona en el navegador</li>
      </ul>
    </div>
  </section>

  <section class="tp-wrap tp-tool" aria-label="Herramienta">
    <div id="tool" ${toolAttrs}>
      <noscript><p class="tp-noscript">Para usar esta herramienta activa JavaScript en tu navegador. Todo el proceso ocurre en tu equipo.</p></noscript>
    </div>
  </section>

  <section class="tp-wrap tp-section">
    <h2>${esc(page.howTo ?? `Cómo ${lowerFirst(page.h1)} en 3 pasos`)}</h2>
    <ol class="tp-steps">
${page.steps.map((s) => `      <li>${esc(s)}</li>`).join('\n')}
    </ol>
  </section>

  <section class="tp-wrap tp-section tp-privacy">
    <h2>Tus archivos no salen de tu equipo</h2>
    <p>A diferencia de otras herramientas en línea, DocuSmart no sube tus documentos a ningún servidor: todo se procesa dentro de tu navegador. Puedes usarla con contratos, facturas o documentos de identidad con total tranquilidad. <a href="/privacidad">Lee nuestra política de privacidad</a>.</p>
  </section>

  <section class="tp-wrap tp-section">
    <h2>Preguntas frecuentes</h2>
    <div class="tp-faq">
${page.faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <p>${esc(a)}</p>\n      </details>`).join('\n')}
    </div>
  </section>

  <section class="tp-wrap tp-section" id="herramientas">
    <h2>Más herramientas gratis</h2>
    <ul class="tp-related">
${related.map((p) => `      <li><a href="/${p.slug}"><b>${esc(p.h1)}</b><span>${esc(p.short)}</span></a></li>`).join('\n')}
      <li><a href="/app/"><b>Todas las herramientas</b><span>Abre DocuSmart Web</span></a></li>
    </ul>
  </section>

  <section class="tp-wrap tp-section">
    <div class="tp-cta">
      <div>
        <h2>Lleva DocuSmart en tu celular</h2>
        <p>La app para Android suma escáner con detección de bordes, carpeta segura con PIN, Word, Excel y PowerPoint, y OCR. Funciona sin conexión.</p>
      </div>
      <a class="btn btn-primary" href="https://play.google.com/store/apps/details?id=com.docsmart" target="_blank" rel="noopener" data-track="play_store_tool_cta">Descargar en Google Play</a>
    </div>
  </section>
</main>

<footer class="tp-foot">
  <div class="tp-wrap tp-foot-inner">
    <span>© DocuSmart</span>
    <nav aria-label="Pie de página">
      <a href="/">Inicio</a>
      <a href="/app/">DocuSmart Web</a>
      <a href="/privacidad">Política de privacidad</a>
      <button type="button" class="link-btn" data-consent-open hidden>Preferencias de analítica</button>
    </nav>
  </div>
</footer>
<script type="module" src="/src/tools/main.tsx"></script>
</body>
</html>
`
}

let stale = []
for (const page of pages) {
  const file = join(root, `${page.slug}.html`)
  const html = render(page)
  let current = null
  try {
    current = readFileSync(file, 'utf-8')
  } catch {
    /* todavía no existe */
  }
  if (current === html) continue
  if (check) stale.push(`${page.slug}.html`)
  else writeFileSync(file, html)
}

// Lista de herramientas de la landing, entre <!-- tools:start --> y <!-- tools:end -->.
const landingFile = join(root, 'index.html')
const landing = readFileSync(landingFile, 'utf-8')
const items = pages
  .map((p) => `        <li><a href="/${p.slug}"><b>${esc(p.h1)}</b><span>${esc(p.short)}</span></a></li>`)
  .join('\n')
const landingNext = landing.replace(/<!-- tools:start -->[\s\S]*?<!-- tools:end -->/, `<!-- tools:start -->
${items}
<!-- tools:end -->`)
if (!landing.includes('<!-- tools:start -->')) throw new Error('index.html no tiene los marcadores tools:start/tools:end')
if (landingNext !== landing) {
  if (check) stale.push('index.html (lista de herramientas)')
  else writeFileSync(landingFile, landingNext)
}

// sitemap.xml: páginas fijas + una entrada por herramienta.
const sitemapFile = join(root, 'public', 'sitemap.xml')
const urls = [
  ['/', 'monthly', '1.0'],
  ...pages.map((p) => [`/${p.slug}`, 'monthly', '0.9']),
  ['/app/', 'monthly', '0.8'],
  ['/privacidad', 'yearly', '0.3'],
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/generate-tool-pages.mjs. No editar a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, f, pr]) => `  <url><loc>${SITE}${u}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`
let currentSitemap = null
try {
  currentSitemap = readFileSync(sitemapFile, 'utf-8')
} catch {
  /* todavía no existe */
}
if (currentSitemap !== sitemap) {
  if (check) stale.push('public/sitemap.xml')
  else writeFileSync(sitemapFile, sitemap)
}

if (check && stale.length) {
  console.error(`Páginas de herramientas desactualizadas: ${stale.join(', ')}. Ejecuta: npm run pages`)
  process.exit(1)
}
console.log(`Páginas de herramientas: ${pages.length} ${check ? 'al día' : 'generadas'}`)
