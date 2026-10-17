// Makes the world the games share: the whole map, from OpenStreetMap and DGT's LiDAR (the ground),
// cut into 500 m tiles (sections.mjs). Nothing in it depends on a track or an arena: a game clears
// its own road of buildings and trees when it loads. Only the detail of the ground does: it's finer
// where the tracks run, where the shooter is played (decision 003), and over the open world's area,
// where a game lets the player drive anywhere (task 032).
//
// node tools/world.mjs
//
// - world/base.js, which every game loads: the tiles and the sections, the relief over the whole
//   map every 50 m and 15 km round for the horizon, what the far hills are covered with, the
//   rivers, the landmarks and the sights, and the open world's area: its edge, and the gates where
//   the streets leave it.
// - world/tiles/<id>.js, one per tile: the relief (every 2 m on the tiles within 60 m of a track
//   in tracks/, over the shooter's area and under the open world's, every 10 m on the rest), what
//   the ground is (clipped to the tile), the streets and the railway, the buildings, and the trees;
//   and round the open world's area, every street as surfaces (streets.mjs), every footway, path,
//   cycleway and flight of steps (task 050), and the walls, fences, railings, hedges and gates
//   (walls.mjs, task 013).
// - world/tiles.js, a loader for each tile, for index.js.
//
// All in metres from the Praça da República, x east and z south, heights above ELEV0, packed as
// 16-bit numbers: points in half metres, heights in decimetres (on a grid, each less a guess from
// its neighbours: osm.mjs's packGrid).
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, ELEV0, P, ROOT, readCache, relief } from './geo.mjs';
import { tileKey, toTM } from './dgt.mjs';
import { AREA, AREA_OF, blur, bounds, dm, footprints, Grid, half, hash, Inside, inside, memberRings, minRect, openThin, overlaps, Packer, packGrid, packPts, rectAxis, STOREY, STOREY_BASE as BASE, ringArea, ringOf, seeded, segDist, simplify, W_MIN } from './osm.mjs';
import { allTiles, EXT, OPEN, OPEN_BOX, OPEN_SEEN, OPEN_TILES, SECTIONS, sectionOf, SHOOTER, SHOOTER_BOX, SHOOTER_ID, SHOOTER_NAME, SHOOTER_SEEN, SHOOTER_TILES, TILE, tileBox, tileId, tileOf } from './sections.mjs';
import { gatesOf } from './open.mjs';
import { terrain } from './terrain.mjs';
import { decks } from './decks.mjs';
import { carriagewayMoves, heldGround, isLine, isSquare, LEVEL, levelHeights, onCarriageways, pathLines, pathsOf, streetBumps, streetsOf } from './lines.mjs';
import { packPaths, packStreets, streetSurfaces } from './streets.mjs';
import { cutWalls, packWalls } from './walls.mjs';
import { BALCONIES, BALCONY, COLOUR, COLOURS, floorsOf, GROUND, GROUND_OF, guesser, MATERIAL, MATERIALS, TYPE, TYPES } from './facades.mjs';

// The streets on their carriageways where the LiDAR measured them (lines.mjs's onCarriageways, task 026),
// and the paths that end on them with them.
const base = onCarriageways(readCache('osm/base.json'));
if (!carriagewayMoves()) console.log('no .cache/carriageways.json: the streets as the map has them (node tools/carriageways.mjs)');
if (!fs.existsSync(path.join(CACHE, 'osm', 'paths.json'))) throw new Error('No footways yet: node tools/fetch.mjs paths');
const pathsOsm = onCarriageways(readCache('osm/paths.json'));
// The car parks (task 016), fetched with the barriers (fetch.mjs's `barriers`, task 013).
const parkingOsm = readCache('osm/barriers.json').elements.filter((e) => e.tags?.amenity === 'parking');
const buildingsOsm = readCache('osm/buildings.json');
const treesOsm = readCache('osm/trees.json');
const pois = readCache('osm/pois.json').elements;
const braga = JSON.parse(fs.readFileSync(path.join(ROOT, 'map/braga.json'), 'utf8'));
// The private waypoints, if they're here: only for the streets they ask to have lined with houses.
const places = fs.existsSync(path.join(CACHE, 'places.json')) ? readCache('places.json').places : [];
const ground = await terrain();
const inExt = (x, z, m = 0) => x >= EXT.x0 - m && x <= EXT.x1 + m && z >= EXT.z0 - m && z <= EXT.z1 + m;

const tiles = new Map(allTiles().map(([i, j]) => [tileId(i, j), { id: tileId(i, j), box: tileBox(i, j), areas: [], lines: [], buildings: [], trees: [], streets: [], paths: [], rails: [], walls: [], signs: [] }]));
const tileAt = (x, z) => tiles.get(tileId(...tileOf(x, z)));
const tilesOver = (b, m = 0) => [...tiles.values()].filter((t) => overlaps(t.box, b, m));

// Where the ground is every 2 m: the tiles within 60 m of a track planned on the map (the last
// `npm run tracks`, so plan a new track before this), over the shooter's area, and every tile the open
// world's area touches, since a kart can be anywhere in it.
const FINE = new Set([...tilesOver(SHOOTER_BOX).map((t) => t.id), ...OPEN_TILES]);
for (const f of fs.readdirSync(path.join(ROOT, 'tracks')).filter((f) => f.endsWith('.js'))) {
  const { points } = (await import(`../tracks/${f}`)).default;
  for (const { p } of points) for (const t of tilesOver({ x0: p[0], x1: p[0], z0: p[2], z1: p[2] }, 60)) FINE.add(t.id);
}

// The ground as the tiles hold it, which index.js's height reads and a street on the ground takes:
// on each tile's grid, every 2 m on the FINE tiles and 10 m on the rest, the mean round each point in
// decimetres above ELEV0; between the points, bilinear; above the sea, as the LiDAR's. Each point is
// made when it's first asked for, and kept for the tile's terrain. A bridge's end takes its height
// from it (task 040), so its deck and the street it meets are at one height there; and on the FINE
// tiles, round where a street on a bridge or in a tunnel meets the streets on the ground, the ground
// is held to the street (lines.mjs's heldGround, task 043), not the embankment under the deck or the
// hill over the tunnel; and under a street's carriageway, to the street, where the LiDAR's ground stands
// more than a metre over it, and round a crown or a roof standing more than 5 m over it (streetBumps,
// task 026).
const lines = streetsOf(base, inExt);
// The decks DGT's point cloud saw (decks.mjs), for the flyovers and the bridges the map ends short.
const deck = decks();
if (!deck) console.log('no .cache/decks.json: the decks straight between their ends (node tools/decks.mjs)');
const held = heldGround(lines, ground, (e) => FINE.has(tileAt(...e.p)?.id), deck);
// And over the open world's area, where a street's carriageway would climb something the LiDAR classed
// as ground (a tree's crown, a roof) more than a metre over it, the street's own height; and where that
// stands more than 5 m over it, the whole crown or roof, beside the street too (task 026).
const bumps = streetBumps(lines, ground, OPEN_BOX);
console.log(`crowns and roofs the LiDAR took for ground, taken off the streets: ${bumps.blobs.map((b) => `(${b.x}, ${b.z}) ${b.over} m`).join(', ') || 'none'}`);
const holds = (x, z) => held.at(x, z) ?? bumps.at(x, z);
const grids = new Map(); // tile id → { step, n, dm }
const gridOf = (t) => {
  let g = grids.get(t.id);
  if (!g) {
    const step = FINE.has(t.id) ? 2 : 10, n = TILE / step + 1;
    grids.set(t.id, (g = { step, n, dm: new Float64Array(n * n).fill(NaN) }));
  }
  return g;
};
const gridDm = (t, i, j) => {
  const g = gridOf(t), k = j * g.n + i;
  if (Number.isNaN(g.dm[k])) {
    const x = t.box.x0 + i * g.step, z = t.box.z0 + j * g.step;
    g.dm[k] = dm(ground.mean(x, z, g.step, g.step === 2 && (held.near(x, z, g.step) || bumps.near(x, z, g.step)) ? holds : undefined) - ELEV0);
  }
  return g.dm[k];
};
const tileGround = (x, z) => {
  const t = tileAt(x, z);
  if (!t) return ground.at(x, z);
  const g = gridOf(t), fx = Math.max(0, Math.min(g.n - 1.001, (x - t.box.x0) / g.step)), fz = Math.max(0, Math.min(g.n - 1.001, (z - t.box.z0) / g.step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, h = (a, b) => gridDm(t, a, b) / 10;
  return ELEV0 + (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
};

// ---------------------------------------------------------------------------------------------
// The streets, the railway, and what the ground is.

// Every street and railway (lines.mjs, above), and the heights of those on a bridge's deck or in a
// tunnel, their ends at the ground as the tiles hold it.
const { heights, open } = levelHeights(lines, ground, tileGround, held, deck);

// What's walked or cycled (lines.mjs's pathsOf and pathLines, task 050) round the open world's area,
// where the world draws it: a footbridge and a path's tunnel at their heights, each flight of steps
// with its treads.
const walks = pathLines(pathsOf(pathsOsm, (x, z, m) => x >= OPEN_BOX.x0 - m && x <= OPEN_BOX.x1 + m && z >= OPEN_BOX.z0 - m && z <= OPEN_BOX.z1 + m), { ground, grid: tileGround, deck, lines, heights, elev0: ELEV0 });
const areas = []; // [kind, ring, holes]
for (const e of [...base.elements, ...parkingOsm]) {
  const t = e.tags || {};
  if (isLine(e)) {
    const pts = e.geometry.map(P);
    if (pts.some(([x, z]) => inExt(x, z, 50)) && isSquare(e, pts)) areas.push([AREA.indexOf('plaza'), simplify(pts.slice(0, -1), 0.5), []]);
    continue;
  }
  const c = AREA_OF(t);
  if (!c) continue;
  // A way is a ring; a relation's outer rings are each an area, with the inner rings in it as its holes
  // (a clearing in a wood, a pond in a park): task 016.
  const tol = c === 'forest' || c === 'farm' ? 2 : 1, near = (r) => r.length > 3 && r.some(([x, z]) => inExt(x, z, 200));
  if (e.type === 'way') {
    const r = e.geometry.map(P);
    if (near(r)) areas.push([AREA.indexOf(c), simplify(r, tol), []]);
    continue;
  }
  const inner = memberRings(e.members, 'inner').filter((r) => r.length > 3);
  for (const r of memberRings(e.members, 'outer')) if (near(r)) areas.push([AREA.indexOf(c), simplify(r, tol), inner.filter((h) => inside(r, ...h[0])).map((h) => simplify(h, tol))]);
}

// Big areas first, so smaller ones inside them are painted over them; squares last. Each is cut to
// the tiles it's on (a metre over, so they meet without a seam), its holes with it, and keeps its place
// in that order: [rank / 32768, rank % 32768, kind + 16 × its holes, n, ...points, then each hole's
// n and points].
{
  const plaza = AREA.indexOf('plaza');
  areas.sort((a, b) => (a[0] === plaza) - (b[0] === plaza) || ringArea(b[1]) - ringArea(a[1]));
  const cut = (p, q, axis, v) => { const t = (v - p[axis]) / (q[axis] - p[axis]); return axis ? [p[0] + (q[0] - p[0]) * t, v] : [v, p[1] + (q[1] - p[1]) * t]; };
  // Sutherland-Hodgman, against each side of the box in turn.
  const clip = (ring, b) => {
    let pts = ring;
    for (const [axis, v, keep] of [[0, b.x0, 1], [0, b.x1, -1], [1, b.z0, 1], [1, b.z1, -1]]) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length], a = (p[axis] - v) * keep >= 0, c = (q[axis] - v) * keep >= 0;
        if (a) out.push(p);
        if (a !== c) out.push(cut(p, q, axis, v));
      }
      pts = out;
      if (pts.length < 3) return [];
    }
    return pts;
  };
  areas.forEach(([kind, ring, holes], rank) => {
    if (ring.length < 3) return;
    for (const t of tilesOver(bounds(ring))) {
      const b = t.box, over = { x0: b.x0 - 1, x1: b.x1 + 1, z0: b.z0 - 1, z1: b.z1 + 1 }, piece = clip(ring, over);
      if (piece.length < 3 || ringArea(piece) <= 0.5) continue;
      const hs = holes.map((h) => clip(h, over)).filter((h) => h.length >= 3 && ringArea(h) > 0.5);
      t.areas.push(Math.floor(rank / 32768), rank % 32768, kind + 16 * hs.length, piece.length, ...packPts(piece), ...hs.flatMap((h) => [h.length, ...packPts(h)]));
    }
  });
}

