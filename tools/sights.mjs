// What the sights are, measured where the map alone can't say (task 021): the Estádio 1.º de Maio's
// stands and floodlights, and the route's chapels' and shrines' tops (task 056), from DGT's 2025 point
// cloud. world.mjs puts them on their sights.
//
// node tools/sights.mjs     after fetch.mjs (lidar), before world.mjs (two minutes)
//
// - The stands: the stadium is a bowl of terraces round an athletics track, roofed over its main
//   stand on the west and walled outside. Each is measured along spokes out from the track, square
//   to its oval every 2 m round it: the highest point that isn't vegetation or noise within half a
//   metre or so, every metre out, from where the terraces leave the track to where the outer wall
//   drops to the ground outside. The track's oval is the standard one, its straights 84.39 m long
//   (two bends of 36.5 m round their centres, on the pitch's long axis).
// - The floodlights: the masts round the pitch, each the points over 25 m above it (unclassified,
//   the LiDAR's for what it doesn't know), gathered within 3 m.
//
// - The route's chapels and wayside shrines (task 056): each one's top, its bell gable's or its
//   cross's, and the ground round it.
//
// .cache/sights.json: { stadium: { S, R0, dr, spokes: [{ from, h }], lights: [[x, z, top]] }, small:
// { <id>: { top, ground } } }, the spokes' heights in metres above ELEV0, from the `from`th metre
// out, and the chapels' and shrines' too.
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, ELEV0, P, readCache } from './geo.mjs';
import { CLASS, points, tilesOver } from './dgt.mjs';
import { inside, minRect, ringOf, segDist } from './osm.mjs';

const base = readCache('osm/base.json').elements;
const find = (id) => base.find((e) => e.type === 'way' && e.id === id && e.geometry);
const pitch = find(22660434), bowl = find(22660087);
if (!pitch || !bowl) throw new Error("no Estádio 1.º de Maio in .cache/osm/base.json: its pitch (way 22660434) and outline (way 22660087)");
// The route's chapels and shrines, by their ways in OpenStreetMap (world.mjs names them the same).
const SMALL = { 'santa-justa': 383764627, 'santo-adriao': 159203541, 'santa-tecla': 234261710, bonfim: 407006302, 'boa-morte': 383792816 };

// The pitch's frame, as world.mjs takes it: its middle, its long axis, and s along it, t across.
const r = minRect(ringOf(pitch));
const ax = [Math.cos(r.angle), Math.sin(r.angle)], ac = [-Math.sin(r.angle), Math.cos(r.angle)];
const toMap = (s, t) => [r.x + ax[0] * s + ac[0] * t, r.z + ax[1] * s + ac[1] * t];
// Every spoke starts inside the track (38 m round its bends' centres) and runs 52 m out.
const S = 42.2, R0 = 38, DR = 1, M = 52, STEP = 2;
const outline = ringOf(bowl);
// Within m of the stadium's outline, or in it.
const within = (x, z, m) => inside(outline, x, z) || outline.some(([ax, az], k) => segDist(x, z, { x: ax, z: az }, { x: outline[(k + 1) % outline.length][0], z: outline[(k + 1) % outline.length][1] }) < m);

