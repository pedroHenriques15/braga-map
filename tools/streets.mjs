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
import { RISER } from './lines.mjs';
import { COBBLE, driven, isOneway, lanesOf, openThin } from './osm.mjs';

const C = ClipperLib;
const NZ = C.PolyFillType.pftNonZero;
const S = 100; // Clipper works in whole numbers: centimetres

// How far a pavement reaches from its kerb at most, when the map doesn't say and no building stops it.
const PAVE = 3.2;
// How much the ground may vary across a sidewalk of the map's for it to be paved (task 059): more, it
// runs over a wall's step or a bank.
const SIDE_STEP = 0.5;
// A kerb's height, and how far apart its points are looked at, along the edge of the carriageway.
const KERB = 0.15, PIECE = 4;
// A pavement on the ground is laid level from its kerb (task 044): how steep it slopes across, from the
// kerb's top towards its back, as the land there does, at most (the owner's answer: Portugal's cap on
// a footway's slope across); how far it slopes down to a kerb dropped at a crossing (party-kart's DROP);
// and how far from a point its kerbs are looked for (a roundabout's island, ROUND_MAX, is about 80 m
// across).
const CROSS = 0.02, DROP = 1.2, KERB_FAR = 45;
// The radius a kerb turns a corner at, by the smaller of the streets that meet there (osm.mjs's LINE
// kinds: the fast roads, their links, primary, secondary, tertiary, residential, pedestrian, service,
// track).
const R_KERB = [10, 8, 8, 7, 6, 5, 3, 3, 3];
// A hole between the carriageways is an island (kerbed, with nothing built on it) when it's smaller
// than this, no building stands on it and it isn't the rows of a car park between its aisles, or
// when a roundabout goes round it. A roundabout's island is kept whole up to ROUND_MAX (task 014: the
// Rotunda Santos da Cunha's is 1,200 m², the biggest in the open world's area 1,800).
const ISLAND = 600, ROUND_MAX = 5000;
// A deck or a tunnel's road within this of the ground is at its level: nothing passes under it, so
// nothing on the ground lies over it, nor its pavements on the ground's road (task 040).
const GRADE = 2;
// How far past a deck's or a tunnel's end a corner of the ground's streets is cut back (task 046):
// this far on from its end's line, within its width and PAST_SIDE either side of its ways.
const PAST = 30, PAST_SIDE = 3;
// How far a deck's end follows the ground across it, from its own height: farther off, the ground
// there is an embankment's side, not the street it meets.
const TWIST = 0.5;
// The lines painted: as wide as the track's (party-kart's road.ts), dashes 3 m on and 4 m off; a
// zebra 4 m deep, a stop line 0.5 m.
const LINE_W = 0.14, DASH = [3, 4], ZEBRA = 4, STOP = 0.5;
// At a roundabout's entry (task 014), as the orthophoto (25 cm) and the photos show them at the
// route's (docs/STREET-DETAILS.md): the give-way line GIVE_W wide, in dashes GIVE_DASH, GIVE_OFF
// out from the ring's edge; and in each lane coming in, YIELD_BACK behind it, a triangle's outline,
// YIELD_W wide, YIELD_BASE across its base and YIELD_LEN to its point, which points to the traffic
// coming. A lane is YIELD_LANE wide at most.
const GIVE_W = 0.3, GIVE_DASH = [0.5, 0.5], GIVE_OFF = 0.3, YIELD_W = 0.2, YIELD_BASE = 1.5, YIELD_LEN = 2.75, YIELD_BACK = 1, YIELD_LANE = 3.5;
// The walls the streets end at (task 052): a street's edge, a pavement's or a path's stops FACE short
// of a wall's line, as the tiles round to 10 cm and a wall on a carriageway or a path is cut there
// (world.mjs). A carriageway comes back to a wall of the map's that runs along it, within ALONG of
// its way, looked at every SG metres along it; but not to one in it under RUN long, and across an
// opening in a wall up to GAP long where no other street passes (a gate, a door), its edge runs on
// straight. It's no narrower than its lanes, LANE_MIN each, or one where the map paints none (the
// owner's answer); its painted lines ease in and out of a narrower stretch EASE across a metre.
const FACE = 0.15, ALONG = Math.cos(Math.PI / 6), SG = 0.5, RUN = 1, GAP = 6, LANE_MIN = 2.5, EASE = 0.1;
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
const segDist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], f = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(p[0] - a[0] - dx * f, p[1] - a[1] - dz * f); };
const lineDist = (p, pts) => pts.reduce((m, q, i) => (i ? Math.min(m, segDist(p, pts[i - 1], q)) : m), Infinity);
const lengthOf = (pts) => pts.reduce((s, p, i) => (i ? s + dist(pts[i - 1], p) : 0), 0);
// A line moved o metres to its right (to its left if o is negative), its corners mitred; or each
// point by its own, where o is a list. Right is as seen on the map, north up: x east, z south, so
// (dx, dz)'s right is (-dz, dx).
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
    const k = typeof o === 'number' ? o : o[i];
    return [p[0] + nx * k, p[1] + nz * k];
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
// (fetch.mjs's street.json); `buildings` and `water`, rings round them, and `squares`, each its
// outline and then its holes (task 041); `sidewalks`, the pavements the map draws on their own (lines.mjs's
// sidewalksOf, task 059), paved where the streets' pavements don't reach; `walls`, the walls,
// fences, hedges and gates (walls.mjs's, index.d.ts's Wall), which the pavements and the paths stop
// at and a carriageway gives way to (task 052, `stopsAt` and `givesWayTo` below). Everything comes
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
export function streetSurfaces({ lines, heights = new Map(), elev0 = 0, height = null, nodes = [], buildings = [], squares = [], water = [], paths = [], sidewalks = [], walls = [], box, cuts = [{ id: 'box', box }], margin = 80 }) {
  const t0 = Date.now();
  const near = ([x, z], m) => x >= box.x0 - m && x <= box.x1 + m && z >= box.z0 - m && z <= box.z1 + m;
  const ways = lines.filter((l) => l.k <= 8 && l.pts.some((p) => near(p, margin)));
  const walks = paths.filter((p) => p.pts.some((q) => near(q, margin)));
  const sideways = sidewalks.filter((p) => p.pts.some((q) => near(q, margin)));
  const stops = walls.filter((w) => stopsAt(w) && w.pts.length > 1 && w.pts.some((p) => near(p, margin + 20)));
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
  // those, where the lines painted on a street stop. On the ground, each gives way to the map's walls
  // that stand in it (task 052, pullBack): `gives`, taken off it and off the join or the corner it
  // meets the next at, and a dead end's round end as wide as it is there.
  const ends = new Map(), up = (e) => (e.level === 1 || e.level === 2 ? e.level : 0);
  for (const e of edges) [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]].forEach(([n, i]) => { if (n != null) ends.set(n, [...(ends.get(n) ?? []), { e, i, dir: heading(e.pts, i, i > 0) }]); });
  const onGround = edges.filter((e) => !up(e));
  // But not round a deck's or a tunnel's end, where it meets the ground's streets at their height (task
  // 040): within its width and 4 m of it.
  const held = [...ends.values()].filter((at) => at.some((a) => up(a.e)) && at.some((a) => !up(a.e))).map((at) => ({ p: at[0].e.pts[at[0].i], r: Math.max(...at.filter((a) => up(a.e)).map((a) => a.e.w)) + 4 }));
  const mapWalls = segments(stops.filter(givesWayTo).map((w) => w.pts));
  const given = pullBack(onGround, mapWalls, segments(onGround.map((e) => e.pts), 10, onGround), box, held);
  for (const e of edges) {
    const caps = [], joins = [];
    for (const [n, i] of [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]]) {
      const p = e.pts[i], at = ends.get(n) ?? [], me = at.find((a) => a.e === e && a.i === i);
      if (at.length < 2) { caps.push(e.pull ? capOf(e, i) : circle(p, e.w / 2, 24)); continue; }
      const others = at.filter((a) => a !== me && up(a.e) === up(e)), on = at.length === 2 ? others : others.filter((a) => a.dir[0] * me.dir[0] + a.dir[1] * me.dir[1] < -0.94);
      if (on.length) joins.push(...minus([circle(p, Math.max(...on.map((a) => Math.min(a.e.w, e.w))) / 2)], at.flatMap((a) => a.e.gives ?? [])));
    }
    e.square = minus(union(band([toPath(e.pts)], e.w / 2, true), caps), e.gives ?? []);
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

  // Where a bridge or a tunnel meets the ground's streets (task 046): each node where a way off the
  // ground ends at one on it, the ways into the bridge or the tunnel from it, half the widest one's
  // width, whether a street on the ground crosses there (two of its arms run on, one into the other,
  // across those ways), as the João XXI's ways cross the Avenida 31 de Janeiro's deck's ends; and
  // what lies within its width and PAST_SIDE of the bridge's or the tunnel's ways, to their ends.
  const decksEnds = [], groupOf = new Map();
  for (const list of groups.values()) for (const e of list) groupOf.set(e, list);
  for (const [n, at] of ends) {
    const off = at.filter((a) => up(a.e)), on = at.filter((a) => !up(a.e)), dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    if (!off.length || !on.length) continue;
    const us = off.map((a) => a.dir), across = (a) => us.every((u) => Math.abs(dot(a.dir, u)) < 0.7), hw = Math.max(...off.map((a) => a.e.w)) / 2;
    const list = [...new Set(off.flatMap((a) => groupOf.get(a.e)))], seen = new Map();
    for (const p of list.flatMap((e) => [e.pts[0], e.pts.at(-1)])) seen.set(p + '', [p, (seen.get(p + '')?.[1] ?? 0) + 1]);
    const way = union(band(list.map((e) => toPath(e.pts)), hw + PAST_SIDE, true), [...seen.values()].filter(([, k]) => k > 1).map(([p]) => circle(p, hw + PAST_SIDE)));
    decksEnds.push({ n, p: off[0].e.pts[off[0].i], us, hw, way, crossed: on.some((a) => across(a) && on.some((b) => b !== a && dot(a.dir, b.dir) < -0.7)) });
  }

  const B = buildings.filter((r) => r.length > 2 && r.some((p) => near(p, margin + 40))).map((r) => positive(toPath(r)));
  const W = water.filter((r) => r.length > 2 && r.some((p) => near(p, margin + 40))).map((r) => positive(toPath(r)));
  // Each square less its holes: a lawn, a fountain, a bandstand in one mapped in parts (task 041).
  const Q = squares.filter(([r]) => r.length > 2 && r.some((p) => near(p, margin + 40))).flatMap(([r, ...holes]) => minus([positive(toPath(r))], holes.map((h) => positive(toPath(h)))));
  const built = wallIndex(buildings.filter((r) => r.some((p) => near(p, margin + 60))));
  const stats = { edges: edges.length, junctions: 0, islands: 0, reservations: 0, sidewalks: 0, slivers: 0, past: 0, km: { kerb: 0, dropped: 0 }, m2: {}, paths: { m2: {}, flights: 0, treads: 0, steep: 0, lanes: 0, flush: 0 }, walls: { given, streets: onGround.filter((e) => e.pull).length, behind: 0, paths: 0 } };

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
    // The roundabouts' islands (task 014): the holes the carriageways leave that a ring goes round (its
    // ways the nearest along most of the hole's edge), whole, however far one reaches past a corner's
    // reach below.
    const rounds = shapes(U0).flatMap(([, ...holes]) => holes.filter((h) => {
      if (Math.abs(C.Clipper.Area(h)) > ROUND_MAX * S * S) return false;
      const pts = toPts(h).filter((_, i) => i % 4 === 0), ring = pts.filter((q) => {
        let best = null, d = Infinity;
        for (const e of around(q, 20)) { const v = lineDist(q, e.pts) - e.w / 2; if (v < d) { d = v; best = e; } }
        return best?.t.junction === 'roundabout';
      });
      return ring.length > 0.6 * pts.length;
    }).map(positive));
    // A corner where streets meet, or a street turns at a node, rounded as a kerb turns it: the
    // carriageways round the node closed (grown then shrunk) by the kerb's radius, which fills what's
    // between the arms there and no more. What they enclose stays open (a roundabout's island, one
    // between a slip road and the corner), but for a sliver under 25 m²; and so does a roundabout's
    // island that reaches past the corner's reach.
    const arms = new Map();
    for (const e of list) [[e.nodes[0], 0], [e.nodes.at(-1), e.pts.length - 1]].forEach(([n, i]) => { if (n != null) arms.set(n, [...(arms.get(n) ?? []), { e, i, dir: heading(e.pts, i, i > 0) }]); });
    const fills = [];
    for (const [n, a] of arms) {
      if (a.length < 2) continue;
      if (a.length === 2 && a[0].dir[0] * a[1].dir[0] + a[0].dir[1] * a[1].dir[1] < -0.94) continue; // straight on
      const p = a[0].e.pts[a[0].i], r = R_KERB[Math.max(...a.map((x) => x.e.k))], hw = Math.max(...a.map((x) => x.e.w / 2));
      const R = Math.min(45, hw + 3 * r + 2), disc = [circle(p, R)], local = meet(union(...around(p, R).map((e) => e.poly)), disc);
      const enclosed = shapes(local).flatMap(([, ...holes]) => holes.filter((h) => Math.abs(C.Clipper.Area(h)) > 25 * S * S).map(positive));
      // Stopping where a street round it gives way to a wall, and at a wall of the map's in it, seen
      // from the junction (task 052).
      const shut = key === 'ground' ? behind(p, mapWalls.near({ x0: p[0] - R, x1: p[0] + R, z0: p[1] - R, z1: p[1] + R }).filter(([ax, az, bx, bz]) => !held.some((q) => dist(q.p, [(ax + bx) / 2, (az + bz) / 2]) < q.r)), R) : [];
      const fill = minus(meet(grow(grow(local, r), -r), disc), [...local, ...enclosed, ...rounds, ...around(p, R).flatMap((e) => e.gives ?? []), ...shut]);
      if (area(fill) > 0.05) fills.push({ n, p, paths: fill, surface: a.reduce((m, x) => (x.e.k < m.e.k ? x : m)).e.surface });
      stats.junctions += a.length > 2;
    }
    // A corner stops where a deck or a tunnel's road begins (task 046). Past its end's line, along its
    // ways within their width and PAST_SIDE (decksEnds' `way`), as far on as PAST or a street on the
    // ground that crosses them, is the deck's or the tunnel's, or the ground under it or over it: a
    // corner whose carriageways close round across it (between two decks side by side, or a deck's end
    // and a road it passes over) stops at that line, as the ground's carriageways do. But a junction
    // under a deck or over a tunnel (its node in that stretch) keeps its corners there, and so does one
    // whose street crosses a deck's or a tunnel's end: none is cut back past that end, and its own
    // corners nowhere.
    const gone = [];
    if (key === 'ground') {
      const crossed = new Set(decksEnds.filter((d) => d.crossed).map((d) => d.n));
      // The 3 m behind each end's line, within its width and PAST_SIDE: still the ground's where a
      // deck beside it ends further on, as the Robert Smith's two do, 1.5 m apart.
      const behind = decksEnds.map((d) => union(d.us.map((u) => positive(toPath(rectAcross([d.p[0] - u[0] * 1.5, d.p[1] - u[1] * 1.5], u, d.hw + PAST_SIDE, 1.5))))));
      const past = decksEnds.map((d, i) => [d, i]).filter(([d]) => !d.crossed).map(([d, i]) => {
        const ahead = (from, to) => meet(union(d.us.map((u) => positive(toPath(rectAcross([d.p[0] + (u[0] * (from + to)) / 2, d.p[1] + (u[1] * (from + to)) / 2], u, PAST, (to - from) / 2))))), d.way);
        const others = decksEnds.flatMap((o, j) => (j !== i && dist(o.p, d.p) < PAST + 10 ? behind[j] : []));
        const open = shapes(minus(ahead(0, PAST), [...U0, ...others])).filter((sh) => meet(sh, ahead(0, 0.5)).length).flat();
        return { open, b: boundsOfPaths(open), under: insideOf(ahead(0.5, PAST)) };
      }).filter((c) => c.open.length);
      for (const f of fills) {
        if (crossed.has(f.n)) continue;
        const b = boundsOfPaths(f.paths), cut = past.filter((c) => boxesMeet(c.b, b) && !c.under(...f.p)).flatMap((c) => c.open);
        if (!cut.length) continue;
        gone.push(...meet(f.paths, cut));
        f.paths = minus(f.paths, cut);
      }
    }
    const U1 = union(U0, ...fills.map((f) => f.paths));
    if (gone.length) stats.past += area(meet(minus(union(gone), U1), [rect(box)]));
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
    // where it's under 20 cm wide: a crack where the carriageways touch, as at a long median's break
    // (10 cm until task 026, which the tiles' 10 cm could narrow to a crack again).
    // Each sliver the surface of what's round it most.
    const small = shapes(U1).flatMap(([, ...holes]) => holes.filter((h) => Math.abs(C.Clipper.Area(h)) < ISLAND * S * S).map(positive));
    // But a hole under 0.3 m wide is left where a street gave way to a wall (task 052), but for its
    // parts under 26 cm wide, which the tiles' 10 cm could narrow to a crack (its ends, where the
    // streets widen again): two carriageways brought back to a wall between them leave its gap,
    // 2 × FACE wide.
    const gives = list.flatMap((e) => e.gives ?? []);
    const cracks = small.flatMap((h) => {
      if (grow([h], -0.15).length) return minus([h], opened([h], 0.1));
      const gap = meet([h], gives);
      return gap.length ? [...minus([h], gap), ...minus(gap, opened(gap, 0.13))] : [h];
    });
    const slivers = shapes([...minus(closed(U1, 0.5), [...U1, ...small, ...gives]), ...cracks]);
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
  // (rounded), but a scrap under `least` (0.25 m²); and along a deck's end, where it meets the ground's
  // streets, a point every 2 m or less, so it follows the street's shape across. `snap`, for the
  // carriageways (task 048) and the flights' treads (task 051): their pieces rounded alike
  // (snapRounding), so that where two meet no crack opens between them; the carriageways' every one
  // kept, as a scrap of one carriageway left out of another is a hole.
  const addCut = (kind, cut, props, ys, snap = null, least = snap ? 0 : 0.25) => {
    for (const [c, pieces] of cut) for (const piece of pieces) for (const snapped of rounded(snap ? piece.map(snap) : piece)) {
      const rings = snapped.map((r) => r.map((q) => [q.X / 10, q.Y / 10])).filter((r) => r.length > 2).map((r) => (ys?.join ? dense(r, ys.join) : r));
      if (!rings.length || Math.abs(C.Clipper.Area(snapped[0])) / 100 < least) continue;
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
  // The flights' treads snap rounded together, as the carriageways are (task 048): each rounded on its
  // own, two side by side came out of the tiles' 10 cm grid a crack apart, where a walker going up them
  // stood on the land for a moment (task 051). A tread's piece is kept down to 0.05 m², as the flight
  // made it: one 15 cm deep, spread over what a carriageway leaves, is 0.3 m² across a 2 m flight.
  const addPaths = (list) => {
    const cuts = list.map((pc) => cutTo(shapes(pc.paths)));
    const snap = snapRounding(list.flatMap((pc, i) => (pc.kind === 'steps' ? cuts[i].flatMap(([, pieces]) => pieces.flat()) : [])));
    list.forEach((pc, i) => {
      const ys = pc.y === undefined ? pc.ys ?? null : Object.assign(() => pc.y, { cm: true });
      addCut('paths', cuts[i], { kind: pc.kind, surface: pc.surface, level: pc.level, raised: pc.raised }, ys, pc.kind === 'steps' ? snap : null, pc.kind === 'steps' ? 0.05 : 0.25);
      stats.paths.m2[pc.kind] = (stats.paths.m2[pc.kind] ?? 0) + area(meet(pc.paths, boxPath));
    });
  };

  for (const [key, g] of made) {
    const level = levelName(key), ys = level === 'ground' ? null : level === 'bridge' ? yOf(g.list, g.ends, g.touches) : yOf(g.list), U = g.U;
    const inU = insideOf(U), owner = lineIndex(g.list);
    // The walls the pavements and paths on the ground stop at (task 052). One on a carriageway, which
    // world.mjs cuts, stands behind the kerb, or another kerb sees past it.
    const walled = level === 'ground' && stops.length ? segments(stops.map((w) => w.pts)) : null;
    // The carriageways go out once the pavements are made, snap rounded together and with `more` (on
    // the ground the pavements and the paths flush with them, task 044), so that where two meet they
    // share their points; and the snapping returned, for those.
    const surfaces = [...g.bySurface].map(([surface, paths]) => [surface, paths, cutTo(shapes(paths))]);
    const putCarriageways = (more = []) => {
      const snap = snapRounding([...surfaces.flatMap(([, , cut]) => cut.flatMap(([, pieces]) => pieces.flat())), ...more]);
      for (const [surface, paths, cut] of surfaces) {
        addCut('carriageways', cut, { surface, level }, ys, snap);
        stats.m2[surface] = (stats.m2[surface] ?? 0) + area(meet(paths, boxPath));
      }
      return snap;
    };

    // The edge of the carriageways, in pieces of up to 4 m, each with the way out from it and the
    // street it's the edge of. Islands: the holes the carriageways go round with nothing built in
    // them, small, or a roundabout's.
    let islands = [];
    const ringed = [];
    if (level !== 'tunnel') for (const [, ...holes] of shapes(U)) for (const h of holes) {
      const a = Math.abs(area([h])), pts = toPts(h), inH = insideOf([h]);
      const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]), hb = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
      const by = pts.filter((_, i) => i % 4 === 0).map(([x, z]) => owner(x, z, 20)), share = (f) => by.filter((o) => o && f(o.e)).length / (by.length || 1);
      const round = share((e) => e.t.junction === 'roundabout'), service = share((e) => e.k >= 7);
      const builtOn = buildings.some((r) => r.length && r[0][0] >= hb.x0 && r[0][0] <= hb.x1 && r[0][1] >= hb.z0 && r[0][1] <= hb.z1 && inH(r[0][0], r[0][1]) && inH(r[Math.floor(r.length / 2)][0], r[Math.floor(r.length / 2)][1]));
      if ((a < ISLAND && !builtOn && service < 0.5) || round > 0.6) islands.push(positive(h));
      if (round > 0.6) ringed.push(positive(h));
    }
    stats.islands += islands.length;
    // As Clipper rounds them, kept off the carriageways, and on the ground off a deck or a tunnel's
    // road where the ground's carriageway gave way to it.
    islands = minus(union(islands), [...U, ...(g.noPave ?? [])]);
    const inIsland = insideOf(islands);
    const pieces = [];
    for (const ring of U) {
      const pts = toPts(ring), list = [];
      // Which way is out of it: the side of its edges the carriageway isn't on, 5 cm off each, the
      // same all round a ring (its points are rounded to 10 cm, so one edge alone can be wrong: a
      // street brought back to a wall, task 052, has its edge 15 cm short of a line on the 10 cm grid).
      let left = 0, all = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = dist(a, b);
        if (L < 1e-3) continue;
        all++;
        if (inU((a[0] + b[0]) / 2 - ((b[1] - a[1]) / L) * 0.05, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / L) * 0.05)) left++;
      }
      const out = left * 2 > all ? -1 : 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = dist(a, b), n = Math.max(1, Math.ceil(L / PIECE));
        if (L < 1e-3) continue;
        const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
        for (let k = 0; k < n; k++) {
          const p = [a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)], q = [a[0] + (b[0] - a[0]) * ((k + 1) / n), a[1] + (b[1] - a[1]) * ((k + 1) / n)];
          const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          const nrm = [-tz * out, tx * out];
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
    // And the map's own sidewalks where those don't reach (task 059), pieces of their own, so the streets'
    // pavements keep their points along the kerbs, which the carriageways share.
    let pave = [], theirs = [];
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
      // From its kerb to the first wall behind it (task 052), and none where a street gave way to a
      // wall: there, what's behind the wall begins (seen along the wall's back from where the street
      // widens again past its end, it would be).
      if (walled) {
        const dark = union(shade(pieces.flat(), walled, PAVE + 0.3), g.list.flatMap((e) => e.gives ?? []));
        stats.walls.behind += area(meet(meet(pave, dark), boxPath));
        pave = minus(pave, dark);
      }
      pave = minus(pave, [...band(none, PAVE + 0.5, true), ...res, ...islands]);
      pave = union(pave, minus(Q, [...U, ...B, ...W, ...res, ...islands]));
      // The map's own pavements beside the streets (task 059), where the streets' don't reach, on an
      // island or on open ground: each its band at its width, cut as a path is (back from the
      // carriageways, the buildings, the water and what's over it, and to the walls either side of its
      // line), and with the slivers under a metre between it and a pavement filled; but not across a
      // passage under a building, which a footway would give way to and leave the building uncut.
      if (sideways.length) {
        const nearU = splitter(U), nearB = splitter([...B, ...W]), nearO = splitter(over), SW = [];
        // A sidewalk's line in the runs where the ground across its band is within SIDE_STEP: none laid
        // across a step, a wall's or a bank's, where the map draws it on one (the ground under it as the
        // tiles hold it; every metre along it, at its line and its band's edges). But on an island,
        // whose ground is paved there either way: there it's the sidewalk's, not the island's verge.
        const onIsland = insideOf(islands);
        const level = (s) => {
          if (!height) return [s.pts];
          const runs = [];
          let run = [];
          const flush = () => { if (run.length > 1 && lengthOf(run) >= 1) runs.push(run); run = []; };
          for (let i = 1; i < s.pts.length; i++) {
            const [a, b] = [s.pts[i - 1], s.pts[i]], L = dist(a, b);
            if (L < 1e-3) continue;
            const [ux, uz] = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = Math.max(1, Math.ceil(L));
            for (let k = 0; k <= n; k++) {
              if (k === 0 && run.length) continue;
              const p = [a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)];
              const hs = [0, 1, -1].map((o) => height(p[0] - uz * o * (s.w / 2), p[1] + ux * o * (s.w / 2)));
              if (Math.max(...hs) - Math.min(...hs) <= SIDE_STEP || onIsland(p[0], p[1])) run.push(p);
              else flush();
            }
          }
          flush();
          return runs;
        };
        for (const s of sideways) for (const run of level(s)) {
          let A = band([toPath(run)], s.w / 2, true);
          const b = boundsOfPaths(A);
          A = minus(minus(minus(A, nearU(b)), nearB(b)), nearO(b));
          if (walled && A.length) A = minus(A, shade(sides(run), walled, s.w / 2 + 0.3, PATH_KEEP));
          SW.push(...A);
        }
        const passages = walks.filter((p) => p.level === 3 && p.kind !== 'steps').map((p) => band([toPath(p.pts)], p.w / 2 + 0.3));
        const side = minus(union(SW), [...res, ...passages.flat()]);
        const filled = minus(meet(closed(union([...pave, ...side]), 0.5), grow(side, 1)), [...U, ...B, ...W, ...res, ...islands, ...passages.flat()]);
        theirs = minus(union([...side, ...filled]), [...pave, ...(g.noPave ?? [])]);
        stats.sidewalks += area(meet(theirs, boxPath));
        islands = minus(islands, side);
      }
      pave = minus(pave, g.noPave ?? []);
    } else if (paved(key, g)) {
      pave = minus(minus(grow(U, 1.5), U), g.noPave ?? []);
    }
    // The paths on the ground (task 050), and what the pavements, reservations and islands give way
    // to: the flights of steps and the cycleways.
    let flushed = [], lanes = [], groundOut = [];
    if (level === 'ground') {
      const got = groundPaths(walks.filter((p) => (p.kind === 'steps' ? !!p.flight : p.level === 0 || p.level === 3)), { U, kerbed: [...pave, ...theirs, ...res, ...islands], B, W, over, walled, boxPath, levelName: pathLevel, height, elev0 });
      if (got.taken.length) {
        const T = union(got.taken);
        [pave, theirs, res, islands] = [minus(pave, T), minus(theirs, T), minus(res, T), minus(islands, T)];
      }
      ({ flush: flushed, lanes } = got);
      groundOut = got.out;
      for (const r of got.rails) addLines('handrails', [r.path], { level: r.level }, r.ys);
      for (const k of ['flights', 'treads', 'steep']) stats.paths[k] += got.stats[k];
      stats.walls.paths += got.stats.behind;
      stats.paths.lanes += area(meet(lanes, boxPath));
      stats.paths.flush += area(meet(flushed, boxPath));
    }
    [pave, theirs] = [pave, theirs].map((ps) => shapes(ps).filter((sh) => Math.abs(C.Clipper.Area(sh[0])) / (S * S) > 1).flat());

    // The kerbs: the edge of the carriageway wherever a pavement, a reservation or an island is
    // behind it (or a cycleway flush with the pavement), dropped where a crossing meets it. Each run
    // kept for the pavements' heights.
    const runs = [];
    const addKerb = (run, h) => {
      addLines('kerbs', [toPath(run)], { h, level }, ys);
      runs.push({ pts: [...run], h });
      stats.km[h ? 'kerb' : 'dropped'] += lengthOf(run) / 1000;
    };
    const inPave = insideOf([...pave, ...theirs, ...flushed]);
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
        if (run.length > 1 && h !== null) addKerb(run, h);
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
          if (run.length > 1 && h !== null) addKerb(run, h);
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

    // The pavements, reservations and islands, and the paths flush with them: on the ground each point
    // at its height from its kerbs (task 044), on a deck or in a tunnel as its street is.
    // A pavement is between two kerbs where two streets' pavements meet (two of PAVE and a metre); a
    // reservation or an island wherever its kerbs are.
    const kerbed = level === 'ground' && height && insideOf([...pave, ...theirs, ...res, ...islands, ...flushed]);
    // A roundabout's island apart (task 014): a game draws it in what the ground is there.
    const pieceKinds = [[pave, { kind: 'pavement', level }], [theirs, { kind: 'pavement', level }], [res, { kind: 'reservation', level }], [minus(islands, ringed), { kind: 'island', level }], [meet(islands, ringed), { kind: 'island', round: true, level }]];
    if (kerbed) {
      const [pys, rys] = [paveHeights(runs, height, elev0, kerbed, 2 * PAVE + 1, PAVE), paveHeights(runs, height, elev0, kerbed, 2 * KERB_FAR)];
      const laid = (cut, y) => cut.map(([c, pieces]) => [c, pieces.map((piece) => piece.map((r) => follow(r, y)))]);
      const flush = groundOut.filter((pc) => pc.raised).map((pc) => [pc, laid(cutTo(shapes(pc.paths)), pys)]);
      const beside = pieceKinds.map(([ps, props]) => [laid(cutTo(shapes(ps)), props.kind === 'pavement' ? pys : rys), props, props.kind === 'pavement' ? pys : rys]);
      // The other paths on the ground or under something too (a passage's floor meets the street where
      // it comes out), but the flights, snapped among themselves (addPaths).
      const rest = groundOut.filter((pc) => !pc.raised && pc.kind !== 'steps').map((pc) => [pc, cutTo(shapes(pc.paths))]);
      const snap = putCarriageways([...flush, ...rest].map(([, cut]) => cut).concat(beside.map(([cut]) => cut)).flatMap((cut) => cut.flatMap(([, pieces]) => pieces.flat())));
      addPaths(groundOut.filter((pc) => !pc.raised && pc.kind === 'steps'));
      for (const [pc, cut] of [...flush, ...rest]) {
        addCut('paths', cut, { kind: pc.kind, surface: pc.surface, level: pc.level, raised: pc.raised }, pc.raised ? pys : pc.ys ?? null, snap, 0.25);
        stats.paths.m2[pc.kind] = (stats.paths.m2[pc.kind] ?? 0) + area(meet(pc.paths, boxPath));
      }
      for (const [cut, props, y] of beside) addCut('pavements', cut, props, y, snap, 0.25);
    } else {
      putCarriageways();
      addPaths(groundOut);
      for (const [ps, props] of pieceKinds) addShapes('pavements', shapes(ps), props, ys);
    }
    stats.m2.pavement = (stats.m2.pavement ?? 0) + area(meet([...pave, ...theirs], boxPath));

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
    // Where a street gives way to a wall (task 052), its lanes share what's left, easing in and out.
    for (const e of g.list) {
      const n = lanesOf(e.t), one = isOneway(e.t);
      if (n < 2 || e.w / n < 2.5) continue;
      const back = one ? 0 : Math.max(1, Math.min(n - 1, parseInt(e.t['lanes:backward']) || Math.floor(n / 2)));
      const lw = e.w / n, off = [...keepOff(e), ...zebraZones], eased = e.pull && { l: ease(e.pull.l, e.pull.s), r: ease(e.pull.r, e.pull.s) };
      for (let i = 1; i < n; i++) {
        const centre = !one && i === back;
        const at = eased ? shift(e.pull.d, Array.from(eased.l, (l, k) => -l + (i * (l + eased.r[k])) / n)) : shift(e.pts, -e.w / 2 + i * lw);
        addLines('markings', cutLines(cutLines([toPath(at)], off, false), e.poly, true), { kind: centre ? 'centre' : 'lane', w: LINE_W, dash: centre && n >= 4 ? null : DASH, level }, ys);
      }
    }
    // A zebra and a stop line run across the street (to its right, as it's drawn) from 0.3 m in from
    // one edge to 0.3 m in from the other, where they are (widthAt: its edges where it gives way to a
    // wall).
    for (const c of zebras) {
      const dir = [-c.d[1], c.d[0]], [l, r] = widthAt(c.e, c.e.nodes.indexOf(c.n)), a = -(l - 0.3), b = r - 0.3;
      addLines('markings', [toPath([[c.p[0] + dir[0] * a, c.p[1] + dir[1] * a], [c.p[0] + dir[0] * b, c.p[1] + dir[1] * b]])], { kind: 'zebra', w: ZEBRA, dash: null, level }, ys);
    }
    // A stop line where the map has traffic lights on a street, across the side they stop.
    for (const e of g.list) e.nodes.forEach((n, i) => {
      const t = stopAt.get(n);
      if (t?.highway !== 'traffic_signals' || t.crossing) return;
      const [dx, dz] = heading(e.pts, i, i === e.pts.length - 1), s = i === e.pts.length - 1 ? -1 : 1, across = [-dz * s, dx * s], p = e.pts[i];
      const dir = t['traffic_signals:direction'], [l, r] = widthAt(e, i), hl = l - 0.3, hr = r - 0.3;
      const [a, b] = isOneway(e.t) || !['forward', 'backward'].includes(dir) ? [-hl, hr] : dir === 'forward' ? [0, hr] : [-hl, 0];
      addLines('markings', [toPath([[p[0] + across[0] * a, p[1] + across[1] * a], [p[0] + across[0] * b, p[1] + across[1] * b]])], { kind: 'stop', w: STOP, dash: null, level }, ys);
    });
    // At each roundabout's entry (task 014): where a street runs into its ring the way its traffic
    // goes, the give-way line across the side coming in (all of it, one way), at the ring's edge (half
    // its widest way's width out from the node), and a triangle in each lane coming in behind it; but
    // none on a zebra, nor where the street is too short for it.
    const onZebra = insideOf(zebraZones);
    for (const [n, a] of g.arms) {
      const ring = a.filter((x) => x.e.t.junction === 'roundabout');
      if (!ring.length || ring.length === a.length) continue;
      const back = Math.max(...ring.map((x) => x.e.w)) / 2 + GIVE_OFF;
      for (const { e, i } of a) {
        if (e.t.junction === 'roundabout' || e.k > 7) continue;
        const end = i === e.pts.length - 1, d = driven(e.t);
        if (end ? d < 0 : d > 0) continue;
        // From the node out along the street: where the line is, and the way out there.
        const out = end ? [...e.pts].reverse() : e.pts, L = lengthOf(out);
        if (L < back + 1) continue;
        const at = (s) => { let r = s; for (let k = 1; k < out.length; k++) { const q = dist(out[k - 1], out[k]); if (r <= q || k === out.length - 1) { const u = Math.min(1, r / (q || 1)); return [[out[k - 1][0] + (out[k][0] - out[k - 1][0]) * u, out[k - 1][1] + (out[k][1] - out[k - 1][1]) * u], [(out[k][0] - out[k - 1][0]) / (q || 1), (out[k][1] - out[k - 1][1]) / (q || 1)]]; } r -= q; } return [out[0], [1, 0]]; };
        const [p, o] = at(back), right = [o[1], -o[0]];
        // The side coming in is to the right of its traffic, which runs against o: the street's own
        // right where it's drawn into the ring, its left where it's drawn out of it.
        const [l, r] = widthAt(e, i), [inR, inL] = end ? [r, l] : [l, r];
        const [s0, s1] = d === 0 ? [0.15, inR - 0.3] : [-(inL - 0.3), inR - 0.3];
        if (s1 - s0 < 1.5 || onZebra(...p)) continue;
        addLines('markings', [toPath([[p[0] + right[0] * s0, p[1] + right[1] * s0], [p[0] + right[0] * s1, p[1] + right[1] * s1]])], { kind: 'giveway', w: GIVE_W, dash: GIVE_DASH, level }, ys);
        if (L < back + YIELD_BACK + YIELD_LEN + 0.5) continue;
        const lanes = Math.max(1, Math.round((s1 - s0) / YIELD_LANE));
        for (let k = 0; k < lanes; k++) {
          const c = s0 + ((k + 0.5) * (s1 - s0)) / lanes, [b, ob] = at(back + YIELD_BACK), [t] = at(back + YIELD_BACK + YIELD_LEN), rb = [ob[1], -ob[0]];
          const base = [b[0] + rb[0] * c, b[1] + rb[1] * c], tip = [t[0] + rb[0] * c, t[1] + rb[1] * c];
          const tri = [[base[0] - (rb[0] * YIELD_BASE) / 2, base[1] - (rb[1] * YIELD_BASE) / 2], tip, [base[0] + (rb[0] * YIELD_BASE) / 2, base[1] + (rb[1] * YIELD_BASE) / 2]];
          if (tri.some((q) => onZebra(...q))) continue;
          addLines('markings', [toPath([...tri, tri[0]])], { kind: 'yield', w: YIELD_W, dash: null, level }, ys);
        }
      }
    }
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

