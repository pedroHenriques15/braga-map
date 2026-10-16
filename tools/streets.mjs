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
// A deck or a tunnel's road within this of the ground is at its level: nothing passes under it, so
// nothing on the ground lies over it, nor its pavements on the ground's road (task 040).
const GRADE = 2;
// How far a deck's end follows the ground across it, from its own height: farther off, the ground
// there is an embankment's side, not the street it meets.
const TWIST = 0.5;
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
// Closed by d metres: grown, then shrunk, which fills what's narrower than 2d between them and rounds
// an inside corner; or opened, shrunk then grown, which takes away what's narrower than 2d. In
// millimetres, so where nothing changes an edge comes back to the centimetre.
function twice(paths, d) {
  const o = new C.ClipperOffset(2, 0.04 * S * 10), a = [], b = [];
  o.AddPaths(paths.map((p) => p.map((q) => ({ X: q.X * 10, Y: q.Y * 10 }))), C.JoinType.jtRound, C.EndType.etClosedPolygon);
  o.Execute(a, d * S * 10);
  o.Clear();
  o.AddPaths(a, C.JoinType.jtRound, C.EndType.etClosedPolygon);
  o.Execute(b, -d * S * 10);
  return b.map((p) => p.map((q) => ({ X: Math.round(q.X / 10), Y: Math.round(q.Y / 10) })));
}
const closed = (paths, d) => twice(paths, d), opened = (paths, d) => twice(paths, -d);
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
// Snap rounding (task 048): every point of some rings, rounded to the 10 cm grid, makes its 10 cm
// square hot; and a ring is rounded by running each of its edges through every hot square it passes
// through, in order along it. Two pieces that meet along an edge pass through the same squares there,
// so they come out with the same points, and a point a few centimetres wide folds flat on both sides
// of it alike. So that they do have the same edge, each first takes the points of the others that
// lie on it, within 2 cm, as Clipper leaves them (in whole centimetres, and a point within 1.4 cm of
// the line from the one before to the one after taken out). Each stretch is measured from its first
// end (west, then north), so that the pieces either side of it, which run it opposite ways, find the
// same points and squares on it to the last bit.
function snapRounding(rings) {
  const CELL = 500, NEAR = 2, points = new Map(), squares = new Map(), seen = new Set(), key = (i, j) => (i + 5e5) * 1e6 + j + 5e5;
  const add = (m, q) => { const k = key(Math.floor(q.X / CELL), Math.floor(q.Y / CELL)); if (!m.has(k)) m.set(k, []); m.get(k).push(q); };
  for (const r of rings) for (const q of r) {
    const h = { X: Math.round(q.X / 10) * 10, Y: Math.round(q.Y / 10) * 10 }, id = key(h.X, h.Y);
    add(points, q);
    if (!seen.has(id)) { seen.add(id); add(squares, h); }
  }
  // What of a map lies in the cells along an edge from p to q and either side of it, as f takes it:
  // [how far along it, the thing], in order along it, measured from its first end.
  const along = (m, a, b, f) => {
    const back = b.X < a.X || (b.X === a.X && b.Y < a.Y), [p, q] = back ? [b, a] : [a, b], dx = q.X - p.X, dy = q.Y - p.Y, L2 = dx * dx + dy * dy, n = Math.ceil(Math.sqrt(L2) / CELL) || 1;
    const looked = new Set(), got = [];
    for (let s = 0; s <= n; s++) {
      const ci = Math.floor((p.X + (dx * s) / n) / CELL), cj = Math.floor((p.Y + (dy * s) / n) / CELL);
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
        const k = key(ci + u, cj + v);
        if (looked.has(k)) continue;
        looked.add(k);
        for (const h of m.get(k) ?? []) if (f(p, q, h)) got.push([L2 ? ((h.X - p.X) * dx + (h.Y - p.Y) * dy) / L2 : 0, h]);
      }
    }
    got.sort((g, o) => g[0] - o[0] || g[1].X - o[1].X || g[1].Y - o[1].Y);
    return (back ? got.reverse() : got).map(([, h]) => h);
  };
  // A point on the edge, between its ends; a hot square it meets (not all the square's corners on one
  // side of it, and their boxes meeting).
  const on = (p, q, h) => {
    const dx = q.X - p.X, dy = q.Y - p.Y, t = (h.X - p.X) * dx + (h.Y - p.Y) * dy;
    return t > 0 && t < dx * dx + dy * dy && Math.abs((h.Y - p.Y) * dx - (h.X - p.X) * dy) <= NEAR * Math.hypot(dx, dy);
  };
  const meets = (p, q, h) => {
    if (Math.max(p.X, q.X) < h.X - 5 || Math.min(p.X, q.X) > h.X + 5 || Math.max(p.Y, q.Y) < h.Y - 5 || Math.min(p.Y, q.Y) > h.Y + 5) return false;
    const side = [[-5, -5], [5, -5], [5, 5], [-5, 5]].map(([u, v]) => Math.sign((q.X - p.X) * (h.Y + v - p.Y) - (q.Y - p.Y) * (h.X + u - p.X)));
    return !side.every((s) => s > 0) && !side.every((s) => s < 0);
  };
  return (r) => {
    const out = [], put = (h) => { if (!out.length || h.X !== out.at(-1).X || h.Y !== out.at(-1).Y) out.push(h); };
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], stretch = [a, ...along(points, a, b, on), b];
      for (let k = 1; k < stretch.length; k++) for (const h of along(squares, stretch[k - 1], stretch[k], meets)) put(h);
    }
    while (out.length > 1 && out[0].X === out.at(-1).X && out[0].Y === out.at(-1).Y) out.pop();
    return out;
  };
}
// Some rings to the nearest 10 cm, as the tiles keep them: as shapes, in decimetres, none of whose
// rings crosses itself or another. Clipper on the 10 cm grid cuts off a piece's point where it's
// narrower than 10 cm, and leaves a crack beside it (task 048): in centimetres it leaves every point
// where it is but where rounding made two edges cross, and puts one there, which is rounded in turn;
// on the 10 cm grid only if that doesn't settle.
function rounded(rings) {
  let dm = rings.map((r) => r.map((q) => ({ X: Math.round(q.X / 10), Y: Math.round(q.Y / 10) })));
  for (let k = 0; k < 4; k++) {
    const cm = shapes(dm.map((r) => r.map((q) => ({ X: q.X * 10, Y: q.Y * 10 }))), true).flat();
    if (!cm.some((r) => r.some((q) => q.X % 10 || q.Y % 10))) return regroup(cm.map((r) => r.map((q) => ({ X: q.X / 10, Y: q.Y / 10 }))));
    dm = cm.map((r) => r.map((q) => ({ X: Math.round(q.X / 10), Y: Math.round(q.Y / 10) })));
  }
  return regroup(shapes(dm, true).flat());
}
// Rings as shapes, each outline with the holes in it: a hole in the smallest outline round it.
// clipper-lib's tree now and then gives a hole to another outline, far off (task 048).
function regroup(rings) {
  const boxOf = (r) => ({ x0: Math.min(...r.map((q) => q.X)), x1: Math.max(...r.map((q) => q.X)), y0: Math.min(...r.map((q) => q.Y)), y1: Math.max(...r.map((q) => q.Y)) });
  const outers = rings.filter((r) => C.Clipper.Orientation(r)).map((r) => ({ r, a: C.Clipper.Area(r), b: boxOf(r), holes: [] }));
  for (const h of rings.filter((r) => !C.Clipper.Orientation(r))) {
    const hb = boxOf(h);
    let best = null;
    for (const o of outers) {
      if (hb.x0 < o.b.x0 || hb.x1 > o.b.x1 || hb.y0 < o.b.y0 || hb.y1 > o.b.y1 || (best && o.a >= best.a)) continue;
      if (h.map((q) => C.Clipper.PointInPolygon(q, o.r)).find((side) => side !== -1) !== 0) best = o;
    }
    if (best) best.holes.push(h);
  }
  return outers.map((o) => [o.r, ...o.holes]);
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

// For track.mjs, which cuts the race's road out of the streets.
export { band, grow, meet, minus, positive, shapes, toPath, toPts, union };

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
// the ground (`heights`, above the sea; out above `elev0`), and `height`, the ground's at (x, z) as the
// tiles hold it, above the sea, for a deck's ends; `nodes`, the crossings and traffic lights
// (fetch.mjs's street.json); `buildings`, `squares` and `water`, rings round them. Everything comes
// out cut to each of `cuts` ([{ id, box }], the box itself by default), in `cuts`, a Map by id:
// - carriageways: [{ surface, level, rings: [outer, ...holes], ys? }], surface asphalt, setts,
//   paving or dirt;
// - pavements: [{ kind, level, rings, ys? }], kind pavement, reservation or island;
// - kerbs: [{ h, level, pts, ys? }], h its height (0 where it's dropped at a crossing);
// - markings: [{ kind, w, dash, level, pts, ys? }], kind lane, centre, zebra or stop: a line w wide,
//   dashed [on, off] or solid (null); a zebra's line runs across the road, w is how deep it is;
// - paths: [{ kind, surface, level, raised, rings, ys? }], the footways, paths, cycleways and flights
//   of steps (task 050, groundPaths below) from `paths` (lines.mjs's pathsOf, each with ys, its
//   points' heights, on a bridge or in a tunnel, and a flight of steps with its `flight`): level
//   ground, under (a passage under a building), bridge or tunnel; raised, flush with the pavement it
//   runs in, a kerb over the ground; ys a tread's height at each of its points, or a footbridge's;
// - handrails: [{ level, pts, ys }], along a flight of steps, ys the rail's top;
// level ground, bridge or tunnel, and ys a height at each point (each ring's) off the ground.
export function streetSurfaces({ lines, heights = new Map(), elev0 = 0, height = null, nodes = [], buildings = [], squares = [], water = [], paths = [], box, cuts = [{ id: 'box', box }], margin = 80 }) {
  const t0 = Date.now();
  const near = ([x, z], m) => x >= box.x0 - m && x <= box.x1 + m && z >= box.z0 - m && z <= box.z1 + m;
  const ways = lines.filter((l) => l.k <= 8 && l.pts.some((p) => near(p, margin)));
  const walks = paths.filter((p) => p.pts.some((q) => near(q, margin)));
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
  // other's centre line, not in a roundabout's island), round at a dead end. Where it goes on into
  // one other edge at its level, or through a junction into one that runs on within 20° of straight,
  // round as a way is where it bends, as wide as the narrower: cut square, the two left a wedge open
  // outside the bend, a sliver or another street's surface in it (task 048). `square` is it without
  // those, where the lines painted on a street stop.
  const ends = new Map(), up = (e) => (e.level === 1 || e.level === 2 ? e.level : 0);
  for (const e of edges) [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]].forEach(([n, i]) => { if (n != null) ends.set(n, [...(ends.get(n) ?? []), { e, i, dir: heading(e.pts, i, i > 0) }]); });
  for (const e of edges) {
    const caps = [], joins = [];
    for (const [n, i] of [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]]) {
      const p = e.pts[i], at = ends.get(n) ?? [], me = at.find((a) => a.e === e && a.i === i);
      if (at.length < 2) { caps.push(circle(p, e.w / 2, 24)); continue; }
      const others = at.filter((a) => a !== me && up(a.e) === up(e)), on = at.length === 2 ? others : others.filter((a) => a.dir[0] * me.dir[0] + a.dir[1] * me.dir[1] < -0.94);
      if (on.length) joins.push(circle(p, Math.max(...on.map((a) => Math.min(a.e.w, e.w))) / 2));
    }
    e.square = union(band([toPath(e.pts)], e.w / 2, true), caps);
    e.poly = joins.length ? union(e.square, joins) : e.square;
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
  const stats = { edges: edges.length, junctions: 0, islands: 0, reservations: 0, slivers: 0, km: { kerb: 0, dropped: 0 }, m2: {}, paths: { m2: {}, flights: 0, treads: 0, steep: 0, lanes: 0, flush: 0 } };

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
    const U1 = union(U0, ...fills.map((f) => f.paths));
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
    // The slivers (task 048): where the carriageways' outline goes into a notch under a metre wide (a
    // spike of pavement into the road; a gore's tip, the gore staying from where it's a metre wide),
    // closed, as the kerb runs across it; and a hole between them under 0.3 m wide all along, too
    // narrow for a reservation (they touch), filled. An island keeps its shape, however narrow, but
    // where it's under 10 cm wide: a crack where the carriageways touch, as at a long median's break.
    // Each sliver the surface of what's round it most.
    const small = shapes(U1).flatMap(([, ...holes]) => holes.filter((h) => Math.abs(C.Clipper.Area(h)) < ISLAND * S * S).map(positive));
    const cracks = small.flatMap((h) => (grow([h], -0.15).length ? minus([h], opened([h], 0.05)) : [h]));
    const slivers = shapes([...minus(closed(U1, 0.5), [...U1, ...small]), ...cracks]);
    if (slivers.length) {
      const near = [...bySurface].map(([s, p]) => [s, splitter(p)]);
      for (const sh of slivers) {
        const b = boundsOfPaths(sh), rim = minus(grow(sh, 0.3), sh);
        const [s] = near.map(([s, n]) => [s, area(meet(rim, n(b)))]).reduce((m, x) => (x[1] > m[1] ? x : m));
        bySurface.set(s, [...bySurface.get(s), ...sh]);
      }
    }
    const U = union(U1, slivers.flat());
    stats.slivers += area(meet(slivers.flat(), [rect(box)]));
    // Every surface but asphalt kept to the carriageways' outline, and asphalt the rest of it, so
    // together they're exactly what the pavements and islands are cut from.
    const others = [...bySurface].filter(([s]) => s !== 'asphalt').map(([s, p]) => [s, meet(union(p), U)]);
    made.set(key, { list, U, bySurface: new Map([['asphalt', minus(U, others.flatMap(([, p]) => p))], ...others]), arms });
  }

  // Where a bridge or a tunnel meets the ground's streets at its ends, its own carriageway: the
  // ground's stops there, so the two don't lie one on the other. Each end: its point, the ways into
  // the bridge or the tunnel from it (two where it forks there), and how far round it the cut reaches.
  const ground = made.get('ground');
  const paved = (key, g) => key.startsWith('bridge') && !g.list.some((e) => e.k <= 1 || sidewalk(e.t, true) === false);
  if (ground) {
    const bare = ground.U;
    for (const [key, g] of made) {
      if (key === 'ground') continue;
      const joined = [...g.arms].filter(([n]) => ground.arms.has(n)), r = Math.max(...g.list.map((e) => e.w)) + 1;
      if (!joined.length) continue;
      g.cut = meet(g.U, union(joined.map(([, [a]]) => circle(a.e.pts[a.i], r))));
      ground.U = minus(ground.U, g.cut);
      for (const [s, p] of ground.bySurface) ground.bySurface.set(s, minus(p, g.cut));
      g.ends = joined.map(([, a]) => ({ p: a[0].e.pts[a[0].i], us: a.map((x) => x.dir), r }));
    }
    // The pavements stop as the carriageways do (task 040): the ground's where a bridge's or a
    // tunnel's carriageway begins, a deck's at its end's line. And wherever a deck or a tunnel's road
    // is at the ground's level (`flat`: its ends, and along its centre lines, looked at every 2 m,
    // wherever else it's within GRADE of the ground), the ground's pavements give way to it and to a
    // deck's pavements, and those to the ground's carriageway. Where a bridge meets the ground's
    // carriageway at its level, or took its place: `touches`.
    ground.noPave = [];
    for (const [key, g] of made) {
      if (key === 'ground') continue;
      g.ends ??= [];
      const runs = [];
      if (height) for (const e of g.list) {
        let run = [];
        for (let i = 1; i < e.pts.length; i++) {
          const a = e.pts[i - 1], b = e.pts[i], n = Math.max(1, Math.ceil(dist(a, b) / 2));
          for (let k = i > 1 ? 1 : 0; k <= n; k++) {
            const f = k / n, p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
            if (Math.abs(e.ys[i - 1] + (e.ys[i] - e.ys[i - 1]) * f + elev0 - height(...p)) < GRADE) run.push(p);
            else if (run.length) { runs.push(run); run = []; }
          }
        }
        if (run.length) runs.push(run);
      }
      // Cut square across where it stops being flat, so it doesn't reach a street the deck passes over.
      const flat = runs.length ? band(runs.map(toPath), Math.max(...g.list.map((e) => e.w)) / 2 + 2, true) : [];
      const round = meet(ground.U, flat);
      const behind = (e) => e.us.map((u) => [positive(toPath(rectAcross([e.p[0] - u[0] * 1.5, e.p[1] - u[1] * 1.5], u, e.r + 2, 1.5)))]).reduce((a, b) => meet(a, b));
      g.touches = insideOf(grow(union(meet(g.cut ?? [], bare), round), 0.15));
      g.noPave = [...g.ends.flatMap(behind), ...round];
      const own = paved(key, g) ? minus(minus(grow(g.U, 1.5), g.U), g.noPave) : [];
      ground.noPave.push(...(g.cut ?? []), ...meet(union(g.U, own), flat));
    }
  }

  // The heights of a group off the ground, at any point: its nearest centre line's, between its
  // points. But on a bridge, round an end where it meets the ground's streets, the ground's as the
  // tiles hold it (`height`), where that's within TWIST of it: on the end's line and behind it, and
  // where it meets the ground's carriageway or took its place; so the deck and the street meet to the
  // centimetre (task 040). `ys.join` says whether a point is where it meets the ground's streets.
  const yOf = (list, ends = [], touches = () => false) => {
    const find = lineIndex(list);
    const own = (x, z) => { const f = find(x, z, 60); return f ? f.e.ys[f.i - 1] + (f.e.ys[f.i] - f.e.ys[f.i - 1]) * f.f : list[0].ys[0]; };
    const join = (x, z) => !!height && ends.some((e) => {
      const dx = x - e.p[0], dz = z - e.p[1];
      return dx * dx + dz * dz <= (e.r + 2) ** 2 && (e.us.some(([ux, uz]) => dx * ux + dz * uz <= 0.15) || touches(x, z));
    });
    const ys = (x, z) => {
      const y = own(x, z);
      if (!join(x, z)) return y;
      const h = height(x, z) - elev0;
      return Math.abs(h - y) < TWIST ? h : y;
    };
    ys.join = join;
    return ys;
  };
  // What comes out, cut to each box asked for: a piece wholly inside one goes as it is.
  const boxPath = [rect(box)];
  const levelName = (key) => (key === 'ground' ? 'ground' : key.split(':')[0]);
  const into = cuts.map((c) => ({ ...c, path: [rect(c.box)], out: { carriageways: [], pavements: [], kerbs: [], markings: [], paths: [], handrails: [] } }));
  const boundsOf = (paths) => {
    const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
    for (const p of paths) for (const q of p) { b.x0 = Math.min(b.x0, q.X / S); b.x1 = Math.max(b.x1, q.X / S); b.z0 = Math.min(b.z0, q.Y / S); b.z1 = Math.max(b.z1, q.Y / S); }
    return b;
  };
  const meets = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const within = (a, b) => a.x0 >= b.x0 && a.x1 <= b.x1 && a.z0 >= b.z0 && a.z1 <= b.z1;
  // To the decimetre, or a tread's to the centimetre (`cm`).
  const withYs = (o, ys, key, pts) => {
    if (!ys) return o;
    const k = ys.cm ? 100 : 10, y = ([x, z]) => Math.round(ys(x, z) * k) / k;
    return { ...o, ys: key === 'rings' ? pts.map((r) => r.map(y)) : pts.map(y) };
  };
  // Some shapes (shapes(), above) cut to the boxes they meet: [box, pieces] for each.
  const cutTo = (shs) => shs.flatMap((sh) => {
    const b = boundsOf([sh[0]]);
    return into.filter((c) => meets(b, c.box)).map((c) => [c, within(b, c.box) ? [sh] : shapes(meet(sh, c.path))]);
  });
  // Some shapes cut to the boxes (cutTo), each piece to the nearest 10 cm, as the tiles keep them
  // (rounded), but a scrap under 0.25 m²; and along a deck's end, where it meets the ground's streets, a
  // point every 2 m or less, so it follows the street's shape across. `snap`, for the carriageways
  // (task 048): their pieces rounded alike (snapRounding), so that where two meet no crack opens
  // between them; and every one kept, as a scrap of one surface left out of another is a hole.
  const addCut = (kind, cut, props, ys, snap = null) => {
    for (const [c, pieces] of cut) for (const piece of pieces) for (const snapped of rounded(snap ? piece.map(snap) : piece)) {
      const rings = snapped.map((r) => r.map((q) => [q.X / 10, q.Y / 10])).filter((r) => r.length > 2).map((r) => (ys?.join ? dense(r, ys.join) : r));
      if (!rings.length || (!snap && Math.abs(C.Clipper.Area(snapped[0])) / 100 < 0.25)) continue;
      c.out[kind].push(withYs({ ...props, rings }, ys, 'rings', rings));
    }
  };
  const addShapes = (kind, shs, props, ys) => addCut(kind, cutTo(shs), props, ys);
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

  // The paths off the ground (task 050): each footbridge, and each tunnel, the paths of its kind
  // that meet at their ends, at the heights of their lines as a street's are. Where a footbridge is
  // within GRADE of the ground (at its ends), the ground's paths give way to it (`over`).
  const upPaths = [], over = [];
  for (const lv of [1, 2]) {
    const own = walks.filter((p) => p.level === lv && p.kind !== 'steps' && p.ys), at = new Map(), seen = new Set();
    for (const p of own) for (const n of [p.nodes[0], p.nodes.at(-1)]) at.set(n, [...(at.get(n) ?? []), p]);
    for (const p of own) {
      if (seen.has(p)) continue;
      const list = [], todo = [p];
      seen.add(p);
      while (todo.length) {
        const f = todo.pop();
        list.push(f);
        for (const n of [f.nodes[0], f.nodes.at(-1)]) for (const q of at.get(n) ?? []) if (!seen.has(q)) { seen.add(q); todo.push(q); }
      }
      upPaths.push({ level: lv, list });
      if (lv !== 1 || !height) continue;
      for (const e of list) {
        const runs = [];
        let run = [];
        for (let i = 1; i < e.pts.length; i++) {
          const a = e.pts[i - 1], b = e.pts[i], n = Math.max(1, Math.ceil(dist(a, b) / 2));
          for (let k = i > 1 ? 1 : 0; k <= n; k++) {
            const f = k / n, q = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
            if (Math.abs(e.ys[i - 1] + (e.ys[i] - e.ys[i - 1]) * f + elev0 - height(...q)) < GRADE) run.push(q);
            else if (run.length) { runs.push(run); run = []; }
          }
        }
        if (run.length) runs.push(run);
        const long = runs.filter((r) => r.length > 1);
        if (long.length) over.push(...band(long.map(toPath), e.w / 2, true));
      }
    }
  }
  const pathLevel = (l) => ['ground', 'bridge', 'tunnel', 'under'][l];
  const addPaths = (list) => {
    for (const pc of list) {
      const ys = pc.y === undefined ? pc.ys ?? null : Object.assign(() => pc.y, { cm: true });
      addShapes('paths', shapes(pc.paths), { kind: pc.kind, surface: pc.surface, level: pc.level, raised: pc.raised }, ys);
      stats.paths.m2[pc.kind] = (stats.paths.m2[pc.kind] ?? 0) + area(meet(pc.paths, boxPath));
    }
  };

  for (const [key, g] of made) {
    const level = levelName(key), ys = level === 'ground' ? null : level === 'bridge' ? yOf(g.list, g.ends, g.touches) : yOf(g.list), U = g.U;
    const inU = insideOf(U), owner = lineIndex(g.list);
    const surfaces = [...g.bySurface].map(([surface, paths]) => [surface, paths, cutTo(shapes(paths))]);
    const snap = snapRounding(surfaces.flatMap(([, , cut]) => cut.flatMap(([, pieces]) => pieces.flat())));
    for (const [surface, paths, cut] of surfaces) {
      addCut('carriageways', cut, { surface, level }, ys, snap);
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
    // As Clipper rounds them, kept off the carriageways, and on the ground off a deck or a tunnel's
    // road where the ground's carriageway gave way to it.
    islands = minus(union(islands), [...U, ...(g.noPave ?? [])]);
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
      res = minus(union(res), [...U, ...B, ...islands, ...(g.noPave ?? [])]);
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
      pave = minus(pave, g.noPave ?? []);
    } else if (paved(key, g)) {
      pave = minus(minus(grow(U, 1.5), U), g.noPave ?? []);
    }
    // The paths on the ground (task 050), and what the pavements, reservations and islands give way
    // to: the flights of steps and the cycleways.
    let flushed = [], lanes = [];
    if (level === 'ground') {
      const got = groundPaths(walks.filter((p) => (p.kind === 'steps' ? !!p.flight : p.level === 0 || p.level === 3)), { U, kerbed: [...pave, ...res, ...islands], B, W, over, levelName: pathLevel });
      if (got.taken.length) {
        const T = union(got.taken);
        [pave, res, islands] = [minus(pave, T), minus(res, T), minus(islands, T)];
      }
      ({ flush: flushed, lanes } = got);
      addPaths(got.out);
      for (const r of got.rails) addLines('handrails', [r.path], { level: r.level }, r.ys);
      for (const k of ['flights', 'treads', 'steep']) stats.paths[k] += got.stats[k];
      stats.paths.lanes += area(meet(lanes, boxPath));
      stats.paths.flush += area(meet(flushed, boxPath));
    }
    pave = shapes(pave).filter((sh) => Math.abs(C.Clipper.Area(sh[0])) / (S * S) > 1).flat();
    addShapes('pavements', shapes(pave), { kind: 'pavement', level }, ys);
    addShapes('pavements', shapes(res), { kind: 'reservation', level }, ys);
    addShapes('pavements', shapes(islands), { kind: 'island', level }, ys);
    stats.m2.pavement = (stats.m2.pavement ?? 0) + area(meet(pave, boxPath));

    // The kerbs: the edge of the carriageway wherever a pavement, a reservation or an island is
    // behind it (or a cycleway flush with the pavement), dropped where a crossing meets it.
    const inPave = insideOf([...pave, ...flushed]);
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
    // Behind a cycle lane beside the road (task 050), the kerb up to the pavement: wherever a
    // pavement, a reservation or an island is behind it.
    if (lanes.length) {
      const inLane = insideOf(lanes);
      for (const ring of lanes) {
        const pts = toPts(ring), hs = [], segs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], L = dist(a, b), n = Math.max(1, Math.ceil(L / PIECE));
          if (L < 1e-3) continue;
          let nrm = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
          const m0 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (inLane(m0[0] + nrm[0] * 0.05, m0[1] + nrm[1] * 0.05)) nrm = [-nrm[0], -nrm[1]];
          for (let k = 0; k < n; k++) {
            const p = [a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)], q = [a[0] + (b[0] - a[0]) * ((k + 1) / n), a[1] + (b[1] - a[1]) * ((k + 1) / n)], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
            const o = [m[0] + nrm[0] * 0.4, m[1] + nrm[1] * 0.4];
            segs.push([p, q]);
            hs.push(inPave(...o) || inRes(...o) || inIsland(...o) ? (inDrop(...m) ? 0 : KERB) : null);
          }
        }
        let run = [], h = null;
        const done = () => {
          if (run.length > 1 && h !== null) { addLines('kerbs', [toPath(run)], { h, level }, ys); stats.km[h ? 'kerb' : 'dropped'] += lengthOf(run) / 1000; }
          run = [];
        };
        segs.forEach(([p, q], i) => {
          if (hs[i] !== h) { done(); h = hs[i]; }
          if (!run.length) run.push(p);
          run.push(q);
        });
        done();
      }
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
        if (a?.length > 2) for (const x of a) if (x.e !== e) at.push(...x.e.square);
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

  // The footbridges' and the paths' tunnels' surfaces, each kind of each surface where none before it
  // in PATH_ORDER is, nor a street at its level (a deck's pavements 1.5 m wide), nor another
  // footbridge (or tunnel) before it, where two run side by side.
  const upMine = new Map();
  for (const { level, list } of upPaths) {
    const name = pathLevel(level), ys = yOf(list), b = boundsOfPaths(list.map((p) => toPath(p.pts)));
    const streets = [...made].filter(([k, g]) => levelName(k) === name && boxesMeet(boundsOfPaths(g.U), b, 10)).flatMap(([, g]) => (name === 'bridge' ? grow(g.U, 1.5) : g.U));
    let mine = upMine.get(name) ?? [];
    for (const kind of PATH_ORDER) for (const surface of [...new Set(list.filter((p) => p.kind === kind).map((p) => p.surface))]) {
      const piece = minus(minus(union(...list.filter((p) => p.kind === kind && p.surface === surface).map((p) => band([toPath(p.pts)], p.w / 2))), streets), mine);
      mine = union(mine, piece);
      addPaths([{ paths: piece, kind, surface, level: name, raised: false, ys }]);
    }
    upMine.set(name, mine);
  }

  stats.seconds = (Date.now() - t0) / 1000;
  return { cuts: new Map(into.map((c) => [c.id, c.out])), stats };
}

