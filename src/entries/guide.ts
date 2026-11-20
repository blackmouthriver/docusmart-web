// Guías (W-19): el texto viene en el HTML (para buscadores); aquí solo lo común
// del sitio: tema, movimiento, aviso de cookies, asistente y modo sin conexión.
import '../shared/platform/trustedTypes'
import { registerServiceWorker } from '../shared/platform/pwa'
import '../shared/platform/fonts'
import '../shared/ui/motion.css'
import '../app/app.css'
import './tool-page.css'
import './guide.css'
import { initAnalytics, trackScreen } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import { initMotion } from '../shared/platform/motion'
import { rememberLangChoice } from '../shared/platform/langChoice'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import { mountAssistantLauncher } from '../features/assistant/ui/launcher'

initAnalytics()
mountConsentBanner()
rememberLangChoice()
initMotion()
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
// Índice (/guias, /en/guides…) o una guía (/guias/<slug>, /en/guides/<slug>…).
trackScreen(/^(\/[a-z]{2})?\/[a-z]+$/.test(location.pathname) ? 'Guides' : 'Guide')
mountAssistantLauncher({ lang: document.documentElement.lang })
registerServiceWorker()
