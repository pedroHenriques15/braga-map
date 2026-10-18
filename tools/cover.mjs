// What the ground is (task 016), every 50 cm over the Volta dos Amigos' box (which holds the shooter's
// area): asphalt, paving, setts, grass, bare soil, gravel, water, or a building's roof, and whether a
// tree's crown is over it. Classed from DGT's 2025 data:
//
// - the LiDAR's point cloud, which sees the ground through the trees' gaps and under nothing at all: the
//   laser's echo off the ground (its intensity) is the surest way to tell asphalt from setts from paving
//   or grass, the same in the sun and in a shadow; its points over the ground are the trees (classed as
//   vegetation), the cars and what else stands there, and the water (classed as water);
// - the orthophoto (25 cm) and its near-infrared: NDVI tells plants from paint, and the colour tells bare
//   soil and gravel from paving, where the photo isn't in a shadow, under a car or a tree;
// - the world's buildings (a roof), the map's water, and the streets' own surfaces where the world draws
//   them (round the open world's area), which every game draws over the ground anyway; but not a
//   roundabout's island, which a game draws in what the ground is there (task 014).
//
// Where the photo can't be read (a shadow, a car, a tree's crown), the ground takes what the nearest
// ground like it is (the laser says how alike). Then each kind's own colour, from the photo where it can
// be read, filled in under the shadows, the cars and the trees from what's round it of the same kind:
// the photo without them, for a game to tint each kind's photo by (task 016's option A, the owner's
// pick). And the cars the LiDAR saw parked, for the bays and the parked cars (tasks 018 and 020).
//
// node tools/cover.mjs              every tile under the box (about 10 minutes the first time, then 5 s
//                                   a tile)
// node tools/cover.mjs x-1z1 …      only those; the loader keeps the rest
// node tools/cover.mjs --check      and, for each, the photo, its classes and its colour side by side,
//                                   as .cache/cover/<tile>.png
//
// .cache/dgt/cover/<key>.bin.gz             each of DGT's tiles of the point cloud boiled down to what
//                                           this needs, once (about 15 s a tile)
// world/cover/<tile>/classes-<level>.webp   a byte a cell (lossless, as its grey), row 0 to the north:
//                                           its kind (KINDS's index) in the low 3 bits, 8 where a
//                                           tree's crown is over it; 50 cm a cell on High, 1 m on
//                                           Medium and 2 m on Low
// world/cover/<tile>/colour-<level>.webp    each kind's colour over the tile, a square every 4 m on
//                                           High, 5 m on Medium and 10 m on Low, the kinds one under
//                                           the other and the trees' crowns last, each padded to whole
//                                           16-pixel blocks
// world/cover/<tile>/cars.json              the cars the LiDAR saw parked, six numbers each
// world/cover/<tile>.js                     the tile's index (index.d.ts's GroundCover)
// world/cover.js                            COVER, a loader of each tile's index, and KINDS
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { CACHE, ROOT } from './geo.mjs';
import { DGT, mapToTM, orthoGrid, points, tileBox as dgtBox, tileKey, tilesOver } from './dgt.mjs';
import { terrain } from './terrain.mjs';
import { allTiles, EXT, tileBox, tileId } from './sections.mjs';
import { js } from './ktx2.mjs';
import { loadWorld, map } from '../index.js';
import amigos from '../tracks/amigos.js';

