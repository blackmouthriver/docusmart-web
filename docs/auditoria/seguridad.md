# Auditoría W-146.3 · Seguridad

Fecha: 2026-11-22. Herramientas: **Proteger PDF, Desbloquear PDF, Reparar PDF, Quitar metadatos, Hash e integridad**.
Código: `src/features/security/` (qpdf en WebAssembly + pdf-lib), `src/features/metadata/` y `src/features/integrity/`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

| Caso | Resultado | Gravedad |
|---|---|---|
| **Proteger** con una contraseña de **más de 127 bytes** (128 letras, o 70 "ñ") | El PDF queda protegido pero **ya no abre con esa contraseña** (AES-256 usa solo los primeros 127 bytes y qpdf no los recorta igual al cifrar y al abrir). Se pierde el acceso al documento | 🔴 Falla grave |
| **Quitar metadatos** de un PDF con **fotos del celular** | El informe dice "no queda nada", pero **cada foto conserva su EXIF**: marca, modelo, autor y **GPS** | 🔴 Falla de privacidad |
| Quitar metadatos de un PDF con **comentarios, adjuntos o JavaScript** | El nombre de quien comentó, los archivos adjuntos y el JavaScript **siguen ahí** y el informe no los menciona | 🟠 Privacidad |
| Quitar metadatos de **Word** con comentarios y control de cambios | El **autor de cada comentario y de cada cambio** (y su correo en `people.xml`) siguen dentro del archivo | 🟠 Privacidad |
| Quitar metadatos de **HEIC (iPhone), TIFF o video** | "Formato no compatible" | 🟡 Limitación |
| Proteger: contraseñas con emoji, cirílico, japonés o espacios (hasta 127 bytes) | Protege y abre bien | ✅ Bien |
| Proteger un PDF que ya tiene contraseña | Mensaje claro: quítala primero | ✅ Bien (pero no se puede cambiar la contraseña directamente) |
| Proteger solo con restricciones (sin contraseña para abrir) | No se puede: siempre pide contraseña para abrir | 🟡 Limitación |
| Desbloquear un PDF que solo tiene restricciones | Funciona sin contraseña | ✅ Bien |
| **Reparar**: sin `%%EOF`, tabla de referencias con posiciones malas, basura al inicio | Recupera las 5 páginas | ✅ Bien |
| Reparar un archivo **cortado** (descarga interrumpida) | "Demasiado dañado": no recupera ni las páginas que sí llegaron | 🟡 Limitación |
| Hash: SHA-256/512, SHA-1, MD5; calcular, verificar, comparar, lista y certificado | Funciona | ✅ Bien |
| Hash de archivos muy grandes (varios GB) | Lee el archivo entero en memoria: en celulares puede fallar | 🟡 Riesgo |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene.

| Función | DocuSmart | iLovePDF | PDF24 | Smallpdf | Adobe Acrobat | Quitadores de metadatos (ezgif, Univik, ExifTool) |
|---|---|---|---|---|---|---|
| Proteger con AES-256 y permisos (imprimir, copiar, modificar) | ✅ | ➖ | ✅ | ➖ | ✅ | — |
| Proteger **solo con restricciones** (sin contraseña para abrir) | ❌ | ❌ | ➖ | ❌ | ✅ | — |
| **Cambiar** la contraseña de un PDF protegido | ❌ | ❌ | ❌ | ❌ | ✅ | — |
| Desbloquear (con contraseña o solo restricciones) | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Reparar estructura dañada | ✅ | ✅ | ✅ | ✅ | ➖ | — |
| Reparar **archivos cortados** (recuperar lo que llegó) | ✅ (W-147.9) | ➖ | ➖ | ➖ | ➖ | — |
| Quitar metadatos de PDF (información, XMP) | ✅ | ❌ | ➖ | ❌ | ✅ | ➖ |
| Limpiar **fotos dentro del PDF**, comentarios, adjuntos y JavaScript ("sanitizar") | ❌ | ❌ | ❌ | ❌ | ✅ (Pro) | ❌ |
| Fotos JPG, PNG, WebP | ✅ | — | — | — | — | ✅ |
| Fotos **HEIC** y TIFF | ✅ (W-147.9, también video) | — | — | — | — | ✅ |
| **Video** | ❌ | — | — | — | — | ➖ |
| Word/Excel/PowerPoint: propiedades | ✅ | — | — | — | — | ✅ |
| Word: **autores de comentarios y cambios** | ❌ | — | — | — | — | ✅ (Univik, Inspector de Word) |
| Hash: calcular, verificar, comparar, certificado | ✅ | — | — | — | — | — |
| **Privacidad** | 100 % local | Sube | Sube (o escritorio) | Sube | Escritorio | La mayoría sube el archivo |

