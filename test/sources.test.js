// DGT's open data as tools/fetch.mjs keeps it in .cache/dgt/ and tools/dgt.mjs reads it, in the right
// place on the map. Each test is skipped where its data wasn't fetched (`node tools/fetch.mjs ortho
// lidar`), as on a fresh clone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import jpeg from 'jpeg-js';
import { CLASS, DGT, heights, ortho, points, tileKey, toTM } from '../tools/dgt.mjs';

const CHECK = path.join(DGT, 'ortho', 'check-4326');
const PRACA = tileKey(...toTM(0, 0));
const has = (...files) => files.every((f) => fs.existsSync(f));
const gray = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// The reference: a picture of the 80 m round the Praça da República, in latitude and longitude,
// which DGT's own server projected (fetch.mjs). A grid in latitude and longitude is a grid in the
// map's metres, so its middle is where DGT puts the map's (0, 0), whatever tools/dgt.mjs does.
function reference(cell) {
  const { size, px } = JSON.parse(fs.readFileSync(CHECK + '.json', 'utf8'));
  const img = jpeg.decode(fs.readFileSync(CHECK + '.jpg'), { formatAsRGBA: false });
  const k = Math.round(cell / (size / px)), n = px / k, out = new Float64Array(n * n);
  for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) {
    const p = (j * px + i) * 3;
    out[Math.floor(j / k) * n + Math.floor(i / k)] += gray(img.data[p], img.data[p + 1], img.data[p + 2]) / (k * k);
  }
  return { n, size, ref: out };
}

// Where the source shows what the reference shows at (0, 0): the shift in metres at which the two
// grids, `cell` metres a side, best match (normalised cross-correlation, refined to a fraction of a
// cell). The source grid is `pad` cells wider each side than the reference; NaN where it's empty.
// keep(a, b) leaves out pairs of cells that shouldn't count.
function bestShift(ref, n, src, pad, cell, keep = () => true) {
  const m = n + 2 * pad, score = new Map();
  let best = { s: -Infinity, di: 0, dj: 0 };
  for (let dj = -pad; dj <= pad; dj++) for (let di = -pad; di <= pad; di++) {
    let k = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = ref[j * n + i], b = src[(j + pad + dj) * m + i + pad + di];
      if (Number.isNaN(a) || Number.isNaN(b) || !keep(a, b)) continue;
      k++, sa += a, sb += b, saa += a * a, sbb += b * b, sab += a * b;
    }
    const s = (sab - (sa * sb) / k) / Math.sqrt((saa - (sa * sa) / k) * (sbb - (sb * sb) / k));
    score.set(`${di},${dj}`, s);
    if (s > best.s) best = { s, di, dj };
  }
  const at = (di, dj) => score.get(`${di},${dj}`);
  const peak = (l, c, r) => (l === undefined || r === undefined ? 0 : (l - r) / (2 * (l - 2 * c + r)));
  return {
    dx: (best.di + peak(at(best.di - 1, best.dj), best.s, at(best.di + 1, best.dj))) * cell,
    dz: (best.dj + peak(at(best.di, best.dj - 1), best.s, at(best.di, best.dj + 1))) * cell,
    score: best.s,
  };
}

// The value a fraction f of the way up a grid's values, leaving out the empty cells.
const quantile = (g, f) => { const v = g.filter((x) => !Number.isNaN(x)).sort(); return v[Math.floor(v.length * f)]; };

// A grid round (0, 0), `pad` cells wider each side than the reference's: f(x, z) at each cell's
// centre.
function sampled(n, size, pad, cell, f) {
  const m = n + 2 * pad, out = new Float64Array(m * m), x0 = -size / 2 - pad * cell;
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) out[j * m + i] = f(x0 + (i + 0.5) * cell, x0 + (j + 0.5) * cell);
  return out;
}

