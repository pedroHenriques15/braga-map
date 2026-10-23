// The street furniture round the open world's area (task 100), each where it stands, for task 020 to
// draw: the lamps, signs and traffic lights DGT's 2025 LiDAR finds, and its bus shelters, with
// OpenStreetMap's; and the poles that carry wires and the low things (benches, bins and baskets,
// ecopontos, bollards) the map's only, as the cloud can't tell them from wires, parapets and parked cars
// (the photos' check, refs/furniture.json and task 100's Notes).
//
// node tools/furniture.mjs        after fetch.mjs (furniture, lidar), roofs.mjs and walls.mjs, before
//                                 world.mjs (3 minutes the first time, then under one)
// node tools/furniture.mjs mark   the sample of 50 checked against the photos (refs/furniture.json):
//                                 each in the photo it was looked at in, ringed and numbered, into
//                                 .cache/furniture/<photo>.jpg, and the sample drawn again where it isn't
//                                 in refs/furniture.json yet
//
// - .cache/dgt/furniture/<tile>.bin: each of the point cloud's tiles under the box boiled down once
//   (about 15 s a tile): the points neither the ground, a building nor a plant (DGT's classes 1,
//   unclassified, and 7, noise, where a lamp's head often is) from 25 cm to 16 m over the terrain,
//   each where it is, how high, its class, colour, near-infrared and which of its pulse's returns;
//   and over 50 cm cells, the highest point of the plants (3 to 5) and of the buildings (6) in each,
//   over the terrain.
// - .cache/furniture.json: every piece round the area (index.d.ts's Furniture), and what was left out
//   and why.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { CACHE, P, ROOT, readCache } from './geo.mjs';
import { CLASS, DGT, mapToTM, points, readModel, tileKey, tileToMap, tilesOver } from './dgt.mjs';
import { LEVEL, onCarriageways, streetsOf } from './lines.mjs';
import { Grid, isOneway, segDist } from './osm.mjs';
import { OPEN_BOX } from './sections.mjs';
import { terrain } from './terrain.mjs';

export const SEEN = path.join(ROOT, 'refs', 'furniture.json');

const FDIR = path.join(DGT, 'furniture');
const N = 2000, CELL = 0.5; // the terrain model's grid, as walls.mjs's
const LO = 0.25, HI = 16; // what's kept, over the terrain

// ---------------------------------------------------------------------------------------------
// The point cloud, a tile at a time.

async function boil(key) {
  const file = path.join(FDIR, key + '.bin'), laz = path.join(DGT, 'LAZ', key + '.laz'), tif = path.join(DGT, 'MDT-50cm', key + '.tif');
  if (fs.existsSync(file) && fs.statSync(file).mtimeMs > fs.statSync(laz).mtimeMs) return;
  const mdt = await readModel(tif);
  if (mdt.w !== N || mdt.h !== N || mdt.res !== CELL) throw new Error(`MDT-50cm/${key}.tif isn't 2000 cells of 50 cm`);
  const [ke, kn] = key.split('_').map(Number), e0 = ke * 1000, n1 = kn * 1000 + 1000;
  const plant = new Int16Array(N * N), built = new Int16Array(N * N);
  let e = new Float32Array(1 << 20), n = new Float32Array(1 << 20), h = new Int16Array(1 << 20), b = new Uint8Array(6 << 20), k = 0;
  const t0 = Date.now();
  await points(key, (p) => {
    const i = Math.floor((p.e - e0) / CELL), j = Math.floor((n1 - p.n) / CELL);
    if (i < 0 || j < 0 || i >= N || j >= N || p.cls === CLASS.ground) return;
    const c = j * N + i, g = mdt.data[c];
    if (g === mdt.nodata || g < -100) return;
    const up = p.y - g;
    if (up < LO || up > HI + 14) return;
    const cm = Math.round(up * 100);
    if (p.cls >= CLASS.lowVegetation && p.cls <= CLASS.highVegetation) { if (cm > plant[c]) plant[c] = cm; return; }
    if (p.cls === CLASS.building) { if (cm > built[c]) built[c] = cm; return; }
    if ((p.cls !== 1 && p.cls !== CLASS.noise) || up > HI) return;
    if (k === e.length) {
      const grow = (a, f = 1) => { const x = new a.constructor(a.length * 2); x.set(a.subarray(0, k * f)); return x; };
      e = grow(e); n = grow(n); h = grow(h); b = grow(b, 6);
    }
    e[k] = p.e - e0; n[k] = n1 - p.n; h[k] = cm;
    b.set([p.cls, p.r >> 8, p.g >> 8, p.b >> 8, p.nir >> 8, (p.ret & 15) | (p.returns << 4)], k * 6);
    k++;
  }, true);
  fs.mkdirSync(FDIR, { recursive: true });
  const head = Buffer.alloc(4);
  head.writeUInt32LE(k);
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([head, Buffer.from(e.buffer, 0, k * 4), Buffer.from(n.buffer, 0, k * 4), Buffer.from(h.buffer, 0, k * 2), Buffer.from(b.buffer, 0, k * 6), Buffer.from(plant.buffer), Buffer.from(built.buffer)]), { level: 1 }));
  console.log(`furniture: ${key} boiled down in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${k} points`);
}

// A tile's points: e and n in metres from its north-west corner (e east, n south), h over the terrain
// in centimetres, and six bytes each (class, r, g, b, nir, returns); and its plants' and buildings'
// highest point in each cell, in centimetres (0 where none).
export function boiled(key) {
  const file = path.join(FDIR, key + '.bin');
  if (!fs.existsSync(file)) return null;
  const z = zlib.gunzipSync(fs.readFileSync(file)), buf = z.buffer.slice(z.byteOffset, z.byteOffset + z.byteLength), k = z.readUInt32LE(0);
  let o = 4;
  const take = (A, len) => { const a = new A(buf, o, len); o += len * A.BYTES_PER_ELEMENT; return a; };
  return { key, k, e: take(Float32Array, k), n: take(Float32Array, k), h: take(Int16Array, k), b: take(Uint8Array, k * 6), plant: take(Int16Array, N * N), built: take(Int16Array, N * N) };
}


