// The trees (task 019, tools/trees.mjs): the crowns found on a canopy made up as the LiDAR sees one (two
// crowns that touch are two trees, a broad crown's bumps one, a poplar's narrow crown its own); each
// tree's kind from what the map names, the wood it stands in and its shape; the world's trees under the
// Volta dos Amigos' box each the LiDAR's, sized and off the carriageways; and each kind's bark and leaves.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { CELL, M, W, canopyOf, crowns, kindOf, KINDS, layers, measure, mergeSlivers, mergeStemless, osmKind } from '../tools/trees.mjs';
import { loadWorld, map } from '../index.js';
import { CREDITS, TREES } from '../world/textures.js';
import amigos from '../tracks/amigos.js';

const LEVELS = ['high', 'medium', 'low'];
const KTX2 = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);

// A canopy made up as treeCells boils the point cloud down: each tree a dome over its foot, of so many
// metres across, its top at (i, j) in cells; and bumps on it.
function madeUp(trees) {
  const g = layers();
  for (const { i, j, h, r, foot, bumps = [] } of trees) {
    const R = r / CELL;
    for (let v = Math.floor(j - R); v <= Math.ceil(j + R); v++) for (let u = Math.floor(i - R); u <= Math.ceil(i + R); u++) {
      const d = Math.hypot(u - i, v - j) / R;
      if (d >= 1) continue;
      let top = foot + (h - foot) * Math.sqrt(1 - d * d);
      for (const b of bumps) top += b.h * Math.max(0, 1 - Math.hypot(u - b.i, v - b.j) / (b.r / CELL));
      const k = v * W + u, cm = Math.round(top * 100);
      if (cm <= g.top[k]) continue;
      g.top[k] = cm;
      g.low[k] = Math.round(foot * 100);
      g.n[k] = 12;
      g.nir[k] = 180; g.red[k] = 120; g.green[k] = 135; g.blue[k] = 130;
    }
  }
  const c = canopyOf(g), k = crowns(c);
  mergeSlivers(c, k);
  mergeStemless(c, k);
  return measure('-24_208', c, k);
}

test('crowns that touch are two trees, a broad crown with bumps one, a narrow one its own', () => {
  const o = M + 600;
  const found = madeUp([
    { i: o, j: o, h: 12, r: 4, foot: 3 },
    { i: o + 16, j: o, h: 10, r: 3.5, foot: 3 },
    { i: o + 200, j: o, h: 15, r: 8, foot: 4, bumps: [{ i: o + 196, j: o + 4, h: 0.5, r: 1.5 }, { i: o + 205, j: o - 5, h: 0.6, r: 1.5 }] },
    { i: o, j: o + 200, h: 18, r: 1.5, foot: 3 },
    { i: o + 200, j: o + 200, h: 2.5, r: 2, foot: 2 },
  ]).sort((a, b) => b.h - a.h);
  assert.equal(found.length, 4, found.map((t) => `${t.h.toFixed(1)} m, ${t.crown.toFixed(1)} m`).join('; '));
  const [poplar, broad, a, b] = found;
  for (const [t, h, crown] of [[poplar, 18, 3], [broad, 15, 16], [a, 12, 8], [b, 10, 7]]) {
    assert.ok(Math.abs(t.h - h) < 0.4, `${t.h} m tall, not ${h}`);
    assert.ok(Math.abs(t.crown - crown) / crown < 0.25, `${t.crown} m across, not ${crown}`);
    assert.ok(t.foot >= 2.5 && t.foot <= 4.5, `its foot at ${t.foot} m`);
  }
  assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > 7 && Math.hypot(a.x - b.x, a.z - b.z) < 9);
});