// ---- The walls the streets end at (task 052) ----

// What a pavement or a path stops at (the owner's answer): the map's walls, fences, railings, hedges,
// guard rails and retaining walls, and the walls, fences and retaining walls the LiDAR found, but not
// the hedges it found (half of those in task 013's contact sheets were scrub) nor the gates; on the
// ground. And what a carriageway gives way to: the map's.
export const stopsAt = (w) => w.level !== 'bridge' && w.kind !== 'gate' && w.kind !== 'bar' && !(w.source === 'lidar' && w.kind === 'hedge');
export const givesWayTo = (w) => stopsAt(w) && w.source === 'osm';

// Some lines' stretches in cells of `cell` metres, for those near a box: each [ax, az, bx, bz, tag],
// the tag the line's own (`tags[j]` for the line j) or null.
function segments(lines, cell = 10, tags = null) {
  const grid = new Map(), segs = [];
  lines.forEach((pts, j) => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      if (ax === bx && az === bz) continue;
      const k = segs.push([ax, az, bx, bz, tags ? tags[j] : null]) - 1;
      for (let cx = Math.floor(Math.min(ax, bx) / cell); cx <= Math.floor(Math.max(ax, bx) / cell); cx++) for (let cz = Math.floor(Math.min(az, bz) / cell); cz <= Math.floor(Math.max(az, bz) / cell); cz++) {
        const key = cx + ',' + cz;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(k);
      }
    }
  });
  const near = (b) => {
    const got = new Set();
    for (let cx = Math.floor(b.x0 / cell); cx <= Math.floor(b.x1 / cell); cx++) for (let cz = Math.floor(b.z0 / cell); cz <= Math.floor(b.z1 / cell); cz++) for (const k of grid.get(cx + ',' + cz) ?? []) got.add(k);
    return [...got].map((k) => segs[k]);
  };
  return { segs, near };
}
// A ground pavement's heights (task 044), from the kerbs' runs [{ pts, h }] round it: at each point,
// its nearest kerb's top (the carriageway's ground there, `height(x, z)`, and a kerb), rising or
// falling towards the pavement's back as the land does, at most CROSS across; between two kerbs, one
// across from the other (within 45° of straight across, nearestAcross) no more than `span` apart (a
// pavement between two streets, a reservation, an island), from one's top to the other's, weighted
// by how near; down to a kerb dropped at a crossing over DROP. On its kerb (within ON of it, as the
// tiles' 10 cm grid puts a ring's points), a point is at the carriageway's ground right there and
// the kerb, so the kerb's face is the kerb's height. A kerb is a point's only if the way to it runs
// over the pavements (`inside`): one across a wall or open ground is another pavement's. With none,
// the land's and a kerb, as before; and `ease` past the kerb, eased back to that over EASE_OUT (a
// map's sidewalk out past a pavement's width). The kerbs to the 10 cm, as the tiles keep them. To the
// centimetre, a ring's points where its heights need them (follow).
const EASE_OUT = 1.5, ON = 0.12;
function paveHeights(runs, height, elev0, inside, span, ease = Infinity) {
  const dm = (pts) => pts.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
  const all = segments(runs.map((r) => dm(r.pts)), 10, runs.map((r) => r.h)), low = segments(runs.filter((r) => !r.h).map((r) => dm(r.pts)), 10);
  const top = (x, z) => height(x, z) - elev0 + KERB;
  // How far (x, z) is from a dropped kerb, up to DROP.
  const toDrop = (x, z) => Math.min(DROP, ...low.near({ x0: x - DROP, x1: x + DROP, z0: z - DROP, z1: z + DROP }).map(([ax, az, bx, bz]) => segDist([x, z], [ax, az], [bx, bz])));
  // The kerbs' nearest points within r of (x, z), nearest first.
  const feet = (x, z, r) => all.near({ x0: x - r, x1: x + r, z0: z - r, z1: z + r }).map(([ax, az, bx, bz, h]) => {
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const fx = ax + dx * t, fz = az + dz * t;
    return { fx, fz, h, d: Math.hypot(fx - x, fz - z) };
  }).filter((q) => q.d <= r).sort((p, q) => p.d - q.d);
  // Whether the way from (x, z) to a kerb's point q runs over the pavements: half way, and 30 cm short,
  // each on one or within 5 cm of one either side of the way (along a pavement's edge).
  const over = (x, z, q) => {
    if (q.d < 0.3) return true;
    const k = 0.3 / q.d, nx = ((q.fz - z) / q.d) * 0.05, nz = ((x - q.fx) / q.d) * 0.05;
    const on = (px, pz) => inside(px, pz) || inside(px + nx, pz + nz) || inside(px - nx, pz - nz);
    return on((x + q.fx) / 2, (z + q.fz) / 2) && on(q.fx + (x - q.fx) * k, q.fz + (z - q.fz) * k);
  };
  const ys = (x, z) => {
    let near = feet(x, z, 10);
    if (!near.length) near = feet(x, z, KERB_FAR);
    const drop = KERB * (1 - toDrop(x, z) / DROP);
    // Its kerb: the nearest, within a metre of the nearest, the way to which runs over the pavements.
    const a = near.find((q) => q.d <= near[0].d + 1 && over(x, z, q));
    if (!a) return top(x, z) - drop;
    // On it, the carriageway's ground right there and the kerb (none where it's dropped).
    const on = a.h ? top(x, z) - drop : top(x, z) - KERB;
    if (a.d <= ON) return on;
    // Off it: the nearest kerb across, the pavements on this side of it; or its own.
    const ta = top(a.fx, a.fz), r = span - a.d, ux = (x - a.fx) / a.d, uz = (z - a.fz) / a.d;
    const b = all.near({ x0: x - r, x1: x + r, z0: z - r, z1: z + r }).map(([ax, az, bx, bz]) => nearestAcross(x, z, ux, uz, ax, az, bx, bz)).filter((q) => q && q.d <= r).sort((p, q) => p.d - q.d).find((q) => over(x, z, q));
    let y;
    if (b) y = (ta * b.d + top(b.fx, b.fz) * a.d) / (a.d + b.d);
    else {
      y = ta + Math.max(-CROSS * a.d, Math.min(CROSS * a.d, top(x, z) - ta));
      y += (top(x, z) - y) * Math.max(0, Math.min(1, (a.d - ease) / EASE_OUT));
    }
    // From on it to off it over the next 10 cm.
    return on + (y - drop - on) * Math.min(1, (a.d - ON) / 0.1);
  };
  return Object.assign(ys, { cm: true });
}
// The nearest point to (x, z) of the stretch from (ax, az) to (bx, bz) within 45° of the way (ux, uz)
// from it (a unit vector), if any part of it is: { fx, fz, d }. The stretch clipped to the two sides
// of that wedge, then the nearest of what's left.
function nearestAcross(x, z, ux, uz, ax, az, bx, bz) {
  const c = Math.SQRT1_2, dx = bx - ax, dz = bz - az;
  let t0 = 0, t1 = 1;
  for (const [nx, nz] of [[(ux + uz) * c, (uz - ux) * c], [(ux - uz) * c, (ux + uz) * c]]) {
    // Inside the side whose normal is (nx, nz): f(t) = n · (a + t d - p) >= 0.
    const f0 = nx * (ax - x) + nz * (az - z), df = nx * dx + nz * dz;
    if (Math.abs(df) < 1e-12) {
      if (f0 < 0) return null;
    } else if (df > 0) t0 = Math.max(t0, -f0 / df);
    else t1 = Math.min(t1, -f0 / df);
  }
  if (t0 > t1) return null;
  const t = Math.max(t0, Math.min(t1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), fx = ax + dx * t, fz = az + dz * t;
  return { fx, fz, d: Math.hypot(fx - x, fz - z) };
}
const boxOf = (pts, m = 0) => ({ x0: Math.min(...pts.map((p) => p[0])) - m, x1: Math.max(...pts.map((p) => p[0])) + m, z0: Math.min(...pts.map((p) => p[1])) - m, z1: Math.max(...pts.map((p) => p[1])) + m });
// The right of a line's stretch j (from its point j - 1 to j), as a unit vector.
const rightOf = (pts, j) => { const [ax, az] = pts[j - 1], [bx, bz] = pts[j], L = Math.hypot(bx - ax, bz - az) || 1; return [-(bz - az) / L, (bx - ax) / L]; };

// The part of the segment from (ua, va) to (ub, vb) in [u0, u1] × [v0, v1] (Liang–Barsky), or null.
function clipTo(ua, va, ub, vb, u0, u1, v0, v1) {
  const du = ub - ua, dv = vb - va;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-du, ua - u0], [du, u1 - ua], [-dv, va - v0], [dv, v1 - va]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; t0 = Math.max(t0, r); } else { if (r < t0) return null; t1 = Math.min(t1, r); }
  }
  return [ua + du * t0, va + dv * t0, ua + du * t1, va + dv * t1];
}
// Whether the segment from p to q meets a ring: crosses its edge, or starts inside it.
function meetsRing(p, q, ring) {
  const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (o(p, q, a) !== o(p, q, b) && o(a, b, p) !== o(a, b, q)) return true;
  }
  let odd = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if (ring[i][1] > p[1] !== ring[j][1] > p[1] && p[0] < ring[i][0] + ((p[1] - ring[i][1]) / (ring[j][1] - ring[i][1])) * (ring[j][0] - ring[i][0])) odd = !odd;
  return odd;
}

