# Auditoría W-146.1 · Organizar PDF

Fecha: 2026-11-22. Herramientas: **Unir PDFs, Dividir PDF, Rotar páginas, Reordenar páginas, Numerar páginas**.
Código: `src/features/pdf/core/pdfTools.ts` (pdf-lib) y `src/features/pdf/ui/PdfTools.tsx`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

| Caso | Resultado | Gravedad |
|---|---|---|
| Numerar una página **girada 90°** | El número sale **de lado, en el borde izquierdo** (se dibuja sin tener en cuenta la rotación de la página) | 🔴 Falla |
| Numerar una página con **área visible recortada** (CropBox) | El número queda **fuera de lo visible** (usa el tamaño completo de la hoja, no el área recortada) | 🔴 Falla |
| Unir un PDF con **campos de formulario** | Los campos **se pierden** (0 de 1) | 🟠 Pérdida de datos |
| Unir: **marcadores** (índice lateral) y **título** | Se pierden los dos | 🟠 Pérdida de datos |
| PDF **con contraseña** en cualquiera de las 5 | Mensaje claro: "Este PDF tiene contraseña. Quítala primero con Desbloquear PDF" | ✅ Bien |
| Rendimiento: unir 2 × 400 páginas / dividir 400 en archivos / numerar 400 | ≈1,0 s / ≈0,6 s / ≈0,8 s | ✅ Bien |
| Dividir con rangos "5, 1-3" | Se extrae **ordenado y sin repetir** (1, 2, 3, 5): no respeta el orden escrito | 🟡 Limitación |
| Miniaturas de un PDF largo | Se dibujan **todas** las páginas al abrir (≈220 px cada una); con cientos de páginas tarda y ocupa memoria | 🟡 Riesgo |
| Privacidad | Todo ocurre en el navegador, sin subir el archivo | ✅ Ventaja |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene.

| Función | DocuSmart | iLovePDF | Smallpdf | PDF24 | Sejda | Adobe en línea |
|---|---|---|---|---|---|---|
| **Unir:** ordenar archivos | ➖ flechas | ✅ arrastrar | ✅ arrastrar | ✅ arrastrar | ✅ arrastrar | ✅ arrastrar |
| Unir: elegir páginas de cada archivo | ❌ | ➖ | ➖ | ✅ | ✅ | ✅ |
| Unir: conservar marcadores / crear uno por archivo | ❌ | ❌ | ❌ | ➖ | ✅ | ✅ |
| Unir: conservar formularios | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dividir:** varios rangos → varios archivos | ❌ (un solo PDF) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dividir cada N páginas | ❌ | ✅ | ➖ | ✅ | ✅ | ➖ |
| Dividir por marcadores o por tamaño | ❌ | ❌ | ❌ | ➖ | ✅ | ❌ |
| **Rotar:** izquierda y derecha por página | ➖ solo a la derecha | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reordenar:** arrastrar y soltar | ❌ flechas de a una | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reordenar: insertar página en blanco / duplicar | ❌ | ✅ | ➖ | ✅ | ✅ | ✅ |
| **Numerar:** posición (6 lugares) | ➖ 2 (abajo centro/derecha) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Numerar: número inicial y saltar portada | ❌ | ✅ | ➖ | ✅ | ✅ | ✅ |
| Numerar: texto propio ("Página 1 de 10") | ➖ solo "1 / 10" | ✅ | ➖ | ✅ | ✅ | ✅ |
| Numerar: tamaño y color | ❌ | ✅ | ❌ | ✅ | ✅ | ➖ |
| **Límites gratis** | Sin límites | Límite de tamaño y archivos | ≈2 tareas al día (según terceros) | Sin límites | 3 tareas por hora, 50 MB / 50 págs | Requiere cuenta para varias tareas |
| **Privacidad** | 100 % local | Sube al servidor | Sube al servidor | Sube al servidor (tiene versión de escritorio) | Sube al servidor (tiene versión de escritorio) | Sube al servidor |

