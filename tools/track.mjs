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
import { blur, carriageway, COBBLE, driven, footprints, isOneway, lanesOf, segDist, simplify, W_MIN } from './osm.mjs';
import { EXT, sectionOf } from './sections.mjs';
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
const COST = { primary: 1, secondary: 1, tertiary: 1.05, primary_link: 1.3, secondary_link: 1.3, tertiary_link: 1.3, unclassified: Math.min(1.3, RES), residential: RES, living_street: 2 };

// The rules of the road. A car may use a street unless the most specific of its access tags says
// no, and drives it only the way it may (`driven` in osm.mjs: one-way streets, roundabouts).
const NO_CARS = new Set(['no', 'private', 'permit', 'forestry', 'agricultural']);
const carsMay = (t) => !NO_CARS.has(t.motorcar ?? t.motor_vehicle ?? t.vehicle ?? t.access);

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

// A waypoint's street that's a dead end is joined from its end to the nearest other street, so
// the loop can drive through it (a note on the map asked for that).
const joins = [];
for (const p of places) {
  const s = snap(p.x, p.z);
  // Every node of that street within 400 m, and any dead end among them.
  const street = new Set([s.node.id]);
  const todo = [s.node];
  while (todo.length) {
    const n = todo.pop();
    for (const e of n.adj) {
      const m = nodes.get(e.to);
      if (e.name === s.name && !street.has(m.id) && Math.hypot(m.x - s.node.x, m.z - s.node.z) < 400) { street.add(m.id); todo.push(m); }
    }
  }
  for (const id of street) {
    const end = nodes.get(id);
    if (end.adj.length !== 1) continue;
    // Carry on the way the street was going, to a street that leads somewhere (not another dead
    // end), the nearest such, with going straight on worth more than going close.
    const from = nodes.get(end.adj[0].to);
    const hx = end.x - from.x, hz = end.z - from.z, hl = Math.hypot(hx, hz);
    // Not to a street that's already a short drive away: joining it would only make a hairpin.
    const close = new Map([...street].map((s) => [s, 0]));
    const todo = [...street];
    while (todo.length) {
      const n = nodes.get(todo.shift()), dn = close.get(n.id);
      for (const e of n.adj) if (dn + e.len < 300 && dn + e.len < (close.get(e.to) ?? Infinity)) { close.set(e.to, dn + e.len); todo.push(e.to); }
    }
    let to = null, d = Infinity, score = Infinity;
    for (const n of nodes.values()) {
      if (close.has(n.id) || n.adj.length < 2) continue;
      const dx = n.x - end.x, dz = n.z - end.z, dd = Math.hypot(dx, dz);
      if (dd > 200 || dd < 5) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * hx + dz * hz) / (dd * hl))));
      if (ang > 1.1) continue;
      const sc = dd * (1 + 1.5 * ang);
      if (sc < score) { score = sc; to = n; d = dd; }
    }
    if (!to) continue;
    const edge = { kind: 'residential', name: '(joined)', len: d, tags: { highway: 'residential' } };
    end.adj.push({ to: to.id, ...edge, legal: true });
    to.adj.push({ to: end.id, ...edge, legal: true });
    joins.push({ from: [Math.round(end.x), Math.round(end.z)], to: [Math.round(to.x), Math.round(to.z)], len: Math.round(d), street: s.name });
  }
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
      if (e.to === p || !e.legal) continue; // no turning back, nor against the traffic
      let cost = e.len * COST[e.kind] + extra(n, e.to);
      if (p != null && p !== '') {
        const th = turn(nodes.get(p), N, nodes.get(e.to));
        if (th > 2.4) continue; // a hairpin a kart can't make in a street
        if (banned(p, n, e.to)) continue;
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
  let along = n.adj.filter((e) => e.name === p.street || e.name === '(joined)').map((e) => e.to);
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
  const extra = (a, b) => {
    const e = [a, b].sort().join('-');
    if (used.has(e)) return 5000;
    const A = nodes.get(a), B = nodes.get(b), mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2;
    // Close to a waypoint the loop comes and goes; elsewhere it keeps 28 m from itself.
    if (ids.some((id) => Math.hypot(nodes.get(id).x - mx, nodes.get(id).z - mz) < 70)) return 0;
    const close = (near.get(cellOf(mx, mz)) || []).some((n) => Math.hypot(n.x - mx, n.z - mz) < 28);
    return close ? 400 : 0;
  };
  const use = (a, b) => { used.add([a, b].sort().join('-')); mark(a); mark(b); };
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
let bestLoop = null;
for (const o of orders) {
  for (let f = 0; f < 1 << o.length; f++) {
    const flips = o.map((_, k) => !!(f & (1 << k)));
    const r = loopThrough(o, flips);
    if (!r) continue;
    if (!bestLoop || r.cost < bestLoop.cost) bestLoop = { ...r, order: o, flips };
  }
  console.log('order', o.map((p) => p.id).join(' > '), 'best so far', Math.round(bestLoop?.cost ?? NaN));
}
if (!bestLoop) throw new Error('No loop through the waypoints.');
const loop = bestLoop.path.map((id) => nodes.get(id));

// What the loop is made of, street by street.
{
  let L = 0, lastName = null, run = 0;
  const parts = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    const e = edgeOf(a.id, b.id);
    const name = e ? e.name || '(' + e.kind + ')' : '?';
    if (name !== lastName && lastName !== null) { parts.push(`${lastName} ${Math.round(run)}`); run = 0; }
    lastName = name;
    run += Math.hypot(b.x - a.x, b.z - a.z);
    L += Math.hypot(b.x - a.x, b.z - a.z);
  }
  parts.push(`${lastName} ${Math.round(run)}`);
  console.log('\nloop', bestLoop.order.map((p) => p.id).join(' > '), Math.round(L), 'm,', loop.length, 'nodes');
  console.log(parts.join(' | '));
  console.log('joins', JSON.stringify(joins));
}

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
// The race is never narrower than W_MIN, so eight karts still fit.
const R_MIN = 12; // the corner radius aimed for: a street corner, about 80 km/h for a kart

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len2 = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len2(a) || 1; return [a[0] / l, a[1] / l]; };

