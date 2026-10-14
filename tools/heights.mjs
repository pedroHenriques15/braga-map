// Checks the buildings as DGT's LiDAR measured them (task 010, tools/roofs.mjs) against what
// OpenStreetMap says of them: their `height` (to the top of the roof), their `building:levels`
// (the storeys, from which a storey's height is fitted), `roof:shape` and `roof:colour`; how far the
// map's outlines sit from the LiDAR's buildings; and how many buildings the LiDAR didn't see, and the
// world's tiles therefore guess. Where they differ by much, the map is more often wrong than the
// LiDAR (a tag for one part of a building, a floor count from before it was built up): the world
// keeps the LiDAR's.
//
// node tools/heights.mjs
//
// It needs .cache/roofs.json (node tools/roofs.mjs) and the world built from it (npm run world).
// test/heights.test.js asserts what it prints. Buildings within 40 m of the private waypoints
// (.cache/places.json) are left out of the lists it prints.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadWorld, map } from '../index.js';
import { CACHE, readCache } from './geo.mjs';
import { footprints, ringArea, ringOf } from './osm.mjs';
import { EXT } from './sections.mjs';

const quantile = (vals, f) => { if (!vals.length) return NaN; const s = Float64Array.from(vals).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round(f * (s.length - 1))))]; };
const r1 = (v) => Math.round(v * 10) / 10;

