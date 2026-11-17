// Páginas propias de cada herramienta (SEO). Fuente única de verdad:
// scripts/generate-tool-pages.mjs genera un HTML por entrada (/<slug>) y
// vite.config.ts las agrega al build. Para sumar una herramienta, agrégala aquí.
//
// tool: { kind: 'pdf', id: 'unir'|'dividir'|'rotar'|'reordenar'|'numerar'|'marca'|'comprimir'|'proteger'|'desbloquear'|'reparar'|'ocr'|'recortar'|'firmar'|'censurar'|'comparar'|'imagenes'|'editar'|'formulario'|'escanear'|'pdfa' }
//       { kind: 'conv', id: 'img-pdf'|'img-jpg'|'img-png'|'img-webp'|'img-bmp'|'pdf-img'|'pdf-txt'|'pdf-word'|'pdf-excel'|'word-pdf'|'excel-pdf' }
//       { kind: 'qr' }
//       { kind: 'archive', id: 'crear'|'extraer' }
//       { kind: 'img', id: 'comprimir'|'redimensionar'|'recortar'|'rotar' }

export const SITE = 'https://docusmart.online'
/** Redes sociales de DocuSmart (pie de página y datos estructurados). */
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61596626852763'
export const INSTAGRAM_URL = 'https://www.instagram.com/supportdocusmart/'
export const TIKTOK_URL = 'https://www.tiktok.com/@docusmartsupport'

