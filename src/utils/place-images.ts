/**
 * Resolving photo keys in place frontmatter to real image assets.
 *
 * Place entries name their photos by key — `hero_image: "cacilhas-ginjal"` —
 * rather than by path. The key maps to `src/assets/places/<key>.jpg`, which
 * Astro then processes into responsive AVIF/WebP variants.
 *
 * Why a key and not a relative path: place files sit at four different depths
 * in the content tree (concelho, freguesia, bairro, lugar), so a relative path
 * would be `../assets/…` on one page and `../../../../assets/…` on another —
 * the sort of detail that is wrong on the fiftieth page. A flat key is the
 * same everywhere, and a missing one is caught at build time rather than
 * rendering a broken image.
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/places/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const byKey = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(files)) {
  const key = path.split('/').pop()!.replace(/\.(jpg|jpeg|png|webp)$/, '');
  byKey.set(key, mod.default);
}

/** Every photo key available, for the build-time check and error messages. */
export function availableImageKeys(): string[] {
  return [...byKey.keys()].sort();
}

/**
 * Resolve a photo key. Throws rather than returning null — a place page that
 * names a photo it doesn't have is a mistake we want to hear about during the
 * build, not a silent gap on the published page.
 */
export function placeImage(key: string): ImageMetadata {
  const image = byKey.get(key);
  if (!image) {
    throw new Error(
      `Place photo "${key}" not found in src/assets/places/. ` +
      `Available: ${availableImageKeys().join(', ') || '(none yet)'}`,
    );
  }
  return image;
}

/** Resolve a key that may be absent, for optional heroes. */
export function optionalPlaceImage(key?: string): ImageMetadata | undefined {
  return key ? placeImage(key) : undefined;
}
