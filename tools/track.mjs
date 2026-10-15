// Plans a kart track on Braga's real streets, through its waypoints (tracks.mjs), and writes what
// the games need.
//
// node tools/track.mjs [id]      every track, or the one named
//
// 1. A street graph from OpenStreetMap, and the cheapest loop through the waypoints: bigger roads
//    cost less, sharp turns cost more, and the loop never uses a street twice or runs alongside
//    itself.
// 2. That loop turned into a raceable centre line: corners rounded to a radius a kart can take,
//    heights and how the street tips sideways from DGT's LiDAR, smoothed.
// 3. Where things go on it: the start, checkpoints, item boxes, boost pads and easter eggs.
// 4. The layout: a point every 8 m, with its width and how it's dressed.
// 5. What's along it: street names, landmarks, crossings, traffic lights and bus stops.
// 6. The output: tracks/<id>.js for the games, and the track in map/tracks.json for the map page.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE, ELEV0, P, readCache, ROOT } from './geo.mjs';
import { heights } from './dgt.mjs';
import { blur, carriageway, carsMay, COBBLE, driven, footprints, Inside, isOneway, lanesOf, LINE, openThin, segDist, simplify } from './osm.mjs';
import { loadWorld } from '../index.js';
import { EXT, sectionOf } from './sections.mjs';
import { band, grow, meet, positive, shapes, toPath, toPts, union } from './streets.mjs';
import { terrain } from './terrain.mjs';
import { TRACKS } from './tracks.mjs';

if (!process.argv[2]) {
  for (const t of TRACKS) execFileSync(process.execPath, [fileURLToPath(import.meta.url), t.id], { stdio: 'inherit' });
  process.exit(0);
}
const cfg = TRACKS.find((t) => t.id === process.argv[2]);
if (!cfg) throw new Error(`No track ${process.argv[2]} in tracks.mjs.`);
console.log(`\n${cfg.name}`);
const base = readCache('osm/base.json');
let places = cfg.waypoints, fixed = cfg.order;
if (places === 'private') {
  if (!fs.existsSync(path.join(CACHE, 'places.json'))) throw new Error('No waypoints: .cache/places.json holds the houses, from the shared map.');
  ({ places, order: fixed } = readCache('places.json'));
}
places = places.map((p) => ({ ...p }));


// ---------------------------------------------------------------------------------------------
// 1. The street graph and the loop.

// What a metre of each kind of street costs: the loop prefers avenues and keeps residential
// streets for where it has to go.
const RES = Number(process.env.RES || 1.15), TURN = Number(process.env.TURN || 15);
const COST = { primary: 1, secondary: 1, tertiary: 1.05, primary_link: 1.3, secondary_link: 1.3, tertiary_link: 1.3, unclassified: Math.min(1.3, RES), residential: RES, living_street: 2, jump: 1 };

// The rules of the road. A car may use a street unless its access tags say no (`carsMay` in
// osm.mjs), and drives it only the way it may (`driven`: one-way streets, roundabouts).

const nodes = new Map(); // id -> { x, z, adj: [{ to, len, kind, name, way, fwd, legal }] }
for (const e of base.elements) {
  const t = e.tags || {};
  if (e.type !== 'way' || !COST[t.highway] || (t.tunnel && t.tunnel !== 'no') || t.area === 'yes' || !carsMay(t)) continue;
  e.nodes.forEach((id, i) => {
    if (!nodes.has(id)) { const [x, z] = P(e.geometry[i]); nodes.set(id, { id, x, z, adj: [] }); }
  });
  const dir = driven(t);
  for (let i = 1; i < e.nodes.length; i++) {
    const a = nodes.get(e.nodes[i - 1]), b = nodes.get(e.nodes[i]);
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const edge = { kind: t.highway, name: t.name || '', len, way: e.id, tags: t };
    // Both ways are in the graph, for the streets that join the loop; `legal` says which may be
    // driven.
    a.adj.push({ to: b.id, ...edge, fwd: true, legal: dir >= 0 });
    b.adj.push({ to: a.id, ...edge, fwd: false, legal: dir <= 0 });
  }
}

// The turns the map bans at a junction, from one street onto another (`only_` ones ban every
// other turn from that street there), for cars at any hour. Their streets all end at the junction.
const restrictionsFile = path.join(CACHE, 'osm', 'restrictions.json');
if (!fs.existsSync(restrictionsFile)) throw new Error('No turn restrictions: node tools/fetch.mjs restrictions');
const bans = new Map(); // via node -> [{ from: Set of ways, to: Set of ways, only, uturn }]
const viaWay = [];
for (const r of readCache('osm/restrictions.json').elements) {
  const t = r.tags || {}, kind = t['restriction:motorcar'] ?? t['restriction:motor_vehicle'] ?? t.restriction;
  if (r.type !== 'relation' || !kind || /\b(motorcar|motor_vehicle)\b/.test(t.except || '')) continue;
  const role = (k) => r.members.filter((m) => m.role === k);
  const via = role('via');
  if (via.length === 0) continue;
  if (via.length > 1 || via[0].type !== 'node') { viaWay.push(r); continue; }
  const rule = { from: new Set(role('from').map((m) => m.ref)), to: new Set(role('to').map((m) => m.ref)), only: kind.startsWith('only_'), uturn: kind === 'no_u_turn', id: r.id };
  if (!bans.has(via[0].ref)) bans.set(via[0].ref, []);
  bans.get(via[0].ref).push(rule);
}
// The street driven from a to b: the legal one, where two run between the same nodes.
const edgeOf = (a, b) => nodes.get(a).adj.find((e) => e.to === b && e.legal) ?? nodes.get(a).adj.find((e) => e.to === b);
// Whether the turn from a through n to b is banned. A U-turn ban from a street back onto itself
// is kept for turning back, not for going on along it.
function banned(a, n, b) {
  const rules = bans.get(n);
  if (!rules) return null;
  const from = edgeOf(a, n)?.way, to = edgeOf(n, b)?.way;
  for (const r of rules) {
    if (!r.from.has(from)) continue;
    if (r.only ? !r.to.has(to) : r.to.has(to) && (!(r.uturn && from === to) || turn(nodes.get(a), nodes.get(n), nodes.get(b)) > Math.PI / 2)) return r;
  }
  return null;
}
// A track kept to some sections only has their streets.
if (cfg.sections) {
  for (const [id, n] of nodes) if (!cfg.sections.includes(sectionOf(n.x, n.z))) nodes.delete(id);
  for (const n of nodes.values()) n.adj = n.adj.filter((e) => nodes.has(e.to));
}

// The street a waypoint is on: the nearest stretch of road, and the nearer of its two ends.
function snap(x, z) {
  let best = null, bd = Infinity;
  for (const a of nodes.values()) for (const e of a.adj) {
    const b = nodes.get(e.to), d = segDist(x, z, a, b);
    if (d < bd) { bd = d; best = { a, b, name: e.name }; }
  }
  const n = Math.hypot(best.a.x - x, best.a.z - z) < Math.hypot(best.b.x - x, best.b.z - z) ? best.a : best.b;
  return { node: n, name: best.name, d: bd };
}

for (const p of places) {
  const s = snap(p.x, p.z);
  p.node = s.node.id;
  p.street = s.name;
}

// A binary heap of [cost, key].
class Heap {
  constructor() { this.a = []; }
  push(v) { const a = this.a; a.push(v); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}

const turn = (a, b, c) => {
  const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - b.x, vz = c.z - b.z;
  return Math.abs(Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz));
};

// Whether a kart coming from a may go on through n to b: the right way down b's street, by a turn
// that isn't banned and isn't a hairpin.
const mayGo = (a, n, b) => !!edgeOf(n, b)?.legal && !banned(a, n, b) && turn(nodes.get(a), nodes.get(n), nodes.get(b)) <= 2.4;

// Cheapest path from `from` (arriving there from `prev`, which it mustn't turn back to) to `to`,
// not arriving from `notFrom`, and able to go on to `after`, over directed edges so turns can be
// priced and the rules of the road kept. `extra(a, b)` adds the cost of reusing streets.
function route(from, prev, to, notFrom, extra, after) {
  const key = (n, p) => n + ',' + p;
  const best = new Map(), back = new Map();
  const heap = new Heap();
  const start = key(from, prev ?? '');
  best.set(start, 0);
  heap.push([0, start, from, prev]);
  while (heap.size) {
    const [c, k, n, p] = heap.pop();
    if (c > best.get(k)) continue;
    if (n === to && p !== notFrom && (after == null || mayGo(p, n, after))) {
      const path = [n];
      let kk = k;
      while (back.has(kk)) { const [pk, pn] = back.get(kk); path.push(pn); kk = pk; }
      return { cost: c, path: path.reverse(), last: p };
    }
    const N = nodes.get(n);
    for (const e of N.adj) {
      if (e.to === p || !e.legal || e.jump?.disabled) continue; // no turning back, nor against the traffic
      let cost = e.len * COST[e.kind] + (e.jump ? JUMP.price : 0) + extra(n, e.to);
      if (p != null && p !== '') {
        const th = turn(nodes.get(p), N, nodes.get(e.to));
        if (th > 2.4) continue; // a hairpin a kart can't make in a street
        if (banned(p, n, e.to)) continue;
        // A ramp is taken from its run-up, nearly straight on, and the landing street nearly
        // straight on from the flight.
        if (e.jump && th > (JUMP.turnOn * Math.PI) / 180) continue;
        if (edgeOf(p, n)?.jump && th > (JUMP.turnOff * Math.PI) / 180) continue;
        cost += TURN * (th / (Math.PI / 2)) ** 2;
      }
      const kk = key(e.to, n), nc = c + cost;
      if (nc < (best.get(kk) ?? Infinity)) { best.set(kk, nc); back.set(kk, [k, n]); heap.push([nc, kk, e.to, n]); }
    }
  }
  return null;
}

