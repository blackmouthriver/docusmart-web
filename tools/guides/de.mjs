// Traducción al alemán de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: 'Anleitungen',
    guidesSlug: 'anleitungen',
    indexTitle: 'PDF-Anleitungen: zusammenfügen, unterschreiben, scannen | DocuSmart',
    indexDescription:
      'Kurze, praktische Anleitungen zum Zusammenfügen, Komprimieren, Unterschreiben, Scannen und Schützen von PDFs am Handy oder PC, ohne Upload.',
    indexH1: 'Schritt-für-Schritt-Anleitungen',
    indexLead: 'Praktische Anleitungen, die dich bei typischen Aufgaben mit Dokumenten vom Anfang bis zum Ende begleiten. Alle verwendeten Werkzeuge laufen in deinem Browser, deine Dateien bleiben also auf deinem Gerät.',
    minutes: '{n} Min. Lesezeit',
    updated: 'Aktualisiert am {date}',
    summary: 'Kurz zusammengefasst',
    toolsTitle: 'Werkzeuge in dieser Anleitung',
    moreGuides: 'Weitere Anleitungen',
    related: 'Ähnliche Anleitungen',
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'pdf-auf-dem-handy-zusammenfuegen',
      title: 'PDFs auf dem Handy zusammenfügen, ohne sie hochzuladen | DocuSmart',
      description:
        'Schritt für Schritt mehrere PDFs auf dem Handy zu einer Datei zusammenfügen – kostenlos und ohne Upload auf einen Server. Funktioniert im Browser auf Android und iPhone.',
      h1: 'PDFs auf dem Handy zusammenfügen, ohne sie hochzuladen',
      lead: 'Personalausweis, Nachweis und Antragsformular in einem einzigen PDF: Das gehört zu den häufigsten Schritten bei einem Online-Antrag. So geht es am Handy in einer Minute, ohne deine Dokumente einem fremden Server zu überlassen.',
      sections: [
        {
          h2: 'Warum es wichtig ist, die Dateien nicht hochzuladen',
          body: [
            'Die meisten Websites zum Zusammenfügen von PDFs laden deine Dokumente auf ihre Server, verarbeiten sie dort und schicken dir das Ergebnis zurück. Bei einer Speisekarte ist das egal; bei einem Personalausweis, einem Kontoauszug oder einem Arztbefund nicht: Du weißt nicht, wie lange sie gespeichert werden und wer sie sehen kann.',
            'DocuSmart fügt die Dateien direkt im Browser deines Handys zusammen. Die Datei wird nie über das Internet übertragen, also gibt es auch keine Kopie auf einem Server. Deshalb funktioniert es auch bei schlechtem Empfang, sobald die Seite geladen ist.',
          ],
        },
        {
          h2: 'Bevor du loslegst',
          body: [
            { ul: [
              'Speichere die PDFs auf deinem Handy (unter Downloads, in der Dateien-App oder in deiner Cloud).',
              'Wenn eine davon ein Foto und kein PDF ist, wandle sie zuerst mit [Bild in PDF](/imagen-a-pdf) um.',
              'Wenn ein PDF ein Passwort hat, entferne es vorher mit [PDF entsperren](/desbloquear-pdf) (du musst das Passwort kennen).',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF zusammenfügen](/unir-pdf) im Browser deines Handys (Chrome, Safari, Samsung Internet oder welchen du auch nutzt). Tippe auf das Feld, um die Dateien auszuwählen: Du kannst mehrere auf einmal markieren.',
            'Prüfe die Reihenfolge der Liste. Die erste Datei bildet den Anfang des fertigen Dokuments; verschiebe die Dateien mit den Pfeilen, bis die Reihenfolge stimmt. Tippe dann auf „PDFs zusammenfügen“: Das kombinierte PDF wird mit allen Seiten heruntergeladen.',
            { tip: 'Du willst einzelne Seiten umsortieren und nicht ganze Dateien? Füge zuerst zusammen und öffne das Ergebnis dann in [PDF-Seiten sortieren](/ordenar-paginas-pdf), wo du jede Seite verschieben oder entfernen kannst.' },
          ],
        },
        {
          h2: 'Wenn das fertige PDF zu groß ist',
          body: [
            'Viele Behördenportale und E-Mail-Dienste begrenzen die Größe von Anhängen (2 MB, 5 MB oder 10 MB sind übliche Grenzen). Liegst du darüber, nutze [PDF komprimieren](/comprimir-pdf): Die Stufe „Verlustfrei“ lässt die Qualität unverändert, und „Mittel“ verkleinert PDFs aus Scans oder Fotos deutlich stärker.',
          ],
        },
        {
          h2: 'Wenn du das öfter machst',
          body: [
            'Die Website funktioniert auf jedem Handy. Wenn du Android nutzt und regelmäßig Dokumente zusammenfügst, erledigt die DocuSmart-App dasselbe offline und hält deine Dateien auf dem Handy geordnet.',
          ],
        },
      ],
      steps: [
        { name: 'PDF zusammenfügen öffnen', text: 'Öffne das Werkzeug PDF zusammenfügen auf docusmart.online im Browser deines Handys.' },
        { name: 'PDFs auswählen', text: 'Tippe auf das Feld und wähle alle Dateien aus, die du zusammenfügen willst.' },
        { name: 'Reihenfolge festlegen', text: 'Verschiebe die Dateien mit den Pfeilen: Die erste bildet den Anfang des Dokuments.' },
        { name: 'Zusammenfügen und herunterladen', text: 'Tippe auf „PDFs zusammenfügen“, und ein einziges PDF mit allen Seiten wird heruntergeladen.' },
      ],
      faq: [
        ['Funktioniert das auf dem iPhone?', 'Ja. Es funktioniert in Safari und in jedem modernen Browser, auf dem iPhone und auf Android. Die Offline-App gibt es nur für Android.'],
        ['Wie viele PDFs kann ich zusammenfügen?', 'Es gibt keine feste Anzahl. Die Grenze ist der Speicher deines Handys: Bei sehr großen Dokumenten kann es etwas länger dauern.'],
        ['Geht dabei Qualität verloren?', 'Nein. Die Seiten werden unverändert übernommen, mit ihrem ursprünglichen Text, ihren Bildern und ihrem Format.'],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'fotos-in-pdf',
      title: 'Fotos in PDF umwandeln (mehrere Fotos in einer Datei) | DocuSmart',
      description:
        'Wandle Fotos vom Handy oder PC in ein PDF um, ein Foto pro Seite. Kostenlos, ohne Anmeldung und ohne Upload. Mit Tipps für eine gut lesbare und kleine Datei.',
      h1: 'Fotos in PDF umwandeln, mehrere in einer Datei',
      lead: 'Verlangt wird „das Dokument als PDF“, und du hast nur Fotos in der Galerie. So machst du daraus ein ordentliches, gut lesbares und kleines PDF, ganz ohne Installation.',
      sections: [
        {
          h2: 'Zwei Wege, je nach Foto',
          body: [
            { ul: [
              '**Fotos, die schon gut aussehen** (Screenshots, heruntergeladene Bilder, gerade von vorne aufgenommene Fotos): Nutze [Bild in PDF](/imagen-a-pdf). Jedes Foto wird unverändert zu einer Seite.',
              '**Fotos von einem Blatt Papier** (eine Quittung, ein Vertrag, eine Bescheinigung): Nutze [Dokument scannen](/escanear-documento). Das Werkzeug findet die Ränder des Blatts, richtet es gerade aus und hellt das Papier auf, damit es wie gescannt aussieht.',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt mit Bild in PDF',
          body: [
            'Öffne [Bild in PDF](/imagen-a-pdf) und wähle deine Bilder aus. Unterstützt werden JPG, PNG, WebP, BMP und GIF, auch gemischt.',
            'Bring sie mit den Pfeilen in die richtige Reihenfolge: Jedes Bild wird eine Seite, in genau dieser Reihenfolge. Tippe auf „Konvertieren“ – fertig ist dein PDF.',
          ],
        },
        {
          h2: 'So wird das Foto gut lesbar',
          body: [
            { ul: [
              'Gleichmäßiges Licht, kein direkter Blitz: Schatten von deiner Hand oder vom Handy erschweren das Lesen.',
              'Das Blatt auf einer dunklen Unterlage (zum Beispiel einem Holztisch): So findet der Scanner die Ränder leichter.',
              'Das Handy parallel zum Blatt halten, nicht schräg.',
              'Das ganze Blatt muss zu sehen sein, mit etwas Rand drumherum.',
            ] },
            { tip: 'In [Dokument scannen](/escanear-documento) kannst du „PDF durchsuchbar machen“ aktivieren: Der Text wird erkannt, damit man ihn durchsuchen und kopieren kann – das schätzen manche Portale.' },
          ],
        },
        {
          h2: 'Damit die Datei nicht zu groß wird',
          body: [
            'Ein Foto von einem modernen Handy kann 3 oder 4 MB groß sein; zehn Fotos ergeben schon ein PDF, das für eine E-Mail zu schwer ist. Ist das Ergebnis groß, schick es durch [PDF komprimieren](/comprimir-pdf) mit der Stufe „Mittel“, die Seiten aus Fotos stark verkleinert. Du kannst die Fotos auch vorher mit [Bild komprimieren](/comprimir-imagen) verkleinern.',
          ],
        },
        {
          h2: 'Wenn du ein iPhone hast',
          body: [
            'Wenn du Fotos in Safari auswählst, liefert das iPhone sie normalerweise als JPG, sie funktionieren also ohne weitere Schritte. Hast du die Fotos auf den Computer kopiert und sie erscheinen als .HEIC-Dateien, lässt sich dieses Format hier noch nicht umwandeln.',
            'Damit dein iPhone künftige Fotos als JPG speichert, öffne Einstellungen › Kamera › Formate und wähle „Maximale Kompatibilität“. Fotos, die du schon hast, sendest du über die Teilen-Funktion der Fotos-App an deinen Computer: Dann kommen sie meist bereits als JPG an.',
          ],
        },
        {
          h2: 'Deine Fotos bleiben auf deinem Gerät',
          body: [
            'Die Umwandlung findet in deinem Browser statt: Die Fotos werden auf keinen Server hochgeladen. Das ist wichtig, wenn es sich um Ausweisdokumente oder Gesundheitsdaten handelt.',
          ],
        },
      ],
      steps: [
        { name: 'Bild in PDF öffnen', text: 'Öffne das Werkzeug Bild in PDF auf docusmart.online.' },
        { name: 'Fotos auswählen', text: 'Wähle die Bilder aus (JPG, PNG, WebP, BMP oder GIF).' },
        { name: 'Reihenfolge festlegen', text: 'Nutze die Pfeile: Jedes Bild wird eine Seite, in dieser Reihenfolge.' },
        { name: 'Konvertieren', text: 'Tippe auf „Konvertieren“, um ein einziges PDF zu erhalten.' },
      ],
      faq: [
        ['Kann ich mehrere Fotos auf eine Seite setzen?', 'Bild in PDF setzt ein Foto pro Seite – so verlangen es die meisten Anträge. Wenn du mehrere auf einem Blatt brauchst, füge sie vorher zu einem einzigen Bild zusammen.'],
        ['Was ist der Unterschied zum Scannen?', 'Dokument scannen schneidet das Blatt zu, richtet es gerade aus und verbessert den Kontrast; Bild in PDF lässt das Foto, wie es ist. Bei Papierdokumenten liefert das Scannen ein saubereres Ergebnis.'],
        ['Funktioniert das ohne Internet?', 'Sobald die Seite geöffnet ist, braucht die Umwandlung keine Verbindung. Wenn du DocuSmart Desktop oder die Android-App installierst, funktioniert alles komplett offline.'],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'pdf-verkleinern',
      title: 'PDF verkleinern für E-Mail, WhatsApp oder Online-Anträge | DocuSmart',
      description:
        'Warum ein PDF so groß ist und wie du es verkleinerst, ohne dass es unleserlich wird. Welche Komprimierungsstufe zu welchem Dokument passt. Kostenlos und ohne Upload.',
      h1: 'So verkleinerst du ein PDF',
      lead: '„Die Datei überschreitet die maximal zulässige Größe.“ Wenn du diese Meldung auf einem Portal oder in deinem E-Mail-Programm bekommen hast, erklärt diese Anleitung, warum das passiert und wie du es behebst, ohne dass das Dokument unleserlich wird.',
      sections: [
        {
          h2: 'Warum ein PDF so groß ist',
          body: [
            'Am meisten Platz nehmen in einem PDF die Bilder ein. Ein reines Textdokument aus Word hat meist nur ein paar hundert Kilobyte, selbst mit vielen Seiten. Eines aus Fotos oder von einem Scanner mit hoher Auflösung kann schon bei wenigen Seiten locker über 10 MB kommen.',
            'Deshalb wirkt die Komprimierung je nach PDF-Typ sehr unterschiedlich: Bei einem Textdokument gibt es wenig zu verkleinern, bei einem Scan sehr viel.',
          ],
        },
        {
          h2: 'Welche Stufe du wählen solltest',
          body: [
            { ul: [
              '**Verlustfrei:** optimiert die Struktur der Datei, ohne die Qualität anzutasten. Der Text bleibt markierbar. Die sichere Wahl für Verträge, Rechnungen und digitale Dokumente.',
              '**Mittel:** empfohlen für Scans und Fotos. Verkleinert die Datei stark und bleibt gut lesbar.',
              '**Hoch:** für sehr strenge Größengrenzen. Achtung: Bei den Stufen Mittel und Hoch wird der Text zu einem Bild und lässt sich nicht mehr markieren.',
            ] },
            { tip: 'Fang mit „Verlustfrei“ an. Reicht das für die nötige Größe nicht, probier „Mittel“. DocuSmart zeigt dir, wie stark die Datei verkleinert wurde, bevor du sie verschickst.' },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF komprimieren](/comprimir-pdf), wähle die Datei und die Stufe. Tippe auf „PDF komprimieren“: Du siehst die Größe vorher und nachher, und das Ergebnis wird heruntergeladen.',
            'Wenn das PDF schon optimiert war und sich nicht weiter verkleinern lässt, sagt dir DocuSmart Bescheid und lädt keine gleich große oder größere Kopie herunter.',
          ],
        },
        {
          h2: 'Wenn es immer noch nicht reicht',
          body: [
            { ul: [
              '**Teile das Dokument auf:** Viele Portale akzeptieren mehrere Anhänge. Mit [PDF teilen](/dividir-pdf) zerlegst du es in zwei oder mehr Dateien.',
              '**Komprimiere die Fotos, bevor du das PDF erstellst:** [Bild komprimieren](/comprimir-imagen) verkleinert ein Handyfoto um 60 bis 90 % fast ohne sichtbaren Unterschied.',
              '**Entferne überflüssige Seiten:** Mit [PDF-Seiten sortieren](/ordenar-paginas-pdf) löschst du Deckblätter oder leere Seiten.',
            ] },
          ],
        },
        {
          h2: 'Übliche Grenzen',
          body: [
            'Zur Orientierung: Gmail erlaubt Anhänge bis 25 MB, Outlook bis 20 MB. Viele Behörden- und Bankportale verlangen zwischen 2 und 5 MB pro Datei. Prüfe immer die Grenze der Website, auf die du die Datei hochlädst.',
          ],
        },
      ],
      steps: [
        { name: 'PDF komprimieren öffnen', text: 'Öffne das Werkzeug PDF komprimieren auf docusmart.online.' },
        { name: 'Datei auswählen', text: 'Wähle das PDF aus, das zu groß ist.' },
        { name: 'Stufe wählen', text: '„Verlustfrei“ für digitale Dokumente; „Mittel“ oder „Hoch“ für Scans und Fotos.' },
        { name: 'Komprimieren', text: 'Tippe auf „PDF komprimieren“, prüfe, wie stark es verkleinert wurde, und lade das Ergebnis herunter.' },
      ],
      faq: [
        ['Schadet die Komprimierung dem Dokument?', 'Mit „Verlustfrei“ nicht: Der Inhalt bleibt identisch. Mit „Mittel“ und „Hoch“ werden die Seiten zu kleineren Bildern, die gut lesbar sind, aber keinen markierbaren Text mehr enthalten.'],
        ['Wird mein PDF ins Internet hochgeladen?', 'Nein. Die Komprimierung findet in deinem Browser statt: Die Datei verlässt nie dein Gerät.'],
        ['Warum ist mein PDF kaum kleiner geworden?', 'Wahrscheinlich ist es ein Text-PDF oder es war schon optimiert. Dann ist die Datei bereits klein, und es gibt wenig zu entfernen.'],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'pdf-ohne-drucken-unterschreiben',
      title: 'PDF unterschreiben ohne Drucken (am Handy oder PC) | DocuSmart',
      description:
        'Unterschreibe ein PDF ohne Drucken und Scannen: Zeichne deine Unterschrift, tippe sie oder nutze ein Foto. Was eine einfache elektronische Signatur gilt. Kostenlos und privat.',
      h1: 'PDF unterschreiben, ohne es auszudrucken',
      lead: 'Ausdrucken, mit Kugelschreiber unterschreiben, einscannen und zurückschicken: vier Schritte, die du durch einen ersetzen kannst. So unterschreibst du ein PDF am Handy oder am Computer.',
      sections: [
        {
          h2: 'Drei Wege zu deiner Unterschrift',
          body: [
            { ul: [
              '**Zeichnen** – mit dem Finger am Handy oder mit der Maus am Computer.',
              '**Deinen Namen tippen**, der dann in einer Handschrift angezeigt wird.',
              '**Ein Foto hochladen** von deiner Unterschrift auf Papier. Das kommt deiner gewohnten Unterschrift am nächsten.',
            ] },
            { tip: 'Für das Foto: Unterschreibe mit dunkler Tinte auf weißem Papier, bei gutem Licht und ohne Schatten. DocuSmart entfernt den Hintergrund, sodass nur der Strich übrig bleibt.' },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF unterschreiben](/firmar-pdf) und wähle das Dokument. Erstelle deine Unterschrift auf eine der drei Arten.',
            'Zieh sie an die Stelle, an der unterschrieben werden soll, und pass die Größe an. Wenn das Dokument auf jeder Seite eine Paraphe verlangt, nutze „Auf allen Seiten wiederholen“. Tippe auf „PDF unterschreiben“.',
          ],
        },
        {
          h2: 'Wenn auch Angaben auszufüllen sind',
          body: [
            'Viele Dokumente zum Unterschreiben sind Formulare: Name, Ausweisnummer, Datum. Hat das PDF ausfüllbare Felder, fülle sie zuerst mit [PDF-Formular ausfüllen](/llenar-formulario-pdf) aus und unterschreibe dann. Aktiviere vor dem Versenden „Formular reduzieren“, damit die Antworten fixiert sind.',
          ],
        },
        {
          h2: 'Typische Fehler beim Unterschreiben',
          body: [
            { ul: [
              '**Winzige oder verpixelte Unterschrift:** Vergrößere sie, bis sie die Unterschriftszeile ausfüllt; stammt sie von einem Foto, nimm es aus der Nähe und bei gutem Licht auf.',
              '**Unterschrift über dem Text:** Verschieb sie, bis sie keine Angaben im Dokument verdeckt; ein Vertrag mit der Unterschrift über einer Klausel kann Zweifel wecken.',
              '**Die falsche Version unterschreiben:** Prüfe vor dem Unterschreiben, ob es die endgültige Fassung ist; nachträgliche Korrekturen bedeuten, dass du erneut unterschreiben musst.',
              '**Die anderen Seiten vergessen:** Verlangt das Dokument auf jeder Seite eine Unterschrift oder Paraphe, nutze „Auf allen Seiten wiederholen“, statt Seite für Seite vorzugehen.',
            ] },
          ],
        },
        {
          h2: 'Ist das rechtlich gültig?',
          body: [
            'Du erhältst eine **einfache elektronische Signatur**: das Bild deiner Unterschrift auf dem Dokument, das digitale Gegenstück zur Unterschrift von Hand. Sie reicht für die meisten Alltagsangelegenheiten: Mietverträge, Vollmachten, Firmenformulare oder Einverständniserklärungen für die Schule.',
            'Manche Vorgänge verlangen eine **qualifizierte elektronische Signatur mit Zertifikat**, ausgestellt von einem zugelassenen Vertrauensdiensteanbieter nach eIDAS; zum Beispiel bestimmte Erklärungen gegenüber Behörden oder Verträge, für die das Gesetz die Schriftform vorschreibt. Wenn der Vorgang sie ausdrücklich verlangt, reicht eine Unterschrift als Bild nicht aus.',
          ],
        },
        {
          h2: 'Deine Unterschrift wird nirgends gespeichert',
          body: [
            'Unterschrift und Dokument werden im Browser verarbeitet. Sie werden weder auf einen Server hochgeladen noch gespeichert: Wenn du die Seite schließt, ist die Unterschrift gelöscht. Wenn du das Dokument über einen wenig vertrauenswürdigen Kanal verschickst, kannst du es mit [PDF schützen](/proteger-pdf) mit einem Passwort versehen.',
          ],
        },
      ],
      steps: [
        { name: 'PDF unterschreiben öffnen', text: 'Öffne das Werkzeug PDF unterschreiben auf docusmart.online und wähle das Dokument.' },
        { name: 'Unterschrift erstellen', text: 'Zeichne sie, tippe deinen Namen oder lade ein Foto deiner Unterschrift auf Papier hoch.' },
        { name: 'Platzieren', text: 'Zieh sie an ihren Platz und pass die Größe an; du kannst sie auf allen Seiten wiederholen.' },
        { name: 'Herunterladen', text: 'Tippe auf „PDF unterschreiben“, um das unterschriebene PDF zu erhalten.' },
      ],
      faq: [
        ['Kann ich am Handy unterschreiben?', 'Ja. Am Handy kannst du die Unterschrift mit dem Finger zeichnen oder deine Unterschrift auf Papier fotografieren.'],
        ['Lässt sich das unterschriebene Dokument ändern?', 'Die Unterschrift ist fest in die Seite eingebettet. Um Änderungen und unerwünschte Zugriffe zu verhindern, kannst du das PDF mit einem Passwort schützen und die Berechtigung zum Ändern entfernen.'],
        ['Kann ich mehrere Seiten unterschreiben?', 'Ja: Füge die Unterschrift auf jeder gewünschten Seite ein oder nutze „Auf allen Seiten wiederholen“.'],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'dokumente-mit-dem-handy-scannen',
      title: 'Dokumente mit dem Handy scannen und als PDF speichern | DocuSmart',
      description:
        'Scanne Dokumente mit der Handykamera, ohne App: automatischer Zuschnitt, Filter gegen Schatten und PDF mit durchsuchbarem Text. Plus Tipps für einen scharfen Scan.',
      h1: 'Dokumente mit dem Handy scannen',
      lead: 'Du brauchst weder einen Scanner noch eine App: Handykamera und Browser reichen für ein sauberes, zugeschnittenes PDF mit erkanntem Text.',
      sections: [
        {
          h2: 'Was ein Scanner macht (und warum ein Foto allein nicht reicht)',
          body: [
            'Ein Foto von einem Blatt wird fast nie perfekt: Es ist leicht schief, der Tisch ist drumherum zu sehen, und das weiße Papier wirkt grau oder hat Schatten. Ein Handy-Scanner korrigiert das: Er findet die vier Ecken des Blatts, richtet es so aus, als hättest du es senkrecht von oben fotografiert, und hellt den Hintergrund auf.',
            'Genau das macht [Dokument scannen](/escanear-documento), direkt im Browser.',
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [Dokument scannen](/escanear-documento) und tippe auf „Foto aufnehmen“: Am Handy öffnet sich die Kamera. Du kannst auch Fotos auswählen, die du schon hast.',
            'Prüfe die Ecken, die DocuSmart gefunden hat; sitzt eine falsch, zieh sie an die Spitze des Blatts. Wähle den Filter „Dokument“, um das Papier aufzuhellen und Schatten zu entfernen. Füge weitere Seiten hinzu, wenn das Dokument mehrere Blätter hat.',
            'Tippe auf „PDF erstellen“. Wenn du „PDF durchsuchbar machen“ aktivierst, wird zusätzlich der Text erkannt, sodass du nach Wörtern suchen und sie kopieren kannst.',
          ],
        },
        {
          h2: 'Fünf Tipps für einen scharfen Scan',
          body: [
            { ul: [
              'Leg das Blatt auf eine dunkle Unterlage: Der Kontrast hilft beim Erkennen der Ränder.',
              'Nutze Tageslicht oder eine Lampe von der Seite; vermeide direkten Blitz, der Spiegelungen erzeugt.',
              'Halte das Handy parallel zum Blatt und warte, bis es scharf gestellt hat.',
              'Streiche das Blatt gut glatt: Knicke werfen Schatten, die der Filter nicht immer entfernt.',
              'Scanne mehrere Seiten in derselben Sitzung, dann landen sie in einem einzigen PDF.',
            ] },
          ],
        },
        {
          h2: 'Text in einem vorhandenen Scan erkennen',
          body: [
            'Wenn du schon ein gescanntes PDF oder ein Foto hast und den Text kopieren musst, nutze [OCR](/ocr-pdf): Es erkennt gedruckten Text in 12 Sprachen (Deutsch, Englisch, Spanisch, Französisch, Russisch, Japanisch, Chinesisch und mehr) und gibt ihn dir zum Kopieren, als .txt-Datei oder als durchsuchbares PDF. Am besten klappt es mit scharfen, geraden Scans; Handschrift wird meist schlecht erkannt.',
          ],
        },
        {
          h2: 'Privat von Anfang bis Ende',
          body: [
            'Kantenerkennung, Ausrichtung, Filter und Texterkennung laufen in deinem Browser. Die Fotos werden auf keinen Server hochgeladen. Wenn du oft scannst, erledigt die DocuSmart-App für Android dasselbe offline.',
          ],
        },
      ],
      steps: [
        { name: 'Dokument scannen öffnen', text: 'Öffne das Werkzeug Dokument scannen auf docusmart.online und tippe auf „Foto aufnehmen“.' },
        { name: 'Ecken anpassen', text: 'Prüfe den Zuschnitt und zieh die Ecken bei Bedarf zurecht.' },
        { name: 'Filter wählen', text: 'Der Filter „Dokument“ hellt das Papier auf und entfernt Schatten.' },
        { name: 'PDF speichern', text: 'Tippe auf „PDF erstellen“; aktiviere „PDF durchsuchbar machen“, um den Text zu erkennen.' },
      ],
      faq: [
        ['Muss ich eine App installieren?', 'Nein. Es funktioniert im Browser auf dem Handy oder Computer. Die Android-App ist optional, zum Scannen ohne Verbindung.'],
        ['Was ist ein durchsuchbares PDF?', 'Ein PDF, das neben dem Bild auch den erkannten Text enthält: Du kannst nach Wörtern suchen, sie markieren und kopieren.'],
        ['Was tun, wenn die Ränder nicht richtig erkannt werden?', 'Zieh jede Ecke an die Spitze des Blatts oder nutze „Ganzes Foto“. Es hilft, wenn sich das Papier vom Hintergrund abhebt.'],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'pdf-mit-passwort-schuetzen',
      title: 'PDF mit Passwort schützen (und wann es sinnvoll ist) | DocuSmart',
      description:
        'Schütze ein PDF mit Passwort und AES-256-Verschlüsselung, lege fest, ob es gedruckt oder kopiert werden darf, und teile das Passwort sicher. Kostenlos und ohne Upload.',
      h1: 'PDF mit einem Passwort schützen',
      lead: 'Ein PDF mit persönlichen, finanziellen oder medizinischen Daten, das per E-Mail oder Chat unterwegs ist, kann überall landen. Ein Passwort ist in einer Minute gesetzt und verhindert, dass Unbefugte es öffnen.',
      sections: [
        {
          h2: 'Wann es sich lohnt, ein PDF zu schützen',
          body: [
            { ul: [
              'Ausweisdokumente, Kontoauszüge, Gehaltsabrechnungen oder Steuererklärungen.',
              'Arztbriefe, Laborbefunde oder Krankschreibungen.',
              'Verträge oder Angebote, die nicht die Runde machen sollen.',
              'Jede Datei, die du über einen Kanal verschickst, den du nicht kontrollierst, etwa eine E-Mail, die weitergeleitet wird, oder einen Gruppenchat.',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF schützen](/proteger-pdf) und wähle das Dokument. Gib das Passwort zweimal ein.',
            'Lege fest, was bei geöffnetem PDF erlaubt ist: Drucken, Text kopieren oder Ändern. Tippe auf „PDF schützen“, und die verschlüsselte Version wird heruntergeladen. Sie lässt sich mit Adobe Acrobat, Chrome, Edge und der DocuSmart-App öffnen, die nach dem Passwort fragen.',
          ],
        },
        {
          h2: 'Ein gutes Passwort und wie du es weitergibst',
          body: [
            { ul: [
              'Nimm mindestens 10 Zeichen; ein kurzer Satz mit Zahlen ist leicht zu merken und schwer zu erraten.',
              'Verwende nicht deine Ausweisnummer oder dein Geburtsdatum: Das ist das Erste, was jemand ausprobieren würde.',
              '**Schick das Passwort nie über denselben Weg wie das PDF.** Geht die Datei per E-Mail raus, schick das Passwort per Nachricht oder sag es am Telefon.',
            ] },
            { tip: 'Bewahre das Passwort an einem sicheren Ort auf. Wenn du es vergisst, lässt es sich nicht wiederherstellen: Nicht einmal DocuSmart kann das PDF öffnen, denn das Passwort verlässt nie dein Gerät.' },
          ],
        },
        {
          h2: 'Was jede Option schützt',
          body: [
            'Das **Passwort zum Öffnen** ist der eigentliche Schutz: Ohne es lässt sich die verschlüsselte Datei nicht lesen. Die **Berechtigungen** (Drucken, Kopieren, Ändern) sind etwas anderes: Sie teilen PDF-Programmen mit, was sie bei geöffnetem Dokument erlauben sollen.',
            'Seriöse Programme halten sich an diese Berechtigungen, aber wer das Passwort schon hat, kann sie mit manchen Werkzeugen entfernen. Nutze sie gegen versehentliches Kopieren oder beiläufige Änderungen, nicht als einzige Hürde. Soll jemand eine Angabe nicht sehen, gib ihm das Passwort nicht oder schwärze die Angabe, bevor du die Datei verschickst.',
          ],
        },
        {
          h2: 'Passwort ist nicht dasselbe wie Schwärzen',
          body: [
            'Das Passwort verhindert, dass die Datei geöffnet wird, aber wer es kennt, sieht den ganzen Inhalt. Wenn du ein Dokument teilen und nur bestimmte Angaben verbergen willst (eine IBAN, eine Adresse), nutze [PDF schwärzen](/censurar-pdf): Es löscht den Text unter den abgedeckten Stellen wirklich, statt nur einen schwarzen Balken darüberzulegen.',
          ],
        },
        {
          h2: 'Das Passwort später entfernen',
          body: [
            'Brauchst du später eine ungeschützte Kopie, entfernt [PDF entsperren](/desbloquear-pdf) das Passwort – vorausgesetzt, du kennst es. Nutze das nur bei eigenen Dokumenten oder solchen, die du ändern darfst.',
          ],
        },
      ],
      steps: [
        { name: 'PDF schützen öffnen', text: 'Öffne das Werkzeug PDF mit Passwort schützen auf docusmart.online und wähle das Dokument.' },
        { name: 'Passwort eingeben', text: 'Gib es zweimal ein, um es zu bestätigen.' },
        { name: 'Berechtigungen wählen', text: 'Lege fest, ob Drucken, Kopieren oder Ändern erlaubt ist.' },
        { name: 'Schützen und herunterladen', text: 'Tippe auf „PDF schützen“, und das verschlüsselte Dokument wird heruntergeladen.' },
      ],
      faq: [
        ['Wie sicher ist das?', 'Es nutzt AES-256-Verschlüsselung, den stärksten Standard für PDFs. Wie sicher es wirklich ist, hängt davon ab, dass das Passwort schwer zu erraten ist.'],
        ['Wird mein Passwort an einen Server geschickt?', 'Nein. Die Verschlüsselung findet in deinem Browser statt; weder die Datei noch das Passwort verlassen dein Gerät.'],
        ['Kann ich das Passwort vom PDF einer anderen Person entfernen?', 'Nur wenn du das Passwort kennst. DocuSmart knackt keine Passwörter zum Öffnen.'],
      ],
    },
  },
}