// The streets on the ground and over it, for the buildings, the trees and the sights.
const streets = lines.filter((l) => l.level !== LEVEL.tunnel);

// Every street at its width, and the railway: the stretches of each that cross a tile, each [what,
// width, n, ...points, ...heights]: what is its kind and its level (16 times it), and a bridge or a
// tunnel has the height of each point after them, in decimetres above ELEV0.
for (const s of lines) {
  const pts = openThin(s.pts, 0.8), up = s.level === LEVEL.bridge || s.level === LEVEL.tunnel;
  for (const t of tilesOver(bounds(pts), s.w)) {
    const b = t.box, m = s.w / 2 + 2;
    let run = [];
    const flush = () => { if (run.length > 1) t.lines.push(s.k + 16 * s.level, Math.round(s.w * 10), run.length, ...packPts(run), ...(up ? run.map((p) => dm((heights.get(p) ?? ground.at(...p)) - ELEV0)) : [])); run = []; };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      if (overlaps(bounds([a, c]), b, m)) { if (!run.length) run.push(a); run.push(c); }
      else flush();
    }
    flush();
  }
}
// Where the streets leave the open world's area (open.mjs), and the shooter's (shooter.mjs), and the
// paths (task 050): each one's crossing, with the height of its road there above ELEV0, on the
// ground, a bridge's deck or a tunnel's road; a flight of steps', its tread's.
const roadAt = (l, i, t) => {
  const p = l.pts[i], q = l.pts[i + 1], x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t;
  if (l.flight) {
    const f = l.flight, L = f.pts.reduce((a, v, k) => (k ? a + Math.hypot(v[0] - f.pts[k - 1][0], v[1] - f.pts[k - 1][1]) : 0), 0);
    let s = t * Math.hypot(q[0] - p[0], q[1] - p[1]);
    for (let k = 1; k <= i; k++) s += Math.hypot(l.pts[k][0] - l.pts[k - 1][0], l.pts[k][1] - l.pts[k - 1][1]);
    if (f.pts[0] !== l.pts[0]) s = L - s;
    return f.ys[Math.max(0, Math.min(f.n - 1, Math.floor((s / (L || 1)) * f.n)))];
  }
  if (l.ys) return l.ys[i] * (1 - t) + l.ys[i + 1] * t;
  if (l.level !== LEVEL.bridge && l.level !== LEVEL.tunnel) return ground.at(x, z) - ELEV0;
  return (heights.get(p) ?? ground.at(...p)) * (1 - t) + (heights.get(q) ?? ground.at(...q)) * t - ELEV0;
};
const gates = gatesOf(OPEN, [...lines, ...walks], roadAt).map(({ x, z, heading, w, k, level, y }) => ({ x, z, heading, w, k, level, y }));
const shooterGates = gatesOf(SHOOTER, [...lines, ...walks], roadAt).map(({ x, z, heading, w, k, level, y }) => ({ x, z, heading, w, k, level, y }));
console.log(`ground: ${areas.length} areas, ${lines.length} streets and railways (${lines.filter((l) => l.level === LEVEL.bridge).length} on bridges, ${lines.filter((l) => l.level === LEVEL.tunnel).length} in tunnels, ${lines.filter((l) => l.level === LEVEL.under).length} under something, ${open} of them tunnels the map has under a bridge)`);

// ---------------------------------------------------------------------------------------------
// The buildings: all of the map's, those it lacks that the LiDAR saw (task 011), and houses filled
// in where the map has none and the point cloud wasn't fetched. Each one's height, roof and roof
// colour as DGT's LiDAR and orthophoto measured them (tools/roofs.mjs), in parts where its roof
// steps or turns a corner; guessed from what the map says where the LiDAR didn't see it (it was
// built after July 2025, or it's under a tree) and for the houses filled in.

