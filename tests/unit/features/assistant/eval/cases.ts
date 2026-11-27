// Conjunto de evaluación del asistente (W-151.1): preguntas como las escribiría la gente de verdad
// (con errores, sin tildes, con el problema en vez del nombre de la herramienta), separadas por
// categoría. Es la línea base contra la que se comparan las capas nuevas del chatbot (W-151): el
// acierto de cada idioma está en baseline.json y el CI falla si baja.
//
// Distinto de ../questions.ts (preguntas directas, umbral fijo): aquí entran también las preguntas
// difíciles que hoy fallan, para medir cuánto mejora cada cambio.

/** herramienta: pide una herramienta · tramite: un trámite o un portal · error: algo salió mal ·
 *  nueva: herramientas recientes · general: sobre DocuSmart · fuera: fuera de tema (no debe responder) */
export type Category = 'herramienta' | 'tramite' | 'error' | 'nueva' | 'general' | 'fuera'
/** Pregunta, respuestas aceptadas (ids de la base; vacío = no debe responder con confianza) y categoría. */
export type EvalCase = [question: string, accepted: string[], category: Category]

/** La entrada principal de una herramienta y sus preguntas frecuentes, más otras entradas aceptadas. */
export const t = (slug: string, ...extra: string[]) => [`tool:${slug}`, ...[1, 2, 3, 4, 5].map((i) => `tool:${slug}:faq${i}`), ...extra]