export async function check() {
  const { buildings: roofs, shifts } = readCache('roofs.json');
  const places = fs.existsSync(path.join(CACHE, 'places.json')) ? readCache('places.json').places : [];
  const nearPlace = (x, z) => places.some((p) => Math.hypot(p.x - x, p.z - z) < 40);
  const all = [];
  for (const e of footprints(readCache('osm/buildings.json'))) {
    const pts = ringOf(e);
    if (pts.length < 4 || ringArea(pts) < 12) continue;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    if (cx < EXT.x0 || cx > EXT.x1 || cz < EXT.z0 || cz > EXT.z1) continue;
    const m = roofs[e.id], seen = m && m.cover >= 0.35 && m.parts.some((p) => p.roof);
    // Its main part: the biggest the LiDAR saw. (The map's floors agree with it more often than
    // with the tallest.)
    const main = seen ? m.parts.filter((p) => p.roof).sort((a, b) => (b.pts ? ringArea(b.pts) : Infinity) - (a.pts ? ringArea(a.pts) : Infinity))[0] : null;
    all.push({ id: e.id, t: e.tags, x: cx, z: cz, seen, m, main, private: nearPlace(cx, cz) });
  }
  const seen = all.filter((b) => b.seen);

  // `height`: the top of the roof, from the ground, against the ridge over the ground under it.
  const heights = seen.filter((b) => Number(b.t.height) > 0).map((b) => {
    const top = Math.max(...b.m.parts.filter((p) => p.roof).map((p) => p.ridge)) - b.main.ground;
    return { id: b.id, osm: Number(b.t.height), lidar: r1(top), diff: r1(top - Number(b.t.height)), private: b.private };
  });

  // `building:levels`: the storeys up to the eaves. A storey's height and what a building has
  // besides (the ground floor's extra, the slab on top), fitted by least squares, the worst tenth
  // left out and fitted again.
  // (A part on another, `building:min_level`, counts the storeys under it too.)
  const lv = seen.filter((b) => Number.isInteger(Number(b.t['building:levels'])) && Number(b.t['building:levels']) > 0).map((b) => ({ id: b.id, levels: Number(b.t['building:levels']) + (Number(b.t['building:min_level']) || 0), eaves: b.main.eaves - b.main.ground, private: b.private }));
  const fit = (rows) => {
    const n = rows.length, mx = rows.reduce((s, r) => s + r.levels, 0) / n, my = rows.reduce((s, r) => s + r.eaves, 0) / n;
    let sxy = 0, sxx = 0;
    for (const r of rows) { sxy += (r.levels - mx) * (r.eaves - my); sxx += (r.levels - mx) ** 2; }
    const storey = sxy / sxx;
    return { storey, base: my - storey * mx };
  };
  let f = fit(lv);
  const res = (r) => Math.abs(r.eaves - (f.base + f.storey * r.levels));
  const cutoff = quantile(lv.map(res), 0.9);
  f = fit(lv.filter((r) => res(r) <= cutoff));
  for (const r of lv) r.lidarLevels = r1((r.eaves - f.base) / f.storey);
  const off = lv.filter((r) => Math.abs(r.lidarLevels - r.levels) >= 2).sort((a, b) => Math.abs(b.lidarLevels - b.levels) - Math.abs(a.lidarLevels - a.levels));
  const within1 = lv.filter((r) => Math.abs(r.lidarLevels - r.levels) < 1).length / lv.length;

  // `roof:shape`, against the main part's.
  const SAME = { flat: ['flat'], gabled: ['gabled'], hipped: ['hipped'], pyramidal: ['hipped'], side_hipped: ['hipped'], skillion: ['skillion'] };
  const shapes = {};
  let agree = 0, tagged = 0;
  for (const b of seen) {
    const s = b.t['roof:shape'];
    if (!s) continue;
    const k = `${s} → ${b.main.roof}`;
    shapes[k] = (shapes[k] ?? 0) + 1;
    if (SAME[s]) { tagged++; if (SAME[s].includes(b.main.roof)) agree++; }
  }

  // `roof:colour`: both as tiles' terracotta or a grey, as world.mjs tells them apart.
  const NAMED = { gray: [128, 128, 128], grey: [128, 128, 128], silver: [192, 192, 192], white: [240, 240, 240] };
  const parse = (v) => { const h = v.trim().toLowerCase().replace(/^#/, ''); return /^[0-9a-f]{6}$/.test(h) ? [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16)) : NAMED[v.trim().toLowerCase()] ?? null; };
  const terracotta = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return r === mx && mx - mn > 0.15 * mx && r - b > 20; };
  let cAgree = 0, cTagged = 0;
  for (const b of seen) {
    const c = b.t['roof:colour'] && parse(b.t['roof:colour']);
    if (!c || !b.main.colour) continue;
    cTagged++;
    if (terracotta(c) === terracotta(b.main.colour)) cAgree++;
  }

  // The world's tiles: the map's buildings measured (a part each) and guessed, those it lacks that
  // the LiDAR found (task 011), and those filled in.
  const w = await loadWorld({ sections: map().sections.map((s) => s.id) });
  const tiles = { measured: 0, guessed: 0, found: 0, filled: 0 };
  for (const b of w.buildings) tiles[b.source === 'invented' ? 'filled' : b.source !== 'osm' ? 'found' : b.measured ? 'measured' : 'guessed']++;
  const parts = seen.reduce((s, b) => s + b.m.parts.length, 0);

  const moved = Object.values(shifts).map(([dx, dz]) => Math.hypot(dx, dz));
  return {
    buildings: all.length,
    seen: seen.length,
    unseen: all.filter((b) => !b.seen).length,
    parts,
    split: seen.filter((b) => b.m.parts.length > 1).length,
    roofs: Object.fromEntries(['flat', 'gabled', 'hipped', 'skillion'].map((k) => [k, seen.filter((b) => b.main.roof === k).length])),
    tiles,
    shifts: { squares: moved.length, median: r1(quantile(moved, 0.5)), p90: r1(quantile(moved, 0.9)), max: r1(Math.max(...moved)) },
    heights,
    levels: { n: lv.length, storey: Math.round(f.storey * 100) / 100, base: Math.round(f.base * 100) / 100, within1, off },
    shapes: { tagged, agree, matrix: shapes },
    colours: { tagged: cTagged, agree: cAgree },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = await check();
  const pub = (list) => list.filter((r) => !r.private);
  console.log(`The map's buildings: ${c.buildings}. Measured by the LiDAR: ${c.seen} (${c.parts} parts, ${c.split} split where the roof steps or turns); not seen: ${c.unseen}.`);
  console.log(`Their roofs (the main part): ${Object.entries(c.roofs).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  console.log(`In the world's tiles: ${c.tiles.measured} measured, ${c.tiles.guessed} guessed, ${c.tiles.found} the map lacks, found by the LiDAR, ${c.tiles.filled} filled in.`);
  console.log(`The map's outlines against the LiDAR's buildings, in ${c.shifts.squares} squares of 250 m: off by ${c.shifts.median} m (median), under ${c.shifts.p90} m in 9 of 10, ${c.shifts.max} m at most.`);
  console.log(`\nheight (${c.heights.length} tagged): the LiDAR's top less the map's, median ${r1(quantile(c.heights.map((h) => h.diff), 0.5))} m; within 2 m: ${c.heights.filter((h) => Math.abs(h.diff) <= 2).length}.`);
  for (const h of pub(c.heights).filter((h) => Math.abs(h.diff) > 3).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))) console.log(`  way ${h.id}: the map ${h.osm} m, the LiDAR ${h.lidar} m`);
  console.log(`\nbuilding:levels (${c.levels.n} tagged): a storey is ${c.levels.storey} m, plus ${c.levels.base} m; the LiDAR's eaves give the map's count within one storey for ${Math.round(c.levels.within1 * 100)}%, two or more off for ${c.levels.off.length}. The worst:`);
  for (const r of pub(c.levels.off).slice(0, 25)) console.log(`  way ${r.id}: the map ${r.levels}, the LiDAR ${r.lidarLevels} (eaves ${r1(r.eaves)} m)`);
  console.log(`\nroof:shape (${c.shapes.tagged} tagged): the same as the LiDAR's for ${c.shapes.agree}. ${Object.entries(c.shapes.matrix).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  console.log(`roof:colour (${c.colours.tagged} tagged): terracotta or grey as the orthophoto has it for ${c.colours.agree}.`);
}
