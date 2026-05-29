/**
 * Schema.org JSON-LD generation for Place pages.
 *
 * Composes a Schema.org `@graph` for a Place entry with:
 *   - AdministrativeArea (for concelho/freguesia) or Place (for bairro/lugar),
 *     including containedInPlace pointing to the parent
 *   - BreadcrumbList from Home → Lugares → ancestors → this place
 *   - Article — the page itself, with datePublished, dateModified, author, publisher
 *   - FAQPage — if the place has FAQs in the requested language
 *
 * Builds in pure data — no Astro globals — so it can be tested in isolation.
 */

import type { CollectionEntry } from 'astro:content';
import type { Lang } from './i18n';
import { SITE_URL } from './i18n';

type Place = CollectionEntry<'places'>;

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BuildOptions {
  place: Place;
  lang: Lang;
  ancestors: Place[];   // root-to-immediate-parent order
  url: string;          // canonical absolute URL of this page
  publishedISO?: string;
}

export function buildPlaceJsonLd({ place, lang, ancestors, url, publishedISO }: BuildOptions): object[] {
  const langCode = lang === 'pt' ? 'pt-PT' : 'en';
  const displayName = lang === 'en'
    ? (place.data.name_en ?? place.data.name_pt)
    : place.data.name_pt;
  const description = lang === 'en'
    ? place.data.en.short_description
    : place.data.pt.short_description;
  const faqs = lang === 'en'
    ? place.data.en.faqs
    : place.data.pt.faqs;

  const graph: object[] = [];

  // 1. The place itself
  graph.push(placeEntity({ place, lang, displayName, description, ancestors, url, langCode }));

  // 2. Breadcrumbs
  graph.push(breadcrumbList(buildBreadcrumbs({ place, lang, ancestors, url, displayName })));

  // 3. Article wrapping the page content
  graph.push(articleEntity({ displayName, description, url, lang, langCode, publishedISO, place }));

  // 4. FAQPage — only if there are any FAQs
  if (faqs && faqs.length > 0) {
    graph.push(faqPage(faqs));
  }

  return graph;
}

function placeEntity({
  place, lang, displayName, description, ancestors, url, langCode,
}: {
  place: Place;
  lang: Lang;
  displayName: string;
  description: string;
  ancestors: Place[];
  url: string;
  langCode: string;
}) {
  const type = place.data.level === 'concelho' || place.data.level === 'freguesia'
    ? 'AdministrativeArea'
    : 'Place';

  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': url,
    name: displayName,
    inLanguage: langCode,
    url,
    description,
  };

  if (ancestors.length > 0) {
    const parent = ancestors[ancestors.length - 1];
    const parentName = lang === 'en'
      ? (parent.data.name_en ?? parent.data.name_pt)
      : parent.data.name_pt;
    obj.containedInPlace = {
      '@type': 'AdministrativeArea',
      name: parentName,
    };
  }

  if (place.data.geo?.centroid) {
    obj.geo = {
      '@type': 'GeoCoordinates',
      latitude: place.data.geo.centroid[0],
      longitude: place.data.geo.centroid[1],
    };
  }

  if (place.data.geo?.area_km2 != null) {
    obj.area = {
      '@type': 'QuantitativeValue',
      value: place.data.geo.area_km2,
      unitCode: 'KMK',  // ISO unit code for km^2
    };
  }

  if (place.data.population != null) {
    obj.populationStatistics = {
      '@type': 'QuantitativeValue',
      value: place.data.population,
      ...(place.data.population_year != null && { observationDate: String(place.data.population_year) }),
    };
  }

  if (place.data.hero_image) {
    obj.image = new URL(place.data.hero_image, SITE_URL).toString();
  }

  return obj;
}

function buildBreadcrumbs({
  place, lang, ancestors, url, displayName,
}: {
  place: Place;
  lang: Lang;
  ancestors: Place[];
  url: string;
  displayName: string;
}): BreadcrumbItem[] {
  const root = lang === 'pt' ? '/lugares/' : '/en/places/';
  const rootLabel = lang === 'pt' ? 'Lugares' : 'Places';

  const items: BreadcrumbItem[] = [
    { name: rootLabel, url: new URL(root, SITE_URL).toString() },
  ];

  for (const a of ancestors) {
    const name = lang === 'en' ? (a.data.name_en ?? a.data.name_pt) : a.data.name_pt;
    items.push({
      name,
      url: new URL(`${root}${a.slug}/`, SITE_URL).toString(),
    });
  }

  items.push({ name: displayName, url });
  return items;
}

function breadcrumbList(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
}

function articleEntity({
  displayName, description, url, lang, langCode, publishedISO, place,
}: {
  displayName: string;
  description: string;
  url: string;
  lang: Lang;
  langCode: string;
  publishedISO?: string;
  place: Place;
}) {
  const lastUpdatedISO = place.data.last_updated instanceof Date
    ? place.data.last_updated.toISOString()
    : new Date(place.data.last_updated).toISOString();

  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayName,
    description,
    inLanguage: langCode,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: publishedISO ?? lastUpdatedISO,
    dateModified: lastUpdatedISO,
    author: {
      '@type': 'Organization',
      name: 'Margem Cool',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Margem Cool',
      url: SITE_URL,
    },
  };

  if (place.data.hero_image) {
    obj.image = new URL(place.data.hero_image, SITE_URL).toString();
  }

  return obj;
}

function faqPage(faqs: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
