#!/usr/bin/env node
/**
 * build-concelhos-geo.mjs
 *
 * Reads raw geoapi.pt municipality GeoJSON for the 9 Setúbal-Peninsula
 * concelhos, simplifies each polygon with Ramer-Douglas-Peucker, projects
 * to a flat SVG coordinate system (equirectangular with latitude
 * correction), and writes a single `src/data/geo/concelhos.json` ready
 * for the MarkMap component to consume.
 *
 * Output structure:
 * {
 *   viewBox: [minX, minY, width, height],
 *   bbox: { minLng, minLat, maxLng, maxLat },
 *   concelhos: [
 *     {
 *       slug, name, area_km2,
 *       paths: [["M ... L ..."], ...],  // one per polygon (MultiPolygon-safe)
 *       labelXY: [x, y],                  // approximate centroid in SVG
 *       centroidLngLat: [lng, lat],
 *     }
 *   ]
 * }
 *
 * Run with: node scripts/build-concelhos-geo.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import polygonClipping from 'polygon-clipping';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '..', 'src', 'data', 'geo', 'raw');
const OUT_FILE = join(__dirname, '..', 'src', 'data', 'geo', 'concelhos.json');

const CONCELHOS = [
  { file: 'Almada.json',    slug: 'almada' },
  { file: 'Seixal.json',    slug: 'seixal' },
  { file: 'Sesimbra.json',  slug: 'sesimbra' },
  { file: 'Setubal.json',   slug: 'setubal' },
  { file: 'Palmela.json',   slug: 'palmela' },
  { file: 'Barreiro.json',  slug: 'barreiro' },
  { file: 'Moita.json',     slug: 'moita' },
  { file: 'Montijo.json',   slug: 'montijo' },
  { file: 'Alcochete.json', slug: 'alcochete' },
];

// Concelhos rendered as a faint context outline on the north side of the
// Tejo so a viewer can place the Margem Sul against Lisbon at a glance.
// These do NOT influence the bbox — they project at the Margem-Sul scale,
// and parts outside the viewBox clip naturally so the coast appears to
// continue west (toward Cascais) and east (toward Loures) past the frame.
const CONTEXT_NORTH = [
  { file: 'Cascais.json', slug: 'cascais' },
  { file: 'Oeiras.json',  slug: 'oeiras' },
  { file: 'Lisboa.json',  slug: 'lisboa' },
  { file: 'Loures.json',  slug: 'loures' },
];

/**
 * Ramer-Douglas-Peucker simplification.
 * epsilon in degrees. A reasonable value for our latitude is ~0.0015
 * (~150m), which keeps outlines clean without losing character.
 */
function rdp(points, epsilon) {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    const ex = p[0] - a[0];
    const ey = p[1] - a[1];
    return Math.sqrt(ex * ex + ey * ey);
  }
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const px = a[0] + t * dx;
  const py = a[1] + t * dy;
  const ex = p[0] - px;
  const ey = p[1] - py;
  return Math.sqrt(ex * ex + ey * ey);
}

/** Centroid of a polygon ring (shoelace). */
function polygonCentroid(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) return ring[0];
  return [cx / (6 * area), cy / (6 * area)];
}

/** Extract MultiPolygon-safe array of rings (just outer rings). */
function extractPolygons(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((p) => p[0]);
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

/** Signed polygon area in (lng, lat) — proportional to real area up to lat correction; fine for ranking by size. */
function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a) * 0.5;
}

/** Equirectangular projection with latitude correction at peninsula's mean lat. */
function makeProjector(bbox, viewWidth, padding = 16) {
  const meanLat = (bbox.minLat + bbox.maxLat) / 2;
  const kLat = Math.cos((meanLat * Math.PI) / 180);
  const spanX = (bbox.maxLng - bbox.minLng) * kLat;
  const spanY = bbox.maxLat - bbox.minLat;
  const innerW = viewWidth - padding * 2;
  const scale = innerW / spanX;
  const innerH = spanY * scale;
  const viewHeight = innerH + padding * 2;

  function project([lng, lat]) {
    const x = padding + (lng - bbox.minLng) * kLat * scale;
    const y = padding + (bbox.maxLat - lat) * scale;
    return [x, y];
  }

  return { project, viewWidth, viewHeight, scale, padding };
}

