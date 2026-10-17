// Where each street's carriageway really is (task 026). The world draws a street as a band round
// OpenStreetMap's line for it, at the width the map gives or guesses (decision 019), and the map's
// lines can sit a metre or two off the middle of the real street. DGT's 2025 LiDAR shows where it
// is: its 50 cm ground has the kerbs, a step of 10 to 20 cm, and the walls and banks a street ends
// at; and the laser's echo off the ground tells asphalt from a pavement or a verge (task 016: asphalt
// about 5 thousand, setts 7, pavements 10 and more), in the sun and in a shadow alike.
//
// node tools/carriageways.mjs                  measures every street on the ground in the open
//                                              world's area every 2 m, works out where each moves
//                                              to, and says how much it measured and where the
//                                              lines are furthest off (about 2 minutes)
// node tools/carriageways.mjs --check x z [r]  and the orthophoto r metres round (x, z) (40 by
//                                              default), with the map's lines, the edges measured
//                                              and the lines moved: .cache/carriageways/<x>_<z>.png
//
// .cache/carriageways.json: what was measured, each street's stations (`at`: how far along its line,
// and its two edges' offsets, to its right as it's drawn, or null where an edge wasn't seen), and the
// moves lines.mjs's onCarriageways makes: each node's, the points put in between two where the middle
// bends between them, and each street's width where it was measured clearly. Run after fetch.mjs
// lidar and cover.mjs (its point cloud boiled down), before world.mjs.
//
// How a station is measured: across the street, from its line out to half the map's width and 10 m
// more either side, the ground every 25 cm, each the mean over 2 m along the street: its height where
// the LiDAR saw ground there, and its echo where nothing stands on it (a car, a person: anything 0.5
// to 3 m over the ground) and no tree's crown is over it. From the road nearest the line, out either
// way, to its edge: a step of 8 cm or more in the ground over a metre (a kerb, a wall's foot, a
// bank), or the echo off something that isn't road for 1.5 m (a painted line is narrower). An edge is
// seen where the road was seen up to it; not where a parked car or a crown hides it, nor where the
// road runs on as far as the cross-section looks (a junction, a square, a street of setts from house
// to house). Nor at a junction, nor where another street's line runs in the band measured (a road
// the map draws as several ways side by side, with nothing between them).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CACHE, P } from './geo.mjs';
import { Grid, Inside, memberRings } from './osm.mjs';
import { LEVEL, moveLine, streetsOf } from './lines.mjs';

export const FILE = path.join(CACHE, 'carriageways.json');

// The stations, every STEP metres along a street; the cross-section's bins, BIN apart, each the mean
// over ALONG; how far past half the map's width it looks.
export const STEP = 2, BIN = 0.25;
const ALONG = [-1, -0.5, 0, 0.5, 1], REACH = 10;
// An edge: a step in the ground over a metre, which starts where a quarter metre of it rises or falls
// FOOT more than the road, and how far past it what's beyond is looked at; or something that isn't road this wide; the echo that's
// road where a band starts, and on a street the map says is setts or paving stones, and how much more
// it may be further out; and the narrowest a carriageway is.
const KERB = 0.08, FOOT = 0.03, BEYOND = 3, BRIGHT = 1.5, ROAD = 7.5, ROAD_SETTS = 9, RISE = 2, PAVED = 8.5, LANE = 2.4;
// The radius a kerb turns a corner at (streets.mjs's R_KERB), by osm.mjs's LINE kinds: no station is
// measured within it and half the other street's width of a junction.
const R_KERB = [10, 8, 8, 7, 6, 5, 3, 3, 3];
const COBBLE = new Set(['sett', 'cobblestone', 'unhewn_cobblestone', 'paving_stones', 'granite']);
// A car park's aisles, which aren't measured; and the car parks the map has, but the bays along a
// street, which are its carriageway's, kerb to kerb.
const AISLE = new Set(['parking_aisle', 'parking', 'drive-through']);
export const isCarPark = (t) => t?.amenity === 'parking' && !['street_side', 'lane', 'multi-storey', 'underground', 'rooftop'].includes(t.parking);

// ---- A cross-section ----

// The band of road round a street's line in one cross-section: `o` each bin's offset, to the line's
// right, BIN apart from the left; `h` the ground's height there (NaN where the LiDAR saw no ground);
// `e` the echo off it (NaN where something stands on it or a crown is over it); `park`, where a car
// park the map has begins (a band stops there: off a street, at the road's level). From the road
// nearest the line (a metre of it, within `seek`), out either way to its edge, as the file's head says.
// Returns { a, b, da, db }: the edges' offsets, each null where it wasn't seen, and how far the ground
// rises or falls past each, at the most, against the road's slope, out to `beyond` (a kerb's 15 cm, a
// wall's foot or a drop's metres, a bank behind a pavement).
export function across({ o, h, e, park = null }, { road = ROAD, seek = 3, beyond = BEYOND } = {}) {
  let limit = road;
  const n = o.length, isRoad = (j) => e[j] <= limit, isBright = (j) => e[j] > limit, known = (j) => !Number.isNaN(e[j]);
  // The seed: a metre with three bins of road in it, nearest the line.
  const zero = o.findIndex((v) => v > -BIN / 2);
  let seed = -1;
  for (let d = 0; seed < 0 && d * BIN <= seek; d++) {
    for (const j of d ? [zero - d, zero + d] : [zero]) {
      if (j < 2 || j + 2 > n) continue;
      let k = 0;
      for (let q = j - 2; q < j + 2; q++) k += isRoad(q);
      if (k >= 3 && isRoad(j)) { seed = j; break; }
    }
  }
  if (seed < 0) return { a: null, b: null, da: 0, db: 0 };
  // From there, road is what echoes up to RISE more than the road round the seed (asphalt's echo varies
  // from street to street, and a lane beside one patched can echo 8), but `road` at the least, and no
  // more than PAVED, which many pavements echo.
  const round = [];
  for (let j = seed - 2; j < seed + 2; j++) if (isRoad(j)) round.push(e[j]);
  limit = Math.max(road, Math.min(PAVED, round.sort((p, q) => p - q)[round.length >> 1] + RISE));
  // The road's slope across, round the seed: the median of the metres where both ends are road.
  const slopes = [];
  for (let j = Math.max(0, seed - 8); j + 4 < n && j <= seed + 4; j++) if (isRoad(j) && isRoad(j + 4) && !Number.isNaN(h[j]) && !Number.isNaN(h[j + 4])) slopes.push(h[j + 4] - h[j]);
  slopes.sort((p, q) => p - q);
  const g = slopes.length ? slopes[slopes.length >> 1] : 0;
  // Out from the seed one way (dir 1 to the right, -1 to the left), to the edge.
  const out = (dir) => {
    let last = seed, unknown = 0, bright = -1;
    const inRange = (j) => j >= 0 && j < n;
    // Whether the road was seen from the last bin of it to bin m: no more than a bin unseen between.
    const seenTo = (m) => { let u = 0; for (let q = last + dir; q !== m + dir; q += dir) if (!known(q)) u++; return u <= 1; };
    const edge = (at) => {
      if (at === null) return { at, d: 0 };
      let d = 0;
      const y = h[last];
      for (let q = last + dir; inRange(q) && (o[q] - at) * dir <= beyond; q += dir) { const v = h[q] - y - g * (o[q] - o[last]); if (Math.abs(v) > Math.abs(d)) d = v; }
      return { at, d: Number.isNaN(y) ? 0 : d };
    };
    for (let j = seed + dir; inRange(j); j += dir) {
      if (park?.[j]) return edge(Math.abs(o[j] - o[last]) <= 0.5 + 1e-9 ? (o[j] + o[j - dir]) / 2 : null);
      const k = j + 4 * dir;
      if (inRange(k) && !Number.isNaN(h[j]) && !Number.isNaN(h[k]) && Math.abs(h[k] - h[j] - g * dir) >= KERB) {
        // The step: where it starts, the first quarter metre in it that rises or falls FOOT more than
        // the road (a kerb's face, a bank's or a wall's foot), else the steepest.
        let m = -1, best = -1, steep = j;
        for (let q = j; q !== k; q += dir) {
          const d = Math.abs(h[q + dir] - h[q] - (g * dir) / 4);
          if (m < 0 && d >= FOOT) m = q;
          if (d > best) { best = d; steep = q; }
        }
        if (m < 0) m = steep;
        return edge(Math.abs(o[m] - o[last]) <= 1 + 1e-9 && seenTo(m) ? (o[m] + o[m + dir]) / 2 : null);
      }
      if (isRoad(j)) { last = j; unknown = 0; bright = -1; continue; }
      if (isBright(j)) {
        if (bright < 0) bright = j;
        if (Math.abs(o[j] - o[bright]) + BIN >= BRIGHT) return edge(Math.abs(o[bright] - o[last]) <= 0.5 + 1e-9 ? o[bright] - (dir * BIN) / 2 : null);
        continue;
      }
      if (++unknown * BIN > 3) return edge(null);
    }
    return edge(null);
  };
  const l = out(-1), r = out(1);
  return { a: l.at, b: r.at, da: l.d, db: r.d };
}

