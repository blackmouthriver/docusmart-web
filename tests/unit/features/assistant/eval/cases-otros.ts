// Conjunto de evaluación del asistente en los otros 10 idiomas (W-151.1). Ver cases.ts.
// 30 preguntas por idioma: 12 herramienta, 5 tramite, 4 error, 4 nueva, 3 general, 2 fuera.
import { t, type EvalCase } from './cases'

// Respuestas aceptadas que se repiten en varios idiomas (mismas que en EVAL_ES/EVAL_EN).
const PAGINA = [...t('dividir-pdf'), ...t('extraer-imagenes-pdf')]
const OCR = [...t('ocr-pdf'), ...t('pdf-a-texto')]
const AMBAS_CARAS = [...t('imagen-a-pdf'), ...t('escanear-documento'), ...t('unir-pdf')]
const FOTO_DOC = [...t('foto-tamano-documento'), 'foto-tamano-documento']
const ACHICAR_FOTO = [...t('comprimir-imagen'), ...t('redimensionar-imagen')]
const DANADO = [...t('reparar-pdf'), 'pdf-danado']
const PROTEGIDO = [...t('desbloquear-pdf'), 'pdf-protegido']
const HEIC = [...t('heic-a-jpg'), 'heic-a-jpg']
const QR_LEER = [...t('leer-codigo-qr'), 'qr-leer']
const FONDO = [...t('quitar-fondo'), 'quitar-fondo']
const AUDIO_TEXTO = [...t('audio-a-texto'), 'audio-a-texto']
const VIDEO_MP3 = [...t('video-a-mp3'), 'video-a-mp3']
const RECORTAR_VIDEO = [...t('recortar-audio-video'), 'recortar-audio-video']
const CONVERTIR_VIDEO = [...t('convertir-video'), 'convertir-video']
const COMPRIMIR_VIDEO = [...t('comprimir-video'), 'comprimir-video']
const METADATOS = [...t('quitar-metadatos'), 'quitar-metadatos']
const GIF = [...t('imagen-a-gif'), 'imagen-a-gif']
const CSV = [...t('csv-a-excel'), 'csv-a-excel']
const CAPTURA = [...t('imagen-a-texto'), 'imagen-a-texto']
const BRILLO = [...t('ajustar-imagen'), 'ajustar-imagen']
const PPT = [...t('powerpoint-a-pdf'), 'powerpoint-a-pdf']
const FACTURA = [...t('cuenta-de-cobro'), 'cuenta-de-cobro']
const CV = [...t('hoja-de-vida'), 'hoja-de-vida']
const PALABRAS = [...t('contador-de-palabras'), 'contador-de-palabras']
const CLAVE_SEGURA = [...t('generador-de-contrasenas'), 'generador-de-contrasenas']
const PRECIO = ['precio', 'premium']

const PT: EvalCase[] = [
  ['preciso juntar o rg e o comprovante num pdf so', t('unir-pdf'), 'herramienta'],
  ['como deixar o pdf mais leve pra mandar no email', t('comprimir-pdf'), 'herramienta'],
  ['tirar so a pagina 3 do pdf', PAGINA, 'herramienta'],
  ['o scan ficou de cabeca pra baixo', t('rotar-pdf'), 'herramienta'],
  ['colocar senha no pdf', t('proteger-pdf'), 'herramienta'],
  ['assinar contrato pelo celular', t('firmar-pdf'), 'herramienta'],
  ['transformar pdf em word pra poder editar', t('pdf-a-word'), 'herramienta'],
  ['passar uma tabela do pdf pro excel', t('pdf-a-excel'), 'herramienta'],
  ['fazer um pdf com as fotos do celular', t('imagen-a-pdf'), 'herramienta'],
  ['copiar o texto de um pdf escaneado', OCR, 'herramienta'],
  ['como abro um arquivo rar', t('descomprimir-archivos'), 'herramienta'],
  ['gerar qr code pro meu negocio', t('crear-codigo-qr'), 'herramienta'],

  ['o gov.br nao aceita meu pdf diz que e muito grande', t('comprimir-pdf'), 'tramite'],
  ['pedem o rg frente e verso num pdf so', AMBAS_CARAS, 'tramite'],
  ['foto 3x4 fundo branco pra documento', FOTO_DOC, 'tramite'],
  ['fazer curriculo pra vaga de emprego', CV, 'tramite'],
  ['o site do vestibular so aceita foto ate 200kb', t('comprimir-imagen'), 'tramite'],

  ['o pdf nao abre fala que ta corrompido', DANADO, 'error'],
  ['o site ta muito lento', ['lento'], 'error'],
  ['o arquivo nao baixa', ['descarga'], 'error'],
  ['nao consigo abrir as fotos do iphone no pc', HEIC, 'error'],

  ['tirar o fundo de uma foto', FONDO, 'nueva'],
  ['transformar audio do zap em texto', AUDIO_TEXTO, 'nueva'],
  ['tirar o audio de um video em mp3', VIDEO_MP3, 'nueva'],
  ['apagar a localizacao gps da foto', METADATOS, 'nueva'],

  ['e de graca?', PRECIO, 'general'],
  ['meus arquivos vao pra algum servidor?', ['privacidad'], 'general'],
  ['precisa criar conta?', ['sin-cuenta'], 'general'],

  ['previsao do tempo pra amanha', [], 'fuera'],
  ['me indica um filme bom', [], 'fuera'],
]

