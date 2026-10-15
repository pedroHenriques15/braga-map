// Photo textures for the world (task 007, decision 030): the 2025 orthophoto over a tile, and the
// reference photos of facades (task 008) straightened onto their walls, made as refs/textures.json
// says. Each is cut for each graphics level, compressed as KTX2 (Basis Universal's ETC1S, which a
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
// world/textures.js                         TEXTURES, a loader of each tile's index, and CREDITS
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';
import { CACHE, ROOT } from './geo.mjs';
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
// ETC1S's quality, 1 to 255: where it stops getting closer to the photo. Over Basis's default, 128,
// it's 0.9–1.6 dB closer for some 40% more bytes; above 200, 0.2 dB at most (task 007's notes).
const QUALITY = 200;
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

// Sizes that Basis's 4 × 4 blocks divide.
const four = (n) => Math.max(4, Math.round(n / 4) * 4);

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
// step along it one of the footprint's edges, to 0.75 m), the metres along the wall it spans and the
// building's ground.
function wall(t, world) {
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.75;
  const b = world.buildings.find((b) => t.wall.every((p) => b.pts.some((q) => near(p, q))));
  if (!b) throw new Error(`${t.id}: no building in the world has the wall's points ${JSON.stringify(t.wall)}; read them again off the map`);
  const [a, z] = [t.wall[0], t.wall[t.wall.length - 1]], L = Math.hypot(z[0] - a[0], z[1] - a[1]);
  const s = t.s ?? [0, +L.toFixed(2)];
  if (t.y[1] > b.h + 1) console.warn(`  ${t.id}: its top, ${t.y[1]} m, is over the building's ${b.h} m`);
  return { wall: t.wall, s, foot: b.y, h: b.h };
}

// ---- Compressing ----

// A KTX2 file of an RGB image, Basis's ETC1S (or UASTC, with Zstandard), with its mipmaps, sRGB.
async function ktx2(img, uastc = false) {
  const rgba = Buffer.alloc(img.w * img.h * 4);
  for (let i = 0, j = 0; i < img.w * img.h * 3; i += 3, j += 4) { rgba[j] = img.data[i]; rgba[j + 1] = img.data[i + 1]; rgba[j + 2] = img.data[i + 2]; rgba[j + 3] = 255; }
  // The encoder prints each mipmap it makes; this keeps the console to what's made.
  const write = process.stdout.write;
  process.stdout.write = () => true;
  try {
    const out = await encodeToKTX2(new Uint8Array(1), {
      isUASTC: uastc, qualityLevel: QUALITY, compressionLevel: 2, needSupercompression: uastc, uastcLDRQualityLevel: 1,
      generateMipmap: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, isKTX2File: true,
      imageDecoder: async () => ({ width: img.w, height: img.h, data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.length) }),
    });
    return Buffer.from(out);
  } finally {
    process.stdout.write = write;
  }
}

// An RGB image at another size, as sharp's Lanczos has it.
async function resize(img, w, h) {
  if (w === img.w && h === img.h) return img;
  const { data, info } = await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 3 } }).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data };
}

// A KTX2 file's size in pixels, from its header.
function ktx2Size(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32LE(20), h: b.readUInt32LE(24), bytes: b.length };
}

// ---- The indexes ----

// A value as JavaScript, as the world's other modules write it: single quotes, no quotes on keys.
const js = (v) =>
  typeof v === 'string'
    ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    : Array.isArray(v)
      ? `[${v.map(js).join(', ')}]`
      : v && typeof v === 'object'
        ? `{ ${Object.entries(v).map(([k, x]) => `${k}: ${js(x)}`).join(', ')} }`
        : String(v);

