// What's walked or cycled (task 050): in the open world's tiles as the games read them, every footway,
// path, cycleway and flight of steps the map has in the area (but the pavements, crossings and islands
// it draws as footways, and what's indoors), as surfaces at their levels, each step at its height,
// and nothing lying on anything else at its level.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import ClipperLib from 'clipper-lib';
import { loadWorld } from '../index.js';
import { CACHE, readCache } from '../tools/geo.mjs';
import { LEVEL, pathsOf, RISER } from '../tools/lines.mjs';
import { OPEN_BOX } from '../tools/sections.mjs';

const C = ClipperLib;
const NZ = C.PolyFillType.pftNonZero;
const fetched = fs.existsSync(path.join(CACHE, 'osm', 'paths.json'));
const skip = !fetched && "the paths aren't fetched (node tools/fetch.mjs paths)";
const w = await loadWorld(OPEN_BOX);
const S = w.streets;
const inOpen = ([x, z]) => w.inOpen(x, z);
const ways = fetched ? pathsOf(readCache('osm/paths.json'), () => true).filter((p) => p.pts.some(inOpen)) : [];
const NAMES = ['ground', 'bridge', 'tunnel', 'under'];

// Pieces in cells of 10 m, for which of them a point is in.
function index(pieces) {
  const cells = new Map();
  for (const p of pieces) {
    const xs = p.rings[0].map((v) => v[0]), zs = p.rings[0].map((v) => v[1]);
    for (let i = Math.floor(Math.min(...xs) / 10); i <= Math.floor(Math.max(...xs) / 10); i++) for (let j = Math.floor(Math.min(...zs) / 10); j <= Math.floor(Math.max(...zs) / 10); j++) {
      const k = i + ',' + j;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(p);
    }
  }
  const inRings = (rings, x, z) => {
    let odd = false;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > z !== r[j][1] > z && x < r[i][0] + ((z - r[i][1]) / (r[j][1] - r[i][1])) * (r[j][0] - r[i][0])) odd = !odd;
    return odd;
  };
  return (x, z) => (cells.get(Math.floor(x / 10) + ',' + Math.floor(z / 10)) ?? []).filter((p) => inRings(p.rings, x, z));
}
const onPath = index(S.paths);
const onStreet = index([...S.carriageways, ...S.pavements]);
const inBuilding = index(w.buildings.map((b) => ({ rings: [b.pts] })));
const inWater = index(w.areas.filter((a) => a.kind === 'water').map((a) => ({ rings: [a.pts] })));
// Each way's line every `step` metres inside the area (half a metre by default), but `inset` metres
// from its ends: [x, z] points.
const along = (pts, step = 0.5, inset = 0) => {
  const out = [], L = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < n; k++) if (s + (d * (k + 0.5)) / n >= inset && s + (d * (k + 0.5)) / n <= L - inset) out.push([ax + ((bx - ax) * (k + 0.5)) / n, az + ((bz - az) * (k + 0.5)) / n]);
    s += d;
  }
  return out.filter(inOpen);
};

test("every path in the area is drawn, or what's there instead is", { skip }, () => {
  // Along each way's line, what's under it: a path of its own kind; else what it gives way to (a
  // flight of steps, a cycleway, and for a footway or a path a pavement), the carriageway it's cut
  // back to, a building or the water. At its level: a passage under a building is under it.
  const got = {}, lost = [];
  for (const p of ways) {
    const row = (got[p.kind] ??= { m: 0, own: 0, other: 0, street: 0, building: 0, none: 0 });
    let none = 0;
    for (const [x, z] of along(p.pts)) {
      row.m += 0.5;
      const here = onPath(x, z);
      if (here.some((q) => q.kind === p.kind)) row.own += 0.5;
      else if (here.length) row.other += 0.5;
      else if (onStreet(x, z).length) row.street += 0.5;
      else if (inBuilding(x, z).length || inWater(x, z).length) row.building += 0.5;
      else { row.none += 0.5; none += 0.5; }
    }
    if (none > 2) lost.push(`${p.kind} ${p.id}: ${none} m`);
  }
  // Nothing, only in the gaps of a metre or two between two buildings, or a building and a street,
  // too narrow for what's left of the path there.
  console.log(`under the map's paths in the area, by the metre: ${Object.entries(got).map(([k, r]) => `${k} ${Math.round(r.m)} m (${Math.round((r.own / r.m) * 100)}% itself, ${Math.round((r.other / r.m) * 100)}% another path, ${Math.round((r.street / r.m) * 100)}% a street, ${Math.round((r.building / r.m) * 100)}% a building or the water, ${r.none} m nothing)`).join('; ')}`);
  for (const k of ['footway', 'path', 'cycleway', 'steps']) assert.ok(got[k]?.m > 500 || k === 'steps', k);
  // A footway gives way to the pavements, which its ends run into; the rest are drawn mostly as
  // themselves.
  assert.ok(got.footway.own / got.footway.m > 0.6 && got.cycleway.own / got.cycleway.m > 0.8 && got.path.own / got.path.m > 0.75 && got.steps.own / got.steps.m > 0.8, 'drawn as themselves');
  const none = Object.values(got).reduce((a, r) => a + r.none, 0), m = Object.values(got).reduce((a, r) => a + r.m, 0);
  assert.ok(none / m < 0.003 && lost.length <= 3, `${none} m with nothing under them, the most along ${lost.join(', ')}`);
});

