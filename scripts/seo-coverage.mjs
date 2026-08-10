#!/usr/bin/env node
/**
 * Does each published page answer the queries it should?
 *
 *   npm run seo:coverage           # every published page
 *   npm run seo:coverage -- --gaps # only what is failing
 *
 * Takes the keyword targets, works out which belong to each published page by
 * the place it covers, and checks whether the page actually says the words.
 * A page about Setúbal that never uses the word "restaurantes" is not covering
 * Setúbal's biggest query, however good the prose is.
 *
 * This exists because the nine concelho pages were written from the region's
 * demand totals and the cached geo figures, without pulling the per-place
 * terms first — and it turned out that "onde comer" is the top themed query
 * for eight of the nine, and not one of those pages had a restaurant section.
 * Eyeballing that is exactly how it was missed; measuring it is cheap.
 *
 * It measures term coverage only. It cannot tell you whether the answer is any
 * good, and a page that mentions every term while saying nothing useful scores
 * perfectly. Use it to find holes, never as a target to fill.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TARGETS = JSON.parse(readFileSync(join(ROOT, 'src/data/keyword-targets.json'), 'utf8')).targets;
const gapsOnly = process.argv.includes('--gaps');

const MIN_VOLUME = 200;

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function filesIn(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesIn(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Everything a page says, frontmatter values included — components count. */
function pageText(data, body) {
  const parts = [body];
  const walk = (v) => {
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(data);
  return strip(parts.join(' '));
}

const pages = [];
for (const dir of ['src/content/places', 'src/content/articles']) {
  for (const file of filesIn(join(ROOT, dir))) {
    const raw = readFileSync(file, 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);
    if (!m) continue;
    const data = yaml.load(m[1]);
    const isPlace = dir.endsWith('places');

    // Only judge pages that are actually published.
    const langs = isPlace
      ? ['pt', 'en'].filter((l) => data?.[l]?.page_status && data[l].page_status !== 'placeholder')
      : (data?.draft ? [] : [data.language]);
    if (langs.length === 0) continue;
    if (!langs.includes('pt')) continue;   // targets are Portuguese

    const slug = relative(join(ROOT, dir), file).split(sep).join('/').replace(/\.md$/, '');
    const name = isPlace ? data.name_pt : data.title;
    pages.push({
      name,
      slug,
      kind: isPlace ? 'place' : 'guide',
      subject: strip(isPlace ? data.name_pt : (data.place_slugs?.[0] ?? data.title)),
      text: pageText(isPlace ? data.pt : data, isPlace ? '' : m[2]),
    });
  }
}

/**
 * Which targets a page is responsible for.
 *
 * A place page owns every term naming its place — someone searching
 * "restaurantes em Setúbal" should be able to land on Setúbal. A guide owns
 * only the terms about its own subject: the choco frito guide is not failing
 * because it does not cover Setúbal's beaches, and counting it that way was
 * the first version's mistake. Judging a page against work that belongs to a
 * different page produces a number that is worse than no number.
 */
function targetsFor(page) {
  return TARGETS.filter((t) => {
    if (!t.theme || t.volume < MIN_VOLUME) return false;
    const term = strip(t.term);
    if (page.kind === 'place') {
      // Accommodation belongs to the Dormir pillar and to a where-to-stay
      // guide, not to a concelho page — and most of these terms are hotel
      // brand names, which no place page should be expected to carry.
      if (t.theme === 'Onde ficar') return false;
      return page.subject.length > 3 && term.includes(page.subject);
    }
    // A guide owns a term when the term's distinctive words are all in its
    // own title — i.e. the term is about what the guide is about.
    const titleWords = new Set(strip(page.name).split(/\s+/).filter((w) => w.length > 3));
    const termWords = strip(t.term).split(/\s+/).filter((w) => w.length > 3
      && !['para', 'como', 'onde', 'perto', 'melhores', 'melhor'].includes(w));
    return termWords.length > 0
      && termWords.filter((w) => [...titleWords].some((tw) => tw.startsWith(w.slice(0, 5)))).length
         >= Math.ceil(termWords.length / 2);
  }).sort((a, b) => b.volume - a.volume);
}

/** Does the page use the distinctive words of this term? */
function covers(page, term) {
  const words = strip(term).split(/\s+/).filter((w) => w.length > 3
    && !['para', 'como', 'onde', 'perto', 'melhores', 'melhor'].includes(w));
  if (words.length === 0) return true;
  return words.every((w) => page.text.includes(w.replace(/s$/, '')));
}

let totalMissed = 0;
const rows = [];
for (const page of pages) {
  const targets = targetsFor(page);
  if (targets.length === 0) continue;
  const missed = targets.filter((t) => !covers(page, t.term));
  const missedVolume = missed.reduce((n, t) => n + t.volume, 0);
  const covered = targets.length - missed.length;
  totalMissed += missedVolume;
  rows.push({ page, targets, missed, missedVolume, covered });
}

rows.sort((a, b) => b.missedVolume - a.missedVolume);

console.log(`\nSEO coverage — ${rows.length} published pages with targets\n`);
for (const r of rows) {
  if (gapsOnly && r.missed.length === 0) continue;
  const pct = Math.round((r.covered / r.targets.length) * 100);
  console.log(`  ${r.page.name}  —  ${r.covered}/${r.targets.length} terms (${pct}%)` +
    (r.missedVolume ? `, ${r.missedVolume.toLocaleString()}/mo unanswered` : ''));
  for (const t of r.missed.slice(0, 5)) {
    console.log(`      missing  ${String(t.volume).padStart(6)}/mo  ${t.term}   [${t.theme}]`);
  }
}
console.log(`\n${totalMissed.toLocaleString()} searches/month named by a target that its page never mentions.`);
console.log('Term coverage only — it cannot tell you whether the answer is good.\n');
