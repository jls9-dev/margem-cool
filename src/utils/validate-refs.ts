/**
 * Build-time cross-reference validation.
 *
 * Astro's content collections enforce schema shape but cannot see across
 * files. This module loads every collection and verifies that fields
 * referencing other entities (parent_slug, place_slugs, translation_of,
 * venue_/organiser_establishment_slug) point to a real record of the right
 * kind. Anything broken throws at build time, which fails `astro build`.
 *
 * Identifiers are Astro's `entry.slug` values (derived from file paths).
 */

import { getCollection } from 'astro:content';

let cached: Promise<void> | null = null;

const VALID_PARENT_LEVELS: Record<string, ReadonlyArray<string>> = {
  concelho: [],
  freguesia: ['concelho'],
  bairro: ['freguesia'],
  lugar: ['freguesia', 'bairro'],
};

const SLUG_FORMAT = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

export function validateAllReferences(): Promise<void> {
  if (!cached) {
    cached = runValidation();
  }
  return cached;
}

async function runValidation(): Promise<void> {
  const [
    places,
    establishments,
    services,
    beaches,
    events,
    articles,
  ] = await Promise.all([
    getCollection('places'),
    getCollection('establishments'),
    getCollection('services'),
    getCollection('beaches'),
    getCollection('events'),
    getCollection('articles'),
  ]);

  const placeBySlug = new Map(places.map((p) => [p.slug, p]));
  const establishmentBySlug = new Map(establishments.map((e) => [e.slug, e]));
  const articlesByLangSlug = new Map(
    articles.map((a) => [`${a.data.language}:${a.slug}`, a]),
  );

  const errors: string[] = [];

  // Slug format — applies to every entity
  const allEntities: Array<{ kind: string; slug: string }> = [
    ...places.map((p) => ({ kind: 'place', slug: p.slug })),
    ...establishments.map((e) => ({ kind: 'establishment', slug: e.slug })),
    ...services.map((s) => ({ kind: 'service', slug: s.slug })),
    ...beaches.map((b) => ({ kind: 'beach', slug: b.slug })),
    ...events.map((e) => ({ kind: 'event', slug: e.slug })),
    ...articles.map((a) => ({ kind: 'article', slug: a.slug })),
  ];
  for (const { kind, slug } of allEntities) {
    if (!SLUG_FORMAT.test(slug)) {
      errors.push(`${kind} slug "${slug}" is invalid — must be lowercase ASCII, hyphens, optional slash for nesting.`);
    }
  }

  // Place parent_slug rules
  for (const place of places) {
    const { level, parent_slug } = place.data;
    if (level === 'concelho') {
      if (parent_slug) {
        errors.push(`Place "${place.slug}" is a concelho but has parent_slug "${parent_slug}".`);
      }
      continue;
    }
    if (!parent_slug) {
      errors.push(`Place "${place.slug}" (${level}) is missing required parent_slug.`);
      continue;
    }
    const parent = placeBySlug.get(parent_slug);
    if (!parent) {
      errors.push(`Place "${place.slug}" has parent_slug "${parent_slug}" which does not exist.`);
      continue;
    }
    const allowedParentLevels = VALID_PARENT_LEVELS[level];
    if (!allowedParentLevels.includes(parent.data.level)) {
      errors.push(
        `Place "${place.slug}" is a ${level} but its parent "${parent_slug}" is a ${parent.data.level} ` +
        `(allowed: ${allowedParentLevels.join(', ')}).`,
      );
    }
  }

  // Establishment place_slugs
  for (const est of establishments) {
    for (const ps of est.data.place_slugs) {
      if (!placeBySlug.has(ps)) {
        errors.push(`Establishment "${est.slug}" references unknown place "${ps}".`);
      }
    }
  }

  // Service service_area_slugs
  for (const svc of services) {
    for (const ps of svc.data.service_area_slugs) {
      if (!placeBySlug.has(ps)) {
        errors.push(`Service "${svc.slug}" references unknown place "${ps}".`);
      }
    }
  }

  // Beach place_slugs
  for (const beach of beaches) {
    for (const ps of beach.data.place_slugs) {
      if (!placeBySlug.has(ps)) {
        errors.push(`Beach "${beach.slug}" references unknown place "${ps}".`);
      }
    }
  }

  // Events place_slugs, venue, organiser
  for (const ev of events) {
    for (const ps of ev.data.place_slugs) {
      if (!placeBySlug.has(ps)) {
        errors.push(`Event "${ev.slug}" references unknown place "${ps}".`);
      }
    }
    if (ev.data.venue_establishment_slug && !establishmentBySlug.has(ev.data.venue_establishment_slug)) {
      errors.push(`Event "${ev.slug}" references unknown venue establishment "${ev.data.venue_establishment_slug}".`);
    }
    if (ev.data.organiser_establishment_slug && !establishmentBySlug.has(ev.data.organiser_establishment_slug)) {
      errors.push(`Event "${ev.slug}" references unknown organiser establishment "${ev.data.organiser_establishment_slug}".`);
    }
  }

  // Articles: translation_of + place_slugs + establishment_slugs
  for (const article of articles) {
    if (article.data.language === 'en' && !article.data.translation_of) {
      errors.push(`English article "${article.slug}" must have a translation_of pointing to a Portuguese original.`);
    }
    if (article.data.translation_of) {
      const ptKey = `pt:${article.data.translation_of}`;
      if (!articlesByLangSlug.has(ptKey)) {
        errors.push(`Article "${article.data.language}:${article.slug}" has translation_of "${article.data.translation_of}" but no Portuguese original found.`);
      }
    }
    for (const ps of article.data.place_slugs ?? []) {
      if (!placeBySlug.has(ps)) {
        errors.push(`Article "${article.data.language}:${article.slug}" references unknown place "${ps}".`);
      }
    }
    for (const es of article.data.establishment_slugs ?? []) {
      if (!establishmentBySlug.has(es)) {
        errors.push(`Article "${article.data.language}:${article.slug}" references unknown establishment "${es}".`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Cross-reference validation failed with ${errors.length} error(s):\n  - ` +
      errors.join('\n  - '),
    );
  }
}
