// Every roof as the point cloud has it (task 087): each part of each building tools/roofs.mjs measured,
// its 50 cm cells of DGT's 2025 LiDAR cut into the planes they lie on, and the roof built from them as
// the highest of a few groups of planes, each the lowest of its own (a ridge or a hip where a group's
// planes meet, a valley where two groups' do): any roof whose planes meet without a step is one such,
// an L's and a T's, a mansard, a half-hip, a skillion and a gable side by side. What stands on the roof
// more than 40 cm over it is a block of its own at its measured size (a chimney, a dormer, a lift's
// machine room, a water tank); and the roof's overhang past the walls is as far as the points reach.
// Where the planes fit the cells no better than the part's shape as roofs.mjs found it (flat, gabled,
// hipped, skillion), that shape stays, with what stands on it.
//
// node tools/planes.mjs                 after roofs.mjs, before world.mjs: into .cache/planes.json
// node tools/planes.mjs try <id> [k]    one building's parts, as a picture of its cells, the planes
//                                       and the blocks, into .cache/planes/<id>.png
//
// .cache/planes.json, by building (the map's id, or found/<n> for one the map lacks, its place in
// roofs.json's `found`) and its parts in roofs.json's order: each null (its shape stays, nothing on it)
// or { planes, groups, blocks, over, res, res0 }: planes [c, gx, gz], a height above the sea of
// c + gx·x + gz·z on the map, null where the shape stays; groups, each the planes' numbers; blocks
// [x, z, ux, uz, l, w, top], a box's middle, its long way, its half-length and half-width and its
// top above the sea; over, the overhang in metres (null where the points can't say); res and res0,
// the planes' and the shape's mean distance from the cells, in metres.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE, readCache } from './geo.mjs';
import { footprints, half, inside, minRect, rectAxis, ringOf, simplify } from './osm.mjs';
import { ROOFS, topAt } from './roofs.mjs';
import { inShooter } from './sections.mjs';

const S = 0.5; // the cells' spacing, in the part's own frame
const MARGIN = 1.5; // how far past the walls the cells are read, for the overhang
const quantile = (vals, f) => { if (!vals.length) return NaN; const s = Float64Array.from(vals).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round(f * (s.length - 1))))]; };

// A plane through points [a, b, h] by least squares: h = c + ga·a + gb·b. null if they're all on a line.
function fitPlane(ps) {
  let n = 0, sa = 0, sb = 0, sh = 0, saa = 0, sab = 0, sbb = 0, sah = 0, sbh = 0;
  for (const [a, b, h] of ps) { n++; sa += a; sb += b; sh += h; saa += a * a; sab += a * b; sbb += b * b; sah += a * h; sbh += b * h; }
  if (n < 3) return null;
  // About the points' middle, so the sums stay small.
  const ma = sa / n, mb = sb / n, mh = sh / n;
  const Saa = saa - n * ma * ma, Sab = sab - n * ma * mb, Sbb = sbb - n * mb * mb, Sah = sah - n * ma * mh, Sbh = sbh - n * mb * mh;
  const det = Saa * Sbb - Sab * Sab;
  if (Math.abs(det) < 1e-9 * Math.max(1, Saa * Sbb)) return null;
  const ga = (Sah * Sbb - Sbh * Sab) / det, gb = (Sbh * Saa - Sah * Sab) / det;
  return { c: mh - ga * ma - gb * mb, ga, gb };
}
const on = (p, a, b) => p.c + p.ga * a + p.gb * b;

// The roof the groups make at (a, b): the highest of each group's lowest (planes { c, ga, gb }).
export function roofHeight(planes, groups, a, b) {
  let top = -Infinity;
  for (const g of groups) {
    let low = Infinity;
    for (const i of g) low = Math.min(low, on(planes[i], a, b));
    top = Math.max(top, low);
  }
  return top;
}

