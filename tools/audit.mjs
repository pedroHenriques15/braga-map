// The street audit (task 006): every street, path and step OpenStreetMap has where the games are
// played, and whether the world's tiles draw it; and the reverse, every line in the tiles that's no
// street OpenStreetMap has. A way is drawn where a line of its own kind in the tiles runs within
// 1.2 m of it (a square, where a square's outline or a hole's does), on its carriageway where the
// world moves it there (task 026): party-kart paints every line the tiles have on the ground, but a
// tunnel (its mouths are drawn) and a bridge's deck (drawn whole). A path
// (task 050) is drawn where a path of its kind in the tiles' surfaces is within 1.2 m of it; a
// pavement or a crossing the map draws as a footway, where the streets' pavements or carriageways
// are: those are only in the open world's area.
//
// node tools/audit.mjs           after world.mjs: the table, and .cache/audit.json, which build.mjs
//                                puts on the map page as the layer "Auditoria"
// node tools/audit.mjs photos    also the 2025 orthophoto with OpenStreetMap's ways over it (on their
//                                carriageways, where the world draws them), in
//                                250 m squares over the shooter's area and along the route, into
//                                .cache/audit/: to find by eye what the photo shows and the map lacks
//
// Over three areas, each inside the one before: the Volta dos Amigos' box (tracks/amigos.js), which a
// game draws round the race; the open world's area (task 032); and the shooter's (decision 003).
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, P, readCache } from './geo.mjs';
import { Grid, inside, LINE } from './osm.mjs';
import { isSquare, isSquareInParts, onCarriageways } from './lines.mjs';
import { inShooter, OPEN, SHOOTER_BOX } from './sections.mjs';
import { loadWorld } from '../index.js';
import amigos from '../tracks/amigos.js';

// The streets and paths where the world draws them: on their carriageways, where DGT's LiDAR measured
// them (lines.mjs's onCarriageways, task 026), as world.mjs reads them.
const base = onCarriageways(readCache('osm/base.json'));
const pathsFile = path.join(CACHE, 'osm', 'paths.json');
if (!fs.existsSync(pathsFile)) throw new Error('No footways yet: node tools/fetch.mjs paths');
const paths = onCarriageways(readCache('osm/paths.json'));

// How near a line in the tiles must run to count as drawing a way: the tiles keep a street's points
// to within 0.8 m (world.mjs) and in half metres, up to 0.35 m more (task 041).
const TOL = 1.2;
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const AREAS = [
  { id: 'box', name: "the Volta dos Amigos' box", in: (x, z) => inBox(amigos.box, x, z) },
  { id: 'open', name: "the open world's area", in: (x, z) => inside(OPEN, x, z) },
  { id: 'shooter', name: "the shooter's area", in: inShooter },
];

// The classes, in the table's order: OpenStreetMap's own, a footway split by what it is, the squares
// apart. `kind` is the line a game draws it as (LINE in osm.mjs), PLAZA a square, null nothing.
const PLAZA = 100;
const CLASSES = [
  'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'pedestrian', 'square', 'service',
  'track', 'railway', 'sidewalk', 'crossing', 'footway', 'steps', 'path', 'cycleway', 'bridleway', 'construction',
  'road', 'busway',
];
const kindOf = (c) => (c === 'railway' ? 9 : c === 'square' ? PLAZA : LINE[c] ?? null);
// What's walked or cycled, drawn in the open world's area (task 050). The rest are streets, squares
// and the railway, which a game should draw: a street being built, or of no known class, too.
const PATHS = new Set(['sidewalk', 'crossing', 'footway', 'steps', 'path', 'cycleway', 'bridleway']);
// The kind of path (the tiles' Path's) each is drawn as; a pavement and a crossing the map draws as
// a footway are the streets'.
const PATH_AS = { footway: 'footway', steps: 'steps', path: 'path', bridleway: 'path', cycleway: 'cycleway', sidewalk: 'street', crossing: 'street' };
// On the map page, at the level the owner chose (decisions.json): which classes it shows. It never
// shows the service roads, and the "Principais" level leaves out the residential streets and tracks.
const PAGE_MAIN = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'pedestrian', 'square', 'railway']);

