// The world's textures (task 082): none is a photograph. Every one refs/textures.json asks for is made
// by a generator of tools/made.mjs, matched to its references, at every graphics level as KTX2, and
// world/textures/ holds those and nothing else; the generators are seamless and the same from a seed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { cells, fbm, GENERATORS, make, match, measure } from '../tools/made.mjs';
import { map } from '../index.js';
import { SURFACES, TREES } from '../world/textures.js';

const { textures } = JSON.parse(fs.readFileSync(new URL('../refs/textures.json', import.meta.url), 'utf8'));
const LEVELS = ['high', 'medium', 'low'];
const KTX2 = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);
const index = [...Object.values(SURFACES), ...Object.values(TREES).flatMap((t) => [t.bark, t.leaves])];

test('no texture is made from a photograph: each recipe names a generator, and its references only measure', () => {
  for (const t of textures) {
    assert.ok(['surface', 'bark', 'leaves'].includes(t.kind), `${t.id}: a ${t.kind} (a facade or the orthophoto would be a photo)`);
    // What a photo texture's recipe had: a photo, a Poly Haven asset, a quad of a photo, a wall, a tile.
    for (const k of ['photo', 'asset', 'diff', 'alpha', 'quad', 'wall', 'tile']) assert.ok(!(k in t), `${t.id}: ${k}`);
    assert.ok(GENERATORS[t.kind === 'surface' ? 'ground' : t.kind].includes(t.generator), `${t.id}: ${t.generator}`);
    assert.ok(t.ref && (t.ref.photo || t.ref.polyhaven), `${t.id}: what it's matched to`);
    assert.equal(t.match.mean.length, 3, t.id);
    assert.ok(t.match.contrast > 0, t.id);
  }
});

// Ultra's files (task 085), by what each kind of texture has.
const ULTRA = { surface: ['ultra', 'ultra-normal'], bark: ['ultra', 'ultra-normal', 'ultra-rough'], leaves: ['ultra'] };
// A KTX2 file's supercompression (1 Basis's ETC1S, 2 Zstandard's, as UASTC is here) and its transfer
// function (2 sRGB, 1 linear), off its header and its data format descriptor.
const ktx2Of = (b) => ({ scheme: b.readUInt32LE(44), transfer: b[b.readUInt32LE(48) + 14] });

test('world/textures/ holds what the recipes make, at every level, and nothing else', () => {
  const want = new Set(textures.flatMap((t) => [...LEVELS, ...ULTRA[t.kind]].map((l) => `${t.kind === 'surface' ? 'surfaces' : 'trees'}/${t.id}-${l}.ktx2`)));
  const dir = new URL('../world/textures/', import.meta.url);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['surfaces', 'trees']);
  const has = ['surfaces', 'trees'].flatMap((d) => fs.readdirSync(new URL(d + '/', dir)).map((f) => `${d}/${f}`));
  assert.deepEqual(has.sort(), [...want].sort());
  assert.deepEqual(index.map((t) => t.id).sort(), textures.map((t) => t.id).sort());
  for (const t of index) {
    const r = textures.find((q) => q.id === t.id);
    assert.equal(t.made.generator, r.generator, t.id);
    assert.deepEqual(t.made.match, r.match, t.id);
    let last = Infinity;
    for (const l of LEVELS) {
      const f = t.files[l], b = fs.readFileSync(new URL(f.url));
      assert.ok(b.subarray(0, 12).equals(KTX2), `${t.id} ${l}: a KTX2 file`);
      assert.deepEqual([b.readUInt32LE(20), b.readUInt32LE(24), b.length], [f.w, f.h, f.bytes], `${t.id} ${l}`);
      assert.ok(f.w % 4 === 0 && f.h % 4 === 0 && f.w * f.h < last, `${t.id} ${l}: ${f.w} × ${f.h}`);
      assert.deepEqual(ktx2Of(b), { scheme: 1, transfer: 2 }, `${t.id} ${l}: ETC1S, sRGB`);
      last = f.w * f.h;
    }
    // Ultra's: twice High's size, ETC1S as the others; its relief at that size, UASTC, linear; a bark's
    // roughness at half, linear; nothing else.
    const u = t.ultra, high = t.files.high, kind = r.kind;
    assert.deepEqual(Object.keys(u), ['colour', 'normal', 'roughness'].slice(0, ULTRA[kind].length), t.id);
    const is = { colour: [2, { scheme: 1, transfer: 2 }], normal: [2, { scheme: 2, transfer: 1 }], roughness: [1, { scheme: 1, transfer: 1 }] };
    for (const [k, f] of Object.entries(u)) {
      const b = fs.readFileSync(new URL(f.url));
      assert.ok(b.subarray(0, 12).equals(KTX2), `${t.id} ultra ${k}: a KTX2 file`);
      assert.deepEqual([b.readUInt32LE(20), b.readUInt32LE(24), b.length], [f.w, f.h, f.bytes], `${t.id} ultra ${k}`);
      assert.deepEqual([f.w, f.h], [high.w * is[k][0], high.h * is[k][0]], `${t.id} ultra ${k}: ${f.w} × ${f.h}`);
      assert.deepEqual(ktx2Of(b), is[k][1], `${t.id} ultra ${k}`);
    }
    if (kind === 'surface') assert.ok(t.roughness > 0.3 && t.roughness <= 1, `${t.id}: roughness ${t.roughness}`);
  }
  // No photographer to credit.
  assert.deepEqual(map().photoCredits, []);
});

