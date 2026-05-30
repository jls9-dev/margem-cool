#!/usr/bin/env node
/**
 * build-land-from-osm.mjs
 *
 * Reads the OSM "land-polygons-complete-4326" shapefile (canonical
 * coastline-derived land used by every OSM tile renderer in the world),
 * intersects with our viewBox bbox, and writes precise LAND polygons
 * to src/data/geo/osm-land.json.
 *
 * The source shapefile lives at /tmp/land-polygons-complete-4326/ and is
 * already in WGS84 (EPSG:4326 — lng/lat), so no projection conversion is
 * needed in this pipeline.
 */
import * as shp from 'shapefile';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import polygonClipping from 'polygon-clipping';

/**
 * Sutherland-Hodgman polygon clipping to a rectangular bbox. Each ring
 * is clipped against the 4 bbox edges in turn. Linear in vertex count,
 * doesn't allocate priority queues, won't choke on multi-million-vertex
 * input the way martinez-based polygon-clipping does.
 */
function clipRingToBbox(ring, bbox) {
  const edges = [
    (p) => p[0] >= bbox.minLng,
    (p) => p[1] >= bbox.minLat,
    (p) => p[0] <= bbox.maxLng,
    (p) => p[1] <= bbox.maxLat,
  ];
  const intersect = (p1, p2, edgeIdx) => {
    const [x1, y1] = p1, [x2, y2] = p2;
    let x, y;
    if (edgeIdx === 0) { x = bbox.minLng; y = y1 + (y2 - y1) * (x - x1) / (x2 - x1); }
    else if (edgeIdx === 1) { y = bbox.minLat; x = x1 + (x2 - x1) * (y - y1) / (y2 - y1); }
    else if (edgeIdx === 2) { x = bbox.maxLng; y = y1 + (y2 - y1) * (x - x1) / (x2 - x1); }
    else { y = bbox.maxLat; x = x1 + (x2 - x1) * (y - y1) / (y2 - y1); }
    return [x, y];
  };
  let output = ring.slice(0, -1); // drop closing duplicate
  for (let e = 0; e < 4; e++) {
    if (output.length === 0) break;
    const inside = edges[e];
    const next = [];
    for (let i = 0; i < output.length; i++) {
      const curr = output[i];
      const prev = output[(i - 1 + output.length) % output.length];
      const currIn = inside(curr);
      const prevIn = inside(prev);
      if (currIn) {
        if (!prevIn) next.push(intersect(prev, curr, e));
        next.push(curr);
      } else if (prevIn) {
        next.push(intersect(prev, curr, e));
      }
    }
    output = next;
  }
  if (output.length === 0) return null;
  output.push(output[0].slice()); // close
  return output;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const SHAPEFILE = '/tmp/land-polygons-complete-4326/land_polygons.shp';
const OUT = join(GEO_DIR, 'osm-land.json');

function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const dx = pts[end][0] - pts[0][0], dy = pts[end][1] - pts[0][1];
    let d;
    if (dx === 0 && dy === 0) d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    else {
      const t = ((pts[i][0] - pts[0][0]) * dx + (pts[i][1] - pts[0][1]) * dy) / (dx * dx + dy * dy);
      const px = pts[0][0] + t * dx, py = pts[0][1] + t * dy;
      d = Math.hypot(pts[i][0] - px, pts[i][1] - py);
    }
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
  }
  return [pts[0], pts[end]];
}