Fuentes: [Sejda – Unir PDF](https://sejda.com/merge-pdf), [Sejda Desktop](https://www.sejda.com/desktop), [iLovePDF – guía de organizar, dividir y unir](https://www.ilovepdf.com/es/blog/organize-split-merge-pdf-files-ultimate-guide), [PDF24 – Numerar páginas](https://tools.pdf24.org/en/add-page-numbers), [Adobe – Numerar páginas](https://www.adobe.com/acrobat/online/add-pdf-page-numbers.html), [Smallpdf – Gratis vs Pro](https://smallpdf.com/blog/smallpdf-free-vs-pro-plan-comparison). Los límites de Smallpdf no están publicados por la empresa; el dato es de terceros. Las celdas que esas fuentes no cubren (por ejemplo, si cada competidor conserva formularios al unir) salen del conocimiento general de cada herramienta y conviene confirmarlas a mano.

**Dónde ganamos:** privacidad (nada sale del dispositivo), sin límites de uso ni de tamaño, sin cuenta, funciona sin conexión, rápido con documentos grandes.
**Dónde quedamos por debajo:** arrastrar y soltar, dividir en varios archivos, opciones de numeración y conservar formularios y marcadores al unir.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Corregir numerar** en páginas giradas y recortadas | Es una falla: el resultado sale mal | Bajo |
| 2 | **Unir conservando formularios, marcadores y título** (y opción de un marcador por archivo) | Pérdida de datos silenciosa | Medio |
| 3 | **Arrastrar y soltar** en Unir y Reordenar (con teclado accesible), más rotar a la izquierda | Todos los competidores lo tienen; mover la página 80 al inicio hoy son 79 toques | Medio |
| 4 | **Dividir en varios archivos**: varios rangos ("1-3, 4-8") y cada N páginas, en un ZIP | Es el uso más común de Dividir | Bajo |
| 5 | **Numerar con más opciones**: 6 posiciones, número inicial, saltar portada, texto "Página {n} de {total}", tamaño | Paridad con PDF24/iLovePDF | Bajo |
| 6 | Reordenar: **insertar página en blanco y duplicar** | Paridad con iLovePDF/PDF24 | Bajo |
| 7 | Miniaturas **perezosas** (solo las visibles) en PDF largos | Rendimiento en celulares | Medio |
| 8 | Unir: **elegir páginas de cada archivo** | Paridad con Sejda/PDF24 | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 6 (2026-11-22). Las 7 (miniaturas perezosas) y 8 (elegir páginas de cada archivo al unir) quedan para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Numerar en páginas giradas y recortadas | El número se ubica en la página **como se ve** (rotación 0/90/180/270 y área visible): sale derecho, abajo y dentro de lo visible | Unitaria con pdf.js que mide posición y ángulo en las 4 rotaciones y con CropBox |
| 2 | Unir sin perder datos | Conserva **formularios** (renombra campos repetidos: `nombre`, `nombre_2`), **marcadores** apuntando a las páginas nuevas (también destinos con nombre) y el **título**; opción **un marcador por archivo** con los suyos adentro | Unitarias de formularios, grupos de opciones, marcadores y destinos con nombre |
| 3 | Arrastrar y soltar | En **Unir** y **Reordenar**, con mouse, dedo y teclado (flechas en el agarre); la página se desplaza sola cerca del borde. **Rotar** a la izquierda y a la derecha, por página y todas | E2E con arrastre real del puntero y con teclado, escritorio y celular |
| 4 | Dividir en varios archivos | Modos **Por rangos** ("1-3, 6, 4-5" → 3 PDF, en el orden escrito) y **Cada N páginas**, en un ZIP con nombres como `informe-1-3.pdf` | E2E que abre el ZIP y cuenta las páginas de cada PDF |
| 5 | Numerar con más opciones | **6 posiciones**, texto propio con `{n}` y `{total}` ("Página 1 de 10"), **número inicial**, **sin número en las primeras** (portada) y **tamaño**; con alfabetos no latinos usa las fuentes de DocuSmart | Unitarias de las 6 posiciones y del texto; E2E de la portada sin número |
| 6 | Reordenar: duplicar y página en blanco | Cada página se puede **duplicar** o recibir una **página en blanco** después (del tamaño de la vecina) | Unitaria de `composePages`; E2E del resultado de 5 páginas |

**Nueva comparación (filas que cambiaron):** ordenar archivos ✅ arrastrar · conservar formularios ✅ · marcadores ✅ (como Sejda/Adobe) · varios rangos → varios archivos ✅ · cada N páginas ✅ · rotar a izquierda y derecha ✅ · arrastrar y soltar al reordenar ✅ · página en blanco y duplicar ✅ · 6 posiciones, número inicial, saltar portada y texto propio ✅ · tamaño ➖ (3 tamaños, sin color).

**Queda por debajo:** dividir por marcadores o por tamaño (solo Sejda), elegir páginas de cada archivo al unir (#8) y color del número.
