// Each facade's doors and windows where they are (task 086): which walls of the buildings seen in a photo
// face a street, which photo shows each best, and each of those walls straight on, to read its openings
// from. refs/buildings.json's `layout` holds what was read.
//
// node tools/layouts.mjs            the walls, into .cache/layouts/todo.json: every street wall of the
//                                   shooter's area's buildings seen in a photo, the photos that show it
//                                   and how well (its metres in view, unhidden, and their pixels a metre)
// node tools/layouts.mjs show <id>… each of those buildings' street walls straight on: the photo that
//                                   shows it best (and the next), warped onto the wall's plane at 40 px
//                                   a metre, 3 m past each end, a grid every metre along and up from its
//                                   left corner and its foot as the map has them, into .cache/layouts/
//                                   <id>/; and the photo with the wall outlined, to tell which it is
//
// A wall is a run of a footprint's sides within 12° of each other, 3 m or more, named by its ends as the
// map has them, left to right seen from outside. It faces a street where a carriageway's middle is within
// 25 m in front of it with no building between. Mapillary's cameras are 1–3 m out, so a wall straight
// on is shifted along its grid a little: its openings are read against its corners as the photo shows
// them, and scaled to its length.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CACHE, ROOT } from './geo.mjs';
import { finder, hitPart, jpegSize, named, photoCamera, viewCamera } from './buildings.mjs';
import { OPENINGS } from './facades.mjs';
import { inside } from './osm.mjs';
import { inShooter, SHOOTER_BOX } from './sections.mjs';
import { loadWorld } from '../index.js';

const OUT = path.join(CACHE, 'layouts');
// Pixels a metre of a wall straight on, how far past its ends it's shown, and how far a camera sees.
const K = 40, MARGIN = 3, FAR = 120;

