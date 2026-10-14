// Every street as surfaces (task 033): on made-up streets, the corners a kerb rounds, a roundabout's
// island, a reservation, the pavements where a street is built up and the crossings; and in the open
// world's tiles as the games read them, every street there with its carriageway at its real width,
// nothing lying on anything else at its level, and the Volta dos Amigos on them.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ClipperLib from 'clipper-lib';
import { loadWorld } from '../index.js';
import amigos from '../tracks/amigos.js';
import { streetSurfaces } from '../tools/streets.mjs';
import { OPEN_BOX } from '../tools/sections.mjs';

const C = ClipperLib;
const NZ = C.PolyFillType.pftNonZero;
const path = (r) => r.map(([x, z]) => ({ X: Math.round(x * 100), Y: Math.round(z * 100) }));
// A piece's rings for Clipper, its outline one way round and its holes the other, whichever way
// they're drawn.
const turned = (p) => p.rings.map((r, i) => { const q = path(r); return C.Clipper.Orientation(q) === !i ? q : q.reverse(); });
const areaOf = (rings) => rings.reduce((s, r) => s + C.Clipper.Area(path(r)), 0) / 1e4;
const net = (pieces) => pieces.reduce((s, p) => s + Math.abs(areaOf([p.rings[0]])) - p.rings.slice(1).reduce((t, h) => t + Math.abs(areaOf([h])), 0), 0);
// Whether (x, z) is in any of some pieces (their outlines less their holes), quickly for many points.
function inside(pieces) {
  const rows = new Map();
  for (const p of pieces) for (const r of p.rings) for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length];
    if (a[1] === b[1]) continue;
    for (let k = Math.floor(Math.min(a[1], b[1]) / 4); k <= Math.floor(Math.max(a[1], b[1]) / 4); k++) {
      if (!rows.has(k)) rows.set(k, []);
      rows.get(k).push(a, b);
    }
  }
  return (x, z) => {
    let odd = false;
    const row = rows.get(Math.floor(z / 4)) ?? [];
    for (let i = 0; i < row.length; i += 2) {
      const [ax, az] = row[i], [bx, bz] = row[i + 1];
      if (az <= z === bz <= z) continue;
      if (ax + ((z - az) / (bz - az)) * (bx - ax) > x) odd = !odd;
    }
    return odd;
  };
}
const segDist = ([x, z], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * f, z - az - dz * f); };
const way = (id, k, w, pts, nodes, t = {}) => ({ id, k, w, pts, nodes, t: { highway: 'residential', ...t }, level: 0 });
const box = { x0: -60, x1: 160, z0: -60, z1: 110 };
const cut = (r) => r.cuts.get('box');

