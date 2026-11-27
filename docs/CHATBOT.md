# Asistente de chat de DocuSmart Web: análisis y requisitos

> Estado: **en desarrollo** (opción A, 2026-11-18). Ítems W-70a a W-70g en `docs/BACKLOG.md`.
> Hecho: base de conocimiento (`tools/assistant/`, generada en `public/assistant/<idioma>.json`) y motor
> (`src/features/assistant/core/`): 96 % de aciertos en español, 95 % en inglés y ≥ 94 % en los otros 10 idiomas
> (W-70e: base propia en los 12 idiomas; chino, japonés y coreano se indexan por pares de caracteres).
> W-70f: si el navegador trae su IA integrada ya descargada (Prompt API / Gemini Nano; en, es, ja), redacta la
> respuesta elegida por el motor a partir de su texto, en el dispositivo; con cualquier falla, la respuesta fija.
> Widget en todo el sitio (W-70c/W-70d): `src/features/assistant/ui/launcher.ts` monta el mismo botón en la portada,
> las herramientas, /herramientas, la privacidad y la app; el panel (React) y la base se cargan al abrirlo.
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

## 8. Cómo mejorar la base con el tiempo

La base no aprende sola: se mejora con un ciclo corto que se repite (por ejemplo, una vez al mes). La regla es
que **cada arreglo deja una pregunta de prueba**, así una mejora nunca rompe otra respuesta.

1. **Detectar qué falla, sin leer lo que escriben los usuarios.** Con el consentimiento de analítica, el asistente
   registra solo identificadores (W-70e): `assistant_feedback` con 👍/👎 y el `id` de la respuesta, y
   `assistant_fallback` cuando no supo responder. En GA4 se ve qué respuestas reciben más 👎 y en qué páginas
   aparece más el "no sé".
2. **Conocer las preguntas reales, solo si el usuario quiere.** Cuando no hay respuesta, un botón "Enviar esta
   pregunta" abre un correo a soporte con la pregunta ya escrita (W-70g): el usuario decide si lo envía y nada
   se manda solo.
3. **Arreglar en el lugar correcto:**

   | Qué pasa | Dónde se arregla |
   |---|---|
   | La pregunta se escribe de otra forma ("achicar un PDF") | Agregar esa forma a `q` de la entrada en `tools/assistant/<idioma>.mjs` |
   | Una palabra no se reconoce como otra ("juntar" = unir) | `SYNONYMS` en `src/features/assistant/core/text.ts` |
   | La respuesta es imprecisa o vieja | `a` de la entrada; si es de una herramienta, su FAQ en `tools/pages.mjs` (mejora también la página) |
   | Falta un tema | Entrada nueva con el mismo `id` en todos los idiomas |
   | Responde otra cosa con confianza | Pregunta de prueba que lo detecte y, si hace falta, ajustar sinónimos o palabras vacías |

4. **Probar y publicar:** agregar el caso a `tests/unit/features/assistant/questions.ts`, correr `npm run pages`
   (regenera `public/assistant/*.json`) y `npm test`. El CI exige ≥ 85 % de aciertos y que lo fuera de tema no
   reciba respuesta.
5. **Más adelante (W-70f):** con la IA local del navegador, las respuestas se redactan con más naturalidad, pero
   siempre a partir de esta misma base: mejorarla sigue siendo el camino.

## Medición del asistente (W-151.1)

Línea base contra la que se comparan las capas nuevas (W-151). Sale de `tests/unit/features/assistant/eval`:
preguntas como las escribe la gente (con errores, sin tildes, describiendo el problema en vez de nombrar la
herramienta), en seis categorías. **Acierto** = la primera respuesta es correcta y el motor está seguro;
**sin respuesta** = no está seguro (ofrece sugerencias y «Enviar esta pregunta»); **equivocada** = responde
con seguridad algo que no es. El CI falla si el acierto de un idioma baja de `baseline.json`. Para actualizar
esta tabla y la línea base después de mejorar el asistente:

    UPDATE_ASSISTANT_BASELINE=1 npx vitest run tests/unit/features/assistant/eval

Las preguntas reales que llegan por «Enviar esta pregunta» (W-70g) se suman a `cases.ts` a mano, sin el correo
de quien la mandó (W-151.13).

<!-- medicion:inicio -->

| Idioma | Preguntas | Acierto | Entre las 3 primeras | Sin respuesta | Equivocada |
|---|---:|---:|---:|---:|---:|
| es | 90 | 97.8 % | 100 % | 0 % | 2.2 % |
| en | 66 | 90.9 % | 95.5 % | 4.5 % | 4.5 % |
| pt | 30 | 50 % | 83.3 % | 26.7 % | 23.3 % |
| fr | 30 | 73.3 % | 86.7 % | 13.3 % | 13.3 % |
| it | 30 | 80 % | 86.7 % | 13.3 % | 6.7 % |
| de | 30 | 66.7 % | 83.3 % | 13.3 % | 20 % |
| ca | 30 | 73.3 % | 90 % | 10 % | 16.7 % |
| eu | 30 | 70 % | 83.3 % | 13.3 % | 16.7 % |
| ru | 30 | 50 % | 73.3 % | 20 % | 30 % |
| ja | 30 | 70 % | 83.3 % | 30 % | 0 % |
| ko | 30 | 63.3 % | 86.7 % | 23.3 % | 13.3 % |
| zh | 30 | 53.3 % | 73.3 % | 36.7 % | 10 % |
| control-es | 20 | 75 % | 95 % | 15 % | 10 % |
| control-en | 15 | 73.3 % | 73.3 % | 6.7 % | 20 % |
| **Total** | 456 | **75.2 %** | 88.2 % | 13.8 % | 11 % |

Acierto por categoría (español e inglés):

| Categoría | es | en |
|---|---:|---:|
| Herramientas | 97.5 % | 90 % |
| Trámites | 91.7 % | 87.5 % |
| Errores | 100 % | 71.4 % |
| Herramientas nuevas | 100 % | 100 % |
| Sobre DocuSmart | 100 % | 100 % |
| Fuera de tema | 100 % | 100 % |

<details><summary>Preguntas que hoy fallan (español e inglés)</summary>

**es**

- [herramienta] achicar el tamaño de una foto → tool:comprimir-video
- [tramite] subir la foto al portal de empleo y dice que es muy grande → tool:comprimir-pdf

**en**

- [herramienta] stick two pdfs together → lento (sin confianza)
- [herramienta] make a pdf file smaller → tool:comprimir-video
- [herramienta] change a word in a pdf → tool:comparar-pdf
- [tramite] they want both sides of my id card in a single pdf → tool:foto-tamano-documento (sin confianza)
- [error] the site is very slow → lento (sin confianza)
- [error] the file does not download → renombrar

</details>

<!-- medicion:fin -->
