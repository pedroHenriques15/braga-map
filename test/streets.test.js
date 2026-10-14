// Every street as surfaces (task 033): on made-up streets, the corners a kerb rounds, a roundabout's
// island, a reservation, the pavements where a street is built up and the crossings; and in the open
// world's tiles as the games read them, every street inside its edge (task 032) with its carriageway
// at its real width, nothing lying on anything else at its level, and the Volta dos Amigos on them.
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

// The tiles under the box round the area, where the surfaces are made; the streets checked are those
// inside its edge.
const w = await loadWorld(OPEN_BOX);
const S = w.streets;
const inOpen = ([x, z]) => w.inOpen(x, z);

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

// Where a bridge or a tunnel meets the ground's streets (task 040): each end of a line off the
// ground that is a point of a line on it, with the way into the bridge or the tunnel, its height and
// its width; in the area.
const joins = (() => {
  const onGround = new Set(w.lines.filter((l) => l.level === 'ground' || l.level === 'under').flatMap((l) => l.pts.map(([x, z]) => x + ',' + z)));
  const out = [];
  for (const l of w.lines) {
    if ((l.level !== 'bridge' && l.level !== 'tunnel') || l.kind > 8 || l.pts.length < 2) continue;
    for (const [k, k2] of [[0, 1], [l.pts.length - 1, l.pts.length - 2]]) {
      const p = l.pts[k], q = l.pts[k2], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (!onGround.has(p[0] + ',' + p[1]) || !inOpen(p) || out.some((e) => e.p[0] === p[0] && e.p[1] === p[1])) continue;
      out.push({ level: l.level, p, u: [(q[0] - p[0]) / L, (q[1] - p[1]) / L], y: l.heights[k], w: l.w });
    }
  }
  return out;
})();
// Whether a piece's outline comes within a square r either side of an end.
const near = (e, r) => (q) => {
  const xs = q.rings[0].map((v) => v[0]), zs = q.rings[0].map((v) => v[1]);
  return Math.min(...xs) < e.p[0] + r && Math.max(...xs) > e.p[0] - r && Math.min(...zs) < e.p[1] + r && Math.max(...zs) > e.p[1] - r;
};

test("a deck meets the ground's streets at its ends to within 5 cm, and a tunnel's end is on the cutting's floor", () => {
  const decks = joins.filter((e) => e.level === 'bridge'), tunnels = joins.filter((e) => e.level === 'tunnel');
  assert.ok(decks.length >= 15 && tunnels.length >= 6, `${decks.length} decks' ends and ${tunnels.length} tunnels' meet the ground's streets in the area`);
  // A deck's heights at a point, its lines' whose width (and pavements) reach it: two where two
  // carriageways run side by side (the lines to the half metre and the decimetre, thinned to 0.8 m).
  const decksLines = w.lines.filter((l) => l.level === 'bridge' && l.kind <= 8);
  const lineYs = ([x, z]) => {
    const out = [];
    for (const l of decksLines) {
      let best = Infinity, y = 0;
      for (let i = 1; i < l.pts.length; i++) {
        const a = l.pts[i - 1], b = l.pts[i];
        if (Math.abs(a[0] - x) > 80 && Math.abs(b[0] - x) > 80) continue;
        const dx = b[0] - a[0], dz = b[1] - a[1], f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(a[0] + dx * f - x, a[1] + dz * f - z);
        if (d < best) { best = d; y = l.heights[i - 1] + (l.heights[i] - l.heights[i - 1]) * f; }
      }
      if (best < l.w / 2 + 2.5) out.push(y);
    }
    return out;
  };
  const offLine = (v, y) => Math.min(...lineYs(v).map((q) => Math.abs(y - q)));
  // On a deck at each end, every point of a carriageway or a pavement on the end's line (the lines'
  // points are to the half metre), and every point of its carriageway on the edge of the ground's:
  // within 5 cm of the ground, but where the ground there is half a metre or more off the deck (an
  // embankment's side, where the deck is wider than the street it meets), which it doesn't follow.
  const edges = S.carriageways.filter((p) => p.level === 'ground').flatMap((p) => p.rings.flatMap((r) => r.map((a, i) => [a, r[(i + 1) % r.length]])));
  const onEdge = (v) => edges.some(([a, b]) => Math.abs(a[0] - v[0]) < 30 && Math.abs(a[1] - v[1]) < 30 && segDist(v, a, b) < 0.15);
  let n = 0, worst = 0, steep = 0;
  const off = [];
  for (const e of decks) {
    for (const piece of [...S.carriageways, ...S.pavements].filter((q) => q.level === 'bridge' && near(e, e.w + 4)(q))) {
      piece.rings.forEach((r, i) => r.forEach((v, k) => {
        const d = [v[0] - e.p[0], v[1] - e.p[1]], along = d[0] * e.u[0] + d[1] * e.u[1];
        if (Math.hypot(...d) > e.w / 2 + 3 || !(along < 0.5 || ('surface' in piece && Math.hypot(...d) < e.w + 2 && onEdge(v)))) return;
        const dy = Math.abs(piece.ys[i][k] - w.height(...v));
        if (dy > 0.0501 && offLine(v, w.height(...v)) >= 0.4) { steep++; return; }
        n++;
        worst = Math.max(worst, dy);
        if (dy > 0.0501) off.push(`(${v}) ${dy.toFixed(2)}`);
      }));
    }
  }
  // And nowhere is a deck pulled to the ground under it: every point of a deck within 0.6 m of its
  // lines' height there (at its ends, the ground's across the end's line, half a metre at most).
  const pulled = [];
  for (const q of [...S.carriageways, ...S.pavements].filter((p) => p.level === 'bridge')) q.rings.forEach((r, i) => r.forEach((v, k) => { if (!(offLine(v, q.ys[i][k]) <= 0.6)) pulled.push(`(${v}) ${q.ys[i][k]} by lines at ${lineYs(v).map((y) => y.toFixed(1))}`); }));
  assert.deepEqual(pulled, [], 'points of a deck off its own height');
  // A tunnel's end: the lowest of the ground at it and out from it up to 4 m, as the tiles have it.
  const floor = tunnels.map((e) => Math.abs(e.y - Math.min(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => w.height(e.p[0] - e.u[0] * k * 0.5, e.p[1] - e.u[1] * k * 0.5)))));
  console.log(`${decks.length} decks' ends: ${n} points where they meet the ground, ${worst.toFixed(3)} m off at most, and ${steep} by ground half a metre or more off them; ${tunnels.length} tunnels' ends, ${Math.max(...floor).toFixed(2)} m off the cutting's floor at most`);
  assert.ok(n >= decks.length * 2, `${n} points at ${decks.length} decks' ends`);
  assert.deepEqual(off, [], 'points of a deck more than 5 cm off the ground where it meets it');
  assert.ok(Math.max(...floor) < 0.2, `a tunnel's end ${Math.max(...floor).toFixed(2)} m off the cutting's floor`);
});