// The loop drives along each waypoint's street through it: in from one neighbour on that street,
// out to the other. `flips` says which way round, for each waypoint.
function through(p) {
  const n = nodes.get(p.node);
  let along = n.adj.filter((e) => e.name === p.street && !e.jump).map((e) => e.to);
  if (along.length < 2) along = [...along, ...n.adj.map((e) => e.to).filter((id) => !along.includes(id))];
  // The two that make the straightest line through the waypoint.
  let pair = null, bestT = Infinity;
  for (const a of along) for (const b of along) {
    if (a === b) continue;
    const th = turn(nodes.get(a), n, nodes.get(b));
    if (th < bestT) { bestT = th; pair = [a, b]; }
  }
  return pair;
}

function loopThrough(order, flips) {
  const ids = order.map((p) => p.node);
  const ends = order.map((p, k) => (flips[k] ? [...through(p)].reverse() : through(p)));
  // Each waypoint's street driven the right way, by a turn that's allowed.
  if (ends.some(([a, b], k) => !edgeOf(a, ids[k]).legal || !mayGo(a, ids[k], b))) return null;
  const used = new Set(), near = new Map();
  const cellOf = (x, z) => Math.floor(x / 30) + ',' + Math.floor(z / 30);
  const mark = (id) => {
    const n = nodes.get(id);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = Math.floor(n.x / 30) + a + ',' + (Math.floor(n.z / 30) + b); if (!near.has(c)) near.set(c, []); near.get(c).push(n); }
  };
  // A stretch by the ids of the street's own nodes, so a jump's run-up (copies of them) is the same street.
  const key = (a, b) => [nodes.get(a).orig ?? a, nodes.get(b).orig ?? b].sort().join('-');
  const extra = (a, b) => {
    const e = key(a, b);
    if (used.has(e)) return 5000;
    const A = nodes.get(a), B = nodes.get(b), mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2;
    // Close to a waypoint the loop comes and goes; elsewhere it keeps 28 m from itself.
    if (ids.some((id) => Math.hypot(nodes.get(id).x - mx, nodes.get(id).z - mz) < 70)) return 0;
    const close = (near.get(cellOf(mx, mz)) || []).some((n) => Math.hypot(n.x - mx, n.z - mz) < 28);
    return close ? 400 : 0;
  };
  const use = (a, b) => { used.add(key(a, b)); mark(a); mark(b); };
  ends.forEach(([a, b], k) => { use(a, ids[k]); use(ids[k], b); });
  const path = [];
  let cost = 0;
  for (let k = 0; k < ids.length; k++) {
    const [, out] = ends[k], [into] = ends[(k + 1) % ids.length], next = ids[(k + 1) % ids.length];
    const r = route(out, ids[k], into, next, extra, next);
    if (!r) return null;
    for (let i = 1; i < r.path.length; i++) use(r.path[i - 1], r.path[i]);
    path.push(ids[k], ...r.path);
    cost += r.cost;
  }
  // Each waypoint's own street appears twice where legs meet (into, waypoint, out): drop repeats.
  const clean = path.filter((id, i) => id !== path[(i + 1) % path.length]);
  return { path: clean, cost, closeTurn: 0 };
}

// Every order of the waypoints, unless places.json gives one (`order`, their ids): then only that
// order, round one way and the other (one-way streets may only allow one), and the directions
// through each. That keeps the loop as it was when a house is added.
const orders = [];
const [first, ...rest] = places;
const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
if (fixed) {
  const o = fixed.map((id) => places.find((p) => p.id === id));
  orders.push(o, [o[0], ...o.slice(1).reverse()]);
} else for (const p of perms(rest)) orders.push([first, ...p]);
// What a loop is made of, street by street, and how long it is.
const streetsOf = (path) => {
  const parts = [];
  let lastName = null, run = 0;
  for (let i = 0; i < path.length; i++) {
    const a = nodes.get(path[i]), b = nodes.get(path[(i + 1) % path.length]), e = edgeOf(a.id, b.id);
    const name = e ? e.name || '(' + e.kind + ')' : '?';
    if (name !== lastName && lastName !== null) { parts.push(`${lastName} ${Math.round(run)}`); run = 0; }
    lastName = name;
    run += Math.hypot(b.x - a.x, b.z - a.z);
  }
  parts.push(`${lastName} ${Math.round(run)}`);
  return parts.join(' | ');
};
const loopLength = (path) => path.reduce((L, id, i) => { const a = nodes.get(id), b = nodes.get(path[(i + 1) % path.length]); return L + Math.hypot(b.x - a.x, b.z - a.z); }, 0);
function search(quiet) {
  let best = null;
  for (const o of orders) {
    for (let f = 0; f < 1 << o.length; f++) {
      const flips = o.map((_, k) => !!(f & (1 << k)));
      const r = loopThrough(o, flips);
      if (!r) continue;
      if (!best || r.cost < best.cost) best = { ...r, order: o, flips };
    }
    if (!quiet) console.log('order', o.map((p) => p.id).join(' > '), 'best so far', Math.round(best?.cost ?? NaN));
  }
  return best;
}


// ---------------------------------------------------------------------------------------------
// 1b. Jumps into a pocket.
//
// Past some waypoints the street leads only into a pocket: a dead end, and any streets off it that
// lead nowhere either, with no other way in. The loop drives along each waypoint's street through
// it, so it could only come out of a pocket by turning back. The race jumps in instead (decision
// 027): from a ramp on a street a car may use outside the pocket, over whatever is really there,
// onto a street in the pocket heading for the waypoint, then on past it and out by the pocket's own
// mouth. The map's streets are the only roads the planner knows; a jump is the one way the loop
// leaves them, and the games put its ramp up only for a race.

// What makes a jump one a kart can race. Its flight is a kart game's: party-kart's gravity, and the
// speeds its karts reach in a street.
const JUMP = {
  gap: [15, 60], // m from the ramp's lip to where the flight meets the landing street's middle
  turnOn: 25, // ° at most from the street the ramp stands on to the flight: a kart takes it at speed
  turnOff: 40, // ° at most from the flight to the landing street
  runUp: 40, // m of straight street before the lip
  land: 25, // m of straight street on from the landing
  ramp: 8, // m up the ramp's slope
  angles: [10, 12.5, 15, 17.5, 20], // ° the ramp may rise at: the gentlest that clears is taken
  g: 12, // m/s²
  v: 33, // m/s, the most a kart may need to clear it: party-kart's reach 37 on the flat
  flat: 44, // m/s, a kart flat out (party-kart's top speed), at the ramp's foot
  past: 4, // m past the landing point the slowest flight comes down
  margin: 0.5, // m between the slowest flight and anything under it, by the LiDAR's surface model
  price: 1000, // what a jump adds to the loop's cost, so it takes one only where it has to
};
// A flight's height over the ramp's lip, s metres on, at speed v from a ramp at angle th.
const arc = (th, v, s) => s * Math.tan(th) - (JUMP.g * s * s) / (2 * v * v * Math.cos(th) ** 2);
const deg = (r) => Math.round((r * 180) / Math.PI);

// The streets past a waypoint that lead nowhere else, when its street leads into a pocket.
const POCKET = 300; // nodes at most: the rest of the map has thousands
function pocketPast(p) {
  const sides = through(p).map((first) => {
    const seen = new Set([first]), todo = [first];
    while (todo.length && seen.size <= POCKET) for (const e of nodes.get(todo.pop()).adj) if (e.to !== p.node && !seen.has(e.to)) { seen.add(e.to); todo.push(e.to); }
    return seen.size <= POCKET ? seen : null;
  });
  if (sides[0] && sides[1]) throw new Error(`Waypoint ${p.id}'s street leads nowhere either way.`);
  return sides[0] ?? sides[1];
}

// Points every 2 m along a street, the way it's driven from a to b: on the edge e, s metres from a.
function along(a, e) {
  const b = nodes.get(e.to), hx = (b.x - a.x) / e.len, hz = (b.z - a.z) / e.len, out = [];
  for (let s = 0; s < e.len; s += 2) out.push({ x: a.x + hx * s, z: a.z + hz * s, hx, hz, a, b, e, s });
  return out;
}
// How far the streets run straight from a point, on (dir 1) or back (dir -1): metres until they
// stray 2.5 m from its line, taking the straightest way at each junction, and only through `keep`.
function straight(pt, dir, keep) {
  const ux = pt.hx * dir, uz = pt.hz * dir;
  let cur = dir > 0 ? pt.b : pt.a, prev = dir > 0 ? pt.a : pt.b, run = 0;
  for (let guard = 0; guard < 50; guard++) {
    const dx = cur.x - pt.x, dz = cur.z - pt.z, off = Math.abs(dx * uz - dz * ux), fw = dx * ux + dz * uz;
    if (off > 2.5) return Math.max(run, (fw * 2.5) / off);
    run = fw;
    let next = null, bc = -2;
    for (const e of cur.adj) {
      if (e.to === prev.id || e.jump || !keep(e.to)) continue;
      const n = nodes.get(e.to), c = ((n.x - cur.x) * ux + (n.z - cur.z) * uz) / e.len;
      if (c > bc) { bc = c; next = n; }
    }
    if (!next) return run;
    [prev, cur] = [cur, next];
  }
  return run;
}
// A node of the graph at a point on a street: the nearer end of its stretch within a metre, or a new
// node splitting the stretch there.
let made = 0;
function nodeOn({ x, z, e: { way } }) {
  let best = null, bd = Infinity;
  for (const a of nodes.values()) for (const e of a.adj) {
    if (e.way !== way || !e.fwd) continue;
    const d = segDist(x, z, a, nodes.get(e.to));
    if (d < bd) { bd = d; best = { a, e }; }
  }
  const { a, e } = best, b = nodes.get(e.to), len = e.len, s = Math.hypot(x - a.x, z - a.z);
  if (s < 1) return a;
  if (len - s < 1) return b;
  const m = { id: `jump-${++made}`, x, z, adj: [] }, back = b.adj.find((r) => r.to === a.id && r.way === way);
  nodes.set(m.id, m);
  m.adj.push({ ...back, len: s }, { ...e, len: len - s });
  Object.assign(e, { to: m.id, len: s });
  Object.assign(back, { to: m.id, len: len - s });
  return m;
}
// Whether two segments cross.
const crosses = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};