function writeIndexes(entries) {
  const byTile = new Map();
  for (const e of entries) {
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
      const where = e.kind === 'ground' ? `box: ${js(e.place.box)}` : `wall: ${js(e.place.wall)}, s: ${js(e.place.s)}, y: ${js(e.place.y)}`;
      return `  { id: ${js(e.id)}, kind: ${js(e.kind)}, ${where},\n    files: { ${files.join(',\n      ')} },\n    credit: ${js(e.credit)} },`;
    });
    fs.writeFileSync(path.join(OUT, tile + '.js'), `// Made by tools/textures.mjs: the photo textures on tile ${tile}, each at every graphics level.\nexport default [\n${lines.join('\n')}\n];\n`);
  }
  // The credits each source asks for, with every author whose photo a texture is made from.
  const sources = new Map();
  for (const e of entries) {
    const k = e.credit.source;
    if (!sources.has(k)) sources.set(k, { source: k, licence: e.credit.licence, authors: new Set(), kinds: new Set() });
    sources.get(k).authors.add(e.credit.author);
    sources.get(k).kinds.add(e.kind);
  }
  const credits = [...sources.values()].map((s) => ({ source: s.source, licence: s.licence, authors: [...s.authors].sort(), kinds: [...s.kinds].sort() }));
  fs.writeFileSync(
    path.join(ROOT, 'world', 'textures.js'),
    `// Made by tools/textures.mjs: a loader for each tile's photo textures (task 007), so a game only\n// downloads the index of those it loads; and every source they're made from, with its authors.\nexport const TEXTURES = {\n${tiles.map((t) => `  ${js(t)}: () => import('./textures/${t}.js'),`).join('\n')}\n};\nexport const CREDITS = [\n${credits.map((c) => `  ${js(c)},`).join('\n')}\n];\n`,
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
  const tile = t.kind === 'ground' ? t.tile : m.tileAt((t.wall[0][0] + t.wall.at(-1)[0]) / 2, (t.wall[0][1] + t.wall.at(-1)[1]) / 2);
  const make = !only.length || only.includes(t.id) || LEVELS.some((l) => !fs.existsSync(path.join(OUT, tile, `${t.id}-${l}.ktx2`)));
  if (!make) {
    // Only where it goes and whose it is: the files are already made.
    if (t.kind === 'ground') {
      const [i, j] = t.tile.match(/-?\d+/g).map(Number);
      entries.push({ id: t.id, kind: t.kind, tile, place: { box: { x0: i * m.tile, z0: j * m.tile, x1: (i + 1) * m.tile, z1: (j + 1) * m.tile } }, credit: DGT_CREDIT });
    } else {
      const place = wall(t, world), p = photos.find((p) => p.id === t.photo).photo;
      entries.push({ id: t.id, kind: t.kind, tile, place: { ...place, y: [+(place.foot + t.y[0]).toFixed(2), +(place.foot + t.y[1]).toFixed(2)] }, credit: { source: p.source === 'mapillary' ? 'Mapillary' : 'Wikimedia Commons', author: p.author, licence: p.licence, url: p.url, date: p.date } });
    }
    continue;
  }
  console.log(t.id);
  const made = t.kind === 'ground' ? await ground(t, GROUND.high) : await facade(t, world, photos);
  fs.mkdirSync(path.join(OUT, tile), { recursive: true });
  const sizes = [];
  for (const l of LEVELS) {
    const k = t.kind === 'ground' ? GROUND[l] / GROUND.high : FACADE[l] / FACADE.high;
    const img = await resize(made.img, four(made.img.w * k), four(made.img.h * k));
    const out = await ktx2(img);
    fs.writeFileSync(path.join(OUT, tile, `${t.id}-${l}.ktx2`), out);
    sizes.push(`${l} ${img.w}×${img.h} ${(out.length / 1024).toFixed(0)} KB`);
    if (compare) {
      await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 3 } }).webp({ quality: 80 }).toFile(path.join(WORK, 'compare', `${t.id}-${l}.webp`));
      fs.writeFileSync(path.join(WORK, 'compare', `${t.id}-${l}.uastc.ktx2`), await ktx2(img, true));
    }
  }
  if (check) await sharp(made.img.data, { raw: { width: made.img.w, height: made.img.h, channels: 3 } }).png().toFile(path.join(WORK, t.id + '.png'));
  console.log(`  ${sizes.join(', ')}${made.own ? `; its photo has ${made.own} px a metre` : ''} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  entries.push({ id: t.id, kind: t.kind, tile, place: made.place, credit: made.credit });
}
writeIndexes(entries);
console.log(`${entries.length} textures → ${path.relative(ROOT, OUT)}/`);
