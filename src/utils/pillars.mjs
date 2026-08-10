/**
 * The pillar landing pages, by language.
 *
 * Lives in .mjs so both the TypeScript side (src/utils/guides.ts, the layouts)
 * and the build config (astro.config.mjs via src/utils/indexable.mjs) read the
 * same mapping. A pillar path written down twice is a pillar path that will
 * disagree with itself eventually.
 */
export const PILLAR_PATH = {
  pt: {
    comer_beber: '/comer-e-beber/',
    praia_natureza: '/praia-e-natureza/',
    lugares_bairros: '/lugares-e-bairros/',
    cultura_agenda: '/cultura-e-agenda/',
    viver_aqui: '/viver-aqui/',
    dormir: '/dormir/',
    recomenda: '/guias/',
  },
  en: {
    comer_beber: '/en/eat-and-drink/',
    praia_natureza: '/en/beach-and-outdoors/',
    lugares_bairros: '/en/places-and-neighbourhoods/',
    cultura_agenda: '/en/culture-and-whats-on/',
    viver_aqui: '/en/living-here/',
    dormir: '/en/where-to-stay/',
    recomenda: '/en/guides/',
  },
};

/** The guides index for each language. */
export const GUIDES_INDEX = { pt: '/guias/', en: '/en/guides/' };
