# Auditoría W-146.7 · Convertir

Fecha: 2026-11-22. Herramientas (21): **imagen a PDF, JPG, PNG, WebP, BMP, GIF, AVIF e ICO; HEIC, SVG y TIFF a imagen; PDF a imagen, texto, Word, Excel y PowerPoint; Word, Excel y PowerPoint a PDF; CSV a Excel y Excel a CSV**.
Código: `convert/core/*` (lógica pura: `convert.ts`, `csv.ts`, `docxRead.ts`, `officePdf.ts`, `pdfWord.ts`, `pdfExcel.ts`, `pptx*.ts`, `formats.ts`) y `convert/infra/*` (canvas, códecs, pdf.js).

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Se convirtieron 31 archivos difíciles en la app real (Chrome con Playwright). Los archivos se hicieron con python-docx, openpyxl, reportlab y Pillow, y los resultados se revisaron con pdf.js y Pillow.

| Caso | Resultado | Gravedad |
|---|---|---|
| **CSV guardado por Excel en español** (Windows-1252, el "CSV delimitado por comas" de siempre) a Excel | Los acentos salen rotos: "Jos� P�rez", "Bogot�", "C�digo". Con UTF-8 (con o sin BOM) sale bien | 🔴 Falla |
| CSV con punto y coma, comillas, salto de línea dentro de un campo, "1.234,56", "007" | Bien: separa bien, convierte los números y respeta los ceros a la izquierda. Las fechas quedan como texto | ✅ Bien |
| CSV con coma y formato de EE. UU.; TSV | Bien | ✅ Bien |
| **Word a PDF** de un contrato con encabezado, pie con número de página y nota al pie | **Se pierden el encabezado, el pie, el número de página y la nota al pie** | 🔴 Falla |
| Word a PDF con una sección vertical y otra horizontal | **Todas las páginas salen horizontales**: se usa el tamaño de la última sección para todo el documento | 🟠 Falla |
| Word a PDF: negrita, cursiva, color, acentos, listas numeradas y con viñetas, tabla con celda combinada y sombreado, imagen y salto de página | Bien | ✅ Bien |
| **PDF a Word de un extracto bancario** (tabla con líneas de 3 páginas) | La tabla se arma mal: **toda la columna de fechas queda en una sola celda** y el título se mete en la fila de encabezados, así que las filas no coinciden | 🔴 Falla |
| PDF a Word de una revista a dos columnas, con encabezado e imagen | Bien: columnas en tabla sin bordes y las imágenes incluidas | ✅ Bien |
| **PDF a Excel**: tablas con números alineados a la derecha (con líneas y sin ellas) | Los datos quedan bien (números como número), pero **el encabezado de una columna numérica se pega al de la izquierda** ("Descripción Valor" en una celda y "Saldo" corrido) | 🟠 Falla |
| PDF a Excel de 3 páginas | Una hoja por página, o todo en una hoja (opción). Bien | ✅ Bien |
| **Excel a PDF** de un libro con una **hoja oculta** | **La hoja oculta se imprime** (Excel no lo hace): puede mostrar datos que el usuario quería esconder | 🟠 Falla (privacidad) |
| Excel a PDF: porcentaje (12,6 %) y moneda | El porcentaje sale "0,13" y la moneda sin su formato | 🟡 Limitación |
| Excel a PDF: hoja de 30 columnas | Entra a lo ancho, pero los encabezados se parten a mitad de palabra ("Colu mna") | 🟡 Limitación |
| Excel a PDF: fechas, celdas combinadas, fórmulas con valor guardado | Bien | ✅ Bien |
| Excel a CSV | Bien (una por hoja, BOM, punto y coma). La hoja oculta también se exporta | 🟡 Limitación |
| **Imagen a PDF** de una foto de 6000 × 4000 px | **La página mide 6000 × 4000 puntos (2,1 m)**: cada página toma el tamaño en píxeles. No se puede elegir A4, Carta, orientación ni márgenes | 🟠 Falla |
| Imagen a PDF de una foto del celular girada (orientación EXIF) | **Sale acostada**, aunque Imagen a PNG/JPG sí la endereza | 🟠 Falla |
| **TIFF de 3 páginas** a JPG | **Solo sale la primera página** | 🟠 Falla |
| TIFF en CMYK a JPG | Bien (en la primera medición parecía una falla, pero el archivo de prueba era cian) | ✅ Bien |
| **SVG sin `xmlns`** (común en SVG copiados de una página web) | "No se pudo procesar el archivo" | 🟠 Falla |
| SVG con una imagen externa (enlace a internet) | El PNG sale con el **ícono de "imagen rota" del navegador** dibujado encima | 🟡 Falla menor |
| SVG solo con viewBox, o con ancho y alto en % | Bien (1024 px y transparente) | ✅ Bien |
| GIF animado a GIF | Sale un solo cuadro (se pierde la animación) | 🟡 Limitación |
| PNG con transparencia a JPG o BMP; JPEG CMYK; PNG de 16 bits; JPEG de 24 megapíxeles a WebP; ICO desde una imagen rectangular; GIF animado a PNG (primer cuadro) | Bien | ✅ Bien |
| PDF a imagen con páginas A4 y Carta horizontal | Bien (unos 190 ppp, ZIP), pero no se puede elegir la resolución, la calidad ni qué páginas | 🟡 Limitación |
| PDF a texto a dos columnas | Bien: lee cada columna en orden | ✅ Bien |
| PDF a PowerPoint con páginas de tamaños mezclados | Todas las diapositivas toman el tamaño de la primera página | 🟡 Limitación |
| PDF escaneado a Word o Excel | Lo detecta y manda a OCR (dos pasos) | 🟡 Limitación |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | iLovePDF | Smallpdf | CloudConvert | Zamzar | Convertio |
|---|---|---|---|---|---|---|
| Archivos sin subir a un servidor | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sin límites ni registro | ✅ | ➖ | ❌ (2 al día) | ➖ (25 al día) | ➖ | ➖ |
| Imagen a PDF: **tamaño de página, orientación y márgenes** | ❌ | ✅ (Ajustar, A4, Carta; márgenes sin, pequeño o grande) | ➖ | ✅ | ❌ | ➖ |
| Word a PDF con encabezado, pie y notas | ❌ | ✅ (motor de Office) | ✅ | ✅ (LibreOffice) | ✅ | ✅ |
| PDF a Word/Excel con tablas fieles | ➖ | ✅ | ✅ | ➖ | ➖ | ➖ |
| PDF escaneado a Word/Excel en un paso (OCR) | ➖ (dos pasos) | ✅ (Premium) | ✅ (Pro) | ✅ | ❌ | ✅ |
| PDF a imagen: resolución y páginas | ❌ | ➖ (normal/alta) | ❌ | ✅ (ppp, páginas) | ❌ | ➖ |
| CSV: separador y codificación | ➖ (separador sí; Windows-1252 falla) | – | – | ➖ | ? | ? |
| TIFF de varias páginas | ❌ | – | – | ✅ | ✅ | ✅ |
| Formatos de imagen (HEIC, AVIF, ICO, SVG, TIFF) | ✅ | ➖ | ➖ | ✅ | ✅ | ✅ |