// ---- Measuring ----

// Every street on the ground with a point in the open world's area (`inArea(x, z)`), from `lines`
// (lines.mjs's streetsOf, round the area: every street, at every level, for the junctions and the
// streets side by side): its stations, { [id]: [[s, a, b, da, db], …] } (across's, s how far along it). `section(x, z, tx, tz, span)` gives a
// cross-section's bins at (x, z), across the way (tx, tz) runs; `inPark(x, z)`, whether a car park the
// map has is there. Not a car park's aisles, nor a street where its line runs through a car park: the
// car park is all road there, as far as the LiDAR can tell.
export function measure(lines, inArea, section, inPark = () => false) {
  const streets = lines.filter((l) => l.k <= 8);
  // Each node's streets, for the junctions.
  const at = new Map();
  for (const l of streets) l.nodes?.forEach((n, i) => at.set(n, [...(at.get(n) ?? []), [l, i]]));
  // Every street's stretches in cells of 20 m, for those that run in a band measured.
  const grid = new Grid(20);
  for (const l of streets) for (let i = 1; i < l.pts.length; i++) {
    const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 10));
    const seg = [l, ax, az, bx, bz];
    for (let f = 0; f <= n; f++) grid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, seg);
  }
  const out = {};
  for (const l of streets) {
    if (l.level !== LEVEL.ground || l.nodes?.length !== l.pts.length || AISLE.has(l.t.service) || !l.pts.some(([x, z]) => inArea(x, z))) continue;
    // How far along it each node is, and the stretches round each junction on it (where another
    // street meets it, not where it runs on into the next way straight), round each sharp turn (60° or
    // more, where a cross-section runs into the street's other arm), and at a dead end (where it looks
    // past the street's end).
    const s = [0];
    for (let i = 1; i < l.pts.length; i++) s.push(s[i - 1] + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]));
    const skip = [];
    for (let i = 1; i < l.pts.length - 1; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], [cx, cz] = l.pts[i + 1], u = Math.hypot(bx - ax, bz - az) * Math.hypot(cx - bx, cz - bz);
      if (u > 0 && ((bx - ax) * (cx - bx) + (bz - az) * (cz - bz)) / u < 0.5) skip.push([s[i] - l.w - 2, s[i] + l.w + 2]);
    }
    l.nodes.forEach((n, i) => {
      const others = (at.get(n) ?? []).filter(([o]) => o !== l);
      if (!others.length) { if (i === 0 || i === l.pts.length - 1) skip.push([s[i] - l.w / 2 - 2, s[i] + l.w / 2 + 2]); return; }
      const dir = (m, k) => { const q = m.pts[k === 0 ? 1 : k - 1], p = m.pts[k], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
      // Straight on into the next way, and nothing else there: no junction.
      if (others.length === 1 && (i === 0 || i === l.pts.length - 1)) {
        const [o, k] = others[0];
        if (k === 0 || k === o.pts.length - 1) { const u = dir(l, i), v = dir(o, k); if (u[0] * v[0] + u[1] * v[1] < -0.87) return; }
      }
      const r = Math.max(...others.map(([o]) => o.w / 2 + R_KERB[Math.min(8, o.k)] + 1));
      skip.push([s[i] - r, s[i] + r]);
    });
    const span = l.w / 2 + REACH, stations = [];
    for (let i = 1, at = 0; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], L = s[i] - s[i - 1];
      if (L < 1e-6) continue;
      const tx = (bx - ax) / L, tz = (bz - az) / L, rx = -tz, rz = tx;
      for (; at < s[i]; at += STEP) {
        const d = at - s[i - 1], x = ax + tx * d, z = az + tz * d;
        if (!inArea(x, z) || inPark(x, z) || skip.some(([p, q]) => at > p && at < q)) continue;
        const bins = section(x, z, tx, tz, span);
        const { a, b, da, db } = across(bins, { road: COBBLE.has(l.t.surface) ? ROAD_SETTS : ROAD, seek: Math.max(1.5, l.w / 2 - 0.5) });
        if (a === null && b === null) continue;
        // Narrower than a lane, or than four tenths of the map's width: a strip of something darker in a
        // street of something else, not the street.
        if (a !== null && b !== null && b - a < Math.max(LANE, 0.4 * l.w)) continue;
        // Another street's line in the band, or within a metre of it: a road the map draws as several
        // ways with nothing between them, or a junction the map doesn't join (one over another, a way
        // that ends near it); or one running alongside whose carriageway, at the map's width, the band
        // takes half a metre of (two ways that fork). A street beyond a reservation is further off.
        const A = a ?? -l.w / 2, Bd = b ?? l.w / 2;
        const shared = [...new Set(grid.near(x, z, Math.ceil(span / 20)))].some(([o, px, pz, qx, qz]) => {
          if (o === l || o.level === LEVEL.tunnel) return false;
          const dx = qx - px, dz = qz - pz, det = dx * rz - rx * dz;
          if (Math.abs(det) < 1e-9) return false;
          const t = (rx * (pz - z) - rz * (px - x)) / det, c = (dx * (pz - z) - dz * (px - x)) / det;
          if (t < 0 || t > 1) return false;
          if (c > A - 1 && c < Bd + 1) return true;
          return Math.abs(dx * tx + dz * tz) > 0.7 * Math.hypot(dx, dz) && Math.min(Bd, c + o.w / 2) - Math.max(A, c - o.w / 2) > 0.5;
        });
        if (shared) continue;
        stations.push([Math.round(at * 10) / 10, a === null ? null : Math.round(a * 100) / 100, b === null ? null : Math.round(b * 100) / 100, Math.round(da * 10) / 10, Math.round(db * 10) / 10]);
      }
    }
    if (stations.length) out[l.id] = stations;
  }
  return out;
}