// ---- The paths (task 050) ----

// Which takes the other's place where two paths overlap: a flight of steps over everything, then a
// cycleway, a footway and a path.
const PATH_ORDER = ['steps', 'cycleway', 'footway', 'path'];
// A handrail's top over the steps' nosing, and how far in from the flight's side it runs.
const RAIL = 0.9, RAIL_IN = 0.15;
// How far out from a cycleway in a pavement the carriageway is looked for, and how much of the
// cycleway's length has it there for it to be a lane beside the road.
const LANE_GAP = 0.4, LANE = 0.5;

const boundsOfPaths = (paths) => {
  const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const p of paths) for (const q of p) { b.x0 = Math.min(b.x0, q.X / S); b.x1 = Math.max(b.x1, q.X / S); b.z0 = Math.min(b.z0, q.Y / S); b.z1 = Math.max(b.z1, q.Y / S); }
  return b;
};
const boxesMeet = (a, b, m = 0) => a.x0 - m < b.x1 && a.x1 + m > b.x0 && a.z0 - m < b.z1 && a.z1 + m > b.z0;

// Some areas cut in halves until each piece has few points, for clipping small things against them
// quickly: near(b) is the pieces whose boxes meet the box b (in metres).
function splitter(paths) {
  const leaves = [];
  const split = (ps, b) => {
    const n = ps.reduce((s, p) => s + p.length, 0);
    if (!n) return;
    if (n <= 1200 || Math.max(b.x1 - b.x0, b.z1 - b.z0) <= 20) { leaves.push({ b: boundsOfPaths(ps), ps }); return; }
    const wide = b.x1 - b.x0 >= b.z1 - b.z0, m = wide ? (b.x0 + b.x1) / 2 : (b.z0 + b.z1) / 2;
    for (const h of wide ? [{ ...b, x1: m }, { ...b, x0: m }] : [{ ...b, z1: m }, { ...b, z0: m }]) split(meet(ps, [rect(h)]), h);
  };
  if (paths.length) split(paths, boundsOfPaths(paths));
  return (b) => leaves.filter((l) => boxesMeet(l.b, b, 0.5)).flatMap((l) => l.ps);
}

