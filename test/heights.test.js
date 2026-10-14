// The buildings' heights and roofs as DGT's LiDAR measured them (task 010): every building the LiDAR
// saw is measured in the world's tiles, as tools/roofs.mjs measured it, and agrees with the map's own
// floors where it has them; tools/heights.mjs prints the same, and the outliers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';
import { CACHE, readCache } from '../tools/geo.mjs';
import { footprints, ringArea, ringOf } from '../tools/osm.mjs';

const measured = fs.existsSync(path.join(CACHE, 'roofs.json')) && fs.existsSync(path.join(CACHE, 'osm', 'buildings.json'));
const checked = measured ? await (await import('../tools/heights.mjs')).check() : null;
const skip = !measured && "the LiDAR's roofs aren't measured (node tools/roofs.mjs)";

test('every building the LiDAR saw is measured in the tiles, and the tiles say which are guessed', { skip }, () => {
  const c = checked;
  assert.ok(c.unseen / c.buildings < 0.06, `${c.unseen} of ${c.buildings} buildings not seen`);
  // A part each, but for a few whose outline simplifies away.
  assert.ok(c.tiles.measured >= c.parts * 0.98 && c.tiles.measured <= c.parts, `${c.tiles.measured} measured in the tiles, ${c.parts} parts measured`);
  assert.ok(c.tiles.guessed < c.buildings * 0.08, `${c.tiles.guessed} guessed`);
  console.log(`${c.seen} of ${c.buildings} measured (${c.parts} parts), ${c.unseen} not seen; in the tiles ${c.tiles.measured} measured, ${c.tiles.guessed} guessed, ${c.tiles.found} found by the LiDAR, ${c.tiles.filled} filled in`);
});

test('the tiles carry each roof as it was measured', { skip }, async () => {
  const { buildings: roofs } = readCache('roofs.json');
  const m = map();
  const w = await loadWorld({ sections: m.sections.map((s) => s.id) });
  // Each measured building in the tiles by its middle (its area's), to the metre.
  const middle = (pts) => {
    let a = 0, x = 0, z = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const c = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; a += c; x += (pts[j][0] + pts[i][0]) * c; z += (pts[j][1] + pts[i][1]) * c; }
    return [x / (3 * a), z / (3 * a)];
  };
  const at = new Map();
  for (const b of w.buildings) {
    if (!b.measured) continue;
    const [x, z] = middle(b.pts), key = `${Math.round(x)},${Math.round(z)}`;
    at.set(key, [...(at.get(key) ?? []), { b, x, z }]);
  }
  const near = (x, z) => {
    let best = null;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const c of at.get(`${Math.round(x) + i},${Math.round(z) + j}`) ?? []) if (!best || Math.hypot(c.x - x, c.z - z) < Math.hypot(best.x - x, best.z - z)) best = c;
    return best && Math.hypot(best.x - x, best.z - z) < 1.5 ? best.b : null;
  };
  const ROOF = { flat: 0, hipped: 1, gabled: 2, skillion: 3 };
  let n = 0, found = 0;
  for (const e of footprints(readCache('osm/buildings.json'))) {
    const r = roofs[e.id];
    if (!r || r.cover < 0.35 || r.parts.length !== 1 || !r.parts[0].roof || e.id % 7) continue;
    const p = r.parts[0], pts = ringOf(e).slice(0, -1);
    const b = near(...middle(pts));
    n++;
    // (Not one of two outlines on the map with the same middle.)
    if (!b || Math.abs(ringArea(b.pts) - ringArea(pts)) > 0.1 * ringArea(pts)) continue;
    found++;
    assert.equal(b.roof, ROOF[p.roof], `way ${e.id}'s roof`);
    assert.ok(Math.abs(b.y + m.elev0 + b.h - Math.max(p.eaves, b.y + m.elev0 + 2.4)) < 0.15, `way ${e.id}'s eaves: ${b.y + m.elev0 + b.h}, measured ${p.eaves}`);
    if (p.roof !== 'flat') {
      // Along the walls as drawn: the outline's half metres turn a small one's sides a few degrees.
      const d = Math.atan2(Math.sin(b.dir - p.dir), Math.cos(b.dir - p.dir));
      assert.ok(Math.abs(d) < (6 * Math.PI) / 180, `way ${e.id}'s ridge runs ${((b.dir * 180) / Math.PI).toFixed(1)}°, measured ${((p.dir * 180) / Math.PI).toFixed(1)}°`);
      assert.equal(b.ends, p.ends ?? 0, `way ${e.id}'s hips`);
    }
    if (p.colour) assert.ok(Math.hypot(...b.roofColor.map((v, k) => v - p.colour[k])) < 40, `way ${e.id}'s colour ${b.roofColor}, measured ${p.colour}`);
  }
  // (Not those whose middle the simplified outline moves, nor those on the map twice.)
  assert.ok(found > n * 0.9, `${found} of ${n} found in the tiles`);
});

test("the LiDAR's heights agree with the map's floors, mostly", { skip }, () => {
  const l = checked.levels;
  assert.ok(l.storey > 2.7 && l.storey < 3.2, `a storey of ${l.storey} m`);
  assert.ok(l.within1 > 0.75, `${Math.round(l.within1 * 100)}% within a storey`);
  console.log(`${l.n} buildings with floors on the map: a storey is ${l.storey} m plus ${l.base} m, ${Math.round(l.within1 * 100)}% within one, ${l.off.length} two or more off`);
});

test("the map's outlines are on the LiDAR's buildings, within a metre and a half mostly", { skip }, () => {
  assert.ok(checked.shifts.p90 < 1.5, `9 in 10 under ${checked.shifts.p90} m`);
});
