// Every building's height and roof, measured from DGT's 2025 LiDAR (task 010). For each building
// OpenStreetMap has on the map, the points the LiDAR classed as building inside its footprint give
// the height of its eaves and of its ridge, the shape of its roof, which way the ridge runs and its
// pitch; where its roof steps by a storey or more (a tower on a block, a terrace down a hill), or a
// pitched roof turns a corner (an L, a T), the parts it's made of, each measured on its own; and
// from the 2025 orthophoto, each roof's colour.
//
// node tools/roofs.mjs        after fetch.mjs (buildings, lidar, ortho), before world.mjs
//
// - .cache/dgt/roofs/<tile>.bin: each of the point cloud's tiles boiled down to what this needs,
//   made once (about 15 s a tile): 50 cm cells on DGT's grid, each with the top of the building
//   points in it and their colour, and the top of the vegetation.
// - .cache/roofs.json: what was measured, by OSM id, which world.mjs reads, and tools/heights.mjs
//   checks against OSM's own heights.
//
// OpenStreetMap's outlines are a metre or two off the LiDAR's buildings in places (as they were
// traced from older photos), so the LiDAR is read where the buildings round each one say it is: a
// shift for each 250 m of the map. The outlines themselves stay where they are (task 011).
//
// The point cloud's own colours are paler and greyer than the photo's, and follow it loosely (a
// fit explains half the red), so the colours come from the orthophoto, from the middle of each
// roof: the photo's tall roofs lean away from their footprints, by about a fifth of their height.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import jpeg from 'jpeg-js';
import { CACHE, P, readCache } from './geo.mjs';
import { CLASS, DGT, fromTM, mapToTM, points, tileToMap, tilesOver } from './dgt.mjs';
import { buildings, fillCells, fit, square } from './footprints.mjs';
import { AREA_OF, bounds, footprints, Grid, inside, memberRings, minRect, rectAxis, ringArea, ringOf, simplify } from './osm.mjs';
import { EXT } from './sections.mjs';
import { terrain } from './terrain.mjs';

const DEG = 180 / Math.PI;
const quantile = (vals, f) => { if (!vals.length) return NaN; const s = Float64Array.from(vals).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round(f * (s.length - 1))))]; };

// ---------------------------------------------------------------------------------------------
// Measuring one building, from its footprint and what's under it: `top(x, z)` the top of the
// building points there, above the sea (NaN where there are none), `ground(x, z)` the ground, and
// `colour(x, z)` the orthophoto's [r, g, b] (or null).

const S = 0.5; // the samples' spacing, in the building's own frame

// The footprint sampled every 50 cm on a grid lined up with its smallest rectangle: a along its
// long side, b across. The rectangle is the one a game will find round the outline as world.mjs
// writes it (simplified, in half metres), so a roof measured along it runs along the walls drawn.
// Each sample inside the footprint has the roof there (NaN where there are no building points, or
// they're within a metre of the ground).
function sample(pts, at) {
  const drawn = simplify(pts, 0.3).map(([x, z]) => [Math.round(x * 2) / 2, Math.round(z * 2) / 2]);
  const angle = drawn.length >= 3 ? rectAxis(drawn) : minRect(pts).angle, ux = Math.cos(angle), uz = Math.sin(angle);
  let a0_ = Infinity, a1_ = -Infinity, b0_ = Infinity, b1_ = -Infinity;
  for (const [x, z] of pts) { const a = x * ux + z * uz, b = -x * uz + z * ux; a0_ = Math.min(a0_, a); a1_ = Math.max(a1_, a); b0_ = Math.min(b0_, b); b1_ = Math.max(b1_, b); }
  const am = (a0_ + a1_) / 2, bm = (b0_ + b1_) / 2;
  const r = { x: am * ux - bm * uz, z: am * uz + bm * ux, L: (a1_ - a0_) / 2, W: (b1_ - b0_) / 2 };
  const fr = { x: r.x, z: r.z, ux, uz };
  const na = Math.max(1, Math.ceil((2 * r.L) / S)), nb = Math.max(1, Math.ceil((2 * r.W) / S));
  const a0 = (-na * S) / 2, b0 = (-nb * S) / 2, n = na * nb;
  const h = new Float32Array(n).fill(NaN), g = new Float32Array(n).fill(NaN), inn = new Uint8Array(n);
  const ab = pts.map(([x, z]) => [(x - r.x) * ux + (z - r.z) * uz, -(x - r.x) * uz + (z - r.z) * ux]);
  let seen = 0, count = 0;
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const a = a0 + (i + 0.5) * S, b = b0 + (j + 0.5) * S;
    if (!inside(ab, a, b)) continue;
    const k = j * na + i, x = r.x + a * ux - b * uz, z = r.z + a * uz + b * ux;
    inn[k] = 1;
    count++;
    const t = at.top(x, z);
    if (t === null) continue;
    seen++;
    g[k] = at.ground(x, z);
    if (t > g[k] + 1) h[k] = t;
  }
  return { fr, na, nb, a0, b0, h, g, inn, ab, seen, count };
}
const xzOf = (s, a, b) => [s.fr.x + a * s.fr.ux - b * s.fr.uz, s.fr.z + a * s.fr.uz + b * s.fr.ux];

// How far (a, b) is from a piece's outline; a piece's extent across a (c = 0) or b (c = 1); and how
// much of its rectangle in the frame it fills.
function edgeDist(ab, a, b) {
  let d = Infinity;
  for (let q = 0, p = ab.length - 1; q < ab.length; p = q++) {
    const [px, pz] = ab[p], [qx, qz] = ab[q], dx = qx - px, dz = qz - pz, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((a - px) * dx + (b - pz) * dz) / L2)) : 0;
    d = Math.min(d, Math.hypot(px + dx * t - a, pz + dz * t - b));
  }
  return d;
}
const extent = (ab, c) => Math.max(...ab.map((p) => p[c])) - Math.min(...ab.map((p) => p[c]));
const fill = (ab) => ringArea(ab) / (extent(ab, 0) * extent(ab, 1));

