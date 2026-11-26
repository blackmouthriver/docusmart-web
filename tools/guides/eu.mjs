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
            "Ireki [Konprimitu PDFa](/comprimir-pdf), aukeratu fitxategia eta hautatu maila. Ukitu «Konprimitu PDFa»: aurreko eta ondorengo pisua ikusiko duzu, eta emaitza deskargatzen da.",
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
        { name: "Konprimitu", text: "Ukitu «Konprimitu PDFa», begiratu zenbat murriztu den eta deskargatu emaitza." },
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
            "Eskaneatutako PDF bat edo argazki bat baduzu eta haren testua kopiatu behar baduzu, erabili [OCR: ezagutu testua](/ocr-pdf): 12 hizkuntzatan (euskaraz, gaztelaniaz, ingelesez, frantsesez, errusieraz, japonieraz, txineraz eta gehiagotan) inprimatutako testua ezagutzen du eta kopiatzeko ematen dizu, .txt fitxategi gisa edo PDF bilagarri gisa. Hobeto dabil eskaneatu garbi eta zuzenekin; eskuz idatzitako letra gaizki ezagutu ohi da.",
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
    'dividir-pdf-en-varios-archivos': {
      slug: 'pdfa-hainbat-fitxategitan-zatitu',
      title: "Nola zatitu PDF bat hainbat fitxategitan edo orri batzuk atera | DocuSmart",
      description:
        "Bereizi PDF bat orrika, tarteka, N orrialdero, laster-marken arabera edo tamainaren arabera, edo atera behar dituzun orriak soilik. Doan eta fitxategia igo gabe.",
      h1: "Nola zatitu PDF bat hainbat fitxategitan edo orri batzuk bakarrik atera",
      lead: "Atari batek sinaduraren orria bakarrik eskatzen du, edo 80 orriko PDF bat ez da posta elektronikoan sartzen. Hona hemen nola zatitu PDF bat edo behar diren orriak atera, nabigatzailetik bertatik.",
      sections: [
        {
          h2: "Zatitzeko sei modu",
          body: [
            "Hasi aurretik, komeni da jakitea zer behar duzun, [Zatitu PDFa](/dividir-pdf) tresnak kasu bakoitzerako modu bat baitu:",
            { ul: [
              "**Aukeratu orriak**: ukitu miniaturak (edo idatzi «1-3, 5») eta orri horiek bakarrik dituen PDF bat sortzen da.",
              "**Tarteka**: hainbat tarte batera, eta bakoitza PDF bereizi gisa ateratzen da.",
              "**N orrialdero**: zati berdinak, adibidez 10 orrikoak.",
              "**Laster-marken arabera**: kapitulu bakoitzeko PDF bat, dokumentuak laster-marken aurkibidea badu.",
              "**Tamainaren arabera**: pisu jakin bat gainditzen ez duten zatiak, muga duten posta edo atarietarako.",
              "**Orri bakoitza bere aldetik**: PDF bat orri bakoitzeko.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Zatitu PDFa](/dividir-pdf) eta aukeratu fitxategia. Orrien miniaturak ikusiko dituzu. «Aukeratu orriak» moduan, ukitu eraman nahi dituzunak: urdinez markatuta geratzen dira eta goiko eremua bere kabuz betetzen da.",
            "Sakatu beheko botoia. Amaitzean, emaitza jatorrizkoaren ondoan ikusiko duzu berrikusteko, eta nahi duzun izenarekin deskargatuko duzu. Moduak hainbat fitxategi sortzen baditu, banan-banan edo denak batera ZIP batean jaso ditzakezu.",
            { tip: "Hainbat PDFtako orri solteak atera eta bakar batean biltzeko, azkarragoa da [Batu PDFak](/unir-pdf): han fitxategi bakoitzetik zein orri hartu aukera dezakezu." },
          ],
        },
        {
          h2: "Zatiek oraindik gehiegi pisatzen badute",
          body: [
            "Zatitzeak ez du kalitatea aldatzen: orri bakoitza dagoen bezala kopiatzen da. Zatiren batek muga gainditzen jarraitzen badu, erabili **Tamainaren arabera** modua edo pasa ezazu [Konprimitu PDFa](/comprimir-pdf) tresnatik. Bereizmen handian eskaneatutako orri bakar batek berak muga gaindi dezake: kasu horretan konprimitzea da irtenbidea.",
          ],
        },
        {
          h2: "Ohiko kasuak",
          body: [
            { ul: [
              "Atari batek zure NANa bi aldeetatik bakarrik eskatzen du: aukeratu bi orri horiek eta igo PDF hori bakarrik.",
              "Urte osoko banku-laburpen bat: hilabeteka laster-markak baditu, erabili **Laster-marken arabera**; bestela, **N orrialdero**.",
              "10 MBko muga duen posta: erabili **Tamainaren arabera**, jarri 10 eta zati guztiak mugaren azpitik geratuko dira.",
            ] },
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik ateratzen",
          body: [
            "Zatiketa zure nabigatzailean egiten da: PDFa ez da inongo zerbitzaritara igotzen. Horregatik erabil dezakezu banku-laburpenekin, historia klinikoekin edo kontratuekin, beste inon kopiarik utzi gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Zatitu PDFa", text: "Ireki docusmart.online webguneko Zatitu PDFa tresna eta aukeratu fitxategia." },
        { name: "Aukeratu modua", text: "Aukeratu orriak, tarteka, N orrialdero, laster-marken arabera, tamainaren arabera edo orri bakoitza bere aldetik." },
        { name: "Markatu orriak", text: "Ukitu miniaturak edo idatzi zenbakiak (adibidez, 1-3, 5)." },
        { name: "Zatitu eta deskargatu", text: "Sakatu botoia eta deskargatu emaitza, edo fitxategi guztiak ZIP batean." },
      ],
      faq: [
        ["Zatitzean kalitatea galtzen da?", "Ez. Orriak dauden bezala kopiatzen dira, jatorrizko testu eta irudiekin."],
        ["Pasahitza duen PDF bat zati dezaket?", "Murrizketak bakarrik baditu (pasahitzik gabe irekitzen da), bai. Irekitzeko pasahitza eskatzen badu, kendu lehenago Desblokeatu PDFa tresnarekin."],
        ["Zer gertatzen da laster-markekin?", "Laster-marken arabera moduan, aurkibideko kapitulu bakoitza PDF bat bihurtzen da, laster-markaren izenarekin."],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'pdf-orriak-biratu',
      title: "Nola biratu PDF baten orriak eta horrela gorde | DocuSmart",
      description:
        "Zuzendu albora edo buruz behera eskaneatutako orriak: biratu orri bat edo guztiak 90° ezkerrera edo eskuinera, eta gorde PDFa zuzen. Doan eta igo gabe.",
      h1: "Nola biratu PDF baten orriak (eta gordetzean horrela gera daitezen)",
      lead: "Eskaneatzean askotan gertatzen da: orri horizontal bat albora geratu da, edo orri bat buruz behera atera da. Ikustailean biratzeak ez du balio, bidaltzean berriro gaizki ikusiko baita. Hona hemen nola zuzendu fitxategian bertan.",
      sections: [
        {
          h2: "Zergatik ez den nahikoa ikustailean biratzea",
          body: [
            "PDF ikustaileek ikuspegia biratzen uzten dute, baina biraketa hori ez da fitxategian gordetzen: jasotzen duenak okertuta ikusiko du berriro. Ondo geratzeko, orriaren orientazioa PDFan bertan aldatu behar da, eta hori da [Biratu PDFa](/rotar-pdf) tresnak egiten duena.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Biratu PDFa](/rotar-pdf) eta aukeratu fitxategia. Orri bakoitza miniaturan agertzen da, eta azpian uneko biraketa (0°, 90°…). Ukitu orri bat 90° biratzeko, edo erabili orri bakoitzaren geziak ezkerrera edo eskuinera biratzeko. Dokumentu osoa albora badago, erabili «Guztiak ezkerrera» edo «Guztiak eskuinera».",
            "Orri guztiak zuzen ikusten direnean, sakatu «Biratu PDFa» eta deskargatu emaitza. Orientazioa bakarrik aldatzen da: testua, irudiak eta kalitatea berdin geratzen dira.",
            { tip: "Orriak gainera nahastuta geratu badira (bi aldeetatik eskaneatzean gertatzen da), jarraitu [Ordenatu PDF orriak](/ordenar-paginas-pdf) tresnarekin." },
          ],
        },
        {
          h2: "Okertuta ateratzen diren eskaneatuak",
          body: [
            "Biratzeak albora edo buruz behera dauden orrietarako balio du, 90°-ko jauzietan. Argazkia gradu batzuk makurtuta geratu bada, hobe da berriro eskaneatzea [Eskaneatu dokumentua](/escanear-documento) tresnarekin: orriaren ertzak detektatu eta bere kabuz zuzentzen du.",
          ],
        },
        {
          h2: "Ohiko kasuak",
          body: [
            "Bi aldeetatik eskaneatzean, ohikoa da atzealdea buruz behera ateratzea: ukitu orri horiek bi aldiz 180° biratzeko. Taula horizontalak dituen txosten batean, biratu orri horiek bakarrik, burua okertu gabe irakurtzeko; gainerakoak dauden bezala geratzen dira.",
            "PDFa mugikorreko argazkietatik badator, begiratu orientazioa sortzean: [Iruditik PDFra](/imagen-a-pdf) tresnak orientazio automatikoa, bertikala edo horizontala du, eta horrela ez duzu gero biratu beharko.",
          ],
        },
        {
          h2: "Pribatua hasieratik amaierara",
          body: [
            "PDFa zure nabigatzailearen barruan biratzen da. Ez da inongo zerbitzaritara igotzen eta ez da inon gordetzen: fitxa ixtean, desagertu egiten da. Berdin dabil ordenagailuan eta mugikorrean, eta orria behin kargatuta ez du estaldura onik behar.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Biratu PDFa", text: "Ireki docusmart.online webguneko Biratu PDFa tresna eta aukeratu PDFa." },
        { name: "Biratu orriak", text: "Ukitu albora dagoen orri bakoitza, edo erabili «Guztiak ezkerrera» edo «Guztiak eskuinera»." },
        { name: "Gorde", text: "Sakatu «Biratu PDFa» eta deskargatu fitxategia zuzen." },
      ],
      faq: [
        ["Orri bakar bat bira dezaket?", "Bai. Orri bakoitza bere aldetik biratzen da; gainerakoak zeuden bezala geratzen dira."],
        ["Kalitatea galtzen da?", "Ez. Orriaren orientazioa bakarrik aldatzen da; edukia ez da berriro konprimitzen."],
        ["Mugikorrean dabil?", "Bai, edozein nabigatzaile modernotan, Androiden eta iPhonean."],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'pdf-orriak-ordenatu',
      title: "Nola aldatu PDF baten orrien ordena | DocuSmart",
      description:
        "Mugitu PDF baten orriak arrastatuta, bikoiztu bat, gehitu orrialde zuriak edo kendu soberan daudenak, eta gorde ordena berria. Doan eta fitxategia igo gabe.",
      h1: "Nola aldatu PDF baten orrien ordena",
      lead: "Bi aldeetatik eskaneatu eta tartekatuta atera den dokumentu bat, hasieran joan behar zuen eranskin bat edo errepikatutako orri bat: hona hemen nola ordenatu PDF bat orriz orri.",
      sections: [
        {
          h2: "Zer egin dezakezun orri bakoitzarekin",
          body: [
            "[Ordenatu PDF orriak](/ordenar-paginas-pdf) tresnan orri bakoitza txartel bat da, eta harekin hau egin dezakezu:",
            { ul: [
              "**Mugitu**: bere tokira arrastatuta, edo aurrera eta atzera eramateko geziekin (erosoagoa mugikorrean).",
              "**Bikoiztu**: adibidez, azal bat edo sinaduren orri bat errepikatzeko.",
              "**Gehitu orrialde zuri bat** haren ondoren, tokia uzteko edo atalak bereizteko.",
              "**Kendu**, soberan badago.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Ordenatu PDF orriak](/ordenar-paginas-pdf) eta aukeratu PDFa. Mugitu orriak behar dituzun moduan geratu arte: txartel bakoitzeko zenbakiak («2. or.», «1. or.»…) gogorarazten dizu nondik zetorren, eta horrela ez zara galtzen.",
            "Ordena ondo dagoenean, sakatu «Aplikatu ordena berria» eta deskargatu PDFa. Orriak dauden bezala kopiatzen dira: ez testua ez kalitatea ez dira aldatzen.",
            { tip: "Ordenatu nahi dituzun orriak hainbat fitxategitan badaude, batu lehenik [Batu PDFak](/unir-pdf) tresnarekin eta ondoren ordenatu hemen." },
          ],
        },
        {
          h2: "Orriak ateratzeko, hobe zatitzea",
          body: [
            "Orri batzuk bakarrik gorde nahi badituzu, [Zatitu PDFa](/dividir-pdf) azkarragoa da: eramango dituzunak markatu eta kito. Ordenatzeak balio du dokumentu osoa geratzen denean, baina beste ordena batean.",
          ],
        },
        {
          h2: "Ohiko kasuak",
          body: [
            "Bi aldeak bere kabuz eskaneatzen ez dituen gailu batean eskaneatzean, aurrealde guztiak ateratzen dira lehenik eta gero atzealdeak. Tartekatzeko, eraman azken orria lehenengoaren atzera, azkenaurrekoa hirugarrenaren atzera, eta horrela amaierara arte: geziekin azkar egiten da.",
            { ul: [
              "Hasieran joan behar zuen eranskin bat: eraman lehen orriaren aurrera.",
              "Bi tokitan doan sinaduren orri bat: bikoiztu eta eraman kopia behar den tokira.",
              "Bi aldeetatik inprimatzean orri bakoitian hasi behar duten kapituluak: gehitu orrialde zuri bat aurretik.",
            ] },
          ],
        },
        {
          h2: "Zure fitxategiak igo gabe",
          body: [
            "Ordena berria zure nabigatzailean osatzen da. Dokumentuak ez du Internetetik bidaiatzen eta ez da kopiarik geratzen inongo zerbitzaritan. Horregatik ordena ditzakezu lasai espedienteak, historia klinikoak edo zure gailutik atera behar ez diren lan-dokumentuak.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Ordenatu PDF orriak", text: "Ireki docusmart.online webguneko Ordenatu PDF orriak tresna eta aukeratu PDFa." },
        { name: "Mugitu orriak", text: "Arrastatu edo erabili geziak; bikoiztu, gehitu orrialde zuriak edo kendu soberan daudenak." },
        { name: "Aplikatu eta deskargatu", text: "Sakatu «Aplikatu ordena berria» eta deskargatu PDF ordenatua." },
      ],
      faq: [
        ["Mugikorretik ordena dezaket?", "Bai. Arrastatzeaz gain, orri bakoitzak geziak ditu aurrera edo atzera eramateko, errazagoak hatzarekin."],
        ["Estekak eta inprimakiak mantentzen dira?", "Orriak beren edukiarekin kopiatzen dira; berrikusi emaitza dokumentuak inprimaki konplexuak baditu."],
        ["Orri kopuruaren mugarik badago?", "Ez dago kopuru finkorik; dokumentu oso handiekin pixka bat gehiago tarda dezake miniaturak erakusten."],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'pdf-orriak-zenbakitu',
      title: "Nola jarri orri-zenbakiak PDF bati | DocuSmart",
      description:
        "Gehitu orri-zenbakiak PDF bati: kokapena, «1», «1 / 10» edo «1. orrialdea / 10» formatua, zein zenbakitatik hasi eta azala zenbakitu gabe. Doan eta igo gabe.",
      h1: "Nola jarri orri-zenbakiak PDF bati",
      lead: "Tesi bat, txosten bat edo espediente bat askoz hobeto berrikusten dira orriak zenbakituta daudenean. Hona hemen nola zenbakitu zenbakirik ez duen PDF bat, eskatzen dizuten formatuan.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Zenbakitu PDF orriak](/numerar-paginas-pdf) eta aukeratu PDFa. Aukeratu non joango den zenbakia (goian edo behean, ezkerrean, erdian edo eskuinean) eta formatua: «1», «1 / 10» edo «1. orrialdea / 10».",
            "Sakatu «Zenbakitu orriak». Lehen eta ondoren ikusiko dituzu elkarren ondoan, orriz orri, zenbakiak ezer estaltzen ez duela egiaztatzeko. Gero deskargatu.",
          ],
        },
        {
          h2: "Ohiko kasuak konpontzen dituzten aukerak",
          body: [
            { ul: [
              "**Zenbakirik gabe lehenengoetan**: jarri 1 azala ez zenbakitzeko, edo gehiago aurkibidea edo eskaintza badago.",
              "**Hasi hemendik**: zenbakiketak beste dokumentu batena jarrai dezan, adibidez 25etik aurrera.",
              "**Testua**: idatzi, adibidez, «{n}. folioa» edo «{n} / {total}»; {n} orrialde-zenbakia da eta {total}, azkena.",
              "**Tamaina eta kolorea**: txikia, ertaina edo handia, eta nahi duzun kolorea.",
            ] },
            { tip: "Dokumentua hainbat fitxategitan banatuta badago, batu lehenik [Batu PDFak](/unir-pdf) tresnarekin, zenbakiketa jarraitua izan dadin." },
          ],
        },
        {
          h2: "Zenbakiak edukia estal ez dezan",
          body: [
            "Dokumentu askok badute zerbait orri-oinean (logo bat, helbide bat). Zenbakia gainean erortzen bada, aldatu izkinaz edo igo goialdera: lehen eta ondoren ikuspegiak orri bakoitza erakusten dizu deskargatu aurretik, eta geziekin batetik bestera pasa zaitezke.",
          ],
        },
        {
          h2: "Zenbakitu amaieran",
          body: [
            "Zenbakia orri bakoitzean marrazten da. Gero orriak berrordenatu edo gehitzen badituzu, zenbakiak haiekin mugitzen dira eta ez dira jada segidakoak. Horregatik komeni da amaieran zenbakitzea: lehenik batu, ordenatu eta kendu soberakoa, eta zenbakitu behin betiko bertsioa.",
            "Erakundeetarako dokumentuetan edo espedienteetan, folioez hitz egiten denean, idatzi «{n}. folioa» testuan. Eta dokumentuak beste baten zenbakiketa jarraitzen badu, doitu «Hasi hemendik».",
          ],
        },
        {
          h2: "Dena zure nabigatzailean",
          body: [
            "Zenbakiketa zure gailuan gehitzen da: PDFa ez da inongo zerbitzaritara igotzen. Dokumentuaren testuak testu izaten jarraitzen du: lehen bezala bila eta kopia daiteke, eta zenbakia ere testu gisa geratzen da, garbi inprimatzean.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Zenbakitu PDF orriak", text: "Ireki docusmart.online webguneko Zenbakitu PDF orriak tresna eta aukeratu PDFa." },
        { name: "Aukeratu kokapena eta formatua", text: "Adibidez, behean eskuinean eta «1. orrialdea / 10»." },
        { name: "Doitu behar dena", text: "Azala zenbakirik gabe, zein zenbakitatik hasi, tamaina eta kolorea." },
        { name: "Zenbakitu eta deskargatu", text: "Berrikusi lehen eta ondoren, eta deskargatu PDF zenbakitua." },
      ],
      faq: [
        ["Azala zenbakitu gabe utz dezaket?", "Bai. «Zenbakirik gabe lehenengoetan» eremuan jarri 1 (edo saltatu nahi dituzun orriak)."],
        ["Beste zenbaki batetik has naiteke?", "Bai. «Hasi hemendik» eremuan lehen zenbakia jartzen duzu, adibidez 25."],
        ["«Folioa» idatz daiteke zenbakiaren ondoan?", "Bai. Testuan idatzi «{n}. folioa» eta orri bakoitzak bere zenbakia erakutsiko du {n}-ren ordez."],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'pdfari-ur-marka-jarri',
      title: "Nola jarri ur-marka bat PDF bati (testua edo logoa) | DocuSmart",
      description:
        "Gehitu «KONFIDENTZIALA», «KOPIA» edo zure logoa PDF bati: kokapena, mosaikoa, angelua, tamaina, opakutasuna eta zein orritan. Doan, nabigatzailean eta igo gabe.",
      h1: "Nola jarri ur-marka bat PDF bati (testua edo logoa)",
      lead: "Proposamen bat zirriborro gisa bidaltzeko, zure NANaren kopia bat «X izapiderako bakarrik» markatzeko edo katalogo batean zure logoa jartzeko: hona hemen nola gehitu ur-marka bat PDF bati.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Ur-marka PDFan](/marca-de-agua-pdf) eta aukeratu PDFa. Idatzi testua («KONFIDENTZIALA» dator adibide gisa) edo aldatu «Irudia edo logoa» aukerara zurea erabiltzeko.",
            "Sakatu «Aplikatu ur-marka»: lehen eta ondoren ikusiko dituzu elkarren ondoan. Zerbait aldatu nahi baduzu, doitu eta aplikatu berriro; gustatzen zaizunean, deskargatu.",
          ],
        },
        {
          h2: "Nola doitu",
          body: [
            { ul: [
              "**Kokapena**: erdian, izkina batean edo ertz batean, edo **mosaikoan** orrialde osoan errepika dadin.",
              "**Biraketa**: 0°, 45°, 90° edo −45°. Diagonala da klasikoena eta mozten zailena.",
              "**Tamaina, opakutasuna eta kolorea**: opakutasun txiki batek (% 20) dokumentua irakurtzen uzten du; handiagoak ikusgarriago egiten du.",
              "**Edukiaren gainean edo atzean**: atzean diskretuagoa da testu asko duten dokumentuetan.",
              "**Orrialdeak**: guztiak, edo batzuk bakarrik (adibidez, 1-3, 5).",
            ] },
          ],
        },
        {
          h2: "Ur-marka bat dokumentuen kopietarako",
          body: [
            "Zure NANaren edo banku-laburpen baten kopia eskatzen badizute, jarri marka bat mosaikoan, «Alokairu-izapiderako bakarrik, 2026ko urtarrila» bezalakoa. Horrela, kopia beste nonbait amaitzen bada, nabarmena izango da zertarako eman zenuen.",
            { tip: "Gainera gakorik gabe ireki ezin izatea nahi baduzu, pasa ezazu gero [Babestu PDFa pasahitzarekin](/proteger-pdf) tresnatik." },
          ],
        },
        {
          h2: "Testu-ideiak",
          body: [
            { ul: [
              "«ZIRRIBORROA», oraindik behin betikoak ez diren bertsioetarako.",
              "«KOPIA» edo «KOPIA KONTROLATUA», banatzen diren dokumentuetarako.",
              "«[Izapidea] egiteko bakarrik — [data]», nortasun-agirien kopietan.",
              "«ERAKUSGARRIA», katalogoetan, txantiloietan edo oraindik ordaindu ez diren lanetan.",
            ] },
            "Marka irakur dadin dokumentua oztopatu gabe, % 15 eta % 30 arteko opakutasunak ondo funtzionatu ohi du. Mosaikoan, tamaina txiki edo ertain batek itxura garbiagoa du. Deskargatu aurretik, berrikusi hainbat orri lehen eta ondoren ikuspegian.",
          ],
        },
        {
          h2: "Dokumentua igo gabe",
          body: [
            "Marka zure nabigatzailearen barruan gehitzen da. PDFa ez da inongo zerbitzaritara igotzen, eta hori garrantzitsua da hain zuzen ere ur-marka behar duten dokumentuekin: nortasun-agirien kopiak, proposamen komertzialak edo barne-dokumentuak.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Ur-marka PDFan", text: "Ireki docusmart.online webguneko Ur-marka PDFan tresna eta aukeratu PDFa." },
        { name: "Idatzi testua edo aukeratu zure logoa", text: "Adibidez, «KONFIDENTZIALA» edo «KOPIA»." },
        { name: "Doitu kokapena eta estiloa", text: "Erdian edo mosaikoan, angelua, tamaina, opakutasuna, kolorea eta orrialdeak." },
        { name: "Aplikatu eta deskargatu", text: "Berrikusi lehen eta ondoren, eta deskargatu PDFa." },
      ],
      faq: [
        ["Nire logoa erabil dezaket?", "Bai. Aukeratu «Irudia edo logoa» eta igo irudi bat; atzealde gardeneko PNG bat hobea da."],
        ["Gero ken daiteke?", "PDFan marraztuta geratzen da. Gorde markarik gabeko jatorrizkoa, berriro behar baduzu ere."],
        ["Orri batzuetan bakarrik jar dezaket?", "Bai. «Orrialdeak» eremuan idatzi zeintzuk, adibidez 1-3, 5."],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'pdfa-programarik-gabe-editatu',
      title: "Nola editatu PDF bat programarik instalatu gabe | DocuSmart",
      description:
        "Gehitu edo ordeztu testua, nabarmendu, estali, marraztu, jarri geziak, irudiak eta estekak PDF batean nabigatzailetik, ezer instalatu gabe eta fitxategia igo gabe.",
      h1: "Nola editatu PDF bat programarik instalatu gabe",
      lead: "Data bat zuzentzea, falta zen datu bat osatzea, klausula bat nabarmentzea edo zerbait ezabatzea: horretarako ez da ordainpeko programarik behar. Hona hemen nola editatu PDF bat nabigatzailean.",
      sections: [
        {
          h2: "Editorearen tresnak",
          body: [
            "Orriaren gainean barra bat duzu [Editatu PDFa](/editar-pdf) tresnan gehi dezakezun guztiarekin:",
            { ul: [
              "**Testua**: ukitu orrian idatzi nahi duzun tokia eta idatzi beheko laukian; aukeratu letra-tipoa, tamaina, lodia eta kolorea.",
              "**Ordeztu**: ukitu PDFak dagoeneko duen testu bat eta aldatu; jatorrizkoa dokumentutik ezabatzen da, ez da estaltzen bakarrik.",
              "**Laukizuzena, zirkulua, nabarmendu eta estali**: markatzeko, azpimarratzeko edo zuriz estaltzeko.",
              "**Marraztu, lerroa eta gezia**: zerbait seinalatzeko edo eskuz oharrak egiteko.",
              "**Irudia eta esteka**: zigilu edo logo bat itsasteko, edo webgune batera edo PDFko beste orri batera estekatzeko.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Editatu PDFa](/editar-pdf) eta aukeratu fitxategia. Aukeratu «Testua» barran eta ukitu orrian joan behar duen tokia: mugi dezakezun lauki bat agertzen da, eta beheko panelean idazten duzu. «Hautatu» aukerarekin edozein elementu ukitzen duzu mugitzeko, tamainaz aldatzeko edo kentzeko.",
            "Akats bat egiten baduzu, erabili «Desegin». Amaitzean, sakatu «Aplikatu aldaketak» eta deskargatu PDF editatua.",
            { tip: "Testuak edozein alfabeto onartzen du (latinoa, zirilikoa, grekoa, txinera, japoniera edo koreera). Emojiak ez dira PDFan gordetzen." },
          ],
        },
        {
          h2: "Sinatzeko edo inprimakiak betetzeko tresna propioak daude",
          body: [
            "Sinatu behar baduzu, [Sinatu PDFa](/firmar-pdf) tresnak zure sinadura marraztu, idatzi edo igotzen uzten dizu, eta dagokion tokian jartzen. Eta PDFak betetzeko eremuak baditu, [Bete PDF inprimakia](/llenar-formulario-pdf) tresnak banan-banan erakusten ditu, gainean idaztea baino erosoago.",
          ],
        },
        {
          h2: "Aldaketa nabari ez dadin aholkuak",
          body: [
            "Dokumentuan dagoeneko dagoen testu bat zuzentzeko, erabili **Ordeztu**: jatorrizkoa ezabatu eta berria jartzen du haren tokian. Lauki zuri batekin estaltzen baduzu bakarrik, testu zaharra fitxategian geratzen da.",
            "Aukeratu dokumentukoaren antzekoena den letra-tipoa (Sans, Serif edo Mono) eta doitu tamaina bat etorri arte. Mugikorrean, mugitu elementuak lasai: teklatuko geziekin ere alda dezakezu haien kokapena.",
          ],
        },
        {
          h2: "Zure fitxategia zurekin geratzen da",
          body: [
            "Editore osoa zure nabigatzailearen barruan dabil: PDFa ez da inongo zerbitzaritara igotzen, ez editatzen ari zaren bitartean ez gordetzean.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Editatu PDFa", text: "Ireki docusmart.online webguneko Editatu PDFa tresna eta aukeratu fitxategia." },
        { name: "Aukeratu zer gehitu", text: "Testua, ordeztu, formak, nabarmentzea, marrazkia, geziak, irudia edo esteka." },
        { name: "Jarri orrian", text: "Ukitu orria, idatzi edo marraztu, eta mugitu «Hautatu» aukerarekin." },
        { name: "Aplikatu eta deskargatu", text: "Sakatu «Aplikatu aldaketak» eta deskargatu PDF editatua." },
      ],
      faq: [
        ["PDFak dagoeneko duen testu bat alda dezaket?", "Bai, «Ordeztu» aukerarekin: testua ukitu, berria idatzi eta jatorrizkoa dokumentutik ezabatzen da."],
        ["Eskaneatutako PDFekin dabil?", "Gainean testua, formak eta marrazkiak gehi ditzakezu. Testua ordezteko, PDFak benetako testua izan behar du; argazki bat bada, pasa ezazu lehenik OCRtik."],
        ["Zerbait instalatu behar dut?", "Ez. Ordenagailuko edo mugikorreko nabigatzailean dabil."],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'pdf-baten-bi-bertsio-alderatu',
      title: "Nola alderatu PDF baten bi bertsio eta ikusi zer aldatu den | DocuSmart",
      description:
        "Alderatu bi PDF eta ikusi zein hitz gehitu edo kendu diren, edo alderatu orriz orri irudietako eta diseinuko aldaketak ikusteko. Doan eta fitxategiak igo gabe.",
      h1: "Nola alderatu PDF baten bi bertsio eta ikusi zer aldatu den",
      lead: "Kontratu bat itzultzen dizute «doikuntza batzuekin», baina ez dizute esaten zeintzuk. Bi aldiz irakurtzea desberdintasunen bila motela da, eta gauzak ihes egiten dute. Hona hemen nola alderatu bi bertsio segundo gutxitan.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Alderatu PDFak](/comparar-pdf). Aukeratu lehenik **jatorrizkoa** eta ondoren **bertsio berria**. Alderantziz jarri badituzu, «Trukatu» botoiak lekuz aldatzen ditu.",
            "Sakatu «Alderatu». Goian ikusiko duzu zenbat hitz gehitu eta zenbat kendu diren, eta azpian aldaketa bakoitza bere orriarekin: kendutakoa gorriz marratuta eta gehitutakoa berdez, testuinguruko lerro batzuekin kokatzeko.",
          ],
        },
        {
          h2: "Testua edo bisuala",
          body: [
            { ul: [
              "**Testua**: hitzak alderatzen ditu. Onena da kontratu, gutun eta txostenetarako. Maiuskulak eta puntuazioa ez kontuan hartzea aukera dezakezu, aldaketa gisa zenba ez daitezen.",
              "**Bisuala (orriz orri)**: orri bakoitzaren itxura alderatzen du. Planoetarako, diseinuetarako edo eskaneatutako dokumentuetarako balio du, aldaketak irudiak edo taulak izan baitaitezke, eta ez testua bakarrik.",
            ] },
            { tip: "Kontratu batean, berrikusi batez ere zenbatekoetako, datetako eta izenetako aldaketak: alderaketak erakutsi egiten ditu, zenbaki bakar batekoak izan arren." },
          ],
        },
        {
          h2: "Alderatu ondoren",
          body: [
            "Zuzentzeko zerbait aurkitu baduzu, [Editatu PDFa](/editar-pdf) tresnarekin egin dezakezu. Eta bi aldeak ados daudenean, sinatu azken bertsioa [Sinatu PDFa](/firmar-pdf) tresnarekin.",
          ],
        },
        {
          h2: "Zer erakusten duen eta zer ez",
          body: [
            "Aldaketa bakoitza bere orri-zenbakiarekin eta inguruko lerroekin agertzen da, dokumentuan azkar kokatzeko. Paragrafo oso bat aldatu gabe lekuz mugitu bada, mugitutzat markatzen da, kendutzat eta gehitutzat zenbatu beharrean.",
            "Bi fitxategiek ia ezer komunean ez badute (adibidez, okerreko dokumentu bat aukeratu duzu), tresnak abisatu egiten du ehunka aldaketa erakutsi beharrean. Eta berdinak badira, hori ere esaten dizu, orri kopuru desberdina izan arren.",
            "Kontratuetarako, aurrekontuetarako, araudietarako, esku askotatik pasatzen diren proposamenetarako edo tutorearen zuzenketekin itzultzen den tesirako balio du: kasu horietan guztietan, zehazki zer aldatu den jakiteak berrirakurketa osoa aurrezten du.",
          ],
        },
        {
          h2: "Zure dokumentuak ez dira igotzen",
          body: [
            "Bi PDFak zure nabigatzailean alderatzen dira: bat ere ez da zerbitzari batera igotzen. Lasai erabil dezakezu kontratu eta dokumentu konfidentzialekin, bi bertsioetako bat ere ez baita beste inon gordetzen.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Alderatu PDFak", text: "Ireki docusmart.online webguneko Alderatu PDFak tresna." },
        { name: "Aukeratu bi fitxategiak", text: "Lehenik jatorrizkoa eta ondoren bertsio berria." },
        { name: "Aukeratu nola alderatu", text: "Testua (hitzak) edo Bisuala (orriz orri)." },
        { name: "Berrikusi aldaketak", text: "Kendutakoa gorriz marratuta eta gehitutakoa berdez ateratzen da, bere orriarekin." },
      ],
      faq: [
        ["Eskaneatutako PDFak alderatzen ditu?", "Bisuala moduan bai, orri bakoitzaren itxura alderatzen baitu. Testua moduak PDFak benetako testua izatea behar du."],
        ["Fitxategien ordenak garrantzia du?", "Bai: bertsio berrian dagoena eta jatorrizkoan ez dagoena gehitu gisa ateratzen da. Oker ibili bazara, erabili «Trukatu»."],
        ["Maiuskula edo koma bat aldatu den ez ikustea egin daiteke?", "Bai. Markatu «Ez ikusi maiuskulak» edo «Ez ikusi puntuazioa»."],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'pdfko-datu-pertsonalak-estali',
      title: "Nola estali datu pertsonalak PDF batean (benetan) | DocuSmart",
      description:
        "Ezabatu agiri-zenbakiak, kontuak, helbide elektronikoak edo izenak PDF batean: bilatu eta markatu orri guztietan, eta fitxategitik ezabatzen dira, ez dira estaltzen bakarrik.",
      h1: "Nola estali datu pertsonalak PDF batean (benetan)",
      lead: "Banku-laburpen bat, kontratu bat edo historia kliniko bat partekatu aurretik, askotan kontu- edo agiri-zenbakiak ezkutatu behar dira. Gainean lauki beltz bat jartzea ez da nahikoa: hona hemen nola egin ondo.",
      sections: [
        {
          h2: "Zergatik ez den nahikoa lauki beltz bat",
          body: [
            "Editore arrunt batean zenbaki baten gainean laukizuzen beltz bat jartzen baduzu, zenbakia fitxategian geratzen da: nahikoa da hautatu eta kopiatzea, edo PDFa beste programa batekin irekitzea, irakurtzeko. Benetan estaltzea azpian dagoena **ezabatzea** da, eta hori da [Ezabatu PDFko datuak](/censurar-pdf) tresnak egiten duena.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Ezabatu PDFko datuak](/censurar-pdf) eta aukeratu fitxategia. Izen bat, zenbaki bat edo hitz bat bila dezakezu, eta orri guztietan markatzen da aldi berean. Era berean, behin batean markatu ditzakezu **posta elektroniko** guztiak edo **zenbaki** guztiak (agiriak, telefonoak, kontuak), edo orrian arrastatu eremu bat eskuz estaltzeko.",
            "Berrikusi orri bakoitza: eremu bat ukituta mugitu edo kendu egiten duzu. Dena prest dagoenean, sakatu «Ezabatu PDFko datuak» eta deskargatu emaitza.",
            { tip: "Eremu markatuak dituzten orriak irudi bihurtzen dira, estalitakoa fitxategitik desager dadin. Orri horietako gainerako testua bilatu eta kopiatu daiteke oraindik." },
          ],
        },
        {
          h2: "Berrikusi bidali aurretik",
          body: [
            "Bilaketak testu gisa idatzita dagoena aurkitzen du. Dokumentuaren zati bat argazki edo eskaneatu bat bada, han agertzen diren datuak ez dira bilaketan ateratzen: markatu eskuz orrian arrastatuta. Eta gorde jatorrizkoa aparte, estalitakoa ezin baita berreskuratu.",
            "Dokumentua beste batzuen esku geratuko bada, pasahitz bat ere jar diezaiokezu [Babestu PDFa pasahitzarekin](/proteger-pdf) tresnarekin, edo zertarako eman zenuen dioen [ur-marka](/marca-de-agua-pdf) bat.",
          ],
        },
        {
          h2: "Zer estali behar izaten den",
          body: [
            { ul: [
              "Nortasun-agirien eta banku-kontuen zenbakiak.",
              "Helbideak, telefonoak eta helbide elektronikoak.",
              "Sinadurak eta agirietako argazkiak.",
              "Osasun-datuak, soldatak edo hirugarrenen informazioa.",
            ] },
          ],
        },
        {
          h2: "Dokumentua igo gabe",
          body: [
            "Prozesu osoa zure nabigatzailean gertatzen da: datuak estali gabe dituen dokumentua ez da inoiz zure gailutik ateratzen. Hori da hain zuzen datuak ezabatzean komeni dena: jatorrizkoa lineako zerbitzu batera igoko bazenu estaltzeko, datuak zure eskuetatik aterata egongo lirateke dagoeneko.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Ezabatu PDFko datuak", text: "Ireki docusmart.online webguneko Ezabatu PDFko datuak tresna eta aukeratu fitxategia." },
        { name: "Markatu ezkutatu beharrekoa", text: "Bilatu testu bat, markatu posta elektroniko edo zenbaki guztiak, edo arrastatu orrian." },
        { name: "Berrikusi orri bakoitza", text: "Ukitu eremu bat mugitzeko edo kentzeko." },
        { name: "Ezabatu eta deskargatu", text: "Sakatu «Ezabatu PDFko datuak»: estalitakoa fitxategitik ezabatzen da." },
      ],
      faq: [
        ["Estalitakoa berreskura daiteke?", "Ez. Estaltzen duzuna fitxategitik ezabatzen da; horregatik komeni da jatorrizkoa aparte gordetzea."],
        ["Eskaneatutako PDFekin balio du?", "Bai, eremuak eskuz markatuta. Bilaketa automatikoak testu gisa idatzita dagoena bakarrik aurkitzen du."],
        ["Dokumentuaren gainerakoa bilatu daiteke oraindik?", "Bai. Eremu markatuak dituzten orriak bakarrik bihurtzen dira irudi, eta haien gainerako testua gordetzen da bilatzeko eta kopiatzeko."],
      ],
    },
  },
}