const KIND = { house: 0, flats: 1, shop: 2, church: 3, civic: 4 };
const ROOF = { flat: 0, hipped: 1, gabled: 2, skillion: 3 };
const MAT = { tiles: 0, sheet: 1, flat: 2 };
// Where each footprint is from: OpenStreetMap, the LiDAR's buildings, Microsoft's outlines (where
// they lie closer over the LiDAR's), or invented.
const SOURCE = { osm: 0, lidar: 1, microsoft: 2, invented: 3 };
const COLORS = 8; // a number from each building's id, for a game's own variety
// Each footprint with the name the reference photos and refs/buildings.json give its building:
// way/<id> or relation/<id>.
const fps = buildingsOsm.elements.flatMap((el) => footprints({ elements: [el] }).map((e) => Object.assign(e, { name: `${el.type}/${el.id}` })));
if (!fs.existsSync(path.join(CACHE, 'roofs.json'))) throw new Error('No measured roofs in .cache/roofs.json: node tools/roofs.mjs');
const { buildings: roofs, found = [], seen: lidarTiles = [] } = readCache('roofs.json');
// Where the point cloud was boiled down, so the LiDAR saw every building there is.
const lidarSeen = new Set(lidarTiles);
const lidarAt = (x, z) => lidarSeen.has(tileKey(...toTM(x, z)));
// The pitch of a guessed roof: the measured roofs' own, the middle of them.
const PITCH = (() => {
  const all = Object.values(roofs).flatMap((m) => m.parts.filter((p) => p.pitch != null && p.roof !== 'skillion').map((p) => p.pitch)).sort((a, b) => a - b);
  return all.length ? Math.round(all[all.length >> 1]) : 27;
})();
// The ground a building stands on: at its lowest corner, in decimetres above ELEV0, so a row of
// houses steps down a hill as the real ones do. Its height is from there.
const footY = (ring) => dm(Math.min(...ring.map(([x, z]) => ground.at(x, z))) - ELEV0);
// The roofs' colours, as 127 that stand for them all (k-means over the measured ones), so each
// building's is one of them, in 7 bits.
const PALETTE = (() => {
  const all = Object.values(roofs).flatMap((m) => m.parts.filter((p) => p.colour).map((p) => p.colour));
  const rand = seeded(1010), K = Math.min(127, all.length);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  // k-means++'s start: each next centre far from those before.
  const c = [all[Math.floor(rand() * all.length)]], near = all.map((p) => d2(p, c[0]));
  while (c.length < K) {
    let r = rand() * near.reduce((s, v) => s + v, 0), k = 0;
    while (k < all.length - 1 && (r -= near[k]) > 0) k++;
    c.push(all[k]);
    all.forEach((p, i) => { near[i] = Math.min(near[i], d2(p, all[k])); });
  }
  for (let it = 0; it < 25; it++) {
    const sum = c.map(() => [0, 0, 0, 0]);
    for (const p of all) { let b = 0; for (let k = 1; k < K; k++) if (d2(p, c[k]) < d2(p, c[b])) b = k; sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; sum[b][3]++; }
    sum.forEach((s, k) => { if (s[3]) c[k] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return c.map((p) => p.map(Math.round));
})();
const paletteOf = (c) => {
  if (!c) return 127;
  let b = 0;
  for (let k = 1; k < PALETTE.length; k++) if ((c[0] - PALETTE[k][0]) ** 2 + (c[1] - PALETTE[k][1]) ** 2 + (c[2] - PALETTE[k][2]) ** 2 < (c[0] - PALETTE[b][0]) ** 2 + (c[1] - PALETTE[b][1]) ** 2 + (c[2] - PALETTE[b][2]) ** 2) b = k;
  return b;
};
// OpenStreetMap's roof:colour, where the LiDAR didn't see the roof: "#rrggbb", "#rgb" or a name.
const NAMED = { gray: [128, 128, 128], grey: [128, 128, 128], silver: [192, 192, 192], white: [240, 240, 240], black: [40, 40, 40], red: [170, 70, 50], brown: [120, 80, 60], lightsalmon: [255, 160, 122] };
const parseColour = (v) => {
  if (!v) return null;
  const s = v.trim().toLowerCase(), hex = s.replace(/^#/, '');
  if (/^[0-9a-f]{6}$/.test(hex)) return [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16));
  if (/^[0-9a-f]{3}$/.test(hex)) return [0, 1, 2].map((k) => parseInt(hex[k] + hex[k], 16));
  return NAMED[s] ?? null;
};
// What a pitched roof is covered with, from its colour: terracotta tiles (reddish, and not grey),
// or sheets (metal, fibre cement, slate: greys). A flat roof is its own.
const matOf = (roof, c, osm) => {
  if (roof === ROOF.flat) return MAT.flat;
  if (!c) return osm === 'metal' ? MAT.sheet : MAT.tiles;
  const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return r === mx && mx - mn > 0.15 * mx && r - b > 20 ? MAT.tiles : MAT.sheet;
};
// The way a roof runs (or a skillion faces), as which of four ways from its footprint's axis (as
// rectAxis has it from the points a game gets): along it, back along it, across it to its left
// (+90°), to its right.
const dirCode = (ring, dir) => {
  const axis = rectAxis(ring.map(([x, z]) => [half(x) / 2, half(z) / 2]));
  const off = (k) => { const d = dir - axis - [0, Math.PI, Math.PI / 2, -Math.PI / 2][k]; return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); };
  return [0, 1, 2, 3].reduce((b, k) => (off(k) < off(b) ? k : b), 0);
};
// Each building's facade (task 017, tools/facades.mjs): as a session saw it in its photos
// (refs/buildings.json), or guessed from what the map says of it and from the buildings seen.
const seenFaces = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'buildings.json'), 'utf8')).buildings;
const guessFace = guesser(seenFaces);
// What the session couldn't tell of one it saw (its kind, too, when it was far) is guessed as for its
// kind; one it looked for and didn't see (`seen` null) is guessed whole.
const faceOf = (name, facts) => {
  const e = seenFaces[name];
  if (!e?.seen) return { ...guessFace(name, facts), floors: null, seen: false };
  const g = guessFace(name, { ...facts, type: e.type ?? undefined });
  return { type: e.type ?? g.type, colour: e.colour ?? g.colour, material: e.material ?? g.material, ground: e.ground ?? g.ground, base: e.base ?? null, balconies: e.balconies ?? g.balconies, shutters: e.shutters ?? g.shutters, floors: e.floors ?? null, seen: true };
};
// The shops, cafés, banks and offices with a name (fetch.mjs's `shops`), for their buildings' ground
// floors and signs.
const shopsOsm = fs.existsSync(path.join(CACHE, 'osm', 'shops.json')) ? readCache('osm/shops.json').elements.filter((e) => e.tags?.name && (e.lat ?? e.center?.lat)) : [];
if (!shopsOsm.length) console.log('no .cache/osm/shops.json: no shops on the ground floors (node tools/fetch.mjs shops)');
const shopGrid = new Grid(40);
for (const e of shopsOsm) { const [x, z] = P(e.center ?? e); shopGrid.add(x, z, { x, z, name: e.tags.name, e }); }
// The shops in a footprint, or within 3 m of it.
const shopsIn = (ring) => {
  const b = bounds(ring), out = [];
  for (const s of new Set(shopGrid.near((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, Math.ceil(Math.hypot(b.x1 - b.x0, b.z1 - b.z0) / 80) + 1))) {
    if (s.x < b.x0 - 3 || s.x > b.x1 + 3 || s.z < b.z0 - 3 || s.z > b.z1 + 3) continue;
    if (inside(ring, s.x, s.z) || ring.some((p, i) => segDist(s.x, s.z, { x: p[0], z: p[1] }, { x: ring[(i + 1) % ring.length][0], z: ring[(i + 1) % ring.length][1] }) < 3)) out.push(s);
  }
  return out;
};
const signed = []; // [building's ring, its face, its ground's lowest, its shops]: their signs, once the streets are known
const NONE = 63;
// [n, what, roof, h, y, rise, ...points, face, colours, base], each a 16-bit number. what: its kind (3
// bits), a number 0–7 from its id (3), roof (2), which ends of its ridge are hipped (2), what the
// roof's covered with (2), measured (1), where its footprint is from (2, SOURCE). roof: its pitch in
// degrees (6 bits), the way it runs (2) and its colour in PALETTE (7, 127 for none). h, the eaves,
// from y, the ground, and rise, the ridge over the eaves, in decimetres. face: its facade's kind (4
// bits, TYPES), its walls' material (4), its ground floor (3), its balconies (3), and 1 if a session
// saw it. colours: its walls' colour (6, COLOURS) and its shutters' (6, NONE for none). base: its
// ground floor's colour (6, NONE where it's the walls'), its material (4), and its storeys (5). In a
// tile they're in rows 20 m deep, west to east, each one's ground and first point the step from the
// one before's, and a four-cornered one's last corner less where the other three would put it, as a
// parallelogram (packBuildings): which packs smaller.
const outlines = []; // every building's (or part's) outline, for the streets' pavements
const putBuilding = (ring, cx, cz, b) => {
  outlines.push(ring);
  const what = b.kind | (b.color << 3) | (b.roof << 6) | (b.ends << 8) | (b.mat << 10) | (b.measured ? 1 << 12 : 0) | (SOURCE[b.source] << 13);
  const roof = Math.min(63, Math.round(b.pitch)) | (dirCode(ring, b.dir) << 6) | (paletteOf(b.rgb) << 8);
  const f = b.face, floors = Math.min(31, b.floors ?? floorsOf(f.type, dm(b.h) / 10));
  const face = TYPE[f.type] | (MATERIAL[f.material] << 4) | (GROUND_OF[f.ground] << 8) | (BALCONY[f.balconies] << 11) | (f.seen ? 1 << 14 : 0);
  const colours = COLOUR[f.colour] | ((f.shutters === 'none' ? NONE : COLOUR[f.shutters]) << 6);
  const baseOf = f.base ? COLOUR[f.base.colour] | (MATERIAL[f.base.material] << 6) : NONE;
  tileAt(cx, cz).buildings.push([ring.length, what, roof, dm(b.h), b.y, Math.max(0, dm(b.ridge - b.h)), ...packPts(ring), face, colours, baseOf | (floors << 10)]);
};
const packBuildings = (list) => {
  let x = 0, z = 0, y = 0;
  return [...list].sort((a, b) => Math.floor(a[7] / 40) - Math.floor(b[7] / 40) || a[6] - b[6]).flatMap((r) => {
    const out = [...r];
    out[4] -= y, out[6] -= x, out[7] -= z;
    if (r[0] === 4) out[12] += r[8], out[13] += r[9];
    [y, x, z] = [r[4], r[6], r[7]];
    return out;
  });
};
// A guessed pitched roof over a footprint: hipped or gabled along its long side, at the measured
// roofs' pitch.
const guessRoof = (ring, roof) => {
  const r = minRect(ring), rise = roof === ROOF.flat ? 0 : r.W * Math.tan(PITCH / 57.2958);
  return { dir: r.angle, pitch: roof === ROOF.flat ? 0 : PITCH, rise, ends: roof === ROOF.hipped ? 3 : 0 };
};
let real = 0, lidar = 0, stands = 0, measured = 0, parts = 0;
{
  const church = new Set(['church', 'cathedral', 'chapel', 'basilica', 'religious', 'monastery', 'convent']);
  const flats = new Set(['apartments', 'residential', 'dormitory', 'hotel']);
  const house = new Set(['house', 'detached', 'semidetached_house', 'terrace', 'bungalow', 'duplex']);
  const civic = new Set(['school', 'university', 'college', 'kindergarten', 'hospital', 'public', 'civic', 'government', 'museum', 'fire_station']);
  const low = new Set(['roof', 'carport', 'garage', 'garages', 'shed', 'kiosk']);
  const rnd = hash;
  // Its kind, from its tag and its size; from its height too, where that was measured (`eaves`,
  // above its ground): a house of more than three storeys is flats, flats under two a house.
  const kindOf = (t, a, eaves) => {
    if (church.has(t.building)) return KIND.church;
    if (civic.has(t.building)) return KIND.civic;
    if (house.has(t.building)) return eaves > 10 ? KIND.flats : KIND.house;
    if (flats.has(t.building)) return eaves != null && eaves < 6.5 && a < 250 ? KIND.house : KIND.flats;
    if (t.building !== 'yes') return KIND.shop;
    if (eaves == null) return a < 220 ? KIND.house : a < 1400 ? KIND.flats : KIND.shop;
    if (a >= 1400) return eaves >= 15 ? KIND.flats : KIND.shop;
    return eaves >= 9.5 ? KIND.flats : a < 400 ? KIND.house : eaves >= 6 ? KIND.flats : KIND.shop;
  };
  const ROOFS = { flat: ROOF.flat, hipped: ROOF.hipped, gabled: ROOF.gabled, skillion: ROOF.skillion };
  // A building's facade, one for all its parts: as seen, or guessed from its kind as a whole (from
  // its tags, its footprint and its eaves over its lowest ground); its storeys counted, if they were,
  // for its tallest part. And its shops, for their signs.
  const facadeOf = (name, pts, t, eaves) => {
    const shops = shopsIn(pts), face = faceOf(name, { kind: kindOf(t, ringArea(pts), eaves), tags: t, area: ringArea(pts), eaves, shop: shops.length > 0 });
    signed.push([pts, face, shops, name]);
    return face;
  };
  // A building as the LiDAR measured it: each part on its own ground, its eaves and ridge from there.
  // Its `color` number is its own, or with `color` a function, each part's own from where it is.
  const putMeasured = (pts, t, m, color, source, name) => {
    const a = ringArea(pts), seen = m.parts.filter((p) => p.roof), top = Math.max(...seen.map((p) => p.eaves));
    const low = ELEV0 + Math.min(...m.parts.map((p) => footY(p.pts ?? pts))) / 10;
    // One the map lacks, nobody has looked at, is a building to each part, as its kind is.
    const whole = source === 'osm' || seenFaces[name] ? facadeOf(name, pts, t, top - low) : null;
    let k = 0;
    for (const p of m.parts) {
      const ring = simplify(p.pts ?? pts, 0.3);
      if (ring.length < 3) continue;
      const y = footY(ring), base = ELEV0 + y / 10;
      const px = ring.reduce((s, q) => s + q[0], 0) / ring.length, pz = ring.reduce((s, q) => s + q[1], 0) / ring.length;
      let b;
      if (p.roof) {
        const h = Math.max(2.4, p.eaves - base), roof = ROOFS[p.roof];
        // A part of a building the map lacks is a building of its own, as far as anyone can tell: of
        // its own kind, from its own size and height.
        const kind = source === 'osm' ? kindOf(t, a, top - base) : kindOf(t, ringArea(ring), h);
        b = { kind, roof, h, ridge: Math.max(h, p.ridge - base), dir: p.dir ?? minRect(ring).angle, pitch: p.pitch ?? 0, ends: p.ends ?? 0, rgb: p.colour, measured: true };
        b.mat = matOf(roof, p.colour, t['roof:material']);
      } else {
        // A piece of it the LiDAR saw nothing over: low, and flat (a passage, a yard roofed over).
        b = { kind: KIND.shop, roof: ROOF.flat, h: 3, ridge: 3, dir: minRect(ring).angle, pitch: 0, ends: 0, rgb: null, mat: MAT.flat, measured: false };
      }
      const face = whole ?? facadeOf(`${name}#${k++}`, ring, t, b.h);
      const floors = face.floors && p.roof && p.eaves >= top - 1 ? face.floors : null;
      putBuilding(ring, px, pz, { ...b, color: typeof color === 'function' ? color(px, pz) : color, y, source, face, floors });
      parts++;
    }
    measured++;
  };
  const isMeasured = (m) => m && m.cover >= 0.35 && m.parts.some((p) => p.roof);
  for (const e of fps) {
    let pts = ringOf(e);
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
    if (pts.length < 3) continue;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    if (!inExt(cx, cz)) continue;
    const t = e.tags, a = ringArea(pts);
    if (a < 12) continue;
    const color = Math.floor(rnd(e.id, 7) * COLORS), levels = Number(t['building:levels']);
    const m = roofs[e.id];
    if (isMeasured(m)) {
      putMeasured(pts, t, m, color, 'osm', e.name);
      real++;
      continue;
    }
    // Guessed, from its tags.
    let kind = kindOf(t, a, null);
    let h;
    if (Number(t.height)) h = Number(t.height);
    else if (levels) h = levels * STOREY + BASE;
    else if (low.has(t.building)) h = 3;
    else h = kind === KIND.house ? 3.4 + 3 * Math.floor(1 + rnd(e.id, 1) * 1.6) : kind === KIND.flats ? 3 * (4 + Math.floor(rnd(e.id, 2) * 4)) + 0.6 : kind === KIND.church ? 12 : kind === KIND.civic ? (a > 4000 ? 14 : 7.5 + Math.floor(rnd(e.id, 3) * 2) * 3) : 7;
    if (kind === KIND.house && h > 10) kind = KIND.flats;
    const shape = t['roof:shape'];
    let roof = shape === 'flat' ? ROOF.flat : shape === 'gabled' ? ROOF.gabled : shape === 'skillion' ? ROOF.skillion : ['hipped', 'half-hipped', 'pyramidal'].includes(shape) ? ROOF.hipped : null;
    if (roof === null) roof = kind === KIND.house ? (rnd(e.id, 4) < 0.7 ? ROOF.hipped : ROOF.gabled) : kind === KIND.flats ? (rnd(e.id, 5) < 0.45 ? ROOF.hipped : ROOF.flat) : kind === KIND.church ? ROOF.gabled : kind === KIND.civic ? (rnd(e.id, 6) < 0.5 ? ROOF.hipped : ROOF.flat) : ROOF.flat;
    if (low.has(t.building)) roof = ROOF.flat;
    const ring = simplify(pts, 0.3);
    if (ring.length < 3) continue;
    const g = guessRoof(ring, roof), rgb = parseColour(t['roof:colour']), face = facadeOf(e.name, pts, t, h);
    putBuilding(ring, cx, cz, { kind, roof, color, h, ridge: h + g.rise, dir: g.dir, pitch: g.pitch, ends: g.ends, rgb, mat: matOf(roof, rgb, t['roof:material']), y: footY(ring), measured: false, source: 'osm', face, floors: face.floors });
    real++;
  }
  // The buildings the map lacks, as the LiDAR saw them: a block of them as one, in parts where the
  // roofs step, each part with its kind from its size and height alone and its facade colour from
  // where it is. Not in the stadium's grounds: its stands are the stadium's, which the games draw
  // (the sight).
  const pitch = base.elements.find((e) => e.type === 'way' && e.id === 22660434);
  const grounds = pitch ? base.elements.filter((e) => e.type === 'way' && e.tags?.leisure === 'stadium').map((e) => e.geometry.map(P)).filter((r) => inside(r, ...P(pitch.geometry[0]))) : [];
  const colorAt = (x, z) => Math.floor(rnd(Math.round(x * 2) * 20011 + Math.round(z * 2), 7) * COLORS);
  for (const f of found) {
    const cx = f.pts.reduce((s, p) => s + p[0], 0) / f.pts.length, cz = f.pts.reduce((s, p) => s + p[1], 0) / f.pts.length;
    if (!inExt(cx, cz) || !isMeasured(f)) continue;
    if (grounds.some((r) => inside(r, cx, cz))) { stands++; continue; }
    putMeasured(f.pts, { building: 'yes' }, f, colorAt, f.src, `lidar/x${Math.round(cx)}z${Math.round(cz)}`);
    lidar++;
  }
}

// Where the point cloud wasn't fetched, the LiDAR can't say which buildings OpenStreetMap is
// missing: there, where the land is built-up and a street's frontage is empty, line it with houses,
// and flats on the main roads. Never in a park, a wood, a field or a pitch, on a street, or over a
// building. Each street is taken at least W_MIN wide, as the games once drew it, with a pavement as wide
// as the buildings leave room for. The streets a note on the map asked for (the waypoints marked
// `rows`) get them all down both sides. Where the LiDAR saw, nothing is invented: only what's there.
let infill = 0;
{
  const allB = [], bgrid = new Grid(40);
  const addB = (r) => { allB.push(r); for (const [x, z] of r) bgrid.add(x, z, allB.length - 1); };
  for (const e of fps) { const r = ringOf(e); if (r.some(([x, z]) => inExt(x, z, 50))) addB(r); }
  for (const f of found) addB(f.pts);
  const nearB = (x, z, reach) => [...new Set(bgrid.near(x, z, reach))];
  // The buildings' walls, a point every 2 m, for how much room there is for a pavement.
  const vgrid = new Grid(20);
  for (const r of allB) for (let i = 1; i < r.length; i++) {
    const [ax, az] = r[i - 1], [bx, bz] = r[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
    for (let f = 0; f < n; f++) vgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n]);
  }
  const GREEN = new Set(['farm', 'grass', 'scrub', 'forest', 'park', 'cemetery', 'sport', 'water']);
  const agrid = new Grid(100);
  areas.forEach(([, r], i) => { const b = bounds(r); for (let a = Math.floor(b.x0 / 100); a <= Math.floor(b.x1 / 100); a++) for (let c = Math.floor(b.z0 / 100); c <= Math.floor(b.z1 / 100); c++) agrid.add(a * 100, c * 100, i); });
  const landAt = (x, z) => { let best = null, ba = Infinity; for (const i of agrid.near(x, z, 0)) { const [k, r, hs] = areas[i]; if (inside(r, x, z) && !hs.some((h) => inside(h, x, z))) { const a = ringArea(r); if (a < ba) { ba = a; best = AREA[k]; } } } return best; };
  // Every street's carriageway, for keeping off them: [x0, z0, x1, z1, its half width, its id].
  const sgrid = new Grid(30);
  for (const s of streets) {
    if (s.k > 6) continue;
    const hw = Math.max(W_MIN, s.w) / 2;
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 15)), seg = [ax, az, bx, bz, hw, s.id];
      for (let f = 0; f <= n; f++) sgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, seg);
    }
  }
  // Is (x, z) on a street, or within 6 m of one that crosses this one (not `own`)?
  const onStreet = (x, z, own) => sgrid.near(x, z, 1).some(([ax, az, bx, bz, hw, id]) => segDist(x, z, { x: ax, z: az }, { x: bx, z: bz }) < (id === own ? hw + 1.5 : Math.max(6, hw + 1.5)));
  const rowNames = new Set(places.filter((p) => p.rows).map((p) => {
    let best = null, bd = Infinity;
    for (const s of streets) if (s.k >= 2 && s.k <= 5 && s.t.name) for (let i = 1; i < s.pts.length; i++) { const d = segDist(p.x, p.z, { x: s.pts[i - 1][0], z: s.pts[i - 1][1] }, { x: s.pts[i][0], z: s.pts[i][1] }); if (d < bd) { bd = d; best = s.t.name; } }
    return best;
  }));
  const rand = seeded(4242);
  const why = { lidar: 0, green: 0, empty: 0, street: 0, building: 0 };
  for (const s of streets) {
    if (s.k < 2 || s.k > 5 || String(s.t.highway).endsWith('_link')) continue;
    if (!s.pts.some(([x, z]) => inExt(x, z))) continue;
    // The street every 2 m.
    const line = [];
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2));
      for (let f = 0; f < n; f++) line.push([ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n]);
    }
    line.push(s.pts[s.pts.length - 1]);
    const w = Math.max(W_MIN, s.w), main = s.k <= 4, row = rowNames.has(s.t.name);
    const sidewalk = (right) => { const t = s.t, v = t[`sidewalk:${right ? 'right' : 'left'}`] ?? t['sidewalk:both'] ?? t.sidewalk; return v == null ? null : !['no', 'none', right ? 'left' : 'right'].includes(v); };
    for (const side of [-1, 1]) {
      let k = 0;
      while (k + 3 < line.length) {
        const [x, z] = line[k], [x2, z2] = line[k + 3];
        const tl = Math.hypot(x2 - x, z2 - z) || 1, tx = (x2 - x) / tl, tz = (z2 - z) / tl, rx = -tz * side, rz = tx * side;
        // The pavement: as wide as the buildings leave room for, or none out in the open.
        let room = Infinity;
        for (const [vx, vz] of vgrid.near(x, z, 1)) {
          const along = (vx - x) * tx + (vz - z) * tz, o = (vx - x) * rx + (vz - z) * rz;
          if (Math.abs(along) < 8 && o > w / 2 - 1) room = Math.min(room, o - w / 2);
        }
        const tag = sidewalk(side > 0), pave = tag === false || (tag === null && room >= 25) ? 0 : Math.max(1.2, Math.min(3.2, room - 0.3));
        const wide = 9 + rand() * (main ? 9 : 6), deep = main ? 12 + rand() * 6 : 9 + rand() * 4, set = w / 2 + Math.max(1.5, pave) + 0.5;
        const quad = [[0, set], [wide, set], [wide, set + deep], [0, set + deep]].map(([a, b]) => [x + tx * a + rx * b, z + tz * a + rz * b]);
        const mid = [x + tx * (wide / 2) + rx * (set + deep / 2), z + tz * (wide / 2) + rz * (set + deep / 2)];
        const land = landAt(mid[0], mid[1]);
        const builtUp = row || (land && !GREEN.has(land)) || (!land && nearB(mid[0], mid[1], 2).length >= 4);
        const clear = builtUp && inExt(mid[0], mid[1]) && !quad.concat([mid]).some(([qx, qz]) => onStreet(qx, qz, s.id));
        const free = clear && !nearB(mid[0], mid[1], 1).some((b) => quad.concat([mid]).some(([qx, qz]) => inside(allB[b], qx, qz)) || allB[b].some(([bx, bz]) => inside(quad, bx, bz)));
        if (!builtUp) why[land ? 'green' : 'empty']++;
        else if (!clear) why.street++;
        else if (!free) why.building++;
        if (free && (row || rand() < 0.85)) {
          const kind = main ? (rand() < 0.75 ? KIND.flats : KIND.house) : rand() < 0.85 ? KIND.house : KIND.flats;
          const h = kind === KIND.flats ? 3 * (3 + Math.floor(rand() * 4)) + 0.6 : 3.4 + 3 * Math.floor(1 + rand() * 1.5);
          const roof = kind === KIND.house ? (rand() < 0.65 ? ROOF.hipped : ROOF.gabled) : rand() < 0.5 ? ROOF.hipped : ROOF.flat;
          const color = Math.floor(rand() * COLORS);
          // Where the LiDAR saw, it keeps its turn, so no house beyond moves, but nothing is built.
          if (quad.concat([mid]).some(([qx, qz]) => lidarAt(qx, qz))) why.lidar++;
          else {
            const g = guessRoof(quad, roof), face = { ...guessFace(`invented/x${Math.round(mid[0])}z${Math.round(mid[1])}`, { kind, area: ringArea(quad), eaves: h }), seen: false };
            putBuilding(quad, mid[0], mid[1], { kind, roof, color, h, ridge: h + g.rise, dir: g.dir, pitch: g.pitch, ends: g.ends, rgb: null, mat: matOf(roof, null), y: footY(quad), measured: false, source: 'invented', face });
            infill++;
          }
          addB(quad);
          k += Math.max(2, Math.round((wide + (row || rand() < 0.7 ? 0.4 : 3 + rand() * 4)) / 2));
        } else k += 3;
      }
    }
  }
  console.log(`buildings: ${real} from the map and ${lidar} it lacks from the LiDAR (${stands} left to the stadium; ${measured} measured, in ${parts} parts; guessed roofs at ${PITCH}°), ${infill} filled in (${rowNames.size} streets in rows); frontage skipped for ${JSON.stringify(why)}`);
  const faces = signed.filter(([, f]) => f.seen).length;
  console.log(`facades: ${faces} seen, ${signed.length - faces} guessed; ${Object.entries(Object.groupBy(signed, ([, f]) => f.type)).map(([k, v]) => `${v.length} ${k}`).join(', ')}`);
}

