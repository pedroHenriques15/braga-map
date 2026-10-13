// The map's extent, the 500 m tiles it's cut into, and the named sections the tiles are grouped in.
// A game loads only the tiles it needs: those under a track's box, or a section's.

// What the map covers: the data fetch.mjs downloads reaches a little further.
export const EXT = { x0: -1600, x1: 4900, z0: -2450, z1: 2150 };
// The area first asked for, inside it.
export const CORE = { x0: -1500, x1: 2830, z0: -2300, z1: 2010 };

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

export const SECTIONS = ZONES.map(({ id, name }) => ({
  id,
  name,
  tiles: allTiles().filter(([i, j]) => sectionOfTile(i, j) === id).map(([i, j]) => tileId(i, j)),
}));
