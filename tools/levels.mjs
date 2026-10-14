// Checks the streets that cross on two levels (task 012), in the world as the games read it: each
// place where a street on a bridge crosses another, or one crosses a tunnel, with the heights of
// both there and the room between them. Each is one of:
// - over: a deck with room under it for what passes (4.5 m over a road, 5 m over the railway; a
//   footpath or a track less), or a tunnel 2 m or more under the ground;
// - meets: a bridge whose deck is at the ground there (its end, or a deck the LiDAR took for ground,
//   where what's under it is a tunnel): they meet at grade, as the streets do;
// - mouth: a tunnel under 2 m below the ground: its mouth, in a cutting;
// - low: a deck over a street with less room than it needs. A game would draw the deck through it.
//
// node tools/levels.mjs           the track's box (Volta dos Amigos); `all` for the whole map
//
// It reads world/ (npm run world). test/levels.test.js asserts what it finds.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadWorld, map } from '../index.js';
import amigos from '../tracks/amigos.js';

// Where segment a-b crosses c-d: the point and how far along each (0 to 1), or null.
function crossing(a, b, c, d) {
  const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return null;
  const u = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, v = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? { x: a[0] + rx * u, z: a[1] + rz * u, u, v } : null;
}

// What should pass under a deck: the room it needs.
const ROOM = (kind) => (kind === 9 ? 5 : kind <= 5 ? 4.5 : 2.5);
const NAME = ['a fast road', 'a link road', 'a primary street', 'a secondary street', 'a tertiary street', 'a street', 'a pedestrian street', 'a service road', 'a track', 'the railway'];

// How far a point is from the Volta dos Amigos' centre line.
const route = amigos.points.map((q) => [q.p[0], q.p[2]]);
const toRoute = (x, z) => Math.min(...route.map(([a, b]) => Math.hypot(a - x, b - z)));

export async function check(box = amigos.box) {
  const w = await loadWorld(box);
  const lines = w.lines.filter((l) => l.pts.length > 1);
  // A line's height at a point along its segment k: its own heights, or the ground.
  const heightAt = (l, k, f, x, z) => (l.heights ? l.heights[k] + (l.heights[k + 1] - l.heights[k]) * f : w.height(x, z));
  const rank = { tunnel: -1, ground: 0, under: 0, bridge: 1 };
  const pairs = [];
  const seen = new Set();
  for (const a of lines) {
    if (a.level === 'ground' || a.level === 'under') continue;
    for (const b of lines) {
      if (a === b || rank[a.level] === rank[b.level]) continue;
      for (let i = 1; i < a.pts.length; i++) {
        for (let j = 1; j < b.pts.length; j++) {
          const p = crossing(a.pts[i - 1], a.pts[i], b.pts[j - 1], b.pts[j]);
          if (!p || p.x < box.x0 || p.x > box.x1 || p.z < box.z0 || p.z > box.z1) continue;
          const key = `${Math.round(p.x)},${Math.round(p.z)}`;
          if (seen.has(key)) continue; // the same crossing, from the other line's side, or a tile's edge
          seen.add(key);
          // Not where they're joined: a point of both lines at the crossing.
          const joined = [a.pts[i - 1], a.pts[i]].some((q) => Math.hypot(q[0] - p.x, q[1] - p.z) < 1) && [b.pts[j - 1], b.pts[j]].some((q) => Math.hypot(q[0] - p.x, q[1] - p.z) < 1);
          if (joined) continue;
          const ya = heightAt(a, i - 1, p.u, p.x, p.z), yb = heightAt(b, j - 1, p.v, p.x, p.z);
          const [up, down, yu, yd] = rank[a.level] > rank[b.level] ? [a, b, ya, yb] : [b, a, yb, ya];
          const room = yu - yd;
          // Over a tunnel the room is its roof and the road over it; under a deck, what passes.
          const tunnel = down.level === 'tunnel', need = tunnel ? 2 : ROOM(down.kind) + 0.8;
          const is = tunnel ? (room >= need ? 'over' : 'mouth') : room >= need - 1 ? 'over' : Math.abs(room) < 1 ? 'meets' : 'low';
          pairs.push({ x: Math.round(p.x), z: Math.round(p.z), up: { kind: up.kind, level: up.level, y: Math.round(yu * 10) / 10 }, down: { kind: down.kind, level: down.level, y: Math.round(yd * 10) / 10 }, room: Math.round(room * 10) / 10, need, is, route: Math.round(toRoute(p.x, p.z)) });
        }
      }
    }
  }
  return { box, lines: lines.length, bridges: lines.filter((l) => l.level === 'bridge').length, tunnels: lines.filter((l) => l.level === 'tunnel').length, under: lines.filter((l) => l.level === 'under').length, pairs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = await check(process.argv[2] === 'all' ? map().ext : amigos.box);
  console.log(`In the box: ${c.lines} stretches of street and railway, ${c.bridges} on bridges, ${c.tunnels} in tunnels, ${c.under} under a deck or a building.`);
  const count = (is) => c.pairs.filter((p) => p.is === is).length;
  console.log(`${c.pairs.length} places where they cross: ${count('over')} on two levels, ${count('meets')} meeting at grade, ${count('mouth')} at a tunnel's mouth, ${count('low')} with a deck too low.\n`);
  for (const p of c.pairs.filter((q) => q.is !== 'meets').sort((a, b) => a.route - b.route)) {
    console.log(`${p.is.padEnd(5)} (${p.x}, ${p.z}), ${p.route} m from the route: ${NAME[p.up.kind]} ${p.up.level === 'bridge' ? 'on a bridge' : 'on the ground'} at ${p.up.y} m over ${NAME[p.down.kind]} ${p.down.level === 'tunnel' ? 'in a tunnel' : p.down.level === 'under' ? 'under it' : 'on the ground'} at ${p.down.y} m: ${p.room} m between (${p.need} m wanted)`);
  }
}