// ---- The moves ----

// A line moves where its carriageway's middle is more than OFF off it for HOLD or more (the task's
// answer: by measurement, as the buildings are, decision 025): the middle taken every STEP along it as
// the median of the stations measured within WINDOW (five at least), smoothed over a few metres. It
// moves onto that middle there, and eases in and out over EASE either side. The task had "about half a
// metre": OFF is a bin, as the edges are measured to a quarter metre, and a third of a metre off already
// takes a carriageway over the drop beside it (the Avenida João XXI's at (586, 230)). Its width is the
// median of the widths measured, where it's clear: STATIONS or more, half of them within CLEAR of it.
// Where it is, a station that saw one edge says where the middle is too, half that width from it (a
// car parked along one kerb hides the other at most of them).
export const OFF = BIN, HOLD = 30, EASE = 20, WINDOW = 15, STATIONS = 8, CLEAR = 0.75, DROP = 0.5, SLACK = 0.1, TURN = 0.2;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const median = (v) => { const s = [...v].sort((p, q) => p - q); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

// A street's middle along it from its stations ([[s, a, b], …], `L` its length, `w` the map's width):
// `runs`, the stretches where it's OFF or more off its line for HOLD or more, each { s0, s1, at(s) };
// `width`, where it's clear; and the middle every STEP (`mid`, NaN where too little was measured), for
// the report.
export function profile(stations, L, w) {
  const both = stations.filter(([, a, b]) => a !== null && b !== null);
  const ws = both.map(([, a, b]) => b - a), mw = ws.length ? median(ws) : NaN;
  const width = ws.length >= STATIONS && ws.filter((v) => Math.abs(v - mw) <= CLEAR).length * 2 >= ws.length ? Math.round(mw * 10) / 10 : null;
  const mids = stations.flatMap(([s, a, b]) => (a !== null && b !== null ? [[s, (a + b) / 2]] : width && a !== null ? [[s, a + width / 2]] : width && b !== null ? [[s, b - width / 2]] : []));
  const n = Math.floor(L / STEP) + 1, raw = new Float64Array(n).fill(NaN);
  for (let g = 0, k0 = 0; g < n; g++) {
    const s = g * STEP, near = [];
    while (k0 < mids.length && mids[k0][0] < s - WINDOW) k0++;
    for (let k = k0; k < mids.length && mids[k][0] <= s + WINDOW; k++) near.push(mids[k][1]);
    if (near.length >= 5) raw[g] = median(near);
  }
  // Smoothed (a Gaussian of 4 m over what was measured).
  const mid = raw.map((v, g) => {
    if (Number.isNaN(v)) return NaN;
    let sw = 0, sv = 0;
    for (let k = Math.max(0, g - 6); k <= Math.min(n - 1, g + 6); k++) if (!Number.isNaN(raw[k])) { const w = Math.exp(-(((k - g) * STEP) ** 2) / 32); sw += w; sv += w * raw[k]; }
    return sv / sw;
  });
  // Where it moves to: the middle where it's off by OFF or more, the same way, through a gap of up to
  // 10 m where too little was measured, for HOLD or more; the line elsewhere.
  const to = new Float64Array(n);
  for (let g = 0; g < n; ) {
    if (!(Math.abs(mid[g]) > OFF)) { g++; continue; }
    const sign = Math.sign(mid[g]), idx = [g];
    let k = g + 1;
    for (; k < n; k++) {
      if (Math.sign(mid[k]) === sign && Math.abs(mid[k]) > OFF) { idx.push(k); continue; }
      if (!Number.isNaN(mid[k]) || k - idx.at(-1) > 5) break;
    }
    if ((idx.at(-1) - idx[0]) * STEP >= HOLD) for (let q = 1; q < idx.length; q++) for (let m = idx[q - 1]; m <= idx[q]; m++) to[m] = mid[idx[q - 1]] + ((mid[idx[q]] - mid[idx[q - 1]]) * (m - idx[q - 1])) / (idx[q] - idx[q - 1]);
    g = Math.max(k, g + 1);
  }
  // But never past an edge seen with a drop, a wall or a bank behind it (DROP or more within BEYOND of
  // it), at the width it's drawn (the one measured, or the map's), where two stations or more within
  // 6 m saw one: they bound it for 6 m either side, and it moves off them as far as they ask, wherever
  // they are. Then smoothed over a few metres, and turning no more than TURN a metre.
  const W = width ?? w, at = (lim, pick) => { const v = new Float64Array(n).fill(lim); for (const [s, a, b, da = 0, db = 0] of stations) { const [e, d] = pick(a, b, da, db); if (e !== null && Math.abs(d) >= DROP) { const g = Math.round(s / STEP); if (g >= 0 && g < n) v[g] = lim < 0 ? Math.max(v[g], e) : Math.min(v[g], e); } } return v; };
  const seenLo = at(-Infinity, (a, b, da) => [a === null ? null : a + W / 2 - SLACK, da]), seenHi = at(Infinity, (a, b, da, db) => [b === null ? null : b - W / 2 + SLACK, db]);
  const held = (seen, lim) => {
    const out = new Float64Array(n).fill(lim);
    for (let g = 0; g < n; g++) {
      let k = 0;
      for (let q = Math.max(0, g - 3); q <= Math.min(n - 1, g + 3); q++) k += Number.isFinite(seen[q]);
      if (k < 2) continue;
      for (let q = Math.max(0, g - 3); q <= Math.min(n - 1, g + 3); q++) if (Number.isFinite(seen[g])) out[q] = lim < 0 ? Math.max(out[q], seen[g]) : Math.min(out[q], seen[g]);
    }
    return out;
  };
  const lo = held(seenLo, -Infinity), hi = held(seenHi, Infinity);
  const bound = (v, g) => (lo[g] > hi[g] ? (lo[g] + hi[g]) / 2 : Math.min(Math.max(v, lo[g]), hi[g]));
  const kept = to.map(bound), T = kept.map((v, g) => { let sw = 0, sv = 0; for (let k = Math.max(0, g - 4); k <= Math.min(n - 1, g + 4); k++) { const q = Math.exp(-(((k - g) * STEP) ** 2) / 32); sw += q; sv += q * kept[k]; } return bound(sv / sw, g); });
  for (let g = 1; g < n; g++) T[g] = Math.min(Math.max(T[g], T[g - 1] - TURN * STEP), T[g - 1] + TURN * STEP);
  for (let g = n - 2; g >= 0; g--) T[g] = Math.min(Math.max(T[g], T[g + 1] - TURN * STEP), T[g + 1] + TURN * STEP);
  // The runs: each stretch it moves on, the middle of it or off a drop, between where it doesn't.
  const runs = [];
  for (let g = 0; g < n; g++) {
    if (Math.abs(T[g]) < 0.01) continue;
    const g0 = g;
    while (g + 1 < n && Math.abs(T[g + 1]) >= 0.01) g++;
    const g1 = g;
    runs.push({ s0: g0 * STEP, s1: g1 * STEP, at: (q) => { const f = Math.max(g0, Math.min(g1, q / STEP)), i = Math.floor(f), j = Math.min(g1, i + 1); return T[i] + (T[j] - T[i]) * (f - i); } });
  }
  return { runs, width, mid };
}

// How far off its line a street's middle is at s, from its runs: on one, the middle; between two up to
// 2·EASE apart, from one's to the other's; otherwise eased out over EASE, but towards an end of the
// street within EASE of a run, where the junction there decides.
function targetOf(runs, L) {
  if (!runs.length) return () => 0;
  return (s) => {
    for (const r of runs) if (s >= r.s0 && s <= r.s1) return r.at(s);
    const k = runs.findIndex((r) => r.s0 > s), A = k < 0 ? runs.at(-1) : k ? runs[k - 1] : null, B = k < 0 ? null : runs[k];
    const va = A ? A.at(A.s1) : 0, vb = B ? B.at(B.s0) : 0;
    if (A && B) {
      const gap = B.s0 - A.s1;
      return gap <= 2 * EASE ? va + (vb - va) * smooth((s - A.s1) / gap) : va * (1 - smooth((s - A.s1) / EASE)) + vb * smooth(1 - (B.s0 - s) / EASE);
    }
    if (B) return B.s0 <= EASE ? vb : vb * smooth(1 - (B.s0 - s) / EASE);
    return L - A.s1 <= EASE ? va : va * (1 - smooth((s - A.s1) / EASE));
  };
}

// The moves, from `lines` (streetsOf's round the area, every street and the railway, at every level)
// and `measured` ({ [id]: stations }): `nodes`, each node that moves, { [id]: [dx, dz] }; `inserts`,
// the points put in between two nodes of a street where its middle bends between them, { ["id:a-b"]:
// [[x, z], …] }; `widths`, each street's width where it was measured clearly, { [id]: w }; and `runs`,
// each stretch moved, for the report.
//
// A node at a junction (where streets meet, or a street ends) moves once for every street through
// it: to where its arms' middles meet (least squares, each arm's offset along its normal; where two
// arms run within 30° of each other, along the way they agree on). One on a bridge or a tunnel, or
// the railway, doesn't move: those keep their lines (task 028's decks, 012's levels), and the streets
// on the ground ease their moves out before them. Between two junctions a street's nodes move onto its
// middle as targetOf has it, and what's left to reach the junction's move at either end eases in over
// EASE (over the whole stretch, where it's shorter than 2·EASE).
export function movesOf(lines, measured) {
  const all = lines.filter((l) => l.k <= 9 && l.nodes?.length === l.pts.length), streets = all.filter((l) => l.k <= 8);
  const at = new Map();
  for (const l of all) l.nodes.forEach((n, i) => at.set(n, [...(at.get(n) ?? []), [l, i]]));
  const fixed = (n) => at.get(n).some(([l]) => l.k > 8 || (l.level !== LEVEL.ground && l.level !== LEVEL.under));
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1; return [-dz / d, dx / d]; };
  // Each street's own: how far along each node is, its offset there, and its normal there (mitred
  // between two stretches, as streets.mjs's shift, but no more than half as far again).
  const own = new Map(), widths = {}, runs = [];
  for (const l of streets) {
    const s = [0];
    for (let i = 1; i < l.pts.length; i++) s.push(s[i - 1] + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]));
    const p = measured[l.id] && l.level === LEVEL.ground ? profile(measured[l.id], s.at(-1), l.w) : { runs: [], width: null };
    // But one that runs on into a deck (its end where the deck's begins, the two within 30° of straight)
    // keeps the map's width, which the deck has, so the two still meet edge to edge there and none of the
    // deck stands past the street on the ground. One that crosses a deck's end, as the Avenida João
    // XXI's ways cross the Avenida 31 de Janeiro's (task 046), takes its own.
    const way = (m, k) => { const q = m.pts[k === 0 ? 1 : k - 1], d = Math.hypot(q[0] - m.pts[k][0], q[1] - m.pts[k][1]) || 1; return [(q[0] - m.pts[k][0]) / d, (q[1] - m.pts[k][1]) / d]; };
    const ontoDeck = [0, l.pts.length - 1].some((i) => at.get(l.nodes[i]).some(([o, k]) => o.level === LEVEL.bridge && (k === 0 || k === o.pts.length - 1) && way(l, i)[0] * way(o, k)[0] + way(l, i)[1] * way(o, k)[1] < -0.87));
    if (p.width && !ontoDeck) widths[l.id] = p.width;
    for (const r of p.runs) runs.push({ l, ...r });
    const t = targetOf(p.runs, s.at(-1));
    const normal = l.pts.map((q, i) => {
      const a = i > 0 ? nrm(l.pts[i - 1], q) : null, b = i < l.pts.length - 1 ? nrm(q, l.pts[i + 1]) : null;
      if (!a || !b) return a ?? b;
      const sx = a[0] + b[0], sz = a[1] + b[1], m = Math.hypot(sx, sz);
      if (m < 1e-6) return a;
      const f = 1 / (Math.max(2 / 3, m / 2) * m);
      return [sx * f, sz * f];
    });
    own.set(l, { s, t, normal, off: s.map(t), runs: p.runs });
  }
  // The junctions' moves.
  const junction = (n) => at.get(n).length > 1 || at.get(n).some(([l, i]) => i === 0 || i === l.pts.length - 1);
  const D = new Map();
  for (const [n, list] of at) {
    if (!junction(n)) continue;
    if (fixed(n)) { D.set(n, [0, 0]); continue; }
    let xx = 0, xz = 0, zz = 0, bx = 0, bz = 0;
    for (const [l, i] of list) {
      const o = own.get(l);
      for (const j of [i - 1, i + 1]) {
        if (j < 0 || j >= l.pts.length) continue;
        const [nx, nz] = j < i ? nrm(l.pts[j], l.pts[i]) : nrm(l.pts[i], l.pts[j]), v = o.off[i];
        xx += nx * nx; xz += nx * nz; zz += nz * nz; bx += v * nx; bz += v * nz;
      }
    }
    // The least squares' solution in the eigenvectors of its matrix; along the second none where it's
    // under a tenth of the first, as when the arms run within 35° of each other and barely tell.
    const tr = xx + zz, det = xx * zz - xz * xz, disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det)), m1 = tr / 2 + disc, m2 = tr / 2 - disc;
    let dx = 0, dz = 0;
    if (disc < 1e-9) [dx, dz] = [bx / m1, bz / m1];
    else {
      let [vx, vz] = Math.hypot(xz, m1 - xx) > 1e-9 ? [xz, m1 - xx] : [m1 - zz, xz];
      const vl = Math.hypot(vx, vz), c1 = (bx * vx + bz * vz) / vl / m1;
      [vx, vz] = [vx / vl, vz / vl];
      dx = c1 * vx; dz = c1 * vz;
      if (m2 >= 0.1 * m1) { const c2 = (-bx * vz + bz * vx) / m2; dx += -c2 * vz; dz += c2 * vx; }
    }
    D.set(n, [dx, dz]);
  }
  // Each street between its junctions.
  const nodes = {}, inserts = {}, put = (n, d) => { if (Math.hypot(d[0], d[1]) >= 0.005) nodes[n] = [Math.round(d[0] * 1000) / 1000, Math.round(d[1] * 1000) / 1000]; };
  for (const [n, d] of D) put(n, d);
  for (const l of streets) {
    const { s, t, normal, off, runs: moving } = own.get(l), ends = l.nodes.map((n, i) => (D.has(n) ? i : -1)).filter((i) => i >= 0);
    const mine = (i) => [normal[i][0] * off[i], normal[i][1] * off[i]];
    for (let k = 1; k < ends.length; k++) {
      const i0 = ends[k - 1], i1 = ends[k], s0 = s[i0], s1 = s[i1], len = s1 - s0;
      const d0 = D.get(l.nodes[i0]), d1 = D.get(l.nodes[i1]), m0 = mine(i0), m1 = mine(i1), c0 = [d0[0] - m0[0], d0[1] - m0[1]], c1 = [d1[0] - m1[0], d1[1] - m1[1]];
      if (!moving.some((r) => r.s1 > s0 - EASE && r.s0 < s1 + EASE) && !c0[0] && !c0[1] && !c1[0] && !c1[1]) continue;
      const weights = (q) => {
        if (len < 2 * EASE) { const u = smooth((q - s0) / (len || 1)); return [1 - u, u]; }
        return [1 - smooth((q - s0) / EASE), smooth(1 - (s1 - q) / EASE)];
      };
      const move = (q, base) => { const [w0, w1] = weights(q); return [base[0] + c0[0] * w0 + c1[0] * w1, base[1] + c0[1] * w0 + c1[1] * w1]; };
      const moved = new Map([[i0, d0], [i1, d1]]);
      for (let i = i0 + 1; i < i1; i++) { const d = move(s[i], mine(i)); moved.set(i, d); put(l.nodes[i], d); }
      // Between two nodes, the middle every STEP: where it bends more than 15 cm off the straight
      // between them, points put in.
      for (let i = i0; i < i1; i++) {
        const a = l.pts[i], b = l.pts[i + 1], L = s[i + 1] - s[i];
        if (L < 2 * STEP) continue;
        const da = moved.get(i), db = moved.get(i + 1), A = [a[0] + da[0], a[1] + da[1]], Bp = [b[0] + db[0], b[1] + db[1]], [nx, nz] = nrm(a, b), mids = [];
        for (let q = STEP; q < L - STEP / 2; q += STEP) {
          const f = q / L, d = move(s[i] + q, [nx * t(s[i] + q), nz * t(s[i] + q)]);
          mids.push([a[0] + (b[0] - a[0]) * f + d[0], a[1] + (b[1] - a[1]) * f + d[1]]);
        }
        const line = [A, ...mids, Bp];
        const far = Math.max(...mids.map((p) => segDist(p, A, Bp)));
        if (far > 0.15) inserts[`${l.id}:${l.nodes[i]}-${l.nodes[i + 1]}`] = thin(line, 0.05).slice(1, -1).map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]);
      }
    }
  }
  return { nodes, inserts, widths, runs };
}
const segDist = ([x, z], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * f, z - az - dz * f); };
// Douglas-Peucker on an open line.
function thin(pts, tol) {
  if (pts.length < 3) return pts;
  let far = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = segDist(pts[i], pts[0], pts.at(-1)); if (d > far) { far = d; at = i; } }
  return far <= tol ? [pts[0], pts.at(-1)] : [...thin(pts.slice(0, at + 1), tol).slice(0, -1), ...thin(pts.slice(at), tol)];
}