const ground = await terrain();
const pockets = places.map((p) => ({ p, pocket: pocketPast(p) })).filter((q) => q.pocket);
const jumps = [];
for (const { p, pocket } of pockets) {
  const wp = nodes.get(p.node), inside = (id) => pocket.has(id) || id === p.node;
  console.log(`\n${p.id}'s street leads into a pocket of ${pocket.size} nodes: jumps in`);
  // Metres along the pocket's streets to the waypoint: the landing heads for it.
  const toWp = new Map([[p.node, 0]]);
  for (const todo = [p.node]; todo.length; ) {
    const n = nodes.get(todo.shift());
    for (const e of n.adj) if (pocket.has(e.to) && toWp.get(n.id) + e.len < (toWp.get(e.to) ?? Infinity)) { toWp.set(e.to, toWp.get(n.id) + e.len); todo.push(e.to); }
  }
  const landings = [], takeoffs = [];
  for (const id of pocket) { const a = nodes.get(id); for (const e of a.adj) if (e.legal && inside(e.to) && toWp.get(e.to) < toWp.get(id)) landings.push(...along(a, e)); }
  const pts = [...pocket].map((id) => nodes.get(id));
  const nearPocket = (n) => pts.some((q) => Math.hypot(q.x - n.x, q.z - n.z) < JUMP.gap[1] + 40);
  for (const a of nodes.values()) {
    if (inside(a.id) || !nearPocket(a)) continue;
    for (const e of a.adj) if (e.legal && !inside(e.to)) takeoffs.push(...along(a, e));
  }
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const q of [...pts, wp]) { bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); bz0 = Math.min(bz0, q.z); bz1 = Math.max(bz1, q.z); }
  const reach = JUMP.gap[1] + 50, surface = await heights('mds', { x0: bx0 - reach, x1: bx1 + reach, z0: bz0 - reach, z1: bz1 + reach });
  // Every takeoff and landing within reach, the flight heading off the one and onto the other within
  // 60°, kept or not, so the owner sees why one isn't.
  const all = [];
  for (const t of takeoffs) for (const l of landings) {
    const dx = l.x - t.x, dz = l.z - t.z, g = Math.hypot(dx, dz);
    if (g < JUMP.gap[0] || g > JUMP.gap[1]) continue;
    const fx = dx / g, fz = dz / g;
    const on = Math.acos(Math.min(1, fx * t.hx + fz * t.hz)), off = Math.acos(Math.min(1, fx * l.hx + fz * l.hz));
    if (on > Math.PI / 3 || off > Math.PI / 3) continue;
    const c = { p: p.id, t, l, g, fx, fz, on, off, yT: ground.at(t.x, t.z), yL: ground.at(l.x, l.z) };
    c.runUp = straight(t, -1, (id) => !inside(id));
    c.landing = straight(l, 1, inside);
    // The gentlest ramp whose slowest flight onto the landing clears what's under it.
    const wT = carriageway(t.e.tags), wL = carriageway(l.e.tags);
    c.clear = -Infinity;
    for (const a of JUMP.angles) {
      const th = (a * Math.PI) / 180, lip = JUMP.ramp * Math.sin(th), y0 = c.yT + lip;
      let v = null;
      for (let u = 10; u <= JUMP.v; u += 0.5) if (y0 + arc(th, u, g + JUMP.past) >= c.yL) { v = u; break; }
      if (!v) continue;
      let clear = Infinity, tallest = 0, low = Infinity;
      for (let s = 0; s <= g; s += 0.5) for (const o of [-1.5, 0, 1.5]) {
        const x = t.x + fx * s - fz * o, z = t.z + fz * s + fx * o;
        // Not the streets it leaves and lands on: their parked cars aren't in the way.
        if (segDist(x, z, t.a, t.b) < wT / 2 || segDist(x, z, l.a, l.b) < wL / 2) continue;
        const top = surface(x, z), gy = ground.at(x, z);
        low = Math.min(low, gy);
        if (top == null) continue;
        tallest = Math.max(tallest, top - gy);
        clear = Math.min(clear, y0 + arc(th, v, s) - top);
      }
      if (clear > c.clear) Object.assign(c, { angle: th, lip, v, clear, tallest, low });
      if (clear >= JUMP.margin) break;
    }
    c.why = [
      c.on > (JUMP.turnOn * Math.PI) / 180 && `turns ${deg(c.on)}° onto the ramp`,
      c.off > (JUMP.turnOff * Math.PI) / 180 && `turns ${deg(c.off)}° off the flight`,
      c.runUp < JUMP.runUp && `a run-up of ${Math.round(c.runUp)} m`,
      c.landing < JUMP.land && `a landing of ${Math.round(c.landing)} m`,
      !c.v && `needs over ${JUMP.v} m/s`,
      c.v && c.clear < JUMP.margin && `${c.clear.toFixed(1)} m clear of what's under it`,
    ].filter(Boolean);
    all.push(c);
  }
  // The best of each pair of streets, takeoff and landing: one that's kept if any is, the gentlest
  // and slowest; otherwise the one nearest to being kept.
  const groups = new Map();
  for (const c of all) { const k = c.t.e.way + '>' + c.l.e.way; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
  for (const cs of groups.values()) {
    cs.sort((a, b) => a.why.length - b.why.length || (a.angle ?? 9) - (b.angle ?? 9) || (a.v ?? 99) - (b.v ?? 99) || b.clear - a.clear);
    jumps.push(cs[0]);
  }
}
// What's under each flight, from the map: the streets and rivers it crosses, and the buildings.
if (jumps.length) {
  const fps = footprints(readCache('osm/buildings.json')).map((e) => e.geometry.map(P));
  for (const c of jumps) {
    const a = [c.t.x, c.t.z], b = [c.l.x, c.l.z], over = new Set();
    let buildings = 0;
    for (const e of base.elements) {
      if (e.type !== 'way' || !(e.tags?.highway || e.tags?.waterway) || e.id === c.t.e.way || e.id === c.l.e.way) continue;
      const g = e.geometry.map(P);
      for (let i = 1; i < g.length; i++) if (crosses(a, b, g[i - 1], g[i])) { over.add(e.tags.name || e.tags.waterway || e.tags.highway); break; }
    }
    for (const g of fps) for (let i = 1; i < g.length; i++) if (crosses(a, b, g[i - 1], g[i])) { buildings++; break; }
    c.over = [...over, `${buildings} buildings`];
  }
}
const describe = (c) => `from ${c.t.e.name || c.t.e.kind} (${Math.round(c.t.x)}, ${Math.round(c.t.z)}) onto ${c.l.e.name || c.l.e.kind} (${Math.round(c.l.x)}, ${Math.round(c.l.z)}): ${Math.round(c.g)} m, ${(c.yT - c.yL).toFixed(1)} m down; turns ${deg(c.on)}° onto the ramp and ${deg(c.off)}° off the flight; run-up ${Math.round(c.runUp)} m, landing ${Math.round(c.landing)} m; ${c.v ? `a ${((c.angle * 180) / Math.PI).toFixed(1)}° ramp (lip ${c.lip.toFixed(1)} m) clears it from ${c.v} m/s, ${c.clear.toFixed(1)} m over what's under it (the tallest thing ${c.tallest.toFixed(1)} m high), the ground down to ${(c.yT - c.low).toFixed(1)} m below the takeoff` : `no ramp clears it under ${JUMP.v} m/s`}; over ${c.over.join(', ')}`;
// Each kept jump alone, and the loop it gives; then the planner's pick, the cheapest loop, or the
// one JUMP=<n> names.
const kept = jumps.filter((c) => !c.why.length);
for (const [k, c] of jumps.entries()) {
  c.n = k + 1;
  if (c.why.length) { console.log(`\njump ${c.n}, not kept (${c.why.join('; ')}): ${describe(c)}`); continue; }
  const T = nodeOn(c.t), L = nodeOn(c.l);
  // The run-up, at least JUMP.runUp m of the street straight back from the lip, as a street of its
  // own: copies of its nodes, joined to the rest only at its start, so the loop can only reach the
  // ramp straight down it.
  const chain = [T];
  for (let run = 0; run < JUMP.runUp; ) {
    const cur = chain[0];
    let best = null, bc = 0.9;
    for (const e of cur.adj) {
      const n = nodes.get(e.to), back = n.adj.find((r) => r.to === cur.id && r.legal);
      const cos = ((cur.x - n.x) * c.t.hx + (cur.z - n.z) * c.t.hz) / e.len;
      if (back && !chain.includes(n) && cos > bc) { bc = cos; best = n; }
    }
    if (!best) break;
    run += Math.hypot(chain[0].x - best.x, chain[0].z - best.z);
    chain.unshift(best);
  }
  if (chain.length < 2) throw new Error(`No run-up to jump ${c.n}.`);
  const copy = new Map(chain.slice(1).map((n) => [n.id, { id: `${n.id}~${c.n}`, orig: n.id, x: n.x, z: n.z, adj: [] }]));
  for (const m of copy.values()) nodes.set(m.id, m);
  for (let i = 1; i < chain.length; i++) {
    const a = chain[i - 1], b = chain[i], e = a.adj.find((r) => r.to === b.id && r.legal);
    (copy.get(a.id) ?? a).adj.push({ ...e, to: copy.get(b.id).id });
  }
  c.edge = { to: L.id, kind: 'jump', name: '', len: c.g, way: `jump${c.n}`, tags: {}, fwd: true, legal: true, jump: c };
  copy.get(T.id).adj.push(c.edge);
}
for (const c of kept) {
  for (const o of kept) o.disabled = o !== c;
  c.loop = search(true);
  console.log(`\njump ${c.n}: ${describe(c)}`);
  console.log(c.loop ? `  the loop: ${Math.round(loopLength(c.loop.path))} m, ${streetsOf(c.loop.path)}` : '  no loop through the waypoints with it');
}
const chosen = process.env.JUMP ? kept.find((c) => c.n === Number(process.env.JUMP)) : kept.filter((c) => c.loop).sort((a, b) => a.loop.cost - b.loop.cost)[0];
if (process.env.JUMP && !chosen) throw new Error(`No kept jump ${process.env.JUMP}.`);
for (const c of kept) c.disabled = c !== chosen;
if (chosen) console.log(`\nthe pick: jump ${chosen.n}${process.env.JUMP ? ' (JUMP)' : ', the cheapest loop'}`);

