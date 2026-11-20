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
            'If you already have a scanned PDF or a photo and need to copy its text, use [OCR](/ocr-pdf): it recognizes printed text in Spanish and English and gives it to you to copy, as a .txt file or as a searchable PDF. It works best with sharp, straight scans; handwriting is usually recognized poorly.',
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
  },
}
