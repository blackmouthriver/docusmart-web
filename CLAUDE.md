# DocuSmart Web — memoria del proyecto para Claude

Landing, app web y páginas para buscadores de DocuSmart, publicadas en **https://docusmart.online**.
Vite + React 19 + TypeScript estricto, Vitest. **Todo se procesa en el navegador: nunca subir archivos
del usuario a un servidor** (es la promesa de privacidad publicada).

La app Android (repo hermano `../docsmart`, `com.docsmart`, en producción en Google Play) sirve solo de
**referencia** (paridad de funciones, formato del QR protegido, nombres de eventos de analítica):
**no se modifica desde este proyecto.**

Actualizado: 2026-11-17.

## Comandos

```bash
npm run dev            # servidor de desarrollo (genera páginas y copia wasm antes)
npm run build          # tsc + build de producción en dist/ (borra dist/ completo)
npm run preview        # sirve dist/ con las mismas cabeceras (CSP) que producción
npm test               # pruebas unitarias (tests/**/*.test.ts)
npm run test:coverage  # con cobertura (lcov para SonarCloud)
npm run pages          # regenera site/ (páginas por idioma), lista de herramientas y sitemap
npm run pages:check    # el CI falla si las páginas generadas no están al día
```

Antes de pedir revisión: `npx tsc -b --noEmit`, `npx vitest run`, `npm run build`, `npm run pages:check`.

## Estructura (detalle en README.md)

- `site/` — HTML (raíz de Vite). `index.html`, `app/index.html` y `privacidad.html` se editan a mano;
  el resto (31 herramientas × 12 idiomas, `/herramientas` × 12 y `/<idioma>/index.html`) lo genera
  `scripts/generate-tool-pages.mjs`: **no editarlos a mano**. Cada herramienta tiene `category` en
  `tools/pages.mjs` (categorías en `CATEGORIES`, nombres en `ui.cats` de cada idioma); la portada muestra el
  resumen por categoría y `/herramientas` (`/en/tools`…) las lista en orden alfabético del idioma, con buscador.
  En la app, `src/features/tools/core/catalog.ts` tiene las 39 herramientas con las mismas categorías (una prueba
  verifica que coincidan con el sitio); la pantalla es `#/herramientas` y el inicio muestra los accesos por categoría.
- `src/entries/` — entradas: `app.tsx` (/app/), `landing.ts` (portada), `tool-page.tsx` (páginas de herramienta),
  `tools-hub.ts` (/herramientas).
- `src/app/` — armazón de la app: `App.tsx`, `state.ts` (contexto y `go()` de navegación por hash), `appearance.ts`.
- `src/features/<dominio>/{ui,core,infra}` — dominios: pdf, security (qpdf: comprimir/proteger/desbloquear/reparar),
  pdfa, ocr, convert, image, scan, archive (7-Zip wasm), qr, study, viewer, home.
  `ui` = pantallas React; `core` = lógica pura y testeable; `infra` = canvas, wasm, pdf.js.
- `src/shared/` — `ui/` componentes, `i18n/`, `files/`, `cloud/` (Drive/Dropbox), `pdf/` (pdf.js), `platform/` (analítica, consentimiento, Trusted Types).
- `tests/unit/` — refleja la ruta de `src/` (p. ej. `tests/unit/features/pdf/core/pdfCrop.test.ts`).
- `tools/` — datos SEO: `pages.mjs` (español) y `locales/<idioma>.mjs`. `scripts/` — automatización. `public/` — estáticos.
- `docs/BACKLOG.md` (tareas W-xx: **actualizar su estado en cada PR**), `docs/PENDIENTES.md` (lo que solo
  puede hacer el usuario) y `docs/DESPLIEGUE.md` (hosting, dominio, cabeceras, CI).

Dependencias: `ui → core/infra`; `core` no usa React ni el DOM; `shared` no importa de `features`.

## Qué está construido

- **Visor** (PDF, imágenes, texto) y **vista previa antes/después** en todas las herramientas, con
  Descargar, Compartir (Web Share) y la sección "recomienda la app".