// ---- Overhangs ----

// Where a carriageway drawn on the ground overhangs a drop, as the task's test has it: along each
// street on the ground, every STEP, the ground across its band (at its line, `w` wide), from a quarter
// of its width out to 25 cm inside each edge, against the street's own height there (the ground over
// its middle half, carried on at that half's slope across): more than `drop` below or above it. Not
// at a junction (another street's line crossing the band, or one ending within 6 m of it), nor within
// 20 m of a deck's end or a tunnel's mouth, where the ground isn't the street's. `lines`: [{ pts, w, k,
// level }], the levels by name or number; `at(x, z)` the ground's height (the LiDAR's at 50 cm);
// `inArea(x, z)` where to look. Returns [{ x, z, o, d, l }]: where, how far out from the line, how far
// off the street's height, and the street.
export function overhangs(lines, at, inArea, { drop = 1 } = {}) {
  const level = (l) => (typeof l.level === 'number' ? ['ground', 'bridge', 'tunnel', 'under'][l.level] : l.level);
  const streets = lines.filter((l) => l.k <= 8), grid = new Grid(20), ends = new Grid(20);
  streets.forEach((l) => {
    for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 10));
      for (let f = 0; f <= n; f++) grid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [l, l.pts[i - 1], l.pts[i]]);
    }
    for (const p of [l.pts[0], l.pts.at(-1)]) ends.add(p[0], p[1], [l, p]);
  });
  const out = [];
  for (const l of streets) {
    if (level(l) !== 'ground') continue;
    const hw = l.w / 2;
    for (let i = 1, s = 0; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], L = Math.hypot(bx - ax, bz - az);
      if (L < 1e-6) continue;
      const tx = (bx - ax) / L, tz = (bz - az) / L, rx = -tz, rz = tx;
      for (; s < L; s += STEP) {
        const x = ax + tx * s, z = az + tz * s;
        if (!inArea(x, z)) continue;
        // A junction, or a deck's end or a tunnel's mouth.
        const end = ends.near(x, z, 2).some(([o, p]) => {
          const d = Math.hypot(p[0] - x, p[1] - z);
          return o !== l && (level(o) === 'bridge' || level(o) === 'tunnel' ? d < 20 : d < hw + 6);
        });
        if (end) continue;
        const crossed = grid.near(x, z, 1).some(([o, p, q]) => {
          if (o === l) return false;
          const dx = q[0] - p[0], dz = q[1] - p[1], det = dx * rz - rx * dz, len = Math.hypot(dx, dz);
          if (Math.abs(det) < 1e-9 || Math.abs(dx * tx + dz * tz) > 0.8 * len) return false;
          const t = (rx * (p[1] - z) - rz * (p[0] - x)) / det, c = (dx * (p[1] - z) - dz * (p[0] - x)) / det;
          return t >= 0 && t <= 1 && Math.abs(c) < hw + 3;
        });
        if (crossed) continue;
        // The street's height and slope across, over its middle half.
        const mid = [], slopes = [];
        for (let o = 0; o <= hw / 2 + 1e-9; o += 0.25) {
          mid.push(at(x + rx * o, z + rz * o));
          if (o) { mid.push(at(x - rx * o, z - rz * o)); slopes.push((at(x + rx * o, z + rz * o) - at(x - rx * o, z - rz * o)) / (2 * o)); }
        }
        const y = median(mid), g = slopes.length ? median(slopes) : 0;
        let worst = null;
        for (let o = hw / 2; o <= hw - 0.25 + 1e-9; o += 0.25) for (const side of [-1, 1]) {
          const d = at(x + rx * o * side, z + rz * o * side) - y - g * o * side;
          if (Math.abs(d) > drop && (!worst || Math.abs(d) > Math.abs(worst.d))) worst = { x: Math.round(x), z: Math.round(z), o: o * side, d: Math.round(d * 100) / 100, l };
        }
        if (worst) out.push(worst);
      }
      s -= L;
    }
  }
  return out;
}

