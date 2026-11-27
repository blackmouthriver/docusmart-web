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
    'pasar-un-pdf-escaneado-a-texto': {
      slug: 'pdf-eskaneatua-testu-bihurtu',
      title: "Nola pasa PDF eskaneatu bat testu kopiagarri eta bilagarrira | DocuSmart",
      description:
        "Ezagutu PDF eskaneatu baten testua OCRrekin: kopiatu, deskargatu .txt edo Word formatuan, edo sortu PDF bilagarri bat. 12 hizkuntzatan, doan eta fitxategia igo gabe.",
      h1: "Nola pasa PDF eskaneatu bat testu kopiagarri eta bilagarrira",
      lead: "Eskaneatu bat orri bakoitzaren argazki bat da: irakur daiteke, baina ezin da kopiatu, ezta hitz bat bilatu ere. OCRrekin testua testu bihurtzen da berriro, berriz idatzi beharrik gabe.",
      sections: [
        {
          h2: "Zer egiten duen OCRk",
          body: [
            "OCR karaktere-ezagutze optikoa da: programak orri bakoitzaren irudia aztertzen du eta letrak ezagutzen ditu. [OCR: ezagutu testua](/ocr-pdf) tresnak bi gauza ematen dizkizu aldi berean:",
            { ul: [
              "**Ezagututako testua**, kopiatzeko edo .txt edo Word formatuan deskargatzeko, zati bakoitza zein orritatik datorren adierazita.",
              "**PDF bilagarri bat**: eskaneatu bera, itxuraz berdin-berdina, gainean testu-geruza ikusezin batekin. Testua hautatu eta kopiatu dezakezu, eta hitzak bilatu Ctrl+F sakatuta.",
            ] },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [OCR: ezagutu testua](/ocr-pdf) eta aukeratu PDF eskaneatua (JPG, PNG edo WebP argazki batek ere balio du). Aukeratu **Dokumentuaren hizkuntza**: ezagutzeak askoz hobeto asmatzen du zer hizkuntza espero duen badaki. Dokumentuak bere hizkuntza ingelesarekin nahasten badu, markatu lauki hori ere.",
            "Utzi markatuta **Sortu PDF bilagarri bat ere** PDFa nahi baduzu, eta sakatu **Ezagutu testua**. Aurrerapena orriz orri ikusiko duzu. Amaitzean, PDFa deskargatzeko prest izango duzu eta, azpian, testua, kopiatu edo .txt edo Word formatuan jaitsi dezakezuna.",
            { tip: "Lehen aldian hizkuntzaren eredua deskargatzen da (segundo batzuk) eta zure nabigatzailean gordeta geratzen da: hurrengoetan berehala hasten da." },
          ],
        },
        {
          h2: "Nola lortu emaitza hobea",
          body: [
            "OCRk ikusten duena irakurtzen du. Eskaneatu garbi, zuzen eta argi onarekin egindako bat ia akatsik gabe ezagutzen da; argazki lauso bat, itzalekin edo oso txikia, ez. Ezagutzea zalantzazkoa bada, DocuSmart-ek konfiantza-ehunekoarekin abisatzen dizu, testua berrikus dezazun.",
            { ul: [
              "Biratuta datozen orriak berez detektatzen dira eta zuzen irakurtzen dira.",
              "Dagoeneko testua duten orriak (PDF misto bat) dauden bezala uzten dira, **Testua duten orriak ere ezagutu** markatzen ez baduzu.",
              "Letra inprimatuarekin dabil. Eskuz idatzitako letra ia inoiz ez da ondo ezagutzen.",
            ] },
          ],
        },
        {
          h2: "Word-en editatu nahi baduzu",
          body: [
            "Zure helburua dokumentua zuzentzea bada, eta ez testua kopiatzea bakarrik, erabili zuzenean [PDFtik Wordera](/pdf-a-word) OCR laukiarekin: orri eskaneatuak urrats berean ezagutzen ditu eta .docx editagarri bat osatzen du. Eta PDF bilagarria astunegia geratu bada bidaltzeko, pasa ezazu [Konprimitu PDFa](/comprimir-pdf) tresnatik.",
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik irteten",
          body: [
            "Ezagutzea zure nabigatzailean egiten da Tesseract-ekin, kode irekiko OCR motor batekin. PDFa ez da inongo zerbitzaritara igotzen; beraz, NANekin, historia klinikoekin edo banku-laburpenekin erabil dezakezu, beste inon kopiarik utzi gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki OCR", text: "Ireki docusmart.online webguneko OCR: ezagutu testua tresna eta aukeratu PDF eskaneatua edo argazki bat." },
        { name: "Aukeratu hizkuntza", text: "Aukeratu dokumentuaren hizkuntza eta markatu ingelesezko testua ere baduen." },
        { name: "Ezagutu testua", text: "Sakatu «Ezagutu testua» eta itxaron orri bakoitza amaitu arte." },
        { name: "Deskargatu", text: "Deskargatu PDF bilagarria edo kopiatu testua, edo jaitsi .txt edo Word formatuan." },
      ],
      faq: [
        ["Zer da PDF bilagarri bat?", "Zure eskaneatu bera da, gainean testu-geruza ikusezin batekin: berdin ikusten da, baina testua hautatu eta kopiatu dezakezu, eta hitzak bilatu."],
        ["Zenbat orri ezagut ditzaket?", "Behar dituzunak: banan-banan ezagutzen dira zure nabigatzailean. Dokumentu luze batek denbora gehiago behar du, baina ez dago orri-mugarik."],
        ["Hainbat hizkuntza ezagutzen ditu?", "Hamabi: gaztelania, ingelesa, portugesa, frantsesa, italiera, alemana, katalana, euskara, errusiera, japoniera, koreera eta txinera. Dokumentuak bere hizkuntza ingelesarekin nahasten badu, markatu lauki hori."],
      ],
    },
    'copiar-el-texto-de-una-foto': {
      slug: 'argazki-bateko-testua-kopiatu',
      title: "Nola kopiatu argazki edo pantaila-argazki bateko testua | DocuSmart",
      description:
        "Atera argazki, pantaila-argazki edo argazkian ateratako dokumentu bateko testua, eta kopiatu, zuzendu edo pasa Wordera. Doan, 12 hizkuntzatan eta irudia igo gabe.",
      h1: "Nola kopiatu argazki edo pantaila-argazki bateko testua",
      lead: "Ordainagiri baten argazkia, txat baten pantaila-argazkia edo kartel bat: testua aurrean duzu, baina ezin duzu kopiatu. Hona hemen nola atera segundo gutxitan, eskuz idatzi gabe.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Iruditik testura (OCR)](/imagen-a-texto) eta aukeratu argazkia. JPG, PNG eta WebP balio dute, baita iPhoneko HEIC argazkiek ere. Pantaila-argazki bat bada, ez duzu gorde beharrik ere: kopiatu eta itsatsi orrian **Ctrl+V** sakatuta.",
            "Aukeratu **Dokumentuaren hizkuntza** eta sakatu **Testua ezagutu**. Segundo gutxitan, testua zuzen dezakezun lauki batean agertzen da. Handik ukitu bakarrarekin kopiatzen duzu, edo .txt edo Word (.docx) formatuan deskargatzen duzu.",
            { tip: "Testuak zure hizkuntza ingelesezko hitzekin nahasten badu (produktu-izenak, termino teknikoak), markatu «Dokumentuak ingelesezko testua ere badu»: hitz horiekin hobeto asmatzen du." },
          ],
        },
        {
          h2: "Hainbat argazki dokumentu bakar batera",
          body: [
            "Hainbat orriko dokumentu bati argazkiak atera badizkiozu, aukeratu argazki guztiak batera. Guztien testua batera ateratzen da, ordenan, eta Word bakar batean jaisten duzu. Utzi dizkizuten orri inprimatu batzuk digitalera pasatzeko modurik azkarrena da.",
          ],
        },
        {
          h2: "Nola atera argazkia ondo irakur dadin",
          body: [
            "Ezagutzea argazkiaren araberakoa da. Xehetasun batzuek alde handia egiten dute:",
            { ul: [
              "**Argi ona eta itzalik gabe**: mugikorraren itzala paperaren gainean da akatsen kausarik ohikoena.",
              "**Aurrez aurre eta zuzen**: zenbat eta gutxiago okertuta, hobe.",
              "**Testua handi ikus dadila**: hurbildu orriak argazki osoa bete arte.",
              "**Garbia**: argazkia mugituta atera bada, atera berriro.",
            ] },
            "Emaitza zalantzazkoa bada, DocuSmart-ek konfiantza-ehunekoarekin abisatzen dizu, testua erabili aurretik berrikus dezazun. Eskuz idatzitako letra ia inoiz ez da ondo ezagutzen: tresna testu inprimaturako edo pantailako testurako pentsatuta dago.",
          ],
        },
        {
          h2: "Argazkia ala PDF eskaneatua?",
          body: [
            "Hainbat orriko PDF eskaneatu bat baduzu, edo dokumentua bere itxurarekin gorde eta, gainera, hitzak bilatu nahi badituzu, erabili [OCR: ezagutu testua](/ocr-pdf), PDF bilagarri bat sortzen baitu. Eta argazkiak dokumentu gisa entregatu behar badituzu, bildu lehenago [Iruditik PDFra](/imagen-a-pdf) tresnarekin.",
          ],
        },
        {
          h2: "Zure argazkiak ez dira gailutik irteten",
          body: [
            "Testua zure nabigatzailean ezagutzen da: irudiak ez dira inongo zerbitzaritara igotzen. Dokumentuen, ordainagirien edo elkarrizketen argazkiekin erabil dezakezu, beste inon kopiarik utzi gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Iruditik testura", text: "Ireki docusmart.online webguneko Iruditik testura (OCR) tresna eta aukeratu argazkia, edo itsatsi pantaila-argazki bat Ctrl+V sakatuta." },
        { name: "Aukeratu hizkuntza", text: "Aukeratu irudiko testuaren hizkuntza." },
        { name: "Ezagutu testua", text: "Sakatu «Testua ezagutu» eta berrikusi emaitza laukian." },
        { name: "Kopiatu edo deskargatu", text: "Kopiatu ukitu batekin edo deskargatu .txt edo Word formatuan." },
      ],
      faq: [
        ["iPhoneko argazkiekin dabil?", "Bai. HEIC argazkiak zuzenean irekitzen dira, aurretik bihurtu gabe."],
        ["Eskuz idatzitako letra ezagutzen du?", "Ia inoiz ez ondo. Testu inprimatuarekin edo pantailako testuarekin dabil."],
        ["Testua zuzen dezaket kopiatu aurretik?", "Bai. Testua lauki editagarri batean agertzen da: zuzendu behar dena eta gero kopiatu edo deskargatu."],
      ],
    },
    'convertir-un-pdf-a-word-para-editarlo': {
      slug: 'pdf-bat-wordera-bihurtu-editatzeko',
      title: "Nola bihurtu PDF bat Wordera editatzeko, baita eskaneatua ere | DocuSmart",
      description:
        "Pasa PDF bat Word (.docx) editagarri batera izenburu, letra lodi, taula, irudi eta bi zutaberekin. Eskaneatuentzat OCRrekin, doan eta fitxategia igo gabe.",
      h1: "Nola bihurtu PDF bat Wordera editatzeko, baita eskaneatuta badago ere",
      lead: "PDF bat bidali dizute eta data bat, izen bat edo paragrafo bat aldatu behar diozu, baina ez duzu jatorrizko Worda. Hona hemen nola berreskuratu dokumentu editagarri gisa.",
      sections: [
        {
          h2: "Bihurtu aurretik: zer espero",
          body: [
            "PDF batek ez ditu paragrafoak ezta taulak gordetzen: letrak eta orrian duten kokapena bakarrik. Horregatik, Wordera egiten den edozein bihurketak dokumentua **berreraikitzen** du, eta emaitza jatorrizkoaren oso antzekoa da, baina ez berdin-berdina. [PDFtik Wordera](/pdf-a-word) tresnak hau gordetzen du:",
            { ul: [
              "Izenburuak, letra lodia, letra etzana, letren tamainak eta koloreak.",
              "Zerrendak, taula sinpleak eta irudiak.",
              "Bi zutabeko diseinuak, curriculumetakoak bezala, zutabe bakoitzaren atzeko planoarekin.",
            ] },
            "Testu-koadroak eta forma apaingarri konplexuak desberdin gera daitezke. Hobeto dabil Word-etik edo antzeko programa batetik sortutako PDFekin.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [PDFtik Wordera](/pdf-a-word) eta aukeratu fitxategia. PDFa eskaneatua bada, edo orri eskaneatu batzuk baditu, utzi markatuta **Ezagutu orri eskaneatuen testua** laukia eta aukeratu dokumentuaren hizkuntza: orri horiek OCRrekin irakurtzen dira urrats berean, eta haien testua editagarri geratzen da.",
            "Sakatu **Bihurtu**. Emaitzaren gutxi gorabeherako aurrebista ikusiko duzu jatorrizkoaren ondoan, zenbat paragrafo eta irudi atera diren adierazita. Deskargatu .docx fitxategia eta ireki Word, Google Docs, LibreOffice, Pages edo WPS-en.",
            { tip: "Berrikusi dokumentua irekitzean, batez ere taulak eta orri-jauziak: hor aldatzen da gehien diseinua." },
          ],
        },
        {
          h2: "Word behar duzu ala nahikoa da PDFa editatzea?",
          body: [
            "Hitz bat aldatu, data bat jarri edo datu bat estali besterik ez baduzu egin behar, ez duzu Word-etik pasatu beharrik: [Editatu PDFa](/editar-pdf) tresnarekin PDFaren gainean idazten duzu eta lehen bezala geratzen da, bere diseinu zehatzarekin. Wordera bihurtzea komeni da paragrafo osoak berridatziko dituzunean edo edukia beste dokumentu batean berrerabiliko duzunean.",
          ],
        },
        {
          h2: "Berriro PDFra",
          body: [
            "Editatzen amaitzean, gorde dokumentua eta bihurtu berriro [Wordetik PDFra](/word-a-pdf) tresnarekin bidaltzeko. Horrela, jasotzen duenak berdin ikusiko du edozein gailutan, instalatuta dituen letra-tipoen menpe egon gabe.",
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik irteten",
          body: [
            "Bihurketa, eta orri eskaneatuen OCRa, zure nabigatzailean egiten dira: PDFa ez da inongo zerbitzaritara igotzen. Berdin balio du kontratuetarako, curriculumetarako edo zabaldu behar ez diren lan-dokumentuetarako.",
          ],
        },
      ],
      steps: [
        { name: "Ireki PDFtik Wordera", text: "Ireki docusmart.online webguneko PDFtik Wordera tresna eta aukeratu PDFa." },
        { name: "Aktibatu OCRa behar bada", text: "Orri eskaneatuak baditu, utzi markatuta OCR laukia eta aukeratu hizkuntza." },
        { name: "Bihurtu", text: "Sakatu «Bihurtu» eta berrikusi gutxi gorabeherako aurrebista." },
        { name: "Deskargatu eta editatu", text: "Deskargatu .docx fitxategia eta ireki Word, Google Docs edo LibreOffice-n." },
      ],
      faq: [
        ["PDFaren berdin-berdina geratzen da?", "Oso antzekoa, baina ez berdina: dokumentua letren kokapenetik abiatuta berreraikitzen da. Izenburuak, formatua, zerrendak, taula sinpleak, irudiak eta bi zutabeak gordetzen dira."],
        ["PDF eskaneatuekin dabil?", "Bai. OCR laukia markatuta, orri eskaneatuak zure nabigatzailean ezagutzen dira eta haien testua editagarri geratzen da."],
        ["Pasahitza duen PDF bat bihur daiteke?", "Murrizketak bakarrik baditu (pasahitzik gabe irekitzen da), bai. Irekitzeko pasahitza eskatzen badu, kendu lehenik Desblokeatu PDFa tresnarekin."],
      ],
    },
    'pasar-un-extracto-bancario-pdf-a-excel': {
      slug: 'banku-laburpena-pdftik-excelera-pasa',
      title: "Nola pasa PDF formatuko banku-laburpen edo faktura bat Excelera | DocuSmart",
      description:
        "Bihurtu banku-laburpen, faktura edo txosten baten PDF taulak Excel kalkulu-orri batera, zenbakiak batzeko prest dituela. Doan eta fitxategia igo gabe.",
      h1: "Nola pasa PDF formatuko banku-laburpen edo faktura bat Excelera",
      lead: "Hilabeteko gastuak batu, kontu bat bateratu edo txosten bat iragazi behar duzu, eta datuak PDF batean daude. Hona hemen nola pasa kalkulu-orri batera, gelaxkaz gelaxka kopiatu gabe.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [PDFtik Excelera](/pdf-a-excel) eta aukeratu PDFa. Aukeratu nola nahi dituzun **Orriak**:",
            { ul: [
              "**Bat orriko**: PDFko orri bakoitza bere kalkulu-orrian. Erabilgarria orri bakoitza taula desberdin bat den txostenetarako.",
              "**Dena orri batean**: errenkada guztiak jarraian, kalkulu-orri bakar batean. Onena hainbat orriko banku-laburpen baterako, horrela behin batean iragazi eta batzen baituzu.",
            ] },
            "Sakatu **Bihurtu**. Gutxi gorabeherako aurrebista ikusiko duzu, zenbat errenkada eta zenbaki atera diren adierazita. Deskargatu .xlsx fitxategia eta ireki Excel, Google Sheets edo LibreOffice-n.",
          ],
        },
        {
          h2: "Zenbakiak zenbaki gisa geratzen dira",
          body: [
            "Hau da denbora gehien aurrezten duen xehetasuna: 1.500.000, $ 2.000, 3,5 edo 45 % bezalako balioak Excel zenbaki gisa gordetzen dira, beren formatuarekin, eta ez testu gisa. Fitxategia ireki bezain laster batu, batez bestekoak atera edo formuletan erabil ditzakezu, puntuak edo txanpon-ikurrak garbitu gabe.",
            { tip: "Balio-zutabe batek ez badu batzen, egiaztatu zutabe horretan ez dagoela «N/A» bezalako testurik edo marratxorik nahastuta: Excelek gelaxka horiek ez ditu kontuan hartzen batuketan." },
          ],
        },
        {
          h2: "Zer PDFekin dabilen hobeto",
          body: [
            "Zutabeak orriko testuaren kokapenaren arabera osatzen dira. Horregatik oso ondo dabil sistema batek esportatzen dituen PDFekin: banku-laburpenak, faktura elektronikoak, kontabilitate-txostenak edo zerrendak. Diseinu libreko PDFekin, testuak zutaberik jarraitzen ez duenean, emaitzak berrikuspen gehiago behar du.",
            "Laburpena eskaneatua bada, edo norbaitek PDFra pasatutako argazki bat, utzi markatuta **Ezagutu orri eskaneatuen testua** laukia eta aukeratu hizkuntza: orri horiek OCRrekin irakurtzen dira urrats berean, eta zutabe bakoitza bere gelaxkan geratzen da. Zenbat eta garbiagoa izan eskaneatua, orduan eta emaitza hobea.",
          ],
        },
        {
          h2: "Berriro entregatzeko",
          body: [
            "Kalkulu-orria landu ondoren dokumentu gisa bidali behar baduzu, bihurtu [Exceletik PDFra](/excel-a-pdf) tresnarekin. Eta eskaneatuaren testua bakarrik behar baduzu, taularik gabe, erabili [OCR: ezagutu testua](/ocr-pdf).",
          ],
        },
        {
          h2: "Zure datuak ez dira gailutik irteten",
          body: [
            "Banku-laburpen batek zure kontu-zenbakia, saldoa eta mugimenduak ditu. Hemen bihurketa zure nabigatzailean egiten da: PDFa ez da inongo zerbitzaritara igotzen, ezta beste inon gordetzen ere.",
          ],
        },
      ],
      steps: [
        { name: "Ireki PDFtik Excelera", text: "Ireki docusmart.online webguneko PDFtik Excelera tresna eta aukeratu PDFa." },
        { name: "Aukeratu orriak", text: "Kalkulu-orri bat PDFko orri bakoitzeko, edo dena orri bakar batean, behin batean batzeko." },
        { name: "Bihurtu", text: "Sakatu «Bihurtu» eta berrikusi gutxi gorabeherako aurrebista." },
        { name: "Deskargatu", text: "Deskargatu .xlsx fitxategia eta ireki Excel, Google Sheets edo LibreOffice-n." },
      ],
      faq: [
        ["Zenbakiak batu daitezke?", "Bai. Milakoen puntuak, txanpon-ikurra, koma hamartarrak edo ehunekoak dituzten balioak Excel zenbaki gisa gordetzen dira."],
        ["Banku-laburpen eskaneatu batekin dabil?", "Bai. OCR laukia markatuta, orri eskaneatuak zure nabigatzailean ezagutzen dira eta zutabe bakoitza bere gelaxkan geratzen da."],
        ["Nire laburpena Internetera igotzen da?", "Ez. Bihurketa zure nabigatzailearen barruan gertatzen da; fitxategia ez da zure gailutik irteten."],
      ],
    },
    'sacar-el-texto-de-un-pdf': {
      slug: 'pdf-bateko-testua-atera',
      title: "Nola atera PDF bateko testu guztia kopiatzeko edo bilatzeko | DocuSmart",
      description:
        "Atera PDF bateko testua .txt fitxategi batera edo kopiatu pantailatik klik batekin, orriaren diseinurik gabe. Doan, berehala eta fitxategia igo gabe.",
      h1: "Nola atera PDF bateko testu guztia kopiatzeko edo bilatzeko",
      lead: "PDF baten edukia mezu elektroniko batean, txat batean edo beste dokumentu batean itsatsi nahi duzu, eta kopiatzean lerroak hautsi egiten dira. Hona hemen nola atera testu garbia, orri guztietakoa aldi berean.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [PDFtik testura](/pdf-a-texto), aukeratu PDFa eta sakatu **Bihurtu**. Une batean orri guztietako testua ikusiko duzu pantailan, zenbat lerro dituen adierazita. Handik klik batekin kopiatzen duzu edo .txt fitxategia deskargatzen duzu.",
            ".txt fitxategia edozein gailutan irekitzen da, baita Oharren blokean edo mugikorrean ere, eta ia ezer ez du pisatzen: ehun orriko dokumentu bat ehunka KB gutxitan geratu ohi da.",
          ],
        },
        {
          h2: "Zertarako balio du",
          body: [
            { ul: [
              "**Bilatu**: testua ireki eta hitz edo zenbaki bat bilatu dokumentu luze batean.",
              "**Berrerabili**: paragrafoak mezu elektroniko batean edo txat batean itsatsi, PDFaren lerro-jauzirik gabe.",
              "**Zenbatu edo aztertu**: testua beste tresna batera pasatu, adibidez [Hitz eta karaktere kontagailua](/contador-de-palabras) tresnara.",
              "**Funtsezkoa gorde**: dokumentu baten edukia gorde, bere diseinurik gabe.",
              "**Itzuli edo entzun**: testua itzultzaile batean itsatsi, edo mugikorraren ozen irakurtzeko funtzioan, PDFtik zuzenean kopiatzean geratzen diren jauzirik gabe.",
            ] },
          ],
        },
        {
          h2: "Zer gordetzen den eta zer ez",
          body: [
            "Testua eta lerro-jauziak gordetzen dira, orri bakoitzaren irakurketa-ordenan. Diseinu bisuala (zutabeak, taulak, koloreak, irudiak) testu arrunt bihurtzen da. Edukia **bere formatuarekin** behar baduzu editatzen jarraitzeko, erabili [PDFtik Wordera](/pdf-a-word).",
            { tip: "Taula bat garrantzitsua bada zuretzat, kontuan izan .txt fitxategian bere zutabeak galtzen dituela. Gelaxketan lantzeko, hobe da [PDFtik Excelera](/pdf-a-excel)." },
          ],
        },
        {
          h2: "Hutsik ateratzen bada: eskaneatu bat da",
          body: [
            "DocuSmart-ek testurik aurkitu ez duela esaten badizu, PDFa eskaneatua da: orri bakoitza argazki bat da, eta ez dago ateratzeko letrarik. Kasu horretan, erabili [OCR: ezagutu testua](/ocr-pdf); irudiko testua zure nabigatzailean ezagutzen du eta kopiatzeko edo deskargatzeko ematen dizu.",
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik irteten",
          body: [
            "Testua zure nabigatzailean irakurtzen da: PDFa ez da inongo zerbitzaritara bidaltzen. Horregatik lan-dokumentuekin edo dokumentu pertsonalekin erabil dezakezu, beste inon kopiarik utzi gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki PDFtik testura", text: "Ireki docusmart.online webguneko PDFtik testura tresna eta aukeratu PDFa." },
        { name: "Bihurtu", text: "Sakatu «Bihurtu»: orri guztietako testua ikusiko duzu." },
        { name: "Kopiatu edo deskargatu", text: "Kopiatu klik batekin edo deskargatu .txt fitxategia." },
      ],
      faq: [
        ["Zergatik ateratzen da hutsik?", "PDFa eskaneatua delako: orriak irudiak dira. Erabili OCR: ezagutu testua haien testua ateratzeko."],
        ["Taulak mantentzen dira?", "Ez taula gisa: testu-lerro bihurtzen dira. Zutabeak gordetzeko, erabili PDFtik Excelera."],
        ["Orri-mugarik ba al dago?", "Ez. Orri guztietako testua ateratzen da, dokumentua luzea izan arren."],
      ],
    },
    'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes': {
      slug: 'pdf-bat-jpg-bihurtu-edo-irudiak-atera',
      title: "Nola bihurtu PDF bat JPGra edo atera barruan dituen argazkiak | DocuSmart",
      description:
        "Pasa PDF bateko orri bakoitza JPG edo PNG formatura nahi duzun bereizmenarekin, edo atera barruko argazkiak jatorrizko kalitatean. Doan eta fitxategia igo gabe.",
      h1: "Nola bihurtu PDF bat JPGra edo atera barruan dituen argazkiak",
      lead: "Orri bat sare sozialetan argitaratzeko, WhatsAppez irudi gisa bidaltzeko edo PDF baten barruan bakarrik duzun argazki bat berreskuratzeko. Bi tresna desberdin dira, eta komeni da jakitea zein erabili.",
      sections: [
        {
          h2: "Orri osoa ala argazkiak bakarrik?",
          body: [
            { ul: [
              "**[PDFtik JPGra](/pdf-a-jpg)** tresnak **orri oso** bakoitza irudi bihurtzen du, bere testu, argazki eta diseinuarekin, pantaila-argazki bat bezala baina kalitate onean.",
              "**[Atera PDF bateko irudiak](/extraer-imagenes-pdf)** tresnak barruan dauden **argazkiak eta grafikoak bakarrik** ateratzen ditu, bakoitza bere aldetik eta jatorrizko tamainarekin, inguruko testurik gabe.",
            ] },
            "Orri bat ikusten den bezala erakutsi nahi baduzu, erabili PDFtik JPGra. Dokumentuaren barruan datorren logoa, produktuaren argazkia edo planoa nahi baduzu, erabili Atera irudiak.",
          ],
        },
        {
          h2: "PDFtik JPGra, urratsez urrats",
          body: [
            "Ireki [PDFtik JPGra](/pdf-a-jpg) eta aukeratu PDFa. Aukeratu **Irudi-formatua** eta **Bereizmena**:",
            { ul: [
              "**PNG** formatuak kalitate zehatza gordetzen du eta hobea da testua duten orrietarako; **JPG** arinagoa da eta partekatzeko aproposa. JPG formatuan kalitatea ere aukeratzen duzu.",
              "**72 ppp** pantailan ikusteko, **150 ppp** ia guztirako eta **300 ppp** inprimatzeko.",
            ] },
            "Orri batzuk bakarrik nahi badituzu, idatzi **Orriak** eremuan (adibidez, 1-3, 5); hutsik utzita, guztiak bihurtzen dira. Sakatu **Bihurtu**: irudi bakoitza bere orri-zenbakiarekin ikusiko duzu, eta hainbat badira, ZIP batean deskargatzen dira batera.",
          ],
        },
        {
          h2: "Atera irudiak, urratsez urrats",
          body: [
            "Ireki [Atera PDF bateko irudiak](/extraer-imagenes-pdf), aukeratu PDFa eta sakatu **Bilatu irudiak**. Argazki eta grafiko guztiak agertzen dira, bakoitza bere orri, tamaina eta formatuarekin. Aukeratu nahi dituzunak eta deskargatu banan-banan edo guztiak ZIP batean.",
            "JPEG argazkiak jatorrizkoen **berdin-berdinak** ateratzen dira, bytez byte; gainerakoak PNG gisa gordetzen dira, galerarik gabe. Utzi markatuta **Saltatu irudi txikiak**, ikonoz eta buletez ez betetzeko.",
            { tip: "PDF eskaneatu batean orri bakoitza irudi handi bakar bat da; beraz, Atera irudiak tresnak orriak itzultzen dizkizu. Kasu horretan berdin dio bi tresnetako zein erabili." },
          ],
        },
        {
          h2: "Irudiak gehiegi pisatzen badu",
          body: [
            "300 ppp-tan, A4 orri batek 2.400 pixel baino gehiago ditu zabaleran. Webgunerako edo inprimaki baterako arinagoa behar baduzu, pasa ezazu [Konprimitu irudia](/comprimir-imagen) tresnatik. Eta dena zure nabigatzailean egiten da: PDFa ez da inongo zerbitzaritara igotzen.",
          ],
        },
      ],
      steps: [
        { name: "Aukeratu tresna", text: "PDFtik JPGra orri osoetarako; Atera irudiak barruan dituen argazkietarako." },
        { name: "Aukeratu PDFa", text: "Ireki tresna docusmart.online webgunean eta aukeratu fitxategia." },
        { name: "Doitu eta bihurtu", text: "PDFtik JPGra tresnan, aukeratu formatua, bereizmena eta orriak; Atera irudiak tresnan, sakatu «Bilatu irudiak» eta aukeratu nahi dituzunak." },
        { name: "Deskargatu", text: "Deskargatu irudi bakoitza, edo guztiak batera ZIP batean." },
      ],
      faq: [
        ["Zer bereizmen aukeratu?", "150 ppp-k ia guztirako balio du. 72 ppp pantailan bakarrik ikusiko bada, eta 300 ppp inprimatuko bada."],
        ["Ateratako argazkiek kalitatea galtzen dute?", "Ez. JPEG argazkiak jatorrizkoen berdin-berdinak kopiatzen dira, eta gainerakoak PNG gisa gordetzen dira, galerarik gabe."],
        ["Orri bakar bat bihur dezaket?", "Bai. PDFtik JPGra tresnan, idatzi haren zenbakia Orriak eremuan, adibidez 3, eta hori bakarrik bihurtzen da."],
      ],
    },
    'convertir-un-pdf-a-pdfa-para-un-tramite': {
      slug: 'pdf-bat-pdf-a-bihurtu-izapideetarako',
      title: "Nola bihurtu PDF bat PDF/A formatura izapide edo artxibo baterako | DocuSmart",
      description:
        "Bihurtu PDF bat PDF/A-2b, 1b edo 3b formatura, erakunde publikoek, epaitegiek eta unibertsitateek eskatzen duten artxibo-formatura. Doan eta fitxategia igo gabe.",
      h1: "Nola bihurtu PDF bat PDF/A formatura izapide baterako edo artxibatzeko",
      lead: "Epaitegi batek, unibertsitate batek edo erakunde publiko batek dokumentua «PDF/A formatuan» eskatzen dizu, eta atariak zure PDFa baztertzen du. Hona hemen nola bihurtu, eta nola jakin zer bertsio aukeratu.",
      sections: [
        {
          h2: "Zer den PDF/A eta zergatik eskatzen duten",
          body: [
            "PDF/A artxibatzeko pentsatutako PDF bertsioa da (ISO 19005 araua). Fitxategiak ikusteko behar duen guztia darama barruan: letra-tipoak, kolore-profila eta metadatuak, eta ezin du kanpoko ezeren menpe egon, hala nola scripten, letra-tipoetarako esteken edo beste toki batetik kargatzen den edukiaren menpe. Horrela, gaur eta hemendik urte askotara berdin ikusten da.",
            "Horregatik eskatzen dute epaitegiek idazkiak eta demandak aurkezteko, unibertsitate askok tesi eta gradu amaierako lanetarako, eta erakunde publikoek izapide eta artxiboetarako.",
          ],
        },
        {
          h2: "Zer bertsio aukeratu",
          body: [
            { ul: [
              "**PDF/A-2b**: gomendatua, eta ia erakunde guztiek eskatzen dutena. Gardentasunak eta geruzak onartzen ditu.",
              "**PDF/A-1b**: zaharrena, beste bat onartzen ez duten sistemetarako bakarrik. Ez ditu gardentasunak ezta geruzak onartzen.",
              "**PDF/A-3b**: 2b bezalakoa, baina fitxategi erantsiak gordetzen ditu, adibidez faktura elektroniko baten XMLa.",
            ] },
            "Izapideak zein bertsio den esaten ez badu, erabili PDF/A-2b.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [PDFtik PDF/Ara](/pdf-a-pdfa), aukeratu PDFa eta **Bertsioa**, eta sakatu **Bihurtu PDF/A-ra**. Amaitzean emaitza ikusiko duzu jatorrizkoaren ondoan, araua betetzeko doitu denaren laburpenarekin: adibidez, fitxategiaren barruan sartu diren letra-tipoak edo kendu diren scriptak.",
            { tip: "DocuSmart-ek sortzen dituen fitxategiak veraPDF-rekin balidatzen dira, PDF Association-en erreferentziazko balidatzailearekin; atari askok jasotzen dutena berrikusteko erabiltzen duten bera da." },
          ],
        },
        {
          h2: "Orri bat irudi gisa gorde bada",
          body: [
            "Gauza batzuk ezin dira PDF/A-ra pasatu dauden bezala: inprenta-koloreak (CMYK) beren profilik gabe, edo fitxategiaren barruan ez datozen eta sartu ezin diren letra-tipoak. Kasu horretan orri hori irudi gisa gordetzen da: berdin ikusten da, baina bere testua ezin da gehiago hautatu. DocuSmart-ek esaten dizu zein orri diren eta zergatik. Testu hori bilagarria izatea behar baduzu, pasa emaitza [OCR: ezagutu testua](/ocr-pdf) tresnatik.",
            "Atariak pisu-muga ere jartzen badu, berrikusi gero tamaina eta, behar izanez gero, erabili [Konprimitu PDFa](/comprimir-pdf).",
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik irteten",
          body: [
            "Bihurketa zure nabigatzailean egiten da: PDFa ez da inongo zerbitzaritara igotzen. Demandak, kontratuak edo nortasun-agiriak bihur ditzakezu, beste inon kopiarik utzi gabe.",
          ],
        },
      ],
      steps: [
        { name: "Ireki PDFtik PDF/Ara", text: "Ireki docusmart.online webguneko PDFtik PDF/Ara tresna eta aukeratu PDFa." },
        { name: "Aukeratu bertsioa", text: "PDF/A-2b, izapideak zein den esaten ez badu; 1b edo 3b, eskatzen badizkizute bakarrik." },
        { name: "Bihurtu", text: "Sakatu «Bihurtu PDF/A-ra» eta berrikusi doitu denaren laburpena." },
        { name: "Deskargatu", text: "Deskargatu PDF/A fitxategia eta igo izapidearen atarira." },
      ],
      faq: [
        ["Zer bertsio eskatzen dute epaitegiek?", "Ia beti PDF/A-2b, edo «PDF/A» besterik ez. Erakundeak bertsio bat aipatzen badu, aukeratu hori."],
        ["Nire dokumentuaren edukia aldatzen da?", "Ez testua, ezta diseinua ere. Falta ziren letra-tipoak sartzen dira eta arauak onartzen ez dituen gauzak kentzen dira, hala nola scriptak edo eranskinak (PDF/A-3b-n izan ezik)."],
        ["Nola jakin araua betetzen duen?", "Amaitzean, DocuSmart-ek esaten dizu zer bertsio betetzen duen. Emaitzak veraPDF-rekin balidatzen dira, erreferentziazko balidatzailearekin."],
      ],
    },
    'reparar-un-pdf-que-no-abre': {
      slug: 'irekitzen-ez-den-pdf-bat-konpondu',
      title: "Nola konpondu irekitzen ez den edo errorea ematen duen PDF bat | DocuSmart",
      description:
        "Berreskuratu PDF hondatu bat edo erdian eten zen deskarga bat: DocuSmart-ek bere egitura berreraikitzen du eta orri osoak erreskatatzen ditu. Doan eta fitxategia igo gabe.",
      h1: "Nola konpondu irekitzen ez den, zuri agertzen den edo errorea ematen duen PDF bat",
      lead: "«Fitxategia hondatuta dago eta ezin izan da konpondu», pantaila zuri bat edo erdian eten zen deskarga bat. Dokumentua galdutzat eman aurretik, saiatu berreraikitzen.",
      sections: [
        {
          h2: "Zergatik hondatzen den PDF bat",
          body: [
            "PDF batek, fitxategiaren amaieran, orri eta irudi bakoitza non hasten den adierazten duen aurkibide bat du. Aurkibide hori galtzen edo lekuz mugitzen bada, irakurgailuak ez du ezer aurkitzen eta errore bat erakusten du, edukia hor egon arren. Batez ere kasu hauetan gertatzen da:",
            { ul: [
              "Erdian eten ziren deskargak edo eranskinak.",
              "Garaiz aurretik atera zen USB memoria batera kopiatutako fitxategiak.",
              "PDFa gaizki gorde zuten edo erdizka editatu zuten programak.",
            ] },
            "Seinaleak beti antzekoak dira: irakurgailuak fitxategia hondatuta dagoela dio, ireki egiten da baina orriak zuri agertzen dira, edo zure gailuan ondo ikusten da eta atari batek baztertu egiten du igotzean.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Konpondu PDFa](/reparar-pdf), aukeratu fitxategi hondatua eta sakatu **Konpondu PDFa**. Tresnak fitxategia hasieratik amaierara irakurtzen du, orriak aurkitzen ditu aurkibidea hautsita egon arren, eta kopia berri eta osasuntsu bat idazten du.",
            "Amaitzean kopia konpondua ikusiko duzu jatorrizkoaren ondoan, eta zer gertatu den esango dizu: arazoak aurkitu eta zuzendu dituen, fitxategia ondo zegoen, edo, etenda bazegoen, zituen orrietatik zenbat erreskatatu diren.",
            { tip: "PDFa ireki arren, batzuetan komeni da konpontzea: atari batek baztertzen badu edo tresna batek errorea ematen badu, berridatzitako kopia batek konpondu ohi du." },
          ],
        },
        {
          h2: "Zer berreskura daitekeen eta zer ez",
          body: [
            "Osorik iritsi zena berreskuratzen da. Deskarga bat % 70ean eten bazen, % 70 horretan zeuden orriak erreskatatzen dira; amaierakoak, inoiz iritsi ez zirenak, ezin dira berreraiki. Kasu horretan, onena fitxategia berriro deskargatzea edo berriro eskatzea da, eta bitartean kopia konpondua erabiltzea.",
            "PDFak irekitzeko pasahitza badu, kendu lehenik [Desblokeatu PDFa](/desbloquear-pdf) tresnarekin eta gero konpondu. Eta erreskatatu duzuna orri eskaneatuak badira eta haien testua behar baduzu, erabili [OCR: ezagutu testua](/ocr-pdf).",
          ],
        },
        {
          h2: "Zure dokumentua ez da gailutik irteten",
          body: [
            "Konponketa zure nabigatzailean egiten da: fitxategia ez da inongo zerbitzaritara igotzen. Dokumentu pertsonalekin edo lanekoekin saia zaitezke, beste inon kopiarik utzi gabe, eta jatorrizkoa ez da aldatzen.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Konpondu PDFa", text: "Ireki docusmart.online webguneko Konpondu PDFa tresna eta aukeratu PDF hondatua." },
        { name: "Konpondu", text: "Sakatu «Konpondu PDFa»: bere egitura berreraikitzen da." },
        { name: "Berrikusi emaitza", text: "Begiratu zer zuzendu den eta zenbat orri erreskatatu diren." },
        { name: "Deskargatu", text: "Deskargatu kopia konpondua; jatorrizkoa ez da aldatzen." },
      ],
      faq: [
        ["Eten zen fitxategi bat berreskura dezake?", "Bai, osorik iristea lortu zuten orriak. Fitxategiaren amaieran falta direnak ezin dira berreraiki."],
        ["Nire jatorrizko fitxategia aldatzen da?", "Ez. Kopia konpondu bat deskargatzen da, aparte."],
        ["Pasahitza duten PDFekin dabil?", "Kendu lehenik pasahitza Desblokeatu PDFa tresnarekin, eta gero konpondu."],
      ],
    },
    'hacer-una-cuenta-de-cobro': {
      slug: 'kobrantza-agiri-bat-egin',
      title: "Nola egin kobrantza-agiri bat PDFn, doan eta minutu gutxitan | DocuSmart",
      description:
        "Bete zure datuak, bezeroarenak eta kobratzen duzuna: totala, atxikipena eta zenbatekoa hitzez bakarrik ateratzen dira. Deskargatu PDFn, doan eta datuak igo gabe.",
      h1: "Nola egin kobrantza-agiri bat PDFn",
      lead: "Kobrantza-agiri batek esaten du nork zor dion nori, zenbat eta zergatik. DocuSmart-en txantiloiarekin nabigatzailean betetzen duzu, eta PDF txukun bat ateratzen da, bidaltzeko prest.",
      sections: [
        {
          h2: "Zer den kobrantza-agiri bat eta nork erabiltzen duen",
          body: [
            "Pertsona batek lan edo zerbitzu bat kobratzeko erabiltzen duen agiria da, fakturarik egiten ez duenean: diseinatzaile autonomo batek, eskola partikularrak ematen dituen irakasle batek, enpresa bati zerbitzuak ematen dizkion kontratista batek edo higiezin bat alokatzen duenak. Esan behar du nork kobratzen duen, nori, data, kontzeptua, zenbatekoa (zenbakiz eta hitzez) eta nola ordaintzen den.",
            { tip: "Kobrantza-agiri batek ez du faktura elektronikoa ordezkatzen. Zure jardueragatik edo diru-sarrerengatik fakturatu behar baduzu, galdetu aholkulari fiskal bati edo zure herrialdeko zerga-agintaritzari." },
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Kobrantza-agiria](/cuenta-de-cobro) eta utzi aukeratuta **Kobrantza-agiria** mota. Bilatu zure **herrialdea**: horrela doitzen dira moneta, zergaren izena eta dokumentu motak (NAN, IFZ, NIT, RFC, RUC…). Dokumentuaren zenbakia bakarrik proposatzen da (CC-0001) eta data gaurkoa da; gehitu hiria eta, nahi baduzu, **ordaintzeko azken eguna**.",
            "**Zure datuak** atalean idatzi zure izena eta zure dokumentua; **Bezeroa** atalean, ordaintzen dizunarenak. Helbidea, telefonoa eta posta elektronikoa aukerakoak dira.",
            "**Kontzeptuak** atalean deskribatu kobratzen duzuna, kantitatea eta unitateko prezioa. Hainbat gauza badira, erabili **Gehitu kontzeptua**. Subtotala, zerga, atxikipena eta totala idatzi ahala kalkulatzen dira, eta azpian zenbatekoa hitzez agertzen da.",
          ],
        },
        {
          h2: "Zerga, atxikipena eta deskontua",
          body: [
            "Zerga bat kobratzen baduzu (BEZa, adibidez), idatzi haren ehunekoa; zure herrialdea aukeratzean, tasa orokorra erabiltzeko botoi bat agertzen da. Bezeroak **atxikipena** egiten badizu, idatzi ehunekoa eta totaletik kentzen da, irudian bezala: 1.800.000 subtotala, % 10eko atxikipena eta 1.620.000 ordaintzeko. **Deskontua** zergen aurretik kentzen da.",
            { tip: "Atxikipenaren ehunekoa zure herrialdearen, zerbitzu motaren eta zure egoera fiskalaren araberakoa da. Ez badakizu, galdetu bezeroari: ia beti esaten dizu zenbat atxikiko dizun." },
          ],
        },
        {
          h2: "Ordainketarako datuak, sinadura eta PDFa",
          body: [
            "**Ordainketarako datuak** atalean jarri bankua, kontu mota eta zenbakia eta noren izenean dagoen: horrela bezeroak badaki non egin ordainketa. **Oharrak** atalean epeak edo baldintzak idatz ditzakezu. **Gehitu sinadura** aukerarekin hatzarekin edo saguarekin marrazten duzu, eta **Gehitu logoa** aukerarekin zurea jartzen duzu goian.",
            "Sakatu **Sortu PDFa**: kobrantza-agiria amaituta ikusiko duzu, zenbatekoa hitzez eta sinadura-lerroa dituela, deskargatzeko, WhatsApp bidez partekatzeko edo Driven gordetzeko prest.",
            { ul: [
              "Zenbakia bakarrik jarraitzen du dokumentu berri bakoitzean (CC-0002, CC-0003…). Eta **Gogoratu nabigatzaile honetan** markatzen baduzu, hurrengoan zure datuak, logoa eta bezeroak jarrita egongo dira; bankuko kontua ez da inoiz gordetzen.",
              "**Emandako dokumentuak** atalean aurreko agiri bat ireki dezakezu zuzentzeko, edo onartutako **aurrekontu** bat kobrantza-agiri bihurtu dena berriro idatzi gabe.",
              "Tresna berarekin **aurrekontu** bat (balio-datarekin) edo ordainketa baten **ordainagiria** egin dezakezu.",
            ] },
          ],
        },
        {
          h2: "Zure datuak eta bezeroarenak ez dira igotzen",
          body: [
            "Dena zure nabigatzailean prestatzen da: izenak, dokumentuak eta zenbatekoak ez dira inongo zerbitzaritara bidaltzen. Bezeroak lehendik duzun PDF batean sinatutako agiria eskatzen badizu, erabili [Sinatu PDFa](/firmar-pdf); eta hainbat batera bidali behar badituzu posta elektronikoz, [Konprimitu PDFa](/comprimir-pdf) tresnak arinago uzten ditu.",
          ],
        },
      ],
      steps: [
        { name: "Ireki txantiloia", text: "Ireki docusmart.online/eu/kobrantza-agiria eta aukeratu zure herrialdea." },
        { name: "Idatzi datuak", text: "Bete zure datuak, bezeroarenak, hiria eta data." },
        { name: "Gehitu kobratzen duzuna", text: "Deskribatu kontzeptu bakoitza bere zenbatekoarekin; totala, atxikipena eta zenbatekoa hitzez bakarrik ateratzen dira." },
        { name: "Sortu PDFa", text: "Gehitu ordainketarako datuak eta zure sinadura, sakatu «Sortu PDFa» eta deskargatu." },
      ],
      faq: [
        ["Kobrantza-agiri bat eta faktura bat gauza bera dira?", "Ez. Kobrantza-agiria fakturatu beharrik ez duenak erabiltzen du; ez du faktura elektronikoa ordezkatzen. DocuSmart-ek ez du faktura elektronikorik egiten."],
        ["Nola kalkulatzen da atxikipena?", "Idatzi bezeroak esaten dizun ehunekoa eta DocuSmart-ek subtotaletik kentzen du. Ordaintzeko totala atxikipena kenduta ateratzen da."],
        ["Kobrantza-agiri bat beste moneta batean egin dezaket?", "Bai. Zure herrialdea aukeratzean haren moneta jartzen da, eta beste batengatik alda dezakezu (dolarrak, euroak…) Moneta eremuan."],
      ],
    },
    'hacer-una-hoja-de-vida': {
      slug: 'curriculum-bat-egin',
      title: "Nola egin curriculum bat PDFn edo Worden, doan eta erregistratu gabe | DocuSmart",
      description:
        "Prestatu zure curriculuma txantiloi argi batekin, lan-atarietarako egokia (ATS), argazkiarekin edo gabe. Deskargatu PDFn edo Worden, doan eta konturik sortu gabe.",
      h1: "Nola egin curriculum bat PDFn edo Worden",
      lead: "Curriculum on bat segundo gutxitan ulertzen da eta lan-atarietako iragazki automatikoak gainditzen ditu. Hemen ataletan betetzen duzu eta ordenatuta ateratzen da, formatuarekin borrokatu gabe.",
      sections: [
        {
          h2: "Aukeratu txantiloia",
          body: [
            "Ireki [Curriculuma](/hoja-de-vida). Goian aukeratzen duzu nola ikusiko den:",
            { ul: [
              "**Klasikoa (ATS)**: zutabe bakarra eta argazkirik gabe. Lan-atarietan curriculumak iragazten dituzten sistemek ondoen irakurtzen dutena da; erabili sarean izena emateko.",
              "**Trinkoa**: bezain argia, letra eta marjina txikiagoekin, orri batean gehiago sar dadin.",
              "**Argazkiarekin**: zure argazkia goian, Latinoamerikako enpresa askok eskatzen duten bezala.",
            ] },
            "Orriaren tamaina (Gutuna edo A4), letra (modernoa edo klasikoa) eta tituluen kolorea ere aukeratzen dituzu.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Bete zure **datu pertsonalak**: izena, kargua edo lanbidea, hiria, telefonoa eta posta elektronikoa. LinkedIn edo portfolio bat baduzu, jarri **Estekak** atalean. Gero idatzi zure **profil profesionala** bizpahiru esalditan: nor zaren, zer dakizun egiten eta zer bilatzen duzun.",
            "**Lan-esperientzia** atalean gehitu lan bakoitza karguarekin, enpresarekin eta datekin; markatu **Gaur egun hemen lan egiten dut** oraindik han bazaude. **Lorpenak eta eginkizunak** atalean idatzi lorpen bat lerro bakoitzeko: lerro bakoitza puntu gisa ateratzen da. Egin gauza bera **Prestakuntza**, **Trebetasunak**, **Hizkuntzak**, **Ikastaroak eta ziurtagiriak** eta **Erreferentziak** ataletan; atal hutsak ez dira agertzen.",
            "Sakatu **Sortu PDFa** edo **Sortu Worda (.docx)**. Curriculuma amaituta ikusiko duzu, deskargatzeko edo partekatzeko prest.",
            { tip: "Hasi lorpen bakoitza aditz batekin eta erabili zifrak ahal duzunean: «Entrega-denborak % 30 murriztu nituen» esaldiak «entregen arduraduna» baino gehiago esaten du." },
          ],
        },
        {
          h2: "Alderatu eskaintzarekin eta idatzi gutuna",
          body: [
            "**Lan-eskaintza batekin alderatu** atalean lanpostuaren iragarkia itsasten duzu eta ikusten duzu zure curriculumak zer gako-hitz dituen jada eta zein falta zaizkion, bat-etortzearen ehunekoarekin. Iragazki automatikoek hitz horiek bilatzen dituzte; gehitu benetan dituzunak bakarrik.",
            "**Aurkezpen-gutuna** atalean enpresa eta kargua idazten dituzu, eta DocuSmart-ek zirriborro bat prestatzen du zure esperientziarekin eta indarguneekin. Berrikusi, egokitu zure erara eta deskargatu PDFn edo Worden.",
          ],
        },
        {
          h2: "Ez galdu idatzitakoa",
          body: [
            "**Gorde automatikoki nabigatzaile honetan** aukerarekin, idatzitakoa nabigatzaile honetan geratzen da orria ixten baduzu ere (argazkia ez). Beste ordenagailu batean jarraitzeko, erabili **Gorde zirriborroa**: .json fitxategi bat deskargatzen duzu, eta gero han irekitzen duzu **Ireki zirriborroa** aukerarekin.",
            "Enpresak argazkia atzealde zuriarekin eskatzen badizu, presta ezazu aurretik [Pasaporte eta nortasun-agiriaren argazkia](/foto-tamano-documento) tresnarekin. Eta curriculuma ziurtagiriekin batera fitxategi bakar batean bidali behar baduzu, batu itzazu [Batu PDFak](/unir-pdf) tresnarekin.",
          ],
        },
        {
          h2: "Zure informazioa ez da gailutik irteten",
          body: [
            "Curriculuma zure nabigatzailean prestatzen da: zure datuak, zure esperientzia eta zure argazkia ez dira inongo zerbitzaritara igotzen, ezta beste ezertarako erabiltzen ere. Ez duzu konturik sortu behar, ezta zure posta elektronikoa utzi ere.",
          ],
        },
      ],
      steps: [
        { name: "Aukeratu txantiloia", text: "Ireki docusmart.online/eu/curriculuma eta aukeratu Klasikoa (ATS), Trinkoa edo Argazkiarekin." },
        { name: "Bete atalak", text: "Idatzi zure datuak, zure profila, zure esperientzia, zure prestakuntza eta zure trebetasunak." },
        { name: "Alderatu eskaintzarekin", text: "Itsatsi lanpostuaren iragarkia zer gako-hitz falta zaizkizun ikusteko." },
        { name: "Deskargatu", text: "Sakatu «Sortu PDFa» edo «Sortu Worda» eta deskargatu zure curriculuma." },
      ],
      faq: [
        ["Zer da ATS curriculum bat?", "Zutabe bakarreko curriculum bat, taularik eta irudirik gabea, lan-atarietako hautaketa-sistemek akatsik gabe irakur dezaketena. Txantiloi Klasikoa da."],
        ["Worden deskarga dezaket?", "Bai. «Sortu Worda (.docx)» aukerarekin Worden, Google Docs-en edo LibreOffice-n ireki eta editatzen duzu."],
        ["Erregistratu behar dut?", "Ez. Doakoa da, ez du konturik ezta posta elektronikorik eskatzen, eta idazten duzuna zure gailuan geratzen da."],
      ],
    },
    'crear-un-codigo-qr': {
      slug: 'qr-kode-bat-sortu',
      title: "Nola sortu QR kode bat doan esteka, WhatsApp edo Wi-Firako | DocuSmart",
      description:
        "Sortu QR kode bat esteka, WhatsApp, zure Wi-Fi edo zure kontakturako, zure kolorearekin eta logoarekin. Deskargatu PNG, SVG edo PDFn. Doan, erregistrorik gabe, iraungi gabe.",
      h1: "Nola sortu QR kode bat doan",
      lead: "QR batek jendea zure orrira eramaten du, WhatsApp txat bat irekitzen du edo Wi-Fira konektatzen du ezer idatzi gabe. Sortu segundo gutxitan; ez da iraungitzen eta ez dago inongo zerbitzariren menpe.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Sortu eta irakurri QR kodeak](/crear-codigo-qr) eta aukeratu zer gordeko duen: **URLa**, **Testua**, **Posta**, **Telefonoa**, **WhatsApp**, **SMS**, **Kokapena**, **Wi-Fi**, **Kontaktua** edo **Gertaera**. Idatzi datuak (esteka baterako, helbide osoa https:// eta guzti).",
            "Sakatu **Sortu QR**. Kodea berehala agertzen da, eta PNGn, **SVGn** (bektoriala, edozein tamainatan garbi inprimatzen da) edo **10 cm-ko PDFn** deskarga dezakezu, irudi gisa kopiatu edo inprimatu.",
            { tip: "Ehun esku-orri inprimatu aurretik, eskaneatu QRa zure mugikorrarekin espero duzuna irekitzen duela egiaztatzeko." },
          ],
        },
        {
          h2: "Zer egin dezakeen mota bakoitzak",
          body: [
            { ul: [
              "**WhatsApp**: idatzi zenbakia herrialdearen aurrezenbakiarekin (34 Espainiarako, adibidez) eta, nahi baduzu, mezu bat. Eskaneatzean txata irekitzen da mezua idatzita duela.",
              "**Wi-Fi**: sarearen izena, segurtasuna eta pasahitza. Zure bisitariak konektatzen dira zuk pasahitza esan beharrik gabe.",
              "**Kontaktua**: izena, telefonoa, posta elektronikoa eta enpresa. Eskaneatzean, mugikorrak agendan gordetzea eskaintzen du.",
              "**Kokapena**: mapan irekitzen den helbide bat edo koordenatu batzuk.",
              "**Gertaera**: izenburua, lekua eta hasiera eta amaiera, egutegira gehitzeko.",
            ] },
          ],
        },
        {
          h2: "Eman zure estiloa",
          body: [
            "**Pertsonalizatu diseinua** atalean kodearen eta atzealdearen kolorea aldatzen duzu (edo gardena uzten duzu zure diseinuaren gainean jartzeko), zure **logotipoa** jartzen duzu erdian eta irudiaren tamaina aukeratzen duzu. Koloreek kontraste txikia badute, DocuSmart-ek abisatzen dizu, kamera batek agian ez lukeelako irakurriko.",
            "**Babestua** aukerarekin, QRaren edukia pasahitz batekin zifratuta geratzen da (AES-256): pasahitza duenak bakarrik irekitzen du, DocuSmart-en. Eta **Hainbat QR zerrenda batetik** aukerarekin asko sortzen dituzu batera, lerro bakoitzeko bat edo CSV batetik, adibidez jatetxe bateko mahaietarako edo inbentario bateko etiketetarako.",
          ],
        },
        {
          h2: "QR bat irakurtzeko",
          body: [
            "Behar duzuna bat irakurtzea bada, erabili [QR kodea irakurri](/leer-codigo-qr): kamerarekin, argazki edo pantaila-argazki batetik, edo PDF batetik. Esteka bat ireki aurretik nora daraman erakusten dizu eta engainagarria dirudien abisatzen dizu.",
          ],
        },
        {
          h2: "Zure QRa ez da iraungitzen",
          body: [
            "Kodea zure nabigatzailean sortzen da eta datuak zuzenean gordetzen ditu, tarteko estekarik gabe. Horregatik ez da iraungitzen, ez du eskaneatze-mugarik eta beste inork ez du ikusten zer jarri duzun. Sortzen dituzun QRak **Historia** atalean geratzen dira, zure nabigatzailean bakarrik.",
          ],
        },
      ],
      steps: [
        { name: "Aukeratu mota", text: "Ireki docusmart.online/eu/qr-kodea-sortu eta aukeratu URLa, WhatsApp, Wi-Fi edo beste mota bat." },
        { name: "Idatzi datuak", text: "Jarri esteka, zenbakia edo sarearen datuak." },
        { name: "Sortu QRa", text: "Sakatu «Sortu QR» eta, nahi baduzu, aldatu kolorea edo gehitu zure logotipoa." },
        { name: "Deskargatu", text: "Deskargatu PNG, SVG edo PDFn, edo inprimatu." },
      ],
      faq: [
        ["QR kodea iraungitzen da?", "Ez. Datuak kodearen barruan doaz, tarteko estekarik gabe; beraz, betiko dabil eta eskaneatze-mugarik gabe."],
        ["Zer formatu erabili inprimatzeko?", "SVGa: bektoriala da eta edozein tamainatan garbi ikusten da, txartel batetik kartel bateraino. 10 cm-ko PDF bat ere badago."],
        ["Nire logotipoa jar dezaket QRan?", "Bai, «Pertsonalizatu diseinua» atalean. Logotipoa erdiko zirkulu batean geratzen da eta kodea irakurtzen jarraitzen da."],
      ],
    },
    'cambiar-el-tamano-de-una-foto': {
      slug: 'argazki-baten-tamaina-aldatu',
      title: "Nola aldatu argazki baten tamaina pixeletan, %-tan edo zentimetrotan | DocuSmart",
      description:
        "Aldatu argazki baten edo batzuen tamaina pixeletan, ehunekotan, zentimetrotan edo Instagram, WhatsApp edo YouTuberen neurri zehatzera. Doan eta igo gabe.",
      h1: "Nola aldatu argazki baten tamaina",
      lead: "Mugikorreko argazki batek milaka pixel ditu: gehiegi inprimaki, web orri edo azal baterako. Hemen behar duzun neurrira eramaten duzu, deformatu gabe.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Aldatu irudiaren tamaina](/redimensionar-imagen) eta aukeratu argazki bat edo batzuk (JPG, PNG, WebP, HEIC, GIF edo BMP). Gero aukeratu **nola aldatu tamaina**:",
            { ul: [
              "**Ehunekoaren arabera**: adibidez, % 50ek argazkia zabaleran eta altueran erdira uzten du.",
              "**Pixelen arabera**: idatzi zabalera, altuera edo biak. **Mantendu proportzioa** aktibatuta, alde bat nahikoa da: bestea bakarrik kalkulatzen da.",
              "**Sare sozialak**: Instagram, WhatsApp egoerak, Facebook edo LinkedIn azalak eta YouTube miniaturetarako neurri zehatzak.",
              "**Zentimetrotan**: inprimatzeko, aukeratzen duzun bereizmenarekin.",
            ] },
            "Sakatu **Tamaina aldatu** eta argazkia lehen eta ondoren ikusiko duzu, bere pisuarekin. Batzuk aukeratu badituzu, ZIP batean gordetzen dira batera.",
          ],
        },
        {
          h2: "Deformatu ez dadin",
          body: [
            "Argazki bat luzatuta ikusten da zabalera eta altuera proportzio desberdinean aldatzen dituzunean. Horregatik **Mantendu proportzioa** aktibatuta dator: bi aldeak idazten badituzu, argazkia tamaina horren barruan sartzen da luzatu gabe. **Sare sozialak** aukeran, irudiak neurri zehatza betetzen du eta soberan dagoena erditik berdin mozten da.",
            { tip: "Argazki bat txikitzeak ez dio inoiz garbitasunik kentzen begi-bistan, baina handitzeak ez dio xehetasunik gehitzen: bikoitzera handitutako argazki txiki bat lausotuta ikusten da." },
          ],
        },
        {
          h2: "Moztu edo pisu gutxiago izatea nahi baduzu",
          body: [
            "Tamaina aldatzea ez da moztea bezala. Ertz bat kentzeko, pertsona bat enkoadratzeko edo argazkia karratu uzteko, erabili [Moztu irudia](/recortar-imagen): moztu librea edo proportzio finkoetan, hala nola 1:1, 4:3 edo 16:9.",
            "Eta inprimaki batek argazkiak tamaina jakin bat baino gutxiago pisatzea eskatzen badu (adibidez, 200 KB), [Konprimitu irudia](/comprimir-imagen) tresnak kalitatea behar adina jaisten du sar dadin, eta pixelak murrizten ditu nahikoa ez bada bakarrik.",
          ],
        },
        {
          h2: "Sarri eskatzen diren neurriak",
          body: [
            { ul: [
              "**Web orri edo blog baterako**: 1200 eta 1920 pixel arteko zabalera nahikoa baino gehiago da; handiagoak orria motel kargatzea besterik ez dakar.",
              "**Inprimaki edo izapide baterako**: gehienezko zabalera bat (adibidez, 800 pixel) eta gehienezko pisu bat eskatu ohi dituzte. Doitu lehenik tamaina hemen eta, oraindik asko pisatzen badu, konprimitu.",
              "**Inprimatzeko**: erabili Zentimetrotan; 300 ppp-tan, 10 × 15 cm-ko argazki batek 1181 × 1772 pixel inguru behar ditu garbi ikusteko.",
            ] },
          ],
        },
        {
          h2: "Zure argazkiak ez dira igotzen",
          body: [
            "Dena zure nabigatzailean gertatzen da, baita dozenaka argazkirekin batera ere. Gainera, gordetzean argazkiaren datu ezkutuak (EXIF) kentzen dira, hala nola atera zen GPS kokapena.",
          ],
        },
      ],
      steps: [
        { name: "Aukeratu argazkiak", text: "Ireki docusmart.online/eu/irudiaren-tamaina-aldatu eta aukeratu argazki bat edo batzuk." },
        { name: "Aukeratu neurria", text: "Ehunekoaren arabera, pixelen arabera, sare sozialetako neurri bat edo zentimetrotan." },
        { name: "Aldatu tamaina", text: "Sakatu «Tamaina aldatu» eta alderatu lehena eta ondorena." },
        { name: "Deskargatu", text: "Deskargatu argazkia, edo ZIPa batzuk baziren." },
      ],
      faq: [
        ["Argazkiak kalitatea galtzen du txikitzean?", "Begi-bistan ez: bezain garbi ikusten da, txikiagoa besterik ez. Ezin dena da handitzea nabaritu gabe."],
        ["Hainbat argazkiren tamaina alda dezaket batera?", "Bai. Aukeratu denak batera: neurri berarekin aldatzen dira eta ZIP batean deskargatzen dira."],
        ["Zer neurri erabili Instagramerako?", "Sare sozialak aukeran Instagram karratua eta bertikala, eta istorioak dituzu. Argazkiak neurria betetzen du eta soberan dagoena erditik mozten da."],
      ],
    },
    'comprimir-archivos-en-zip': {
      slug: 'fitxategiak-zip-batean-konprimitu',
      title: "Nola konprimitu fitxategiak ZIPean eta ireki ZIP edo RAR bat programarik gabe | DocuSmart",
      description:
        "Batu hainbat fitxategi edo karpeta bat ZIP batean, nahi baduzu pasahitzarekin, eta ireki ZIP, RAR edo 7Z nabigatzailetik. Doan, ezer instalatu gabe eta igo gabe.",
      h1: "Nola konprimitu fitxategiak ZIPean eta ireki ZIP edo RAR bat",
      lead: "ZIP batek fitxategi asko bakar batean biltzen ditu: posta elektronikoz bidaltzeko errazagoa eta, batzuetan, arinagoa. Hemen nabigatzailetik sortzen eta irekitzen duzu, programarik instalatu gabe.",
      sections: [
        {
          h2: "ZIP bat sortu, urratsez urrats",
          body: [
            "Ireki [Konprimitu fitxategiak (ZIP eta 7Z)](/comprimir-archivos) eta gehitu fitxategiak (edozein motatakoak) edo karpeta oso bat **Gehitu karpeta bat** aukerarekin. Idatzi ZIParen izena eta aukeratu konpresioa: **Azkarra**, **Arrunta** edo **Handiena**.",
            "Sakatu **Sortu ZIP**. Zure fitxategiak alde batean eta ZIPa bestean ikusiko dituzu, lehen guztiak zenbat pisatzen zuen eta orain zenbat pisatzen duen.",
            { tip: "Argazkiak, bideoak eta PDFak konprimituta datoz jada, beraz ZIP batean ia ez dute pisurik galtzen. Asko murrizten direnak Word dokumentuak, kalkulu-orriak eta testuak dira." },
          ],
        },
        {
          h2: "Pasahitzarekin edo zatitan",
          body: [
            { ul: [
              "**Babestu pasahitzarekin (AES-256)**: inork ez du ZIPa irekitzen gakorik gabe. ZIPean pasahitzak ezin du azenturik ezta ñ-rik izan; behar badituzu, aukeratu 7Z formatua.",
              "**Zatitan banatu**: posta elektronikoak hain fitxategi handirik onartzen ez badu, hainbatetan zatitzen duzu (.001, .002…). Irekitzeko zati guztiak behar dira, DocuSmart, 7-Zip edo WinRAR erabiliz.",
              "**7Z**: ZIPek baino gehiago konprimitzen du, baina ordenagailu batzuetan programa bat instalatu behar da irekitzeko. ZIPa edozein ordenagailu eta mugikorretan irekitzen da ezer instalatu gabe.",
            ] },
          ],
        },
        {
          h2: "ZIP, RAR edo 7Z bat ireki",
          body: [
            "Konprimitu baten barruan dagoena ateratzeko, erabili [Deskonprimitu RAR, ZIP eta 7Z](/descomprimir-archivos). ZIP, RAR, 7Z, TAR, GZ, BZ2 eta XZ irekitzen ditu, baita pasahitza dutenak edo zatitan banatuta datozenak ere.",
            "Barruan dagoenaren zerrenda ikusiko duzu, bere karpetekin. Fitxategi baten aurrebista ireki dezakezu deskargatu aurretik, aukeratzen dituzunak bakarrik atera edo denak batera deskargatu.",
          ],
        },
        {
          h2: "PDF batek pisu gutxiago izatea nahi baduzu",
          body: [
            "PDF bat ZIP batean sartzeak ia ez du txikitzen. PDF batek benetan pisu gutxiago izan dezan, pasa ezazu [Konprimitu PDFa](/comprimir-pdf) tresnatik, barruan dituen irudiak murrizten baititu.",
          ],
        },
        {
          h2: "Zure fitxategiak ez dira gailutik irteten",
          body: [
            "Konprimitzea eta deskonprimitzea zure nabigatzailearen memorian gertatzen da: ezer ez da internetera igotzen. Oso fitxategi handiekin (hainbat GB) denbora behar dezake edo memoriarik gabe gera daiteke; kasu horretan, banatu hainbat ZIPetan.",
          ],
        },
      ],
      steps: [
        { name: "Gehitu fitxategiak", text: "Ireki docusmart.online/eu/fitxategiak-konprimitu eta gehitu fitxategiak edo karpeta bat." },
        { name: "Aukeratu aukerak", text: "Idatzi izena, konpresioa eta, nahi baduzu, pasahitz bat." },
        { name: "Sortu ZIPa", text: "Sakatu «Sortu ZIP» eta begiratu zenbat jaitsi den pisua." },
        { name: "Deskargatu", text: "Deskargatu ZIPa edo partekatu." },
      ],
      faq: [
        ["RAR bat ireki dezaket WinRAR gabe?", "Bai. «Deskonprimitu RAR, ZIP eta 7Z» tresnak RAR, ZIP, 7Z eta beste formatu batzuk irekitzen ditu nabigatzailean, ezer instalatu gabe. Berri bat sortzeko erabili ZIP edo 7Z."],
        ["Zergatik pisatzen du nire ZIPak ia gauza bera?", "Argazkiak, bideoak eta PDFak konprimituta datozelako jada. ZIPak fitxategi bakar batean biltzeko balio du, ez hainbeste txikitzeko."],
        ["Segurua da pasahitza jartzea?", "Bai. AES-256rekin zifratzen da eta pasahitza ez da inon gordetzen: ahazten baduzu, ez dago berreskuratzeko modurik."],
      ],
    },
    'recortar-los-margenes-de-un-pdf': {
      slug: 'pdf-baten-marjinak-moztu',
      title: "Nola moztu PDF baten marjinak edo zati bat | DocuSmart",
      description:
        "Kendu PDF baten marjina zuriak ukitu batekin edo moztu eskuz gorde nahi duzun zatia, orri guztietan edo bakar batean. Doan eta fitxategia igo gabe.",
      h1: "Nola moztu PDF baten marjinak edo zati bat",
      lead: "Marjina erraldoiak dituen PDF bat txiki irakurtzen da mugikorrean eta paper zuri askorekin inprimatzen da. Mozteak garrantzitsua dena bakarrik uzten du, edukia ukitu gabe.",
      sections: [
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Moztu PDFa](/recortar-pdf) eta aukeratu fitxategia. Lehen orria ikusiko duzu laukitxo bat gainean duela: ilundutakoa da moztuko dena.",
            "Sakatu **Kendu marjina zuriak** eta laukitxoa bakarrik doitzen da orriaren edukira, irudian bezala. Eskuz egin nahiago baduzu, arrastatu laukitxoaren ertzak edo izkinak. Azpian geratuko den tamaina ikusten duzu, milimetrotan.",
            "Aukeratu moztea **Orri guztiak** aukerari aplikatuko zaion edo ikusten ari zaren orriari bakarrik (adibidez, **1. orria soilik**), sakatu **Moztu PDFa** eta deskargatu emaitza.",
            { tip: "Orriek marjina desberdinak badituzte, berrikusi batzuk geziekin moztu aurretik: «Orri guztiak» aukeraren laukitxoa bera da bakoitzarentzat." },
          ],
        },
        {
          h2: "Zertarako balio duen",
          body: [
            { ul: [
              "**Mugikorrean irakurtzeko**: marjinarik gabe, testuak pantaila osoa hartzen du eta handiago irakurtzen da.",
              "**Zati bat ateratzeko**: taula bat, grafiko bat edo dokumentu eskaneatu baten argazkia, aparte erabiltzeko.",
              "**Eskaneatze bati soberan dagoena kentzeko**: eskanerraren estalkiaren ertz beltza edo orriaren inguruko mahaia.",
            ] },
          ],
        },
        {
          h2: "Zer gertatzen den edukiarekin",
          body: [
            "Mozteak orri bakoitzaren eremu ikusgaia aldatzen du, testua eta irudiak berregin gabe: geratzen dena bezain garbi ikusten da eta testua kopiatu eta bilatu daiteke oraindik.",
            "Gero orri batzuk bakarrik behar badituzu, bereizi [Zatitu PDFa](/dividir-pdf) tresnarekin; eta orriren bat alboz geratu bada, zuzendu [Biratu PDFa](/rotar-pdf) tresnarekin.",
          ],
        },
        {
          h2: "Inprimatu aurretik",
          body: [
            "Moztutako PDF bat inprimatzean, orria paper-orria baino txikiagoa geratzen da. Paper osoa har dezan, aukeratu **Doitu orriaren tamainara** (edo antzeko aukera) zure nabigatzailearen edo PDF irakurgailuaren inprimatze-leihoan.",
            "Eskaneatze bat moztu baduzu dokumentu baten argazkiarekin geratzeko (nortasun-agiri bat, txartel bat), egiaztatu dokumentuaren ertzik ez duzula moztu: izapide askok lau izkinak ikustea eskatzen dute.",
          ],
        },
        {
          h2: "Zure PDFa ez da gailutik irteten",
          body: [
            "Moztu osoa zure nabigatzailean gertatzen da. PDFa ez da inongo zerbitzaritara igotzen; beraz, lasai erabil dezakezu kontratuekin edo dokumentu pertsonalekin.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Moztu PDFa", text: "Ireki docusmart.online/eu/pdfa-moztu eta aukeratu PDFa." },
        { name: "Doitu laukitxoa", text: "Sakatu «Kendu marjina zuriak» edo arrastatu ertzak eskuz." },
        { name: "Aukeratu orriak", text: "Aplikatu moztea orri guztiei edo ikusten ari zarenari bakarrik." },
        { name: "Deskargatu", text: "Sakatu «Moztu PDFa» eta deskargatu emaitza." },
      ],
      faq: [
        ["PDF bat moztean kalitatea galtzen da?", "Ez. Orriaren eremu ikusgaia bakarrik aldatzen da; testua eta irudiak berdin geratzen dira."],
        ["Orri bakar bat moztu dezaket?", "Bai. Moztu aurretik aukeratu ikusten ari zaren orria soilik."],
        ["Moztutakoa fitxategitik ezabatzen da?", "Bistatik eta inprimaketatik kanpo geratzen da. Datu pribatu bat ezabatu nahi baduzu, erabili «Ezabatu PDFko datuak», benetan ezabatzen baitu."],
      ],
    },
    'cambiar-el-formato-de-una-imagen': {
      slug: 'irudi-baten-formatua-aldatu',
      title: "Nola aldatu irudi baten formatua: HEIC, JPG, PNG edo WebP | DocuSmart",
      description:
        "Pasa iPhoneko HEIC argazkiak JPGra, JPG bat PNGra edo edozein irudi WebPra, bat edo asko batera. Doan, nabigatzailean eta zure argazkiak igo gabe.",
      h1: "Nola aldatu irudi baten formatua: HEIC, JPG, PNG edo WebP",
      lead: "Formatu bakoitzak gauza desberdin baterako balio du, eta batzuetan orri edo programa batek bat bakarrik onartzen du. Hemen zure argazkien formatua segundo gutxitan aldatzen duzu, ezer instalatu gabe.",
      sections: [
        {
          h2: "Zer formatu komeni zaizun",
          body: [
            { ul: [
              "**JPG**: argazkiena. Gutxi pisatzen du eta edozein gailuk, orrik edo inprimakik irekitzen du. Ez du atzealde gardenik onartzen.",
              "**PNG**: kalitate-galerarik gabe eta atzealde gardenarekin. Logotipoetarako, pantaila-argazkietarako eta marrazkietarako aproposa; argazkiekin askoz gehiago pisatzen du.",
              "**WebP**: webeko formatu modernoa. JPG baten berdina ikusten da pisu dezente gutxiagorekin, irudian bezala: 189 KBtik 50 KBra.",
              "**HEIC**: iPhoneek erabiltzen dutena. Gutxi hartzen du, baina ordenagailu, orri eta programa askok ez dute irekitzen.",
            ] },
          ],
        },
        {
          h2: "iPhoneko argazkiak (HEIC) JPGra",
          body: [
            "Ireki [HEICtik JPGra](/heic-a-jpg) eta aukeratu zure HEIC argazkiak, bat edo asko. Doitu **JPGren kalitatea** nahi baduzu (markatuta datorrena jatorrizkoaren berdina ikusten da) eta sakatu **Bihurtu**. Batzuk baziren, ZIP batean deskargatzen dira batera.",
            { tip: "Lehen aldian HEIC deskodetzailea deskargatzen da (1,4 MB) eta gordeta geratzen da: hurrengo bihurketak berehala hasten dira." },
            "iPhoneak argazkiak zuzenean JPGn ateratzea nahiago baduzu, **Ezarpenak → Kamera → Formatuak** atalean aukeratu **Bateragarriena**.",
          ],
        },
        {
          h2: "JPGtik PNGra, edo edozein irudi WebPra",
          body: [
            "[JPGtik PNGra](/jpg-a-png) tresnarekin argazki bat PNG bihurtzen duzu programa batek eskatzen duenean edo kalitaterik galdu gabe hainbat aldiz editatuko duzunean. [Iruditik WebPra](/imagen-a-webp) tresnarekin web orri bateko edo lineako denda bateko argazkien pisua jaisten duzu, nabaritu gabe.",
            "Biek berdin funtzionatzen dute: irudi bat edo batzuk aukeratzen dituzu, botoia sakatzen duzu eta lehena eta ondorena ikusten dituzu bertsio bakoitzaren pisuarekin, deskargatzeko prest.",
          ],
        },
        {
          h2: "Gainera pisu gutxiago izatea edo tamaina aldatzea behar baduzu",
          body: [
            "Formatua aldatzeak ez ditu argazkiaren neurriak aldatzen. Inprimaki batek pisu jakin bat ez gainditzeko eskatzen badizu, erabili [Konprimitu irudia](/comprimir-imagen), HEIC argazkiak ere onartzen dituena eta JPGn ematen dituena; eta zabalera edo altuera zehatz bat eskatzen badizute, [Aldatu irudiaren tamaina](/redimensionar-imagen).",
          ],
        },
        {
          h2: "Zure argazkiak igo gabe",
          body: [
            "Bihurketa zure nabigatzailean gertatzen da: zure argazkiak ez dira inongo zerbitzaritara igotzen. Gordetzean, gainera, datu ezkutuak (EXIF) kentzen dira, hala nola atera ziren kokapena.",
          ],
        },
      ],
      steps: [
        { name: "Aukeratu bihurketa", text: "Ireki docusmart.online webguneko HEICtik JPGra, JPGtik PNGra edo Iruditik WebPra tresna." },
        { name: "Aukeratu argazkiak", text: "Gehitu irudi bat edo batzuk." },
        { name: "Bihurtu", text: "Sakatu botoia eta alderatu lehena eta ondorena." },
        { name: "Deskargatu", text: "Deskargatu irudia, edo ZIPa batzuk baziren." },
      ],
      faq: [
        ["Zergatik ezin ditut nire iPhoneko argazkiak ordenagailuan ireki?", "HEIC formatuan daudelako, gailu eta orri askok ezagutzen ez duten formatu batean. Pasa itzazu JPGra eta edonon irekiko dira."],
        ["Argazki batek kalitatea galtzen du PNGra pasatzean?", "Ez: PNGk ez du kalitaterik galtzen. Baina ez du berreskuratzen ere; argazkia jatorrizko JPGren berdina geratzen da eta gehiago pisatzen du."],
        ["WebP nabigatzaile guztietan ikusten da?", "Bai, gaur egungo nabigatzaile guztietan. Mahaigaineko programa zahar batzuek oraindik ez dute irekitzen."],
      ],
    },
    'borrar-la-ubicacion-y-los-datos-ocultos-de-una-foto': {
      slug: 'argazki-baten-kokapena-eta-datu-ezkutuak-ezabatu',
      title: "Nola ezabatu argazki edo PDF baten kokapena eta datu ezkutuak | DocuSmart",
      description:
        "Ikusi argazki edo dokumentu batek zer datu ezkutu gordetzen dituen (GPS kokapena, kamera, data, egilea) eta ezabatu partekatu aurretik. Doan eta fitxategia igo gabe.",
      h1: "Nola ezabatu argazki baten kokapena eta datu ezkutuak",
      lead: "Mugikorreko argazki batek atera zen leku zehatza gorde dezake, eta dokumentu batek, idatzi zuenaren izena. Argitaratu edo bidali aurretik, begiratu zer daramaten eta ezabatu.",
      sections: [
        {
          h2: "Zer diren datu ezkutuak (metadatuak)",
          body: [
            "Fitxategiaren barruan doazen baina irudian edo orrietan ikusten ez diren datuak dira. Argazki batek **GPS kokapena**, mugikorraren marka eta modeloa, kameraren serie-zenbakia eta data eta ordu zehatzak gorde ditzake. PDF batek edo Word dokumentu batek **egilea**, enpresa, egiteko erabili zen programa eta sortze- eta aldatze-datak gorde ditzake.",
            "Fitxategia jasotzen duenak edozein irakurgailurekin ikus ditzake. Zure etxeko argazki batekin, adibidez, kokapenak zure helbidera darama.",
          ],
        },
        {
          h2: "Urratsez urrats",
          body: [
            "Ireki [Metadatuak kendu](/quitar-metadatos) eta aukeratu zure argazkiak edo dokumentuak: JPG, PNG, WebP, HEIC, TIFF, MP4 eta MOV bideoak, PDF, Word, Excel edo PowerPoint. Berehala ikusiko duzu bakoitzean **aurkitutako datu ezkutuen** zerrenda, irudian bezala; argazki batek kokapena gordetzen badu, gorriz agertzen da abisu batekin.",
            "Sakatu **Metadatuak kendu**. Fitxategi bakoitzak lehen zenbat datu zituen eta ondoren zenbat geratzen diren ikusiko duzu, eta kopia garbia deskargatzen duzu (edo ZIP bat, batzuk baziren).",
            { tip: "Argazkien orientazioa bakarrik gordetzen da, biratuta ager ez daitezen. Irudia ez da berriro konprimitzen: ez du kalitaterik galtzen." },
          ],
        },
        {
          h2: "PDFetan eta Office dokumentuetan",
          body: [
            "PDFetan, **Kendu iruzkinak, eranskinak eta JavaScripta ere** aukerak, gainera, egilearen izena duten oharrak, erantsitako fitxategiak eta irekitzean exekutatzen den kodea ezabatzen ditu. Desaktibatu iruzkinak gorde behar badituzu.",
            "Word, Excel eta PowerPoint-en egilea, enpresa eta datak kentzen dira. Iruzkinetan eta aldaketen kontrolean agertzen diren izenak programatik bertatik ezabatzen dira.",
          ],
        },
        {
          h2: "Datu pribatua bistan badago",
          body: [
            "Metadatuak kentzeak ez du ikusten dena aldatzen. Ezkutatu nahi duzuna PDF baten orrietan agertzen den nortasun-agiriaren zenbaki bat, sinadura bat edo helbide bat bada, erabili [Ezabatu PDFko datuak](/censurar-pdf), estali eta fitxategitik ezabatzen baitu.",
          ],
        },
        {
          h2: "Zure gailuan egiten da",
          body: [
            "Dena zure nabigatzailean gertatzen da: zure argazkiak eta dokumentuak ez dira inongo zerbitzaritara igotzen. Horrela ez duzu fitxategi pribatu baten kopiarik uzten, hain zuzen babesten saiatzen ari zarenean.",
          ],
        },
      ],
      steps: [
        { name: "Ireki Metadatuak kendu", text: "Ireki docusmart.online/eu/metadatuak-kendu eta aukeratu argazkiak edo dokumentuak." },
        { name: "Berrikusi zer gordetzen duten", text: "Begiratu fitxategi bakoitzaren datu ezkutuen zerrenda, hala nola GPS kokapena." },
        { name: "Ezabatu", text: "Sakatu «Metadatuak kendu» eta egiaztatu bat ere ez dela geratu." },
        { name: "Deskargatu", text: "Deskargatu kopia garbia, partekatzeko prest." },
      ],
      faq: [
        ["WhatsAppek argazkien kokapena ezabatzen du?", "Argazki gisa bidaltzean, WhatsAppek berriro konprimitzen ditu eta datu gehienak kentzen ditu. Baina dokumentu gisa, posta elektronikoz bidaltzen badituzu edo beste orri batzuetara igotzen badituzu, kokapenarekin irits daitezke."],
        ["Argazkiak kalitatea galtzen du?", "Ez. Datu ezkutuak bakarrik kentzen dira; irudia zehazki berdin geratzen da."],
        ["Zer datu gordetzen dira?", "Argazkien orientazioa bakarrik, biratuta ager ez daitezen. Gainerako guztia ezabatzen da."],
      ],
    },
  },
}