// Each corner becomes an arc of radius R_MIN, or tighter where the streets either side are too
// short for it. Returns the points every few metres, and the corners that had to be tighter.
function fillet(pts) {
  const n = pts.length, out = [], tight = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const u = unit(sub(b, a)), v = unit(sub(c, b));
    const th = Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
    if (Math.abs(th) < 0.05) { out.push(b); continue; }
    const half = Math.tan(Math.abs(th) / 2);
    let r = R_MIN, t = r * half;
    const room = Math.min(len2(sub(b, a)), len2(sub(c, b))) / 2;
    if (t > room) { t = room; r = t / half; }
    if (r < 9) tight.push({ x: Math.round(b[0]), z: Math.round(b[1]), r: Math.round(r) });
    const p1 = [b[0] - u[0] * t, b[1] - u[1] * t];
    const side = Math.sign(th);
    const cx = p1[0] - u[1] * side * r, cz = p1[1] + u[0] * side * r;
    const a0 = Math.atan2(p1[1] - cz, p1[0] - cx);
    const steps = Math.max(2, Math.ceil((Math.abs(th) * r) / 2.5));
    for (let k = 0; k <= steps; k++) { const ang = a0 + (th * k) / steps; out.push([cx + Math.cos(ang) * r, cz + Math.sin(ang) * r]); }
  }
  return { pts: out, tight };
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
// between two corners is folded into one corner at its middle.
function fold(pts) {
  let out = pts.slice();
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i], b = out[(i + 1) % out.length];
      if (len2(sub(b, a)) < 14 && out.length > 4 && !changed) {
        next.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
        if (i === out.length - 1) next.shift();
        else i++;
        changed = true;
      } else next.push(a);
    }
    out = next;
    if (!changed) break;
  }
  return out;
}

const raw = loop.map((n) => [n.x, n.z]);
let simple = simplify(raw, 3);
for (let k = 0; k < 40; k++) { const f = fold(simple); if (f.length === simple.length) break; simple = simplify(f, 3); }
const rounded = fillet(simple);
let line = resample(rounded.pts, 2);
// A light blur joins the arcs to the straights without kinks.
{
  const xs = blur(line.map((p) => p[0]), 3), zs = blur(line.map((p) => p[1]), 3);
  line = line.map((_, i) => [xs[i], zs[i]]);
}
const n2 = line.length;

