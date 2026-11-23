# Auditoría W-146.10 · Archivos

Fecha: 2026-11-22. Herramientas (3): **Comprimir (ZIP y 7Z), Descomprimir (ZIP, RAR, 7Z, TAR, GZ, BZ2, XZ), Renombrar**.
Código: `archive/core/archive.ts` (7-Zip compilado a WebAssembly, 7z-wasm), `archive/core/renameBatch.ts` (lógica pura) y `archive/ui/*`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Se armaron archivos difíciles a mano en Node (un ZIP escrito byte por byte, gzip, 7Z) y se pasaron por las mismas funciones que usa la app, con el mismo 7-Zip en WebAssembly.

| Caso | Resultado | Gravedad |
|---|---|---|
| **ZIP hecho con el Explorador de Windows** ("Enviar a → Carpeta comprimida") con nombres en español ("Año 2026/Cotización Ñandú.txt") | **No se abre**: "No se pudo extraer el archivo: puede estar dañado". Windows guarda esos nombres en la página de códigos CP850, sin la marca de UTF-8, y el 7-Zip en WebAssembly no sabe convertirlos: los archivos salen con nombres rotos y la extracción falla. Probado también con `-mcp=850` y `-scsUTF-8`, sin resultado | 🔴 Falla |
| ZIP con nombres en UTF-8 (con la marca) | Bien | ✅ Bien |
| ZIP con rutas peligrosas ("../../evil.txt", "/abs/root.txt") | Bien: quedan dentro ("evil.txt", "abs/root.txt") | ✅ Bien |
| ZIP con una carpeta vacía | Se lista, pero **al extraer la carpeta vacía se pierde** (no queda en el ZIP de descarga) | 🟡 Limitación |
| .gz de un solo archivo; .tar.gz | Bien ("informe.txt"); el .tar.gz se abre en dos pasos | ✅ Bien |
| **Archivo en varias partes** (.7z.001 + .002, .z01, .part1.rar) | Solo se puede elegir un archivo: con la primera parte sola, "puede estar dañado" | 🟠 Falta |
| ISO, CAB, WIM, ARJ, LZH, Z | 7-Zip los abre, pero **el selector no los acepta** | 🟡 Limitación |
| Elegir qué archivos extraer o verlos antes | Se extrae todo; después se puede bajar uno por uno. No hay vista previa | 🟡 Limitación |
| Bomba ZIP (tamaños declarados enormes) | Se rechaza antes de descomprimir (tope de 1,5 GB y 20 000 archivos) | ✅ Bien |
| Crear ZIP con nombres en español | Bien: lleva la marca UTF-8 (Windows 10 y 11, macOS y Android los leen bien) | ✅ Bien |
| Crear con contraseña | ZIP con AES-256 y 7Z con los nombres cifrados también; en ZIP solo letras sin tilde en la clave (lo explica) | ✅ Bien |
| Crear dividido en partes (para correos con límite) | No existe | 🟡 Falta |
| Renombrar | Buscar y reemplazar, texto al inicio y al final, numeración, mayúsculas o minúsculas, nombre nuevo y vista previa; la extensión se respeta y los repetidos se numeran | ✅ Bien |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | ezyZip | Archive Extractor (extract.me) | 7-Zip (escritorio) |
|---|---|---|---|---|
| Sin subir los archivos | ✅ | ✅ (en el navegador) | ❌ | ✅ |
| Gratis y sin límites | ✅ | ➖ (Pro para algunas funciones) | ➖ | ✅ |
| ZIP de Windows con nombres en español | ❌ | ? | ? | ✅ |
| RAR (también RAR5) y 7Z | ✅ | ✅ | ✅ | ✅ |
| **Varias partes** (.001, .z01, .part1.rar) | ❌ | ✅ (Pro) | ✅ | ✅ |
| ISO, CAB y otros | ❌ (el selector no los deja) | ✅ | ✅ (más de 70) | ✅ |
| Elegir qué extraer | ➖ (todo y luego uno por uno) | ✅ | ✅ | ✅ |
| Vista previa del contenido | ❌ | ✅ | ? | ❌ |
| Crear ZIP y 7Z con contraseña AES | ✅ | ✅ | ❌ | ✅ |
| Crear dividido en partes | ❌ | ✅ | ❌ | ✅ |
| Renombrar en lote | ✅ | ❌ | ❌ | ❌ |

