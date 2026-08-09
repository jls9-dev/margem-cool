#!/usr/bin/env node
// Every published link must be the URL the site actually SERVES: directory format, trailing slash.
// Without it each hreflang alternate 308-redirects to its slashed twin, and the self-referencing
// alternate disagrees with the canonical beside it — which is what Semrush reported against
// southbank.pt on 2 Aug 2026 (17 hreflang conflicts, 35 bad hreflang links). South Bank and Lisbon
// Property both gained this gate then; Margem Cool never did, despite carrying hreflang on all 126
// of its pages. It is clean today — this keeps it that way.
//
// Note the language layout is INVERTED from South Bank: Portuguese lives at the root and English
// at /en/, and the code is pt-PT rather than pt. Copying the South Bank gate verbatim would pass
// every page for the wrong reason, finding no "pt" alternate to compare and checking nothing.
//
// Run after `npm run build`:  node scripts/check-hreflang.mjs
import { readFileSync, globSync } from 'node:fs';

const files = globSync('dist/**/index.html');
const problems = [];
let checked = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf-8');
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
  if (!alts.length) continue;
  checked++;
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];

  for (const [lang, href] of alts) {
    if (!href.endsWith('/')) problems.push(`${file}: hreflang="${lang}" points at ${href} — no trailing slash, so it redirects`);
  }

  // English at /en/, Portuguese at the root.
  const selfLang = file.includes('/en/') ? 'en' : 'pt-PT';
  const byLang = Object.fromEntries(alts);
  const self = byLang[selfLang];

  // A page with alternates but none naming its own language is the failure the
  // inverted layout invites, so say so rather than skipping quietly.
  if (!self) {
    problems.push(`${file}: has ${alts.length} alternates but none for its own language ("${selfLang}") — got ${Object.keys(byLang).join(', ')}`);
  } else if (canonical && self !== canonical) {
    problems.push(`${file}: self-referencing hreflang="${selfLang}" is ${self} but the canonical is ${canonical}`);
  }

  if (!byLang['x-default']) problems.push(`${file}: no x-default alternate`);
}

if (problems.length) {
  console.error(`✖ ${problems.length} hreflang problem${problems.length === 1 ? '' : 's'} across ${checked} pages:\n`);
  for (const p of problems.slice(0, 25)) console.error('  ' + p);
  if (problems.length > 25) console.error(`  …and ${problems.length - 25} more`);
  process.exit(1);
}
console.log(`✓ hreflang clean — ${checked} bilingual pages, every alternate served directly and matching its canonical`);
