# DocuSmart Web

Landing page y versión web de [DocuSmart](https://play.google.com/store/apps/details?id=com.docsmart), complemento de la app Android (repo `docsmart`).

Todo el procesamiento de documentos ocurre **en el navegador**: los archivos nunca se suben a un servidor, igual que en la app.

| Ruta | Qué es |
|---|---|
| `/` | Landing (`index.html` + `src/landing/`) |
| `/app/` | DocuSmart Web (`app/index.html` + `src/app/`, React) |
| `/privacidad.html` | Política de privacidad (copia de `docsmart/legal/privacy-policy.html`) |

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 (landing) y http://localhost:5173/app/ (app web).

Otros comandos:

```bash
npm run build     # verifica tipos y genera dist/ listo para publicar
npm run preview   # sirve dist/ para probar el build final
npm test          # pruebas (compatibilidad del QR protegido con la app)
```

## Funciones de la app web

- **Visor:** PDF (pdf.js), imágenes y texto.
- **Convertidor:** Imagen → PDF/JPG/PNG/WebP/BMP, PDF → Imagen, PDF → TXT.
- **Herramientas PDF:** unir, dividir, rotar, reordenar/eliminar páginas, numerar, marca de agua (pdf-lib).
- **QR:** crear, leer con cámara o desde imagen, y QR protegido con contraseña **compatible con la app** (mismo formato que `QrCrypto.kt`: `PROTECTED:` + Base64(salt 16 + IV 12 + AES-256-GCM), PBKDF2-SHA256 100 000 iteraciones). La prueba `qrCrypto.test.ts` descifra un payload generado con la misma lógica JVM de la app.
- **Modo Estudio:** lectura en voz alta (Web Speech), notas (guardadas solo en el navegador) y Pomodoro.

Quedan solo en la app: escáner con detección de bordes, carpeta segura, Word/Excel/PowerPoint, OCR, PDF → Word, compresión y contraseña de PDF.

## Analítica (Firebase)

Usa el mismo proyecto Firebase de la app (`docusmart-8904e`), así ves web y Android en el mismo panel (filtra por el parámetro `platform = web`).

1. En [Firebase Console](https://console.firebase.google.com/project/docusmart-8904e/settings/general) → **Tus apps → Agregar app → Web**. Activa Google Analytics para esa app.
2. Copia `.env.example` como `.env.local` y completa `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID` y `VITE_FIREBASE_MEASUREMENT_ID`.
3. Reinicia `npm run dev`.

Sin esos valores el sitio funciona igual y no carga nada de Google.

Cómo funciona (`src/shared/analytics.ts`):

- Firebase se descarga **solo** si hay configuración **y** el visitante pulsa *Aceptar* en el banner de consentimiento (`src/shared/consent.ts`). *Rechazar* tiene el mismo peso visual.
- IP anonimizada, sin Google Signals ni personalización de anuncios.
- Nunca se envían nombres de archivo ni contenido, solo tipos y conteos.
- Eventos con los mismos nombres que `DocuSmartAnalytics.kt`: `screen_view`, `document_opened`, `conversion_started` / `conversion_success` / `conversion_error` (con los mismos `conversion_type` de `ConversionType`), `pdf_tool_used`, `qr_created`, `qr_scanned`, `study_session_started`, `note_created`, `pomodoro_completed`, `app_error`.
- Solo de la landing: `landing_cta_click` (destino `play_store` o `web_app`), `landing_section_view`, `landing_faq_open`.

> La política de privacidad debe mencionar la analítica del sitio web antes de activarla en producción.

## Seguridad, SonarCloud y despliegue

Publicado en **https://docusmart.online** con Firebase Hosting. Cabeceras de seguridad, análisis en SonarCloud, CI y los pasos para conectar el dominio de Hostinger: ver [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