Fuentes: [iLovePDF: JPG a PDF (opciones)](https://www.ilovepdf.com/es/blog/convert-jpg-to-pdf), [Smallpdf: PDF a Excel con OCR](https://smallpdf.com/pdf-to-excel), [Smallpdf: tablas de PDF escaneados](https://smallpdf.com/blog/extract-structure-tables-scanned-pdfs-using-ai), [WPS: opciones de CloudConvert PDF a JPG](https://www.wps.com/blog/cloudconvert-pdf-to-jpg-complete-guide-better-alternatives/), [Zamzar: CSV a XLSX](https://zamzar.com/convert/csv-to-xlsx), [Convertio: CSV a XLSX](https://convertio.co/csv-xlsx/), [IPVoid: CSV a Excel (UTF-8 y Windows-1252)](https://www.ipvoid.com/csv-to-excel/). Las celdas sin fuente salen del conocimiento general de cada herramienta.

**Dónde ganamos:** privacidad (nada sale del equipo), sin límites, muchos formatos de imagen y buena fidelidad en CSV, PDF a texto y Word a PDF básico.
**Dónde quedamos por debajo:** encabezados y pies en Word a PDF, tablas con líneas en PDF a Word/Excel, CSV de Excel en español, opciones de Imagen a PDF, TIFF y SVG.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **CSV en Windows-1252** (el de Excel en español): detectar la codificación y leer bien los acentos | Falla con el caso más común en Colombia | Bajo |
| 2 | **Word a PDF: encabezado, pie, número de página y notas al pie**, y el tamaño de cada sección | Falla en contratos, cartas e informes | Medio-alto |
| 3 | **PDF a Word y Excel: tablas con líneas** (extractos, facturas): cada celda en su lugar, título fuera de la tabla, encabezados de columnas numéricas en su columna | Falla en el caso estrella de PDF a Excel | Medio |
| 4 | **Imagen a PDF: tamaño de página** (Ajustar, A4, Carta), orientación, márgenes y respetar la orientación EXIF | Falla (páginas de 2 m y fotos acostadas) y paridad con iLovePDF | Bajo |
| 5 | **Excel a PDF y CSV:** no incluir hojas ocultas, aplicar formato de porcentaje y moneda, no partir palabras en los encabezados | Falla de privacidad y de presentación | Bajo |
| 6 | **TIFF:** todas las páginas (una imagen por página, o un PDF) | Falla con escaneos de fax y oficina | Bajo-medio |
| 7 | **SVG:** aceptar SVG sin `xmlns` y quitar las imágenes externas en vez de dibujar el ícono roto | Falla | Bajo |
| 8 | **PDF a imagen:** elegir resolución (72–300 ppp), calidad JPG y qué páginas | Paridad con CloudConvert | Bajo |
| 9 | PDF escaneado a Word/Excel **con OCR en un paso** (usa el OCR local) | Paridad con iLovePDF y Smallpdf | Medio |
| 10 | GIF animado a GIF conservando la animación; PDF a PowerPoint con el tamaño de cada página | Detalles | Bajo |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 7 (2026-11-22). Quedan para más adelante la 8 (opciones de PDF a imagen), la 9 (OCR en un paso) y la 10 (detalles).

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | CSV en Windows-1252 | Se detecta la codificación: UTF-8 (con o sin BOM), UTF-16 con BOM o, si el archivo no es UTF-8 válido, Windows-1252 (el "CSV delimitado" de Excel en español) | Unitarias; E2E con un CSV en Windows-1252: "José Pérez", "Bogotá", "Ñandú" llegan bien |
| 2 | Word a PDF: encabezado, pie, notas y secciones | Cada sección usa su propio tamaño de página, sus márgenes, su encabezado y su pie. Una sección sin encabezado propio usa el de la anterior, como en Word: por eso antes se perdían. Un salto "continuo" a otro tamaño de página pasa de hoja. Las notas al pie y las notas al final se numeran en el texto y se escriben al final del documento, después de una línea corta | Unitarias; E2E: carta vertical + carta horizontal con "EMPRESA SAS" y "Página N" en las dos, y la nota al pie |
| 3 | PDF a Word y Excel: tablas con líneas | (a) Una tabla ya no se toma por una página a dos columnas: si la mayoría de las líneas tiene 3 bloques o más, o los dos lados son angostos, es una tabla. (b) Las columnas salen del espacio que ocupa el texto, no del borde izquierdo: una columna de montos alineados a la derecha queda entera, y su encabezado (alineado a la izquierda) se asigna a esa columna | Unitarias; E2E con un extracto: "Fecha · Descripción · Valor · Saldo" cada uno en su columna y las filas alineadas |
| 4 | Imagen a PDF: tamaño, orientación, márgenes y EXIF | **Tamaño de página** (A4 o Carta según el país, o como la foto), **orientación** (automática, vertical u horizontal) y **márgenes** (sin, pequeño o grande). La imagen va centrada y sin deformarse. Los JPEG derechos entran tal cual (sin perder calidad); los girados por EXIF y los CMYK pasan por un canvas y salen derechos | Unitarias (también la lectura de EXIF en Intel y Motorola); E2E: foto horizontal en A4 con margen grande da una página de 842 × 595 |
| 5 | Excel a PDF y CSV | Lector de .xlsx propio (`xlsxRead.ts`) que guarda el formato de cada celda y si la hoja está oculta. Las **hojas ocultas** no se imprimen ni se exportan; porcentaje ("12,60 %"), moneda ("$ 1.500,50", "7,00 €", "US$") y decimales fijos salen como en Excel. Una hoja muy ancha sigue en otra página con las columnas que faltan ("Ancha · A–R", "S–AD"), sin partir palabras | Unitarias; E2E: el PDF muestra "12,60 %" y "$ 12.500" y no muestra la hoja oculta; tampoco sale en el CSV |
| 6 | TIFF de varias páginas | Una imagen por página ("fax-pagina-1.jpg"…), en un ZIP; en Imagen a PDF, una página del PDF por cada página del TIFF | E2E con un TIFF de 3 páginas |
| 7 | SVG | Se agrega el `xmlns` que falta (y el de `xlink`). Las imágenes con enlaces a internet se quitan, en vez de dibujar el ícono de "imagen rota" | Unitarias; E2E con un SVG sin xmlns |

**Correcciones en el camino:** un libro de Excel con filas vacías en el medio salía sin datos con el nuevo lector (se encontró en las pruebas unitarias antes de publicar). Además, en la primera medición el TIFF CMYK parecía una falla, pero el archivo de prueba era cian: sale bien.

**Nueva medición (con los mismos archivos de la sección 1):** CSV de Excel en español ✅ · Word a PDF con encabezado, pie, número de página, nota y sección horizontal ✅ · extracto a Word y a Excel con las filas alineadas ✅ · foto de 6000 × 4000 px en una hoja A4 y foto con EXIF derecha ✅ · Excel con porcentaje y moneda, sin la hoja oculta y la hoja ancha en dos grupos de columnas ✅ · TIFF de 3 páginas ✅ · SVG sin xmlns y con imagen externa ✅.

**Límites conocidos:** las notas al pie van al final del documento y no al pie de cada página. El encabezado distinto en la primera página o en las páginas pares de Word todavía no se respeta: se usa el principal.

**Queda por debajo:** opciones de resolución en PDF a imagen (#8), OCR en un paso en PDF a Word/Excel (#9), animación de GIF y tamaño por página en PDF a PowerPoint (#10).
