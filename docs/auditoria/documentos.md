# Auditoría W-146.4 · Documentos

Fecha: 2026-11-22. Herramientas: **Hoja de vida** y **Cuenta de cobro, cotización y recibo**.
Código: `src/features/cv/` y `src/features/billing/` (los PDF los arma `convert/core/officePdf`; el Word, `convert/core/pdfWord`).

## 1. ¿Funciona bien? (pruebas con casos difíciles)

| Caso | Resultado | Gravedad |
|---|---|---|
| Hoja de vida larga (6 cargos con 8 logros cada uno) | 3 páginas, nada se sale de la hoja | ✅ Bien |
| Nombres y habilidades en ruso y japonés | Se ven en el PDF | ✅ Bien |
| Enlace larguísimo sin espacios | Se parte dentro del margen | ✅ Bien |
| **Tamaño de la hoja** | El PDF sale en **A4** y el Word en **Carta**: el mismo documento con dos tamaños, sin poder elegir | 🟡 Inconsistencia |
| Lo escrito si se cierra o recarga la página | Hay aviso al salir, pero **no se guarda solo**: hay que descargar el borrador (.json) a mano | 🟡 Riesgo de perder el trabajo |
| Valor en letras: 1, 21 000, 1 001, 100 000, 101 000, 1 000 000, 2 500 000, 2 000 000 000, 1 billón, USD con centavos | "Un peso", "Veintiún mil", "Mil un", "Cien mil", "Ciento un mil", "Un millón de", "Dos millones quinientos mil", "Dos mil millones de", "Un billón de", "… dólares con 75/100": correctos | ✅ Bien |
| Montos escritos a mano ("1.500.000", "1,500.50", "12,5", "$ 2.000", "1 500 000") | Bien interpretados | ✅ Bien |
| Totales con decimales (3 × 0,1 USD, IVA 19 %, retención 11 %) | Redondeo correcto a la moneda | ✅ Bien |
| Cotización con 80 conceptos y cliente en ruso y japonés | 5 páginas, encabezado de la tabla repetido en cada una, nada se sale | ✅ Bien |
| Numeración consecutiva y datos del emisor recordados | Funciona (en el navegador) | ✅ Bien |
| Valor en letras en otros idiomas | Solo en español (en portugués, "por extenso", es habitual en Brasil) | 🟡 Limitación |

## 2. Comparación con la competencia

Leyenda: ✅ lo tiene · ➖ parcial · ❌ no lo tiene.

### Hoja de vida

| Función | DocuSmart | Canva | Zety | Novorésumé | Jobscan |
|---|---|---|---|---|---|
| Descargar PDF gratis | ✅ (y Word) | ✅ | ❌ (solo TXT gratis) | ➖ (1 página, plantillas limitadas) | ✅ |
| Apta para ATS (una columna, texto real) | ✅ | ❌ (la mayoría de plantillas no) | ✅ | ✅ | ✅ |
| Cantidad de plantillas | ➖ 2 | ✅ cientos | ✅ | ✅ | ➖ |
| **Color de acento y letra** | ❌ | ✅ | ✅ | ✅ | ➖ |
| **Ordenar secciones y secciones propias** | ❌ | ✅ | ✅ | ✅ | ➖ |
| **Guardado automático** | ❌ (borrador manual) | ✅ (cuenta) | ✅ (cuenta) | ✅ (cuenta) | ✅ (cuenta) |
| Elegir **Carta o A4** | ❌ | ✅ | ✅ | ✅ | ➖ |
| **Comparar con una oferta** (palabras clave) | ✅ (W-147.10) | ❌ | ➖ | ✅ | ✅ |
| **Carta de presentación** | ✅ (W-147.10) | ✅ | ✅ | ✅ | ➖ |
| Privacidad | 100 % local, sin cuenta | Cuenta | Cuenta | Cuenta | Cuenta |

### Cuenta de cobro, cotización y recibo

