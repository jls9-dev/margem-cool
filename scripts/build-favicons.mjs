#!/usr/bin/env node
/**
 * build-favicons.mjs
 *
 * Composes the Margem Cool favicon from the Margem Sul silhouette + the
 * wordmark river curve. Writes:
 *
 *   public/favicon.svg               — transparent SVG (modern browsers)
 *   public/favicon-32.png            — 32×32 PNG (some legacy contexts)
 *   public/favicon-16.png            — 16×16 PNG
 *   public/apple-touch-icon.png      — 180×180 PNG on cream rounded square
 *   public/brand/share-card.svg      — 1200×630 OG card variant (silhouette + wordmark)
 *
 * Source: src/data/geo/concelhos.json → silhouette.paths.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'src', 'data', 'geo', 'concelhos.json');

const RUST = '#B85C38';
const RUST_DEEP = '#9D4421';
const CREAM = '#F5F1E8';
const INK = '#1F2328';

const FAVICON_SIZE = 100;
const SIL_PADDING = 11;
const SIL_TOP = 11;

/** Returns transform attrs that fit the silhouette ring into a target rect. */
function silhouetteTransform(silViewBox, targetX, targetY, targetW, targetH) {
  const [vbX, vbY, vbW, vbH] = silViewBox;
  const sx = targetW / vbW;
  const sy = targetH / vbH;
  const s = Math.min(sx, sy);
  const drawW = vbW * s;
  const drawH = vbH * s;
  const tx = targetX + (targetW - drawW) / 2 - vbX * s;
  const ty = targetY + (targetH - drawH) / 2 - vbY * s;
  return { transform: `translate(${tx} ${ty}) scale(${s})`, drawW, drawH };
}

async function main() {
  const data = JSON.parse(await readFile(DATA, 'utf8'));
  const { silhouette } = data;
  const silPath = silhouette.paths.join(' ');

  // ───────── 1. favicon.svg — silhouette filling the square ─────────
  // Just the shape: no separate river curve. The silhouette's top edge
  // already IS the Tejo coast, so the river is implied by geography.
  //
  // For maximum tab presence we set the SVG's viewBox to the silhouette's
  // actual bounding box (not a padded square). The silhouette fills 100%
  // of the viewBox width; the browser preserves aspect and letterboxes
  // vertically (the silhouette is ~1.38:1 wider than tall). Net effect:
  // the rust shape is ~6% larger in the tab than the old padded version.
  const [vbX, vbY, vbW, vbH] = silhouette.viewBox;

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" role="img" aria-label="Margem Cool">
  <title>Margem Cool</title>
  <path d="${silPath}" fill="${RUST}"/>
</svg>
`;

  await writeFile(join(ROOT, 'public', 'favicon.svg'), faviconSvg);

  // For 16 and 32 PNG, render the favicon SVG.
  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile(join(ROOT, 'public', 'favicon-32.png'));
  await sharp(Buffer.from(faviconSvg)).resize(16, 16).png().toFile(join(ROOT, 'public', 'favicon-16.png'));

  // ───────── 2. apple-touch-icon — cream rounded square, silhouette + river ─────────
  const touchSize = 180;
  const padding = 24;
  const innerW = touchSize - padding * 2;
  const innerH = innerW * 0.58;
  const innerY = padding + 4;
  const touchSil = silhouetteTransform(silhouette.viewBox, padding, innerY, innerW, innerH);

  const touchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${touchSize} ${touchSize}">
  <defs>
    <clipPath id="rr">
      <rect x="0" y="0" width="${touchSize}" height="${touchSize}" rx="38" ry="38"/>
    </clipPath>
  </defs>
  <g clip-path="url(#rr)">
    <rect width="${touchSize}" height="${touchSize}" fill="${CREAM}"/>
    <g transform="${touchSil.transform}">
      <path d="${silPath}" fill="${RUST}"/>
    </g>
    <path
      d="M 22 142 C 56 158, 92 122, 112 142 S 152 162, 162 138"
      fill="none"
      stroke="${RUST}"
      stroke-width="11"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>
`;
  await sharp(Buffer.from(touchSvg)).png().toFile(join(ROOT, 'public', 'apple-touch-icon.png'));

  // ───────── 3. Share card 1200×630 — silhouette mark + wordmark-style title ─────────
  const cardW = 1200;
  const cardH = 630;
  const cardSilTarget = { w: 360, h: 280 };
  const cardSil = silhouetteTransform(
    silhouette.viewBox,
    cardW - cardSilTarget.w - 80,
    (cardH - cardSilTarget.h) / 2,
    cardSilTarget.w,
    cardSilTarget.h,
  );

  const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardW} ${cardH}">
  <rect width="${cardW}" height="${cardH}" fill="${CREAM}"/>
  <text x="80" y="280" font-family="Georgia, serif" font-weight="600" font-size="120" fill="${INK}" letter-spacing="-2">margem cool</text>
  <path
    d="M 80 318 C 220 360, 360 270, 500 338 S 700 290, 830 318"
    fill="none" stroke="${RUST}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"
  />
  <text x="80" y="430" font-family="Georgia, serif" font-style="italic" font-size="34" fill="${INK}" opacity="0.7">A Margem Sul, por dentro.</text>
  <g transform="${cardSil.transform}">
    <path d="${silPath}" fill="${RUST}" opacity="0.92"/>
  </g>
</svg>
`;
  await writeFile(join(ROOT, 'public', 'brand', 'share-card.svg'), shareSvg);
  await sharp(Buffer.from(shareSvg)).png().toFile(join(ROOT, 'public', 'brand', 'share-card.png'));

  console.log('Wrote:');
  console.log('  public/favicon.svg');
  console.log('  public/favicon-32.png');
  console.log('  public/favicon-16.png');
  console.log('  public/apple-touch-icon.png');
  console.log('  public/brand/share-card.svg + .png (1200x630)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
