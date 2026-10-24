// The streets and the railway as OpenStreetMap has them, for world.mjs and streets.mjs: each way's
// kind, its width kerb to kerb, its points, nodes and tags, and its level; and the height of each
// point that's off the ground, on a bridge's deck or a tunnel's road. And the streets moved onto
// their carriageways where DGT's LiDAR measured them (task 026).
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, P, unP } from './geo.mjs';
import { carriageway, LINE } from './osm.mjs';

// ---- The streets on their carriageways (task 026) ----

// carriageways.mjs measures where each street's carriageway really is in the open world's area, and
// works out the moves that put each line on its middle, at its width: .cache/carriageways.json. The
// map's way stays the street, with its name, kind, junctions and direction; its nodes move. Every
// reader of the map's streets reads them through onCarriageways: world.mjs (and through it the
// tiles, the paths' joins and the ground held at the decks' ends), track.mjs's graph, open.mjs's
// edge and gates, walls.mjs and the map page. Without the file, the map's lines as they are. And the
// roundabouts' rings, which carriageways.mjs leaves (a ring is all junctions), measured by
// roundabouts.mjs (task 014): .cache/roundabouts.json's moves, laid over the streets', each ring's
// nodes and ways and its arms' ends taking its.
const MOVES = path.join(CACHE, 'carriageways.json'), RINGS = path.join(CACHE, 'roundabouts.json');
let moves;
export function carriagewayMoves() {
  if (moves !== undefined) return moves;
  const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).moves ?? null : null);
  const streets = read(MOVES), rings = read(RINGS);
  moves = streets && rings ? { nodes: { ...streets.nodes, ...rings.nodes }, inserts: { ...streets.inserts, ...rings.inserts }, widths: { ...streets.widths, ...rings.widths } } : streets ?? rings;
  return moves;
}

// A street's points and nodes ([x, z] on the map, its node ids) with its moves made: each node moved,
// and the points put in between two where its middle bends between them, each with a node id of its
// own below zero.
export function moveLine(id, nodes, pts, m = carriagewayMoves()) {
  if (!m) return { nodes, pts };
  const outN = [], outP = [];
  for (let i = 0; i < nodes.length; i++) {
    const d = m.nodes[nodes[i]], p = pts[i];
    outN.push(nodes[i]);
    outP.push(d ? [p[0] + d[0], p[1] + d[1]] : p);
    const put = i + 1 < nodes.length ? m.inserts[`${id}:${nodes[i]}-${nodes[i + 1]}`] : null;
    if (put) for (const q of put) { outN.push(-(id * 10000 + outN.length)); outP.push(q); }
  }
  return { nodes: outN, pts: outP };
}

// OpenStreetMap's data as fetch.mjs keeps it (base.json, paths.json, street.json), with the moves
// made: each street's way on its carriageway, its width the one measured where it was clearly
// (`width:lidar`, which osm.mjs's carriageway takes before the map's), but with `widths` false; and
// every other way or node that shares a node with a street (a footway that ends on it) moved with it there.
export function onCarriageways(osm, { widths = true } = {}) {
  const m = carriagewayMoves();
  if (!m) return osm;
  const at = ([x, z]) => { const [lat, lon] = unP(x, z); return { lat, lon }; };
  return {
    ...osm,
    elements: osm.elements.map((e) => {
      if (e.type === 'node') { const d = m.nodes[e.id]; return d ? { ...e, ...at([P(e)[0] + d[0], P(e)[1] + d[1]]) } : e; }
      const w = widths ? m.widths[e.id] : undefined;
      if (e.type !== 'way' || !e.nodes || e.nodes.length !== e.geometry?.length || (!w && !e.nodes.some((n) => m.nodes[n]) && !e.nodes.some((n, i) => m.inserts[`${e.id}:${n}-${e.nodes[i + 1]}`]))) return e;
      const got = moveLine(e.id, e.nodes, e.geometry.map(P), m);
      return { ...e, nodes: got.nodes, geometry: got.pts.map(at), ...(w && { tags: { ...e.tags, 'width:lidar': String(w) } }) };
    }),
  };
}

// Each street's level: on the ground; on a bridge; in a tunnel, under the ground's surface; or
// under something at the ground's own level, open either side: a building over it (a passage, or
// `covered`), or a bridge's deck (where the map draws the stretch under a bridge as a tunnel).
export const LEVEL = { ground: 0, bridge: 1, tunnel: 2, under: 3 };
const on = (v) => v != null && v !== 'no';
export const levelOf = (t) => (on(t.bridge) ? LEVEL.bridge : t.tunnel === 'building_passage' || (on(t.covered) && !on(t.tunnel)) ? LEVEL.under : on(t.tunnel) ? LEVEL.tunnel : LEVEL.ground);

// A way that's a street or the railway, as a line; a pedestrian area isn't one (it's a square).
export const isLine = (e) => e.type === 'way' && (LINE[e.tags?.highway] != null || !!e.tags?.railway);
export const isSquare = (e, pts) => e.tags.highway === 'pedestrian' && (e.tags.area === 'yes' || (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]));
// And a square mapped in parts, a multipolygon (the Praça da República): fetch.mjs's `paths` has them
// (task 041).
export const isSquareInParts = (e) => e.type === 'relation' && e.tags?.highway === 'pedestrian' && e.tags.type === 'multipolygon';

// Every street and railway with a point within 50 m of the box `near` takes (x, z, margin), from
// fetch.mjs's base.json, each { id, k, w, pts, nodes, t, level }; and `heights`, a line's point (the
// array itself) → its height above the sea, for those on a bridge or in a tunnel (levelHeights).
export function streetLines(base, ground, near, grid = ground.at, held = null, deck = null) {
  const lines = streetsOf(base, near);
  return { lines, ...levelHeights(lines, ground, grid, held, deck) };
}
// How far round a point of a bridge its deck is read (decks.mjs): within a lane of its middle.
const DECK_R = 2.5;

