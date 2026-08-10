#!/usr/bin/env node
/**
 * Prepare a source photograph for use on a place page.
 *
 *   node scripts/prep-photo.mjs <source-file> <key> [--width 2400]
 *   npm run photo -- "~/Documents/south bank photos/IMG_6831.JPG" cacilhas-ginjal
 *
 * Writes src/assets/places/<key>.jpg, which place frontmatter then references
 * by key alone (`hero_image: "cacilhas-ginjal"`). Astro takes it from there,
 * generating the responsive AVIF/WebP variants at build time.
 *
 * Two things this exists to get right:
 *
 * 1. Orientation. The phone originals carry their rotation in EXIF. sips
 *    drops that tag while writing the pixels unrotated, which silently turns
 *    portrait photos on their side — a bug we have hit before. sharp's
 *    .rotate() with no argument applies the EXIF orientation to the pixels and
 *    then clears the tag, which is what we want.
 *
 * 2. Size. The originals are 6240px wide and several megabytes. Astro would
 *    happily process them, but every build would pay for it and the image
 *    cache would balloon. 2400px is more than any layout on the site asks for.
 *
 * EXIF is stripped on the way out — location metadata on a photo of someone's
 * street is not ours to publish.
 */
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import sharp from 'sharp';

const DEST_DIR = fileURLToPath(new URL('../src/assets/places/', import.meta.url));

const args = process.argv.slice(2);
const widthArg = args.indexOf('--width');
const maxWidth = widthArg === -1 ? 2400 : Number(args[widthArg + 1]);
const skip = widthArg === -1 ? new Set() : new Set([widthArg, widthArg + 1]);
const positional = args.filter((a, i) => !skip.has(i));
const [source, key] = positional;

if (!source || !key) {
  console.error('Usage: node scripts/prep-photo.mjs <source-file> <key> [--width 2400]');
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) {
  console.error(`Key "${key}" must be lower-case kebab — it becomes the filename and the frontmatter value.`);
  process.exit(1);
}

const sourcePath = resolve(source.replace(/^~/, homedir()));
try {
  await access(sourcePath);
} catch {
  console.error(`No such file: ${sourcePath}`);
  process.exit(1);
}

await mkdir(DEST_DIR, { recursive: true });
const destPath = resolve(DEST_DIR, `${key}.jpg`);

const input = sharp(sourcePath);
const { width: sourceWidth, height: sourceHeight } = await input.metadata();

const info = await input
  .rotate()
  .resize({ width: Math.min(maxWidth, sourceWidth), withoutEnlargement: true })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(destPath);

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)}MB`;
console.log(
  `${key}.jpg  ${sourceWidth}×${sourceHeight} → ${info.width}×${info.height}  ` +
  `(${mb(info.size)})\n` +
  `  reference it as:  hero_image: "${key}"   or   gallery src: "${key}"`,
);
