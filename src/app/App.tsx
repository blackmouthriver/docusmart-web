import { Fragment, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../shared/ui/Icon'
import { analyticsConfigured, trackScreen } from '../shared/platform/analytics'
import { AppContext, parseHash, type Route } from './state'
import { useT } from '../shared/i18n/I18n'
import { LANGS } from '../shared/i18n/languages'
import type { MessageKey } from '../shared/i18n/messages/es'
import { SettingsPanel } from '../shared/ui/SettingsPanel'
import { Home } from '../features/home/ui/Home'
// Cada pantalla se descarga al entrar: pdf.js y las librerías de QR no frenan el Inicio.
const Viewer = lazy(() => import('../features/viewer/ui/Viewer').then((m) => ({ default: m.Viewer })))
const Converter = lazy(() => import('../features/convert/ui/Converter').then((m) => ({ default: m.Converter })))
const PdfTools = lazy(() => import('../features/pdf/ui/PdfTools').then((m) => ({ default: m.PdfTools })))
const QrScreen = lazy(() => import('../features/qr/ui/Qr').then((m) => ({ default: m.QrScreen })))
const Study = lazy(() => import('../features/study/ui/Study').then((m) => ({ default: m.Study })))
const ArchiveScreen = lazy(() => import('../features/archive/ui/Archive').then((m) => ({ default: m.ArchiveScreen })))
const ImageToolsScreen = lazy(() => import('../features/image/ui/ImageTools').then((m) => ({ default: m.ImageToolsScreen })))

// `mobile: false`: solo en la barra lateral; la barra inferior del celular tiene 5 lugares.
type NavSub = { sub: string; label: MessageKey; icon: IconName }
// Modo Estudio se despliega en la barra lateral con sus vistas.
const STUDY_SUBS: NavSub[] = [
  { sub: 'lectura', label: 'study.readAloud', icon: 'volume' },
  { sub: 'notas', label: 'study.notes', icon: 'note' },
  { sub: 'pomodoro', label: 'study.pomodoro', icon: 'timer' },
  { sub: 'estadisticas', label: 'study.stats', icon: 'chart' },
]
// Códigos QR también se despliega con sus vistas (W-82).
const QR_SUBS: NavSub[] = [
  { sub: 'crear', label: 'qr.create', icon: 'qr' },
  { sub: 'leer', label: 'qr.read', icon: 'camera' },
  { sub: 'historial', label: 'qr.history', icon: 'folder' },
]
const NAV: Array<{ section: string; label: MessageKey; short: MessageKey; icon: IconName; mobile?: boolean; subs?: NavSub[] }> = [
  { section: '', label: 'nav.home', short: 'nav.short.home', icon: 'home' },
  { section: 'convertir', label: 'nav.convert', short: 'nav.short.convert', icon: 'convert' },
  { section: 'pdf', label: 'nav.pdf', short: 'nav.short.pdf', icon: 'pdf' },
  { section: 'qr', label: 'nav.qr', short: 'nav.short.qr', icon: 'qr', subs: QR_SUBS },
  { section: 'estudio', label: 'nav.study', short: 'nav.short.study', icon: 'study', subs: STUDY_SUBS },
  { section: 'imagen', label: 'nav.image', short: 'nav.image', icon: 'image', mobile: false },
  { section: 'archivos', label: 'nav.archive', short: 'nav.archive', icon: 'archive', mobile: false },
]

const SCREEN_NAMES: Record<string, string> = {
  '': 'Home',
  ver: 'Viewer',
  convertir: 'Converter',
  pdf: 'PdfTools',
  qr: 'Qr',
  estudio: 'Study',
  archivos: 'Archive',
  imagen: 'ImageTools',
}

export function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [openFile, setOpenFile] = useState<File | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const { t, lang } = useT()
  const current = LANGS.find((l) => l.code === lang)!

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const name = SCREEN_NAMES[route.section] ?? 'Home'
    trackScreen(route.sub ? `${name}/${route.sub}` : name)
    const nav = NAV.find((n) => n.section === route.section)
    document.title = route.section === '' ? 'DocuSmart Web' : `${t(nav?.label ?? 'nav.viewer')} · DocuSmart Web`
  }, [route.section, route.sub, t])

  const nextToastId = useRef(0)
  const toast = useCallback((msg: string) => {
    const id = ++nextToastId.current
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const active = route.section === 'ver' ? '' : route.section
  let screen: ReactNode
  switch (route.section) {
    case 'ver':
      screen = <Viewer />
      break
    case 'convertir':
      screen = <Converter sub={route.sub} />
      break
    case 'pdf':
      screen = <PdfTools sub={route.sub} />
      break
    case 'qr':
      screen = <QrScreen sub={route.sub} />
      break
    case 'archivos':
      screen = <ArchiveScreen sub={route.sub} />
      break
    case 'imagen':
      screen = <ImageToolsScreen sub={route.sub} />
      break
    case 'estudio':
      screen = <Study sub={route.sub} />
      break
    default:
      screen = <Home />
  }

  return (
    <AppContext.Provider value={{ openFile, setOpenFile, toast, openSettings }}>
      <div className="shell">
        <aside className="sidebar">
          <a className="side-brand" href="/">
            <img src="/img/icon.svg" alt="" />
            DocuSmart <small>Web</small>
          </a>
          <nav className="side-nav" aria-label={t('nav.sections')}>
            {NAV.map((n) => (
              <Fragment key={n.section}>
                <a className="nav-item" href={'#/' + n.section} aria-current={active === n.section && !(n.subs && route.sub) ? 'page' : undefined} aria-expanded={n.subs ? active === n.section : undefined}>
                  <Icon name={n.icon} />
                  {t(n.label)}
                  {n.subs && <span className="nav-caret" aria-hidden="true"><Icon name="back" /></span>}
                </a>
                {n.subs && active === n.section && (
                  <div className="nav-subs">
                    {n.subs.map((s) => (
                      <a key={s.sub} className="nav-item nav-sub" href={`#/${n.section}/${s.sub}`} aria-current={route.sub === s.sub ? 'page' : undefined}>
                        <Icon name={s.icon} />
                        {t(s.label)}
                      </a>
                    ))}
                  </div>
                )}
              </Fragment>
            ))}
          </nav>
          <div className="side-foot">
            <button type="button" className="side-settings" onClick={openSettings}>
              <Icon name="settings" />
              <span>{t('settings.open')}</span>
              <span aria-hidden="true">{current.flag} {lang.toUpperCase()}</span>
            </button>
            <div className="privacy-note">
              <Icon name="shield" />
              <span>{t('side.privacy')}</span>
            </div>
            <a href="/">{t('side.getApp')}</a>
            {analyticsConfigured && (
              <button type="button" className="link-btn" data-consent-open>
                {t('side.analytics')}
              </button>
            )}
          </div>
        </aside>

        <main className="main">
          <div className="content">
            <div className="screen" key={route.section === 'estudio' ? route.section : route.section + (route.sub ?? '')}>
              <Suspense fallback={<div className="faint" style={{ padding: 24 }}>{t('common.loading')}</div>}>{screen}</Suspense>
            </div>
          </div>
        </main>

        <nav className="bottom-nav" aria-label={t('nav.sections')}>
          {NAV.filter((n) => n.mobile !== false).map((n) => (
            <a key={n.section} href={'#/' + n.section} aria-current={active === n.section ? 'page' : undefined}>
              <span className="bn-pill">
                <Icon name={n.icon} />
              </span>
              {t(n.short)}
            </a>
          ))}
        </nav>

        {settingsOpen && <SettingsPanel onClose={closeSettings} />}

        <div className="toast-wrap" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </AppContext.Provider>
  )
}
