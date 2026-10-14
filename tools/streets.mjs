// Every street as surfaces a game can draw and drive on (task 033, decision 019): the carriageways
// at their real widths, joined where the streets meet, each corner rounded as a kerb turns it; the
// kerbs; the pavements behind them, as wide as the buildings leave room for; the central
// reservations between a road's two carriageways; the islands the carriageways go round; and the
// lines painted on them, from what the map says. Each at its street's level: on the ground, whose
// heights are the ground's, or on a bridge's deck or in a tunnel's road, with each point's height.
//
// node tools/streets.mjs [x0 x1 z0 z1]
//
// makes them in a box (by default Fujacal's, task 015's five streets and a block round them) into
// .cache/streets/, with a page that sets them over DGT's 2025 orthophoto to check them by:
// .cache/streets/index.html.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ClipperLib from 'clipper-lib';
import { COBBLE, isOneway, lanesOf, openThin } from './osm.mjs';

const C = ClipperLib;
const NZ = C.PolyFillType.pftNonZero;
const S = 100; // Clipper works in whole numbers: centimetres

// How far a pavement reaches from its kerb at most, when the map doesn't say and no building stops it.
const PAVE = 3.2;
// A kerb's height, and how far apart its points are looked at, along the edge of the carriageway.
const KERB = 0.15, PIECE = 4;
// The radius a kerb turns a corner at, by the smaller of the streets that meet there (osm.mjs's LINE
// kinds: the fast roads, their links, primary, secondary, tertiary, residential, pedestrian, service,
// track).
const R_KERB = [10, 8, 8, 7, 6, 5, 3, 3, 3];
// A hole between the carriageways is an island (kerbed, with nothing built on it) when it's smaller
// than this, no building stands on it and it isn't the rows of a car park between its aisles, or
// when a roundabout goes round it.
const ISLAND = 600;
// The lines painted: as wide as the track's (party-kart's road.ts), dashes 3 m on and 4 m off; a
// zebra 4 m deep, a stop line 0.5 m.
const LINE_W = 0.14, DASH = [3, 4], ZEBRA = 4, STOP = 0.5;
const UNPAVED = new Set(['unpaved', 'dirt', 'gravel', 'fine_gravel', 'ground', 'compacted', 'earth', 'grass', 'mud', 'sand', 'pebblestone', 'grass_paver']);

// ---- Clipper, in metres ----

const toPath = (pts) => pts.map(([x, z]) => ({ X: Math.round(x * S), Y: Math.round(z * S) }));
const toPts = (p) => p.map((q) => [Math.round(q.X / 10) / 10, Math.round(q.Y / 10) / 10]);
const positive = (p) => (C.Clipper.Orientation(p) ? p : p.slice().reverse());
// Every area handed to Clipper first loses its points within 1.4 cm of the next: clipper-lib unions
// some tangles of them wrongly (a block in the middle of a roundabout came out filled).
const clean = (paths) => C.Clipper.CleanPolygons(paths);
function clip(type, a, b = []) {
  const c = new C.Clipper();
  c.AddPaths(clean(a), C.PolyType.ptSubject, true);
  if (b.length) c.AddPaths(clean(b), C.PolyType.ptClip, true);
  const out = [];
  c.Execute(type, out, NZ, NZ);
  return out;
}
const union = (...sets) => clip(C.ClipType.ctUnion, sets.flat());
const minus = (a, b) => (a.length && b.length ? clip(C.ClipType.ctDifference, a, b) : a);
const meet = (a, b) => (a.length && b.length ? clip(C.ClipType.ctIntersection, a, b) : []);
const area = (paths) => paths.reduce((s, p) => s + C.Clipper.Area(p), 0) / (S * S);
// Grown by d metres, or shrunk where d is negative, round at the corners.
function grow(paths, d) {
  const o = new C.ClipperOffset(2, 0.04 * S), out = [];
  o.AddPaths(paths, C.JoinType.jtRound, C.EndType.etClosedPolygon);
  o.Execute(out, d * S);
  return out;
}
// The band d metres either side of each line, round where it ends, or cut square across it (butt).
function band(lines, d, butt = false) {
  const o = new C.ClipperOffset(2, 0.04 * S), out = [];
  o.AddPaths(lines, C.JoinType.jtRound, butt ? C.EndType.etOpenButt : C.EndType.etOpenRound);
  o.Execute(out, d * S);
  return out;
}
// The parts of some lines inside some areas, or outside them.
function cutLines(lines, areas, inside) {
  if (!lines.length) return [];
  if (!areas.length) return inside ? [] : lines;
  const c = new C.Clipper(), tree = new C.PolyTree();
  c.AddPaths(lines, C.PolyType.ptSubject, false);
  c.AddPaths(areas, C.PolyType.ptClip, true);
  c.Execute(inside ? C.ClipType.ctIntersection : C.ClipType.ctDifference, tree, NZ, NZ);
  return C.Clipper.OpenPathsFromPolyTree(tree);
}
// Each piece of some areas as its outline and its holes, [[outer, ...holes]]; `strict`, none touching
// itself (slow on big areas), and not cleaned, as it's for areas already rounded to 10 cm.
function shapes(paths, strict = false) {
  const c = new C.Clipper(), tree = new C.PolyTree(), out = [];
  c.StrictlySimple = strict;
  c.AddPaths(strict ? paths : clean(paths), C.PolyType.ptSubject, true);
  c.Execute(C.ClipType.ctUnion, tree, NZ, NZ);
  const walk = (node) => {
    for (const o of node.Childs()) {
      out.push([o.Contour(), ...o.Childs().map((h) => h.Contour())]);
      for (const h of o.Childs()) walk(h);
    }
  };
  walk(tree);
  return out;
}
const circle = ([x, z], r, n = 48) => toPath(Array.from({ length: n }, (_, i) => [x + r * Math.cos((2 * Math.PI * i) / n), z + r * Math.sin((2 * Math.PI * i) / n)]));
const rect = (b) => toPath([[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]]);

