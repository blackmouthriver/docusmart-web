// Traducción al portugués de tools/guides.mjs (W-19). Misma estructura que el español.
// Los enlaces internos se escriben con la ruta ESPAÑOLA (/unir-pdf, /guias/<slug-es>):
// el generador los convierte a la ruta de este idioma.
export default {
  ui: {
    guides: 'Guias',
    guidesSlug: 'guias',
    indexTitle: 'Guias de PDF passo a passo: juntar, assinar, digitalizar | DocuSmart',
    indexDescription:
      'Guias curtos e práticos para juntar, comprimir, assinar, digitalizar e proteger PDFs com senha pelo celular ou computador, de graça e sem enviar seus arquivos.',
    indexH1: 'Guias passo a passo',
    indexLead: 'Guias práticos que mostram, do início ao fim, como resolver as tarefas mais comuns com documentos. Todas as ferramentas funcionam no seu navegador, então seus arquivos não saem do seu aparelho.',
    minutes: '{n} min de leitura',
    updated: 'Atualizado em {date}',
    summary: 'Resumo rápido',
    toolsTitle: 'Ferramentas deste guia',
    moreGuides: 'Mais guias',
    related: 'Guias relacionados',
  },
  guides: {
    'unir-pdf-en-el-celular': {
      slug: 'juntar-pdf-no-celular',
      title: 'Como juntar PDF no celular sem enviar seus arquivos | DocuSmart',
      description:
        'Guia passo a passo para juntar vários PDFs em um só pelo celular, de graça e sem enviá-los a nenhum servidor. Funciona no navegador, no Android e no iPhone.',
      h1: 'Como juntar PDF no celular sem enviar seus arquivos',
      lead: 'Juntar o RG, o comprovante e o formulário em um único PDF é uma das tarefas mais comuns em qualquer cadastro. Veja como fazer isso pelo celular, em um minuto e sem entregar seus documentos a um servidor de terceiros.',
      sections: [
        {
          h2: 'Por que é importante não enviar os arquivos',
          body: [
            'A maioria dos sites para juntar PDF recebe seus documentos nos servidores deles, processa tudo lá e devolve o resultado. Para o cardápio de um restaurante, tanto faz; para um RG, um extrato bancário ou um prontuário médico, nem tanto: você não sabe por quanto tempo eles guardam os arquivos nem quem pode vê-los.',
            'O DocuSmart junta os arquivos dentro do navegador do seu celular. O arquivo nunca trafega pela internet, então não fica cópia em nenhum servidor. Por isso funciona até com sinal fraco, depois que a página carrega.',
          ],
        },
        {
          h2: 'Antes de começar',
          body: [
            { ul: [
              'Tenha os PDFs salvos no celular (em Downloads, no app Arquivos ou na sua nuvem).',
              'Se algum deles for uma foto e não um PDF, converta antes com [Imagem para PDF](/imagen-a-pdf).',
              'Se um PDF tiver senha, remova-a antes com [Desbloquear PDF](/desbloquear-pdf) (você precisa saber a senha).',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Juntar PDF](/unir-pdf) no navegador do celular (Chrome, Safari, Samsung Internet ou o que você usar). Toque no quadro para escolher os arquivos: dá para selecionar vários de uma vez.',
            'Confira a ordem da lista. O primeiro arquivo será o início do documento final; mova os arquivos com as setas até ficarem na ordem que você precisa. Depois toque em "Juntar": o PDF combinado é baixado com todas as páginas.',
            { tip: 'Precisa mudar a ordem de páginas avulsas, e não de arquivos inteiros? Junte primeiro e depois abra o resultado em [Organizar páginas](/ordenar-paginas-pdf), onde você pode mover ou remover cada página.' },
          ],
        },
        {
          h2: 'Se o PDF final ficar pesado demais',
          body: [
            'Muitos portais de serviços públicos e serviços de e-mail limitam o tamanho dos anexos (2 MB, 5 MB ou 10 MB são limites comuns). Se passar do limite, use o [Comprimir PDF](/comprimir-pdf): o nível "Sem perda" não mexe na qualidade, e o "Média" reduz bem mais os PDFs que vêm de digitalizações ou fotos.',
          ],
        },
        {
          h2: 'E se você faz isso com frequência',
          body: [
            'O site funciona em qualquer celular. Se você usa Android e junta documentos com frequência, o app do DocuSmart faz a mesma coisa sem internet e deixa seus arquivos organizados no aparelho.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Juntar PDF', text: 'Abra a ferramenta Juntar PDF no docusmart.online, pelo navegador do celular.' },
        { name: 'Escolha os PDFs', text: 'Toque no quadro e selecione todos os arquivos que você quer juntar.' },
        { name: 'Coloque em ordem', text: 'Mova os arquivos com as setas: o primeiro será o início do documento.' },
        { name: 'Junte e baixe', text: 'Toque em "Juntar" e um único PDF com todas as páginas é baixado.' },
      ],
      faq: [
        ['Funciona no iPhone?', 'Sim. Funciona no Safari e em qualquer navegador moderno, no iPhone e no Android. O app sem internet é só para Android.'],
        ['Quantos PDFs posso juntar?', 'Não há um número fixo. O limite é a memória do celular: com documentos muito grandes, pode demorar um pouco mais.'],
        ['Perde qualidade?', 'Não. As páginas são copiadas exatamente como estão, com o texto, as imagens e o tamanho originais.'],
      ],
    },
    'pasar-fotos-a-pdf': {
      slug: 'fotos-para-pdf',
      title: 'Como transformar fotos em PDF (várias fotos em um só arquivo) | DocuSmart',
      description:
        'Converta fotos do celular ou do computador em um PDF, uma foto por página. Grátis, sem cadastro e sem enviar suas imagens. Dicas para o arquivo ficar legível e leve.',
      h1: 'Como transformar fotos em PDF, várias em um só arquivo',
      lead: 'Pedem "o documento em PDF" e o que você tem são fotos na galeria. Veja como transformá-las em um PDF organizado, legível e leve, sem instalar nada.',
      sections: [
        {
          h2: 'Dois caminhos, conforme o tipo de foto',
          body: [
            { ul: [
              '**Fotos que já estão boas** (capturas de tela, imagens baixadas, fotos tiradas de frente): use o [Imagem para PDF](/imagen-a-pdf). Cada foto vira uma página, do jeito que está.',
              '**Fotos de uma folha de papel** (um recibo, um contrato, um certificado): use o [Digitalizar documento](/escanear-documento). Ele encontra as bordas da folha, endireita a imagem e deixa o papel branco para parecer digitalizado.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo com o Imagem para PDF',
          body: [
            'Abra o [Imagem para PDF](/imagen-a-pdf) e escolha suas imagens. Ele aceita JPG, PNG, WebP, BMP e GIF, e você pode misturar os formatos.',
            'Coloque as imagens em ordem com as setas: cada imagem será uma página, nessa ordem. Toque em "Converter" e pronto: você tem um único PDF.',
          ],
        },
        {
          h2: 'Como tirar a foto para ficar legível',
          body: [
            { ul: [
              'Luz uniforme, sem flash direto: as sombras da sua mão ou do celular atrapalham a leitura.',
              'A folha sobre uma superfície escura (uma mesa de madeira, por exemplo): assim o scanner encontra melhor as bordas.',
              'O celular paralelo à folha, não inclinado.',
              'A folha aparecendo inteira, com um pouco de margem.',
            ] },
            { tip: 'No [Digitalizar documento](/escanear-documento) você pode marcar "Tornar o PDF pesquisável": o texto é reconhecido para poder ser pesquisado e copiado, algo que alguns portais agradecem.' },
          ],
        },
        {
          h2: 'Para não ficar pesado demais',
          body: [
            'Uma foto de celular moderno pode ter 3 ou 4 MB; dez fotos já formam um PDF pesado para mandar por e-mail. Se o resultado ficar grande, passe-o pelo [Comprimir PDF](/comprimir-pdf) no nível "Média", que reduz bastante as páginas que são fotos. Você também pode comprimir as fotos antes com o [Comprimir imagem](/comprimir-imagen).',
          ],
        },
        {
          h2: 'Se você tem iPhone',
          body: [
            'Ao escolher fotos pelo Safari, o iPhone normalmente as entrega em JPG, então elas funcionam sem precisar fazer mais nada. Se você copiou as fotos para o computador e elas aparecem como arquivos .HEIC, esse formato ainda não pode ser convertido aqui.',
            'Para o iPhone salvar as próximas fotos em JPG, vá em Ajustes › Câmera › Formatos e escolha "Mais Compatível". Para as fotos que você já tem, envie-as para o computador pelo app Fotos usando a opção de compartilhar: nesse caso, elas costumam chegar convertidas em JPG.',
          ],
        },
        {
          h2: 'Suas fotos não saem do aparelho',
          body: [
            'A conversão acontece no seu navegador: as fotos não são enviadas a nenhum servidor. Isso é importante quando se trata de documentos de identidade ou informações de saúde.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Imagem para PDF', text: 'Abra a ferramenta Imagem para PDF no docusmart.online.' },
        { name: 'Escolha as fotos', text: 'Selecione as imagens (JPG, PNG, WebP, BMP ou GIF).' },
        { name: 'Coloque em ordem', text: 'Use as setas: cada imagem será uma página, nessa ordem.' },
        { name: 'Converta', text: 'Toque em "Converter" para obter um único PDF.' },
      ],
      faq: [
        ['Posso colocar várias fotos em uma só página?', 'O Imagem para PDF coloca uma foto por página, que é o que os cadastros e formulários costumam pedir. Se você precisar de várias em uma folha, junte-as antes em uma única imagem.'],
        ['Qual a diferença para digitalizar?', 'O Digitalizar documento recorta a folha, endireita a imagem e melhora o contraste; o Imagem para PDF mantém a foto como ela é. Para papéis, digitalizar dá um resultado mais limpo.'],
        ['Funciona sem internet?', 'Depois que a página abre, a conversão não precisa de conexão. Se você instalar o DocuSmart Desktop ou o app para Android, funciona totalmente sem internet.'],
      ],
    },
    'reducir-tamano-pdf': {
      slug: 'reduzir-tamanho-pdf',
      title: 'Como reduzir o tamanho de um PDF para e-mail, WhatsApp ou portais | DocuSmart',
      description:
        'Por que um PDF fica tão pesado e como diminuir o tamanho sem perder a legibilidade. Que nível de compressão escolher para cada documento. Grátis e sem enviar arquivos.',
      h1: 'Como reduzir o tamanho de um PDF',
      lead: '"O arquivo excede o tamanho máximo permitido." Se essa mensagem apareceu para você em um portal ou no e-mail, este guia explica por que isso acontece e como resolver sem deixar o documento ilegível.',
      sections: [
        {
          h2: 'Por que um PDF fica tão pesado',
          body: [
            'O que mais pesa em um PDF são as imagens. Um documento criado no Word, só com texto, costuma ter algumas centenas de kilobytes, mesmo com muitas páginas. Já um montado com fotos ou com um scanner configurado em alta resolução pode passar fácil de 10 MB com poucas páginas.',
            'Por isso a compressão funciona de forma bem diferente conforme o tipo de PDF: em um documento de texto há pouco para reduzir; em uma digitalização, muito.',
          ],
        },
        {
          h2: 'Qual nível escolher',
          body: [
            { ul: [
              '**Sem perda:** otimiza a estrutura do arquivo sem mexer na qualidade. O texto continua selecionável. É a opção segura para contratos, notas fiscais e documentos digitais.',
              '**Média:** recomendado para digitalizações e fotos. Reduz muito o tamanho e continua fácil de ler.',
              '**Alta:** para quando o limite é muito rígido. Atenção: nos níveis Média e Alta o texto vira imagem, então não dá mais para selecioná-lo.',
            ] },
            { tip: 'Comece pelo "Sem perda". Se não chegar ao tamanho que você precisa, tente o "Média". O DocuSmart mostra quanto o arquivo diminuiu antes de você enviá-lo.' },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Comprimir PDF](/comprimir-pdf), escolha o arquivo e selecione o nível. Toque em "Comprimir PDF": você verá o tamanho antes e depois, e o resultado é baixado.',
            'Se o PDF já estava otimizado e não dá para reduzi-lo mais, o DocuSmart avisa e não baixa uma cópia igual ou mais pesada.',
          ],
        },
        {
          h2: 'Se mesmo assim não for suficiente',
          body: [
            { ul: [
              '**Divida o documento:** muitos portais aceitam vários anexos. Com o [Dividir PDF](/dividir-pdf) você separa o arquivo em dois ou mais.',
              '**Comprima as fotos antes de montar o PDF:** o [Comprimir imagem](/comprimir-imagen) reduz uma foto de celular entre 60% e 90%, quase sem diferença visível.',
              '**Tire as páginas que sobram:** com o [Organizar páginas](/ordenar-paginas-pdf) você exclui capas ou páginas em branco.',
            ] },
          ],
        },
        {
          h2: 'Limites comuns',
          body: [
            'Como referência: o Gmail permite anexos de até 25 MB e o Outlook, de até 20 MB. Muitos portais de serviços públicos e de bancos pedem arquivos entre 2 e 5 MB cada. Sempre confira o limite do site onde você vai enviar o arquivo.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Comprimir PDF', text: 'Abra a ferramenta Comprimir PDF no docusmart.online.' },
        { name: 'Escolha o arquivo', text: 'Selecione o PDF que está pesado demais.' },
        { name: 'Selecione o nível', text: '"Sem perda" para documentos digitais; "Média" ou "Alta" para digitalizações e fotos.' },
        { name: 'Comprima', text: 'Toque em "Comprimir PDF", veja quanto diminuiu e baixe o resultado.' },
      ],
      faq: [
        ['Comprimir estraga o documento?', 'Com "Sem perda", não: o conteúdo fica idêntico. Com "Média" e "Alta", as páginas viram imagens mais leves, que se leem bem, mas perdem o texto selecionável.'],
        ['Meu PDF é enviado para a internet?', 'Não. A compressão acontece dentro do seu navegador: o arquivo nunca sai do seu aparelho.'],
        ['Por que meu PDF quase não diminuiu?', 'Provavelmente é um PDF de texto ou que já vinha otimizado. Nesses casos o tamanho já é pequeno e há pouco para tirar.'],
      ],
    },
    'firmar-pdf-sin-imprimir': {
      slug: 'assinar-pdf-sem-imprimir',
      title: 'Como assinar um PDF sem imprimir (pelo celular ou PC) | DocuSmart',
      description:
        'Assine um PDF sem imprimir nem digitalizar: desenhe sua assinatura, digite-a ou use uma foto. Qual a validade de uma assinatura eletrônica simples. Grátis e privado.',
      h1: 'Como assinar um PDF sem imprimir',
      lead: 'Imprimir, assinar com caneta, digitalizar e enviar de novo: quatro passos que você pode trocar por um só. Veja como assinar um PDF pelo celular ou pelo computador.',
      sections: [
        {
          h2: 'Três formas de criar sua assinatura',
          body: [
            { ul: [
              '**Desenhar** com o dedo no celular ou com o mouse no computador.',
              '**Digitar seu nome**, que aparece com uma letra cursiva, como se fosse escrita à mão.',
              '**Enviar uma foto** da sua assinatura feita no papel. É a que mais se parece com a sua assinatura de sempre.',
            ] },
            { tip: 'Para a foto: assine com tinta escura em uma folha branca, com boa luz e sem sombras. O DocuSmart remove o fundo para que fique só o traço.' },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Assinar PDF](/firmar-pdf) e escolha o documento. Crie sua assinatura de qualquer uma das três formas.',
            'Arraste a assinatura até o lugar certo e ajuste o tamanho. Se o documento pede rubrica em cada folha, use "Repetir em todas as páginas". Toque em "Assinar PDF".',
          ],
        },
        {
          h2: 'Se também for preciso preencher dados',
          body: [
            'Muitos documentos para assinar são formulários: nome, número do documento, data. Se o PDF tiver campos preenchíveis, complete-os primeiro com o [Preencher formulário](/llenar-formulario-pdf) e depois assine. Antes de enviar, marque "Achatar" para que as respostas fiquem fixas.',
          ],
        },
        {
          h2: 'Erros comuns ao assinar',
          body: [
            { ul: [
              '**Assinatura minúscula ou pixelada:** aumente até ela ocupar o espaço da linha de assinatura; se vier de uma foto, tire-a de perto e com boa luz.',
              '**Assinatura em cima do texto:** mova-a até não cobrir nenhum dado do documento; um contrato com a assinatura sobre uma cláusula pode gerar dúvidas.',
              '**Assinar a versão errada:** confira se é o documento final antes de assinar; corrigir depois obriga a assinar de novo.',
              '**Esquecer as outras páginas:** se o documento pede assinatura ou rubrica em cada folha, use "Repetir em todas as páginas" em vez de ir uma por uma.',
            ] },
          ],
        },
        {
          h2: 'Tem validade jurídica?',
          body: [
            'O que você obtém é uma **assinatura eletrônica simples**: a imagem da sua assinatura sobre o documento, o equivalente digital de assinar à mão. Ela serve para a maioria das situações do dia a dia: contratos de aluguel, autorizações, formulários de empresa ou autorizações escolares.',
            'Alguns procedimentos exigem uma **assinatura digital com certificado**, emitida por uma autoridade certificadora credenciada; por exemplo, certos atos perante órgãos públicos ou a emissão de nota fiscal eletrônica. Se o procedimento pedir isso explicitamente, a assinatura em imagem não basta.',
          ],
        },
        {
          h2: 'Sua assinatura não fica salva em lugar nenhum',
          body: [
            'A assinatura e o documento são processados dentro do navegador. Eles não são enviados a um servidor nem ficam salvos: ao fechar a página, a assinatura é apagada. Se você for enviar o documento por um canal pouco confiável, pode colocar uma senha com o [Proteger PDF com senha](/proteger-pdf).',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Assinar PDF', text: 'Abra a ferramenta Assinar PDF no docusmart.online e escolha o documento.' },
        { name: 'Crie sua assinatura', text: 'Desenhe, digite seu nome ou envie uma foto da sua assinatura no papel.' },
        { name: 'Posicione', text: 'Arraste a assinatura até o lugar e ajuste o tamanho; você pode repeti-la em todas as páginas.' },
        { name: 'Baixe', text: 'Toque em "Assinar PDF" para obter o PDF assinado.' },
      ],
      faq: [
        ['Posso assinar pelo celular?', 'Sim. No celular você pode desenhar a assinatura com o dedo ou tirar uma foto da sua assinatura no papel.'],
        ['O documento assinado pode ser modificado?', 'A assinatura fica incorporada à página. Para evitar alterações e acessos indesejados, você pode proteger o PDF com senha e tirar a permissão de modificar.'],
        ['Posso assinar várias páginas?', 'Sim: adicione a assinatura em cada página que quiser ou use "Repetir em todas as páginas".'],
      ],
    },
    'escanear-documentos-con-el-celular': {
      slug: 'digitalizar-documentos-com-o-celular',
      title: 'Como digitalizar documentos com o celular e salvar em PDF | DocuSmart',
      description:
        'Digitalize documentos com a câmera do celular, sem instalar apps: recorte automático, filtro que remove sombras e PDF com texto pesquisável. Dicas para um resultado nítido.',
      h1: 'Como digitalizar documentos com o celular',
      lead: 'Você não precisa de scanner nem de instalar um app: a câmera do celular e o navegador bastam para conseguir um PDF limpo, recortado e com o texto reconhecido.',
      sections: [
        {
          h2: 'O que um scanner faz (e por que só uma foto não basta)',
          body: [
            'A foto de uma folha quase nunca sai perfeita: fica um pouco torta, aparece a mesa em volta e o papel branco fica cinza ou com sombras. Um scanner de celular corrige isso: encontra os quatro cantos da folha, endireita a imagem como se você tivesse fotografado de cima e deixa o fundo branco.',
            'É isso que o [Digitalizar documento](/escanear-documento) faz, direto no navegador.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Digitalizar documento](/escanear-documento) e toque em "Tirar foto": no celular, a câmera abre. Você também pode escolher fotos que já tem.',
            'Confira os cantos que o DocuSmart encontrou; se algum ficou errado, arraste-o até a ponta da folha. Escolha o filtro "Documento" para deixar o papel branco e remover as sombras. Adicione mais páginas se o documento tiver várias folhas.',
            'Toque em "Criar PDF". Se você marcar "Tornar o PDF pesquisável", o texto também é reconhecido para você poder pesquisar palavras e copiá-las.',
          ],
        },
        {
          h2: 'Cinco truques para uma digitalização nítida',
          body: [
            { ul: [
              'Coloque a folha sobre uma superfície escura: o contraste ajuda a detectar as bordas.',
              'Procure luz natural ou uma luminária de lado; evite o flash direto, que causa reflexos.',
              'Segure o celular paralelo à folha e espere ele focar.',
              'Deixe a folha bem lisa: as dobras criam sombras que o filtro nem sempre consegue remover.',
              'Para várias páginas, digitalize todas na mesma sessão e elas sairão em um único PDF.',
            ] },
          ],
        },
        {
          h2: 'Reconhecer o texto de uma digitalização que você já tem',
          body: [
            'Se você já tem um PDF digitalizado ou uma foto e precisa copiar o texto, use o [OCR](/ocr-pdf): ele reconhece texto impresso em espanhol e inglês e entrega o resultado para você copiar, como arquivo .txt ou como PDF pesquisável. Funciona melhor com digitalizações nítidas e retas; letra de mão costuma ser mal reconhecida.',
          ],
        },
        {
          h2: 'Privado do começo ao fim',
          body: [
            'A detecção de bordas, o endireitamento, os filtros e o reconhecimento de texto acontecem dentro do seu navegador. As fotos não são enviadas a nenhum servidor. Se você digitaliza com frequência, o app do DocuSmart para Android faz a mesma coisa sem internet.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Digitalizar documento', text: 'Abra a ferramenta Digitalizar documento no docusmart.online e toque em "Tirar foto".' },
        { name: 'Ajuste os cantos', text: 'Confira o recorte e arraste os cantos, se for preciso.' },
        { name: 'Escolha o filtro', text: 'O filtro "Documento" deixa o papel branco e remove as sombras.' },
        { name: 'Salve o PDF', text: 'Toque em "Criar PDF"; marque "Tornar o PDF pesquisável" para reconhecer o texto.' },
      ],
      faq: [
        ['Preciso instalar um app?', 'Não. Funciona no navegador do celular ou do computador. O app para Android é opcional, para digitalizar sem internet.'],
        ['O que é um PDF pesquisável?', 'Um PDF que, além da imagem, contém o texto reconhecido: você pode pesquisar palavras, selecioná-las e copiá-las.'],
        ['E se ele não encontrar bem as bordas?', 'Arraste cada canto até a ponta da folha ou use "Foto inteira". Ajuda se o papel contrastar com o fundo.'],
      ],
    },
    'proteger-pdf-con-contrasena': {
      slug: 'proteger-pdf-com-senha',
      title: 'Como colocar senha em um PDF (e quando vale a pena) | DocuSmart',
      description:
        'Proteja um PDF com senha e criptografia AES-256, controle se ele pode ser impresso ou copiado e aprenda a compartilhar a senha com segurança. Grátis e sem enviar o arquivo.',
      h1: 'Como colocar senha em um PDF',
      lead: 'Um PDF com seus dados pessoais, financeiros ou médicos que circula por e-mail ou por chat pode parar em qualquer lugar. Colocar uma senha leva um minuto e impede que quem não deve consiga abri-lo.',
      sections: [
        {
          h2: 'Quando vale a pena proteger um PDF',
          body: [
            { ul: [
              'Documentos de identidade, extratos bancários, holerites ou declarações de imposto de renda.',
              'Prontuários médicos, resultados de exames ou atestados médicos.',
              'Contratos ou propostas que você não quer ver circulando.',
              'Qualquer arquivo que você vai enviar por um canal que não controla, como um e-mail que é encaminhado ou um grupo de chat.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Proteger PDF com senha](/proteger-pdf) e escolha o documento. Digite a senha duas vezes.',
            'Decida o que é permitido com o PDF aberto: imprimir, copiar o texto ou modificá-lo. Toque em "Proteger PDF" e a versão criptografada é baixada. Ela abre no Adobe Acrobat, no Chrome, no Edge e no app do DocuSmart, que pedem a senha.',
          ],
        },
        {
          h2: 'Uma boa senha e como compartilhá-la',
          body: [
            { ul: [
              'Use pelo menos 10 caracteres; uma frase curta com números é fácil de lembrar e difícil de adivinhar.',
              'Não use o número do seu documento nem a sua data de nascimento: é a primeira coisa que alguém tentaria.',
              '**Nunca envie a senha pelo mesmo meio que o PDF.** Se o arquivo vai por e-mail, mande a senha por mensagem ou diga por telefone.',
            ] },
            { tip: 'Guarde a senha em um lugar seguro. Se você esquecer, não há como recuperá-la: nem o DocuSmart consegue abrir o PDF, porque a senha nunca sai do seu aparelho.' },
          ],
        },
        {
          h2: 'O que cada opção protege',
          body: [
            'A **senha de abertura** é a proteção de verdade: sem ela, o arquivo criptografado não pode ser lido. As **permissões** (imprimir, copiar, modificar) são outra coisa: elas indicam aos leitores de PDF o que devem permitir depois que o documento é aberto.',
            'Os programas sérios respeitam essas permissões, mas quem já tem a senha pode removê-las com algumas ferramentas. Use-as para evitar cópias acidentais ou alterações casuais, não como única barreira. Se alguém não deve ver uma informação, não passe a senha para essa pessoa ou oculte essa informação antes de enviar o arquivo.',
          ],
        },
        {
          h2: 'Senha não é o mesmo que ocultar dados',
          body: [
            'A senha impede que o arquivo seja aberto, mas quem a tiver verá todo o conteúdo. Se você precisa compartilhar um documento escondendo só alguns dados (um número de conta, um endereço), use o [Ocultar dados do PDF](/censurar-pdf): ele apaga de verdade o texto que fica embaixo das áreas cobertas, em vez de só colocar um retângulo preto por cima.',
          ],
        },
        {
          h2: 'Remover a senha depois',
          body: [
            'Se mais tarde você precisar de uma cópia sem proteção, o [Desbloquear PDF](/desbloquear-pdf) remove a senha, desde que você a conheça. Use apenas com documentos seus ou que você tenha direito de modificar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Proteger PDF', text: 'Abra a ferramenta Proteger PDF com senha no docusmart.online e escolha o documento.' },
        { name: 'Digite a senha', text: 'Digite-a duas vezes para confirmar.' },
        { name: 'Escolha as permissões', text: 'Marque se é permitido imprimir, copiar ou modificar.' },
        { name: 'Proteja e baixe', text: 'Toque em "Proteger PDF" e o documento criptografado é baixado.' },
      ],
      faq: [
        ['Quão seguro é?', 'Usa criptografia AES-256, o padrão mais forte para PDFs. A segurança real depende de a senha ser difícil de adivinhar.'],
        ['Minha senha é enviada para algum servidor?', 'Não. A criptografia acontece no seu navegador; nem o arquivo nem a senha saem do seu aparelho.'],
        ['Posso tirar a senha de um PDF de outra pessoa?', 'Só se você souber a senha. O DocuSmart não quebra senhas de abertura.'],
      ],
    },
  },
}
