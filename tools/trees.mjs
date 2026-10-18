// Every tree DGT's 2025 LiDAR sees over the map (task 019): where it stands, how tall it is, how wide
// its crown and how high its crown's foot, and what kind of tree it is.
//
// node tools/trees.mjs                 after fetch.mjs (lidar, trees); before world.mjs (25
//                                      minutes the first time, then 40 s); with TREES=<name>.json,
//                                      into .cache/<name>.json, which world.mjs reads given the same
// node tools/trees.mjs --check x,z[,r] …   and the orthophoto round each point (r metres, 60 if left
//                                      out) with the crowns found over it, each in its kind's colour,
//                                      into .cache/trees/
//
// - .cache/dgt/trees/<tile>.bin.gz: each of the point cloud's tiles boiled down once (about 35 s a
//   tile) to 50 cm cells on DGT's grid, the terrain model's own: the highest and the lowest point of
//   high vegetation in each (class 5, 2 m and more over the ground) over the ground there, how many
//   there are and their colour (the near-infrared, red, green and blue the cloud has for each point),
//   and how many points are the ground's and a building's.
// - .cache/trees.json: every tree, [x, z, kind, height, crown, foot, mapped, cx, cz] each (index.d.ts's
//   Tree: its trunk at (x, z), its crown's middle at (cx, cz)), with how many of each kind and how many
//   OpenStreetMap's trees were matched.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CACHE, P, readCache, ROOT } from './geo.mjs';
import { pathToFileURL } from 'node:url';
import { CLASS, DGT, mapToTM, orthoGrid, points, readModel, tileKey, tileToMap, toTM } from './dgt.mjs';
import { inside } from './osm.mjs';
import { EXT } from './sections.mjs';

// ---------------------------------------------------------------------------------------------
// The point cloud, a tile at a time, as rasters of 50 cm cells: row 0 at the tile's north edge, on
// the terrain model's grid, so each point's height off the ground is over its own cell.

export const N = 2000, CELL = 0.5;
const TDIR = path.join(DGT, 'trees');
const LAYERS = [['top', Uint16Array], ['low', Uint16Array], ['n', Uint8Array], ['nir', Uint8Array], ['red', Uint8Array], ['green', Uint8Array], ['blue', Uint8Array], ['ground', Uint8Array], ['built', Uint8Array]];

// The ground under each cell's centre: the terrain at 50 cm where it was fetched, else at 2 m, between
// its cells' centres.
async function groundOf(key) {
  const fine = path.join(DGT, 'MDT-50cm', key + '.tif'), coarse = path.join(DGT, 'MDT-2m', key + '.tif');
  const g = new Float32Array(N * N).fill(NaN);
  if (fs.existsSync(fine)) {
    const m = await readModel(fine);
    if (m.w !== N || m.h !== N || m.res !== CELL) throw new Error(`MDT-50cm/${key}.tif isn't 2000 cells of 50 cm`);
    for (let c = 0; c < N * N; c++) { const v = m.data[c]; if (v !== m.nodata && v > -100) g[c] = v; }
    return g;
  }
  if (!fs.existsSync(coarse)) return null;
  const m = await readModel(coarse), k = CELL / m.res;
  const at = (i, j) => { const v = m.data[Math.max(0, Math.min(m.h - 1, j)) * m.w + Math.max(0, Math.min(m.w - 1, i))]; return v === m.nodata || v < -100 ? NaN : v; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const fx = (i + 0.5) * k - 0.5, fy = (j + 0.5) * k - 0.5, a = Math.floor(fx), b = Math.floor(fy), u = fx - a, v = fy - b;
    g[j * N + i] = (at(a, b) * (1 - u) + at(a + 1, b) * u) * (1 - v) + (at(a, b + 1) * (1 - u) + at(a + 1, b + 1) * u) * v;
  }
  return g;
}

