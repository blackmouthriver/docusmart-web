# Auditoría W-146.9 · Audio y video

Fecha: 2026-11-22. Herramientas (5): **Video a MP3 (extraer audio), Convertir video, Recortar, Comprimir video, Audio a texto**.
Código: `media/core/media.ts` (reglas puras), `media/infra/mediaRun.ts` (Mediabunny sobre WebCodecs, con aceleración por hardware), `media/ui/Media.tsx`; `transcribe/*` (Whisper base en el navegador, 74 MB).

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Se grabó en el navegador un video MP4 real (H.264 + AAC) de 1280 × 720, 20 s y 13 MB, con detalle fino, y se pasó por cada herramienta en la app (Chrome con Playwright). Los resultados se revisaron con el reproductor y leyendo los paquetes del archivo con Mediabunny.

| Caso | Resultado | Gravedad |
|---|---|---|
| Extraer audio a MP3 | 1,5 s, 387 KB, 19,8 s de duración | ✅ Bien |
| Convertir a WebM | 7,2 s (más rápido que la duración), 1280 × 720. Pesa un poco más (15 MB) que el MP4 original | ✅ Bien |
| Comprimir (Recomendada) | 13 MB → 4,8 MB (−64 %) en 6,6 s, mismo tamaño y duración | ✅ Bien |
| Comprimir (Fuerte, 480p) | 13 MB → 284 KB (−98 %) en 5 s, 854 × 480 | ✅ Bien |
| **Recortar del segundo 5 al 10** | Tarda 0,2 s porque copia sin recomprimir, pero **el archivo trae 10 s de video**: como el inicio no cae en un fotograma clave, se copia desde el anterior (el segundo 0) y los primeros 5 s quedan **escondidos con tiempos negativos**. Se ven 5 s, pero lo que se quiso cortar sigue dentro del archivo, y pesa el doble (5,6 MB en vez de unos 3,3) | 🔴 Falla (privacidad) |
| **Comprimir para WhatsApp o correo** (16 o 25 MB) | No se puede pedir un tamaño: hay que probar niveles a mano | 🟠 Falta |
| Video de lado (grabado con el celular girado) | No hay forma de **girarlo** | 🟠 Falta |
| Video a **GIF** | No existe | 🟡 Falta |
| Varios archivos | De a uno en todas las herramientas | 🟡 Limitación |
| Unir videos | No existe | 🟡 Falta |
| Audio a texto (pruebas existentes con una nota de voz en español) | Bien: texto, Word, SRT y VTT; 12 idiomas; traducir al inglés; modelo de 74 MB que se guarda en el navegador. No distingue quién habla y el modelo base se equivoca más que los grandes con audio ruidoso | 🟡 Limitación |
| Navegador sin WebCodecs | Mensaje claro | ✅ Bien |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | CloudConvert | Clideo | Kapwing | FreeConvert | TurboScribe / Otter |
|---|---|---|---|---|---|---|
| Archivos sin subir a un servidor | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sin marca de agua ni registro | ✅ | ➖ | ❌ (marca de agua gratis) | ❌ | ➖ | ➖ (3 al día) |
| Extraer audio, convertir, comprimir | ✅ | ✅ | ✅ | ✅ | ✅ | – |
| Recortar | ✅ (con la falla de arriba) | ✅ | ✅ | ✅ | ✅ | – |
| **Comprimir a un tamaño** | ❌ | ➖ | ➖ | ? | ✅ | – |
| **Girar video** | ❌ | ✅ | ✅ | ✅ | ✅ | – |
| **Video a GIF** | ❌ | ✅ | ✅ | ✅ | ✅ | – |
| Unir videos | ❌ | ✅ | ✅ | ✅ | ✅ | – |
| Varios archivos a la vez | ❌ | ✅ | ➖ | ➖ | ✅ | ✅ |
| Transcribir con subtítulos (SRT/VTT) | ✅ | – | ✅ | ✅ | – | ✅ |
| Distinguir quién habla | ❌ | – | ❌ | ❌ | – | ✅ |

