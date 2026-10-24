// The walls, fences, railings, hedges and gates (task 013): in the open world's tiles as the games
// read them, every barrier OpenStreetMap has in the area, but where it opens for a street, a path or
// a gate, or would stand on a carriageway whose lanes don't fit beside it (task 052); every gate the
// map has; each piece whole and standing off the carriageways; and a retaining wall's higher ground
// on its left.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld } from '../index.js';
import { CACHE, P, readCache } from '../tools/geo.mjs';
import { OPEN_BOX } from '../tools/sections.mjs';
import { barriersOf } from '../tools/walls.mjs';

const fetched = fs.existsSync(path.join(CACHE, 'osm', 'barriers.json'));
const skip = !fetched && "the barriers aren't fetched (node tools/fetch.mjs barriers)";
const w = await loadWorld(OPEN_BOX);
const inOpen = ([x, z]) => w.inOpen(x, z);
const KINDS = ['wall', 'retaining', 'fence', 'railing', 'hedge', 'guard_rail', 'gate', 'bar'];

// Lines in cells of 10 m, for the nearest of them to a point.
function index(list) {
  const cells = new Map();
  for (const l of list) {
    for (let i = 1; i < l.pts.length; i++) {
      const [ax, az] = l.pts[i - 1], [bx, bz] = l.pts[i];
      for (let a = Math.floor(Math.min(ax, bx) / 10); a <= Math.floor(Math.max(ax, bx) / 10); a++) for (let b = Math.floor(Math.min(az, bz) / 10); b <= Math.floor(Math.max(az, bz) / 10); b++) {
        const k = a + ',' + b;
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push([ax, az, bx, bz, l]);
      }
    }
  }
  return (x, z) => {
    let best = { d: Infinity, l: null };
    for (let a = Math.floor(x / 10) - 1; a <= Math.floor(x / 10) + 1; a++) for (let b = Math.floor(z / 10) - 1; b <= Math.floor(z / 10) + 1; b++) {
      for (const [ax, az, bx, bz, l] of cells.get(a + ',' + b) ?? []) {
        const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0, d = Math.hypot(ax + dx * t - x, az + dz * t - z);
        if (d < best.d) best = { d, l };
      }
    }
    return best;
  };
}
const inRings = (rings, x, z) => {
  let odd = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > z !== r[j][1] > z && x < r[i][0] + ((z - r[i][1]) / (r[j][1] - r[i][1])) * (r[j][0] - r[i][0])) odd = !odd;
  return odd;
};
// Whether (x, z) is on one of some pieces, quickly: the pieces in cells of 10 m.
const onAny = (list) => {
  const cells = new Map();
  for (const c of list) {
    const xs = c.rings[0].map((v) => v[0]), zs = c.rings[0].map((v) => v[1]);
    for (let i = Math.floor(Math.min(...xs) / 10); i <= Math.floor(Math.max(...xs) / 10); i++) for (let j = Math.floor(Math.min(...zs) / 10); j <= Math.floor(Math.max(...zs) / 10); j++) {
      const k = i + ',' + j;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(c);
    }
  }
  return (x, z) => (cells.get(Math.floor(x / 10) + ',' + Math.floor(z / 10)) ?? []).some((c) => inRings(c.rings, x, z));
};
const ground = (c) => c.level === 'ground' || c.level === 'under';
const onCarriageway = onAny(w.streets.carriageways.filter(ground)), onPath = onAny(w.streets.paths.filter(ground));
const onRoad = (x, z) => onCarriageway(x, z) || onPath(x, z);
// A line every half metre: [x, z] points.
const along = (pts) => {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * (k + 0.5)) / n, az + ((bz - az) * (k + 0.5)) / n]);
  }
  return out;
};