export function streetsOf(base, near) {
  const lines = [];
  for (const e of base.elements) {
    if (!isLine(e)) continue;
    const t = e.tags, pts = e.geometry.map(P);
    if (!pts.some(([x, z]) => near(x, z, 50)) || isSquare(e, pts)) continue;
    lines.push({ id: e.id, k: t.railway ? 9 : LINE[t.highway], w: t.railway ? 4 : carriageway(t), pts, nodes: e.nodes, t, level: levelOf(t) });
  }
  return lines;
}

// ---- What's walked or cycled (task 050) ----

// The kinds of path, as a gate has them after the streets' (osm.mjs's LINE) and the railway's 9.
export const PATH_K = { footway: 10, path: 11, cycleway: 12, steps: 13 };
const PATH_OF = { footway: 'footway', path: 'path', bridleway: 'path', cycleway: 'cycleway', steps: 'steps' };
// What the map draws as a footway or a cycleway that's the streets' own (streets.mjs): the pavements
// beside them, the crossings over them, the islands between, and the links from one to another.
const STREETS_OWN = new Set(['sidewalk', 'crossing', 'traffic_island', 'link']);
// The map's surfaces, as the world has them; and each kind's where it says none.
const PATH_SURFACE = {
  asphalt: 'asphalt', chipseal: 'asphalt', concrete: 'concrete', 'concrete:plates': 'concrete', 'concrete:lanes': 'concrete',
  paving_stones: 'paving', paved: 'paving', granite: 'paving', granito: 'paving',
  sett: 'setts', cobblestone: 'setts', unhewn_cobblestone: 'setts',
  gravel: 'gravel', fine_gravel: 'gravel', compacted: 'gravel', pebblestone: 'gravel',
  dirt: 'dirt', earth: 'dirt', ground: 'dirt', grass: 'dirt', mud: 'dirt', sand: 'dirt', rock: 'dirt', grass_paver: 'dirt',
  metal: 'metal', wood: 'wood',
};
const PATH_USUAL = { footway: 'calcada', path: 'dirt', cycleway: 'asphalt', steps: 'paving' };
// How wide each kind usually is where the map doesn't say: a cycleway 2.5 m, a lane each way, and
// one way 1.5 m.
const pathWidth = (kind, t) => {
  const w = parseFloat(t.width);
  if (w > 0.5) return Math.min(w, 15);
  return kind === 'cycleway' ? (t.oneway === 'yes' ? 1.5 : 2.5) : kind === 'path' ? 1.5 : 2;
};

// Every footway, path, cycleway, bridleway and flight of steps with a point within 50 m of the box
// `near` takes, from fetch.mjs's paths.json: but the streets' own, and what's indoors (in a building,
// or on one of its floors, `level`). Each { id, kind, k, w, surface, pts, nodes, t, level }: kind
// footway, path (a bridleway too), cycleway or steps, k its PATH_K, w its width, surface one of
// calcada, paving, setts, asphalt, concrete, gravel, dirt, metal or wood.
export function pathsOf(paths, near) {
  const out = [];
  for (const e of paths.elements) {
    const t = e.tags ?? {}, kind = PATH_OF[t.highway];
    if (e.type !== 'way' || !kind || STREETS_OWN.has(t.footway) || STREETS_OWN.has(t.cycleway)) continue;
    if ((t.indoor && t.indoor !== 'no') || (t.level != null && t.level !== '0')) continue;
    const pts = e.geometry.map(P);
    if (pts.length < 2 || !pts.some(([x, z]) => near(x, z, 50))) continue;
    out.push({ id: e.id, kind, k: PATH_K[kind], w: pathWidth(kind, t), surface: PATH_SURFACE[t.surface] ?? PATH_USUAL[kind], pts, nodes: e.nodes, t, level: levelOf(t) });
  }
  return out;
}

// The pavements the map draws on their own, beside a street (footway=sidewalk), on the ground and
// outdoors, with a point within 50 m of the box `near` takes (task 059): what pathsOf leaves out as the
// streets' own, for streets.mjs to pave where the streets' pavements don't reach. Each { id, w, pts }:
// w its width, the map's or a footway's usual 2 m.
export function sidewalksOf(paths, near) {
  const out = [];
  for (const e of paths.elements) {
    const t = e.tags ?? {};
    if (e.type !== 'way' || t.highway !== 'footway' || t.footway !== 'sidewalk') continue;
    if ((t.indoor && t.indoor !== 'no') || (t.level != null && t.level !== '0') || levelOf(t) !== LEVEL.ground) continue;
    const pts = e.geometry.map(P);
    if (pts.length < 2 || !pts.some(([x, z]) => near(x, z, 50))) continue;
    out.push({ id: e.id, w: pathWidth('footway', t), pts });
  }
  return out;
}

// A riser, where the map doesn't count the steps; and the least a counted step rises in the terrain
// for the terrain to be taken to have the flight's rise.
export const RISER = 0.16;
const SHOWS = 0.08;

