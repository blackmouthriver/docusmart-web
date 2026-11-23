# Auditoría W-146.8 · Imagen

Fecha: 2026-11-22. Herramientas (8): **Comprimir, Redimensionar, Recortar, Rotar y voltear, Quitar fondo, Foto tamaño documento, Marca de agua, Ajustar imagen**.
Código: `image/core/*` (cálculos puros: `imageTools.ts`, `adjust.ts`, `watermark.ts`, `idPhoto.ts`, `background.ts`), `image/infra/*` (canvas, modelo de IA en un worker) y `image/ui/ImageTools.tsx`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Se procesaron 12 casos en la app real (Chrome con Playwright). Los archivos se hicieron con Pillow: una foto de 4000 × 3000 con EXIF (orientación, cámara y **ubicación GPS**) a 300 ppp, una captura de pantalla PNG, un logo PNG con transparencia, un JPEG ya liviano y una imagen de rayas de 1 px. Los resultados se midieron con Pillow (formato, tamaño, metadatos y PSNR contra el original).

| Caso | Resultado | Gravedad |
|---|---|---|
| Comprimir una foto de 2,2 MB (Baja / Recomendada / Máxima) | 911 KB / 190 KB / 47 KB (−59 %, −91 %, −98 %), con PSNR de 38, 34 y 32 dB. Recomendada y Máxima reducen a 2560 y 1600 px de lado (la pantalla lo dice) | ✅ Bien |
| Comprimir: metadatos | Se quitan el EXIF y la **ubicación GPS** en todas las herramientas; la foto sale derecha (se aplica la orientación) | ✅ Bien |
| **Comprimir una captura de pantalla PNG** (77 KB) | **0 % de ahorro**: se devuelve la misma. Pasándola a una paleta de 256 colores (como TinyPNG) baja a 33 KB (−57 %) sin diferencia visible | 🟠 Falla |
| Comprimir un logo PNG con transparencia | 0 % de ahorro (se devuelve el original). Si se lograra ahorrar, saldría como **WebP**, un formato que muchos formularios y programas no aceptan | 🟡 Limitación |
| Comprimir un JPEG ya liviano | −5 %, sin deterioro visible (43,9 dB) | ✅ Bien |
| **Comprimir a un tamaño máximo** ("menos de 200 KB", como piden portales y formularios) | No existe: hay que probar niveles a mano. Tampoco hay un control de calidad | 🟠 Falta |
| Redimensionar rayas de 1 px de 3000 a 300 px | Gris parejo (promedio 127, desviación 0): sin efecto moiré | ✅ Bien |
| Redimensionar una foto a 1000 px | Bien (1000 × 1333, proporción y orientación correctas). No hay medidas listas (redes sociales) ni en centímetros para imprimir, y los 300 ppp se pierden | 🟡 Limitación |
| **Rotar** una foto JPEG | Se vuelve a comprimir: pierde calidad (39,7 dB) en cada giro. Girar un JPEG **sin pérdida** es posible | 🟡 Limitación |
| Recortar | Bien (el JPEG se recomprime al 92 %: 39,7 dB) | ✅ Bien |
| Marca de agua y Ajustar | Funcionan (piden texto o mover un ajuste antes de aplicar) | ✅ Bien |
| Varias imágenes a la vez | Comprimir, redimensionar, rotar, quitar fondo, marca de agua y ajustar aceptan varias; recortar y foto documento, de a una | ✅ Bien |
| Quitar fondo | El modelo (IS-Net, 90 MB) se descarga una vez y queda guardado; no se puede **corregir** el recorte (borrar o recuperar zonas) ni difuminar o cambiar el fondo por una imagen | 🟡 Limitación |
| Foto documento | Medidas 35 × 45, 50,8 × 50,8, 30 × 40, 40 × 50 y 25 × 30 mm a 300 ppp, fondo blanco o de color y hoja de 10 × 15 cm para imprimir. El encuadre es manual: no se detecta la cara | 🟡 Limitación |
| Ajustar | Brillo, contraste, saturación, blanco y negro y enderezar. No hay nitidez ni mejora automática | 🟡 Limitación |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | Squoosh | TinyPNG | iLoveIMG | remove.bg | Canva |
|---|---|---|---|---|---|---|
| Imágenes sin subir a un servidor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sin límites ni registro | ✅ | ✅ | ➖ (20 imágenes, 5 MB) | ➖ | ➖ (vista previa gratis) | ➖ |
| Varias imágenes a la vez | ✅ | ❌ | ✅ | ✅ | ➖ | ➖ |
| Comprimir JPG | ✅ | ✅ | ✅ | ✅ | – | ➖ |
| **Comprimir PNG con pérdida** (menos colores, sigue siendo PNG) | ❌ | ✅ (reducir paleta) | ✅ | ✅ | – | ❌ |
| Control de calidad | ❌ (3 niveles) | ✅ | ❌ | ➖ | – | ➖ |
| **Comprimir a un tamaño** (KB) | ❌ | ❌ | ❌ | ? | – | ❌ |
| Redimensionar con medidas listas (redes) | ❌ | ❌ | ➖ | ✅ | – | ✅ |
| Girar sin pérdida | ❌ | – | – | ? | – | – |
| Quitar fondo | ✅ (en el equipo) | ❌ | ❌ | ✅ | ✅ | ✅ (Pro) |
| Corregir el recorte con pincel | ❌ | – | – | ? | ✅ | ✅ |
| Fondo difuminado o de imagen | ❌ (transparente o color) | – | – | ? | ✅ | ✅ |
| Foto documento con encuadre automático | ❌ (manual) | – | – | ❌ | – | ❌ |
| Marca de agua (texto o logo, mosaico) | ✅ | ❌ | ❌ | ✅ | – | ✅ |

