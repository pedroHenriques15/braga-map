// Photo textures for the world (task 007, decision 030): the 2025 orthophoto over a tile, the
// reference photos of facades (task 008) straightened onto their walls, and a photo of each kind of
// ground (task 016: Poly Haven's, CC0, which a game tiles over the ground cover.mjs classes), made as
// refs/textures.json says. Each is cut for each graphics level, compressed as KTX2 (Basis Universal's ETC1S, which a
// phone's graphics card keeps compressed), and written into its tile's index with its credit, for
// loadWorld to hand a game.
//
// node tools/textures.mjs            every texture in refs/textures.json (about a minute)
// node tools/textures.mjs <id>…      only those; the index keeps the rest
// node tools/textures.mjs --check    and each one at High, as a PNG, into .cache/textures/
// node tools/textures.mjs --compare  and each one as WebP and as Basis's UASTC too, into
//                                    .cache/textures/compare/, for weighing the formats (task 007)
//
// world/textures/<tile>/<id>-<level>.ktx2   the textures, for each level: high, medium, low
// world/textures/<tile>.js                  the tile's index (index.d.ts's PhotoTexture)
// world/textures/surfaces/<id>-<level>.ktx2 each kind of ground's, on no tile
// world/textures/trees/<id>-<level>.ktx2    each kind of tree's bark and leaves (task 019), on no tile
// world/textures.js                         TEXTURES, a loader of each tile's index; SURFACES, each
//                                           kind of ground's (index.d.ts's GroundTexture); TREES, each
//                                           kind of tree's bark and leaves (TreeTexture); and CREDITS
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CACHE, ROOT } from './geo.mjs';
import { four, js, ktx2, ktx2Size, resize } from './ktx2.mjs';
import { DGT, mapToTM, tileBox, tileKey, tilesOver } from './dgt.mjs';
import { loadWorld, map } from '../index.js';

const OUT = path.join(ROOT, 'world', 'textures');
const WORK = path.join(CACHE, 'textures');
const LEVELS = ['high', 'medium', 'low'];
// A ground texture's side at each level: a tile's 500 m at 24 cm a pixel on High (the orthophoto has
// 25), 49 on Medium and 98 on Low, against the painted ground's 1, 1.4 and 2 m.
const GROUND = { high: 2048, medium: 1024, low: 512 };
// A facade's pixels a metre at each level, as far as its photo has them: 2.5 cm a pixel on High.
const FACADE = { high: 40, medium: 20, low: 10 };
const MAX = 2048;
// A kind of ground's side at each level: 1 to 4 mm a pixel on High, as its photo spans 1 to 4 m.
const SURFACE = { high: 1024, medium: 512, low: 256 };
// A tree's bark and leaves (task 019) at each level: a bark photo spanning about 1 to 2 m, a spray of
// leaves about 1 m.
const TREE = { high: 512, medium: 256, low: 128 };
const DGT_CREDIT = { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' };

// ---- Pixels ----

// An RGB image: { w, h, data } with three bytes a pixel.
async function readRGB(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data };
}

// The colour at (u, v) in an RGB image's pixels (their centres at whole numbers + 0.5), between them.
function sample(img, u, v, out, o) {
  const fx = Math.max(0, Math.min(img.w - 1.001, u - 0.5)), fy = Math.max(0, Math.min(img.h - 1.001, v - 0.5));
  const x = Math.floor(fx), y = Math.floor(fy), a = fx - x, b = fy - y, d = img.data, k = (y * img.w + x) * 3, s = img.w * 3;
  for (let c = 0; c < 3; c++) out[o + c] = (d[k + c] * (1 - a) + d[k + 3 + c] * a) * (1 - b) + (d[k + s + c] * (1 - a) + d[k + s + 3 + c] * a) * b;
}

