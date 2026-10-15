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