test("the pavements, crossings and islands the map draws as footways aren't paths", { skip }, () => {
  const own = pathsOf({ elements: readCache('osm/paths.json').elements.map((e) => ({ ...e, tags: e.tags && { ...e.tags, footway: undefined, cycleway: undefined } })) }, () => true).filter((p) => p.pts.some(inOpen));
  const theirs = own.filter((p) => !ways.some((q) => q.id === p.id) && !(p.t.indoor && p.t.indoor !== 'no') && (p.t.level == null || p.t.level === '0'));
  let m = 0, drawn = 0;
  for (const p of theirs) for (const [x, z] of along(p.pts)) { m += 0.5; if (onPath(x, z).some((q) => q.kind === p.kind)) drawn += 0.5; }
  console.log(`the streets' own footways and cycleways: ${Math.round(m)} m, ${Math.round(drawn)} m of it on a path of its kind`);
  assert.ok(m > 40000 && drawn / m < 0.15, `${((drawn / m) * 100).toFixed(0)}% of the streets' own on a path`);
});

test('each path is at its level: a footbridge on its deck, a passage under its building', { skip }, () => {
  const off = [];
  let n = 0;
  for (const p of ways.filter((q) => q.kind !== 'steps' && (q.level === LEVEL.bridge || q.t.tunnel === 'building_passage'))) {
    const want = p.level === LEVEL.bridge ? 'bridge' : 'under', pts = along(p.pts);
    const mid = pts[Math.floor(pts.length / 2)];
    // A passage the map has on a street's carriageway (a pedestrian street under a building) is the
    // street's.
    if (!mid || (want === 'under' && onStreet(...mid).length)) continue;
    n++;
    if (!onPath(...mid).some((q) => q.level === want) && !onPath(...mid).some((q) => q.kind === 'steps')) off.push(`${p.kind} ${p.id} at (${mid.map(Math.round)}): ${onPath(...mid).map((q) => q.level).join(', ') || 'none'}`);
  }
  console.log(`${n} footbridges and passages, ${off.length} off their level`);
  assert.ok(n > 30);
  assert.ok(off.length <= n / 20, off.join('; '));
  for (const p of S.paths) {
    if (p.level === 'bridge' || p.level === 'tunnel' || p.kind === 'steps') assert.ok(p.ys && p.ys.every((r, i) => r.length === p.rings[i].length), 'a height at each point');
    else assert.ok(!p.ys);
  }
});

