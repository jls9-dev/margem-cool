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

  // 2. Build projector once bbox is known
  const VIEW_WIDTH = 800;
  const { project, viewHeight } = makeProjector(bbox, VIEW_WIDTH);

  // 3. Project rings and centroids into SVG space
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
    concelhos: projected,
  };

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
