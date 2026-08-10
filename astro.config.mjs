import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://margemcool.pt';

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