test('a generator wraps both ways, and makes the same texture from the same seed', () => {
  // The noise and the cells are the same a whole period on.
  const f = fbm(3, 4, 2, 4), c = cells(5, 6, 3);
  for (const [u, v] of [[0.1, 0.2], [0.73, 0.05], [0.999, 0.5]]) {
    assert.ok(Math.abs(f(u, v) - f(u + 1, v)) < 1e-9 && Math.abs(f(u, v) - f(u, v + 1)) < 1e-9);
    const a = c(u, v).f1;
    assert.ok(Math.abs(a - c(u + 1, v + 1).f1) < 1e-9);
  }
  // A texture's opposite edges are as alike as its neighbouring rows and columns are.
  const n = 128;
  for (const t of textures.filter((t) => t.kind !== 'leaves')) {
    const d = make(t.kind, t.generator, n, { metres: t.metres, ...t.params }, 11);
    assert.ok(d.equals(make(t.kind, t.generator, n, { metres: t.metres, ...t.params }, 11)), `${t.id}: the same from a seed`);
    const diff = (a, b) => { let s = 0; for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) s += Math.abs(d[a(k) * 3 + c] - d[b(k) * 3 + c]); return s / n; };
    const seam = (diff((k) => k * n + n - 1, (k) => k * n) + diff((k) => (n - 1) * n + k, (k) => k)) / 2;
    let inside = 0;
    for (let i = 0; i + 1 < n; i++) inside += (diff((k) => k * n + i, (k) => k * n + i + 1) + diff((k) => i * n + k, (k) => (i + 1) * n + k)) / 2 / (n - 1);
    assert.ok(seam < inside * 2.5 + 6, `${t.id}: ${seam.toFixed(1)} across its seams, ${inside.toFixed(1)} inside it`);
  }
});

test('a texture matched to its references measures as they do', () => {
  const t = textures.find((q) => q.id === 'surface-setts');
  const d = make('surface', t.generator, 256, { metres: t.metres, ...t.params }, 1);
  const got = match(d, 3, t.match);
  assert.ok(got.mean.every((v, c) => Math.abs(v - t.match.mean[c]) <= 2), JSON.stringify(got));
  assert.ok(Math.abs(got.contrast - t.match.contrast) < 1, JSON.stringify(got));
  assert.deepEqual(measure(Buffer.from([10, 20, 30, 0, 200, 200, 200, 255]), 4), { mean: [200, 200, 200], contrast: 0 });
});