// Today's shape over a part, as party-kart's roofs.ts draws it from what the tiles hold (its shapeOf):
// the lowest of a few planes over the rectangle round the ring lined up with the ridge, heights above
// the sea. roof: 0 flat, 1 hipped, 2 gabled, 3 skillion.
export function shapeHeight({ pts, roof, ends, dir, pitch, h, ridge }) {
  const ux = Math.cos(dir), uz = Math.sin(dir);
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
  for (const [x, z] of pts) { const a = x * ux + z * uz, c = -x * uz + z * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, c); b1 = Math.max(b1, c); }
  const am = (a0 + a1) / 2, bm = (b0 + b1) / 2, L = Math.max(0.01, (a1 - a0) / 2), W = Math.max(0.01, (b1 - b0) / 2);
  const plane = (h0, ka, kb) => ({ c: h0 - ka * am - kb * bm, gx: ka * ux - kb * uz, gz: ka * uz + kb * ux });
  const rise = Math.max(0, ridge - h), planes = [];
  if (roof === 0 || rise < 0.05) planes.push(plane(h, 0, 0));
  else if (roof === 3) planes.push(plane(h + rise / 2, -rise / (2 * L), 0));
  else {
    planes.push(plane(h + rise, 0, -rise / W), plane(h + rise, 0, rise / W));
    if (roof === 1 && ends) {
      const e = Math.min(L, rise / Math.tan((Math.max(5, Math.min(75, pitch)) * Math.PI) / 180));
      if (ends & 1) planes.push(plane(h + (rise / e) * L, rise / e, 0));
      if (ends & 2) planes.push(plane(h + (rise / e) * L, -rise / e, 0));
    }
  }
  return (x, z) => { let m = Infinity; for (const p of planes) m = Math.min(m, p.c + p.gx * x + p.gz * z); return m; };
}

const ROOF = { flat: 0, hipped: 1, gabled: 2, skillion: 3 };
const DIRS = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
// The ring as world.mjs writes it and a game reads it back, and the way its roof runs as the tiles
// say it (world.mjs's dirCode, index.js's dir).
export function drawn(pts) {
  const ring = simplify(pts, 0.3).map(([x, z]) => [half(x) / 2, half(z) / 2]);
  return ring.length >= 3 ? ring : null;
}
function drawnDir(ring, dir) {
  const axis = rectAxis(ring), want = dir ?? minRect(ring).angle;
  const off = (k) => { const d = want - axis - DIRS[k]; return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); };
  return axis + DIRS[[0, 1, 2, 3].reduce((b, k) => (off(k) < off(b) ? k : b), 0)];
}

// ---------------------------------------------------------------------------------------------
// One part: its cells, their planes, the roof they make, what stands on it, how far it overhangs.

// The part's cells on a grid lined up with its ring, MARGIN past it all round: each one's place in
// the frame (a along the ring's axis, b across), whether it's inside the ring, and the top of the
// building points there (NaN where there are none, or they're within a metre of the ground).
function cellsOf(ring, top, ground) {
  const ang = rectAxis(ring), ux = Math.cos(ang), uz = Math.sin(ang);
  const ab = ring.map(([x, z]) => [x * ux + z * uz, -x * uz + z * ux]);
  const a0 = Math.min(...ab.map((p) => p[0])) - MARGIN, a1 = Math.max(...ab.map((p) => p[0])) + MARGIN;
  const b0 = Math.min(...ab.map((p) => p[1])) - MARGIN, b1 = Math.max(...ab.map((p) => p[1])) + MARGIN;
  const na = Math.ceil((a1 - a0) / S), nb = Math.ceil((b1 - b0) / S), n = na * nb;
  const h = new Float32Array(n).fill(NaN), inn = new Uint8Array(n);
  let seen = 0, count = 0;
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const k = j * na + i, a = a0 + (i + 0.5) * S, b = b0 + (j + 0.5) * S;
    if (inside(ab, a, b)) { inn[k] = 1; count++; }
    const t = top(a * ux - b * uz, a * uz + b * ux);
    if (t === null) continue;
    if (inn[k]) seen++;
    if (t > ground + 1) h[k] = t;
  }
  return { ux, uz, ab, a0, b0, na, nb, h, inn, seen, count, A: (i) => a0 + (i + 0.5) * S, B: (j) => b0 + (j + 0.5) * S };
}