const bestLoop = search(false);
if (!bestLoop) throw new Error('No loop through the waypoints.');
const loop = bestLoop.path.map((id) => nodes.get(id));

console.log('\nloop', bestLoop.order.map((p) => p.id).join(' > '), Math.round(loopLength(bestLoop.path)), 'm,', loop.length, 'nodes');
console.log(streetsOf(bestLoop.path));

// The loop checked against the rules of the road: every street driven the right way and every turn
// allowed. The map's few bans on a turn through a short street (`via` a way) aren't kept by
// `route`, only checked here.
{
  const N = loop.length, wrong = [], turns = [];
  let oneway = 0, ruled = 0;
  for (let i = 0; i < N; i++) {
    const a = loop[(i - 1 + N) % N], n = loop[i], b = loop[(i + 1) % N], e = edgeOf(n.id, b.id);
    if (!e.legal) wrong.push({ street: e.name || e.kind, at: [Math.round(n.x), Math.round(n.z)], m: Math.round(e.len) });
    else if (driven(e.tags)) oneway += e.len;
    const r = banned(a.id, n.id, b.id);
    if (r) turns.push({ relation: r.id, at: [Math.round(n.x), Math.round(n.z)] });
    if (bans.has(n.id)) ruled++;
  }
  const ways = loop.map((n, i) => edgeOf(n.id, loop[(i + 1) % N].id).way).filter((w, i, all) => w !== all[(i - 1 + all.length) % all.length]);
  for (const r of viaWay) {
    const t = r.tags, only = (t['restriction:motorcar'] ?? t['restriction:motor_vehicle'] ?? t.restriction).startsWith('only_');
    const seq = (role) => r.members.filter((m) => m.role === role).map((m) => m.ref);
    const from = seq('from'), via = seq('via'), to = seq('to');
    ways.forEach((w, i) => {
      if (!from.includes(w) || !via.every((v, k) => ways[(i + 1 + k) % ways.length] === v)) return;
      const next = ways[(i + 1 + via.length) % ways.length];
      if (only ? !to.includes(next) : to.includes(next)) turns.push({ relation: r.id, via: 'way' });
    });
  }
  console.log(`rules of the road: ${Math.round(oneway)} m on one-way streets, the right way; ${ruled} junctions on it with turn restrictions; ${wrong.reduce((s, w) => s + w.m, 0)} m against the traffic; ${turns.length} banned turns`);
  if (wrong.length || turns.length) throw new Error(`The loop breaks the rules of the road: ${JSON.stringify({ wrong, turns })}`);
}


// ---------------------------------------------------------------------------------------------
// 2. The centre line.

const loopEdges = loop.map((a, i) => edgeOf(a.id, loop[(i + 1) % loop.length].id));
const R_MIN = 12; // the corner radius aimed for: a street corner, about 80 km/h for a kart

// The streets as the games draw and drive them (task 033): each one's carriageway, a band round the
// map's line at its real width, joined to the others where they meet, each corner rounded as a kerb
// turns it; read from the open world's tiles (`npm run world` makes them, and they don't depend on a
// track).
const world = await loadWorld({ open: true });
if (!world.streets.carriageways.length) throw new Error('No streets in the tiles: npm run world first.');
const pieces = world.streets.carriageways.filter((c) => c.level !== 'tunnel');
const paved = ['ground', 'bridge'].map((level) => new Inside(pieces.filter((c) => c.level === level).flatMap((c) => c.rings)));
const drawnRoad = (x, z) => paved[0].has(x, z) || paved[1].has(x, z);

// The race's road (decision 019): the route's own streets at their real widths, as they're drawn
// (each a band round the map's line, the corners between them rounded as a kerb turns them, at most
// KERB_R), where the streets drawn have carriageway; a sliver of pavement into it under 2 × SLIVER
// wide taken as road (task 037 found the tiles have a few). And in a ramp's flight, the flight, as
// wide as the ramp and 2 m either side. Its outline is the race's walls: the kerbs, and rows of
// barriers across the side streets it passes, wherever the carriageway goes on past it.
const KERB_R = 10, SLIVER = 0.6;
const road = (() => {
  // The route's streets, a run of the loop's stretches of one width at a time.
  const N = loop.length, w = loopEdges.map((e) => (e.jump ? 0 : carriageway(e.tags)));
  let k0 = w.findIndex((v, i) => v !== w[(i - 1 + N) % N]);
  if (k0 < 0) k0 = 0;
  const bands = [];
  for (let k = 0; k < N; ) {
    const i = (k0 + k) % N;
    let j = k;
    while (j + 1 < N && w[(k0 + j + 1) % N] === w[i]) j++;
    if (w[i]) bands.push(...band([toPath(Array.from({ length: j - k + 2 }, (_, m) => [loop[(k0 + k + m) % N].x, loop[(k0 + k + m) % N].z]))], w[i] / 2, true));
    k = j + 1;
  }
  const U = union(bands);
  const W = union(pieces.flatMap((c) => c.rings.map((r, k) => (k ? positive(toPath(r)).reverse() : positive(toPath(r))))));
  const near = meet(W, grow(U, 20));
  let R = meet(grow(grow(U, KERB_R), -KERB_R), grow(grow(near, SLIVER), -SLIVER));
  // Only the pieces the route runs through.
  R = shapes(R).filter((rings) => { const p = new Inside(rings.map(toPts)); return loop.some((n) => p.has(n.x, n.z)); }).flatMap((rings) => rings);
  const flight = loopEdges.find((e) => e.jump)?.jump;
  if (flight) {
    // Flat out at the ramp's foot, less what its slope and climb cost, a kart comes down this far past
    // the landing point: the race's road takes in the flight to there and 6 m on, over whatever is
    // there, so it lands and drives back onto the street (the owner's answer in task 037).
    const { t, l, fx, fz } = flight, h = carriageway(t.e.tags) / 2 + 2, foot = JUMP.ramp + 2;
    const v = JUMP.flat * Math.cos(flight.angle) - 1.5, lip = JUMP.ramp * Math.sin(flight.angle);
    let s = flight.g;
    while (s < 200 && flight.yT + lip + arc(flight.angle, v, s) > flight.yL) s += 0.5;
    const past = s - flight.g + 6;
    console.log(`the race's road takes in the jump's flight to ${Math.round(past)} m past its landing, where a kart flat out comes down`);
    const ends = [[t.x - fx * foot, t.z - fz * foot], [l.x + fx * past, l.z + fz * past]];
    R = union(R, [positive(toPath([[ends[0][0] - fz * h, ends[0][1] + fx * h], [ends[1][0] - fz * h, ends[1][1] + fx * h], [ends[1][0] + fz * h, ends[1][1] - fx * h], [ends[0][0] + fz * h, ends[0][1] - fx * h]]))]);
  }
  return shapes(R).map((rings) => rings.map(toPts));
})();
const raceRoad = new Inside(road.flat());
// The race runs on it: its line is the streets' own middles, and where it folds a jog at a junction or
// rounds a corner, it keeps CLEAR of its edges.
const onRoad = (x, z) => raceRoad.has(x, z);
const CLEAR = 1.2;
// On a carriageway, with the kerbs at least r away all round.
const clear = (x, z, r = CLEAR) => onRoad(x, z) && [0, 1, 2, 3, 4, 5, 6, 7].every((k) => onRoad(x + r * Math.cos((k * Math.PI) / 4), z + r * Math.sin((k * Math.PI) / 4)));
// Every metre of a path (open, [x, z] points) clear.
const keeps = (path) => path.every((a, i) => {
  if (!i) return clear(...a);
  const b = path[i - 1], n = Math.max(1, Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1])));
  for (let k = 1; k <= n; k++) if (!clear(b[0] + ((a[0] - b[0]) * k) / n, b[1] + ((a[1] - b[1]) * k) / n)) return false;
  return true;
});
// How far from (x, z) along (dx, dz) the carriageway goes, to 20 m.
const reach = (x, z, dx, dz) => { let o = 0; while (o < 20 && onRoad(x + dx * (o + 0.1), z + dz * (o + 0.1))) o += 0.1; return o; };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len2 = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len2(a) || 1; return [a[0] / l, a[1] / l]; };