test('the open world carries its walls, fences, railings, hedges and gates', () => {
  const by = Object.groupBy(w.walls, (x) => x.kind);
  const km = (k, s) => (by[k] ?? []).filter((x) => !s || x.source === s).reduce((a, x) => a + along(x.pts).length * 0.5, 0) / 1000;
  console.log(`walls in the open world's tiles: ${KINDS.map((k) => `${k} ${(by[k] ?? []).length} (${km(k).toFixed(1)} km, ${km(k, 'lidar').toFixed(1)} found by the LiDAR)`).join(', ')}`);
  for (const k of ['wall', 'retaining', 'hedge', 'fence', 'gate']) assert.ok((by[k] ?? []).length > 10, `only ${(by[k] ?? []).length} of kind ${k}`);
  assert.ok(w.walls.some((x) => x.source === 'lidar') && w.walls.some((x) => x.source === 'osm'));
});

test('each is whole: its kind, its height, its line and its top at each point', () => {
  let off = 0, n = 0;
  for (const x of w.walls) {
    assert.ok(KINDS.includes(x.kind), x.kind);
    assert.ok(x.h > 0 && x.h < 15, `a ${x.kind} ${x.h} m high`);
    assert.ok(x.w > 0 && x.w <= 3, `a ${x.kind} ${x.w} m thick`);
    assert.ok(x.pts.length >= 2 && x.ys.length === x.pts.length);
    assert.ok(x.ys.every((y) => Number.isFinite(y) && y > -60 && y < 450), `${x.kind} at ${x.pts[0]}: tops ${x.ys}`);
    if (x.kind === 'gate' || x.kind === 'bar') assert.equal(typeof x.open, 'boolean');
    // Its top over the ground (but a retaining wall's, which is its higher side's): its height, within
    // a metre and a half, as the tiles hold the ground, a 2 m grid's mean (10 m on the box's edge
    // outside the area), where the top is over the LiDAR's own terrain, which steps at a wall.
    if (x.kind !== 'retaining') x.pts.forEach(([px, pz], i) => { n++; if (Math.abs(x.ys[i] - w.height(px, pz) - x.h) > 1.5) off++; });
  }
  console.log(`walls' tops: ${off} of ${n} points more than a metre and a half off the tiles' ground and their height`);
  assert.ok(off <= n * 0.03, `${off} of ${n} points' tops off their ground and height`);
});

test('no wall stands on a carriageway or a path on the ground, but a gate across a drive', () => {
  let on = 0, n = 0;
  for (const x of w.walls) {
    if (x.kind === 'gate' || x.kind === 'bar') continue;
    for (const [px, pz] of along(x.pts)) { n++; if (onRoad(px, pz)) on++; }
  }
  console.log(`walls on a carriageway or a path: ${on} of ${n} half metres`);
  // The tiles round the points to 10 cm, so a wall cut at a kerb can reach 5 cm into it.
  assert.ok(on <= n * 0.002, `${on} of ${n} half metres of wall on a carriageway or a path`);
});

test("every barrier the map has in the area is there, but where it opens, or a carriageway's lanes don't fit beside it", { skip }, () => {
  // Since task 052 a carriageway gives way to the map's walls that stand in it, and pavements and
  // paths stop at them: one is cut on a carriageway only where the street's lanes don't fit beside it
  // (or it stands across it, or in it under a metre long, or where streets meet).
  const near = index(w.walls);
  const gates = w.walls.filter((x) => x.kind === 'gate' || x.kind === 'bar');
  const gateAt = (x, z) => gates.some((g) => g.pts.some(([gx, gz]) => Math.hypot(gx - x, gz - z) < 7));
  const osm = barriersOf(readCache('osm/barriers.json'), () => true).filter((b) => b.pts.some(inOpen) && b.kind !== 'gate' && b.kind !== 'bar');
  let all = 0, there = 0, carriageway = 0, path = 0, gate = 0;
  const missing = [], cut = [];
  for (const b of osm) {
    for (const [x, z] of along(b.pts).filter(inOpen)) {
      all++;
      if (near(x, z).d < 0.3) there++;
      else if (onCarriageway(x, z)) { carriageway++; cut.push([Math.round(x), Math.round(z)]); }
      else if (onPath(x, z)) path++;
      else if (gateAt(x, z)) gate++;
      else missing.push([Math.round(x), Math.round(z), b.kind, b.id]);
    }
  }
  const pc = (n) => `${((n / all) * 100).toFixed(1)}%`;
  console.log(`the map's barriers in the area: ${(all / 2000).toFixed(1)} km, ${pc(there)} there; cut away on a carriageway ${pc(carriageway)} (${(carriageway / 2000).toFixed(2)} km), on a path ${pc(path)}, at a gate ${pc(gate)}; ${pc(missing.length)} neither (where a street or a path passes, and pieces under 50 cm)`);
  assert.ok(there / all >= 0.8, `only ${pc(there)} of the map's barriers there`);
  assert.ok(carriageway / all <= 0.02, `${pc(carriageway)} of the map's barriers cut on a carriageway, e.g. at ${JSON.stringify(cut.filter((_, i) => i % 50 === 0).slice(0, 8))}`);
  assert.ok(missing.length / all <= 0.03, `${missing.length} half metres missing, e.g. ${JSON.stringify(missing.slice(0, 5))}`);
});

