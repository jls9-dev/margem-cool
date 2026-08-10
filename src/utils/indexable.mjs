/**
 * What Margem Cool lets Google index.
 *
 * A page earns a place in the index by having content on it. Until then it is
 * noindexed and kept out of the sitemap, because a domain that is mostly
 * sixty-word stubs is read as a thin-content site — and at this stage almost
 * every page is a stub. Each page flips into the index as it gets written,
 * simply by its `page_status` moving off `placeholder`.
 *
 * Plain .mjs rather than .ts because astro.config.mjs imports it directly to
 * build the sitemap filter, and the config is loaded outside Astro's TS
 * pipeline. The Astro layouts read the same rule via `isIndexableStatus`, so
 * markup and sitemap can't drift; scripts/check-noindex.mjs gates the build on
 * them agreeing anyway.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { PILLAR_PATH, GUIDES_INDEX } from './pillars.mjs';

const PLACES_DIR = fileURLToPath(new URL('../content/places/', import.meta.url));
const ARTICLES_DIR = fileURLToPath(new URL('../content/articles/', import.meta.url));

/** Statuses that mean "there is something here worth ranking". */
export function isIndexableStatus(status) {
  return status !== 'placeholder';
}

/**
 * Pages that are never search results, whatever state the site is in. The
 * analytics opt-out exists for staff to click once; it has no business being
 * crawled.
 */
export const NEVER_INDEXED_PATHS = ['/optout/', '/en/optout/'];

/**
 * Pillar landing pages and guide indexes are worth indexing exactly when they
 * have something on them. Derived from the articles on disk rather than kept
 * as a hand-maintained list — the hand-maintained version drifted the first
 * time a pillar gained a guide, and the build gate caught it.
 */
function guideCoverage() {
  const pillarsWithGuides = { pt: new Set(), en: new Set() };
  const langsWithGuides = new Set();
  let files = [];
  try { files = markdownFilesIn(ARTICLES_DIR); } catch { return { pillarsWithGuides, langsWithGuides }; }
  for (const file of files) {
    const data = frontmatterOf(file);
    if (data.draft) continue;
    const lang = data.language;
    if (!pillarsWithGuides[lang]) continue;
    pillarsWithGuides[lang].add(data.pillar);
    langsWithGuides.add(lang);
  }
  return { pillarsWithGuides, langsWithGuides };
}

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
  const source = readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`No frontmatter in ${file}`);
  return yaml.load(match[1]);
}

/** URL path of a place page, matching the [...slug] routes. */
export function placePath(slug, lang) {
  return lang === 'pt' ? `/lugares/${slug}/` : `/en/places/${slug}/`;
}

/**
 * Every URL path that must be kept out of the sitemap: the pillar stubs plus
 * each language of each place page whose status is still `placeholder`. The
 * two languages are judged separately — a place written in Portuguese but not
 * yet in English belongs in the Portuguese index only.
 */
export function noindexPaths() {
  const paths = new Set(NEVER_INDEXED_PATHS);

  const { pillarsWithGuides, langsWithGuides } = guideCoverage();
  for (const lang of ['pt', 'en']) {
    for (const [pillar, path] of Object.entries(PILLAR_PATH[lang])) {
      if (!pillarsWithGuides[lang].has(pillar)) paths.add(path);
    }
    if (!langsWithGuides.has(lang)) paths.add(GUIDES_INDEX[lang]);
    else paths.delete(GUIDES_INDEX[lang]);
  }

  for (const file of markdownFilesIn(PLACES_DIR)) {
    const slug = relative(PLACES_DIR, file).split(sep).join('/').replace(/\.md$/, '');
    const data = frontmatterOf(file);
    for (const lang of ['pt', 'en']) {
      if (!isIndexableStatus(data[lang]?.page_status)) paths.add(placePath(slug, lang));
    }
  }

  return paths;
}