// The highest point that isn't vegetation or noise, and the lowest ground point, in each 50 cm cell
// round the stadium.
const G = 0.5, box = { x0: r.x - 140, x1: r.x + 140, z0: r.z - 140, z1: r.z + 140 };
const nx = Math.round((box.x1 - box.x0) / G), nz = Math.round((box.z1 - box.z0) / G);
const hi = new Float32Array(nx * nz).fill(-Infinity);
const VEGETATION = [CLASS.lowVegetation, CLASS.mediumVegetation, CLASS.highVegetation, CLASS.noise];
const masts = [];
for (const key of tilesOver(box)) {
  await points(key, (p) => {
    if (VEGETATION.includes(p.cls)) return;
    // The floodlights' masts, by themselves: not the stands.
    if (p.cls === CLASS.unclassified && p.y - ELEV0 > 45) return void masts.push([p.x, p.z, p.y - ELEV0]);
    const i = Math.floor((p.x - box.x0) / G), j = Math.floor((p.z - box.z0) / G);
    if (i < 0 || j < 0 || i >= nx || j >= nz) return;
    const k = j * nx + i;
    if (p.y > hi[k]) hi[k] = p.y;
  });
}
const pitchY = (() => {
  // The pitch's level: the middle of what's measured on it.
  const ys = [];
  for (let s = -40; s <= 40; s += 4) for (let t = -25; t <= 25; t += 5) { const [x, z] = toMap(s, t), v = cell(x, z); if (Number.isFinite(v)) ys.push(v); }
  return ys.sort((a, b) => a - b)[ys.length >> 1];
})();
function cell(x, z, n = 1) {
  const i0 = Math.floor((x - box.x0) / G), j0 = Math.floor((z - box.z0) / G);
  let m = -Infinity;
  for (let j = j0 - n; j <= j0 + n; j++) for (let i = i0 - n; i <= i0 + n; i++) if (i >= 0 && j >= 0 && i < nx && j < nz) m = Math.max(m, hi[j * nx + i]);
  return m - ELEV0;
}

// The spokes, round the oval from the middle of its +s end, the way its long axis turns to t.
const per = 4 * S + 2 * Math.PI * R0, n = Math.round(per / STEP), arc = Math.PI * R0;
const raw = [];
for (let q = 0; q < n; q++) {
  let d = (q / n) * per, s, t, ns, nt;
  if (d < arc) { const th = -Math.PI / 2 + d / R0; [s, t, ns, nt] = [S + R0 * Math.cos(th), R0 * Math.sin(th), Math.cos(th), Math.sin(th)]; }
  else if ((d -= arc) < 2 * S) [s, t, ns, nt] = [S - d, R0, 0, 1];
  else if ((d -= 2 * S) < arc) { const th = Math.PI / 2 + d / R0; [s, t, ns, nt] = [-S + R0 * Math.cos(th), R0 * Math.sin(th), Math.cos(th), Math.sin(th)]; }
  else [s, t, ns, nt] = [-S + (d - arc), -R0, 0, -1];
  const hs = [];
  for (let j = 0; j < M; j++) {
    const [x, z] = toMap(s + ns * j * DR, t + nt * j * DR);
    hs.push(within(x, z, 3) ? cell(x, z) : -Infinity);
  }
  // Without what stands up from them alone (a mast's foot, a lamp): a metre over both its neighbours.
  for (let j = 1; j < M - 1; j++) if (hs[j] > Math.max(hs[j - 1], hs[j + 1]) + 1) hs[j] = Math.max(hs[j - 1], hs[j + 1]);
  // To where it drops to the ground outside (3 m under the highest so far, or out of the stadium's
  // outline), from where it leaves the track: back from its top, while it's half a metre over the
  // lowest of the track before it (a hurdle or a bench on the track is left there).
  let top = -Infinity, to = -1, at = -1;
  for (let j = 0; j < M; j++) {
    if (!Number.isFinite(hs[j]) || hs[j] < top - 3) break;
    if (hs[j] > top) [top, at] = [hs[j], j];
    to = j;
  }
  const track = Math.min(...hs.slice(0, at + 1)) + 0.5;
  let from = at;
  while (from > 0 && hs[from - 1] > track) from--;
  raw.push(at < 0 || top < pitchY + 1 ? null : { hs, from, to });
}
// Each foot the middle of the five round it, as the terraces' first step runs round the track.
const spokes = raw.map((q, i) => {
  if (!q) return { from: 0, h: [] };
  const near = [-2, -1, 0, 1, 2].map((k) => raw[(i + k + n) % n]?.from).filter((v) => v != null).sort((a, b) => a - b);
  const from = Math.min(q.to, near[near.length >> 1]);
  return { from, h: q.hs.slice(from, q.to + 1).map((v) => Math.round(v * 10) / 10) };
});

