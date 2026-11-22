# Auditoría W-146.5 · Optimizar

Fecha: 2026-11-22. Herramientas: **Comprimir PDF, PDF a PDF/A, Comparar PDF, Extraer imágenes**.
Código: `security/core/pdfSecurity.ts` (sin pérdida, qpdf) y `security/infra/pdfCompress.ts` (fuerte), `pdfa/core/pdfA.ts`, `pdf/core/pdfCompare.ts` y `pdf/core/pdfImages.ts`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

| Caso | Resultado | Gravedad |
|---|---|---|
| Comprimir **sin pérdida** un PDF sin optimizar (30 páginas de texto) | 68,6 KB → 34,6 KB (−50 %) y el texto intacto | ✅ Bien |
| Comprimir sin pérdida un PDF ya optimizado | Lo detecta y no lo empeora ("ya estaba optimizado") | ✅ Bien |
| Comprimir **media o alta** cualquier PDF | **Cada página se vuelve una imagen**: el texto deja de ser seleccionable y buscable, y se pierden enlaces, marcadores y campos de formulario, aunque el PDF sea casi todo texto con unas pocas fotos | 🟠 Limitación seria |
| Comprimir a un **tamaño máximo** (los portales piden "menos de 2 MB") | No existe: hay que probar niveles a mano | 🟡 Limitación |
| PDF/A-2b | Validado con veraPDF; fuentes incrustadas, perfil sRGB, quita JavaScript y adjuntos; convierte en imagen solo las páginas que no se pueden arreglar (CMYK, fuentes faltantes) y lo informa | ✅ Bien |
| Comparar dos documentos de **8000 líneas** con 9 cambios | 27 ms | ✅ Bien |
| Comparar con un **bloque de 100 líneas movido** | Sale como 100 líneas quitadas y 100 agregadas (no se reconoce que solo se movió) | 🟡 Limitación |
| Comparar cuando solo cambiaron **mayúsculas** | "Son documentos muy distintos": no hay opción para ignorar mayúsculas o puntuación | 🟡 Limitación |
| Comparar **imágenes o diseño** | No se detecta (la pantalla lo avisa) | 🟡 Limitación |
| Extraer imágenes: JPEG byte por byte, PNG con transparencia, gris de 1 bit, indexado, CMYK, predictores, máscaras, imágenes repetidas o dañadas | Cubierto por 12 pruebas unitarias existentes | ✅ Bien |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene.

| Función | DocuSmart | iLovePDF | Smallpdf | Adobe en línea | Adobe Acrobat Pro | PDFelement / Wondershare |
|---|---|---|---|---|---|---|
| Comprimir sin pérdida | ✅ | ➖ (Menos) | ➖ | ➖ | ✅ | ➖ |
| Comprimir **conservando el texto** (solo las imágenes) | ❌ (todo se vuelve imagen) | ✅ (Recomendada) | ✅ | ✅ | ✅ | ✅ |
| Compresión extrema | ✅ | ✅ | ✅ (Pro) | ✅ | ✅ | ✅ |
| **Comprimir a un tamaño** (1 MB, 2 MB…) | ❌ | ➖ (guías) | ➖ | ✅ (páginas de 1 y 2 MB) | ➖ | ✅ (tamaño personalizado) |
| **Escala de grises** | ❌ | ❌ | ❌ | ➖ | ✅ | ➖ |
| Varios PDF a la vez | ✅ | ✅ | ➖ (Pro) | ➖ | ✅ | ✅ |
| PDF/A-2b validado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comparar texto con informe | ✅ | ✅ | ➖ | ✅ | ✅ | ✅ |
| Comparar **imágenes y diseño** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Comparar: **ignorar mayúsculas/puntuación** | ❌ | ❌ | ❌ | ❌ | ➖ (solo texto) | ➖ |
| Extraer imágenes en calidad original | ✅ | ✅ | ➖ | ❌ | ✅ | ✅ |
| **Privacidad** | 100 % local | Sube | Sube | Sube | Escritorio | Sube (o escritorio) |
| **Límites gratis** | Ninguno | Por tamaño y tareas | ≈2 tareas al día | Cuenta para varias | Pago | Varía |

