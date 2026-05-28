// Format a NeuronWriter query response into the 4-block brief James uses,
// plus People-Also-Ask, topic-importance matrix and competitor benchmarks.
//
// Actual NW response shape (confirmed against cacilhas-pt query 2026-05-28):
//   terms.content_basic[]:    { t, usage_pc, sugg_usage: [min, max] }
//   terms.content_extended[]: same shape, broader keyword set
//   terms.h1[], terms.h2[]:   { t, usage_pc } — keyword terms used in competitor headings
//   competitors[].headers:    [[level, text], …] — actual heading texts in order
//   competitors[]:            { rank, url, title, content_score, readability, word_count, ... }
//   ideas.people_also_ask[]:  { q }
//   ideas.suggest_questions[]: { q }
//   ideas.topic_matrix:       { "question": { importance } }
//   metrics.word_count:       { median, target }

export function formatBrief({ keyword, language, engine, queryId, queryUrl, data }) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# NeuronWriter brief — "${keyword}" (${language})`);
  lines.push('');
  lines.push(`- **Generated**: ${today}`);
  lines.push(`- **Engine**: ${engine}`);
  lines.push(`- **Language**: ${language}`);
  lines.push(`- **Query ID**: ${queryId}`);
  if (queryUrl) lines.push(`- **NW URL**: ${queryUrl}`);
  if (data.metrics?.word_count?.target) {
    lines.push(`- **Target word count**: ${data.metrics.word_count.target} (median across competitors)`);
  }
  lines.push('');

  // --- Block 1 — Basic terms ---
  const basic = data.terms?.content_basic ?? [];
  lines.push('## Block 1 — Basic terms (must appear)');
  lines.push('');
  lines.push('Core topical vocabulary. Each term has a suggested usage range; hit it.');
  lines.push('');
  if (basic.length === 0) {
    lines.push('_(no basic terms returned)_');
  } else {
    for (const t of basic) {
      const range = t.sugg_usage ? `${t.sugg_usage[0]}–${t.sugg_usage[1]}×` : '';
      const coverage = t.usage_pc != null ? ` _(in ${t.usage_pc}% of top results)_` : '';
      lines.push(`- **${t.t}**${range ? ` — ${range}` : ''}${coverage}`);
    }
  }
  lines.push('');

  // --- Block 2 — Extended key terms ---
  const extended = data.terms?.content_extended ?? [];
  lines.push('## Block 2 — Extended key terms (broader vocabulary)');
  lines.push('');
  lines.push('Wider topical set. Cover what fits naturally — over-stuffing penalises the score.');
  lines.push('');
  if (extended.length === 0) {
    lines.push('_(no extended terms returned)_');
  } else {
    for (const t of extended) {
      const range = t.sugg_usage ? `${t.sugg_usage[0]}–${t.sugg_usage[1]}×` : '';
      const coverage = t.usage_pc != null ? ` _(${t.usage_pc}%)_` : '';
      lines.push(`- **${t.t}**${range ? ` — ${range}` : ''}${coverage}`);
    }
  }
  lines.push('');

  // --- Block 3 — H1 headings (actual texts from competitors) ---
  const h1Texts = collectHeadingTexts(data, 'h1');
  lines.push('## Block 3 — H1 headings (top competitors, actual texts)');
  lines.push('');
  lines.push('Pick one H1 that fits brand voice and covers the primary keyword + 1–2 supporting terms.');
  lines.push('');
  if (h1Texts.length === 0) {
    lines.push('_(no H1 texts in competitor data)_');
  } else {
    for (const h of h1Texts) lines.push(`- ${h}`);
  }
  lines.push('');

  // --- Block 4 — H2/H3 headings (actual texts from competitors) ---
  const h2Texts = collectHeadingTexts(data, 'h2');
  const h3Texts = collectHeadingTexts(data, 'h3');
  lines.push('## Block 4 — H2 / H3 headings (top competitors, actual texts)');
  lines.push('');
  lines.push('Use as the skeleton for section structure. Adapt for brand voice — don\'t copy verbatim.');
  lines.push('');
  if (h2Texts.length === 0 && h3Texts.length === 0) {
    lines.push('_(no H2/H3 texts in competitor data)_');
  } else {
    if (h2Texts.length > 0) {
      lines.push('### H2 (most common across competitors)');
      lines.push('');
      for (const h of h2Texts) lines.push(`- ${h}`);
      lines.push('');
    }
    if (h3Texts.length > 0) {
      lines.push('### H3');
      lines.push('');
      for (const h of h3Texts) lines.push(`- ${h}`);
    }
  }
  lines.push('');

  // --- Heading-keyword targets (helps when writing the skeleton) ---
  if (data.terms?.h1?.length || data.terms?.h2?.length) {
    lines.push('## Heading keyword targets');
    lines.push('');
    lines.push('Words competitors put in their H1/H2. Useful when titling sections.');
    lines.push('');
    if (data.terms.h1?.length > 0) {
      lines.push('### In H1 across competitors');
      lines.push('');
      for (const t of data.terms.h1) {
        lines.push(`- **${t.t}** _(${t.usage_pc}% of competitors)_`);
      }
      lines.push('');
    }
    if (data.terms.h2?.length > 0) {
      lines.push('### In H2 across competitors');
      lines.push('');
      for (const t of data.terms.h2) {
        lines.push(`- **${t.t}** _(${t.usage_pc}%)_`);
      }
      lines.push('');
    }
  }

  // --- People Also Ask + Suggest questions ---
  const paa = data.ideas?.people_also_ask ?? [];
  const sugg = data.ideas?.suggest_questions ?? [];
  if (paa.length > 0 || sugg.length > 0) {
    lines.push('## User questions — answer these in the page');
    lines.push('');
    if (paa.length > 0) {
      lines.push('### People Also Ask (from Google SERP)');
      lines.push('');
      for (const q of paa) lines.push(`- ${q.q}`);
      lines.push('');
    }
    if (sugg.length > 0) {
      lines.push('### Search suggestions');
      lines.push('');
      for (const q of sugg) lines.push(`- ${q.q}`);
      lines.push('');
    }
  }

  // --- Topic matrix (importance-ranked subjects) ---
  if (data.ideas?.topic_matrix && Object.keys(data.ideas.topic_matrix).length > 0) {
    const entries = Object.entries(data.ideas.topic_matrix)
      .map(([topic, meta]) => ({ topic, importance: meta?.importance ?? 0 }))
      .sort((a, b) => b.importance - a.importance);
    lines.push('## Topic importance (NW ranking)');
    lines.push('');
    lines.push('Topics competitors converge on, ranked by importance. The top items must be covered.');
    lines.push('');
    for (const e of entries) {
      lines.push(`- **${e.importance}/10** — ${e.topic}`);
    }
    lines.push('');
  }

  // --- Title & description term hints ---
  if (data.terms?.title?.length || data.terms?.desc?.length) {
    lines.push('## Meta tag term hints');
    lines.push('');
    if (data.terms.title?.length > 0) {
      lines.push('### Words to consider in the page <title>');
      lines.push('');
      for (const t of data.terms.title) {
        lines.push(`- **${t.t}** _(${t.usage_pc}%)_`);
      }
      lines.push('');
    }
    if (data.terms.desc?.length > 0) {
      lines.push('### Words to consider in the meta description');
      lines.push('');
      for (const t of data.terms.desc) {
        lines.push(`- **${t.t}** _(${t.usage_pc}%)_`);
      }
      lines.push('');
    }
  }

  // --- Competitor benchmarks ---
  const competitors = data.competitors ?? [];
  if (competitors.length > 0) {
    lines.push('## Top competitors');
    lines.push('');
    lines.push('| Rank | Word count | Score | URL |');
    lines.push('|------|------------|-------|-----|');
    for (const c of competitors.slice(0, 15)) {
      const wc = c.word_count ?? '?';
      const score = c.content_score ?? '?';
      const url = c.url ?? '';
      const title = (c.title ?? '').replace(/\|/g, '\\|').slice(0, 80);
      lines.push(`| ${c.rank ?? '?'} | ${wc} | ${score} | [${title}](${url}) |`);
    }
    lines.push('');
  }

  // --- Notes ---
  lines.push('## Notes for the writer');
  lines.push('');
  lines.push('- Cross-check key terms against Ubersuggest for real volume. Drop weird ones. Add ones NW missed.');
  lines.push('- NeuronWriter is one input, not gospel (`feedback_neuronwriter_not_gospel.md`).');
  lines.push('- Before drafting copy: re-read `docs/brand.md` §4 (voice principles, banned vocabulary).');
  lines.push('- After writing, score the page back via: `npm run seo -- score ' + queryId + ' --html <built file>`');
  lines.push('');

  return lines.join('\n');
}

function collectHeadingTexts(data, level) {
  const seen = new Map(); // text → count across competitors
  const competitors = data.competitors ?? [];
  for (const c of competitors) {
    const headers = c.headers ?? [];
    for (const h of headers) {
      if (Array.isArray(h) && h[0] === level && h[1]) {
        const text = String(h[1]).trim();
        if (text) seen.set(text, (seen.get(text) ?? 0) + 1);
      }
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([text, count]) => count > 1 ? `${text} _(seen in ${count} competitors)_` : text)
    .slice(0, 30);
}