// Each corner becomes an arc of radius R_MIN, or tighter where the streets either side are too
// short for it, or where a wider one would take the line within CLEAR of the kerb on the inside.
// Returns the points every few metres, the corners that had to be tighter, and those whose arc
// comes closer to the kerb than CLEAR at any radius.
function fillet(pts) {
  const n = pts.length, out = [], tight = [], close = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const u = unit(sub(b, a)), v = unit(sub(c, b));
    const th = Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
    if (Math.abs(th) < 0.05) { out.push(b); continue; }
    const half = Math.tan(Math.abs(th) / 2);
    const room = Math.min(len2(sub(b, a)), len2(sub(c, b))) / 2;
    const arc = (r) => {
      const t = r * half, p1 = [b[0] - u[0] * t, b[1] - u[1] * t];
      const side = Math.sign(th);
      const cx = p1[0] - u[1] * side * r, cz = p1[1] + u[0] * side * r;
      const a0 = Math.atan2(p1[1] - cz, p1[0] - cx);
      const steps = Math.max(2, Math.ceil((Math.abs(th) * r) / 2.5));
      return Array.from({ length: steps + 1 }, (_, k) => { const ang = a0 + (th * k) / steps; return [cx + Math.cos(ang) * r, cz + Math.sin(ang) * r]; });
    };
    // The widest radius the streets leave room for that keeps clear; if none does, the widest.
    const widest = Math.min(R_MIN, room / half);
    let r = null;
    for (let f = 1; f > 0.25 && r === null; f -= 0.1) if (keeps(arc(widest * f))) r = widest * f;
    if (r === null) {
      r = widest;
      close.push({ x: Math.round(b[0]), z: Math.round(b[1]) });
    }
    if (r < 9) tight.push({ x: Math.round(b[0]), z: Math.round(b[1]), r: Math.round(r) });
    out.push(...arc(r));
  }
  return { pts: out, tight, close };
}

// Every `step` metres round a closed loop.
function resample(pts, step) {
  const out = [];
  let carry = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = len2(sub(b, a));
    let d = carry;
    while (d < L) { out.push([a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L]); d += step; }
    carry = d - L;
  }
  return out;
}

