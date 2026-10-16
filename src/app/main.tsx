import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initAnalytics } from '../shared/analytics'
import { mountConsentBanner } from '../shared/consent'
import '../shared/fonts'
import './app.css'

initAnalytics()
mountConsentBanner()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