test('the Praça da República lands at (0, 0) within 1 m in the orthophoto', { skip: !has(CHECK + '.jpg', path.join(DGT, 'ortho', PRACA + '.jpg')) && 'no orthophoto in .cache/dgt' }, async () => {
  const cell = 0.25, pad = 12, { n, size, ref } = reference(cell);
  const at = await ortho({ x0: -size, x1: size, z0: -size, z1: size });
  const src = sampled(n, size, pad, cell, (x, z) => { const c = at(x, z); return c ? gray(...c) : NaN; });
  const { dx, dz, score } = bestShift(ref, n, src, pad, cell);
  assert.ok(score > 0.8, `the orthophoto and DGT's own cut don't look alike (${score.toFixed(2)})`);
  assert.ok(Math.hypot(dx, dz) < 1, `the Praça is at (${dx.toFixed(2)}, ${dz.toFixed(2)}) in the orthophoto`);
});

// The point cloud's own colours, of the ground, give where it puts the Praça; the surface and
// terrain models are then checked against the points. The points were coloured from photos taken
// at another time of day than the orthophoto, so the shadows differ (the street south of the
// gardens is in shade in one and sunlit in the other): the darkest quarter of each is left out.
test('the Praça da República lands at (0, 0) within 1 m in the LiDAR', { skip: !has(CHECK + '.jpg', ...['LAZ/' + PRACA + '.laz', 'MDS-50cm/' + PRACA + '.tif', 'MDT-50cm/' + PRACA + '.tif'].map((f) => path.join(DGT, f))) && 'no LiDAR in .cache/dgt' }, async () => {
  const cell = 0.5, pad = 6, { n, size, ref } = reference(cell);
  const m = n + 2 * pad, edge = -size / 2 - pad * cell;
  const lum = new Float64Array(m * m), count = new Float64Array(m * m), top = new Float64Array(m * m).fill(-Infinity);
  const ground = new Float64Array(m * m), groundN = new Float64Array(m * m);
  await points(PRACA, (p) => {
    const i = Math.floor((p.x - edge) / cell), j = Math.floor((p.z - edge) / cell);
    if (i < 0 || j < 0 || i >= m || j >= m || p.cls === CLASS.noise) return;
    const k = j * m + i;
    top[k] = Math.max(top[k], p.y);
    if (p.cls !== CLASS.ground) return;
    lum[k] += gray(p.r, p.g, p.b), count[k]++;
    ground[k] += p.y, groundN[k]++;
  });
  const colour = lum.map((v, k) => (count[k] ? v / count[k] : NaN));
  const refDark = quantile(ref, 0.25), lazDark = quantile(colour, 0.25);
  const laz = bestShift(ref, n, colour, pad, cell, (a, b) => a > refDark && b > lazDark);
  assert.ok(laz.score > 0.6, `the point cloud's colours and DGT's cut don't look alike (${laz.score.toFixed(2)})`);
  assert.ok(Math.hypot(laz.dx, laz.dz) < 1, `the Praça is at (${laz.dx.toFixed(2)}, ${laz.dz.toFixed(2)}) in the point cloud`);

  // The surface model against the highest point in each cell, and the terrain model against the
  // ground's points.
  const box = { x0: -size, x1: size, z0: -size, z1: size }, mds = await heights('mds', box), mdt = await heights('mdt', box);
  const tops = top.map((v) => (v === -Infinity ? NaN : v)), inner = n - 2 * pad;
  const cut = (g) => { const out = new Float64Array(inner * inner); for (let j = 0; j < inner; j++) for (let i = 0; i < inner; i++) out[j * inner + i] = g[(j + 2 * pad) * m + i + 2 * pad]; return out; };
  const surf = bestShift(cut(tops), inner, sampled(inner, inner * cell, pad, cell, (x, z) => mds(x, z) ?? NaN), pad, cell);
  assert.ok(Math.hypot(surf.dx, surf.dz) < 1, `the surface model is (${surf.dx.toFixed(2)}, ${surf.dz.toFixed(2)}) off the points`);
  let off = 0, k = 0;
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const q = j * m + i, h = groundN[q] ? mdt(edge + (i + 0.5) * cell, edge + (j + 0.5) * cell) : null;
    if (h !== null) off += Math.abs(h - ground[q] / groundN[q]), k++;
  }
  assert.ok(k > 1000 && off / k < 0.3, `the terrain model is ${(off / k).toFixed(2)} m from the ground's points on average`);
});
