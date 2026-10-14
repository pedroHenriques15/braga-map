// Makes the world the games share: the whole map, from OpenStreetMap and DGT's LiDAR (the ground),
// cut into 500 m tiles (sections.mjs). Nothing in it depends on a track or an arena: a game clears
// its own road of buildings and trees when it loads. Only the detail of the ground does: it's finer
// where the tracks run and the shooter is played (decision 003).
//
// node tools/world.mjs
//
// - world/base.js, which every game loads: the tiles and the sections, the relief over the whole
//   map every 50 m and 15 km round for the horizon, what the far hills are covered with, the
//   rivers, the landmarks and the sights.
// - world/tiles/<id>.js, one per tile: the relief (every 2 m on the tiles within 60 m of a track
//   in tracks/ and over the shooter's area, every 10 m on the rest), what the ground is (clipped to
//   the tile), the streets and the railway, the buildings, and the trees.
// - world/tiles.js, a loader for each tile, for index.js.
//
// All in metres from the Praça da República, x east and z south, heights above ELEV0, packed as
// 16-bit numbers: points in half metres, heights in decimetres (on a grid, each less a guess from
// its neighbours: osm.mjs's packGrid).
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, ELEV0, P, ROOT, readCache, relief } from './geo.mjs';
import { AREA, AREA_OF, blur, bounds, carriageway, dm, footprints, Grid, half, hash, inside, LINE, minRect, openThin, overlaps, Packer, packGrid, packPts, rectAxis, STOREY, STOREY_BASE as BASE, ringArea, ringOf, seeded, segDist, simplify, W_MIN } from './osm.mjs';
import { allTiles, EXT, SECTIONS, sectionOf, SHOOTER, TILE, tileBox, tileId, tileOf } from './sections.mjs';
import { terrain } from './terrain.mjs';

const base = readCache('osm/base.json');
const buildingsOsm = readCache('osm/buildings.json');
const treesOsm = readCache('osm/trees.json');
const pois = readCache('osm/pois.json').elements;
const braga = JSON.parse(fs.readFileSync(path.join(ROOT, 'map/braga.json'), 'utf8'));
// The private waypoints, if they're here: only for the streets they ask to have lined with houses.
const places = fs.existsSync(path.join(CACHE, 'places.json')) ? readCache('places.json').places : [];
const ground = await terrain();
const inExt = (x, z, m = 0) => x >= EXT.x0 - m && x <= EXT.x1 + m && z >= EXT.z0 - m && z <= EXT.z1 + m;

const tiles = new Map(allTiles().map(([i, j]) => [tileId(i, j), { id: tileId(i, j), box: tileBox(i, j), areas: [], lines: [], buildings: [], trees: [] }]));
const tileAt = (x, z) => tiles.get(tileId(...tileOf(x, z)));
const tilesOver = (b, m = 0) => [...tiles.values()].filter((t) => overlaps(t.box, b, m));

// Where the ground is every 2 m: the tiles within 60 m of a track planned on the map (the last
// `npm run tracks`, so plan a new track before this), and over the shooter's area.
const FINE = new Set(tilesOver(SHOOTER).map((t) => t.id));
for (const f of fs.readdirSync(path.join(ROOT, 'tracks')).filter((f) => f.endsWith('.js'))) {
  const { points } = (await import(`../tracks/${f}`)).default;
  for (const { p } of points) for (const t of tilesOver({ x0: p[0], x1: p[0], z0: p[2], z1: p[2] }, 60)) FINE.add(t.id);
}

// ---------------------------------------------------------------------------------------------
// The streets, the railway, and what the ground is.

