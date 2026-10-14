// The map's extent, the 500 m tiles it's cut into, and the named sections the tiles are grouped in.
// A game loads only the tiles it needs: those under a track's box, or a section's.
import fs from 'node:fs';
import { inside } from './osm.mjs';

// What the map covers: the data fetch.mjs downloads reaches a little further.
export const EXT = { x0: -1600, x1: 4900, z0: -2450, z1: 2150 };
// The area first asked for, inside it.
export const CORE = { x0: -1500, x1: 2830, z0: -2300, z1: 2010 };
// Where the first shooter is played: the streets of Fujacal and Conselheiro Lobato (decision 003;
// task 015 settles their edge). It gets the detail the tracks get.
export const SHOOTER = { x0: -350, x1: 350, z0: 600, z1: 1050 };
// The open world's area (decision 019): the Volta dos Amigos' and about 150 m round it, where a game
// lets the player drive anywhere. OPEN is its edge, a ring of [x, z] points (open.mjs works it out,
// task 032), and OPEN_BOX the box round it. Every street in the box is a surface (streets.mjs, task
// 033), and the ground on every tile it touches is every 2 m (world.mjs).
export const { pts: OPEN } = JSON.parse(fs.readFileSync(new URL('./open.json', import.meta.url), 'utf8'));
export const OPEN_BOX = {
  x0: Math.floor(Math.min(...OPEN.map((p) => p[0]))),
  x1: Math.ceil(Math.max(...OPEN.map((p) => p[0]))),
  z0: Math.floor(Math.min(...OPEN.map((p) => p[1]))),
  z1: Math.ceil(Math.max(...OPEN.map((p) => p[1]))),
};

// Tiles are TILE metres square, on a grid from the Praça da República: tile (i, j) runs from
// x = i·TILE to (i + 1)·TILE and z = j·TILE to (j + 1)·TILE. They cover EXT.
export const TILE = 500;
export const I0 = Math.floor(EXT.x0 / TILE), I1 = Math.ceil(EXT.x1 / TILE) - 1;
export const J0 = Math.floor(EXT.z0 / TILE), J1 = Math.ceil(EXT.z1 / TILE) - 1;
export const tileId = (i, j) => `x${i}z${j}`;
export const tileOf = (x, z) => [Math.floor(x / TILE), Math.floor(z / TILE)];
export const tileBox = (i, j) => ({ x0: i * TILE, x1: (i + 1) * TILE, z0: j * TILE, z1: (j + 1) * TILE });
export const allTiles = () => {
  const out = [];
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) out.push([i, j]);
  return out;
};

// The sections, grown from the six zones chosen for tracks on the map page (ZONES in index.html,
// where they were voted on): each tile belongs to the zone its middle is in, or else the nearest.
// Their ids are the zones' ids.
export const ZONES = [
  { id: 'centro', name: 'Centro', x0: -1250, x1: 250, z0: -480, z1: 700 },
  { id: 'estadio', name: 'Estádio', x0: -1200, x1: -100, z0: -1750, z1: -800 },
  { id: 'gualtar', name: 'Gualtar', x0: 1150, x1: 2600, z0: -2300, z1: -650 },
  { id: 'lamacaes', name: 'Lamaçães', x0: 1300, x1: 2750, z0: 150, z1: 1300 },
  { id: 'picoto', name: 'Picoto', x0: -350, x1: 1100, z0: 850, z1: 1950 },
  { id: 'bomjesus', name: 'Bom Jesus e Sameiro', x0: 3150, x1: 4750, z0: -950, z1: 1550 },
];

const boxDist = (b, x, z) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1));
export const sectionOfTile = (i, j) => {
  const x = (i + 0.5) * TILE, z = (j + 0.5) * TILE;
  let best = null, bd = Infinity;
  for (const s of ZONES) { const d = boxDist(s, x, z); if (d < bd) { bd = d; best = s; } }
  return best.id;
};
export const sectionOf = (x, z) => sectionOfTile(...tileOf(x, z));

// Whether the ring `pts` and the box `b` meet: a side of the ring crosses the box (Liang and Barsky's
// clipping), or the box is inside the ring.
export function meets(pts, b) {
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], dx = bx - ax, dz = bz - az;
    let t0 = 0, t1 = 1;
    const clip = (p, q) => { if (!p) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; t0 = Math.max(t0, r); } else { if (r < t0) return false; t1 = Math.min(t1, r); } return true; };
    if (clip(-dx, ax - b.x0) && clip(dx, b.x1 - ax) && clip(-dz, az - b.z0) && clip(dz, b.z1 - az) && t0 <= t1) return true;
  }
  return inside(pts, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
}
// The tiles the open world's area touches, and those round it, within OPEN_ROUND of it: the city seen
// past its edge, as a track's box has 500 m round the track.
export const OPEN_ROUND = 500;
export const OPEN_TILES = allTiles().filter(([i, j]) => meets(OPEN, tileBox(i, j))).map(([i, j]) => tileId(i, j));
export const OPEN_SEEN = allTiles()
  .filter(([i, j]) => { const b = tileBox(i, j); return !OPEN_TILES.includes(tileId(i, j)) && meets(OPEN, { x0: b.x0 - OPEN_ROUND, x1: b.x1 + OPEN_ROUND, z0: b.z0 - OPEN_ROUND, z1: b.z1 + OPEN_ROUND }); })
  .map(([i, j]) => tileId(i, j));

export const SECTIONS = ZONES.map(({ id, name }) => ({
  id,
  name,
  tiles: allTiles().filter(([i, j]) => sectionOfTile(i, j) === id).map(([i, j]) => tileId(i, j)),
}));
