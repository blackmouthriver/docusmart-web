import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDES_UPDATED, guides, type GuideBlock } from '../../../../tools/guides.mjs'
import { pages } from '../../../../tools/pages.mjs'
import { generatedHtml } from '../../../../tools/locales/index.mjs'
import { GUIDE_LANGS, guideFile, guideLangs, guidePath, guideUi, guidesIn, guidesIndexPath, localizedGuide } from '../../../../tools/guides/index.mjs'
import { TOOL_GUIDES } from '../../../../tools/guides-herramientas.mjs'
import { GUIDE_IMAGES, ogShot } from '../../../../tools/guide-images.mjs'

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
      expect(sitemap).toContain(`<lastmod>${g.updated ?? GUIDES_UPDATED}</lastmod>`)
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

  it('las 6 guías de W-19 están en los 12 idiomas', () => {
    for (const lang of translated) expect(guidesIn(lang).length, lang).toBeGreaterThanOrEqual(6)
  })

  for (const lang of translated) {
    it(`${lang}: cada guía tiene la misma estructura y los mismos enlaces que el español`, () => {
      for (const g of guidesIn(lang)) {
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
      for (const g of guidesIn(lang)) {
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

describe('guías ilustradas por herramienta (W-101)', () => {
  it('cada una lleva a su herramienta, trae al menos una captura y tiene fecha propia', () => {
    expect(TOOL_GUIDES.length).toBeGreaterThanOrEqual(8)
    for (const g of TOOL_GUIDES) {
      expect(toolSlugs.has(g.tools[0]), g.slug).toBe(true)
      expect(GUIDE_IMAGES[g.slug]?.length, g.slug).toBeGreaterThan(0)
      expect(g.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('cada captura tiene su texto alternativo y su archivo en cada idioma de la guía', () => {
    for (const g of TOOL_GUIDES)
      for (const img of GUIDE_IMAGES[g.slug])
        for (const lang of guideLangs(g)) {
          expect(img.alt[lang]?.trim(), `${g.slug} ${img.shot} ${lang}`).toBeTruthy()
          for (const w of [1280, 390]) expect(existsSync(resolve(root, `public/img/guides/${lang}/${img.shot}-${w}.webp`)), `${lang}/${img.shot}-${w}`).toBe(true)
        }
  })

  it('los lotes 1, 2 y 3 están en los 12 idiomas', () => {
    for (const g of TOOL_GUIDES.slice(0, 24)) expect(guideLangs(g), g.slug).toEqual(GUIDE_LANGS)
  })

  it('una guía todavía sin traducir solo existe en español (sin hreflang ni páginas en otros idiomas)', () => {
    // Las guías nuevas se publican primero en español (hoy no hay ninguna pendiente).
    const pending = TOOL_GUIDES.filter((g) => guideLangs(g).length === 1)
    const html = generatedHtml()
    for (const g of pending) {
      expect(guideLangs(g)).toEqual(['es'])
      for (const lang of GUIDE_LANGS.filter((l) => l !== 'es')) expect(guidesIn(lang)).not.toContain(g)
      const page = readFileSync(resolve(root, `site/guias/${g.slug}.html`), 'utf8')
      expect(page).not.toMatch(/hreflang="en"/)
      expect(page).toContain('class="gd-shot"')
      expect(html).toContain(`guias/${g.slug}.html`)
    }
  })
})

describe('imagen para compartir cada guía (W-102)', () => {
  /** Ancho y alto de un JPEG (marcador SOF0/SOF2). */
  function jpegSize(bytes: Buffer): [number, number] {
    let i = 2
    while (i < bytes.length) {
      const marker = bytes[i + 1]
      const len = bytes.readUInt16BE(i + 2)
      if (marker === 0xc0 || marker === 0xc2) return [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)]
      i += 2 + len
    }
    throw new Error('no es un JPEG')
  }

  it('la captura elegida es la marcada, si no la del resultado, si no la primera', () => {
    expect(ogShot('firmar-pdf-sin-imprimir')).toBe('firmar-pdf/colocar')
    expect(ogShot('unir-pdf-en-el-celular')).toBe('unir-pdf/resultado')
    expect(ogShot('girar-paginas-de-un-pdf')).toBe('rotar-pdf/paginas')
    expect(ogShot('no-existe')).toBeUndefined()
  })

  it('cada guía en cada idioma tiene su imagen de 1200x630 en og:image y en el Article', () => {
    for (const lang of GUIDE_LANGS)
      for (const g of guidesIn(lang)) {
        const rel = `img/og/guias/${lang}/${g.slug}.jpg`
        const where = `${lang}/${g.slug}`
        expect(jpegSize(readFileSync(resolve(root, 'public', rel))), where).toEqual([1200, 630])
        const page = readFileSync(resolve(root, 'site', guideFile(g, lang)), 'utf8')
        expect(page, where).toContain(`<meta property="og:image" content="https://docusmart.online/${rel}">`)
        expect(page, where).toContain(`<meta property="og:image:alt" content="`)
        const article = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]).find((x: { '@type': string }) => x['@type'] === 'Article')
        expect(article.image[0], where).toBe(`https://docusmart.online/${rel}`)
        expect(article.image[1], where).toMatch(new RegExp(`/img/guides/(${lang}|es)/${ogShot(g.slug)}-1280\.webp$`))
      }
    // Lee 360 imágenes y páginas: con el equipo cargado (justo tras instalar o compilar) pasaba de 5 s.
  }, 30_000)

  it('el índice de guías sigue con la imagen general del idioma', () => {
    const page = readFileSync(resolve(root, 'site/guias.html'), 'utf8')
    expect(page).toContain('<meta property="og:image" content="https://docusmart.online/img/og/es.jpg">')
  })
})