test('every gate the map has in the area is a gate', { skip }, () => {
  const gates = w.walls.filter((x) => x.kind === 'gate' || x.kind === 'bar');
  const KIND = { gate: 'gate', swing_gate: 'gate', sliding_gate: 'gate', wicket_gate: 'gate', kissing_gate: 'gate', turnstile: 'gate', lift_gate: 'bar', chain: 'bar', rope: 'bar' };
  const nodes = readCache('osm/barriers.json').elements.filter((e) => e.type === 'node' && KIND[e.tags?.barrier] && inOpen(P(e)) && !(e.tags.level && e.tags.level !== '0'));
  const lost = nodes.filter((e) => { const [x, z] = P(e); return !gates.some((g) => { const mx = (g.pts[0][0] + g.pts[g.pts.length - 1][0]) / 2, mz = (g.pts[0][1] + g.pts[g.pts.length - 1][1]) / 2; return Math.hypot(mx - x, mz - z) < 0.3 && g.kind === KIND[e.tags.barrier]; }); });
  console.log(`the map's gates in the area: ${nodes.length}, ${nodes.length - lost.length} there`);
  // A gate the map has nowhere near a street, a path or a wall is left out (it can't say which way it lies).
  assert.ok(lost.length <= nodes.length * 0.05, `${lost.length} of ${nodes.length} gates missing, e.g. ${lost.slice(0, 5).map((e) => e.id)}`);
});

test("a retaining wall's higher ground is on its left", () => {
  // The tiles' ground every 2 m blurs a step over a few metres: looked at 2.5 m out either side.
  let up = 0, n = 0;
  for (const x of w.walls) {
    if (x.kind !== 'retaining' || x.h < 1.5) continue;
    for (let i = 1; i < x.pts.length; i++) {
      const [ax, az] = x.pts[i - 1], [bx, bz] = x.pts[i], L = Math.hypot(bx - ax, bz - az);
      if (L < 1) continue;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, lx = (bz - az) / L, lz = -(bx - ax) / L;
      n++;
      if (w.height(mx + lx * 2.5, mz + lz * 2.5) > w.height(mx - lx * 2.5, mz - lz * 2.5)) up++;
    }
  }
  console.log(`retaining walls 1.5 m or more: ${up} of ${n} stretches with the ground higher on their left`);
  assert.ok(up >= n * 0.85, `only ${up} of ${n}`);
});

