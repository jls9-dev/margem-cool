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

const PLACES_DIR = fileURLToPath(new URL('../content/places/', import.meta.url));

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
 * Pillar landing pages still rendering the "Em construção" stub. These are the
 * highest-value URLs on the site once written, so they are listed by hand —
 * deleting a path from here is the deliberate act of saying a pillar is live.
 */
export const PILLAR_STUB_PATHS = [
  '/comer-e-beber/',
  '/cultura-e-agenda/',
  '/dormir/',
  '/lugares-e-bairros/',
  '/praia-e-natureza/',
  '/viver-aqui/',
  '/en/eat-and-drink/',
  '/en/culture-and-whats-on/',
  '/en/where-to-stay/',
  '/en/places-and-neighbourhoods/',
  '/en/beach-and-outdoors/',
  '/en/living-here/',
];

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
  const paths = new Set([...NEVER_INDEXED_PATHS, ...PILLAR_STUB_PATHS]);

  for (const file of markdownFilesIn(PLACES_DIR)) {
    const slug = relative(PLACES_DIR, file).split(sep).join('/').replace(/\.md$/, '');
    const data = frontmatterOf(file);
    for (const lang of ['pt', 'en']) {
      if (!isIndexableStatus(data[lang]?.page_status)) paths.add(placePath(slug, lang));
    }
  }

  return paths;
}
