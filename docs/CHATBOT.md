# Asistente de chat de DocuSmart Web: análisis y requisitos

> Estado: **propuesta** (2026-11-17). Ítems W-70a a W-70f en `docs/BACKLOG.md`.
> Objetivo de costo: **USD 0 al mes** en la primera versión.

## 1. Qué es y para qué

Un botón de chat flotante en **todo el sitio**: portada, páginas de herramientas en los 12 idiomas, app web y
privacidad. Abre un panel donde el visitante pregunta en lenguaje natural ("¿cómo uno dos PDF?", "¿mis
archivos se suben?", "¿la app es gratis?") y recibe:

- una respuesta corta en su idioma;
- un botón para **ir directo a la herramienta** ("Abrir Unir PDF") o a la sección que corresponde;
- sugerencias de preguntas relacionadas.

Si no sabe la respuesta, lo dice y ofrece el contacto humano: correo de soporte, Facebook o Instagram.

**Objetivos:** que el visitante encuentre la herramienta correcta más rápido, responder dudas frecuentes sobre
privacidad, precio y la app Android, y llevar tráfico a la app y a Google Play.

## 2. Decisión de arquitectura

La promesa publicada del sitio es que **todo se procesa en el navegador y nada se sube**. Además, la decisión del
proyecto es preferir la IA en el dispositivo a la IA en la nube, por costo y por privacidad. Con eso en mente:

| Opción | Costo | Privacidad / CSP | Veredicto |
|---|---|---|---|
| **A. Asistente local con base de conocimiento** (búsqueda por palabras clave y similitud dentro del navegador, respuestas redactadas por nosotros) | **USD 0** | Nada sale del navegador; sin scripts externos | ✅ **Fase 1** |
| B. IA del propio navegador (Chrome *Prompt API* con Gemini Nano, en el dispositivo), usada solo si está disponible y siempre apoyada en la base de A | USD 0 | Local; disponibilidad limitada (Chrome de escritorio reciente y con hardware compatible) | 🧪 Fase 2, como mejora opcional |
| C. Modelo dentro del navegador (WebLLM / Transformers.js) | USD 0 | Local, pero descarga de 0,5 a 2 GB y es lento en celulares | ❌ No, por peso |
| D. Widgets de terceros gratis (Tawk.to, Crisp, Tidio) | USD 0 a 29 al mes | Cargan scripts y cookies de terceros: rompen la CSP estricta y Trusted Types, y obligan a cambiar la política de privacidad | ❌ No |
| E. API de IA en la nube (OpenAI, Gemini API, Claude) | Por uso: unos USD 0,15 a 3 por millón de tokens, más un backend (Cloud Functions exige el plan Blaze de Firebase) | El texto del usuario sale a un tercero; contradice la promesa publicada | ❌ No por ahora |

**Recomendación:** la opción A ahora; la B como mejora opcional más adelante; la E solo si el usuario decide cambiar
la política, con su análisis de costos aparte.

## 3. Requisitos funcionales (RF)

| ID | Requisito |
|---|---|
| RF-01 | Botón flotante del asistente en todas las páginas, visible sin tapar contenido ni botones principales (en celular, sobre la barra inferior de la app) |
| RF-02 | Panel de chat con saludo, 3 o 4 preguntas sugeridas según la página (en "Unir PDF": "¿Cuántos PDF puedo unir?") y un campo de texto |
| RF-03 | Responde en el **idioma de la página** (12 idiomas) y entiende preguntas con errores de tipeo, sin tildes o con sinónimos ("juntar" ≈ "unir") |
| RF-04 | Cada respuesta puede traer **acciones**: abrir una herramienta de la app, ir a una página, descargar la app en Google Play, abrir la política de privacidad |
| RF-05 | Cubre: las 31 herramientas (qué hacen, límites, formatos), privacidad y seguridad, precio y planes, la app Android, idiomas y apariencia, problemas comunes ("el PDF tiene contraseña", "el navegador no lee en voz alta") |
| RF-06 | Si no hay una respuesta con buena confianza: lo dice, sugiere preguntas cercanas y ofrece contacto (supportdocusmart@docusmart.online, Facebook, Instagram) |
| RF-07 | La conversación se puede limpiar; el historial vive solo en la pestaña abierta (no se guarda ni se envía) |
| RF-08 | Opinión de cada respuesta (👍/👎) y, con el consentimiento de analítica, se registra **solo el ID de la respuesta**, nunca el texto escrito |
| RF-09 | (Fase 2) Si el navegador tiene IA local disponible, redacta la respuesta en lenguaje natural usando **solo** el contenido de la base; si no, usa la respuesta fija |

## 4. Requisitos no funcionales (RNF)

| ID | Requisito |
|---|---|
| RNF-01 Privacidad | Ningún texto escrito por el usuario sale del navegador. Sin cookies ni almacenamiento persistente del chat. La política de privacidad lo menciona |
| RNF-02 Seguridad | Compatible con la CSP actual y Trusted Types: sin `innerHTML`, sin scripts ni estilos externos, sin `eval`. Las respuestas se pintan como texto y enlaces internos de una lista permitida |
| RNF-03 Rendimiento | El widget se carga **bajo demanda** (al tocar el botón o cuando el navegador está libre) y no afecta el LCP ni el CLS de la página. Peso: ≤ 25 KB gzip el código y ≤ 30 KB gzip la base de cada idioma, que se baja solo la del idioma de la página |
| RNF-04 Velocidad | Respuesta en < 100 ms en un celular de gama media (búsqueda local) |
| RNF-05 Accesibilidad | WCAG 2.2 AA: el panel es un `dialog` con foco atrapado, cierra con Esc, se navega con teclado, los mensajes nuevos se anuncian (`aria-live`), el contraste es suficiente y se respeta `prefers-reduced-motion` |
| RNF-06 Diseño | Mismo sistema visual de la web (tema claro y oscuro, color de acento, tamaño de letra de Ajustes), responsive desde 320 px |
| RNF-07 Sin conexión | Funciona sin internet una vez cargada la página |
| RNF-08 Mantenimiento | La base de conocimiento se genera a partir de lo que ya existe (FAQ y pasos de `tools/pages.mjs` y `tools/locales/*.mjs`, FAQ de la portada) más preguntas propias del asistente; el CI valida que esté completa en los 12 idiomas |
| RNF-09 Calidad | Lógica de búsqueda en `core/` con pruebas unitarias (≥ 80 % de cobertura) y un **conjunto de preguntas de prueba** (≥ 60 por idioma principal) con una tasa de acierto mínima en el CI |

## 5. Criterios de aceptación

1. **Dado** un visitante en `/en/merge-pdf`, **cuando** abre el chat, **entonces** ve el saludo y las sugerencias en inglés relacionadas con unir PDF.
2. **Dado** el chat abierto, **cuando** escribe "como junto 2 pdf", **entonces** recibe la respuesta de unir PDF con el botón "Abrir Unir PDF", y ese botón abre la herramienta en la app.
3. **Dado** que escribe algo fuera de tema ("qué hora es"), **entonces** el asistente dice que no tiene esa respuesta y muestra el contacto y 3 sugerencias.
4. **Dado** cualquier pregunta, **entonces** la pestaña Red del navegador no muestra ninguna petición con el texto escrito.
5. **Dado** el sitio en producción, **entonces** Security Headers sigue en A+ y la consola no muestra errores de CSP ni de Trusted Types.
6. **Dado** un celular de 375 px, **entonces** el botón no tapa la barra inferior ni los botones de descarga, y el panel ocupa la pantalla con un botón de cerrar visible.
7. **Dado** que se usa solo el teclado, **entonces** se puede abrir, escribir, elegir una sugerencia, activar una acción y cerrar con Esc, y el foco vuelve al botón.
8. **Dado** el conjunto de preguntas de prueba, **entonces** ≥ 85 % de las preguntas en español e inglés y ≥ 75 % en los demás idiomas reciben la respuesta esperada.
9. **Dado** que se mide la portada con Lighthouse, **entonces** el puntaje de rendimiento no baja más de 2 puntos respecto de antes del asistente.

## 6. Tecnologías a agregar

| Pieza | Elección | Costo |
|---|---|---|
| Búsqueda | Implementación propia (BM25 + normalización de tildes + sinónimos + distancia de edición para tipeos) en `src/features/assistant/core/`; alternativa: **MiniSearch** (MIT, ~7 KB gzip) | USD 0 |
| Base de conocimiento | JSON por idioma generado por `scripts/` desde `tools/` + `tools/assistant/<idioma>.mjs` (preguntas propias) | USD 0 |
| Interfaz | React (ya está en la app) + una entrada liviana para portada y páginas de herramientas | USD 0 |
| IA local (fase 2) | Chrome **Prompt API** (`LanguageModel`) con detección de disponibilidad; sin ella, la respuesta fija | USD 0 |
| Analítica | Firebase/GA4 que ya existe, con consentimiento: `assistant_opened`, `assistant_answer` (id), `assistant_fallback`, `assistant_feedback` | USD 0 (GA4 gratis) |
| Hosting | Firebase Hosting actual (los JSON son estáticos y pequeños) | USD 0 dentro de la capa gratuita |

**Costo total estimado:** USD 0 al mes en infraestructura. El costo real es el tiempo de desarrollo y de redactar y
traducir la base de conocimiento (unas 120 entradas × 12 idiomas).

## 7. Plan por entregas

| ID | Entrega |
|---|---|
| W-70a | Base de conocimiento: esquema, generador desde `tools/` y preguntas propias en español e inglés; validación en el CI |
| W-70b | Motor de búsqueda local en `core/` con pruebas y el conjunto de preguntas de prueba |
| W-70c | Widget en la app web (`/app/`): botón, panel accesible, sugerencias por pantalla, acciones que abren herramientas |
| W-70d | Widget en la portada y las páginas de herramientas (carga bajo demanda), en los 12 idiomas |
| W-70e | Traducción de la base de conocimiento a los otros 10 idiomas, analítica con consentimiento y párrafo en la política de privacidad |
| W-70f | (Opcional) Respuestas redactadas con la IA local del navegador cuando esté disponible |