// A piece cut by the line a = t (c = 0) or b = t (c = 1): the pieces either side of it (more than
// two where the line crosses the outline more than twice, as across both arms of a U), or null if
// any would be smaller than `least` m² or narrower than 2 m.
function cut(ab, c, t, least = 12) {
  t += 1e-7; // never through a corner
  const side = (p) => p[c] > t;
  // The outline with the points where it crosses the line put in, and those points along the line,
  // paired off as the chords the line makes inside it.
  const pts = [], cross = [];
  for (let q = 0; q < ab.length; q++) {
    const P = ab[q], Q = ab[(q + 1) % ab.length];
    pts.push({ p: P });
    if (side(P) !== side(Q)) {
      const f = (t - P[c]) / (Q[c] - P[c]), X = [P[0] + (Q[0] - P[0]) * f, P[1] + (Q[1] - P[1]) * f];
      cross.push(pts.length);
      pts.push({ p: X, cross: true });
    }
  }
  if (cross.length < 2) return null;
  cross.sort((i, j) => pts[i].p[1 - c] - pts[j].p[1 - c]);
  for (let k = 0; k + 1 < cross.length; k += 2) { pts[cross[k]].pair = cross[k + 1]; pts[cross[k + 1]].pair = cross[k]; }
  // Walk the outline from each corner not yet taken, across the chord at each crossing.
  const pieces = [], used = new Uint8Array(pts.length);
  for (let s = 0; s < pts.length; s++) {
    if (used[s] || pts[s].cross) continue;
    const piece = [];
    let k = s;
    for (let guard = 0; guard < 4 * pts.length; guard++) {
      used[k] = 1;
      piece.push(pts[k].p);
      if (pts[k].cross && pts[k].pair != null && piece.length > 1) {
        k = pts[k].pair;
        piece.push(pts[k].p);
        used[k] = 1;
      }
      k = (k + 1) % pts.length;
      if (k === s) break;
    }
    pieces.push(piece);
  }
  return pieces.length >= 2 && pieces.every((p) => p.length >= 3 && ringArea(p) >= least && extent(p, 0) >= 2 && extent(p, 1) >= 2) ? pieces : null;
}

// Where a piece's roof steps by a storey or more along a straight line across it: at least 3 m of
// the line stepping the same way, and little of it the other way (a tower in the middle of a block
// steps along part of the line; the rest of it crosses the block's roof). The line with the biggest
// step, from the cells either side of it, row by row. null if there's none.
function findStep(s, keep) {
  const { na, nb, h } = s;
  const at = (i, j) => (i >= 0 && j >= 0 && i < na && j < nb && keep(j * na + i) ? h[j * na + i] : NaN);
  let best = null;
  for (const c of [0, 1]) {
    const nA = c ? nb : na, nB = c ? na : nb;
    const H = (p, q) => (c ? at(q, p) : at(p, q));
    for (let p = 5; p < nA - 6; p++) {
      // The line between cells p and p + 1, for every row q across it.
      const diffs = [];
      for (let q = 0; q < nB; q++) {
        const l = [H(p, q), H(p - 1, q)].filter((v) => v === v), r = [H(p + 1, q), H(p + 2, q)].filter((v) => v === v);
        if (!l.length || !r.length) continue;
        // The smallest difference between the two sides: a slope through the line gives little.
        const lo = Math.min(...l) - Math.max(...r), hi = Math.max(...l) - Math.min(...r);
        diffs.push(lo > 0 ? lo : hi < 0 ? hi : 0);
      }
      if (diffs.length < 6) continue;
      const up = diffs.filter((d) => d > 1.5), down = diffs.filter((d) => d < -1.5);
      const [same, other] = up.length >= down.length ? [up, down] : [down, up];
      if (same.length < 6 || other.length > 0.15 * diffs.length) continue;
      const step = quantile(same, 0.5);
      if (Math.abs(step) < 2) continue;
      const score = Math.abs(step) * same.length;
      if (!best || score > best.score) best = { c, t: (c ? s.b0 : s.a0) + (p + 1) * S, score };
    }
  }
  return best;
}

