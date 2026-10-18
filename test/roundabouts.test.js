// The roundabouts as they are (task 014): a made-up ring measured across from its middle outwards
// (roundabouts.mjs), its line moved onto the middle of its carriageway at its width; and where the
// open world's rings were measured (.cache/roundabouts.json, with the LiDAR), each ring's island in
// the tiles where its kerb was measured, a give-way line at every entry, and the statues in their
// islands.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';
import { readCache } from '../tools/geo.mjs';
import { driven } from '../tools/osm.mjs';
import { onCarriageways, streetsOf } from '../tools/lines.mjs';
import { OPEN_BOX } from '../tools/sections.mjs';
import { FILE, measureRing, ringMoves, ringProfile, ringsOf } from '../tools/roundabouts.mjs';
import { BIN } from '../tools/carriageways.mjs';

// ---- A made-up ring ----

// A roundabout round (0, 0): its island 6 m across to its kerb, 15 cm up and grass; its ring 8 m of
// asphalt; a pavement beyond, 15 cm up. The map's line 11 m round it, 6.5 m wide.
const level = (r) => (r < 6 || r > 14 ? 100.15 : 100), echo = (r) => (r < 6 || r > 14 ? 12 : 5);
const section = (x, z, tx, tz, span) => {
  const J = Math.round(span / BIN), o = [], h = [], e = [];
  for (let j = -J; j <= J; j++) { const off = j * BIN, r = Math.hypot(x - tz * off, z + tx * off); o.push(off); h.push(level(r)); e.push(echo(r)); }
  return { o: Float64Array.from(o), h: Float64Array.from(h), e: Float64Array.from(e), park: new Uint8Array(o.length) };
};
const n = 24, made = Array.from({ length: n + 1 }, (_, i) => [11 * Math.cos((2 * Math.PI * i) / n), 11 * Math.sin((2 * Math.PI * i) / n)]);
const ringLine = { id: 1, k: 4, w: 6.5, pts: made, nodes: made.map((_, i) => 100 + (i % n)), t: { highway: 'tertiary', junction: 'roundabout' }, level: 0 };

test('a ring measured: its island at its kerb, its width kerb to kerb, its line moved onto the middle', () => {
  const [ring] = ringsOf([ringLine]);
  assert.ok(ring && ring.pts.length === n, 'the ring, joined round');
  const st = measureRing(ring, section, []);
  assert.ok(st.length >= 30, `${st.length} stations`);
  assert.ok(st.every((q) => q.din !== null && Math.abs(Math.hypot(q.x - q.n[0] * q.din, q.z - q.n[1] * q.din) - 6) < 0.3), 'the island\'s kerb seen 6 m round');
  const p = ringProfile(ring, st);
  assert.ok(p.ok && p.measured && Math.abs(p.width - 8) <= 0.3, `${p.width} m wide`);
  assert.ok(p.circle && Math.abs(p.island - 6) < 0.2, `round, the island ${p.island?.toFixed(2)} m`);
  ring.stations = st;
  ring.profile = p;
  const moves = ringMoves([ring], [ringLine], null);
  for (const [i, nd] of ring.nodes.entries()) {
    const [dx, dz] = moves.nodes[nd], r = Math.hypot(ring.pts[i][0] + dx, ring.pts[i][1] + dz);
    assert.ok(Math.abs(r - 10) < 0.25, `node ${nd} moved to ${r.toFixed(2)} m round`);
  }
  assert.equal(moves.widths[1], p.width);
});

// ---- The open world's rings ----

const measured = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;
const skip = !measured && "the rings weren't measured (node tools/roundabouts.mjs, with DGT's LiDAR)";
const world = measured ? await loadWorld({ open: true }) : null;
const onTileEdge = ([x, z]) => Math.abs(x / 500 - Math.round(x / 500)) * 500 < 0.15 || Math.abs(z / 500 - Math.round(z / 500)) * 500 < 0.15;
// Largo de Maximinos: a street runs under its ring in a cutting, straight through its island, and the
// map has it on the ground: its carriageway covers the island (as before the task).
const NO_ISLAND = new Set(['Largo de Maximinos']);