test("no pavement on one level lies over the other's surfaces where the two are at one height", () => {
  // A pavement on the ground over a carriageway or a pavement off it, or a deck's pavement over the
  // ground's carriageway or pavement, where they're within 1 m of each other's height: where a deck
  // or a tunnel meets the ground, at its end. Each pavement shrunk by 10 cm first, as in the test
  // above; the height of a piece off the ground anywhere, its nearest edge's.
  const shrunk = (list) => { const o = new C.ClipperOffset(), out = []; o.AddPaths(list.flatMap(turned), C.JoinType.jtMiter, C.EndType.etClosedPolygon); o.Execute(out, -10); return out; };
  const yOn = (q) => (x, z) => {
    let best = Infinity, y = 0;
    q.rings.forEach((r, i) => r.forEach((a, k) => {
      const b = r[(k + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(a[0] + dx * f - x, a[1] + dz * f - z);
      if (d < best) { best = d; y = q.ys[i][k] + (q.ys[i][(k + 1) % r.length] - q.ys[i][k]) * f; }
    }));
    return y;
  };
  let onUp = 0, onGround = 0;
  const bad = [];
  for (const q of [...S.carriageways, ...S.pavements].filter((p) => p.level !== 'ground')) {
    const e = { p: [(Math.min(...q.rings[0].map((v) => v[0])) + Math.max(...q.rings[0].map((v) => v[0]))) / 2, (Math.min(...q.rings[0].map((v) => v[1])) + Math.max(...q.rings[0].map((v) => v[1]))) / 2] };
    const r = Math.max(...q.rings[0].map((v) => Math.max(Math.abs(v[0] - e.p[0]), Math.abs(v[1] - e.p[1])))) + 1, y = yOn(q);
    // The ground's pavements over it; and if it's a pavement, it over the ground's surfaces.
    const pairs = [[shrunk(S.pavements.filter((p) => p.level === 'ground' && near(e, r)(p))), turned(q), 'up']];
    if (!('surface' in q)) pairs.push([shrunk([q]), [...S.carriageways, ...S.pavements].filter((p) => p.level === 'ground' && near(e, r)(p)).flatMap(turned), 'ground']);
    for (const [a, b, which] of pairs) {
      if (!a.length || !b.length) continue;
      const c = new C.Clipper(), got = [];
      c.AddPaths(a, C.PolyType.ptSubject, true);
      c.AddPaths(b, C.PolyType.ptClip, true);
      c.Execute(C.ClipType.ctIntersection, got, NZ, NZ);
      for (const g of got) {
        const m = Math.abs(C.Clipper.Area(g)) / 1e4, cx = g.reduce((s, v) => s + v.X, 0) / g.length / 100, cz = g.reduce((s, v) => s + v.Y, 0) / g.length / 100;
        if (Math.abs(y(cx, cz) - w.height(cx, cz)) > 1) continue;
        if (which === 'up') onUp += m; else onGround += m;
        if (m > 0.5) bad.push(`${m.toFixed(1)} m² of ${which === 'up' ? `the ground's pavement over a ${q.level}'s ${q.surface ? 'carriageway' : 'pavement'}` : `a ${q.level}'s pavement over the ground's surfaces`} at (${cx.toFixed(0)}, ${cz.toFixed(0)})`);
      }
    }
  }
  console.log(`at one height: ${onUp.toFixed(1)} m² of the ground's pavements over a deck or a tunnel, ${onGround.toFixed(1)} m² of a deck's pavements over the ground's surfaces`);
  assert.deepEqual(bad, []);
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
