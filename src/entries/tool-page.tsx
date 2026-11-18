import '../shared/platform/trustedTypes'
// Monta la herramienta de una página propia (/unir-pdf, /imagen-a-pdf…) dentro
// de #tool. El texto de la página ya viene en el HTML generado; aquí solo se
// agrega la parte interactiva, reutilizando los componentes de la app web.
import { StrictMode, lazy, Suspense, useCallback, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppContext } from '../app/state'
import { I18nProvider } from '../shared/i18n/I18n'
import { DEFAULT_LANG, isLang } from '../shared/i18n/languages'
import { loadMessages, tr } from '../shared/i18n/translate'
import { initAnalytics, track, trackScreen } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import { rememberLangChoice } from '../shared/platform/langChoice'
import '../shared/platform/fonts'
import '../app/app.css'
import { initMotion } from '../shared/platform/motion'
import { mountAssistantLauncher } from '../features/assistant/ui/launcher'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import '../shared/ui/motion.css'
import './tool-page.css'

const PdfTool = lazy(() =>
  import('../features/pdf/ui/PdfTools').then((m) => ({
    default: ({ id }: { id: string }) => {
      const Own = m.OWN_TOOLS[id]
      return Own ? <Own /> : <m.SingleFileTool toolId={id} />
    },
  })),
)
const ConvertTool = lazy(() =>
  import('../features/convert/ui/Converter').then((m) => ({
    default: ({ id }: { id: string }) => {
      const conv = m.findConversion(id)
      return conv ? <m.ConvertJob conv={conv} embedded /> : null
    },
  })),
)
const ArchiveTool = lazy(() =>
  import('../features/archive/ui/Archive').then((m) => ({
    default: ({ id }: { id?: string }) => (id === 'extraer' ? <m.ExtractArchiveTool /> : <m.CreateArchiveTool />),
  })),
)
const ImageTool = lazy(() =>
  import('../features/image/ui/ImageTools').then((m) => ({
    default: ({ id }: { id: string }) => {
      const Tool = m.IMAGE_TOOLS[id]
      return Tool ? <Tool /> : null
    },
  })),
)
const QrTools = lazy(() =>
  import('../features/qr/ui/Qr').then((m) => ({
    default: () => (
      <div className="two-col">
        <m.CreateQr />
        <m.ReadQr />
      </div>
    ),
  })),
)

/** Esqueleto mientras carga la herramienta: misma forma que la tarjeta, con un brillo que pasa. */
function ToolSkeleton() {
  return (
    <div className="tp-skeleton" role="status" aria-label={tr('common.loading')}>
      <i />
      <i />
      <i />
    </div>
  )
}

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
  // Las páginas para buscadores todavía no tienen su panel de Ajustes (W-55): se abre la app.
  const openAppSettings = () => (location.href = '/app/')
  return (
    <AppContext.Provider value={{ openFile: null, setOpenFile, toast, openSettings: openAppSettings }}>
      <Suspense fallback={<ToolSkeleton />}>{children}</Suspense>
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
  if (kind === 'pdf' && id) return <PdfTool id={id} />
  if (kind === 'conv' && id) return <ConvertTool id={id} />
  if (kind === 'qr') return <QrTools />
  if (kind === 'archive') return <ArchiveTool id={id} />
  if (kind === 'img' && id) return <ImageTool id={id} />
  return null
}

initAnalytics()
mountConsentBanner()
rememberLangChoice()
// Aparición de secciones, pasos escalonados y transición entre páginas (W-72/W-73).
initMotion()
// Tema, acento y tamaño de letra elegidos en Ajustes de la app (también en estas páginas).
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)

// La herramienta habla el idioma de la página (/en/merge-pdf → inglés), no el guardado.
const pageLang = document.documentElement.lang
const lang = isLang(pageLang) ? pageLang : DEFAULT_LANG
const host = document.getElementById('tool')
// Asistente (W-70d) con la herramienta de esta página como contexto (sus preguntas primero).
mountAssistantLauncher({ lang, context: host?.dataset.slug })
if (host) {
  const { kind, id, slug } = host.dataset
  trackScreen(`Tool/${slug ?? kind}`)
  void loadMessages(lang).then((dict) =>
    createRoot(host).render(
      <StrictMode>
        <I18nProvider initialLang={lang} initialDict={dict}>
          <ToolHost>{toolFor(kind, id)}</ToolHost>
        </I18nProvider>
      </StrictMode>,
    ),
  )
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-track]')
  if (a) track('landing_cta_click', { cta: a.dataset.track ?? '', destination: 'play_store' })
})
