// The easter eggs stand on the friends' houses (decision 014): each on its waypoint's own spot, on
// the side of the road that spot is on. The waypoints are private, so where .cache/places.json
// isn't here only the eggs' kinds and sides are checked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import amigos from '../tracks/amigos.js';
import { CACHE } from '../tools/geo.mjs';

const PLACES = path.join(CACHE, 'places.json');
const KINDS = ['dog', 'dentist', 'supermarket', 'smoke', 'clock'];

// Which side of the Volta dos Amigos (x, z) is on, going round: 1 the right, -1 the left.
function sideOf(x, z) {
  const pts = amigos.points.map(({ p }) => p);
  let best = { d: Infinity, side: 0 };
  pts.forEach(([ax, , az], i) => {
    const [bx, , bz] = pts[(i + 1) % pts.length], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    const d = Math.hypot(x - ax - f * dx, z - az - f * dz);
    if (d < best.d) best = { d, side: dx * (z - az) - dz * (x - ax) >= 0 ? 1 : -1 };
  });
  return best.side;
}

test('each easter egg stands on its house, on the side of the road the house is on', (t) => {
  for (const e of amigos.eggs) {
    assert.ok(KINDS.includes(e.kind), `an egg of kind ${e.kind}`);
    assert.equal(e.side, sideOf(e.x, e.z), `the ${e.kind} egg's side`);
  }
  if (!fs.existsSync(PLACES)) return t.skip('.cache/places.json isn\'t here');
  const places = JSON.parse(fs.readFileSync(PLACES, 'utf8')).places.filter((p) => p.egg);
  assert.equal(amigos.eggs.length, places.length, 'an egg for each house that has one');
  for (const p of places) {
    const e = amigos.eggs.find((q) => q.kind === p.egg);
    assert.ok(e, `the ${p.egg} egg`);
    assert.ok(Math.hypot(e.x - p.x, e.z - p.z) <= 1, `the ${p.egg} egg is on its house`);
  }
});
