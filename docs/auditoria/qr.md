# Auditoría W-146.11 · QR

Fecha: 2026-11-22. Herramientas (2): **Crear QR y Leer QR**.
Código: `qr/core/*` (contenido por tipo, diseño, cifrado, historial; puro) y `qr/ui/Qr.tsx`. Para crear se usa la librería `qrcode`. Para leer, el lector nativo del navegador (`BarcodeDetector`) cuando existe y `jsQR` como respaldo, sobre una copia reducida a 1024 px.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Lectura: se dibujaron QR reales (con `qrcode`) dentro de imágenes de distinto tamaño y se leyeron con `jsQR`, con la misma reducción a 1024 px que hace la app. Chrome y Edge en Windows y Firefox no tienen lector nativo, así que en un computador todo depende de `jsQR`. El QR de prueba es el enlace de consulta de una factura electrónica de la DIAN.

| Caso | Resultado | Gravedad |
|---|---|---|
| QR grande en una imagen chica | Lee | ✅ Bien |
| QR claro sobre fondo oscuro (invertido) | Lee | ✅ Bien |
| QR girado 30° | Lee | ✅ Bien |
| **Foto de una factura (4000 × 3000) con el QR de 6 cm** | **No lee**: al reducir la foto a 1024 px el QR queda muy chico. Sin reducir, sí lee | 🔴 Falla |
| **Página escaneada a 300 ppp (2480 × 3508) con el QR de la factura** | **No lee** (mismo motivo); sin reducir, sí | 🔴 Falla |
| QR pequeño (3 cm) en foto grande | No lee; sin reducir, sí | 🔴 Falla |
| **Dos QR en la misma imagen** | No lee ninguno (`jsQR` busca uno solo) | 🟠 Limitación |
| **QR dentro de un PDF** (factura electrónica, certificado) | No se puede: solo acepta imágenes | 🟠 Falta |
| Foto HEIC del iPhone | No se abre (`createImageBitmap` no la entiende en Chrome) | 🟡 Falla menor |
| Códigos de barras (EAN de productos, Code 128, PDF417 de la cédula) | No: solo QR | 🟡 Limitación |
| Lo leído | Reconoce enlace (con aviso de dominios engañosos), correo, teléfono, Wi-Fi, contacto, evento y texto, y QR protegidos con contraseña de DocuSmart; historial local | ✅ Bien |

Crear (revisión del código y de la pantalla):

| Caso | Resultado | Gravedad |
|---|---|---|
| Tipos: enlace, texto, correo, teléfono, Wi-Fi, contacto, evento | Bien, con los formatos estándar (WIFI:, vCard 3.0, iCalendar) y su escape | ✅ Bien |
| **WhatsApp, SMS y ubicación** | No existen como tipos | 🟠 Falta |
| Contacto | Solo nombre, teléfono y correo: sin empresa, cargo, dirección ni página web | 🟡 Limitación |
| Diseño | 8 colores fijos sobre blanco (con control de contraste), logo redondo, PNG de 512 a 2048 px y SVG. Sin color a elección, color de fondo ni forma de los puntos | 🟡 Limitación |
| QR protegido con contraseña (AES) | Bien (solo lo abre DocuSmart) | ✅ Bien |
| Varios QR de una lista (inventario, invitaciones) | No existe | 🟡 Falta |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | QR Code Monkey | QR Code Generator | Cámara del celular / Google Lens |
|---|---|---|---|---|
| Sin cuenta ni servidor | ✅ | ✅ | ➖ (los dinámicos piden cuenta) | ✅ |
| Tipos WhatsApp, SMS, ubicación | ❌ | ➖ | ✅ | – |
| Contacto completo (vCard) | ➖ | ✅ | ✅ | – |
| Colores a elección, degradados, formas de puntos y ojos | ➖ (color libre y fondo, W-147.8; sin degradados ni formas) | ✅ | ✅ | – |
| Logo | ✅ | ✅ | ✅ | – |
| SVG y PDF | ✅ (SVG y PDF vectorial, W-147.8) | ✅ (PNG, SVG, PDF, EPS) | ✅ | – |
| Varios desde una lista (CSV) | ✅ (W-147.8) | ❌ | ✅ (algunos tipos) | – |
| QR con contraseña | ✅ | ❌ | ❌ | – |
| Leer QR en fotos grandes y escaneos | ❌ (en computador) | – | – | ✅ |
| Leer desde PDF | ❌ | – | – | ➖ (captura de pantalla) |
| Varios códigos y códigos de barras | ❌ | – | – | ✅ |

