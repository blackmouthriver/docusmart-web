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
    'pasar-un-pdf-escaneado-a-texto': {
      slug: 'pdf-escanejat-a-text',
      title: "Com passar un PDF escanejat a text que es pugui copiar i cercar | DocuSmart",
      description:
        "Reconeix el text d'un PDF escanejat amb OCR: copia'l, baixa'l en .txt o Word, o crea un PDF cercable. En 12 idiomes, gratis i sense pujar el fitxer.",
      h1: "Com passar un PDF escanejat a text que es pugui copiar i cercar",
      lead: "Un escaneig és una foto de cada pàgina: es pot llegir, però no se'n pot copiar el text ni cercar-hi una paraula. Amb l'OCR el text torna a ser text, sense haver-lo d'escriure de nou.",
      sections: [
        {
          h2: "Què fa l'OCR",
          body: [
            "OCR vol dir reconeixement òptic de caràcters: el programa mira la imatge de cada pàgina i en reconeix les lletres. [OCR: reconèixer text](/ocr-pdf) et dona dues coses alhora:",
            { ul: [
              "**El text reconegut**, per copiar-lo o baixar-lo en .txt o Word, amb la pàgina d'on surt cada part.",
              "**Un PDF cercable**: el mateix escaneig, idèntic a la vista, amb una capa de text invisible a sobre. Hi pots seleccionar, copiar i cercar paraules amb Ctrl+F.",
            ] },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [OCR: reconèixer text](/ocr-pdf) i tria el PDF escanejat (també serveix una foto en JPG, PNG o WebP). Tria l'**Idioma del document**: el reconeixement encerta molt més quan sap quin idioma ha d'esperar. Si el document barreja el seu idioma amb l'anglès, marca també aquesta casella.",
            "Deixa marcat **Genera també un PDF cercable** si vols el PDF, i toca **Reconeix el text**. Veuràs l'avenç pàgina per pàgina. En acabar tens el PDF per baixar i, a sota, el text, que pots copiar o baixar en .txt o Word.",
            { tip: "La primera vegada es baixa el model de l'idioma (uns segons) i queda desat al navegador: les vegades següents comença de seguida." },
          ],
        },
        {
          h2: "Com aconseguir un resultat millor",
          body: [
            "L'OCR llegeix el que veu. Un escaneig nítid, recte i amb bona llum es reconeix gairebé sense errors; una foto borrosa, amb ombres o molt petita, no. Si el reconeixement no és segur, DocuSmart t'avisa amb el percentatge de confiança perquè revisis el text.",
            { ul: [
              "Les pàgines girades es detecten i es llegeixen al dret automàticament.",
              "Les pàgines que ja tenen text (un PDF mixt) es deixen tal com són, tret que marquis **Reconèixer també les pàgines que ja tenen text**.",
              "Funciona amb lletra impresa. La lletra manuscrita gairebé mai no es reconeix bé.",
            ] },
          ],
        },
        {
          h2: "Si el que vols és editar-lo al Word",
          body: [
            "Si el teu objectiu és corregir el document i no només copiar-ne el text, fes servir directament [PDF a Word](/pdf-a-word) amb la casella d'OCR: reconeix les pàgines escanejades en el mateix pas i crea un .docx editable. I si el PDF cercable ha quedat massa pesant per enviar-lo, passa'l per [Comprimir PDF](/comprimir-pdf).",
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "El reconeixement funciona al teu navegador amb Tesseract, un motor d'OCR de codi obert. El PDF no es puja a cap servidor, així que el pots fer servir amb documents d'identitat, historials clínics o extractes sense deixar-ne còpies enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre l'OCR", text: "Obre l'eina OCR: reconèixer text de docusmart.online i tria el PDF escanejat o una foto." },
        { name: "Tria l'idioma", text: "Tria l'idioma del document i marca si també té text en anglès." },
        { name: "Reconeix el text", text: "Toca Reconeix el text i espera que acabi cada pàgina." },
        { name: "Baixa'l", text: "Baixa el PDF cercable o copia el text, o baixa'l en .txt o Word." },
      ],
      faq: [
        ["Què és un PDF cercable?", "És el teu mateix escaneig amb una capa de text invisible a sobre: es veu igual, però hi pots seleccionar, copiar i cercar paraules."],
        ["Quantes pàgines puc reconèixer?", "Les que necessitis: es reconeixen una per una al teu navegador. Un document llarg triga més, però no hi ha límit de pàgines."],
        ["Reconeix diversos idiomes?", "Dotze: castellà, anglès, portuguès, francès, italià, alemany, català, basc, rus, japonès, coreà i xinès. Si el document barreja el seu idioma amb l'anglès, marca aquesta casella."],
      ],
    },
    'copiar-el-texto-de-una-foto': {
      slug: 'copiar-text-duna-foto',
      title: "Com copiar el text d'una foto o d'una captura de pantalla | DocuSmart",
      description:
        "Treu el text d'una foto, una captura o un document fotografiat i copia'l, corregeix-lo o passa'l a Word. Gratis, en 12 idiomes i sense pujar la imatge.",
      h1: "Com copiar el text d'una foto o d'una captura de pantalla",
      lead: "Una foto d'un tiquet, una captura d'un xat o un cartell: tens el text al davant, però no el pots copiar. Així el treus en uns segons, sense escriure'l a mà.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Imatge a text (OCR)](/imagen-a-texto) i tria la foto. Serveixen JPG, PNG, WebP i també les fotos HEIC de l'iPhone. Si és una captura de pantalla, ni tan sols l'has de desar: copia-la i enganxa-la a la pàgina amb **Ctrl+V**.",
            "Tria l'**Idioma del document** i toca **Reconeix el text**. En uns segons apareix el text en un quadre que pots corregir. Des d'allà el copies amb un toc o el baixes en .txt o en Word (.docx).",
            { tip: "Si el text barreja el català amb paraules en anglès (noms de productes, termes tècnics), marca «El document també té text en anglès»: encerta més amb aquestes paraules." },
          ],
        },
        {
          h2: "Diverses fotos en un sol document",
          body: [
            "Si has fotografiat un document de diversos fulls, tria totes les fotos alhora. El text de totes surt junt, en ordre, i el baixes en un sol Word. És la manera més ràpida de digitalitzar unes pàgines impreses que t'han deixat.",
          ],
        },
        {
          h2: "Com fer la foto perquè es llegeixi bé",
          body: [
            "El reconeixement depèn de la foto. Uns quants detalls marquen la diferència:",
            { ul: [
              "**Bona llum i sense ombres**: l'ombra del mòbil sobre el paper és la causa d'errors més habitual.",
              "**De cara i recta**: com menys inclinada, millor.",
              "**Que el text es vegi gran**: acosta't fins que el full ompli la foto.",
              "**Nítida**: si la foto ha sortit moguda, torna-la a fer.",
            ] },
            "Si el resultat no és segur, DocuSmart t'avisa amb el percentatge de confiança perquè revisis el text abans de fer-lo servir. La lletra manuscrita gairebé mai no es reconeix bé: l'eina està pensada per a text imprès o de pantalla.",
          ],
        },
        {
          h2: "Foto o PDF escanejat?",
          body: [
            "Si el que tens és un PDF escanejat de diverses pàgines, o vols conservar el document amb el seu aspecte i a més poder-hi cercar paraules, fes servir [OCR: reconèixer text](/ocr-pdf), que crea un PDF cercable. I si has de lliurar les fotos com a document, ajunta-les abans amb [Imatge a PDF](/imagen-a-pdf).",
          ],
        },
        {
          h2: "Les teves fotos no surten de l'equip",
          body: [
            "El text es reconeix al teu navegador: les imatges no es pugen a cap servidor. El pots fer servir amb fotos de documents, rebuts o converses sense deixar-ne còpies enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre Imatge a text", text: "Obre l'eina Imatge a text de docusmart.online i tria la foto, o enganxa una captura amb Ctrl+V." },
        { name: "Tria l'idioma", text: "Tria l'idioma del text de la imatge." },
        { name: "Reconeix el text", text: "Toca Reconeix el text i revisa el resultat al quadre." },
        { name: "Copia o baixa", text: "Copia'l amb un toc o baixa'l en .txt o Word." },
      ],
      faq: [
        ["Funciona amb fotos de l'iPhone?", "Sí. Les fotos HEIC s'obren directament, sense convertir-les abans."],
        ["Reconeix la lletra manuscrita?", "Gairebé mai bé. Funciona amb text imprès o de pantalla."],
        ["Puc corregir el text abans de copiar-lo?", "Sí. El text apareix en un quadre editable: corregeix el que calgui i després copia'l o baixa'l."],
      ],
    },
    'convertir-un-pdf-a-word-para-editarlo': {
      slug: 'convertir-pdf-a-word-per-editar',
      title: "Com convertir un PDF a Word per editar-lo, també escanejat | DocuSmart",
      description:
        "Passa un PDF a un Word (.docx) editable amb títols, negretes, taules, imatges i dues columnes. Amb OCR per als escanejats, gratis i sense pujar el fitxer.",
      h1: "Com convertir un PDF a Word per editar-lo, també si està escanejat",
      lead: "T'han enviat un PDF i n'has de canviar una data, un nom o un paràgraf, però no tens el Word original. Així el recuperes com a document editable.",
      sections: [
        {
          h2: "Abans de convertir: què pots esperar",
          body: [
            "Un PDF no desa paràgrafs ni taules: només lletres amb la seva posició a la pàgina. Per això qualsevol conversió a Word **reconstrueix** el document, i el resultat s'assembla molt a l'original, però no és idèntic. [PDF a Word](/pdf-a-word) conserva:",
            { ul: [
              "Títols, negreta, cursiva, mides i colors de lletra.",
              "Llistes, taules senzilles i imatges.",
              "Dissenys a dues columnes, com els dels currículums, amb el fons de cada columna.",
            ] },
            "Els quadres de text i les formes decoratives complexes poden quedar diferents. Funciona millor amb PDF creats des del Word o un programa semblant.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [PDF a Word](/pdf-a-word) i tria el fitxer. Si el PDF és escanejat, o té algunes pàgines escanejades, deixa marcada la casella **Reconèixer el text de les pàgines escanejades** i tria l'idioma del document: aquestes pàgines es llegeixen amb OCR en el mateix pas i el seu text queda editable.",
            "Toca **Convertir**. Veuràs una vista aproximada del resultat al costat de l'original, amb quants paràgrafs i imatges han sortit. Baixa el .docx i obre'l amb Word, Google Docs, LibreOffice, Pages o WPS.",
            { tip: "Revisa el document en obrir-lo, sobretot les taules i els salts de pàgina: és on més sol variar el disseny." },
          ],
        },
        {
          h2: "Necessites el Word o n'hi ha prou d'editar el PDF?",
          body: [
            "Si només has de canviar una paraula, posar una data o tapar una dada, no cal passar pel Word: amb [Editar PDF](/editar-pdf) escrius damunt del PDF i queda igual que abans, amb el seu disseny exacte. Convertir a Word convé quan has de reescriure paràgrafs sencers o reutilitzar el contingut en un altre document.",
          ],
        },
        {
          h2: "De tornada a PDF",
          body: [
            "Quan acabis d'editar, desa el document i torna'l a convertir amb [Word a PDF](/word-a-pdf) per enviar-lo. Així qui el rebi el veurà igual en qualsevol equip, sense dependre de les fonts que tingui instal·lades.",
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "La conversió, i l'OCR de les pàgines escanejades, es fan al teu navegador: el PDF no es puja a cap servidor. Serveix igual per a contractes, currículums o documents de feina que no han de circular.",
          ],
        },
      ],
      steps: [
        { name: "Obre PDF a Word", text: "Obre l'eina PDF a Word de docusmart.online i tria el PDF." },
        { name: "Activa l'OCR si cal", text: "Si té pàgines escanejades, deixa marcada la casella d'OCR i tria l'idioma." },
        { name: "Converteix", text: "Toca Convertir i revisa la vista aproximada." },
        { name: "Baixa i edita", text: "Baixa el .docx i obre'l amb Word, Google Docs o LibreOffice." },
      ],
      faq: [
        ["Queda idèntic al PDF?", "Molt semblant, però no idèntic: el document es reconstrueix a partir de la posició de les lletres. Es conserven els títols, el format, les llistes, les taules senzilles, les imatges i les dues columnes."],
        ["Funciona amb PDF escanejats?", "Sí. Amb la casella d'OCR marcada, les pàgines escanejades es reconeixen al teu navegador i el seu text queda editable."],
        ["Es pot convertir un PDF amb contrasenya?", "Si només té restriccions (s'obre sense contrasenya), sí. Si demana contrasenya per obrir-se, treu-la primer amb Desbloquejar PDF."],
      ],
    },
    'pasar-un-extracto-bancario-pdf-a-excel': {
      slug: 'extracte-bancari-pdf-a-excel',
      title: "Com passar un extracte bancari o una factura en PDF a Excel | DocuSmart",
      description:
        "Converteix les taules d'un extracte, una factura o un informe en PDF en un full d'Excel amb els números a punt per sumar. Gratis i sense pujar el fitxer.",
      h1: "Com passar un extracte bancari o una factura en PDF a Excel",
      lead: "Has de sumar les despeses del mes, conciliar un compte o filtrar un informe, i les dades són en un PDF. Així les passes a un full de càlcul sense copiar cel·la per cel·la.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [PDF a Excel](/pdf-a-excel) i tria el PDF. Tria com vols els **Fulls**:",
            { ul: [
              "**Un per pàgina**: cada pàgina del PDF en el seu propi full. Útil per a informes on cada pàgina és una taula diferent.",
              "**Tot en un full**: totes les files seguides en un sol full. El millor per a un extracte de diverses pàgines, perquè així el filtres i el sumes d'un cop.",
            ] },
            "Toca **Convertir**. Veuràs una vista aproximada amb quantes files i números han sortit. Baixa el .xlsx i obre'l amb Excel, Google Sheets o LibreOffice.",
          ],
        },
        {
          h2: "Els números queden com a números",
          body: [
            "Aquest és el detall que més temps estalvia: valors com 1.500.000, 2.000 €, 3,5 o 45 % es desen com a números d'Excel amb el seu format, no com a text. Els pots sumar, fer-ne mitjanes o fer-los servir en fórmules tan bon punt obres el fitxer, sense netejar els punts ni els símbols de moneda.",
            { tip: "Si una columna de valors no suma, comprova que no hi hagi barrejats textos com «N/A» o guions: l'Excel ignora aquestes cel·les en la suma." },
          ],
        },
        {
          h2: "Amb quins PDF funciona millor",
          body: [
            "Les columnes es construeixen segons la posició del text a la pàgina. Per això funciona molt bé amb els PDF que exporta un sistema: extractes bancaris, factures electròniques, informes comptables o llistats. Amb PDF de disseny lliure, on el text no segueix columnes, el resultat necessita més revisió.",
            "Si l'extracte és escanejat, o una foto que algú ha passat a PDF, deixa marcada la casella **Reconèixer el text de les pàgines escanejades** i tria l'idioma: aquestes pàgines es llegeixen amb OCR en el mateix pas i cada columna queda a la seva cel·la. Com més nítid sigui l'escaneig, millor el resultat.",
          ],
        },
        {
          h2: "Per tornar-lo a lliurar",
          body: [
            "Si després de treballar el full l'has d'enviar com a document, converteix-lo amb [Excel a PDF](/excel-a-pdf). I si només necessites el text de l'escaneig, sense taules, fes servir [OCR: reconèixer text](/ocr-pdf).",
          ],
        },
        {
          h2: "Les teves dades no surten de l'equip",
          body: [
            "Un extracte bancari té el teu número de compte, el teu saldo i els teus moviments. Aquí la conversió es fa al teu navegador: el PDF no es puja a cap servidor ni queda desat enlloc més.",
          ],
        },
      ],
      steps: [
        { name: "Obre PDF a Excel", text: "Obre l'eina PDF a Excel de docusmart.online i tria el PDF." },
        { name: "Tria els fulls", text: "Un full per pàgina, o tot en un sol full per sumar d'un cop." },
        { name: "Converteix", text: "Toca Convertir i revisa la vista aproximada." },
        { name: "Baixa'l", text: "Baixa el .xlsx i obre'l amb Excel, Google Sheets o LibreOffice." },
      ],
      faq: [
        ["Es poden sumar els números?", "Sí. Els valors amb punts de milers, símbol de moneda, decimals amb coma o percentatges es desen com a números d'Excel."],
        ["Funciona amb un extracte escanejat?", "Sí. Amb la casella d'OCR marcada, les pàgines escanejades es reconeixen al teu navegador i cada columna queda a la seva cel·la."],
        ["El meu extracte es puja a internet?", "No. La conversió passa dins del teu navegador; el fitxer no surt del teu equip."],
      ],
    },
    'sacar-el-texto-de-un-pdf': {
      slug: 'treure-el-text-dun-pdf',
      title: "Com treure tot el text d'un PDF per copiar-lo o cercar-hi | DocuSmart",
      description:
        "Extreu el text d'un PDF en un fitxer .txt o copia'l de la pantalla amb un clic, sense el disseny de la pàgina. Gratis, a l'instant i sense pujar el fitxer.",
      h1: "Com treure tot el text d'un PDF per copiar-lo o cercar-hi",
      lead: "Vols enganxar el contingut d'un PDF en un correu, en un xat o en un altre document, i en copiar-lo es trenquen les línies. Així en treus el text net, de totes les pàgines alhora.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [PDF a text](/pdf-a-texto), tria el PDF i toca **Convertir**. En un moment veuràs el text de totes les pàgines a la pantalla, amb quantes línies té. Des d'allà el copies amb un clic o baixes el fitxer .txt.",
            "El .txt s'obre en qualsevol equip, fins i tot al Bloc de notes o al mòbil, i gairebé no pesa: un document de cent pàgines sol quedar en uns quants centenars de kB.",
          ],
        },
        {
          h2: "Per a què serveix",
          body: [
            { ul: [
              "**Cercar**: obrir el text i cercar-hi una paraula o un número en un document llarg.",
              "**Reutilitzar**: enganxar paràgrafs en un correu o un xat sense els talls de línia del PDF.",
              "**Comptar o analitzar**: passar el text a una altra eina, com el [Comptador de paraules i caràcters](/contador-de-palabras).",
              "**Desar l'essencial**: conservar el contingut d'un document sense el seu disseny.",
              "**Traduir o escoltar**: enganxar el text en un traductor, o al lector en veu alta del mòbil, sense els talls que deixa copiar directament del PDF.",
            ] },
          ],
        },
        {
          h2: "Què es conserva i què no",
          body: [
            "Es conserven el text i els salts de línia, en l'ordre de lectura de cada pàgina. El disseny visual (columnes, taules, colors, imatges) es converteix en text pla. Si necessites el contingut **amb el seu format** per continuar editant-lo, fes servir [PDF a Word](/pdf-a-word).",
            { tip: "Si una taula t'importa, tingues en compte que al .txt perd les columnes. Per treballar-la en cel·les, és millor [PDF a Excel](/pdf-a-excel)." },
          ],
        },
        {
          h2: "Si surt buit: és un escaneig",
          body: [
            "Si DocuSmart et diu que no ha trobat text, el PDF és escanejat: cada pàgina és una foto, i no hi ha lletres per extreure. En aquest cas fes servir [OCR: reconèixer text](/ocr-pdf), que reconeix el text de la imatge al teu navegador i te'l dona per copiar o baixar.",
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "El text es llegeix al teu navegador: el PDF no s'envia a cap servidor. Per això el pots fer servir amb documents de feina o personals sense deixar-ne còpies enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre PDF a text", text: "Obre l'eina PDF a text de docusmart.online i tria el PDF." },
        { name: "Converteix", text: "Toca Convertir: veuràs el text de totes les pàgines." },
        { name: "Copia o baixa", text: "Copia'l amb un clic o baixa el fitxer .txt." },
      ],
      faq: [
        ["Per què surt buit?", "Perquè el PDF és escanejat: les pàgines són imatges. Fes servir OCR: reconèixer text per treure'n el text."],
        ["Es mantenen les taules?", "No com a taules: es converteixen en línies de text. Per conservar les columnes, fes servir PDF a Excel."],
        ["Hi ha límit de pàgines?", "No. S'extreu el text de totes les pàgines, encara que el document sigui llarg."],
      ],
    },
    'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes': {
      slug: 'convertir-pdf-a-jpg-o-extreure-imatges',
      title: "Com convertir un PDF a JPG o treure'n les fotos que porta | DocuSmart",
      description:
        "Passa cada pàgina d'un PDF a JPG o PNG amb la resolució que triïs, o treu-ne les fotos que porta dins en la seva qualitat original. Gratis i sense pujar el fitxer.",
      h1: "Com convertir un PDF a JPG o treure'n les fotos que porta dins",
      lead: "Per publicar una pàgina a les xarxes, enviar-la per WhatsApp com a imatge o recuperar una foto que només tens dins d'un PDF. Són dues eines diferents, i convé saber quina fer servir.",
      sections: [
        {
          h2: "Pàgina completa o només les fotos?",
          body: [
            { ul: [
              "**[PDF a JPG](/pdf-a-jpg)** converteix cada **pàgina completa** en una imatge, amb el seu text, les seves fotos i el seu disseny, com una captura de pantalla però en bona qualitat.",
              "**[Extreure imatges d'un PDF](/extraer-imagenes-pdf)** en treu **només les fotos i els gràfics**, cadascun per separat i amb la seva mida original, sense el text del voltant.",
            ] },
            "Si vols mostrar una pàgina tal com es veu, fes servir PDF a JPG. Si vols el logotip, la foto del producte o el plànol que hi ha dins del document, fes servir Extreure imatges.",
          ],
        },
        {
          h2: "PDF a JPG, pas a pas",
          body: [
            "Obre [PDF a JPG](/pdf-a-jpg) i tria el PDF. Tria el **format d'imatge** i la **resolució**:",
            { ul: [
              "**PNG** conserva la qualitat exacta i és millor per a pàgines amb text; **JPG** pesa menys i és ideal per compartir. En JPG també tries la qualitat.",
              "**72 ppp** per veure en pantalla, **150 ppp** per a gairebé tot i **300 ppp** per imprimir.",
            ] },
            "Si només vols algunes pàgines, escriu-les a **Pàgines** (per exemple, 1-3, 5); si ho deixes buit, es converteixen totes. Toca **Convertir**: veuràs cada imatge amb el seu número de pàgina, i si en són diverses es baixen juntes en un ZIP.",
          ],
        },
        {
          h2: "Extreure imatges, pas a pas",
          body: [
            "Obre [Extreure imatges d'un PDF](/extraer-imagenes-pdf), tria el PDF i toca **Cercar imatges**. Apareixen totes les fotos i els gràfics amb la seva pàgina, la seva mida i el seu format. Tria les que vulguis i baixa-les una per una o totes en un ZIP.",
            "Les fotos JPEG surten **idèntiques** a les originals, byte per byte; les altres es desen com a PNG, sense pèrdua. Deixa marcat **Ometre imatges petites** per no omplir-te d'icones i pics.",
            { tip: "En un PDF escanejat cada pàgina és una sola imatge gran, així que Extreure imatges et retorna les pàgines. En aquest cas tant se val quina de les dues eines facis servir." },
          ],
        },
        {
          h2: "Si la imatge pesa molt",
          body: [
            "A 300 ppp una pàgina A4 supera els 2.400 píxels d'amplada. Si la necessites més lleugera per al web o un formulari, passa-la per [Comprimir imatge](/comprimir-imagen). I tot es fa al teu navegador: el PDF no es puja a cap servidor.",
          ],
        },
      ],
      steps: [
        { name: "Tria l'eina", text: "PDF a JPG per a pàgines completes; Extreure imatges per a les fotos que porta dins." },
        { name: "Tria el PDF", text: "Obre l'eina a docusmart.online i tria el fitxer." },
        { name: "Ajusta i converteix", text: "A PDF a JPG tria el format, la resolució i les pàgines; a Extreure imatges toca Cercar imatges i tria les que vulguis." },
        { name: "Baixa-les", text: "Baixa cada imatge o totes juntes en un ZIP." },
      ],
      faq: [
        ["Quina resolució trio?", "150 ppp serveix per a gairebé tot. 72 ppp si només s'ha de veure en pantalla i 300 ppp si s'ha d'imprimir."],
        ["Les fotos extretes perden qualitat?", "No. Les fotos JPEG es copien idèntiques a les originals i les altres es desen com a PNG, sense pèrdua."],
        ["Puc convertir només una pàgina?", "Sí. A PDF a JPG escriu-ne el número a Pàgines, per exemple 3, i només es converteix aquella."],
      ],
    },
    'convertir-un-pdf-a-pdfa-para-un-tramite': {
      slug: 'convertir-pdf-a-pdfa-per-a-un-tramit',
      title: "Com convertir un PDF a PDF/A per a un tràmit o per arxivar-lo | DocuSmart",
      description:
        "Converteix un PDF a PDF/A-2b, 1b o 3b, el format d'arxiu que demanen les administracions, els jutjats i les universitats. Gratis i sense pujar el fitxer.",
      h1: "Com convertir un PDF a PDF/A per a un tràmit o per arxivar-lo",
      lead: "Un jutjat, una universitat o una administració pública et demana el document «en PDF/A» i el portal rebutja el teu PDF. Així el converteixes, i així saps quina versió has de triar.",
      sections: [
        {
          h2: "Què és el PDF/A i per què el demanen",
          body: [
            "El PDF/A és la versió del PDF pensada per arxivar (norma ISO 19005). El fitxer porta a dins tot el que necessita per veure's: les fonts, el perfil de color i les metadades, i no pot dependre de res extern, com ara scripts, enllaços a fonts o contingut que es carrega d'un altre lloc. Així es veu igual avui i d'aquí a molts anys.",
            "Per això el demanen els jutjats per presentar escrits i demandes, moltes universitats per a tesis i treballs de final de grau, i les administracions públiques per a tràmits i arxius.",
          ],
        },
        {
          h2: "Quina versió triar",
          body: [
            { ul: [
              "**PDF/A-2b**: la recomanada i la que demanen gairebé totes les entitats. Admet transparències i capes.",
              "**PDF/A-1b**: la més antiga, només per a sistemes que no n'accepten cap altra. No admet transparències ni capes.",
              "**PDF/A-3b**: com la 2b, però conserva els fitxers adjunts, per exemple l'XML d'una factura electrònica.",
            ] },
            "Si el tràmit no diu quina, fes servir PDF/A-2b.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [PDF a PDF/A](/pdf-a-pdfa), tria el PDF i la **Versió**, i toca **Converteix a PDF/A**. En acabar veuràs el resultat al costat de l'original i un resum del que s'ha ajustat per complir la norma: per exemple, les fonts que s'han inclòs dins del fitxer o els scripts que s'han tret.",
            { tip: "Els fitxers que crea DocuSmart es validen amb veraPDF, el validador de referència de la PDF Association, el mateix que fan servir molts portals per revisar el que reben." },
          ],
        },
        {
          h2: "Si una pàgina s'ha desat com a imatge",
          body: [
            "Algunes coses no es poden passar a PDF/A tal com són: colors d'impremta (CMYK) sense el seu perfil, o fonts que no són dins del fitxer i no s'hi poden incloure. En aquest cas aquella pàgina es desa com a imatge: es veu igual, però el seu text ja no es pot seleccionar. DocuSmart et diu quines pàgines i per què. Si necessites que aquest text es pugui cercar, passa el resultat per [OCR: reconèixer text](/ocr-pdf).",
            "Si el portal a més posa un límit de mida, revisa després el pes del fitxer i, si cal, fes servir [Comprimir PDF](/comprimir-pdf).",
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "La conversió es fa al teu navegador: el PDF no es puja a cap servidor. Pots convertir demandes, contractes o documents d'identitat sense deixar-ne còpies enlloc.",
          ],
        },
      ],
      steps: [
        { name: "Obre PDF a PDF/A", text: "Obre l'eina PDF a PDF/A de docusmart.online i tria el PDF." },
        { name: "Tria la versió", text: "PDF/A-2b si el tràmit no diu quina; 1b o 3b només si te les demanen." },
        { name: "Converteix", text: "Toca Converteix a PDF/A i revisa el resum del que s'ha ajustat." },
        { name: "Baixa'l", text: "Baixa el PDF/A i puja'l al portal del tràmit." },
      ],
      faq: [
        ["Quina versió demanen els jutjats?", "Gairebé sempre PDF/A-2b, o simplement «PDF/A». Si l'entitat n'esmenta una versió, tria aquella."],
        ["Canvia el contingut del meu document?", "Ni el text ni el disseny. S'hi inclouen les fonts que faltaven i se'n treuen coses que la norma no permet, com ara scripts o adjunts (excepte en PDF/A-3b)."],
        ["Com sé que compleix la norma?", "En acabar, DocuSmart et diu quina versió compleix. Els resultats es validen amb veraPDF, el validador de referència."],
      ],
    },
    'reparar-un-pdf-que-no-abre': {
      slug: 'reparar-pdf-que-no-sobre',
      title: "Com reparar un PDF que no s'obre, surt en blanc o dona error | DocuSmart",
      description:
        "Recupera un PDF danyat o una baixada que s'ha tallat: DocuSmart en reconstrueix l'estructura i en rescata les pàgines completes. Gratis i sense pujar el fitxer.",
      h1: "Com reparar un PDF que no s'obre, surt en blanc o dona error",
      lead: "«El fitxer està danyat i no s'ha pogut reparar», una pantalla en blanc o una baixada que s'ha tallat. Abans de donar el document per perdut, prova de reconstruir-lo.",
      sections: [
        {
          h2: "Per què es fa malbé un PDF",
          body: [
            "Un PDF té, al final del fitxer, un índex que diu on comença cada pàgina i cada imatge. Si aquest índex es perd o es desplaça, el lector no troba res i mostra un error, encara que el contingut continuï allà. Passa sobretot amb:",
            { ul: [
              "Baixades o adjunts que s'han tallat a mitges.",
              "Fitxers copiats a una memòria USB que s'ha tret abans d'hora.",
              "Programes que han desat el PDF malament o l'han editat a mitges.",
            ] },
            "Els senyals sempre s'assemblen: el lector diu que el fitxer està danyat, s'obre però les pàgines surten en blanc, o es veu bé al teu equip i un portal el rebutja en pujar-lo.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Reparar PDF](/reparar-pdf), tria el fitxer danyat i toca **Repara PDF**. L'eina llegeix el fitxer de cap a cap, troba les pàgines encara que l'índex estigui trencat i n'escriu una còpia nova i sana.",
            "En acabar veuràs la còpia reparada al costat de l'original i et dirà què ha passat: si ha trobat i corregit problemes, si el fitxer estava bé o, si estava tallat, quantes pàgines s'han rescatat de les que tenia.",
            { tip: "Encara que el PDF s'obri, de vegades convé reparar-lo: si un portal el rebutja o una eina dona error, una còpia reescrita sol resoldre-ho." },
          ],
        },
        {
          h2: "Què es pot recuperar i què no",
          body: [
            "Es recupera el que ha arribat complet. Si una baixada s'ha tallat al 70 %, les pàgines que hi havia en aquest 70 % es rescaten; les del final, que no van arribar mai, no es poden reconstruir. En aquest cas el millor és tornar a baixar el fitxer o demanar-lo un altre cop, i fer servir la còpia reparada mentrestant.",
            "Si el PDF té contrasenya per obrir-se, treu-la primer amb [Desbloquejar PDF](/desbloquear-pdf) i després repara'l. I si el que has rescatat són pàgines escanejades i en necessites el text, fes servir [OCR: reconèixer text](/ocr-pdf).",
          ],
        },
        {
          h2: "El teu document no surt de l'equip",
          body: [
            "La reparació es fa al teu navegador: el fitxer no es puja a cap servidor. Ho pots provar amb documents personals o de feina sense deixar-ne còpies enlloc, i l'original no es modifica.",
          ],
        },
      ],
      steps: [
        { name: "Obre Reparar PDF", text: "Obre l'eina Reparar PDF de docusmart.online i tria el PDF danyat." },
        { name: "Repara'l", text: "Toca Repara PDF: se'n reconstrueix l'estructura." },
        { name: "Revisa el resultat", text: "Mira què s'ha corregit i quantes pàgines s'han rescatat." },
        { name: "Baixa'l", text: "Baixa la còpia reparada; l'original no canvia." },
      ],
      faq: [
        ["Pot recuperar un fitxer tallat?", "Sí, les pàgines que van arribar completes. Les que falten al final del fitxer no es poden reconstruir."],
        ["Es modifica el meu fitxer original?", "No. Es baixa una còpia reparada a part."],
        ["Funciona amb PDF amb contrasenya?", "Primer treu-li la contrasenya amb Desbloquejar PDF i després repara'l."],
      ],
    },
    'hacer-una-cuenta-de-cobro': {
      slug: 'fer-un-compte-de-cobrament',
      title: "Com fer un compte de cobrament en PDF, gratis i en minuts | DocuSmart",
      description:
        "Omple les teves dades, les del client i el que cobres: el total, la retenció i l'import en lletres surten sols. Baixa'l en PDF, gratis i sense pujar dades.",
      h1: "Com fer un compte de cobrament en PDF",
      lead: "Un compte de cobrament diu qui deu a qui, quant i per què. Amb la plantilla de DocuSmart l'omples al navegador i en surt un PDF endreçat, a punt per enviar.",
      sections: [
        {
          h2: "Què és un compte de cobrament i qui el fa servir",
          body: [
            "És el document amb què una persona cobra una feina o un servei quan no emet factura: un dissenyador autònom, un professor particular, un contractista que presta serveis a una empresa o qui lloga un immoble. Ha de dir qui cobra, a qui, la data, el concepte, l'import (en xifres i en lletres) i com es paga.",
            { tip: "Un compte de cobrament no substitueix la factura electrònica. Si per la teva activitat o els teus ingressos estàs obligat a facturar, consulta-ho amb un gestor o amb l'autoritat fiscal del teu país." },
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Compte de cobrament](/cuenta-de-cobro) i deixa triat el tipus **Compte de cobrament**. Cerca el teu **país**: així s'ajusten la moneda, el nom de l'impost i els tipus de document (DNI, NIF, NIT, RFC…). El número del document es proposa sol (CC-0001) i la data és la d'avui; afegeix-hi la ciutat i, si vols, una **data límit de pagament**.",
            "A **Les teves dades** escriu el teu nom i el teu document; a **Client**, els de qui et paga. L'adreça, el telèfon i el correu són opcionals.",
            "A **Conceptes** descriu el que cobres, la quantitat i el preu unitari. Si són diverses coses, fes servir **Afegeix un concepte**. El subtotal, l'impost, la retenció i el total es calculen mentre escrius, i a sota apareix l'import en lletres.",
          ],
        },
        {
          h2: "Impost, retenció i descompte",
          body: [
            "Si cobres un impost (com l'IVA), escriu-ne el percentatge; en triar el teu país apareix un botó per aplicar el tipus general. Si el client et fa **retenció**, escriu el percentatge i es resta del total, com a la imatge: 1.800.000 de subtotal, 10 % de retenció i 1.620.000 a pagar. El **descompte** es resta abans dels impostos.",
            { tip: "El percentatge de retenció depèn del teu país, del tipus de servei i de la teva situació fiscal. Si no el saps, pregunta-ho al client: gairebé sempre et diu quant et retindrà." },
          ],
        },
        {
          h2: "Dades per al pagament, signatura i PDF",
          body: [
            "A **Dades per al pagament** posa el banc, el tipus i el número de compte i a nom de qui està: així el client sap on ha de fer l'ingrés. A **Notes** pots escriure terminis o condicions. Amb **Afegeix la signatura** la dibuixes amb el dit o el ratolí, i amb **Afegeix el logotip** hi poses el teu a dalt.",
            "Toca **Crea el PDF**: veuràs el compte de cobrament acabat, amb l'import en lletres i la línia de signatura, a punt per baixar, compartir per WhatsApp o desar a Drive.",
            { ul: [
              "El número continua sol a cada document nou (CC-0002, CC-0003…). I si marques **Recorda en aquest navegador**, la pròxima vegada les teves dades, el logotip i els teus clients ja hi seran; el compte bancari no es desa mai.",
              "A **Documents emesos** pots obrir un compte anterior per corregir-lo, o passar un **pressupost** aprovat a compte de cobrament sense tornar-ho a escriure tot.",
              "Amb la mateixa eina pots fer un **pressupost** (amb data de validesa) o un **rebut** de pagament.",
            ] },
          ],
        },
        {
          h2: "Les teves dades i les del client no es pugen",
          body: [
            "Tot es prepara al teu navegador: els noms, els documents i els imports no s'envien a cap servidor. Si el client et demana el compte signat en un PDF que ja tens, fes servir [Signar PDF](/firmar-pdf); i si n'has d'enviar diversos junts per correu, [Comprimir PDF](/comprimir-pdf) els fa més lleugers.",
          ],
        },
      ],
      steps: [
        { name: "Obre la plantilla", text: "Entra a docusmart.online/ca/compte-de-cobrament i tria el teu país." },
        { name: "Escriu les dades", text: "Omple les teves dades, les del client, la ciutat i la data." },
        { name: "Afegeix el que cobres", text: "Descriu cada concepte amb el seu import; el total, la retenció i l'import en lletres surten sols." },
        { name: "Crea el PDF", text: "Afegeix les dades per al pagament i la signatura, toca Crea el PDF i baixa'l." },
      ],
      faq: [
        ["Un compte de cobrament és el mateix que una factura?", "No. El compte de cobrament el fa servir qui no està obligat a facturar; no substitueix la factura electrònica. DocuSmart no emet factures electròniques."],
        ["Com es calcula la retenció?", "Escriu el percentatge que t'indiqui el client i DocuSmart el resta del subtotal. El total a pagar ja surt amb la retenció descomptada."],
        ["Puc fer un compte de cobrament en una altra moneda?", "Sí. En triar el teu país s'hi posa la seva moneda, i la pots canviar per una altra (dòlars, euros…) al camp Moneda."],
      ],
    },
    'hacer-una-hoja-de-vida': {
      slug: 'fer-un-curriculum',
      title: "Com fer un currículum en PDF o Word, gratis i sense registrar-te | DocuSmart",
      description:
        "Fes el teu currículum amb una plantilla clara i apta per als portals d'ocupació (ATS), amb foto o sense. Baixa'l en PDF o Word, gratis i sense crear cap compte.",
      h1: "Com fer un currículum en PDF o Word",
      lead: "Un bon currículum s'entén en segons i passa els filtres automàtics dels portals d'ocupació. Aquí l'omples per seccions i surt endreçat, sense barallar-te amb el format.",
      sections: [
        {
          h2: "Tria la plantilla",
          body: [
            "Obre [Currículum](/hoja-de-vida). A dalt tries com es veurà:",
            { ul: [
              "**Clàssica (ATS)**: una columna i sense foto. És la que millor llegeixen els sistemes que filtren currículums als portals d'ocupació; fes-la servir per presentar-te a ofertes en línia.",
              "**Compacta**: igual de clara, amb lletra i marges més petits perquè hi càpiga més en una pàgina.",
              "**Amb foto**: la teva foto a dalt, com la demanen moltes empreses de Llatinoamèrica.",
            ] },
            "També tries la mida del full (Carta o A4), la lletra (moderna o clàssica) i el color dels títols.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Omple les teves **dades personals**: nom, càrrec o professió, ciutat, telèfon i correu. Si tens LinkedIn o un portafolis, posa'l a **Enllaços**. Després escriu el teu **perfil professional** en dues o tres frases: qui ets, què saps fer i què busques.",
            "A **Experiència laboral** afegeix cada feina amb el càrrec, l'empresa i les dates; marca **Hi treballo actualment** si encara hi ets. A **Assoliments i funcions** escriu un assoliment per línia: cada línia surt com un punt. Fes el mateix amb **Formació**, **Habilitats**, **Idiomes**, **Cursos** i **Referències**; les seccions buides no apareixen.",
            "Toca **Crea el PDF** o **Crea el Word (.docx)**. Veuràs el currículum acabat, a punt per baixar o compartir.",
            { tip: "Comença cada assoliment amb un verb i fes servir xifres sempre que puguis: «He reduït un 30 % els temps de lliurament» diu més que «encarregada de lliuraments»." },
          ],
        },
        {
          h2: "Compara'l amb l'oferta i escriu la carta",
          body: [
            "A **Comparar amb una oferta de feina** enganxes l'anunci de la vacant i veus quines paraules clau ja té el teu currículum i quines li falten, amb el percentatge de coincidència. Els filtres automàtics busquen aquestes paraules; afegeix-hi només les que tinguis de debò.",
            "A **Carta de presentació** escrius l'empresa i el càrrec, i DocuSmart prepara un esborrany amb la teva experiència i els teus punts forts. Revisa'l, ajusta'l a la teva manera i baixa'l en PDF o Word.",
          ],
        },
        {
          h2: "No perdis el que has escrit",
          body: [
            "Amb **Desa automàticament** el que escrius es queda en aquest navegador encara que tanquis la pàgina (la foto no). Per continuar en un altre equip, fes servir **Desa l'esborrany**: baixes un fitxer .json que després obres allà amb **Obre l'esborrany**.",
            "Si l'empresa et demana la foto amb fons blanc, prepara-la abans a [Foto carnet](/foto-tamano-documento). I si has d'enviar el currículum juntament amb certificats en un sol fitxer, ajunta'ls amb [Unir PDF](/unir-pdf).",
          ],
        },
        {
          h2: "La teva informació no surt de l'equip",
          body: [
            "El currículum es prepara al teu navegador: les teves dades, la teva experiència i la teva foto no es pugen a cap servidor ni es fan servir per a res més. No cal crear cap compte ni deixar el correu.",
          ],
        },
      ],
      steps: [
        { name: "Tria la plantilla", text: "Entra a docusmart.online/ca/curriculum i tria Clàssica (ATS), Compacta o Amb foto." },
        { name: "Omple les seccions", text: "Escriu les teves dades, el perfil, l'experiència, la formació i les habilitats." },
        { name: "Compara'l amb l'oferta", text: "Enganxa l'anunci de la vacant per veure quines paraules clau et falten." },
        { name: "Baixa'l", text: "Toca Crea el PDF o Crea el Word i baixa el teu currículum." },
      ],
      faq: [
        ["Què és un currículum ATS?", "Un currículum d'una sola columna, sense taules ni imatges, que els sistemes de selecció dels portals d'ocupació poden llegir sense errors. És la plantilla Clàssica."],
        ["El puc baixar en Word?", "Sí. Amb Crea el Word (.docx) l'obres i l'edites a Word, Google Docs o LibreOffice."],
        ["M'he de registrar?", "No. És gratis, no demana cap compte ni correu i el que escrius es queda al teu equip."],
      ],
    },
    'crear-un-codigo-qr': {
      slug: 'crear-un-codi-qr',
      title: "Com crear un codi QR gratis per a un enllaç, WhatsApp o Wi-Fi | DocuSmart",
      description:
        "Crea un codi QR per a un enllaç, WhatsApp, la teva wifi o el teu contacte, amb el teu color i logotip. Baixa'l en PNG, SVG o PDF. Gratis, sense registre i sense caducitat.",
      h1: "Com crear un codi QR gratis",
      lead: "Un QR porta la gent a la teva pàgina, obre un xat de WhatsApp o connecta a la wifi sense escriure res. Crea'l en segons; no caduca ni depèn de cap servidor.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Crear i llegir codis QR](/crear-codigo-qr) i tria què guardarà: **URL**, **Text**, **Correu**, **Telèfon**, **WhatsApp**, **SMS**, **Ubicació**, **Wi-Fi**, **Contacte** o **Esdeveniment**. Escriu les dades (per a un enllaç, l'adreça completa amb https://).",
            "Toca **Generar QR**. El codi apareix de seguida i el pots baixar en PNG, en **SVG** (vectorial, s'imprimeix nítid a qualsevol mida), en **PDF (10 cm)**, copiar-lo com a imatge o imprimir-lo.",
            { tip: "Abans d'imprimir cent fullets, escaneja el QR amb el mòbil per comprovar que obre el que esperes." },
          ],
        },
        {
          h2: "Què pot fer cada tipus",
          body: [
            { ul: [
              "**WhatsApp**: escriu el número amb el prefix del país (per exemple, 34 per a Espanya) i, si vols, un missatge. En escanejar-lo s'obre el xat amb el missatge ja escrit.",
              "**Wi-Fi**: el nom de la xarxa, la seguretat i la contrasenya. Les teves visites es connecten sense que l'hagis de dictar.",
              "**Contacte**: nom, telèfon, correu i empresa. En escanejar-lo, el mòbil ofereix desar-lo a l'agenda.",
              "**Ubicació**: una adreça o unes coordenades que s'obren al mapa.",
              "**Esdeveniment**: títol, lloc, inici i final, per afegir-lo al calendari.",
            ] },
          ],
        },
        {
          h2: "Dona-li el teu estil",
          body: [
            "A **Personalitza el disseny** canvies el color del codi i del fons (o el deixes transparent per posar-lo sobre el teu disseny), hi poses el teu **logotip** al centre i tries la mida de la imatge. Si els colors tenen poc contrast, DocuSmart t'avisa, perquè una càmera podria no llegir-lo.",
            "Amb **Protegit**, el contingut del QR queda xifrat amb una contrasenya (AES-256): només l'obre qui la tingui, a DocuSmart. I amb **Diversos QR des d’una llista** en generes molts alhora, un per línia o des d'un CSV, per exemple per a les taules d'un restaurant o les etiquetes d'un inventari.",
          ],
        },
        {
          h2: "Per llegir un QR",
          body: [
            "Si el que necessites és llegir-ne un, fes servir [Llegir codi QR](/leer-codigo-qr): amb la càmera, des d'una foto o una captura de pantalla, o des d'un PDF. Abans d'obrir un enllaç et mostra on porta i t'avisa si sembla enganyós.",
          ],
        },
        {
          h2: "El teu QR no caduca",
          body: [
            "El codi es genera al teu navegador i guarda les dades directament, sense passar per un enllaç intermedi. Per això no caduca, no té límit d'escanejos i ningú més no veu el que hi has posat. Els QR que creïs queden a l'**Historial**, només al teu navegador.",
          ],
        },
      ],
      steps: [
        { name: "Tria el tipus", text: "Entra a docusmart.online/ca/crear-codi-qr i tria URL, WhatsApp, Wi-Fi o un altre tipus." },
        { name: "Escriu les dades", text: "Posa l'enllaç, el número o les dades de la xarxa." },
        { name: "Genera el QR", text: "Toca Generar QR i, si vols, canvia el color o afegeix-hi el teu logotip." },
        { name: "Baixa'l", text: "Baixa'l en PNG, SVG o PDF, o imprimeix-lo." },
      ],
      faq: [
        ["El codi QR caduca?", "No. Les dades van dins del mateix codi, sense cap enllaç intermedi, així que funciona per sempre i sense límit d'escanejos."],
        ["Quin format faig servir per imprimir?", "L'SVG: és vectorial i es veu nítid a qualsevol mida, des d'una targeta fins a un cartell. També hi ha un PDF de 10 cm."],
        ["Puc posar el meu logotip al QR?", "Sí, a Personalitza el disseny. El logotip queda en un cercle al centre i el codi es continua llegint."],
      ],
    },
    'cambiar-el-tamano-de-una-foto': {
      slug: 'canviar-la-mida-duna-foto',
      title: "Com canviar la mida d'una foto en píxels, % o centímetres | DocuSmart",
      description:
        "Canvia la mida d'una o diverses fotos en píxels, en percentatge, en centímetres o a la mida exacta d'Instagram, WhatsApp o YouTube. Gratis i sense pujar-les.",
      h1: "Com canviar la mida d'una foto",
      lead: "Una foto del mòbil fa milers de píxels: massa per a un formulari, una pàgina web o una portada. Aquí la deixes a la mida que necessites, sense deformar-la.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Redimensionar imatge](/redimensionar-imagen) i tria una o diverses fotos (JPG, PNG, WebP, HEIC, GIF o BMP). Després tria **Com redimensionar**:",
            { ul: [
              "**Per percentatge**: per exemple, 50 % deixa la foto a la meitat d'amplada i d'alçada.",
              "**Per píxels**: escriu l'amplada, l'alçada o totes dues. Amb **Conservar la proporció** activat, n'hi ha prou amb un costat: l'altre es calcula sol.",
              "**Xarxes socials**: mides exactes per a Instagram, estats de WhatsApp, portades de Facebook o LinkedIn i miniatures de YouTube.",
              "**En centímetres**: per imprimir, amb la resolució que triïs.",
            ] },
            "Toca **Redimensionar** i veuràs la foto abans i després, amb el seu pes. Si n'has triat diverses, es desen juntes en un ZIP.",
          ],
        },
        {
          h2: "Que no es deformi",
          body: [
            "Una foto es veu estirada quan canvies l'amplada i l'alçada en una proporció diferent. Per això **Conservar la proporció** ve activat: si escrius els dos costats, la foto cap dins d'aquesta mida sense estirar-se. A **Xarxes socials**, la imatge omple la mida exacta i el que sobra es retalla per igual des del centre.",
            { tip: "Fer petita una foto mai no li treu nitidesa a la vista, però fer-la gran no hi afegeix detall: una foto petita ampliada al doble es veu borrosa." },
          ],
        },
        {
          h2: "Si el que vols és retallar-la o que pesi menys",
          body: [
            "Canviar la mida no és el mateix que retallar. Per treure una vora, enquadrar una persona o deixar la foto quadrada, fes servir [Retallar imatge](/recortar-imagen): retall lliure o en proporcions fixes com 1:1, 4:3 o 16:9.",
            "I si un formulari et demana que la foto pesi menys d'una certa mida (per exemple, 200 KB), [Comprimir imatge](/comprimir-imagen) baixa la qualitat just el necessari perquè hi càpiga, i només redueix els píxels si no n'hi ha prou.",
          ],
        },
        {
          h2: "Mides que es demanen sovint",
          body: [
            { ul: [
              "**Per a una pàgina web o un blog**: entre 1200 i 1920 píxels d'amplada és més que suficient; més gran només fa que la pàgina carregui lenta.",
              "**Per a un formulari o un tràmit**: solen demanar una amplada màxima (per exemple, 800 píxels) i un pes màxim. Primer ajusta la mida aquí i, si encara pesa massa, comprimeix-la.",
              "**Per imprimir**: fes servir En centímetres; a 300 ppp, una foto de 10 × 15 cm necessita uns 1181 × 1772 píxels per veure's nítida.",
            ] },
          ],
        },
        {
          h2: "Les teves fotos no es pugen",
          body: [
            "Tot passa al teu navegador, també amb desenes de fotos alhora. A més, en desar-les se'n treuen les dades ocultes (EXIF), com la ubicació GPS on es van fer.",
          ],
        },
      ],
      steps: [
        { name: "Tria les fotos", text: "Entra a docusmart.online/ca/redimensionar-imatge i tria una o diverses fotos." },
        { name: "Tria la mida", text: "Per percentatge, per píxels, una mida de xarxes socials o en centímetres." },
        { name: "Redimensiona", text: "Toca Redimensionar i compara l'abans i el després." },
        { name: "Baixa", text: "Baixa la foto, o el ZIP si n'eren diverses." },
      ],
      faq: [
        ["La foto perd qualitat si la faig més petita?", "A la vista no: es veu igual de nítida, només que més petita. El que no es pot fer és ampliar-la sense que es noti."],
        ["Puc canviar la mida de diverses fotos alhora?", "Sí. Tria-les totes juntes: es redimensionen amb la mateixa mida i es baixen en un ZIP."],
        ["Quina mida faig servir per a Instagram?", "A Xarxes socials tens Instagram quadrada i vertical, i històries. La foto omple la mida i el que sobra es retalla des del centre."],
      ],
    },
    'comprimir-archivos-en-zip': {
      slug: 'comprimir-fitxers-en-zip',
      title: "Com comprimir fitxers en ZIP i obrir un ZIP o RAR sense programes | DocuSmart",
      description:
        "Ajunta diversos fitxers o una carpeta en un ZIP, amb contrasenya si vols, i obre ZIP, RAR o 7Z des del navegador. Gratis, sense instal·lar res i sense pujar-los.",
      h1: "Com comprimir fitxers en ZIP i obrir un ZIP o RAR",
      lead: "Un ZIP ajunta molts fitxers en un de sol: més fàcil d'enviar per correu i, de vegades, més lleuger. Aquí el crees i l'obres des del navegador, sense instal·lar programes.",
      sections: [
        {
          h2: "Crear un ZIP, pas a pas",
          body: [
            "Obre [Comprimir fitxers](/comprimir-archivos) i afegeix-hi els fitxers (de qualsevol tipus) o una carpeta sencera amb **Afegir una carpeta**. Escriu el nom del ZIP i tria la compressió: **Ràpida**, **Normal** o **Màxima**.",
            "Toca **Crear ZIP**. Veuràs els teus fitxers a un costat i el ZIP a l'altre, amb quant pesava tot abans i quant pesa ara.",
            { tip: "Les fotos, els vídeos i els PDF ja venen comprimits, així que en un ZIP gairebé no baixen de pes. El que sí que es redueix molt són els documents de Word, els fulls de càlcul i els textos." },
          ],
        },
        {
          h2: "Amb contrasenya o en parts",
          body: [
            { ul: [
              "**Protegir amb contrasenya (AES-256)**: ningú no obre el ZIP sense la clau. En ZIP la contrasenya no pot portar accents ni ñ; si els necessites, tria el format 7Z.",
              "**Dividir en parts**: si el correu no accepta un fitxer tan gran, el parteixes en diversos (.001, .002…). Per obrir-lo calen totes les parts, amb DocuSmart, 7-Zip o WinRAR.",
              "**7Z**: comprimeix més que ZIP, però en alguns equips cal instal·lar un programa per obrir-lo. ZIP s'obre a qualsevol ordinador i mòbil sense instal·lar res.",
            ] },
          ],
        },
        {
          h2: "Obrir un ZIP, RAR o 7Z",
          body: [
            "Per treure el que porta un fitxer comprimit, fes servir [Descomprimir RAR, ZIP i 7Z](/descomprimir-archivos). Obre ZIP, RAR, 7Z, TAR, GZ, BZ2 i XZ, també els que tenen contrasenya o estan dividits en parts.",
            "Veuràs la llista del que hi ha a dins, amb les carpetes. Pots obrir la previsualització d'un fitxer abans de baixar-lo, extreure només els que triïs o baixar-los tots junts.",
          ],
        },
        {
          h2: "Si el que vols és que un PDF pesi menys",
          body: [
            "Ficar un PDF en un ZIP gairebé no el fa més petit. Perquè un PDF pesi menys de debò, passa'l per [Comprimir PDF](/comprimir-pdf), que redueix les imatges que porta a dins.",
          ],
        },
        {
          h2: "Els teus fitxers no surten de l'equip",
          body: [
            "Comprimir i descomprimir passa a la memòria del teu navegador: no es puja res a internet. Amb fitxers molt grans (diversos GB) pot trigar o quedar-se sense memòria; en aquest cas, divideix-los en diversos ZIP.",
          ],
        },
      ],
      steps: [
        { name: "Afegeix els fitxers", text: "Entra a docusmart.online/ca/comprimir-fitxers i afegeix-hi fitxers o una carpeta." },
        { name: "Tria les opcions", text: "Escriu el nom, la compressió i, si vols, una contrasenya." },
        { name: "Crea el ZIP", text: "Toca Crear ZIP i mira quant ha baixat el pes." },
        { name: "Baixa", text: "Baixa el ZIP o comparteix-lo." },
      ],
      faq: [
        ["Puc obrir un RAR sense WinRAR?", "Sí. Descomprimir RAR, ZIP i 7Z obre RAR, ZIP, 7Z i altres formats al navegador, sense instal·lar res. Per crear-ne un de nou, fes servir ZIP o 7Z."],
        ["Per què el meu ZIP pesa gairebé el mateix?", "Perquè les fotos, els vídeos i els PDF ja venen comprimits. El ZIP serveix per ajuntar-los en un sol fitxer, no tant per fer-los més petits."],
        ["És segur posar-hi contrasenya?", "Sí. Es xifra amb AES-256 i la contrasenya no es desa enlloc: si l'oblides, no hi ha manera de recuperar-la."],
      ],
    },
    'recortar-los-margenes-de-un-pdf': {
      slug: 'retallar-marges-pdf',
      title: "Com retallar els marges o una part d'un PDF | DocuSmart",
      description:
        "Treu els marges en blanc d'un PDF amb un toc o retalla a mà la part que vols conservar, a totes les pàgines o només en una. Gratis i sense pujar-lo.",
      h1: "Com retallar els marges o una part d'un PDF",
      lead: "Un PDF amb marges enormes es llegeix petit al mòbil i s'imprimeix amb molt de paper en blanc. Retallar-lo deixa només el que importa, sense tocar el contingut.",
      sections: [
        {
          h2: "Pas a pas",
          body: [
            "Obre [Retallar PDF](/recortar-pdf) i tria el fitxer. Veuràs la primera pàgina amb un requadre a sobre: la zona enfosquida és la que es retallarà.",
            "Toca **Treure marges en blanc** i el requadre s'ajusta sol al contingut de la pàgina, com a la imatge. Si ho prefereixes fer a mà, arrossega les vores o les cantonades del requadre. A sota veus la mida que quedarà, en mil·límetres.",
            "Tria si el retall s'aplica a **Totes les pàgines** o **Només la pàgina** que estàs veient, toca **Retallar PDF** i baixa el resultat.",
            { tip: "Si les pàgines tenen marges diferents, revisa'n unes quantes amb les fletxes abans de retallar: el requadre de «Totes les pàgines» és el mateix per a cadascuna." },
          ],
        },
        {
          h2: "Per a què serveix",
          body: [
            { ul: [
              "**Llegir al mòbil**: sense marges, el text ocupa tota la pantalla i es llegeix més gran.",
              "**Treure'n una part**: una taula, un gràfic o la foto d'un document escanejat, per fer-la servir a part.",
              "**Treure el que sobra d'un escaneig**: la vora negra de la tapa de l'escàner o la taula al voltant del full.",
            ] },
          ],
        },
        {
          h2: "Què passa amb el contingut",
          body: [
            "El retall canvia l'àrea visible de cada pàgina, sense refer el text ni les imatges: el que queda es veu igual de nítid i el text es continua podent copiar i cercar.",
            "Si després només necessites algunes pàgines, separa-les amb [Dividir PDF](/dividir-pdf); i si alguna ha quedat de costat, endreça-la amb [Girar PDF](/rotar-pdf).",
          ],
        },
        {
          h2: "Abans d'imprimir",
          body: [
            "En imprimir un PDF retallat, la pàgina queda més petita que el full. Perquè ocupi tot el paper, tria **Ajusta a la mida de la pàgina** a la finestra d'impressió del navegador o del visor de PDF.",
            "Si has retallat un escaneig per quedar-te amb la foto d'un document (un DNI, un carnet), revisa que no n'hagis tallat cap vora: molts tràmits demanen que se'n vegin les quatre cantonades.",
          ],
        },
        {
          h2: "El teu PDF no surt de l'equip",
          body: [
            "Tot el retall passa al teu navegador. El PDF no es puja a cap servidor, així que el pots fer servir amb tranquil·litat amb contractes o documents personals.",
          ],
        },
      ],
      steps: [
        { name: "Obre Retallar PDF", text: "Entra a docusmart.online/ca/retallar-pdf i tria el PDF." },
        { name: "Ajusta el requadre", text: "Toca Treure marges en blanc o arrossega les vores a mà." },
        { name: "Tria les pàgines", text: "Aplica el retall a totes les pàgines o només a la que estàs veient." },
        { name: "Baixa", text: "Toca Retallar PDF i baixa el resultat." },
      ],
      faq: [
        ["Es perd qualitat en retallar un PDF?", "No. Només canvia l'àrea visible de la pàgina; el text i les imatges queden iguals."],
        ["Puc retallar només una pàgina?", "Sí. Abans de retallar, tria Només la pàgina que estàs veient."],
        ["El que es retalla s'esborra del fitxer?", "Queda fora de la vista i de la impressió. Si el que vols és esborrar una dada privada, fes servir Tatxar PDF, que l'elimina de debò."],
      ],
    },
    'cambiar-el-formato-de-una-imagen': {
      slug: 'canviar-el-format-duna-imatge',
      title: "Com canviar el format d'una imatge: HEIC, JPG, PNG o WebP | DocuSmart",
      description:
        "Passa fotos HEIC de l'iPhone a JPG, un JPG a PNG o qualsevol imatge a WebP, una o moltes alhora. Gratis, al navegador i sense pujar les teves fotos.",
      h1: "Com canviar el format d'una imatge: HEIC, JPG, PNG o WebP",
      lead: "Cada format serveix per a una cosa diferent, i de vegades una pàgina o un programa només n'accepta un. Aquí canvies el format de les teves fotos en segons, sense instal·lar res.",
      sections: [
        {
          h2: "Quin format et convé",
          body: [
            { ul: [
              "**JPG**: el de les fotos. Pesa poc i l'obre qualsevol equip, pàgina o formulari. No admet fons transparent.",
              "**PNG**: sense pèrdua de qualitat i amb fons transparent. Ideal per a logotips, captures de pantalla i dibuixos; amb fotos pesa molt més.",
              "**WebP**: el format modern del web. Es veu igual que un JPG amb força menys pes, com a la imatge: de 189 KB a 50 KB.",
              "**HEIC**: el que fan servir els iPhone. Ocupa poc, però molts ordinadors, pàgines i programes no l'obren.",
            ] },
          ],
        },
        {
          h2: "Fotos de l'iPhone (HEIC) a JPG",
          body: [
            "Obre [HEIC a JPG](/heic-a-jpg) i tria les teves fotos HEIC, una o moltes. Ajusta la **Qualitat del JPG** si vols (la que ve marcada es veu igual que l'original) i toca convertir. Si n'eren diverses, es baixen juntes en un ZIP.",
            { tip: "La primera vegada es baixa el descodificador d'HEIC (1,4 MB) i queda desat: les conversions següents comencen de seguida." },
            "Si prefereixes que l'iPhone faci les fotos directament en JPG, a **Configuració → Càmera → Formats** tria **Més compatible**.",
          ],
        },
        {
          h2: "JPG a PNG, o qualsevol imatge a WebP",
          body: [
            "Amb [JPG a PNG](/jpg-a-png) converteixes una foto a PNG quan un programa ho demana o quan l'has d'editar diverses vegades sense que perdi qualitat. Amb [Imatge a WebP](/imagen-a-webp) redueixes el pes de les fotos d'una pàgina web o d'una botiga en línia sense que es noti.",
            "Totes dues funcionen igual: tries una o diverses imatges, toques el botó i veus l'abans i el després amb el pes de cada versió, a punt per baixar.",
          ],
        },
        {
          h2: "Si a més necessites que pesi menys o canviar-ne la mida",
          body: [
            "Canviar el format no canvia les mides de la foto. Si un formulari et demana que no passi d'un cert pes, fes servir [Comprimir imatge](/comprimir-imagen), que també accepta fotos HEIC i les lliura en JPG; i si et demanen una amplada o una alçada exactes, [Redimensionar imatge](/redimensionar-imagen).",
          ],
        },
        {
          h2: "Sense pujar les teves fotos",
          body: [
            "La conversió passa al teu navegador: les teves fotos no es pugen a cap servidor. En desar-les, a més, se'n treuen les dades ocultes (EXIF), com la ubicació on es van fer.",
          ],
        },
      ],
      steps: [
        { name: "Tria la conversió", text: "Entra a HEIC a JPG, JPG a PNG o Imatge a WebP a docusmart.online." },
        { name: "Tria les fotos", text: "Afegeix una o diverses imatges." },
        { name: "Converteix", text: "Toca el botó i compara l'abans i el després." },
        { name: "Baixa", text: "Baixa la imatge, o el ZIP si n'eren diverses." },
      ],
      faq: [
        ["Per què no puc obrir les fotos del meu iPhone a l'ordinador?", "Perquè estan en HEIC, un format que molts equips i pàgines no reconeixen. Passa-les a JPG i s'obriran a qualsevol lloc."],
        ["Una foto perd qualitat en passar-la a PNG?", "No: PNG no perd qualitat. Però tampoc no la recupera; la foto queda igual que el JPG original i pesa més."],
        ["WebP es veu a tots els navegadors?", "Sí, a tots els navegadors actuals. Alguns programes d'escriptori antics encara no l'obren."],
      ],
    },
    'borrar-la-ubicacion-y-los-datos-ocultos-de-una-foto': {
      slug: 'esborrar-ubicacio-i-dades-ocultes-duna-foto',
      title: "Com esborrar la ubicació i les dades ocultes d'una foto o un PDF | DocuSmart",
      description:
        "Mira quines dades ocultes guarda una foto o un document (ubicació GPS, càmera, data, autor) i esborra-les abans de compartir-lo. Gratis i sense pujar el fitxer.",
      h1: "Com esborrar la ubicació i les dades ocultes d'una foto",
      lead: "Una foto del mòbil pot guardar el lloc exacte on es va fer, i un document, el nom de qui el va escriure. Abans de publicar-los o enviar-los, mira què porten i esborra-ho.",
      sections: [
        {
          h2: "Què són les dades ocultes (metadades)",
          body: [
            "Són dades que van dins del fitxer però no es veuen a la imatge ni a les pàgines. Una foto pot guardar la **ubicació GPS**, la marca i el model del mòbil, el número de sèrie de la càmera i la data i l'hora exactes. Un PDF o un document de Word pot guardar l'**autor**, l'empresa, el programa amb què es va fer i les dates de creació i modificació.",
            "Qui rebi el fitxer les pot veure amb qualsevol visor. Amb una foto de casa teva, per exemple, la ubicació porta a la teva adreça.",
          ],
        },
        {
          h2: "Pas a pas",
          body: [
            "Obre [Treure metadades](/quitar-metadatos) i tria les teves fotos o documents: JPG, PNG, WebP, HEIC, TIFF, vídeos MP4 i MOV, PDF, Word, Excel o PowerPoint. A l'instant veuràs la llista de **Dades ocultes trobades** a cadascun, com a la imatge; si una foto guarda la ubicació, apareix en vermell amb un avís.",
            "Toca **Treure metadades**. Veuràs quantes dades tenia cada fitxer abans i quantes en queden després, i baixes la còpia neta (o un ZIP, si n'eren diversos).",
            { tip: "Només es conserva l'orientació de les fotos, perquè no apareguin girades. La imatge no es torna a comprimir: no perd qualitat." },
          ],
        },
        {
          h2: "En PDF i documents d'Office",
          body: [
            "En els PDF, l'opció **Treu també comentaris, adjunts i JavaScript** esborra, a més, les notes amb el nom del seu autor, els fitxers adjunts i el codi que s'executa en obrir-los. Desactiva-la si has de conservar els comentaris.",
            "A Word, Excel i PowerPoint es treuen l'autor, l'empresa i les dates. Els noms que apareixen als comentaris i al control de canvis s'esborren des del mateix programa.",
          ],
        },
        {
          h2: "Si la dada privada està a la vista",
          body: [
            "Treure metadades no canvia el que es veu. Si el que vols amagar és un número de DNI, una signatura o una adreça que apareix a les pàgines d'un PDF, fes servir [Tatxar PDF](/censurar-pdf), que la cobreix i l'elimina del fitxer.",
          ],
        },
        {
          h2: "Es fa al teu equip",
          body: [
            "Tot passa al teu navegador: les teves fotos i documents no es pugen a cap servidor. Així no deixes còpies d'un fitxer privat just quan intentes protegir-lo.",
          ],
        },
      ],
      steps: [
        { name: "Obre Treure metadades", text: "Entra a docusmart.online/ca/treure-metadades i tria fotos o documents." },
        { name: "Revisa què guarden", text: "Mira la llista de dades ocultes de cada fitxer, com la ubicació GPS." },
        { name: "Esborra-les", text: "Toca Treure metadades i comprova que no n'ha quedat cap." },
        { name: "Baixa", text: "Baixa la còpia neta, a punt per compartir." },
      ],
      faq: [
        ["WhatsApp esborra la ubicació de les fotos?", "Quan les envies com a foto, WhatsApp les torna a comprimir i en treu la majoria de dades. Però si les envies com a document, per correu o les puges a altres pàgines, poden arribar amb la ubicació."],
        ["La foto perd qualitat?", "No. Només es treuen les dades ocultes; la imatge queda exactament igual."],
        ["Quines dades es conserven?", "Només l'orientació de les fotos, perquè no apareguin girades. Tota la resta s'esborra."],
      ],
    },
  },
}