const streets = []; // { id, k, w, pts, t }
const areas = []; // [kind, ring]
for (const e of base.elements) {
  const t = e.tags || {};
  if (e.type === 'way' && (LINE[t.highway] != null || t.railway)) {
    const pts = e.geometry.map(P);
    if (!pts.some(([x, z]) => inExt(x, z, 50))) continue;
    const closed = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
    if (t.highway === 'pedestrian' && (t.area === 'yes' || closed)) { areas.push([AREA.indexOf('plaza'), simplify(pts.slice(0, -1), 0.5)]); continue; }
    if (t.tunnel && t.tunnel !== 'no') continue;
    streets.push({ id: e.id, k: t.railway ? 9 : LINE[t.highway], w: t.railway ? 4 : carriageway(t), pts, t });
    continue;
  }
  const c = AREA_OF(t);
  if (!c) continue;
  // A relation's member ways are each painted as their own ring: good enough for the ground.
  const rings = e.type === 'way' ? [e.geometry.map(P)] : e.members.filter((m) => m.type === 'way' && m.geometry).map((m) => m.geometry.map(P));
  for (const r of rings) if (r.length > 3 && r.some(([x, z]) => inExt(x, z, 200))) areas.push([AREA.indexOf(c), simplify(r, c === 'forest' || c === 'farm' ? 2 : 1)]);
}

// Big areas first, so smaller ones inside them are painted over them; squares last. Each is cut to
// the tiles it's on (a metre over, so they meet without a seam), and keeps its place in that order.
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
  areas.forEach(([kind, ring], rank) => {
    if (ring.length < 3) return;
    for (const t of tilesOver(bounds(ring))) {
      const b = t.box, piece = clip(ring, { x0: b.x0 - 1, x1: b.x1 + 1, z0: b.z0 - 1, z1: b.z1 + 1 });
      if (piece.length >= 3 && ringArea(piece) > 0.5) t.areas.push(Math.floor(rank / 32768), rank % 32768, kind, piece.length, ...packPts(piece));
    }
  });
}

// Every street at its width, and the railway: the stretches of each that cross a tile.
for (const s of streets) {
  const pts = openThin(s.pts, 0.8);
  for (const t of tilesOver(bounds(pts), s.w)) {
    const b = t.box, m = s.w / 2 + 2;
    let run = [];
    const flush = () => { if (run.length > 1) t.lines.push(s.k, Math.round(s.w * 10), run.length, ...packPts(run)); run = []; };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      if (overlaps(bounds([a, c]), b, m)) { if (!run.length) run.push(a); run.push(c); }
      else flush();
    }
    flush();
  }
}
console.log(`ground: ${areas.length} areas, ${streets.length} streets and railways`);

// ---------------------------------------------------------------------------------------------
// The buildings: all of them, and houses filled in where the map has none. Each one's height, roof
// and roof colour as DGT's LiDAR and orthophoto measured them (tools/roofs.mjs), in parts where its
// roof steps or turns a corner; guessed from what the map says where the LiDAR didn't see it (the
// point cloud wasn't fetched there, it was built after July 2025, or it's under a tree) and for the
// houses filled in.

