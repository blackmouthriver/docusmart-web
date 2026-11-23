# Auditoría W-146.6 · Escanear

Fecha: 2026-11-22. Herramientas: **Escanear documento, OCR (PDF buscable), Imagen a texto**.
Código: `src/features/scan/` (detección del papel, perspectiva y filtros sin librerías) y `src/features/ocr/` (Tesseract en el navegador, con los idiomas servidos desde el propio dominio).

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Prueba en el navegador con un PDF de 3 páginas: una con **texto digital**, una **escaneada** y una **escaneada de lado**.

| Caso | Resultado | Gravedad |
|---|---|---|
| Página escaneada derecha | Texto reconocido perfecto ("CONTRATO DE ARRENDAMIENTO / EL CANON MENSUAL…") | ✅ Bien |
| **Tamaño de las páginas** del PDF buscable | Salen de **1869 × 2645 puntos (66 cm de ancho)** en vez de 595 × 842 (A4): los píxeles a 220 ppp se toman como puntos. Al imprimir o unir con otros PDF, la escala queda mal | 🔴 Falla |
| Página que **ya tenía texto digital** | Se vuelve imagen con texto invisible encima: pierde nitidez, el texto real y pesa más (48 KB → 123 KB en total) | 🟠 Falla |
| Página **escaneada de lado** (90°) | Texto basura ("1 m x 9 TU oO…"): no se detecta la orientación | 🟠 Falla |
| Imagen a texto: varias imágenes, pegar con Ctrl+V, editar, .txt y Word | Funciona (prueba E2E existente) | ✅ Bien |
| OCR de PDF: exportar | Solo copiar y .txt (Imagen a texto sí exporta a Word) | 🟡 Limitación |
| Escáner: detectar bordes, enderezar, filtros (documento, B/N, gris), girar, ordenar, quitar, PDF buscable | Funciona (pruebas unitarias del núcleo y E2E) | ✅ Bien |
| Escáner: **tamaño de las páginas** | Ancho A4 y alto según la foto: cada página puede quedar de un alto distinto y no hay Carta | 🟡 Limitación |
| Privacidad | Todo en el navegador; los modelos de idioma se sirven desde docusmart.online | ✅ Ventaja |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | Adobe Scan | CamScanner | PDFgear Scan | Adobe OCR en línea | PDF24 OCR | Smallpdf OCR |
|---|---|---|---|---|---|---|---|
| Detectar bordes y enderezar | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Filtros de documento | ✅ | ✅ | ✅ | ✅ | — | — | — |
| **Tamaño de página** (A4, Carta) | ❌ (ancho A4, alto variable) | ✅ | ✅ | ? | — | — | — |
| Captura automática con la cámara en vivo | ✅ (W-147.1) | ✅ | ✅ | ? | — | — | — |
| PDF buscable | ✅ | ✅ | ✅ (Pro) | ✅ | ✅ | ✅ | ✅ |
| **Páginas que ya tienen texto se respetan** | ❌ | ? | ? | ? | ? | ➖ ("Forzar OCR" opcional) | ? |
| **Girar páginas de lado / enderezar** | ❌ | ✅ | ✅ | ? | ? | ✅ (girar y enderezar) | ? |
| Exportar a Word | ➖ (solo Imagen a texto) | ➖ | ✅ (Pro) | ? | ❌ | ❌ | ✅ |
| Varios idiomas a la vez | ➖ (idioma + inglés) | ✅ | ✅ | ? | ✅ | ✅ | ✅ |
| **Privacidad** | 100 % local | Nube | Nube | Local/Nube | Sube | Sube | Sube |
| **Límites gratis** | Ninguno | Cuenta | Marca de agua en gratis | ? | Cuenta | Ninguno | ≈2 al día |

Microsoft Lens, que era una referencia, dejó de funcionar para escanear en 2025–2026 (según las fuentes, entre diciembre de 2025 y marzo de 2026).