Fuentes: [iLovePDF – comprimir a un tamaño](https://www.ilovepdf.com/blog/compress-pdf-to-specific-size) y [reducir el peso](https://www.ilovepdf.com/blog/how-to-reduce-pdf-file-size-online), [Adobe – comprimir a 2 MB](https://www.adobe.com/in/acrobat/online/compress-pdf-2mb.html) y [a 1 MB](https://www.adobe.com/in/acrobat/online/compress-pdf-1mb.html), [Smallpdf – comprimir al tamaño elegido](https://smallpdf.com/blog/compress-pdf-to-chosen-size), [Wondershare – comprimir a 2 MB](https://pdf.wondershare.com/online-pdf/compress-pdf-to-2mb.html), [Adobe – comparar documentos](https://helpx.adobe.com/acrobat/using/compare-documents.html). Las celdas que esas fuentes no cubren salen del conocimiento general de cada herramienta y conviene confirmarlas a mano.

**Dónde ganamos:** compresión sin pérdida real, sin límites, varios archivos a la vez, PDF/A validado, extracción de imágenes muy completa, comparación rápida, todo local.
**Dónde quedamos por debajo:** la compresión fuerte destruye el texto (todos los competidores comprimen solo las imágenes), no hay "a un tamaño" ni escala de grises, y Comparar no ve imágenes ni diseño.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Compresión "Recomendada" que conserva el texto**: recomprimir solo las fotos (bajar su resolución y calidad JPEG), dejando texto, enlaces, marcadores y formularios | Es lo que hacen todos los competidores; hoy el nivel fuerte arruina PDF de texto con fotos | Medio |
| 2 | **Comprimir a un tamaño máximo** (1, 2, 5 MB o el que se escriba), probando de menos a más pérdida hasta que entre | Los portales del Estado y de empleo piden límites de peso | Bajo-medio |
| 3 | **Escala de grises** (opción al comprimir) | Reduce mucho los escaneos en color | Bajo |
| 4 | Comparar: **ignorar mayúsculas y puntuación**, y **marcar bloques movidos** | Evita falsos "muy distintos" y ruido | Bajo-medio |
| 5 | Comparar **visualmente** página por página (resaltar lo que cambió en imágenes y diseño) | Paridad con Adobe e iLovePDF | Medio |
| 6 | PDF/A: elegir **PDF/A-1b o 3b** además de 2b | Algunas entidades piden una versión puntual | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 4 (2026-11-22). Las 5 (comparar visualmente) y 6 (PDF/A-1b y 3b) quedan para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Compresión que conserva el texto | Nuevo nivel **Recomendada** (el de entrada): recomprime solo las fotos (lado mayor de 1600 px, JPEG 75 %) y deja texto, enlaces, marcadores y formularios. No toca máscaras de transparencia, imágenes chicas ni JPEG CMYK, y deja la imagen original si la nueva no pesa menos. Encima se aplica la optimización sin pérdida | Unitarias con un codificador de prueba; E2E con una foto real: el PDF baja más de 40 % y el texto se sigue leyendo |
| 2 | Comprimir a un tamaño máximo | "Tamaño máximo": menos de 0,5, 1, 2, 5 o 10 MB. Prueba sin pérdida → Recomendada → fotos más comprimidas → Media → Alta, y se queda con el primero que entra; si ninguno entra, entrega el más liviano y lo dice | Unitarias y E2E (queda bajo 0,5 MB) |
| 3 | Escala de grises | Opción al comprimir: las fotos (y, en Media y Alta, toda la página) pasan a gris | E2E |
| 4 | Comparar con opciones y bloques movidos | **Ignorar mayúsculas** e **ignorar puntuación** ("1.500.000" = "1500000"), que recalculan al instante sin volver a leer los PDF; un párrafo que solo cambió de lugar se marca **movido** y no cuenta como palabras quitadas y agregadas (también en el informe .txt) | Unitarias y E2E |

**Límite conocido:** un bloque se marca como movido cuando sale y entra "limpio"; si queda pegado a otro cambio, se sigue mostrando como quitado y agregado.

**Nueva comparación (filas que cambiaron):** comprimir conservando el texto ✅ · comprimir a un tamaño ✅ (en el mismo paso, sin probar a mano) · escala de grises ✅ · comparar ignorando mayúsculas/puntuación ✅ (ninguno de los competidores en línea lo ofrece).

**Queda por debajo:** comparar imágenes y diseño (#5) y otras versiones de PDF/A (#6).
