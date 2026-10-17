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
import { inShooter } from '../tools/sections.mjs';

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
    // The camera stands where the photo was taken: within 5 m of where Mapillary puts it, a phone's
    // GPS; or, where that's off the surface the photo was taken from, moved the shortest way onto it
    // (task 058), up to 15 m, and its notes say so.
    const [x, z] = P({ lat: p.lat, lon: p.lon });
    const off = Math.hypot(x - v.x, z - v.z);
    assert.ok(off < 5 || (off < 15 && /\bMoved\b/.test(v.notes)), `${v.id} is ${off.toFixed(1)} m from its photo`);
  }
});

test('there are 20 along the route, 6 on foot in the shooter\'s area and 2 of the skyline', () => {
  assert.ok(views.filter((v) => onRoute(v.x, v.z).d < 30).length >= 20);
  assert.ok(views.filter((v) => v.kind === 'foot' && inShooter(v.x, v.z)).length >= 6);
  assert.ok(views.filter((v) => v.kind === 'skyline').length >= 2);
});

test('a kart\'s viewpoint is on the route, looking the way the race goes', () => {
  for (const v of views.filter((q) => q.kind === 'kart' && q.route !== false)) {
    const r = onRoute(v.x, v.z);
    assert.ok(r.d < 12, `${v.id} is ${r.d.toFixed(0)} m from the route`);
    assert.ok(turn(heading(v), r.race) < 35, `${v.id} looks ${turn(heading(v), r.race).toFixed(0)}° off the race`);
  }
});

// One the route has left (`route: false`, since task 039: couteiro) is a kart's view of a street of
// the open world, still in it.
test('a kart\'s viewpoint off the route is on a street in the open world', async () => {
  const off = views.filter((q) => q.kind === 'kart' && q.route === false);
  const w = await loadWorld({ x0: Math.min(...off.map((v) => v.x)) - 20, x1: Math.max(...off.map((v) => v.x)) + 20, z0: Math.min(...off.map((v) => v.z)) - 20, z1: Math.max(...off.map((v) => v.z)) + 20 });
  for (const v of off) {
    assert.ok(w.inOpen(v.x, v.z), `${v.id} is outside the open world`);
    let d = Infinity;
    for (const l of w.lines) if (l.kind <= 5) for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((v.x - ax) * dx + (v.z - az) * dz) / (dx * dx + dz * dz || 1)));
      d = Math.min(d, Math.hypot(v.x - ax - f * dx, v.z - az - f * dz));
    }
    assert.ok(d < 6, `${v.id} is ${d.toFixed(0)} m from a street`);
  }
});

test('each viewpoint is at eye level above the ground', async () => {
  const w = await loadWorld({ x0: Math.min(...views.map((v) => v.x)), x1: Math.max(...views.map((v) => v.x)), z0: Math.min(...views.map((v) => v.z)), z1: Math.max(...views.map((v) => v.z)) });
  for (const v of views) {
    const up = v.y - w.height(v.x, v.z);
    assert.ok(up > 0.5 && up < 3, `${v.id} is ${up.toFixed(1)} m above the ground`);
  }
});

// Whether (x, z) is inside a piece's rings: its outline, and none of its holes.
const inRing = (x, z, r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, zi] = r[i], [xj, zj] = r[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};
const inPiece = (x, z, p) => inRing(x, z, p.rings[0]) && !p.rings.slice(1).some((h) => inRing(x, z, h));
// Half a car's width: a car's camera in its lane is at least this far in from the carriageway's edge.
const HALF_CAR = 0.9;

test('each viewpoint\'s camera stands on the surface its photo was taken from', async () => {
  for (const v of views) {
    assert.ok(['lane', 'pavement', 'path', 'ground'].includes(v.surface), `${v.id}: surface`);
    const w = await loadWorld({ x0: v.x - 2, x1: v.x + 2, z0: v.z - 2, z1: v.z + 2 });
    const S = w.streets;
    const on = (x, z) => (S.carriageways.some((c) => inPiece(x, z, c)) ? 'lane' : S.paths.some((p) => inPiece(x, z, p)) ? 'path' : S.pavements.some((p) => inPiece(x, z, p)) ? 'pavement' : 'ground');
    assert.equal(on(v.x, v.z), v.surface, `${v.id} stands on ${on(v.x, v.z)}, its photo on ${v.surface}`);
    // In a lane, a car's width from the kerb: round the camera, the carriageway everywhere half a
    // car's width out (pieces of it cut at the tiles' edges joined, as a game draws them).
    if (v.surface === 'lane') for (let a = 0; a < 16; a++) {
      const x = v.x + HALF_CAR * Math.cos((a * Math.PI) / 8), z = v.z + HALF_CAR * Math.sin((a * Math.PI) / 8);
      assert.equal(on(x, z), 'lane', `${v.id} is within ${HALF_CAR} m of its carriageway's edge`);
    }
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
