// The ground the world and the tracks stand on (task 009): every 2 m where the tracks run and the
// shooter is played, and true to DGT's LiDAR at known places, where it was fetched (`node
// tools/fetch.mjs lidar dem`); tools/relief.mjs prints the same, and the profile along each track.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { map } from '../index.js';
import { CACHE } from '../tools/geo.mjs';
import { SHOOTER_BOX } from '../tools/sections.mjs';
import { TILES } from '../world/tiles.js';

const tracks = await Promise.all(fs.readdirSync(new URL('../tracks/', import.meta.url)).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
const stepOf = async (id) => {
  const bin = Buffer.from((await TILES[id]()).default, 'base64');
  return JSON.parse(bin.subarray(4, 4 + bin.readUInt32LE(0)).toString()).terrain.step;
};
const lidar = fs.existsSync(path.join(CACHE, 'dgt', 'MDT-2m')) && fs.existsSync(path.join(CACHE, 'dem'));
const checked = lidar ? await (await import('../tools/relief.mjs')).check() : null;

test('the ground is every 2 m on the tiles the tracks run through and over the shooter\'s area', async () => {
  const m = map();
  const want = new Set();
  for (const t of tracks) for (const { p } of t.points) want.add(m.tileAt(p[0], p[2]));
  for (let x = SHOOTER_BOX.x0; x <= SHOOTER_BOX.x1; x += 50) for (let z = SHOOTER_BOX.z0; z <= SHOOTER_BOX.z1; z += 50) want.add(m.tileAt(x, z));
  for (const id of want) assert.equal(await stepOf(id), 2, id);
  assert.equal(await stepOf(m.tileAt(4380, 1030)), 10, 'the Sameiro, far from any track');
});

test('known places in the tiles are where the LiDAR has them', { skip: !lidar && 'the LiDAR and the relief before it aren\'t fetched' }, () => {
  for (const k of checked.known) assert.ok(Math.abs(k.diff) < (k.step === 2 ? 0.3 : 1), `${k.name}: the tile has ${k.tile} m, the LiDAR ${k.lidar} m`);
  console.log(checked.known.map((k) => `${k.name} ${k.tile} m (LiDAR ${k.lidar}, before ${k.eudem})`).join('; '));
});

test("the LiDAR's heights are on the sea level DGT publishes heights on", { skip: !lidar && 'the LiDAR isn\'t fetched' }, () => {
  const mark = checked.published.find((p) => p.name.includes('SAMEIRO-M2'));
  assert.ok(Math.abs(mark.diff) < 1, `the Sameiro's geodetic mark is ${mark.published} m, the LiDAR has ${mark.lidar} m there`);
});

test("each track crosses its bridges at their decks' height", { skip: !lidar && 'the LiDAR isn\'t fetched' }, () => {
  assert.ok(checked.decks.length > 0, 'no bridge with the point cloud under it');
  for (const d of checked.decks) assert.ok(Math.abs(d.diff) < 0.3, `${d.track} at ${d.at} m: the track is at ${d.track_y} m, the deck at ${d.deck} m`);
});

// A lump across a street the LiDAR took for ground (task 067): the crowns of the trees either side of
// the Rua Padre Francisco de Almeida meeting over it at (874, 1098), 9 m over the street. The street goes straight under
// them, at its height either side, as the world takes it (lines.mjs's streetBumps); and no street on the
// ground in the open world's area rises more than 4 m and falls again within 24 m (none could), where
// the ground past its kerbs doesn't.
test('the Rua Padre Francisco de Almeida at its own height under the crowns at (874, 1098), and no lump across a street', async () => {
  const { loadWorld } = await import('../index.js');
  const w = await loadWorld({ open: true });
  // Along its line from 4 m past the lump on one side to 4 m past it on the other: through the lump,
  // within 15 cm of the street's heights over those last 4 m either side (it was 9 m over them).
  const [a, b] = [[872.8, 1111.7], [877.5, 1080.5]], at = (f) => w.height(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
  const fs = Array.from({ length: 32 }, (_, k) => k / 31), ends = fs.filter((f) => f < 4 / 31.4 || f > 1 - 4 / 31.4).map(at), mid = fs.filter((f) => f >= 4 / 31.4 && f <= 1 - 4 / 31.4).map(at);
  const lo = Math.min(...ends) - 0.15, hi = Math.max(...ends) + 0.15;
  assert.ok(mid.every((y) => y >= lo && y <= hi), `through the lump ${Math.min(...mid).toFixed(2)}–${Math.max(...mid).toFixed(2)} m, either side ${(lo + 0.15).toFixed(2)}–${(hi - 0.15).toFixed(2)} m`);
  const lumps = [];
  for (const l of w.lines) {
    if (l.kind > 8 || l.level !== 'ground') continue;
    const s = [];
    for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i], L = Math.hypot(bx - ax, bz - az);
      for (let d = 0; d < L; d += 1) s.push({ x: ax + ((bx - ax) * d) / L, z: az + ((bz - az) * d) / L, rx: -(bz - az) / L, rz: (bx - ax) / L });
    }
    const y = s.map((p) => w.height(p.x, p.z)), o = l.w / 2 + 3;
    const side = (k, sg) => w.height(s[k].x + s[k].rx * o * sg, s[k].z + s[k].rz * o * sg);
    for (let k = 3; k < s.length - 3; k++) {
      if (!w.inOpen(s[k].x, s[k].z)) continue;
      for (let h = 3; h <= 12 && k - h >= 0 && k + h < s.length; h++) {
        const bump = y[k] - (y[k - h] + y[k + h]) / 2;
        const sides = Math.min(...[1, -1].map((sg) => side(k, sg) - (side(k - h, sg) + side(k + h, sg)) / 2));
        if (bump > 4 && sides < bump / 2) { lumps.push(`(${s[k].x.toFixed(0)}, ${s[k].z.toFixed(0)}) ${l.name ?? ''} ${bump.toFixed(1)} m`); break; }
      }
    }
  }
  assert.deepEqual(lumps, []);
});
