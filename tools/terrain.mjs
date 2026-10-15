// The ground the map stands on, in metres above the sea (the Cascais datum), anywhere on the map:
// DGT's LiDAR terrain model (MDT, flown in July 2025), at 50 cm where fetch.mjs got it (the tracks'
// box, which holds the shooter's area) and at 2 m over the rest of the map. The bare ground: no
// buildings, trees or cars, and no bridges either (a deck's ground is what's under it). Beyond the
// map, for the horizon, the Terrain Tiles (EU-DEM) are all there is. docs/SOURCES.md has their
// licences and credits. Read with dev dependencies only: nothing here ships to games.
import fs from 'node:fs';
import path from 'node:path';
import { DGT, mapToTM, readModel } from './dgt.mjs';
import { CACHE, relief } from './geo.mjs';

// One of DGT's models as a single lattice over all its tiles: cell (i, j) has its centre at
// ((i + 0.5)·res, (j + 0.5)·res) in EPSG:3763, on DGT's 1 km tiles. NaN where it's empty or
// wasn't fetched.
async function lattice(collection, res) {
  const dir = path.join(DGT, collection), tiles = new Map(), per = Math.round(1000 / res);
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.tif')) : []) {
    const key = f.slice(0, -4), [ke, kn] = key.split('_').map(Number), t = await readModel(path.join(dir, f));
    if (t.res !== res || t.w !== per || t.h !== per || Math.abs(t.e0 - (ke * 1000 + res / 2)) > 1e-6 || Math.abs(t.n1 - ((kn + 1) * 1000 - res / 2)) > 1e-6) throw new Error(`${collection}/${f} isn't on DGT's 1 km grid at ${res} m`);
    tiles.set(key, t);
  }
  const cell = (i, j) => {
    const ti = Math.floor(i / per), tj = Math.floor(j / per), t = tiles.get(ti + '_' + tj);
    if (!t) return NaN;
    const v = t.data[(per - 1 - (j - tj * per)) * per + (i - ti * per)];
    return v === t.nodata || v < -100 ? NaN : v;
  };
  // Between the cells' centres, across the tiles' edges; NaN if any of the four is missing.
  const at = (e, n) => {
    const fx = e / res - 0.5, fy = n / res - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    return (cell(i, j) * (1 - u) + cell(i + 1, j) * u) * (1 - v) + (cell(i, j + 1) * (1 - u) + cell(i + 1, j + 1) * u) * v;
  };
  return { res, tiles: tiles.size, at };
}

export async function terrain() {
  const fine = await lattice('MDT-50cm', 0.5), coarse = await lattice('MDT-2m', 2);
  if (!coarse.tiles) throw new Error('No LiDAR terrain in .cache/dgt/MDT-2m: node tools/fetch.mjs lidar');
  const eudem = relief(path.join(CACHE, 'dem'));
  // The map's metres to EPSG:3763: a fit for each 500 m square, made when it's first needed (proj4
  // for every point would take minutes).
  const fits = new Map();
  const toTM = (x, z) => {
    const i = Math.floor(x / 500), j = Math.floor(z / 500), k = i + ',' + j;
    let f = fits.get(k);
    if (!f) fits.set(k, (f = mapToTM({ x0: i * 500, x1: i * 500 + 500, z0: j * 500, z1: j * 500 + 500 })));
    return f(x, z);
  };
  const lidar = (x, z, finest) => {
    const [e, n] = toTM(x, z), h = finest ? fine.at(e, n) : NaN;
    return Number.isNaN(h) ? coarse.at(e, n) : h;
  };
  return {
    // The height at (x, z), between the finest cells there.
    at(x, z) {
      const h = lidar(x, z, true);
      return Number.isNaN(h) ? eudem(x, z) : h;
    },
    // The mean height over a square s metres a side round (x, z): what a grid with that step should
    // hold there, so the steps and walls between its points don't alias into it. From the 50 cm
    // model for a fine grid and the 2 m one for a coarse grid, sampled at their own spacing (at
    // most 25 × 25 points). Where `held(x, z)` gives a height (lines.mjs's heldGround), that one.
    mean(x, z, s, held) {
      const finest = s < 8, n = Math.max(1, Math.min(25, Math.round(s / (finest ? fine.res : coarse.res))));
      let sum = 0, k = 0;
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          const px = x + ((a + 0.5) / n - 0.5) * s, pz = z + ((b + 0.5) / n - 0.5) * s, h = held?.(px, pz) ?? lidar(px, pz, finest);
          if (!Number.isNaN(h)) sum += h, k++;
        }
      }
      return k ? sum / k : eudem(x, z);
    },
    // Whether the LiDAR covers (x, z), at 50 cm (`fine`) or at all.
    covers(x, z, fineOnly = false) {
      return !Number.isNaN(fineOnly ? fine.at(...toTM(x, z)) : lidar(x, z, false));
    },
  };
}