test('each step at its height: a tread a riser over the one before, from its foot to its top', { skip }, () => {
  // Along each flight in the area, every 5 cm, the treads under its line, but another flight's that
  // it runs into (one whose middle is past its ends or off its side): each one height, and between
  // them a riser, or a whole number of them where a tread is cut away (by a carriageway or a
  // building), every riser the same, to the centimetre the tiles keep them to. And as many as the
  // map counts, where none is cut away.
  const flights = ways.filter((p) => p.kind === 'steps' && p.level !== LEVEL.bridge && p.pts.every(inOpen));
  let checked = 0, counted = 0, same = 0;
  const bad = [], fewer = [];
  for (const p of flights) {
    const L = p.pts.reduce((a, v, i) => (i ? a + Math.hypot(v[0] - p.pts[i - 1][0], v[1] - p.pts[i - 1][1]) : 0), 0);
    const mine = (q) => {
      const r = q.rings[0], cx = r.reduce((a, v) => a + v[0], 0) / r.length, cz = r.reduce((a, v) => a + v[1], 0) / r.length;
      let best = Infinity, at = 0, s = 0;
      for (let i = 1; i < p.pts.length; i++) {
        const [ax, az] = p.pts[i - 1], [bx, bz] = p.pts[i], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1e-9, f = ((cx - ax) * dx + (cz - az) * dz) / (l * l), d = Math.hypot(ax + dx * Math.max(0, Math.min(1, f)) - cx, az + dz * Math.max(0, Math.min(1, f)) - cz);
        if (d < best) { best = d; at = s + f * l; }
        s += l;
      }
      return best <= p.w / 2 + 0.3 && at >= -0.05 && at <= L + 0.05;
    };
    const under = along(p.pts, 0.05).map(([x, z]) => onPath(x, z).filter((q) => q.kind === 'steps' && mine(q)).map((q) => q.ys[0][0]));
    const ys = [...new Set(under.flat())].sort((a, b) => a - b), cut = under.filter((u) => !u.length).length * 0.05;
    if (ys.length < 2) continue;
    checked++;
    // (Where two flights meet on a landing, a tread of the other may be under this one's end.)
    const rises = ys.slice(1).map((y, i) => y - ys[i]), r = rises.slice().sort((a, b) => a - b)[rises.length >> 1];
    if (!rises.slice(rises.length > 2 ? 1 : 0, rises.length > 2 ? -1 : undefined).every((d) => Math.round(d / r) >= 1 && Math.abs(d - Math.round(d / r) * r) <= 0.011 * Math.round(d / r) + 0.001)) bad.push(`${p.id}: ${ys.join(' ')}`);
    // Those cut away where its ends run under a carriageway, a pavement or a building, as many as the
    // tread's depth goes into what's cut.
    const count = parseInt(p.t.step_count);
    if (count > 0) {
      counted++;
      if (Math.abs(ys.length + cut / (L / count) - count) <= 2) same++;
      else fewer.push(`${p.id}: ${ys.length} and ${(cut / (L / count)).toFixed(1)} cut away of ${count}`);
    }
  }
  console.log(`${checked} flights in the area with two treads or more under their line; ${counted} the map counts, ${same} with as many treads as it says, or cut away (${fewer.join(', ')})`);
  assert.ok(checked > 80, `${checked} flights`);
  assert.deepEqual(bad, [], 'flights whose risers differ');
  assert.ok(same >= counted * 0.9, `${same} of ${counted}`);
  // The Travessa do Fujacal's 8 steps, up to a door the terrain doesn't have: 16 cm each from the
  // pavement (the owner's answer).
  const tf = flights.find((p) => p.id === 440208501), ys = [...new Set(along(tf.pts, 0.05).flatMap(([x, z]) => onPath(x, z).filter((q) => q.kind === 'steps').map((q) => q.ys[0][0])))].sort((a, b) => a - b);
  assert.equal(ys.length, 8);
  assert.ok(Math.abs(ys.at(-1) - ys[0] - 7 * RISER) < 0.015, `the Travessa do Fujacal's treads ${ys.join(' ')}`);
  // A handrail along each side of a flight with one.
  const rails = S.handrails;
  assert.ok(rails.length > 100 && rails.every((h) => h.ys.length === h.pts.length));
  const near = rails.filter((h) => h.pts.some(([x, z]) => Math.hypot(x - tf.pts[0][0], z - tf.pts[0][1]) < 5));
  assert.equal(near.length, 2, "the Travessa do Fujacal's flight has a handrail each side");
});

test("a cycleway in a pavement is drawn there: the Avenida da Liberdade's red lanes at the road's level, a kerb behind", { skip }, () => {
  // From the liberdade viewpoint's camera north to São João da Ponte, on the avenue's east side.
  const lanes = S.paths.filter((p) => p.kind === 'cycleway' && !p.raised && p.level === 'ground' && p.rings[0].some(([x, z]) => x > 270 && x < 330 && z > 840 && z < 950));
  assert.ok(lanes.length, 'a cycle lane beside the avenue');
  const kerbs = S.kerbs.filter((k) => k.h > 0 && k.pts.some(([x, z]) => lanes.some((l) => l.rings[0].some(([a, b]) => Math.hypot(a - x, b - z) < 0.5))));
  assert.ok(kerbs.length, 'a kerb along it');
  const raised = S.paths.filter((p) => p.kind === 'cycleway' && p.raised).length, all = S.paths.filter((p) => p.kind === 'cycleway').length;
  console.log(`${all} pieces of cycleway, ${raised} flush with a pavement, ${lanes.length} lanes by the Avenida da Liberdade`);
});

