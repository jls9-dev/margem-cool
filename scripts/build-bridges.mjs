#!/usr/bin/env node
/**
 * build-bridges.mjs
 *
 * Bridges are hand-placed off Google Maps with five control points
 * each, drawn through a Catmull-Rom-to-cubic-Bezier curve. Pulling deck
 * geometry out of OSM bridge relations turns out to be a thankless
 * interpretation problem (deck members stop at the towers; extending
 * along local-segment direction kinks the line); five hand-placed
 * coordinates per bridge are faster, cleaner, and bridges don't move.
 *
 * Output: src/data/geo/bridges.json, consumed by MargemMap.astro.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const OUT = join(GEO_DIR, 'bridges.json');

async function main() {
  const concelhos = JSON.parse(await readFile(join(GEO_DIR, 'concelhos.json'), 'utf8'));
  const { bbox } = concelhos;
  const { padding, kLat, scale } = concelhos.project;
  const project = ([lng, lat]) => [
    padding + (lng - bbox.minLng) * kLat * scale,
    padding + (bbox.maxLat - lat) * scale,
  ];

  const out = [];

  // Bridges hand-placed off Google Maps with a handful of control
  // points per crossing, then drawn as a smooth Catmull-Rom cubic Bezier
  // path so the curve reads as a real bridge instead of a polyline.
  // Pulling deck geometry out of OSM bridge relations turns out to be
  // a thankless interpretation problem (the deck members stop at the
  // towers; extending them along local-segment direction kinks the line)
  // — hand-placing 5 points is faster and bridges don't move.
  const handBridges = [
    {
      id: 'ponte-25-abril',
      pt: 'Ponte 25 de Abril',
      en: '25 de Abril Bridge',
      // Alcântara approach → north tower → mid → south tower → Pragal approach
      points: [
        [-9.1768, 38.7035],
        [-9.1762, 38.6970],
        [-9.1755, 38.6906],
        [-9.1748, 38.6845],
        [-9.1741, 38.6783],
      ],
    },
    {
      id: 'ponte-vasco-da-gama',
      pt: 'Ponte Vasco da Gama',
      en: 'Vasco da Gama Bridge',
      // Sacavém anchor → cable-stayed mast → mid-viaduct → curve → Sarilhos anchor
      points: [
        [-9.0413, 38.7747],
        [-9.0349, 38.7587],
        [-9.0150, 38.7378],
        [-8.9870, 38.7180],
        [-8.9690, 38.7080],
      ],
    },
  ];

  // Catmull-Rom → cubic Bezier through the control points. Tension 0.5
  // gives a balanced curve with no overshoot.
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    const n = pts.length;
    const get = (i) => pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }

  for (const b of handBridges) {
    const projected = b.points.map(project);
    out.push({
      id: b.id,
      pt: b.pt,
      en: b.en,
      shape: 'line',
      d: smoothPath(projected),
    });
  }

  // Compute a label anchor and rotation per bridge from the path geometry.
  for (const b of out) {
    const coords = b.d.match(/-?\d+\.\d+/g).map(Number);
    const xs = coords.filter((_, i) => i % 2 === 0);
    const ys = coords.filter((_, i) => i % 2 === 1);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    // Rotation from endpoints (or PCA-ish from extent).
    const dx = Math.max(...xs) - Math.min(...xs);
    const dy = Math.max(...ys) - Math.min(...ys);
    b.labelXY = [midX, midY];
    b.labelAngle = Math.atan2(dy, dx) * 180 / Math.PI;
  }

  await writeFile(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    source: 'OSM via Overpass — relations 18334918 (25 de Abril) and 17840448 (Vasco da Gama)',
    bridges: out,
  }, null, 2));
  console.log(`Wrote ${OUT}: ${out.length} bridge(s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