const FR: EvalCase[] = [
  ["mettre ma carte d'identite et la facture dans un seul pdf", t('unir-pdf'), 'herramienta'],
  ["mon pdf fait 20 mo impossible de l'envoyer par mail", t('comprimir-pdf'), 'herramienta'],
  ['separer un pdf page par page', t('dividir-pdf'), 'herramienta'],
  ['remettre les pages dans le bon ordre', t('ordenar-paginas-pdf'), 'herramienta'],
  ['numeroter les pages d un pdf', t('numerar-paginas-pdf'), 'herramienta'],
  ['enlever le mot de passe d un pdf, je le connais', PROTEGIDO, 'herramienta'],
  ['signer un contrat sur mon telephone', t('firmar-pdf'), 'herramienta'],
  ['changer un mot dans un pdf', t('editar-pdf'), 'herramienta'],
  ['enregistrer un doc word en pdf', t('word-a-pdf'), 'herramienta'],
  ['remplir un formulaire pdf sans l imprimer', t('llenar-formulario-pdf'), 'herramienta'],
  ['reduire le poids d une photo', ACHICAR_FOTO, 'herramienta'],
  ['faire un zip avec plusieurs fichiers', t('comprimir-archivos'), 'herramienta'],

  ['le site des impots refuse mon pdf, trop lourd', t('comprimir-pdf'), 'tramite'],
  ['photo d identite fond blanc pour le passeport', FOTO_DOC, 'tramite'],
  ['le tribunal demande le document en pdf/a', t('pdf-a-pdfa'), 'tramite'],
  ['faire une facture pour un client', FACTURA, 'tramite'],
  ['scanner le recto verso de ma carte d identite dans un seul pdf', AMBAS_CARAS, 'tramite'],

  ['le pdf s affiche tout blanc', DANADO, 'error'],
  ['impossible d ouvrir le pdf il demande un mot de passe', PROTEGIDO, 'error'],
  ['le telechargement marche pas', ['descarga'], 'error'],
  ['la video est trop lourde pour whatsapp', COMPRIMIR_VIDEO, 'error'],

  ['enlever le fond d une image', FONDO, 'nueva'],
  ['retranscrire l enregistrement d une reunion', AUDIO_TEXTO, 'nueva'],
  ['convertir une video mov en mp4', CONVERTIR_VIDEO, 'nueva'],
  ['faire un gif avec plusieurs photos', GIF, 'nueva'],

  ['c est gratuit ?', PRECIO, 'general'],
  ['ca marche hors ligne ?', ['offline'], 'general'],
  ['y a une appli android', ['app-android'], 'general'],

  ['quel temps il fait aujourd hui', [], 'fuera'],
  ['combien font 15 fois 23', [], 'fuera'],
]