Fuentes: [TinyPNG](https://tinypng.com/) y [cómo comprime (cuantización de colores)](https://www.abeautifulsite.net/posts/tinypng-a-better-way-to-compress-png-images/), [compresión de PNG con pérdida y ahorro en capturas](https://imgpress-co2.pages.dev/blog/png-compression-explained), [remove.bg: nuevo editor (pincel, difuminado, fondos)](https://www.remove.bg/b/fresh-design-advanced-features), [herramientas de comprimir a un tamaño en KB (Cloudinary)](https://cloudinary.com/tools/reduce-image-size-in-kb), [ImResizer: tamaño en KB y fotos de pasaporte](https://imresizer.com/resize-image-size-in-kb). Las celdas sin fuente salen del conocimiento general de cada herramienta.

**Dónde ganamos:** privacidad (también la IA de quitar fondo), sin límites, varias imágenes a la vez, metadatos y GPS quitados siempre, y marca de agua y foto documento en el mismo lugar.
**Dónde quedamos por debajo:** compresión de PNG, comprimir a un tamaño, control de calidad, girar sin pérdida, corregir el recorte del fondo y el encuadre automático de la foto documento.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Comprimir PNG con pérdida** (paleta de hasta 256 colores con transparencia) y **conservar el formato** (un PNG sigue siendo PNG; WebP solo si se elige) | Falla: las capturas y logos no se comprimen (−57 % posible) | Medio |
| 2 | **Comprimir a un tamaño máximo** (menos de 50, 100, 200, 500 KB, 1 MB o a mano) y **calidad a mano** | Lo piden portales y formularios; hoy hay que probar | Bajo |
| 3 | **Redimensionar con medidas listas** (Instagram, WhatsApp, Facebook, LinkedIn, fondo de pantalla) y **en centímetros a 300 ppp**, conservando los ppp | Paridad con iLoveIMG y Canva; impresión | Bajo |
| 4 | **Girar JPEG sin pérdida** (solo cambia la orientación guardada; se recomprime solo si hace falta) | Calidad al girar fotos | Medio |
| 5 | **Ajustar: nitidez y mejora automática** (niveles y balance automáticos) | Fotos de documentos y celular | Bajo-medio |
| 6 | **Quitar fondo: pincel para borrar y recuperar**, fondo difuminado o con una imagen | Paridad con remove.bg | Medio-alto |
| 7 | **Foto documento: encuadre automático con la cara** (detección de rostro en el equipo) | Paridad con apps de fotos de pasaporte | Alto |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 5 (2026-11-22). Quedan para más adelante la 6 (pincel en Quitar fondo) y la 7 (encuadre automático de la foto documento).

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | PNG con paleta y conservar el formato | **Formato**: igual que la original (por defecto), JPG o WebP. Un PNG se pasa a una paleta de hasta 256 colores, con transparencia, y sigue siendo PNG, solo si se parece lo suficiente a la original (PSNR de 40, 35 o 31 dB según el nivel); si no, se guarda sin pérdida. Se corrigió que el cuantizador diera un color opaco a pixeles transparentes | Unitarias; E2E: una captura sigue siendo PNG (tipo paleta) y pesa menos del 80 % |
| 2 | Comprimir a un tamaño y calidad a mano | **Tamaño máximo**: sin límite, 50, 100, 200, 500 KB, 1 MB u otro. Primero baja la calidad (búsqueda binaria) y, si no alcanza, achica la imagen de a 20 %. Si no se puede sin dañarla, lo avisa. Si la original ya entra y no cambia de formato, se devuelve tal cual. Nivel **Personalizada** con calidad del 10 al 100 % | Unitarias con un codificador de prueba; E2E: una foto de más de 300 KB queda bajo 100 KB |
| 3 | Redimensionar: redes, centímetros y ppp | **Redes sociales**: Instagram (cuadrada y vertical), historia o estado, portadas de Facebook, LinkedIn y X, miniatura de YouTube y fondo Full HD. La imagen llena la medida exacta recortando parejo. **En centímetros**: a 150, 300 o 600 ppp. La resolución se guarda en el archivo (JPG y PNG); en los otros modos se conserva la que traía la imagen | Unitarias; E2E: historia de 1080 × 1920, y 10 cm a 300 ppp dan 1181 px con 300 ppp guardados |
| 4 | Girar JPG sin pérdida | Opción **Girar sin perder calidad (JPG)**: no se vuelve a comprimir; se combina el giro con la orientación que ya tenía y se guarda en un EXIF mínimo. El EXIF anterior, el XMP y el IPTC se quitan, con la ubicación GPS. Viene apagada por compatibilidad con programas muy antiguos y la pantalla lo explica | Unitarias (las 8 orientaciones); E2E: los datos de la imagen quedan iguales y el navegador la muestra girada |
| 5 | Ajustar: nitidez y mejora automática | **Nitidez** de 0 a 100 (máscara de enfoque) y **mejora automática**: estira los tonos de cada canal (el 0,5 % más oscuro a negro y el más claro a blanco), lo que corrige fotos lavadas, oscuras o con dominante de color | Unitarias; E2E con las dos opciones |

**Nueva medición (con los mismos archivos de la sección 1):**
- Captura PNG: de 77 a 28 KB (−64 %), sigue siendo PNG.
- Logo con transparencia: de 4 a 2 KB, sigue siendo PNG.
- Foto con límite de 100 KB: 97 KB.
- Foto a 10 cm: 1181 px con 300 ppp; historia: 1080 × 1920.
- Giro sin pérdida: la imagen idéntica (PSNR 99 dB) y sin GPS.

Lo que ya estaba bien no cambió: comprimir fotos, rayas sin moiré, metadatos quitados.

**Queda por debajo:** corregir el recorte de Quitar fondo con pincel y fondos difuminados o de imagen (#6), y el encuadre automático de la foto documento (#7).

### Seguimiento W-147.5 (2026-11-23): las brechas 6 y 7

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 6 | Pincel y fondos nuevos en Quitar fondo | La IA entrega siempre el recorte transparente y el fondo se pone después: **transparente, blanco, color, difuminado** (la misma foto desenfocada, sin bordes claros) o **una imagen** elegida (ajustada sin deformarse). Con una sola foto aparece **Retocar con pincel**: **Borrar** lo que sobró y **Recuperar** lo que la IA cortó de más (la foto original se ve tenue como guía), con tamaño de pincel, deshacer y rehacer. Se guardan los trazos y no copias de la imagen, así deshacer no gasta memoria | Unitarias (`coverRect`, `blurPx`, `strokeDabs`) y E2E con el modelo real (borrar el centro de la manzana y recuperar el borde; difuminado sin transparencia) |
| 7 | Encuadre automático de la foto documento | Botón **Encuadrar automáticamente**: con la silueta que da la misma IA (no hace falta otro modelo) se ubica la coronilla, el ancho y el centro de la cabeza, y el recuadro queda con la cabeza ocupando cerca del 72 % del alto y un 9 % de espacio arriba, con la proporción de la medida elegida; si no cabe, se achica sin salirse de la foto. Si no encuentra a una persona, lo avisa y se ajusta a mano | Unitarias (`frameFromMask` con una silueta de prueba) y E2E (el recuadro se mueve hacia la persona) |

**Queda por debajo en Imagen:** nada de lo detectado en la auditoría.

