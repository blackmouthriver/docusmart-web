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
    'dividir-pdf-en-varios-archivos': {
      slug: 'pdf-in-mehrere-dateien-teilen',
      title: 'PDF in mehrere Dateien teilen oder einzelne Seiten extrahieren | DocuSmart',
      description:
        'Teile ein PDF nach Seiten, Bereichen, alle N Seiten, nach Lesezeichen oder Größe, oder extrahiere nur die Seiten, die du brauchst. Kostenlos und ohne Upload.',
      h1: 'PDF in mehrere Dateien teilen oder nur einzelne Seiten extrahieren',
      lead: 'Ein Portal will nur die Seite mit der Unterschrift, oder ein PDF mit 80 Seiten passt nicht in die E-Mail. So teilst du ein PDF in Teile oder holst genau die Seiten heraus, die du brauchst, direkt im Browser.',
      sections: [
        {
          h2: 'Sechs Arten zu teilen',
          body: [
            'Bevor du anfängst, solltest du wissen, was du brauchst, denn [PDF teilen](/dividir-pdf) hat für jeden Fall einen eigenen Modus:',
            { ul: [
              '**Seiten auswählen**: Du tippst auf die Miniaturen (oder schreibst „1-3, 5“) und bekommst ein PDF nur mit diesen Seiten.',
              '**Nach Bereichen**: mehrere Bereiche auf einmal, und jeder wird zu einem eigenen PDF.',
              '**Alle N Seiten**: gleich große Teile, zum Beispiel je 10 Seiten.',
              '**Nach Lesezeichen**: ein PDF pro Kapitel, wenn das Dokument ein Lesezeichen-Verzeichnis hat.',
              '**Nach Größe**: Teile, die eine bestimmte Dateigröße nicht überschreiten, für E-Mails oder Portale mit Limit.',
              '**Jede Seite einzeln**: ein PDF pro Seite.',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF teilen](/dividir-pdf) und wähle die Datei. Du siehst ihre Seiten als Miniaturen. Tippe unter „Seiten auswählen“ auf die Seiten, die du mitnehmen willst: Sie werden blau markiert, und das Feld oben füllt sich von selbst.',
            'Tippe auf die Schaltfläche unten. Danach siehst du das Ergebnis neben dem Original, kannst es prüfen und unter einem beliebigen Namen herunterladen. Erzeugt der Modus mehrere Dateien, bekommst du sie einzeln oder alle zusammen als ZIP.',
            { tip: 'Willst du einzelne Seiten aus mehreren PDFs in einem zusammenfassen, geht es mit [PDF zusammenfügen](/unir-pdf) schneller: Dort wählst du aus jeder Datei die Seiten aus, die du übernehmen willst.' },
          ],
        },
        {
          h2: 'Wenn die Teile immer noch zu groß sind',
          body: [
            'Teilen verändert die Qualität nicht: Jede Seite wird unverändert kopiert. Liegt ein Teil trotzdem über dem Limit, nutze den Modus **Nach Größe** oder schick ihn durch [PDF komprimieren](/comprimir-pdf). Eine einzige, sehr hoch aufgelöst gescannte Seite kann allein schon größer als das Limit sein: Dann hilft nur Komprimieren.',
          ],
        },
        {
          h2: 'Typische Fälle',
          body: [
            { ul: [
              'Ein Portal will nur Vorder- und Rückseite deines Ausweises: Wähle diese beiden Seiten und lade nur dieses PDF hoch.',
              'Ein Kontoauszug für das ganze Jahr: Hat er Lesezeichen pro Monat, nutze **Nach Lesezeichen**, sonst **Alle N Seiten**.',
              'Eine E-Mail mit 10 MB Limit: Nutze **Nach Größe**, gib 10 ein, und jeder Teil bleibt darunter.',
            ] },
          ],
        },
        {
          h2: 'Dein Dokument bleibt auf deinem Gerät',
          body: [
            'Das Teilen passiert in deinem Browser: Das PDF wird auf keinen Server hochgeladen. Deshalb kannst du es auch mit Kontoauszügen, Patientenakten oder Verträgen nutzen, ohne irgendwo Kopien zu hinterlassen.',
          ],
        },
      ],
      steps: [
        { name: 'PDF teilen öffnen', text: 'Öffne das Werkzeug PDF teilen auf docusmart.online und wähle die Datei.' },
        { name: 'Modus wählen', text: 'Seiten auswählen, nach Bereichen, alle N Seiten, nach Lesezeichen, nach Größe oder jede Seite einzeln.' },
        { name: 'Seiten markieren', text: 'Tippe auf die Miniaturen oder gib die Seitenzahlen ein (zum Beispiel 1-3, 5).' },
        { name: 'Teilen und herunterladen', text: 'Tippe auf die Schaltfläche und lade das Ergebnis herunter, oder alle Dateien als ZIP.' },
      ],
      faq: [
        ['Geht beim Teilen Qualität verloren?', 'Nein. Die Seiten werden unverändert kopiert, mit ihrem ursprünglichen Text und ihren Bildern.'],
        ['Kann ich ein PDF mit Passwort teilen?', 'Wenn es nur Einschränkungen hat (es öffnet sich ohne Passwort), ja. Verlangt es zum Öffnen ein Passwort, entferne es zuerst mit PDF entsperren.'],
        ['Was passiert mit den Lesezeichen?', 'Im Modus Nach Lesezeichen wird jedes Kapitel des Verzeichnisses zu einem eigenen PDF mit dem Namen des Lesezeichens.'],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'pdf-seiten-drehen',
      title: 'PDF-Seiten drehen und dauerhaft so speichern | DocuSmart',
      description:
        'Richte seitlich oder kopfüber gescannte Seiten aus: Drehe eine oder alle Seiten um 90° nach links oder rechts und speichere das PDF gerade. Kostenlos, ohne Upload.',
      h1: 'PDF-Seiten drehen (und so speichern, dass es bleibt)',
      lead: 'Bei Scans passiert das ständig: Ein Blatt im Querformat liegt auf der Seite, oder eine Seite steht kopf. Im Viewer zu drehen hilft nicht, denn beim Verschicken ist sie wieder verdreht. So korrigierst du es in der Datei selbst.',
      sections: [
        {
          h2: 'Warum Drehen im Viewer nicht reicht',
          body: [
            'PDF-Viewer lassen dich die Ansicht drehen, aber diese Drehung wird nicht in der Datei gespeichert: Wer sie bekommt, sieht sie wieder schief. Damit es passt, muss die Ausrichtung der Seite im PDF selbst geändert werden, und genau das macht [PDF drehen](/rotar-pdf).',
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF drehen](/rotar-pdf) und wähle die Datei. Jede Seite erscheint als Miniatur, darunter ihre aktuelle Drehung (0°, 90° …). Tippe auf eine Seite, um sie um 90° zu drehen, oder nutze ihre Pfeile für links oder rechts. Liegt das ganze Dokument auf der Seite, nimm „Alle nach links“ oder „Alle nach rechts“.',
            'Wenn alle Seiten gerade stehen, tippe auf „PDF drehen“ und lade das Ergebnis herunter. Nur die Ausrichtung ändert sich: Text, Bilder und Qualität bleiben gleich.',
            { tip: 'Sind die Seiten außerdem durcheinandergeraten (passiert beim beidseitigen Scannen), mach mit [PDF-Seiten sortieren](/ordenar-paginas-pdf) weiter.' },
          ],
        },
        {
          h2: 'Schief gescannte Seiten',
          body: [
            'Drehen hilft bei Blättern, die auf der Seite liegen oder kopfstehen, in Schritten von 90°. Ist das Foto um ein paar Grad schief, scanne es besser neu mit [Dokument scannen](/escanear-documento): Das Werkzeug erkennt die Ränder des Blatts und richtet es selbst gerade aus.',
          ],
        },
        {
          h2: 'Typische Fälle',
          body: [
            'Beim beidseitigen Scannen steht die Rückseite oft kopf: Tippe zweimal auf diese Seiten, um sie um 180° zu drehen. In einem Bericht mit Tabellen im Querformat drehst du nur diese Seiten, damit man sie lesen kann, ohne den Kopf zu neigen; die anderen bleiben, wie sie sind.',
            'Stammt das PDF aus Handyfotos, achte schon beim Erstellen auf die Ausrichtung: [Bild in PDF](/imagen-a-pdf) bietet automatische Ausrichtung, Hoch- oder Querformat, dann musst du später nichts drehen.',
          ],
        },
        {
          h2: 'Privat von Anfang bis Ende',
          body: [
            'Das PDF wird in deinem Browser gedreht. Es wird auf keinen Server hochgeladen und nirgends gespeichert: Wenn du den Tab schließt, ist es weg. Es funktioniert am PC genauso wie am Handy, und sobald die Seite geladen ist, brauchst du keinen guten Empfang.',
          ],
        },
      ],
      steps: [
        { name: 'PDF drehen öffnen', text: 'Öffne das Werkzeug PDF drehen auf docusmart.online und wähle das PDF.' },
        { name: 'Seiten drehen', text: 'Tippe auf jede Seite, die verdreht ist, oder nutze Alle nach links bzw. Alle nach rechts.' },
        { name: 'Speichern', text: 'Tippe auf PDF drehen und lade die gerade ausgerichtete Datei herunter.' },
      ],
      faq: [
        ['Kann ich nur eine Seite drehen?', 'Ja. Jede Seite wird einzeln gedreht; die anderen bleiben, wie sie waren.'],
        ['Geht Qualität verloren?', 'Nein. Nur die Ausrichtung der Seite ändert sich; der Inhalt wird nicht neu komprimiert.'],
        ['Funktioniert das auf dem Handy?', 'Ja, in jedem modernen Browser, auf Android und auf dem iPhone.'],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'pdf-seitenreihenfolge-aendern',
      title: 'Die Reihenfolge der Seiten in einem PDF ändern | DocuSmart',
      description:
        'Verschiebe PDF-Seiten per Drag-and-drop, dupliziere eine, füge leere Seiten ein oder entferne überflüssige und speichere die neue Reihenfolge. Kostenlos, ohne Upload.',
      h1: 'Die Reihenfolge der Seiten in einem PDF ändern',
      lead: 'Ein beidseitiger Scan, der durcheinander herauskam, ein Anhang, der nach vorn gehört, oder eine doppelte Seite: So bringst du ein PDF Seite für Seite in Ordnung.',
      sections: [
        {
          h2: 'Was du mit jeder Seite machen kannst',
          body: [
            'In [PDF-Seiten sortieren](/ordenar-paginas-pdf) ist jede Seite eine Karte, und damit kannst du:',
            { ul: [
              '**Verschieben**: per Drag-and-drop an ihren Platz oder mit den Pfeilen für davor und danach (am Handy bequemer).',
              '**Duplizieren**: zum Beispiel, um ein Deckblatt oder ein Unterschriftenblatt zu wiederholen.',
              '**Eine leere Seite einfügen** dahinter, um Platz zu lassen oder Abschnitte zu trennen.',
              '**Entfernen**, wenn sie überflüssig ist.',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF-Seiten sortieren](/ordenar-paginas-pdf) und wähle das PDF. Verschiebe die Seiten, bis sie so liegen, wie du sie brauchst: Die Nummer auf jeder Karte („S. 2“, „S. 1“ …) zeigt dir, woher sie kam, so verlierst du nicht den Überblick.',
            'Stimmt die Reihenfolge, tippe auf „Neue Reihenfolge anwenden“ und lade das PDF herunter. Die Seiten werden unverändert kopiert: Weder Text noch Qualität ändern sich.',
            { tip: 'Liegen die Seiten, die du sortieren willst, in mehreren Dateien, füge sie zuerst mit [PDF zusammenfügen](/unir-pdf) zusammen und sortiere sie dann hier.' },
          ],
        },
        {
          h2: 'Zum Herausnehmen von Seiten lieber teilen',
          body: [
            'Willst du nur einige Seiten behalten, geht es mit [PDF teilen](/dividir-pdf) schneller: Du markierst die Seiten, die du brauchst, und fertig. Sortieren ist richtig, wenn das ganze Dokument bleibt, nur in anderer Reihenfolge.',
          ],
        },
        {
          h2: 'Typische Fälle',
          body: [
            'Scannst du beidseitig mit einem Gerät, das das nicht selbst kann, kommen erst alle Vorderseiten und dann alle Rückseiten. Um sie zu verschachteln, schiebst du die letzte Seite hinter die erste, die vorletzte hinter die dritte und so weiter bis zum Ende: Mit den Pfeilen geht das schnell.',
            { ul: [
              'Ein Anhang, der an den Anfang gehört: Schieb ihn vor die erste Seite.',
              'Ein Unterschriftenblatt, das an zwei Stellen gebraucht wird: Dupliziere es und schieb die Kopie dorthin, wo sie hingehört.',
              'Kapitel, die beim beidseitigen Drucken auf einer ungeraden Seite beginnen sollen: Füge davor eine leere Seite ein.',
            ] },
          ],
        },
        {
          h2: 'Ohne deine Dateien hochzuladen',
          body: [
            'Die neue Reihenfolge entsteht in deinem Browser. Das Dokument wird nicht über das Internet übertragen, und auf keinem Server bleibt eine Kopie. Deshalb kannst du auch Akten, Patientenunterlagen oder Arbeitsdokumente sortieren, die dein Gerät nicht verlassen sollten.',
          ],
        },
      ],
      steps: [
        { name: 'PDF-Seiten sortieren öffnen', text: 'Öffne das Werkzeug PDF-Seiten sortieren auf docusmart.online und wähle das PDF.' },
        { name: 'Seiten verschieben', text: 'Zieh sie an ihren Platz oder nutze die Pfeile; dupliziere, füge leere Seiten ein oder entferne überflüssige.' },
        { name: 'Anwenden und herunterladen', text: 'Tippe auf Neue Reihenfolge anwenden und lade das sortierte PDF herunter.' },
      ],
      faq: [
        ['Kann ich am Handy sortieren?', 'Ja. Neben dem Ziehen hat jede Seite Pfeile, um sie nach vorn oder hinten zu verschieben, und die sind mit dem Finger leichter zu bedienen.'],
        ['Bleiben Links und Formulare erhalten?', 'Die Seiten werden mit ihrem Inhalt kopiert; prüfe das Ergebnis, wenn das Dokument komplexe Formulare enthält.'],
        ['Gibt es eine Seitenbegrenzung?', 'Es gibt keine feste Anzahl; bei sehr großen Dokumenten kann es etwas dauern, bis die Miniaturen erscheinen.'],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'seitenzahlen-in-pdf-einfuegen',
      title: 'Seitenzahlen in ein PDF einfügen | DocuSmart',
      description:
        'Füge einem PDF Seitenzahlen hinzu: Position, Format „1“, „1 / 10“ oder „Seite 1 von 10“, Startnummer und Deckblatt ohne Zahl. Kostenlos und ohne Upload.',
      h1: 'Seitenzahlen in ein PDF einfügen',
      lead: 'Eine Abschlussarbeit, ein Bericht oder eine Akte lässt sich mit nummerierten Seiten viel besser prüfen. So nummerierst du ein PDF ohne Seitenzahlen, in genau dem Format, das verlangt wird.',
      sections: [
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF-Seiten nummerieren](/numerar-paginas-pdf) und wähle das PDF. Leg fest, wo die Zahl steht (oben oder unten, links, mittig oder rechts), und wähle das Format: „1“, „1 / 10“ oder „Seite 1 von 10“.',
            'Tippe auf „Seiten nummerieren“. Du siehst Vorher und Nachher nebeneinander, Seite für Seite, und kannst prüfen, dass die Zahl nichts verdeckt. Dann lädst du das PDF herunter.',
          ],
        },
        {
          h2: 'Optionen für typische Fälle',
          body: [
            { ul: [
              '**Ohne Zahl auf den ersten**: Gib 1 ein, damit das Deckblatt keine Zahl bekommt, oder mehr, wenn ein Inhaltsverzeichnis oder eine Widmung folgt.',
              '**Beginnen bei**: damit die Nummerierung an ein anderes Dokument anschließt, zum Beispiel ab 25.',
              '**Text**: eigener Wortlaut, zum Beispiel „Blatt {n}“ oder „{n} von {total}“; {n} ist die Seitenzahl und {total} die letzte.',
              '**Größe und Farbe**: klein, mittel oder groß, in der Farbe deiner Wahl.',
            ] },
            { tip: 'Ist das Dokument auf mehrere Dateien verteilt, füge sie zuerst mit [PDF zusammenfügen](/unir-pdf) zusammen, damit die Nummerierung durchgehend ist.' },
          ],
        },
        {
          h2: 'Damit die Zahl nichts verdeckt',
          body: [
            'Viele Dokumente haben schon etwas in der Fußzeile (ein Logo, eine Adresse). Landet die Zahl darauf, setz sie in eine andere Ecke oder nach oben: Vorher und Nachher zeigen dir jede Seite vor dem Herunterladen, und mit den Pfeilen blätterst du von einer zur nächsten.',
          ],
        },
        {
          h2: 'Zum Schluss nummerieren',
          body: [
            'Die Zahl wird fest auf jede Seite gezeichnet. Sortierst du danach um oder fügst Seiten ein, wandern die Zahlen mit und sind nicht mehr fortlaufend. Deshalb nummerierst du am besten zuletzt: erst zusammenfügen, sortieren und Überflüssiges entfernen, dann die endgültige Fassung nummerieren.',
            'Bei Dokumenten für Behörden oder Akten, in denen Blätter gezählt werden, schreib „Blatt {n}“ ins Textfeld. Und wenn das Dokument die Nummerierung eines anderen fortsetzt, passe „Beginnen bei“ an.',
          ],
        },
        {
          h2: 'Alles in deinem Browser',
          body: [
            'Die Nummerierung wird auf deinem Gerät hinzugefügt: Das PDF wird auf keinen Server hochgeladen. Der Text des Dokuments bleibt Text: Du kannst ihn wie vorher durchsuchen und kopieren, und auch die Zahl ist Text, gestochen scharf beim Drucken.',
          ],
        },
      ],
      steps: [
        { name: 'PDF-Seiten nummerieren öffnen', text: 'Öffne das Werkzeug PDF-Seiten nummerieren auf docusmart.online und wähle das PDF.' },
        { name: 'Position und Format wählen', text: 'Zum Beispiel unten rechts und „Seite 1 von 10“.' },
        { name: 'Bei Bedarf anpassen', text: 'Deckblatt ohne Zahl, Startnummer, Größe und Farbe.' },
        { name: 'Nummerieren und herunterladen', text: 'Prüfe Vorher und Nachher und lade das nummerierte PDF herunter.' },
      ],
      faq: [
        ['Kann ich das Deckblatt ohne Zahl lassen?', 'Ja. Gib unter „Ohne Zahl auf den ersten“ 1 ein (oder so viele Seiten, wie du überspringen willst).'],
        ['Kann ich bei einer anderen Zahl beginnen?', 'Ja. Unter „Beginnen bei“ gibst du die erste Zahl ein, zum Beispiel 25.'],
        ['Kann ich „Blatt“ vor die Zahl schreiben?', 'Ja. Schreib „Blatt {n}“ ins Textfeld, und jede Seite zeigt statt {n} ihre Nummer.'],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'wasserzeichen-in-pdf-einfuegen',
      title: 'Wasserzeichen in ein PDF einfügen (Text oder Logo) | DocuSmart',
      description:
        'Setze „VERTRAULICH“, „KOPIE“ oder dein Logo auf ein PDF: Position, Kacheln, Winkel, Größe, Deckkraft und Seiten. Kostenlos, im Browser und ohne Upload.',
      h1: 'Ein Wasserzeichen in ein PDF einfügen (Text oder Logo)',
      lead: 'Ein Angebot als Entwurf verschicken, die Kopie deines Ausweises mit „Nur für Antrag X“ markieren oder dein Logo auf einen Katalog setzen: So fügst du einem PDF ein Wasserzeichen hinzu.',
      sections: [
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF-Wasserzeichen](/marca-de-agua-pdf) und wähle das PDF. Schreib den Text (als Beispiel steht „VERTRAULICH“ da) oder wechsle zu „Bild oder Logo“, um dein eigenes zu verwenden.',
            'Tippe auf „Wasserzeichen anwenden“: Du siehst Vorher und Nachher nebeneinander. Willst du etwas ändern, passe es an und wende es erneut an; wenn es dir gefällt, lade es herunter.',
          ],
        },
        {
          h2: 'So passt du es an',
          body: [
            { ul: [
              '**Position**: in der Mitte, in einer Ecke oder am Rand, oder als **Kacheln**, damit es sich über die ganze Seite wiederholt.',
              '**Drehung**: 0°, 45°, 90° oder −45°. Die Diagonale ist der Klassiker und am schwersten wegzuschneiden.',
              '**Größe, Deckkraft und Farbe**: Eine niedrige Deckkraft (20 %) lässt das Dokument lesbar; eine höhere macht das Zeichen auffälliger.',
              '**Über oder hinter dem Inhalt**: Dahinter wirkt es bei textlastigen Dokumenten dezenter.',
              '**Seiten**: alle oder nur einige (zum Beispiel 1-3, 5).',
            ] },
          ],
        },
        {
          h2: 'Ein Wasserzeichen für Dokumentkopien',
          body: [
            'Wenn jemand eine Kopie deines Ausweises oder eines Kontoauszugs verlangt, versieh sie gekachelt mit einem Vermerk wie „Nur für den Mietantrag, Januar 2026“. Landet die Kopie dann woanders, sieht man, wofür du sie herausgegeben hast.',
            { tip: 'Soll sie außerdem nur mit Passwort zu öffnen sein, schick sie danach durch [PDF mit Passwort schützen](/proteger-pdf).' },
          ],
        },
        {
          h2: 'Ideen für den Text',
          body: [
            { ul: [
              '„ENTWURF“ für Versionen, die noch nicht endgültig sind.',
              '„KOPIE“ oder „KONTROLLIERTE KOPIE“ für Dokumente, die verteilt werden.',
              '„Nur für [Antrag] – [Datum]“ auf Kopien von Ausweisdokumenten.',
              '„MUSTER“ auf Katalogen, Vorlagen oder Arbeiten, die noch nicht bezahlt sind.',
            ] },
            'Damit das Zeichen lesbar ist, ohne das Dokument zu stören, funktioniert eine Deckkraft zwischen 15 % und 30 % meist gut. Bei Kacheln wirkt eine kleine oder mittlere Größe sauberer. Prüfe vor dem Herunterladen mehrere Seiten in Vorher und Nachher.',
          ],
        },
        {
          h2: 'Ohne das Dokument hochzuladen',
          body: [
            'Das Wasserzeichen wird in deinem Browser hinzugefügt. Das PDF wird auf keinen Server hochgeladen, und das ist gerade bei Dokumenten wichtig, die ein Wasserzeichen brauchen: Ausweiskopien, Angebote oder interne Unterlagen.',
          ],
        },
      ],
      steps: [
        { name: 'PDF-Wasserzeichen öffnen', text: 'Öffne das Werkzeug PDF-Wasserzeichen auf docusmart.online und wähle das PDF.' },
        { name: 'Text schreiben oder Logo wählen', text: 'Zum Beispiel „VERTRAULICH“ oder „KOPIE“.' },
        { name: 'Position und Stil anpassen', text: 'Mitte oder Kacheln, Winkel, Größe, Deckkraft, Farbe und Seiten.' },
        { name: 'Anwenden und herunterladen', text: 'Prüfe Vorher und Nachher und lade das PDF herunter.' },
      ],
      faq: [
        ['Kann ich mein Logo verwenden?', 'Ja. Wähle „Bild oder Logo“ und lade ein Bild hoch; ein PNG mit transparentem Hintergrund wirkt am besten.'],
        ['Lässt es sich später entfernen?', 'Es wird fest ins PDF gezeichnet. Bewahre das Original ohne Wasserzeichen auf, falls du es noch einmal brauchst.'],
        ['Kann ich es nur auf einige Seiten setzen?', 'Ja. Gib unter „Seiten“ an, welche, zum Beispiel 1-3, 5.'],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'pdf-ohne-programme-bearbeiten',
      title: 'PDF bearbeiten, ohne ein Programm zu installieren | DocuSmart',
      description:
        'Füge Text hinzu oder ersetze ihn, markiere, decke ab, zeichne, setze Pfeile, Bilder und Links in ein PDF – im Browser, ohne Installation und ohne Upload.',
      h1: 'Ein PDF bearbeiten, ohne ein Programm zu installieren',
      lead: 'Ein Datum korrigieren, eine fehlende Angabe ergänzen, eine Klausel markieren oder etwas durchstreichen: Dafür brauchst du kein kostenpflichtiges Programm. So bearbeitest du ein PDF im Browser.',
      sections: [
        {
          h2: 'Die Werkzeuge des Editors',
          body: [
            'Über der Seite findest du eine Leiste mit allem, was du in [PDF bearbeiten](/editar-pdf) hinzufügen kannst:',
            { ul: [
              '**Text**: Du tippst auf die Stelle, an der du schreiben willst, und schreibst im Feld darunter; Schrift, Größe, Fettdruck und Farbe wählst du selbst.',
              '**Ersetzen**: Du tippst auf einen Text, der schon im PDF steht, und änderst ihn; das Original wird aus dem Dokument gelöscht, nicht nur verdeckt.',
              '**Rechteck, Kreis, Markieren und Abdecken**: zum Hervorheben, Unterstreichen oder weißen Abdecken.',
              '**Zeichnen, Linie und Pfeil**: zum Zeigen oder für handschriftliche Notizen.',
              '**Bild und Link**: um einen Stempel oder ein Logo einzufügen oder auf eine Website oder eine andere Seite des PDFs zu verlinken.',
            ] },
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF bearbeiten](/editar-pdf) und wähle die Datei. Wähle „Text“ in der Leiste und tippe auf die Stelle der Seite: Es erscheint ein Feld, das du verschieben kannst, und du schreibst im Bereich darunter. Mit „Auswählen“ tippst du auf ein beliebiges Element, um es zu verschieben, seine Größe zu ändern oder es zu entfernen.',
            'Wenn du dich vertust, nutze „Rückgängig“. Wenn du fertig bist, tippe auf „Änderungen anwenden“ und lade das bearbeitete PDF herunter.',
            { tip: 'Der Text unterstützt jedes Schriftsystem (Lateinisch, Kyrillisch, Griechisch, Chinesisch, Japanisch oder Koreanisch). Emojis werden nicht im PDF gespeichert.' },
          ],
        },
        {
          h2: 'Zum Unterschreiben und Ausfüllen gibt es eigene Werkzeuge',
          body: [
            'Wenn du unterschreiben musst, kannst du mit [PDF unterschreiben](/firmar-pdf) deine Unterschrift zeichnen, tippen oder hochladen und an die richtige Stelle setzen. Und hat das PDF Felder zum Ausfüllen, zeigt [PDF-Formular ausfüllen](/llenar-formulario-pdf) sie dir nacheinander an, was bequemer ist, als darüberzuschreiben.',
          ],
        },
        {
          h2: 'Tipps, damit die Änderung nicht auffällt',
          body: [
            'Um einen Text zu korrigieren, der schon im Dokument steht, nutze **Ersetzen**: Es löscht das Original und setzt den neuen Text an seine Stelle. Deckst du ihn nur mit einem weißen Kasten ab, bleibt der alte Text in der Datei.',
            'Wähle die Schrift, die der im Dokument am ähnlichsten ist (Sans, Serif oder Mono), und passe die Größe an, bis sie übereinstimmt. Am Handy verschiebst du Elemente am besten in Ruhe: Du kannst ihre Position auch mit den Pfeiltasten der Tastatur ändern.',
          ],
        },
        {
          h2: 'Deine Datei bleibt bei dir',
          body: [
            'Der gesamte Editor läuft in deinem Browser: Das PDF wird auf keinen Server hochgeladen, weder beim Bearbeiten noch beim Speichern.',
          ],
        },
      ],
      steps: [
        { name: 'PDF bearbeiten öffnen', text: 'Öffne das Werkzeug PDF bearbeiten auf docusmart.online und wähle die Datei.' },
        { name: 'Wählen, was du hinzufügst', text: 'Text, Ersetzen, Formen, Markierung, Zeichnung, Pfeile, Bild oder Link.' },
        { name: 'Auf der Seite platzieren', text: 'Tippe auf die Seite, schreib oder zeichne, und verschieb es mit Auswählen.' },
        { name: 'Anwenden und herunterladen', text: 'Tippe auf Änderungen anwenden und lade das bearbeitete PDF herunter.' },
      ],
      faq: [
        ['Kann ich einen Text ändern, der schon im PDF steht?', 'Ja, mit „Ersetzen“: Du tippst auf den Text, schreibst den neuen, und das Original wird aus dem Dokument gelöscht.'],
        ['Funktioniert das mit gescannten PDFs?', 'Du kannst Text, Formen und Zeichnungen darübersetzen. Zum Ersetzen von Text braucht das PDF echten Text; ist es ein Foto, lass es zuerst durch die Texterkennung (OCR) laufen.'],
        ['Muss ich etwas installieren?', 'Nein. Es funktioniert im Browser am PC oder am Handy.'],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'zwei-pdf-versionen-vergleichen',
      title: 'Zwei PDF-Versionen vergleichen und Änderungen sehen | DocuSmart',
      description:
        'Vergleiche zwei PDFs und sieh, welche Wörter hinzukamen oder wegfielen, oder vergleiche Seite für Seite, um Änderungen an Bildern und Layout zu finden. Ohne Upload.',
      h1: 'Zwei Versionen eines PDFs vergleichen und sehen, was sich geändert hat',
      lead: 'Du bekommst einen Vertrag „mit ein paar Anpassungen“ zurück, aber niemand sagt, mit welchen. Ihn zweimal auf der Suche nach Unterschieden zu lesen, dauert, und man übersieht Dinge. So vergleichst du zwei Versionen in Sekunden.',
      sections: [
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF vergleichen](/comparar-pdf). Wähle zuerst das **Original** und dann die **Neue Version**. Hast du sie vertauscht, bringt die Schaltfläche „Tauschen“ sie in die richtige Reihenfolge.',
            'Tippe auf „Vergleichen“. Oben siehst du, wie viele Wörter hinzugefügt und wie viele entfernt wurden, darunter jede Änderung mit ihrer Seite: Entferntes rot durchgestrichen, Hinzugefügtes grün, mit ein paar Zeilen Kontext zur Orientierung.',
          ],
        },
        {
          h2: 'Text oder visuell',
          body: [
            { ul: [
              '**Text**: vergleicht die Wörter. Ideal für Verträge, Briefe und Berichte. Du kannst Groß-/Kleinschreibung und Satzzeichen ignorieren, damit sie nicht als Änderungen zählen.',
              '**Visuell (Seite für Seite)**: vergleicht, wie jede Seite aussieht. Nützlich für Pläne, Layouts oder gescannte Dokumente, bei denen sich Bilder oder Tabellen ändern können und nicht nur Text.',
            ] },
            { tip: 'Achte bei einem Vertrag vor allem auf Änderungen bei Beträgen, Daten und Namen: Der Vergleich zeigt sie, auch wenn es nur eine einzige Ziffer ist.' },
          ],
        },
        {
          h2: 'Nach dem Vergleich',
          body: [
            'Hast du etwas gefunden, das korrigiert werden muss, geht das mit [PDF bearbeiten](/editar-pdf). Und wenn beide Seiten einverstanden sind, unterschreibe die endgültige Fassung mit [PDF unterschreiben](/firmar-pdf).',
          ],
        },
        {
          h2: 'Was angezeigt wird und was nicht',
          body: [
            'Jede Änderung erscheint mit ihrer Seitenzahl und den Zeilen drumherum, damit du sie schnell im Dokument findest. Wurde ein ganzer Absatz unverändert verschoben, wird er als verschoben markiert, statt als entfernt und hinzugefügt zu zählen.',
            'Haben die beiden Dateien fast nichts gemeinsam (etwa weil du das falsche Dokument gewählt hast), weist das Werkzeug darauf hin, statt Hunderte Änderungen anzuzeigen. Und sind sie identisch, sagt es dir das auch, selbst wenn sie unterschiedlich viele Seiten haben.',
            'Das hilft bei Verträgen, Angeboten, Satzungen, Entwürfen, die durch mehrere Hände gehen, oder der Abschlussarbeit, die mit Korrekturen vom Betreuer zurückkommt: In all diesen Fällen erspart dir das genaue Wissen um die Änderungen ein komplettes Neulesen.',
          ],
        },
        {
          h2: 'Deine Dokumente werden nicht hochgeladen',
          body: [
            'Die beiden PDFs werden in deinem Browser verglichen: Keines wird auf einen Server hochgeladen. Du kannst das Werkzeug also beruhigt mit Verträgen und vertraulichen Dokumenten nutzen, denn keine der beiden Versionen wird anderswo gespeichert.',
          ],
        },
      ],
      steps: [
        { name: 'PDF vergleichen öffnen', text: 'Öffne das Werkzeug PDF vergleichen auf docusmart.online.' },
        { name: 'Beide Dateien wählen', text: 'Zuerst das Original, dann die neue Version.' },
        { name: 'Vergleichsart wählen', text: 'Text (Wörter) oder Visuell (Seite für Seite).' },
        { name: 'Änderungen prüfen', text: 'Entferntes erscheint rot durchgestrichen, Hinzugefügtes grün, jeweils mit Seite.' },
      ],
      faq: [
        ['Vergleicht es gescannte PDFs?', 'Im Modus Visuell ja, weil er vergleicht, wie jede Seite aussieht. Der Modus Text braucht echten Text im PDF.'],
        ['Spielt die Reihenfolge der Dateien eine Rolle?', 'Ja: Was in der neuen Version steht, aber nicht im Original, gilt als hinzugefügt. Hast du dich vertan, nutze Tauschen.'],
        ['Kann ich es ignorieren, wenn sich nur ein Großbuchstabe oder ein Komma geändert hat?', 'Ja. Aktiviere „Groß-/Kleinschreibung ignorieren“ oder „Satzzeichen ignorieren“.'],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'persoenliche-daten-im-pdf-schwaerzen',
      title: 'Persönliche Daten in einem PDF schwärzen (richtig) | DocuSmart',
      description:
        'Schwärze Ausweisnummern, Konten, E-Mails oder Namen in einem PDF: Such sie, markiere sie auf allen Seiten, und sie werden aus der Datei gelöscht, nicht nur verdeckt.',
      h1: 'Persönliche Daten in einem PDF schwärzen (und zwar richtig)',
      lead: 'Bevor du einen Kontoauszug, einen Vertrag oder eine Patientenakte weitergibst, musst du oft Konto- oder Ausweisnummern verbergen. Ein schwarzer Kasten darüber reicht nicht: So machst du es richtig.',
      sections: [
        {
          h2: 'Warum ein schwarzer Kasten nicht reicht',
          body: [
            'Legst du in einem normalen Editor ein schwarzes Rechteck über eine Nummer, steht die Nummer weiterhin in der Datei: Man muss sie nur markieren und kopieren oder das PDF mit einem anderen Programm öffnen, um sie zu lesen. Richtig schwärzen heißt, das Darunterliegende zu **löschen**, und genau das macht [PDF schwärzen](/censurar-pdf).',
          ],
        },
        {
          h2: 'Schritt für Schritt',
          body: [
            'Öffne [PDF schwärzen](/censurar-pdf) und wähle die Datei. Du kannst nach einem Namen, einer Nummer oder einem Wort suchen, und es wird auf allen Seiten gleichzeitig markiert. Du kannst auch auf einen Schlag alle **E-Mails** oder alle **Nummern** (Ausweise, Telefon, Konten) markieren oder über die Seite ziehen, um einen Bereich von Hand abzudecken.',
            'Prüfe jede Seite: Tippst du auf einen Bereich, kannst du ihn verschieben oder entfernen. Wenn alles passt, tippe auf „PDF schwärzen“ und lade das Ergebnis herunter.',
            { tip: 'Seiten mit markierten Bereichen werden in ein Bild umgewandelt, damit das Abgedeckte aus der Datei verschwindet. Der übrige Text dieser Seiten bleibt durchsuchbar und kopierbar.' },
          ],
        },
        {
          h2: 'Vor dem Versenden prüfen',
          body: [
            'Die Suche findet, was als Text geschrieben ist. Ist ein Teil des Dokuments ein Foto oder ein Scan, tauchen die Daten dort in der Suche nicht auf: Markiere sie von Hand, indem du über die Seite ziehst. Und bewahre das Original getrennt auf, denn Geschwärztes lässt sich nicht wiederherstellen.',
            'Wenn das Dokument in fremde Hände kommt, kannst du es zusätzlich mit [PDF mit Passwort schützen](/proteger-pdf) sichern oder mit einem [Wasserzeichen](/marca-de-agua-pdf) versehen, das sagt, wofür du es herausgegeben hast.',
          ],
        },
        {
          h2: 'Was man meistens abdecken muss',
          body: [
            { ul: [
              'Ausweis- und Kontonummern.',
              'Adressen, Telefonnummern und E-Mail-Adressen.',
              'Unterschriften und Fotos auf Ausweisdokumenten.',
              'Gesundheitsdaten, Gehälter oder Informationen über Dritte.',
            ] },
          ],
        },
        {
          h2: 'Ohne das Dokument hochzuladen',
          body: [
            'Der ganze Vorgang läuft in deinem Browser: Das Dokument mit den ungeschwärzten Daten verlässt nie dein Gerät. Genau darauf kommt es beim Schwärzen an: Würdest du das Original zum Abdecken bei einem Online-Dienst hochladen, hättest du die Daten schon aus der Hand gegeben.',
          ],
        },
      ],
      steps: [
        { name: 'PDF schwärzen öffnen', text: 'Öffne das Werkzeug PDF schwärzen auf docusmart.online und wähle die Datei.' },
        { name: 'Markieren, was verborgen werden soll', text: 'Such einen Text, markiere alle E-Mails oder Nummern, oder zieh über die Seite.' },
        { name: 'Jede Seite prüfen', text: 'Tippe auf einen Bereich, um ihn zu verschieben oder zu entfernen.' },
        { name: 'Schwärzen und herunterladen', text: 'Tippe auf PDF schwärzen: Das Abgedeckte wird aus der Datei gelöscht.' },
      ],
      faq: [
        ['Lässt sich Geschwärztes wiederherstellen?', 'Nein. Was du abdeckst, wird aus der Datei gelöscht; deshalb solltest du das Original getrennt aufbewahren.'],
        ['Funktioniert das mit gescannten PDFs?', 'Ja, wenn du die Bereiche von Hand markierst. Die automatische Suche findet nur, was als Text geschrieben ist.'],
        ['Lässt sich der Rest des Dokuments weiter durchsuchen?', 'Ja. Nur die Seiten mit markierten Bereichen werden in ein Bild umgewandelt, und ihr übriger Text bleibt zum Suchen und Kopieren erhalten.'],
      ],
    },
  },
}