const IT: EvalCase[] = [
  ['unire due pdf in uno solo', t('unir-pdf'), 'herramienta'],
  ['il pdf pesa troppo per mandarlo via mail', t('comprimir-pdf'), 'herramienta'],
  ['estrarre solo la pagina 3 da un pdf', PAGINA, 'herramienta'],
  ['la scansione e venuta capovolta', t('rotar-pdf'), 'herramienta'],
  ['mettere una password a un pdf', t('proteger-pdf'), 'herramienta'],
  ['firmare un contratto dal cellulare', t('firmar-pdf'), 'herramienta'],
  ['trasformare un pdf in word per modificarlo', t('pdf-a-word'), 'herramienta'],
  ['convertire una presentazione powerpoint in pdf', PPT, 'herramienta'],
  ['salvare ogni pagina del pdf come immagine', t('pdf-a-jpg'), 'herramienta'],
  ['scansionare un documento senza scanner', t('escanear-documento'), 'herramienta'],
  ['oscurare il codice fiscale in un pdf prima di mandarlo', t('censurar-pdf'), 'herramienta'],
  ['ridimensionare una foto a 1080 pixel', t('redimensionar-imagen'), 'herramienta'],

  ['il portale dell inps non accetta il pdf perche e troppo grande', t('comprimir-pdf'), 'tramite'],
  ['carta d identita fronte e retro in un unico pdf', AMBAS_CARAS, 'tramite'],
  ['foto tessera sfondo bianco', FOTO_DOC, 'tramite'],
  ['fare un curriculum per candidarmi a un lavoro', CV, 'tramite'],
  ['il sito accetta solo jpg e ho le foto dell iphone', HEIC, 'tramite'],

  ['il pdf non si apre dice che e danneggiato', DANADO, 'error'],
  ['il sito e lentissimo', ['lento'], 'error'],
  ['non mi legge il qr', QR_LEER, 'error'],
  ['non si sente la voce quando legge il pdf', ['voz-no-funciona'], 'error'],

  ['togliere lo sfondo da una foto', FONDO, 'nueva'],
  ['trascrivere un vocale di whatsapp', AUDIO_TEXTO, 'nueva'],
  ['tagliare l inizio di un video', RECORTAR_VIDEO, 'nueva'],
  ['copiare il testo da uno screenshot', CAPTURA, 'nueva'],

  ['e gratis?', PRECIO, 'general'],
  ['devo registrarmi?', ['sin-cuenta'], 'general'],
  ['come installo docusmart sul pc', ['desktop'], 'general'],

  ['consigliami un film', [], 'fuera'],
  ['chi e il presidente della repubblica', [], 'fuera'],
]

const DE: EvalCase[] = [
  ['zwei pdfs zu einem zusammenfügen', t('unir-pdf'), 'herramienta'],
  ['pdf ist zu groß für die email', t('comprimir-pdf'), 'herramienta'],
  ['pdf in einzelne seiten aufteilen', t('dividir-pdf'), 'herramienta'],
  ['seitenzahlen ins pdf einfügen', t('numerar-paginas-pdf'), 'herramienta'],
  ['pdf mit passwort schützen', t('proteger-pdf'), 'herramienta'],
  ['vertrag am handy unterschreiben', t('firmar-pdf'), 'herramienta'],
  ['text in einem pdf ändern', t('editar-pdf'), 'herramienta'],
  ['tabelle aus pdf in excel bekommen', t('pdf-a-excel'), 'herramienta'],
  ['text aus eingescanntem pdf kopieren', OCR, 'herramienta'],
  ['weiße ränder vom pdf wegschneiden', t('recortar-pdf'), 'herramienta'],
  ['foto quadratisch zuschneiden', t('recortar-imagen'), 'herramienta'],
  ['rar datei öffnen', t('descomprimir-archivos'), 'herramienta'],

  ['das finanzamt-portal nimmt mein pdf nicht, zu groß', t('comprimir-pdf'), 'tramite'],
  ['biometrisches passbild selber machen', FOTO_DOC, 'tramite'],
  ['rechnung für einen kunden schreiben', FACTURA, 'tramite'],
  ['lebenslauf für die bewerbung erstellen', CV, 'tramite'],
  ['das bewerbungsportal will ein foto unter 200 kb', t('comprimir-imagen'), 'tramite'],

  ['pdf lässt sich nicht öffnen, angeblich beschädigt', DANADO, 'error'],
  ['pdf geht nicht auf, will ein passwort', PROTEGIDO, 'error'],
  ['download funktioniert nicht', ['descarga'], 'error'],
  ['iphone fotos gehen am pc nicht auf', HEIC, 'error'],

  ['hintergrund von einem foto entfernen', FONDO, 'nueva'],
  ['sprachnachricht in text umwandeln', AUDIO_TEXTO, 'nueva'],
  ['ton aus einem video als mp3 speichern', VIDEO_MP3, 'nueva'],
  ['csv in excel umwandeln', CSV, 'nueva'],

  ['ist das kostenlos', PRECIO, 'general'],
  ['werden meine dateien irgendwo hochgeladen', ['privacidad'], 'general'],
  ['geht das auch offline', ['offline'], 'general'],

  ['wie wird das wetter morgen', [], 'fuera'],
  ['wer ist der bundeskanzler', [], 'fuera'],
]

