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
| W-10 | **QA visual de la app web en celular**: revisar a 375 px las pantallas de `/app/` (Inicio, Visor, Convertidor, PDF, QR, Estudio). Hasta ahora se probó la lógica, no cada pantalla de la app en móvil | 🛠️ | Ninguna pantalla se desborda ni tiene botones inalcanzables; capturas en el PR. **Hecho (PR #107)**: 33 pantallas sin desbordes; espacio inferior para el botón del asistente, botones de ícono de 40 px, casillas de 18 px y enlaces del pie más altos |
| W-11 | **Pruebas de punta a punta automáticas** (Playwright) en el CI contra `vite preview` con las cabeceras de producción: landing, las 7 páginas, unir/dividir/convertir/QR y el banner de consentimiento. Fallan ante cualquier violación de CSP o Trusted Types | 🛠️ | Job en verde en el CI y exigido en la protección de `main` **Hecho (PR #113)**: 21 pruebas (portada, /en/, privacidad, /herramientas, unir PDF, PNG→JPG, proteger PDF, app, ajustes, QR, asistente, ayuda de Desktop y sin conexión), en escritorio y celular, fallan ante cualquier error de consola o de CSP; el despliegue las espera |

## P2 — SEO y crecimiento

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-12 | **Imagen para compartir** 1200×630 (`og:image`, `twitter:card=summary_large_image`) para la landing y cada herramienta. Hoy usa una captura vertical | 🛠️ | Hecho (PR #104; una imagen por idioma, `scripts/og-images.py`) |
| W-13 | **Más páginas de herramientas**: numerar páginas, marca de agua, ordenar páginas, JPG→PNG, PNG→JPG, imagen→WebP. Solo hay que agregar entradas a `tools/pages.mjs` | 🛠️ | Hecho (PR #105): ordenar, numerar, marca de agua, JPG→PNG, PNG→JPG e imagen→WebP (37 herramientas × 12 idiomas) |
| W-14 | **Versión en inglés** de la landing y las herramientas, con `hreflang` (la app ya está en 12 idiomas) | 🛠️ | Hecho (portada y herramientas en 12 idiomas con `hreflang`) |
| W-15 | **Eventos clave en GA4**: marcar `landing_cta_click` (destino `play_store`) y `conversion_success` como conversiones, y armar un tablero simple | 👤 (te guío) | Pendiente |
| W-16 | **PWA**: manifest y service worker para instalar DocuSmart Web y usarla sin conexión. Encaja con la promesa de "nada sale de tu equipo" | 🛠️ | Hecho (PR #106, #108, #109, #110 y #111; probado por el usuario sin conexión el 2026-11-18): instalable como **DocuSmart Desktop**, funciona sin conexión (descarga todas las herramientas salvo el OCR), se actualiza sola con aviso «Actualizar», una sola ventana, ayuda para instalarla y crear el ícono del escritorio, y respuestas en el asistente |
| W-17 | **Lighthouse ≥ 95** en rendimiento, accesibilidad, buenas prácticas y SEO; prueba con lector de pantalla (NVDA/TalkBack) | 🛠️ | Hecho (PR #114): PageSpeed 100 en las 4 categorías (W-93) y revisión automática con axe (WCAG 2.2 AA) en el CI: 12 páginas en escritorio y celular, diálogos, asistente y modo oscuro, sin problemas. Arreglos: contraste del gris atenuado y de las insignias de formato, nombre accesible del selector de idioma y tablas desplazables con teclado. Queda opcional una pasada manual con NVDA/TalkBack |
| W-18 | **Android App Links** (`/.well-known/assetlinks.json`): que los enlaces a docusmart.online abran la app si está instalada. Requiere el SHA-256 del certificado de firma de Play | 🛠️👤 | ✅ **Hecho** (2026-11-20): `assetlinks.json` con el certificado de firma de Play y la app 1.1.6 (código 12) en producción con el `intent-filter`; en un teléfono real `pm get-app-links` muestra `docusmart.online: verified` y /comprimir-pdf abre la app directo. Abre las 28 herramientas que también tiene la app; el resto sigue en el navegador |
| W-19 | **Contenido**: guías breves ("cómo unir PDF en el celular sin subirlos", "cómo pasar fotos a PDF") que enlacen a las herramientas; publicar en AlternativeTo, Product Hunt y Uptodown | 👤🛠️ | **Guías hechas** (2026-11-18): `/guias` con 6 guías en español (`tools/guides.mjs`), datos estructurados Article/HowTo/FAQ, sitemap y enlaces desde las herramientas en español. **En los 12 idiomas** (2026-11-20): `tools/guides/<idioma>.mjs` (en, pt, fr, it, de, ca, eu, ru, ja, ko, zh), con hreflang, selector de idioma y sitemap (72 guías). Faltan: más guías y publicar en directorios (👤) |

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
| W-45 | **Guardar en Google Drive** directo: OAuth en ventana emergente (sin SDK, compatible con la CSP) y subida con el permiso mínimo `drive.file` | 👤 + 🤖 | ✅ **Activado** (2026-11-20): ID de cliente OAuth "DocuSmart Web" (proyecto docusmart-8904e, app en producción, permisos no sensibles `drive.file` y `drive.appdata`, Google Drive API habilitada). Sin límite de usuarios |
| W-46 | **Guardar en Dropbox** directo: OAuth con PKCE en ventana emergente y subida a Aplicaciones/DocuSmart | 👤 + 🤖 | ✅ **Activado** (2026-11-20): app "DocuSmart Web" en Dropbox (carpeta de la app, `files.content.write`, clientes públicos con PKCE, vuelta a /oauth). En "Desarrollo" admite hasta 500 usuarios con "usuarios adicionales"; **pendiente (👤): "Solicitar para producción"** cuando haya uso real |
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
| W-148 | **Más apariencia** (pedido del usuario 2026-11-23): botón de buscar de la barra plegada con el tema; 16 degradados de dos colores (cabecera y barra lateral de color); Negro y Azul profundo; el fondo de la página toma un toque del acento (contraste ≥ 4,5:1); carrusel de categorías difuminado en los bordes | 🤖 | ✅ Hecho (PR #183, 2026-11-23) |

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
| W-65 | **Notas completas**: título, editar, exportar todas o una (TXT y PDF) e imágenes adjuntas (guardadas en IndexedDB). Dictado por voz **descartado**: en Chrome el reconocimiento envía el audio a Google y rompe la promesa de privacidad | 🤖 | Hecho (PR #68) |
| W-66 | **Estadísticas de estudio**: tiempo total escuchado, pomodoros de la semana con barras por día y total | 🤖 | Hecho (PR #69) |
| W-67 | **Mejoras propias de la web**: atajos de teclado (espacio = leer/pausar, flechas = párrafo), controles desde auriculares y pantalla bloqueada (Media Session), pantalla encendida mientras se lee (Wake Lock) y aviso del navegador al terminar un Pomodoro (Notification, con permiso) | 🤖 | Hecho (PR #70) |
| W-68 | **Agenda y recordatorios** (en la app: agenda/calendario y "recordarme repasar"). En la web solo avisaría con la pestaña abierta; evaluar después de W-58..W-67 | 👤 decidir | ✅ Cubierto por W-126 (Agenda local en Modo Estudio, con recordatorios y .ics) |

Orden sugerido: W-58 → W-60 → W-59 → W-62/W-63 → W-64 → W-61 → W-65 → W-66 → W-67. Cada ítem en su PR, en los 12
idiomas, con revisión de punta a punta en el navegador.

## Códigos QR, como en la app y mejor para la web

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-69 | **Revisar y refinar la creación de códigos QR** frente a la app (tipos de contenido, diseño, QR protegido, leer) y proponer mejoras propias de la web; el análisis se convierte en ítems W-xx aquí. Se hace **después** del Modo Estudio (W-58..W-67) | 🤖 | Hecho (análisis, 2026-11-17): ítems W-82 a W-88 |

### Resultado del análisis (W-69)

Referencia: QR de la app (`docsmart/.../features/scanner`: `QrContentFormat.kt`, `QrScreen.kt`, `QrDesignSection.kt`,
`QrHistoryScreen.kt`), solo de consulta. **Hoy la web** tiene una sola pantalla: crear un QR de texto o enlace (normal o
protegido con contraseña, compatible con la app) y leer con la cámara o desde una imagen. **La app** además tiene 9 tipos
de contenido, un lector que reconoce el tipo y ofrece acciones, diseño (8 colores con aviso de contraste y logo) e
historial de creados y leídos.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-82 | **Menú de QR con vistas** *Crear*, *Leer* e *Historial* (`#/qr/crear`, `/leer`, `/historial`) y submenú lateral, igual que el Modo Estudio | 🤖 | Hecho (PR #72; Historial agregado en W-87) |
| W-83 | **Tipos de contenido al crear**, con los mismos formatos estándar de la app para que cualquier lector los entienda: URL, Texto, Email (`mailto:`), Teléfono (`tel:`), **Wi-Fi** (`WIFI:T:WPA;S:…;P:…;;`, con escape de `\ ; , : "`), **Contacto** (vCard 3.0) y **Evento** (iCalendar `VEVENT`); validaciones como en la app (clave Wi-Fi, nombre del contacto, fin después del inicio). Se mantiene la opción *Protegido* | 🤖 | Hecho (PR #73) |
| W-84 | **Lector inteligente**: reconoce el tipo y ofrece la acción que corresponde (abrir enlace mostrando el **dominio** antes de abrir, escribir correo, llamar, copiar; Wi-Fi: nombre de red y copiar clave; contacto: descargar `.vcf`; evento: descargar `.ics`). Mejoras web: bloquea esquemas peligrosos (`javascript:`, `data:`), usa el lector nativo del navegador (`BarcodeDetector`) cuando existe y permite **pegar una imagen** con Ctrl+V | 🤖 | Hecho (PR #74) |
| W-85 | **Diseño del QR**: los 8 colores de la app con el aviso de contraste (no deja generar uno que la cámara no leería), **logo centrado** (con corrección de errores alta para que siga leyéndose) y tamaño | 🤖 | Hecho (PR #76) |
| W-85b | **Ajustar el logo y dejarlo circular** (pedido del usuario): al subir el logo se encuadra arrastrando y acercando, con vista previa circular; en el QR (PNG y SVG) queda en un círculo con borde blanco en vez de un cuadrado | 🤖 | Hecho (PR #79) |
| W-86 | **Guardar y compartir**: PNG en alta resolución, **SVG** (vector para imprimir sin perder calidad), copiar la imagen, imprimir, y Descargar/Compartir/nube con las opciones de siempre | 🤖 | Hecho (PR #77) |
| W-87 | **Historial local** de QR creados y leídos (como la app), solo en este navegador: la vista previa oculta el contenido protegido, la clave Wi-Fi y los datos de contacto; volver a abrir, borrar uno o vaciar todo | 🤖 | Hecho (PR #78) |
| W-88 | **QR de una imagen o un documento** (en la app apunta a un archivo del propio celular y solo funciona ahí). En la web solo es posible subiendo el archivo: **depende de la decisión de W-47** | 👤 decidir | Pendiente |

Orden sugerido: W-82 → W-83 → W-84 → W-85 → W-86 → W-87. Cada ítem en su PR, en los 12 idiomas y con prueba de punta a
punta (crear con la web y leer con la app y con otro lector).

## Asistente de chat en todo el sitio

Análisis completo, con requisitos funcionales y no funcionales, criterios de aceptación, tecnologías y costos, en
[`docs/CHATBOT.md`](CHATBOT.md). Asistente **local** (nada sale del navegador), **USD 0 al mes**; sin widgets de
terceros ni IA en la nube.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-70 | **Aprobar la propuesta** de `docs/CHATBOT.md` (opción A local; B con la IA del navegador como fase 2) | 👤 decidir | Hecho (2026-11-18: el usuario pidió seguir con el chatbot → opción A, local y USD 0) |
| W-70a | Base de conocimiento por idioma generada desde `tools/` + preguntas propias (es, en); validación en el CI | 🤖 | Hecho (PR #93) |
| W-70b | Motor de búsqueda local (tildes, sinónimos, tipeos) en `core/` con pruebas y preguntas de prueba | 🤖 | Hecho (PR #93) |
| W-70c | Widget en la app web: botón, panel accesible, sugerencias por pantalla y acciones que abren herramientas | 🤖 | Hecho (PR #94) |
| W-70d | Widget en la portada y las páginas de herramientas, cargado bajo demanda, en los 12 idiomas | 🤖 | Hecho (PR #94) |
| W-70e | Base traducida a los 10 idiomas restantes, analítica con consentimiento (solo IDs) y párrafo en la política de privacidad | 🤖 | Hecho (PR #95) |
| W-70f | (Opcional) Respuestas redactadas con la IA local del navegador (Chrome Prompt API) cuando esté disponible | 🤖 | Hecho (PR #97) |
| W-70g | **"Enviar esta pregunta"** cuando el asistente no sabe responder: abre un correo a soporte con la pregunta ya escrita; el usuario decide si lo envía (nada se manda solo). Sirve para conocer las preguntas reales y mejorar la base (ver `docs/CHATBOT.md`, sección 8) | 🤖 | Hecho (PR #103) |

### De chatbot a asistente, por capas (W-151, pedido del usuario 2026-11-23)

Hoy el asistente es un **chatbot de preguntas frecuentes**. El motor local (`engine.ts`, tipo BM25) elige una de unas
410 respuestas por idioma, y la IA del navegador (Gemini Nano, W-70f) solo la reescribe. El objetivo es que además
**haga cosas por el usuario**:
- abrir la herramienta con el archivo y las opciones ya puestos;
- encadenar pasos (escanear → unir → firmar);
- saber en qué pantalla está el usuario, qué archivo cargó y qué error le salió;
- proponer el siguiente paso.

**Regla de diseño: cuatro capas, cada una funciona aunque falten las de encima.** La capa 1 responde siempre, en
todos los navegadores y en los 12 idiomas. Las capas 2 y 3 también funcionan en todos los navegadores. La capa 4 solo
está en Chrome de computadora con equipo compatible (hoy en `es`, `en` y `ja`), así que **nunca** es requisito. Si una
capa falla, tarda o duda, responde la de abajo.

**Reglas de seguridad para las acciones:**
- El asistente solo elige de un **catálogo cerrado de acciones**, definido en el código y validado con un esquema.
- **Pide confirmación** antes de procesar un archivo («Voy a comprimir *factura.pdf* a menos de 2 MB. ¿Continuar?»).
- Nunca borra ni envía nada por su cuenta.
- Todo sigue siendo local: nada de lo que escribe el usuario ni de sus archivos sale del navegador, y no se usa IA en
  la nube en ningún momento.

#### Capa 1 — Chatbot (lo que hay, mejorado)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-151.1 | **Medir el chatbot actual**: armar un conjunto de preguntas de prueba por idioma, con las de `tests/unit/features/assistant/questions.ts` más las preguntas reales que llegaron por «Enviar esta pregunta» (W-70g). Medir cuántas veces acierta la primera respuesta y cuántas no encuentra nada. Ese número es la línea base contra la que se comparan las capas nuevas, y el CI falla si baja | 🤖 | Pendiente |
| W-151.2 | **Llenar los huecos de la base**: agregar respuestas para las preguntas que hoy no encuentra nada, empezando por trámites (DIAN, SECOP, universidades), errores frecuentes («no abre», «pesa mucho», «sale en blanco») y las herramientas nuevas de la auditoría W-146. En los 12 idiomas | 🤖 + 👤 (revisar textos) | Pendiente |

#### Capa 2 — Entender pedidos con reglas (asistente para todos, sin descargas)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-151.3 | **Catálogo de acciones** (`src/features/assistant/core/actions.ts`): un tipo por acción, con sus parámetros y la validación de cada uno. Ejemplos: `openTool` (herramienta), `setOptions` (tamaño objetivo, páginas, formato, calidad, contraseña: nunca se guarda), `useCurrentFile`, `chain` (lista de pasos), `explain` (respuesta de la base). Cada herramienta declara qué opciones acepta desde el asistente. Es la misma lista que usarán las capas 3 y 4 | 🤖 | Pendiente |
| W-151.4 | **Analizador de pedidos por reglas**: reconocer verbos y herramientas («comprime», «une», «pasa a Word») y datos («a menos de 2 MB», «páginas 3 a 5», «en blanco y negro», «a 300 ppp»), con tildes, errores de tipeo y números escritos en letras. Los sinónimos salen de la base de cada idioma, nada queda fijo en el código, y el resultado es una acción del catálogo. Pruebas con al menos 50 pedidos por idioma en es y en, y 20 en los demás | 🤖 | Pendiente |
| W-151.5 | **Confirmar y ejecutar**: en el panel, una tarjeta con lo que se va a hacer y los botones «Hacer» y «Cambiar». «Hacer» abre la herramienta con las opciones ya puestas y el archivo que el usuario tenga abierto. Si falta el archivo, lo pide con el selector. Las herramientas reciben las opciones por una interfaz común, no por la URL, para que nada sensible quede en el historial | 🤖 | Pendiente (depende de W-151.3 y .4) |
| W-151.6 | **Contexto de la pantalla**: el panel sabe qué herramienta está abierta, qué archivo hay (solo nombre, tipo, tamaño y número de páginas, nunca el contenido) y el último error. Con eso responde «¿por qué no me deja?» con la causa y la solución (contraseña → Desbloquear; archivo dañado → Reparar), y las sugerencias cambian según la pantalla | 🤖 | Pendiente |
| W-151.7 | **Siguiente paso sugerido**: al terminar una herramienta, el asistente propone lo que suele venir después: unir → comprimir o firmar; escanear → OCR o unir; PDF a Word → abrir el resultado. Se puede desactivar en Ajustes, sin ventanas emergentes, solo una sugerencia discreta | 🤖 | Pendiente |
| W-151.8 | **Encadenar pasos**: «escanea, une y firma» arma un plan de varios pasos, lo muestra como lista y lo ejecuta uno por uno, pasando el resultado de cada paso al siguiente y pidiendo confirmación al principio. Si un paso falla, se detiene y explica | 🤖 | Pendiente (depende de W-151.5) |

#### Capa 3 — Modelo propio entrenado con Python (entiende frases libres, en todos los navegadores)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-151.9 | **Datos de entrenamiento** (`ml/assistant/data/`): para cada intención (las respuestas de la base y las acciones del catálogo), las preguntas de la base más variantes escritas a mano («que pese menos», «bajarle los MB», «hacerlo más liviano»), en los 12 idiomas. Las variantes se pueden ampliar con un modelo de lenguaje **local** (p. ej. con Ollama en la computadora del desarrollador), nunca con datos de usuarios. Se separa una parte solo para evaluar | 🤖 + 👤 (revisar variantes) | Pendiente |
| W-151.10 | **Entrenamiento en Python** (`ml/assistant/train.py`, con `requirements.txt` y versiones fijas). Se prueba primero un clasificador liviano (n-gramas de caracteres + modelo lineal con scikit-learn, pocos MB). Si no alcanza, un modelo de embeddings multilingüe pequeño (p. ej. `multilingual-e5-small`) ajustado con `sentence-transformers` y cuantizado. Se exporta a ONNX (o JSON si es lineal) en `public/assistant/model/` | 🤖 | Pendiente (depende de W-151.9) |
| W-151.11 | **Evaluación y control en el CI**: un job de Python reentrena y mide el acierto por idioma con la parte de evaluación. El modelo nuevo solo se publica si acierta igual o más que el anterior y que la capa 1 (W-151.1). Se informan las intenciones que más se confunden | 🤖 | Pendiente (depende de W-151.10) |
| W-151.12 | **Usarlo en el navegador** con `onnxruntime-web`, que ya está en el proyecto para Whisper (W-133). Corre en un worker y se descarga la primera vez que se usa el asistente, no al cargar la página. Funciona sin conexión en Desktop (se guarda en caché) y tiene un tamaño máximo acordado (meta: ≤ 5 MB el lineal, ≤ 40 MB el de embeddings). Si el modelo no está seguro (umbral de confianza), se usa la capa 1 o 2 | 🤖 | Pendiente (depende de W-151.10) |
| W-151.13 | **Mejora continua**: cada mes, las preguntas que llegan por «Enviar esta pregunta» se revisan a mano, se agregan a los datos (sin el correo de quien la mandó) y se reentrena. Hay un registro de versiones del modelo con su acierto en `docs/CHATBOT.md` | 👤 + 🤖 | Pendiente |

#### Capa 4 — IA del navegador para pedidos complejos (opcional, solo Chrome compatible)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-151.14 | **Pedidos complejos con salida estructurada**: cuando las capas 2 y 3 no están seguras, se le pide a Gemini Nano (Prompt API) que devuelva **solo JSON** con una acción del catálogo, usando `responseConstraint` con el esquema de W-151.3. Lo que no cumpla el esquema se descarta y se usa la capa de abajo. Mismos límites de tiempo que W-70f | 🤖 | Pendiente (depende de W-151.3) |
| W-151.15 | **Otros motores del navegador**: revisar la Prompt API de Edge (Phi-4-mini) y la de otros navegadores cuando salgan, con la misma interfaz (`browserAi.ts`). Ampliar `AI_LANGS` cuando Chrome soporte más idiomas | 🤖 | Pendiente |
| W-151.16 | **Aviso honesto en el panel**: mostrar qué capa respondió («Respuesta de la base», «Entendí tu pedido», «Redactada por la IA de tu navegador») y mantener la nota de privacidad: «todo ocurre en tu navegador» | 🤖 | Pendiente |

#### Transversal

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-151.17 | **Accesibilidad y celular**: las tarjetas de acción y los planes de varios pasos se usan con teclado y lector de pantalla y caben a 375 px. Pruebas de Playwright: «comprime este PDF a 1 MB» termina con el archivo comprimido, en escritorio y celular | 🤖 | Pendiente |
| W-151.18 | **Analítica con consentimiento (solo IDs)**: qué capa respondió, qué acción se propuso, si se confirmó y si terminó bien. **Nunca** el texto escrito ni nombres de archivo. Con eso se decide qué mejorar | 🤖 | Pendiente |
| W-151.19 | **Llevarlo a la app Android** cuando llegue la paridad: el catálogo de acciones y el modelo de la capa 3 (ONNX corre también en Android con ONNX Runtime Mobile) se reutilizan, así el asistente entiende lo mismo en la web y en la app | 🤖 | Pendiente (después de la paridad) |

Orden: W-151.1 y .2 → capa 2 (.3 → .4 → .5; luego .6, .7 y .8) → capa 3 (.9 → .10 → .11 → .12; .13 es continuo) →
capa 4 (.14 a .16). W-151.17 y .18 se hacen junto a cada capa. Con la capa 2 terminada, el chatbot ya es un asistente
para todos los usuarios, sin descargar nada. **Costos:** ninguno en dinero. Python y sus librerías son gratis y el
entrenamiento corre en la computadora o en el CI en minutos (el lineal) o en menos de una hora (el de embeddings, sin
GPU). **Riesgos:** la calidad depende de los datos en 12 idiomas (lo mitigan W-151.9 y .13), y un modelo pesado
retrasa el panel (lo mitigan la descarga bajo demanda y el tope de tamaño de W-151.12).

## Diseño visual y animaciones de todo el sitio

Hoy la portada tiene animaciones y el resto se ve plano. Se empieza por la **política de privacidad** y desde ahí se
revisa página por página con el usuario. Reglas para todas: animaciones con `transform` y `opacity`, respetar
`prefers-reduced-motion`, nada de librerías ni recursos externos (por la CSP), modo oscuro y sin empeorar el
rendimiento (Lighthouse).

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-71 | **Política de privacidad con diseño propio**: encabezado con degradado e ícono como la portada; resumen "en 30 segundos" con tarjetas (qué se procesa, qué no se sube, analítica opcional, contacto); índice lateral fijo que marca la sección visible; cada sección como tarjeta con ícono; aparición suave al desplazar; botón "volver arriba"; ancho de lectura cómodo; modo oscuro; versión para imprimir. **El texto legal no cambia** (sigue sincronizado con la app) | 🤖 | Hecho (PR #80) |
| W-72 | **Sistema de movimiento común**: duraciones y curvas compartidas, utilidad de aparición al desplazar (IntersectionObserver), transiciones entre páginas (View Transitions API, donde exista) y microinteracciones de botones y tarjetas, para reutilizar en todo el sitio | 🤖 | Hecho (PR #82) |
| W-73 | **Páginas de herramientas** (372): encabezado animado, pasos ilustrados, FAQ con apertura animada y herramienta con entrada suave | 🤖 | Hecho (PR #83) |
| W-74 | **App web**: transiciones entre pantallas, estados de carga con esqueletos, animación al terminar un proceso (éxito/descarga) y menús/paneles con movimiento | 🤖 | Hecho (PR #84) |
| W-75 | **Portada**: revisión con el usuario de lo que ya tiene y ajustes de coherencia con lo nuevo | 🤖 + 👤 | Hecho (revisada con el usuario el 2026-11-17: eligió solo resumir las herramientas → W-77; modo oscuro en la portada hecho en PR #87 y en las herramientas en PR #88; microinteracciones en tarjetas hechas en PR #89; limpieza de estilos en línea hecha en PR #90) |
| W-89 | **Fondo animado como la app** (pedido del usuario 2026-11-17): formas geométricas con el degradado del **color de acento** que derivan despacio (ciclos de 10–14 s, como `DocuSmartAnimatedBackground.kt` de la app), como capa detrás del contenido que no intercepta toques. Opción **"Fondo animado"** en Ajustes de la web ("Formas con el color de acento en movimiento"), guardada con la apariencia. Quieto con "reducir movimiento"; el Visor y la lectura mantienen fondo sólido. Solo `transform`/`opacity`, sin librerías, en claro y oscuro. Empezar por la app web; después evaluar portada y herramientas | 🤖 | Hecho (PR #92) |
| W-90 | **Banners de publicidad en la web** (pedido del usuario 2026-11-18), no invasivos y bien ubicados. **Sí:** páginas de herramientas, `/herramientas` y la app web. **No:** la portada principal ni la política de privacidad. Ubicaciones propuestas: en cada herramienta, entre "Cómo… en 3 pasos" y las preguntas frecuentes (nunca sobre la herramienta ni el resultado); en `/herramientas`, uno entre categorías (después de la tercera); en la app, en el inicio bajo los accesos rápidos y bajo el resultado al terminar un proceso (nunca dentro del área de trabajo). Sin ventanas emergentes, intersticiales ni anuncios fijos que tapen; lejos del botón del asistente; espacio reservado para que la página no salte (CLS); carga diferida. **Decisiones del usuario antes de implementar:** proveedor (AdSense exige abrir la CSP a scripts de Google y revisar Trusted Types), consentimiento (el aviso de cookies debe incluir publicidad) y actualizar la política de privacidad (hoy promete que no hay terceros en la web salvo la analítica opcional). **Avance:** proveedor elegido AdSense; `ads.txt` publicado y revisión solicitada (2026-11-18); base de anuncios lista y apagada (espacios, consentimiento, Trusted Types, pruebas; ver `docs/ANUNCIOS.md`). Faltan aprobación, los 3 IDs, abrir la CSP y la política de privacidad | 🤖 + 👤 | ✅ **Activada** (2026-11-20): 3 bloques Display (herramienta 2392088871, catálogo 5485156078, app 3739783383), CSP y Trusted Types abiertos para AdSense, consentimiento que vuelve a preguntar, política de privacidad y E2E. Falta: que AdSense marque el sitio "Listo" y publicar el mensaje de RGPD en Privacidad y mensajes (👤) |
| W-91 | **Palabras clave y posicionamiento en buscadores (SEO)** (pedido del usuario 2026-11-18). Ya existe: 31 páginas por herramienta en 12 idiomas, `/herramientas`, `hreflang`, sitemap con todas las URL y datos estructurados (WebApplication, FAQPage, CollectionPage). Falta: (1) **investigación de palabras clave** por idioma con herramientas gratuitas (Google Search Console, Google Trends, Keyword Planner, sugerencias del buscador) priorizando las de intención clara ("unir pdf gratis", "pdf a word sin subir"); (2) **asignar cada palabra a su página** y ajustar `title`, `description`, H1, pasos y FAQ en `tools/pages.mjs` y las traducciones, sin repetir la misma palabra en dos páginas; (3) **Google Search Console y Bing Webmaster**: verificar el dominio (lo hace el usuario con su cuenta), enviar el sitemap y revisar cobertura, consultas y clics; (4) **velocidad** (Core Web Vitals) medida con Lighthouse en móvil; (5) **enlaces**: internos entre herramientas relacionadas y externos (ficha de Google Play, redes, directorios de herramientas); (6) **contenido**: guías cortas para búsquedas "cómo…" que lleven a cada herramienta. Medir antes y después en Search Console | 🤖 + 👤 | En curso (2026-11-20): arreglos rápidos de la auditoría — título y descripción de la portada con palabras clave en 12 idiomas, datos estructurados en la portada (Organization, WebSite, MobileApplication, WebApplication), título descriptivo de `/app/` y `<lastmod>` en todo el sitemap (`PAGES_UPDATED`/`PRIVACY_UPDATED` en `tools/pages.mjs`). Siguen: palabras clave con datos de Search Console, más guías y enlaces externos |
| W-152 | **IndexNow** (pedido del usuario 2026-11-23): después de cada despliegue, avisar a Bing, Yandex, Seznam, Naver y los demás buscadores de IndexNow qué páginas son nuevas o cambiaron, sin esperar a que relean el sitemap. Google no usa IndexNow; para Google siguen el sitemap y Search Console. Clave pública en `/<clave>.txt`. `scripts/indexnow.mjs` compara el sitemap publicado antes del despliegue con el nuevo y avisa solo las URL nuevas o con otro `<lastmod>`. Si la clave aún no estaba publicada, avisa todas (las ~900 del primer envío). Nunca hace fallar el despliegue: si el aviso falla, deja una advertencia | 🤖 + 👤 | Hecho en código (PR pendiente de fusionar). Falta (👤): en **Bing Webmaster Tools**, confirmar que el sitio está verificado (ya está `BingSiteAuth.xml`) y el sitemap enviado, y revisar en «IndexNow» que lleguen los avisos después del primer despliegue |
| W-92 | **Barra lateral plegable en la app web** (pedido del usuario 2026-11-18): botón junto al logo para plegarla (solo íconos, 76 px) y desplegarla; el contenido y el fondo se reacomodan con transición; nombre emergente al pasar el ratón o con el foco; se recuerda en el navegador | 🤖 | Hecho (PR #96) |
| W-93 | **Arreglos de PageSpeed en la portada** (2026-11-18): fuentes de reserva ajustadas a Bricolage y Plus Jakarta (CLS de escritorio 0,137), contraste del pie, texto descriptivo del enlace del aviso de cookies, capturas reducidas con `srcset` y caché de 30 días para `/img`. Resultado: 100 en las 4 categorías y CLS de 0,137 a 0,035 (PR #98). Pulido: la marca del hero aparece cuando llega su fuente, CSS del aviso de cookies bajo demanda y menos reflow al cargar | 🤖 | Hecho (PR #98, #99, #100 y #101; PageSpeed 2026-11-18: 100 en las 4 categorías en móvil y escritorio, CLS 0 y 0,011) |

Orden: W-71 → revisar con el usuario → W-72 → W-73/W-74 → W-75.

## Herramientas ordenadas por categoría

Hoy la portada lista las 31 herramientas una tras otra, y la app las muestra repartidas sin un orden claro. La idea:
la portada solo **presenta** que hay herramientas y lleva a ellas; el orden y la elección se hacen en una vista de
herramientas **por categoría** y **en orden alfabético** dentro de cada una.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-76 | **Catálogo único de herramientas** (fuente de verdad compartida por portada, páginas y app): id, categoría, ícono, enlace a su página y a la app. Categorías propuestas, a validar con el usuario: *Organizar PDF* (unir, dividir, rotar, reordenar, numerar), *Editar y firmar* (editar, firmar, llenar formulario, marca de agua, recortar, censurar), *Seguridad* (proteger, desbloquear, reparar), *Optimizar y archivar* (comprimir, PDF/A, comparar, extraer imágenes), *Convertir* (de y a PDF, Word, Excel, imagen, texto), *Imagen* (comprimir, redimensionar, recortar, rotar), *Escanear y OCR*, *Archivos comprimidos*, *QR y estudio* | 🤖 + 👤 | Hecho (PR #85) |
| W-77 | **Portada**: la sección de herramientas deja de listar las 31 y muestra un resumen claro ("31 herramientas gratis") con una tarjeta animada por categoría (ícono, nombre, cantidad) que lleva a esa categoría, y un botón "Ver todas las herramientas". En los 12 idiomas | 🤖 | Hecho (PR #85) |
| W-78 | **Página "Todas las herramientas"** (`/herramientas`, `/en/tools`… en los 12 idiomas, indexable y en el sitemap): herramientas agrupadas por categoría, **orden alfabético dentro de cada categoría según el idioma** (`Intl.Collator`), accesos rápidos a cada categoría y un buscador que filtra mientras se escribe. "Más herramientas" de cada página de herramienta lleva aquí | 🤖 | Hecho (PR #85) |
| W-79 | **App web**: la pantalla de herramientas usa las mismas categorías y el mismo orden alfabético, con buscador; el inicio muestra las categorías como accesos | 🤖 | Hecho (PR #86) |

Orden: W-76 (validar categorías) → W-78 → W-77 → W-79. Encaja con el diseño visual (W-72) para las animaciones.

## Contar lo nuevo en la portada y en el asistente (pedido del usuario, 2026-11-20)

Lo agregado entre el 18 y el 20 de noviembre todavía no aparece en la portada ni lo conoce el asistente.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-103 | **Actualizar la portada** (`site/index.html` y sus 11 traducciones en `tools/locales/*.mjs`): mencionar las novedades sin recargarla — **guías paso a paso** en 12 idiomas (enlace a `/guias`), **guardar en Google Drive y Dropbox** (carpeta DocuSmart; los archivos van de tu navegador a tu cuenta, sin pasar por servidores), **renombrar el resultado** antes de descargar o compartir, y **los enlaces abren la app** en Android si está instalada. Revisar que los textos de privacidad sigan siendo exactos con la publicidad (solo con consentimiento). Pasar axe, PageSpeed y las pruebas de la portada | 🤖 + 👤 (revisar textos) | ✅ Hecho (PR #131, 2026-11-20) |
| W-104 | **Actualizar la base de conocimiento del asistente** (`tools/assistant/<idioma>.mjs`, 12 idiomas): entradas nuevas o ajustadas sobre guías (dónde están, idiomas), guardar en Google Drive (carpeta DocuSmart, permiso mínimo, cómo quitar el acceso) y en Dropbox (Aplicaciones › DocuSmart), renombrar el archivo antes de guardar, abrir enlaces en la app (App Links), aviso "Privacidad y cookies" y publicidad (solo con consentimiento, cómo cambiar la decisión). Sinónimos en `text.ts` (renombrar/cambiar nombre, nube, carpeta). Pruebas del asistente con preguntas reales en varios idiomas | 🤖 | ✅ Hecho (PR #131, 2026-11-20) |

## Herramientas nuevas y mejoras frente a la competencia (análisis del 2026-11-20)

Frente a iLovePDF, Smallpdf, PDF24, Adobe Acrobat online, Sejda, PDFgear y TinyWow, DocuSmart gana en privacidad (todo local), sin límites diarios, 12 idiomas y web + Android + escritorio. Pierde en marca/SEO, en la fidelidad de PDF→Word/Excel, con archivos muy grandes y en flujos encadenados y por lotes. Todas las herramientas nuevas se procesan en el dispositivo, como las actuales.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-105 | **Hash e integridad de documentos** (idea del usuario): calcular SHA-256 (y SHA-1/MD5 por compatibilidad) de uno o varios archivos con `crypto.subtle`; **verificar** contra un hash pegado (coincide / el archivo cambió); **comparar dos archivos** (¿idénticos?); copiar o descargar los hashes en .txt y un **certificado de integridad en PDF** (nombre, tamaño, fecha, hash). Página en 12 idiomas, guía y entrada del asistente | 🤖 | ✅ Hecho (PR #133, 2026-11-20): `/calcular-hash` y `#/hash` en la app, 12 idiomas |
| W-106 | **Quitar metadatos** de PDF (autor, programa, fechas), fotos (EXIF y GPS) y Office: mostrar qué datos tiene el archivo antes y después | 🤖 | ✅ Hecho (2026-11-21): `/quitar-metadatos` y `#/metadatos`, en **Seguridad**; varios archivos a la vez (ZIP). Fotos JPG, PNG y WebP sin recomprimir (quita EXIF, GPS, XMP, IPTC, comentarios y textos; conserva perfil de color y orientación); PDF (información, XMP, PieceInfo, identificador y los objetos sueltos que quedaban); Word, Excel y PowerPoint (propiedades del documento y personalizadas). Muestra lo encontrado antes y lo que queda después, con la ubicación GPS resaltada; 12 idiomas. No quita nombres en comentarios ni en control de cambios de Office (se avisa) |
| W-107 | **HEIC a JPG** (fotos de iPhone), por lotes y con calidad ajustable | 🤖 | ✅ Hecho (2026-11-20): `/heic-a-jpg` y `#/convertir/heic-jpg` (también en Imagen); JPG con calidad del 50 al 100 % o PNG, varias a la vez en ZIP; libheif en wasm (LGPL-3.0, 1,4 MB desde `/heic/`, solo si el navegador no abre HEIC, como Safari); 12 idiomas |
| W-108 | **Imagen a texto (OCR)** reutilizando el motor del OCR de PDF; copiar o descargar .txt | 🤖 | ✅ Hecho (2026-11-21): `/imagen-a-texto` y `#/imagen/texto`, en **Escanear y OCR** (también en Imagen); varias imágenes a la vez (también HEIC, TIFF y AVIF), pegar una captura con Ctrl+V, idioma español, inglés o ambos, texto editable antes de copiarlo y salida en .txt o Word (une las líneas en párrafos, repara palabras partidas y respeta las viñetas); aviso de calidad baja; 12 idiomas |
| W-109 | **Lector de QR** desde una imagen o la cámara: ya existe en la app web (`#/qr/leer`) y comparte página con el generador; falta su **página propia** (`/leer-codigo-qr`) para buscadores | 🤖 | ✅ Hecho (2026-11-21): `/leer-codigo-qr` en 12 idiomas, solo con el lector (cámara, imagen o captura pegada); la página del generador conserva las dos herramientas. El asistente lleva "leer un QR" a la página nueva |
| W-110 | **Flujos encadenados:** al terminar una herramienta, "¿Y ahora?" con 3 sugerencias que reciben el resultado sin volver a elegir el archivo (unir → comprimir → firmar) | 🤖 | Hecho (2026-11-21): `NextSteps` dentro de `SaveOptions` (lo usan todas las herramientas con resultado de un archivo); lógica en `features/tools/core/nextSteps.ts` (flujos por herramienta: unir → comprimir, firmar, proteger…; un PDF protegido, ZIP, QR y Estudio no sugieren nada). El archivo pasa por un traspaso de un solo uso que caduca (`setChainedFiles`/`takeChainedFiles`) y recoge la primera `DropZone` que lo acepta. De paso, `SingleFileTool` y `ConvertJob` ahora se reinician al cambiar de herramienta (antes conservaban el archivo anterior). Probado en el navegador: Rotar → Comprimir y Rotar → Numerar |
| W-111 | **Procesamiento por lotes** visible: aplicar comprimir, convertir o renombrar a varios archivos y descargar un ZIP | 🤖 | Hecho (2026-11-21): ya existía en las herramientas de imagen y en las conversiones de imagen; ahora también **Comprimir PDF** acepta varios PDF (cada uno con su fila: ahorro, "ya estaba optimizado" o su error, sin frenar a los demás; ZIP con los comprimidos y, de los ya optimizados, el original) y hay una herramienta nueva **Renombrar archivos** (`archivos/renombrar`: nombre nuevo, buscar y reemplazar, texto al inicio y al final, numeración, mayúsculas/minúsculas, vista previa y ZIP; lógica en `archive/core/renameBatch.ts`). Las herramientas que procesan varios archivos llevan la etiqueta "Varios archivos" en Todas las herramientas (`batch` en el catálogo). **Pendiente:** lotes en Proteger, Desbloquear, Reparar y OCR |
| W-112 | **Comunicar la privacidad en cada herramienta:** sello "Tu archivo no sale de tu dispositivo" y aviso de que funciona sin conexión | 🤖 + 👤 (textos) | Hecho en la app web (2026-11-21): `PrivacySeal` dentro de `HeroCard` en todas las pantallas de herramientas (no en Inicio ni en el menú de herramientas), en 12 idiomas. El aviso de conexión solo aparece cuando es cierto: "funciona sin conexión" con la app instalada, el service worker activo y el aviso de descarga completa recibido (`isOfflineReady`, `connectivityNote`); "sin conexión: todo se sigue procesando en tu dispositivo" cuando no hay red. **Pendiente:** validar los textos (👤) y llevar el sello a las páginas SEO generadas |
| W-113 | **Herramientas de texto:** contador de palabras y caracteres, comparar dos textos (diff) y generador de contraseñas | 🤖 | ✅ Hecho (2026-11-21): categoría nueva **Herramientas de texto** (`#/texto`) con `/contador-de-palabras` (caracteres con y sin espacios, palabras, frases, párrafos, líneas, tiempo de lectura y en voz alta, palabras más repetidas; Intl.Segmenter para japonés/chino/coreano y emojis), `/comparar-textos` (texto completo con lo borrado y lo agregado marcado, por palabras o líneas, ignorar mayúsculas o espacios, % de parecido; reutiliza el Myers de Comparar PDF) y `/generador-de-contrasenas` (crypto.getRandomValues sin sesgo, un carácter de cada tipo elegido, evitar parecidos, fuerza en bits; también en Seguridad); 12 idiomas |
| W-114 | **Más Office:** PowerPoint a PDF, PDF a PowerPoint y CSV ↔ Excel | 🤖 | ✅ Hecho (2026-11-21): en el Convertidor (grupo **Office y datos**) y con página propia en 12 idiomas: `/powerpoint-a-pdf` (lector de .pptx propio: texto con lo heredado del diseño y el patrón, viñetas, formas, tablas con su estilo, imágenes, grupos y fondo; probado con una presentación real hecha en PowerPoint), `/pdf-a-powerpoint` (cada página como diapositiva; el .pptx se validó abriéndolo en PowerPoint), `/csv-a-excel` (separador detectado; cédulas, teléfonos y códigos con ceros quedan como texto) y `/excel-a-csv` (coma, punto y coma o tabulación, UTF-8 con BOM, un CSV por hoja en ZIP). PowerPoint a PDF deja de ser solo de la app |
| W-115 | **Imagen avanzada:** quitar fondo (modelo local) y foto tamaño documento (cédula, pasaporte, visa) | 🤖 | ✅ Cubierto por W-121 (Quitar fondo) y W-122 (Foto tamaño documento) |
| W-116 | **Audio y video con ffmpeg.wasm:** comprimir video, video a GIF y extraer audio (MP3). Cargar el motor (~30 MB) solo al usarlo y cuidar la memoria en celulares | 🤖 | ✅ Cubierto por W-132 (comprimir video y extraer audio con Mediabunny, sin ffmpeg.wasm). Queda solo **video a GIF**, si se quiere |
| W-117 | **Firma con certificado digital** (.p12/.pfx) con validez, para empresas | 🤖 | ✅ Hecho (2026-11-21) con W-141: firma PKCS#7 con certificado .p12/.pfx en Firmar PDF |
| W-118 | **SEO de nicho en español:** páginas para búsquedas concretas (reducir PDF para SECOP, unir PDF para la DIAN, foto de cédula a PDF) | 🤖 + 👤 (validar trámites) | Pendiente |

## Imágenes: lo que falta (revisión del 2026-11-20, pedido del usuario)

Hoy Imagen tiene comprimir, redimensionar, recortar y rotar; las conversiones (a JPG, PNG, WebP, BMP y PDF) existen pero están solo en Convertir, por eso no se encuentran desde Imágenes. Lee JPG, PNG, WebP, GIF, BMP y AVIF. Todo sigue siendo local.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-119 | **Conversiones de imagen también en Imágenes:** mostrar JPG↔PNG, a WebP y a BMP en la categoría Imagen (app, `/herramientas` y portada) sin duplicar páginas | 🤖 | ✅ Hecho (2026-11-20): Imagen de la app con "Cambiar de formato"; `/herramientas` y portada las listan también en Imagen (`alsoIn`); al buscar aparecen una vez |
| W-120 | **Voltear y espejo** dentro de Rotar imagen (horizontal y vertical) | 🤖 | ✅ Hecho (2026-11-20): ya existía (Espejo y Vertical); los botones ahora dicen "Voltear horizontal" y "Voltear vertical" en 12 idiomas |
| W-121 | **Quitar fondo** (idea del usuario) con un modelo de segmentación en el navegador (ONNX/WebGPU, ~40-80 MB que se descargan solo al usarla y quedan en caché). Salida PNG transparente o con color de fondo (blanco para documentos). Revisar licencia del modelo, memoria en celulares y CSP (`wasm-unsafe-eval`, origen del modelo). Absorbe la parte de "quitar fondo" de W-115 | 🤖 | ✅ Hecho (2026-11-20): `/quitar-fondo` y `#/imagen/fondo`, IS-Net (Apache-2.0) con pesos float16 (~90 MB en 2 partes, SHA-256 verificado, caché propia), onnxruntime-web en un worker; transparente, blanco o color; 12 idiomas |
| W-122 | **Foto tamaño documento** (cédula, pasaporte, visa): recorte a medida + fondo blanco (usa W-121); reemplaza esa parte de W-115 | 🤖 | ✅ Hecho (2026-11-20): `/foto-tamano-documento` y `#/imagen/documento`; 3,5 × 4,5 cm, 2 × 2 in, 3 × 4 cm, 4 × 5 cm, 2,5 × 3 cm u otra medida; fondo blanco, de color (IA de W-121) u original; JPG a 300 ppp con la resolución marcada (JFIF) y hoja de 10 × 15 cm para imprimir; 12 idiomas |
| W-123 | **Marca de agua en imágenes** (texto o logo, posición, opacidad), por lotes | 🤖 | ✅ Hecho (2026-11-20): `/marca-de-agua-imagen` y `#/imagen/marca`; texto (con color) o logo, 9 posiciones, diagonal o en mosaico, tamaño según el ancho de cada imagen y opacidad; vista previa al instante; por lotes en ZIP; acepta HEIC; 12 idiomas |
| W-124 | **Más formatos:** salida AVIF, ICO (favicon con varios tamaños) y GIF; entrada SVG→PNG y TIFF. HEIC→JPG sigue en W-107 | 🤖 | ✅ Hecho (2026-11-20): páginas `/imagen-a-gif`, `/imagen-a-avif`, `/png-a-ico`, `/svg-a-png` y `/tiff-a-jpg` (también en Imagen); GIF con transparencia (gifenc, MIT), AVIF con libavif en wasm (@jsquash/avif, Apache-2.0, 3,5 MB desde `/avif/`), ICO propio con 16 a 256 px; SVG (como imagen, sin scripts) y TIFF (utif2, MIT) se abren en todas las herramientas de Imagen y conversiones; 12 idiomas |
| W-125 | **Ajustes básicos:** brillo, contraste, saturación, blanco y negro y enderezar | 🤖 | ✅ Hecho (2026-11-20): `/ajustar-imagen` y `#/imagen/ajustar`; brillo, contraste y saturación (−100 a +100), blanco y negro y enderezar hasta 15° con recorte sin esquinas vacías; vista previa al instante con «Comparar con la original»; por lotes en ZIP; acepta HEIC; 12 idiomas |

## Agenda y notas con Outlook (pedido del usuario, 2026-11-20)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-126 | **Agenda local** en Modo Estudio (junto a Notas): eventos y recordatorios guardados en el navegador; exportar e importar `.ics` (lo abren Outlook, Google Calendar y el calendario del iPhone). Notas exportables en `.txt`/`.md` | 🤖 | ✅ Hecho (2026-11-20): Modo Estudio → Agenda (`#/estudio/agenda`, también en el menú lateral): título, fecha, hora o todo el día, duración, repetición (diaria, semanal, mensual, anual), aviso (a la hora hasta 1 día antes) y notas; próximos 90 días agrupados por día; exportar uno o todos a `.ics` (horas en UTC, VALARM) e importar `.ics` de Outlook, Google o el iPhone (líneas plegadas, zonas, duración, primer aviso; mismo UID reemplaza); avisos en pantalla y notificación del sistema mientras DocuSmart está abierto (sin servidor, se explica en la pantalla); notas exportables también a Markdown; 12 idiomas |
| W-127 | **Conectar con Outlook (Microsoft Graph):** registrar la app en Microsoft Entra ID (👤 crea el registro y comparte el ID de aplicación, que es público; nunca el secreto). Ventana emergente de autorización como con Google; permisos mínimos `Calendars.ReadWrite` y `Tasks.ReadWrite` (To Do) o `Notes.ReadWrite` (OneNote). Los eventos van del navegador a la cuenta del usuario, sin servidores. Cuentas personales funcionan directo; en cuentas de empresa el administrador puede tener que aprobarla. Actualizar privacidad y CSP | 🤖 + 👤 | Pendiente (fase 2, después de W-126) |
| W-128 | **Google Calendar** con el mismo flujo que Drive (scope de calendario mínimo; requiere revisar la pantalla de consentimiento en Google Cloud) | 🤖 + 👤 | Pendiente (opcional) |

## Nichos por cubrir (análisis del 2026-11-20, pedido del usuario)

Lo que la gente busca y DocuSmart todavía no resuelve. Todo debe seguir siendo local (sin subir archivos), como el resto del sitio.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-129 | **Trámites y documentos oficiales (LatAm):** guías y plantillas para los papeles que más se piden (cédula por ambas caras en una sola hoja, certificados, derechos de petición, cartas de autorización), con páginas por país y búsquedas en español. Se apoya en W-122 (foto tamaño documento), escanear, comprimir y firmar | 🤖 | Pendiente |
| W-130 | **Cuentas de cobro, cotizaciones y recibos:** formulario con numeración, datos del emisor guardados en el navegador, totales e impuestos, firma y salida en PDF. Muy buscado por independientes y pequeños negocios | 🤖 | ✅ Hecho (2026-11-20): `/cuenta-de-cobro` y `#/documentos/cobro`, en la categoría nueva **Crear documentos**; cuenta de cobro, cotización (con vigencia) o recibo; numeración propia por tipo (CC-, COT-, REC-), datos de quien cobra y de pago recordados en el navegador, conceptos con cantidad y valor, IVA y retención, 15 monedas con formato regional, valor en letras en español, firma (dibujada, escrita o foto) y PDF; aclara que no es factura electrónica; 12 idiomas |
| W-131 | **Hoja de vida (CV):** plantilla clásica compatible con ATS o con foto (recorte 3 × 4), experiencia, estudios, habilidades, idiomas, cursos y referencias; PDF y Word (.docx); borrador en .json que guarda el usuario (nada en el navegador) | 🤖 | ✅ Hecho (2026-11-20): `/hoja-de-vida` y `#/documentos/cv`, en **Crear documentos**; 12 idiomas |
| W-132 | **Audio y video:** convertir (MP4↔MP3, extraer audio), recortar y comprimir en el navegador | 🤖 | ✅ Hecho (2026-11-21): categoría nueva **Audio y video** (`#/multimedia`) con `/video-a-mp3` (MP3, M4A, WAV u OGG), `/convertir-video` (MP4 o WebM, con opción de quitar el sonido), `/recortar-audio-video` (conserva el formato y copia sin recomprimir) y `/comprimir-video` (3 niveles y 1080p/720p/480p; si no gana, deja el original); 12 idiomas. **Motor:** Mediabunny (WebCodecs, aceleración por hardware, MPL-2.0) en lugar de ffmpeg.wasm: ffmpeg pesa ~30-64 MB, es GPL/LGPL y sin `Cross-Origin-Embedder-Policy` (incompatible con AdSense) solo corre en un hilo, muy lento para video. Lee el archivo por partes (poca memoria en celulares). MP3 con `@mediabunny/mp3-encoder` (LAME en wasm, se carga solo si el navegador no codifica MP3). Formatos de entrada: MP4, MOV, WebM, MKV, MP3, M4A, WAV, OGG y FLAC (no AVI/WMV) |
| W-133 | **Audio a texto y dictado:** transcribir notas de voz y reuniones con Whisper en el navegador (modelo que se descarga una vez y queda en caché, como Quitar fondo); salida TXT, DOCX o subtítulos SRT | 🤖 | ✅ Hecho (2026-11-21): `/audio-a-texto` y `#/multimedia/texto` (también en Herramientas de texto). Whisper base (onnx-community, cuantizado, ~77 MB en `public/models/whisper-base/`, SHA-256 verificado y caché propia como Quitar fondo) con el onnxruntime-web del proyecto en un worker; espectrograma log-mel, reglas de marcas de tiempo y avance de ventanas propios (como OpenAI). Audio o video por partes con Mediabunny y remuestreo continuo a 16 kHz; grabar con el micrófono (Permissions-Policy `microphone=(self)`); idioma automático o elegido, traducir al inglés; texto editable y salida .txt, Word, .srt y .vtt; hasta 2 h. Probado con voz sintetizada: ~4× más rápido que el tiempo real en escritorio; 12 idiomas |
| W-134 | **Educación:** ampliar Modo Estudio con tarjetas de repaso y cuestionarios a partir de un PDF o de las notas, y formatos de citas (APA, IEEE) | 🤖 | Pendiente |
| W-135 | **Seguridad: mejoras menores de la prueba de intrusión** (2026-11-20). Visor: los SVG se muestran como `data:` y el resto de imágenes re-empaquetadas con tipo seguro; descompresión con topes (1,5 GB y 20.000 archivos, revisados antes con la lista y al recoger) y máximo 2 niveles de .tar anidados. Sin cambios a propósito: historial de QR (guarda el contenido para volver a dibujarlo, igual que la app; la vista previa ya oculta la clave Wi-Fi) y `allow-duplicates` de la CSP (lo usan GTM/AdSense para la política `goog#html`) | 🤖 | ✅ Hecho (2026-11-20) |
| W-136 | **Fuentes Unicode en los PDF generados** (brecha 1 del análisis de mercado, 2026-11-21): los PDF que crea la web se ven en cualquier alfabeto | 🤖 | ✅ Hecho (2026-11-21): `src/shared/pdf/pdfFonts.ts` incrusta (en subconjunto) Carlito (medidas de Calibri), Tinos (Times) y Cousine (Courier), más Droid Sans Fallback (chino y japonés) y Nanum Gothic (coreano) solo cuando el texto los necesita, con `fontkit` 2 (el `@pdf-lib/fontkit` perdía glifos). Lo usan Word/Excel/PowerPoint a PDF, Hoja de vida, Cuentas de cobro, Apuntes, Certificado de integridad, Marca de agua y Editar PDF (estas dos siguen con Helvetica/Times/Courier si el texto es latino). Se quitó el respaldo en inglés de CV, cobros y certificado. Sin conexión se vuelve a las fuentes estándar. Fuentes en `public/pdf-fonts/` (OFL/Apache, licencias incluidas) y en caché del SW. Pendiente: campos de formularios PDF (Rellenar) siguen en latín |
| W-137 | **Fidelidad de Word a PDF** (brecha 2 del análisis de mercado, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): lector propio de .docx (`src/features/convert/core/docxRead.ts`, en lugar de mammoth): estilos con herencia y tema, numeración real (1., a), iv., viñetas de Symbol/Wingdings), colores, resaltado, tachado, superíndice, mayúsculas, familia de fuente (sans/serif/mono), espaciado antes/después y contextual, interlineado (múltiple, exacto, mínimo), sangrías y sangría francesa, justificado, tamaño de página y márgenes, encabezado y pie completos (tablas, logo, campos PÁGINA/NUMPAGES) que empujan el cuerpo como en Word, tablas con anchos de cuadrícula, bordes del estilo, celdas combinadas en ambos sentidos, fondos, márgenes de celda y alto de fila, imágenes con su tamaño (también en celdas) y cuadros de texto. Se quitó mammoth (22 paquetes). Con una plantilla real de 20 páginas el PDF sale con 20. Pendiente: Arial se dibuja con Carlito (más angosta; falta una fuente con medidas de Arial, como Arimo), imágenes flotantes con texto alrededor, gráficos y SmartArt |
| W-138 | **PDF a Word con diseño** (seguimiento de W-137, prueba con una hoja de vida real de Canva, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): la extracción recorre la lista de operadores de pdf.js con matriz, recorte, formularios y opacidad de grupos: color de cada texto, rectángulos rellenos (mezclados con el fondo de la página) y texto espaciado (tracking) con sus espacios reales y espaciado de caracteres. `buildDocument` detecta dos columnas (por el texto o por el fondo de la columna lateral) y las escribe como tabla sin bordes con el fondo de cada columna; las franjas de color van como párrafos sombreados; una línea toda en negrita corta el párrafo. Word a PDF lee el sombreado de párrafo y el espaciado entre letras. FAQ de PDF a Word actualizada en 12 idiomas. Pendiente: cuadros de texto y formas sueltas, más de dos columnas, color de fondo de toda la página |
| W-139 | **OCR en los 12 idiomas del sitio** (brecha 3 del análisis de mercado, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): modelos de Tesseract (paquetes `@tesseract.js-data/*`, MIT, versión best_int) para portugués, francés, italiano, alemán, catalán, euskera, ruso, japonés, coreano y chino simplificado, además de español e inglés; se copian a `public/ocr/lang` en cada build (no se suben al repo, unos 21 MB; cada visitante baja solo el que usa). OCR PDF e Imagen a texto tienen una lista de idiomas (nombres con `Intl.DisplayNames`, el de la página primero) y la casilla "también hay texto en inglés"; el Modo Estudio y el escáner usan el idioma de la página más inglés. Textos actualizados en 12 idiomas |
| W-140 | **Editar el texto que ya tiene el PDF** (brecha 4 del análisis de mercado, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): "Reemplazar" en Editar PDF ahora borra de verdad el texto original del contenido de la página (`src/features/pdf/core/pdfContent.ts`: lee los operadores, sigue matrices, fuente, tamaño y espaciados con los anchos de cada fuente —incrustadas, Type0 y las 14 estándar— y quita los que escriben dentro de la zona); ya no se puede seleccionar ni buscar y no queda parche blanco sobre fondos de color. Si el texto está dentro de un formulario o no se encuentra, se tapa con el color de fondo medido. Se reemplaza el párrafo entero (líneas seguidas con la misma letra) y el texto nuevo se corta al mismo ancho, con su interlineado y el color real del PDF. Textos en 12 idiomas y primera E2E del editor. Pendiente: texto girado, texto dentro de formularios, usar la fuente original del PDF |
| W-141 | **Firma digital con certificado** (brecha 5 del análisis de mercado, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): en Firmar PDF, la casilla "Firmar también con mi certificado digital (.p12 o .pfx)" lee el certificado con su contraseña (node-forge, BSD-3; también los cifrados con 3DES/RC2 que exporta Windows), muestra titular, emisor y vigencia, avisa si venció o si el PDF ya tenía firmas, y firma en PKCS#7 desprendido (adbe.pkcs7.detached, SHA-256) en el lugar de la firma visible (`src/features/pdf/core/pdfDigitalSign.ts`). Todo en el navegador; la clave y la contraseña no se guardan. Verificado con OpenSSL (`cms -verify`) y con `verifySignatures`. Pendiente: firma incremental (hoy reescribir el PDF invalida firmas previas), sello de tiempo (TSA), claves ECDSA, PAdES-B con signing-certificate-v2 y una pantalla para verificar firmas |
| W-142 | **Resumir PDF con IA local** (brecha 6 del análisis de mercado, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): herramienta `/resumir-pdf` (sección Texto, también en Documentos) para PDF, Word (.docx), .txt o texto pegado. Resumen extractivo en el navegador, sin modelos ni nube: el núcleo del Modo Estudio (`study/core/summarize.ts`) ahora mezcla frecuencia (Luhn) con centralidad tipo TextRank y un poco de peso a las primeras oraciones, no corta en abreviaturas ni iniciales, tiene tres largos y da palabras clave. Avisa si el PDF es escaneado (enlace a OCR). Copiar, .txt y Word. Página y textos en 12 idiomas. Siguiente paso posible: Preguntar al PDF con un modelo de embeddings (~120 MB) |
| W-143 | **SEO técnico: auditoría de todo el sitio y más liviano** (brecha 8, parte técnica, 2026-11-21) | 🤖 | ✅ Hecho (2026-11-21): prueba permanente `siteSeo.test.ts` sobre las ~900 páginas (lang, un H1, title, description, canonical a sí misma, hreflang con x-default y recíproco, JSON-LD válido y sin valoraciones, enlaces internos que existen, todas en el sitemap); el `<title>` deja la marca de DocuSmart solo si cabe en 60 caracteres (de 214 títulos largos a 16; og:title la conserva); el diccionario español ya no va incluido en todas las páginas (cada una carga solo el de su idioma: la parte común bajó de 308 a 214 KB). La indexación (IndexNow, Search Console) y las revisiones de posicionamiento quedan para después |
| W-144 | **Abrir archivos desde Google Drive y Dropbox** (brecha 7) | 🤖 + 👤 | Aplazado por el usuario (2026-11-21): requiere Google Picker (habilitar Picker API y clave de navegador) y Dropbox Chooser (registrar el dominio), abrir esas excepciones en la CSP y comprobar Trusted Types |
| W-145 | **Barra lateral por categorías, más intuitiva** (pedido del usuario 2026-11-22). Hoy la barra lista secciones de la app (Convertir, PDF, QR, Estudio, Imagen, Audio y video, Texto, Archivos) que no coinciden con las 12 categorías del catálogo. Propuesta: partir del catálogo único (`src/features/tools/core/catalog.ts`, W-76) y mostrar en la barra las categorías (Organizar, Editar, Documentos, Seguridad, Optimizar, Convertir, Imagen, Audio y video, Escanear, Archivos, QR, Texto) desplegables con sus herramientas, con la categoría de la pantalla actual abierta y la herramienta marcada; un buscador arriba que filtre la barra; y aparte, separadas de las herramientas, las funciones que no son herramientas (Inicio, Modo Estudio, Agenda, historial, Ajustes). Revisar plegado, teclado y lectores de pantalla, la vista en celular y que la barra plegada (W-92) siga funcionando. **Personalización** (pedido del usuario 2026-11-22): hoy la barra tiene siempre fondo oscuro fijo (`--night`) y no sigue el tema ni el color de acento que el usuario elige en Ajustes; que tome el tema (claro, oscuro o del sistema) y el acento elegido (elemento activo, íconos de categoría y realces), con una opción de estilo de barra (oscura, clara o del color de acento) y contraste suficiente en todas las combinaciones | 🤖 | ✅ Hecho (2026-11-22): `SideNav` con General (Inicio, Todas las herramientas, Modo Estudio) y las 12 categorías del catálogo desplegables con su cantidad, la categoría actual abierta y la herramienta marcada, buscador que filtra la barra (Esc limpia), plegada con un ícono por categoría; en Ajustes, "Barra lateral": según el tema, oscura, clara o color de acento (el realce sigue el acento elegido); prueba E2E |
| W-146 | **Auditoría de cada herramienta frente a la competencia, por categorías** (pedido del usuario 2026-11-22). Método por categoría: **1) Que funcione bien**: probar cada herramienta con archivos reales y casos difíciles (archivos grandes, PDF cifrados o escaneados, imágenes enormes, nombres raros, celular a 375 px, sin conexión) y corregir lo que falle, dejando una prueba E2E por caso. **2) Comparar**: cómo lo hacen las principales alternativas (funciones, límites, pasos, calidad del resultado, velocidad, privacidad) en una tabla en `docs/auditoria/<categoria>.md`. **3) Brechas**: donde DocuSmart quede por debajo, lista priorizada. **4) Mejorar** y volver a medir. Una categoría por PR (W-146.1 a W-146.12) | 🤖 | ✅ Hecho (2026-11-23): las 12 categorías auditadas (informes en `docs/auditoria/`). Lo que quedó para más adelante está en W-147 |
| W-146.1 | Auditoría **Organizar** (5): Unir, Dividir, Rotar, Reordenar, Numerar páginas. Comparar con iLovePDF, Smallpdf, PDF24, Sejda y Adobe Acrobat en línea | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/organizar.md`; corregido numerar en páginas giradas o recortadas; unir conserva formularios, marcadores y título; arrastrar y soltar; dividir por rangos y cada N páginas; numerar con 6 posiciones, texto, inicio y portada; duplicar y página en blanco. Quedan miniaturas perezosas y elegir páginas al unir |
| W-146.2 | Auditoría **Editar** (6): Editar PDF, Firmar, Llenar formulario, Marca de agua, Recortar, Censurar. Comparar con Adobe Acrobat, Sejda, Smallpdf, PDFgear y DocuSign (firma) | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/editar.md`; corregidos el formulario en otros alfabetos y la marca de agua en páginas giradas o recortadas; marca de agua con imagen, posición, mosaico, rotación, opacidad, color, capa y páginas; firmar con fecha, texto, ✓ e iniciales y recordar la firma; deshacer y rehacer en Editar. Quedan dibujo libre, texto buscable al censurar, enlaces y guardar respuestas |
| W-146.3 | Auditoría **Seguridad** (5): Proteger, Desbloquear, Reparar, Quitar metadatos, Hash e integridad. Comparar con iLovePDF, PDF24, Smallpdf y herramientas de metadatos (ExifTool en línea) | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/seguridad.md`; corregidos la contraseña de más de 127 bytes que dejaba el PDF sin abrir y el EXIF/GPS de las fotos dentro del PDF; quitar comentarios, adjuntos y JavaScript; anonimizar autores en Word, Excel y PowerPoint; proteger solo con restricciones y cambiar la contraseña. Quedan reparar archivos cortados, HEIC/video y hash de archivos grandes |
| W-146.4 | Auditoría **Documentos** (2): Hoja de vida, Cuenta de cobro y cotización. Comparar con Canva, Zety y Novorésumé (CV) y generadores de facturas y cotizaciones | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/documentos.md`; las dos herramientas pasaron los casos difíciles; hoja de vida con Carta o A4 (igual en PDF y Word), guardado automático, plantilla compacta, letra, color, orden y secciones propias; cuenta de cobro con logo, descuento, fecha límite, clientes y conceptos guardados, historial y convertir cotizaciones. Quedan comparar con una oferta, carta de presentación y valor en letras en otros idiomas |
| W-146.5 | Auditoría **Optimizar** (4): Comprimir PDF, PDF a PDF/A, Comparar PDF, Extraer imágenes. Comparar con iLovePDF, Smallpdf, PDF24, Adobe Acrobat (compresión y comparación) y Draftable | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/optimizar.md`; compresión Recomendada que conserva el texto (solo fotos), comprimir a un tamaño máximo, escala de grises; comparar ignorando mayúsculas y puntuación y con bloques movidos. Quedan comparar visualmente y PDF/A-1b y 3b |
| W-146.6 | Auditoría **Escanear** (3): Escanear documento, OCR, Imagen a texto. Comparar con Adobe Scan, Microsoft Lens, CamScanner y OCR en línea (OnlineOCR, Google Drive) | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/escanear.md`; PDF buscable con el tamaño original de cada página, respeta las páginas que ya tienen texto, corrige la orientación, tamaño de página en el escáner (A4, Carta o como la foto) y OCR de PDF a Word. Queda la cámara en vivo |
| W-146.7 | Auditoría **Convertir** (21): imagen a PDF/JPG/PNG/WebP/BMP/GIF/AVIF/ICO, HEIC, SVG y TIFF; PDF a imagen, texto, Word, Excel y PowerPoint; Word, Excel y PowerPoint a PDF; CSV y Excel. Comparar con iLovePDF, Smallpdf, CloudConvert, Zamzar y Convertio (fidelidad del resultado con archivos reales) | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/convertir.md`; CSV en Windows-1252, Word a PDF con secciones, encabezado y pie heredados y notas, tablas con líneas en PDF a Word/Excel, Imagen a PDF con tamaño, orientación, márgenes y EXIF, Excel con formato y sin hojas ocultas, TIFF de varias páginas y SVG sin xmlns. Quedan opciones de PDF a imagen y OCR en un paso |
| W-146.8 | Auditoría **Imagen** (8): Comprimir, Redimensionar, Recortar, Rotar y voltear, Quitar fondo, Foto tamaño documento, Marca de agua, Ajustar imagen. Comparar con Squoosh, TinyPNG, iLoveIMG, remove.bg y Canva | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/imagen.md`; PNG con paleta que sigue siendo PNG y elegir formato, comprimir a un tamaño en KB y calidad a mano, redimensionar con medidas de redes y en centímetros con ppp, girar JPG sin pérdida, nitidez y mejora automática. Quedan el pincel de Quitar fondo y el encuadre automático de la foto documento |
| W-146.9 | Auditoría **Audio y video** (5): Video a MP3, Convertir video, Recortar, Comprimir video, Audio a texto. Comparar con CloudConvert, Clideo, Kapwing y transcriptores (TurboScribe, Otter) | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/audio-video.md`; corregido que recortar dejara escondido lo anterior al corte; comprimir a un tamaño (Discord, WhatsApp, correo u otro); nuevas herramientas Girar video (sin recomprimir) y Video a GIF. Quedan varios archivos a la vez, unir videos y hablantes |
| W-146.10 | Auditoría **Archivos** (3): Comprimir (ZIP y 7Z), Descomprimir (RAR, ZIP y 7Z), Renombrar. Comparar con ezyZip, Archive Extractor y 7-Zip | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/archivos.md`; corregido que los ZIP del Explorador de Windows con tildes y eñes no se abrieran (nombres en CP850); archivos en varias partes; carpetas vacías; ISO, CAB y más formatos; elegir qué extraer y vista previa; crear dividido en partes de 10, 20 o 25 MB |
| W-146.11 | Auditoría **QR** (2): Crear y Leer QR. Comparar con QR Code Monkey, QR Code Generator y los lectores de la cámara del celular | 🤖 | ✅ Hecho (2026-11-22): informe en `docs/auditoria/qr.md`; corregido que en el computador no se leyera el QR de facturas fotografiadas o escaneadas (búsqueda por escalas y zonas); leer desde PDF y HEIC; varios códigos y códigos de barras; crear WhatsApp, SMS, ubicación y contacto completo. Quedan diseño con color a elección y QR en lote |
| W-146.12 | Auditoría **Texto** (4): Contador de palabras, Comparar textos, Generador de contraseñas, Resumir PDF. Comparar con WordCounter, Diffchecker, Bitwarden y 1Password (contraseñas) y resumidores en línea (SMMRY, QuillBot) | 🤖 | ✅ Hecho (2026-11-23): informe en `docs/auditoria/texto.md`; corregido el contador (un enlace, un correo y una palabra con guion son una palabra; "Sr." no corta la oración) y el resumen (cada viñeta es una oración, se unen las palabras cortadas con guion y se quitan encabezados, pies y números de página repetidos); nivel de lectura en 7 idiomas (Fernández Huerta en español) y límites de caracteres; comparar lado a lado, ignorar tildes, marcar la letra que cambió y abrir PDF o Word; frase de contraseña (listas de más de 1100 palabras en español e inglés), hasta 128 caracteres y excluir caracteres; resumen en viñetas o párrafos y PDF escaneado con OCR en el mismo paso |

## Lo que quedó de la auditoría W-146 (2026-11-23)

Brechas que se dejaron para más adelante en cada categoría (el detalle y el porqué están en `docs/auditoria/<categoría>.md`, sección 3). **Prioridad alta**: lo que más piden los usuarios o nos deja por debajo de todos los competidores.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-147.1 | **Escanear con la cámara en vivo**: detectar la hoja antes de tomar la foto (como CamScanner y Adobe Scan). Prioridad alta | 🤖 | ✅ Hecho (2026-11-23): Tomar foto abre la cámara en la página, marca la hoja sobre el video y la toma sola cuando se queda quieta (~1 s), una página tras otra sin repetir; obturador a mano, linterna, y la cámara del sistema si el navegador no da permiso. Detalle en `docs/auditoria/escanear.md` |
| W-147.2 | **Editar PDF: dibujo a mano alzada, líneas, flechas y enlaces**; guardar las respuestas de un formulario y crear campos nuevos; dejar buscable el texto de las páginas censuradas. Prioridad alta (dibujo y flechas) | 🤖 | ✅ Hecho (2026-11-23), y crear campos de formulario nuevos (también hecho el 2026-11-24: modo "Crear campos" con texto, texto largo, casilla, opciones y lista, dibujados sobre la página): Editar PDF con Dibujar, Línea, Flecha y Enlace (a un sitio, correo o página); Censurar deja buscable el texto que no se tapó (capa invisible sin lo censurado); Llenar formulario guarda y carga las respuestas en un .json. Detalle en `docs/auditoria/editar.md` |
| W-147.3 | **Convertir: OCR en el mismo paso** en PDF a Word y a Excel (como ya hace Resumir PDF); resolución en PDF a imagen; GIF animado y tamaño por página en PDF a PowerPoint. Prioridad alta (OCR) | 🤖 | ✅ Hecho (2026-11-23): casilla "Reconocer el texto de las páginas escaneadas" en PDF a Word y a Excel (OCR local con la posición de cada palabra; Word sin la foto del escaneo, Excel con las columnas); PDF a imagen con resolución (72/150/300 ppp), calidad JPG y páginas; GIF/WebP/PNG animado a GIF con sus cuadros; PDF a PowerPoint con la proporción que más se repite. Detalle en `docs/auditoria/convertir.md` |
| W-147.4 | **Audio y video: varios archivos a la vez y unir videos**; distinguir quién habla en Audio a texto. Prioridad alta (varios y unir) | 🤖 | ✅ Hecho (2026-11-24): varios archivos a la vez en Video a MP3, Convertir y Comprimir (lista de resultados y ZIP), Unir videos (herramienta nueva, hasta 20, mismo tamaño y audio sincronizado) y **Distinguir quién habla** en Audio a texto (pyannote segmentation-3.0 + WeSpeaker, ~12,7 MB aprobados por el usuario, servidos desde el sitio; número de personas opcional, nombres editables, SRT con nombre y VTT con voces). Detalle en `docs/auditoria/audio-video.md` |
| W-147.5 | **Imagen: pincel para corregir Quitar fondo** (y fondo difuminado o de imagen); encuadre automático de la foto tamaño documento. Prioridad alta (pincel) | 🤖 | ✅ Hecho (2026-11-23): Quitar fondo con fondo difuminado o de imagen y "Retocar con pincel" (borrar y recuperar, deshacer y rehacer); Foto tamaño documento con "Encuadrar automáticamente" a partir de la silueta de la IA. Detalle en `docs/auditoria/imagen.md` |
| W-147.6 | **Organizar**: al unir, elegir páginas de cada archivo; miniaturas que se cargan solo al verse (PDF largos); dividir por marcadores o por tamaño; color del número de página | 🤖 | ✅ Hecho (2026-11-23): Unir con "Elegir páginas de cada PDF" (rango por archivo); miniaturas que se dibujan al verse en Dividir, Rotar y Reordenar; Dividir por marcadores (un PDF por capítulo, con su título) y por tamaño (partes de hasta N MB, medidas de verdad); Numerar con color. Detalle en `docs/auditoria/organizar.md` |
| W-147.7 | **Optimizar**: comparar PDF también en imágenes y diseño (página por página); PDF/A-1b y PDF/A-3b | 🤖 | ✅ Hecho (2026-11-24): Comparar con modo Visual (página por página): zonas marcadas lado a lado, vista superpuesta en rojo y verde e informe en PDF; PDF/A con selector de versión 2b, 1b y 3b (validadas con veraPDF 1.30). Detalle en `docs/auditoria/optimizar.md` |
| W-147.8 | **QR**: color a elección, fondo y descarga en PDF; crear varios QR desde una lista (CSV) | 🤖 | ✅ Hecho (2026-11-24): color libre y fondo (también transparente) con aviso de QR invertido o sin contraste; PDF vectorial de 5, 10 o 20 cm; "Varios QR desde una lista" (pegada o CSV/TXT, con nombre) en hoja A4 para imprimir o ZIP de PNG. Detalle en `docs/auditoria/qr.md` |
| W-147.9 | **Seguridad**: reparar PDF cortados (rescatar las páginas que llegaron); quitar metadatos de HEIC, TIFF y video; hash de archivos de varios GB por partes y verificar listas SHA256SUMS | 🤖 | ✅ Hecho (2026-11-24): Reparar PDF rescata las páginas de un archivo cortado ("se rescataron 3 de 6"); Quitar metadatos acepta HEIC/AVIF, TIFF y video MP4/MOV (por partes, sin tocar la imagen ni el video); hash por partes de archivos de varios GB con avance y modo "Verificar lista" (SHA256SUMS). Detalle en `docs/auditoria/seguridad.md` |
| W-147.10 | **Documentos**: comparar la hoja de vida con una oferta (palabras clave que faltan); carta de presentación con los datos de la hoja de vida; valor en letras en portugués e inglés | 🤖 | ✅ Hecho (2026-11-24): "Comparar con una oferta de trabajo" (porcentaje, palabras que faltan con botón para agregarlas y las que ya están), "Carta de presentación" con los datos de la hoja de vida y las fortalezas que coinciden con la oferta (editable, PDF y Word, 12 idiomas) y valor en letras en portugués e inglés. Detalle en `docs/auditoria/documentos.md` |

Fuera de alcance por la promesa de privacidad 100 % local: pedir firmas a otras personas por correo y resumir o reescribir con IA en la nube.

## Guías con imágenes de cada herramienta (pedido del usuario, 2026-11-20)

Que las guías muestren **cómo se ve** cada paso, con capturas reales de la web, y que **cada herramienta**
tenga su guía ilustrada. Hoy las 6 guías (W-19) son solo texto y cubren 13 de las 37 herramientas.

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-99 | **Capturas automáticas de cada herramienta**: script de Playwright (`scripts/screenshots.mjs`) que abre cada una de las 37 herramientas con archivos de muestra (PDF e imágenes generados por el script, nunca documentos reales) y captura sus estados clave: pantalla inicial, archivo cargado/opciones y resultado. Tema claro, ancho de escritorio (1280 px) y de celular (390 px). Salida en `public/img/guides/<herramienta>/<paso>-<ancho>.webp`, optimizada (WebP, ≤ 80 KB) y con tamaño fijo para no mover la página (CLS). Se regeneran con un comando cuando cambia la interfaz; una prueba avisa si una guía apunta a una captura que no existe | 🤖 | ✅ Hecho (2026-11-24) para las herramientas de las 6 guías: `node scripts/screenshots.mjs [herramienta] [idiomas]` (después de `npm run build`) levanta el sitio compilado, abre cada herramienta con PDF y fotos de muestra generados por el script (renglones grises, sin texto ni datos reales) y captura sus pasos (`tools/guide-shots.mjs`, sin buscar botones por su texto) en los 12 idiomas, a 1280 y 390 px, tema claro, sin asistente, aviso de cookies, anuncios ni avisos emergentes. WebP de hasta 80 KB y alto máximo por paso; tamaños en `tools/guide-shots.json`. El generador de páginas corta el build si una guía pide una captura que no existe. Las demás herramientas se suman con W-101 |
| W-100 | **Imágenes en las guías existentes**: nuevo bloque `{ img: '<herramienta>/<paso>', alt: '…' }` en `tools/guides*.mjs`; el generador lo convierte en `<figure>` con `<picture>` (celular/escritorio), `loading="lazy"`, `width`/`height` y `alt` descriptivo traducido. Las 6 guías × 12 idiomas usan las capturas en su idioma cuando la interfaz cambia de idioma (botones visibles), o la española con `alt` traducido si el texto de la captura no importa | 🤖 | ✅ Hecho (2026-11-24): 8 capturas en las 6 guías × 12 idiomas, cada una con la interfaz en el idioma de la guía. En vez de bloques dentro de cada traducción, `tools/guide-images.mjs` dice en qué sección y después de qué bloque va cada una, con su `alt` en los 12 idiomas. Se ven con `<picture>` (390 px en celular, 1280 en escritorio), `width`/`height`, `loading="lazy"` y marco con sombra |
| W-101 | **Una guía ilustrada por herramienta**: completar las guías para las 24 herramientas que aún no tienen (dividir, rotar, ordenar, numerar, marca de agua, editar, comparar, censurar, recortar, OCR, PDF/A, reparar, extraer imágenes, PDF a Word/Excel/texto/JPG, Word/Excel a PDF, imagen: comprimir/redimensionar/recortar/rotar/convertir, ZIP crear/extraer, QR), cada una con sus pasos y capturas; enlazadas desde la página de su herramienta ("Guía con imágenes"). Primero en español y luego en los 12 idiomas, como W-19 | 🤖 + 👤 (revisar textos) | En parte (2026-11-25): **lote 1 en español** — 8 guías de PDF con capturas (`tools/guides-herramientas.mjs`): dividir, girar, ordenar, numerar, marca de agua, editar, comparar y tapar datos (censurar). Una guía puede existir solo en español mientras se traduce (índice, hreflang, menú de idioma y sitemap de cada idioma muestran solo las que tiene); cada guía tiene su fecha (`updated`). Lotes 1 y 2 (16 guías) ya en los 12 idiomas. **Lote 3 en español** (2026-11-27, `tools/guides-herramientas-3.mjs`): cuenta de cobro, hoja de vida, código QR, cambiar el tamaño de una foto, ZIP, recortar PDF, cambiar el formato de una imagen (HEIC, JPG, PNG, WebP) y borrar los datos ocultos de una foto, con capturas e imagen para compartir. Faltan: que el usuario revise los textos, traducir el lote 3 a los 11 idiomas y guías para las herramientas que siguen sin una (audio y video, quitar fondo, foto tamaño documento, contador de palabras, PowerPoint, CSV…) |
| W-102 | **Imágenes en buscadores y redes**: usar la mejor captura de cada guía como `og:image` y en el `Article` de los datos estructurados, para que la guía se vea con imagen al compartirla y en Google Imágenes | 🤖 | **Hecho** (2026-11-27): una imagen de 1200x630 por guía y por idioma (264) en `public/img/og/guias/<idioma>/<slug>.jpg`, con el título y la mejor captura (`ogShot` en `tools/guide-images.mjs`: la marcada con `og`, si no la del resultado, si no la primera). Se generan a mano con `python scripts/og-guides.py` (como `og-images.py`) y el generador de páginas falla si falta alguna. Van en `og:image` (con `og:image:alt`) y en el `image` del Article junto con la captura tal cual |

Orden: W-99 → W-100 → W-101 → W-102. Cuidados: peso de la página (lazy, WebP, tamaño fijo), accesibilidad (`alt`
que describe lo que se ve, no "imagen de…"), y que las capturas no muestren datos personales ni anuncios.

## Sincronización entre la app, la web y el escritorio (opción A, 2026-11-19)

Que lo que el usuario hace en la app Android se vea en la web y en DocuSmart Desktop, y al revés, sin tener que
pensar en cuál usa. La web y Desktop ya son el mismo código (Desktop es la web instalada), así que se sincronizan
**dos** productos: la app Android y la web.

**Decisión del usuario: opción A — el Google Drive del propio usuario como almacenamiento compartido.**
Los datos viajan **cifrados en el dispositivo** a la carpeta oculta de la app en el Drive del usuario
(`appDataFolder`, permiso mínimo `drive.appdata`). DocuSmart **no tiene servidor propio** y nunca ve el contenido.
Encaja con la promesa de privacidad (el texto pasa a "en tu dispositivo o en **tu** Drive, cifrado") y no tiene costo
de servidor. Se descartaron, por ahora: B (servidor propio con cifrado de extremo a extremo: costo creciente y más
superficie que explicar) y C (solo entre dispositivos cercanos: no es sincronización automática).

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-94 | **Base de la sincronización**: inicio de sesión con Google en la app y en la web (la misma cuenta identifica al usuario), acceso a `appDataFolder`, formato común de los datos (versionado) y **cifrado en el dispositivo** con una clave que no sale de los equipos del usuario (derivada o guardada en el almacén seguro de cada plataforma; definir cómo se pasa a un dispositivo nuevo). Resolución de conflictos: gana el cambio más reciente y se guarda una copia del perdedor. Actualizar la política de privacidad (web y app) y el aviso de la promesa "100 % local" | 🤖 + 👤 (validar textos y política) | Pendiente |
| W-95 | **Etapa 1 — Ajustes e historial**: tema, acento, idioma, tamaño de letra, favoritos y el historial de conversiones/herramientas (solo nombres y tipos, nunca el contenido de los archivos). Sirve para validar la base con datos livianos | 🤖 | Pendiente (depende de W-94) |
| W-96 | **Etapa 2 — Notas, estudio y agenda**: notas, tarjetas de repaso, progreso y eventos con sus recordatorios (cada plataforma programa sus propios avisos) | 🤖 | Pendiente (depende de W-95) |
| W-97 | **Etapa 3 — Biblioteca de documentos**: archivos más pesados; subida solo de lo que cambió, sincronización opcional por carpeta y aviso del espacio usado en el Drive del usuario. La Carpeta Segura de la app **no** se sincroniza salvo que el usuario lo active explícitamente | 🤖 + 👤 (decidir límites) | Pendiente (depende de W-96) |
| W-98 | **Etapa 4 — Premium compartido**: que la suscripción comprada en Play valga en la web y Desktop para la misma cuenta de Google (verificación de la compra; requiere un componente de servidor mínimo o la API de Play Developer — evaluar sin romper la opción A para los datos) | 🤖 + 👤 (Play Console) | Pendiente (depende de W-94) |

Orden: W-94 → W-95 → W-96 → W-97; W-98 puede ir en paralelo después de W-94. Reutiliza lo hecho para guardar en
Google Drive (W-45). Requiere cambios en la app Android (repo DocuSmart) en cada etapa.

## App para iPhone a partir de la web (W-149, opción 3, decisión del usuario 2026-11-23)

Se publica DocuSmart en la App Store **empaquetando este mismo código web con Capacitor**. Así no hace falta una
tercera base de código: la app Android está en Kotlin y no corre en iOS. Una app nativa en Swift (opción 1) o con
Kotlin Multiplatform (opción 2) habría obligado a reescribir el núcleo de herramientas, porque iText y POI no existen
en iOS. Con esta opción, la app de iPhone tiene las mismas herramientas que la web desde el primer día, y cada mejora
de la web le llega a iOS en la siguiente versión.

**Cuándo empezar:** cuando la web esté estable, que es el plan acordado: web estable → paridad de la app Android →
iPhone. Mientras tanto, en iPhone ya se puede usar la web instalada desde Safari («Añadir a pantalla de inicio»).

**Principios:**
- **El código es el mismo para todas las plataformas.** Lo que cambia en iOS va detrás de una capa
  `src/shared/platform/native/`, que detecta `Capacitor.isNativePlatform()`. La web y Desktop no cambian de
  comportamiento.
- **Todo sigue siendo local.** Las herramientas van dentro de la app, no se cargan desde docusmart.online, y
  funcionan sin conexión.
- **No es «una web metida en una app».** Apple rechaza esas apps (regla 4.2). Para cumplirla, la app de iPhone
  agrega funciones nativas: el escáner del sistema, abrir archivos desde Archivos o desde «Compartir», guardar y
  compartir con la hoja nativa, y recordatorios.

### Fase 0 — Decisiones y cuentas (antes de escribir código)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.1 | **Cuenta de Apple Developer** (99 USD al año). Si es como empresa (Mountblack), hace falta el número D-U-N-S, que es gratis pero tarda días o semanas. Como persona, sale a tu nombre en la tienda. Luego, en App Store Connect: crear la app, el identificador (bundle id, p. ej. `online.docusmart.app`) y reservar el nombre «DocuSmart» | 👤 | Pendiente |
| W-149.2 | **Dónde se compila**: Xcode solo corre en Mac. Opciones: (a) Codemagic o los equipos macOS de GitHub Actions, que compilan y suben a TestFlight desde el CI sin tener una Mac; (b) alquilar una Mac en la nube para los ajustes en Xcode; (c) una Mac propia. Recomendado: (a), y (b) solo para la configuración inicial y para depurar | 👤 + 🤖 | Pendiente |
| W-149.3 | **iPhone de prueba**: hace falta un iPhone real (idealmente uno de 3 o 4 años, para medir memoria), además de los simuladores. Decidir si la primera versión sale **solo para iPhone** (recomendado) o también para iPad, que exige capturas y pruebas aparte | 👤 | Pendiente |
| W-149.4 | **Modelo de ingresos en iOS**: AdSense **no se puede usar dentro de una app**; en iOS sería AdMob, que ya está en la app Android. Si se vende Premium, Apple exige su propio sistema de compras (regla 3.1.1, comisión del 15 % en el programa para desarrolladores pequeños). Recomendado: la **v1 gratis, con AdMob**, y Premium solo cuando exista el Premium compartido (W-98) | 👤 | Pendiente |

### Fase 1 — Base técnica

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.5 | **Capacitor en el repo**: `@capacitor/core`, `@capacitor/ios` y la carpeta `ios/` (proyecto de Xcode) en git. Una compilación `npm run build:ios` que empaqueta la **app** (`/app/` y sus herramientas, con los wasm, las fuentes, pdf.js y los datos del OCR), sin las páginas SEO ni las guías. La app abre directo en el Inicio de la app web, no en la portada. Ícono y pantalla de inicio con la marca | 🤖 | Pendiente |
| W-149.6 | **Capa de plataforma** `src/shared/platform/native/`: `isNative()` y adaptadores con la misma interfaz que la versión web, para que las herramientas no cambien. Pruebas unitarias en las dos ramas (web y nativa), con cobertura ≥ 80 % para SonarCloud | 🤖 | Pendiente |
| W-149.7 | **Guardar y compartir**: `download()` (`src/shared/files/files.ts`) usa `<a download>`, que no funciona dentro de la app de iOS. En nativo hay que escribir el archivo con `@capacitor/filesystem` y abrir la hoja de compartir de iOS (`@capacitor/share`), con «Guardar en Archivos», AirDrop, WhatsApp y correo. Mismos filtros de tipo y nombre (`safeMimeType`, `safeFilename`) | 🤖 | Pendiente |
| W-149.8 | **Sin service worker en iOS**: WKWebView no lo soporta en una app de Capacitor, y tampoco hace falta, porque todo va dentro de la app. No registrarlo en nativo, y ocultar «Instalar», «Actualizar» y la ayuda de Desktop | 🤖 | Pendiente |
| W-149.9 | **Seguridad dentro de la app**: las cabeceras de `firebase.json` (CSP con Trusted Types) **no se aplican** dentro de la app, así que hay que llevar una CSP equivalente en un `<meta>` del HTML empaquetado. Esa CSP debe permitir el origen `capacitor://localhost` y no tener Google Tag Manager ni AdSense. Revisar que la política `default` de Trusted Types siga bloqueando `createHTML`. Repetir sobre la app la prueba de intrusión de la web | 🤖 | Pendiente |
| W-149.10 | **Memoria**: en iPhone, WKWebView cierra la página si usa demasiada memoria. Medir las herramientas pesadas (video con ffmpeg, archivos 7z, OCR, PDF largos) en el iPhone de prueba y poner límites con mensajes claros, como hace `ArchiveTooBigError`. Ningún cierre inesperado con archivos de hasta 200 MB | 🤖 | Pendiente |

### Fase 2 — Funciones nativas (lo que da valor en iPhone y cumple la regla 4.2)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.11 | **Escáner del sistema** (VisionKit, `VNDocumentCameraViewController`): detecta la hoja, endereza y recorta, igual que el escáner de ML Kit en Android. Las páginas pasan a la herramienta Escanear documento de la web. Cubre en iOS el W-147.1 (cámara en vivo) | 🤖 | Pendiente |
| W-149.12 | **Abrir archivos con DocuSmart**: declarar los tipos de archivo (PDF, imágenes, Office, ZIP) para que aparezcan en «Abrir con» y en la hoja «Compartir» de otras apps (extensión de compartir), y abrir el archivo directo en la herramienta correspondiente. Integración con la app Archivos | 🤖 | Pendiente |
| W-149.13 | **Recordatorios de Agenda y Estudio** con notificaciones locales (`@capacitor/local-notifications`), que suenan con la app cerrada; la API `Notification` de la web no funciona en WKWebView. Permisos de cámara, micrófono (Audio a texto) y notificaciones, con textos en los 12 idiomas en `Info.plist` | 🤖 | Pendiente |
| W-149.14 | **Universal Links**: `/.well-known/apple-app-site-association` en docusmart.online, para que los enlaces de herramientas abran la app si está instalada (lo mismo que W-18 en Android) | 🤖 | Pendiente |
| W-149.15 | **Detalles nativos**: barra de estado y zonas seguras (notch, Dynamic Island), teclado que no tape los campos, gesto de volver atrás, vibración leve al terminar. Nada debe parecer «una página web» | 🤖 | Pendiente |

### Fase 3 — Privacidad, anuncios y requisitos de Apple

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.16 | **AdMob en iOS** (si se aprueba en W-149.4): plugin de AdMob, consentimiento con UMP (como en la web) y el aviso de rastreo **ATT**, que Apple exige antes de mostrar anuncios personalizados. Los anuncios nunca van en el Visor ni durante la lectura (misma regla que en la web) | 🤖 | Pendiente |
| W-149.17 | **Manifiesto de privacidad** (`PrivacyInfo.xcprivacy`), obligatorio para las apps y SDK que usan ciertas APIs (Firebase y AdMob ya traen el suyo); **etiquetas de privacidad** de App Store Connect (qué datos recogen la analítica y los anuncios: nunca los documentos); **cumplimiento de exportación** del cifrado (el QR protegido usa cifrado estándar) | 🤖 + 👤 (cuestionarios) | Pendiente |
| W-149.18 | **Política de privacidad** (`/privacidad` y `legal/` de la app): agregar la app de iOS, AdMob y ATT. Mantener la promesa: «los documentos se procesan en tu iPhone» | 🤖 + 👤 (validar textos) | Pendiente |

### Fase 4 — Compilación, pruebas y publicación

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.19 | **CI de iOS**: job en macOS (Codemagic o GitHub Actions) que compila, firma (certificados y clave de la API de App Store Connect como secretos, nunca en el repo) y sube a **TestFlight** al etiquetar una versión. La web sigue desplegándose sola como hoy | 🤖 + 👤 (certificados) | Pendiente |
| W-149.20 | **Pruebas**: (a) los tests unitarios y de Playwright de siempre, más pruebas de la capa nativa con los plugins simulados; (b) una lista de punta a punta en el iPhone real para las herramientas (abrir, procesar, guardar y compartir), el escáner, los recordatorios, sin conexión y en los 12 idiomas, con capturas en `docs/` | 🤖 + 👤 (probar en el iPhone) | Pendiente |
| W-149.21 | **Beta en TestFlight**: primero pruebas internas (hasta 100 personas, sin revisión de Apple) y luego un grupo externo con enlace público (requiere una revisión corta). Recoger los errores antes de publicar | 👤 | Pendiente |
| W-149.22 | **Ficha de la App Store**: nombre (30 caracteres), subtítulo (30), palabras clave (100), descripción y capturas de 6,9 pulgadas; primero en español (México/Latinoamérica) e inglés, luego en los demás idiomas. Reutilizar la ficha de Play en español neutro | 🤖 + 👤 | Pendiente |
| W-149.23 | **Envío a revisión y publicación**: notas para el revisor de Apple que expliquen qué hace la app sin conexión y las funciones nativas, para evitar un rechazo por la regla 4.2. Responder a lo que pida Apple. Enlazar la App Store desde la portada («Disponible en la App Store», junto al botón de Play) | 👤 + 🤖 | Pendiente |

### Fase 5 — Después del lanzamiento

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-149.24 | **Rutina de versiones**: como el código va dentro de la app, cada mejora de la web llega a iOS solo con una versión nueva en la App Store. Definir el ritmo (p. ej. cada 2 a 4 semanas) y una lista corta antes de cada envío. Evaluar más adelante las actualizaciones en vivo del código web (Capgo o Appflow), dentro de lo que permite Apple | 🤖 + 👤 | Pendiente |
| W-149.25 | **Premium en iPhone**: compras con StoreKit (p. ej. con RevenueCat, que también unifica Play) y Premium compartido entre la app Android, la web y el iPhone para la misma cuenta. Depende de W-98 | 🤖 + 👤 | Pendiente |

Orden: Fase 0 → 1 → 2 → 3 → 4 → 5. Dentro de la Fase 1, primero W-149.5 y W-149.6; después W-149.7 a W-149.10.
Las fases 2 y 3 pueden ir en paralelo. **Costos:** Apple Developer (99 USD al año); compilación en la nube (Codemagic
tiene minutos gratis al mes; GitHub Actions cobra los minutos de macOS en repos privados); un iPhone de prueba si no lo
tienes. **Riesgos:** rechazo por la regla 4.2 (lo mitiga la Fase 2) y memoria en herramientas pesadas (lo mitiga
W-149.10).

## DocuSmart Desktop en Mac y Linux (W-150, pedido del usuario 2026-11-23)

DocuSmart Desktop **no es un programa solo de Windows**. Es la web instalada como app (PWA, W-16), y la PWA ya se
puede instalar en Mac y en Linux con el mismo código. Lo que hoy está pensado para Windows es la **ayuda**: los pasos del
ícono en el escritorio hablan de Edge y del Explorador. Además, no se ha probado en esos sistemas.

Por eso hay dos niveles:
- **Nivel 1 (PWA, barato):** probar, ajustar la ayuda por sistema y anunciarlo. Con esto, Mac y Linux quedan cubiertos
  sin otro código ni otra tienda.
- **Nivel 2 (opcional):** un instalador propio y las tiendas (Mac App Store, Flathub/Snap y, de paso, Microsoft Store),
  para quien busca DocuSmart en la tienda de su sistema.

**Dónde se puede instalar la PWA hoy:**

| Sistema | Navegadores que la instalan | Cómo |
|---|---|---|
| Windows | Edge, Chrome | Botón «Instalar» de la barra de direcciones o el nuestro, «Instalar en este equipo» |
| macOS | Chrome, Edge; **Safari 17 o posterior** (macOS Sonoma) | En Chrome y Edge, igual que en Windows. En Safari: Archivo › «Agregar al Dock» (no tiene `beforeinstallprompt`) |
| Linux | Chrome, Chromium, Edge, Brave | Igual que en Windows; queda en el menú de aplicaciones |
| Cualquiera | Firefox | En escritorio, no instala PWA en Mac ni en Linux: la ayuda debe sugerir otro navegador o usar la web en la pestaña |

### Nivel 1 — PWA en Mac y Linux

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-150.1 | **Detectar el sistema**, además del navegador: `desktopOS()` en `src/shared/platform/pwa.ts` (`windows`, `mac`, `linux`, `chromeos`), con `navigator.userAgentData.platform` cuando exista y el agente de usuario si no. Pruebas unitarias con agentes reales de los tres sistemas | 🤖 | ✅ Hecho (2026-11-26): `desktopOS()` y `currentOS()` en `src/shared/platform/pwa.ts`, con `userAgentData.platform` cuando existe; pruebas con agentes reales de Windows, Mac, Linux, Chromebook, Android e iPad |
| W-150.2 | **Ayuda de instalación por sistema** (`desk.*` en los 12 idiomas): en Mac, «Agregar al Dock» en Safari, y en Chrome/Edge la app queda en Launchpad y en la carpeta Aplicaciones. En Linux, el menú de aplicaciones y «Crear acceso directo» en Chrome. En Firefox, un aviso claro de que no se puede instalar. Atajos de teclado con ⌘ en Mac y Ctrl en los demás | 🤖 | ✅ Hecho (2026-11-26): pasos según sistema y navegador (Safari desde macOS Sonoma; Firefox avisa que no instala y sugiere Chrome, Edge o Safari), «Dónde queda» en cada sistema, ícono y ancla del Dock (Mac) y del panel (Linux), en 12 idiomas. En Mac los atajos se escriben con ⌘ (`withMacKeys`) |
| W-150.3 | **Probar en cada sistema**: macOS (Safari, Chrome y Edge) y Linux (Ubuntu con Chrome y Chromium): instalar, abrir sin conexión, actualizar con el aviso, una sola ventana, accesos directos del manifest, guardar archivos y las herramientas pesadas (wasm, OCR, video). Se puede hacer con una Mac prestada o en la nube y con Ubuntu en una máquina virtual o en WSL. Agregar un job de Playwright con **WebKit** en el CI, que se acerca a Safari | 🤖 + 👤 (probar en Mac) | ✅ Hecho (2026-11-26) sin Mac propia: job «Safari en Mac (WebKit)» en una Mac de GitHub (`macos-latest`, gratis por ser repo público), obligatorio en los PR a main: 220 pruebas pasan. Linux ya se probaba: el job de Playwright corre en Ubuntu con Chromium. Encontró y se corrigió: la vuelta de Drive/Dropbox (dos vías) y la Agenda con un import vacío. Lo que Playwright no simula en WebKit (cámara, salto de la ventana de la nube) se omite ahí |
| W-150.4 | **Abrir archivos con DocuSmart Desktop**: `file_handlers` en el manifest (PDF, imágenes, Office, ZIP), para que aparezca en «Abrir con» del Explorador, del Finder y del gestor de archivos de Linux (navegadores Chromium), usando la `launchQueue` que ya existe. También `share_target`, para recibir archivos que se comparten desde el sistema | 🤖 | ✅ Hecho (2026-11-26): `file_handlers` (PDF, imágenes, Word y Excel) y pantalla «Abrir con DocuSmart» (`#/abrir`) con las herramientas de ese tipo; el archivo pasa a la elegida. `share_target` no: en escritorio Chrome solo lo usa en ChromeOS |
| W-150.5 | **Diferencias de Safari en Mac**: Safari no tiene `beforeinstallprompt`, y la voz, el micrófono (Audio a texto) y la cámara (QR) piden permiso de otra forma. Revisar Modo Estudio, Audio a texto y QR en Safari, y que la CSP con Trusted Types funcione. Hay que verificar desde qué versión Safari aplica Trusted Types; donde no la aplique, la página debe funcionar igual | 🤖 | ✅ Revisado (2026-11-26) en el código: Trusted Types se instala solo si el navegador lo trae (Safari antiguo funciona igual), el grabador de Audio a texto acepta el MP4 de Safari, la cámara y la voz usan APIs que Safari soporta. Falta probarlo en una Mac real (W-150.3) |
| W-150.6 | **Contarlo**: en la portada, en /app/ y en el asistente, decir que DocuSmart Desktop es «para Windows, Mac y Linux», con un ícono por sistema; incluirlo en los datos estructurados (`operatingSystem` del `WebApplication`) y en la página de ayuda de Desktop | 🤖 | ✅ Hecho (2026-11-26): portada en 12 idiomas («Windows, Mac o Linux… Chrome, Edge o Safari»), `operatingSystem` con la lista de sistemas en los datos estructurados y el asistente (qué es y el ícono, también en Mac y Linux) |

### Nivel 2 — Instaladores y tiendas (opcional, después del nivel 1)

| ID | Ítem | Quién | Estado |
|---|---|---|---|
| W-150.7 | **Decidir si vale la pena**: medir en GA4 cuántos visitantes llegan desde Mac y Linux y cuántos instalan la PWA. Si son pocos, el nivel 1 alcanza | 👤 + 🤖 | Pendiente (después de W-150.6) |
| W-150.8 | **Envoltorio con Tauri 2**: un solo proyecto que genera instaladores para macOS (`.dmg`), Linux (`.AppImage`, `.deb`, `.rpm`) y Windows (`.msi`), con el código web dentro, como en W-149. Pesa unos pocos MB porque usa el visor del sistema, frente a más de 100 MB de Electron. Reutiliza la capa de plataforma de W-149.6 (guardar con el diálogo nativo, sin service worker, CSP en `<meta>`) | 🤖 | Pendiente (después de W-149.6) |
| W-150.9 | **Riesgos del visor del sistema**: Tauri usa WKWebView en Mac (las mismas limitaciones que en iPhone) y **WebKitGTK en Linux**, que es más limitado: voz, cámara y micrófono pueden fallar, y el wasm pesado rinde menos. Probar las herramientas una por una; si algo no funciona, ocultarlo en esa plataforma o sugerir la PWA en Chrome | 🤖 | Pendiente (depende de W-150.8) |
| W-150.10 | **Mac**: firmar y **notarizar** el `.dmg` con la misma cuenta de Apple Developer de W-149.1 (sin notarizar, macOS bloquea la app al abrirla). Opcionalmente publicar en la **Mac App Store** (sandbox y revisión de Apple, con las mismas reglas de privacidad y compras de W-149) | 🤖 + 👤 (certificados) | Pendiente |
| W-150.11 | **Linux**: publicar en **Flathub** (la tienda que usan la mayoría de las distribuciones) y opcionalmente en **Snap Store** (Ubuntu). Ambas son gratis, y Flathub revisa el manifiesto antes de publicar | 🤖 + 👤 (cuentas) | Pendiente |
| W-150.12 | **Windows en la Microsoft Store**: se puede publicar la PWA tal cual con PWABuilder, sin Tauri, en una cuenta de desarrollador que ahora es gratis para personas. Es la forma más barata de estar en una tienda de escritorio | 🤖 + 👤 (cuenta) | Pendiente |
| W-150.13 | **Compilación y actualizaciones**: job del CI que compila los tres sistemas (Linux y Windows en sus equipos de GitHub, Mac en el mismo equipo macOS de W-149.19), firma y publica en GitHub Releases. El actualizador de Tauri avisa de cada versión nueva, como hoy el aviso «Actualizar» de la PWA | 🤖 | Pendiente (depende de W-150.8) |

Orden: el nivel 1 primero (W-150.1 → .2 → .3 → .4/.5 → .6); es trabajo de la web y se puede hacer en cuanto la web
esté estable. El nivel 2 va solo si W-150.7 lo justifica y, para no duplicar trabajo, después de la base de iPhone
(W-149.6), que comparte la capa de plataforma. W-150.12 (Microsoft Store) es independiente y barato. **Costos:** el
nivel 1 no cuesta nada. En el nivel 2, la cuenta de Apple ya se paga por W-149; Flathub, Snap y la Microsoft Store son
gratis para personas.

## Mantenimiento y limpieza

| ID | Ítem | Quién | Fecha |
|---|---|---|---|
| W-29 | **Arquitectura de la web por dominio y capas**: `src/features/<dominio>/{ui,core,infra}`, `src/shared/`, `src/entries/`; HTML en `site/`, pruebas en `tests/unit/`; `CLAUDE.md` con la guía del proyecto | 🤖 | ✅ Hecho (PR #48) |
| W-25 | Limpiar el repo de la app: carpeta `website/`, rama local `claude/sitio-web` y `docusmart-web.zip` (copias viejas de la landing) | 🛠️ (esperando tu OK) | — |
| W-26 | Seguimiento de HSTS preload: de *pending* a *preloaded* en hstspreload.org. **Nunca quitar** la cabecera HSTS de `firebase.json` | 👤 | revisar en diciembre de 2026 |
| W-27 | Renovar `public/.well-known/security.txt` (campo `Expires`) | 🛠️ | antes del 2027-10-16 |
| W-28 | Certificados de Firebase (vencen el 2027-02-11): se renuevan solos; confirmar que siguen válidos. Los CAA ya permiten `pki.goog` y `letsencrypt.org` | 👤 | enero de 2027 |
| W-29 | **onnxruntime-web 1.31 aplazado** (2026-11-26): el motor de IA pasó las pruebas, pero en el arnés de Audio a texto (`tests/calidad-audio/`) erró un poco más que la 1.23 (español largo 4,4 % → 6,3 %; dos palabras) y pesa 3 MB más, sin arreglos de seguridad que necesitemos. Volver a medir con la próxima versión antes de actualizar | 🤖 | con la próxima versión de onnxruntime-web |
