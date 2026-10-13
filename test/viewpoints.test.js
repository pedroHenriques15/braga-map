// The viewpoints (refs/viewpoints.json, task 001): where the game is set against a real photo of
// the same place. Each one stands where its photo was taken, at eye level, along the route, in the
// shooter's area or looking at the skyline, and keeps away from the friends' houses: 150 m from
// every egg, and from every waypoint where .cache/places.json is there to check against.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import { CACHE, P } from '../tools/geo.mjs';
import { SHOOTER } from '../tools/sections.mjs';

const { credit, viewpoints: views } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
const tracks = await Promise.all(fs.readdirSync(new URL('../tracks/', import.meta.url)).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
const PLACES = path.join(CACHE, 'places.json');
const NEAR = 150;

const heading = (v) => ((Math.atan2(v.tx - v.x, -(v.tz - v.z)) * 180) / Math.PI + 360) % 360;
const turn = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
// The nearest point of any track: how far, and which way the race goes there.
function onRoute(x, z) {
  let best = { d: Infinity };
  for (const t of tracks) {
    const pts = t.points.map(({ p }) => p);
    pts.forEach(([ax, , az], i) => {
      const [bx, , bz] = pts[(i + 1) % pts.length], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
      const d = Math.hypot(x - ax - f * dx, z - az - f * dz);
      if (d < best.d) best = { d, race: ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360 };
    });
  }
  return best;
}
const inShooter = (v) => v.x >= SHOOTER.x0 && v.x <= SHOOTER.x1 && v.z >= SHOOTER.z0 && v.z <= SHOOTER.z1;

test('each viewpoint says where it looks from, and whose photo it is set against', () => {
  assert.match(credit, /Mapillary/);
  assert.equal(new Set(views.map((v) => v.id)).size, views.length);
  for (const v of views) {
    assert.match(v.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, v.id);
    assert.ok(['kart', 'foot', 'skyline'].includes(v.kind), v.id);
    for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz', 'fov']) assert.ok(Number.isFinite(v[k]), `${v.id}: ${k}`);
    assert.ok(v.fov >= 20 && v.fov <= 100, v.id);
    const p = v.photo;
    for (const k of ['source', 'id', 'url', 'author', 'licence', 'date']) assert.ok(p[k], `${v.id}: photo.${k}`);
    assert.ok(['mapillary', 'commons', 'owner'].includes(p.source), v.id);
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, v.id);
    // The camera stands where the photo was taken.
    const [x, z] = P({ lat: p.lat, lon: p.lon });
    assert.ok(Math.hypot(x - v.x, z - v.z) < 5, `${v.id} is ${Math.hypot(x - v.x, z - v.z).toFixed(1)} m from its photo`);
  }
});

test('there are 20 along the route, 6 on foot in the shooter\'s area and 2 of the skyline', () => {
  assert.ok(views.filter((v) => onRoute(v.x, v.z).d < 30).length >= 20);
  assert.ok(views.filter((v) => v.kind === 'foot' && inShooter(v)).length >= 6);
  assert.ok(views.filter((v) => v.kind === 'skyline').length >= 2);
});

test('a kart\'s viewpoint is on the route, looking the way the race goes', () => {
  for (const v of views.filter((q) => q.kind === 'kart')) {
    const r = onRoute(v.x, v.z);
    assert.ok(r.d < 12, `${v.id} is ${r.d.toFixed(0)} m from the route`);
    assert.ok(turn(heading(v), r.race) < 35, `${v.id} looks ${turn(heading(v), r.race).toFixed(0)}° off the race`);
  }
});

test('each viewpoint is at eye level above the ground', async () => {
  const w = await loadWorld({ x0: Math.min(...views.map((v) => v.x)), x1: Math.max(...views.map((v) => v.x)), z0: Math.min(...views.map((v) => v.z)), z1: Math.max(...views.map((v) => v.z)) });
  for (const v of views) {
    const up = v.y - w.height(v.x, v.z);
    assert.ok(up > 0.5 && up < 3, `${v.id} is ${up.toFixed(1)} m above the ground`);
  }
});

test('no viewpoint is near a friend\'s house, or looks at one', (t) => {
  const away = tracks.flatMap((tr) => tr.eggs.map((e) => [e.x, e.z]));
  const hasPlaces = fs.existsSync(PLACES);
  if (hasPlaces) away.push(...JSON.parse(fs.readFileSync(PLACES, 'utf8')).places.map((p) => [p.x, p.z]));
  else t.diagnostic('.cache/places.json isn\'t here: checked against the eggs only');
  let nearest = { d: Infinity };
  for (const v of views) {
    for (const [x, z] of away) {
      const d = Math.hypot(x - v.x, z - v.z);
      if (d < nearest.d) nearest = { d, id: v.id };
      // Nor turned towards one within 300 m.
      const at = ((Math.atan2(x - v.x, -(z - v.z)) * 180) / Math.PI + 360) % 360;
      assert.ok(d > 300 || turn(at, heading(v)) > 18, `${v.id} looks towards a waypoint or an egg`);
    }
  }
  t.diagnostic(`the nearest waypoint or egg is ${nearest.d.toFixed(0)} m from a viewpoint (${nearest.id})`);
  assert.ok(nearest.d >= NEAR, `${nearest.id} is within ${NEAR} m of a waypoint or an egg`);
});
