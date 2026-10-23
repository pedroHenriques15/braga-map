// The street furniture (task 100): in the open world's tiles as the games read them, every lamp,
// bench, bin, ecoponto, bollard and pole OpenStreetMap has in the area; the lamps, signs, traffic lights
// and bus shelters the LiDAR finds; and the sample of 50 checked against the photos
// (refs/furniture.json), as many of it right as was recorded.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import { CACHE, P, readCache } from '../tools/geo.mjs';
import { OPEN_BOX } from '../tools/sections.mjs';
import { FACES, KINDS } from '../tools/furniture.mjs';

const fetched = fs.existsSync(path.join(CACHE, 'osm', 'furniture.json'));
const skip = !fetched && "the map's furniture isn't fetched (node tools/fetch.mjs furniture)";
const w = await loadWorld(OPEN_BOX);
const seen = JSON.parse(fs.readFileSync(new URL('../refs/furniture.json', import.meta.url), 'utf8'));
const inBox = (x, z) => x >= OPEN_BOX.x0 && x <= OPEN_BOX.x1 && z >= OPEN_BOX.z0 && z <= OPEN_BOX.z1;

test('each piece is of a kind, stands in the box, and says where it comes from', () => {
  assert.ok(w.furniture.length > 1000, `${w.furniture.length} pieces`);
  for (const f of w.furniture) {
    assert.ok(KINDS.includes(f.kind), f.kind);
    assert.ok(inBox(f.x, f.z), `${f.kind} at ${f.x}, ${f.z}`);
    assert.ok(f.h > 0 && f.h <= 16, `${f.kind} at ${f.x}, ${f.z}: ${f.h} m`);
    assert.ok(Number.isFinite(f.angle));
    assert.ok(f.source === 'osm' || f.source === 'lidar');
    if (f.kind === 'sign') assert.ok(f.face === null || FACES.includes(f.face), f.face);
  }
});

test('the LiDAR gives only what it can tell: lamps, signs, traffic lights and shelters', () => {
  const lidar = new Set(w.furniture.filter((f) => f.source === 'lidar').map((f) => f.kind));
  assert.deepEqual([...lidar].sort(), ['lamp', 'shelter', 'sign', 'traffic_light']);
});

test("every lamp, bench, bin, ecoponto and bollard the map has in the box is in the tiles", { skip }, () => {
  const want = { street_lamp: 'lamp', bench: 'bench', waste_disposal: 'bin', waste_basket: 'basket', recycling: 'ecoponto', bollard: 'bollard' };
  const osm = w.furniture.filter((f) => f.source === 'osm');
  let n = 0;
  for (const e of readCache('osm/furniture.json').elements) {
    const t = e.tags ?? {}, kind = want[t.highway] ?? want[t.amenity] ?? want[t.barrier];
    if (!kind || (kind === 'ecoponto' && t.recycling_type === 'centre')) continue;
    const [x, z] = P(e);
    if (!inBox(x, z)) continue;
    n++;
    assert.ok(osm.some((f) => f.kind === kind && Math.hypot(f.x - x, f.z - z) < 0.1), `${kind} ${e.id} at ${x.toFixed(1)}, ${z.toFixed(1)}`);
  }
  assert.ok(n > 500, `${n} of the map's`);
});

test('the sample of 50 checked against the photos: as many right as refs/furniture.json records', () => {
  const lidar = w.furniture.filter((f) => f.source === 'lidar');
  const sample = seen.checks.filter((c) => lidar.some((f) => f.kind === c.kind && Math.hypot(f.x - c.at[0], f.z - c.at[1]) <= 0.15));
  assert.equal(sample.length, 50, 'the tiles still have each piece of the sample: else draw it again (node tools/furniture.mjs mark) and look');
  const count = (k) => sample.filter((c) => c.seen === k).length;
  assert.deepEqual({ n: sample.length, right: count('right'), other: count('other'), wrong: count('wrong'), unsure: count('unsure') }, seen.sample);
  for (const c of seen.checks) assert.ok(['right', 'other', 'wrong', 'unsure'].includes(c.seen) && c.what && c.photo, JSON.stringify(c));
  // What the share right is: of those the photos show, more right than not furniture at all.
  assert.ok(seen.sample.right > seen.sample.wrong);
});