// A piece's rings for Clipper, its outline one way round and its holes the other.
const turned = (p) => p.rings.map((r, i) => { const q = r.map(([x, z]) => ({ X: Math.round(x * 100), Y: Math.round(z * 100) })); return C.Clipper.Orientation(q) === !i ? q : q.reverse(); });
const shrunk = (list) => { const o = new C.ClipperOffset(), out = []; o.AddPaths(list.flatMap(turned), C.JoinType.jtMiter, C.EndType.etClosedPolygon); o.Execute(out, -10); return out; };
const overlap = (a, b) => {
  if (!a.length || !b.length) return 0;
  const c = new C.Clipper(), got = [];
  c.AddPaths(a, C.PolyType.ptSubject, true);
  c.AddPaths(b, C.PolyType.ptClip, true);
  c.Execute(C.ClipType.ctIntersection, got, NZ, NZ);
  return got.reduce((s, q) => s + Math.abs(C.Clipper.Area(q)), 0) / 1e4;
};

test('nothing lies on anything else at its level: the paths, the carriageways and the pavements', () => {
  // Within each tile, each path shrunk by 10 cm (as two pieces rounded to 10 cm may cross a little),
  // over the streets at its level (on the ground, a passage under a building is at the ground's), and
  // over the other paths at it.
  const bad = [];
  let all = 0;
  for (const id of w.tiles) {
    const [, i, j] = id.match(/x(-?\d+)z(-?\d+)/).map(Number), tb = { x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 };
    const mine = (p) => p.rings[0].every(([x, z]) => x >= tb.x0 - 0.01 && x <= tb.x1 + 0.01 && z >= tb.z0 - 0.01 && z <= tb.z1 + 0.01);
    for (const level of ['ground', 'bridge', 'tunnel']) {
      const at = (p) => (p.level === 'under' ? 'ground' : p.level) === level && mine(p);
      const paths = S.paths.filter(at), streets = [...S.carriageways, ...S.pavements].filter(at);
      if (!paths.length) continue;
      const over = level === 'ground' ? overlap(shrunk(paths), streets.flatMap(turned)) : 0;
      let self = 0;
      paths.forEach((p, k) => { self += overlap(shrunk([p]), paths.slice(k + 1).flatMap(turned)); });
      all += over + self;
      if (over > 1 || self > 1) bad.push(`${id} ${level}: ${over.toFixed(1)} m² of path on a street, ${self.toFixed(1)} m² on another path`);
    }
  }
  console.log(`${all.toFixed(1)} m² of the paths over a street or another path at its level`);
  assert.deepEqual(bad, []);
});

test('the paths are cut to the tiles, in the open world\'s area', () => {
  assert.ok(S.paths.length > 1000, `${S.paths.length} pieces`);
  for (const p of S.paths) {
    assert.ok(['footway', 'path', 'cycleway', 'steps'].includes(p.kind) && NAMES.includes(p.level) && typeof p.raised === 'boolean', JSON.stringify(p).slice(0, 200));
    assert.ok(['calcada', 'paving', 'setts', 'asphalt', 'concrete', 'gravel', 'dirt', 'metal', 'wood'].includes(p.surface), p.surface);
    for (const r of p.rings) assert.ok(r.length >= 3);
  }
});

