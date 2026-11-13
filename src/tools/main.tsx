import '../shared/trustedTypes'
// Monta la herramienta de una página propia (/unir-pdf, /imagen-a-pdf…) dentro
// de #tool. El texto de la página ya viene en el HTML generado; aquí solo se
// agrega la parte interactiva, reutilizando los componentes de la app web.
import { StrictMode, lazy, Suspense, useCallback, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppContext } from '../app/state'
import { initAnalytics, track, trackScreen } from '../shared/analytics'
import { mountConsentBanner } from '../shared/consent'
import '../shared/fonts'
import '../app/app.css'
import './tools.css'

const MergeTool = lazy(() => import('../app/screens/PdfTools').then((m) => ({ default: m.MergeTool })))
const SingleFileTool = lazy(() => import('../app/screens/PdfTools').then((m) => ({ default: m.SingleFileTool })))
const ConvertTool = lazy(() =>
  import('../app/screens/Converter').then((m) => ({
    default: ({ id }: { id: string }) => {
      const conv = m.findConversion(id)
      return conv ? <m.ConvertJob conv={conv} embedded /> : null
    },
  })),
)
const QrTools = lazy(() =>
  import('../app/screens/Qr').then((m) => ({
    default: () => (
      <div className="two-col">
        <m.CreateQr />
        <m.ReadQr />
      </div>
    ),
  })),
)

function ToolHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([])
  const nextId = useRef(0)
  const toast = useCallback((msg: string) => {
    const id = ++nextId.current
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  // El visor no existe en estas páginas: abrir un archivo lleva a la app web.
  const setOpenFile = useCallback(() => {
    location.href = '/app/#/ver'
  }, [])
  return (
    <AppContext.Provider value={{ openFile: null, setOpenFile, toast }}>
      <Suspense fallback={<p className="faint">Cargando herramienta…</p>}>{children}</Suspense>
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

function toolFor(kind: string | undefined, id: string | undefined): ReactNode {
  if (kind === 'pdf' && id === 'unir') return <MergeTool />
  if (kind === 'pdf' && id) return <SingleFileTool toolId={id} />
  if (kind === 'conv' && id) return <ConvertTool id={id} />
  if (kind === 'qr') return <QrTools />
  return null
}

initAnalytics()
mountConsentBanner()

const host = document.getElementById('tool')
if (host) {
  const { kind, id, slug } = host.dataset
  trackScreen(`Tool/${slug ?? kind}`)
  createRoot(host).render(
    <StrictMode>
      <ToolHost>{toolFor(kind, id)}</ToolHost>
    </StrictMode>,
  )
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-track]')
  if (a) track('landing_cta_click', { cta: a.dataset.track ?? '', destination: 'play_store' })
})