// Each roof cell's slope from the cells round it (those within a metre of its height), and how well a
// plane fits them.
function slopes(c) {
  const { na, nb, h, inn } = c, n = na * nb;
  const ga = new Float32Array(n).fill(NaN), gb = new Float32Array(n).fill(NaN), res = new Float32Array(n).fill(Infinity);
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const k = j * na + i;
    if (!inn[k] || !(h[k] === h[k])) continue;
    const ps = [];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj, q = jj * na + ii;
      if (ii < 0 || jj < 0 || ii >= na || jj >= nb || !inn[q] || !(h[q] === h[q]) || Math.abs(h[q] - h[k]) > 1) continue;
      ps.push([di * S, dj * S, h[q]]);
    }
    if (ps.length < 6) continue;
    const p = fitPlane(ps);
    if (!p) continue;
    ga[k] = p.ga;
    gb[k] = p.gb;
    let e = 0;
    for (const [a, b, z] of ps) e += (z - on(p, a, b)) ** 2;
    res[k] = Math.sqrt(e / ps.length);
  }
  return { ga, gb, res };
}

// The cells cut into planes, by growing each from the flattest cell left: a cell joins a plane if it's
// within 25 cm of it and slopes the same way within about 20°; each plane fitted again as it grows.
// Those of fewer than 8 cells (2 m²) are let go. Then neighbours on the same plane are one.
function regions(c, sl) {
  const { na, nb, h, inn } = c, n = na * nb;
  const label = new Int32Array(n).fill(-1), out = [];
  const seeds = [];
  for (let k = 0; k < n; k++) if (sl.res[k] < 0.1) seeds.push(k);
  seeds.sort((p, q) => sl.res[p] - sl.res[q]);
  const tried = new Uint8Array(n);
  const pt = (k) => { const i = k % na; return [c.A(i), c.B((k - i) / na), h[k]]; };
  for (const s of seeds) {
    if (label[s] >= 0 || tried[s]) continue;
    const [sa, sb] = pt(s);
    let plane = { c: h[s] - sl.ga[s] * sa - sl.gb[s] * sb, ga: sl.ga[s], gb: sl.gb[s] };
    const id = out.length, cells = [s];
    label[s] = id;
    for (let grown = true, fitted = 1; grown; ) {
      grown = false;
      for (let q = 0; q < cells.length; q++) {
        const k = cells[q], i = k % na, j = (k - i) / na;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di, jj = j + dj, m = jj * na + ii;
          if (ii < 0 || jj < 0 || ii >= na || jj >= nb || label[m] >= 0 || !inn[m] || !(h[m] === h[m])) continue;
          const [a, b] = pt(m);
          if (Math.abs(h[m] - on(plane, a, b)) > 0.25) continue;
          if (sl.res[m] < 0.1 && Math.abs(sl.ga[m] - plane.ga) + Math.abs(sl.gb[m] - plane.gb) > 0.4) continue;
          label[m] = id;
          cells.push(m);
          grown = true;
        }
        if (cells.length >= fitted * 1.5 + 4) {
          plane = fitPlane(cells.map(pt)) ?? plane;
          fitted = cells.length;
        }
      }
      const p = fitPlane(cells.map(pt));
      if (p) plane = p;
    }
    if (cells.length < 8) {
      for (const k of cells) { label[k] = -1; tried[k] = 1; }
      continue;
    }
    out.push({ id, cells, plane });
  }
  // Regions on the same plane, side by side or not (a slope a dormer or a chimney cuts in two): one.
  const parent = out.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let A = 0; A < out.length; A++) for (let B = A + 1; B < out.length; B++) {
    const p = out[A].plane, q = out[B].plane;
    if (Math.abs(p.ga - q.ga) + Math.abs(p.gb - q.gb) > 0.08) continue;
    const both = [...out[A].cells, ...out[B].cells].map(pt), r = fitPlane(both);
    if (r && quantile(both.map(([a, b, z]) => Math.abs(z - on(r, a, b))), 0.95) < 0.2) parent[find(B)] = find(A);
  }
  const merged = new Map();
  for (const r of out) {
    const root = find(r.id);
    if (!merged.has(root)) merged.set(root, []);
    merged.get(root).push(...r.cells);
  }
  const final = [];
  for (const cells of merged.values()) {
    const plane = fitPlane(cells.map(pt));
    if (!plane) continue;
    const id = final.length;
    for (const k of cells) label[k] = id;
    final.push({ id, cells, plane });
  }
  return { label, list: final };
}