// São João da Ponte's Largo (task 063): a big tree's limb reaching out past where a bump may be, its
// leaves all high, is that tree's, its crown reaching further and its middle off its trunk; a narrow
// tree as tall beside a big one, its leaves from near the ground, is a tree of its own.
test("a limb with no trunk under it is its tree's; a narrow tree with its own trunk beside a big one stays", () => {
  const o = M + 600;
  const [big, ...rest] = madeUp([
    { i: o, j: o, h: 30, r: 10, foot: 15 },
    { i: o + 23, j: o, h: 26, r: 3, foot: 16 },
  ]);
  assert.equal(rest.length, 0, 'the limb is a tree of its own');
  assert.ok(Math.abs(big.h - 30) < 0.4 && big.crown > 20, `${big.h.toFixed(1)} m tall, ${big.crown.toFixed(1)} m across`);
  assert.ok(big.mx - big.x > 0.5, `its crown's middle ${(big.mx - big.x).toFixed(1)} m off its trunk, towards the limb`);
  const found = madeUp([
    { i: o, j: o + 200, h: 30, r: 10, foot: 15 },
    { i: o + 23, j: o + 200, h: 26, r: 3, foot: 3 },
  ]);
  assert.equal(found.length, 2, found.map((t) => `${t.h.toFixed(1)} m, ${t.crown.toFixed(1)} m`).join('; '));
});

test("a tree's kind: the map's name for it, else its wood's, else its shape's", () => {
  const [BROADLEAF, PINE, EUCALYPTUS, CONIFER, POPLAR, PALM] = KINDS.keys();
  assert.deepEqual(KINDS, ['broadleaf', 'pine', 'eucalyptus', 'conifer', 'poplar', 'palm']);
  assert.equal(osmKind({ species: 'Eucalyptus globulus' }), EUCALYPTUS);
  assert.equal(osmKind({ genus: 'Pinus' }), PINE);
  assert.equal(osmKind({ species: 'Washingtonia robusta' }), PALM);
  assert.equal(osmKind({ leaf_type: 'palm' }), PALM);
  assert.equal(osmKind({ species: 'Cupressus sempervirens' }), CONIFER);
  assert.equal(osmKind({ species: 'Quercus robur' }), BROADLEAF);
  assert.equal(osmKind({ natural: 'tree' }), -1);
  const t = (h, crown, foot, leafy, tags) => ({ h, crown, foot, colour: [180, 180 * (1 - leafy) / (1 + leafy), 130, 130], osm: tags ? { tags } : null });
  assert.equal(kindOf(t(12, 8, 4, 0.2, { leaf_type: 'needleleaved' }), -1), CONIFER);
  assert.equal(kindOf(t(18, 7, 10, 0.2, { leaf_type: 'needleleaved' }), -1), PINE);
  assert.equal(kindOf(t(12, 8, 4, 0.2), EUCALYPTUS), EUCALYPTUS);
  assert.equal(kindOf(t(12, 8, 4, 0.2, { species: 'Quercus robur' }), PINE), BROADLEAF);
  assert.equal(kindOf(t(12, 8, 4, 0.2), -1), BROADLEAF);
  assert.equal(kindOf(t(16, 4, 3, 0.2), -1), POPLAR);
  assert.equal(kindOf(t(16, 4, 3, 0.05), -1), CONIFER);
  assert.equal(kindOf(t(26, 10, 14, 0.15), -1), EUCALYPTUS);
  assert.equal(kindOf({ ...t(14, 7, 7, 0.15), colour: [140, 104, 120, 125] }, -1), PINE);
});