// The homography taking each of four points `from` to its `to`: [u, v] for [x, y].
function homography(from, to) {
  const A = [];
  for (let k = 0; k < 4; k++) {
    const [x, y] = from[k], [u, v] = to[k];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const h = A.map((row, i) => row[8] / row[i]);
  return (x, y) => {
    const w = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
  };
}

// ---- What each texture is made from ----

// The orthophoto over a tile on the map's grid, `n` pixels a side, row 0 to the north. Its shadows
// and cars stay in it: lifting the shadows the LiDAR's surface model casts leaves bright halos, as
// the photo's buildings lean and its trees aren't the LiDAR's, and lifting what's dark and blue in
// the photo turns dark roofs and asphalt violet (task 007's notes). Most cars are on the streets,
// which a game draws over the ground.
async function ground(t, n) {
  const m = map(), [i, j] = t.tile.match(/-?\d+/g).map(Number);
  const box = { x0: i * m.tile, z0: j * m.tile, x1: (i + 1) * m.tile, z1: (j + 1) * m.tile };
  const photos = new Map();
  for (const key of tilesOver(box)) {
    const file = path.join(DGT, 'ortho', key + '.jpg');
    if (!fs.existsSync(file)) throw new Error(`${t.id}: the orthophoto's ${key} isn't fetched (node tools/fetch.mjs ortho)`);
    photos.set(key, await readRGB(file));
  }
  const tm = mapToTM(box), data = Buffer.alloc(n * n * 3), px = [0, 0, 0];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const [e, nn] = tm(box.x0 + ((c + 0.5) / n) * (box.x1 - box.x0), box.z0 + ((r + 0.5) / n) * (box.z1 - box.z0));
      const key = tileKey(e, nn), img = photos.get(key), b = tileBox(key);
      sample(img, (e - b.e0) * (img.w / 1000), (b.n1 - nn) * (img.h / 1000), px, 0);
      data.set(px, (r * n + c) * 3);
    }
  }
  return { img: { w: n, h: n, data }, place: { box }, credit: DGT_CREDIT };
}

// A facade: its photo's quad straightened onto the wall, `density` pixels a metre at most (its
// photo's own where that's less).
async function facade(t, world, photos) {
  const ref = photos.find((p) => p.id === t.photo);
  if (!ref) throw new Error(`${t.id}: no photo ${t.photo} in refs/photos.json`);
  const file = ['.jpg', '.png'].map((x) => path.join(CACHE, 'refs', 'photos', t.photo + x)).find((f) => fs.existsSync(f));
  if (!file) throw new Error(`${t.id}: its photo isn't fetched (node tools/refs.mjs ${t.photo})`);
  const place = wall(t, world), [s0, s1] = place.s, [y0, y1] = t.y;
  const photo = await readRGB(file);
  const [TL, TR, BR, BL] = t.quad;
  // The photo's own pixels a metre, along the wall and up it.
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const own = Math.max(Math.max(len(TL, TR), len(BL, BR)) / (s1 - s0), Math.max(len(TL, BL), len(TR, BR)) / (y1 - y0));
  const d = Math.min(own, FACADE.high), w = four(Math.min(MAX, (s1 - s0) * d)), h = four(Math.min(MAX, (y1 - y0) * d));
  const H = homography([[0, 0], [1, 0], [1, 1], [0, 1]], [TL, TR, BR, BL]);
  // Each pixel the average of 3 × 3 rays, so a photo with more detail than the texture doesn't alias.
  const data = Buffer.alloc(w * h * 3), px = [0, 0, 0], sum = [0, 0, 0], N = 3;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    sum[0] = sum[1] = sum[2] = 0;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      const [u, v] = H((c + (b + 0.5) / N) / w, (r + (a + 0.5) / N) / h);
      sample(photo, u, v, px, 0);
      sum[0] += px[0]; sum[1] += px[1]; sum[2] += px[2];
    }
    for (let ch = 0; ch < 3; ch++) data[(r * w + c) * 3 + ch] = sum[ch] / (N * N);
  }
  const p = ref.photo;
  return {
    img: { w, h, data },
    own: Math.round(own),
    place: { ...place, y: [+(place.foot + y0).toFixed(2), +(place.foot + y1).toFixed(2)] },
    credit: { source: p.source === 'mapillary' ? 'Mapillary' : 'Wikimedia Commons', author: p.author, licence: p.licence, url: p.url, date: p.date },
  };
}

