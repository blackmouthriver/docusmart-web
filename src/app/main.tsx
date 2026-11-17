import '../shared/trustedTypes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { I18nProvider, initialLanguage } from './i18n/I18n'
import { loadMessages } from './i18n/translate'
import { applyAppearance, loadAppearance, watchSystemTheme } from './appearance'
import { initAnalytics } from '../shared/analytics'
import { mountConsentBanner } from '../shared/consent'
import '../shared/fonts'
import './app.css'

initAnalytics()
mountConsentBanner()

// Apariencia e idioma antes de pintar: sin destellos de otro tema u otro idioma.
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
const lang = initialLanguage()
document.documentElement.lang = lang

void loadMessages(lang).then((dict) =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider initialLang={lang} initialDict={dict}>
        <App />
      </I18nProvider>
    </StrictMode>,
  ),
)
