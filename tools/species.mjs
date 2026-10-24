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
// node tools/species.mjs shooter        the shooter's area's trees a photo shows (in its view, within
//                                       60 m, and in sight past the buildings), which photos show them,
//                                       and how many refs/trees.json names (task 088)
//
// node tools/species.mjs summer         Mapillary's panoramas in leaf (May to October) round the
//                                       shooter's area's trees, as reference photos into
//                                       refs/photos.json (trees-<photo>-<heading>): each view the 90°
//                                       of a panorama that shows the most trees no view has yet, 8 to
//                                       35 m off, the latest year first, none near a friend's
//                                       house or looking at one (test/photos.test.js's rule); then node tools/refs.mjs
//                                       cuts them, and mark numbers them
//
// mark leaves out the trees the buildings hide from the camera (inSight), as the photo can't show them.
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

// Whether a tree is in sight of a camera past the buildings (task 088): a line from the camera to its
// crown's middle, near its top or to its trunk that no building stands in the way of, up to its
// eaves. A building the camera stands in is left out: a photo's camera is 1-3 m out, and one at a
// facade can land inside it.
export function inSight(c, t, y, buildings) {
  const o = c.o, near = buildings.filter((b) => b.box.x1 > Math.min(o[0], t.cx, t.x) - 1 && b.box.x0 < Math.max(o[0], t.cx, t.x) + 1 && b.box.z1 > Math.min(o[2], t.cz, t.z) - 1 && b.box.z0 < Math.max(o[2], t.cz, t.z) + 1 && !insideRing(b.pts, o[0], o[2]));
  const clear = (p) => {
    for (const b of near) {
      for (let k = 0; k < b.pts.length; k++) {
        const [ax, az] = b.pts[k], [bx, bz] = b.pts[(k + 1) % b.pts.length];
        const dx = p[0] - o[0], dz = p[2] - o[2], ex = bx - ax, ez = bz - az, den = dx * ez - dz * ex;
        if (Math.abs(den) < 1e-9) continue;
        const s = ((ax - o[0]) * ez - (az - o[2]) * ex) / den, u = ((ax - o[0]) * dz - (az - o[2]) * dx) / den;
        if (s <= 0 || s >= 1 || u < 0 || u > 1) continue;
        if (o[1] + (p[1] - o[1]) * s < b.top) return false;
      }
    }
    return true;
  };
  return [[t.cx, y + (t.foot + t.h) / 2, t.cz], [t.cx, y + t.foot + (t.h - t.foot) * 0.85, t.cz], [t.x, y + Math.min(2, t.foot), t.z]].some(clear);
}

// The buildings as inSight takes them: each outline, its box, and its eaves' height.
export const sightBuildings = (buildings) =>
  buildings.map((b) => ({ pts: b.pts, top: b.y + b.h, box: { x0: Math.min(...b.pts.map((p) => p[0])), x1: Math.max(...b.pts.map((p) => p[0])), z0: Math.min(...b.pts.map((p) => p[1])), z1: Math.max(...b.pts.map((p) => p[1])) } }));

function insideRing(r, x, z) {
  let odd = false;
  for (let k = 0, j = r.length - 1; k < r.length; j = k++) if (r[k][1] > z !== r[j][1] > z && x < r[k][0] + ((z - r[k][1]) / (r[j][1] - r[k][1])) * (r[j][0] - r[k][0])) odd = !odd;
  return odd;
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
  return { views: all, photos, world, blocks: sightBuildings(world.buildings) };
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
    const { src, cam } = cameraOf(id, ctx), list = inView(cam, ctx.world.trees, ctx.world.height).filter(({ t, y }) => inSight(cam, t, y, ctx.blocks));
    await outlinePhoto(src, cam, list, path.join(OUT, id + '.jpg'));
    await outlinePlan(cam, list, path.join(OUT, id + '-plan.jpg'));
    const legend = list.map(({ t, dist }, n) => ({ n: n + 1, at: [t.cx, t.cz], trunk: [t.x, t.z], dist: Math.round(dist * 10) / 10, kind: t.kind, h: t.h, crown: t.crown, foot: t.foot }));
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(legend, null, 1));
    console.log(`${id}: ${list.length} trees within ${NEAR} m in view`);
  }
}

