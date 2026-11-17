# Backlog — DocuSmart Web

> Barrido inicial: 2026-11-13. Repo `blackmouthriver/docusmart-web`, sitio **https://docusmart.online**.
> Cómo leerlo: cada ítem tiene **ID** (`W-xx`), **prioridad** (P0 = bloquea o es un riesgo; P3 = mejora futura),
> **responsable** (🛠️ código, se hace por PR · 👤 tú, en una consola externa) y **listo cuando** (criterio de cierre).
> Al cerrar un ítem, muévelo a "Hecho" con el PR o la fecha.

## Estado actual (hecho)

| Área | Qué hay | PR |
|---|---|---|
| Landing | Hero animado, funciones, privacidad, planes, preguntas frecuentes, sección de herramientas | inicial, #9 |
| App web (`/app/`) | Visor, convertidor (Imagen↔JPG/PNG/WebP/BMP, PDF→imagen/texto), herramientas PDF (unir, dividir, rotar, reordenar, numerar, marca de agua), QR (con QR protegido compatible con la app), Modo Estudio | inicial, #4 |
| SEO | 7 páginas propias de herramientas con texto indexable y JSON-LD; sitemap generado; `pages:check` en el CI | #9 |
| Analítica | Firebase (mismo proyecto que la app), solo con consentimiento; "Preferencias de analítica" para cambiar la decisión y borrar las cookies `_ga` | inicial, #8 |
| Legal | Política de privacidad vigente en `/privacidad` (sincronizada con `legal/` de la app); `app-ads.txt` de AdMob | #7, #8, DocuSmart#161 |
| Seguridad | Security Headers **A+**: CSP estricta con **Trusted Types**, HSTS con `preload` (enviado a hstspreload.org, pendiente), fuentes y pdf.js servidos desde el propio dominio, `security.txt` | inicial, #11 |
| DNS | `docusmart.online` y `www` (redirige) en Firebase Hosting con HTTPS; CAA (`pki.goog`, `letsencrypt.org`), SPF `-all`, DMARC `reject` | — |
| Descargas | `download()` re-empaqueta con tipos seguros (nunca `text/html`/SVG), verifica que la URL sea `blob:` propia y limpia el nombre (W-02, alerta alta de CodeQL) | #13 |
| Dependabot | `SONAR_TOKEN` también como secreto de Dependabot en la web y en la app: sus PR ya pasan SonarCloud (W-01). Fusionados #2 (sonarqube-scan-action 8.4.0) y #3 (pdf.js 6.5, Vite 8.3.7, Firebase 0.16.5), con visor, miniaturas y PDF→imagen/texto probados con Trusted Types (W-04). En la app, los PR de Dependabot además necesitan regenerar `gradle/verification-metadata.xml` (ver el backlog de la app) | #2, #3 |
| Play Store | La app está **en producción**: el botón "Disponible en Google Play" es correcto (W-03, cerrado sin cambios) | — |
| Repo y CI | Auditoría de dependencias, pruebas (29) con cobertura, build, SonarCloud (gate OK, 0 hallazgos, 59 % cobertura), Gitleaks, CodeQL, escaneo de secretos con bloqueo de push, Dependabot, `main` protegida; cada push a `main` despliega solo | #4–#11 |

---

## P0 — Bloquea o es un riesgo

_Sin pendientes P0._

## P1 — Pendientes de configuración y calidad

| ID | Ítem | Quién | Listo cuando |
|---|---|---|---|
| W-05 | **Google Search Console**: verificar el dominio (TXT en Hostinger) y enviar `sitemap.xml` | 👤 (te guío) | Search Console muestra las 10 URL descubiertas |
| W-06 | Restringir la **API key web** de Firebase a `docusmart.online`, `www` y `docusmart-8904e.web.app` (sin tocar las claves Android) | 👤 | La clave tiene la restricción "Sitios web" y la analítica sigue llegando |
| W-07 | Borrar la **cuenta de servicio sobrante** `github-action-…` (la que dice "Sin claves") del primer `firebase init` fallido | 👤 | Queda una sola cuenta `github-action-…` y el despliegue sigue funcionando |
| W-08 | **Hostinger**: verificación en dos pasos, bloqueo de transferencia del dominio y DNSSEC | 👤 | Las tres activas; el sitio sigue respondiendo |
| W-09 | **Play Console → Sitio web** = `https://docusmart.online`, y en AdMob confirmar `app-ads.txt` "Autorizado" (24-48 h después) | 👤 | AdMob lo muestra como autorizado |
| W-10 | **QA visual de la app web en celular**: revisar a 375 px las pantallas de `/app/` (Inicio, Visor, Convertidor, PDF, QR, Estudio). Hasta ahora se probó la lógica, no cada pantalla de la app en móvil | 🛠️ | Ninguna pantalla se desborda ni tiene botones inalcanzables; capturas en el PR |
| W-11 | **Pruebas de punta a punta automáticas** (Playwright) en el CI contra `vite preview` con las cabeceras de producción: landing, las 7 páginas, unir/dividir/convertir/QR y el banner de consentimiento. Fallan ante cualquier violación de CSP o Trusted Types | 🛠️ | Job en verde en el CI y exigido en la protección de `main` |

