// What the ground is (task 016, tools/cover.mjs): every tile under the Volta dos Amigos' box has its
// classes and each kind's colour at every graphics level, the cells' bytes a kind and a crown; each kind
// but water and a roof has its texture, made (task 082); the parked cars are where they can be; a car park is an
// area of its own; and an area's holes are inside it (a multipolygon's inner rings).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import sharp from 'sharp';
import { loadWorld, map } from '../index.js';
import { COVER, KINDS } from '../world/cover.js';
import { SURFACES } from '../world/textures.js';
import amigos from '../tracks/amigos.js';

const LEVELS = { high: 1000, medium: 500, low: 250 };
const SQUARES = { high: 125, medium: 100, low: 50 };
const m = map();
const B = amigos.box;
const under = m.tiles.filter((id) => {
  const [i, j] = id.match(/-?\d+/g).map(Number);
  return (i + 1) * m.tile > B.x0 && i * m.tile < B.x1 && (j + 1) * m.tile > B.z0 && j * m.tile < B.z1;
});
const covers = await Promise.all(Object.values(COVER).map((f) => f().then((x) => x.default)));
// A PNG of one channel's bytes.
const bytes = async (buf) => (await sharp(buf).extractChannel(0).raw().toBuffer());
const inRing = (r, x, z) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > z !== r[j][1] > z && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
};

test('every tile under the box is classed, at every level, and its index says what its files are', async () => {
  assert.deepEqual(covers.map((c) => c.tile).sort(), [...under].sort());
  assert.deepEqual(KINDS, ['asphalt', 'paving', 'setts', 'grass', 'soil', 'gravel', 'water', 'roof']);
  for (const c of covers) {
    const [i, j] = c.tile.match(/-?\d+/g).map(Number);
    assert.deepEqual(c.box, { x0: i * m.tile, z0: j * m.tile, x1: (i + 1) * m.tile, z1: (j + 1) * m.tile });
    assert.equal(c.credit.source, 'DGT');
    for (const [l, n] of Object.entries(LEVELS)) {
      const f = c.classes[l], file = new URL(f.url), buf = fs.readFileSync(file), meta = await sharp(buf).metadata();
      assert.deepEqual([meta.width, meta.height, meta.format, buf.length], [n, n, 'webp', f.bytes], `${c.tile} ${l}`);
      const data = await bytes(buf);
      // A kind (0 to 7), and 8 where a crown is over it: nothing else.
      assert.ok(data.every((v) => v < 16), `${c.tile} ${l}: a byte over 15`);
      const k = c.colour[l], cf = new URL(k.url), cm = await sharp(fs.readFileSync(cf)).metadata();
      assert.equal(k.squares, SQUARES[l], `${c.tile} ${l}`);
      assert.deepEqual([cm.width, cm.height, cm.format, fs.statSync(cf).size], [k.w, k.h, 'webp', k.bytes], `${c.tile} ${l}`);
      // Each kind's grid, and the crowns' last.
      assert.ok(k.w % 16 === 0 && k.w >= k.squares && k.h === k.w * (KINDS.length + 1), `${c.tile} ${l}: ${k.w} × ${k.h}`);
    }
  }
});

test("the shooter's area and the open world's ground is mostly what it should be", async () => {
  // Fujacal's tile: its buildings are roofs, and the rest the ground's kinds in shares a town has.
  const c = covers.find((x) => x.tile === 'x-1z1');
  const data = await bytes(fs.readFileSync(new URL(c.classes.high.url)));
  const share = new Array(8).fill(0);
  for (const v of data) share[v & 7]++;
  const pc = share.map((s) => (100 * s) / data.length);
  assert.ok(pc[7] > 20 && pc[7] < 45, `roofs ${pc[7]}%`);
  for (const k of [0, 1, 3]) assert.ok(pc[k] > 8, `${KINDS[k]} ${pc[k]}%`);
  // Where the world draws a carriageway on the ground, the classes are its surface: at points 2 m apart
  // inside each.
  const w = await loadWorld({ x0: -400, x1: -100, z0: 600, z1: 900 });
  const at = (x, z) => data[Math.floor((z - c.box.z0) * 2) * 1000 + Math.floor((x - c.box.x0) * 2)] & 7;
  let n = 0, same = 0;
  for (const p of w.streets.carriageways.filter((p) => p.level === 'ground')) {
    for (let x = Math.ceil(c.box.x0) + 1; x < c.box.x1; x += 2) for (let z = Math.ceil(c.box.z0) + 1; z < c.box.z1; z += 2) {
      if (!inRing(p.rings[0], x, z) || p.rings.slice(1).some((h) => inRing(h, x, z))) continue;
      n++;
      if (at(x, z) === KINDS.indexOf(p.surface === 'dirt' ? 'soil' : p.surface)) same++;
    }
  }
  assert.ok(n > 1000 && same / n > 0.95, `${same} of ${n} points on carriageways are their surface`);
});

