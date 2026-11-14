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

### Siguientes

Los de la tabla de abajo, en su orden, empezando por W-34.

### Después (paridad con la app e iLovePDF)

| ID | Ítem | En la app | En iLovePDF | Cómo (navegador) |
|---|---|---|---|---|
| W-34 | **Extraer imágenes de un PDF** | ✅ | ✅ (en "PDF a JPG") | Lista de operadores de pdf.js |
| W-35 | **Editar PDF**: agregar texto, imágenes y formas | ✅ (texto) | ✅ | pdf-lib |
| W-36 | **Formularios PDF**: detectar y llenar campos | ✅ | ✅ | AcroForm de pdf-lib |
| W-37 | **Herramientas de imagen**: comprimir, redimensionar, recortar y rotar | — | (iLoveIMG) | canvas; entradas nuevas en `tools/pages.mjs` |
| W-23 | **Word/Excel/PowerPoint → PDF** | ✅ | ✅ | Evaluar librerías de lectura de Office en el navegador; puede no ser viable con buena fidelidad |
| W-24 | **Escáner con cámara** con detección de bordes | ✅ | ✅ | OpenCV.js o un detector propio |
| W-38 | **PDF a PDF/A** (archivo a largo plazo) | — | ✅ | Requiere incrustar fuentes y perfiles de color; evaluar viabilidad |

## Mantenimiento y limpieza

| ID | Ítem | Quién | Fecha |
|---|---|---|---|
| W-25 | Limpiar el repo de la app: carpeta `website/`, rama local `claude/sitio-web` y `docusmart-web.zip` (copias viejas de la landing) | 🛠️ (esperando tu OK) | — |
| W-26 | Seguimiento de HSTS preload: de *pending* a *preloaded* en hstspreload.org. **Nunca quitar** la cabecera HSTS de `firebase.json` | 👤 | revisar en diciembre de 2026 |
| W-27 | Renovar `public/.well-known/security.txt` (campo `Expires`) | 🛠️ | antes del 2027-10-16 |
| W-28 | Certificados de Firebase (vencen el 2027-02-11): se renuevan solos; confirmar que siguen válidos. Los CAA ya permiten `pki.goog` y `letsencrypt.org` | 👤 | enero de 2027 |
