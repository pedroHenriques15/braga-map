// Which buildings need their facade looked at (task 017): every building in the shooter's area, and
// every one in view of a viewpoint (refs/viewpoints.json, but the skylines), each with what the map
// knows of it and the reference photos that show it. refs/buildings.json holds what was seen.
//
// node tools/buildings.mjs           the list, into .cache/buildings/todo.json, and what's missing
// node tools/buildings.mjs mark      the photos with their buildings outlined and numbered, for
//                                    looking at, into .cache/buildings/marked/: each facade photo
//                                    and each viewpoint's photo, with <id>.json saying which number
//                                    is which building, and how much of the photo it takes (%)
//
// A building is named as the reference photos name it: way/<id> or relation/<id>, OpenStreetMap's,
// or lidar/x<x>z<z>, one the map lacks, by the middle of its outline (tools/footprints.mjs).
// Whether a viewpoint sees it: rays across its camera's view, a ray every 5 pixels of a 1280-wide
// shot, against the buildings as the world has them (each part up to its ridge) and the ground,
// out to 1 km; seen if it takes 4 rays or more (about 0.1% of the shot). A photo's buildings are
// outlined the same way, from where Mapillary says its camera was: 1–3 m out, so an outline can be
// a little off the building it names.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CACHE, P, readCache, ROOT } from './geo.mjs';
import { footprints, inside, ringArea, ringOf } from './osm.mjs';
import { inShooter } from './sections.mjs';
import { loadWorld } from '../index.js';

const OUT = path.join(CACHE, 'buildings');

// Every building of the map's with its name: OpenStreetMap's outlines, and the LiDAR's for those it
// lacks, each with its outline in the map's metres and its tags.
export function named() {
  const out = [];
  for (const el of readCache('osm/buildings.json').elements) {
    // A relation's outer rings each a footprint of it.
    for (const e of footprints({ elements: [el] })) {
      let pts = ringOf(e);
      if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
      if (pts.length < 3) continue;
      out.push({ id: `${el.type}/${el.id}`, pts, tags: el.tags ?? {}, osm: true });
    }
  }
  for (const f of readCache('roofs.json').found) {
    const n = f.pts.length, cx = f.pts.reduce((s, p) => s + p[0], 0) / n, cz = f.pts.reduce((s, p) => s + p[1], 0) / n;
    out.push({ id: `lidar/x${Math.round(cx)}z${Math.round(cz)}`, pts: f.pts, tags: {}, osm: false });
  }
  for (const b of out) {
    b.cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length;
    b.cz = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
    b.area = ringArea(b.pts);
  }
  return out;
}

// A finder of the named building a point is in: the smallest, as an outline mapped inside another
// is the inner one's.
export function finder(list) {
  const cells = new Map(), C = 50, key = (i, j) => i * 100000 + j;
  for (const b of list) {
    const xs = b.pts.map((p) => p[0]), zs = b.pts.map((p) => p[1]);
    for (let i = Math.floor(Math.min(...xs) / C); i <= Math.floor(Math.max(...xs) / C); i++) {
      for (let j = Math.floor(Math.min(...zs) / C); j <= Math.floor(Math.max(...zs) / C); j++) {
        const k = key(i, j);
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(b);
      }
    }
  }
  return (x, z) => {
    let best = null;
    for (const b of cells.get(key(Math.floor(x / C), Math.floor(z / C))) ?? []) if (inside(b.pts, x, z) && (!best || b.area < best.area)) best = b;
    return best;
  };
}

