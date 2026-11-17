# DocuSmart Web — guía para Claude

Landing, app web y páginas para buscadores de DocuSmart, publicadas en https://docusmart.online
(Firebase Hosting). Complemento de la app Android (repo hermano `../docsmart`). Vite + React 19 +
TypeScript estricto, Vitest. **Todo se procesa en el navegador: nunca subir archivos del usuario a
un servidor** (es la promesa de privacidad publicada).

## Comandos

```bash
npm run dev            # servidor de desarrollo (genera páginas y copia wasm antes)
npm run build          # tsc + build de producción en dist/ (borra dist/ completo)
npm run preview        # sirve dist/ con las mismas cabeceras (CSP) que producción
npm test               # pruebas unitarias (tests/**/*.test.ts)
npm run test:coverage  # con cobertura (lcov para SonarCloud)
npm run pages          # regenera site/ (páginas por idioma), index de herramientas y sitemap
npm run pages:check    # el CI falla si las páginas generadas no están al día
```

Antes de pedir revisión: `npx tsc -b --noEmit`, `npx vitest run`, `npm run build`, `npm run pages:check`.

## Estructura (detalle en README.md)

- `site/` — HTML (raíz de Vite). `index.html`, `app/index.html` y `privacidad.html` se editan a mano;
  el resto (31 herramientas × 12 idiomas y `/<idioma>/index.html`) lo genera
  `scripts/generate-tool-pages.mjs`: **no editarlos a mano**.
- `src/entries/` — entradas: `app.tsx` (/app/), `landing.ts` (portada), `tool-page.tsx` (páginas de herramienta).
- `src/app/` — armazón de la app: `App.tsx`, `state.ts` (contexto y `go()` de navegación por hash), `appearance.ts`.
- `src/features/<dominio>/{ui,core,infra}` — dominios: pdf, security (qpdf: comprimir/proteger/desbloquear/reparar),
  pdfa, ocr, convert, image, scan, archive (7-Zip wasm), qr, study, viewer, home.
  `ui` = pantallas React; `core` = lógica pura y testeable; `infra` = canvas, wasm, pdf.js.
- `src/shared/` — `ui/` componentes, `i18n/`, `files/`, `cloud/` (Drive/Dropbox), `pdf/` (pdf.js), `platform/` (analítica, consentimiento, Trusted Types).
- `tests/unit/` — refleja la ruta de `src/` (p. ej. `tests/unit/features/pdf/core/pdfCrop.test.ts`).
- `tools/` — datos SEO: `pages.mjs` (español) y `locales/<idioma>.mjs`. `scripts/` — automatización. `public/` — estáticos.
- `docs/BACKLOG.md` (tareas W-xx, mantenerlo al día en cada PR) y `docs/PENDIENTES.md` (lo que solo puede hacer el usuario).

Dependencias: `ui → core/infra`; `core` no usa React ni el DOM; `shared` no importa de `features`.

## Convenciones

- **Idiomas (12: es, en, pt, de, ru, ja, ko, zh, it, fr, ca, eu).** Nunca texto fijo en español en la UI:
  `useT()` en componentes, `tr()` fuera de React (errores de `core`, nombres de archivo). Claves en
  `src/shared/i18n/messages/es.ts` (fuente del tipo `MessageKey`) y las 11 traducciones con **todas** las claves.
  No usar la palabra "password" en nombres de clave (SonarCloud S2068 da falso positivo).
  Los errores que ve el usuario se reconocen por clase o `name` del error, nunca por el texto.
- **Páginas SEO:** cada idioma de `tools/locales/` debe traducir los mismos pares de portada que `en.mjs`
  (el generador lo valida). Para textos iguales en ambos idiomas, repetirlos tal cual (sin espacios extra).
- **Seguridad:** CSP estricta + Trusted Types: nada de `innerHTML`, scripts externos ni `data:` para fuentes.
  Recursos pesados (wasm, modelos OCR, pdf.js) se sirven desde `public/` (los copia `scripts/copy-wasm-assets.mjs`).
- **Fuentes estándar de PDF (pdf-lib):** solo alfabeto latino (WinAnsi); textos que se dibujan en PDF deben serlo.
- **Cobertura:** SonarCloud exige ≥ 80 % en código nuevo de `core/` y `shared/`; `ui/`, `infra/` y `entries/`
  están excluidos y se validan en el navegador.
- Comentarios y mensajes de commit en español.

## Flujo de trabajo

- Responder siempre en español al usuario.
- Nunca commit/merge/push a `main` sin aprobación explícita para ese lote: rama + PR y preguntar "¿Fusiono…?".
- Revisión de punta a punta en el navegador antes de pedir la fusión: `preview_start` con
  `docusmart-web-prod` (puerto 5491, sirve `dist/`). Los PDF de prueba van en `dist/prueba*` y se borran al terminar
  (`npm run build` también los borra). No usar archivos reales del usuario.
- Con el panel del navegador oculto las capturas salen en blanco: verificar con `read_page`/`javascript_tool`.
- Al cambiar de idioma en pruebas, devolver `localStorage['ds-lang']` a `'es'`.

## Trampas conocidas

- `FileList` es viva: copiar con `Array.from` antes de vaciar el input si hay un `await` en medio.
- pdf-lib incrusta fuentes de forma diferida: llamar `doc.flush()` tras `updateFieldAppearances`.
- En desarrollo, `vite.config.ts` reescribe `../src/entries/…` a `/@fs/…` (plugin `serve-src-in-dev`);
  sin eso la entrada se ejecuta dos veces y React monta dos raíces.
- En Windows los emojis de bandera se ven como letras (normal).
- El CI a veces falla con "Unable to resolve @typescript/typescript-linux-x64": `gh run rerun <id> --failed`.
