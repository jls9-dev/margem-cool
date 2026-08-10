#!/usr/bin/env node
/**
 * The weekly fact check.
 *
 *   npm run facts            # check every declared claim
 *   npm run facts -- --stale # only claims not checked in 90+ days
 *   npm run facts -- --json  # machine-readable, for the workflow
 *
 * Every page that states something perishable — an opening time, a fare, a
 * festival date, an access rule — declares it in frontmatter under `verify:`
 * along with the source it came from. This re-fetches each source and reports
 * where the page and the source have stopped agreeing.
 *
 * Why this is the first thing the routine does, before writing anything new:
 * the biggest risk to this site is not publishing too slowly, it is that what
 * is already published quietly rots. Every guide across the internet still
 * tells people to take the Transpraia beach train, which stopped running in
 * 2019. A site that adds pages while its old ones decay gets worse over time,
 * not better.
 *
 * What it can and cannot do. It extracts the hard signals from a claim — the
 * numbers, times, dates and prices — and checks they still appear on the
 * source page. It cannot read prose and judge meaning, so it will not catch a
 * rule that changed shape without changing its numbers. It is a smoke alarm,
 * not an inspector: everything it flags needs a human to look, and a clean run
 * means "nothing obviously moved", not "everything is still true".
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const CONTENT = fileURLToPath(new URL('../src/content/', import.meta.url));
const args = process.argv.slice(2);
const staleOnly = args.includes('--stale');
const asJson = args.includes('--json');
const STALE_DAYS = 90;

const UA = 'margemcool.pt fact check (hello@margemcool.pt)';

function markdownFilesIn(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFilesIn(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function frontmatterOf(file) {
  const match = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? yaml.load(match[1]) : null;
}

/**
 * The checkable parts of a claim: prices, times, dates, plain numbers.
 * Prose is deliberately ignored — matching words against a page produces
 * false alarms on every rewrite, and the numbers are what actually change.
 */
function signalsIn(claim) {
  /**
   * Each signal is a set of ALTERNATIVE spellings of one fact — 7h00 and 7:00
   * are the same opening time, and a source only ever writes one of them. The
   * check passes if any spelling is found. Requiring all of them, which the
   * first version did, flagged every claim on the day it was written.
   */
  const signals = [];
  const seen = new Set();
  const push = (alts) => {
    const clean = [...new Set(alts.filter(Boolean).map((a) => a.trim()))];
    const key = clean.join('|');
    if (clean.length && !seen.has(key)) { seen.add(key); signals.push(clean); }
  };

  for (const m of claim.matchAll(/(\d+)[.,](\d{2})\s*€|€\s*(\d+)[.,](\d{2})/g)) {
    const whole = m[1] ?? m[3];
    const cents = m[2] ?? m[4];
    push([`${whole},${cents}`, `${whole}.${cents}`, cents === '00' ? whole : null]);
  }
  for (const m of claim.matchAll(/\b(\d{1,2})\s*h\s*(\d{2})?\b/gi)) {
    const h = m[1].padStart(2, '0');
    const bare = String(Number(m[1]));
    const mins = m[2];
    push(mins
      ? [`${h}h${mins}`, `${bare}h${mins}`, `${h}:${mins}`, `${bare}:${mins}`]
      : [`${h}h`, `${bare}h`, `${h}:00`, `${bare}:00`]);
  }
  for (const m of claim.matchAll(/\b(\d{1,2}):(\d{2})\b/g)) {
    const h = m[1].padStart(2, '0');
    const bare = String(Number(m[1]));
    push([`${h}:${m[2]}`, `${bare}:${m[2]}`, `${h}h${m[2]}`, `${bare}h${m[2]}`]);
  }
  for (const m of claim.matchAll(/\b(\d{4})\b/g)) push([m[1]]);
  for (const m of claim.matchAll(/(?<![\d,.:h])(\d{1,3})(?![\d,.:h])/g)) {
    if (Number(m[1]) > 3) push([m[1]]);
  }

  return signals;
}

const normalise = (html) =>
  html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/\s+/g, ' ');

const pageCache = new Map();
async function fetchSource(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  let result;
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    result = res.ok
      ? { ok: true, text: normalise(await res.text()) }
      : { ok: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    result = { ok: false, reason: err.message };
  }
  pageCache.set(url, result);
  return result;
}

const daysSince = (date) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);

// --- Collect every declared claim -----------------------------------------
const claims = [];
for (const file of markdownFilesIn(CONTENT)) {
  const data = frontmatterOf(file);
  if (!data?.verify?.length) continue;
  const page = relative(CONTENT, file).split(sep).join('/');
  for (const entry of data.verify) {
    const age = daysSince(entry.checked);
    if (staleOnly && age < STALE_DAYS) continue;
    claims.push({ page, ...entry, age });
  }
}

if (claims.length === 0) {
  console.log(staleOnly
    ? `check-facts: nothing older than ${STALE_DAYS} days.`
    : 'check-facts: no pages declare verifiable claims yet.');
  process.exit(0);
}

// --- Check each one --------------------------------------------------------
const results = [];
for (const claim of claims) {
  const source = await fetchSource(claim.source);
  if (!source.ok) {
    results.push({ ...claim, status: 'UNREACHABLE', detail: source.reason });
    continue;
  }
  const signals = signalsIn(claim.claim);
  if (signals.length === 0) {
    results.push({ ...claim, status: 'UNCHECKABLE', detail: 'no numbers in the claim to match' });
    continue;
  }
  const missing = signals.filter((alts) => !alts.some((a) => source.text.includes(a)));
  results.push(
    missing.length
      ? { ...claim, status: 'CHANGED', detail: `no longer on the source: ${missing.map((a) => a[0]).join(', ')}` }
      : { ...claim, status: 'OK', detail: `${signals.length} signal(s) still present` },
  );
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const by = (s) => results.filter((r) => r.status === s);
  const icon = { OK: '  ok      ', CHANGED: '  CHANGED ', UNREACHABLE: '  no reply', UNCHECKABLE: '  skipped ' };
  for (const status of ['CHANGED', 'UNREACHABLE', 'UNCHECKABLE', 'OK']) {
    for (const r of by(status)) {
      console.log(`${icon[status]} ${r.page}`);
      console.log(`            "${r.claim}"`);
      console.log(`            ${r.detail}  ·  checked ${r.age}d ago`);
    }
  }
  const changed = by('CHANGED').length;
  const unreachable = by('UNREACHABLE').length;
  console.log(
    `\ncheck-facts: ${results.length} claims · ${by('OK').length} unchanged · ` +
    `${changed} changed · ${unreachable} unreachable`,
  );
  if (changed) console.log('Sources moved. Read each one and update the page, then bump `checked`.');
}

// Changed facts should stop a workflow and open an issue. An unreachable
// source is worth knowing about but is usually the site being down, so it
// does not fail on its own.
process.exit(results.some((r) => r.status === 'CHANGED') ? 1 : 0);
