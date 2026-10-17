// The walls, fences, railings, hedges and gates round the open world's area (task 013): OpenStreetMap's
// barriers, each measured from DGT's 2025 LiDAR where it saw it, and the walls, hedges and retaining
// walls the map lacks where the LiDAR sees them; the gates; each wall opened where a street or a path
// passes through it, and what it's made of by what's round it (the owner's answer, checked against
// the viewpoints' photos: `dress`).
//
// node tools/walls.mjs     after fetch.mjs (barriers, lidar), roofs.mjs and npm run open, before
//                          world.mjs (2 minutes, and 3 more the first time)
//
// - .cache/dgt/walls/<tile>.bin: each of the point cloud's tiles under the box round the open world's
//   area boiled down once (about 15 s a tile) to 50 cm cells on DGT's grid, the terrain model's own:
//   the highest point off the ground in each (unclassified, vegetation or building) over the terrain
//   there, and the highest under 5 m; how many points it has under 5 m, how green they are (from
//   their near-infrared), how many of them are classed building; and how many ground points.
// - .cache/walls.json: every wall, fence, railing, hedge and gate round the area, as world.mjs cuts
//   them to the tiles (index.d.ts's Wall), with what was left out and why, and how much of each.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { CACHE, P, readCache } from './geo.mjs';
import { CLASS, DGT, mapToTM, points, readModel, tileKey, tileToMap, tilesOver } from './dgt.mjs';
import { fillCells } from './footprints.mjs';
import { LEVEL, onCarriageways, pathsOf, streetsOf } from './lines.mjs';
import { AREA_OF, bounds, footprints, Grid, inside, ringArea, ringOf } from './osm.mjs';
import { terrain } from './terrain.mjs';
import { OPEN_BOX } from './sections.mjs';

// ---------------------------------------------------------------------------------------------
// The point cloud, a tile at a time, as rasters of 50 cm cells: row 0 at the tile's north edge, on
// the terrain model's grid (MDT-50cm), so each cell's height off the ground is over its own cell of
// the terrain.

export const N = 2000, CELL = 0.5;
const WDIR = path.join(DGT, 'walls');
const OFF = 0.25; // a point this far over the terrain is off the ground
const LOW = 5; // and under this, what a wall or a hedge may be

