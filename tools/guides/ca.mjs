// Traducción al catalán de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: "Guies",
    guidesSlug: "guies",
    indexTitle: "Guies de DocuSmart: PDF, fotos i documents pas a pas",
    indexDescription:
      "Guies curtes i pràctiques per unir, comprimir, signar, escanejar i protegir documents des del mòbil o l'ordinador, de franc i sense pujar els teus fitxers.",
    indexH1: "Guies pas a pas",
    indexLead: "Tasques de cada dia amb PDF, fotos i documents, explicades en pocs minuts. Totes es fan al navegador, sense pujar els teus fitxers.",
    minutes: "{n} min de lectura",
    updated: "Actualitzada el {date}",
    summary: "Resum ràpid",
    toolsTitle: "Eines d'aquesta guia",
    moreGuides: "Més guies",
    related: "Guies relacionades",
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'unir-pdf-al-mobil',
      title: "Com unir PDF al mòbil sense pujar els teus fitxers | DocuSmart",
      description:
        "Guia pas a pas per ajuntar diversos PDF en un de sol des del mòbil, de franc i sense pujar-los a cap servidor. Funciona al navegador d'Android i d'iPhone.",
      h1: "Com unir PDF al mòbil sense pujar els teus fitxers",
      lead: "Ajuntar el DNI, el rebut i el formulari en un sol PDF és una de les tasques més habituals en qualsevol tràmit. Així es fa des del mòbil, en un minut i sense lliurar els teus documents a un servidor aliè.",
      sections: [
        {
          h2: "Per què és important no pujar els fitxers",
          body: [
            "La majoria de les webs per unir PDF reben els teus documents als seus servidors, els processen allà i et tornen el resultat. Per a la carta d'un restaurant tant se val; per a un DNI, un extracte bancari o un historial clínic, no tant: no saps quant de temps els guarden ni qui els pot veure.",
            "DocuSmart fa la unió dins del navegador del mòbil. El fitxer no viatja mai per internet, així que no en queda cap còpia en cap servidor. Per això funciona fins i tot amb mala cobertura, un cop carregada la pàgina.",
          ],
        },
        {
          h2: "Abans de començar",
          body: [
            { ul: [
              "Tingues els PDF desats al mòbil (a Baixades, a Fitxers o al teu núvol).",
              "Si algun és una foto i no un PDF, primer converteix-lo amb [Imatge a PDF](/imagen-a-pdf).",
              "Si un PDF té contrasenya, treu-la abans amb [Desbloquejar PDF](/desbloquear-pdf) (cal que la coneguis).",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Unir PDF](/unir-pdf) al navegador del mòbil (Chrome, Safari, Samsung Internet o el que facis servir). Toca el requadre per triar els fitxers: en pots seleccionar diversos alhora.",
            "Revisa l'ordre de la llista. El primer fitxer serà l'inici del document final; mou-los amb les fletxes fins que quedin com els necessites. Després toca «Uneix»: el PDF combinat es baixa amb totes les pàgines.",
            { tip: "Necessites canviar l'ordre de pàgines soltes, no de fitxers sencers? Primer uneix-los i després obre el resultat a [Ordenar pàgines](/ordenar-paginas-pdf), on pots moure o treure cada pàgina." },
          ],
        },
        {
          h2: "Si el PDF final pesa massa",
          body: [
            "Molts portals de tràmits i serveis de correu limiten la mida dels adjunts (2 MB, 5 MB o 10 MB són límits habituals). Si te'n passes, fes servir [Comprimir PDF](/comprimir-pdf): el nivell «Sense pèrdua» no toca la qualitat, i «Mitjana» redueix molt més els PDF que provenen d'escanejos o fotos.",
          ],
        },
        {
          h2: "I si ho fas sovint",
          body: [
            "La web funciona en qualsevol mòbil. Si fas servir Android i uneixes documents sovint, l'app de DocuSmart fa el mateix sense connexió i et guarda els fitxers organitzats al telèfon.",
          ],
        },
      ],
      steps: [
        { name: "Obre Unir PDF", text: "Obre l'eina Unir PDF de docusmart.online des del navegador del mòbil." },
        { name: "Tria els PDF", text: "Toca el requadre i selecciona tots els fitxers que vols ajuntar." },
        { name: "Ordena'ls", text: "Mou els fitxers amb les fletxes: el primer serà l'inici del document." },
        { name: "Uneix i baixa", text: "Toca «Uneix» i es baixa un sol PDF amb totes les pàgines." },
      ],
      faq: [
        ["Funciona a l'iPhone?", "Sí. Funciona a Safari i a qualsevol navegador modern, a l'iPhone i a Android. L'app sense connexió és només per a Android."],
        ["Quants PDF puc unir?", "No hi ha un nombre fix. El límit és la memòria del mòbil: amb documents molt grans pot trigar una mica més."],
        ["Es perd qualitat?", "No. Les pàgines es copien tal com són, amb el text, les imatges i la mida originals."],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'fotos-a-pdf',
      title: "Com passar fotos a PDF (diverses fotos en un sol fitxer) | DocuSmart",
      description:
        "Converteix fotos del mòbil o de l'ordinador en un PDF, una foto per pàgina. De franc, sense registre i sense pujar les imatges. Consells perquè quedi llegible i lleuger.",
      h1: "Com passar fotos a PDF, diverses en un sol fitxer",
      lead: "Et demanen «el document en PDF» i el que tens són fotos a la galeria. Així les converteixes en un PDF ordenat, llegible i lleuger, sense instal·lar res.",
      sections: [
        {
          h2: "Dos camins segons el tipus de foto",
          body: [
            { ul: [
              "**Fotos que ja es veuen bé** (captures de pantalla, imatges baixades, fotos fetes de cara): fes servir [Imatge a PDF](/imagen-a-pdf). Cada foto es converteix en una pàgina tal com és.",
              "**Fotos d'un full de paper** (un rebut, un contracte, un certificat): fes servir [Escanejar document](/escanear-documento). Troba les vores del full, l'endreça i blanqueja el paper perquè sembli escanejat.",
            ] },
          ],
        },
        {
          h2: "Pas a pas amb Imatge a PDF",
          body: [
            "Obre [Imatge a PDF](/imagen-a-pdf) i tria les imatges. Accepta JPG, PNG, WebP, BMP i GIF, i els pots barrejar.",
            "Ordena-les amb les fletxes: cada imatge serà una pàgina, en aquest ordre. Toca «Convertir» i ja està: tens un únic PDF.",
          ],
        },
        {
          h2: "Com fer la foto perquè es llegeixi bé",
          body: [
            { ul: [
              "Llum uniforme, sense flaix directe: les ombres de la mà o del mòbil dificulten la lectura.",
              "El full sobre una superfície fosca (una taula de fusta, per exemple): així l'escàner troba millor les vores.",
              "El mòbil paral·lel al full, no inclinat.",
              "Que es vegi el full sencer, amb una mica de marge.",
            ] },
            { tip: "Amb [Escanejar document](/escanear-documento) pots marcar «Fer el PDF cercable»: reconeix el text perquè es pugui cercar i copiar, cosa que alguns portals agraeixen." },
          ],
        },
        {
          h2: "Que no pesi massa",
          body: [
            "Una foto de mòbil actual pot pesar 3 o 4 MB; deu fotos ja són un PDF pesat per a un correu. Si el resultat és gran, passa'l per [Comprimir PDF](/comprimir-pdf) amb el nivell «Mitjana», que redueix molt les pàgines que són fotos. També pots comprimir les fotos abans amb [Comprimir imatge](/comprimir-imagen).",
          ],
        },
        {
          h2: "Si tens iPhone",
          body: [
            "Quan tries fotos des de Safari, l'iPhone normalment les lliura en JPG, així que funcionen sense fer res més. Si has copiat les fotos a l'ordinador i apareixen com a fitxers .HEIC, aquest format encara no es pot convertir aquí.",
            "Perquè l'iPhone desi les properes fotos en JPG, ves a Configuració › Càmera › Formats i tria «Més compatible». Per a les fotos que ja tens, envia-les a l'ordinador des de l'app Fotos amb l'opció de compartir: en aquest cas solen arribar convertides a JPG.",
          ],
        },
        {
          h2: "Les teves fotos no surten del dispositiu",
          body: [
            "La conversió es fa al navegador: les fotos no es pugen a cap servidor. És important quan són documents d'identitat o informació de salut.",
          ],
        },
      ],
      steps: [
        { name: "Obre Imatge a PDF", text: "Obre l'eina Imatge a PDF de docusmart.online." },
        { name: "Tria les fotos", text: "Selecciona les imatges (JPG, PNG, WebP, BMP o GIF)." },
        { name: "Ordena-les", text: "Fes servir les fletxes: cada imatge serà una pàgina en aquest ordre." },
        { name: "Converteix", text: "Toca «Convertir» per obtenir un sol PDF." },
      ],
      faq: [
        ["Puc posar diverses fotos en una sola pàgina?", "Imatge a PDF posa una foto per pàgina, que és el que solen demanar els tràmits. Si en necessites diverses en un full, ajunta-les abans en una sola imatge."],
        ["Quina diferència hi ha amb escanejar?", "Escanejar document retalla el full, l'endreça i millora el contrast; Imatge a PDF respecta la foto tal com és. Per a papers, escanejar dona un resultat més net."],
        ["Funciona sense internet?", "Un cop oberta la pàgina, la conversió no necessita connexió. Si instal·les DocuSmart Desktop o l'app d'Android, funciona del tot sense connexió."],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'reduir-mida-pdf',
      title: "Com reduir la mida d'un PDF per a correu, WhatsApp o tràmits | DocuSmart",
      description:
        "Per què un PDF pesa tant i com reduir-ne el pes sense perdre llegibilitat. Quin nivell de compressió triar segons el tipus de document. De franc i sense pujar fitxers.",
      h1: "Com reduir la mida d'un PDF",
      lead: "«El fitxer supera la mida màxima permesa.» Si t'ha sortit aquest missatge en un portal o al correu, aquesta guia explica per què passa i com solucionar-ho sense que el document es torni il·legible.",
      sections: [
        {
          h2: "Per què un PDF pesa tant",
          body: [
            "El que més pesa en un PDF són les imatges. Un document creat des de Word només amb text sol pesar uns centenars de kilobytes, encara que tingui moltes pàgines. Un de fet amb fotos o amb un escàner configurat en alta resolució pot passar fàcilment de 10 MB amb poques pàgines.",
            "Per això la compressió funciona de manera molt diferent segons el tipus de PDF: en un document de text hi ha poc a reduir; en un escaneig, molt.",
          ],
        },
        {
          h2: "Quin nivell triar",
          body: [
            { ul: [
              "**Sense pèrdua:** optimitza l'estructura del fitxer sense tocar la qualitat. El text continua sent seleccionable. És l'opció segura per a contractes, factures i documents digitals.",
              "**Mitjana:** recomanat per a escanejos i fotos. Redueix molt el pes i es continua llegint bé.",
              "**Alta:** per quan el límit és molt estricte. Compte: en els nivells Mitjana i Alta el text queda com a imatge, així que ja no es pot seleccionar.",
            ] },
            { tip: "Comença amb «Sense pèrdua». Si no arriba a la mida que necessites, prova «Mitjana». DocuSmart et mostra quant s'ha reduït abans que l'enviïs." },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Comprimir PDF](/comprimir-pdf), tria el fitxer i escull el nivell. Toca «Comprimeix PDF»: veuràs el pes abans i després, i es baixa el resultat.",
            "Si el PDF ja venia optimitzat i no es pot reduir més, DocuSmart t'avisa i no baixa una còpia igual o més pesada.",
          ],
        },
        {
          h2: "Si tot i així no n'hi ha prou",
          body: [
            { ul: [
              "**Divideix el document:** molts portals accepten diversos adjunts. Amb [Dividir PDF](/dividir-pdf) el parteixes en dos o més fitxers.",
              "**Comprimeix les fotos abans de fer el PDF:** [Comprimir imatge](/comprimir-imagen) redueix una foto de mòbil entre un 60 % i un 90 % gairebé sense diferència visible.",
              "**Treu les pàgines que sobren:** amb [Ordenar pàgines](/ordenar-paginas-pdf) elimines portades o pàgines en blanc.",
            ] },
          ],
        },
        {
          h2: "Límits habituals",
          body: [
            "Com a referència: Gmail permet adjunts de fins a 25 MB i Outlook, de 20 MB. Molts portals de l'Administració i de bancs demanen entre 2 i 5 MB per fitxer. Revisa sempre el límit del lloc on el vols pujar.",
          ],
        },
      ],
      steps: [
        { name: "Obre Comprimir PDF", text: "Obre l'eina Comprimir PDF de docusmart.online." },
        { name: "Tria el fitxer", text: "Selecciona el PDF que pesa massa." },
        { name: "Escull el nivell", text: "«Sense pèrdua» per a documents digitals; «Mitjana» o «Alta» per a escanejos i fotos." },
        { name: "Comprimeix", text: "Toca «Comprimeix PDF», revisa quant s'ha reduït i baixa el resultat." },
      ],
      faq: [
        ["Comprimir fa malbé el document?", "Amb «Sense pèrdua», no: el contingut queda idèntic. Amb «Mitjana» i «Alta» les pàgines es converteixen en imatges més lleugeres, que es llegeixen bé però perden el text seleccionable."],
        ["El meu PDF es puja a internet?", "No. La compressió es fa dins del navegador: el fitxer no surt mai del teu dispositiu."],
        ["Per què el meu PDF gairebé no s'ha reduït?", "Segurament és un PDF de text o ja venia optimitzat. En aquests casos el pes ja és baix i hi ha poc a treure."],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'signar-pdf-sense-imprimir',
      title: "Com signar un PDF sense imprimir-lo (des del mòbil o el PC) | DocuSmart",
      description:
        "Signa un document PDF sense imprimir ni escanejar: dibuixa la signatura, escriu-la o usa una foto. Quina validesa té una signatura electrònica simple. De franc i privat.",
      h1: "Com signar un PDF sense imprimir-lo",
      lead: "Imprimir, signar amb bolígraf, escanejar i tornar a enviar: quatre passos que pots substituir per un. Així se signa un PDF des del mòbil o l'ordinador.",
      sections: [
        {
          h2: "Tres maneres de crear la signatura",
          body: [
            { ul: [
              "**Dibuixar-la** amb el dit al mòbil o amb el ratolí a l'ordinador.",
              "**Escriure el teu nom**, que es mostra amb lletra manuscrita.",
              "**Pujar una foto** de la teva signatura feta en paper. És la que més s'assembla a la teva signatura de sempre.",
            ] },
            { tip: "Per a la foto: signa amb tinta fosca sobre un full blanc, amb bona llum i sense ombres. DocuSmart treu el fons perquè només en quedi el traç." },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Signar PDF](/firmar-pdf) i tria el document. Crea la signatura de qualsevol de les tres maneres.",
            "Arrossega-la al lloc on va la signatura i ajusta'n la mida. Si el document demana inicials a cada full, fes servir «Repetir a totes les pàgines». Toca «Signar PDF».",
          ],
        },
        {
          h2: "Si a més cal omplir dades",
          body: [
            "Molts documents per signar són formularis: nom, DNI, data. Si el PDF té camps emplenables, completa'ls primer amb [Omplir formulari](/llenar-formulario-pdf) i després signa'l. Abans d'enviar-lo, marca «Aplanar el formulari» perquè les respostes quedin fixes.",
          ],
        },
        {
          h2: "Errors habituals en signar",
          body: [
            { ul: [
              "**Signatura minúscula o pixelada:** fes-la més gran fins que ocupi l'espai de la línia de signatura; si ve d'una foto, fes-la amb bona llum i de prop.",
              "**Signatura damunt del text:** mou-la fins que no tapi dades del document; un contracte amb la signatura sobre una clàusula pot generar dubtes.",
              "**Signar la versió equivocada:** comprova que sigui el document final abans de signar; corregir-lo després obliga a tornar a signar.",
              "**Oblidar les altres pàgines:** si el document demana signatura o inicials a cada full, fes servir «Repetir a totes les pàgines» en lloc d'anar-hi una per una.",
            ] },
          ],
        },
        {
          h2: "Té validesa legal?",
          body: [
            "El que obtens és una **signatura electrònica simple**: la imatge de la teva signatura sobre el document, l'equivalent digital de signar a mà. Serveix per a la majoria de tràmits quotidians: contractes de lloguer, autoritzacions, documents d'empresa o permisos escolars.",
            "Alguns tràmits exigeixen una **signatura digital amb certificat**, emesa per un prestador de confiança reconegut (com el certificat digital de la FNMT, l'idCAT o el DNI electrònic); per exemple, determinats tràmits davant l'Administració o la facturació electrònica. Si el tràmit la demana explícitament, la signatura d'imatge no n'hi ha prou.",
          ],
        },
        {
          h2: "La teva signatura no es desa enlloc",
          body: [
            "La signatura i el document es processen dins del navegador. No es pugen a cap servidor ni queden desats: quan tanques la pàgina, la signatura s'esborra. Si has d'enviar el document per un canal poc fiable, li pots posar contrasenya amb [Protegir PDF](/proteger-pdf).",
          ],
        },
      ],
      steps: [
        { name: "Obre Signar PDF", text: "Obre l'eina Signar PDF de docusmart.online i tria el document." },
        { name: "Crea la signatura", text: "Dibuixa-la, escriu el teu nom o puja una foto de la signatura en paper." },
        { name: "Col·loca-la", text: "Arrossega-la al seu lloc i ajusta'n la mida; la pots repetir a totes les pàgines." },
        { name: "Baixa", text: "Toca «Signar PDF» per obtenir el PDF signat." },
      ],
      faq: [
        ["Puc signar des del mòbil?", "Sí. Al mòbil pots dibuixar la signatura amb el dit o fer una foto de la teva signatura en paper."],
        ["El document signat es pot modificar?", "La signatura queda incrustada a la pàgina. Per evitar canvis i accessos no desitjats, pots protegir el PDF amb contrasenya i treure el permís de modificar."],
        ["Puc signar diverses pàgines?", "Sí: afegeix la signatura a cada pàgina que vulguis o fes servir «Repetir a totes les pàgines»."],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'escanejar-documents-amb-el-mobil',
      title: "Com escanejar documents amb el mòbil i desar-los en PDF | DocuSmart",
      description:
        "Escaneja documents amb la càmera del mòbil, sense instal·lar apps: retall automàtic, filtre que treu ombres i PDF amb text cercable. Consells per a un escaneig nítid.",
      h1: "Com escanejar documents amb el mòbil",
      lead: "No et cal cap escàner ni instal·lar cap app: la càmera del mòbil i el navegador són suficients per obtenir un PDF net, retallat i amb el text reconegut.",
      sections: [
        {
          h2: "Què fa un escàner (i per què una foto sola no n'hi ha prou)",
          body: [
            "Una foto d'un full gairebé mai no surt perfecta: queda una mica inclinada, es veu la taula al voltant i el paper blanc apareix gris o amb ombres. Un escàner de mòbil ho corregeix: troba les quatre cantonades del full, l'endreça com si l'haguessis fotografiat des de dalt i blanqueja el fons.",
            "Això és el que fa [Escanejar document](/escanear-documento), directament al navegador.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Escanejar document](/escanear-documento) i toca «Fer foto»: al mòbil s'obre la càmera. També pots triar fotos que ja tinguis.",
            "Revisa les cantonades que ha trobat DocuSmart; si alguna ha quedat malament, arrossega-la fins a la punta del full. Tria el filtre «Document» per blanquejar el paper i treure ombres. Afegeix més pàgines si el document té diversos fulls.",
            "Toca «Crear PDF». Si marques «Fer el PDF cercable», a més es reconeix el text perquè puguis cercar paraules i copiar-les.",
          ],
        },
        {
          h2: "Cinc trucs per a un escaneig nítid",
          body: [
            { ul: [
              "Posa el full sobre una superfície fosca: el contrast ajuda a detectar les vores.",
              "Busca llum natural o un llum de costat; evita el flaix directe, que fa reflexos.",
              "Aguanta el mòbil paral·lel al full i espera que enfoqui.",
              "Aplana bé el full: els plecs fan ombres que el filtre no sempre treu.",
              "Si són diverses pàgines, escaneja-les totes en la mateixa sessió i sortiran en un sol PDF.",
            ] },
          ],
        },
        {
          h2: "Reconèixer el text d'un escaneig que ja tens",
          body: [
            "Si ja tens un PDF escanejat o una foto i necessites copiar-ne el text, fes servir [OCR: reconèixer text](/ocr-pdf): reconeix text imprès en 12 idiomes (català, castellà, anglès, francès, rus, japonès, xinès i més) i te'l dona per copiar, com a fitxer .txt o com a PDF cercable. Funciona millor amb escanejos nítids i rectes; la lletra a mà sol reconèixer-se malament.",
          ],
        },
        {
          h2: "Privat de principi a fi",
          body: [
            "La detecció de vores, l'endreçament, els filtres i el reconeixement de text es fan dins del navegador. Les fotos no es pugen a cap servidor. Si escaneges sovint, l'app de DocuSmart per a Android fa el mateix sense connexió.",
          ],
        },
      ],
      steps: [
        { name: "Obre Escanejar document", text: "Obre l'eina Escanejar document de docusmart.online i toca «Fer foto»." },
        { name: "Ajusta les cantonades", text: "Revisa el retall i arrossega les cantonades si cal." },
        { name: "Tria el filtre", text: "El filtre «Document» blanqueja el paper i treu ombres." },
        { name: "Desa el PDF", text: "Toca «Crear PDF»; marca «Fer el PDF cercable» per reconèixer el text." },
      ],
      faq: [
        ["Cal instal·lar una app?", "No. Funciona al navegador del mòbil o de l'ordinador. L'app d'Android és opcional, per escanejar sense connexió."],
        ["Què és un PDF cercable?", "Un PDF que, a més de la imatge, té el text reconegut: pots cercar paraules, seleccionar-les i copiar-les."],
        ["Què faig si no troba bé les vores?", "Arrossega cada cantonada fins a la punta del full o fes servir «Tota la foto». Ajuda que el paper contrasti amb el fons."],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'protegir-pdf-amb-contrasenya',
      title: "Com posar contrasenya a un PDF (i quan convé fer-ho) | DocuSmart",
      description:
        "Protegeix un PDF amb contrasenya i xifratge AES-256, controla si es pot imprimir o copiar i aprèn a compartir la clau de manera segura. De franc i sense pujar el fitxer.",
      h1: "Com posar contrasenya a un PDF",
      lead: "Un PDF amb les teves dades personals, financeres o mèdiques que viatja per correu o per xat pot acabar a qualsevol lloc. Posar-hi contrasenya costa un minut i evita que l'obri qui no l'ha d'obrir.",
      sections: [
        {
          h2: "Quan convé protegir un PDF",
          body: [
            { ul: [
              "Documents d'identitat, extractes bancaris, nòmines o declaracions de la renda.",
              "Historials clínics, resultats d'anàlisis o baixes mèdiques.",
              "Contractes o propostes que no vols que circulin.",
              "Qualsevol fitxer que hagis d'enviar per un canal que no controles, com un correu que es reenvia o un grup de xat.",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Protegir PDF](/proteger-pdf) i tria el document. Escriu la contrasenya dues vegades.",
            "Decideix què es permet amb el PDF obert: imprimir, copiar text o modificar-lo. Toca «Protegeix PDF» i es baixa la versió xifrada. S'obre amb Adobe Acrobat, Chrome, Edge i l'app de DocuSmart, que demanen la contrasenya.",
          ],
        },
        {
          h2: "Una bona contrasenya i com compartir-la",
          body: [
            { ul: [
              "Fes servir com a mínim 10 caràcters; una frase curta amb números és fàcil de recordar i difícil d'endevinar.",
              "No facis servir el teu DNI ni la teva data de naixement: és el primer que algú provaria.",
              "**No enviïs mai la contrasenya pel mateix mitjà que el PDF.** Si el fitxer va per correu, envia la clau per missatge o digues-la per telèfon.",
            ] },
            { tip: "Desa la contrasenya en un lloc segur. Si l'oblides, no es pot recuperar: ni DocuSmart pot obrir el PDF, perquè la clau no surt mai del teu dispositiu." },
          ],
        },
        {
          h2: "Què protegeix cada opció",
          body: [
            "La **contrasenya d'obertura** és la protecció de debò: sense ella, el fitxer xifrat no es pot llegir. Els **permisos** (imprimir, copiar, modificar) són una altra cosa: indiquen als lectors de PDF què han de permetre un cop obert el document.",
            "Els programes seriosos respecten aquests permisos, però qui ja té la contrasenya els pot treure amb algunes eines. Fes-los servir per evitar còpies accidentals o canvis casuals, no com a única barrera. Si algú no ha de veure una dada, no li donis la contrasenya o tatxa aquesta dada abans d'enviar el fitxer.",
          ],
        },
        {
          h2: "Contrasenya no és el mateix que tatxar",
          body: [
            "La contrasenya impedeix obrir el fitxer, però qui la tingui veurà tot el contingut. Si necessites compartir un document amagant només certes dades (un número de compte, una adreça), fes servir [Tatxar PDF](/censurar-pdf): elimina de debò el text de sota les zones tapades, en lloc de posar-hi un simple requadre negre a sobre.",
          ],
        },
        {
          h2: "Treure la contrasenya després",
          body: [
            "Si més endavant necessites una còpia sense protecció, [Desbloquejar PDF](/desbloquear-pdf) la treu, sempre que coneguis la contrasenya. Fes-lo servir només amb documents propis o que tinguis dret a modificar.",
          ],
        },
      ],
      steps: [
        { name: "Obre Protegir PDF", text: "Obre l'eina Protegir PDF de docusmart.online i tria el document." },
        { name: "Escriu la contrasenya", text: "Escriu-la dues vegades per confirmar-la." },
        { name: "Tria els permisos", text: "Marca si es permet imprimir, copiar o modificar." },
        { name: "Protegeix i baixa", text: "Toca «Protegeix PDF» i es baixa el document xifrat." },
      ],
      faq: [
        ["Fins a quin punt és segur?", "Fa servir xifratge AES-256, l'estàndard més fort dels PDF. La seguretat real depèn que la contrasenya sigui difícil d'endevinar."],
        ["La meva contrasenya s'envia a algun servidor?", "No. El xifratge es fa al navegador; ni el fitxer ni la contrasenya surten del teu dispositiu."],
        ["Puc treure la contrasenya a un PDF d'una altra persona?", "Només si en coneixes la contrasenya. DocuSmart no trenca contrasenyes d'obertura."],
      ],
    },
    'dividir-pdf-en-varios-archivos': {
      slug: 'dividir-pdf-en-diversos-fitxers',
      title: "Com dividir un PDF en diversos fitxers o extreure'n pàgines | DocuSmart",
      description:
        "Separa un PDF per pàgines, per intervals, cada N pàgines, per marcadors o per mida, o extreu només les pàgines que necessites. De franc i sense pujar el fitxer.",
      h1: "Com dividir un PDF en diversos fitxers o extreure'n només unes pàgines",
      lead: "Un portal només demana la pàgina de la signatura, o un PDF de 80 pàgines no cap al correu. Així se separa un PDF en parts, o se n'extreuen les pàgines justes, des del navegador.",
      sections: [
        {
          h2: "Sis maneres de dividir",
          body: [
            "Abans de començar convé saber què necessites, perquè [Dividir PDF](/dividir-pdf) té un mode per a cada cas:",
            { ul: [
              "**Tria pàgines**: toques les miniatures (o escrius «1-3, 5») i en surt un PDF només amb aquestes pàgines.",
              "**Per intervals**: diversos intervals alhora, i cadascun surt com un PDF a part.",
              "**Cada N pàgines**: parts iguals, per exemple de 10 en 10.",
              "**Per marcadors**: un PDF per cada capítol, si el document té índex de marcadors.",
              "**Per mida**: parts que no passen d'un pes determinat, per a correus o portals amb límit.",
              "**Cada pàgina per separat**: un PDF per pàgina.",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Dividir PDF](/dividir-pdf) i tria el fitxer. Veuràs les pàgines en miniatura. A «Tria pàgines», toca les que vols endur-te: queden marcades en blau i el camp de dalt s'omple sol.",
            "Toca el botó de baix. En acabar veuràs el resultat al costat de l'original per revisar-lo, i el baixes amb el nom que vulguis. Si el mode genera diversos fitxers, els tens un per un o tots junts en un ZIP.",
            { tip: "Per treure pàgines soltes de diversos PDF i ajuntar-les en un de sol, és més ràpid [Unir PDF](/unir-pdf): allà pots triar quines pàgines agafes de cada fitxer." },
          ],
        },
        {
          h2: "Si les parts encara pesen massa",
          body: [
            "Dividir no canvia la qualitat: cada pàgina es copia tal com és. Si una part continua passant del límit, fes servir el mode **Per mida** o passa-la per [Comprimir PDF](/comprimir-pdf). Una sola pàgina escanejada a molta resolució pot pesar més que el límit per si sola: en aquest cas, el que funciona és comprimir-la.",
          ],
        },
        {
          h2: "Casos habituals",
          body: [
            { ul: [
              "Un portal només demana el teu DNI per les dues cares: tria aquestes dues pàgines i puja només aquest PDF.",
              "Un extracte de tot l'any: si té marcadors per mes, fes servir **Per marcadors**; si no, **Cada N pàgines**.",
              "Un correu amb límit de 10 MB: fes servir **Per mida**, posa-hi 10 i cada part queda per sota.",
            ] },
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "La divisió es fa al teu navegador: el PDF no es puja a cap servidor. Per això la pots fer servir amb extractes, historials clínics o contractes sense deixar-ne còpies enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre Dividir PDF", text: "Obre l'eina Dividir PDF de docusmart.online i tria el fitxer." },
        { name: "Tria el mode", text: "Tria pàgines, per intervals, cada N pàgines, per marcadors, per mida o cada pàgina per separat." },
        { name: "Marca les pàgines", text: "Toca les miniatures o escriu els números (per exemple, 1-3, 5)." },
        { name: "Divideix i baixa", text: "Toca el botó i baixa el resultat, o tots els fitxers en un ZIP." },
      ],
      faq: [
        ["Es perd qualitat en dividir?", "No. Les pàgines es copien tal com són, amb el text i les imatges originals."],
        ["Puc dividir un PDF amb contrasenya?", "Si només té restriccions (s'obre sense contrasenya), sí. Si demana contrasenya per obrir-se, treu-la primer amb Desbloquejar PDF."],
        ["Què passa amb els marcadors?", "En el mode Per marcadors, cada capítol de l'índex surt com un PDF amb el nom del marcador."],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'girar-pagines-pdf',
      title: "Com girar les pàgines d'un PDF i desar-les així | DocuSmart",
      description:
        "Redreça les pàgines escanejades de costat o del revés: gira'n una o totes, 90° a l'esquerra o a la dreta, i desa el PDF ja dret. De franc i sense pujar-lo.",
      h1: "Com girar les pàgines d'un PDF (i que quedin així en desar-lo)",
      lead: "Passa molt amb els escanejos: un full horitzontal ha quedat de costat, o una pàgina ha sortit del revés. Girar-la al visor no serveix, perquè quan l'envies es torna a veure malament. Així es corregeix al fitxer.",
      sections: [
        {
          h2: "Per què no n'hi ha prou de girar-lo al visor",
          body: [
            "Els visors de PDF permeten girar la vista, però aquest gir no es desa al fitxer: qui el rebi el tornarà a veure tort. Perquè quedi bé cal canviar l'orientació de la pàgina al mateix PDF, que és el que fa [Girar PDF](/rotar-pdf).",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Girar PDF](/rotar-pdf) i tria el fitxer. Cada pàgina apareix en miniatura amb el gir actual a sota (0°, 90°…). Toca una pàgina per girar-la 90°, o fes servir les fletxes de cadascuna per anar a l'esquerra o a la dreta. Si tot el document està de costat, fes servir «Totes a l'esquerra» o «Totes a la dreta».",
            "Quan totes es vegin dretes, toca «Gira el PDF» i baixa el resultat. Només canvia l'orientació: el text, les imatges i la qualitat queden igual.",
            { tip: "Si a més les pàgines han quedat desordenades (passa en escanejar per les dues cares), continua amb [Ordenar pàgines](/ordenar-paginas-pdf)." },
          ],
        },
        {
          h2: "Escanejos que surten torts",
          body: [
            "Girar serveix per a fulls de costat o del revés, en salts de 90°. Si la foto ha quedat inclinada uns quants graus, val més tornar-la a escanejar amb [Escanejar document](/escanear-documento), que detecta les vores del full i el redreça sol.",
          ],
        },
        {
          h2: "Casos habituals",
          body: [
            "En escanejar a doble cara és habitual que el revers surti del revés: toca aquestes pàgines dues vegades per girar-les 180°. En un informe amb taules horitzontals, gira només aquestes pàgines perquè es puguin llegir sense girar el cap; les altres queden com estan.",
            "Si el PDF ve de fotos del mòbil, revisa l'orientació en crear-lo: [Imatge a PDF](/imagen-a-pdf) té orientació automàtica, vertical o horitzontal, i així no l'hauràs de girar després.",
          ],
        },
        {
          h2: "Privat de principi a fi",
          body: [
            "El PDF es gira dins del teu navegador. No es puja a cap servidor i no queda desat enlloc: quan tanques la pestanya, desapareix. Funciona igual a l'ordinador i al mòbil, i un cop carregada la pàgina no necessita bona cobertura.",
          ],
        },
      ],
      steps: [
        { name: "Obre Girar PDF", text: "Obre l'eina Girar PDF de docusmart.online i tria el PDF." },
        { name: "Gira les pàgines", text: "Toca cada pàgina que estigui de costat, o fes servir Totes a l'esquerra o Totes a la dreta." },
        { name: "Desa", text: "Toca Gira el PDF i baixa el fitxer ja dret." },
      ],
      faq: [
        ["Puc girar només una pàgina?", "Sí. Cada pàgina es gira per separat; les altres queden com estaven."],
        ["Es perd qualitat?", "No. Només canvia l'orientació de la pàgina; el contingut no es torna a comprimir."],
        ["Funciona al mòbil?", "Sí, en qualsevol navegador modern, a Android i a iPhone."],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'canviar-ordre-pagines-pdf',
      title: "Com canviar l'ordre de les pàgines d'un PDF | DocuSmart",
      description:
        "Mou les pàgines d'un PDF arrossegant-les, duplica'n una, afegeix-hi pàgines en blanc o treu les que sobren, i desa el nou ordre. De franc i sense pujar el fitxer.",
      h1: "Com canviar l'ordre de les pàgines d'un PDF",
      lead: "Un escaneig a doble cara que ha sortit intercalat, un annex que havia d'anar al principi o una pàgina repetida: així s'ordena un PDF pàgina per pàgina.",
      sections: [
        {
          h2: "Què pots fer amb cada pàgina",
          body: [
            "A [Ordenar pàgines](/ordenar-paginas-pdf) cada pàgina és una targeta, i amb ella pots:",
            { ul: [
              "**Moure-la**: arrossegant-la al seu lloc, o amb les fletxes d'abans i després (més còmode al mòbil).",
              "**Duplicar-la**: per exemple, per repetir una portada o un full de signatures.",
              "**Afegir una pàgina en blanc** al darrere, per deixar espai o separar seccions.",
              "**Treure-la** si sobra.",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Ordenar pàgines](/ordenar-paginas-pdf) i tria el PDF. Mou les pàgines fins a deixar-les com les necessites: el número de cada targeta («Pàg. 2», «Pàg. 1»…) et recorda d'on venia, i així no et perds.",
            "Quan l'ordre sigui correcte, toca «Aplica el nou ordre» i baixa el PDF. Les pàgines es copien tal com són: no canvia ni el text ni la qualitat.",
            { tip: "Si les pàgines que vols ordenar són en diversos fitxers, primer uneix-los amb [Unir PDF](/unir-pdf) i després ordena'ls aquí." },
          ],
        },
        {
          h2: "Per treure pàgines, millor dividir",
          body: [
            "Si el que vols és quedar-te només amb algunes pàgines, [Dividir PDF](/dividir-pdf) és més ràpid: marques les que t'endús i llestos. Ordenar serveix quan el document sencer es queda, però en un altre ordre.",
          ],
        },
        {
          h2: "Casos habituals",
          body: [
            "En escanejar a doble cara amb un aparell que no ho fa sol, primer surten totes les cares de davant i després les de darrere. Per intercalar-les, mou l'última pàgina darrere de la primera, la penúltima darrere de la tercera i així fins al final: amb les fletxes es fa de pressa.",
            { ul: [
              "Un annex que havia d'anar al principi: mou-lo abans de la primera pàgina.",
              "Un full de signatures que va en dos llocs: duplica'l i porta la còpia on calgui.",
              "Capítols que han de començar en pàgina senar en imprimir a doble cara: afegeix-hi una pàgina en blanc al davant.",
            ] },
          ],
        },
        {
          h2: "Sense pujar els teus fitxers",
          body: [
            "El nou ordre es munta al teu navegador. El document no viatja per internet ni en queda cap còpia en cap servidor. Per això pots ordenar amb tranquil·litat expedients, historials clínics o documents de feina que no haurien de sortir del teu equip.",
          ],
        },
      ],
      steps: [
        { name: "Obre Ordenar pàgines", text: "Obre l'eina Ordenar pàgines de docusmart.online i tria el PDF." },
        { name: "Mou les pàgines", text: "Arrossega-les o fes servir les fletxes; duplica, afegeix pàgines en blanc o treu les que sobren." },
        { name: "Aplica i baixa", text: "Toca Aplica el nou ordre i baixa el PDF ordenat." },
      ],
      faq: [
        ["Puc ordenar des del mòbil?", "Sí. A més d'arrossegar, cada pàgina té fletxes per moure-la abans o després, que són més fàcils amb el dit."],
        ["Es mantenen els enllaços i els formularis?", "Les pàgines es copien amb el seu contingut; revisa el resultat si el document té formularis complexos."],
        ["Hi ha un límit de pàgines?", "No hi ha un nombre fix; amb documents molt grans pot trigar una mica més a mostrar les miniatures."],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'posar-numeros-pagina-pdf',
      title: "Com posar números de pàgina a un PDF | DocuSmart",
      description:
        "Afegeix números de pàgina a un PDF: posició, format «1», «1 / 10» o «Pàgina 1 de 10», número inicial i portada sense número. De franc i sense pujar-lo.",
      h1: "Com posar números de pàgina a un PDF",
      lead: "Una tesi, un informe o un expedient es revisen molt millor amb les pàgines numerades. Així es numera un PDF que no té números, amb el format que et demanin.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Numerar pàgines](/numerar-paginas-pdf) i tria el PDF. Tria on va el número (a dalt o a baix, a l'esquerra, al centre o a la dreta) i el format: «1», «1 / 10» o «Pàgina 1 de 10».",
            "Toca «Numera pàgines». Veuràs l'abans i el després un al costat de l'altre, pàgina per pàgina, per comprovar que el número no tapa res. Després el baixes.",
          ],
        },
        {
          h2: "Opcions que resolen casos habituals",
          body: [
            { ul: [
              "**Sense número a les primeres**: posa 1 per no numerar la portada, o més si hi ha índex o dedicatòria.",
              "**Comença a**: perquè la numeració continuï la d'un altre document, per exemple des de la 25.",
              "**Text**: escriu-hi el teu, per exemple «Foli {n}» o «{n} de {total}»; {n} és el número de la pàgina i {total}, l'últim.",
              "**Mida i color**: petita, mitjana o gran, i el color que vulguis.",
            ] },
            { tip: "Si el document està repartit en diversos fitxers, uneix-los primer amb [Unir PDF](/unir-pdf) perquè la numeració sigui contínua." },
          ],
        },
        {
          h2: "Que el número no tapi el contingut",
          body: [
            "Molts documents ja porten alguna cosa al peu de pàgina (un logotip, una adreça). Si el número hi cau a sobre, canvia'l de cantonada o puja'l a dalt: l'abans i el després et mostren cada pàgina abans de baixar-la, i pots passar d'una a l'altra amb les fletxes.",
          ],
        },
        {
          h2: "Numera al final",
          body: [
            "El número queda dibuixat a cada pàgina. Si després reordenes o afegeixes pàgines, els números es mouen amb elles i deixen de ser correlatius. Per això convé numerar al final: primer uneix, ordena i treu el que sobra, i numera la versió definitiva.",
            "En documents per a administracions o expedients, on es parla de folis, escriu «Foli {n}» al text. I si el document continua la numeració d'un altre, ajusta «Comença a».",
          ],
        },
        {
          h2: "Tot al teu navegador",
          body: [
            "La numeració s'afegeix al teu equip: el PDF no es puja a cap servidor. El text del document continua sent text: es pot cercar i copiar igual que abans, i el número també queda com a text, nítid en imprimir.",
          ],
        },
      ],
      steps: [
        { name: "Obre Numerar pàgines", text: "Obre l'eina Numerar pàgines de docusmart.online i tria el PDF." },
        { name: "Tria posició i format", text: "Per exemple, a baix a la dreta i «Pàgina 1 de 10»." },
        { name: "Ajusta el que calgui", text: "Sense número a la portada, des de quin número començar, mida i color." },
        { name: "Numera i baixa", text: "Revisa l'abans i el després i baixa el PDF numerat." },
      ],
      faq: [
        ["Puc no numerar la portada?", "Sí. A «Sense número a les primeres» posa 1 (o les pàgines que vulguis saltar)."],
        ["Puc començar per un altre número?", "Sí. A «Comença a» hi poses el primer número, per exemple 25."],
        ["Es pot escriure «Foli» abans del número?", "Sí. Al text escriu «Foli {n}» i cada pàgina mostrarà el seu número en lloc de {n}."],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'posar-marca-aigua-pdf',
      title: "Com posar una marca d'aigua a un PDF (text o logotip) | DocuSmart",
      description:
        "Afegeix «CONFIDENCIAL», «CÒPIA» o el teu logotip a un PDF: posició, mosaic, angle, mida, opacitat i pàgines. De franc, al navegador i sense pujar el fitxer.",
      h1: "Com posar una marca d'aigua a un PDF (text o logotip)",
      lead: "Per enviar una proposta com a esborrany, marcar una còpia del teu DNI amb «Només per al tràmit X» o posar el teu logotip en un catàleg: així s'afegeix una marca d'aigua a un PDF.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Marca d'aigua](/marca-de-agua-pdf) i tria el PDF. Escriu el text (hi ha «CONFIDENCIAL» d'exemple) o canvia a «Imatge o logotip» per fer servir el teu.",
            "Toca «Aplica la marca d'aigua»: veuràs l'abans i el després un al costat de l'altre. Si vols canviar alguna cosa, ajusta-la i torna-la a aplicar; quan t'agradi, baixa el PDF.",
          ],
        },
        {
          h2: "Com ajustar-la",
          body: [
            { ul: [
              "**Posició**: al centre, en una cantonada o en una vora, o en **mosaic** perquè es repeteixi per tota la pàgina.",
              "**Rotació**: 0°, 45°, 90° o −45°. La diagonal és la més clàssica i la més difícil de retallar.",
              "**Mida, opacitat i color**: una opacitat baixa (20 %) deixa llegir el document; més alta la fa més visible.",
              "**Damunt o darrere del contingut**: darrere queda més discreta en documents amb molt text.",
              "**Pàgines**: totes, o només algunes (per exemple, 1-3, 5).",
            ] },
          ],
        },
        {
          h2: "Una marca d'aigua per a còpies de documents",
          body: [
            "Si et demanen una còpia del teu DNI o d'un extracte, posa-hi una marca com «Només per al tràmit del lloguer, gener 2026» en mosaic. Així, si la còpia acaba en un altre lloc, es veu per a què la vas lliurar.",
            { tip: "Si a més vols que no la puguin obrir sense una contrasenya, després passa-la per [Protegir PDF](/proteger-pdf)." },
          ],
        },
        {
          h2: "Idees de text",
          body: [
            { ul: [
              "«ESBORRANY» per a versions que encara no són definitives.",
              "«CÒPIA» o «CÒPIA CONTROLADA» per a documents que es reparteixen.",
              "«Només per a [tràmit] — [data]» en còpies de documents d'identitat.",
              "«MOSTRA» en catàlegs, plantilles o treballs que encara no s'han pagat.",
            ] },
            "Perquè la marca es llegeixi sense destorbar el document, una opacitat d'entre el 15 % i el 30 % sol funcionar bé. En mosaic, una mida petita o mitjana queda més neta. Abans de baixar-lo, revisa diverses pàgines a l'abans i el després.",
          ],
        },
        {
          h2: "Sense pujar el document",
          body: [
            "La marca s'afegeix dins del teu navegador. El PDF no es puja a cap servidor, una cosa important precisament amb els documents que necessiten marca d'aigua: còpies de documents d'identitat, propostes comercials o documents interns.",
          ],
        },
      ],
      steps: [
        { name: "Obre Marca d'aigua", text: "Obre l'eina Marca d'aigua de docusmart.online i tria el PDF." },
        { name: "Escriu el text o tria el logotip", text: "Per exemple, «CONFIDENCIAL» o «CÒPIA»." },
        { name: "Ajusta posició i estil", text: "Centre o mosaic, angle, mida, opacitat, color i pàgines." },
        { name: "Aplica i baixa", text: "Revisa l'abans i el després i baixa el PDF." },
      ],
      faq: [
        ["Puc fer servir el meu logotip?", "Sí. Tria «Imatge o logotip» i puja una imatge; un PNG amb fons transparent queda millor."],
        ["Es pot treure després?", "Queda dibuixada al PDF. Desa l'original sense marca per si el tornes a necessitar."],
        ["Puc posar-la només en algunes pàgines?", "Sí. A «Pàgines» escriu quines, per exemple 1-3, 5."],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'editar-pdf-sense-programes',
      title: "Com editar un PDF sense instal·lar programes | DocuSmart",
      description:
        "Afegeix o substitueix text, ressalta, tapa, dibuixa, posa fletxes, imatges i enllaços en un PDF des del navegador, sense instal·lar res i sense pujar el fitxer.",
      h1: "Com editar un PDF sense instal·lar programes",
      lead: "Corregir una data, completar una dada que faltava, ressaltar una clàusula o ratllar alguna cosa: per a això no cal un programa de pagament. Així s'edita un PDF al navegador.",
      sections: [
        {
          h2: "Les eines de l'editor",
          body: [
            "A sobre de la pàgina tens una barra amb tot el que pots afegir a [Editar PDF](/editar-pdf):",
            { ul: [
              "**Text**: toques la pàgina on vols escriure i escrius al quadre de sota; tries la lletra, la mida, la negreta i el color.",
              "**Substitueix**: toques un text que ja té el PDF i el canvies; l'original s'esborra del document, no només es tapa.",
              "**Rectangle, Cercle, Ressaltar i Tapar**: per marcar, subratllar o cobrir amb blanc.",
              "**Dibuixar, Línia i Fletxa**: per assenyalar o fer anotacions a mà.",
              "**Imatge i Enllaç**: per enganxar un segell o un logotip, o enllaçar a una pàgina web o a una altra pàgina del PDF.",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Editar PDF](/editar-pdf) i tria el fitxer. Tria «Text» a la barra i toca la pàgina on va: apareix un quadre que pots moure, i escrius al tauler de sota. Amb «Seleccionar» toques qualsevol element per moure'l, canviar-ne la mida o treure'l.",
            "Si t'equivoques, fes servir «Desfés». Quan acabis, toca «Aplicar canvis» i baixa el PDF editat.",
            { tip: "El text admet qualsevol alfabet (llatí, ciríl·lic, grec, xinès, japonès o coreà). Els emojis no es desen al PDF." },
          ],
        },
        {
          h2: "Per signar o omplir formularis hi ha eines pròpies",
          body: [
            "Si el que necessites és signar, [Signar PDF](/firmar-pdf) et permet dibuixar, escriure o pujar la teva signatura i posar-la on va. I si el PDF té camps per omplir, [Omplir formulari](/llenar-formulario-pdf) te'ls mostra un per un, més còmode que escriure-hi a sobre.",
          ],
        },
        {
          h2: "Consells perquè el canvi no es noti",
          body: [
            "Per corregir un text que ja és al document, fes servir **Substitueix**: esborra l'original i posa el nou al seu lloc. Si només el tapes amb un quadre blanc, el text antic continua al fitxer.",
            "Tria la lletra més semblant a la del document (Sans, Serif o Mono) i ajusta la mida fins que coincideixi. Al mòbil, mou els elements amb calma: també en pots canviar la posició des del teclat amb les fletxes.",
          ],
        },
        {
          h2: "El teu fitxer es queda amb tu",
          body: [
            "Tot l'editor funciona dins del teu navegador: el PDF no es puja a cap servidor, ni mentre l'edites ni quan el deses.",
          ],
        },
      ],
      steps: [
        { name: "Obre Editar PDF", text: "Obre l'eina Editar PDF de docusmart.online i tria el fitxer." },
        { name: "Tria què vols afegir", text: "Text, substituir, formes, ressaltat, dibuix, fletxes, imatge o enllaç." },
        { name: "Col·loca-ho a la pàgina", text: "Toca la pàgina, escriu o dibuixa, i mou-ho amb Seleccionar." },
        { name: "Aplica i baixa", text: "Toca Aplicar canvis i baixa el PDF editat." },
      ],
      faq: [
        ["Puc canviar un text que ja té el PDF?", "Sí, amb «Substitueix»: toques el text, escrius el nou i l'original s'esborra del document."],
        ["Funciona amb PDF escanejats?", "Hi pots afegir text, formes i dibuixos a sobre. Per substituir text, el PDF ha de tenir text real; si és una foto, primer passa'l per OCR."],
        ["Cal instal·lar res?", "No. Funciona al navegador de l'ordinador o del mòbil."],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'comparar-dues-versions-pdf',
      title: "Com comparar dues versions d'un PDF i veure què ha canviat | DocuSmart",
      description:
        "Compara dos PDF i mira quines paraules s'han afegit o eliminat, o compara'ls pàgina per pàgina per veure canvis en imatges i disseny. De franc i sense pujar-los.",
      h1: "Com comparar dues versions d'un PDF i veure què ha canviat",
      lead: "Et tornen un contracte «amb uns quants ajustos» i no et diuen quins. Llegir-lo dues vegades buscant diferències és lent i se t'escapen coses. Així es comparen dues versions en segons.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Comparar PDF](/comparar-pdf). Tria primer l'**Original** i després la **Versió nova**. Si els has posat al revés, el botó «Intercanviar» els canvia de lloc.",
            "Toca «Comparar». A dalt veuràs quantes paraules s'han afegit i quantes s'han eliminat, i a sota cada canvi amb la seva pàgina: el que s'ha tret, ratllat en vermell, i el que s'ha afegit, en verd, amb unes quantes línies de context per situar-lo.",
          ],
        },
        {
          h2: "Text o visual",
          body: [
            { ul: [
              "**Text**: compara les paraules. És el millor per a contractes, cartes i informes. Pots ignorar les majúscules i la puntuació perquè no comptin com a canvis.",
              "**Visual (pàgina per pàgina)**: compara com es veu cada pàgina. Serveix per a plànols, dissenys o documents escanejats, on els canvis poden ser imatges o taules i no només text.",
            ] },
            { tip: "En un contracte, revisa sobretot els canvis en imports, dates i noms: la comparació els mostra encara que siguin d'una sola xifra." },
          ],
        },
        {
          h2: "Després de comparar",
          body: [
            "Si has trobat alguna cosa per corregir, ho pots fer amb [Editar PDF](/editar-pdf). I quan les dues parts hi estiguin d'acord, signa la versió final amb [Signar PDF](/firmar-pdf).",
          ],
        },
        {
          h2: "Què mostra i què no",
          body: [
            "Cada canvi apareix amb el número de pàgina i amb les línies del voltant, per situar-lo ràpidament al document. Si un paràgraf sencer s'ha mogut de lloc sense canviar, es marca com a mogut en lloc de comptar-lo com a eliminat i afegit.",
            "Si els dos fitxers no tenen gairebé res en comú (per exemple, has triat un document equivocat), l'eina t'avisa en lloc de mostrar centenars de canvis. I si són idèntics, també t'ho diu, fins i tot quan tenen un nombre de pàgines diferent.",
            "Serveix per a contractes, pressupostos, reglaments, propostes que passen per diverses mans o la tesi que torna amb correccions del tutor: en tots aquests casos, saber exactament què ha canviat estalvia haver-ho de rellegir tot.",
          ],
        },
        {
          h2: "Els teus documents no es pugen",
          body: [
            "Els dos PDF es comparen al teu navegador: cap no es puja a un servidor. El pots fer servir amb tranquil·litat amb contractes i documents confidencials, perquè cap de les dues versions queda desada enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre Comparar PDF", text: "Obre l'eina Comparar PDF de docusmart.online." },
        { name: "Tria els dos fitxers", text: "Primer l'original i després la versió nova." },
        { name: "Tria com comparar", text: "Text (paraules) o Visual (pàgina per pàgina)." },
        { name: "Revisa els canvis", text: "El que s'ha tret surt ratllat en vermell i el que s'ha afegit, en verd, amb la seva pàgina." },
      ],
      faq: [
        ["Compara PDF escanejats?", "En el mode Visual sí, perquè compara com es veu cada pàgina. El mode Text necessita que el PDF tingui text real."],
        ["Importa l'ordre dels fitxers?", "Sí: el que hi ha a la versió nova i no a l'original surt com a afegit. Si t'has equivocat, fes servir Intercanviar."],
        ["Es pot ignorar si ha canviat una majúscula o una coma?", "Sí. Marca «Ignora majúscules» o «Ignora la puntuació»."],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'tapar-dades-personals-pdf',
      title: "Com tapar dades personals en un PDF (de veritat) | DocuSmart",
      description:
        "Tatxa números de document, comptes, correus o noms en un PDF: cerca'ls i marca'ls a totes les pàgines i s'eliminen del fitxer, no només queden tapats.",
      h1: "Com tapar dades personals en un PDF (de veritat)",
      lead: "Abans de compartir un extracte, un contracte o un historial clínic, sovint cal amagar números de compte o de document. Posar-hi un quadre negre a sobre no n'hi ha prou: així es fa bé.",
      sections: [
        {
          h2: "Per què no n'hi ha prou amb un quadre negre",
          body: [
            "Si en un editor qualsevol poses un rectangle negre sobre un número, el número continua al fitxer: només cal seleccionar-lo i copiar-lo, o obrir el PDF amb un altre programa, per llegir-lo. Tatxar de veritat és **eliminar** el que hi ha a sota, i això és el que fa [Tatxar PDF](/censurar-pdf).",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Tatxar PDF](/censurar-pdf) i tria el fitxer. Pots cercar un nom, un número o una paraula i es marca a totes les pàgines alhora. També pots marcar d'una vegada tots els **Correus** o tots els **Números** (documents, telèfons, comptes), o arrossegar sobre la pàgina per tapar una zona a mà.",
            "Revisa cada pàgina: si toques una zona, la mous o la treus. Quan estigui tot, toca «Tatxar PDF» i baixa el resultat.",
            { tip: "Les pàgines amb zones marcades es converteixen en imatge perquè el que s'ha tapat desaparegui del fitxer. La resta del text d'aquestes pàgines es continua podent cercar i copiar." },
          ],
        },
        {
          h2: "Revisa-ho abans d'enviar-ho",
          body: [
            "La cerca troba el que està escrit com a text. Si una part del document és una foto o un escaneig, les dades que hi apareguin no surten a la cerca: marca-les a mà arrossegant sobre la pàgina. I desa l'original a part, perquè el que s'ha tatxat no es pot recuperar.",
            "Si el document ha de quedar en mans d'altres, també hi pots posar una contrasenya amb [Protegir PDF](/proteger-pdf) o una [marca d'aigua](/marca-de-agua-pdf) que digui per a què el vas lliurar.",
          ],
        },
        {
          h2: "Què sol caldre tapar",
          body: [
            { ul: [
              "Números de document d'identitat i de comptes bancaris.",
              "Adreces, telèfons i correus.",
              "Signatures i fotos de documents.",
              "Dades de salut, sous o informació de tercers.",
            ] },
          ],
        },
        {
          h2: "Sense pujar el document",
          body: [
            "Tot el procés passa al teu navegador: el document amb les dades sense tapar no surt mai del teu equip. És just el que convé en tatxar: si pugessis l'original a un servei en línia per tapar-lo, les dades ja haurien sortit de les teves mans.",
          ],
        },
      ],
      steps: [
        { name: "Obre Tatxar PDF", text: "Obre l'eina Tatxar PDF de docusmart.online i tria el fitxer." },
        { name: "Marca el que cal amagar", text: "Cerca un text, marca tots els correus o números, o arrossega sobre la pàgina." },
        { name: "Revisa cada pàgina", text: "Toca una zona per moure-la o treure-la." },
        { name: "Tatxa i baixa", text: "Toca Tatxar PDF: el que s'ha tapat s'elimina del fitxer." },
      ],
      faq: [
        ["Es pot recuperar el que s'ha tatxat?", "No. El que tapes s'elimina del fitxer; per això convé desar l'original a part."],
        ["Serveix amb PDF escanejats?", "Sí, marcant les zones a mà. La cerca automàtica només troba el que està escrit com a text."],
        ["La resta del document es continua podent cercar?", "Sí. Només les pàgines amb zones marcades es converteixen en imatge, i el text que hi queda es conserva per cercar i copiar."],
      ],
    },
  },
}
