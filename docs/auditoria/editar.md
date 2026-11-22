# Auditoría W-146.2 · Editar y firmar

Fecha: 2026-11-22. Herramientas: **Editar PDF, Firmar PDF, Llenar formulario, Marca de agua, Recortar PDF, Censurar PDF**.
Código: `src/features/pdf/core/` (`pdfEdit`, `pdfReplace`, `pdfSign`, `pdfDigitalSign`, `pdfForm`, `pdfCrop`, `pdfRedact`, `pdfTools` → `watermark`) y sus pantallas en `src/features/pdf/ui/`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

| Caso | Resultado | Gravedad |
|---|---|---|
| **Llenar formulario** con texto no latino ("Иван Петров", "山田太郎", "서울") | El campo **queda vacío**: se borra todo lo que no sea alfabeto latino, también al aplanar. Hasta la raya "–" se pierde | 🔴 Falla (la app está en 12 idiomas) |
| **Marca de agua** en página girada 180° | Sale **de cabeza** | 🔴 Falla |
| **Marca de agua** en página con área visible desplazada (CropBox) | Queda **fuera de lo visible** (se centra en la hoja completa) | 🔴 Falla |
| Editar: texto en página girada o con área visible desplazada | Sale derecho y en su lugar | ✅ Bien |
| Firmar: firma en página girada o con área visible desplazada | En su lugar | ✅ Bien |
| Recortar: página girada que ya tenía área recortada | Recorta el borde correcto, relativo a lo visible | ✅ Bien |
| Censurar: ¿el texto tapado sigue existiendo? | **No**: la página con zonas se vuelve imagen a 200 ppp, con el tapado redondeado hacia afuera; el documento nuevo no arrastra metadatos ni adjuntos | ✅ Bien (seguro) |
| Censurar: el resto del texto de esa página | Deja de ser seleccionable y buscable (toda la página es imagen) | 🟡 Limitación |
| Recortar: lo recortado | Queda oculto pero sigue dentro del archivo (igual que en la competencia) | 🟡 A saber |
| Firma con certificado (.p12/.pfx) | Funciona, con aviso de vencimiento y de firmas previas | ✅ Bien |
| Rendimiento: marca de agua en 300 páginas | ≈0,4 s | ✅ Bien |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene.

| Función | DocuSmart | Adobe en línea | Sejda | Smallpdf | iLovePDF | PDFgear / DocuSign |
|---|---|---|---|---|---|---|
| **Editar:** texto, reemplazar texto existente | ✅ | ✅ | ✅ | ➖ | ➖ | ✅ (PDFgear) |
| Editar: formas, resaltar, tapar, imágenes | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ |
| Editar: **dibujo a mano alzada, líneas y flechas** | ❌ | ✅ | ➖ | ✅ | ❌ | ✅ |
| Editar: **enlaces** | ❌ | ✅ | ✅ | ❌ | ❌ | ➖ |
| Editar: **deshacer / rehacer** | ❌ | ✅ | ➖ | ✅ | ➖ | ✅ |
| **Firmar:** dibujar, escribir, foto con fondo quitado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firmar: **iniciales, fecha, texto, casilla** | ❌ (solo la firma) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firmar: **recordar la firma** | ❌ | ✅ (cuenta) | ➖ | ✅ (Pro) | ✅ (cuenta) | ✅ |
| Firmar: certificado digital | ✅ local | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firmar: pedir firmas a otros | ❌ | ✅ | ✅ | ✅ (Sign.com) | ✅ | ✅ (DocuSign) |
| **Formulario:** llenar y aplanar | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ |
| Formulario: **cualquier alfabeto** | ❌ (falla) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Formulario: crear campos nuevos | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Marca de agua:** texto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marca de agua: **imagen o logo** | ❌ | ✅ | ✅ | ➖ | ✅ | ✅ |
| Marca de agua: **posición, mosaico, rotación, transparencia, tamaño, color** | ❌ (fija: diagonal, azul, 18 %) | ✅ | ✅ | ➖ | ✅ | ✅ |
| Marca de agua: **detrás del contenido** y **rango de páginas** | ❌ | ✅ | ✅ | ❌ | ✅ | ➖ |
| **Recortar:** arrastrar bordes, quitar márgenes en blanco, todas o una página | ✅ | ✅ | ✅ | ➖ | ➖ | ✅ |
| **Censurar:** borrado real (no solo tapar) | ✅ | ✅ (Pro) | ✅ | ✅ | ✅ | ➖ |
| Censurar: buscar texto, correos y números | ✅ | ✅ | ✅ | ➖ | ➖ | ➖ |
| Censurar: el resto del texto sigue buscable | ❌ | ✅ | ✅ | ? | ? | ➖ |
| **Privacidad** | 100 % local | Sube | Sube (o escritorio) | Sube | Sube | Sube (PDFgear tiene escritorio) |
| **Límites gratis** | Ninguno | Requiere cuenta | 3 tareas por hora | ≈2 al día | Límite de tamaño | Planes de pago (DocuSign) |

