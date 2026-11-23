import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST, INDEXNOW_KEY, KEY_LOCATION, MAX_URLS, buildPayloads, changedUrls, findKey, isAccepted, parseSitemap } from '../../../scripts/indexnow.mjs'

const root = resolve(__dirname, '../../..')
const sitemap = (urls: [string, string?][]) =>
  `<?xml version="1.0"?><urlset>${urls.map(([loc, lastmod]) => `<url>\n  <loc>${loc}</loc>${lastmod ? `\n  <lastmod>${lastmod}</lastmod>` : ''}\n</url>`).join('')}</urlset>`

describe('IndexNow (W-152)', () => {
  it('la clave es válida y se publica en /<clave>.txt con su propio valor', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/)
    expect(readFileSync(resolve(root, `public/${INDEXNOW_KEY}.txt`), 'utf-8').trim()).toBe(INDEXNOW_KEY)
    expect(KEY_LOCATION).toBe(`https://${HOST}/${INDEXNOW_KEY}.txt`)
  })

  it('toma la clave del único archivo <32 hex>.txt; falla si no hay o si hay varios', () => {
    const k = 'a'.repeat(32)
    expect(findKey(['robots.txt', `${k}.txt`, 'sitemap.xml'])).toBe(k)
    expect(() => findKey(['robots.txt'])).toThrow()
    expect(() => findKey([`${k}.txt`, `${'b'.repeat(32)}.txt`])).toThrow()
  })

  it('lee cada <loc> con su <lastmod>', () => {
    const map = parseSitemap(sitemap([['https://docusmart.online/', '2026-11-20'], ['https://docusmart.online/unir-pdf']]))
    expect([...map]).toEqual([
      ['https://docusmart.online/', '2026-11-20'],
      ['https://docusmart.online/unir-pdf', ''],
    ])
  })

  it('lee el sitemap real del sitio: todas las URL son del dominio y tienen fecha', () => {
    const map = parseSitemap(readFileSync(resolve(root, 'public/sitemap.xml'), 'utf-8'))
    expect(map.size).toBeGreaterThan(100)
    for (const [loc, lastmod] of map) {
      expect(new URL(loc).host).toBe(HOST)
      expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('sin sitemap anterior avisa todas; con uno, solo las nuevas o cambiadas', () => {
    const before = parseSitemap(sitemap([['https://docusmart.online/', '2026-11-18'], ['https://docusmart.online/unir-pdf', '2026-11-18']]))
    const after = parseSitemap(
      sitemap([
        ['https://docusmart.online/', '2026-11-20'],
        ['https://docusmart.online/unir-pdf', '2026-11-18'],
        ['https://docusmart.online/firmar-pdf', '2026-11-20'],
      ]),
    )
    expect(changedUrls(null, after)).toHaveLength(3)
    expect(changedUrls(before, after)).toEqual(['https://docusmart.online/', 'https://docusmart.online/firmar-pdf'])
    expect(changedUrls(after, after)).toEqual([])
  })

  it('nunca avisa URL de otro dominio ni mal formadas', () => {
    const map = parseSitemap(sitemap([['https://otro.com/x', '2026-11-20'], ['no-es-url', '2026-11-20'], ['https://docusmart.online/', '2026-11-20']]))
    expect(changedUrls(null, map)).toEqual(['https://docusmart.online/'])
  })

  it('arma los envíos de a 10.000 URL con host, clave y ubicación de la clave', () => {
    const urls = Array.from({ length: MAX_URLS + 5 }, (_, i) => `https://docusmart.online/p${i}`)
    const payloads = buildPayloads(urls)
    expect(payloads).toHaveLength(2)
    expect(payloads[0].urlList).toHaveLength(MAX_URLS)
    expect(payloads[1].urlList).toHaveLength(5)
    expect(payloads[0]).toMatchObject({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION })
    expect(buildPayloads([])).toEqual([])
  })

  it('solo 200 y 202 cuentan como aviso recibido', () => {
    expect(isAccepted(200)).toBe(true)
    expect(isAccepted(202)).toBe(true)
    for (const s of [400, 403, 422, 429, 500]) expect(isAccepted(s)).toBe(false)
  })
})
