// Ayuda de DocuSmart Desktop (W-16): cómo instalar la web como programa según el navegador, y en
// la versión instalada, cómo crear el ícono del escritorio, anclarla, usarla sin conexión y cómo se
// actualiza. Mismo diálogo que Ajustes (hoja abajo en el celular, ventana en la computadora).
import { Icon, type IconName } from './Icon'
import { useDialog } from './useDialog'
import { useT } from '../i18n/I18n'
import type { MessageKey } from '../i18n/messages/es'
import { desktopBrowser, desktopGuideMode, isStandalone, type DesktopBrowser } from '../platform/pwa'
import { PLAY_URL } from '../files/share'

type Tip = { icon: IconName; title: MessageKey; text: MessageKey }

const INSTALL_STEP: Record<DesktopBrowser, MessageKey> = { edge: 'desk.step.edge', chrome: 'desk.step.chrome', safari: 'desk.step.safari', firefox: 'desk.step.other', other: 'desk.step.other' }
const SHORTCUT_STEP: Record<DesktopBrowser, MessageKey> = { edge: 'desk.shortcut.edge', chrome: 'desk.shortcut.chrome', safari: 'desk.shortcut.other', firefox: 'desk.shortcut.other', other: 'desk.shortcut.other' }
const OFFLINE: Tip = { icon: 'wifi', title: 'desk.offline.title', text: 'desk.offline.text' }
const INTRO = { install: 'desk.intro.install', installed: 'desk.intro.installed', mobile: 'desk.mobile' } as const

/** Consejos de cada caso: en el navegador, cómo instalarla; ya instalada, sus atajos. */
function tipsFor(mode: 'install' | 'installed' | 'mobile', browser: DesktopBrowser): Tip[] {
  if (mode === 'install') return [{ icon: 'info', title: 'desk.howTo', text: INSTALL_STEP[browser] }, OFFLINE]
  if (mode === 'installed')
    return [
      { icon: 'star', title: 'desk.shortcut.title', text: SHORTCUT_STEP[browser] },
      { icon: 'link', title: 'desk.pin.title', text: 'desk.pin.text' },
      OFFLINE,
      { icon: 'reset', title: 'desk.update.title', text: 'desk.update.text' },
    ]
  return []
}

export function DesktopHelp({ onClose: close, canInstall, onInstall }: { onClose: () => void; canInstall: boolean; onInstall: () => void }) {
  const { t } = useT()
  const { panel, closing, onClose } = useDialog(close)
  const ua = navigator.userAgent
  const mode = desktopGuideMode(ua, isStandalone(window))
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
            <p>{t(INTRO[mode])}</p>
          </div>
          <button type="button" className="icon-btn" aria-label={t('settings.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {mode === 'install' && canInstall && (
          <button type="button" className="btn btn-primary desk-install" onClick={install}>
            <Icon name="download" />
            {t('desk.installNow')}
          </button>
        )}
        {mode === 'mobile' && (
          <a className="btn btn-primary desk-install" href={PLAY_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="download" />
            Google Play
          </a>
        )}

        {tipsFor(mode, desktopBrowser(ua)).map((tip) => (
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
      </div>
    </div>
  )
}
