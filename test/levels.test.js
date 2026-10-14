// The streets on two levels (task 012), in the world as the games read it: each street says its
// level, a bridge's deck and a tunnel's road have their heights, and where streets cross on two
// levels near the route there's room between them (tools/levels.mjs lists every crossing).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import amigos from '../tracks/amigos.js';
import { check } from '../tools/levels.mjs';

const w = await loadWorld(amigos.box);
const c = await check();

test('every street says its level, and a bridge or a tunnel has its heights', () => {
  const levels = new Set(['ground', 'bridge', 'tunnel', 'under']);
  for (const l of w.lines) {
    assert.ok(levels.has(l.level), `a line on ${l.level}`);
    if (l.level === 'bridge' || l.level === 'tunnel') assert.equal(l.heights?.length, l.pts.length);
    else assert.equal(l.heights, undefined);
  }
  assert.ok(c.bridges > 10 && c.tunnels > 5, `${c.bridges} bridges, ${c.tunnels} tunnels in the track's box`);
});

test("a tunnel's road is under the ground over it", () => {
  // At a tunnel's middle, the ground is more than 2 m over its road (its roof, and what's on it).
  for (const l of w.lines.filter((q) => q.level === 'tunnel' && q.pts.length > 2)) {
    const k = l.pts.length >> 1;
    assert.ok(w.height(...l.pts[k]) - l.heights[k] > 2, `a tunnel at ${l.pts[k]}: its road ${l.heights[k]}, the ground ${w.height(...l.pts[k])}`);
  }
});

test('where streets cross on two levels by the route, there is room between them', () => {
  const near = c.pairs.filter((p) => p.route < 300);
  assert.ok(near.length >= 8, `${near.length} crossings within 300 m of the route`);
  for (const p of near) assert.notEqual(p.is, 'low', `at (${p.x}, ${p.z}): ${p.room} m between`);
  // Under the route's own bridges, the Avenida Frei Bartolomeu dos Mártires; under the streets beside
  // it at the Avenida da Liberdade and the 31 de Janeiro, the tunnels.
  assert.ok(near.filter((p) => p.is === 'over' && p.up.level === 'bridge' && p.down.level !== 'tunnel').every((p) => p.room > 5), 'room under the decks');
  assert.ok(near.some((p) => p.is === 'over' && p.down.level === 'tunnel'), 'a tunnel under a street');
  console.log(`${c.pairs.length} crossings in the box: ${['over', 'meets', 'mouth', 'low'].map((k) => `${c.pairs.filter((p) => p.is === k).length} ${k}`).join(', ')}; ${near.length} within 300 m of the route`);
});
