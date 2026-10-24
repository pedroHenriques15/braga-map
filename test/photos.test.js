// The reference photos (refs/photos.json, task 008): a real photo of each facade, landmark, bridge,
// roundabout, kind of wall and close-up, found online, each with its credit; and views of trees in
// leaf, for their species (task 088). None shows a friend's
// house: each was taken 150 m from every egg, and from every waypoint where .cache/places.json is
// there to check against, and none looks towards one within 300 m.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { CACHE, P } from '../tools/geo.mjs';

const { credit, photos } = JSON.parse(fs.readFileSync(new URL('../refs/photos.json', import.meta.url), 'utf8'));
const tracks = await Promise.all(fs.readdirSync(new URL('../tracks/', import.meta.url)).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
const PLACES = path.join(CACHE, 'places.json');
const NEAR = 150, FAR = 300;
// Licences that allow a photo to be used as a texture, and the result published (decision 006).
const OPEN = /^(CC BY(-SA)? [1-4]\.0|CC0|Public domain)$/;
const WHAT = /^(facade:(way|relation)\/\d+|facade:lidar\/x-?\d+z-?\d+|(landmark|type|wall|closeup):[a-z0-9]+(-[a-z0-9]+)*|(bridge|roundabout):way\/\d+|gate|garden|trees)$/;

const turn = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

test('each photo says what it shows, and whose it is', () => {
  assert.match(credit, /Mapillary/);
  assert.match(credit, /Commons/);
  assert.equal(new Set(photos.map((p) => p.id)).size, photos.length);
  for (const e of photos) {
    assert.match(e.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, e.id);
    assert.match(e.what, WHAT, e.id);
    assert.ok(['reference', 'texture'].includes(e.use), e.id);
    for (const k of ['heading', 'pitch', 'fov']) assert.ok(e[k] === null || Number.isFinite(e[k]), `${e.id}: ${k}`);
    if (e.fov !== null) assert.ok(e.fov > 10 && e.fov <= 120, `${e.id}: fov`);
    const p = e.photo;
    for (const k of ['source', 'id', 'url', 'author', 'licence', 'date']) assert.ok(p[k], `${e.id}: photo.${k}`);
    assert.ok(['mapillary', 'commons'].includes(p.source), e.id);
    assert.match(p.licence, OPEN, e.id);
    assert.match(p.date, /^\d{4}(-\d{2}-\d{2})?$/, e.id);
    if (p.source === 'mapillary') {
      assert.equal(p.licence, 'CC BY-SA 4.0', e.id);
      assert.equal(p.url, `https://www.mapillary.com/app/?pKey=${p.id}`, e.id);
      // A panorama's cut says where it looks.
      for (const k of ['lat', 'lon', 'heading', 'pitch', 'roll']) assert.ok(Number.isFinite(p[k]), `${e.id}: photo.${k}`);
      assert.ok(e.heading !== null && e.fov !== null, e.id);
    } else assert.ok(p.url.startsWith('https://commons.wikimedia.org/wiki/File:'), e.id);
    // Only a close-up, of a surface or an object, may come without a position.
    if (p.lat == null || p.lon == null) assert.match(e.what, /^closeup:/, `${e.id} has no position`);
  }
});

test('step 1\'s kinds each have a photo', () => {
  const has = (re) => photos.some((e) => re.test(e.what));
  for (const lm of ['sao-joao-da-ponte', 'altice-forum', 'estadio-1-de-maio', 'picoto', 'igreja-de-lamacaes', 'skyline', 'bom-jesus', 'sameiro']) assert.ok(has(new RegExp(`^landmark:${lm}$`)), lm);
  for (const k of ['pavement-calcada', 'pavement-setts', 'kerb', 'azulejos', 'bus-shelter', 'street-lamp', 'bench', 'bin', 'ecoponto', 'manhole', 'road-sign']) assert.ok(has(new RegExp(`^closeup:${k}$`)), k);
  for (const re of [/^bridge:/, /^roundabout:/, /^wall:/, /^gate$/, /^garden$/, /^type:/]) assert.ok(has(re), String(re));
  assert.ok(photos.filter((e) => e.what.startsWith('facade:')).length > 250);
});

test('no photo is near a friend\'s house, or looks at one', (t) => {
  const away = tracks.flatMap((tr) => tr.eggs.map((e) => [e.x, e.z]));
  if (fs.existsSync(PLACES)) away.push(...JSON.parse(fs.readFileSync(PLACES, 'utf8')).places.map((p) => [p.x, p.z]));
  else t.diagnostic('.cache/places.json isn\'t here: checked against the eggs only');
  let nearest = { d: Infinity };
  for (const e of photos) {
    const p = e.photo;
    if (p.lat == null) continue;
    const [x, z] = P({ lat: p.lat, lon: p.lon });
    for (const [hx, hz] of away) {
      const d = Math.hypot(hx - x, hz - z);
      if (d < nearest.d) nearest = { d, id: e.id };
      // Nor turned towards one within 300 m: the part of the photo used, or all of it where it's
      // not known which way it looks.
      if (d > FAR) continue;
      const at = ((Math.atan2(hx - x, -(hz - z)) * 180) / Math.PI + 360) % 360;
      assert.ok(e.heading !== null && e.fov !== null && turn(at, e.heading) > e.fov / 2 + 5, `${e.id} looks towards a waypoint or an egg`);
    }
  }
  t.diagnostic(`the nearest waypoint or egg is ${nearest.d.toFixed(0)} m from a photo (${nearest.id})`);
  assert.ok(nearest.d >= NEAR, `${nearest.id} is within ${NEAR} m of a waypoint or an egg`);
});