// The kinds of ground, in the order a cell's byte has them.
export const KINDS = ['asphalt', 'paving', 'setts', 'grass', 'soil', 'gravel', 'water', 'roof'];
const [ASPHALT, PAVING, SETTS, GRASS, SOIL, GRAVEL, WATER, ROOF] = KINDS.keys();
export const CROWN = 8; // a tree's crown over it
const UNSEEN = 15, UNDER = 14; // while classing: light ground the photo can't say more of, and the ground under a crown
const S = 0.5, N = 500 / S; // a cell, and a tile's cells a side
// In a roundabout's island (task 014), ground that echoes this much (thousands) is a lawn, whatever the
// photo's near-infrared says: one the summer dried reads as paving in the 2025 orthophoto, but its echo
// is a lawn's (14 to 26 in the route's islands; a pavement's 7 to 12).
const LAWN = 13;
const LEVELS = { high: 1, medium: 2, low: 4 }; // cells (of 50 cm) a class cell, at each level
const COLOUR = { high: 8, medium: 10, low: 20 }; // and cells a side a kind's colour square, at each
const OUT = path.join(ROOT, 'world', 'cover');
const WORK = path.join(CACHE, 'cover');
const DGT_CREDIT = { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' };

// ---- The point cloud, boiled down ----

// For each 50 cm cell of one of DGT's tiles (on its own grid, row 0 to the north): the mean intensity
// of the ground's points (0 where there's none), how many there are, how many points are a tree's
// (medium or high vegetation) and water's, and the top of every point in it (NaN where none), noise
// left out. Made once into .cache/dgt/cover/, and read by carriageways.mjs too (task 026), which keeps
// the tiles it reads: this keeps the last four.
export const CELLS = 2000;
const lidarCache = new Map();
export async function lidarCells(key) {
  if (lidarCache.has(key)) return lidarCache.get(key);
  const file = path.join(DGT, 'cover', key + '.bin.gz'), M = CELLS * CELLS;
  let c = null;
  if (fs.existsSync(file)) {
    const b = zlib.gunzipSync(fs.readFileSync(file));
    const at = (k, T, n) => new T(b.buffer.slice(b.byteOffset + k, b.byteOffset + k + n * T.BYTES_PER_ELEMENT));
    c = { int: at(0, Uint16Array, M), ground: at(2 * M, Uint8Array, M), tree: at(3 * M, Uint8Array, M), water: at(4 * M, Uint8Array, M), top: at(5 * M, Float32Array, M) };
  } else if (fs.existsSync(path.join(DGT, 'LAZ', key + '.laz'))) {
    const t0 = Date.now(), b = dgtBox(key), sum = new Float64Array(M);
    c = { int: new Uint16Array(M), ground: new Uint8Array(M), tree: new Uint8Array(M), water: new Uint8Array(M), top: new Float32Array(M).fill(NaN) };
    await points(key, (p) => {
      if (p.cls === 7 || p.cls === 18) return;
      const i = Math.floor((p.e - b.e0) / S), j = Math.floor((b.n1 - p.n) / S);
      if (i < 0 || j < 0 || i >= CELLS || j >= CELLS) return;
      const k = j * CELLS + i;
      if (!(p.y <= c.top[k])) c.top[k] = p.y;
      if (p.cls === 2) { sum[k] += p.i; if (c.ground[k] < 255) c.ground[k]++; }
      else if (p.cls === 4 || p.cls === 5) { if (c.tree[k] < 255) c.tree[k]++; }
      else if (p.cls === 9 && c.water[k] < 255) c.water[k]++;
    }, true);
    for (let k = 0; k < M; k++) if (c.ground[k]) c.int[k] = Math.min(65535, Math.max(1, Math.round(sum[k] / c.ground[k])));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([c.int, c.ground, c.tree, c.water, c.top].map((a) => Buffer.from(a.buffer))), { level: 6 }));
    console.log(`  the point cloud's ${key} boiled down (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  lidarCache.set(key, c);
  while (lidarCache.size > 4) lidarCache.delete(lidarCache.keys().next().value);
  return c;
}

// The point cloud's cells under a map tile's cells: the one each cell's centre falls in.
async function lidarGrid(box) {
  const tm = mapToTM(box), M = N * N;
  const g = { int: new Float32Array(M), ground: new Uint8Array(M), tree: new Uint8Array(M), water: new Uint8Array(M), top: new Float32Array(M).fill(NaN) };
  const at = new Int32Array(M), keyOf = new Int8Array(M), keys = tilesOver(box);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [e, n] = tm(box.x0 + (i + 0.5) * S, box.z0 + (j + 0.5) * S), key = tileKey(e, n), b = dgtBox(key);
    keyOf[j * N + i] = keys.indexOf(key);
    at[j * N + i] = Math.min(CELLS - 1, Math.floor((b.n1 - n) / S)) * CELLS + Math.min(CELLS - 1, Math.floor((e - b.e0) / S));
  }
  for (let q = 0; q < keys.length; q++) {
    const c = await lidarCells(keys[q]);
    if (!c) continue;
    for (let k = 0; k < M; k++) {
      if (keyOf[k] !== q) continue;
      const a = at[k];
      g.int[k] = c.int[a] / 1000; g.ground[k] = c.ground[a]; g.tree[k] = c.tree[a]; g.water[k] = c.water[a]; g.top[k] = c.top[a];
    }
  }
  return g;
}

// ---- Rasters ----

// Sets each cell whose centre is inside rings (an outline and its holes, even-odd) to v.
function fill(rings, cells, v, box) {
  let z0 = Infinity, z1 = -Infinity;
  for (const r of rings) for (const [, z] of r) { z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  for (let j = Math.max(0, Math.floor((z0 - box.z0) / S)); j <= Math.min(N - 1, Math.ceil((z1 - box.z0) / S)); j++) {
    const z = box.z0 + (j + 0.5) * S, xs = [];
    for (const r of rings) for (let k = 0; k < r.length; k++) { const [ax, az] = r[k], [bx, bz] = r[(k + 1) % r.length]; if (az > z !== bz > z) xs.push(ax + ((z - az) / (bz - az)) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil((xs[k] - box.x0) / S - 0.5)); i <= Math.min(N - 1, Math.floor((xs[k + 1] - box.x0) / S - 0.5)); i++) cells[j * N + i] = v;
  }
}

// Fills the cells `known` leaves out from those it has, for each of `ch` channels (a push-pull pyramid:
// each level up is the mean of what's known under it, and a cell missing takes the level above's,
// between its cells' centres, so the gap fills smoothly from its edges). Returns a new array.
function pushPull(vals, known, ch, n = N) {
  if (n === 1) return known[0] ? vals.slice(0, ch) : new Float32Array(ch);
  const h = Math.ceil(n / 2), sv = new Float32Array(h * h * ch), sk = new Float32Array(h * h);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i;
    if (!known[k]) continue;
    const p = (j >> 1) * h + (i >> 1);
    sk[p]++;
    for (let c = 0; c < ch; c++) sv[p * ch + c] += vals[k * ch + c];
  }
  const up = new Uint8Array(h * h);
  for (let p = 0; p < h * h; p++) if (sk[p]) { up[p] = 1; for (let c = 0; c < ch; c++) sv[p * ch + c] /= sk[p]; }
  const coarse = pushPull(sv, up, ch, h);
  const out = Float32Array.from(vals);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i;
    if (known[k]) continue;
    const u = Math.max(0, Math.min(h - 1.001, (i - 0.5) / 2)), v = Math.max(0, Math.min(h - 1.001, (j - 0.5) / 2));
    const a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b, p = b * h + a, a1 = Math.min(h - 1, a + 1), q = Math.min(h - 1, b + 1) * h;
    for (let c = 0; c < ch; c++) {
      const top = coarse[p * ch + c] * (1 - fu) + coarse[(b * h + a1) * ch + c] * fu, bot = coarse[(q + a) * ch + c] * (1 - fu) + coarse[(q + a1) * ch + c] * fu;
      out[k * ch + c] = top * (1 - fv) + bot * fv;
    }
  }
  return out;
}

// Each cell `from` leaves at `want` takes the value of the nearest cell that's one of `take`, within
// `reach` cells (a breadth-first spread, so nearest by steps); those beyond it keep `want`.
function spread(cls, want, take, reach) {
  let front = [];
  const dist = new Uint16Array(N * N).fill(65535);
  for (let k = 0; k < N * N; k++) if (take.has(cls[k])) { dist[k] = 0; front.push(k); }
  for (let d = 1; d <= reach && front.length; d++) {
    const next = [];
    for (const k of front) {
      const i = k % N, j = (k - i) / N;
      for (const q of [i > 0 ? k - 1 : -1, i < N - 1 ? k + 1 : -1, j > 0 ? k - N : -1, j < N - 1 ? k + N : -1]) {
        if (q < 0 || cls[q] !== want || dist[q] !== 65535) continue;
        dist[q] = d;
        cls[q] = cls[k];
        next.push(q);
      }
    }
    front = next;
  }
}

// Each cell that isn't one of `fixed` takes the most common kind round it (3 × 3), if that's at least 5.
function majority(cls, fixed) {
  const out = Uint8Array.from(cls), count = new Uint8Array(16);
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
    const k = j * N + i;
    if (fixed.has(cls[k])) continue;
    count.fill(0);
    let best = cls[k];
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      const v = cls[k + b * N + a];
      if (++count[v] > count[best]) best = v;
    }
    if (count[best] >= 5 && !fixed.has(best)) out[k] = best;
  }
  return out;
}

// Patches of a kind smaller than `min` cells (4-connected) take the kind most round them: what the photo
// shows of a car, a bin or a manhole, not the ground.
function islands(cls, min, fixed) {
  const seen = new Uint8Array(N * N), stack = [], patch = [], round = new Uint32Array(16);
  for (let s = 0; s < N * N; s++) {
    if (seen[s] || fixed.has(cls[s])) continue;
    const v = cls[s];
    patch.length = 0; round.fill(0);
    stack.push(s); seen[s] = 1;
    while (stack.length) {
      const k = stack.pop(), i = k % N;
      patch.push(k);
      for (const q of [i > 0 ? k - 1 : -1, i < N - 1 ? k + 1 : -1, k - N, k + N]) {
        if (q < 0 || q >= N * N) continue;
        if (cls[q] === v) { if (!seen[q]) { seen[q] = 1; stack.push(q); } }
        else round[cls[q]]++;
      }
    }
    if (patch.length >= min) continue;
    let best = -1;
    for (let c = 0; c < 16; c++) if (c !== ROOF && c !== WATER && round[c] && (best < 0 || round[c] > round[best])) best = c;
    if (best >= 0) for (const k of patch) cls[k] = best;
  }
}

// ---- Classing a tile ----

let ground; // the terrain, read when this runs on its own

async function classify(id) {
  const [ti, tj] = id.match(/-?\d+/g).map(Number), box = tileBox(ti, tj), M = N * N;
  const photo = orthoGrid(box, S);
  if (!photo) throw new Error(`${id}: the orthophoto or its near-infrared isn't fetched (node tools/fetch.mjs ortho nir)`);
  const lid = await lidarGrid(box);
  const world = await loadWorld({ x0: box.x0 + 1, x1: box.x1 - 1, z0: box.z0 + 1, z1: box.z1 - 1 });

  // What the data says outright: the buildings, the map's water, and the streets' surfaces where the
  // world draws them (at the ground's level), which are what every game draws there.
  const fixedKind = new Uint8Array(M).fill(255);
  for (const a of world.areas) if (a.kind === 'water') fill([a.pts, ...(a.holes ?? [])], fixedKind, WATER, box);
  const SURFACE = { asphalt: ASPHALT, setts: SETTS, paving: PAVING, dirt: SOIL, calcada: PAVING, concrete: PAVING, gravel: GRAVEL, metal: PAVING, wood: PAVING };
  for (const p of world.streets.paths) if (p.level === 'ground' || p.level === 'under') fill(p.rings, fixedKind, SURFACE[p.surface] ?? PAVING, box);
  // But a roundabout's island, which a game draws in what the ground is there (task 014).
  for (const p of world.streets.pavements) if (p.level === 'ground' && !p.round) fill(p.rings, fixedKind, PAVING, box);
  for (const c of world.streets.carriageways) if (c.level === 'ground') fill(c.rings, fixedKind, SURFACE[c.surface] ?? ASPHALT, box);
  for (const b of world.buildings) fill([b.pts], fixedKind, ROOF, box);
  // Where the map has woods, parks, lawns and fields: there, ground that echoes weakly is the floor of a
  // wood in its shade, not asphalt (the map's own paths and streets there stay what they are).
  const wooded = new Uint8Array(M);
  for (const a of world.areas) if (['forest', 'scrub', 'park', 'grass', 'farm'].includes(a.kind)) fill([a.pts, ...a.holes], wooded, 1, box);
  const ringed = new Uint8Array(M);
  for (const p of world.streets.pavements) if (p.level === 'ground' && p.round) fill(p.rings, ringed, 1, box);

  // The laser's intensity off the ground, the mean over 1.5 m round each cell weighted by its points,
  // and where there are none (under a car, a dense crown, a wall), the nearest there are.
  const sumI = new Float32Array(M), cnt = new Float32Array(M);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let s = 0, n = 0;
    for (let b = Math.max(0, j - 1); b <= Math.min(N - 1, j + 1); b++) for (let a = Math.max(0, i - 1); a <= Math.min(N - 1, i + 1); a++) { const q = b * N + a; s += lid.int[q] * lid.ground[q]; n += lid.ground[q]; }
    if (n) { sumI[j * N + i] = s / n; cnt[j * N + i] = 1; }
  }
  const I = pushPull(sumI, cnt, 1);

  const cls = new Uint8Array(M), crown = new Uint8Array(M), seen = new Uint8Array(M), standing = new Uint8Array(M);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, x = box.x0 + (i + 0.5) * S, z = box.z0 + (j + 0.5) * S;
    const r = photo.rgb[k * 3], g = photo.rgb[k * 3 + 1], b = photo.rgb[k * 3 + 2], L = (r + g + b) / 3;
    const ndvi = (photo.nir[k] - photo.red[k]) / Math.max(1, photo.nir[k] + photo.red[k]);
    const warm = (r - b) / (L + 1), green = (2 * g - r - b) / (L + 1);
    const over = Number.isNaN(lid.top[k]) ? 0 : lid.top[k] - ground.at(x, z);
    crown[k] = lid.tree[k] >= 2 && over > 1.5 ? 1 : 0;
    // What stands on the ground that isn't a tree or a building: a car, a bin, a wall.
    const thing = !crown[k] && over > 0.5 && over < 3;
    // As tall as a car, and not a plant: what parkedCars looks for cars in.
    standing[k] = thing && over > 0.9 && over < 2.4 && !lid.tree[k] && ndvi < 0.15 && fixedKind[k] !== ROOF ? 1 : 0;
    // The photo shows the ground, in the sun.
    seen[k] = !crown[k] && !thing && L >= 100 ? 1 : 0;
    if (fixedKind[k] !== 255) { cls[k] = fixedKind[k]; continue; }
    // Water: the point cloud's, or a pool's blue in the photo.
    if (lid.water[k] || (b > r + 25 && b > g && ndvi < 0 && over < 0.5)) { cls[k] = WATER; continue; }
    // Under a tree's crown the photo shows the tree, and the laser's echo off the ground is weaker for
    // the leaves it went through (asphalt's, though it's a lawn): the ground there is what's round it.
    if (crown[k]) { cls[k] = UNDER; continue; }
    // Something over 2.5 m that isn't a tree: on the map, where the world has every building, a carport,
    // a kiosk or a shed it leaves out, and the ground is what's round it; past the map's edge, where the
    // world has no buildings, a building.
    if (over > 2.5 && !lid.tree[k]) { cls[k] = x >= EXT.x0 && x <= EXT.x1 && z >= EXT.z0 && z <= EXT.z1 ? UNDER : ROOF; continue; }
    // A roundabout's lawn, dry or not.
    if (ringed[k] && I[k] > LAWN) { cls[k] = GRASS; continue; }
    // Plants on the ground: green in the near-infrared, and as the laser sees grass. Green with a weak
    // echo is a crown leaning over something in the photo (a street has the street's echo), or plants in
    // a wood's shade: what's round it.
    if (ndvi > 0.1) { cls[k] = I[k] > 9 ? GRASS : UNDER; continue; }
    // A pitch's artificial grass: green in the photo, not in the near-infrared.
    if (seen[k] && green > 0.15 && ndvi < 0.1) { cls[k] = GRASS; continue; }
    // Asphalt by its echo, but in a wood or a park. Setts echo between asphalt and paving, but so does
    // concrete, and the photo can't tell them apart at 25 cm: setts are only where the map says so.
    if (I[k] < 7.5) cls[k] = wooded[k] ? SOIL : ASPHALT;
    else if (!seen[k]) cls[k] = UNSEEN;
    else if (warm > 0.12 && ndvi > -0.03) cls[k] = SOIL;
    else if (warm > 0.06 && L > 150 && photo.grain[k] > 6) cls[k] = GRAVEL;
    else cls[k] = PAVING;
  }
  // Light ground the photo can't say more of (in a shadow, under a car) takes what the nearest light
  // ground is, within 10 m, else paving; the ground under a crown, the nearest ground, within 10 m, else
  // bare soil (a wood's floor).
  spread(cls, UNSEEN, new Set([PAVING, GRASS, SOIL, GRAVEL]), 20);
  for (let k = 0; k < M; k++) if (cls[k] === UNSEEN) cls[k] = PAVING;
  spread(cls, UNDER, new Set([ASPHALT, PAVING, SETTS, GRASS, SOIL, GRAVEL]), 20);
  for (let k = 0; k < M; k++) if (cls[k] === UNDER) cls[k] = SOIL;

  // Tidied: each cell the kind most round it, twice; then what's left smaller than 2 m² (a car the photo
  // shows, a manhole) the kind round it. What the data says outright stays.
  const fixed = new Set([ROOF, WATER]);
  let out = majority(majority(cls, fixed), fixed);
  for (let k = 0; k < M; k++) if (fixedKind[k] !== 255) out[k] = fixedKind[k];
  islands(out, 8, fixed);
  for (let k = 0; k < M; k++) if (fixedKind[k] !== 255) out[k] = fixedKind[k];

  const colour = Object.fromEntries(Object.entries(COLOUR).map(([l, b]) => [l, kindColours(out, seen, crown, photo, b)]));
  for (let k = 0; k < M; k++) if (crown[k]) out[k] |= CROWN;
  return { box, cls: out, colour, photo, cars: parkedCars(standing, box, world) };
}

