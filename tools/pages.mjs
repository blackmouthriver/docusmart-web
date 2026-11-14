// Páginas propias de cada herramienta (SEO). Fuente única de verdad:
// scripts/generate-tool-pages.mjs genera un HTML por entrada (/<slug>) y
// vite.config.ts las agrega al build. Para sumar una herramienta, agrégala aquí.
//
// tool: { kind: 'pdf', id: 'unir'|'dividir'|'rotar'|'reordenar'|'numerar'|'marca'|'comprimir'|'proteger'|'desbloquear'|'reparar'|'ocr'|'recortar'|'firmar'|'censurar' }
//       { kind: 'conv', id: 'img-pdf'|'img-jpg'|'img-png'|'img-webp'|'img-bmp'|'pdf-img'|'pdf-txt' }
//       { kind: 'qr' }
//       { kind: 'archive', id: 'crear'|'extraer' }

export const SITE = 'https://docusmart.online'

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
