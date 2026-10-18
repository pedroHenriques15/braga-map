// The streets' name plates (task 042): at every corner where a named street meets a street of
// another name, its plate, on the corner building's wall along it where a building stands at the
// corner, within 3 m of both kerbs, as most of Braga's are; else on a post at the kerb (the owner's
// answer). A street "begins" at each of its junctions, so a corner building carries the names of both
// its streets, one on each wall, as Braga's do.
import { Grid, inside } from './osm.mjs';
import { LEVEL } from './lines.mjs';

// A plate's size in metres, as the game draws it: blue-and-white, as long as the longest names need.
export const PLATE = { w: 1.2, h: 0.3 };
// How high a plate's bottom stands over the pavement: on a wall, over the shops' doors; on a post, at
// a driver's eye from a kart, but over a walker's head.
const ON_WALL = 2.6;
const ON_POST = 2.2;
// How near both kerbs a building must stand to be the corner's (the owner's answer, 2026-10-15).
const NEAR = 3;
// From how far each side of a junction a street's line is taken for its way out of it.
const REACH = 10;

// The streets a plate names or meets: every street on the ground, but a link, a service road or a
// track without a name, and the railway.
const isArm = (l) => l.level === LEVEL.ground && l.k <= 8 && (l.t.name ? true : l.k !== 1 && l.k <= 6);

// The way out of a junction along a line from its point i, back (-1) or on (+1): the chord to the
// point REACH metres along it, or its end.
function wayOut(pts, i, step) {
  let [x, z] = pts[i], d = 0;
  for (let k = i + step; k >= 0 && k < pts.length; k += step) {
    const [px, pz] = pts[k], l = Math.hypot(px - x, pz - z);
    if (d + l >= REACH) { const f = (REACH - d) / l; [x, z] = [x + (px - x) * f, z + (pz - z) * f]; d = REACH; break; }
    d += l;
    [x, z] = [px, pz];
  }
  const [x0, z0] = pts[i], L = Math.hypot(x - x0, z - z0);
  return L > 0.5 ? [(x - x0) / L, (z - z0) / L] : null;
}