// Junctions often jog a few metres from one street to the next: a stretch shorter than 14 m
// between two corners turning opposite ways is folded into one corner at its middle, where that
// keeps the line clear of the kerbs. (Corners turning the same way are a bend, a roundabout's: folded,
// the line would cut across it to the island.)
function fold(pts) {
  const out = pts.slice();
  const skip = new Set();
  const turnAt = (p, q, r) => { const u = sub(q, p), v = sub(r, q); return Math.sign(u[0] * v[1] - u[1] * v[0]); };
  for (let pass = 0; pass < 500 && out.length > 4; pass++) {
    let at = -1;
    for (let i = 0; i < out.length && at < 0; i++) {
      const a = out[i], b = out[(i + 1) % out.length], n = out.length;
      if (len2(sub(b, a)) >= 14 || skip.has(a)) continue;
      if (turnAt(out[(i - 1 + n) % n], a, b) === turnAt(a, b, out[(i + 2) % n])) continue;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (keeps([out[(i - 1 + out.length) % out.length], m, out[(i + 2) % out.length]])) at = i;
      else skip.add(a);
    }
    if (at < 0) break;
    const a = out[at], b = out[(at + 1) % out.length];
    out.splice(at, 1, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    out.splice(out.indexOf(b), 1);
  }
  return out;
}

// The line is the map's, thinned only of points within LINE_TOL of it: the carriageways are drawn
// round the map's own line.
const LINE_TOL = 0.25;
const raw = loop.map((n) => [n.x, n.z]);
const simple = fold(simplify(raw, LINE_TOL));
const rounded = fillet(simple);
let line = resample(rounded.pts, 2);
// A light blur joins the arcs to the straights without kinks.
{
  const xs = blur(line.map((p) => p[0]), 3), zs = blur(line.map((p) => p[1]), 3);
  line = line.map((_, i) => [xs[i], zs[i]]);
}
const n2 = line.length;
const steps = (a, b) => (b - a + n2) % n2; // points from a on to b, round the loop

// The jump, if the loop takes one: the ramp straight up to its lip, and the flight straight on from
// the lip to where it meets the landing street's middle. foot, lip and land are points of the line.
const jumpEdges = loopEdges.filter((e) => e.jump);
if (jumpEdges.length > 1) throw new Error('The loop takes more than one jump.');
let jump = null;
if (jumpEdges.length) {
  const c = jumpEdges[0].jump, rampH = JUMP.ramp * Math.cos(c.angle);
  const nearest = (x, z) => { let bi = 0, bd = Infinity; line.forEach(([px, pz], i) => { const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const lip = nearest(c.t.x, c.t.z), land = nearest(c.l.x, c.l.z), foot = (lip - Math.round(rampH / 2) + n2) % n2;
  if (Math.abs(steps(lip, land) * 2 - c.g) > 8) throw new Error(`The line doesn't follow jump ${c.n}'s flight: ${steps(lip, land) * 2} m for ${Math.round(c.g)}.`);
  const F = [c.t.x - c.fx * rampH, c.t.z - c.fz * rampH], T = [c.t.x, c.t.z], L = [c.l.x, c.l.z];
  const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  for (let k = 0; k <= steps(foot, lip); k++) line[(foot + k) % n2] = lerp(F, T, k / steps(foot, lip));
  for (let k = 1; k <= steps(lip, land); k++) line[(lip + k) % n2] = lerp(T, L, k / steps(lip, land));
  jump = { c, foot, lip, land };
}
// In the air: the stretches from the lip until the landing.
const inAir = (i) => !!jump && steps(jump.lip, i) < steps(jump.lip, jump.land);
// Near the jump: from its run-up to past its landing, where nothing else goes.
const nearJump = (i) => !!jump && steps((jump.foot - 30 + n2) % n2, i) <= 30 + steps(jump.foot, jump.land) + 15;

// What street each point is on, for its width and for the scenery.
const onStreet = line.map(([x, z]) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < loop.length; i++) { const d = segDist(x, z, loop[i], loop[(i + 1) % loop.length]); if (d < bd) { bd = d; best = i; } }
  return loopEdges[best];
});
// How far the carriageway reaches either side of each point, to the left and the right as the games
// take them; and the road's width: its street's, kerb to kerb, but never past the nearer kerb either
// side of the line (where it rounds a corner, or folds a jog), so its edges are the kerbs drawn or
// inside them. Narrowest over 16 m, then eased over a few metres.
const sides = line.map(([x, z], i) => {
  const [xa, za] = line[(i - 1 + n2) % n2], [xb, zb] = line[(i + 1) % n2], tl = Math.hypot(xb - xa, zb - za) || 1;
  const rx = -(zb - za) / tl, rz = (xb - xa) / tl;
  return onRoad(x, z) ? [reach(x, z, -rx, -rz), reach(x, z, rx, rz)] : [0, 0];
});
const widths = (() => {
  const own = onStreet.map((e, i) => (inAir(i) || !onRoad(...line[i]) ? carriageway(e.tags) : Math.min(carriageway(e.tags), 2 * Math.min(...sides[i]))));
  return blur(own.map((_, i) => Math.min(...[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => own[(i + k + n2) % n2]))), 2);
})();

// The tightest corners, by heading change over 6 m.
const heading = line.map((p, i) => { const q = line[(i + 1) % n2]; return Math.atan2(q[1] - p[1], q[0] - p[0]); });
const curvature = line.map((_, i) => { let d = heading[(i + 2) % n2] - heading[(i - 1 + n2) % n2]; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) / 6; });

// The heights: the street's own surface, from DGT's LiDAR (its terrain model is the bare ground,
// and a street is ground). At each point, a line across the carriageway through the heights there
// gives the height in the middle and how much the street tips sideways: the median of the slopes
// between every two of them, so a kerb, a wall or a drop beside the street (where the map's centre
// line is a metre or two off it) don't tip it. A bridge's deck isn't in the terrain, which has the
// ground under it: the road crosses each bridge straight, from one end to the other. Then both are
// smoothed just enough for karts.
const median = (v) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const cross = line.map(([x, z], i) => {
  const [xa, za] = line[(i - 1 + n2) % n2], [xb, zb] = line[(i + 1) % n2], tl = Math.hypot(xb - xa, zb - za) || 1;
  const rx = -(zb - za) / tl, rz = (xb - xa) / tl; // to the right, as the games take it
  const hw = Math.min(4, Math.max(1.5, carriageway(onStreet[i].tags) / 2 - 0.75));
  const pts = [];
  for (let l = -hw; l <= hw + 1e-6; l += 0.5) pts.push([l, ground.at(x + rx * l, z + rz * l)]);
  const slopes = [];
  for (let a = 0; a < pts.length; a++) for (let b = a + 2; b < pts.length; b++) slopes.push((pts[b][1] - pts[a][1]) / (pts[b][0] - pts[a][0]));
  const slope = median(slopes);
  return { y: median(pts.map(([l, h]) => h - slope * l)), slope };
});
const onBridge = onStreet.map((e) => !!e.tags?.bridge && e.tags.bridge !== 'no');
{
  const runsOf = (f) => { const out = []; for (let i = 0; i < n2; i++) if (f(i) && !f((i - 1 + n2) % n2)) { let j = i; while (f((j + 1) % n2) && j - i < n2) j++; out.push([i, j]); } return out; };
  for (const [a, b] of runsOf((i) => onBridge[i])) {
    const p = a - 3, q = b + 3, A = cross[(p + n2) % n2], B = cross[q % n2];
    for (let i = p + 1; i < q; i++) { const f = (i - p) / (q - p); cross[(i + n2) % n2] = { y: A.y + (B.y - A.y) * f, slope: A.slope + (B.slope - A.slope) * f }; }
  }
}
// Under the jump the road's height runs straight from the ramp's foot to the landing, so the ground
// in the gap doesn't pull the smoothing either side; the ramp and the flight are set after.
if (jump) {
  const { foot, land } = jump, A = cross[foot], B = cross[land], n = steps(foot, land);
  for (let k = 1; k < n; k++) cross[(foot + k) % n2] = { y: A.y + ((B.y - A.y) * k) / n, slope: 0 };
}
// Smoothed over about 10 m (a Gaussian blur's spread), and the layout's points are 8 m apart; real
// streets tip sideways by up to a few percent, more on a hill's flank; a kart's road no more than 8%.
const SMOOTH = 5;
const ys = blur(blur(cross.map((c) => c.y), SMOOTH), SMOOTH).map((h) => h - ELEV0);
const banks = blur(blur(cross.map((c) => Math.atan(c.slope)), SMOOTH), SMOOTH).map((b) => Math.max(-0.08, Math.min(0.08, b)));
// The ramp rises straight from the street at its foot to its lip, and the flight's road (which the
// games don't draw) runs straight from the lip to the landing; neither tips sideways.
if (jump) {
  const { c, foot, lip, land } = jump, rise = JUMP.ramp * Math.sin(c.angle);
  for (let k = 0; k <= steps(foot, lip); k++) ys[(foot + k) % n2] = ys[foot] + (rise * k) / steps(foot, lip);
  for (let k = 1; k < steps(lip, land); k++) ys[(lip + k) % n2] = ys[lip] + ((ys[land] - ys[lip]) * k) / steps(lip, land);
  for (let k = 0; k <= steps(foot, land); k++) banks[(foot + k) % n2] = 0;
  // The slowest flight that comes down past the landing, from the heights as they are now.
  const g = steps(lip, land) * 2;
  for (let v = 10; v <= 60 && !jump.v; v += 0.5) if (ys[lip] + arc(c.angle, v, g + JUMP.past) >= ys[land]) jump.v = v;
  console.log(`\njump ${c.n}: the ramp from (${line[foot].map(Math.round)}) to its lip at (${line[lip].map(Math.round)}), ${((c.angle * 180) / Math.PI).toFixed(1)}° and ${rise.toFixed(1)} m high; ${g} m to the landing at (${line[land].map(Math.round)}), ${(ys[lip] - ys[land]).toFixed(1)} m below the lip; cleared from ${jump.v} m/s`);
}
const smooth = ys.map((y) => y + ELEV0);

// Does any part of the road come close to another part far along it?
const clashes = [];
for (let i = 0; i < n2; i += 2) for (let j = i + 60; j < n2; j += 2) {
  if (n2 - (j - i) < 60) continue;
  const d = Math.hypot(line[i][0] - line[j][0], line[i][1] - line[j][1]);
  if (d < (widths[i] + widths[j]) / 2 + 4) clashes.push({ i, j, d: Math.round(d), at: line[i].map(Math.round) });
}

let maxGrade = 0, minCrest = Infinity;
for (let i = 0; i < n2; i++) {
  if (nearJump(i)) continue;
  const a = ys[(i - 5 + n2) % n2], b = ys[i], c = ys[(i + 5) % n2];
  maxGrade = Math.max(maxGrade, Math.abs(c - a) / 20);
  const k = (a - 2 * b + c) / 100; // second derivative over 10 m
  if (k < 0) minCrest = Math.min(minCrest, -1 / k);
}
const length = n2 * 2;
console.log(`\ncentre line ${length} m; corners tighter than 9 m: ${rounded.tight.length} ${JSON.stringify(rounded.tight)}`);
// Where the line is on the streets: every point on a carriageway (but in a ramp's flight), and how
// close it comes to a kerb.
{
  const ground = line.map((_, i) => i).filter((i) => !inAir(i));
  const off = ground.filter((i) => !onRoad(...line[i]));
  const near = ground.filter((i) => onRoad(...line[i]) && Math.min(...sides[i]) < CLEAR);
  const at = (list) => list.reduce((r, i) => (r.length && i - r.at(-1).at(-1) <= 3 ? r.at(-1).push(i) : r.push([i]), r), []).map((r) => `${r.length * 2} m at (${line[r[0]].map(Math.round)})`);
  console.log(`on the streets: ${ground.length - off.length} of ${ground.length} points on a carriageway${off.length ? `; off it: ${at(off).join(', ')}` : ''}; within ${CLEAR} m of a kerb: ${at(near).join(', ') || 'none'}; corners that can't keep clear: ${JSON.stringify(rounded.close)}`);
}
{
  const s = [...widths].sort((a, b) => a - b), q = (f) => s[Math.floor(f * (n2 - 1))].toFixed(1);
  // The narrowest places, one each 100 m.
  const narrow = [];
  for (const i of widths.map((_, i) => i).sort((a, b) => widths[a] - widths[b])) {
    if (narrow.length >= 8) break;
    if (inAir(i) || narrow.some((j) => Math.abs(steps(j, i) * 2) < 100 || Math.abs(steps(i, j) * 2) < 100)) continue;
    narrow.push(i);
  }
  console.log(`widths ${q(0)}–${q(1)} m, median ${q(0.5)}; ${Math.round((100 * widths.filter((w) => w < 6).length) / n2)}% under 6 m, ${Math.round((100 * widths.filter((w) => w < 9).length) / n2)}% under 9 m; the narrowest: ${narrow.map((i) => `${widths[i].toFixed(1)} m on ${onStreet[i].name || onStreet[i].kind} (${line[i].map(Math.round)})`).join(', ')}`);
}
console.log(`tightest radius ${(1 / Math.max(...curvature)).toFixed(1)} m; height ${Math.min(...smooth).toFixed(0)}–${Math.max(...smooth).toFixed(0)} m (zero at ${ELEV0}); steepest ${(maxGrade * 100).toFixed(1)}%; sharpest crest radius ${minCrest.toFixed(0)} m`);
console.log(`tipping sideways: ${Math.round((100 * banks.filter((b) => Math.abs(b) > 0.02).length) / n2)}% over 2%, ${Math.round((100 * banks.filter((b) => Math.abs(b) >= 0.08).length) / n2)}% at 8%; bridges: ${onBridge.filter(Boolean).length * 2} m`);
console.log(`clashes: ${clashes.length} ${JSON.stringify(clashes.slice(0, 8))}`);

// What's beyond each kerb, at every point: a pavement (its width, positive), a central reservation
// with the other carriageway beyond it (its width, negative), or nothing (0, a verge).
const fps = footprints(readCache('osm/buildings.json'));
const kerbs = (() => {
  // The buildings' walls, a point every 2 m, for how much room there is for a pavement.
  const vgrid = new Map();
  for (const e of fps) {
    const pts = e.geometry.map(P);
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
      for (let f = 0; f < n; f++) { const x = ax + ((bx - ax) * f) / n, z = az + ((bz - az) * f) / n, k = Math.floor(x / 20) + ',' + Math.floor(z / 20); if (!vgrid.has(k)) vgrid.set(k, []); vgrid.get(k).push([x, z]); }
    }
  }
  // The other carriageways the loop might run beside: one-way main roads it doesn't use.
  const loopWays = new Set(loopEdges.map((e) => e.way));
  const sgrid = new Map();
  for (const e of base.elements) {
    const t = e.tags || {};
    if (e.type !== 'way' || loopWays.has(e.id) || !isOneway(t) || t.junction === 'roundabout') continue;
    if (!/^(motorway|trunk|primary|secondary|tertiary)(_link)?$/.test(t.highway || '')) continue;
    const pts = e.geometry.map(P), w = carriageway(t);
    for (let i = 1; i < pts.length; i++) {
      const seg = [pts[i - 1], pts[i], w];
      for (let f = 0; f <= 1; f += 0.25) { const k = Math.floor((pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f) / 30) + ',' + Math.floor((pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f) / 30); if (!sgrid.has(k)) sgrid.set(k, new Set()); sgrid.get(k).add(seg); }
    }
  }
  // A side's sidewalk tag, for the way as the loop drives it (its left is the way's right when the
  // loop goes against the way): true, false, or null when the map doesn't say.
  const sidewalk = (e, right) => {
    const t = e.tags || {}, side = right === e.fwd ? 'right' : 'left', other = side === 'right' ? 'left' : 'right';
    const v = t[`sidewalk:${side}`] ?? t['sidewalk:both'] ?? t.sidewalk;
    if (v == null) return null;
    if (['no', 'none', other].includes(v)) return false;
    return true;
  };
  const out = [[], []]; // left, right
  for (let i = 0; i < n2; i++) {
    const [x, z] = line[i], [x2, z2] = line[(i + 1) % n2], tl = Math.hypot(x2 - x, z2 - z) || 1, tx = (x2 - x) / tl, tz = (z2 - z) / tl;
    const w = widths[i], cx = Math.floor(x / 30), cz = Math.floor(z / 30);
    [-1, 1].forEach((side, k) => {
      const rx = -tz * side, rz = tx * side;
      // A twin carriageway alongside, beyond a reservation.
      let twin = Infinity;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [p, q, tw] of sgrid.get(cx + a + ',' + (cz + b)) || []) {
        const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
        if (Math.abs((dx * tx + dz * tz) / L) < 0.94) continue;
        const f = ((x - p[0]) * dx + (z - p[1]) * dz) / (L * L);
        if (f < -0.05 || f > 1.05) continue;
        const o = (p[0] + dx * f - x) * rx + (p[1] + dz * f - z) * rz;
        if (o > w / 2 + 1 && o < w / 2 + tw / 2 + 14) twin = Math.min(twin, o - w / 2 - tw / 2);
      }
      if (twin < Infinity) { out[k].push(-Math.max(0.4, twin)); return; }
      // Otherwise a pavement, as wide as the buildings leave room for.
      let room = Infinity;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [vx, vz] of vgrid.get(Math.floor(x / 20) + a + ',' + (Math.floor(z / 20) + b)) || []) {
        const along = (vx - x) * tx + (vz - z) * tz, o = (vx - x) * rx + (vz - z) * rz;
        if (Math.abs(along) < 8 && o > w / 2 - 1) room = Math.min(room, o - w / 2);
      }
      const tag = sidewalk(onStreet[i], side > 0);
      const built = room < 25;
      if (tag === false || (tag === null && !built)) out[k].push(0);
      else out[k].push(Math.max(1.2, Math.min(3.2, room - 0.3)));
    });
  }
  // Where a side street joins, the pavement (or the reservation) stops for it.
  let gaps = 0;
  for (let li = 0; li < loop.length; li++) {
    const n = loop[li], prev = loop[(li - 1 + loop.length) % loop.length].id, next = loop[(li + 1) % loop.length].id;
    for (const e of n.adj) {
      if (e.to === prev || e.to === next) continue;
      const o = nodes.get(e.to);
      let bi = 0, bd = Infinity;
      for (let i = 0; i < n2; i++) { const d = Math.hypot(line[i][0] - n.x, line[i][1] - n.z); if (d < bd) { bd = d; bi = i; } }
      if (bd > 12) continue;
      const [x, z] = line[bi], [x2, z2] = line[(bi + 1) % n2], tl = Math.hypot(x2 - x, z2 - z) || 1, tx = (x2 - x) / tl, tz = (z2 - z) / tl;
      const dx = o.x - n.x, dz = o.z - n.z, dl = Math.hypot(dx, dz) || 1;
      if (Math.abs((dx * tx + dz * tz) / dl) > 0.9) continue; // running alongside, not off it
      const k = (-tz * dx + tx * dz) / dl > 0 ? 1 : 0;
      const reach = Math.ceil((carriageway(e.tags) / 2 + 3) / 2);
      for (let j = -reach; j <= reach; j++) out[k][(bi + j + n2) % n2] = 0;
      gaps++;
    }
  }
  // Tidy: a reservation shorter than 30 m is a traffic island, kept as pavement; widths change
  // smoothly.
  for (const side of out) {
    for (let i = 0; i < n2; ) {
      if (side[i] >= 0) { i++; continue; }
      let j = i;
      while (j < n2 && side[j] < 0) j++;
      if (j - i < 15) for (let k = i; k < j; k++) side[k] = 2;
      i = j;
    }
    const sm = blur(side.map((v) => Math.abs(v)), 3);
    side.forEach((v, i) => (side[i] = v === 0 ? 0 : Math.sign(v) * sm[i]));
  }
  const share = (f) => Math.round((100 * out.flat().filter(f).length) / (2 * n2));
  // None in the air.
  for (let i = 0; i < n2; i++) if (inAir(i)) out[0][i] = out[1][i] = 0;
  console.log(`kerbs: ${share((v) => v > 0)}% pavement, ${share((v) => v < 0)}% reservation, ${share((v) => v === 0)}% open; ${gaps} side streets`);
  return out;
})();

