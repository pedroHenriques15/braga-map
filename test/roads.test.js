// The road graph a game routes on (task 107, tools/roads.mjs): every street and path in the open
// world's area from junction to junction, inside it, joined where their ends meet; the one-way streets
// the way the race (planned by the rules of the road, decision 010) drives them; and the turns the map
// bans, each at a junction of the car's stretches.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorld, map } from '../index.js';
import amigos from '../tracks/amigos.js';

const m = map();
const world = await loadWorld({ open: true });
const { roads, turns } = world;
const key = ([x, z]) => `${Math.round(x * 2)},${Math.round(z * 2)}`;
const lenOf = (r) => r.pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.pts[i - 1][0], p[1] - r.pts[i - 1][1]) : 0), 0);
const cars = roads.filter((r) => r.car);

test("the road graph: the open world's streets and paths, inside its area, from junction to junction", () => {
  assert.ok(roads.length > 5000, `${roads.length} stretches`);
  assert.ok(cars.length > 2000 && cars.filter((r) => r.oneway).length > 800, `${cars.length} for cars, ${cars.filter((r) => r.oneway).length} one-way`);
  assert.ok(roads.filter((r) => r.kind === 13).length > 100, 'the flights of steps');
  // Every point inside the area; an end can be on its edge, where a way crossing it is cut.
  const out = roads.filter((r) => r.pts.slice(1, -1).some(([x, z]) => !m.inOpen(x, z)));
  assert.equal(out.length, 0, `stretches out of the area: ${out.slice(0, 3).map((r) => r.pts[1]).join(' ')}`);
  // Most ends are junctions: where a dead end is a street's, or the edge's.
  const ends = new Map();
  for (const r of roads) for (const p of [r.pts[0], r.pts.at(-1)]) ends.set(key(p), (ends.get(key(p)) ?? 0) + 1);
  const joined = [...ends.values()].filter((n) => n > 1).length;
  assert.ok(joined > 0.6 * ends.size, `${joined} of ${ends.size} ends joined`);
  // A deck's and a tunnel's road at its height.
  for (const r of roads.filter((r) => r.level === 'bridge' || r.level === 'tunnel')) assert.equal(r.heights?.length, r.pts.length);
  assert.ok(roads.some((r) => r.name === 'Rua do Fujacal' && r.car), 'the Rua do Fujacal, named');
  // A roundabout's ring, one way round.
  const rings = roads.filter((r) => r.ring);
  assert.ok(rings.length > 20 && rings.every((r) => r.car && r.oneway), `${rings.length} stretches of roundabouts`);
});

test('a car can get from almost anywhere to anywhere: the car stretches hold together, the right way round', () => {
  const out = new Map(), inn = new Map();
  const add = (g, a, b) => (g.get(a) ?? g.set(a, []).get(a)).push(b);
  for (const r of cars) {
    const a = key(r.pts[0]), b = key(r.pts.at(-1));
    add(out, a, b);
    add(inn, b, a);
    if (!r.oneway) {
      add(out, b, a);
      add(inn, a, b);
    }
  }
  // The strongly connected parts (Kosaraju's), and the share of the car stretches' length in the biggest.
  const order = [], seen = new Set();
  for (const s of out.keys()) {
    if (seen.has(s)) continue;
    seen.add(s);
    const st = [[s, 0]];
    while (st.length) {
      const top = st[st.length - 1], next = out.get(top[0]) ?? [];
      if (top[1] < next.length) {
        const n = next[top[1]++];
        if (!seen.has(n)) {
          seen.add(n);
          st.push([n, 0]);
        }
      } else order.push(st.pop()[0]);
    }
  }
  const part = new Map();
  for (const s of order.reverse()) {
    if (part.has(s)) continue;
    part.set(s, s);
    const st = [s];
    while (st.length) for (const n of inn.get(st.pop()) ?? []) if (!part.has(n)) part.set(n, s), st.push(n);
  }
  const size = new Map();
  let all = 0;
  for (const r of cars) {
    const a = part.get(key(r.pts[0]));
    all += lenOf(r);
    if (a === part.get(key(r.pts.at(-1)))) size.set(a, (size.get(a) ?? 0) + lenOf(r));
  }
  const biggest = Math.max(...size.values());
  assert.ok(biggest > 0.85 * all, `${(biggest / 1000).toFixed(1)} of ${(all / 1000).toFixed(1)} km in one`);
});

test('the one-way streets run the way the Volta dos Amigos drives them', () => {
  // Each step of the race, on a car stretch within 4 m running its way or the other: one of them lets
  // it go its way (a two-way street, or a one-way street along it), where a road's carriageways run
  // side by side; and it's along a one-way street where that's the only one.
  const segs = [];
  for (const r of cars) for (let i = 1; i < r.pts.length; i++) segs.push({ a: r.pts[i - 1], b: r.pts[i], name: r.name, oneway: r.oneway });
  const pts = amigos.points.map(({ p }) => [p[0], p[2]]);
  const against = [];
  let along = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
    const under = [];
    for (const s of segs) {
      if (Math.max(s.a[0], s.b[0]) < mx - 4 || Math.min(s.a[0], s.b[0]) > mx + 4 || Math.max(s.a[1], s.b[1]) < mz - 4 || Math.min(s.a[1], s.b[1]) > mz + 4) continue;
      const ux = s.b[0] - s.a[0], uz = s.b[1] - s.a[1], ul = Math.hypot(ux, uz) || 1;
      const cos = (dx * ux + dz * uz) / (L * ul);
      if (Math.abs(cos) < 0.8) continue;
      const f = Math.max(0, Math.min(1, ((mx - s.a[0]) * ux + (mz - s.a[1]) * uz) / (ul * ul)));
      if (Math.hypot(s.a[0] + f * ux - mx, s.a[1] + f * uz - mz) < 4) under.push({ s, cos });
    }
    if (!under.length) continue;
    if (under.some((u) => u.s.oneway && u.cos > 0)) along++;
    if (!under.some((u) => !u.s.oneway || u.cos > 0)) against.push(`${under[0].s.name ?? '?'} (${Math.round(mx)}, ${Math.round(mz)})`);
  }
  assert.ok(along > 100, `${along} of the race's steps along one-way stretches`);
  assert.deepEqual(against, []);
});

test('the turns the map bans: each at a junction, from a car stretch arriving there to one leaving it', () => {
  assert.ok(turns.length >= 30, `${turns.length} turns banned`);
  const at = new Map();
  for (const r of cars) {
    const n = r.pts.length;
    at.set(key(r.pts[0]), [...(at.get(key(r.pts[0])) ?? []), { near: r.pts[1], arrives: !r.oneway, leaves: true }]);
    at.set(key(r.pts[n - 1]), [...(at.get(key(r.pts[n - 1])) ?? []), { near: r.pts[n - 2], arrives: true, leaves: !r.oneway }]);
  }
  for (const t of turns) {
    const here = at.get(key(t.at)) ?? [];
    assert.ok(here.length >= 2, `a turn at ${t.at}, which isn't a junction`);
    assert.ok(here.some((e) => e.arrives && key(e.near) === key(t.from)), `nothing arrives from ${t.from} at ${t.at}`);
    assert.ok(here.some((e) => e.leaves && key(e.near) === key(t.to)), `nothing leaves towards ${t.to} at ${t.at}`);
  }
});