test('each kind of ground but water and a roof has its texture, at every level, made, and the map hands them out', () => {
  for (const k of KINDS.slice(0, 6)) {
    const s = SURFACES[k];
    assert.ok(s, k);
    assert.ok(s.metres >= 1 && s.metres <= 5, `${k}: ${s.metres} m`);
    assert.equal(s.mean.length, 3);
    for (const l of Object.keys(LEVELS)) assert.equal(fs.statSync(new URL(s.files[l].url)).size, s.files[l].bytes, `${k} ${l}`);
    // Made, not photographed (task 082; test/textures.test.js has how).
    assert.ok(s.made.generator && !('credit' in s), k);
  }
  assert.deepEqual(m.groundKinds.map((g) => g.kind), KINDS);
  assert.deepEqual(m.groundKinds.map((g) => g.texture?.id ?? null), KINDS.map((k) => SURFACES[k]?.id ?? null));
  assert.equal(m.groundKinds.find((g) => g.kind === 'water').texture, null);
});

test('the cars parked are on their tile, car-sized, and mostly along the kerbs or in car parks', async () => {
  let all = 0, placed = 0;
  for (const c of covers) {
    const file = new URL(c.cars.url), cars = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual([cars.length, fs.statSync(file).size], [c.cars.n * 6, c.cars.bytes], c.tile);
    for (let i = 0; i < cars.length; i += 6) {
      const [x, z, angle, l, w, where] = cars.slice(i, i + 6);
      assert.ok(x >= c.box.x0 - 3 && x <= c.box.x1 + 3 && z >= c.box.z0 - 3 && z <= c.box.z1 + 3, `${c.tile}: a car at ${x}, ${z}`);
      assert.ok(angle >= 0 && angle <= Math.PI, `${c.tile}: ${angle}`);
      assert.ok(l >= 2.5 && l <= 5.8 && w >= 1.2 && w <= 2.6 && l >= w - 0.5, `${c.tile}: ${l} × ${w}`);
      assert.ok([0, 1, 2].includes(where));
      all++;
      if (where) placed++;
    }
  }
  assert.ok(all > 10000, `${all} cars`);
  assert.ok(placed / all > 0.6, `${placed} of ${all} along a kerb or in a car park`);
  // And the world's car parks, from the map, are areas of their own.
  const w = await loadWorld({ x0: -400, x1: -100, z0: 600, z1: 900 });
  assert.ok(w.areas.filter((a) => a.kind === 'parking').length > 10);
});

test("an area's holes are inside it, and a multipolygon's inner rings are holes", async () => {
  const w = await loadWorld({ open: true });
  const holed = w.areas.filter((a) => a.holes.length);
  assert.ok(holed.length >= 5, `${holed.length} areas with holes`);
  for (const a of holed) {
    for (const h of a.holes) {
      assert.ok(h.length >= 3);
      // Cut to the same tile, so its middle is in its outline.
      const [x, z] = h.reduce((s, p) => [s[0] + p[0] / h.length, s[1] + p[1] / h.length], [0, 0]);
      assert.ok(inRing(a.pts, x, z), `a hole of a ${a.kind} at ${x.toFixed(0)}, ${z.toFixed(0)} isn't in it`);
    }
  }
});
