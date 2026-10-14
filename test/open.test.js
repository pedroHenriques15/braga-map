// The open world's area (task 032, decision 019): its edge, a simple ring round the Volta dos Amigos
// with the loop well inside it; a gate wherever a street crosses it, and nowhere else, each crossed
// square; and the ground every 2 m on every tile it touches.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorld, map, tilesFor } from '../index.js';
import { TILES } from '../world/tiles.js';
import amigos from '../tracks/amigos.js';

const m = map();
const { pts, gates } = m.open;
const n = pts.length;
const side = (k) => [pts[k], pts[(k + 1) % n]];
// Whether the stretches ab and cd cross (not just touch).
const cross = ([ax, az], [bx, bz], [cx, cz], [dx, dz]) => {
  const d1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), d2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
  const d3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), d4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
  return d1 * d2 < 0 && d3 * d4 < 0;
};
const toSeg = ([px, pz], [ax, az], [bx, bz]) => {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
};
const toEdge = (p) => { let d = Infinity; for (let k = 0; k < n; k++) d = Math.min(d, toSeg(p, ...side(k))); return d; };

test('the edge is a closed ring that never crosses itself', () => {
  assert.ok(n >= 3, 'three points or more');
  for (let k = 0; k < n; k++) {
    const [a, b] = side(k);
    assert.ok(a[0] !== b[0] || a[1] !== b[1], `no side of no length, at ${a}`);
    for (let j = k + 2; j < n; j++) {
      if (k === 0 && j === n - 1) continue;
      assert.ok(!cross(a, b, ...side(j)), `the sides at ${a} and ${side(j)[0]} cross`);
    }
  }
});

test('the Volta dos Amigos is all inside it, at least 100 m from the edge', () => {
  let least = Infinity;
  for (const { p } of amigos.points) {
    assert.ok(m.inOpen(p[0], p[2]), `${p[0]}, ${p[2]} is outside`);
    least = Math.min(least, toEdge([p[0], p[2]]));
  }
  assert.ok(least >= 100, `the loop comes within ${least.toFixed(0)} m of the edge`);
  assert.ok(!m.inOpen(-130, -28), 'the Praça da República is outside');
  assert.ok(m.inOpen(648, 1482), "the Picoto's top is inside");
});

const world = await loadWorld({ open: true });

test('it loads the tiles under the area and those round it', () => {
  assert.deepEqual(tilesFor({ open: true }), [...m.open.tiles, ...m.open.seen]);
  for (const id of m.open.tiles) assert.ok(world.tiles.includes(id), id);
  // Every point of the edge is on a tile under it.
  for (const [x, z] of pts) assert.ok(m.open.tiles.includes(m.tileAt(x, z)), `${x}, ${z}`);
});

test('a gate wherever a street crosses the edge, and nowhere else, each crossed square', () => {
  // Every street's crossings, as the tiles have it (the railway isn't a street).
  const C = 50, grid = new Map(), found = [];
  for (let k = 0; k < n; k++) {
    const [[ax, az], [bx, bz]] = side(k);
    for (let gx = Math.floor(Math.min(ax, bx) / C); gx <= Math.floor(Math.max(ax, bx) / C); gx++) for (let gz = Math.floor(Math.min(az, bz) / C); gz <= Math.floor(Math.max(az, bz) / C); gz++) {
      const key = gx + ',' + gz;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(k);
    }
  }
  const LEVELS = ['ground', 'bridge', 'tunnel', 'under'];
  for (const l of world.lines) {
    if (l.kind > 8) continue;
    for (let i = 1; i < l.pts.length; i++) {
      const p = l.pts[i - 1], q = l.pts[i], ks = new Set();
      for (let gx = Math.floor(Math.min(p[0], q[0]) / C); gx <= Math.floor(Math.max(p[0], q[0]) / C); gx++) for (let gz = Math.floor(Math.min(p[1], q[1]) / C); gz <= Math.floor(Math.max(p[1], q[1]) / C); gz++) for (const k of grid.get(gx + ',' + gz) ?? []) ks.add(k);
      for (const k of ks) {
        const [a, b] = side(k);
        if (!cross(p, q, a, b)) continue;
        const dx = q[0] - p[0], dz = q[1] - p[1], ex = b[0] - a[0], ez = b[1] - a[1], t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / (dx * ez - dz * ex);
        found.push({ x: p[0] + dx * t, z: p[1] + dz * t, level: l.level });
      }
    }
  }
  assert.ok(gates.length > 50, `${gates.length} gates`);
  let square = 0;
  for (const c of found) {
    const g = gates.find((g) => Math.hypot(g.x - c.x, g.z - c.z) < 2.5 && g.level === c.level);
    assert.ok(g, `a street crosses at ${c.x.toFixed(1)}, ${c.z.toFixed(1)} (${c.level}) with no gate`);
  }
  for (const g of gates) {
    assert.ok(found.some((c) => Math.hypot(g.x - c.x, g.z - c.z) < 2.5), `a gate at ${g.x}, ${g.z} with no street`);
    assert.ok(LEVELS.includes(g.level) && g.w >= 2 && g.k >= 0 && g.k <= 8 && Number.isFinite(g.y), `a gate at ${g.x}, ${g.z}: ${JSON.stringify(g)}`);
    // Square: the edge's side through it runs across the street's heading.
    let best = null, bd = Infinity;
    for (let k = 0; k < n; k++) { const d = toSeg([g.x, g.z], ...side(k)); if (d < bd) { bd = d; best = side(k); } }
    const [a, b] = best, ex = b[0] - a[0], ez = b[1] - a[1];
    const off = Math.abs(90 - (Math.acos(Math.abs(Math.cos(g.heading) * ex + Math.sin(g.heading) * ez) / Math.hypot(ex, ez)) * 180) / Math.PI);
    // Two streets side by side, where they fork at the edge, are crossed by one straight piece, square
    // to neither: up to 15° off each.
    assert.ok(off <= 20, `the edge crosses the street at ${g.x}, ${g.z} ${off.toFixed(0)}° from square`);
    if (off <= 5) square++;
    // Its heading points out.
    assert.ok(!m.inOpen(g.x + Math.cos(g.heading) * 1.5, g.z + Math.sin(g.heading) * 1.5) && m.inOpen(g.x - Math.cos(g.heading) * 1.5, g.z - Math.sin(g.heading) * 1.5), `the gate at ${g.x}, ${g.z} points out`);
  }
  assert.ok(square >= gates.length * 0.9, `${square} of ${gates.length} crossed within 5° of square`);
});

test('the ground is every 2 m on every tile the area touches', async () => {
  for (const id of m.open.tiles) {
    const bin = Buffer.from((await TILES[id]()).default, 'base64');
    assert.equal(JSON.parse(bin.subarray(4, 4 + bin.readUInt32LE(0)).toString()).terrain.step, 2, id);
  }
});
