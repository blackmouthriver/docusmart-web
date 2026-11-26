// Capturas dentro de cada guía (W-100). `section` es el índice de la sección y `after` el bloque
// tras el cual va la imagen (las traducciones tienen las mismas secciones y bloques que el
// español). `shot` es <herramienta>/<paso> de tools/guide-shots.mjs. `alt` describe lo que se ve
// (no "imagen de…") en los 12 idiomas.

export const GUIDE_IMAGES = {
  'unir-pdf-en-el-celular': [
    {
      section: 2,
      after: 0,
      shot: 'unir-pdf/lista',
      alt: {
        es: 'Unir PDF con tres archivos en la lista (contrato, recibo y formulario), flechas para cambiar el orden y el botón Unir 3 PDFs.',
        en: 'Merge PDF with three files in the list (contract, receipt and form), arrows to change the order and the Merge 3 PDFs button.',
        pt: 'Juntar PDF com três arquivos na lista (contrato, recibo e formulário), setas para mudar a ordem e o botão para juntar os 3 PDFs.',
        fr: "Fusionner PDF avec trois fichiers dans la liste (contrat, reçu et formulaire), des flèches pour changer l'ordre et le bouton pour fusionner les 3 PDF.",
        it: "Unisci PDF con tre file nell'elenco (contratto, ricevuta e modulo), frecce per cambiare l'ordine e il pulsante per unire i 3 PDF.",
        de: 'PDF zusammenfügen mit drei Dateien in der Liste (Vertrag, Quittung und Formular), Pfeilen zum Umsortieren und der Schaltfläche zum Zusammenfügen der 3 PDFs.',
        ca: "Unir PDF amb tres fitxers a la llista (contracte, rebut i formulari), fletxes per canviar l'ordre i el botó per unir els 3 PDF.",
        eu: 'PDFak elkartu tresna zerrendan hiru fitxategirekin (kontratua, ordainagiria eta inprimakia), ordena aldatzeko geziekin eta 3 PDFak elkartzeko botoiarekin.',
        ru: 'Объединение PDF: в списке три файла (договор, квитанция и анкета), стрелки для изменения порядка и кнопка объединения 3 PDF.',
        ja: 'PDF 結合ツール。リストに 3 つのファイル（契約書・領収書・申込書）があり、順番を変える矢印と 3 つの PDF を結合するボタンがあります。',
        ko: 'PDF 병합 도구. 목록에 파일 세 개(계약서, 영수증, 신청서)가 있고, 순서를 바꾸는 화살표와 PDF 3개를 병합하는 버튼이 있습니다.',
        zh: '合并 PDF：列表中有三个文件（合同、收据和表格），有调整顺序的箭头和合并 3 个 PDF 的按钮。',
      },
    },
    {
      section: 2,
      after: 1,
      shot: 'unir-pdf/resultado',
      alt: {
        es: 'Resultado de Unir PDF: a la izquierda los tres PDF elegidos y a la derecha el PDF unido de 6 páginas, con el nombre del archivo y el botón Descargar.',
        en: 'Merge PDF result: the three chosen PDFs on the left and the merged 6-page PDF on the right, with the file name and the Download button.',
        pt: 'Resultado de Juntar PDF: à esquerda os três PDFs escolhidos e à direita o PDF unido de 6 páginas, com o nome do arquivo e o botão Baixar.',
        fr: 'Résultat de la fusion : à gauche les trois PDF choisis et à droite le PDF fusionné de 6 pages, avec le nom du fichier et le bouton Télécharger.',
        it: 'Risultato di Unisci PDF: a sinistra i tre PDF scelti e a destra il PDF unito di 6 pagine, con il nome del file e il pulsante Scarica.',
        de: 'Ergebnis: links die drei gewählten PDFs, rechts das zusammengefügte PDF mit 6 Seiten, darunter der Dateiname und die Schaltfläche Herunterladen.',
        ca: "Resultat d'Unir PDF: a l'esquerra els tres PDF triats i a la dreta el PDF unit de 6 pàgines, amb el nom del fitxer i el botó Baixa.",
        eu: 'Emaitza: ezkerrean aukeratutako hiru PDFak eta eskuinean 6 orriko PDF elkartua, fitxategiaren izenarekin eta Deskargatu botoiarekin.',
        ru: 'Результат объединения: слева три выбранных PDF, справа объединённый PDF на 6 страниц, имя файла и кнопка «Скачать».',
        ja: '結合の結果。左に選んだ 3 つの PDF、右に結合された 6 ページの PDF があり、ファイル名とダウンロードボタンが表示されています。',
        ko: '병합 결과. 왼쪽에 고른 PDF 세 개, 오른쪽에 6페이지로 합쳐진 PDF가 있고 파일 이름과 다운로드 버튼이 보입니다.',
        zh: '合并结果：左侧是选择的三个 PDF，右侧是合并后的 6 页 PDF，下方是文件名和下载按钮。',
      },
    },
  ],
  'pasar-fotos-a-pdf': [
    {
      section: 1,
      after: 0,
      shot: 'imagen-a-pdf/fotos',
      alt: {
        es: 'Imagen a PDF con dos fotos de documentos en la lista y las opciones de tamaño de página, orientación y márgenes.',
        en: 'Image to PDF with two document photos in the list and the page size, orientation and margin options.',
        pt: 'Imagem para PDF com duas fotos de documentos na lista e as opções de tamanho da página, orientação e margens.',
        fr: "Image en PDF avec deux photos de documents dans la liste et les options de format de page, d'orientation et de marges.",
        it: "Immagine in PDF con due foto di documenti nell'elenco e le opzioni di formato pagina, orientamento e margini.",
        de: 'Bild zu PDF mit zwei Dokumentfotos in der Liste und den Optionen für Seitenformat, Ausrichtung und Ränder.',
        ca: 'Imatge a PDF amb dues fotos de documents a la llista i les opcions de mida de pàgina, orientació i marges.',
        eu: 'Irudia PDFra, zerrendan dokumentuen bi argazkirekin eta orri-tamaina, orientazio eta marjinen aukerekin.',
        ru: 'Изображение в PDF: в списке две фотографии документов и настройки размера страницы, ориентации и полей.',
        ja: '画像を PDF に変換。リストに書類の写真が 2 枚あり、ページサイズ・向き・余白のオプションがあります。',
        ko: '이미지를 PDF로. 목록에 문서 사진 두 장이 있고 페이지 크기, 방향, 여백 옵션이 있습니다.',
        zh: '图片转 PDF：列表中有两张文件照片，还有页面大小、方向和页边距选项。',
      },
    },
  ],
  'reducir-tamano-pdf': [
    {
      section: 2,
      after: 0,
      shot: 'comprimir-pdf/resultado',
      alt: {
        es: 'Comprimir PDF terminado: un escaneo pasa de 180 KB a 62 KB (66 % menos), con la vista previa de las dos versiones lado a lado.',
        en: 'Compress PDF done: a scan goes from 180 KB to 62 KB (66% smaller), with a side-by-side preview of both versions.',
        pt: 'Comprimir PDF concluído: um escaneamento passa de 180 KB para 62 KB (66% menos), com a prévia das duas versões lado a lado.',
        fr: "Compression terminée : un scan passe de 180 Ko à 62 Ko (66 % de moins), avec l'aperçu des deux versions côte à côte.",
        it: "Compressione completata: una scansione passa da 180 KB a 62 KB (66% in meno), con l'anteprima delle due versioni affiancate.",
        de: 'PDF komprimiert: ein Scan schrumpft von 180 KB auf 62 KB (66 % kleiner), mit beiden Versionen nebeneinander in der Vorschau.',
        ca: "Compressió acabada: un escaneig passa de 180 KB a 62 KB (66 % menys), amb la previsualització de les dues versions una al costat de l'altra.",
        eu: 'PDFa konprimatuta: eskaneatu bat 180 KBtik 62 KBra pasatzen da (% 66 gutxiago), bi bertsioen aurrebista elkarren ondoan.',
        ru: 'Сжатие готово: скан уменьшился со 180 КБ до 62 КБ (на 66 %), обе версии показаны рядом для сравнения.',
        ja: '圧縮完了。スキャンした PDF が 180 KB から 62 KB（66% 減）になり、2 つの版のプレビューが並んで表示されています。',
        ko: '압축 완료. 스캔 PDF가 180KB에서 62KB로(66% 감소) 줄었고, 두 버전의 미리보기가 나란히 보입니다.',
        zh: '压缩完成：扫描件从 180 KB 变为 62 KB（减少 66%），两个版本的预览并排显示。',
      },
    },
  ],
  'firmar-pdf-sin-imprimir': [
    {
      section: 1,
      after: 0,
      shot: 'firmar-pdf/firma',
      alt: {
        es: 'Firmar PDF: la firma dibujada a mano en el recuadro, con la opción de color y el botón Usar esta firma.',
        en: 'Sign PDF: the signature drawn by hand in the box, with the colour option and the Use this signature button.',
        pt: 'Assinar PDF: a assinatura desenhada à mão no quadro, com a opção de cor e o botão Usar esta assinatura.',
        fr: "Signer un PDF : la signature dessinée à la main dans le cadre, avec l'option de couleur et le bouton pour utiliser cette signature.",
        it: "Firma PDF: la firma disegnata a mano nel riquadro, con l'opzione del colore e il pulsante Usa questa firma.",
        de: 'PDF unterschreiben: die von Hand gezeichnete Unterschrift im Feld, mit der Farbwahl und der Schaltfläche zum Übernehmen der Unterschrift.',
        ca: "Signar PDF: la signatura dibuixada a mà al requadre, amb l'opció de color i el botó per fer servir aquesta signatura.",
        eu: 'PDFa sinatu: eskuz marraztutako sinadura laukian, kolore-aukerarekin eta sinadura hau erabiltzeko botoiarekin.',
        ru: 'Подписать PDF: подпись, нарисованная от руки в поле, выбор цвета и кнопка «Использовать эту подпись».',
        ja: 'PDF に署名。枠の中に手書きした署名と、色の選択、この署名を使うボタンがあります。',
        ko: 'PDF 서명. 상자에 손으로 그린 서명과 색상 선택, 이 서명 사용 버튼이 있습니다.',
        zh: '签署 PDF：方框中是手写的签名，还有颜色选项和“使用此签名”按钮。',
      },
    },
    {
      section: 1,
      after: 1,
      shot: 'firmar-pdf/colocar',
      alt: {
        es: 'La firma colocada abajo a la derecha de la primera página del PDF, con su marco para moverla, cambiarle el tamaño o quitarla.',
        en: "The signature placed at the bottom right of the PDF's first page, with a frame to move it, resize it or remove it.",
        pt: 'A assinatura colocada no canto inferior direito da primeira página do PDF, com uma moldura para movê-la, mudar o tamanho ou removê-la.',
        fr: 'La signature placée en bas à droite de la première page du PDF, avec un cadre pour la déplacer, la redimensionner ou la retirer.',
        it: 'La firma posizionata in basso a destra della prima pagina del PDF, con una cornice per spostarla, ridimensionarla o rimuoverla.',
        de: 'Die Unterschrift unten rechts auf der ersten Seite des PDFs, mit einem Rahmen zum Verschieben, Vergrößern oder Entfernen.',
        ca: 'La signatura col·locada a baix a la dreta de la primera pàgina del PDF, amb un marc per moure-la, canviar-ne la mida o treure-la.',
        eu: 'Sinadura PDFaren lehen orriaren beheko eskuinaldean, mugitzeko, tamaina aldatzeko edo kentzeko markoarekin.',
        ru: 'Подпись внизу справа на первой странице PDF, с рамкой, чтобы переместить её, изменить размер или удалить.',
        ja: 'PDF の 1 ページ目の右下に置いた署名。枠で移動、サイズ変更、削除ができます。',
        ko: 'PDF 첫 페이지 오른쪽 아래에 놓인 서명. 테두리로 옮기거나 크기를 바꾸거나 지울 수 있습니다.',
        zh: '签名放在 PDF 第一页的右下角，带有可移动、调整大小或删除的边框。',
      },
    },
  ],
  'escanear-documentos-con-el-celular': [
    {
      section: 1,
      after: 1,
      shot: 'escanear-documento/bordes',
      alt: {
        es: 'Escanear documento: foto de una hoja sobre una mesa con las cuatro esquinas detectadas y los filtros Documento, B/N, Gris y Color.',
        en: 'Scan document: photo of a sheet on a table with its four corners detected and the Document, B/W, Grey and Colour filters.',
        pt: 'Escanear documento: foto de uma folha sobre uma mesa com os quatro cantos detectados e os filtros Documento, P&B, Cinza e Cor.',
        fr: "Numériser un document : photo d'une feuille sur une table avec ses quatre coins détectés et les filtres Document, N/B, Gris et Couleur.",
        it: 'Scansiona documento: foto di un foglio su un tavolo con i quattro angoli rilevati e i filtri Documento, B/N, Grigio e Colore.',
        de: 'Dokument scannen: Foto eines Blatts auf einem Tisch mit den vier erkannten Ecken und den Filtern Dokument, S/W, Grau und Farbe.',
        ca: "Escanejar document: foto d'un full sobre una taula amb les quatre cantonades detectades i els filtres Document, B/N, Gris i Color.",
        eu: 'Dokumentua eskaneatu: mahai gaineko orri baten argazkia, lau ertzak hautemanda eta Dokumentua, Z/B, Grisa eta Kolorea iragazkiekin.',
        ru: 'Сканирование документа: фото листа на столе с найденными четырьмя углами и фильтрами «Документ», «Ч/Б», «Серый» и «Цвет».',
        ja: '書類のスキャン。机の上の紙の写真で 4 つの角が検出され、書類・白黒・グレー・カラーのフィルターがあります。',
        ko: '문서 스캔. 책상 위 종이 사진에서 네 모서리가 감지되었고 문서, 흑백, 회색, 컬러 필터가 있습니다.',
        zh: '扫描文件：桌上一张纸的照片，已检测出四个角，并有文档、黑白、灰度和彩色滤镜。',
      },
    },
  ],
  'proteger-pdf-con-contrasena': [
    {
      section: 1,
      after: 0,
      shot: 'proteger-pdf/clave',
      alt: {
        es: 'Proteger PDF: la contraseña escrita dos veces (oculta con puntos), los permisos de imprimir, copiar y modificar, y el botón Proteger PDF.',
        en: 'Protect PDF: the password typed twice (hidden with dots), the print, copy and edit permissions, and the Protect PDF button.',
        pt: 'Proteger PDF: a senha digitada duas vezes (oculta com pontos), as permissões de imprimir, copiar e modificar e o botão Proteger PDF.',
        fr: "Protéger un PDF : le mot de passe saisi deux fois (masqué par des points), les autorisations d'imprimer, copier et modifier, et le bouton Protéger le PDF.",
        it: 'Proteggi PDF: la password scritta due volte (nascosta da puntini), i permessi di stampa, copia e modifica e il pulsante Proteggi PDF.',
        de: 'PDF schützen: das zweimal eingegebene Passwort (als Punkte verborgen), die Rechte zum Drucken, Kopieren und Ändern und die Schaltfläche PDF schützen.',
        ca: "Protegir PDF: la contrasenya escrita dues vegades (amagada amb punts), els permisos d'imprimir, copiar i modificar, i el botó Protegeix el PDF.",
        eu: 'PDFa babestu: pasahitza bi aldiz idatzita (puntuekin ezkutatuta), inprimatu, kopiatu eta aldatzeko baimenak eta PDFa babesteko botoia.',
        ru: 'Защита PDF: пароль, введённый дважды (скрыт точками), разрешения на печать, копирование и изменение и кнопка «Защитить PDF».',
        ja: 'PDF の保護。2 回入力したパスワード（点で隠れています）、印刷・コピー・変更の許可、PDF を保護するボタンがあります。',
        ko: 'PDF 보호. 두 번 입력한 비밀번호(점으로 가려짐), 인쇄·복사·수정 권한, PDF 보호 버튼이 있습니다.',
        zh: '保护 PDF：输入了两次的密码（以圆点隐藏）、打印/复制/修改权限，以及“保护 PDF”按钮。',
      },
    },
  ],
  'dividir-pdf-en-varios-archivos': [
    {
      section: 1,
      after: 0,
      shot: 'dividir-pdf/elegir',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Dividir PDF con el modo Elegir páginas: las páginas 2 y 3 marcadas en azul entre las miniaturas y el botón Extraer páginas.' },
    },
    {
      section: 1,
      after: 1,
      shot: 'dividir-pdf/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de Dividir PDF: a la izquierda el original de 3 páginas y a la derecha el nuevo PDF con las 2 páginas elegidas.' },
    },
  ],
  'girar-paginas-de-un-pdf': [
    {
      section: 1,
      after: 0,
      shot: 'rotar-pdf/paginas',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Rotar PDF con tres páginas en miniatura: la segunda girada 90°, cada una con flechas para girar y los botones Todas a la izquierda y Todas a la derecha.' },
    },
  ],
  'ordenar-paginas-de-un-pdf': [
    {
      section: 1,
      after: 0,
      shot: 'ordenar-paginas-pdf/paginas',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Ordenar páginas con las tarjetas en el nuevo orden Pág. 2, Pág. 1 y Pág. 3, cada una con flechas, duplicar, agregar en blanco y quitar.' },
    },
  ],
  'numerar-paginas-de-un-pdf': [
    {
      section: 0,
      after: 1,
      shot: 'numerar-paginas-pdf/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Antes y después de numerar: la misma página sin número y con "Página 1 de 3" abajo a la derecha.' },
    },
  ],
  'poner-marca-de-agua-a-un-pdf': [
    {
      section: 0,
      after: 1,
      shot: 'marca-de-agua-pdf/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Antes y después de la marca de agua: la página con la palabra CONFIDENCIAL en diagonal, en azul claro, sobre el texto.' },
    },
  ],
  'editar-un-pdf-sin-programas': [
    {
      section: 1,
      after: 0,
      shot: 'editar-pdf/texto',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Editar PDF con la barra de herramientas (texto, reemplazar, formas, resaltar, tapar, dibujar, flechas, enlace e imagen) y el texto "Aprobado - 20/01/2026" agregado en un contrato.' },
    },
  ],
  'comparar-dos-versiones-de-un-pdf': [
    {
      section: 0,
      after: 1,
      shot: 'comparar-pdf/diferencias',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de comparar dos versiones de un contrato: 2 cambios, 11 palabras agregadas y 3 quitadas; el canon pasa de doscientos a trescientos mil pesos y se agrega una cláusula.' },
    },
  ],
  'tapar-datos-personales-en-un-pdf': [
    {
      section: 1,
      after: 0,
      shot: 'censurar-pdf/zonas',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Censurar PDF con el buscador y los botones Correos y Números; en el contrato quedan marcados los números de documento y el valor del canon.' },
    },
  ],
  'pasar-un-pdf-escaneado-a-texto': [
    {
      section: 1,
      after: 1,
      shot: 'ocr-pdf/texto',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Texto reconocido de una constancia escaneada, renglón por renglón, con los botones Copiar, .txt y Word.' },
    },
  ],
  'copiar-el-texto-de-una-foto': [
    {
      section: 0,
      after: 1,
      shot: 'imagen-a-texto/texto',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Imagen a texto con la foto constancia.jpg elegida, el idioma Español y debajo el texto reconocido en un recuadro que se puede corregir.' },
    },
  ],
  'convertir-un-pdf-a-word-para-editarlo': [
    {
      section: 1,
      after: 1,
      shot: 'pdf-a-word/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de PDF a Word: a la izquierda el contrato en PDF y a la derecha la vista aproximada del documento de Word.' },
    },
  ],
  'pasar-un-extracto-bancario-pdf-a-excel': [
    {
      section: 0,
      after: 2,
      shot: 'pdf-a-excel/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de PDF a Excel: a la izquierda el extracto en PDF y a la derecha la hoja de cálculo con las columnas Fecha, Descripción, Valor y Saldo, y el aviso de 13 filas con 17 números.' },
    },
  ],
  'sacar-el-texto-de-un-pdf': [
    {
      section: 0,
      after: 0,
      shot: 'pdf-a-texto/texto',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'El texto extraído de un contrato en PDF, renglón por renglón, con el botón para copiarlo.' },
    },
  ],
  'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes': [
    {
      section: 1,
      after: 2,
      shot: 'pdf-a-jpg/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de PDF a JPG: a la izquierda el PDF de 3 páginas y a la derecha las imágenes pagina-1.png, pagina-2.png y pagina-3.png, que se guardan juntas en un ZIP.' },
    },
    {
      section: 2,
      after: 1,
      shot: 'extraer-imagenes-pdf/imagenes',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Extraer imágenes con la foto encontrada en la página 1, de 1200×1600 en JPG, marcada para descargar.' },
    },
  ],
  'convertir-un-pdf-a-pdfa-para-un-tramite': [
    {
      section: 2,
      after: 0,
      shot: 'pdf-a-pdfa/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de PDF a PDF/A: el contrato antes y después, con el aviso de que cumple PDF/A-2b y de que se incluyeron las fuentes que faltaban.' },
    },
  ],
  'reparar-un-pdf-que-no-abre': [
    {
      section: 1,
      after: 1,
      shot: 'reparar-pdf/resultado',
      // Guía solo en español por ahora (W-101): los demás idiomas se suman al traducirla.
      alt: { es: 'Resultado de Reparar PDF: a la izquierda el original, que no abre, y a la derecha la copia reparada de 6 páginas, con el aviso de que se corrigieron problemas de estructura.' },
    },
  ],
}