// A tile's cells, boiled down from its point cloud the first time; null where the cloud wasn't fetched.
export async function treeCells(key) {
  const file = path.join(TDIR, key + '.bin.gz'), laz = path.join(DGT, 'LAZ', key + '.laz');
  if (!fs.existsSync(laz)) return null;
  const c = {};
  if (fs.existsSync(file) && fs.statSync(file).mtimeMs > fs.statSync(laz).mtimeMs) {
    const b = zlib.gunzipSync(fs.readFileSync(file));
    let at = 0;
    for (const [name, T] of LAYERS) { c[name] = new T(b.buffer.slice(b.byteOffset + at, b.byteOffset + at + N * N * T.BYTES_PER_ELEMENT)); at += N * N * T.BYTES_PER_ELEMENT; }
    return c;
  }
  const g = await groundOf(key);
  if (!g) throw new Error(`No terrain under ${key}: node tools/fetch.mjs lidar`);
  for (const [name, T] of LAYERS) c[name] = new T(N * N);
  const sum = { nir: new Uint32Array(N * N), red: new Uint32Array(N * N), green: new Uint32Array(N * N), blue: new Uint32Array(N * N) }, count = new Uint32Array(N * N);
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000, t0 = Date.now();
  await points(key, (p) => {
    const i = Math.floor((p.e - e0) / CELL), j = Math.floor((n1 - p.n) / CELL);
    if (i < 0 || j < 0 || i >= N || j >= N) return;
    const k = j * N + i;
    if (p.cls === CLASS.ground) { if (c.ground[k] < 255) c.ground[k]++; return; }
    if (p.cls === CLASS.building) { if (c.built[k] < 255) c.built[k]++; return; }
    if (p.cls !== CLASS.highVegetation || Number.isNaN(g[k])) return;
    const cm = Math.max(1, Math.min(65535, Math.round((p.y - g[k]) * 100)));
    if (cm > c.top[k]) c.top[k] = cm;
    if (!c.low[k] || cm < c.low[k]) c.low[k] = cm;
    count[k]++;
    sum.nir[k] += p.nir >> 8; sum.red[k] += p.r >> 8; sum.green[k] += p.g >> 8; sum.blue[k] += p.b >> 8;
  }, true);
  for (let k = 0; k < N * N; k++) {
    if (!count[k]) continue;
    c.n[k] = Math.min(255, count[k]);
    for (const b of ['nir', 'red', 'green', 'blue']) c[b][k] = Math.round(sum[b][k] / count[k]);
  }
  fs.mkdirSync(TDIR, { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat(LAYERS.map(([name]) => Buffer.from(c[name].buffer))), { level: 6 }));
  console.log(`  the point cloud's ${key} boiled down (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  return c;
}


// ---------------------------------------------------------------------------------------------
// The crowns, a tile at a time with 20 m round it from the tiles beside it, so a crown across an edge
// is whole: the canopy's height in each cell (the highest point of high vegetation over the ground),
// its pits filled and smoothed; then every cell from the highest down joins the crown of the highest
// cell next to it, or starts a crown of its own, and where two crowns meet, the lower is a bump on the
// higher if its top stands less than PROM over where they meet (and not too far off): a tree is a top
// that stands out of the canopy round it.

export const M = 40, W = N + 2 * M; // the cells round a tile, and a side of the tile with them
const H_MIN = 3; // a tree is at least this tall
const PROM = (h) => Math.max(1, 0.06 * h); // how far a top must stand over where it meets a higher one
const REACH = (h) => Math.max(3, 0.35 * h); // and a bump is no further from the top it's part of
// A crown's foot: this far up the lowest points in its cells, and no higher than FOOT_MAX of its height
// (under a thick crown the laser seldom reaches its lowest leaves).
const FOOT = 0.05, FOOT_MAX = 0.6;

// Empty layers over W × W cells.
export const layers = () => Object.fromEntries(LAYERS.map(([name, T]) => [name, new T(W * W)]));

const loaded = new Map();
async function cellsOf(key) {
  if (loaded.has(key)) { const c = loaded.get(key); loaded.delete(key); loaded.set(key, c); return c; }
  const c = await treeCells(key);
  loaded.set(key, c);
  while (loaded.size > 12) loaded.delete(loaded.keys().next().value);
  return c;
}

// A tile's canopy with the cells round it: each layer of treeCells on W × W cells, the tile's own from
// (M, M), as canopyOf has it.
async function canopy(key) {
  const [ke, kn] = key.split('_').map(Number), g = layers();

  for (const dn of [1, 0, -1]) for (const di of [-1, 0, 1]) {
    const c = await cellsOf(`${ke + di}_${kn + dn}`);
    if (!c) continue;
    const i0 = Math.max(0, -M - di * N), i1 = Math.min(N, W - M - di * N), j0 = Math.max(0, -M + dn * N), j1 = Math.min(N, W - M + dn * N);
    for (let j = j0; j < j1; j++) {
      const at = (M - dn * N + j) * W + M + di * N;
      for (const [name] of LAYERS) g[name].set(c[name].subarray(j * N + i0, j * N + i1), at + i0);
    }
  }
  return canopyOf(g);
}

// The canopy over W × W cells of treeCells' layers: its height in metres (h), its pits filled, and
// smoothed (s).
export function canopyOf(g) {
  const h = new Float32Array(W * W);
  for (let k = 0; k < W * W; k++) h[k] = g.top[k] / 100;
  // A cell no point of the crown fell in, with most round it in a crown, is a gap between them.
  for (let pass = 0; pass < 2; pass++) {
    const fill = [];
    for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i;
      if (h[k]) continue;
      let n = 0, sum = 0;
      for (const q of [k - W - 1, k - W, k - W + 1, k - 1, k + 1, k + W - 1, k + W, k + W + 1]) if (h[q]) n++, sum += h[q];
      if (n >= 5) fill.push(k, sum / n);
    }
    for (let f = 0; f < fill.length; f += 2) h[fill[f]] = fill[f + 1];
  }
  const s = new Float32Array(W * W);
  for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i;
    if (!h[k]) continue;
    s[k] = (4 * h[k] + 2 * (h[k - 1] + h[k + 1] + h[k - W] + h[k + W]) + h[k - W - 1] + h[k - W + 1] + h[k + W - 1] + h[k + W + 1]) / 16;
  }
  return { g, h, s };
}

// The crowns on a canopy: each cell's crown (lab, -1 where none) and each crown's top cell (topAt).
export function crowns({ s }) {
  // The cells 2 m and more over the ground, highest first (a counting sort by the centimetre).
  const cm = new Uint16Array(W * W);
  let max = 0, count = 0;
  for (let k = 0; k < W * W; k++) if (s[k] >= 2) { cm[k] = Math.min(9999, Math.round(s[k] * 100)); max = Math.max(max, cm[k]); count++; }
  const starts = new Uint32Array(max + 2);
  for (let k = 0; k < W * W; k++) if (cm[k]) starts[cm[k]]++;
  for (let v = max, at = 0; v >= 0; v--) { const n = starts[v]; starts[v] = at; at += n; }
  const order = new Uint32Array(count);
  for (let k = 0; k < W * W; k++) if (cm[k]) order[starts[cm[k]]++] = k;
  const lab = new Int32Array(W * W).fill(-1), top = [], topAt = [], par = [];
  const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const dist = (a, b) => Math.hypot((a % W) - (b % W), Math.floor(a / W) - Math.floor(b / W)) * CELL;
  const round = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];
  for (const k of order) {
    const i = k % W;
    let best = -1, bestS = -1;
    const roots = [];
    for (const d of round) {
      const q = k + d, qi = q % W;
      if (q < 0 || q >= W * W || Math.abs(qi - i) > 1 || lab[q] < 0) continue;
      const r = find(lab[q]);
      if (s[q] > bestS) { bestS = s[q]; best = r; }
      if (!roots.includes(r)) roots.push(r);
    }
    if (best < 0) { lab[k] = top.length; par.push(top.length); top.push(s[k]); topAt.push(k); continue; }
    lab[k] = best;
    for (const r of roots) {
      const a = find(r), b = find(best);
      if (a === b) continue;
      const lo = top[a] < top[b] ? a : b, hi = lo === a ? b : a;
      if (top[lo] - s[k] < PROM(top[lo]) && dist(topAt[lo], topAt[hi]) <= REACH(top[hi])) par[lo] = hi;
    }
  }
  for (let k = 0; k < W * W; k++) if (lab[k] >= 0) lab[k] = find(lab[k]);
  return { lab, topAt };
}

// A crown much narrower than its height that mostly meets other crowns is a sliver of their canopy, a
// top the flood left between them (a tall poplar's or cypress's narrow crown meets open ground): it
// joins the crown it meets most.
export function mergeSlivers({ h }, { lab }) {
  const top = new Map(), area = new Map(), edges = new Map(), meets = new Map();
  for (let k = 0; k < W * W; k++) { const r = lab[k]; if (r >= 0 && h[k] > (top.get(r) ?? 0)) top.set(r, h[k]); }
  for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i, r = lab[k];
    if (r < 0 || h[k] < Math.max(2, 0.25 * top.get(r))) continue;
    area.set(r, (area.get(r) ?? 0) + 1);
    for (const q of [k - 1, k + 1, k - W, k + W]) {
      const o = lab[q];
      if (o === r) continue;
      edges.set(r, (edges.get(r) ?? 0) + 1);
      if (o >= 0 && h[q] >= 0.5 * top.get(r)) { let m = meets.get(r); if (!m) meets.set(r, (m = new Map())); m.set(o, (m.get(o) ?? 0) + 1); }
    }
  }
  const into = new Map();
  for (const [r, a] of area) {
    const width = 2 * Math.sqrt((a * CELL * CELL) / Math.PI), m = meets.get(r);
    if (!m || width >= Math.max(2.5, 0.25 * top.get(r))) continue;
    const [o, n] = [...m].reduce((p, q) => (q[1] > p[1] ? q : p));
    if (n >= 0.5 * edges.get(r)) into.set(r, o);
  }
  const final = (r) => { for (let n = 0; into.has(r) && n < 20; n++) r = into.get(r); return r; };
  for (let k = 0; k < W * W; k++) if (lab[k] >= 0 && into.has(lab[k])) lab[k] = final(lab[k]);
  return into.size;
}

// A crown with no trunk under it is a limb of the taller crown it meets, reaching out past the reach a
// bump may be from its top: a big tree's over a square, a willow's over a path (task 063). It's as narrow
// as a cypress or a poplar (kindOf's NARROW), but holds its leaves in its upper half, where theirs come
// down near the ground, so nothing of it comes down to where its trunk would be; and the taller crown
// borders it along a share of its edge (MEETS). It joins the taller crown it meets most. How many joined
// whose tops are on the tile itself.
const NARROW = 2.8, MEETS = 0.2;
export function mergeStemless({ g, h }, { lab }) {
  const top = new Map(), topAt = new Map(), area = new Map(), lows = new Map(), edges = new Map(), meets = new Map();
  for (let k = 0; k < W * W; k++) { const r = lab[k]; if (r >= 0 && h[k] > (top.get(r) ?? 0)) { top.set(r, h[k]); topAt.set(r, k); } }
  for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i, r = lab[k];
    if (r < 0 || h[k] < Math.max(2, 0.25 * top.get(r))) continue;
    area.set(r, (area.get(r) ?? 0) + 1);
    if (g.low[k]) { let l = lows.get(r); if (!l) lows.set(r, (l = [])); l.push(g.low[k] / 100); }
    for (const q of [k - 1, k + 1, k - W, k + W]) {
      const o = lab[q];
      if (o === r) continue;
      edges.set(r, (edges.get(r) ?? 0) + 1);
      if (o >= 0 && top.get(o) > top.get(r) && h[q] >= 0.5 * top.get(r)) { let m = meets.get(r); if (!m) meets.set(r, (m = new Map())); m.set(o, (m.get(o) ?? 0) + 1); }
    }
  }
  const into = new Map();
  for (const [r, m] of meets) {
    const t = top.get(r), width = 2 * Math.sqrt((area.get(r) * CELL * CELL) / Math.PI), l = (lows.get(r) ?? []).sort((u, v) => u - v);
    const foot = Math.min(FOOT_MAX * t, l.length ? l[Math.floor(l.length * FOOT)] : 2);
    if (t < NARROW * width || foot < 0.5 * t) continue;
    const [o, n] = [...m].reduce((p, q) => (q[1] > p[1] ? q : p));
    if (n >= MEETS * edges.get(r)) into.set(r, o);
  }
  const final = (r) => { for (let n = 0; into.has(r) && n < 20; n++) r = into.get(r); return r; };
  for (let k = 0; k < W * W; k++) if (lab[k] >= 0 && into.has(lab[k])) lab[k] = final(lab[k]);
  const own = (k) => { const i = k % W, j = (k - i) / W; return i >= M && j >= M && i < M + N && j < M + N; };
  return [...into.keys()].filter((r) => own(topAt.get(r))).length;
}

// Each crown whose top is on the tile itself: its top (the highest point in it) and the tree's height
// there; its crown's area, the cells it covers 2 m and more and a quarter of its height over the ground
// (not the hedge or the shrubs it stands in), and so its width (as a disc's), and its middle (mx, mz),
// where it's drawn, off its top where it spreads to one side (task 063); its crown's foot, the
// median of the lowest points in its cells; its colour in the point cloud, and how much of the laser
// went through it to the ground. Each in metres on the map. Where OpenStreetMap maps two trees or more
// in one crown (`seeds`, by the crown's label: [cell, tree] each), the crowns ran together, and each
// mapped tree takes the cells nearest it, where the map has it.
export function measure(key, { g, h }, { lab }, seeds = new Map()) {
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000, toMap = tileToMap(key);
  const by = new Map();
  for (let k = 0; k < W * W; k++) {
    const r = lab[k];
    if (r < 0) continue;
    let cells = by.get(r);
    if (!cells) by.set(r, (cells = []));
    cells.push(k);
  }
  const parts = [];
  for (const [r, cells] of by) {
    const mapped = seeds.get(r) ?? [];
    if (mapped.length < 2) { parts.push({ r, cells, osm: mapped[0]?.[1] ?? null, at: null }); continue; }
    const split = mapped.map(([k, osm]) => ({ r, cells: [], osm, at: k }));
    for (const k of cells) {
      const i = k % W, j = (k - i) / W;
      let best = split[0], bd = Infinity;
      for (const p of split) { const d = ((p.at % W) - i) ** 2 + (Math.floor(p.at / W) - j) ** 2; if (d < bd) { bd = d; best = p; } }
      best.cells.push(k);
    }
    parts.push(...split);
  }
  const out = [];
  const tm = (i, j) => toMap(e0 + (i - M + 0.5) * CELL, n1 - (j - M + 0.5) * CELL);
  for (const p of parts) {
    let top = 0, at = -1;
    for (const k of p.cells) if (h[k] > top) { top = h[k]; at = k; }
    const where = p.at ?? at, ti = where % W, tj = (where - ti) / W;
    if (top < H_MIN || ti < M || tj < M || ti >= M + N || tj >= M + N) continue;
    const edge = Math.max(2, 0.25 * top), lows = [];
    let a = 0, cx = 0, cz = 0, pts = 0, gnd = 0, built = 0, nir = 0, red = 0, green = 0, blue = 0, sumH = 0;
    for (const k of p.cells) {
      if (h[k] < edge) continue;
      const i = k % W, j = (k - i) / W, n = g.n[k];
      a++; cx += i; cz += j; sumH += h[k];
      if (g.low[k]) lows.push(g.low[k] / 100);
      pts += n; gnd += g.ground[k]; built += g.built[k];
      nir += g.nir[k] * n; red += g.red[k] * n; green += g.green[k] * n; blue += g.blue[k] * n;
    }
    // Not a plant: what the laser classed as one where the photo sees no leaf (no more near-infrared than
    // red: a wall's edge, a roof, a crane), or that's mostly over a roof.
    if (a < 4 || !pts || (!p.osm && (nir < red * 0.95 || built > pts))) continue;
    lows.sort((u, v) => u - v);
    const [x, z] = p.osm ? p.osm.at : tm(ti, tj), [mx, mz] = tm(cx / a, cz / a);
    out.push({
      r: p.r, x, z, mx, mz, osm: p.osm,
      h: top,
      area: a * CELL * CELL,
      crown: 2 * Math.sqrt((a * CELL * CELL) / Math.PI),
      foot: Math.min(FOOT_MAX * top, lows.length ? lows[Math.floor(lows.length * FOOT)] : 2),
      mean: sumH / a,
      through: gnd / (gnd + pts),
      built: built / (built + pts),
      density: pts / (a * CELL * CELL),
      colour: [nir / pts, red / pts, green / pts, blue / pts],
    });
  }
  return out;
}

// OpenStreetMap's trees on a tile and round it, each in the crown it stands in, or the nearest within
// 2.5 m: by crown, [the tree's cell, the tree] each; and those in no crown, on the tile itself.
function matchOsm(key, { lab }, osm) {
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000;
  const seeds = new Map(), lone = [];
  for (const t of osm) {
    const i = Math.floor((t.e - e0) / CELL) + M, j = Math.floor((n1 - t.n) / CELL) + M;
    if (i < 0 || j < 0 || i >= W || j >= W) continue;
    const at = j * W + i;
    let r = lab[at];
    for (let d = 1; r < 0 && d <= 5; d++) {
      let bd = Infinity;
      for (let v = Math.max(0, j - d); v <= Math.min(W - 1, j + d); v++) for (let u = Math.max(0, i - d); u <= Math.min(W - 1, i + d); u++) {
        const q = v * W + u, dd = (u - i) ** 2 + (v - j) ** 2;
        if (lab[q] >= 0 && dd <= d * d && dd < bd) { bd = dd; r = lab[q]; }
      }
    }
    if (r < 0) { if (i >= M && j >= M && i < M + N && j < M + N) lone.push(t); continue; }
    if (!seeds.has(r)) seeds.set(r, []);
    seeds.get(r).push([at, t]);
  }
  return { seeds, lone };
}

// OpenStreetMap's trees, each node of a row of trees one too, with where each is in DGT's grid.
export function osmTrees() {
  const out = [];
  for (const e of readCache('osm/trees.json').elements) {
    if (e.type === 'node') out.push({ id: e.id, at: P(e), tags: e.tags ?? {} });
    else for (const g of e.geometry) out.push({ id: e.id, at: P(g), tags: e.tags ?? {}, row: true });
  }
  for (const t of out) [t.e, t.n] = toTM(...t.at);
  return out;
}

// The trees on one of DGT's tiles, measured, and OpenStreetMap's there that stand in no crown.
export async function treesOn(key, osm) {
  const c = await canopy(key), k = crowns(c);
  mergeSlivers(c, k);
  const limbs = mergeStemless(c, k);
  const { seeds, lone } = matchOsm(key, k, osm);
  return { trees: measure(key, c, k, seeds), lone, limbs, c, k };
}

// ---------------------------------------------------------------------------------------------
// What kind each tree is: the map's species, genus or leaf type where it names one; on the hills, the
// species of the wood it stands in, as DGT's COS2025 has it (a wood of 1 ha or more by its main species:
// eucalyptus, maritime or stone pine, oaks, cork oaks, acacias, other broadleaves); elsewhere a
// broadleaf, but for the narrow and tall: a poplar where the photo sees a broadleaf's leaves (more
// near-infrared), else a cypress or a cedar; a tree taller than the town's that holds its crown high, a
// eucalyptus; and a tall tree that holds its crown high and is dark in the near-infrared, as needles are,
// a pine (a quarter of the trees in COS2025's pine woods are, against 3 to 10% in its other woods).

// Nine kinds since task 061, each a shape and a bark and leaves of its own: the plane (pale, mottled bark,
// big leaves, an open crown), the lime (a dense round crown of heart-shaped leaves, clipped into a ball on
// the Imaculada Conceição) and the birch (white bark, fine twigs hanging) as the photos show them.
// EVERGREEN: the kinds that keep their leaves in winter, for the seasons ("Later" in the roadmap).
export const KINDS = ['broadleaf', 'pine', 'eucalyptus', 'conifer', 'poplar', 'palm', 'plane', 'lime', 'birch'];
const [BROADLEAF, PINE, EUCALYPTUS, CONIFER, POPLAR, PALM, PLANE, LIME, BIRCH] = KINDS.keys();
export const EVERGREEN = new Set(['pine', 'eucalyptus', 'conifer', 'palm']);

// The kind OpenStreetMap's tags name, or -1.
export function osmKind(tags) {
  const name = [tags.species, tags.genus, tags.taxon, tags['species:pt'], tags['genus:pt']].filter(Boolean).join(' ').toLowerCase();
  if (/eucalyptus|eucalipto/.test(name)) return EUCALYPTUS;
  if (/pinus|pinheiro/.test(name)) return PINE;
  if (/populus|choupo|álamo/.test(name)) return POPLAR;
  if (/platanus|plátano/.test(name)) return PLANE;
  if (/tilia|tília/.test(name)) return LIME;
  if (/betula|bétula|vidoeiro/.test(name)) return BIRCH;
  if (/phoenix|washingtonia|trachycarpus|chamaerops|butia|syagrus|palm|cordyline/.test(name) || tags.leaf_type === 'palm') return PALM;
  if (/cupressus|chamaecyparis|cedrus|taxus|thuja|cryptomeria|sequoia|abies|picea|araucaria|juniperus|cipreste|cedro|teixo/.test(name)) return CONIFER;
  if (tags.leaf_type === 'needleleaved') return CONIFER;
  if (name || tags.leaf_type === 'broadleaved') return BROADLEAF;
  return -1;
}

// COS2025's woods (its classes 4 and 5, the agroforestry and the forests) on a grid of 2 m over the
// map: the kind each one's main species is, or -1.
const COS_KIND = { '5.1.1.6': EUCALYPTUS, '5.1.2.1': PINE, '5.1.2.2': PINE, '5.1.2.3': CONIFER };
export function woods() {
  const S = 2, X0 = EXT.x0 - 200, Z0 = EXT.z0 - 200, NX = Math.ceil((EXT.x1 - EXT.x0 + 400) / S), NZ = Math.ceil((EXT.z1 - EXT.z0 + 400) / S);
  const grid = new Int8Array(NX * NZ).fill(-1);
  const file = path.join(DGT, 'cos2025.json');
  if (fs.existsSync(file)) for (const f of JSON.parse(fs.readFileSync(file, 'utf8')).features) {
    const c = f.properties.cos25v1_n4_c;
    if (!/^[45]\./.test(c)) continue;
    const kind = COS_KIND[c] ?? (/^5\.1\.2/.test(c) ? CONIFER : BROADLEAF);
    for (const poly of f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]) {
      const rings = poly.map((r) => r.map(([lon, lat]) => P({ lat, lon })));
      const zs = rings[0].map((p) => p[1]);
      for (let j = Math.max(0, Math.floor((Math.min(...zs) - Z0) / S)); j <= Math.min(NZ - 1, Math.ceil((Math.max(...zs) - Z0) / S)); j++) {
        const z = Z0 + (j + 0.5) * S, xs = [];
        for (const r of rings) for (let k = 0; k < r.length; k++) { const [ax, az] = r[k], [bx, bz] = r[(k + 1) % r.length]; if (az > z !== bz > z) xs.push(ax + ((z - az) / (bz - az)) * (bx - ax)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil((xs[k] - X0) / S - 0.5)); i <= Math.min(NX - 1, Math.floor((xs[k + 1] - X0) / S - 0.5)); i++) grid[j * NX + i] = kind;
      }
    }
  }
  return (x, z) => { const i = Math.floor((x - X0) / S), j = Math.floor((z - Z0) / S); return i >= 0 && j >= 0 && i < NX && j < NZ ? grid[j * NX + i] : -1; };
}

// A tree's kind: as a session saw it (refs/trees.json, `ref.seen`); else the species the map names;
// else its row's or its place's (`ref`, the trees of a row seen along the same street); else as below.
export function kindOf(t, wood, ref = null) {
  if (ref?.seen) return ref.kind;
  const tags = t.osm?.tags ?? {}, named = t.osm ? osmKind(tags) : -1, specific = tags.species || tags.genus || tags.taxon || tags['species:pt'] || tags['genus:pt'];
  if (named >= 0 && specific) return named;
  if (ref) return ref.kind;
  if (named === CONIFER && tags.leaf_type === 'needleleaved') return wood === PINE || t.foot > 0.45 * t.h ? PINE : CONIFER;
  if (named >= 0) return named;
  if (wood >= 0) return wood;
  const leafy = (t.colour[0] - t.colour[1]) / (t.colour[0] + t.colour[1]);
  if (t.h >= 8 && t.h >= 2.8 * t.crown) return leafy >= 0.12 ? POPLAR : CONIFER;
  if (t.h >= 22 && t.foot >= 0.45 * t.h) return EUCALYPTUS;
  if (t.h >= 10 && t.foot >= 0.4 * t.h && t.colour[0] < 150) return PINE;
  return BROADLEAF;
}

// ---------------------------------------------------------------------------------------------
// The trees seen (task 061, refs/trees.json), each matched to the tree of the map it is: the one whose
// crown's middle is nearest where it was seen, within half its crown's width or 3 m. Then each row's
// trees, those whose trunks stand within its `within` of its line, and each place's, those whose trunks
// are in its ring, but those seen. For each tree it names, what kindOf takes as `ref`: its kind, whether
// it was seen, its species; the trees seen that no tree of the map is (unmatched); the trees looked at,
// those seen hidden among them; and how many a row or a place named.

export const SEEN = path.join(ROOT, 'refs', 'trees.json');

export function refsOf(trees, seen = JSON.parse(fs.readFileSync(SEEN, 'utf8'))) {
  const kindOfSpecies = (s) => KINDS.indexOf(seen.species[s].kind);
  const refs = new Map(), C = 10, cells = new Map(), key = (i, j) => i * 100000 + j;
  const mid = (t) => [t.mx ?? t.x, t.mz ?? t.z];
  for (const t of trees) {
    const [x, z] = mid(t), k = key(Math.floor(x / C), Math.floor(z / C));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(t);
  }
  const unmatched = [], looked = new Set();
  for (const s of seen.trees) {
    const [x, z] = s.at;
    let best = null, bd = Infinity;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const t of cells.get(key(Math.floor(x / C) + i, Math.floor(z / C) + j)) ?? []) {
      const [mx, mz] = mid(t), d = Math.hypot(mx - x, mz - z);
      if (d <= Math.max(3, t.crown / 2) && d < bd) { bd = d; best = t; }
    }
    if (!best) { unmatched.push(s); continue; }
    looked.add(best);
    if (s.species) refs.set(best, { kind: kindOfSpecies(s.species), seen: true, species: s.species });
  }
  const segDist = (x, z, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, u = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0; return Math.hypot(x - ax - u * dx, z - az - u * dz); };
  const boxOf = (pts, m) => ({ x0: Math.min(...pts.map((p) => p[0])) - m, x1: Math.max(...pts.map((p) => p[0])) + m, z0: Math.min(...pts.map((p) => p[1])) - m, z1: Math.max(...pts.map((p) => p[1])) + m });
  const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
  let rows = 0, areas = 0;
  for (const r of seen.rows ?? []) {
    const b = boxOf(r.line, r.within), kind = kindOfSpecies(r.species);
    for (const t of trees) {
      if (looked.has(t) || refs.has(t) || !inBox(b, t.x, t.z)) continue;
      for (let i = 1; i < r.line.length; i++) if (segDist(t.x, t.z, r.line[i - 1], r.line[i]) <= r.within) { refs.set(t, { kind, seen: false, species: r.species }); rows++; break; }
    }
  }
  for (const a of seen.areas ?? []) {
    const b = boxOf(a.ring, 0), kind = kindOfSpecies(a.species);
    for (const t of trees) if (!looked.has(t) && !refs.has(t) && inBox(b, t.x, t.z) && inside(a.ring, t.x, t.z)) { refs.set(t, { kind, seen: false, species: a.species }); areas++; }
  }
  return { refs, unmatched, looked, rows, areas };
}

// ---------------------------------------------------------------------------------------------
// --check: the orthophoto round a point, with each crown found outlined in its kind's colour and its
// top marked, as .cache/trees/<x>_<z>.png.

const SHOW = [[255, 255, 255], [255, 60, 60], [80, 160, 255], [255, 220, 0], [120, 255, 120], [255, 0, 255], [255, 140, 0], [0, 255, 255], [190, 190, 190]];
async function check(x, z, r, osm, wood) {
  const { default: sharp } = await import('sharp');
  const box = { x0: x - r, x1: x + r, z0: z - r, z1: z + r }, step = 0.25, o = orthoGrid(box, step), tm = mapToTM(box);
  if (!o) return console.log(`  no orthophoto round ${x}, ${z}`);
  const keys = [...new Set([[box.x0, box.z0], [box.x1, box.z0], [box.x0, box.z1], [box.x1, box.z1]].map(([px, pz]) => tileKey(...tm(px, pz))))];
  const found = new Map();
  for (const key of keys) {
    const t = await treesOn(key, osm), { refs } = refsOf(t.trees), kinds = new Map(t.trees.map((u) => [u.r, kindOf(u, wood(u.x, u.z), refs.get(u))]));
    found.set(key, { ...t, kinds });
  }
  const { nx, nz } = o, lab = new Float64Array(nx * nz).fill(-1), kindAt = new Map(), px = Buffer.from(o.rgb);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const [e, n] = tm(box.x0 + (i + 0.5) * step, box.z0 + (j + 0.5) * step), key = tileKey(e, n), d = found.get(key);
    if (!d) continue;
    const [ke, kn] = key.split('_').map(Number), q = (Math.floor((kn * 1000 + 1000 - n) / CELL) + M) * W + Math.floor((e - ke * 1000) / CELL) + M, l = d.k.lab[q];
    if (l < 0 || !d.kinds.has(l) || d.c.h[q] < 2) continue;
    const id = l + keys.indexOf(key) * 1e7;
    lab[j * nx + i] = id;
    kindAt.set(id, d.kinds.get(l));
  }
  for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const k = j * nx + i, l = lab[k];
    if (l < 0 || (lab[k - 1] === l && lab[k + 1] === l && lab[k - nx] === l && lab[k + nx] === l)) continue;
    px.set(SHOW[kindAt.get(l)], k * 3);
  }
  // Each trunk a red cross, and its crown's middle a cyan one where that's off it.
  for (const d of found.values()) for (const t of d.trees) for (const [x, z, c] of [[t.mx, t.mz, [0, 255, 255]], [t.x, t.z, [255, 0, 0]]]) {
    const i = Math.round((x - box.x0) / step), j = Math.round((z - box.z0) / step);
    for (let a = -3; a <= 3; a++) for (const [u, v] of [[i + a, j], [i, j + a]]) if (u >= 0 && v >= 0 && u < nx && v < nz) px.set(c, (v * nx + u) * 3);
  }
  const file = path.join(CACHE, 'trees', `${x}_${z}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(px, { raw: { width: nx, height: nz, channels: 3 } }).png().toFile(file);
  console.log(`  ${path.relative(CACHE, file)}: ${KINDS.map((k, i) => `${k} ${['white', 'red', 'blue', 'yellow', 'green', 'magenta', 'orange', 'cyan', 'grey'][i]}`).join(', ')}`);
}

// ---------------------------------------------------------------------------------------------
// Every tree, into .cache/trees.json, or the file TREES names there (a worktree's own, beside main's).

export const TREES = process.env.TREES || 'trees.json';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), t0 = Date.now();
  const osm = osmTrees(), wood = woods();
  if (args[0] === '--check') {
    for (const a of args.slice(1)) { const [x, z, r = 60] = a.split(',').map(Number); await check(x, z, r, osm, wood); }
    process.exit(0);
  }
  const keys = fs.readdirSync(path.join(DGT, 'LAZ')).filter((f) => f.endsWith('.laz')).map((f) => f.slice(0, -4)).sort();
  const found = [], lone = [];
  let limbs = 0;
  for (const key of keys) {
    const r = await treesOn(key, osm);
    found.push(...r.trees);
    lone.push(...r.lone);
    limbs += r.limbs;
  }
  // OpenStreetMap's trees in no crown: planted since July 2025, or under 3 m then. Each is kept where no
  // tree the LiDAR found stands within 4 m (else it's that tree, mapped off), at the height and crown
  // the map gives, or a young tree's.
  const near = new Map(), cell = (x, z) => `${Math.floor(x / 8)},${Math.floor(z / 8)}`;
  for (const t of found) { const c = cell(t.x, t.z); if (!near.has(c)) near.set(c, []); near.get(c).push(t); }
  const close = (x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const t of near.get(`${Math.floor(x / 8) + i},${Math.floor(z / 8) + j}`) ?? []) if (Math.hypot(t.x - x, t.z - z) < 4) return true; return false; };
  let off = 0;
  const young = [];
  for (const t of lone) {
    if (close(...t.at)) { off++; continue; }
    const h = parseFloat(t.tags.height) || 4, crown = parseFloat(t.tags.diameter_crown) || Math.min(h, 3);
    young.push({ x: t.at[0], z: t.at[1], h, crown, foot: h * 0.4, osm: t, colour: [1, 0, 0, 0], young: true });
  }
  const inMap = (t) => t.x >= EXT.x0 && t.x <= EXT.x1 && t.z >= EXT.z0 && t.z <= EXT.z1;
  // What the photos show of them (task 061).
  const all = [...found, ...young].filter(inMap), named = refsOf(all);
  const trees = all.map((t) => [+t.x.toFixed(1), +t.z.toFixed(1), kindOf(t, wood(t.x, t.z), named.refs.get(t)), +t.h.toFixed(1), +t.crown.toFixed(1), +Math.min(t.foot, t.h - 0.5).toFixed(1), t.osm ? 1 : 0, +(t.mx ?? t.x).toFixed(1), +(t.mz ?? t.z).toFixed(1)]);
  trees.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const counts = Object.fromEntries(KINDS.map((k, i) => [k, trees.filter((t) => t[2] === i).length]));
  fs.writeFileSync(path.join(CACHE, TREES), JSON.stringify({ about: 'tools/trees.mjs: every tree on the map, [x, z, kind, height, crown, foot, mapped, cx, cz] each (KINDS by index; metres; its trunk at x, z, its crown\'s middle at cx, cz; mapped 1 where OpenStreetMap has it), and the tiles of the point cloud they were found on (seen)', kinds: KINDS, counts, seen: keys, trees }));
  const off1 = trees.filter((t) => Math.hypot(t[7] - t[0], t[8] - t[1]) >= 1).length;
  console.log(`trees: ${trees.length} on the map (${found.filter(inMap).length} the LiDAR found, ${young.filter(inMap).length} of OpenStreetMap's in no crown kept as young trees, ${off} more within 4 m of one found left out); ${limbs} crowns with no trunk joined the taller crown they meet; ${off1} crowns' middles 1 m or more off their trunks; ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}; OpenStreetMap's ${osm.length}, ${trees.filter((t) => t[6]).length} of them on the map matched or kept; of refs/trees.json's ${named.looked.size + named.unmatched.length} trees seen ${named.looked.size} matched (${named.unmatched.length ? 'not ' + named.unmatched.map((s) => s.at.join(', ')).join('; ') : 'all'}), ${named.rows} more in its rows and ${named.areas} in its places; into .cache/${TREES} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