| Función | DocuSmart | Generadores gratis (Wix, FreshBooks, Invoice Simple) | Zoho Invoice | Colombia Move (cuenta de cobro) |
|---|---|---|---|---|
| Cuenta de cobro con valor en letras | ✅ (español, portugués e inglés) | ❌ | ❌ | ✅ |
| Cotización y recibo | ✅ | ➖ | ✅ | ❌ |
| Impuesto y retención por país | ✅ | ➖ | ✅ | ➖ |
| Firma | ✅ | ✅ | ✅ | ➖ |
| **Logo** | ❌ | ✅ | ✅ | ❌ |
| **Descuento** | ❌ | ✅ | ✅ | ❌ |
| **Fecha de vencimiento** | ❌ | ✅ | ✅ | ➖ |
| **Clientes y conceptos guardados** | ❌ (solo el emisor) | ❌ | ✅ | ❌ |
| **Convertir cotización en cobro** e historial | ❌ | ❌ | ✅ | ❌ |
| Privacidad | 100 % local | Varía (algunos suben) | Cuenta | Local |

Fuentes: [Novorésumé vs Zety](https://novoresume.com/career-blog/novoresume-vs-zety), [Canva vs Novorésumé](https://novoresume.com/career-blog/canva-vs-novoresume), [¿Vale la pena pagar un creador de hojas de vida? (Zety)](https://zety.com/blog/is-resume-builder-worth-paying), [Wix – generador de facturas](https://www.wix.com/tools/invoice-generator), [FreshBooks – generador](https://freshbooks.com/tools/invoice-generator), [Invoice Simple](https://app.invoicesimple.com/), [Zoho Invoice – funciones](https://www.zoho.com/invoice/features/), [Colombia Move – cuenta de cobro](https://colombiamove.com/herramientas/cuenta-de-cobro), [Deel – cómo crear una cuenta de cobro](https://www.deel.com/es/blog/como-crear-una-cuenta-de-cobro). Las celdas que esas fuentes no cubren salen del conocimiento general de cada herramienta y conviene confirmarlas a mano.

**Dónde ganamos:** PDF y Word gratis y sin cuenta, hojas de vida aptas para ATS (Canva no), cuenta de cobro "a la colombiana" con valor en letras, retención por país y firma, todo local.
**Dónde quedamos por debajo:** personalización de la hoja de vida (diseño, orden, secciones), guardado automático, logo/descuento/vencimiento en la cuenta de cobro, y clientes e historial guardados.

## 3. Brechas priorizadas

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | Hoja de vida: **Carta o A4** (por defecto según el país) y el mismo tamaño en PDF y Word | Inconsistencia actual; en Colombia y Europa se usa A4, en EE. UU. y México, Carta | Bajo |
| 2 | Hoja de vida: **guardado automático en el navegador** (y "empezar de nuevo") | Hoy se pierde todo al recargar si no se descargó el borrador | Bajo |
| 3 | Hoja de vida: **color de acento, letra (sans o serif)** y una plantilla **compacta**, todas aptas para ATS | Todos los competidores lo tienen | Medio |
| 4 | Hoja de vida: **ordenar secciones** y **secciones propias** (Proyectos, Voluntariado, Logros…) | Paridad con Canva, Zety y Novorésumé | Medio |
| 5 | Cuenta de cobro: **logo, descuento y fecha de vencimiento** | Paridad con los generadores gratis; el vencimiento lo piden en Colombia | Bajo |
| 6 | Cuenta de cobro: **clientes y conceptos guardados**, **historial** y **convertir una cotización en cuenta de cobro o recibo** | Paridad con Zoho, sin cuenta | Medio |
| 7 | Hoja de vida: **comparar con una oferta** (palabras clave que faltan), sin subir nada | Diferenciador (Jobscan y Novorésumé lo cobran) | Medio |
| 8 | **Carta de presentación** con los datos de la hoja de vida | Paridad con Zety, Novorésumé y Canva | Medio |
| 9 | Valor en letras en **portugués e inglés** | Recibos en Brasil | Medio |

## 4. Mejoras hechas y nueva medición

Se hicieron las brechas 1 a 6 (2026-11-22). Las 7 a 9 quedan para más adelante.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 1 | Carta o A4 | Se elige en la pantalla (por defecto según el país del navegador: Carta en Colombia, México, EE. UU…; A4 en el resto) y el PDF y el Word salen con el mismo tamaño y márgenes | Unitaria (tamaño real del PDF y del Word) y E2E |
| 2 | Guardado automático | Interruptor visible, encendido: guarda en este navegador medio segundo después de cada cambio (sin la foto); apagarlo lo borra; botón "Empezar de nuevo". El aviso al salir queda solo si está apagado | E2E (recargar y seguir; empezar de nuevo) |
| 3 | Diseño | Plantilla **Compacta** (letra y márgenes más chicos), **letra** moderna o clásica, y **6 colores** para el nombre y los títulos, todo apto para ATS | Unitaria (colores, tamaños, márgenes) |
| 4 | Orden y secciones propias | Lista para **ordenar las secciones** y **"Otras secciones"** con título y puntos (Proyectos, Voluntariado…); el borrador guarda todo | Unitarias y E2E (el PDF respeta el orden) |
| 5 | Logo, descuento y vencimiento | **Logo** (se ajusta a 4,5 × 2 cm), **descuento %** sobre el subtotal (impuesto y retención se calculan después) y **fecha límite de pago** en las cuentas de cobro | Unitarias y E2E |
| 6 | Clientes, conceptos e historial | Con "Recordar", se guardan **clientes** (para elegirlos), **conceptos** con su último precio y el **historial** de documentos (sin los datos para el pago); desde el historial se **abre** uno o se **convierte una cotización en cuenta de cobro o recibo**; "Borrar historial" lo quita todo | Unitarias y E2E |

**Nueva comparación (filas que cambiaron):** color de acento y letra ✅ · ordenar secciones y secciones propias ✅ · guardado automático ✅ (sin cuenta) · Carta o A4 ✅ · logo, descuento y fecha de vencimiento ✅ · clientes y conceptos guardados ✅ · convertir cotización e historial ✅ (como Zoho, pero sin cuenta y local).

**Queda por debajo:** comparar la hoja de vida con una oferta (#7), carta de presentación (#8) y valor en letras en portugués e inglés (#9). La cantidad de plantillas (3) sigue lejos de Canva, a propósito: todas son aptas para ATS.

## 5. Seguimiento W-147.10 (2026-11-24)

Se hicieron las brechas 7 a 9.

| # | Mejora | Cómo quedó | Prueba |
|---|---|---|---|
| 7 | Comparar con una oferta | Tarjeta **Comparar con una oferta de trabajo** en la hoja de vida: se pega el aviso y se sacan sus palabras clave (las más repetidas, sin palabras vacías en español, inglés y portugués ni las de cualquier aviso como "experiencia" o "requisitos"; pares como "servicio al cliente" o "Power BI"; conserva C++, C#, .NET y siglas como BI). Se comparan con toda la hoja de vida sin tildes, mayúsculas ni plurales: **porcentaje de coincidencia**, **"Te faltan"** (con un botón para agregar cada una a Habilidades) y **"Ya las tienes"**. Todo en el navegador | Unitarias (palabras, pares, siglas, plurales, porcentaje). E2E: con una oferta de analista de datos, "Power BI" falta, se agrega y el porcentaje sube |
| 8 | Carta de presentación | Tarjeta **Carta de presentación**: empresa, cargo (por defecto, el titular), destinatario y por qué le interesa (opcionales). Arma la carta con la ciudad y la fecha, el saludo, el último trabajo (con cargo y empresa), las dos primeras frases del perfil, las **fortalezas que coinciden con la oferta** (o las primeras habilidades), los estudios y la despedida con nombre, teléfono y correo. Queda en un cuadro editable y se guarda en **PDF o Word** con el mismo papel, letra y color de la hoja de vida. Frases en los 12 idiomas | Unitarias (cada párrafo, sin empresa ni oferta, sin frases cojas). E2E: carta con la empresa, editada y en PDF |
| 9 | Valor en letras en portugués e inglés | En la cuenta de cobro, el valor en letras sale en el idioma de la pantalla: **portugués de Brasil** ("Mil duzentos e cinquenta reais e trinta centavos", con "e" entre grupos, "um milhão de reais", bilhão) e **inglés** de cheque ("One thousand two hundred fifty dollars and 30/100"), además del español. En los demás idiomas no se muestra | Unitarias (casos de "e", cem/cento, milhões, centavos, guiones en inglés). E2E en portugués (BRL) e inglés (USD) |

**Nueva comparación:** comparar con una oferta ✅ (como Jobscan, gratis y sin subir nada) · carta de presentación ✅ · valor en letras en portugués e inglés ✅.

**Queda por debajo:** la cantidad de plantillas de hoja de vida (3), a propósito: todas son aptas para ATS.
