import '../shared/platform/trustedTypes'
import { captureInstallPrompt, handleLaunches, registerServiceWorker } from '../shared/platform/pwa'
import { setOpenedFiles } from '../shared/files/handoff'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../app/App'
import { I18nProvider, initialLanguage } from '../shared/i18n/I18n'
import { loadMessages } from '../shared/i18n/translate'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import { initAnalytics } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import '../shared/platform/fonts'
import { quietPageTransitions } from '../shared/platform/motion'
import '../shared/ui/motion.css'
import '../app/app.css'

// Lo primero al arrancar: el aviso de instalación del navegador puede llegar antes de que la
// interfaz se monte; si nadie lo escucha, el botón "Instalar" no aparece (W-16).
captureInstallPrompt()
// Una sola ventana de DocuSmart Desktop: si ya está abierta se enfoca (y los accesos directos llevan a su herramienta).
// Los archivos abiertos con DocuSmart Desktop (W-150.4) van a la pantalla "Abrir con".
handleLaunches(window, (files) => {
  setOpenedFiles(files)
  if (location.hash !== '#/abrir') location.hash = '#/abrir'
})

// Apariencia e idioma antes de pintar: sin destellos de otro tema u otro idioma.
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
const lang = initialLanguage()
document.documentElement.lang = lang

// Después de fijar el idioma: el banner de analítica lo toma de <html lang>.
initAnalytics()
mountConsentBanner()
quietPageTransitions()

void loadMessages(lang).then((dict) =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider initialLang={lang} initialDict={dict}>
        <App />
      </I18nProvider>
    </StrictMode>,
  ),
)

// App instalable y sin conexión (W-16).
registerServiceWorker()
