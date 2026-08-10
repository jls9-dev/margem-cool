/**
 * Content for the top-level pillar pages.
 *
 * Kept as data rather than markup so the weekly routine can extend a pillar —
 * add a highlight, add a FAQ — without touching a layout, and so both
 * languages sit side by side where drift is visible.
 *
 * The highlights are chosen from the search-demand research rather than by
 * instinct: each one is a thing people actually look for in this region.
 */
export interface PillarFact { value: string; label: string }
export interface PillarFaq { question: string; answer: string }
export interface PillarHighlight { meta: string; title: string; blurb: string; href: string }

export interface PillarContent {
  title: string;
  kicker: string;
  dek: string;
  metaTitle: string;
  metaDescription: string;
  heroImage?: string;
  heroAlt?: string;
  heroCaption?: string;
  heroCredit?: string;
  intro: string;
  facts?: PillarFact[];
  highlights?: PillarHighlight[];
  faqs?: PillarFaq[];
}

const CREDIT = 'James Lumley-Savile';

export const PILLARS: Record<'pt' | 'en', Record<string, PillarContent>> = {
  pt: {
    comer_beber: {
      title: 'Comer & Beber',
      kicker: 'O que se come na Margem Sul',
      dek: 'Choco frito, marisco do Sado, queijo e torta de Azeitão, moscatel. O que é daqui, onde se come e o que pedir.',
      metaTitle: 'Comer e beber na Margem Sul — o guia',
      metaDescription: 'O que se come na Margem Sul: choco frito em Setúbal, marisco em Cacilhas e Sesimbra, queijo e torta de Azeitão, moscatel e vinho de Palmela.',
      heroImage: 'pillar-comer-sesimbra',
      heroAlt: 'Peixe grelhado num prato, em Sesimbra.',
      heroCaption: 'Peixe grelhado em Sesimbra. Na costa, a regra é simples: pede o que entrou nesse dia.',
      heroCredit: CREDIT,
      facts: [
        { value: 'Choco frito', label: 'O prato de Setúbal' },
        { value: 'Sado', label: 'De onde vem o marisco' },
        { value: 'Azeitão', label: 'Queijo, torta e vinho' },
        { value: '€–€€', label: 'A maioria das casas' },
      ],
      intro: `A Margem Sul come de dois sítios: do rio e da serra. Do Tejo e do Sado vem o marisco e o peixe — ameijoa, choco, sapateira, o que entrou de manhã. Da Arrábida e do interior de Palmela vem o queijo, o vinho e a fruta.

Isto não é uma cozinha regional inventada para turistas. É o que se come às quintas-feiras, em casas que às vezes não têm sítio na internet e quase nunca têm menu traduzido.

Se só puderes provar uma coisa, que seja **choco frito em Setúbal**. É o prato da cidade, faz-se em dezenas de casas, e cada uma jura que o seu é melhor.`,
      highlights: [
        { meta: 'Setúbal', title: 'Choco frito', blurb: 'Tiras de choco panadas e fritas, com batata frita e limão. O prato que define a cidade.', href: '/lugares/setubal/' },
        { meta: 'Cacilhas', title: 'A marginal do marisco', blurb: 'Marisqueiras a fio junto ao terminal do ferry, com Lisboa do outro lado da água.', href: '/lugares/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
        { meta: 'Azeitão', title: 'Queijo, torta e moscatel', blurb: 'Queijo de ovelha amanteigado, torta de Azeitão e o moscatel que fez o nome de Setúbal.', href: '/lugares/setubal/azeitao/' },
        { meta: 'Sesimbra', title: 'Peixe acabado de chegar', blurb: 'Vila piscatória com lota própria. A carta muda com o que a frota trouxe.', href: '/lugares/sesimbra/' },
      ],
      faqs: [
        { question: 'Qual é o prato típico da Margem Sul?', answer: 'Não há um só, mas o mais identificado com a região é o choco frito de Setúbal — tiras de choco panadas e fritas, servidas com batata frita e limão. Na faixa ribeirinha do Tejo predomina o marisco: ameijoas à Bulhão Pato, sapateira, gambas. Em Azeitão, o queijo de ovelha e a torta.' },
        { question: 'Onde se come melhor marisco na Margem Sul?', answer: 'A marginal de Cacilhas concentra marisqueiras com vista para Lisboa. Sesimbra e Setúbal têm a vantagem da lota à porta, com peixe e marisco que chegam no próprio dia. Setúbal acrescenta o Mercado do Livramento, onde se compra o peixe que os restaurantes à volta cozinham.' },
        { question: 'O que é o moscatel de Setúbal?', answer: 'Um vinho generoso doce feito na península de Setúbal, sobretudo em Azeitão e Palmela, a partir da casta moscatel. É denominação de origem protegida e envelhece em madeira — quanto mais velho, mais escuro e mais concentrado.' },
        { question: 'É preciso reservar nos restaurantes da Margem Sul?', answer: 'Nas casas com vista para o rio e nos fins de semana de verão, sim, e com dias de antecedência nalgumas. Nas tascas de bairro raramente é preciso — chega-se e espera-se, que é parte do processo.' },
      ],
    },

    praia_natureza: {
      title: 'Praia & Natureza',
      kicker: 'Do Tejo ao cabo',
      dek: 'A Arrábida, a Caparica, a Lagoa de Albufeira e o Cabo Espichel. Trinta quilómetros de costa, e o mar muda de carácter em cada um deles.',
      metaTitle: 'Praias da Margem Sul — Arrábida, Caparica e Sesimbra',
      metaDescription: 'As praias da Margem Sul: Arrábida, Costa da Caparica, Sesimbra, Lagoa de Albufeira e Cabo Espichel. Onde ir, como chegar e o que esperar de cada uma.',
      heroImage: 'pillar-praia-espichel',
      heroAlt: 'Enseada de arriba no Cabo Espichel, com o mar aberto ao fundo.',
      heroCaption: 'Cabo Espichel, no extremo da península. A costa da Margem Sul acaba aqui, em arriba.',
      heroCredit: CREDIT,
      facts: [
        { value: '~30 km', label: 'De costa atlântica' },
        { value: 'Arrábida', label: 'Parque natural' },
        { value: 'Caparica', label: 'A praia da cidade' },
        { value: 'Grátis', label: 'Quase todas as praias' },
      ],
      intro: `A Margem Sul tem duas costas e não se parecem nada uma com a outra.

A **oeste**, virada ao Atlântico aberto, é a Costa da Caparica: quilómetros de areia a direito, ondulação, escolas de surf, e um comboio de praias com nome próprio que vai da cidade até à Fonte da Telha.

A **sul**, protegida pela serra, é a Arrábida: enseadas de água parada e transparente entre arribas de calcário — Figueirinha, Galapinhos, Portinho. Parece outro país e fica a quarenta minutos.

Pelo meio ficam a Lagoa de Albufeira, onde a laguna encontra o mar, e Sesimbra, encostada à sua vila. No extremo de tudo, o Cabo Espichel, onde a terra acaba de vez.`,
      highlights: [
        { meta: 'Arrábida', title: 'Praia da Figueirinha', blurb: 'Areal largo de água calma dentro do parque natural. A mais procurada da serra, e nota-se em Agosto.', href: '/lugares/setubal/' },
        { meta: 'Sesimbra', title: 'Lagoa de Albufeira', blurb: 'Laguna de um lado, Atlântico do outro. Água quente e rasa para um lado, ondas para o outro.', href: '/lugares/sesimbra/' },
        { meta: 'Almada', title: 'Costa da Caparica', blurb: 'A costa de areia larga com ondulação atlântica e o comboio de praias até à Fonte da Telha.', href: '/lugares/almada/costa-da-caparica/' },
        { meta: 'Sesimbra', title: 'Cabo Espichel', blurb: 'O fim da península, com santuário, farol e pegadas de dinossauro na arriba.', href: '/lugares/sesimbra/castelo/' },
      ],
      faqs: [
        { question: 'Quais são as melhores praias da Margem Sul?', answer: 'Depende do que procuras. Para água calma e transparente, as praias da Arrábida — Figueirinha, Galapinhos, Portinho. Para ondas e espaço, a Costa da Caparica e a Fonte da Telha. Para ter as duas coisas no mesmo sítio, a Lagoa de Albufeira, que tem laguna de um lado e mar aberto do outro.' },
        { question: 'As praias da Arrábida têm restrições de acesso?', answer: 'No verão o acesso de carro ao Portinho da Arrábida e à Figueirinha é condicionado nos meses de maior afluência, com transporte alternativo a partir de parques afastados. As regras mudam de ano para ano — confirma no site do Parque Natural da Arrábida ou da Câmara de Setúbal antes de ires de carro em Agosto.' },
        { question: 'Qual é a praia mais fácil de alcançar de Lisboa sem carro?', answer: 'A Costa da Caparica. Barco ou ponte até Almada e depois autocarro, ou os transportes directos no verão. A Arrábida é bastante mais difícil sem carro — dá-se, mas leva a manhã.' },
        { question: 'A água é fria?', answer: 'Na costa atlântica, sim — é o Atlântico, e mesmo em Agosto está fresca. Nas enseadas abrigadas da Arrábida e na laguna da Lagoa de Albufeira é sensivelmente mais quente, porque a água fica parada e rasa.' },
      ],
    },

    cultura_agenda: {
      title: 'Cultura & Agenda',
      kicker: 'O que acontece por cá',
      dek: 'Festas de freguesia, romarias, feiras e festivais. De Maio a Setembro há sempre alguma coisa montada em algum lado.',
      metaTitle: 'Cultura e festas na Margem Sul — a agenda',
      metaDescription: 'Festas populares, romarias, feiras e festivais na Margem Sul: o calendário de verão, a Festa do Avante, as Vindimas de Palmela e as festas de freguesia.',
      heroImage: 'pillar-cultura-teatro',
      heroAlt: 'Concerto no Teatro Municipal Joaquim Benite, em Almada.',
      heroCaption: 'Teatro Municipal Joaquim Benite, Almada. A programação cultural da região não é só festa de rua.',
      heroCredit: CREDIT,
      facts: [
        { value: 'Mai–Set', label: 'A época das festas' },
        { value: '4–6 Set', label: 'Festa do Avante, Seixal' },
        { value: 'Grátis', label: 'As festas de freguesia' },
        { value: '9', label: 'Concelhos com festa própria' },
      ],
      intro: `A vida cultural da Margem Sul tem dois andares.

Em cima estão os equipamentos: o Teatro Municipal Joaquim Benite em Almada, o Fórum Municipal Luísa Todi em Setúbal, os museus e as galerias municipais, com programação regular durante o ano inteiro.

Em baixo — e é aqui que a região é diferente — está a rede das **colectividades e das comissões de festas**. Ranchos, filarmónicas, clubes, sociedades recreativas. São elas que montam os arraiais de Junho, as festas de freguesia de Agosto e as romarias, e é aí que a região é mais ela própria.

De Maio a Setembro isto acontece quase todos os fins de semana, em algum lado.`,
      highlights: [
        { meta: 'Seixal · 4–6 Set', title: 'Festa do Avante', blurb: 'Três dias na Quinta da Atalaia. O maior acontecimento que a região recebe todos os anos.', href: '/guias/festa-do-avante-2026/' },
        { meta: 'Toda a região', title: 'As festas de verão', blurb: 'O calendário mês a mês, concelho a concelho, das romarias às feiras grandes.', href: '/guias/festas-de-verao-margem-sul/' },
        { meta: 'Palmela · Setembro', title: 'Festas das Vindimas', blurb: 'A festa da vila do vinho, com bênção das uvas e cortejo. Fecha a época.', href: '/lugares/palmela/' },
        { meta: 'Setúbal · Julho', title: "Feira de Sant'Iago", blurb: 'A grande feira anual de Setúbal, entre concertos, tasquinhas e divertimentos.', href: '/lugares/setubal/' },
      ],
      faqs: [
        { question: 'Quando são as festas populares na Margem Sul?', answer: 'De Maio a Setembro, com o pico em Junho (os santos populares) e Agosto (as festas de freguesia). Setembro fecha com as Vindimas em Palmela e a Festa do Avante no Seixal.' },
        { question: 'As festas populares têm entrada paga?', answer: 'As festas de freguesia e as romarias são quase sempre de entrada livre — paga-se o que se come e se bebe nas tasquinhas. Os festivais com cartaz de concertos, como a Festa do Avante, têm bilhete.' },
        { question: 'Onde se vê a agenda cultural da Margem Sul?', answer: 'Cada câmara municipal publica a sua agenda, e as juntas de freguesia publicam os cartazes das festas nas suas páginas e no Facebook. Para as festas pequenas, o cartaz em papel colado no café continua a ser a fonte mais fiável — muitas só confirmam o programa duas ou três semanas antes.' },
      ],
    },

    viver_aqui: {
      title: 'Viver Aqui',
      kicker: 'A vida prática',
      dek: 'Transportes, escolas, saúde, mercados e o que custa. O que é preciso saber para viver na Margem Sul, não para a visitar.',
      metaTitle: 'Viver na Margem Sul — transportes, escolas e vida prática',
      metaDescription: 'Guia prático de quem vive na Margem Sul: atravessar o rio, transportes, escolas, saúde, mercados e as diferenças entre concelhos.',
      heroImage: 'pillar-viver-seixal',
      heroAlt: 'Parque ribeirinho no Seixal, com o Tejo ao fundo.',
      heroCaption: 'O parque ribeirinho do Seixal. Boa parte da vida aqui organiza-se à volta do rio e de como se atravessa.',
      heroCredit: CREDIT,
      facts: [
        { value: '10 min', label: 'Cacilhas–Cais do Sodré de barco' },
        { value: '1,60€', label: 'A travessia com zapping' },
        { value: '9', label: 'Concelhos' },
        { value: '4', label: 'Travessias de barco para Lisboa' },
      ],
      intro: `Viver na Margem Sul é, antes de tudo, uma relação com o rio. A pergunta que organiza o resto — onde morar, quanto se paga, quanto tempo demora a chegar ao trabalho — é sempre a mesma: **como atravessas?**

Há quatro travessias de barco para Lisboa (Cacilhas, Seixal, Barreiro e Montijo, mais a Trafaria para Belém), o comboio da Fertagus pela Ponte 25 de Abril, e as duas pontes. Cada concelho tem a sua combinação, e é isso que define o dia.

O resto — escolas, centros de saúde, mercados, tratar de papéis — organiza-se por concelho e por freguesia. Esta secção é a parte da publicação que não interessa nada a quem vem passar o fim de semana.`,
      highlights: [
        { meta: 'Almada', title: 'Cacilhas e a travessia', blurb: 'Dez minutos de barco até ao Cais do Sodré. A ligação mais rápida da margem sul a Lisboa.', href: '/lugares/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
        { meta: 'Seixal', title: 'Seixal', blurb: 'Baía, barco próprio para Lisboa e a Fertagus a norte. Muita da expansão recente aconteceu aqui.', href: '/lugares/seixal/' },
        { meta: 'Setúbal', title: 'Setúbal', blurb: 'Cidade a sério, com serviços próprios. Longe de Lisboa, mas não dependente dela.', href: '/lugares/setubal/' },
        { meta: 'Palmela', title: 'Palmela', blurb: 'Vinha, campo e vila. O interior da península, com Pinhal Novo como nó ferroviário.', href: '/lugares/palmela/' },
      ],
      faqs: [
        { question: 'Como se atravessa o rio para Lisboa?', answer: 'De barco a partir de Cacilhas (10 min para o Cais do Sodré), Seixal, Barreiro e Montijo, e da Trafaria para Belém. De comboio pela Fertagus, que atravessa a Ponte 25 de Abril. De carro pelas duas pontes — a 25 de Abril e a Vasco da Gama.' },
        { question: 'Quanto custa o barco para Lisboa?', answer: 'Cacilhas–Cais do Sodré são 2,00€ em bilhete simples e 1,60€ com zapping. Seixal 2,85€, Barreiro 2,95€, Montijo 3,25€, Trafaria–Belém 1,50€. Há passes mensais para quem atravessa todos os dias.' },
        { question: 'A Margem Sul é mais barata do que Lisboa?', answer: 'Historicamente sim, e continua a sê-lo em quase toda a região, embora a diferença tenha diminuído bastante na última década nos concelhos com ligação rápida a Lisboa. Almada e Seixal subiram mais; Barreiro, Moita e Montijo continuam sensivelmente mais acessíveis.' },
        { question: 'Que concelhos compõem a Margem Sul?', answer: 'Nove: Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal e Sesimbra. Correspondem à margem sul da Área Metropolitana de Lisboa, na Península de Setúbal.' },
      ],
    },

    dormir: {
      title: 'Dormir',
      kicker: 'Onde ficar',
      dek: 'Da vila de Sesimbra à Costa da Caparica, passando por Setúbal e pela Arrábida. Onde faz sentido ficar, e para quê.',
      metaTitle: 'Onde ficar na Margem Sul — Sesimbra, Caparica e Setúbal',
      metaDescription: 'Onde dormir na Margem Sul: Sesimbra, Costa da Caparica, Setúbal, Arrábida e Almada. Que zona escolher consoante o que vais fazer.',
      heroImage: 'pillar-dormir-caparica',
      heroAlt: 'Areal largo da Costa da Caparica com o mar e o sol baixo.',
      heroCaption: 'Costa da Caparica. Ficar aqui põe-te à distância de uma caminhada da praia e a meia hora de Lisboa.',
      heroCredit: CREDIT,
      facts: [
        { value: '30 min', label: 'De Lisboa à Caparica' },
        { value: 'Sesimbra', label: 'A vila com mais camas' },
        { value: 'Verão', label: 'Quando é preciso reservar' },
        { value: '4', label: 'Zonas com carácter próprio' },
      ],
      intro: `A Margem Sul não é um destino de hotel — é uma região onde se vive. Isso quer dizer que a oferta é mais pequena do que a de Lisboa e que a escolha da zona conta mais do que a escolha da casa.

A pergunta útil não é "qual é o melhor hotel", é **o que vieste fazer**. Quem vem pela Arrábida fica em Setúbal ou em Sesimbra. Quem vem pelo surf fica na Caparica. Quem quer Lisboa mais barata e o rio à porta fica em Almada, a dez minutos de barco do centro.

No verão — Julho e Agosto — reserva com antecedência. A oferta é limitada e enche.`,
      highlights: [
        { meta: 'Sesimbra', title: 'Sesimbra', blurb: 'Vila piscatória com castelo, praia abrigada e a Arrábida à porta. A base para a serra.', href: '/lugares/sesimbra/' },
        { meta: 'Almada', title: 'Costa da Caparica', blurb: 'Praia atlântica e surf, com Lisboa a meia hora. Bom para quem quer mar e cidade.', href: '/lugares/almada/costa-da-caparica/' },
        { meta: 'Setúbal', title: 'Setúbal', blurb: 'Cidade com serviços, o Mercado do Livramento e o Sado. Base para a Arrábida e para os golfinhos.', href: '/lugares/setubal/' },
        { meta: 'Almada', title: 'Cacilhas e Almada', blurb: 'Dez minutos de barco do Cais do Sodré. Lisboa à distância de uma travessia.', href: '/lugares/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
      ],
      faqs: [
        { question: 'Onde ficar na Margem Sul para visitar a Arrábida?', answer: 'Setúbal ou Sesimbra. Setúbal tem mais serviços, mais restaurantes e o acesso pelo lado do Sado; Sesimbra é mais pequena, mais virada ao mar e fica do lado do Cabo Espichel. Ambas ficam a menos de meia hora das praias da serra.' },
        { question: 'Vale a pena ficar na Margem Sul para visitar Lisboa?', answer: 'Se ficares em Almada ou Cacilhas, sim — são dez minutos de barco até ao Cais do Sodré, muitas vezes por menos dinheiro do que o equivalente do outro lado, e com a travessia como parte do dia. A partir de Setúbal ou Sesimbra já não compensa para esse fim.' },
        { question: 'É preciso reservar com antecedência?', answer: 'Em Julho e Agosto, sim, sobretudo em Sesimbra e na Costa da Caparica. Fora da época alta há disponibilidade com pouca antecedência em quase toda a região.' },
      ],
    },

    lugares_bairros: {
      title: 'Lugares & Bairros',
      kicker: 'Nove concelhos',
      dek: 'De Almada a Alcochete, do Barreiro à Arrábida. A geografia da Margem Sul, concelho a concelho e bairro a bairro.',
      metaTitle: 'Os concelhos e lugares da Margem Sul',
      metaDescription: 'Os nove concelhos da Margem Sul — Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal e Sesimbra — e os lugares dentro deles.',
      heroImage: 'pillar-lugares-almada',
      heroAlt: 'Silhueta do Cristo Rei e da Ponte 25 de Abril sobre as docas de Cacilhas ao pôr do sol.',
      heroCaption: 'Almada ao fim do dia: o Cristo Rei, a ponte e as docas de Cacilhas na mesma linha de água.',
      heroCredit: CREDIT,
      facts: [
        { value: '9', label: 'Concelhos' },
        { value: '~40', label: 'Freguesias' },
        { value: 'Tejo', label: 'A norte' },
        { value: 'Sado', label: 'A sul' },
      ],
      intro: `"Margem Sul" é uma expressão de uso, não uma unidade administrativa. Corresponde, na prática, aos **nove concelhos** da Península de Setúbal que fazem parte da Área Metropolitana de Lisboa: Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal e Sesimbra.

Entre eles há menos em comum do que a expressão sugere. Almada é subúrbio denso de Lisboa; Setúbal é uma cidade a sério com vida própria; Palmela é vinha e campo; Alcochete olha para o estuário e para as salinas. Sesimbra vive do mar e Barreiro do que resta da indústria — e da reinvenção do que veio depois.

Esta secção percorre-os um a um, e depois desce às freguesias e aos lugares dentro deles.`,
      highlights: [
        { meta: 'Concelho', title: 'Almada', blurb: 'Cristo Rei, Cacilhas, a Caparica. O concelho mais próximo de Lisboa e o mais visitado.', href: '/lugares/almada/' },
        { meta: 'Concelho', title: 'Setúbal', blurb: 'Cidade, Sado, Arrábida e mercado. A capital de distrito e o pólo do sul da península.', href: '/lugares/setubal/' },
        { meta: 'Concelho', title: 'Sesimbra', blurb: 'Vila piscatória, castelo, Cabo Espichel e a face marítima da Arrábida.', href: '/lugares/sesimbra/' },
        { meta: 'Todos', title: 'O mapa da região', blurb: 'Os nove concelhos num mapa, com as freguesias e os lugares dentro de cada um.', href: '/lugares/' },
      ],
      faqs: [
        { question: 'Que concelhos fazem parte da Margem Sul?', answer: 'Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal e Sesimbra — nove ao todo, na Península de Setúbal, correspondendo à margem sul da Área Metropolitana de Lisboa.' },
        { question: 'Margem Sul e Península de Setúbal são a mesma coisa?', answer: 'Quase. A Península de Setúbal é a designação administrativa da sub-região; "Margem Sul" é a expressão de uso corrente, mais ligada à relação com Lisboa do outro lado do Tejo. Na prática as pessoas usam as duas para o mesmo território.' },
        { question: 'Qual é o maior concelho da Margem Sul?', answer: 'Em população, Almada e Seixal são os mais povoados, por serem os mais próximos de Lisboa. Em área, Palmela e Setúbal são bastante maiores, por incluírem campo, vinha e serra.' },
      ],
    },
  },

  en: {
    comer_beber: {
      title: 'Eat & Drink',
      kicker: 'What this region eats',
      dek: 'Choco frito, shellfish from the Sado, Azeitão cheese and moscatel. What comes from here, where to eat it and what to order.',
      metaTitle: 'Eating and drinking in the Margem Sul — a guide',
      metaDescription: 'What to eat in the Margem Sul: choco frito in Setúbal, shellfish in Cacilhas and Sesimbra, Azeitão cheese and torta, moscatel and Palmela wine.',
      heroImage: 'pillar-comer-sesimbra',
      heroAlt: 'Grilled fish on a plate in Sesimbra.',
      heroCaption: 'Grilled fish in Sesimbra. On the coast the rule is simple: order whatever came in that day.',
      heroCredit: CREDIT,
      facts: [
        { value: 'Choco frito', label: "Setúbal's dish" },
        { value: 'Sado', label: 'Where the shellfish comes from' },
        { value: 'Azeitão', label: 'Cheese, torta and wine' },
        { value: '€–€€', label: 'Most places' },
      ],
      intro: `The Margem Sul eats from two places: the water and the hills. From the Tagus and the Sado come the shellfish and the fish — clams, cuttlefish, spider crab, whatever landed that morning. From the Arrábida and the country behind Palmela come the cheese, the wine and the fruit.

This isn't a regional cuisine assembled for visitors. It's what gets eaten on a Thursday, in places that sometimes have no website and almost never have a translated menu.

If you only try one thing, make it **choco frito in Setúbal**. It's the city's dish, dozens of places cook it, and every one of them swears theirs is best.`,
      highlights: [
        { meta: 'Setúbal', title: 'Choco frito', blurb: 'Strips of cuttlefish, breaded and fried, with chips and lemon. The dish that defines the city.', href: '/en/places/setubal/' },
        { meta: 'Cacilhas', title: 'The shellfish strip', blurb: 'Marisqueiras in a row by the ferry terminal, with Lisbon across the water.', href: '/en/places/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
        { meta: 'Azeitão', title: 'Cheese, torta and moscatel', blurb: "Buttery sheep's cheese, the Azeitão torta, and the moscatel that made Setúbal's name.", href: '/en/places/setubal/azeitao/' },
        { meta: 'Sesimbra', title: 'Fish straight off the boat', blurb: 'A fishing town with its own auction. The menu changes with what the fleet brought in.', href: '/en/places/sesimbra/' },
      ],
      faqs: [
        { question: 'What food is the Margem Sul known for?', answer: "There isn't one dish, but the most identified with the region is choco frito from Setúbal — strips of cuttlefish, breaded and fried, served with chips and lemon. Along the Tagus the emphasis is shellfish: clams à Bulhão Pato, spider crab, prawns. In Azeitão it's sheep's cheese and the torta." },
        { question: 'Where is the best seafood in the Margem Sul?', answer: 'The Cacilhas waterfront has a run of marisqueiras looking across at Lisbon. Sesimbra and Setúbal have the advantage of the fish auction on the doorstep, with fish and shellfish landing the same day. Setúbal adds the Mercado do Livramento, where the restaurants around it buy what they cook.' },
        { question: 'What is moscatel de Setúbal?', answer: 'A sweet fortified wine made on the Setúbal peninsula, mostly around Azeitão and Palmela, from the moscatel grape. It carries a protected designation of origin and ages in wood — the older it gets, the darker and more concentrated it becomes.' },
        { question: 'Do you need to book restaurants in the Margem Sul?', answer: 'For the places with a river view, and on summer weekends, yes — some of them days ahead. In neighbourhood tascas it is rarely necessary; you turn up and you wait, which is part of the process.' },
      ],
    },

    praia_natureza: {
      title: 'Beach & Outdoors',
      kicker: 'From the Tagus to the cape',
      dek: 'The Arrábida, the Caparica, the Lagoa de Albufeira and Cabo Espichel. Thirty kilometres of coast, and the sea changes character along every one of them.',
      metaTitle: 'Beaches of the Margem Sul — Arrábida, Caparica and Sesimbra',
      metaDescription: 'The beaches of the Margem Sul: Arrábida, Costa da Caparica, Sesimbra, Lagoa de Albufeira and Cabo Espichel. Where to go, how to get there and what to expect.',
      heroImage: 'pillar-praia-espichel',
      heroAlt: 'A cliff cove at Cabo Espichel, with open sea beyond.',
      heroCaption: 'Cabo Espichel, at the end of the peninsula. The coast of the Margem Sul finishes here, in cliff.',
      heroCredit: CREDIT,
      facts: [
        { value: '~30 km', label: 'Of Atlantic coast' },
        { value: 'Arrábida', label: 'Natural park' },
        { value: 'Caparica', label: "The city's beach" },
        { value: 'Free', label: 'Almost every beach' },
      ],
      intro: `The Margem Sul has two coasts and they look nothing like each other.

To the **west**, facing the open Atlantic, is the Costa da Caparica: kilometres of straight sand, swell, surf schools, and a chain of individually named beaches running from the town down to Fonte da Telha.

To the **south**, sheltered by the hills, is the Arrábida: coves of still, clear water between limestone cliffs — Figueirinha, Galapinhos, Portinho. It looks like a different country and it's forty minutes away.

Between them sit the Lagoa de Albufeira, where a lagoon meets the sea, and Sesimbra, tucked against its town. At the far end of everything, Cabo Espichel, where the land stops for good.`,
      highlights: [
        { meta: 'Arrábida', title: 'Praia da Figueirinha', blurb: 'A wide bay of calm water inside the natural park. The most sought-after in the hills, and it shows in August.', href: '/en/places/setubal/' },
        { meta: 'Sesimbra', title: 'Lagoa de Albufeira', blurb: 'Lagoon on one side, Atlantic on the other. Warm and shallow one way, waves the other.', href: '/en/places/sesimbra/' },
        { meta: 'Almada', title: 'Costa da Caparica', blurb: 'Broad Atlantic sand with real swell, and the chain of beaches down to Fonte da Telha.', href: '/en/places/almada/costa-da-caparica/' },
        { meta: 'Sesimbra', title: 'Cabo Espichel', blurb: 'The end of the peninsula, with a sanctuary, a lighthouse and dinosaur tracks in the cliff.', href: '/en/places/sesimbra/castelo/' },
      ],
      faqs: [
        { question: 'Which are the best beaches in the Margem Sul?', answer: "It depends what you want. For calm, clear water, the Arrábida beaches — Figueirinha, Galapinhos, Portinho. For waves and space, the Costa da Caparica and Fonte da Telha. For both in one place, the Lagoa de Albufeira, which has a lagoon on one side and open sea on the other." },
        { question: 'Is access to the Arrábida beaches restricted?', answer: 'In summer, car access to Portinho da Arrábida and Figueirinha is restricted during the busiest months, with shuttle transport from car parks further out. The rules change from year to year — check the Parque Natural da Arrábida or Câmara de Setúbal before driving there in August.' },
        { question: 'Which beach is easiest to reach from Lisbon without a car?', answer: 'The Costa da Caparica. Ferry or bridge to Almada then a bus, or the direct summer services. The Arrábida is considerably harder without a car — doable, but it takes the morning.' },
        { question: 'Is the water cold?', answer: "On the Atlantic coast, yes — it's the Atlantic, and it's bracing even in August. In the sheltered Arrábida coves and in the lagoon at Lagoa de Albufeira it is noticeably warmer, because the water sits still and shallow." },
      ],
    },

    cultura_agenda: {
      title: "Culture & What's On",
      kicker: 'What happens here',
      dek: 'Parish festas, romarias, fairs and festivals. From May to September there is always something set up somewhere.',
      metaTitle: "Culture and festas in the Margem Sul — what's on",
      metaDescription: 'Popular festas, romarias, fairs and festivals in the Margem Sul: the summer calendar, Festa do Avante, the Palmela grape harvest and the parish festas.',
      heroImage: 'pillar-cultura-teatro',
      heroAlt: 'A concert at the Teatro Municipal Joaquim Benite in Almada.',
      heroCaption: 'Teatro Municipal Joaquim Benite, Almada. The region’s cultural programme is not only street festas.',
      heroCredit: CREDIT,
      facts: [
        { value: 'May–Sep', label: 'The festa season' },
        { value: '4–6 Sep', label: 'Festa do Avante, Seixal' },
        { value: 'Free', label: 'The parish festas' },
        { value: '9', label: 'Concelhos with their own' },
      ],
      intro: `Cultural life in the Margem Sul runs on two floors.

Upstairs are the institutions: the Teatro Municipal Joaquim Benite in Almada, the Fórum Municipal Luísa Todi in Setúbal, the municipal museums and galleries, programming steadily through the year.

Downstairs — and this is where the region differs — is the network of **colectividades and festa committees**. Folk groups, brass bands, sports clubs, recreational societies. They are the ones who put up the June arraiais, the August parish festas and the romarias, and that is where the region is most itself.

From May to September this happens nearly every weekend, somewhere.`,
      highlights: [
        { meta: 'Seixal · 4–6 Sep', title: 'Festa do Avante', blurb: 'Three days at Quinta da Atalaia. The largest single event the region holds each year.', href: '/en/guides/festa-do-avante-2026/' },
        { meta: 'Region-wide', title: 'The summer festas', blurb: 'The calendar month by month, concelho by concelho, from romarias to the big fairs.', href: '/en/guides/festa-do-avante-2026/' },
        { meta: 'Palmela · September', title: 'Festas das Vindimas', blurb: 'The wine town’s festa, with the blessing of the grapes and a procession. It closes the season.', href: '/en/places/palmela/' },
        { meta: 'Setúbal · July', title: "Feira de Sant'Iago", blurb: "Setúbal's big annual fair — concerts, tasquinhas and fairground rides.", href: '/en/places/setubal/' },
      ],
      faqs: [
        { question: 'When are the popular festas in the Margem Sul?', answer: 'May to September, peaking in June (the santos populares) and August (the parish festas). September closes with the grape harvest festival in Palmela and Festa do Avante in Seixal.' },
        { question: 'Do the popular festas charge admission?', answer: 'Parish festas and romarias are almost always free to enter — you pay for what you eat and drink at the tasquinhas. Festivals with a concert programme, like Festa do Avante, sell tickets.' },
        { question: "Where do you find what's on in the Margem Sul?", answer: 'Each câmara municipal publishes its own cultural listings, and the juntas de freguesia post festa programmes on their pages and on Facebook. For the small festas, the paper poster taped up in the café is still the most reliable source — many only confirm two or three weeks ahead.' },
      ],
    },

    viver_aqui: {
      title: 'Living Here',
      kicker: 'The practical side',
      dek: 'Transport, schools, healthcare, markets and what things cost. What you need to know to live in the Margem Sul, not to visit it.',
      metaTitle: 'Living in the Margem Sul — transport, schools and practicalities',
      metaDescription: 'A practical guide for people living in the Margem Sul: crossing the river, transport, schools, healthcare, markets and the differences between concelhos.',
      heroImage: 'pillar-viver-seixal',
      heroAlt: 'The riverside park at Seixal, with the Tagus beyond.',
      heroCaption: 'The riverside park at Seixal. Much of life here organises itself around the river and how you cross it.',
      heroCredit: CREDIT,
      facts: [
        { value: '10 min', label: 'Cacilhas–Cais do Sodré by ferry' },
        { value: '€1.60', label: 'The crossing with zapping' },
        { value: '9', label: 'Concelhos' },
        { value: '4', label: 'Ferry crossings to Lisbon' },
      ],
      intro: `Living in the Margem Sul is, before anything else, a relationship with the river. The question that organises everything else — where to live, what you pay, how long the commute takes — is always the same: **how do you cross?**

There are four ferry crossings to Lisbon (Cacilhas, Seixal, Barreiro and Montijo, plus Trafaria to Belém), the Fertagus train over the Ponte 25 de Abril, and the two bridges. Every concelho has its own combination, and that is what shapes the day.

The rest — schools, health centres, markets, dealing with paperwork — is organised by concelho and by freguesia. This is the part of the publication that is of no interest whatsoever to someone here for the weekend.`,
      highlights: [
        { meta: 'Almada', title: 'Cacilhas and the crossing', blurb: 'Ten minutes by boat to Cais do Sodré. The fastest link from the south bank into Lisbon.', href: '/en/places/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
        { meta: 'Seixal', title: 'Seixal', blurb: 'A bay, its own ferry to Lisbon and the Fertagus to the north. Much of the recent growth happened here.', href: '/en/places/seixal/' },
        { meta: 'Setúbal', title: 'Setúbal', blurb: 'A proper city with its own services. Far from Lisbon, but not dependent on it.', href: '/en/places/setubal/' },
        { meta: 'Palmela', title: 'Palmela', blurb: 'Vines, country and a hill town. The interior of the peninsula, with Pinhal Novo as the rail junction.', href: '/en/places/palmela/' },
      ],
      faqs: [
        { question: 'How do you cross the river to Lisbon?', answer: 'By ferry from Cacilhas (10 minutes to Cais do Sodré), Seixal, Barreiro and Montijo, and from Trafaria to Belém. By train on the Fertagus, which crosses the Ponte 25 de Abril. By car over the two bridges — the 25 de Abril and the Vasco da Gama.' },
        { question: 'What does the ferry to Lisbon cost?', answer: 'Cacilhas–Cais do Sodré is €2.00 on a single ticket and €1.60 with zapping. Seixal €2.85, Barreiro €2.95, Montijo €3.25, Trafaria–Belém €1.50. Monthly passes exist for daily commuters.' },
        { question: 'Is the Margem Sul cheaper than Lisbon?', answer: 'Historically yes, and it still is across most of the region, though the gap has narrowed considerably over the past decade in the concelhos with a fast link to Lisbon. Almada and Seixal have risen most; Barreiro, Moita and Montijo remain noticeably more affordable.' },
        { question: 'Which concelhos make up the Margem Sul?', answer: 'Nine: Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal and Sesimbra. They form the south side of the Lisbon metropolitan area, on the Setúbal Peninsula.' },
      ],
    },

    dormir: {
      title: 'Where to Stay',
      kicker: 'Choosing a base',
      dek: 'From the town of Sesimbra to the Costa da Caparica, by way of Setúbal and the Arrábida. Where it makes sense to stay, and for what.',
      metaTitle: 'Where to stay in the Margem Sul — Sesimbra, Caparica, Setúbal',
      metaDescription: 'Where to stay in the Margem Sul: Sesimbra, Costa da Caparica, Setúbal, the Arrábida and Almada. Which area to pick for what you came to do.',
      heroImage: 'pillar-dormir-caparica',
      heroAlt: 'The wide sands of Costa da Caparica with the sea and low sun.',
      heroCaption: 'Costa da Caparica. Staying here puts you a walk from the beach and half an hour from Lisbon.',
      heroCredit: CREDIT,
      facts: [
        { value: '30 min', label: 'Lisbon to Caparica' },
        { value: 'Sesimbra', label: 'The town with most beds' },
        { value: 'Summer', label: 'When to book ahead' },
        { value: '4', label: 'Areas with distinct character' },
      ],
      intro: `The Margem Sul is not a hotel destination — it is a region where people live. That means the supply is smaller than Lisbon's and the choice of area matters more than the choice of building.

The useful question isn't "which is the best hotel", it's **what did you come to do**. People here for the Arrábida stay in Setúbal or Sesimbra. People here for the surf stay in Caparica. People who want Lisbon cheaper, with the river at the door, stay in Almada, ten minutes by boat from the centre.

In July and August, book ahead. Supply is limited and it fills.`,
      highlights: [
        { meta: 'Sesimbra', title: 'Sesimbra', blurb: 'A fishing town with a castle, a sheltered beach and the Arrábida at the door. The base for the hills.', href: '/en/places/sesimbra/' },
        { meta: 'Almada', title: 'Costa da Caparica', blurb: 'Atlantic beach and surf, with Lisbon half an hour away. Good for wanting both.', href: '/en/places/almada/costa-da-caparica/' },
        { meta: 'Setúbal', title: 'Setúbal', blurb: 'A city with services, the Mercado do Livramento and the Sado. Base for the Arrábida and the dolphins.', href: '/en/places/setubal/' },
        { meta: 'Almada', title: 'Cacilhas and Almada', blurb: 'Ten minutes by boat from Cais do Sodré. Lisbon at the distance of a crossing.', href: '/en/places/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/' },
      ],
      faqs: [
        { question: 'Where should I stay to visit the Arrábida?', answer: 'Setúbal or Sesimbra. Setúbal has more services, more restaurants and access from the Sado side; Sesimbra is smaller, more turned towards the sea and sits on the Cabo Espichel side. Both are under half an hour from the hill beaches.' },
        { question: 'Is it worth staying in the Margem Sul to visit Lisbon?', answer: "If you stay in Almada or Cacilhas, yes — it's ten minutes by boat to Cais do Sodré, often for less money than the equivalent on the other side, with the crossing as part of the day. From Setúbal or Sesimbra it no longer makes sense for that purpose." },
        { question: 'Do I need to book ahead?', answer: 'In July and August, yes, particularly in Sesimbra and the Costa da Caparica. Outside high season there is availability at short notice across most of the region.' },
      ],
    },

    lugares_bairros: {
      title: 'Places & Neighbourhoods',
      kicker: 'Nine concelhos',
      dek: 'From Almada to Alcochete, from Barreiro to the Arrábida. The geography of the Margem Sul, concelho by concelho and bairro by bairro.',
      metaTitle: 'The concelhos and places of the Margem Sul',
      metaDescription: 'The nine concelhos of the Margem Sul — Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal and Sesimbra — and the places within them.',
      heroImage: 'pillar-lugares-almada',
      heroAlt: 'The silhouette of Cristo Rei and the Ponte 25 de Abril above the Cacilhas docks at sunset.',
      heroCaption: 'Almada at the end of the day: Cristo Rei, the bridge and the Cacilhas docks on one line of water.',
      heroCredit: CREDIT,
      facts: [
        { value: '9', label: 'Concelhos' },
        { value: '~40', label: 'Freguesias' },
        { value: 'Tagus', label: 'To the north' },
        { value: 'Sado', label: 'To the south' },
      ],
      intro: `"Margem Sul" is a phrase people use, not an administrative unit. In practice it means the **nine concelhos** of the Setúbal Peninsula that form part of the Lisbon metropolitan area: Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal and Sesimbra.

They have less in common than the phrase suggests. Almada is dense Lisbon suburb; Setúbal is a proper city with its own life; Palmela is vines and country; Alcochete looks out at the estuary and the salt pans. Sesimbra lives off the sea, and Barreiro off what remains of its industry — and off the reinvention that followed.

This section works through them one by one, then down into the freguesias and the places inside them.`,
      highlights: [
        { meta: 'Concelho', title: 'Almada', blurb: 'Cristo Rei, Cacilhas, the Caparica. The concelho closest to Lisbon and the most visited.', href: '/en/places/almada/' },
        { meta: 'Concelho', title: 'Setúbal', blurb: 'City, Sado, Arrábida and market. The district capital and the pole of the southern peninsula.', href: '/en/places/setubal/' },
        { meta: 'Concelho', title: 'Sesimbra', blurb: 'Fishing town, castle, Cabo Espichel and the seaward face of the Arrábida.', href: '/en/places/sesimbra/' },
        { meta: 'All of them', title: 'The map of the region', blurb: 'The nine concelhos on a map, with the freguesias and places inside each one.', href: '/en/places/' },
      ],
      faqs: [
        { question: 'Which concelhos are in the Margem Sul?', answer: 'Almada, Seixal, Barreiro, Moita, Montijo, Alcochete, Palmela, Setúbal and Sesimbra — nine in all, on the Setúbal Peninsula, forming the south side of the Lisbon metropolitan area.' },
        { question: 'Are the Margem Sul and the Setúbal Peninsula the same thing?', answer: 'Almost. The Setúbal Peninsula is the administrative name for the sub-region; "Margem Sul" is the everyday phrase, tied more to the relationship with Lisbon across the Tagus. In practice people use both for the same territory.' },
        { question: 'Which is the largest concelho in the Margem Sul?', answer: 'By population, Almada and Seixal are the most populous, being closest to Lisbon. By area, Palmela and Setúbal are considerably larger, because they take in farmland, vineyard and hills.' },
      ],
    },
  },
};