// ---------------------------------------------------------------------------------------------
// The points over the whole box, as one mosaic: X east and Y south in metres from its north-west
// corner, (E0, N1) in EPSG:3763; each point's height over the terrain, class, colour, near-infrared
// and returns; and the plants' and buildings' highest point at (X, Y), in metres.

export function mosaic(keys) {
  const ks = keys.map((k) => k.split('_').map(Number));
  const E0 = Math.min(...ks.map((k) => k[0])) * 1000, N1 = (Math.max(...ks.map((k) => k[1])) + 1) * 1000;
  const tiles = keys.map(boiled).filter(Boolean), total = tiles.reduce((s, t) => s + t.k, 0);
  const m = { E0, N1, k: total, X: new Float32Array(total), Y: new Float32Array(total), H: new Float32Array(total), cls: new Uint8Array(total), rgb: new Uint8Array(total * 3), nir: new Uint8Array(total), ret: new Uint8Array(total), tiles: new Map() };
  let o = 0;
  for (const t of tiles) {
    const [ke, kn] = t.key.split('_').map(Number), dx = ke * 1000 - E0, dy = N1 - (kn * 1000 + 1000);
    m.tiles.set(t.key, t);
    for (let i = 0; i < t.k; i++, o++) {
      m.X[o] = t.e[i] + dx; m.Y[o] = t.n[i] + dy; m.H[o] = t.h[i] / 100;
      m.cls[o] = t.b[i * 6]; m.rgb.set(t.b.subarray(i * 6 + 1, i * 6 + 4), o * 3); m.nir[o] = t.b[i * 6 + 4]; m.ret[o] = t.b[i * 6 + 5];
    }
  }
  const cell = (X, Y) => {
    const e = E0 + X, n = N1 - Y, ke = Math.floor(e / 1000), kn = Math.floor(n / 1000), t = m.tiles.get(ke + '_' + kn);
    return t ? [t, Math.floor((kn * 1000 + 1000 - n) / CELL) * N + Math.floor((e - ke * 1000) / CELL)] : null;
  };
  // The plants' and the buildings' highest over the terrain within r of (X, Y).
  m.around = (X, Y, r) => {
    let plant = 0, built = 0;
    for (let a = -r; a <= r + 1e-6; a += CELL) for (let b = -r; b <= r + 1e-6; b += CELL) {
      if (a * a + b * b > r * r + 0.01) continue;
      const c = cell(X + a, Y + b);
      if (c) { plant = Math.max(plant, c[0].plant[c[1]]); built = Math.max(built, c[0].built[c[1]]); }
    }
    return { plant: plant / 100, built: built / 100 };
  };
  // The points within r of (X, Y) across, that keep(i, d) keeps.
  const G = 0.5, GW = Math.ceil((Math.max(...ks.map((k) => k[0])) + 1) * 1000 - E0) / G + 1;
  const key = new Float64Array(total);
  for (let i = 0; i < total; i++) key[i] = Math.floor(m.Y[i] / G) * GW + Math.floor(m.X[i] / G);
  const order = Int32Array.from({ length: total }, (_, i) => i).sort((a, b) => key[a] - key[b]);
  const start = new Map();
  for (let s = 0; s < total; ) { const c = key[order[s]]; let e = s; while (e < total && key[order[e]] === c) e++; start.set(c, [s, e]); s = e; }
  m.near = (X, Y, r, keep = () => true) => {
    const out = [];
    for (let a = Math.floor((X - r) / G); a <= Math.floor((X + r) / G); a++) for (let b = Math.floor((Y - r) / G); b <= Math.floor((Y + r) / G); b++) {
      const s = start.get(b * GW + a);
      if (s) for (let p = s[0]; p < s[1]; p++) { const i = order[p], d = Math.hypot(m.X[i] - X, m.Y[i] - Y); if (d <= r && keep(i, d)) out.push(i); }
    }
    return out;
  };
  m.cells = { start, order, GW, G };
  return m;
}