// Whether a point is inside some areas (non-zero), quickly, for many points: their edges in rows
// 4 m deep, and a ray to the east.
function insideOf(paths) {
  const rows = new Map(), R = 4 * S;
  for (const p of paths) for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    if (a.Y === b.Y) continue;
    for (let r = Math.floor(Math.min(a.Y, b.Y) / R); r <= Math.floor(Math.max(a.Y, b.Y) / R); r++) {
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r).push(a.X, a.Y, b.X, b.Y);
    }
  }
  return (x, z) => {
    const X = x * S, Y = z * S, row = rows.get(Math.floor(Y / R));
    if (!row) return false;
    let w = 0;
    for (let i = 0; i < row.length; i += 4) {
      const ay = row[i + 1], by = row[i + 3];
      if (ay <= Y === by <= Y) continue;
      if (row[i] + ((Y - ay) / (by - ay)) * (row[i + 2] - row[i]) > X) w += by > ay ? 1 : -1;
    }
    return w !== 0;
  };
}

// ---- Lines ----

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const lengthOf = (pts) => pts.reduce((s, p, i) => (i ? s + dist(pts[i - 1], p) : 0), 0);
// A line moved o metres to its right (to its left if o is negative), its corners mitred. Right is
// as seen on the map, north up: x east, z south, so (dx, dz)'s right is (-dz, dx).
function shift(pts, o) {
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
  return pts.map((p, i) => {
    const a = i > 0 ? nrm(pts[i - 1], p) : null, b = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
    // Between two stretches, along the sum of their normals, as far out as the corner's mitre (at
    // most twice o).
    let [nx, nz] = a ?? b;
    if (a && b) {
      const sx = a[0] + b[0], sz = a[1] + b[1], l = Math.hypot(sx, sz);
      if (l > 1e-6) { const f = 1 / (Math.max(0.5, l / 2) * l); nx = sx * f; nz = sz * f; }
    }
    return [p[0] + nx * o, p[1] + nz * o];
  });
}
// The way a line runs from its point i, as a unit vector: towards the first point 2 m or more along
// it (back along it if back), so a short jog at the end doesn't turn it.
function heading(pts, i, back = false) {
  const p = pts[i];
  for (let j = back ? i - 1 : i + 1; j >= 0 && j < pts.length; j += back ? -1 : 1) {
    const d = dist(p, pts[j]);
    if (d >= 2 || j === 0 || j === pts.length - 1) return [(pts[j][0] - p[0]) / (d || 1), (pts[j][1] - p[1]) / (d || 1)];
  }
  return [1, 0];
}

// The streets' centre lines in cells, to find the one nearest a point: which, how far along which
// of its stretches, how far from it, and on which side (1 right, -1 left, as the way is drawn).
function lineIndex(edges, cell = 20) {
  const grid = new Map();
  edges.forEach((e, k) => {
    for (let i = 1; i < e.pts.length; i++) {
      const [ax, az] = e.pts[i - 1], [bx, bz] = e.pts[i];
      for (let cx = Math.floor(Math.min(ax, bx) / cell); cx <= Math.floor(Math.max(ax, bx) / cell); cx++) {
        for (let cz = Math.floor(Math.min(az, bz) / cell); cz <= Math.floor(Math.max(az, bz) / cell); cz++) {
          const key = cx + ',' + cz;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(k, i);
        }
      }
    }
  });
  return (x, z, reach = 30, ok = () => true) => {
    let best = null;
    const r = Math.ceil(reach / cell), cx = Math.floor(x / cell), cz = Math.floor(z / cell);
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
      const list = grid.get(cx + a + ',' + (cz + b));
      if (!list) continue;
      for (let j = 0; j < list.length; j += 2) {
        const e = edges[list[j]], i = list[j + 1];
        if (!ok(e)) continue;
        const [ax, az] = e.pts[i - 1], [bx, bz] = e.pts[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
        const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), px = ax + dx * f, pz = az + dz * f, d = Math.hypot(x - px, z - pz);
        if (d < reach && (!best || d < best.d)) best = { e, i, f, d, side: (x - px) * -dz + (z - pz) * dx >= 0 ? 1 : -1, t: [dx / Math.sqrt(L2), dz / Math.sqrt(L2)] };
      }
    }
    return best;
  };
}

// The buildings' walls, a point every 2 m in cells of 20 m, for whether a street is built up on a
// side, as track.mjs's kerbs tell it: a wall within 25 m out from the kerb, and 8 m along it.
function wallIndex(rings) {
  const grid = new Map();
  for (const pts of rings) for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
    for (let f = 0; f < n; f++) {
      const x = ax + ((bx - ax) * f) / n, z = az + ((bz - az) * f) / n, k = Math.floor(x / 20) + ',' + Math.floor(z / 20);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(x, z);
    }
  }
  return ([x, z], [nx, nz]) => {
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const list = grid.get(Math.floor(x / 20) + a + ',' + (Math.floor(z / 20) + b));
      if (!list) continue;
      for (let j = 0; j < list.length; j += 2) {
        const dx = list[j] - x, dz = list[j + 1] - z, out = dx * nx + dz * nz, along = -dx * nz + dz * nx;
        if (out > 0 && out < 25 && Math.abs(along) < 8) return true;
      }
    }
    return false;
  };
}

// Whether a street has a pavement on a side, as its tags say: true, false, or null when they don't.
// `separate` is a pavement the map draws as a footway of its own, which isn't fetched: it's there.
function sidewalk(t, right) {
  const side = right ? 'right' : 'left', v = t[`sidewalk:${side}`] ?? t['sidewalk:both'] ?? t.sidewalk;
  if (v == null) return null;
  if (['no', 'none', right ? 'left' : 'right'].includes(v)) return false;
  return true;
}

const surfaceOf = (k, t) => (COBBLE.has(t.surface) ? 'setts' : UNPAVED.has(t.surface) || (k === 8 && !t.surface) ? 'dirt' : k === 6 ? 'paving' : 'asphalt');
// A crossing with lines on the road (a zebra, or one with lights): what the map says, or a zebra
// where it says nothing, as most of Braga's are.
const marked = (t) => !['unmarked', 'no'].includes(t.crossing) && t['crossing:markings'] !== 'no';

// ---- The streets ----

