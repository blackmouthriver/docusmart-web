// Guías ilustradas por herramienta (W-101), lote 1: ocho herramientas de PDF. Mismo formato que
// tools/guides.mjs. Se publican primero en español; cada idioma las suma al traducirlas.

import { TOOL_GUIDES_2 } from './guides-herramientas-2.mjs'
import { TOOL_GUIDES_3 } from './guides-herramientas-3.mjs'

const UPDATED = '2026-11-25'

export const TOOL_GUIDES = [
  {
    slug: 'dividir-pdf-en-varios-archivos',
    updated: UPDATED,
    title: 'Cómo dividir un PDF en varios archivos o sacar unas páginas | DocuSmart',
    description:
      'Separa un PDF por páginas, por rangos, cada N páginas, por marcadores o por tamaño, o saca solo las páginas que necesitas. Gratis y sin subir el archivo.',
    h1: 'Cómo dividir un PDF en varios archivos o sacar solo unas páginas',
    lead: 'Un portal pide solo la página de la firma, o un PDF de 80 páginas no entra en el correo. Así se separa un PDF en partes, o se sacan las páginas justas, desde el navegador.',
    minutes: 4,
    icon: 'split',
    tools: ['dividir-pdf', 'unir-pdf', 'comprimir-pdf'],
    sections: [
      {
        h2: 'Seis formas de dividir',
        body: [
          'Antes de empezar conviene saber qué necesitas, porque [Dividir PDF](/dividir-pdf) tiene un modo para cada caso:',
          { ul: [
            '**Elegir páginas**: tocas las miniaturas (o escribes "1-3, 5") y sale un PDF solo con esas páginas.',
            '**Por rangos**: varios rangos a la vez, y cada uno sale como un PDF aparte.',
            '**Cada N páginas**: partes iguales, por ejemplo de 10 en 10.',
            '**Por marcadores**: un PDF por cada capítulo, si el documento trae índice de marcadores.',
            '**Por tamaño**: partes que no pasan de un peso, para correos o portales con límite.',
            '**Cada página por separado**: un PDF por página.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Dividir PDF](/dividir-pdf) y elige el archivo. Verás sus páginas en miniatura. En "Elegir páginas", toca las que quieres llevarte: quedan marcadas en azul y el campo de arriba se llena solo.',
          'Pulsa el botón de abajo. Al terminar verás el resultado al lado del original para revisarlo, y lo descargas con el nombre que quieras. Si el modo genera varios archivos, los tienes uno por uno o todos juntos en un ZIP.',
          { tip: 'Para sacar páginas sueltas de varios PDF y juntarlas en uno solo, es más rápido [Unir PDF](/unir-pdf): ahí puedes elegir qué páginas tomar de cada archivo.' },
        ],
      },
      {
        h2: 'Si las partes siguen pesando mucho',
        body: [
          'Dividir no cambia la calidad: cada página se copia tal cual. Si una parte sigue pasando del límite, usa el modo **Por tamaño** o pásala por [Comprimir PDF](/comprimir-pdf). Una sola página escaneada a mucha resolución puede pesar más que el límite por sí sola: en ese caso lo que sirve es comprimirla.',
        ],
      },
      {
        h2: "Casos frecuentes",
        body: [
          { ul: [
            "Un portal pide solo tu documento por ambas caras: elige esas dos páginas y sube únicamente ese PDF.",
            "Un extracto de todo el año: si trae marcadores por mes, usa **Por marcadores**; si no, **Cada N páginas**.",
            "Un correo con límite de 10 MB: usa **Por tamaño**, pon 10 y cada parte queda por debajo.",
          ] },
        ],
      },
      {
        h2: 'Tu documento no sale del equipo',
        body: [
          'La división se hace en tu navegador: el PDF no se sube a ningún servidor. Por eso puedes usarla con extractos, historias clínicas o contratos sin dejar copias en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Dividir PDF', text: 'Entra a docusmart.online/dividir-pdf y elige el archivo.' },
      { name: 'Elige el modo', text: 'Elegir páginas, por rangos, cada N páginas, por marcadores, por tamaño o cada página por separado.' },
      { name: 'Marca las páginas', text: 'Toca las miniaturas o escribe los números (por ejemplo, 1-3, 5).' },
      { name: 'Divide y descarga', text: 'Pulsa el botón y descarga el resultado, o todos los archivos en un ZIP.' },
    ],
    faq: [
      ['¿Se pierde calidad al dividir?', 'No. Las páginas se copian tal cual, con su texto y sus imágenes originales.'],
      ['¿Puedo dividir un PDF con contraseña?', 'Si solo tiene restricciones (se abre sin contraseña), sí. Si pide contraseña para abrirse, quítasela primero con Desbloquear PDF.'],
      ['¿Qué pasa con los marcadores?', 'En el modo Por marcadores, cada capítulo del índice sale como un PDF con el nombre del marcador.'],
    ],
  },
  {
    slug: 'girar-paginas-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo girar las páginas de un PDF y guardarlas así | DocuSmart',
    description:
      'Endereza las páginas escaneadas de lado o al revés: gira una página o todas, 90° a la izquierda o a la derecha, y guarda el PDF ya derecho. Gratis y sin subirlo.',
    h1: 'Cómo girar las páginas de un PDF (y que queden así al guardarlo)',
    lead: 'Pasa mucho con los escaneos: una hoja horizontal quedó de lado, o una página salió al revés. Girarla en el visor no sirve, porque al enviarla vuelve a verse mal. Así se corrige en el archivo.',
    minutes: 3,
    icon: 'rotate',
    tools: ['rotar-pdf', 'ordenar-paginas-pdf', 'escanear-documento'],
    sections: [
      {
        h2: 'Por qué no basta con girarlo en el visor',
        body: [
          'Los visores de PDF dejan girar la vista, pero ese giro no se guarda en el archivo: quien lo reciba lo verá torcido otra vez. Para que quede bien hay que cambiar la orientación de la página en el propio PDF, que es lo que hace [Rotar PDF](/rotar-pdf).',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Rotar PDF](/rotar-pdf) y elige el archivo. Cada página aparece en miniatura con su giro actual debajo (0°, 90°…). Toca una página para girarla 90°, o usa las flechas de cada una para ir a la izquierda o a la derecha. Si todo el documento está de lado, usa "Todas a la izquierda" o "Todas a la derecha".',
          'Cuando todas se vean derechas, pulsa "Rotar PDF" y descarga el resultado. Solo cambia la orientación: el texto, las imágenes y la calidad quedan iguales.',
          { tip: 'Si además las páginas quedaron en desorden (pasa al escanear por los dos lados), sigue con [Ordenar páginas](/ordenar-paginas-pdf).' },
        ],
      },
      {
        h2: 'Escaneos que salen torcidos',
        body: [
          'Girar sirve para hojas de lado o al revés, en saltos de 90°. Si la foto quedó inclinada unos grados, es mejor volver a escanearla con [Escanear documento](/escanear-documento), que detecta los bordes de la hoja y la endereza sola.',
        ],
      },
      {
        h2: "Casos frecuentes",
        body: [
          "Al escanear a doble cara es común que el reverso salga al revés: toca esas páginas dos veces para girarlas 180°. En un informe con tablas horizontales, gira solo esas páginas para que se lean sin girar la cabeza; las demás quedan como están.",
          "Si el PDF viene de fotos del celular, revisa la orientación al crearlo: [Imagen a PDF](/imagen-a-pdf) tiene orientación automática, vertical u horizontal, y así no tendrás que girar después.",
        ],
      },
      {
        h2: 'Privado de principio a fin',
        body: [
          'El PDF se gira dentro de tu navegador. No se sube a ningún servidor y no queda guardado en ningún lado: cuando cierras la pestaña, desaparece. Funciona igual en el computador y en el celular, y una vez cargada la página no necesita buena señal.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Rotar PDF', text: 'Entra a docusmart.online/rotar-pdf y elige el PDF.' },
      { name: 'Gira las páginas', text: 'Toca cada página que esté de lado, o usa Todas a la izquierda o Todas a la derecha.' },
      { name: 'Guarda', text: 'Pulsa Rotar PDF y descarga el archivo ya derecho.' },
    ],
    faq: [
      ['¿Puedo girar solo una página?', 'Sí. Cada página se gira por separado; las demás quedan como estaban.'],
      ['¿Se pierde calidad?', 'No. Solo cambia la orientación de la página; el contenido no se vuelve a comprimir.'],
      ['¿Funciona en el celular?', 'Sí, en cualquier navegador moderno, en Android y en iPhone.'],
    ],
  },
  {
    slug: 'ordenar-paginas-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo cambiar el orden de las páginas de un PDF | DocuSmart',
    description:
      'Mueve las páginas de un PDF arrastrándolas, duplica una, agrega páginas en blanco o quita las que sobran, y guarda el nuevo orden. Gratis y sin subir el archivo.',
    h1: 'Cómo cambiar el orden de las páginas de un PDF',
    lead: 'Un escaneo a doble cara que salió intercalado, un anexo que tenía que ir al principio o una página repetida: así se ordena un PDF página por página.',
    minutes: 3,
    icon: 'reorder',
    tools: ['ordenar-paginas-pdf', 'unir-pdf', 'dividir-pdf'],
    sections: [
      {
        h2: 'Qué puedes hacer con cada página',
        body: [
          'En [Ordenar páginas](/ordenar-paginas-pdf) cada página es una tarjeta, y con ella puedes:',
          { ul: [
            '**Moverla**: arrastrándola a su lugar, o con las flechas de antes y después (más cómodo en el celular).',
            '**Duplicarla**: por ejemplo, para repetir una portada o una hoja de firmas.',
            '**Agregar una página en blanco** después de ella, para dejar espacio o separar secciones.',
            '**Quitarla** si sobra.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Ordenar páginas](/ordenar-paginas-pdf) y elige el PDF. Mueve las páginas hasta dejarlas como las necesitas: el número de cada tarjeta ("Pág. 2", "Pág. 1"…) te recuerda de dónde venía, así no te pierdes.',
          'Cuando el orden esté bien, pulsa "Aplicar nuevo orden" y descarga el PDF. Las páginas se copian tal cual: no cambian ni el texto ni la calidad.',
          { tip: 'Si las páginas que quieres ordenar están en varios archivos, primero únelos con [Unir PDF](/unir-pdf) y después ordénalos aquí.' },
        ],
      },
      {
        h2: 'Para sacar páginas, mejor dividir',
        body: [
          'Si lo que quieres es quedarte solo con algunas páginas, [Dividir PDF](/dividir-pdf) es más rápido: marcas las que te llevas y listo. Ordenar sirve cuando el documento completo se queda, pero en otro orden.',
        ],
      },
      {
        h2: "Casos frecuentes",
        body: [
          "Al escanear a doble cara en un equipo que no lo hace solo, primero salen todas las caras de adelante y después las de atrás. Para intercalarlas, mueve la última página detrás de la primera, la penúltima detrás de la tercera y así hasta el final: con las flechas se hace rápido.",
          { ul: [
            "Un anexo que tenía que ir al principio: muévelo antes de la primera página.",
            "Una hoja de firmas que va en dos lugares: duplícala y lleva la copia donde haga falta.",
            "Capítulos que deben empezar en página impar al imprimir a doble cara: agrega una página en blanco antes.",
          ] },
        ],
      },
      {
        h2: 'Sin subir tus archivos',
        body: [
          'El nuevo orden se arma en tu navegador. El documento no viaja por internet ni queda copia en ningún servidor. Por eso puedes ordenar con tranquilidad expedientes, historias clínicas o documentos de trabajo que no deberían salir de tu equipo.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Ordenar páginas', text: 'Entra a docusmart.online/ordenar-paginas-pdf y elige el PDF.' },
      { name: 'Mueve las páginas', text: 'Arrástralas o usa las flechas; duplica, agrega páginas en blanco o quita las que sobran.' },
      { name: 'Aplica y descarga', text: 'Pulsa Aplicar nuevo orden y descarga el PDF ordenado.' },
    ],
    faq: [
      ['¿Puedo ordenar desde el celular?', 'Sí. Además de arrastrar, cada página tiene flechas para moverla antes o después, que son más fáciles con el dedo.'],
      ['¿Se mantienen los enlaces y formularios?', 'Las páginas se copian con su contenido; revisa el resultado si el documento tiene formularios complejos.'],
      ['¿Hay un límite de páginas?', 'No hay un número fijo; con documentos muy grandes puede tardar un poco más en mostrar las miniaturas.'],
    ],
  },
  {
    slug: 'numerar-paginas-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo poner números de página a un PDF | DocuSmart',
    description:
      'Agrega números de página a un PDF: posición, formato "1", "1 / 10" o "Página 1 de 10", desde qué número empezar y sin numerar la portada. Gratis y sin subirlo.',
    h1: 'Cómo poner números de página a un PDF',
    lead: 'Una tesis, un informe o un expediente se revisan mucho mejor con las páginas numeradas. Así se numera un PDF que no tiene números, con el formato que te pidan.',
    minutes: 3,
    icon: 'hash',
    tools: ['numerar-paginas-pdf', 'unir-pdf', 'marca-de-agua-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Numerar páginas](/numerar-paginas-pdf) y elige el PDF. Elige dónde va el número (arriba o abajo, a la izquierda, al centro o a la derecha) y el formato: "1", "1 / 10" o "Página 1 de 10".',
          'Pulsa "Numerar páginas". Verás el antes y el después lado a lado, página por página, para revisar que el número no tape nada. Luego lo descargas.',
        ],
      },
      {
        h2: 'Opciones que resuelven casos comunes',
        body: [
          { ul: [
            '**Sin número en las primeras**: pon 1 para no numerar la portada, o más si hay índice o dedicatoria.',
            '**Empezar en**: para que la numeración siga la de otro documento, por ejemplo desde la 25.',
            '**Texto propio**: escribe por ejemplo "Folio {n}" o "{n} de {total}"; {n} es el número de la página y {total}, el último.',
            '**Tamaño y color**: pequeño, mediano o grande, y el color que quieras.',
          ] },
          { tip: 'Si el documento está repartido en varios archivos, únelos primero con [Unir PDF](/unir-pdf) para que la numeración sea continua.' },
        ],
      },
      {
        h2: 'Que el número no tape el contenido',
        body: [
          'Muchos documentos ya traen algo en el pie de página (un logo, una dirección). Si el número cae encima, cámbialo de esquina o súbelo arriba: el antes y el después te muestran cada página antes de descargar, y puedes pasar de una a otra con las flechas.',
        ],
      },
      {
        h2: "Numera al final",
        body: [
          "El número queda dibujado en cada página. Si después reordenas o agregas páginas, los números se mueven con ellas y dejan de ser correlativos. Por eso conviene numerar al final: primero une, ordena y quita lo que sobra, y numera la versión definitiva.",
          "En documentos para entidades o expedientes, donde se habla de folios, escribe \"Folio {n}\" en el texto. Y si el documento sigue la numeración de otro, ajusta \"Empezar en\".",
        ],
      },
      {
        h2: 'Todo en tu navegador',
        body: [
          'La numeración se agrega en tu equipo: el PDF no se sube a ningún servidor. El texto del documento sigue siendo texto: se puede buscar y copiar igual que antes, y el número también queda como texto, nítido al imprimir.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Numerar páginas', text: 'Entra a docusmart.online/numerar-paginas-pdf y elige el PDF.' },
      { name: 'Elige posición y formato', text: 'Por ejemplo, abajo a la derecha y "Página 1 de 10".' },
      { name: 'Ajusta lo que haga falta', text: 'Sin número en la portada, desde qué número empezar, tamaño y color.' },
      { name: 'Numera y descarga', text: 'Revisa el antes y el después y descarga el PDF numerado.' },
    ],
    faq: [
      ['¿Puedo no numerar la portada?', 'Sí. En "Sin número en las primeras" pon 1 (o las páginas que quieras saltar).'],
      ['¿Puedo empezar en otro número?', 'Sí. En "Empezar en" pones el primer número, por ejemplo 25.'],
      ['¿Se puede escribir "Folio" antes del número?', 'Sí. En el texto escribe "Folio {n}" y cada página mostrará su número en lugar de {n}.'],
    ],
  },
  {
    slug: 'poner-marca-de-agua-a-un-pdf',
    updated: UPDATED,
    title: 'Cómo poner una marca de agua a un PDF (texto o logo) | DocuSmart',
    description:
      'Agrega "CONFIDENCIAL", "COPIA" o tu logo a un PDF: posición, mosaico, ángulo, tamaño, opacidad y en qué páginas. Gratis, en el navegador y sin subir el archivo.',
    h1: 'Cómo poner una marca de agua a un PDF (texto o logo)',
    lead: 'Para enviar una propuesta como borrador, marcar una copia de tu cédula "Solo para trámite X" o poner tu logo en un catálogo: así se agrega una marca de agua a un PDF.',
    minutes: 3,
    icon: 'stamp',
    tools: ['marca-de-agua-pdf', 'proteger-pdf', 'numerar-paginas-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Marca de agua](/marca-de-agua-pdf) y elige el PDF. Escribe el texto (viene "CONFIDENCIAL" de ejemplo) o cambia a "Imagen o logo" para usar el tuyo.',
          'Pulsa "Aplicar marca de agua": verás el antes y el después lado a lado. Si quieres cambiar algo, ajústalo y vuelve a aplicarla; cuando te guste, descárgalo.',
        ],
      },
      {
        h2: 'Cómo ajustarla',
        body: [
          { ul: [
            '**Posición**: en el centro, en una esquina o en un borde, o en **mosaico** para que se repita en toda la página.',
            '**Rotación**: 0°, 45°, 90° o −45°. La diagonal es la más clásica y la más difícil de recortar.',
            '**Tamaño, opacidad y color**: una opacidad baja (20 %) deja leer el documento; más alta la hace más visible.',
            '**Encima o detrás del contenido**: detrás queda más discreta en documentos con mucho texto.',
            '**Páginas**: todas, o solo algunas (por ejemplo, 1-3, 5).',
          ] },
        ],
      },
      {
        h2: 'Una marca de agua para copias de documentos',
        body: [
          'Si te piden una copia de tu cédula o de un extracto, ponle una marca como "Solo para el trámite de arriendo, enero 2026" en mosaico. Así, si la copia termina en otro lado, se nota para qué la entregaste.',
          { tip: 'Si además quieres que no la puedan abrir sin una clave, después pásala por [Proteger PDF](/proteger-pdf).' },
        ],
      },
      {
        h2: "Ideas de texto",
        body: [
          { ul: [
            "\"BORRADOR\" para versiones que todavía no son definitivas.",
            "\"COPIA\" o \"COPIA CONTROLADA\" para documentos que se reparten.",
            "\"Solo para [trámite] — [fecha]\" en copias de documentos de identidad.",
            "\"MUESTRA\" en catálogos, plantillas o trabajos que todavía no se han pagado.",
          ] },
          "Para que se lea la marca sin estorbar el documento, una opacidad entre 15 % y 30 % suele funcionar bien. En mosaico, un tamaño pequeño o mediano se ve más limpio. Antes de descargar, revisa varias páginas en el antes y el después.",
        ],
      },
      {
        h2: 'Sin subir el documento',
        body: [
          'La marca se agrega dentro de tu navegador. El PDF no se sube a ningún servidor, algo importante justamente con los documentos que necesitan marca de agua: copias de identificaciones, propuestas comerciales o documentos internos.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Marca de agua', text: 'Entra a docusmart.online/marca-de-agua-pdf y elige el PDF.' },
      { name: 'Escribe el texto o elige tu logo', text: 'Por ejemplo, "CONFIDENCIAL" o "COPIA".' },
      { name: 'Ajusta posición y estilo', text: 'Centro o mosaico, ángulo, tamaño, opacidad, color y páginas.' },
      { name: 'Aplica y descarga', text: 'Revisa el antes y el después y descarga el PDF.' },
    ],
    faq: [
      ['¿Puedo usar mi logo?', 'Sí. Elige "Imagen o logo" y sube una imagen; un PNG con fondo transparente queda mejor.'],
      ['¿Se puede quitar después?', 'Queda dibujada en el PDF. Guarda el original sin marca por si lo necesitas otra vez.'],
      ['¿Puedo ponerla solo en algunas páginas?', 'Sí. En "Páginas" escribe cuáles, por ejemplo 1-3, 5.'],
    ],
  },
  {
    slug: 'editar-un-pdf-sin-programas',
    updated: UPDATED,
    title: 'Cómo editar un PDF sin instalar programas | DocuSmart',
    description:
      'Agrega o reemplaza texto, resalta, tapa, dibuja, pon flechas, imágenes y enlaces en un PDF desde el navegador, sin instalar nada y sin subir el archivo.',
    h1: 'Cómo editar un PDF sin instalar programas',
    lead: 'Corregir una fecha, completar un dato que faltó, resaltar una cláusula o tachar algo: para eso no hace falta un programa pago. Así se edita un PDF en el navegador.',
    minutes: 4,
    icon: 'edit',
    tools: ['editar-pdf', 'firmar-pdf', 'llenar-formulario-pdf'],
    sections: [
      {
        h2: 'Las herramientas del editor',
        body: [
          'Arriba de la página tienes una barra con todo lo que puedes agregar en [Editar PDF](/editar-pdf):',
          { ul: [
            '**Texto**: tocas la página donde quieres escribir y escribes en el cuadro de abajo; eliges letra, tamaño, negrita y color.',
            '**Reemplazar**: tocas un texto que ya tiene el PDF y lo cambias; el original se borra del documento, no solo se tapa.',
            '**Rectángulo, círculo, resaltar y tapar**: para marcar, subrayar o cubrir con blanco.',
            '**Dibujar, línea y flecha**: para señalar o hacer anotaciones a mano.',
            '**Imagen y enlace**: para pegar un sello o un logo, o enlazar a una página web o a otra página del PDF.',
          ] },
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Editar PDF](/editar-pdf) y elige el archivo. Elige "Texto" en la barra y toca la página donde va: aparece un cuadro que puedes mover, y escribes en el panel de abajo. Con "Seleccionar" tocas cualquier elemento para moverlo, cambiarle el tamaño o quitarlo.',
          'Si te equivocas, usa "Deshacer". Cuando termines, pulsa "Aplicar cambios" y descarga el PDF editado.',
          { tip: 'El texto admite cualquier alfabeto (latino, cirílico, griego, chino, japonés o coreano). Los emojis no se guardan en el PDF.' },
        ],
      },
      {
        h2: 'Para firmar o llenar formularios hay herramientas propias',
        body: [
          'Si lo que necesitas es firmar, [Firmar PDF](/firmar-pdf) te deja dibujar, escribir o subir tu firma y ponerla donde va. Y si el PDF tiene campos para llenar, [Llenar formulario](/llenar-formulario-pdf) los muestra uno por uno, más cómodo que escribir encima.',
        ],
      },
      {
        h2: "Consejos para que el cambio no se note",
        body: [
          "Para corregir un texto que ya está en el documento, usa **Reemplazar**: borra el original y pone el nuevo en su lugar. Si solo tapas con un cuadro blanco, el texto viejo sigue en el archivo.",
          "Elige la letra más parecida a la del documento (Sans, Serif o Mono) y ajusta el tamaño hasta que coincida. En el celular, mueve los elementos con calma: también puedes cambiar su posición desde el teclado con las flechas.",
        ],
      },
      {
        h2: 'Tu archivo se queda contigo',
        body: [
          'Todo el editor funciona dentro de tu navegador: el PDF no se sube a ningún servidor, ni mientras lo editas ni al guardarlo.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Editar PDF', text: 'Entra a docusmart.online/editar-pdf y elige el archivo.' },
      { name: 'Elige qué agregar', text: 'Texto, reemplazar, formas, resaltado, dibujo, flechas, imagen o enlace.' },
      { name: 'Colócalo en la página', text: 'Toca la página, escribe o dibuja, y muévelo con Seleccionar.' },
      { name: 'Aplica y descarga', text: 'Pulsa Aplicar cambios y descarga el PDF editado.' },
    ],
    faq: [
      ['¿Puedo cambiar un texto que ya tiene el PDF?', 'Sí, con "Reemplazar": tocas el texto, escribes el nuevo y el original se borra del documento.'],
      ['¿Funciona con PDF escaneados?', 'Puedes agregar texto, formas y dibujos encima. Para reemplazar texto, el PDF tiene que tener texto real; si es una foto, primero pásalo por OCR.'],
      ['¿Necesito instalar algo?', 'No. Funciona en el navegador del computador o del celular.'],
    ],
  },
  {
    slug: 'comparar-dos-versiones-de-un-pdf',
    updated: UPDATED,
    title: 'Cómo comparar dos versiones de un PDF y ver qué cambió | DocuSmart',
    description:
      'Compara dos PDF y mira qué palabras se agregaron o quitaron, o compáralos página por página para ver cambios en imágenes y diseño. Gratis y sin subirlos.',
    h1: 'Cómo comparar dos versiones de un PDF y ver qué cambió',
    lead: 'Te devuelven un contrato "con unos ajustes" y no dicen cuáles. Leerlo dos veces buscando diferencias es lento y se escapan cosas. Así se comparan dos versiones en segundos.',
    minutes: 3,
    icon: 'compare',
    tools: ['comparar-pdf', 'editar-pdf', 'firmar-pdf'],
    sections: [
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Comparar PDF](/comparar-pdf). Elige primero el **original** y después la **nueva versión**. Si los pusiste al revés, el botón "Intercambiar" los cambia de lugar.',
          'Pulsa "Comparar". Arriba verás cuántas palabras se agregaron y cuántas se quitaron, y debajo cada cambio con su página: lo quitado tachado en rojo y lo agregado en verde, con unas líneas de contexto para ubicarlo.',
        ],
      },
      {
        h2: 'Texto o visual',
        body: [
          { ul: [
            '**Texto**: compara las palabras. Es lo mejor para contratos, cartas e informes. Puedes ignorar mayúsculas y puntuación para que no cuenten como cambios.',
            '**Visual (página por página)**: compara cómo se ve cada página. Sirve para planos, diseños o documentos escaneados, donde los cambios pueden ser imágenes o tablas y no solo texto.',
          ] },
          { tip: 'En un contrato, revisa sobre todo los cambios en valores, fechas y nombres: la comparación los muestra aunque sean de un solo número.' },
        ],
      },
      {
        h2: 'Después de comparar',
        body: [
          'Si encontraste algo que corregir, puedes hacerlo con [Editar PDF](/editar-pdf). Y cuando las dos partes estén de acuerdo, firma la versión final con [Firmar PDF](/firmar-pdf).',
        ],
      },
      {
        h2: "Qué muestra y qué no",
        body: [
          "Cada cambio aparece con su número de página y con las líneas de alrededor, para ubicarlo rápido en el documento. Si un párrafo completo se movió de lugar sin cambiar, se marca como movido en vez de contarlo como quitado y agregado.",
          "Si los dos archivos no tienen casi nada en común (por ejemplo, elegiste un documento equivocado), la herramienta lo avisa en vez de mostrar cientos de cambios. Y si son idénticos, también te lo dice, incluso cuando tienen distinta cantidad de páginas.",
          "Sirve para contratos, cotizaciones, reglamentos, propuestas que pasan por varias manos o la tesis que vuelve con correcciones del tutor: en todos esos casos, saber exactamente qué cambió ahorra una relectura completa.",
        ],
      },
      {
        h2: 'Tus documentos no se suben',
        body: [
          'Los dos PDF se comparan en tu navegador: ninguno se sube a un servidor. Puedes usarlo con contratos y documentos confidenciales con tranquilidad, porque ninguna de las dos versiones queda guardada en otro lado.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Comparar PDF', text: 'Entra a docusmart.online/comparar-pdf.' },
      { name: 'Elige los dos archivos', text: 'Primero el original y después la nueva versión.' },
      { name: 'Elige cómo comparar', text: 'Texto (palabras) o Visual (página por página).' },
      { name: 'Revisa los cambios', text: 'Lo quitado sale tachado en rojo y lo agregado en verde, con su página.' },
    ],
    faq: [
      ['¿Compara PDF escaneados?', 'En modo Visual sí, porque compara cómo se ve cada página. El modo Texto necesita que el PDF tenga texto real.'],
      ['¿Importa el orden de los archivos?', 'Sí: lo que está en la nueva versión y no en el original sale como agregado. Si te equivocaste, usa Intercambiar.'],
      ['¿Se puede ignorar si cambió una mayúscula o una coma?', 'Sí. Marca "Ignorar mayúsculas" o "Ignorar puntuación".'],
    ],
  },
  {
    slug: 'tapar-datos-personales-en-un-pdf',
    updated: UPDATED,
    title: 'Cómo tapar datos personales en un PDF (de verdad) | DocuSmart',
    description:
      'Censura números de documento, cuentas, correos o nombres en un PDF: búscalos y márcalos en todas las páginas y se eliminan del archivo, no solo se tapan.',
    h1: 'Cómo tapar datos personales en un PDF (de verdad)',
    lead: 'Antes de compartir un extracto, un contrato o una historia clínica, muchas veces hay que ocultar números de cuenta o de documento. Poner un cuadro negro encima no basta: así se hace bien.',
    minutes: 4,
    icon: 'redact',
    tools: ['censurar-pdf', 'proteger-pdf', 'marca-de-agua-pdf'],
    sections: [
      {
        h2: 'Por qué un cuadro negro no alcanza',
        body: [
          'Si en un editor común pones un rectángulo negro sobre un número, el número sigue en el archivo: basta con seleccionarlo y copiarlo, o abrir el PDF con otro programa, para leerlo. Censurar de verdad es **eliminar** lo que está debajo, y eso es lo que hace [Censurar PDF](/censurar-pdf).',
        ],
      },
      {
        h2: 'Paso a paso',
        body: [
          'Abre [Censurar PDF](/censurar-pdf) y elige el archivo. Puedes buscar un nombre, un número o una palabra y se marca en todas las páginas a la vez. También puedes marcar de una vez todos los **correos** o todos los **números** (cédulas, teléfonos, cuentas), o arrastrar sobre la página para tapar una zona a mano.',
          'Revisa cada página: tocando una zona la mueves o la quitas. Cuando esté todo, pulsa "Censurar PDF" y descarga el resultado.',
          { tip: 'Las páginas con zonas marcadas se convierten en imagen para que lo tapado desaparezca del archivo. El resto del texto de esas páginas se sigue pudiendo buscar y copiar.' },
        ],
      },
      {
        h2: 'Revisa antes de enviar',
        body: [
          'La búsqueda encuentra lo que está escrito como texto. Si una parte del documento es una foto o un escaneo, los datos que aparezcan ahí no salen en la búsqueda: márcalos a mano arrastrando sobre la página. Y guarda el original aparte, porque lo censurado no se puede recuperar.',
          'Si el documento va a quedar en manos de otros, puedes además ponerle una contraseña con [Proteger PDF](/proteger-pdf) o una [marca de agua](/marca-de-agua-pdf) que diga para qué lo entregaste.',
        ],
      },
      {
        h2: "Qué suele haber que tapar",
        body: [
          { ul: [
            "Números de documento de identidad y de cuentas bancarias.",
            "Direcciones, teléfonos y correos.",
            "Firmas y fotos de documentos.",
            "Datos de salud, sueldos o información de terceros.",
          ] },
        ],
      },
      {
        h2: 'Sin subir el documento',
        body: [
          'Todo el proceso ocurre en tu navegador: el documento con los datos sin tapar nunca sale de tu equipo. Es justamente lo que conviene al censurar: si subieras el original a un servicio en línea para taparlo, los datos ya habrían salido de tus manos.',
        ],
      },
    ],
    steps: [
      { name: 'Abre Censurar PDF', text: 'Entra a docusmart.online/censurar-pdf y elige el archivo.' },
      { name: 'Marca lo que hay que ocultar', text: 'Busca un texto, marca todos los correos o números, o arrastra sobre la página.' },
      { name: 'Revisa cada página', text: 'Toca una zona para moverla o quitarla.' },
      { name: 'Censura y descarga', text: 'Pulsa Censurar PDF: lo tapado se elimina del archivo.' },
    ],
    faq: [
      ['¿Se puede recuperar lo censurado?', 'No. Lo que tapas se elimina del archivo; por eso conviene guardar el original aparte.'],
      ['¿Sirve con PDF escaneados?', 'Sí, marcando las zonas a mano. La búsqueda automática solo encuentra lo que está escrito como texto.'],
      ['¿El resto del documento se puede seguir buscando?', 'Sí. Solo las páginas con zonas marcadas se convierten en imagen, y su texto restante se conserva para buscar y copiar.'],
    ],
  },
]

// Lote 2 (tools/guides-herramientas-2.mjs).
TOOL_GUIDES.push(...TOOL_GUIDES_2)
// Lote 3 (tools/guides-herramientas-3.mjs).
TOOL_GUIDES.push(...TOOL_GUIDES_3)