// Where a facade goes: its wall's points, checked against a building's footprint in the world (each
// step along it one of the footprint's edges, to 0.75 m), the metres along the wall it spans, the
// building's ground, and its facade's colour (task 017).
function wall(t, world) {
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.75;
  const b = world.buildings.find((b) => t.wall.every((p) => b.pts.some((q) => near(p, q))));
  if (!b) throw new Error(`${t.id}: no building in the world has the wall's points ${JSON.stringify(t.wall)}; read them again off the map`);
  const [a, z] = [t.wall[0], t.wall[t.wall.length - 1]], L = Math.hypot(z[0] - a[0], z[1] - a[1]);
  const s = t.s ?? [0, +L.toFixed(2)];
  if (t.y[1] > b.h + 1) console.warn(`  ${t.id}: its top, ${t.y[1]} m, is over the building's ${b.h} m`);
  return { wall: t.wall, s, foot: b.y, h: b.h, colour: b.facade.colour };
}

// What colour a facade's wall is in its photo (task 017): the median of the patch of plain wall the
// session that looked at its building marked in this photo (refs/buildings.json's `patch`), or without
// one, the texture's pixels' median, of those between the 40th and the 85th in brightness, which leaves
// out the windows, the shadows and the sky's glare. A game takes it out and puts the building's own
// colour in, so the photo's light and white balance (dusk, a low sun, a phone's) are the game's.
const seenFaces = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'buildings.json'), 'utf8')).buildings;
async function wallColourOf(t, img, photos) {
  const ref = photos.find((p) => p.id === t.photo), e = seenFaces[ref.what.replace(/^facade:/, '')];
  if (e?.seen === t.photo && e.patch) {
    const file = ['.jpg', '.png'].map((x) => path.join(CACHE, 'refs', 'photos', t.photo + x)).find((f) => fs.existsSync(f));
    const photo = await readRGB(file), [x0, y0, x1, y1] = e.patch.map(Math.round), ch = [[], [], []];
    for (let y = Math.max(0, y0); y < Math.min(photo.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(photo.w, x1); x++) for (let c = 0; c < 3; c++) ch[c].push(photo.data[(y * photo.w + x) * 3 + c]);
    if (ch[0].length >= 50) return ch.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
  }
  return wallColour(img);
}
function wallColour(img) {
  const n = img.w * img.h, lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.2126 * img.data[i * 3] + 0.7152 * img.data[i * 3 + 1] + 0.0722 * img.data[i * 3 + 2];
  const sorted = Float32Array.from(lum).sort(), lo = sorted[Math.floor(n * 0.4)], hi = sorted[Math.floor(n * 0.85)];
  const ch = [[], [], []];
  for (let i = 0; i < n; i++) if (lum[i] >= lo && lum[i] <= hi) for (let c = 0; c < 3; c++) ch[c].push(img.data[i * 3 + c]);
  return ch.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
}

// A kind of ground (task 016): a photo of it from Poly Haven (CC0), seamless, spanning `metres` a side as
// its record says; and its mean colour, which a game divides it by before tinting it with the ground's
// own colour (cover.mjs). The record and the photo are kept in .cache/textures/sources/.
async function surface(t) {
  const dir = path.join(WORK, 'sources'), info = path.join(dir, t.asset + '.json'), jpg = path.join(dir, t.asset + '.jpg');
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(info) || !fs.existsSync(jpg)) {
    const get = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${t.id}: ${url} answered ${r.status}`);
      return r;
    };
    const rec = await (await get(`https://api.polyhaven.com/info/${t.asset}`)).json();
    const files = await (await get(`https://api.polyhaven.com/files/${t.asset}`)).json();
    fs.writeFileSync(jpg, Buffer.from(await (await get(files.Diffuse['2k'].jpg.url)).arrayBuffer()));
    fs.writeFileSync(info, JSON.stringify(rec));
  }
  const rec = JSON.parse(fs.readFileSync(info, 'utf8'));
  const img = await resize(await readRGB(jpg), SURFACE.high, SURFACE.high);
  // The mean in linear light, as a graphics card reads the texture, in sRGB's bytes.
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const srgb = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
  const sum = [0, 0, 0];
  for (let i = 0; i < img.data.length; i += 3) for (let c = 0; c < 3; c++) sum[c] += lin(img.data[i + c]);
  const n = img.data.length / 3, metres = +(Math.min(...rec.dimensions) / 1000).toFixed(2);
  const date = new Date(rec.date_published * 1000).toISOString().slice(0, 10);
  return {
    img,
    place: { ground: t.ground, metres, mean: sum.map((v) => srgb(v / n)) },
    credit: { source: 'Poly Haven', author: Object.keys(rec.authors).join(', '), licence: 'CC0', url: `https://polyhaven.com/a/${t.asset}`, date },
  };
}