export const EVAL_ES: EvalCase[] = [
  // Herramientas, dichas de muchas formas
  ['necesito juntar el pdf de la cedula con el del recibo', t('unir-pdf'), 'herramienta'],
  ['como pego dos pdf en uno solo', t('unir-pdf'), 'herramienta'],
  ['quiero sacar solo la pagina 3 de un pdf', [...t('dividir-pdf'), ...t('extraer-imagenes-pdf')], 'herramienta'],
  ['separar un pdf por hojas', t('dividir-pdf'), 'herramienta'],
  ['el escaneo quedo al reves', t('rotar-pdf'), 'herramienta'],
  ['cambiar el orden de las paginas', t('ordenar-paginas-pdf'), 'herramienta'],
  ['ponerle numero a las paginas', t('numerar-paginas-pdf'), 'herramienta'],
  ['poner una marca de agua que diga copia', [...t('marca-de-agua-pdf'), ...t('marca-de-agua-imagen'), 'marca-de-agua-imagen'], 'herramienta'],
  ['el pdf pesa 20 megas y necesito mandarlo por correo', t('comprimir-pdf'), 'herramienta'],
  ['hacer mas liviano un archivo pdf', t('comprimir-pdf'), 'herramienta'],
  ['ponerle clave a un documento', t('proteger-pdf'), 'herramienta'],
  ['me mandaron un pdf con contraseña y la se, como se la quito', [...t('desbloquear-pdf'), 'pdf-protegido'], 'herramienta'],
  ['firmar un contrato desde el celular', t('firmar-pdf'), 'herramienta'],
  ['quiero editar un pdf y cambiar una palabra', t('editar-pdf'), 'herramienta'],
  ['convertir un pdf en word para modificarlo', t('pdf-a-word'), 'herramienta'],
  ['pasar un documento de word a pdf', t('word-a-pdf'), 'herramienta'],
  ['pasar una tabla del pdf a excel', t('pdf-a-excel'), 'herramienta'],
  ['convertir una presentacion de power point a pdf', [...t('powerpoint-a-pdf'), 'powerpoint-a-pdf'], 'herramienta'],
  ['hacer un pdf con fotos del celular', t('imagen-a-pdf'), 'herramienta'],
  ['convertir cada pagina del pdf en imagen', t('pdf-a-jpg'), 'herramienta'],
  ['copiar el texto de un pdf escaneado', [...t('ocr-pdf'), ...t('pdf-a-texto')], 'herramienta'],
  ['escanear un documento sin escaner', t('escanear-documento'), 'herramienta'],
  ['llenar un formulario en pdf sin imprimirlo', t('llenar-formulario-pdf'), 'herramienta'],
  ['ver que cambio entre dos versiones de un contrato', [...t('comparar-pdf'), ...t('comparar-textos'), 'comparar-textos'], 'herramienta'],
  ['borrar mi numero de cedula de un pdf antes de enviarlo', t('censurar-pdf'), 'herramienta'],
  ['quitar los bordes blancos de un pdf', t('recortar-pdf'), 'herramienta'],
  ['achicar el tamaño de una foto', [...t('comprimir-imagen'), ...t('redimensionar-imagen')], 'herramienta'],
  ['cambiar el tamaño de una imagen a 1080 pixeles', t('redimensionar-imagen'), 'herramienta'],
  ['recortar una foto en cuadrado', t('recortar-imagen'), 'herramienta'],
  ['girar una foto que salio de lado', t('rotar-imagen'), 'herramienta'],
  ['pasar un jpg a png', t('jpg-a-png'), 'herramienta'],
  ['convertir una imagen a webp', t('imagen-a-webp'), 'herramienta'],
  ['hacer un zip con varios archivos', t('comprimir-archivos'), 'herramienta'],
  ['abrir un archivo rar', t('descomprimir-archivos'), 'herramienta'],
  ['crear un codigo qr para mi negocio', t('crear-codigo-qr'), 'herramienta'],
  ['leer un qr desde una foto', [...t('leer-codigo-qr'), 'qr-leer'], 'herramienta'],
  ['hacer un resumen de un pdf largo', t('resumir-pdf'), 'herramienta'],
  ['contar las palabras de un texto', [...t('contador-de-palabras'), 'contador-de-palabras'], 'herramienta'],
  ['generar una contraseña segura', [...t('generador-de-contrasenas'), 'generador-de-contrasenas'], 'herramienta'],
  ['sacar el hash sha256 de un archivo', [...t('calcular-hash'), 'hash'], 'herramienta'],

  // Trámites y portales
  ['el secop no me deja subir el pdf porque pesa mucho', t('comprimir-pdf'), 'tramite'],
  ['la dian me pide el pdf de menos de 2 mb', t('comprimir-pdf'), 'tramite'],
  ['me piden la cedula por ambas caras en un solo pdf', [...t('imagen-a-pdf'), ...t('escanear-documento'), ...t('unir-pdf')], 'tramite'],
  ['foto 3x4 fondo blanco para un documento', [...t('foto-tamano-documento'), 'foto-tamano-documento'], 'tramite'],
  ['foto para el pasaporte', [...t('foto-tamano-documento'), 'foto-tamano-documento'], 'tramite'],
  ['el juzgado me pide el documento en pdf/a', t('pdf-a-pdfa'), 'tramite'],
  ['hacer una cuenta de cobro', [...t('cuenta-de-cobro'), 'cuenta-de-cobro'], 'tramite'],
  ['necesito una cotizacion en pdf para un cliente', [...t('cuenta-de-cobro'), 'cuenta-de-cobro'], 'tramite'],
  ['hacer una hoja de vida para aplicar a un trabajo', [...t('hoja-de-vida'), 'hoja-de-vida'], 'tramite'],
  ['el formulario de la universidad pide una foto de maximo 200 kb', t('comprimir-imagen'), 'tramite'],
  ['subir la foto al portal de empleo y dice que es muy grande', [...t('comprimir-imagen'), ...t('redimensionar-imagen')], 'tramite'],
  ['el portal solo acepta jpg y tengo fotos del iphone', [...t('heic-a-jpg'), 'heic-a-jpg'], 'tramite'],

  // Errores frecuentes
  ['el pdf no abre dice que esta dañado', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['el pdf sale en blanco', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['no puedo abrir un pdf porque pide contraseña', [...t('desbloquear-pdf'), 'pdf-protegido'], 'error'],
  ['la pagina va muy lenta', ['lento'], 'error'],
  ['no se descarga el archivo', ['descarga'], 'error'],
  ['no me lee el qr', [...t('leer-codigo-qr'), 'qr-leer'], 'error'],
  ['la voz no suena al leer el pdf', ['voz-no-funciona'], 'error'],
  ['el archivo es muy grande y no carga', ['tamano', 'limites'], 'error'],
  ['no puedo abrir las fotos del iphone en el computador', [...t('heic-a-jpg'), 'heic-a-jpg'], 'error'],
  ['el video pesa mucho para whatsapp', [...t('comprimir-video'), 'comprimir-video'], 'error'],

  // Herramientas nuevas
  ['quitar el fondo de una foto', [...t('quitar-fondo'), 'quitar-fondo'], 'nueva'],
  ['pasar un audio de whatsapp a texto', [...t('audio-a-texto'), 'audio-a-texto'], 'nueva'],
  ['transcribir una grabacion de una reunion', [...t('audio-a-texto'), 'audio-a-texto'], 'nueva'],
  ['sacar el audio de un video en mp3', [...t('video-a-mp3'), 'video-a-mp3'], 'nueva'],
  ['cortar el inicio de un video', [...t('recortar-audio-video'), 'recortar-audio-video'], 'nueva'],
  ['convertir un video mov a mp4', [...t('convertir-video'), 'convertir-video'], 'nueva'],
  ['borrar la ubicacion gps de una foto', [...t('quitar-metadatos'), 'quitar-metadatos'], 'nueva'],
  ['convertir un csv a excel', [...t('csv-a-excel'), 'csv-a-excel'], 'nueva'],
  ['hacer un gif con varias fotos', [...t('imagen-a-gif'), 'imagen-a-gif'], 'nueva'],
  ['crear un icono ico para mi pagina', [...t('png-a-ico'), 'png-a-ico'], 'nueva'],
  ['copiar el texto de una captura de pantalla', [...t('imagen-a-texto'), 'imagen-a-texto'], 'nueva'],
  ['mejorar el brillo de una foto oscura', [...t('ajustar-imagen'), 'ajustar-imagen'], 'nueva'],

  // Sobre DocuSmart
  ['es gratis?', ['precio', 'premium'], 'general'],
  ['mis archivos se suben a algun servidor', ['privacidad'], 'general'],
  ['tengo que registrarme', ['sin-cuenta'], 'general'],
  ['funciona sin internet', ['offline'], 'general'],
  ['hay app para android', ['app-android'], 'general'],
  ['sirve en iphone', ['iphone'], 'general'],
  ['como instalo docusmart en el computador', ['desktop'], 'general'],
  ['cuanto cuesta premium', ['premium', 'precio'], 'general'],
  ['hay limite de archivos', ['limites', 'tamano'], 'general'],
  ['guardar el resultado en google drive', ['guardar-nube', 'nube-permisos'], 'general'],
  ['como los contacto', ['contacto'], 'general'],
  ['hola', ['hola'], 'general'],

  // Fuera de tema: no debe responder con confianza
  ['como esta el clima hoy', [], 'fuera'],
  ['cuanto es 15 por 23', [], 'fuera'],
  ['recomiendame una pelicula', [], 'fuera'],
  ['quien es el presidente de colombia', [], 'fuera'],
]

export const EVAL_EN: EvalCase[] = [
  ['i need to put my id and a receipt into one pdf', t('unir-pdf'), 'herramienta'],
  ['stick two pdfs together', t('unir-pdf'), 'herramienta'],
  ['take just page 3 out of a pdf', [...t('dividir-pdf'), ...t('extraer-imagenes-pdf')], 'herramienta'],
  ['the scan came out upside down', t('rotar-pdf'), 'herramienta'],
  ['change the page order', t('ordenar-paginas-pdf'), 'herramienta'],
  ['add page numbers', t('numerar-paginas-pdf'), 'herramienta'],
  ['my pdf is 20 mb and i need to email it', t('comprimir-pdf'), 'herramienta'],
  ['make a pdf file smaller', t('comprimir-pdf'), 'herramienta'],
  ['password protect a document', t('proteger-pdf'), 'herramienta'],
  ['i know the password, how do i remove it from the pdf', [...t('desbloquear-pdf'), 'pdf-protegido'], 'herramienta'],
  ['sign a contract on my phone', t('firmar-pdf'), 'herramienta'],
  ['change a word in a pdf', t('editar-pdf'), 'herramienta'],
  ['turn a pdf into an editable word file', t('pdf-a-word'), 'herramienta'],
  ['save a word document as pdf', t('word-a-pdf'), 'herramienta'],
  ['get a table from a pdf into excel', t('pdf-a-excel'), 'herramienta'],
  ['convert a powerpoint presentation to pdf', [...t('powerpoint-a-pdf'), 'powerpoint-a-pdf'], 'herramienta'],
  ['make a pdf from phone photos', t('imagen-a-pdf'), 'herramienta'],
  ['copy text from a scanned pdf', [...t('ocr-pdf'), ...t('pdf-a-texto')], 'herramienta'],
  ['scan a document without a scanner', t('escanear-documento'), 'herramienta'],
  ['fill in a pdf form without printing it', t('llenar-formulario-pdf'), 'herramienta'],
  ['black out my social security number in a pdf', t('censurar-pdf'), 'herramienta'],
  ['remove white margins from a pdf', t('recortar-pdf'), 'herramienta'],
  ['resize an image to 1080 pixels', t('redimensionar-imagen'), 'herramienta'],
  ['crop a photo into a square', t('recortar-imagen'), 'herramienta'],
  ['make a zip with several files', t('comprimir-archivos'), 'herramienta'],
  ['open a rar file', t('descomprimir-archivos'), 'herramienta'],
  ['create a qr code for my business', t('crear-codigo-qr'), 'herramienta'],
  ['summarize a long pdf', t('resumir-pdf'), 'herramienta'],
  ['count the words in an essay', [...t('contador-de-palabras'), 'contador-de-palabras'], 'herramienta'],
  ['generate a strong password', [...t('generador-de-contrasenas'), 'generador-de-contrasenas'], 'herramienta'],

  ['the portal says my pdf is too big to upload', t('comprimir-pdf'), 'tramite'],
  ['they want both sides of my id card in a single pdf', [...t('imagen-a-pdf'), ...t('escanear-documento'), ...t('unir-pdf')], 'tramite'],
  ['passport photo with white background', [...t('foto-tamano-documento'), 'foto-tamano-documento'], 'tramite'],
  ['the court requires pdf/a', t('pdf-a-pdfa'), 'tramite'],
  ['make an invoice for a client', [...t('cuenta-de-cobro'), 'cuenta-de-cobro'], 'tramite'],
  ['write a resume to apply for a job', [...t('hoja-de-vida'), 'hoja-de-vida'], 'tramite'],
  ['the form wants a photo under 200 kb', t('comprimir-imagen'), 'tramite'],
  ['the website only accepts jpg and my photos are from an iphone', [...t('heic-a-jpg'), 'heic-a-jpg'], 'tramite'],

  ['the pdf won\'t open, it says it is damaged', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['the pdf shows blank pages', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['the site is very slow', ['lento'], 'error'],
  ['the file does not download', ['descarga'], 'error'],
  ['no sound when reading the pdf aloud', ['voz-no-funciona'], 'error'],
  ['i can\'t open my iphone photos on my computer', [...t('heic-a-jpg'), 'heic-a-jpg'], 'error'],
  ['the video is too big for whatsapp', [...t('comprimir-video'), 'comprimir-video'], 'error'],

  ['remove the background from a photo', [...t('quitar-fondo'), 'quitar-fondo'], 'nueva'],
  ['transcribe a voice note to text', [...t('audio-a-texto'), 'audio-a-texto'], 'nueva'],
  ['extract the audio of a video as mp3', [...t('video-a-mp3'), 'video-a-mp3'], 'nueva'],
  ['trim the start of a video', [...t('recortar-audio-video'), 'recortar-audio-video'], 'nueva'],
  ['convert a mov video to mp4', [...t('convertir-video'), 'convertir-video'], 'nueva'],
  ['delete the gps location from a photo', [...t('quitar-metadatos'), 'quitar-metadatos'], 'nueva'],
  ['convert a csv to excel', [...t('csv-a-excel'), 'csv-a-excel'], 'nueva'],
  ['make a gif from several photos', [...t('imagen-a-gif'), 'imagen-a-gif'], 'nueva'],
  ['copy text from a screenshot', [...t('imagen-a-texto'), 'imagen-a-texto'], 'nueva'],

  ['is it free?', ['precio', 'premium'], 'general'],
  ['are my files uploaded to a server', ['privacidad'], 'general'],
  ['do i have to sign up', ['sin-cuenta'], 'general'],
  ['does it work without internet', ['offline'], 'general'],
  ['is there an android app', ['app-android'], 'general'],
  ['how do i install docusmart on my computer', ['desktop'], 'general'],
  ['save the result to google drive', ['guardar-nube', 'nube-permisos'], 'general'],
  ['hi', ['hola'], 'general'],

  ['what is the weather today', [], 'fuera'],
  ['what is 15 times 23', [], 'fuera'],
  ['recommend me a movie', [], 'fuera'],
  ['who is the president of the united states', [], 'fuera'],
]

/**
 * Grupo de control (W-151.2): preguntas escritas ANTES de mejorar la base y que no se usan para
 * ajustarla. Si mejoran junto con el resto, la mejora generaliza y no está hecha a la medida de
 * EVAL_ES/EVAL_EN. No agregues aquí preguntas que ya fallaron y se corrigieron.
 */
export const CONTROL_ES: EvalCase[] = [
  ['unir el pdf del rut con el de la camara de comercio', t('unir-pdf'), 'tramite'],
  ['el correo no me deja adjuntar el pdf porque es muy pesado', t('comprimir-pdf'), 'tramite'],
  ['la plataforma del colegio solo deja subir archivos de 1 mega', t('comprimir-pdf'), 'tramite'],
  ['me pidieron el pasaporte y la visa en un solo archivo', t('unir-pdf'), 'tramite'],
  ['escanear el carnet de vacunas', t('escanear-documento'), 'tramite'],
  ['el pdf se ve todo negro', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['el archivo pdf aparece corrupto', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['no me deja abrir el documento sin clave', [...t('desbloquear-pdf'), 'pdf-protegido'], 'error'],
  ['la foto quedo acostada', t('rotar-imagen'), 'herramienta'],
  ['pasar varias fotos a un solo pdf', t('imagen-a-pdf'), 'herramienta'],
  ['sacar una hoja de un pdf', t('dividir-pdf'), 'herramienta'],
  ['bajar la calidad de un pdf para que pese menos', t('comprimir-pdf'), 'herramienta'],
  ['quiero cambiar un dato en un pdf', t('editar-pdf'), 'herramienta'],
  ['convertir un pdf a imagenes jpg', t('pdf-a-jpg'), 'herramienta'],
  ['firmar con el dedo un pdf', t('firmar-pdf'), 'herramienta'],
  ['hacer un recibo de pago', [...t('cuenta-de-cobro'), 'cuenta-de-cobro'], 'tramite'],
  ['grabacion de voz a texto', [...t('audio-a-texto'), 'audio-a-texto'], 'nueva'],
  ['necesito pagar algo para usarlo', ['precio', 'premium'], 'general'],
  ['traduce este texto al ingles', [], 'fuera'],
  ['cuales son los mejores restaurantes de bogota', [], 'fuera'],
]

export const CONTROL_EN: EvalCase[] = [
  ['the email won\'t let me attach the pdf, it is too heavy', t('comprimir-pdf'), 'tramite'],
  ['the school portal only allows 1 mb uploads', t('comprimir-pdf'), 'tramite'],
  ['put my passport and visa in one file', t('unir-pdf'), 'tramite'],
  ['the pdf is all black', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['the pdf file seems corrupted', [...t('reparar-pdf'), 'pdf-danado'], 'error'],
  ['it asks for a password to open the document', [...t('desbloquear-pdf'), 'pdf-protegido'], 'error'],
  ['the photo is sideways', t('rotar-imagen'), 'herramienta'],
  ['turn several photos into one pdf', t('imagen-a-pdf'), 'herramienta'],
  ['remove one page from a pdf', t('dividir-pdf'), 'herramienta'],
  ['lower the quality of a pdf so it weighs less', t('comprimir-pdf'), 'herramienta'],
  ['convert a pdf into jpg images', t('pdf-a-jpg'), 'herramienta'],
  ['make a payment receipt', [...t('cuenta-de-cobro'), 'cuenta-de-cobro'], 'tramite'],
  ['voice recording to text', [...t('audio-a-texto'), 'audio-a-texto'], 'nueva'],
  ['do i have to pay to use it', ['precio', 'premium'], 'general'],
  ['translate this text into french', [], 'fuera'],
]