// Where a carriageway drawn reaches past an edge the LiDAR saw, over a drop the measured street doesn't
// have (the task's test): at each station measured (`measured`, of the map's `lines`), on each side
// whose edge was seen, the street drawn there (`drawn`, { [id]: { pts, w } }, its line and width as
// the world has them) reaching more than 25 cm past the edge, and the ground there (`at`, the LiDAR's
// at 50 cm) more than `drop` off the street's own just inside the edge. Returns [{ x, z, o, d, l }]:
// where, the offset past the edge, how far off, and the street.
export function pastEdges(lines, measured, drawn, at, { drop = 1 } = {}) {
  const out = [];
  for (const l of lines) {
    const st = measured[l.id], m = drawn[l.id];
    if (!st || !m) continue;
    let i = 1, s0 = 0;
    for (const [s, a, b] of st) {
      while (i < l.pts.length - 1 && s0 + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]) < s) { s0 += Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]); i++; }
      const p = l.pts[i - 1], q = l.pts[i], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, tx = (q[0] - p[0]) / L, tz = (q[1] - p[1]) / L, rx = -tz, rz = tx;
      const x = p[0] + tx * (s - s0), z = p[1] + tz * (s - s0);
      // The street drawn's line across here: the nearest crossing of the cross-section.
      let t = null;
      for (let k = 1; k < m.pts.length; k++) {
        const [px, pz] = m.pts[k - 1], [qx, qz] = m.pts[k], dx = qx - px, dz = qz - pz, det = dx * rz - rx * dz;
        if (Math.abs(det) < 1e-9) continue;
        const u = (rx * (pz - z) - rz * (px - x)) / det, c = (dx * (pz - z) - dz * (px - x)) / det;
        if (u >= -1e-9 && u <= 1 + 1e-9 && Math.abs(c) < 15 && (t === null || Math.abs(c) < Math.abs(t))) t = c;
      }
      if (t === null) continue;
      for (const [edge, side] of [[a, -1], [b, 1]]) {
        if (edge === null) continue;
        const reach = t + (side * m.w) / 2;
        if ((reach - edge) * side <= 0.25) continue;
        const y = median([0.5, 0.75, 1, 1.25, 1.5].map((d) => at(x + rx * (edge - side * d), z + rz * (edge - side * d))));
        let worst = 0;
        for (let o = edge + side * 0.25; (reach - o) * side >= 0.25 - 1e-9; o += side * 0.25) { const d = at(x + rx * o, z + rz * o) - y; if (Math.abs(d) > Math.abs(worst)) worst = d; }
        if (Math.abs(worst) > drop) out.push({ x: Math.round(x), z: Math.round(z), o: Math.round((reach - edge) * side * 100) / 100, d: Math.round(worst * 100) / 100, l });
      }
    }
  }
  return out;
}

