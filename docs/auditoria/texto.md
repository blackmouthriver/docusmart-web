# Auditoría W-146.12 · Texto

Fecha: 2026-11-23. Herramientas (4): **Contador de palabras, Comparar textos, Generador de contraseñas y Resumir PDF**.
Código: `text/core/stats.ts`, `textDiff.ts` y `password.ts` (puros), `text/ui/TextTools.tsx`, `study/core/summarize.ts` (resumen extractivo, puro) y `summary/ui/SummaryTool.tsx`.

## 1. ¿Funciona bien? (pruebas con casos difíciles)

Se probaron las funciones puras con textos armados para cada caso (prueba temporal de Vitest, ya borrada).

| Caso | Resultado | Gravedad |
|---|---|---|
| **Enlace** "https://docusmart.online/app/" | El enlace cuenta como **3 palabras** (Word y Google Docs cuentan 1) | 🔴 Falla |
| **Correo** "soporte@docusmart.online" | El correo cuenta como **2 palabras** (debería ser 1) | 🔴 Falla |
| **Palabras con guion** "bien-estar e-mail post-COVID" | Cuenta **6** (debería ser 3) | 🔴 Falla |
| Números "Cuesta $1.500.000 o 3,14 USD" | Cuenta 5, bien: los números con separadores son una palabra | ✅ Bien |
| Oraciones con abreviaturas "El Sr. Pérez llegó. La Dra. Gómez no." | Cuenta **4** oraciones (son 2) | 🟠 Falla menor |
| Emojis con tono de piel y familia | Bien: cada emoji cuenta como un carácter | ✅ Bien |
| Saltos de línea de Windows (CRLF), párrafos y líneas | Bien | ✅ Bien |
| Japonés sin espacios | Bien: separa las palabras | ✅ Bien |
| Palabras más repetidas (mayúsculas y minúsculas juntas) | Bien | ✅ Bien |
| Comparar 30 000 palabras con 60 cambios | 69 ms, bien. Pero el parecido dice **100 %** aunque hay cambios (redondeo) | 🟡 Detalle |
| Comparar con saltos de Windows contra saltos de Linux | Bien: iguales | ✅ Bien |
| Comparar "Canción" con "cancion" | Distintos: **no hay opción para ignorar tildes** | 🟡 Falta |
| Comparar | Solo una vista (todo junto); sin **lado a lado**; solo abre .txt (no PDF ni Word) | 🟠 Limitación |
| Contraseña de 200 caracteres | Se limita a 64 (Bitwarden llega a 128) | 🟡 Limitación |
| Contraseña | Aleatoria sin sesgo, con un carácter de cada tipo y entropía bien calculada. **Sin frase de contraseña** (palabras fáciles de recordar) | 🟠 Falta |
| **Resumir una lista con viñetas** (40 puntos sin punto final) | Las 40 viñetas quedan como **una sola oración de 2629 letras**: el resumen sale entero o vacío | 🔴 Falla |
| **Resumir un PDF con encabezado en cada página** ("INFORME ANUAL 2025 Página 1 de 5") | El encabezado **se cuela en la primera oración del resumen** | 🔴 Falla |
| **Palabras cortadas al final de la línea** ("infor-\nmación") | Quedan como "infor- mación" en el resumen | 🟠 Falla |
| Resumir PDF escaneado | Avisa y manda a OCR (no lo hace en un paso) | 🟡 Limitación |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene · ? no confirmado.