Fuentes: [reseñas de Clideo (nivel de compresión, CRF y bitrate; unir con más de 30 herramientas)](https://skywork.ai/skypage/en/Compress-Video-with-Clideo-An-AI-Powered-Guide/1973746291463745536), [Clideo: unir videos](https://videoconverter.wondershare.com/more-tips/clideo-video-merger.html), [FreeConvert: compresor de video](https://www.freeconvert.com/video-compressor), [TurboScribe (Whisper, hablantes, exportar a DOCX, PDF, SRT, VTT, CSV)](https://turboscribe.ai/free-whisper-transcription), [reseñas de TurboScribe (límites gratis)](https://www.sourceforge.net/software/product/TurboScribe). Las celdas sin fuente salen del conocimiento general de cada herramienta.

**Dónde ganamos:** privacidad (el video no sale del equipo, también la transcripción), sin marca de agua ni límites, rapidez con aceleración por hardware.
**Dónde quedamos por debajo:** la falla del recorte, comprimir a un tamaño, girar video, video a GIF, varios archivos y unir videos.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Recortar sin dejar nada escondido**: si el inicio no cae en un fotograma clave, se recomprime el video para que empiece exacto (el audio y lo demás siguen igual) | Falla de privacidad y archivo del doble | Bajo |
| 2 | **Comprimir a un tamaño**: WhatsApp (16 MB), correo (25 MB), Discord (10 MB) u otro, calculando la tasa de bits por la duración | Lo que más se busca al comprimir | Bajo-medio |
| 3 | **Girar y voltear video** (90°, 180°, 270°) | Videos de celular de lado | Bajo |
| 4 | **Video a GIF** (tramo, ancho y cuadros por segundo) | Paridad con todos los competidores | Medio |
| 5 | **Varios archivos a la vez** en extraer audio, convertir y comprimir | Paridad con CloudConvert y FreeConvert | Medio |
| 6 | **Unir videos** | Paridad | Medio-alto |
| 7 | Audio a texto: **distinguir hablantes** y un modelo más preciso opcional | Paridad con TurboScribe | Alto |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 4 (2026-11-22). Quedan para más adelante la 5 (varios archivos), la 6 (unir videos) y la 7 (hablantes en Audio a texto).

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Recortar sin nada escondido | Antes de copiar se busca el fotograma clave anterior al inicio; si no coincide con el inicio, se recomprime el video para que empiece exacto. Si coincide, o se corta desde el principio, se sigue copiando sin pérdida (instantáneo). El audio no cambia | Unitarias; E2E: el primer paquete del resultado ya no tiene tiempo negativo y dura lo pedido |
| 2 | Comprimir a un tamaño | **Tamaño máximo**: por calidad (como antes), Discord 10 MB, WhatsApp 16 MB, correo 25 MB u otro (desde 0,1 MB). Se reparte la tasa de bits entre video y audio según la duración y se baja a 1080, 720 o 480 si hace falta. Si el codificador se pasa, hasta 3 reintentos (menos tasa y luego 70 % y 50 % del tamaño). Si no alcanza o no se puede sin dañarlo, lo avisa | Unitarias; E2E: queda bajo la mitad del original |
| 3 | Girar y voltear video | Nueva herramienta **Girar video**: izquierda, derecha y voltear, con vista previa. En MP4 y MOV se guarda el giro en el archivo sin recomprimir (instantáneo y sin pérdida); en WebM se recomprime | Unitarias; E2E: 640 × 360 pasa a 360 × 640 con rotación de 90° y los cuadros intactos |
| 4 | Video a GIF | Nueva herramienta **Video a GIF**: tramo (hasta 30 s), ancho de 320, 480 o 640 px y 10 o 15 cuadros por segundo; paleta de 256 colores por cuadro y se repite sin fin | Unitarias; E2E: 2 s a 10 cuadros por segundo dan 20 cuadros de 480 × 270 |

**Nueva medición (con el mismo video de 13 MB):**
- Recortar del 5 al 10: 5 s y sin nada antes del inicio (antes traía 10 s).
- Comprimir a 2 MB: 2,00 MB.
- Girar a la derecha: 720 × 1280, mismos 14 MB y sin recomprimir.
- GIF de 4 s: 40 cuadros de 480 × 270, 1,8 MB.

**Corrección en el camino:** el campo de MB a mano no dejaba pedir menos de 1 MB.

**Límite conocido:** con video de mucho grano y tamaños muy chicos, el codificador del navegador no baja de cierta tasa de bits. En ese caso se entrega lo más liviano que logró y se avisa.

**Queda por debajo:** varios archivos a la vez (#5), unir videos (#6) y distinguir hablantes en Audio a texto (#7).

### Seguimiento W-147.4 (2026-11-23): las brechas 5 y 6

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 5 | Varios archivos a la vez | **Video a MP3**, **Convertir video** y **Comprimir video** aceptan hasta 30 archivos: se procesan uno tras otro con las mismas opciones ("Archivo 2 de 5"), uno que falla no detiene a los demás, y al final hay una lista con cada resultado (y lo que pesaba antes y después al comprimir), su botón de descarga y **todos en un ZIP**. Los archivos que no son del tipo se avisan y no entran. Con un solo archivo, todo sigue como antes (vista previa incluida) | Unitarias y E2E (dos videos a MP3 y un .txt que no entra; el ZIP trae los dos MP3) |
| 6 | Unir videos | Herramienta nueva **Unir videos** (hasta 20, con flechas para ordenarlos): cada uno se dibuja al tamaño del primero sin deformarse (bandas negras; alto máximo 1080, medidas pares) y se vuelve a codificar en un MP4 (H.264 y AAC). El audio se pasa a 48 kHz estéreo y cada tramo dura exactamente lo que su video: si a uno le falta sonido, queda en silencio y todo sigue sincronizado | Unitarias (`mergeOffsets`, `mergeSize`) y E2E (2 s de 640 × 360 + 3 s de 480 × 480 → 5 s a 640 × 360 con audio) |

### Seguimiento W-147.4 (2026-11-24): la brecha 7, distinguir hablantes

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 7 | Distinguir quién habla | Casilla **Distinguir quién habla** en Audio a texto, con "Cuántas personas hablan" (automático o de 2 a 6). Corre en el navegador como pyannote 3.1: segmentación (pyannote segmentation-3.0, MIT, 6 MB) en ventanas de 10 s cada 5 s; huella de voz de cada hablante (WeSpeaker ResNet34 cuantizado, CC BY 4.0, 6,7 MB) con el fbank de Kaldi sobre lo que habla solo; agrupamiento aglomerativo por coseno (dos voces de la misma ventana nunca se unen; los grupos con menos de 2 s se suman al más parecido) y cada segmento de Whisper va con quien más habla en él. El texto sale por intervenciones («Hablante 1 (00:00:00): …»), los nombres se cambian sin perder las correcciones del cuadro, el .srt lleva el nombre delante y el .vtt etiquetas de voz (`<v Ana>`). Los modelos se sirven desde `public/models/diarization/` y se verifica su SHA-256, como Whisper | Unitarias (powerset, fbank, grupos, turnos, textos) y con los modelos reales en Node; E2E con un diálogo de dos voces: seis intervenciones alternadas, cambio de nombre y VTT con voces |

**Medición:** en el diálogo de prueba (50 s, dos voces) la similitud entre huellas de la misma voz fue de 0,62 a 0,96 y entre voces distintas de 0,22 a 0,36 (umbral 0,5). Separar los hablantes tarda ~0,15 veces lo que dura el audio en un computador (unos 9 minutos por hora de audio), después de transcribir.

**Límites conocidos:** con dos personas hablando a la vez, el segmento va con quien más suena; Whisper no corta una frase cuando cambia el hablante, así que un cambio muy rápido puede quedar dentro del segmento anterior. Con música de fondo o voces muy parecidas puede unir o partir personas: elegir el número de hablantes lo corrige.

**Con esto queda cerrada la auditoría de Audio y video.**