// Every way: its class, its name and its lines ([x, z] points; a square's outline, closed).
const ways = [];
const ring = (g) => g.map(P);
for (const e of base.elements) {
  const t = e.tags || {};
  if (e.type !== 'way' || !(t.highway || t.railway)) continue;
  const pts = e.geometry.map(P);
  if (t.railway) ways.push({ id: e.id, c: 'railway', name: t.name, lines: [pts] });
  else if (isSquare(e, pts)) ways.push({ id: e.id, c: 'square', name: t.name, lines: [pts] });
  else if (LINE[t.highway] != null) ways.push({ id: e.id, c: t.highway, name: t.name, lines: [pts] });
}
for (const e of paths.elements) {
  const t = e.tags || {};
  if (e.type === 'relation') {
    // A square mapped as a multipolygon (task 041): its outer and inner ways, a square's outline and
    // its holes' in the tiles.
    if (isSquareInParts(e)) ways.push({ id: e.id, rel: true, c: 'square', name: t.name, lines: e.members.filter((m) => m.type === 'way' && m.geometry).map((m) => ring(m.geometry)) });
    continue;
  }
  // The streets' own (lines.mjs's pathsOf leaves them out): a pavement, or a link to one; a crossing,
  // or an island it crosses.
  const own = t.footway ?? (t.highway === 'cycleway' ? t.cycleway : undefined);
  const c = own === 'sidewalk' || own === 'link' ? 'sidewalk' : own === 'crossing' || own === 'traffic_island' ? 'crossing' : t.highway;
  ways.push({ id: e.id, c, name: t.name, lines: [ring(e.geometry)] });
}

// A grid of segments, each [ax, az, bx, bz, kind], in every 10 m cell within TOL of it.
const segGrid = () => {
  const g = new Grid(10);
  g.put = (a, b, kind) => {
    const x0 = Math.floor((Math.min(a[0], b[0]) - TOL) / 10), x1 = Math.floor((Math.max(a[0], b[0]) + TOL) / 10);
    const z0 = Math.floor((Math.min(a[1], b[1]) - TOL) / 10), z1 = Math.floor((Math.max(a[1], b[1]) + TOL) / 10);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
      const k = i + ',' + j;
      if (!g.m.has(k)) g.m.set(k, []);
      g.m.get(k).push([a[0], a[1], b[0], b[1], kind]);
    }
  };
  // Whether a segment of `kind` runs within TOL of (x, z).
  g.hits = (x, z, kind) => (g.m.get(g.key(x, z)) ?? []).some((s) => s[4] === kind && segDist(x, z, s) <= TOL);
  return g;
};
const segDist = (px, pz, [ax, az, bx, bz]) => {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0;
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};
// A line in pieces of about a metre: each piece's middle and its length.
function* pieces(pts) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L));
    for (let k = 0; k < n; k++) yield [ax + ((bx - ax) * (k + 0.5)) / n, az + ((bz - az) * (k + 0.5)) / n, L / n];
  }
}