// The ground's own colour, each kind's on a grid of its own over the tile (so one kind's never runs into
// the next's where they meet): in each square of b × b cells, the median of the photo where it shows
// that kind in the sun (so not a car or a manhole the photo shows on it, nor a shadow); where a kind has
// none, the nearest squares that have, smoothly. A kind the photo never shows on the tile in the sun,
// its median under the shadows; one the tile hasn't, its usual colour. And a ninth grid, the trees'
// crowns as the photo shows them from above, for a game to draw a crown's ground as from far off, where
// it draws fewer trees than there are. The grids one under the other, in KINDS's order and the crowns
// last: n wide and n × 9 high, three bytes a pixel.
const GRIDS = KINDS.length + 1;
const USUAL = [[134, 131, 128], [178, 172, 160], [150, 146, 138], [96, 112, 72], [150, 125, 100], [172, 164, 150], [60, 90, 96], [150, 140, 130], [62, 82, 50]];
function kindColours(cls, seen, crown, photo, b) {
  const n = N / b, out = new Uint8Array(n * n * GRIDS * 3), chan = [[], [], []], any = [[], [], []];
  for (let c = 0; c < GRIDS; c++) {
    const known = new Uint8Array(n * n), vals = new Float32Array(n * n * 3);
    let found = 0;
    for (const a of any) a.length = 0;
    for (let bj = 0; bj < n; bj++) for (let bi = 0; bi < n; bi++) {
      for (const a of chan) a.length = 0;
      for (let j = bj * b; j < bj * b + b; j++) for (let i = bi * b; i < bi * b + b; i++) {
        const k = j * N + i;
        if (c < KINDS.length ? cls[k] !== c : !crown[k]) continue;
        for (let ch = 0; ch < 3; ch++) (seen[k] || c === KINDS.length ? chan : any)[ch].push(photo.rgb[k * 3 + ch]);
      }
      if (chan[0].length < 6) continue;
      known[bj * n + bi] = 1; found++;
      for (let ch = 0; ch < 3; ch++) vals[(bj * n + bi) * 3 + ch] = chan[ch].sort((p, q) => p - q)[chan[ch].length >> 1];
    }
    const flat = found ? null : any[0].length ? any.map((a) => a.sort((p, q) => p - q)[a.length >> 1]) : USUAL[c];
    const filled = found ? pushPull(vals, known, 3, n) : null;
    for (let q = 0; q < n * n; q++) for (let ch = 0; ch < 3; ch++) out[(c * n * n + q) * 3 + ch] = Math.round(filled ? filled[q * 3 + ch] : flat[ch]);
  }
  return { n, data: out };
}

