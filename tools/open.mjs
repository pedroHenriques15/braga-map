// The open world's area (task 032, decision 019): the Volta dos Amigos' and about 150 m round it,
// where a game lets the player drive anywhere. Its edge runs where a player would take it for one,
// half way between the streets in it and those out of it, along the backs of the buildings between
// them, and crosses each street that leaves it square, just past the mouth of the junction it leaves
// from: a game stands road-works barriers there ("Estrada cortada", the owner's answer), the gates.
//
// node tools/open.mjs
//
// works the edge out from OpenStreetMap's streets and buildings (fetch.mjs's osm/base.json and
// osm/buildings.json, and those the LiDAR found, roofs.json) and writes it to tools/open.json, which
// sections.mjs reads as OPEN, for world.mjs, the map page (build.mjs) and the games. Run it again only
// to move the edge, then world.mjs and build.mjs.
//
// How. Round the loop, every point within R_IN of it, and what that closes round (the loop's inside,
// and a pocket narrower than 2·POCKET between two of its arms), is near it. Every street that comes
// near is in, from junction to junction, as far as REACH past it, or to its next junction if that's
// within LAST more; so is every street between two junctions that are in, a street too short to
// stand a barrier on between one that is and the next junction, and the whole of a roundabout any of
// it is in. A street leaving is in for a few metres past the junction it leaves from, past where its
// kerbs turn the corner (further off a roundabout, past where its exit's two ways splay apart), and
// out from there. The area is every point nearer a street in than a street out and within CAP of
// one, or within LOOP of the loop: its edge runs half way between the streets in and those out, and
// across a street square where it's cut. A building it would cut goes in or out whole, as most of it
// is, so the edge runs round it, along its back or its side. Worked out on a grid of 1 m, drawn
// round, straightened, and then made to cross each street square, straight across its width.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { P, readCache, ROOT } from './geo.mjs';
import { carriageway, footprints, Grid, inside, LINE, ringOf, simplify } from './osm.mjs';
import { isSquare, LEVEL } from './lines.mjs';

export const FILE = path.join(ROOT, 'tools/open.json');

// ---- The gates ----

// Where the streets cross a ring `pts`: each crossing's point, the street's way there (ux, uz), the
// ring's side it's on (e, from pts[e] to the next) and how far along (u), and the street's line and
// stretch (from its point i, t of the way to the next). lines: [{ k, w, pts }]; the railway (k 9)
// isn't a street.
function crossings(pts, lines) {
  const n = pts.length, C = 50, sides = new Grid(C), out = [];
  const cells = ([ax, az], [bx, bz], f) => { for (let gx = Math.floor(Math.min(ax, bx) / C); gx <= Math.floor(Math.max(ax, bx) / C); gx++) for (let gz = Math.floor(Math.min(az, bz) / C); gz <= Math.floor(Math.max(az, bz) / C); gz++) f(gx * C + C / 2, gz * C + C / 2); };
  for (let e = 0; e < n; e++) cells(pts[e], pts[(e + 1) % n], (x, z) => sides.add(x, z, e));
  for (const l of lines) {
    if (l.k > 8) continue;
    for (let i = 1; i < l.pts.length; i++) {
      const [px, pz] = l.pts[i - 1], [qx, qz] = l.pts[i], dx = qx - px, dz = qz - pz, L = Math.hypot(dx, dz), seen = new Set();
      if (!L) continue;
      cells(l.pts[i - 1], l.pts[i], (cx, cz) => {
        for (const e of sides.near(cx, cz, 0)) {
          if (seen.has(e)) continue;
          seen.add(e);
          const [ax, az] = pts[e], [bx, bz] = pts[(e + 1) % n], ex = bx - ax, ez = bz - az, den = dx * ez - dz * ex;
          if (!den) continue;
          // Each counting a crossing at its first point and not its last.
          const t = ((ax - px) * ez - (az - pz) * ex) / den, u = ((ax - px) * dz - (az - pz) * dx) / den;
          if (t < 0 || t >= 1 || u < 0 || u >= 1) continue;
          out.push({ x: px + dx * t, z: pz + dz * t, ux: dx / L, uz: dz / L, e, u, l, i: i - 1, t });
        }
      });
    }
  }
  return out;
}

