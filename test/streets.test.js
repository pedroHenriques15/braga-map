// Every street as surfaces (task 033): on made-up streets, the corners a kerb rounds, a roundabout's
// island, a reservation, the pavements where a street is built up and the crossings, and the walls
// they end at (task 052); and in the open world's tiles as the games read them, every street inside
// its edge (task 032) with its carriageway at its real width, nothing lying on anything else at its
// level, no pavement past a wall, and the Volta dos Amigos on them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import ClipperLib from 'clipper-lib';
import { loadWorld } from '../index.js';
import amigos from '../tracks/amigos.js';
import { CACHE, readCache } from '../tools/geo.mjs';
import { stopsAt, streetSurfaces } from '../tools/streets.mjs';
import { barriersOf } from '../tools/walls.mjs';
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

test('no sliver: a bend at a node, carriageways that touch; but a narrow median, and a gore, stay (task 048)', () => {
  const on = (got) => inside(got.carriageways);
  // A street that bends 9° where one way ends and the next begins: the outside of the bend is road.
  const bend = on(cut(streetSurfaces({ lines: [way(1, 5, 9, [[0, 0], [50, 0]], [1, 2]), way(2, 5, 9, [[50, 0], [100, 8]], [2, 3])], box })));
  assert.ok(bend(50.3, -4) && bend(49.7, -4), 'no wedge open outside the bend');
  // Round, too, where it runs on through a junction: the wedge outside its bend is its own, not the
  // street across it's (the Liberdade's promenade had a point of concrete in its setts at each
  // crossing); but its lines painted still run on to the junction, as they stop only where another
  // street's carriageway begins.
  const lanes = { highway: 'tertiary', lanes: '2' }, a1 = way(1, 4, 7, [[0, 0], [50, 0]], [1, 2], lanes), a2 = way(2, 4, 7, [[50, 0], [100, 8]], [2, 3], lanes);
  const across = cut(streetSurfaces({ lines: [a1, a2, way(3, 5, 6, [[50, -40], [50, 0]], [4, 2], { surface: 'sett' }), way(4, 5, 6, [[50, 0], [50, 40]], [2, 5], { surface: 'sett' })], box }));
  assert.ok(inside(across.carriageways.filter((p) => p.surface === 'asphalt'))(50.3, -3.4), "the wedge outside the road's bend is its asphalt");
  const tee = cut(streetSurfaces({ lines: [a1, { ...a2, pts: [[50, 0], [100, 2]] }, way(3, 5, 6, [[50, 0], [50, 40]], [2, 4])], box }));
  assert.ok(tee.markings.some((m) => m.kind === 'centre' && m.pts.some(([x, z]) => Math.hypot(x - 50, z) < 0.5)), 'the centre line runs on to the junction');
  // Two one-way carriageways of 7 m, joined at both ends, 0.1 m apart: they touch, and there's no
  // crack between them; 0.5 m apart, a median between them.
  const pair = (gap) => {
    const d = 7 + gap, t = { highway: 'secondary', oneway: 'yes' };
    return cut(streetSurfaces({ lines: [way(1, 3, 7, [[0, 0], [150, 0]], [1, 2], t), way(2, 3, 7, [[150, d], [0, d]], [3, 4], t), way(3, 5, 6, [[150, 0], [150, d]], [2, 3]), way(4, 5, 6, [[0, d], [0, 0]], [4, 1])], box }));
  };
  const touch = pair(0.1);
  assert.ok(on(touch)(75, 3.55) && on(touch)(100, 3.55), 'carriageway where they touch');
  assert.ok(!touch.pavements.some((p) => p.kind === 'island'), 'no island between them');
  const median = pair(0.5);
  assert.ok(!on(median)(75, 3.75) && inside(median.pavements)(75, 3.75), 'a median 0.5 m wide stays');
  // A slip road leaving a road at 5°: their carriageways part 63 m on, past the junction's corner.
  // Where the gore between them is under a metre wide it's road; where it's 2 m wide, it stays.
  const gore = streetSurfaces({ lines: [way(1, 3, 7, [[0, 0], [40, 0]], [1, 2], { highway: 'secondary' }), way(2, 3, 7, [[40, 0], [240, 0]], [2, 3], { highway: 'secondary' }), way(3, 4, 4, [[40, 0], [240, 17.5]], [2, 4], { highway: 'tertiary', oneway: 'yes' })], box: { x0: -20, x1: 260, z0: -30, z1: 40 } }).cuts.get('box');
  // The slip road's edge towards the road, 2 m from its line, as far along it as x is.
  const edge = (x) => (x - 40) * Math.tan((5 * Math.PI) / 180) - 2 / Math.cos((5 * Math.PI) / 180);
  assert.ok(on(gore)(106, (3.5 + edge(106)) / 2), "the gore's tip, 0.27 m wide, is road");
  assert.ok(!on(gore)(140, (3.5 + edge(140)) / 2), 'the gore stays where it is 3.2 m wide');
  assert.ok(!on(gore)(118, (3.5 + edge(118)) / 2), 'and where it is 1.3 m wide');
});