Fuentes: [PDFgear – alternativas a Microsoft Lens](https://www.pdfgear.com/scan-pdf/microsoft-lens-alternatives.htm), [ITmedia – fin de Microsoft Lens](https://www.itmedia.co.jp/business/spv/2510/14/news018_2.html), [Capterra – Lens vs CamScanner](https://www.capterra.com/compare/193405-210426/Microsoft-Office-Lens-vs-CamScanner), [PDF24 – OCR de PDF](https://tools.pdf24.org/en/ocr-pdf), [Adobe – OCR en línea](https://www.adobe.com/acrobat/online/ocr-pdf.html), [Smallpdf – OCR](https://smallpdf.com/pdf-ocr). Las celdas sin fuente salen del conocimiento general de cada herramienta; las marcadas "?" no se pudieron confirmar.

**Dónde ganamos:** privacidad total (también los modelos de OCR), sin límites ni marcas de agua, escáner y OCR en el mismo flujo.
**Dónde quedamos por debajo:** las tres fallas del PDF buscable (tamaño, páginas con texto, orientación), tamaño de página del escáner y exportar a Word desde el OCR de PDF.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **PDF buscable con el tamaño original** de cada página (A4 sigue siendo A4) | Falla: hoy las páginas salen de 66 cm | Bajo |
| 2 | **Respetar las páginas que ya tienen texto** (se copian tal cual; solo se reconoce lo escaneado) con opción "Reconocer todas igual" | Falla: hoy se degradan las páginas digitales | Bajo-medio |
| 3 | **Corregir la orientación**: si una página se reconoce mal, probar girada (90°, 180°, 270°) y quedarse con la mejor; el PDF buscable sale derecho | Falla con escaneos de lado o de cabeza | Medio |
| 4 | Escáner: **tamaño de página** A4, Carta o "como la foto", igual para todas | Paridad con Adobe Scan y CamScanner | Bajo |
| 5 | OCR de PDF: **exportar a Word** (como Imagen a texto) | Paridad y comodidad | Bajo |
| 6 | Escáner: **captura con la cámara en vivo** (detectar el papel antes de tomar la foto) | Paridad con las apps de escaneo | Alto |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 5 (2026-11-22). La 6 (cámara en vivo) queda para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | PDF buscable con el tamaño original | Cada página reconocida se dibuja en una hoja del tamaño de la página de entrada (un PDF) o de ancho A4 y alto en proporción (una imagen), sin deformarse. Antes salía del tamaño de los píxeles (1869 × 2645 pt) | Unitarias; E2E con un PDF A4 + Carta + A4: salen 595 × 842, 612 × 792 y 842 × 595 |
| 2 | Respetar las páginas que ya tienen texto | Una página con 25 letras o más de texto no se reconoce: se copia tal cual del original (texto, enlaces y calidad intactos) y su texto se usa directo. Aviso "N páginas ya tenían texto". Opción **Reconocer también las páginas que ya tienen texto**. La confianza promedio cuenta solo las páginas reconocidas. Modo Estudio también aprovecha esto (no reconoce lo que ya tiene texto) | Unitarias; E2E: la página digital conserva su texto exacto y con la opción se vuelve a reconocer |
| 3 | Corregir la orientación | Si una página con texto sale con confianza menor a 60, se prueba girada 90°, 270° y 180° y se usa la mejor (se detiene al pasar 75). La página girada 90° o 270° queda derecha en el PDF (ancho y alto intercambiados). Aviso "N páginas venían giradas". También aplica al PDF buscable del escáner | Unitarias con un reconocedor de prueba; E2E con una página escaneada de lado: se lee "RECIBO" y la página sale horizontal |
| 4 | Tamaño de página del escáner | **A4**, **Carta** o **Como la foto** (por defecto A4 o Carta según el idioma del navegador, como en Hoja de vida). La foto se centra sin deformarse; si es horizontal, la hoja también. Vale también para el PDF buscable | Unitarias; E2E con las tres opciones |
| 5 | OCR de PDF a Word | Botón **Word** junto a .txt: un párrafo por bloque, como en Imagen a texto | E2E: el .docx trae el texto de las páginas digitales y reconocidas |

**Corrección en el camino:** una página reconocida sin contenido hacía fallar todo el PDF al guardarlo (pdf-lib la incrusta recién al guardar); ahora queda en blanco del tamaño correcto.

**Nueva comparación (filas que cambiaron):** tamaño de página del PDF buscable ✅ · respetar páginas con texto ✅ (como Adobe y PDF24) · orientación automática ✅ · tamaño de página en el escáner ✅ · OCR de PDF a Word ✅.

**Queda por debajo:** captura con la cámara en vivo (#6), hecha después en W-147.1.

## 5. Seguimiento W-147.1 · Cámara en vivo (2026-11-23)

| Mejora | Cómo quedó | Prueba |
|---|---|---|
| Cámara en vivo | **Tomar foto** abre la cámara de atrás dentro de la página (pantalla completa). Cada 120 ms se busca la hoja en un cuadro chico (320 px) con la misma detección del escáner y se marca encima del video (azul buscando, verde quieta) | E2E con una cámara falsa de Chromium (video .y4m de una hoja sobre una mesa oscura) |
| Captura automática | Si la hoja ocupa al menos el 15 % del cuadro y sus esquinas se mueven menos del 2 % durante 8 cuadros (~1 s), se toma la foto en la resolución completa del video. El obturador se llena mientras tanto. Para la siguiente hay que sacar la hoja o moverla (más del 12 %): no se repite la misma página. Se puede apagar ("Captura automática") y usar solo el obturador | Unitarias (`liveCapture.test.ts`); E2E: se toma sola una vez, no se repite con la misma hoja y el obturador toma otra |
| Varias páginas seguidas | Cada foto pasa al editor de esquinas en segundo plano; el botón **Listo (N)** cuenta las páginas y al cerrar se abre la primera sin terminar, con las esquinas ya detectadas | E2E: dos páginas y la esquina detectada a ±3 % de la real |
| Detalles | Linterna si la cámara la tiene, vibración leve al tomar, destello, Esc cierra, se apaga la cámara al salir. Si el navegador no da la cámara (permiso negado o sin `getUserMedia`), aviso y botón **Cámara del sistema** (la foto de antes) | E2E: Esc cierra y la cámara queda apagada |
| Privacidad | El video no sale del equipo: todo el análisis es local (la política de permisos ya permitía `camera=(self)`) | — |

**Nueva comparación:** captura automática con la cámara en vivo ✅, como Adobe Scan y CamScanner. En iOS, la app (W-149.11) usará además el escáner del sistema.