// A building's walls: its outline's runs of sides within 12° of each other, 3 m or more, each from its left
// end to its right seen from outside, with its outward normal and length.
export function wallsOf(pts) {
  const n = pts.length, area = pts.reduce((s, p, k) => { const q = pts[(k + 1) % n]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const dir = (k) => { const p = pts[k], q = pts[(k + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]); };
  const turn = (a, b) => Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  // Start where a corner turns more than 12°, so no run wraps round the start.
  let s0 = 0;
  for (let k = 0; k < n; k++) if (turn(dir((k + n - 1) % n), dir(k)) > (12 * Math.PI) / 180) { s0 = k; break; }
  const runs = [];
  for (let i = 0; i < n; i++) {
    const k = (s0 + i) % n;
    const last = runs[runs.length - 1];
    if (last && turn(dir(last.k1), dir(k)) <= (12 * Math.PI) / 180 && turn(last.d, dir(k)) <= (12 * Math.PI) / 180) last.k1 = k;
    else runs.push({ k0: k, k1: k, d: dir(k) });
  }
  const out = [];
  for (const r of runs) {
    const p = pts[r.k0], q = pts[(r.k1 + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L < 3) continue;
    const ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L, nrm = area > 0 ? [uz, -ux] : [-uz, ux];
    // Seen from outside (looking along -n), its right is (n.z, -n.x)... facing f, right is (-f.z, f.x).
    const f = [-nrm[0], -nrm[1]], right = [-f[1], f[0]], fwd = ux * right[0] + uz * right[1] > 0;
    out.push({ from: fwd ? p : q, to: fwd ? q : p, L, n: nrm, sides: [r.k0, r.k1] });
  }
  return out;
}

// The world over the shooter's area, its parts each with the name of the building it's of, and the
// carriageways' middles.
async function prepare() {
  const list = named(), find = finder(list), B = SHOOTER_BOX;
  const world = await loadWorld({ x0: B.x0 - 300, x1: B.x1 + 300, z0: B.z0 - 300, z1: B.z1 + 300 });
  const parts = [];
  for (const b of world.buildings) {
    const cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length, cz = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
    const owner = find(cx, cz);
    if (!owner) continue;
    parts.push({ name: owner.id, pts: b.pts, cx, cz, r: Math.max(...b.pts.map(([x, z]) => Math.hypot(x - cx, z - cz))), y0: b.y - 0.6, y1: b.y + b.ridge, foot: b.y, h: b.h, floors: b.floors });
  }
  const roads = world.lines.filter((l) => l.level !== 'tunnel' && l.kind <= 7);
  return { list, find, world, parts, roads };
}

// Whether a wall faces a street: from its middle out along its normal, a carriageway's middle within 25 m
// (closer than its half width and 2 m) before any building's footprint.
function facesStreet(w, roads, find, self) {
  const mx = (w.from[0] + w.to[0]) / 2, mz = (w.from[1] + w.to[1]) / 2;
  for (let d = 1; d <= 25; d += 1) {
    const x = mx + w.n[0] * d, z = mz + w.n[1] * d, b = find(x, z);
    if (b && b.id !== self) return false;
    for (const l of roads) for (let k = 1; k < l.pts.length; k++) {
      const [ax, az] = l.pts[k - 1], [bx, bz] = l.pts[k], ex = bx - ax, ez = bz - az, LL = ex * ex + ez * ez;
      const t = LL ? Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / LL)) : 0;
      if (Math.hypot(ax + ex * t - x, az + ez * t - z) < l.w / 2 + 2) return true;
    }
  }
  return false;
}

// A camera's projection of a point of the map's (x, y, z) into its photo, w × h pixels; null behind it.
const projector = (c, w, h) => ([x, y, z]) => {
  const q = [x - c.o[0], y - c.o[1], z - c.o[2]], zc = q[0] * c.f[0] + q[1] * c.f[1] + q[2] * c.f[2];
  if (zc <= 0.5) return null;
  const a = (q[0] * c.r[0] + q[1] * c.r[1] + q[2] * c.r[2]) / zc / c.tx, b = (q[0] * c.d[0] + q[1] * c.d[1] + q[2] * c.d[2]) / zc / c.ty;
  return [((a + 1) / 2) * w, ((b + 1) / 2) * h];
};

// The reference photos and the viewpoints' photos, each with its camera and file: a frame named twice
// (a facade's photo that's also a kind's example, or a panorama cut the same way) once, by its facade's
// name where it has one.
function cameras(world) {
  const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos, frames = new Set();
  const photos = [...all.filter((p) => p.id.startsWith('facade-')), ...all.filter((p) => !p.id.startsWith('facade-'))].filter((p) => {
    const key = `${p.photo.source}:${p.photo.id}:${p.photo.pano ? `${p.heading},${p.pitch}` : ''}`;
    return !frames.has(key) && frames.add(key);
  });
  const views = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8')).viewpoints.filter((v) => v.kind !== 'skyline');
  const files = fs.readdirSync(path.join(CACHE, 'refs', 'photos'));
  const out = [];
  for (const p of photos) {
    const src = files.find((f) => f.replace(/\.\w+$/, '') === p.id);
    if (!src) continue;
    const file = path.join(CACHE, 'refs', 'photos', src), s = jpegSize(file);
    if (!s) continue;
    const cam = p.photo.pano
      ? photoCamera(p.photo, p.heading, p.pitch, 0, p.fov, s.w / s.h, world.height, 2.2)
      : photoCamera(p.photo, p.photo.heading, p.photo.pitch ?? 0, p.photo.roll ?? 0, p.fov, s.w / s.h, world.height, 1.4);
    out.push({ id: p.id, file, w: s.w, h: s.h, cam, date: p.photo.date });
  }
  for (const v of views) {
    const file = path.join(CACHE, 'refs', v.id + '.jpg');
    if (!fs.existsSync(file)) continue;
    const s = jpegSize(file);
    out.push({ id: 'viewpoint:' + v.id, file, w: s.w, h: s.h, cam: viewCamera(v, s.w / s.h) });
  }
  return out;
}

// How well a photo shows a wall: of the points along its middle storey every half metre, those in the
// photo, facing it, and not hidden by another building (the first part a ray meets is the wall's own,
// within a metre of it); its metres so seen, and the pixels a metre across there.
function sight(w, ph, parts, foot, eaves, self) {
  const c = ph.cam, mx = (w.from[0] + w.to[0]) / 2, mz = (w.from[1] + w.to[1]) / 2;
  const to = [c.o[0] - mx, c.o[2] - mz], dist = Math.hypot(...to), cos = (to[0] * w.n[0] + to[1] * w.n[1]) / dist;
  if (cos < 0.2 || dist > FAR) return null;
  const proj = projector(c, ph.w, ph.h), y = foot + Math.min(eaves * 0.6, 6);
  const near = parts.filter((p) => Math.hypot(p.cx - c.o[0], p.cz - c.o[2]) < dist + p.r + 5);
  let seen = 0, px = 0;
  const N = Math.max(2, Math.round(w.L / 0.5));
  for (let i = 0; i <= N; i++) {
    const t = i / N, P = [w.from[0] + (w.to[0] - w.from[0]) * t, y, w.from[1] + (w.to[1] - w.from[1]) * t], uv = proj(P);
    if (!uv || uv[0] < 0 || uv[1] < 0 || uv[0] >= ph.w || uv[1] >= ph.h) continue;
    const d = [P[0] - c.o[0], P[1] - c.o[1], P[2] - c.o[2]], l = Math.hypot(...d), u = d.map((v) => v / l);
    let best = Infinity, who = null;
    for (const p of near) { const t2 = hitPart(c.o, u, p); if (t2 < best) { best = t2; who = p.name; } }
    if (who !== self && best < l - 1) continue;
    seen++;
    const q = proj([P[0] + (w.to[0] - w.from[0]) / w.L, y, P[2] + (w.to[1] - w.from[1]) / w.L]);
    if (q) px += Math.hypot(q[0] - uv[0], q[1] - uv[1]);
  }
  if (!seen) return null;
  return { metres: Math.round(((seen - 1 / 2) / N) * w.L * 10) / 10, pxm: Math.round(px / seen), cos: Math.round(cos * 100) / 100, dist: Math.round(dist) };
}

const r1 = (v) => Math.round(v * 10) / 10;

async function makeList() {
  const { list, find, world, parts, roads } = await prepare();
  const seen = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'buildings.json'), 'utf8')).buildings;
  const phs = cameras(world);
  const todo = [];
  for (const b of list) {
    const e = seen[b.id];
    if (!e?.seen || !inShooter(b.cx, b.cz)) continue;
    const mine = parts.filter((p) => p.name === b.id);
    if (!mine.length) continue;
    const foot = Math.min(...mine.map((p) => p.foot)), eaves = Math.max(...mine.map((p) => p.foot + p.h)) - foot;
    const walls = [];
    for (const w of wallsOf(b.pts)) {
      if (!facesStreet(w, roads, find, b.id)) continue;
      const photos = phs.map((ph) => ({ id: ph.id, ...sight(w, ph, parts, foot, eaves, b.id) })).filter((s) => s.metres > 0).sort((a, c) => c.metres * c.pxm - a.metres * a.pxm);
      walls.push({ from: w.from.map(r1), to: w.to.map(r1), L: r1(w.L), photos: photos.slice(0, 6) });
    }
    todo.push({ id: b.id, type: e.type, floors: e.floors, sure: e.sure !== false, foot: r1(foot), eaves: r1(eaves), walls });
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'todo.json'), JSON.stringify(todo, null, 1));
  const ws = todo.flatMap((t) => t.walls);
  console.log(`${todo.length} buildings seen in the shooter's area (${todo.filter((t) => t.sure).length} clearly), ${ws.length} street walls, ${ws.filter((w) => w.photos.length).length} in a photo (${ws.filter((w) => w.photos[0]?.metres >= w.L * 0.7 && w.photos[0]?.pxm >= 30).length} mostly, at 30 px a metre or more)`);
}

