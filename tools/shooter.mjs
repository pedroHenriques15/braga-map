// The shooter's area (task 015, decision 003): Fujacal and Conselheiro Lobato, where the first
// shooter is played on foot. The five streets (the Rua, the Travessa and the Alameda do Fujacal, the
// Rua and the Travessa Conselheiro Lobato) and a block each side of them (the owner's answer): two
// avenues and the Rio Este close them in, and the player sees past them but doesn't leave.
//
// node tools/shooter.mjs
//
// works its edge out from OpenStreetMap's streets and the Rio Este (fetch.mjs's osm/base.json) and
// the buildings' outlines (osm/buildings.json, and those the LiDAR found, roofs.json), and writes it
// to tools/shooter.json, which sections.mjs reads as SHOOTER, for world.mjs, the map page (build.mjs)
// and the games. Run it again only to move the edge, then world.mjs and build.mjs.
//
// How. The Avenida Imaculada Conceição to the north-west, the Avenida da Liberdade to the east and
// the Rio Este to the south close the five streets in, with the Rua Monsenhor Airosa on the west:
// everything between them is in, up to the avenues' near kerbs (their slip roads' too) and the
// river's near bank. A busy road and the water are the edge there. Past the Rua Monsenhor Airosa the
// block behind it is in too, down to the river: its streets (BEHIND) are in and every other street
// there out, and the area reaches half way between them, and no further than CAP from a street in. A building the edge would cut there goes in or out whole, as most of it
// is, so the edge runs along its back or its side, as the open world's does (open.mjs). A street
// leaving is in for a few metres past its junction, past where its kerbs turn the corner, and the
// edge crosses it square there. Worked out on a grid of half a metre, drawn round and straightened.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { P, readCache, ROOT } from './geo.mjs';
import { carriageway, footprints, LINE, ringOf, segDist, simplify } from './osm.mjs';
import { onCarriageways } from './lines.mjs';
import { square } from './open.mjs';

export const FILE = path.join(ROOT, 'tools/shooter.json');

// What closes it in: the avenues, kerb to kerb, with the slip roads off them (the links with no name
// of their own that meet them, but those into the street on the west, which are its); the river, as
// wide as world.mjs has it; and the street on the west.
const AVENUES = ['Avenida Imaculada Conceição', 'Avenida da Liberdade'];
const RIVER = 'Rio Este', RIVER_HALF = 6;
const WEST = ['Rua Monsenhor Airosa', 'Largo Santa Justa'];
// The block behind the Rua Monsenhor Airosa: the Rua Doutor José Vilaça's driveway round the flats
// there, reached on foot through a passage under the houses on the street, the lane from it down past
// the flats, and the Rua de Santa Justa along the river from the street's foot (OpenStreetMap's ways).
const BEHIND = [142901052, 256464006, 256464007, 1463261800, 142900913];
// A point in it, on the Alameda do Fujacal's block, and the box it's worked out in, with room round it.
const SEED = [0, 850], BOX = { x0: -600, x1: 500, z0: 450, z1: 1250 };
const CELL = 0.5, CAP = 50;
// The radius a kerb turns a corner at, by the kinds in osm.mjs's LINE (streets.mjs's R_KERB).
const R_KERB = [10, 8, 8, 7, 6, 5, 3, 3, 3];