// The pairs of regions that touch, side by side, with the cells along where they do.
function neighbours(c, label, withCells = false) {
  const { na, nb } = c, pairs = new Map();
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const k = j * na + i, A = label[k];
    if (A < 0) continue;
    for (const [di, dj] of [[1, 0], [0, 1]]) {
      const ii = i + di, jj = j + dj;
      if (ii >= na || jj >= nb) continue;
      const B = label[jj * na + ii];
      if (B < 0 || B === A) continue;
      const key = A < B ? `${A},${B}` : `${B},${A}`;
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push([(c.A(i) + c.A(ii)) / 2, (c.B(j) + c.B(jj)) / 2]);
    }
  }
  return [...pairs].map(([key, at]) => { const [A, B] = key.split(',').map(Number); return withCells ? [A, B, at] : [A, B]; });
}

// The groups for some regions' planes: each region's the planes over it or level with it (within 15
// cm) over 90% of its cells. A group that holds another's is left out: its lowest is never the highest.
function groupsOf(c, main) {
  const planes = main.map((r) => r.plane);
  const pt = (k) => { const i = k % c.na; return [c.A(i), c.B((k - i) / c.na)]; };
  let groups = main.map((r, i) => planes.map((_, j) => j).filter((j) => {
    if (j === i) return true;
    let over = 0;
    for (const k of r.cells) { const [a, b] = pt(k); if (on(planes[j], a, b) >= on(planes[i], a, b) - 0.15) over++; }
    return over >= 0.9 * r.cells.length;
  }));
  groups = groups.filter((g, i) => !groups.some((o, j) => j !== i && o.length < g.length && o.every((x) => g.includes(x))));
  return groups.filter((g, i) => groups.findIndex((o) => o.length === g.length && o.every((x) => g.includes(x))) === i);
}

// The roof from the regions of 2 m² or more (the 12 biggest): all of them, then, one at a time, without
// the one the roof lies closest to its cells without (each cell's distance counted to a metre at most,
// so what stands on the roof doesn't decide it), while that's closer, or no more than 1 cm further and
// no more than 5 cm further from that plane's own cells: a plane a step away (a wing lower down, a
// dormer's) or a strip along a ridge goes; a gable's two slopes stay, and a small hip.
function roofOf(c, reg) {
  const big = reg.list.filter((r) => r.cells.length * S * S >= 2).sort((p, q) => q.cells.length - p.cells.length).slice(0, 12);
  if (!big.length) return null;
  const cells = [];
  for (let k = 0; k < c.h.length; k++) if (c.inn[k] && c.h[k] === c.h[k]) cells.push(k);
  const pt = (k) => { const i = k % c.na; return [c.A(i), c.B((k - i) / c.na)]; };
  const misfit = (main) => {
    const planes = main.map((r) => r.plane), groups = groupsOf(c, main);
    let e = 0;
    for (const k of cells) { const [a, b] = pt(k); e += Math.min(1, Math.abs(c.h[k] - roofHeight(planes, groups, a, b))); }
    return { e: e / cells.length, groups, at: (r) => { let f = 0; for (const k of r.cells) { const [a, b] = pt(k); f += Math.min(1, Math.abs(c.h[k] - roofHeight(planes, groups, a, b))); } return f / r.cells.length; } };
  };
  let main = big, best = misfit(main);
  while (main.length > 1) {
    let pick = null;
    for (let i = 0; i < main.length; i++) {
      const rest = main.filter((_, j) => j !== i), tried = misfit(rest);
      const ok = tried.e < best.e || (tried.e <= best.e + 0.01 && tried.at(main[i]) <= best.at(main[i]) + 0.05);
      if (ok && (!pick || tried.e < pick.tried.e)) pick = { rest, tried };
    }
    if (!pick) break;
    main = pick.rest;
    best = pick.tried;
  }
  return { planes: main.map((r) => r.plane), groups: best.groups, cells: main.flatMap((r) => r.cells) };
}