## P2 — SEO y crecimiento

| ID | Ítem | Quién |
|---|---|---|
| W-12 | **Imagen para compartir** 1200×630 (`og:image`, `twitter:card=summary_large_image`) para la landing y cada herramienta. Hoy usa una captura vertical | 🛠️ |
| W-13 | **Más páginas de herramientas**: numerar páginas, marca de agua, ordenar páginas, JPG→PNG, PNG→JPG, imagen→WebP. Solo hay que agregar entradas a `tools/pages.mjs` | 🛠️ |
| W-14 | **Versión en inglés** de la landing y las herramientas, con `hreflang` (la app ya está en 12 idiomas) | 🛠️ |
| W-15 | **Eventos clave en GA4**: marcar `landing_cta_click` (destino `play_store`) y `conversion_success` como conversiones, y armar un tablero simple | 👤 (te guío) |
| W-16 | **PWA**: manifest y service worker para instalar DocuSmart Web y usarla sin conexión. Encaja con la promesa de "nada sale de tu equipo" | 🛠️ |
| W-17 | **Lighthouse ≥ 95** en rendimiento, accesibilidad, buenas prácticas y SEO; prueba con lector de pantalla (NVDA/TalkBack) | 🛠️ |
| W-18 | **Android App Links** (`/.well-known/assetlinks.json`): que los enlaces a docusmart.online abran la app si está instalada. Requiere el SHA-256 del certificado de firma de Play | 🛠️👤 |
| W-19 | **Contenido**: guías breves ("cómo unir PDF en el celular sin subirlos", "cómo pasar fotos a PDF") que enlacen a las herramientas; publicar en AlternativeTo, Product Hunt y Uptodown | 👤🛠️ |

## Funciones nuevas en la web

Todo corre en el navegador, sin servidor, para mantener la promesa de privacidad. Las librerías pesadas (wasm) se cargan solo en la página que las usa y se sirven desde el propio dominio.

**Análisis del 2026-11-13.** Se cruzaron las herramientas de la app móvil (`features/pdftools`, `converter`, `security`, `scanner`, `study`, `agenda`) con las de iLovePDF. Las herramientas de IA en la nube de la competencia (resumir, traducir) quedan fuera: contradicen "nada sale de tu equipo".

**Hecho:** W-20 Comprimir PDF (sin pérdida con qpdf; "media" y "alta" re-dibujando páginas), W-21 Proteger y desbloquear PDF (qpdf, AES-256) y, de paso, Reparar PDF (pdf-lib reconstruye la estructura; el modo de recuperación de qpdf no funciona en wasm). Son 4 herramientas nuevas con su página propia. Ver #15. Además, W-29 **Compresor de archivos**: crear ZIP y 7Z (AES-256 opcional; en 7Z también cifra los nombres) y extraer ZIP, RAR, 7Z, TAR, GZ, BZ2 y XZ con 7-Zip en wasm, con las páginas `/comprimir-archivos` y `/descomprimir-archivos`. No se pueden crear .rar (formato propietario) y en ZIP la contraseña no admite tildes ni ñ (limitación del formato).

**Hecho:** W-22 **OCR** (página `/ocr-pdf`): imagen o PDF escaneado → texto (copiar o .txt) y PDF buscable, en español, inglés o ambos, con tesseract.js 7. El motor (variantes LSTM), los modelos `best_int` y el worker se sirven desde el propio dominio; el worker instala su propia política de Trusted Types, así que la CSP no se relajó. Avisa si la confianza del reconocimiento es baja (<60 %). "PDF a texto" ahora remite al OCR cuando el PDF no tiene texto.

**Hecho:** W-30 **Recortar PDF** (página `/recortar-pdf`): recuadro arrastrable sobre la vista previa (bordes, esquinas, mover; también con teclado), "Quitar márgenes en blanco" automático, todas las páginas o solo una. Cambia la CropBox con pdf-lib respetando la rotación de cada página; lo recortado queda oculto, no borrado (lo dice la FAQ).

