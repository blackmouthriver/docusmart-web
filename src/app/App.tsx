import { Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './components/Icon'
import { trackScreen } from '../shared/analytics'
import { AppContext, parseHash, type Route } from './state'
import { Home } from './screens/Home'
// Cada pantalla se descarga al entrar: pdf.js y las librerías de QR no frenan el Inicio.
const Viewer = lazy(() => import('./screens/Viewer').then((m) => ({ default: m.Viewer })))
const Converter = lazy(() => import('./screens/Converter').then((m) => ({ default: m.Converter })))
const PdfTools = lazy(() => import('./screens/PdfTools').then((m) => ({ default: m.PdfTools })))
const QrScreen = lazy(() => import('./screens/Qr').then((m) => ({ default: m.QrScreen })))
const Study = lazy(() => import('./screens/Study').then((m) => ({ default: m.Study })))

const NAV: Array<{ section: string; label: string; short: string; icon: IconName }> = [
  { section: '', label: 'Inicio', short: 'Inicio', icon: 'home' },
  { section: 'convertir', label: 'Convertir', short: 'Convertir', icon: 'convert' },
  { section: 'pdf', label: 'Herramientas PDF', short: 'PDF', icon: 'pdf' },
  { section: 'qr', label: 'Códigos QR', short: 'QR', icon: 'qr' },
  { section: 'estudio', label: 'Modo Estudio', short: 'Estudio', icon: 'study' },
]

const SCREEN_NAMES: Record<string, string> = {
  '': 'Home',
  ver: 'Viewer',
  convertir: 'Converter',
  pdf: 'PdfTools',
  qr: 'Qr',
  estudio: 'Study',
}

export function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [openFile, setOpenFile] = useState<File | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([])

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
    document.title = (NAV.find((n) => n.section === route.section)?.label ?? 'Visor') + ' · DocuSmart Web'
    if (route.section === '') document.title = 'DocuSmart Web'
  }, [route.section, route.sub])

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
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
      screen = <QrScreen />
      break
    case 'estudio':
      screen = <Study />
      break
    default:
      screen = <Home />
  }

  return (
    <AppContext.Provider value={{ openFile, setOpenFile, toast }}>
      <div className="shell">
        <aside className="sidebar">
          <a className="side-brand" href="/">
            <img src="/img/icon.svg" alt="" />
            DocuSmart <small>Web</small>
          </a>
          <nav className="side-nav" aria-label="Secciones">
            {NAV.map((n) => (
              <a key={n.section} className="nav-item" href={'#/' + n.section} aria-current={active === n.section ? 'page' : undefined}>
                <Icon name={n.icon} />
                {n.label}
              </a>
            ))}
          </nav>
          <div className="side-foot">
            <div className="privacy-note">
              <Icon name="shield" />
              <span>Tus archivos se procesan en este navegador. No se suben a ningún servidor.</span>
            </div>
            <a href="/">¿Más funciones? Descarga la app →</a>
          </div>
        </aside>

        <main className="main">
          <div className="content">
            <div className="screen" key={route.section + (route.sub ?? '')}>
              <Suspense fallback={<div className="faint" style={{ padding: 24 }}>Cargando…</div>}>{screen}</Suspense>
            </div>
          </div>
        </main>

        <nav className="bottom-nav" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.section} href={'#/' + n.section} aria-current={active === n.section ? 'page' : undefined}>
              <span className="bn-pill">
                <Icon name={n.icon} />
              </span>
              {n.short}
            </a>
          ))}
        </nav>

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
