// Prepares a round of shots for the scorecard, the shared page "Braga real" (task 003): the High
// shots of ../party-kart/shots/<round>/ (party-kart's scripts/shots.mjs, task 002) and each
// viewpoint's real photo, 960 pixels wide as JPEGs, with the lists the page reads. They land in
// .cache/scorecard/, laid out as they're published beside the page:
//
//   photos/<id>.jpg           each viewpoint's photo, from .cache/refs/ (node tools/refs.mjs)
//   rounds/<round>-<n>.jpg    the round's High shots, in a few sheets (task 062)
//   data/viewpoints.json      the viewpoints: names, areas, and each photo's credit and size
//   data/rounds.json          every round so far, oldest first
//
// The rounds are recorded in refs/rounds.json, which is committed: each one's label, the tasks it
// shows, a note, the commits it was shot on, its sheets and where each shot is in them. Preparing a
// round again replaces its entry and its sheets.
//
// node tools/round.mjs 2026-10-13-baseline --label "Ponto de partida" --tasks 002 --note "…"
// node tools/round.mjs <round> --shots ../party-kart-021/shots …   shot in another party-kart checkout
// node tools/round.mjs --pack   only packs the rounds still kept a file a shot, rounds/<round>/<id>.jpg
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import jpeg from 'jpeg-js';
import { CACHE, ROOT } from './geo.mjs';
import { inShooter } from './sections.mjs';

const W = 960;
const QUALITY = 82;
const OUT = path.join(CACHE, 'scorecard');
const LOG = path.join(ROOT, 'refs', 'rounds.json');

const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const SHOTS = path.resolve(ROOT, opt('shots') ?? '../party-kart/shots');
const id = args.find((a, i) => !a.startsWith('--') && !['--label', '--tasks', '--note', '--shots'].includes(args[i - 1]));
if (!id && !args.includes('--pack')) {
  console.error('node tools/round.mjs <round> --label "…" [--tasks 002,009] [--note "…"]   a folder of ../party-kart/shots/');
  process.exit(1);
}
const dir = id && path.join(SHOTS, id);
if (id && !fs.existsSync(path.join(dir, 'stats.json'))) throw new Error(`no round at ${dir}: shoot it with node scripts/shots.mjs in party-kart`);

// A PNG's pixels as RGBA: 8 bits a channel, RGB or RGBA, not interlaced, as Playwright saves them.
function readPng(file) {
  const b = fs.readFileSync(file);
  let w = 0, h = 0, type = 0;
  const idat = [];
  for (let i = 8; i < b.length; ) {
    const len = b.readUInt32BE(i), kind = b.toString('ascii', i + 4, i + 8), body = b.subarray(i + 8, i + 8 + len);
    if (kind === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      type = body[9];
      if (body[8] !== 8 || (type !== 2 && type !== 6) || body[12] !== 0) throw new Error(`${file}: only 8-bit RGB or RGBA PNGs, not interlaced`);
    } else if (kind === 'IDAT') idat.push(body);
    i += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = type === 6 ? 4 : 3, stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0, up = y ? px[row - stride + x] : 0, ul = y && x >= bpp ? px[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul;
      }
      px[row + x] = v & 255;
    }
  }
  const data = Buffer.alloc(w * h * 4, 255);
  for (let k = 0; k < w * h; k++) for (let c = 0; c < 3; c++) data[k * 4 + c] = px[k * bpp + c];
  return { width: w, height: h, data };
}

// An image shrunk to `width` pixels across, each new pixel the average of the old ones it covers.
// One narrower than that is kept as it is.
function shrink(img, width) {
  const { width: w, height: h, data } = img;
  if (w <= width) return img;
  const height = Math.round((h * width) / w), sx = w / width, sy = h / height;
  const across = new Float32Array(width * h * 3);
  for (let y = 0; y < h; y++) {
    for (let X = 0; X < width; X++) {
      const a = X * sx, b = a + sx;
      for (let x = Math.floor(a); x < Math.ceil(b); x++) {
        const k = (Math.min(b, x + 1) - Math.max(a, x)) / sx, o = (y * w + x) * 4, t = (y * width + X) * 3;
        for (let c = 0; c < 3; c++) across[t + c] += data[o + c] * k;
      }
    }
  }
  const down = new Float32Array(width * height * 3);
  for (let Y = 0; Y < height; Y++) {
    const a = Y * sy, b = a + sy;
    for (let y = Math.floor(a); y < Math.ceil(b); y++) {
      const k = (Math.min(b, y + 1) - Math.max(a, y)) / sy;
      for (let t = 0; t < width * 3; t++) down[Y * width * 3 + t] += across[y * width * 3 + t] * k;
    }
  }
  const out = Buffer.alloc(width * height * 4, 255);
  for (let k = 0; k < width * height; k++) for (let c = 0; c < 3; c++) out[k * 4 + c] = Math.round(Math.min(255, down[k * 3 + c]));
  return { width, height, data: out };
}

function writeJpeg(file, img) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, jpeg.encode(img, QUALITY).data);
  return [img.width, img.height];
}