test('a T junction: its corners rounded as a kerb turns, pavements where it is built up, a zebra', () => {
  // A street east-west, 6 m wide, and one off it to the south; houses along the south side only.
  const lines = [way(1, 5, 6, [[0, 0], [50, 0]], [1, 2]), way(2, 5, 6, [[50, 0], [100, 0]], [2, 3]), way(3, 5, 6, [[50, 0], [50, 50]], [2, 4])];
  const houses = [[[5, 6], [40, 6], [40, 20], [5, 20]], [[60, 6], [95, 6], [95, 20], [60, 20]]];
  const r = streetSurfaces({ lines, box, buildings: houses, nodes: [{ type: 'node', id: 99, tags: { highway: 'crossing', crossing: 'zebra' } }] });
  const got = cut(r);
  // The carriageway: two bands of 6 m, each of the three dead ends half a circle, and the corners,
  // each r²(1 − π/4) for a residential street's 5 m.
  const bands = 100 * 6 + 47 * 6 + 3 * (Math.PI * 9) / 2;
  assert.ok(Math.abs(net(got.carriageways) - bands - 2 * 25 * (1 - Math.PI / 4)) < 1.5, `${net(got.carriageways).toFixed(1)} m² of carriageway`);
  // Pavements along the south side, where the houses are, and none along the open north side.
  const pave = inside(got.pavements.filter((p) => p.kind === 'pavement'));
  assert.ok(pave(20, 4) && pave(80, 4), 'a pavement in front of the houses');
  assert.ok(!pave(20, -4) && !pave(80, -4), 'no pavement out in the open');
  assert.ok(!pave(20, 7), 'the pavement stops at the wall');
  const onKerb = ([x, z]) => got.kerbs.some((k) => k.h === 0.15 && k.pts.some((p, i) => i && segDist([x, z], k.pts[i - 1], p) < 0.05));
  assert.ok(onKerb([20, 3]) && onKerb([80, 3]), 'a kerb along the south side');
  assert.ok(!onKerb([20, -3]), 'and none along the north side');
  assert.equal(got.markings.filter((m) => m.kind === 'zebra').length, 0, 'no crossing on the map, no zebra');

  // The same with a crossing on the east arm: a zebra across it, and the kerbs dropped either side.
  lines[1] = way(2, 5, 6, [[50, 0], [75, 0], [100, 0]], [2, 99, 3]);
  const z = cut(streetSurfaces({ lines, box, buildings: houses, nodes: [{ type: 'node', id: 99, tags: { highway: 'crossing', crossing: 'zebra' } }] }));
  const zebra = z.markings.find((m) => m.kind === 'zebra');
  assert.ok(zebra && Math.abs(zebra.pts[0][0] - 75) < 0.1 && Math.abs(zebra.pts[1][0] - 75) < 0.1, 'a zebra across the street at the crossing');
  assert.ok(z.kerbs.some((k) => k.h === 0 && k.pts.some(([x]) => Math.abs(x - 75) < 3)), 'the kerb dropped at the crossing');
});

test("a roundabout keeps its island, kerbed, and its arms stop at the ring", () => {
  // A ring 22 m across at its centre line, 8 m wide, and four arms.
  const n = 32, ring = Array.from({ length: n + 1 }, (_, i) => [50 + 11 * Math.cos((2 * Math.PI * i) / n), 25 + 11 * Math.sin((2 * Math.PI * i) / n)]);
  const ids = Array.from({ length: n + 1 }, (_, i) => 100 + (i % n));
  const lines = [way(1, 4, 8, ring, ids, { highway: 'tertiary', junction: 'roundabout' })];
  [0, 8, 16, 24].forEach((i, k) => { const [x, z] = ring[i], dx = x - 50, dz = z - 25; lines.push(way(2 + k, 4, 7, [[x, z], [x + dx * 4, z + dz * 4]], [ids[i], 200 + k], { highway: 'tertiary' })); });
  const got = cut(streetSurfaces({ lines, box: { x0: -40, x1: 140, z0: -70, z1: 120 } }));
  const island = got.pavements.filter((p) => p.kind === 'island');
  assert.equal(island.length, 1, 'one island');
  // Its radius is the ring's less half its width: 7 m, within the circle's facets.
  const a = net(island);
  assert.ok(Math.abs(a - Math.PI * 49) < 6, `the island ${a.toFixed(1)} m², a circle of 7 m is ${(Math.PI * 49).toFixed(1)}`);
  assert.ok(got.kerbs.some((k) => k.pts.every(([x, z]) => Math.abs(Math.hypot(x - 50, z - 25) - 7) < 0.2)), 'a kerb round the island');
});

test('a reservation between a road\'s two carriageways, the way each goes', () => {
  // Two one-way carriageways of 7 m, 12 m apart at their centre lines: a reservation of 5 m between.
  const lines = [way(1, 3, 7, [[0, 0], [150, 0]], [1, 2], { highway: 'secondary', oneway: 'yes' }), way(2, 3, 7, [[150, 12], [0, 12]], [3, 4], { highway: 'secondary', oneway: 'yes' })];
  const got = cut(streetSurfaces({ lines, box }));
  const res = got.pavements.filter((p) => p.kind === 'reservation'), on = inside(res);
  assert.ok(res.length && on(75, 6) && !on(75, 2) && !on(75, 10), 'a reservation between them, and not on either');
  assert.ok(net(res) > 4.5 * 100, `${net(res).toFixed(0)} m² of reservation`);
});

// ---- In the open world's tiles ----