// What stands on a roof (`height(a, b)` its surface): each set of cells side by side more than 40 cm
// over it, as a box lined up with the part, its top where most of its points are. One that fills
// less than half of its box (a parapet along the walls, an L of something) isn't one; nor one bigger
// than a third of the roof or longer than 20 m (a storey more over part of it), or a mast (one or two cells more than 3 m up), or a cell alone under 80 cm
// up (the points' noise at a roof's edge).
function blocksOn(c, height, roofArea) {
  const { na, nb, h, inn } = c, n = na * nb, over = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    if (!inn[k] || !(h[k] === h[k])) continue;
    const i = k % na, d = h[k] - height(c.A(i), c.B((k - i) / na));
    if (d > 0.4 && d < 15) over[k] = 1;
  }
  const seen = new Uint8Array(n), out = [];
  for (let s = 0; s < n; s++) {
    if (!over[s] || seen[s]) continue;
    const cells = [s];
    seen[s] = 1;
    for (let q = 0; q < cells.length; q++) {
      const k = cells[q], i = k % na, j = (k - i) / na;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di, jj = j + dj, m = jj * na + ii;
        if (ii < 0 || jj < 0 || ii >= na || jj >= nb || !over[m] || seen[m]) continue;
        seen[m] = 1;
        cells.push(m);
      }
    }
    const is = cells.map((k) => k % na), js = cells.map((k) => Math.floor(k / na));
    const i0 = Math.min(...is), i1 = Math.max(...is), j0 = Math.min(...js), j1 = Math.max(...js);
    const box = (i1 - i0 + 1) * (j1 - j0 + 1);
    if (cells.length < 0.5 * box || cells.length * S * S > roofArea / 3 || Math.max(i1 - i0 + 1, j1 - j0 + 1) * S > 20) continue;
    const top = quantile(cells.map((k) => h[k]), 0.75), rise = top - quantile(cells.map((k) => { const i = k % na; return height(c.A(i), c.B((k - i) / na)); }), 0.5);
    if ((cells.length <= 2 && rise > 3) || (cells.length === 1 && rise < 0.8)) continue;
    out.push({ a0: c.A(i0) - S / 2, a1: c.A(i1) + S / 2, b0: c.B(j0) - S / 2, b1: c.B(j1) + S / 2, top, cells: cells.length });
  }
  return out;
}

// How far past the walls the roof reaches: of the cells just outside the ring (to MARGIN), those whose
// points are on the roof's planes carried on (within 40 cm), band by band of 50 cm. null where under a
// third of the ring has cells read outside it (a neighbour against it, or nothing measured).
function overhang(c, height) {
  const { na, nb, h, inn, ab } = c, bands = [[0, 0], [0, 0], [0, 0]];
  const edge = (a, b) => {
    let d = Infinity;
    for (let q = 0, p = ab.length - 1; q < ab.length; p = q++) {
      const [px, pz] = ab[p], [qx, qz] = ab[q], dx = qx - px, dz = qz - pz, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((a - px) * dx + (b - pz) * dz) / L2)) : 0;
      d = Math.min(d, Math.hypot(px + dx * t - a, pz + dz * t - b));
    }
    return d;
  };
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const k = j * na + i;
    if (inn[k]) continue;
    const a = c.A(i), b = c.B(j), d = edge(a, b), band = Math.floor(d / 0.5);
    if (band > 2) continue;
    bands[band][1]++;
    if (h[k] === h[k] && Math.abs(h[k] - height(a, b)) < 0.4) bands[band][0]++;
  }
  if (!bands[0][1]) return null;
  const f = bands.map(([y, n]) => (n ? y / n : 0));
  if (f[0] < 0.33) return 0;
  return Math.round((0.5 * f[0] + 0.5 * f[1] * (f[0] >= 0.5 ? 1 : 0) + 0.5 * f[2] * (f[1] >= 0.5 ? 1 : 0)) * 10) / 10;
}