// The stretch of a line from a metres along it to b.
function stretch(pts, a, b) {
  const out = [];
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = dist(pts[i - 1], pts[i]), at = (d) => [pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * d) / (L || 1), pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * d) / (L || 1)];
    if (s + L >= a && s <= b) {
      if (!out.length) out.push(at(Math.max(0, a - s)));
      if (s + L <= b) out.push(pts[i]);
      else { out.push(at(b - s)); break; }
    }
    s += L;
  }
  return out.filter((p, i) => !i || dist(p, out[i - 1]) > 1e-3);
}

// How far along a line the point nearest (x, z) is.
function stationOn(pts) {
  return (x, z) => {
    let best = Infinity, at = 0, s = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1e-9;
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (L * L))), d = Math.hypot(ax + dx * f - x, az + dz * f - z);
      if (d < best) { best = d; at = s + f * L; }
      s += L;
    }
    return at;
  };
}

// The paths on the ground (lines.mjs's pathsOf: at the ground's level, or under something), and the
// flights of steps wherever they are, as surfaces: each the band its width makes round its line, cut
// back to the carriageways at its level (U), the buildings and the water (B, W; not a passage under
// a building, nor a flight in a tunnel or on a bridge), and a footbridge's end where it lies on the
// ground (`over`). Then:
// - a flight of steps (`flight`, lines.mjs) is a tread between each two risers, each at its own
//   height, and takes the place of whatever else is there: the pavements, reservations and islands
//   (`kerbed`) give way to it;
// - and so they do to a cycleway: where it runs in one, it's drawn there, flush with it, a kerb over
//   the ground (`flush`); or where it runs along the carriageway's edge, a lane at the carriageway's
//   level, with the kerb behind it (`lanes`), as the Avenida da Liberdade's red lanes are;
// - a footway or a path gives way to them, and to the pavements: where it meets a street, it joins
//   the pavement.
// Returns each piece { paths, kind, surface, level, raised, y }, y a tread's height (above elev0, as
// the flight's); what the kerbed areas give way to (`taken`); `flush` and `lanes`; the handrails
// { pts, ys, level }; and how many treads rise more than `step` over the one before (or the
// foot's ground), and how many flights there are.
function groundPaths(list, { U, kerbed, B, W, over, step = 0.3, levelName }) {
  const nearU = splitter(U), nearK = splitter(kerbed), nearB = splitter([...B, ...W]), nearO = splitter(over);
  const out = [], taken = [], rails = [], stats = { flights: 0, treads: 0, steep: 0 };
  // Cut back as everything is.
  const cut = (A, p) => {
    const b = boundsOfPaths(A), onGround = p.level === 0 || p.level === 3;
    let got = onGround ? minus(A, nearU(b)) : A;
    if (p.level === 0) got = minus(got, nearB(b));
    return onGround ? minus(got, nearO(b)) : got;
  };

  // The flights of steps, the first of two that overlap keeping its treads.
  const treads = [];
  for (const p of list.filter((q) => q.kind === 'steps' && q.flight)) {
    const f = p.flight, L = lengthOf(f.pts);
    if (L < 0.3) continue;
    let F = cut(band([toPath(f.pts)], p.w / 2, true), p);
    const fb = boundsOfPaths(F);
    F = minus(F, treads.filter((t) => boxesMeet(t.b, fb)).flatMap((t) => t.paths));
    if (!F.length) continue;
    stats.flights++;
    let before = [], last = f.foot;
    f.ys.forEach((y, i) => {
      const slab = band([toPath(stretch(f.pts, (i * L) / f.n, ((i + 1) * L) / f.n))], p.w / 2 + 0.05, true);
      const piece = minus(meet(F, slab), before);
      before = union(before, slab);
      if (y - last > step) stats.steep++;
      last = y;
      if (area(piece) < 0.05) return;
      stats.treads++;
      treads.push({ paths: piece, b: boundsOfPaths(piece) });
      out.push({ paths: piece, kind: 'steps', surface: p.surface, level: levelName(p.level), raised: false, y });
    });
    taken.push(...F);
    // Its handrails: both sides where the map says it has one, else the sides it names (as the way is
    // drawn, which the flight's line may run against), the top RAIL over the nosing, from the first
    // riser to the top's height.
    const t = p.t, h = t.handrail, reversed = f.pts[0] !== p.pts[0];
    const sides = [];
    if (h === 'yes' || h === 'both') sides.push(-1, 1);
    else {
      if (t['handrail:left'] === 'yes') sides.push(reversed ? 1 : -1);
      if (t['handrail:right'] === 'yes') sides.push(reversed ? -1 : 1);
      if (t['handrail:center'] === 'yes' || t['handrail:centre'] === 'yes') sides.push(0);
    }
    if (sides.length) {
      const top = f.ys.at(-1), r = top - f.foot, at = stationOn(f.pts), b = boundsOfPaths(F);
      const ys = (x, z) => Math.min(top, f.foot + r / f.n + (at(x, z) * r) / L) + RAIL;
      for (const s of sides) {
        const line = cutLines(cutLines([toPath(shift(f.pts, s * (p.w / 2 - RAIL_IN)))], nearU(b), false), p.level === 0 ? nearB(b) : [], false);
        rails.push(...line.map((q) => ({ path: q, ys, level: levelName(p.level) })));
      }
    }
  }
  const T = union(taken), nearT = splitter(T);

  // The cycleways: in a pavement, flush with it or a lane beside the road; else on the ground.
  const groups = new Map(); // `${kind}:${level}:${surface}:${where}` → paths
  const add = (k, ps) => { if (ps.length) groups.set(k, [...(groups.get(k) ?? []), ...ps]); };
  const ofKind = (kind, also) => {
    for (const p of list.filter((q) => q.kind === kind && (q.level === 0 || q.level === 3))) {
      let A = cut(band([toPath(p.pts)], p.w / 2), p);
      const b = boundsOfPaths(A);
      A = minus(A, [...nearT(b), ...also.flatMap((n) => n(b))]);
      const K = nearK(b);
      if (kind === 'cycleway') add(`${kind}:${p.level}:${p.surface}:in`, meet(A, K));
      add(`${kind}:${p.level}:${p.surface}:out`, minus(A, K));
    }
  };
  // Each kind's pieces of each level and surface, the first of two that overlap keeping its own.
  const ownPlace = (kind) => {
    let mine = [];
    for (const [k, ps] of [...groups].filter(([k]) => k.startsWith(kind + ':')).sort(([a], [b]) => (a < b ? -1 : 1))) {
      const piece = minus(union(ps), mine);
      mine = union(mine, piece);
      groups.set(k, piece);
    }
    return mine;
  };
  ofKind('cycleway', []);
  const Cy = ownPlace('cycleway'), nearC = splitter(Cy);
  ofKind('footway', [nearC]);
  const Fo = ownPlace('footway'), nearF = splitter(Fo);
  ofKind('path', [nearC, nearF]);
  ownPlace('path');

  // A cycleway in a pavement runs along the carriageway's edge where, LANE_GAP out from it, the
  // carriageway is there along more than LANE of its length.
  const flush = [], lanes = [];
  for (const [k, ps] of groups) {
    const [kind, lv, surface, where] = k.split(':');
    if (where === 'out') { out.push({ paths: ps, kind, surface, level: levelName(+lv), raised: false }); continue; }
    taken.push(...ps);
    for (const sh of shapes(ps)) {
      const b = boundsOfPaths(sh), long = sh.reduce((s, r) => s + lengthOf([...toPts(r), toPts(r)[0]]), 0) / 2;
      const lane = area(meet(minus(grow(sh, LANE_GAP), sh), nearU(b))) / (LANE_GAP * long) > LANE;
      (lane ? lanes : flush).push(...sh);
      out.push({ paths: sh, kind, surface, level: levelName(+lv), raised: !lane });
    }
  }
  return { out, taken, flush, lanes, rails, stats };
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

// What each path is, in a tile's `paths` part (task 050); and what it's paved with.
export const PATH = ['footway', 'path', 'cycleway', 'steps'];
export const PATH_SURFACES = ['calcada', 'paving', 'setts', 'asphalt', 'concrete', 'gravel', 'dirt', 'metal', 'wood'];
const PATH_LEVELS = ['ground', 'bridge', 'tunnel', 'under'];

// One tile's paths and handrails as 16-bit numbers, for index.js, points as packStreets has them.
// - A path: [what, its surface (PATH_SURFACES), rings, then each ring's n and points], what its PATH
//   code, 4 if it's raised and 8 times its level (PATH_LEVELS); then a tread's height, in decimetres
//   above ELEV0 and the centimetres more, or on a bridge or in a tunnel each point's in decimetres.
// - A handrail, in `rails`: [its level, n, points, each point's height in decimetres].
export function packPaths(got, x0, z0) {
  const paths = [], rails = [], dmOf = (v) => Math.round(v * 10);
  const pts = (out, list) => { let px = 0, pz = 0; list.forEach(([x, z], i) => { const a = dmOf(x - x0), b = dmOf(z - z0); out.push(i ? a - px : a, i ? b - pz : b); px = a; pz = b; }); };
  for (const p of got.paths) {
    paths.push(PATH.indexOf(p.kind) + (p.raised ? 4 : 0) + 8 * PATH_LEVELS.indexOf(p.level), PATH_SURFACES.indexOf(p.surface), p.rings.length);
    for (const r of p.rings) { paths.push(r.length); pts(paths, r); }
    if (p.kind === 'steps') { const y = p.ys[0][0], d = dmOf(y); paths.push(d, Math.round(y * 100 - d * 10)); }
    else if (p.ys) for (const r of p.ys) for (const y of r) paths.push(dmOf(y));
  }
  for (const h of got.handrails) {
    rails.push(PATH_LEVELS.indexOf(h.level), h.pts.length);
    pts(rails, h.pts);
    for (const y of h.ys) rails.push(dmOf(y));
  }
  return { paths, rails };
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

// A ring with a point every 2 m or less along each of its edges whose two ends `test` holds for, on
// the 10 cm grid.
function dense(r, test) {
  const at = r.map(([x, z]) => test(x, z));
  return r.flatMap((a, i) => {
    const j = (i + 1) % r.length, b = r[j], n = at[i] && at[j] ? Math.ceil(dist(a, b) / 2) : 1;
    return Array.from({ length: n }, (_, k) => (k ? [Math.round((a[0] + ((b[0] - a[0]) * k) / n) * 10) / 10, Math.round((a[1] + ((b[1] - a[1]) * k) / n) * 10) / 10] : a));
  });
}

// A rectangle centred on p, running along d: `across` either side of it, `ahead` along it each way.
function rectAcross(p, d, across, ahead) {
  const [ax, az] = d, [nx, nz] = [-az, ax];
  return [[p[0] - ax * ahead - nx * across, p[1] - az * ahead - nz * across], [p[0] + ax * ahead - nx * across, p[1] + az * ahead - nz * across], [p[0] + ax * ahead + nx * across, p[1] + az * ahead + nz * across], [p[0] - ax * ahead + nx * across, p[1] - az * ahead + nz * across]];
}

// ---- On its own: the streets in a box, and a page to look at them over the orthophoto ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [{ CACHE, ELEV0, readCache }, { terrain }, { heldGround, levelHeights, pathLines, pathsOf, streetsOf }, { ortho }, { loadWorld }, { decks }, jpeg] = await Promise.all([import('./geo.mjs'), import('./terrain.mjs'), import('./lines.mjs'), import('./dgt.mjs'), import('../index.js'), import('./decks.mjs'), import('jpeg-js')]);
  const a = process.argv.slice(2).map(Number);
  const box = a.length === 4 ? { x0: a[0], x1: a[1], z0: a[2], z1: a[3] } : { x0: -450, x1: 450, z0: 500, z1: 1150 };
  const ground = await terrain();
  // The ground as the tiles hold it, from the last `npm run world`, for the decks' ends (held to the
  // street there, as world.mjs holds it).
  const world = await loadWorld({ x0: box.x0 - 200, x1: box.x1 + 200, z0: box.z0 - 200, z1: box.z1 + 200 });
  const height = (x, z) => world.height(x, z) + ELEV0;
  const lines = streetsOf(readCache('osm/base.json'), (x, z, m) => x >= box.x0 - 300 - m && x <= box.x1 + 300 + m && z >= box.z0 - 300 - m && z <= box.z1 + 300 + m);
  const deck = decks(), { heights } = levelHeights(lines, ground, height, heldGround(lines, ground, undefined, deck), deck);
  const nodes = readCache('osm/street.json').elements.filter((e) => e.type === 'node');
  const paths = pathLines(pathsOf(readCache('osm/paths.json'), (x, z, m) => x >= box.x0 - m && x <= box.x1 + m && z >= box.z0 - m && z <= box.z1 + m), { ground, grid: height, deck, lines, heights, elev0: ELEV0 });
  const made = streetSurfaces({
    lines, heights, elev0: ELEV0, height, nodes, box, paths,
    buildings: world.buildings.map((b) => b.pts),
    squares: world.areas.filter((x) => x.kind === 'plaza').map((x) => x.pts),
    water: world.areas.filter((x) => x.kind === 'water').map((x) => x.pts),
  });
  const got = { ...made.cuts.get('box'), stats: made.stats }, s = got.stats;
  console.log(`${s.edges} edges, ${s.junctions} junctions, ${s.islands} islands, ${s.reservations} reservations, ${Math.round(s.slivers)} m² of slivers closed, in ${s.seconds} s`);
  console.log(`carriageways ${Object.entries(s.m2).filter(([k]) => k !== 'pavement').map(([k, v]) => `${k} ${Math.round(v)} m²`).join(', ')}; pavements ${Math.round(s.m2.pavement)} m²; kerbs ${s.km.kerb.toFixed(2)} km, ${s.km.dropped.toFixed(2)} km dropped`);
  console.log(`${got.carriageways.length} carriageway pieces, ${got.pavements.length} pavements, ${got.kerbs.length} kerbs, ${got.markings.length} markings (${['lane', 'centre', 'zebra', 'stop'].map((k) => `${got.markings.filter((m) => m.kind === k).length} ${k}`).join(', ')})`);
  const ps = s.paths;
  console.log(`paths: ${got.paths.length} pieces, ${Object.entries(ps.m2).map(([k, v]) => `${k} ${Math.round(v)} m²`).join(', ')} (cycleways ${Math.round(ps.lanes)} m² beside the road, ${Math.round(ps.flush)} m² flush); ${ps.flights} flights in ${ps.treads} treads, ${ps.steep} rising over 0.3 m; ${got.handrails.length} handrails`);
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
[class^="p-"] { fill-rule: evenodd; stroke: rgba(0,0,0,.35); stroke-width: .05; } .p-footway { fill: rgba(0,200,255,.55); } .p-path { fill: rgba(150,110,40,.6); }
.p-cycleway { fill: rgba(230,40,40,.6); } .p-cycleway.raised { fill: rgba(255,140,0,.65); } .p-steps { fill: rgba(220,40,220,.6); } .l-bridge { stroke: #fff; stroke-width: .25; } .l-under { opacity: .5; }
.rail { fill: none; stroke: #222; stroke-width: .12; }
</style></head><body>
<svg id="v" viewBox="${box.x0} ${box.z0} ${W} ${H}">
<image href="ortho.jpg" x="${box.x0}" y="${box.z0}" width="${W}" height="${H}" preserveAspectRatio="none"/>
<g id="carriageways">${['asphalt', 'setts', 'paving', 'dirt'].map((s) => poly(got.carriageways.filter((c) => c.surface === s), s)).join('')}</g>
<g id="pavements">${['pavement', 'reservation', 'island'].map((k) => poly(got.pavements.filter((p) => p.kind === k), k)).join('')}</g>
<g id="paths">${['footway', 'path', 'cycleway', 'steps'].map((k) => got.paths.filter((p) => p.kind === k).map((p) => `<path class="p-${k}${p.raised ? ' raised' : ''} l-${p.level}" d="${p.rings.map(ring).join('')}"/>`).join('')).join('')}${line(got.handrails, () => 'class="rail"')}</g>
<g id="kerbs">${line(got.kerbs, (k) => `class="kerb${k.h ? '' : ' dropped'}"`)}</g>
<g id="markings">${line(got.markings, (m) => `class="${m.kind}" stroke-width="${m.w}"${m.dash ? ` stroke-dasharray="${m.dash.join(' ')}"` : ''}`)}</g>
</svg>
<div class="panel"><b>As ruas como superfícies</b> (tarefa 033)<br>
${[['carriageways', 'Faixas de rodagem'], ['pavements', 'Passeios, separadores e ilhas'], ['paths', 'Caminhos (azul), ciclovias (vermelho; laranja ao nível do passeio), escadas (magenta)'], ['kerbs', 'Lancis (laranja: rebaixados)'], ['markings', 'Marcas na estrada']].map(([id, t]) => `<label><input type="checkbox" checked data-g="${id}"> ${t}</label>`).join('')}
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