// A flight of steps' treads, from its foot to its top: as many as the map counts (step_count), or its
// rise over RISER, the first riser at the foot; each tread at its own height, the last at the top's.
// The heights at its ends: `at(n, x, z)`, a bridge's deck where the flight ends on one (by its node),
// else the LiDAR's terrain at 50 cm where it has it, else the tiles' ground. Which end is up: the
// heights'. But where the map counts the steps and the terrain rises less than SHOWS a step between
// them, or the other way from the map's `incline`, the flight climbs to something the terrain doesn't
// have, a door's landing or a terrace's: its foot is at the ground, the incline's lower end (or the
// heights'), and each step a RISER up from it (the owner's answer, task 050). Returns { pts, ys, n,
// counted }: pts the flight's line from its foot, ys each tread's height.
export function flight(p, at) {
  const ya = at(p.nodes[0], ...p.pts[0]), yb = at(p.nodes.at(-1), ...p.pts.at(-1)), count = parseInt(p.t.step_count);
  const up = p.t.incline === 'up' ? true : p.t.incline === 'down' ? false : null;
  const rise = yb - ya, counted = count > 0;
  let foot, top, from;
  if (counted && (Math.abs(rise) < SHOWS * count || (up !== null && up !== rise > 0))) {
    from = (up ?? rise >= 0) ? 0 : 1;
    foot = from ? yb : ya;
    top = foot + RISER * count;
  } else {
    from = rise >= 0 ? 0 : 1;
    [foot, top] = from ? [yb, ya] : [ya, yb];
  }
  const n = counted ? count : Math.max(1, Math.round(Math.abs(rise) / RISER));
  return { pts: from ? p.pts.slice().reverse() : p.pts, ys: Array.from({ length: n }, (_, i) => foot + ((top - foot) * (i + 1)) / n), n, counted, foot };
}

// The paths (pathsOf) with what streets.mjs needs to make them surfaces, heights above elev0: a
// footbridge's and a path's tunnel's at each point (ys), as a street's are (levelHeights, from `grid`,
// the ground as the tiles hold it), but a footbridge's ends on the deck the LiDAR saw (`deck`), where
// it's over the ground, on the stairs or the ramps up to it; and a flight of steps' treads (`flight`),
// its ends on the deck of a bridge it ends on (the streets' `lines` at their `heights`, or a
// footbridge), else the LiDAR's terrain at 50 cm, else the tiles' ground.
export function pathLines(paths, { ground, grid = ground.at, deck = null, lines = [], heights = new Map(), elev0 = 0 }) {
  const own = levelHeights(paths, ground, grid, null, deck, true).heights, onDeck = new Map();
  for (const [list, hs] of [[lines, heights], [paths, own]]) for (const l of list) if (l.level === LEVEL.bridge && l.nodes?.length === l.pts.length) l.nodes.forEach((n, i) => { if (hs.has(l.pts[i])) onDeck.set(n, hs.get(l.pts[i])); });
  for (const p of paths) {
    if (p.kind === 'steps') {
      const f = flight(p, (n, x, z) => onDeck.get(n) ?? (ground.covers(x, z, true) ? ground.at(x, z) : grid(x, z)));
      p.flight = { ...f, foot: f.foot - elev0, ys: f.ys.map((y) => y - elev0) };
    } else if (p.level === LEVEL.bridge || p.level === LEVEL.tunnel) p.ys = p.pts.map((q) => (own.get(q) ?? ground.at(...q)) - elev0);
  }
  return paths;
}

// The heights of what's off the ground: a bridge's deck, and a tunnel's road. Each runs straight
// between the ground where it ends: the LiDAR's ground is the bare earth, which has what's under a
// deck and over a tunnel, not the deck or the tunnel's road. A bridge or a tunnel the map draws as
// several ways is taken whole: its ends are where it meets nothing more of its kind, or a street on
// the ground, and each point between is as high as its two nearest ends make it, by how far it is
// from each along the way. A tunnel's end is at its mouth, where the ground is the cutting's floor:
// the lowest of the ground there and out from it, up to 4 m; or, where the ground's `held` (below),
// the ground at its end, as a deck's. Then a tunnel whose ground stays within 2.5 m of its road is
// open to the sky, under a bridge's deck only: `under`, and `open` counts them.
//
// The ground at the ends is `grid`'s, by default the LiDAR's: world.mjs gives it the ground as the
// tiles hold it, which a street on the ground takes, so a deck and the street it meets are at one
// height there (task 040).
//
// But a flyover humps over what it crosses, with both its ends on the ground, and the straight line
// lays it on what it crosses (the Rotunda Santos da Cunha's viaduct, 6 m under its deck: task 047).
// Where `deck` (decks.mjs: the decks DGT's point cloud saw) has a bridge's deck at a point between
// its ends, 30 cm or more over the straight line, the deck's height there. With `deckEnds` (a
// footbridge, task 050, whose ends are often on stairs or ramps up to it), at its ends too, where the
// deck is half a metre or more over the ground.
export function levelHeights(lines, ground, grid = ground.at, held = null, deck = null, deckEnds = false) {
  const heights = new Map();
  for (const level of [LEVEL.bridge, LEVEL.tunnel]) {
    const ways = lines.filter((l) => l.level === level && l.nodes?.length === l.pts.length);
    const nb = new Map(), at = new Map(), all = new Map(); // node → [[node, metres]], its point, its points in every way
    for (const l of ways) l.nodes.forEach((n, i) => {
      at.set(n, l.pts[i]);
      all.set(n, [...(all.get(n) ?? []), l.pts[i]]);
      if (!nb.has(n)) nb.set(n, []);
      if (i) { const d = Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]); nb.get(n).push([l.nodes[i - 1], d]); nb.get(l.nodes[i - 1]).push([n, d]); }
    });
    // The ends: nodes with one neighbour of their kind, or that a street on the ground shares (where
    // the bridge forks as it meets it), and the ground there.
    const onGround = new Set(lines.filter((l) => l.level === LEVEL.ground || l.level === LEVEL.under).flatMap((l) => l.nodes ?? []));
    const ends = [...nb].filter(([n, ns]) => new Set(ns.map(([m]) => m)).size === 1 || onGround.has(n)).map(([n, ns]) => {
      const [x, z] = at.get(n), [px, pz] = at.get(ns[0][0]), d = Math.hypot(x - px, z - pz) || 1;
      // A tunnel's: the lowest from its mouth to 4 m out, every half metre (the tiles' 2 m ground
      // reaches the cutting's floor before 4 m out, and rises again).
      const out = level === LEVEL.tunnel && held?.at(x, z) === undefined ? Math.min(...[1, 2, 3, 4, 5, 6, 7, 8].map((k) => grid(x + ((x - px) / d) * k * 0.5, z + ((z - pz) / d) * k * 0.5))) : Infinity;
      const y = Math.min(grid(x, z), out), seen = level === LEVEL.bridge && deckEnds && deck?.at(x, z, DECK_R);
      return { n, y: seen && seen.n >= 3 && seen.y > y + 0.5 ? seen.y : y };
    });
    // The two nearest ends of each node, along the ways (Dijkstra from all the ends at once).
    const best = new Map(); // node → [{ e, d }] up to two, of different ends
    const queue = ends.map((e, k) => ({ n: e.n, e: k, d: 0 }));
    while (queue.length) {
      let q = 0;
      for (let k = 1; k < queue.length; k++) if (queue[k].d < queue[q].d) q = k;
      const { n, e, d } = queue.splice(q, 1)[0], got = best.get(n) ?? [];
      if (got.length >= 2 || got.some((g) => g.e === e)) continue;
      got.push({ e, d });
      best.set(n, got);
      for (const [m, l] of nb.get(n)) queue.push({ n: m, e, d: d + l });
    }
    for (const [n, got] of best) {
      const [a, b] = got;
      let y = !b ? ends[a.e].y : (ends[a.e].y * b.d + ends[b.e].y * a.d) / (a.d + b.d || 1);
      const d = level === LEVEL.bridge && a.d > 0 && deck?.at(...at.get(n), DECK_R);
      if (d && d.n >= 3 && d.y > y + 0.3) y = d.y;
      for (const p of all.get(n)) heights.set(p, y);
    }
    for (const l of ways) for (const p of l.pts) if (!heights.has(p)) heights.set(p, ground.at(...p));
  }
  let open = 0;
  for (const l of lines) {
    if (l.level !== LEVEL.tunnel) continue;
    if (l.pts.every((p) => !heights.has(p) || ground.at(...p) - heights.get(p) < 2.5)) { l.level = LEVEL.under; open++; }
  }
  return { heights, open };
}