// The areas the scorecard sums by: along the route (30 m from a track), the shooter's area
// (decision 003) and the skyline. A viewpoint can be in two.
const tracks = await Promise.all(fs.readdirSync(path.join(ROOT, 'tracks')).filter((f) => f.endsWith('.js')).map(async (f) => (await import(`../tracks/${f}`)).default));
function toRoute(x, z) {
  let best = Infinity;
  for (const t of tracks) {
    const pts = t.points.map(({ p }) => p);
    pts.forEach(([ax, , az], i) => {
      const [bx, , bz] = pts[(i + 1) % pts.length], dx = bx - ax, dz = bz - az;
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      best = Math.min(best, Math.hypot(x - ax - f * dx, z - az - f * dz));
    });
  }
  return best;
}
const areasOf = (v) => [
  ...(v.kind !== 'skyline' && toRoute(v.x, v.z) < 30 ? ['route'] : []),
  ...(inShooter(v.x, v.z) ? ['shooter'] : []),
  ...(v.kind === 'skyline' ? ['skyline'] : []),
];

const { credit, viewpoints } = JSON.parse(fs.readFileSync(path.join(ROOT, 'refs', 'viewpoints.json'), 'utf8'));

// The photos, once each.
const list = [];
for (const v of viewpoints) {
  const src = path.join(CACHE, 'refs', `${v.id}.jpg`);
  if (!fs.existsSync(src)) throw new Error(`no photo for ${v.id}: node tools/refs.mjs`);
  const file = path.join(OUT, 'photos', `${v.id}.jpg`);
  const size = fs.existsSync(file) && fs.statSync(file).mtimeMs > fs.statSync(src).mtimeMs ? jpegSize(file) : writeJpeg(file, shrink(jpeg.decode(fs.readFileSync(src), { maxMemoryUsageInMB: 1024 }), W));
  const p = v.photo;
  list.push({ id: v.id, nome: v.nome, kind: v.kind, areas: areasOf(v), photo: { w: size[0], h: size[1], source: p.source, author: p.author, licence: p.licence, url: p.url, date: p.date } });
}

