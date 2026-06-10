/**
 * Language and URL helpers.
 *
 * Portuguese is the host language at the root path. English sits under /en/.
 * Place slugs are always Portuguese, even on English pages.
 */

export type Lang = 'pt' | 'en';

export const SITE_URL = 'https://margemcool.pt';

export const PILLARS = [
  {
    id: 'comer_beber',
    pt: { slug: 'comer-e-beber', label: 'Comer & Beber' },
    en: { slug: 'eat-and-drink', label: 'Eat & Drink' },
  },
  {
    id: 'praia_natureza',
    pt: { slug: 'praia-e-natureza', label: 'Praia & Natureza' },
    en: { slug: 'beach-and-outdoors', label: 'Beach & Outdoors' },
  },
  {
    id: 'lugares_bairros',
    pt: { slug: 'lugares-e-bairros', label: 'Lugares & Bairros' },
    en: { slug: 'places-and-neighbourhoods', label: 'Places & Neighbourhoods' },
  },
  {
    id: 'cultura_agenda',
    pt: { slug: 'cultura-e-agenda', label: 'Cultura & Agenda' },
    en: { slug: 'culture-and-whats-on', label: 'Culture & What’s On' },
  },
  {
    id: 'viver_aqui',
    pt: { slug: 'viver-aqui', label: 'Viver Aqui' },
    en: { slug: 'living-here', label: 'Living Here' },
  },
  {
    id: 'dormir',
    pt: { slug: 'dormir', label: 'Dormir' },
    en: { slug: 'where-to-stay', label: 'Where to Stay' },
  },
] as const;

export const PRIMARY_NAV = {
  pt: [
    { href: '/lugares/', label: 'Lugares' },
    { href: '/comer-e-beber/', label: 'Comer & Beber' },
    { href: '/praia-e-natureza/', label: 'Praia & Natureza' },
    { href: '/cultura-e-agenda/', label: 'Cultura' },
    { href: '/viver-aqui/', label: 'Viver Aqui' },
    { href: '/sobre/', label: 'Sobre' },
  ],
  en: [
    { href: '/en/places/', label: 'Places' },
    { href: '/en/eat-and-drink/', label: 'Eat & Drink' },
    { href: '/en/beach-and-outdoors/', label: 'Beach & Outdoors' },
    { href: '/en/culture-and-whats-on/', label: 'Culture' },
    { href: '/en/living-here/', label: 'Living Here' },
    { href: '/en/about/', label: 'About' },
  ],
} as const;

export const FOOTER_NAV = {
  pt: {
    pillars: {
      heading: 'Pilares',
      links: [
        { href: '/comer-e-beber/', label: 'Comer & Beber' },
        { href: '/praia-e-natureza/', label: 'Praia & Natureza' },
        { href: '/lugares-e-bairros/', label: 'Lugares & Bairros' },
        { href: '/cultura-e-agenda/', label: 'Cultura & Agenda' },
        { href: '/viver-aqui/', label: 'Viver Aqui' },
        { href: '/dormir/', label: 'Dormir' },
      ],
    },
    publication: {
      heading: 'A publicação',
      links: [
        { href: '/sobre/', label: 'Sobre' },
        { href: '/contacto/', label: 'Contacto' },
        { href: '/parcerias/', label: 'Parcerias' },
        { href: '/privacidade/', label: 'Privacidade' },
      ],
    },
  },
  en: {
    pillars: {
      heading: 'Pillars',
      links: [
        { href: '/en/eat-and-drink/', label: 'Eat & Drink' },
        { href: '/en/beach-and-outdoors/', label: 'Beach & Outdoors' },
        { href: '/en/places-and-neighbourhoods/', label: 'Places & Neighbourhoods' },
        { href: '/en/culture-and-whats-on/', label: 'Culture & What’s On' },
        { href: '/en/living-here/', label: 'Living Here' },
        { href: '/en/where-to-stay/', label: 'Where to Stay' },
      ],
    },
    publication: {
      heading: 'The publication',
      links: [
        { href: '/en/about/', label: 'About' },
        { href: '/en/contact/', label: 'Contact' },
        { href: '/en/partnerships/', label: 'Partnerships' },
        { href: '/en/privacy/', label: 'Privacy' },
      ],
    },
  },
} as const;

export function htmlLang(lang: Lang): string {
  return lang === 'pt' ? 'pt-PT' : 'en';
}

/**
 * Build the canonical URL for a Place by walking its parent_slug chain.
 * concelho -> /lugares/{concelho}/
 * freguesia -> /lugares/{concelho}/{freguesia}/
 * bairro -> /lugares/{concelho}/{freguesia}/{bairro}/
 */
export function placeUrl(
  lang: Lang,
  slug: string,
  parentChain: string[] = [],
): string {
  const root = lang === 'pt' ? '/lugares' : '/en/places';
  const parts = [...parentChain, slug].filter(Boolean);
  return `${root}/${parts.join('/')}/`;
}
