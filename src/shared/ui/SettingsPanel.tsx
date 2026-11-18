// Ajustes de DocuSmart Web, como en la app: idioma, tema, color de acento y tamaño de letra.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Segmented } from './ui'
import { LANGS } from '../i18n/languages'
import { useT } from '../i18n/I18n'
import { ACCENTS, applyAppearance, loadAppearance, saveAppearance, type Accent, type Appearance, type FontScale, type ThemeMode } from '../../app/appearance'
import { track } from '../platform/analytics'
import { prefersReducedMotion } from '../platform/motion'

export function SettingsPanel({ onClose: close }: { onClose: () => void }) {
  const { t, lang, setLang } = useT()
  const [look, setLook] = useState<Appearance>(loadAppearance)
  const panel = useRef<HTMLDivElement>(null)
  // Al cerrar, el panel sale animado y luego se desmonta (W-74).
  const [closing, setClosing] = useState(false)
  const onClose = useCallback(() => {
    setClosing(true)
    setTimeout(close, prefersReducedMotion() ? 0 : 200)
  }, [close])

  // Esc cierra; el foco entra al panel y vuelve a donde estaba al cerrar.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [onClose])

  const update = (patch: Partial<Appearance>) => {
    const next = { ...look, ...patch }
    setLook(next)
    applyAppearance(next)
    saveAppearance(next)
    const [setting, value] = Object.entries(patch)[0]
    track('settings_changed', { setting, value: String(value) })
  }

  return (
    <div className={'settings-backdrop' + (closing ? ' is-closing' : '')}>
      {/* Tocar fuera del panel lo cierra (botón nativo, fuera del orden de tabulación: Esc y "Cerrar" ya existen). */}
      <button type="button" className="settings-scrim" aria-label={t('settings.close')} tabIndex={-1} onClick={onClose} />
      <div ref={panel} className="settings-panel stack" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="settings-title">{t('settings.title')}</h2>
          <button type="button" className="icon-btn" aria-label={t('settings.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <section>
          <h3>{t('settings.language')}</h3>
          <div className="lang-grid" role="radiogroup" aria-label={t('settings.language')}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={lang === l.code}
                className="lang-tile"
                lang={l.code}
                onClick={() => {
                  void setLang(l.code)
                  track('settings_changed', { setting: 'language', value: l.code })
                }}
              >
                <span className="lang-flag" aria-hidden="true">{l.flag}</span>
                <span>
                  <b>{l.name}</b>
                  <small>{l.region}</small>
                </span>
              </button>
            ))}
          </div>
          <small className="faint" style={{ display: 'block', marginTop: 8 }}>{t('settings.languageHint')}</small>
        </section>

        <section>
          <h3>{t('settings.theme')}</h3>
          <Segmented<ThemeMode>
            label={t('settings.theme')}
            value={look.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: 'system', label: t('settings.theme.system') },
              { value: 'light', label: t('settings.theme.light') },
              { value: 'dark', label: t('settings.theme.dark') },
            ]}
          />
        </section>

        <section>
          <h3>{t('settings.accent')}</h3>
          <div className="accent-row" role="radiogroup" aria-label={t('settings.accent')}>
            {(Object.keys(ACCENTS) as Accent[]).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={look.accent === id}
                aria-label={t(`accent.${id}`)}
                title={t(`accent.${id}`)}
                className="accent-swatch"
                style={{ background: ACCENTS[id].swatch }}
                onClick={() => update({ accent: id })}
              >
                {look.accent === id && <Icon name="check" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t('settings.font')}</h3>
          <Segmented<FontScale>
            label={t('settings.font')}
            value={look.font}
            onChange={(font) => update({ font })}
            options={[
              { value: 'normal', label: t('settings.font.normal') },
              { value: 'large', label: t('settings.font.large') },
              { value: 'xlarge', label: t('settings.font.xlarge') },
            ]}
          />
        </section>

        <small className="faint">{t('settings.saved')}</small>
        <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
          {t('settings.close')}
        </button>
      </div>
    </div>
  )
}