const KIND = { house: 0, flats: 1, shop: 2, church: 3, civic: 4 };
const ROOF = { flat: 0, hipped: 1, gabled: 2, skillion: 3 };
const MAT = { tiles: 0, sheet: 1, flat: 2 };
const COLORS = 8; // facade colours, picked from each building's id
const fps = footprints(buildingsOsm);
if (!fs.existsSync(path.join(CACHE, 'roofs.json'))) throw new Error('No measured roofs in .cache/roofs.json: node tools/roofs.mjs');
const roofs = readCache('roofs.json').buildings;
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
// [n, what, roof, h, y, rise, ...points], each a 16-bit number. what: its kind (3 bits), facade
// colour (3), roof (2), which ends of its ridge are hipped (2), what the roof's covered with (2),
// filled in (1), measured (1). roof: its pitch in degrees (6 bits), the way it runs (2) and its
// colour in PALETTE (7, 127 for none). h, the eaves, from y, the ground, and rise, the ridge over the
// eaves, in decimetres. In a tile they're in rows 20 m deep, west to east, each one's ground and
// first point the step from the one before's, and a four-cornered one's last corner less where the
// other three would put it, as a parallelogram (packBuildings): which packs smaller.
const putBuilding = (ring, cx, cz, b) => {
  const what = b.kind | (b.color << 3) | (b.roof << 6) | (b.ends << 8) | (b.mat << 10) | (b.filled ? 1 << 12 : 0) | (b.measured ? 1 << 13 : 0);
  const roof = Math.min(63, Math.round(b.pitch)) | (dirCode(ring, b.dir) << 6) | (paletteOf(b.rgb) << 8);
  tileAt(cx, cz).buildings.push([ring.length, what, roof, dm(b.h), b.y, Math.max(0, dm(b.ridge - b.h)), ...packPts(ring)]);
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
let real = 0, measured = 0, parts = 0;
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
    // Measured: each part on its own ground, its eaves and ridge from there.
    if (m && m.cover >= 0.35 && m.parts.some((p) => p.roof)) {
      const seen = m.parts.filter((p) => p.roof), top = Math.max(...seen.map((p) => p.eaves));
      for (const p of m.parts) {
        const ring = simplify(p.pts ?? pts, 0.3);
        if (ring.length < 3) continue;
        const y = footY(ring), base = ELEV0 + y / 10;
        const px = ring.reduce((s, q) => s + q[0], 0) / ring.length, pz = ring.reduce((s, q) => s + q[1], 0) / ring.length;
        let b;
        if (p.roof) {
          const h = Math.max(2.4, p.eaves - base), roof = ROOFS[p.roof];
          b = { kind: kindOf(t, a, top - base), roof, h, ridge: Math.max(h, p.ridge - base), dir: p.dir ?? minRect(ring).angle, pitch: p.pitch ?? 0, ends: p.ends ?? 0, rgb: p.colour, measured: true };
          b.mat = matOf(roof, p.colour, t['roof:material']);
        } else {
          // A piece of it the LiDAR saw nothing over: low, and flat (a passage, a yard roofed over).
          b = { kind: KIND.shop, roof: ROOF.flat, h: 3, ridge: 3, dir: minRect(ring).angle, pitch: 0, ends: 0, rgb: null, mat: MAT.flat, measured: false };
        }
        putBuilding(ring, px, pz, { ...b, color, y, filled: false });
        parts++;
      }
      measured++;
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
    const g = guessRoof(ring, roof), rgb = parseColour(t['roof:colour']);
    putBuilding(ring, cx, cz, { kind, roof, color, h, ridge: h + g.rise, dir: g.dir, pitch: g.pitch, ends: g.ends, rgb, mat: matOf(roof, rgb, t['roof:material']), y: footY(ring), filled: false, measured: false });
    real++;
  }
}

