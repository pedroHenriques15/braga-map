// The footprints made from the LiDAR where the map has no building (task 011): made-up buildings
// drawn into a grid of 50 cm cells, as the point cloud's rasters are, come back as their own
// outlines, and what's too thin or too small to be a building doesn't. Then the world's: no house
// invented where the LiDAR saw.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadWorld, map } from '../index.js';
import { tileKey, toTM } from '../tools/dgt.mjs';
import { buildings, crosses, fit, square } from '../tools/footprints.mjs';
import { CACHE, readCache } from '../tools/geo.mjs';
import { footprints, Grid, inside, ringArea, ringOf } from '../tools/osm.mjs';

const C = 0.5, W = 200, H = 160; // a grid of 100 × 80 m
// A loop in metres, turned by `deg` about (cx, cz) and moved there.
const place = (pts, cx, cz, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]);
};
const draw = (mask, ring) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(ring, (x + 0.5) * C, (y + 0.5) * C)) mask[y * W + x] = 1;
};
// The footprint's corners, each matched with the nearest of the truth's: how far off the worst is.
const worst = (got, want) => Math.max(...want.map(([x, z]) => Math.min(...got.map(([a, b]) => Math.hypot(a - x, b - z)))));

const house = place([[-6, -4], [6, -4], [6, 4], [-6, 4]], 20, 20, 20);
const ell = place([[-9, -7], [9, -7], [9, -1], [-2, -1], [-2, 7], [-9, 7]], 60, 22, -35);
const block = place([[-12, -6], [12, -6], [12, 6], [-12, 6]], 30, 55, 3);
const wall = place([[-15, -0.5], [15, -0.5], [15, 0.5], [-15, 0.5]], 70, 55, 50);
const shed = place([[-2, -1.5], [2, -1.5], [2, 1.5], [-2, 1.5]], 85, 10, 0);

const mask = new Uint8Array(W * H);
for (const r of [house, ell, block, wall, shed]) draw(mask, r);
const found = buildings(mask, W, H, 2, 80).map((b) => {
  const ring = b.ring.map(([x, y]) => [x * C, y * C]);
  return { b, ring, sq: square(ring) };
});
// The one found over a made-up building: over its first corner's cell, inside it.
const near = (r) => found.find((f) => { const [x, z] = r[0], [cx, cz] = r[2]; return inside(f.ring, x + (cx - x) * 0.05, z + (cz - z) * 0.05); });

test('a wall and a shed are too thin or too small to be a building', () => {
  assert.equal(found.length, 3, `${found.length} found`);
  assert.equal(near(wall), undefined);
  assert.equal(near(shed), undefined);
});

test('the outline traced goes round the cells it covers', () => {
  for (const { b, ring } of found) {
    assert.ok(!crosses(ring));
    assert.ok(Math.abs(ringArea(ring) / (C * C) - b.cells) < 1, `${ringArea(ring) / (C * C)} cells round, ${b.cells} in it`);
  }
});

test('a house, an L and a block come back square, on their own walls', () => {
  for (const [r, corners] of [[house, 4], [ell, 6], [block, 4]]) {
    const f = near(r);
    assert.ok(f && f.sq, 'found and squared');
    assert.equal(f.sq.length, corners, `${f.sq.length} corners`);
    assert.ok(worst(f.sq, r) < 0.45, `its corners up to ${worst(f.sq, r).toFixed(2)} m off`);
    assert.ok(Math.abs(ringArea(f.sq) / ringArea(r) - 1) < 0.06, `its area ${ringArea(f.sq).toFixed(1)} of ${ringArea(r).toFixed(1)} m²`);
    assert.ok(fit(f.sq.map(([x, z]) => [x / C, z / C]), f.b) > 0.9);
  }
});

// The world as world.mjs made it from .cache/roofs.json: where the LiDAR saw, no house is invented,
// and every footprint says where it's from.
const lidar = fs.existsSync(path.join(CACHE, 'roofs.json')) ? readCache('roofs.json') : null;
const skip = !lidar?.found && "the buildings the map lacks aren't found (node tools/roofs.mjs)";

test('no house is invented where the LiDAR saw, and every footprint says where it is from', { skip }, async () => {
  const w = await loadWorld({ sections: map().sections.map((s) => s.id) });
  const seen = new Set(lidar.seen);
  const count = { osm: 0, lidar: 0, microsoft: 0, invented: 0 };
  for (const b of w.buildings) {
    assert.ok(b.source in count, `a footprint from ${b.source}`);
    assert.equal(b.filled, b.source === 'invented');
    count[b.source]++;
    if (b.source === 'invented') assert.ok(!b.pts.some(([x, z]) => seen.has(tileKey(...toTM(x, z)))), `an invented house at ${b.pts[0]}, where the LiDAR saw`);
  }
  assert.ok(count.lidar + count.microsoft > 0, 'the buildings the map lacks are in the tiles');
  console.log(`footprints in the tiles: ${JSON.stringify(count)}`);
});

test("the buildings found lie over the LiDAR's, clear of the map's", { skip }, () => {
  const fits = lidar.found.map((f) => f.fit).sort((a, b) => a - b);
  assert.ok(fits[Math.floor(fits.length / 2)] > 0.85, `their outlines over the LiDAR's cells: ${fits[Math.floor(fits.length / 2)]} the median`);
  // None mostly over one of the map's outlines (each laid where the LiDAR's buildings say).
  const osm = footprints(readCache('osm/buildings.json')).map(ringOf);
  const grid = new Grid(50);
  osm.forEach((r, i) => grid.add(r[0][0], r[0][1], i));
  let over = 0;
  for (const f of lidar.found) {
    const [x, z] = f.pts.reduce((s, p) => [s[0] + p[0] / f.pts.length, s[1] + p[1] / f.pts.length], [0, 0]);
    if (inside(f.pts, x, z) && grid.near(x, z, 1).some((i) => inside(osm[i], x, z))) over++;
  }
  assert.ok(over < lidar.found.length * 0.01, `${over} of ${lidar.found.length} with their middle in one of the map's`);
});

test("the LiDAR's canopies over the map's car parks aren't drawn as buildings (task 116)", async () => {
  // The buildings the map lacks whose middle is on a car park, under 4.6 m tall, each once (a building
  // across two tiles is two pieces): 82 before task 116 (the tents and solar canopies over the cars
  // most of them); now the kiosks, sheds and a few canopies the rule can't tell.
  const w = await loadWorld({ sections: map().sections.map((s) => s.id) });
  const parks = w.areas.filter((a) => a.kind === 'parking');
  const grid = new Grid(50);
  parks.forEach((a, i) => grid.add(a.pts[0][0], a.pts[0][1], i));
  const reach = Math.ceil(Math.max(...parks.map((a) => Math.max(...a.pts.map(([x, z]) => Math.hypot(x - a.pts[0][0], z - a.pts[0][1]))))) / 50);
  const low = new Set();
  for (const b of w.buildings) {
    if ((b.source !== 'lidar' && b.source !== 'microsoft') || b.h >= 4.6) continue;
    const [x, z] = b.pts.reduce((s, p) => [s[0] + p[0] / b.pts.length, s[1] + p[1] / b.pts.length], [0, 0]);
    if (grid.near(x, z, reach).some((i) => inside(parks[i].pts, x, z) && !parks[i].holes.some((h) => inside(h, x, z)))) low.add(`${Math.round(x * 2)},${Math.round(z * 2)}`);
  }
  console.log(`the LiDAR's buildings under 4.6 m on the map's car parks: ${low.size}`);
  assert.ok(low.size <= 40, `${low.size} under 4.6 m on a car park`);
});
