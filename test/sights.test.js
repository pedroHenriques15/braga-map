// The sights (tools/world.mjs, task 021): each where the map has it, and those the LiDAR measured
// (tools/sights.mjs) as the real thing is: the stadium's stands rising round its track to their outer
// wall, and its four floodlights; São João da Ponte's chapel on its building, its front to the
// square before it; and the bridge's arch where the Avenida da Liberdade crosses the Este. And the
// route's other chapels on their buildings, São Lázaro's bell tower and two wayside shrines (task 056).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';

const sights = map().sights;
const one = (kind) => sights.find((s) => s.kind === kind);
const views = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8')).viewpoints;
const inRing = (pts, x, z) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};

test('every sight is there, once', () => {
  for (const kind of ['bomjesus', 'sameiro', 'saojoao', 'arch', 'cruzeiro', 'tourigalo', 'makro', 'altice', 'stadium', 'saolazaro']) assert.equal(sights.filter((s) => s.kind === kind).length, 1, kind);
  assert.deepEqual(sights.filter((s) => s.kind === 'chapel').map((s) => s.id).sort(), ['santa-justa', 'santa-tecla', 'santo-adriao']);
  assert.deepEqual(sights.filter((s) => s.kind === 'shrine').map((s) => s.id).sort(), ['boa-morte', 'bonfim']);
});

test("the stadium's stands rise from its track to their outer wall, its floodlights round it", () => {
  const s = one('stadium');
  assert.ok(s.stands && s.lights, 'not measured: node tools/sights.mjs, then npm run world');
  const { spokes } = s.stands;
  assert.ok(spokes.length >= 150, `${spokes.length} spokes`);
  const full = spokes.filter((q) => q.h.length >= 10);
  assert.ok(full.length / spokes.length > 0.9, `${full.length} of ${spokes.length} spokes with stands`);
  for (const q of spokes) for (const h of q.h) assert.ok(h > s.y - 1 && h < s.y + 22, `a step at ${h} m, the pitch at ${s.y}`);
  // Each up from the track to its top: the middle one rises more than 8 m.
  const rises = full.map((q) => Math.max(...q.h) - q.h[0]).sort((a, b) => a - b);
  assert.ok(rises[rises.length >> 1] > 8, `the middle spoke rises ${rises[rises.length >> 1]} m`);
  assert.equal(s.lights.length, 4);
  for (const [x, z, top] of s.lights) {
    assert.ok(top - s.y > 30 && top - s.y < 50, `a floodlight ${top - s.y} m over the pitch`);
    assert.ok(Math.hypot(x - s.x, z - s.z) < 130);
  }
});

test("São João da Ponte's chapel stands on its building, its front to the square before it", async () => {
  const c = one('saojoao');
  const w = await loadWorld({ x0: c.x - 30, x1: c.x + 30, z0: c.z - 30, z1: c.z + 30 });
  const covered = w.buildings.filter((b) => inRing(c.covers, b.pts.reduce((a, p) => a + p[0], 0) / b.pts.length, b.pts.reduce((a, p) => a + p[1], 0) / b.pts.length));
  assert.ok(covered.length >= 1, 'no building under it');
  // Its front looks to where its photo was taken from.
  const v = views.find((q) => q.id === 'capela-sao-joao');
  const to = Math.atan2(v.z - c.z, v.x - c.x);
  assert.ok(Math.abs(((to - c.face + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < Math.PI / 6, 'its front looks away from the square');
  assert.ok(c.top > c.ridge && c.ridge > c.eaves && c.eaves > c.porch, 'its heights out of order');
  assert.ok(c.L > 8 && c.L < 14 && c.W > 4 && c.W < 7);
});

test("the bridge's arch is where the Avenida da Liberdade crosses the Este, over its decks", async () => {
  const a = one('arch');
  let d = Infinity;
  for (const r of map().rivers) {
    for (let k = 1; k < r.pts.length; k++) {
      const [ax, az] = r.pts[k - 1], [bx, bz] = r.pts[k];
      const L = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((a.x - ax) * (bx - ax) + (a.z - az) * (bz - az)) / L));
      d = Math.min(d, Math.hypot(ax + (bx - ax) * t - a.x, az + (bz - az) * t - a.z));
    }
  }
  assert.ok(d < 3, `${d} m from the river`);
  const w = await loadWorld({ x0: a.x - a.r, x1: a.x + a.r, z0: a.z - a.r, z1: a.z + a.r });
  const decks = w.lines.filter((l) => l.level === 'bridge' && l.pts.every(([x, z]) => Math.hypot(x - a.x, z - a.z) < a.r));
  assert.ok(decks.length >= 2, 'its two carriageways');
  for (const l of decks) for (const h of l.heights) assert.ok(Math.abs(h - a.y) < 1.5, `a deck at ${h} m, the road at ${a.y}`);
});

// The building under a sight drawn in its place.
const under = async (s) => {
  const w = await loadWorld({ x0: s.x - 40, x1: s.x + 40, z0: s.z - 40, z1: s.z + 40 });
  return w.buildings.filter((b) => inRing(s.covers, b.pts.reduce((a, p) => a + p[0], 0) / b.pts.length, b.pts.reduce((a, p) => a + p[1], 0) / b.pts.length));
};

test("the route's chapels stand on their buildings, their heights the LiDAR's, Santa Justa's front to its street", async () => {
  for (const c of sights.filter((s) => s.kind === 'chapel')) {
    assert.ok((await under(c)).length >= 1, `no building under ${c.id}`);
    assert.ok(c.top >= c.ridge && c.ridge > c.eaves && c.eaves > 2.5 && c.top < 12, `${c.id}'s heights out of order`);
    assert.ok(c.L > 2 && c.L < 10 && c.W > 2 && c.W < 6, `${c.id} is ${2 * c.L} × ${2 * c.W} m`);
  }
  // Santo Adrião's porch, a building of its own, under it too.
  const a = sights.find((s) => s.id === 'santo-adriao');
  assert.ok(a.porch > 3 && a.porch < 6, `its porch ${a.porch} m deep`);
  assert.equal((await under(a)).length, 2);
  // Santa Justa looks west, to the Rua Monsenhor Airosa, which its viewpoint's camera comes up.
  const j = sights.find((s) => s.id === 'santa-justa'), v = views.find((q) => q.id === 'capela-santa-justa');
  assert.ok(Math.cos(j.face) < -0.9, 'Santa Justa looks away from its street');
  assert.ok(Math.hypot(v.x - j.x, v.z - j.z) < 30);
});

test("São Lázaro's bell tower stands on the highest part of its church, the shrines where the map has them", async () => {
  const t = sights.find((s) => s.kind === 'saolazaro');
  assert.ok(t.top > 10 && t.top < 20, `the tower ${t.top} m high`);
  const parts = await under(t);
  assert.equal(parts.length, 1);
  assert.ok(Math.abs(parts[0].y + parts[0].h - (t.y + t.top)) < 2, 'the tower stands for another part');
  for (const s of sights.filter((q) => q.kind === 'shrine')) {
    assert.ok(s.top > 2.5 && s.top < 5, `${s.id} ${s.top} m high`);
    assert.ok(s.L > 0.8 && s.L < 2 && s.W > 0.8 && s.W < 2, `${s.id} is ${2 * s.L} × ${2 * s.W} m`);
  }
});