test('the streets end at their walls: a pavement at any, a carriageway at the map\'s, no narrower than its lanes (task 052)', () => {
  // A residential street east-west, 8 m wide, no lanes painted, houses along both sides.
  const houses = [[[0, 12], [100, 12], [100, 20], [0, 20]], [[0, -12], [100, -12], [100, -20], [0, -20]]];
  const wall = (pts, source = 'osm', kind = 'wall') => ({ kind, source, level: 'ground', pts });
  const walls = [
    // The map's wall 1 m in from the south kerb, from x 10 to 40: the carriageway's edge comes back to
    // it, 15 cm short of its line, and no pavement is behind it.
    wall([[10, 3], [40, 3]]),
    // One 1.5 m out from the north kerb, from x 60 to 90: the pavement runs to it.
    wall([[60, -5.5], [90, -5.5]], 'lidar'),
    // A hedge the LiDAR found 1.5 m out from the south kerb: the pavement runs past it.
    wall([[60, 5.5], [90, 5.5]], 'lidar', 'hedge'),
  ];
  const got = cut(streetSurfaces({ lines: [way(1, 5, 8, [[0, 0], [100, 0]], [1, 2])], box, buildings: houses, walls }));
  const road = inside(got.carriageways), pave = inside(got.pavements.filter((p) => p.kind === 'pavement'));
  assert.ok(road(25, 2.7) && !road(25, 2.95) && road(50, 3.9) && road(25, -3.9), "the carriageway's south edge at the map's wall, and at its width past it and across");
  assert.ok(!pave(25, 2.95) && !pave(25, 3.5) && !pave(25, 6), 'no pavement behind the wall');
  assert.ok(pave(75, -4.3) && pave(75, -5.2) && !pave(75, -5.8) && !pave(75, -7), 'the north pavement from the kerb to the wall');
  assert.ok(pave(75, 6.5), "and the south's past the hedge the LiDAR found");
  // A road of two lanes painted, 7 m: the map's wall 1 m from its line. The lanes don't fit beside
  // it, so the edge comes in to 5 m from the other, and the wall stands in it; the centre line is
  // the middle of what's left.
  const two = cut(streetSurfaces({ lines: [way(1, 3, 7, [[0, 0], [100, 0]], [1, 2], { highway: 'secondary', lanes: '2' })], box, walls: [wall([[10, 1], [60, 1]])] }));
  const narrow = inside(two.carriageways);
  assert.ok(narrow(35, 1.4) && !narrow(35, 1.6) && narrow(35, -3.4) && narrow(80, 3.4), 'the edge 1.5 m from the line, 5 m from the other');
  const onCentre = (p) => two.markings.some((m) => m.kind === 'centre' && m.pts.some((q, i) => i && segDist(p, m.pts[i - 1], q) < 0.1));
  assert.ok(onCentre([35, -1]) && onCentre([90, 0]), 'the centre line in the middle of what is left, and of the road past it');
  // A road's two one-way carriageways that touch, the map's wall between them: both stop at it, and
  // its gap is an island, not a crack filled in.
  const t = { highway: 'secondary', oneway: 'yes' }, d = 7.1;
  const pair = cut(streetSurfaces({ lines: [way(1, 3, 7, [[0, 0], [150, 0]], [1, 2], t), way(2, 3, 7, [[150, d], [0, d]], [3, 4], t), way(3, 5, 6, [[150, 0], [150, d]], [2, 3]), way(4, 5, 6, [[0, d], [0, 0]], [4, 1])], box, walls: [wall([[20, d / 2], [130, d / 2]])] }));
  const both = inside(pair.carriageways);
  assert.ok(!both(75, d / 2) && both(75, d / 2 - 0.3) && both(75, d / 2 + 0.3) && both(10, d / 2), 'both carriageways at the wall, and joined past it');
  assert.ok(inside(pair.pavements.filter((p) => p.kind === 'island'))(75, d / 2), 'the wall on an island');
  // A junction's corner stops at the map's wall across it.
  const tee = [way(1, 5, 6, [[0, 0], [50, 0]], [1, 2]), way(2, 5, 6, [[50, 0], [100, 0]], [2, 3]), way(3, 5, 6, [[50, 0], [50, 50]], [2, 4])];
  const corner = inside(cut(streetSurfaces({ lines: tee, box, walls: [wall([[53.1, 4.4], [54.4, 3.1]])] })).carriageways), open = inside(cut(streetSurfaces({ lines: tee, box })).carriageways);
  assert.ok(open(54.2, 3.9) && !corner(54.2, 3.9) && corner(53.4, 3.4), "the corner's kerb at the wall");
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

test('no sliver in the carriageways: no notch under a metre wide into them, no crack between them, but where a wall stands (tasks 048, 052)', () => {
  // Each level's carriageways together, in millimetres, where a crack between two pieces is a hole or
  // a notch; and what closing them by 0.4 m (grown, then shrunk) fills, a film of 5 mm along their
  // edges left out, where it comes back a millimetre off. streets.mjs closes them by half a metre, and
  // the tiles' 10 cm then narrow a gap it left a metre wide by a few centimetres: this finds a notch
  // under 0.8 m wide.
  const K = 1000, mm = (r) => r.map(([x, z]) => ({ X: Math.round(x * K), Y: Math.round(z * K) }));
  const offset = (ps, d) => { const o = new C.ClipperOffset(2, 40), out = []; o.AddPaths(ps, C.JoinType.jtRound, C.EndType.etClosedPolygon); o.Execute(out, d * K); return out; };
  const clip = (type, a, b) => { const c = new C.Clipper(), out = []; c.AddPaths(a, C.PolyType.ptSubject, true); c.AddPaths(b, C.PolyType.ptClip, true); c.Execute(type, out, NZ, NZ); return out; };
  const at = (q) => `(${(q.X / K).toFixed(1)}, ${(q.Y / K).toFixed(1)})`;
  const cracks = [], notches = [];
  let filled = 0, walled = 0;
  // But a gap a wall stands in, where the carriageways either side of it stop at it (task 052: a
  // road's two carriageways at its median's wall): the walls' lines every half metre, and how much of
  // a ring's length they run in it.
  const wallPts = new Map();
  // The map's own lines too, where fetched: a wall's tip cut where the streets don't give way to it.
  const mapWalls = fs.existsSync(`${CACHE}/osm/barriers.json`) ? barriersOf(readCache('osm/barriers.json'), (x, z) => inOpen([x, z])) : [];
  for (const x of [...w.walls, ...mapWalls]) {
    if (x.kind === 'gate' || x.kind === 'bar') continue;
    for (let i = 1; i < x.pts.length; i++) {
      const [ax, az] = x.pts[i - 1], [bx, bz] = x.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let k = 0; k < n; k++) {
        const p = [ax + ((bx - ax) * (k + 0.5)) / n, az + ((bz - az) * (k + 0.5)) / n], c = Math.floor(p[0] / 10) + ',' + Math.floor(p[1] / 10);
        if (!wallPts.has(c)) wallPts.set(c, []);
        wallPts.get(c).push(p);
      }
    }
  }
  // Whether a wall runs within half a metre of a ring.
  const wallBy = (r) => r.some((q) => { const x = q.X / K, z = q.Y / K; for (let i = Math.floor(x / 10) - 1; i <= Math.floor(x / 10) + 1; i++) for (let j = Math.floor(z / 10) - 1; j <= Math.floor(z / 10) + 1; j++) if ((wallPts.get(i + ',' + j) ?? []).some(([px, pz]) => Math.hypot(px - x, pz - z) < 0.5)) return true; return false; });
  const wallIn = (r) => {
    const xs = r.map((q) => q.X / K), zs = r.map((q) => q.Y / K), ring = r.map((q) => [q.X / K, q.Y / K]);
    let n = 0;
    for (let i = Math.floor(Math.min(...xs) / 10); i <= Math.floor(Math.max(...xs) / 10); i++) for (let j = Math.floor(Math.min(...zs) / 10); j <= Math.floor(Math.max(...zs) / 10); j++) for (const p of wallPts.get(i + ',' + j) ?? []) if (inside([{ rings: [ring] }])(...p)) n++;
    return n * 0.5;
  };
  const rings = (list) => list.flatMap((p) => p.rings.map((r, i) => { const q = mm(r); return C.Clipper.Orientation(q) === !i ? q : q.reverse(); }));
  for (const level of ['ground', 'bridge', 'tunnel']) {
    const U = clip(C.ClipType.ctUnion, rings(S.carriageways.filter((p) => p.level === level)), []);
    // Where a deck or a tunnel's road meets the ground's streets, at its end, it takes their place.
    const others = clip(C.ClipType.ctUnion, rings(S.carriageways.filter((p) => p.level !== level)), []);
    const holes = U.filter((r) => !C.Clipper.Orientation(r)).map((r) => r.slice().reverse());
    // A hole under 0.3 m wide all along, that no island fills (its tip, cut off at the 10 cm grid): a
    // crack between carriageways that touch.
    const filledBy = inside(S.pavements.filter((p) => p.level === level));
    for (const h of holes) {
      const mid = [h.reduce((s, q) => s + q.X, 0) / h.length / K, h.reduce((s, q) => s + q.Y, 0) / h.length / K];
      if (!offset([h], -0.15).length && inOpen(mid) && !filledBy(...mid)) {
        const long = Math.max(...h.flatMap((p) => h.map((q) => Math.hypot(p.X - q.X, p.Y - q.Y)))) / K;
        if (wallIn(h) >= long / 2) walled++;
        else cracks.push(`${level} ${at(h[0])}, ${(C.Clipper.Area(h) / K / K).toFixed(2)} m²`);
      }
    }
    // An island (a hole under streets.mjs's ISLAND, 600 m²) keeps its own shape, however narrow: the
    // closing fills none of it.
    const small = holes.filter((h) => C.Clipper.Area(h) < 600 * K * K);
    // But a part of one under 4 cm wide and over half a metre long is a crack where the carriageways
    // round it touch (streets.mjs fills an island where it's under 20 cm wide, which the tiles' 10 cm
    // narrow): what opening it (shrunk, then grown) takes away, a film of 3 mm along its edges left in.
    for (const h of small) for (const r of clip(C.ClipType.ctDifference, [h], offset(offset(offset([h], -0.02), 0.02), 0.003))) {
      if (!C.Clipper.Orientation(r) || !inOpen([r[0].X / K, r[0].Y / K])) continue;
      const long = Math.max(...r.flatMap((p) => r.map((q) => Math.hypot(p.X - q.X, p.Y - q.Y)))) / K;
      // But the tip of a wall's gap, where the streets widen again past its end: a wall runs by it.
      if (long > 0.5 && wallBy(r)) walled++;
      else if (long > 0.5) cracks.push(`${level} ${at(r[0])}, ${long.toFixed(2)} m along an island`);
    }
    const D = clip(C.ClipType.ctDifference, offset(offset(U, 0.4), -0.4), [...offset(U, 0.005), ...small]).filter((r) => C.Clipper.Orientation(r));
    // Each piece of it as deep as its farthest point from where it opens, the closed outline across
    // it: those of its edges not along the carriageways'. An inside corner rounded is a few
    // centimetres deep; a spike of pavement into the road as deep as it is; a crack as long.
    const cells = new Map(), CELL = 2 * K, key = (x, y) => Math.floor(x / CELL) + ',' + Math.floor(y / CELL);
    for (const r of U) r.forEach((a, i) => {
      const b = r[(i + 1) % r.length], n = Math.ceil(Math.hypot(b.X - a.X, b.Y - a.Y) / (CELL / 2)) || 1, ks = new Set();
      for (let s = 0; s <= n; s++) ks.add(key(a.X + ((b.X - a.X) * s) / n, a.Y + ((b.Y - a.Y) * s) / n));
      for (const k of ks) { if (!cells.has(k)) cells.set(k, []); cells.get(k).push([a, b]); }
    });
    const segDistMm = (p, a, b) => segDist([p.X, p.Y], [a.X, a.Y], [b.X, b.Y]);
    const onEdge = (p) => { for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (const [a, b] of cells.get(key(p.X + u * CELL, p.Y + v * CELL)) ?? []) if (segDistMm(p, a, b) < 10) return true; return false; };
    for (const r of D) {
      if (!inOpen([r[0].X / K, r[0].Y / K]) || clip(C.ClipType.ctIntersection, [r], others).reduce((s, q) => s + C.Clipper.Area(q), 0) > C.Clipper.Area(r) / 2) continue;
      filled++;
      const mouth = r.map((a, i) => [a, r[(i + 1) % r.length]]).filter(([a, b]) => !onEdge({ X: (a.X + b.X) / 2, Y: (a.Y + b.Y) / 2 }));
      const deep = mouth.length ? Math.max(...r.map((p) => Math.min(...mouth.map(([a, b]) => segDistMm(p, a, b))))) / K : 0;
      if (deep > 0.5 && wallIn(r) >= deep / 2) walled++;
      else if (deep > 0.5) notches.push(`${level} ${at(r[0])}, ${deep.toFixed(2)} m deep, ${(C.Clipper.Area(r) / K / K).toFixed(2)} m²`);
    }
  }
  console.log(`closing the carriageways by 0.4 m fills ${filled} corners and notches in the area, ${notches.length} over half a metre deep; ${cracks.length} holes under 0.3 m wide; ${walled} gaps a wall stands in`);
  assert.deepEqual(cracks, [], 'cracks between carriageways');
  assert.deepEqual(notches, [], 'notches under a metre wide into the carriageways');
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

test("a deck or a tunnel meets the ground's streets at its ends to within 5 cm", () => {
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
  // A tunnel's end: at the ground at its mouth, which the tiles hold down to the cutting's floor
  // there (task 043); within 5 cm of it somewhere in the half metre round its point, as the tiles
  // keep a line's points to the half metre (and its heights to the decimetre).
  const mouths = tunnels.map((e) => {
    const hs = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => w.height(e.p[0] + i * 0.25, e.p[1] + j * 0.25)));
    return Math.max(0, e.y - Math.max(...hs), Math.min(...hs) - e.y);
  });
  console.log(`${decks.length} decks' ends: ${n} points where they meet the ground, ${worst.toFixed(3)} m off at most, and ${steep} by ground half a metre or more off them; ${tunnels.length} tunnels' ends, ${Math.max(...mouths).toFixed(3)} m off the ground at most`);
  assert.ok(n >= decks.length * 2, `${n} points at ${decks.length} decks' ends`);
  assert.deepEqual(off, [], 'points of a deck more than 5 cm off the ground where it meets it');
  // 32 before task 043 held the ground at the ends. Three are left: the Largo Santa Justa deck's
  // outer corners, where the bank beside the street falls 2 m in the 2 m out from the end, more than
  // the tiles' 2 m ground can turn; and a corner of the Rotunda Santos da Cunha viaduct's south end,
  // where the held ground steps aside for OpenStreetMap's outline of the junction drawn as a street
  // (way 160389857, as the map has it: decision 022, task 047).
  assert.ok(steep <= 3, `${steep} points by ground half a metre or more off a deck at its end`);
  assert.ok(Math.max(...mouths) <= 0.0501, `a tunnel's end ${Math.max(...mouths).toFixed(3)} m off the ground at its mouth`);
});

test('the street on the ground runs into every deck and tunnel on its own slope', () => {
  // Out along the street from each end (the bridge's or the tunnel's line carried straight on), the
  // tiles' ground every 50 cm to 6 m, and a line fitted to it from 2 to 6 m: over the first 2 m the
  // ground stays within a decimetre of it, the tiles' own step (they hold heights in decimetres, so
  // the ground anywhere is up to 5 cm off what it rounds, and the ends where nothing dipped are up to
  // 7 cm off such a line). Before task 043 the ground dipped 0.2 to 0.6 m into five decks' abutments,
  // and climbed 0.5 to 4.5 m up the tunnels' portals.
  // But at four mouths of the narrow bores (the João XXI's and the Liberdade's), a cutting's wall
  // stands 1.5 to 4 m from the street's middle, and the tiles' 2 m ground takes it into the street,
  // there and on along the cutting; and at the Avenida Imaculada Conceição's two under the Rotunda
  // Santos da Cunha (task 047), the roundabout's carriageway over the mouth: task 045.
  const WALLED = [[560, 233.5], [530, 249], [123.5, 611], [122.5, 607.5], [-775, 975.5], [-810, 1012]];
  const off = [], walled = [];
  let worst = 0;
  for (const e of joins) {
    const as = Array.from({ length: 13 }, (_, k) => k * 0.5), hs = as.map((a) => w.height(e.p[0] - e.u[0] * a, e.p[1] - e.u[1] * a));
    const fit = as.map((a, k) => [a, hs[k]]).filter(([a]) => a >= 2), ma = fit.reduce((s, [a]) => s + a, 0) / fit.length, mh = fit.reduce((s, [, h]) => s + h, 0) / fit.length;
    const slope = fit.reduce((s, [a, h]) => s + (a - ma) * (h - mh), 0) / fit.reduce((s, [a]) => s + (a - ma) ** 2, 0);
    const d = Math.max(...as.filter((a) => a <= 2).map((a, k) => Math.abs(hs[k] - mh - slope * (a - ma))));
    const at = `${e.level} at (${e.p}) ${d.toFixed(2)} m`;
    if (WALLED.some(([x, z]) => Math.hypot(x - e.p[0], z - e.p[1]) < 2)) walled.push(at);
    else { worst = Math.max(worst, d); if (d > 0.1) off.push(at); }
  }
  console.log(`${joins.length - walled.length} decks' ends and tunnels' mouths: the first 2 m within ${worst.toFixed(2)} m of the street's slope beyond; in a walled cutting, ${walled.join(', ')}`);
  assert.equal(walled.length, WALLED.length, 'the walled mouths are where they were');
  assert.deepEqual(off, [], "the ground dips or climbs where the street meets a deck or a tunnel");
});

test("no corner of the ground's streets lies past a deck's or a tunnel's end (task 046)", () => {
  // Past each end's line, along the bridge's or the tunnel's ways within their width and 3 m either
  // side (the band round its lines and those that meet them at its level, square at their ends), as
  // far as 30 m on or a street on the ground that crosses them: the ground's carriageway there, but
  // for the streets' own bands (half a street's width and 0.9 m round its line, as the tiles keep a
  // line to within 0.8 m and its points to the decimetre) and the 3 m behind another end's line
  // within its width and 3 m (where a deck beside it ends further on), is a corner closed round
  // across the deck or the tunnel. Before task 046 the Avenida Robert Smith's west end had 110 m² of
  // it, a strip of road in the gap between its two decks and on the embankment under them, and the
  // Rotunda Santos da Cunha viaduct's north end 42 m². But a junction whose street crosses an end
  // keeps its corners, as far as they reach (45 m): the João XXI's ways across the Avenida 31 de
  // Janeiro's deck's ends, its corners over the João XXI's tunnels too.
  const K = 100, cm = ([x, z]) => ({ X: Math.round(x * K), Y: Math.round(z * K) });
  const clip = (type, a, b = []) => { const c = new C.Clipper(), out = []; c.AddPaths(a, C.PolyType.ptSubject, true); if (b.length) c.AddPaths(b, C.PolyType.ptClip, true); c.Execute(type, out, NZ, NZ); return out; };
  const offset = (lines, d, end) => { const o = new C.ClipperOffset(2, 4), out = []; o.AddPaths(lines.map((l) => l.map(cm)), C.JoinType.jtRound, end); o.Execute(out, d * K); return out; };
  const ahead = (e, from, to, side = 30) => { const [ux, uz] = e.u, [x, z] = e.p, q = (a, s) => cm([x + ux * a - uz * s, z + uz * a + ux * s]), r = [q(from, side), q(to, side), q(to, -side), q(from, -side)]; return [C.Clipper.Orientation(r) ? r : r.reverse()]; };
  const ground = w.lines.filter((l) => (l.level === 'ground' || l.level === 'under') && l.kind <= 8), key = (p) => p[0] + ',' + p[1];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  // A ground street's arms at a point: the way it runs from there, to its first point 2 m or more off.
  const armsAt = (p) => ground.flatMap((l) => l.pts.flatMap((q, k) => (key(q) !== key(p) ? [] : [-1, 1].flatMap((s) => {
    for (let j = k + s; j >= 0 && j < l.pts.length; j += s) { const d = Math.hypot(l.pts[j][0] - p[0], l.pts[j][1] - p[1]); if (d >= 2 || j === 0 || j === l.pts.length - 1) return [[(l.pts[j][0] - p[0]) / d, (l.pts[j][1] - p[1]) / d]]; }
    return [];
  }))));
  const crossed = joins.filter((e) => { const a = armsAt(e.p); return a.some((x) => Math.abs(dot(x, e.u)) < 0.7 && a.some((y) => y !== x && dot(x, y) < -0.7)); });
  const junctions = crossed.map((e) => { const n = 48, r = Array.from({ length: n }, (_, k) => cm([e.p[0] + 45 * Math.cos((2 * Math.PI * k) / n), e.p[1] + 45 * Math.sin((2 * Math.PI * k) / n)])); return C.Clipper.Orientation(r) ? r : r.reverse(); });
  const carriageways = clip(C.ClipType.ctUnion, S.carriageways.filter((p) => p.level === 'ground').flatMap((p) => turned(p)));
  const left = [];
  let total = 0;
  for (const e of joins.filter((x) => !crossed.includes(x))) {
    // The bridge's or the tunnel's lines: its own, and those that meet it at their ends, at its level.
    const level = w.lines.filter((l) => l.level === e.level && l.kind <= 8), own = new Set(level.filter((l) => key(l.pts[0]) === key(e.p) || key(l.pts.at(-1)) === key(e.p)));
    for (let grew = true; grew;) {
      grew = false;
      const tips = new Set([...own].flatMap((l) => [key(l.pts[0]), key(l.pts.at(-1))]));
      for (const l of level) if (!own.has(l) && (tips.has(key(l.pts[0])) || tips.has(key(l.pts.at(-1))))) { own.add(l); grew = true; }
    }
    const side = e.w / 2 + 3, ends = [...own].flatMap((l) => [l.pts[0], l.pts.at(-1)]);
    const joints = ends.filter((p, i) => ends.findIndex((q) => key(q) === key(p)) === i && ends.filter((q) => key(q) === key(p)).length > 1);
    const way = clip(C.ClipType.ctUnion, [...offset([...own].map((l) => l.pts), side, C.EndType.etOpenButt), ...offset(joints.map((p) => [p, p]), side, C.EndType.etOpenRound)]);
    const near = ground.filter((l) => l.pts.some(([x, z]) => Math.abs(x - e.p[0]) < 80 && Math.abs(z - e.p[1]) < 80));
    const bands = near.flatMap((l) => offset([l.pts], l.w / 2 + 0.9, C.EndType.etOpenRound));
    for (const o of joins) if (o !== e && Math.hypot(o.p[0] - e.p[0], o.p[1] - e.p[1]) < 40) bands.push(...ahead(o, -3, 0, o.w / 2 + 3));
    const open = clip(C.ClipType.ctDifference, clip(C.ClipType.ctIntersection, ahead(e, 0.5, 30), way), bands), mouth = clip(C.ClipType.ctIntersection, ahead(e, 0.5, 1), way);
    // The pieces of it that reach the end's line.
    const c = new C.Clipper(), tree = new C.PolyTree(), reach = [];
    c.AddPaths(open, C.PolyType.ptSubject, true);
    c.Execute(C.ClipType.ctUnion, tree, NZ, NZ);
    for (const o of tree.Childs()) { const sh = [o.Contour(), ...o.Childs().map((h) => h.Contour())]; if (clip(C.ClipType.ctIntersection, sh, mouth).length) reach.push(...sh); }
    const got = clip(C.ClipType.ctDifference, clip(C.ClipType.ctIntersection, carriageways, reach), junctions), m2 = got.reduce((s, q) => s + C.Clipper.Area(q), 0) / K / K;
    total += m2;
    if (m2 > 1) left.push(`${e.level} at (${e.p}) ${m2.toFixed(1)} m²`);
  }
  console.log(`${joins.length - crossed.length} decks' ends and tunnels' mouths: ${total.toFixed(1)} m² of the ground's carriageway past them that's no street's own; ${crossed.length} ends a street crosses`);
  assert.ok(crossed.length >= 2, "the João XXI's ways cross the Avenida 31 de Janeiro's deck's ends");
  assert.deepEqual(left, [], "a corner of the ground's carriageway past a deck's or a tunnel's end");
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

test('no pavement runs past a wall into what is behind it (task 052)', () => {
  // Each wall a pavement stops at (streets.mjs's stopsAt), every half metre but its last metre at
  // either end, where it faces a street (within 60° of square to the way to the nearest carriageway's
  // edge, 4 m off at most): whether there's pavement 0.4 m past it, but another street's, whose
  // carriageway is on that side of the wall.
  const ground = S.carriageways.filter((c) => c.level === 'ground'), pave = inside(S.pavements.filter((p) => p.level === 'ground' && p.kind === 'pavement')), onRoad = inside(ground);
  const edges = new Map();
  for (const c of ground) for (const r of c.rings) r.forEach((a, i) => {
    const b = r[(i + 1) % r.length];
    for (let cx = Math.floor(Math.min(a[0], b[0]) / 5); cx <= Math.floor(Math.max(a[0], b[0]) / 5); cx++) for (let cz = Math.floor(Math.min(a[1], b[1]) / 5); cz <= Math.floor(Math.max(a[1], b[1]) / 5); cz++) {
      const k = cx + ',' + cz;
      if (!edges.has(k)) edges.set(k, []);
      edges.get(k).push([a, b]);
    }
  });
  const nearest = (x, z, r = 4) => {
    let best = null;
    for (let cx = Math.floor((x - r) / 5); cx <= Math.floor((x + r) / 5); cx++) for (let cz = Math.floor((z - r) / 5); cz <= Math.floor((z + r) / 5); cz++) for (const [a, b] of edges.get(cx + ',' + cz) ?? []) {
      const d = segDist([x, z], a, b), dx = b[0] - a[0], dz = b[1] - a[1], f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
      if (d <= r && (!best || d < best.d)) best = { d, p: [a[0] + dx * f, a[1] + dz * f] };
    }
    return best;
  };
  let facing = 0, past = 0;
  const at = [];
  for (const x of w.walls.filter(stopsAt)) {
    const L = x.pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - x.pts[i - 1][0], p[1] - x.pts[i - 1][1]) : 0), 0);
    let s0 = 0;
    for (let i = 1; i < x.pts.length; i++) {
      const [ax, az] = x.pts[i - 1], [bx, bz] = x.pts[i], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 0.5)), ux = (bx - ax) / (l || 1), uz = (bz - az) / (l || 1);
      for (let k = 0; k < n && l > 1e-6; k++) {
        const s = (l * (k + 0.5)) / n, px = ax + ux * s, pz = az + uz * s;
        if (s0 + s < 1 || L - s0 - s < 1 || !inOpen([px, pz]) || onRoad(px, pz)) continue;
        const e = nearest(px, pz);
        if (!e || e.d < 0.05) continue;
        const ox = (px - e.p[0]) / e.d, oz = (pz - e.p[1]) / e.d;
        if (Math.abs(ux * ox + uz * oz) > 0.5) continue;
        const sg = -uz * ox + ux * oz > 0 ? 1 : -1, nx = -uz * sg, nz = ux * sg, fx = px + nx * 0.4, fz = pz + nz * 0.4;
        facing += 0.5;
        if (!pave(fx, fz)) continue;
        const f = nearest(fx, fz);
        if (f && (f.p[0] - px) * nx + (f.p[1] - pz) * nz > 0) continue;
        past += 0.5;
        at.push(`(${Math.round(px)}, ${Math.round(pz)})`);
      }
      s0 += l;
    }
  }
  console.log(`walls a pavement stops at, facing a street: ${(facing / 1000).toFixed(2)} km; with pavement past them ${(past / 1000).toFixed(2)} km (${((past / facing) * 100).toFixed(1)}%: 40.8% on braga-map 1.22.0), e.g. at ${at.filter((_, i) => i % 40 === 0).slice(0, 6).join(', ')}`);
  assert.ok(facing > 10000, `only ${facing} m of walls facing a street`);
  assert.ok(past / facing <= 0.02, `${((past / facing) * 100).toFixed(1)}% of the walls facing a street have pavement past them`);
});