// ---- The parked cars ----

// Where each car stands (task 016, for the bays task 018 paints and the parked cars task 020 draws):
// what the point cloud saw 0.9 to 2.4 m over the ground on a July afternoon in 2025, not a plant, not
// in a building, in pieces of cells that touch. Each piece is measured along its longest way: one a car
// wide (1.2 to 2.6 m) is cars end to end, about 4.6 m each; one a car long (2.6 to 5.8 m) is cars side
// by side, about 2.3 m each; anything else isn't cars (a wall, a bin, a lorry). A car is
// - 'kerb': along a street, its middle within 2.5 m of the street's edge (or on it), lying along the
//   street or square to it;
// - 'park': in a car park (the map's), or one of five or more within 8 m of each other off the streets
//   (a car park the map lacks);
// - 'other': on a drive, in a yard.
// [x, z, angle (of its length, from x towards z, 0 to π), length, width, where].
const WHERE = ['other', 'kerb', 'park'];
function parkedCars(standing, box, world) {
  const seen = new Uint8Array(N * N), cars = [];
  for (let s = 0; s < N * N; s++) {
    if (!standing[s] || seen[s]) continue;
    const piece = [], stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const k = stack.pop(), i = k % N, j = (k - i) / N;
      piece.push(k);
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        const ii = i + a, jj = j + b, q = jj * N + ii;
        if (ii < 0 || jj < 0 || ii >= N || jj >= N || seen[q] || !standing[q]) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    if (piece.length * S * S < 3 || piece.length * S * S > 80) continue;
    // Its axes: the covariance's eigenvectors.
    let mx = 0, mz = 0;
    for (const k of piece) { mx += k % N; mz += Math.floor(k / N); }
    mx /= piece.length; mz /= piece.length;
    let xx = 0, xz = 0, zz = 0;
    for (const k of piece) { const dx = (k % N) - mx, dz = Math.floor(k / N) - mz; xx += dx * dx; xz += dx * dz; zz += dz * dz; }
    const angle = 0.5 * Math.atan2(2 * xz, xx - zz), ux = Math.cos(angle), uz = Math.sin(angle);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const k of piece) {
      const dx = (k % N) - mx, dz = Math.floor(k / N) - mz, a = dx * ux + dz * uz, b = -dx * uz + dz * ux;
      a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b);
    }
    const L = (a1 - a0 + 1) * S, W = (b1 - b0 + 1) * S, cx = box.x0 + (mx + 0.5) * S + ((a0 + a1) / 2) * ux * S, cz = box.z0 + (mz + 0.5) * S + ((a0 + a1) / 2) * uz * S;
    const put = (n, along, len, wid, ang) => {
      for (let c = 0; c < n; c++) {
        const t = (c + 0.5) / n - 0.5;
        cars.push([cx + t * L * ux, cz + t * L * uz, ((ang % Math.PI) + Math.PI) % Math.PI, len, wid]);
      }
    };
    if (W >= 1.2 && W <= 2.6 && L >= 2.8) {
      const n = Math.max(1, Math.round(L / 4.6));
      put(n, true, Math.min(5.5, L / n), W, angle);
    } else if (W > 2.6 && W <= 5.8 && L >= 1.4) {
      const n = Math.max(1, Math.round(L / 2.3));
      put(n, false, W, Math.min(2.4, L / n), angle + Math.PI / 2);
    }
  }
  // Where each is: along a street, in a car park, or neither.
  const streets = world.lines.filter((l) => l.level !== 'tunnel' && l.kind < 9);
  const parks = world.areas.filter((a) => a.kind === 'parking');
  // A car more than 2.8 m in from a street's edge, along it, is in its traffic: it was driving (-1).
  const where = cars.map(([x, z, ang]) => {
    let kerb = false;
    for (const l of streets) for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz;
      if (!len2) continue;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)), e = Math.hypot(x - ax - t * dx, z - az - t * dz) - l.w / 2;
      const along = Math.abs(Math.cos(ang - Math.atan2(dz, dx)));
      if (along > 0.9 && e < -2.8) return -1;
      // Along the kerb, its middle within 2.5 m of the edge; square to it, within a car's length.
      if ((along > 0.9 && e <= 2.5) || (along < 0.42 && e <= 5)) kerb = true;
    }
    if (kerb) return 1;
    return parks.some((p) => inRing(p.pts, x, z) && !p.holes.some((h) => inRing(h, x, z))) ? 2 : 0;
  });
  // Five or more off the streets within 8 m of each other: a car park.
  const groupOf = cars.map((_, i) => i), find = (i) => (groupOf[i] === i ? i : (groupOf[i] = find(groupOf[i])));
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) if (where[i] >= 0 && where[i] !== 1 && where[j] >= 0 && where[j] !== 1 && Math.hypot(cars[i][0] - cars[j][0], cars[i][1] - cars[j][1]) < 8) groupOf[find(i)] = find(j);
  const size = new Map();
  for (let i = 0; i < cars.length; i++) if (where[i] === 0 || where[i] === 2) size.set(find(i), (size.get(find(i)) ?? 0) + 1);
  for (let i = 0; i < cars.length; i++) if (where[i] === 0 && size.get(find(i)) >= 5) where[i] = 2;
  return cars.flatMap((c, i) => (where[i] < 0 ? [] : [[+c[0].toFixed(1), +c[1].toFixed(1), +c[2].toFixed(2), +c[3].toFixed(1), +c[4].toFixed(1), where[i]]]));
}

