// Every street on its real carriageway (task 026): what a cross-section of DGT's LiDAR says of a
// carriageway (carriageways.mjs's across), on made-up cross-sections; the moves (movesOf), on made-up
// streets: onto the middle measured, a junction once for every street through it, a deck's end not at
// all; and where the open world's streets were measured (.cache/carriageways.json, with the LiDAR),
// every street measured off its line drawn on its middle at its width, and no carriageway drawn past an
// edge the LiDAR saw, over a drop the street doesn't have.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { across, BIN, EASE, FILE, movesOf, OFF, overhangs, pastEdges, profile } from '../tools/carriageways.mjs';
import { CACHE, readCache } from '../tools/geo.mjs';
import { LEVEL, moveLine, onCarriageways, streetsOf } from '../tools/lines.mjs';
import { OPEN, OPEN_BOX } from '../tools/sections.mjs';
import { FILE as RINGS } from '../tools/roundabouts.mjs';
import { Inside } from '../tools/osm.mjs';

// The open world's streets where they were measured, for the tests at the end: read before any test is
// declared, as node's runner doesn't end a file that declares tests on both sides of a top-level await.
const measured = fs.existsSync(FILE) && fs.existsSync(path.join(CACHE, 'dgt', 'MDT-50cm')) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;
const skip = !measured && "the streets weren't measured (node tools/carriageways.mjs, with DGT's LiDAR)";
const B = OPEN_BOX, M = 60, inBox = (x, z, m) => x >= B.x0 - M - m && x <= B.x1 + M + m && z >= B.z0 - M - m && z <= B.z1 + M + m;
const lines = measured ? streetsOf(readCache('osm/base.json'), inBox) : [];
const moved = measured ? new Map(streetsOf(onCarriageways(readCache('osm/base.json')), inBox).map((l) => [l.id, l])) : new Map();
const ground = measured ? await (await import('../tools/terrain.mjs')).terrain() : null;
// The roundabouts' rings that roundabouts.mjs moved (task 014): each at the width it measured round it,
// laid over this file's, and checked in test/roundabouts.test.js.
const rings = new Set(fs.existsSync(RINGS) ? JSON.parse(fs.readFileSync(RINGS, 'utf8')).rings.filter((r) => r.moved).flatMap((r) => r.ways) : []);

// ---- Made-up cross-sections ----

// Bins every BIN from -10 to 10 m, the ground's height and echo as h(o) and e(o) give them; `park`
// where a car park is.
const section = (h, e, park = () => false) => {
  const o = [];
  for (let v = -10; v <= 10 + 1e-9; v += BIN) o.push(Math.round(v * 100) / 100);
  return { o: Float64Array.from(o), h: Float64Array.from(o.map(h)), e: Float64Array.from(o.map(e)), park: Uint8Array.from(o.map((v) => (park(v) ? 1 : 0))) };
};
const near = (got, want, tol = BIN) => got !== null && Math.abs(got - want) <= tol;

test('a kerb either side: the carriageway between them', () => {
  // Asphalt from -3 to 3.5, a pavement 15 cm up either side.
  const r = across(section((o) => (o < -3 || o > 3.5 ? 100.15 : 100), (o) => (o < -3 || o > 3.5 ? 12 : 5)));
  assert.ok(near(r.a, -3) && near(r.b, 3.5), `${r.a} … ${r.b}`);
  // The same with the kerbs dropped (a crossing's), the pavement told by its echo alone.
  const flush = across(section(() => 100, (o) => (o < -3 || o > 3.5 ? 12 : 5)));
  assert.ok(near(flush.a, -3) && near(flush.b, 3.5), `${flush.a} … ${flush.b}`);
});

test('a drop: the edge where the ground falls away (the Avenida João XXI at (586, 230))', () => {
  // The street's line 1.5 m from its left edge, a wall 5 m down to the road below.
  const r = across(section((o) => (o < -1.5 ? 95 : 100), (o) => (o > 2 ? 12 : 5)));
  assert.ok(near(r.a, -1.5) && near(r.b, 2), `${r.a} … ${r.b}`);
});

