// Standalone wordmark SVG generator.
//
// Traces "margem coo" from the Outfit 600 webfont via opentype.js, then
// composes the l-stem and the river curve as two additional rust-coloured
// paths. Output is a paths-only SVG — no font dependency at render time.
//
// Run via: node scripts/build-wordmark-svg.mjs
// Writes: public/wordmark.svg and public/wordmark-stacked.svg

import opentypeNs from 'opentype.js';
import { readFile } from 'node:fs/promises';
const opentype = opentypeNs.default ?? opentypeNs;
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FONT_PATH = '/tmp/outfit-600.woff';  // static SemiBold from fontsource
const OUT_DIR = join(ROOT, 'public');

// Colour tokens. The SVG carries a <style> block so it adapts in dark mode
// when loaded via <img>, matching the page tokens.
const INK_LIGHT = '#1F2328';      // charcoal — letters on cream
const INK_DARK = '#F5F1E8';       // cream — letters on charcoal
const RUST_LIGHT = '#B85C38';
const RUST_DARK = '#D17347';

const STYLE_BLOCK = `<style>
    .mc-ink { fill: ${INK_LIGHT}; }
    .mc-rust-fill { fill: ${RUST_LIGHT}; }
    .mc-rust-stroke { stroke: ${RUST_LIGHT}; }
    @media (prefers-color-scheme: dark) {
      .mc-ink { fill: ${INK_DARK}; }
      .mc-rust-fill { fill: ${RUST_DARK}; }
      .mc-rust-stroke { stroke: ${RUST_DARK}; }
    }
  </style>`;

if (!existsSync(FONT_PATH)) {
  throw new Error(`Font file not found at ${FONT_PATH}. Re-download Outfit 600.`);
}

const fontBuffer = await readFile(FONT_PATH);
const font = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));
const FONT_SIZE = 100;  // anchor size in SVG units; the viewBox scales

// Walk character-by-character via charToGlyph (the higher-level getPath has a
// CCMP bug on this font build). Render each glyph at origin then translate via
// an SVG transform — calling getPath twice on the same glyph object with
// different x values can produce NaN control points in opentype.js.
function glyphsToPathData(text, startX, baselineY) {
  let x = startX;
  const segments = [];
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    if (char !== ' ') {
      const d = glyph.getPath(0, baselineY, FONT_SIZE).toPathData(2);
      if (d) segments.push(`<g transform="translate(${x.toFixed(2)} 0)"><path d="${d}"/></g>`);
    }
    x += (glyph.advanceWidth / font.unitsPerEm) * FONT_SIZE;
  }
  return { svg: segments.join(''), endX: x };
}

function measureText(text) {
  let x = 0;
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    x += (glyph.advanceWidth / font.unitsPerEm) * FONT_SIZE;
  }
  return { width: x, x1: 0, x2: x };
}

// ----- HORIZONTAL WORDMARK -----
// "margem coo" + custom l-stem + river curve
{
  const baselineY = FONT_SIZE * 0.85;
  const cooText = 'margem coo';
  const cooGlyphs = glyphsToPathData(cooText, 0, baselineY).svg;
  const cooMetrics = measureText(cooText);

  // l-stem: a vertical bar with rounded caps, sitting flush against the trailing o.
  // In Outfit 600 the lowercase l has approximately the same x-height ascender as
  // the other tall characters, with a stem-width roughly stem-of-coo.
  const lX = cooMetrics.x2 + FONT_SIZE * 0.06;   // small kerning gap
  const lStemTop = baselineY - FONT_SIZE * 0.78; // l reaches above x-height
  const lStemBottom = baselineY - FONT_SIZE * 0.02;
  const lStemWidth = FONT_SIZE * 0.13;            // matches Outfit 600 stem weight

  // River curve — starts at bottom of l, sweeps right with one rise and one fall.
  const riverStartX = lX + lStemWidth / 2;
  const riverStartY = lStemBottom;
  const riverEndX = riverStartX + FONT_SIZE * 2.8;  // ~1.5x wordmark widths beyond
  const c1x = riverStartX + FONT_SIZE * 0.4;
  const c1y = riverStartY + FONT_SIZE * 0.20;
  const c2x = riverStartX + FONT_SIZE * 0.95;
  const c2y = riverStartY - FONT_SIZE * 0.18;
  const c3x = riverStartX + FONT_SIZE * 1.5;
  const c3y = riverStartY + FONT_SIZE * 0.15;
  const c4x = riverStartX + FONT_SIZE * 2.1;
  const c4y = riverStartY - FONT_SIZE * 0.06;

  const riverPath =
    `M ${riverStartX.toFixed(2)} ${riverStartY.toFixed(2)} ` +
    `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ` +
    `${c3x.toFixed(2)} ${c3y.toFixed(2)} ` +
    `S ${c4x.toFixed(2)} ${c4y.toFixed(2)}, ${riverEndX.toFixed(2)} ${riverStartY.toFixed(2)}`;

  // l-stem as a rounded rect
  const lStemPath =
    `M ${(lX).toFixed(2)} ${lStemTop.toFixed(2)} ` +
    `L ${(lX).toFixed(2)} ${lStemBottom.toFixed(2)} ` +
    `Q ${(lX + lStemWidth / 2).toFixed(2)} ${(lStemBottom + lStemWidth * 0.3).toFixed(2)} ` +
    `${(lX + lStemWidth).toFixed(2)} ${lStemBottom.toFixed(2)} ` +
    `L ${(lX + lStemWidth).toFixed(2)} ${lStemTop.toFixed(2)} ` +
    `Q ${(lX + lStemWidth / 2).toFixed(2)} ${(lStemTop - lStemWidth * 0.3).toFixed(2)} ` +
    `${(lX).toFixed(2)} ${lStemTop.toFixed(2)} Z`;

  // Bottom must clear the deepest bezier control point including the implicit
  // control of the smooth-cubic (S) continuation, which is the reflection of
  // the prior control across the previous endpoint. Pad by stroke-width + 8px.
  const sReflectedY = 2 * c3y - c2y;
  const deepest = Math.max(c1y, c2y, c3y, c4y, sReflectedY, riverStartY);
  const vbX = -2;
  const vbY = baselineY - FONT_SIZE * 0.85 - 4;
  const vbW = riverEndX + 6;
  const vbH = (deepest + lStemWidth + 8) - vbY;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img" aria-label="margem cool">
  ${STYLE_BLOCK}
  <g class="mc-ink">${cooGlyphs}</g>
  <path class="mc-rust-fill" d="${lStemPath}"/>
  <path class="mc-rust-stroke" d="${riverPath}" fill="none" stroke-width="${(lStemWidth).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'wordmark.svg'), svg);
  console.log(`wrote public/wordmark.svg — viewBox ${vbW.toFixed(0)}×${vbH.toFixed(0)}`);
}

