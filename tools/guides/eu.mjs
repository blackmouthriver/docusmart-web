// Traducción al euskera de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: "Gidak",
    guidesSlug: "gidak",
    indexTitle: "DocuSmart gidak: PDFak, argazkiak eta dokumentuak urratsez urrats",
    indexDescription:
      "Gida labur praktikoak dokumentuak mugikorretik edo ordenagailutik batzeko, konprimitzeko, sinatzeko, eskaneatzeko eta babesteko, doan eta fitxategiak igo gabe.",
    indexH1: "Urratsez urratseko gidak",
    indexLead: "PDFekin, argazkiekin eta dokumentuekin egunero egiten ditugun lanak, minutu gutxitan azalduta. Denak nabigatzailean egiten dira, fitxategiak igo gabe.",
    minutes: "{n} min irakurtzeko",
    updated: "Eguneratua: {date}",
    summary: "Laburpen azkarra",
    toolsTitle: "Gida honetako tresnak",
    moreGuides: "Gida gehiago",
    related: "Lotutako gidak",
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'pdfak-mugikorrean-batu',
      title: "Nola batu PDFak mugikorrean fitxategiak igo gabe | DocuSmart",
      description:
        "Urratsez urratseko gida, mugikorretik hainbat PDF bakar batean biltzeko, doan eta inongo zerbitzaritara igo gabe. Android eta iPhone nabigatzaileetan dabil.",
      h1: "Nola batu PDFak mugikorrean fitxategiak igo gabe",
      lead: "NANa, ordainagiria eta inprimakia PDF bakar batean biltzea da edozein izapidetan gehien egiten den lanetako bat. Hona hemen nola egin mugikorretik, minutu batean eta zure dokumentuak beste inoren zerbitzari bati eman gabe.",
      sections: [
        {
          h2: "Zergatik den garrantzitsua fitxategiak ez igotzea",
          body: [
            "PDFak batzeko webgune gehienek zure dokumentuak beren zerbitzarietan jasotzen dituzte, han prozesatzen dituzte eta emaitza itzultzen dizute. Jatetxe bateko menu batentzat berdin dio; NAN batentzat, banku-laburpen batentzat edo historia kliniko batentzat, ez hainbeste: ez dakizu zenbat denboraz gordetzen dituzten ezta nork ikus ditzakeen ere.",
            "DocuSmart-ek mugikorreko nabigatzailearen barruan egiten du batzea. Fitxategiak ez du inoiz Internetetik bidaiatzen, beraz, ez da kopiarik geratzen inongo zerbitzaritan. Horregatik dabil estaldura txarrarekin ere, orria behin kargatuta.",
          ],
        },
        {
          h2: "Hasi aurretik",
          body: [
            { ul: [
              "Izan PDFak mugikorrean gordeta (Deskargak karpetan, Fitxategiak aplikazioan edo zure hodeian).",
              "Horietako bat argazki bat bada eta ez PDF bat, bihurtu lehenago [Iruditik PDFra](/imagen-a-pdf) tresnarekin.",
              "PDF batek pasahitza badu, kendu lehenago [Desblokeatu PDFa](/desbloquear-pdf) tresnarekin (pasahitza jakin behar duzu).",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Batu PDFak](/unir-pdf) mugikorreko nabigatzailean (Chrome, Safari, Samsung Internet edo erabiltzen duzuna). Ukitu laukia fitxategiak aukeratzeko: hainbat batera hauta ditzakezu.",
            "Berrikusi zerrendaren ordena. Lehen fitxategia izango da azken dokumentuaren hasiera; mugitu geziekin behar duzun moduan geratu arte. Ondoren, ukitu «Batu»: PDF konbinatua orri guztiekin deskargatzen da.",
            { tip: "Orri solteen ordena aldatu behar duzu, eta ez fitxategi osoena? Batu lehenik eta ireki emaitza [Ordenatu PDF orriak](/ordenar-paginas-pdf) tresnan; han orri bakoitza mugitu edo ken dezakezu." },
          ],
        },
        {
          h2: "Azken PDFa astunegia bada",
          body: [
            "Izapideen atari eta posta-zerbitzu askok mugatu egiten dute eranskinen tamaina (2 MB, 5 MB edo 10 MB dira ohiko mugak). Gainditzen baduzu, erabili [Konprimitu PDFa](/comprimir-pdf): «Galerarik gabe» mailak ez du kalitatea ukitzen, eta «Ertaina» mailak askoz gehiago murrizten ditu eskaneatutako dokumentuetatik edo argazkietatik datozen PDFak.",
          ],
        },
        {
          h2: "Eta sarri egiten baduzu",
          body: [
            "Webguneak edozein mugikorretan funtzionatzen du. Android erabiltzen baduzu eta dokumentuak sarri batzen badituzu, DocuSmart aplikazioak gauza bera egiten du konexiorik gabe, eta zure fitxategiak telefonoan antolatuta gordetzen ditu.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Batu PDFak", text: "Ireki docusmart.online webguneko Batu PDFak tresna mugikorreko nabigatzailetik." },
        { name: "Aukeratu PDFak", text: "Ukitu laukia eta hautatu batu nahi dituzun fitxategi guztiak." },
        { name: "Ordenatu", text: "Mugitu fitxategiak geziekin: lehena izango da dokumentuaren hasiera." },
        { name: "Batu eta deskargatu", text: "Ukitu «Batu» eta orri guztiak dituen PDF bakarra deskargatuko da." },
      ],
      faq: [
        ["iPhonean dabil?", "Bai. Safarin eta edozein nabigatzaile modernotan dabil, iPhonean eta Androiden. Konexiorik gabeko aplikazioa Androiderako bakarrik da."],
        ["Zenbat PDF batu ditzaket?", "Ez dago kopuru finkorik. Muga mugikorraren memoria da: dokumentu oso handiekin pixka bat gehiago tarda dezake."],
        ["Kalitatea galtzen da?", "Ez. Orriak dauden bezala kopiatzen dira, jatorrizko testu, irudi eta tamainarekin."],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'argazkiak-pdf-bihurtu',
      title: "Nola bihurtu argazkiak PDF (hainbat argazki fitxategi bakarrean) | DocuSmart",
      description:
        "Bihurtu mugikorreko edo ordenagailuko argazkiak PDF, argazki bat orri bakoitzeko. Doan, erregistrorik gabe eta irudiak igo gabe. Aholkuak irakurgarri eta arin gera dadin.",
      h1: "Nola bihurtu argazkiak PDF, hainbat fitxategi bakarrean",
      lead: "«Dokumentua PDFan» eskatzen dizute, eta zuk galerian argazkiak dituzu. Hona hemen nola bihurtu PDF ordenatu, irakurgarri eta arin batean, ezer instalatu gabe.",
      sections: [
        {
          h2: "Bi bide, argazki motaren arabera",
          body: [
            { ul: [
              "**Dagoeneko ondo ikusten diren argazkiak** (pantaila-argazkiak, deskargatutako irudiak, aurrez aurre ateratako argazkiak): erabili [Iruditik PDFra](/imagen-a-pdf). Argazki bakoitza orri bihurtzen da, dagoen bezala.",
              "**Paper-orri baten argazkiak** (ordainagiri bat, kontratu bat, ziurtagiri bat): erabili [Eskaneatu dokumentua](/escanear-documento). Orriaren ertzak aurkitzen ditu, zuzendu egiten du eta papera zuritzen du, eskaneatua dirudien arte.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats Iruditik PDFra tresnarekin",
          body: [
            "Ireki [Iruditik PDFra](/imagen-a-pdf) eta aukeratu zure irudiak. JPG, PNG, WebP, BMP eta GIF onartzen ditu, eta nahas ditzakezu.",
            "Ordenatu geziekin: irudi bakoitza orri bat izango da, ordena horretan. Ukitu «Bihurtu» eta kito: PDF bakarra duzu.",
          ],
        },
        {
          h2: "Nola atera argazkia ondo irakur dadin",
          body: [
            { ul: [
              "Argi berdina, flash zuzenik gabe: eskuaren edo mugikorraren itzalek irakurketa zailtzen dute.",
              "Orria gainazal ilun baten gainean (egurrezko mahai batean, adibidez): horrela eskanerrak hobeto aurkitzen ditu ertzak.",
              "Mugikorra orriarekiko paralelo, ez okertuta.",
              "Orri osoa ikustea, marjina pixka batekin.",
            ] },
            { tip: "[Eskaneatu dokumentua](/escanear-documento) tresnan «Egin PDF bilagarria» marka dezakezu: testua ezagutzen du bilatu eta kopiatu ahal izateko, atari batzuek eskertzen duten zerbait." },
          ],
        },
        {
          h2: "Astunegia izan ez dadin",
          body: [
            "Gaur egungo mugikor bateko argazki batek 3 edo 4 MB pisa ditzake; hamar argazki dagoeneko PDF astuna dira posta elektroniko baterako. Emaitza handia bada, pasatu [Konprimitu PDFa](/comprimir-pdf) tresnatik «Ertaina» mailarekin; asko murrizten ditu argazkiak diren orriak. Argazkiak aurretik ere konprimi ditzakezu [Konprimitu irudia](/comprimir-imagen) tresnarekin.",
          ],
        },
        {
          h2: "iPhonea baduzu",
          body: [
            "Safaritik argazkiak aukeratzean, iPhoneak normalean JPG formatuan ematen ditu, beraz, ezer gehiago egin gabe dabiltza. Argazkiak ordenagailura kopiatu badituzu eta .HEIC fitxategi gisa agertzen badira, formatu hori ezin da oraindik hemen bihurtu.",
            "iPhoneak hurrengo argazkiak JPG formatuan gorde ditzan, joan Ajustes › Cámara › Formatos atalera (iPhonea gaztelaniaz baduzu) eta aukeratu «Más compatible». Dagoeneko dituzun argazkiak, bidali ordenagailura Fotos aplikaziotik, partekatzeko aukerarekin: kasu horretan, normalean JPG bihurtuta iristen dira.",
          ],
        },
        {
          h2: "Zure argazkiak ez dira gailutik ateratzen",
          body: [
            "Bihurketa nabigatzailean egiten da: argazkiak ez dira inongo zerbitzaritara igotzen. Garrantzitsua da nortasun-agiriak edo osasun-informazioa direnean.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Iruditik PDFra", text: "Ireki docusmart.online webguneko Iruditik PDFra tresna." },
        { name: "Aukeratu argazkiak", text: "Hautatu irudiak (JPG, PNG, WebP, BMP edo GIF)." },
        { name: "Ordenatu", text: "Erabili geziak: irudi bakoitza orri bat izango da ordena horretan." },
        { name: "Bihurtu", text: "Ukitu «Bihurtu» PDF bakarra lortzeko." },
      ],
      faq: [
        ["Hainbat argazki jar ditzaket orri bakar batean?", "Iruditik PDFra tresnak argazki bat jartzen du orri bakoitzeko, izapideetan normalean eskatzen dena. Orri batean hainbat behar badituzu, bildu lehenago irudi bakar batean."],
        ["Zer alde dago eskaneatzearekin?", "Eskaneatu dokumentua tresnak orria moztu, zuzendu eta kontrastea hobetzen du; Iruditik PDFra tresnak argazkia dagoen bezala errespetatzen du. Paperetarako, eskaneatzeak emaitza garbiagoa ematen du."],
        ["Internetik gabe dabil?", "Orria behin irekita, bihurketak ez du konexiorik behar. DocuSmart Desktop edo Androiderako aplikazioa instalatzen baduzu, erabat konexiorik gabe dabil."],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'pdf-tamaina-murriztu',
      title: "Nola murriztu PDF baten tamaina posta, WhatsApp edo izapideetarako | DocuSmart",
      description:
        "Zergatik den hain astuna PDF bat eta nola arindu irakurgarritasuna galdu gabe. Zer konpresio-maila aukeratu dokumentu motaren arabera. Doan eta fitxategiak igo gabe.",
      h1: "Nola murriztu PDF baten tamaina",
      lead: "«Fitxategiak baimendutako gehienezko tamaina gainditzen du.» Mezu hori agertu bazaizu atari batean edo posta elektronikoan, gida honek azaltzen du zergatik gertatzen den eta nola konpondu dokumentua irakurgaitz bihurtu gabe.",
      sections: [
        {
          h2: "Zergatik den hain astuna PDF bat",
          body: [
            "PDF batean gehien pisatzen dutenak irudiak dira. Wordetik testuarekin bakarrik sortutako dokumentu batek ehunka kilobyte inguru pisatu ohi ditu, orri asko izan arren. Argazkiekin edo bereizmen handian konfiguratutako eskaner batekin osatutakoak erraz gaindi ditzake 10 MB, orri gutxirekin.",
            "Horregatik, konpresioak oso modu desberdinean funtzionatzen du PDF motaren arabera: testu-dokumentu batean gutxi dago murrizteko; eskaneatutako batean, asko.",
          ],
        },
        {
          h2: "Zer maila aukeratu",
          body: [
            { ul: [
              "**Galerarik gabe:** fitxategiaren egitura optimizatzen du kalitatea ukitu gabe. Testua hautagarria izaten jarraitzen du. Aukera segurua da kontratuetarako, fakturetarako eta dokumentu digitaletarako.",
              "**Ertaina:** eskaneatutako dokumentuetarako eta argazkietarako gomendatua. Pisua asko murrizten du eta ondo irakurtzen jarraitzen da.",
              "**Handia:** muga oso zorrotza denerako. Kontuz: Ertaina eta Handia mailetan testua irudi gisa geratzen da, eta, beraz, ezin da hautatu.",
            ] },
            { tip: "Hasi «Galerarik gabe» mailarekin. Behar duzun tamainara iristen ez bada, probatu «Ertaina». DocuSmart-ek zenbat murriztu den erakusten dizu bidali aurretik." },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Konprimitu PDFa](/comprimir-pdf), aukeratu fitxategia eta hautatu maila. Ukitu «Konprimatu PDFa»: aurreko eta ondorengo pisua ikusiko duzu, eta emaitza deskargatzen da.",
            "PDFa dagoeneko optimizatuta bazegoen eta ezin bada gehiago murriztu, DocuSmart-ek abisatu egiten dizu eta ez du kopia berdin edo astunagorik deskargatzen.",
          ],
        },
        {
          h2: "Hala ere nahikoa ez bada",
          body: [
            { ul: [
              "**Zatitu dokumentua:** atari askok hainbat eranskin onartzen dituzte. [Zatitu PDFa](/dividir-pdf) tresnarekin bi fitxategitan edo gehiagotan banatzen duzu.",
              "**Konprimitu argazkiak PDFa osatu aurretik:** [Konprimitu irudia](/comprimir-imagen) tresnak mugikorreko argazki bat % 60 eta % 90 artean murrizten du, ia alde nabarmenik gabe.",
              "**Kendu soberan dauden orriak:** [Ordenatu PDF orriak](/ordenar-paginas-pdf) tresnarekin azalak edo orri zuriak ezabatzen dituzu.",
            ] },
          ],
        },
        {
          h2: "Ohiko mugak",
          body: [
            "Erreferentzia gisa: Gmailek 25 MB arteko eranskinak onartzen ditu, eta Outlookek, 20 MB artekoak. Administrazioaren eta bankuen atari askok 2 eta 5 MB artean eskatzen dute fitxategi bakoitzeko. Berrikusi beti igo nahi duzun lekuko muga.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Konprimitu PDFa", text: "Ireki docusmart.online webguneko Konprimitu PDFa tresna." },
        { name: "Aukeratu fitxategia", text: "Hautatu astunegia den PDFa." },
        { name: "Hautatu maila", text: "«Galerarik gabe» dokumentu digitaletarako; «Ertaina» edo «Handia» eskaneatutakoetarako eta argazkietarako." },
        { name: "Konprimitu", text: "Ukitu «Konprimatu PDFa», begiratu zenbat murriztu den eta deskargatu emaitza." },
      ],
      faq: [
        ["Konprimitzeak dokumentua hondatzen du?", "«Galerarik gabe» mailarekin, ez: edukia berdin-berdin geratzen da. «Ertaina» eta «Handia» mailekin orriak irudi arinago bihurtzen dira; ondo irakurtzen dira, baina testu hautagarria galtzen dute."],
        ["Nire PDFa Internetera igotzen da?", "Ez. Konpresioa nabigatzailearen barruan egiten da: fitxategia ez da inoiz zure gailutik ateratzen."],
        ["Zergatik ez da ia murriztu nire PDFa?", "Seguruenik testu-PDF bat da edo dagoeneko optimizatuta zegoen. Kasu horietan pisua txikia da jada eta gutxi dago kentzeko."],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'pdf-sinatu-inprimatu-gabe',
      title: "Nola sinatu PDF bat inprimatu gabe (mugikorretik edo PCtik) | DocuSmart",
      description:
        "Sinatu PDF dokumentu bat inprimatu eta eskaneatu gabe: marraztu sinadura, idatzi edo erabili argazki bat. Zer baliozkotasun duen sinadura elektroniko soil batek. Doan.",
      h1: "Nola sinatu PDF bat inprimatu gabe",
      lead: "Inprimatu, boligrafoz sinatu, eskaneatu eta berriro bidali: urrats bakar batez ordezka ditzakezun lau urrats. Hona hemen nola sinatu PDF bat mugikorretik edo ordenagailutik.",
      sections: [
        {
          h2: "Sinadura sortzeko hiru modu",
          body: [
            { ul: [
              "**Marraztu** hatzarekin mugikorrean edo saguarekin ordenagailuan.",
              "**Idatzi zure izena**, eskuz idatzitako letrarekin erakusten dena.",
              "**Igo paperean egindako zure sinaduraren argazki bat.** Betiko zure sinaduraren antz handiena duena da.",
            ] },
            { tip: "Argazkirako: sinatu tinta ilunarekin orri zuri batean, argi onarekin eta itzalik gabe. DocuSmart-ek atzealdea kentzen du, trazua bakarrik gera dadin." },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Sinatu PDFa](/firmar-pdf) eta aukeratu dokumentua. Sortu zure sinadura hiru moduetako edozeinekin.",
            "Arrastatu sinadura doan lekura eta doitu tamaina. Dokumentuak orri bakoitzean inizialak eskatzen baditu, erabili «Errepikatu orri guztietan». Ukitu «Sinatu PDFa».",
          ],
        },
        {
          h2: "Datuak ere bete behar badira",
          body: [
            "Sinatzeko dokumentu asko inprimakiak dira: izena, NANaren zenbakia, data. PDFak eremu betegarriak baditu, bete itzazu lehenik [Bete PDF inprimakia](/llenar-formulario-pdf) tresnarekin, eta ondoren sinatu. Bidali aurretik, markatu «Berdindu inprimakia», erantzunak finko gera daitezen.",
          ],
        },
        {
          h2: "Sinatzean ohikoak diren akatsak",
          body: [
            { ul: [
              "**Sinadura txikiegia edo pixelatua:** handitu sinadura-lerroaren tartea bete arte; argazki batetik badator, atera argi onarekin eta gertutik.",
              "**Sinadura testuaren gainean:** mugitu dokumentuko daturik estaltzen ez duen arte; klausula baten gainean sinadura duen kontratu batek zalantzak sor ditzake.",
              "**Bertsio okerra sinatzea:** egiaztatu azken dokumentua dela sinatu aurretik; gero zuzentzeak berriro sinatzera behartzen du.",
              "**Gainerako orriak ahaztea:** dokumentuak orri bakoitzean sinadura edo inizialak eskatzen baditu, erabili «Errepikatu orri guztietan», orriz orri joan beharrean.",
            ] },
          ],
        },
        {
          h2: "Baliozkotasun juridikoa du?",
          body: [
            "Lortzen dena **sinadura elektroniko soila** da: zure sinaduraren irudia dokumentuaren gainean, eskuz sinatzearen baliokide digitala. Eguneroko izapide gehienetarako balio du: alokairu-kontratuak, baimenak, enpresako agiriak edo eskolako baimenak.",
            "Izapide batzuek **ziurtagiridun sinadura digitala** eskatzen dute, baimendutako ziurtapen-erakunde batek emandakoa (Izenpe, FNMT edo NAN elektronikoa, adibidez); esaterako, administrazio publikoaren aurreko zenbait izapide edo fakturazio elektronikoa. Izapideak berariaz eskatzen badu, irudi-sinadura ez da nahikoa.",
          ],
        },
        {
          h2: "Zure sinadura ez da inon gordetzen",
          body: [
            "Sinadura eta dokumentua nabigatzailearen barruan prozesatzen dira. Ez dira zerbitzari batera igotzen eta ez dira gordetzen: orria ixtean, sinadura ezabatu egiten da. Dokumentua bide ez oso fidagarri batetik bidali behar baduzu, pasahitza jar diezaiokezu [Babestu PDFa](/proteger-pdf) tresnarekin.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Sinatu PDFa", text: "Ireki docusmart.online webguneko Sinatu PDFa tresna eta aukeratu dokumentua." },
        { name: "Sortu sinadura", text: "Marraztu, idatzi zure izena edo igo paperean egindako sinaduraren argazki bat." },
        { name: "Kokatu", text: "Arrastatu bere lekura eta doitu tamaina; orri guztietan errepika dezakezu." },
        { name: "Deskargatu", text: "Ukitu «Sinatu PDFa» PDF sinatua lortzeko." },
      ],
      faq: [
        ["Mugikorretik sina dezaket?", "Bai. Mugikorrean sinadura hatzarekin marraztu dezakezu edo paperean egindako sinaduraren argazki bat atera."],
        ["Sinatutako dokumentua alda daiteke?", "Sinadura orrian txertatuta geratzen da. Nahi ez diren aldaketak eta sarbideak saihesteko, PDFa pasahitzarekin babestu eta aldatzeko baimena ken dezakezu."],
        ["Hainbat orri sina ditzaket?", "Bai: gehitu sinadura nahi duzun orri bakoitzean edo erabili «Errepikatu orri guztietan»."],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'dokumentuak-mugikorrarekin-eskaneatu',
      title: "Nola eskaneatu dokumentuak mugikorrarekin eta PDFan gorde | DocuSmart",
      description:
        "Eskaneatu dokumentuak mugikorreko kamerarekin, aplikaziorik instalatu gabe: moztu automatikoa, itzalak kentzen dituen iragazkia eta testu bilagarridun PDFa. Aholkuak.",
      h1: "Nola eskaneatu dokumentuak mugikorrarekin",
      lead: "Ez duzu eskanerrik behar ezta aplikaziorik instalatu ere: mugikorreko kamera eta nabigatzailea nahikoak dira PDF garbi, moztu eta testua ezagututa duen bat lortzeko.",
      sections: [
        {
          h2: "Zer egiten duen eskaner batek (eta zergatik ez den nahikoa argazki soil bat)",
          body: [
            "Orri baten argazkia ia inoiz ez da perfektu ateratzen: pixka bat okertuta geratzen da, inguruko mahaia ikusten da eta paper zuria gris edo itzalekin agertzen da. Mugikorreko eskaner batek hori zuzentzen du: orriaren lau izkinak aurkitzen ditu, goitik argazkia aterako bazenio bezala zuzentzen du eta atzealdea zuritzen du.",
            "Hori egiten du [Eskaneatu dokumentua](/escanear-documento) tresnak, zuzenean nabigatzailean.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Eskaneatu dokumentua](/escanear-documento) eta ukitu «Atera argazkia»: mugikorrean kamera irekitzen da. Dagoeneko dituzun argazkiak ere aukera ditzakezu.",
            "Berrikusi DocuSmart-ek aurkitutako izkinak; batenbat gaizki geratu bada, arrastatu orriaren muturreraino. Aukeratu «Dokumentua» iragazkia papera zuritzeko eta itzalak kentzeko. Gehitu orri gehiago dokumentuak hainbat orri baditu.",
            "Ukitu «Sortu PDFa». «Egin PDF bilagarria» markatzen baduzu, testua ere ezagutzen da, hitzak bilatu eta kopiatu ahal izateko.",
          ],
        },
        {
          h2: "Eskaneatze garbi baterako bost trikimailu",
          body: [
            { ul: [
              "Jarri orria gainazal ilun baten gainean: kontrasteak ertzak detektatzen laguntzen du.",
              "Bilatu argi naturala edo albotik datorren lanpara bat; saihestu flash zuzena, distirak sortzen baititu.",
              "Eutsi mugikorrari orriarekiko paralelo eta itxaron fokatu arte.",
              "Zabaldu ondo orria: tolesturek iragazkiak beti kentzen ez dituen itzalak sortzen dituzte.",
              "Hainbat orri badira, eskaneatu denak saio berean eta PDF bakar batean aterako dira.",
            ] },
          ],
        },
        {
          h2: "Dagoeneko duzun eskaneatu baten testua ezagutzea",
          body: [
            "Eskaneatutako PDF bat edo argazki bat baduzu eta haren testua kopiatu behar baduzu, erabili [OCR: ezagutu testua](/ocr-pdf): gaztelaniaz eta ingelesez inprimatutako testua ezagutzen du eta kopiatzeko ematen dizu, .txt fitxategi gisa edo PDF bilagarri gisa. Hobeto dabil eskaneatu garbi eta zuzenekin; eskuz idatzitako letra gaizki ezagutu ohi da.",
          ],
        },
        {
          h2: "Pribatua hasieratik amaierara",
          body: [
            "Ertzen detekzioa, zuzenketa, iragazkiak eta testuaren ezagutza nabigatzailearen barruan egiten dira. Argazkiak ez dira inongo zerbitzaritara igotzen. Sarri eskaneatzen baduzu, Androiderako DocuSmart aplikazioak gauza bera egiten du konexiorik gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Eskaneatu dokumentua", text: "Ireki docusmart.online webguneko Eskaneatu dokumentua tresna eta ukitu «Atera argazkia»." },
        { name: "Doitu izkinak", text: "Berrikusi moztea eta arrastatu izkinak behar izanez gero." },
        { name: "Aukeratu iragazkia", text: "«Dokumentua» iragazkiak papera zuritu eta itzalak kentzen ditu." },
        { name: "Gorde PDFa", text: "Ukitu «Sortu PDFa»; markatu «Egin PDF bilagarria» testua ezagutzeko." },
      ],
      faq: [
        ["Aplikazio bat instalatu behar dut?", "Ez. Mugikorreko edo ordenagailuko nabigatzailean dabil. Androiderako aplikazioa aukerakoa da, konexiorik gabe eskaneatzeko."],
        ["Zer da PDF bilagarri bat?", "Irudiaz gain testua ezagututa duen PDF bat: hitzak bilatu, hautatu eta kopia ditzakezu."],
        ["Zer egin ertzak ondo aurkitzen ez baditu?", "Arrastatu izkina bakoitza orriaren muturreraino edo erabili «Argazki osoa». Laguntzen du paperak atzealdearekin kontrastea izateak."],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'pdf-pasahitzarekin-babestu',
      title: "Nola jarri pasahitza PDF bati (eta noiz komeni den) | DocuSmart",
      description:
        "Babestu PDF bat pasahitzarekin eta AES-256 zifratzearekin, kontrolatu inprima edo kopia daitekeen eta ikasi gakoa modu seguruan partekatzen. Doan eta fitxategia igo gabe.",
      h1: "Nola jarri pasahitza PDF bati",
      lead: "Zure datu pertsonalak, finantzarioak edo medikoak dituen PDF bat, posta elektronikoz edo txatez bidaiatzen duena, edonon amai daiteke. Pasahitza jartzeak minutu bat besterik ez du behar, eta ez dio uzten ireki behar ez duenari irekitzen.",
      sections: [
        {
          h2: "Noiz komeni den PDF bat babestea",
          body: [
            { ul: [
              "Nortasun-agiriak, banku-laburpenak, nominak edo errenta-aitorpenak.",
              "Historia klinikoak, analisien emaitzak edo lan-ezintasuneko bajak.",
              "Zabaltzea nahi ez duzun kontratuak edo proposamenak.",
              "Kontrolatzen ez duzun bide batetik bidali behar duzun edozein fitxategi, birbidaltzen den mezu elektroniko bat edo txat-talde bat, adibidez.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Babestu PDFa](/proteger-pdf) eta aukeratu dokumentua. Idatzi pasahitza bi aldiz.",
            "Erabaki zer baimentzen den PDFa irekita dagoenean: inprimatu, testua kopiatu edo aldatu. Ukitu «Babestu PDFa» eta bertsio zifratua deskargatzen da. Adobe Acrobat, Chrome, Edge eta DocuSmart aplikazioarekin irekitzen da, eta pasahitza eskatzen dute.",
          ],
        },
        {
          h2: "Pasahitz on bat eta nola partekatu",
          body: [
            { ul: [
              "Erabili gutxienez 10 karaktere; zenbakiak dituen esaldi labur bat erraz gogoratzen da eta zaila da asmatzen.",
              "Ez erabili zure NANaren zenbakia edo jaiotze-data: hori da norbaitek probatuko lukeen lehen gauza.",
              "**Ez bidali inoiz pasahitza PDFaren bide beretik.** Fitxategia posta elektronikoz badoa, bidali gakoa mezu bidez edo esan telefonoz.",
            ] },
            { tip: "Gorde pasahitza leku seguru batean. Ahazten baduzu, ezin da berreskuratu: DocuSmart-ek berak ere ezin du PDFa ireki, gakoa ez baita inoiz zure gailutik ateratzen." },
          ],
        },
        {
          h2: "Zer babesten duen aukera bakoitzak",
          body: [
            "**Irekitzeko pasahitza** da benetako babesa: hura gabe, fitxategi zifratua ezin da irakurri. **Baimenak** (inprimatu, kopiatu, aldatu) beste gauza bat dira: dokumentua ireki ondoren zer baimendu behar duten adierazten diete PDF irakurgailuei.",
            "Programa serioek baimen horiek errespetatzen dituzte, baina pasahitza duenak tresna batzuekin ken ditzake. Erabili nahi gabeko kopiak edo ustekabeko aldaketak saihesteko, ez hesi bakar gisa. Norbaitek datu bat ikusi behar ez badu, ez eman pasahitza edo ezabatu datu hori fitxategia bidali aurretik.",
          ],
        },
        {
          h2: "Pasahitza ez da datuak ezabatzearen gauza bera",
          body: [
            "Pasahitzak fitxategia irekitzea eragozten du, baina hura duenak eduki guztia ikusiko du. Dokumentu bat datu jakin batzuk bakarrik ezkutatuta partekatu behar baduzu (kontu-zenbaki bat, helbide bat), erabili [Ezabatu PDFko datuak](/censurar-pdf): estalitako eremuen azpiko testua benetan ezabatzen du, gainean lauki beltz soil bat jarri beharrean.",
          ],
        },
        {
          h2: "Pasahitza geroago kentzea",
          body: [
            "Aurrerago babesik gabeko kopia bat behar baduzu, [Desblokeatu PDFa](/desbloquear-pdf) tresnak kentzen du, pasahitza ezagutzen baduzu. Erabili zure dokumentuekin edo aldatzeko eskubidea duzunekin bakarrik.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Babestu PDFa", text: "Ireki docusmart.online webguneko Babestu PDFa tresna eta aukeratu dokumentua." },
        { name: "Idatzi pasahitza", text: "Idatzi bi aldiz berresteko." },
        { name: "Aukeratu baimenak", text: "Markatu inprimatzea, kopiatzea edo aldatzea baimentzen den." },
        { name: "Babestu eta deskargatu", text: "Ukitu «Babestu PDFa» eta dokumentu zifratua deskargatzen da." },
      ],
      faq: [
        ["Zenbateraino da segurua?", "AES-256 zifratzea erabiltzen du, PDFen estandarrik sendoena. Benetako segurtasuna pasahitza asmatzen zaila izatearen araberakoa da."],
        ["Nire pasahitza zerbitzariren batera bidaltzen da?", "Ez. Zifratzea nabigatzailean egiten da; ez fitxategia ez pasahitza ez dira zure gailutik ateratzen."],
        ["Beste norbaiten PDF bati pasahitza ken diezaioket?", "Pasahitza ezagutzen baduzu bakarrik. DocuSmart-ek ez ditu irekitzeko pasahitzak hausten."],
      ],
    },
  },
}
