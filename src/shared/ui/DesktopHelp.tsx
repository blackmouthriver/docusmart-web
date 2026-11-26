// Ayuda de DocuSmart Desktop (W-16): cómo instalar la web como programa según el navegador, y en
// la versión instalada, cómo crear el ícono del escritorio, anclarla, usarla sin conexión y cómo se
// actualiza. Mismo diálogo que Ajustes (hoja abajo en el celular, ventana en la computadora).
// W-150: los pasos cambian según el sistema (Windows, Mac, Linux o Chromebook).
import { Icon, type IconName } from './Icon'
import { useDialog } from './useDialog'
import { useT } from '../i18n/I18n'
import type { MessageKey } from '../i18n/messages/es'
import { currentOS, desktopBrowser, desktopGuideMode, isStandalone, type DesktopBrowser, type DesktopOS } from '../platform/pwa'
import { PLAY_URL } from '../files/share'

type Tip = { icon: IconName; title: MessageKey; text: MessageKey }

/** Cómo instalarla: depende del navegador (y en Firefox, de si es una Mac, donde además sirve Safari). */
export function installStep(browser: DesktopBrowser, os: DesktopOS): MessageKey {
  if (browser === 'edge') return 'desk.step.edge'
  if (browser === 'chrome') return 'desk.step.chrome'
  if (browser === 'safari') return 'desk.step.safari'
  if (browser === 'firefox') return os === 'mac' ? 'desk.step.firefoxMac' : 'desk.step.firefox'
  return 'desk.step.other'
}

const WHERE: Record<DesktopOS, MessageKey | null> = { windows: 'desk.where.windows', mac: 'desk.where.mac', linux: 'desk.where.linux', chromeos: 'desk.where.chromeos', other: null }
const OFFLINE: Tip = { icon: 'wifi', title: 'desk.offline.title', text: 'desk.offline.text' }
const INTRO = { install: 'desk.intro.install', installed: 'desk.intro.installed', mobile: 'desk.mobile' } as const

/** El ícono a mano: en Windows, el acceso directo del escritorio; en Mac, el Launchpad y el Dock; en Linux, el menú. */
function shortcutStep(browser: DesktopBrowser, os: DesktopOS): MessageKey {
  if (os === 'mac') return browser === 'safari' ? 'desk.shortcut.safari' : 'desk.shortcut.mac'
  if (os === 'linux') return 'desk.shortcut.linux'
  if (browser === 'edge') return 'desk.shortcut.edge'
  if (browser === 'chrome') return 'desk.shortcut.chrome'
  return 'desk.shortcut.other'
}

function pinTip(os: DesktopOS): Tip {
  if (os === 'mac') return { icon: 'link', title: 'desk.pin.titleMac', text: 'desk.pin.mac' }
  if (os === 'linux') return { icon: 'link', title: 'desk.pin.titleLinux', text: 'desk.pin.linux' }
  return { icon: 'link', title: 'desk.pin.title', text: 'desk.pin.text' }
}

/** Consejos de cada caso: en el navegador, cómo instalarla y dónde queda; ya instalada, sus atajos. */
export function tipsFor(mode: 'install' | 'installed' | 'mobile', browser: DesktopBrowser, os: DesktopOS): Tip[] {
  const installable = browser !== 'firefox' && browser !== 'other'
  if (mode === 'install') {
    const where = WHERE[os]
    return [{ icon: 'info', title: 'desk.howTo', text: installStep(browser, os) }, ...(where && installable ? [{ icon: 'grid' as IconName, title: 'desk.where.title' as MessageKey, text: where }] : []), OFFLINE]
  }
  if (mode === 'installed')
    return [
      { icon: 'star', title: 'desk.shortcut.title', text: shortcutStep(browser, os) },
      // Chromebook: el estante ya lo explica "Dónde queda"; el ancla de la barra es de Windows, Mac y Linux.
      ...(os === 'chromeos' ? [] : [pinTip(os)]),
      // Abrir archivos con la app instalada solo existe en Chrome y Edge (file_handlers), no en Safari.
      ...(browser === 'chrome' || browser === 'edge' ? [{ icon: 'open' as IconName, title: 'desk.open.title' as MessageKey, text: 'desk.open.text' as MessageKey }] : []),
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

        {tipsFor(mode, desktopBrowser(ua), currentOS()).map((tip) => (
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