// The points in clumps: two points are of one where they're within LINK across and LINK_H up of each
// other. Each clump: its points, its middle (X, Y), its length and width along and across the way it
// runs (`along`, radians from east towards south), the lowest and highest of it over the terrain and its
// lowest tenth, how many points, and of them how many DGT classed noise (a lamp's head often is).
const LINK = 0.5, LINK_H = 1;
export function clumps(m) {
  const { X, Y, H } = m, { start, order, GW } = m.cells, parent = Int32Array.from({ length: m.k }, (_, i) => i);
  const find = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  for (const [c, [s, e]] of start) {
    const cx = c % GW, cy = Math.floor(c / GW);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const nc = (cy + b) * GW + cx + a, r = nc >= c ? start.get(nc) : null;
      if (!r) continue;
      for (let p = s; p < e; p++) {
        const i = order[p];
        for (let q = nc === c ? p + 1 : r[0]; q < r[1]; q++) {
          const j = order[q], dx = X[i] - X[j], dy = Y[i] - Y[j];
          if (dx * dx + dy * dy <= LINK * LINK && Math.abs(H[i] - H[j]) <= LINK_H) { const a1 = find(i), b1 = find(j); if (a1 !== b1) parent[a1] = b1; }
        }
      }
    }
  }
  const groups = new Map();
  for (let i = 0; i < m.k; i++) { const r = find(i); let g = groups.get(r); if (!g) groups.set(r, (g = [])); g.push(i); }
  return [...groups.values()].map((g) => describe(m, g));
}
export function describe(m, g) {
  const { X, Y, H } = m;
  let mx = 0, my = 0;
  for (const i of g) { mx += X[i]; my += Y[i]; }
  mx /= g.length; my /= g.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const i of g) { const dx = X[i] - mx, dy = Y[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const along = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(along), uy = Math.sin(along);
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity, h0 = Infinity, h1 = -Infinity, noise = 0, green = 0;
  for (const i of g) {
    const a = (X[i] - mx) * ux + (Y[i] - my) * uy, b = -(X[i] - mx) * uy + (Y[i] - my) * ux;
    a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); h0 = Math.min(h0, H[i]); h1 = Math.max(h1, H[i]);
    if (m.cls[i] === CLASS.noise) noise++;
    const r = m.rgb[i * 3];
    if (m.nir[i] + r) green += (m.nir[i] - r) / (m.nir[i] + r);
  }
  const hs = Float32Array.from(g, (i) => H[i]).sort();
  return { pts: g, X: mx, Y: my, along, ends: [[mx + ux * a0, my + uy * a0], [mx + ux * a1, my + uy * a1]], L: a1 - a0 + 0.1, W: b1 - b0 + 0.1, h0, h1, h10: hs[Math.floor(hs.length / 10)], n: g.length, noise, ndvi: green / g.length };
}

// ---------------------------------------------------------------------------------------------
// What each clump is. `ctx` has what's round a point in the mosaic: the streets (street(X, Y), the
// nearest street's centre line within 15 m: how far from it and how wide it is), the walls (wall(X, Y,
// r): one within r), and the map's traffic lights and bus stops (signals(X, Y, r), stops(X, Y, r)).

export const KINDS = ['lamp', 'sign', 'traffic_light', 'pole', 'shelter', 'bench', 'bin', 'ecoponto', 'bollard', 'basket'];
export const why = {};
const no = (k) => { why[k] = (why[k] ?? 0) + 1; return null; };

