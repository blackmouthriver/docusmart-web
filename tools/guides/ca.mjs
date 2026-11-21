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
  },
}
