// Barra lateral por categorías (W-145): categoría de cada pantalla y lo que se dibuja en cada estado.
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SideNav, categoryOf } from '../../../src/app/SideNav'
import { CATALOG, CATEGORIES } from '../../../src/features/tools/core/catalog'
import type { Route } from '../../../src/app/state'

const draw = (route: Route, collapsed = false) => renderToString(createElement(SideNav, { route, collapsed, onExpand: () => {} }))
const count = (html: string, needle: string) => html.split(needle).length - 1

describe('categoryOf', () => {
  it('da la categoría de la herramienta abierta', () => {
    expect(categoryOf({ section: 'pdf', sub: 'unir' })).toBe('organizar')
    expect(categoryOf({ section: 'pdf', sub: 'proteger' })).toBe('seguridad')
  })

  it('una categoría de "Todas las herramientas" es la categoría actual', () => {
    expect(categoryOf({ section: 'herramientas', sub: 'imagen' })).toBe('imagen')
    expect(categoryOf({ section: 'herramientas', sub: 'nada' })).toBeNull()
    expect(categoryOf({ section: 'herramientas' })).toBeNull()
  })

  it('una sección sin herramienta elegida toma la de su primera herramienta; lo demás no tiene categoría', () => {
    const first = CATALOG.find((x) => x.section === 'pdf')!
    expect(categoryOf({ section: 'pdf' })).toBe(first.category)
    expect(categoryOf({ section: 'pdf', sub: 'no-existe' })).toBeNull()
    expect(categoryOf({ section: '' })).toBeNull()
  })
})

describe('SideNav', () => {
  it('desplegada: buscador, General, las 12 categorías con su cantidad y la actual abierta con la herramienta marcada', () => {
    const html = draw({ section: 'pdf', sub: 'unir' })
    expect(html).toContain('type="search"')
    expect(html).toContain('nav.general')
    expect(html).toContain('nav.toolsHeading')
    expect(count(html, 'class="nav-item nav-cat-btn"')).toBe(CATEGORIES.length + 1) // + Modo Estudio
    expect(html).toContain(`<span class="nav-count">${CATALOG.length}</span>`)
    // Organizar abierta (y su herramienta marcada); Seguridad cerrada y fuera del foco.
    expect(html).toMatch(/aria-expanded="true" aria-controls="nav-cat-organizar"/)
    expect(html).toMatch(/aria-expanded="false" aria-controls="nav-cat-seguridad"/)
    expect(html).toMatch(/id="nav-cat-organizar"(?![^>]*inert)/)
    expect(html).toMatch(/id="nav-cat-seguridad"[^>]*inert/)
    expect(html).toMatch(/href="#\/pdf\/unir" aria-current="page"/)
  })

  it('Modo Estudio es un grupo desplegable con sus 5 funciones, abierto en sus pantallas', () => {
    const closed = draw({ section: 'pdf', sub: 'unir' })
    expect(closed).toMatch(/aria-expanded="false" aria-controls="nav-cat-estudio"/)
    const html = draw({ section: 'estudio', sub: 'notas' })
    expect(html).toMatch(/aria-expanded="true" aria-controls="nav-cat-estudio"/)
    expect(html).toContain('<span class="nav-label">nav.study</span><span class="nav-count">5</span>')
    expect(html).toMatch(/aria-controls="nav-cat-estudio"[^>]*data-current="true"/)
    expect(html).toMatch(/href="#\/estudio\/notas" aria-current="page"/)
  })

  it('Inicio y Todas las herramientas se marcan en sus pantallas', () => {
    expect(draw({ section: '' })).toMatch(/href="#\/" [^>]*aria-current="page"/)
    expect(draw({ section: 'ver' })).toMatch(/href="#\/" [^>]*aria-current="page"/)
    expect(draw({ section: 'herramientas' })).toMatch(/href="#\/herramientas" [^>]*aria-current="page"/)
    expect(draw({ section: 'herramientas', sub: 'imagen' })).not.toMatch(/href="#\/herramientas" [^>]*aria-current="page"/)
  })

  it('plegada: el buscador es un botón y cada categoría un ícono que lleva a ella', () => {
    const html = draw({ section: 'pdf', sub: 'proteger' }, true)
    expect(html).not.toContain('type="search"')
    expect(html).toContain('aria-label="nav.search"')
    expect(html).not.toContain('nav-cat-btn')
    for (const c of CATEGORIES) expect(html).toContain(`href="#/herramientas/${c.id}"`)
    expect(html).toMatch(/href="#\/herramientas\/seguridad"[^>]*aria-current="page"/)
    expect(html).toContain('href="#/estudio"')
    expect(html).not.toContain('nav.general')
  })
})
