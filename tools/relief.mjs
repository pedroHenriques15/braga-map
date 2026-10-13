// Checks the ground the world and the tracks stand on (task 009): the heights of known places in the
// world's tiles against DGT's LiDAR and against heights DGT publishes, a bridge's deck on a track
// against the LiDAR's, and each track's heights along it against the relief the map had before (the
// Terrain Tiles, made from EU-DEM), as a profile.
//
// node tools/relief.mjs
//
// It needs the LiDAR (node tools/fetch.mjs lidar) and the Terrain Tiles (node tools/fetch.mjs dem).
// test/relief.test.js asserts what it prints.
import fs from 'node:fs';
import path from 'node:path';
import { loadWorld, map } from '../index.js';
import { TILES } from '../world/tiles.js';
import { CLASS, points, tileKey, toTM } from './dgt.mjs';
import { CACHE, ELEV0, P, relief, ROOT } from './geo.mjs';
import { terrain } from './terrain.mjs';

// Heights DGT publishes (its OGC API, collections srup_marcos_geod and altimetria_pontos, read on
// 2026-10-13), above the Cascais datum. A geodetic mark's height is its own, not the ground's: the
// Picoto's stands on the viewpoint's platform, about 3 m above the ground round it. The spot heights
// are whole metres, off the old maps.
export const PUBLISHED = [
  { name: 'Sameiro, geodetic mark SAMEIRO-M2 (observed)', lat: 41.54170097757882, lon: -8.369446090230781, h: 571.62, mark: true },
  { name: 'Picoto, geodetic mark PICOTO 1 (on a platform)', lat: 41.537856501280395, lon: -8.414208559902663, h: 298.13, mark: true },
  { name: 'Picoto, spot height', lat: 41.53768064341203, lon: -8.414177480107163, h: 298 },
  { name: 'Spot height by the Avenida da Liberdade', lat: 41.5445162977886, lon: -8.408563202648745, h: 208 },
  { name: 'Spot height in Fraião', lat: 41.556070400516774, lon: -8.42086804499433, h: 206 },
];

export async function check() {
  const ground = await terrain();
  const eudem = relief(path.join(CACHE, 'dem'));
  const m = map();
  // The places, each where the world's tiles and the LiDAR can be compared: the Praça's middle, the
  // Picoto's and the Sameiro's tops (the highest ground the LiDAR has within 30 m of the cross and
  // the sanctuary).
  const top = (x0, z0) => {
    let best = [x0, z0, -Infinity];
    for (let dx = -30; dx <= 30; dx += 0.5) for (let dz = -30; dz <= 30; dz += 0.5) { const h = ground.at(x0 + dx, z0 + dz); if (h > best[2]) best = [x0 + dx, z0 + dz, h]; }
    return best;
  };
  const cross = m.sights.find((s) => s.kind === 'cruzeiro'), sameiro = m.sights.find((s) => s.kind === 'sameiro');
  const places = [['the Praça da República', 0, 0], ['the Picoto, its top', ...top(cross.x, cross.z)], ['the Sameiro, its top', ...top(sameiro.x, sameiro.z)]];
  const world = await loadWorld({ x0: -100, x1: 4500, z0: -100, z1: 1600 });
  const known = await Promise.all(places.map(async ([name, x, z]) => {
    const lidar = ground.at(x, z), tile = world.height(x, z) + ELEV0;
    return { name, x: +x.toFixed(1), z: +z.toFixed(1), lidar: +lidar.toFixed(2), tile: +tile.toFixed(2), step: await stepOf(m.tileAt(x, z)), diff: +(tile - lidar).toFixed(2), eudem: +eudem(x, z).toFixed(1) };
  }));
  const published = PUBLISHED.map((p) => {
    const [x, z] = P(p), lidar = ground.at(x, z);
    return { name: p.name, published: p.h, lidar: +lidar.toFixed(2), diff: +(lidar - p.h).toFixed(2), eudem: +(eudem(x, z) - p.h).toFixed(1) };
  });
  // Each track's bridges: its height in the middle of each, against the LiDAR's points on the deck
  // there (within 3 m of the centre line), where the point cloud was fetched.
  const tracks = await Promise.all(fs.readdirSync(path.join(ROOT, 'tracks')).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
  const mids = [];
  for (const t of tracks) {
    for (let i = 0; i < t.points.length; i++) {
      if (t.points[i].bridge !== true) continue;
      let j = i;
      while (t.points[(j + 1) % t.points.length].bridge === undefined) j++;
      const [x, y, z] = t.points[Math.round((i + j) / 2)].p, key = tileKey(...toTM(x, z));
      if (fs.existsSync(path.join(CACHE, 'dgt', 'LAZ', key + '.laz'))) mids.push({ track: t.id, at: Math.round(i * 8), length: (j - i + 1) * 8, x, y, z, key, hs: [] });
    }
  }
  // A tile's points read once for all the bridges on it.
  for (const key of new Set(mids.map((d) => d.key))) {
    const here = mids.filter((d) => d.key === key);
    await points(key, (pt) => { if (pt.cls === CLASS.bridge) for (const d of here) if (Math.hypot(pt.x - d.x, pt.z - d.z) < 3) d.hs.push(pt.y); });
  }
  const decks = mids.filter((d) => d.hs.length >= 5).map(({ track, at, length, x, y, z, hs }) => {
    const deck = hs.sort((p, q) => p - q)[hs.length >> 1];
    return { track, at, length, track_y: +(y + ELEV0).toFixed(2), deck: +deck.toFixed(2), diff: +(y + ELEV0 - deck).toFixed(2), ground: +ground.at(x, z).toFixed(1) };
  });
  // The profile: every 200 m of each track, its height now, the LiDAR's on its centre line, and the
  // relief the map had before.
  const profiles = tracks.map((t) => ({
    track: t.id,
    rows: t.points.filter((_, i) => i % 25 === 0).map((q, k) => {
      const [x, y, z] = q.p, now = y + ELEV0;
      return { at: k * 200, x: Math.round(x), z: Math.round(z), track: +now.toFixed(1), lidar: +ground.at(x, z).toFixed(1), before: +eudem(x, z).toFixed(1), change: +(ground.at(x, z) - eudem(x, z)).toFixed(1) };
    }),
  }));
  return { known, published, decks, profiles };
}

// How far apart a tile has the ground's heights, from its header.
async function stepOf(id) {
  const bin = Buffer.from((await TILES[id]()).default, 'base64');
  return JSON.parse(bin.subarray(4, 4 + bin.readUInt32LE(0)).toString()).terrain.step;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const r = await check();
  console.log('Known places: the world\'s tiles against the LiDAR (metres above the sea)');
  console.table(r.known);
  console.log('Heights DGT publishes, against the LiDAR (and against the relief before, EU-DEM)');
  console.table(r.published);
  console.log('Bridges on the tracks: the track\'s height in the middle against the LiDAR\'s deck');
  console.table(r.decks);
  for (const p of r.profiles) {
    console.log(`${p.track}: the profile every 200 m (change: the LiDAR less the relief before)`);
    console.table(p.rows);
    const ch = p.rows.map((q) => q.change);
    console.log(`change: mean ${(ch.reduce((a, b) => a + b, 0) / ch.length).toFixed(1)} m, from ${Math.min(...ch)} to ${Math.max(...ch)} m`);
  }
}