// A Poly Haven asset's record and the files of it named (their 2k JPEGs), kept in .cache/textures/sources/.
async function polyHaven(asset, keys) {
  const dir = path.join(WORK, 'sources'), info = path.join(dir, asset + '.json');
  fs.mkdirSync(dir, { recursive: true });
  const get = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${asset}: ${url} answered ${r.status}`);
    return r;
  };
  const files = keys.map((k) => path.join(dir, `${asset}-${k}.jpg`));
  if (!fs.existsSync(info) || files.some((f) => !fs.existsSync(f))) {
    const rec = await (await get(`https://api.polyhaven.com/info/${asset}`)).json();
    const list = await (await get(`https://api.polyhaven.com/files/${asset}`)).json();
    for (const [i, k] of keys.entries()) fs.writeFileSync(files[i], Buffer.from(await (await get(list[k]['2k'].jpg.url)).arrayBuffer()));
    fs.writeFileSync(info, JSON.stringify(rec));
  }
  const rec = JSON.parse(fs.readFileSync(info, 'utf8'));
  const date = new Date(rec.date_published * 1000).toISOString().slice(0, 10);
  return { rec, files, credit: { source: 'Poly Haven', author: Object.keys(rec.authors).join(', '), licence: 'CC0', url: `https://polyhaven.com/a/${asset}`, date } };
}

// The mean of an image's pixels (those not see-through) in linear light, as a graphics card reads it, in
// sRGB's bytes.
function meanOf(img) {
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const srgb = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
  const ch = img.channels ?? 3, sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < img.data.length; i += ch) {
    if (ch === 4 && img.data[i + 3] < 128) continue;
    for (let c = 0; c < 3; c++) sum[c] += lin(img.data[i + c]);
    n++;
  }
  return sum.map((v) => srgb(v / n));
}

// A tree's bark (task 019): a seamless photo of it from Poly Haven (CC0), spanning `metres` a side, to
// wrap round its trunk; or, where the recipe gives it a `tone` (task 061: a birch's white bark, which Poly
// Haven hasn't, from a cherry's with the same bands of lenticels), greyed and lifted to that mean
// brightness, its contrast `contrast` times the photo's, tinted as `tint` (sRGB) says.
async function bark(t) {
  const { rec, files, credit } = await polyHaven(t.asset, ['Diffuse']);
  const img = await resize(await readRGB(files[0]), TREE.high, TREE.high);
  if (t.tone) {
    const d = img.data, n = d.length / 3, lum = new Float32Array(n);
    let mean = 0;
    for (let i = 0; i < n; i++) mean += lum[i] = 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];
    mean /= n;
    const [r, g, b] = t.tone.tint ?? [255, 255, 255];
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, Math.min(255, t.tone.mean + (lum[i] - mean) * t.tone.contrast)) / 255;
      d[i * 3] = Math.round(v * r); d[i * 3 + 1] = Math.round(v * g); d[i * 3 + 2] = Math.round(v * b);
    }
  }
  return { img, place: { tree: t.tree, metres: +(Math.min(...rec.dimensions) / 1000).toFixed(2), mean: meanOf(img) }, credit };
}