// What the tiles under the box have: their lines, and the squares' outlines; and in the open world's
// area, the paths' surfaces and the streets'.
const world = await loadWorld(amigos.box);
const drawn = segGrid();
for (const l of world.lines) for (let i = 1; i < l.pts.length; i++) drawn.put(l.pts[i - 1], l.pts[i], l.kind);
for (const a of world.areas) if (a.kind === 'plaza') for (const r of [a.pts, ...a.holes]) r.forEach((p, i) => drawn.put(p, r[(i + 1) % r.length], PLAZA));
// Pieces by what they are, in cells of 10 m: whether (x, z) is on one of `kind`, or within TOL.
const surfaces = new Map();
const putSurface = (kind, rings) => {
  const xs = rings[0].map((p) => p[0]), zs = rings[0].map((p) => p[1]);
  for (let i = Math.floor((Math.min(...xs) - TOL) / 10); i <= Math.floor((Math.max(...xs) + TOL) / 10); i++) for (let j = Math.floor((Math.min(...zs) - TOL) / 10); j <= Math.floor((Math.max(...zs) + TOL) / 10); j++) {
    const k = `${kind}:${i},${j}`;
    if (!surfaces.has(k)) surfaces.set(k, []);
    surfaces.get(k).push(rings);
  }
};
for (const p of world.streets.paths) putSurface(p.kind, p.rings);
for (const p of [...world.streets.carriageways, ...world.streets.pavements]) putSurface('street', p.rings);
const inRings = (rings, x, z) => { let odd = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > z !== r[j][1] > z && x < r[i][0] + ((z - r[i][1]) / (r[j][1] - r[i][1])) * (r[j][0] - r[i][0])) odd = !odd; return odd; };
const onSurface = (x, z, kind) => [[0, 0], [TOL, 0], [-TOL, 0], [0, TOL], [0, -TOL]].some(([a, b]) => (surfaces.get(`${kind}:${Math.floor((x + a) / 10)},${Math.floor((z + b) / 10)}`) ?? []).some((r) => inRings(r, x + a, z + b)));

// Each way: how much of it is in each area, and how much of that the tiles draw.
const table = Object.fromEntries(AREAS.map((a) => [a.id, {}]));
const audited = [];
for (const w of ways) {
  const kind = kindOf(w.c), len = {}, got = {};
  for (const pts of w.lines) for (const [x, z, L] of pieces(pts)) {
    const where = AREAS.filter((a) => a.in(x, z));
    if (!where.length) continue;
    const hit = PATHS.has(w.c) ? onSurface(x, z, PATH_AS[w.c]) : kind != null && drawn.hits(x, z, kind);
    for (const a of where) { len[a.id] = (len[a.id] ?? 0) + L; if (hit) got[a.id] = (got[a.id] ?? 0) + L; }
  }
  if (!len.box) continue;
  for (const a of AREAS) {
    if (!len[a.id]) continue;
    const row = (table[a.id][w.c] ??= { ways: 0, len: 0, drawn: 0, whole: 0, part: 0, none: 0 });
    const f = (got[a.id] ?? 0) / len[a.id];
    row.ways++, row.len += len[a.id], row.drawn += got[a.id] ?? 0;
    row[f >= 0.9 ? 'whole' : f > 0.1 ? 'part' : 'none']++;
  }
  audited.push({ id: w.id, ...(w.rel && { rel: true }), c: w.c, ...(w.name && { name: w.name }), len: Math.round(len.box), drawn: Math.round(((got.box ?? 0) / len.box) * 100) / 100, open: !!len.open, shooter: !!len.shooter, lines: w.lines.map((l) => l.map(([x, z]) => [Math.round(x * 2) / 2, Math.round(z * 2) / 2])) });
}

// The reverse: each line in the tiles, how much of it in the box runs along no way of its kind.
const osm = segGrid();
for (const w of ways) {
  const kind = kindOf(w.c);
  if (kind != null && kind !== PLAZA) for (const pts of w.lines) for (let i = 1; i < pts.length; i++) osm.put(pts[i - 1], pts[i], kind);
}
const strays = [];
for (const l of world.lines) {
  let len = 0, off = 0, at = null;
  for (const [x, z, L] of pieces(l.pts)) {
    if (!AREAS[0].in(x, z)) continue;
    len += L;
    if (!osm.hits(x, z, l.kind)) { off += L; at ??= [Math.round(x), Math.round(z)]; }
  }
  if (off > 2 && off / len > 0.1) strays.push({ kind: l.kind, level: l.level, len: Math.round(len), off: Math.round(off), at, pts: l.pts });
}
// A line crossing tiles is in each, a little past their edges: the same stray once.
const seen = new Set();
const stray = strays.filter((s) => { const k = s.kind + ':' + s.at; if (seen.has(k)) return false; seen.add(k); return true; });