// ---------------------------------------------------------------------------------------------
// 3. Where things go on it: the start, checkpoints, item boxes, boost pads, and the easter eggs.

const maxCurve = (i, back, ahead) => { let m = 0; for (let k = -back; k <= ahead; k++) m = Math.max(m, curvature[(i + k + n2) % n2]); return m; };
const main = (e) => ['primary', 'secondary', 'tertiary'].includes(e.kind);

// The start: the straightest stretch of a main road, 120 m before the line and 80 m after, on the
// track's own street (`start`) while the loop still goes along it.
const START_ON = cfg.start;
const startStreet = onStreet.some((e) => e.name === START_ON);
let start = 0, startScore = Infinity;
for (let i = 0; i < n2; i++) {
  // Not by anyone's house: the start is where everyone looks.
  if (places.some((p) => Math.hypot(line[i][0] - p.x, line[i][1] - p.z) < 250) || nearJump(i)) continue;
  if (startStreet && onStreet[i].name !== START_ON) continue;
  const sc = maxCurve(i, 60, 40) + (main(onStreet[i]) ? 0 : 0.01);
  if (sc < startScore) { startScore = sc; start = i; }
}
// Everything from here counts from the start line.
const at = (k) => (start + k) % n2; // k samples (2 m each) after the start
// The straightest place within reach of k, away from the jump.
const straightest = (k, reach) => { let best = k, bs = Infinity; for (let d = -reach; d <= reach; d++) { if (nearJump(at(k + d))) continue; const sc = maxCurve(at(k + d), 10, 10); if (sc < bs) { bs = sc; best = k + d; } } return best; };

const checkpoints = [1, 2, 3, 4, 5].map((f) => straightest(Math.round((f * n2) / 6), 20));
const busy = (k) => [0, ...checkpoints].some((c) => Math.abs(((k - c + n2 / 2 + n2) % n2) - n2 / 2) < 30);
const items = [];
for (let k = 150; k < n2 - 100; k += 410) { let b = straightest(k, 40); if (busy(b)) b += 40; items.push(b); }
// Boost pads 30 m into the longest straights.
const straights = [];
for (let k = 0, run = 0; k < n2; k++) {
  if (curvature[at(k)] < 0.006 && !nearJump(at(k))) run++;
  else { if (run > 60) straights.push({ from: k - run, len: run }); run = 0; }
}
const boosts = straights.sort((a, b) => b.len - a.len).slice(0, 6).map((s) => s.from + 15).filter((k) => !busy(k) && !items.some((it) => Math.abs(it - k) < 25));

// The easter eggs stand on the houses themselves (decision 014): each at its waypoint's own dot,
// on the side of the road the dot is on (1 is the right, going round, and -1 the left).
const eggs = places.filter((p) => p.egg).map((p) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < n2; i++) { const d = Math.hypot(line[i][0] - p.x, line[i][1] - p.z); if (d < bd) { bd = d; best = i; } }
  const [ax, az] = line[(best - 1 + n2) % n2], [bx, bz] = line[(best + 1) % n2];
  const side = (bx - ax) * (p.z - line[best][1]) - (bz - az) * (p.x - line[best][0]) >= 0 ? 1 : -1;
  return { kind: p.egg, x: Math.round(p.x), z: Math.round(p.z), side };
});
// The streets a note on the map asked to have houses all down both sides: the waypoints marked
// `rows` in places.json.
const rowStreets = new Set(places.filter((p) => p.rows).map((p) => p.street));
const rows = [];
{
  let from = -1;
  for (let k = 0; k <= n2; k++) {
    const on = k < n2 && rowStreets.has(onStreet[at(k)].name);
    if (on && from < 0) from = k;
    if (!on && from >= 0) { rows.push([line[at(from)].map(Math.round), line[at(k - 1)].map(Math.round)]); from = -1; }
  }
}

console.log(`start on ${onStreet[start].name} at ${line[start].map(Math.round)}; checkpoints every ${Math.round(length / 6)} m; ${items.length} item rows; ${boosts.length} boost pads; eggs ${eggs.map((e) => e.kind).join(', ')}`);

// ---------------------------------------------------------------------------------------------
// 4. The layout for the game: a point every 8 m (every tagged sample too), from the start line;
//    every 2 m round the ramp and the landing, so their shape holds.

const tagAt = new Map([[0, 'start'], ...checkpoints.map((k) => [k, 'cp']), ...items.map((k) => [k, 'items']), ...boosts.map((k) => [k, 'boost'])]);
const r1 = (v) => Math.round(v * 10) / 10;
// Heights to the centimetre: decimetres would put bumps of their own in a road made smooth.
const r2 = (v) => Math.round(v * 100) / 100;
const pointsOut = [];
let lastW = null, lastSurface = null, lastLanes = null, lastKerbs = null, lastBank = null, lastBridge = false, lastAir = false;
const dense = (i) => !!jump && (steps((jump.foot - 2 + n2) % n2, i) <= steps(jump.foot, jump.lip) + 4 || steps((jump.land - 2 + n2) % n2, i) <= 4);
const half5 = (v) => Math.round(v * 2) / 2;
for (let k = 0; k < n2; k++) {
  if (k % 4 !== 0 && !tagAt.has(k) && !dense(at(k))) continue;
  const i = at(k), w = Math.round(widths[i] * 2) / 2, t = onStreet[i].tags || {};
  const o = { p: [r1(line[i][0]), r2(ys[i]), r1(line[i][1])] };
  if (w !== lastW) { o.w = w; lastW = w; }
  const bank = r2(banks[i]);
  if (bank !== lastBank) { o.bank = bank; lastBank = bank; }
  if (k === 0) o.walls = true;
  const surface = COBBLE.has(t.surface) ? 'cobble' : 'asphalt';
  if (surface !== lastSurface) { o.surface = surface; lastSurface = surface; }
  const lanes = lanesOf(t) * (isOneway(t) ? -1 : 1);
  if (lanes !== lastLanes) { o.lanes = lanes; lastLanes = lanes; }
  const kb = [half5(kerbs[0][i]), half5(kerbs[1][i])];
  if (kb.join() !== lastKerbs) { o.kerbs = kb; lastKerbs = kb.join(); }
  if (onBridge[i] !== lastBridge) { o.bridge = onBridge[i]; lastBridge = onBridge[i]; }
  if (inAir(i) !== lastAir) { o.air = inAir(i); lastAir = o.air; }
  if (tagAt.has(k)) o.tag = tagAt.get(k);
  pointsOut.push(o);
}

// ---------------------------------------------------------------------------------------------
// 5. What's along it: the street names, the landmarks it passes, and from the map the zebra
//    crossings and traffic lights on its streets and the bus stops beside it.

