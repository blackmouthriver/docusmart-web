// Pantalla "Todas las herramientas" de la app (W-79): las mismas categorías que la portada
// y /herramientas, orden alfabético del idioma y buscador que filtra mientras se escribe.
// #/herramientas/<categoría> (barra lateral e inicio) muestra solo esa categoría, como Modo Estudio.
import { useMemo, useState } from 'react'
import { go } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BackButton, HeroCard, Notice } from '../../../shared/ui/ui'
import { useT } from '../../../shared/i18n/I18n'
import { scrollBehavior } from '../../../shared/platform/motion'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { CATALOG, CATEGORIES, groupTools, type CategoryId } from '../core/catalog'

type Translate = ReturnType<typeof useT>['t']

/** Cuadrícula de las herramientas de un grupo (cada una abre su pantalla). */
function ToolGrid({ tools, t }: { tools: ReturnType<typeof groupTools>[number]['tools']; t: Translate }) {
  return (
    <div className="quick-grid tools-grid">
      {tools.map((x) => (
        <button key={x.key} type="button" className="quick" onClick={() => go(x.section, x.sub)}>
          <span className="ico ico-blue">
            <Icon name={x.icon} />
          </span>
          <span>
            <b>{t(x.name)}</b>
            <small>{t(x.desc)}</small>
            {x.batch && <em className="batch-chip">{t('batch.badge')}</em>}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Buscador que filtra mientras se escribe. */
function SearchBox({ value, onChange, t }: { value: string; onChange: (v: string) => void; t: Translate }) {
  return (
    <label className="tools-search">
      <span className="sr-only">{t('tools.search')}</span>
      <Icon name="search" />
      <input className="input" type="search" value={value} placeholder={t('tools.searchHint')} autoComplete="off" enterKeyHint="search" onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

/** Vista de una sola categoría: su nombre, sus herramientas y el regreso a todas. */
function CategoryView({ id }: { id: CategoryId }) {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')
  const all = useMemo(() => groupTools(t, lang, '').find((g) => g.id === id)?.tools ?? [], [t, lang, id])
  const tools = useMemo(() => groupTools(t, lang, query).find((g) => g.id === id)?.tools ?? [], [t, lang, query, id])
  return (
    <>
      <HeroCard title={t(`cat.${id}` as MessageKey)} subtitle={all.length === 1 ? t('tools.one') : t('tools.many', { n: all.length })} privacySeal={false} />
      <div style={{ margin: '14px 0' }}>
        <BackButton label={t('nav.tools')} onClick={() => go('herramientas')} />
      </div>
      <SearchBox value={query} onChange={setQuery} t={t} />
      <div aria-live="polite">
        {tools.length === 0 ? <Notice kind="plain">{t('tools.empty')}</Notice> : <ToolGrid tools={tools} t={t} />}
      </div>
    </>
  )
}

export function ToolsScreen({ sub }: { sub?: string }) {
  const category = CATEGORIES.find((c) => c.id === sub)
  return category ? <CategoryView key={category.id} id={category.id} /> : <AllTools />
}

function AllTools() {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupTools(t, lang, query), [t, lang, query])
  const count = (n: number) => (n === 1 ? t('tools.one') : t('tools.many', { n }))
  const jump = (id: string) => document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })

  return (
    <>
      <HeroCard title={t('tools.title')} subtitle={t('tools.subtitle', { n: CATALOG.length })} privacySeal={false} />

      <SearchBox value={query} onChange={setQuery} t={t} />

      {/* Carrusel continuo de categorías, como en /herramientas y la portada: dos copias que se
          desplazan en bucle (la segunda, oculta a lectores de pantalla y al teclado). */}
      <nav className="tools-jump" aria-label={t('tools.title')}>
        <div className="tools-marquee">
          {[false, true].map((copy) => (
            <div key={String(copy)} className="tools-track" aria-hidden={copy || undefined}>
              {CATEGORIES.map((c) => {
                const visible = groups.some((g) => g.id === c.id)
                return (
                  <button key={c.id} type="button" className="tools-chip" disabled={!visible} tabIndex={copy ? -1 : undefined} onClick={() => jump(c.id)}>
                    <Icon name={c.icon} />
                    {t(`cat.${c.id}` as MessageKey)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
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
            <ToolGrid tools={g.tools} t={t} />
          </section>
        ))}
      </div>
    </>
  )
}
