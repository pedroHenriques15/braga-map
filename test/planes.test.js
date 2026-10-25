// Every roof as the point cloud has it (task 087, tools/planes.mjs): a roof's cells cut into the planes
// they lie on and built back as the highest of each group's lowest, what stands on it as boxes, the
// overhang as far as the points reach; today's shape where the planes fit no better; and the tiles
// carry them to a game.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import { planesOf, roofHeight, shapeHeight } from '../tools/planes.mjs';
import { SHOOTER_BOX } from '../tools/sections.mjs';

// An L of two gabled wings 6 m wide at 31° (0.6 a metre), eaves at 105 m above the sea, on ground at
// 100: one along x (z 0 to 6), one along z (x 6 to 12, z 0 to 14), overhanging its walls by 50 cm; a
// chimney 1 m square 1.5 m over the first wing's ridge.
const L = [[0, 0], [12, 0], [12, 14], [6, 14], [6, 6], [0, 6]];
const wingA = (x, z) => 105 + 0.6 * Math.min(z, 6 - z);
const wingB = (x, z) => 105 + 0.6 * Math.min(x - 6, 12 - x);
const roof = (x, z) => Math.max(x > -0.5 && x < 12.5 && z > -0.5 && z < 6.5 ? wingA(x, z) : -Infinity, x > 5.5 && x < 12.5 && z > -0.5 && z < 14.5 ? wingB(x, z) : -Infinity);
const chimney = (x, z) => x >= 2 && x < 3 && z >= 2.5 && z < 3.5;
const top = (x, z) => {
  if (chimney(x, z)) return wingA(x, 3) + 1.5;
  const h = roof(x, z);
  return h > -Infinity ? h : NaN;
};
// Today's shape for it: one gable along x over the L's rectangle, as roofs.mjs found it.
const shape = { pts: L, roof: 2, ends: 0, dir: 0, pitch: 31, h: 105, ridge: 106.8 };

test('an L: its four planes in two groups, the valleys where they meet, and the chimney on it', () => {
  const r = planesOf(L, top, 100, shape);
  assert.ok(r.planes, 'its own planes');
  assert.equal(r.planes.length, 4);
  assert.equal(r.groups.length, 2);
  for (const g of r.groups) assert.equal(g.length, 2);
  // Built back, it's the roof: its ridges, its eaves and a valley.
  const planes = r.planes.map(([c, gx, gz]) => ({ c, ga: gx, gb: gz }));
  const at = (x, z) => roofHeight(planes, r.groups, x, z);
  for (const [x, z] of [[3, 3], [9, 10], [0.5, 0.5], [8, 2], [10, 1], [9, 5]]) assert.ok(Math.abs(at(x, z) - roof(x, z)) < 0.12, `${at(x, z)} at ${x}, ${z}, not ${roof(x, z)}`);
  assert.ok(r.res < 0.1 && r.res < r.res0 / 3, `misfit ${r.res}, the shape's ${r.res0}`);
  // The chimney, a box about its size, its top where it is.
  assert.equal(r.blocks.length, 1);
  const [x, z, , , l, w, t] = r.blocks[0];
  assert.ok(Math.abs(x - 2.5) < 0.5 && Math.abs(z - 3) < 0.5 && l <= 0.8 && w <= 0.8 && Math.abs(t - 108.3) < 0.1, JSON.stringify(r.blocks[0]));
  // Its eaves overhang the walls, about as far as the points reach.
  assert.ok(r.over >= 0.3 && r.over <= 0.7, `overhang ${r.over}`);
});

test("a gable that is its shape keeps it, with what stands on it", () => {
  const box = [[0, 0], [12, 0], [12, 6], [0, 6]];
  const r = planesOf(box, (x, z) => (x >= 0 && x < 12 && z >= 0 && z < 6 ? (chimney(x, z) ? wingA(x, 3) + 1.5 : wingA(x, z)) : NaN), 100, { ...shape, pts: box });
  assert.equal(r.planes, null);
  assert.equal(r.blocks.length, 1);
  assert.ok(Math.abs(shapeHeight({ ...shape, pts: box })(6, 3) - 106.8) < 1e-9);
});

test('the tiles carry the roofs of their own planes to a game, each a roof over its building', async () => {
  const world = await loadWorld(SHOOTER_BOX);
  const own = world.buildings.filter((b) => b.planes);
  assert.ok(own.length >= 100, `${own.length} roofs of their own planes`);
  for (const b of own) {
    assert.ok(b.groups.length && b.groups.every((g) => g.length && g.every((i) => i >= 0 && i < b.planes.length)));
    // Over the building's middle, between its ground and its ridge as the shape has it, give or take.
    const x = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length, z = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
    const h = roofHeight(b.planes.map((p) => ({ c: p.c, ga: p.gx, gb: p.gz })), b.groups, x, z);
    assert.ok(h > 0 && h < b.ridge + 6, `a roof ${h.toFixed(1)} m up over a building ${b.ridge.toFixed(1)} m high`);
  }
  const blocks = world.buildings.flatMap((b) => b.blocks ?? []);
  assert.ok(blocks.length >= 100, `${blocks.length} blocks`);
  for (const q of blocks) assert.ok(q.l > 0 && q.w > 0 && q.l < 25 && Math.abs(Math.hypot(q.ux, q.uz) - 1) < 1e-6);
});