// Where a street on a bridge or in a tunnel meets the streets on the ground: each end of a way of it
// at a node a street on the ground shares, but where the bridge or the tunnel goes on from it the
// other way. Each { n, p, u, w, level }: its node and point, the way into the bridge or the tunnel
// from it (to a point 3 m along, or its last), and its width.
export function meetings(lines) {
  const street = (l) => l.k <= 8 && l.nodes?.length === l.pts.length;
  const onGround = new Set(lines.filter((l) => street(l) && (l.level === LEVEL.ground || l.level === LEVEL.under)).flatMap((l) => l.nodes));
  const up = lines.filter((l) => street(l) && (l.level === LEVEL.bridge || l.level === LEVEL.tunnel));
  // The way into a line from its point i, towards j.
  const into = (l, i, j) => {
    const p = l.pts[i];
    let q = l.pts[j];
    for (let k = j; k >= 0 && k < l.pts.length; k += j > i ? 1 : -1) { q = l.pts[k]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) >= 3) break; }
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(q[0] - p[0]) / d, (q[1] - p[1]) / d];
  };
  const ends = up.flatMap((l) => [[0, 1], [l.pts.length - 1, l.pts.length - 2]].filter(([i]) => onGround.has(l.nodes[i])).map(([i, j]) => ({ n: l.nodes[i], p: l.pts[i], u: into(l, i, j), w: l.w, level: l.level })));
  return ends.filter((e) => !ends.some((o) => o.n === e.n && o.level === e.level && o.u[0] * e.u[0] + o.u[1] * e.u[1] < -0.5));
}

// A street's lumps, along its heights every `step` metres ([{ y, l, r }]: its own height, and the
// ground past its kerbs on its left and right): where it stands more than `lump` over the chord from up
// to `span` metres back to as far on, and the ground either side doesn't stand half as much over its
// own (task 067: the crowns meeting over the Rua Padre Francisco de Almeida, 9 m; no street rises and
// falls 4 m within 24 m). Each taken from the widest such chord and 2 m more either way, those that
// overlap as one, and the street's height laid straight across it. Returns them, [{ a, b, over }], by
// index.
export function flattenLumps(at, step, { lump = 4, span = 12 } = {}) {
  const runs = [], pad = Math.ceil(2 / step);
  for (let k = 1; k < at.length - 1; k++) {
    let best = null;
    for (let h = Math.ceil(3 / step); h * step <= span && k - h >= 0 && k + h < at.length; h++) {
      const bump = (f) => f(at[k]) - (f(at[k - h]) + f(at[k + h])) / 2, b = bump((p) => p.y);
      if (b > lump && Math.min(bump((p) => p.l), bump((p) => p.r)) < b / 2) best = { a: Math.max(0, k - h - pad), b: Math.min(at.length - 1, k + h + pad), over: b };
    }
    if (!best) continue;
    const last = runs[runs.length - 1];
    if (last && best.a <= last.b) Object.assign(last, { b: Math.max(last.b, best.b), over: Math.max(last.over, best.over) });
    else runs.push(best);
  }
  for (const { a, b } of runs) for (let k = a + 1; k < b; k++) at[k].y = at[a].y + ((at[b].y - at[a].y) * (k - a)) / (b - a);
  return runs;
}