// A tree's leaves (task 019): a spray of them, the leaves (or the twigs of needles) cut out of a Poly
// Haven tree's photos (CC0) by their alpha and laid along twigs that fan up from the card's foot, as many
// branches, leaves to a branch and as long as the recipe's `spray` says, and `fill` more over it; each
// leaf `lobes` of them fanned from one stalk where it says (task 061: a plane's, which Poly Haven hasn't),
// the middle one longest; or,
// for a palm (`frond`), the
// leaflets along a frond's stem up the card. RGBA, row 0 at the top; what's see-through is in the
// leaves' mean colour, so its mipmaps don't darken their edges.
async function leaves(t) {
  const { files, credit } = await polyHaven(t.asset, [t.diff, t.alpha]);
  const d = await sharp(files[0]).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = await sharp(files[1]).greyscale().raw().toBuffer({ resolveWithObject: true });
  const w = d.info.width, h = d.info.height, A = a.data, seen = new Int32Array(w * h), sprites = [];
  const sp = t.spray, min = (sp.min ?? 0.0005) * w * h, max = (sp.max ?? 0.05) * w * h;
  // Each leaf: what its alpha holds together, upright along its longest axis.
  for (let s0 = 0; s0 < w * h; s0++) {
    if (A[s0] < 128 || seen[s0]) continue;
    const stack = [s0], px = [], id = s0 + 1;
    seen[s0] = id;
    while (stack.length) {
      const k = stack.pop(), x = k % w, y = (k - x) / w;
      px.push(k);
      for (const q of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1]) if (q >= 0 && !seen[q] && A[q] >= 128) { seen[q] = id; stack.push(q); }
    }
    if (px.length < min || px.length > max) continue;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, mx = 0, my = 0, g = 0, r = 0;
    for (const k of px) { const x = k % w, y = (k - x) / w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); mx += x; my += y; r += d.data[k * 3]; g += d.data[k * 3 + 1]; }
    // Green leaves only: a dead or a red one is left out.
    if (sp.green && g < r * 1.05) continue;
    mx /= px.length; my /= px.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const k of px) { const x = (k % w) - mx, y = (k - (k % w)) / w - my; sxx += x * x; syy += y * y; sxy += x * y; }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, rgba = Buffer.alloc(cw * ch * 4);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = y * w + x, o = ((y - y0) * cw + (x - x0)) * 4;
      if (seen[k] !== id) continue;
      rgba[o] = d.data[k * 3]; rgba[o + 1] = d.data[k * 3 + 1]; rgba[o + 2] = d.data[k * 3 + 2]; rgba[o + 3] = A[k];
    }
    const turn = 90 - (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI;
    const up = await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } }).rotate(turn, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
    sprites.push({ png: up.data, w: up.info.width, h: up.info.height });
  }
  if (!sprites.length) throw new Error(`${t.id}: no leaf found in the alpha of ${t.asset}`);
  let seed = [...t.id].reduce((v, c) => (v * 31 + c.charCodeAt(0)) % 2147483647, 7) || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const S = TREE.high, inputs = [], twigs = [];
  // A leaf l pixels long from (x, y), pointing at angle a (from x towards y, down the card).
  const put = async (x, y, a, l, stretch = 1) => {
    if (!sp.lobes) return one(x, y, a, l, stretch);
    for (let k = 0; k < sp.lobes; k++) {
      const f = k / (sp.lobes - 1) - 0.5;
      await one(x, y, a + f * 2.2, l * (1 - 0.8 * Math.abs(f)), stretch);
    }
  };
  const one = async (x, y, a, l, stretch = 1) => {
    const s = sprites[Math.floor(rnd() * sprites.length)], k = l / s.h;
    const img = await sharp(s.png).resize(Math.max(2, Math.round(s.w * k * (sp.thin ?? 1))), Math.max(2, Math.round(s.h * k * stretch)), { fit: 'fill' }).modulate({ brightness: 0.85 + rnd() * 0.3 }).rotate((a * 180) / Math.PI + 90, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
    const left = Math.round(x + (Math.cos(a) * l * stretch) / 2 - img.info.width / 2), top = Math.round(y + (Math.sin(a) * l * stretch) / 2 - img.info.height / 2);
    if (left >= 0 && top >= 0 && left + img.info.width <= S && top + img.info.height <= S) inputs.push({ input: img.data, left, top });
  };
  const L = (v) => v * S;
  if (sp.frond) {
    // A palm's frond: its stem up the middle, bowing, its leaflets either side, longest in the middle.
    const pts = [];
    for (let k = 0; k <= 20; k++) { const f = k / 20; pts.push([S / 2 + Math.sin(f * Math.PI) * S * 0.04, S * (1 - f * 0.97)]); }
    twigs.push(pts);
    for (let k = 3; k < 20; k++) for (const side of [-1, 1]) {
      const f = k / 20, [x, y] = pts[k], l = L(sp.len[0] + (sp.len[1] - sp.len[0]) * Math.sin(f * Math.PI)) * (0.85 + rnd() * 0.3);
      await put(x, y, -Math.PI / 2 + (side * (sp.spread[0] + rnd() * (sp.spread[1] - sp.spread[0])) * Math.PI) / 180, l, sp.stretch ?? 1);
    }
  } else {
    for (let b = 0; b < sp.branches; b++) {
      let x = S / 2 + (rnd() - 0.5) * S * 0.08, y = S - S * 0.04, a = -Math.PI / 2 + (b / Math.max(1, sp.branches - 1) - 0.5) * 2.2 + (rnd() - 0.5) * 0.2;
      const len = S * (0.55 + rnd() * 0.3), pts = [[x, y]];
      for (let k = 1; k <= sp.per; k++) {
        a += (rnd() - 0.5) * 0.25;
        x += (Math.cos(a) * len) / sp.per; y += (Math.sin(a) * len) / sp.per;
        pts.push([x, y]);
        if (k < 2) continue;
        for (const side of [-1, 1]) await put(x, y, a + (side * (sp.spread[0] + rnd() * (sp.spread[1] - sp.spread[0])) * Math.PI) / 180 + (sp.droop ?? 0), L(sp.len[0] + rnd() * (sp.len[1] - sp.len[0])), sp.stretch ?? 1);
      }
      twigs.push(pts);
    }
    // And `fill` more over the spray, every way, so it's as thick as a crown is.
    for (let k = 0; k < (sp.fill ?? 0); k++) {
      const r = Math.sqrt(rnd()), th = rnd() * Math.PI * 2;
      await put(S / 2 + Math.cos(th) * r * S * 0.4, S * 0.46 + Math.sin(th) * r * S * 0.38, rnd() * Math.PI * 2, L(sp.len[0] + rnd() * (sp.len[1] - sp.len[0])), sp.stretch ?? 1);
    }
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${(sp.twig === 'none' ? [] : twigs).map((p) => `<polyline points="${p.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${sp.twig ?? '#4e3d2c'}" stroke-width="${((S / 170) * (sp.frond ? 1.6 : 1)).toFixed(1)}" stroke-linecap="round"/>`).join('')}</svg>`);
  inputs.sort(() => rnd() - 0.5);
  const { data } = await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: svg, left: 0, top: 0 }, ...inputs]).raw().toBuffer({ resolveWithObject: true });
  const img = { w: S, h: S, data, channels: 4 }, mean = meanOf(img);
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] < 128) { data[i] = mean[0]; data[i + 1] = mean[1]; data[i + 2] = mean[2]; }
  let cover = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) cover++;
  return { img, place: { tree: t.tree, mean, cover: +(cover / (S * S)).toFixed(2) }, credit };
}

// ---- The indexes ----

function writeIndexes(entries) {
  const byTile = new Map();
  for (const e of entries.filter((e) => e.kind !== 'surface' && !['bark', 'leaves'].includes(e.kind))) {
    if (!byTile.has(e.tile)) byTile.set(e.tile, []);
    byTile.get(e.tile).push(e);
  }
  for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith('.js'))) if (!byTile.has(f.slice(0, -3))) fs.rmSync(path.join(OUT, f));
  const tiles = [...byTile.keys()].sort();
  for (const tile of tiles) {
    const lines = byTile.get(tile).map((e) => {
      const files = LEVELS.map((l) => {
        const f = `${e.id}-${l}.ktx2`, { w, h, bytes } = ktx2Size(path.join(OUT, tile, f));
        return `${l}: { url: new URL('./${tile}/${f}', import.meta.url).href, w: ${w}, h: ${h}, bytes: ${bytes} }`;
      });
      const where = e.kind === 'ground' ? `box: ${js(e.place.box)}` : `wall: ${js(e.place.wall)}, s: ${js(e.place.s)}, y: ${js(e.place.y)}, colour: ${js(e.place.colour)}, wallColour: ${js(e.place.wallColour)}`;
      return `  { id: ${js(e.id)}, kind: ${js(e.kind)}, ${where},\n    files: { ${files.join(',\n      ')} },\n    credit: ${js(e.credit)} },`;
    });
    fs.writeFileSync(path.join(OUT, tile + '.js'), `// Made by tools/textures.mjs: the photo textures on tile ${tile}, each at every graphics level.\nexport default [\n${lines.join('\n')}\n];\n`);
  }
  // The credits each source asks for, with every author whose photo a texture is made from.
  const sources = new Map();
  for (const e of entries) {
    const k = e.credit.source;
    if (!sources.has(k)) sources.set(k, { source: k, licence: e.credit.licence, authors: new Set(), kinds: new Set() });
    for (const a of e.credit.author.split(", ")) sources.get(k).authors.add(a);
    sources.get(k).kinds.add(e.kind);
  }
  const credits = [...sources.values()].map((s) => ({ source: s.source, licence: s.licence, authors: [...s.authors].sort(), kinds: [...s.kinds].sort() }));
  // Each kind of ground's photo, by the kind it's of.
  const surfaces = entries.filter((e) => e.kind === 'surface').map((e) => {
    const files = LEVELS.map((l) => {
      const f = `${e.id}-${l}.ktx2`, { w, h, bytes } = ktx2Size(path.join(OUT, 'surfaces', f));
      return `${l}: { url: new URL('./textures/surfaces/${f}', import.meta.url).href, w: ${w}, h: ${h}, bytes: ${bytes} }`;
    });
    return `  ${e.place.ground}: { id: ${js(e.id)}, metres: ${e.place.metres}, mean: ${js(e.place.mean)},\n    files: { ${files.join(',\n      ')} },\n    credit: ${js(e.credit)} },`;
  });
  // Each kind of tree's bark and leaves (task 019), by the kind they're of.
  const trees = new Map();
  for (const e of entries.filter((e) => ['bark', 'leaves'].includes(e.kind))) {
    const files = LEVELS.map((l) => {
      const f = `${e.id}-${l}.ktx2`, { w, h, bytes } = ktx2Size(path.join(OUT, 'trees', f));
      return `${l}: { url: new URL('./textures/trees/${f}', import.meta.url).href, w: ${w}, h: ${h}, bytes: ${bytes} }`;
    });
    const { tree, ...place } = e.place;
    if (!trees.has(tree)) trees.set(tree, []);
    trees.get(tree).push(`    ${e.kind}: { id: ${js(e.id)}, ${Object.entries(place).map(([k, v]) => `${k}: ${js(v)}`).join(', ')},\n      files: { ${files.join(',\n        ')} },\n      credit: ${js(e.credit)} },`);
  }
  fs.writeFileSync(
    path.join(ROOT, 'world', 'textures.js'),
    `// Made by tools/textures.mjs: a loader for each tile's photo textures (task 007), so a game only\n// downloads the index of those it loads; each kind of ground's photo (task 016); each kind of tree's\n// bark and leaves (task 019); and every source they're made from, with its authors.\nexport const TEXTURES = {\n${tiles.map((t) => `  ${js(t)}: () => import('./textures/${t}.js'),`).join('\n')}\n};\nexport const SURFACES = {\n${surfaces.join('\n')}\n};\nexport const TREES = {\n${[...trees].map(([tree, parts]) => `  ${tree}: {\n${parts.join('\n')}\n  },`).join('\n')}\n};\nexport const CREDITS = [\n${credits.map((c) => `  ${js(c)},`).join('\n')}\n];\n`,
  );
}