// ---- The LiDAR across a street ----

// What measure needs from DGT's LiDAR over a box on the map: `section(x, z, tx, tz, span)`, the bins
// across a street at (x, z) (across's: the 50 cm terrain's height every BIN, its echo and what stands
// on it from the point cloud as cover.mjs boils it down, each the mean over ALONG), and `inPark(x, z)`,
// the map's car parks (fetched with the barriers, task 013). Reads the terrain and every tile of the
// point cloud under the box, and keeps them.
export async function sampler(box) {
  const [{ readCache }, { mapToTM, tilesOver }, { terrain }, { CELLS, lidarCells }] = await Promise.all([import('./geo.mjs'), import('./dgt.mjs'), import('./terrain.mjs'), import('./cover.mjs')]);
  const ground = await terrain(), cells = new Map(), S = 0.5;
  for (const key of tilesOver(box)) { const c = await lidarCells(key); if (c) cells.set(key, c); }
  const fits = new Map();
  const toTM = (x, z) => { const i = Math.floor(x / 500), j = Math.floor(z / 500), k = i + ',' + j; let f = fits.get(k); if (!f) fits.set(k, (f = mapToTM({ x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 }))); return f(x, z); };
  const parks = new Inside(readCache('osm/barriers.json').elements.filter((e) => isCarPark(e.tags)).flatMap((e) => (e.type === 'way' ? [e.geometry.map(P)] : memberRings(e.members, 'outer'))).filter((r) => r.length > 3));
  const inPark = (x, z) => parks.has(x, z);
  const section = (x, z, tx, tz, span) => {
    const J = Math.round(span / BIN), n = 2 * J + 1, o = new Float64Array(n), h = new Float64Array(n), e = new Float64Array(n), park = new Uint8Array(n), hs = new Float64Array(ALONG.length);
    for (let j = 0; j < n; j++) {
      const off = (j - J) * BIN;
      park[j] = inPark(x - tz * off, z + tx * off) ? 1 : 0;
      let N = 0, I = 0, crown = 0, thing = 0;
      for (let q = 0; q < ALONG.length; q++) {
        const a = ALONG[q], px = x + tx * a - tz * off, pz = z + tz * a + tx * off, g = ground.at(px, pz);
        hs[q] = g;
        const [E, Nn] = toTM(px, pz), ke = Math.floor(E / 1000), kn = Math.floor(Nn / 1000), c = cells.get(ke + '_' + kn);
        if (!c) continue;
        const k = Math.floor(((kn + 1) * 1000 - Nn) / S) * CELLS + Math.floor((E - ke * 1000) / S), over = c.top[k] - g;
        N += c.ground[k]; I += c.int[k] * c.ground[k];
        // A tree's crown over it; something else standing on it, a car or a person.
        if (c.tree[k] >= 2 && over > 1.5) crown++;
        else if (over > 0.5 && over < 3) thing++;
      }
      hs.sort();
      o[j] = off;
      h[j] = N >= 2 ? hs[ALONG.length >> 1] : NaN;
      e[j] = N >= 3 && crown <= 1 && thing <= 1 ? I / N / 1000 : NaN;
    }
    return { o, h, e, park };
  };
  return { section, inPark, tiles: cells.size, ground };
}