// A grid of the centre line, for "how far is this from the road".
const lineGrid = new Map();
line.forEach(([x, z], i) => { const k = Math.floor(x / 40) + ',' + Math.floor(z / 40); if (!lineGrid.has(k)) lineGrid.set(k, []); lineGrid.get(k).push(i); });
function roadDist(x, z, reach = 1) {
  let bd = Infinity, bi = -1;
  const cx = Math.floor(x / 40), cz = Math.floor(z / 40);
  for (let a = -reach; a <= reach; a++) for (let b = -reach; b <= reach; b++) for (const i of lineGrid.get(cx + a + ',' + (cz + b)) || []) { const d = Math.hypot(line[i][0] - x, line[i][1] - z); if (d < bd) { bd = d; bi = i; } }
  return { d: bd, i: bi };
}

// -- Names: each street as the track turns into it, and the landmarks it passes.
const streets = [];
{
  let last = null;
  for (let k = 0; k < n2; k++) {
    const name = onStreet[at(k)].name;
    if (name && name !== last && !streets.some((s) => s.name === name)) {
      const [x, z] = line[at(k + 8)];
      streets.push({ name, x: Math.round(x), z: Math.round(z) });
    }
    if (name) last = name;
  }
}
const braga = JSON.parse(fs.readFileSync(path.join(ROOT, 'map/braga.json'), 'utf8'));
const landmarks = braga.landmarks.filter((l) => roadDist(l.x, l.z, 8).d < 220).map((l) => ({ name: l.name, x: l.x, z: l.z }));

// -- Along the road, from the map: zebra crossings and traffic lights on the loop's own streets,
//    and the bus stops beside it.
const crossings = [], signals = [], stops = [];
{
  const streetOsm = readCache('osm/street.json');
  const loopNodes = new Set(loop.map((n) => n.id));
  const near = (list, x, z, r) => list.some((q) => Math.hypot(q[0] - x, q[1] - z) < r);
  for (const e of streetOsm.elements) {
    const t = e.tags || {}, [x, z] = P(e).map(Math.round);
    if (loopNodes.has(e.id)) {
      const marked = (t.highway === 'crossing' || t.crossing) && !['unmarked', 'no', 'informal'].includes(t.crossing) && t['crossing:markings'] !== 'no';
      if (marked && !near(crossings, x, z, 8)) crossings.push([x, z]);
      if ((t.highway === 'traffic_signals' || t.crossing === 'traffic_signals') && !near(signals, x, z, 12)) signals.push([x, z]);
    } else if (t.highway === 'bus_stop') {
      const r = roadDist(x, z, 1);
      if (r.d < widths[r.i] / 2 + 9 && !stops.some((q) => Math.hypot(q.x - x, q.z - z) < 30)) stops.push({ x, z, shelter: t.shelter === 'yes' ? 1 : 0 });
    }
  }
  console.log(`along the road: ${crossings.length} crossings, ${signals.length} traffic lights, ${stops.length} bus stops`);
}

// -- The side streets it passes, closed for a race (decision 019): rows of barriers along the race's
//    road's edge wherever the carriageway drawn goes on past it (looked at half a metre beyond it):
//    across each side street's mouth, on the line of the route's kerb, and along a road's other
//    carriageway where the two are drawn as one. Each a row of barriers along its points, [x, y, z],
//    y the road's height there.
const closures = [];
{
  const yAt = (x, z) => r2(ys[roadDist(x, z, 1).i]);
  for (const rings of road) for (const ring of rings) {
    // Every half metre round the ring, whether the carriageway goes on past it.
    const marks = [];
    ring.forEach(([ax, az], k) => {
      const [bx, bz] = ring[(k + 1) % ring.length], L = Math.hypot(bx - ax, bz - az);
      if (L < 1e-6) return;
      let nx = -(bz - az) / L, nz = (bx - ax) / L;
      for (let m = Math.ceil(L / 0.5), f = 0; f < m; f++) {
        const x = ax + ((bx - ax) * f) / m, z = az + ((bz - az) * f) / m, mx = ax + ((bx - ax) * (f + 0.5)) / m, mz = az + ((bz - az) * (f + 0.5)) / m;
        if (raceRoad.has(mx + nx * 0.2, mz + nz * 0.2)) [nx, nz] = [-nx, -nz];
        marks.push({ p: [x, z], open: drawnRoad(mx + nx * 0.5, mz + nz * 0.5) });
      }
    });
    // Each run of them, from the mark before it to the one after (on the kerb), but those under a
    // metre: a crack in the drawing.
    const n = marks.length;
    let k0 = marks.findIndex((q) => !q.open);
    if (k0 < 0) continue;
    for (let k = 1; k <= n; k++) {
      const i = (k0 + k) % n;
      if (!marks[i].open || marks[(i - 1 + n) % n].open) continue;
      let j = i;
      while (marks[(j + 1) % n].open) j = (j + 1) % n;
      const pts = [];
      for (let q = i; ; q = (q + 1) % n) { pts.push(marks[q].p); if (q === (j + 1) % n) break; }
      pts.push(marks[(j + 1) % n].p);
      const len = pts.reduce((s, p, q) => (q ? s + Math.hypot(p[0] - pts[q - 1][0], p[1] - pts[q - 1][1]) : 0), 0);
      if (len >= 1) closures.push(openThin(pts, 0.15).map(([x, z]) => [r1(x), yAt(x, z), r1(z)]));
    }
  }
  const lens = closures.map((c) => c.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - c[k - 1][0], p[2] - c[k - 1][2]) : 0), 0));
  const order = lens.map((_, k) => k).sort((a, b) => lens[b] - lens[a]);
  console.log(`closures: ${closures.length} rows of barriers, ${Math.round(lens.reduce((a, b) => a + b, 0))} m in all, median ${lens[order[order.length >> 1]].toFixed(0)} m; the longest ${order.slice(0, 6).map((k) => `${Math.round(lens[k])} m at (${closures[k][0][0].toFixed(0)}, ${closures[k][0][2].toFixed(0)})`).join(', ')}`);
  console.log(`the race's road: ${road.length} pieces, ${road.reduce((s, r) => s + r.length - 1, 0)} holes, ${road.flat().reduce((s, r) => s + r.length, 0)} points round them`);
}

// The box the games draw round it: the track and 500 m round it, inside the map. And the sections
// it runs through, from the start.
let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
for (const [x, z] of line) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); }
const BOX = { x0: Math.max(EXT.x0, Math.floor((bx0 - 500) / 10) * 10), x1: Math.min(EXT.x1, Math.ceil((bx1 + 500) / 10) * 10), z0: Math.max(EXT.z0, Math.floor((bz0 - 500) / 10) * 10), z1: Math.min(EXT.z1, Math.ceil((bz1 + 500) / 10) * 10) };
const sections = [...new Set(line.map((_, k) => sectionOf(...line[at(k)])))];
console.log(`sections ${sections.join(', ')}; ${streets.length} street names; landmarks: ${landmarks.map((l) => l.name).join(', ')}`);

// The ramp, for the games to put up during a race: its foot and lip on the street, and where the
// flight meets the landing street's middle; the slowest a kart may take it at and still land there.
const xyz = (i) => [r1(line[i][0]), r2(ys[i]), r1(line[i][1])];
const ramps = jump ? [{ foot: xyz(jump.foot), lip: xyz(jump.lip), land: xyz(jump.land), w: Math.round(widths[jump.lip] * 2) / 2, angle: r2(jump.c.angle), v: jump.v, at: steps(start, jump.lip) * 2 }] : [];

// ---------------------------------------------------------------------------------------------
// 6. The output: the track for the games, and for the map page.

// Text as comment lines no longer than 100 characters.
const wrap = (text) => {
  const lines = [];
  let cur = '//';
  for (const w of text.split(' ')) {
    if (cur.length + 1 + w.length > 100 && cur !== '//') { lines.push(cur); cur = '//'; }
    cur += ' ' + w;
  }
  return [...lines, cur].join('\n');
};
const fmtPoint = (o) => '    { ' + Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : typeof v === 'string' ? `'${v}'` : v}`).join(', ') + ' },';
const J = (v) => JSON.stringify(v);
fs.mkdirSync(path.join(ROOT, 'tracks'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tracks', `${cfg.id}.js`), `${wrap(`${cfg.name}: ${cfg.about} Made by tools/track.mjs from OpenStreetMap and the relief: run that again rather than editing it. ${length} m round, heights in metres above ${ELEV0} m. © OpenStreetMap contributors (ODbL).`)}
export default {
  id: '${cfg.id}',
  name: ${J(cfg.name)},
  length: ${length},
  elev0: ${ELEV0},
  sections: ${J(sections)},
  box: ${J(BOX)},
  eggs: ${J(eggs)},
  streets: ${J(streets)},
  landmarks: ${J(landmarks)},
  crossings: ${J(crossings)},
  signals: ${J(signals)},
  stops: ${J(stops)},
  ramps: ${J(ramps)},
  road: ${J(road)},
  closures: ${J(closures)},
  points: [
${pointsOut.map(fmtPoint).join('\n')}
  ],
};
`);

// For the map page: the line every 6 m, and where things are.
const pick = (k) => line[at(k)].map(Math.round);
const pageFile = path.join(ROOT, 'map/tracks.json');
const page = fs.existsSync(pageFile) ? JSON.parse(fs.readFileSync(pageFile, 'utf8')) : {};
page[cfg.id] = {
  name: cfg.name, length, w: Math.round(widths.reduce((a, b) => a + b, 0) / n2), elev0: ELEV0, sections,
  line: line.filter((_, i) => i % 3 === 0).map((p) => p.map(Math.round)),
  start: pick(0), checkpoints: checkpoints.map(pick), items: items.map(pick), boosts: boosts.map(pick),
  eggs, rows, jumps: ramps.map((r) => ({ foot: [r.foot[0], r.foot[2]], lip: [r.lip[0], r.lip[2]], land: [r.land[0], r.land[2]] })),
};
fs.writeFileSync(pageFile, JSON.stringify(page));
console.log(`wrote tracks/${cfg.id}.js (${pointsOut.length} points) and map/tracks.json`);
