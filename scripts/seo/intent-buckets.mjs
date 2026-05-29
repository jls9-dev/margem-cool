// Rule-based mapping from a user-intent question to its canonical place-page
// section slot. Operates on the text of NW topic-matrix questions and PAA.
//
// Each rule is { slot, patterns: [...regexp] }. First match wins. Falls back
// to "Other" if nothing matches. Patterns are case-insensitive; cover both
// Portuguese and English wording so the same rules apply to PT and EN briefs.

// Short single words need \b boundaries to avoid substring collisions
// (e.g. "car" inside "ficar", "bus" inside "busca").
const RULES = [
  {
    slot: 'Getting there',
    patterns: [
      /\bbarco\b|\bferry\b|cacilheiro|transtejo/i,
      /\bchegar\b|como ir\b|how to get|\breach\b|\baccess\b/i,
      /transporte|public transport|\bpúblico\b/i,
      /\bcarro\b|\bcar\b|\bdrive\b|de comboio|\btrain\b|\bbus\b|autocarro/i,
      /horário|timetable|\bschedule\b/i,
      /\bviagem\b|\bjourney\b|trip duration|tempo demora/i,
    ],
  },
  {
    slot: 'Eat & drink',
    patterns: [
      /\bcomer\b|\beat\b|\bfood\b|restaurant|restaurante|\btasca\b/i,
      /\bbeber\b|\bdrink\b|\bwine\b|\bvinho\b/i,
      /marisqueira|\bmarisco\b|\bpeixe\b|\bfish\b|seafood/i,
      /pastelaria|padaria|\bcafé\b|\bcafe\b|cafetaria/i,
      /onde comer|where to eat|where to drink/i,
    ],
  },
  {
    slot: 'Where to stay',
    patterns: [
      /\bficar\b|\bstay\b|\bdormir\b|\bhotel\b|\bhostel\b|alojamento/i,
      /onde ficar|where to stay/i,
    ],
  },
  {
    slot: 'What to see & do',
    patterns: [
      /o que fazer|what to do|things to do|coisas para fazer/i,
      /visitar|\bvisit\b|sightseeing|pontos turísticos|attractions/i,
      /caminhada|\bwalk\b|walking|\bhike\b|hiking|\btrail\b|\btrilho\b/i,
      /miradouro|viewpoint|\bmirador\b/i,
      /\bpraia\b|\bbeach\b/i,
      /\bmuseu\b|\bmuseum\b|monumento|\bmonument\b/i,
    ],
  },
  {
    slot: 'What & where',
    patterns: [
      /significa|\bmeaning\b|what is|what does|o que é/i,
      /onde fica|where is/i,
      /qual concelho|que freguesia|de que freguesia|de que concelho/i,
      /which município|which concelho/i,
    ],
  },
  {
    slot: 'History',
    patterns: [
      /história|\bhistory\b/i,
      /quantos anos|how old|\bidade\b|founded|founding/i,
      /origem|\borigin\b|antiga|antigo/i,
      /\broman\b|romano|reconquista|terramoto|\b1755\b|século/i,
    ],
  },
  {
    slot: 'Living here',
    patterns: [
      /\bviver\b|\blive\b|living|moradores/i,
      /residencial|residential|neighbourhood|\bbairro\b/i,
      /\bescola\b|\bschool\b|\bsaúde\b|healthcare/i,
      /\bvida\b|daily life|life in/i,
    ],
  },
  {
    slot: 'Practical',
    patterns: [
      /estacionamento|parking|\bpark\b/i,
      /\bpreço\b|\bprice\b|\bcost\b|\bcusto\b|tarifa|\bfare\b/i,
      /melhor altura|best time|when to go/i,
      /horário de abertura|opening hours/i,
      /reservar|\bbook\b|booking/i,
      /\bpago\b|\bfree\b|gratuito/i,
      /acessibilidade|accessible|wheelchair/i,
    ],
  },
  {
    slot: 'Festas & calendar',
    patterns: [
      /\bfesta\b|festival|romaria|procissão/i,
      /\bfeira\b|\bfair\b|\bmarket\b/i,
      /\bevent\b|evento|calendário/i,
      /\bannual\b|\banual\b/i,
    ],
  },
  {
    slot: 'Nearby',
    patterns: [
      /\bperto\b|\bnear\b|nearby|próximo|adjacent/i,
      /bairros|neighbouring|adjacent freguesias/i,
      /around|surrounding|arredores/i,
    ],
  },
];

export function bucketIntent(text) {
  if (!text || typeof text !== 'string') return 'Other';
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      if (re.test(text)) return rule.slot;
    }
  }
  return 'Other';
}

// Slot display order for the brief — practical/actionable first, then
// informational, then meta. Matches how readers actually consume place pages.
export const SLOT_ORDER = [
  'Getting there',
  'What & where',
  'What to see & do',
  'Eat & drink',
  'Where to stay',
  'Living here',
  'Festas & calendar',
  'Practical',
  'History',
  'Nearby',
  'Other',
];