function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i + 9 < b.length; ) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file}: no size`);
}

// A version of the page holds 511 files at most, so a round's shots go up in a few sheets, not a
// file each (task 062): at most 9 to a sheet, three across, about 6 megapixels, which a phone
// decodes. Each shot keeps 8 pixels of its own edge round it, so the page's scaling never reaches a
// neighbour, and starts on a multiple of 8, on the JPEG's 8-pixel blocks as it is on its own: its
// piece of the sheet is the same, pixel for pixel, as the shot's own JPEG would be.
const PER_SHEET = 9;
const ACROSS = 3;
const EDGE = 8;
const up8 = (n) => Math.ceil(n / 8) * 8;
const digest = (bytes) => crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 12);

// Writes a round's own shots, [{ v, img }], into rounds/<round>-<n>.jpg, shared out evenly between as
// few sheets as hold them, and returns where each shot is, [n, x, y], and the sheets' sizes.
function pack(rid, own) {
  const rounds = path.join(OUT, 'rounds');
  fs.mkdirSync(rounds, { recursive: true });
  for (const f of fs.readdirSync(rounds)) if (f.startsWith(`${rid}-`) && /^\d+\.jpg$/.test(f.slice(rid.length + 1))) fs.rmSync(path.join(rounds, f));
  const at = {}, sheets = [], count = Math.ceil(own.length / PER_SHEET);
  for (let n = 1, i = 0; n <= count; n++) {
    const part = own.slice(i, (i += Math.ceil((own.length - i) / (count - n + 1))));
    const cols = Math.min(ACROSS, part.length), cw = Math.max(...part.map(({ img }) => up8(img.width) + 2 * EDGE));
    const rows = [];
    for (let k = 0; k < part.length; k += cols) rows.push(Math.max(...part.slice(k, k + cols).map(({ img }) => up8(img.height) + 2 * EDGE)));
    const width = cols * cw, height = rows.reduce((a, b) => a + b, 0), data = Buffer.alloc(width * height * 4, 255);
    part.forEach(({ v, img }, k) => {
      const ox = (k % cols) * cw, oy = rows.slice(0, Math.floor(k / cols)).reduce((a, b) => a + b, 0);
      // The shot's cell, each pixel the shot's nearest.
      for (let y = 0; y < rows[Math.floor(k / cols)]; y++) {
        const row = Math.min(img.height - 1, Math.max(0, y - EDGE)) * img.width;
        for (let x = 0; x < cw; x++) {
          const s = (row + Math.min(img.width - 1, Math.max(0, x - EDGE))) * 4, d = ((oy + y) * width + ox + x) * 4;
          data[d] = img.data[s];
          data[d + 1] = img.data[s + 1];
          data[d + 2] = img.data[s + 2];
        }
      }
      at[v] = [n, ox + EDGE, oy + EDGE];
    });
    fs.writeFileSync(path.join(rounds, `${rid}-${n}.jpg`), jpeg.encode({ width, height, data }, QUALITY).data);
    sheets.push([width, height]);
  }
  return { at, sheets };
}

const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : { about: '', rounds: [] };
log.about = 'The rounds of shots on the scorecard "Braga real" (task 003), oldest first: each one\'s label, the tasks it shows, a note, when it was shot, on which party-kart commit and braga-map version, its sheets\' sizes, and each viewpoint\'s shot: [w, h, sheet, x, y, hash], its size, its sheet rounds/<id>-<sheet>.jpg and where it is in it, and the start of the SHA-1 of the shot on its own as a JPEG; or [w, h, round], the same as that earlier round\'s. The pictures are in party-kart\'s shots/<id>/; node tools/round.mjs <id> prepares them for the page.';

// The round's High shots, each shrunk to 960 pixels across.
const fresh = new Map();
let round;
if (id) {
  const stats = JSON.parse(fs.readFileSync(path.join(dir, 'stats.json'), 'utf8'));
  const shots = {}, own = [];
  for (const v of viewpoints) {
    const src = path.join(dir, 'high', `${v.id}.png`);
    if (!fs.existsSync(src)) {
      console.log(`${v.id}: not in this round`);
      continue;
    }
    const img = shrink(readPng(src), W);
    own.push({ v: v.id, img, hash: digest(jpeg.encode(img, QUALITY).data) });
    shots[v.id] = [img.width, img.height];
  }
  const old = log.rounds.find((r) => r.id === id);
  round = {
    id,
    label: opt('label') ?? old?.label ?? id,
    date: id.slice(0, 10),
    tasks: opt('tasks') !== undefined ? opt('tasks').split(',').filter(Boolean) : (old?.tasks ?? []),
    note: opt('note') ?? old?.note ?? '',
    made: stats.made,
    game: stats.game,
    map: stats.map,
    shots,
  };
  log.rounds = [...log.rounds.filter((r) => r.id !== id), round].sort((a, b) => (a.made < b.made ? -1 : 1));
  fresh.set(id, own);
}

// A shot the same, byte for byte, as an earlier round's of its viewpoint is that round's (task 057
// found 61 of 451): its entry says which, [w, h, round], and it isn't in this round's sheets. A round
// prepared before task 062, a file a shot in rounds/<round>/, is packed from those files, which print
// as the ones to take off the page.
const holder = new Map(), packed = [], gone = [];
for (const r of log.rounds) {
  const folder = path.join(OUT, 'rounds', r.id);
  let own = fresh.get(r.id);
  if (!own && !r.sheets) {
    own = Object.entries(r.shots).filter(([, e]) => typeof e[2] !== 'string').map(([v]) => {
      const bytes = fs.readFileSync(path.join(folder, `${v}.jpg`));
      return { v, img: jpeg.decode(bytes, { maxMemoryUsageInMB: 1024 }), hash: digest(bytes) };
    });
  }
  if (!own) {
    for (const [v, e] of Object.entries(r.shots)) if (e[5] && !holder.has(`${v}:${e[5]}`)) holder.set(`${v}:${e[5]}`, r.id);
    continue;
  }
  const kept = own.filter(({ v, img, hash }) => {
    if (holder.has(`${v}:${hash}`)) r.shots[v] = [img.width, img.height, holder.get(`${v}:${hash}`)];
    else holder.set(`${v}:${hash}`, r.id);
    return holder.get(`${v}:${hash}`) === r.id;
  });
  const { at, sheets } = pack(r.id, kept);
  for (const { v, img, hash } of kept) r.shots[v] = [img.width, img.height, ...at[v], hash];
  r.sheets = sheets;
  packed.push(r);
  if (fs.existsSync(folder)) {
    gone.push(...fs.readdirSync(folder).map((f) => `rounds/${r.id}/${f}`));
    fs.rmSync(folder, { recursive: true });
  }
}
fs.writeFileSync(LOG, JSON.stringify(log, null, 2).replace(/\[\s+(\d[^[\]{}]*?)\s+\]/g, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`) + '\n');

fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'data', 'viewpoints.json'), JSON.stringify({ credit, viewpoints: list }));
fs.writeFileSync(path.join(OUT, 'data', 'rounds.json'), JSON.stringify({ rounds: log.rounds }));

const kb = (files) => Math.round(files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0) / 1024);
const sheetsOf = (r) => r.sheets.map((_, n) => `rounds/${r.id}-${n + 1}.jpg`);
for (const r of packed) {
  const own = Object.values(r.shots).filter((e) => typeof e[2] !== 'string').length, same = Object.keys(r.shots).length - own;
  console.log(`${r.id}: ${own} shots of its own in ${r.sheets.length} sheet${r.sheets.length === 1 ? '' : 's'} (${kb(sheetsOf(r))} kB)${same ? `, ${same} the same as an earlier round's` : ''}`);
}
console.log(`${list.length} photos (${kb(list.map((v) => `photos/${v.id}.jpg`))} kB), all in ${path.relative(ROOT, OUT)}`);
console.log(`publish beside the page: ${[...packed.flatMap(sheetsOf), 'data/rounds.json', ...(log.rounds.length === 1 ? ['photos/*.jpg', 'data/viewpoints.json'] : [])].join(' ')}`);
if (gone.length) console.log(`and take off the page, each now in a sheet: ${gone.join(' ')}`);