const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

// ---- Writing a tile ----

// A tile's classes at a coarser level: in each block of f × f cells, the kind most of it is, and a
// crown over it where one is over half.
function coarser(cls, f) {
  const n = N / f, out = new Uint8Array(n * n), count = new Uint16Array(8);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    count.fill(0);
    let crowns = 0;
    for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) { const v = cls[(j * f + b) * N + i * f + a]; count[v & 7]++; crowns += v >> 3; }
    let best = 0;
    for (let c = 1; c < 8; c++) if (count[c] > count[best]) best = c;
    out[j * n + i] = best | (crowns * 2 > f * f ? CROWN : 0);
  }
  return { n, data: out };
}

const padded = (n) => Math.ceil(n / 16) * 16;

async function write(id, made) {
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const sizes = [];
  for (const [l, f] of Object.entries(LEVELS)) {
    const { n, data } = coarser(made.cls, f);
    await sharp(Buffer.from(data), { raw: { width: n, height: n, channels: 1 } }).webp({ lossless: true, effort: 6 }).toFile(path.join(dir, `classes-${l}.webp`));
    // Each kind's grid padded to a whole number of WebP's 16-pixel blocks with its own edge, so the
    // compression never mixes two kinds' colours.
    const { n: m, data: rgb } = made.colour[l], p = padded(m), img = Buffer.alloc(p * p * GRIDS * 3);
    for (let c = 0; c < GRIDS; c++) for (let j = 0; j < p; j++) for (let i = 0; i < p; i++) {
      const from = (c * m * m + Math.min(m - 1, j) * m + Math.min(m - 1, i)) * 3, to = ((c * p + j) * p + i) * 3;
      img[to] = rgb[from]; img[to + 1] = rgb[from + 1]; img[to + 2] = rgb[from + 2];
    }
    await sharp(img, { raw: { width: p, height: p * GRIDS, channels: 3 } }).webp({ quality: 90, effort: 6 }).toFile(path.join(dir, `colour-${l}.webp`));
    sizes.push(`${l} ${(fs.statSync(path.join(dir, `classes-${l}.webp`)).size / 1024).toFixed(0)} + ${(fs.statSync(path.join(dir, `colour-${l}.webp`)).size / 1024).toFixed(0)} KB`);
  }
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.ktx2') || f.endsWith('.png')) fs.rmSync(path.join(dir, f));
  // The cars, a file of their own, which a game fetches when it draws them: six numbers each, x, z, the
  // angle of its length, its length and width, and where it is (WHERE's index).
  fs.writeFileSync(path.join(dir, 'cars.json'), JSON.stringify(made.cars.flat()));
  // The tile's index.
  const b = made.box;
  const file = (f, w, h) => `{ url: new URL('./${id}/${f}', import.meta.url).href, w: ${w}, h: ${h}, bytes: ${fs.statSync(path.join(dir, f)).size} }`;
  const classes = Object.entries(LEVELS).map(([l, f]) => `${l}: ${file(`classes-${l}.webp`, N / f, N / f)}`);
  const colour = Object.keys(LEVELS).map((l) => `${l}: { ${file(`colour-${l}.webp`, padded(made.colour[l].n), padded(made.colour[l].n) * GRIDS).slice(2, -2)}, squares: ${made.colour[l].n} }`);
  const cars = `{ url: new URL('./${id}/cars.json', import.meta.url).href, n: ${made.cars.length}, bytes: ${fs.statSync(path.join(dir, 'cars.json')).size} }`;
  fs.writeFileSync(
    path.join(OUT, id + '.js'),
    `// Made by tools/cover.mjs: what the ground is on tile ${id} (task 016), from DGT's 2025 LiDAR and orthophoto, and the cars\n` +
      `// its LiDAR saw parked there: in cars.json, each [x, z, angle, length, width, where (${WHERE.map((w, i) => `${i} ${w}`).join(', ')})].\n` +
      `export default {\n  tile: ${js(id)}, box: ${js({ x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 })},\n  classes: { ${classes.join(',\n    ')} },\n  colour: { ${colour.join(',\n    ')} },\n` +
      `  cars: ${cars},\n  credit: ${js(DGT_CREDIT)},\n};\n`,
  );
  return sizes.join(', ');
}

