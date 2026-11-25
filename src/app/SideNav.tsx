/**
 * Navegación de la barra lateral (W-145): las funciones que no son herramientas (Inicio,
 * Todas las herramientas, Modo Estudio) y las herramientas por las mismas categorías del
 * catálogo único, desplegables, con un buscador que filtra la barra. Plegada, cada categoría
 * es un ícono que lleva a esa categoría en "Todas las herramientas".
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../shared/ui/Icon'
import { useT } from '../shared/i18n/I18n'
import type { MessageKey } from '../shared/i18n/messages/es'
import { CATALOG, CATEGORIES, groupTools, inCategory, type CategoryId } from '../features/tools/core/catalog'
import type { Route } from './state'

type NavSub = { sub: string; label: MessageKey; icon: IconName }
const STUDY_SUBS: NavSub[] = [
  { sub: 'lectura', label: 'study.readAloud', icon: 'volume' },
  { sub: 'notas', label: 'study.notes', icon: 'note' },
  { sub: 'agenda', label: 'study.agenda', icon: 'calendar' },
  { sub: 'pomodoro', label: 'study.pomodoro', icon: 'timer' },
  { sub: 'estadisticas', label: 'study.stats', icon: 'chart' },
]
/** Grupo desplegable: Modo Estudio o una categoría del catálogo. */
type GroupId = CategoryId | 'estudio'

/** Categoría de la pantalla actual: la de la herramienta abierta (la principal, si tiene varias). */
export function categoryOf(route: Route): CategoryId | null {
  if (route.section === 'herramientas' && route.sub && CATEGORIES.some((c) => c.id === route.sub)) return route.sub as CategoryId
  const tool = CATALOG.find((x) => x.section === route.section && x.sub === route.sub) ?? (route.sub ? undefined : CATALOG.find((x) => x.section === route.section))
  return tool?.category ?? null
}

/** Contenido que se abre y se cierra con la misma transición; cerrado queda fuera del foco (inert). */
function Collapse({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div className="nav-collapse" data-open={open || undefined} id={id} inert={!open}>
      <div className="nav-collapse-inner">
        <div className="nav-subs">{children}</div>
      </div>
    </div>
  )
}