// The ground held to a street on the ground where DGT's terrain stands more than `over` above it within
// its carriageway: a tree's crown or a roof the LiDAR classed as ground, which a street the tiles drape
// on their ground would climb (task 026: the Avenida Doutor Porfírio da Silva's at (755, 653), 18 m
// over the street, threw the race's karts off it). Along each street every metre, its own height is the
// median of the terrain over its middle half, carried across at that half's slope; where the terrain is
// more than `over` above that, within the street's width, the street's height. And where it stands
// more than `tall` over the street on its carriageway, the whole of what stands more than `over` over
// it there, if that ends within `reach` of where it's on the street (a crown, a roof: not a hill or a
// terrace, which runs on), at the ground's height round it. And where a street's own height itself
// rises more than `lump` over the chord from up to `span` metres back to as far on, and the ground
// `side` metres past its kerbs either side doesn't, something across its whole width the LiDAR classed
// as ground (task 067: the crowns of the trees either side of the Rua Padre Francisco de Almeida
// meeting over it at (874, 1098), 9 m): the street straight under it, from a little before to after.
// `lines`: lines.mjs's streetsOf, those in `box`; `at(x, z)`, the height held there, or undefined;
// `near(x, z, r)`, whether any of it is within r; `blobs`, those taken off beside the streets ({ x, z,
// cells, over }); `lumps`, those taken off across them ({ x, z, over }).
export function streetBumps(lines, ground, box, { over = 1, tall = 5, reach = 20, lump = 4, span = 12, side = 3 } = {}) {
  const S = 0.5, cells = new Map(), coarse = new Set(), key = (i, j) => i * 100003 + j, across = [];
  const mid = (i) => (i + 0.5) * S;
  const median = (v) => { const s = v.sort((a, b) => a - b); return s[s.length >> 1]; };
  for (const l of lines) {
    if (l.k > 8 || l.level !== LEVEL.ground || !l.pts.some(([x, z]) => x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1)) continue;
    const hw = l.w / 2;
    // Its own height every metre along it, and the ground past its kerbs either side.
    const at = [];
    for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], L = Math.hypot(bx - ax, bz - az);
      if (L < 1e-6) continue;
      const tx = (bx - ax) / L, tz = (bz - az) / L, rx = -tz, rz = tx;
      for (let d = 0; d < L; d += 1) {
        const x = ax + tx * d, z = az + tz * d, mid = [], slopes = [];
        for (let o = 0; o <= hw / 2 + 1e-9; o += S) {
          const p = ground.at(x + rx * o, z + rz * o), q = ground.at(x - rx * o, z - rz * o);
          mid.push(p);
          if (o) { mid.push(q); slopes.push((p - q) / (2 * o)); }
        }
        at.push({ x, z, tx, tz, rx, rz, y: median(mid), g: slopes.length ? median(slopes) : 0, l: ground.at(x + rx * (hw + side), z + rz * (hw + side)), r: ground.at(x - rx * (hw + side), z - rz * (hw + side)) });
      }
    }
    for (const { a, b, over: o } of flattenLumps(at, 1, { lump, span })) {
      const m = at[(a + b) >> 1];
      across.push({ x: Math.round(m.x), z: Math.round(m.z), over: Math.round(o * 10) / 10 });
    }
    for (const { x, z, tx, tz, rx, rz, y, g } of at) {
      for (let a = -0.5; a <= 0.5; a += S) for (let o = -hw; o <= hw + 1e-9; o += S) {
        const px = x + tx * a + rx * o, pz = z + tz * a + rz * o, k = key(Math.floor(px / S), Math.floor(pz / S)), was = cells.get(k);
        if (!was || Math.abs(o) < was.o) cells.set(k, { y: y + g * o, o: Math.abs(o), i: Math.floor(px / S), j: Math.floor(pz / S) });
        coarse.add(key(Math.floor(px / 4), Math.floor(pz / 4)));
      }
    }
  }
  const lumps = new Map(), seen = new Set(), blobs = [];
  for (const c of cells.values()) {
    const k0 = key(c.i, c.j);
    if (seen.has(k0) || ground.at(mid(c.i), mid(c.j)) <= c.y + tall) continue;
    seen.add(k0);
    const region = [], rim = [], queue = [[c.i, c.j]];
    let closed = true, top = 0;
    while (queue.length) {
      const [i, j] = queue.pop();
      if (Math.hypot(i - c.i, j - c.j) * S > reach) { closed = false; break; }
      region.push([i, j]);
      top = Math.max(top, ground.at(mid(i), mid(j)) - c.y);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj, nk = key(ni, nj);
        if (seen.has(nk)) continue;
        const h = ground.at(mid(ni), mid(nj));
        if (h > c.y + over) { seen.add(nk); queue.push([ni, nj]); } else rim.push(h);
      }
    }
    if (!closed || !rim.length) continue;
    const y = median(rim);
    for (const [i, j] of region) if (!cells.has(key(i, j))) { lumps.set(key(i, j), y); coarse.add(key(Math.floor(mid(i) / 4), Math.floor(mid(j) / 4))); }
    blobs.push({ x: Math.round(mid(c.i)), z: Math.round(mid(c.j)), cells: region.length, over: Math.round(top) });
  }
  return {
    blobs,
    lumps: across,
    at(x, z) {
      const k = key(Math.floor(x / S), Math.floor(z / S)), c = cells.get(k);
      if (c) return ground.at(x, z) > c.y + over ? c.y : undefined;
      return lumps.get(k);
    },
    near(x, z, r) {
      for (let i = Math.floor((x - r) / 4); i <= Math.floor((x + r) / 4); i++) for (let j = Math.floor((z - r) / 4); j <= Math.floor((z + r) / 4); j++) if (coarse.has(key(i, j))) return true;
      return false;
    },
  };
}

