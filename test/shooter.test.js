// The shooter's area (task 015, decision 003): Fujacal and Conselheiro Lobato, a simple ring round the
// five streets and a block each side of them, kept off the two avenues and the Rio Este; a game loads
// it as the section 'fujacal', with the tiles round it; and a gate wherever a street crosses its edge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { loadWorld, map, tilesFor } from '../index.js';
import amigos from '../tracks/amigos.js';

const m = map();
const { pts, gates } = m.shooter;
const n = pts.length;
const side = (k) => [pts[k], pts[(k + 1) % n]];
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
const { viewpoints } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
const view = (id) => viewpoints.find((v) => v.id === id);

test('the edge is a closed ring that never crosses itself', () => {
  assert.equal(m.shooter.id, 'fujacal');
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

test('the five streets are in it, and the avenues past it and the river out', () => {
  // On foot on the five streets, and the race's start on the Rua do Fujacal.
  for (const id of ['fujacal-west', 'travessa-fujacal', 'alameda-fujacal', 'lobato-pavement', 'travessa-lobato', 'lobato-east']) assert.ok(m.inShooter(view(id).x, view(id).z), id);
  const [sx, , sz] = amigos.points[0].p;
  assert.ok(m.inShooter(sx, sz), 'the start');
  // On the Avenida Imaculada Conceição's carriageway, and over the river at São João da Ponte.
  for (const id of ['imaculada-conceicao', 'sao-joao-da-ponte']) assert.ok(!m.inShooter(view(id).x, view(id).z), id);
  assert.ok(!m.inShooter(0, 0), 'the Praça da República');
  // A block each side: about a fifth of a square kilometre.
  let a = 0;
  for (let k = 0; k < n; k++) a += pts[k][0] * pts[(k + 1) % n][1] - pts[(k + 1) % n][0] * pts[k][1];
  assert.ok(Math.abs(a / 2) > 150000 && Math.abs(a / 2) < 300000, `${Math.round(Math.abs(a / 2))} m²`);
  // The river's water, as wide as the map has it, is all outside.
  for (const r of m.rivers) for (const [x, z] of r.pts) {
    if (x < -600 || x > 500 || z < 450 || z > 1250) continue;
    assert.ok(!m.inShooter(x, z) && toEdge([x, z]) >= m.riverHalfWidth - 1, `the river at ${x}, ${z}`);
  }
});

const world = await loadWorld({ sections: ['fujacal'] });

test("it loads as the section 'fujacal', with the tiles round it", () => {
  assert.deepEqual(tilesFor({ sections: ['fujacal'] }), [...m.shooter.tiles, ...m.shooter.seen]);
  assert.deepEqual(world.tiles, [...m.shooter.tiles, ...m.shooter.seen]);
  assert.ok(m.shooter.seen.length >= 8, 'the city round it');
  // Every point of the edge is on a tile under it, and every tile under it has some of it.
  for (const [x, z] of pts) assert.ok(m.shooter.tiles.includes(m.tileAt(x, z)), `${x}, ${z}`);
  assert.ok(world.buildings.filter((b) => m.inShooter(...b.pts[0])).length > 300, 'its buildings');
  // With another section, each tile once.
  const both = tilesFor({ sections: ['centro', 'fujacal'] });
  assert.equal(new Set(both).size, both.length);
  assert.deepEqual(both.slice(0, m.sections.find((s) => s.id === 'centro').tiles.length), m.sections.find((s) => s.id === 'centro').tiles);
  // The sections themselves are still the six that share the map out.
  assert.ok(!m.sections.some((s) => s.id === 'fujacal'));
});

test("the avenues' carriageways are outside it, up to their kerbs", () => {
  // The fast roads near it are the two avenues: their middles outside, and half their width from the
  // edge, but for the half metre the edge is worked out to and the map's lines thinned by.
  for (const l of world.lines) {
    if (l.kind !== 2 || l.level === 'tunnel') continue;
    for (const [x, z] of l.pts) assert.ok(!m.inShooter(x, z) && toEdge([x, z]) >= l.w / 2 - 1.5, `a fast road at ${x}, ${z}, ${toEdge([x, z]).toFixed(1)} m from the edge`);
  }
});

test('a gate wherever a street crosses the edge, and nowhere else', () => {
  const found = [];
  for (const l of world.lines) {
    if (l.kind > 8) continue;
    for (let i = 1; i < l.pts.length; i++) for (let k = 0; k < n; k++) {
      const p = l.pts[i - 1], q = l.pts[i], [a, b] = side(k);
      if (!cross(p, q, a, b)) continue;
      const dx = q[0] - p[0], dz = q[1] - p[1], ex = b[0] - a[0], ez = b[1] - a[1], t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / (dx * ez - dz * ex);
      found.push({ x: p[0] + dx * t, z: p[1] + dz * t, level: l.level });
    }
  }
  assert.ok(gates.length >= 5, `${gates.length} gates`);
  for (const c of found) assert.ok(gates.some((g) => Math.hypot(g.x - c.x, g.z - c.z) < 2.5 && g.level === c.level), `a street crosses at ${c.x.toFixed(1)}, ${c.z.toFixed(1)} with no gate`);
  // The fast roads' and the river's points, to tell a street meeting an avenue at its kerb or crossing
  // the river at its bank, where the edge runs along the kerb or the bank, from one leaving, which the
  // edge crosses square.
  const fast = [...world.lines.filter((l) => l.kind === 2 && l.level !== 'tunnel').flatMap((l) => l.pts), ...m.rivers.flatMap((r) => r.pts)];
  for (const g of gates) {
    assert.ok(found.some((c) => Math.hypot(g.x - c.x, g.z - c.z) < 2.5), `a gate at ${g.x}, ${g.z} with no street`);
    assert.ok(Number.isFinite(g.y) && g.w >= 2, `a gate at ${g.x}, ${g.z}: ${JSON.stringify(g)}`);
    assert.ok(!m.inShooter(g.x + Math.cos(g.heading) * 1.5, g.z + Math.sin(g.heading) * 1.5) && m.inShooter(g.x - Math.cos(g.heading) * 1.5, g.z - Math.sin(g.heading) * 1.5), `the gate at ${g.x}, ${g.z} points out`);
    if (fast.some(([x, z]) => Math.hypot(x - g.x, z - g.z) < 25)) continue;
    let best = null, bd = Infinity;
    for (let k = 0; k < n; k++) { const d = toSeg([g.x, g.z], ...side(k)); if (d < bd) { bd = d; best = side(k); } }
    const [a, b] = best, ex = b[0] - a[0], ez = b[1] - a[1];
    const off = Math.abs(90 - (Math.acos(Math.abs(Math.cos(g.heading) * ex + Math.sin(g.heading) * ez) / Math.hypot(ex, ez)) * 180) / Math.PI);
    assert.ok(off <= 5, `the edge crosses the street at ${g.x}, ${g.z} ${off.toFixed(0)}° from square`);
  }
});