// ---------------------------------------------------------------------------------------------
// The shops' signs (task 017): each shop, café, bank or office the map names, over its building's
// ground floor, on the wall nearest it that faces a street; and where a photo shows a sign the map
// has no shop for (refs/buildings.json's `signs`), on the wall that faced the camera. Its colour is
// the photo's where a sign seen has its name, else a dark grey. Each [x0, z0, x1, z1, y, h, colour,
// text]: its ends along the wall, 5 cm out from it, the way round that it faces (z1 - z0, x0 - x1), out;
// its bottom over elev0 and its height, in metres; and its colour in COLOURS. No logos: the name, as
// plain text.
let signs = 0;
{
  const photos = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos.map((p) => [p.id, p]));
  const views = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8')).viewpoints.map((v) => [v.id, v]));
  const sgrid = new Grid(30);
  for (const s of streets) {
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 15));
      for (let f = 0; f <= n; f++) sgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax, az, bx, bz, s.w / 2]);
    }
  }
  // How far a point is from a street's edge.
  const offStreet = (x, z) => Math.min(Infinity, ...sgrid.near(x, z, 1).map(([ax, az, bx, bz, hw]) => segDist(x, z, { x: ax, z: az }, { x: bx, z: bz }) - hw));
  const built = new Inside(outlines);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  // Each shop to one building: the smallest it's in, else the one whose wall is nearest, within 3 m.
  const owners = new Grid(40);
  signed.forEach(([pts], k) => {
    const b = bounds(pts);
    for (let i = Math.floor((b.x0 - 3) / 40); i <= Math.floor((b.x1 + 3) / 40); i++) for (let j = Math.floor((b.z0 - 3) / 40); j <= Math.floor((b.z1 + 3) / 40); j++) owners.add(i * 40, j * 40, k);
  });
  const shopsOf = new Map();
  for (const s of shopGrid.m.values()) for (const shop of s) {
    let best = -1, bd = 3, ba = Infinity;
    for (const k of new Set(owners.near(shop.x, shop.z, 0))) {
      const pts = signed[k][0];
      if (inside(pts, shop.x, shop.z)) { const a = ringArea(pts); if (bd > 0 || a < ba) { best = k; bd = 0; ba = a; } continue; }
      if (bd === 0) continue;
      const d = Math.min(...pts.map((p, i) => segDist(shop.x, shop.z, { x: p[0], z: p[1] }, { x: pts[(i + 1) % pts.length][0], z: pts[(i + 1) % pts.length][1] })));
      if (d < bd) { bd = d; best = k; }
    }
    if (best >= 0) shopsOf.set(best, [...(shopsOf.get(best) ?? []), shop]);
  }
  signed.forEach(([pts, face, , name], k) => {
    const shops = shopsOf.get(k) ?? [], seen = seenFaces[name]?.signs ?? [];
    if (!shops.length && !seen.length) return;
    // Its walls, each with its outward side and whether a street is in front of it, and not another
    // building (a wall it shares with the next one in a row).
    const walls = pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, out = inside(pts, mx + uz * 0.1, mz - ux * 0.1) ? -1 : 1;
      const nx = uz * out, nz = -ux * out;
      const open = !built.has(mx + nx, mz + nz) && !built.has(mx + nx * 3, mz + nz * 3);
      return { a, b, l, ux, uz, nx, nz, mx, mz, open, front: open && offStreet(mx + nx * 4, mz + nz * 4) < 8 };
    }).filter((w) => w.l >= 2);
    if (!walls.length) return;
    const T = TYPES[TYPE[face.type]], put = (w, at, text, colour) => {
      const width = Math.min(w.l - 0.4, Math.max(2.4, Math.min(8, 0.3 * text.length + 1.2)));
      const s = Math.max(0.2 + width / 2, Math.min(w.l - 0.2 - width / 2, at));
      // Its ends the way round that it faces (dz, -dx), out from the wall.
      const flip = w.nx * w.uz - w.nz * w.ux < 0 ? -1 : 1;
      const x0 = w.a[0] + w.ux * (s - (flip * width) / 2) + w.nx * 0.05, z0 = w.a[1] + w.uz * (s - (flip * width) / 2) + w.nz * 0.05;
      const x1 = w.a[0] + w.ux * (s + (flip * width) / 2) + w.nx * 0.05, z1 = w.a[1] + w.uz * (s + (flip * width) / 2) + w.nz * 0.05;
      const y = tileGround((x0 + x1) / 2, (z0 + z1) / 2) - ELEV0 + Math.max(2.2, T.ground - 0.95);
      const r2 = (v) => Math.round(v * 100) / 100;
      tileAt((x0 + x1) / 2, (z0 + z1) / 2).signs.push([r2(x0), r2(z0), r2(x1), r2(z1), r2(y), 0.7, COLOUR[colour] ?? COLOUR['dark-grey'], text]);
      signs++;
    };
    const left = [...seen];
    const toWall = (s, w) => segDist(s.x, s.z, { x: w.a[0], z: w.a[1] }, { x: w.b[0], z: w.b[1] });
    for (const s of shops) {
      const match = left.findIndex((g) => norm(g.text).includes(norm(s.name)) || norm(s.name).includes(norm(g.text)));
      const colour = match >= 0 ? left.splice(match, 1)[0].colour : 'dark-grey';
      // None for a shop in a shopping centre, more than 12 m in from every wall onto the open.
      const outside = walls.filter((w) => w.open);
      if (match < 0 && (!outside.length || Math.min(...outside.map((w) => toWall(s, w))) > 12)) continue;
      const w = (outside.length ? outside : walls).reduce((best, w) => {
        const d = toWall(s, w) + (w.front ? 0 : 30);
        return d < best.d ? { w, d } : best;
      }, { w: null, d: Infinity }).w;
      put(w, (s.x - w.a[0]) * w.ux + (s.z - w.a[1]) * w.uz, s.name, colour);
    }
    // The signs a photo showed that the map has no shop for: along the wall that faced its camera.
    if (left.length) {
      const by = seenFaces[name].seen ?? '', v = by.startsWith('viewpoint:') ? views.get(by.slice(10)) : null, p = photos.get(by);
      const [cx, cz] = v ? [v.x, v.z] : p ? P(p.photo) : [walls[0].mx + walls[0].nx, walls[0].mz + walls[0].nz];
      const facing = walls.filter((w) => (cx - w.mx) * w.nx + (cz - w.mz) * w.nz > 0 && w.open), fronts = facing.filter((w) => w.front);
      const w = (fronts.length ? fronts : facing.length ? facing : walls).reduce((a, b) => (Math.hypot(a.mx - cx, a.mz - cz) / a.l < Math.hypot(b.mx - cx, b.mz - cz) / b.l ? a : b));
      left.forEach((g, k) => put(w, (w.l * (k + 0.5)) / left.length, g.text, g.colour));
    }
  });
  console.log(`signs: ${signs}, from ${shopsOsm.length} named shops and the photos`);
}