const w = await loadWorld(OPEN_BOX);
const S = w.streets;
const inOpen = ([x, z]) => x > OPEN_BOX.x0 + 5 && x < OPEN_BOX.x1 - 5 && z > OPEN_BOX.z0 + 5 && z < OPEN_BOX.z1 - 5;

test("every ring is closed and simple, and off the ground has its heights", () => {
  for (const p of [...S.carriageways, ...S.pavements]) {
    for (const [i, r] of p.rings.entries()) {
      assert.ok(r.length >= 3, 'a ring of three points or more');
      const simple = C.Clipper.SimplifyPolygon(path(r), NZ), a = Math.abs(C.Clipper.Area(path(r))), b = simple.reduce((s, q) => s + Math.abs(C.Clipper.Area(q)), 0);
      assert.ok(Math.abs(a - b) <= Math.max(1e4, a * 0.01), `a ring at ${r[0]} crosses itself: ${a / 1e4} m², ${b / 1e4} as it should be`);
      if (p.level !== 'ground') assert.equal(p.ys?.[i]?.length, r.length, 'a height at each point off the ground');
    }
  }
  for (const l of [...S.kerbs, ...S.markings]) if (l.level !== 'ground') assert.equal(l.ys?.length, l.pts.length);
});

test('nothing lies on anything else at its level: carriageways, pavements', () => {
  // Within each tile and level, the carriageways' areas add up to their union's, and the pavements
  // cover no carriageway: each pavement shrunk by 10 cm first, as two pieces rounded to 10 cm on
  // their own may cross a little along a long kerb.
  for (const id of w.tiles) {
    const [, i, j] = id.match(/x(-?\d+)z(-?\d+)/).map(Number), tb = { x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 };
    const mine = (p) => p.rings[0].every(([x, z]) => x >= tb.x0 - 0.01 && x <= tb.x1 + 0.01 && z >= tb.z0 - 0.01 && z <= tb.z1 + 0.01);
    for (const level of ['ground', 'bridge', 'tunnel']) {
      const cw = S.carriageways.filter((p) => p.level === level && mine(p)), pv = S.pavements.filter((p) => p.level === level && mine(p));
      if (!cw.length) continue;
      const paths = (list) => list.flatMap(turned);
      const c = new C.Clipper(), u = [];
      c.AddPaths(paths(cw), C.PolyType.ptSubject, true);
      c.Execute(C.ClipType.ctUnion, u, NZ, NZ);
      if (level === 'ground') {
        // Each piece shrunk by 10 cm, as for the pavements below.
        const each = cw.map((p) => { const o = new C.ClipperOffset(), sh = []; o.AddPaths(turned(p), C.JoinType.jtMiter, C.EndType.etClosedPolygon); o.Execute(sh, -10); return sh; });
        const sum = each.reduce((t, sh) => t + sh.reduce((a, q) => a + C.Clipper.Area(q), 0), 0) / 1e4, k = new C.Clipper(), all = [];
        k.AddPaths(each.flat(), C.PolyType.ptSubject, true);
        k.Execute(C.ClipType.ctUnion, all, NZ, NZ);
        const whole = all.reduce((t, q) => t + C.Clipper.Area(q), 0) / 1e4;
        assert.ok(Math.abs(sum - whole) < 1, `${id}: ${sum.toFixed(1)} m² of carriageway pieces, ${whole.toFixed(1)} m² together`);
      }
      const d = new C.Clipper(), both = [];
      const o = new C.ClipperOffset(), shrunk = [];
      o.AddPaths(paths(pv), C.JoinType.jtMiter, C.EndType.etClosedPolygon);
      o.Execute(shrunk, -10);
      d.AddPaths(shrunk, C.PolyType.ptSubject, true);
      d.AddPaths(u, C.PolyType.ptClip, true);
      d.Execute(C.ClipType.ctIntersection, both, NZ, NZ);
      const over = both.reduce((s, q) => s + Math.abs(C.Clipper.Area(q)), 0) / 1e4;
      assert.ok(over < 1, `${id} ${level}: ${over.toFixed(2)} m² of pavement on a carriageway`);
    }
  }
});