// One part, with the top of the building points (`top(x, z)` on the map, as roofs.mjs reads them),
// its ground and its shape as the tiles have it. null if too little of it was seen.
export function planesOf(ring, top, ground, shape) {
  const c = cellsOf(ring, top, ground);
  if (!c.count || c.seen < 0.8 * c.count) return null;
  const toMap = (a, b) => [a * c.ux - b * c.uz, a * c.uz + b * c.ux];
  // Today's shape, in the frame; and the mean distance of the roof's cells from a surface.
  const old = shapeHeight(shape), oldAB = (a, b) => old(...toMap(a, b));
  const roofCells = [];
  for (let k = 0; k < c.h.length; k++) if (c.inn[k] && c.h[k] === c.h[k]) roofCells.push(k);
  if (roofCells.length < 8) return null;
  const at = (k) => { const i = k % c.na; return [c.A(i), c.B((k - i) / c.na)]; };
  const misfit = (fn, blocks) => {
    let e = 0;
    for (const k of roofCells) {
      const [a, b] = at(k);
      let z = fn(a, b);
      for (const q of blocks) if (a >= q.a0 && a <= q.a1 && b >= q.b0 && b <= q.b1) z = Math.max(z, q.top);
      e += Math.abs(c.h[k] - z);
    }
    return e / roofCells.length;
  };
  const area = c.count * S * S;
  const reg = regions(c, slopes(c));
  const roof = roofOf(c, reg);
  let use = null;
  // A roof of planes where the part's isn't flat, or where it is and its cells slope (more than 6°).
  if (roof && (shape.roof !== ROOF.flat || roof.planes.some((p) => Math.hypot(p.ga, p.gb) > 0.1))) use = { fn: (a, b) => roofHeight(roof.planes, roof.groups, a, b), roof };
  const blocks0 = blocksOn(c, oldAB, area), res0 = misfit(oldAB, blocks0);
  let blocks = blocks0, res = res0, planes = null, groups = null, fn = oldAB;
  // Nowhere over the part, its corners and the cells no point fell in too, higher than its highest
  // points (30 cm over most of them) or lower than a metre over its ground: a plane carried on past its
  // own cells (a slope of the next building's, a lone one of two) is no roof.
  if (use) {
    const hs = roofCells.map((k) => c.h[k]), hi = quantile(hs, 0.99) + 0.3, lo = ground + 1;
    const over = [...c.ab, ...Array.from(c.inn.keys()).filter((k) => c.inn[k]).map(at)].some(([a, b]) => { const z = use.fn(a, b); return z > hi || z < lo; });
    if (over) use = null;
  }
  // Nor along the walls, every 50 cm, more than 40 cm over the points within a metre inside them (or
  // where there are none, 50 cm over the shape) where the shape isn't as high: a gable carried on over
  // a hip no point fell on would raise the walls under it to the ridge. Over a tenth of them by more
  // than 30 cm, or one by 60. (Where the part takes in a lower roof than its own, both are too high.)
  if (use) {
    let bad = 0, n = 0, worst = 0;
    for (let q = 0; q < c.ab.length; q++) {
      const [pa, pb] = c.ab[q], [qa, qb] = c.ab[(q + 1) % c.ab.length], L = Math.hypot(qa - pa, qb - pb);
      for (let t = 0.25; t < L; t += 0.5) {
        const a = pa + ((qa - pa) * t) / L, b = pb + ((qb - pb) * t) / L, i0 = Math.floor((a - c.a0) / S), j0 = Math.floor((b - c.b0) / S);
        let near = -Infinity;
        for (let j = j0 - 2; j <= j0 + 2; j++) for (let i = i0 - 2; i <= i0 + 2; i++) {
          if (i < 0 || j < 0 || i >= c.na || j >= c.nb) continue;
          const k = j * c.na + i;
          if (c.inn[k] && c.h[k] === c.h[k] && Math.hypot(c.A(i) - a, c.B(j) - b) <= 1) near = Math.max(near, c.h[k]);
        }
        const z = use.fn(a, b), d = z - (near > -Infinity ? near + 0.1 : oldAB(a, b) + 0.2);
        n++;
        if (z < oldAB(a, b) + 0.3) continue;
        if (d > 0.3) bad++;
        worst = Math.max(worst, d);
      }
    }
    if (worst > 0.6 || bad > 0.1 * n) use = null;
  }
  if (use) {
    const b1 = blocksOn(c, use.fn, area), r1 = misfit(use.fn, b1);
    if (r1 < res0 - 0.05 && r1 < 0.85 * res0) {
      blocks = b1;
      res = r1;
      fn = use.fn;
      // On the map: c + gx·x + gz·z, its slopes to a thousandth and c taken after them, true at the
      // part's middle. (Kept at the map's origin, a thousandth's rounding was 65 cm 1.3 km out.)
      const ma = c.ab.reduce((s, p) => s + p[0], 0) / c.ab.length, mb = c.ab.reduce((s, p) => s + p[1], 0) / c.ab.length, [mx, mz] = toMap(ma, mb);
      planes = use.roof.planes.map((p) => {
        const gx = Math.round((p.ga * c.ux - p.gb * c.uz) * 1000) / 1000, gz = Math.round((p.ga * c.uz + p.gb * c.ux) * 1000) / 1000;
        return [Math.round((on(p, ma, mb) - gx * mx - gz * mz) * 100) / 100, gx, gz];
      });
      groups = use.roof.groups;
    }
  }
  // Blocks only where the roof under them fits (a misfit's leftovers aren't anything).
  if (res > 0.35) blocks = [];
  const over = overhang(c, fn);
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    planes,
    groups,
    blocks: blocks.map((q) => {
      const long = q.a1 - q.a0 >= q.b1 - q.b0, [x, z] = toMap((q.a0 + q.a1) / 2, (q.b0 + q.b1) / 2);
      const [ux, uz] = long ? [c.ux, c.uz] : [-c.uz, c.ux];
      return [r2(x), r2(z), r2(ux), r2(uz), r2((long ? q.a1 - q.a0 : q.b1 - q.b0) / 2), r2((long ? q.b1 - q.b0 : q.a1 - q.a0) / 2), r2(q.top)];
    }),
    over,
    res: r2(res),
    res0: r2(res0),
    // For `try`: the cells, their regions, and the roof.
    debug: { c, reg, roof, fn, old: oldAB, blocks },
  };
}

