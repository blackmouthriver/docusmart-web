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
            'Muitos documentos para assinar são formulários: nome, número do documento, data. Se o PDF tiver campos preenchíveis, complete-os primeiro com o [Preencher formulário](/llenar-formulario-pdf) e depois assine. Antes de enviar, marque "Nivelar" para que as respostas fiquem fixas.',
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
            'Se você já tem um PDF digitalizado ou uma foto e precisa copiar o texto, use o [OCR](/ocr-pdf): ele reconhece texto impresso em 12 idiomas (português, espanhol, inglês, francês, russo, japonês, chinês e mais) e entrega o resultado para você copiar, como arquivo .txt ou como PDF pesquisável. Funciona melhor com digitalizações nítidas e retas; letra de mão costuma ser mal reconhecida.',
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
    'dividir-pdf-en-varios-archivos': {
      slug: 'dividir-pdf-em-varios-arquivos',
      title: 'Como dividir um PDF em vários arquivos ou extrair algumas páginas | DocuSmart',
      description:
        'Separe um PDF por páginas, por intervalos, a cada N páginas, por marcadores ou por tamanho, ou extraia só as páginas que precisa. De graça e sem enviar o arquivo.',
      h1: 'Como dividir um PDF em vários arquivos ou extrair só algumas páginas',
      lead: 'Um portal pede só a página da assinatura, ou um PDF de 80 páginas não cabe no e-mail. Veja como separar um PDF em partes, ou ficar só com as páginas certas, direto no navegador.',
      sections: [
        {
          h2: 'Seis formas de dividir',
          body: [
            'Antes de começar, vale saber do que você precisa, porque o [Dividir PDF](/dividir-pdf) tem um modo para cada caso:',
            { ul: [
              '**Escolher páginas**: você toca nas miniaturas (ou digita "1-3, 5") e sai um PDF só com essas páginas.',
              '**Por intervalos**: vários intervalos de uma vez, e cada um vira um PDF separado.',
              '**A cada N páginas**: partes iguais, por exemplo de 10 em 10.',
              '**Por marcadores**: um PDF para cada capítulo, se o documento tiver um índice de marcadores.',
              '**Por tamanho**: partes que não passam de um certo tamanho, para e-mails ou portais com limite.',
              '**Cada página separada**: um PDF por página.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Dividir PDF](/dividir-pdf) e escolha o arquivo. Você verá as páginas em miniatura. Em "Escolher páginas", toque nas que quer levar: elas ficam marcadas em azul e o campo de cima é preenchido sozinho.',
            'Toque no botão de baixo. Ao terminar, você verá o resultado ao lado do original para conferir, e pode baixá-lo com o nome que quiser. Se o modo gerar vários arquivos, você os recebe um por um ou todos juntos em um ZIP.',
            { tip: 'Para tirar páginas soltas de vários PDFs e juntá-las em um só, é mais rápido usar o [Juntar PDF](/unir-pdf): lá você escolhe quais páginas pegar de cada arquivo.' },
          ],
        },
        {
          h2: 'Se as partes continuarem pesadas',
          body: [
            'Dividir não muda a qualidade: cada página é copiada como está. Se uma parte ainda passar do limite, use o modo **Por tamanho** ou passe-a pelo [Comprimir PDF](/comprimir-pdf). Uma única página digitalizada em alta resolução pode, sozinha, pesar mais que o limite: nesse caso, o que resolve é comprimi-la.',
          ],
        },
        {
          h2: 'Casos comuns',
          body: [
            { ul: [
              'Um portal pede só a frente e o verso do seu documento: escolha essas duas páginas e envie apenas esse PDF.',
              'Um extrato do ano inteiro: se ele tiver marcadores por mês, use **Por marcadores**; se não, **A cada N páginas**.',
              'Um e-mail com limite de 10 MB: use **Por tamanho**, coloque 10 e cada parte fica abaixo disso.',
            ] },
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'A divisão é feita no seu navegador: o PDF não é enviado a nenhum servidor. Por isso você pode usá-la com extratos, prontuários médicos ou contratos sem deixar cópias em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Dividir PDF', text: 'Acesse docusmart.online/pt/dividir-pdf e escolha o arquivo.' },
        { name: 'Escolha o modo', text: 'Escolher páginas, por intervalos, a cada N páginas, por marcadores, por tamanho ou cada página separada.' },
        { name: 'Marque as páginas', text: 'Toque nas miniaturas ou digite os números (por exemplo, 1-3, 5).' },
        { name: 'Divida e baixe', text: 'Toque no botão e baixe o resultado, ou todos os arquivos em um ZIP.' },
      ],
      faq: [
        ['Perco qualidade ao dividir?', 'Não. As páginas são copiadas como estão, com o texto e as imagens originais.'],
        ['Posso dividir um PDF com senha?', 'Se ele só tiver restrições (abre sem senha), sim. Se pedir senha para abrir, remova-a antes com o Desbloquear PDF.'],
        ['O que acontece com os marcadores?', 'No modo Por marcadores, cada capítulo do índice vira um PDF com o nome do marcador.'],
      ],
    },
    'girar-paginas-de-un-pdf': {
      slug: 'girar-paginas-de-pdf',
      title: 'Como girar as páginas de um PDF e salvar assim | DocuSmart',
      description:
        'Endireite páginas digitalizadas de lado ou de cabeça para baixo: gire uma página ou todas, 90° para a esquerda ou a direita, e salve o PDF certinho. Sem enviar nada.',
      h1: 'Como girar as páginas de um PDF (e fazer o giro ficar salvo)',
      lead: 'Acontece muito com digitalizações: uma folha na horizontal ficou de lado, ou uma página saiu de cabeça para baixo. Girar no visualizador não adianta, porque ao enviar ela volta a aparecer errada. Veja como corrigir no próprio arquivo.',
      sections: [
        {
          h2: 'Por que não basta girar no visualizador',
          body: [
            'Os visualizadores de PDF deixam girar a visualização, mas esse giro não fica salvo no arquivo: quem receber vai ver tudo torto de novo. Para resolver, é preciso mudar a orientação da página no próprio PDF, que é o que o [Girar PDF](/rotar-pdf) faz.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Girar PDF](/rotar-pdf) e escolha o arquivo. Cada página aparece em miniatura com o giro atual embaixo (0°, 90°…). Toque em uma página para girá-la 90°, ou use as setas de cada uma para girar para a esquerda ou para a direita. Se o documento inteiro estiver de lado, use "Todas para a esquerda" ou "Todas para a direita".',
            'Quando todas estiverem na posição certa, toque em "Girar PDF" e baixe o resultado. Só a orientação muda: o texto, as imagens e a qualidade continuam iguais.',
            { tip: 'Se as páginas também ficaram fora de ordem (acontece ao digitalizar frente e verso), continue no [Organizar páginas PDF](/ordenar-paginas-pdf).' },
          ],
        },
        {
          h2: 'Digitalizações que saem tortas',
          body: [
            'Girar serve para folhas de lado ou de cabeça para baixo, em passos de 90°. Se a foto ficou inclinada alguns graus, é melhor digitalizá-la de novo com o [Digitalizar documento](/escanear-documento), que detecta as bordas da folha e a endireita sozinho.',
          ],
        },
        {
          h2: 'Casos comuns',
          body: [
            'Ao digitalizar frente e verso, é comum o verso sair de cabeça para baixo: toque nessas páginas duas vezes para girá-las 180°. Em um relatório com tabelas na horizontal, gire só essas páginas para que dê para ler sem virar a cabeça; as outras ficam como estão.',
            'Se o PDF vem de fotos do celular, confira a orientação ao criá-lo: o [Imagem para PDF](/imagen-a-pdf) tem orientação automática, retrato ou paisagem, e assim você não precisa girar depois.',
          ],
        },
        {
          h2: 'Privado do começo ao fim',
          body: [
            'O PDF é girado dentro do seu navegador. Ele não é enviado a nenhum servidor nem fica salvo em lugar nenhum: quando você fecha a aba, ele some. Funciona igual no computador e no celular e, depois que a página carrega, não precisa de um bom sinal.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Girar PDF', text: 'Acesse docusmart.online/pt/girar-pdf e escolha o PDF.' },
        { name: 'Gire as páginas', text: 'Toque em cada página que estiver de lado, ou use Todas para a esquerda ou Todas para a direita.' },
        { name: 'Salve', text: 'Toque em Girar PDF e baixe o arquivo já na posição certa.' },
      ],
      faq: [
        ['Posso girar só uma página?', 'Sim. Cada página é girada separadamente; as outras ficam como estavam.'],
        ['Perco qualidade?', 'Não. Só muda a orientação da página; o conteúdo não é comprimido de novo.'],
        ['Funciona no celular?', 'Sim, em qualquer navegador moderno, no Android e no iPhone.'],
      ],
    },
    'ordenar-paginas-de-un-pdf': {
      slug: 'organizar-paginas-de-pdf',
      title: 'Como mudar a ordem das páginas de um PDF | DocuSmart',
      description:
        'Mova as páginas de um PDF arrastando, duplique uma, adicione páginas em branco ou remova as que sobram, e salve a nova ordem. De graça e sem enviar o arquivo.',
      h1: 'Como mudar a ordem das páginas de um PDF',
      lead: 'Uma digitalização frente e verso que saiu intercalada, um anexo que devia vir no começo ou uma página repetida: veja como organizar um PDF página por página.',
      sections: [
        {
          h2: 'O que você pode fazer com cada página',
          body: [
            'No [Organizar páginas PDF](/ordenar-paginas-pdf), cada página é um cartão, e com ele você pode:',
            { ul: [
              '**Movê-la**: arrastando até o lugar certo, ou com as setas de mover para trás e para a frente (mais prático no celular).',
              '**Duplicá-la**: por exemplo, para repetir uma capa ou uma folha de assinaturas.',
              '**Adicionar uma página em branco** depois dela, para deixar espaço ou separar seções.',
              '**Removê-la** se estiver sobrando.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Organizar páginas PDF](/ordenar-paginas-pdf) e escolha o PDF. Mova as páginas até deixá-las do jeito que precisa: o número de cada cartão ("Pág. 2", "Pág. 1"…) lembra de onde ela veio, assim você não se perde.',
            'Quando a ordem estiver certa, toque em "Aplicar nova ordem" e baixe o PDF. As páginas são copiadas como estão: nem o texto nem a qualidade mudam.',
            { tip: 'Se as páginas que você quer organizar estão em vários arquivos, junte-os primeiro com o [Juntar PDF](/unir-pdf) e depois organize aqui.' },
          ],
        },
        {
          h2: 'Para tirar páginas, é melhor dividir',
          body: [
            'Se o que você quer é ficar só com algumas páginas, o [Dividir PDF](/dividir-pdf) é mais rápido: você marca as que vai levar e pronto. Organizar serve quando o documento inteiro continua, mas em outra ordem.',
          ],
        },
        {
          h2: 'Casos comuns',
          body: [
            'Ao digitalizar frente e verso em um aparelho que não faz isso sozinho, primeiro saem todas as frentes e depois todos os versos. Para intercalá-los, mova a última página para depois da primeira, a penúltima para depois da terceira e assim até o fim: com as setas é rápido.',
            { ul: [
              'Um anexo que devia vir no começo: mova-o para antes da primeira página.',
              'Uma folha de assinaturas que vai em dois lugares: duplique-a e leve a cópia para onde precisar.',
              'Capítulos que devem começar em página ímpar ao imprimir frente e verso: adicione uma página em branco antes.',
            ] },
          ],
        },
        {
          h2: 'Sem enviar seus arquivos',
          body: [
            'A nova ordem é montada no seu navegador. O documento não viaja pela internet nem fica cópia em nenhum servidor. Por isso você pode organizar com tranquilidade processos, prontuários médicos ou documentos de trabalho que não deveriam sair do seu aparelho.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Organizar páginas PDF', text: 'Acesse docusmart.online/pt/organizar-paginas-pdf e escolha o PDF.' },
        { name: 'Mova as páginas', text: 'Arraste ou use as setas; duplique, adicione páginas em branco ou remova as que sobram.' },
        { name: 'Aplique e baixe', text: 'Toque em Aplicar nova ordem e baixe o PDF organizado.' },
      ],
      faq: [
        ['Posso organizar pelo celular?', 'Sim. Além de arrastar, cada página tem setas para movê-la para trás ou para a frente, que são mais fáceis de usar com o dedo.'],
        ['Os links e formulários são mantidos?', 'As páginas são copiadas com o conteúdo; confira o resultado se o documento tiver formulários complexos.'],
        ['Existe limite de páginas?', 'Não há um número fixo; com documentos muito grandes, as miniaturas podem demorar um pouco mais para aparecer.'],
      ],
    },
    'numerar-paginas-de-un-pdf': {
      slug: 'numerar-paginas-de-pdf',
      title: 'Como colocar números de página em um PDF | DocuSmart',
      description:
        'Adicione números de página a um PDF: posição, formato "1", "1 / 10" ou "Página 1 de 10", o número inicial e sem numerar a capa. De graça e sem enviar o arquivo.',
      h1: 'Como colocar números de página em um PDF',
      lead: 'Uma tese, um relatório ou um processo ficam muito mais fáceis de revisar com as páginas numeradas. Veja como numerar um PDF que não tem números, no formato que pedirem.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Numerar páginas PDF](/numerar-paginas-pdf) e escolha o PDF. Escolha onde fica o número (em cima ou embaixo; à esquerda, no centro ou à direita) e o formato: "1", "1 / 10" ou "Página 1 de 10".',
            'Toque em "Numerar páginas". Você verá o antes e o depois lado a lado, página por página, para conferir se o número não cobre nada. Depois é só baixar.',
          ],
        },
        {
          h2: 'Opções que resolvem casos comuns',
          body: [
            { ul: [
              '**Sem número nas primeiras**: coloque 1 para não numerar a capa, ou mais se houver sumário ou dedicatória.',
              '**Começar em**: para a numeração continuar a de outro documento, por exemplo a partir da 25.',
              '**Texto**: escreva o seu, por exemplo "Folha {n}" ou "{n} de {total}"; {n} é o número da página e {total}, o da última.',
              '**Tamanho e cor**: pequeno, médio ou grande, na cor que você quiser.',
            ] },
            { tip: 'Se o documento estiver dividido em vários arquivos, junte-os primeiro com o [Juntar PDF](/unir-pdf) para que a numeração seja contínua.' },
          ],
        },
        {
          h2: 'Para o número não cobrir o conteúdo',
          body: [
            'Muitos documentos já trazem algo no rodapé (um logo, um endereço). Se o número cair em cima, troque de canto ou leve-o para cima: o antes e o depois mostra cada página antes de baixar, e você passa de uma para outra com as setas.',
          ],
        },
        {
          h2: 'Numere por último',
          body: [
            'O número fica desenhado em cada página. Se depois você reordenar ou adicionar páginas, os números se movem junto e deixam de ser sequenciais. Por isso, o ideal é numerar no final: primeiro junte, organize e tire o que sobra, e numere a versão definitiva.',
            'Em documentos para órgãos públicos ou processos, onde se fala em folhas, escreva "Folha {n}" no texto. E se o documento continua a numeração de outro, ajuste o "Começar em".',
          ],
        },
        {
          h2: 'Tudo no seu navegador',
          body: [
            'A numeração é adicionada no seu aparelho: o PDF não é enviado a nenhum servidor. O texto do documento continua sendo texto: dá para pesquisar e copiar como antes, e o número também fica como texto, nítido na impressão.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Numerar páginas PDF', text: 'Acesse docusmart.online/pt/numerar-paginas-pdf e escolha o PDF.' },
        { name: 'Escolha posição e formato', text: 'Por exemplo, embaixo à direita e "Página 1 de 10".' },
        { name: 'Ajuste o que precisar', text: 'Sem número na capa, a partir de qual número começar, tamanho e cor.' },
        { name: 'Numere e baixe', text: 'Confira o antes e o depois e baixe o PDF numerado.' },
      ],
      faq: [
        ['Posso não numerar a capa?', 'Sim. Em "Sem número nas primeiras", coloque 1 (ou quantas páginas quiser pular).'],
        ['Posso começar em outro número?', 'Sim. Em "Começar em", coloque o primeiro número, por exemplo 25.'],
        ['Dá para escrever "Folha" antes do número?', 'Sim. No texto, escreva "Folha {n}" e cada página vai mostrar o seu número no lugar de {n}.'],
      ],
    },
    'poner-marca-de-agua-a-un-pdf': {
      slug: 'colocar-marca-dagua-em-pdf',
      title: 'Como colocar marca d’água em um PDF (texto ou logo) | DocuSmart',
      description:
        'Adicione "CONFIDENCIAL", "CÓPIA" ou seu logo a um PDF: posição, mosaico, ângulo, tamanho, opacidade e em quais páginas. De graça, no navegador e sem enviar nada.',
      h1: 'Como colocar marca d’água em um PDF (texto ou logo)',
      lead: 'Para enviar uma proposta como rascunho, marcar uma cópia do seu RG com "Somente para o trâmite X" ou colocar seu logo em um catálogo: veja como adicionar uma marca d’água a um PDF.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Marca d’água em PDF](/marca-de-agua-pdf) e escolha o PDF. Escreva o texto ("CONFIDENCIAL" já vem como exemplo) ou mude para "Imagem ou logo" para usar o seu.',
            'Toque em "Aplicar marca d’água": você verá o antes e o depois lado a lado. Se quiser mudar algo, ajuste e aplique de novo; quando gostar, é só baixar.',
          ],
        },
        {
          h2: 'Como ajustá-la',
          body: [
            { ul: [
              '**Posição**: no centro, em um canto ou em uma borda, ou em **mosaico** para se repetir na página toda.',
              '**Rotação**: 0°, 45°, 90° ou −45°. A diagonal é a mais clássica e a mais difícil de recortar.',
              '**Tamanho, opacidade e cor**: uma opacidade baixa (20 %) deixa ler o documento; mais alta, a marca fica mais visível.',
              '**Sobre ou atrás do conteúdo**: atrás, ela fica mais discreta em documentos com muito texto.',
              '**Páginas**: todas, ou só algumas (por exemplo, 1-3, 5).',
            ] },
          ],
        },
        {
          h2: 'Uma marca d’água para cópias de documentos',
          body: [
            'Se pedirem uma cópia do seu RG ou de um extrato, coloque uma marca como "Somente para o aluguel do apartamento, janeiro de 2026" em mosaico. Assim, se a cópia for parar em outro lugar, fica claro para que você a entregou.',
            { tip: 'Se quiser também que ela só abra com uma senha, passe-a depois pelo [Proteger PDF com senha](/proteger-pdf).' },
          ],
        },
        {
          h2: 'Ideias de texto',
          body: [
            { ul: [
              '"RASCUNHO" para versões que ainda não são definitivas.',
              '"CÓPIA" ou "CÓPIA CONTROLADA" para documentos que são distribuídos.',
              '"Somente para [trâmite] — [data]" em cópias de documentos de identidade.',
              '"AMOSTRA" em catálogos, modelos ou trabalhos que ainda não foram pagos.',
            ] },
            'Para que a marca seja legível sem atrapalhar o documento, uma opacidade entre 15 % e 30 % costuma funcionar bem. Em mosaico, um tamanho pequeno ou médio fica mais limpo. Antes de baixar, confira várias páginas no antes e depois.',
          ],
        },
        {
          h2: 'Sem enviar o documento',
          body: [
            'A marca é adicionada dentro do seu navegador. O PDF não é enviado a nenhum servidor, algo importante justamente com os documentos que precisam de marca d’água: cópias de documentos de identidade, propostas comerciais ou documentos internos.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Marca d’água em PDF', text: 'Acesse docusmart.online/pt/marca-dagua-pdf e escolha o PDF.' },
        { name: 'Escreva o texto ou escolha seu logo', text: 'Por exemplo, "CONFIDENCIAL" ou "CÓPIA".' },
        { name: 'Ajuste posição e estilo', text: 'Centro ou mosaico, ângulo, tamanho, opacidade, cor e páginas.' },
        { name: 'Aplique e baixe', text: 'Confira o antes e o depois e baixe o PDF.' },
      ],
      faq: [
        ['Posso usar meu logo?', 'Sim. Escolha "Imagem ou logo" e envie uma imagem; um PNG com fundo transparente fica melhor.'],
        ['Dá para tirar depois?', 'Ela fica desenhada no PDF. Guarde o original sem marca caso precise dele de novo.'],
        ['Posso colocá-la só em algumas páginas?', 'Sim. Em "Páginas", escreva quais, por exemplo 1-3, 5.'],
      ],
    },
    'editar-un-pdf-sin-programas': {
      slug: 'editar-pdf-sem-programas',
      title: 'Como editar um PDF sem instalar programas | DocuSmart',
      description:
        'Adicione ou substitua texto, destaque, cubra, desenhe e coloque setas, imagens e links em um PDF pelo navegador, sem instalar nada e sem enviar o arquivo.',
      h1: 'Como editar um PDF sem instalar programas',
      lead: 'Corrigir uma data, completar um dado que faltou, destacar uma cláusula ou riscar algo: para isso não é preciso um programa pago. Veja como editar um PDF no navegador.',
      sections: [
        {
          h2: 'As ferramentas do editor',
          body: [
            'No alto da página há uma barra com tudo o que você pode adicionar no [Editar PDF](/editar-pdf):',
            { ul: [
              '**Texto**: você toca na página onde quer escrever e digita na caixa de baixo; escolhe fonte, tamanho, negrito e cor.',
              '**Substituir**: você toca em um texto que já está no PDF e o altera; o original é apagado do documento, não só coberto.',
              '**Retângulo, Círculo, Destacar e Cobrir**: para marcar, sublinhar ou cobrir com branco.',
              '**Desenhar, Linha e Seta**: para apontar algo ou fazer anotações à mão.',
              '**Imagem e Link**: para colar um carimbo ou um logo, ou criar um link para um site ou para outra página do PDF.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Editar PDF](/editar-pdf) e escolha o arquivo. Escolha "Texto" na barra e toque na página onde ele vai: aparece uma caixa que você pode mover, e você digita no painel de baixo. Com "Selecionar", você toca em qualquer elemento para movê-lo, mudar o tamanho ou removê-lo.',
            'Se errar, use "Desfazer". Quando terminar, toque em "Aplicar alterações" e baixe o PDF editado.',
            { tip: 'O texto aceita qualquer alfabeto (latino, cirílico, grego, chinês, japonês ou coreano). Os emojis não são salvos no PDF.' },
          ],
        },
        {
          h2: 'Para assinar ou preencher formulários há ferramentas próprias',
          body: [
            'Se você precisa assinar, o [Assinar PDF](/firmar-pdf) deixa você desenhar, digitar ou enviar sua assinatura e colocá-la no lugar certo. E se o PDF tiver campos para preencher, o [Preencher formulário PDF](/llenar-formulario-pdf) mostra um por um, o que é mais prático do que escrever por cima.',
          ],
        },
        {
          h2: 'Dicas para a alteração não aparecer',
          body: [
            'Para corrigir um texto que já está no documento, use **Substituir**: ele apaga o original e coloca o novo no lugar. Se você só cobrir com um retângulo branco, o texto antigo continua no arquivo.',
            'Escolha a fonte mais parecida com a do documento (Sans, Serif ou Mono) e ajuste o tamanho até ficar igual. No celular, mova os elementos com calma: você também pode mudar a posição pelo teclado, com as setas.',
          ],
        },
        {
          h2: 'Seu arquivo fica com você',
          body: [
            'O editor inteiro funciona dentro do seu navegador: o PDF não é enviado a nenhum servidor, nem enquanto você edita nem ao salvar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Editar PDF', text: 'Acesse docusmart.online/pt/editar-pdf e escolha o arquivo.' },
        { name: 'Escolha o que adicionar', text: 'Texto, substituir, formas, destaque, desenho, setas, imagem ou link.' },
        { name: 'Posicione na página', text: 'Toque na página, digite ou desenhe, e mova com Selecionar.' },
        { name: 'Aplique e baixe', text: 'Toque em Aplicar alterações e baixe o PDF editado.' },
      ],
      faq: [
        ['Posso mudar um texto que já está no PDF?', 'Sim, com "Substituir": você toca no texto, digita o novo e o original é apagado do documento.'],
        ['Funciona com PDFs digitalizados?', 'Você pode adicionar texto, formas e desenhos por cima. Para substituir texto, o PDF precisa ter texto de verdade; se for uma foto, passe-o antes por OCR.'],
        ['Preciso instalar alguma coisa?', 'Não. Funciona no navegador do computador ou do celular.'],
      ],
    },
    'comparar-dos-versiones-de-un-pdf': {
      slug: 'comparar-duas-versoes-de-pdf',
      title: 'Como comparar duas versões de um PDF e ver o que mudou | DocuSmart',
      description:
        'Compare dois PDFs e veja quais palavras foram adicionadas ou removidas, ou compare página por página para ver mudanças em imagens e layout. Sem enviar os arquivos.',
      h1: 'Como comparar duas versões de um PDF e ver o que mudou',
      lead: 'Devolvem um contrato "com alguns ajustes" e não dizem quais. Ler duas vezes procurando diferenças é lento e sempre escapa alguma coisa. Veja como comparar duas versões em segundos.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Comparar PDF](/comparar-pdf). Escolha primeiro o **Original** e depois a **Nova versão**. Se você inverteu, o botão "Trocar" muda os dois de lugar.',
            'Toque em "Comparar". No alto você verá quantas palavras foram adicionadas e quantas foram removidas e, embaixo, cada mudança com a sua página: o que saiu riscado em vermelho e o que entrou em verde, com algumas linhas de contexto para localizar.',
          ],
        },
        {
          h2: 'Texto ou visual',
          body: [
            { ul: [
              '**Texto**: compara as palavras. É o melhor para contratos, cartas e relatórios. Você pode ignorar maiúsculas e pontuação para que não contem como mudanças.',
              '**Visual (página por página)**: compara a aparência de cada página. Serve para plantas, layouts ou documentos digitalizados, em que as mudanças podem ser imagens ou tabelas, e não só texto.',
            ] },
            { tip: 'Em um contrato, confira principalmente as mudanças em valores, datas e nomes: a comparação mostra todas, mesmo que seja um único número.' },
          ],
        },
        {
          h2: 'Depois de comparar',
          body: [
            'Se você encontrou algo para corrigir, pode fazer isso com o [Editar PDF](/editar-pdf). E quando as duas partes estiverem de acordo, assine a versão final com o [Assinar PDF](/firmar-pdf).',
          ],
        },
        {
          h2: 'O que aparece e o que não aparece',
          body: [
            'Cada mudança aparece com o número da página e as linhas ao redor, para você localizá-la rápido no documento. Se um parágrafo inteiro mudou de lugar sem ser alterado, ele é marcado como movido em vez de contar como removido e adicionado.',
            'Se os dois arquivos quase não têm nada em comum (por exemplo, você escolheu o documento errado), a ferramenta avisa em vez de mostrar centenas de mudanças. E se forem idênticos, ela também avisa, mesmo quando têm quantidades diferentes de páginas.',
            'Serve para contratos, orçamentos, regulamentos, propostas que passam por várias mãos ou a tese que volta com as correções do orientador: em todos esses casos, saber exatamente o que mudou poupa uma releitura completa.',
          ],
        },
        {
          h2: 'Seus documentos não são enviados',
          body: [
            'Os dois PDFs são comparados no seu navegador: nenhum é enviado a um servidor. Você pode usar com contratos e documentos confidenciais com tranquilidade, porque nenhuma das duas versões fica salva em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Comparar PDF', text: 'Acesse docusmart.online/pt/comparar-pdf.' },
        { name: 'Escolha os dois arquivos', text: 'Primeiro o original e depois a nova versão.' },
        { name: 'Escolha como comparar', text: 'Texto (palavras) ou Visual (página por página).' },
        { name: 'Revise as mudanças', text: 'O que saiu aparece riscado em vermelho e o que entrou em verde, com a sua página.' },
      ],
      faq: [
        ['Compara PDFs digitalizados?', 'No modo Visual, sim, porque ele compara a aparência de cada página. O modo Texto precisa que o PDF tenha texto de verdade.'],
        ['A ordem dos arquivos importa?', 'Sim: o que está na nova versão e não no original aparece como adicionado. Se você errou, use Trocar.'],
        ['Dá para ignorar uma maiúscula ou uma vírgula que mudou?', 'Sim. Marque "Ignorar maiúsculas" ou "Ignorar pontuação".'],
      ],
    },
    'tapar-datos-personales-en-un-pdf': {
      slug: 'ocultar-dados-pessoais-em-pdf',
      title: 'Como ocultar dados pessoais em um PDF (de verdade) | DocuSmart',
      description:
        'Oculte números de documento, contas, e-mails ou nomes em um PDF: procure e marque em todas as páginas, e eles são apagados do arquivo, não só cobertos.',
      h1: 'Como ocultar dados pessoais em um PDF (de verdade)',
      lead: 'Antes de compartilhar um extrato, um contrato ou um prontuário médico, muitas vezes é preciso esconder números de conta ou de documento. Colocar um retângulo preto por cima não basta: veja como fazer do jeito certo.',
      sections: [
        {
          h2: 'Por que um retângulo preto não resolve',
          body: [
            'Se em um editor comum você coloca um retângulo preto sobre um número, o número continua no arquivo: basta selecioná-lo e copiá-lo, ou abrir o PDF em outro programa, para lê-lo. Ocultar de verdade é **apagar** o que está embaixo, e é isso que o [Ocultar dados do PDF](/censurar-pdf) faz.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Ocultar dados do PDF](/censurar-pdf) e escolha o arquivo. Você pode procurar um nome, um número ou uma palavra, e ele é marcado em todas as páginas de uma vez. Também pode marcar de uma só vez todos os **E-mails** ou todos os **Números** (documentos, telefones, contas), ou arrastar sobre a página para cobrir uma área à mão.',
            'Confira cada página: tocando em uma área, você a move ou remove. Quando estiver tudo certo, toque em "Ocultar dados no PDF" e baixe o resultado.',
            { tip: 'As páginas com áreas marcadas são convertidas em imagem para que o que foi coberto desapareça do arquivo. O resto do texto dessas páginas continua podendo ser pesquisado e copiado.' },
          ],
        },
        {
          h2: 'Confira antes de enviar',
          body: [
            'A busca encontra o que está escrito como texto. Se uma parte do documento for uma foto ou uma digitalização, os dados que aparecem ali não saem na busca: marque-os à mão arrastando sobre a página. E guarde o original à parte, porque o que foi ocultado não pode ser recuperado.',
            'Se o documento vai ficar nas mãos de outras pessoas, você também pode colocar uma senha com o [Proteger PDF com senha](/proteger-pdf) ou uma [marca d’água](/marca-de-agua-pdf) dizendo para que você o entregou.',
          ],
        },
        {
          h2: 'O que costuma ser preciso ocultar',
          body: [
            { ul: [
              'Números de documentos de identidade e de contas bancárias.',
              'Endereços, telefones e e-mails.',
              'Assinaturas e fotos de documentos.',
              'Dados de saúde, salários ou informações de terceiros.',
            ] },
          ],
        },
        {
          h2: 'Sem enviar o documento',
          body: [
            'Todo o processo acontece no seu navegador: o documento com os dados à mostra nunca sai do seu aparelho. É exatamente o que convém ao ocultar dados: se você enviasse o original a um serviço on-line para cobri-los, eles já teriam saído das suas mãos.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Ocultar dados do PDF', text: 'Acesse docusmart.online/pt/ocultar-dados-pdf e escolha o arquivo.' },
        { name: 'Marque o que precisa esconder', text: 'Procure um texto, marque todos os e-mails ou números, ou arraste sobre a página.' },
        { name: 'Confira cada página', text: 'Toque em uma área para movê-la ou removê-la.' },
        { name: 'Oculte e baixe', text: 'Toque em Ocultar dados no PDF: o que foi coberto é apagado do arquivo.' },
      ],
      faq: [
        ['Dá para recuperar o que foi ocultado?', 'Não. O que você cobre é apagado do arquivo; por isso, vale guardar o original à parte.'],
        ['Funciona com PDFs digitalizados?', 'Sim, marcando as áreas à mão. A busca automática só encontra o que está escrito como texto.'],
        ['O resto do documento continua pesquisável?', 'Sim. Só as páginas com áreas marcadas são convertidas em imagem, e o texto restante delas é mantido para pesquisar e copiar.'],
      ],
    },
    'pasar-un-pdf-escaneado-a-texto': {
      slug: 'pdf-digitalizado-para-texto',
      title: 'Como transformar um PDF digitalizado em texto para copiar e pesquisar | DocuSmart',
      description:
        'Reconheça o texto de um PDF digitalizado com OCR: copie, baixe em .txt ou Word, ou crie um PDF pesquisável. Em 12 idiomas, de graça e sem enviar o arquivo.',
      h1: 'Como transformar um PDF digitalizado em texto para copiar e pesquisar',
      lead: 'Uma digitalização é uma foto de cada página: dá para ler, mas não dá para copiar nem pesquisar uma palavra. Com OCR, o texto volta a ser texto, sem digitar tudo de novo.',
      sections: [
        {
          h2: 'O que o OCR faz',
          body: [
            'OCR significa reconhecimento óptico de caracteres: o programa olha a imagem de cada página e reconhece as letras. O [OCR: reconhecer texto](/ocr-pdf) entrega duas coisas ao mesmo tempo:',
            { ul: [
              '**O texto reconhecido**, para copiar ou baixar em .txt ou Word, com a página de onde vem cada parte.',
              '**Um PDF pesquisável**: a mesma digitalização, idêntica à vista, com uma camada de texto invisível por cima. Você pode selecionar, copiar e pesquisar palavras com Ctrl+F.',
            ] },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [OCR: reconhecer texto](/ocr-pdf) e escolha o PDF digitalizado (uma foto em JPG, PNG ou WebP também serve). Escolha o **Idioma do documento**: o reconhecimento acerta muito mais quando sabe que idioma esperar. Se o documento mistura o idioma dele com inglês, marque também essa opção.',
            'Deixe marcado **Gerar também um PDF pesquisável** se quiser o PDF e toque em **Reconhecer texto**. Você verá o progresso página por página. No final, o PDF fica pronto para baixar e, logo abaixo, o texto, que você pode copiar ou baixar em .txt ou Word.',
            { tip: 'Na primeira vez, o modelo do idioma é baixado (leva alguns segundos) e fica salvo no seu navegador: nas próximas vezes, começa na hora.' },
          ],
        },
        {
          h2: 'Como conseguir um resultado melhor',
          body: [
            'O OCR lê o que vê. Uma digitalização nítida, reta e bem iluminada é reconhecida quase sem erros; uma foto borrada, com sombras ou muito pequena, não. Se o reconhecimento sair duvidoso, o DocuSmart avisa com a porcentagem de confiança para você revisar o texto.',
            { ul: [
              'Páginas giradas são detectadas e lidas na posição certa automaticamente.',
              'Páginas que já têm texto (um PDF misto) ficam como estão, a menos que você marque **Reconhecer também as páginas que já têm texto**.',
              'Funciona com letra impressa. Letra de mão quase nunca é bem reconhecida.',
            ] },
          ],
        },
        {
          h2: 'Se o que você quer é editar no Word',
          body: [
            'Se o seu objetivo é corrigir o documento, e não só copiar o texto, use direto o [PDF para Word](/pdf-a-word) com a opção de OCR: ele reconhece as páginas digitalizadas na mesma etapa e monta um .docx editável. E se o PDF pesquisável ficou pesado demais para enviar, passe-o pelo [Comprimir PDF](/comprimir-pdf).',
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'O reconhecimento roda no seu navegador com o Tesseract, um motor de OCR de código aberto. O PDF não é enviado a nenhum servidor, então você pode usá-lo com documentos de identidade, prontuários médicos ou extratos sem deixar cópias em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o OCR', text: 'Acesse docusmart.online/pt/ocr-pdf e escolha o PDF digitalizado ou uma foto.' },
        { name: 'Escolha o idioma', text: 'Escolha o idioma do documento e marque se ele também tem texto em inglês.' },
        { name: 'Reconheça o texto', text: 'Toque em Reconhecer texto e espere cada página terminar.' },
        { name: 'Baixe', text: 'Baixe o PDF pesquisável ou copie o texto, ou baixe-o em .txt ou Word.' },
      ],
      faq: [
        ['O que é um PDF pesquisável?', 'É a sua mesma digitalização com uma camada de texto invisível por cima: a aparência é igual, mas você pode selecionar, copiar e pesquisar palavras.'],
        ['Quantas páginas posso reconhecer?', 'Quantas precisar: elas são reconhecidas uma por uma no seu navegador. Um documento longo demora mais, mas não há limite de páginas.'],
        ['Reconhece vários idiomas?', 'Doze: espanhol, inglês, português, francês, italiano, alemão, catalão, basco, russo, japonês, coreano e chinês. Se o documento mistura o idioma dele com inglês, marque essa opção.'],
      ],
    },
    'copiar-el-texto-de-una-foto': {
      slug: 'copiar-texto-de-uma-foto',
      title: 'Como copiar o texto de uma foto ou de um print de tela | DocuSmart',
      description:
        'Tire o texto de uma foto, de um print ou de um documento fotografado e copie, corrija ou passe para o Word. De graça, em 12 idiomas e sem enviar a imagem.',
      h1: 'Como copiar o texto de uma foto ou de um print de tela',
      lead: 'A foto de um recibo, o print de uma conversa ou um cartaz: o texto está bem na sua frente, mas não dá para copiar. Veja como tirá-lo em segundos, sem digitar à mão.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Imagem para texto (OCR)](/imagen-a-texto) e escolha a foto. Servem JPG, PNG, WebP e também as fotos HEIC do iPhone. Se for um print de tela, nem precisa salvá-lo: copie e cole na página com **Ctrl+V**.',
            'Escolha o idioma em **Idioma do documento** e toque em **Reconhecer texto**. Em poucos segundos, o texto aparece em uma caixa que você pode corrigir. Dali você o copia com um toque ou baixa em .txt ou em Word (.docx).',
            { tip: 'Se o texto mistura português com palavras em inglês (nomes de produtos, termos técnicos), marque "O documento também tem texto em inglês": ele acerta mais essas palavras.' },
          ],
        },
        {
          h2: 'Várias fotos em um só documento',
          body: [
            'Se você fotografou um documento de várias folhas, escolha todas as fotos de uma vez. O texto de todas sai junto, em ordem, e você baixa tudo em um só Word. É o jeito mais rápido de digitalizar umas páginas impressas que alguém te emprestou.',
          ],
        },
        {
          h2: 'Como tirar a foto para que seja bem lida',
          body: [
            'O reconhecimento depende da foto. Alguns detalhes fazem toda a diferença:',
            { ul: [
              '**Boa luz e sem sombras**: a sombra do celular em cima do papel é a causa mais comum de erros.',
              '**De frente e reta**: quanto menos inclinada, melhor.',
              '**Texto bem grande**: chegue perto até a folha ocupar a foto inteira.',
              '**Nítida**: se a foto saiu tremida, tire outra.',
            ] },
            'Se o resultado sair duvidoso, o DocuSmart avisa com a porcentagem de confiança para você revisar o texto antes de usá-lo. Letra de mão quase nunca é bem reconhecida: a ferramenta foi feita para texto impresso ou de tela.',
          ],
        },
        {
          h2: 'Foto ou PDF digitalizado?',
          body: [
            'Se o que você tem é um PDF digitalizado de várias páginas, ou quer manter o documento com a aparência dele e ainda poder pesquisar palavras, use o [OCR: reconhecer texto](/ocr-pdf), que cria um PDF pesquisável. E se precisa entregar as fotos como um documento, junte-as antes com o [Imagem para PDF](/imagen-a-pdf).',
          ],
        },
        {
          h2: 'Suas fotos não saem do aparelho',
          body: [
            'O texto é reconhecido no seu navegador: as imagens não são enviadas a nenhum servidor. Você pode usá-lo com fotos de documentos, recibos ou conversas sem deixar cópias em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Imagem para texto', text: 'Acesse docusmart.online/pt/imagem-para-texto e escolha a foto, ou cole um print com Ctrl+V.' },
        { name: 'Escolha o idioma', text: 'Escolha o idioma do texto da imagem.' },
        { name: 'Reconheça o texto', text: 'Toque em Reconhecer texto e revise o resultado na caixa.' },
        { name: 'Copie ou baixe', text: 'Copie com um toque ou baixe em .txt ou Word.' },
      ],
      faq: [
        ['Funciona com fotos do iPhone?', 'Sim. As fotos HEIC abrem direto, sem precisar convertê-las antes.'],
        ['Reconhece letra de mão?', 'Quase nunca bem. Funciona com texto impresso ou de tela.'],
        ['Posso corrigir o texto antes de copiar?', 'Sim. O texto aparece em uma caixa editável: corrija o que for preciso e depois copie ou baixe.'],
      ],
    },
    'convertir-un-pdf-a-word-para-editarlo': {
      slug: 'converter-pdf-em-word-editavel',
      title: 'Como converter um PDF em Word para editar, mesmo digitalizado | DocuSmart',
      description:
        'Transforme um PDF em um Word (.docx) editável com títulos, negrito, tabelas, imagens e duas colunas. Com OCR para os digitalizados, de graça e sem enviar o arquivo.',
      h1: 'Como converter um PDF em Word para editar, mesmo se estiver digitalizado',
      lead: 'Mandaram um PDF e você precisa mudar uma data, um nome ou um parágrafo, mas não tem o Word original. Veja como recuperá-lo como documento editável.',
      sections: [
        {
          h2: 'Antes de converter: o que esperar',
          body: [
            'Um PDF não guarda parágrafos nem tabelas: só letras com a posição delas na página. Por isso qualquer conversão para Word **reconstrói** o documento, e o resultado fica muito parecido com o original, mas não idêntico. O [PDF para Word](/pdf-a-word) mantém:',
            { ul: [
              'Títulos, negrito, itálico, tamanhos e cores de letra.',
              'Listas, tabelas simples e imagens.',
              'Layouts em duas colunas, como os de currículos, com o fundo de cada coluna.',
            ] },
            'Caixas de texto e formas decorativas complexas podem ficar diferentes. Funciona melhor com PDFs criados no Word ou em um programa parecido.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [PDF para Word](/pdf-a-word) e escolha o arquivo. Se o PDF for digitalizado, ou tiver algumas páginas digitalizadas, deixe marcada a opção **Reconhecer o texto das páginas digitalizadas** e escolha o idioma do documento: essas páginas são lidas com OCR na mesma etapa e o texto delas fica editável.',
            'Toque em **Converter**. Você verá uma prévia aproximada do resultado ao lado do original, com quantos parágrafos e imagens saíram. Baixe o .docx e abra no Word, Google Docs, LibreOffice, Pages ou WPS.',
            { tip: 'Revise o documento ao abri-lo, principalmente as tabelas e as quebras de página: é onde o layout mais costuma variar.' },
          ],
        },
        {
          h2: 'Você precisa do Word ou basta editar o PDF?',
          body: [
            'Se você só vai mudar uma palavra, colocar uma data ou cobrir um dado, não precisa passar pelo Word: com o [Editar PDF](/editar-pdf) você escreve por cima do PDF e ele fica igual a antes, com o layout exato. Converter para Word vale a pena quando você vai reescrever parágrafos inteiros ou reaproveitar o conteúdo em outro documento.',
          ],
        },
        {
          h2: 'De volta para PDF',
          body: [
            'Quando terminar de editar, salve o documento e converta-o de novo com o [Word para PDF](/word-a-pdf) para enviá-lo. Assim, quem receber vê tudo igual em qualquer aparelho, sem depender das fontes instaladas.',
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'A conversão, e o OCR das páginas digitalizadas, são feitos no seu navegador: o PDF não é enviado a nenhum servidor. Serve igualmente para contratos, currículos ou documentos de trabalho que não devem circular.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o PDF para Word', text: 'Acesse docusmart.online/pt/pdf-para-word e escolha o PDF.' },
        { name: 'Ative o OCR se precisar', text: 'Se tiver páginas digitalizadas, deixe marcada a opção de OCR e escolha o idioma.' },
        { name: 'Converta', text: 'Toque em Converter e revise a prévia aproximada.' },
        { name: 'Baixe e edite', text: 'Baixe o .docx e abra no Word, Google Docs ou LibreOffice.' },
      ],
      faq: [
        ['Fica idêntico ao PDF?', 'Muito parecido, mas não idêntico: o documento é reconstruído a partir da posição das letras. Títulos, formatação, listas, tabelas simples, imagens e duas colunas são mantidos.'],
        ['Funciona com PDFs digitalizados?', 'Sim. Com a opção de OCR marcada, as páginas digitalizadas são reconhecidas no seu navegador e o texto delas fica editável.'],
        ['Dá para converter um PDF com senha?', 'Se ele só tiver restrições (abre sem senha), sim. Se pedir senha para abrir, remova-a antes com o Desbloquear PDF.'],
      ],
    },
    'pasar-un-extracto-bancario-pdf-a-excel': {
      slug: 'extrato-bancario-pdf-para-excel',
      title: 'Como passar um extrato bancário ou uma fatura em PDF para Excel | DocuSmart',
      description:
        'Converta as tabelas de um extrato, de uma fatura ou de um relatório em PDF para uma planilha do Excel com os números prontos para somar. De graça e sem enviar o arquivo.',
      h1: 'Como passar um extrato bancário ou uma fatura em PDF para Excel',
      lead: 'Você precisa somar os gastos do mês, conciliar uma conta ou filtrar um relatório, e os dados estão em um PDF. Veja como levá-los para uma planilha sem copiar célula por célula.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [PDF para Excel](/pdf-a-excel) e escolha o PDF. Escolha como quer as **Planilhas**:',
            { ul: [
              '**Uma por página**: cada página do PDF em uma planilha própria. Útil para relatórios em que cada página é uma tabela diferente.',
              '**Tudo em uma planilha**: todas as linhas seguidas em uma só planilha. O melhor para um extrato de várias páginas, porque assim você filtra e soma tudo de uma vez.',
            ] },
            'Toque em **Converter**. Você verá uma prévia aproximada com quantas linhas e números saíram. Baixe o .xlsx e abra no Excel, Google Sheets ou LibreOffice.',
          ],
        },
        {
          h2: 'Os números continuam sendo números',
          body: [
            'Este é o detalhe que mais economiza tempo: valores como 1.500.000, $ 2.000, 3,5 ou 45% são salvos como números do Excel com o formato deles, não como texto. Você pode somá-los, tirar médias ou usá-los em fórmulas assim que abre o arquivo, sem limpar os pontos nem os símbolos de moeda.',
            { tip: 'Se uma coluna de valores não soma, confira se ela não tem textos misturados, como "N/A" ou traços: o Excel ignora essas células na soma.' },
          ],
        },
        {
          h2: 'Com que PDFs funciona melhor',
          body: [
            'As colunas são montadas de acordo com a posição do texto na página. Por isso funciona muito bem com PDFs exportados por um sistema: extratos bancários, notas fiscais eletrônicas, relatórios contábeis ou listagens. Com PDFs de layout livre, em que o texto não segue colunas, o resultado precisa de mais revisão.',
            'Se o extrato for digitalizado, ou uma foto que alguém transformou em PDF, deixe marcada a opção **Reconhecer o texto das páginas digitalizadas** e escolha o idioma: essas páginas são lidas com OCR na mesma etapa e cada coluna fica na sua célula. Quanto mais nítida a digitalização, melhor o resultado.',
          ],
        },
        {
          h2: 'Para entregar de novo',
          body: [
            'Se depois de trabalhar na planilha você precisar enviá-la como documento, converta-a com o [Excel para PDF](/excel-a-pdf). E se só precisa do texto da digitalização, sem tabelas, use o [OCR: reconhecer texto](/ocr-pdf).',
          ],
        },
        {
          h2: 'Seus dados não saem do aparelho',
          body: [
            'Um extrato bancário tem o número da sua conta, o seu saldo e as suas movimentações. Aqui a conversão é feita no seu navegador: o PDF não é enviado a nenhum servidor nem fica guardado em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o PDF para Excel', text: 'Acesse docusmart.online/pt/pdf-para-excel e escolha o PDF.' },
        { name: 'Escolha as planilhas', text: 'Uma planilha por página, ou tudo em uma só planilha para somar de uma vez.' },
        { name: 'Converta', text: 'Toque em Converter e revise a prévia aproximada.' },
        { name: 'Baixe', text: 'Baixe o .xlsx e abra no Excel, Google Sheets ou LibreOffice.' },
      ],
      faq: [
        ['Dá para somar os números?', 'Sim. Valores com pontos de milhar, símbolo de moeda, decimais com vírgula ou porcentagens são salvos como números do Excel.'],
        ['Funciona com um extrato digitalizado?', 'Sim. Com a opção de OCR marcada, as páginas digitalizadas são reconhecidas no seu navegador e cada coluna fica na sua célula.'],
        ['Meu extrato é enviado para a internet?', 'Não. A conversão acontece dentro do seu navegador; o arquivo não sai do seu aparelho.'],
      ],
    },
    'sacar-el-texto-de-un-pdf': {
      slug: 'extrair-texto-de-pdf',
      title: 'Como extrair todo o texto de um PDF para copiar ou pesquisar | DocuSmart',
      description:
        'Extraia o texto de um PDF para um arquivo .txt ou copie-o da tela com um clique, sem o layout da página. De graça, na hora e sem enviar o arquivo.',
      h1: 'Como extrair todo o texto de um PDF para copiar ou pesquisar',
      lead: 'Você quer colar o conteúdo de um PDF em um e-mail, em uma conversa ou em outro documento, e ao copiar as linhas se quebram. Veja como tirar o texto limpo, de todas as páginas de uma vez.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [PDF para texto](/pdf-a-texto), escolha o PDF e toque em **Converter**. Em um instante você verá na tela o texto de todas as páginas, com quantas linhas ele tem. Dali você o copia com um clique ou baixa o arquivo .txt.',
            'O .txt abre em qualquer aparelho, até no Bloco de Notas ou no celular, e quase não pesa: um documento de cem páginas costuma ficar com algumas centenas de KB.',
          ],
        },
        {
          h2: 'Para que serve',
          body: [
            { ul: [
              '**Pesquisar**: abrir o texto e procurar uma palavra ou um número em um documento longo.',
              '**Reaproveitar**: colar parágrafos em um e-mail ou em uma conversa sem as quebras de linha do PDF.',
              '**Contar ou analisar**: passar o texto para outra ferramenta, como o [Contador de palavras e caracteres](/contador-de-palabras).',
              '**Guardar o essencial**: manter o conteúdo de um documento sem o layout.',
              '**Traduzir ou ouvir**: colar o texto em um tradutor, ou no leitor em voz alta do celular, sem as quebras que aparecem ao copiar direto do PDF.',
            ] },
          ],
        },
        {
          h2: 'O que é mantido e o que não é',
          body: [
            'O texto e as quebras de linha são mantidos, na ordem de leitura de cada página. O layout visual (colunas, tabelas, cores, imagens) vira texto simples. Se você precisa do conteúdo **com a formatação** para continuar editando, use o [PDF para Word](/pdf-a-word).',
            { tip: 'Se uma tabela é importante para você, lembre que no .txt ela perde as colunas. Para trabalhar com ela em células, é melhor o [PDF para Excel](/pdf-a-excel).' },
          ],
        },
        {
          h2: 'Se sair vazio: é uma digitalização',
          body: [
            'Se o DocuSmart disser que não encontrou texto, o PDF é digitalizado: cada página é uma foto, e não há letras para extrair. Nesse caso, use o [OCR: reconhecer texto](/ocr-pdf), que reconhece o texto da imagem no seu navegador e o entrega para você copiar ou baixar.',
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'O texto é lido no seu navegador: o PDF não é enviado a nenhum servidor. Por isso você pode usá-lo com documentos de trabalho ou pessoais sem deixar cópias em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o PDF para texto', text: 'Acesse docusmart.online/pt/pdf-para-texto e escolha o PDF.' },
        { name: 'Converta', text: 'Toque em Converter: você verá o texto de todas as páginas.' },
        { name: 'Copie ou baixe', text: 'Copie com um clique ou baixe o arquivo .txt.' },
      ],
      faq: [
        ['Por que sai vazio?', 'Porque o PDF é digitalizado: as páginas são imagens. Use o OCR: reconhecer texto para tirar o texto delas.'],
        ['As tabelas são mantidas?', 'Não como tabelas: elas viram linhas de texto. Para manter as colunas, use o PDF para Excel.'],
        ['Há limite de páginas?', 'Não. O texto é extraído de todas as páginas, mesmo que o documento seja longo.'],
      ],
    },
    'convertir-un-pdf-a-jpg-o-sacar-sus-imagenes': {
      slug: 'pdf-para-jpg-ou-extrair-imagens',
      title: 'Como converter um PDF em JPG ou tirar as fotos que ele tem dentro | DocuSmart',
      description:
        'Transforme cada página de um PDF em JPG ou PNG com a resolução que quiser, ou tire as fotos que vêm dentro dele na qualidade original. De graça e sem enviar o arquivo.',
      h1: 'Como converter um PDF em JPG ou tirar as fotos que ele tem dentro',
      lead: 'Para postar uma página nas redes, mandá-la como imagem pelo WhatsApp ou recuperar uma foto que você só tem dentro de um PDF. São duas ferramentas diferentes, e vale saber qual usar.',
      sections: [
        {
          h2: 'Página inteira ou só as fotos?',
          body: [
            { ul: [
              '**[PDF para JPG](/pdf-a-jpg)** transforma cada **página inteira** em uma imagem, com o texto, as fotos e o layout, como um print de tela, mas em boa qualidade.',
              '**[Extrair imagens de um PDF](/extraer-imagenes-pdf)** tira **só as fotos e os gráficos** que estão dentro dele, cada um separado e no tamanho original, sem o texto em volta.',
            ] },
            'Se você quer mostrar uma página do jeito que ela aparece, use o PDF para JPG. Se quer o logotipo, a foto do produto ou a planta que vem dentro do documento, use o Extrair imagens.',
          ],
        },
        {
          h2: 'PDF para JPG, passo a passo',
          body: [
            'Abra o [PDF para JPG](/pdf-a-jpg) e escolha o PDF. Escolha o **Formato da imagem** e a **Resolução**:',
            { ul: [
              '**PNG** mantém a qualidade exata e é melhor para páginas com texto; **JPG** pesa menos e é ideal para compartilhar. Em JPG você também escolhe a qualidade.',
              '**72 dpi** para ver na tela, **150 dpi** para quase tudo e **300 dpi** para imprimir.',
            ] },
            'Se você só quer algumas páginas, digite-as em **Páginas** (por exemplo, 1-3, 5); vazio converte todas. Toque em **Converter**: você verá cada imagem com o número da página e, se forem várias, elas são baixadas juntas em um ZIP.',
          ],
        },
        {
          h2: 'Extrair imagens, passo a passo',
          body: [
            'Abra o [Extrair imagens de um PDF](/extraer-imagenes-pdf), escolha o PDF e toque em **Buscar imagens**. Aparecem todas as fotos e gráficos com a página, o tamanho e o formato de cada um. Escolha as que quiser e baixe uma por uma ou todas em um ZIP.',
            'As fotos JPEG saem **idênticas** às originais, byte por byte; as demais são salvas como PNG, sem perda. Deixe marcado **Omitir imagens pequenas** para não se encher de ícones e marcadores.',
            { tip: 'Em um PDF digitalizado cada página é uma única imagem grande, então o Extrair imagens devolve as páginas. Nesse caso, tanto faz qual das duas ferramentas usar.' },
          ],
        },
        {
          h2: 'Se a imagem ficar pesada',
          body: [
            'A 300 dpi, uma página A4 passa de 2.400 pixels de largura. Se precisar dela mais leve para a web ou um formulário, passe-a pelo [Comprimir imagem](/comprimir-imagen). E tudo é feito no seu navegador: o PDF não é enviado a nenhum servidor.',
          ],
        },
      ],
      steps: [
        { name: 'Escolha a ferramenta', text: 'PDF para JPG para páginas inteiras; Extrair imagens para as fotos que vêm dentro dele.' },
        { name: 'Escolha o PDF', text: 'Abra a ferramenta em docusmart.online e escolha o arquivo.' },
        { name: 'Ajuste e converta', text: 'No PDF para JPG escolha formato, resolução e páginas; no Extrair imagens toque em Buscar imagens e escolha as que quiser.' },
        { name: 'Baixe', text: 'Baixe cada imagem ou todas juntas em um ZIP.' },
      ],
      faq: [
        ['Que resolução escolho?', '150 dpi serve para quase tudo. 72 dpi se for só para ver na tela e 300 dpi se for imprimir.'],
        ['As fotos extraídas perdem qualidade?', 'Não. As fotos JPEG são copiadas idênticas às originais e as demais são salvas como PNG, sem perda.'],
        ['Posso converter só uma página?', 'Sim. No PDF para JPG digite o número dela em Páginas, por exemplo 3, e só essa é convertida.'],
      ],
    },
    'convertir-un-pdf-a-pdfa-para-un-tramite': {
      slug: 'converter-pdf-para-pdfa',
      title: 'Como converter um PDF para PDF/A para um processo ou arquivamento | DocuSmart',
      description:
        'Converta um PDF para PDF/A-2b, 1b ou 3b, o formato de arquivamento que órgãos públicos, tribunais e universidades exigem. De graça e sem enviar o arquivo.',
      h1: 'Como converter um PDF para PDF/A para um processo ou para arquivar',
      lead: 'Um tribunal, uma universidade ou um órgão público pede o documento "em PDF/A" e o portal recusa o seu PDF. Veja como convertê-lo e como saber qual versão escolher.',
      sections: [
        {
          h2: 'O que é PDF/A e por que pedem',
          body: [
            'PDF/A é a versão do PDF feita para arquivamento (norma ISO 19005). O arquivo leva dentro tudo o que precisa para ser exibido: as fontes, o perfil de cor e os metadados, e não pode depender de nada externo, como scripts, links para fontes ou conteúdo carregado de outro lugar. Assim ele aparece igual hoje e daqui a muitos anos.',
            'Por isso os tribunais o exigem para protocolar petições e ações, muitas universidades para teses, dissertações e TCCs, e órgãos públicos para processos e arquivos.',
          ],
        },
        {
          h2: 'Que versão escolher',
          body: [
            { ul: [
              '**PDF/A-2b**: a recomendada e a que quase todas as instituições pedem. Aceita transparências e camadas.',
              '**PDF/A-1b**: a mais antiga, só para sistemas que não aceitam outra. Não aceita transparências nem camadas.',
              '**PDF/A-3b**: como a 2b, mas mantém os arquivos anexados, por exemplo o XML de uma nota fiscal eletrônica.',
            ] },
            'Se o processo não disser qual, use PDF/A-2b.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [PDF para PDF/A](/pdf-a-pdfa), escolha o PDF e a **Versão** e toque em **Converter para PDF/A**. No final você verá o resultado ao lado do original e um resumo do que foi ajustado para cumprir a norma: por exemplo, as fontes incorporadas ao arquivo ou os scripts que foram removidos.',
            { tip: 'Os arquivos que o DocuSmart cria são validados com o veraPDF, o validador de referência da PDF Association, o mesmo que muitos portais usam para conferir o que recebem.' },
          ],
        },
        {
          h2: 'Se uma página foi salva como imagem',
          body: [
            'Algumas coisas não podem ir para PDF/A do jeito que estão: cores de gráfica (CMYK) sem o perfil, ou fontes que não vêm dentro do arquivo e não podem ser incorporadas. Nesse caso, essa página é salva como imagem: a aparência é a mesma, mas o texto deixa de poder ser selecionado. O DocuSmart diz quais páginas e por quê. Se você precisa que esse texto seja pesquisável, passe o resultado pelo [OCR: reconhecer texto](/ocr-pdf).',
            'Se o portal também tiver um limite de tamanho, confira o peso depois e, se for preciso, use o [Comprimir PDF](/comprimir-pdf).',
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'A conversão é feita no seu navegador: o PDF não é enviado a nenhum servidor. Você pode converter petições, contratos ou documentos de identidade sem deixar cópias em outro lugar.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o PDF para PDF/A', text: 'Acesse docusmart.online/pt/pdf-para-pdfa e escolha o PDF.' },
        { name: 'Escolha a versão', text: 'PDF/A-2b se o processo não disser qual; 1b ou 3b só se pedirem.' },
        { name: 'Converta', text: 'Toque em Converter para PDF/A e revise o resumo do que foi ajustado.' },
        { name: 'Baixe', text: 'Baixe o PDF/A e envie-o ao portal do processo.' },
      ],
      faq: [
        ['Que versão os tribunais pedem?', 'Quase sempre PDF/A-2b, ou simplesmente "PDF/A". Se a instituição citar uma versão, escolha essa.'],
        ['O conteúdo do meu documento muda?', 'Nem o texto nem o layout. As fontes que faltavam são incorporadas e são removidas coisas que a norma não permite, como scripts ou anexos (exceto no PDF/A-3b).'],
        ['Como sei que ele cumpre a norma?', 'No final, o DocuSmart diz qual versão ele cumpre. Os resultados são validados com o veraPDF, o validador de referência.'],
      ],
    },
    'reparar-un-pdf-que-no-abre': {
      slug: 'reparar-pdf-que-nao-abre',
      title: 'Como reparar um PDF que não abre, fica em branco ou dá erro | DocuSmart',
      description:
        'Recupere um PDF danificado ou um download que foi interrompido: o DocuSmart reconstrói a estrutura e resgata as páginas completas. De graça e sem enviar o arquivo.',
      h1: 'Como reparar um PDF que não abre, fica em branco ou dá erro',
      lead: '"O arquivo está danificado e não pôde ser reparado", uma tela em branco ou um download que parou no meio. Antes de dar o documento como perdido, tente reconstruí-lo.',
      sections: [
        {
          h2: 'Por que um PDF se danifica',
          body: [
            'Um PDF tem, no final do arquivo, um índice que diz onde começa cada página e cada imagem. Se esse índice se perde ou se desloca, o leitor não encontra nada e mostra um erro, mesmo que o conteúdo continue lá. Isso acontece principalmente com:',
            { ul: [
              'Downloads ou anexos que pararam no meio.',
              'Arquivos copiados para um pen drive que foi retirado antes da hora.',
              'Programas que salvaram o PDF errado ou o editaram pela metade.',
            ] },
            'Os sinais são sempre parecidos: o leitor diz que o arquivo está danificado, ele abre mas as páginas ficam em branco, ou aparece bem no seu aparelho e um portal o recusa no envio.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Reparar PDF](/reparar-pdf), escolha o arquivo danificado e toque em **Reparar PDF**. A ferramenta lê o arquivo do começo ao fim, encontra as páginas mesmo com o índice quebrado e grava uma cópia nova e saudável.',
            'No final, você verá a cópia reparada ao lado do original e ela dirá o que aconteceu: se encontrou e corrigiu problemas, se o arquivo estava bem ou, se estava cortado, quantas páginas foram resgatadas de quantas ele tinha.',
            { tip: 'Mesmo que o PDF abra, às vezes vale a pena repará-lo: se um portal o recusa ou uma ferramenta dá erro, uma cópia regravada costuma resolver.' },
          ],
        },
        {
          h2: 'O que dá e o que não dá para recuperar',
          body: [
            'Recupera-se o que chegou completo. Se um download parou em 70%, as páginas que estavam nesses 70% são resgatadas; as do final, que nunca chegaram, não podem ser reconstruídas. Nesse caso, o melhor é baixar o arquivo de novo ou pedi-lo outra vez, e usar a cópia reparada enquanto isso.',
            'Se o PDF tiver senha para abrir, remova-a antes com o [Desbloquear PDF](/desbloquear-pdf) e depois repare-o. E se o que você resgatou são páginas digitalizadas e precisa do texto delas, use o [OCR: reconhecer texto](/ocr-pdf).',
          ],
        },
        {
          h2: 'Seu documento não sai do aparelho',
          body: [
            'O reparo é feito no seu navegador: o arquivo não é enviado a nenhum servidor. Você pode tentar com documentos pessoais ou de trabalho sem deixar cópias em outro lugar, e o original não é modificado.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Reparar PDF', text: 'Acesse docusmart.online/pt/reparar-pdf e escolha o PDF danificado.' },
        { name: 'Repare', text: 'Toque em Reparar PDF: a estrutura dele é reconstruída.' },
        { name: 'Confira o resultado', text: 'Veja o que foi corrigido e quantas páginas foram resgatadas.' },
        { name: 'Baixe', text: 'Baixe a cópia reparada; o original não muda.' },
      ],
      faq: [
        ['Dá para recuperar um arquivo cortado?', 'Sim, as páginas que chegaram completas. As que faltam no final do arquivo não podem ser reconstruídas.'],
        ['Meu arquivo original é modificado?', 'Não. Uma cópia reparada é baixada à parte.'],
        ['Funciona com PDF com senha?', 'Primeiro remova a senha com o Desbloquear PDF e depois repare-o.'],
      ],
    },
    'hacer-una-cuenta-de-cobro': {
      slug: 'fazer-uma-cobranca-de-servicos',
      title: 'Como fazer uma cobrança de serviços em PDF, grátis e em minutos | DocuSmart',
      description:
        'Preencha seus dados, os do cliente e o que você cobra: o total, a retenção e o valor por extenso saem sozinhos. Baixe em PDF, grátis e sem enviar seus dados.',
      h1: 'Como fazer uma cobrança de serviços em PDF',
      lead: 'Uma cobrança de serviços diz quem deve a quem, quanto e por quê. Com o modelo do DocuSmart, você a preenche no navegador e sai um PDF organizado, pronto para enviar.',
      sections: [
        {
          h2: 'O que é uma cobrança de serviços e quem a usa',
          body: [
            'É o documento com que uma pessoa cobra um trabalho ou um serviço quando não emite nota fiscal: um designer autônomo, um professor particular, um prestador de serviços para uma empresa ou quem aluga um imóvel. Ele deve dizer quem cobra, de quem, a data, a descrição, o valor (em números e por extenso) e como pagar.',
            { tip: 'Uma cobrança de serviços não substitui a nota fiscal eletrônica. Se pela sua atividade ou pela sua renda você é obrigado a emitir nota, consulte um contador ou a autoridade tributária do seu país.' },
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Recibo, orçamento e cobrança](/cuenta-de-cobro) e deixe escolhido o tipo **Cobrança de serviços**. Procure seu **País**: assim se ajustam a moeda, o nome do imposto e os tipos de documento (CPF, CNPJ, NIF…). O número do documento é sugerido sozinho (CC-0001) e a data é a de hoje; adicione a cidade e, se quiser, uma **Data de vencimento**.',
            'Em **Seus dados**, escreva seu nome e seu documento; em **Cliente**, os de quem vai pagar. O endereço, o telefone e o e-mail são opcionais.',
            'Em **Itens**, descreva o que você cobra, a quantidade e o valor unitário. Se forem várias coisas, use **Adicionar item**. O subtotal, o imposto, a retenção e o total são calculados enquanto você digita, e embaixo aparece o valor por extenso.',
          ],
        },
        {
          h2: 'Imposto, retenção e desconto',
          body: [
            'Se você cobra um imposto (como o ISS ou o IVA), escreva a porcentagem dele; ao escolher seu país, aparece um botão para usar a alíquota geral. Se o cliente faz **Retenção**, escreva a porcentagem e ela é descontada do total, como na imagem: 1.800.000 de subtotal, 10% de retenção e 1.620.000 a pagar. O **Desconto** é aplicado antes dos impostos.',
            { tip: 'A porcentagem de retenção depende do seu país, do tipo de serviço e da sua situação tributária. Se não souber, pergunte ao cliente: quase sempre ele diz quanto vai reter.' },
          ],
        },
        {
          h2: 'Dados para pagamento, assinatura e PDF',
          body: [
            'Em **Dados para pagamento**, coloque o banco, o tipo e o número da conta e o nome do titular: assim o cliente sabe onde depositar. Em **Observações**, você pode escrever prazos ou condições. Com **Adicionar assinatura**, você a desenha com o dedo ou o mouse, e com **Adicionar logo** coloca o seu no topo.',
            'Toque em **Criar PDF**: você verá a cobrança pronta, com o valor por extenso e a linha de assinatura, pronta para baixar, compartilhar pelo WhatsApp ou salvar no Drive.',
            { ul: [
              'O número avança sozinho a cada documento novo (CC-0002, CC-0003…). E se você marcar **Lembrar neste navegador**, da próxima vez seus dados, o logo e seus clientes já estarão preenchidos; os dados da conta bancária nunca são salvos.',
              'Em **Documentos emitidos**, você pode abrir uma cobrança anterior para corrigi-la, ou transformar um **Orçamento** aprovado em cobrança sem digitar tudo de novo.',
              'Com a mesma ferramenta, você pode fazer um **Orçamento** (com data de validade) ou um **Recibo** de pagamento.',
            ] },
          ],
        },
        {
          h2: 'Seus dados e os do cliente não são enviados',
          body: [
            'Tudo é montado no seu navegador: os nomes, os documentos e os valores não são enviados a nenhum servidor. Se o cliente pedir a cobrança assinada em um PDF que você já tem, use o [Assinar PDF](/firmar-pdf); e se for mandar várias juntas por e-mail, o [Comprimir PDF](/comprimir-pdf) as deixa mais leves.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o modelo', text: 'Acesse docusmart.online/pt/recibo-e-orcamento e escolha seu país.' },
        { name: 'Escreva os dados', text: 'Preencha seus dados, os do cliente, a cidade e a data.' },
        { name: 'Adicione o que você cobra', text: 'Descreva cada item com seu valor; o total, a retenção e o valor por extenso saem sozinhos.' },
        { name: 'Crie o PDF', text: 'Adicione os dados para pagamento e sua assinatura, toque em Criar PDF e baixe.' },
      ],
      faq: [
        ['Uma cobrança de serviços é o mesmo que uma nota fiscal?', 'Não. A cobrança de serviços é usada por quem não é obrigado a emitir nota; ela não substitui a nota fiscal eletrônica. O DocuSmart não emite notas fiscais eletrônicas.'],
        ['Como a retenção é calculada?', 'Escreva a porcentagem que o seu cliente indicar e o DocuSmart a desconta do subtotal. O total a pagar já sai com a retenção descontada.'],
        ['Posso fazer uma cobrança em outra moeda?', 'Sim. Ao escolher seu país, a moeda dele é preenchida, e você pode trocá-la por outra (dólares, euros…) no campo Moeda.'],
      ],
    },
    'hacer-una-hoja-de-vida': {
      slug: 'fazer-um-curriculo',
      title: 'Como fazer um currículo em PDF ou Word, grátis e sem cadastro | DocuSmart',
      description:
        'Monte seu currículo com um modelo claro e compatível com os sites de vagas (ATS), com ou sem foto. Baixe em PDF ou Word, de graça e sem criar uma conta.',
      h1: 'Como fazer um currículo em PDF ou Word',
      lead: 'Um bom currículo é entendido em segundos e passa pelos filtros automáticos dos sites de vagas. Aqui você o preenche por seções e ele sai organizado, sem brigar com a formatação.',
      sections: [
        {
          h2: 'Escolha o modelo',
          body: [
            'Abra o [Currículo em PDF ou Word](/hoja-de-vida). No topo, você escolhe como ele vai ficar:',
            { ul: [
              '**Clássico (ATS)**: uma coluna e sem foto. É o que os sistemas que filtram currículos nos sites de vagas leem melhor; use-o para se candidatar on-line.',
              '**Compacta**: igualmente claro, com letra e margens menores para caber mais em uma página.',
              '**Com foto**: sua foto no topo, como pedem muitas empresas da América Latina.',
            ] },
            'Você também escolhe o tamanho da folha (Carta ou A4), a fonte (moderna ou clássica) e a cor dos títulos.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Preencha seus **Dados pessoais**: nome, cargo ou profissão, cidade, telefone e e-mail. Se você tem LinkedIn ou um portfólio, coloque em **Links**. Depois, escreva seu **Resumo profissional** em duas ou três frases: quem você é, o que sabe fazer e o que procura.',
            'Em **Experiência profissional**, adicione cada emprego com o cargo, a empresa e as datas; marque **Trabalho aqui atualmente** se ainda estiver lá. Em **Conquistas e funções**, escreva uma conquista por linha: cada linha sai como um tópico. Faça o mesmo com **Formação**, **Habilidades**, **Idiomas**, **Cursos e certificações** e **Referências**; as seções vazias não aparecem.',
            'Toque em **Criar PDF** ou **Criar Word (.docx)**. Você verá o currículo pronto para baixar ou compartilhar.',
            { tip: 'Comece cada conquista com um verbo e use números quando puder: "Reduzi em 30% os prazos de entrega" diz mais que "responsável pelas entregas".' },
          ],
        },
        {
          h2: 'Compare com a vaga e escreva a carta',
          body: [
            'Em **Comparar com uma vaga**, você cola o anúncio da vaga e vê quais palavras-chave seu currículo já tem e quais faltam, com a porcentagem de correspondência. Os filtros automáticos procuram essas palavras; adicione só as que você realmente tem.',
            'Em **Carta de apresentação**, você escreve a empresa e o cargo, e o DocuSmart monta um rascunho com sua experiência e seus pontos fortes. Revise, ajuste do seu jeito e baixe em PDF ou Word.',
          ],
        },
        {
          h2: 'Não perca o que você escreveu',
          body: [
            'Com **Salvar automaticamente neste navegador**, o que você escreveu fica guardado mesmo que você feche a página (a foto, não). Para continuar em outro computador, use **Salvar rascunho**: você baixa um arquivo .json que depois abre lá com **Abrir rascunho**.',
            'Se a empresa pedir a foto com fundo branco, prepare-a antes na [Foto para documento](/foto-tamano-documento). E se precisar enviar o currículo junto com certificados em um único arquivo, junte-os com o [Juntar PDF](/unir-pdf).',
          ],
        },
        {
          h2: 'Suas informações não saem do aparelho',
          body: [
            'O currículo é montado no seu navegador: seus dados, sua experiência e sua foto não são enviados a nenhum servidor nem usados para mais nada. Você não precisa criar uma conta nem deixar seu e-mail.',
          ],
        },
      ],
      steps: [
        { name: 'Escolha o modelo', text: 'Acesse docusmart.online/pt/curriculo e escolha Clássico (ATS), Compacta ou Com foto.' },
        { name: 'Preencha as seções', text: 'Escreva seus dados, seu resumo, sua experiência, sua formação e suas habilidades.' },
        { name: 'Compare com a vaga', text: 'Cole o anúncio da vaga para ver quais palavras-chave estão faltando.' },
        { name: 'Baixe', text: 'Toque em Criar PDF ou Criar Word e baixe seu currículo.' },
      ],
      faq: [
        ['O que é um currículo ATS?', 'Um currículo em uma só coluna, sem tabelas nem imagens, que os sistemas de seleção dos sites de vagas conseguem ler sem erros. É o modelo Clássico.'],
        ['Posso baixar em Word?', 'Sim. Com Criar Word (.docx), você o abre e edita no Word, no Google Docs ou no LibreOffice.'],
        ['Preciso me cadastrar?', 'Não. É grátis, não pede conta nem e-mail e o que você escreve fica no seu aparelho.'],
      ],
    },
    'crear-un-codigo-qr': {
      slug: 'criar-um-codigo-qr',
      title: 'Como criar um código QR grátis para um link, WhatsApp ou Wi-Fi | DocuSmart',
      description:
        'Crie um código QR para um link, WhatsApp, seu Wi-Fi ou seu contato, com sua cor e seu logo. Baixe em PNG, SVG ou PDF. Grátis, sem cadastro e sem prazo de validade.',
      h1: 'Como criar um código QR grátis',
      lead: 'Um QR leva as pessoas à sua página, abre uma conversa no WhatsApp ou conecta ao Wi-Fi sem digitar nada. Crie o seu em segundos; ele não expira nem depende de nenhum servidor.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Criar e ler códigos QR](/crear-codigo-qr) e escolha o que ele vai guardar: **URL**, **Texto**, **E-mail**, **Telefone**, **WhatsApp**, **SMS**, **Localização**, **Wi-Fi**, **Contato** ou **Evento**. Escreva os dados (para um link, o endereço completo com https://).',
            'Toque em **Gerar QR**. O código aparece na hora e você pode baixá-lo em PNG, em **SVG** (vetorial, imprime nítido em qualquer tamanho), em **PDF (10 cm)**, copiá-lo como imagem ou imprimi-lo.',
            { tip: 'Antes de imprimir cem panfletos, escaneie o QR com o celular para conferir se ele abre o que você espera.' },
          ],
        },
        {
          h2: 'O que cada tipo pode fazer',
          body: [
            { ul: [
              '**WhatsApp**: escreva o número com o código do país (55 para o Brasil) e, se quiser, uma mensagem. Ao escanear, a conversa abre com a mensagem já escrita.',
              '**Wi-Fi**: o nome da rede, a segurança e a senha. Suas visitas se conectam sem você precisar ditá-la.',
              '**Contato**: nome, telefone, e-mail e empresa. Ao escanear, o celular oferece salvá-lo nos contatos.',
              '**Localização**: um endereço ou coordenadas que abrem no mapa.',
              '**Evento**: título, local, início e fim, para adicioná-lo à agenda.',
            ] },
          ],
        },
        {
          h2: 'Dê o seu estilo',
          body: [
            'Em **Personalizar design**, você muda a cor do código e do fundo (ou deixa transparente para colocá-lo sobre a sua arte), coloca seu **Logo** no centro e escolhe o tamanho da imagem. Se as cores tiverem pouco contraste, o DocuSmart avisa, porque uma câmera poderia não conseguir lê-lo.',
            'Com **Protegido**, o conteúdo do QR fica criptografado com uma senha (AES-256): só quem a tiver consegue abri-lo, no DocuSmart. E com **Vários QR a partir de uma lista**, você gera muitos de uma vez, um por linha ou a partir de um CSV, por exemplo para as mesas de um restaurante ou as etiquetas de um inventário.',
          ],
        },
        {
          h2: 'Para ler um QR',
          body: [
            'Se o que você precisa é ler um, use o [Ler código QR](/leer-codigo-qr): com a câmera, a partir de uma foto ou de uma captura de tela, ou de um PDF. Antes de abrir um link, ele mostra para onde leva e avisa se parecer enganoso.',
          ],
        },
        {
          h2: 'Seu QR não expira',
          body: [
            'O código é gerado no seu navegador e guarda os dados diretamente, sem passar por um link intermediário. Por isso ele não expira, não tem limite de leituras e ninguém mais vê o que você colocou nele. Os QR que você cria ficam no **Histórico**, só no seu navegador.',
          ],
        },
      ],
      steps: [
        { name: 'Escolha o tipo', text: 'Acesse docusmart.online/pt/gerar-codigo-qr e escolha URL, WhatsApp, Wi-Fi ou outro tipo.' },
        { name: 'Escreva os dados', text: 'Coloque o link, o número ou os dados da rede.' },
        { name: 'Gere o QR', text: 'Toque em Gerar QR e, se quiser, mude a cor ou adicione seu logo.' },
        { name: 'Baixe', text: 'Baixe em PNG, SVG ou PDF, ou imprima.' },
      ],
      faq: [
        ['O código QR expira?', 'Não. Os dados vão dentro do próprio código, sem um link intermediário, então ele funciona para sempre e sem limite de leituras.'],
        ['Que formato uso para imprimir?', 'O SVG: é vetorial e fica nítido em qualquer tamanho, de um cartão a um cartaz. Também há um PDF de 10 cm.'],
        ['Posso colocar meu logo no QR?', 'Sim, em Personalizar design. O logo fica em um círculo no centro e o código continua sendo lido.'],
      ],
    },
    'cambiar-el-tamano-de-una-foto': {
      slug: 'mudar-o-tamanho-de-uma-foto',
      title: 'Como mudar o tamanho de uma foto em pixels, % ou centímetros | DocuSmart',
      description:
        'Mude o tamanho de uma ou várias fotos em pixels, em porcentagem, em centímetros ou na medida exata do Instagram, WhatsApp ou YouTube. Grátis e sem enviá-las.',
      h1: 'Como mudar o tamanho de uma foto',
      lead: 'Uma foto do celular tem milhares de pixels: demais para um formulário, uma página web ou uma capa. Aqui você a deixa na medida de que precisa, sem deformá-la.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Redimensionar imagem](/redimensionar-imagen) e escolha uma ou várias fotos (JPG, PNG, WebP, HEIC, GIF ou BMP). Depois, escolha **Como redimensionar**:',
            { ul: [
              '**Por porcentagem**: por exemplo, 50% deixa a foto com metade da largura e da altura.',
              '**Por pixels**: escreva a largura, a altura ou as duas. Com **Manter a proporção** ativado, basta um lado: o outro é calculado sozinho.',
              '**Redes sociais**: medidas exatas para Instagram, status do WhatsApp, capas do Facebook ou do LinkedIn e miniaturas do YouTube.',
              '**Em centímetros**: para imprimir, com a resolução que você escolher.',
            ] },
            'Toque em **Redimensionar** e você verá a foto antes e depois, com o tamanho do arquivo. Se escolheu várias, elas são salvas juntas em um ZIP.',
          ],
        },
        {
          h2: 'Para não deformar',
          body: [
            'Uma foto fica esticada quando você muda a largura e a altura em proporções diferentes. Por isso, **Manter a proporção** já vem ativado: se você escrever os dois lados, a foto cabe dentro desse tamanho sem esticar. Em **Redes sociais**, a imagem preenche a medida exata e o que sobra é cortado por igual a partir do centro.',
            { tip: 'Diminuir uma foto nunca tira a nitidez visível, mas aumentá-la não acrescenta detalhes: uma foto pequena ampliada ao dobro fica borrada.' },
          ],
        },
        {
          h2: 'Se o que você quer é cortar ou deixar mais leve',
          body: [
            'Mudar o tamanho não é o mesmo que cortar. Para tirar uma borda, enquadrar uma pessoa ou deixar a foto quadrada, use o [Cortar imagem](/recortar-imagen): corte livre ou em proporções fixas como 1:1, 4:3 ou 16:9.',
            'E se um formulário pedir que a foto tenha menos de certo tamanho (por exemplo, 200 KB), o [Comprimir imagem](/comprimir-imagen) reduz a qualidade só o necessário para caber, e só diminui os pixels se não for suficiente.',
          ],
        },
        {
          h2: 'Medidas pedidas com frequência',
          body: [
            { ul: [
              '**Para uma página web ou um blog**: entre 1200 e 1920 pixels de largura é mais que suficiente; maior que isso só deixa a página lenta.',
              '**Para um formulário ou um cadastro**: costumam pedir uma largura máxima (por exemplo, 800 pixels) e um tamanho máximo de arquivo. Primeiro ajuste as medidas aqui e, se ainda ficar pesada, comprima.',
              '**Para imprimir**: use Em centímetros; a 300 ppp, uma foto de 10 × 15 cm precisa de uns 1181 × 1772 pixels para ficar nítida.',
            ] },
          ],
        },
        {
          h2: 'Suas fotos não são enviadas',
          body: [
            'Tudo acontece no seu navegador, mesmo com dezenas de fotos de uma vez. Além disso, ao salvar, os dados ocultos da foto (EXIF) são removidos, como a localização GPS de onde ela foi tirada.',
          ],
        },
      ],
      steps: [
        { name: 'Escolha as fotos', text: 'Acesse docusmart.online/pt/redimensionar-imagem e escolha uma ou várias fotos.' },
        { name: 'Escolha a medida', text: 'Por porcentagem, por pixels, uma medida de redes sociais ou em centímetros.' },
        { name: 'Redimensione', text: 'Toque em Redimensionar e compare o antes e o depois.' },
        { name: 'Baixe', text: 'Baixe a foto, ou o ZIP se forem várias.' },
      ],
      faq: [
        ['A foto perde qualidade ao diminuir?', 'Visualmente, não: ela fica igualmente nítida, só que menor. O que não dá é aumentá-la sem que se note.'],
        ['Posso mudar o tamanho de várias fotos de uma vez?', 'Sim. Escolha todas juntas: elas são redimensionadas com a mesma medida e baixadas em um ZIP.'],
        ['Que medida uso para o Instagram?', 'Em Redes sociais você tem Instagram quadrado e vertical, e stories. A foto preenche a medida e o que sobra é cortado a partir do centro.'],
      ],
    },
    'comprimir-archivos-en-zip': {
      slug: 'compactar-arquivos-em-zip',
      title: 'Como compactar arquivos em ZIP e abrir um ZIP ou RAR sem programas | DocuSmart',
      description:
        'Junte vários arquivos ou uma pasta em um ZIP, com senha se quiser, e abra ZIP, RAR ou 7Z pelo navegador. Grátis, sem instalar nada e sem enviar seus arquivos.',
      h1: 'Como compactar arquivos em ZIP e abrir um ZIP ou RAR',
      lead: 'Um ZIP junta muitos arquivos em um só: mais fácil de mandar por e-mail e, às vezes, mais leve. Aqui você o cria e o abre pelo navegador, sem instalar programas.',
      sections: [
        {
          h2: 'Criar um ZIP, passo a passo',
          body: [
            'Abra o [Compactar arquivos (ZIP e 7Z)](/comprimir-archivos) e adicione os arquivos (de qualquer tipo) ou uma pasta inteira com **Adicionar uma pasta**. Escreva o nome do ZIP e escolha a compressão: **Rápida**, **Normal** ou **Máxima**.',
            'Toque em **Criar ZIP**. Você verá seus arquivos de um lado e o ZIP do outro, com quanto tudo pesava antes e quanto pesa agora.',
            { tip: 'Fotos, vídeos e PDFs já vêm comprimidos, então em um ZIP quase não ficam mais leves. O que diminui bastante são documentos do Word, planilhas e textos.' },
          ],
        },
        {
          h2: 'Com senha ou em partes',
          body: [
            { ul: [
              '**Proteger com senha (AES-256)**: ninguém abre o ZIP sem a senha. No ZIP, a senha não pode ter acentos nem ç; se precisar deles, escolha o formato 7Z.',
              '**Dividir em partes**: se o e-mail não aceita um arquivo tão grande, você o divide em vários (.001, .002…). Para abri-lo, são necessárias todas as partes, com o DocuSmart, o 7-Zip ou o WinRAR.',
              '**7Z**: comprime mais que o ZIP, mas em alguns aparelhos é preciso instalar um programa para abri-lo. O ZIP abre em qualquer computador e celular sem instalar nada.',
            ] },
          ],
        },
        {
          h2: 'Abrir um ZIP, RAR ou 7Z',
          body: [
            'Para tirar o que tem dentro de um arquivo compactado, use o [Descompactar RAR, ZIP e 7Z](/descomprimir-archivos). Ele abre ZIP, RAR, 7Z, TAR, GZ, BZ2 e XZ, inclusive os que têm senha ou vêm divididos em partes.',
            'Você verá a lista do que há dentro, com as pastas. Pode abrir a pré-visualização de um arquivo antes de baixá-lo, extrair só os que escolher ou baixar todos juntos.',
          ],
        },
        {
          h2: 'Se o que você quer é um PDF mais leve',
          body: [
            'Colocar um PDF em um ZIP quase não o diminui. Para que um PDF fique realmente mais leve, passe-o pelo [Comprimir PDF](/comprimir-pdf), que reduz as imagens que ele tem dentro.',
          ],
        },
        {
          h2: 'Seus arquivos não saem do aparelho',
          body: [
            'Compactar e descompactar acontece na memória do seu navegador: nada é enviado para a internet. Com arquivos muito grandes (vários GB), pode demorar ou faltar memória; nesse caso, divida-os em vários ZIP.',
          ],
        },
      ],
      steps: [
        { name: 'Adicione os arquivos', text: 'Acesse docusmart.online/pt/compactar-arquivos e adicione arquivos ou uma pasta.' },
        { name: 'Escolha as opções', text: 'Escreva o nome, escolha a compressão e, se quiser, uma senha.' },
        { name: 'Crie o ZIP', text: 'Toque em Criar ZIP e veja quanto o tamanho diminuiu.' },
        { name: 'Baixe', text: 'Baixe o ZIP ou compartilhe.' },
      ],
      faq: [
        ['Posso abrir um RAR sem o WinRAR?', 'Sim. O Descompactar RAR, ZIP e 7Z abre RAR, ZIP, 7Z e outros formatos no navegador, sem instalar nada. Para criar um novo, use ZIP ou 7Z.'],
        ['Por que meu ZIP pesa quase o mesmo?', 'Porque fotos, vídeos e PDFs já vêm comprimidos. O ZIP serve para juntá-los em um único arquivo, não tanto para diminuí-los.'],
        ['É seguro colocar senha?', 'Sim. Ele é criptografado com AES-256 e a senha não fica salva em lugar nenhum: se você a esquecer, não há como recuperá-la.'],
      ],
    },
    'recortar-los-margenes-de-un-pdf': {
      slug: 'cortar-as-margens-de-um-pdf',
      title: 'Como cortar as margens ou uma parte de um PDF | DocuSmart',
      description:
        'Remova as margens em branco de um PDF com um toque ou corte à mão a parte que quer manter, em todas as páginas ou em uma só. Grátis e sem enviar o arquivo.',
      h1: 'Como cortar as margens ou uma parte de um PDF',
      lead: 'Um PDF com margens enormes fica pequeno para ler no celular e é impresso com muito papel em branco. Cortá-lo deixa só o que importa, sem mexer no conteúdo.',
      sections: [
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Cortar PDF](/recortar-pdf) e escolha o arquivo. Você verá a primeira página com um retângulo por cima: a parte escurecida é a que vai ser cortada.',
            'Toque em **Remover margens em branco** e o retângulo se ajusta sozinho ao conteúdo da página, como na imagem. Se preferir fazer à mão, arraste as bordas ou os cantos do retângulo. Embaixo você vê o tamanho que vai ficar, em milímetros.',
            'Escolha se o corte vale para **Todas as páginas** ou **Só a página** que você está vendo, toque em **Recortar PDF** e baixe o resultado.',
            { tip: 'Se as páginas tiverem margens diferentes, confira várias com as setas antes de cortar: o retângulo de "Todas as páginas" é o mesmo para cada uma.' },
          ],
        },
        {
          h2: 'Para que serve',
          body: [
            { ul: [
              '**Ler no celular**: sem margens, o texto ocupa a tela toda e fica maior.',
              '**Tirar uma parte**: uma tabela, um gráfico ou a foto de um documento digitalizado, para usar separadamente.',
              '**Remover o que sobra de uma digitalização**: a borda preta da tampa do scanner ou a mesa em volta da folha.',
            ] },
          ],
        },
        {
          h2: 'O que acontece com o conteúdo',
          body: [
            'O corte muda a área visível de cada página, sem refazer o texto nem as imagens: o que fica continua igualmente nítido e o texto ainda pode ser copiado e pesquisado.',
            'Se depois você precisar só de algumas páginas, separe-as com o [Dividir PDF](/dividir-pdf); e se alguma ficou de lado, endireite-a com o [Girar PDF](/rotar-pdf).',
          ],
        },
        {
          h2: 'Antes de imprimir',
          body: [
            'Ao imprimir um PDF cortado, a página fica menor que a folha. Para que ocupe o papel todo, escolha **Ajustar ao tamanho da página** na janela de impressão do seu navegador ou do seu leitor de PDF.',
            'Se você cortou uma digitalização para ficar com a foto de um documento (um RG, uma carteirinha), confira se não cortou nenhuma borda do documento: muitos processos pedem que os quatro cantos apareçam.',
          ],
        },
        {
          h2: 'Seu PDF não sai do aparelho',
          body: [
            'Todo o corte acontece no seu navegador. O PDF não é enviado a nenhum servidor, então você pode usá-lo com contratos ou documentos pessoais com tranquilidade.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Cortar PDF', text: 'Acesse docusmart.online/pt/cortar-pdf e escolha o PDF.' },
        { name: 'Ajuste o retângulo', text: 'Toque em Remover margens em branco ou arraste as bordas à mão.' },
        { name: 'Escolha as páginas', text: 'Aplique o corte a todas as páginas ou só à que você está vendo.' },
        { name: 'Baixe', text: 'Toque em Recortar PDF e baixe o resultado.' },
      ],
      faq: [
        ['Um PDF perde qualidade ao ser cortado?', 'Não. Só muda a área visível da página; o texto e as imagens continuam iguais.'],
        ['Posso cortar só uma página?', 'Sim. Antes de cortar, escolha só a página que você está vendo.'],
        ['O que foi cortado é apagado do arquivo?', 'Fica fora da visualização e da impressão. Se o que você quer é apagar um dado privado, use o Ocultar dados do PDF, que o elimina de verdade.'],
      ],
    },
    'cambiar-el-formato-de-una-imagen': {
      slug: 'mudar-o-formato-de-uma-imagem',
      title: 'Como mudar o formato de uma imagem: HEIC, JPG, PNG ou WebP | DocuSmart',
      description:
        'Converta fotos HEIC do iPhone para JPG, um JPG para PNG ou qualquer imagem para WebP, uma ou muitas de uma vez. Grátis, no navegador e sem enviar suas fotos.',
      h1: 'Como mudar o formato de uma imagem: HEIC, JPG, PNG ou WebP',
      lead: 'Cada formato serve para uma coisa, e às vezes um site ou um programa só aceita um deles. Aqui você muda o formato das suas fotos em segundos, sem instalar nada.',
      sections: [
        {
          h2: 'Qual formato é melhor para você',
          body: [
            { ul: [
              '**JPG**: o das fotos. É leve e abre em qualquer aparelho, site ou formulário. Não aceita fundo transparente.',
              '**PNG**: sem perda de qualidade e com fundo transparente. Ideal para logos, capturas de tela e desenhos; com fotos, pesa muito mais.',
              '**WebP**: o formato moderno da web. Fica igual a um JPG com bem menos peso, como na imagem: de 189 KB para 50 KB.',
              '**HEIC**: o que os iPhones usam. Ocupa pouco, mas muitos computadores, sites e programas não o abrem.',
            ] },
          ],
        },
        {
          h2: 'Fotos do iPhone (HEIC) para JPG',
          body: [
            'Abra o [HEIC para JPG](/heic-a-jpg) e escolha suas fotos HEIC, uma ou muitas. Ajuste a **Qualidade do JPG** se quiser (a que vem marcada fica igual à original) e toque em converter. Se forem várias, elas são baixadas juntas em um ZIP.',
            { tip: 'Na primeira vez, o decodificador de HEIC (1,4 MB) é baixado e fica salvo: as próximas conversões começam na hora.' },
            'Se preferir que o iPhone tire as fotos direto em JPG, em **Ajustes → Câmera → Formatos** escolha **Mais Compatível**.',
          ],
        },
        {
          h2: 'JPG para PNG, ou qualquer imagem para WebP',
          body: [
            'Com o [JPG para PNG](/jpg-a-png), você converte uma foto para PNG quando um programa pede ou quando vai editá-la várias vezes sem perder qualidade. Com o [Imagem para WebP](/imagen-a-webp), você deixa mais leves as fotos de um site ou de uma loja virtual sem que se note.',
            'Os dois funcionam igual: você escolhe uma ou várias imagens, toca no botão e vê o antes e o depois com o tamanho de cada versão, pronto para baixar.',
          ],
        },
        {
          h2: 'Se também precisa que fique mais leve ou mudar o tamanho',
          body: [
            'Mudar o formato não muda as medidas da foto. Se um formulário pede que ela não passe de certo tamanho de arquivo, use o [Comprimir imagem](/comprimir-imagen), que também aceita fotos HEIC e as entrega em JPG; e se pedirem uma largura ou uma altura exatas, o [Redimensionar imagem](/redimensionar-imagen).',
          ],
        },
        {
          h2: 'Sem enviar suas fotos',
          body: [
            'A conversão acontece no seu navegador: suas fotos não são enviadas a nenhum servidor. Ao salvá-las, os dados ocultos (EXIF) também são removidos, como a localização de onde foram tiradas.',
          ],
        },
      ],
      steps: [
        { name: 'Escolha a conversão', text: 'Abra o HEIC para JPG, o JPG para PNG ou o Imagem para WebP no docusmart.online.' },
        { name: 'Escolha as fotos', text: 'Adicione uma ou várias imagens.' },
        { name: 'Converta', text: 'Toque no botão e compare o antes e o depois.' },
        { name: 'Baixe', text: 'Baixe a imagem, ou o ZIP se forem várias.' },
      ],
      faq: [
        ['Por que não consigo abrir as fotos do meu iPhone no computador?', 'Porque elas estão em HEIC, um formato que muitos aparelhos e sites não reconhecem. Converta-as para JPG e elas abrem em qualquer lugar.'],
        ['Uma foto perde qualidade ao ser convertida para PNG?', 'Não: o PNG não perde qualidade. Mas também não a recupera; a foto fica igual ao JPG original e pesa mais.'],
        ['O WebP aparece em todos os navegadores?', 'Sim, em todos os navegadores atuais. Alguns programas de computador antigos ainda não o abrem.'],
      ],
    },
    'borrar-la-ubicacion-y-los-datos-ocultos-de-una-foto': {
      slug: 'apagar-a-localizacao-e-os-dados-ocultos-de-uma-foto',
      title: 'Como apagar a localização e os dados ocultos de uma foto ou PDF | DocuSmart',
      description:
        'Veja quais dados ocultos uma foto ou um documento guarda (localização GPS, câmera, data, autor) e apague-os antes de compartilhar. Grátis e sem enviar o arquivo.',
      h1: 'Como apagar a localização e os dados ocultos de uma foto',
      lead: 'Uma foto do celular pode guardar o lugar exato onde foi tirada, e um documento, o nome de quem o escreveu. Antes de publicá-los ou enviá-los, veja o que eles levam e apague.',
      sections: [
        {
          h2: 'O que são os dados ocultos (metadados)',
          body: [
            'São dados que vão dentro do arquivo, mas não aparecem na imagem nem nas páginas. Uma foto pode guardar a **Localização GPS**, a marca e o modelo do celular, o número de série da câmera e a data e a hora exatas. Um PDF ou um documento do Word pode guardar o **Autor**, a empresa, o programa com que foi feito e as datas de criação e de modificação.',
            'Quem receber o arquivo pode vê-los com qualquer visualizador. Com uma foto da sua casa, por exemplo, a localização leva ao seu endereço.',
          ],
        },
        {
          h2: 'Passo a passo',
          body: [
            'Abra o [Remover metadados (EXIF, GPS e autor)](/quitar-metadatos) e escolha suas fotos ou documentos: JPG, PNG, WebP, HEIC, TIFF, vídeos MP4 e MOV, PDF, Word, Excel ou PowerPoint. Na hora, você verá a lista de **Dados ocultos encontrados** em cada um, como na imagem; se uma foto guarda a localização, ela aparece em vermelho com um aviso.',
            'Toque em **Remover metadados**. Você verá quantos dados cada arquivo tinha antes e quantos restam depois, e baixa a cópia limpa (ou um ZIP, se forem vários).',
            { tip: 'Só a orientação das fotos é mantida, para que não apareçam giradas. A imagem não é comprimida de novo: não perde qualidade.' },
          ],
        },
        {
          h2: 'Em PDFs e documentos do Office',
          body: [
            'Nos PDFs, a opção **Remover também comentários, anexos e JavaScript** apaga ainda as notas com o nome do autor, os arquivos anexados e o código que é executado ao abri-los. Desative-a se precisar manter os comentários.',
            'No Word, no Excel e no PowerPoint, são removidos o autor, a empresa e as datas. Os nomes que aparecem nos comentários e no controle de alterações são apagados pelo próprio programa.',
          ],
        },
        {
          h2: 'Se o dado privado está à vista',
          body: [
            'Remover metadados não muda o que se vê. Se o que você quer esconder é um número de documento, uma assinatura ou um endereço que aparece nas páginas de um PDF, use o [Ocultar dados do PDF](/censurar-pdf), que o cobre e o elimina do arquivo.',
          ],
        },
        {
          h2: 'Tudo é feito no seu aparelho',
          body: [
            'Tudo acontece no seu navegador: suas fotos e documentos não são enviados a nenhum servidor. Assim você não deixa cópias de um arquivo privado justamente quando tenta protegê-lo.',
          ],
        },
      ],
      steps: [
        { name: 'Abra o Remover metadados', text: 'Acesse docusmart.online/pt/remover-metadados e escolha fotos ou documentos.' },
        { name: 'Veja o que eles guardam', text: 'Confira a lista de dados ocultos de cada arquivo, como a localização GPS.' },
        { name: 'Apague', text: 'Toque em Remover metadados e confirme que não sobrou nenhum.' },
        { name: 'Baixe', text: 'Baixe a cópia limpa, pronta para compartilhar.' },
      ],
      faq: [
        ['O WhatsApp apaga a localização das fotos?', 'Ao enviá-las como foto, o WhatsApp as comprime de novo e remove a maioria dos dados. Mas se você as manda como documento, por e-mail ou as publica em outros sites, elas podem chegar com a localização.'],
        ['A foto perde qualidade?', 'Não. Só os dados ocultos são removidos; a imagem fica exatamente igual.'],
        ['Quais dados são mantidos?', 'Só a orientação das fotos, para que não apareçam giradas. Todo o resto é apagado.'],
      ],
    },
  },
}