// ---- Making them ----

const args = process.argv.slice(2);
const check = args.includes('--check'), compare = args.includes('--compare');
const only = args.filter((a) => !a.startsWith('--'));
const recipes = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'textures.json'), 'utf8')).textures;
const photos = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'photos.json'), 'utf8')).photos;
for (const id of only) if (!recipes.some((t) => t.id === id)) throw new Error(`no texture ${id} in refs/textures.json`);
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(WORK, 'compare'), { recursive: true });

// The world under every facade's wall, for finding its building.
const walls = recipes.filter((t) => t.kind === 'facade').flatMap((t) => t.wall);
const world = walls.length ? await loadWorld({ x0: Math.min(...walls.map((p) => p[0])) - 1, x1: Math.max(...walls.map((p) => p[0])) + 1, z0: Math.min(...walls.map((p) => p[1])) - 1, z1: Math.max(...walls.map((p) => p[1])) + 1 }) : null;
const m = map();
const entries = [];
for (const t of recipes) {
  const t0 = Date.now();
  const tree = t.kind === 'bark' || t.kind === 'leaves';
  const tile = t.kind === 'ground' ? t.tile : t.kind === 'surface' ? 'surfaces' : tree ? 'trees' : m.tileAt((t.wall[0][0] + t.wall.at(-1)[0]) / 2, (t.wall[0][1] + t.wall.at(-1)[1]) / 2);
  const make = !only.length || only.includes(t.id) || LEVELS.some((l) => !fs.existsSync(path.join(OUT, tile, `${t.id}-${l}.ktx2`)));
  if (!make) {
    // Only where it goes and whose it is: the files are already made.
    if (t.kind === 'surface' || tree) {
      const { place, credit } = await (t.kind === 'surface' ? surface(t) : t.kind === 'bark' ? bark(t) : leaves(t));
      entries.push({ id: t.id, kind: t.kind, tile, place, credit });
    } else if (t.kind === 'ground') {
      const [i, j] = t.tile.match(/-?\d+/g).map(Number);
      entries.push({ id: t.id, kind: t.kind, tile, place: { box: { x0: i * m.tile, z0: j * m.tile, x1: (i + 1) * m.tile, z1: (j + 1) * m.tile } }, credit: DGT_CREDIT });
    } else {
      // Straightened again for its wall's colour in the photo; its files stay as they are.
      const { img, place, credit } = await facade(t, world, photos);
      entries.push({ id: t.id, kind: t.kind, tile, place: { ...place, wallColour: await wallColourOf(t, img, photos) }, credit });
    }
    continue;
  }
  console.log(t.id);
  const made = t.kind === 'ground' ? await ground(t, GROUND.high) : t.kind === 'surface' ? await surface(t) : t.kind === 'bark' ? await bark(t) : t.kind === 'leaves' ? await leaves(t) : await facade(t, world, photos);
  fs.mkdirSync(path.join(OUT, tile), { recursive: true });
  const sizes = [];
  for (const l of LEVELS) {
    const k = t.kind === 'ground' ? GROUND[l] / GROUND.high : t.kind === 'surface' ? SURFACE[l] / SURFACE.high : tree ? TREE[l] / TREE.high : FACADE[l] / FACADE.high;
    const img = await resize(made.img, four(made.img.w * k), four(made.img.h * k));
    const out = await ktx2(img);
    fs.writeFileSync(path.join(OUT, tile, `${t.id}-${l}.ktx2`), out);
    sizes.push(`${l} ${img.w}×${img.h} ${(out.length / 1024).toFixed(0)} KB`);
    if (compare) {
      await sharp(img.data, { raw: { width: img.w, height: img.h, channels: img.channels ?? 3 } }).webp({ quality: 80 }).toFile(path.join(WORK, 'compare', `${t.id}-${l}.webp`));
      fs.writeFileSync(path.join(WORK, 'compare', `${t.id}-${l}.uastc.ktx2`), await ktx2(img, true));
    }
  }
  if (check) await sharp(made.img.data, { raw: { width: made.img.w, height: made.img.h, channels: made.img.channels ?? 3 } }).png().toFile(path.join(WORK, t.id + '.png'));
  console.log(`  ${sizes.join(', ')}${made.own ? `; its photo has ${made.own} px a metre` : ''} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  entries.push({ id: t.id, kind: t.kind, tile, place: t.kind === 'facade' ? { ...made.place, wallColour: await wallColourOf(t, made.img, photos) } : made.place, credit: made.credit });
}
writeIndexes(entries);
console.log(`${entries.length} textures → ${path.relative(ROOT, OUT)}/`);
