// Traducción al italiano de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: 'Guide',
    guidesSlug: 'guide',
    indexTitle: 'Guide PDF passo passo: unire, firmare, scansionare | DocuSmart',
    indexDescription:
      'Guide brevi e pratiche per unire, comprimere, firmare, scansionare e proteggere i PDF dal cellulare o dal computer, gratis e senza caricare i tuoi file.',
    indexH1: 'Guide passo passo',
    indexLead: "Guide pratiche che ti accompagnano dall'inizio alla fine nelle operazioni più comuni sui documenti. Tutti gli strumenti che usano funzionano nel browser, quindi i tuoi file restano sul tuo dispositivo.",
    minutes: '{n} min di lettura',
    updated: 'Aggiornata il {date}',
    summary: 'In breve',
    toolsTitle: 'Strumenti usati in questa guida',
    moreGuides: 'Altre guide',
    related: 'Guide correlate',
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'unire-pdf-sul-cellulare',
      title: 'Come unire PDF sul cellulare senza caricare i file | DocuSmart',
      description:
        'Guida passo passo per unire più PDF in uno solo dal cellulare, gratis e senza caricarli su nessun server. Funziona nel browser su Android e iPhone.',
      h1: 'Come unire PDF sul cellulare senza caricare i file',
      lead: "Mettere carta d'identità, ricevuta e modulo in un unico PDF è una delle operazioni più comuni quando si fa una pratica. Ecco come farlo dal cellulare, in un minuto e senza consegnare i tuoi documenti al server di qualcun altro.",
      sections: [
        {
          h2: 'Perché è importante non caricare i file',
          body: [
            "La maggior parte dei siti per unire PDF riceve i tuoi documenti sui propri server, li elabora lì e ti restituisce il risultato. Per il menu di un ristorante poco importa; per una carta d'identità, un estratto conto o una cartella clinica, molto di più: non sai per quanto tempo li conservano né chi può vederli.",
            "DocuSmart unisce i file all'interno del browser del tuo cellulare. Il file non viaggia mai su internet, quindi non ne resta copia su nessun server. Per questo funziona anche con poco segnale, una volta caricata la pagina.",
          ],
        },
        {
          h2: 'Prima di iniziare',
          body: [
            { ul: [
              "Tieni i PDF salvati sul cellulare (in Download, nell'app File o nel tuo cloud).",
              "Se uno di questi è una foto e non un PDF, convertilo prima con [Da immagine a PDF](/imagen-a-pdf).",
              "Se un PDF ha una password, rimuovila prima con [Sbloccare PDF](/desbloquear-pdf) (devi conoscerla).",
            ] },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Unire PDF](/unir-pdf) nel browser del cellulare (Chrome, Safari, Samsung Internet o quello che usi). Tocca il riquadro per scegliere i file: puoi selezionarne diversi alla volta.",
            "Controlla l'ordine dell'elenco. Il primo file sarà l'inizio del documento finale; spostali con le frecce finché non sono nell'ordine che ti serve. Poi tocca «Unisci»: il PDF combinato si scarica con tutte le pagine.",
            { tip: "Devi cambiare l'ordine di singole pagine e non di file interi? Prima unisci, poi apri il risultato in [Riordinare pagine](/ordenar-paginas-pdf), dove puoi spostare o eliminare ogni pagina." },
          ],
        },
        {
          h2: 'Se il PDF finale pesa troppo',
          body: [
            "Molti portali della pubblica amministrazione e servizi di posta limitano la dimensione degli allegati (2 MB, 5 MB o 10 MB sono limiti comuni). Se li superi, usa [Comprimere PDF](/comprimir-pdf): il livello «Senza perdita» non tocca la qualità, mentre «Media» riduce molto di più i PDF che derivano da scansioni o foto.",
          ],
        },
        {
          h2: 'Se lo fai spesso',
          body: [
            "Il sito funziona su qualsiasi cellulare. Se usi Android e unisci documenti spesso, l'app DocuSmart fa lo stesso senza connessione e tiene i tuoi file organizzati sul telefono.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Unire PDF', text: "Apri lo strumento Unire PDF su docusmart.online dal browser del cellulare." },
        { name: 'Scegli i PDF', text: 'Tocca il riquadro e seleziona tutti i file che vuoi unire.' },
        { name: 'Mettili in ordine', text: "Sposta i file con le frecce: il primo sarà l'inizio del documento." },
        { name: 'Unisci e scarica', text: 'Tocca «Unisci» e si scarica un unico PDF con tutte le pagine.' },
      ],
      faq: [
        ['Funziona su iPhone?', "Sì. Funziona in Safari e in qualsiasi browser moderno, su iPhone e su Android. L'app senza connessione è disponibile solo per Android."],
        ['Quanti PDF posso unire?', "Non c'è un numero fisso. Il limite è la memoria del cellulare: con documenti molto grandi può volerci un po' di più."],
        ['Si perde qualità?', 'No. Le pagine vengono copiate così come sono, con testo, immagini e dimensioni originali.'],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'foto-in-pdf',
      title: 'Come trasformare foto in PDF (più foto in un unico file) | DocuSmart',
      description:
        'Converti le foto del cellulare o del computer in un PDF, una foto per pagina. Gratis, senza registrazione né caricamenti. Consigli per un file leggibile e leggero.',
      h1: 'Come trasformare foto in PDF, più foto in un unico file',
      lead: "Ti chiedono «il documento in PDF» e tu hai solo foto nella galleria. Ecco come trasformarle in un PDF ordinato, leggibile e leggero, senza installare niente.",
      sections: [
        {
          h2: 'Due strade a seconda del tipo di foto',
          body: [
            { ul: [
              "**Foto che si vedono già bene** (screenshot, immagini scaricate, foto scattate di fronte): usa [Da immagine a PDF](/imagen-a-pdf). Ogni foto diventa una pagina così com'è.",
              "**Foto di un foglio di carta** (una ricevuta, un contratto, un certificato): usa [Scansionare documento](/escanear-documento). Trova i bordi del foglio, lo raddrizza e sbianca la carta perché sembri scansionato.",
            ] },
          ],
        },
        {
          h2: 'Passo passo con Da immagine a PDF',
          body: [
            "Apri [Da immagine a PDF](/imagen-a-pdf) e scegli le immagini. Accetta JPG, PNG, WebP, BMP e GIF, e puoi mescolarli.",
            "Ordinale con le frecce: ogni immagine sarà una pagina, in quell'ordine. Tocca «Converti» ed è fatta: hai un unico PDF.",
          ],
        },
        {
          h2: 'Come scattare la foto perché si legga bene',
          body: [
            { ul: [
              "Luce uniforme, senza flash diretto: le ombre della mano o del cellulare rendono difficile la lettura.",
              "Il foglio su una superficie scura (un tavolo di legno, per esempio): così lo scanner trova meglio i bordi.",
              'Il cellulare parallelo al foglio, non inclinato.',
              'Il foglio intero nell’inquadratura, con un po’ di margine.',
            ] },
            { tip: "Con [Scansionare documento](/escanear-documento) puoi selezionare «Rendi il PDF ricercabile»: riconosce il testo in modo che si possa cercare e copiare, cosa che alcuni portali apprezzano." },
          ],
        },
        {
          h2: 'Perché non pesi troppo',
          body: [
            "Una foto di un cellulare moderno può pesare 3 o 4 MB; dieci foto fanno già un PDF pesante per un'email. Se il risultato è grande, passalo in [Comprimere PDF](/comprimir-pdf) con il livello «Media», che riduce molto le pagine fatte di foto. Puoi anche comprimere le foto prima con [Comprimere immagine](/comprimir-imagen).",
          ],
        },
        {
          h2: 'Se hai un iPhone',
          body: [
            "Quando scegli le foto da Safari, di solito l'iPhone le consegna in JPG, quindi funzionano senza fare altro. Se hai copiato le foto sul computer e compaiono come file .HEIC, quel formato per ora non si può convertire qui.",
            "Perché l'iPhone salvi le prossime foto in JPG, vai in Impostazioni › Fotocamera › Formati e scegli «Più compatibile». Per le foto che hai già, inviale al computer dall'app Foto con l'opzione di condivisione: in questo caso di solito arrivano già convertite in JPG.",
          ],
        },
        {
          h2: 'Le tue foto non escono dal dispositivo',
          body: [
            "La conversione avviene nel tuo browser: le foto non vengono caricate su nessun server. È importante quando si tratta di documenti d'identità o di informazioni sanitarie.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Da immagine a PDF', text: 'Apri lo strumento Da immagine a PDF su docusmart.online.' },
        { name: 'Scegli le foto', text: 'Seleziona le immagini (JPG, PNG, WebP, BMP o GIF).' },
        { name: 'Mettile in ordine', text: "Usa le frecce: ogni immagine sarà una pagina, in quell'ordine." },
        { name: 'Converti', text: 'Tocca «Converti» per ottenere un unico PDF.' },
      ],
      faq: [
        ['Posso mettere più foto in una sola pagina?', "Da immagine a PDF mette una foto per pagina, che è ciò che chiedono di solito le pratiche. Se te ne servono diverse in un solo foglio, uniscile prima in un'unica immagine."],
        ["Che differenza c'è con la scansione?", "Scansionare documento ritaglia il foglio, lo raddrizza e migliora il contrasto; Da immagine a PDF lascia la foto com'è. Per i documenti cartacei, la scansione dà un risultato più pulito."],
        ['Funziona senza internet?', "Una volta aperta la pagina, la conversione non ha bisogno di connessione. Se installi DocuSmart Desktop o l'app Android, funziona completamente offline."],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'ridurre-dimensione-pdf',
      title: "Come ridurre la dimensione di un PDF per email, WhatsApp o pratiche | DocuSmart",
      description:
        'Perché un PDF pesa tanto e come alleggerirlo senza perdere leggibilità. Quale livello di compressione scegliere per ogni tipo di documento. Gratis e senza caricare file.',
      h1: 'Come ridurre la dimensione di un PDF',
      lead: "«Il file supera la dimensione massima consentita.» Se ti è comparso questo messaggio su un portale o nella posta, questa guida spiega perché succede e come risolvere senza rendere il documento illeggibile.",
      sections: [
        {
          h2: 'Perché un PDF pesa tanto',
          body: [
            "Ciò che pesa di più in un PDF sono le immagini. Un documento creato con Word e solo testo pesa di solito poche centinaia di kilobyte, anche se ha molte pagine. Uno composto da foto o da uno scanner impostato ad alta risoluzione può superare facilmente i 10 MB con poche pagine.",
            "Per questo la compressione funziona in modo molto diverso a seconda del tipo di PDF: in un documento di testo c'è poco da ridurre; in una scansione, molto.",
          ],
        },
        {
          h2: 'Quale livello scegliere',
          body: [
            { ul: [
              "**Senza perdita:** ottimizza la struttura del file senza toccare la qualità. Il testo resta selezionabile. È l'opzione sicura per contratti, fatture e documenti digitali.",
              "**Media:** consigliata per scansioni e foto. Riduce molto il peso e si legge ancora bene.",
              "**Alta:** per quando il limite è molto rigido. Attenzione: con i livelli Media e Alta il testo diventa un'immagine, quindi non si può più selezionare.",
            ] },
            { tip: "Inizia con «Senza perdita». Se non basta per arrivare alla dimensione che ti serve, prova «Media». DocuSmart ti mostra di quanto si è ridotto prima che tu lo invii." },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Comprimere PDF](/comprimir-pdf), scegli il file e il livello. Tocca «Comprimi PDF»: vedrai il peso prima e dopo, e il risultato si scarica.",
            "Se il PDF era già ottimizzato e non si può ridurre ancora, DocuSmart te lo segnala e non scarica una copia uguale o più pesante.",
          ],
        },
        {
          h2: 'Se ancora non basta',
          body: [
            { ul: [
              "**Dividi il documento:** molti portali accettano più allegati. Con [Dividere PDF](/dividir-pdf) lo separi in due o più file.",
              "**Comprimi le foto prima di creare il PDF:** [Comprimere immagine](/comprimir-imagen) riduce una foto del cellulare dal 60% al 90% quasi senza differenze visibili.",
              "**Togli le pagine in più:** con [Riordinare pagine](/ordenar-paginas-pdf) elimini copertine o pagine bianche.",
            ] },
          ],
        },
        {
          h2: 'Limiti abituali',
          body: [
            "Come riferimento: Gmail consente allegati fino a 25 MB e Outlook fino a 20 MB. Molti portali della pubblica amministrazione e delle banche chiedono tra 2 e 5 MB per file. Controlla sempre il limite del sito su cui devi caricarlo.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Comprimere PDF', text: 'Apri lo strumento Comprimere PDF su docusmart.online.' },
        { name: 'Scegli il file', text: 'Seleziona il PDF che pesa troppo.' },
        { name: 'Scegli il livello', text: '«Senza perdita» per i documenti digitali; «Media» o «Alta» per scansioni e foto.' },
        { name: 'Comprimi', text: 'Tocca «Comprimi PDF», controlla di quanto si è ridotto e scarica il risultato.' },
      ],
      faq: [
        ['Comprimere rovina il documento?', "Con «Senza perdita», no: il contenuto resta identico. Con «Media» e «Alta» le pagine diventano immagini più leggere, che si leggono bene ma perdono il testo selezionabile."],
        ['Il mio PDF viene caricato su internet?', 'No. La compressione avviene nel tuo browser: il file non esce mai dal tuo dispositivo.'],
        ['Perché il mio PDF si è ridotto pochissimo?', "Probabilmente è un PDF di testo o era già ottimizzato. In questi casi il peso è già basso e c'è poco da togliere."],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'firmare-pdf-senza-stampare',
      title: 'Come firmare un PDF senza stamparlo (dal cellulare o dal PC) | DocuSmart',
      description:
        'Firma un PDF senza stamparlo né scansionarlo: disegna la firma, scrivila o usa una foto. Che valore ha una firma elettronica semplice. Gratis e privato.',
      h1: 'Come firmare un PDF senza stamparlo',
      lead: "Stampare, firmare a penna, scansionare e rimandare: quattro passaggi che puoi sostituire con uno solo. Ecco come firmare un PDF dal cellulare o dal computer.",
      sections: [
        {
          h2: 'Tre modi per creare la tua firma',
          body: [
            { ul: [
              "**Disegnarla** con il dito sul cellulare o con il mouse sul computer.",
              "**Scrivere il tuo nome**, che viene mostrato in corsivo, come scritto a mano.",
              "**Caricare una foto** della firma fatta su carta. È quella che somiglia di più alla tua firma di sempre.",
            ] },
            { tip: "Per la foto: firma con inchiostro scuro su un foglio bianco, con buona luce e senza ombre. DocuSmart rimuove lo sfondo in modo che resti solo il tratto." },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Firmare PDF](/firmar-pdf) e scegli il documento. Crea la firma in uno dei tre modi.",
            "Trascinala dove va la firma e regolane la dimensione. Se il documento richiede la sigla su ogni pagina, usa «Ripeti su tutte le pagine». Tocca «Firma PDF».",
          ],
        },
        {
          h2: 'Se bisogna anche compilare dei dati',
          body: [
            "Molti documenti da firmare sono moduli: nome, codice fiscale, data. Se il PDF ha campi compilabili, completali prima con [Compilare modulo PDF](/llenar-formulario-pdf) e poi firmalo. Prima di inviarlo, seleziona «Appiattisci il modulo» perché le risposte restino fisse.",
          ],
        },
        {
          h2: 'Errori comuni quando si firma',
          body: [
            { ul: [
              "**Firma minuscola o sgranata:** ingrandiscila finché non occupa lo spazio della riga della firma; se viene da una foto, scattala da vicino e con buona luce.",
              "**Firma sopra il testo:** spostala finché non copre dati del documento; un contratto con la firma sopra una clausola può creare dubbi.",
              "**Firmare la versione sbagliata:** controlla che sia il documento definitivo prima di firmare; correggere dopo obbliga a firmare di nuovo.",
              "**Dimenticare le altre pagine:** se il documento richiede firma o sigla su ogni foglio, usa «Ripeti su tutte le pagine» invece di procedere una per una.",
            ] },
          ],
        },
        {
          h2: 'Ha valore legale?',
          body: [
            "Quello che ottieni è una **firma elettronica semplice**: l'immagine della tua firma sul documento, l'equivalente digitale della firma a mano. Va bene per la maggior parte delle pratiche quotidiane: contratti d'affitto, deleghe, moduli aziendali o autorizzazioni scolastiche.",
            "Alcune pratiche richiedono una **firma digitale con certificato qualificato**, rilasciata da un prestatore di servizi fiduciari autorizzato; per esempio, certi atti verso la pubblica amministrazione, le gare d'appalto o la firma di documenti societari. Se la pratica la chiede esplicitamente, la firma come immagine non basta.",
          ],
        },
        {
          h2: 'La tua firma non viene salvata da nessuna parte',
          body: [
            "La firma e il documento vengono elaborati nel browser. Non vengono caricati su un server né salvati: quando chiudi la pagina, la firma si cancella. Se devi inviare il documento attraverso un canale poco affidabile, puoi aggiungere una password con [Proteggere PDF](/proteger-pdf).",
          ],
        },
      ],
      steps: [
        { name: 'Apri Firmare PDF', text: 'Apri lo strumento Firmare PDF su docusmart.online e scegli il documento.' },
        { name: 'Crea la firma', text: 'Disegnala, scrivi il tuo nome o carica una foto della tua firma su carta.' },
        { name: 'Posizionala', text: 'Trascinala al suo posto e regola la dimensione; puoi ripeterla su tutte le pagine.' },
        { name: 'Scarica', text: 'Tocca «Firma PDF» per ottenere il PDF firmato.' },
      ],
      faq: [
        ['Posso firmare dal cellulare?', 'Sì. Sul cellulare puoi disegnare la firma con il dito o fotografare la tua firma su carta.'],
        ['Il documento firmato si può modificare?', "La firma resta incorporata nella pagina. Per evitare modifiche e accessi indesiderati, puoi proteggere il PDF con una password e togliere il permesso di modifica."],
        ['Posso firmare più pagine?', 'Sì: aggiungi la firma su ogni pagina che vuoi o usa «Ripeti su tutte le pagine».'],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'scansionare-documenti-con-il-cellulare',
      title: 'Come scansionare documenti con il cellulare e salvarli in PDF | DocuSmart',
      description:
        "Scansiona documenti con la fotocamera del cellulare, senza installare app: ritaglio automatico, filtro che toglie le ombre e PDF con testo ricercabile. Consigli inclusi.",
      h1: 'Come scansionare documenti con il cellulare',
      lead: "Non ti servono uno scanner né un'app: la fotocamera del cellulare e il browser bastano per ottenere un PDF pulito, ritagliato e con il testo riconosciuto.",
      sections: [
        {
          h2: 'Cosa fa uno scanner (e perché una semplice foto non basta)',
          body: [
            "Una foto di un foglio non viene quasi mai perfetta: è un po' storta, si vede il tavolo intorno e la carta bianca appare grigia o con ombre. Uno scanner sul cellulare corregge tutto questo: trova i quattro angoli del foglio, lo raddrizza come se l'avessi fotografato dall'alto e sbianca lo sfondo.",
            "È ciò che fa [Scansionare documento](/escanear-documento), direttamente nel browser.",
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Scansionare documento](/escanear-documento) e tocca «Scatta foto»: sul cellulare si apre la fotocamera. Puoi anche scegliere foto che hai già.",
            "Controlla gli angoli trovati da DocuSmart; se uno è sbagliato, trascinalo fino alla punta del foglio. Scegli il filtro «Documento» per sbiancare la carta e togliere le ombre. Aggiungi altre pagine se il documento ha più fogli.",
            "Tocca «Crea PDF». Se selezioni «Rendi il PDF ricercabile», viene anche riconosciuto il testo, così puoi cercare parole e copiarle.",
          ],
        },
        {
          h2: 'Cinque trucchi per una scansione nitida',
          body: [
            { ul: [
              "Appoggia il foglio su una superficie scura: il contrasto aiuta a rilevare i bordi.",
              "Cerca la luce naturale o una lampada laterale; evita il flash diretto, che crea riflessi.",
              "Tieni il cellulare parallelo al foglio e aspetta che metta a fuoco.",
              "Distendi bene il foglio: le pieghe creano ombre che il filtro non sempre toglie.",
              "Per più pagine, scansionale tutte nella stessa sessione e usciranno in un unico PDF.",
            ] },
          ],
        },
        {
          h2: 'Riconoscere il testo di una scansione che hai già',
          body: [
            "Se hai già un PDF scansionato o una foto e devi copiarne il testo, usa [OCR](/ocr-pdf): riconosce il testo stampato in 12 lingue (italiano, spagnolo, inglese, francese, russo, giapponese, cinese e altre) e te lo dà da copiare, come file .txt o come PDF ricercabile. Funziona meglio con scansioni nitide e dritte; la scrittura a mano di solito viene riconosciuta male.",
          ],
        },
        {
          h2: "Privato dall'inizio alla fine",
          body: [
            "Il rilevamento dei bordi, il raddrizzamento, i filtri e il riconoscimento del testo avvengono nel tuo browser. Le foto non vengono caricate su nessun server. Se scansioni spesso, l'app DocuSmart per Android fa lo stesso senza connessione.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Scansionare documento', text: 'Apri lo strumento Scansionare documento su docusmart.online e tocca «Scatta foto».' },
        { name: 'Regola gli angoli', text: 'Controlla il ritaglio e trascina gli angoli se serve.' },
        { name: 'Scegli il filtro', text: 'Il filtro «Documento» sbianca la carta e toglie le ombre.' },
        { name: 'Salva il PDF', text: 'Tocca «Crea PDF»; seleziona «Rendi il PDF ricercabile» per riconoscere il testo.' },
      ],
      faq: [
        ["Devo installare un'app?", "No. Funziona nel browser del cellulare o del computer. L'app Android è facoltativa, per scansionare senza connessione."],
        ["Cos'è un PDF ricercabile?", "Un PDF che, oltre all'immagine, contiene il testo riconosciuto: puoi cercare parole, selezionarle e copiarle."],
        ['Cosa faccio se non trova bene i bordi?', "Trascina ogni angolo fino alla punta del foglio o usa «Tutta la foto». Aiuta se la carta contrasta con lo sfondo."],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'proteggere-pdf-con-password',
      title: 'Come proteggere un PDF con password (e quando conviene farlo) | DocuSmart',
      description:
        'Proteggi un PDF con password e crittografia AES-256, decidi se si può stampare o copiare e scopri come condividere la password in sicurezza. Gratis e senza caricare il file.',
      h1: 'Come proteggere un PDF con password',
      lead: "Un PDF con i tuoi dati personali, finanziari o sanitari che viaggia per email o in chat può finire ovunque. Mettere una password richiede un minuto ed evita che lo apra chi non dovrebbe.",
      sections: [
        {
          h2: 'Quando conviene proteggere un PDF',
          body: [
            { ul: [
              "Documenti d'identità, estratti conto, buste paga o dichiarazioni dei redditi.",
              "Cartelle cliniche, referti di esami o certificati di malattia.",
              "Contratti o proposte che non vuoi far circolare.",
              "Qualsiasi file che invii attraverso un canale che non controlli, come un'email che viene inoltrata o un gruppo di chat.",
            ] },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Proteggere PDF](/proteger-pdf) e scegli il documento. Scrivi la password due volte.",
            "Decidi cosa è consentito con il PDF aperto: stampare, copiare il testo o modificarlo. Tocca «Proteggi PDF» e si scarica la versione crittografata. Si apre con Adobe Acrobat, Chrome, Edge e l'app DocuSmart, che chiedono la password.",
          ],
        },
        {
          h2: 'Una buona password e come condividerla',
          body: [
            { ul: [
              "Usa almeno 10 caratteri; una breve frase con dei numeri è facile da ricordare e difficile da indovinare.",
              "Non usare il tuo codice fiscale né la tua data di nascita: è la prima cosa che qualcuno proverebbe.",
              "**Non inviare mai la password con lo stesso mezzo del PDF.** Se il file va per email, manda la password per messaggio o dilla al telefono.",
            ] },
            { tip: "Conserva la password in un posto sicuro. Se la dimentichi, non si può recuperare: nemmeno DocuSmart può aprire il PDF, perché la password non esce mai dal tuo dispositivo." },
          ],
        },
        {
          h2: 'Cosa protegge ogni opzione',
          body: [
            "La **password di apertura** è la vera protezione: senza di essa, il file crittografato non si può leggere. I **permessi** (stampare, copiare, modificare) sono un'altra cosa: indicano ai lettori PDF cosa devono consentire una volta aperto il documento.",
            "I programmi seri rispettano questi permessi, ma chi ha già la password può rimuoverli con alcuni strumenti. Usali per evitare copie accidentali o modifiche involontarie, non come unica barriera. Se qualcuno non deve vedere un dato, non dargli la password oppure oscura quel dato prima di inviare il file.",
          ],
        },
        {
          h2: 'Password non vuol dire oscurare',
          body: [
            "La password impedisce di aprire il file, ma chi la conosce vedrà tutto il contenuto. Se devi condividere un documento nascondendo solo alcuni dati (un IBAN, un indirizzo), usa [Oscurare PDF](/censurar-pdf): elimina davvero il testo sotto le zone coperte, invece di mettere un semplice riquadro nero sopra.",
          ],
        },
        {
          h2: 'Togliere la password in seguito',
          body: [
            "Se più avanti ti serve una copia senza protezione, [Sbloccare PDF](/desbloquear-pdf) la rimuove, purché tu conosca la password. Usalo solo con documenti tuoi o che hai il diritto di modificare.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Proteggere PDF', text: 'Apri lo strumento Proteggere PDF con password su docusmart.online e scegli il documento.' },
        { name: 'Scrivi la password', text: 'Scrivila due volte per confermarla.' },
        { name: 'Scegli i permessi', text: 'Indica se è consentito stampare, copiare o modificare.' },
        { name: 'Proteggi e scarica', text: 'Tocca «Proteggi PDF» e si scarica il documento crittografato.' },
      ],
      faq: [
        ["Quanto è sicuro?", "Usa la crittografia AES-256, lo standard più robusto per i PDF. La sicurezza reale dipende dal fatto che la password sia difficile da indovinare."],
        ['La mia password viene inviata a un server?', 'No. La crittografia avviene nel tuo browser; né il file né la password escono dal tuo dispositivo.'],
        ['Posso togliere la password al PDF di un altro?', 'Solo se conosci la password. DocuSmart non forza le password di apertura.'],
      ],
    },
  },
}