// A camera: where it is (x, y, z, the map's), and its axes in the map: forward, right and down, and
// how far across and up its view reaches at a distance of 1 (the tangents of half its fields of view).
const unit = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// A viewpoint's: from (x, y, z) towards (tx, ty, tz), its vertical field of view, as wide as `aspect`.
export function viewCamera(v, aspect) {
  const f = unit([v.tx - v.x, v.ty - v.y, v.tz - v.z]), r = unit([-f[2], 0, f[0]]), up = cross(r, f);
  const ty = Math.tan((v.fov * Math.PI) / 360);
  return { o: [v.x, v.y, v.z], f, r, d: up.map((c) => -c), tx: ty * aspect, ty };
}
// A photo's, from its compass heading, pitch and roll (refs.mjs's frame, in east, north and up), its
// field of view across and its shape; standing `eye` metres over the ground at its place.
export function photoCamera(photo, heading, pitch, roll, fov, aspect, height, eye) {
  const R = Math.PI / 180, h = heading * R, p = pitch * R, q = roll * R;
  const f = [Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)];
  const r0 = [Math.cos(h), -Math.sin(h), 0], u0 = cross(r0, f);
  const right = r0.map((v, i) => v * Math.cos(q) - u0[i] * Math.sin(q));
  const down = u0.map((v, i) => -(v * Math.cos(q) + r0[i] * Math.sin(q)));
  // East, north, up to the map's x, y, z.
  const m = ([e, n, u]) => [e, u, -n];
  const [x, z] = P(photo);
  const tx = Math.tan((fov * R) / 2);
  return { o: [x, height(x, z) + eye, z], f: m(f), r: m(right), d: m(down), tx, ty: tx / aspect };
}
// The camera's ray through (a, b), from -1 to 1 across and down its view.
const ray = (c, a, b) => unit([0, 1, 2].map((k) => c.f[k] + a * c.tx * c.r[k] + b * c.ty * c.d[k]));

// Where a ray from o along d first meets a part (a prism from its ground y0 to its top y1), or Infinity.
export function hitPart(o, d, p) {
  let best = Infinity;
  const pts = p.pts;
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length];
    const ex = bx - ax, ez = bz - az, den = d[0] * ez - d[2] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - o[0]) * ez - (az - o[2]) * ex) / den, s = ((ax - o[0]) * d[2] - (az - o[2]) * d[0]) / den;
    if (t <= 0 || s < 0 || s > 1 || t >= best) continue;
    const y = o[1] + d[1] * t;
    if (y >= p.y0 && y <= p.y1) best = t;
  }
  // Its top, seen from above.
  if (d[1] < 0 && o[1] > p.y1) {
    const t = (p.y1 - o[1]) / d[1];
    if (t < best && inside(pts, o[0] + d[0] * t, o[2] + d[2] * t)) best = t;
  }
  return best;
}

// What a camera sees, w × h rays: the name of the building each takes first (null for none, or the
// ground before it), out to `far` metres.
export function labels(c, parts, height, w, h, far) {
  // The parts in front of the camera and within reach.
  const near = parts.filter((p) => {
    const q = [p.cx - c.o[0], 0, p.cz - c.o[2]], l = Math.hypot(q[0], q[2]);
    return l < far + p.r && (l < p.r + 5 || (q[0] * c.f[0] + q[2] * c.f[2]) / (Math.hypot(c.f[0], c.f[2]) || 1) > -p.r);
  });
  const out = new Array(w * h).fill(null), o = c.o;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const d = ray(c, (2 * (i + 0.5)) / w - 1, (2 * (j + 0.5)) / h - 1), dl = Math.hypot(d[0], d[2]) || 1e-9;
      let t = Infinity, who = null;
      for (const p of near) {
        // The part's circle, against the ray's line in plan.
        const qx = p.cx - o[0], qz = p.cz - o[2], along = (qx * d[0] + qz * d[2]) / dl;
        if (along < -p.r || Math.abs(qx * d[2] - qz * d[0]) / dl > p.r || (along - p.r) / dl > t) continue;
        const hp = hitPart(o, d, p);
        if (hp < t) { t = hp; who = p.name; }
      }
      if (!who) continue;
      // The ground in front of it, every 2 m.
      let hidden = false;
      for (let s = 2; s < Math.min(t, far); s += 2) if (o[1] + d[1] * s < height(o[0] + d[0] * s, o[2] + d[2] * s) - 0.3) { hidden = true; break; }
      if (!hidden) out[j * w + i] = who;
    }
  }
  return out;
}

// The size of a JPEG, from its frame header.
export function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length; ) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

// The world round every viewpoint and the shooter's area, and each of its parts with the name of the
// building it's of.
async function prepare() {
  const list = named(), find = finder(list);
  const views = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8')).viewpoints.filter((v) => v.kind !== 'skyline');
  const photos = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos;
  const xs = views.map((v) => v.x), zs = views.map((v) => v.z);
  const world = await loadWorld({ x0: Math.min(...xs, -400) - 1000, x1: Math.max(...xs, 400) + 1000, z0: Math.min(...zs, 600) - 1000, z1: Math.max(...zs, 1100) + 1000 });
  const parts = [];
  for (const b of world.buildings) {
    const cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length, cz = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
    const owner = find(cx, cz);
    if (!owner) continue;
    parts.push({ name: owner.id, pts: b.pts, cx, cz, r: Math.max(...b.pts.map(([x, z]) => Math.hypot(x - cx, z - cz))), y0: b.y - 0.6, y1: b.y + b.ridge, h: b.h, floors: b.floors, kind: b.kind, measured: b.measured });
  }
  return { list, views, photos, world, parts };
}