// ---- On its own ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = Date.now();
  const [{ readCache }, { OPEN, OPEN_BOX }] = await Promise.all([import('./geo.mjs'), import('./sections.mjs')]);
  const B = OPEN_BOX, M = 60;
  const { section, inPark, tiles, ground } = await sampler({ x0: B.x0 - M, x1: B.x1 + M, z0: B.z0 - M, z1: B.z1 + M });
  console.log(`the point cloud's ${tiles} tiles under the area read (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  const ring = new Inside([OPEN]);
  // The map's own lines (never the moved ones, which onCarriageways makes from this file).
  const lines = streetsOf(readCache('osm/base.json'), (x, z, m) => x >= B.x0 - M - m && x <= B.x1 + M + m && z >= B.z0 - M - m && z <= B.z1 + M + m);
  const name = (l) => l.t.name ?? `(${l.t.highway})`;
  const args = process.argv.slice(2), check = args.indexOf('--check');
  if (check >= 0) {
    // Each place given as x,z or x,z,r.
    for (const at of args.slice(check + 1)) {
      const [cx, cz, r = 40] = at.split(',').map(Number);
      const near = (x, z, m = 0) => Math.abs(x - cx) <= r + m && Math.abs(z - cz) <= r + m;
      // The measuring 60 m round the picture, so the moves in it are as the whole run's.
      const measured = measure(lines, (x, z) => near(x, z, 60), section, inPark), moves = movesOf(lines, measured);
      console.log(`\n(${cx}, ${cz}):`);
      await picture({ x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r }, lines, measured, moves, path.join(CACHE, 'carriageways', `${Math.round(cx)}_${Math.round(cz)}.png`));
      for (const l of lines.filter((q) => measured[q.id] && q.pts.some(([x, z]) => near(x, z)))) {
        const st = measured[l.id], both = st.filter(([, a, b]) => a !== null && b !== null);
        const p = profile(st, l.pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - l.pts[i - 1][0], q[1] - l.pts[i - 1][1]) : 0), 0), l.w);
        console.log(`${l.id} ${name(l)}: the map's ${l.w.toFixed(1)} m; ${st.length} stations, ${both.length} both sides: the middle ${both.length ? median(both.map(([, a, b]) => (a + b) / 2)).toFixed(2) : '–'} m to its right, ${both.length ? median(both.map(([, a, b]) => b - a)).toFixed(2) : '–'} m wide; moves ${p.runs.map((q) => `${q.s0}–${q.s1} m`).join(', ') || 'nowhere'}${moves.widths[l.id] ? `, ${moves.widths[l.id]} m wide` : ''}`);
      }
    }
  } else {
    const measured = measure(lines, (x, z) => ring.has(x, z), section, inPark), moves = movesOf(lines, measured);
    const { runs, ...kept } = moves;
    fs.writeFileSync(FILE, JSON.stringify({ about: "Where each street's carriageway is, as DGT's 2025 LiDAR sees it, by tools/carriageways.mjs (task 026): informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0). © OpenStreetMap contributors (ODbL).", ways: measured, moves: kept }));
    report(lines, measured, moves, (x, z) => ring.has(x, z), name);
    // The overhangs, on the map's lines and on the moved ones.
    const moved = lines.map((l) => ({ ...l, ...moveLine(l.id, l.nodes, l.pts, kept), w: kept.widths[l.id] ?? l.w }));
    const before = overhangs(lines, ground.at, (x, z) => ring.has(x, z)), after = overhangs(moved, ground.at, (x, z) => ring.has(x, z));
    console.log(`carriageways over a drop of more than a metre: ${before.length} stations on the map's lines, ${after.length} on the moved ones${after.length ? `; the worst left: ${after.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 12).map((q) => `${name(q.l)} (${q.x}, ${q.z}) ${q.d} m at ${q.o.toFixed(2)}`).join(', ')}` : ''}`);
    const drawn = (list) => Object.fromEntries(list.map((l) => [l.id, l]));
    const pastBefore = pastEdges(lines, measured, drawn(lines), ground.at), pastAfter = pastEdges(lines, measured, drawn(moved), ground.at);
    console.log(`past an edge the LiDAR saw, over a drop of more than a metre: ${pastBefore.length} stations on the map's lines, ${pastAfter.length} on the moved ones${pastAfter.length ? `: ${pastAfter.slice(0, 20).map((q) => `${name(q.l)} (${q.x}, ${q.z}) ${q.o} m past, ${q.d} m`).join(', ')}` : ''}`);
    console.log(`in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(process.cwd(), FILE)}`);
  }
}

