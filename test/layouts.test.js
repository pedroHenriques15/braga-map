// Each facade's doors and windows where its photo has them (task 086): every layout read fits its wall,
// on its building's outline, in the facades' words; a layout comes onto each side of a ring that runs
// along its wall, whichever way the ring runs; and the tiles carry them to a game.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import { named } from '../tools/buildings.mjs';
import { layoutOnRing, OPENINGS } from '../tools/facades.mjs';
import { badLayout, wallsOf } from '../tools/layouts.mjs';
import { SHOOTER_BOX } from '../tools/sections.mjs';

const { buildings } = JSON.parse(fs.readFileSync(new URL('../refs/buildings.json', import.meta.url), 'utf8'));
const photos = new Set(JSON.parse(fs.readFileSync(new URL('../refs/photos.json', import.meta.url), 'utf8')).photos.map((p) => p.id));
const views = new Set(JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8')).viewpoints.map((v) => 'viewpoint:' + v.id));
const laid = Object.entries(buildings).filter(([, e]) => e.layout), looked = Object.entries(buildings).filter(([, e]) => e.layout || e.unread);

test('every layout read fits its wall: a wall of its building, its openings on it, none over the next', () => {
  const outlines = new Map(named().map((b) => [b.id, b.pts]));
  let walls = 0;
  for (const [id, e] of looked) {
    assert.ok(e.seen, `${id}: a layout, but not seen`);
    const sides = wallsOf(outlines.get(id) ?? []);
    for (const w of [...(e.layout ?? []), ...(e.unread ?? [])]) {
      // Its ends are a wall's of the building's outline, left to right from outside.
      const s = sides.find((q) => Math.hypot(q.from[0] - w.from[0], q.from[1] - w.from[1]) < 0.2 && Math.hypot(q.to[0] - w.to[0], q.to[1] - w.to[1]) < 0.2);
      assert.ok(s, `${id}: no wall of its outline from ${w.from} to ${w.to}`);
      if (!w.storeys) {
        assert.ok(typeof w.why === 'string' && w.why.length > 5, `${id}: a wall left says why`);
        continue;
      }
      assert.ok(photos.has(w.photo) || views.has(w.photo), `${id}: ${w.photo}`);
      assert.equal(badLayout(w.storeys, s.L), null, `${id} ${w.from}: ${badLayout(w.storeys, s.L)}`);
      // No more storeys than the photo counted (and a storey read at least).
      if (e.floors) assert.ok(w.storeys.length <= e.floors, `${id}: ${w.storeys.length} storeys, ${e.floors} counted`);
      assert.ok(w.storeys.some(Boolean), `${id}: no storey read`);
      walls++;
    }
  }
  // The 16 the photos showed clearly enough of the 136 given to be read (task 086's Notes).
  assert.ok(walls >= 16, `${walls} walls read`);
});

test('a layout comes onto the sides of a ring that run along its wall, whichever way round', () => {
  // A wall 10 m long along z = 0, its left end at x = 0 seen from the south (z > 0 is out); a window
  // 2–3.5 m along it and a door 6–7 m.
  const layout = [{ from: [0, 0], to: [10, 0], storeys: [[['door', 6, 1]], [['window', 2, 1.5]]] }];
  // A ring that runs the wall's way along it, cut into two sides at x = 5.
  const a = layoutOnRing(layout, [[0, 0], [5, 0], [10, 0], [10, -8], [0, -8]]);
  assert.deepEqual(a[0], [[], [['window', 2, 1.5]]]);
  assert.deepEqual(a[1], [[['door', 1, 1]], []]);
  assert.equal(a[2], null);
  // The other way round: each opening's near edge from the side's start.
  const b = layoutOnRing(layout, [[0, -8], [10, -8], [10, 0], [0, 0]]);
  assert.deepEqual(b[2], [[['door', 3, 1]], [['window', 6.5, 1.5]]]);
  // A shop window 4–6.5 m along runs round the cut at x = 5: each side has its part.
  const c = layoutOnRing([{ ...layout[0], storeys: [[['shop', 4, 2.5]]] }], [[0, 0], [5, 0], [10, 0], [10, -8], [0, -8]]);
  assert.deepEqual([c[0], c[1]], [[[['shop', 4, 1]]], [[['shop', 0, 1.5]]]]);
  // A side running on 3 m past the wall's end: none on it, as no photo read what is past the end.
  assert.equal(layoutOnRing(layout, [[8, 0], [13, 0], [13, -8], [8, -8]]), null);
  // Nowhere near it: none.
  assert.equal(layoutOnRing(layout, [[0, 5], [10, 5], [10, 9], [0, 9]]), null);
  assert.deepEqual(OPENINGS, ['window', 'door', 'garage', 'shop', 'balcony']);
});

test('the tiles carry each layout to a game, on its building\'s sides', async () => {
  const B = SHOOTER_BOX, world = await loadWorld(B);
  const withLayout = world.buildings.filter((b) => b.facade.layout);
  // At least one drawn part a building read, each layout on a side of its outline, its openings on it.
  assert.ok(withLayout.length >= laid.length * 0.8, `${withLayout.length} buildings with a layout in the tiles, ${laid.length} read`);
  for (const b of withLayout) {
    assert.equal(b.facade.layout.length, b.pts.length);
    b.facade.layout.forEach((st, k) => {
      if (!st) return;
      const p = b.pts[k], q = b.pts[(k + 1) % b.pts.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      for (const o of st.flat().filter(Boolean)) {
        assert.ok(OPENINGS.includes(o.kind), o.kind);
        assert.ok(o.at >= 0 && o.at + o.w <= L + 0.31, `${o.kind} at ${o.at}, ${o.w} wide, on a side ${L.toFixed(1)} m long`);
      }
    });
  }
});