// The list: which buildings, why, and with which photos.
async function makeList() {
  const { list, views, photos, world, parts } = await prepare();
  const of = new Map(list.map((b) => [b.id, b]));
  const want = new Map(); // name → { why, seen: { viewpoint: rays } }
  const add = (name, why) => {
    if (!want.has(name)) want.set(name, { why: new Set(), seen: {} });
    want.get(name).why.add(why);
    return want.get(name);
  };
  const drawn = new Set(parts.map((p) => p.name));
  for (const b of list) if (inShooter(b.cx, b.cz) && drawn.has(b.id)) add(b.id, 'shooter');
  for (const v of views) {
    const file = path.join(CACHE, 'refs', v.id + '.jpg'), s = fs.existsSync(file) ? jpegSize(file) : null, aspect = s ? s.w / s.h : 16 / 9;
    const W = 256, H = Math.round(W / aspect), seen = new Map();
    for (const name of labels(viewCamera(v, aspect), parts, world.height, W, H, 1000)) if (name) seen.set(name, (seen.get(name) ?? 0) + 1);
    let n = 0;
    for (const [name, k] of seen) if (k >= 4) { add(name, 'view').seen[v.id] = k; n++; }
    console.log(`${v.id.padEnd(22)} ${n} buildings in view (${seen.size} glimpsed)`);
  }
  const shots = new Map(); // name → its facade photos
  for (const p of photos) if (p.what.startsWith('facade:')) {
    const name = p.what.slice(7);
    if (!shots.has(name)) shots.set(name, []);
    shots.get(name).push(p.id);
  }
  const file = path.join(ROOT, 'refs', 'buildings.json'), done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).buildings : {};
  const todo = [...want].map(([name, w]) => {
    const b = of.get(name), ps = parts.filter((p) => p.name === name), t = b.tags;
    return {
      id: name,
      why: [...w.why],
      seen: w.seen,
      x: Math.round(b.cx), z: Math.round(b.cz), area: Math.round(b.area),
      eaves: Math.round(Math.max(...ps.map((p) => p.h)) * 10) / 10, floors: Math.max(...ps.map((p) => p.floors)), measured: ps.some((p) => p.measured),
      tags: Object.fromEntries(Object.entries(t).filter(([k]) => /^(building|name|shop|amenity|office|craft|roof:colour|height)/.test(k))),
      photos: shots.get(name) ?? [],
      done: name in done,
    };
  });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'todo.json'), JSON.stringify(todo, null, 1));
  const n = (f) => todo.filter(f).length;
  console.log(`${todo.length} buildings: ${n((b) => b.why.includes('shooter'))} in the shooter's area, ${n((b) => b.why.includes('view'))} in view of a viewpoint (${n((b) => b.why.includes('view') && !b.why.includes('shooter'))} outside the area); ${n((b) => b.photos.length)} with a facade photo; ${n((b) => b.done)} done, ${n((b) => !b.done)} to do`);
}