export const pages = [
  {
    slug: 'unir-pdf',
    tool: { kind: 'pdf', id: 'unir' },
    title: 'Unir PDF gratis y sin subir archivos | DocuSmart',
    description:
      'Une varios PDF en uno solo desde el navegador. Gratis, sin registro y sin subir tus archivos: todo se procesa en tu equipo.',
    h1: 'Unir PDF',
    lead: 'Combina varios archivos PDF en uno solo y ordénalos como quieras. Tus documentos nunca salen de tu equipo.',
    short: 'Combina varios PDF en uno',
    steps: [
      'Elige o arrastra los PDF que quieres unir.',
      'Ordénalos con las flechas: el primero de la lista será el inicio del documento.',
      'Pulsa "Unir" y se descarga un solo PDF con todas las páginas.',
    ],
    faq: [
      ['¿Mis PDF se suben a algún servidor?', 'No. La unión se hace dentro de tu navegador con tecnología que corre en tu propio equipo. Nadie más recibe tus archivos.'],
      ['¿Cuántos PDF puedo unir?', 'Todos los que necesites. El único límite es la memoria de tu equipo: con documentos muy grandes puede tardar un poco más.'],
      ['¿Se pierde calidad al unir?', 'No. Las páginas se copian tal cual, con su texto, imágenes y tamaño originales.'],
      ['¿Funciona en el celular?', 'Sí, en cualquier navegador moderno. Y si usas Android, la app de DocuSmart lo hace sin conexión.'],
    ],
  },
  {
    slug: 'dividir-pdf',
    tool: { kind: 'pdf', id: 'dividir' },
    title: 'Dividir PDF y extraer páginas gratis | DocuSmart',
    description:
      'Separa un PDF en varios archivos o extrae solo las páginas que necesitas. Gratis, sin registro y sin subir el documento.',
    h1: 'Dividir PDF',
    lead: 'Extrae las páginas que necesitas o separa cada página en su propio archivo, directo en tu navegador.',
    short: 'Extrae páginas o sepáralas',
    steps: [
      'Elige el PDF que quieres dividir.',
      'Toca las páginas que quieres conservar, escribe un rango como "1-3, 5" o elige "Cada página por separado".',
      'Descarga el resultado: un PDF con las páginas elegidas o un .zip con una página por archivo.',
    ],
    faq: [
      ['¿Cómo extraigo solo algunas páginas?', 'Tócalas en las miniaturas o escribe un rango, por ejemplo "2-4, 7" o "5-" para ir de la página 5 hasta el final.'],
      ['¿El PDF original se modifica?', 'No. Siempre se genera un archivo nuevo; el original queda igual en tu equipo.'],
      ['¿Es seguro para documentos privados?', 'Sí. El archivo no se sube a internet: todo el proceso ocurre en tu navegador.'],
    ],
  },
  {
    slug: 'rotar-pdf',
    tool: { kind: 'pdf', id: 'rotar' },
    title: 'Rotar PDF online gratis, página por página | DocuSmart',
    description:
      'Gira las páginas de un PDF que quedaron de lado o al revés. Rota una página o todas, gratis y sin subir el archivo.',
    h1: 'Rotar PDF',
    lead: 'Endereza las páginas que quedaron de lado o al revés, una por una o todas a la vez.',
    short: 'Endereza páginas giradas',
    steps: [
      'Elige el PDF.',
      'Toca cada página para girarla 90°, o usa "Rotar todas".',
      'Pulsa "Guardar PDF rotado" y descarga el documento corregido.',
    ],
    faq: [
      ['¿Puedo rotar solo una página?', 'Sí. Cada toque gira esa página 90°; las demás quedan como estaban.'],
      ['¿La rotación es permanente?', 'Sí, queda guardada en el PDF nuevo y se verá igual en cualquier lector.'],
      ['¿Necesito instalar algo?', 'No. Funciona en el navegador, sin registro y sin subir el archivo.'],
    ],
  },
  {
    slug: 'escanear-documento',
    tool: { kind: 'pdf', id: 'escanear' },
    title: 'Escáner online gratis: de foto a PDF con el celular | DocuSmart',
    description:
      'Convierte fotos de documentos en un PDF que parece escaneado: detecta la hoja, endereza la perspectiva y blanquea el papel. Varias páginas y OCR opcional. Sin instalar nada.',
    h1: 'Escanear documento',
    lead: 'Toma una foto de tu contrato, recibo o tarea con el celular y DocuSmart la convierte en un escaneo derecho y limpio, listo para enviar en PDF.',
    short: 'Foto → PDF limpio',
    howTo: 'Cómo escanear un documento en 3 pasos',
    steps: [
      'Pulsa "Tomar foto" (en el celular se abre la cámara) o elige fotos que ya tengas. Pon la hoja sobre una superficie oscura y con buena luz.',
      'Revisa las esquinas que encontró DocuSmart y elige un filtro: Documento blanquea el papel y quita sombras. Agrega más páginas si quieres.',
      'Pulsa "Guardar PDF" (marca "Hacer el PDF buscable" para poder buscar el texto) o descarga las páginas como JPG.',
    ],
    faq: [
      ['¿Necesito instalar una app?', 'No. Funciona en el navegador del celular o del computador. Si escaneas seguido, la app Android de DocuSmart también lo hace sin conexión.'],
      ['¿Qué hago si no encuentra bien los bordes?', 'Arrastra cada esquina hasta la punta de la hoja, o usa "Toda la foto". Funciona mejor si el papel contrasta con el fondo (una mesa oscura).'],
      ['¿Qué es un PDF buscable?', 'Uno en el que, además de la imagen, se reconoce el texto (OCR): puedes buscar palabras, seleccionarlas y copiarlas.'],
      ['¿Mis fotos se suben a internet?', 'No. La detección, el enderezado, los filtros y el OCR se hacen dentro de tu navegador.'],
    ],
  },
  {
    slug: 'llenar-formulario-pdf',
    tool: { kind: 'pdf', id: 'formulario' },
    title: 'Llenar formulario PDF online gratis | DocuSmart',
    description:
      'Completa los campos de un formulario PDF desde el navegador: textos, casillas, opciones y listas, con la página a la vista. Aplánalo para enviarlo. Gratis y sin subir el archivo.',
    h1: 'Llenar formulario PDF',
    lead: 'Completa solicitudes, inscripciones y formatos PDF rellenables sin imprimirlos ni instalar programas, viendo en la página dónde va cada respuesta.',
    short: 'Completa PDF rellenables',
    howTo: 'Cómo llenar un formulario PDF en 3 pasos',
    steps: [
      'Elige el formulario PDF: DocuSmart encuentra sus campos y los marca sobre la página.',
      'Escribe tus respuestas; al tocar un recuadro de la página se abre su campo, y al revés.',
      'Si lo vas a enviar, marca "Aplanar" para que las respuestas queden fijas, y pulsa "Guardar y descargar".',
    ],
    faq: [
      ['¿Qué formularios funcionan?', 'Los PDF con campos rellenables (AcroForm), que son la gran mayoría: cuadros de texto, casillas, opciones, listas desplegables y listas. Si un PDF no tiene campos, puedes escribir encima con "Editar PDF".'],
      ['¿Qué significa aplanar?', 'Convierte las respuestas en parte fija del documento: se ven igual en cualquier lector y nadie puede cambiarlas sin dejar rastro. Sin aplanar, el formulario sigue siendo editable.'],
      ['¿Puedo seguir llenándolo después?', 'Sí, si no lo aplanas: abre el PDF guardado de nuevo aquí o en cualquier lector y tus respuestas seguirán en los campos.'],
      ['¿Mis datos se suben a internet?', 'No. El formulario y tus respuestas se procesan dentro de tu navegador.'],
    ],
  },
  {
    slug: 'editar-pdf',
    tool: { kind: 'pdf', id: 'editar' },
    title: 'Editar PDF online gratis: agregar texto, imágenes y formas | DocuSmart',
    description:
      'Escribe sobre un PDF, agrega imágenes, rectángulos y círculos, resalta texto o tapa lo que no quieres que se vea. Gratis, sin registro y sin subir el archivo.',
    h1: 'Editar PDF',
    lead: 'Llena un formulario que no es editable, corrige un dato, marca lo importante o agrega tu logo, directo sobre las páginas del PDF.',
    short: 'Texto, imágenes y formas',
    howTo: 'Cómo editar un PDF en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Usa la barra de herramientas: Texto, Imagen, Rectángulo, Círculo, Resaltar o Tapar. Toca o arrastra sobre la página para agregarlos.',
      'Ajusta tamaño, color y posición, y pulsa "Guardar y descargar".',
    ],
    faq: [
      ['¿Puedo cambiar el texto que ya tiene el PDF?', 'Puedes taparlo con la herramienta "Tapar" (un recuadro blanco) y escribir el texto nuevo encima con "Texto". El resultado se ve como si lo hubieras corregido.'],
      ['¿"Tapar" borra lo que hay debajo?', 'No: lo cubre, pero el texto original sigue dentro del archivo. Si necesitas eliminar datos sensibles de verdad, usa "Censurar PDF".'],
      ['¿Qué letras puedo usar?', 'Tres familias estándar de PDF (sans, serif y monoespaciada), en normal o negrita, con tildes y ñ. Los emojis y otros alfabetos no se pueden guardar con esas fuentes.'],
      ['¿Mis archivos se suben a internet?', 'No. Todo se hace dentro de tu navegador, sin registro.'],
    ],
  },
  {
    slug: 'extraer-imagenes-pdf',
    tool: { kind: 'pdf', id: 'imagenes' },
    title: 'Extraer imágenes de un PDF gratis, en calidad original | DocuSmart',
    description:
      'Saca todas las fotos y gráficos de un PDF con su resolución original: las JPEG salen idénticas y las demás como PNG. Descárgalas una por una o en ZIP, sin subir el archivo.',
    h1: 'Extraer imágenes de un PDF',
    lead: 'Recupera las fotos, logos y gráficos que vienen dentro de un PDF, tal como se guardaron, sin capturas de pantalla ni pérdida de calidad.',
    short: 'Fotos en su calidad original',
    howTo: 'Cómo extraer las imágenes de un PDF en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Pulsa "Buscar imágenes": aparecen todas las fotos y gráficos que contiene.',
      'Elige las que quieras y descárgalas una por una o todas juntas en un ZIP.',
    ],
    faq: [
      ['¿Pierden calidad las imágenes?', 'No. Las fotos JPEG se copian byte por byte, idénticas a las originales, y las demás se guardan como PNG, que no pierde calidad.'],
      ['¿Qué diferencia hay con "PDF a JPG"?', '"PDF a JPG" convierte cada página completa en una imagen. "Extraer imágenes" saca solo las fotos y gráficos que hay dentro, cada uno por separado y con su tamaño original.'],
      ['¿Por qué no aparece nada en un PDF escaneado?', 'Porque en un escaneo cada página es una sola imagen grande; para eso usa "PDF a JPG". Si una imagen usa un formato poco común (JPEG 2000, fax o JBIG2), DocuSmart te lo avisa.'],
      ['¿Mis archivos se suben a internet?', 'No. Todo se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'comparar-pdf',
    tool: { kind: 'pdf', id: 'comparar' },
    title: 'Comparar PDF online gratis: ver qué cambió | DocuSmart',
    description:
      'Compara dos versiones de un PDF y mira palabra por palabra qué se agregó y qué se quitó, con la página de cada cambio. Gratis y sin subir los archivos.',
    h1: 'Comparar PDF',
    lead: 'Encuentra en segundos qué cambió entre dos versiones de un contrato, una propuesta o un trabajo, sin leerlos de punta a punta.',
    short: 'Qué cambió entre dos versiones',
    howTo: 'Cómo comparar dos PDF en 3 pasos',
    steps: [
      'Elige el PDF original y la nueva versión.',
      'Pulsa "Comparar".',
      'Revisa cada cambio: en verde lo agregado y tachado en rojo lo quitado. Descarga el informe si lo necesitas.',
    ],
    faq: [
      ['¿Qué tipo de cambios detecta?', 'Cambios en el texto: palabras, números o párrafos agregados, quitados o modificados. Si solo cambió el salto de línea o el espaciado, no lo cuenta como cambio. Los cambios en imágenes o en el diseño no se detectan.'],
      ['¿Funciona con documentos escaneados?', 'Un escaneo es una imagen y no tiene texto para comparar. Pasa primero cada versión por la herramienta OCR y compara los PDF buscables que genera.'],
      ['¿Importa que las páginas no coincidan?', 'No. Se compara el documento completo, así que si un párrafo nuevo corre todo a la página siguiente, solo se marca ese párrafo. Cada cambio indica en qué página está en cada versión.'],
      ['¿Mis documentos se suben a internet?', 'No. La comparación se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'censurar-pdf',
    tool: { kind: 'pdf', id: 'censurar' },
    title: 'Censurar PDF online gratis: tachar datos de verdad | DocuSmart',
    description:
      'Tapa nombres, cédulas, teléfonos o correos en un PDF y elimínalos de verdad, no solo con un recuadro encima. Busca y marca todo de una vez. Gratis y sin subir el archivo.',
    h1: 'Censurar PDF',
    lead: 'Oculta datos personales antes de compartir un documento: lo que tapas desaparece del archivo, no queda escondido debajo de un recuadro.',
    short: 'Elimina datos sensibles',
    howTo: 'Cómo censurar un PDF en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Busca una palabra o marca todos los correos o números largos; también puedes arrastrar sobre la página para tapar cualquier zona.',
      'Revisa las páginas y pulsa "Censurar y descargar".',
    ],
    faq: [
      ['¿Por qué no basta con poner un recuadro negro?', 'Porque el texto sigue debajo: cualquiera puede copiarlo o quitar el recuadro. DocuSmart vuelve a dibujar cada página censurada como imagen, con las zonas en negro, y así el texto original desaparece del archivo.'],
      ['¿Qué pasa con el resto del documento?', 'Las páginas sin zonas marcadas quedan exactamente igual. En las páginas censuradas el texto ya no se puede seleccionar. Además, el PDF nuevo no conserva los metadatos del original, como el autor o el título.'],
      ['¿La búsqueda funciona con documentos escaneados?', 'No: un escaneo es una imagen y no tiene texto que buscar. En ese caso marca las zonas arrastrando sobre la página.'],
      ['¿Mis documentos se suben a internet?', 'No. Todo se hace dentro de tu navegador; ni el PDF ni lo que censuras sale de tu equipo.'],
    ],
  },
  {
    slug: 'firmar-pdf',
    tool: { kind: 'pdf', id: 'firmar' },
    title: 'Firmar PDF online gratis, sin registrarte | DocuSmart',
    description:
      'Firma un PDF desde el navegador: dibuja tu firma con el dedo o el mouse, escríbela o sube una foto, y colócala donde quieras. Gratis y sin subir el archivo.',
    h1: 'Firmar PDF',
    lead: 'Pon tu firma en contratos, formularios o cartas sin imprimir ni escanear: dibújala, escríbela o usa una foto de tu firma en papel.',
    short: 'Dibuja o sube tu firma',
    howTo: 'Cómo firmar un PDF en 3 pasos',
    steps: [
      'Elige el PDF que quieres firmar.',
      'Crea tu firma: dibújala, escribe tu nombre o sube una foto de tu firma en papel.',
      'Arrástrala a su lugar, ajusta el tamaño (puedes repetirla en todas las páginas) y pulsa "Firmar y descargar".',
    ],
    faq: [
      ['¿Tiene validez legal?', 'Es una firma electrónica simple: la imagen de tu firma sobre el documento, como firmar a mano. Sirve para la mayoría de los trámites cotidianos; cuando se exige una firma digital con certificado, necesitas el servicio de una entidad certificadora.'],
      ['¿Se guarda mi firma en algún lado?', 'No. La firma y el PDF se procesan dentro de tu navegador y no se suben a ningún servidor. Al cerrar la página, la firma se borra.'],
      ['¿Puedo firmar varias páginas?', 'Sí. Agrega la firma en cada página que quieras, o usa "Repetir en todas las páginas" para poner tus iniciales en todo el documento.'],
      ['¿Cómo saco una buena foto de mi firma?', 'Firma con tinta oscura sobre papel blanco y toma la foto con buena luz y sin sombras. DocuSmart quita el fondo blanco automáticamente.'],
    ],
  },
  {
    slug: 'recortar-pdf',
    tool: { kind: 'pdf', id: 'recortar' },
    title: 'Recortar PDF online gratis: quitar márgenes | DocuSmart',
    description:
      'Recorta las páginas de un PDF: quita los márgenes en blanco con un toque o elige a mano la zona que quieres conservar. Gratis y sin subir el archivo.',
    h1: 'Recortar PDF',
    lead: 'Quita márgenes sobrantes o deja solo la parte de la página que te interesa, en todas las páginas o en una sola.',
    short: 'Quita márgenes o deja una zona',
    howTo: 'Cómo recortar un PDF en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Arrastra los bordes del recuadro sobre la vista previa, o pulsa "Quitar márgenes en blanco".',
      'Elige si se recortan todas las páginas o solo la actual y pulsa "Recortar y descargar".',
    ],
    faq: [
      ['¿Se pierde calidad al recortar?', 'No. El recorte solo cambia la zona visible de cada página: el texto y las imágenes quedan iguales y el texto se puede seguir seleccionando.'],
      ['¿Lo que recorto se borra del archivo?', 'No: queda oculto, pero sigue dentro del PDF. Si necesitas eliminar información sensible, recortar no basta; usa una herramienta de censura.'],
      ['¿Puedo recortar solo una página?', 'Sí. Navega hasta la página, ajusta el recuadro y elige "Solo la página" antes de descargar.'],
      ['¿Mis archivos se suben a internet?', 'No. Todo se hace dentro de tu navegador, sin registro.'],
    ],
  },
  {
    slug: 'comprimir-pdf',
    tool: { kind: 'pdf', id: 'comprimir' },
    title: 'Comprimir PDF gratis, sin subir el archivo | DocuSmart',
    description:
      'Reduce el peso de un PDF desde el navegador: sin pérdida de calidad o al máximo para escaneos. Gratis, sin registro y sin subir tu archivo.',
    h1: 'Comprimir PDF',
    lead: 'Haz que tu PDF pese menos para enviarlo por correo o WhatsApp. Elige entre conservar la calidad o reducirlo al máximo.',
    short: 'Reduce el peso de un PDF',
    steps: [
      'Elige o arrastra el PDF.',
      'Escoge el nivel: "Sin pérdida" conserva todo; "Media" y "Alta" reducen mucho más el peso de escaneos y fotos.',
      'Pulsa "Comprimir PDF": verás cuánto se redujo y se descarga el archivo.',
    ],
    faq: [
      ['¿Qué nivel de compresión elijo?', '"Sin pérdida" optimiza el archivo sin tocar la calidad y el texto sigue siendo seleccionable. Si el PDF es un escaneo o tiene muchas fotos, "Media" o "Alta" lo reducen mucho más, a cambio de que el texto quede como imagen.'],
      ['¿Mi PDF se sube a internet?', 'No. La compresión se hace dentro de tu navegador: el archivo nunca sale de tu equipo.'],
      ['¿Por qué a veces no se reduce?', 'Algunos PDF ya vienen optimizados. En ese caso DocuSmart te avisa y no descarga un archivo igual o más pesado.'],
      ['¿Hay límite de tamaño?', 'No hay un límite fijo; depende de la memoria de tu equipo. Los PDF muy grandes pueden tardar un poco más.'],
    ],
  },
  {
    slug: 'proteger-pdf',
    tool: { kind: 'pdf', id: 'proteger' },
    title: 'Proteger PDF con contraseña (AES-256) gratis | DocuSmart',
    description:
      'Pon contraseña a un PDF con cifrado AES-256 y decide si se puede imprimir, copiar o modificar. Gratis, sin registro y sin subir el archivo.',
    h1: 'Proteger PDF con contraseña',
    lead: 'Cifra tu PDF para que solo pueda abrirlo quien tenga la contraseña, y controla qué se puede hacer con él.',
    short: 'Ponle contraseña a un PDF',
    steps: [
      'Elige el PDF que quieres proteger.',
      'Escribe la contraseña dos veces y marca si quieres permitir imprimir, copiar o modificar.',
      'Pulsa "Proteger PDF" y se descarga el documento cifrado.',
    ],
    faq: [
      ['¿Qué tan seguro es?', 'Usa cifrado AES-256, el estándar más fuerte de los PDF. Lo abren Adobe Acrobat, Chrome, Edge y la app de DocuSmart.'],
      ['¿Qué pasa si olvido la contraseña?', 'No se puede recuperar: ni nosotros podemos abrir el PDF, porque la contraseña nunca sale de tu equipo. Guárdala en un lugar seguro.'],
      ['¿Se sube mi documento a algún servidor?', 'No. El cifrado se hace en tu navegador; ni el archivo ni la contraseña se envían a internet.'],
    ],
  },
  {
    slug: 'desbloquear-pdf',
    tool: { kind: 'pdf', id: 'desbloquear' },
    title: 'Desbloquear PDF: quitar contraseña gratis | DocuSmart',
    description:
      'Quita la contraseña o las restricciones de impresión y copia de un PDF del que conoces la clave. Gratis, sin registro y sin subir el archivo.',
    h1: 'Desbloquear PDF',
    lead: 'Quita la contraseña de un PDF tuyo para no tener que escribirla cada vez, o elimina las restricciones de imprimir y copiar.',
    short: 'Quita la contraseña de un PDF',
    steps: [
      'Elige el PDF protegido.',
      'Escribe su contraseña. Si abre sin contraseña pero no deja imprimir o copiar, déjala vacía.',
      'Pulsa "Desbloquear PDF" y se descarga una copia sin contraseña.',
    ],
    faq: [
      ['¿Puede abrir un PDF sin saber la contraseña?', 'No. Para quitar la contraseña de apertura necesitas conocerla. Lo que sí se puede quitar sin contraseña son las restricciones de impresión y copia.'],
      ['¿Es legal?', 'Úsalo solo con documentos propios o que tengas derecho a modificar.'],
      ['¿La contraseña se envía a algún lado?', 'No. Todo ocurre en tu navegador: ni el PDF ni la contraseña salen de tu equipo.'],
    ],
  },
  {
    slug: 'reparar-pdf',
    tool: { kind: 'pdf', id: 'reparar' },
    title: 'Reparar PDF dañado gratis, en el navegador | DocuSmart',
    description:
      'Recupera PDF dañados que no abren o dan error: reconstruye su estructura interna desde el navegador. Gratis, sin registro y sin subir el archivo.',
    h1: 'Reparar PDF',
    lead: 'Si un PDF no abre, se ve en blanco o da error, intenta recuperarlo reconstruyendo su estructura interna.',
    short: 'Recupera PDF que no abren',
    steps: [
      'Elige el PDF dañado.',
      'Pulsa "Reparar PDF".',
      'Se descarga una copia reconstruida y te contamos si se encontraron problemas.',
    ],
    faq: [
      ['¿Qué tipo de daños puede reparar?', 'Sobre todo problemas de estructura: la tabla interna de referencias perdida o corrida, o el final del archivo dañado. Si faltan partes del contenido (por ejemplo, una descarga que se cortó a la mitad), puede que no se recupere.'],
      ['¿Funciona con PDF con contraseña?', 'Primero quítale la contraseña con "Desbloquear PDF" y luego repáralo.'],
      ['¿Se sube el archivo?', 'No. La reparación ocurre en tu navegador.'],
    ],
  },
  {
    slug: 'pdf-a-pdfa',
    tool: { kind: 'pdf', id: 'pdfa' },
    title: 'Convertir PDF a PDF/A gratis (PDF/A-2b) | DocuSmart',
    description:
      'Convierte un PDF al formato de archivo PDF/A-2b que piden entidades públicas, juzgados y universidades: fuentes y colores incluidos. Gratis, sin registro y sin subir el archivo.',
    h1: 'PDF a PDF/A',
    lead: 'Pasa tus documentos al formato estándar de archivo para que se vean igual dentro de muchos años, sin depender de fuentes ni programas externos.',
    short: 'Formato de archivo a largo plazo',
    steps: [
      'Elige el PDF.',
      'Pulsa "Convertir a PDF/A".',
      'Se descarga el PDF/A-2b y te contamos qué se ajustó para cumplir la norma.',
    ],
    faq: [
      ['¿Qué es PDF/A?', 'Es la versión de PDF pensada para archivar (norma ISO 19005): el archivo lleva dentro sus fuentes, su perfil de color y sus metadatos, y no puede depender de nada externo. Lo piden muchos trámites con entidades públicas, juzgados y universidades.'],
      ['¿Qué nivel de PDF/A crea?', 'PDF/A-2b, el nivel más usado: garantiza que el documento se vea igual en el futuro. Lo validamos con veraPDF, el validador de referencia de la PDF Association.'],
      ['¿Cambia algo de mi documento?', 'Se incluyen las fuentes que faltaban y se quitan cosas que la norma no permite, como scripts, adjuntos o sonidos. Si una página usa colores de imprenta (CMYK) o fuentes que no vienen en el archivo, esa página se guarda como imagen.'],
      ['¿Se sube el archivo?', 'No. La conversión ocurre en tu navegador.'],
    ],
  },
  {
    slug: 'comprimir-imagen',
    tool: { kind: 'img', id: 'comprimir' },
    title: 'Comprimir imagen online gratis: JPG, PNG y WebP | DocuSmart',
    description:
      'Reduce el peso de tus fotos e imágenes sin que se note: JPG, PNG y WebP, varias a la vez. Gratis, sin registro y sin subir las imágenes a ningún servidor.',
    h1: 'Comprimir imagen',
    lead: 'Haz tus fotos más livianas para enviarlas por correo o WhatsApp, subirlas a una página o ahorrar espacio, sin perder calidad visible.',
    short: 'Fotos más livianas',
    howTo: 'Cómo comprimir imágenes en 3 pasos',
    steps: [
      'Elige una o varias imágenes (JPG, PNG, WebP, GIF o BMP).',
      'Escoge el nivel: baja, recomendada o máxima.',
      'Pulsa "Comprimir" y descarga cada imagen o todas en un ZIP; verás cuánto peso ahorraste.',
    ],
    faq: [
      ['¿Cuánto se reduce el peso?', 'Depende de la foto: con el nivel recomendado, una foto de celular suele bajar entre 60 % y 90 %. Si una imagen ya estaba optimizada y no se puede reducir, DocuSmart te devuelve la original.'],
      ['¿Se nota la diferencia?', 'Con los niveles baja y recomendada, a simple vista casi no. El nivel máximo también reduce el tamaño a 1600 px de lado, ideal para mensajería y correo.'],
      ['¿Qué pasa con las imágenes con fondo transparente?', 'Se guardan como WebP, que conserva la transparencia y pesa mucho menos que PNG.'],
      ['¿Mis fotos se suben a internet?', 'No. La compresión se hace dentro de tu navegador. Además se quitan los datos ocultos de la foto (EXIF), como la ubicación GPS.'],
    ],
  },
  {
    slug: 'redimensionar-imagen',
    tool: { kind: 'img', id: 'redimensionar' },
    title: 'Redimensionar imagen online gratis, en pixeles o porcentaje | DocuSmart',
    description:
      'Cambia el tamaño de una o varias imágenes a los pixeles exactos o a un porcentaje, conservando la proporción. Gratis y sin subir las fotos.',
    h1: 'Redimensionar imagen',
    lead: 'Ajusta tus fotos al tamaño que pide un formulario, una red social o tu página web, de una en una o todas a la vez.',
    short: 'Cambia el tamaño de fotos',
    howTo: 'Cómo redimensionar imágenes en 3 pasos',
    steps: [
      'Elige una o varias imágenes.',
      'Escoge un porcentaje o escribe el ancho y el alto en pixeles (con o sin conservar la proporción).',
      'Pulsa "Redimensionar" y descarga el resultado.',
    ],
    faq: [
      ['¿Se deforma la imagen?', 'No, si dejas marcado "Conservar la proporción": basta con escribir el ancho o el alto y el otro lado se calcula solo.'],
      ['¿Puedo agrandar una imagen?', 'Sí, hasta el 200 % o el tamaño en pixeles que indiques, aunque agrandar no agrega detalle: la foto se verá más suave.'],
      ['¿En qué formato se guarda?', 'En el mismo de la original si es JPG, PNG o WebP; los demás formatos se guardan como PNG.'],
      ['¿Mis fotos se suben a internet?', 'No. Todo se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'recortar-imagen',
    tool: { kind: 'img', id: 'recortar' },
    title: 'Recortar imagen online gratis: libre, 1:1, 4:3 o 16:9 | DocuSmart',
    description:
      'Recorta una foto arrastrando el recuadro o con una proporción fija (cuadrada para perfil, 16:9 para portadas). Gratis, rápido y sin subir la imagen.',
    h1: 'Recortar imagen',
    lead: 'Quita lo que sobra de una foto o déjala en el formato exacto que necesitas: cuadrada para tu perfil, 16:9 para una portada o 4:3 para imprimir.',
    short: 'Libre o en 1:1, 4:3, 16:9…',
    howTo: 'Cómo recortar una imagen en 3 pasos',
    steps: [
      'Elige la imagen.',
      'Escoge una proporción (o "Libre") y ajusta el recuadro arrastrando sus bordes, esquinas o el recuadro entero.',
      'Pulsa "Recortar y descargar".',
    ],
    faq: [
      ['¿Qué proporción uso para una foto de perfil?', '1:1 (cuadrada). Para portadas y videos, 16:9; para historias, 9:16; y para fotos impresas, 4:3 o 3:4.'],
      ['¿Pierde calidad?', 'No: solo se quita la parte de afuera del recuadro; la parte que conservas mantiene su resolución.'],
      ['¿Mis fotos se suben a internet?', 'No. Todo se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'rotar-imagen',
    tool: { kind: 'img', id: 'rotar' },
    title: 'Rotar imagen online gratis: girar 90° o voltear | DocuSmart',
    description:
      'Gira fotos 90° a la izquierda o a la derecha, o voltéalas como en un espejo, una o varias a la vez. Gratis y sin subir las imágenes.',
    h1: 'Rotar y voltear imagen',
    lead: 'Endereza fotos que quedaron de lado o al revés, o refléjalas en horizontal o vertical, sin instalar ningún programa.',
    short: 'Gira 90° o voltea',
    howTo: 'Cómo rotar una imagen en 3 pasos',
    steps: [
      'Elige una o varias imágenes.',
      'Gira a la izquierda o a la derecha, o voltea en horizontal (espejo) o vertical, mirando la vista previa.',
      'Pulsa "Aplicar y guardar" y descarga el resultado.',
    ],
    faq: [
      ['¿Por qué mi foto se ve girada en algunos programas?', 'Muchas cámaras guardan la orientación como un dato aparte (EXIF) que no todos los programas leen. DocuSmart aplica ese dato y guarda la foto ya derecha, sin depender de él.'],
      ['¿Puedo girar varias fotos a la vez?', 'Sí: el mismo giro se aplica a todas las imágenes que elijas y puedes descargarlas juntas en un ZIP.'],
      ['¿Mis fotos se suben a internet?', 'No. Todo se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'comprimir-archivos',
    tool: { kind: 'archive', id: 'crear' },
    title: 'Comprimir archivos en ZIP o 7Z online, con contraseña | DocuSmart',
    description:
      'Crea un ZIP o 7Z con tus archivos o carpetas desde el navegador, con contraseña AES-256 opcional. Gratis, sin registro y sin subir nada.',
    h1: 'Comprimir archivos (ZIP y 7Z)',
    lead: 'Junta archivos y carpetas en un solo ZIP o 7Z para enviarlos o guardarlos, y protégelos con contraseña si quieres.',
    short: 'Crea un ZIP o 7Z',
    steps: [
      'Agrega los archivos o una carpeta completa.',
      'Elige el formato (ZIP o 7Z), el nivel de compresión y, si quieres, una contraseña.',
      'Pulsa "Crear" y se descarga el archivo comprimido.',
    ],
    faq: [
      ['¿ZIP o 7Z?', 'ZIP se abre en cualquier equipo sin instalar nada. 7Z comprime más y, con contraseña, también oculta los nombres de los archivos; para abrirlo se usa 7-Zip, WinRAR o DocuSmart.'],
      ['¿Puedo crear un archivo RAR?', 'No. RAR es un formato propietario y su licencia no permite que otros programas lo creen. 7Z es la alternativa libre y suele comprimir igual o mejor.'],
      ['¿Qué tan segura es la contraseña?', 'Se usa cifrado AES-256. En ZIP la contraseña solo puede tener letras sin tildes, números y símbolos; en 7Z puedes usar tildes y ñ.'],
      ['¿Mis archivos se suben a internet?', 'No. La compresión se hace dentro de tu navegador: tus archivos nunca salen de tu equipo.'],
    ],
  },
  {
    slug: 'descomprimir-archivos',
    tool: { kind: 'archive', id: 'extraer' },
    title: 'Abrir RAR, ZIP y 7Z online: descomprimir gratis | DocuSmart',
    description:
      'Descomprime archivos RAR, ZIP, 7Z, TAR y GZ desde el navegador, también con contraseña. Gratis, sin instalar nada y sin subir el archivo.',
    h1: 'Descomprimir RAR, ZIP y 7Z',
    lead: 'Abre un archivo comprimido sin instalar WinRAR ni 7-Zip: mira qué contiene y descarga lo que necesites.',
    short: 'Abre RAR, ZIP y 7Z',
    steps: [
      'Elige el archivo comprimido (RAR, ZIP, 7Z, TAR, GZ, BZ2 o XZ).',
      'Si tiene contraseña, escríbela. Verás la lista de archivos que contiene.',
      'Pulsa "Extraer archivos" y descarga cada uno o todo junto en un ZIP.',
    ],
    faq: [
      ['¿Qué formatos puedo abrir?', 'RAR (incluido RAR5), ZIP, 7Z, TAR, GZ, BZ2, XZ y TAR.GZ. El motor es 7-Zip, el mismo de la aplicación de escritorio.'],
      ['¿Funciona con archivos con contraseña?', 'Sí, si conoces la contraseña. En los 7Z que también ocultan los nombres, primero te la pedirá para mostrar el contenido.'],
      ['¿Necesito instalar algo?', 'No. Funciona en el navegador de tu computadora o celular.'],
      ['¿Se suben mis archivos?', 'No. Todo se descomprime dentro de tu navegador.'],
    ],
  },
  {
    slug: 'ocr-pdf',
    tool: { kind: 'pdf', id: 'ocr' },
    title: 'OCR online gratis: texto de PDF escaneados e imágenes | DocuSmart',
    description:
      'Reconoce el texto de un PDF escaneado o una foto y conviértelo en texto editable o en un PDF buscable. En español e inglés, gratis y sin subir el archivo.',
    h1: 'OCR: reconocer texto',
    howTo: 'Cómo reconocer el texto con OCR en 3 pasos',
    lead: 'Convierte un escaneo o una foto de un documento en texto que puedes copiar, editar o buscar, sin volver a escribirlo.',
    short: 'Texto de escaneos y fotos',
    steps: [
      'Elige un PDF escaneado o una imagen (JPG, PNG o WebP).',
      'Escoge el idioma del documento: español, inglés o ambos.',
      'Pulsa "Reconocer texto": copia el resultado o descárgalo como .txt o como PDF buscable.',
    ],
    faq: [
      ['¿Qué es un PDF buscable?', 'Es el mismo documento escaneado, con una capa de texto invisible encima: se ve igual, pero puedes seleccionar, copiar y buscar palabras.'],
      ['¿Mis documentos se suben a internet?', 'No. El reconocimiento se hace con Tesseract dentro de tu navegador. La primera vez se descarga el modelo del idioma desde docusmart.online y queda guardado en tu navegador para las próximas veces.'],
      ['¿Qué tan preciso es?', 'Con escaneos nítidos y derechos, muy preciso. Fotos borrosas, torcidas o con poca luz bajan la calidad: DocuSmart te avisa si el resultado es dudoso.'],
      ['¿Reconoce letra manuscrita?', 'Funciona con texto impreso. La letra a mano suele reconocerse mal.'],
    ],
  },
  {
    slug: 'imagen-a-pdf',
    tool: { kind: 'conv', id: 'img-pdf' },
    title: 'Convertir imagen a PDF (JPG, PNG, foto a PDF) | DocuSmart',
    description:
      'Convierte fotos e imágenes JPG, PNG o WebP a PDF y junta varias en un solo documento. Gratis, sin registro y sin subir tus fotos.',
    h1: 'Imagen a PDF',
    lead: 'Convierte una o varias fotos en un solo PDF, en el orden que elijas. Ideal para documentos fotografiados con el celular.',
    short: 'Junta fotos en un PDF',
    steps: [
      'Elige o arrastra tus imágenes (JPG, PNG, WebP, BMP o GIF).',
      'Ordénalas con las flechas: cada imagen será una página.',
      'Pulsa "Convertir y descargar" para obtener el PDF.',
    ],
    faq: [
      ['¿Qué formatos de imagen acepta?', 'JPG, PNG, WebP, BMP y GIF. Puedes mezclarlos en el mismo PDF.'],
      ['¿Puedo juntar varias fotos en un solo PDF?', 'Sí. Agrega todas las imágenes, ordénalas y se genera un único PDF con una página por foto.'],
      ['¿Mis fotos se suben a internet?', 'No. La conversión se hace en tu navegador; tus fotos no salen de tu equipo.'],
      ['¿Y si quiero escanear con la cámara?', 'La app de DocuSmart para Android escanea con detección de bordes y genera el PDF directamente.'],
    ],
  },
  {
    slug: 'pdf-a-jpg',
    tool: { kind: 'conv', id: 'pdf-img' },
    title: 'Convertir PDF a JPG o PNG gratis | DocuSmart',
    description:
      'Convierte cada página de un PDF en una imagen JPG o PNG de alta calidad. Gratis, sin registro y sin subir el documento.',
    h1: 'PDF a JPG',
    lead: 'Convierte cada página de tu PDF en una imagen JPG o PNG lista para compartir o publicar.',
    short: 'Cada página como imagen',
    steps: [
      'Elige el PDF.',
      'Escoge el formato: PNG (máxima calidad) o JPG (archivos más livianos).',
      'Descarga las imágenes: si son varias páginas, vienen juntas en un .zip.',
    ],
    faq: [
      ['¿Qué resolución tienen las imágenes?', 'Cada página se exporta a 1600 píxeles de ancho, suficiente para leer, imprimir o publicar.'],
      ['¿JPG o PNG?', 'PNG conserva la calidad exacta y es mejor para texto; JPG pesa menos y es ideal para compartir.'],
      ['¿El PDF se sube a algún servidor?', 'No. Las páginas se dibujan y convierten dentro de tu navegador.'],
    ],
  },
  {
    slug: 'pdf-a-word',
    tool: { kind: 'conv', id: 'pdf-word' },
    title: 'PDF a Word gratis: convertir PDF a DOCX editable | DocuSmart',
    description:
      'Convierte un PDF en un documento de Word (.docx) editable: conserva títulos, negritas, listas, tablas e imágenes. Gratis, sin registro y sin subir el archivo.',
    h1: 'PDF a Word',
    lead: 'Recupera un documento en Word a partir de su PDF para corregirlo o reutilizarlo, sin volver a escribirlo.',
    short: 'Documento editable (.docx)',
    howTo: 'Cómo convertir un PDF a Word en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Pulsa "Convertir y descargar".',
      'Abre el .docx en Word, Google Docs o LibreOffice y revisa el resultado.',
    ],
    faq: [
      ['¿Queda idéntico al PDF?', 'Muy parecido, pero no idéntico: un PDF no guarda párrafos ni tablas, solo letras con su posición, así que DocuSmart los reconstruye. Conserva títulos, negrita, cursiva, tamaños, listas, tablas sencillas e imágenes; diseños complejos (columnas, cuadros de texto) pueden variar.'],
      ['¿Funciona con PDF escaneados?', 'Un escaneo es una imagen sin texto. Pásalo primero por la herramienta OCR marcando "PDF buscable" y convierte ese PDF.'],
      ['¿Con qué programas abro el archivo?', 'Con Microsoft Word, Google Docs, LibreOffice, Pages o WPS: es un .docx estándar.'],
      ['¿Mis archivos se suben a internet?', 'No. La conversión se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'pdf-a-excel',
    tool: { kind: 'conv', id: 'pdf-excel' },
    title: 'PDF a Excel gratis: convertir tablas de PDF a XLSX | DocuSmart',
    description:
      'Convierte las tablas de un PDF en una hoja de Excel (.xlsx): columnas en su lugar y números listos para sumar. Ideal para extractos, facturas y reportes. Gratis y sin subir el archivo.',
    h1: 'PDF a Excel',
    lead: 'Pasa extractos bancarios, facturas o reportes en PDF a una hoja de cálculo para filtrarlos, sumarlos o graficarlos, sin copiar celda por celda.',
    short: 'Tablas a hoja de cálculo',
    howTo: 'Cómo convertir un PDF a Excel en 3 pasos',
    steps: [
      'Elige el PDF.',
      'Escoge si quieres una hoja por página o todo en una sola hoja, y pulsa "Convertir y descargar".',
      'Abre el .xlsx en Excel, Google Sheets o LibreOffice: los números ya se pueden sumar.',
    ],
    faq: [
      ['¿Con qué PDF funciona mejor?', 'Con PDF digitales que tienen tablas bien alineadas: extractos bancarios, facturas, reportes o listados exportados desde un sistema. DocuSmart arma las columnas según la posición del texto.'],
      ['¿Los números quedan como números?', 'Sí. Valores como 1.500.000, $ 2.000, 3,5 o 45 % se guardan como números de Excel con su formato, así que puedes sumarlos o usarlos en fórmulas.'],
      ['¿Funciona con PDF escaneados?', 'Un escaneo es una imagen sin texto. Pásalo primero por la herramienta OCR marcando "PDF buscable" y convierte ese PDF.'],
      ['¿Mis archivos se suben a internet?', 'No. La conversión se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'word-a-pdf',
    tool: { kind: 'conv', id: 'word-pdf' },
    title: 'Word a PDF gratis: convertir DOCX a PDF online | DocuSmart',
    description:
      'Convierte un documento de Word (.docx) en PDF desde el navegador: títulos, negritas, listas, tablas e imágenes. Gratis, sin registro y sin subir el archivo.',
    h1: 'Word a PDF',
    lead: 'Pasa tus documentos de Word a PDF para enviarlos o imprimirlos tal como deben verse, sin instalar nada.',
    short: 'Documento .docx a PDF',
    howTo: 'Cómo convertir Word a PDF en 3 pasos',
    steps: ['Elige el documento de Word (.docx).', 'Pulsa "Convertir y descargar".', 'Listo: el PDF se descarga con títulos, listas, tablas e imágenes.'],
    faq: [
      ['¿Queda igual que en Word?', 'Conserva el contenido y la estructura: títulos, negrita, cursiva, subrayado, listas, tablas, imágenes y saltos de página. La fuente y algunos detalles de diseño pueden variar, porque se usan fuentes estándar de PDF.'],
      ['¿Sirve con archivos .doc antiguos?', 'No: solo .docx (Word 2007 en adelante). Abre el .doc en Word y guárdalo como .docx.'],
      ['¿Mis documentos se suben a internet?', 'No. La conversión se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'excel-a-pdf',
    tool: { kind: 'conv', id: 'excel-pdf' },
    title: 'Excel a PDF gratis: convertir XLSX a PDF online | DocuSmart',
    description:
      'Convierte un libro de Excel (.xlsx) en PDF: cada hoja como una tabla, con encabezado repetido en cada página y página horizontal si hay muchas columnas. Gratis y sin subir el archivo.',
    h1: 'Excel a PDF',
    lead: 'Convierte tus hojas de cálculo en un PDF ordenado y fácil de leer o imprimir, hoja por hoja.',
    short: 'Hojas .xlsx a PDF',
    howTo: 'Cómo convertir Excel a PDF en 3 pasos',
    steps: ['Elige el libro de Excel (.xlsx).', 'Pulsa "Convertir y descargar".', 'Cada hoja queda como una tabla en el PDF, con su encabezado en cada página.'],
    faq: [
      ['¿Qué pasa si la hoja es muy ancha?', 'Con más de 6 columnas el PDF usa página horizontal, y con más de 10 una letra más pequeña, para que todo quepa.'],
      ['¿Se conservan los colores y las fórmulas?', 'Se conservan los valores (los resultados de las fórmulas), con los números alineados a la derecha. Los colores, bordes y gráficos de Excel no se incluyen.'],
      ['¿Mis archivos se suben a internet?', 'No. La conversión se hace dentro de tu navegador.'],
    ],
  },
  {
    slug: 'pdf-a-texto',
    tool: { kind: 'conv', id: 'pdf-txt' },
    title: 'Extraer texto de un PDF (PDF a TXT) gratis | DocuSmart',
    description:
      'Extrae el texto de un PDF y descárgalo como TXT o cópialo con un clic. Gratis, sin registro y sin subir el archivo.',
    h1: 'PDF a texto',
    lead: 'Saca el texto de un PDF para copiarlo, editarlo o buscarlo, sin volver a escribirlo.',
    short: 'Extrae el texto de un PDF',
    steps: [
      'Elige el PDF.',
      'Pulsa "Convertir y descargar": se genera un archivo .txt.',
      'También puedes ver el texto en pantalla y copiarlo con un clic.',
    ],
    faq: [
      ['¿Funciona con PDF escaneados?', 'Solo si el PDF ya tiene texto. Para fotos o escaneos sin texto usa la herramienta OCR de DocuSmart, que reconoce el texto de la imagen.'],
      ['¿Se mantiene el formato?', 'Se conserva el texto y los saltos de línea; el diseño visual (columnas, tablas) se convierte en texto plano.'],
      ['¿Es privado?', 'Sí. El archivo se lee en tu navegador y no se envía a ningún servidor.'],
    ],
  },
  {
    slug: 'crear-codigo-qr',
    tool: { kind: 'qr' },
    title: 'Crear y leer códigos QR gratis, también con contraseña | DocuSmart',
    description:
      'Genera códigos QR para enlaces o texto, protégelos con contraseña y léelos con la cámara o desde una imagen. Gratis y sin registro.',
    h1: 'Crear y leer códigos QR',
    lead: 'Genera un QR para un enlace o un texto, protégelo con contraseña si quieres, o lee uno con la cámara.',
    short: 'Genera y escanea QR',
    steps: [
      'Escribe el enlace o el texto y pulsa "Generar QR".',
      'Si es privado, elige "Protegido" y pon una contraseña: el contenido queda cifrado.',
      'Descarga el PNG, o usa "Leer QR" con la cámara o una imagen.',
    ],
    faq: [
      ['¿Qué es un QR protegido?', 'Un QR cuyo contenido está cifrado con AES-256: quien lo escanea necesita la contraseña para verlo.'],
      ['¿Puedo abrirlo en la app de DocuSmart?', 'Sí. Los QR protegidos de la web y de la app usan el mismo formato, así que funcionan en ambos.'],
      ['¿Se guarda lo que escaneo?', 'No. La imagen de la cámara se analiza en tu navegador y no se graba ni se envía a ningún lado.'],
    ],
  },
]
