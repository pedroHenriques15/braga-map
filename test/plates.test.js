// The streets' names, the bus stops and the name plates (task 042), as the games read them: every
// line with the map's name for its street; every bus stop the map has; and in the open world's area a
// plate at the corners where each named street meets another, on the corner building's wall or on a
// post off the kerb, never on a carriageway or in a building.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';
import { CACHE, P, readCache } from '../tools/geo.mjs';
import { isLine, isSquare } from '../tools/lines.mjs';
import { inside } from '../tools/osm.mjs';

const w = await loadWorld({ open: true });
const [PW, PH] = map().plateSize;
const inOpen = (x, z) => w.inOpen(x, z);
const onGround = (p) => p.level === 'ground';
const carriageways = w.streets.carriageways.filter(onGround);
// Whether (x, z) is in any of the pieces (each its outline, then its holes).
const inPieces = (pieces, x, z) => pieces.some((p) => inside(p.rings[0], x, z) && !p.rings.slice(1).some((h) => inside(h, x, z)));
const boxes = w.buildings.map((b) => ({ b, x0: Math.min(...b.pts.map((p) => p[0])), x1: Math.max(...b.pts.map((p) => p[0])), z0: Math.min(...b.pts.map((p) => p[1])), z1: Math.max(...b.pts.map((p) => p[1])) }));
const inBuilding = (x, z) => boxes.some(({ b, x0, x1, z0, z1 }) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && inside(b.pts, x, z));

test("the streets' lines carry their names, and every street's name the map has in the area (a square's is its area's)", { skip: !fs.existsSync(path.join(CACHE, 'osm', 'base.json')) && 'no .cache/osm/base.json' }, () => {
  const named = w.lines.filter((l) => l.name);
  assert.ok(named.length > w.lines.length / 3, `${named.length} of ${w.lines.length} lines named`);
  assert.ok(w.lines.every((l) => l.name === null || (typeof l.name === 'string' && l.name.length)), 'a name is a name or null');
  const have = new Set(named.map((l) => l.name));
  const want = new Set(readCache('osm/base.json').elements.filter((e) => isLine(e) && e.tags.highway && e.tags.name && e.geometry.map(P).some(([x, z]) => inOpen(x, z)) && !isSquare(e, e.geometry.map(P))).map((e) => e.tags.name));
  const missing = [...want].filter((n) => !have.has(n));
  assert.deepEqual(missing, [], `named in the area but on no line: ${missing.join(', ')}`);
});

test('every bus stop the map has in the area is in the tiles, with its shelter', { skip: !fs.existsSync(path.join(CACHE, 'osm', 'street.json')) && 'no .cache/osm/street.json' }, () => {
  const osm = readCache('osm/street.json').elements.filter((e) => e.type === 'node' && e.tags?.highway === 'bus_stop').map((e) => ({ p: P(e), shelter: e.tags.shelter === 'yes' })).filter(({ p }) => inOpen(...p));
  const stops = w.stops.filter((s) => inOpen(s.x, s.z));
  assert.ok(osm.length > 50, `${osm.length} bus stops in the area`);
  // Each within 5 m of where the map has it (a stop on a street's line moves with it, task 026).
  const lost = osm.filter(({ p, shelter }) => !stops.some((s) => Math.hypot(s.x - p[0], s.z - p[1]) < 5 && s.shelter === shelter));
  assert.equal(lost.length, 0, `not in the tiles: ${lost.map(({ p }) => p.map(Math.round).join(', ')).join('; ')}`);
});

test('the plates: in the area, on a wall 5 cm off a building, or on a post off the carriageways, at their heights', () => {
  assert.ok(w.plates.length > 500, `${w.plates.length} plates`);
  assert.equal(PW, 1.2);
  assert.equal(PH, 0.3);
  const bad = [];
  for (const p of w.plates) {
    const at = `${p.name} ${p.on} (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`;
    const nx = Math.cos(p.face), nz = Math.sin(p.face), up = p.y - w.height(p.x, p.z);
    if (!p.name || !Number.isFinite(p.face)) bad.push(`${at}: no name or way it faces`);
    if (p.on === 'wall') {
      // The building behind it, the open in front of it, and the wall under it across its width.
      if (!inBuilding(p.x - nx * 0.1, p.z - nz * 0.1) || inBuilding(p.x + nx * 0.5, p.z + nz * 0.5)) bad.push(`${at}: not on a building's wall`);
      if (![-1, 1].every((s) => inBuilding(p.x - nx * 0.1 + nz * s * (PW / 2 - 0.05), p.z - nz * 0.1 - nx * s * (PW / 2 - 0.05)))) bad.push(`${at}: past its wall's end`);
      if (up < 2.3 || up > 6) bad.push(`${at}: ${up.toFixed(2)} m up`);
    } else {
      if (inPieces(carriageways, p.x, p.z) || inBuilding(p.x, p.z)) bad.push(`${at}: on a carriageway or in a building`);
      if (up < 2 || up > 3) bad.push(`${at}: ${up.toFixed(2)} m up`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} plates wrong`);
});

test('each named street meeting another in the area has its plates, most of them at a corner building where one stands', () => {
  const plated = new Set(w.plates.map((p) => p.name));
  const names = new Set(w.lines.filter((l) => l.name && l.kind <= 6 && l.pts.some(([x, z]) => inOpen(x, z))).map((l) => l.name));
  const without = [...names].filter((n) => !plated.has(n));
  console.log(`  ${w.plates.length} plates for ${plated.size} of the area's ${names.size} named streets, ${w.plates.filter((p) => p.on === 'wall').length} on a wall; without: ${without.join(', ')}`);
  assert.ok(without.length <= names.size / 10, `${without.length} named streets without a plate`);
  // No two plates of a name within 6 m.
  const close = w.plates.filter((p, i) => w.plates.some((q, j) => j < i && q.name === p.name && Math.hypot(q.x - p.x, q.z - p.z) < 6));
  assert.equal(close.length, 0, `${close.length} plates within 6 m of another of their name`);
});
