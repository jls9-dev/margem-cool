#!/usr/bin/env node
/**
 * Build gate: robots noindex and the sitemap must agree, on every page.
 *
 * Two separate mechanisms decide whether a URL is offered to Google — the
 * `noindex` prop threaded through BaseLayout, and the sitemap filter in
 * astro.config.mjs. Both read src/utils/indexable.mjs, but they read it at
 * different points in the build, so nothing structural stops them drifting.
 * This checks the built output rather than the intent: a page that renders
 * noindex must be absent from the sitemap, and a page that doesn't must be in
 * it. Drift in either direction fails the build.
 *
 * Runs as part of `npm run build`.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

// 404 is served by Cloudflare on a miss and is never a sitemap entry.
const NOT_A_PAGE = new Set(['/404/']);

function htmlFilesIn(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFilesIn(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function pathOf(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
}

function sitemapPaths() {
  const paths = new Set();
  for (const file of readdirSync(DIST)) {
    if (!/^sitemap-\d+\.xml$/.test(file)) continue;
    const xml = readFileSync(join(DIST, file), 'utf8');
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      paths.add(new URL(loc).pathname);
    }
  }
  return paths;
}

if (!existsSync(DIST)) {
  console.error('check-noindex: no dist/ — run the build first.');
  process.exit(1);
}

const inSitemap = sitemapPaths();
if (inSitemap.size === 0) {
  console.error('check-noindex: the sitemap is empty. Something is wrong with the build.');
  process.exit(1);
}

const listedButNoindexed = [];
const indexableButMissing = [];

for (const file of htmlFilesIn(DIST)) {
  const path = pathOf(file);
  if (NOT_A_PAGE.has(path)) continue;

  const noindex = /<meta name="robots" content="noindex/.test(readFileSync(file, 'utf8'));
  const listed = inSitemap.has(path);

  if (noindex && listed) listedButNoindexed.push(path);
  if (!noindex && !listed) indexableButMissing.push(path);
}

if (listedButNoindexed.length || indexableButMissing.length) {
  console.error('\ncheck-noindex: the sitemap and the robots tags disagree.\n');
  for (const p of listedButNoindexed.sort()) {
    console.error(`  in the sitemap but marked noindex   ${p}`);
  }
  for (const p of indexableButMissing.sort()) {
    console.error(`  indexable but not in the sitemap    ${p}`);
  }
  console.error('\nBoth are decided by src/utils/indexable.mjs — check the rule there.\n');
  process.exit(1);
}

const total = htmlFilesIn(DIST).length - NOT_A_PAGE.size;
console.log(
  `check-noindex: ${inSitemap.size} of ${total} pages offered to search, ` +
  `${total - inSitemap.size} held back until they're written.`,
);
