// Ayuda de DocuSmart Desktop (W-16): cómo instalar la web como programa según el navegador, y en
// la versión instalada, cómo crear el ícono del escritorio, anclarla, usarla sin conexión y cómo se
// actualiza. Mismo diálogo que Ajustes (hoja abajo en el celular, ventana en la computadora).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'
import { useT } from '../i18n/I18n'
import type { MessageKey } from '../i18n/messages/es'
import { desktopBrowser, desktopGuideMode, isStandalone } from '../platform/pwa'
import { prefersReducedMotion } from '../platform/motion'
import { PLAY_URL } from '../files/share'

type Tip = { icon: IconName; title: MessageKey; text: MessageKey }

export function DesktopHelp({ onClose: close, canInstall, onInstall }: { onClose: () => void; canInstall: boolean; onInstall: () => void }) {
  const { t } = useT()
  const panel = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const onClose = useCallback(() => {
    setClosing(true)
    setTimeout(close, prefersReducedMotion() ? 0 : 200)
  }, [close])

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [onClose])

  const ua = navigator.userAgent
  const mode = desktopGuideMode(ua, isStandalone(window))
  const browser = desktopBrowser(ua)
  const installStep: MessageKey = browser === 'edge' ? 'desk.step.edge' : browser === 'chrome' ? 'desk.step.chrome' : browser === 'safari' ? 'desk.step.safari' : 'desk.step.other'
  const shortcutStep: MessageKey = browser === 'edge' ? 'desk.shortcut.edge' : browser === 'chrome' ? 'desk.shortcut.chrome' : 'desk.shortcut.other'
  const installedTips: Tip[] = [
    { icon: 'star', title: 'desk.shortcut.title', text: shortcutStep },
    { icon: 'link', title: 'desk.pin.title', text: 'desk.pin.text' },
    { icon: 'wifi', title: 'desk.offline.title', text: 'desk.offline.text' },
    { icon: 'reset', title: 'desk.update.title', text: 'desk.update.text' },
  ]
  const install = () => {
    onInstall()
    onClose()
  }

  return (
    <div className={'settings-backdrop' + (closing ? ' is-closing' : '')}>
      <button type="button" className="settings-scrim" aria-label={t('settings.close')} tabIndex={-1} onClick={onClose} />
      <div ref={panel} className="settings-panel desk-help stack" role="dialog" aria-modal="true" aria-labelledby="desk-title">
        <div className="desk-head">
          <span className="desk-badge" aria-hidden="true">
            <img src="/img/icon.svg" alt="" width="40" height="40" />
          </span>
          <div>
            <h2 id="desk-title">DocuSmart Desktop</h2>
            <p>{t(mode === 'installed' ? 'desk.intro.installed' : mode === 'mobile' ? 'desk.mobile' : 'desk.intro.install')}</p>
          </div>
          <button type="button" className="icon-btn" aria-label={t('settings.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {mode === 'install' && (
          <>
            {canInstall && (
              <button type="button" className="btn btn-primary desk-install" onClick={install}>
                <Icon name="download" />
                {t('desk.installNow')}
              </button>
            )}
            <section className="desk-tip">
              <span className="desk-ico">
                <Icon name="info" />
              </span>
              <div>
                <h3>{t('desk.howTo')}</h3>
                <p>{t(installStep)}</p>
              </div>
            </section>
            <section className="desk-tip">
              <span className="desk-ico">
                <Icon name="wifi" />
              </span>
              <div>
                <h3>{t('desk.offline.title')}</h3>
                <p>{t('desk.offline.text')}</p>
              </div>
            </section>
          </>
        )}

        {mode === 'installed' &&
          installedTips.map((tip) => (
            <section key={tip.title} className="desk-tip">
              <span className="desk-ico">
                <Icon name={tip.icon} />
              </span>
              <div>
                <h3>{t(tip.title)}</h3>
                <p>{t(tip.text)}</p>
              </div>
            </section>
          ))}

        {mode === 'mobile' && (
          <a className="btn btn-primary desk-install" href={PLAY_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="download" />
            Google Play
          </a>
        )}
      </div>
    </div>
  )
}
