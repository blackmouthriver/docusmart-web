import { useRef } from 'react'
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '../../../shared/files/share'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { HeroCard } from '../../../shared/ui/ui'
import { consentNeeded, track } from '../../../shared/platform/analytics'
import { kindOf } from '../../../shared/files/files'
import { useT } from '../../../shared/i18n/I18n'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { CATEGORIES, countByCategory } from '../../tools/core/catalog'

const COUNTS = countByCategory()

const QUICK: Array<{ id: string; icon: IconName; cls: string; to: [string, string?] }> = [
  { id: 'imgPdf', icon: 'image', cls: 'ico-violet', to: ['convertir', 'img-pdf'] },
  { id: 'merge', icon: 'merge', cls: 'ico-red', to: ['pdf', 'unir'] },
  { id: 'split', icon: 'split', cls: 'ico-red', to: ['pdf', 'dividir'] },
  { id: 'pdfImg', icon: 'convert', cls: 'ico-blue', to: ['convertir', 'pdf-img'] },
  { id: 'readQr', icon: 'camera', cls: 'ico-blue', to: ['qr'] },
  { id: 'makeQr', icon: 'qr', cls: 'ico-cyan', to: ['qr'] },
  { id: 'reading', icon: 'volume', cls: 'ico-green', to: ['estudio'] },
  { id: 'pomodoro', icon: 'timer', cls: 'ico-amber', to: ['estudio'] },
  { id: 'scan', icon: 'camera', cls: 'ico-cyan', to: ['pdf', 'escanear'] },
  { id: 'edit', icon: 'edit', cls: 'ico-blue', to: ['pdf', 'editar'] },
  { id: 'sign', icon: 'pen', cls: 'ico-blue', to: ['pdf', 'firmar'] },
  { id: 'compress', icon: 'compress', cls: 'ico-green', to: ['pdf', 'comprimir'] },
  { id: 'compressImg', icon: 'compress', cls: 'ico-green', to: ['imagen', 'comprimir'] },
  { id: 'resize', icon: 'resize', cls: 'ico-blue', to: ['imagen', 'redimensionar'] },
  { id: 'zip', icon: 'archive', cls: 'ico-violet', to: ['archivos'] },
  { id: 'protect', icon: 'lock', cls: 'ico-amber', to: ['pdf', 'proteger'] },
  { id: 'unlock', icon: 'unlock', cls: 'ico-blue', to: ['pdf', 'desbloquear'] },
  { id: 'ocr', icon: 'text', cls: 'ico-cyan', to: ['pdf', 'ocr'] },
]

export function Home() {
  const { setOpenFile, toast } = useApp()
  const { t } = useT()
  const input = useRef<HTMLInputElement>(null)

  const open = (file: File | undefined) => {
    if (!file) return
    const kind = kindOf(file)
    if (kind === 'other') {
      toast(t('home.cantOpen'))
      return
    }
    setOpenFile(file)
    track('document_opened', { document_type: kind })
    go('ver')
  }

  return (
    <>
      <HeroCard title={t('home.title')} subtitle={t('home.subtitle')} privacySeal={false} />

      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => input.current?.click()}>
          <Icon name="open" /> {t('home.open')}
        </button>
        <a className="btn btn-outline" style={{ flex: 1 }} href="#/convertir">
          <Icon name="convert" /> {t('home.convert')}
        </a>
        <input
          ref={input}
          type="file"
          hidden
          accept="application/pdf,image/*,text/plain,.txt,.csv,.md"
          onChange={(e) => {
            open(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <h2 className="section-title">{t('home.quick')}</h2>
      <div className="quick-grid">
        {QUICK.map((q) => (
          <button key={q.id} type="button" className="quick" onClick={() => go(q.to[0], q.to[1])}>
            <span className={'ico ' + q.cls}>
              <Icon name={q.icon} />
            </span>
            <span>
              <b>{t(`quick.${q.id}` as MessageKey)}</b>
              <small>{t(`quick.${q.id}.hint` as MessageKey)}</small>
            </span>
          </button>
        ))}
      </div>

      {/* Todas las herramientas por categoría, como en la portada y /herramientas (W-79). */}
      <div className="row home-cats-head">
        <h2 className="section-title">{t('home.categories')}</h2>
        <a className="btn btn-soft" href="#/herramientas">
          {t('home.allTools')} <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="home-cats">
        {CATEGORIES.map((c) => (
          <a key={c.id} className="home-cat" href={`#/herramientas/${c.id}`}>
            <span className="ico ico-blue">
              <Icon name={c.icon} />
            </span>
            <span>
              <b>{t(`cat.${c.id}` as MessageKey)}</b>
              <small>{COUNTS[c.id] === 1 ? t('tools.one') : t('tools.many', { n: COUNTS[c.id] })}</small>
            </span>
          </a>
        ))}
      </div>

      <h2 className="section-title">{t('home.onlyApp')}</h2>
      <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="ico ico-blue">
          <Icon name="phone" />
        </span>
        <div style={{ flex: '1 1 260px' }}>
          <h3>{t('home.onlyAppTitle')}</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            {t('home.onlyAppText')}
          </p>
        </div>
        <a className="btn btn-soft" href="/" onClick={() => track('web_app_promo_click', { target: 'landing' })}>
          {t('home.knowApp')}
        </a>
      </div>

      <footer className="home-foot">
        <a href="/privacidad.html">{t('home.privacy')}</a>
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">
          TikTok
        </a>
        {consentNeeded && (
          <button type="button" className="link-btn" data-consent-open>
            {t('side.analytics')}
          </button>
        )}
      </footer>
    </>
  )
}
