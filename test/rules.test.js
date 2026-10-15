// The tracks keep the rules of the road: none runs against a one-way street or round a roundabout
// the wrong way, and none leaves the streets a car may use but in a ramp's flight (decision 027). Checked from the tracks as the games read them against OpenStreetMap's streets
// as tools/fetch.mjs keeps them in .cache/osm/, not from how tools/track.mjs planned them. Skipped
// where the map wasn't fetched, as on a fresh clone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { CACHE, P, readCache } from '../tools/geo.mjs';
import { carsMay, driven } from '../tools/osm.mjs';

const tracks = await Promise.all(fs.readdirSync(new URL('../tracks/', import.meta.url)).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
const BASE = path.join(CACHE, 'osm', 'base.json');

// The stretches of a track against the traffic: each step of its layout is on the street nearest
// it that runs the same way (within 6 m), and that street's direction says whether it may.
function against(track, segs) {
  const pts = track.points.map(({ p }) => [p[0], p[2]]), out = [];
  let run = null;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    let best = null, bd = 6;
    for (const s of segs) {
      if (mx < s.x0 - 6 || mx > s.x1 + 6 || mz < s.z0 - 6 || mz > s.z1 + 6) continue;
      const ux = s.b[0] - s.a[0], uz = s.b[1] - s.a[1], ul = Math.hypot(ux, uz) || 1;
      const cos = (dx * ux + dz * uz) / (L * ul);
      if (Math.abs(cos) < 0.8) continue;
      const f = Math.max(0, Math.min(1, ((mx - s.a[0]) * ux + (mz - s.a[1]) * uz) / (ul * ul)));
      const d = Math.hypot(s.a[0] + f * ux - mx, s.a[1] + f * uz - mz);
      if (d < bd) { bd = d; best = { s, cos }; }
    }
    if (best && best.s.dir && best.cos * best.s.dir < 0) {
      if (!run) out.push((run = { street: best.s.name, at: [Math.round(mx), Math.round(mz)], m: 0 }));
      run.m += L;
    } else run = null;
  }
  return out;
}

test('no track runs against a one-way street', { skip: !fs.existsSync(BASE) && 'no .cache/osm/base.json' }, () => {
  const segs = [];
  for (const e of readCache('osm/base.json').elements) {
    const t = e.tags || {};
    if (e.type !== 'way' || !/^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street)(_link)?$/.test(t.highway || '')) continue;
    const g = e.geometry.map(P), dir = driven(t), name = t.name || t.highway;
    for (let i = 1; i < g.length; i++) {
      const a = g[i - 1], b = g[i];
      segs.push({ a, b, dir, name, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]) });
    }
  }
  for (const t of tracks) {
    // A corner rounded across a junction may graze a one-way street for a step or two.
    const wrong = against(t, segs).filter((r) => r.m > 20);
    assert.deepEqual(wrong, [], t.id);
  }
});

// Every step of a track is on a street a car may use: its middle within 10 m of one's middle (the
// line is the street's own, but rounded at its corners and folded at its jogs, task 037), but in a
// ramp's flight. The made-up road out of a dead end it once had ran 26 m from any.
test("no track leaves the streets but in a ramp's flight", { skip: !fs.existsSync(BASE) && 'no .cache/osm/base.json' }, () => {
  const segs = [];
  for (const e of readCache('osm/base.json').elements) {
    const t = e.tags || {};
    if (e.type !== 'way' || !/^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street)(_link)?$/.test(t.highway || '') || !carsMay(t)) continue;
    const g = e.geometry.map(P);
    for (let i = 1; i < g.length; i++) segs.push([g[i - 1], g[i]]);
  }
  const dist = (x, z) => {
    let d = Infinity;
    for (const [[ax, az], [bx, bz]] of segs) {
      if (Math.min(ax, bx) - 20 > x || Math.max(ax, bx) + 20 < x || Math.min(az, bz) - 20 > z || Math.max(az, bz) + 20 < z) continue;
      const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      d = Math.min(d, Math.hypot(x - ax - f * dx, z - az - f * dz));
    }
    return d;
  };
  for (const t of tracks) {
    const off = [];
    let air = false;
    t.points.forEach((q, i) => {
      if (q.air !== undefined) air = q.air;
      const r = t.points[(i + 1) % t.points.length].p, x = (q.p[0] + r[0]) / 2, z = (q.p[2] + r[2]) / 2;
      if (!air && dist(x, z) > 10) off.push([Math.round(x), Math.round(z)]);
    });
    assert.deepEqual(off, [], t.id);
    assert.equal(t.points.filter((q) => q.air).length, t.ramps.length, `${t.id}: a flight for each ramp`);
  }
});