// The roof over a piece of the footprint: its eaves and ridge above the sea, its shape, which way
// its ridge runs in the frame (c: 0 along a, 1 along b) and which of its ends are hipped, its pitch,
// and how much of the piece the LiDAR saw as roof.
function roofOf(s, ab, at) {
  const { na, nb, h } = s;
  const keep = pieceKeep(s, ab);
  const cells = [];
  let all = 0;
  for (let k = 0; k < na * nb; k++) if (keep(k)) { all++; if (h[k] === h[k]) cells.push(k); }
  if (cells.length < 8 || cells.length < all * 0.3) return null;
  const ab2 = (k) => { const i = k % na; return [s.a0 + (i + 0.5) * S, s.b0 + ((k - i) / na + 0.5) * S]; };
  // The slope at each roof cell from its four neighbours, and which way it faces (downhill): +a,
  // -a, +b, -b.
  const H = (i, j) => (i >= 0 && j >= 0 && i < na && j < nb && keep(j * na + i) ? h[j * na + i] : NaN);
  let flat = 0;
  const q = [0, 0, 0, 0], slopes = [[], [], [], []];
  for (const k of cells) {
    const i = k % na, j = (k - i) / na;
    const ga = (H(i + 1, j) - H(i - 1, j)) / (2 * S), gb = (H(i, j + 1) - H(i, j - 1)) / (2 * S);
    if (!(ga === ga && gb === gb)) continue;
    const sl = Math.atan(Math.hypot(ga, gb)) * DEG;
    if (sl < 10) { flat++; continue; }
    if (sl > 60) continue; // a wall, a step, a chimney's side
    const f = Math.abs(ga) > Math.abs(gb) ? (ga < 0 ? 0 : 1) : gb < 0 ? 2 : 3;
    q[f]++;
    slopes[f].push(sl);
  }
  const pitched = q[0] + q[1] + q[2] + q[3];
  const hs = cells.map((k) => h[k]);
  const grounds = cells.map((k) => s.g[k]);
  const out = { cover: cells.length / all, ground: quantile(grounds, 0.5) };
  if (pitched < 0.4 * (pitched + flat) || pitched * S * S < 8) {
    // Flat: the roof, the middle of it (not what stands on it, nor a neighbour's roof the outline
    // takes in), and a parapet round it where its edge is up to a metre and a half higher.
    const mid = quantile(hs, 0.5), edge = quantile(cells.filter((k) => edgeDist(ab, ...ab2(k)) < 1.25).map((k) => h[k]), 0.6);
    out.roof = 'flat';
    out.eaves = out.ridge = edge > mid && edge < mid + 1.5 ? edge : mid;
  } else {
    const alongA = q[2] + q[3] >= q[0] + q[1]; // its main slopes face ±b: the ridge runs along a
    const one = alongA ? Math.max(q[2], q[3]) : Math.max(q[0], q[1]);
    const across = extent(ab, alongA ? 1 : 0);
    out.c = alongA ? 0 : 1;
    out.pitch = quantile(alongA ? [...slopes[2], ...slopes[3]] : [...slopes[0], ...slopes[1]], 0.5);
    out.ridge = quantile(hs, 0.98);
    if (one > 0.85 * pitched) {
      // One slope, its eaves at its low side: `down` is the way it faces.
      out.roof = 'skillion';
      out.down = alongA ? (q[2] > q[3] ? 2 : 3) : q[0] > q[1] ? 0 : 1;
      out.eaves = out.ridge - across * Math.tan(out.pitch / DEG);
    } else {
      // Two slopes, and a hip at either end whose cells face it, as many as a hip as steep as the
      // slopes would have (half of them at least): a house of a semi-detached pair has one.
      const hip = (n) => n * S * S >= 0.3 * (across / 2) ** 2;
      const [lo, hi] = alongA ? [q[1], q[0]] : [q[3], q[2]];
      out.ends = (hip(lo) ? 1 : 0) | (hip(hi) ? 2 : 0);
      out.roof = out.ends ? 'hipped' : 'gabled';
      out.eaves = out.ridge - (across / 2) * Math.tan(out.pitch / DEG);
    }
    // Never below the lowest of the roof the LiDAR saw, nor above the middle of it: a big shed's
    // roof is several ridges, not one across all of it.
    out.eaves = Math.min(quantile(hs, 0.5), Math.max(out.eaves, quantile(hs, 0.02) - 0.3));
  }
  // Its colour: the orthophoto's, away from the roof's edge by a fifth of its height (as much as
  // the photo leans it), the lighter half of it (the shade and the shadows across it left out).
  const lean = Math.min(0.3 * Math.min(extent(ab, 0), extent(ab, 1)), 0.75 + Math.max(0, out.eaves - out.ground) / 5);
  let px = [];
  for (const d of [lean, 0.5]) {
    px = [];
    for (let k = 0; k < na * nb; k++) {
      if (!keep(k)) continue;
      const [a, b] = ab2(k);
      if (edgeDist(ab, a, b) < d) continue;
      const c = at.colour(...xzOf(s, a, b));
      if (c) px.push(c);
    }
    if (px.length >= 8) break;
  }
  if (px.length >= 4) {
    px.sort((u, v) => u[0] + u[1] + u[2] - (v[0] + v[1] + v[2]));
    const lit = px.slice(Math.floor(px.length * 0.5), Math.max(Math.floor(px.length * 0.5) + 1, Math.floor(px.length * 0.95)));
    out.colour = [0, 1, 2].map((c) => Math.round(quantile(lit.map((p) => p[c]), 0.5)));
  }
  return out;
}
const pieceKeep = (s, ab) => (k) => {
  if (!s.inn[k]) return false;
  const i = k % s.na;
  return inside(ab, s.a0 + (i + 0.5) * S, s.b0 + ((k - i) / s.na + 0.5) * S);
};

// A pitched roof over a footprint that isn't a rectangle (an L, a T, a U): cut at its inner corners
// into the pieces that fill their rectangles best, each with a roof of its own. Up to three cuts.
function rectangles(ab, depth = 0) {
  const f = fill(ab);
  if (f > 0.85 || depth >= 3) return [ab];
  let best = null;
  for (const c of [0, 1]) {
    const lo = Math.min(...ab.map((p) => p[c])), hi = Math.max(...ab.map((p) => p[c]));
    for (const p of ab) for (const e of [-0.01, 0.01]) {
      const t = p[c] + e;
      if (t < lo + 2 || t > hi - 2) continue;
      const pieces = cut(ab, c, t);
      if (!pieces) continue;
      const score = pieces.reduce((sum, q) => sum + ringArea(q) * fill(q), 0) / ringArea(ab);
      if (!best || score > best.score) best = { pieces, score };
    }
  }
  if (!best || best.score < f + 0.05) return [ab];
  return best.pieces.flatMap((q) => rectangles(q, depth + 1));
}