// How far a side of the ring at (ex, ez) crosses a street going (ux, uz) from square, in degrees.
const offSquare = (ux, uz, ex, ez) => Math.abs(90 - (Math.acos(Math.min(1, Math.abs(ux * ex + uz * ez) / Math.hypot(ex, ez))) * 180) / Math.PI);

// Where the streets cross the edge `pts`: each street's crossing, with which way the street leaves
// (heading: (cos, sin) points out of the area, x east and z south), its width kerb to kerb, its kind
// (osm.mjs's LINE), its level (lines.mjs's LEVEL, by name) and how far it crosses from square, in
// degrees (off). lines: [{ k, w, pts, level }], the level by number or name. y(line, i, t), if given,
// is the street's height where it crosses, t of the way from its point i to i + 1.
export function gatesOf(pts, lines, y) {
  const names = Object.keys(LEVEL), n = pts.length;
  return crossings(pts, lines).map(({ x, z, ux, uz, e, l, i, t }) => {
    const s = inside(pts, x + ux * 0.05, z + uz * 0.05) ? -1 : 1, [ax, az] = pts[e], [bx, bz] = pts[(e + 1) % n];
    const g = { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, heading: Math.round(Math.atan2(uz * s, ux * s) * 1000) / 1000, w: Math.round(l.w * 10) / 10, k: l.k, level: typeof l.level === 'number' ? names[l.level] : l.level, off: Math.round(offSquare(ux, uz, bx - ax, bz - az)) };
    if (y) g.y = Math.round(y(l, i, t) * 10) / 10;
    return g;
  });
}

// The ring `pts` made to cross each street in `lines` square: within its half width and SPAN of its
// middle either side, the edge runs straight across it, at right angles. Two streets crossing it side
// by side, the same way (a road's two carriageways), are crossed by one straight piece. Where
// straightening would make the ring cross itself, it's left. Returns the new ring, and how many
// crossings were left as they were.
const SPAN = 2;
function square(pts, lines) {
  let left = 0;
  for (let round = 0; round < 12; round++) {
    // Starting from the point furthest from any crossing, so no crossing straddles the ring's start.
    let xs = crossings(pts, lines);
    if (!xs.length) break;
    let far = 0, fd = -1;
    for (let k = 0; k < pts.length; k++) { const d = Math.min(...xs.map((c) => Math.hypot(c.x - pts[k][0], c.z - pts[k][1]))); if (d > fd) { fd = d; far = k; } }
    pts = [...pts.slice(far), ...pts.slice(0, far)];
    xs = crossings(pts, lines).filter((c) => offSquare(c.ux, c.uz, pts[(c.e + 1) % pts.length][0] - pts[c.e][0], pts[(c.e + 1) % pts.length][1] - pts[c.e][1]) > 1);
    if (!xs.length) break;
    xs.sort((a, b) => a.e - b.e || a.u - b.u);
    // Side by side and the same way: one group.
    const groups = [];
    for (const c of xs) {
      const g = groups[groups.length - 1], last = g?.[g.length - 1];
      if (last && Math.hypot(c.x - last.x, c.z - last.z) < c.l.w / 2 + last.l.w / 2 + 2 * SPAN + 4 && Math.abs(c.ux * last.ux + c.uz * last.uz) > 0.87) g.push(c);
      else groups.push([c]);
    }
    left = 0;
    // From the ring's end back, so each change leaves the points before it where they were.
    for (let gi = groups.length - 1; gi >= 0; gi--) {
      const g = groups[gi];
      let ux = 0, uz = 0, cx = 0, cz = 0;
      for (const c of g) { const s = c.ux * g[0].ux + c.uz * g[0].uz < 0 ? -1 : 1; ux += c.ux * s; uz += c.uz * s; cx += c.x / g.length; cz += c.z / g.length; }
      const L = Math.hypot(ux, uz);
      ux /= L; uz /= L;
      const nx = -uz, nz = ux;
      let lo = Infinity, hi = -Infinity;
      for (const c of g) { const p = (c.x - cx) * nx + (c.z - cz) * nz, h = c.l.w / 2 + SPAN; lo = Math.min(lo, p - h); hi = Math.max(hi, p + h); }
      const inZone = ([x, z]) => { const a = (x - cx) * ux + (z - cz) * uz, b = (x - cx) * nx + (z - cz) * nz; return Math.abs(a) < 8 && b > lo - 0.5 && b < hi + 0.5; };
      // The points to replace: those after the first crossing's side starts and up to the last's end,
      // and those either side of them still in the zone.
      let i0 = g[0].e, i1 = g[g.length - 1].e + 1;
      while (i0 > 0 && inZone(pts[i0])) i0--;
      while (i1 < pts.length - 1 && inZone(pts[i1])) i1++;
      const prev = pts[i0], next = pts[i1], A = [cx + nx * lo, cz + nz * lo], B = [cx + nx * hi, cz + nz * hi];
      const piece = (prev[0] - cx) * nx + (prev[1] - cz) * nz < (next[0] - cx) * nx + (next[1] - cz) * nz ? [A, B] : [B, A];
      const ring = [...pts.slice(0, i0 + 1), ...piece, ...pts.slice(i1)];
      // The three new sides mustn't cross any other.
      const path = [prev, ...piece, next];
      let bad = false;
      for (let s = 0; s + 1 < path.length && !bad; s++) {
        const [p, q] = [path[s], path[s + 1]];
        for (let k = 0; k < ring.length && !bad; k++) {
          if (k >= i0 - 1 && k <= i0 + 3) continue;
          const a = ring[k], b = ring[(k + 1) % ring.length];
          const d1 = (q[0] - p[0]) * (a[1] - p[1]) - (q[1] - p[1]) * (a[0] - p[0]), d2 = (q[0] - p[0]) * (b[1] - p[1]) - (q[1] - p[1]) * (b[0] - p[0]);
          const d3 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d4 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
          if (d1 * d2 < 0 && d3 * d4 < 0) bad = true;
        }
      }
      if (bad) { left += g.length; continue; }
      pts = ring;
    }
  }
  return { pts, left };
}

