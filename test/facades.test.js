// The facades (task 017): what each building looked at in its photos is (refs/buildings.json), in the
// words tools/facades.mjs lists; every building in the shooter's area and in view of a viewpoint has an
// entry; the tiles carry each building's facade and the shops' signs, each sign on its building's wall
// and facing out of it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';
import { BALCONIES, COLOUR, floorsOf, GROUND, guesser, MATERIAL, TYPE, TYPES } from '../tools/facades.mjs';
import { CACHE } from '../tools/geo.mjs';

const { buildings } = JSON.parse(fs.readFileSync(new URL('../refs/buildings.json', import.meta.url), 'utf8'));
const photos = new Set(JSON.parse(fs.readFileSync(new URL('../refs/photos.json', import.meta.url), 'utf8')).photos.map((p) => p.id));
// A building may have been seen in a viewpoint's photo since dropped (task 052).
const { viewpoints, dropped = [] } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
const views = new Set([...viewpoints, ...dropped].map((v) => v.id));

test('each building seen is said in the facades\' words, with the photo it was seen in', () => {
  for (const [name, e] of Object.entries(buildings)) {
    assert.match(name, /^((way|relation)\/\d+|lidar\/x-?\d+z-?\d+)$/, name);
    assert.equal(typeof e.notes, 'string', name);
    if (!e.seen) {
      // Looked for, and not seen: why is in its notes.
      assert.equal(e.type ?? null, null, name);
      assert.ok(e.notes.length > 10, name);
      continue;
    }
    // Seen, its kind too where it could be told.
    assert.ok(e.type === null || e.type in TYPE, `${name}: ${e.type}`);
    for (const [k, ok] of [['colour', (v) => v in COLOUR], ['material', (v) => v in MATERIAL], ['ground', (v) => GROUND.includes(v)], ['balconies', (v) => BALCONIES.includes(v)], ['shutters', (v) => v === 'none' || v in COLOUR], ['floors', (v) => Number.isInteger(v) && v >= 1 && v <= 30]]) {
      if (e[k] != null) assert.ok(ok(e[k]), `${name}: ${k} ${e[k]}`);
    }
    if (e.base) assert.ok(e.base.colour in COLOUR && e.base.material in MATERIAL, `${name}: base`);
    assert.ok(e.seen.startsWith('viewpoint:') ? views.has(e.seen.slice(10)) : photos.has(e.seen), `${name}: seen in ${e.seen}`);
    if (e.patch) assert.ok(e.patch.length === 4 && e.patch.every(Number.isInteger) && e.patch[2] > e.patch[0] && e.patch[3] > e.patch[1], `${name}: patch`);
    for (const s of e.signs ?? []) assert.ok(s.text.trim() && s.colour in COLOUR, `${name}: sign ${JSON.stringify(s)}`);
  }
});

test('every building in the shooter\'s area and in view of a viewpoint has an entry', (t) => {
  // tools/buildings.mjs's list, which needs the map's sources in .cache/.
  const file = path.join(CACHE, 'buildings', 'todo.json');
  if (!fs.existsSync(file)) return t.skip('no .cache/buildings/todo.json: node tools/buildings.mjs');
  const todo = JSON.parse(fs.readFileSync(file, 'utf8'));
  const missing = todo.filter((b) => !(b.id in buildings)).map((b) => b.id);
  assert.deepEqual(missing, []);
  const seen = todo.filter((b) => buildings[b.id]?.seen).length;
  assert.ok(seen / todo.length > 0.5, `only ${seen} of ${todo.length} seen`);
});

test('a building nobody looked at is guessed the same every time, as often as those looked at are', () => {
  const guess = guesser(buildings);
  const facts = { kind: 1, tags: { building: 'apartments' }, area: 400, eaves: 18 };
  assert.deepEqual(guess('way/1', facts), guess('way/1', facts));
  const flats = Array.from({ length: 400 }, (_, k) => guess(`way/${k}`, facts));
  for (const f of flats) assert.ok(f.type.startsWith('block'), f.type);
  // Its kind's colours, not one colour for all.
  assert.ok(new Set(flats.map((f) => f.colour)).size >= 3);
  assert.equal(guess('way/2', { kind: 3, tags: { building: 'church' }, area: 300, eaves: 10 }).type, 'church');
  assert.equal(guess('way/3', { kind: 0, tags: { building: 'garage' }, area: 20, eaves: 2.5 }).type, 'annex');
  assert.equal(guess('way/4', { kind: 1, tags: { building: 'apartments', 'building:colour': '#FFFFFF' }, area: 400, eaves: 18 }).colour, 'white');
});

