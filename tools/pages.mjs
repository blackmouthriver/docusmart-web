// Páginas propias de cada herramienta (SEO). Fuente única de verdad:
// scripts/generate-tool-pages.mjs genera un HTML por entrada (/<slug>) y
// vite.config.ts las agrega al build. Para sumar una herramienta, agrégala aquí.
//
// tool: { kind: 'pdf', id: 'unir'|'dividir'|'rotar'|'reordenar'|'numerar'|'marca' }
//       { kind: 'conv', id: 'img-pdf'|'img-jpg'|'img-png'|'img-webp'|'img-bmp'|'pdf-img'|'pdf-txt' }
//       { kind: 'qr' }

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
      ['¿Funciona con PDF escaneados?', 'Solo si el PDF ya tiene texto. Para fotos o escaneos sin texto, la app de DocuSmart tiene OCR, que reconoce el texto de la imagen.'],
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