// What street each point is on, for its width and for the scenery.
const onStreet = line.map(([x, z]) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < loop.length; i++) { const d = segDist(x, z, loop[i], loop[(i + 1) % loop.length]); if (d < bd) { bd = d; best = i; } }
  return loopEdges[best];
});
const widths = blur(onStreet.map((e) => Math.max(W_MIN, carriageway(e.tags))), 12);

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
const ground = await terrain();
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
// Smoothed over about 10 m (a Gaussian blur's spread), and the layout's points are 8 m apart; real
// streets tip sideways by up to a few percent, more on a hill's flank; a kart's road no more than 8%.
const SMOOTH = 5;
const ys = blur(blur(cross.map((c) => c.y), SMOOTH), SMOOTH).map((h) => h - ELEV0);
const banks = blur(blur(cross.map((c) => Math.atan(c.slope)), SMOOTH), SMOOTH).map((b) => Math.max(-0.08, Math.min(0.08, b)));
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
  const a = ys[(i - 5 + n2) % n2], b = ys[i], c = ys[(i + 5) % n2];
  maxGrade = Math.max(maxGrade, Math.abs(c - a) / 20);
  const k = (a - 2 * b + c) / 100; // second derivative over 10 m
  if (k < 0) minCrest = Math.min(minCrest, -1 / k);
}
const length = n2 * 2;
console.log(`\ncentre line ${length} m; corners tighter than 9 m: ${rounded.tight.length} ${JSON.stringify(rounded.tight)}`);
console.log(`widths ${Math.min(...widths).toFixed(1)}–${Math.max(...widths).toFixed(1)} m, ${Math.round((100 * widths.filter((w) => w < W_MIN + 0.5).length) / n2)}% at the least`);
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
  if (places.some((p) => Math.hypot(line[i][0] - p.x, line[i][1] - p.z) < 250)) continue;
  if (startStreet && onStreet[i].name !== START_ON) continue;
  const sc = maxCurve(i, 60, 40) + (main(onStreet[i]) ? 0 : 0.01);
  if (sc < startScore) { startScore = sc; start = i; }
}
// Everything from here counts from the start line.
const at = (k) => (start + k) % n2; // k samples (2 m each) after the start
const straightest = (k, span) => { let best = k, bs = Infinity; for (let d = -span; d <= span; d++) { const sc = maxCurve(at(k + d), 10, 10); if (sc < bs) { bs = sc; best = k + d; } } return best; };

const checkpoints = [1, 2, 3, 4, 5].map((f) => straightest(Math.round((f * n2) / 6), 20));
const busy = (k) => [0, ...checkpoints].some((c) => Math.abs(((k - c + n2 / 2 + n2) % n2) - n2 / 2) < 30);
const items = [];
for (let k = 150; k < n2 - 100; k += 410) { let b = straightest(k, 40); if (busy(b)) b += 40; items.push(b); }
// Boost pads 30 m into the longest straights.
const straights = [];
for (let k = 0, run = 0; k < n2; k++) {
  if (curvature[at(k)] < 0.006) run++;
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
// `rows` in places.json, and the joins out of them.
const rowStreets = new Set([...places.filter((p) => p.rows).map((p) => p.street), '(joined)']);
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
// 4. The layout for the game: a point every 8 m (every tagged sample too), from the start line.

const tagAt = new Map([[0, 'start'], ...checkpoints.map((k) => [k, 'cp']), ...items.map((k) => [k, 'items']), ...boosts.map((k) => [k, 'boost'])]);
const r1 = (v) => Math.round(v * 10) / 10;
// Heights to the centimetre: decimetres would put bumps of their own in a road made smooth.
const r2 = (v) => Math.round(v * 100) / 100;
const pointsOut = [];
let lastW = null, lastSurface = null, lastLanes = null, lastKerbs = null, lastBank = null, lastBridge = false;
const half5 = (v) => Math.round(v * 2) / 2;
for (let k = 0; k < n2; k++) {
  if (k % 4 !== 0 && !tagAt.has(k)) continue;
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
    if (name && name !== '(joined)' && name !== last && !streets.some((s) => s.name === name)) {
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

// The box the games draw round it: the track and 500 m round it, inside the map. And the sections
// it runs through, from the start.
let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
for (const [x, z] of line) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); }
const BOX = { x0: Math.max(EXT.x0, Math.floor((bx0 - 500) / 10) * 10), x1: Math.min(EXT.x1, Math.ceil((bx1 + 500) / 10) * 10), z0: Math.max(EXT.z0, Math.floor((bz0 - 500) / 10) * 10), z1: Math.min(EXT.z1, Math.ceil((bz1 + 500) / 10) * 10) };
const sections = [...new Set(line.map((_, k) => sectionOf(...line[at(k)])))];
console.log(`sections ${sections.join(', ')}; ${streets.length} street names; landmarks: ${landmarks.map((l) => l.name).join(', ')}`);

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
  eggs, joins, rows,
};
fs.writeFileSync(pageFile, JSON.stringify(page));
console.log(`wrote tracks/${cfg.id}.js (${pointsOut.length} points) and map/tracks.json`);