test("the trees under the Volta dos Amigos' box are the LiDAR's, each sized, of its kind, off the carriageways", async () => {
  const m = map(), w = await loadWorld(amigos.box);
  assert.deepEqual(m.treeKinds.map((k) => k.kind), KINDS);
  assert.ok(w.trees.length > 40000, `${w.trees.length} trees`);
  for (const t of w.trees) {
    assert.ok(KINDS.includes(t.kind), t.kind);
    assert.ok(!t.filled, `a tree filled in at (${t.x}, ${t.z})`);
    assert.ok(t.h >= 1 && t.h < 70 && t.crown > 0 && t.crown < 50, `(${t.x}, ${t.z}): ${t.h} m tall, ${t.crown} m across`);
    assert.ok(t.foot >= 0 && t.foot < t.h, `(${t.x}, ${t.z}): its crown from ${t.foot} m, ${t.h} m tall`);
    assert.ok(t.trunk >= 0.08 && t.trunk <= 1.6, `(${t.x}, ${t.z}): a trunk ${t.trunk} m thick`);
  }
  // Every kind but the palms, which only the map names, is common.
  for (const k of KINDS.slice(0, 5)) assert.ok(w.trees.filter((t) => t.kind === k).length > 100, k);
  // In the open world's area, a trunk on a carriageway as the world draws it is moved off or left out:
  // a few stay, where its half metres round it onto the edge.
  const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > z !== r[j][1] > z && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
  const o = await loadWorld({ open: true });
  const pieces = o.streets.carriageways.filter((p) => p.level === 'ground').map((p) => { const xs = p.rings[0].map((q) => q[0]), zs = p.rings[0].map((q) => q[1]); return { p, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; });
  const inside = o.trees.filter((t) => o.inOpen(t.x, t.z));
  const on = inside.filter((t) => pieces.some((q) => t.x >= q.x0 && t.x <= q.x1 && t.z >= q.z0 && t.z <= q.z1 && q.p.rings.reduce((c, r) => c !== inRing(r, t.x, t.z), false)));
  assert.ok(on.length <= inside.length / 1000, `${on.length} of ${inside.length} trees on a carriageway: ${on.slice(0, 5).map((t) => `(${t.x}, ${t.z})`).join(', ')}`);
});

// No viewpoint's camera stands within 2.5 m of a trunk, or in a crown (within its radius of its middle,
// between its foot and its top): none of their photos was taken from there (task 063). The Altice
// Forum's stands under its willow's crown, its leaves over the eye, as its photo does.
test("no viewpoint's camera stands by a trunk or in a crown", async () => {
  const { viewpoints } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
  for (const v of viewpoints) {
    const w = await loadWorld({ x0: v.x - 40, x1: v.x + 40, z0: v.z - 40, z1: v.z + 40 });
    for (const t of w.trees) {
      const d = Math.hypot(t.x - v.x, t.z - v.z), up = v.y - w.height(t.x, t.z);
      assert.ok(d >= 2.5, `${v.id}: a trunk ${d.toFixed(1)} m from its camera, at (${t.x}, ${t.z})`);
      assert.ok(Math.hypot(t.cx - v.x, t.cz - v.z) >= t.crown / 2 || up <= t.foot || up >= t.h, `${v.id}: its camera in the crown of the tree at (${t.x}, ${t.z}), ${up.toFixed(1)} m up, its leaves from ${t.foot} m`);
    }
  }
});

test("each kind of tree has its bark and its leaves at every level, credited", () => {
  const m = map();
  for (const { kind, bark, leaves } of m.treeKinds) {
    assert.ok(bark && leaves, kind);
    assert.equal(TREES[kind].bark, bark);
    assert.ok(bark.metres > 0.3 && bark.metres < 4, `${kind}: its bark ${bark.metres} m a side`);
    assert.ok(leaves.cover > 0.1 && leaves.cover < 0.8, `${kind}: its leaves cover ${leaves.cover} of the card`);
    for (const t of [bark, leaves]) {
      let last = Infinity;
      for (const l of LEVELS) {
        const f = t.files[l], b = fs.readFileSync(new URL(f.url));
        assert.ok(b.subarray(0, 12).equals(KTX2), `${t.id} ${l}: a KTX2 file`);
        assert.deepEqual([b.readUInt32LE(20), b.readUInt32LE(24), b.length], [f.w, f.h, f.bytes], `${t.id} ${l}`);
        assert.ok(f.w * f.h < last, `${t.id} ${l}`);
        last = f.w * f.h;
      }
      assert.deepEqual([t.credit.source, t.credit.licence], ['Poly Haven', 'CC0'], t.id);
      assert.ok(CREDITS.some((c) => c.source === 'Poly Haven' && t.credit.author.split(', ').every((a) => c.authors.includes(a))), t.id);
    }
  }
});