// What it measured over the area: how much of the streets' length, the middles' spread off the lines
// and the widths' against the map's, what moved, and the worst places, the viewpoints the task names
// among them.
function report(lines, measured, moves, inArea, name) {
  let length = 0, one = 0, two = 0;
  const offs = [], dw = [], streets = lines.filter((l) => l.k <= 8 && l.level === LEVEL.ground);
  for (const l of streets) {
    for (let i = 1; i < l.pts.length; i++) {
      const a = l.pts[i - 1], b = l.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = 1; d < L; d += STEP) if (inArea(a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L)) length += STEP;
    }
    for (const [, a, b] of measured[l.id] ?? []) {
      if (a === null || b === null) { one += STEP; continue; }
      two += STEP;
      offs.push(Math.abs((a + b) / 2));
      dw.push(b - a - l.w);
    }
  }
  const q = (v, f) => { const s = [...v].sort((p, r) => p - r); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
  console.log(`measured: ${(length / 1000).toFixed(1)} km of streets on the ground in the area, ${(two / 1000).toFixed(1)} km (${Math.round((100 * two) / length)}%) both edges seen, ${(one / 1000).toFixed(1)} km (${Math.round((100 * one) / length)}%) one`);
  console.log(`the middle off the line, where both edges were seen: half within ${q(offs, 0.5).toFixed(2)} m, 90% within ${q(offs, 0.9).toFixed(2)}, 99% within ${q(offs, 0.99).toFixed(2)}`);
  console.log(`the width less the map's: 10% ${q(dw, 0.1).toFixed(2)} m, 25% ${q(dw, 0.25).toFixed(2)}, half ${q(dw, 0.5).toFixed(2)}, 75% ${q(dw, 0.75).toFixed(2)}, 90% ${q(dw, 0.9).toFixed(2)}`);
  const ws = Object.entries(moves.widths).map(([id, w]) => w - lines.find((l) => l.id === +id).w);
  console.log(`widths measured clearly: ${ws.length} streets, ${ws.filter((d) => d < -0.5).length} more than half a metre narrower than the map's, ${ws.filter((d) => d > 0.5).length} wider`);
  const moved = moves.runs.reduce((s, r) => s + r.s1 - r.s0, 0), ds = Object.values(moves.nodes).map(([x, z]) => Math.hypot(x, z));
  console.log(`moved: ${moves.runs.length} stretches of ${new Set(moves.runs.map((r) => r.l.id)).size} streets, ${(moved / 1000).toFixed(1)} km; ${ds.length} nodes, ${ds.filter((d) => d > 1).length} by over a metre, the most ${Math.max(0, ...ds).toFixed(2)} m; ${Object.keys(moves.inserts).length} stretches with points put in`);
  // The worst: each stretch moved, by the most it's off.
  const at = (l, s) => { let d = s; for (let i = 1; i < l.pts.length; i++) { const a = l.pts[i - 1], b = l.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L || i === l.pts.length - 1) return [a[0] + ((b[0] - a[0]) * Math.min(1, d / L)), a[1] + ((b[1] - a[1]) * Math.min(1, d / L))]; d -= L; } return l.pts[0]; };
  const worst = moves.runs.map((r) => { let s = r.s0, v = r.at(r.s0); for (let q = r.s0; q <= r.s1; q += STEP) if (Math.abs(r.at(q)) > Math.abs(v)) { v = r.at(q); s = q; } return { r, s, v }; }).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  console.log('the furthest off:');
  for (const { r, s, v } of worst.slice(0, 15)) console.log(`  ${name(r.l)} (${at(r.l, s).map(Math.round)}): ${Math.abs(v).toFixed(2)} m to its ${v > 0 ? 'right' : 'left'}, over ${Math.round(r.s1 - r.s0)} m; ${moves.widths[r.l.id] ? `${moves.widths[r.l.id]} m wide, the map's ${r.l.w.toFixed(1)}` : `the map's width, ${r.l.w.toFixed(1)} m`}`);
  // The places the task names.
  const places = [['the Avenida João XXI', 586, 230], ['bom-jesus', 1262.6, 382.1], ['liberdade', 278, 832.7], ['viriato-amaral-nunes', 28.6, 1468.4], ['alameda-fujacal', -217.2, 906.1], ["the Liberdade's south end", 49, 304]];
  console.log('the places named:');
  for (const [what, x, z] of places) {
    const near = streets.map((l) => { let best = null; for (let i = 1; i < l.pts.length; i++) { const d = segDist([x, z], l.pts[i - 1], l.pts[i]); if (!best || d < best.d) best = { l, d }; } return best; }).filter((b) => b && b.d < 15).sort((a, b) => a.d - b.d).slice(0, 2);
    for (const { l, d } of near) {
      const st = measured[l.id] ?? [], both = st.filter(([, a, b]) => a !== null && b !== null), r = moves.runs.filter((q) => q.l === l);
      console.log(`  ${what}: ${name(l)} ${d.toFixed(1)} m off, the map's ${l.w.toFixed(1)} m; ${both.length} of its stations both sides, the middle ${both.length ? median(both.map(([, a, b]) => (a + b) / 2)).toFixed(2) : '–'} m to its right, ${both.length ? median(both.map(([, a, b]) => b - a)).toFixed(2) : '–'} wide; ${r.length ? `moves over ${r.map((q) => `${Math.round(q.s1 - q.s0)} m`).join(', ')}` : 'stays'}${moves.widths[l.id] ? `, ${moves.widths[l.id]} m wide` : ''}`);
    }
  }
}

// A picture of the orthophoto in `box`, 8 pixels a metre, and over it: each street's line as the map
// has it (red) and its carriageway's edges at the map's width (thin red); the edges measured at each
// station (cyan to the left, yellow to the right); and the line moved, with its edges (green).
async function picture(box, lines, measured, moves, file) {
  const [{ ortho }, sharp] = await Promise.all([import('./dgt.mjs'), import('sharp')]);
  const px = 0.125, W = Math.round((box.x1 - box.x0) / px), H = Math.round((box.z1 - box.z0) / px), colour = await ortho(box), data = Buffer.alloc(W * H * 3);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const c = colour(box.x0 + (i + 0.5) * px, box.z0 + (j + 0.5) * px) ?? [128, 128, 128], k = (j * W + i) * 3;
    data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2];
  }
  const X = (x) => ((x - box.x0) / px).toFixed(1), Z = (z) => ((z - box.z0) / px).toFixed(1);
  const poly = (pts, attrs) => `<polyline points="${pts.map(([x, z]) => `${X(x)},${Z(z)}`).join(' ')}" fill="none" ${attrs}/>`;
  const sides = (pts, o) => { const n = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d]; }); return pts.map((p, i) => [p[0] + n[i][0] * o, p[1] + n[i][1] * o]); };
  const svg = [];
  for (const l of lines.filter((q) => q.k <= 8)) {
    svg.push(poly(l.pts, 'stroke="#ff3030" stroke-width="2"'), poly(sides(l.pts, -l.w / 2), 'stroke="#ff3030" stroke-width="1" stroke-dasharray="6 4"'), poly(sides(l.pts, l.w / 2), 'stroke="#ff3030" stroke-width="1" stroke-dasharray="6 4"'));
    // Its id, where its line is in the picture.
    const inBox = l.pts.filter(([x, z]) => x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1), mid = inBox[inBox.length >> 1];
    if (mid) svg.push(`<text x="${X(mid[0])}" y="${Z(mid[1])}" font-family="sans-serif" font-size="13" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${l.id}</text>`);
    let s = 0, i = 1;
    for (const [at, a, b] of measured[l.id] ?? []) {
      while (i < l.pts.length - 1 && s + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]) < at) { s += Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]); i++; }
      const p = l.pts[i - 1], q = l.pts[i], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, tx = (q[0] - p[0]) / L, tz = (q[1] - p[1]) / L, x = p[0] + tx * (at - s), z = p[1] + tz * (at - s);
      for (const [o, c] of [[a, '#30e0ff'], [b, '#ffe030']]) if (o !== null) svg.push(`<circle cx="${X(x - tz * o)}" cy="${Z(z + tx * o)}" r="2.5" fill="${c}"/>`);
      if (a !== null && b !== null) svg.push(`<circle cx="${X(x - (tz * (a + b)) / 2)}" cy="${Z(z + (tx * (a + b)) / 2)}" r="1.5" fill="#fff"/>`);
    }
    const m = moveLine(l.id, l.nodes, l.pts, moves), w = moves.widths[l.id] ?? l.w;
    if (m.pts.some((p, k) => p !== l.pts[k]) || moves.widths[l.id]) svg.push(poly(m.pts, 'stroke="#30ff60" stroke-width="2"'), poly(sides(m.pts, -w / 2), 'stroke="#30ff60" stroke-width="1"'), poly(sides(m.pts, w / 2), 'stroke="#30ff60" stroke-width="1"'));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp.default(data, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.join('')}</svg>`) }]).png().toFile(file);
  console.log(file);
}
