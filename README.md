# DocuSmart Web

Landing page y versión web de [DocuSmart](https://play.google.com/store/apps/details?id=com.docsmart), complemento de la app Android (repo `docsmart`).

Todo el procesamiento de documentos ocurre **en el navegador**: los archivos nunca se suben a un servidor, igual que en la app.

| Ruta | Qué es |
|---|---|
| `/` y `/en/`, `/pt/`… | Landing (`site/index.html` + `src/entries/landing.ts`); las traducciones se generan |
| `/app/` | DocuSmart Web (`site/app/index.html` + `src/entries/app.tsx`, React) |
| `/unir-pdf`, `/en/merge-pdf`… | Página de cada herramienta para buscadores (generada en `site/`, monta `src/entries/tool-page.tsx`) |
| `/privacidad` | Política de privacidad (`site/privacidad.html`, copia de `docsmart/legal/privacy-policy.html`) |

## Estructura del proyecto

```
site/              Páginas HTML (raíz de Vite): portada, app, privacidad y las 372
                   páginas generadas por idioma. No editar las generadas a mano.
src/
├─ entries/        Puntos de entrada de cada tipo de página (app, landing, tool-page)
├─ app/            Armazón de la app web: App.tsx, navegación (state.ts), apariencia
├─ features/       Un dominio por carpeta, cada uno con sus capas:
│  └─ <dominio>/   pdf · security · pdfa · ocr · convert · image · scan · archive · qr · study · viewer · home
│     ├─ ui/       Pantallas React del dominio
│     ├─ core/     Lógica pura y testeable (pdf-lib, algoritmos, formatos)
│     └─ infra/    Adaptadores del navegador: canvas, wasm, pdf.js
└─ shared/         Lo común a varios dominios
   ├─ ui/          Componentes (ui.tsx, Icon, DocPreview, SettingsPanel)
   ├─ i18n/        Idiomas, traducción y messages/<idioma>.ts
   ├─ files/       Archivos y compartir · cloud/ Drive y Dropbox · pdf/ lectura con pdf.js
   └─ platform/    Analítica, consentimiento, Trusted Types, fuentes, idioma elegido
tests/unit/        Pruebas unitarias; reflejan la ruta de src/ (tests/unit/features/pdf/core/…)
tools/             Datos de las páginas para buscadores: pages.mjs (español) y locales/<idioma>.mjs
scripts/           Automatización: generar páginas, copiar wasm, medir fuentes estándar
public/            Archivos estáticos (wasm, modelos OCR, pdf.js, sitemap.xml)
docs/              Backlog, pendientes del usuario y despliegue
```

Regla de dependencias: `ui` usa `core` e `infra`; `core` no conoce React ni el DOM; `shared` no importa de `features`.

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
- **QR:** crear, leer con cámara o desde imagen, y QR protegido con contraseña **compatible con la app** (mismo formato que `QrCrypto.kt`: `PROTECTED:` + Base64(salt 16 + IV 12 + AES-256-GCM), PBKDF2-SHA256 100 000 iteraciones). La prueba `tests/unit/features/qr/core/qrCrypto.test.ts` descifra un payload generado con la misma lógica JVM de la app.
- **Modo Estudio:** lectura en voz alta (Web Speech), notas (guardadas solo en el navegador) y Pomodoro.

Quedan solo en la app: escáner con detección de bordes, carpeta segura, Word/Excel/PowerPoint, OCR, PDF → Word, compresión y contraseña de PDF.

## Analítica (Firebase)

Usa el mismo proyecto Firebase de la app (`docusmart-8904e`), así ves web y Android en el mismo panel (filtra por el parámetro `platform = web`).

1. En [Firebase Console](https://console.firebase.google.com/project/docusmart-8904e/settings/general) → **Tus apps → Agregar app → Web**. Activa Google Analytics para esa app.
2. Copia `.env.example` como `.env.local` y completa `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID` y `VITE_FIREBASE_MEASUREMENT_ID`.
3. Reinicia `npm run dev`.

Sin esos valores el sitio funciona igual y no carga nada de Google.

Cómo funciona (`src/shared/platform/analytics.ts`):

- Firebase se descarga **solo** si hay configuración **y** el visitante pulsa *Aceptar* en el banner de consentimiento (`src/shared/platform/consent.ts`). *Rechazar* tiene el mismo peso visual.
- IP anonimizada, sin Google Signals ni personalización de anuncios.
- Nunca se envían nombres de archivo ni contenido, solo tipos y conteos.
- Eventos con los mismos nombres que `DocuSmartAnalytics.kt`: `screen_view`, `document_opened`, `conversion_started` / `conversion_success` / `conversion_error` (con los mismos `conversion_type` de `ConversionType`), `pdf_tool_used`, `image_tool_used` y `scan_saved` (solo web: herramientas de imagen y escáner), `qr_created`, `qr_scanned`, `study_session_started`, `note_created`, `pomodoro_completed`, `app_error`.
- Solo de la landing: `landing_cta_click` (destino `play_store` o `web_app`), `landing_section_view`, `landing_faq_open`.

La política de privacidad ([`/privacidad`](site/privacidad.html), sección 10) describe esta analítica y las cookies que usa.

## Licencias de terceros

Todo se procesa en el navegador con librerías de código abierto, servidas desde el propio dominio:
- [pdf.js](https://github.com/mozilla/pdf.js) (Apache-2.0) para ver y dibujar PDF.
- [pdf-lib](https://github.com/Hopding/pdf-lib) (MIT) para crear y editar PDF.
- [qpdf](https://github.com/qpdf/qpdf) (Apache-2.0), compilado a wasm por [@neslinesli93/qpdf-wasm](https://github.com/neslinesli93/qpdf-wasm) (ISC), para comprimir, proteger y desbloquear PDF. Su licencia se publica en `/qpdf/LICENSE.txt`.
- [7-Zip](https://www.7-zip.org) (GNU LGPL + restricción unRAR), compilado a wasm por [7z-wasm](https://github.com/use-strict/7z-wasm), para crear ZIP/7Z y extraer ZIP, RAR, 7Z, TAR y GZ. Se distribuye sin modificar; su licencia se publica en `/7z/License.txt`. La restricción unRAR prohíbe usar ese código para crear archivos RAR: la web solo los abre.
- [Tesseract](https://github.com/tesseract-ocr/tesseract) (Apache-2.0), compilado a wasm por [tesseract.js-core](https://github.com/naptha/tesseract.js-core) y usado con [tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0), para el OCR. Los modelos de español e inglés vienen de [tessdata](https://github.com/tesseract-ocr/tessdata) (Apache-2.0). Sus licencias se publican en `/ocr/LICENSE-tesseract.js.txt` y `/ocr/LICENSE-tesseract-core.txt`.
- [Dancing Script](https://github.com/googlefonts/DancingScript) (SIL Open Font License 1.1), vía [Fontsource](https://fontsource.org), para la firma escrita de "Firmar PDF".

## Backlog

Lo hecho, lo pendiente y su prioridad: [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Seguridad, SonarCloud y despliegue

Publicado en **https://docusmart.online** con Firebase Hosting. Cabeceras de seguridad, análisis en SonarCloud, CI y los pasos para conectar el dominio de Hostinger: ver [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