async function makeRaster(key) {
  const file = path.join(WDIR, key + '.bin'), laz = path.join(DGT, 'LAZ', key + '.laz'), tif = path.join(DGT, 'MDT-50cm', key + '.tif');
  if (fs.existsSync(file) && fs.statSync(file).mtimeMs > fs.statSync(laz).mtimeMs) return;
  if (!fs.existsSync(tif)) throw new Error(`No terrain at 50 cm under ${key}: node tools/fetch.mjs lidar`);
  const mdt = await readModel(tif);
  if (mdt.w !== N || mdt.h !== N || mdt.res !== CELL) throw new Error(`MDT-50cm/${key}.tif isn't 2000 cells of 50 cm`);
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000;
  const top = new Int16Array(N * N), low = new Int16Array(N * N), n = new Uint8Array(N * N), green = new Float32Array(N * N), built = new Uint8Array(N * N), ground = new Uint8Array(N * N);
  const t0 = Date.now();
  await points(key, (p) => {
    const i = Math.floor((p.e - e0) / CELL), j = Math.floor((n1 - p.n) / CELL);
    if (i < 0 || j < 0 || i >= N || j >= N) return;
    const c = j * N + i;
    if (p.cls === CLASS.ground) { if (ground[c] < 255) ground[c]++; return; }
    if (p.cls !== 1 && (p.cls < CLASS.lowVegetation || p.cls > CLASS.building)) return;
    const g = mdt.data[c];
    if (g === mdt.nodata || g < -100) return;
    const up = p.y - g;
    if (up < OFF || up > 30) return;
    const cm = Math.round(up * 100);
    if (cm > top[c]) top[c] = cm;
    // What stands under a tree's crown too: the points up to LOW, of which a wall is made.
    if (up > LOW) return;
    if (cm > low[c]) low[c] = cm;
    if (n[c] < 255) {
      n[c]++;
      green[c] += p.nir + p.r ? (p.nir - p.r) / (p.nir + p.r) : 0;
      if (p.cls === CLASS.building) built[c]++;
    }
  }, true);
  const ndvi = Int8Array.from(green, (s, c) => (n[c] ? Math.round((s / n[c]) * 100) : -128));
  fs.mkdirSync(WDIR, { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([Buffer.from(top.buffer), Buffer.from(low.buffer), n, Buffer.from(ndvi.buffer), built, ground]), { level: 1 }));
  console.log(`walls: ${key} boiled down in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

// A tile's rasters: top (cm over the terrain, 0 where nothing's off the ground), low (the same under
// 5 m), n (points off the ground under 5 m), ndvi (their mean, in hundredths; -128 where there are
// none), built (of them classed building), ground (ground points); and the terrain itself (m above
// the sea, NaN where empty).
export async function raster(key) {
  const file = path.join(WDIR, key + '.bin');
  if (!fs.existsSync(file)) return null;
  const b = zlib.gunzipSync(fs.readFileSync(file)), buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), M = N * N;
  const mdt = await readModel(path.join(DGT, 'MDT-50cm', key + '.tif'));
  const terrain = Float32Array.from(mdt.data, (v) => (v === mdt.nodata || v < -100 ? NaN : v));
  return { key, top: new Int16Array(buf, 0, M), low: new Int16Array(buf, 2 * M, M), n: new Uint8Array(buf, 4 * M, M), ndvi: new Int8Array(buf, 5 * M, M), built: new Uint8Array(buf, 6 * M, M), ground: new Uint8Array(buf, 7 * M, M), terrain };
}

// ---------------------------------------------------------------------------------------------
// Finding them: over each tile and MARGIN round it, from its rasters and its neighbours', so what's
// on its edge is whole. A cell is (x, y), x east and y south, its middle at ((x + 0.5)·CELL, (y +
// 0.5)·CELL) metres from the mosaic's north-west corner, which is (E0, N1) in EPSG:3763.

const MARGIN = 100; // cells: 50 m
const rasters = new Map();
const rasterOf = (key) => {
  if (!rasters.has(key)) {
    rasters.set(key, raster(key));
    if (rasters.size > 6) rasters.delete(rasters.keys().next().value);
  }
  return rasters.get(key);
};

export async function mosaic(key) {
  const [ke, kn] = key.split('_').map(Number), W = N + 2 * MARGIN, M = W * W;
  const m = { key, W, E0: ke * 1000 - MARGIN * CELL, N1: kn * 1000 + 1000 + MARGIN * CELL, low: new Float32Array(M), top: new Float32Array(M), n: new Uint8Array(M), ndvi: new Int8Array(M).fill(-128), built: new Uint8Array(M), ground: new Uint8Array(M), t: new Float32Array(M).fill(NaN) };
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const r = await rasterOf(`${ke + di}_${kn + dj}`);
    const x0 = Math.max(0, di * N + MARGIN), x1 = Math.min(W, di * N + MARGIN + N);
    if (!r || x1 <= x0) continue;
    for (let j = 0; j < N; j++) {
      const y = j - dj * N + MARGIN;
      if (y < 0 || y >= W) continue;
      for (let x = x0, s = j * N + x0 - di * N - MARGIN, c = y * W + x0; x < x1; x++, s++, c++) {
        m.low[c] = r.low[s] / 100; m.top[c] = r.top[s] / 100; m.n[c] = r.n[s]; m.ndvi[c] = r.ndvi[s]; m.built[c] = r.built[s]; m.ground[c] = r.ground[s]; m.t[c] = r.terrain[s];
      }
    }
  }
  return m;
}

// The cells a set of outlines on the map covers (each laid where the LiDAR saw it, `shift`), and r
// cells round them.
export function cover(m, rings, toTM, shift, r) {
  const { W } = m, mask = new Uint8Array(W * W);
  const toCell = (x, z) => { const [e, n] = toTM(x, z); return [(e - m.E0) / CELL, (m.N1 - n) / CELL]; };
  for (const pts of rings) {
    const s = shift(pts[0][0], pts[0][1]), ring = pts.map(([x, z]) => toCell(x + s.dx, z + s.dz));
    if (ring.every(([x]) => x < -2) || ring.every(([x]) => x > W + 2) || ring.every(([, y]) => y < -2) || ring.every(([, y]) => y > W + 2)) continue;
    fillCells(ring, 0, W - 1, 0, W - 1, (x, y) => { mask[y * W + x] = 1; });
  }
  return grow(mask, W, r);
}
// The cells within a band round each of a set of lines on the map ([ax, az, bx, bz, half its width]),
// each laid where the LiDAR saw it (`shift`).
export function bands(m, segs, toTM, shift) {
  const { W } = m, mask = new Uint8Array(W * W);
  const toCell = (x, z) => { const [e, n] = toTM(x, z); return [(e - m.E0) / CELL, (m.N1 - n) / CELL]; };
  for (const [ax, az, bx, bz, hw] of segs) {
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 0.01) continue;
    const s = shift(ax, az), nx = (-(bz - az) / L) * hw, nz = ((bx - ax) / L) * hw;
    const ring = [[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]].map(([x, z]) => toCell(x + s.dx, z + s.dz));
    if (ring.every(([x]) => x < -2) || ring.every(([x]) => x > W + 2) || ring.every(([, y]) => y < -2) || ring.every(([, y]) => y > W + 2)) continue;
    fillCells(ring, 0, W - 1, 0, W - 1, (x, y) => { mask[y * W + x] = 1; });
  }
  return mask;
}
// A mask grown by r cells (a square round each).
function grow(mask, W, r) {
  if (!r) return mask;
  const a = new Uint8Array(mask.length), b = new Uint8Array(mask.length);
  for (let y = 0; y < W; y++) for (let x = 0, run = -1e9; x < W; x++) { if (mask[y * W + x]) run = x; if (x - run <= r) a[y * W + x] = 1; }
  for (let y = 0; y < W; y++) for (let x = W - 1, run = 1e9; x >= 0; x--) { if (mask[y * W + x]) run = x; if (run - x <= r) a[y * W + x] = 1; }
  for (let x = 0; x < W; x++) for (let y = 0, run = -1e9; y < W; y++) { if (a[y * W + x]) run = y; if (y - run <= r) b[y * W + x] = 1; }
  for (let x = 0; x < W; x++) for (let y = W - 1, run = 1e9; y >= 0; y--) { if (a[y * W + x]) run = y; if (run - y <= r) b[y * W + x] = 1; }
  return b;
}

// The ways across a cell: a wall runs square to the one it's thin across.
const ACROSS = [[1, 0], [1, 1], [0, 1], [-1, 1]];
export const GREEN = -4; // a cell's points are growing at this NDVI (hundredths) or more: the cloud's own colours are pale, so it's lower than a photo's
const LOW_H = 0.4, HIGH_H = 4.5; // what a wall or a hedge stands over the ground
const HEDGE_H = 1.5; // a clipped hedge along a retaining wall, at most
const STEP_H = 1; // what the ground steps by at a retaining wall, within a metre

// Which cells are a wall, a hedge or a retaining wall, from the rasters: for a wall or a hedge, the
// ways across it it's thin (bit k for ACROSS[k], 0 where it's neither); for a step, -1 or the way
// across it, 0 to 3, and 4 more where the ground rises that way. `foot` is the buildings' cells, and
// `off` where neither a wall nor a hedge stands (the carriageways, where cars park).
// - A wall: something 0.4 to 4.5 m over the ground, not growing, thin: clear of anything a third as
//   high a metre either side, and half a metre on one side at least (a wall is one or two cells wide,
//   a car or a van three or more, and the cloud sees a car's doors a metre from its middle).
// - A hedge: the same, growing, clear a metre and a half either side, and with no tree's crown over
//   it (whose lowest boughs would look like one).
// - A retaining wall: where the terrain steps a metre or more over a metre, and little on either side of
//   that (a steep slope rises as much beyond), the step's middle, with ground points either side (the
//   terrain under a wood is guessed between few); not within a metre of a building.
export function masks(m, foot, off) {
  const { W, low, top, ndvi, t, ground } = m, M = W * W;
  const seen = (q) => ground[q - W - 1] + ground[q - W] + ground[q - W + 1] + ground[q - 1] + ground[q] + ground[q + 1] + ground[q + W - 1] + ground[q + W] + ground[q + W + 1] >= 2;
  const wall = new Uint8Array(M), hedge = new Uint8Array(M), step = new Int8Array(M).fill(-1);
  const near = grow(foot, W, 2);
  for (let y = 4; y < W - 4; y++) for (let x = 4; x < W - 4; x++) {
    const c = y * W + x;
    if (Number.isNaN(t[c])) continue;
    const h = low[c];
    const green = ndvi[c] >= GREEN;
    if (h >= LOW_H && h <= HIGH_H && !foot[c] && !off[c] && !(green && top[c] > HIGH_H + 0.5)) {
      const lim = Math.max(0.25, 0.3 * h), clear = (q) => !foot[q] && low[q] < lim;
      let bits = 0;
      for (let k = 0; k < 4; k++) {
        const o = ACROSS[k][1] * W + ACROSS[k][0];
        if (green ? clear(c + 3 * o) && clear(c - 3 * o) : clear(c + 2 * o) && clear(c - 2 * o) && (clear(c + o) || clear(c - o))) bits |= 1 << k;
      }
      (green ? hedge : wall)[c] = bits;
    }
    if (near[c]) continue;
    let best = 0, bk = -1;
    for (let k = 0; k < 4; k++) {
      const o = ACROSS[k][1] * W + ACROSS[k][0], s = t[c + o] - t[c - o];
      if (!(Math.abs(s) >= STEP_H) || Math.abs(s) <= best) continue;
      const beyond = Math.abs(t[c - o] - t[c - 3 * o]) + Math.abs(t[c + 3 * o] - t[c + o]);
      if (!(beyond < 0.6 * Math.abs(s)) || !seen(c + 2 * o) || !seen(c - 2 * o)) continue;
      // The step's middle: more than the step either side of it.
      if (Math.abs(t[c + 2 * o] - t[c]) > Math.abs(s) || Math.abs(t[c] - t[c - 2 * o]) > Math.abs(s)) continue;
      best = Math.abs(s);
      bk = k + (s > 0 ? 4 : 0);
    }
    step[c] = bk;
  }
  return { wall, hedge, step };
}

// The straight runs through a set of cells (their middles, [X, Y] in metres, and for a wall or a
// hedge the ways across it each is thin, `bits`): each LEAST long or more, its cells within TOL of its
// line and no more than GAP apart along it, filling a share `fill` of it at least; and with `bits`,
// half its cells or more not thin along it, as a wall's aren't (a car's roof, a bush, is thin every
// way). The cells within 1.5 m of each other are taken together; in each, the line with the most
// cells near it (every 3°), its run with the most cells, again and again while one is long enough.
const LEAST = 3, TOL = 0.4, GAP = 1.6;
export function straights(cells, bits = null, fill = 0.35) {
  const out = [];
  // Groups of cells within 1.5 m.
  const parent = cells.map((_, i) => i), find = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  const grid = new Map(), G = 1.5;
  cells.forEach(([X, Y], i) => {
    const gx = Math.floor(X / G), gy = Math.floor(Y / G);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const j of grid.get((gx + a) * 65536 + gy + b) ?? []) if (Math.hypot(cells[j][0] - X, cells[j][1] - Y) <= G) parent[find(i)] = find(j);
    const k = gx * 65536 + gy;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(i);
  });
  const groups = new Map();
  cells.forEach((_, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  for (const g of groups.values()) {
    let left = g;
    while (left.length >= LEAST / CELL) {
      // The best line: offsets in 25 cm bins, three bins at a time.
      let best = null;
      for (let d = 0; d < 180; d += 3) {
        const a = (d * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), bins = new Map();
        for (const i of left) { const b = Math.floor((-cells[i][0] * uy + cells[i][1] * ux) / 0.25); bins.set(b, (bins.get(b) ?? 0) + 1); }
        for (const [b, n] of bins) {
          const s = n + (bins.get(b - 1) ?? 0) + (bins.get(b + 1) ?? 0);
          if (!best || s > best.s) best = { s, a, o: (b + 0.5) * 0.25 };
        }
      }
      // Its cells, and the line through them (least squares across it).
      let ux = Math.cos(best.a), uy = Math.sin(best.a), o = best.o;
      let on = left.filter((i) => Math.abs(-cells[i][0] * uy + cells[i][1] * ux - o) <= TOL + 0.1);
      if (on.length >= 3) {
        let mx = 0, my = 0;
        for (const i of on) { mx += cells[i][0] / on.length; my += cells[i][1] / on.length; }
        let sxx = 0, syy = 0, sxy = 0;
        for (const i of on) { const dx = cells[i][0] - mx, dy = cells[i][1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
        const a = 0.5 * Math.atan2(2 * sxy, sxx - syy);
        ux = Math.cos(a); uy = Math.sin(a); o = -mx * uy + my * ux;
        on = left.filter((i) => Math.abs(-cells[i][0] * uy + cells[i][1] * ux - o) <= TOL);
      }
      // Its runs along it, split where the cells are more than GAP apart: the one with the most cells.
      const along = on.map((i) => [cells[i][0] * ux + cells[i][1] * uy, i]).sort((p, q) => p[0] - q[0]);
      let run = null;
      for (let k = 0, s = 0; k <= along.length; k++) {
        if (k === along.length || (k > s && along[k][0] - along[k - 1][0] > GAP)) {
          if (!run || k - s > run.n) run = { n: k - s, from: along[s][0], to: along[k - 1][0], cells: along.slice(s, k).map((p) => p[1]) };
          s = k;
        }
      }
      const L = run ? run.to - run.from + CELL : 0;
      if (!run || L < LEAST || run.n < (fill * L) / CELL) break;
      if (bits) {
        // The two ways across a cell nearest the run's own: a cell thin along both isn't a wall's.
        const d = (((Math.atan2(uy, ux) * 180) / Math.PI + 360) % 180) / 45, k1 = Math.floor(d) % 4, k2 = Math.ceil(d) % 4;
        if (run.cells.filter((i) => !(bits[i] & (1 << k1)) || !(bits[i] & (1 << k2))).length < run.n / 2) {
          const used = new Set(run.cells);
          left = left.filter((i) => !used.has(i));
          continue;
        }
      }
      const at = (s) => [s * ux - o * uy, s * uy + o * ux];
      out.push({ a: at(run.from - CELL / 2), b: at(run.to + CELL / 2), cells: run.cells, n: run.n });
      const used = new Set(run.cells);
      left = left.filter((i) => !used.has(i));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Each run measured, along it every half metre: a wall's or a hedge's height (the highest of its
// cells across it, the higher of them: its top, not the points down its face), a hedge's width, and
// a retaining wall's step (the terrain a metre and a quarter either side) and the parapet on it. The
// tops' heights follow the terrain under it. A retaining wall's points run with its higher ground on
// their left.

const quantile = (vals, f) => { if (!vals.length) return NaN; const s = Float64Array.from(vals).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round(f * (s.length - 1))))]; };
const VERTEX = 4; // a line's points at most this far apart, each with its top's height

// Along a line in the mosaic (metres, [X, Y] each), every half metre: the point, the way along it
// and the way to its right.
function along(pts) {
  const out = [];
  let s0 = 0;
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L = Math.hypot(bx - ax, by - ay);
    if (L < 1e-6) continue;
    const ux = (bx - ax) / L, uy = (by - ay) / L;
    for (let s = (0.5 - (s0 % 0.5)) % 0.5 + 0.25; s < L; s += 0.5) out.push({ X: ax + ux * s, Y: ay + uy * s, ux, uy, vx: -uy, vy: ux, s: s0 + s });
    s0 += L;
  }
  return out;
}

function sampler(m, mk) {
  const { W } = m;
  const cell = (X, Y) => { const x = Math.floor(X / CELL), y = Math.floor(Y / CELL); return x >= 0 && y >= 0 && x < W && y < W ? y * W + x : -1; };
  return {
    cell,
    t: (X, Y) => { const c = cell(X, Y); return c < 0 ? NaN : m.t[c]; },
    // The top of a wall's or a hedge's cells across the line within r of it, over the terrain, and
    // whether they're growing; null if none is.
    ridge(p, r) {
      let best = null;
      for (let o = -r; o <= r + 1e-6; o += 0.25) {
        const c = cell(p.X + p.vx * o, p.Y + p.vy * o);
        if (c < 0 || !(mk.wall[c] || mk.hedge[c])) continue;
        if (!best || m.low[c] > best.h) best = { h: m.low[c], green: !!mk.hedge[c], canopy: m.top[c], o, n: m.n[c], g: m.ground[c] };
      }
      return best;
    },
  };
}

// A run of a mask's cells (a, b in the mosaic), measured as a wall or a hedge; null if it isn't one
// after all (too little of it seen, too ragged).
function measureRidge(m, mk, run, green) {
  const S = sampler(m, mk), at = along([run.a, run.b]);
  const hits = [], canopy = [], widths = [], offs = [], ns = [], gs = [];
  for (const p of at) {
    const r = S.ridge(p, 0.5);
    if (!r) continue;
    hits.push(r.h);
    canopy.push(r.canopy);
    ns.push(r.n);
    gs.push(r.g);
    // Where what stands half as high is across it, out to 1.5 m either side.
    let last = -1;
    for (let o = -1.5; o <= 1.5; o += 0.25) { const c = S.cell(p.X + p.vx * o, p.Y + p.vy * o); if (c >= 0 && c !== last && m.low[c] >= 0.5 * r.h) offs.push(o); last = c; }
    if (green) {
      let n = 0;
      for (let o = -2; o <= 2; o += 0.5) { const c = S.cell(p.X + p.vx * (r.o + o), p.Y + p.vy * (r.o + o)); if (c >= 0 && m.low[c] >= 0.5 * r.h) n++; }
      widths.push(n * CELL);
    }
  }
  const cover = hits.length / at.length, h = quantile(hits, 0.75);
  if (cover < (green ? 0.6 : 0.5) || !(h >= LOW_H) || quantile(hits, 0.25) < 0.6 * h) return null;
  // A hedge is clipped, 0.8 to 3.5 m: lower, it's weeds or shrubs on a verge; taller, a row of trees
  // or a tree's edge; and under a tree's crown, a
  // "hedge" taller than a hedge is its lowest boughs.
  if (green && (h < 0.8 || h > 3.5 || (quantile(canopy, 0.5) > HIGH_H + 0.5 && h > 2.5))) return null;
  // As wide as a car (whose points are sparse, so it can look thin cell by cell): a car.
  const spread = quantile(offs, 0.9) - quantile(offs, 0.1);
  return { kind: green ? 'hedge' : 'wall', h, w: green ? Math.max(0.5, Math.min(2, quantile(widths, 0.5))) : null, cover, even: quantile(hits, 0.25) / h, spread, dense: quantile(ns, 0.5), gr: quantile(gs, 0.5), at, ends: [run.a, run.b], base: (p) => S.t(p.X, p.Y) };
}

// A run of the steps' cells, measured as a retaining wall: its points turned so its higher ground is
// on their left; null if the step isn't there along it.
function measureStep(m, mk, run) {
  const S = sampler(m, mk);
  let pts = [run.a, run.b];
  const drops = (at) => at.map((p) => S.t(p.X - p.vx * 1.25, p.Y - p.vy * 1.25) - S.t(p.X + p.vx * 1.25, p.Y + p.vy * 1.25)).filter((d) => d === d);
  let at = along(pts), d = drops(at);
  if (quantile(d, 0.5) < 0) { pts = [run.b, run.a]; at = along(pts); d = drops(at); }
  const drop = quantile(d, 0.5);
  if (!(drop >= 0.7) || d.filter((v) => v >= 0.5).length < 0.6 * at.length) return null;
  // The parapet: a wall's cells along the top, on the higher side within 75 cm.
  const tops = [];
  for (const p of at) {
    let best = 0;
    for (let o = 0; o <= 0.75; o += 0.25) { const c = S.cell(p.X - p.vx * o, p.Y - p.vy * o); if (c >= 0 && mk.wall[c]) best = Math.max(best, m.low[c]); }
    if (best) tops.push(best);
  }
  const parapet = tops.length >= 0.3 * at.length ? Math.min(1.2, quantile(tops, 0.5)) : 0;
  return { kind: 'retaining', h: drop + parapet, drop, parapet, w: null, cover: 1, at, ends: pts, base: (p) => S.t(p.X - p.vx * 1.25, p.Y - p.vy * 1.25) + parapet };
}

// A measured run's points on the map, every VERTEX metres at most, and its top's height at each
// (above the sea), from `base` (the terrain under a wall, a retaining wall's higher ground and its
// parapet) and its height: in the mosaic first, then on the map where the outlines round it sit.
function onMap(m, r, toMap, shift) {
  const [A, B] = r.ends, L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(L / VERTEX));
  const out = [], ys = [];
  for (let k = 0; k <= n; k++) {
    const X = A[0] + ((B[0] - A[0]) * k) / n, Y = A[1] + ((B[1] - A[1]) * k) / n, s = (L * k) / n;
    const near = r.at.filter((p) => Math.abs(p.s - s) <= 1).map(r.base).filter((v) => v === v);
    const [x, z] = toMap(m.E0 + X, m.N1 - Y), sh = shift(x, z);
    out.push([x - sh.dx, z - sh.dz]);
    ys.push(near.length ? quantile(near, 0.5) + (r.kind === 'retaining' ? 0 : r.h) : NaN);
  }
  // Where the terrain wasn't seen at a point, the nearest that was.
  for (let k = 0; k < ys.length; k++) if (ys[k] !== ys[k]) { let best = NaN, bd = Infinity; ys.forEach((v, j) => { if (v === v && Math.abs(j - k) < bd) { bd = Math.abs(j - k); best = v; } }); ys[k] = best; }
  return { pts: out, ys };
}

// ---------------------------------------------------------------------------------------------
// OpenStreetMap's barriers (fetch.mjs's `barriers`): each way's kind, what it's made of and how high
// where the map says, and the gates.

const BARRIER = { wall: 'wall', city_wall: 'wall', retaining_wall: 'retaining', fence: 'fence', hedge: 'hedge', guard_rail: 'guard_rail', handrail: 'railing', gate: 'gate', wicket_gate: 'gate', swing_gate: 'gate', sliding_gate: 'gate', lift_gate: 'bar' };
const RAILING = new Set(['railing', 'bars', 'metal_bars', 'railings', 'pole']);
const MATERIAL = { stone: 'granite', granite: 'granite', rock: 'granite', masonry: 'granite', concrete: 'concrete', reinforced_concrete: 'concrete', concrete_block: 'concrete', brick: 'rendered', bricks: 'rendered', plaster: 'rendered', rendered: 'rendered', wood: 'wood', metal: 'metal', steel: 'metal', iron: 'metal' };
const below = (t) => (t.indoor && t.indoor !== 'no') || (t.level != null && t.level !== '0') || Number(t.layer) < 0 || t.location === 'underground';

export function barriersOf(osm, near) {
  const out = [];
  for (const e of osm.elements) {
    const t = e.tags ?? {};
    let kind = BARRIER[t.barrier];
    if (e.type !== 'way' || !kind || below(t)) continue;
    const pts = e.geometry.map(P);
    if (pts.length < 2 || !pts.some(([x, z]) => near(x, z, 20))) continue;
    if (kind === 'wall' && t.wall === 'retaining_wall') kind = 'retaining';
    if (kind === 'fence' && RAILING.has(t.fence_type)) kind = 'railing';
    const h = parseFloat(t.height), w = parseFloat(t.width);
    out.push({ id: e.id, kind, material: MATERIAL[t.material] ?? MATERIAL[t.wall] ?? null, h: h > 0 && h < 15 ? h : null, w: w > 0 && w < 5 ? w : null, pts, nodes: e.nodes, level: on(t.bridge) ? 'bridge' : 'ground' });
  }
  return out;
}
const on = (v) => v != null && v !== 'no';

// A barrier of the map's measured from the LiDAR, along its line (each point laid where the LiDAR
// saw it): the top of a wall's or a hedge's cells within 1.25 m across it, and the step in the
// terrain across it, from 1.75 m out either side (the map's lines are a metre or so off in places),
// where it's more than the slope beyond that, to 3.25 m (a wall along a steep hillside isn't
// holding it up).
function measureLine(m, mk, pts, toTM) {
  const mp = pts.map(([x, z]) => { const [e, n] = toTM(x, z); return [e - m.E0, m.N1 - n]; });
  const S = sampler(m, mk), at = along(mp);
  const hits = [];
  let green = 0;
  const d = [];
  for (const p of at) {
    const r = S.ridge(p, 1.25);
    if (r) { hits.push(r.h); if (r.green) green++; }
    const t = (o) => S.t(p.X + p.vx * o, p.Y + p.vy * o), v = t(-1.75) - t(1.75), beyond = Math.abs(t(-3.25) - t(-1.75)) + Math.abs(t(1.75) - t(3.25));
    if (v === v && beyond === beyond) d.push(beyond < 0.6 * Math.abs(v) ? v : 0);
  }
  const drop = quantile(d, 0.5), n = at.length || 1;
  return { cover: hits.length / n, h: quantile(hits, 0.75), green: green / (hits.length || 1), drop, stepped: d.length >= 0.6 * n && d.filter((v) => Math.abs(v) >= 0.8 && Math.sign(v) === Math.sign(drop)).length >= 0.6 * n && Math.abs(drop) >= STEP_H, seen: d.length / n };
}

// ---------------------------------------------------------------------------------------------
// What a wall is made of, where the map doesn't say and no photo shows it (the owner's answer):
// by what's round it, checked against the viewpoints' photos that show walls (task 013's Notes). A
// hedge is a hedge; a fence, a railing, a guard rail or a gate is metal. A retaining wall is granite,
// as a cutting's or a terrace's is, but concrete where it holds up a street: 2 m or more, 20 m long or
// more, within 10 m of one (the Rua do Couteiro's, the Avenida Doutor Viriato Amaral Nunes's, the
// Alameda do Fujacal's). A low wall under a hedge is granite rubble, whatever it fronts (the Rua
// Bernardo Sequeira's). In front of a house or a block of flats, a wall is rendered and painted, and up
// to 3 m high it's a low wall with a railing on it, its top half (the photos of the Rua do Fujacal's
// houses, and the Rua do Monte da Forca's, show them so, not the granite the owner's answer had for a
// house's; the LiDAR measures them to the railing's top); a long wall by a tertiary street or a bigger one, concrete; any other, granite.

export function dress(w, near) {
  const L = w.pts.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - w.pts[k - 1][0], p[1] - w.pts[k - 1][1]) : 0), 0);
  const big = near.street != null && near.street <= 4;
  if (!w.material) {
    if (w.kind === 'fence' || w.kind === 'railing' || w.kind === 'guard_rail' || w.kind === 'gate' || w.kind === 'bar') w.material = 'metal';
    else if (w.kind === 'retaining') w.material = w.h >= 2 && L >= 20 && near.street != null ? 'concrete' : 'granite';
    else if (w.kind === 'wall') w.material = w.hedged ? 'granite' : near.building === 'house' || near.building === 'flats' ? 'rendered' : L >= 20 && big ? 'concrete' : 'granite';
  }
  if (w.kind === 'wall' && w.material === 'rendered' && (near.building === 'house' || near.building === 'flats') && w.h <= 3 && !w.hedged) w.on = 'railing';
  return w;
}
// How thick each is, where the map doesn't say (a hedge's is measured).
const THICK = { granite: 0.4, rendered: 0.2, concrete: 0.25, wood: 0.1, metal: 0.05 };
const thick = (w) => w.w ?? (w.kind === 'hedge' ? 0.8 : w.kind === 'guard_rail' ? 0.3 : w.kind === 'retaining' ? 0.4 : THICK[w.material] ?? 0.3);
// How high each is where neither the map nor the LiDAR says.
const USUAL_H = { wall: 1.5, retaining: 1.5, fence: 1.5, railing: 1.0, hedge: 1.5, guard_rail: 0.75, gate: 1.5, bar: 1.0 };

// The kind of a building, for what's round a wall: a house, a block of flats or anything else, from
// its tag, its size and its eaves over its ground, as world.mjs's kindOf has it.
const HOUSE = new Set(['house', 'detached', 'semidetached_house', 'terrace', 'bungalow', 'duplex']);
const FLATS = new Set(['apartments', 'residential', 'dormitory', 'hotel']);
function buildingKind(t, a, eaves) {
  if (HOUSE.has(t.building)) return eaves > 10 ? 'flats' : 'house';
  if (FLATS.has(t.building)) return eaves != null && eaves < 6.5 && a < 250 ? 'house' : 'flats';
  if (t.building !== 'yes') return 'other';
  if (eaves == null) return a < 220 ? 'house' : a < 1400 ? 'flats' : 'other';
  if (a >= 1400) return eaves >= 15 ? 'flats' : 'other';
  return eaves >= 9.5 ? 'flats' : a < 400 ? 'house' : eaves >= 6 ? 'flats' : 'other';
}

// Where a polyline's length s along it is, and the way it runs there.
function pointAt(pts, s) {
  for (let k = 1; k < pts.length; k++) {
    const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    if (s <= L || k === pts.length - 1) { const f = L ? Math.min(1, Math.max(0, s / L)) : 0; return { x: pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, z: pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f, ux: L ? (pts[k][0] - pts[k - 1][0]) / L : 1, uz: L ? (pts[k][1] - pts[k - 1][1]) / L : 0 }; }
    s -= L;
  }
  return { x: pts[0][0], z: pts[0][1], ux: 1, uz: 0 };
}
const lengthOf = (pts) => pts.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0);
// The nearest point of a polyline to (x, z): how far, how far along it, and the way it runs there.
function nearest(pts, x, z) {
  let best = { d: Infinity, s: 0, ux: 1, uz: 0 }, s0 = 0;
  for (let k = 1; k < pts.length; k++) {
    const [ax, az] = pts[k - 1], [bx, bz] = pts[k], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    if (L < 1e-9) continue;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (L * L))), d = Math.hypot(ax + dx * t - x, az + dz * t - z);
    if (d < best.d) best = { d, s: s0 + t * L, ux: dx / L, uz: dz / L };
    s0 += L;
  }
  return best;
}
// A polyline's piece from s0 to s1 along it.
function piece(pts, s0, s1) {
  const out = [], a = pointAt(pts, s0);
  out.push([a.x, a.z]);
  let s = 0;
  for (let k = 1; k < pts.length; k++) {
    s += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    if (s > s0 + 1e-6 && s < s1 - 1e-6) out.push(pts[k]);
  }
  const b = pointAt(pts, s1);
  out.push([b.x, b.z]);
  return out;
}

// ---------------------------------------------------------------------------------------------
// For world.mjs: the walls in a tile, cut at its edges (its west and north edges in it, its east and
// south out) and where they stand on a carriageway or a path (`road(x, z, y)`, y the ground under the
// wall there, a retaining wall's lower side), as a building is (decision 021), a gate (which stands
// across one) but; each piece's points and the heights of its top at them, to the nearest 10 cm
// along it.

const ysAt = (w, s) => {
  let s0 = 0;
  for (let k = 1; k < w.pts.length; k++) {
    const L = Math.hypot(w.pts[k][0] - w.pts[k - 1][0], w.pts[k][1] - w.pts[k - 1][1]);
    if (s <= s0 + L || k === w.pts.length - 1) return w.ys[k - 1] + (w.ys[k] - w.ys[k - 1]) * (L ? Math.max(0, Math.min(1, (s - s0) / L)) : 0);
    s0 += L;
  }
  return w.ys[0];
};
export function cutWalls(list, box, road) {
  const out = [];
  for (const w of list) {
    const b = bounds(w.pts);
    if (b.x1 < box.x0 || b.x0 > box.x1 || b.z1 < box.z0 || b.z0 > box.z1) continue;
    const L = lengthOf(w.pts), n = Math.max(1, Math.ceil(L / 0.1)), gate = w.kind === 'gate' || w.kind === 'bar';
    let from = -1;
    for (let k = 0; k <= n; k++) {
      const p = k < n ? pointAt(w.pts, ((k + 0.5) * L) / n) : null;
      const keep = p && p.x >= box.x0 && p.x < box.x1 && p.z >= box.z0 && p.z < box.z1 && (gate || !road(p.x, p.z, ysAt(w, ((k + 0.5) * L) / n) - w.h));
      if (keep && from < 0) from = k;
      if (!keep && from >= 0) {
        const s0 = (from * L) / n, s1 = (k * L) / n;
        if (s1 - s0 >= 0.3) {
          const pts = piece(w.pts, s0, s1), ys = [];
          let s = s0;
          pts.forEach((q, i) => { if (i) s += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]); ys.push(ysAt(w, s)); });
          out.push({ ...w, pts, ys });
        }
        from = -1;
      }
    }
  }
  return out;
}

// In a tile, each [what, h, w, n, ...points, ...tops]: what is its kind, what it's made of (3 bits
// each, WALL_KINDS and WALL_MATERIALS), a railing on it (1), from the LiDAR (1), open (1) and on a
// bridge (1); h and w in centimetres; the points in decimetres, the first from the tile's corner and
// each after it the step from the one before; and its top at each, in centimetres, the first above
// ELEV0 and each after it the step from the one before.
export const WALL_KINDS = ['wall', 'retaining', 'fence', 'railing', 'hedge', 'guard_rail', 'gate', 'bar'];
export const WALL_MATERIALS = [null, 'granite', 'rendered', 'concrete', 'metal', 'wood'];
export function packWalls(list, x0, z0, elev0) {
  const out = [], dm = (v) => Math.round(v * 10);
  for (const w of list) {
    out.push(WALL_KINDS.indexOf(w.kind) | (WALL_MATERIALS.indexOf(w.material) << 3) | (w.on === 'railing' ? 64 : 0) | (w.source === 'lidar' ? 128 : 0) | (w.open ? 256 : 0) | (w.level === 'bridge' ? 512 : 0), Math.round(w.h * 100), Math.round(w.w * 100), w.pts.length);
    let px = 0, pz = 0;
    w.pts.forEach(([x, z], i) => { const a = dm(x - x0), b = dm(z - z0); out.push(i ? a - px : a, i ? b - pz : b); px = a; pz = b; });
    let py = 0;
    w.ys.forEach((y, i) => { const c = Math.round((y - elev0) * 100); out.push(i ? c - py : c); py = c; });
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  for (const key of tilesOver(OPEN_BOX)) await makeRaster(key);
  const B = OPEN_BOX, inBox = (x, z, mg = 0) => x >= B.x0 - mg && x <= B.x1 + mg && z >= B.z0 - mg && z <= B.z1 + mg;
  const ground = await terrain();
  // Where the LiDAR saw what the map has at (x, z): roofs.mjs's shift for each 250 m, as it lays the
  // buildings' outlines over the LiDAR's.
  const roofs = readCache('roofs.json');
  const shift = (x, z) => { const s = roofs.shifts[Math.floor(x / 250) + ',' + Math.floor(z / 250)]; return s ? { dx: s[0], dz: s[1] } : { dx: 0, dz: 0 }; };
  const fits = new Map();
  const toTM = (x, z) => { const i = Math.floor(x / 500), j = Math.floor(z / 500), k = i + ',' + j; let f = fits.get(k); if (!f) fits.set(k, (f = mapToTM({ x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 }))); return f(x, z); };
  const seenAt = (x, z) => { const s = shift(x, z); return [x + s.dx, z + s.dz]; };

  // The buildings, the map's and those it lacks, each with its kind.
  const houses = [];
  for (const e of footprints(readCache('osm/buildings.json'))) {
    const pts = ringOf(e);
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length < 3 || !pts.some(([x, z]) => inBox(x, z, 120))) continue;
    const r = roofs.buildings[e.id], eaves = r ? Math.max(...r.parts.filter((p) => p.eaves != null).map((p) => p.eaves - p.ground)) : null;
    houses.push({ pts, kind: buildingKind(e.tags, ringArea(pts), Number.isFinite(eaves) ? eaves : null) });
  }
  for (const f of roofs.found ?? []) {
    if (!f.pts.some(([x, z]) => inBox(x, z, 120))) continue;
    const eaves = Math.max(...(f.parts ?? []).filter((p) => p.eaves != null).map((p) => p.eaves - p.ground));
    houses.push({ pts: f.pts, kind: buildingKind({ building: 'yes' }, ringArea(f.pts), Number.isFinite(eaves) ? eaves : null) });
  }
  const hgrid = new Grid(20);
  houses.forEach((h, i) => { for (const [x, z] of h.pts) hgrid.add(x, z, i); });
  // The streets: where nothing is found (cars park on them), and what's round a wall; and the paths.
  const lines = streetsOf(onCarriageways(readCache('osm/base.json')), (x, z, mg) => inBox(x, z, mg + 60)).filter((l) => l.k <= 8);
  const segs = [];
  for (const l of lines) if (l.k <= 7 && l.level !== LEVEL.tunnel) for (let i = 1; i < l.pts.length; i++) segs.push([...l.pts[i - 1], ...l.pts[i], l.w / 2 + (l.k === 6 ? 0 : 0.5)]);
  const sgrid = new Grid(20);
  lines.forEach((l, i) => { for (let k = 1; k < l.pts.length; k++) { const n = Math.ceil(Math.hypot(l.pts[k][0] - l.pts[k - 1][0], l.pts[k][1] - l.pts[k - 1][1]) / 10); for (let f = 0; f <= n; f++) sgrid.add(l.pts[k - 1][0] + ((l.pts[k][0] - l.pts[k - 1][0]) * f) / n, l.pts[k - 1][1] + ((l.pts[k][1] - l.pts[k - 1][1]) * f) / n, i); } });
  const ways = pathsOf(onCarriageways(readCache('osm/paths.json')), (x, z, mg) => inBox(x, z, mg));
  const barriersOsm = readCache('osm/barriers.json');
  const osm = barriersOf(barriersOsm, (x, z, mg) => inBox(x, z, mg));
  // The car parks, but those under the ground or in a building.
  const parks = [], parkLines = [];
  for (const e of barriersOsm.elements) {
    const t = e.tags ?? {};
    if (t.amenity !== 'parking' || t.parking === 'underground' || t.parking === 'multi-storey') continue;
    const rings = e.type === 'way' ? [e.geometry] : e.members.filter((q) => q.type === 'way' && q.role !== 'inner' && q.geometry).map((q) => q.geometry);
    for (const g of rings) {
      const pts = g.map(P);
      if (!pts.some(([x, z]) => inBox(x, z, 60))) continue;
      if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) parks.push(pts.slice(0, -1));
      else for (let i = 1; i < pts.length; i++) parkLines.push([...pts[i - 1], ...pts[i], 1.5]);
    }
  }
  const keyOf = (x, z) => { const [e, n] = toTM(...seenAt(x, z)); return tileKey(e, n); };

  // Each tile: what the LiDAR finds, and the map's barriers measured.
  let found = [];
  const measured = new Map();
  for (const key of tilesOver(B)) {
    const t1 = Date.now(), m = await mosaic(key);
    const foot = cover(m, houses.map((h) => h.pts), toTM, shift, 1);
    const off = bands(m, [...segs, ...parkLines], toTM, shift), parked = cover(m, parks, toTM, shift, 1);
    for (let c = 0; c < off.length; c++) off[c] |= parked[c];
    const mk = masks(m, foot, off);
    const toMap = tileToMap(key);
    const mine = (X, Y) => X >= MARGIN * CELL && X < (MARGIN + N) * CELL && Y >= MARGIN * CELL && Y < (MARGIN + N) * CELL;
    let n = 0;
    for (const [mask, kind] of [[mk.wall, 'wall'], [mk.hedge, 'hedge'], [mk.step, 'retaining']]) {
      const cells = [], bits = [];
      for (let c = 0; c < mask.length; c++) if (kind === 'retaining' ? mask[c] >= 0 : mask[c] > 0) { cells.push([((c % m.W) + 0.5) * CELL, (Math.floor(c / m.W) + 0.5) * CELL]); bits.push(mask[c]); }
      for (const run of straights(cells, kind === 'retaining' ? null : bits)) {
        if (!mine((run.a[0] + run.b[0]) / 2, (run.a[1] + run.b[1]) / 2)) continue;
        const r = kind === 'retaining' ? measureStep(m, mk, run) : measureRidge(m, mk, run, kind === 'hedge');
        if (!r) continue;
        const { pts, ys } = onMap(m, r, toMap, shift);
        if (!pts.some(([x, z]) => inBox(x, z))) continue;
        found.push({ kind: r.kind, h: r.h, w: r.w, pts, ys, source: 'lidar', cover: r.cover, even: r.even ?? 1, spread: r.spread ?? 0, dense: r.dense ?? 0, gr: r.gr ?? 0, parapet: r.parapet ?? 0 });
        n++;
      }
    }
    for (const b of osm) {
      const mid = pointAt(b.pts, lengthOf(b.pts) / 2);
      if (keyOf(mid.x, mid.z) === key) measured.set(b.id, measureLine(m, mk, b.pts.map(([x, z]) => seenAt(x, z)), toTM));
    }
    console.log(`walls: ${key}, ${n} found, in ${((Date.now() - t1) / 1000).toFixed(0)} s`);
  }
  const why = { 'growth on banks': 0, 'faces of retaining walls': 0, 'fences on retaining walls': 0, short: 0, cars: 0, parapets: 0, twice: 0, 'hedges out of town': 0, 'steps in the wild': 0, 'on the map': 0, 'retaining walls of the map': 0 };

  // What's round a point: the nearest building's outline within r, and its kind; and the streets
  // within r of it, each how far from its edge and which way it runs.
  const buildingNear = (x, z, r) => {
    let best = null;
    for (const i of new Set(hgrid.near(x, z, Math.ceil(r / 20)))) { const d = nearest([...houses[i].pts, houses[i].pts[0]], x, z).d; if (d <= r && (!best || d < best.d)) best = { d, kind: houses[i].kind }; }
    return best;
  };
  const streetsNear = (x, z, r) => {
    const out = [];
    for (const i of new Set(sgrid.near(x, z, Math.ceil(r / 20) + 1))) { const l = lines[i], q = nearest(l.pts, x, z); if (q.d - l.w / 2 <= r) out.push({ k: l.k, edge: q.d - l.w / 2, ux: q.ux, uz: q.uz }); }
    return out;
  };
  // The woods, the scrub and the fields.
  const wild = new Grid(100), wilds = [];
  for (const e of readCache('osm/base.json').elements) {
    if (!['forest', 'scrub', 'farm', 'grass'].includes(AREA_OF(e.tags ?? {}))) continue;
    const rings = e.type === 'way' ? [e.geometry] : (e.members ?? []).filter((q) => q.type === 'way' && q.role !== 'inner' && q.geometry).map((q) => q.geometry);
    for (const g of rings) { const pts = g.map(P); if (pts.length < 4 || !pts.some(([x, z]) => inBox(x, z, 100))) continue; wilds.push(pts); const b = bounds(pts); for (let i = Math.floor(b.x0 / 100); i <= Math.floor(b.x1 / 100); i++) for (let j = Math.floor(b.z0 / 100); j <= Math.floor(b.z1 / 100); j++) wild.add(i * 100, j * 100, wilds.length - 1); }
  }
  const inWild = (x, z) => wild.near(x, z, 0).some((i) => inside(wilds[i], x, z));

  // Lines near lines: how much of a line lies within d of a set of others running within 30° of it,
  // and which, the nearest most often first.
  const index = (list) => {
    const g = new Grid(10);
    list.forEach((w, i) => { const L = lengthOf(w.pts); for (let s = 0; s <= L; s += 5) { const p = pointAt(w.pts, s); g.add(p.x, p.z, i); } const e = w.pts[w.pts.length - 1]; g.add(e[0], e[1], i); });
    return g;
  };
  const alongside = (w, list, g, d, keep = () => true) => {
    const L = lengthOf(w.pts), n = Math.max(2, Math.ceil(L / 0.5)), hits = new Map();
    let near = 0;
    for (let k = 0; k <= n; k++) {
      const p = pointAt(w.pts, (L * k) / n);
      let hit = -1;
      for (const i of new Set(g.near(p.x, p.z, 1))) {
        if (list[i] === w || !keep(list[i])) continue;
        const q = nearest(list[i].pts, p.x, p.z);
        if (q.d <= d && Math.abs(q.ux * p.ux + q.uz * p.uz) >= Math.cos(Math.PI / 6)) { hit = i; break; }
      }
      if (hit >= 0) { near++; hits.set(hit, (hits.get(hit) ?? 0) + 1); }
    }
    return { share: near / (n + 1), by: [...hits].sort((a, b) => b[1] - a[1]).map(([i]) => list[i]) };
  };

  // ---- What the LiDAR found, sorted out. ----
  for (const w of found) { w.L = lengthOf(w.pts); const a = w.pts[0], b = w.pts[w.pts.length - 1]; w.mx = (a[0] + b[0]) / 2; w.mz = (a[1] + b[1]) / 2; w.ux = (b[0] - a[0]) / (w.L || 1); w.uz = (b[1] - a[1]) / (w.L || 1); }
  // Parked cars. At 10 points a square metre, a car is as thin, as dense and as even as a wall, cell
  // by cell, and a car's length long, so a wall or a hedge shorter than one is left out (a short
  // wall or a shrub with it); and a row of cars along a kerb, bumper to bumper, can be as long as a
  // wall: a car's height along a street, a few metres past its kerb, has to be whole and even to be a
  // wall. (A row of them in their bays, side by side, was a row of short runs.)
  found = found.filter((w) => { if ((w.kind === 'wall' && w.L < 6) || (w.kind === 'hedge' && w.L < 5) || (w.kind === 'retaining' && w.L < 4)) { why.short++; return false; } return true; });
  const cars = new Set();
  for (const w of found) if (w.kind === 'wall' && w.h >= 1 && w.h <= 2 && (w.cover < 0.85 || w.even < 0.8) && streetsNear(w.mx, w.mz, 3.5).some((q) => q.k <= 7 && Math.abs(q.ux * w.ux + q.uz * w.uz) >= Math.cos(Math.PI / 15))) cars.add(w);
  why.cars = cars.size;
  found = found.filter((w) => !cars.has(w));
  // A hedge is a garden's or a street's: within 30 m of a building, or beside a street. A retaining
  // wall found in a wood or a field, away from any building, is the terrain's own step.
  found = found.filter((w) => {
    if (w.kind === 'hedge' && !buildingNear(w.mx, w.mz, 30) && !streetsNear(w.mx, w.mz, 4).length) { why['hedges out of town']++; return false; }
    if (w.kind === 'retaining' && inWild(w.mx, w.mz) && !buildingNear(w.mx, w.mz, 25)) { why['steps in the wild']++; return false; }
    return true;
  });
  // Two runs of one kind in one place (a step found twice, a cell apart) are one, the longer. A wall
  // found along a retaining wall whose top is no higher than the retaining wall's is its face (the
  // terrain under a face is its lower side's); no more than a parapet higher, its parapet (measured
  // with it); higher still, a fence or a railing on it, standing on its top, which the cloud sees
  // through as little as a wall (the Rua do Couteiro's). A hedge within 3 m of a retaining wall and
  // taller than a clipped hedge (1.5 m) is what grows on the bank over it (the Avenida Doutor Viriato
  // Amaral Nunes's trees over its painted wall), and so along the map's retaining walls, below. A wall and a hedge in one place are one, the one seen more of, but
  // where the hedge stands half a metre or more over the wall: a low wall with a hedge on it, as Minho
  // has them.
  {
    const fg = index(found), same = new Set();
    for (const w of [...found].sort((a, b) => b.L - a.L)) {
      if (same.has(w)) continue;
      for (const o of alongside(w, found, fg, 0.8, (o) => o.kind === w.kind && !same.has(o) && o.L <= w.L).by) if (alongside(o, [w], index([w]), 0.8).share >= 0.5) same.add(o);
    }
    why.twice += same.size;
    found = found.filter((w) => !same.has(w));
    const steps = found.filter((w) => w.kind === 'retaining'), sg = index(steps);
    found = found.filter((w) => {
      if (w.kind === 'hedge' && w.h > HEDGE_H && alongside(w, steps, sg, 3).share >= 0.5) { why['growth on banks']++; return false; }
      if (w.kind !== 'wall') return true;
      const a = alongside(w, steps, sg, 1);
      if (a.share < 0.5) return true;
      const top = quantile(w.ys, 0.5), over = top - quantile(a.by[0].ys, 0.5);
      if (over <= 0.3) { why['faces of retaining walls']++; return false; }
      if (over <= 1.2) { why.parapets++; return false; }
      w.kind = 'fence';
      w.h = over;
      why['fences on retaining walls']++;
      return true;
    });
    const ridges = found.filter((w) => w.kind === 'wall' || w.kind === 'hedge'), rg = index(ridges), gone = new Set();
    for (const w of ridges) {
      if (gone.has(w)) continue;
      const a = alongside(w, ridges, rg, 0.6, (o) => o.kind !== w.kind && !gone.has(o));
      if (a.share < 0.5) continue;
      const o = a.by[0], [hedge, wall] = w.kind === 'hedge' ? [w, o] : [o, w];
      if (hedge.h >= wall.h + 0.5) { wall.hedged = true; continue; }
      gone.add(o.L * o.cover > w.L * w.cover ? w : o);
    }
    why.twice += gone.size;
    found = found.filter((w) => !gone.has(w));
  }

  // ---- The map's barriers, measured, and what the LiDAR found that the map has. ----
  const walls = [];
  for (const b of osm) {
    const mm = measured.get(b.id) ?? { cover: 0, h: NaN, stepped: false, drop: NaN };
    const w = { kind: b.kind, material: b.material, h: b.h, w: b.w, pts: b.pts, level: b.level, source: 'osm', id: b.id };
    if (w.kind === 'wall' && mm.stepped) { w.kind = 'retaining'; why['retaining walls of the map']++; }
    if (w.kind === 'retaining' && mm.stepped) {
      if (mm.drop < 0) w.pts = [...w.pts].reverse();
      w.h = Math.abs(mm.drop);
    } else if (mm.cover >= 0.3 && mm.h >= LOW_H) w.h = mm.h;
    w.h ??= USUAL_H[w.kind];
    w.measured = (w.kind === 'retaining' && mm.stepped) || (w.kind !== 'retaining' && mm.cover >= 0.3);
    walls.push(w);
  }
  {
    // The steps first, as one can make a wall of the map's a retaining wall, which the hedges then see.
    const og = index(walls);
    for (const w of [...found].sort((a, b) => (b.kind === 'retaining') - (a.kind === 'retaining'))) {
      // A hedge along a wall of the map's is its own, but one taller than a clipped hedge within 3 m
      // of a retaining wall of the map's is the bank's growth, as above.
      if (w.kind === 'hedge' && w.h > HEDGE_H && alongside(w, walls, og, 3, (o) => o.kind === 'retaining').share >= 0.5) { why['growth on banks']++; continue; }
      const a = alongside(w, walls, og, 1.5, (o) => w.kind !== 'hedge' || o.kind === 'hedge');
      if (a.share < 0.5) { walls.push({ kind: w.kind, material: null, h: w.h, w: w.w, pts: w.pts, ys: w.ys, level: 'ground', source: 'lidar', measured: true, parapet: w.parapet, hedged: w.hedged }); continue; }
      why['on the map']++;
      // A step the LiDAR found along a wall of the map's that its own line missed: a retaining wall.
      const o = a.by[0];
      if (w.kind === 'retaining' && o.kind === 'wall') {
        o.kind = 'retaining';
        o.h = w.h;
        if ((o.pts[o.pts.length - 1][0] - o.pts[0][0]) * w.ux + (o.pts[o.pts.length - 1][1] - o.pts[0][1]) * w.uz < 0) o.pts = [...o.pts].reverse();
        o.measured = true;
        why['retaining walls of the map']++;
      } else if (w.kind === 'retaining' && o.kind !== 'retaining') walls.push({ kind: 'retaining', material: null, h: w.h, w: null, pts: w.pts, ys: w.ys, level: 'ground', source: 'lidar', measured: true, parapet: w.parapet });
    }
  }
  console.log(`walls: ${found.length} found; left out: ${JSON.stringify(why)}`);

  // ---- The gates: the map's, each across the street or the path it's on (or along the wall it's
  // in), and one wherever a driveway (or a private service road) crosses a wall. ----
  const GATE = { gate: 'gate', swing_gate: 'gate', sliding_gate: 'gate', wicket_gate: 'gate', kissing_gate: 'gate', turnstile: 'gate', 'full-height_turnstile': 'gate', lift_gate: 'bar', chain: 'bar', rope: 'bar' };
  const onWays = new Map(), onWalls = new Map();
  for (const l of [...lines, ...ways]) l.nodes?.forEach((id, i) => { if (!onWays.has(id)) onWays.set(id, []); onWays.get(id).push({ l, i }); });
  for (const w of walls) if (w.id) { const b = osm.find((o) => o.id === w.id); b?.nodes?.forEach((id, i) => { if (!onWalls.has(id)) onWalls.set(id, { w, p: b.pts[i] }); }); }
  const wallIndex = () => index(walls);
  let ig = wallIndex();
  const gates = [];
  const why2 = { 'gates the map has': 0, 'gates on driveways': 0, 'gates in gaps': 0, 'gates nowhere': 0, openings: 0 };
  const way = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
  for (const e of barriersOsm.elements) {
    const t = e.tags ?? {}, kind = GATE[t.barrier];
    if (e.type !== 'node' || !kind || below(t)) continue;
    const [x, z] = P(e);
    if (!inBox(x, z)) continue;
    let ux, uz, w;
    const on = onWays.get(e.id)?.[0], inWall = onWalls.get(e.id);
    if (on) { const [ax, az] = way(on.l.pts, on.i); [ux, uz] = [-az, ax]; w = on.l.w; }
    else if (inWall) { const q = nearest(inWall.w.pts, x, z); [ux, uz] = [q.ux, q.uz]; w = t.barrier === 'wicket_gate' ? 1 : 3; }
    else {
      // Near a wall of the map's, along it; else across the nearest street or path.
      let best = null;
      for (const i of new Set(ig.near(x, z, 1))) { const q = nearest(walls[i].pts, x, z); if (q.d < 3 && (!best || q.d < best.d)) best = q; }
      if (best) { [ux, uz] = [best.ux, best.uz]; w = 3; }
      else {
        let bl = null;
        for (const l of [...lines, ...ways]) { const q = nearest(l.pts, x, z); if (q.d < 5 && (!bl || q.d < bl.q.d)) bl = { l, q }; }
        if (!bl) { why2['gates nowhere']++; continue; }
        [ux, uz] = [-bl.q.uz, bl.q.ux];
        w = bl.l.w;
      }
    }
    w = Math.max(0.8, Math.min(12, parseFloat(t.width) || w));
    const h = parseFloat(t.height);
    gates.push({ kind, material: 'metal', h: h > 0 && h < 6 ? h : USUAL_H[kind], w: 0.1, span: w, pts: [[x - (ux * w) / 2, z - (uz * w) / 2], [x + (ux * w) / 2, z + (uz * w) / 2]], level: 'ground', source: 'osm', id: e.id, open: false });
    why2['gates the map has']++;
  }

  // Where the segment from a to b crosses the one from c to d, or null.
  const cross = (a, b, c, d) => {
    const ex = b[0] - a[0], ez = b[1] - a[1], fx = d[0] - c[0], fz = d[1] - c[1], den = ex * fz - ez * fx;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * fz - (c[1] - a[1]) * fx) / den, u = ((c[0] - a[0]) * ez - (c[1] - a[1]) * ex) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + ex * t, a[1] + ez * t] : null;
  };
  // A gap in a wall the LiDAR found, a door's width or a car's, between two runs of it in one line,
  // where no street or path the map has passes: a gate in it.
  {
    const found = walls.filter((w) => w.source === 'lidar' && w.kind === 'wall'), ends = new Grid(10);
    found.forEach((w, i) => { ends.add(...w.pts[0], [i, 0]); ends.add(...w.pts[w.pts.length - 1], [i, 1]); });
    const dir = (w) => { const a = w.pts[0], b = w.pts[w.pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
    const passes = (a, b) => [...lines, ...ways].some((l) => l.pts.some((p, k) => k && cross(a, b, l.pts[k - 1], p)));
    for (const [i, w] of found.entries()) {
      const p = w.pts[w.pts.length - 1], [ux, uz] = dir(w);
      for (const [j, end] of ends.near(p[0], p[1], 1)) {
        if (j === i) continue;
        const o = found[j], q = o.pts[end ? o.pts.length - 1 : 0], [vx, vz] = dir(o), gap = Math.hypot(q[0] - p[0], q[1] - p[1]);
        // On from its end, in its line, the other running the same way.
        const on = (q[0] - p[0]) * ux + (q[1] - p[1]) * uz, off = Math.abs(-(q[0] - p[0]) * uz + (q[1] - p[1]) * ux);
        if (!((gap >= 0.8 && gap <= 1.4) || (gap >= 2.4 && gap <= 5)) || on < 0.5 || off > 0.4 || Math.abs(ux * vx + uz * vz) < Math.cos(Math.PI / 22)) continue;
        if (passes(p, q) || gates.some((g) => Math.hypot((g.pts[0][0] + g.pts[1][0]) / 2 - (p[0] + q[0]) / 2, (g.pts[0][1] + g.pts[1][1]) / 2 - (p[1] + q[1]) / 2) < 3)) continue;
        gates.push({ kind: 'gate', material: 'metal', h: USUAL_H.gate, w: 0.1, span: gap, pts: [p, q], level: 'ground', source: 'lidar', open: false });
        why2['gates in gaps']++;
      }
    }
  }

  // Where a street or a path crosses a wall, the wall opens as wide as it (a retaining wall too: a
  // flight of steps climbs through it, and a tunnel's road passes under the step at its portal; but
  // not under a bridge's deck), and a driveway's opening in a wall has a gate (unless the map has one
  // there).
  const cuts = new Map(); // wall → [[s, half]]
  const cutAt = (w, x, z, half) => { const q = nearest(w.pts, x, z); if (!cuts.has(w)) cuts.set(w, []); cuts.get(w).push([q.s, half]); };
  const gateNear = (x, z, r) => gates.some((g) => Math.hypot((g.pts[0][0] + g.pts[1][0]) / 2 - x, (g.pts[0][1] + g.pts[1][1]) / 2 - z) < r);
  for (const l of [...lines, ...ways]) {
    if (l.level === LEVEL.bridge) continue;
    const drive = l.t.highway === 'service' && (l.t.service === 'driveway' || l.t.access === 'private' || l.t.access === 'no');
    // A way the map stops short of a wall goes through it (the map's line ends at a flight's foot, a
    // drive's at its gate): its ends 3 m on.
    const on = (p, q) => { const L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1; return [p[0] + ((p[0] - q[0]) / L) * 3, p[1] + ((p[1] - q[1]) / L) * 3]; };
    const pts = l.pts.length > 1 ? [on(l.pts[0], l.pts[1]), ...l.pts, on(l.pts[l.pts.length - 1], l.pts[l.pts.length - 2])] : l.pts;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k];
      const near = new Set(), n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 10);
      for (let f = 0; f <= n; f++) for (const i of ig.near(a[0] + ((b[0] - a[0]) * f) / n, a[1] + ((b[1] - a[1]) * f) / n, 1)) near.add(i);
      for (const i of near) {
        const w = walls[i];
        if (w.kind === 'gate' || w.kind === 'bar') continue;
        for (let j = 1; j < w.pts.length; j++) {
          const p = cross(a, b, w.pts[j - 1], w.pts[j]);
          if (!p) continue;
          cutAt(w, p[0], p[1], l.w / 2 + 0.2);
          if (drive && w.kind !== 'retaining' && !gateNear(p[0], p[1], 4)) {
            const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = -(b[1] - a[1]) / L, uz = (b[0] - a[0]) / L;
            gates.push({ kind: 'gate', material: 'metal', h: USUAL_H.gate, w: 0.1, span: l.w, pts: [[p[0] - (ux * l.w) / 2, p[1] - (uz * l.w) / 2], [p[0] + (ux * l.w) / 2, p[1] + (uz * l.w) / 2]], level: 'ground', source: w.source, open: false });
            why2['gates on driveways']++;
          } else why2.openings++;
        }
      }
    }
  }
  // And each gate's own opening, in whatever wall runs through it.
  for (const g of gates) {
    const [x, z] = [(g.pts[0][0] + g.pts[1][0]) / 2, (g.pts[0][1] + g.pts[1][1]) / 2];
    for (const i of new Set(ig.near(x, z, 1))) {
      const w = walls[i];
      if (w.kind === 'retaining') continue;
      const q = nearest(w.pts, x, z);
      // Across the wall (a gate across a drive the wall crosses), or along it (a gate in its line).
      if (q.d < 0.75) cutAt(w, x, z, g.span / 2);
    }
  }
  // The walls, each cut where it opens: its pieces of 0.5 m or more.
  const out = [];
  for (const w of walls) {
    const L = lengthOf(w.pts), cs = (cuts.get(w) ?? []).sort((a, b) => a[0] - b[0]);
    let s = 0;
    const spans = [];
    for (const [c, half] of cs) { if (c - half > s) spans.push([s, c - half]); s = Math.max(s, c + half); }
    if (L > s) spans.push([s, L]);
    for (const [s0, s1] of spans) if (s1 - s0 >= 0.5) out.push({ ...w, pts: cs.length ? piece(w.pts, s0, s1) : w.pts, ys: w.ys && cs.length ? null : w.ys, from: s0, whole: L, ysWhole: w.ys, ptsWhole: w.pts });
  }

  // ---- What each is, how thick, and its top's height at each point. ----
  const final = [];
  for (const w of [...out, ...gates]) {
    const L = lengthOf(w.pts), mid = pointAt(w.pts, L / 2);
    dress(w, { building: buildingNear(mid.x, mid.z, 15)?.kind ?? null, street: Math.min(Infinity, ...streetsNear(mid.x, mid.z, 10).map((q) => q.k)) });
    // Its points at most VERTEX apart, and each one's top: the terrain where the LiDAR saw it (a
    // retaining wall's, on its higher side) and its height over it, or its parapet's.
    const n = Math.max(1, Math.ceil(L / VERTEX)), pts = [], ys = [];
    for (let k = 0; k <= n; k++) {
      const p = pointAt(w.pts, (L * k) / n);
      pts.push([Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]);
      if (w.ysWhole) {
        // A found one's own tops, along it as it was found.
        const s = w.from + (L * k) / n, W = w.whole, m = w.ysWhole.length - 1, f = Math.max(0, Math.min(m, (s / (W || 1)) * m)), i = Math.min(m - 1, Math.floor(f));
        ys.push(m ? w.ysWhole[i] + (w.ysWhole[i + 1] - w.ysWhole[i]) * (f - i) : w.ysWhole[0]);
        continue;
      }
      const [sx, sz] = seenAt(p.x, p.z);
      ys.push(w.kind === 'retaining' && w.measured ? ground.at(sx + p.uz * 1.75, sz - p.ux * 1.75) : ground.at(sx, sz) + w.h);
    }
    // Only the points where it turns, or its top bends by 10 cm or more.
    const keep = [0];
    for (let k = 1; k < pts.length - 1; k++) {
      const a = keep[keep.length - 1], b = k + 1, L = Math.hypot(pts[b][0] - pts[a][0], pts[b][1] - pts[a][1]) || 1, f = Math.hypot(pts[k][0] - pts[a][0], pts[k][1] - pts[a][1]) / L;
      const off = Math.abs((pts[b][0] - pts[a][0]) * (pts[k][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[k][0] - pts[a][0])) / L;
      if (off > 0.05 || Math.abs(ys[a] + (ys[b] - ys[a]) * f - ys[k]) > 0.1) keep.push(k);
    }
    keep.push(pts.length - 1);
    final.push({ kind: w.kind, material: w.material ?? null, ...(w.on ? { on: w.on } : {}), h: Math.round(w.h * 100) / 100, w: Math.round(thick(w) * 100) / 100, pts: keep.map((k) => pts[k]), ys: keep.map((k) => Math.round(ys[k] * 100) / 100), level: w.level ?? 'ground', source: w.source, ...(w.id ? { id: w.id } : {}), ...(w.kind === 'gate' || w.kind === 'bar' ? { open: w.open } : {}) });
  }
  const km = (f) => Math.round(final.filter(f).reduce((s, w) => s + lengthOf(w.pts), 0) / 100) / 10;
  const stats = Object.fromEntries(['wall', 'retaining', 'fence', 'railing', 'hedge', 'guard_rail'].map((k) => [k, { osm: km((w) => w.kind === k && w.source === 'osm'), lidar: km((w) => w.kind === k && w.source === 'lidar') }]));
  console.log(`walls: ${final.length} pieces round the open world's area, in km: ${JSON.stringify(stats)}; ${final.filter((w) => w.kind === 'gate' || w.kind === 'bar').length} gates; ${JSON.stringify(why2)}; in ${((Date.now() - t0) / 60000).toFixed(1)} minutes`);
  fs.writeFileSync(path.join(CACHE, 'walls.json'), JSON.stringify({ about: "The walls, fences, railings, hedges and gates round the open world's area, by tools/walls.mjs: © OpenStreetMap contributors (ODbL); and DGT's 2025 LiDAR, informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).", why: { ...why, ...why2 }, stats, walls: final }));
}