Fuentes: [QR Code Monkey: formatos PNG, SVG, PDF y EPS, uso comercial](https://www.getapp.co.uk/software/2085748/qrcode-monkey), [QR Code Monkey: colores, degradados y formas](https://emtech.suny.edu/?p=16890), [QR Code Generator: QR en lote](https://bn.qr-code-generator.com/guides/how-to-generate-qr-codes-in-bulk/), [QR de WhatsApp](https://the-qrcode-generator.com/whatsapp-qr-code?lng=ru), [QR en lote desde CSV](https://quickchart.io/bulk-qr-code-generator/). Las celdas sin fuente salen del conocimiento general de cada herramienta.

**Dónde ganamos:** privacidad, QR protegido con contraseña, aviso de enlaces engañosos al leer, historial local.
**Dónde quedamos por debajo:** leer QR en fotos y escaneos grandes en el computador, leer desde PDF, varios códigos, tipos y diseño al crear, y QR en lote.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Leer QR en fotos grandes y escaneos**: si no encuentra nada a 1024 px, probar a resolución completa y por zonas | Falla con facturas fotografiadas o escaneadas | Bajo |
| 2 | **Leer desde PDF** (cada página; la factura electrónica trae el QR de la DIAN) y **fotos HEIC** | Muy útil en Colombia | Bajo-medio |
| 3 | **Varios QR en una imagen o un PDF** (todos los que haya) y **códigos de barras** cuando el navegador los lee | Paridad con la cámara del celular | Medio |
| 4 | **Más tipos al crear**: WhatsApp (con mensaje), SMS, ubicación (mapa) y contacto completo (empresa, cargo, dirección, web) | Paridad con QR Code Generator | Bajo |
| 5 | **Diseño**: color a elección con control de contraste, color de fondo y descarga en PDF | Paridad con QR Code Monkey | Medio |
| 6 | **Varios QR desde una lista** (una línea por QR) en un ZIP o una hoja PDF para imprimir | Inventarios, invitaciones | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 4 (2026-11-22). Quedan para más adelante la 5 (diseño con color a elección y PDF) y la 6 (varios QR desde una lista).

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Leer en fotos grandes y escaneos | Si la imagen es grande, además de la pasada rápida (1024 px) se busca a más resolución (2048 px) y por zonas que se superponen (2 × 2, y 3 × 3 en fotos de más de 2400 px). La cámara sigue con la pasada rápida, cuadro a cuadro | Unitarias con jsQR: la factura en una foto de 4000 × 3000 no se lee reducida y sí con las zonas; también la página escaneada a 300 ppp. E2E con la foto de 4000 × 3000 |
| 2 | Leer desde PDF y fotos HEIC | "Elegir imagen o PDF": cada página del PDF (hasta 30) se dibuja a 200 ppp y se busca el código; las fotos HEIC, TIFF y SVG se abren con los mismos decodificadores que Convertir | E2E: el QR de la DIAN en la página 2 de un PDF |
| 3 | Varios códigos y códigos de barras | Cada QR que aparece se tapa y se busca otra vez (hasta 8 por zona), y las zonas encuentran los que están separados. Se muestran todos ("Se encontraron 2 códigos"), cada uno con sus acciones. Si el navegador tiene lector nativo, se piden todos sus formatos (EAN, Code 128, PDF417, Data Matrix…), con el nombre del formato | Unitarias; E2E con dos QR en una imagen |
| 4 | Más tipos al crear | **WhatsApp** (wa.me con el mensaje; a un celular colombiano de 10 dígitos se le pone el 57), **SMS** (SMSTO:), **Ubicación** (enlace de Google Maps con la dirección o las coordenadas, que abre en cualquier celular) y **contacto completo** (empresa, cargo, dirección y web, que también se leen). Al leer, los SMS ofrecen "Enviar SMS" y un geo: "Abrir en el mapa" | Unitarias; E2E: un QR de WhatsApp creado, descargado y vuelto a leer |

**Corrección en el camino:** al leer un contacto, una empresa con ";" en el nombre se cortaba.

**Nueva medición (con los casos de la sección 1):**
- Factura fotografiada (4000 × 3000): lee. Antes no.
- Página escaneada a 300 ppp: lee. Antes no.
- QR de 3 cm en foto grande: lee. Antes no.
- Dos QR en una imagen: lee los dos. Antes ninguno.
- QR dentro de un PDF: lee. Antes no se podía.

**Límite conocido:** en un computador sin lector nativo (Chrome y Edge en Windows, Firefox) solo se leen códigos QR; los códigos de barras dependen del navegador (Chrome en Android y en Mac, Safari).

**Queda por debajo:** diseño con color a elección, fondo y PDF (#5) y crear varios QR desde una lista (#6).

## 5. Seguimiento W-147.8 (2026-11-24)

Se hicieron las brechas 5 y 6.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 5 | Color libre, fondo y PDF | En **Personalizar diseño**, además de los 8 colores, **Otro color** (cualquiera) y **Fondo**: blanco, crema, celeste, verde claro, **transparente** (para ponerlo sobre un diseño, con la vista previa en cuadritos) u **Otro fondo**. El contraste se mide contra el fondo elegido y, si el código queda **más claro que el fondo** (QR invertido, que muchas cámaras no leen) o sin contraste, se avisa y no deja generar. Botón **PDF** vectorial del tamaño de impresión (5, 10 o 20 cm según el tamaño), con el logo en círculo; los módulos seguidos van en un solo rectángulo | Unitarias: colores, matriz con y sin logo, el PDF rearma exactamente la matriz del QR, fondo transparente sin pintar. E2E: QR azul marino sobre crema (los dos colores en la imagen), PDF de 10 cm y vuelto a leer con el lector de la app; colores invertidos y sin contraste bloquean |
| 6 | Varios QR desde una lista | Sección **Varios QR desde una lista**: pegar o **cargar un CSV/TXT** con una línea por QR; si hay columnas (punto y coma, tabulador o coma, con comillas de CSV), la segunda es el **nombre**. Se salta un encabezado como "url;nombre", hasta 500. Usa el diseño de arriba (color, fondo, logo). Sale una **hoja para imprimir (PDF)** A4 con el nombre debajo de cada QR (3, 5 u 8 cm: 35, 12 o 6 por hoja; nombres en cualquier idioma y recortados con "…" si no entran) o un **ZIP de PNG** con nombres como `001-Mesa-1.png`. Las líneas que no caben en un QR se saltan y se avisan | Unitarias: lista con y sin columnas, comillas, encabezado, máximo, nombres de archivo; hoja de 14 QR en 2 páginas con los nombres. E2E: CSV con 3 líneas (una demasiado larga) → hoja con "Mesa 1" y "Mesa 2", y ZIP con los PNG, uno vuelto a leer |

**Nueva comparación:** colores ➖ (color libre y fondo; faltan degradados y formas de puntos) · SVG y PDF ✅ · varios desde una lista ✅ (QR Code Monkey no lo tiene).

**Queda por debajo:** degradados y formas de puntos y ojos (QR Code Monkey).