export function SideNav({ route, collapsed, onExpand }: { route: Route; collapsed: boolean; onExpand: () => void }) {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')
  const current: GroupId | null = route.section === 'estudio' ? 'estudio' : categoryOf(route)
  const [open, setOpen] = useState<ReadonlySet<GroupId>>(() => new Set(current ? [current] : []))
  const search = useRef<HTMLInputElement>(null)
  // Al cambiar de herramienta, su grupo se abre (los demás quedan como el usuario los dejó).
  useEffect(() => {
    if (current) setOpen((o) => (o.has(current) ? o : new Set([...o, current])))
  }, [current])

  const groups = useMemo(() => groupTools(t, lang, query), [t, lang, query])
  const searching = query.trim().length > 0
  const toggle = (id: GroupId) => setOpen((o) => (o.has(id) ? new Set([...o].filter((x) => x !== id)) : new Set([...o, id])))
  const here = (section: string, sub = '') => route.section === section && (route.sub ?? '') === sub

  /** Vista general del grupo: la categoría en "Todas las herramientas", o el inicio de Modo Estudio. */
  const overview = (id: GroupId) => (id === 'estudio' ? '#/estudio' : `#/herramientas/${id}`)
  const onOverview = (id: GroupId) => (id === 'estudio' ? here('estudio') : here('herramientas', id))
  /**
   * Tocar un grupo lleva a su vista general y despliega sus herramientas. Si ya se está en esa
   * vista, solo se despliega o se pliega (así se puede cerrar).
   */
  const pickGroup = (id: GroupId) => {
    if (onOverview(id)) return toggle(id)
    setOpen((o) => (o.has(id) ? o : new Set([...o, id])))
    window.location.hash = overview(id)
  }

  /** Botón de un grupo desplegable, con su ícono, su cantidad y la flecha. */
  const groupButton = (id: GroupId, icon: IconName, name: string, count: number, expanded: boolean) => (
    <button type="button" className="nav-item nav-cat-btn" aria-expanded={expanded} aria-controls={`nav-cat-${id}`} aria-current={onOverview(id) ? 'page' : undefined} disabled={searching} onClick={() => pickGroup(id)} data-current={current === id || undefined}>
      <Icon name={icon} />
      <span className="nav-label">{name}</span>
      <span className="nav-count">{count}</span>
      {!searching && <span className="nav-caret" aria-hidden="true"><Icon name="back" /></span>}
    </button>
  )

  return (
    <nav className="side-nav" aria-label={t('nav.sections')}>
      {collapsed ? (
        <button type="button" className="nav-item nav-search-btn" data-tip={t('nav.search')} aria-label={t('nav.search')} onClick={() => (onExpand(), setTimeout(() => search.current?.focus(), 450))}>
          <Icon name="search" />
        </button>
      ) : (
        <label className="side-search">
          <Icon name="search" />
          <input
            ref={search}
            type="search"
            value={query}
            placeholder={t('nav.searchPh')}
            aria-label={t('nav.search')}
            autoComplete="off"
            enterKeyHint="search"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          />
        </label>
      )}

      {!searching && (
        <>
          {!collapsed && <p className="side-heading">{t('nav.general')}</p>}
          <a className="nav-item" href="#/" data-tip={t('nav.home')} aria-label={collapsed ? t('nav.home') : undefined} aria-current={route.section === '' || route.section === 'ver' ? 'page' : undefined}>
            <Icon name="home" />
            <span className="nav-label">{t('nav.home')}</span>
          </a>
          <a className="nav-item" href="#/herramientas" data-tip={t('nav.tools')} aria-label={collapsed ? t('nav.tools') : undefined} aria-current={here('herramientas') ? 'page' : undefined}>
            <Icon name="grid" />
            <span className="nav-label">{t('nav.tools')}</span>
            {!collapsed && <span className="nav-count">{CATALOG.length}</span>}
          </a>
          {collapsed ? (
            <a className="nav-item" href="#/estudio" data-tip={t('nav.study')} aria-label={t('nav.study')} aria-current={current === 'estudio' ? 'page' : undefined}>
              <Icon name="study" />
            </a>
          ) : (
            <div className="nav-cat">
              {groupButton('estudio', 'study', t('nav.study'), STUDY_SUBS.length, open.has('estudio'))}
              <Collapse id="nav-cat-estudio" open={open.has('estudio')}>
                {STUDY_SUBS.map((s) => (
                  <a key={s.sub} className="nav-item nav-sub" href={`#/estudio/${s.sub}`} aria-current={here('estudio', s.sub) ? 'page' : undefined}>
                    <Icon name={s.icon} />
                    <span className="nav-label">{t(s.label)}</span>
                  </a>
                ))}
              </Collapse>
            </div>
          )}
          {!collapsed && <p className="side-heading">{t('nav.toolsHeading')}</p>}
        </>
      )}

      {collapsed
        ? CATEGORIES.map((c) => (
            <a key={c.id} className="nav-item" href={`#/herramientas/${c.id}`} data-tip={t(`cat.${c.id}` as MessageKey)} aria-label={t(`cat.${c.id}` as MessageKey)} aria-current={current === c.id ? 'page' : undefined}>
              <Icon name={c.icon} />
            </a>
          ))
        : groups.map((g) => {
            const expanded = searching || open.has(g.id)
            const count = searching ? g.tools.length : CATALOG.filter((x) => inCategory(x, g.id)).length
            return (
              <div key={g.id} className="nav-cat">
                {groupButton(g.id, g.icon, t(`cat.${g.id}` as MessageKey), count, expanded)}
                <Collapse id={`nav-cat-${g.id}`} open={expanded}>
                  {g.tools.map((x) => (
                    <a key={x.key} className="nav-item nav-sub" href={`#/${x.section}/${x.sub}`} aria-current={here(x.section, x.sub) ? 'page' : undefined} onClick={() => searching && setQuery('')}>
                      <Icon name={x.icon} />
                      <span className="nav-label">{t(x.name)}</span>
                    </a>
                  ))}
                </Collapse>
              </div>
            )
          })}
      {!collapsed && searching && !groups.length && <p className="side-empty">{t('nav.noResults')}</p>}
    </nav>
  )
}