// The kinds' colours on the check page.
const SHOW = [[70, 70, 76], [215, 208, 190], [150, 120, 100], [100, 180, 70], [170, 110, 60], [225, 190, 120], [60, 120, 200], [200, 40, 40]];

async function check(id, made) {
  fs.mkdirSync(WORK, { recursive: true });
  const W = N * 3, img = Buffer.alloc(W * N * 3), { n, data } = made.colour.high, f = N / n;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, v = made.cls[k], s = SHOW[v & 7], dim = v & CROWN ? 0.7 : 1;
    // Its kind's colour, between the squares' middles.
    const u = Math.max(0, Math.min(n - 1.001, (i + 0.5) / f - 0.5)), w = Math.max(0, Math.min(n - 1.001, (j + 0.5) / f - 0.5));
    const a = Math.floor(u), b = Math.floor(w), fu = u - a, fv = w - b, p = ((v & 7) * n * n + b * n + a) * 3, q = p + n * 3;
    for (let ch = 0; ch < 3; ch++) {
      img[(j * W + i) * 3 + ch] = made.photo.rgb[k * 3 + ch];
      img[(j * W + N + i) * 3 + ch] = s[ch] * dim;
      img[(j * W + 2 * N + i) * 3 + ch] = Math.round((data[p + ch] * (1 - fu) + data[p + 3 + ch] * fu) * (1 - fv) + (data[q + ch] * (1 - fu) + data[q + 3 + ch] * fu) * fv);
    }
  }
  await sharp(img, { raw: { width: W, height: N, channels: 3 } }).png().toFile(path.join(WORK, id + '.png'));
}

