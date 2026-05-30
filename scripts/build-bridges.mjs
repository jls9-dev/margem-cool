#!/usr/bin/env node
/**
 * build-bridges.mjs
 *
 * Pulls the real deck outline polygons for both Tejo road bridges from
 * OSM via Overpass and projects them onto the map. No hand-placed
 * coordinates — the deck sits exactly where OSM's land polygons say it
 * sits, which means the bridge meets the shore at the same latitude as
 * the rest of the map's coastline.
 *
 *   - Ponte 25 de Abril:   way 485215103 (man_made=bridge outline)
 *   - Ponte Vasco da Gama: way 917157032 (man_made=bridge outline)
 *
 * Both are closed polygons (~58 and ~223 nodes). At map scale a real
 * 30 m-wide deck is ~0.3 px wide, so the polygon is also given a 2.4 px
 * stroke in CSS to read as a bridge line; the centerline stays truthful.
 *
 * Raw Overpass responses are cached to src/data/geo/raw/ so re-runs
 * don't hammer the public endpoint.
 *
 * Output: src/data/geo/bridges.json, consumed by MargemMap.astro.
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const RAW_DIR = join(GEO_DIR, 'raw');
const OUT = join(GEO_DIR, 'bridges.json');
const OVERPASS = 'https://overpass-api.de/api/interpreter';

const sources = [
  {
    id: 'ponte-25-abril',
    pt: 'Ponte 25 de Abril',
    en: '25 de Abril Bridge',
    wayId: 485215103,
    cache: 'bridge-25-abril.json',
  },
  {
    id: 'ponte-vasco-da-gama',
    pt: 'Ponte Vasco da Gama',
    en: 'Vasco da Gama Bridge',
    wayId: 917157032,
    cache: 'bridge-vasco-da-gama.json',
  },
];

async function fetchWayGeometry(wayId, cachePath) {
  try {
    const s = await stat(cachePath);
    if (s.isFile() && s.size > 0) {
      return JSON.parse(await readFile(cachePath, 'utf8'));
    }
  } catch { /* miss, fall through */ }

  const query = `[out:json][timeout:60];way(${wayId});out geom;`;
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'margem-cool-build/1.0 (https://margemcool.pt)',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status} for way ${wayId}`);
  const json = await res.json();
  await writeFile(cachePath, JSON.stringify(json, null, 2));
  return json;
}

async function main() {
  const concelhos = JSON.parse(await readFile(join(GEO_DIR, 'concelhos.json'), 'utf8'));
  const { bbox } = concelhos;
  const { padding, kLat, scale } = concelhos.project;
  const project = ([lng, lat]) => [
    padding + (lng - bbox.minLng) * kLat * scale,
    padding + (bbox.maxLat - lat) * scale,
  ];

  await mkdir(RAW_DIR, { recursive: true });

  const out = [];

  for (const s of sources) {
    const json = await fetchWayGeometry(s.wayId, join(RAW_DIR, s.cache));
    const way = json.elements.find((e) => e.type === 'way' && e.id === s.wayId);
    if (!way || !way.geometry || way.geometry.length < 4) {
      throw new Error(`No usable geometry for way ${s.wayId} (${s.pt})`);
    }
    const ring = way.geometry.map((p) => [p.lon, p.lat]);
    // OSM closes the ring by repeating the first point — keep it; SVG
    // path z-close handles the seal, but a duplicate point is fine too.
    const projected = ring.map(project);

    // Build the SVG path. M to first, L to each subsequent, Z to close.
    const d = projected
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(' ') + ' Z';

    // Label anchor: centroid of the ring's bounding box in projected
    // pixels. The polygon is long and thin so this lands on the deck.
    const xs = projected.map((p) => p[0]);
    const ys = projected.map((p) => p[1]);
    const labelXY = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];

    out.push({
      id: s.id,
      pt: s.pt,
      en: s.en,
      shape: 'polygon',
      d,
      labelXY,
      source: { type: 'way', id: s.wayId },
    });
  }

  await writeFile(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    source: 'OSM via Overpass — man_made=bridge outline ways 485215103 (25 de Abril) and 917157032 (Vasco da Gama)',
    bridges: out,
  }, null, 2));
  console.log(`Wrote ${OUT}: ${out.length} bridge(s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
