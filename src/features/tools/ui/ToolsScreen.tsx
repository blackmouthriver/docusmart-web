// Pantalla "Todas las herramientas" de la app (W-79): las mismas categorías que la portada
// y /herramientas, orden alfabético del idioma y buscador que filtra mientras se escribe.
import { useEffect, useMemo, useState } from 'react'
import { go } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { HeroCard, Notice } from '../../../shared/ui/ui'
import { useT } from '../../../shared/i18n/I18n'
import { scrollBehavior } from '../../../shared/platform/motion'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { CATALOG, CATEGORIES, groupTools } from '../core/catalog'

export function ToolsScreen({ sub }: { sub?: string }) {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupTools(t, lang, query), [t, lang, query])
  const count = (n: number) => (n === 1 ? t('tools.one') : t('tools.many', { n }))
  const jump = (id: string) => document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })

  // #/herramientas/<categoría> (accesos del inicio) abre directo en esa categoría.
  useEffect(() => {
    if (sub) document.getElementById(`cat-${sub}`)?.scrollIntoView({ block: 'start' })
  }, [sub])

  return (
    <>
      <HeroCard title={t('tools.title')} subtitle={t('tools.subtitle', { n: CATALOG.length })} />

      <label className="tools-search">
        <span className="sr-only">{t('tools.search')}</span>
        <Icon name="search" />
        <input className="input" type="search" value={query} placeholder={t('tools.searchHint')} autoComplete="off" enterKeyHint="search" onChange={(e) => setQuery(e.target.value)} />
      </label>

      <nav className="tools-jump" aria-label={t('tools.title')}>
        {CATEGORIES.map((c) => {
          const visible = groups.some((g) => g.id === c.id)
          return (
            <button key={c.id} type="button" className="tools-chip" disabled={!visible} onClick={() => jump(c.id)}>
              <Icon name={c.icon} />
              {t(`cat.${c.id}` as MessageKey)}
            </button>
          )
        })}
      </nav>

      <div aria-live="polite">
        {groups.length === 0 && <Notice kind="plain">{t('tools.empty')}</Notice>}
        {groups.map((g) => (
          <section key={g.id} id={`cat-${g.id}`} className="tools-cat" aria-labelledby={`cat-h-${g.id}`}>
            <div className="tools-cat-head">
              <span className="tools-cat-ico">
                <Icon name={g.icon} />
              </span>
              <h2 id={`cat-h-${g.id}`}>{t(`cat.${g.id}` as MessageKey)}</h2>
              <span className="tools-count">{count(g.tools.length)}</span>
            </div>
            <div className="quick-grid tools-grid">
              {g.tools.map((x) => (
                <button key={x.key} type="button" className="quick" onClick={() => go(x.section, x.sub)}>
                  <span className="ico ico-blue">
                    <Icon name={x.icon} />
                  </span>
                  <span>
                    <b>{t(x.name)}</b>
                    <small>{t(x.desc)}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