// The loader of every tile's index made so far.
function writeIndexes() {
  const tiles = fs.readdirSync(OUT).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort();
  fs.writeFileSync(
    path.join(ROOT, 'world', 'cover.js'),
    `// Made by tools/cover.mjs: a loader for each tile's map of what the ground is (task 016), so a game only\n// downloads the index of those it loads; and the kinds of ground, in the order a cell's byte has them.\nexport const COVER = {\n${tiles.map((t) => `  ${js(t)}: () => import('./cover/${t}.js'),`).join('\n')}\n};\nexport const KINDS = ${js(KINDS)};\n`,
  );
  return tiles.length;
}

// ---- Making them ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ground = await terrain();
  const args = process.argv.slice(2);
  const checking = args.includes('--check');
  const named = args.filter((a) => !a.startsWith('--'));
  const B = amigos.box;
  const under = allTiles().map(([i, j]) => tileId(i, j)).filter((id) => { const [i, j] = id.match(/-?\d+/g).map(Number), b = tileBox(i, j); return b.x1 > B.x0 && b.x0 < B.x1 && b.z1 > B.z0 && b.z0 < B.z1; });
  for (const id of named) if (!under.includes(id) && !map().tiles.includes(id)) throw new Error(`no tile ${id}`);
  const todo = named.length ? named : under;
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of todo) {
    const t0 = Date.now();
    const made = await classify(id);
    const sizes = await write(id, made);
    if (checking) await check(id, made);
    const share = new Array(KINDS.length).fill(0), M = N * N;
    let crowns = 0;
    for (const v of made.cls) { share[v & 7]++; crowns += v >> 3; }
    const cars = WHERE.map((w, i) => `${made.cars.filter((c) => c[5] === i).length} ${w}`).join(', ');
    console.log(`${id}: ${KINDS.map((k, c) => `${k} ${((100 * share[c]) / M).toFixed(0)}%`).join(', ')}, under crowns ${((100 * crowns) / M).toFixed(0)}%; cars ${cars}; ${sizes} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  const n = writeIndexes();
  console.log(`${n} tiles → ${path.relative(ROOT, OUT)}/`);
}
