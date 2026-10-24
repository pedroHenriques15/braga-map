// The road graph a game routes on (task 107): every street and path in the open world's area, each
// way split at its junctions and cut where it crosses the area's edge, with who may use each stretch
// and which way a car may drive it; and the turns the map bans cars. The lines the tiles carry are
// for drawing: thinned, cut at each tile's edge, and with no junctions, so a game couldn't route on
// them without making this again.
import { P } from './geo.mjs';
import { carsMay, driven, openThin } from './osm.mjs';
import { levelOf, PATH_K } from './lines.mjs';

// The paths a stretch can be, as a gate has them (lines.mjs's PATH_K), a bridleway a path.
const PATH_OF = { footway: 'footway', path: 'path', bridleway: 'path', cycleway: 'cycleway', steps: 'steps' };
const NO = new Set(['no', 'private']);

// lines: lines.mjs's streetsOf (the streets and the railway), with `heights` (levelHeights': a deck's
// and a tunnel's at each point); paths: OpenStreetMap's footways, paths, cycleways, bridleways and
// steps (fetch.mjs's paths.json, moved with the streets by onCarriageways), every one, the streets'
// own too (a pavement the map draws, a crossing), as they join the paths to the streets; walks:
// lines.mjs's pathLines, for a footbridge's and a path's tunnel's heights (ys); restrictions:
// restrictions.json's elements; inArea(x, z): inside the open world's area; ground(x, z), elev0.
//
// Returns { roads, turns, stats }. Each road { k, car, foot, oneway, ring, level, name, w, pts, ys }: k the
// street's kind (osm.mjs's LINE, 0 to 8) or the path's (PATH_K, 10 to 13); car and foot, who may use
// it; oneway, a car only the way its points go (a street one-way against the way it's drawn is
// turned round); ring, part of a roundabout; level (lines.mjs's LEVEL); its name or null; w its width, kerb to kerb; pts, its
// junctions or ends first and last, thinned to 0.8 m; ys, on a deck or in a tunnel, each point's
// height above elev0. Each turn { at, from, to }: at a junction, a car arriving from the point `from`
// (the one before the junction on the stretch it's on) may not leave towards `to` (the one after it
// on the stretch it'd take), as the map bans; the `only_` turns made into bans of every other.
export function roadsOf({ lines, paths, walks = [], heights = new Map(), restrictions = [], inArea, ground, elev0 = 0 }) {
  const ways = [];
  for (const l of lines) {
    if (l.k > 8 || !l.nodes || l.nodes.length !== l.pts.length) continue;
    const t = l.t;
    const car = l.k !== 6 ? carsMay(t) : ['yes', 'destination', 'designated'].includes(t.motor_vehicle ?? t.motorcar);
    const foot = t.foot ? !NO.has(t.foot) : !/motorway/.test(t.highway);
    if (!car && !foot) continue;
    const up = l.level === 1 || l.level === 2;
    ways.push({ id: l.id, k: l.k, car, foot, dir: car ? driven(t) : 0, ring: t.junction === 'roundabout' || t.junction === 'circular', level: l.level, name: t.name ?? null, w: l.w, nodes: l.nodes, pts: l.pts, ys: up ? l.pts.map((p) => (heights.get(p) ?? ground(...p)) - elev0) : null });
  }
  const walked = new Map(walks.map((p) => [p.id, p]));
  for (const e of paths) {
    const t = e.tags ?? {}, kind = PATH_OF[t.highway];
    if (e.type !== 'way' || !kind || !e.nodes || e.nodes.length < 2) continue;
    if ((t.indoor && t.indoor !== 'no') || (t.level != null && t.level !== '0')) continue;
    if (t.foot ? NO.has(t.foot) : NO.has(t.access)) continue;
    const w = walked.get(e.id), pts = w?.nodes?.length === e.nodes.length ? w.pts : e.geometry.map(P);
    const level = levelOf(t), up = level === 1 || level === 2;
    ways.push({ id: e.id, k: PATH_K[kind], car: false, foot: true, dir: 0, ring: false, level, name: t.name ?? null, w: w?.w ?? 2, nodes: e.nodes, pts, ys: up ? (w?.ys ?? pts.map((p) => ground(...p) - elev0)) : null });
  }

  // Where each node is: a street's place for it first (the paths move with the streets they end on,
  // but a node must be one point to every way through it). A junction is a node two ways share, or
  // one a way passes twice.
  const at = new Map(), uses = new Map();
  for (const w of ways) w.nodes.forEach((n, i) => {
    if (!at.has(n)) at.set(n, w.pts[i]);
    uses.set(n, (uses.get(n) ?? 0) + 1);
  });

  // Each way in stretches from junction to junction, and the parts of each in the area: cut where it
  // crosses the edge, a dead end there.
  const stretches = [];
  const cross = (a, b) => {
    // a inside, b out: the edge between them, halved till it's within 5 cm.
    let lo = 0, hi = 1;
    while ((hi - lo) * Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.05) {
      const m = (lo + hi) / 2;
      if (inArea(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m)) lo = m;
      else hi = m;
    }
    return [a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo];
  };
  for (const w of ways) {
    const pts = w.nodes.map((n, i) => at.get(n) ?? w.pts[i]);
    let run = null;
    const flush = () => {
      if (run && run.pts.length > 1) stretches.push({ way: w, ...run });
      run = null;
    };
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], n = w.nodes[i], y = w.ys?.[i] ?? null;
      if (!inArea(...p)) {
        if (run) {
          run.pts.push(cross(pts[i - 1], p));
          run.ys?.push(y);
          run.nodes.push(null);
        }
        flush();
        continue;
      }
      if (!run) {
        run = { pts: [], ys: w.ys ? [] : null, nodes: [] };
        if (i > 0) {
          run.pts.push(cross(p, pts[i - 1]));
          run.ys?.push(y);
          run.nodes.push(null);
        }
      }
      run.pts.push(p);
      run.ys?.push(y);
      run.nodes.push(n);
      if (i > 0 && i < pts.length - 1 && uses.get(n) > 1) {
        flush();
        run = { pts: [p], ys: w.ys ? [y] : null, nodes: [n] };
      }
    }
    flush();
  }

  // Thinned, keeping the ends, and a car's one-way turned to run the way its points go.
  const roads = [];
  const ends = new Map(); // node -> [{ road, start }]
  for (const s of stretches) {
    const w = s.way;
    const kept = new Set(openThin(s.pts, 0.8));
    let idx = s.pts.map((p, i) => (kept.has(p) ? i : -1)).filter((i) => i >= 0);
    if (w.dir < 0) idx = idx.reverse();
    const road = { k: w.k, car: w.car, foot: w.foot, oneway: w.dir !== 0, ring: w.ring, level: w.level, name: w.name, w: w.w, pts: idx.map((i) => s.pts[i]), ys: s.ys ? idx.map((i) => s.ys[i]) : null, way: w.id };
    roads.push(road);
    const first = s.nodes[idx[0]], last = s.nodes[idx[idx.length - 1]];
    for (const [n, start] of [[first, true], [last, false]]) {
      if (n == null) continue;
      if (!ends.has(n)) ends.set(n, []);
      ends.get(n).push({ road, start });
    }
  }

  // The turns the map bans cars, from one way onto another at a node (`only_` ones ban every other
  // turn from that way there), for any hour: as plain bans, from the point before the junction to the
  // one after it. A U-turn ban from a way back onto itself is kept for turning back, not for going on
  // along it (as tools/track.mjs's `banned`).
  const turns = [];
  let viaWay = 0;
  const near = (e) => (e.start ? e.road.pts[1] : e.road.pts[e.road.pts.length - 2]);
  const arrives = (e) => e.road.car && (!e.start || !e.road.oneway);
  const leaves = (e) => e.road.car && (e.start || !e.road.oneway);
  const bent = (p, j, q) => {
    const ux = j[0] - p[0], uz = j[1] - p[1], vx = q[0] - j[0], vz = q[1] - j[1];
    return Math.abs(Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz));
  };
  const seen = new Set();
  for (const r of restrictions) {
    const t = r.tags || {}, kind = t['restriction:motorcar'] ?? t['restriction:motor_vehicle'] ?? t.restriction;
    if (r.type !== 'relation' || !kind || /\b(motorcar|motor_vehicle)\b/.test(t.except || '')) continue;
    const role = (k) => r.members.filter((m) => m.role === k);
    const via = role('via');
    if (via.length !== 1 || via[0].type !== 'node') {
      if (via.length) viaWay++;
      continue;
    }
    const j = via[0].ref, here = ends.get(j);
    if (!here) continue;
    const from = new Set(role('from').map((m) => m.ref)), to = new Set(role('to').map((m) => m.ref));
    const only = kind.startsWith('only_'), uturn = kind === 'no_u_turn', J = at.get(j);
    for (const f of here.filter((e) => from.has(e.road.way) && arrives(e))) {
      for (const g of here.filter(leaves)) {
        const P0 = near(f), Q = near(g);
        const ban = only ? !to.has(g.road.way) : to.has(g.road.way) && (!(uturn && f.road.way === g.road.way) || g === f || bent(P0, J, Q) > Math.PI / 2);
        const key = `${J}|${P0}|${Q}`;
        if (!ban || seen.has(key)) continue;
        seen.add(key);
        turns.push({ at: J, from: P0, to: Q });
      }
    }
  }
  const stats = { roads: roads.length, car: roads.filter((r) => r.car).length, oneway: roads.filter((r) => r.oneway).length, foot: roads.filter((r) => r.foot).length, junctions: [...ends.values()].filter((e) => e.length > 1).length, turns: turns.length, viaWay };
  return { roads, turns, stats };
}