// A pole: what the cloud sees of one is its head, standing clear in the air: a lamp's head and its
// arm, a sign's plate, a traffic light's lights, a few points to a few dozen; its post, a point or two
// at most. So a clump 2 m or more off the ground with nothing under it, as long as a lamp's arm at most
// (3 m) and thin across it, with no tree or building beside it, not in a tree's crown (trees.mjs's) or on
// a wall, and 1.5 m or more over the ground within 4 m (else it's a parapet's or a railing's top). Up to
// 3.6 m (and as small as a plate) a sign, within KERB of a carriageway, but a traffic light by the map's;
// higher a lamp, up to 7 m by the map's traffic lights a traffic light. On a wire (the cloud's points
// running on in a line at its height, both ways or 3 m one way), it's a wire's, a pole's that carries
// them or something on a wall as often as a lamp's: nothing (the photos found none of them a lamp).
const KERB = 3.5; // a sign or a traffic light stands this far from a carriageway's edge at most
const GREEN = -0.03; // a clump's points are growing at this NDVI or more (a lamp's head is at -0.1 to -0.25)
export function pole(m, c, ctx) {
  if (c.h0 < 2 || c.h1 < 2.2 || c.h1 > HI) return null;
  if (c.L > 3 || c.W > 1) return no('poles: too big');
  const tall = c.h1 > 3.6;
  if (c.n < (tall ? 3 : 2)) return no('poles: too few points');
  if (!tall && (c.L > 1.2 || c.W > 0.8)) return no('signs: too big');
  const ar = m.around(c.X, c.Y, 2);
  if (ar.plant > (tall ? 1 : 0.5) || c.ndvi > GREEN) return no('poles: by a tree, or growing');
  if (m.around(c.X, c.Y, 1.5).built > 0) return no('poles: by a building');
  if (ctx.wall(c.X, c.Y, 1)) return no('poles: on a wall (a railing, a fence)');
  if (ctx.tree(c.X, c.Y)) return no("poles: in a tree's crown");
  const rise = ctx.rise(c.X, c.Y, 4);
  if (rise > 1 && rise > c.h0 - 1.5) return no('poles: by higher ground (a parapet on a wall or a cutting)');
  const s = ctx.street(c.X, c.Y);
  if (!tall && s && s.d < s.w / 2 - 0.3) return no('signs: over a carriageway (a van)');
  if (!tall && !(s && s.d - s.w / 2 <= KERB)) return no("signs: away from the street (a building's glass front)");
  const own = new Set(c.pts), r = Math.max(c.L / 2, 0.4) + 0.3;
  const under = m.near(c.X, c.Y, r, (i) => !own.has(i) && m.H[i] >= 2 && m.H[i] < c.h0 - 0.4);
  if (under.length > 3) return no('poles: something under');
  // Its post: the points under it from half a metre up (but a car's or a person's, under 2 m, where
  // they're many).
  const post = m.near(c.X, c.Y, c.L / 2 + 0.6, (i) => !own.has(i) && m.H[i] >= 0.5 && m.H[i] < c.h0 - 0.4);
  const low = post.filter((i) => m.H[i] < 2);
  const legs = post.filter((i) => m.H[i] >= 2 || low.length <= 2);
  // On a wire: the points at its height round it, 1.5 to 8 m off, on a line through it.
  const hm = (c.h0 + c.h1) / 2, ring = m.near(c.X, c.Y, 8, (i, d) => d >= 1.5 && !own.has(i) && Math.abs(m.H[i] - hm) <= 1);
  let wire = 0;
  for (let deg = 0; deg < 180 && ring.length >= 4; deg += 5) {
    const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
    let fw = 0, bw = 0, far = 0;
    for (const i of ring) {
      const dx = m.X[i] - c.X, dy = m.Y[i] - c.Y, s = dx * ux + dy * uy;
      if (Math.abs(-dx * uy + dy * ux) > 0.35) continue;
      if (s > 0) fw++; else bw++;
      far = Math.max(far, Math.abs(s));
    }
    if ((fw >= 2 && bw >= 2) || ((fw >= 3 || bw >= 3) && far >= 3)) wire = Math.max(wire, fw + bw);
  }
  let kind;
  if (!tall) kind = c.h1 >= 2.8 && ctx.signals(c.X, c.Y, 25) ? 'traffic_light' : 'sign';
  else if (c.h1 <= 7 && ctx.signals(c.X, c.Y, 25)) kind = 'traffic_light';
  else if (wire) return no('poles: on a wire');
  else kind = 'lamp';
  // Where it stands: its post where the cloud saw it; else, for a head with an arm, the arm's end
  // away from the street (it reaches out over it); else under its middle.
  let at = [c.X, c.Y];
  if (legs.length) {
    const ps = legs.map((i) => [m.X[i], m.Y[i]]);
    at = [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  } else if (c.L >= 1) {
    const [a, b] = c.ends, sa = ctx.street(...a), sb = ctx.street(...b);
    if (sa && sb) at = sa.d > sb.d ? a : b;
  }
  // The way it faces: a lamp's arm from its post to its head; a plate along its points.
  const reach = Math.hypot(c.X - at[0], c.Y - at[1]);
  const angle = reach >= 0.5 ? Math.atan2(c.Y - at[1], c.X - at[0]) : c.along;
  return { kind, X: at[0], Y: at[1], angle, h: c.h1, n: c.n, ndvi: c.ndvi };
}

// A bus shelter: a roof 2.1 to 3.4 m up with little under it, 2 to 9 m long, within 25 m of a stop the
// map has, off the carriageway (where a van waits).
export function shelter(m, c, ctx) {
  if (!(c.h10 >= 1.9 && c.h1 >= 2.1 && c.h1 <= 3.4 && c.h1 - c.h10 <= 0.6 && c.L >= 2 && c.L <= 9 && c.W >= 0.8 && c.W <= 2.8 && c.n >= 12)) return null;
  if (!ctx.stops(c.X, c.Y, 25)) return no('shelters: no stop near');
  const s = ctx.street(c.X, c.Y);
  if (s && s.d < s.w / 2) return no('shelters: on a carriageway');
  return { kind: 'shelter', X: c.X, Y: c.Y, angle: c.along, h: c.h1, n: c.n, L: c.L, W: c.W };
}

// The low things the cloud sees are its few points on the top of each, and what's as high and as big
// is mostly parked cars: a car's roof, alone between its windows, is a container's lid; its bonnet a
// bench; and posts in a row are a fence's or a railing's. Checked against the photos (task 100's Notes),
// none of the benches, bins and bollards found that way was one; nor do an ecoponto's lids show their
// colours in the orthophoto (at 25 cm they're no brighter than the shadows round them). So those are
// the map's only.

// ---------------------------------------------------------------------------------------------
// OpenStreetMap's (fetch.mjs's `furniture`): each node of a kind of furniture, as the map places it.

const OSM_KIND = (t) => {
  if (t.highway === 'street_lamp') return 'lamp';
  if (t.power === 'pole' || t.man_made === 'utility_pole') return 'pole';
  if (t.traffic_sign && !t.highway) return 'sign';
  if (t.amenity === 'bench') return 'bench';
  if (t.amenity === 'waste_disposal') return 'bin';
  if (t.amenity === 'waste_basket') return 'basket';
  if (t.amenity === 'recycling' && t.recycling_type !== 'centre') return 'ecoponto';
  if (t.barrier === 'bollard' || t.barrier === 'block') return 'bollard';
  if ((t.highway === 'bus_stop' || t.public_transport === 'platform') && t.shelter === 'yes') return 'shelter';
  return null;
};
// How high each is where neither the map nor the LiDAR says.
const USUAL_H = { lamp: 8, sign: 2.8, traffic_light: 3.5, pole: 9, shelter: 2.6, bench: 0.8, bin: 1.3, ecoponto: 1.6, bollard: 0.9, basket: 0.9 };
// The map's kinds the LiDAR's can be: a lamp the map has may be on a pole that carries wires, or be a
// traffic light's.
const SAME = { lamp: ['lamp', 'pole', 'traffic_light'], pole: ['pole', 'lamp'], sign: ['sign'], bench: ['bench'], bin: ['bin', 'basket'], ecoponto: ['ecoponto', 'bin'], bollard: ['bollard'], shelter: ['shelter'], basket: ['bin'] };
const MATCH = { shelter: 6, bollard: 1.5 }; // how near one of the map's is to be the same, else 3 m

// A sign's face where no photo shows it (task 100's answer: the commonest sign for its place): a stop
// or a give-way sign by the map's, at a one-way street's wrong end a no entry, by a zebra crossing its
// sign, by a bus stop the stop's; else null, a sign the data can't tell.
export const FACES = ['stop', 'give_way', 'no_entry', 'crossing', 'bus_stop', 'direction', 'keep_left'];

// In a tile's header, each [kind, x, z, angle, h, source, face]: kind KINDS's index, x and z to 10 cm,
// angle to a hundredth of a radian, h to 10 cm, source 0 the map's and 1 the LiDAR's, face FACES's index
// and 1 more (0 none).
export const packFurniture = (f) => [KINDS.indexOf(f.kind), f.x, f.z, f.angle, f.h, f.source === 'lidar' ? 1 : 0, f.face ? FACES.indexOf(f.face) + 1 : 0];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] !== 'mark') {
  const t0 = Date.now();
  const keys = tilesOver(OPEN_BOX);
  for (const key of keys) await boil(key);
  const B = OPEN_BOX, inBox = (x, z, mg = 0) => x >= B.x0 - mg && x <= B.x1 + mg && z >= B.z0 - mg && z <= B.z1 + mg;
  const m = mosaic(keys);
  // Where the LiDAR saw what the map has at (x, z), as walls.mjs lays the map's things over it.
  const roofs = readCache('roofs.json');
  const shift = (x, z) => { const s = roofs.shifts[Math.floor(x / 250) + ',' + Math.floor(z / 250)]; return s ? { dx: s[0], dz: s[1] } : { dx: 0, dz: 0 }; };
  const fits = new Map();
  const toTM = (x, z) => { const i = Math.floor(x / 500), j = Math.floor(z / 500), k = i + ',' + j; let f = fits.get(k); if (!f) fits.set(k, (f = mapToTM({ x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 }))); return f(x, z); };
  // The map's (x, z) in the mosaic, where the LiDAR saw it; the LiDAR's (X, Y) on the map, where the
  // map has it (`seen`: as the LiDAR saw it).
  const into = (x, z) => { const s = shift(x, z), [e, n] = toTM(x + s.dx, z + s.dz); return [e - m.E0, m.N1 - n]; };
  const toMaps = new Map();
  const seen = (X, Y) => { const e = m.E0 + X, n = m.N1 - Y, k = tileKey(e, n); let f = toMaps.get(k); if (!f) toMaps.set(k, (f = tileToMap(k))); return f(e, n); };
  const onMap = (X, Y) => { const [x, z] = seen(X, Y), s = shift(x, z); return [x - s.dx, z - s.dz]; };

  // What's round a point: the streets, the walls, the map's traffic lights and bus stops.
  const segIndex = (segs) => {
    const g = new Grid(10);
    segs.forEach((s, i) => { const L = Math.hypot(s[2] - s[0], s[3] - s[1]), n = Math.ceil(L / 5); for (let f = 0; f <= n; f++) g.add(s[0] + ((s[2] - s[0]) * f) / n, s[1] + ((s[3] - s[1]) * f) / n, i); });
    return (X, Y, r) => { let best = null; for (const i of new Set(g.near(X, Y, Math.ceil(r / 10)))) { const [ax, ay, bx, by] = segs[i], d = segDist(X, Y, { x: ax, z: ay }, { x: bx, z: by }); if (d <= r && (!best || d < best.d)) best = { d, s: segs[i] }; } return best; };
  };
  const lines = streetsOf(onCarriageways(readCache('osm/base.json')), (x, z, mg) => inBox(x, z, mg + 20)).filter((l) => l.k <= 8 && l.level !== LEVEL.tunnel);
  const ssegs = [];
  for (const l of lines) for (let i = 1; i < l.pts.length; i++) ssegs.push([...into(...l.pts[i - 1]), ...into(...l.pts[i]), l.w, l]);
  const nearStreet = segIndex(ssegs);
  const street = (X, Y) => { const b = nearStreet(X, Y, 15); return b ? { d: b.d, w: b.s[4] } : null; };
  const wsegs = [];
  for (const w of readCache('walls.json').walls) if (w.kind !== 'gate' && w.kind !== 'bar') for (let i = 1; i < w.pts.length; i++) wsegs.push([...into(...w.pts[i - 1]), ...into(...w.pts[i])]);
  const nearWall = segIndex(wsegs), wall = (X, Y, r) => !!nearWall(X, Y, r);
  const osm = readCache('osm/furniture.json').elements.filter((e) => e.type === 'node').map((e) => ({ e, at: P(e) })).filter(({ at }) => inBox(...at, 30));
  const pointIndex = (list) => { const g = new Grid(25); for (const p of list) g.add(p[0], p[1], p); return (X, Y, r) => g.near(X, Y, Math.ceil(r / 25)).some((p) => Math.hypot(p[0] - X, p[1] - Y) <= r); };
  const signals = pointIndex(osm.filter(({ e }) => e.tags.highway === 'traffic_signals').map(({ at }) => into(...at)));
  const stops = pointIndex(osm.filter(({ e }) => e.tags.highway === 'bus_stop' || e.tags.public_transport === 'platform').map(({ at }) => into(...at)));
  // The trees' crowns (trees.mjs's, where the LiDAR saw them), and how far the terrain rises round a
  // point.
  const tg = new Grid(10);
  for (const t of readCache('trees.json').trees) if (inBox(t[0], t[1], 50)) tg.add(t[7], t[8], t);
  const tree = (X, Y) => { const [x, z] = seen(X, Y); return tg.near(x, z, 2).some((t) => Math.hypot(t[7] - x, t[8] - z) <= t[4] / 2 + 1); };
  const ground = await terrain();
  const rise = (X, Y, r) => { const [x, z] = seen(X, Y), h0 = ground.at(x, z); let hi = h0; for (let a = -r; a <= r; a += 0.5) for (let b = -r; b <= r; b += 0.5) if (a * a + b * b <= r * r) hi = Math.max(hi, ground.at(x + a, z + b)); return hi - h0; };
  const ctx = { street, wall, signals, stops, tree, rise };

  // The clumps; a head the cloud saw in pieces (a lamp's arm and its head) as one.
  let cs = clumps(m);
  {
    const heads = cs.filter((c) => c.h0 >= 2 && c.h1 >= 2.2 && c.L <= 3), g = new Grid(2), parent = new Map(heads.map((c) => [c, c]));
    const find = (c) => { while (parent.get(c) !== c) c = parent.get(c); return c; };
    for (const c of heads) { for (const o of g.near(c.X, c.Y, 1)) if (Math.hypot(o.X - c.X, o.Y - c.Y) <= 1.2 && Math.abs(o.h1 - c.h1) <= 1) parent.set(find(c), find(o)); g.add(c.X, c.Y, c); }
    const groups = new Map();
    for (const c of heads) { const r = find(c); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(c); }
    const merged = new Set(heads);
    cs = cs.filter((c) => !merged.has(c));
    for (const g2 of groups.values()) cs.push(g2.length === 1 ? g2[0] : describe(m, g2.flatMap((c) => c.pts)));
  }
  const mine = (c) => { const [x, z] = onMap(c.X, c.Y); return inBox(x, z); };
  const found = [];
  for (const c of cs) {
    if (!mine(c)) continue;
    const f = pole(m, c, ctx) ?? shelter(m, c, ctx);
    if (f) found.push(f);
  }
  // One of a kind in one place (a lamp's head the cloud saw twice) is one, the one seen more of.
  {
    const g = new Grid(2), gone = new Set();
    for (const f of [...found].sort((a, b) => b.n - a.n)) {
      if (g.near(f.X, f.Y, 1).some((o) => o.kind === f.kind && Math.hypot(o.X - f.X, o.Y - f.Y) < (f.kind === 'shelter' ? 4 : f.kind === 'bollard' ? 0.5 : 1.5))) { gone.add(f); continue; }
      g.add(f.X, f.Y, f);
    }
    why.twice = gone.size;
    for (let i = found.length - 1; i >= 0; i--) if (gone.has(found[i])) found.splice(i, 1);
  }
  console.log(`furniture: ${cs.length} clumps of points, ${found.length} found, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  // On the map, each with the way it faces turned onto the map's grid, and the map's own; where both
  // have one, the map's, as high as the LiDAR measured it.
  const out = [];
  for (const f of found) {
    const [x, z] = onMap(f.X, f.Y), [x1, z1] = onMap(f.X + Math.cos(f.angle), f.Y + Math.sin(f.angle));
    out.push({ kind: f.kind, x, z, angle: Math.atan2(z1 - z, x1 - x), h: f.h, source: 'lidar', ndvi: f.ndvi });
  }
  const og = new Grid(10);
  out.forEach((f) => og.add(f.x, f.z, f));
  const both = {};
  for (const { e, at } of osm) {
    const kind = OSM_KIND(e.tags);
    if (!kind || !inBox(...at)) continue;
    const [x, z] = at, r = MATCH[kind] ?? 3;
    let best = null;
    for (const f of og.near(x, z, 1)) { const d = Math.hypot(f.x - x, f.z - z); if (f.source === 'lidar' && !f.gone && SAME[kind].includes(f.kind) && d <= r && (!best || d < best.d)) best = { f, d }; }
    const h = parseFloat(e.tags.height);
    const mapped = { kind, x, z, angle: null, h: best ? best.f.h : h > 0 && h < 20 ? h : USUAL_H[kind], source: 'osm', id: e.id };
    if (kind === 'sign' && e.tags.traffic_sign) mapped.osmSign = e.tags.traffic_sign;
    if (best) { best.f.gone = true; mapped.angle = best.f.angle; both[kind] = (both[kind] ?? 0) + 1; }
    out.push(mapped);
  }
  const kept = out.filter((f) => !f.gone);
  if (process.env.DEBUG) { const hist = (l) => { const o = {}; for (const f of l) { const k = Math.round(f.ndvi * 20) / 20; o[k] = (o[k] ?? 0) + 1; } return JSON.stringify(Object.entries(o).sort((a, b) => a[0] - b[0])); }; console.log('ndvi of poles the map has too', hist(out.filter((f) => f.gone && f.ndvi != null))); console.log('ndvi of the rest', hist(out.filter((f) => !f.gone && f.ndvi != null))); }

  // The way each of the map's faces: a lamp's, a sign's or a traffic light's to the nearest street,
  // the rest along it.
  const msegs = [];
  for (const l of lines) for (let i = 1; i < l.pts.length; i++) msegs.push([...l.pts[i - 1], ...l.pts[i]]);
  const nearMap = segIndex(msegs);
  for (const f of kept) {
    if (f.angle != null) continue;
    const b = nearMap(f.x, f.z, 30);
    if (!b) { f.angle = 0; continue; }
    const [ax, az, bx, bz] = b.s, L = Math.hypot(bx - ax, bz - az) || 1, t = Math.max(0, Math.min(1, ((f.x - ax) * (bx - ax) + (f.z - az) * (bz - az)) / (L * L)));
    f.angle = ['lamp', 'sign', 'traffic_light', 'pole'].includes(f.kind) ? Math.atan2(az + (bz - az) * t - f.z, ax + (bx - ax) * t - f.x) : Math.atan2(bz - az, bx - ax);
  }

  // Each sign's face: as a photo shows it (refs/furniture.json's faces), else the commonest for its
  // place.
  const faces = fs.existsSync(SEEN) ? JSON.parse(fs.readFileSync(SEEN, 'utf8')).faces ?? [] : [];
  const streetNodes = readCache('osm/street.json').elements.filter((e) => e.type === 'node');
  const at = (pred) => { const g = new Grid(20); for (const e of [...osm.map((o) => o.e), ...streetNodes]) if (pred(e.tags ?? {})) { const [x, z] = P(e); g.add(x, z, [x, z]); } return (x, z, r) => g.near(x, z, Math.ceil(r / 20)).some((p) => Math.hypot(p[0] - x, p[1] - z) <= r); };
  const byStop = at((t) => t.highway === 'stop'), byGiveWay = at((t) => t.highway === 'give_way'), byCrossing = at((t) => t.highway === 'crossing' || t.crossing === 'zebra' || t.crossing === 'marked'), byBus = at((t) => t.highway === 'bus_stop');
  // The wrong ends of the one-way streets: the last node, as the traffic goes.
  const ends = new Grid(20);
  for (const l of lines) {
    if (!isOneway(l.t) || l.t.junction === 'roundabout') continue;
    const p = l.t.oneway === '-1' ? l.pts[0] : l.pts[l.pts.length - 1];
    ends.add(p[0], p[1], p);
  }
  const byWrongEnd = (x, z, r) => ends.near(x, z, 1).some((p) => Math.hypot(p[0] - x, p[1] - z) <= r);
  const faceCount = {};
  for (const f of kept) {
    if (f.kind !== 'sign') continue;
    const seenFace = faces.find((s) => Math.hypot(s.at[0] - f.x, s.at[1] - f.z) <= 1.5);
    f.face = seenFace ? seenFace.face : byStop(f.x, f.z, 15) ? 'stop' : byGiveWay(f.x, f.z, 15) ? 'give_way' : byWrongEnd(f.x, f.z, 12) ? 'no_entry' : byCrossing(f.x, f.z, 8) ? 'crossing' : byBus(f.x, f.z, 8) ? 'bus_stop' : null;
    faceCount[f.face ?? 'unknown'] = (faceCount[f.face ?? 'unknown'] ?? 0) + 1;
  }

  const final = kept.map((f) => ({ kind: f.kind, x: Math.round(f.x * 10) / 10, z: Math.round(f.z * 10) / 10, angle: Math.round(f.angle * 100) / 100, h: Math.round(f.h * 10) / 10, source: f.source, ...(f.kind === 'sign' ? { face: f.face } : {}), ...(f.id ? { id: f.id } : {}) }));
  const stats = Object.fromEntries(KINDS.map((k) => [k, { lidar: final.filter((f) => f.kind === k && f.source === 'lidar').length, osm: final.filter((f) => f.kind === k && f.source === 'osm').length, both: both[k] ?? 0 }]));
  console.log(`furniture: ${final.length} round the open world's area: ${JSON.stringify(stats)}; signs' faces ${JSON.stringify(faceCount)}; left out: ${JSON.stringify(why)}; in ${((Date.now() - t0) / 60000).toFixed(1)} minutes`);
  fs.writeFileSync(path.join(CACHE, 'furniture.json'), JSON.stringify({ about: "The street furniture round the open world's area, by tools/furniture.mjs: © OpenStreetMap contributors (ODbL); and DGT's 2025 LiDAR, informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).", why, stats, faces: faceCount, furniture: final }));
}

// ---------------------------------------------------------------------------------------------
// The sample checked against the photos (`mark`): the pieces the LiDAR found in view of the
// viewpoints' photos and the reference photos, within MARK_NEAR of the camera, not behind a building
// the world has; 50 of them drawn at random (seeded), and each photo they're in with them ringed and
// numbered, for a session to look at and say what each is (refs/furniture.json's checks).

export const MARK_NEAR = 50, SAMPLE = 50;
const KIND_COLOUR = { lamp: '#ffd400', sign: '#ff3b30', traffic_light: '#34c759', pole: '#ff9500', shelter: '#5ac8fa', bench: '#af52de', bin: '#ff2d55', ecoponto: '#30d158', bollard: '#ffffff', basket: '#a2845e' };

function project(c, [x, y, z]) {
  const d = [x - c.o[0], y - c.o[1], z - c.o[2]], ahead = d[0] * c.f[0] + d[1] * c.f[1] + d[2] * c.f[2];
  if (ahead < 0.5) return null;
  const a = (d[0] * c.r[0] + d[1] * c.r[1] + d[2] * c.r[2]) / ahead / c.tx, b = (d[0] * c.d[0] + d[1] * c.d[1] + d[2] * c.d[2]) / ahead / c.ty;
  return [a, b, ahead];
}

// The cameras: each viewpoint's (not the skylines') and each reference photo's that's fetched.
async function cameras(world) {
  const { photoCamera, viewCamera, jpegSize } = await import('./buildings.mjs');
  const views = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8'));
  const out = [];
  for (const v of [...views.viewpoints, ...(views.dropped ?? [])]) {
    const src = path.join(CACHE, 'refs', v.id + '.jpg');
    if (v.kind === 'skyline' || !fs.existsSync(src)) continue;
    const s = jpegSize(src);
    out.push({ id: v.id, src, cam: viewCamera(v, s.w / s.h), date: 'viewpoint' });
  }
  const dir = path.join(CACHE, 'refs', 'photos'), files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  for (const p of JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos) {
    const f = files.find((n) => n.replace(/\.\w+$/, '') === p.id);
    if (!f || p.photo.lat == null) continue;
    const src = path.join(dir, f), s = jpegSize(src);
    const cam = p.photo.pano
      ? photoCamera(p.photo, p.heading, p.pitch, 0, p.fov, s.w / s.h, world.height, 2.2)
      : photoCamera(p.photo, p.photo.heading, p.photo.pitch ?? 0, p.photo.roll ?? 0, p.fov, s.w / s.h, world.height, 1.4);
    out.push({ id: p.id, src, cam, date: p.photo.date });
  }
  return out;
}

// Whether the line from the camera to a point passes through a building the world has (its outline,
// below its eaves).
function hidden(world, cam, x, y, z) {
  const [ox, oy, oz] = cam.o, L = Math.hypot(x - ox, z - oz);
  for (const b of world.near(ox, oz, x, z)) {
    const pts = b.pts;
    for (let k = 0; k < pts.length; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length];
      const ex = bx - ax, ez = bz - az, fx = x - ox, fz = z - oz, den = fx * ez - fz * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - ox) * ez - (az - oz) * ex) / den, s = ((ax - ox) * fz - (az - oz) * fx) / den;
      if (t > 0.02 && t < 0.98 && s >= 0 && s <= 1 && oy + (y - oy) * t < b.y + b.h) return true;
    }
  }
  return false;
}

export async function mark() {
  const { loadWorld } = await import('../index.js');
  const sharp = (await import('sharp')).default;
  const { furniture } = readCache('furniture.json');
  const xs = furniture.map((f) => f.x), zs = furniture.map((f) => f.z);
  const world = await loadWorld({ x0: Math.min(...xs) - 50, x1: Math.max(...xs) + 50, z0: Math.min(...zs) - 50, z1: Math.max(...zs) + 50 });
  const bg = new Grid(50);
  for (const b of world.buildings) bg.add(b.pts[0][0], b.pts[0][1], b);
  world.near = (ax, az, bx, bz) => { const out = new Set(); const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 25); for (let k = 0; k <= n; k++) for (const b of bg.near(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n, 1)) out.add(b); return out; };
  const cams = await cameras(world);
  // Each piece of the LiDAR's in view of a photo, in the nearest photo that shows it.
  const seenIn = new Map();
  for (const c of cams) {
    for (const f of furniture) {
      if (f.source !== 'lidar' || (process.env.ONLY && !process.env.ONLY.split(',').includes(f.kind))) continue;
      const d = Math.hypot(f.x - c.cam.o[0], f.z - c.cam.o[2]);
      if (d > MARK_NEAR || d < 2) continue;
      const y = world.height(f.x, f.z), foot = project(c.cam, [f.x, y, f.z]), top = project(c.cam, [f.x, y + f.h, f.z]);
      if (!foot || !top || Math.abs(foot[0]) > 0.95 || Math.abs(top[0]) > 0.95 || top[1] > 0.98 || foot[1] < -0.98 || Math.min(foot[1], 0.98) - Math.max(top[1], -0.98) < 0.01) continue;
      if (hidden(world, c.cam, f.x, y + f.h / 2, f.z)) continue;
      const k = f.x + ',' + f.z;
      if (!seenIn.has(k) || seenIn.get(k).d > d) seenIn.set(k, { f, c, d });
    }
  }
  const seen = JSON.parse(fs.readFileSync(SEEN, 'utf8'));
  // The sample: those checked already, still found; then drawn at random from the rest in view.
  const pool = [...seenIn.values()].sort((a, b) => a.f.x - b.f.x || a.f.z - b.f.z);
  let seed = 100;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sample = [];
  for (const s of seen.checks ?? []) { const p = pool.find((q) => Math.hypot(q.f.x - s.at[0], q.f.z - s.at[1]) <= 0.2 && q.f.kind === s.kind); if (p) sample.push(p); }
  while (sample.length < SAMPLE && pool.length > sample.length) { const p = pool[Math.floor(rand() * pool.length)]; if (!sample.includes(p)) sample.push(p); }
  console.log(`furniture: ${pool.length} of the LiDAR's pieces in view of ${new Set(pool.map((p) => p.c.id)).size} photos; the sample: ${JSON.stringify(Object.fromEntries(KINDS.map((k) => [k, sample.filter((s) => s.f.kind === k).length])))}`);
  const dir = path.join(CACHE, 'furniture');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const byPhoto = new Map();
  sample.forEach((s, i) => { s.n = i + 1; if (!byPhoto.has(s.c.id)) byPhoto.set(s.c.id, []); byPhoto.get(s.c.id).push(s); });
  for (const [id, list] of byPhoto) {
    const { src, cam } = list[0].c, { jpegSize } = await import('./buildings.mjs'), sz = jpegSize(src), w = Math.min(1600, sz.w), h = Math.round((sz.h * w) / sz.w);
    const px = ([a, b]) => [((a + 1) / 2) * w, ((b + 1) / 2) * h];
    const svg = [];
    for (const s of list) {
      const { f } = s, y = world.height(f.x, f.z), [u0, v0] = px(project(cam, [f.x, y, f.z])), [u1, v1] = px(project(cam, [f.x, y + f.h, f.z])), col = KIND_COLOUR[f.kind];
      const r = Math.max(14, Math.abs(v0 - v1) * 0.35);
      svg.push(`<line x1="${u0.toFixed(0)}" y1="${v0.toFixed(0)}" x2="${u1.toFixed(0)}" y2="${v1.toFixed(0)}" stroke="${col}" stroke-width="2" stroke-dasharray="6 4"/>`);
      svg.push(`<ellipse cx="${u1.toFixed(0)}" cy="${((v0 + v1) / 2).toFixed(0)}" rx="${r.toFixed(0)}" ry="${(Math.abs(v0 - v1) / 2 + 12).toFixed(0)}" stroke="${col}" stroke-width="2" fill="none"/>`);
      svg.push(`<text x="${(u1 + r + 6).toFixed(0)}" y="${v1.toFixed(0)}" font-family="Arial" font-weight="bold" font-size="24" fill="${col}" stroke="#000" stroke-width="4" paint-order="stroke">${s.n} ${f.kind}</text>`);
    }
    await sharp(src).resize(w, h).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svg.join('')}</svg>`) }]).jpeg({ quality: 88 }).toFile(path.join(dir, id + '.jpg'));
  }
  const legend = sample.map((s) => ({ n: s.n, kind: s.f.kind, at: [s.f.x, s.f.z], h: s.f.h, photo: s.c.id, date: s.c.date, dist: Math.round(s.d * 10) / 10 }));
  fs.writeFileSync(path.join(dir, 'sample.json'), JSON.stringify(legend, null, 1));
  console.log(`furniture: the sample in ${byPhoto.size} photos, in ${dir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] === 'mark') await mark();