// ---- The table ----
const km = (m) => (m / 1000).toFixed(m < 10000 ? 2 : 1).padStart(6);
for (const a of AREAS) {
  const rows = table[a.id];
  console.log(`\nIn ${a.name}: what OpenStreetMap has, and what the world's tiles draw`);
  console.log('class            ways   km OSM  km drawn  drawn   whole  part  none   map page');
  let L = 0, D = 0, LS = 0, DS = 0;
  for (const c of CLASSES) {
    const r = rows[c];
    if (!r) continue;
    const street = !PATHS.has(c);
    L += r.len, D += r.drawn;
    if (street) LS += r.len, DS += r.drawn;
    const pct = `${((r.drawn / r.len) * 100).toFixed(1).padStart(5)}%`;
    console.log(`${c.padEnd(15)} ${String(r.ways).padStart(5)}  ${km(r.len)}    ${km(r.drawn)}  ${pct}  ${String(r.whole).padStart(5)} ${String(r.part).padStart(5)} ${String(r.none).padStart(5)}   ${PAGE_MAIN.has(c) ? 'yes' : c === 'service' || kindOf(c) == null ? 'never' : 'no (Todas only)'}`);
  }
  console.log(`streets, squares and railway: ${km(LS)} km in OSM, ${km(DS)} km drawn (${((DS / LS) * 100).toFixed(1)}%); with the paths: ${km(L)} km, ${km(D)} km drawn`);
}
console.log("\nThe paths are drawn in the open world's area only (task 050): a footway, a path or a cycleway as itself where it doesn't give way to a pavement, a carriageway or a building; a pavement or a crossing the map draws as a footway, as the streets' pavements and carriageways.");
const missed = audited.filter((w) => !PATHS.has(w.c) && w.drawn < 0.9);
console.log(`\nStreets, squares and railway in the box the tiles don't draw whole: ${missed.length}`);
for (const w of missed.sort((p, q) => q.len - p.len)) {
  const [x, z] = w.lines[0][Math.floor(w.lines[0].length / 2)];
  console.log(`  ${w.rel ? 'relation' : 'way'} ${w.id} ${w.c}${w.name ? ` "${w.name}"` : ''}: ${w.len} m, ${Math.round(w.drawn * 100)}% drawn, at (${Math.round(x)}, ${Math.round(z)})`);
}
console.log(`Lines in the tiles over the box that run along no street of their kind: ${stray.length}`);
for (const s of stray) console.log(`  kind ${s.kind} ${s.level}: ${s.off} m of ${s.len} m, from (${s.at})`);

fs.writeFileSync(path.join(CACHE, 'audit.json'), JSON.stringify({
  made: new Date().toISOString().slice(0, 10),
  osm: { base: base.osm3s.timestamp_osm_base, paths: paths.osm3s.timestamp_osm_base },
  box: amigos.box,
  table,
  ways: audited,
  strays: stray.map(({ kind, level, len, off, pts }) => ({ kind, level, len, off, pts })),
}));
console.log(`\n.cache/audit.json: ${audited.length} ways, ${stray.length} stray lines`);

// ---- The orthophoto under the ways ----
if (process.argv.includes('photos')) await photos();

