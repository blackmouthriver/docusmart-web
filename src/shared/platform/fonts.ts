// Fuentes alojadas en el propio sitio (sin Google Fonts): nada sale del
// navegador antes del consentimiento y la CSP no necesita orígenes externos.
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/plus-jakarta-sans/index.css'
// Reservas con las mismas medidas, para que el texto no salte al cargar las fuentes (CLS).
import './fontFallbacks.css'