// The surfaces of every street (osm.mjs's LINE kinds 0–8, not the railway) with a point in `box`,
// from `lines` (lines.mjs's streetLines: { k, w, pts, nodes, t, level }) and the heights of those off
// the ground (`heights`, above the sea; out above `elev0`); `nodes`, the crossings and traffic lights
// (fetch.mjs's street.json); `buildings`, `squares` and `water`, rings round them. Everything comes
// out cut to each of `cuts` ([{ id, box }], the box itself by default), in `cuts`, a Map by id:
// - carriageways: [{ surface, level, rings: [outer, ...holes], ys? }], surface asphalt, setts,
//   paving or dirt;
// - pavements: [{ kind, level, rings, ys? }], kind pavement, reservation or island;
// - kerbs: [{ h, level, pts, ys? }], h its height (0 where it's dropped at a crossing);
// - markings: [{ kind, w, dash, level, pts, ys? }], kind lane, centre, zebra or stop: a line w wide,
//   dashed [on, off] or solid (null); a zebra's line runs across the road, w is how deep it is;
// level ground, bridge or tunnel, and ys a height at each point (each ring's) off the ground.
export function streetSurfaces({ lines, heights = new Map(), elev0 = 0, nodes = [], buildings = [], squares = [], water = [], box, cuts = [{ id: 'box', box }], margin = 80 }) {
  const t0 = Date.now();
  const near = ([x, z], m) => x >= box.x0 - m && x <= box.x1 + m && z >= box.z0 - m && z <= box.z1 + m;
  const ways = lines.filter((l) => l.k <= 8 && l.pts.some((p) => near(p, margin)));
  const stopAt = new Map(nodes.filter((n) => n.tags).map((n) => [n.id, n.tags]));

  // The graph: a node wherever ways meet or end, and an edge between each two along a way.
  const count = new Map(), endOf = new Set();
  for (const l of ways) {
    if (l.nodes?.length !== l.pts.length) continue;
    for (const n of new Set(l.nodes)) count.set(n, (count.get(n) ?? 0) + 1);
    endOf.add(l.nodes[0]).add(l.nodes[l.nodes.length - 1]);
  }
  const isNode = (n) => endOf.has(n) || count.get(n) > 1;
  const edges = [];
  for (const l of ways) {
    const up = l.level === 1 || l.level === 2, ok = l.nodes?.length === l.pts.length;
    const cut = (i0, i1) => {
      const pts = l.pts.slice(i0, i1 + 1);
      if (lengthOf(pts) < 0.05) return;
      edges.push({ l, k: l.k, w: l.w, t: l.t, level: l.level, pts, nodes: ok ? l.nodes.slice(i0, i1 + 1) : [l.nodes?.[0], ...Array(Math.max(0, pts.length - 2)).fill(null), l.nodes?.at(-1)], ys: up ? pts.map((p) => (heights.get(p) ?? elev0) - elev0) : null, surface: surfaceOf(l.k, l.t) });
    };
    if (!ok) { cut(0, l.pts.length - 1); continue; }
    let i0 = 0;
    for (let i = 1; i < l.nodes.length; i++) if (i === l.nodes.length - 1 || isNode(l.nodes[i])) { cut(i0, i); i0 = i; }
  }
  // Each edge's carriageway: its band, cut square across where it meets another (so it ends on the
  // other's centre line, not in a roundabout's island), round at a dead end.
  const ends = new Map();
  for (const e of edges) for (const n of [e.nodes[0], e.nodes.at(-1)]) if (n != null) ends.set(n, (ends.get(n) ?? 0) + 1);
  for (const e of edges) {
    const caps = [[e.nodes[0], e.pts[0]], [e.nodes.at(-1), e.pts.at(-1)]].filter(([n]) => ends.get(n) === 1 || n == null).map(([, p]) => circle(p, e.w / 2, 24));
    e.poly = union(band([toPath(e.pts)], e.w / 2, true), caps);
  }

  // Which surfaces join: everything at the ground's level is one (a passage under a building is at
  // the ground's level too); each bridge, and each tunnel, is its own, the ways of its kind that meet.
  const groups = new Map([['ground', []]]);
  for (const level of [1, 2]) {
    const own = edges.filter((e) => e.level === level), at = new Map(), seen = new Set();
    for (const e of own) for (const n of [e.nodes[0], e.nodes.at(-1)]) if (n != null) at.set(n, [...(at.get(n) ?? []), e]);
    for (const e of own) {
      if (seen.has(e)) continue;
      const list = [], todo = [e];
      seen.add(e);
      while (todo.length) {
        const f = todo.pop();
        list.push(f);
        for (const n of [f.nodes[0], f.nodes.at(-1)]) for (const g of at.get(n) ?? []) if (!seen.has(g)) { seen.add(g); todo.push(g); }
      }
      groups.set(`${level === 1 ? 'bridge' : 'tunnel'}:${groups.size}`, list);
    }
  }
  for (const e of edges) if (e.level !== 1 && e.level !== 2) groups.get('ground').push(e);

  const B = buildings.filter((r) => r.length > 2 && r.some((p) => near(p, margin + 40))).map((r) => positive(toPath(r)));
  const W = water.filter((r) => r.length > 2 && r.some((p) => near(p, margin + 40))).map((r) => positive(toPath(r)));
  const Q = squares.filter((r) => r.length > 2 && r.some((p) => near(p, margin + 40))).map((r) => positive(toPath(r)));
  const built = wallIndex(buildings.filter((r) => r.some((p) => near(p, margin + 60))));
  const stats = { edges: edges.length, junctions: 0, islands: 0, reservations: 0, km: { kerb: 0, dropped: 0 }, m2: {} };

  // The carriageways of each group: each edge's band, the corners where they meet rounded.
  const made = new Map();
  for (const [key, list] of groups) {
    if (!list.length) continue;
    const U0 = union(...list.map((e) => e.poly));
    // Where the edges' bands are, in cells of 50 m, for the corners.
    const cells = new Map(), CELL = 50;
    list.forEach((e) => {
      const xs = e.pts.map((p) => p[0]), zs = e.pts.map((p) => p[1]), h = e.w / 2;
      for (let cx = Math.floor((Math.min(...xs) - h) / CELL); cx <= Math.floor((Math.max(...xs) + h) / CELL); cx++) for (let cz = Math.floor((Math.min(...zs) - h) / CELL); cz <= Math.floor((Math.max(...zs) + h) / CELL); cz++) {
        const k = cx + ',' + cz;
        if (!cells.has(k)) cells.set(k, new Set());
        cells.get(k).add(e);
      }
    });
    const around = ([x, z], r) => {
      const got = new Set();
      for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) for (const e of cells.get(cx + ',' + cz) ?? []) got.add(e);
      return [...got];
    };
    // A corner where streets meet, or a street turns at a node, rounded as a kerb turns it: the
    // carriageways round the node closed (grown then shrunk) by the kerb's radius, which fills what's
    // between the arms there and no more. What they enclose stays open (a roundabout's island, one
    // between a slip road and the corner), but for a sliver under 25 m².
    const arms = new Map();
    for (const e of list) [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]].forEach(([n, i]) => { if (n != null) arms.set(n, [...(arms.get(n) ?? []), { e, i, dir: heading(e.pts, i, i > 0) }]); });
    const fills = [];
    for (const [n, a] of arms) {
      if (a.length < 2) continue;
      if (a.length === 2 && a[0].dir[0] * a[1].dir[0] + a[0].dir[1] * a[1].dir[1] < -0.94) continue; // straight on
      const p = a[0].e.pts[a[0].i], r = R_KERB[Math.max(...a.map((x) => x.e.k))], hw = Math.max(...a.map((x) => x.e.w / 2));
      const R = Math.min(45, hw + 3 * r + 2), disc = [circle(p, R)], local = meet(union(...around(p, R).map((e) => e.poly)), disc);
      const enclosed = shapes(local).flatMap(([, ...holes]) => holes.filter((h) => Math.abs(C.Clipper.Area(h)) > 25 * S * S).map(positive));
      const fill = minus(meet(grow(grow(local, r), -r), disc), [...local, ...enclosed]);
      if (area(fill) > 0.05) fills.push({ paths: fill, surface: a.reduce((m, x) => (x.e.k < m.e.k ? x : m)).e.surface });
      stats.junctions += a.length > 2;
    }
    const U = union(U0, ...fills.map((f) => f.paths));
    // Each surface where its streets are, the bigger street's where two meet.
    const order = [...new Set(list.map((e) => e.k + ':' + e.surface))].sort((a, b) => parseInt(a) - parseInt(b));
    let taken = [];
    const bySurface = new Map();
    for (const ks of order) {
      const [k, s] = ks.split(':'), piece = minus(union(...list.filter((e) => e.k === +k && e.surface === s).map((e) => e.poly)), taken);
      bySurface.set(s, [...(bySurface.get(s) ?? []), ...piece]);
      taken = union(taken, piece);
    }
    // The corners, each the surface of the biggest street at its junction; where two junctions'
    // corners meet, the first surface's.
    for (const s of ['asphalt', 'setts', 'paving', 'dirt']) {
      const piece = minus(union(...fills.filter((f) => f.surface === s).map((f) => f.paths)), taken);
      if (!piece.length) continue;
      bySurface.set(s, [...(bySurface.get(s) ?? []), ...piece]);
      taken = union(taken, piece);
    }
    // Every surface but asphalt kept to the carriageways' outline, and asphalt the rest of it, so
    // together they're exactly what the pavements and islands are cut from.
    const others = [...bySurface].filter(([s]) => s !== 'asphalt').map(([s, p]) => [s, meet(union(p), U)]);
    made.set(key, { list, U, bySurface: new Map([['asphalt', minus(U, others.flatMap(([, p]) => p))], ...others]), arms });
  }

  // Where a bridge or a tunnel meets the ground's streets at its ends, its own carriageway: the
  // ground's stops there, so the two don't lie one on the other.
  const ground = made.get('ground');
  if (ground) for (const [key, g] of made) {
    if (key === 'ground') continue;
    const ends = [...g.arms.keys()].filter((n) => ground.arms.has(n)).map((n) => circle(g.arms.get(n)[0].e.pts[g.arms.get(n)[0].i], Math.max(...g.list.map((e) => e.w)) + 1));
    if (!ends.length) continue;
    const cut = meet(g.U, union(ends));
    ground.U = minus(ground.U, cut);
    for (const [s, p] of ground.bySurface) ground.bySurface.set(s, minus(p, cut));
  }

  // The heights of a group off the ground, at any point: its nearest centre line's, between its points.
  const yOf = (list) => {
    const find = lineIndex(list);
    return (x, z) => {
      const f = find(x, z, 60);
      if (!f) return list[0].ys[0];
      return f.e.ys[f.i - 1] + (f.e.ys[f.i] - f.e.ys[f.i - 1]) * f.f;
    };
  };
  // What comes out, cut to each box asked for: a piece wholly inside one goes as it is.
  const boxPath = [rect(box)];
  const levelName = (key) => (key === 'ground' ? 'ground' : key.split(':')[0]);
  const into = cuts.map((c) => ({ ...c, path: [rect(c.box)], out: { carriageways: [], pavements: [], kerbs: [], markings: [] } }));
  const boundsOf = (paths) => {
    const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
    for (const p of paths) for (const q of p) { b.x0 = Math.min(b.x0, q.X / S); b.x1 = Math.max(b.x1, q.X / S); b.z0 = Math.min(b.z0, q.Y / S); b.z1 = Math.max(b.z1, q.Y / S); }
    return b;
  };
  const meets = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const within = (a, b) => a.x0 >= b.x0 && a.x1 <= b.x1 && a.z0 >= b.z0 && a.z1 <= b.z1;
  const withYs = (o, ys, key, pts) => (ys ? { ...o, ys: key === 'rings' ? pts.map((r) => r.map(([x, z]) => Math.round(ys(x, z) * 10) / 10)) : pts.map(([x, z]) => Math.round(ys(x, z) * 10) / 10) } : o);
  const addShapes = (kind, paths, props, ys) => {
    for (const sh of shapes(paths)) {
      const b = boundsOf([sh[0]]);
      for (const c of into) {
        if (!meets(b, c.box)) continue;
        // To the nearest 10 cm, as the tiles keep them, by Clipper on a 10 cm grid, so no ring
        // rounded crosses itself or another.
        for (const piece of within(b, c.box) ? [sh] : shapes(meet(sh, c.path))) for (const snapped of shapes(piece.map((r) => r.map((q) => ({ X: Math.round(q.X / 10), Y: Math.round(q.Y / 10) }))), true)) {
          const rings = snapped.map((r) => r.map((q) => [q.X / 10, q.Y / 10])).filter((r) => r.length > 2);
          if (!rings.length || Math.abs(C.Clipper.Area(snapped[0])) / 100 < 0.25) continue;
          c.out[kind].push(withYs({ ...props, rings }, ys, 'rings', rings));
        }
      }
    }
  };
  // Lines thinned to within 3 cm of themselves first: a kerb was looked at every 4 m along it.
  const addLines = (kind, paths, props, ys) => {
    for (const p of paths) {
      const path = toPath(openThin(toPts(p), 0.03)), b = boundsOf([path]);
      for (const c of into) {
        if (!meets(b, c.box) && !(b.x0 === b.x1 || b.z0 === b.z1)) continue;
        for (const q of within(b, c.box) ? [path] : cutLines([path], c.path, true)) {
          const pts = toPts(q);
          if (pts.length < 2 || lengthOf(pts) < 0.3) continue;
          c.out[kind].push(withYs({ ...props, pts }, ys, 'pts', pts));
        }
      }
    }
  };

  for (const [key, g] of made) {
    const level = levelName(key), ys = level === 'ground' ? null : yOf(g.list), U = g.U;
    const inU = insideOf(U), owner = lineIndex(g.list);
    for (const [surface, paths] of g.bySurface) {
      addShapes('carriageways', paths, { surface, level }, ys);
      stats.m2[surface] = (stats.m2[surface] ?? 0) + area(meet(paths, boxPath));
    }

    // The edge of the carriageways, in pieces of up to 4 m, each with the way out from it and the
    // street it's the edge of. Islands: the holes the carriageways go round with nothing built in
    // them, small, or a roundabout's.
    let islands = [];
    if (level !== 'tunnel') for (const [, ...holes] of shapes(U)) for (const h of holes) {
      const a = Math.abs(area([h])), pts = toPts(h), inH = insideOf([h]);
      const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]), hb = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
      const by = pts.filter((_, i) => i % 4 === 0).map(([x, z]) => owner(x, z, 20)), share = (f) => by.filter((o) => o && f(o.e)).length / (by.length || 1);
      const round = share((e) => e.t.junction === 'roundabout'), service = share((e) => e.k >= 7);
      const builtOn = buildings.some((r) => r.length && r[0][0] >= hb.x0 && r[0][0] <= hb.x1 && r[0][1] >= hb.z0 && r[0][1] <= hb.z1 && inH(r[0][0], r[0][1]) && inH(r[Math.floor(r.length / 2)][0], r[Math.floor(r.length / 2)][1]));
      if ((a < ISLAND && !builtOn && service < 0.5) || round > 0.6) islands.push(positive(h));
    }
    stats.islands += islands.length;
    // As Clipper rounds them, kept off the carriageways.
    islands = minus(union(islands), U);
    const inIsland = insideOf(islands);
    const pieces = [];
    for (const ring of U) {
      const pts = toPts(ring), list = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = dist(a, b), n = Math.max(1, Math.ceil(L / PIECE));
        if (L < 1e-3) continue;
        const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
        for (let k = 0; k < n; k++) {
          const p = [a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)], q = [a[0] + (b[0] - a[0]) * ((k + 1) / n), a[1] + (b[1] - a[1]) * ((k + 1) / n)];
          const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          let nrm = [-tz, tx];
          if (inU(m[0] + nrm[0] * 0.05, m[1] + nrm[1] * 0.05)) nrm = [tz, -tx];
          list.push({ p, q, m, nrm, island: inIsland(m[0] + nrm[0] * 0.3, m[1] + nrm[1] * 0.3), own: owner(m[0], m[1], 30) });
        }
      }
      if (list.length) pieces.push(list);
    }

    // The central reservations: between a one-way carriageway and another running the other way
    // beside it, up to 14 m apart, for 30 m or more.
    let res = [];
    if (level === 'ground') {
      const one = g.list.filter((e) => e.k <= 5 && isOneway(e.t) && e.t.junction !== 'roundabout'), find = lineIndex(one);
      for (const A of one) {
        const L = lengthOf(A.pts), steps = Math.floor(L / 4);
        let run = [], other = null, gap = 0;
        const flush = () => {
          if (run.length >= 2 && lengthOf(run) >= 30) {
            const r = meet(band([toPath(run)], A.w / 2 + gap + 0.5, true), band([toPath(other.pts)], other.w / 2 + gap + 0.5));
            if (area(r) > 2) { res.push(...r); stats.reservations++; }
          }
          run = []; other = null; gap = 0;
        };
        for (let s = 0; s <= steps; s++) {
          const p = along(A.pts, (s / Math.max(1, steps)) * L), d = p.t;
          let hit = null;
          for (const side of [1, -1]) {
            const probe = [p.p[0] - d[1] * side * (A.w / 2 + 3), p.p[1] + d[0] * side * (A.w / 2 + 3)];
            const f = find(probe[0], probe[1], 14, (e) => e !== A);
            if (!f || f.t[0] * d[0] + f.t[1] * d[1] > -0.94) continue;
            const o = Math.hypot(f.e.pts[f.i - 1][0] + (f.e.pts[f.i][0] - f.e.pts[f.i - 1][0]) * f.f - p.p[0], f.e.pts[f.i - 1][1] + (f.e.pts[f.i][1] - f.e.pts[f.i - 1][1]) * f.f - p.p[1]);
            const g2 = o - A.w / 2 - f.e.w / 2;
            if (g2 > 0.3 && g2 < 14) hit = { e: f.e, g: g2 };
          }
          if (hit && (!other || hit.e === other)) { other = hit.e; gap = Math.max(gap, hit.g); run.push(p.p); }
          else { flush(); if (hit) { other = hit.e; gap = hit.g; run.push(p.p); } }
        }
        flush();
      }
      res = minus(union(res), [...U, ...B, ...islands]);
    }
    const inRes = insideOf(res);

    // The pavements: as far out from the carriageways as PAVE, or a building, or the water, lets
    // them; then none along each edge whose street has none on that side (its tags, or out in the
    // open, or a street with no pavements: the fast roads, service roads, tracks and pedestrian
    // streets, whose paving runs to the walls). On a bridge 1.5 m, as party-kart draws its decks;
    // in a tunnel, none.
    let pave = [];
    if (level === 'ground') {
      const want = (pc) => {
        if (pc.island || inRes(pc.m[0] + pc.nrm[0] * 0.3, pc.m[1] + pc.nrm[1] * 0.3)) return true;
        const o = pc.own;
        if (!o) return false;
        const tag = sidewalk(o.e.t, o.side > 0);
        if (o.e.k === 6) return false;
        if (tag !== null) return tag;
        if (o.e.k <= 1 || o.e.k >= 7) return false;
        return built(pc.m, pc.nrm);
      };
      const none = [];
      for (const list of pieces) {
        const ok = list.map(want), start = ok.indexOf(true);
        if (start < 0) { none.push(toPath([...list.map((pc) => pc.p), list[0].p])); continue; }
        let run = [];
        for (let j = 1; j <= list.length; j++) {
          const i = (start + j) % list.length;
          if (!ok[i] && j < list.length) { if (!run.length) run.push(list[i].p); run.push(list[i].q); }
          else if (run.length) { none.push(toPath(run)); run = []; }
        }
      }
      pave = minus(grow(U, PAVE), [...U, ...B, ...W]);
      pave = minus(pave, [...band(none, PAVE + 0.5, true), ...res, ...islands]);
      pave = union(pave, minus(Q, [...U, ...B, ...W, ...res, ...islands]));
    } else if (level === 'bridge' && !g.list.some((e) => e.k <= 1 || sidewalk(e.t, true) === false)) {
      pave = minus(grow(U, 1.5), U);
    }
    pave = shapes(pave).filter((sh) => Math.abs(C.Clipper.Area(sh[0])) / (S * S) > 1).flat();
    addShapes('pavements', pave, { kind: 'pavement', level }, ys);
    addShapes('pavements', res, { kind: 'reservation', level }, ys);
    addShapes('pavements', islands, { kind: 'island', level }, ys);
    stats.m2.pavement = (stats.m2.pavement ?? 0) + area(meet(pave, boxPath));

    // The kerbs: the edge of the carriageway wherever a pavement, a reservation or an island is
    // behind it, dropped where a crossing meets it.
    const inPave = insideOf(pave);
    const crossings = [];
    for (const e of g.list) e.nodes.forEach((n, i) => {
      const t = stopAt.get(n);
      if (!t || (t.highway !== 'crossing' && !t.crossing)) return;
      const [dx, dz] = heading(e.pts, i, i === e.pts.length - 1), s = i === e.pts.length - 1 ? -1 : 1, p = e.pts[i];
      const ax = dx * s, az = dz * s, half = e.w / 2 + PAVE + 1;
      crossings.push({ n, e, p, t, d: [ax, az], zone: toPath([[p[0] - ax * 2.5 - az * half, p[1] - az * 2.5 + ax * half], [p[0] + ax * 2.5 - az * half, p[1] + az * 2.5 + ax * half], [p[0] + ax * 2.5 + az * half, p[1] + az * 2.5 - ax * half], [p[0] - ax * 2.5 + az * half, p[1] - az * 2.5 - ax * half]]) });
    });
    const inDrop = insideOf(crossings.map((c) => positive(c.zone)));
    if (level !== 'tunnel') for (const list of pieces) {
      const hOf = (pc) => {
        const o = [pc.m[0] + pc.nrm[0] * 0.4, pc.m[1] + pc.nrm[1] * 0.4];
        if (!(pc.island || inPave(...o) || inRes(...o))) return null;
        if (pc.own?.e.k === 6) return null;
        return inDrop(...pc.m) ? 0 : KERB;
      };
      const hs = list.map(hOf);
      let start = hs.findIndex((h, i) => h !== hs[(i - 1 + hs.length) % hs.length]);
      if (start < 0) start = 0;
      let run = [], h = hs[start];
      const flush = () => {
        if (run.length > 1 && h !== null) {
          addLines('kerbs', [toPath(run)], { h, level }, ys);
          stats.km[h ? 'kerb' : 'dropped'] += lengthOf(run) / 1000;
        }
        run = [];
      };
      for (let j = 0; j < list.length; j++) {
        const i = (start + j) % list.length;
        if (hs[i] !== h) { flush(); h = hs[i]; }
        if (!run.length) run.push(list[i].p);
        run.push(list[i].q);
      }
      if (hs.every((x) => x === h) && run.length) run.push(run[0]);
      flush();
    }

    // The lines painted on each street, as many lanes as the map says, each lane at least 2.5 m:
    // between the lanes dashed, between the two ways dashed too, or solid with four lanes or more
    // (as party-kart's track has them). They stop where another street's carriageway, or a corner,
    // begins, and 1 m short of a zebra.
    const zebras = crossings.filter((c) => marked(c.t)).filter((c, i, all) => all.findIndex((d) => d.n === c.n) === i);
    const keepOff = (e) => {
      const at = [];
      for (const n of [e.nodes[0], e.nodes.at(-1)]) {
        const a = g.arms.get(n);
        if (a?.length > 2) for (const x of a) if (x.e !== e) at.push(...x.e.poly);
      }
      return at;
    };
    const zebraZones = zebras.map((c) => positive(toPath(rectAcross(c.p, c.d, c.e.w / 2 + 0.5, ZEBRA / 2 + 1))));
    for (const e of g.list) {
      const n = lanesOf(e.t), one = isOneway(e.t);
      if (n < 2 || e.w / n < 2.5) continue;
      const back = one ? 0 : Math.max(1, Math.min(n - 1, parseInt(e.t['lanes:backward']) || Math.floor(n / 2)));
      const lw = e.w / n, off = [...keepOff(e), ...zebraZones];
      for (let i = 1; i < n; i++) {
        const centre = !one && i === back, ln = cutLines([toPath(shift(e.pts, -e.w / 2 + i * lw))], off, false);
        addLines('markings', cutLines(ln, e.poly, true), { kind: centre ? 'centre' : 'lane', w: LINE_W, dash: centre && n >= 4 ? null : DASH, level }, ys);
      }
    }
    for (const c of zebras) {
      const across = [-c.d[1], c.d[0]], h = c.e.w / 2 - 0.3;
      addLines('markings', [toPath([[c.p[0] - across[0] * h, c.p[1] - across[1] * h], [c.p[0] + across[0] * h, c.p[1] + across[1] * h]])], { kind: 'zebra', w: ZEBRA, dash: null, level }, ys);
    }
    // A stop line where the map has traffic lights on a street, across the side they stop.
    for (const e of g.list) e.nodes.forEach((n, i) => {
      const t = stopAt.get(n);
      if (t?.highway !== 'traffic_signals' || t.crossing) return;
      const [dx, dz] = heading(e.pts, i, i === e.pts.length - 1), s = i === e.pts.length - 1 ? -1 : 1, across = [-dz * s, dx * s], p = e.pts[i];
      const dir = t['traffic_signals:direction'], h = e.w / 2 - 0.3;
      const [a, b] = isOneway(e.t) || !['forward', 'backward'].includes(dir) ? [-h, h] : dir === 'forward' ? [0, h] : [-h, 0];
      addLines('markings', [toPath([[p[0] + across[0] * a, p[1] + across[1] * a], [p[0] + across[0] * b, p[1] + across[1] * b]])], { kind: 'stop', w: STOP, dash: null, level }, ys);
    });
  }

  stats.seconds = (Date.now() - t0) / 1000;
  return { cuts: new Map(into.map((c) => [c.id, c.out])), stats };
}