test('every street in the area has its carriageway, at its real width', () => {
  // The tiles' lines are thinned to within 0.8 m of the map's, so the width is measured across each
  // carriageway at its line, out to where it ends either side, on the straight stretches of streets
  // up to residential, away from their ends; and its median over all of them is the map's width.
  const on = { ground: inside(S.carriageways.filter((p) => p.level === 'ground')), bridge: inside(S.carriageways.filter((p) => p.level === 'bridge')), tunnel: inside(S.carriageways.filter((p) => p.level === 'tunnel')) };
  let mid = 0, midOk = 0;
  const missed = [], ratios = [];
  for (const l of w.lines.filter((q) => q.kind <= 8)) {
    const test = on[l.level === 'under' ? 'ground' : l.level];
    for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], L = Math.hypot(bx - ax, bz - az);
      if (L < 2) continue;
      const tx = (bx - ax) / L, tz = (bz - az) / L;
      // Every 10 m along it, the middle; and on streets up to residential, away from the ends, both
      // sides 25 cm in from the kerb.
      for (let d = 1; d < L; d += 10) {
        const x = ax + tx * d, z = az + tz * d;
        if (!inOpen([x, z])) continue;
        mid++;
        if (test(x, z)) midOk++;
        else missed.push(`${l.kind} at (${x.toFixed(0)}, ${z.toFixed(0)})`);
        if (l.kind > 5 || l.level !== 'ground' || d < l.w + 5 || L - d < l.w + 5 || !test(x, z)) continue;
        const reach = (s) => { let o = 0; while (o < l.w + 3 && test(x - tz * s * o, z + tx * s * o)) o += 0.1; return o; };
        const across = reach(1) + reach(-1);
        if (across < l.w + 2.5) ratios.push(across / l.w);
      }
    }
  }
  ratios.sort((a, b) => a - b);
  const q = (f) => ratios[Math.floor(f * (ratios.length - 1))].toFixed(3);
  console.log(`the middle of the streets on a carriageway: ${midOk} of ${mid} (missed ${missed.slice(0, 4).join(', ')}); measured width ÷ the map's, ${ratios.length} places: median ${q(0.5)}, 10% ${q(0.1)}, 90% ${q(0.9)}`);
  assert.ok(midOk / mid > 0.995, `${mid - midOk} of ${mid} points in the middle of a street have no carriageway`);
  assert.ok(Math.abs(q(0.5) - 1) < 0.03, `the carriageways are ${q(0.5)} of the map's widths`);
  assert.ok(q(0.1) > 0.85, `one in ten carriageways is under ${q(0.1)} of its width`);
});

test("the Volta dos Amigos's streets are all there", () => {
  // Every point of the track within 4 m of a carriageway (track.mjs thins its line to within 3 m of
  // the map's, which task 037 puts on the carriageway's middle), but on the link the loop takes out
  // of a dead end (decision 010), which isn't a street: one run of points, under 100 m.
  const levels = ['ground', 'bridge', 'tunnel'].map((l) => inside(S.carriageways.filter((p) => p.level === l))), any = (x, z) => levels.some((f) => f(x, z));
  const near = ([x, z]) => any(x, z) || [1, 2, 3, 4].some((r) => Array.from({ length: 24 }, (_, k) => (k * Math.PI) / 12).some((a) => any(x + r * Math.cos(a), z + r * Math.sin(a))));
  const pts = amigos.points.map((p, i) => ({ i, p: [p.p[0], p.p[2]] })).filter(({ p }) => inOpen(p)), off = pts.filter(({ p }) => !near(p));
  assert.ok(pts.length > 1000, `${pts.length} of the track's points in the area`);
  const runs = off.reduce((r, q) => (r.length && q.i - r.at(-1).at(-1).i <= 2 ? r.at(-1).push(q) : r.push([q]), r), []);
  assert.ok(runs.length <= 1 && (runs[0]?.length ?? 0) <= 12, `the track's points more than 4 m from a carriageway: ${runs.map((r) => `${r.length} from (${r[0].p})`).join(', ')}`);
});
