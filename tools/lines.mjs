// The streets and the railway as OpenStreetMap has them, for world.mjs and streets.mjs: each way's
// kind, its width kerb to kerb, its points, nodes and tags, and its level; and the height of each
// point that's off the ground, on a bridge's deck or a tunnel's road.
import { P } from './geo.mjs';
import { carriageway, LINE } from './osm.mjs';

// Each street's level: on the ground; on a bridge; in a tunnel, under the ground's surface; or
// under something at the ground's own level, open either side: a building over it (a passage, or
// `covered`), or a bridge's deck (where the map draws the stretch under a bridge as a tunnel).
export const LEVEL = { ground: 0, bridge: 1, tunnel: 2, under: 3 };
const on = (v) => v != null && v !== 'no';
const levelOf = (t) => (on(t.bridge) ? LEVEL.bridge : t.tunnel === 'building_passage' || (on(t.covered) && !on(t.tunnel)) ? LEVEL.under : on(t.tunnel) ? LEVEL.tunnel : LEVEL.ground);

// A way that's a street or the railway, as a line; a pedestrian area isn't one (it's a square).
export const isLine = (e) => e.type === 'way' && (LINE[e.tags?.highway] != null || !!e.tags?.railway);
export const isSquare = (e, pts) => e.tags.highway === 'pedestrian' && (e.tags.area === 'yes' || (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]));

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
// its ends, 30 cm or more over the straight line, the deck's height there.
export function levelHeights(lines, ground, grid = ground.at, held = null, deck = null) {
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
      return { n, y: Math.min(grid(x, z), out) };
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
// `ends`, the meetings held; `at(x, z)`, the ground there where it's held, or undefined;
// `near(x, z, r)`, whether any of it is within r of (x, z).
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
    return { box, at };
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
    near(x, z, r) {
      for (const dx of [-r, r]) for (const dz of [-r, r]) if (of(x + dx, z + dz).some(({ box: b }) => x + r >= b.x0 && x - r <= b.x1 && z + r >= b.z0 && z - r <= b.z1)) return true;
      return false;
    },
  };
}