async function main() {
  const concelhos = JSON.parse(await readFile(join(GEO_DIR, 'concelhos.json'), 'utf8'));
  const { bbox } = concelhos;

  // Source is already in 4326 (lng/lat).

  // Pull every polygon whose bbox overlaps ours.
  console.log('Reading land polygons shapefile…');
  const source = await shp.open(SHAPEFILE);
  const matchingPolys = [];
  let total = 0;
  while (true) {
    const r = await source.read();
    if (r.done) break;
    total++;
    const g = r.value.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of poly[0]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (maxX < bbox.minLng || minX > bbox.maxLng || maxY < bbox.minLat || minY > bbox.maxLat) continue;
      matchingPolys.push(poly);
    }
  }
  console.log(`Scanned ${total} shapes, ${matchingPolys.length} polygon(s) overlap bbox`);
  if (matchingPolys.length === 0) throw new Error('no land polygons in bbox');

  // Clip each polygon's outer ring + holes to the bbox using
  // Sutherland-Hodgman. Faster + memory-safe vs. polygon-clipping's
  // martinez algorithm at this data volume.
  function ringAreaCheap(ring) {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return Math.abs(a) * 0.5;
  }
  console.log('Clipping polygons to bbox…');
  const clipped = [];
  for (const poly of matchingPolys) {
    const clippedRings = [];
    for (const ring of poly) {
      const c = clipRingToBbox(ring, bbox);
      if (!c || c.length < 4) continue;
      if (ringAreaCheap(c) < 1e-8) continue;
      clippedRings.push(c);
    }
    if (clippedRings.length > 0) clipped.push(clippedRings);
  }
  console.log(`${clipped.length} clipped polygon(s); pre-simplifying for union…`);

  // Pre-simplify each clipped polygon so the union pass doesn't blow
  // polygon-clipping's priority queue. We're clipping to a small region
  // and the rings still arrive with thousands of vertices each.
  const EPS_PRE = 0.00015; // ~15m — keep visible detail while shrinking ring sizes
  const presimplified = clipped.map((poly) =>
    poly.map((ring) => rdp(ring, EPS_PRE)).filter((r) => r.length >= 4),
  ).filter((p) => p.length > 0);

  // Union adjacent OSM tile polygons so internal tile-boundary lines
  // disappear and we end up with the actual coastline outline only.
  console.log(`Unioning ${presimplified.length} polygon(s)…`);
  const unioned = polygonClipping.union(...presimplified.map((p) => [p]));
  console.log(`→ ${unioned.length} unioned land polygon(s)`);
  const intersected = unioned;
  intersected.slice(0, 5).forEach((p, i) => {
    console.log(`  poly ${i}: outer ring ${p[0].length} pts, ${p.length - 1} hole(s)`);
  });

  // Project to SVG using the same equirectangular projector the rest of
  // the map uses.
  const { padding, kLat, scale } = concelhos.project;
  function projectSvg([lng, lat]) {
    return [padding + (lng - bbox.minLng) * kLat * scale,
            padding + (bbox.maxLat - lat) * scale];
  }
  function ringToPath(ring) {
    let d = `M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
    for (let i = 1; i < ring.length; i++) {
      d += ` L ${ring[i][0].toFixed(2)} ${ring[i][1].toFixed(2)}`;
    }
    return d + ' Z';
  }
  function ringArea(ring) {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return Math.abs(a) * 0.5;
  }

  // ~30m simplification — full-res dataset has very high vertex density
  // (sub-meter in places); 30m keeps the bay/estuary detail without
  // ballooning the SVG file.
  const EPS_DEG = 0.0003;
  const paths = [];
  for (const poly of intersected) {
    const ringPaths = [];
    for (const ring of poly) {
      const simplified = rdp(ring, EPS_DEG);
      if (simplified.length < 4) continue;
      const a = ringArea(simplified);
      if (a < 1e-7) continue;
      ringPaths.push(ringToPath(simplified.map(projectSvg)));
    }
    if (ringPaths.length === 0) continue;
    paths.push({ ring_count: ringPaths.length, d: ringPaths.join(' ') });
  }
  console.log(`Output: ${paths.length} land path(s) with outer+hole subpaths`);

  await writeFile(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    source: 'OSM Land Polygons (complete) via osmdata.openstreetmap.de',
    bbox,
    paths,
  }, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