const CA: EvalCase[] = [
  ['ajuntar dos pdf en un de sol', t('unir-pdf'), 'herramienta'],
  ['fer mes petit un pdf per enviar-lo per correu', t('comprimir-pdf'), 'herramienta'],
  ['treure nomes la pagina 3 d un pdf', PAGINA, 'herramienta'],
  ['canviar l ordre de les pagines', t('ordenar-paginas-pdf'), 'herramienta'],
  ['posar contrasenya a un pdf', t('proteger-pdf'), 'herramienta'],
  ['signar un contracte des del mobil', t('firmar-pdf'), 'herramienta'],
  ['passar un pdf a word per editar-lo', t('pdf-a-word'), 'herramienta'],
  ['passar un document de word a pdf', t('word-a-pdf'), 'herramienta'],
  ['fer un pdf amb fotos del mobil', t('imagen-a-pdf'), 'herramienta'],
  ['omplir un formulari pdf sense imprimir-lo', t('llenar-formulario-pdf'), 'herramienta'],
  ['fer un codi qr per a la botiga', t('crear-codigo-qr'), 'herramienta'],
  ['comptar les paraules d un treball', PALABRAS, 'herramienta'],

  ['la seu electronica no em deixa pujar el pdf, pesa massa', t('comprimir-pdf'), 'tramite'],
  ['foto de carnet amb fons blanc per al dni', FOTO_DOC, 'tramite'],
  ['fer una factura per a un client', FACTURA, 'tramite'],
  ['el jutjat em demana el document en pdf/a', t('pdf-a-pdfa'), 'tramite'],
  ['el dni per les dues cares en un sol pdf', AMBAS_CARAS, 'tramite'],

  ['el pdf no s obre, diu que esta malmes', DANADO, 'error'],
  ['la pagina va molt lenta', ['lento'], 'error'],
  ['no es descarrega l arxiu', ['descarga'], 'error'],
  ['el video pesa massa per al whatsapp', COMPRIMIR_VIDEO, 'error'],

  ['treure el fons d una foto', FONDO, 'nueva'],
  ['passar un audio de whatsapp a text', AUDIO_TEXTO, 'nueva'],
  ['convertir un video mov a mp4', CONVERTIR_VIDEO, 'nueva'],
  ['aclarir una foto que ha sortit fosca', BRILLO, 'nueva'],

  ['es gratis?', PRECIO, 'general'],
  ['he de crear un compte?', ['sin-cuenta'], 'general'],
  ['hi ha app per a android', ['app-android'], 'general'],

  ['quin temps fara dema', [], 'fuera'],
  ['recomana m una peli', [], 'fuera'],
]