// ---------------------------------------------------------------------------------------------
// Trees: the ones on the map, and woods and parks filled in, none on a street. Each is [x, z, how]:
// how is 1 for a pine, plus 2 for one filled in.

let nTrees = 0;
{
  const rnd = seeded(9);
  const sgrid = new Grid(30);
  for (const s of streets) {
    if (s.k > 6) continue;
    for (let i = 1; i < s.pts.length; i++) { const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 15)); for (let f = 0; f <= n; f++) sgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax, az, bx, bz, Math.max(W_MIN, s.w) / 2]); }
  }
  // And none of those filled in on a path (task 050).
  const pgrid = new Grid(30);
  for (const p of walks) for (let i = 1; i < p.pts.length; i++) { const [ax, az] = p.pts[i - 1], [bx, bz] = p.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 15)); for (let f = 0; f <= n; f++) pgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax, az, bx, bz, p.w / 2]); }
  const onPath = (x, z) => pgrid.near(x, z, 1).some(([ax, az, bx, bz, hw]) => segDist(x, z, { x: ax, z: az }, { x: bx, z: bz }) < hw + 0.5);
  const ok = (x, z, how) => inExt(x, z) && !sgrid.near(x, z, 1).some(([ax, az, bx, bz, hw]) => segDist(x, z, { x: ax, z: az }, { x: bx, z: bz }) < hw + 0.5) && !(how & 2 && onPath(x, z));
  const plant = (x, z, how) => { if (ok(x, z, how)) { tileAt(x, z).trees.push(half(x), half(z), how); nTrees++; } };
  for (const e of treesOsm.elements) {
    if (e.type === 'node') { const [x, z] = P(e); plant(x, z, e.tags && e.tags.leaf_type === 'needleleaved' ? 1 : 0); }
    else for (const g of e.geometry) { const [x, z] = P(g); plant(x, z, 0); }
  }
  // One tree to so many square metres, pines among the woods' trees.
  const fill = { forest: 200, park: 420, scrub: 900 };
  for (const e of base.elements) {
    const c = AREA_OF(e.tags || {});
    if (!fill[c] || e.type !== 'way') continue;
    const r = e.geometry.map(P), b = bounds(r);
    if (!overlaps(b, EXT)) continue;
    const n = Math.min(4000, Math.round(((b.x1 - b.x0) * (b.z1 - b.z0)) / fill[c]));
    for (let k = 0; k < n; k++) {
      const x = b.x0 + rnd() * (b.x1 - b.x0), z = b.z0 + rnd() * (b.z1 - b.z0);
      const pine = c === 'forest' && rnd() < 0.6 ? 1 : 0;
      if (inside(r, x, z)) plant(x, z, 2 + pine);
    }
  }
  console.log(`trees: ${nTrees}`);
}

