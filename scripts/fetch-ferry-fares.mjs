#!/usr/bin/env node
/**
 * Refresh the ferry fares from Transtejo Soflusa.
 *
 *   npm run fares
 *
 * Writes src/data/ferry-fares.json — every route's single ticket, zapping rate
 * and day pass, with the date we read them.
 *
 * Why this is a script and not a number typed into a page: the ferry is the
 * defining fact of half the Margem Sul, so its fare appears on many place
 * pages, and a fare copied by hand is correct on the day it is written and
 * quietly wrong for years afterwards. TTSL publish the table as structured
 * markup on one page; reading it costs one request and can run on a schedule.
 *
 * The fares are also the only prices on the site precise enough to be worth
 * stating. Restaurant dish prices we do not copy — see the content quality
 * checklist on unverifiable numbers.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://ttsl.pt/passageiros/tarifario/';
const DEST = fileURLToPath(new URL('../src/data/ferry-fares.json', import.meta.url));

const WANTED = {
  'Bilhete simples': 'single',
  'Zapping (validação)': 'zapping',
};

const strip = (html) =>
  html.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .trim();

const toNumber = (price) => {
  const n = Number(price.replace(/[^\d,.]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/** Route heading → the slug we use for it in place frontmatter and copy. */
function routeKey(heading) {
  return strip(heading)
    .replace(/^Liga(ç|c)ão\s+/i, '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const response = await fetch(SOURCE, {
  headers: { 'user-agent': 'margemcool.pt fare check (hello@margemcool.pt)' },
});
if (!response.ok) {
  console.error(`fetch-ferry-fares: ${SOURCE} returned ${response.status}`);
  process.exit(1);
}
const html = await response.text();

const pattern = /<div class="accordion[^"]*">(.*?)<\/div>|<div class="titulo">(.*?)<\/div><div class="titulo preco-titulo">(.*?)<\/div>/gs;

const routes = {};
let current = null;
for (const match of html.matchAll(pattern)) {
  if (match[1] !== undefined) {
    const key = routeKey(match[1]);
    current = key || null;
    if (current && !routes[current]) routes[current] = { name: strip(match[1]), fares: {} };
    continue;
  }
  if (!current) continue;
  const field = WANTED[strip(match[2])];
  const value = toNumber(strip(match[3]));
  if (field && value !== null) routes[current].fares[field] = value;
}

const complete = Object.fromEntries(
  Object.entries(routes).filter(([, r]) => r.fares.single != null),
);

if (Object.keys(complete).length < 4) {
  console.error(
    `fetch-ferry-fares: only parsed ${Object.keys(complete).length} routes — ` +
    'TTSL have probably changed their markup. Not overwriting the existing file.',
  );
  process.exit(1);
}

const payload = {
  source: SOURCE,
  operator: 'Transtejo Soflusa',
  currency: 'EUR',
  checked: new Date().toISOString().slice(0, 10),
  routes: complete,
};

await writeFile(DEST, JSON.stringify(payload, null, 2) + '\n');

console.log(`ferry fares checked ${payload.checked} — ${Object.keys(complete).length} routes`);
for (const [key, route] of Object.entries(complete)) {
  const { single, zapping } = route.fares;
  console.log(`  ${key.padEnd(28)} single €${single.toFixed(2)}${zapping ? `  zapping €${zapping.toFixed(2)}` : ''}`);
}