// The photo a wall is read from, at most 1600 px wide, a grid over it every 50 px (numbered every 100), and
// the wall as Mapillary's camera would put it (its foot, its eaves and its ends, the left end's dot red):
// a hint, as that camera is out by metres and degrees. Returns the scale it's drawn at.
async function gridded(w, ph, foot, eaves, out) {
  const s = Math.min(1, 1600 / ph.w), W = Math.round(ph.w * s), Hh = Math.round(ph.h * s), proj = projector(ph.cam, ph.w, ph.h);
  const svg = [];
  for (let x = 0; x <= W; x += 50) svg.push(`<line x1="${x}" y1="0" x2="${x}" y2="${Hh}" stroke="#0ff" stroke-opacity="${x % 100 ? 0.25 : 0.5}" stroke-width="1"/>`, ...(x % 100 ? [] : [`<text x="${x + 2}" y="12" font-size="11" font-family="Arial" fill="#0ff" stroke="#000" stroke-width="3" paint-order="stroke">${x}</text>`]));
  for (let y = 0; y <= Hh; y += 50) svg.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#0ff" stroke-opacity="${y % 100 ? 0.25 : 0.5}" stroke-width="1"/>`, ...(y % 100 ? [] : [`<text x="2" y="${y - 2}" font-size="11" font-family="Arial" fill="#0ff" stroke="#000" stroke-width="3" paint-order="stroke">${y}</text>`]));
  const c = [[w.from, 0], [w.to, 0], [w.to, eaves], [w.from, eaves]].map(([p, y]) => proj([p[0], foot + y, p[1]]));
  if (c.every(Boolean)) svg.push(`<polygon points="${c.map(([x, y]) => `${(x * s).toFixed(0)},${(y * s).toFixed(0)}`).join(' ')}" fill="none" stroke="#ff0" stroke-width="2" stroke-dasharray="8 6"/><circle cx="${(c[0][0] * s).toFixed(0)}" cy="${(c[0][1] * s).toFixed(0)}" r="6" fill="#f33"/>`);
  await sharp(ph.file).resize(W, Hh).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}">${svg.join('')}</svg>`) }]).jpeg({ quality: 88 }).toFile(out);
  return s;
}