// ---------------------------------------------------------------------------------------------
// Every street in the open world's area as surfaces (streets.mjs, task 033): the carriageways at
// their real widths, joined at the junctions, the kerbs, the pavements as wide as the buildings
// leave room for, and the lines painted on them, at their levels; and the paths (task 050), each
// flight of steps a tread at a time with its handrails; cut to the tiles. And the walls, fences,
// railings, hedges and gates (walls.mjs, task 013), each cut to the tiles and at the edge of a
// carriageway or a path on the ground it stands on.

const wallList = fs.existsSync(path.join(CACHE, 'walls.json')) ? readCache('walls.json').walls : null;
if (!wallList) console.log('no .cache/walls.json: no walls (node tools/walls.mjs)');
let nWalls = 0;
{
  const nodes = onCarriageways(readCache('osm/street.json')).elements.filter((e) => e.type === 'node');
  const rings = (kind) => areas.filter(([k]) => k === AREA.indexOf(kind)).map(([, r]) => r);
  const B = OPEN_BOX, over = tilesOver(B).map((t) => ({ id: t.id, box: { x0: Math.max(t.box.x0, B.x0), x1: Math.min(t.box.x1, B.x1), z0: Math.max(t.box.z0, B.z0), z1: Math.min(t.box.z1, B.z1) } }));
  const { cuts, stats } = streetSurfaces({ lines, heights, elev0: ELEV0, height: tileGround, nodes, buildings: outlines, squares: rings('plaza'), water: rings('water'), paths: walks, box: B, cuts: over });
  for (const { id } of over) {
    const t = tiles.get(id);
    t.streets = packStreets(cuts.get(id), t.box.x0, t.box.z0);
    Object.assign(t, packPaths(cuts.get(id), t.box.x0, t.box.z0));
    if (!wallList) continue;
    // A wall on a carriageway or a path (a fence the map draws along a flight of steps, a hedge the
    // map's line for a ramp down to a tunnel runs along) stands at its edge: cut there; on a deck or a
    // tunnel's road, where it stands within 2 m of it.
    const c = cuts.get(id), onGround = (p) => p.level === 'ground' || p.level === 'under';
    const road = new Inside([...c.carriageways, ...c.paths].filter(onGround).flatMap((p) => p.rings));
    const up = [...c.carriageways, ...c.paths].filter((p) => !onGround(p) && p.ys).map((p) => { const ys = p.ys.flat(); return { inside: new Inside(p.rings), lo: Math.min(...ys) - 2, hi: Math.max(...ys) + 2 }; });
    const mine = cutWalls(wallList, over.find((o) => o.id === id).box, (x, z, y) => road.has(x, z) || up.some((p) => y >= p.lo && y <= p.hi && p.inside.has(x, z)));
    t.walls = packWalls(mine, t.box.x0, t.box.z0, ELEV0);
    nWalls += mine.length;
  }
  const ps = stats.paths;
  if (wallList) console.log(`walls: ${nWalls} pieces in the open world's tiles, of ${wallList.length}`);
  console.log(`streets: ${stats.edges} stretches in the open world's ${over.length} tiles, ${stats.junctions} junctions, ${stats.islands} islands, ${stats.reservations} reservations, ${Math.round(stats.slivers)} m² of slivers closed, ${Math.round(stats.past)} m² of corners cut back past a deck's or a tunnel's end, ${Math.round(stats.km.kerb)} km of kerb, in ${Math.round(stats.seconds)} s`);
  console.log(`paths: ${walks.length} ways round the area, ${Object.entries(ps.m2).map(([k, v]) => `${k} ${Math.round(v)} m²`).join(', ')} (cycleways ${Math.round(ps.lanes)} m² beside the road and ${Math.round(ps.flush)} m² flush with a pavement); ${ps.flights} flights of steps in ${ps.treads} treads, ${ps.steep} rising more than 0.3 m`);
}

