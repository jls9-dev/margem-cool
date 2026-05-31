#!/usr/bin/env node
/**
 * build-concelhos-leaflet.mjs
 *
 * Reads the cached raw geoapi.pt municipality GeoJSONs for the 9 Margem
 * Sul concelhos and emits two artefacts in lat/lng (WGS-84) ready for
 * Leaflet's L.geoJSON:
 *
 *   - src/data/geo/concelhos-latlng.json — FeatureCollection of all 9
 *     concelho polygons with { slug, name, area_km2, population_2021 }
 *     properties. One feature per concelho (MultiPolygon-safe, so
 *     Montijo's exclave is preserved).
 *
 *   - src/data/geo/margem-sul-outline.json — single Feature with the
 *     unioned outline of all 9 concelhos (one ring per disjoint
 *     piece). Used to draw the "this whole region is Margem Sul"
 *     bordering on top of the map.
 *
 * Each ring is simplified with Ramer-Douglas-Peucker at ~50 m tolerance
 * — coarse enough to keep the GeoJSON small but fine enough to look
 * crisp at Leaflet zoom 11–13. The union is computed by polygon-
 * clipping (already a dep for the silhouette-mark pipeline).
 *
 * Re-run with: node scripts/build-concelhos-leaflet.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import polygonClipping from 'polygon-clipping';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'src', 'data', 'geo');
const RAW_DIR = join(GEO_DIR, 'raw');

// Slug + raw-filename + display name + ordered for stable output.
const CONCELHOS = [
  { slug: 'almada',    file: 'Almada.json',    name: 'Almada' },
  { slug: 'seixal',    file: 'Seixal.json',    name: 'Seixal' },
  { slug: 'sesimbra',  file: 'Sesimbra.json',  name: 'Sesimbra' },
  { slug: 'setubal',   file: 'Setubal.json',   name: 'Setúbal' },
  { slug: 'palmela',   file: 'Palmela.json',   name: 'Palmela' },
  { slug: 'barreiro',  file: 'Barreiro.json',  name: 'Barreiro' },
  { slug: 'moita',     file: 'Moita.json',     name: 'Moita' },
  { slug: 'montijo',   file: 'Montijo.json',   name: 'Montijo' },
  { slug: 'alcochete', file: 'Alcochete.json', name: 'Alcochete' },
];

// Ramer-Douglas-Peucker on a [lng,lat] ring. epsilon in degrees.
function rdp(points, epsilon) {
  if (points.length < 3) return points.slice();
  function distSq(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (dx === 0 && dy === 0) {
      const dxp = p[0] - a[0], dyp = p[1] - a[1];
      return dxp * dxp + dyp * dyp;
    }
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    const cx = a[0] + Math.max(0, Math.min(1, t)) * dx;
    const cy = a[1] + Math.max(0, Math.min(1, t)) * dy;
    const ex = p[0] - cx, ey = p[1] - cy;
    return ex * ex + ey * ey;
  }
  function walk(start, end) {
    let maxD = 0, idx = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distSq(points[i], points[start], points[end]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > epsilon * epsilon) {
      const a = walk(start, idx);
      const b = walk(idx, end);
      return a.concat(b.slice(1));
    }
    return [points[start], points[end]];
  }
  const closed = points[0][0] === points[points.length - 1][0]
              && points[0][1] === points[points.length - 1][1];
  const work = closed ? points.slice(0, -1) : points.slice();
  if (work.length < 3) return points.slice();
  const out = walk(0, work.length - 1);
  if (closed && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) {
    out.push(out[0]);
  }
  return out;
}

// ~50 m at this latitude is ≈ 0.00045°. Slightly tighter for crisp
// coastline detail on individual concelhos; the GeoJSON file is still
// <300 KB.
const EPSILON_DEG = 0.00035;

// The outer perimeter is a brand element, not geography — it should
// read as a confident designed line, not trace every tiny inlet. ~300m
// epsilon collapses small coastline noise (dock peninsulas at Cacilhas
// / Trafaria, small Costa da Caparica indents); two Chaikin passes
// then round the remaining angles so the outline feels drawn.
const OUTLINE_EPSILON_DEG = 0.003;
const OUTLINE_CHAIKIN_PASSES = 2;

// One pass of Chaikin's corner-cutting algorithm: each edge is
// replaced by two new vertices at 1/4 and 3/4 along it, so every
// sharp corner becomes a soft turn. Doubles vertex count per pass.
function chaikin(ring) {
  if (ring.length < 4) return ring.slice();
  const closed = ring[0][0] === ring[ring.length - 1][0]
              && ring[0][1] === ring[ring.length - 1][1];
  const work = closed ? ring.slice(0, -1) : ring.slice();
  const out = [];
  for (let i = 0; i < work.length; i++) {
    const p0 = work[i];
    const p1 = work[(i + 1) % work.length];
    out.push([
      0.75 * p0[0] + 0.25 * p1[0],
      0.75 * p0[1] + 0.25 * p1[1],
    ]);
    out.push([
      0.25 * p0[0] + 0.75 * p1[0],
      0.25 * p0[1] + 0.75 * p1[1],
    ]);
  }
  if (closed) out.push(out[0]);
  return out;
}

function simplifyRings(coords, type) {
  // GeoJSON coords for Polygon: rings[]; for MultiPolygon: polygons[][rings[]]
  if (type === 'Polygon') {
    return coords.map((ring) => rdp(ring, EPSILON_DEG));
  }
  if (type === 'MultiPolygon') {
    return coords.map((poly) => poly.map((ring) => rdp(ring, EPSILON_DEG)));
  }
  throw new Error(`Unexpected geometry type: ${type}`);
}

function bboxOf(coords, type) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  const visit = (rings) => {
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  };
  if (type === 'Polygon') visit(coords);
  else if (type === 'MultiPolygon') coords.forEach(visit);
  return [minLng, minLat, maxLng, maxLat];
}

async function main() {
  // 1. Build the per-concelho FeatureCollection (independently simplified
  //    so each click target stays crisp) AND collect the *raw* rings to
  //    union for the outline (so adjacent concelhos seal perfectly along
  //    shared borders — simplifying first leaves slivers between them).
  const features = [];
  const unionInputs = [];

  for (const c of CONCELHOS) {
    const raw = JSON.parse(await readFile(join(RAW_DIR, c.file), 'utf8'));
    const feat = raw.geojson;
    if (!feat || !feat.geometry) throw new Error(`No geometry for ${c.slug}`);
    const { type, coordinates } = feat.geometry;
    const simplified = simplifyRings(coordinates, type);

    features.push({
      type: 'Feature',
      properties: {
        slug: c.slug,
        name: c.name,
        area_km2: raw.areaha ? parseFloat(raw.areaha) : null,
        population_2021: raw.censos2021?.N_INDIVIDUOS
          ? parseInt(raw.censos2021.N_INDIVIDUOS, 10) : null,
      },
      geometry: { type, coordinates: simplified },
      bbox: bboxOf(simplified, type),
    });

    // Union from the *raw* coordinates so adjacent concelhos' shared
    // borders cancel perfectly (no slivers along Almada/Seixal etc.).
    if (type === 'Polygon') {
      unionInputs.push([coordinates]);
    } else {
      coordinates.forEach((poly) => unionInputs.push([poly]));
    }
  }

  const concelhosOut = {
    type: 'FeatureCollection',
    generated: new Date().toISOString(),
    source: 'geoapi.pt municipalities (cached in src/data/geo/raw/)',
    features,
  };
  await writeFile(
    join(GEO_DIR, 'concelhos-latlng.json'),
    JSON.stringify(concelhosOut),
  );
  console.log(`Wrote concelhos-latlng.json — ${features.length} features`);

  // 2. Compute the unified Margem Sul outline from the raw rings, then
  //    simplify the *result* (not each input). Simplifying first leaves
  //    sliver gaps between concelhos along shared borders; unioning the
  //    raw rings first lets them cancel exactly.
  const unionedRaw = polygonClipping.union(...unionInputs);
  // polygon-clipping output: MultiPolygon coords [[ring, hole, ...], ...].
  // Drop sliver pieces left behind by floating-point seams along
  // adjacent borders. The real Margem Sul piece is ~0.34 deg²; the
  // slivers are ~1e-7 deg² (sub-metre on the ground). 1e-4 deg² (~1 km²)
  // is a generous threshold that keeps anything geographically real.
  const SLIVER_THRESHOLD_DEG2 = 1e-4;
  function bboxAreaDeg2(ring) {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return (maxLng - minLng) * (maxLat - minLat);
  }
  // Smooth the outer perimeter for a brand-confident line: aggressive
  // RDP first (collapses tiny salt-flat inlets and dock notches into
  // straight runs — "include a bit of area without copying every
  // variation"), then one Chaikin pass to round the remaining
  // corners. The result has noticeably more flow than the raw union.
  function smoothRing(ring) {
    let r = rdp(ring, OUTLINE_EPSILON_DEG);
    for (let i = 0; i < OUTLINE_CHAIKIN_PASSES; i++) r = chaikin(r);
    return r;
  }
  const unioned = unionedRaw
    .filter((poly) => bboxAreaDeg2(poly[0]) >= SLIVER_THRESHOLD_DEG2)
    .map((poly) => poly.map(smoothRing));
  const outlineFeature = {
    type: 'Feature',
    properties: { name: 'Margem Sul' },
    geometry: { type: 'MultiPolygon', coordinates: unioned },
    bbox: bboxOf(unioned, 'MultiPolygon'),
  };
  await writeFile(
    join(GEO_DIR, 'margem-sul-outline.json'),
    JSON.stringify({
      type: 'FeatureCollection',
      generated: new Date().toISOString(),
      source: 'Union of the 9 Margem Sul concelhos via polygon-clipping.',
      features: [outlineFeature],
    }),
  );
  console.log(`Wrote margem-sul-outline.json — ${unioned.length} polygon piece(s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