**Hecho:** W-31 **Firmar PDF** (página `/firmar-pdf`): la firma se dibuja (dedo, lápiz o mouse), se escribe con letra manuscrita (Dancing Script, OFL) o se sube como foto (el fondo claro se quita solo). Se arrastra y redimensiona sobre la vista previa, en una o varias páginas ("Repetir en todas las páginas"), también con teclado, y se estampa como PNG con pdf-lib, derecha aunque la página esté rotada. Es una firma visual, no digital con certificado (lo aclaran la pantalla y la FAQ). Mejora la de la app, que solo la pone en la esquina inferior derecha.

**Hecho:** W-32 **Censurar PDF** (página `/censurar-pdf`): zonas dibujadas a mano o marcadas buscando texto (una frase sin importar tildes, todos los correos o todos los números largos). Las páginas con zonas se vuelven a dibujar como imagen a 200 ppp con las zonas en negro y el PDF se arma en un documento nuevo, sin los metadatos del original. Verificado: al extraer el texto del resultado no queda ningún dato tapado y las páginas sin zonas conservan su texto.

**Hecho:** W-33 **Comparar PDF** (página `/comparar-pdf`): diff de Myers de todo el documento, primero por líneas y luego palabra por palabra dentro de cada cambio; un párrafo nuevo no desordena el resto y los cambios de salto de línea no cuentan. Muestra cada cambio con contexto y la página en cada versión, y descarga un informe .txt. Avisa si un PDF no tiene texto (sugiere OCR). Mejora la de la app, que compara página contra página.

**Hecho:** W-34 **Extraer imágenes** (página `/extraer-imagenes-pdf`): se leen los XObject de imagen con pdf-lib (también dentro de Form XObjects y sin repetir). Las JPEG se copian byte por byte; las demás (Flate, LZW, RunLength, predictores PNG; gris, RGB, CMYK, indexado, ICC, máscaras y SMask) se decodifican y se guardan como PNG armado sin canvas. JPEG 2000, CCITT y JBIG2 se avisan como no soportadas. Galería con selección y descarga en ZIP.

**Hecho:** W-35 **Editar PDF** (página `/editar-pdf`): texto (3 familias estándar, negrita, tamaño y color; varias líneas), imágenes, rectángulos, círculos, resaltado y "Tapar" (recuadro blanco para escribir encima). Se colocan tocando o arrastrando sobre la vista previa, se mueven, se redimensionan y se borran (también con teclado), y se graban con pdf-lib como capas nuevas respetando la rotación de cada página. Mejora la de la app, que solo agrega texto.

**Hecho:** W-36 **Llenar formulario** (página `/llenar-formulario-pdf`): lee los campos AcroForm con pdf-lib (texto, casillas, opciones, desplegables y listas; obligatorios y de solo lectura), con etiquetas legibles (TU o el nombre sin prefijos como `txt`/`chk`) y sus recuadros marcados sobre la vista previa; tocar un recuadro abre su campo y al revés. Guarda con la opción de aplanar. Corrige el tamaño de letra desmedido en campos de varias líneas. Los formularios XFA y los PDF sin campos remiten a "Editar PDF".

**Hecho:** W-37 **Herramientas de imagen** (sección `#/imagen` y páginas `/comprimir-imagen`, `/redimensionar-imagen`, `/recortar-imagen`, `/rotar-imagen`): comprimir en 3 niveles (JPEG, o WebP si hay transparencia; si no se gana nada devuelve la original), redimensionar por porcentaje o pixeles, recortar libre o 1:1/4:3/3:4/16:9/9:16 (reutiliza el editor de Recortar PDF) y rotar/voltear, varias imágenes a la vez con descarga en ZIP. Respetan la orientación EXIF y quitan los metadatos (GPS). De paso: `.stack > *` y `.file-list > *` con `min-width: 0`, porque un nombre de archivo largo desbordaba las tarjetas en el celular en todas las herramientas.

**Hecho:** W-24 **Escáner** (página `/escanear-documento`): foto con la cámara del celular (`capture="environment"`) o desde la galería; detector propio sin OpenCV (umbral de Otsu + zona clara más grande + esquinas extremas), esquinas ajustables (arrastre y teclado), enderezado con homografía e interpolación bilineal, giro, filtros Documento (blanquea el papel dividiendo por el fondo), B/N adaptativo, Gris y Color; varias páginas reordenables → PDF de ancho A4 o JPG, y PDF buscable con el OCR existente.

### Siguientes

Con W-38 queda cubierta la paridad con la app e iLovePDF en herramientas de PDF.