// The shooter's area's trees a photo shows, each with the photos that do, the most first; and how many
// of them refs/trees.json names (a tree seen, nearest its crown's middle as refsOf matches them).
async function shooter() {
  const ctx = await prepare(), { world } = ctx;
  const trees = world.trees.filter((t) => world.inShooter(t.x, t.z));
  const shown = new Map(), by = new Map();
  for (const id of [...ctx.views.map((v) => v.id), ...ctx.photos.filter((p) => !p.generic && p.photo.lat !== undefined).map((p) => p.id)]) {
    let cam;
    try {
      cam = cameraOf(id, ctx).cam;
    } catch {
      continue;
    }
    for (const { t, y } of inView(cam, trees, world.height)) {
      if (!inSight(cam, t, y, ctx.blocks)) continue;
      shown.set(t, [...(shown.get(t) ?? []), id]);
      by.set(id, (by.get(id) ?? 0) + 1);
    }
  }
  // Looked at: in refs/trees.json, named or found hidden (species null: behind something, or the
  // photo's camera too far out to tell which tree it is).
  const seen = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'trees.json'), 'utf8')).trees;
  const entry = (t) => seen.find((s) => Math.hypot(s.at[0] - t.cx, s.at[1] - t.cz) <= Math.max(3, t.crown / 2));
  const looked = [...shown.keys()].filter(entry), named = looked.filter((t) => entry(t).species);
  console.log(`${trees.length} trees in the shooter's area; ${shown.size} a photo shows, in ${by.size} photos; refs/trees.json has looked at ${looked.length} of them, naming ${named.length} (${named.filter((t) => entry(t).species !== 'broadleaf').length} past "broadleaf") and finding the rest hidden`);
  // The fewest photos that show every one not looked at yet, the one showing the most first.
  const left = new Set([...shown.keys()].filter((t) => !looked.includes(t))), pick = [];
  while (left.size) {
    let best = null, most = 0;
    for (const id of by.keys()) {
      const n = [...left].filter((t) => shown.get(t).includes(id)).length;
      if (n > most) [best, most] = [id, n];
    }
    pick.push(`${best} ${most}`);
    for (const t of [...left]) if (shown.get(t).includes(best)) left.delete(t);
  }
  console.log(`to look at, ${pick.length} photos: ${pick.join(', ')}`);
}

// A panorama's heading, pitch and roll (refs.mjs's frame) from Mapillary's computed_rotation, the
// world-to-camera rotation as an axis times its angle (OpenSfM's: x right, y down, z forward).
export function panoFrame(v) {
  const th = Math.hypot(...v), D = 180 / Math.PI;
  const [x, y, z] = th > 1e-12 ? v.map((c) => c / th) : [0, 0, 1], c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  const right = [c + x * x * C, x * y * C - z * s, x * z * C + y * s], f = [z * x * C - y * s, z * y * C + x * s, c + z * z * C];
  const heading = (Math.atan2(f[0], f[1]) * D + 360) % 360, h = heading / D, r0 = [Math.cos(h), -Math.sin(h), 0];
  const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]];
  const cr = right[0] * r0[0] + right[1] * r0[1], sr = -(right[0] * u0[0] + right[1] * u0[1] + right[2] * u0[2]);
  return { heading: +heading.toFixed(1), pitch: +(Math.asin(f[2]) * D).toFixed(1), roll: +(Math.atan2(sr, cr) * D).toFixed(1) };
}

// Where no reference photo may be taken from or look at (test/photos.test.js): the eggs, and the
// waypoints where .cache/places.json is there. Only ever kept in memory.
async function forbidden(P) {
  const away = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'tracks')).filter((n) => n.endsWith('.js'))) away.push(...(await import(`../tracks/${f}`)).default.eggs.map((e) => [e.x, e.z]));
  const file = path.join(CACHE, 'places.json');
  if (fs.existsSync(file)) away.push(...JSON.parse(fs.readFileSync(file, 'utf8')).places.map((p) => [p.x, p.z]));
  const turn = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  // A view from (x, z) along `heading`, `fov` wide: 150 m from all of them, and turned from any within 300 m.
  return (x, z, heading, fov) => away.every(([hx, hz]) => {
    const d = Math.hypot(hx - x, hz - z);
    return d >= 150 && (d > 300 || turn(((Math.atan2(hx - x, -(hz - z)) * 180) / Math.PI + 360) % 360, heading) > fov / 2 + 5);
  });
}

