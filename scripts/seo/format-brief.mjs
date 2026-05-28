// Format a NeuronWriter query response into the 4-block brief James uses.
// Format is per `feedback_neuronwriter_format.md` in the global memory:
//   Block 1 — Basic terms (must appear, vocabulary coverage)
//   Block 2 — Key terms with usage counts (frequency targets)
//   Block 3 — H1 headings (top competitors)
//   Block 4 — H2/H3 headings (top competitors)
// Plus competitor list and raw response for inspection.

export function formatBrief({ keyword, language, engine, queryId, queryUrl, data }) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# NeuronWriter brief — "${keyword}" (${language})`);
  lines.push('');
  lines.push(`- **Generated**: ${today}`);
  lines.push(`- **Engine**: ${engine}`);
  lines.push(`- **Language**: ${language}`);
  lines.push(`- **Query ID**: ${queryId}`);
  if (queryUrl) lines.push(`- **Query URL**: ${queryUrl}`);
  lines.push('');

  // --- Block 1 — Basic terms ---
  const basic = pickBasicTerms(data);
  lines.push('## Block 1 — Basic terms (must appear)');
  lines.push('');
  lines.push('Topical vocabulary the page should cover. Weave naturally into body copy.');
  lines.push('');
  if (basic.length === 0) {
    lines.push('_(no basic terms returned)_');
  } else {
    lines.push(basic.join(', '));
  }
  lines.push('');

  // --- Block 2 — Key terms with counts ---
  const keyTerms = pickKeyTerms(data);
  lines.push('## Block 2 — Key terms with usage counts');
  lines.push('');
  lines.push('Frequency targets. Hit each in the range shown. Don\'t over-stuff — NW penalises unnatural density.');
  lines.push('');
  if (keyTerms.length === 0) {
    lines.push('_(no key-term counts returned)_');
  } else {
    for (const t of keyTerms) {
      const range = t.usage_min != null && t.usage_max != null
        ? `${t.usage_min}-${t.usage_max}x`
        : (t.usage != null ? `${t.usage}x` : '');
      lines.push(`- **${t.term}**${range ? ` — ${range}` : ''}`);
    }
  }
  lines.push('');

  // --- Block 3 — H1 headings ---
  const h1s = pickHeadings(data, 'h1');
  lines.push('## Block 3 — H1 headings (top competitors)');
  lines.push('');
  lines.push('Pick one H1 that naturally incorporates the primary keyword + 1-2 supporting terms.');
  lines.push('');
  if (h1s.length === 0) {
    lines.push('_(no H1 data returned)_');
  } else {
    for (const h of h1s) lines.push(`- ${h}`);
  }
  lines.push('');

  // --- Block 4 — H2/H3 headings ---
  const h2h3 = [...pickHeadings(data, 'h2'), ...pickHeadings(data, 'h3')];
  lines.push('## Block 4 — H2 and H3 headings (top competitors)');
  lines.push('');
  lines.push('Use as the skeleton for the page\'s section structure. Adapt for our tone and brand — don\'t copy verbatim.');
  lines.push('');
  if (h2h3.length === 0) {
    lines.push('_(no H2/H3 data returned)_');
  } else {
    for (const h of h2h3) lines.push(`- ${h}`);
  }
  lines.push('');

  // --- Competitors ---
  const competitors = pickCompetitors(data);
  lines.push('## Competitor pages');
  lines.push('');
  if (competitors.length === 0) {
    lines.push('_(no competitor list returned)_');
  } else {
    for (const c of competitors) {
      const url = c.url || c.link || '';
      const title = c.title || '';
      lines.push(`- ${title ? `**${title}** — ` : ''}${url}`);
    }
  }
  lines.push('');

  // --- Metrics (if present) ---
  if (data.metrics && typeof data.metrics === 'object') {
    lines.push('## Metrics');
    lines.push('');
    for (const [k, v] of Object.entries(data.metrics)) {
      lines.push(`- **${k}**: ${formatValue(v)}`);
    }
    lines.push('');
  }

  // --- Notes ---
  lines.push('## Notes for the writer');
  lines.push('');
  lines.push('Cross-check the key terms against Ubersuggest for real search volume. Drop weird terms.');
  lines.push('Add any high-volume terms NW missed. NeuronWriter is one input, not gospel.');
  lines.push('Before drafting copy: re-read `docs/brand.md` §4 (voice principles, banned vocabulary).');
  lines.push('');

  return lines.join('\n');
}

function pickBasicTerms(data) {
  if (Array.isArray(data.terms_txt)) return data.terms_txt;
  if (typeof data.terms_txt === 'string') {
    return data.terms_txt.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }
  if (data.terms && Array.isArray(data.terms.basic)) {
    return data.terms.basic.map(t => typeof t === 'string' ? t : t.term).filter(Boolean);
  }
  return [];
}

function pickKeyTerms(data) {
  // NW shape varies; check common locations
  const sources = [
    data.terms?.key,
    data.terms?.suggested,
    data.terms?.extended,
    data.key_terms,
  ];
  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) {
      return src.map(t => ({
        term: t.term || t.keyword || t.text || String(t),
        usage_min: t.usage_min ?? t.min,
        usage_max: t.usage_max ?? t.max,
        usage: t.usage,
      })).filter(t => t.term);
    }
  }
  return [];
}

function pickHeadings(data, level) {
  // Try several common shapes
  if (data.ideas && Array.isArray(data.ideas[level + 's'])) {
    return data.ideas[level + 's'].filter(Boolean);
  }
  if (data.ideas && Array.isArray(data.ideas[level])) {
    return data.ideas[level].filter(Boolean);
  }
  if (data[level + 's'] && Array.isArray(data[level + 's'])) {
    return data[level + 's'].filter(Boolean);
  }
  // Pull from competitors if structured
  if (Array.isArray(data.competitors)) {
    const headings = [];
    for (const c of data.competitors) {
      const list = c[level + 's'] || c[level] || [];
      if (Array.isArray(list)) headings.push(...list);
    }
    return headings.filter(Boolean);
  }
  return [];
}

function pickCompetitors(data) {
  if (Array.isArray(data.competitors)) {
    return data.competitors.map(c => ({
      title: c.title,
      url: c.url || c.link,
    }));
  }
  return [];
}

function formatValue(v) {
  if (v == null) return '_n/a_';
  if (typeof v === 'object') return '```\n' + JSON.stringify(v, null, 2) + '\n```';
  return String(v);
}
