// Guías de DocuSmart (W-19): artículos cortos y prácticos que resuelven una tarea
// de principio a fin y llevan a la herramienta. scripts/generate-tool-pages.mjs
// genera /guias (índice) y /guias/<slug> (cada guía). Por ahora solo en español.
//
// Formato del cuerpo:
//   - sections: [{ h2, body: [...] }], donde cada elemento de body es
//       'párrafo'                 → <p> (admite enlaces internos [texto](/ruta))
//       { ul: ['…', '…'] }        → lista con viñetas (también admite enlaces)
//       { tip: '…' }              → recuadro de consejo
//   - steps: los pasos del "cómo se hace" (datos estructurados HowTo).
//   - tools: slugs de tools/pages.mjs que la guía recomienda (tarjetas al final).
//   - faq: preguntas frecuentes [pregunta, respuesta].

/** Fecha de la última revisión del contenido (ISO). */
export const GUIDES_UPDATED = '2026-11-18'

export const guides = [
  {
    slug: 'unir-pdf-en-el-celular',
    title: 'Cómo unir PDF en el celular sin subir tus archivos | DocuSmart',
    description:
      'Guía paso a paso para juntar varios PDF en uno desde el celular, gratis y sin subirlos a ningún servidor. Funciona en Android y iPhone desde el navegador.',
    h1: 'Cómo unir PDF en el celular sin subir tus archivos',
    lead: 'Juntar la cédula, el recibo y el formulario en un solo PDF es de las tareas más comunes en un trámite. Así se hace desde el celular, en un minuto y sin entregar tus documentos a un servidor ajeno.',
    minutes: 4,
    icon: 'merge',
    tools: ['unir-pdf', 'ordenar-paginas-pdf', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Por qué importa no subir los archivos',
        body: [
          'La mayoría de las páginas para unir PDF reciben tus documentos en sus servidores, los procesan allá y te devuelven el resultado. Para un menú de restaurante da igual; para una cédula, un extracto bancario o una historia clínica, no tanto: no sabes cuánto tiempo los guardan ni quién puede verlos.',
          'DocuSmart hace la unión dentro del navegador de tu celular. El archivo nunca viaja por internet, así que no hay copia en ningún servidor. Por eso funciona incluso con mala señal, una vez cargada la página.',
        ],
      },
      {
        h2: 'Antes de empezar',
        body: [
          { ul: [
            'Ten los PDF guardados en el celular (en Descargas, en Archivos o en tu nube).',
            'Si alguno es una foto y no un PDF, primero conviértelo con [Imagen a PDF](/imagen-a-pdf).',
            'Si un PDF tiene contraseña, quítasela antes con [Desbloquear PDF](/desbloquear-pdf) (necesitas conocerla).',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Unir PDF](/unir-pdf) en el navegador del celular (Chrome, Safari, Samsung Internet o el que uses). Toca el recuadro para elegir los archivos: puedes seleccionar varios a la vez.',
          'Revisa el orden de la lista. El primer archivo será el inicio del documento final; muévelos con las flechas hasta que queden como los necesitas. Luego toca "Unir": el PDF combinado se descarga con todas las páginas.',
          { tip: '¿Necesitas cambiar el orden de páginas sueltas, no de archivos completos? Une primero y después abre el resultado en [Ordenar páginas](/ordenar-paginas-pdf), donde puedes mover o quitar cada página.' },
        ],
      },
      {
        h2: 'Si el PDF final pesa demasiado',
        body: [
          'Muchos portales de trámites y correos limitan el tamaño de los adjuntos (2 MB, 5 MB o 10 MB son límites comunes). Si te pasas, usa [Comprimir PDF](/comprimir-pdf): el nivel "Sin pérdida" no toca la calidad, y "Media" reduce mucho más los PDF que vienen de escaneos o fotos.',
        ],
      },
      {
        h2: 'Y si lo haces seguido',
        body: [
          'La web sirve en cualquier celular. Si usas Android y unes documentos con frecuencia, la app de DocuSmart hace lo mismo sin conexión y guarda tus archivos organizados en el teléfono.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Unir PDF', text: 'Entra a docusmart.online/unir-pdf desde el navegador del celular.' },
      { name: 'Elige los PDF', text: 'Toca el recuadro y selecciona todos los archivos que quieres juntar.' },
      { name: 'Ordénalos', text: 'Mueve los archivos con las flechas: el primero será el inicio del documento.' },
      { name: 'Une y descarga', text: 'Toca "Unir" y se descarga un solo PDF con todas las páginas.' },
    ],
    faq: [
      ['¿Funciona en iPhone?', 'Sí. Funciona en Safari y en cualquier navegador moderno, en iPhone y en Android. La app sin conexión es solo para Android.'],
      ['¿Cuántos PDF puedo unir?', 'No hay un número fijo. El límite es la memoria del celular: con documentos muy grandes puede tardar un poco más.'],
      ['¿Se pierde calidad?', 'No. Las páginas se copian tal cual, con su texto, sus imágenes y su tamaño originales.'],
    ],
  },
  {
    slug: 'pasar-fotos-a-pdf',
    title: 'Cómo pasar fotos a PDF (varias fotos en un solo archivo) | DocuSmart',
    description:
      'Convierte fotos del celular o del computador en un PDF, una foto por página. Gratis, sin registro y sin subir tus imágenes. Consejos para que quede legible y liviano.',
    h1: 'Cómo pasar fotos a PDF, varias en un solo archivo',
    lead: 'Te piden "el documento en PDF" y lo que tienes son fotos en la galería. Así las conviertes en un PDF ordenado, legible y liviano, sin instalar nada.',
    minutes: 4,
    icon: 'image',
    tools: ['imagen-a-pdf', 'escanear-documento', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Dos caminos según el tipo de foto',
        body: [
          { ul: [
            '**Fotos que ya se ven bien** (capturas de pantalla, imágenes descargadas, fotos tomadas de frente): usa [Imagen a PDF](/imagen-a-pdf). Cada foto se convierte en una página tal como está.',
            '**Fotos de una hoja de papel** (un recibo, un contrato, un certificado): usa [Escanear documento](/escanear-documento). Encuentra los bordes de la hoja, la endereza y blanquea el papel para que parezca escaneada.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso con Imagen a PDF',
        body: [
          'Abre [Imagen a PDF](/imagen-a-pdf) y elige tus imágenes. Acepta JPG, PNG, WebP, BMP y GIF, y puedes mezclarlos.',
          'Ordénalas con las flechas: cada imagen será una página, en ese orden. Toca "Convertir" y listo: tienes un único PDF.',
        ],
      },
      {
        h2: 'Cómo tomar la foto para que se lea bien',
        body: [
          { ul: [
            'Luz pareja, sin el flash directo: las sombras de tu mano o del celular dificultan la lectura.',
            'La hoja sobre una superficie oscura (una mesa de madera, por ejemplo): así el escáner encuentra mejor los bordes.',
            'El celular paralelo a la hoja, no inclinado.',
            'Que se vea la hoja completa, con un poco de margen.',
          ] },
          { tip: 'Con [Escanear documento](/escanear-documento) puedes marcar "Hacer el PDF buscable": reconoce el texto para que se pueda buscar y copiar, algo que algunos portales agradecen.' },
        ],
      },
      {
        h2: 'Que no pese demasiado',
        body: [
          'Una foto de celular moderna puede pesar 3 o 4 MB; diez fotos ya son un PDF pesado para un correo. Si el resultado es grande, pásalo por [Comprimir PDF](/comprimir-pdf) con el nivel "Media", que reduce mucho las páginas que son fotos. También puedes comprimir las fotos antes con [Comprimir imagen](/comprimir-imagen).',
        ],
      },
      {
        h2: 'Si tienes iPhone',
        body: [
          'Al elegir fotos desde Safari, el iPhone normalmente las entrega en JPG, así que funcionan sin hacer nada más. Si copiaste las fotos al computador y aparecen como archivos .HEIC, ese formato todavía no se puede convertir aquí.',
          'Para que el iPhone guarde las próximas fotos en JPG, entra en Ajustes › Cámara › Formatos y elige "Más compatible". Para las fotos que ya tienes, envíalas a tu computador desde la app Fotos con la opción de compartir: en ese caso suelen llegar convertidas a JPG.',
        ],
      },
      {
        h2: 'Tus fotos no salen del equipo',
        body: [
          'La conversión se hace en tu navegador: las fotos no se suben a ningún servidor. Es importante cuando son documentos de identidad o información de salud.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Imagen a PDF', text: 'Entra a docusmart.online/imagen-a-pdf.' },
      { name: 'Elige las fotos', text: 'Selecciona las imágenes (JPG, PNG, WebP, BMP o GIF).' },
      { name: 'Ordénalas', text: 'Usa las flechas: cada imagen será una página en ese orden.' },
      { name: 'Convierte', text: 'Toca "Convertir" para obtener un solo PDF.' },
    ],
    faq: [
      ['¿Puedo poner varias fotos en una sola página?', 'Imagen a PDF pone una foto por página, que es lo que suelen pedir los trámites. Si necesitas varias en una hoja, júntalas antes en una sola imagen.'],
      ['¿Qué diferencia hay con escanear?', 'Escanear documento recorta la hoja, la endereza y mejora el contraste; Imagen a PDF respeta la foto tal cual. Para papeles, escanear da un resultado más limpio.'],
      ['¿Funciona sin internet?', 'Una vez abierta la página, la conversión no necesita conexión. Si instalas DocuSmart Desktop o la app de Android, funciona totalmente sin conexión.'],
    ],
  },
  {
    slug: 'reducir-tamano-pdf',
    title: 'Cómo reducir el tamaño de un PDF para correo, WhatsApp o trámites | DocuSmart',
    description:
      'Por qué un PDF pesa tanto y cómo bajarle el peso sin perder legibilidad. Qué nivel de compresión elegir según el tipo de documento. Gratis y sin subir archivos.',
    h1: 'Cómo reducir el tamaño de un PDF',
    lead: '"El archivo supera el tamaño máximo permitido." Si te salió ese mensaje en un portal o en el correo, esta guía explica por qué pasa y cómo arreglarlo sin que el documento se vuelva ilegible.',
    minutes: 5,
    icon: 'compress',
    tools: ['comprimir-pdf', 'comprimir-imagen', 'dividir-pdf'],
    sections: [
      {
        h2: 'Por qué un PDF pesa tanto',
        body: [
          'Lo que más pesa en un PDF son las imágenes. Un documento creado desde Word con solo texto suele pesar unos cientos de kilobytes, aunque tenga muchas páginas. Uno armado con fotos o con un escáner configurado en alta resolución puede pasar fácilmente de 10 MB con pocas páginas.',
          'Por eso la compresión funciona muy distinto según el tipo de PDF: en un documento de texto hay poco que reducir; en un escaneo, mucho.',
        ],
      },
      {
        h2: 'Qué nivel elegir',
        body: [
          { ul: [
            '**Sin pérdida:** optimiza la estructura del archivo sin tocar la calidad. El texto sigue siendo seleccionable. Es la opción segura para contratos, facturas y documentos digitales.',
            '**Media:** recomendado para escaneos y fotos. Reduce mucho el peso y se sigue leyendo bien.',
            '**Alta:** para cuando el límite es muy estricto. Ojo: en los niveles Media y Alta el texto queda como imagen, así que ya no se puede seleccionar.',
          ] },
          { tip: 'Empieza con "Sin pérdida". Si no alcanza el tamaño que necesitas, prueba "Media". DocuSmart te muestra cuánto se redujo antes de que lo envíes.' },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Comprimir PDF](/comprimir-pdf), elige el archivo y escoge el nivel. Toca "Comprimir PDF": verás el peso antes y después, y se descarga el resultado.',
          'Si el PDF ya venía optimizado y no se puede reducir más, DocuSmart te avisa y no descarga una copia igual o más pesada.',
        ],
      },
      {
        h2: 'Si aun así no alcanza',
        body: [
          { ul: [
            '**Divide el documento:** muchos portales aceptan varios adjuntos. Con [Dividir PDF](/dividir-pdf) lo partes en dos o más archivos.',
            '**Comprime las fotos antes de armar el PDF:** [Comprimir imagen](/comprimir-imagen) reduce una foto de celular entre 60 % y 90 % casi sin diferencia visible.',
            '**Quita las páginas que sobran:** con [Ordenar páginas](/ordenar-paginas-pdf) eliminas portadas o páginas en blanco.',
          ] },
        ],
      },
      {
        h2: 'Límites habituales',
        body: [
          'Como referencia: Gmail permite adjuntos de hasta 25 MB y Outlook, de 20 MB. Muchos portales de trámites públicos y de bancos piden entre 2 y 5 MB por archivo. Revisa siempre el límite del sitio donde vas a subirlo.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Comprimir PDF', text: 'Entra a docusmart.online/comprimir-pdf.' },
      { name: 'Elige el archivo', text: 'Selecciona el PDF que pesa demasiado.' },
      { name: 'Escoge el nivel', text: '"Sin pérdida" para documentos digitales; "Media" o "Alta" para escaneos y fotos.' },
      { name: 'Comprime', text: 'Toca "Comprimir PDF", revisa cuánto se redujo y descarga el resultado.' },
    ],
    faq: [
      ['¿Comprimir daña el documento?', 'Con "Sin pérdida", no: el contenido queda idéntico. Con "Media" y "Alta" las páginas se convierten en imágenes más livianas, que se leen bien pero pierden el texto seleccionable.'],
      ['¿Mi PDF se sube a internet?', 'No. La compresión se hace dentro de tu navegador: el archivo nunca sale de tu equipo.'],
      ['¿Por qué mi PDF casi no se redujo?', 'Seguramente es un PDF de texto o ya venía optimizado. En esos casos el peso ya es bajo y hay poco que quitar.'],
    ],
  },
  {
    slug: 'firmar-pdf-sin-imprimir',
    title: 'Cómo firmar un PDF sin imprimirlo (desde el celular o el PC) | DocuSmart',
    description:
      'Firma un documento PDF sin imprimir ni escanear: dibuja tu firma, escríbela o usa una foto. Qué validez tiene una firma electrónica simple. Gratis y privado.',
    h1: 'Cómo firmar un PDF sin imprimirlo',
    lead: 'Imprimir, firmar con bolígrafo, escanear y volver a enviar: cuatro pasos que puedes reemplazar por uno. Así se firma un PDF desde el celular o el computador.',
    minutes: 4,
    icon: 'pen',
    tools: ['firmar-pdf', 'llenar-formulario-pdf', 'proteger-pdf'],
    sections: [
      {
        h2: 'Tres formas de crear tu firma',
        body: [
          { ul: [
            '**Dibujarla** con el dedo en el celular o con el mouse en el computador.',
            '**Escribir tu nombre**, que se muestra con letra manuscrita.',
            '**Subir una foto** de tu firma hecha en papel. Es la que más se parece a tu firma de siempre.',
          ] },
          { tip: 'Para la foto: firma con tinta oscura sobre una hoja blanca, con buena luz y sin sombras. DocuSmart quita el fondo para que solo quede el trazo.' },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Firmar PDF](/firmar-pdf) y elige el documento. Crea tu firma con cualquiera de las tres formas.',
          'Arrástrala al lugar donde va la firma y ajusta su tamaño. Si el documento pide iniciales en cada hoja, usa "Repetir en todas las páginas". Toca "Firmar PDF".',
        ],
      },
      {
        h2: 'Si además hay que llenar datos',
        body: [
          'Muchos documentos para firmar son formularios: nombre, número de documento, fecha. Si el PDF tiene campos rellenables, complétalos primero con [Llenar formulario](/llenar-formulario-pdf) y después fírmalo. Antes de enviarlo, marca "Aplanar" para que las respuestas queden fijas.',
        ],
      },
      {
        h2: 'Errores comunes al firmar',
        body: [
          { ul: [
            '**Firma diminuta o pixelada:** agrándala hasta que ocupe el espacio de la línea de firma; si viene de una foto, tómala con buena luz y de cerca.',
            '**Firma encima del texto:** muévela hasta que no tape datos del documento; un contrato con la firma sobre una cláusula puede generar dudas.',
            '**Firmar la versión equivocada:** revisa que sea el documento final antes de firmar; corregir después obliga a firmar de nuevo.',
            '**Olvidar las demás páginas:** si el documento pide firma o iniciales en cada hoja, usa "Repetir en todas las páginas" en lugar de ir una por una.',
          ] },
        ],
      },
      {
        h2: '¿Tiene validez legal?',
        body: [
          'Lo que se obtiene es una **firma electrónica simple**: la imagen de tu firma sobre el documento, el equivalente digital de firmar a mano. Sirve para la mayoría de los trámites cotidianos: contratos de arrendamiento, autorizaciones, formatos de empresa o permisos escolares.',
          'Algunos trámites exigen una **firma digital con certificado**, emitida por una entidad certificadora autorizada; por ejemplo, ciertas actuaciones ante entidades públicas o la facturación electrónica. Si el trámite la pide explícitamente, la firma de imagen no basta.',
        ],
      },
      {
        h2: 'Tu firma no se guarda en ningún lado',
        body: [
          'La firma y el documento se procesan dentro del navegador. No se suben a un servidor ni quedan guardados: al cerrar la página, la firma se borra. Si vas a enviar el documento por un canal poco confiable, puedes ponerle contraseña con [Proteger PDF](/proteger-pdf).',
        ],
      },
    ],
    steps: [
      { name: 'Abre Firmar PDF', text: 'Entra a docusmart.online/firmar-pdf y elige el documento.' },
      { name: 'Crea tu firma', text: 'Dibújala, escribe tu nombre o sube una foto de tu firma en papel.' },
      { name: 'Colócala', text: 'Arrástrala a su lugar y ajusta el tamaño; puedes repetirla en todas las páginas.' },
      { name: 'Descarga', text: 'Toca "Firmar PDF" para obtener el PDF firmado.' },
    ],
    faq: [
      ['¿Puedo firmar desde el celular?', 'Sí. En el celular puedes dibujar la firma con el dedo o tomarle una foto a tu firma en papel.'],
      ['¿El documento firmado se puede modificar?', 'La firma queda incrustada en la página. Para evitar cambios y accesos no deseados, puedes proteger el PDF con contraseña y quitar el permiso de modificar.'],
      ['¿Puedo firmar varias páginas?', 'Sí: agrega la firma en cada página que quieras o usa "Repetir en todas las páginas".'],
    ],
  },
  {
    slug: 'escanear-documentos-con-el-celular',
    title: 'Cómo escanear documentos con el celular y guardarlos en PDF | DocuSmart',
    description:
      'Escanea documentos con la cámara del celular, sin instalar apps: recorte automático, filtro que quita sombras y PDF con texto buscable. Consejos para un escaneo nítido.',
    h1: 'Cómo escanear documentos con el celular',
    lead: 'No necesitas un escáner ni instalar una app: la cámara del celular y el navegador bastan para obtener un PDF limpio, recortado y con el texto reconocido.',
    minutes: 5,
    icon: 'camera',
    tools: ['escanear-documento', 'ocr-pdf', 'imagen-a-pdf'],
    sections: [
      {
        h2: 'Qué hace un escáner (y por qué una foto sola no basta)',
        body: [
          'Una foto de una hoja casi nunca sale perfecta: queda un poco inclinada, se ve la mesa alrededor y el papel blanco aparece gris o con sombras. Un escáner de celular corrige eso: encuentra las cuatro esquinas de la hoja, la endereza como si la hubieras fotografiado desde arriba y blanquea el fondo.',
          'Eso hace [Escanear documento](/escanear-documento), directamente en el navegador.',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Escanear documento](/escanear-documento) y toca "Tomar foto": en el celular se abre la cámara. También puedes elegir fotos que ya tengas.',
          'Revisa las esquinas que encontró DocuSmart; si alguna quedó mal, arrástrala hasta la punta de la hoja. Elige el filtro "Documento" para blanquear el papel y quitar sombras. Agrega más páginas si el documento tiene varias hojas.',
          'Toca "Crear PDF". Si marcas "Hacer el PDF buscable", además se reconoce el texto para que puedas buscar palabras y copiarlas.',
        ],
      },
      {
        h2: 'Cinco trucos para un escaneo nítido',
        body: [
          { ul: [
            'Pon la hoja sobre una superficie oscura: el contraste ayuda a detectar los bordes.',
            'Busca luz natural o una lámpara de lado; evita el flash directo, que genera brillos.',
            'Sostén el celular paralelo a la hoja y espera a que enfoque.',
            'Aplana bien la hoja: los dobleces generan sombras que el filtro no siempre quita.',
            'Para varias páginas, escanéalas todas en la misma sesión y saldrán en un solo PDF.',
          ] },
        ],
      },
      {
        h2: 'Reconocer el texto de un escaneo que ya tienes',
        body: [
          'Si ya tienes un PDF escaneado o una foto y necesitas copiar su texto, usa [OCR PDF](/ocr-pdf): reconoce texto impreso en español e inglés y te lo da para copiar, como archivo .txt o como PDF buscable. Funciona mejor con escaneos nítidos y derechos; la letra a mano suele reconocerse mal.',
        ],
      },
      {
        h2: 'Privado de principio a fin',
        body: [
          'La detección de bordes, el enderezado, los filtros y el reconocimiento de texto se hacen dentro de tu navegador. Las fotos no se suben a ningún servidor. Si escaneas a menudo, la app de DocuSmart para Android hace lo mismo sin conexión.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Escanear documento', text: 'Entra a docusmart.online/escanear-documento y toca "Tomar foto".' },
      { name: 'Ajusta las esquinas', text: 'Revisa el recorte y arrastra las esquinas si hace falta.' },
      { name: 'Elige el filtro', text: 'El filtro "Documento" blanquea el papel y quita sombras.' },
      { name: 'Guarda el PDF', text: 'Toca "Crear PDF"; marca "Hacer el PDF buscable" para reconocer el texto.' },
    ],
    faq: [
      ['¿Necesito instalar una app?', 'No. Funciona en el navegador del celular o del computador. La app de Android es opcional, para escanear sin conexión.'],
      ['¿Qué es un PDF buscable?', 'Un PDF que, además de la imagen, tiene el texto reconocido: puedes buscar palabras, seleccionarlas y copiarlas.'],
      ['¿Qué hago si no encuentra bien los bordes?', 'Arrastra cada esquina hasta la punta de la hoja o usa "Toda la foto". Ayuda que el papel contraste con el fondo.'],
    ],
  },
  {
    slug: 'proteger-pdf-con-contrasena',
    title: 'Cómo ponerle contraseña a un PDF (y cuándo conviene hacerlo) | DocuSmart',
    description:
      'Protege un PDF con contraseña y cifrado AES-256, controla si se puede imprimir o copiar y aprende a compartir la clave de forma segura. Gratis y sin subir el archivo.',
    h1: 'Cómo ponerle contraseña a un PDF',
    lead: 'Un PDF con tus datos personales, financieros o médicos que viaja por correo o por chat puede terminar en cualquier parte. Ponerle contraseña toma un minuto y evita que lo abra quien no debe.',
    minutes: 4,
    icon: 'lock',
    tools: ['proteger-pdf', 'desbloquear-pdf', 'censurar-pdf'],
    sections: [
      {
        h2: 'Cuándo conviene proteger un PDF',
        body: [
          { ul: [
            'Documentos de identidad, extractos bancarios, nóminas o declaraciones de impuestos.',
            'Historias clínicas, resultados de exámenes o incapacidades.',
            'Contratos o propuestas que no quieres que circulen.',
            'Cualquier archivo que vas a enviar por un canal que no controlas, como un correo que se reenvía o un grupo de chat.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Proteger PDF](/proteger-pdf) y elige el documento. Escribe la contraseña dos veces.',
          'Decide qué se permite con el PDF abierto: imprimir, copiar texto o modificarlo. Toca "Proteger PDF" y se descarga la versión cifrada. Se abre con Adobe Acrobat, Chrome, Edge y la app de DocuSmart, que piden la contraseña.',
        ],
      },
      {
        h2: 'Una buena contraseña y cómo compartirla',
        body: [
          { ul: [
            'Usa al menos 10 caracteres; una frase corta con números es fácil de recordar y difícil de adivinar.',
            'No uses tu número de documento ni tu fecha de nacimiento: es lo primero que alguien intentaría.',
            '**Nunca envíes la contraseña por el mismo medio que el PDF.** Si el archivo va por correo, manda la clave por mensaje o dila por teléfono.',
          ] },
          { tip: 'Guarda la contraseña en un lugar seguro. Si la olvidas, no se puede recuperar: ni DocuSmart puede abrir el PDF, porque la clave nunca sale de tu equipo.' },
        ],
      },
      {
        h2: 'Qué protege cada opción',
        body: [
          'La **contraseña de apertura** es la protección de verdad: sin ella, el archivo cifrado no se puede leer. Los **permisos** (imprimir, copiar, modificar) son otra cosa: indican a los lectores de PDF qué deben permitir una vez abierto el documento.',
          'Los programas serios respetan esos permisos, pero quien ya tiene la contraseña puede quitarlos con algunas herramientas. Úsalos para evitar copias accidentales o cambios casuales, no como única barrera. Si alguien no debe ver un dato, no le des la contraseña o censura ese dato antes de enviar el archivo.',
        ],
      },
      {
        h2: 'Contraseña no es lo mismo que censurar',
        body: [
          'La contraseña impide abrir el archivo, pero quien la tenga verá todo el contenido. Si necesitas compartir un documento ocultando solo ciertos datos (un número de cuenta, una dirección), usa [Censurar PDF](/censurar-pdf): elimina de verdad el texto debajo de las zonas tapadas, en lugar de poner un simple recuadro negro encima.',
        ],
      },
      {
        h2: 'Quitar la contraseña después',
        body: [
          'Si más adelante necesitas una copia sin protección, [Desbloquear PDF](/desbloquear-pdf) la quita, siempre que conozcas la contraseña. Úsalo solo con documentos propios o que tengas derecho a modificar.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Proteger PDF', text: 'Entra a docusmart.online/proteger-pdf y elige el documento.' },
      { name: 'Escribe la contraseña', text: 'Escríbela dos veces para confirmarla.' },
      { name: 'Elige los permisos', text: 'Marca si se permite imprimir, copiar o modificar.' },
      { name: 'Protege y descarga', text: 'Toca "Proteger PDF" y se descarga el documento cifrado.' },
    ],
    faq: [
      ['¿Qué tan seguro es?', 'Usa cifrado AES-256, el estándar más fuerte de los PDF. La seguridad real depende de que la contraseña sea difícil de adivinar.'],
      ['¿Se envía mi contraseña a algún servidor?', 'No. El cifrado se hace en tu navegador; ni el archivo ni la contraseña salen de tu equipo.'],
      ['¿Puedo quitarle la contraseña a un PDF ajeno?', 'Solo si conoces la contraseña. DocuSmart no rompe contraseñas de apertura.'],
    ],
  },
]
