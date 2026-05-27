// One-shot seeder for the canonical place hierarchy of the Margem Sul.
// Produces placeholder Place files for all 9 concelhos and their post-2013 freguesias.
//
// The freguesia list reflects the 2013 administrative reform (Lei 11-A/2013).
// Names with diacritics are kept on display fields; slugs are ASCII-folded.
// This is a placeholder seed — Lucia should verify Portuguese descriptions
// and any borderline freguesia names before they leave 'placeholder' status.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = join(process.cwd(), 'src/content/places');
const TODAY = new Date().toISOString().slice(0, 10);

/** @typedef {{ slug: string, name_pt: string, short_pt: string, short_en: string, freguesias: Freguesia[] }} Concelho */
/** @typedef {{ slug: string, name_pt: string, short_pt: string, short_en: string }} Freguesia */

/** @type {Concelho[]} */
const concelhos = [
  {
    slug: 'almada',
    name_pt: 'Almada',
    short_pt: 'Concelho na margem sul do Tejo, em frente a Lisboa, do Cristo Rei à Costa da Caparica.',
    short_en: 'A concelho on the south bank of the Tejo, opposite Lisbon, running from Cristo Rei to the Costa da Caparica.',
    freguesias: [
      { slug: 'almada-cova-da-piedade-pragal-e-cacilhas', name_pt: 'União das Freguesias de Almada, Cova da Piedade, Pragal e Cacilhas',
        short_pt: 'A faixa ribeirinha de Almada, de Cacilhas ao Pragal, incluindo a Cova da Piedade.',
        short_en: 'The riverside strip of Almada, from Cacilhas up to Pragal, taking in Cova da Piedade.' },
      { slug: 'caparica-e-trafaria', name_pt: 'União das Freguesias de Caparica e Trafaria',
        short_pt: 'Caparica vila e a Trafaria, junto à foz do Tejo.',
        short_en: 'The Caparica town and Trafaria, at the mouth of the Tejo.' },
      { slug: 'charneca-de-caparica-e-sobreda', name_pt: 'União das Freguesias de Charneca de Caparica e Sobreda',
        short_pt: 'A Charneca e a Sobreda, terra alta entre Almada e a Costa.',
        short_en: 'Charneca and Sobreda, the high ground between Almada and the coast.' },
      { slug: 'costa-da-caparica', name_pt: 'Costa da Caparica',
        short_pt: 'A faixa de praia que vai do Tejo ao sul de Almada.',
        short_en: 'The beach strip running south from the Tejo along the Atlantic edge of Almada.' },
      { slug: 'laranjeiro-e-feijo', name_pt: 'União das Freguesias de Laranjeiro e Feijó',
        short_pt: 'Laranjeiro e Feijó, a zona oriental do concelho.',
        short_en: 'Laranjeiro and Feijó, the eastern side of the concelho.' },
    ],
  },
  {
    slug: 'seixal',
    name_pt: 'Seixal',
    short_pt: 'Concelho a sul do Tejo, conhecido pela baía do Seixal e pelas terras de Fernão Ferro.',
    short_en: 'A concelho south of the Tejo, known for the Seixal bay and the Fernão Ferro hinterland.',
    freguesias: [
      { slug: 'amora', name_pt: 'Amora',
        short_pt: 'A maior freguesia do Seixal, com Cruz de Pau e Paivas.',
        short_en: 'The largest freguesia of Seixal, taking in Cruz de Pau and Paivas.' },
      { slug: 'corroios', name_pt: 'Corroios',
        short_pt: 'Freguesia limítrofe de Almada, ligada por rio e linha do sul.',
        short_en: 'Bordering Almada, linked to Lisbon by ferry and rail.' },
      { slug: 'fernao-ferro', name_pt: 'Fernão Ferro',
        short_pt: 'Terras altas e pinhal, Belverde, Pinhal do General.',
        short_en: 'Highland and pinewood, including Belverde and Pinhal do General.' },
      { slug: 'seixal-arrentela-e-aldeia-de-paio-pires', name_pt: 'União das Freguesias de Seixal, Arrentela e Aldeia de Paio Pires',
        short_pt: 'A baía do Seixal e a sua orla industrial-histórica.',
        short_en: 'The Seixal bay and its industrial-historic waterfront.' },
    ],
  },
  {
    slug: 'sesimbra',
    name_pt: 'Sesimbra',
    short_pt: 'Concelho costeiro entre a Arrábida e o oceano, com vila piscatória e serra.',
    short_en: 'A coastal concelho between the Arrábida and the ocean, with a fishing town and a mountain range.',
    freguesias: [
      { slug: 'castelo', name_pt: 'Castelo',
        short_pt: 'A freguesia rural a norte, com Azóia e o Cabo Espichel.',
        short_en: 'The rural northern freguesia, taking in Azóia and Cabo Espichel.' },
      { slug: 'quinta-do-conde', name_pt: 'Quinta do Conde',
        short_pt: 'A freguesia mais populosa, terra plana junto à Brejos de Azeitão.',
        short_en: 'The most populous freguesia, flat ground next to the Brejos de Azeitão.' },
      { slug: 'sesimbra-santiago', name_pt: 'Sesimbra (Santiago)',
        short_pt: 'A vila de Sesimbra, porto de pesca e praia urbana.',
        short_en: 'The town of Sesimbra, fishing port and town beach.' },
    ],
  },
  {
    slug: 'setubal',
    name_pt: 'Setúbal',
    short_pt: 'Capital do distrito, à beira do Sado, entre a serra da Arrábida e a península de Tróia.',
    short_en: 'The district capital, beside the Sado estuary, between the Arrábida range and the Tróia peninsula.',
    freguesias: [
      { slug: 'azeitao', name_pt: 'União das Freguesias de Azeitão (São Lourenço e São Simão)',
        short_pt: 'Azeitão, a oeste do concelho, terra de quintas, vinho e queijo.',
        short_en: 'Azeitão, on the western edge of the concelho, country of quintas, wine and cheese.' },
      { slug: 'gambia-pontes-alto-da-guerra', name_pt: 'União das Freguesias de Gâmbia-Pontes-Alto da Guerra',
        short_pt: 'Faixa rural a leste de Setúbal, junto ao Sado.',
        short_en: 'Rural belt east of Setúbal, along the Sado.' },
      { slug: 'sao-sebastiao', name_pt: 'São Sebastião',
        short_pt: 'A freguesia mais populosa, zona urbana norte de Setúbal.',
        short_en: 'The most populous freguesia, northern urban Setúbal.' },
      { slug: 'setubal-nossa-senhora-da-anunciada', name_pt: 'Nossa Senhora da Anunciada',
        short_pt: 'O coração antigo de Setúbal e parte do centro histórico.',
        short_en: 'The old core of Setúbal and part of the historic centre.' },
      { slug: 'setubal-santa-maria-da-graca', name_pt: 'Santa Maria da Graça',
        short_pt: 'O centro de Setúbal a sul, a Praça do Bocage e o porto.',
        short_en: 'Central-south Setúbal, the Praça do Bocage and the port.' },
      { slug: 'setubal-sao-juliao', name_pt: 'São Julião',
        short_pt: 'Centro histórico de Setúbal, igreja matriz e Avenida Luísa Todi.',
        short_en: 'Setúbal historic centre, the parish church and Avenida Luísa Todi.' },
    ],
  },
  {
    slug: 'palmela',
    name_pt: 'Palmela',
    short_pt: 'Concelho com castelo medieval, planície da Marateca e vinhas da Arrábida.',
    short_en: 'A concelho with a medieval castle, the Marateca plain and the Arrábida vineyards.',
    freguesias: [
      { slug: 'palmela', name_pt: 'Palmela',
        short_pt: 'A vila do castelo e o seu termo agrícola.',
        short_en: 'The castle town and its agricultural hinterland.' },
      { slug: 'pinhal-novo', name_pt: 'Pinhal Novo',
        short_pt: 'A freguesia mais populosa, terra plana e ferroviária.',
        short_en: 'The most populous freguesia, flat ground and a rail town.' },
      { slug: 'poceirao-e-marateca', name_pt: 'União das Freguesias do Poceirão e Marateca',
        short_pt: 'Planície agrícola a leste, lezíria e vinha.',
        short_en: 'The agricultural plain to the east, lezíria and vineyard.' },
      { slug: 'quinta-do-anjo', name_pt: 'Quinta do Anjo',
        short_pt: 'Sopé da serra da Arrábida, com Brejos e Cabanas.',
        short_en: 'The foot of the Arrábida range, including Brejos and Cabanas.' },
    ],
  },
  {
    slug: 'barreiro',
    name_pt: 'Barreiro',
    short_pt: 'Concelho ribeirinho, antiga cidade industrial, terminal de ferry para o Terreiro do Paço.',
    short_en: 'A riverside concelho, a former industrial city, the ferry terminal for Terreiro do Paço.',
    freguesias: [
      { slug: 'alto-do-seixalinho-santo-andre-e-verderena', name_pt: 'União das Freguesias de Alto do Seixalinho, Santo André e Verderena',
        short_pt: 'Faixa central do Barreiro, da estação até Santo André.',
        short_en: 'The central belt of Barreiro, from the rail station to Santo André.' },
      { slug: 'barreiro-e-lavradio', name_pt: 'União das Freguesias do Barreiro e Lavradio',
        short_pt: 'O centro do Barreiro e o Lavradio, junto ao Tejo.',
        short_en: 'Central Barreiro and the Lavradio, along the Tejo.' },
      { slug: 'palhais-e-coina', name_pt: 'União das Freguesias de Palhais e Coina',
        short_pt: 'A faixa rural a sul do concelho.',
        short_en: 'The rural southern strip of the concelho.' },
      { slug: 'santo-antonio-da-charneca', name_pt: 'Santo António da Charneca',
        short_pt: 'A freguesia a sul do centro, com Quinta da Mina e Coina-a-Velha.',
        short_en: 'South of the centre, including Quinta da Mina and Coina-a-Velha.' },
    ],
  },
  {
    slug: 'moita',
    name_pt: 'Moita',
    short_pt: 'Concelho ribeirinho a leste do Barreiro, entre Tejo, salinas e moinhos de maré.',
    short_en: 'A riverside concelho east of Barreiro, between the Tejo, salt pans and tidal mills.',
    freguesias: [
      { slug: 'alhos-vedros', name_pt: 'Alhos Vedros',
        short_pt: 'Vila ribeirinha com porto histórico no Tejo.',
        short_en: 'A riverside town with a historic Tejo port.' },
      { slug: 'baixa-da-banheira-e-vale-da-amoreira', name_pt: 'União das Freguesias da Baixa da Banheira e Vale da Amoreira',
        short_pt: 'A faixa mais urbana do concelho, junto ao Barreiro.',
        short_en: 'The most urban belt of the concelho, beside Barreiro.' },
      { slug: 'gaio-rosario-e-sarilhos-pequenos', name_pt: 'União das Freguesias do Gaio-Rosário e Sarilhos Pequenos',
        short_pt: 'Aldeias ribeirinhas a sul do Tejo, junto à reserva natural.',
        short_en: 'River villages south of the Tejo, beside the nature reserve.' },
      { slug: 'moita', name_pt: 'Moita',
        short_pt: 'A vila sede do concelho, com porto e centro histórico.',
        short_en: 'The seat of the concelho, with a port and historic centre.' },
      { slug: 'sarilhos-grandes', name_pt: 'Sarilhos Grandes',
        short_pt: 'Vila a leste do concelho, perto da Lezíria.',
        short_en: 'A village on the east edge of the concelho, near the Lezíria.' },
    ],
  },
  {
    slug: 'montijo',
    name_pt: 'Montijo',
    short_pt: 'Concelho a leste, do Tejo às planícies do Alentejo, com Canha e Pegões em zona rural.',
    short_en: 'An eastern concelho running from the Tejo to the Alentejo plains, with rural Canha and Pegões.',
    freguesias: [
      { slug: 'afonsoeiro', name_pt: 'Afonsoeiro',
        short_pt: 'Freguesia urbana a sul da cidade de Montijo.',
        short_en: 'An urban freguesia south of Montijo town.' },
      { slug: 'atalaia-e-alto-estanqueiro-jardia', name_pt: 'União das Freguesias da Atalaia e Alto Estanqueiro-Jardia',
        short_pt: 'Freguesia rural a sul do concelho, vinha e olival.',
        short_en: 'A rural freguesia south of the concelho, vineyard and olive grove.' },
      { slug: 'canha', name_pt: 'Canha',
        short_pt: 'Vila rural a leste, planície e montado.',
        short_en: 'A rural village to the east, plain and montado.' },
      { slug: 'montijo-e-afonsoeiro', name_pt: 'União das Freguesias de Montijo e Afonsoeiro',
        short_pt: 'A cidade de Montijo, ribeirinha do Tejo.',
        short_en: 'Montijo town, on the Tejo waterfront.' },
      { slug: 'pegoes', name_pt: 'União das Freguesias de Santo Isidro de Pegões e Pegões',
        short_pt: 'Aldeias da Colónia Agrícola dos Pegões, fundadas no Estado Novo.',
        short_en: 'The Estado Novo agricultural-colony villages of Pegões.' },
    ],
  },
  {
    slug: 'alcochete',
    name_pt: 'Alcochete',
    short_pt: 'Concelho mais pequeno, na margem leste do Tejo, ponte Vasco da Gama e reserva do estuário.',
    short_en: 'The smallest concelho, on the east bank of the Tejo, the Vasco da Gama bridge and the estuary reserve.',
    freguesias: [
      { slug: 'alcochete', name_pt: 'Alcochete',
        short_pt: 'A vila e o seu termo ribeirinho.',
        short_en: 'The town and its riverside hinterland.' },
      { slug: 'samouco', name_pt: 'Samouco',
        short_pt: 'Aldeia a oeste, junto às salinas e ao estuário.',
        short_en: 'A village to the west, beside the salt pans and the estuary.' },
      { slug: 'sao-francisco', name_pt: 'São Francisco',
        short_pt: 'Aldeia ribeirinha do Tejo, com cais e salinas.',
        short_en: 'A Tejo-side village with a cais and salt pans.' },
    ],
  },
];