| Función | DocuSmart | WordCounter | Diffchecker | Bitwarden / 1Password | QuillBot / SMMRY |
|---|---|---|---|---|---|
| Sin cuenta, sin límites y sin subir el texto | ✅ | ➖ (en el servidor) | ➖ (límites gratis) | ✅ | ❌ (600 palabras gratis en QuillBot) |
| Palabras, caracteres, oraciones, párrafos, tiempo de lectura y en voz alta | ✅ | ✅ | – | – | – |
| Contar bien enlaces, correos y palabras con guion | ❌ | ✅ | – | – | – |
| Palabras clave (densidad) | ✅ | ✅ | – | – | – |
| Nivel de lectura | ❌ | ✅ (Dale–Chall, solo inglés) | – | – | – |
| Comparar: vista lado a lado | ❌ | – | ✅ | – | – |
| Comparar: diferencias por letra | ❌ | – | ➖ (gratis 10 al mes) | – | – |
| Comparar archivos PDF y Word | ❌ (solo .txt) | – | ✅ | – | – |
| Ignorar mayúsculas y espacios | ✅ | – | ✅ | – | – |
| Contraseña aleatoria con opciones | ✅ (hasta 64) | – | – | ✅ (más largas) | – |
| Frase de contraseña (palabras, separador, mayúscula, número) | ❌ | – | – | ✅ | – |
| Resumen de PDF y Word | ✅ | – | – | – | ➖ (PDF de pago en QuillBot) |
| Largo del resumen | ✅ (3 largos) | – | – | – | ✅ (4 niveles en QuillBot) |
| Resumen en viñetas | ❌ | – | – | – | ✅ |
| Palabras clave del documento | ✅ | – | – | – | ➖ |
| Resumen que reescribe con IA | ❌ (extractivo, a propósito: 100 % local) | – | – | – | ✅ |

