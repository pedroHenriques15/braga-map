// The photo textures (task 007, decision 030): every one refs/textures.json asks for is made at every
// graphics level, as KTX2, listed in its tile's index with its credit, and handed to a game with the
// tile; each facade faces the camera its photo was taken from.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { P } from '../tools/geo.mjs';
import { loadWorld, map } from '../index.js';
import { CREDITS, TEXTURES } from '../world/textures.js';

const { textures } = JSON.parse(fs.readFileSync(new URL('../refs/textures.json', import.meta.url), 'utf8'));
const photos = JSON.parse(fs.readFileSync(new URL('../refs/photos.json', import.meta.url), 'utf8')).photos;
const index = (await Promise.all(Object.values(TEXTURES).map((f) => f()))).flatMap((m) => m.default);
const LEVELS = ['high', 'medium', 'low'];
const KTX2 = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);

test('every texture asked for is made at every level, and its index says what its files are', () => {
  assert.deepEqual(index.map((t) => t.id).sort(), textures.map((t) => t.id).sort());
  for (const t of index) {
    let last = Infinity;
    for (const l of LEVELS) {
      const f = t.files[l], b = fs.readFileSync(new URL(f.url));
      assert.ok(b.subarray(0, 12).equals(KTX2), `${t.id} ${l}: a KTX2 file`);
      assert.deepEqual([b.readUInt32LE(20), b.readUInt32LE(24), b.length], [f.w, f.h, f.bytes], `${t.id} ${l}`);
      // Basis's blocks are 4 × 4; each level smaller than the one above.
      assert.ok(f.w % 4 === 0 && f.h % 4 === 0, `${t.id} ${l}: ${f.w} × ${f.h}`);
      assert.ok(f.w * f.h < last, `${t.id} ${l}`);
      last = f.w * f.h;
    }
    assert.ok(t.files.high.w <= 2048 && t.files.high.h <= 2048, t.id);
  }
});

test("each texture's credit is its photo's, and the map's credits name every author", () => {
  for (const t of index) {
    const r = textures.find((q) => q.id === t.id);
    if (t.kind === 'ground') {
      assert.equal(t.credit.source, 'DGT');
      assert.equal(t.credit.licence, 'CC BY 4.0');
      continue;
    }
    const p = photos.find((q) => q.id === r.photo);
    // Only a photo task 008 found good enough for a texture, and so one its tests keep clear of the
    // friends' houses.
    assert.equal(p?.use, 'texture', t.id);
    assert.equal(t.credit.author, p.photo.author, t.id);
    assert.equal(t.credit.licence, p.photo.licence, t.id);
    assert.equal(t.credit.url, p.photo.url, t.id);
  }
  assert.deepEqual(map().photoCredits, CREDITS);
  for (const t of index) assert.ok(CREDITS.some((c) => c.source === t.credit.source && c.licence === t.credit.licence && c.authors.includes(t.credit.author)), t.id);
});

test('a ground texture covers its tile, and a facade faces the camera its photo was taken from', () => {
  const m = map();
  for (const t of index) {
    if (t.kind === 'ground') {
      const [i, j] = textures.find((q) => q.id === t.id).tile.match(/-?\d+/g).map(Number);
      assert.deepEqual(t.box, { x0: i * m.tile, z0: j * m.tile, x1: (i + 1) * m.tile, z1: (j + 1) * m.tile });
      continue;
    }
    const a = t.wall[0], b = t.wall.at(-1), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
    const [cx, cz] = P(photos.find((q) => q.id === textures.find((q) => q.id === t.id).photo).photo);
    assert.ok(-dz * (cx - (a[0] + b[0]) / 2) + dx * (cz - (a[1] + b[1]) / 2) > 2, `${t.id}: its front faces away from the camera`);
    assert.ok(t.s[0] >= 0 && t.s[1] <= L + 0.01 && t.s[0] < t.s[1], t.id);
    assert.ok(t.y[0] < t.y[1], t.id);
  }
});

test("each facade's wall is still along a building's footprint in the world, and the texture on it", async () => {
  // A world made again (world.mjs) may move a building: then the recipe's wall is read again off it.
  const walls = index.filter((t) => t.kind === 'facade');
  const xs = walls.flatMap((t) => t.wall.map((p) => p[0])), zs = walls.flatMap((t) => t.wall.map((p) => p[1]));
  const w = await loadWorld({ x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, z0: Math.min(...zs) - 1, z1: Math.max(...zs) + 1 });
  for (const t of walls) {
    const b = w.buildings.find((b) => t.wall.every((p) => b.pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.75)));
    assert.ok(b, `${t.id}: no building in the world has its wall`);
    // From the building's ground up, and no more than a metre over its eaves.
    assert.ok(t.y[0] >= b.y - 0.01 && t.y[1] <= b.y + b.h + 1, `${t.id}: ${t.y} on a building from ${b.y} to ${b.y + b.h}`);
  }
});

test('a tile loaded brings its photo textures, and one without brings none', async () => {
  const w = await loadWorld({ x0: -400, x1: -100, z0: 600, z1: 900 });
  assert.deepEqual(w.tiles, ['x-1z1']);
  assert.ok(w.photos.some((t) => t.kind === 'ground' && t.id === 'ground-x-1z1'));
  assert.ok(w.photos.every((t) => index.some((q) => q.id === t.id)));
  const bare = await loadWorld({ x0: -2000, x1: -1600, z0: -2000, z1: -1600 });
  assert.equal(bare.photos.length, 0);
});