// The homography taking the wall's plane (s along it, y up it) to the photo, from four points of the photo
// (top left, top right, bottom right, bottom left) at s 0 and L, y top and bottom.
function homography(quad, L, top, bottom) {
  const src = [[0, top], [L, top], [L, bottom], [0, bottom]], A = [], b = [];
  src.forEach(([x, y], k) => {
    const [u, v] = quad[k];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  });
  // Gaussian elimination, with partial pivoting.
  const n = 8, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  const h = M.map((r, i) => r[n] / r[i]);
  return (x, y) => { const d = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / d, (h[3] * x + h[4] * y + h[5]) / d]; };
}

// A wall straight on: the photo warped by the homography its four points give, K px a metre, a metre past
// each end and over the top, down to its foot, with a grid every metre along it from its left corner and
// up it from its foot.
async function straightOn(ph, scale, quad, L, top, bottom, out) {
  const H = homography(quad.map(([u, v]) => [u / scale, v / scale]), L, top, bottom), M1 = 1;
  const W = Math.round((L + 2 * M1) * K), Y1 = top + 1, Hh = Math.round((Y1 + 0.3) * K);
  const { data } = await sharp(ph.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = Buffer.alloc(W * Hh * 3, 40);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const [u, v] = H(i / K - M1, Y1 - j / K);
    if (!(u >= 0 && v >= 0 && u < ph.w - 1 && v < ph.h - 1)) continue;
    const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0, o = (j * W + i) * 3;
    for (let c = 0; c < 3; c++) {
      const at = (x, yy) => data[(yy * ph.w + x) * 3 + c];
      img[o + c] = Math.round(at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy);
    }
  }
  const svg = [], X = (s) => (s + M1) * K, Y = (y) => (Y1 - y) * K;
  for (let m = 0; m <= Math.floor(L); m++) {
    svg.push(`<line x1="${X(m)}" y1="${Hh - 0.4 * K}" x2="${X(m)}" y2="${Hh}" stroke="#ff0" stroke-width="${m % 5 ? 1 : 2}"/><line x1="${X(m)}" y1="0" x2="${X(m)}" y2="${0.3 * K}" stroke="#ff0" stroke-width="${m % 5 ? 1 : 2}"/>`);
    svg.push(`<text x="${X(m) + 2}" y="${Hh - 3}" font-size="12" font-family="Arial" fill="#ff0" stroke="#000" stroke-width="3" paint-order="stroke">${m}</text>`);
    for (let y = 0; y <= Y1; y += 1) svg.push(`<circle cx="${X(m)}" cy="${Y(y)}" r="1.5" fill="#ff0" fill-opacity="0.7"/>`);
  }
  for (const s of [0, L]) svg.push(`<line x1="${X(s)}" y1="0" x2="${X(s)}" y2="${Hh}" stroke="#f33" stroke-width="1.5" stroke-dasharray="6 6"/>`);
  for (let y = 0; y <= Math.floor(Y1); y++) svg.push(`<line x1="0" y1="${Y(y)}" x2="${0.3 * K}" y2="${Y(y)}" stroke="#0ff"/><text x="2" y="${Y(y) - 2}" font-size="11" font-family="Arial" fill="#0ff" stroke="#000" stroke-width="3" paint-order="stroke">${y}</text>`);
  await sharp(img, { raw: { width: W, height: Hh, channels: 3 } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}">${svg.join('')}</svg>`) }]).jpeg({ quality: 90 }).toFile(out);
}

// Where the four points of each wall were read on its gridded photo (task 086's sessions'), so a wall straight
// on can be made again: each building's in .cache/layouts/<id>/corners.json, by wall.
const cornersOf = (dir) => path.join(dir, 'corners.json');

// node tools/layouts.mjs show <id>… [--photos <photo>…]: each wall's two best photos gridded, or with
// --photos, those (of any of its walls in view).
async function show(args) {
  const at = args.indexOf('--photos'), ids = at < 0 ? args : args.slice(0, at), only = at < 0 ? null : args.slice(at + 1);
  const todo = JSON.parse(fs.readFileSync(path.join(OUT, 'todo.json'), 'utf8'));
  const { world } = await prepare();
  const phs = new Map(cameras(world).map((p) => [p.id, p]));
  for (const id of ids) {
    const t = todo.find((q) => q.id === id);
    if (!t) { console.log(`${id}: not in .cache/layouts/todo.json`); continue; }
    const dir = path.join(OUT, id.replace('/', '-'));
    fs.mkdirSync(dir, { recursive: true });
    t.walls.forEach((w, k) => {
      w.k = k;
      if (!w.photos.length) console.log(`${id} w${k} (${w.L} m): in no photo`);
    });
    for (const w of t.walls) for (const p of only ? w.photos.filter((q) => only.includes(q.id)) : w.photos.slice(0, 2)) {
      const ph = phs.get(p.id), name = `w${w.k}-${p.id.replace(':', '-')}`;
      const s = await gridded(w, ph, t.foot, t.eaves, path.join(dir, name + '.jpg'));
      console.log(`${id} w${w.k} (${w.L} m, ${JSON.stringify(w.from)} → ${JSON.stringify(w.to)}, eaves ${t.eaves} m): ${p.id} at ${s.toFixed(3)}, ${p.metres} m seen at ${p.pxm} px a metre, ${p.dist} m off`);
    }
  }
}

// node tools/layouts.mjs straight <id> <wall> <photo> <x,y top left> <x,y top right> <x,y bottom right>
//   <x,y bottom left> [<top> <bottom>]: the wall straight on, from four points of its gridded photo (in
//   its pixels) at its ends, at `top` and `bottom` metres up it (its eaves and its foot, unless said).
async function straight([id, k, photo, ...rest]) {
  const todo = JSON.parse(fs.readFileSync(path.join(OUT, 'todo.json'), 'utf8')), t = todo.find((q) => q.id === id), w = t?.walls[+k];
  if (!w) throw new Error(`${id} has no wall ${k}`);
  const quad = rest.slice(0, 4).map((q) => q.split(',').map(Number)), top = rest[4] != null ? +rest[4] : t.eaves, bottom = rest[5] != null ? +rest[5] : 0;
  if (quad.length !== 4 || quad.some((q) => q.length !== 2 || q.some(Number.isNaN))) throw new Error('four points, x,y each');
  const { world } = await prepare();
  const ph = cameras(world).find((p) => p.id === photo), scale = Math.min(1, 1600 / ph.w);
  const dir = path.join(OUT, id.replace('/', '-')), out = path.join(dir, `w${k}-straight.jpg`);
  fs.mkdirSync(dir, { recursive: true });
  await straightOn(ph, scale, quad, w.L, top, bottom, out);
  const file = cornersOf(dir), all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  all[k] = { photo, quad, top, bottom };
  fs.writeFileSync(file, JSON.stringify(all, null, 1));
  console.log(out, `${w.L} m by ${top - bottom} m`);
}

// refs/buildings.json as it's kept: JSON, a space a level, each array of plain values on one line.
export const writeBuildings = (file, doc) => fs.writeFileSync(file, JSON.stringify(doc, null, 1).replace(/\[\n\s*([^[\]{}]*?)\n\s*\]/g, (m, a) => '[' + a.split(/,\n\s*/).join(', ') + ']') + '\n');

// What's wrong with a wall's reading, or null: each storey null or its openings left to right, each a kind
// of OPENINGS with its left edge and width on the wall (a little past its ends allowed, as its corners are
// read off a photo), none over the next.
export function badLayout(storeys, L) {
  if (!Array.isArray(storeys) || !storeys.length) return 'no storeys';
  for (const [k, st] of storeys.entries()) {
    if (st === null) continue;
    if (!Array.isArray(st)) return `storey ${k}: not a list`;
    let end = -Infinity;
    for (const o of st) {
      const [kind, at, w] = o ?? [];
      if (!OPENINGS.includes(kind) || typeof at !== 'number' || typeof w !== 'number') return `storey ${k}: ${JSON.stringify(o)}`;
      if (w < 0.3 || w > 12 || at < -0.3 || at + w > L + 0.3) return `storey ${k}: ${kind} at ${at}, ${w} wide, on a wall ${L} m long`;
      if (at < end - 0.05) return `storey ${k}: ${kind} at ${at} over the one before it (to ${end})`;
      end = at + w;
    }
  }
  return null;
}

// node tools/layouts.mjs read <readings.json>…: the sessions' readings (by building, its walls read, each
// its number in .cache/layouts/todo.json, its photo and its storeys, and those left, each with why) into
// refs/buildings.json: each building's `layout` (the walls read, by their ends) and `unread` (those left).
async function read(files) {
  const todo = new Map(JSON.parse(fs.readFileSync(path.join(OUT, 'todo.json'), 'utf8')).map((t) => [t.id, t]));
  const file = path.join(ROOT, 'refs', 'buildings.json'), doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  let read = 0, left = 0;
  const bad = [];
  for (const f of files) for (const [id, r] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    const t = todo.get(id), e = doc.buildings[id];
    if (!t || !e) { bad.push(`${id}: not in the list or refs/buildings.json`); continue; }
    const layout = [], unread = [];
    for (const w of r.walls ?? []) {
      const tw = t.walls[w.k], why = tw ? badLayout(w.storeys, tw.L) : `no wall ${w.k}`;
      if (why) { bad.push(`${id} w${w.k}: ${why}`); continue; }
      // To a decimetre, the edges as read.
      layout.push({ from: tw.from, to: tw.to, photo: w.photo, storeys: w.storeys.map((st) => st && st.map(([kind, at, ow]) => [kind, Math.round(Math.max(0, at) * 10) / 10, Math.round(ow * 10) / 10])) });
      read++;
    }
    for (const w of r.left ?? []) { const tw = t.walls[w.k]; if (tw) { unread.push({ from: tw.from, to: tw.to, why: w.why }); left++; } }
    if (layout.length) e.layout = layout; else delete e.layout;
    if (unread.length) e.unread = unread; else delete e.unread;
  }
  writeBuildings(file, doc);
  console.log(`${read} walls read, ${left} left, into refs/buildings.json${bad.length ? `; not taken:\n  ${bad.join('\n  ')}` : ''}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'tools', 'layouts.mjs')) {
  if (process.argv[2] === 'show') await show(process.argv.slice(3));
  else if (process.argv[2] === 'straight') await straight(process.argv.slice(3));
  else if (process.argv[2] === 'read') await read(process.argv.slice(3));
  else await makeList();
}
