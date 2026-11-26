// Traducción al francés de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: 'Guides',
    guidesSlug: 'guides',
    indexTitle: 'Guides PDF pas à pas : fusionner, signer, scanner | DocuSmart',
    indexDescription:
      "Des guides courts et pratiques pour fusionner, compresser, signer, scanner et protéger vos PDF sur téléphone ou ordinateur, sans envoyer vos fichiers.",
    indexH1: 'Guides pas à pas',
    indexLead: "Des guides pratiques qui vous accompagnent du début à la fin dans les tâches courantes sur vos documents. Tous les outils utilisés fonctionnent dans votre navigateur : vos fichiers restent sur votre appareil.",
    minutes: '{n} min de lecture',
    updated: 'Mis à jour le {date}',
    summary: 'En bref',
    toolsTitle: 'Outils utilisés dans ce guide',
    moreGuides: 'Plus de guides',
    related: 'Guides associés',
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'fusionner-pdf-sur-mobile',
      title: 'Comment fusionner des PDF sur mobile sans envoyer vos fichiers | DocuSmart',
      description:
        "Guide pas à pas pour réunir plusieurs PDF en un seul sur votre téléphone, gratuitement et sans envoi sur un serveur. Fonctionne sur Android et iPhone, dans le navigateur.",
      h1: 'Comment fusionner des PDF sur mobile sans envoyer vos fichiers',
      lead: "Réunir sa carte d'identité, un justificatif de domicile et un formulaire dans un seul PDF fait partie des tâches les plus courantes d'une démarche en ligne. Voici comment le faire depuis votre téléphone, en une minute, sans confier vos documents au serveur de quelqu'un d'autre.",
      sections: [
        {
          h2: "Pourquoi il vaut mieux ne pas envoyer vos fichiers",
          body: [
            "La plupart des sites qui fusionnent des PDF reçoivent vos documents sur leurs serveurs, les traitent là-bas et vous renvoient le résultat. Pour un menu de restaurant, peu importe ; pour une carte d'identité, un relevé bancaire ou un dossier médical, c'est autre chose : vous ne savez ni combien de temps ils sont conservés, ni qui peut les consulter.",
            "DocuSmart fait la fusion directement dans le navigateur de votre téléphone. Le fichier ne circule jamais sur internet, il n'en existe donc aucune copie sur un serveur. C'est aussi pour cela que ça fonctionne même avec un mauvais réseau, une fois la page chargée.",
          ],
        },
        {
          h2: 'Avant de commencer',
          body: [
            { ul: [
              "Enregistrez les PDF sur votre téléphone (dans Téléchargements, dans l'app Fichiers ou dans votre cloud).",
              "Si l'un d'eux est une photo et non un PDF, convertissez-le d'abord avec [Image en PDF](/imagen-a-pdf).",
              "Si un PDF est protégé par un mot de passe, retirez-le avant avec [Déverrouiller un PDF](/desbloquear-pdf) (vous devez le connaître).",
            ] },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Fusionner des PDF](/unir-pdf) dans le navigateur de votre téléphone (Chrome, Safari, Samsung Internet ou celui que vous utilisez). Touchez le cadre pour choisir les fichiers : vous pouvez en sélectionner plusieurs à la fois.",
            "Vérifiez l'ordre de la liste. Le premier fichier sera le début du document final ; déplacez-les avec les flèches jusqu'à obtenir l'ordre voulu. Touchez ensuite « Fusionner » : le PDF combiné se télécharge avec toutes les pages.",
            { tip: "Besoin de changer l'ordre de certaines pages, et pas de fichiers entiers ? Fusionnez d'abord, puis ouvrez le résultat dans [Organiser les pages](/ordenar-paginas-pdf), où vous pouvez déplacer ou supprimer chaque page." },
          ],
        },
        {
          h2: 'Si le PDF final est trop lourd',
          body: [
            "Beaucoup de portails administratifs et de messageries limitent la taille des pièces jointes (2 Mo, 5 Mo ou 10 Mo sont des limites courantes). Si vous dépassez, utilisez [Compresser un PDF](/comprimir-pdf) : le niveau « Sans perte » ne touche pas à la qualité, et « Moyen » réduit beaucoup plus les PDF issus de scans ou de photos.",
          ],
        },
        {
          h2: 'Si vous le faites souvent',
          body: [
            "Le site fonctionne sur n'importe quel téléphone. Si vous êtes sur Android et fusionnez souvent des documents, l'app DocuSmart fait la même chose hors connexion et garde vos fichiers bien rangés sur le téléphone.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Fusionner des PDF', text: "Ouvrez l'outil Fusionner des PDF sur docusmart.online depuis le navigateur de votre téléphone." },
        { name: 'Choisissez les PDF', text: 'Touchez le cadre et sélectionnez tous les fichiers à réunir.' },
        { name: 'Mettez-les dans l’ordre', text: 'Déplacez les fichiers avec les flèches : le premier sera le début du document.' },
        { name: 'Fusionnez et téléchargez', text: 'Touchez « Fusionner » et un seul PDF avec toutes les pages se télécharge.' },
      ],
      faq: [
        ["Ça fonctionne sur iPhone ?", "Oui. Ça fonctionne dans Safari et dans tout navigateur récent, sur iPhone comme sur Android. L'app hors connexion n'existe que pour Android."],
        ['Combien de PDF puis-je fusionner ?', "Il n'y a pas de nombre fixe. La limite, c'est la mémoire du téléphone : avec de très gros documents, cela peut prendre un peu plus de temps."],
        ['Est-ce que je perds en qualité ?', "Non. Les pages sont copiées telles quelles, avec leur texte, leurs images et leur format d'origine."],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'photos-en-pdf',
      title: 'Comment transformer des photos en PDF (plusieurs dans un seul fichier) | DocuSmart',
      description:
        "Convertissez les photos de votre téléphone ou de votre ordinateur en PDF, une photo par page. Gratuit, sans inscription ni envoi. Conseils pour un fichier lisible et léger.",
      h1: 'Comment transformer des photos en PDF, plusieurs dans un seul fichier',
      lead: "On vous demande « le document en PDF » et vous n'avez que des photos dans la galerie. Voici comment en faire un PDF ordonné, lisible et léger, sans rien installer.",
      sections: [
        {
          h2: 'Deux méthodes selon le type de photo',
          body: [
            { ul: [
              "**Les photos déjà nettes** (captures d'écran, images téléchargées, photos prises bien de face) : utilisez [Image en PDF](/imagen-a-pdf). Chaque photo devient une page telle quelle.",
              "**Les photos d'une feuille de papier** (un reçu, un contrat, une attestation) : utilisez [Scanner un document](/escanear-documento). L'outil repère les bords de la feuille, la redresse et blanchit le papier pour qu'elle ait l'air scannée.",
            ] },
          ],
        },
        {
          h2: 'Pas à pas avec Image en PDF',
          body: [
            "Ouvrez [Image en PDF](/imagen-a-pdf) et choisissez vos images. Les formats JPG, PNG, WebP, BMP et GIF sont acceptés, et vous pouvez les mélanger.",
            "Mettez-les dans l'ordre avec les flèches : chaque image deviendra une page, dans cet ordre. Touchez « Convertir » et c'est fini : vous avez un seul PDF.",
          ],
        },
        {
          h2: 'Comment prendre une photo bien lisible',
          body: [
            { ul: [
              "Une lumière homogène, sans flash direct : les ombres de votre main ou du téléphone gênent la lecture.",
              "La feuille posée sur une surface sombre (une table en bois, par exemple) : le scanner en repère mieux les bords.",
              'Le téléphone parallèle à la feuille, pas incliné.',
              "La feuille entière dans le cadre, avec un peu de marge.",
            ] },
            { tip: "Dans [Scanner un document](/escanear-documento), vous pouvez cocher « Rendre le PDF consultable » : le texte est reconnu pour pouvoir être recherché et copié, ce que certains portails apprécient." },
          ],
        },
        {
          h2: 'Pour que le fichier ne soit pas trop lourd',
          body: [
            "Une photo prise avec un téléphone récent peut peser 3 ou 4 Mo ; dix photos font déjà un PDF lourd pour un e-mail. Si le résultat est gros, passez-le dans [Compresser un PDF](/comprimir-pdf) au niveau « Moyen », qui réduit fortement les pages composées de photos. Vous pouvez aussi compresser les photos avant avec [Compresser une image](/comprimir-imagen).",
          ],
        },
        {
          h2: 'Si vous avez un iPhone',
          body: [
            "Quand vous choisissez des photos depuis Safari, l'iPhone les fournit généralement en JPG : elles fonctionnent sans rien faire de plus. Si vous avez copié les photos sur votre ordinateur et qu'elles apparaissent en fichiers .HEIC, ce format ne peut pas encore être converti ici.",
            "Pour que l'iPhone enregistre vos prochaines photos en JPG, allez dans Réglages › Appareil photo › Formats et choisissez « Le plus compatible ». Pour les photos que vous avez déjà, envoyez-les à votre ordinateur depuis l'app Photos avec l'option de partage : elles arrivent alors généralement converties en JPG.",
          ],
        },
        {
          h2: 'Vos photos ne quittent pas votre appareil',
          body: [
            "La conversion se fait dans votre navigateur : les photos ne sont envoyées sur aucun serveur. C'est important quand il s'agit de pièces d'identité ou d'informations de santé.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Image en PDF', text: "Ouvrez l'outil Image en PDF sur docusmart.online." },
        { name: 'Choisissez les photos', text: 'Sélectionnez les images (JPG, PNG, WebP, BMP ou GIF).' },
        { name: 'Mettez-les dans l’ordre', text: 'Utilisez les flèches : chaque image deviendra une page, dans cet ordre.' },
        { name: 'Convertissez', text: 'Touchez « Convertir » pour obtenir un seul PDF.' },
      ],
      faq: [
        ['Puis-je mettre plusieurs photos sur une seule page ?', "Image en PDF met une photo par page, ce que demandent en général les démarches administratives. S'il vous en faut plusieurs sur une même feuille, assemblez-les d'abord en une seule image."],
        ['Quelle différence avec la numérisation ?', "Scanner un document recadre la feuille, la redresse et améliore le contraste ; Image en PDF garde la photo telle quelle. Pour des documents papier, la numérisation donne un résultat plus net."],
        ['Ça fonctionne sans internet ?', "Une fois la page ouverte, la conversion n'a pas besoin de connexion. Si vous installez DocuSmart Desktop ou l'app Android, tout fonctionne entièrement hors connexion."],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'reduire-taille-pdf',
      title: "Comment réduire la taille d'un PDF pour un e-mail, WhatsApp ou une démarche | DocuSmart",
      description:
        "Pourquoi un PDF est si lourd et comment l'alléger sans perdre en lisibilité. Quel niveau de compression choisir selon le document. Gratuit et sans envoyer vos fichiers.",
      h1: "Comment réduire la taille d'un PDF",
      lead: "« Le fichier dépasse la taille maximale autorisée. » Si ce message s'est affiché sur un portail ou dans votre messagerie, ce guide explique pourquoi et comment y remédier sans rendre le document illisible.",
      sections: [
        {
          h2: 'Pourquoi un PDF pèse si lourd',
          body: [
            "Ce qui pèse le plus dans un PDF, ce sont les images. Un document créé dans Word avec seulement du texte fait en général quelques centaines de kilo-octets, même s'il compte beaucoup de pages. Un document monté à partir de photos ou d'un scanner réglé en haute résolution peut facilement dépasser 10 Mo avec quelques pages seulement.",
            "C'est pourquoi la compression donne des résultats très différents selon le type de PDF : dans un document texte, il y a peu à réduire ; dans un scan, beaucoup.",
          ],
        },
        {
          h2: 'Quel niveau choisir',
          body: [
            { ul: [
              "**Sans perte :** optimise la structure du fichier sans toucher à la qualité. Le texte reste sélectionnable. C'est l'option sûre pour les contrats, les factures et les documents numériques.",
              "**Moyen :** recommandé pour les scans et les photos. Le poids baisse beaucoup et le document reste bien lisible.",
              "**Élevé :** quand la limite est très stricte. Attention : aux niveaux Moyen et Élevé, le texte devient une image et ne peut plus être sélectionné.",
            ] },
            { tip: "Commencez par « Sans perte ». Si vous n'atteignez pas la taille voulue, essayez « Moyen ». DocuSmart vous montre de combien le fichier a été réduit avant que vous l'envoyiez." },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Compresser un PDF](/comprimir-pdf), choisissez le fichier et le niveau. Touchez « Compresser le PDF » : vous voyez le poids avant et après, et le résultat se télécharge.",
            "Si le PDF était déjà optimisé et ne peut pas être réduit davantage, DocuSmart vous prévient et ne télécharge pas une copie identique ou plus lourde.",
          ],
        },
        {
          h2: 'Si ça ne suffit toujours pas',
          body: [
            { ul: [
              "**Divisez le document :** beaucoup de portails acceptent plusieurs pièces jointes. Avec [Diviser un PDF](/dividir-pdf), vous le coupez en deux fichiers ou plus.",
              "**Compressez les photos avant de créer le PDF :** [Compresser une image](/comprimir-imagen) réduit une photo de téléphone de 60 % à 90 %, presque sans différence visible.",
              "**Supprimez les pages en trop :** avec [Organiser les pages](/ordenar-paginas-pdf), vous retirez les pages de garde ou les pages blanches.",
            ] },
          ],
        },
        {
          h2: 'Limites courantes',
          body: [
            "À titre indicatif : Gmail accepte des pièces jointes jusqu'à 25 Mo et Outlook jusqu'à 20 Mo. Beaucoup de portails administratifs et bancaires demandent entre 2 et 5 Mo par fichier. Vérifiez toujours la limite du site sur lequel vous allez le déposer.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Compresser un PDF', text: "Ouvrez l'outil Compresser un PDF sur docusmart.online." },
        { name: 'Choisissez le fichier', text: 'Sélectionnez le PDF trop lourd.' },
        { name: 'Choisissez le niveau', text: '« Sans perte » pour les documents numériques ; « Moyen » ou « Élevé » pour les scans et les photos.' },
        { name: 'Compressez', text: 'Touchez « Compresser le PDF », vérifiez la réduction obtenue et téléchargez le résultat.' },
      ],
      faq: [
        ['La compression abîme-t-elle le document ?', "Avec « Sans perte », non : le contenu reste identique. Avec « Moyen » et « Élevé », les pages deviennent des images plus légères, qui se lisent bien mais perdent le texte sélectionnable."],
        ['Mon PDF est-il envoyé sur internet ?', "Non. La compression se fait dans votre navigateur : le fichier ne quitte jamais votre appareil."],
        ["Pourquoi mon PDF n'a presque pas été réduit ?", "Il s'agit sans doute d'un PDF texte ou d'un fichier déjà optimisé. Dans ces cas, le poids est déjà faible et il reste peu à gagner."],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'signer-pdf-sans-imprimer',
      title: "Comment signer un PDF sans l'imprimer (sur mobile ou PC) | DocuSmart",
      description:
        "Signez un PDF sans l'imprimer ni le scanner : dessinez votre signature, tapez-la ou utilisez une photo. Quelle valeur a une signature électronique simple. Gratuit et privé.",
      h1: "Comment signer un PDF sans l'imprimer",
      lead: "Imprimer, signer au stylo, scanner et renvoyer : quatre étapes que vous pouvez remplacer par une seule. Voici comment signer un PDF depuis votre téléphone ou votre ordinateur.",
      sections: [
        {
          h2: 'Trois façons de créer votre signature',
          body: [
            { ul: [
              "**La dessiner** avec le doigt sur le téléphone ou avec la souris sur l'ordinateur.",
              "**Taper votre nom**, qui s'affiche dans une écriture manuscrite.",
              "**Importer une photo** de votre signature faite sur papier. C'est celle qui ressemble le plus à votre signature habituelle.",
            ] },
            { tip: "Pour la photo : signez à l'encre foncée sur une feuille blanche, avec une bonne lumière et sans ombres. DocuSmart supprime le fond pour ne garder que le tracé." },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Signer un PDF](/firmar-pdf) et choisissez le document. Créez votre signature avec l'une des trois méthodes.",
            "Faites-la glisser à l'endroit prévu pour la signature et ajustez sa taille. Si le document demande un paraphe sur chaque page, utilisez « Répéter sur toutes les pages ». Touchez « Signer le PDF ».",
          ],
        },
        {
          h2: "S'il faut aussi remplir des informations",
          body: [
            "Beaucoup de documents à signer sont des formulaires : nom, numéro de pièce d'identité, date. Si le PDF contient des champs à remplir, complétez-les d'abord avec [Remplir un formulaire](/llenar-formulario-pdf), puis signez-le. Avant de l'envoyer, cochez « Aplatir le formulaire » pour que les réponses soient figées.",
          ],
        },
        {
          h2: 'Les erreurs courantes en signant',
          body: [
            { ul: [
              "**Signature minuscule ou pixelisée :** agrandissez-la jusqu'à ce qu'elle occupe l'espace de la ligne de signature ; si elle vient d'une photo, prenez-la de près et avec une bonne lumière.",
              "**Signature par-dessus le texte :** déplacez-la pour qu'elle ne cache aucune information du document ; un contrat avec la signature sur une clause peut prêter à confusion.",
              "**Signer la mauvaise version :** vérifiez qu'il s'agit bien du document final avant de signer ; corriger après oblige à signer de nouveau.",
              "**Oublier les autres pages :** si le document demande une signature ou un paraphe sur chaque page, utilisez « Répéter sur toutes les pages » au lieu de le faire page par page.",
            ] },
          ],
        },
        {
          h2: 'Est-ce valable juridiquement ?',
          body: [
            "Vous obtenez une **signature électronique simple** : l'image de votre signature sur le document, l'équivalent numérique d'une signature à la main. Elle suffit pour la plupart des démarches du quotidien : bail de location, autorisations, formulaires d'entreprise ou autorisations de sortie scolaire.",
            "Certaines démarches exigent une **signature électronique avancée ou qualifiée avec certificat**, délivrée par un prestataire de confiance au sens du règlement eIDAS ; par exemple, certains actes auprès de l'administration ou des marchés publics. Si la démarche la demande explicitement, une signature en image ne suffit pas.",
          ],
        },
        {
          h2: "Votre signature n'est enregistrée nulle part",
          body: [
            "La signature et le document sont traités dans le navigateur. Ils ne sont ni envoyés sur un serveur ni conservés : quand vous fermez la page, la signature est effacée. Si vous devez envoyer le document par un canal peu sûr, vous pouvez y ajouter un mot de passe avec [Protéger un PDF](/proteger-pdf).",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Signer un PDF', text: "Ouvrez l'outil Signer un PDF sur docusmart.online et choisissez le document." },
        { name: 'Créez votre signature', text: 'Dessinez-la, tapez votre nom ou importez une photo de votre signature sur papier.' },
        { name: 'Placez-la', text: 'Faites-la glisser à sa place et ajustez la taille ; vous pouvez la répéter sur toutes les pages.' },
        { name: 'Téléchargez', text: 'Touchez « Signer le PDF » pour obtenir le PDF signé.' },
      ],
      faq: [
        ['Puis-je signer depuis mon téléphone ?', "Oui. Sur le téléphone, vous pouvez dessiner la signature avec le doigt ou prendre en photo votre signature sur papier."],
        ['Le document signé peut-il être modifié ?', "La signature est intégrée à la page. Pour éviter les modifications et les accès indésirables, vous pouvez protéger le PDF par mot de passe et retirer l'autorisation de modification."],
        ['Puis-je signer plusieurs pages ?', "Oui : ajoutez la signature sur chaque page voulue ou utilisez « Répéter sur toutes les pages »."],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'numeriser-documents-avec-mobile',
      title: 'Comment numériser des documents avec votre mobile et les enregistrer en PDF | DocuSmart',
      description:
        "Numérisez vos documents avec l'appareil photo du téléphone, sans installer d'app : recadrage automatique, filtre anti-ombres et PDF avec texte consultable. Conseils inclus.",
      h1: 'Comment numériser des documents avec votre mobile',
      lead: "Pas besoin de scanner ni d'application : l'appareil photo du téléphone et le navigateur suffisent pour obtenir un PDF propre, recadré et avec le texte reconnu.",
      sections: [
        {
          h2: "Ce que fait un scanner (et pourquoi une simple photo ne suffit pas)",
          body: [
            "Une photo de feuille est rarement parfaite : elle est un peu de travers, on voit la table autour et le papier blanc paraît gris ou ombré. Un scanner sur mobile corrige tout cela : il repère les quatre coins de la feuille, la redresse comme si vous l'aviez photographiée d'en haut et blanchit le fond.",
            "C'est ce que fait [Scanner un document](/escanear-documento), directement dans le navigateur.",
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Scanner un document](/escanear-documento) et touchez « Prendre une photo » : sur le téléphone, l'appareil photo s'ouvre. Vous pouvez aussi choisir des photos que vous avez déjà.",
            "Vérifiez les coins détectés par DocuSmart ; si l'un est mal placé, faites-le glisser jusqu'à l'angle de la feuille. Choisissez le filtre « Document » pour blanchir le papier et supprimer les ombres. Ajoutez d'autres pages si le document en compte plusieurs.",
            "Touchez « Créer le PDF ». Si vous cochez « Rendre le PDF consultable », le texte est aussi reconnu pour que vous puissiez rechercher des mots et les copier.",
          ],
        },
        {
          h2: 'Cinq astuces pour une numérisation nette',
          body: [
            { ul: [
              "Posez la feuille sur une surface sombre : le contraste aide à détecter les bords.",
              "Privilégiez la lumière naturelle ou une lampe sur le côté ; évitez le flash direct, qui crée des reflets.",
              "Tenez le téléphone parallèle à la feuille et attendez la mise au point.",
              "Aplatissez bien la feuille : les plis créent des ombres que le filtre ne supprime pas toujours.",
              "Pour plusieurs pages, numérisez-les toutes dans la même session : elles sortiront dans un seul PDF.",
            ] },
          ],
        },
        {
          h2: "Reconnaître le texte d'un scan que vous avez déjà",
          body: [
            "Si vous avez déjà un PDF scanné ou une photo et devez en copier le texte, utilisez [l'OCR](/ocr-pdf) : il reconnaît le texte imprimé en 12 langues (français, espagnol, anglais, portugais, russe, japonais, chinois et plus) et vous le donne à copier, en fichier .txt ou en PDF consultable. Il fonctionne mieux avec des scans nets et droits ; l'écriture manuscrite est souvent mal reconnue.",
          ],
        },
        {
          h2: 'Privé du début à la fin',
          body: [
            "La détection des bords, le redressement, les filtres et la reconnaissance du texte se font dans votre navigateur. Les photos ne sont envoyées sur aucun serveur. Si vous numérisez souvent, l'app DocuSmart pour Android fait la même chose hors connexion.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Scanner un document', text: "Ouvrez l'outil Scanner un document sur docusmart.online et touchez « Prendre une photo »." },
        { name: 'Ajustez les coins', text: 'Vérifiez le recadrage et faites glisser les coins si nécessaire.' },
        { name: 'Choisissez le filtre', text: 'Le filtre « Document » blanchit le papier et supprime les ombres.' },
        { name: 'Enregistrez le PDF', text: 'Touchez « Créer le PDF » ; cochez « Rendre le PDF consultable » pour reconnaître le texte.' },
      ],
      faq: [
        ['Faut-il installer une application ?', "Non. Tout fonctionne dans le navigateur du téléphone ou de l'ordinateur. L'app Android est facultative, pour numériser hors connexion."],
        ["Qu'est-ce qu'un PDF consultable ?", "Un PDF qui contient, en plus de l'image, le texte reconnu : vous pouvez rechercher des mots, les sélectionner et les copier."],
        ['Que faire si les bords sont mal détectés ?', "Faites glisser chaque coin jusqu'à l'angle de la feuille ou utilisez « Toute la photo ». Un papier qui contraste avec le fond aide beaucoup."],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'proteger-pdf-mot-de-passe',
      title: "Comment protéger un PDF par mot de passe (et quand c'est utile) | DocuSmart",
      description:
        "Protégez un PDF par mot de passe avec un chiffrement AES-256, choisissez s'il peut être imprimé ou copié et partagez le mot de passe en toute sécurité. Gratuit, sans envoi.",
      h1: 'Comment protéger un PDF par mot de passe',
      lead: "Un PDF contenant vos données personnelles, financières ou médicales qui circule par e-mail ou par messagerie peut finir n'importe où. Ajouter un mot de passe prend une minute et empêche qu'il soit ouvert par la mauvaise personne.",
      sections: [
        {
          h2: 'Quand protéger un PDF',
          body: [
            { ul: [
              "Pièces d'identité, relevés bancaires, fiches de paie ou avis d'imposition.",
              "Dossiers médicaux, résultats d'analyses ou arrêts de travail.",
              "Contrats ou propositions que vous ne voulez pas voir circuler.",
              "Tout fichier envoyé par un canal que vous ne maîtrisez pas, comme un e-mail qui peut être transféré ou un groupe de discussion.",
            ] },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Protéger un PDF](/proteger-pdf) et choisissez le document. Saisissez le mot de passe deux fois.",
            "Décidez de ce qui est autorisé une fois le PDF ouvert : imprimer, copier le texte ou le modifier. Touchez « Protéger le PDF » et la version chiffrée se télécharge. Elle s'ouvre avec Adobe Acrobat, Chrome, Edge et l'app DocuSmart, qui demandent le mot de passe.",
          ],
        },
        {
          h2: 'Un bon mot de passe et comment le transmettre',
          body: [
            { ul: [
              "Utilisez au moins 10 caractères ; une courte phrase avec des chiffres est facile à retenir et difficile à deviner.",
              "N'utilisez ni votre numéro de sécurité sociale ni votre date de naissance : c'est la première chose qu'on essaierait.",
              "**N'envoyez jamais le mot de passe par le même canal que le PDF.** Si le fichier part par e-mail, envoyez le mot de passe par SMS ou donnez-le par téléphone.",
            ] },
            { tip: "Conservez le mot de passe en lieu sûr. Si vous l'oubliez, il est impossible de le récupérer : même DocuSmart ne peut pas ouvrir le PDF, car le mot de passe ne quitte jamais votre appareil." },
          ],
        },
        {
          h2: 'Ce que protège chaque option',
          body: [
            "Le **mot de passe d'ouverture** est la vraie protection : sans lui, le fichier chiffré est illisible. Les **autorisations** (imprimer, copier, modifier) sont autre chose : elles indiquent aux lecteurs PDF ce qu'ils doivent permettre une fois le document ouvert.",
            "Les logiciels sérieux respectent ces autorisations, mais une personne qui a déjà le mot de passe peut les retirer avec certains outils. Utilisez-les pour éviter les copies accidentelles ou les modifications involontaires, pas comme seule barrière. Si quelqu'un ne doit pas voir une information, ne lui donnez pas le mot de passe ou caviardez cette information avant d'envoyer le fichier.",
          ],
        },
        {
          h2: "Un mot de passe, ce n'est pas un caviardage",
          body: [
            "Le mot de passe empêche d'ouvrir le fichier, mais la personne qui le connaît verra tout le contenu. Si vous devez partager un document en masquant seulement certaines informations (un numéro de compte, une adresse), utilisez [Caviarder un PDF](/censurar-pdf) : l'outil supprime réellement le texte sous les zones masquées, au lieu de poser un simple rectangle noir par-dessus.",
          ],
        },
        {
          h2: 'Retirer le mot de passe plus tard',
          body: [
            "Si vous avez besoin plus tard d'une copie non protégée, [Déverrouiller un PDF](/desbloquear-pdf) retire le mot de passe, à condition que vous le connaissiez. Utilisez-le uniquement avec vos propres documents ou ceux que vous avez le droit de modifier.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Protéger un PDF', text: "Ouvrez l'outil Protéger un PDF par mot de passe sur docusmart.online et choisissez le document." },
        { name: 'Saisissez le mot de passe', text: 'Saisissez-le deux fois pour le confirmer.' },
        { name: 'Choisissez les autorisations', text: "Indiquez si l'impression, la copie ou la modification sont autorisées." },
        { name: 'Protégez et téléchargez', text: 'Touchez « Protéger le PDF » et le document chiffré se télécharge.' },
      ],
      faq: [
        ['Est-ce vraiment sûr ?', "Le chiffrement utilisé est l'AES-256, le standard le plus robuste pour les PDF. La sécurité réelle dépend surtout d'un mot de passe difficile à deviner."],
        ['Mon mot de passe est-il envoyé à un serveur ?', "Non. Le chiffrement se fait dans votre navigateur ; ni le fichier ni le mot de passe ne quittent votre appareil."],
        ["Puis-je retirer le mot de passe du PDF de quelqu'un d'autre ?", "Seulement si vous connaissez le mot de passe. DocuSmart ne casse pas les mots de passe d'ouverture."],
      ],
    },
    'dividir-pdf-en-varios-archivos': {
      slug: 'diviser-pdf-en-plusieurs-fichiers',
      title: 'Comment diviser un PDF en plusieurs fichiers ou en extraire des pages | DocuSmart',
      description:
        "Séparez un PDF par pages, par plages, toutes les N pages, par signets ou par taille, ou gardez seulement les pages utiles. Gratuit et sans envoyer le fichier.",
      h1: 'Comment diviser un PDF en plusieurs fichiers ou en extraire quelques pages',
      lead: "Un portail ne demande que la page signée, ou un PDF de 80 pages ne passe pas par e-mail. Voici comment découper un PDF en plusieurs parties, ou n'en garder que les pages utiles, depuis le navigateur.",
      sections: [
        {
          h2: 'Six façons de diviser',
          body: [
            "Avant de commencer, mieux vaut savoir ce dont vous avez besoin, car [Diviser un PDF](/dividir-pdf) propose un mode pour chaque cas :",
            { ul: [
              "**Choisir les pages** : vous touchez les miniatures (ou tapez « 1-3, 5 ») et vous obtenez un PDF avec ces pages seulement.",
              "**Par plages** : plusieurs plages à la fois, chacune devient un PDF distinct.",
              "**Toutes les N pages** : des parties égales, par exemple de 10 pages en 10 pages.",
              "**Par signets** : un PDF par chapitre, si le document contient des signets.",
              "**Par taille** : des parties qui ne dépassent pas un poids donné, pour les e-mails ou les portails limités.",
              "**Chaque page séparément** : un PDF par page.",
            ] },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Diviser un PDF](/dividir-pdf) et choisissez le fichier. Ses pages s'affichent en miniatures. Dans « Choisir les pages », touchez celles que vous voulez garder : elles se marquent en bleu et le champ du haut se remplit tout seul.",
            "Touchez le bouton du bas. Une fois terminé, le résultat s'affiche à côté de l'original pour que vous puissiez le vérifier, puis vous le téléchargez sous le nom de votre choix. Si le mode crée plusieurs fichiers, vous les récupérez un par un ou tous ensemble dans un ZIP.",
            { tip: "Pour prendre quelques pages dans plusieurs PDF et les réunir en un seul, [Fusionner des PDF](/unir-pdf) est plus rapide : vous pouvez y choisir les pages à garder dans chaque fichier." },
          ],
        },
        {
          h2: 'Si les parties restent trop lourdes',
          body: [
            "Diviser ne change pas la qualité : chaque page est copiée telle quelle. Si une partie dépasse encore la limite, utilisez le mode **Par taille** ou passez-la dans [Compresser un PDF](/comprimir-pdf). Une seule page scannée en haute résolution peut à elle seule dépasser la limite : dans ce cas, c'est la compression qui règle le problème.",
          ],
        },
        {
          h2: 'Cas fréquents',
          body: [
            { ul: [
              "Un portail ne demande que votre pièce d'identité recto verso : choisissez ces deux pages et envoyez uniquement ce PDF.",
              "Un relevé de toute l'année : s'il contient un signet par mois, utilisez **Par signets** ; sinon, **Toutes les N pages**.",
              "Une messagerie limitée à 10 Mo : utilisez **Par taille**, indiquez 10 et chaque partie restera en dessous.",
            ] },
          ],
        },
        {
          h2: 'Votre document reste sur votre appareil',
          body: [
            "La division se fait dans votre navigateur : le PDF n'est envoyé sur aucun serveur. Vous pouvez donc l'utiliser pour des relevés bancaires, des dossiers médicaux ou des contrats sans en laisser de copie ailleurs.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Diviser un PDF', text: 'Allez sur docusmart.online/fr/diviser-pdf et choisissez le fichier.' },
        { name: 'Choisissez le mode', text: 'Choisir les pages, par plages, toutes les N pages, par signets, par taille ou chaque page séparément.' },
        { name: 'Marquez les pages', text: 'Touchez les miniatures ou tapez les numéros (par exemple 1-3, 5).' },
        { name: 'Divisez et téléchargez', text: 'Touchez le bouton et téléchargez le résultat, ou tous les fichiers dans un ZIP.' },
      ],
      faq: [
        ['Est-ce que je perds en qualité en divisant ?', "Non. Les pages sont copiées telles quelles, avec leur texte et leurs images d'origine."],
        ['Puis-je diviser un PDF protégé par mot de passe ?', "S'il n'a que des restrictions (il s'ouvre sans mot de passe), oui. S'il demande un mot de passe à l'ouverture, retirez-le d'abord avec Déverrouiller un PDF."],
        ['Que deviennent les signets ?', 'En mode Par signets, chaque chapitre du sommaire devient un PDF qui porte le nom du signet.'],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'faire-pivoter-pages-pdf',
      title: "Comment faire pivoter les pages d'un PDF et les enregistrer ainsi | DocuSmart",
      description:
        "Redressez les pages scannées de travers ou à l'envers : faites pivoter une page ou toutes, de 90° à gauche ou à droite, et enregistrez le PDF. Gratuit et sans envoi.",
      h1: "Comment faire pivoter les pages d'un PDF (et qu'elles restent ainsi à l'enregistrement)",
      lead: "C'est fréquent avec les scans : une feuille à l'italienne se retrouve couchée, ou une page sort à l'envers. La faire pivoter dans la visionneuse ne suffit pas : une fois envoyée, elle s'affiche de nouveau mal. Voici comment corriger le fichier lui-même.",
      sections: [
        {
          h2: 'Pourquoi pivoter dans la visionneuse ne suffit pas',
          body: [
            "Les visionneuses PDF permettent de faire pivoter l'affichage, mais cette rotation n'est pas enregistrée dans le fichier : votre destinataire le verra de travers. Pour que ce soit définitif, il faut changer l'orientation de la page dans le PDF lui-même, et c'est ce que fait [Faire pivoter un PDF](/rotar-pdf).",
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Faire pivoter un PDF](/rotar-pdf) et choisissez le fichier. Chaque page s'affiche en miniature avec sa rotation actuelle en dessous (0°, 90°…). Touchez une page pour la faire pivoter de 90°, ou utilisez ses flèches pour la tourner vers la gauche ou vers la droite. Si tout le document est couché, utilisez « Toutes vers la gauche » ou « Toutes vers la droite ».",
            "Quand toutes les pages sont droites, touchez « Faire pivoter le PDF » et téléchargez le résultat. Seule l'orientation change : le texte, les images et la qualité restent identiques.",
            { tip: "Si en plus les pages sont dans le désordre (c'est courant avec un scan recto verso), continuez avec [Organiser les pages](/ordenar-paginas-pdf)." },
          ],
        },
        {
          h2: 'Les scans de travers',
          body: [
            "La rotation sert pour les feuilles couchées ou à l'envers, par pas de 90°. Si la photo est inclinée de quelques degrés, mieux vaut la scanner de nouveau avec [Scanner un document](/escanear-documento), qui repère les bords de la feuille et la redresse automatiquement.",
          ],
        },
        {
          h2: 'Cas fréquents',
          body: [
            "Avec un scan recto verso, il arrive souvent que le verso sorte à l'envers : touchez ces pages deux fois pour les faire pivoter de 180°. Dans un rapport avec des tableaux à l'horizontale, ne faites pivoter que ces pages pour les lire sans tourner la tête ; les autres restent telles quelles.",
            "Si le PDF provient de photos prises avec le téléphone, vérifiez l'orientation au moment de le créer : [Image en PDF](/imagen-a-pdf) propose une orientation Automatique, Portrait ou Paysage, ce qui vous évite de faire pivoter les pages ensuite.",
          ],
        },
        {
          h2: 'Privé du début à la fin',
          body: [
            "Le PDF pivote dans votre navigateur. Il n'est envoyé sur aucun serveur et n'est enregistré nulle part : quand vous fermez l'onglet, il disparaît. Cela fonctionne de la même façon sur ordinateur et sur mobile, et une fois la page chargée, pas besoin d'un bon réseau.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Faire pivoter un PDF', text: 'Allez sur docusmart.online/fr/pivoter-pdf et choisissez le PDF.' },
        { name: 'Faites pivoter les pages', text: 'Touchez chaque page couchée, ou utilisez Toutes vers la gauche ou Toutes vers la droite.' },
        { name: 'Enregistrez', text: 'Touchez Faire pivoter le PDF et téléchargez le fichier remis droit.' },
      ],
      faq: [
        ['Puis-je faire pivoter une seule page ?', 'Oui. Chaque page pivote séparément ; les autres restent comme elles étaient.'],
        ['Est-ce que je perds en qualité ?', "Non. Seule l'orientation de la page change ; le contenu n'est pas recompressé."],
        ['Ça fonctionne sur mobile ?', 'Oui, dans tout navigateur récent, sur Android comme sur iPhone.'],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'changer-ordre-pages-pdf',
      title: "Comment changer l'ordre des pages d'un PDF | DocuSmart",
      description:
        "Déplacez les pages d'un PDF en les faisant glisser, dupliquez-en une, ajoutez des pages blanches ou retirez celles en trop, puis enregistrez. Gratuit et sans envoi.",
      h1: "Comment changer l'ordre des pages d'un PDF",
      lead: "Un scan recto verso dont les pages sont mélangées, une annexe qui devait être au début ou une page en double : voici comment remettre un PDF en ordre, page par page.",
      sections: [
        {
          h2: 'Ce que vous pouvez faire avec chaque page',
          body: [
            "Dans [Organiser les pages](/ordenar-paginas-pdf), chaque page est une carte, et vous pouvez :",
            { ul: [
              "**La déplacer** : en la faisant glisser à sa place, ou avec les flèches avant et après (plus pratique sur mobile).",
              "**La dupliquer** : par exemple pour répéter une page de garde ou une page de signatures.",
              "**Ajouter une page blanche** après elle, pour laisser de l'espace ou séparer des sections.",
              "**La retirer** si elle est en trop.",
            ] },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Organiser les pages](/ordenar-paginas-pdf) et choisissez le PDF. Déplacez les pages jusqu'à obtenir l'ordre voulu : le numéro de chaque carte (« P. 2 », « P. 1 »…) vous rappelle sa place d'origine, pour ne pas vous perdre.",
            "Quand l'ordre est bon, touchez « Appliquer le nouvel ordre » et téléchargez le PDF. Les pages sont copiées telles quelles : ni le texte ni la qualité ne changent.",
            { tip: "Si les pages à remettre en ordre sont réparties dans plusieurs fichiers, fusionnez-les d'abord avec [Fusionner des PDF](/unir-pdf), puis organisez-les ici." },
          ],
        },
        {
          h2: 'Pour retirer des pages, mieux vaut diviser',
          body: [
            "Si vous voulez seulement garder quelques pages, [Diviser un PDF](/dividir-pdf) est plus rapide : vous cochez celles à garder et c'est fait. Organiser sert quand tout le document est conservé, mais dans un autre ordre.",
          ],
        },
        {
          h2: 'Cas fréquents',
          body: [
            "Avec un scanner qui ne gère pas le recto verso, toutes les faces avant sortent d'abord, puis toutes les faces arrière. Pour les intercaler, placez la dernière page après la première, l'avant-dernière après la troisième, et ainsi de suite : avec les flèches, ça va vite.",
            { ul: [
              "Une annexe qui devait être au début : placez-la avant la première page.",
              "Une page de signatures qui doit figurer à deux endroits : dupliquez-la et placez la copie là où il faut.",
              "Des chapitres qui doivent commencer sur une page impaire en impression recto verso : ajoutez une page blanche avant.",
            ] },
          ],
        },
        {
          h2: 'Sans envoyer vos fichiers',
          body: [
            "Le nouvel ordre est assemblé dans votre navigateur. Le document ne circule pas sur internet et aucune copie ne reste sur un serveur. Vous pouvez donc réorganiser en toute tranquillité des dossiers administratifs, des dossiers médicaux ou des documents de travail qui ne devraient pas quitter votre appareil.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Organiser les pages', text: 'Allez sur docusmart.online/fr/organiser-pages-pdf et choisissez le PDF.' },
        { name: 'Déplacez les pages', text: 'Faites-les glisser ou utilisez les flèches ; dupliquez, ajoutez des pages blanches ou retirez celles en trop.' },
        { name: 'Appliquez et téléchargez', text: 'Touchez Appliquer le nouvel ordre et téléchargez le PDF réorganisé.' },
      ],
      faq: [
        ['Puis-je réorganiser depuis mon téléphone ?', "Oui. En plus du glisser-déposer, chaque page a des flèches pour la déplacer avant ou après, plus faciles à utiliser avec le doigt."],
        ['Les liens et les formulaires sont-ils conservés ?', 'Les pages sont copiées avec leur contenu ; vérifiez le résultat si le document contient des formulaires complexes.'],
        ['Y a-t-il une limite de pages ?', "Il n'y a pas de nombre fixe ; avec de très gros documents, l'affichage des miniatures peut prendre un peu plus de temps."],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'mettre-numeros-de-page-pdf',
      title: 'Comment ajouter des numéros de page à un PDF | DocuSmart',
      description:
        "Numérotez les pages d'un PDF : position, format « 1 », « 1 / 10 » ou « Page 1 sur 10 », numéro de départ et page de garde sans numéro. Gratuit et sans envoi.",
      h1: 'Comment ajouter des numéros de page à un PDF',
      lead: "Un mémoire, un rapport ou un dossier se relit bien plus facilement avec des pages numérotées. Voici comment numéroter un PDF qui n'en a pas, dans le format qu'on vous demande.",
      sections: [
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Numéroter les pages](/numerar-paginas-pdf) et choisissez le PDF. Indiquez où placer le numéro (en haut ou en bas, à gauche, au centre ou à droite) et le format : « 1 », « 1 / 10 » ou « Page 1 sur 10 ».",
            "Touchez « Numéroter les pages ». L'avant et l'après s'affichent côte à côte, page par page, pour vérifier que le numéro ne cache rien. Il ne reste plus qu'à télécharger.",
          ],
        },
        {
          h2: 'Des options pour les cas courants',
          body: [
            { ul: [
              "**Sans numéro sur les premières** : indiquez 1 pour ne pas numéroter la page de garde, ou plus s'il y a un sommaire ou une dédicace.",
              "**Commencer à** : pour que la numérotation suive celle d'un autre document, par exemple à partir de 25.",
              "**Texte** personnalisé : tapez par exemple « Folio {n} » ou « {n} sur {total} » ; {n} est le numéro de la page et {total}, le dernier.",
              "**Taille** et **Couleur** : petite, moyenne ou grande, et la couleur de votre choix.",
            ] },
            { tip: "Si le document est réparti dans plusieurs fichiers, réunissez-les d'abord avec [Fusionner des PDF](/unir-pdf) pour que la numérotation soit continue." },
          ],
        },
        {
          h2: 'Pour que le numéro ne cache pas le contenu',
          body: [
            "Beaucoup de documents ont déjà quelque chose en pied de page (un logo, une adresse). Si le numéro tombe dessus, changez-le de coin ou placez-le en haut : l'avant et l'après vous montrent chaque page avant le téléchargement, et vous passez de l'une à l'autre avec les flèches.",
          ],
        },
        {
          h2: 'Numérotez en dernier',
          body: [
            "Le numéro est dessiné sur chaque page. Si vous réorganisez ou ajoutez des pages ensuite, les numéros suivent leurs pages et ne se suivent plus. Mieux vaut donc numéroter à la fin : fusionnez, organisez et retirez d'abord ce qui est en trop, puis numérotez la version définitive.",
            "Pour les dossiers destinés à une administration, où l'on parle de folios, tapez « Folio {n} » dans le texte. Et si le document prolonge la numérotation d'un autre, ajustez « Commencer à ».",
          ],
        },
        {
          h2: 'Tout se passe dans votre navigateur',
          body: [
            "La numérotation est ajoutée sur votre appareil : le PDF n'est envoyé sur aucun serveur. Le texte du document reste du texte : on peut le rechercher et le copier comme avant, et le numéro est lui aussi du texte, net à l'impression.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Numéroter les pages', text: 'Allez sur docusmart.online/fr/numeroter-pages-pdf et choisissez le PDF.' },
        { name: 'Choisissez la position et le format', text: 'Par exemple, en bas à droite et « Page 1 sur 10 ».' },
        { name: 'Ajustez si besoin', text: 'Page de garde sans numéro, numéro de départ, taille et couleur.' },
        { name: 'Numérotez et téléchargez', text: "Vérifiez l'avant et l'après et téléchargez le PDF numéroté." },
      ],
      faq: [
        ['Puis-je ne pas numéroter la page de garde ?', 'Oui. Dans « Sans numéro sur les premières », indiquez 1 (ou le nombre de pages à sauter).'],
        ['Puis-je commencer à un autre numéro ?', 'Oui. Dans « Commencer à », indiquez le premier numéro, par exemple 25.'],
        ['Peut-on écrire « Folio » avant le numéro ?', 'Oui. Dans le texte, tapez « Folio {n} » et chaque page affichera son numéro à la place de {n}.'],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'ajouter-filigrane-pdf',
      title: 'Comment ajouter un filigrane à un PDF (texte ou logo) | DocuSmart',
      description:
        "Ajoutez « CONFIDENTIEL », « COPIE » ou votre logo à un PDF : position, mosaïque, angle, taille, opacité et pages. Gratuit, dans le navigateur et sans envoi.",
      h1: 'Comment ajouter un filigrane à un PDF (texte ou logo)',
      lead: "Pour envoyer une proposition à l'état de brouillon, marquer une copie de votre pièce d'identité « Uniquement pour la démarche X » ou apposer votre logo sur un catalogue : voici comment ajouter un filigrane à un PDF.",
      sections: [
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Filigrane PDF](/marca-de-agua-pdf) et choisissez le PDF. Tapez le texte (« CONFIDENTIEL » est proposé en exemple) ou passez à « Image ou logo » pour utiliser le vôtre.",
            "Touchez « Appliquer le filigrane » : l'avant et l'après s'affichent côte à côte. Pour changer quelque chose, ajustez et appliquez de nouveau ; quand le résultat vous plaît, téléchargez-le.",
          ],
        },
        {
          h2: 'Comment le régler',
          body: [
            { ul: [
              "**Position** : au centre, dans un coin ou sur un bord, ou en **mosaïque** pour le répéter sur toute la page.",
              "**Rotation** : 0°, 45°, 90° ou −45°. La diagonale est la plus classique et la plus difficile à rogner.",
              "**Taille, opacité et couleur** : une opacité faible (20 %) laisse lire le document ; plus élevée, elle rend le filigrane plus visible.",
              "**Au-dessus ou derrière le contenu** : derrière, il reste plus discret sur les documents chargés en texte.",
              "**Pages** : toutes, ou seulement certaines (par exemple 1-3, 5).",
            ] },
          ],
        },
        {
          h2: "Un filigrane pour les copies de documents",
          body: [
            "Si on vous demande une copie de votre pièce d'identité ou d'un relevé, ajoutez en mosaïque une mention comme « Uniquement pour le dossier de location, janvier 2026 ». Ainsi, si la copie atterrit ailleurs, on voit tout de suite à quoi elle était destinée.",
            { tip: "Si vous voulez aussi qu'elle ne puisse pas être ouverte sans mot de passe, passez-la ensuite dans [Protéger un PDF](/proteger-pdf)." },
          ],
        },
        {
          h2: 'Idées de texte',
          body: [
            { ul: [
              "« BROUILLON » pour les versions qui ne sont pas encore définitives.",
              "« COPIE » ou « COPIE CONTRÔLÉE » pour les documents diffusés.",
              "« Uniquement pour [démarche] — [date] » sur les copies de pièces d'identité.",
              "« SPÉCIMEN » sur les catalogues, les modèles ou les travaux pas encore payés.",
            ] },
            "Pour que le filigrane se lise sans gêner la lecture, une opacité entre 15 % et 30 % fonctionne généralement bien. En mosaïque, une taille petite ou moyenne donne un rendu plus propre. Avant de télécharger, vérifiez plusieurs pages dans l'avant et l'après.",
          ],
        },
        {
          h2: 'Sans envoyer le document',
          body: [
            "Le filigrane est ajouté dans votre navigateur. Le PDF n'est envoyé sur aucun serveur, ce qui compte justement pour les documents qu'on filigrane : copies de pièces d'identité, propositions commerciales ou documents internes.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Filigrane PDF', text: 'Allez sur docusmart.online/fr/filigrane-pdf et choisissez le PDF.' },
        { name: 'Tapez le texte ou choisissez votre logo', text: 'Par exemple « CONFIDENTIEL » ou « COPIE ».' },
        { name: 'Réglez la position et le style', text: 'Centre ou mosaïque, angle, taille, opacité, couleur et pages.' },
        { name: 'Appliquez et téléchargez', text: "Vérifiez l'avant et l'après et téléchargez le PDF." },
      ],
      faq: [
        ['Puis-je utiliser mon logo ?', 'Oui. Choisissez « Image ou logo » et ajoutez une image ; un PNG à fond transparent donne le meilleur résultat.'],
        ['Peut-on le retirer ensuite ?', "Il est dessiné dans le PDF. Gardez l'original sans filigrane au cas où vous en auriez de nouveau besoin."],
        ['Puis-je le mettre sur certaines pages seulement ?', 'Oui. Dans « Pages », indiquez lesquelles, par exemple 1-3, 5.'],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'modifier-pdf-sans-logiciel',
      title: 'Comment modifier un PDF sans installer de logiciel | DocuSmart',
      description:
        "Ajoutez ou remplacez du texte, surlignez, masquez, dessinez, ajoutez des flèches, des images et des liens dans un PDF depuis le navigateur, sans installation ni envoi.",
      h1: 'Comment modifier un PDF sans installer de logiciel',
      lead: "Corriger une date, compléter une information oubliée, surligner une clause ou barrer quelque chose : pas besoin d'un logiciel payant pour ça. Voici comment modifier un PDF dans le navigateur.",
      sections: [
        {
          h2: "Les outils de l'éditeur",
          body: [
            "Au-dessus de la page, une barre regroupe tout ce que vous pouvez ajouter dans [Modifier un PDF](/editar-pdf) :",
            { ul: [
              "**Texte** : vous touchez la page là où vous voulez écrire et tapez dans le cadre du bas ; vous choisissez la police, la taille, le gras et la couleur.",
              "**Remplacer** : vous touchez un texte déjà présent dans le PDF et le modifiez ; l'original est supprimé du document, pas seulement caché.",
              "**Rectangle, Cercle, Surligner et Masquer** : pour encadrer, souligner ou recouvrir de blanc.",
              "**Dessiner, Ligne et Flèche** : pour signaler un passage ou annoter à main levée.",
              "**Image et Lien** : pour coller un tampon ou un logo, ou créer un lien vers un site web ou une autre page du PDF.",
            ] },
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Modifier un PDF](/editar-pdf) et choisissez le fichier. Choisissez « Texte » dans la barre et touchez la page à l'endroit voulu : un cadre déplaçable apparaît, et vous tapez dans le panneau du bas. Avec « Sélectionner », touchez n'importe quel élément pour le déplacer, le redimensionner ou le retirer.",
            "En cas d'erreur, utilisez « Annuler ». Quand vous avez fini, touchez « Appliquer les modifications » et téléchargez le PDF modifié.",
            { tip: "Le texte accepte tous les alphabets (latin, cyrillique, grec, chinois, japonais ou coréen). Les emojis ne sont pas enregistrés dans le PDF." },
          ],
        },
        {
          h2: 'Pour signer ou remplir un formulaire, il existe des outils dédiés',
          body: [
            "Si vous devez signer, [Signer un PDF](/firmar-pdf) vous permet de dessiner, taper ou importer votre signature et de la placer au bon endroit. Et si le PDF contient des champs à remplir, [Remplir un formulaire PDF](/llenar-formulario-pdf) les présente un par un, plus pratique que d'écrire par-dessus.",
          ],
        },
        {
          h2: 'Conseils pour une modification invisible',
          body: [
            "Pour corriger un texte déjà présent dans le document, utilisez **Remplacer** : l'original est effacé et le nouveau prend sa place. Si vous vous contentez de le recouvrir d'un cadre blanc, l'ancien texte reste dans le fichier.",
            "Choisissez la police la plus proche de celle du document (Sans, Serif ou Mono) et ajustez la taille jusqu'à ce qu'elle corresponde. Sur mobile, déplacez les éléments sans vous presser : vous pouvez aussi changer leur position au clavier avec les flèches.",
          ],
        },
        {
          h2: 'Votre fichier reste chez vous',
          body: [
            "Tout l'éditeur fonctionne dans votre navigateur : le PDF n'est envoyé sur aucun serveur, ni pendant la modification ni à l'enregistrement.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Modifier un PDF', text: 'Allez sur docusmart.online/fr/modifier-pdf et choisissez le fichier.' },
        { name: 'Choisissez quoi ajouter', text: 'Texte, remplacement, formes, surlignage, dessin, flèches, image ou lien.' },
        { name: 'Placez-le sur la page', text: 'Touchez la page, tapez ou dessinez, puis déplacez-le avec Sélectionner.' },
        { name: 'Appliquez et téléchargez', text: 'Touchez Appliquer les modifications et téléchargez le PDF modifié.' },
      ],
      faq: [
        ['Puis-je changer un texte déjà présent dans le PDF ?', "Oui, avec « Remplacer » : vous touchez le texte, tapez le nouveau, et l'original est supprimé du document."],
        ['Ça fonctionne avec des PDF scannés ?', "Vous pouvez ajouter du texte, des formes et des dessins par-dessus. Pour remplacer du texte, le PDF doit contenir du vrai texte ; si c'est une photo, passez-le d'abord par l'OCR."],
        ["Faut-il installer quelque chose ?", "Non. Ça fonctionne dans le navigateur de l'ordinateur ou du téléphone."],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'comparer-deux-versions-pdf',
      title: "Comment comparer deux versions d'un PDF et voir ce qui a changé | DocuSmart",
      description:
        "Comparez deux PDF pour voir les mots ajoutés ou supprimés, ou page par page pour repérer les changements d'images et de mise en page. Gratuit et sans envoi.",
      h1: "Comment comparer deux versions d'un PDF et voir ce qui a changé",
      lead: "On vous renvoie un contrat « avec quelques ajustements » sans préciser lesquels. Le relire deux fois à la recherche des différences prend du temps, et des choses vous échappent. Voici comment comparer deux versions en quelques secondes.",
      sections: [
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Comparer des PDF](/comparar-pdf). Choisissez d'abord l'**Original**, puis la **Nouvelle version**. Si vous les avez inversés, le bouton « Inverser » les remet à leur place.",
            "Touchez « Comparer ». En haut, vous voyez combien de mots ont été ajoutés et combien ont été supprimés, et en dessous chaque changement avec sa page : ce qui a été supprimé est barré en rouge et ce qui a été ajouté apparaît en vert, avec quelques lignes de contexte pour le situer.",
          ],
        },
        {
          h2: 'Texte ou visuel',
          body: [
            { ul: [
              "**Texte** : compare les mots. C'est l'idéal pour les contrats, les courriers et les rapports. Vous pouvez ignorer la casse et la ponctuation pour qu'elles ne comptent pas comme des changements.",
              "**Visuel (page par page)** : compare l'apparence de chaque page. Utile pour les plans, les maquettes ou les documents scannés, où les changements peuvent porter sur des images ou des tableaux et pas seulement sur le texte.",
            ] },
            { tip: "Dans un contrat, regardez surtout les changements de montants, de dates et de noms : la comparaison les signale même s'il ne s'agit que d'un seul chiffre." },
          ],
        },
        {
          h2: 'Après la comparaison',
          body: [
            "Si vous avez trouvé quelque chose à corriger, vous pouvez le faire avec [Modifier un PDF](/editar-pdf). Et quand les deux parties sont d'accord, signez la version finale avec [Signer un PDF](/firmar-pdf).",
          ],
        },
        {
          h2: "Ce qu'elle montre et ce qu'elle ne montre pas",
          body: [
            "Chaque changement s'affiche avec son numéro de page et les lignes qui l'entourent, pour le retrouver vite dans le document. Si un paragraphe entier a été déplacé sans être modifié, il est indiqué comme déplacé au lieu d'être compté comme supprimé puis ajouté.",
            "Si les deux fichiers n'ont presque rien en commun (par exemple parce que vous vous êtes trompé de document), l'outil vous prévient au lieu d'afficher des centaines de changements. Et s'ils sont identiques, il vous le dit aussi, même quand ils n'ont pas le même nombre de pages.",
            "C'est utile pour les contrats, les devis, les règlements, les propositions qui passent entre plusieurs mains ou le mémoire qui revient avec les corrections du directeur : dans tous ces cas, savoir exactement ce qui a changé évite une relecture complète.",
          ],
        },
        {
          h2: "Vos documents ne sont pas envoyés",
          body: [
            "Les deux PDF sont comparés dans votre navigateur : aucun n'est envoyé sur un serveur. Vous pouvez l'utiliser sereinement avec des contrats et des documents confidentiels, car aucune des deux versions n'est conservée ailleurs.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Comparer des PDF', text: 'Allez sur docusmart.online/fr/comparer-pdf.' },
        { name: 'Choisissez les deux fichiers', text: "D'abord l'original, puis la nouvelle version." },
        { name: 'Choisissez le mode de comparaison', text: 'Texte (les mots) ou Visuel (page par page).' },
        { name: 'Vérifiez les changements', text: "Ce qui a été supprimé est barré en rouge et ce qui a été ajouté apparaît en vert, avec sa page." },
      ],
      faq: [
        ['Peut-on comparer des PDF scannés ?', "En mode Visuel, oui, car il compare l'apparence de chaque page. Le mode Texte nécessite un PDF contenant du vrai texte."],
        ["L'ordre des fichiers a-t-il de l'importance ?", "Oui : ce qui figure dans la nouvelle version mais pas dans l'original apparaît comme ajouté. En cas d'erreur, utilisez Inverser."],
        ['Peut-on ignorer une majuscule ou une virgule modifiée ?', 'Oui. Cochez « Ignorer la casse » ou « Ignorer la ponctuation ».'],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'masquer-donnees-personnelles-pdf',
      title: 'Comment masquer des données personnelles dans un PDF (pour de bon) | DocuSmart',
      description:
        "Caviardez numéros d'identité, comptes, e-mails ou noms dans un PDF : recherchez-les, marquez-les sur toutes les pages et ils sont supprimés du fichier, pas juste cachés.",
      h1: 'Comment masquer des données personnelles dans un PDF (pour de bon)',
      lead: "Avant de partager un relevé, un contrat ou un dossier médical, il faut souvent cacher des numéros de compte ou de pièce d'identité. Poser un rectangle noir par-dessus ne suffit pas : voici comment bien faire.",
      sections: [
        {
          h2: 'Pourquoi un rectangle noir ne suffit pas',
          body: [
            "Si vous placez un rectangle noir sur un numéro dans un éditeur classique, le numéro reste dans le fichier : il suffit de le sélectionner et de le copier, ou d'ouvrir le PDF avec un autre logiciel, pour le lire. Caviarder pour de bon, c'est **supprimer** ce qui se trouve dessous, et c'est ce que fait [Caviarder un PDF](/censurar-pdf).",
          ],
        },
        {
          h2: 'Pas à pas',
          body: [
            "Ouvrez [Caviarder un PDF](/censurar-pdf) et choisissez le fichier. Recherchez un nom, un numéro ou un mot : il est marqué sur toutes les pages à la fois. Vous pouvez aussi marquer d'un coup tous les **E-mails** ou tous les **Numéros** (pièces d'identité, téléphones, comptes), ou faire glisser le doigt sur la page pour masquer une zone à la main.",
            "Vérifiez chaque page : en touchant une zone, vous pouvez la déplacer ou la retirer. Quand tout est prêt, touchez « Caviarder le PDF » et téléchargez le résultat.",
            { tip: "Les pages qui contiennent des zones marquées sont converties en image pour que ce qui est masqué disparaisse du fichier. Le reste du texte de ces pages peut toujours être recherché et copié." },
          ],
        },
        {
          h2: 'Vérifiez avant d’envoyer',
          body: [
            "La recherche trouve ce qui est écrit sous forme de texte. Si une partie du document est une photo ou un scan, les données qui s'y trouvent n'apparaissent pas dans la recherche : marquez-les à la main en faisant glisser le doigt sur la page. Et gardez l'original de côté, car ce qui est caviardé ne peut pas être récupéré.",
            "Si le document doit rester entre d'autres mains, vous pouvez aussi lui ajouter un mot de passe avec [Protéger un PDF](/proteger-pdf) ou un [filigrane](/marca-de-agua-pdf) qui indique à quoi il était destiné.",
          ],
        },
        {
          h2: "Ce qu'il faut souvent masquer",
          body: [
            { ul: [
              "Les numéros de pièce d'identité et de comptes bancaires.",
              "Les adresses, numéros de téléphone et e-mails.",
              "Les signatures et les photos d'identité.",
              "Les données de santé, les salaires ou les informations concernant des tiers.",
            ] },
          ],
        },
        {
          h2: 'Sans envoyer le document',
          body: [
            "Tout se passe dans votre navigateur : le document avec les données visibles ne quitte jamais votre appareil. C'est précisément ce qu'il faut pour caviarder : si vous envoyiez l'original à un service en ligne pour le masquer, les données seraient déjà sorties de vos mains.",
          ],
        },
      ],
      steps: [
        { name: 'Ouvrez Caviarder un PDF', text: 'Allez sur docusmart.online/fr/caviarder-pdf et choisissez le fichier.' },
        { name: 'Marquez ce qui doit être caché', text: 'Recherchez un texte, marquez tous les e-mails ou numéros, ou faites glisser le doigt sur la page.' },
        { name: 'Vérifiez chaque page', text: 'Touchez une zone pour la déplacer ou la retirer.' },
        { name: 'Caviardez et téléchargez', text: 'Touchez Caviarder le PDF : ce qui est masqué est supprimé du fichier.' },
      ],
      faq: [
        ['Peut-on récupérer ce qui a été caviardé ?', "Non. Ce que vous masquez est supprimé du fichier ; c'est pourquoi il vaut mieux garder l'original de côté."],
        ['Ça fonctionne avec des PDF scannés ?', 'Oui, en marquant les zones à la main. La recherche automatique ne trouve que ce qui est écrit sous forme de texte.'],
        ['Peut-on toujours faire des recherches dans le reste du document ?', 'Oui. Seules les pages contenant des zones marquées sont converties en image, et le reste de leur texte est conservé pour la recherche et la copie.'],
      ],
    },
  },
}
