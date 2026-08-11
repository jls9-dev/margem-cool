/**
 * Writes dist/llms.txt from the sitemap Astro just built.
 *
 * The sitemap is already the site's answer to "which pages are real" — it is
 * filtered by src/utils/indexable.mjs, so placeholder places and unwritten
 * stubs never reach it. Deriving llms.txt from that same file means the two
 * can't drift: a page enters both lists the moment its page_status moves off
 * `placeholder`, and neither list needs maintaining by hand.
 *
 * Titles and one-line summaries come from each built page's <title> and meta
 * description, so llms.txt says exactly what the page says.
 *
 * Runs after `astro build`, alongside check-hreflang and check-noindex.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = 'https://margemcool.pt';

const INTRO_PT =
  'Uma publicação sobre a Margem Sul — os nove concelhos a sul do Tejo, escritos de onde vivemos. Comer e beber, praia e natureza, lugares e bairros, cultura e agenda, viver aqui e onde dormir.';
const INTRO_EN =
  'A publication about the Margem Sul — the nine concelhos south of the Tagus, written from where we live. Eating and drinking, beaches and outdoors, places and neighbourhoods, culture and events, living here and where to stay.';

/** Section headings, keyed by the first path segment after the language. */
const SECTIONS = {
  pt: [
    ['', 'Início'],
    ['guias', 'Guias'],
    ['lugares', 'Lugares'],
    ['comer-e-beber', 'Pilares'],
    ['praia-e-natureza', 'Pilares'],
    ['lugares-e-bairros', 'Pilares'],
    ['cultura-e-agenda', 'Pilares'],
    ['viver-aqui', 'Pilares'],
    ['dormir', 'Pilares'],
    ['sobre', 'Sobre e legal'],
    ['contacto', 'Sobre e legal'],
    ['parcerias', 'Sobre e legal'],
    ['privacidade', 'Sobre e legal'],
  ],
  en: [
    ['', 'Home'],
    ['guides', 'Guides'],
    ['places', 'Places'],
    ['eat-and-drink', 'Pillars'],
    ['beach-and-outdoors', 'Pillars'],
    ['places-and-neighbourhoods', 'Pillars'],
    ['culture-and-whats-on', 'Pillars'],
    ['living-here', 'Pillars'],
    ['where-to-stay', 'Pillars'],
    ['about', 'About and legal'],
    ['contact', 'About and legal'],
    ['partnerships', 'About and legal'],
    ['privacy', 'About and legal'],
  ],
};

const SECTION_ORDER = {
  pt: ['Início', 'Guias', 'Lugares', 'Pilares', 'Sobre e legal', 'Outras páginas'],
  en: ['Home', 'Guides', 'Places', 'Pillars', 'About and legal', 'Other pages'],
};

function sitemapUrls() {
  const files = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (!files.length) throw new Error('No sitemap-N.xml in dist/ — did astro build run?');
  const urls = [];
  for (const file of files) {
    const xml = readFileSync(join(DIST, file), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
  }
  return [...new Set(urls)].sort();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function pageMeta(pathname) {
  const html = readFileSync(join(DIST, pathname.replace(/^\//, ''), 'index.html'), 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  return {
    title: title ? decodeEntities(title[1]).trim() : null,
    summary: desc ? decodeEntities(desc[1]).trim() : null,
  };
}

/** Drop the "Margem Cool" brand from either end — the file already says whose site this is. */
function shortTitle(title) {
  return (
    title
      .replace(/^Margem Cool\s*[·|—-]\s*/, '')
      .replace(/\s*[·|—-]\s*Margem Cool$/, '')
      .trim() || 'Margem Cool'
  );
}

function sectionFor(lang, pathname) {
  const rest = lang === 'en' ? pathname.replace(/^\/en\/?/, '/') : pathname;
  const segment = rest.replace(/^\/+|\/+$/g, '').split('/')[0] ?? '';
  const hit = SECTIONS[lang].find(([key]) => key === segment);
  return hit ? hit[1] : SECTION_ORDER[lang].at(-1);
}

function build() {
  const pages = [];
  for (const url of sitemapUrls()) {
    const pathname = new URL(url).pathname;
    const lang = pathname === '/en/' || pathname.startsWith('/en/') ? 'en' : 'pt';
    const { title, summary } = pageMeta(pathname);
    if (!title) throw new Error(`No <title> in built page ${pathname}`);
    pages.push({ url, pathname, lang, title: shortTitle(title), summary, section: sectionFor(lang, pathname) });
  }

  const lines = ['# Margem Cool', ''];
  lines.push(`> ${INTRO_PT}`, '');
  lines.push(`> ${INTRO_EN}`, '');

  for (const lang of ['pt', 'en']) {
    lines.push(lang === 'pt' ? '## Português' : '## English', '');
    for (const section of SECTION_ORDER[lang]) {
      const inSection = pages.filter((p) => p.lang === lang && p.section === section);
      if (!inSection.length) continue;
      lines.push(`### ${section}`, '');
      for (const p of inSection) {
        lines.push(`- [${p.title}](${p.url})${p.summary ? `: ${p.summary}` : ''}`);
      }
      lines.push('');
    }
  }

  writeFileSync(join(DIST, 'llms.txt'), lines.join('\n'), 'utf8');
  console.log(`llms.txt: ${pages.length} pages written`);
}

build();
