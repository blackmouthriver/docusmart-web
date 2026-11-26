// Guías ilustradas por herramienta (W-101), lote 2: reconocer texto, convertir desde PDF, PDF/A y
// reparar. Mismo formato que tools/guides.mjs. Se publican primero en español; cada idioma las suma
// al traducirlas.

const UPDATED = '2026-11-26'

export const TOOL_GUIDES_2 = [
  {
    slug: 'pasar-un-pdf-escaneado-a-texto',
    updated: UPDATED,
    title: 'Cómo pasar un PDF escaneado a texto que se puede copiar y buscar | DocuSmart',
    description:
      'Reconoce el texto de un PDF escaneado con OCR: cópialo, descárgalo en .txt o Word, o crea un PDF buscable. En 12 idiomas, gratis y sin subir el archivo.',
    h1: 'Cómo pasar un PDF escaneado a texto que se puede copiar y buscar',
    lead: 'Un escaneo es una foto de cada página: se lee, pero no se puede copiar ni buscar una palabra. Con OCR el texto vuelve a ser texto, sin escribirlo de nuevo.',
    minutes: 4,
    icon: 'text',
    tools: ['ocr-pdf', 'pdf-a-word', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Qué hace el OCR',
        body: [
          'OCR quiere decir reconocimiento óptico de caracteres: el programa mira la imagen de cada página y reconoce las letras. [OCR: reconocer texto](/ocr-pdf) te entrega dos cosas a la vez:',
          { ul: [
            '**El texto reconocido**, para copiarlo o descargarlo en .txt o Word, con la página de donde sale cada parte.',
            '**Un PDF buscable**: el mismo escaneo, idéntico a la vista, con una capa de texto invisible encima. Puedes seleccionar, copiar y buscar palabras con Ctrl+F.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [OCR: reconocer texto](/ocr-pdf) y elige el PDF escaneado (también sirve una foto en JPG, PNG o WebP). Elige el **idioma del documento**: el reconocimiento acierta mucho más cuando sabe qué idioma esperar. Si el documento mezcla su idioma con inglés, marca también esa casilla.',
          'Deja marcado **Generar también un PDF buscable** si quieres el PDF, y pulsa **Reconocer texto**. Verás el avance página por página. Al terminar tienes el PDF para descargar y, debajo, el texto, que puedes copiar o bajar en .txt o Word.',
          { tip: 'La primera vez se descarga el modelo del idioma (unos segundos) y queda guardado en tu navegador: las siguientes veces empieza enseguida.' },
        ],
      },
      {
        h2: 'Cómo lograr un mejor resultado',
        body: [
          'El OCR lee lo que ve. Un escaneo nítido, derecho y con buena luz se reconoce casi sin errores; una foto borrosa, con sombras o muy chica, no. Si el reconocimiento sale dudoso, DocuSmart te avisa con el porcentaje de confianza para que revises el texto.',
          { ul: [
            'Las páginas que vienen giradas se detectan y se leen derechas solas.',
            'Las páginas que ya tienen texto (un PDF mixto) se dejan tal cual, salvo que marques **Reconocer también las páginas que ya tienen texto**.',
            'Funciona con letra impresa. La letra a mano casi nunca se reconoce bien.',
          ] },
        ],
      },
      {
        h2: 'Si lo que quieres es editarlo en Word',
        body: [
          'Si tu meta es corregir el documento y no solo copiar el texto, usa directamente [PDF a Word](/pdf-a-word) con la casilla de OCR: reconoce las páginas escaneadas en el mismo paso y arma un .docx editable. Y si el PDF buscable quedó pesado para enviarlo, pásalo por [Comprimir PDF](/comprimir-pdf).',
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'El reconocimiento corre en tu navegador con Tesseract, un motor de OCR de código abierto. El PDF no se sube a ningún servidor, así que puedes usarlo con cédulas, historias clínicas o extractos sin dejar copias en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre OCR', text: 'Entra a docusmart.online/ocr-pdf y elige el PDF escaneado o una foto.' },
      { name: 'Elige el idioma', text: 'Escoge el idioma del documento y marca si también tiene texto en inglés.' },
      { name: 'Reconoce el texto', text: 'Pulsa Reconocer texto y espera a que termine cada página.' },
      { name: 'Descarga', text: 'Descarga el PDF buscable o copia el texto, o bájalo en .txt o Word.' },
    ],
    faq: [
      ['¿Qué es un PDF buscable?', 'Es tu mismo escaneo con una capa de texto invisible encima: se ve igual, pero puedes seleccionar, copiar y buscar palabras.'],
      ['¿Cuántas páginas puedo reconocer?', 'Las que necesites: se reconocen una por una en tu navegador. Un documento largo tarda más, pero no hay límite de páginas.'],
      ['¿Reconoce varios idiomas?', 'Doce: español, inglés, portugués, francés, italiano, alemán, catalán, euskera, ruso, japonés, coreano y chino. Si el documento mezcla su idioma con inglés, marca esa casilla.'],
    ],
  },
  {
    slug: 'copiar-el-texto-de-una-foto',
    updated: UPDATED,
    title: 'Cómo copiar el texto de una foto o una captura de pantalla | DocuSmart',
    description:
      'Saca el texto de una foto, una captura o un documento fotografiado y cópialo, corrígelo o pásalo a Word. Gratis, en 12 idiomas y sin subir la imagen.',
    h1: 'Cómo copiar el texto de una foto o una captura de pantalla',
    lead: 'Una foto de un recibo, una captura de un chat o un cartel: tienes el texto delante, pero no lo puedes copiar. Así lo sacas en segundos, sin escribirlo a mano.',
    minutes: 3,
    icon: 'copy',
    tools: ['imagen-a-texto', 'ocr-pdf', 'imagen-a-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Imagen a texto](/imagen-a-texto) y elige la foto. Sirven JPG, PNG, WebP y también las fotos HEIC del iPhone. Si es una captura de pantalla, ni siquiera tienes que guardarla: cópiala y pégala en la página con **Ctrl+V**.',
          'Elige el **idioma del texto** y pulsa **Reconocer texto**. En unos segundos aparece el texto en un recuadro que puedes corregir. Desde ahí lo copias con un toque o lo descargas en .txt o en Word (.docx).',
          { tip: 'Si el texto mezcla español con palabras en inglés (nombres de productos, términos técnicos), marca "El documento también tiene texto en inglés": acierta más con esas palabras.' },
        ],
      },
      {
        h2: 'Varias fotos a un solo documento',
        body: [
          'Si fotografiaste un documento de varias hojas, elige todas las fotos a la vez. El texto de todas sale junto, en orden, y lo bajas en un solo Word. Es la forma más rápida de pasar a digital unas páginas impresas que te prestaron.',
        ],
      },
      {
        h2: 'Cómo tomar la foto para que se lea bien',
        body: [
          'El reconocimiento depende de la foto. Unos detalles marcan la diferencia:',
          { ul: [
            '**Buena luz y sin sombras**: la sombra del celular encima del papel es la causa más común de errores.',
            '**De frente y derecha**: cuanto menos inclinada, mejor.',
            '**Que el texto se vea grande**: acércate hasta que la hoja llene la foto.',
            '**Nítida**: si la foto salió movida, tómala de nuevo.',
          ] },
          'Si el resultado sale dudoso, DocuSmart te avisa con el porcentaje de confianza para que revises el texto antes de usarlo. La letra a mano casi nunca se reconoce bien: la herramienta está pensada para texto impreso o de pantalla.',
        ],
      },
      {
        h2: '¿Foto o PDF escaneado?',
        body: [
          'Si lo que tienes es un PDF escaneado de varias páginas, o quieres conservar el documento con su aspecto y además poder buscar palabras, usa [OCR: reconocer texto](/ocr-pdf), que crea un PDF buscable. Y si necesitas entregar las fotos como un documento, júntalas antes con [Imagen a PDF](/imagen-a-pdf).',
        ],
      },
      {
        h2: 'Tus fotos no salen del equipo',
        body: [
          'El texto se reconoce en tu navegador: las imágenes no se suben a ningún servidor. Puedes usarlo con fotos de documentos, recibos o conversaciones sin dejar copias en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Imagen a texto', text: 'Entra a docusmart.online/imagen-a-texto y elige la foto, o pega una captura con Ctrl+V.' },
      { name: 'Elige el idioma', text: 'Escoge el idioma del texto de la imagen.' },
      { name: 'Reconoce el texto', text: 'Pulsa Reconocer texto y revisa el resultado en el recuadro.' },
      { name: 'Copia o descarga', text: 'Cópialo con un toque o descárgalo en .txt o Word.' },
    ],
    faq: [
      ['¿Funciona con fotos del iPhone?', 'Sí. Las fotos HEIC se abren directamente, sin convertirlas antes.'],
      ['¿Reconoce letra a mano?', 'Casi nunca bien. Funciona con texto impreso o de pantalla.'],
      ['¿Puedo corregir el texto antes de copiarlo?', 'Sí. El texto aparece en un recuadro editable: corrige lo que haga falta y después cópialo o descárgalo.'],
    ],
  },
  {
    slug: 'convertir-un-pdf-a-word-para-editarlo',
    updated: UPDATED,
    title: 'Cómo convertir un PDF a Word para editarlo, también escaneado | DocuSmart',
    description:
      'Pasa un PDF a un Word (.docx) editable con títulos, negritas, tablas, imágenes y dos columnas. Con OCR para los escaneados, gratis y sin subir el archivo.',
    h1: 'Cómo convertir un PDF a Word para editarlo, también si está escaneado',
    lead: 'Te mandaron un PDF y tienes que cambiarle una fecha, un nombre o un párrafo, pero no tienes el Word original. Así lo recuperas como documento editable.',
    minutes: 4,
    icon: 'file',
    tools: ['pdf-a-word', 'editar-pdf', 'word-a-pdf'],
    sections: [
      {
        h2: 'Antes de convertir: qué esperar',
        body: [
          'Un PDF no guarda párrafos ni tablas: solo letras con su posición en la página. Por eso cualquier conversión a Word **reconstruye** el documento, y el resultado se parece mucho al original, pero no es idéntico. [PDF a Word](/pdf-a-word) conserva:',
          { ul: [
            'Títulos, negrita, cursiva, tamaños y colores de letra.',
            'Listas, tablas sencillas e imágenes.',
            'Diseños a dos columnas, como los de las hojas de vida, con el fondo de cada columna.',
          ] },
          'Los cuadros de texto y las formas decorativas complejas pueden quedar distintos. Funciona mejor con PDF creados desde Word o un programa parecido.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [PDF a Word](/pdf-a-word) y elige el archivo. Si el PDF es escaneado, o tiene algunas páginas escaneadas, deja marcada la casilla **Reconocer el texto de las páginas escaneadas** y elige el idioma del documento: esas páginas se leen con OCR en el mismo paso y su texto queda editable.',
          'Pulsa **Convertir**. Verás una vista aproximada del resultado junto al original, con cuántos párrafos e imágenes salieron. Descarga el .docx y ábrelo en Word, Google Docs, LibreOffice, Pages o WPS.',
          { tip: 'Revisa el documento al abrirlo, sobre todo las tablas y los saltos de página: es donde más suele variar el diseño.' },
        ],
      },
      {
        h2: '¿Necesitas Word o basta con editar el PDF?',
        body: [
          'Si solo vas a cambiar una palabra, poner una fecha o tapar un dato, no hace falta pasar por Word: con [Editar PDF](/editar-pdf) escribes encima del PDF y queda igual que antes, con su diseño exacto. Convertir a Word conviene cuando vas a reescribir párrafos enteros o reutilizar el contenido en otro documento.',
        ],
      },
      {
        h2: 'De vuelta a PDF',
        body: [
          'Cuando termines de editar, guarda el documento y conviértelo de nuevo con [Word a PDF](/word-a-pdf) para enviarlo. Así quien lo reciba lo ve igual en cualquier equipo, sin depender de las fuentes que tenga instaladas.',
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'La conversión, y el OCR de las páginas escaneadas, se hacen en tu navegador: el PDF no se sube a ningún servidor. Sirve igual para contratos, hojas de vida o documentos de trabajo que no deben circular.',
        ],
      },
    ],
    steps: [
      { name: 'Abre PDF a Word', text: 'Entra a docusmart.online/pdf-a-word y elige el PDF.' },
      { name: 'Activa el OCR si hace falta', text: 'Si tiene páginas escaneadas, deja marcada la casilla de OCR y elige el idioma.' },
      { name: 'Convierte', text: 'Pulsa Convertir y revisa la vista aproximada.' },
      { name: 'Descarga y edita', text: 'Descarga el .docx y ábrelo en Word, Google Docs o LibreOffice.' },
    ],
    faq: [
      ['¿Queda idéntico al PDF?', 'Muy parecido, pero no idéntico: el documento se reconstruye a partir de la posición de las letras. Títulos, formato, listas, tablas sencillas, imágenes y dos columnas se conservan.'],
      ['¿Funciona con PDF escaneados?', 'Sí. Con la casilla de OCR marcada, las páginas escaneadas se reconocen en tu navegador y su texto queda editable.'],
      ['¿Se puede convertir un PDF con contraseña?', 'Si solo tiene restricciones (se abre sin contraseña), sí. Si pide contraseña para abrirse, quítasela primero con Desbloquear PDF.'],
    ],
  },
  {
    slug: 'pasar-un-extracto-bancario-pdf-a-excel',
    updated: UPDATED,
    title: 'Cómo pasar un extracto bancario o una factura en PDF a Excel | DocuSmart',
    description:
      'Convierte las tablas de un extracto, una factura o un reporte en PDF a una hoja de Excel con los números listos para sumar. Gratis y sin subir el archivo.',
    h1: 'Cómo pasar un extracto bancario o una factura en PDF a Excel',
    lead: 'Necesitas sumar los gastos del mes, conciliar una cuenta o filtrar un reporte, y los datos están en un PDF. Así los pasas a una hoja de cálculo sin copiar celda por celda.',
    minutes: 4,
    icon: 'chart',
    tools: ['pdf-a-excel', 'ocr-pdf', 'excel-a-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [PDF a Excel](/pdf-a-excel) y elige el PDF. Elige cómo quieres las **Hojas**:',
          { ul: [
            '**Una por página**: cada página del PDF en su propia hoja. Útil para reportes donde cada página es una tabla distinta.',
            '**Todo en una hoja**: todas las filas seguidas en una sola hoja. Lo mejor para un extracto de varias páginas, porque así lo filtras y lo sumas de una vez.',
          ] },
          'Pulsa **Convertir**. Verás una vista aproximada con cuántas filas y números salieron. Descarga el .xlsx y ábrelo en Excel, Google Sheets o LibreOffice.',
        ],
      },
      {
        h2: 'Los números quedan como números',
        body: [
          'Este es el detalle que ahorra más tiempo: valores como 1.500.000, $ 2.000, 3,5 o 45 % se guardan como números de Excel con su formato, no como texto. Puedes sumarlos, sacar promedios o usarlos en fórmulas apenas abres el archivo, sin limpiar los puntos ni los signos de pesos.',
          { tip: 'Si una columna de valores no suma, revisa que esa columna no tenga mezclados textos como "N/A" o guiones: Excel ignora esas celdas en la suma.' },
        ],
      },
      {
        h2: 'Con qué PDF funciona mejor',
        body: [
          'Las columnas se arman según la posición del texto en la página. Por eso funciona muy bien con los PDF que exporta un sistema: extractos bancarios, facturas electrónicas, reportes contables o listados. Con PDF de diseño libre, donde el texto no sigue columnas, el resultado necesita más revisión.',
          'Si el extracto es escaneado, o una foto que alguien pasó a PDF, deja marcada la casilla **Reconocer el texto de las páginas escaneadas** y elige el idioma: esas páginas se leen con OCR en el mismo paso y cada columna queda en su celda. Cuanto más nítido el escaneo, mejor el resultado.',
        ],
      },
      {
        h2: 'Para volver a entregarlo',
        body: [
          'Si después de trabajar la hoja tienes que enviarla como documento, conviértela con [Excel a PDF](/excel-a-pdf). Y si solo necesitas el texto del escaneo, sin tablas, usa [OCR: reconocer texto](/ocr-pdf).',
        ],
      },
      {
        h2: 'Tus datos no salen del equipo',
        body: [
          'Un extracto bancario tiene tu número de cuenta, tu saldo y tus movimientos. Aquí la conversión se hace en tu navegador: el PDF no se sube a ningún servidor ni queda guardado en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre PDF a Excel', text: 'Entra a docusmart.online/pdf-a-excel y elige el PDF.' },
      { name: 'Elige las hojas', text: 'Una hoja por página, o todo en una sola hoja para sumar de una vez.' },
      { name: 'Convierte', text: 'Pulsa Convertir y revisa la vista aproximada.' },
      { name: 'Descarga', text: 'Descarga el .xlsx y ábrelo en Excel, Google Sheets o LibreOffice.' },
    ],
    faq: [
      ['¿Los números se pueden sumar?', 'Sí. Valores con puntos de miles, signo de pesos, decimales con coma o porcentajes se guardan como números de Excel.'],
      ['¿Funciona con un extracto escaneado?', 'Sí. Con la casilla de OCR marcada, las páginas escaneadas se reconocen en tu navegador y cada columna queda en su celda.'],
      ['¿Mi extracto se sube a internet?', 'No. La conversión ocurre dentro de tu navegador; el archivo no sale de tu equipo.'],
    ],
  },
  {
    slug: 'sacar-el-texto-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo sacar todo el texto de un PDF para copiarlo o buscarlo | DocuSmart',
    description:
      'Extrae el texto de un PDF a un archivo .txt o cópialo de la pantalla con un clic, sin el diseño de la página. Gratis, al instante y sin subir el archivo.',
    h1: 'Cómo sacar todo el texto de un PDF para copiarlo o buscarlo',
    lead: 'Quieres pegar el contenido de un PDF en un correo, en un chat o en otro documento, y al copiarlo se rompen los renglones. Así sacas el texto limpio, de todas las páginas a la vez.',
    minutes: 3,
    icon: 'type',
    tools: ['pdf-a-texto', 'ocr-pdf', 'pdf-a-word'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [PDF a texto](/pdf-a-texto), elige el PDF y pulsa **Convertir**. En un momento verás el texto de todas las páginas en la pantalla, con cuántas líneas tiene. Desde ahí lo copias con un clic o descargas el archivo .txt.',
          'El .txt se abre en cualquier equipo, incluso en el Bloc de notas o en el celular, y pesa casi nada: un documento de cien páginas suele quedar en unos cientos de KB.',
        ],
      },
      {
        h2: 'Para qué sirve',
        body: [
          { ul: [
            '**Buscar**: abrir el texto y buscar una palabra o un número en un documento largo.',
            '**Reutilizar**: pegar párrafos en un correo o un chat sin los cortes de renglón del PDF.',
            '**Contar o analizar**: pasar el texto a otra herramienta, como el [Contador de palabras](/contador-de-palabras).',
            '**Guardar lo esencial**: conservar el contenido de un documento sin su diseño.',
            '**Traducir o escuchar**: pegar el texto en un traductor, o en el lector en voz alta del celular, sin los cortes que deja copiar directo del PDF.',
          ] },
        ],
      },
      {
        h2: 'Qué se conserva y qué no',
        body: [
          'Se conserva el texto y los saltos de línea, en el orden de lectura de cada página. El diseño visual (columnas, tablas, colores, imágenes) se convierte en texto plano. Si necesitas el contenido **con su formato** para seguir editándolo, usa [PDF a Word](/pdf-a-word).',
          { tip: 'Si una tabla te importa, ten en cuenta que en el .txt pierde sus columnas. Para trabajarla en celdas, es mejor [PDF a Excel](/pdf-a-excel).' },
        ],
      },
      {
        h2: 'Si sale vacío: es un escaneo',
        body: [
          'Si DocuSmart te dice que no encontró texto, el PDF es escaneado: cada página es una foto, y no hay letras que extraer. En ese caso usa [OCR: reconocer texto](/ocr-pdf), que reconoce el texto de la imagen en tu navegador y te lo entrega para copiar o descargar.',
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'El texto se lee en tu navegador: el PDF no se envía a ningún servidor. Por eso puedes usarlo con documentos de trabajo o personales sin dejar copias en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre PDF a texto', text: 'Entra a docusmart.online/pdf-a-texto y elige el PDF.' },
      { name: 'Convierte', text: 'Pulsa Convertir: verás el texto de todas las páginas.' },
      { name: 'Copia o descarga', text: 'Cópialo con un clic o descarga el archivo .txt.' },
    ],
    faq: [
      ['¿Por qué sale vacío?', 'Porque el PDF es escaneado: las páginas son imágenes. Usa OCR: reconocer texto para sacar su texto.'],
      ['¿Se mantienen las tablas?', 'No como tablas: se convierten en renglones de texto. Para conservar las columnas, usa PDF a Excel.'],
      ['¿Hay límite de páginas?', 'No. Se extrae el texto de todas las páginas, aunque el documento sea largo.'],
    ],
  },
  {
    slug: 'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes',
    updated: UPDATED,
    title: 'Cómo convertir un PDF a JPG o sacar las fotos que trae dentro | DocuSmart',
    description:
      'Pasa cada página de un PDF a JPG o PNG con la resolución que elijas, o saca las fotos que vienen dentro en su calidad original. Gratis y sin subir el archivo.',
    h1: 'Cómo convertir un PDF a JPG o sacar las fotos que trae dentro',
    lead: 'Para publicar una página en redes, mandarla por WhatsApp como imagen o recuperar una foto que solo tienes dentro de un PDF. Son dos herramientas distintas, y conviene saber cuál usar.',
    minutes: 4,
    icon: 'images',
    tools: ['pdf-a-jpg', 'extraer-imagenes-pdf', 'comprimir-imagen'],
    sections: [
      {
        h2: '¿Página completa o solo las fotos?',
        body: [
          { ul: [
            '**[PDF a JPG](/pdf-a-jpg)** convierte cada **página completa** en una imagen, con su texto, sus fotos y su diseño, como una captura de pantalla pero en buena calidad.',
            '**[Extraer imágenes de un PDF](/extraer-imagenes-pdf)** saca **solo las fotos y gráficos** que hay dentro, cada uno por separado y con su tamaño original, sin el texto alrededor.',
          ] },
          'Si quieres mostrar una página tal como se ve, usa PDF a JPG. Si quieres el logo, la foto del producto o el plano que viene dentro del documento, usa Extraer imágenes.',
        ],
      },
      {
        h2: 'PDF a JPG, paso a paso',
        body: [
          'Abre [PDF a JPG](/pdf-a-jpg) y elige el PDF. Escoge el **formato** y la **resolución**:',
          { ul: [
            '**PNG** conserva la calidad exacta y es mejor para páginas con texto; **JPG** pesa menos y es ideal para compartir. En JPG eliges también la calidad.',
            '**72 ppp** para ver en pantalla, **150 ppp** para casi todo y **300 ppp** para imprimir.',
          ] },
          'Si solo quieres algunas páginas, escríbelas en **Páginas** (por ejemplo, 1-3, 5); vacío convierte todas. Pulsa **Convertir**: verás cada imagen con su número de página, y si son varias se descargan juntas en un ZIP.',
        ],
      },
      {
        h2: 'Extraer imágenes, paso a paso',
        body: [
          'Abre [Extraer imágenes de un PDF](/extraer-imagenes-pdf), elige el PDF y pulsa **Buscar imágenes**. Aparecen todas las fotos y gráficos con su página, su tamaño y su formato. Elige las que quieras y descárgalas una por una o todas en un ZIP.',
          'Las fotos JPEG salen **idénticas** a las originales, byte por byte; las demás se guardan como PNG, sin pérdida. Deja marcado **Omitir imágenes pequeñas** para no llenarte de íconos y viñetas.',
          { tip: 'En un PDF escaneado cada página es una sola imagen grande, así que Extraer imágenes te devuelve las páginas. Ahí da lo mismo cualquiera de las dos herramientas.' },
        ],
      },
      {
        h2: 'Si la imagen pesa mucho',
        body: [
          'A 300 ppp una página A4 pasa de 2400 píxeles de ancho. Si la necesitas más liviana para la web o un formulario, pásala por [Comprimir imagen](/comprimir-imagen). Y todo se hace en tu navegador: el PDF no se sube a ningún servidor.',
        ],
      },
    ],
    steps: [
      { name: 'Elige la herramienta', text: 'PDF a JPG para páginas completas; Extraer imágenes para las fotos que trae dentro.' },
      { name: 'Elige el PDF', text: 'Abre la herramienta en docusmart.online y elige el archivo.' },
      { name: 'Ajusta y convierte', text: 'En PDF a JPG elige formato, resolución y páginas; en Extraer imágenes pulsa Buscar imágenes y elige las que quieras.' },
      { name: 'Descarga', text: 'Descarga cada imagen o todas juntas en un ZIP.' },
    ],
    faq: [
      ['¿Qué resolución elijo?', '150 ppp sirve para casi todo. 72 ppp si solo se va a ver en pantalla y 300 ppp si se va a imprimir.'],
      ['¿Pierden calidad las fotos extraídas?', 'No. Las fotos JPEG se copian idénticas a las originales y las demás se guardan como PNG, sin pérdida.'],
      ['¿Puedo convertir solo una página?', 'Sí. En PDF a JPG escribe su número en Páginas, por ejemplo 3, y solo se convierte esa.'],
    ],
  },
  {
    slug: 'convertir-un-pdf-a-pdfa-para-un-tramite',
    updated: UPDATED,
    title: 'Cómo convertir un PDF a PDF/A para un trámite o un archivo | DocuSmart',
    description:
      'Convierte un PDF a PDF/A-2b, 1b o 3b, el formato de archivo que piden entidades públicas, juzgados y universidades. Gratis y sin subir el archivo.',
    h1: 'Cómo convertir un PDF a PDF/A para un trámite o para archivarlo',
    lead: 'Un juzgado, una universidad o una entidad pública te pide el documento "en PDF/A" y el portal rechaza tu PDF. Así lo conviertes, y así sabes qué versión elegir.',
    minutes: 4,
    icon: 'archive',
    tools: ['pdf-a-pdfa', 'ocr-pdf', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Qué es PDF/A y por qué lo piden',
        body: [
          'PDF/A es la versión de PDF pensada para archivar (norma ISO 19005). El archivo lleva dentro todo lo que necesita para verse: sus fuentes, su perfil de color y sus metadatos, y no puede depender de nada externo, como scripts, enlaces a fuentes o contenido que se carga de otro lado. Así se ve igual hoy y dentro de muchos años.',
          'Por eso lo piden los juzgados para radicar memoriales y demandas, muchas universidades para tesis y trabajos de grado, y entidades públicas para trámites y archivos.',
        ],
      },
      {
        h2: 'Qué versión elegir',
        body: [
          { ul: [
            '**PDF/A-2b**: la recomendada y la que piden casi todas las entidades. Admite transparencias y capas.',
            '**PDF/A-1b**: la más antigua, solo para sistemas que no aceptan otra. No admite transparencias ni capas.',
            '**PDF/A-3b**: como la 2b, pero conserva los archivos adjuntos, por ejemplo el XML de una factura electrónica.',
          ] },
          'Si el trámite no dice cuál, usa PDF/A-2b.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [PDF a PDF/A](/pdf-a-pdfa), elige el PDF y la **Versión**, y pulsa **Convertir a PDF/A**. Al terminar verás el resultado junto al original y un resumen de lo que se ajustó para cumplir la norma: por ejemplo, las fuentes que se incluyeron dentro del archivo o los scripts que se quitaron.',
          { tip: 'Los archivos que crea DocuSmart se validan con veraPDF, el validador de referencia de la PDF Association, el mismo que usan muchos portales para revisar lo que reciben.' },
        ],
      },
      {
        h2: 'Si una página se guardó como imagen',
        body: [
          'Algunas cosas no se pueden pasar a PDF/A tal cual: colores de imprenta (CMYK) sin su perfil, o fuentes que no vienen dentro del archivo y no se pueden incluir. En ese caso esa página se guarda como imagen: se ve igual, pero su texto deja de poder seleccionarse. DocuSmart te dice cuáles páginas y por qué. Si necesitas que ese texto se pueda buscar, pasa el resultado por [OCR: reconocer texto](/ocr-pdf).',
          'Si el portal además pone un límite de peso, revisa después el tamaño y, si hace falta, usa [Comprimir PDF](/comprimir-pdf).',
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'La conversión se hace en tu navegador: el PDF no se sube a ningún servidor. Puedes convertir demandas, contratos o documentos de identidad sin dejar copias en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre PDF a PDF/A', text: 'Entra a docusmart.online/pdf-a-pdfa y elige el PDF.' },
      { name: 'Elige la versión', text: 'PDF/A-2b si el trámite no dice cuál; 1b o 3b solo si te las piden.' },
      { name: 'Convierte', text: 'Pulsa Convertir a PDF/A y revisa el resumen de lo que se ajustó.' },
      { name: 'Descarga', text: 'Descarga el PDF/A y súbelo al portal del trámite.' },
    ],
    faq: [
      ['¿Qué versión piden los juzgados?', 'Casi siempre PDF/A-2b, o simplemente "PDF/A". Si la entidad nombra una versión, elige esa.'],
      ['¿Cambia el contenido de mi documento?', 'No el texto ni el diseño. Se incluyen las fuentes que faltaban y se quitan cosas que la norma no permite, como scripts o adjuntos (salvo en PDF/A-3b).'],
      ['¿Cómo sé que cumple la norma?', 'Al terminar, DocuSmart te dice qué versión cumple. Los resultados se validan con veraPDF, el validador de referencia.'],
    ],
  },
  {
    slug: 'reparar-un-pdf-que-no-abre',
    updated: UPDATED,
    title: 'Cómo reparar un PDF que no abre, sale en blanco o da error | DocuSmart',
    description:
      'Recupera un PDF dañado o una descarga que se cortó: DocuSmart reconstruye su estructura y rescata las páginas completas. Gratis y sin subir el archivo.',
    h1: 'Cómo reparar un PDF que no abre, sale en blanco o da error',
    lead: '"El archivo está dañado y no se pudo reparar", una pantalla en blanco o una descarga que se cortó. Antes de dar el documento por perdido, prueba a reconstruirlo.',
    minutes: 3,
    icon: 'wrench',
    tools: ['reparar-pdf', 'desbloquear-pdf', 'ocr-pdf'],
    sections: [
      {
        h2: 'Por qué se daña un PDF',
        body: [
          'Un PDF tiene, al final del archivo, un índice que dice dónde empieza cada página y cada imagen. Si ese índice se pierde o se corre, el lector no encuentra nada y muestra un error, aunque el contenido siga ahí. Pasa sobre todo con:',
          { ul: [
            'Descargas o adjuntos que se cortaron a la mitad.',
            'Archivos copiados a una memoria USB que se retiró antes de tiempo.',
            'Programas que guardaron el PDF mal o lo editaron a medias.',
          ] },
          'Las señales son siempre parecidas: el lector dice que el archivo está dañado, abre pero las páginas salen en blanco, o se ve bien en tu equipo y un portal lo rechaza al subirlo.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Reparar PDF](/reparar-pdf), elige el archivo dañado y pulsa **Reparar PDF**. La herramienta lee el archivo de principio a fin, encuentra las páginas aunque el índice esté roto y escribe una copia nueva y sana.',
          'Al terminar verás la copia reparada junto al original y te dirá qué pasó: si encontró y corrigió problemas, si el archivo estaba bien, o, si estaba cortado, cuántas páginas se rescataron de cuántas tenía.',
          { tip: 'Aunque el PDF abra, a veces conviene repararlo: si un portal lo rechaza o una herramienta da error, una copia reescrita suele resolverlo.' },
        ],
      },
      {
        h2: 'Qué se puede recuperar y qué no',
        body: [
          'Se recupera lo que llegó completo. Si una descarga se cortó al 70 %, las páginas que estaban en ese 70 % se rescatan; las del final, que nunca llegaron, no se pueden reconstruir. En ese caso lo mejor es descargar el archivo de nuevo o pedirlo otra vez, y usar la copia reparada mientras tanto.',
          'Si el PDF tiene contraseña para abrirse, quítasela primero con [Desbloquear PDF](/desbloquear-pdf) y luego repáralo. Y si lo que rescataste son páginas escaneadas y necesitas su texto, usa [OCR: reconocer texto](/ocr-pdf).',
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'La reparación se hace en tu navegador: el archivo no se sube a ningún servidor. Puedes intentarlo con documentos personales o de trabajo sin dejar copias en otro lado, y el original no se modifica.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Reparar PDF', text: 'Entra a docusmart.online/reparar-pdf y elige el PDF dañado.' },
      { name: 'Repara', text: 'Pulsa Reparar PDF: se reconstruye su estructura.' },
      { name: 'Revisa el resultado', text: 'Mira qué se corrigió y cuántas páginas se rescataron.' },
      { name: 'Descarga', text: 'Descarga la copia reparada; el original no cambia.' },
    ],
    faq: [
      ['¿Puede recuperar un archivo cortado?', 'Sí, las páginas que alcanzaron a llegar completas. Las que faltan al final del archivo no se pueden reconstruir.'],
      ['¿Se modifica mi archivo original?', 'No. Se descarga una copia reparada aparte.'],
      ['¿Funciona con PDF con contraseña?', 'Primero quítale la contraseña con Desbloquear PDF y luego repáralo.'],
    ],
  },
]