// The carriageways of the streets on the ground in `box`, each its line's width either side of it, for
// the tiles' 2 m ground (task 045). A grid point's square, wherever it reaches a carriageway, is the
// mean over only the part of it on the carriageway, so the street keeps its own height, not that of a
// wall, a cutting's floor or a bank beside it within a square of it (a street 2 to 4 m from a wall rode
// up it, or rippled along it as the grid's points came nearer it and further off). And of the
// carriageway, only where the ground is within OFF of the street's own surface: every metre along it,
// the median of `at` (the ground as the tiles hold it at a tunnel's mouth, heldGround's, and
// streetBumps', but not at a deck's end) over its middle half, carried across at that half's slope, as
// streetBumps has it, but no steeper than TIP (none of the area's streets tips more; where something
// not the street reaches into the middle half, it would). What's off it there is a wall the
// carriageway's width reaches, its face's smear over the LiDAR's last half metre, or the cutting or the
// island a tunnel's mouth opens under. A square with none of it on the street's surface (the top of a
// wall the map's line puts in the street) is the mean of all of it, as before: the wall stays where it
// is. Where the square reaches two streets at different heights side by side (a cutting's floor and a
// lane along its top a metre apart), the point holds the one whose surface its own ground is within
// SIDE of, the side of the wall it's on, so the step between them stays at the wall; on the wall's face,
// within SIDE of neither, the one whose middle is nearest. Not where an outline the map tags as a
// street (area:highway) is: it's no carriageway. `lines`: lines.mjs's streetsOf. `of(x, z, s)`: for the
// square s metres a side round (x, z), sampled every half metre as terrain.mjs's mean samples it, a
// function of a point (px, pz) and the ground's h there: h where it's on the carriageway the square is
// held to and on its surface, else undefined; or null where the square reaches none, or reaches the
// ground held at a deck's end (`deck(x, z)`, heldGround's atDeck), which is as task 043 has it: under
// the deck's first metres and across its pavements, for a car that feels the land's slope over its
// length. `near(x, z, r)`, whether a carriageway is within r of (x, z).
export function streetBands(lines, box, at, deck = () => false, { S = 0.5, OFF = 0.3, TIP = 0.1, SIDE = 1 } = {}) {
  const CELL = 8, cells = new Map(), key = (i, j) => i * 100003 + j;
  const inBox = ([x, z]) => x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1;
  // Not an area's outline the map tags as a street (area:highway: the Rotunda Santos da Cunha's island,
  // way 160389857, which the world draws as the map has it, decision 022).
  const streets = lines.filter((l) => l.k <= 8 && (l.level === LEVEL.ground || l.level === LEVEL.under) && !l.t['area:highway'] && l.pts.some(inBox));
  const median = (v) => { const s = v.sort((a, b) => a - b); return s[s.length >> 1]; };
  // Each street's stretches, and on each its surface every metre: [y, slope across].
  const segs = streets.map((l) => l.pts.slice(1).flatMap((b, i) => {
    const [ax, az] = l.pts[i], [bx, bz] = b, L = Math.hypot(bx - ax, bz - az);
    if (L < 1e-6) return [];
    const tx = (bx - ax) / L, tz = (bz - az) / L, rx = -tz, rz = tx, ys = [], gs = [];
    for (let k = 0; k <= Math.ceil(L); k++) {
      const d = Math.min(k, L), x = ax + tx * d, z = az + tz * d, mid = [], slopes = [];
      for (let o = 0; o <= l.w / 4 + 1e-9; o += S) {
        const p = at(x + rx * o, z + rz * o), q = at(x - rx * o, z - rz * o);
        mid.push(p);
        if (o) { mid.push(q); slopes.push((p - q) / (2 * o)); }
      }
      ys.push(median(mid));
      gs.push(slopes.length ? Math.max(-TIP, Math.min(TIP, median(slopes))) : 0);
    }
    return [{ ax, az, bx, bz, tx, tz, L, ys, gs }];
  }));
  streets.forEach((l, n) => segs[n].forEach(({ ax, az, bx, bz }) => {
    const r = l.w / 2 + 2;
    for (let i = Math.floor((Math.min(ax, bx) - r) / CELL); i <= Math.floor((Math.max(ax, bx) + r) / CELL); i++) for (let j = Math.floor((Math.min(az, bz) - r) / CELL); j <= Math.floor((Math.max(az, bz) + r) / CELL); j++) {
      const k = key(i, j);
      if (!cells.has(k)) cells.set(k, new Set());
      cells.get(k).add(n);
    }
  }));
  // How far (x, z) is from a street's line, and its surface there.
  const segDist = (x, z, { ax, az, tx, tz, L }) => {
    const f = Math.max(0, Math.min(L, (x - ax) * tx + (z - az) * tz));
    return Math.hypot(x - ax - tx * f, z - az - tz * f);
  };
  const dist = (n, x, z) => Math.min(...segs[n].map((s) => segDist(x, z, s)));
  const surface = (n, x, z) => {
    let best = null, bd = Infinity;
    for (const s of segs[n]) { const d = segDist(x, z, s); if (d < bd) { bd = d; best = s; } }
    const { ax, az, tx, tz, L, ys, gs } = best, k = Math.round(Math.max(0, Math.min(L, (x - ax) * tx + (z - az) * tz)));
    return ys[k] + gs[k] * ((x - ax) * -tz + (z - az) * tx);
  };
  return {
    of(x, z, s) {
      const m = Math.max(1, Math.round(s / S)), as = Array.from({ length: m }, (_, a) => ((a + 0.5) / m - 0.5) * s);
      const pts = as.flatMap((a) => as.map((b) => [x + a, z + b]));
      if (pts.some(([px, pz]) => deck(px, pz))) return null;
      const on = (n, px, pz, h) => dist(n, px, pz) <= streets[n].w / 2 && Math.abs(h - surface(n, px, pz)) <= OFF;
      // The streets with some of the square on them: of those whose surface the point's own ground is
      // within SIDE of (the side of a wall it's on), the one whose middle is nearest; on a wall's face,
      // within SIDE of none, of them all.
      const hs = pts.map(([px, pz]) => at(px, pz)), y0 = at(x, z), got = [];
      for (const n of cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? []) {
        if (dist(n, x, z) <= streets[n].w / 2 + s && pts.some(([px, pz], i) => on(n, px, pz, hs[i]))) got.push({ n, side: Math.abs(surface(n, x, z) - y0) <= SIDE, d: dist(n, x, z) });
      }
      if (!got.length) return null;
      const best = got.sort((a, b) => b.side - a.side || a.d - b.d)[0].n;
      return (px, pz, h) => (on(best, px, pz, h) ? h : undefined);
    },
    near(x, z, r) {
      for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) if (cells.has(key(i, j))) return true;
      return false;
    },
  };
}

