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
// array itself) → its height above the sea, for those on a bridge or in a tunnel. `open` counts the
// tunnels found open to the sky under a deck, and made `under`.
//
// The heights of what's off the ground: a bridge's deck, and a tunnel's road. Each runs straight
// between the ground where it ends: the LiDAR's ground is the bare earth, which has what's under a
// deck and over a tunnel, not the deck or the tunnel's road. A bridge or a tunnel the map draws as
// several ways is taken whole: its ends are where it meets nothing more of its kind, or a street on
// the ground, and each point between is as high as its two nearest ends make it, by how far it is
// from each along the way. A tunnel's end is at its mouth, where the ground is the cutting's floor:
// the lowest of the ground there and out from it, up to 4 m. Then a tunnel whose ground stays within
// 2.5 m of its road is open to the sky, under a bridge's deck only: `under`.
//
// The ground at the ends is `grid`'s, by default the LiDAR's: world.mjs gives it the ground as the
// tiles hold it, which a street on the ground takes, so a deck and the street it meets are at one
// height there (task 040).
export function streetLines(base, ground, near, grid = ground.at) {
  const lines = [];
  for (const e of base.elements) {
    if (!isLine(e)) continue;
    const t = e.tags, pts = e.geometry.map(P);
    if (!pts.some(([x, z]) => near(x, z, 50)) || isSquare(e, pts)) continue;
    lines.push({ id: e.id, k: t.railway ? 9 : LINE[t.highway], w: t.railway ? 4 : carriageway(t), pts, nodes: e.nodes, t, level: levelOf(t) });
  }
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
      const out = level === LEVEL.tunnel ? Math.min(...[1, 2, 3, 4, 5, 6, 7, 8].map((k) => grid(x + ((x - px) / d) * k * 0.5, z + ((z - pz) / d) * k * 0.5))) : Infinity;
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
      const [a, b] = got, y = !b ? ends[a.e].y : (ends[a.e].y * b.d + ends[b.e].y * a.d) / (a.d + b.d || 1);
      for (const p of all.get(n)) heights.set(p, y);
    }
    for (const l of ways) for (const p of l.pts) if (!heights.has(p)) heights.set(p, ground.at(...p));
  }
  let open = 0;
  for (const l of lines) {
    if (l.level !== LEVEL.tunnel) continue;
    if (l.pts.every((p) => !heights.has(p) || ground.at(...p) - heights.get(p) < 2.5)) { l.level = LEVEL.under; open++; }
  }
  return { lines, heights, open };
}