**Hecho:** **PDF a Word** (página `/pdf-a-word`, en el Convertidor): reconstruye párrafos, títulos por tamaño, negrita y cursiva (nombre real de la fuente vía `fontExtraProperties` de pdf.js), listas, tablas por columnas alineadas, imágenes en su lugar, centrado y saltos de página; escribe el .docx a mano con fflate. Probado con un PDF exportado por Word y reabierto en Word: estructura, fuente, tamaños y tabla iguales. No reproduce colores del texto ni bordes decorativos. 

**Hecho:** **PDF a Excel** (página `/pdf-a-excel`): cada línea es una fila y las columnas salen de la alineación (umbral fino); celdas de dos líneas unidas; números (1.500.000, $ 2.000, 3,5, 45 %) como números de Excel con formato; una hoja por página o todo en una; .xlsx escrito a mano. Probado con un extracto exportado por Word y abierto en Excel: columnas correctas y sumas exactas.

**Hecho:** W-23 **Word y Excel a PDF** (páginas `/word-a-pdf` y `/excel-a-pdf`, en el Convertidor): Word con mammoth (se usa su árbol de documento, no su HTML, por la CSP) y Excel con read-excel-file; diagramador propio con pdf-lib: títulos, negrita/cursiva/subrayado, listas numeradas y con viñetas, tablas con encabezado repetido en cada página, imágenes PNG/JPEG, saltos de página; Excel: una tabla por hoja, números con formato colombiano a la derecha, página horizontal con más de 6 columnas. Usa fuentes estándar de PDF (Helvetica), así que el diseño exacto puede variar. Rechaza .doc/.xls con un mensaje claro. PowerPoint a PDF sigue solo en la app (no hay forma viable de reproducir el diseño en el navegador).

**Hecho:** W-38 **PDF a PDF/A** (página `/pdf-a-pdfa`, en Herramientas PDF): crea PDF/A-2b con pdf-lib, validado con veraPDF (PDF de Word, Excel y Edge, formularios, escaneos y PDF con fuentes estándar). Perfil sRGB escrito a mano, XMP coherente con Info, sin JavaScript/adjuntos/acciones prohibidas, anotaciones imprimibles, campos sin apariencia regenerados; las 14 fuentes estándar se incrustan con las libres de pdf.js (anchos leídos de las propias fuentes con `scripts/std-font-widths.mjs` → `pdfaFonts.json`); las páginas con CMYK o fuentes no incluidas que no son estándar pasan a imagen (avisando).

### Después (paridad con la app e iLovePDF)

Sin pendientes: todas las herramientas de la app y de iLovePDF que se pueden hacer en el navegador ya están (PowerPoint a PDF sigue solo en la app).

## Vista previa del documento y más formas de guardar (2026-11-17)

Tus pendientes (cuentas, consolas y decisiones) están reunidos en [`PENDIENTES.md`](PENDIENTES.md).

Objetivo: en todas las herramientas, (1) al subir el archivo se ve el documento con su número de páginas y su peso; (2) al usar la herramienta se ve el **resultado** antes de guardarlo (con la opción de alternar con el original); (3) además de descargar, hay más formas de guardar o enviar. Primero un piloto; con el visto bueno se extiende al resto.