// ---- In the tiles ----

// What each piece is, in a tile's `streets` part: its code, and 16 times its level.
export const STREET = ['asphalt', 'setts', 'paving', 'dirt', 'pavement', 'reservation', 'island', 'kerb', 'lane', 'centre', 'zebra', 'stop'];
const LEVELS = ['ground', 'bridge', 'tunnel'];

// One tile's streets as 16-bit numbers, for index.js: each piece [what, ...], what its STREET code
// and 16 times its level; points in decimetres, the first of each ring or line from the tile's
// corner (x0, z0), each after it the step from the one before; and off the ground, the height of
// each point after them, in decimetres above ELEV0.
// - A carriageway, pavement, reservation or island: [what, rings, then each ring's n and points],
//   its outline first, then its holes.
// - A kerb: [what, its height in cm, 0, n, points]. A marking: [what, its width in cm, 1 if it's
//   dashed (3 m on, 4 m off) or 0, n, points].
export function packStreets(got, x0, z0) {
  const out = [], dmOf = (v) => Math.round(v * 10);
  const pts = (list) => { let px = 0, pz = 0; list.forEach(([x, z], i) => { const a = dmOf(x - x0), b = dmOf(z - z0); out.push(i ? a - px : a, i ? b - pz : b); px = a; pz = b; }); };
  const what = (name, level) => STREET.indexOf(name) + 16 * LEVELS.indexOf(level);
  for (const p of [...got.carriageways, ...got.pavements]) {
    out.push(what(p.surface ?? p.kind, p.level), p.rings.length);
    for (const r of p.rings) { out.push(r.length); pts(r); }
    if (p.ys) for (const r of p.ys) for (const y of r) out.push(dmOf(y));
  }
  for (const k of got.kerbs) {
    out.push(what('kerb', k.level), Math.round(k.h * 100), 0, k.pts.length);
    pts(k.pts);
    if (k.ys) for (const y of k.ys) out.push(dmOf(y));
  }
  for (const m of got.markings) {
    out.push(what(m.kind, m.level), Math.round(m.w * 100), m.dash ? 1 : 0, m.pts.length);
    pts(m.pts);
    if (m.ys) for (const y of m.ys) out.push(dmOf(y));
  }
  return out;
}