test('the tiles carry each building\'s facade, its storeys in its kind\'s proportions', async () => {
  const m = map();
  assert.deepEqual(Object.keys(m.facadeTypes), TYPES.map((t) => t.id));
  for (const [name, rgb] of Object.entries(m.facadeColours)) assert.ok(name in COLOUR && rgb.length === 3, name);
  const w = await loadWorld({ sections: ['fujacal'] });
  const inside = w.buildings.filter((b) => w.inShooter(b.pts[0][0], b.pts[0][1]));
  assert.ok(inside.length > 300);
  for (const b of w.buildings) {
    const f = b.facade;
    assert.ok(f.type in m.facadeTypes && f.colour in m.facadeColours && MATERIAL[f.material] !== undefined && GROUND.includes(f.ground) && BALCONIES.includes(f.balconies), JSON.stringify(f));
    assert.ok(f.shutters === null || f.shutters in m.facadeColours);
    assert.ok(Number.isInteger(b.floors) && b.floors >= 1, `${b.floors} floors`);
    // No more storeys than its height holds at 2.2 m each over its ground floor (its photo may count
    // one the LiDAR's eaves leave out, under a pitched roof).
    const p = m.facadeTypes[f.type];
    if (!f.seen) assert.equal(b.floors, floorsOf(f.type, b.h), JSON.stringify(b.pts[0]));
    else assert.ok(Math.min(p.ground, b.h) + (b.floors - 2) * 2.2 <= b.h + 3, `${b.floors} floors in ${b.h} m (${JSON.stringify(b.pts[0])})`);
  }
  // Those the session saw are in it as seen.
  const seen = Object.values(buildings).filter((e) => e.seen).length;
  assert.ok(inside.filter((b) => b.facade.seen).length > 0.3 * inside.length, `${inside.filter((b) => b.facade.seen).length} of ${inside.length} seen in the shooter's area (${seen} described)`);
});

test('each sign is on its building\'s wall, facing out of it, with its name', async () => {
  const w = await loadWorld({ open: true });
  assert.ok(w.signs.length > 100);
  const onWall = (x, z) => w.buildings.some((b) => b.pts.some((p, i) => {
    const q = b.pts[(i + 1) % b.pts.length], dx = q[0] - p[0], dz = q[1] - p[1], l2 = dx * dx + dz * dz;
    const t = l2 ? Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / l2)) : 0;
    return Math.hypot(p[0] + dx * t - x, p[1] + dz * t - z) < 0.8;
  }));
  const inAny = (x, z) => w.buildings.some((b) => {
    let c = false;
    for (let i = 0, j = b.pts.length - 1; i < b.pts.length; j = i++) {
      const [xi, zi] = b.pts[i], [xj, zj] = b.pts[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    }
    return c;
  });
  let off = 0, inward = 0;
  for (const s of w.signs) {
    assert.ok(s.text.trim().length > 0 && s.colour in w.facadeColours && s.h > 0);
    const [x0, z0] = s.from, [x1, z1] = s.to, L = Math.hypot(x1 - x0, z1 - z0);
    assert.ok(L >= 1 && L <= 9, `${s.text}: ${L} m`);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    if (!onWall(mx, mz)) off++;
    // 1 m in front of it isn't in a building, 1 m behind it is.
    const nx = (z1 - z0) / L, nz = -(x1 - x0) / L;
    if (inAny(mx + nx, mz + nz) || !inAny(mx - nx, mz - nz)) inward++;
  }
  // A building cut at the kerb by a game, or a sign on a wall of a part, can be off by a little.
  assert.ok(off / w.signs.length < 0.02, `${off} of ${w.signs.length} signs off their walls`);
  assert.ok(inward / w.signs.length < 0.05, `${inward} of ${w.signs.length} signs face into a building`);
});
