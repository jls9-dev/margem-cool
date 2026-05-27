import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://margemcool.pt';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: {
    format: 'directory',
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
