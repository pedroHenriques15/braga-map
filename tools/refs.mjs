// Fetches each viewpoint's real photo (refs/viewpoints.json) into .cache/refs/<id>.jpg, for setting
// beside the game's shot from the same place. A Mapillary panorama is cut to what the viewpoint's
// camera sees: 1280 × 720, its heading, pitch and field of view, the panorama's own tilt undone.
// Other photos are kept as they are.
// Mapillary needs its free client token, kept out of git in .cache/credentials.json as
// { "mapillary": { "token": "MLY|…" } }, or in MAPILLARY_TOKEN.
//
// node tools/refs.mjs              the photos not fetched yet
// node tools/refs.mjs --force      all of them again
// node tools/refs.mjs fujacal-1    only those named
import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';
import { CACHE, ROOT } from './geo.mjs';

const UA = 'braga-map/1.0 (https://github.com/pedroHenriques15/braga-map)';
const OUT = path.join(CACHE, 'refs');
const SRC = path.join(OUT, 'src');
const W = 1280, H = 720;

// The compass heading (0 north, 90 east) and pitch the camera at (x, y, z) looks along to (tx, ty, tz).
function aim(v) {
  const dx = v.tx - v.x, dy = v.ty - v.y, dz = v.tz - v.z;
  return { heading: ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360, pitch: (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI };
}

// A camera's axes in the world (east, north, up), from its compass heading, its pitch (up is
// positive) and its roll, in degrees: right, down and forward. Mapillary's computed_rotation gives
// the same axes.
function frame(heading, pitch, roll) {
  const R = Math.PI / 180, h = heading * R, p = pitch * R, r = roll * R;
  const f = [Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)];
  const r0 = [Math.cos(h), -Math.sin(h), 0];
  const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]];
  const right = r0.map((v, i) => v * Math.cos(r) - u0[i] * Math.sin(r));
  const down = u0.map((v, i) => -(v * Math.cos(r) + r0[i] * Math.sin(r)));
  return [right, down, f];
}

// What a level camera with a vertical field of view `fov`, looking along `heading` and `pitch`, sees
// of an equirectangular panorama taken by a camera turned as `photo` says (heading, pitch, roll):
// an RGBA image `w` × `h`.
function cut(pano, photo, heading, pitch, fov, w = W, h = H) {
  const out = Buffer.alloc(w * h * 4);
  const ty = Math.tan(((fov / 2) * Math.PI) / 180), tx = ty * (w / h);
  const [vr, vd, vf] = frame(heading, pitch, 0), [pr, pd, pf] = frame(photo.heading, photo.pitch ?? 0, photo.roll ?? 0);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const at = (u, v, c) => pano.data[(v * pano.width + u) * 4 + c];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      // The pixel's ray in the world, then in the panorama's camera.
      const x = ((2 * (i + 0.5)) / w - 1) * tx, y = ((2 * (j + 0.5)) / h - 1) * ty;
      const d = [0, 1, 2].map((k) => vf[k] + x * vr[k] + y * vd[k]);
      const xc = dot(d, pr), yc = dot(d, pd), zc = dot(d, pf);
      const lon = Math.atan2(xc, zc), lat = Math.atan2(-yc, Math.hypot(xc, zc));
      const px = ((lon / (2 * Math.PI) + 0.5) * pano.width - 0.5 + pano.width) % pano.width, py = Math.min(pano.height - 1.001, Math.max(0, (0.5 - lat / Math.PI) * pano.height - 0.5));
      const x0 = Math.floor(px), y0 = Math.floor(py), x1 = (x0 + 1) % pano.width, fx = px - x0, fy = py - y0;
      for (let c = 0; c < 3; c++) {
        out[(j * w + i) * 4 + c] = (at(x0, y0, c) * (1 - fx) + at(x1, y0, c) * fx) * (1 - fy) + (at(x0, y0 + 1, c) * (1 - fx) + at(x1, y0 + 1, c) * fx) * fy;
      }
      out[(j * w + i) * 4 + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

function token() {
  if (process.env.MAPILLARY_TOKEN) return process.env.MAPILLARY_TOKEN;
  const file = path.join(CACHE, 'credentials.json');
  const t = fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).mapillary?.token;
  if (!t) throw new Error('Mapillary needs its client token in .cache/credentials.json ({ "mapillary": { "token": "MLY|…" } }) or MAPILLARY_TOKEN');
  return t;
}

async function get(url, headers = {}) {
  for (let tries = 0; ; tries++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, ...headers } });
    if (r.ok) return r;
    if (tries === 3 || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} for ${url.replace(/access_token=[^&]+/, 'access_token=…')}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (tries + 1)));
  }
}

// The photo as its source has it, kept in .cache/refs/src/ so it's downloaded once.
async function original(photo) {
  const file = path.join(SRC, `${photo.source}-${String(photo.id).replace(/[^\w.-]+/g, '_')}.jpg`);
  if (!fs.existsSync(file)) {
    let url;
    if (photo.source === 'mapillary') {
      const r = await get(`https://graph.mapillary.com/${photo.id}?fields=thumb_original_url,thumb_2048_url`, { authorization: 'OAuth ' + token() });
      const j = await r.json();
      url = photo.pano ? j.thumb_original_url : j.thumb_2048_url;
    } else if (photo.source === 'commons') {
      const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1600', titles: 'File:' + photo.id });
      const j = await (await get('https://commons.wikimedia.org/w/api.php?' + q)).json();
      url = j.query.pages[0].imageinfo[0].thumburl;
    } else throw new Error(`can't fetch a photo from ${photo.source}`);
    fs.writeFileSync(file, Buffer.from(await (await get(url)).arrayBuffer()));
  }
  return file;
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const views = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8')).viewpoints;
fs.mkdirSync(SRC, { recursive: true });
for (const v of views) {
  if (only.length && !only.includes(v.id)) continue;
  const file = path.join(OUT, v.id + '.jpg');
  if (fs.existsSync(file) && !force && !only.length) continue;
  const src = await original(v.photo);
  if (v.photo.pano) {
    const { heading, pitch } = aim(v);
    const pano = jpeg.decode(fs.readFileSync(src), { maxMemoryUsageInMB: 2048 });
    fs.writeFileSync(file, jpeg.encode(cut(pano, v.photo, heading, pitch, v.fov), 88).data);
  } else fs.copyFileSync(src, file);
  console.log(v.id, path.relative(ROOT, file));
}