- **Herramientas PDF:** unir, dividir, rotar, reordenar, numerar, marca de agua, recortar, firmar, censurar,
  comparar, extraer imágenes, editar, llenar formulario, escáner (foto → PDF), OCR (Tesseract, es/en),
  comprimir, proteger (AES-256), desbloquear, reparar (qpdf wasm) y PDF/A-2b (validado con veraPDF).
- **Convertidor:** imagen ↔ PDF/JPG/PNG/WebP/BMP, PDF → TXT/Word/Excel, Word/Excel → PDF.
- **Imagen:** comprimir, redimensionar, recortar, rotar. **Archivos:** crear ZIP/7Z, abrir ZIP/RAR/7Z/TAR/GZ.
- **QR** (crear, leer, protegido con contraseña compatible con la app) y **Modo Estudio** (lectura en voz alta, notas, Pomodoro).
- **12 idiomas** (es, en, pt, de, ru, ja, ko, zh, it, fr, ca, eu) en la app, las páginas, los errores y los
  textos/nombres de los archivos generados. **Apariencia:** tema, 10 colores de acento y tamaño de letra.
- **SEO:** portada + 31 herramientas en cada idioma (`/en/merge-pdf`…), `hreflang`, sitemap con 386 URL,
  selector de idioma sin JavaScript.
- Los enlaces de **recomendar** (`toolShareUrl`) llevan a la página de la herramienta en el idioma del
  usuario; el generador escribe `src/shared/files/toolPageSlugs.json` (no editar a mano).
- Guardar en **Google Drive** y **Dropbox**: código listo y oculto hasta que el usuario cree las credenciales
  (IDs públicos en `src/shared/cloud/cloudConfig.ts`).

Historia reciente (todo fusionado salvo lo indicado): vista previa y guardado #34–#38; idiomas y apariencia
#39–#42; páginas por idioma #43–#46; textos dentro de archivos #47; arquitectura por capas y este archivo #48;
enlaces de compartir por idioma (W-57) #49;
Facebook e Instagram #51–#52; correo de contacto #53.

## Contacto y redes

- Correo de contacto: **supportdocusmart@docusmart.online** (buzón de Hostinger). Está en el pie de la portada,
  `site/privacidad.html`, `public/.well-known/security.txt` y `FEEDBACK_EMAIL` (`src/shared/files/share.ts`).
- Facebook: https://www.facebook.com/profile.php?id=61596626852763
- Instagram: https://www.instagram.com/supportdocusmart/
- TikTok: https://www.tiktok.com/@docusmartsupport
- Las URL de redes están en `FACEBOOK_URL`/`INSTAGRAM_URL`/`TIKTOK_URL` de `tools/pages.mjs` (pie y `sameAs` de las páginas
  generadas) y de `src/shared/files/share.ts` (pie de la app); la portada las tiene escritas en `site/index.html`.
  Al cambiar una, actualizar los tres lugares y correr `npm run pages`.
- El botón **Recomendar → Facebook** es para compartir (sharer.php), no el enlace al perfil.
- La app Android sigue con su propio correo en su política; no se modifica desde aquí.

## Infraestructura

- **Firebase Hosting** (`firebase.json`, `cleanUrls`, cabeceras: CSP estricta + Trusted Types, HSTS preload,
  COOP same-origin). Dominio de Hostinger. Despliegue automático al fusionar en `main`.
- **CI** (`.github/workflows/ci.yml`): auditoría npm, `pages:check`, pruebas con cobertura, build, SonarCloud;
  además CodeQL y escaneo de secretos. `main` protegida (PR + checks).
- **SonarCloud:** ≥ 80 % de cobertura en código nuevo de `core/` y `shared/`; `ui/`, `infra/` y `entries/`
  excluidos (se validan en el navegador). **Analítica:** Firebase/GA4 solo con consentimiento.

## Convenciones

