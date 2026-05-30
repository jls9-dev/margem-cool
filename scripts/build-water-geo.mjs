#!/usr/bin/env node
/**
 * build-water-geo.mjs
 *
 * Pulls the Tagus + Sado + Mar da Palha water polygons from OpenStreetMap
 * via Overpass, projects them with the same equirectangular projection as
 * `concelhos.json`, and writes `src/data/geo/water.json` ready for the
 * MargemMap component to draw on top of the land base.
 *
 * Why: geoapi.pt's concelho boundaries are administrative and INCLUDE the
 * adjacent water (the bay, the inlets) — so the unioned Margem Sul fills in
 * Seixal Bay, Coina, Moita inlets as land. Drawing real OSM water on top
 * restores the actual coastline.
 *
 * Run with: node scripts/build-water-geo.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const CONCELHOS_FILE = join(GEO_DIR, 'concelhos.json');
const OUT_FILE = join(GEO_DIR, 'water.json');
const RAW_OSM = join(GEO_DIR, 'raw', 'water-osm.json');

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const RELATIONS = [
  { id: 4128888,  name: 'Rio Tejo (water=river)' },
  { id: 17739670, name: 'Estuário do Sado' },
];

async function fetchOverpass() {
  const query = `[out:json][timeout:90];
(
  relation(4128888);
  relation(17739670);
);
out geom;`;
  const body = new URLSearchParams({ data: query }).toString();
  console.log('Fetching from Overpass…');
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'margem-cool/1.0 (https://margemcool.pt)',
    },
    body,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status} ${res.statusText}`);
  const text = await res.text();
  await writeFile(RAW_OSM, text);
  return JSON.parse(text);
}

/**
 * Stitch OSM way segments into closed rings. Each member.geometry is a
 * polyline; rings are assembled by greedy endpoint-joining of all ways
 * with the same role.
 */
function assembleRings(ways) {
  const segs = ways.map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  const rings = [];
  while (segs.length) {
    let current = segs.shift().slice();
    let safety = 0;
    while (!ringClosed(current) && safety++ < 5000) {
      const tail = current[current.length - 1];
      let matchedIdx = -1;
      let reverse = false;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (samePt(tail, seg[0])) { matchedIdx = i; reverse = false; break; }
        if (samePt(tail, seg[seg.length - 1])) { matchedIdx = i; reverse = true; break; }
      }
      if (matchedIdx === -1) break; // dangling — drop this partial
      const seg = segs.splice(matchedIdx, 1)[0];
      const next = reverse ? seg.slice().reverse() : seg;
      current = current.concat(next.slice(1));
    }
    if (ringClosed(current)) rings.push(current);
  }
  return rings;
}
function ringClosed(ring) {
  if (ring.length < 4) return false;
  return samePt(ring[0], ring[ring.length - 1]);
}
function samePt(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

/** Ramer-Douglas-Peucker (matches concelho simplification). */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpD(pts[i], pts[0], pts[end]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[end]];
}
function perpD(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a) * 0.5;
}

function ringToPath(ring) {
  let d = `M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
  for (let i = 1; i < ring.length; i++) {
    d += ` L ${ring[i][0].toFixed(2)} ${ring[i][1].toFixed(2)}`;
  }
  return d + ' Z';
}

async function main() {
  const concelhos = JSON.parse(await readFile(CONCELHOS_FILE, 'utf8'));
  const { padding, kLat, scale } = concelhos.project;
  const { bbox, viewBox } = concelhos;
  const [vbX, vbY, vbW, vbH] = viewBox;

  function project([lng, lat]) {
    return [
      padding + (lng - bbox.minLng) * kLat * scale,
      padding + (bbox.maxLat - lat) * scale,
    ];
  }

  let osm;
  try {
    osm = JSON.parse(await readFile(RAW_OSM, 'utf8'));
    console.log('Using cached OSM data');
  } catch {
    osm = await fetchOverpass();
  }

  const EPSILON = 0.0006; // ~60m — slightly finer than concelhos so coastline reads sharp

  // Clip-by-bbox heuristic: keep only rings with any vertex inside our bbox.
  // The Tagus relation includes the river all the way from Spain.
  const inBbox = (ring) =>
    ring.some(([lng, lat]) =>
      lng >= bbox.minLng - 0.05 && lng <= bbox.maxLng + 0.05 &&
      lat >= bbox.minLat - 0.05 && lat <= bbox.maxLat + 0.05,
    );

  const features = [];
  for (const rel of osm.elements) {
    if (rel.type !== 'relation') continue;
    const meta = RELATIONS.find((r) => r.id === rel.id);
    const tag = meta ? meta.name : (rel.tags?.name ?? `rel/${rel.id}`);
    const outers = rel.members.filter((m) => m.type === 'way' && m.role === 'outer');
    const inners = rel.members.filter((m) => m.type === 'way' && m.role === 'inner');
    const outerRings = assembleRings(outers);
    const innerRings = assembleRings(inners);
    console.log(`${tag}: ${outerRings.length} outer ring(s), ${innerRings.length} inner ring(s)`);

    const prep = (ring) => {
      if (!inBbox(ring)) return null;
      const simple = rdp(ring, EPSILON);
      if (simple.length < 4) return null;
      const a = ringArea(simple);
      if (a < 1e-5) return null; // ~10ha — drops shoreline slivers and tiny lagoons
      return { area: a, path: ringToPath(simple.map(project)) };
    };

    const outersOut = outerRings.map(prep).filter(Boolean);
    const innersOut = innerRings.map(prep).filter(Boolean);
    if (!outersOut.length) continue;

    // One SVG `d` per feature: outer subpath(s) + hole subpaths joined.
    // Rendered with fill-rule="evenodd" so islands inside the bay
    // (Mar da Palha has a couple of mudflats) render as land.
    const d = [...outersOut, ...innersOut].map((r) => r.path).join(' ');
    const totalOuterArea = outersOut.reduce((s, r) => s + r.area, 0);
    features.push({ source: tag, area_deg2: totalOuterArea, d });
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'OpenStreetMap via Overpass',
    relations: RELATIONS,
    epsilon: EPSILON,
    features,
  };

  await writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUT_FILE}`);
  for (const f of features) {
    console.log(`    ${f.source} — area ${f.area_deg2.toExponential(2)} sq°`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