// What's behind some walls (`walls`, segments()) from some edges: each piece { p, q, nrm } of an edge
// (a carriageway's, or a side of a path's line) looks straight out from it, along nrm, `depth` metres,
// and what's behind a wall it sees, from FACE short of the wall's line, is in its shadow; a wall it
// sees end on casts none, and none nearer it than `keep`. What's in one piece's shadow and in another's
// sight stays: a street on a wall's other side sees up to it. Returns the area to take away.
function shade(pieces, walls, depth, keep = 0) {
  const strips = [];
  for (const pc of pieces) {
    const [px, pz] = pc.p, L = dist(pc.p, pc.q);
    if (L < 1e-3) continue;
    const tx = (pc.q[0] - px) / L, tz = (pc.q[1] - pz) / L, [nx, nz] = pc.nrm;
    const at = (u, v) => [px + tx * u + nx * v, pz + tz * u + nz * v], corners = [at(0, 0), at(L, 0), at(L, depth), at(0, depth)], b = boxOf(corners);
    const dark = [];
    for (const [ax, az, bx, bz] of walls.near(b)) {
      const c = clipTo((ax - px) * tx + (az - pz) * tz, (ax - px) * nx + (az - pz) * nz, (bx - px) * tx + (bz - pz) * tz, (bx - px) * nx + (bz - pz) * nz, 0, L, 0, depth);
      if (!c || Math.abs(c[2] - c[0]) < 0.02) continue;
      dark.push(positive(toPath([at(c[0], Math.max(keep, c[1] - FACE)), at(c[2], Math.max(keep, c[3] - FACE)), at(c[2], depth + 0.1), at(c[0], depth + 0.1)])));
    }
    strips.push({ path: positive(toPath(corners)), b, dark });
  }
  if (!strips.some((s) => s.dark.length)) return [];
  // The shadows 50 m at a time, so that each union is small: each less what the pieces whose strips
  // reach into its box see.
  const cells = new Map(), C5 = 5;
  for (const s of strips) for (let cx = Math.floor(s.b.x0 / C5); cx <= Math.floor(s.b.x1 / C5); cx++) for (let cz = Math.floor(s.b.z0 / C5); cz <= Math.floor(s.b.z1 / C5); cz++) {
    const k = cx + ',' + cz;
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(s);
  }
  const bins = new Map();
  for (const s of strips) for (const d of s.dark) {
    const b = boundsOfPaths([d]), k = Math.floor((b.x0 + b.x1) / 100) + ',' + Math.floor((b.z0 + b.z1) / 100);
    if (!bins.has(k)) bins.set(k, { dark: [], b: { ...b } });
    const bin = bins.get(k);
    bin.dark.push(d);
    bin.b = { x0: Math.min(bin.b.x0, b.x0), x1: Math.max(bin.b.x1, b.x1), z0: Math.min(bin.b.z0, b.z0), z1: Math.max(bin.b.z1, b.z1) };
  }
  const out = [];
  for (const { dark, b } of bins.values()) {
    const near = new Set();
    for (let cx = Math.floor(b.x0 / C5); cx <= Math.floor(b.x1 / C5); cx++) for (let cz = Math.floor(b.z0 / C5); cz <= Math.floor(b.z1 / C5); cz++) for (const s of cells.get(cx + ',' + cz) ?? []) near.add(s);
    const seen = [...near].filter((s) => boxesMeet(s.b, b)).flatMap((s) => (s.sees ??= s.dark.length ? minus([s.path], s.dark) : [s.path]));
    out.push(...minus(union(dark), seen.length ? union(seen) : []));
  }
  return out;
}
// A line's two sides, in pieces of up to PIECE metres, each looking out from it.
function sides(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = dist(a, b), n = Math.max(1, Math.ceil(L / PIECE));
    if (L < 1e-3) continue;
    const nrm = rightOf(pts, i);
    for (let k = 0; k < n; k++) {
      const p = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n], q = [a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n];
      out.push({ p, q, nrm }, { p, q, nrm: [-nrm[0], -nrm[1]] });
    }
  }
  return out;
}

