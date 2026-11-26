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
    'dividir-pdf-en-varios-archivos': {
      slug: 'dividere-pdf-in-piu-file',
      title: 'Come dividere un PDF in più file o estrarne alcune pagine | DocuSmart',
      description:
        'Separa un PDF per pagine, per intervalli, ogni N pagine, per segnalibri o per dimensione, oppure estrai solo le pagine che ti servono. Gratis e senza caricare il file.',
      h1: 'Come dividere un PDF in più file o estrarne solo alcune pagine',
      lead: "Un portale chiede solo la pagina con la firma, oppure un PDF di 80 pagine non entra in un'e-mail. Ecco come separare un PDF in parti, o estrarne solo le pagine giuste, dal browser.",
      sections: [
        {
          h2: 'Sei modi per dividere',
          body: [
            "Prima di iniziare conviene sapere cosa ti serve, perché [Dividere PDF](/dividir-pdf) ha una modalità per ogni caso:",
            { ul: [
              "**Scegli pagine**: tocchi le miniature (o scrivi «1-3, 5») ed esce un PDF con solo quelle pagine.",
              "**Per intervalli**: più intervalli alla volta, e ognuno diventa un PDF a sé.",
              "**Ogni N pagine**: parti uguali, per esempio di 10 in 10.",
              "**Per segnalibri**: un PDF per ogni capitolo, se il documento ha i segnalibri.",
              "**Per dimensione**: parti che non superano un certo peso, per e-mail o portali con un limite.",
              "**Ogni pagina separata**: un PDF per pagina.",
            ] },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Dividere PDF](/dividir-pdf) e scegli il file. Vedrai le pagine in miniatura. In «Scegli pagine», tocca quelle che vuoi tenere: si evidenziano in blu e il campo in alto si compila da solo.",
            "Premi il pulsante in basso. Alla fine vedrai il risultato accanto all'originale per controllarlo, e lo scarichi con il nome che preferisci. Se la modalità crea più file, li scarichi uno per uno o tutti insieme in uno ZIP.",
            { tip: "Per prendere alcune pagine da più PDF e metterle in uno solo, fai prima con [Unire PDF](/unir-pdf): lì puoi scegliere quali pagine prendere da ogni file." },
          ],
        },
        {
          h2: 'Se le parti pesano ancora troppo',
          body: [
            "Dividere non cambia la qualità: ogni pagina viene copiata così com'è. Se una parte supera ancora il limite, usa la modalità **Per dimensione** o passala da [Comprimere PDF](/comprimir-pdf). Una sola pagina scansionata ad alta risoluzione può superare il limite da sola: in quel caso serve comprimerla.",
          ],
        },
        {
          h2: 'Casi frequenti',
          body: [
            { ul: [
              "Un portale chiede solo il tuo documento fronte e retro: scegli quelle due pagine e carica solo quel PDF.",
              "Un estratto conto di tutto l'anno: se ha un segnalibro per ogni mese, usa **Per segnalibri**; altrimenti, **Ogni N pagine**.",
              "Una casella e-mail con limite di 10 MB: usa **Per dimensione**, inserisci 10 e ogni parte resta sotto il limite.",
            ] },
          ],
        },
        {
          h2: 'Il tuo documento non lascia il dispositivo',
          body: [
            "La divisione avviene nel tuo browser: il PDF non viene caricato su nessun server. Per questo puoi usarla con estratti conto, cartelle cliniche o contratti senza lasciarne copie altrove.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Dividere PDF', text: 'Vai su docusmart.online/it/dividere-pdf e scegli il file.' },
        { name: 'Scegli la modalità', text: 'Scegli pagine, per intervalli, ogni N pagine, per segnalibri, per dimensione o ogni pagina separata.' },
        { name: 'Seleziona le pagine', text: 'Tocca le miniature o scrivi i numeri (per esempio 1-3, 5).' },
        { name: 'Dividi e scarica', text: 'Premi il pulsante e scarica il risultato, o tutti i file in uno ZIP.' },
      ],
      faq: [
        ['Si perde qualità dividendo?', 'No. Le pagine vengono copiate così come sono, con il testo e le immagini originali.'],
        ['Posso dividere un PDF con password?', 'Se ha solo restrizioni (si apre senza password), sì. Se chiede una password per aprirsi, toglila prima con Sbloccare PDF.'],
        ['Cosa succede ai segnalibri?', 'Con la modalità Per segnalibri, ogni capitolo dell’indice diventa un PDF con il nome del segnalibro.'],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'ruotare-pagine-pdf',
      title: 'Come ruotare le pagine di un PDF e salvarle così | DocuSmart',
      description:
        'Raddrizza le pagine scansionate di lato o capovolte: ruota una pagina o tutte, di 90° a sinistra o a destra, e salva il PDF già dritto. Gratis e senza caricarlo.',
      h1: 'Come ruotare le pagine di un PDF (e farle restare così al salvataggio)',
      lead: "Succede spesso con le scansioni: un foglio orizzontale è venuto di lato, o una pagina è uscita capovolta. Ruotarla nel visualizzatore non basta, perché quando la invii si vede di nuovo storta. Ecco come correggerla nel file.",
      sections: [
        {
          h2: 'Perché non basta ruotarlo nel visualizzatore',
          body: [
            "I visualizzatori PDF permettono di ruotare la vista, ma quella rotazione non viene salvata nel file: chi lo riceve lo vedrà di nuovo storto. Perché resti giusto bisogna cambiare l'orientamento della pagina nel PDF stesso, ed è quello che fa [Ruotare PDF](/rotar-pdf).",
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Ruotare PDF](/rotar-pdf) e scegli il file. Ogni pagina compare in miniatura con la rotazione attuale sotto (0°, 90°…). Tocca una pagina per ruotarla di 90°, oppure usa le frecce di ciascuna per girarla a sinistra o a destra. Se tutto il documento è di lato, usa «Tutte a sinistra» o «Tutte a destra».",
            "Quando tutte le pagine sono dritte, premi «Ruota PDF» e scarica il risultato. Cambia solo l'orientamento: testo, immagini e qualità restano uguali.",
            { tip: "Se in più le pagine sono in disordine (succede scansionando fronte e retro), continua con [Riordinare pagine](/ordenar-paginas-pdf)." },
          ],
        },
        {
          h2: 'Scansioni storte',
          body: [
            "La rotazione serve per fogli di lato o capovolti, a scatti di 90°. Se la foto è inclinata di qualche grado, è meglio scansionarla di nuovo con [Scansionare documento](/escanear-documento), che rileva i bordi del foglio e lo raddrizza da solo.",
          ],
        },
        {
          h2: 'Casi frequenti',
          body: [
            "Scansionando fronte e retro capita spesso che il retro esca capovolto: tocca quelle pagine due volte per ruotarle di 180°. In un report con tabelle orizzontali, ruota solo quelle pagine per leggerle senza girare la testa; le altre restano come sono.",
            "Se il PDF nasce da foto fatte col cellulare, controlla l'orientamento quando lo crei: [Da immagine a PDF](/imagen-a-pdf) ha l'orientamento Automatico, Verticale o Orizzontale, così non dovrai ruotare dopo.",
          ],
        },
        {
          h2: "Privato dall'inizio alla fine",
          body: [
            "Il PDF viene ruotato all'interno del tuo browser. Non viene caricato su nessun server e non resta salvato da nessuna parte: quando chiudi la scheda, sparisce. Funziona allo stesso modo sul computer e sul cellulare, e una volta caricata la pagina non serve un buon segnale.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Ruotare PDF', text: 'Vai su docusmart.online/it/ruotare-pdf e scegli il PDF.' },
        { name: 'Ruota le pagine', text: 'Tocca ogni pagina di lato, oppure usa Tutte a sinistra o Tutte a destra.' },
        { name: 'Salva', text: 'Premi Ruota PDF e scarica il file già dritto.' },
      ],
      faq: [
        ['Posso ruotare una sola pagina?', 'Sì. Ogni pagina si ruota separatamente; le altre restano com’erano.'],
        ['Si perde qualità?', 'No. Cambia solo l’orientamento della pagina; il contenuto non viene ricompresso.'],
        ['Funziona sul cellulare?', 'Sì, in qualsiasi browser moderno, su Android e su iPhone.'],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'cambiare-ordine-pagine-pdf',
      title: "Come cambiare l'ordine delle pagine di un PDF | DocuSmart",
      description:
        'Sposta le pagine di un PDF trascinandole, duplicane una, aggiungi pagine vuote o togli quelle in più, e salva il nuovo ordine. Gratis e senza caricare il file.',
      h1: "Come cambiare l'ordine delle pagine di un PDF",
      lead: "Una scansione fronte e retro uscita mescolata, un allegato che doveva stare all'inizio o una pagina ripetuta: ecco come riordinare un PDF pagina per pagina.",
      sections: [
        {
          h2: 'Cosa puoi fare con ogni pagina',
          body: [
            "In [Riordinare pagine](/ordenar-paginas-pdf) ogni pagina è una scheda, e con ciascuna puoi:",
            { ul: [
              "**Spostarla**: trascinandola al suo posto, o con le frecce prima e dopo (più comode sul cellulare).",
              "**Duplicarla**: per esempio, per ripetere una copertina o una pagina delle firme.",
              "**Aggiungere una pagina vuota** dopo di essa, per lasciare spazio o separare le sezioni.",
              "**Rimuoverla** se è di troppo.",
            ] },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Riordinare pagine](/ordenar-paginas-pdf) e scegli il PDF. Sposta le pagine finché non sono come ti servono: il numero di ogni scheda («Pag. 2», «Pag. 1»…) ti ricorda da dove veniva, così non ti perdi.",
            "Quando l'ordine è giusto, premi «Applica nuovo ordine» e scarica il PDF. Le pagine vengono copiate così come sono: non cambiano né il testo né la qualità.",
            { tip: "Se le pagine da riordinare sono in più file, prima uniscili con [Unire PDF](/unir-pdf) e poi riordinali qui." },
          ],
        },
        {
          h2: 'Per togliere pagine, meglio dividere',
          body: [
            "Se vuoi tenere solo alcune pagine, [Dividere PDF](/dividir-pdf) è più rapido: selezioni quelle da tenere e hai finito. Riordinare serve quando il documento resta completo, ma in un altro ordine.",
          ],
        },
        {
          h2: 'Casi frequenti',
          body: [
            "Scansionando fronte e retro con un dispositivo che non lo fa da solo, escono prima tutti i fronti e poi tutti i retro. Per alternarli, sposta l'ultima pagina dopo la prima, la penultima dopo la terza e così via fino alla fine: con le frecce si fa in fretta.",
            { ul: [
              "Un allegato che doveva stare all'inizio: spostalo prima della prima pagina.",
              "Una pagina delle firme che va in due punti: duplicala e porta la copia dove serve.",
              "Capitoli che devono iniziare su una pagina dispari nella stampa fronte e retro: aggiungi una pagina vuota prima.",
            ] },
          ],
        },
        {
          h2: 'Senza caricare i tuoi file',
          body: [
            "Il nuovo ordine viene composto nel tuo browser. Il documento non viaggia su internet e non ne resta copia su nessun server. Per questo puoi riordinare con tranquillità pratiche, cartelle cliniche o documenti di lavoro che non dovrebbero uscire dal tuo dispositivo.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Riordinare pagine', text: 'Vai su docusmart.online/it/riordinare-pagine-pdf e scegli il PDF.' },
        { name: 'Sposta le pagine', text: 'Trascinale o usa le frecce; duplica, aggiungi pagine vuote o togli quelle in più.' },
        { name: 'Applica e scarica', text: 'Premi Applica nuovo ordine e scarica il PDF riordinato.' },
      ],
      faq: [
        ['Posso riordinare dal cellulare?', 'Sì. Oltre a trascinare, ogni pagina ha delle frecce per spostarla prima o dopo, più facili da usare con il dito.'],
        ['Link e moduli vengono mantenuti?', 'Le pagine vengono copiate con il loro contenuto; controlla il risultato se il documento ha moduli complessi.'],
        ["C'è un limite di pagine?", 'Non c’è un numero fisso; con documenti molto grandi la visualizzazione delle miniature può richiedere un po’ più di tempo.'],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'aggiungere-numeri-di-pagina-pdf',
      title: 'Come aggiungere i numeri di pagina a un PDF | DocuSmart',
      description:
        'Numera le pagine di un PDF: posizione, formato «1», «1 / 10» o «Pagina 1 di 10», da che numero partire e copertina senza numero. Gratis e senza caricarlo.',
      h1: 'Come aggiungere i numeri di pagina a un PDF',
      lead: "Una tesi, un report o una pratica si revisionano molto meglio con le pagine numerate. Ecco come numerare un PDF che non ha numeri, con il formato che ti chiedono.",
      sections: [
        {
          h2: 'Passo passo',
          body: [
            "Apri [Numerare pagine PDF](/numerar-paginas-pdf) e scegli il PDF. Scegli dove va il numero (in alto o in basso, a sinistra, al centro o a destra) e il formato: «1», «1 / 10» o «Pagina 1 di 10».",
            "Premi «Numera pagine». Vedrai il prima e il dopo affiancati, pagina per pagina, per controllare che il numero non copra nulla. Poi lo scarichi.",
          ],
        },
        {
          h2: 'Opzioni che risolvono i casi comuni',
          body: [
            { ul: [
              "**Senza numero sulle prime**: metti 1 per non numerare la copertina, o di più se ci sono un indice o una dedica.",
              "**Inizia da**: per far proseguire la numerazione di un altro documento, per esempio dalla 25.",
              "**Testo** personalizzato: scrivi per esempio «Foglio {n}» o «{n} di {total}»; {n} è il numero della pagina e {total} l’ultimo.",
              "**Dimensione** e **Colore**: piccola, media o grande, e il colore che vuoi.",
            ] },
            { tip: "Se il documento è diviso in più file, uniscili prima con [Unire PDF](/unir-pdf) perché la numerazione sia continua." },
          ],
        },
        {
          h2: 'Che il numero non copra il contenuto',
          body: [
            "Molti documenti hanno già qualcosa nel piè di pagina (un logo, un indirizzo). Se il numero ci finisce sopra, cambialo d'angolo o spostalo in alto: il prima e il dopo ti mostrano ogni pagina prima di scaricare, e puoi passare dall'una all'altra con le frecce.",
          ],
        },
        {
          h2: 'Numera alla fine',
          body: [
            "Il numero viene disegnato su ogni pagina. Se dopo riordini o aggiungi pagine, i numeri si spostano con loro e non sono più consecutivi. Per questo conviene numerare alla fine: prima unisci, riordina e togli ciò che è di troppo, poi numera la versione definitiva.",
            "Nei documenti per enti o pratiche, dove si parla di fogli, scrivi «Foglio {n}» nel testo. E se il documento continua la numerazione di un altro, regola «Inizia da».",
          ],
        },
        {
          h2: 'Tutto nel tuo browser',
          body: [
            "La numerazione viene aggiunta sul tuo dispositivo: il PDF non viene caricato su nessun server. Il testo del documento resta testo: si può cercare e copiare come prima, e anche il numero resta come testo, nitido in stampa.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Numerare pagine PDF', text: 'Vai su docusmart.online/it/numerare-pagine-pdf e scegli il PDF.' },
        { name: 'Scegli posizione e formato', text: 'Per esempio, in basso a destra e «Pagina 1 di 10».' },
        { name: 'Regola ciò che serve', text: 'Copertina senza numero, da che numero iniziare, dimensione e colore.' },
        { name: 'Numera e scarica', text: 'Controlla il prima e il dopo e scarica il PDF numerato.' },
      ],
      faq: [
        ['Posso non numerare la copertina?', 'Sì. In «Senza numero sulle prime» metti 1 (o le pagine che vuoi saltare).'],
        ['Posso iniziare da un altro numero?', 'Sì. In «Inizia da» inserisci il primo numero, per esempio 25.'],
        ['Si può scrivere «Foglio» prima del numero?', 'Sì. Nel testo scrivi «Foglio {n}» e ogni pagina mostrerà il suo numero al posto di {n}.'],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'aggiungere-filigrana-pdf',
      title: 'Come aggiungere una filigrana a un PDF (testo o logo) | DocuSmart',
      description:
        'Aggiungi «RISERVATO», «COPIA» o il tuo logo a un PDF: posizione, mosaico, angolo, dimensione, opacità e pagine. Gratis, nel browser e senza caricare il file.',
      h1: 'Come aggiungere una filigrana a un PDF (testo o logo)',
      lead: "Per inviare una proposta come bozza, segnare una copia della tua carta d'identità «Solo per la pratica X» o mettere il tuo logo su un catalogo: ecco come aggiungere una filigrana a un PDF.",
      sections: [
        {
          h2: 'Passo passo',
          body: [
            "Apri [Filigrana PDF](/marca-de-agua-pdf) e scegli il PDF. Scrivi il testo (c'è «RISERVATO» come esempio) oppure passa a «Immagine o logo» per usare il tuo.",
            "Premi «Applica filigrana»: vedrai il prima e il dopo affiancati. Se vuoi cambiare qualcosa, regolala e applicala di nuovo; quando ti piace, scaricala.",
          ],
        },
        {
          h2: 'Come regolarla',
          body: [
            { ul: [
              "**Posizione**: al centro, in un angolo o su un bordo, oppure a **mosaico** perché si ripeta su tutta la pagina.",
              "**Rotazione**: 0°, 45°, 90° o −45°. La diagonale è la più classica e la più difficile da ritagliare via.",
              "**Dimensione, opacità e colore**: un'opacità bassa (20%) lascia leggere il documento; più alta la rende più visibile.",
              "**Sopra o dietro il contenuto**: dietro risulta più discreta nei documenti con molto testo.",
              "**Pagine**: tutte, o solo alcune (per esempio 1-3, 5).",
            ] },
          ],
        },
        {
          h2: 'Una filigrana per le copie dei documenti',
          body: [
            "Se ti chiedono una copia della carta d'identità o di un estratto conto, aggiungi a mosaico una scritta come «Solo per la pratica d'affitto, gennaio 2026». Così, se la copia finisce altrove, si capisce per cosa l'avevi consegnata.",
            { tip: "Se vuoi anche che non si possa aprire senza password, passala poi da [Proteggere PDF](/proteger-pdf)." },
          ],
        },
        {
          h2: 'Idee per il testo',
          body: [
            { ul: [
              "«BOZZA» per le versioni non ancora definitive.",
              "«COPIA» o «COPIA CONTROLLATA» per i documenti che vengono distribuiti.",
              "«Solo per [pratica] — [data]» sulle copie dei documenti d'identità.",
              "«FACSIMILE» su cataloghi, modelli o lavori non ancora pagati.",
            ] },
            "Perché la filigrana si legga senza disturbare il documento, un'opacità tra il 15% e il 30% di solito funziona bene. A mosaico, una dimensione piccola o media risulta più pulita. Prima di scaricare, controlla più pagine nel prima e dopo.",
          ],
        },
        {
          h2: 'Senza caricare il documento',
          body: [
            "La filigrana viene aggiunta all'interno del tuo browser. Il PDF non viene caricato su nessun server, cosa importante proprio con i documenti che hanno bisogno di una filigrana: copie di documenti d'identità, proposte commerciali o documenti interni.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Filigrana PDF', text: 'Vai su docusmart.online/it/filigrana-pdf e scegli il PDF.' },
        { name: 'Scrivi il testo o scegli il logo', text: 'Per esempio «RISERVATO» o «COPIA».' },
        { name: 'Regola posizione e stile', text: 'Centro o mosaico, angolo, dimensione, opacità, colore e pagine.' },
        { name: 'Applica e scarica', text: 'Controlla il prima e il dopo e scarica il PDF.' },
      ],
      faq: [
        ['Posso usare il mio logo?', 'Sì. Scegli «Immagine o logo» e carica un’immagine; un PNG con sfondo trasparente viene meglio.'],
        ['Si può togliere dopo?', 'Resta disegnata nel PDF. Conserva l’originale senza filigrana nel caso ti serva di nuovo.'],
        ['Posso metterla solo su alcune pagine?', 'Sì. In «Pagine» scrivi quali, per esempio 1-3, 5.'],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'modificare-pdf-senza-programmi',
      title: 'Come modificare un PDF senza installare programmi | DocuSmart',
      description:
        'Aggiungi o sostituisci testo, evidenzia, copri, disegna, inserisci frecce, immagini e link in un PDF dal browser, senza installare nulla e senza caricare il file.',
      h1: 'Come modificare un PDF senza installare programmi',
      lead: "Correggere una data, completare un dato mancante, evidenziare una clausola o barrare qualcosa: non serve un programma a pagamento. Ecco come modificare un PDF nel browser.",
      sections: [
        {
          h2: "Gli strumenti dell'editor",
          body: [
            "Sopra la pagina c'è una barra con tutto quello che puoi aggiungere in [Modificare PDF](/editar-pdf):",
            { ul: [
              "**Testo**: tocchi la pagina dove vuoi scrivere e scrivi nel riquadro in basso; scegli carattere, dimensione, grassetto e colore.",
              "**Sostituisci**: tocchi un testo già presente nel PDF e lo cambi; l'originale viene cancellato dal documento, non solo coperto.",
              "**Rettangolo, Cerchio, Evidenzia e Copri**: per segnare, sottolineare o coprire di bianco.",
              "**Disegna, Linea e Freccia**: per indicare qualcosa o prendere appunti a mano.",
              "**Immagine e Link**: per incollare un timbro o un logo, o collegare un sito web o un'altra pagina del PDF.",
            ] },
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Modificare PDF](/editar-pdf) e scegli il file. Scegli «Testo» nella barra e tocca la pagina dove va: compare un riquadro che puoi spostare, e scrivi nel pannello in basso. Con «Seleziona» tocchi qualsiasi elemento per spostarlo, ridimensionarlo o toglierlo.",
            "Se sbagli, usa «Annulla». Quando hai finito, premi «Applica modifiche» e scarica il PDF modificato.",
            { tip: "Il testo accetta qualsiasi alfabeto (latino, cirillico, greco, cinese, giapponese o coreano). Le emoji non vengono salvate nel PDF." },
          ],
        },
        {
          h2: 'Per firmare o compilare moduli ci sono strumenti appositi',
          body: [
            "Se devi firmare, [Firmare PDF](/firmar-pdf) ti permette di disegnare, scrivere o caricare la tua firma e metterla dove serve. E se il PDF ha campi da compilare, [Compilare modulo PDF](/llenar-formulario-pdf) te li mostra uno per uno, più comodo che scriverci sopra.",
          ],
        },
        {
          h2: 'Consigli perché la modifica non si noti',
          body: [
            "Per correggere un testo già presente nel documento, usa **Sostituisci**: cancella l'originale e mette il nuovo al suo posto. Se lo copri solo con un riquadro bianco, il vecchio testo resta nel file.",
            "Scegli il carattere più simile a quello del documento (Sans, Serif o Mono) e regola la dimensione finché non coincide. Sul cellulare, sposta gli elementi con calma: puoi anche cambiarne la posizione dalla tastiera con le frecce.",
          ],
        },
        {
          h2: 'Il tuo file resta con te',
          body: [
            "Tutto l'editor funziona all'interno del tuo browser: il PDF non viene caricato su nessun server, né mentre lo modifichi né quando lo salvi.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Modificare PDF', text: 'Vai su docusmart.online/it/modificare-pdf e scegli il file.' },
        { name: 'Scegli cosa aggiungere', text: 'Testo, sostituzione, forme, evidenziazione, disegno, frecce, immagine o link.' },
        { name: 'Posizionalo sulla pagina', text: 'Tocca la pagina, scrivi o disegna, e spostalo con Seleziona.' },
        { name: 'Applica e scarica', text: 'Premi Applica modifiche e scarica il PDF modificato.' },
      ],
      faq: [
        ['Posso cambiare un testo già presente nel PDF?', 'Sì, con «Sostituisci»: tocchi il testo, scrivi quello nuovo e l’originale viene cancellato dal documento.'],
        ['Funziona con i PDF scansionati?', 'Puoi aggiungere testo, forme e disegni sopra. Per sostituire il testo, il PDF deve contenere testo vero; se è una foto, passalo prima dall’OCR.'],
        ['Devo installare qualcosa?', 'No. Funziona nel browser del computer o del cellulare.'],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'confrontare-due-versioni-pdf',
      title: 'Come confrontare due versioni di un PDF e vedere cosa è cambiato | DocuSmart',
      description:
        'Confronta due PDF e guarda quali parole sono state aggiunte o tolte, oppure pagina per pagina per vedere i cambi in immagini e layout. Gratis e senza caricarli.',
      h1: 'Come confrontare due versioni di un PDF e vedere cosa è cambiato',
      lead: "Ti restituiscono un contratto «con qualche ritocco» senza dire quali. Rileggerlo due volte a caccia di differenze è lento e qualcosa sfugge. Ecco come confrontare due versioni in pochi secondi.",
      sections: [
        {
          h2: 'Passo passo',
          body: [
            "Apri [Confrontare PDF](/comparar-pdf). Scegli prima l'**Originale** e poi la **Nuova versione**. Se li hai messi al contrario, il pulsante «Scambia» li inverte.",
            "Premi «Confronta». In alto vedrai quante parole sono state aggiunte e quante tolte, e sotto ogni modifica con la sua pagina: ciò che è stato tolto barrato in rosso e ciò che è stato aggiunto in verde, con qualche riga di contesto per ritrovarlo.",
          ],
        },
        {
          h2: 'Testo o visivo',
          body: [
            { ul: [
              "**Testo**: confronta le parole. È l'ideale per contratti, lettere e report. Puoi ignorare maiuscole e punteggiatura perché non contino come modifiche.",
              "**Visivo (pagina per pagina)**: confronta come appare ogni pagina. Serve per planimetrie, grafiche o documenti scansionati, dove le modifiche possono riguardare immagini o tabelle e non solo il testo.",
            ] },
            { tip: "In un contratto, controlla soprattutto le modifiche a importi, date e nomi: il confronto le mostra anche quando cambia una sola cifra." },
          ],
        },
        {
          h2: 'Dopo il confronto',
          body: [
            "Se hai trovato qualcosa da correggere, puoi farlo con [Modificare PDF](/editar-pdf). E quando le due parti sono d'accordo, firma la versione finale con [Firmare PDF](/firmar-pdf).",
          ],
        },
        {
          h2: 'Cosa mostra e cosa no',
          body: [
            "Ogni modifica compare con il suo numero di pagina e le righe intorno, per ritrovarla subito nel documento. Se un paragrafo intero è stato spostato senza cambiare, viene segnato come spostato invece di essere contato come tolto e aggiunto.",
            "Se i due file non hanno quasi nulla in comune (per esempio hai scelto il documento sbagliato), lo strumento te lo segnala invece di mostrare centinaia di modifiche. E se sono identici te lo dice, anche quando hanno un numero di pagine diverso.",
            "Serve per contratti, preventivi, regolamenti, proposte che passano per più mani o la tesi che torna con le correzioni del relatore: in tutti questi casi, sapere esattamente cosa è cambiato ti risparmia una rilettura completa.",
          ],
        },
        {
          h2: 'I tuoi documenti non vengono caricati',
          body: [
            "I due PDF vengono confrontati nel tuo browser: nessuno viene caricato su un server. Puoi usarlo con tranquillità con contratti e documenti riservati, perché nessuna delle due versioni resta salvata altrove.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Confrontare PDF', text: 'Vai su docusmart.online/it/confrontare-pdf.' },
        { name: 'Scegli i due file', text: 'Prima l’originale e poi la nuova versione.' },
        { name: 'Scegli come confrontare', text: 'Testo (parole) o Visivo (pagina per pagina).' },
        { name: 'Controlla le modifiche', text: 'Ciò che è stato tolto appare barrato in rosso e ciò che è stato aggiunto in verde, con la sua pagina.' },
      ],
      faq: [
        ['Confronta anche PDF scansionati?', 'In modalità Visivo sì, perché confronta come appare ogni pagina. La modalità Testo richiede che il PDF contenga testo vero.'],
        ["L'ordine dei file conta?", 'Sì: ciò che c’è nella nuova versione e non nell’originale appare come aggiunto. Se hai sbagliato, usa Scambia.'],
        ['Si può ignorare una maiuscola o una virgola cambiata?', 'Sì. Seleziona «Ignora maiuscole» o «Ignora punteggiatura».'],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'oscurare-dati-personali-pdf',
      title: 'Come oscurare i dati personali in un PDF (davvero) | DocuSmart',
      description:
        'Oscura numeri di documento, conti, e-mail o nomi in un PDF: cercali e selezionali su tutte le pagine e vengono eliminati dal file, non solo coperti.',
      h1: 'Come oscurare i dati personali in un PDF (davvero)',
      lead: "Prima di condividere un estratto conto, un contratto o una cartella clinica, spesso bisogna nascondere numeri di conto o di documento. Mettere un riquadro nero sopra non basta: ecco come farlo bene.",
      sections: [
        {
          h2: 'Perché un riquadro nero non basta',
          body: [
            "Se in un editor qualunque metti un rettangolo nero sopra un numero, il numero resta nel file: basta selezionarlo e copiarlo, o aprire il PDF con un altro programma, per leggerlo. Oscurare davvero significa **eliminare** ciò che c'è sotto, ed è quello che fa [Oscurare PDF](/censurar-pdf).",
          ],
        },
        {
          h2: 'Passo passo',
          body: [
            "Apri [Oscurare PDF](/censurar-pdf) e scegli il file. Puoi cercare un nome, un numero o una parola e viene selezionato su tutte le pagine in una volta. Puoi anche selezionare in un colpo tutti gli **Indirizzi e-mail** o tutti i **Numeri** (documenti, telefoni, conti), oppure trascinare sulla pagina per coprire a mano una zona.",
            "Controlla ogni pagina: toccando una zona la sposti o la togli. Quando è tutto pronto, premi «Oscura PDF» e scarica il risultato.",
            { tip: "Le pagine con zone selezionate vengono convertite in immagine perché ciò che è coperto sparisca dal file. Il resto del testo di quelle pagine si può ancora cercare e copiare." },
          ],
        },
        {
          h2: 'Controlla prima di inviare',
          body: [
            "La ricerca trova ciò che è scritto come testo. Se una parte del documento è una foto o una scansione, i dati che compaiono lì non escono nella ricerca: selezionali a mano trascinando sulla pagina. E conserva l'originale a parte, perché ciò che è oscurato non si può recuperare.",
            "Se il documento resterà in mano ad altri, puoi anche aggiungere una password con [Proteggere PDF](/proteger-pdf) o una [filigrana](/marca-de-agua-pdf) che dica per cosa l'hai consegnato.",
          ],
        },
        {
          h2: 'Cosa di solito va oscurato',
          body: [
            { ul: [
              "Numeri dei documenti d'identità e dei conti bancari.",
              "Indirizzi, telefoni ed e-mail.",
              "Firme e foto dei documenti.",
              "Dati sanitari, stipendi o informazioni di terzi.",
            ] },
          ],
        },
        {
          h2: 'Senza caricare il documento',
          body: [
            "Tutto il processo avviene nel tuo browser: il documento con i dati in chiaro non esce mai dal tuo dispositivo. È proprio ciò che serve quando si oscura: se caricassi l'originale su un servizio online per coprirlo, i dati sarebbero già usciti dalle tue mani.",
          ],
        },
      ],
      steps: [
        { name: 'Apri Oscurare PDF', text: 'Vai su docusmart.online/it/oscurare-pdf e scegli il file.' },
        { name: 'Seleziona ciò che va nascosto', text: 'Cerca un testo, seleziona tutte le e-mail o i numeri, o trascina sulla pagina.' },
        { name: 'Controlla ogni pagina', text: 'Tocca una zona per spostarla o toglierla.' },
        { name: 'Oscura e scarica', text: 'Premi Oscura PDF: ciò che è coperto viene eliminato dal file.' },
      ],
      faq: [
        ['Si può recuperare ciò che è stato oscurato?', 'No. Ciò che copri viene eliminato dal file; per questo conviene conservare l’originale a parte.'],
        ['Funziona con i PDF scansionati?', 'Sì, selezionando le zone a mano. La ricerca automatica trova solo ciò che è scritto come testo.'],
        ['Nel resto del documento si può ancora cercare?', 'Sì. Solo le pagine con zone selezionate vengono convertite in immagine, e il loro testo restante si conserva per cercarlo e copiarlo.'],
      ],
    },
  },
}
