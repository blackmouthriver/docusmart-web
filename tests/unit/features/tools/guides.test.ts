import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDES_UPDATED, guides, type GuideBlock } from '../../../../tools/guides.mjs'
import { pages } from '../../../../tools/pages.mjs'
import { generatedHtml } from '../../../../tools/locales/index.mjs'
import { GUIDE_LANGS, guideFile, guidePath, guideUi, guidesIndexPath, localizedGuide } from '../../../../tools/guides/index.mjs'

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
      expect(sitemap).toContain(`<loc>https://docusmart.online/guias/${g.slug}</loc>`)
      expect(sitemap).toContain(`<lastmod>${GUIDES_UPDATED}</lastmod>`)
      const page = readFileSync(resolve(root, `site/guias/${g.slug}.html`), 'utf8')
      expect(page).toContain(`<link rel="canonical" href="https://docusmart.online/guias/${g.slug}">`)
      expect(page).toContain('"@type": "Article"')
    }
  })
})

const shape = (g: { sections: Array<{ body: GuideBlock[] }>; steps: unknown[]; faq: unknown[] }) => ({
  sections: g.sections.map((s) => s.body.map((b) => (typeof b === 'string' ? 'p' : 'ul' in b ? `ul${b.ul.length}` : 'tip'))),
  steps: g.steps.length,
  faq: g.faq.length,
})
const links = (g: { sections: Array<{ body: GuideBlock[] }> }) =>
  g.sections.flatMap((s) => s.body.flatMap(texts)).flatMap((t) => [...t.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]))

const CJK = new Set(['ja', 'ko', 'zh'])

describe('guías traducidas (W-19)', () => {
  const translated = GUIDE_LANGS.filter((l) => l !== 'es')

  it('hay guías en los 12 idiomas del sitio', () => {
    expect(translated.sort()).toEqual(['ca', 'de', 'en', 'eu', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'zh'])
  })

  for (const lang of translated) {
    it(`${lang}: cada guía tiene la misma estructura y los mismos enlaces que el español`, () => {
      for (const g of guides) {
        const t = localizedGuide(g, lang)
        expect(shape(t), `${lang}/${t.slug}`).toEqual(shape(g))
        expect(links(t), `${lang}/${t.slug}`).toEqual(links(g))
        expect(t.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        expect(t.title.length, t.slug).toBeLessThanOrEqual(90)
        // Japonés, coreano y chino son más densos: la misma información cabe en menos caracteres.
        expect(t.description.length, t.slug).toBeGreaterThanOrEqual(CJK.has(lang) ? 50 : 110)
        expect(t.description.length, t.slug).toBeLessThanOrEqual(175)
      }
    })

    it(`${lang}: textos de la plantilla completos y páginas generadas con hreflang`, () => {
      const ui = guideUi(lang)
      for (const v of Object.values(ui)) expect(String(v).trim()).not.toBe('')
      expect(ui.minutes).toContain('{n}')
      expect(ui.updated).toContain('{date}')
      const html = generatedHtml()
      for (const g of guides) {
        expect(html).toContain(guideFile(g, lang))
        const page = readFileSync(resolve(root, 'site', guideFile(g, lang)), 'utf8')
        expect(page).toContain(`<html lang="${lang}">`)
        expect(page).toContain(`<link rel="canonical" href="https://docusmart.online${guidePath(g, lang)}">`)
        expect(page).toContain(`hreflang="es" href="https://docusmart.online${guidePath(g, 'es')}"`)
        // Los enlaces del texto apuntan a las herramientas del idioma, no a las españolas.
        expect(page).not.toMatch(/<a href="\/(unir-pdf|comprimir-pdf|firmar-pdf)">/)
      }
      expect(html).toContain(`${guidesIndexPath(lang).slice(1)}.html`)
    })
  }
})
