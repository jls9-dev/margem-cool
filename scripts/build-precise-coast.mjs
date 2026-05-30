#!/usr/bin/env node
/**
 * build-precise-coast.mjs
 *
 * Fetches `natural=coastline` ways from OpenStreetMap for the bbox of
 * concelhos.json, assembles them into closed LAND polygons, projects
 * with the same equirectangular projection as the concelho data, and
 * writes the result to src/data/geo/coast.json.
 *
 * Why: geoapi.pt's CAOP administrative concelho boundaries claim adjacent
 * salt water as territorial land. The unioned silhouette therefore fills
 * in Mar da Palha, Seixal Bay, Coina, Moita inlets, the Sado, etc. as
 * land. OSM coastlines are the canonical land/water boundary that
 * every tile renderer in the world uses, so use them.
 *
 * Algorithm:
 *   1. Pull coastline ways via Overpass for the bbox + small buffer.
 *   2. Stitch ways into chains by matching shared endpoints.
 *   3. Clip each chain to the bbox; any segment crossing the edge is
 *      split at the crossing point.
 *   4. Closed segments entirely inside the bbox are islands → keep.
 *   5. Open segments (entry-on-bbox-edge → exit-on-bbox-edge) are the
 *      mainland coast clipped to view. Walk them in CCW order around
 *      the bbox edge, connecting consecutive exit→next-entry along the
 *      bbox boundary, until the chain closes back on itself.
 *   6. The resulting polygon's interior is LAND (OSM coastline convention:
 *      land on the LEFT of the way direction; walking CCW around the
 *      bbox keeps the interior on the LEFT).
 *
 * Run with: node scripts/build-precise-coast.mjs
 */

import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const CONCELHOS_FILE = join(GEO_DIR, 'concelhos.json');
const OUT_FILE = join(GEO_DIR, 'coast.json');
const RAW_FILE = join(GEO_DIR, 'raw', 'coastline-osm.json');

const OVERPASS = 'https://overpass-api.de/api/interpreter';

