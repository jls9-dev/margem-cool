// Domain-based and content-based noise filters for NeuronWriter outputs.
//
// SERP results for place queries are dominated by:
//   - Hotel/booking aggregators (Agoda, Expedia, Booking, Hotels.com, GetYourGuide)
//   - Public-transport timetable pages (Transtejo, Moovit, CP, Comboios)
//   - Social-media tag aggregations (Instagram, Facebook tags, Pinterest)
//   - Generic tourism aggregators (TripAdvisor, hoodpicker, Visit Lisboa)
//   - James's own LP/SBRE pages (which we don't compete against ourselves)
//   - News tickers and unrelated pages that happened to rank
//
// We surface the 2-3 actual guide-style competitors and hide the rest.

const NOISE_DOMAINS = [
  // Booking / accommodation aggregators
  /\bagoda\b/i,
  /\bbooking\.com\b/i,
  /\bexpedia\b/i,
  /\bhotels\.com\b/i,
  /\btrivago\b/i,
  /\bhostelworld\b/i,
  /\bairbnb\b/i,
  /\bvrbo\b/i,
  // Activity / tour aggregators
  /\bgetyourguide\b/i,
  /\bviator\b/i,
  /\bcivitatis\b/i,
  /\btripadvisor\b/i,
  /\bklook\b/i,
  // Transport timetables
  /\bttsl\.pt\b/i,
  /\bmoovitapp\b/i,
  /\bcp\.pt\b/i,
  /\bcomboios\b/i,
  /\bcarrismetropolitana\b/i,
  // Social media tag pages
  /\binstagram\b/i,
  /\bfacebook\b/i,
  /\byoutube\b/i,
  /\btiktok\b/i,
  /\bpinterest\b/i,
  // Generic / clone-style aggregators
  /\bhoodpicker\b/i,
  /\bferiasemportugal\b/i,
  /\brome2rio\b/i,
  /\blisbonportugaltourism\b/i,
  /\bcultuga\b/i,
  // Our own ecosystem
  /\bsouthbank\.pt\b/i,
  /\blisbonproperty\.pt\b/i,
  /\bmargemcool\.(pt|com)\b/i,
  /\bfrigilianaguide\b/i,
  /\bspandera\b/i,
  // Wikipedia and Wikipedia clones — kept as reference but not "competitor"
  /\bwikipedia\.org\b/i,
];

// Some domains are useful guides we want to keep. Whitelist beats noise list.
const USEFUL_DOMAINS = [
  /\btimeout\b/i,
  /\bmensagem\b/i,
  /\bpublico\.pt\b/i,
  /\bobservador\b/i,
  /\bvisao\b/i,
  /\bntv-magazine\b/i,
  /\bnit\.pt\b/i,
  /\bvortexmag\b/i,
  /\blisboasecreta\b/i,
  /\bbarlaventeenred\b/i,
];

export function isNoiseCompetitor(url) {
  if (!url || typeof url !== 'string') return false;
  if (USEFUL_DOMAINS.some(re => re.test(url))) return false;
  return NOISE_DOMAINS.some(re => re.test(url));
}

// Returns one of: 'useful' | 'reference' | 'noise'
// - useful: a real guide-style competitor worth reading
// - reference: Wikipedia and similar — useful for facts, not voice
// - noise: aggregators, timetables, social media, our own properties
export function classifyCompetitor(competitor) {
  const url = competitor?.url ?? '';
  if (!url) return 'noise';
  if (/\bwikipedia\.org\b/i.test(url)) return 'reference';
  if (USEFUL_DOMAINS.some(re => re.test(url))) return 'useful';
  if (NOISE_DOMAINS.some(re => re.test(url))) return 'noise';
  // Default: treat unknown domains as useful (better to show than hide). The
  // reader can quickly decide.
  return 'useful';
}

// Term-level noise predicate. Drops single-character terms, pure numbers,
// markup-leaks, common stopwords-only entries.
export function isNoiseTerm(term) {
  if (!term || typeof term !== 'string') return true;
  const t = term.trim();
  if (t.length < 2) return true;
  if (/^\d+([.,]\d+)?$/.test(t)) return true;             // pure number
  if (/^\d+%$/.test(t)) return true;                       // percentage
  if (/[{};=()<>]/.test(t)) return true;                   // code leak
  if (/^(if|window|undefined|null|function|return|var|let|const)$/i.test(t)) return true;
  return false;
}