// The ground held to the street where a street on a bridge or in a tunnel meets the streets on the
// ground (meetings), at those `keep` keeps (task 043). The LiDAR's is the bare earth, so where a
// street meets a bridge it has the embankment falling away under the deck, and at a tunnel's mouth
// the hill over it, with the portal's face smeared over the first 1.5 m out of it (the abutment's
// edge over half a metre). The tiles' 2 m means take those into the street, which dips into the
// abutment or climbs the portal. So from 2 m out (HOLD) to 6 m under the deck or 3 m into the
// tunnel (BEYOND), across a deck's width and 4 m more (its pavements and the abutment's top under
// them), or a tunnel's and half a metre (not the walls and hillside beside its portal, where a
// cutting flares), the ground is the LiDAR's across the street 2 m out, carried in at the street's
// own slope there (from 2 to 6 m out).
// - Past the end's line it falls from there, at that slope or, from a metre in, 3% (DROP), whichever
//   is lower, so it doesn't stand through the deck or bury the tunnel's road; under a deck no lower
//   than the LiDAR's (up to the end's), so an abutment's top that runs on under it is kept. It
//   reaches that far under a deck so the 2 m means there don't take in the embankment beyond, which
//   a game that stands a car on the higher of the land and the deck, and feels the land's slope over
//   a car's length, feels as a ramp at the deck's end (party-kart's car was thrown 1.5 s off the
//   Robert Smith's).
// - At a bridge's end it's no lower across the carriageway than the middle less a camber of 5%
//   (CAMBER), and beyond it no lower than at its edge: the abutment's top, under the deck's corners
//   and pavements, not the embankment's side, which eats into the street's corners 2 m out.
// - Between the end's line and 2 m out it runs straight to the LiDAR's; or where the LiDAR's is
//   higher there at a bridge, or lower at a tunnel, the LiDAR's: what's wrong there is only ever
//   lower at a bridge's end (the embankment, the abutment's edge) and higher at a tunnel's (the
//   portal), and the street may sag or rise near it.
// - Never on the carriageway of another street: one more than 10 m from the end along the streets
//   that meets no bridge or tunnel within 10 m of it (a road on the hill over a tunnel's mouth, or
//   on its cutting's wall, or by a deck's end; not a twin bore's own street).
//
// - Where a bridge's deck goes on past the map's end of it, out over the street (the map's bridge
//   stops short of its abutment; `deck`, decks.mjs, has the decks DGT's point cloud saw), the ground
//   is the deck's along the street, out to where it meets the LiDAR's ground, and from there runs
//   straight to the LiDAR's 2 m further out; under the deck, as above from the deck's height at the
//   end (task 047: the Rotunda Santos da Cunha's viaduct runs on 10 m past both its ends).
//
// `ends`, the meetings held; `at(x, z)`, the ground there where it's held, or undefined; `atDeck(x, z)`,
// whether it's held there at a bridge's end; `near(x, z, r)`, whether any of it is within r of (x, z).
export function heldGround(lines, ground, keep = () => true, deck = null) {
  const HOLD = 2, BEYOND = [6, 3], DROP = 0.03, CAMBER = 0.05, CELL = 32;
  const all = meetings(lines), met = new Map(all.map((e) => [e.n, e.p])), ends = all.filter(keep);
  // The streets on the ground, and those within 10 m of a node along them: the street an end meets,
  // and what meets that near it.
  const streets = lines.filter((l) => l.k <= 8 && (l.level === LEVEL.ground || l.level === LEVEL.under) && l.nodes?.length === l.pts.length);
  const byNode = new Map();
  for (const l of streets) l.nodes.forEach((n, i) => byNode.set(n, [...(byNode.get(n) ?? []), [l, i]]));
  const near10 = (n0) => {
    const got = new Set(), best = new Map([[n0, 0]]), queue = [[n0, 0]];
    while (queue.length) {
      queue.sort((a, b) => a[1] - b[1]);
      const [n, d] = queue.shift();
      for (const [l, i] of byNode.get(n) ?? []) {
        got.add(l);
        for (const j of [i - 1, i + 1].filter((j) => j >= 0 && j < l.pts.length)) {
          const dj = d + Math.hypot(l.pts[j][0] - l.pts[i][0], l.pts[j][1] - l.pts[i][1]);
          if (dj <= 10 && !(best.get(l.nodes[j]) <= dj)) { best.set(l.nodes[j], dj); queue.push([l.nodes[j], dj]); }
        }
      }
    }
    return got;
  };
  // Whether a street meets a bridge or a tunnel within 10 m of a point (a twin bore's, or a deck's
  // beside it, each held by its own).
  const meetsNear = (l, [x, z]) => l.nodes.some((n) => met.has(n) && Math.hypot(met.get(n)[0] - x, met.get(n)[1] - z) < 10);
  const zones = ends.map((e) => {
    const bridge = e.level === LEVEL.bridge, W = e.w / 2 + (bridge ? 4 : 0.5), [ux, uz] = e.u;
    const pt = (a, v) => [e.p[0] - ux * a - uz * v, e.p[1] - uz * a + ux * v];
    const as = Array.from({ length: 9 }, (_, k) => HOLD + k * 0.5), hs = as.map((a) => ground.at(...pt(a, 0)));
    const ma = as.reduce((s, a) => s + a, 0) / as.length, mh = hs.reduce((s, h) => s + h, 0) / hs.length;
    const slope = as.reduce((s, a, k) => s + (a - ma) * (hs[k] - mh), 0) / as.reduce((s, a) => s + (a - ma) ** 2, 0);
    const raw = (v) => ground.at(...pt(HOLD, v)) - HOLD * slope, mid = raw(0), hw = e.w / 2;
    const edge = bridge ? [-hw, hw].map((v) => Math.max(raw(v), mid - CAMBER * hw)) : null;
    const end = (v) => (!bridge ? raw(v) : Math.max(raw(v), Math.abs(v) > hw ? edge[+(v > 0)] : mid - CAMBER * Math.abs(v)));
    // The deck the LiDAR saw going on out over the street, a metre at a time, smoothed: where it's half
    // a metre or more over the ground at the end, out to where it's within 30 cm of it. Something a
    // metre or more over or under the deck before it (a footbridge or a gantry over the street) isn't it.
    const seen = [];
    if (bridge && deck) {
      for (let a = 0; a <= 40; a++) {
        const d = deck.at(...pt(a, 0), DECK_R), last = seen[seen.length - 1];
        const y = d && d.n >= 3 && (last === undefined || Math.abs(d.y - last) < 1) ? d.y : last;
        if (y === undefined || y < ground.at(...pt(a, 0)) + (a ? 0.3 : 0.5)) break;
        seen.push(y);
      }
    }
    const out = seen.length, prof = seen.map((_, k) => (seen[Math.max(0, k - 1)] + seen[k] + seen[Math.min(out - 1, k + 1)]) / 3);
    const deckAt = (a) => { const k = Math.max(0, Math.min(out - 1, a)), i = Math.floor(k); return prof[i] + (prof[Math.min(out - 1, i + 1)] - prof[i]) * (k - i); };
    const far = BEYOND[+!bridge], reach = out ? out + HOLD : HOLD, corners = [pt(-far, -W), pt(-far, W), pt(reach, -W), pt(reach, W)];
    const box = { x0: Math.min(...corners.map((c) => c[0])), x1: Math.max(...corners.map((c) => c[0])), z0: Math.min(...corners.map((c) => c[1])), z1: Math.max(...corners.map((c) => c[1])) };
    // The other streets' stretches near it, each with how far from it is on it.
    const mine = near10(e.n), others = streets.filter((l) => !mine.has(l) && !meetsNear(l, e.p)).flatMap((l) => l.pts.slice(1).map((b, i) => [l.pts[i], b, l.w / 2])).filter(([a, b, r]) => Math.max(a[0], b[0]) + r >= box.x0 && Math.min(a[0], b[0]) - r <= box.x1 && Math.max(a[1], b[1]) + r >= box.z0 && Math.min(a[1], b[1]) - r <= box.z1);
    const onOther = (x, z) => others.some(([[ax, az], [bx, bz], r]) => {
      const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - ax - dx * f, z - az - dz * f) < r;
    });
    // How far across (x, z) is, by its share of the width, and the ground there; or null.
    const at = (x, z) => {
      const dx = x - e.p[0], dz = z - e.p[1], a = -(dx * ux + dz * uz), v = -dx * uz + dz * ux;
      if (a < -far || a >= reach || Math.abs(v) > W || onOther(x, z)) return null;
      if (out) {
        const h = ground.at(x, z), y0 = deckAt(0), r = Math.abs(v) / W;
        if (a < 0) return { r, y: Math.max(y0 + DROP * Math.min(0, a + 1), Math.min(h, y0)) };
        if (a < out - 1) return { r, y: Math.max(deckAt(a), h) };
        const y1 = deckAt(out - 1);
        return { r, y: Math.max(y1 + ((a - out + 1) / (HOLD + 1)) * (ground.at(...pt(reach, v)) - y1), h) };
      }
      const y0 = end(v);
      if (a < 0) {
        const y = y0 + Math.min(slope * a, DROP * Math.min(0, a + 1));
        return { r: Math.abs(v) / W, y: bridge ? Math.max(y, Math.min(ground.at(x, z), y0)) : y };
      }
      const y = y0 + (a / HOLD) * (ground.at(...pt(HOLD, v)) - y0), h = ground.at(x, z);
      return { r: Math.abs(v) / W, y: bridge ? Math.max(y, h) : Math.min(y, h) };
    };
    return { box, at, bridge };
  });
  const cells = new Map();
  for (const z of zones) {
    for (let i = Math.floor(z.box.x0 / CELL); i <= Math.floor(z.box.x1 / CELL); i++) for (let j = Math.floor(z.box.z0 / CELL); j <= Math.floor(z.box.z1 / CELL); j++) {
      const k = i + ',' + j;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(z);
    }
  }
  const of = (x, z) => cells.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) ?? [];
  return {
    ends,
    // Where two overlap (two carriageways side by side), the one it's nearer the middle of.
    at(x, z) {
      let best = null;
      for (const zone of of(x, z)) { const h = zone.at(x, z); if (h && (!best || h.r < best.r)) best = h; }
      return best?.y;
    },
    // Whether (x, z) is held at a bridge's end.
    atDeck(x, z) {
      return of(x, z).some((zone) => zone.bridge && zone.at(x, z));
    },
    near(x, z, r) {
      for (const dx of [-r, r]) for (const dz of [-r, r]) if (of(x + dx, z + dz).some(({ box: b }) => x + r >= b.x0 && x - r <= b.x1 && z + r >= b.z0 && z - r <= b.z1)) return true;
      return false;
    },
  };
}