Fuentes: [ezyZip: extraer ZIP en varias partes](https://ezyzip.com/extract-multipart-zip-online.html), [ezyZip Pro: extractor (partes, ver antes de extraer)](https://www.ezyzip.com/archive-extractor-en.html), [ezyZip: crear ZIP divididos](https://ezyzip.com/create-split-zip-files.html), [Archive Extractor en Chrome Web Store (más de 70 formatos, contraseña, varias partes)](https://chrome.google.com/webstore/detail/archive-extractor/nknadlalodfadgegkigkmbhofcmkhfnc/support?hl=pt-BR). Las celdas sin fuente salen del conocimiento general de cada herramienta.

**Dónde ganamos:** todo en el equipo y sin límites, contraseña AES, renombrar en lote y protección contra bombas ZIP.
**Dónde quedamos por debajo:** los ZIP de Windows con tildes y eñes, archivos en varias partes, más formatos, elegir qué extraer y vista previa.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Abrir los ZIP de Windows con nombres en español**: leer esos ZIP directamente y pasar los nombres de CP850 a UTF-8 (también al listar) | Falla con los ZIP más comunes en Colombia | Bajo-medio |
| 2 | **Archivos en varias partes**: elegir todas las partes (.001, .002…; .z01…; .part1.rar…) y abrirlas juntas | Paridad; muy común con descargas grandes | Medio |
| 3 | **Conservar las carpetas vacías** al extraer y **aceptar más formatos** (ISO, CAB, WIM, ARJ, LZH, Z, LZMA, CPIO, DEB, RPM) | Pequeñas fallas y paridad | Bajo |
| 4 | **Elegir qué extraer** (casillas) y **ver** imágenes, PDF y texto antes de bajarlos | Paridad con ezyZip | Medio |
| 5 | **Crear dividido en partes** (por ejemplo, de 10 o 25 MB para el correo) | Paridad con 7-Zip y ezyZip | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las 5 brechas (2026-11-22).

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | ZIP de Windows con nombres en español | Se lee el directorio del ZIP. Si hay nombres sin la marca de UTF-8 y con letras fuera del inglés, se abre con fflate y los nombres se pasan de CP850 (la página de códigos del Explorador de Windows en español) a texto, también al listar. Se mantiene el tope contra bombas ZIP. Los ZIP cifrados o con otros métodos de compresión siguen con 7-Zip | Unitarias (la tabla CP850 completa); E2E: "Año 2026/Cotización Ñandú.txt" y "Señal.txt" se abren y se descargan con su nombre |
| 2 | Archivos en varias partes | Se pueden elegir todas las partes juntas (.7z.001…, .zip.001…, .zip con .z01…, .part1.rar…, .rar con .r00…): se reconoce la principal y 7-Zip las abre juntas. Si falta una, lo dice ("Falta una parte del archivo") | Unitarias; E2E con un ZIP de 11 MB en dos partes |
| 3 | Carpetas vacías y más formatos | Las carpetas vacías se conservan al extraer (se ven en la lista y quedan en el ZIP de descarga). Ahora también se aceptan ISO, CAB, WIM, ARJ, LZH, Z, LZMA, CPIO, DEB, RPM y ZST | Unitarias y E2E |
| 4 | Elegir qué extraer y ver antes | Casillas por archivo (con "Todos" y "Ninguno") y botón "Extraer N elegidos". Después de extraer, botón **Ver** para imágenes, PDF (con páginas), texto, Word y Excel | E2E: se extraen 2 de 3 y se ve el texto de uno antes de bajarlo |
| 5 | Crear dividido en partes | Opción **Dividir en partes** de 10, 20 o 25 MB (límites de adjuntos del correo): salen "archivos.zip.001", ".002"… para bajar una por una. Si todo entra en una parte, sale un archivo común. La pantalla avisa que para abrirlo hacen falta todas las partes, con DocuSmart, 7-Zip o WinRAR | Unitarias (dividir y volver a abrir con todas); E2E: 2 partes y, al abrirlas, el archivo idéntico |

**Nueva medición (con los mismos archivos de la sección 1):**
- ZIP de Windows con tildes y eñes: se abre con los nombres bien (antes no se abría).
- Carpeta vacía: se conserva.
- 7Z en dos partes elegidas juntas: se abre; con una parte sola, el aviso es claro.

**Límite conocido:** un ZIP de Windows con contraseña y nombres con tildes sigue dependiendo de 7-Zip, que no convierte esos nombres (es poco común: el Explorador de Windows no crea ZIP con contraseña).

**Quedan sin cambios:** las protecciones contra rutas peligrosas y bombas ZIP, y la marca UTF-8 al crear.