function escape(str) {
  return str.replace(/"/g, '\\"');
}

function concelhoFrontmatter(c) {
  return `---
level: concelho
name_pt: "${escape(c.name_pt)}"
pt:
  short_description: "${escape(c.short_pt)}"
  page_status: placeholder
en:
  short_description: "${escape(c.short_en)}"
  page_status: placeholder
last_updated: ${TODAY}
draft: false
---

Placeholder page for the concelho of ${c.name_pt}. Editorial content to come in Phase 1.
`;
}

function freguesiaFrontmatter(c, f) {
  return `---
level: freguesia
name_pt: "${escape(f.name_pt)}"
parent_slug: "${c.slug}"
pt:
  short_description: "${escape(f.short_pt)}"
  page_status: placeholder
en:
  short_description: "${escape(f.short_en)}"
  page_status: placeholder
last_updated: ${TODAY}
draft: false
---

Placeholder page for the freguesia of ${f.name_pt}, in the concelho of ${c.name_pt}.
`;
}

async function writeFileAt(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

let totalConcelhos = 0;
let totalFreguesias = 0;

for (const c of concelhos) {
  await writeFileAt(join(ROOT, `${c.slug}.md`), concelhoFrontmatter(c));
  totalConcelhos++;
  for (const f of c.freguesias) {
    await writeFileAt(join(ROOT, c.slug, `${f.slug}.md`), freguesiaFrontmatter(c, f));
    totalFreguesias++;
  }
}

console.log(`Seeded ${totalConcelhos} concelhos and ${totalFreguesias} freguesias.`);
