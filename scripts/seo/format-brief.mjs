// Brief formatter v2 — produces a drafting-ready document, not a research dump.
// Spec: docs/processes/brief-format.md
//
// Surfaces signal first (user intent bucketed by section), filters noise
// automatically (aggregator domains, one-off terms, heading-text dumps),
// drops misleading framings ("target word count"). The reader (or automated
// drafter) should be able to write the page directly from this brief without
// going back to the raw NW JSON.

import { bucketIntent, SLOT_ORDER } from './intent-buckets.mjs';
import { classifyCompetitor, isNoiseTerm } from './noise-filter.mjs';

export function formatBrief({ keyword, language, engine, queryId, queryUrl, data }) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];

  // --- Header ---
  lines.push(`# NeuronWriter brief — "${keyword}" (${language})`);
  lines.push('');
  lines.push(`- **Generated**: ${today}`);
  lines.push(`- **Engine**: ${engine}`);
  lines.push(`- **Language**: ${language}`);
  lines.push(`- **Query ID**: ${queryId}`);
  if (queryUrl) lines.push(`- **NW URL**: ${queryUrl}`);
  if (data.metrics?.word_count?.median) {
    lines.push(`- **Median competitor word count**: ${data.metrics.word_count.median} (treat as floor, not target)`);
  }
  lines.push('');
  lines.push(`> This brief is one input, not gospel. Length follows subject demand. Aim to be by far the most useful resource on the subject — better than anything that exists. Before drafting copy, re-read [\`docs/standards/brand.md\`](../standards/brand.md) §4.`);
  lines.push('');

  // --- 1. User intent (page skeleton) ---
  const intents = collectIntents(data);
  lines.push('## 1. User intent — what users actually want to know');
  lines.push('');
  if (intents.length === 0) {
    lines.push('_(no intent data returned)_');
  } else {
    lines.push('| Importance | Question / intent | Section slot |');
    lines.push('|------------|-------------------|--------------|');
    for (const it of intents) {
      const imp = it.importance != null ? `${it.importance}/10` : '—';
      lines.push(`| ${imp} | ${it.text} | ${it.slot} |`);
    }
    lines.push('');
    // Grouped view by slot — easier to use as outlining tool
    lines.push('### Intents grouped by section');
    lines.push('');
    const bySlot = groupBySlot(intents);
    for (const slot of SLOT_ORDER) {
      const items = bySlot[slot];
      if (!items || items.length === 0) continue;
      lines.push(`**${slot}**`);
      for (const it of items) {
        const imp = it.importance != null ? ` _(${it.importance}/10)_` : '';
        lines.push(`- ${it.text}${imp}`);
      }
      lines.push('');
    }
  }

  // --- 2. Topical vocabulary ---
  const basic = (data.terms?.content_basic ?? []).filter(t => !isNoiseTerm(t.t));
  const extended = filterExtendedTerms(data.terms?.content_extended ?? []);
  lines.push('## 2. Topical vocabulary');
  lines.push('');
  lines.push('### Must cover — basic terms');
  lines.push('');
  if (basic.length === 0) {
    lines.push('_(no basic terms returned)_');
  } else {
    for (const t of basic) {
      const range = t.sugg_usage ? `${t.sugg_usage[0]}–${t.sugg_usage[1]}×` : '';
      const coverage = t.usage_pc != null ? ` _(${t.usage_pc}% of top results)_` : '';
      lines.push(`- **${t.t}**${range ? ` — ${range}` : ''}${coverage}`);
    }
  }
  lines.push('');
  lines.push('### Worth covering — extended terms (filtered)');
  lines.push('');
  if (extended.length === 0) {
    lines.push('_(no extended terms passed the filter)_');
  } else {
    for (const t of extended) {
      const range = t.sugg_usage ? `${t.sugg_usage[0]}–${t.sugg_usage[1]}×` : '';
      const coverage = t.usage_pc != null ? ` _(${t.usage_pc}%)_` : '';
      lines.push(`- **${t.t}**${range ? ` — ${range}` : ''}${coverage}`);
    }
  }
  lines.push('');

  // --- 3. Suitable competitors ---
  const classified = (data.competitors ?? []).map(c => ({
    ...c,
    class: classifyCompetitor(c),
  }));
  const useful = classified.filter(c => c.class === 'useful');
  const reference = classified.filter(c => c.class === 'reference');
  const noise = classified.filter(c => c.class === 'noise');

  lines.push('## 3. Competitors worth reading');
  lines.push('');
  if (useful.length === 0 && reference.length === 0) {
    lines.push('_(no suitable competitors found in the SERP — check the raw block below)_');
  } else {
    lines.push('| Source | Words | NW score | URL |');
    lines.push('|--------|-------|----------|-----|');
    for (const c of useful.slice(0, 10)) {
      const title = (c.title ?? '').replace(/\|/g, '\\|').slice(0, 80);
      lines.push(`| ${title || '(no title)'} | ${c.word_count ?? '?'} | ${c.content_score ?? '?'} | ${c.url} |`);
    }
    if (reference.length > 0) {
      lines.push('');
      lines.push('**Reference (facts, not voice):**');
      lines.push('');
      for (const c of reference.slice(0, 5)) {
        const title = (c.title ?? '').replace(/\|/g, '\\|').slice(0, 80);
        lines.push(`- ${title || '(no title)'} — ${c.url}`);
      }
    }
  }
  lines.push('');

  if (noise.length > 0) {
    lines.push('<details>');
    lines.push('<summary>Raw SERP, classified as noise (' + noise.length + ' — not for benchmarking)</summary>');
    lines.push('');
    for (const c of noise) {
      const title = (c.title ?? '').replace(/\|/g, '\\|').slice(0, 80);
      lines.push(`- ${title || '(no title)'} — ${c.url}`);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  // --- 4. Meta tag word suggestions ---
  const titleTerms = (data.terms?.title ?? []).filter(t => !isNoiseTerm(t.t));
  const descTerms = (data.terms?.desc ?? []).filter(t => !isNoiseTerm(t.t));
  if (titleTerms.length > 0 || descTerms.length > 0) {
    lines.push('## 4. Meta tag word suggestions');
    lines.push('');
    if (titleTerms.length > 0) {
      lines.push('### Page `<title>`');
      lines.push('');
      for (const t of titleTerms.slice(0, 12)) {
        lines.push(`- **${t.t}** _(${t.usage_pc}%)_`);
      }
      lines.push('');
    }
    if (descTerms.length > 0) {
      lines.push('### Meta description');
      lines.push('');
      for (const t of descTerms.slice(0, 12)) {
        lines.push(`- **${t.t}** _(${t.usage_pc}%)_`);
      }
      lines.push('');
    }
  }

  // --- 5. What this brief excluded ---
  lines.push('## 5. What this brief excluded');
  lines.push('');
  lines.push('Excluded as noise per [`docs/processes/brief-format.md`](brief-format.md):');
  lines.push('');
  lines.push(`- Competitor H1/H2/H3 text dumps (90% noise; signal carried by sections 1 and 3)`);
  lines.push(`- Word-count median treated as a *target* (shown above as a *floor* only)`);
  lines.push(`- One-off terms with no semantic value (single chars, raw numbers, code leaks)`);
  if (noise.length > 0) {
    lines.push(`- ${noise.length} raw SERP entries from aggregator / timetable / social-media / our-own-properties (see collapsible block above)`);
  }
  lines.push('');
  lines.push('If you need any of this, see `seo/briefs/*.raw.json`.');
  lines.push('');

  // --- 6. Writer notes ---
  lines.push('## 6. Writer notes');
  lines.push('');
  lines.push(`- This brief is one input, not gospel — see \`feedback_neuronwriter_use_judiciously.md\` in the global memory.`);
  lines.push(`- Length follows subject demand. The median is a floor, never a target.`);
  lines.push(`- Before drafting: re-read [\`docs/standards/brand.md\`](../standards/brand.md) §4 (voice, *tu* register, banned vocabulary).`);
  lines.push(`- After writing, score the page back via: \`npm run seo -- score ${queryId} --html <built file>\``);
  lines.push('');

  return lines.join('\n');
}

function collectIntents(data) {
  const items = [];

  // From topic_matrix — has importance scores
  if (data.ideas?.topic_matrix && typeof data.ideas.topic_matrix === 'object') {
    for (const [text, meta] of Object.entries(data.ideas.topic_matrix)) {
      items.push({
        text,
        importance: meta?.importance ?? null,
        slot: bucketIntent(text),
      });
    }
  }

  // From PAA — no importance score, default to 7 if not already present
  const seen = new Set(items.map(i => i.text));
  for (const paa of data.ideas?.people_also_ask ?? []) {
    if (!paa.q || seen.has(paa.q)) continue;
    items.push({
      text: paa.q,
      importance: null,
      slot: bucketIntent(paa.q),
    });
  }

  // From suggest_questions — same treatment as PAA
  for (const sq of data.ideas?.suggest_questions ?? []) {
    if (!sq.q || seen.has(sq.q)) continue;
    items.push({
      text: sq.q,
      importance: null,
      slot: bucketIntent(sq.q),
    });
  }

  // Sort by importance desc (nulls last), then by slot order
  items.sort((a, b) => {
    if (a.importance != null && b.importance != null) return b.importance - a.importance;
    if (a.importance != null) return -1;
    if (b.importance != null) return 1;
    return SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot);
  });

  return items;
}

function groupBySlot(intents) {
  const out = {};
  for (const it of intents) {
    if (!out[it.slot]) out[it.slot] = [];
    out[it.slot].push(it);
  }
  return out;
}

function filterExtendedTerms(extended) {
  if (!Array.isArray(extended)) return [];
  return extended
    .filter(t => !isNoiseTerm(t.t))
    // Keep top 20 by usage_pc, then any with usage_pc >= 22
    .sort((a, b) => (b.usage_pc ?? 0) - (a.usage_pc ?? 0))
    .filter((t, i) => i < 20 || (t.usage_pc ?? 0) >= 22)
    .slice(0, 40);
}