// Each street on the ground brought back to the map's walls that stand in it (the owner's answers):
// along its way, at each of its points and every SG metres or less between them, its edges' offsets
// from it, each brought back to FACE short of a wall of the map's (`walls`, segments()) running along
// it, within 30°, inside its band or within FACE of its edge. A wall in it under RUN long is left, to be cut as before; across an
// opening in a wall up to GAP long that no other street's way passes through (`ways`, segments() of
// the streets tagged with their edges), its edge runs on straight; but none round a deck's or a
// tunnel's end (`held`, [{ p, r }]). And it's no narrower than its
// lanes (lanesOf's, LANE_MIN each, or one where it has none): where they don't fit, each side goes
// back out in proportion to how far it came in, and the wall is cut where it stands in it. Each street
// brought back gets `pull`, { d, s, at, l, r }: those points, how far along it each is, which of them
// is each of its own points, and its edges' offsets to its left and right at each; and `gives`, what
// of its band gives way. Returns the m² of carriageway given way in `box`.
function pullBack(edges, walls, ways, box, held = []) {
  let m2 = 0;
  for (const e of edges) {
    const h = e.w / 2, F = Math.max(lanesOf(e.t), 1) * LANE_MIN;
    if (e.w - F < 0.1) continue;
    const near = walls.near(boxOf(e.pts, h + 1));
    if (!near.length) continue;
    const d = [], s = [], at = [], cum = [0];
    for (let j = 1; j < e.pts.length; j++) {
      const a = e.pts[j - 1], b = e.pts[j], L = dist(a, b), n = Math.max(1, Math.ceil(L / SG));
      at.push(d.length);
      for (let k = 0; k < n; k++) { d.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); s.push(cum[j - 1] + (L * k) / n); }
      cum.push(cum[j - 1] + L);
    }
    at.push(d.length);
    d.push(e.pts.at(-1));
    s.push(cum.at(-1));
    // The stretch each point is on (its first point's, at a point of the way), and its right there.
    const on = (i) => { let j = 1; while (j < e.pts.length - 1 && at[j] <= i) j++; return j; };
    const nrm = d.map((_, i) => rightOf(e.pts, on(i))), off = (i, o) => [d[i][0] + nrm[i][0] * o, d[i][1] + nrm[i][1] * o];
    const station = (x) => { let lo = 0, hi = s.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= x) lo = m; else hi = m; } return lo; };
    const l = new Float64Array(d.length).fill(h), r = new Float64Array(d.length).fill(h);
    for (const [ax, az, bx, bz] of near) {
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, m = Math.max(1, Math.ceil(L / 0.25));
      for (let k = 0; k <= m; k++) {
        const x = ax + (bx - ax) * (k / m), z = az + (bz - az) * (k / m);
        if (held.some((q) => Math.hypot(x - q.p[0], z - q.p[1]) < q.r)) continue;
        // Its nearest point on the way: how far along it, how far from it, which side, the way it runs.
        let best = null;
        for (let j = 1; j < e.pts.length; j++) {
          const [px, pz] = e.pts[j - 1], [qx, qz] = e.pts[j], dx = qx - px, dz = qz - pz, LL = Math.hypot(dx, dz) || 1e-9;
          const f = Math.max(0, Math.min(1, ((x - px) * dx + (z - pz) * dz) / (LL * LL))), o = Math.hypot(px + dx * f - x, pz + dz * f - z);
          if (!best || o < best.o) best = { j, f, o, along: cum[j - 1] + f * LL, right: (x - px) * -dz + (z - pz) * dx >= 0, t: [dx / LL, dz / LL] };
        }
        // Not past its ends, nor out of it (but within FACE of its edge, as where a road's two
        // carriageways touch, the map's wall in the crack between them), nor across it.
        if ((best.j === 1 && best.f <= 0) || (best.j === e.pts.length - 1 && best.f >= 1) || best.o >= h + FACE) continue;
        if (Math.abs(best.t[0] * ux + best.t[1] * uz) < ALONG) continue;
        const i = station(best.along), side = best.right ? r : l, v = Math.max(0, best.o - FACE);
        for (const q of [i, Math.min(d.length - 1, i + 1)]) side[q] = Math.min(side[q], v);
      }
    }
    for (const [side, sgn] of [[l, -1], [r, 1]]) {
      const runs = [];
      for (let i = 0; i < d.length; i++) if (side[i] < h - 0.01) { if (runs.length && runs.at(-1)[1] === i - 1) runs.at(-1)[1] = i; else runs.push([i, i]); }
      // On straight across a short opening that no other street passes through.
      for (let k = runs.length - 1; k > 0; k--) {
        const a = runs[k - 1][1], b = runs[k][0];
        if (s[b] - s[a] > GAP) continue;
        const quad = [off(a, sgn * side[a]), off(b, sgn * side[b]), off(b, sgn * (h + 0.5)), off(a, sgn * (h + 0.5))];
        if (ways.near(boxOf(quad)).some(([px, pz, qx, qz, f]) => f !== e && meetsRing([px, pz], [qx, qz], quad))) continue;
        for (let i = a + 1; i < b; i++) side[i] = side[a] + ((side[b] - side[a]) * (s[i] - s[a])) / (s[b] - s[a]);
        runs[k - 1][1] = runs[k][1];
        runs.splice(k, 1);
      }
      for (const [a, b] of runs) if (s[b] - s[a] < RUN) for (let i = a; i <= b; i++) side[i] = h;
    }
    let moved = false;
    for (let i = 0; i < d.length; i++) {
      if (l[i] + r[i] < F) { const k = (F - l[i] - r[i]) / (2 * h - l[i] - r[i]); l[i] += (h - l[i]) * k; r[i] += (h - r[i]) * k; }
      moved ||= l[i] < h - 0.01 || r[i] < h - 0.01;
    }
    if (!moved) continue;
    // What it keeps: each stretch from its left edge to its right, and at each of its points between
    // two stretches, the wedge between them either side; well out of its band where it isn't brought
    // back.
    const L2 = Array.from(l, (v) => (v < h - 0.01 ? v : h + 2)), R2 = Array.from(r, (v) => (v < h - 0.01 ? v : h + 2)), kept = [];
    for (let j = 1; j < e.pts.length; j++) {
      const idx = [];
      for (let i = at[j - 1]; i <= at[j]; i++) idx.push(i);
      const [nx, nz] = rightOf(e.pts, j);
      kept.push(positive(toPath([...idx.map((i) => [d[i][0] + nx * R2[i], d[i][1] + nz * R2[i]]), ...idx.reverse().map((i) => [d[i][0] - nx * L2[i], d[i][1] - nz * L2[i]])])));
      if (j === e.pts.length - 1) continue;
      const i = at[j], v = d[i], b = rightOf(e.pts, j + 1), sx = nx + b[0], sz = nz + b[1], sl = Math.hypot(sx, sz), f = sl > 1e-6 ? 1 / (Math.max(0.5, sl / 2) * sl) : 0, mx = sl > 1e-6 ? sx * f : nx, mz = sl > 1e-6 ? sz * f : nz;
      for (const [sg, o] of [[1, R2[i]], [-1, L2[i]]]) kept.push(positive(toPath([v, [v[0] + sg * nx * o, v[1] + sg * nz * o], [v[0] + sg * mx * o, v[1] + sg * mz * o], [v[0] + sg * b[0] * o, v[1] + sg * b[1] * o]])));
    }
    e.pull = { d, s, at, l, r };
    e.gives = minus(band([toPath(e.pts)], h + 1, true), union(kept));
    m2 += area(meet(meet(e.gives, band([toPath(e.pts)], h, true)), [rect(box)]));
  }
  return m2;
}
// What's behind some walls' stretches seen from a point p (a junction's, for its corner), from FACE
// short of each to R past it.
function behind(p, segs, R) {
  const out = [];
  for (const [ax, az, bx, bz] of segs) {
    const ends = [[ax, az], [bx, bz]].map((q) => { const d = dist(p, q), u = [(q[0] - p[0]) / (d || 1), (q[1] - p[1]) / (d || 1)]; return { d, near: [q[0] - u[0] * FACE, q[1] - u[1] * FACE], far: [q[0] + u[0] * R, q[1] + u[1] * R] }; });
    if (ends.some((e) => e.d < 0.5)) continue;
    out.push(positive(toPath([ends[0].near, ends[1].near, ends[1].far, ends[0].far])));
  }
  return out;
}
// A dead end's round end, where its street gives way to a wall: as wide as it is there.
function capOf(e, i) {
  const { d, l, r } = e.pull, k = i ? d.length - 1 : 0, [nx, nz] = rightOf(e.pts, i ? e.pts.length - 1 : 1), c = (r[k] - l[k]) / 2;
  return circle([d[k][0] + nx * c, d[k][1] + nz * c], (l[k] + r[k]) / 2, 24);
}
// A street's edges' offsets to its left and its right at its point i: its half width, or where it
// gives way to a wall.
const widthAt = (e, i) => (e.pull ? [e.pull.l[e.pull.at[i]], e.pull.r[e.pull.at[i]]] : [e.w / 2, e.w / 2]);
// Offsets eased: none more than EASE a metre past the next, so the lines painted on a street ease in
// and out where it narrows.
function ease(a, s) {
  const o = Float64Array.from(a);
  for (let i = 1; i < o.length; i++) o[i] = Math.min(o[i], o[i - 1] + EASE * (s[i] - s[i - 1]));
  for (let i = o.length - 2; i >= 0; i--) o[i] = Math.min(o[i], o[i + 1] + EASE * (s[i + 1] - s[i]));
  return o;
}