// The masts: the points over 25 m above the pitch, gathered within 3 m, each at its middle and its top.
const lights = [];
for (const [x, z, y] of masts) {
  if (y < pitchY + 25 || !within(x, z, 30)) continue;
  let m = lights.find((q) => Math.hypot(q.x - x, q.z - z) < 3);
  if (!m) lights.push((m = { x: 0, z: 0, n: 0, top: 0 }));
  m.x = (m.x * m.n + x) / (m.n + 1);
  m.z = (m.z * m.n + z) / (m.n + 1);
  m.n++;
  m.top = Math.max(m.top, y);
}
const kept = lights.filter((m) => m.n >= 10).map((m) => [Math.round(m.x * 10) / 10, Math.round(m.z * 10) / 10, Math.round(m.top * 10) / 10]);

// The route's chapels and wayside shrines (task 056): over each one's outline, or within a metre of
// it (a bell gable on its corner, the cross on its gable), the highest point that isn't vegetation or
// noise; and the ground round it, the lowest ground point within 2 m of it. Both above ELEV0. The
// shrines are too small for tools/roofs.mjs to have measured. Under a tree's crown the LiDAR may
// take a roof for its leaves: then the top is null.
const buildings = readCache('osm/buildings.json').elements;
const small = {};
for (const [id, way] of Object.entries(SMALL)) {
  const e = buildings.find((q) => q.type === 'way' && q.id === way && q.geometry);
  if (!e) throw new Error(`no way/${way} (${id}) in .cache/osm/buildings.json`);
  const ring = ringOf(e).slice(0, -1);
  const near = (x, z, m) => inside(ring, x, z) || ring.some(([ax, az], k) => segDist(x, z, { x: ax, z: az }, { x: ring[(k + 1) % ring.length][0], z: ring[(k + 1) % ring.length][1] }) < m);
  const b = { x0: Math.min(...ring.map((p) => p[0])) - 3, x1: Math.max(...ring.map((p) => p[0])) + 3, z0: Math.min(...ring.map((p) => p[1])) - 3, z1: Math.max(...ring.map((p) => p[1])) + 3 };
  let top = -Infinity, ground = Infinity;
  for (const key of tilesOver(b)) {
    await points(key, (p) => {
      if (p.x < b.x0 || p.x > b.x1 || p.z < b.z0 || p.z > b.z1) return;
      if (p.cls === CLASS.ground) { if (p.y < ground && near(p.x, p.z, 2)) ground = p.y; return; }
      if (!VEGETATION.includes(p.cls) && p.y > top && near(p.x, p.z, 1)) top = p.y;
    });
  }
  // Null where the LiDAR saw nothing but the trees over it.
  const m = (v) => (Number.isFinite(v) ? Math.round((v - ELEV0) * 10) / 10 : null);
  small[id] = { top: m(top), ground: m(ground) };
}

const out = { stadium: { S, R0, dr: DR, pitch: Math.round(pitchY * 10) / 10, spokes, lights: kept }, small };
fs.writeFileSync(path.join(CACHE, 'sights.json'), JSON.stringify(out));
const tops = spokes.filter((q) => q.h.length).map((q) => Math.max(...q.h));
console.log(`the chapels and shrines: ${Object.entries(small).map(([id, q]) => `${id} ${q.top === null ? 'under trees' : `${(q.top - q.ground).toFixed(1)} m over its ground`}`).join(', ')}`);
console.log(`the stadium: the pitch at ${out.stadium.pitch} m, ${spokes.length} spokes, the stands from ${Math.min(...tops).toFixed(1)} to ${Math.max(...tops).toFixed(1)} m at their tops, ${spokes.filter((q) => !q.h.length).length} spokes with none; ${kept.length} floodlights, ${kept.map((m) => m[2]).join(', ')} m at their tops`);
