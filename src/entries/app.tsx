import '../shared/platform/trustedTypes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../app/App'
import { I18nProvider, initialLanguage } from '../shared/i18n/I18n'
import { loadMessages } from '../shared/i18n/translate'
import { applyAppearance, loadAppearance, watchSystemTheme } from '../app/appearance'
import { initAnalytics } from '../shared/platform/analytics'
import { mountConsentBanner } from '../shared/platform/consent'
import '../shared/platform/fonts'
import '../app/app.css'

// Apariencia e idioma antes de pintar: sin destellos de otro tema u otro idioma.
applyAppearance(loadAppearance())
watchSystemTheme(loadAppearance)
const lang = initialLanguage()
document.documentElement.lang = lang

// Después de fijar el idioma: el banner de analítica lo toma de <html lang>.
initAnalytics()
mountConsentBanner()

void loadMessages(lang).then((dict) =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider initialLang={lang} initialDict={dict}>
        <App />
      </I18nProvider>
    </StrictMode>,
  ),
)