// ---------------------------------------------------------------------------------------------
// The script.

// Every building roofs.mjs measured, with its outline and its parts' as world.mjs draws them.
function allBuildings() {
  const r = readCache(ROOFS);
  const outlines = new Map();
  for (const e of footprints(readCache('osm/buildings.json'))) {
    const pts = ringOf(e);
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    outlines.set(String(e.id), pts);
  }
  const out = [];
  for (const [id, m] of Object.entries(r.buildings)) if (outlines.has(id)) out.push({ id, pts: outlines.get(id), m });
  r.found.forEach((f, n) => out.push({ id: `found/${n}`, pts: f.pts, m: f }));
  const shift = (x, z) => r.shifts[Math.floor(x / 250) + ',' + Math.floor(z / 250)] ?? [0, 0];
  return { out, shift };
}

function partsOf(b, shift) {
  return b.m.parts.map((p) => {
    if (!p.roof) return null;
    const ring = drawn(p.pts ?? b.pts);
    if (!ring) return null;
    const cx = ring.reduce((s, q) => s + q[0], 0) / ring.length, cz = ring.reduce((s, q) => s + q[1], 0) / ring.length, [dx, dz] = shift(cx, cz);
    const shape = { pts: ring, roof: ROOF[p.roof], ends: p.ends ?? 0, dir: drawnDir(ring, p.dir), pitch: p.pitch ?? 0, h: p.eaves, ridge: Math.max(p.eaves, p.ridge) };
    return { ring, shape, ground: p.ground, top: (x, z) => topAt(x + dx, z + dz) };
  });
}

