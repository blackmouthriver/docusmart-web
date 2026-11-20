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
            "Si vous avez déjà un PDF scanné ou une photo et devez en copier le texte, utilisez [l'OCR](/ocr-pdf) : il reconnaît le texte imprimé en espagnol et en anglais et vous le donne à copier, en fichier .txt ou en PDF consultable. Il fonctionne mieux avec des scans nets et droits ; l'écriture manuscrite est souvent mal reconnue.",
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
  },
}
