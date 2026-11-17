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
| W-41 | Extender a las herramientas PDF de **un archivo → un PDF**: dividir (extraer páginas), rotar, reordenar, numerar, marca de agua, proteger (el resultado se muestra con la contraseña), desbloquear, reparar, OCR (también con fotos), recortar, firmar, censurar, editar, formulario y PDF/A | 🤖 | En revisión (PR) |
| W-42 | Herramientas con **varios archivos** de entrada o salida: Unir (vista de cada PDF y del resultado), Dividir y Extraer imágenes (lista de archivos con miniaturas antes del ZIP), Comparar | 🤖 | Tras W-41 |
| W-43 | **Convertidor**: vista previa de la entrada para PDF, imágenes, Word (se diagrama a PDF para mostrar páginas) y Excel (hojas y filas); vista del resultado: páginas en imagen, PDF generado, contenido del Word/Excel/texto | 🤖 | Tras W-41 |
| W-44 | **Imagen, escáner, archivos y QR**: antes/después de la imagen, páginas del escaneo, contenido del ZIP/7Z, QR generado | 🤖 | Tras W-41 |
| W-45 | **Guardar en Google Drive** directo: OAuth en ventana emergente (sin SDK, compatible con la CSP) y subida con el permiso mínimo `drive.file` | 👤 + 🤖 | **Código listo** (PR #34); el botón aparece cuando pongas el **ID de cliente OAuth** en `src/app/lib/cloudConfig.ts`. Falta que lo crees en Google Cloud (proyecto de Firebase): tipo "Aplicación web", origen `https://docusmart.online`, redirección `https://docusmart.online/oauth`, pantalla de consentimiento con el permiso `drive.file` |
| W-46 | **Guardar en Dropbox** directo: OAuth con PKCE en ventana emergente y subida a Aplicaciones/DocuSmart | 👤 + 🤖 | **Código listo** (PR #34); falta que crees la app en Dropbox Developers (Scoped access, "App folder", permiso `files.content.write`, redirección `https://docusmart.online/oauth`) y pongas la **App key** en `cloudConfig.ts` |
| W-47 | **Enlace y código QR** para abrir el resultado en otro dispositivo | 👤 decide | Implica **subir el archivo** a un servidor, lo que cambia la promesa "tus archivos no salen del navegador". Propuesta: cifrado de extremo a extremo en el navegador (AES-GCM, la clave va en el `#` del enlace y el servidor nunca la ve), Firebase Storage con borrado automático a las 24 h, límite de tamaño y App Check. Requiere plan Blaze y actualizar la política de privacidad. Alternativa sin guardar nada: QR con transferencia directa entre dispositivos (WebRTC, ambos abiertos a la vez; necesita un servidor de señalización) |
| W-48 | **WhatsApp en computador**: la web no puede adjuntar un archivo a WhatsApp Web; solo se puede mandar un enlace | 🤖 | Depende de W-47 (en el celular ya funciona con Compartir) |

## Mantenimiento y limpieza

| ID | Ítem | Quién | Fecha |
|---|---|---|---|
| W-25 | Limpiar el repo de la app: carpeta `website/`, rama local `claude/sitio-web` y `docusmart-web.zip` (copias viejas de la landing) | 🛠️ (esperando tu OK) | — |
| W-26 | Seguimiento de HSTS preload: de *pending* a *preloaded* en hstspreload.org. **Nunca quitar** la cabecera HSTS de `firebase.json` | 👤 | revisar en diciembre de 2026 |
| W-27 | Renovar `public/.well-known/security.txt` (campo `Expires`) | 🛠️ | antes del 2027-10-16 |
| W-28 | Certificados de Firebase (vencen el 2027-02-11): se renuevan solos; confirmar que siguen válidos. Los CAA ya permiten `pki.goog` y `letsencrypt.org` | 👤 | enero de 2027 |