| ID | Ítem | Quién | Estado / qué hace falta |
|---|---|---|---|
| W-40 | **Piloto en Comprimir PDF**: **antes y después lado a lado** con título propio de la herramienta ("Así quedó tu PDF comprimido"), un solo control de páginas para las dos vistas y comparación de peso; guardar con **Descargar**, **Compartir** (hoja del sistema), **Google Drive** y **Dropbox**; al final, sección para **recomendar DocuSmart** (WhatsApp, Facebook, X, LinkedIn, copiar enlace, calificar en Google Play, enviar opinión). Ya no se descarga solo | 🤖 | Hecho (PR #34, 2026-11-17) |
| W-41 | Extender a las herramientas PDF de **un archivo → un PDF**: dividir (extraer páginas), rotar, reordenar, numerar, marca de agua, proteger (el resultado se muestra con la contraseña), desbloquear, reparar, OCR (también con fotos), recortar, firmar, censurar, editar, formulario y PDF/A | 🤖 | Hecho (PR #35, 2026-11-17) |
| W-42 | Herramientas con **varios archivos**: Unir (miniaturas de los PDF de entrada y el PDF unido), Dividir cada página (miniaturas de las páginas y un ZIP para guardar), Extraer imágenes (miniaturas de las elegidas; se guarda la imagen o un ZIP) y Comparar (original y nueva versión lado a lado; se guarda el informe de cambios) | 🤖 | Hecho (PR #36, 2026-11-17) |
| W-43 | **Convertidor**: antes y después en las 12 conversiones; la vista previa muestra PDF, imágenes, texto y también **Word y Excel** (se diagraman a PDF para mostrar sus páginas, marcado como vista aproximada); varias imágenes o páginas salen como miniaturas y se guardan en un ZIP | 🤖 | Hecho (PR #37, 2026-11-17) |
| W-44 | **Imagen, escáner, archivos y QR**: antes y después en comprimir, redimensionar, rotar y recortar imagen (una en grande, varias en miniaturas y ZIP); escáner (escaneos → PDF o imágenes); crear ZIP/7Z (archivos → comprimido) y extraer (comprimido → lo que había dentro, todo en un ZIP); QR con Descargar, Compartir y Drive/Dropbox. La vista previa reconoce cualquier tipo de archivo | 🤖 | Hecho (PR #38, 2026-11-17) |
| W-45 | **Guardar en Google Drive** directo: OAuth en ventana emergente (sin SDK, compatible con la CSP) y subida con el permiso mínimo `drive.file` | 👤 + 🤖 | **Código listo** (PR #34); el botón aparece cuando pongas el **ID de cliente OAuth** en `src/shared/cloud/cloudConfig.ts`. Falta que lo crees en Google Cloud (proyecto de Firebase): tipo "Aplicación web", origen `https://docusmart.online`, redirección `https://docusmart.online/oauth`, pantalla de consentimiento con el permiso `drive.file` |
| W-46 | **Guardar en Dropbox** directo: OAuth con PKCE en ventana emergente y subida a Aplicaciones/DocuSmart | 👤 + 🤖 | **Código listo** (PR #34); falta que crees la app en Dropbox Developers (Scoped access, "App folder", permiso `files.content.write`, redirección `https://docusmart.online/oauth`) y pongas la **App key** en `cloudConfig.ts` |
| W-47 | **Enlace y código QR** para abrir el resultado en otro dispositivo | 👤 decide | Implica **subir el archivo** a un servidor, lo que cambia la promesa "tus archivos no salen del navegador". Propuesta: cifrado de extremo a extremo en el navegador (AES-GCM, la clave va en el `#` del enlace y el servidor nunca la ve), Firebase Storage con borrado automático a las 24 h, límite de tamaño y App Check. Requiere plan Blaze y actualizar la política de privacidad. Alternativa sin guardar nada: QR con transferencia directa entre dispositivos (WebRTC, ambos abiertos a la vez; necesita un servidor de señalización) |
| W-48 | **WhatsApp en computador**: la web no puede adjuntar un archivo a WhatsApp Web; solo se puede mandar un enlace | 🤖 | Depende de W-47 (en el celular ya funciona con Compartir) |

## Idiomas y apariencia, como en la app (2026-11-17)

Objetivo: la web en los **12 idiomas de la app** (español, inglés, portugués, alemán, ruso, japonés, coreano, chino, italiano, francés, catalán y euskera), elegido solo según el idioma del navegador (con la zona horaria como respaldo; no se consulta la IP para no enviar datos a terceros), y un panel de **Ajustes** para cambiar el idioma, el **tema** (Sistema, Claro, Oscuro), el **color de acento** (los 10 de la app) y el **tamaño de letra** (Normal, Grande, Muy grande). Se guarda en el navegador.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-50 | **Infraestructura de idiomas**: detección (guardado → idioma del navegador → zona horaria → español), diccionarios por idioma cargados bajo demanda, `t()` con variables, `<html lang>` y textos que faltan caen al español | 🤖 | Hecho (PR #39, 2026-11-17) |
| W-51 | **Panel de Ajustes** (botón en la cabecera de cada pantalla y en la barra lateral): idioma con banderas como en la app, tema, color de acento y tamaño de letra; modo oscuro completo | 🤖 | Hecho (PR #39, 2026-11-17) |
| W-52 | Traducir la **navegación, Inicio y avisos generales** a los 12 idiomas | 🤖 | Hecho (PR #39, 2026-11-17) |
| W-53a | Traducir los **componentes compartidos** (vista previa, guardar, recomendar), la lista de herramientas PDF, unir, dividir, rotar, reordenar, numerar, marca de agua, comprimir, proteger, desbloquear, reparar, PDF/A y OCR | 🤖 | Hecho (PR #40, 2026-11-17) |
| W-53b | Traducir recortar, firmar, censurar, editar, formulario, comparar, extraer imágenes y escáner | 🤖 | Hecho (PR #41, 2026-11-17) |
| W-54 | Traducir **Convertidor, imagen, archivos, QR, escáner y Modo Estudio** + visor y mensajes de error | 🤖 | Hecho (PR #42, 2026-11-17) |
| W-55a | Páginas para buscadores por idioma: generador con `tools/locales/<idioma>.mjs`, `hreflang`, sitemap con alternativas, selector de idioma, herramienta y banner de analítica en el idioma de la página. **Inglés completo** (`/en/` y 31 herramientas) | 🤖 | Hecho (PR #43, 2026-11-17) |
| W-55b | Las mismas páginas en **portugués, francés e italiano** (`/pt/`, `/fr/`, `/it/`) | 🤖 | Hecho (PR #44, 2026-11-17) |
| W-55c | Las mismas páginas en **alemán, catalán y euskera** (`/de/`, `/ca/`, `/eu/`) | 🤖 | Hecho (PR #45, 2026-11-17) |
| W-55d | Las mismas páginas en **ruso, japonés, coreano y chino** (slugs en inglés) | 🤖 | Hecho (PR #46, 2026-11-17) |
| W-56 | Textos que van **dentro de los archivos** generados (numeración "Página N", informes) en el idioma elegido | 🤖 | Hecho (PR #47, 2026-11-17) |
| W-57 | Los enlaces de **compartir/recomendar** (`toolShareUrl`) apuntan a la página en español; que lleven a la del idioma del usuario (`/en/merge-pdf`…) | 🤖 | Hecho (PR #49) |

## Modo Estudio, como en la app y mejor para la web (2026-11-17)

Referencia: Modo Estudio de la app (`docsmart/app/.../features/study`), solo de consulta. Hoy la web tiene un
lector de oraciones con lista de voces técnicas, notas de texto y Pomodoro. La app tiene **10 personajes de voz
ilustrados** (Sofía, Mateo, Valentina, Diego, Camila, Sebastián, Isabella, Emilio, Lucía, Nicolás), lectura
por párrafos con progreso y retomar, resaltados, resumen local, notas completas, estadísticas y agenda.
Todo sigue siendo local: nada de IA ni voces en la nube.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-58 | **Personajes de voz**: los 10 personajes de la app (mismo nombre, ilustración y color de anillo) en vez de nombres técnicos. Selector visual con avatar, idioma y botón "Escuchar muestra" ("Hola, soy Sofía…"); voz elegida guardada. Un personaje distinto por voz y del mismo género: tabla de voces conocidas de navegador (Microsoft Sabina/Helena/Raúl/Pablo…, Google, Apple) y asignación estable sin repetir; voces de género desconocido toman cualquier personaje libre. Lógica pura en `features/study/core` con pruebas; imágenes en `public/img/voices/` | 🤖 | Hecho (PR #56) |
| W-59 | **Menú del Modo Estudio** con tarjetas (Lectura, Notas, Pomodoro, Resumen) como en la app, en vez de pestañas: cada función en su propia vista (`#/estudio/lectura`, `/notas`, `/pomodoro`) y Modo Estudio se despliega en la barra lateral con las tres. Pomodoro y lectura siguen corriendo al cambiar de vista y su estado se ve en la tarjeta | 🤖 | Hecho (PR #59) |
| W-60 | **Lector por párrafos**: barra de reproducción con anterior/siguiente párrafo, tocar un párrafo para leer desde ahí, velocidad cambiable durante la lectura, barra de "% escuchado", desplazamiento automático y aviso "Terminaste de leer" con "Volver a leer". Párrafos cortos para evitar el corte de Chrome en textos largos | 🤖 | Hecho (PR #58) |
| W-60b | **Vista del documento al leer**, como en la app: al subir un PDF, elegir entre ver el **documento** (páginas del PDF, resaltando la que se lee) o el **texto**; mostrar el número de páginas, las páginas leídas y el porcentaje ("Página 3 de 12 · 25 %") | 🤖 | Hecho (PR #61) |
| W-80 | **Editar el documento que se lee sin perder su formato**: en Lectura, "Editar texto" pasa a "Editar texto a leer" (cambia solo lo que se escucha); con un PDF, **Editar documento** abre Editar PDF con el mismo archivo (vista previa, descargar, compartir, nube); con un TXT, el texto editado se descarga o comparte como `.txt` con el mismo nombre | 🤖 | Hecho (PR #62) |
| W-81 | **Reemplazar texto en Editar PDF**: tocar una línea del PDF la tapa con blanco y escribe el cambio en el mismo lugar y tamaño, con la fuente estándar más parecida (Helvetica/Times/Courier, negrita si corresponde) y el color de la tinta original. Límite: solo alfabeto latino, la fuente original no se copia | 🤖 | Hecho (PR #63) |
| W-61 | **Abrir más documentos para leer**: Word (`.docx`) además de PDF y TXT; PDF escaneado → ofrecer OCR (ya existe en la web) en vez de "sin texto"; **foto de una página** → OCR directo; arrastrar y soltar | 🤖 | Hecho (PR #67) |
| W-62 | **Retomar lectura**: lista de documentos recientes con su progreso ("Página 3 de 12 · Continuar leyendo"), guardada solo en el navegador; quitar de la lista | 🤖 | Hecho (PR #64) |
| W-63 | **Resaltar párrafos** mientras se escucha ("Marcar párrafo actual") y pasarlos a Notas | 🤖 | Hecho (PR #65) |
| W-64 | **Resumen local** (extractivo, port de `TextSummarizer` de la app): elige las oraciones más relevantes, sin IA en la nube; copiar, descargar o leer en voz alta. Mejora web: palabras vacías en los 12 idiomas | 🤖 | Hecho (PR #66) |
| W-65 | **Notas completas**: título, editar, exportar todas o una (TXT y PDF) e imágenes adjuntas (guardadas en IndexedDB). Dictado por voz **descartado**: en Chrome el reconocimiento envía el audio a Google y rompe la promesa de privacidad | 🤖 | En revisión |
| W-66 | **Estadísticas de estudio**: tiempo total escuchado, pomodoros de la semana con barras por día y total | 🤖 | Pendiente |
| W-67 | **Mejoras propias de la web**: atajos de teclado (espacio = leer/pausar, flechas = párrafo), controles desde auriculares y pantalla bloqueada (Media Session), pantalla encendida mientras se lee (Wake Lock) y aviso del navegador al terminar un Pomodoro (Notification, con permiso) | 🤖 | Pendiente |
| W-68 | **Agenda y recordatorios** (en la app: agenda/calendario y "recordarme repasar"). En la web solo avisaría con la pestaña abierta; evaluar después de W-58..W-67 | 👤 decidir | Pendiente |

Orden sugerido: W-58 → W-60 → W-59 → W-62/W-63 → W-64 → W-61 → W-65 → W-66 → W-67. Cada ítem en su PR, en los 12
idiomas, con revisión de punta a punta en el navegador.

## Códigos QR, como en la app y mejor para la web

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-69 | **Revisar y refinar la creación de códigos QR** frente a la app (tipos de contenido, diseño, QR protegido, leer) y proponer mejoras propias de la web; el análisis se convierte en ítems W-xx aquí. Se hace **después** del Modo Estudio (W-58..W-67) | 🤖 | Pendiente |

## Asistente de chat en todo el sitio

Análisis completo, con requisitos funcionales y no funcionales, criterios de aceptación, tecnologías y costos, en
[`docs/CHATBOT.md`](CHATBOT.md). Asistente **local** (nada sale del navegador), **USD 0 al mes**; sin widgets de
terceros ni IA en la nube.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-70 | **Aprobar la propuesta** de `docs/CHATBOT.md` (opción A local; B con la IA del navegador como fase 2) | 👤 decidir | Pendiente |
| W-70a | Base de conocimiento por idioma generada desde `tools/` + preguntas propias (es, en); validación en el CI | 🤖 | Pendiente |
| W-70b | Motor de búsqueda local (tildes, sinónimos, tipeos) en `core/` con pruebas y preguntas de prueba | 🤖 | Pendiente |
| W-70c | Widget en la app web: botón, panel accesible, sugerencias por pantalla y acciones que abren herramientas | 🤖 | Pendiente |
| W-70d | Widget en la portada y las páginas de herramientas, cargado bajo demanda, en los 12 idiomas | 🤖 | Pendiente |
| W-70e | Base traducida a los 10 idiomas restantes, analítica con consentimiento (solo IDs) y párrafo en la política de privacidad | 🤖 | Pendiente |
| W-70f | (Opcional) Respuestas redactadas con la IA local del navegador (Chrome Prompt API) cuando esté disponible | 🤖 | Pendiente |

## Diseño visual y animaciones de todo el sitio

Hoy la portada tiene animaciones y el resto se ve plano. Se empieza por la **política de privacidad** y desde ahí se
revisa página por página con el usuario. Reglas para todas: animaciones con `transform` y `opacity`, respetar
`prefers-reduced-motion`, nada de librerías ni recursos externos (por la CSP), modo oscuro y sin empeorar el
rendimiento (Lighthouse).

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-71 | **Política de privacidad con diseño propio**: encabezado con degradado e ícono como la portada; resumen "en 30 segundos" con tarjetas (qué se procesa, qué no se sube, analítica opcional, contacto); índice lateral fijo que marca la sección visible; cada sección como tarjeta con ícono; aparición suave al desplazar; botón "volver arriba"; ancho de lectura cómodo; modo oscuro; versión para imprimir. **El texto legal no cambia** (sigue sincronizado con la app) | 🤖 | Pendiente |
| W-72 | **Sistema de movimiento común**: duraciones y curvas compartidas, utilidad de aparición al desplazar (IntersectionObserver), transiciones entre páginas (View Transitions API, donde exista) y microinteracciones de botones y tarjetas, para reutilizar en todo el sitio | 🤖 | Pendiente |
| W-73 | **Páginas de herramientas** (372): encabezado animado, pasos ilustrados, FAQ con apertura animada y herramienta con entrada suave | 🤖 | Pendiente |
| W-74 | **App web**: transiciones entre pantallas, estados de carga con esqueletos, animación al terminar un proceso (éxito/descarga) y menús/paneles con movimiento | 🤖 | Pendiente |
| W-75 | **Portada**: revisión con el usuario de lo que ya tiene y ajustes de coherencia con lo nuevo | 🤖 + 👤 | Pendiente |

Orden: W-71 → revisar con el usuario → W-72 → W-73/W-74 → W-75.

## Herramientas ordenadas por categoría

Hoy la portada lista las 31 herramientas una tras otra, y la app las muestra repartidas sin un orden claro. La idea:
la portada solo **presenta** que hay herramientas y lleva a ellas; el orden y la elección se hacen en una vista de
herramientas **por categoría** y **en orden alfabético** dentro de cada una.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-76 | **Catálogo único de herramientas** (fuente de verdad compartida por portada, páginas y app): id, categoría, ícono, enlace a su página y a la app. Categorías propuestas, a validar con el usuario: *Organizar PDF* (unir, dividir, rotar, reordenar, numerar), *Editar y firmar* (editar, firmar, llenar formulario, marca de agua, recortar, censurar), *Seguridad* (proteger, desbloquear, reparar), *Optimizar y archivar* (comprimir, PDF/A, comparar, extraer imágenes), *Convertir* (de y a PDF, Word, Excel, imagen, texto), *Imagen* (comprimir, redimensionar, recortar, rotar), *Escanear y OCR*, *Archivos comprimidos*, *QR y estudio* | 🤖 + 👤 | Pendiente |
| W-77 | **Portada**: la sección de herramientas deja de listar las 31 y muestra un resumen claro ("31 herramientas gratis") con una tarjeta animada por categoría (ícono, nombre, cantidad) que lleva a esa categoría, y un botón "Ver todas las herramientas". En los 12 idiomas | 🤖 | Pendiente |
| W-78 | **Página "Todas las herramientas"** (`/herramientas`, `/en/tools`… en los 12 idiomas, indexable y en el sitemap): herramientas agrupadas por categoría, **orden alfabético dentro de cada categoría según el idioma** (`Intl.Collator`), accesos rápidos a cada categoría y un buscador que filtra mientras se escribe. "Más herramientas" de cada página de herramienta lleva aquí | 🤖 | Pendiente |
| W-79 | **App web**: la pantalla de herramientas usa las mismas categorías y el mismo orden alfabético, con buscador; el inicio muestra las categorías como accesos | 🤖 | Pendiente |

Orden: W-76 (validar categorías) → W-78 → W-77 → W-79. Encaja con el diseño visual (W-72) para las animaciones.

## Mantenimiento y limpieza

| ID | Ítem | Quién | Fecha |
|---|---|---|---|
| W-29 | **Arquitectura de la web por dominio y capas**: `src/features/<dominio>/{ui,core,infra}`, `src/shared/`, `src/entries/`; HTML en `site/`, pruebas en `tests/unit/`; `CLAUDE.md` con la guía del proyecto | 🤖 | En revisión (PR), 2026-11-17 |
| W-25 | Limpiar el repo de la app: carpeta `website/`, rama local `claude/sitio-web` y `docusmart-web.zip` (copias viejas de la landing) | 🛠️ (esperando tu OK) | — |
| W-26 | Seguimiento de HSTS preload: de *pending* a *preloaded* en hstspreload.org. **Nunca quitar** la cabecera HSTS de `firebase.json` | 👤 | revisar en diciembre de 2026 |
| W-27 | Renovar `public/.well-known/security.txt` (campo `Expires`) | 🛠️ | antes del 2027-10-16 |
| W-28 | Certificados de Firebase (vencen el 2027-02-11): se renuevan solos; confirmar que siguen válidos. Los CAA ya permiten `pki.goog` y `letsencrypt.org` | 👤 | enero de 2027 |