// A grid of CELL over a box: cells in rows, z down.
function grid(b) {
  const X0 = b.x0, Z0 = b.z0, NX = Math.ceil((b.x1 - b.x0) / CELL), NZ = Math.ceil((b.z1 - b.z0) / CELL), N = NX * NZ;
  const cellOf = (x, z) => { const i = Math.floor((x - X0) / CELL), j = Math.floor((z - Z0) / CELL); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : j * NX + i; };
  const mid = (c) => [X0 + ((c % NX) + 0.5) * CELL, Z0 + (Math.floor(c / NX) + 0.5) * CELL];
  // Marks the cells within r of a line (r 0: those it passes through).
  const stroke = (mask, pts, r = 0, v = 1) => {
    for (let i = 1; i < pts.length; i++) {
      const a = { x: pts[i - 1][0], z: pts[i - 1][1] }, b = { x: pts[i][0], z: pts[i][1] };
      if (!r) {
        const n = Math.max(1, Math.ceil((Math.hypot(b.x - a.x, b.z - a.z) / CELL) * 2));
        for (let f = 0; f <= n; f++) { const c = cellOf(a.x + ((b.x - a.x) * f) / n, a.z + ((b.z - a.z) * f) / n); if (c >= 0) mask[c] = v; }
        continue;
      }
      const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - r - X0) / CELL)), i1 = Math.min(NX - 1, Math.floor((Math.max(a.x, b.x) + r - X0) / CELL));
      const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - r - Z0) / CELL)), j1 = Math.min(NZ - 1, Math.floor((Math.max(a.z, b.z) + r - Z0) / CELL));
      for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) { const c = j * NX + k, [x, z] = mid(c); if (segDist(x, z, a, b) <= r) mask[c] = v; }
    }
  };
  // The cells reachable from `from` through cells `ok` lets by, side to side.
  const flood = (from, ok) => {
    const out = new Uint8Array(N), st = from.filter((c) => ok(c));
    for (const c of st) out[c] = 1;
    while (st.length) {
      const c = st.pop(), i = c % NX;
      for (const q of [i > 0 ? c - 1 : -1, i < NX - 1 ? c + 1 : -1, c >= NX ? c - NX : -1, c + NX < N ? c + NX : -1]) if (q >= 0 && !out[q] && ok(q)) { out[q] = 1; st.push(q); }
    }
    return out;
  };
  const border = [];
  for (let i = 0; i < NX; i++) border.push(i, (NZ - 1) * NX + i);
  for (let j = 0; j < NZ; j++) border.push(j * NX, j * NX + NX - 1);
  // The distance from every cell to the nearest one marked, in metres (Felzenszwalb and
  // Huttenlocher's: down each column, then along each row).
  const dist = (mask) => {
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
    for (let i = 0; i < NX; i++) { for (let j = 0; j < NZ; j++) f[j] = mask[j * NX + i] ? 0 : 1e12; pass(NZ); for (let j = 0; j < NZ; j++) d[j * NX + i] = g[j]; }
    for (let j = 0; j < NZ; j++) { for (let i = 0; i < NX; i++) f[i] = d[j * NX + i]; pass(NX); for (let i = 0; i < NX; i++) d[j * NX + i] = Math.sqrt(g[i]) * CELL; }
    return d;
  };
  // The cells inside a ring, by rows.
  const fill = (ring) => {
    const cells = [];
    let z0 = Infinity, z1 = -Infinity;
    for (const [, z] of ring) { z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let j = Math.max(0, Math.floor((z0 - Z0) / CELL)); j <= Math.min(NZ - 1, Math.ceil((z1 - Z0) / CELL)); j++) {
      const zc = Z0 + (j + 0.5) * CELL, xs = [];
      for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
        const [xa, za] = ring[a], [xb, zb] = ring[b];
        if ((za > zc) !== (zb > zc)) xs.push(xa + ((zc - za) * (xb - xa)) / (zb - za));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil((xs[k] - X0) / CELL - 0.5)); i <= Math.min(NX - 1, Math.floor((xs[k + 1] - X0) / CELL - 0.5)); i++) cells.push(j * NX + i);
    }
    return cells;
  };
  // Drawn round: along the cells' sides from the top left corner of its first cell, east, the area
  // always on the right.
  const outline = (area) => {
    const on = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ && area[j * NX + i] === 1;
    // No two cells of it meet only at a corner: a cell beside them joins them.
    for (let again = true; again; ) {
      again = false;
      for (let j = 1; j < NZ; j++) for (let i = 1; i < NX; i++) {
        const nw = on(i - 1, j - 1), ne = on(i, j - 1), sw = on(i - 1, j), se = on(i, j);
        if ((nw && se && !ne && !sw) || (ne && sw && !nw && !se)) { area[(j - 1) * NX + i] = area[(j - 1) * NX + i - 1] = 1; again = true; }
      }
    }
    let si = -1, sj = -1;
    for (let c = 0; c < N && si < 0; c++) if (area[c]) { si = c % NX; sj = (c / NX) | 0; }
    const DX = [1, 0, -1, 0], DZ = [0, 1, 0, -1];
    const LEFT = [[0, -1], [0, 0], [-1, 0], [-1, -1]], RIGHT = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
    const side = (i, j, d) => on(i + RIGHT[d][0], j + RIGHT[d][1]) && !on(i + LEFT[d][0], j + LEFT[d][1]);
    const corners = [];
    let ci = si, cj = sj, dir = 0;
    do {
      corners.push([X0 + ci * CELL, Z0 + cj * CELL]);
      ci += DX[dir]; cj += DZ[dir];
      dir = [(dir + 1) % 4, dir, (dir + 3) % 4].find((d) => side(ci, cj, d));
      if (dir == null) throw new Error(`the outline stops at ${X0 + ci * CELL}, ${Z0 + cj * CELL}`);
    } while (ci !== si || cj !== sj);
    return corners;
  };
  return { N, NX, cellOf, stroke, flood, border, dist, fill, outline };
}