test("the Volta dos Amigos runs on its streets: every point on a carriageway, but in the jump's flight", () => {
  // track.mjs puts the line on each street's own line, which its carriageway is drawn round, and
  // where it rounds a corner or folds a jog keeps it 1.2 m inside the race's road (task 037).
  const levels = ['ground', 'bridge', 'tunnel'].map((l) => inside(S.carriageways.filter((p) => p.level === l))), any = (x, z) => levels.some((f) => f(x, z));
  let air = false;
  const pts = amigos.points.flatMap((p, i) => { if (p.air !== undefined) air = p.air; return air || !inOpen([p.p[0], p.p[2]]) ? [] : [{ i, p: [p.p[0], p.p[2]] }]; });
  const off = pts.filter(({ p }) => !any(...p));
  assert.ok(pts.length > 1000, `${pts.length} of the track's points in the area`);
  assert.deepEqual(off.map(({ p }) => p), [], `the track's points off a carriageway`);
});

test("the race's road takes in the whole line, and its barriers stand on its edge across the streets that go on", () => {
  // The race's road (task 037): the route's own streets at their real widths, as they're drawn, and
  // the jump's flight; a closure where the street drawn goes on past its edge.
  const road = inside(amigos.road.map((rings) => ({ rings }))), carriageway = inside(S.carriageways.filter((p) => p.level !== 'tunnel'));
  assert.equal(amigos.road.length, 1, 'one piece');
  const out = amigos.points.filter(({ p }) => !road(p[0], p[2]));
  assert.deepEqual(out.map(({ p }) => p), [], "the line's points off the race's road");
  // Each closure's points on the road's edge (within half a metre of it), and most of each over a
  // carriageway.
  const edge = amigos.road.flat().flatMap((r) => r.map((p, k) => [p, r[(k + 1) % r.length]]));
  const near = (x, z) => edge.some(([[ax, az], [bx, bz]]) => {
    if (Math.min(ax, bx) - 1 > x || Math.max(ax, bx) + 1 < x || Math.min(az, bz) - 1 > z || Math.max(az, bz) + 1 < z) return false;
    const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(ax + dx * f - x, az + dz * f - z) < 0.5;
  });
  assert.ok(amigos.closures.length > 100, `${amigos.closures.length} closures`);
  const loose = amigos.closures.filter((c) => !c.every(([x, , z]) => near(x, z)));
  assert.deepEqual(loose.map((c) => c[0]), [], "closures off the race's edge");
  const over = amigos.closures.flat().filter(([x, , z]) => carriageway(x, z)).length / amigos.closures.flat().length;
  assert.ok(over > 0.8, `only ${(over * 100).toFixed(0)}% of the closures' points over a carriageway`);
  // Round the jump's landing the road takes in the corner between the flight and the landing street
  // (task 057): the road works' boards stand on its edge there, and where a race takes the world's
  // walls down is within 20 m of the landing.
  assert.ok(amigos.boards.length >= 1, 'no road works boards round the corner at the landing');
  assert.deepEqual(amigos.boards.filter((c) => !c.every(([x, , z]) => near(x, z))).map((c) => c[0]), [], "boards off the race's edge");
  const [land] = amigos.ramps.map((r) => r.land);
  const far = amigos.cleared.flat(2).filter(([x, z]) => Math.hypot(x - land[0], z - land[2]) > 20.5);
  assert.ok(amigos.cleared.length >= 1 && !far.length, `cleared reaches ${far.length} points more than 20 m from the landing`);
});