test("every roundabout in the open world's box has its island where the LiDAR measured its kerb", { skip }, () => {
  const rings = measured.rings, islands = world.streets.pavements.filter((p) => p.round);
  assert.ok(rings.length >= 20, `${rings.length} rings`);
  assert.ok(rings.filter((r) => r.moved).length >= 18, 'most moved');
  for (const r of rings) {
    if (NO_ISLAND.has(r.name)) continue;
    const c = r.centre ?? r.c, mine = islands.filter((p) => p.rings[0].some(([x, z]) => Math.hypot(x - c[0], z - c[1]) < (r.island ?? 10) + 3));
    assert.ok(mine.length, `${r.name} (${r.c}): an island`);
    if (!r.moved || !r.centre) continue;
    // A round one: its kerb within 35 cm of the circle measured, but where a tile cuts it.
    const off = mine.flatMap((p) => p.rings[0].filter((q) => !onTileEdge(q)).map(([x, z]) => Math.abs(Math.hypot(x - c[0], z - c[1]) - r.island)));
    const far = off.filter((d) => d > 0.35);
    assert.ok(far.length <= 0.05 * off.length, `${r.name} (${r.c}): ${far.length} of ${off.length} of its kerb's points more than 35 cm off the ${r.island} m measured`);
  }
});

test('a give-way line at every entry of a ring in the area, and a triangle behind it', { skip }, () => {
  // Each entry: a street on the ground meeting a ring at one of its nodes, its traffic going in.
  const B = OPEN_BOX, lines = streetsOf(onCarriageways(readCache('osm/base.json')), (x, z, m) => x >= B.x0 - m && x <= B.x1 + m && z >= B.z0 - m && z <= B.z1 + m);
  const moved = new Set(measured.rings.filter((r) => !NO_ISLAND.has(r.name)).flatMap((r) => r.ways)), ringNode = new Map();
  for (const l of lines) if (moved.has(l.id)) for (const nd of l.nodes) ringNode.set(nd, l);
  const give = world.streets.markings.filter((m) => m.kind === 'giveway'), tri = world.streets.markings.filter((m) => m.kind === 'yield');
  const zebras = world.streets.markings.filter((m) => m.kind === 'zebra');
  const segDist = ([x, z], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * f, z - az - dz * f); };
  const near = (list, p, r) => list.some((m) => m.pts.some((q, k) => k && segDist(p, m.pts[k - 1], q) < r));
  let entries = 0;
  const missing = [];
  for (const l of lines) {
    if (l.t.junction === 'roundabout' || l.k > 7 || l.level !== 0) continue;
    for (const [i, ring] of [[0, ringNode.get(l.nodes[0])], [l.nodes.length - 1, ringNode.get(l.nodes.at(-1))]]) {
      const end = i === l.nodes.length - 1, d = driven(l.t);
      if (!ring || (end ? d < 0 : d > 0)) continue;
      const out = end ? [...l.pts].reverse() : l.pts, len = out.reduce((s, q, k) => (k ? s + Math.hypot(q[0] - out[k - 1][0], q[1] - out[k - 1][1]) : 0), 0);
      // Where its line goes, half the ring's width and 30 cm out along the street; but not on a zebra
      // the map has there (within its 4 m and a metre either side, streets.mjs's zebra zone), nor on a
      // street too short for it.
      const back = ring.w / 2 + 0.3, a = out[0], b = out[1], q = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, p = [a[0] + ((b[0] - a[0]) * back) / q, a[1] + ((b[1] - a[1]) * back) / q];
      if (len < back + 1 || q < back || near(zebras, p, 3.5) || !(p[0] > B.x0 && p[0] < B.x1 && p[1] > B.z0 && p[1] < B.z1)) continue;
      entries++;
      if (!near(give, p, 1.5)) missing.push(`${l.t.name ?? l.id} (${p.map(Math.round)})`);
    }
  }
  console.log(`${entries} entries into the area's rings, ${give.length} give-way lines, ${tri.length} triangles`);
  assert.ok(entries >= 40, `${entries} entries`);
  assert.equal(missing.length, 0, `no give-way line: ${missing.join(', ')}`);
  assert.ok(tri.length >= entries * 0.8, `${tri.length} triangles for ${entries} entries`);
});

test("the statues in the roundabouts' islands: São João da Ponte's São João Baptista, the Rotunda Santos da Cunha's", { skip }, async () => {
  const statues = (await map()).sights.filter((s) => s.kind === 'statue');
  const joao = statues.find((s) => s.subject === 'João Batista'), cunha = statues.find((s) => /Santos da Cunha/.test(s.name ?? ''));
  // São João da Ponte's: in its island, 4.3 m to its top (DGT's point cloud, its top classed as noise).
  assert.ok(joao && Math.hypot(joao.x - 361.8, joao.z - 1017.4) < 1 && joao.h > 4 && joao.h < 5.2, `São João Baptista: ${JSON.stringify(joao)}`);
  assert.ok(cunha && Math.hypot(cunha.x + 803.5, cunha.z - 982.2) < 1.5 && cunha.h > 5, `the comendador: ${JSON.stringify(cunha)}`);
});