async function fetchCoastlines(bbox) {
  // Overpass uses (south,west,north,east).
  const query = `[out:json][timeout:180][bbox:${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}];
way[natural=coastline];
out geom;`;
  console.log('Fetching coastlines from Overpass…');
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'margem-cool/1.0 (https://margemcool.pt)',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status} ${res.statusText}: ${await res.text()}`);
  const text = await res.text();
  await writeFile(RAW_FILE, text);
  return JSON.parse(text);
}

function ptEq(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
}

/** Stitch OSM way polylines into chains via shared endpoints. */
function assembleChains(ways) {
  const remaining = ways.map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  const chains = [];
  while (remaining.length > 0) {
    let chain = remaining.shift().slice();
    let extended = true;
    let safety = 0;
    while (extended && safety++ < 100000) {
      extended = false;
      const head = chain[0];
      const tail = chain[chain.length - 1];
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i];
        if (ptEq(tail, w[0])) {
          for (let k = 1; k < w.length; k++) chain.push(w[k]);
          remaining.splice(i, 1); extended = true; break;
        }
        if (ptEq(tail, w[w.length - 1])) {
          for (let k = w.length - 2; k >= 0; k--) chain.push(w[k]);
          remaining.splice(i, 1); extended = true; break;
        }
        if (ptEq(head, w[w.length - 1])) {
          chain = w.slice(0, -1).concat(chain);
          remaining.splice(i, 1); extended = true; break;
        }
        if (ptEq(head, w[0])) {
          chain = w.slice(1).reverse().concat(chain);
          remaining.splice(i, 1); extended = true; break;
        }
      }
    }
    chains.push(chain);
  }
  return chains;
}

const inside = (p, bbox) =>
  p[0] >= bbox.minLng && p[0] <= bbox.maxLng &&
  p[1] >= bbox.minLat && p[1] <= bbox.maxLat;

/** Intersect segment a→b with bbox boundary. */
function clipToEdge(a, b, bbox) {
  const [x0, y0] = a;
  const [x1, y1] = b;
  let bestT = 2;
  let bestPt = null;
  const consider = (t) => {
    if (t < 0 || t > 1) return;
    const x = x0 + t * (x1 - x0);
    const y = y0 + t * (y1 - y0);
    const eps = 1e-9;
    if (
      x >= bbox.minLng - eps && x <= bbox.maxLng + eps &&
      y >= bbox.minLat - eps && y <= bbox.maxLat + eps
    ) {
      if (t < bestT) { bestT = t; bestPt = [x, y]; }
    }
  };
  if (x1 !== x0) {
    consider((bbox.minLng - x0) / (x1 - x0));
    consider((bbox.maxLng - x0) / (x1 - x0));
  }
  if (y1 !== y0) {
    consider((bbox.minLat - y0) / (y1 - y0));
    consider((bbox.maxLat - y0) / (y1 - y0));
  }
  return bestPt;
}

/** Clip a chain (polyline or closed loop) to bbox. */
function clipChain(chain, bbox) {
  const segments = [];
  let current = [];
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i];
    const prev = i > 0 ? chain[i - 1] : null;
    if (inside(p, bbox)) {
      if (prev && !inside(prev, bbox)) {
        const cross = clipToEdge(prev, p, bbox);
        if (cross) current.push(cross);
      }
      current.push(p);
    } else if (prev && inside(prev, bbox)) {
      const cross = clipToEdge(prev, p, bbox);
      if (cross) current.push(cross);
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

/** Position along bbox boundary, CCW from SW corner (0). Range: [0, 4). */
function ccwPos(p, bbox) {
  const eps = 1e-5;
  const w = bbox.maxLng - bbox.minLng;
  const h = bbox.maxLat - bbox.minLat;
  if (Math.abs(p[1] - bbox.minLat) < eps) return (p[0] - bbox.minLng) / w;          // S edge: 0..1
  if (Math.abs(p[0] - bbox.maxLng) < eps) return 1 + (p[1] - bbox.minLat) / h;      // E edge: 1..2
  if (Math.abs(p[1] - bbox.maxLat) < eps) return 2 + (bbox.maxLng - p[0]) / w;      // N edge: 2..3
  if (Math.abs(p[0] - bbox.minLng) < eps) return 3 + (bbox.maxLat - p[1]) / h;      // W edge: 3..4
  return -1;
}

/** Corners encountered walking CCW around bbox from startPos to endPos. */
function bboxCornersBetween(startPos, endPos, bbox) {
  const corners = [
    [bbox.minLng, bbox.minLat], // pos 0 — SW
    [bbox.maxLng, bbox.minLat], // pos 1 — SE
    [bbox.maxLng, bbox.maxLat], // pos 2 — NE
    [bbox.minLng, bbox.maxLat], // pos 3 — NW
  ];
  let target = endPos;
  if (target <= startPos) target += 4;
  const out = [];
  for (let i = Math.floor(startPos) + 1; i < target; i++) {
    out.push(corners[i % 4]);
  }
  return out;
}

/**
 * Close one chain's clipped segments into a single LAND polygon.
 *
 * A chain is one continuous coastline run; clipping splits it into open
 * sub-segments wherever it crosses the bbox edge. Those sub-segments
 * belong to the SAME land mass and the polygon closure has to follow
 * the chain order, not the CCW order of all open segments globally —
 * otherwise we'd merge Lisbon's coast with Margem-Sul's coast across
 * the Tagus.
 *
 * For each segment we walk it in OSM direction (land on left), then hop
 * CCW along the bbox edge to the next segment's entry. After the last
 * segment we hop CCW back to the first segment's entry, closing the ring.
 */
function closeChainSegments(segments, bbox) {
  if (segments.length === 0) return null;
  if (segments.length === 1 && ptEq(segments[0][0], segments[0][segments[0].length - 1])) {
    // Single closed loop entirely inside bbox — keep as-is.
    return segments[0];
  }
  const polygon = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    for (const p of seg) polygon.push(p);
    const next = segments[(i + 1) % segments.length];
    const exit = ccwPos(seg[seg.length - 1], bbox);
    const entry = ccwPos(next[0], bbox);
    if (exit < 0 || entry < 0) continue; // shouldn't happen for clipped segments
    const corners = bboxCornersBetween(exit, entry, bbox);
    for (const c of corners) polygon.push(c);
  }
  return polygon;
}

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
  const { bbox } = concelhos;
  const { padding, kLat, scale } = concelhos.project;
  const project = ([lng, lat]) => [
    padding + (lng - bbox.minLng) * kLat * scale,
    padding + (bbox.maxLat - lat) * scale,
  ];

  let raw;
  if (existsSync(RAW_FILE)) {
    raw = JSON.parse(await readFile(RAW_FILE, 'utf8'));
    console.log('Using cached OSM coastline');
  } else {
    const fetchBbox = {
      minLng: bbox.minLng - 0.05,
      minLat: bbox.minLat - 0.05,
      maxLng: bbox.maxLng + 0.05,
      maxLat: bbox.maxLat + 0.05,
    };
    raw = await fetchCoastlines(fetchBbox);
  }

  const ways = raw.elements.filter((e) => e.type === 'way' && e.geometry);
  console.log(`Fetched ${ways.length} coastline ways`);

  const chains = assembleChains(ways);
  console.log(`Assembled into ${chains.length} chain(s)`);
  for (const [i, c] of chains.entries()) {
    const closed = ptEq(c[0], c[c.length - 1]);
    console.log(`  chain ${i}: ${c.length} pts, ${closed ? 'closed' : 'open'}`);
  }

  // Per-chain processing: clip each chain separately and close its
  // own segments into one polygon. This preserves which segments
  // belong to which land mass, so Lisbon and the Margem Sul don't get
  // merged across the Tagus.
  const polygons = [];
  let chainsWithSegs = 0;
  for (const chain of chains) {
    const segments = clipChain(chain, bbox).filter((s) => s.length >= 2);
    if (segments.length === 0) continue;
    chainsWithSegs++;
    const closed = closeChainSegments(segments, bbox);
    if (closed && closed.length >= 4) polygons.push(closed);
  }
  console.log(`${chainsWithSegs} chain(s) intersect bbox → ${polygons.length} polygon(s)`);
  const all = polygons;

  const EPSILON = 0.0005; // ~50m
  const paths = [];
  for (const poly of all) {
    const simple = rdp(poly, EPSILON);
    if (simple.length < 4) continue;
    const a = ringArea(simple);
    if (a < 1e-6) continue; // drop tiny artefacts
    paths.push({
      area_deg2: a,
      path: ringToPath(simple.map(project)),
    });
  }
  paths.sort((a, b) => b.area_deg2 - a.area_deg2);

  await writeFile(OUT_FILE, JSON.stringify({
    generated: new Date().toISOString(),
    source: 'OpenStreetMap natural=coastline via Overpass',
    bbox,
    epsilon: EPSILON,
    paths,
  }, null, 2));
  console.log(`Wrote ${OUT_FILE} — ${paths.length} polygon(s)`);
  for (const p of paths) console.log(`  area ${p.area_deg2.toExponential(2)} sq°`);
}

main().catch((err) => { console.error(err); process.exit(1); });