Fuentes: [iLovePDF – marca de agua](https://www.ilovepdf.com/blog/how-to-watermark-pages-in-a-pdf-document-online) y [su API](https://developer.ilovepdf.com/docs/guides/watermark-pdf-api), [Smallpdf – firmar](https://smallpdf.com/sign-pdf) y [cómo firmar](https://smallpdf.com/blog/how-to-electronically-sign-a-pdf), [Sejda – editor](https://www.sejda.com/pdf-editor), [Adobe – censurar](https://helpx.adobe.com/ee/acrobat/how-to/redact-pdf.html) y [sanitizar](https://www.adobe.com/au/acrobat/roc/blog/remove-sensitive-content-and-information-by-sanitising-and-redacting.html). Las celdas con "?" no se pudieron confirmar; las demás que esas fuentes no cubren salen del conocimiento general de cada herramienta y conviene confirmarlas a mano.

**Dónde ganamos:** privacidad (incluida la firma con certificado, que nunca sale del equipo), sin cuenta ni límites, censura segura con búsqueda de correos y números, reemplazar texto existente.
**Dónde quedamos por debajo:** formularios en otros alfabetos (falla), opciones de la marca de agua, campos rápidos al firmar (fecha, iniciales), deshacer y dibujo libre en Editar.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Formulario en cualquier alfabeto**: incrustar las fuentes de DocuSmart cuando el texto no es latino (y no perder signos como "–") | Es una falla: el dato desaparece | Bajo |
| 2 | **Marca de agua derecha** en páginas giradas y centrada en el área visible | Es una falla | Bajo |
| 3 | **Marca de agua con opciones**: texto o **imagen/logo**, 9 posiciones o **mosaico**, rotación, transparencia, tamaño, color, **detrás o encima** del contenido y **rango de páginas** | Todos los competidores lo tienen | Medio |
| 4 | **Firmar con campos rápidos**: fecha, iniciales, texto y casilla ✓; opción de **recordar la firma en este equipo** | Smallpdf/Adobe/iLovePDF lo tienen; ahorra pasos | Medio |
| 5 | **Editar: deshacer y rehacer** (Ctrl+Z / Ctrl+Y y botones) | Se espera en cualquier editor | Bajo |
| 6 | **Editar: lápiz a mano alzada, líneas y flechas** | Paridad con Adobe/Smallpdf/PDFgear | Medio |
| 7 | **Censurar: dejar buscable el resto del texto** de las páginas censuradas (capa de texto con el OCR que ya existe) | Paridad con Adobe/Sejda | Medio-alto |
| 8 | Editar: **enlaces** a sitios web o a páginas del documento | Paridad con Sejda/Adobe | Medio |
| 9 | Formulario: **guardar y cargar respuestas** (para llenar el mismo formulario otra vez) | Comodidad | Bajo |

Fuera de alcance por la promesa de privacidad 100 % local: pedir firmas a otras personas por correo (necesita un servidor).

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 5 (2026-11-22). Las 6 a 9 quedan para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Formulario en cualquier alfabeto | Si la respuesta no es latina, el campo se dibuja con las fuentes de DocuSmart (también listas desplegables y de opciones); los signos latinos como "–" ya no se pierden | Unitaria (ruso, japonés, coreano, aplanado) y E2E que descarga y lee el texto |
| 2 | Marca de agua derecha | Se ubica en la página como se ve: derecha en páginas giradas 90/180/270 y centrada en el área visible | Unitaria con pdf.js en las 4 rotaciones y con área desplazada |
| 3 | Marca de agua con opciones | Texto o **imagen/logo**, **9 posiciones** o **mosaico**, rotación (0, 45, 90, −45), **opacidad**, tamaño, **color**, **encima o detrás** del contenido y **páginas** ("1-3, 5") | Unitarias de posiciones, mosaico, páginas, imagen y capa; E2E en escritorio y celular |
| 4 | Firmar con campos rápidos | **Fecha**, **texto**, **✓** e **iniciales** (en letra manuscrita), que se arrastran y cambian de tamaño como la firma; la fecha y el texto quedan como texto real del PDF. **Recordar la firma en este equipo** (solo en el navegador; apagarlo la borra) | Unitarias de cada campo en página girada; E2E que firma, lee el texto y vuelve con la firma recordada |
| 5 | Editar: deshacer y rehacer | Botones y **Ctrl+Z / Ctrl+Y** (Cmd en Mac); los cambios seguidos (arrastrar, escribir) cuentan como un paso; hasta 100 pasos | E2E con botones y con teclado |

Además se corrigió una falla encontrada al hacerlo: al mover o cambiar el tamaño de un recuadro, se perdía su tipo (prueba unitaria nueva).

**Nueva comparación (filas que cambiaron):** formulario en cualquier alfabeto ✅ · marca de agua con imagen ✅ · posición, mosaico, rotación, transparencia, tamaño y color ✅ · detrás del contenido y rango de páginas ✅ · iniciales, fecha, texto y casilla al firmar ✅ · recordar la firma ✅ (local, sin cuenta) · deshacer y rehacer ✅.

**Queda por debajo:** dibujo libre, líneas y flechas (#6), dejar buscable el texto de las páginas censuradas (#7), enlaces (#8), guardar respuestas del formulario (#9), crear campos de formulario nuevos y pedir firmas a otros (este último, fuera de alcance por privacidad).
