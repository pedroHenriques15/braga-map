// The trees seen (task 061): which species each tree near a viewpoint's camera is, as its photo shows
// it. refs/trees.json holds what was seen; trees.mjs's kindOf takes it before anything else.
//
// node tools/species.mjs mark [<id>…]   each viewpoint's photo (or a reference photo's, by its id) with
//                                       the trees the world has within 60 m of its camera outlined and
//                                       numbered, nearest first, and the orthophoto round the camera
//                                       with the same numbers, into .cache/species/: <id>.jpg, <id>-plan.jpg
//                                       and <id>.json, which number is which tree
// node tools/species.mjs                how many of the trees within 60 m of each viewpoint's camera, in
//                                       its view, refs/trees.json names
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CACHE, ROOT } from './geo.mjs';
import { orthoGrid } from './dgt.mjs';
import { jpegSize, photoCamera, viewCamera } from './buildings.mjs';
import { loadWorld } from '../index.js';

const OUT = path.join(CACHE, 'species');
export const NEAR = 60; // how far from its camera a tree's species is looked at

// Where a point in the map lands in a camera's view: [-1, 1] across and down, and how far ahead; null
// behind it.
function project(c, [x, y, z]) {
  const d = [x - c.o[0], y - c.o[1], z - c.o[2]], ahead = d[0] * c.f[0] + d[1] * c.f[1] + d[2] * c.f[2];
  if (ahead < 0.3) return null;
  const a = (d[0] * c.r[0] + d[1] * c.r[1] + d[2] * c.r[2]) / ahead / c.tx, b = (d[0] * c.d[0] + d[1] * c.d[1] + d[2] * c.d[2]) / ahead / c.ty;
  return [a, b, ahead];
}

// Whether a point in the map is within a camera's view across (its height left out), and ahead of it.
function across(c, x, z) {
  const dx = x - c.o[0], dz = z - c.o[2], fl = Math.hypot(c.f[0], c.f[2]), rl = Math.hypot(c.r[0], c.r[2]);
  const ahead = (dx * c.f[0] + dz * c.f[2]) / fl, side = (dx * c.r[0] + dz * c.r[2]) / rl;
  return ahead > 0.5 && Math.abs(side / ahead) <= c.tx;
}

// The trees within NEAR of a camera and in its view, nearest first: its trunk, its crown's middle or
// some of its crown's edge across the view, or the camera under its crown.
export function inView(c, trees, height) {
  const out = [];
  for (const t of trees) {
    const dist = Math.hypot(t.cx - c.o[0], t.cz - c.o[2]);
    if (Math.min(dist, Math.hypot(t.x - c.o[0], t.z - c.o[2])) > NEAR) continue;
    const edge = Array.from({ length: 24 }, (_, k) => [t.cx + (Math.cos((k * Math.PI) / 12) * t.crown) / 2, t.cz + (Math.sin((k * Math.PI) / 12) * t.crown) / 2]);
    if (dist > t.crown / 2 && ![[t.x, t.z], [t.cx, t.cz], ...edge].some(([x, z]) => across(c, x, z))) continue;
    const y = height(t.x, t.z);
    out.push({ t, y, dist, outline: crownOutline(c, t, y) });
  }
  return out.sort((p, q) => p.dist - q.dist);
}

// A crown's outline in a camera's view: its points round its middle at its foot, its widest and its
// top, and its trunk's foot, each projected, those in front of the camera.
function crownOutline(c, t, y) {
  const pts = [];
  for (const [f, r] of [[0, 0.7], [0.45, 1], [0.8, 0.75], [1, 0.15]]) {
    const hy = y + t.foot + (t.h - t.foot) * f;
    for (let k = 0; k < 16; k++) {
      const th = (k / 16) * Math.PI * 2, p = project(c, [t.cx + Math.cos(th) * r * t.crown / 2, hy, t.cz + Math.sin(th) * r * t.crown / 2]);
      if (p) pts.push(p);
    }
  }
  const foot = project(c, [t.x, y, t.z]);
  if (foot) pts.push(foot);
  return pts;
}