// The point d metres along a line, and the way it runs there.
function along(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const L = dist(pts[i - 1], pts[i]);
    if (d <= L || i === pts.length - 1) {
      const f = Math.min(1, d / (L || 1)), t = [(pts[i][0] - pts[i - 1][0]) / (L || 1), (pts[i][1] - pts[i - 1][1]) / (L || 1)];
      return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f], t };
    }
    d -= L;
  }
  return { p: pts[0], t: [1, 0] };
}

// A rectangle centred on p, running along d: `across` either side of it, `ahead` along it each way.
function rectAcross(p, d, across, ahead) {
  const [ax, az] = d, [nx, nz] = [-az, ax];
  return [[p[0] - ax * ahead - nx * across, p[1] - az * ahead - nz * across], [p[0] + ax * ahead - nx * across, p[1] + az * ahead - nz * across], [p[0] + ax * ahead + nx * across, p[1] + az * ahead + nz * across], [p[0] - ax * ahead + nx * across, p[1] - az * ahead + nz * across]];
}

// ---- On its own: the streets in a box, and a page to look at them over the orthophoto ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [{ CACHE, ELEV0, readCache }, { terrain }, { streetLines }, { ortho }, { loadWorld }, jpeg] = await Promise.all([import('./geo.mjs'), import('./terrain.mjs'), import('./lines.mjs'), import('./dgt.mjs'), import('../index.js'), import('jpeg-js')]);
  const a = process.argv.slice(2).map(Number);
  const box = a.length === 4 ? { x0: a[0], x1: a[1], z0: a[2], z1: a[3] } : { x0: -450, x1: 450, z0: 500, z1: 1150 };
  const ground = await terrain();
  const { lines, heights } = streetLines(readCache('osm/base.json'), ground, (x, z, m) => x >= box.x0 - 300 - m && x <= box.x1 + 300 + m && z >= box.z0 - 300 - m && z <= box.z1 + 300 + m);
  const world = await loadWorld({ x0: box.x0 - 200, x1: box.x1 + 200, z0: box.z0 - 200, z1: box.z1 + 200 });
  const nodes = readCache('osm/street.json').elements.filter((e) => e.type === 'node');
  const made = streetSurfaces({
    lines, heights, elev0: ELEV0, nodes, box,
    buildings: world.buildings.map((b) => b.pts),
    squares: world.areas.filter((x) => x.kind === 'plaza').map((x) => x.pts),
    water: world.areas.filter((x) => x.kind === 'water').map((x) => x.pts),
  });
  const got = { ...made.cuts.get('box'), stats: made.stats }, s = got.stats;
  console.log(`${s.edges} edges, ${s.junctions} junctions, ${s.islands} islands, ${s.reservations} reservations, in ${s.seconds} s`);
  console.log(`carriageways ${Object.entries(s.m2).filter(([k]) => k !== 'pavement').map(([k, v]) => `${k} ${Math.round(v)} m²`).join(', ')}; pavements ${Math.round(s.m2.pavement)} m²; kerbs ${s.km.kerb.toFixed(2)} km, ${s.km.dropped.toFixed(2)} km dropped`);
  console.log(`${got.carriageways.length} carriageway pieces, ${got.pavements.length} pavements, ${got.kerbs.length} kerbs, ${got.markings.length} markings (${['lane', 'centre', 'zebra', 'stop'].map((k) => `${got.markings.filter((m) => m.kind === k).length} ${k}`).join(', ')})`);
  // Buildings on a carriageway: where the map's width, or its guess, is wider than the street.
  const roads = union(got.carriageways.flatMap((c) => c.rings.map((r, i) => (i ? positive(toPath(r)).reverse() : positive(toPath(r)))))), onRoad = insideOf(roads);
  const inBox = world.buildings.filter((b) => b.pts.some((p) => p[0] >= box.x0 && p[0] <= box.x1 && p[1] >= box.z0 && p[1] <= box.z1));
  const over = inBox.filter((b) => b.pts.some((p) => onRoad(...p))).length, m2 = area(meet(union(inBox.map((b) => positive(toPath(b.pts)))), roads));
  console.log(`${over} buildings have a corner on a carriageway; ${Math.round(m2)} m² of buildings stand on them`);

  const dir = path.join(CACHE, 'streets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'streets.json'), JSON.stringify({ box, ...got }));
  // The orthophoto under the box, at 50 cm a pixel.
  const px = 0.5, w = Math.round((box.x1 - box.x0) / px), h = Math.round((box.z1 - box.z0) / px), colour = await ortho(box), data = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const c = colour(box.x0 + (i + 0.5) * px, box.z0 + (j + 0.5) * px) ?? [128, 128, 128], k = (j * w + i) * 4;
    data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2]; data[k + 3] = 255;
  }
  fs.writeFileSync(path.join(dir, 'ortho.jpg'), jpeg.default.encode({ data, width: w, height: h }, 82).data);
  fs.writeFileSync(path.join(dir, 'index.html'), page(box, got));
  console.log(`${path.join(dir, 'index.html')}`);
}

