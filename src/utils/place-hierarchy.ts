/**
 * Place hierarchy helpers.
 *
 * A Place's identifier is `entry.slug` — automatically derived by Astro from
 * the file path inside `src/content/places/`. So `places/almada.md` has slug
 * `almada` and `places/almada/cacilhas.md` has slug `almada/cacilhas`. The
 * directory layout doubles as both the URL hierarchy and the identifier.
 *
 * parent_slug fields reference the parent's `entry.slug` value directly.
 */

import type { CollectionEntry } from 'astro:content';

type Place = CollectionEntry<'places'>;

export function indexBySlug(places: Place[]): Map<string, Place> {
  return new Map(places.map((p) => [p.slug, p]));
}

export function ancestorChain(place: Place, byId: Map<string, Place>): Place[] {
  const chain: Place[] = [];
  let current: Place | undefined = place;
  while (current?.data.parent_slug) {
    const parent = byId.get(current.data.parent_slug);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function childrenOf(slug: string, places: Place[]): Place[] {
  return places.filter((p) => p.data.parent_slug === slug);
}

export function concelhos(places: Place[]): Place[] {
  return places
    .filter((p) => p.data.level === 'concelho')
    .sort((a, b) => a.data.name_pt.localeCompare(b.data.name_pt, 'pt'));
}