// The edge, from `base` (fetch.mjs's osm/base.json) and the buildings' outlines (`buildings`, rings of
// [x, z]): a ring of points, the area on the right going round it (x east, z south).
export function work({ base, buildings = [], log = console.log }) {
  const ways = [], river = [];
  for (const e of base.elements) {
    if (e.type !== 'way' || !e.geometry) continue;
    const t = e.tags ?? {};
    const under = t.tunnel && t.tunnel !== 'no' && t.tunnel !== 'building_passage';
    if (t.waterway === 'river' && t.name === RIVER && !under) river.push(e.geometry.map(P));
    if (LINE[t.highway] == null || under) continue;
    ways.push({ id: e.id, k: LINE[t.highway], w: carriageway(t), name: t.name, link: t.highway.endsWith('_link'), pts: e.geometry.map(P), nodes: e.nodes });
  }
  if (!river.length) throw new Error(`no ${RIVER} in osm/base.json`);
  for (const id of BEHIND) if (!ways.some((w) => w.id === id)) throw new Error(`no way ${id} in osm/base.json: the block behind the Rua Monsenhor Airosa has changed`);
  // The street on the west and the links into it; the avenues and their other slip roads.
  const nodesOf = (set) => new Set([...set].flatMap((w) => w.nodes));
  const west = new Set(ways.filter((w) => WEST.includes(w.name)));
  const westNodes = nodesOf(west);
  for (const w of ways) if (w.link && !w.name && w.nodes.some((n) => westNodes.has(n))) west.add(w);
  const avenue = new Set(ways.filter((w) => AVENUES.includes(w.name)));
  const avNodes = nodesOf(avenue);
  for (const w of ways) if (w.link && !w.name && !west.has(w) && w.nodes.some((n) => avNodes.has(n))) avenue.add(w);

  const G = grid(BOX);
  const { N } = G;

  // What closes it in: the avenues kerb to kerb, the river bank to bank.
  const wall = new Uint8Array(N), divide = new Uint8Array(N);
  for (const w of avenue) G.stroke(wall, w.pts, w.w / 2);
  for (const r of river) G.stroke(wall, r, RIVER_HALF);
  for (const w of west) G.stroke(divide, w.pts);
  const seed = G.cellOf(...SEED);
  if (seed < 0 || wall[seed] || divide[seed]) throw new Error('the seed is on a street that closes the area in');
  // Inside the four: everything up to them. Short of them, on the west: the land the area can reach.
  const core = G.flood([seed], (c) => !wall[c] && !divide[c]);
  if (G.border.some((c) => core[c])) throw new Error("the avenues, the river and the Rua Monsenhor Airosa don't close the five streets in");
  const land = G.flood([seed], (c) => !wall[c]);

  // The streets in: those inside the four, the one on the west and the block behind it. Out: every
  // other street on the land, but for the first few metres past where it leaves one in.
  const share = (w, mask) => { let n = 0, k = 0; for (const [x, z] of w.pts) { const c = G.cellOf(x, z); k++; if (c >= 0 && mask[c]) n++; } return n / k; };
  const inside = new Set(ways.filter((w) => !avenue.has(w) && (west.has(w) || BEHIND.includes(w.id) || share(w, core) > 0.5)));
  const inNodes = nodesOf(inside);
  const feat = { in: new Uint8Array(N), out: new Uint8Array(N) };
  let cuts = 0;
  for (const w of ways) {
    if (avenue.has(w)) continue;
    if (inside.has(w)) { G.stroke(feat.in, w.pts); continue; }
    if (!share(w, land)) continue;
    // From each end that meets a street in: in as far as its kerbs turn the corner, and a metre more.
    const at = [w.nodes[0], w.nodes[w.nodes.length - 1]].map((n) => (inNodes.has(n) ? Math.max(...[...inside].filter((q) => q.nodes.includes(n)).map((q) => q.w / 2)) + R_KERB[w.k] + 1 : -1));
    cuts += (at[0] >= 0) + (at[1] >= 0);
    let along = 0;
    const len = w.pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - w.pts[i - 1][0], p[1] - w.pts[i - 1][1]) : 0), 0);
    for (let i = 1; i < w.pts.length; i++) {
      const [ax, az] = w.pts[i - 1], [bx, bz] = w.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L));
      for (let f = 1; f <= n; f++) {
        const p = [ax + ((bx - ax) * (f - 1)) / n, az + ((bz - az) * (f - 1)) / n], q = [ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n], m = along + (L * (f - 0.5)) / n;
        G.stroke(m <= at[0] || len - m <= at[1] ? feat.in : feat.out, [p, q]);
      }
      along += L;
    }
  }
  for (let c = 0; c < N; c++) if (feat.in[c] && feat.out[c]) feat.in[c] = 0;
  const dIn = G.dist(feat.in), dOut = G.dist(feat.out);

  // The area: inside the four, and on the land past the west, nearer a street in than one out.
  let area = new Uint8Array(N);
  for (let c = 0; c < N; c++) area[c] = core[c] || (land[c] && dIn[c] < dOut[c] && dIn[c] <= CAP) ? 1 : 0;
  // A building it would cut on the land past the west is in or out whole, as most of it is.
  let moved = 0;
  for (const ring of buildings) {
    const cells = G.fill(ring).filter((c) => land[c] && !core[c]);
    const n = cells.reduce((s, c) => s + area[c], 0);
    if (!n || n === cells.length) continue;
    const v = n * 2 >= cells.length ? 1 : 0;
    for (const c of cells) if (!feat.in[c] && !feat.out[c]) area[c] = v;
    moved++;
  }
  // The piece the seed is in, its holes filled.
  area = G.flood([seed], (c) => area[c] === 1);
  const outside = G.flood(G.border, (c) => !area[c]);
  for (let c = 0; c < N; c++) area[c] = outside[c] ? 0 : 1;

  // Crossing square the streets this side of the avenues and the river, those in and those out, but
  // those that reach an avenue's carriageway or the river: the kerb or the bank runs across their
  // mouths already, and a slip road off an avenue runs along it a while.
  const over = (w, mask) => w.pts.some((q, i) => {
    if (!i) return false;
    const p = w.pts[i - 1], k = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / CELL));
    for (let f = 0; f <= k; f++) { const c = G.cellOf(p[0] + ((q[0] - p[0]) * f) / k, p[1] + ((q[1] - p[1]) * f) / k); if (c >= 0 && mask[c]) return true; }
    return false;
  });
  const lines = ways.filter((w) => !avenue.has(w) && (inside.has(w) || share(w, land)) && !over(w, wall)).map((w) => ({ k: w.k, w: w.w, pts: w.pts }));
  const { pts, left } = square(simplify(G.outline(area), CELL * 1.2), lines);
  log(`streets: ${inside.size} in, ${cuts} cut where they leave; ${moved} buildings the edge goes round; ${left} crossings left as they were`);
  return pts.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
}

// ---- On its own ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = Date.now();
  const buildings = [...footprints(readCache('osm/buildings.json')).map(ringOf), ...(readCache('roofs.json').found ?? []).map((f) => f.pts)];
  const pts = work({ base: onCarriageways(readCache('osm/base.json')), buildings });
  fs.writeFileSync(FILE, JSON.stringify({ about: "The shooter's area's edge (task 015), made by tools/shooter.mjs from OpenStreetMap: run that again rather than editing it. © OpenStreetMap contributors (ODbL).", pts }) + '\n');
  console.log(`the edge: ${pts.length} points, in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(ROOT, FILE)}`);
}
