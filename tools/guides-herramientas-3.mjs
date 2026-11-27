// Guías ilustradas por herramienta (W-101), lote 3: documentos que se llenan (cuenta de cobro y
// hoja de vida), código QR, imágenes (tamaño, formato y datos ocultos), ZIP y recortar PDF. Mismo
// formato que tools/guides.mjs. Se publican primero en español; cada idioma las suma al traducirlas.

const UPDATED = '2026-11-27'

export const TOOL_GUIDES_3 = [
  {
    slug: 'hacer-una-cuenta-de-cobro',
    updated: UPDATED,
    title: 'Cómo hacer una cuenta de cobro en PDF, gratis y en minutos | DocuSmart',
    description:
      'Llena tus datos, los del cliente y lo que cobras: el total, la retención y el valor en letras salen solos. Descárgala en PDF, gratis y sin subir tus datos.',
    h1: 'Cómo hacer una cuenta de cobro en PDF',
    lead: 'Una cuenta de cobro dice quién le debe a quién, cuánto y por qué. Con la plantilla de DocuSmart la llenas en el navegador y sale un PDF ordenado, listo para enviar.',
    minutes: 5,
    icon: 'file',
    tools: ['cuenta-de-cobro', 'firmar-pdf', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Qué es una cuenta de cobro y quién la usa',
        body: [
          'Es el documento con el que una persona cobra un trabajo o un servicio cuando no expide factura: un diseñador independiente, un profesor particular, un contratista que presta servicios a una empresa o quien arrienda un inmueble. Debe decir quién cobra, a quién, la fecha, el concepto, el valor (en números y en letras) y cómo se paga.',
          { tip: 'Una cuenta de cobro no reemplaza la factura electrónica. Si por tu actividad o tus ingresos estás obligado a facturar, consulta con un contador o con la autoridad de impuestos de tu país.' },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Cuenta de cobro](/cuenta-de-cobro) y deja elegido el tipo **Cuenta de cobro**. Busca tu **país**: así se ajustan la moneda, el nombre del impuesto y los tipos de documento (cédula, NIT, RFC, RUC…). El número del documento se propone solo (CC-0001) y la fecha es la de hoy; agrega la ciudad y, si quieres, una **fecha límite de pago**.',
          'En **Tus datos** escribe tu nombre y tu documento; en **Cliente**, los de quien te paga. La dirección, el teléfono y el correo son opcionales.',
          'En **Conceptos** describe lo que cobras, la cantidad y el valor unitario. Si son varias cosas, usa **Agregar concepto**. El subtotal, el impuesto, la retención y el total se calculan mientras escribes, y debajo aparece el valor en letras.',
        ],
      },
      {
        h2: 'Impuesto, retención y descuento',
        body: [
          'Si cobras un impuesto (como el IVA), escribe su porcentaje; al elegir tu país aparece un botón para usar la tarifa general. Si el cliente te hace **retención**, escribe el porcentaje y se resta del total, como en la imagen: 1.800.000 de subtotal, 10 % de retención y 1.620.000 a pagar. El **descuento** se resta antes de los impuestos.',
          { tip: 'El porcentaje de retención depende de tu país, del tipo de servicio y de tu situación con los impuestos. Si no lo sabes, pregúntale al cliente: casi siempre te dice cuánto te va a retener.' },
        ],
      },
      {
        h2: 'Datos para el pago, firma y PDF',
        body: [
          'En **Datos para el pago** pon el banco, el tipo y el número de cuenta y a nombre de quién está: así el cliente sabe dónde consignar. En **Notas** puedes escribir plazos o condiciones. Con **Agregar firma** la dibujas con el dedo o el mouse, y con **Agregar logo** pones el tuyo arriba.',
          'Pulsa **Crear PDF**: verás la cuenta de cobro terminada, con el valor en letras y la línea de firma, lista para descargar, compartir por WhatsApp o guardar en Drive.',
          { ul: [
            'El número sigue solo en cada documento nuevo (CC-0002, CC-0003…). Y si marcas **Recordar en este navegador**, la próxima vez tus datos, el logo y tus clientes ya están puestos; la cuenta del banco nunca se guarda.',
            'En **Documentos emitidos** puedes abrir una cuenta anterior para corregirla, o pasar una **cotización** aprobada a cuenta de cobro sin escribir todo de nuevo.',
            'Con la misma herramienta puedes hacer una **cotización** (con fecha de vigencia) o un **recibo** de pago.',
          ] },
        ],
      },
      {
        h2: 'Tus datos y los de tu cliente no se suben',
        body: [
          'Todo se arma en tu navegador: los nombres, los documentos y los valores no se envían a ningún servidor. Si el cliente te pide la cuenta firmada en un PDF que ya tienes, usa [Firmar PDF](/firmar-pdf); y si vas a mandar varias juntas por correo, [Comprimir PDF](/comprimir-pdf) las deja más livianas.',
        ],
      },
    ],
    steps: [
      { name: 'Abre la plantilla', text: 'Entra a docusmart.online/cuenta-de-cobro y elige tu país.' },
      { name: 'Escribe los datos', text: 'Llena tus datos, los del cliente, la ciudad y la fecha.' },
      { name: 'Agrega lo que cobras', text: 'Describe cada concepto con su valor; el total, la retención y el valor en letras salen solos.' },
      { name: 'Crea el PDF', text: 'Agrega los datos para el pago y tu firma, pulsa Crear PDF y descárgalo.' },
    ],
    faq: [
      ['¿Una cuenta de cobro es lo mismo que una factura?', 'No. La cuenta de cobro la usa quien no está obligado a facturar; no reemplaza la factura electrónica. DocuSmart no emite facturas electrónicas.'],
      ['¿Cómo se calcula la retención?', 'Escribe el porcentaje que te indique tu cliente y DocuSmart lo resta del subtotal. El total a pagar ya sale con la retención descontada.'],
      ['¿Puedo hacer una cuenta de cobro en otra moneda?', 'Sí. Al elegir tu país se pone su moneda, y puedes cambiarla por otra (dólares, euros…) en el campo Moneda.'],
    ],
  },
  {
    slug: 'hacer-una-hoja-de-vida',
    updated: UPDATED,
    title: 'Cómo hacer una hoja de vida en PDF o Word, gratis y sin registrarte | DocuSmart',
    description:
      'Arma tu hoja de vida con una plantilla clara y apta para los portales de empleo (ATS), con o sin foto. Descárgala en PDF o Word, gratis y sin crear una cuenta.',
    h1: 'Cómo hacer una hoja de vida en PDF o Word',
    lead: 'Una buena hoja de vida se entiende en segundos y pasa los filtros automáticos de los portales de empleo. Aquí la llenas por secciones y sale ordenada, sin pelear con el formato.',
    minutes: 5,
    icon: 'user',
    tools: ['hoja-de-vida', 'foto-tamano-documento', 'unir-pdf'],
    sections: [
      {
        h2: 'Elige la plantilla',
        body: [
          'Abre [Hoja de vida](/hoja-de-vida). Arriba eliges cómo se verá:',
          { ul: [
            '**Clásica (ATS)**: una columna y sin foto. Es la que mejor leen los sistemas que filtran hojas de vida en los portales de empleo; úsala para postularte en línea.',
            '**Compacta**: igual de clara, con letra y márgenes más chicos para que quepa más en una página.',
            '**Con foto**: tu foto arriba, como la piden muchas empresas de Latinoamérica.',
          ] },
          'También eliges el tamaño de la hoja (Carta o A4), la letra (moderna o clásica) y el color de los títulos.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Llena tus **datos personales**: nombre, cargo o profesión, ciudad, teléfono y correo. Si tienes LinkedIn o un portafolio, ponlo en **Enlaces**. Luego escribe tu **perfil profesional** en dos o tres frases: quién eres, qué sabes hacer y qué buscas.',
          'En **Experiencia laboral** agrega cada trabajo con el cargo, la empresa y las fechas; marca **Trabajo aquí actualmente** si sigues allí. En **Logros y funciones** escribe un logro por línea: cada línea sale como un punto. Haz lo mismo con **Educación**, **Habilidades**, **Idiomas**, **Cursos** y **Referencias**; las secciones vacías no aparecen.',
          'Pulsa **Crear PDF** o **Crear Word (.docx)**. Verás la hoja de vida terminada, lista para descargar o compartir.',
          { tip: 'Empieza cada logro con un verbo y usa cifras cuando puedas: «Reduje en 30 % los tiempos de entrega» dice más que «encargada de entregas».' },
        ],
      },
      {
        h2: 'Compárala con la oferta y escribe la carta',
        body: [
          'En **Comparar con una oferta de trabajo** pegas el aviso de la vacante y ves qué palabras clave ya tiene tu hoja de vida y cuáles le faltan, con el porcentaje de coincidencia. Los filtros automáticos buscan esas palabras; agrega solo las que de verdad tengas.',
          'En **Carta de presentación** escribes la empresa y el cargo, y DocuSmart arma un borrador con tu experiencia y tus fortalezas. Revísalo, ajústalo a tu manera y descárgalo en PDF o Word.',
        ],
      },
      {
        h2: 'No pierdas lo que escribiste',
        body: [
          'Con **Guardar automáticamente** lo escrito se queda en este navegador aunque cierres la página (la foto no). Para seguir en otro equipo, usa **Guardar borrador**: descargas un archivo .json que luego abres allá con **Abrir borrador**.',
          'Si la empresa te pide la foto con fondo blanco, prepárala antes en [Foto tamaño documento](/foto-tamano-documento). Y si tienes que enviar la hoja de vida junto con certificados en un solo archivo, júntalos con [Unir PDF](/unir-pdf).',
        ],
      },
      {
        h2: 'Tu información no sale del equipo',
        body: [
          'La hoja de vida se arma en tu navegador: tus datos, tu experiencia y tu foto no se suben a ningún servidor ni se usan para nada más. No necesitas crear una cuenta ni dejar tu correo.',
        ],
      },
    ],
    steps: [
      { name: 'Elige la plantilla', text: 'Entra a docusmart.online/hoja-de-vida y elige Clásica (ATS), Compacta o Con foto.' },
      { name: 'Llena las secciones', text: 'Escribe tus datos, tu perfil, tu experiencia, tu educación y tus habilidades.' },
      { name: 'Compárala con la oferta', text: 'Pega el aviso de la vacante para ver qué palabras clave te faltan.' },
      { name: 'Descárgala', text: 'Pulsa Crear PDF o Crear Word y descarga tu hoja de vida.' },
    ],
    faq: [
      ['¿Qué es una hoja de vida ATS?', 'Una hoja de vida en una sola columna, sin tablas ni imágenes, que los sistemas de selección de los portales de empleo pueden leer sin errores. Es la plantilla Clásica.'],
      ['¿Puedo descargarla en Word?', 'Sí. Con Crear Word (.docx) la abres y la editas en Word, Google Docs o LibreOffice.'],
      ['¿Necesito registrarme?', 'No. Es gratis, no pide cuenta ni correo y lo que escribes se queda en tu equipo.'],
    ],
  },
  {
    slug: 'crear-un-codigo-qr',
    updated: UPDATED,
    title: 'Cómo crear un código QR gratis para un enlace, WhatsApp o Wi-Fi | DocuSmart',
    description:
      'Crea un código QR para un enlace, WhatsApp, tu Wi-Fi o tu contacto, con tu color y tu logo. Descárgalo en PNG, SVG o PDF. Gratis, sin registro y sin caducidad.',
    h1: 'Cómo crear un código QR gratis',
    lead: 'Un QR lleva a la gente a tu página, abre un chat de WhatsApp o conecta al Wi-Fi sin escribir nada. Créalo en segundos; no caduca ni depende de ningún servidor.',
    minutes: 4,
    icon: 'qr',
    tools: ['crear-codigo-qr', 'leer-codigo-qr'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Crear código QR](/crear-codigo-qr) y elige qué va a guardar: **URL**, **Texto**, **Email**, **Teléfono**, **WhatsApp**, **SMS**, **Ubicación**, **Wi-Fi**, **Contacto** o **Evento**. Escribe los datos (para un enlace, la dirección completa con https://).',
          'Pulsa **Generar QR**. El código aparece enseguida y puedes descargarlo en PNG, en **SVG** (vectorial, se imprime nítido en cualquier tamaño), en **PDF de 10 cm**, copiarlo como imagen o imprimirlo.',
          { tip: 'Antes de imprimir cien volantes, escanea el QR con tu celular para comprobar que abre lo que esperas.' },
        ],
      },
      {
        h2: 'Qué puede hacer cada tipo',
        body: [
          { ul: [
            '**WhatsApp**: escribe el número con el indicativo del país (57 para Colombia) y, si quieres, un mensaje. Al escanearlo se abre el chat con el mensaje ya escrito.',
            '**Wi-Fi**: el nombre de la red, la seguridad y la contraseña. Tus visitas se conectan sin que tengas que dictarla.',
            '**Contacto**: nombre, teléfono, correo y empresa. Al escanearlo, el celular ofrece guardarlo en la agenda.',
            '**Ubicación**: una dirección o coordenadas que se abren en el mapa.',
            '**Evento**: título, lugar e inicio y fin, para agregarlo al calendario.',
          ] },
        ],
      },
      {
        h2: 'Dale tu estilo',
        body: [
          'En **Personalizar diseño** cambias el color del código y del fondo (o lo dejas transparente para ponerlo sobre tu diseño), pones tu **logo** en el centro y eliges el tamaño de la imagen. Si los colores tienen poco contraste, DocuSmart te avisa, porque una cámara podría no leerlo.',
          'Con **Protegido**, el contenido del QR queda cifrado con una contraseña (AES-256): solo lo abre quien la tenga, en DocuSmart. Y con **Varios QR desde una lista** generas muchos a la vez, uno por línea o desde un CSV, por ejemplo para las mesas de un restaurante o las etiquetas de un inventario.',
        ],
      },
      {
        h2: 'Para leer un QR',
        body: [
          'Si lo que necesitas es leer uno, usa [Leer código QR](/leer-codigo-qr): con la cámara, desde una foto o una captura de pantalla, o desde un PDF. Antes de abrir un enlace te muestra a dónde lleva y te advierte si parece engañoso.',
        ],
      },
      {
        h2: 'Tu QR no caduca',
        body: [
          'El código se genera en tu navegador y guarda los datos directamente, sin pasar por un enlace intermedio. Por eso no caduca, no tiene límite de escaneos y nadie más ve lo que pusiste en él. Los QR que crees quedan en el **Historial**, solo en tu navegador.',
        ],
      },
    ],
    steps: [
      { name: 'Elige el tipo', text: 'Entra a docusmart.online/crear-codigo-qr y elige URL, WhatsApp, Wi-Fi u otro tipo.' },
      { name: 'Escribe los datos', text: 'Pon el enlace, el número o los datos de la red.' },
      { name: 'Genera el QR', text: 'Pulsa Generar QR y, si quieres, cambia el color o agrega tu logo.' },
      { name: 'Descárgalo', text: 'Descárgalo en PNG, SVG o PDF, o imprímelo.' },
    ],
    faq: [
      ['¿El código QR caduca?', 'No. Los datos van dentro del propio código, sin un enlace intermedio, así que funciona para siempre y sin límite de escaneos.'],
      ['¿Qué formato uso para imprimir?', 'El SVG: es vectorial y se ve nítido en cualquier tamaño, desde una tarjeta hasta un afiche. También hay un PDF de 10 cm.'],
      ['¿Puedo poner mi logo en el QR?', 'Sí, en Personalizar diseño. El logo queda en un círculo en el centro y el código se sigue leyendo.'],
    ],
  },
  {
    slug: 'cambiar-el-tamano-de-una-foto',
    updated: UPDATED,
    title: 'Cómo cambiar el tamaño de una foto en pixeles, % o centímetros | DocuSmart',
    description:
      'Cambia el tamaño de una o varias fotos en pixeles, en porcentaje, en centímetros o a la medida exacta de Instagram, WhatsApp o YouTube. Gratis y sin subirlas.',
    h1: 'Cómo cambiar el tamaño de una foto',
    lead: 'Una foto del celular mide miles de pixeles: demasiado para un formulario, una página web o una portada. Aquí la llevas a la medida que necesitas, sin deformarla.',
    minutes: 4,
    icon: 'resize',
    tools: ['redimensionar-imagen', 'recortar-imagen', 'comprimir-imagen'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Redimensionar imagen](/redimensionar-imagen) y elige una o varias fotos (JPG, PNG, WebP, HEIC, GIF o BMP). Luego escoge **cómo redimensionar**:',
          { ul: [
            '**Por porcentaje**: por ejemplo, 50 % deja la foto a la mitad de ancho y de alto.',
            '**Por pixeles**: escribe el ancho, el alto o los dos. Con **Conservar la proporción** activo, basta un lado: el otro se calcula solo.',
            '**Redes sociales**: medidas exactas para Instagram, historias de WhatsApp, portadas de Facebook o LinkedIn y miniaturas de YouTube.',
            '**En centímetros**: para imprimir, con la resolución que elijas.',
          ] },
          'Pulsa **Redimensionar** y verás la foto antes y después, con su peso. Si elegiste varias, se guardan juntas en un ZIP.',
        ],
      },
      {
        h2: 'Que no se deforme',
        body: [
          'Una foto se ve estirada cuando cambias el ancho y el alto en distinta proporción. Por eso **Conservar la proporción** viene activo: si escribes los dos lados, la foto cabe dentro de ese tamaño sin estirarse. En **Redes sociales**, la imagen llena la medida exacta y lo que sobra se recorta parejo desde el centro.',
          { tip: 'Achicar una foto nunca le quita nitidez a la vista, pero agrandarla no le agrega detalle: una foto pequeña ampliada al doble se ve borrosa.' },
        ],
      },
      {
        h2: 'Si lo que quieres es recortar o que pese menos',
        body: [
          'Cambiar el tamaño no es lo mismo que recortar. Para quitar un borde, encuadrar a una persona o dejar la foto cuadrada, usa [Recortar imagen](/recortar-imagen): recorte libre o en proporciones fijas como 1:1, 4:3 o 16:9.',
          'Y si un formulario te pide que la foto pese menos de cierto tamaño (por ejemplo, 200 KB), [Comprimir imagen](/comprimir-imagen) baja la calidad justo lo necesario para que entre, y solo reduce los pixeles si no alcanza.',
        ],
      },
      {
        h2: 'Medidas que se piden a menudo',
        body: [
          { ul: [
            '**Para una página web o un blog**: entre 1200 y 1920 pixeles de ancho es más que suficiente; más grande solo hace que la página cargue lento.',
            '**Para un formulario o un trámite**: suelen pedir un ancho máximo (por ejemplo, 800 pixeles) y un peso máximo. Primero ajusta el tamaño aquí y, si todavía pesa mucho, comprímela.',
            '**Para imprimir**: usa En centímetros; a 300 ppp, una foto de 10 × 15 cm necesita unos 1181 × 1772 pixeles para verse nítida.',
          ] },
        ],
      },
      {
        h2: 'Tus fotos no se suben',
        body: [
          'Todo pasa en tu navegador, también con decenas de fotos a la vez. Además, al guardar se quitan los datos ocultos de la foto (EXIF), como la ubicación GPS donde se tomó.',
        ],
      },
    ],
    steps: [
      { name: 'Elige las fotos', text: 'Entra a docusmart.online/redimensionar-imagen y elige una o varias fotos.' },
      { name: 'Escoge la medida', text: 'Por porcentaje, por pixeles, una medida de redes sociales o en centímetros.' },
      { name: 'Redimensiona', text: 'Pulsa Redimensionar y compara el antes y el después.' },
      { name: 'Descarga', text: 'Descarga la foto, o el ZIP si eran varias.' },
    ],
    faq: [
      ['¿Pierde calidad la foto al achicarla?', 'A la vista no: se ve igual de nítida, solo que más pequeña. Lo que no se puede es agrandarla sin que se note.'],
      ['¿Puedo cambiar el tamaño de varias fotos a la vez?', 'Sí. Elige todas juntas: se redimensionan con la misma medida y se descargan en un ZIP.'],
      ['¿Qué medida uso para Instagram?', 'En Redes sociales tienes Instagram cuadrada y vertical, e historias. La foto llena la medida y lo que sobra se recorta desde el centro.'],
    ],
  },
  {
    slug: 'comprimir-archivos-en-zip',
    updated: UPDATED,
    title: 'Cómo comprimir archivos en ZIP y abrir un ZIP o RAR sin programas | DocuSmart',
    description:
      'Junta varios archivos o una carpeta en un ZIP, con contraseña si quieres, y abre ZIP, RAR o 7Z desde el navegador. Gratis, sin instalar nada y sin subirlos.',
    h1: 'Cómo comprimir archivos en ZIP y abrir un ZIP o RAR',
    lead: 'Un ZIP junta muchos archivos en uno solo: más fácil de mandar por correo y, a veces, más liviano. Aquí lo creas y lo abres desde el navegador, sin instalar programas.',
    minutes: 4,
    icon: 'archive',
    tools: ['comprimir-archivos', 'descomprimir-archivos', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Crear un ZIP, paso a paso',
        body: [
          'Abre [Comprimir archivos](/comprimir-archivos) y agrega los archivos (de cualquier tipo) o una carpeta completa con **Agregar una carpeta**. Escribe el nombre del ZIP y elige la compresión: **Rápida**, **Normal** o **Máxima**.',
          'Pulsa **Crear ZIP**. Verás tus archivos a un lado y el ZIP al otro, con cuánto pesaba todo antes y cuánto pesa ahora.',
          { tip: 'Las fotos, los videos y los PDF ya vienen comprimidos, así que en un ZIP casi no bajan de peso. Lo que sí se reduce mucho son los documentos de Word, las hojas de cálculo y los textos.' },
        ],
      },
      {
        h2: 'Con contraseña o en partes',
        body: [
          { ul: [
            '**Proteger con contraseña (AES-256)**: nadie abre el ZIP sin la clave. En ZIP la contraseña no puede llevar tildes ni ñ; si las necesitas, elige el formato 7Z.',
            '**Dividir en partes**: si el correo no acepta un archivo tan grande, lo partes en varios (.001, .002…). Para abrirlo hacen falta todas las partes, con DocuSmart, 7-Zip o WinRAR.',
            '**7Z**: comprime más que ZIP, pero en algunos equipos hay que instalar un programa para abrirlo. ZIP se abre en cualquier computador y celular sin instalar nada.',
          ] },
        ],
      },
      {
        h2: 'Abrir un ZIP, RAR o 7Z',
        body: [
          'Para sacar lo que trae un comprimido, usa [Descomprimir archivos](/descomprimir-archivos). Abre ZIP, RAR, 7Z, TAR, GZ, BZ2 y XZ, también los que tienen contraseña o vienen divididos en partes.',
          'Verás la lista de lo que hay dentro, con sus carpetas. Puedes abrir la vista previa de un archivo antes de descargarlo, extraer solo los que elijas o bajarlos todos juntos.',
        ],
      },
      {
        h2: 'Si lo que quieres es que un PDF pese menos',
        body: [
          'Meter un PDF en un ZIP casi no lo achica. Para que un PDF pese menos de verdad, pásalo por [Comprimir PDF](/comprimir-pdf), que reduce las imágenes que lleva por dentro.',
        ],
      },
      {
        h2: 'Tus archivos no salen del equipo',
        body: [
          'Comprimir y descomprimir pasa en la memoria de tu navegador: nada se sube a internet. Con archivos muy grandes (varios GB) puede tardar o quedarse sin memoria; en ese caso, divídelos en varios ZIP.',
        ],
      },
    ],
    steps: [
      { name: 'Agrega los archivos', text: 'Entra a docusmart.online/comprimir-archivos y agrega archivos o una carpeta.' },
      { name: 'Elige las opciones', text: 'Escribe el nombre, la compresión y, si quieres, una contraseña.' },
      { name: 'Crea el ZIP', text: 'Pulsa Crear ZIP y mira cuánto bajó el peso.' },
      { name: 'Descarga', text: 'Descarga el ZIP o compártelo.' },
    ],
    faq: [
      ['¿Puedo abrir un RAR sin WinRAR?', 'Sí. Descomprimir archivos abre RAR, ZIP, 7Z y otros formatos en el navegador, sin instalar nada. Para crear uno nuevo usa ZIP o 7Z.'],
      ['¿Por qué mi ZIP pesa casi lo mismo?', 'Porque fotos, videos y PDF ya vienen comprimidos. El ZIP sirve para juntarlos en un solo archivo, no tanto para achicarlos.'],
      ['¿Es seguro ponerle contraseña?', 'Sí. Se cifra con AES-256 y la contraseña no se guarda en ningún lado: si la olvidas, no hay forma de recuperarla.'],
    ],
  },
  {
    slug: 'recortar-los-margenes-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo recortar los márgenes o una parte de un PDF | DocuSmart',
    description:
      'Quita los márgenes en blanco de un PDF con un toque o recorta a mano la parte que quieres conservar, en todas las páginas o en una sola. Gratis y sin subirlo.',
    h1: 'Cómo recortar los márgenes o una parte de un PDF',
    lead: 'Un PDF con márgenes enormes se lee pequeño en el celular y se imprime con mucho papel en blanco. Recortarlo deja solo lo que importa, sin tocar el contenido.',
    minutes: 3,
    icon: 'crop',
    tools: ['recortar-pdf', 'dividir-pdf', 'rotar-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Recortar PDF](/recortar-pdf) y elige el archivo. Verás la primera página con un recuadro encima: lo oscurecido es lo que se va a recortar.',
          'Pulsa **Quitar márgenes en blanco** y el recuadro se ajusta solo al contenido de la página, como en la imagen. Si prefieres hacerlo a mano, arrastra los bordes o las esquinas del recuadro. Debajo ves el tamaño que va a quedar, en milímetros.',
          'Elige si el recorte se aplica a **todas las páginas** o **solo a esta**, pulsa **Recortar PDF** y descarga el resultado.',
          { tip: 'Si las páginas tienen márgenes distintos, revisa varias con las flechas antes de recortar: el recuadro de «todas las páginas» es el mismo para cada una.' },
        ],
      },
      {
        h2: 'Para qué sirve',
        body: [
          { ul: [
            '**Leer en el celular**: sin márgenes, el texto ocupa toda la pantalla y se lee más grande.',
            '**Sacar una parte**: una tabla, un gráfico o la foto de un documento escaneado, para usarla aparte.',
            '**Quitar lo que sobra de un escaneo**: el borde negro de la tapa del escáner o la mesa alrededor de la hoja.',
          ] },
        ],
      },
      {
        h2: 'Qué pasa con el contenido',
        body: [
          'El recorte cambia el área visible de cada página, sin rehacer el texto ni las imágenes: lo que queda se ve igual de nítido y el texto se sigue pudiendo copiar y buscar.',
          'Si después necesitas solo algunas páginas, sepáralas con [Dividir PDF](/dividir-pdf); y si alguna quedó de lado, enderézala con [Rotar PDF](/rotar-pdf).',
        ],
      },
      {
        h2: 'Antes de imprimir',
        body: [
          'Al imprimir un PDF recortado, la página queda más pequeña que la hoja. Para que ocupe todo el papel, elige **Ajustar al tamaño de la página** en la ventana de impresión de tu navegador o de tu visor de PDF.',
          'Si recortaste un escaneo para quedarte con la foto de un documento (una cédula, un carné), revisa que no hayas cortado ningún borde del documento: muchos trámites piden que se vean las cuatro esquinas.',
        ],
      },
      {
        h2: 'Tu PDF no sale del equipo',
        body: [
          'Todo el recorte pasa en tu navegador. El PDF no se sube a ningún servidor, así que puedes usarlo con contratos o documentos personales con tranquilidad.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Recortar PDF', text: 'Entra a docusmart.online/recortar-pdf y elige el PDF.' },
      { name: 'Ajusta el recuadro', text: 'Pulsa Quitar márgenes en blanco o arrastra los bordes a mano.' },
      { name: 'Elige las páginas', text: 'Aplica el recorte a todas las páginas o solo a la que estás viendo.' },
      { name: 'Descarga', text: 'Pulsa Recortar PDF y descarga el resultado.' },
    ],
    faq: [
      ['¿Se pierde calidad al recortar un PDF?', 'No. Solo cambia el área visible de la página; el texto y las imágenes quedan iguales.'],
      ['¿Puedo recortar solo una página?', 'Sí. Antes de recortar elige Solo la página que estás viendo.'],
      ['¿Lo recortado se borra del archivo?', 'Queda fuera de la vista y de la impresión. Si lo que quieres es borrar un dato privado, usa Censurar PDF, que lo elimina de verdad.'],
    ],
  },
  {
    slug: 'cambiar-el-formato-de-una-imagen',
    updated: UPDATED,
    title: 'Cómo cambiar el formato de una imagen: HEIC, JPG, PNG o WebP | DocuSmart',
    description:
      'Pasa fotos HEIC del iPhone a JPG, un JPG a PNG o cualquier imagen a WebP, una o muchas a la vez. Gratis, en el navegador y sin subir tus fotos.',
    h1: 'Cómo cambiar el formato de una imagen: HEIC, JPG, PNG o WebP',
    lead: 'Cada formato sirve para algo distinto, y a veces una página o un programa solo acepta uno. Aquí cambias el formato de tus fotos en segundos, sin instalar nada.',
    minutes: 4,
    icon: 'convert',
    tools: ['heic-a-jpg', 'jpg-a-png', 'imagen-a-webp', 'comprimir-imagen'],
    sections: [
      {
        h2: 'Qué formato te conviene',
        body: [
          { ul: [
            '**JPG**: el de las fotos. Pesa poco y lo abre cualquier equipo, página o formulario. No admite fondo transparente.',
            '**PNG**: sin pérdida de calidad y con fondo transparente. Ideal para logos, capturas de pantalla y dibujos; con fotos pesa mucho más.',
            '**WebP**: el formato moderno de la web. Se ve igual que un JPG con bastante menos peso, como en la imagen: de 189 KB a 50 KB.',
            '**HEIC**: el que usan los iPhone. Ocupa poco, pero muchos computadores, páginas y programas no lo abren.',
          ] },
        ],
      },
      {
        h2: 'Fotos del iPhone (HEIC) a JPG',
        body: [
          'Abre [HEIC a JPG](/heic-a-jpg) y elige tus fotos HEIC, una o muchas. Ajusta la **calidad del JPG** si quieres (la que viene marcada se ve igual que la original) y pulsa convertir. Si eran varias, se descargan juntas en un ZIP.',
          { tip: 'La primera vez se descarga el decodificador de HEIC (1,4 MB) y queda guardado: las siguientes conversiones empiezan enseguida.' },
          'Si prefieres que el iPhone tome las fotos directamente en JPG, en **Ajustes → Cámara → Formatos** elige **Más compatible**.',
        ],
      },
      {
        h2: 'JPG a PNG, o cualquier imagen a WebP',
        body: [
          'Con [JPG a PNG](/jpg-a-png) conviertes una foto a PNG cuando un programa lo pide o cuando la vas a editar varias veces sin que pierda calidad. Con [Imagen a WebP](/imagen-a-webp) bajas el peso de las fotos de una página web o de una tienda en línea sin que se note.',
          'Las dos funcionan igual: eliges una o varias imágenes, pulsas el botón y ves el antes y el después con el peso de cada versión, listo para descargar.',
        ],
      },
      {
        h2: 'Si además necesitas que pese menos o cambiar su tamaño',
        body: [
          'Cambiar el formato no cambia las medidas de la foto. Si un formulario te pide que no pase de cierto peso, usa [Comprimir imagen](/comprimir-imagen), que también acepta fotos HEIC y las entrega en JPG; y si te piden un ancho o un alto exactos, [Redimensionar imagen](/redimensionar-imagen).',
        ],
      },
      {
        h2: 'Sin subir tus fotos',
        body: [
          'La conversión pasa en tu navegador: tus fotos no se suben a ningún servidor. Al guardarlas se quitan además los datos ocultos (EXIF), como la ubicación donde se tomaron.',
        ],
      },
    ],
    steps: [
      { name: 'Elige la conversión', text: 'Entra a HEIC a JPG, JPG a PNG o Imagen a WebP en docusmart.online.' },
      { name: 'Elige las fotos', text: 'Agrega una o varias imágenes.' },
      { name: 'Convierte', text: 'Pulsa el botón y compara el antes y el después.' },
      { name: 'Descarga', text: 'Descarga la imagen, o el ZIP si eran varias.' },
    ],
    faq: [
      ['¿Por qué no puedo abrir las fotos de mi iPhone en el computador?', 'Porque están en HEIC, un formato que muchos equipos y páginas no reconocen. Pásalas a JPG y se abren en cualquier lado.'],
      ['¿Pierde calidad una foto al pasarla a PNG?', 'No: PNG no pierde calidad. Pero tampoco la recupera; la foto queda igual que el JPG original y pesa más.'],
      ['¿WebP se ve en todos los navegadores?', 'Sí, en todos los navegadores actuales. Algunos programas de escritorio antiguos todavía no lo abren.'],
    ],
  },
  {
    slug: 'borrar-la-ubicacion-y-los-datos-ocultos-de-una-foto',
    updated: UPDATED,
    title: 'Cómo borrar la ubicación y los datos ocultos de una foto o un PDF | DocuSmart',
    description:
      'Mira qué datos ocultos guarda una foto o un documento (ubicación GPS, cámara, fecha, autor) y bórralos antes de compartirlo. Gratis y sin subir el archivo.',
    h1: 'Cómo borrar la ubicación y los datos ocultos de una foto',
    lead: 'Una foto del celular puede guardar el lugar exacto donde se tomó, y un documento, el nombre de quien lo escribió. Antes de publicarlos o enviarlos, mira qué llevan y bórralo.',
    minutes: 4,
    icon: 'eraser',
    tools: ['quitar-metadatos', 'censurar-pdf'],
    sections: [
      {
        h2: 'Qué son los datos ocultos (metadatos)',
        body: [
          'Son datos que van dentro del archivo pero no se ven en la imagen ni en las páginas. Una foto puede guardar la **ubicación GPS**, la marca y el modelo del celular, el número de serie de la cámara y la fecha y la hora exactas. Un PDF o un documento de Word puede guardar el **autor**, la empresa, el programa con que se hizo y las fechas de creación y modificación.',
          'Quien reciba el archivo puede verlos con cualquier visor. Con una foto de tu casa, por ejemplo, la ubicación lleva a tu dirección.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Quitar metadatos](/quitar-metadatos) y elige tus fotos o documentos: JPG, PNG, WebP, HEIC, TIFF, videos MP4 y MOV, PDF, Word, Excel o PowerPoint. Al instante verás la lista de **datos ocultos encontrados** en cada uno, como en la imagen; si una foto guarda la ubicación, aparece en rojo con un aviso.',
          'Pulsa **Quitar metadatos**. Verás cuántos datos tenía cada archivo antes y cuántos quedan después, y descargas la copia limpia (o un ZIP, si eran varios).',
          { tip: 'Solo se conserva la orientación de las fotos, para que no aparezcan giradas. La imagen no se vuelve a comprimir: no pierde calidad.' },
        ],
      },
      {
        h2: 'En PDF y documentos de Office',
        body: [
          'En los PDF, la opción **Quitar también comentarios, adjuntos y JavaScript** borra además las notas con el nombre de su autor, los archivos adjuntos y el código que se ejecuta al abrirlos. Apágala si necesitas conservar los comentarios.',
          'En Word, Excel y PowerPoint se quitan el autor, la empresa y las fechas. Los nombres que aparecen en los comentarios y en el control de cambios se borran desde el propio programa.',
        ],
      },
      {
        h2: 'Si el dato privado está a la vista',
        body: [
          'Quitar metadatos no cambia lo que se ve. Si lo que quieres ocultar es un número de cédula, una firma o una dirección que aparece en las páginas de un PDF, usa [Censurar PDF](/censurar-pdf), que lo cubre y lo elimina del archivo.',
        ],
      },
      {
        h2: 'Se hace en tu equipo',
        body: [
          'Todo pasa en tu navegador: tus fotos y documentos no se suben a ningún servidor. Así no dejas copias de un archivo privado justo cuando intentas protegerlo.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Quitar metadatos', text: 'Entra a docusmart.online/quitar-metadatos y elige fotos o documentos.' },
      { name: 'Revisa qué guardan', text: 'Mira la lista de datos ocultos de cada archivo, como la ubicación GPS.' },
      { name: 'Bórralos', text: 'Pulsa Quitar metadatos y comprueba que no quedó ninguno.' },
      { name: 'Descarga', text: 'Descarga la copia limpia, lista para compartir.' },
    ],
    faq: [
      ['¿WhatsApp borra la ubicación de las fotos?', 'Al enviarlas como foto, WhatsApp las recomprime y quita la mayoría de los datos. Pero si las mandas como documento, por correo o las subes a otras páginas, pueden llegar con la ubicación.'],
      ['¿La foto pierde calidad?', 'No. Solo se quitan los datos ocultos; la imagen queda exactamente igual.'],
      ['¿Qué datos se conservan?', 'Solo la orientación de las fotos, para que no aparezcan giradas. Todo lo demás se borra.'],
    ],
  },
]