test('a painted line is road; a bank begins at its foot', () => {
  // A centre line 30 cm wide that echoes as a pavement, and a bank rising 40% from 3 m out.
  const r = across(section((o) => 100 + Math.max(0, o - 3) * 0.4, (o) => (o < -3 ? 12 : Math.abs(o - 0.4) < 0.2 ? 15 : 5)));
  assert.ok(near(r.a, -3) && near(r.b, 3), `${r.a} … ${r.b}`);
});

test('no edge where it can\'t be seen: a car on it, the road running on, a car park', () => {
  // Cars along the right kerb, 2 m wide: nothing measured under them, so that edge isn't seen.
  const car = across(section((o) => (o > 2.5 && o < 4.5 ? NaN : o > 4.5 ? 100.15 : 100), (o) => (o > 2.5 && o < 4.5 ? NaN : o > 4.5 ? 12 : 5)));
  assert.equal(car.b, null, 'the right, behind a car');
  // Setts from house to house: nothing changes as far as it looks.
  const setts = across(section(() => 100, () => 7), { road: 9 });
  assert.deepEqual([setts.a, setts.b], [null, null]);
  // A car park beside the street at its level: the band stops where the map's car park begins.
  const park = across(section(() => 100, (o) => (o < -3 ? 12 : 5), (o) => o >= 3));
  assert.ok(near(park.a, -3) && near(park.b, 3), `${park.a} … ${park.b}`);
});

test("a street's middle along it: moved where it's OFF or more off for HOLD, its width where it's clear", () => {
  // Stations every 2 m on 100 m: the middle 1 m to the right from 20 to 80 m, on the line elsewhere;
  // 7 m wide throughout, but a car hiding the left edge at every third.
  const st = [];
  for (let s = 0; s <= 100; s += 2) { const m = s >= 20 && s <= 80 ? 1 : 0; st.push([s, s % 6 ? m - 3.5 : null, m + 3.5]); }
  const p = profile(st, 100, 6.5);
  assert.equal(p.width, 7);
  assert.equal(p.runs.length, 1);
  // From the line onto the middle, and back, with no step: the run takes in where it turns to it.
  const [r] = p.runs;
  assert.ok(r.s0 <= 20 && r.s1 >= 80 && Math.abs(r.at(50) - 1) < 0.05 && Math.abs(r.at(r.s0)) < 0.1 && Math.abs(r.at(r.s1)) < 0.1, `${r.s0}–${r.s1} m, ${r.at(50)} at 50`);
  // Off by less than OFF, or for less than HOLD: it stays.
  const by = (f) => Array.from({ length: 51 }, (_, k) => [k * 2, f(k * 2) - 3.5, f(k * 2) + 3.5]);
  assert.equal(profile(by(() => OFF * 0.8), 100, 6.5).runs.length, 0, 'less than OFF');
  assert.equal(profile(by((q) => (q >= 40 && q <= 56 ? 1 : 0)), 100, 6.5).runs.length, 0, 'for less than HOLD');
});

// ---- Made-up streets ----

const way = (id, pts, nodes, level = LEVEL.ground, w = 6.5) => ({ id, k: 5, w, pts, nodes, t: { highway: 'residential' }, level });
const stations = (L, mid, w = 7) => Array.from({ length: Math.floor(L / 2) + 1 }, (_, k) => [k * 2, mid - w / 2, mid + w / 2]);
const close = (a, b, tol = 0.02) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;

test('a street moves onto its middle measured, at its width', () => {
  // East along z = 0: its right is south, +z.
  const l = way(1, [[0, 0], [100, 0]], [11, 12]), m = movesOf([l], { 1: stations(100, 1) });
  assert.ok(close(m.nodes[11], [0, 1]) && close(m.nodes[12], [0, 1]), JSON.stringify(m.nodes));
  assert.equal(m.widths[1], 7);
});