// Two pieces that share a side, as one: null if they don't, or if the one would touch itself.
const same = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
function join(A, B) {
  for (let k = 0; k < A.length; k++) {
    const P = A[k], Q = A[(k + 1) % A.length];
    const m = B.findIndex((v, n) => same(v, Q) && same(B[(n + 1) % B.length], P));
    if (m < 0) continue;
    // Round A from Q to P, then round B from P back to Q.
    const out = [];
    for (let n = 0; n < A.length; n++) out.push(A[(k + 1 + n) % A.length]);
    for (let n = 2; n < B.length; n++) out.push(B[(m + n) % B.length]);
    // Where they shared more than that side, a spike back along it: gone.
    for (let changed = true; changed && out.length > 3; ) {
      changed = false;
      for (let n = 0; n < out.length; n++) {
        const a = out[(n + out.length - 1) % out.length], b = out[n], c = out[(n + 1) % out.length];
        const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (same(a, c) || same(a, b) || Math.abs(cross) < 1e-6) { out.splice(n, 1); changed = true; break; }
      }
    }
    if (out.length < 3 || out.some((v, n) => out.some((w, o) => o > n && same(v, w)))) return null;
    return out;
  }
  return null;
}

// The whole building: split where its roof steps (up to 10 parts), then each part's roof, the
// pitched ones cut into rectangles first. In the frame, then back on the map.
export function measure(pts, at) {
  const s = sample(pts, at);
  if (!s.count || s.seen < s.count * 0.8) return { seen: false };
  const pieces = [];
  const go = (ab, depth) => {
    if (depth < 5 && pieces.length < 10) {
      const st = findStep(s, pieceKeep(s, ab));
      // (Nothing smaller than 20 m²: what stands on a roof, a lift's machine room, is the roof's.)
      const parts = st && cut(ab, st.c, st.t, 20);
      if (parts) { for (const p of parts) go(p, depth + 1); return; }
    }
    const roof = roofOf(s, ab, at);
    if (roof && roof.roof !== 'flat' && fill(ab) <= 0.85) {
      const rects = rectangles(ab);
      if (rects.length > 1) { for (const r of rects) pieces.push({ ab: r, roof: roofOf(s, r, at) }); return; }
    }
    pieces.push({ ab, roof });
  };
  go(s.ab, 0);
  // Flat pieces side by side at the same height are one again (the cuts round a tower in the middle
  // of a block cut the block too), where they make one outline without a hole.
  for (let merged = true; merged; ) {
    merged = false;
    for (let i = 0; i < pieces.length && !merged; i++) for (let j = i + 1; j < pieces.length && !merged; j++) {
      const A = pieces[i], B = pieces[j];
      if (!A.roof || !B.roof || A.roof.roof !== 'flat' || B.roof.roof !== 'flat' || Math.abs(A.roof.eaves - B.roof.eaves) > 0.6) continue;
      const ab = join(A.ab, B.ab);
      if (!ab) continue;
      pieces.splice(j, 1);
      pieces[i] = { ab, roof: roofOf(s, ab, at) };
      merged = true;
    }
  }
  let roofCells = 0;
  for (let k = 0; k < s.inn.length; k++) if (s.inn[k] && s.h[k] === s.h[k]) roofCells++;
  const angle = Math.atan2(s.fr.uz, s.fr.ux);
  return {
    seen: true,
    cover: roofCells / s.count,
    parts: pieces.map(({ ab, roof }) => {
      const p = { pts: pieces.length > 1 ? ab.map(([a, b]) => xzOf(s, a, b)) : null };
      if (!roof) return p;
      const { c, down, ...rest } = roof;
      // On the map (x east, z south): the way the ridge runs, from its first end to its second,
      // or the way a skillion faces.
      const dir = roof.roof === 'skillion' ? angle + [0, Math.PI, Math.PI / 2, -Math.PI / 2][down] : c == null ? null : angle + (c ? Math.PI / 2 : 0);
      return { ...p, ...rest, dir };
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// The point cloud, a tile at a time, as rasters of 50 cm cells: row 0 at the tile's north edge.

const N = 2000, CELL = 0.5;
const RDIR = path.join(DGT, 'roofs');

async function makeRaster(key) {
  const file = path.join(RDIR, key + '.bin'), laz = path.join(DGT, 'LAZ', key + '.laz');
  if (fs.existsSync(file) && fs.statSync(file).mtimeMs > fs.statSync(laz).mtimeMs) return;
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000;
  const top = new Float32Array(N * N).fill(NaN), veg = new Float32Array(N * N).fill(NaN), rgb = new Uint8Array(N * N * 3);
  const t0 = Date.now();
  await points(key, (p) => {
    const i = Math.floor((p.e - e0) / CELL), j = Math.floor((n1 - p.n) / CELL);
    if (i < 0 || j < 0 || i >= N || j >= N) return;
    const c = j * N + i;
    if (p.cls === CLASS.building) {
      if (!(top[c] >= p.y)) { top[c] = p.y; rgb[c * 3] = p.r >> 8; rgb[c * 3 + 1] = p.g >> 8; rgb[c * 3 + 2] = p.b >> 8; }
    } else if (p.cls >= CLASS.lowVegetation && p.cls <= CLASS.highVegetation) {
      if (!(veg[c] >= p.y)) veg[c] = p.y;
    }
  }, true);
  fs.mkdirSync(RDIR, { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([Buffer.from(top.buffer), Buffer.from(rgb.buffer), Buffer.from(veg.buffer)]), { level: 1 }));
  console.log(`roofs: ${key} boiled down in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

// A few tiles at a time, the rasters and the orthophoto, the least used dropped first.
function lru(size, load) {
  const m = new Map();
  let lastKey = null, last = null;
  return (key) => {
    if (key === lastKey) return last;
    let v;
    if (m.has(key)) { v = m.get(key); m.delete(key); }
    else v = load(key);
    m.set(key, v);
    if (m.size > size) m.delete(m.keys().next().value);
    lastKey = key;
    last = v;
    return v;
  };
}
const rasterOf = lru(12, (key) => {
  const file = path.join(RDIR, key + '.bin');
  if (!fs.existsSync(file)) return null;
  const b = zlib.gunzipSync(fs.readFileSync(file)), buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return { top: new Float32Array(buf, 0, N * N), veg: new Float32Array(buf, N * N * 7, N * N) };
});
const orthoOf = lru(4, (key) => {
  const file = path.join(DGT, 'ortho', key + '.jpg');
  return fs.existsSync(file) ? jpeg.decode(fs.readFileSync(file), { formatAsRGBA: false, maxMemoryUsageInMB: 1024 }) : null;
});

// The map's metres to EPSG:3763: a fit for each 500 m square, made when it's first needed.
const fits = new Map();
const toTM = (x, z) => {
  const i = Math.floor(x / 500), j = Math.floor(z / 500), k = i * 100000 + j;
  let f = fits.get(k);
  if (!f) fits.set(k, (f = mapToTM({ x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 })));
  return f(x, z);
};
// The top of the building points at (x, z) on the map: NaN where there are none, null where the
// point cloud wasn't fetched.
export function topAt(x, z) {
  const [e, n] = toTM(x, z), I = Math.floor(e / CELL), J = Math.floor(n / CELL), ti = Math.floor(I / N), tj = Math.floor(J / N);
  const r = rasterOf(ti + '_' + tj);
  return r ? r.top[(N - 1 - (J - tj * N)) * N + (I - ti * N)] : null;
}
export function colourAt(x, z) {
  const [e, n] = toTM(x, z), ke = Math.floor(e / 1000), kn = Math.floor(n / 1000), t = orthoOf(ke + '_' + kn);
  if (!t) return null;
  const s = t.width / 1000, i = Math.min(t.width - 1, Math.floor((e - ke * 1000) * s)), j = Math.min(t.height - 1, Math.floor((kn * 1000 + 1000 - n) * s)), k = (j * t.width + i) * 3;
  return [t.data[k], t.data[k + 1], t.data[k + 2]];
}

// How far OpenStreetMap's outlines sit from the LiDAR's buildings, for each 250 m square of the
// map: the shift (within 2.5 m) that best lays all the outlines there over the cells the LiDAR saw
// as building, to 10 cm. null where there are too few buildings to say.
function shifts(rings) {
  const B = 250, C = 0.5, R = 5, M = R * C + 1;
  const i0 = Math.floor(EXT.x0 / B), i1 = Math.floor(EXT.x1 / B), j0 = Math.floor(EXT.z0 / B), j1 = Math.floor(EXT.z1 / B);
  const field = new Map();
  for (let bj = j0; bj <= j1; bj++) for (let bi = i0; bi <= i1; bi++) {
    const x0 = bi * B - M, z0 = bj * B - M, n = Math.round((B + 2 * M) / C);
    const uni = new Uint8Array(n * n), lid = new Uint8Array(n * n);
    let any = false;
    for (const r of rings) {
      const b = r.b;
      if (b.x1 < x0 || b.x0 > x0 + n * C || b.z1 < z0 || b.z0 > z0 + n * C) continue;
      any = true;
      // Its cells, a row at a time, those well inside the square only.
      for (let j = Math.max(R + 2, Math.floor((b.z0 - z0) / C)); j <= Math.min(n - R - 3, Math.ceil((b.z1 - z0) / C)); j++) {
        const z = z0 + (j + 0.5) * C, xs = [];
        for (let k = 0, l = r.pts.length - 1; k < r.pts.length; l = k++) { const [ax, az] = r.pts[k], [bx, bz] = r.pts[l]; if (az > z !== bz > z) xs.push(ax + ((z - az) / (bz - az)) * (bx - ax)); }
        xs.sort((a, c) => a - c);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(R + 2, Math.ceil((xs[k] - x0) / C - 0.5)); i <= Math.min(n - R - 3, Math.floor((xs[k + 1] - x0) / C - 0.5)); i++) uni[j * n + i] = 1;
      }
    }
    if (!any) continue;
    let cells = 0;
    for (let k = 0; k < n * n; k++) cells += uni[k];
    if (cells * C * C < 2000) continue;
    let seen = true;
    for (let j = 0; j < n && seen; j++) for (let i = 0; i < n; i++) {
      const t = topAt(x0 + (i + 0.5) * C, z0 + (j + 0.5) * C);
      if (t === null) { seen = false; break; }
      lid[j * n + i] = t === t ? 1 : 0;
    }
    if (!seen) continue;
    const W = 2 * R + 1, sc = new Float64Array(W * W);
    for (let k = 0; k < n * n; k++) {
      if (!uni[k]) continue;
      for (let dj = -R; dj <= R; dj++) { const row = k + dj * n; for (let di = -R; di <= R; di++) sc[(dj + R) * W + di + R] += lid[row + di]; }
    }
    let bk = 0;
    for (let k = 1; k < W * W; k++) if (sc[k] > sc[bk]) bk = k;
    const bi_ = (bk % W) - R, bj_ = Math.floor(bk / W) - R;
    if (Math.abs(bi_) === R || Math.abs(bj_) === R) continue; // at the edge of the search: not found
    const par = (a, b, c) => { const d = a - 2 * b + c; return d < 0 ? (a - c) / (2 * d) : 0; };
    const dx = (bi_ + par(sc[bk - 1], sc[bk], sc[bk + 1])) * C, dz = (bj_ + par(sc[bk - W], sc[bk], sc[bk + W])) * C;
    field.set(bi + ',' + bj, { dx, dz, before: sc[R * W + R] / cells, after: sc[bk] / cells, cells });
  }
  // Each square's shift is the median of its own and its neighbours', to steady it.
  const steady = new Map();
  for (const key of field.keys()) {
    const [bi, bj] = key.split(',').map(Number), near = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const f = field.get(bi + a + ',' + (bj + b)); if (f) near.push(f); }
    steady.set(key, { ...field.get(key), dx: Math.round(quantile(near.map((f) => f.dx), 0.5) * 10) / 10, dz: Math.round(quantile(near.map((f) => f.dz), 0.5) * 10) / 10 });
  }
  return { B, at: (x, z) => steady.get(Math.floor(x / B) + ',' + Math.floor(z / B)) ?? null, all: steady };
}

// ---------------------------------------------------------------------------------------------
// The buildings OpenStreetMap lacks (task 011): where the LiDAR saw building and none of the map's
// outlines is (each laid where its square's shift says), what's left once anything narrower than
// 2.5 m is cleared (a wall, a sliver along an outline a little off), in groups of 20 m² or more.
// Each one's outline is squared to its walls (tools/footprints.mjs), or is Microsoft's where that
// lies closer over the LiDAR's cells. Then put back where the map's outlines round it are, so it
// sits with them as they're drawn, and measured as they are.
//
// Not a building, and dropped: what stands under 2 m (cars, hedges the LiDAR took for a roof); a
// lorry or a bus (under 3.2 m wide, 4.6 m tall and 19 m long); what the orthophoto shows green over
// most of it (a tree over a low roof); and on a car park, under 4.6 m and not beside a building the
// map has, a canopy (canopyOf, task 116), which the games don't draw.

// The file in .cache it writes (and world.mjs reads): another while a task tries it out, so the shared
// one isn't overwritten before the task lands.
export const ROOFS = process.env.ROOFS || 'roofs.json';
const MARGIN = 200; // cells read round each tile, so a building on its edge is whole: 100 m
// What the LiDAR's top over a "building" is like: a plane fitted to it (how far off it, rms, in metres;
// how steep, tilt) over its cells' [x, z] (`at`, in metres) and how high each is (`rise`).
export function topShape(at, rise) {
  const n = rise.length, cx = at.reduce((a, p) => a + p[0], 0) / n, cz = at.reduce((a, p) => a + p[1], 0) / n, mr = rise.reduce((a, b) => a + b, 0) / n;
  let xx = 0, xz = 0, zz = 0, xr = 0, zr = 0;
  at.forEach(([x, z], k) => { const [u, v, r] = [x - cx, z - cz, rise[k] - mr]; xx += u * u; xz += u * v; zz += v * v; xr += u * r; zr += v * r; });
  const det = xx * zz - xz * xz || 1, bx = (xr * zz - zr * xz) / det, bz = (zr * xx - xr * xz) / det;
  const rms = Math.sqrt(at.reduce((s, [x, z], k) => s + (rise[k] - mr - bx * (x - cx) - bz * (z - cz)) ** 2, 0) / n);
  return { rms, tilt: Math.hypot(bx, bz) };
}
// A LiDAR "building" on a car park under 4.6 m (task 116): a canopy over the cars, or not (null), by
// its top (topShape) and the orthophoto over it (its mean brightness and how much bluer than red and
// green, 0-255) and how long it is (L, m). A solar canopy: dark, one plane, tilted or blue. A tent (a
// row of white or grey pyramid awnings, one or many): light, its top bumpy as the pyramids are, 20 to
// 45 cm off a plane, or 18 cm and 5 m long or more (a kiosk 4 m across can be that bumpy). A flat
// one: light, flat, 10 m long or more (a long awning, or a row of vans under one). Of the 107 on the
// map's car parks in October 2026, looked at: 43 tents, 12 solar canopies, 5 flat ones, a few rows of
// vans and site cabins; the rest kiosks, sheds and buildings, which stay.
export function canopyOf({ rms, tilt, bright, blue, L }) {
  if (bright < 140 && rms < 0.2 && (tilt >= 0.1 || blue >= 13)) return 'solar';
  if (bright >= 160 && rms <= 0.45 && (rms >= 0.2 || (rms >= 0.18 && L >= 5))) return 'tent';
  if (bright >= 175 && rms < 0.2 && L >= 10) return 'flat';
  return null;
}
function missing(list, field, ground, box, ms, msField, parked = () => false) {
  const out = [], dropped = [], why = { low: 0, vehicle: 0, green: 0, canopy: 0 };
  // The map's outlines near a point, for whether a "building" is one's part, beside it.
  const mapped = new Grid(20);
  for (const it of list) mapped.add(it.cx, it.cz, it);
  const off = ([x, z], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(ax + dx * t - x, az + dz * t - z); };
  const beside = (pts) => pts.filter((p) => mapped.near(p[0], p[1], 4).some((it) => it.pts.some((a, k) => off(p, a, it.pts[(k + 1) % it.pts.length]) < 1.5))).length >= 0.3 * pts.length;
  let squared = 0, microsoft = 0;
  const W = N + 2 * MARGIN;
  for (const key of tilesOver(box)) {
    if (!rasterOf(key)) continue;
    const [ke, kn] = key.split('_').map(Number), E0 = ke * 1000 - MARGIN * CELL, N1 = kn * 1000 + 1000 + MARGIN * CELL;
    const toMap = tileToMap(key), cellXZ = (x, y) => toMap(E0 + x * CELL, N1 - y * CELL);
    const toCell = (x, z) => { const [e, n] = toTM(x, z); return [(e - E0) / CELL, (N1 - n) / CELL]; };
    // Where the LiDAR saw building, over the tile and round it.
    const top = new Float32Array(W * W).fill(NaN);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const r = rasterOf(`${ke + di}_${kn + dj}`);
      if (!r) continue;
      for (let j = 0; j < N; j++) {
        const y = j - dj * N + MARGIN;
        if (y < 0 || y >= W) continue;
        const x0 = Math.max(0, di * N + MARGIN), x1 = Math.min(W, di * N + MARGIN + N);
        if (x1 > x0) top.set(r.top.subarray(j * N + x0 - di * N - MARGIN, j * N + x1 - di * N - MARGIN), y * W + x0);
      }
    }
    // Less the map's outlines, laid over the LiDAR's buildings.
    const corners = [[0, 0], [W, 0], [0, W], [W, W]].map(([x, y]) => cellXZ(x, y)), mbox = bounds(corners);
    const mask = Uint8Array.from(top, (t) => (t === t ? 1 : 0));
    for (const it of list) {
      if (it.b.x1 < mbox.x0 || it.b.x0 > mbox.x1 || it.b.z1 < mbox.z0 || it.b.z0 > mbox.z1) continue;
      const sh = field.at(it.cx, it.cz) ?? { dx: 0, dz: 0 };
      fillCells(it.pts.map(([x, z]) => toCell(x + sh.dx, z + sh.dz)), 0, W - 1, 0, W - 1, (x, y) => { mask[y * W + x] = 0; });
    }
    // Microsoft's outlines near, laid over the LiDAR's buildings by their own shift.
    const near = new Grid(40 / CELL);
    for (const m of ms) {
      if (m.b.x1 < mbox.x0 || m.b.x0 > mbox.x1 || m.b.z1 < mbox.z0 || m.b.z0 > mbox.z1) continue;
      const sh = msField.at(m.cx, m.cz) ?? { dx: 0, dz: 0 }, ring = m.pts.map(([x, z]) => toCell(x + sh.dx, z + sh.dz));
      const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
      near.add(c[0], c[1], ring);
    }
    for (const b of buildings(mask, W, W, 2, 80)) {
      // Only those whose middle is on this tile: those round it are their own tiles'.
      const mx = b.all.x0 + (b.all.x1 - b.all.x0) / 2, my = b.all.y0 + (b.all.y1 - b.all.y0) / 2;
      if (mx < MARGIN || mx >= MARGIN + N || my < MARGIN || my >= MARGIN + N) continue;
      const [cx, cz] = cellXZ(mx, my);
      if (cx < box.x0 || cx > box.x1 || cz < box.z0 || cz > box.z1) continue;
      // Its height over the ground, and how green the photo is over it, from up to 300 of its cells.
      const cells = [];
      for (let k = 0; k < b.label.length; k++) if (b.label[k] === b.id) cells.push(k);
      const every = Math.max(1, Math.floor(cells.length / 300)), rise = [], at = [], rgb = [0, 0, 0];
      let green = 0, seen = 0;
      for (let q = 0; q < cells.length; q += every) {
        const k = cells[q], x = (k % b.w) + b.x0, y = Math.floor(k / b.w) + b.y0, [px, pz] = cellXZ(x + 0.5, y + 0.5);
        rise.push(top[y * W + x] - ground.at(px, pz));
        at.push([x * CELL, y * CELL]);
        const c = colourAt(px, pz);
        if (c) { seen++; if (2 * c[1] - c[0] - c[2] > 20) green++; rgb[0] += c[0]; rgb[1] += c[1]; rgb[2] += c[2]; }
      }
      const tall = quantile(rise, 0.5), ring = b.ring.map(([x, y]) => [x * CELL, y * CELL]), r = minRect(ring);
      const not = tall < 2 ? 'low' : r.W < 1.6 && r.L < 9.5 && tall < 4.6 ? 'vehicle' : seen && green > 0.6 * seen ? 'green' : null;
      if (not) { why[not]++; dropped.push([Math.round(cx), Math.round(cz), not]); continue; }
      // Its outline: squared, or as the cells step where it can't be; or Microsoft's, if closer.
      // (Walls straightened over a metre, then a metre and a half, where they won't over 60 cm.)
      const sq = square(ring) ?? square(ring, 1) ?? square(ring, 1.5);
      let best = (sq ?? simplify(ring, 0.8)).map(([x, y]) => [x / CELL, y / CELL]), fits = fit(best, b), src = 'lidar';
      if (sq) squared++;
      for (const m of near.near(mx, my, 1)) {
        const f = fit(m, b);
        if (f > fits) { best = m; fits = f; src = 'microsoft'; }
      }
      if (src === 'microsoft') microsoft++;
      // On the map, where the outlines round it are.
      const onMap = best.map(([x, y]) => fromTM(E0 + x * CELL, N1 - y * CELL));
      const sh = field.at(cx, cz) ?? { dx: 0, dz: 0 };
      const pts = onMap.map(([x, z]) => [Math.round((x - sh.dx) * 100) / 100, Math.round((z - sh.dz) * 100) / 100]);
      if (tall < 4.6 && parked(cx - sh.dx, cz - sh.dz) && seen) {
        const canopy = canopyOf({ ...topShape(at, rise), bright: (rgb[0] + rgb[1] + rgb[2]) / 3 / seen, blue: (rgb[2] - (rgb[0] + rgb[1]) / 2) / seen, L: r.L });
        if (canopy && !beside(pts)) { why.canopy++; dropped.push([Math.round(cx), Math.round(cz), 'canopy']); continue; }
      }
      out.push({ src, fit: Math.round(fits * 100) / 100, tall: Math.round(tall * 10) / 10, pts });
    }
  }
  return { found: out, dropped, why, squared, microsoft };
}

// ---------------------------------------------------------------------------------------------
// The script.

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // `--lacking` finds and measures only the buildings the map lacks again, keeping the map's own as
  // .cache/roofs.json has them; a box ({ x0, x1, z0, z1 }), for trying it out, measures only what's
  // in it.
  const lacking = process.argv.includes('--lacking'), arg = process.argv.slice(2).find((a) => a !== '--lacking');
  const only = arg ? JSON.parse(arg) : null;
  for (const key of tilesOver(only ?? EXT)) if (fs.existsSync(path.join(DGT, 'LAZ', key + '.laz'))) await makeRaster(key);
  const ground = await terrain();
  const t0 = Date.now();
  const box = only ?? EXT;
  const list = [];
  for (const e of footprints(readCache('osm/buildings.json'))) {
    const pts = ringOf(e);
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length < 3 || ringArea(pts) < 12) continue;
    const b = bounds(pts), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    if (cx < box.x0 - 300 || cx > box.x1 + 300 || cz < box.z0 - 300 || cz > box.z1 + 300) continue;
    list.push({ id: e.id, pts, b, cx, cz, tile: tilesOver({ x0: cx, x1: cx, z0: cz, z1: cz })[0] });
  }
  const field = shifts(list);
  const moved = [...field.all.values()];
  console.log(`roofs: outlines against the LiDAR in ${moved.length} squares of ${field.B} m: shifted ${quantile(moved.map((f) => Math.hypot(f.dx, f.dz)), 0.5).toFixed(1)} m (median), ${quantile(moved.map((f) => Math.hypot(f.dx, f.dz)), 0.9).toFixed(1)} m (9 in 10 under); on the LiDAR's buildings ${(quantile(moved.map((f) => f.before), 0.5) * 100).toFixed(0)}% of the outlines as they are, ${(quantile(moved.map((f) => f.after), 0.5) * 100).toFixed(0)}% shifted`);
  // A tile at a time, so each tile's rasters and photo are read once.
  list.sort((a, b) => (a.tile < b.tile ? -1 : a.tile > b.tile ? 1 : a.cx - b.cx));
  const out = { shifts: Object.fromEntries([...field.all].map(([k, f]) => [k, [f.dx, f.dz]])), buildings: lacking ? readCache('roofs.json').buildings : {} };
  let n = 0, unseen = 0;
  for (const it of lacking ? [] : list) {
    if (it.cx < box.x0 || it.cx > box.x1 || it.cz < box.z0 || it.cz > box.z1) continue;
    const sh = field.at(it.cx, it.cz) ?? { dx: 0, dz: 0 };
    const at = { top: (x, z) => topAt(x + sh.dx, z + sh.dz), ground: (x, z) => ground.at(x + sh.dx, z + sh.dz), colour: (x, z) => colourAt(x + sh.dx, z + sh.dz) };
    const m = measure(it.pts, at);
    n++;
    if (!m.seen) { unseen++; continue; }
    out.buildings[it.id] = m;
  }
  console.log(`roofs: ${n} buildings measured, ${unseen} outside the point cloud, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  // The buildings the map lacks, and Microsoft's outlines (if fetched) with their own shift.
  const t1 = Date.now();
  const msFile = path.join(CACHE, 'microsoft.json');
  const ms = (fs.existsSync(msFile) ? readCache('microsoft.json').rings : []).map((g) => {
    const pts = g.slice(0, -1).map(([lon, lat]) => P({ lat, lon })), b = bounds(pts);
    return { pts, b, cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2 };
  }).filter((m) => m.pts.length >= 3);
  const msField = shifts(ms);
  // The car parks on the ground (osm.mjs's AREA_OF: not one in a building), each in the 50 m cells its
  // box meets, for the canopies on them (task 116).
  const parks = new Map();
  for (const e of [...readCache('osm/base.json').elements, ...readCache('osm/barriers.json').elements]) {
    if (AREA_OF(e.tags ?? {}) !== 'parking' || (e.type !== 'way' && e.type !== 'relation')) continue;
    for (const r of e.type === 'way' ? [e.geometry.map(P)] : memberRings(e.members, 'outer')) {
      if (r.length < 4) continue;
      const b = bounds(r);
      for (let i = Math.floor(b.x0 / 50); i <= Math.floor(b.x1 / 50); i++) for (let j = Math.floor(b.z0 / 50); j <= Math.floor(b.z1 / 50); j++) parks.set(i + ',' + j, [...(parks.get(i + ',' + j) ?? []), r]);
    }
  }
  const parked = (x, z) => (parks.get(Math.floor(x / 50) + ',' + Math.floor(z / 50)) ?? []).some((r) => inside(r, x, z));
  const lost = missing(list, field, ground, box, ms, msField, parked);
  // Where the point cloud was boiled down: there the LiDAR saw every building, so world.mjs invents
  // none.
  out.seen = tilesOver(EXT).filter((key) => fs.existsSync(path.join(RDIR, key + '.bin')));
  out.found = [];
  out.dropped = lost.dropped;
  let parts = 0;
  for (const f of lost.found) {
    const b = bounds(f.pts), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const sh = field.at(cx, cz) ?? { dx: 0, dz: 0 };
    const m = measure(f.pts, { top: (x, z) => topAt(x + sh.dx, z + sh.dz), ground: (x, z) => ground.at(x + sh.dx, z + sh.dz), colour: (x, z) => colourAt(x + sh.dx, z + sh.dz) });
    if (!m.seen) continue;
    out.found.push({ ...f, ...m });
    parts += m.parts.length;
  }
  const area = Math.round(out.found.reduce((s, f) => s + ringArea(f.pts), 0) / 1000);
  console.log(`roofs: ${out.found.length} buildings the map lacks (${area}k m², ${parts} parts), ${lost.squared} squared and ${lost.microsoft} Microsoft's outlines (shifted ${quantile([...msField.all.values()].map((f) => Math.hypot(f.dx, f.dz)), 0.5).toFixed(1)} m, the median); not buildings: ${JSON.stringify(lost.why)}; in ${((Date.now() - t1) / 1000).toFixed(0)} s`);
  fs.writeFileSync(path.join(CACHE, ROOFS), JSON.stringify(out));
}