- **Idiomas.** Nunca texto fijo en español en la UI: `useT()` en componentes, `tr()` fuera de React
  (errores de `core`, nombres de archivo). Claves en `src/shared/i18n/messages/es.ts` (fuente del tipo
  `MessageKey`) y las 11 traducciones con **todas** las claves. No usar la palabra "password" en nombres de
  clave (SonarCloud S2068 da falso positivo). Los errores que ve el usuario se reconocen por clase o `name`,
  nunca por el texto.
- **Páginas SEO:** cada idioma de `tools/locales/` traduce los mismos pares de portada que `en.mjs` (el
  generador lo valida). Si un texto es igual en ambos idiomas, repetirlo tal cual, sin espacios extra.
- **Seguridad:** nada de `innerHTML`, scripts externos ni `data:` para fuentes. La CSP no permite estilos en línea
  (`style-src 'self'`): ni `<style>` ni `style="…"` en el HTML; los estilos van en archivos `.css` (en React,
  `style={{…}}` sí funciona porque se aplica por CSSOM). Recursos pesados (wasm,
  modelos OCR, pdf.js) desde `public/` (los copia `scripts/copy-wasm-assets.mjs`).
- **Fuentes estándar de PDF (pdf-lib):** solo alfabeto latino (WinAnsi); lo que se dibuja en un PDF debe serlo.
- **Movimiento (W-72):** usar `src/shared/ui/motion.css` (tokens `--ease-out`, `--dur-*`; clases `.reveal`
  con `data-stagger` en el padre, `.ds-press`, `.ds-lift`; transición entre páginas) y
  `src/shared/platform/motion.ts` (`initMotion`, `withViewTransition`, `scrollBehavior`). Solo `transform` y
  `opacity`, y siempre respetando "reducir movimiento". Las reglas comunes van en `:where()` para que cada
  página pueda ajustarlas sin pelear especificidad.
- **Modo oscuro de la portada:** tokens oscuros en el `<style>` de `site/index.html`, con
  `@media (prefers-color-scheme: dark)` para "Sistema" (sin JS, sin parpadeo) y `[data-theme="dark"]` para la
  elección guardada, que aplica `applyTheme` en `landing.ts` (solo tema: el acento no cambia la portada).
- Comentarios, documentación y mensajes de commit en español.

## Flujo de trabajo

- Responder siempre en español al usuario.
- Nunca commit/merge/push a `main` sin aprobación explícita para ese lote: rama + PR y preguntar "¿Fusiono…?".
- Revisión de punta a punta en el navegador antes de pedir la fusión: `preview_start` con
  `docusmart-web-prod` (puerto 5491, sirve `dist/`). Los PDF de prueba van en `dist/prueba*` y se borran al
  terminar (`npm run build` también los borra). No usar archivos reales del usuario.
- Con el panel del navegador oculto las capturas salen en blanco: verificar con `read_page`/`javascript_tool`.
  Además, Chromium salta las transiciones entre páginas y deja "Transition was aborted… Page already revealed"
  en consola: es por el panel oculto, no un error de la web.
- Al cambiar de idioma en pruebas, devolver `localStorage['ds-lang']` a `'es'`.
- Nunca pedir ni mostrar tokens o secretos (están en los secretos de GitHub).

## Pendientes

- **Del usuario** (`docs/PENDIENTES.md`): ID de cliente OAuth de Google (W-45), app key de Dropbox (W-46),
  decidir enlace/QR para compartir (W-47), Search Console, restricción de la API key, Hostinger, Play Console.
- **Mantenimiento:** HSTS preload (dic-2026), certificados de Firebase (ene-2027), `security.txt` (antes del 2027-10-16).

## Trampas conocidas

- `FileList` es viva: copiar con `Array.from` antes de vaciar el input si hay un `await` en medio.
- pdf-lib incrusta fuentes de forma diferida: llamar `doc.flush()` tras `updateFieldAppearances`.
- En desarrollo, `vite.config.ts` reescribe `../src/entries/…` a `/@fs/…` (plugin `serve-src-in-dev`);
  sin eso la entrada se ejecuta dos veces y React monta dos raíces.
- En Windows los emojis de bandera se ven como letras (normal).
- El CI a veces falla con "Unable to resolve @typescript/typescript-linux-x64": `gh run rerun <id> --failed`.