// OpenStreetMap is missing many of the buildings: where the land is built-up and a street's
// frontage is empty, line it with houses, and flats on the main roads. Never in a park, a wood, a
// field or a pitch, on a street, or over a building. Each street is taken at least W_MIN wide, as
// the games draw it, with a pavement as wide as the buildings leave room for. The streets a note
// on the map asked for (the waypoints marked `rows`) get them all down both sides.
let infill = 0;
{
  const allB = [], bgrid = new Grid(40);
  const addB = (r) => { allB.push(r); for (const [x, z] of r) bgrid.add(x, z, allB.length - 1); };
  for (const e of fps) { const r = ringOf(e); if (r.some(([x, z]) => inExt(x, z, 50))) addB(r); }
  const nearB = (x, z, reach) => [...new Set(bgrid.near(x, z, reach))];
  // The buildings' walls, a point every 2 m, for how much room there is for a pavement.
  const vgrid = new Grid(20);
  for (const r of allB) for (let i = 1; i < r.length; i++) {
    const [ax, az] = r[i - 1], [bx, bz] = r[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
    for (let f = 0; f < n; f++) vgrid.add(ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n, [ax + ((bx - ax) * f) / n, az + ((bz - az) * f) / n]);
  }
  const GREEN = new Set(['farm', 'grass', 'scrub', 'forest', 'park', 'cemetery', 'sport', 'water']);
  // Open ground the orthophoto shows that the map doesn't say is green, until task 011 checks every
  // invented house against it: the Tourigalo's lawn, and the grass north of its restaurant.
  const OPEN = [{ x0: 1575, x1: 1650, z0: 200, z1: 305 }];
  const open = (pts) => OPEN.some((o) => pts.some(([x, z]) => x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1));
  const agrid = new Grid(100);
  areas.forEach(([, r], i) => { const b = bounds(r); for (let a = Math.floor(b.x0 / 100); a <= Math.floor(b.x1 / 100); a++) for (let c = Math.floor(b.z0 / 100); c <= Math.floor(b.z1 / 100); c++) agrid.add(a * 100, c * 100, i); });
  const landAt = (x, z) => { let best = null, ba = Infinity; for (const i of agrid.near(x, z, 0)) { const [k, r] = areas[i]; if (inside(r, x, z)) { const a = ringArea(r); if (a < ba) { ba = a; best = AREA[k]; } } } return best; };
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
  const why = { green: 0, empty: 0, street: 0, building: 0 };
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
          // On open ground it keeps its turn, so no other house moves, but nothing is built.
          if (!open(quad.concat([mid]))) {
            const g = guessRoof(quad, roof);
            putBuilding(quad, mid[0], mid[1], { kind, roof, color, h, ridge: h + g.rise, dir: g.dir, pitch: g.pitch, ends: g.ends, rgb: null, mat: matOf(roof, null), y: footY(quad), filled: true, measured: false });
            infill++;
          }
          addB(quad);
          k += Math.max(2, Math.round((wide + (row || rand() < 0.7 ? 0.4 : 3 + rand() * 4)) / 2));
        } else k += 3;
      }
    }
  }
  console.log(`buildings: ${real} from the map (${measured} measured by the LiDAR, in ${parts} parts; guessed roofs at ${PITCH}°), ${infill} filled in (${rowNames.size} streets in rows); frontage skipped for ${JSON.stringify(why)}`);
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
  const ok = (x, z) => inExt(x, z) && !sgrid.near(x, z, 1).some(([ax, az, bx, bz, hw]) => segDist(x, z, { x: ax, z: az }, { x: bx, z: bz }) < hw + 0.5);
  const plant = (x, z, how) => { if (ok(x, z)) { tileAt(x, z).trees.push(half(x), half(z), how); nTrees++; } };
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
// The sights a Bracarense steers by: Bom Jesus and the Sameiro on the hills to the east, the cross
// on the Picoto, the stadium, the Altice Forum, Makro and the Tourigalo's bull. Footprints and
// positions from the map, heights from the ground.

const sights = [];
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
  const altice = fps.filter((e) => Math.floor(e.id / 16) === 19915703).map(ringOf).sort((a, b) => ringArea(b) - ringArea(a))[0];
  if (altice) sights.push({ kind: 'altice', ...front(altice), y: yAt(altice[0][0], altice[0][1]) });
  const pitch = find(base.elements, 'way', 22660434);
  if (pitch) {
    const r = minRect(ringOf(pitch));
    sights.push({ kind: 'stadium', x: r1(r.x), z: r1(r.z), y: yAt(r.x, r.z), angle: r1(r.angle * 100) / 100, L: r1(r.L), W: r1(r.W) });
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
  const p = new Packer(), b = t.box, step = FINE.has(t.id) ? 2 : 10, n = TILE / step + 1, h = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h.push(dm(ground.mean(b.x0 + i * step, b.z0 + j * step, step) - ELEV0));
  p.part('terrain', packGrid(h, n), { x0: b.x0, z0: b.z0, step, nx: n, nz: n });
  p.part('areas', t.areas);
  p.part('lines', t.lines);
  p.part('buildings', packBuildings(t.buildings));
  p.part('trees', t.trees);
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
  landmarks,
  sights,
};
const b64 = out.encode();
fs.writeFileSync(path.join(dir, 'base.js'), `${HEAD}export default '${b64}';\n`);
sizes.sort((a, b) => b[1] - a[1]);
console.log(`base ${Math.round(b64.length / 1024)} KB; ${tiles.size} tiles, ${Math.round(bytes / 1024)} KB in all, the biggest ${sizes.slice(0, 4).map(([id, kb]) => `${id} ${kb} KB`).join(', ')}`);
console.log(`sections: ${SECTIONS.map((s) => `${s.id} ${s.tiles.length}`).join(', ')}`);
console.log(`the ground every 2 m on ${FINE.size} tiles: ${[...FINE].sort().join(' ')}`);