test('a walker gets through every passage under a building, both ways, as a game cuts the buildings back to it', { skip }, () => {
  // A game cuts a building back where a carriageway on the ground, a passage under it or a flight's
  // tread runs (Party Kart's ground.ts `trimmed`): its outline's edges but where they're in one, and
  // the passage's sides in the building. A walker 30 cm round along each passage's line, from a metre before it to a
  // metre past it (but not into a building it ends at), meets none of them (task 078).
  const cuts = [...S.carriageways.filter((p) => p.level === 'ground'), ...S.paths.filter((p) => p.level === 'under' || (p.level === 'ground' && p.kind === 'steps'))];
  const inCut = index(cuts);
  const ring = (r) => r.map((p, k) => [...p, ...r[(k + 1) % r.length]]);
  const cross = ([ax, az, bx, bz], [cx, cz, dx, dz]) => {
    const ex = bx - ax, ez = bz - az, fx = dx - cx, fz = dz - cz, den = ex * fz - ez * fx;
    if (!den) return null;
    const t = ((cx - ax) * fz - (cz - az) * fx) / den, u = ((cx - ax) * ez - (cz - az) * ex) / den;
    return t > 0 && t < 1 && u >= 0 && u <= 1 ? t : null;
  };
  // A segment's pieces between where it crosses others, those whose middle `keep` says.
  const pieces = (s, others, keep) => {
    const ts = [0, 1, ...others.map((o) => cross(s, o)).filter((t) => t !== null)].sort((a, b) => a - b), out = [];
    for (let k = 1; k < ts.length; k++) {
      const m = (ts[k - 1] + ts[k]) / 2;
      if (ts[k] - ts[k - 1] > 1e-6 && keep(s[0] + (s[2] - s[0]) * m, s[1] + (s[3] - s[1]) * m)) out.push([s[0] + (s[2] - s[0]) * ts[k - 1], s[1] + (s[3] - s[1]) * ts[k - 1], s[0] + (s[2] - s[0]) * ts[k], s[1] + (s[3] - s[1]) * ts[k]]);
    }
    return out;
  };
  const toSeg = (x, z, [ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0; return Math.hypot(ax + dx * t - x, az + dz * t - z); };
  const shut = [];
  let n = 0;
  for (const p of ways.filter((q) => q.level === LEVEL.under && q.kind !== 'steps')) {
    const pts = p.pts, m = pts.length;
    // A passage the map has on a street's carriageway (a street under a building) is the street's.
    const mid = along(pts)[Math.floor(along(pts).length / 2)];
    if (m < 2 || !pts.every(inOpen) || !along(pts).some(([x, z]) => inBuilding(x, z).length) || (mid && onStreet(...mid).some((q) => 'surface' in q && q.level === 'ground'))) continue;
    // A metre out past each end, unless that's in a building.
    const out = ([ax, az], [bx, bz]) => { const L = Math.hypot(ax - bx, az - bz) || 1, at = (d) => [ax + ((ax - bx) / L) * d, az + ((az - bz) / L) * d]; return [0.25, 0.5, 0.75, 1].some((d) => inBuilding(...at(d)).length) ? null : at(1); };
    const a = out(pts[0], pts[1]), b = out(pts[m - 1], pts[m - 2]), line = [...(a ? [a] : []), ...pts, ...(b ? [b] : [])];
    const x0 = Math.min(...line.map((q) => q[0])) - 3, x1 = Math.max(...line.map((q) => q[0])) + 3, z0 = Math.min(...line.map((q) => q[1])) - 3, z1 = Math.max(...line.map((q) => q[1])) + 3;
    const near = (pts) => pts.some(([x, z]) => x > x0 - 60 && x < x1 + 60 && z > z0 - 60 && z < z1 + 60);
    const segs = [], cutEdges = cuts.filter((c) => near(c.rings[0])).flatMap((c) => c.rings.flatMap(ring));
    for (const bd of w.buildings) {
      if (!near(bd.pts) || !bd.pts.some(([x, z]) => x > x0 - 40 && x < x1 + 40 && z > z0 - 40 && z < z1 + 40)) continue;
      const edges = ring(bd.pts);
      for (const e of edges) segs.push(...pieces(e, cutEdges, (x, z) => !inCut(x, z).length));
      const inB = (x, z) => { let odd = false; for (let i = 0, j = bd.pts.length - 1; i < bd.pts.length; j = i++) if (bd.pts[i][1] > z !== bd.pts[j][1] > z && x < bd.pts[i][0] + ((z - bd.pts[i][1]) / (bd.pts[j][1] - bd.pts[i][1])) * (bd.pts[j][0] - bd.pts[i][0])) odd = !odd; return odd; };
      // A passage's sides: the cuts' edges in the building with the building on their other side, not
      // another cut (a passage's floor meeting a carriageway's, or a tile's).
      for (const e of cutEdges) {
        if (!e.some((v, k) => (k % 2 ? v > z0 && v < z1 : v > x0 && v < x1))) continue;
        const L = Math.hypot(e[2] - e[0], e[3] - e[1]) || 1, nx = (-(e[3] - e[1]) / L) * 0.02, nz = ((e[2] - e[0]) / L) * 0.02;
        segs.push(...pieces(e, edges, (x, z) => inB(x, z) && inCut(x + nx, z + nz).length % 2 !== inCut(x - nx, z - nz).length % 2));
      }
    }
    n++;
    const hit = along(line, 0.1).find(([x, z]) => segs.some((s) => toSeg(x, z, s) < 0.3));
    if (hit) shut.push(`${p.kind} ${p.id} at (${hit.map((v) => v.toFixed(1))})`);
  }
  console.log(`${n} passages under a building in the area, ${n - shut.length} walked through${shut.length ? `; shut: ${shut.join(', ')}` : ''}`);
  assert.ok(n > 30, `${n} passages`);
  // The map's passage at (710, 360) runs along the seam between two of its buildings, and at its south
  // end the seam goes straight on: there's no open ground it comes out into.
  const LEFT = ['footway 1543796091'];
  assert.deepEqual(shut.filter((s) => !LEFT.some((l) => s.startsWith(l + ' '))), []);
});