async function photos() {
  const jpeg = (await import('jpeg-js')).default;
  const { DGT, toTM } = await import('./dgt.mjs');
  const S = 250, PX = 0.5, N = S / PX, out = path.join(CACHE, 'audit');
  fs.mkdirSync(out, { recursive: true });
  // The squares: on the shooter's area, and within 60 m of the route.
  const squares = new Set();
  for (let i = Math.floor(SHOOTER_BOX.x0 / S); i * S < SHOOTER_BOX.x1; i++) for (let j = Math.floor(SHOOTER_BOX.z0 / S); j * S < SHOOTER_BOX.z1; j++) squares.add(i + ',' + j);
  for (const { p } of amigos.points) for (const dx of [-60, 0, 60]) for (const dz of [-60, 0, 60]) squares.add(Math.floor((p[0] + dx) / S) + ',' + Math.floor((p[2] + dz) / S));
  const tiles = new Map();
  const tile = (key) => {
    if (!tiles.has(key)) {
      if (tiles.size > 3) tiles.delete(tiles.keys().next().value);
      const f = path.join(DGT, 'ortho', key + '.jpg');
      tiles.set(key, fs.existsSync(f) ? jpeg.decode(fs.readFileSync(f), { formatAsRGBA: false, maxMemoryUsageInMB: 1024 }) : null);
    }
    return tiles.get(key);
  };
  const COLOUR = { street: [255, 214, 0], path: [0, 230, 255], steps: [255, 60, 200], square: [140, 255, 90], none: [255, 40, 40] };
  for (const sq of [...squares].sort()) {
    const [i, j] = sq.split(',').map(Number), x0 = i * S, z0 = j * S;
    // The map's metres to the photo's, straight across a square (within a centimetre).
    const [e00, n00] = toTM(x0, z0), [e10, n10] = toTM(x0 + S, z0), [e01, n01] = toTM(x0, z0 + S);
    const img = Buffer.alloc(N * N * 3);
    for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) {
      const fu = (u + 0.5) / N, fv = (v + 0.5) / N, e = e00 + (e10 - e00) * fu + (e01 - e00) * fv, n = n00 + (n10 - n00) * fu + (n01 - n00) * fv;
      const ke = Math.floor(e / 1000), kn = Math.floor(n / 1000), t = tile(ke + '_' + kn);
      if (!t) continue;
      const s = t.width / 1000, pi = Math.min(t.width - 1, Math.floor((e - ke * 1000) * s)), pj = Math.min(t.height - 1, Math.floor((kn * 1000 + 1000 - n) * s)), k = (pj * t.width + pi) * 3, o = (v * N + u) * 3;
      img[o] = t.data[k], img[o + 1] = t.data[k + 1], img[o + 2] = t.data[k + 2];
    }
    // Each way a pixel wide, so what's under it still shows beside it.
    const dot = (x, z, [r, g, b]) => {
      const u = Math.floor((x - x0) / PX), v = Math.floor((z - z0) / PX);
      if (u < 0 || v < 0 || u >= N || v >= N) return;
      const o = (v * N + u) * 3;
      img[o] = r, img[o + 1] = g, img[o + 2] = b;
    };
    for (const w of audited) {
      const col = PATHS.has(w.c) ? (w.c === 'steps' ? COLOUR.steps : COLOUR.path) : w.drawn < 0.9 ? COLOUR.none : w.c === 'square' ? COLOUR.square : COLOUR.street;
      for (const pts of w.lines) for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k], n = Math.ceil(Math.hypot(bx - ax, bz - az) / (PX / 2));
        for (let q = 0; q <= n; q++) dot(ax + ((bx - ax) * q) / n, az + ((bz - az) * q) / n, col);
      }
    }
    fs.writeFileSync(path.join(out, `x${x0}z${z0}.jpg`), jpeg.encode({ data: rgba(img), width: N, height: N }, 85).data);
  }
  console.log(`.cache/audit/: ${squares.size} squares of ${S} m, ${PX} m a pixel: streets yellow, squares green, paths cyan, steps magenta, what the tiles don't draw red`);
}
// jpeg-js encodes RGBA.
function rgba(rgb) {
  const out = Buffer.alloc((rgb.length / 3) * 4, 255);
  for (let i = 0, o = 0; i < rgb.length; i += 3, o += 4) out[o] = rgb[i], out[o + 1] = rgb[i + 1], out[o + 2] = rgb[i + 2];
  return out;
}