// A colour for each name, the same every time.
const hue = (name) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${h % 360},95%,55%)`; };

// A photo with its buildings outlined: each building's edge (where what the rays meet changes) in its
// own colour, and its number at its middle, `star` thicker and in yellow. Writes the image and which
// number is which building, those in the list only.
async function outline(src, cam, parts, height, far, wanted, star, out) {
  const s = jpegSize(src), scale = Math.min(1, 1600 / s.w), w = Math.round(s.w * scale), h = Math.round(s.h * scale);
  const LW = 320, LH = Math.round((LW * h) / w), lab = labels(cam, parts, height, LW, LH, far);
  const cx = w / LW, cy = h / LH, cells = new Map();
  lab.forEach((n, k) => { if (n) { if (!cells.has(n)) cells.set(n, []); cells.get(n).push(k); } });
  const legend = {}, svg = [];
  let num = 0;
  // The biggest first, so the numbers go down the photo's own order of importance.
  const order = [...cells].filter(([n, ks]) => wanted.has(n) && ks.length >= 3).sort((a, b) => b[1].length - a[1].length);
  for (const [name, ks] of order) {
    const label = name === star ? '★' : String(++num);
    legend[label] = { id: name, share: Math.round((ks.length / lab.length) * 1000) / 10 };
    const col = name === star ? '#ffe600' : hue(name), sw = name === star ? 3 : 1.6;
    // Its edge: each cell side where the next cell is another's.
    let d = '';
    for (const k of ks) {
      const i = k % LW, j = Math.floor(k / LW), x0 = i * cx, y0 = j * cy;
      if (i === 0 || lab[k - 1] !== name) d += `M${x0.toFixed(1)},${y0.toFixed(1)}v${cy.toFixed(1)}`;
      if (i === LW - 1 || lab[k + 1] !== name) d += `M${(x0 + cx).toFixed(1)},${y0.toFixed(1)}v${cy.toFixed(1)}`;
      if (j === 0 || lab[k - LW] !== name) d += `M${x0.toFixed(1)},${y0.toFixed(1)}h${cx.toFixed(1)}`;
      if (j === LH - 1 || lab[k + LW] !== name) d += `M${x0.toFixed(1)},${(y0 + cy).toFixed(1)}h${cx.toFixed(1)}`;
    }
    svg.push(`<path d="${d}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="square"/>`);
    const mx = (ks.reduce((a, k) => a + (k % LW), 0) / ks.length + 0.5) * cx, my = (ks.reduce((a, k) => a + Math.floor(k / LW), 0) / ks.length + 0.5) * cy;
    const fs_ = name === star ? 34 : 24;
    svg.push(`<text x="${mx.toFixed(0)}" y="${my.toFixed(0)}" font-family="Arial" font-weight="bold" font-size="${fs_}" fill="${col}" stroke="#000" stroke-width="4" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${label}</text>`);
  }
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svg.join('')}</svg>`);
  await sharp(src).resize(w, h).composite([{ input: overlay }]).jpeg({ quality: 82 }).toFile(out + '.jpg');
  fs.writeFileSync(out + '.json', JSON.stringify({ size: [w, h], legend }, null, 1));
  return legend;
}

async function mark() {
  const { views, photos, world, parts } = await prepare();
  const todo = JSON.parse(fs.readFileSync(path.join(OUT, 'todo.json'), 'utf8'));
  const wanted = new Set(todo.map((b) => b.id));
  const dir = path.join(OUT, 'marked');
  fs.mkdirSync(dir, { recursive: true });
  const only = process.argv.slice(3);
  for (const v of views) {
    if (only.length && !only.includes(v.id)) continue;
    const src = path.join(CACHE, 'refs', v.id + '.jpg'), s = jpegSize(src);
    const legend = await outline(src, viewCamera(v, s.w / s.h), parts, world.height, 1000, wanted, null, path.join(dir, v.id));
    console.log(`${v.id}: ${Object.keys(legend).length} buildings`);
  }
  for (const p of photos) {
    if (!p.what.startsWith('facade:') || !wanted.has(p.what.slice(7)) || (only.length && !only.includes(p.id))) continue;
    const src = fs.readdirSync(path.join(CACHE, 'refs', 'photos')).find((f) => f.replace(/\.\w+$/, '') === p.id);
    if (!src) continue;
    const file = path.join(CACHE, 'refs', 'photos', src), s = jpegSize(file);
    if (!s) continue;
    // A panorama's cut is level, along the heading and pitch it was cut at; a flat photo is as its
    // camera was turned, as wide as the photo's own view.
    const cam = p.photo.pano
      ? photoCamera(p.photo, p.heading, p.pitch, 0, p.fov, s.w / s.h, world.height, 2.2)
      : photoCamera(p.photo, p.photo.heading, p.photo.pitch ?? 0, p.photo.roll ?? 0, p.fov, s.w / s.h, world.height, 1.4);
    const legend = await outline(file, cam, parts, world.height, 300, wanted, p.what.slice(7), path.join(dir, p.id));
    console.log(`${p.id}: ${'★' in legend ? '' : '(its building not found) '}${Object.keys(legend).length} buildings`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'tools', 'buildings.mjs')) {
  if (process.argv[2] === 'mark') await mark();
  else await makeList();
}