// ---------------------------------------------------------------------------------------------
// The sights a Bracarense steers by: Bom Jesus and the Sameiro on the hills to the east, the cross
// on the Picoto, the stadium, the Altice Forum, Makro and the Tourigalo's bull; and São João da
// Ponte's chapel and bridge, which the route passes (task 021). Footprints and positions from the
// map, heights from the ground and the LiDAR: the stadium's stands and floodlights as tools/sights.mjs
// measured them.

const sights = [];
const sightsMeasured = fs.existsSync(path.join(CACHE, 'sights.json')) ? readCache('sights.json') : null;
if (!sightsMeasured) console.log('no .cache/sights.json: the stadium without its stands and floodlights (node tools/sights.mjs)');
let standsDm = null; // the stadium's stands' heights, in decimetres, for the base
{
  // The main roads, for which way a building looks.
  const mgrid = new Grid(50);
  for (const s of streets) if (s.k <= 4) for (let i = 1; i < s.pts.length; i++) { const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 25)); for (let f = 0; f <= n; f++) mgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax, az, bx, bz]); }
  // The nearest point of a main road, and how far.
  const road = (x, z) => {
    for (let reach = 1; reach <= 8; reach *= 2) {
      let best = null, bd = Infinity;
      for (const [ax, az, bx, bz] of mgrid.near(x, z, reach)) {
        const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0, px = ax + dx * t, pz = az + dz * t, d = Math.hypot(px - x, pz - z);
        if (d < bd) { bd = d; best = [px, pz]; }
      }
      if (best) return { d: bd, at: best };
    }
    return { d: Infinity, at: [x, z] };
  };
  const find = (list, type, id) => list.find((e) => e.type === type && e.id === id);
  const yAt = (x, z) => Math.round((ground.at(x, z) - ELEV0) * 10) / 10;
  const r1 = (v) => Math.round(v * 10) / 10;
  const facing = (x, z, tx, tz) => r1(Math.atan2(tz - z, tx - x) * 100) / 100;
  // A building's front: the middle of its long wall nearest a main road (or nearest the point
  // `toward`, where the map's roads would pick the wrong wall), and which way it looks.
  const front = (pts, toward) => {
    let best = null;
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cz = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const longest = Math.max(...pts.map((q, k) => Math.hypot(pts[(k + 1) % pts.length][0] - q[0], pts[(k + 1) % pts.length][1] - q[1])));
    for (let k = 0; k < pts.length; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], l = Math.hypot(bx - ax, bz - az);
      if (l < Math.min(30, longest * 0.6)) continue;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, d = toward ? Math.hypot(toward[0] - mx, toward[1] - mz) : road(mx, mz).d;
      if (!best || d < best.d) {
        let nx = (bz - az) / l, nz = -(bx - ax) / l;
        if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
        best = { d, x: r1(mx), z: r1(mz), face: r1(Math.atan2(nz, nx) * 100) / 100, L: r1(l / 2) };
      }
    }
    const { d: _d, ...rest } = best;
    return rest;
  };

  const basilica = find(fps, 'way', 146373021);
  if (basilica) {
    const r = minRect(ringOf(basilica));
    // It looks west, down the Escadório to the city.
    const foot = [3420, -352];
    sights.push({ kind: 'bomjesus', x: r1(r.x), z: r1(r.z), y: yAt(r.x, r.z), angle: r1(r.angle * 100) / 100, L: r1(r.L), W: r1(r.W), face: facing(r.x, r.z, ...foot), foot, footY: yAt(...foot) });
  }
  const sameiro = find(fps, 'way', 146227475);
  const statue = find(pois, 'node', 6562581627);
  if (sameiro && statue) {
    const r = minRect(ringOf(sameiro)), [sx, sz] = P(statue);
    sights.push({ kind: 'sameiro', x: r1(r.x), z: r1(r.z), y: yAt(r.x, r.z), angle: r1(r.angle * 100) / 100, L: r1(r.L), W: r1(r.W), face: facing(r.x, r.z, sx, sz), statue: [r1(sx), r1(sz)], statueY: yAt(sx, sz) });
  }
  // São João da Ponte's chapel (1616), in the park by the Largo: its outline, which a game draws it
  // in place of (`covers`), its long axis and the way its front looks (to the square before it,
  // where its photos were taken from), and its heights as the LiDAR measured its parts, from the front
  // back: the porch's eaves, the bell block's top, and the nave's eaves and ridge.
  const chapel = find(fps, 'way', 121590142), parts = roofs[121590142]?.parts?.filter((p) => p.roof);
  if (chapel && parts?.length >= 3) {
    const ring = ringOf(chapel), r = minRect(ring), square = [272, 990];
    let [ux, uz] = [Math.cos(r.angle), Math.sin(r.angle)];
    if ((square[0] - r.x) * ux + (square[1] - r.z) * uz < 0) [ux, uz] = [-ux, -uz];
    const ahead = (p) => -p.pts.reduce((a, [x, z]) => a + (x - r.x) * ux + (z - r.z) * uz, 0) / p.pts.length;
    const [porch, , nave] = [...parts].sort((a, b) => ahead(a) - ahead(b));
    const y = yAt(r.x + ux * r.L, r.z + uz * r.L), h = (v) => r1(v - ELEV0 - y);
    sights.push({ kind: 'saojoao', x: r1(r.x), z: r1(r.z), y, face: r1(Math.atan2(uz, ux) * 100) / 100, L: r1(r.L), W: r1(r.W), porch: h(porch.eaves), top: h(Math.max(...parts.map((p) => p.ridge))), eaves: h(nave.eaves), ridge: h(nave.ridge), covers: ring.slice(0, -1).map(([x, z]) => [r1(x), r1(z)]) });
  }
  // São João da Ponte's bridge, the Avenida da Liberdade's over the Este: an arch of dressed granite
  // (task 008's photos of it, from the path by the river). Where the road's middle crosses the river,
  // and how far its decks reach from there: a game draws the decks there as the arch.
  {
    const ways = [298882886, 510031084].map((id) => base.elements.find((e) => e.type === 'way' && e.id === id && e.geometry)).filter(Boolean);
    const river = base.elements.filter((e) => e.type === 'way' && e.tags?.waterway === 'river' && e.geometry).map((e) => e.geometry.map(P));
    const cross = (a, b, c, d) => {
      const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
      if (!den) return null;
      const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den, u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
      return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] : null;
    };
    const at = ways.flatMap((w) => w.geometry.map(P).flatMap((p, k, ps) => (k ? river.flatMap((rv) => rv.slice(1).map((q, j) => cross(ps[k - 1], p, rv[j], q)).filter(Boolean)) : [])));
    if (at.length) {
      const x = at.reduce((a, p) => a + p[0], 0) / at.length, z = at.reduce((a, p) => a + p[1], 0) / at.length;
      const reach = Math.max(...ways.flatMap((w) => w.geometry.map(P).map(([px, pz]) => Math.hypot(px - x, pz - z))));
      sights.push({ kind: 'arch', x: r1(x), z: r1(z), r: r1(reach + 2), y: yAt(x, z) });
    }
  }
  const cross = find(pois, 'node', 3917613795);
  if (cross) { const [x, z] = P(cross); sights.push({ kind: 'cruzeiro', x: r1(x), z: r1(z), y: yAt(x, z) }); }
  // The Tourigalo: a bull with a rooster's head, on the lawn by the Avenida Doutor António Alves
  // Palha's roundabout, its head to the west as Mapillary's photos show it (2018-2019); and the
  // restaurant behind it, whose sign is along the front it shows the avenue.
  const bull = find(pois, 'node', 4872503160);
  const restaurant = find(fps, 'way', 142911732);
  if (bull) { const [x, z] = P(bull); sights.push({ kind: 'tourigalo', x: r1(x), z: r1(z), y: yAt(x, z), face: r1(Math.PI * 100) / 100, ...(restaurant && { sign: front(ringOf(restaurant), [1625, 320]) }) }); }
  const makro = find(fps, 'way', 41677157);
  if (makro) sights.push({ kind: 'makro', ...front(ringOf(makro)), y: yAt(...P(makro.geometry[0])) });
  // The Altice Forum: the α high on its hall's west face, 9 m from its north end, as the viewpoint
  // altice-forum's photo shows it, over its top row of windows: its middle 2.8 m under the wall's top
  // as the LiDAR measured it.
  const hall = fps.filter((e) => Math.floor(e.id / 16) === 19915703).sort((a, b) => ringArea(ringOf(b)) - ringArea(ringOf(a)))[0];
  if (hall) {
    const f = front(ringOf(hall)), north = Math.cos(f.face) < 0 ? 1 : -1;
    // Along the wall, towards its north end: the wall runs square to the way it looks.
    const [wx, wz] = [-Math.sin(f.face) * north, Math.cos(f.face) * north];
    const x = f.x + wx * (f.L - 9), z = f.z + wz * (f.L - 9), y = yAt(x, z), top = roofs[hall.id]?.parts?.length ? Math.max(...roofs[hall.id].parts.map((p) => p.eaves)) - ELEV0 - y : 20;
    sights.push({ kind: 'altice', x: r1(x), z: r1(z), y, face: f.face, h: r1(top - 2.8) });
  }
  const pitch = find(base.elements, 'way', 22660434);
  if (pitch) {
    const r = minRect(ringOf(pitch)), st = sightsMeasured?.stadium;
    const stadium = { kind: 'stadium', x: r1(r.x), z: r1(r.z), y: yAt(r.x, r.z), angle: r1(r.angle * 100) / 100, L: r1(r.L), W: r1(r.W) };
    if (st) {
      stadium.stands = { S: st.S, R0: st.R0, dr: st.dr, from: st.spokes.map((q) => q.from), n: st.spokes.map((q) => q.h.length) };
      stadium.lights = st.lights;
      standsDm = st.spokes.flatMap((q) => q.h.map(dm));
    }
    sights.push(stadium);
  }
  console.log(`sights: ${sights.map((q) => q.kind).join(', ')}`);
}