async function summer() {
  const { world } = await prepare(), { P } = await import('./geo.mjs'), allowed = await forbidden(P);
  const trees = world.trees.filter((t) => world.inShooter(t.x, t.z));
  const file = path.join(ROOT, 'refs', 'photos.json'), refs = JSON.parse(fs.readFileSync(file, 'utf8'));
  const images = Object.values(JSON.parse(fs.readFileSync(path.join(CACHE, 'mapillary', 'images.json'), 'utf8')));
  const panos = images.filter((i) => i.is_pano && i.computed_rotation && (i.computed_geometry ?? i.geometry)).filter((i) => { const m = new Date(i.captured_at).getUTCMonth() + 1; return m >= 5 && m <= 10; });
  const at = (i) => { const [lon, lat] = (i.computed_geometry ?? i.geometry).coordinates; return { lat, lon, p: P({ lat, lon }) }; };
  // Each panorama's best views: the trees 8 to 35 m off by their bearing.
  const views = [];
  for (const i of panos) {
    const { p } = at(i), near = trees.map((t) => ({ t, d: Math.hypot(t.cx - p[0], t.cz - p[1]), b: ((Math.atan2(t.cx - p[0], -(t.cz - p[1])) * 180) / Math.PI + 360) % 360 })).filter((n) => n.d >= 8 && n.d <= 35);
    for (let h = 0; h < 360; h += 15) if (allowed(p[0], p[1], h, 90)) views.push({ i, h, p, near: near.filter((n) => Math.abs(((n.b - h + 540) % 360) - 180) <= 45) });
  }
  const year = (v) => new Date(v.i.captured_at).getUTCFullYear(), covered = new Set(), pick = [];
  for (;;) {
    let best = null, score = 0;
    for (const v of views) {
      const n = v.near.filter((x) => !covered.has(x.t)).length, s = n + year(v) / 1e4;
      if (n >= 3 && s > score) [best, score] = [v, s];
    }
    if (!best) break;
    for (const x of best.near) covered.add(x.t);
    pick.push(best);
  }
  let added = 0;
  for (const v of pick) {
    const id = `trees-${v.i.id}-${v.h}`;
    if (refs.photos.some((e) => e.id === id)) continue;
    const { lat, lon } = at(v.i), up = v.near.map((x) => Math.atan2(world.height(x.t.cx, x.t.cz) + (x.t.foot + x.t.h) / 2 - world.height(v.p[0], v.p[1]) - 2.2, x.d));
    const pitch = Math.max(0, Math.min(25, Math.round((up.reduce((a, b) => a + b, 0) / up.length) * 180 / Math.PI)));
    refs.photos.push({ id, what: 'trees', name: `The trees round a panorama in leaf, ${v.near.length} of the shooter's area's`, use: 'reference', heading: v.h, pitch, fov: 90, photo: { source: 'mapillary', id: v.i.id, url: `https://www.mapillary.com/app/?pKey=${v.i.id}`, author: v.i.creator?.username ?? '', licence: 'CC BY-SA 4.0', date: new Date(v.i.captured_at).toISOString().slice(0, 10), lat: +lat.toFixed(6), lon: +lon.toFixed(6), ...panoFrame(v.i.computed_rotation), pano: true }, notes: 'Task 088: what species the trees are, in leaf.' });
    added++;
  }
  fs.writeFileSync(file, JSON.stringify(refs, null, 2) + '\n');
  console.log(`${pick.length} views of ${covered.size} of the shooter's area's ${trees.length} trees, from ${new Set(pick.map((v) => v.i.id)).size} panoramas; ${added} new in refs/photos.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'tools', 'species.mjs')) {
  if (process.argv[2] === 'summer') await summer();
  if (process.argv[2] === 'mark') await mark(process.argv.slice(3));
  if (process.argv[2] === 'shooter') await shooter();
}