Fuentes: [Bitwarden: generador de contraseñas y frases](https://bitwarden.com/help/generator), [Bitwarden: frase de contraseña](https://bitwarden.com/blog/how-to-use-the-bitwarden-passphrase-generator/), [Diffchecker: planes y funciones](https://www.diffchecker.com/pricing/), [QuillBot: modos del resumen](https://help.quillbot.com/hc/en-us/articles/35699927701527-What-summarization-modes-are-available-in-QuillBot-Summarizer), [QuillBot: límite gratis](https://quillbot.com/summarize), [WordCounter: nivel de lectura](https://wordcounter.net/blog/tag/reading-level).

**Dónde ganamos:** privacidad (nada sale del equipo), sin límites ni cuenta, 12 idiomas (también japonés y chino), resumen de PDF y Word gratis y con palabras clave.
**Dónde quedamos por debajo:** el conteo con enlaces, correos y guiones; el resumen de listas y de PDF con encabezados; comparar lado a lado y con archivos; la frase de contraseña; el nivel de lectura y el resumen en viñetas.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Contador exacto**: enlaces, correos y palabras con guion cuentan como una; las abreviaturas ("Sr.", "Dra.") no cortan la oración | Falla: el número no coincide con Word | Bajo |
| 2 | **Resumir bien listas y PDF**: cada viñeta o línea de lista es una oración; se unen las palabras cortadas con guion; se quitan encabezados, pies y números de página que se repiten en las páginas | Falla: el resumen sale mal | Medio |
| 3 | **Comparar lado a lado** (dos columnas alineadas, además de la vista junta), **ignorar tildes**, **abrir PDF y Word**, y parecido que nunca dice 100 % si hay cambios | Paridad con Diffchecker (gratis y sin subir nada) | Medio |
| 4 | **Frase de contraseña**: palabras en el idioma del usuario, cantidad, separador, mayúscula y número; largo hasta 128; **excluir caracteres** que pida un sitio | Paridad con Bitwarden y 1Password | Medio |
| 5 | **Contador con nivel de lectura** (Fernández Huerta en español, Flesch en inglés) y **límites comunes** (X/Twitter 280, descripción SEO 160, SMS 160) con barra de avance | Supera a WordCounter, que solo lo hace en inglés | Bajo-medio |
| 6 | **Resumen en viñetas** y botón "copiar como lista" | Paridad con QuillBot | Bajo |
| 7 | Comparar: **marcar la letra que cambió** dentro de una palabra | Diffchecker lo cobra | Medio |
| 8 | Resumir PDF escaneado con **OCR en el mismo paso** | Comodidad | Medio |

Fuera de alcance por la promesa de privacidad 100 % local: resumen que reescribe con IA en la nube.

## 4. Mejoras hechas y nueva medición

Se hicieron las 8 brechas (2026-11-23): las 5 elegidas y, como seguían a nuestro alcance, también la 6, la 7 y la 8.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Contador exacto | Un **enlace** (http, https o www) y un **correo** son una palabra; "bien-estar" y "e-mail" también (un guion suelto entre espacios no une). Los enlaces no cortan la oración ni cuentan como palabras repetidas; "Sr.", "Dra." y las iniciales ("J. García") tampoco cortan la oración | Unitarias y E2E (12 palabras y 1 oración en un texto con enlace, correo y guion) |
| 2 | Resumir listas y PDF | Cada **viñeta** o línea numerada ("•", "-", "1.", "a)") es su propia oración; se unen las **palabras cortadas** al final de la línea ("infor-\nmación"); un título sin punto no se pega al párrafo. En los PDF se quitan **encabezados, pies y números de página** que se repiten en la mitad o más de las páginas (las líneas cortas se comparan sin sus cifras; en páginas cortas solo se miran la primera y la última línea, para no borrar el cuerpo) | Unitarias (40 viñetas → 40 oraciones; encabezado y "Página n de 5" quitados) y E2E con un PDF de 3 páginas |
| 3 | Comparar lado a lado y con archivos | Vista **Lado a lado** con número de línea, líneas cambiadas resaltadas y celda vacía rayada donde no hay nada; opción **Ignorar tildes** (la ñ sigue siendo otra letra); **Abrir archivo** acepta .txt, **PDF y Word** (también en el contador); el parecido ya no dice 100 % si hay cambios | Unitarias y E2E (abre un PDF, 4 filas lado a lado, "Canción" = "Cancion") |
| 4 | Frase de contraseña | Modo **Frase fácil de recordar**: de 3 a 12 palabras (6 por defecto, ~67 bits, "fuerte") de listas propias de **1129 palabras en español y 1243 en inglés** (sin tildes, de 3 a 9 letras; se cargan solo al elegir la frase), separador (guion, punto, guion bajo, espacio o coma), mayúscula inicial y una cifra. Contraseña de hasta **128** caracteres y **excluir caracteres** que un sitio no acepte | Unitarias (entropía, listas sin repetir) y E2E (128 caracteres sin símbolos; frase de 6 y de 3 palabras) |
| 5 | Nivel de lectura y límites | **Nivel de lectura** de 0 a 100 con 7 niveles, según el idioma del texto: Fernández Huerta (español y catalán), Flesch (inglés), Martins (portugués), Kandel y Moles (francés), Flesch-Vacca (italiano) y Amstad (alemán); sílabas con diptongos e hiatos. **Límites**: X 280, SMS 160, título de Google 60, descripción de Google 160 e Instagram 2200, con barra y "Sobran N" | Unitarias (sílabas, texto simple > 80 y técnico < 30) y E2E |
| 6 | Resumen en viñetas | Formato **Viñetas** o **Párrafos**; copiar y descargar (.txt y Word) usan el formato elegido | E2E (el .txt empieza con "• ") |
| 7 | Letra que cambió | En las dos vistas, "contrato" → "contratos" marca solo la "s"; "ano" → "anos" igual aunque lo agregado siga en otra línea. Palabras distintas se marcan enteras. Los conteos no cambian | Unitarias y E2E |
| 8 | Resumir PDF escaneado | Botón **Reconocer y resumir**: OCR en el navegador (idioma de la web, corrige la orientación), con progreso, y luego el resumen sin encabezados repetidos | E2E con un PDF escaneado |

**Nueva comparación (filas que cambiaron):** contar bien enlaces, correos y guiones ✅ · nivel de lectura ✅ (en 7 idiomas; WordCounter solo en inglés) · comparar lado a lado ✅ · diferencias por letra ✅ (Diffchecker las limita a 10 al mes gratis) · comparar archivos PDF y Word ✅ · ignorar tildes ✅ · contraseña hasta 128 ✅ · frase de contraseña ✅ (en español, que Bitwarden no ofrece) · resumen en viñetas ✅ · resumir PDF escaneado ✅.

**Queda por debajo:** solo el resumen que reescribe con IA, fuera de alcance a propósito (promesa 100 % local). En Texto ya no quedan brechas a nuestro alcance.