// For `try`: a part's cells side by side, 8 pixels each: their heights (grey, the ring's outside dimmed),
// their regions (a colour each, the roof's bright), and the planes' and the shape's misfit (red over,
// blue under, to 50 cm), the blocks outlined in green.
async function picture({ c, reg, roof, fn, old, blocks }, file) {
  const { default: sharp } = await import('sharp');
  const Z = 8, { na, nb, h, inn } = c, W = na * Z, H = nb * Z, gap = 6, px = Buffer.alloc((4 * W + 3 * gap) * H * 3, 255);
  const vals = [...h].filter((v) => v === v), lo = Math.min(...vals), hi = Math.max(...vals);
  const main = new Set(roof ? roof.cells.map((k) => reg.label[k]) : []);
  const hue = (n) => [0, 1, 2].map((q) => Math.round(127 + 127 * Math.sin(n * 2.4 + q * 2.1)));
  const put = (panel, i, j, rgb) => { for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) { const o = ((j * Z + y) * (4 * W + 3 * gap) + panel * (W + gap) + i * Z + x) * 3; px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; } };
  const mis = (d) => { const t = Math.max(-1, Math.min(1, d / 0.5)); return t > 0 ? [255, Math.round(255 * (1 - t)), Math.round(255 * (1 - t))] : [Math.round(255 * (1 + t)), Math.round(255 * (1 + t)), 255]; };
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const k = j * na + i, a = c.A(i), b = c.B(j), v = h[k];
    const g = v === v ? Math.round(30 + (225 * (v - lo)) / (hi - lo || 1)) : 0, dim = inn[k] ? 1 : 0.45;
    put(0, i, j, [g * dim, g * dim, g * dim]);
    const l = reg.label[k];
    put(1, i, j, !inn[k] ? [200, 200, 200] : l < 0 ? [255, 255, 255] : hue(l).map((q) => (main.has(l) ? q : 90 + q / 3)));
    put(2, i, j, inn[k] && v === v ? mis(v - fn(a, b)) : [200, 200, 200]);
    put(3, i, j, inn[k] && v === v ? mis(v - old(a, b)) : [200, 200, 200]);
  }
  for (const q of blocks) for (const panel of [2, 3]) {
    const i0 = Math.round((q.a0 - c.a0) / S), i1 = Math.round((q.a1 - c.a0) / S) - 1, j0 = Math.round((q.b0 - c.b0) / S), j1 = Math.round((q.b1 - c.b0) / S) - 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (i === i0 || i === i1 || j === j0 || j === j1) put(panel, i, j, [0, 170, 0]);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(px, { raw: { width: 4 * W + 3 * gap, height: H, channels: 3 } }).png().toFile(file);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  const { out: list, shift } = allBuildings();
  if (mode === 'try') {
    const b = list.find((q) => q.id === rest[0]);
    if (!b) throw new Error(`no building ${rest[0]} in ${ROOFS}`);
    const parts = partsOf(b, shift);
    for (const [k, p] of parts.entries()) {
      if (!p || (rest[1] != null && +rest[1] !== k)) continue;
      const r = planesOf(p.ring, p.top, p.ground, p.shape);
      if (!r) { console.log(`${b.id} part ${k}: not seen`); continue; }
      const file = path.join(CACHE, 'planes', `${b.id.replace('/', '-')}-${k}.png`);
      await picture(r.debug, file);
      console.log(`${b.id} part ${k} (${b.m.parts[k].roof}): ${r.debug.reg.list.length} regions, ${r.planes ? `${r.planes.length} planes in ${r.groups.length} groups` : 'its shape stays'}, ${r.blocks.length} blocks, overhang ${r.over}, misfit ${r.res} m (the shape's ${r.res0}): ${file}`);
    }
  } else {
    // --shooter: only the shooter's area's, and nothing written (to try it out).
    const only = mode === '--shooter';
    const t0 = Date.now(), all = {}, fits = [];
    let parts = 0, withPlanes = 0, withBlocks = 0, blocks = 0;
    // A tile of rasters at a time, as roofs.mjs reads them.
    list.sort((p, q) => (p.pts[0][0] < q.pts[0][0] ? -1 : 1));
    for (const b of list) {
      if (only && !inShooter(...b.pts[0])) continue;
      all[b.id] = partsOf(b, shift).map((p) => {
        if (!p) return null;
        parts++;
        const r = planesOf(p.ring, p.top, p.ground, p.shape);
        if (!r) return null;
        if (inShooter(...p.ring[0])) fits.push([r.res, r.res0, r.planes ? 1 : 0, p.shape.roof]);
        if (!r.planes && !r.blocks.length && r.over == null) return null;
        if (r.planes) withPlanes++;
        if (r.blocks.length) withBlocks++;
        blocks += r.blocks.length;
        const { debug, ...keep } = r;
        return keep;
      });
    }
    if (!only) fs.writeFileSync(path.join(CACHE, 'planes.json'), JSON.stringify({ about: 'tools/planes.mjs (task 087)', buildings: all }));
    const med = (f) => quantile(f, 0.5).toFixed(2);
    console.log(`planes: ${parts} parts, ${withPlanes} roofs of their own planes, ${blocks} blocks on ${withBlocks}, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    console.log(`the shooter's area's ${fits.length} roofs: misfit ${med(fits.map((f) => f[0]))} m at the median (the shapes' ${med(fits.map((f) => f[1]))}); pitched ${med(fits.filter((f) => f[3]).map((f) => f[0]))} (${med(fits.filter((f) => f[3]).map((f) => f[1]))}); of their own planes ${fits.filter((f) => f[2]).length}`);
  }
}
