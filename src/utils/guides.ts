/**
 * Guide URLs and pillar labels.
 *
 * Guides live under /guias/ (PT) and /en/guides/ (EN) rather than nested
 * inside their pillar path. The pillar is still the guide's home — it names
 * the breadcrumb and the pillar page lists it — but keeping the URL flat means
 * a guide can be re-filed without a redirect, and it keeps the pillar
 * directories free for the landing pages that already sit there.
 */
import type { CollectionEntry } from 'astro:content';
import type { Pillar } from '../content/config';
import type { Lang } from './i18n';

// Paths live in pillars.mjs so the build config can read the same mapping.
export { PILLAR_PATH } from './pillars.mjs';

export const PILLAR_LABEL: Record<Lang, Record<Pillar, string>> = {
  pt: {
    comer_beber: 'Comer & Beber',
    praia_natureza: 'Praia & Natureza',
    lugares_bairros: 'Lugares & Bairros',
    cultura_agenda: 'Cultura & Agenda',
    viver_aqui: 'Viver Aqui',
    dormir: 'Dormir',
    recomenda: 'Recomenda',
  },
  en: {
    comer_beber: 'Eat & Drink',
    praia_natureza: 'Beach & Outdoors',
    lugares_bairros: 'Places & Neighbourhoods',
    cultura_agenda: 'Culture & What’s On',
    viver_aqui: 'Living Here',
    dormir: 'Where to Stay',
    recomenda: 'Recommends',
  },
};

/** Slug without the leading `pt/` or `en/` directory the collection uses. */
export function guideSlug(article: CollectionEntry<'articles'>): string {
  return article.slug.replace(/^(pt|en)\//, '');
}

export function guidePath(article: CollectionEntry<'articles'>): string {
  const slug = guideSlug(article);
  return article.data.language === 'pt' ? `/guias/${slug}/` : `/en/guides/${slug}/`;
}

/** Guides that should be built and indexed — drafts never reach the site. */
export function publishable(articles: CollectionEntry<'articles'>[]) {
  return articles.filter((a) => !a.data.draft);
}