// ---- The paths (task 050) ----

// Which takes the other's place where two paths overlap: a flight of steps over everything, then a
// cycleway, a footway and a path.
const PATH_ORDER = ['steps', 'cycleway', 'footway', 'path'];
// A handrail's top over the steps' nosing, and how far in from the flight's side it runs.
const RAIL = 0.9, RAIL_IN = 0.15;
// The shallowest a flight's tread is made, spread over what the carriageways leave of its line: the
// tiles' 10 cm grid, which rounds a shallower one to nothing.
const TREAD = 0.1;
// How much of a path either side of its line a wall leaves it (task 052): one the map draws along the
// line, or nearly, stands on it, and is cut there.
const PATH_KEEP = 0.3;
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
//   (`kerbed`) give way to it. Its treads are spread over what the carriageways leave of its line, so
//   where an end runs under one, its riser there is at the kerb; and an end that meets a carriageway,
//   a pavement or a path is at its height as the tiles hold the ground (`height`), a pavement a kerb
//   over it, as a deck's end is (decision 023), the risers between evened out; one that meets the
//   land, a building or another flight as `flight` has it (task 051);
// - and so they do to a cycleway: where it runs in one, it's drawn there, flush with it, a kerb over
//   the ground (`flush`); or where it runs along the carriageway's edge, a lane at the carriageway's
//   level, with the kerb behind it (`lanes`), as the Avenida da Liberdade's red lanes are;
// - a footway or a path gives way to them, and to the pavements: where it meets a street, it joins
//   the pavement.
// Returns each piece { paths, kind, surface, level, raised, y }, y a tread's height (above elev0, as
// the flight's); what the kerbed areas give way to (`taken`); `flush` and `lanes`; the handrails
// { pts, ys, level }; and how many treads rise more than `step` over the one before (or the
// foot's ground), and how many flights there are.
function groundPaths(list, { U, kerbed, B, W, over, walled = null, boxPath = null, step = 0.3, levelName, height = null, elev0 = 0 }) {
  const nearU = splitter(U), nearK = splitter(kerbed), nearB = splitter([...B, ...W]), nearO = splitter(over);
  const out = [], taken = [], rails = [], stats = { flights: 0, treads: 0, steep: 0, behind: 0 };
  // Whether a point is in some pieces (those near it), and on which of the paths' lines (their bands).
  const within = (near) => (x, z) => {
    const q = { X: Math.round(x * S), Y: Math.round(z * S) };
    let n = 0;
    for (const r of near({ x0: x, x1: x, z0: z, z1: z })) if (C.Clipper.PointInPolygon(q, r) !== 0) n++;
    return n % 2 === 1;
  };
  const inU = within(nearU), inK = within(nearK), inB = within(nearB);
  const lineAt = segments(list.map((q) => q.pts), 10, list);
  const onLine = (x, z, not) => lineAt.near({ x0: x, x1: x, z0: z, z1: z }).find(([ax, az, bx, bz, q]) => q !== not && segDist([x, z], [ax, az], [bx, bz]) <= q.w / 2)?.[4];
  // The height a flight's end meets just past it, `s` metres along its line, going out (`dir`, -1 at
  // its foot, 1 at its top): a carriageway's, a pavement's a kerb over it, a path's; or null.
  const past = (p, pts, s, dir) => {
    const { p: [x0, z0], t } = along(pts, s), [x, z] = [x0 + t[0] * dir * 0.15, z0 + t[1] * dir * 0.15];
    if (inU(x, z)) return height(x, z) - elev0;
    if (inK(x, z)) return height(x, z) - elev0 + KERB;
    if (inB(x, z)) return null;
    const q = onLine(x, z, p);
    return q && q.kind !== 'steps' && (q.level === 0 || q.level === 3) ? height(x, z) - elev0 : null;
  };
  // Cut back as everything is, and on the ground to the walls either side of its line (task 052),
  // which open where it passes through them (walls.mjs).
  const cut = (A, p, pts = p.pts) => {
    const b = boundsOfPaths(A), onGround = p.level === 0 || p.level === 3;
    let got = onGround ? minus(A, nearU(b)) : A;
    if (p.level === 0) got = minus(got, nearB(b));
    if (onGround && walled) {
      const dark = shade(sides(pts), walled, p.w / 2 + 0.3, PATH_KEEP);
      if (dark.length) {
        stats.behind += area(boxPath ? meet(meet(got, dark), boxPath) : meet(got, dark));
        got = minus(got, dark);
      }
    }
    return onGround ? minus(got, nearO(b)) : got;
  };

  // The flights of steps, the first of two that overlap keeping its treads.
  const treads = [];
  for (const p of list.filter((q) => q.kind === 'steps' && q.flight)) {
    const f = p.flight, L = lengthOf(f.pts);
    if (L < 0.3) continue;
    let F = cut(band([toPath(f.pts)], p.w / 2, true), p, f.pts);
    const fb = boundsOfPaths(F);
    F = minus(F, treads.filter((t) => boxesMeet(t.b, fb)).flatMap((t) => t.paths));
    if (!F.length) continue;
    stats.flights++;
    // Over what the carriageways leave of its line, unless that makes a tread shallower than TREAD (then
    // over all of it, those under one cut away, as before task 051), and its ends at what they meet.
    let s0 = 0, s1 = L;
    while (s0 < L && inU(...along(f.pts, s0 + 0.025).p)) s0 += 0.05;
    while (s1 > s0 && inU(...along(f.pts, s1 - 0.025).p)) s1 -= 0.05;
    if (s1 - s0 < 0.3) [s0, s1] = [0, L];
    let foot = f.foot, top = f.ys.at(-1), n = f.n;
    if (height) {
      const a = past(p, f.pts, s0, -1) ?? foot, b = f.landing ? a + top - foot : past(p, f.pts, s1, 1) ?? top;
      if (b > a) {
        [foot, top] = [a, b];
        if (!f.counted) n = Math.max(1, Math.round((top - foot) / RISER));
      }
    }
    if (s1 - s0 < n * TREAD) [s0, s1] = [0, L];
    const ys = Array.from({ length: n }, (_, i) => foot + ((top - foot) * (i + 1)) / n), D = s1 - s0;
    let before = [], last = foot;
    ys.forEach((y, i) => {
      // (The first from its line's start, the last to its end: what's left of the band beside a kerb
      // across it at a slant.)
      const slab = band([toPath(stretch(f.pts, i ? s0 + (i * D) / n : 0, i < n - 1 ? s0 + ((i + 1) * D) / n : L))], p.w / 2 + 0.05, true);
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
      const r = top - foot, at = stationOn(f.pts), b = boundsOfPaths(F);
      const yr = (x, z) => Math.min(top, foot + r / n + (Math.max(0, at(x, z) - s0) * r) / D) + RAIL;
      for (const s of sides) {
        const line = cutLines(cutLines([toPath(shift(f.pts, s * (p.w / 2 - RAIL_IN)))], nearU(b), false), p.level === 0 ? nearB(b) : [], false);
        rails.push(...line.map((q) => ({ path: q, ys: yr, level: levelName(p.level) })));
      }
    }
  }
  const T = union(taken), nearT = splitter(T);

  // The cycleways: in a pavement, flush with it or a lane beside the road; else on the ground.
  const groups = new Map(); // `${kind}:${level}:${surface}:${where}` → paths
  const add = (k, ps) => { if (ps.length) groups.set(k, [...(groups.get(k) ?? []), ...ps]); };
  // A passage under a building (task 078) goes on MOUTH past each end that comes out in the open:
  // the map draws one from a corner of the building's outline to another, so its floor ended on the
  // outline, and a game cutting the building back to the passage left the outline's edge across its
  // mouth (and the tiles hold a building's points to half a metre, so the edge stood anywhere within
  // 25 cm of it); short of a metre where another building stands there. And one the map ends short of
  // the outline, inside the building, within OUT of coming out, is drawn on out of it.
  const MOUTH = 1, OUT = 3;
  const built = (x, z) => { const q = { X: Math.round(x * S), Y: Math.round(z * S) }; return nearB({ x0: x, x1: x, z0: z, z1: z }).some((r) => C.Clipper.PointInPolygon(q, r) !== 0); };
  // Its line drawn on, and the stretches added at its ends.
  const mouths = (p) => {
    const pts = [...p.pts], n = pts.length;
    if (p.level !== 3 || n < 2) return { pts, ends: [] };
    const on = ([ax, az], [bx, bz]) => {
      const L = Math.hypot(ax - bx, az - bz) || 1, u = [(ax - bx) / L, (az - bz) / L], at = (d) => built(ax + u[0] * d, az + u[1] * d);
      let e = 0;
      while (e <= OUT && at(e)) e += 0.25;
      if (e > OUT) return null;
      // As far as MOUTH past it, short of another building there (a neighbour's corner at its mouth).
      let d = e;
      while (d < e + MOUTH && !at(d + 0.25)) d += 0.25;
      return d > 0 ? [ax + u[0] * d, az + u[1] * d] : null;
    };
    const a = on(pts[0], pts[1]), b = on(pts[n - 1], pts[n - 2]);
    return { pts: [...(a ? [a] : []), ...pts, ...(b ? [b] : [])], ends: [...(a ? [[a, pts[0]]] : []), ...(b ? [[pts[n - 1], b]] : [])] };
  };
  const ofKind = (kind, also) => {
    for (const p of list.filter((q) => q.kind === kind && (q.level === 0 || q.level === 3))) {
      const m = mouths(p);
      let A = cut(band([toPath(m.pts)], p.w / 2), p);
      const b = boundsOfPaths(A);
      A = minus(A, [...nearT(b), ...also.flatMap((n) => n(b))]);
      // What's left of a passage beside a carriageway under its building, narrower than a walker
      // (under 70 cm), isn't a way through: a game would stand its sides in the street's way.
      if (p.level === 3) A = shapes(A).filter((sh) => opened(sh, 0.35).length).flat();
      const K = nearK(b);
      if (kind === 'cycleway') add(`${kind}:${p.level}:${p.surface}:in`, meet(A, K));
      // A passage's mouth in a pavement is its own, flush with the pavement, which gives way to it.
      else if (m.ends.length) add(`${kind}:${p.level}:${p.surface}:in`, meet(meet(A, K), band(m.ends.map(toPath), p.w / 2 + 0.05, true)));
      add(`${kind}:${p.level}:${p.surface}:out`, minus(A, K));
    }
  };
  // Each kind's pieces of each level and surface, the first of two that overlap keeping its own; a
  // passage under a building first, so its mouth is its own where the path outside meets it.
  const rank = (k) => (k.split(':')[1] === '3' ? '0' : '1') + k;
  const ownPlace = (kind) => {
    let mine = [];
    for (const [k, ps] of [...groups].filter(([k]) => k.startsWith(kind + ':')).sort(([a], [b]) => (rank(a) < rank(b) ? -1 : 1))) {
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
// A roundabout's island is `roundabout` (task 014), read as an island that's `round`; and the
// dashes, none, the lanes' or a give-way line's (DASHES).
export const STREET = ['asphalt', 'setts', 'paving', 'dirt', 'pavement', 'reservation', 'island', 'kerb', 'lane', 'centre', 'zebra', 'stop', 'giveway', 'yield', 'roundabout'];
const DASHES = [null, DASH, GIVE_DASH];
const LEVELS = ['ground', 'bridge', 'tunnel'];

// One tile's streets as 16-bit numbers, for index.js: each piece [what, ...], what its STREET code
// and 16 times its level; points in decimetres, the first of each ring or line from the tile's
// corner (x0, z0), each after it the step from the one before; and off the ground, the height of
// each point after them, in decimetres above ELEV0. A pavement, reservation or island on the ground
// laid at heights of its own (task 044) has LAID in its what, and after its points their heights to
// the centimetre (cms).
// - A carriageway, pavement, reservation or island (a roundabout's its own code): [what, rings, then
//   each ring's n and points], its outline first, then its holes.
// - A kerb: [what, its height in cm, 0, n, points]. A marking: [what, its width in cm, its dashes
//   (DASHES's index: 1 the lanes' 3 m on and 4 m off, 2 a give-way line's) or 0, n, points]; a
//   give-way triangle's outline closed, its last point its first.
export const LAID = 64;
// A piece's heights to the centimetre, in 16-bit numbers: the first in decimetres above ELEV0 and the
// centimetres more, then each after it the centimetres from the one before.
function cms(out, ys) {
  const all = ys.flat().map((y) => Math.round(y * 100));
  const d = Math.round(all[0] / 10);
  out.push(d, all[0] - d * 10, ...all.slice(1).map((y, i) => y - all[i]));
}
export function packStreets(got, x0, z0) {
  const out = [], dmOf = (v) => Math.round(v * 10);
  const pts = (list) => { let px = 0, pz = 0; list.forEach(([x, z], i) => { const a = dmOf(x - x0), b = dmOf(z - z0); out.push(i ? a - px : a, i ? b - pz : b); px = a; pz = b; }); };
  const what = (name, level) => STREET.indexOf(name) + 16 * LEVELS.indexOf(level);
  for (const p of [...got.carriageways, ...got.pavements]) {
    const laid = p.level === 'ground' && p.ys;
    out.push(what(p.surface ?? (p.round ? 'roundabout' : p.kind), p.level) + (laid ? LAID : 0), p.rings.length);
    for (const r of p.rings) { out.push(r.length); pts(r); }
    if (laid) cms(out, p.ys);
    else if (p.ys) for (const r of p.ys) for (const y of r) out.push(dmOf(y));
  }
  for (const k of got.kerbs) {
    out.push(what('kerb', k.level), Math.round(k.h * 100), 0, k.pts.length);
    pts(k.pts);
    if (k.ys) for (const y of k.ys) out.push(dmOf(y));
  }
  for (const m of got.markings) {
    out.push(what(m.kind, m.level), Math.round(m.w * 100), Math.max(0, DASHES.findIndex((d) => d && m.dash && d[0] === m.dash[0] && d[1] === m.dash[1])), m.pts.length);
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
//   above ELEV0 and the centimetres more, or on a bridge or in a tunnel each point's in decimetres;
//   or one on the ground (or under something at its level) flush with a pavement, LAID in its what
//   and its points' heights as a pavement's (cms, task 044).
// - A handrail, in `rails`: [its level, n, points, each point's height in decimetres].
export function packPaths(got, x0, z0) {
  const paths = [], rails = [], dmOf = (v) => Math.round(v * 10);
  const pts = (out, list) => { let px = 0, pz = 0; list.forEach(([x, z], i) => { const a = dmOf(x - x0), b = dmOf(z - z0); out.push(i ? a - px : a, i ? b - pz : b); px = a; pz = b; }); };
  for (const p of got.paths) {
    const laid = (p.level === 'ground' || p.level === 'under') && p.kind !== 'steps' && p.ys;
    paths.push(PATH.indexOf(p.kind) + (p.raised ? 4 : 0) + 8 * PATH_LEVELS.indexOf(p.level) + (laid ? LAID : 0), PATH_SURFACES.indexOf(p.surface), p.rings.length);
    for (const r of p.rings) { paths.push(r.length); pts(paths, r); }
    if (p.kind === 'steps') { const y = p.ys[0][0], d = dmOf(y); paths.push(d, Math.round(y * 100 - d * 10)); }
    else if (laid) cms(paths, p.ys);
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

// A ring (Clipper's, in centimetres) with a point added on each edge wherever its heights `ys` would be
// more than FOLLOW off the straight line between its points (at a quarter, half or three quarters of
// the way), halving the edge until they aren't or it's under 40 cm (task 044). The points are on the
// edge, to the centimetre: snap rounded with what it meets, both keep them.
const FOLLOW = 0.01;
function follow(r, ys) {
  const out = [], y = (q) => ys(q.X / S, q.Y / S);
  r.forEach((a, i) => {
    const b = r[(i + 1) % r.length], L = Math.hypot(b.X - a.X, b.Y - a.Y) / S, at = (t) => ({ X: Math.round(a.X + (b.X - a.X) * t), Y: Math.round(a.Y + (b.Y - a.Y) * t) });
    const split = (t0, y0, t1, y1) => {
      if ((t1 - t0) * L < 0.4 || ![0.25, 0.5, 0.75].some((k) => Math.abs(y(at(t0 + (t1 - t0) * k)) - (y0 + (y1 - y0) * k)) > FOLLOW)) return;
      const tm = (t0 + t1) / 2, m = at(tm), ym = y(m);
      split(t0, y0, tm, ym);
      out.push(m);
      split(tm, ym, t1, y1);
    };
    out.push(a);
    split(0, y(a), 1, y(b));
  });
  return out;
}

// A rectangle centred on p, running along d: `across` either side of it, `ahead` along it each way.
function rectAcross(p, d, across, ahead) {
  const [ax, az] = d, [nx, nz] = [-az, ax];
  return [[p[0] - ax * ahead - nx * across, p[1] - az * ahead - nz * across], [p[0] + ax * ahead - nx * across, p[1] + az * ahead - nz * across], [p[0] + ax * ahead + nx * across, p[1] + az * ahead + nz * across], [p[0] - ax * ahead + nx * across, p[1] - az * ahead + nz * across]];
}

// ---- On its own: the streets in a box, and a page to look at them over the orthophoto ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [{ CACHE, ELEV0, readCache }, { terrain }, { heldGround, levelHeights, onCarriageways, pathLines, pathsOf, streetsOf }, { ortho }, { loadWorld }, { decks }, jpeg] = await Promise.all([import('./geo.mjs'), import('./terrain.mjs'), import('./lines.mjs'), import('./dgt.mjs'), import('../index.js'), import('./decks.mjs'), import('jpeg-js')]);
  const a = process.argv.slice(2).map(Number);
  const box = a.length === 4 ? { x0: a[0], x1: a[1], z0: a[2], z1: a[3] } : { x0: -450, x1: 450, z0: 500, z1: 1150 };
  const ground = await terrain();
  // The ground as the tiles hold it, from the last `npm run world`, for the decks' ends (held to the
  // street there, as world.mjs holds it).
  const world = await loadWorld({ x0: box.x0 - 200, x1: box.x1 + 200, z0: box.z0 - 200, z1: box.z1 + 200 });
  const height = (x, z) => world.height(x, z) + ELEV0;
  const lines = streetsOf(onCarriageways(readCache('osm/base.json')), (x, z, m) => x >= box.x0 - 300 - m && x <= box.x1 + 300 + m && z >= box.z0 - 300 - m && z <= box.z1 + 300 + m);
  const deck = decks(), { heights } = levelHeights(lines, ground, height, heldGround(lines, ground, undefined, deck), deck);
  const nodes = onCarriageways(readCache('osm/street.json')).elements.filter((e) => e.type === 'node');
  const paths = pathLines(pathsOf(onCarriageways(readCache('osm/paths.json')), (x, z, m) => x >= box.x0 - m && x <= box.x1 + m && z >= box.z0 - m && z <= box.z1 + m), { ground, grid: height, deck, lines, heights, elev0: ELEV0 });
  const walls = fs.existsSync(path.join(CACHE, 'walls.json')) ? readCache('walls.json').walls : [];
  const made = streetSurfaces({
    lines, heights, elev0: ELEV0, height, nodes, box, paths, walls,
    buildings: world.buildings.map((b) => b.pts),
    squares: world.areas.filter((x) => x.kind === 'plaza').map((x) => [x.pts, ...x.holes]),
    water: world.areas.filter((x) => x.kind === 'water').map((x) => x.pts),
  });
  const got = { ...made.cuts.get('box'), stats: made.stats }, s = got.stats;
  console.log(`${s.edges} edges, ${s.junctions} junctions, ${s.islands} islands, ${s.reservations} reservations, ${Math.round(s.sidewalks)} m² of the map's sidewalks paved where the streets' pavements don't reach, ${Math.round(s.slivers)} m² of slivers closed, ${Math.round(s.past)} m² of corners cut back past a deck's or a tunnel's end, in ${s.seconds} s`);
  console.log(`carriageways ${Object.entries(s.m2).filter(([k]) => k !== 'pavement').map(([k, v]) => `${k} ${Math.round(v)} m²`).join(', ')}; pavements ${Math.round(s.m2.pavement)} m²; kerbs ${s.km.kerb.toFixed(2)} km, ${s.km.dropped.toFixed(2)} km dropped`);
  console.log(`walls: ${s.walls.streets} streets brought back to the map's walls in them, giving way ${Math.round(s.walls.given)} m² of carriageway; ${Math.round(s.walls.behind)} m² of pavement and ${Math.round(s.walls.paths)} m² of paths behind a wall taken off`);
  console.log(`${got.carriageways.length} carriageway pieces, ${got.pavements.length} pavements, ${got.kerbs.length} kerbs, ${got.markings.length} markings (${['lane', 'centre', 'zebra', 'stop', 'giveway', 'yield'].map((k) => `${got.markings.filter((m) => m.kind === k).length} ${k}`).join(', ')})`);
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
  fs.writeFileSync(path.join(dir, 'index.html'), page(box, got, walls.filter((w) => w.pts.some((q) => q[0] >= box.x0 - 20 && q[0] <= box.x1 + 20 && q[1] >= box.z0 - 20 && q[1] <= box.z1 + 20))));
  console.log(`${path.join(dir, 'index.html')}`);
}

// The page: the orthophoto, and over it the streets' surfaces, each kind on a layer of its own, and
// the walls (task 052): the map's red, the LiDAR's orange, the hedges it found green, the gates blue.
function page(box, got, walls = []) {
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
[class^="w-"] { fill: none; stroke-width: .25; stroke-linecap: round; } .w-osm { stroke: #ff2020; } .w-lidar { stroke: #ffa000; } .w-hedge { stroke: #30ff30; } .w-gate { stroke: #00b0ff; }
</style></head><body>
<svg id="v" viewBox="${box.x0} ${box.z0} ${W} ${H}">
<image href="ortho.jpg" x="${box.x0}" y="${box.z0}" width="${W}" height="${H}" preserveAspectRatio="none"/>
<g id="carriageways">${['asphalt', 'setts', 'paving', 'dirt'].map((s) => poly(got.carriageways.filter((c) => c.surface === s), s)).join('')}</g>
<g id="pavements">${['pavement', 'reservation', 'island'].map((k) => poly(got.pavements.filter((p) => p.kind === k), k)).join('')}</g>
<g id="paths">${['footway', 'path', 'cycleway', 'steps'].map((k) => got.paths.filter((p) => p.kind === k).map((p) => `<path class="p-${k}${p.raised ? ' raised' : ''} l-${p.level}" d="${p.rings.map(ring).join('')}"/>`).join('')).join('')}${line(got.handrails, () => 'class="rail"')}</g>
<g id="kerbs">${line(got.kerbs, (k) => `class="kerb${k.h ? '' : ' dropped'}"`)}</g>
<g id="markings">${line(got.markings, (m) => `class="${m.kind}" stroke-width="${m.w}"${m.dash ? ` stroke-dasharray="${m.dash.join(' ')}"` : ''}`)}</g>
<g id="walls">${line(walls, (w) => `class="w-${w.kind === 'gate' || w.kind === 'bar' ? 'gate' : w.source === 'osm' ? 'osm' : w.kind === 'hedge' ? 'hedge' : 'lidar'}"`)}</g>
</svg>
<div class="panel"><b>As ruas como superfícies</b> (tarefa 033)<br>
${[['carriageways', 'Faixas de rodagem'], ['pavements', 'Passeios, separadores e ilhas'], ['paths', 'Caminhos (azul), ciclovias (vermelho; laranja ao nível do passeio), escadas (magenta)'], ['kerbs', 'Lancis (laranja: rebaixados)'], ['markings', 'Marcas na estrada'], ['walls', 'Muros (vermelho: do mapa; laranja: do LiDAR; verde: sebes do LiDAR; azul: portões)']].map(([id, t]) => `<label><input type="checkbox" checked data-g="${id}"> ${t}</label>`).join('')}
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
