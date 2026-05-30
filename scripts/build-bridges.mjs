#!/usr/bin/env node
/**
 * build-bridges.mjs
 *
 * Pulls the actual geometry for the Ponte 25 de Abril (OSM relation
 * 18334918, type=bridge) and Ponte Vasco da Gama (OSM relation 17840448,
 * type=route) from Overpass, projects each into our viewBox using the
 * same equirectangular projector as everything else, and writes
 * src/data/geo/bridges.json.
 *
 * 25 de Abril is the bridge-structure relation; we take its `outline`
 * member as a closed polygon for the deck silhouette. Vasco da Gama is
 * a road route; we concatenate every way in the relation (including the
 * long viaduct over the salt marshes) for the visible bridge centerline.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const CACHE = join(GEO_DIR, 'raw', 'bridges-osm.json');
const OUT = join(GEO_DIR, 'bridges.json');

async function fetchBridges() {
  const query = `[out:json][timeout:60];
(
  rel(18334918);
  rel(17840448);
);
out geom;`;
  console.log('Fetching bridges from Overpass…');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
               'User-Agent': 'margem-cool/1.0 (https://margemcool.pt)' },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  const text = await res.text();
  await writeFile(CACHE, text);
  return JSON.parse(text);
}

function ptEq(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
}

/** Stitch OSM way segments into chains by matching shared endpoints. */
function stitchWays(ways) {
  const segs = ways.map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  const chains = [];
  while (segs.length) {
    let chain = segs.shift().slice();
    let extended = true;
    while (extended) {
      extended = false;
      const head = chain[0], tail = chain[chain.length - 1];
      for (let i = 0; i < segs.length; i++) {
        const w = segs[i];
        if (ptEq(tail, w[0]))                 { chain.push(...w.slice(1));        segs.splice(i, 1); extended = true; break; }
        if (ptEq(tail, w[w.length - 1]))      { chain.push(...w.slice(0, -1).reverse()); segs.splice(i, 1); extended = true; break; }
        if (ptEq(head, w[w.length - 1]))      { chain = w.slice(0, -1).concat(chain); segs.splice(i, 1); extended = true; break; }
        if (ptEq(head, w[0]))                 { chain = w.slice(1).reverse().concat(chain); segs.splice(i, 1); extended = true; break; }
      }
    }
    chains.push(chain);
  }
  return chains;
}

async function main() {
  const concelhos = JSON.parse(await readFile(join(GEO_DIR, 'concelhos.json'), 'utf8'));
  const { bbox } = concelhos;
  const { padding, kLat, scale } = concelhos.project;
  const project = ([lng, lat]) => [
    padding + (lng - bbox.minLng) * kLat * scale,
    padding + (bbox.maxLat - lat) * scale,
  ];

  let raw;
  if (existsSync(CACHE)) {
    raw = JSON.parse(await readFile(CACHE, 'utf8'));
    console.log('Using cached Overpass bridge data');
  } else {
    raw = await fetchBridges();
  }

  function ringToPath(ring, closed) {
    let d = `M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
    for (let i = 1; i < ring.length; i++) {
      d += ` L ${ring[i][0].toFixed(2)} ${ring[i][1].toFixed(2)}`;
    }
    return closed ? d + ' Z' : d;
  }

  const out = [];

  // 25 de Abril — use the longest `across` member (the road deck
  // centerline) as a polyline. At our map scale the closed outline reads
  // as a sliver, where a stroked centerline reads as a proper bridge.
  const a25 = raw.elements.find((e) => e.type === 'relation' && e.id === 18334918);
  if (a25) {
    const acrosses = a25.members
      .filter((m) => m.role === 'across' && m.geometry?.length >= 2)
      .map((m) => m.geometry.map((p) => [p.lon, p.lat]));
    acrosses.sort((a, b) => b.length - a.length);
    if (acrosses.length) {
      out.push({
        id: 'ponte-25-abril',
        pt: 'Ponte 25 de Abril',
        en: '25 de Abril Bridge',
        shape: 'line',
        d: ringToPath(acrosses[0].map(project), false),
      });
    }
  }

  // Vasco da Gama — stitch route ways into one centerline, then clip to
  // the actual bridge structure (Sacavém shore to Sarilhos Pequenos shore)
  // so we don't trail off into the A1 and A33 approach highways.
  const vdg = raw.elements.find((e) => e.type === 'relation' && e.id === 17840448);
  if (vdg) {
    const ways = vdg.members.filter((m) => m.type === 'way' && m.geometry);
    const chains = stitchWays(ways);
    chains.sort((a, b) => b.length - a.length);
    const main = chains[0];

    // The cable-stayed + viaduct extent: roughly lng -9.060 to -8.967,
    // lat 38.778 (Sacavém shore) to 38.708 (Sarilhos Pequenos shore).
    const BRIDGE_BBOX = { minLng: -9.060, minLat: 38.708, maxLng: -8.965, maxLat: 38.785 };
    const inside = (p) =>
      p[0] >= BRIDGE_BBOX.minLng && p[0] <= BRIDGE_BBOX.maxLng &&
      p[1] >= BRIDGE_BBOX.minLat && p[1] <= BRIDGE_BBOX.maxLat;
    // Keep the longest contiguous run of points inside the bridge bbox.
    const runs = [];
    let current = [];
    for (const p of main) {
      if (inside(p)) current.push(p);
      else if (current.length) { runs.push(current); current = []; }
    }
    if (current.length) runs.push(current);
    runs.sort((a, b) => b.length - a.length);
    const bridgeLine = runs[0] || main;

    out.push({
      id: 'ponte-vasco-da-gama',
      pt: 'Ponte Vasco da Gama',
      en: 'Vasco da Gama Bridge',
      shape: 'line',
      d: ringToPath(bridgeLine.map(project), false),
    });
    console.log(`VG: stitched ${chains.length} chain(s); longest ${main.length} pts; bridge portion ${bridgeLine.length} pts`);
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
