#!/usr/bin/env node
/**
 * Emit the write-next queue in Spandera's publish-queue shape.
 *
 *   npm run queue                 # print it
 *   npm run queue -- --write      # write it into the Spandera repo
 *
 * Spandera Studio is the portfolio's operating layer: it already holds the
 * keyword universe, the Search Console feed and a publish queue for every
 * brand, and the ops console reads them. Margem Cool's queue there is empty,
 * so the site has been deciding what to write on its own while the console
 * shows nothing. This closes that gap — the queue this repo computes becomes
 * the queue the console displays, alongside every other brand.
 *
 * Two kinds of item, from two different signals:
 *
 *   new      — a term in the keyword universe with no page yet, ranked by
 *              when the page needs to exist (see next-up.mjs). This is the
 *              part Spandera does not currently do for any brand: seasonality.
 *   refresh  — a query already earning impressions from a position worth
 *              improving. Search Console knows this and the universe cannot.
 *              South Bank's queue already works this way ("already showing
 *              at #17"); Margem Cool now does too.
 *
 * The GSC half needs the Cloudflare Access service token and is skipped when
 * it isn't there, so the same script works in CI and on a laptop.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const write = process.argv.includes('--write');
const DEST = join(homedir(), 'spandera-studio/src/data/publish-queue/margem-cool.json');
const TOKEN = join(homedir(), '.claude/projects/-Users-jameslumley-savile/secrets/spandera-service-token.txt');

/** Positions worth attacking: on page two or the bottom of page one. */
const STRIKING = { min: 8, max: 25, minImpressions: 3 };

const PILLAR_NAME = {
  comer_beber: 'Comer & Beber',
  praia_natureza: 'Praia & Natureza',
  lugares_bairros: 'Lugares & Bairros',
  cultura_agenda: 'Cultura & Agenda',
  viver_aqui: 'Viver Aqui',
  dormir: 'Dormir',
};

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 52);

// --- new: from the local queue --------------------------------------------
const local = JSON.parse(
  execFileSync('node', [join(ROOT, 'scripts/next-up.mjs'), '--json', '--all'], { encoding: 'utf8' }),
);

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const items = local.queue.slice(0, 20).map((t, i) => {
  const by = t.deadline
    ? `write by ${MONTHS[t.deadline.due]} — peaks in ${MONTHS[t.deadline.peakMonth]}, ${Math.round(t.deadline.ratio)}× swing`
    : 'flat demand — earns all year, fills gaps between deadlines';
  return {
    id: `mc-new-${slugify(t.term)}`,
    kind: 'new',
    title: t.term.replace(/\b\w/g, (c) => c.toUpperCase()),
    topicId: null,
    path: null,
    primaryKeyword: t.term,
    keywords: [t.term],
    pillar: PILLAR_NAME[t.pillar] ?? t.theme ?? null,
    funnelStage: null,
    reason: `${t.volume.toLocaleString()} searches/mo · ${by}`,
    status: 'proposed',
    order: i,
    // Not part of Spandera's schema yet. Seasonality is the thing this brand
    // learned that every brand needs — Frigiliana has exactly the same problem.
    writeBy: t.deadline ? MONTHS[t.deadline.due] : null,
    peakMonth: t.deadline ? MONTHS[t.deadline.peakMonth] : null,
  };
});

// --- refresh: from Search Console, when we can reach it ---------------------
let gscNote = 'Search Console not read — no Spandera service token on this machine.';
if (existsSync(TOKEN)) {
  try {
    const raw = readFileSync(TOKEN, 'utf8');
    const kv = Object.fromEntries([...raw.matchAll(/([A-Za-z-]*Client-(?:Id|Secret))\s*[:=]\s*(\S+)/g)]
      .map((m) => [m[1], m[2]]));
    const res = await fetch('https://spandera.studio/api/gsc?slug=margem-cool', {
      headers: {
        'CF-Access-Client-Id': kv['CF-Access-Client-Id'],
        'CF-Access-Client-Secret': kv['CF-Access-Client-Secret'],
        'user-agent': 'margemcool.pt publish-queue',
      },
    });
    const gsc = await res.json();
    const near = (gsc.queries ?? [])
      .filter((q) => q.position >= STRIKING.min && q.position <= STRIKING.max
        && q.impressions >= STRIKING.minImpressions)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    near.forEach((q, i) => {
      items.push({
        id: `mc-refresh-${slugify(q.query)}`,
        kind: 'refresh',
        title: `Improve: ${q.query}`,
        topicId: null,
        path: null,
        primaryKeyword: q.query,
        keywords: [q.query],
        pillar: null,
        funnelStage: null,
        reason: `already at position ${q.position.toFixed(1)} on ${q.impressions} impressions — `
          + 'a page that answers this better should reach page one',
        status: 'proposed',
        order: items.length + i,
      });
    });
    gscNote = `Search Console read ${gsc.fetchedAt?.slice(0, 10)} — ${gsc.totals?.impressions} impressions, `
      + `${gsc.totals?.clicks} clicks over ${gsc.range?.days ?? 28} days; ${near.length} queries in striking distance.`;
  } catch (err) {
    gscNote = `Search Console unavailable: ${err.message}`;
  }
}

const queue = {
  updatedAt: new Date().toISOString(),
  source: 'margem-cool repo · scripts/publish-queue.mjs',
  note: gscNote,
  refreshRules: [
    `refresh candidates are queries at position ${STRIKING.min}-${STRIKING.max} `
    + `with ${STRIKING.minImpressions}+ impressions`,
    'new candidates are ranked by when the page must exist — peak month minus four',
  ],
  items,
};

if (write) {
  writeFileSync(DEST, JSON.stringify(queue, null, 2) + '\n');
  console.log(`Wrote ${items.length} items to ${DEST}`);
} else {
  console.log(JSON.stringify(queue, null, 2));
}
console.log(`\n${gscNote}`);
console.log(`${items.filter((i) => i.kind === 'new').length} new · ${items.filter((i) => i.kind === 'refresh').length} refresh`);
