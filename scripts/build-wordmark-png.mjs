// Generate PNG versions of the wordmark for print and merch services
// (YoyCol, Printful, etc.) that don't handle our SVG with embedded
// prefers-color-scheme styles.
//
// Strips the <style> block and replaces CSS classes with inline fills so
// the SVG sharp consumes is simple and unambiguous, then rasterises at
// print-ready resolution on a transparent background.

import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public');
const PRINT_DIR = join(ROOT, 'public', 'brand');
await mkdir(PRINT_DIR, { recursive: true });

const INK_LIGHT = '#1F2328'; // charcoal — for light backgrounds
const INK_DARK = '#F5F1E8';  // cream — for dark backgrounds
const RUST_LIGHT = '#B85C38';
const RUST_DARK = '#D17347';

function flatten(svg, { ink, rust }) {
  return svg
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replaceAll('class="mc-ink"', `fill="${ink}"`)
    .replaceAll('class="mc-rust-fill"', `fill="${rust}"`)
    .replaceAll('class="mc-rust-stroke"', `stroke="${rust}"`);
}

async function makePng(srcPath, outName, widthPx, colors) {
  const svg = await readFile(srcPath, 'utf8');
  const flat = flatten(svg, colors);
  const outPath = join(PRINT_DIR, outName);
  await sharp(Buffer.from(flat))
    .resize({ width: widthPx })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`wrote ${outPath}`);
}

async function makeFlatSvg(srcPath, outName, colors) {
  const svg = await readFile(srcPath, 'utf8');
  const flat = flatten(svg, colors);
  const outPath = join(PRINT_DIR, outName);
  await writeFile(outPath, flat);
  console.log(`wrote ${outPath}`);
}

const wordmarkSvg = join(OUT_DIR, 'wordmark.svg');
const stackedSvg = join(OUT_DIR, 'wordmark-stacked.svg');

// Print-ready PNG (~3600px wide is overkill but safe for any print job)
const PRINT_WIDTH = 3600;

await makePng(wordmarkSvg, 'wordmark-light.png', PRINT_WIDTH,
  { ink: INK_LIGHT, rust: RUST_LIGHT });
await makePng(wordmarkSvg, 'wordmark-dark.png', PRINT_WIDTH,
  { ink: INK_DARK, rust: RUST_DARK });

await makePng(stackedSvg, 'wordmark-stacked-light.png', PRINT_WIDTH,
  { ink: INK_LIGHT, rust: RUST_LIGHT });
await makePng(stackedSvg, 'wordmark-stacked-dark.png', PRINT_WIDTH,
  { ink: INK_DARK, rust: RUST_DARK });

// Also write flat-colour SVGs (no <style> block, no classes) for services
// that accept SVG but choke on embedded stylesheets
await makeFlatSvg(wordmarkSvg, 'wordmark-light.svg',
  { ink: INK_LIGHT, rust: RUST_LIGHT });
await makeFlatSvg(wordmarkSvg, 'wordmark-dark.svg',
  { ink: INK_DARK, rust: RUST_DARK });
await makeFlatSvg(stackedSvg, 'wordmark-stacked-light.svg',
  { ink: INK_LIGHT, rust: RUST_LIGHT });
await makeFlatSvg(stackedSvg, 'wordmark-stacked-dark.svg',
  { ink: INK_DARK, rust: RUST_DARK });

console.log('\nDone. Files in public/brand/');
