/**
 * Auditoría técnica de SEO de todas las páginas generadas (site/): lo que un buscador revisa en
 * cada una. Así una página nueva no puede salir con el canonical mal, sin hreflang de vuelta,
 * con JSON-LD roto o con enlaces internos rotos.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../../..')
const SITE_DIR = join(root, 'site')
const PUBLIC = join(root, 'public')
const SITE = 'https://docusmart.online'

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.html') ? [join(d, f)] : []))
const urlOf = (p: string) => ('/' + relative(SITE_DIR, p).replace(/\\/g, '/')).replace(/index\.html$/, '').replace(/\.html$/, '')
type Page = { url: string; html: string; head: string }
const pages: Page[] = walk(SITE_DIR)
  .map((p) => {
    const html = readFileSync(p, 'utf8')
    return { url: urlOf(p), html, head: html.split('</head>')[0] }
  })
  .filter((p) => !/<meta name="robots" content="[^"]*noindex/.test(p.head))
const byUrl = new Map(pages.map((p) => [SITE + p.url, p]))
// &amp; va al final: así "&amp;quot;" queda como "&quot;" y no se desescapa dos veces.
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
const alternates = (p: Page) => [...p.head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }))

describe('SEO técnico del sitio', () => {
  it('hay páginas para revisar', () => {
    expect(pages.length).toBeGreaterThan(500)
  })

  it('cada página tiene lang, un solo h1, title, description y un canonical a sí misma', () => {
    const bad: string[] = []
    for (const p of pages) {
      const title = p.head.match(/<title>([^<]*)<\/title>/)?.[1]
      const canon = p.head.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
      if (!/<html[^>]*\blang="[a-z]{2}"/.test(p.html)) bad.push(`${p.url}: sin lang`)
      // /app/ es el armazón de la app web: su contenido (y sus títulos) los dibuja React.
      if (p.url !== '/app/' && (p.html.match(/<h1[\s>]/g) ?? []).length !== 1) bad.push(`${p.url}: h1`)
      if (!title?.trim()) bad.push(`${p.url}: sin title`)
      if (!/<meta name="description" content="[^"]{30,}"/.test(p.head)) bad.push(`${p.url}: description`)
      if (canon !== SITE + p.url) bad.push(`${p.url}: canonical ${canon}`)
    }
    expect(bad).toEqual([])
  })

  it('títulos aptos para el resultado de búsqueda: la marca solo si cabe y ninguno desmedido', () => {
    const bad: string[] = []
    for (const p of pages) {
      const title = decode(p.head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
      const len = [...title].length
      if (/\| DocuSmart$/.test(title) && len > 60) bad.push(`${p.url}: marca en título de ${len}`)
      if (len > 80) bad.push(`${p.url}: título de ${len}`)
    }
    expect(bad).toEqual([])
  })

  it('hreflang completo: incluye la propia página, x-default y cada idioma enlaza de vuelta', () => {
    const bad: string[] = []
    for (const p of pages) {
      const alts = alternates(p)
      if (!alts.length) continue
      const self = SITE + p.url
      if (!alts.some((a) => a.lang === 'x-default')) bad.push(`${p.url}: sin x-default`)
      if (!alts.some((a) => a.href === self)) bad.push(`${p.url}: no se incluye a sí misma`)
      for (const a of alts) {
        if (a.lang === 'x-default' || a.href === self) continue
        const other = byUrl.get(a.href)
        if (!other) bad.push(`${p.url}: hreflang a ${a.href}, que no existe`)
        else if (!alternates(other).some((b) => b.href === self)) bad.push(`${p.url}: ${a.href} no enlaza de vuelta`)
      }
    }
    expect(bad).toEqual([])
  })

  it('los datos estructurados (JSON-LD) son JSON válido y sin valoraciones inventadas', () => {
    const bad: string[] = []
    for (const p of pages)
      for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try {
          JSON.parse(m[1])
        } catch {
          bad.push(p.url)
        }
        if (m[1].includes('aggregateRating')) bad.push(`${p.url}: aggregateRating`)
      }
    expect(bad).toEqual([])
  })

  it('los enlaces internos llevan a páginas que existen', () => {
    const seen = new Map<string, boolean>()
    const exists = (path: string) => {
      const clean = path.replace(/^\//, '')
      if (!clean) return true
      if (!seen.has(clean)) seen.set(clean, [join(SITE_DIR, clean + '.html'), join(SITE_DIR, clean, 'index.html'), join(PUBLIC, clean)].some((f) => existsSync(f)))
      return seen.get(clean)!
    }
    const bad = new Set<string>()
    for (const p of pages)
      for (const m of p.html.matchAll(/href="(\/[^"#?]*)"/g)) {
        const t = m[1]
        // La app, los recursos generados en el build y el inicio de sesión no están en site/.
        if (/^\/(app|oauth|assets)(\/|$)/.test(t) || /\.(css|js|svg|png|ico|webmanifest)$/.test(t)) continue
        if (!exists(t)) bad.add(`${p.url} -> ${t}`)
      }
    expect([...bad]).toEqual([])
  }, 60_000)

  it('cada página indexable está en el sitemap', () => {
    const sitemap = readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8')
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
    const missing = pages.map((p) => SITE + p.url).filter((u) => !locs.has(u))
    expect(missing).toEqual([])
  })
})
