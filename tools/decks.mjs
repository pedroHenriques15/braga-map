// The bridges' decks where DGT's 2025 point cloud saw them (task 047). The terrain model is the bare
// earth, which has what's under a deck, and on a viaduct the point cloud has the deck itself as class
// 26 (task 012). The world takes a deck straight between the ground at its ends, which is right for a
// bridge over a valley and wrong for a flyover, which humps over what it crosses: the Rotunda Santos
// da Cunha's viaduct is 12.6 m over the sea's 154 m where the straight line puts it at 6. So each tile's
// class-26 points are boiled down to the median height in each metre of the map, for world.mjs.
//
// node tools/decks.mjs     after fetch.mjs lidar, before world.mjs (about 10 minutes)
//
// .cache/decks.json: { res, cells: [[i, j, height above the sea], …] }, the metre (i, j) on the map
// from (i·res, j·res), where it has two points or more. Class 26 is also other structures off the
// ground (the Picoto's platform): world.mjs reads it only along a bridge.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CACHE } from './geo.mjs';
import { CLASS, DGT, points } from './dgt.mjs';

const FILE = path.join(CACHE, 'decks.json');

// The decks' heights: `at(x, z, r)`, the median of the metres within r of (x, z) that have one, and
// how many; null where none has. Null too, everywhere, when decks.mjs hasn't been run.
export function decks() {
  if (!fs.existsSync(FILE)) return null;
  const { res, cells } = JSON.parse(fs.readFileSync(FILE, 'utf8')), grid = new Map(cells.map(([i, j, h]) => [i + ',' + j, h]));
  return {
    at(x, z, r) {
      const hs = [];
      for (let i = Math.floor((x - r) / res); i <= Math.floor((x + r) / res); i++) for (let j = Math.floor((z - r) / res); j <= Math.floor((z + r) / res); j++) {
        const h = grid.get(i + ',' + j);
        if (h !== undefined && Math.hypot((i + 0.5) * res - x, (j + 0.5) * res - z) <= r) hs.push(h);
      }
      if (!hs.length) return null;
      hs.sort((a, b) => a - b);
      return { y: hs[hs.length >> 1], n: hs.length };
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const RES = 1, t0 = Date.now(), cells = new Map();
  const keys = fs.readdirSync(path.join(DGT, 'LAZ')).filter((f) => f.endsWith('.laz')).map((f) => f.slice(0, -4)).sort();
  for (const [k, key] of keys.entries()) {
    const t1 = Date.now();
    let n = 0;
    await points(key, (pt) => {
      if (pt.cls !== CLASS.bridge) return;
      const c = Math.floor(pt.x / RES) + ',' + Math.floor(pt.z / RES);
      let ys = cells.get(c);
      if (!ys) cells.set(c, (ys = []));
      ys.push(pt.y);
      n++;
    });
    console.log(`${key}: ${n} points of decks (${k + 1} of ${keys.length}, ${((Date.now() - t1) / 1000).toFixed(0)} s)`);
  }
  const out = [];
  for (const [c, ys] of cells) {
    if (ys.length < 2) continue;
    ys.sort((a, b) => a - b);
    const [i, j] = c.split(',').map(Number);
    out.push([i, j, Math.round(ys[ys.length >> 1] * 100) / 100]);
  }
  fs.writeFileSync(FILE, JSON.stringify({ about: "The decks DGT's 2025 point cloud saw (class 26), by tools/decks.mjs: informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).", res: RES, cells: out }));
  console.log(`${out.length} metres of deck, in ${((Date.now() - t0) / 60000).toFixed(1)} minutes → ${path.relative(process.cwd(), FILE)}`);
}