// What's left in the shooter's area, and why (task 077): each [x, z] of a stretch's middle, to 0.5 m.
const LEFT = {
  retaining: [
    // The map's wall along a garden's edge at (-275, 778), measured a retaining wall: the terrain drops
    // 2.8 m into a pit 3 m wide under its line, then rises past its top. One side of the pit.
    [-275, 778.5, "one side of a pit 3 m wide the map draws a single wall along"],
  ],
  over: [],
};
test("a retaining wall's lower side is drawn under its top, and a wall stands on the land, in the shooter's area", () => {
  // On foot (Party Kart's task 073) a retaining wall is climbed where the land drawn on its lower side
  // is within a step of its top, and a wall walked under where it stands over the land. For each
  // stretch of a retaining wall 0.75 m high or more (a face a walker can't step up), the land 3 m out on
  // its lower side (the tiles' ground every 2 m ramps up to its top nearer); for each wall, hedge or
  // fence, its foot (its top less its height) against the land under it.
  const STEP = 0.3, near = (x, z, list) => list.find(([a, b, why]) => Math.hypot(a - x, b - z) < 0.5)?.[2];
  const low = [], over = [];
  let n = 0, m = 0;
  for (const x of w.walls) {
    for (let i = 1; i < x.pts.length; i++) {
      const [ax, az] = x.pts[i - 1], [bx, bz] = x.pts[i], L = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, top = (x.ys[i - 1] + x.ys[i]) / 2;
      if (L < 1 || !w.inShooter(mx, mz)) continue;
      const [nx, nz] = [-(bz - az) / L, (bx - ax) / L];
      if (x.kind === 'retaining' && x.h >= 0.75) {
        n++;
        const land = w.height(mx + nx * 3, mz + nz * 3);
        if (land > top - STEP) low.push([Math.round(mx * 2) / 2, Math.round(mz * 2) / 2, `${x.h} m high, the land ${(top - land).toFixed(2)} m under its top`]);
      } else if (x.kind === 'wall' || x.kind === 'hedge' || x.kind === 'fence') {
        m++;
        const foot = top - x.h, land = w.height(mx, mz);
        if (foot > land + 1.5) over.push([Math.round(mx * 2) / 2, Math.round(mz * 2) / 2, `${x.kind} ${x.h} m high, its foot ${(foot - land).toFixed(2)} m over the land`]);
      }
    }
  }
  console.log(`the shooter's area: ${n} stretches of retaining walls, ${low.length} with the land on their lower side within a step of their top; ${m} of walls, ${over.length} standing over the land`);
  const why = (list, left) => list.map(([x, z, what]) => `(${x}, ${z}) ${what}: ${near(x, z, left) ?? 'no cause recorded'}`);
  assert.deepEqual(why(low, LEFT.retaining).filter((s) => s.endsWith('no cause recorded')), []);
  assert.deepEqual(why(over, LEFT.over).filter((s) => s.endsWith('no cause recorded')), []);
});

test("a wall standing on a retaining wall's step is drawn to its top: the Avenida Doutor Viriato Amaral Nunes's painted wall (task 112)", () => {
  // The map's retaining wall along the avenue's north side, from (40.5, 1470.5) to (0, 1451.5): the
  // ground steps 0.7 m down behind it, and the wall on it stands 2.6 to 2.9 m over the road (the
  // point cloud, and viriato-amaral-nunes' photo), hiding the building behind it.
  const on = (x) => x.kind === 'retaining' && x.pts.some(([px, pz]) => Math.hypot(px - 20, pz - 1461) < 12);
  const it = w.walls.filter(on);
  assert.ok(it.length, 'the wall is there');
  // Its top over the road, 2 m out on the road's side (its left: the higher ground's).
  const over = [];
  for (const x of it) for (let i = 1; i < x.pts.length; i++) {
    const [ax, az] = x.pts[i - 1], [bx, bz] = x.pts[i], L = Math.hypot(bx - ax, bz - az);
    if (L < 1) continue;
    const [mx, mz] = [(ax + bx) / 2, (az + bz) / 2], [lx, lz] = [(bz - az) / L, -(bx - ax) / L];
    over.push((x.ys[i - 1] + x.ys[i]) / 2 - w.height(mx + lx * 2, mz + lz * 2));
  }
  const mid = over.sort((a, b) => a - b)[over.length >> 1];
  console.log(`the painted wall's top over the road: ${over.map((v) => v.toFixed(1)).join(', ')} m`);
  assert.ok(mid >= 2, `its top ${mid.toFixed(2)} m over the road at the median`);
});
