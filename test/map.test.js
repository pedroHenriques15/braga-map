// The map as the games read it: the sections, the tiles, and the tracks on them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { heightOn, loadWorld, map, tilesFor } from '../index.js';

const tracks = await Promise.all(fs.readdirSync(new URL('../tracks/', import.meta.url)).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));

test('every tile is in exactly one section', () => {
  const m = map();
  const seen = m.sections.flatMap((s) => s.tiles);
  assert.equal(seen.length, m.tiles.length);
  assert.deepEqual([...seen].sort(), [...m.tiles].sort());
  assert.equal(m.sectionAt(0, 0), 'centro');
});

test('a box loads the tiles under it, and a section its own', async () => {
  const w = await loadWorld({ x0: -200, x1: 300, z0: -100, z1: 400 });
  assert.deepEqual(w.tiles, ['x-1z-1', 'x0z-1', 'x-1z0', 'x0z0']);
  assert.deepEqual(w.box, { x0: -500, x1: 500, z0: -500, z1: 500 });
  assert.ok(w.buildings.length > 100 && w.areas.length > 10 && w.lines.length > 100);
  const s = map().sections.find((q) => q.id === 'picoto');
  assert.deepEqual(tilesFor({ sections: ['picoto'] }), s.tiles);
});

test('the near relief and the far one agree', async () => {
  const w = await loadWorld({ x0: 0, x1: 1000, z0: 0, z1: 1000 });
  for (let x = 25; x < 1000; x += 100) for (let z = 25; z < 1000; z += 100) assert.ok(Math.abs(w.height(x, z) - heightOn(w.far, x, z)) < 12, `at ${x}, ${z}`);
  // The praça is about 190 m above the sea.
  assert.ok(Math.abs(w.height(0, 0) + w.elev0 - 190) < 15);
});

test('each track is a loop with one start, inside the map, on the sections it says', () => {
  assert.ok(tracks.length > 0);
  const m = map();
  for (const t of tracks) {
    assert.equal(t.points.filter((p) => p.tag === 'start').length, 1, t.id);
    assert.equal(t.points[0].tag, 'start', t.id);
    assert.equal(t.elev0, m.elev0, t.id);
    for (const { p } of t.points) {
      assert.ok(p[0] > t.box.x0 && p[0] < t.box.x1 && p[2] > t.box.z0 && p[2] < t.box.z1, `${t.id} at ${p}`);
      assert.ok(t.sections.includes(m.sectionAt(p[0], p[2])), `${t.id} at ${p}`);
    }
    for (const s of t.sections) assert.ok(m.sections.some((q) => q.id === s), `${t.id}: ${s}`);
  }
});