// ---------------------------------------------------------------------------------------------
// The base: everything every game needs, whatever part of the map it's in.

const out = new Packer();
{
  const grid = (b, step, h = (x, z) => ground.mean(x, z, step)) => {
    const nx = Math.round((b.x1 - b.x0) / step) + 1, nz = Math.round((b.z1 - b.z0) / step) + 1, v = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) v.push(dm(h(b.x0 + i * step, b.z0 + j * step) - ELEV0));
    return { v: packGrid(v, nx), meta: { x0: b.x0, z0: b.z0, step, nx, nz } };
  };
  // The whole map every 50 m, for the hills in the distance.
  const far = grid(EXT, 50);
  out.part('far', far.v, far.meta);
  // The horizon: the hills 15 km round the map, every 250 m: the LiDAR as far as it was fetched (the
  // map and a little round it), the coarser Terrain Tiles (EU-DEM) beyond.
  const hz = relief(path.join(CACHE, 'dem'), 11), cx = Math.round((EXT.x0 + EXT.x1) / 500) * 250, cz = Math.round((EXT.z0 + EXT.z1) / 500) * 250;
  const H = grid({ x0: cx - 15000, x1: cx + 15000, z0: cz - 15000, z1: cz + 15000 }, 250, (x, z) => Math.max(ELEV0 - 50, ground.covers(x, z) ? ground.mean(x, z, 250) : hz(x, z)));
  out.part('horizon', H.v, H.meta);
  // What the far hills are covered with, at each point of their grid: 0 fields and scrub, 1 woods,
  // 2 town.
  const f = out.header.far, cover = new Array(f.nx * f.nz).fill(0), kinds = [];
  for (const e of base.elements) {
    const c = AREA_OF(e.tags || {});
    const k = c === 'forest' ? 1 : ['urban', 'industrial'].includes(c) ? 2 : 0;
    if (!k) continue;
    const rings = e.type === 'way' ? [e.geometry.map(P)] : e.members.filter((m) => m.type === 'way' && m.geometry && m.role !== 'inner').map((m) => m.geometry.map(P));
    for (const r of rings) if (r.length > 3) kinds.push([k, r]);
  }
  // Woods last, so a wood inside a town's boundary is still a wood.
  kinds.sort((a, b) => b[0] - a[0]);
  for (const [k, r] of kinds) {
    const b = bounds(r);
    for (let j = Math.max(0, Math.ceil((b.z0 - f.z0) / f.step)); j <= Math.min(f.nz - 1, Math.floor((b.z1 - f.z0) / f.step)); j++) {
      for (let i = Math.max(0, Math.ceil((b.x0 - f.x0) / f.step)); i <= Math.min(f.nx - 1, Math.floor((b.x1 - f.x0) / f.step)); i++) {
        if (inside(r, f.x0 + i * f.step, f.z0 + j * f.step)) cover[j * f.nx + i] = k;
      }
    }
  }
  out.part('cover', cover);
  // The rivers: each one's course and water level, falling downstream. The level is the lowest
  // ground within 4 m of the course: the water, or the bed where the LiDAR saw through it.
  const R = [];
  for (const e of base.elements) {
    const t = e.tags || {};
    if (e.type !== 'way' || t.waterway !== 'river' || (t.tunnel && t.tunnel !== 'no')) continue;
    const pts = e.geometry.map(P).filter(([x, z]) => inExt(x, z, 100));
    if (pts.length < 2) continue;
    const low = (x, z) => { let m = Infinity; for (let a = -4; a <= 4; a++) for (let c = -4; c <= 4; c++) if (a * a + c * c <= 16) m = Math.min(m, ground.at(x + a, z + c)); return m; };
    const lv = blur(pts.map(([x, z]) => low(x, z)), 2);
    for (let i = 1; i < lv.length; i++) lv[i] = Math.min(lv[i], lv[i - 1]); // water runs downhill
    R.push(pts.length, ...pts.flatMap(([x, z], i) => [half(x), half(z), dm(lv[i] - ELEV0 - 0.3)]));
  }
  out.part('rivers', R, { halfWidth: 6 });
  // The stadium's stands, each spoke's heights after the one before's (its sight says how many).
  if (standsDm) out.part('stands', standsDm);
}

// ---------------------------------------------------------------------------------------------
// The tiles, each a module of its own, and the base with what's in them.

const dir = path.join(ROOT, 'world');
fs.rmSync(path.join(dir, 'tiles'), { recursive: true, force: true });
fs.mkdirSync(path.join(dir, 'tiles'), { recursive: true });
const HEAD = `// Made by tools/world.mjs from OpenStreetMap and DGT's LiDAR: run that again rather than editing it.
// A JSON header, then 16-bit numbers, in base64; index.js reads it. © OpenStreetMap contributors (ODbL).
// The ground, and the buildings' heights and roofs: informação geográfica cedida pela Direção-Geral do
// Território (CC BY 4.0).
`;
let bytes = 0;
const sizes = [];
for (const t of tiles.values()) {
  const p = new Packer(), b = t.box, { step, n } = gridOf(t), h = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h.push(gridDm(t, i, j));
  grids.delete(t.id);
  p.part('terrain', packGrid(h, n), { x0: b.x0, z0: b.z0, step, nx: n, nz: n });
  p.part('areas', t.areas);
  p.part('lines', t.lines);
  p.part('buildings', packBuildings(t.buildings));
  p.part('trees', t.trees);
  if (t.streets.length) p.part('streets', t.streets);
  if (t.paths.length) p.part('paths', t.paths);
  if (t.rails.length) p.part('rails', t.rails);
  if (t.walls.length) p.part('walls', t.walls);
  if (t.signs.length) p.part('signs', [], { list: t.signs });
  const b64 = p.encode();
  fs.writeFileSync(path.join(dir, 'tiles', t.id + '.js'), `${HEAD}export default '${b64}';\n`);
  bytes += b64.length;
  sizes.push([t.id, Math.round(b64.length / 1024)]);
}
fs.writeFileSync(path.join(dir, 'tiles.js'), `// Made by tools/world.mjs: a loader for each of the map's tiles, so a game only downloads those it needs.
export const TILES = {
${[...tiles.keys()].map((id) => `  '${id}': () => import('./tiles/${id}.js'),`).join('\n')}
};
`);

const landmarks = braga.landmarks.map((l) => ({ id: l.id, name: l.name, x: l.x, z: l.z, section: sectionOf(l.x, l.z) }));
out.header.meta = {
  credit: '© OpenStreetMap contributors (ODbL). Relief, and the heights and roofs of the buildings: LiDAR and orthophoto, informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0); beyond the map, Terrain Tiles (AWS Open Data): Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers.',
  osmTime: base.osm3s.timestamp_osm_base,
  elev0: ELEV0,
  ext: EXT,
  tile: TILE,
  tiles: [...tiles.keys()],
  sections: SECTIONS,
  areas: AREA,
  roofColors: PALETTE,
  storey: [STOREY, BASE],
  facades: { types: TYPES, colours: COLOURS, materials: MATERIALS, ground: GROUND, balconies: BALCONIES },
  landmarks,
  sights,
  open: { pts: OPEN, gates, tiles: OPEN_TILES, seen: OPEN_SEEN },
  shooter: { id: SHOOTER_ID, name: SHOOTER_NAME, pts: SHOOTER, gates: shooterGates, tiles: SHOOTER_TILES, seen: SHOOTER_SEEN },
};
const b64 = out.encode();
fs.writeFileSync(path.join(dir, 'base.js'), `${HEAD}export default '${b64}';\n`);
sizes.sort((a, b) => b[1] - a[1]);
console.log(`base ${Math.round(b64.length / 1024)} KB; ${tiles.size} tiles, ${Math.round(bytes / 1024)} KB in all, the biggest ${sizes.slice(0, 4).map(([id, kb]) => `${id} ${kb} KB`).join(', ')}`);
console.log(`sections: ${SECTIONS.map((s) => `${s.id} ${s.tiles.length}`).join(', ')}`);
console.log(`the ground every 2 m on ${FINE.size} tiles: ${[...FINE].sort().join(' ')}`);
console.log(`the open world: ${OPEN_TILES.length} tiles under it and ${OPEN_SEEN.length} round it, ${gates.length} gates (${Object.entries(Object.groupBy(gates, (g) => g.level)).map(([l, g]) => `${g.length} ${l}`).join(', ')})`);
console.log(`the shooter's area: ${SHOOTER_TILES.length} tiles under it and ${SHOOTER_SEEN.length} round it, ${shooterGates.length} gates`);