Fuentes: [PDF24 – Proteger PDF](https://tools.pdf24.org/en/protect-pdf), [Adobe – contraseñas](https://helpx.adobe.com/acrobat/current/securing-pdfs-passwords.html), [Adobe – sanitizar](https://helpx.adobe.com/acrobat/desktop/protect-documents/redact-pdfs/sanitize.html) y [contenido sensible](https://helpx.adobe.com/acrobat/current/removing-sensitive-content-pdfs.html), [iLovePDF – reparar](https://www.ilovepdf.com/blog/how-to-repair-corrupt-pdf-file), [ezgif – quitar EXIF](https://ezgif.com/exif-remover), [Univik – quitar metadatos](https://univik.com/file/metadata/remover.html). Las celdas que esas fuentes no cubren salen del conocimiento general de cada herramienta y conviene confirmarlas a mano.

**Dónde ganamos:** todo ocurre en el dispositivo (justo lo que importa en herramientas de seguridad), AES-256 con permisos, quitar metadatos de PDF, fotos y Office en un solo lugar, hash con certificado.
**Dónde quedamos por debajo:** las dos fallas (contraseña larga y fotos dentro del PDF), limpiar contenido oculto del PDF y autores en Word, HEIC, y reparar archivos cortados.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Contraseña de hasta 127 bytes**: avisar y no dejar proteger con una más larga (contador en la pantalla) | Falla grave: el usuario pierde el acceso a su PDF | Bajo |
| 2 | **Quitar el EXIF de las fotos dentro del PDF** (sin recomprimir) y mostrarlo en el informe | Falla de privacidad: decimos "limpio" y no lo está | Bajo-medio |
| 3 | **Limpiar el contenido oculto del PDF**: avisar y quitar (opcional) comentarios y su autor, adjuntos, JavaScript y acciones | Paridad con "Sanitizar" de Adobe | Medio |
| 4 | **Word, Excel y PowerPoint: anonimizar autores** de comentarios y control de cambios, y quitar `people.xml` | Paridad con el Inspector de Word y Univik | Medio |
| 5 | **Proteger solo con restricciones** (sin contraseña para abrir) y **cambiar la contraseña** de un PDF protegido (con la actual) | Paridad con Adobe/PDF24 | Bajo |
| 6 | Reparar **archivos cortados**: rescatar las páginas que sí llegaron | Descargas interrumpidas, adjuntos dañados | Medio-alto |
| 7 | Quitar metadatos de **HEIC y TIFF** (y luego video MP4) | Fotos de iPhone | Medio-alto |
| 8 | Hash de **archivos grandes por partes** (sin cargarlos enteros) y **verificar una lista SHA256SUMS** completa | Archivos de varios GB en celular | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 5 (2026-11-22). Las 6 a 8 quedan para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Contraseña de hasta 127 bytes | La pantalla avisa ("Demasiado larga: máximo 127 bytes") y no deja proteger; la lógica también lo rechaza, para la contraseña de abrir y la de propietario | Unitaria (127 abre, 128 y 70 "ñ" se rechazan) y E2E |
| 2 | Fotos dentro del PDF sin EXIF | Se quita el EXIF (cámara, autor, GPS) de cada foto JPEG del PDF sin recomprimirla, y el informe muestra "Fotos con datos" antes y nada después | Unitaria (los píxeles quedan iguales) y E2E con una foto real |
| 3 | Contenido oculto del PDF | Siempre se borra el autor y la fecha de los comentarios; con la opción (encendida por defecto) se quitan comentarios, adjuntos, JavaScript y acciones automáticas, y se conservan los enlaces. El informe los muestra | Unitarias y E2E |
| 4 | Autores en Office | Word (comentarios y control de cambios, `people.xml` con correos), Excel (autores y personas) y PowerPoint (autores de comentarios) pasan a "Autor"; el nombre de las tablas de Excel no se toca | Unitarias de los tres formatos y E2E de Word |
| 5 | Proteger solo con restricciones y cambiar la contraseña | Modo "Solo restricciones" (abre sin contraseña, con permisos limitados y un aviso de que no es cifrado fuerte); con un PDF ya protegido, se pide la contraseña actual para cambiarla o cambiar sus permisos | Unitarias y E2E |

**Nueva comparación (filas que cambiaron):** proteger solo con restricciones ✅ · cambiar la contraseña ✅ · limpiar fotos dentro del PDF, comentarios, adjuntos y JavaScript ✅ (como "Sanitizar" de Adobe, pero gratis y local) · autores de comentarios y cambios en Word ✅ (también Excel y PowerPoint).

**Queda por debajo:** reparar archivos cortados (#6), HEIC/TIFF/video (#7) y hash de archivos de varios GB y listas SHA256SUMS (#8).

## 5. Seguimiento W-147.9 (2026-11-24)

Se hicieron las brechas 6 a 8.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 6 | Reparar archivos cortados | Si el PDF no abre (o no tiene páginas), **Reparar PDF** lo rescata: recorre el archivo buscando los objetos que llegaron completos (también dentro de flujos de objetos, descomprimiendo en parte el que quedó cortado), reconoce las páginas con todo su contenido, les copia lo que heredaban (tamaño, recursos, giro), las ordena según el árbol de páginas si llegó y arma un PDF nuevo con su propia tabla. El aviso dice "se rescataron 3 de 6 páginas". Antes ni pdf-lib ni qpdf abrían el archivo | Unitarias: cortes al 95/85/70/60/30 % → 5/5/4/3/1 páginas con su texto y su tamaño, qpdf sin errores; flujo de objetos cortado; PDF sano sin rescate; cifrado o sin páginas avisa. E2E: PDF de 6 páginas cortado al 60 % → 3 páginas |
| 7 | Metadatos de HEIC, TIFF y video | **HEIC/AVIF**: los ítems EXIF (cámara, GPS, autor) y XMP se ponen en cero; la imagen y la orientación (`irot`) no se tocan. **TIFF**: en cada página se quitan cámara, programa, fechas, autor, derechos, EXIF, GPS, XMP, IPTC, Photoshop y los textos de Windows, y sus valores se borran del archivo; se conserva lo necesario para ver la imagen y la orientación. **Video MP4/MOV/M4V/3GP**: `udta`, `meta` y XMP pasan a cajas vacías del mismo tamaño y se borran las fechas de creación y modificación; se lee y escribe por partes, así que sirve para videos de varios GB | Unitarias de los tres formatos (lo personal ya no está en los bytes, la imagen y el video quedan iguales byte por byte). E2E: HEIC con GPS y TIFF en un ZIP limpio; un MP4 grabado en el navegador con ubicación queda limpio, del mismo tamaño, y se sigue reproduciendo |
| 8 | Hash de archivos grandes y listas | Desde 256 MB (y siempre en MD5) el hash se calcula **por partes de 8 MB**, sin cargar el archivo, con avance ("Leyendo por partes… 45 %"): SHA-256 a ~180 MB/s, SHA-1 ~200, SHA-512 y MD5 ~80-90 (las constantes de SHA se calculan con raíces enteras exactas). Modo nuevo **Verificar lista**: pegar o cargar SHA256SUMS/MD5SUMS/.sha256 (formato de sha256sum, `*` binario y BSD/macOS), elegir los archivos y ver cada uno como correcto, cambiado o faltante, más los que no están en la lista | Unitarias: igual a Web Crypto en los 4 algoritmos con cualquier corte, vectores conocidos, avance y cancelar; listas en los 3 formatos y emparejar por nombre. E2E: lista con uno correcto, uno cambiado y uno faltante |

**Límite conocido:** en los PDF que guardan las páginas en un solo flujo de objetos al final (como los que escribe pdf-lib), si el corte cae antes de ese flujo no quedan páginas que rescatar. Los de Word, LibreOffice, Chrome y escáneres no tienen ese problema.

**Nueva comparación:** reparar archivos cortados ✅ (rescata lo que llegó, con aviso) · HEIC, TIFF y video ✅ · hash de varios GB ✅ · verificar listas SHA256SUMS ✅.

**Queda por debajo:** nada de lo auditado.
