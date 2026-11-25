import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGES_UPDATED, PRIVACY_UPDATED, pages } from '../../../../tools/pages.mjs'
import { LANGS } from '../../../../tools/locales/index.mjs'

const root = resolve(__dirname, '../../../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf-8')
const landingFile = (lang: string) => (lang === 'es' ? 'site/index.html' : `site/${lang}/index.html`)

describe('SEO de la portada', () => {
  it.each(LANGS.map((l) => l.lang))('portada %s: título y descripción con largo apto para buscadores', (lang) => {
    const html = read(landingFile(lang))
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
    const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? ''
    expect(title).toMatch(/PDF/)
    expect(title.length).toBeLessThanOrEqual(60)
    expect(description).toMatch(/PDF/)
    expect(description.length).toBeLessThanOrEqual(160)
  })

  it.each(LANGS.map((l) => l.lang))('portada %s: datos estructurados válidos en su idioma', (lang) => {
    const html = read(landingFile(lang))
    const raw = html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)?.[1]
    expect(raw).toBeDefined()
    const ld = JSON.parse(raw ?? '{}') as { '@graph': { '@type': string; inLanguage?: string; installUrl?: string }[] }
    const types = ld['@graph'].map((n) => n['@type'])
    expect(types).toEqual(['Organization', 'WebSite', 'MobileApplication', 'WebApplication'])
    const app = ld['@graph'].find((n) => n['@type'] === 'MobileApplication')
    expect(app?.inLanguage).toBe(lang)
    expect(app?.installUrl).toContain('id=com.docsmart')
    // Sin valoraciones inventadas.
    expect(raw).not.toContain('aggregateRating')
  })

  it('todas las URL del sitemap tienen <lastmod>', () => {
    const sitemap = read('public/sitemap.xml')
    const urls = sitemap.match(/<url>[\s\S]*?<\/url>/g) ?? []
    expect(urls.length).toBeGreaterThan(0)
    for (const u of urls) expect(u).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    expect(sitemap).toContain(`<lastmod>${PAGES_UPDATED}</lastmod>`)
    expect(sitemap).toContain(`/privacidad</loc><lastmod>${PRIVACY_UPDATED}</lastmod>`)
  })

  it.each(LANGS.map((l) => l.lang))('portada %s: dice cuántas herramientas hay (el número real)', (lang) => {
    const html = read(landingFile(lang))
    const n = String(pages.length)
    for (const kind of ['chip', 'title']) {
      const text = html.match(new RegExp(String.raw`data-tool-count="${kind}">(?:<svg[^>]*>[\s\S]*?</svg>)?([^<]*)<`))?.[1] ?? ''
      expect(text, kind).toContain(n)
    }
  })
})