const EU: EvalCase[] = [
  ['bi pdf bakar batean batu', t('unir-pdf'), 'herramienta'],
  ['pdf bat arindu posta bidez bidaltzeko', t('comprimir-pdf'), 'herramienta'],
  ['pdf bat orriz orri banatu', t('dividir-pdf'), 'herramienta'],
  ['eskaneatutakoa buruz behera geratu da', t('rotar-pdf'), 'herramienta'],
  ['orrialdeei zenbakiak jarri', t('numerar-paginas-pdf'), 'herramienta'],
  ['pdf bati pasahitza jarri', t('proteger-pdf'), 'herramienta'],
  ['kontratu bat mugikorretik sinatu', t('firmar-pdf'), 'herramienta'],
  ['pdf bat word bihurtu editatzeko', t('pdf-a-word'), 'herramienta'],
  ['eskaneatutako pdf bateko testua kopiatu', OCR, 'herramienta'],
  ['argazki baten tamaina txikitu', ACHICAR_FOTO, 'herramienta'],
  ['zip bat egin hainbat fitxategirekin', t('comprimir-archivos'), 'herramienta'],
  ['pdf luze baten laburpena egin', t('resumir-pdf'), 'herramienta'],

  ['egoitza elektronikoak ez dit pdf-a igotzen uzten, handiegia da', t('comprimir-pdf'), 'tramite'],
  ['nanaren bi aldeak pdf bakar batean', AMBAS_CARAS, 'tramite'],
  ['nan argazkia hondo zuriarekin', FOTO_DOC, 'tramite'],
  ['curriculuma egin lan eskaintza baterako', CV, 'tramite'],
  ['inprimakiak 200 kb baino gutxiagoko argazkia eskatzen du', t('comprimir-imagen'), 'tramite'],

  ['pdf-a ez da irekitzen, hondatuta dagoela dio', DANADO, 'error'],
  ['pdf-a zuri-zuri ateratzen da', DANADO, 'error'],
  ['orria oso motel doa', ['lento'], 'error'],
  ['fitxategia ez da deskargatzen', ['descarga'], 'error'],

  ['argazki baten atzeko planoa kendu', FONDO, 'nueva'],
  ['whatsapp audio bat testu bihurtu', AUDIO_TEXTO, 'nueva'],
  ['bideo baten audioa mp3an atera', VIDEO_MP3, 'nueva'],
  ['argazki baten gps kokapena ezabatu', METADATOS, 'nueva'],

  ['doan da?', PRECIO, 'general'],
  ['nire fitxategiak zerbitzari batera igotzen dira?', ['privacidad'], 'general'],
  ['internetik gabe dabil?', ['offline'], 'general'],

  ['zer eguraldi egingo du bihar', [], 'fuera'],
  ['gomendatu film bat', [], 'fuera'],
]

const RU: EvalCase[] = [
  ['объединить два пдф в один', t('unir-pdf'), 'herramienta'],
  ['пдф весит 20 мб и не отправляется по почте', t('comprimir-pdf'), 'herramienta'],
  ['вытащить одну страницу из pdf', PAGINA, 'herramienta'],
  ['скан получился вверх ногами', t('rotar-pdf'), 'herramienta'],
  ['поменять порядок страниц в пдф', t('ordenar-paginas-pdf'), 'herramienta'],
  ['поставить пароль на pdf', t('proteger-pdf'), 'herramienta'],
  ['подписать договор с телефона', t('firmar-pdf'), 'herramienta'],
  ['перевести пдф в ворд', t('pdf-a-word'), 'herramienta'],
  ['сделать пдф из фоток с телефона', t('imagen-a-pdf'), 'herramienta'],
  ['скопировать текст из отсканированного пдф', OCR, 'herramienta'],
  ['чем открыть rar архив', t('descomprimir-archivos'), 'herramienta'],
  ['придумать надежный пароль', CLAVE_SEGURA, 'herramienta'],

  ['госуслуги не принимают файл, пишет слишком большой', t('comprimir-pdf'), 'tramite'],
  ['фото на паспорт на белом фоне', FOTO_DOC, 'tramite'],
  ['сканы паспорта собрать в один пдф', AMBAS_CARAS, 'tramite'],
  ['составить резюме для устройства на работу', CV, 'tramite'],
  ['выставить счет клиенту в пдф', FACTURA, 'tramite'],

  ['пдф не открывается, пишет что файл поврежден', DANADO, 'error'],
  ['сайт очень тормозит', ['lento'], 'error'],
  ['файл не скачивается', ['descarga'], 'error'],
  ['не считывается qr код', QR_LEER, 'error'],

  ['убрать фон с фото', FONDO, 'nueva'],
  ['перевести голосовое сообщение в текст', AUDIO_TEXTO, 'nueva'],
  ['обрезать начало видео', RECORTAR_VIDEO, 'nueva'],
  ['сделать гифку из нескольких фото', GIF, 'nueva'],

  ['это бесплатно?', PRECIO, 'general'],
  ['нужна регистрация?', ['sin-cuenta'], 'general'],
  ['есть приложение для андроид', ['app-android'], 'general'],

  ['какая погода сегодня', [], 'fuera'],
  ['сколько будет 15 умножить на 23', [], 'fuera'],
]

