import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDES_UPDATED, guides, type GuideBlock } from '../../../../tools/guides.mjs'
import { pages } from '../../../../tools/pages.mjs'
import { generatedHtml } from '../../../../tools/locales/index.mjs'

const root = resolve(__dirname, '../../../..')
const toolSlugs = new Set(pages.map((p) => p.slug))
const texts = (b: GuideBlock): string[] => (typeof b === 'string' ? [b] : 'ul' in b ? b.ul : [b.tip])

describe('guías (W-19)', () => {
  it('cada guía tiene slug único en minúsculas y con guiones', () => {
    expect(new Set(guides.map((g) => g.slug)).size).toBe(guides.length)
    for (const g of guides) expect(g.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('títulos y descripciones con largo apto para buscadores', () => {
    for (const g of guides) {
      expect(g.title.length, g.slug).toBeLessThanOrEqual(90)
      expect(g.description.length, g.slug).toBeGreaterThanOrEqual(110)
      expect(g.description.length, g.slug).toBeLessThanOrEqual(175)
    }
  })

  it('recomienda herramientas que existen y enlaza solo a rutas internas conocidas', () => {
    const known = new Set([...toolSlugs].map((s) => `/${s}`))
    for (const g of guides) {
      expect(g.tools.length, g.slug).toBeGreaterThan(0)
      for (const t of g.tools) expect(toolSlugs.has(t), `${g.slug} → ${t}`).toBe(true)
      for (const s of g.sections)
        for (const b of s.body)
          for (const text of texts(b))
            for (const [, href] of text.matchAll(/\]\(([^)]+)\)/g)) expect(known.has(href), `${g.slug} → ${href}`).toBe(true)
    }
  })

  it('tiene contenido suficiente: secciones, pasos y preguntas', () => {
    for (const g of guides) {
      const words = g.sections.flatMap((s) => s.body.flatMap(texts)).join(' ').split(/\s+/).length
      expect(words, g.slug).toBeGreaterThanOrEqual(300)
      expect(g.steps.length, g.slug).toBeGreaterThanOrEqual(3)
      expect(g.faq.length, g.slug).toBeGreaterThanOrEqual(3)
    }
  })

  it('se generan, entran al build y al sitemap', () => {
    const html = generatedHtml()
    expect(html).toContain('guias.html')
    const sitemap = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8')
    expect(sitemap).toContain('<loc>https://docusmart.online/guias</loc>')
    for (const g of guides) {
      expect(html).toContain(`guias/${g.slug}.html`)
      expect(sitemap).toContain(`<loc>https://docusmart.online/guias/${g.slug}</loc><lastmod>${GUIDES_UPDATED}</lastmod>`)
      const page = readFileSync(resolve(root, `site/guias/${g.slug}.html`), 'utf8')
      expect(page).toContain(`<link rel="canonical" href="https://docusmart.online/guias/${g.slug}">`)
      expect(page).toContain('"@type": "Article"')
    }
  })
})