// ----- STACKED WORDMARK (hero use) -----
// "margem" on top, "coo" on bottom, l-stem rises through both lines, river off the right.
{
  const fontSize = FONT_SIZE;
  const lineGap = fontSize * 0.05;
  const topBaseY = fontSize * 0.85;
  const botBaseY = topBaseY + fontSize + lineGap;

  const margemGlyphs = glyphsToPathData('margem', 0, topBaseY).svg;
  const cooGlyphs = glyphsToPathData('coo', 0, botBaseY).svg;
  const cooMetrics = measureText('coo');

  const lX = cooMetrics.x2 + fontSize * 0.06;
  const lStemTop = botBaseY - fontSize * 0.78;
  const lStemBottom = botBaseY - fontSize * 0.02;
  const lStemWidth = fontSize * 0.13;

  const riverStartX = lX + lStemWidth / 2;
  const riverStartY = lStemBottom;
  const riverEndX = riverStartX + fontSize * 3.2;
  const c1x = riverStartX + fontSize * 0.5;
  const c1y = riverStartY + fontSize * 0.22;
  const c2x = riverStartX + fontSize * 1.1;
  const c2y = riverStartY - fontSize * 0.20;
  const c3x = riverStartX + fontSize * 1.7;
  const c3y = riverStartY + fontSize * 0.16;
  const c4x = riverStartX + fontSize * 2.4;
  const c4y = riverStartY - fontSize * 0.06;

  const riverPath =
    `M ${riverStartX.toFixed(2)} ${riverStartY.toFixed(2)} ` +
    `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ` +
    `${c3x.toFixed(2)} ${c3y.toFixed(2)} ` +
    `S ${c4x.toFixed(2)} ${c4y.toFixed(2)}, ${riverEndX.toFixed(2)} ${riverStartY.toFixed(2)}`;

  const lStemPath =
    `M ${(lX).toFixed(2)} ${lStemTop.toFixed(2)} ` +
    `L ${(lX).toFixed(2)} ${lStemBottom.toFixed(2)} ` +
    `Q ${(lX + lStemWidth / 2).toFixed(2)} ${(lStemBottom + lStemWidth * 0.3).toFixed(2)} ` +
    `${(lX + lStemWidth).toFixed(2)} ${lStemBottom.toFixed(2)} ` +
    `L ${(lX + lStemWidth).toFixed(2)} ${lStemTop.toFixed(2)} ` +
    `Q ${(lX + lStemWidth / 2).toFixed(2)} ${(lStemTop - lStemWidth * 0.3).toFixed(2)} ` +
    `${(lX).toFixed(2)} ${lStemTop.toFixed(2)} Z`;

  const sReflectedY = 2 * c3y - c2y;
  const deepest = Math.max(c1y, c2y, c3y, c4y, sReflectedY, riverStartY);
  const vbX = -2;
  const vbY = topBaseY - fontSize * 0.85 - 4;
  const vbW = riverEndX + 6;
  const vbH = (deepest + lStemWidth + 8) - vbY;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img" aria-label="margem cool">
  ${STYLE_BLOCK}
  <g class="mc-ink">${margemGlyphs}${cooGlyphs}</g>
  <path class="mc-rust-fill" d="${lStemPath}"/>
  <path class="mc-rust-stroke" d="${riverPath}" fill="none" stroke-width="${(lStemWidth).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
  await writeFile(join(OUT_DIR, 'wordmark-stacked.svg'), svg);
  console.log(`wrote public/wordmark-stacked.svg — viewBox ${vbW.toFixed(0)}×${vbH.toFixed(0)}`);
}
