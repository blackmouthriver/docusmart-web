import { describe, expect, it } from 'vitest'
import { CATALOG, CATEGORIES, countByCategory, groupTools } from '../../../../src/features/tools/core/catalog'
import { es } from '../../../../src/shared/i18n/messages/es'
import en from '../../../../src/shared/i18n/messages/en'
import { CATEGORIES as SITE_CATEGORIES, pages } from '../../../../tools/pages.mjs'
import type { MessageKey } from '../../../../src/shared/i18n/messages/es'

const tEs = (k: MessageKey) => es[k]
const tEn = (k: MessageKey) => en[k]

describe('catálogo de la app', () => {
  it('usa las mismas categorías, en el mismo orden e íconos, que el sitio', () => {
    expect(CATEGORIES.map((c) => [c.id, c.icon])).toEqual(SITE_CATEGORIES.map((c) => [c.id, c.icon]))
  })
  it('cada herramienta tiene clave única y textos en todos los idiomas', () => {
    expect(new Set(CATALOG.map((x) => x.key)).size).toBe(CATALOG.length)
    for (const x of CATALOG) {
      expect(es[x.name], x.name).toBeTruthy()
      expect(es[x.desc], x.desc).toBeTruthy()
      expect(en[x.name], x.name).toBeTruthy()
    }
  })
  it('cada herramienta con página propia está en la misma categoría que en el sitio', () => {
    const route = (kind: string, id?: string) =>
      kind === 'pdf' ? `pdf/${id}` : kind === 'conv' ? `convertir/${id}` : kind === 'img' ? `imagen/${id}` : kind === 'archive' ? `archivos/${id}` : 'qr/crear'
    for (const p of pages) {
      const tool = CATALOG.find((x) => x.key === route(p.tool.kind, p.tool.id))
      expect(tool?.category, p.slug).toBe(p.category)
    }
  })
  it('cuenta las herramientas de cada categoría', () => {
    const n = countByCategory()
    expect(Object.values(n).reduce((a, b) => a + b, 0)).toBe(CATALOG.length)
    expect(n.organizar).toBe(5)
    expect(n.qr).toBe(2)
  })
})

describe('groupTools', () => {
  it('agrupa en el orden de las categorías y ordena alfabéticamente según el idioma', () => {
    const groups = groupTools(tEs, 'es')
    expect(groups.map((g) => g.id)).toEqual(CATEGORIES.map((c) => c.id))
    expect(groups[0].tools.map((x) => es[x.name])).toEqual(['Dividir PDF', 'Numerar páginas', 'Reordenar páginas', 'Rotar páginas', 'Unir PDFs'])
    const convertEn = groupTools(tEn, 'en').find((g) => g.id === 'convertir')!
    expect(convertEn.tools.map((x) => en[x.name])[0]).toBe('Excel to PDF')
  })
  it('filtra por nombre, descripción o categoría y oculta las categorías vacías', () => {
    const word = groupTools(tEs, 'es', 'word')
    expect(word.map((g) => g.id)).toEqual(['convertir'])
    expect(word[0].tools.map((x) => x.sub).sort()).toEqual(['pdf-word', 'word-pdf'])
    const seguridad = groupTools(tEs, 'es', 'seguridad')
    expect(seguridad.map((g) => g.id)).toEqual(['seguridad'])
    expect(groupTools(tEs, 'es', 'zzzz')).toEqual([])
  })
  it('busca sin tildes ni mayúsculas', () => {
    expect(groupTools(tEs, 'es', 'IMAGENES').some((g) => g.tools.some((x) => x.sub === 'imagenes'))).toBe(true)
  })
})