// Every plate, from the streets (lines.mjs's streetsOf: each { k, w, pts, nodes, t, level }, on their
// carriageways), whether a point is in the area to plate (inArea), the buildings' footprints (rings),
// whether something is built at a point (built), on a carriageway (road) or on what's between them,
// a reservation or an island (between); the ground's height over elev0 (ground), and the shops' signs
// ([x0, z0, x1, z1, y, h], over elev0) a plate keeps clear of. Each plate is { name, on, x, z, face,
// y }: on 'wall', (x, z) its middle 5 cm out from its wall, which faces (cos face, sin face); on
// 'post', (x, z) the post's foot and the plate along its street, facing it that way and the other;
// y its bottom over elev0.
export function platesOf({ lines, inArea, buildings, built, road, between, ground, signs = [] }) {
  // The junctions: each node of those streets in the area, with each line through it.
  const at = new Map();
  for (const l of lines) {
    if (!isArm(l) || l.nodes?.length !== l.pts.length) continue;
    l.nodes.forEach((n, i) => { if (inArea(...l.pts[i])) at.set(n, [...(at.get(n) ?? []), { l, i }]); });
  }
  // The buildings' walls, in cells of 20 m: each edge with its building's ring.
  const walls = new Grid(20);
  for (const ring of buildings) {
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k], b = ring[(k + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < PLATE.w + 0.5) continue;
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const out = inside(ring, mx + uz * 0.1, mz - ux * 0.1) ? -1 : 1;
      const w = { a, b, L, ux, uz, nx: uz * out, nz: -ux * out };
      for (let f = 0; f <= Math.ceil(L / 10); f++) walls.add(a[0] + ux * Math.min(L, f * 10), a[1] + uz * Math.min(L, f * 10), w);
    }
  }
  const signList = new Grid(20);
  for (const s of signs) signList.add((s[0] + s[2]) / 2, (s[1] + s[3]) / 2, s);

  // Whether a carriageway is within r of a point, looked for every 30° and 25 cm.
  const nearRoad = ([x, z], r) => {
    for (let d = 0; d <= r; d += 0.25) for (let k = 0; k < (d ? 12 : 1); k++) if (road(x + d * Math.cos((k * Math.PI) / 6), z + d * Math.sin((k * Math.PI) / 6))) return true;
    return false;
  };
  const plates = [];
  const named = new Grid(10);
  const stats = { corners: 0, open: 0, wall: 0, post: 0, none: 0, twice: 0 };
  const add = (p) => {
    // Not the same name again within 6 m (two nodes of one junction, close together).
    if (named.near(p.x, p.z, 1).some((q) => q.name === p.name && Math.hypot(q.x - p.x, q.z - p.z) < 6)) { stats.twice++; return false; }
    named.add(p.x, p.z, p);
    plates.push(p);
    stats[p.on]++;
    return true;
  };

  for (const [, through] of at) {
    // Its arms: each way out of it, with its street's name and half its width.
    const arms = [];
    for (const { l, i } of through) {
      for (const step of [-1, 1]) {
        if (i + step < 0 || i + step >= l.pts.length) continue;
        const d = wayOut(l.pts, i, step);
        if (d) arms.push({ name: l.t.name ?? '', hw: l.w / 2, d, a: Math.atan2(d[1], d[0]) });
      }
    }
    if (arms.length < 2 || new Set(arms.map((r) => r.name)).size < 2) continue;
    arms.sort((p, q) => p.a - q.a);
    const [jx, jz] = through[0].l.pts[through[0].i];
    for (let k = 0; k < arms.length; k++) {
      const A = arms[k], B = arms[(k + 1) % arms.length], gap = (B.a - A.a + 2 * Math.PI) % (2 * Math.PI);
      if (A.name === B.name || gap < 0.35 || gap > 2.8) continue;
      // Each street's kerb on the corner's side, by its line and half its width, and where they meet (K).
      const nA = [-A.d[1], A.d[0]], nB = [B.d[1], -B.d[0]];
      if (nA[0] * B.d[0] + nA[1] * B.d[1] < 0) [nA[0], nA[1]] = [-nA[0], -nA[1]];
      if (nB[0] * A.d[0] + nB[1] * A.d[1] < 0) [nB[0], nB[1]] = [-nB[0], -nB[1]];
      const rx = nB[0] * B.hw - nA[0] * A.hw, rz = nB[1] * B.hw - nA[1] * A.hw, det = -A.d[0] * B.d[1] + B.d[0] * A.d[1];
      const s = (-rx * B.d[1] + B.d[0] * rz) / det;
      const K = [jx + nA[0] * A.hw + A.d[0] * s, jz + nA[1] * A.hw + A.d[1] * s];
      // The corner on the kerb as it's drawn (C): from K along the corner's bisector, the first point off
      // the carriageway, which a kerb rounds. None 10 m on is no corner: the carriageway of a wide
      // junction, or of two side streets close together, between them.
      const bl = Math.hypot(nA[0] + nB[0], nA[1] + nB[1]), bis = [(nA[0] + nB[0]) / bl, (nA[1] + nB[1]) / bl];
      let C = null;
      for (let r = 0; r <= 10 && !C; r += 0.25) if (!road(K[0] + bis[0] * r, K[1] + bis[1] * r)) C = [K[0] + bis[0] * r, K[1] + bis[1] * r];
      if (!C) { stats.open++; continue; }
      stats.corners++;
      // The post, where there's no wall: half a metre on from C, on a pavement or open ground (not a
      // reservation or an island), 30 cm clear of a building.
      const p = [C[0] + bis[0] * 0.5, C[1] + bis[1] * 0.5];
      const clear = [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].every(([dx, dz]) => !built(p[0] + dx, p[1] + dz));
      const post = clear && !road(...p) && !between(...p) && inArea(...p) ? { x: p[0], z: p[1], n: 0 } : null;
      for (const [S, nS] of [[A, nA], [B, nB]]) {
        if (!S.name) continue;
        // The corner building's wall along S: square to nS within 25°, facing S's street, its end at the
        // corner (E) within 6 m of C and NEAR + 0.5 m of a carriageway (a building within NEAR of both
        // kerbs, a kerb's radius round from C), and the plate on it within NEAR + 0.5 m of S's
        // carriageway; the one whose E is nearest C.
        let best = null;
        for (const w of new Set(walls.near(C[0], C[1], 1))) {
          if (Math.abs(w.ux * S.d[0] + w.uz * S.d[1]) < Math.cos(0.44) || -(w.nx * nS[0] + w.nz * nS[1]) < Math.cos(0.52)) continue;
          const [E, F] = (w.a[0] - jx) * S.d[0] + (w.a[1] - jz) * S.d[1] < (w.b[0] - jx) * S.d[0] + (w.b[1] - jz) * S.d[1] ? [w.a, w.b] : [w.b, w.a];
          const d = Math.hypot(E[0] - C[0], E[1] - C[1]);
          if (d > 6 || (best && d >= best.d) || !nearRoad(E, NEAR + 0.5)) continue;
          const ux = (F[0] - E[0]) / w.L, uz = (F[1] - E[1]) / w.L, at = 0.4 + PLATE.w / 2;
          const x = E[0] + ux * at + w.nx * 0.05, z = E[1] + uz * at + w.nz * 0.05;
          let kerb = false;
          for (let r = 0; r <= NEAR + 0.5 && !kerb; r += 0.25) kerb = road(x + w.nx * r, z + w.nz * r);
          // Open in front of it: no building 0.3, 1 or 2 m out (one behind it in a row, or across an alley).
          if (kerb && !road(x, z) && [0.3, 1, 2].every((r) => !built(x + w.nx * r, z + w.nz * r))) best = { w, E, ux, uz, at, x, z, d };
        }
        if (best) {
          const { w, E, ux, uz, at, x, z } = best;
          let y = ground(x, z) + ON_WALL;
          // Over a shop's sign on that wall, where it would cover it.
          for (const [x0, z0, x1, z1, sy, sh] of signList.near(x, z, 1)) {
            const along = (p, q) => (p - E[0]) * ux + (q - E[1]) * uz, off = Math.abs(((x0 + x1) / 2 - x) * w.nx + ((z0 + z1) / 2 - z) * w.nz);
            const a0 = Math.min(along(x0, z0), along(x1, z1)), a1 = Math.max(along(x0, z0), along(x1, z1));
            if (off < 0.3 && a1 > at - PLATE.w / 2 - 0.2 && a0 < at + PLATE.w / 2 + 0.2 && sy < y + PLATE.h + 0.1 && sy + sh > y - 0.1) y = Math.max(y, sy + sh + 0.15);
          }
          add({ name: S.name, on: 'wall', x, z, face: Math.atan2(w.nz, w.nx), y });
          continue;
        }
        if (!post) { stats.none++; continue; }
        // Along its street, facing it; a second name on the post over the first.
        if (add({ name: S.name, on: 'post', x: post.x, z: post.z, face: Math.atan2(-nS[1], -nS[0]), y: ground(post.x, post.z) + ON_POST + post.n * (PLATE.h + 0.05) })) post.n++;
      }
    }
  }
  return { plates, stats };
}
