// Ajustes de DocuSmart Web, como en la app: idioma, tema, color de acento y tamaño de letra.
import { useState } from 'react'
import { Icon } from './Icon'
import { Segmented } from './ui'
import { useDialog } from './useDialog'
import { LANGS } from '../i18n/languages'
import { useT } from '../i18n/I18n'
import { GRADIENT_ACCENTS, SIDEBAR_STYLES, SOLID_ACCENTS, accentSwatch, applyAppearance, systemDark, loadAppearance, saveAppearance, type Appearance, type FontScale, type SidebarStyle, type ThemeMode } from '../../app/appearance'
import { track } from '../platform/analytics'

export function SettingsPanel({ onClose: close }: { onClose: () => void }) {
  const { t, lang, setLang } = useT()
  const [look, setLook] = useState<Appearance>(loadAppearance)
  // Sale animado al cerrar (W-74); Esc cierra y el foco entra a la opción marcada.
  const { panel, closing, onClose } = useDialog(close, '[aria-checked="true"]')

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
          {/* "Sistema" copia el modo del sistema operativo: decir cuál es evita que parezca igual a Claro u Oscuro sin razón. */}
          {look.theme === 'system' && (
            <small className="faint" style={{ display: 'block', marginTop: 8 }} data-testid="theme-system-hint">
              {t(systemDark() ? 'settings.theme.systemDark' : 'settings.theme.systemLight')}
            </small>
          )}
        </section>

        <section>
          <h3>{t('settings.accent')}</h3>
          {/* Colores de un tono y, debajo, los degradados de dos colores; un solo grupo de opciones. */}
          <div className="stack" style={{ gap: 10 }} role="radiogroup" aria-label={t('settings.accent')}>
            {[SOLID_ACCENTS, GRADIENT_ACCENTS].map((group, gi) => (
              <div key={gi} className="stack" style={{ gap: 6 }}>
                {gi === 1 && <h4 className="settings-sub">{t('settings.gradients')}</h4>}
                <div className="accent-row">
                  {group.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={look.accent === id}
                      aria-label={t(`accent.${id}`)}
                      title={t(`accent.${id}`)}
                      className="accent-swatch"
                      style={{ background: accentSwatch(id) }}
                      onClick={() => update({ accent: id })}
                    >
                      {look.accent === id && <Icon name="check" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>{t('settings.sidebar')}</h3>
          <Segmented<SidebarStyle>
            label={t('settings.sidebar')}
            value={look.sidebar}
            onChange={(sidebar) => update({ sidebar })}
            options={SIDEBAR_STYLES.map((value) => ({ value, label: t(`settings.sidebar.${value}`) }))}
          />
        </section>

        <section>
          <label className="switch-row">
            <span>
              <b>{t('settings.animatedBg')}</b>
              <small>{t('settings.animatedBg.sub')}</small>
            </span>
            <input type="checkbox" role="switch" className="switch" checked={look.animatedBg} onChange={(e) => update({ animatedBg: e.target.checked })} />
          </label>
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