function ringToPath(ring) {
  let d = `M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
  for (let i = 1; i < ring.length; i++) {
    d += ` L ${ring[i][0].toFixed(2)} ${ring[i][1].toFixed(2)}`;
  }
  return d + ' Z';
}

/**
 * Closed-loop Chaikin's corner-cutting. For each edge (p, q), replace with
 * two new points at 1/4 and 3/4 along the edge. Iterating N times rounds
 * angular corners into smooth curves at the cost of vertex count.
 */
function chaikin(ring, iterations = 1) {
  let pts = ring;
  for (let it = 0; it < iterations; it++) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25]);
      out.push([p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
    }
    pts = out;
  }
  return pts;
}

/**
 * Closed-loop Catmull-Rom-to-cubic-bezier path. Turns a polyline of vertices
 * into smooth cubic curves that pass through each point, so the resulting
 * silhouette reads as a continuous traced line rather than a polygon. Tension
 * 0.5 gives a balanced curve (no overshoot, no sag).
 */
function ringToSmoothPath(ring) {
  const n = ring.length;
  if (n < 3) return ringToPath(ring);
  const fmt = (v) => v.toFixed(2);
  let d = `M ${fmt(ring[0][0])} ${fmt(ring[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i - 1 + n) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const p3 = ring[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d + ' Z';
}

const EPSILON_DEG = 0.0008; // ~80m at this latitude. Keeps detail along the coast.

async function main() {
  // 1. Load all 9 raw files
  const concelhos = [];
  let bbox = { minLng: 180, minLat: 90, maxLng: -180, maxLat: -90 };

  for (const { file, slug } of CONCELHOS) {
    const raw = JSON.parse(await readFile(join(RAW_DIR, file), 'utf8'));
    const allRings = extractPolygons(raw.geojson.geometry);

    // Filter offshore slivers (islands, rocks) — keep only rings whose area
    // is at least 0.5% of the largest ring. Sesimbra, for example, has 23
    // tiny outcrops we don't want polluting the silhouette.
    const ringsWithArea = allRings.map((ring) => ({ ring, area: ringArea(ring) }));
    const maxArea = Math.max(...ringsWithArea.map((r) => r.area));
    const keptRings = ringsWithArea
      .filter((r) => r.area >= maxArea * 0.005)
      .map((r) => r.ring);

    // Simplify each ring + update bbox
    const simplified = keptRings.map((ring) => {
      for (const [lng, lat] of ring) {
        if (lng < bbox.minLng) bbox.minLng = lng;
        if (lng > bbox.maxLng) bbox.maxLng = lng;
        if (lat < bbox.minLat) bbox.minLat = lat;
        if (lat > bbox.maxLat) bbox.maxLat = lat;
      }
      return rdp(ring, EPSILON_DEG);
    });

    // Pick the largest simplified polygon for centroid (skip slivers).
    const largest = simplified.slice().sort((a, b) => b.length - a.length)[0];
    const centroidLL = polygonCentroid(largest);

    concelhos.push({
      slug,
      name: raw.nome,
      areaKm2: Number(raw.areaha), // geoapi.pt mislabels this — it's actually km², and the value comes back as a string
      population: raw.censos2021 ? Number(raw.censos2021.N_INDIVIDUOS) : null,
      rings: simplified,
      centroidLngLat: centroidLL,
    });
  }

  // 2. Load the north-coast context concelhos. Do NOT update bbox — we want
  // the Margem Sul to take the full viewBox and the north-coast shapes to
  // clip naturally where they extend past the frame.
  const contextConcelhos = [];
  for (const { file, slug } of CONTEXT_NORTH) {
    const raw = JSON.parse(await readFile(join(RAW_DIR, file), 'utf8'));
    const allRings = extractPolygons(raw.geojson.geometry);
    const ringsWithArea = allRings.map((ring) => ({ ring, area: ringArea(ring) }));
    const maxArea = Math.max(...ringsWithArea.map((r) => r.area));
    const keptRings = ringsWithArea.filter((r) => r.area >= maxArea * 0.005).map((r) => r.ring);
    const simplified = keptRings.map((ring) => rdp(ring, EPSILON_DEG));
    contextConcelhos.push({ slug, name: raw.nome, rings: simplified });
  }

  // 3. Build projector once expanded bbox is known
  const VIEW_WIDTH = 800;
  const { project, viewHeight } = makeProjector(bbox, VIEW_WIDTH);

  // 3b. Union the context concelhos into a single north-coast polygon, so
  // simplification mismatches at adjacent borders don't leak the water
  // base through as visible teal gaps inside the land.
  const contextUnionInputs = contextConcelhos.flatMap((c) =>
    c.rings.map((ring) => [[ring]]),
  );
  const contextUnion = polygonClipping.union(...contextUnionInputs);
  const contextProjected = [
    {
      slug: 'north-coast',
      name: 'Margem Norte',
      // Take outer rings only (drop any holes — Lisbon/Loures don't have
      // legit lakes that matter at this scale).
      paths: contextUnion
        .map((poly) => poly[0])
        .map((ring) => ringToPath(ring.map(project))),
    },
  ];

  // 4. Project Margem Sul rings and centroids into SVG space
  const projected = concelhos.map((c) => {
    const paths = c.rings.map((ring) => ringToPath(ring.map(project)));
    const labelXY = project(c.centroidLngLat);
    return {
      slug: c.slug,
      name: c.name,
      area_km2: c.areaKm2,
      population_2021: c.population,
      paths,
      labelXY: [Math.round(labelXY[0]), Math.round(labelXY[1])],
      centroidLngLat: c.centroidLngLat,
    };
  });

  const meanLat = (bbox.minLat + bbox.maxLat) / 2;
  const kLat = Math.cos((meanLat * Math.PI) / 180);
  // Recover the same scale + padding the projector used (it's deterministic).
  const padding = 16;
  const scale = (VIEW_WIDTH - padding * 2) / ((bbox.maxLng - bbox.minLng) * kLat);

  // 4. Compute the union silhouette of all 9 concelhos.
  //    polygon-clipping wants each input as [[outerRing, ...holes]].
  //    Our simplified rings have no holes, so we wrap each as [[ring]].
  const unionInputs = concelhos.flatMap((c) => c.rings.map((ring) => [[ring]]));
  const unionResult = polygonClipping.union(...unionInputs);
  // unionResult: MultiPolygon = Array<Polygon = Array<Ring = Array<[lng,lat]>>>

  // Also produce the SAME union projected at the regular epsilon (no smoothing),
  // for use as the LAND BASE under the individual concelho strokes — eliminates
  // the inter-concelho gaps that leak the water tint through.
  const margemSulLandPaths = unionResult.flatMap((poly) =>
    poly.map((ring, i) => (i === 0 ? ringToPath(ring.map(project)) : null)).filter(Boolean),
  );

  // The silhouette is shown at brand-mark scale (favicon → 260px outline).
  // Push simplification hard, then run a Chaikin-style corner-cutting pass,
  // then run Catmull-Rom-to-cubic-bezier smoothing on top. We sacrifice
  // micro-detail on purpose — we want an ownable mark, not an accurate map.
  // 1.5km RDP tolerance + 2 corner-cuts gets us a confident sweep with the
  // knot at the Almada/Cacilhas shoreline ironed flat.
  const SILHOUETTE_EPSILON = 0.015;
  const silhouettePaths = unionResult.flatMap((poly) =>
    poly
      .map((ring, i) => {
        if (i !== 0) return null;
        let simpler = rdp(ring, SILHOUETTE_EPSILON);
        simpler = chaikin(simpler, 2);
        const projected = simpler.map(project);
        return ringToSmoothPath(projected);
      })
      .filter(Boolean),
  );
  // Compute combined bbox of the silhouette in SVG space for tight-cropped exports.
  let silMinX = Infinity, silMinY = Infinity, silMaxX = -Infinity, silMaxY = -Infinity;
  for (const poly of unionResult) {
    for (const [lng, lat] of poly[0]) {
      const [x, y] = project([lng, lat]);
      if (x < silMinX) silMinX = x;
      if (y < silMinY) silMinY = y;
      if (x > silMaxX) silMaxX = x;
      if (y > silMaxY) silMaxY = y;
    }
  }
  const silhouetteViewBox = [
    Math.floor(silMinX) - 2,
    Math.floor(silMinY) - 2,
    Math.ceil(silMaxX - silMinX) + 4,
    Math.ceil(silMaxY - silMinY) + 4,
  ];

  const out = {
    generated: new Date().toISOString(),
    epsilon: EPSILON_DEG,
    viewBox: [0, 0, VIEW_WIDTH, Math.round(viewHeight)],
    bbox,
    project: {
      meanLat,
      kLat,
      scale,
      padding,
      formula: 'x = padding + (lng - bbox.minLng) * kLat * scale; y = padding + (bbox.maxLat - lat) * scale',
    },
    silhouette: {
      viewBox: silhouetteViewBox,
      paths: silhouettePaths,
      polygons: unionResult.length,
    },
    margem_sul_land: margemSulLandPaths,
    context_north: contextProjected,
    concelhos: projected,
  };

  // 5. Write a standalone silhouette SVG for use as a brand mark / favicon / mask.
  const sd = silhouettePaths
    .map((p) => `<path d="${p}" />`)
    .join('\n  ');
  const sv = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${silhouetteViewBox.join(' ')}" role="img" aria-label="Margem Sul">
  <title>Margem Sul — silhueta dos nove concelhos</title>
  ${sd}
</svg>
`;
  await writeFile(join(__dirname, '..', 'public', 'brand', 'margem-sul-silhouette.svg'), sv);

  await writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  const totalPoints = projected.reduce(
    (sum, c) => sum + c.paths.reduce((s, p) => s + (p.match(/L /g) || []).length, 0),
    0,
  );
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`  9 concelhos, viewBox=${out.viewBox.join(' ')}, ~${totalPoints} edges total`);
  console.log(
    `  bbox: lng ${bbox.minLng.toFixed(4)}..${bbox.maxLng.toFixed(4)}, lat ${bbox.minLat.toFixed(4)}..${bbox.maxLat.toFixed(4)}`,
  );
  const silEdges = silhouettePaths.reduce((s, p) => s + (p.match(/L /g) || []).length, 0);
  console.log(`  silhouette: ${unionResult.length} polygon(s), ${silEdges} edges, viewBox=${silhouetteViewBox.join(' ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