// The convex hull of points [a, b, …].
function hull(pts) {
  const p = [...pts].sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

const hue = (n) => `hsl(${(n * 137) % 360},95%,60%)`;

// A photo with the trees in its view outlined and numbered: each crown's outline, its trunk from its
// foot to its crown, and its number at its crown's middle.
async function outlinePhoto(src, cam, list, out) {
  const s = jpegSize(src), scale = Math.min(1, 1600 / s.w), w = Math.round(s.w * scale), h = Math.round(s.h * scale);
  const px = ([a, b]) => [((a + 1) / 2) * w, ((b + 1) / 2) * h];
  const svg = [];
  list.forEach(({ t, y, outline }, n) => {
    const col = hue(n + 1), ring = hull(outline).map(px);
    svg.push(`<polygon points="${ring.map(([u, v]) => `${u.toFixed(0)},${v.toFixed(0)}`).join(' ')}" stroke="${col}" stroke-width="2" fill="none"/>`);
    const foot = project(cam, [t.x, y, t.z]), top = project(cam, [t.x, y + t.foot, t.z]);
    if (foot && top) { const [u0, v0] = px(foot), [u1, v1] = px(top); svg.push(`<line x1="${u0.toFixed(0)}" y1="${v0.toFixed(0)}" x2="${u1.toFixed(0)}" y2="${v1.toFixed(0)}" stroke="${col}" stroke-width="3"/>`); }
    const mid = project(cam, [t.cx, y + (t.foot + t.h) / 2, t.cz]);
    if (mid) { const [u, v] = px(mid); svg.push(`<text x="${u.toFixed(0)}" y="${v.toFixed(0)}" font-family="Arial" font-weight="bold" font-size="26" fill="${col}" stroke="#000" stroke-width="4" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${n + 1}</text>`); }
  });
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svg.join('')}</svg>`);
  await sharp(src).resize(w, h).composite([{ input: overlay }]).jpeg({ quality: 85 }).toFile(out);
}

// The orthophoto round the camera, NEAR metres each way, with each tree's crown, its trunk and its
// number, and the camera's view.
async function outlinePlan(cam, list, out) {
  const [x, , z] = cam.o, r = NEAR + 10, step = 0.25, box = { x0: x - r, x1: x + r, z0: z - r, z1: z + r }, o = orthoGrid(box, step);
  if (!o) return;
  const k = 3, w = o.nx, h = o.nz, at = (px, pz) => [(((px - box.x0) / step) * k).toFixed(0), (((pz - box.z0) / step) * k).toFixed(0)];
  const svg = [];
  const fl = Math.hypot(cam.f[0], cam.f[2]), fx = cam.f[0] / fl, fz = cam.f[2] / fl, half = Math.atan(cam.tx);
  for (const s of [-1, 1]) { const a = Math.atan2(fz, fx) + s * half, [u0, v0] = at(x, z), [u1, v1] = at(x + Math.cos(a) * r, z + Math.sin(a) * r); svg.push(`<line x1="${u0}" y1="${v0}" x2="${u1}" y2="${v1}" stroke="#fff" stroke-width="2" stroke-dasharray="8 6"/>`); }
  list.forEach(({ t }, n) => {
    const col = hue(n + 1), [u, v] = at(t.cx, t.cz), [tu, tv] = at(t.x, t.z);
    svg.push(`<circle cx="${u}" cy="${v}" r="${((t.crown / 2 / step) * k).toFixed(0)}" stroke="${col}" stroke-width="2" fill="none"/>`);
    svg.push(`<circle cx="${tu}" cy="${tv}" r="4" fill="${col}"/>`);
    svg.push(`<text x="${u}" y="${v}" font-family="Arial" font-weight="bold" font-size="28" fill="${col}" stroke="#000" stroke-width="4" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${n + 1}</text>`);
  });
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w * k}" height="${h * k}">${svg.join('')}</svg>`);
  await sharp(Buffer.from(o.rgb), { raw: { width: w, height: h, channels: 3 } }).resize(w * k, h * k, { kernel: 'nearest' }).composite([{ input: overlay }]).jpeg({ quality: 85 }).toFile(out);
}

// The viewpoints but the skylines, and the reference photos, with each one's camera; the world round
// them all.
async function prepare() {
  const views = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8'));
  const all = [...views.viewpoints, ...(views.dropped ?? [])].filter((v) => v.kind !== 'skyline');
  const photos = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos;
  const xs = all.map((v) => v.x), zs = all.map((v) => v.z);
  const world = await loadWorld({ x0: Math.min(...xs) - 400, x1: Math.max(...xs) + 400, z0: Math.min(...zs) - 400, z1: Math.max(...zs) + 400 });
  return { views: all, photos, world };
}

// A viewpoint's camera and photo, or a reference photo's.
function cameraOf(id, { views, photos, world }) {
  const v = views.find((u) => u.id === id);
  if (v) {
    const src = path.join(CACHE, 'refs', v.id + '.jpg'), s = jpegSize(src);
    return { src, cam: viewCamera(v, s.w / s.h) };
  }
  const p = photos.find((u) => u.id === id);
  if (!p) throw new Error(`No viewpoint or reference photo ${id}`);
  const f = fs.readdirSync(path.join(CACHE, 'refs', 'photos')).find((n) => n.replace(/\.\w+$/, '') === p.id);
  if (!f) throw new Error(`${id}'s photo isn't fetched: node tools/refs.mjs`);
  const src = path.join(CACHE, 'refs', 'photos', f), s = jpegSize(src);
  const cam = p.photo.pano
    ? photoCamera(p.photo, p.heading, p.pitch, 0, p.fov, s.w / s.h, world.height, 2.2)
    : photoCamera(p.photo, p.photo.heading, p.photo.pitch ?? 0, p.photo.roll ?? 0, p.fov, s.w / s.h, world.height, 1.4);
  return { src, cam };
}

async function mark(ids) {
  const ctx = await prepare();
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of ids.length ? ids : ctx.views.map((v) => v.id)) {
    const { src, cam } = cameraOf(id, ctx), list = inView(cam, ctx.world.trees, ctx.world.height);
    await outlinePhoto(src, cam, list, path.join(OUT, id + '.jpg'));
    await outlinePlan(cam, list, path.join(OUT, id + '-plan.jpg'));
    const legend = list.map(({ t, dist }, n) => ({ n: n + 1, at: [t.cx, t.cz], trunk: [t.x, t.z], dist: Math.round(dist * 10) / 10, kind: t.kind, h: t.h, crown: t.crown, foot: t.foot }));
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(legend, null, 1));
    console.log(`${id}: ${list.length} trees within ${NEAR} m in view`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'tools', 'species.mjs')) {
  if (process.argv[2] === 'mark') await mark(process.argv.slice(3));
}
