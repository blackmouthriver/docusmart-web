// Traducción al inglés de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: 'Guides',
    guidesSlug: 'guides',
    indexTitle: 'Step-by-step PDF guides: merge, sign, scan and more | DocuSmart',
    indexDescription:
      'Short, practical guides to merge, compress, sign, scan and password-protect PDFs from your phone or computer, for free and without uploading your files.',
    indexH1: 'Step-by-step guides',
    indexLead: 'Practical guides that walk you through a common document task from start to finish. Every tool they use runs in your browser, so your files stay on your device.',
    minutes: '{n} min read',
    updated: 'Updated on {date}',
    summary: 'Quick summary',
    toolsTitle: 'Tools in this guide',
    moreGuides: 'More guides',
    related: 'Related guides',
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'merge-pdf-on-your-phone',
      title: 'How to merge PDFs on your phone without uploading them | DocuSmart',
      description:
        'A step-by-step guide to combining several PDFs into one on your phone, for free and without uploading them to any server. Works in the browser on Android and iPhone.',
      h1: 'How to merge PDFs on your phone without uploading them',
      lead: 'Putting your ID card, a receipt and an application form into a single PDF is one of the most common steps in any online application. Here is how to do it from your phone in about a minute, without handing your documents to someone else\'s server.',
      sections: [
        {
          h2: 'Why it matters that your files aren\'t uploaded',
          body: [
            'Most websites that merge PDFs receive your documents on their servers, process them there and send the result back. For a restaurant menu that hardly matters. For an ID card, a bank statement or a medical record it does: you don\'t know how long they keep the files or who can see them.',
            'DocuSmart merges the files inside your phone\'s browser. The file never travels over the internet, so no copy ends up on any server. That is also why it works with a weak signal once the page has loaded.',
          ],
        },
        {
          h2: 'Before you start',
          body: [
            { ul: [
              'Have the PDFs saved on your phone (in Downloads, in the Files app or in your cloud storage).',
              'If one of them is a photo rather than a PDF, convert it first with [Image to PDF](/imagen-a-pdf).',
              'If a PDF has a password, remove it first with [Unlock PDF](/desbloquear-pdf) (you need to know the password).',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Merge PDF](/unir-pdf) in your phone\'s browser (Chrome, Safari, Samsung Internet or whichever you use). Tap the box to choose your files: you can select several at once.',
            'Check the order of the list. The first file will be the start of the final document; move the files with the arrows until they are in the order you need. Then tap "Merge": the combined PDF downloads with all the pages.',
            { tip: 'Need to rearrange individual pages rather than whole files? Merge first, then open the result in [Reorder PDF pages](/ordenar-paginas-pdf), where you can move or remove each page.' },
          ],
        },
        {
          h2: 'If the final PDF is too large',
          body: [
            'Many government portals, application forms and email services limit attachment size (2 MB, 5 MB and 10 MB are common limits). If your file is over the limit, use [Compress PDF](/comprimir-pdf): the "Lossless" level doesn\'t touch the quality, and "Medium" shrinks PDFs made from scans or photos much further.',
          ],
        },
        {
          h2: 'If you do this often',
          body: [
            'The website works on any phone. If you use Android and merge documents regularly, the DocuSmart app does the same thing offline and keeps your files organized on your phone.',
          ],
        },
      ],
      steps: [
        { name: 'Open Merge PDF', text: 'Go to the Merge PDF tool on docusmart.online in your phone\'s browser.' },
        { name: 'Choose the PDFs', text: 'Tap the box and select all the files you want to combine.' },
        { name: 'Put them in order', text: 'Move the files with the arrows: the first one will be the start of the document.' },
        { name: 'Merge and download', text: 'Tap "Merge" and a single PDF with all the pages is downloaded.' },
      ],
      faq: [
        ['Does it work on iPhone?', 'Yes. It works in Safari and in any modern browser, on iPhone and on Android. The offline app is only available for Android.'],
        ['How many PDFs can I merge?', 'There is no fixed number. The limit is your phone\'s memory: very large documents may take a little longer.'],
        ['Is any quality lost?', 'No. The pages are copied as they are, with their original text, images and size.'],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'photos-to-pdf',
      title: 'How to convert photos to PDF (several photos in one file) | DocuSmart',
      description:
        'Turn photos from your phone or computer into a PDF, one photo per page. Free, no sign-up and no uploads. Tips to keep the result readable and small.',
      h1: 'How to convert photos to PDF, several in one file',
      lead: 'You\'re asked for "the document as a PDF" and all you have is photos in your gallery. Here is how to turn them into a tidy, readable and lightweight PDF without installing anything.',
      sections: [
        {
          h2: 'Two options, depending on the photo',
          body: [
            { ul: [
              '**Photos that already look good** (screenshots, downloaded images, photos taken straight on): use [Image to PDF](/imagen-a-pdf). Each photo becomes a page exactly as it is.',
              '**Photos of a sheet of paper** (a receipt, a contract, a certificate): use [Scan document](/escanear-documento). It finds the edges of the page, straightens it and whitens the paper so it looks scanned.',
            ] },
          ],
        },
        {
          h2: 'Step by step with Image to PDF',
          body: [
            'Open [Image to PDF](/imagen-a-pdf) and choose your images. It accepts JPG, PNG, WebP, BMP and GIF, and you can mix them.',
            'Put them in order with the arrows: each image will be one page, in that order. Tap "Convert" and you\'re done: you have a single PDF.',
          ],
        },
        {
          h2: 'How to take a photo that\'s easy to read',
          body: [
            { ul: [
              'Use even lighting and skip the direct flash: shadows from your hand or phone make the text harder to read.',
              'Place the page on a dark surface (a wooden table, for example) so the scanner can find the edges more easily.',
              'Hold the phone parallel to the page, not at an angle.',
              'Make sure the whole page is in the frame, with a little margin around it.',
            ] },
            { tip: 'In [Scan document](/escanear-documento) you can check "Make the PDF searchable": it recognizes the text so it can be searched and copied, which some online portals appreciate.' },
          ],
        },
        {
          h2: 'Keeping the file size down',
          body: [
            'A photo from a modern phone can weigh 3 or 4 MB, so ten photos already make a PDF that is heavy for an email. If the result is large, run it through [Compress PDF](/comprimir-pdf) at the "Medium" level, which greatly reduces pages that are photos. You can also compress the photos beforehand with [Compress image](/comprimir-imagen).',
          ],
        },
        {
          h2: 'If you have an iPhone',
          body: [
            'When you pick photos in Safari, the iPhone usually hands them over as JPG, so they work without any extra steps. If you copied the photos to your computer and they show up as .HEIC files, that format can\'t be converted here yet.',
            'To make your iPhone save future photos as JPG, go to Settings › Camera › Formats and choose "Most Compatible". For photos you already have, send them to your computer from the Photos app using the share option: they usually arrive converted to JPG.',
          ],
        },
        {
          h2: 'Your photos stay on your device',
          body: [
            'The conversion happens in your browser: the photos aren\'t uploaded to any server. That matters when they are ID documents or health information.',
          ],
        },
      ],
      steps: [
        { name: 'Open Image to PDF', text: 'Go to the Image to PDF tool on docusmart.online.' },
        { name: 'Choose the photos', text: 'Select the images (JPG, PNG, WebP, BMP or GIF).' },
        { name: 'Put them in order', text: 'Use the arrows: each image will be one page, in that order.' },
        { name: 'Convert', text: 'Tap "Convert" to get a single PDF.' },
      ],
      faq: [
        ['Can I put several photos on one page?', 'Image to PDF puts one photo per page, which is what most forms and applications expect. If you need several on one sheet, combine them into a single image first.'],
        ['How is this different from scanning?', 'Scan document crops the page, straightens it and improves the contrast; Image to PDF keeps the photo exactly as it is. For paper documents, scanning gives a cleaner result.'],
        ['Does it work without internet?', 'Once the page is open, the conversion doesn\'t need a connection. If you install DocuSmart Desktop or the Android app, it works completely offline.'],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'reduce-pdf-size',
      title: 'How to reduce PDF file size for email, WhatsApp or online forms | DocuSmart',
      description:
        'Why a PDF is so large and how to shrink it without losing readability. Which compression level to pick for each type of document. Free and without uploading files.',
      h1: 'How to reduce the size of a PDF',
      lead: '"The file exceeds the maximum allowed size." If you got that message on a portal or in your email, this guide explains why it happens and how to fix it without making the document unreadable.',
      sections: [
        {
          h2: 'Why a PDF is so large',
          body: [
            'Images are what take up the most space in a PDF. A text-only document created in Word is usually a few hundred kilobytes, even with many pages. One put together from photos, or from a scanner set to high resolution, can easily go over 10 MB with just a few pages.',
            'That\'s why compression works very differently depending on the type of PDF: a text document has little to reduce, while a scan has a lot.',
          ],
        },
        {
          h2: 'Which level to choose',
          body: [
            { ul: [
              '**Lossless:** optimizes the structure of the file without touching the quality. The text stays selectable. It\'s the safe choice for contracts, invoices and digital documents.',
              '**Medium:** recommended for scans and photos. It cuts the size a lot and stays easy to read.',
              '**High:** for when the limit is very strict. Keep in mind that at the Medium and High levels the text becomes an image, so it can no longer be selected.',
            ] },
            { tip: 'Start with "Lossless". If that doesn\'t get you to the size you need, try "Medium". DocuSmart shows you how much it shrank before you send it.' },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Compress PDF](/comprimir-pdf), choose the file and pick the level. Tap "Compress PDF": you\'ll see the size before and after, and the result downloads.',
            'If the PDF was already optimized and can\'t be reduced any further, DocuSmart tells you and doesn\'t download a copy that is the same size or larger.',
          ],
        },
        {
          h2: 'If it\'s still too large',
          body: [
            { ul: [
              '**Split the document:** many portals accept several attachments. With [Split PDF](/dividir-pdf) you can break it into two or more files.',
              '**Compress the photos before making the PDF:** [Compress image](/comprimir-imagen) shrinks a phone photo by 60% to 90% with almost no visible difference.',
              '**Remove pages you don\'t need:** with [Reorder PDF pages](/ordenar-paginas-pdf) you can delete cover pages or blank pages.',
            ] },
          ],
        },
        {
          h2: 'Common limits',
          body: [
            'For reference: Gmail allows attachments up to 25 MB and Outlook up to 20 MB. Many government and banking portals ask for files between 2 and 5 MB each. Always check the limit of the site you\'re uploading to.',
          ],
        },
      ],
      steps: [
        { name: 'Open Compress PDF', text: 'Go to the Compress PDF tool on docusmart.online.' },
        { name: 'Choose the file', text: 'Select the PDF that is too large.' },
        { name: 'Pick the level', text: '"Lossless" for digital documents; "Medium" or "High" for scans and photos.' },
        { name: 'Compress', text: 'Tap "Compress PDF", check how much it shrank and download the result.' },
      ],
      faq: [
        ['Does compressing damage the document?', 'With "Lossless", no: the content stays identical. With "Medium" and "High" the pages are turned into lighter images, which read well but lose selectable text.'],
        ['Is my PDF uploaded to the internet?', 'No. Compression happens inside your browser: the file never leaves your device.'],
        ['Why did my PDF barely shrink?', 'It\'s most likely a text PDF or one that was already optimized. In those cases the size is already small and there is little to remove.'],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'sign-pdf-without-printing',
      title: 'How to sign a PDF without printing it (on your phone or PC) | DocuSmart',
      description:
        'Sign a PDF without printing or scanning: draw your signature, type it or use a photo. What a simple electronic signature is valid for. Free and private.',
      h1: 'How to sign a PDF without printing it',
      lead: 'Print, sign with a pen, scan and send it back: four steps you can replace with one. Here is how to sign a PDF from your phone or computer.',
      sections: [
        {
          h2: 'Three ways to create your signature',
          body: [
            { ul: [
              '**Draw it** with your finger on your phone or with the mouse on your computer.',
              '**Type your name**, which is shown in a handwriting-style font.',
              '**Upload a photo** of your signature on paper. This is the one that looks most like your usual signature.',
            ] },
            { tip: 'For the photo: sign in dark ink on a white sheet, in good light and without shadows. DocuSmart removes the background so only the stroke remains.' },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Sign PDF](/firmar-pdf) and choose the document. Create your signature using any of the three methods.',
            'Drag it to where the signature goes and adjust its size. If the document needs initials on every page, use "Repeat on every page". Tap "Sign PDF".',
          ],
        },
        {
          h2: 'If you also need to fill in details',
          body: [
            'Many documents that need a signature are forms: name, ID number, date. If the PDF has fillable fields, complete them first with [Fill in PDF form](/llenar-formulario-pdf) and then sign it. Before sending it, check "Flatten" so the answers are locked in place.',
          ],
        },
        {
          h2: 'Common signing mistakes',
          body: [
            { ul: [
              '**A tiny or pixelated signature:** enlarge it until it fills the signature line; if it comes from a photo, take the photo up close and in good light.',
              '**A signature on top of the text:** move it so it doesn\'t cover any details in the document; a contract with the signature over a clause can raise questions.',
              '**Signing the wrong version:** make sure it\'s the final document before you sign; fixing it afterwards means signing again.',
              '**Forgetting the other pages:** if the document needs a signature or initials on every page, use "Repeat on every page" instead of going one by one.',
            ] },
          ],
        },
        {
          h2: 'Is it legally valid?',
          body: [
            'What you get is a **simple electronic signature**: an image of your signature on the document, the digital equivalent of signing by hand. It works for most everyday paperwork: rental agreements, authorizations, company forms or school permission slips.',
            'Some procedures require a **certificate-based digital signature**, issued by an authorized certification provider; for example, certain filings with government agencies or electronic invoicing. If the procedure explicitly asks for one, an image signature isn\'t enough.',
          ],
        },
        {
          h2: 'Your signature isn\'t stored anywhere',
          body: [
            'The signature and the document are processed inside your browser. They aren\'t uploaded to a server or saved: when you close the page, the signature is gone. If you\'re going to send the document through a channel you don\'t fully trust, you can add a password with [Protect PDF with a password](/proteger-pdf).',
          ],
        },
      ],
      steps: [
        { name: 'Open Sign PDF', text: 'Go to the Sign PDF tool on docusmart.online and choose the document.' },
        { name: 'Create your signature', text: 'Draw it, type your name or upload a photo of your signature on paper.' },
        { name: 'Place it', text: 'Drag it into place and adjust the size; you can repeat it on every page.' },
        { name: 'Download', text: 'Tap "Sign PDF" to get the signed PDF.' },
      ],
      faq: [
        ['Can I sign from my phone?', 'Yes. On your phone you can draw the signature with your finger or take a photo of your signature on paper.'],
        ['Can the signed document be modified?', 'The signature is embedded in the page. To prevent changes and unwanted access, you can protect the PDF with a password and turn off the permission to modify it.'],
        ['Can I sign several pages?', 'Yes: add the signature to each page you want or use "Repeat on every page".'],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'scan-documents-with-your-phone',
      title: 'How to scan documents with your phone and save them as PDF | DocuSmart',
      description:
        'Scan documents with your phone\'s camera without installing apps: automatic cropping, a filter that removes shadows and a PDF with searchable text. Tips for a sharp scan.',
      h1: 'How to scan documents with your phone',
      lead: 'You don\'t need a scanner or an app: your phone\'s camera and browser are enough to get a clean, cropped PDF with the text recognized.',
      sections: [
        {
          h2: 'What a scanner does (and why a photo alone isn\'t enough)',
          body: [
            'A photo of a page almost never comes out perfect: it\'s slightly tilted, the table shows around it and the white paper looks gray or shadowy. A phone scanner fixes that: it finds the four corners of the page, straightens it as if you had photographed it from directly above and whitens the background.',
            'That\'s what [Scan document](/escanear-documento) does, right in your browser.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Scan document](/escanear-documento) and tap "Take photo": on your phone, the camera opens. You can also choose photos you already have.',
            'Check the corners DocuSmart found; if one is off, drag it to the tip of the page. Choose the "Document" filter to whiten the paper and remove shadows. Add more pages if the document has several sheets.',
            'Tap "Create PDF". If you check "Make the PDF searchable", the text is also recognized so you can search for words and copy them.',
          ],
        },
        {
          h2: 'Five tips for a sharp scan',
          body: [
            { ul: [
              'Put the page on a dark surface: the contrast helps detect the edges.',
              'Use natural light or a lamp from the side; avoid the direct flash, which causes glare.',
              'Hold the phone parallel to the page and wait for it to focus.',
              'Flatten the page well: folds create shadows the filter can\'t always remove.',
              'For multiple pages, scan them all in the same session and they\'ll come out as a single PDF.',
            ] },
          ],
        },
        {
          h2: 'Recognizing text in a scan you already have',
          body: [
            'If you already have a scanned PDF or a photo and need to copy its text, use [OCR](/ocr-pdf): it recognizes printed text in 12 languages (Spanish, English, Portuguese, French, Russian, Japanese, Chinese and more) and gives it to you to copy, as a .txt file or as a searchable PDF. It works best with sharp, straight scans; handwriting is usually recognized poorly.',
          ],
        },
        {
          h2: 'Private from start to finish',
          body: [
            'Edge detection, straightening, filters and text recognition all happen inside your browser. The photos aren\'t uploaded to any server. If you scan often, the DocuSmart app for Android does the same thing offline.',
          ],
        },
      ],
      steps: [
        { name: 'Open Scan document', text: 'Go to the Scan document tool on docusmart.online and tap "Take photo".' },
        { name: 'Adjust the corners', text: 'Check the crop and drag the corners if needed.' },
        { name: 'Choose the filter', text: 'The "Document" filter whitens the paper and removes shadows.' },
        { name: 'Save the PDF', text: 'Tap "Create PDF"; check "Make the PDF searchable" to recognize the text.' },
      ],
      faq: [
        ['Do I need to install an app?', 'No. It works in the browser on your phone or computer. The Android app is optional, for scanning offline.'],
        ['What is a searchable PDF?', 'A PDF that, in addition to the image, contains the recognized text: you can search for words, select them and copy them.'],
        ['What if it doesn\'t find the edges properly?', 'Drag each corner to the tip of the page or use "Whole photo". It helps if the paper contrasts with the background.'],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'password-protect-pdf',
      title: 'How to password-protect a PDF (and when you should) | DocuSmart',
      description:
        'Protect a PDF with a password and AES-256 encryption, control whether it can be printed or copied, and learn to share the password safely. Free and without uploading the file.',
      h1: 'How to password-protect a PDF',
      lead: 'A PDF with your personal, financial or medical information that travels by email or chat can end up anywhere. Adding a password takes a minute and keeps the wrong people from opening it.',
      sections: [
        {
          h2: 'When it makes sense to protect a PDF',
          body: [
            { ul: [
              'ID documents, bank statements, pay stubs or tax returns.',
              'Medical records, test results or sick notes.',
              'Contracts or proposals you don\'t want circulating.',
              'Any file you\'re sending through a channel you don\'t control, such as an email that gets forwarded or a group chat.',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Protect PDF with a password](/proteger-pdf) and choose the document. Type the password twice.',
            'Decide what is allowed once the PDF is open: printing, copying text or modifying it. Tap "Protect PDF" and the encrypted version downloads. It opens in Adobe Acrobat, Chrome, Edge and the DocuSmart app, which ask for the password.',
          ],
        },
        {
          h2: 'A good password and how to share it',
          body: [
            { ul: [
              'Use at least 10 characters; a short phrase with numbers is easy to remember and hard to guess.',
              'Don\'t use your ID number or your date of birth: that\'s the first thing someone would try.',
              '**Never send the password through the same channel as the PDF.** If the file goes by email, send the password by text message or say it over the phone.',
            ] },
            { tip: 'Keep the password somewhere safe. If you forget it, it can\'t be recovered: not even DocuSmart can open the PDF, because the password never leaves your device.' },
          ],
        },
        {
          h2: 'What each option protects',
          body: [
            'The **open password** is the real protection: without it, the encrypted file can\'t be read. **Permissions** (print, copy, modify) are something else: they tell PDF readers what to allow once the document is open.',
            'Reputable programs respect those permissions, but someone who already has the password can remove them with certain tools. Use them to prevent accidental copying or casual edits, not as your only barrier. If someone shouldn\'t see a piece of information, don\'t give them the password, or redact that information before sending the file.',
          ],
        },
        {
          h2: 'A password is not the same as redacting',
          body: [
            'A password stops people from opening the file, but whoever has it will see all the content. If you need to share a document while hiding only certain details (an account number, an address), use [Redact PDF](/censurar-pdf): it actually deletes the text underneath the covered areas, instead of just placing a black box on top.',
          ],
        },
        {
          h2: 'Removing the password later',
          body: [
            'If you later need an unprotected copy, [Unlock PDF](/desbloquear-pdf) removes the password, as long as you know it. Only use it with your own documents or ones you have the right to modify.',
          ],
        },
      ],
      steps: [
        { name: 'Open Protect PDF', text: 'Go to the Protect PDF tool on docusmart.online and choose the document.' },
        { name: 'Type the password', text: 'Type it twice to confirm it.' },
        { name: 'Choose the permissions', text: 'Check whether printing, copying or modifying is allowed.' },
        { name: 'Protect and download', text: 'Tap "Protect PDF" and the encrypted document downloads.' },
      ],
      faq: [
        ['How secure is it?', 'It uses AES-256 encryption, the strongest standard for PDFs. The real security depends on the password being hard to guess.'],
        ['Is my password sent to a server?', 'No. Encryption happens in your browser; neither the file nor the password leaves your device.'],
        ['Can I remove the password from someone else\'s PDF?', 'Only if you know the password. DocuSmart doesn\'t crack open passwords.'],
      ],
    },
    'dividir-pdf-en-varios-archivos': {
      slug: 'split-pdf-into-multiple-files',
      title: 'How to split a PDF into several files or extract a few pages | DocuSmart',
      description:
        'Split a PDF by pages, by ranges, every N pages, by bookmarks or by size, or pull out just the pages you need. Free, and your file is never uploaded.',
      h1: 'How to split a PDF into several files or extract just a few pages',
      lead: 'A portal only wants the signature page, or an 80-page PDF is too big to email. Here is how to break a PDF into parts, or keep only the pages you need, right from your browser.',
      sections: [
        {
          h2: 'Six ways to split',
          body: [
            'Before you start, it helps to know what you need, because [Split PDF](/dividir-pdf) has a mode for each case:',
            { ul: [
              '**Choose pages**: tap the thumbnails (or type "1-3, 5") and you get a PDF with only those pages.',
              '**By ranges**: several ranges at once, and each one becomes a separate PDF.',
              '**Every N pages**: equal parts, for example 10 pages each.',
              '**By bookmarks**: one PDF per chapter, if the document has a bookmark outline.',
              '**By size**: parts that stay under a given size, for email or portals with a limit.',
              '**Each page separately**: one PDF per page.',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Split PDF](/dividir-pdf) and choose the file. You will see its pages as thumbnails. In "Choose pages", tap the ones you want to keep: they turn blue and the field above fills in by itself.',
            'Tap the button at the bottom. When it finishes, you will see the result next to the original so you can check it, and you can download it with any name you like. If the mode creates several files, you can get them one by one or all together in a ZIP.',
            { tip: 'To take a few pages from several PDFs and put them into one, [Merge PDF](/unir-pdf) is quicker: there you can pick which pages to take from each file.' },
          ],
        },
        {
          h2: 'If the parts are still too large',
          body: [
            'Splitting doesn\'t change the quality: each page is copied as it is. If a part is still over the limit, use the **By size** mode or run it through [Compress PDF](/comprimir-pdf). A single page scanned at a high resolution can be bigger than the limit on its own: in that case, compressing it is what helps.',
          ],
        },
        {
          h2: 'Common cases',
          body: [
            { ul: [
              'A portal only wants both sides of your ID card: choose those two pages and upload just that PDF.',
              'A statement covering the whole year: if it has bookmarks for each month, use **By bookmarks**; if not, **Every N pages**.',
              'An email with a 10 MB limit: use **By size**, enter 10 and every part stays below it.',
            ] },
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'The split happens in your browser: the PDF isn\'t uploaded to any server. That is why you can use it with bank statements, medical records or contracts without leaving copies anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open Split PDF', text: 'Go to docusmart.online/en/split-pdf and choose the file.' },
        { name: 'Choose the mode', text: 'Choose pages, by ranges, every N pages, by bookmarks, by size or each page separately.' },
        { name: 'Mark the pages', text: 'Tap the thumbnails or type the numbers (for example, 1-3, 5).' },
        { name: 'Split and download', text: 'Tap the button and download the result, or all the files in a ZIP.' },
      ],
      faq: [
        ['Do I lose quality when splitting?', 'No. The pages are copied as they are, with their original text and images.'],
        ['Can I split a password-protected PDF?', 'If it only has restrictions (it opens without a password), yes. If it asks for a password to open, remove it first with Unlock PDF.'],
        ['What happens to the bookmarks?', 'In By bookmarks mode, each chapter in the outline becomes a PDF named after its bookmark.'],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'rotate-pdf-pages',
      title: 'How to rotate PDF pages and save them that way | DocuSmart',
      description:
        'Fix scanned pages that came out sideways or upside down: rotate one page or all of them 90° left or right, and save the PDF the right way up. Free, no upload.',
      h1: 'How to rotate PDF pages (and keep them that way when you save)',
      lead: 'It happens a lot with scans: a landscape sheet ends up sideways, or a page comes out upside down. Rotating it in the viewer doesn\'t help, because it looks wrong again once you send it. Here is how to fix it in the file itself.',
      sections: [
        {
          h2: 'Why rotating it in the viewer isn\'t enough',
          body: [
            'PDF viewers let you rotate the view, but that rotation isn\'t saved in the file: whoever receives it will see it crooked again. To fix it for good, you have to change the page orientation inside the PDF, which is what [Rotate PDF](/rotar-pdf) does.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Rotate PDF](/rotar-pdf) and choose the file. Each page appears as a thumbnail with its current rotation underneath (0°, 90°…). Tap a page to rotate it 90°, or use the arrows on each one to turn it left or right. If the whole document is sideways, use "All to the left" or "All to the right".',
            'Once every page looks right, tap "Rotate PDF" and download the result. Only the orientation changes: the text, the images and the quality stay the same.',
            { tip: 'If the pages are also out of order (common when scanning both sides), continue with [Reorder PDF pages](/ordenar-paginas-pdf).' },
          ],
        },
        {
          h2: 'Scans that come out crooked',
          body: [
            'Rotating works for pages that are sideways or upside down, in 90° steps. If the photo is tilted by a few degrees, it is better to scan it again with [Scan document](/escanear-documento), which detects the edges of the sheet and straightens it automatically.',
          ],
        },
        {
          h2: 'Common cases',
          body: [
            'When scanning double-sided, the back of each sheet often comes out upside down: tap those pages twice to rotate them 180°. In a report with landscape tables, rotate only those pages so they can be read without tilting your head; the rest stay as they are.',
            'If the PDF comes from phone photos, check the orientation when you create it: [Image to PDF](/imagen-a-pdf) has automatic, portrait or landscape orientation, so you won\'t have to rotate anything afterwards.',
          ],
        },
        {
          h2: 'Private from start to finish',
          body: [
            'The PDF is rotated inside your browser. It isn\'t uploaded to any server and isn\'t stored anywhere: when you close the tab, it\'s gone. It works the same on a computer and on a phone, and once the page has loaded it doesn\'t need a good signal.',
          ],
        },
      ],
      steps: [
        { name: 'Open Rotate PDF', text: 'Go to docusmart.online/en/rotate-pdf and choose the PDF.' },
        { name: 'Rotate the pages', text: 'Tap each page that is sideways, or use All to the left or All to the right.' },
        { name: 'Save', text: 'Tap Rotate PDF and download the file, now the right way up.' },
      ],
      faq: [
        ['Can I rotate just one page?', 'Yes. Each page is rotated separately; the others stay as they were.'],
        ['Do I lose quality?', 'No. Only the page orientation changes; the content isn\'t compressed again.'],
        ['Does it work on my phone?', 'Yes, in any modern browser, on Android and iPhone.'],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'reorder-pdf-pages',
      title: 'How to change the order of the pages in a PDF | DocuSmart',
      description:
        'Move PDF pages by dragging them, duplicate a page, add blank pages or remove the ones you don\'t need, then save the new order. Free, and nothing is uploaded.',
      h1: 'How to change the order of the pages in a PDF',
      lead: 'A double-sided scan that came out interleaved, an appendix that should have gone first, or a page that appears twice: here is how to put a PDF in order, page by page.',
      sections: [
        {
          h2: 'What you can do with each page',
          body: [
            'In [Reorder PDF pages](/ordenar-paginas-pdf) each page is a card, and with it you can:',
            { ul: [
              '**Move it**: drag it into place, or use the earlier and later arrows (easier on a phone).',
              '**Duplicate it**: for example, to repeat a cover page or a signature page.',
              '**Add a blank page** after it, to leave space or separate sections.',
              '**Remove it** if you don\'t need it.',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Reorder PDF pages](/ordenar-paginas-pdf) and choose the PDF. Move the pages until they are the way you need them: the number on each card ("P. 2", "P. 1"…) reminds you where it came from, so you don\'t lose track.',
            'When the order is right, tap "Apply new order" and download the PDF. The pages are copied as they are: neither the text nor the quality changes.',
            { tip: 'If the pages you want to reorder are in several files, merge them first with [Merge PDF](/unir-pdf) and then reorder them here.' },
          ],
        },
        {
          h2: 'To take pages out, splitting is better',
          body: [
            'If you only want to keep some of the pages, [Split PDF](/dividir-pdf) is quicker: you mark the ones you want and you\'re done. Reordering is for when the whole document stays, just in a different order.',
          ],
        },
        {
          h2: 'Common cases',
          body: [
            'When you scan double-sided on a machine that can\'t do it automatically, you get all the fronts first and then all the backs. To interleave them, move the last page after the first one, the second-to-last after the third, and so on to the end: with the arrows it goes quickly.',
            { ul: [
              'An appendix that should have gone first: move it before page one.',
              'A signature page that belongs in two places: duplicate it and move the copy where it\'s needed.',
              'Chapters that must start on an odd page when printing double-sided: add a blank page before them.',
            ] },
          ],
        },
        {
          h2: 'No need to upload your files',
          body: [
            'The new order is put together in your browser. The document doesn\'t travel over the internet and no copy stays on any server. That is why you can safely reorder case files, medical records or work documents that shouldn\'t leave your device.',
          ],
        },
      ],
      steps: [
        { name: 'Open Reorder PDF pages', text: 'Go to docusmart.online/en/reorder-pdf-pages and choose the PDF.' },
        { name: 'Move the pages', text: 'Drag them or use the arrows; duplicate pages, add blank ones or remove the ones you don\'t need.' },
        { name: 'Apply and download', text: 'Tap Apply new order and download the reordered PDF.' },
      ],
      faq: [
        ['Can I reorder pages on my phone?', 'Yes. Besides dragging, each page has arrows to move it earlier or later, which are easier to use with your finger.'],
        ['Are links and forms kept?', 'The pages are copied with their content; check the result if the document has complex forms.'],
        ['Is there a page limit?', 'There is no fixed number; with very large documents the thumbnails may take a little longer to appear.'],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'add-page-numbers-to-pdf',
      title: 'How to add page numbers to a PDF | DocuSmart',
      description:
        'Add page numbers to a PDF: choose the position, the format ("1", "1 / 10" or "Page 1 of 10"), the starting number and skip the cover. Free, with no upload.',
      h1: 'How to add page numbers to a PDF',
      lead: 'A thesis, a report or a case file is much easier to review when its pages are numbered. Here is how to number a PDF that has no page numbers, in whatever format you are asked for.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [Add page numbers to PDF](/numerar-paginas-pdf) and choose the PDF. Pick where the number goes (top or bottom; left, center or right) and the format: "1", "1 / 10" or "Page 1 of 10".',
            'Tap "Number pages". You will see the before and after side by side, page by page, so you can check that the number doesn\'t cover anything. Then download it.',
          ],
        },
        {
          h2: 'Options for common situations',
          body: [
            { ul: [
              '**No number on the first**: enter 1 to leave the cover unnumbered, or more if there is a table of contents or a dedication.',
              '**Start at**: so the numbering continues from another document, for example from 25.',
              '**Text**: write your own, for example "Folio {n}" or "{n} of {total}"; {n} is the page number and {total} is the last one.',
              '**Size and color**: small, medium or large, in any color you like.',
            ] },
            { tip: 'If the document is spread over several files, merge them first with [Merge PDF](/unir-pdf) so the numbering is continuous.' },
          ],
        },
        {
          h2: 'Keep the number from covering the content',
          body: [
            'Many documents already have something in the footer (a logo, an address). If the number lands on top of it, move it to another corner or up to the top: the before and after shows you every page before you download, and you can go from one to the next with the arrows.',
          ],
        },
        {
          h2: 'Number the pages last',
          body: [
            'The number is drawn onto each page. If you reorder or add pages afterwards, the numbers move with them and are no longer consecutive. That is why it is best to number at the end: first merge, reorder and remove what you don\'t need, then number the final version.',
            'For official documents or case files that use folio numbers, type "Folio {n}" in the text. And if the document continues the numbering of another one, adjust "Start at".',
          ],
        },
        {
          h2: 'All in your browser',
          body: [
            'The numbers are added on your device: the PDF isn\'t uploaded to any server. The document\'s text stays as text: you can search and copy it just as before, and the number is added as text too, so it prints sharply.',
          ],
        },
      ],
      steps: [
        { name: 'Open Add page numbers to PDF', text: 'Go to docusmart.online/en/add-page-numbers-to-pdf and choose the PDF.' },
        { name: 'Choose position and format', text: 'For example, bottom right and "Page 1 of 10".' },
        { name: 'Adjust anything else', text: 'No number on the cover, the starting number, size and color.' },
        { name: 'Number and download', text: 'Check the before and after and download the numbered PDF.' },
      ],
      faq: [
        ['Can I leave the cover unnumbered?', 'Yes. In "No number on the first", enter 1 (or however many pages you want to skip).'],
        ['Can I start at a different number?', 'Yes. In "Start at", enter the first number, for example 25.'],
        ['Can I write "Folio" before the number?', 'Yes. In the text, type "Folio {n}" and each page will show its number in place of {n}.'],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'add-watermark-to-pdf',
      title: 'How to add a watermark to a PDF (text or logo) | DocuSmart',
      description:
        'Add "CONFIDENTIAL", "COPY" or your logo to a PDF: position, tiling, angle, size, opacity and which pages. Free, in your browser and without uploading the file.',
      h1: 'How to add a watermark to a PDF (text or logo)',
      lead: 'To send a proposal as a draft, mark a copy of your ID card "Only for application X" or put your logo on a catalog: here is how to add a watermark to a PDF.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [Watermark PDF](/marca-de-agua-pdf) and choose the PDF. Type the text ("CONFIDENTIAL" is there as an example) or switch to "Image or logo" to use your own.',
            'Tap "Apply watermark": you will see the before and after side by side. If you want to change something, adjust it and apply it again; when you like it, download it.',
          ],
        },
        {
          h2: 'How to adjust it',
          body: [
            { ul: [
              '**Position**: in the center, in a corner or along an edge, or **tiled** so it repeats across the whole page.',
              '**Rotation**: 0°, 45°, 90° or −45°. The diagonal is the classic choice and the hardest to crop out.',
              '**Size, opacity and color**: a low opacity (20%) keeps the document readable; a higher one makes the mark stand out more.',
              '**Over or behind the content**: behind is more discreet on documents with a lot of text.',
              '**Pages**: all of them, or just some (for example, 1-3, 5).',
            ] },
          ],
        },
        {
          h2: 'A watermark for copies of your documents',
          body: [
            'If someone asks for a copy of your ID card or a bank statement, add a tiled mark such as "Only for the rental application, January 2026". That way, if the copy ends up somewhere else, it is clear what you handed it over for.',
            { tip: 'If you also want it to need a password to open, run it through [Protect PDF with a password](/proteger-pdf) afterwards.' },
          ],
        },
        {
          h2: 'Text ideas',
          body: [
            { ul: [
              '"DRAFT" for versions that aren\'t final yet.',
              '"COPY" or "CONTROLLED COPY" for documents that get handed out.',
              '"Only for [application] — [date]" on copies of identity documents.',
              '"SAMPLE" on catalogs, templates or work that hasn\'t been paid for yet.',
            ] },
            'For a mark that can be read without getting in the way of the document, an opacity between 15% and 30% usually works well. When tiled, a small or medium size looks cleaner. Before downloading, check several pages in the before and after.',
          ],
        },
        {
          h2: 'Without uploading the document',
          body: [
            'The mark is added inside your browser. The PDF isn\'t uploaded to any server, which matters precisely for the documents that need a watermark: copies of IDs, sales proposals or internal documents.',
          ],
        },
      ],
      steps: [
        { name: 'Open Watermark PDF', text: 'Go to docusmart.online/en/add-watermark-to-pdf and choose the PDF.' },
        { name: 'Type the text or choose your logo', text: 'For example, "CONFIDENTIAL" or "COPY".' },
        { name: 'Adjust position and style', text: 'Center or tiled, angle, size, opacity, color and pages.' },
        { name: 'Apply and download', text: 'Check the before and after and download the PDF.' },
      ],
      faq: [
        ['Can I use my logo?', 'Yes. Choose "Image or logo" and upload an image; a PNG with a transparent background looks best.'],
        ['Can it be removed later?', 'It is drawn into the PDF. Keep the original without the mark in case you need it again.'],
        ['Can I put it on only some pages?', 'Yes. In "Pages", type which ones, for example 1-3, 5.'],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'edit-pdf-without-software',
      title: 'How to edit a PDF without installing any software | DocuSmart',
      description:
        'Add or replace text, highlight, cover, draw, and add arrows, images and links to a PDF from your browser, without installing anything or uploading the file.',
      h1: 'How to edit a PDF without installing any software',
      lead: 'Fixing a date, filling in a missing detail, highlighting a clause or crossing something out: you don\'t need paid software for any of that. Here is how to edit a PDF in your browser.',
      sections: [
        {
          h2: 'The editor\'s tools',
          body: [
            'At the top of the page there is a toolbar with everything you can add in [Edit PDF](/editar-pdf):',
            { ul: [
              '**Text**: tap the page where you want to write and type in the box below; choose the font, size, bold and color.',
              '**Replace**: tap text that is already in the PDF and change it; the original is deleted from the document, not just covered up.',
              '**Rectangle, Circle, Highlight and Cover**: to mark, underline or cover with white.',
              '**Draw, Line and Arrow**: to point things out or make handwritten notes.',
              '**Image and Link**: to add a stamp or a logo, or link to a website or to another page of the PDF.',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Edit PDF](/editar-pdf) and choose the file. Pick "Text" on the toolbar and tap the page where it goes: a box appears that you can move, and you type in the panel below. With "Select" you tap any element to move it, resize it or remove it.',
            'If you make a mistake, use "Undo". When you are done, tap "Apply changes" and download the edited PDF.',
            { tip: 'Text can be in any alphabet (Latin, Cyrillic, Greek, Chinese, Japanese or Korean). Emojis aren\'t saved in the PDF.' },
          ],
        },
        {
          h2: 'Signing and filling in forms have their own tools',
          body: [
            'If what you need is to sign, [Sign PDF](/firmar-pdf) lets you draw, type or upload your signature and place it where it goes. And if the PDF has fields to fill in, [Fill in PDF form](/llenar-formulario-pdf) shows them one by one, which is easier than typing on top.',
          ],
        },
        {
          h2: 'Tips so the change doesn\'t show',
          body: [
            'To correct text that is already in the document, use **Replace**: it deletes the original and puts the new text in its place. If you only cover it with a white box, the old text is still in the file.',
            'Pick the font closest to the document\'s (Sans, Serif or Mono) and adjust the size until it matches. On a phone, move elements carefully: you can also change their position from the keyboard with the arrow keys.',
          ],
        },
        {
          h2: 'Your file stays with you',
          body: [
            'The whole editor runs inside your browser: the PDF isn\'t uploaded to any server, neither while you edit it nor when you save it.',
          ],
        },
      ],
      steps: [
        { name: 'Open Edit PDF', text: 'Go to docusmart.online/en/edit-pdf and choose the file.' },
        { name: 'Choose what to add', text: 'Text, replace, shapes, highlight, drawing, arrows, image or link.' },
        { name: 'Place it on the page', text: 'Tap the page, type or draw, and move it with Select.' },
        { name: 'Apply and download', text: 'Tap Apply changes and download the edited PDF.' },
      ],
      faq: [
        ['Can I change text that is already in the PDF?', 'Yes, with "Replace": tap the text, type the new one and the original is deleted from the document.'],
        ['Does it work with scanned PDFs?', 'You can add text, shapes and drawings on top. To replace text, the PDF needs real text; if it is a photo, run it through OCR first.'],
        ['Do I need to install anything?', 'No. It works in the browser on your computer or phone.'],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'compare-two-pdf-versions',
      title: 'How to compare two versions of a PDF and see what changed | DocuSmart',
      description:
        'Compare two PDFs to see which words were added or removed, or compare them page by page to spot changes in images and layout. Free, and nothing is uploaded.',
      h1: 'How to compare two versions of a PDF and see what changed',
      lead: 'A contract comes back "with a few tweaks" and nobody says which. Reading it twice hunting for differences is slow, and things slip through. Here is how to compare two versions in seconds.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [Compare PDF](/comparar-pdf). Choose the **Original** first and then the **New version**. If you put them the wrong way round, the "Swap" button switches them.',
            'Tap "Compare". At the top you will see how many words were added and how many were removed, and below that each change with its page: removed text struck through in red and added text in green, with a few lines of context so you can find it.',
          ],
        },
        {
          h2: 'Text or visual',
          body: [
            { ul: [
              '**Text**: compares the words. It is the best choice for contracts, letters and reports. You can ignore case and punctuation so they don\'t count as changes.',
              '**Visual (page by page)**: compares how each page looks. It is useful for plans, designs or scanned documents, where the changes may be images or tables and not just text.',
            ] },
            { tip: 'In a contract, pay special attention to changes in amounts, dates and names: the comparison shows them even when only a single digit changed.' },
          ],
        },
        {
          h2: 'After comparing',
          body: [
            'If you found something to fix, you can do it with [Edit PDF](/editar-pdf). And once both parties agree, sign the final version with [Sign PDF](/firmar-pdf).',
          ],
        },
        {
          h2: 'What it shows and what it doesn\'t',
          body: [
            'Each change appears with its page number and the surrounding lines, so you can find it quickly in the document. If a whole paragraph was moved without being changed, it is marked as moved instead of being counted as removed and added.',
            'If the two files have almost nothing in common (for example, you picked the wrong document), the tool tells you so instead of showing hundreds of changes. And if they are identical, it tells you that too, even when they have a different number of pages.',
            'It works for contracts, quotes, regulations, proposals that pass through several hands or a thesis that comes back with your supervisor\'s corrections: in all those cases, knowing exactly what changed saves you a full reread.',
          ],
        },
        {
          h2: 'Your documents aren\'t uploaded',
          body: [
            'Both PDFs are compared in your browser: neither is uploaded to a server. You can use it with contracts and confidential documents with peace of mind, because neither version is stored anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open Compare PDF', text: 'Go to docusmart.online/en/compare-pdf.' },
        { name: 'Choose the two files', text: 'First the original and then the new version.' },
        { name: 'Choose how to compare', text: 'Text (words) or Visual (page by page).' },
        { name: 'Review the changes', text: 'Removed text is struck through in red and added text is in green, with its page.' },
      ],
      faq: [
        ['Does it compare scanned PDFs?', 'In Visual mode, yes, because it compares how each page looks. Text mode needs the PDF to have real text.'],
        ['Does the order of the files matter?', 'Yes: whatever is in the new version and not in the original shows up as added. If you got it wrong, use Swap.'],
        ['Can I ignore a changed capital letter or comma?', 'Yes. Check "Ignore case" or "Ignore punctuation".'],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'redact-personal-data-in-pdf',
      title: 'How to black out personal data in a PDF (for real) | DocuSmart',
      description:
        'Redact ID numbers, account numbers, emails or names in a PDF: find and mark them on every page, and they are deleted from the file, not just covered up.',
      h1: 'How to black out personal data in a PDF (for real)',
      lead: 'Before sharing a bank statement, a contract or a medical record, you often need to hide account or ID numbers. Putting a black box on top isn\'t enough: here is how to do it properly.',
      sections: [
        {
          h2: 'Why a black box isn\'t enough',
          body: [
            'If you place a black rectangle over a number in an ordinary editor, the number is still in the file: anyone can select and copy it, or open the PDF in another program, and read it. Real redaction means **deleting** what is underneath, and that is what [Redact PDF](/censurar-pdf) does.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Redact PDF](/censurar-pdf) and choose the file. You can search for a name, a number or a word and it gets marked on every page at once. You can also mark all **Emails** or all **Numbers** (IDs, phone numbers, accounts) in one go, or drag over the page to cover an area by hand.',
            'Check every page: tap an area to move it or remove it. When everything is ready, tap "Redact PDF" and download the result.',
            { tip: 'Pages with marked areas are turned into images so that what you covered disappears from the file. The rest of the text on those pages can still be searched and copied.' },
          ],
        },
        {
          h2: 'Check before you send it',
          body: [
            'The search finds what is written as text. If part of the document is a photo or a scan, any data in it won\'t show up in the search: mark it by hand by dragging over the page. And keep the original separately, because redacted content can\'t be recovered.',
            'If the document is going to stay in other people\'s hands, you can also add a password with [Protect PDF with a password](/proteger-pdf) or a [watermark](/marca-de-agua-pdf) saying what you handed it over for.',
          ],
        },
        {
          h2: 'What usually needs to be covered',
          body: [
            { ul: [
              'ID numbers and bank account numbers.',
              'Addresses, phone numbers and email addresses.',
              'Signatures and photos of documents.',
              'Health data, salaries or information about other people.',
            ] },
          ],
        },
        {
          h2: 'Without uploading the document',
          body: [
            'The whole process happens in your browser: the document with the uncovered data never leaves your device. That is exactly what you want when redacting: if you uploaded the original to an online service to cover it, the data would already be out of your hands.',
          ],
        },
      ],
      steps: [
        { name: 'Open Redact PDF', text: 'Go to docusmart.online/en/redact-pdf and choose the file.' },
        { name: 'Mark what needs hiding', text: 'Search for some text, mark all emails or numbers, or drag over the page.' },
        { name: 'Check every page', text: 'Tap an area to move it or remove it.' },
        { name: 'Redact and download', text: 'Tap Redact PDF: what you covered is deleted from the file.' },
      ],
      faq: [
        ['Can redacted content be recovered?', 'No. What you cover is deleted from the file; that is why it is a good idea to keep the original separately.'],
        ['Does it work with scanned PDFs?', 'Yes, by marking the areas by hand. The automatic search only finds what is written as text.'],
        ['Can the rest of the document still be searched?', 'Yes. Only the pages with marked areas are turned into images, and their remaining text is kept for searching and copying.'],
      ],
    },
    'pasar-un-pdf-escaneado-a-texto': {
      slug: 'scanned-pdf-to-text',
      title: 'How to turn a scanned PDF into text you can copy and search | DocuSmart',
      description:
        'Recognize the text in a scanned PDF with OCR: copy it, download it as .txt or Word, or create a searchable PDF. In 12 languages, free and without uploading the file.',
      h1: 'How to turn a scanned PDF into text you can copy and search',
      lead: 'A scan is a photo of each page: you can read it, but you can\'t copy it or search for a word. OCR turns the text back into text, without retyping it.',
      sections: [
        {
          h2: 'What OCR does',
          body: [
            'OCR stands for optical character recognition: the software looks at the image of each page and recognizes the letters. [OCR: recognize text](/ocr-pdf) gives you two things at once:',
            { ul: [
              '**The recognized text**, to copy it or download it as .txt or Word, with the page each part comes from.',
              '**A searchable PDF**: the same scan, identical to the eye, with an invisible layer of text on top. You can select, copy and search for words with Ctrl+F.',
            ] },
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [OCR: recognize text](/ocr-pdf) and choose the scanned PDF (a JPG, PNG or WebP photo also works). Pick the **Document language**: recognition is far more accurate when it knows which language to expect. If the document mixes its language with English, tick that box too.',
            'Leave **Also create a searchable PDF** ticked if you want the PDF, and press **Recognize text**. You will see the progress page by page. When it finishes, the PDF is ready to download and, below it, the text, which you can copy or download as .txt or Word.',
            { tip: 'The first time, the language model is downloaded (a few seconds) and stays saved in your browser, so next time it starts right away.' },
          ],
        },
        {
          h2: 'How to get a better result',
          body: [
            'OCR reads what it sees. A sharp, straight, well-lit scan is recognized almost without errors; a blurry, shadowy or very small photo isn\'t. If the result looks doubtful, DocuSmart warns you with the confidence percentage so you can check the text.',
            { ul: [
              'Rotated pages are detected and read the right way up automatically.',
              'Pages that already have text (a mixed PDF) are left as they are, unless you tick **Also recognize pages that already have text**.',
              'It works with printed text. Handwriting is rarely recognized well.',
            ] },
          ],
        },
        {
          h2: 'If what you want is to edit it in Word',
          body: [
            'If your goal is to correct the document and not just copy the text, go straight to [PDF to Word](/pdf-a-word) with the OCR box ticked: it recognizes the scanned pages in the same step and builds an editable .docx. And if the searchable PDF is too heavy to send, run it through [Compress PDF](/comprimir-pdf).',
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'Recognition runs in your browser with Tesseract, an open-source OCR engine. The PDF isn\'t uploaded to any server, so you can use it with ID cards, medical records or bank statements without leaving copies anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open OCR', text: 'Go to docusmart.online/en/ocr-pdf and choose the scanned PDF or a photo.' },
        { name: 'Pick the language', text: 'Choose the document\'s language and tick whether it also has English text.' },
        { name: 'Recognize the text', text: 'Press Recognize text and wait for every page to finish.' },
        { name: 'Download', text: 'Download the searchable PDF, or copy the text or download it as .txt or Word.' },
      ],
      faq: [
        ['What is a searchable PDF?', 'It\'s your same scan with an invisible layer of text on top: it looks the same, but you can select, copy and search for words.'],
        ['How many pages can I recognize?', 'As many as you need: they are recognized one by one in your browser. A long document takes longer, but there is no page limit.'],
        ['Does it recognize several languages?', 'Twelve: Spanish, English, Portuguese, French, Italian, German, Catalan, Basque, Russian, Japanese, Korean and Chinese. If the document mixes its language with English, tick that box.'],
      ],
    },
    'copiar-el-texto-de-una-foto': {
      slug: 'copy-text-from-a-photo',
      title: 'How to copy the text from a photo or a screenshot | DocuSmart',
      description:
        'Get the text out of a photo, a screenshot or a photographed document and copy it, correct it or turn it into Word. Free, in 12 languages and without uploading the image.',
      h1: 'How to copy the text from a photo or a screenshot',
      lead: 'A photo of a receipt, a screenshot of a chat or a sign: the text is right in front of you, but you can\'t copy it. Here is how to get it out in seconds, without typing it by hand.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [Image to text (OCR)](/imagen-a-texto) and choose the photo. JPG, PNG, WebP and iPhone HEIC photos all work. If it\'s a screenshot, you don\'t even need to save it: copy it and paste it into the page with **Ctrl+V**.',
            'Pick the language under **Document language** and press **Recognize text**. In a few seconds the text appears in a box you can correct. From there you copy it with one tap or download it as .txt or Word (.docx).',
            { tip: 'If the text mixes your language with English words (product names, technical terms), tick "The document also has English text": it gets those words right more often.' },
          ],
        },
        {
          h2: 'Several photos into one document',
          body: [
            'If you photographed a document with several sheets, choose all the photos at once. The text from all of them comes out together, in order, and you download it as a single Word file. It\'s the fastest way to digitize a few printed pages someone lent you.',
          ],
        },
        {
          h2: 'How to take the photo so it reads well',
          body: [
            'Recognition depends on the photo. A few details make all the difference:',
            { ul: [
              '**Good light and no shadows**: your phone\'s shadow on the paper is the most common cause of errors.',
              '**Straight on and level**: the less tilted, the better.',
              '**Make the text look big**: move closer until the sheet fills the photo.',
              '**Sharp**: if the photo came out blurry, take it again.',
            ] },
            'If the result looks doubtful, DocuSmart warns you with the confidence percentage so you can check the text before using it. Handwriting is rarely recognized well: the tool is designed for printed or on-screen text.',
          ],
        },
        {
          h2: 'Photo or scanned PDF?',
          body: [
            'If what you have is a scanned PDF with several pages, or you want to keep the document as it looks and also be able to search for words, use [OCR: recognize text](/ocr-pdf), which creates a searchable PDF. And if you need to hand in the photos as a document, put them together first with [Image to PDF](/imagen-a-pdf).',
          ],
        },
        {
          h2: 'Your photos stay on your device',
          body: [
            'The text is recognized in your browser: the images aren\'t uploaded to any server. You can use it with photos of documents, receipts or conversations without leaving copies anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open Image to text', text: 'Go to docusmart.online/en/image-to-text and choose the photo, or paste a screenshot with Ctrl+V.' },
        { name: 'Pick the language', text: 'Choose the language of the text in the image.' },
        { name: 'Recognize the text', text: 'Press Recognize text and check the result in the box.' },
        { name: 'Copy or download', text: 'Copy it with one tap or download it as .txt or Word.' },
      ],
      faq: [
        ['Does it work with iPhone photos?', 'Yes. HEIC photos open directly, without converting them first.'],
        ['Does it recognize handwriting?', 'Rarely well. It works with printed or on-screen text.'],
        ['Can I correct the text before copying it?', 'Yes. The text appears in an editable box: fix whatever you need and then copy or download it.'],
      ],
    },
    'convertir-un-pdf-a-word-para-editarlo': {
      slug: 'convert-pdf-to-editable-word',
      title: 'How to convert a PDF to Word to edit it, even a scanned one | DocuSmart',
      description:
        'Turn a PDF into an editable Word file (.docx) with headings, bold, tables, images and two columns. With OCR for scanned files, free and without uploading the file.',
      h1: 'How to convert a PDF to Word to edit it, even if it\'s scanned',
      lead: 'Someone sent you a PDF and you need to change a date, a name or a paragraph, but you don\'t have the original Word file. Here is how to get it back as an editable document.',
      sections: [
        {
          h2: 'Before converting: what to expect',
          body: [
            'A PDF doesn\'t store paragraphs or tables: only letters and their position on the page. That\'s why any conversion to Word **rebuilds** the document, and the result looks very much like the original, but isn\'t identical. [PDF to Word](/pdf-a-word) keeps:',
            { ul: [
              'Headings, bold, italics, font sizes and colors.',
              'Lists, simple tables and images.',
              'Two-column layouts, like the ones in résumés, with the background of each column.',
            ] },
            'Text boxes and complex decorative shapes may come out differently. It works best with PDFs created from Word or a similar program.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [PDF to Word](/pdf-a-word) and choose the file. If the PDF is scanned, or has some scanned pages, leave **Recognize text on scanned pages** ticked and pick the document\'s language: those pages are read with OCR in the same step and their text becomes editable.',
            'Press **Convert**. You will see an approximate preview of the result next to the original, with how many paragraphs and images came out. Download the .docx and open it in Word, Google Docs, LibreOffice, Pages or WPS.',
            { tip: 'Check the document when you open it, especially tables and page breaks: that\'s where the layout tends to vary most.' },
          ],
        },
        {
          h2: 'Do you need Word, or is editing the PDF enough?',
          body: [
            'If you are only going to change a word, add a date or cover up a detail, you don\'t need to go through Word: with [Edit PDF](/editar-pdf) you write on top of the PDF and it stays just as it was, with its exact layout. Converting to Word makes sense when you are going to rewrite whole paragraphs or reuse the content in another document.',
          ],
        },
        {
          h2: 'Back to PDF',
          body: [
            'When you finish editing, save the document and convert it back with [Word to PDF](/word-a-pdf) to send it. That way whoever receives it sees it the same on any device, regardless of the fonts they have installed.',
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'The conversion, and the OCR of scanned pages, happen in your browser: the PDF isn\'t uploaded to any server. It works just as well for contracts, résumés or work documents that shouldn\'t be passed around.',
          ],
        },
      ],
      steps: [
        { name: 'Open PDF to Word', text: 'Go to docusmart.online/en/pdf-to-word and choose the PDF.' },
        { name: 'Turn on OCR if needed', text: 'If it has scanned pages, leave the OCR box ticked and pick the language.' },
        { name: 'Convert', text: 'Press Convert and check the approximate preview.' },
        { name: 'Download and edit', text: 'Download the .docx and open it in Word, Google Docs or LibreOffice.' },
      ],
      faq: [
        ['Does it come out identical to the PDF?', 'Very close, but not identical: the document is rebuilt from the position of the letters. Headings, formatting, lists, simple tables, images and two columns are kept.'],
        ['Does it work with scanned PDFs?', 'Yes. With the OCR box ticked, scanned pages are recognized in your browser and their text becomes editable.'],
        ['Can I convert a password-protected PDF?', 'If it only has restrictions (it opens without a password), yes. If it asks for a password to open, remove it first with Unlock PDF.'],
      ],
    },
    'pasar-un-extracto-bancario-pdf-a-excel': {
      slug: 'bank-statement-pdf-to-excel',
      title: 'How to turn a PDF bank statement or invoice into Excel | DocuSmart',
      description:
        'Convert the tables in a PDF bank statement, invoice or report into an Excel sheet with the numbers ready to add up. Free and without uploading the file.',
      h1: 'How to turn a PDF bank statement or invoice into Excel',
      lead: 'You need to add up the month\'s expenses, reconcile an account or filter a report, and the data is in a PDF. Here is how to move it into a spreadsheet without copying cell by cell.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [PDF to Excel](/pdf-a-excel) and choose the PDF. Choose how you want the **Sheets**:',
            { ul: [
              '**One per page**: each page of the PDF on its own sheet. Useful for reports where each page is a different table.',
              '**All in one sheet**: all the rows one after another on a single sheet. Best for a statement that runs over several pages, because you can filter it and add it up in one go.',
            ] },
            'Press **Convert**. You will see an approximate preview with how many rows and numbers came out. Download the .xlsx and open it in Excel, Google Sheets or LibreOffice.',
          ],
        },
        {
          h2: 'Numbers stay numbers',
          body: [
            'This is the detail that saves the most time: values like 1,500,000, $2,000, 3.5 or 45% are saved as Excel numbers with their format, not as text. You can add them up, average them or use them in formulas as soon as you open the file, without cleaning up separators or currency symbols.',
            { tip: 'If a column of values won\'t add up, check that it doesn\'t mix in text such as "N/A" or dashes: Excel ignores those cells in the sum.' },
          ],
        },
        {
          h2: 'Which PDFs it works best with',
          body: [
            'Columns are built from the position of the text on the page. That\'s why it works very well with PDFs exported by a system: bank statements, e-invoices, accounting reports or listings. With free-form PDFs, where the text doesn\'t follow columns, the result needs more checking.',
            'If the statement is scanned, or a photo someone turned into a PDF, leave **Recognize text on scanned pages** ticked and pick the language: those pages are read with OCR in the same step and each column ends up in its own cell. The sharper the scan, the better the result.',
          ],
        },
        {
          h2: 'To hand it back in',
          body: [
            'If, after working on the sheet, you have to send it as a document, convert it with [Excel to PDF](/excel-a-pdf). And if you only need the text of the scan, without tables, use [OCR: recognize text](/ocr-pdf).',
          ],
        },
        {
          h2: 'Your data stays on your device',
          body: [
            'A bank statement has your account number, your balance and your transactions. Here the conversion happens in your browser: the PDF isn\'t uploaded to any server or stored anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open PDF to Excel', text: 'Go to docusmart.online/en/pdf-to-excel and choose the PDF.' },
        { name: 'Choose the sheets', text: 'One sheet per page, or everything on a single sheet to add it all up at once.' },
        { name: 'Convert', text: 'Press Convert and check the approximate preview.' },
        { name: 'Download', text: 'Download the .xlsx and open it in Excel, Google Sheets or LibreOffice.' },
      ],
      faq: [
        ['Can the numbers be added up?', 'Yes. Values with thousands separators, currency symbols, decimals or percentages are saved as Excel numbers.'],
        ['Does it work with a scanned statement?', 'Yes. With the OCR box ticked, scanned pages are recognized in your browser and each column ends up in its own cell.'],
        ['Is my statement uploaded to the internet?', 'No. The conversion happens inside your browser; the file never leaves your device.'],
      ],
    },
    'sacar-el-texto-de-un-pdf': {
      slug: 'extract-text-from-pdf',
      title: 'How to extract all the text from a PDF to copy or search it | DocuSmart',
      description:
        'Extract the text from a PDF into a .txt file or copy it from the screen with one click, without the page layout. Free, instant and without uploading the file.',
      h1: 'How to extract all the text from a PDF to copy or search it',
      lead: 'You want to paste the content of a PDF into an email, a chat or another document, and when you copy it the lines break apart. Here is how to get clean text from every page at once.',
      sections: [
        {
          h2: 'Step by step',
          body: [
            'Open [PDF to text](/pdf-a-texto), choose the PDF and press **Convert**. In a moment you will see the text of every page on screen, with how many lines it has. From there you copy it with one click or download the .txt file.',
            'The .txt opens on any device, even in Notepad or on your phone, and weighs almost nothing: a hundred-page document usually comes to a few hundred KB.',
          ],
        },
        {
          h2: 'What it\'s for',
          body: [
            { ul: [
              '**Searching**: open the text and look for a word or a number in a long document.',
              '**Reusing**: paste paragraphs into an email or a chat without the PDF\'s line breaks.',
              '**Counting or analyzing**: pass the text to another tool, such as the [Word and character counter](/contador-de-palabras).',
              '**Keeping the essentials**: save a document\'s content without its layout.',
              '**Translating or listening**: paste the text into a translator, or into your phone\'s read-aloud feature, without the breaks you get when copying straight from the PDF.',
            ] },
          ],
        },
        {
          h2: 'What is kept and what isn\'t',
          body: [
            'The text and line breaks are kept, in the reading order of each page. The visual layout (columns, tables, colors, images) becomes plain text. If you need the content **with its formatting** to keep editing it, use [PDF to Word](/pdf-a-word).',
            { tip: 'If a table matters to you, keep in mind that it loses its columns in the .txt. To work with it in cells, [PDF to Excel](/pdf-a-excel) is a better choice.' },
          ],
        },
        {
          h2: 'If it comes out empty: it\'s a scan',
          body: [
            'If DocuSmart tells you it found no text, the PDF is scanned: each page is a photo, and there are no letters to extract. In that case use [OCR: recognize text](/ocr-pdf), which recognizes the text in the image in your browser and gives it to you to copy or download.',
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'The text is read in your browser: the PDF isn\'t sent to any server. That\'s why you can use it with work or personal documents without leaving copies anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open PDF to text', text: 'Go to docusmart.online/en/pdf-to-text and choose the PDF.' },
        { name: 'Convert', text: 'Press Convert: you will see the text of every page.' },
        { name: 'Copy or download', text: 'Copy it with one click or download the .txt file.' },
      ],
      faq: [
        ['Why does it come out empty?', 'Because the PDF is scanned: the pages are images. Use OCR: recognize text to get its text.'],
        ['Are tables kept?', 'Not as tables: they become lines of text. To keep the columns, use PDF to Excel.'],
        ['Is there a page limit?', 'No. The text is extracted from every page, even if the document is long.'],
      ],
    },
    'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes': {
      slug: 'pdf-to-jpg-or-extract-images',
      title: 'How to convert a PDF to JPG or get out the photos inside it | DocuSmart',
      description:
        'Turn each page of a PDF into a JPG or PNG at the resolution you choose, or get out the photos inside it at their original quality. Free and without uploading the file.',
      h1: 'How to convert a PDF to JPG or get out the photos inside it',
      lead: 'To post a page on social media, send it on WhatsApp as an image or recover a photo you only have inside a PDF. These are two different tools, and it helps to know which one to use.',
      sections: [
        {
          h2: 'Whole page or just the photos?',
          body: [
            { ul: [
              '**[PDF to JPG](/pdf-a-jpg)** turns each **whole page** into an image, with its text, its photos and its layout, like a screenshot but in good quality.',
              '**[Extract images from a PDF](/extraer-imagenes-pdf)** gets out **only the photos and graphics** inside it, each one separately and at its original size, without the text around them.',
            ] },
            'If you want to show a page exactly as it looks, use PDF to JPG. If you want the logo, the product photo or the floor plan that comes inside the document, use Extract images.',
          ],
        },
        {
          h2: 'PDF to JPG, step by step',
          body: [
            'Open [PDF to JPG](/pdf-a-jpg) and choose the PDF. Pick the **Image format** and the **Resolution**:',
            { ul: [
              '**PNG** keeps the exact quality and is better for pages with text; **JPG** is lighter and ideal for sharing. With JPG you also choose the quality.',
              '**72 dpi** for viewing on screen, **150 dpi** for almost everything and **300 dpi** for printing.',
            ] },
            'If you only want some pages, type them in **Pages** (for example, 1-3, 5); leaving it empty converts them all. Press **Convert**: you will see each image with its page number, and if there are several they are downloaded together in a ZIP.',
          ],
        },
        {
          h2: 'Extract images, step by step',
          body: [
            'Open [Extract images from a PDF](/extraer-imagenes-pdf), choose the PDF and press **Find images**. All the photos and graphics appear with their page, their size and their format. Choose the ones you want and download them one by one or all in a ZIP.',
            'JPEG photos come out **identical** to the originals, byte for byte; the rest are saved as PNG, with no loss. Leave **Skip small images** ticked so you don\'t end up with a pile of icons and bullets.',
            { tip: 'In a scanned PDF each page is a single large image, so Extract images gives you back the pages. In that case either tool will do.' },
          ],
        },
        {
          h2: 'If the image is too heavy',
          body: [
            'At 300 dpi an A4 page is more than 2,400 pixels wide. If you need it lighter for the web or a form, run it through [Compress image](/comprimir-imagen). And everything happens in your browser: the PDF isn\'t uploaded to any server.',
          ],
        },
      ],
      steps: [
        { name: 'Choose the tool', text: 'PDF to JPG for whole pages; Extract images for the photos inside it.' },
        { name: 'Choose the PDF', text: 'Open the tool on docusmart.online and choose the file.' },
        { name: 'Adjust and convert', text: 'In PDF to JPG choose format, resolution and pages; in Extract images press Find images and choose the ones you want.' },
        { name: 'Download', text: 'Download each image or all of them together in a ZIP.' },
      ],
      faq: [
        ['Which resolution should I choose?', '150 dpi works for almost everything. 72 dpi if it will only be viewed on screen and 300 dpi if it will be printed.'],
        ['Do extracted photos lose quality?', 'No. JPEG photos are copied identical to the originals and the rest are saved as PNG, with no loss.'],
        ['Can I convert just one page?', 'Yes. In PDF to JPG type its number in Pages, for example 3, and only that one is converted.'],
      ],
    },
    'convertir-un-pdf-a-pdfa-para-un-tramite': {
      slug: 'convert-pdf-to-pdfa',
      title: 'How to convert a PDF to PDF/A for an official filing or an archive | DocuSmart',
      description:
        'Convert a PDF to PDF/A-2b, 1b or 3b, the archival format required by government agencies, courts and universities. Free and without uploading the file.',
      h1: 'How to convert a PDF to PDF/A for an official filing or for archiving',
      lead: 'A court, a university or a government agency asks for the document "in PDF/A" and the portal rejects your PDF. Here is how to convert it, and how to know which version to pick.',
      sections: [
        {
          h2: 'What PDF/A is and why they ask for it',
          body: [
            'PDF/A is the version of PDF designed for archiving (ISO 19005). The file carries everything it needs to display inside it: its fonts, its color profile and its metadata, and it can\'t depend on anything external, such as scripts, links to fonts or content loaded from somewhere else. That way it looks the same today and many years from now.',
            'That\'s why courts ask for it when filing briefs and lawsuits, many universities for theses and dissertations, and government agencies for applications and records.',
          ],
        },
        {
          h2: 'Which version to choose',
          body: [
            { ul: [
              '**PDF/A-2b**: the recommended one, and the one almost every institution asks for. It supports transparency and layers.',
              '**PDF/A-1b**: the oldest, only for systems that accept nothing else. It doesn\'t support transparency or layers.',
              '**PDF/A-3b**: like 2b, but it keeps attached files, for example the XML of an e-invoice.',
            ] },
            'If the filing doesn\'t say which one, use PDF/A-2b.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [PDF to PDF/A](/pdf-a-pdfa), choose the PDF and the **Version**, and press **Convert to PDF/A**. When it finishes you will see the result next to the original and a summary of what was adjusted to meet the standard: for example, the fonts that were embedded in the file or the scripts that were removed.',
            { tip: 'Files created by DocuSmart are validated with veraPDF, the PDF Association\'s reference validator, the same one many portals use to check what they receive.' },
          ],
        },
        {
          h2: 'If a page was saved as an image',
          body: [
            'Some things can\'t go into PDF/A as they are: print colors (CMYK) without their profile, or fonts that aren\'t inside the file and can\'t be embedded. In that case that page is saved as an image: it looks the same, but its text can no longer be selected. DocuSmart tells you which pages and why. If you need that text to be searchable, run the result through [OCR: recognize text](/ocr-pdf).',
            'If the portal also sets a size limit, check the file size afterwards and, if needed, use [Compress PDF](/comprimir-pdf).',
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'The conversion happens in your browser: the PDF isn\'t uploaded to any server. You can convert lawsuits, contracts or ID documents without leaving copies anywhere else.',
          ],
        },
      ],
      steps: [
        { name: 'Open PDF to PDF/A', text: 'Go to docusmart.online/en/pdf-to-pdfa and choose the PDF.' },
        { name: 'Choose the version', text: 'PDF/A-2b if the filing doesn\'t say which; 1b or 3b only if they ask for them.' },
        { name: 'Convert', text: 'Press Convert to PDF/A and check the summary of what was adjusted.' },
        { name: 'Download', text: 'Download the PDF/A and upload it to the filing portal.' },
      ],
      faq: [
        ['Which version do courts ask for?', 'Almost always PDF/A-2b, or simply "PDF/A". If the institution names a version, choose that one.'],
        ['Does the content of my document change?', 'Not the text or the layout. Missing fonts are embedded and things the standard doesn\'t allow are removed, such as scripts or attachments (except in PDF/A-3b).'],
        ['How do I know it meets the standard?', 'When it finishes, DocuSmart tells you which version it meets. Results are validated with veraPDF, the reference validator.'],
      ],
    },
    'reparar-un-pdf-que-no-abre': {
      slug: 'repair-pdf-that-wont-open',
      title: 'How to repair a PDF that won\'t open, shows blank or gives an error | DocuSmart',
      description:
        'Recover a damaged PDF or a download that got cut off: DocuSmart rebuilds its structure and rescues the complete pages. Free and without uploading the file.',
      h1: 'How to repair a PDF that won\'t open, shows blank or gives an error',
      lead: '"The file is damaged and could not be repaired", a blank screen or a download that got cut off. Before you give the document up for lost, try rebuilding it.',
      sections: [
        {
          h2: 'Why a PDF gets damaged',
          body: [
            'At the end of the file, a PDF has an index that says where each page and each image begins. If that index is lost or shifted, the reader can\'t find anything and shows an error, even though the content is still there. It happens mostly with:',
            { ul: [
              'Downloads or attachments that were cut off halfway.',
              'Files copied to a USB drive that was removed too early.',
              'Programs that saved the PDF badly or only half-edited it.',
            ] },
            'The signs are always similar: the reader says the file is damaged, it opens but the pages are blank, or it looks fine on your device and a portal rejects it when you upload it.',
          ],
        },
        {
          h2: 'Step by step',
          body: [
            'Open [Repair PDF](/reparar-pdf), choose the damaged file and press **Repair PDF**. The tool reads the file from start to finish, finds the pages even if the index is broken and writes a new, healthy copy.',
            'When it finishes you will see the repaired copy next to the original and it will tell you what happened: whether it found and fixed problems, whether the file was fine, or, if it was cut off, how many pages were rescued out of how many it had.',
            { tip: 'Even if the PDF opens, repairing it is sometimes worth it: if a portal rejects it or a tool gives an error, a rewritten copy usually solves it.' },
          ],
        },
        {
          h2: 'What can and can\'t be recovered',
          body: [
            'Whatever arrived complete is recovered. If a download was cut off at 70%, the pages within that 70% are rescued; the ones at the end, which never arrived, can\'t be rebuilt. In that case the best thing is to download the file again or ask for it again, and use the repaired copy in the meantime.',
            'If the PDF needs a password to open, remove it first with [Unlock PDF](/desbloquear-pdf) and then repair it. And if what you rescued are scanned pages and you need their text, use [OCR: recognize text](/ocr-pdf).',
          ],
        },
        {
          h2: 'Your document stays on your device',
          body: [
            'The repair happens in your browser: the file isn\'t uploaded to any server. You can try it with personal or work documents without leaving copies anywhere else, and the original isn\'t modified.',
          ],
        },
      ],
      steps: [
        { name: 'Open Repair PDF', text: 'Go to docusmart.online/en/repair-pdf and choose the damaged PDF.' },
        { name: 'Repair', text: 'Press Repair PDF: its structure is rebuilt.' },
        { name: 'Check the result', text: 'See what was fixed and how many pages were rescued.' },
        { name: 'Download', text: 'Download the repaired copy; the original doesn\'t change.' },
      ],
      faq: [
        ['Can it recover a file that was cut off?', 'Yes, the pages that managed to arrive complete. The ones missing from the end of the file can\'t be rebuilt.'],
        ['Is my original file modified?', 'No. A separate repaired copy is downloaded.'],
        ['Does it work with password-protected PDFs?', 'First remove the password with Unlock PDF and then repair it.'],
      ],
    },
  },
}