const JA: EvalCase[] = [
  ['PDF2つを1つにまとめたい', t('unir-pdf'), 'herramienta'],
  ['PDFが重くてメールで送れない', t('comprimir-pdf'), 'herramienta'],
  ['PDFの3ページ目だけ取り出したい', PAGINA, 'herramienta'],
  ['スキャンしたら上下逆になった', t('rotar-pdf'), 'herramienta'],
  ['PDFにページ番号をつけたい', t('numerar-paginas-pdf'), 'herramienta'],
  ['PDFにパスワードをかけたい', t('proteger-pdf'), 'herramienta'],
  ['スマホで契約書にサインしたい', t('firmar-pdf'), 'herramienta'],
  ['PDFをワードにして編集したい', t('pdf-a-word'), 'herramienta'],
  ['PDFの表をエクセルに貼りたい', t('pdf-a-excel'), 'herramienta'],
  ['スキャンしたPDFの文字をコピーしたい', OCR, 'herramienta'],
  ['写真を正方形に切り抜く', t('recortar-imagen'), 'herramienta'],
  ['お店のQRコードを作りたい', t('crear-codigo-qr'), 'herramienta'],

  ['e-TaxでPDFが大きすぎてアップロードできない', t('comprimir-pdf'), 'tramite'],
  ['証明写真 背景白 自分で作る', FOTO_DOC, 'tramite'],
  ['マイナンバーカードの表と裏を1つのPDFにしたい', AMBAS_CARAS, 'tramite'],
  ['履歴書を作りたい', CV, 'tramite'],
  ['請求書をPDFで作りたい', FACTURA, 'tramite'],

  ['PDFが開けない 破損していると出る', DANADO, 'error'],
  ['PDFを開こうとするとパスワードを聞かれる', PROTEGIDO, 'error'],
  ['ダウンロードできない', ['descarga'], 'error'],
  ['iPhoneの写真がパソコンで開けない', HEIC, 'error'],

  ['写真の背景を消したい', FONDO, 'nueva'],
  ['会議の録音を文字起こししたい', AUDIO_TEXTO, 'nueva'],
  ['動画から音声だけmp3で抜き出す', VIDEO_MP3, 'nueva'],
  ['スクショの文字をコピーしたい', CAPTURA, 'nueva'],

  ['無料ですか', PRECIO, 'general'],
  ['ファイルはサーバーにアップロードされる？', ['privacidad'], 'general'],
  ['オフラインでも使える？', ['offline'], 'general'],

  ['今日の天気は', [], 'fuera'],
  ['おすすめの映画教えて', [], 'fuera'],
]