test('a junction moves once, to where its streets\' middles meet', () => {
  // A street east along z = 0 through node 22 at x = 50, its middle 1 m south; a side street off it
  // north from there, measured on its line.
  const a = way(1, [[0, 0], [50, 0], [100, 0]], [21, 22, 23]), b = way(2, [[50, 0], [50, -60]], [22, 24]);
  const m = movesOf([a, b], { 1: stations(100, 1), 2: stations(60, 0) });
  assert.ok(close(m.nodes[22], [0, 1]), `the junction ${m.nodes[22]}`);
  assert.equal(m.nodes[24], undefined, "the side street's other end stays");
  // Every way through the junction takes the same point there.
  const got = [a, b].map((l) => moveLine(l.id, l.nodes, l.pts, m)), at22 = got.flatMap((g) => g.pts.filter((_, i) => g.nodes[i] === 22));
  assert.ok(at22.length === 2 && close(at22[0], at22[1], 1e-9), JSON.stringify(at22));
});

test("a deck's end doesn't move, and the street on the ground eases out before it", () => {
  const ground = way(1, [[0, 0], [100, 0]], [31, 32]), deck = way(2, [[100, 0], [150, 0]], [32, 33], LEVEL.bridge);
  const m = movesOf([ground, deck], { 1: stations(100, 1) });
  assert.equal(m.nodes[32], undefined, "the deck's end");
  assert.equal(m.nodes[33], undefined, 'the deck');
  assert.ok(close(m.nodes[31], [0, 1]), 'the other end');
  // Points put in between, on the middle up to EASE before the end, then easing to the line.
  const { pts } = moveLine(1, ground.nodes, ground.pts, m), at = (x) => { const k = pts.findIndex((p) => p[0] >= x); const [p, q] = [pts[k - 1], pts[k]]; return p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0]); };
  assert.ok(pts.length > 2, 'points put in');
  assert.ok(Math.abs(at(100 - EASE - 5) - 1) < 0.1 && Math.abs(at(99) ) < 0.05, `${at(100 - EASE - 5)} before the ease, ${at(99)} at the end`);
});

// ---- The open world's streets, where they were measured ----


// The offset of a moved line from the map's at s along the map's (its normal there), and the map's
// point there.
const offsetAt = (l, m, s) => {
  let i = 1, s0 = 0;
  while (i < l.pts.length - 1 && s0 + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]) < s) { s0 += Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]); i++; }
  const p = l.pts[i - 1], q = l.pts[i], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, tx = (q[0] - p[0]) / L, tz = (q[1] - p[1]) / L, x = p[0] + tx * (s - s0), z = p[1] + tz * (s - s0);
  let t = null;
  for (let k = 1; k < m.pts.length; k++) {
    const [px, pz] = m.pts[k - 1], [qx, qz] = m.pts[k], dx = qx - px, dz = qz - pz, det = dx * tx + tz * dz;
    if (Math.abs(det) < 1e-9) continue;
    const u = (-tz * (pz - z) - tx * (px - x)) / det, c = (dx * (pz - z) - dz * (px - x)) / det;
    if (u >= -1e-9 && u <= 1 + 1e-9 && Math.abs(c) < 15 && (t === null || Math.abs(c) < Math.abs(t))) t = c;
  }
  return { t, x, z };
};

