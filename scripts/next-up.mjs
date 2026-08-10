#!/usr/bin/env node
/**
 * What to write next.
 *
 *   npm run next            # the queue, top 12
 *   npm run next -- --all   # everything still unwritten
 *   npm run next -- --json  # machine-readable, for the workflow
 *
 * Reads the keyword targets, subtracts what we have already published, and
 * ranks what is left. The ranking is the point, and it is not by volume.
 *
 * A page has to be live and aged for months before it ranks, so the question
 * is not "what is biggest" but "what needs to exist by when". The beach terms
 * swing twenty-five times between February and August; Carnaval de Sesimbra
 * swings two hundred and twenty. Sorting those by annual average would have
 * us writing beach pages in June, four months after the window to plant them
 * closed, and the Carnaval page in February while it is happening.
 *
 * So each target gets a deadline — its peak month minus a lead time — and the
 * queue sorts by how close that deadline is, with volume breaking ties.
 * Flat-demand terms have no deadline and fill the gaps; they earn all year.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TARGETS = JSON.parse(readFileSync(join(ROOT, 'src/data/keyword-targets.json'), 'utf8'));
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const showAll = args.includes('--all');
const LIMIT = showAll ? Infinity : 12;

/** How long before a peak a page needs to exist to be ranking into it. */
const LEAD_MONTHS = 4;
/** Below this ratio a term is treated as flat — no deadline, write any time. */
const SEASONAL_RATIO = 3;

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// --- What is already covered ----------------------------------------------
function filesIn(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesIn(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const strip = (s) => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const covered = [];
for (const dir of ['src/content/articles', 'src/content/places']) {
  for (const file of filesIn(join(ROOT, dir))) {
    const raw = readFileSync(file, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const data = yaml.load(fm[1]);
    // A place page only counts as covering its subject once it is written.
    if (dir.endsWith('places')) {
      const written = ['pt', 'en'].some((l) => data?.[l]?.page_status && data[l].page_status !== 'placeholder');
      if (!written) continue;
      covered.push(strip(data.name_pt ?? ''));
    } else if (!data?.draft) {
      covered.push(strip(`${data.title ?? ''} ${file.split('/').pop().replace(/\.md$/, '')}`));
    }
  }
}

/** A term is covered when a published page's subject contains it, or vice versa. */
function isCovered(term) {
  const t = strip(term);
  if (t.length < 4) return false;
  return covered.some((c) => c.includes(t) || (t.length > 8 && t.includes(c) && c.length > 6));
}

// --- Deadline --------------------------------------------------------------
const now = new Date();
const thisMonth = now.getMonth() + 1;

function deadlineFor(target) {
  const { peakMonth, peakVolume, troughVolume } = target;
  if (!peakMonth || !peakVolume) return null;
  const ratio = peakVolume / Math.max(troughVolume || 1, 1);
  if (ratio < SEASONAL_RATIO) return null;         // flat enough to write any time
  const due = ((peakMonth - LEAD_MONTHS - 1) + 12) % 12 + 1;
  const monthsAway = ((due - thisMonth) + 12) % 12;
  return { due, monthsAway, ratio, peakMonth };
}

// --- Build the queue -------------------------------------------------------
const queue = [];
for (const target of TARGETS.targets) {
  if (!target.theme) continue;                      // bare place names belong to place pages
  if (target.volume < 300) continue;
  if (isCovered(target.term)) continue;
  const deadline = deadlineFor(target);
  queue.push({ ...target, deadline });
}

queue.sort((a, b) => {
  const am = a.deadline ? a.deadline.monthsAway : 99;
  const bm = b.deadline ? b.deadline.monthsAway : 99;
  if (am !== bm) return am - bm;
  return b.volume - a.volume;
});

const shown = queue.slice(0, LIMIT);

if (asJson) {
  console.log(JSON.stringify({ generated: now.toISOString().slice(0, 10), queue: shown }, null, 2));
} else {
  console.log(`\nWhat to write next — ${queue.length} uncovered targets, showing ${shown.length}\n`);
  console.log(`${'searches'.padStart(9)}  ${'write by'.padEnd(22)} ${'theme'.padEnd(20)} term`);
  console.log('  ' + '─'.repeat(88));
  for (const t of shown) {
    const when = t.deadline
      ? `${MONTHS[t.deadline.due].slice(0, 3)} (peak ${MONTHS[t.deadline.peakMonth].slice(0, 3)}, ${Math.round(t.deadline.ratio)}×)`
      : 'any time — flat';
    console.log(
      `${String(t.volume).padStart(9)}  ${when.padEnd(22)} ${String(t.theme).slice(0, 19).padEnd(20)} ${t.term}`,
    );
  }
  const urgent = queue.filter((t) => t.deadline && t.deadline.monthsAway <= 1).length;
  console.log(
    `\n${covered.length} published pages counted as covering their subject. ` +
    `${urgent} target(s) are at or past their deadline this month.`,
  );
  console.log('Lead time is ' + LEAD_MONTHS + ' months before peak; anything swinging less than ' +
    SEASONAL_RATIO + '× is treated as flat.\n');
}