// ---- Working the edge out ----

const R_IN = 120, POCKET = 150, REACH = 120, LAST = 30, CAP = 60, LOOP = 105, OFF_RING = 12;
// How far from its junction a street leaving is cut: past the corner its kerb turns (streets.mjs's
// R_KERB, by the kinds in osm.mjs's LINE) and the widest street's half, and a metre more.
const R_KERB = [10, 8, 8, 7, 6, 5, 3, 3, 3];
// What the area takes in besides the loop, as if the loop passed there: the Picoto's top, its
// viewpoint and its cross, with the road round the summit (the owner's answer, task 032).
export const TAKE_IN = [{ what: "the Picoto's top", x: 648, z: 1482 }];

// The edge round `loop` ([x, z] points, closed) and `places` ([{ x, z }], taken in as if the loop
// passed there), from `base` (fetch.mjs's osm/base.json) and the buildings' outlines (`buildings`,
// rings of [x, z]): a ring of points, the area on the right going round it (x east, z south).
export function work({ base, buildings = [], loop, places = [], log = console.log }) {
  // The grid, 1 m a cell, round the loop.
  const lb = { x0: Math.min(...loop.map((p) => p[0])), x1: Math.max(...loop.map((p) => p[0])), z0: Math.min(...loop.map((p) => p[1])), z1: Math.max(...loop.map((p) => p[1])) };
  const M = R_IN + POCKET + REACH + CAP + 50, X0 = Math.floor(lb.x0 - M), Z0 = Math.floor(lb.z0 - M), NX = Math.ceil(lb.x1 + M) - X0, NZ = Math.ceil(lb.z1 + M) - Z0, N = NX * NZ;
  const cellOf = (x, z) => { const i = Math.floor(x - X0), j = Math.floor(z - Z0); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : j * NX + i; };
  // Marks a line's cells, a point every half metre.
  const stroke = (mask, pts) => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) * 2));
      for (let f = 0; f <= n; f++) { const c = cellOf(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n); if (c >= 0) mask[c] = 1; }
    }
  };
  // The squared distance from every cell to the nearest one marked `on` (Felzenszwalb and
  // Huttenlocher's: down each column, then along each row).
  const edt = (mask, on = 1) => {
    const L = Math.max(NX, NZ), d = new Float64Array(N), f = new Float64Array(L), g = new Float64Array(L), v = new Int32Array(L), zz = new Float64Array(L + 1);
    const pass = (n) => {
      let k = 0;
      v[0] = 0; zz[0] = -Infinity; zz[1] = Infinity;
      for (let q = 1; q < n; q++) {
        let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= zz[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
        k++; v[k] = q; zz[k] = s; zz[k + 1] = Infinity;
      }
      k = 0;
      for (let q = 0; q < n; q++) { while (zz[k + 1] < q) k++; g[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    };
    for (let i = 0; i < NX; i++) { for (let j = 0; j < NZ; j++) f[j] = mask[j * NX + i] === on ? 0 : 1e10; pass(NZ); for (let j = 0; j < NZ; j++) d[j * NX + i] = g[j]; }
    for (let j = 0; j < NZ; j++) { for (let i = 0; i < NX; i++) f[i] = d[j * NX + i]; pass(NX); for (let i = 0; i < NX; i++) d[j * NX + i] = g[i]; }
    return d;
  };
  const grow = (a, r) => { const d = edt(a, 1), o = new Uint8Array(N); for (let c = 0; c < N; c++) o[c] = d[c] <= r * r ? 1 : 0; return o; };
  const shrink = (a, r) => { const d = edt(a, 0), o = new Uint8Array(N); for (let c = 0; c < N; c++) o[c] = d[c] > r * r ? 1 : 0; return o; };
  // The piece of a mask the loop starts in, its holes filled.
  const piece = (a) => {
    const seed = cellOf(...loop[0]), keep = new Uint8Array(N), out = new Uint8Array(N);
    if (!a[seed]) throw new Error('the loop starts outside the area');
    const flood = (mark, ok, starts) => {
      const st = starts.filter((c) => ok(c));
      for (const c of st) mark[c] = 1;
      while (st.length) {
        const c = st.pop(), i = c % NX;
        for (const q of [i > 0 ? c - 1 : -1, i < NX - 1 ? c + 1 : -1, c - NX, c + NX]) if (q >= 0 && q < N && !mark[q] && ok(q)) { mark[q] = 1; st.push(q); }
      }
    };
    flood(keep, (c) => a[c] === 1, [seed]);
    const border = [];
    for (let i = 0; i < NX; i++) border.push(i, (NZ - 1) * NX + i);
    for (let j = 0; j < NZ; j++) border.push(j * NX, j * NX + NX - 1);
    flood(out, (c) => !keep[c], border);
    for (let c = 0; c < N; c++) keep[c] = out[c] ? 0 : 1;
    return keep;
  };

  // Near the loop: within R_IN of it, and what that closes round.
  const loopMask = new Uint8Array(N);
  stroke(loopMask, [...loop, loop[0]]);
  for (const { x, z } of places) stroke(loopMask, [[x, z], [x, z]]);
  const dLoop = edt(loopMask);
  let near = new Uint8Array(N);
  for (let c = 0; c < N; c++) near[c] = dLoop[c] <= R_IN * R_IN ? 1 : 0;
  near = piece(shrink(grow(near, POCKET), POCKET));
  const dNear = edt(near);
  const nearAt = (x, z) => { const c = cellOf(x, z); return c < 0 ? Infinity : Math.sqrt(dNear[c]); };

  // The streets on the ground and over it, from junction to junction. A tunnel is under the ground,
  // so not where the edge runs above it (it still gets its gate).
  const ways = [];
  for (const e of base.elements) {
    if (e.type !== 'way' || LINE[e.tags?.highway] == null) continue;
    const t = e.tags, pts = e.geometry.map(P);
    if (isSquare(e, pts) || !pts.some(([x, z]) => cellOf(x, z) >= 0)) continue;
    if (t.tunnel && t.tunnel !== 'no' && t.tunnel !== 'building_passage') continue;
    ways.push({ k: LINE[t.highway], w: carriageway(t), pts, nodes: e.nodes, ring: t.junction === 'roundabout' || t.junction === 'circular' });
  }
  const uses = new Map();
  for (const w of ways) w.nodes.forEach((n, i) => uses.set(n, (uses.get(n) ?? 0) + (i === 0 || i === w.nodes.length - 1 ? 2 : 1)));
  const edges = [];
  for (const w of ways) {
    let from = 0;
    for (let i = 1; i < w.nodes.length; i++) {
      if (i < w.nodes.length - 1 && uses.get(w.nodes[i]) < 2) continue;
      edges.push({ a: w.nodes[from], b: w.nodes[i], pts: w.pts.slice(from, i + 1), k: w.k, w: w.w, ring: w.ring });
      from = i;
    }
  }
  // Each one's points every metre or less, how far along it each is and how far past near.
  for (const e of edges) {
    const s = [];
    let along = 0;
    for (let i = 1; i < e.pts.length; i++) {
      const [ax, az] = e.pts[i - 1], [bx, bz] = e.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L));
      for (let f = i === 1 ? 0 : 1; f <= n; f++) { const x = ax + ((bx - ax) * f) / n, z = az + ((bz - az) * f) / n; s.push({ x, z, along: along + (L * f) / n, d: nearAt(x, z) }); }
      along += L;
    }
    Object.assign(e, { s, len: along, min: Math.min(...s.map((p) => p.d)), max: Math.max(...s.map((p) => p.d)) });
  }
  const at = new Map(); // node → its edges
  for (const e of edges) for (const n of [e.a, e.b]) { if (!at.has(n)) at.set(n, []); at.get(n).push(e); }
  // Each roundabout's ring, all its stretches: never cut, so either it's all in or none of it is.
  const rings = new Map(); // a stretch of a ring → all of its ring
  for (const e of edges) {
    if (!e.ring || rings.has(e)) continue;
    const ring = new Set([e]), todo = [e];
    while (todo.length) for (const n of [todo[0].a, todo.shift().b]) for (const f of at.get(n)) if (f.ring && !ring.has(f)) { ring.add(f); todo.push(f); }
    for (const f of ring) rings.set(f, [...ring]);
  }

  // What's in: the streets that come near, whole if they reach no further than REACH past it or
  // their next junction is within LAST more, else as far as REACH.
  const inE = new Set(), all = new Set(), inN = new Set();
  for (const e of edges) {
    if (e.min > 0) continue;
    inE.add(e);
    if (e.s.filter((p) => p.d > REACH).length <= LAST) all.add(e);
    for (const [n, p] of [[e.a, e.s[0]], [e.b, e.s[e.s.length - 1]]]) if (all.has(e) || p.d <= REACH) inN.add(n);
  }
  // Off a roundabout, further: past where its exit's two ways splay apart.
  const cutAt = (n) => {
    const mine = at.get(n).filter((e) => inE.has(e));
    return Math.max(...mine.map((e) => e.w / 2)) + Math.max(...mine.map((e) => R_KERB[e.k])) + 1 + (mine.some((e) => e.ring) ? OFF_RING : 0);
  };
  const take = (e) => { inE.add(e); all.add(e); inN.add(e.a); inN.add(e.b); };
  for (let changed = true; changed; ) {
    changed = false;
    for (const e of edges) {
      if (all.has(e)) continue;
      const ia = inN.has(e.a), ib = inN.has(e.b);
      if (e.ring && (ia || ib || inE.has(e))) { for (const f of rings.get(e)) take(f); changed = true; }
      else if (!inE.has(e) && e.max <= REACH + LAST && ((ia && ib) || ((ia || ib) && e.len < cutAt(ia ? e.a : e.b) + 8))) { take(e); changed = true; }
    }
  }
  // Each street's points, in or out.
  const featIn = new Uint8Array(N), featOut = new Uint8Array(N);
  let cuts = 0;
  for (const e of edges) {
    const ca = inN.has(e.a) && !inE.has(e) ? cutAt(e.a) : -1, cb = inN.has(e.b) && !inE.has(e) ? cutAt(e.b) : -1;
    cuts += (ca >= 0) + (cb >= 0) + (inE.has(e) && !all.has(e));
    for (let i = 1; i < e.s.length; i++) {
      const p = e.s[i], q = e.s[i - 1], mid = (p.along + q.along) / 2;
      const on = all.has(e) || (inE.has(e) ? (p.d + q.d) / 2 <= REACH : mid <= ca || e.len - mid <= cb);
      stroke(on ? featIn : featOut, [[q.x, q.z], [p.x, p.z]]);
    }
  }
  // Where a street in and a street out cross (one over the other), the cell is out.
  for (let c = 0; c < N; c++) if (featIn[c] && featOut[c]) featIn[c] = 0;
  const dIn = edt(featIn), dOut = edt(featOut);

  // The area.
  let area = new Uint8Array(N);
  for (let c = 0; c < N; c++) area[c] = (dIn[c] < dOut[c] && (dIn[c] <= CAP * CAP || near[c])) || dLoop[c] <= LOOP * LOOP ? 1 : 0;
  // A building it would cut is in or out whole, as most of it is, so the edge goes round it: along
  // its back or its side, as a wall would. But for what's within LOOP of the loop, and the streets.
  let moved = 0;
  for (const ring of buildings) {
    const cells = [];
    let z0 = Infinity, z1 = -Infinity;
    for (const [, z] of ring) { z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let j = Math.max(0, Math.floor(z0 - Z0)); j <= Math.min(NZ - 1, Math.ceil(z1 - Z0)); j++) {
      const zc = Z0 + j + 0.5, xs = [];
      for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
        const [xa, za] = ring[a], [xb, zb] = ring[b];
        if ((za > zc) !== (zb > zc)) xs.push(xa + ((zc - za) * (xb - xa)) / (zb - za));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil(xs[k] - X0 - 0.5)); i <= Math.min(NX - 1, Math.floor(xs[k + 1] - X0 - 0.5)); i++) cells.push(j * NX + i);
    }
    const n = cells.reduce((s, c) => s + area[c], 0);
    if (!n || n === cells.length) continue;
    const v = n * 2 >= cells.length ? 1 : 0;
    for (const c of cells) if (dLoop[c] > LOOP * LOOP && !featIn[c] && !featOut[c]) area[c] = v;
    moved++;
  }
  area = piece(area);
  // No two cells of it meet only at a corner: a cell beside them joins them, so that its outline never
  // touches itself.
  const on = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ && area[j * NX + i] === 1;
  for (let again = true; again; ) {
    again = false;
    for (let j = 1; j < NZ; j++) for (let i = 1; i < NX; i++) {
      const nw = on(i - 1, j - 1), ne = on(i, j - 1), sw = on(i - 1, j), se = on(i, j);
      if ((nw && se && !ne && !sw) || (ne && sw && !nw && !se)) { area[(j - 1) * NX + i] = area[(j - 1) * NX + i - 1] = 1; again = true; }
    }
  }

  // Drawn round: along the cells' sides from the top left corner of its first cell, east, the area
  // always on the right, then straightened.
  let si = -1, sj = -1;
  for (let c = 0; c < N && si < 0; c++) if (area[c]) { si = c % NX; sj = (c / NX) | 0; }
  // Facing east, south, west or north from a corner (i, j): the cells left and right of the side ahead.
  const DX = [1, 0, -1, 0], DZ = [0, 1, 0, -1];
  const LEFT = [[0, -1], [0, 0], [-1, 0], [-1, -1]], RIGHT = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
  const side = (i, j, d) => on(i + RIGHT[d][0], j + RIGHT[d][1]) && !on(i + LEFT[d][0], j + LEFT[d][1]);
  const corners = [];
  let ci = si, cj = sj, dir = 0;
  do {
    corners.push([X0 + ci, Z0 + cj]);
    ci += DX[dir]; cj += DZ[dir];
    dir = [(dir + 1) % 4, dir, (dir + 3) % 4].find((d) => side(ci, cj, d));
    if (dir == null) throw new Error(`the outline stops at ${X0 + ci}, ${Z0 + cj}`);
  } while (ci !== si || cj !== sj);
  const { pts, left } = square(simplify(corners, 1), ways);

  log(`streets: ${edges.length} from junction to junction, ${inE.size} in, ${cuts} cut where they leave; ${moved} buildings the edge goes round; ${left} crossings left as they were`);
  return pts.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
}

// ---- On its own ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = Date.now();
  const { default: amigos } = await import('../tracks/amigos.js');
  const buildings = [...footprints(readCache('osm/buildings.json')).map(ringOf), ...(readCache('roofs.json').found ?? []).map((f) => f.pts)];
  const pts = work({ base: readCache('osm/base.json'), buildings, loop: amigos.points.map(({ p }) => [p[0], p[2]]), places: TAKE_IN });
  fs.writeFileSync(FILE, JSON.stringify({ about: "The open world's edge (task 032), made by tools/open.mjs from OpenStreetMap: run that again rather than editing it. © OpenStreetMap contributors (ODbL).", pts }) + '\n');
  console.log(`the edge: ${pts.length} points, in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(ROOT, FILE)}`);
}