const KO: EvalCase[] = [
  ['pdf 두개 하나로 합치기', t('unir-pdf'), 'herramienta'],
  ['pdf 용량 줄이기', t('comprimir-pdf'), 'herramienta'],
  ['pdf 페이지 나누기', t('dividir-pdf'), 'herramienta'],
  ['pdf 페이지 순서 바꾸는 법', t('ordenar-paginas-pdf'), 'herramienta'],
  ['pdf에 비밀번호 걸기', t('proteger-pdf'), 'herramienta'],
  ['pdf 비번 아는데 해제하는 법', PROTEGIDO, 'herramienta'],
  ['핸드폰으로 계약서 서명하기', t('firmar-pdf'), 'herramienta'],
  ['pdf 글자 수정하고 싶어요', t('editar-pdf'), 'herramienta'],
  ['워드 문서 pdf로 저장', t('word-a-pdf'), 'herramienta'],
  ['pdf를 jpg로 바꾸기', t('pdf-a-jpg'), 'herramienta'],
  ['사진 크기 1080으로 바꾸기', t('redimensionar-imagen'), 'herramienta'],
  ['파일 여러개 zip으로 압축', t('comprimir-archivos'), 'herramienta'],

  ['정부24에 pdf 올리는데 용량이 너무 크대요', t('comprimir-pdf'), 'tramite'],
  ['여권사진 흰배경으로 만들기', FOTO_DOC, 'tramite'],
  ['신분증 앞뒤 한 pdf로 만들기', AMBAS_CARAS, 'tramite'],
  ['취업용 이력서 만들기', CV, 'tramite'],
  ['사진을 200kb 이하로 올리라는데', t('comprimir-imagen'), 'tramite'],

  ['pdf가 안 열려요 손상됐다고 나와요', DANADO, 'error'],
  ['pdf가 하얗게만 나와요', DANADO, 'error'],
  ['사이트가 너무 느려요', ['lento'], 'error'],
  ['카톡으로 보내기엔 동영상이 너무 커요', COMPRIMIR_VIDEO, 'error'],

  ['사진 배경 지우기', FONDO, 'nueva'],
  ['녹음 파일 텍스트로 변환', AUDIO_TEXTO, 'nueva'],
  ['mov 파일 mp4로 변환', CONVERTIR_VIDEO, 'nueva'],
  ['사진 위치정보 삭제', METADATOS, 'nueva'],

  ['무료인가요?', PRECIO, 'general'],
  ['회원가입 해야 돼요?', ['sin-cuenta'], 'general'],
  ['안드로이드 앱 있어요?', ['app-android'], 'general'],

  ['오늘 날씨 어때', [], 'fuera'],
  ['15 곱하기 23은?', [], 'fuera'],
]

const ZH: EvalCase[] = [
  ['把身份证和收据合成一个pdf', t('unir-pdf'), 'herramienta'],
  ['pdf太大了发不了邮件', t('comprimir-pdf'), 'herramienta'],
  ['只要pdf里的第3页', PAGINA, 'herramienta'],
  ['扫描件倒过来了', t('rotar-pdf'), 'herramienta'],
  ['pdf怎么加页码', t('numerar-paginas-pdf'), 'herramienta'],
  ['给pdf加个密码', t('proteger-pdf'), 'herramienta'],
  ['在手机上签合同', t('firmar-pdf'), 'herramienta'],
  ['pdf转word', t('pdf-a-word'), 'herramienta'],
  ['ppt转成pdf', PPT, 'herramienta'],
  ['手机拍的照片做成pdf', t('imagen-a-pdf'), 'herramienta'],
  ['扫描的pdf怎么复制文字', OCR, 'herramienta'],
  ['rar文件怎么解压', t('descomprimir-archivos'), 'herramienta'],

  ['网上办事大厅上传pdf提示文件过大', t('comprimir-pdf'), 'tramite'],
  ['证件照白底怎么弄', FOTO_DOC, 'tramite'],
  ['身份证正反面放在一个pdf里', AMBAS_CARAS, 'tramite'],
  ['做一份找工作用的简历', CV, 'tramite'],
  ['报名网站要求照片小于200kb', t('comprimir-imagen'), 'tramite'],

  ['pdf打不开 说文件已损坏', DANADO, 'error'],
  ['网页太卡了', ['lento'], 'error'],
  ['文件下载不了', ['descarga'], 'error'],
  ['二维码扫不出来', QR_LEER, 'error'],

  ['照片去背景', FONDO, 'nueva'],
  ['语音转文字', AUDIO_TEXTO, 'nueva'],
  ['从视频里提取mp3音频', VIDEO_MP3, 'nueva'],
  ['截图里的文字怎么复制', CAPTURA, 'nueva'],

  ['免费吗', PRECIO, 'general'],
  ['文件会上传到服务器吗', ['privacidad'], 'general'],
  ['不联网能用吗', ['offline'], 'general'],

  ['今天天气怎么样', [], 'fuera'],
  ['推荐一部电影', [], 'fuera'],
]

export const EVAL_OTHER: Record<string, EvalCase[]> = { pt: PT, fr: FR, it: IT, de: DE, ca: CA, eu: EU, ru: RU, ja: JA, ko: KO, zh: ZH }