test('every street measured off its line for HOLD or more is drawn on its middle, at its width', { skip }, () => {
  // Where a street's middle is measured OFF or more off its line for HOLD or more, the moved line is
  // within BIN of it (the quarter metre the edges are measured to), but within EASE of a junction
  // (where it eases to the junction's move) and of the stretch's ends, and within the street's width of
  // a corner sharper than 45° (where its offset square to one side isn't its move); and its width is
  // the one measured, where that's clear (but where it runs on into a deck, the deck's, the map's).
  const junction = new Map();
  for (const l of lines) l.nodes?.forEach((n) => junction.set(n, (junction.get(n) ?? 0) + 1));
  let n = 0;
  const off = [], wide = [];
  for (const l of lines) {
    const st = measured.ways[l.id], m = moved.get(l.id);
    if (!st || !m || rings.has(l.id)) continue;
    const s = [0];
    for (let i = 1; i < l.pts.length; i++) s.push(s[i - 1] + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]));
    const p = profile(st, s.at(-1), l.w), ends = l.nodes.map((q, i) => (junction.get(q) > 1 || i === 0 || i === l.nodes.length - 1 ? s[i] : null)).filter((v) => v !== null);
    const corners = l.pts.slice(1, -1).flatMap((b, k) => { const a = l.pts[k], c = l.pts[k + 2], u = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]); return u && ((b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])) / u < Math.SQRT1_2 ? [s[k + 1]] : []; });
    const way = (m, k) => { const q = m.pts[k === 0 ? 1 : k - 1], d = Math.hypot(q[0] - m.pts[k][0], q[1] - m.pts[k][1]) || 1; return [(q[0] - m.pts[k][0]) / d, (q[1] - m.pts[k][1]) / d]; };
    const deck = [0, l.pts.length - 1].some((i) => lines.some((o) => o.level === LEVEL.bridge && [0, o.pts.length - 1].some((k) => o.nodes?.[k] === l.nodes[i] && way(l, i)[0] * way(o, k)[0] + way(l, i)[1] * way(o, k)[1] < -0.87)));
    const want = p.width && !deck ? p.width : l.w;
    if (Math.abs(m.w - want) > 0.01) wide.push(`${l.id} ${m.w} for ${want}`);
    for (const r of p.runs) for (let q = r.s0 + EASE / 2; q <= r.s1 - EASE / 2; q += 2) {
      if (ends.some((e) => Math.abs(e - q) < EASE) || corners.some((c) => Math.abs(c - q) < Math.max(5, l.w))) continue;
      const got = offsetAt(l, m, q);
      n++;
      if (got.t === null || Math.abs(got.t - r.at(q)) > BIN) off.push(`${l.t.name ?? l.id} (${got.x.toFixed(0)}, ${got.z.toFixed(0)}) ${got.t?.toFixed(2)} for ${r.at(q).toFixed(2)}`);
    }
  }
  console.log(`${n} points of the stretches measured off their lines: ${n - off.length} drawn on their middles`);
  assert.ok(n > 1000, `${n} points`);
  assert.equal(off.length, 0, `drawn off the middle measured: ${off.slice(0, 20).join('; ')}`);
  assert.equal(wide.length, 0, `drawn at another width than the one measured: ${wide.slice(0, 20).join('; ')}`);
});

test("a carriageway is drawn past an edge the LiDAR saw, over a drop the street doesn't have, a fifth as often as the map's lines", { skip }, () => {
  // At every station where an edge was seen, the street drawn there reaching more than 25 cm past it,
  // and the ground there more than a metre off the street's: a drop, a wall or a bank the measured
  // street doesn't have. The moves keep off those seen by two stations or more, but within a junction's
  // or a deck's end's EASE, where the street meets the others as their moves meet or the deck stays,
  // or where the street turns faster than it may: not yet nowhere, as the task asks (its notes say where).
  const ring = new Inside([OPEN]), mine = lines.filter((l) => l.pts.some(([x, z]) => ring.has(x, z)));
  const past = pastEdges(mine, measured.ways, Object.fromEntries(moved), ground.at), before = pastEdges(mine, measured.ways, Object.fromEntries(lines.map((l) => [l.id, l])), ground.at);
  console.log(`past an edge the LiDAR saw, over a drop of more than a metre: ${before.length} stations on the map's lines, ${past.length} as drawn: ${past.map((q) => `${q.l.t.name ?? q.l.id} (${q.x}, ${q.z})`).join(', ')}`);
  assert.ok(before.length > 200, `${before.length} on the map's lines`);
  assert.ok(past.length * 5 <= before.length, `${past.length} as drawn`);
});

test('at the Avenida João XXI (586, 230) the carriageway drawn no longer overhangs the drop', { skip }, () => {
  // The slip road there (way 19992781), its line 1.5 m from its left edge, a wall 5 m down to the
  // avenue below (task 009): over 25 m either way.
  const here = (x, z) => Math.hypot(x - 586, z - 230) < 25, slip = (list) => list.filter((l) => l.id === 19992781);
  const was = overhangs(slip(lines), ground.at, here), now = overhangs(slip([...moved.values()]), ground.at, here);
  assert.ok(was.length > 0, "the map's line overhangs it");
  assert.equal(now.length, 0, now.map((q) => `${q.l.t.name ?? q.l.id} (${q.x}, ${q.z}) ${q.d} m at ${q.o}`).join('; '));
});
