import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { noindexPaths } from './src/utils/indexable.mjs';

const SITE = 'https://margemcool.pt';

// Placeholder place pages and the unwritten pillar stubs carry robots noindex,
// so submitting them would be asking Google to crawl URLs we've told it to
// ignore. Same rule module the layouts use; check-noindex.mjs proves the two
// stayed in step after every build.
const NOINDEX = noindexPaths();

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Inline the stylesheets instead of linking them. The homepage was pulling
    // five separate CSS files, each a render-blocking request on the critical
    // path — Lighthouse reported no byte savings and no blocking scripts, because
    // the cost was round-trips rather than weight. Total CSS is ~60KB across the
    // whole site and a page uses a small slice of it, so inlining removes the
    // requests without meaningfully growing the HTML.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (url) => !NOINDEX.has(new URL(url).pathname),
      i18n: {
        defaultLocale: 'pt',
        locales: {
          pt: 'pt-PT',
          en: 'en',
        },
      },
    }),
  ],
});