// The page: the orthophoto, and over it the streets' surfaces, each kind on a layer of its own.
function page(box, got) {
  const ring = (r) => 'M' + r.map(([x, z]) => `${x} ${z}`).join('L') + 'Z';
  const poly = (list, cls) => list.map((p) => `<path class="${cls}" d="${p.rings.map(ring).join('')}"/>`).join('');
  const line = (list, attrs) => list.map((l) => `<path ${attrs(l)} d="M${l.pts.map(([x, z]) => `${x} ${z}`).join('L')}"/>`).join('');
  const W = box.x1 - box.x0, H = box.z1 - box.z0;
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>As ruas como superfícies</title>
<style>
:root { color-scheme: light dark; --bg: #f4f1ea; --fg: #222; --panel: rgba(255,255,255,.92); }
@media (prefers-color-scheme: dark) { :root { --bg: #16171a; --fg: #e6e3dc; --panel: rgba(30,31,35,.92); } }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, sans-serif; }
svg { width: 100vw; height: 100vh; display: block; cursor: grab; touch-action: none; }
.panel { position: fixed; top: 12px; left: 12px; background: var(--panel); padding: 10px 12px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,.2); max-width: 280px; }
.panel label { display: block; }
.credit { position: fixed; bottom: 6px; right: 8px; font-size: 11px; background: var(--panel); padding: 2px 6px; border-radius: 6px; }
.asphalt { fill: rgba(30,30,38,.55); } .setts { fill: rgba(140,95,60,.6); } .paving { fill: rgba(225,205,160,.6); } .dirt { fill: rgba(160,120,70,.5); }
.pavement { fill: rgba(250,235,200,.55); } .reservation { fill: rgba(70,170,80,.55); } .island { fill: rgba(40,190,90,.6); }
.asphalt, .setts, .paving, .dirt, .pavement, .reservation, .island { fill-rule: evenodd; }
.kerb { fill: none; stroke: #fff; stroke-width: .3; } .kerb.dropped { stroke: #ff8a00; stroke-width: .5; }
.lane, .centre { fill: none; stroke: #ffe600; stroke-width: .3; } .stop { fill: none; stroke: #ff2bd6; }
.zebra { fill: none; stroke: #fff; stroke-dasharray: .5 .5; opacity: .9; }
</style></head><body>
<svg id="v" viewBox="${box.x0} ${box.z0} ${W} ${H}">
<image href="ortho.jpg" x="${box.x0}" y="${box.z0}" width="${W}" height="${H}" preserveAspectRatio="none"/>
<g id="carriageways">${['asphalt', 'setts', 'paving', 'dirt'].map((s) => poly(got.carriageways.filter((c) => c.surface === s), s)).join('')}</g>
<g id="pavements">${['pavement', 'reservation', 'island'].map((k) => poly(got.pavements.filter((p) => p.kind === k), k)).join('')}</g>
<g id="kerbs">${line(got.kerbs, (k) => `class="kerb${k.h ? '' : ' dropped'}"`)}</g>
<g id="markings">${line(got.markings, (m) => `class="${m.kind}" stroke-width="${m.w}"${m.dash ? ` stroke-dasharray="${m.dash.join(' ')}"` : ''}`)}</g>
</svg>
<div class="panel"><b>As ruas como superfícies</b> (tarefa 033)<br>
${[['carriageways', 'Faixas de rodagem'], ['pavements', 'Passeios, separadores e ilhas'], ['kerbs', 'Lancis (laranja: rebaixados)'], ['markings', 'Marcas na estrada']].map(([id, t]) => `<label><input type="checkbox" checked data-g="${id}"> ${t}</label>`).join('')}
<small>Roda para fazer zoom, arrasta para mover.</small></div>
<div class="credit">Ruas: © OpenStreetMap contributors (ODbL). Ortofoto 2025: informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).</div>
<script>
const v = document.getElementById('v');
let vb = v.getAttribute('viewBox').split(' ').map(Number);
const set = () => v.setAttribute('viewBox', vb.join(' '));
document.querySelectorAll('[data-g]').forEach((c) => c.onchange = () => document.getElementById(c.dataset.g).style.display = c.checked ? '' : 'none');
v.addEventListener('wheel', (e) => { e.preventDefault(); const r = v.getBoundingClientRect(), k = Math.exp(e.deltaY * 0.0015), s = Math.max(vb[2] / r.width, vb[3] / r.height);
  const mx = vb[0] + (e.clientX - r.left) * s - (r.width * s - vb[2]) / 2, mz = vb[1] + (e.clientY - r.top) * s - (r.height * s - vb[3]) / 2;
  vb = [mx - (mx - vb[0]) * k, mz - (mz - vb[1]) * k, vb[2] * k, vb[3] * k]; set(); }, { passive: false });
let drag = null;
v.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, vb[0], vb[1]]; v.setPointerCapture(e.pointerId); });
v.addEventListener('pointermove', (e) => { if (!drag) return; const r = v.getBoundingClientRect(), s = Math.max(vb[2] / r.width, vb[3] / r.height); vb[0] = drag[2] - (e.clientX - drag[0]) * s; vb[1] = drag[3] - (e.clientY - drag[1]) * s; set(); });
v.addEventListener('pointerup', () => drag = null);
const q = new URLSearchParams(location.search).get('at');
if (q) { const [x, z, w] = q.split(',').map(Number); vb = [x - w / 2, z - w / 2 * ${H / W}, w, w * ${H / W}]; set(); }
</script></body></html>`;
}
