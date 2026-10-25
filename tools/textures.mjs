// The world's textures (task 082, decision 061): each kind of ground's (task 016), the kind a game tiles
// over the ground tools/cover.mjs classes as it, and each kind of tree's bark and leaves (task 019), made
// by tools/made.mjs as refs/textures.json says, not photographed: no photograph is drawn in a game (the
// owner's rule, 2026-10-23). Photos are their references: each one's mean colour and contrast are
// matched to what its references measure (`match`, which --measure reads off them). Each is cut for
// each graphics level and compressed as KTX2 (Basis Universal's ETC1S, which a phone's graphics card
// keeps compressed, decision 030), for map() to hand a game. And for Ultra (task 085, a PC's), each made
// again at twice High's size, with a kind of ground's and a bark's relief as a normal map (in Basis's
// UASTC, which keeps a normal's directions where ETC1S blurs them) and a bark's roughness, for the sun's
// grazing light.
//
// node tools/textures.mjs            every texture in refs/textures.json (about ten minutes, Ultra's
//                                    most of it: run it in parts, by id, on a busy machine)
// node tools/textures.mjs <id>…      only those; the index keeps the rest
// node tools/textures.mjs --check    and each one at High, as a PNG, into .cache/textures/
// node tools/textures.mjs --measure  each recipe's `match` measured again off its references (in
//                                    .cache/textures/sources/ and .cache/refs/photos/), into
//                                    refs/textures.json; nothing is made
//
// world/textures/surfaces/<id>-<level>.ktx2 each kind of ground's, for each level: high, medium, low
// world/textures/surfaces/<id>-ultra.ktx2  and Ultra's, twice High's size, and its relief:
//   <id>-ultra-normal.ktx2                   a normal map, UASTC, linear
// world/textures/trees/<id>-<level>.ktx2    each kind of tree's bark and leaves, and Ultra's: a bark's
//   <id>-ultra-rough.ktx2                    relief and its roughness (at half Ultra's size, linear) too
// world/textures.js                         SURFACES, each kind of ground's (index.d.ts's GroundTexture),
//                                           and TREES, each kind of tree's bark and leaves (TreeTexture)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CACHE, ROOT } from './geo.mjs';
import { four, js, ktx2, ktx2Size, resize } from './ktx2.mjs';
import { leafSprites, make, match, measure, rng, seedOf, twigsSVG } from './made.mjs';
import { YEAR } from './trees.mjs';

const OUT = path.join(ROOT, 'world', 'textures');
const WORK = path.join(CACHE, 'textures');
const LEVELS = ['high', 'medium', 'low'];
// A kind of ground's side at each level: 1 to 4 mm a pixel on High, as it spans 1 to 4 m.
const SURFACE = { high: 1024, medium: 512, low: 256 };
// A tree's bark and leaves (task 019) at each level: a bark spanning about 1 to 2 m, a spray of
// leaves about 1 m.
const TREE = { high: 512, medium: 256, low: 128 };
// Ultra's (task 085): twice High's, made at that size rather than scaled up, so its grain is finer.
const ULTRA = { surface: 2 * SURFACE.high, tree: 2 * TREE.high };
// How deep each generator's relief is, black to white, in metres: what its normal map's slopes are
// worked out from (a texture's dark is what's sunk: the setts' joints, the bark's furrows, the asphalt's
// binder between its stones); and how rough its surface is: a kind of ground's a number (the land's
// shader has no room for a map of it, task 085), a bark's a map, the sunk a little rougher. Near the
// 0.96 a game's land was matched to the photos at (party-kart's), a little less where feet and tyres
// wear it smooth: at 0.7 the setts took so much of the sky's light that their joints paled.
const RELIEF = {
  asphalt: { depth: 0.006, rough: 0.92 }, concrete: { depth: 0.003, rough: 0.94 }, setts: { depth: 0.02, rough: 0.9 },
  grass: { depth: 0.012, rough: 0.96 }, soil: { depth: 0.01, rough: 0.96 }, gravel: { depth: 0.015, rough: 0.94 },
  bark: { depth: 0.015, rough: 0.9 },
};
const reliefOf = (t) => RELIEF[t.kind === 'surface' ? t.generator : 'bark'];
// Ultra's files, by what they are: a kind of ground's texture and its relief, a bark's and its roughness,
// the leaves and the twigs alone.
const ULTRA_FILES = {
  surface: { colour: 'ultra', normal: 'ultra-normal' },
  bark: { colour: 'ultra', normal: 'ultra-normal', roughness: 'ultra-rough' },
  leaves: { colour: 'ultra' },
  twigs: { colour: 'ultra' },
};

// The mean of an image's pixels (those not see-through) in linear light, as a graphics card reads it, in
// sRGB's bytes: what a game divides a kind of ground's texture by before tinting it with the place's colour.
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

// A texture's relief and roughness (task 085), from its luminance as its height: the normal map's
// slopes in the texture's own directions (u along a row, v down the rows, as a game reads the file),
// seamless, as deep as RELIEF says over `metres`; the roughness in green, as three.js reads it.
function relief(img, metres, { depth, rough }) {
  const { w, h } = img, ch = img.channels ?? 3, lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = Math.cbrt(0.2126 * lin(img.data[i * ch]) + 0.7152 * lin(img.data[i * ch + 1]) + 0.0722 * lin(img.data[i * ch + 2]));
  // The height's slope a pixel, in metres a metre: depth over the pixel's size.
  const k = (depth * w) / metres, at = (x, y) => H[((y + h) % h) * w + ((x + w) % w)];
  const normal = Buffer.alloc(w * h * 3), roughness = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const du = ((at(x + 1, y) - at(x - 1, y)) / 2) * k, dv = ((at(x, y + 1) - at(x, y - 1)) / 2) * k, l = Math.hypot(du, dv, 1), o = (y * w + x) * 3;
    normal[o] = Math.round(((-du / l + 1) / 2) * 255);
    normal[o + 1] = Math.round(((-dv / l + 1) / 2) * 255);
    normal[o + 2] = Math.round(((1 / l + 1) / 2) * 255);
    roughness[o + 1] = Math.round(Math.max(0.3, Math.min(1, rough + (0.5 - H[y * w + x]) * 0.2)) * 255);
  }
  return { normal: { w, h, data: normal }, roughness: { w, h, data: roughness } };
}

// ---- What each texture is made as ----

// What a recipe was matched to, in words, for the index.
const refName = (ref) => (ref.photo ? `refs/photos.json's ${ref.photo}` : `Poly Haven's ${ref.polyhaven}`) + (ref.tone ? ', greyed' : '');

// A kind of ground (task 016) or a tree's bark (task 019): its generator's texture, seamless, spanning
// `metres` a side, matched to its references; `n` pixels a side, High's or Ultra's.
function texture(t, n = t.kind === 'surface' ? SURFACE.high : TREE.high) {
  const data = make(t.kind, t.generator, n, { metres: t.metres, ...t.params }, seedOf(t.id));
  match(data, 3, t.match);
  const img = { w: n, h: n, data };
  return { img, place: { ...(t.kind === 'surface' ? { ground: t.ground, roughness: reliefOf(t).rough } : { tree: t.tree }), metres: t.metres, mean: meanOf(img) } };
}

// A tree's leaves (task 019): a spray of them, each leaf drawn from its kind's shape (made.mjs's
// leafSprites) and laid along twigs that fan up from the card's foot, as many branches, leaves to a
// branch and as long as the recipe's `spray` says, and `fill` more over it; or, for a palm (`frond`), the
// leaflets along a frond's stem up the card. RGBA, row 0 at the top; matched to its references; what's
// see-through is in the leaves' mean colour, so its mipmaps don't darken their edges. `S` pixels a side,
// High's or Ultra's.
async function leaves(t, S = TREE.high) {
  const sprites = await leafSprites(t.leaf, seedOf(t.id)), sp = t.spray;
  let seed = [...t.id].reduce((v, c) => (v * 31 + c.charCodeAt(0)) % 2147483647, 7) || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const inputs = [], twigs = [];
  // A leaf l pixels long from (x, y), pointing at angle a (from x towards y, down the card).
  const put = async (x, y, a, l, stretch = 1) => {
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
  match(data, 4, t.match);
  const img = { w: S, h: S, data, channels: 4 }, mean = meanOf(img);
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] < 128) { data[i] = mean[0]; data[i + 1] = mean[1]; data[i + 2] = mean[2]; }
  let cover = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) cover++;
  return { img, place: { tree: t.tree, mean, cover: +(cover / (S * S)).toFixed(2) } };
}

// A deciduous kind's bare twigs (task 093), as its crown's cards show them when its leaves are down:
// made.mjs's twigsSVG as the recipe's `twigs` says, RGBA, matched to its references, what's see-through
// in the twigs' mean colour as a spray's is. `S` pixels a side, High's or Ultra's.
async function twigs(t, S = TREE.high) {
  const svg = Buffer.from(twigsSVG(t.twigs, S, rng(seedOf(t.id))));
  const { data } = await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: svg, left: 0, top: 0 }]).raw().toBuffer({ resolveWithObject: true });
  match(data, 4, t.match);
  const img = { w: S, h: S, data, channels: 4 }, mean = meanOf(img);
  let cover = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) cover++;
    else { data[i] = mean[0]; data[i + 1] = mean[1]; data[i + 2] = mean[2]; }
  }
  return { img, place: { tree: t.tree, mean, cover: +(cover / (S * S)).toFixed(2) } };
}

// ---- Measuring the references (--measure) ----

// What a recipe's references measure: a Poly Haven texture's (CC0, kept as a reference in
// .cache/textures/sources/, fetched once), at the size the texture is made at, over its leaves' alpha
// where it has one (the green ones, where `green`), greyed and lifted as `tone` says (task 061's: a
// birch's and a plane's, which Poly Haven hasn't); or a reference photo's (refs/photos.json), in its
// `box` (its pixels, x0, y0, x1, y1).
async function reference(t) {
  const ref = t.ref, n = t.kind === 'surface' ? SURFACE.high : TREE.high;
  if (ref.photo) {
    const file = ['.jpg', '.png'].map((x) => path.join(CACHE, 'refs', 'photos', ref.photo + x)).find((f) => fs.existsSync(f));
    if (!file) throw new Error(`${t.id}: its reference photo isn't fetched (node tools/refs.mjs ${ref.photo})`);
    const [x0, y0, x1, y1] = ref.box;
    const { data } = await sharp(file).removeAlpha().extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).raw().toBuffer({ resolveWithObject: true });
    return measure(data);
  }
  const dir = path.join(WORK, 'sources'), file = ref.file ?? 'Diffuse';
  const named = (k) => [path.join(dir, `${ref.polyhaven}-${k}.jpg`), ...(k === 'Diffuse' ? [path.join(dir, `${ref.polyhaven}.jpg`)] : [])].find((f) => fs.existsSync(f));
  fs.mkdirSync(dir, { recursive: true });
  for (const k of [file, ...(ref.alpha ? [ref.alpha] : [])]) {
    if (named(k)) continue;
    const list = await (await fetch(`https://api.polyhaven.com/files/${ref.polyhaven}`)).json();
    fs.writeFileSync(path.join(dir, `${ref.polyhaven}-${k}.jpg`), Buffer.from(await (await fetch(list[k]['2k'].jpg.url)).arrayBuffer()));
  }
  const { data } = await sharp(named(file)).removeAlpha().resize(n, n, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  if (ref.tone) {
    const d = data, k = d.length / 3, lum = new Float32Array(k);
    let mean = 0;
    for (let i = 0; i < k; i++) mean += lum[i] = 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];
    mean /= k;
    const [r, g, b] = ref.tone.tint ?? [255, 255, 255];
    for (let i = 0; i < k; i++) {
      const v = Math.max(0, Math.min(255, ref.tone.mean + (lum[i] - mean) * ref.tone.contrast)) / 255;
      d[i * 3] = Math.round(v * r); d[i * 3 + 1] = Math.round(v * g); d[i * 3 + 2] = Math.round(v * b);
    }
  }
  if (!ref.alpha) return measure(data);
  const a = (await sharp(named(ref.alpha)).greyscale().resize(n, n, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })).data;
  const rgba = Buffer.alloc(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = a[i] >= 128 && (!ref.green || data[i * 3 + 1] >= data[i * 3] * 1.05) ? 255 : 0;
  }
  return measure(rgba, 4);
}

// refs/textures.json as it's kept: each recipe a key to a line.
function writeRecipes(file, doc) {
  const rec = (t) => `    {\n${Object.entries(t).map(([k, v]) => `      ${JSON.stringify(k)}: ${JSON.stringify(v, null, 1).replace(/\n\s*/g, ' ').replace(/\[ /g, '[').replace(/ \]/g, ']')}`).join(',\n')}\n    }`;
  fs.writeFileSync(file, `{\n  "about": ${JSON.stringify(doc.about)},\n  "textures": [\n${doc.textures.map(rec).join(',\n')}\n  ]\n}\n`);
}

// ---- The index ----

function writeIndex(entries) {
  const file = (dir, f) => {
    const { w, h, bytes } = ktx2Size(path.join(OUT, dir, f));
    return `{ url: new URL('./textures/${dir}/${f}', import.meta.url).href, w: ${w}, h: ${h}, bytes: ${bytes} }`;
  };
  const files = (e, dir) => LEVELS.map((l) => `${l}: ${file(dir, `${e.id}-${l}.ktx2`)}`);
  // Ultra's (task 085): the texture, and a kind of ground's or a bark's relief, a bark's roughness.
  const ultra = (e, dir, pad) => `ultra: { ${Object.entries(ULTRA_FILES[e.kind]).map(([k, f]) => `${k}: ${file(dir, `${e.id}-${f}.ktx2`)}`).join(`,\n${pad}`)} }`;
  // Each kind of ground's, by the kind it's of.
  const surfaces = entries.filter((e) => e.kind === 'surface').map((e) => `  ${e.place.ground}: { id: ${js(e.id)}, metres: ${e.place.metres}, mean: ${js(e.place.mean)}, roughness: ${e.place.roughness},\n    files: { ${files(e, 'surfaces').join(',\n      ')} },\n    ${ultra(e, 'surfaces', '      ')},\n    made: ${js(e.made)} },`);
  // Each kind of tree's bark and leaves (task 019) and a deciduous kind's twigs (task 093), by the kind
  // they're of; and its year (tools/trees.mjs's YEAR).
  const trees = new Map();
  for (const e of entries.filter((e) => e.kind !== 'surface')) {
    const { tree, ...place } = e.place;
    if (!trees.has(tree)) trees.set(tree, []);
    trees.get(tree).push(`    ${e.kind}: { id: ${js(e.id)}, ${Object.entries(place).map(([k, v]) => `${k}: ${js(v)}`).join(', ')},\n      files: { ${files(e, 'trees').join(',\n        ')} },\n      ${ultra(e, 'trees', '        ')},\n      made: ${js(e.made)} },`);
  }
  for (const [tree, parts] of trees) parts.push(`    year: ${js(YEAR[tree] ?? null)},`);
  fs.writeFileSync(
    path.join(ROOT, 'world', 'textures.js'),
    `// Made by tools/textures.mjs (task 082): each kind of ground's texture (task 016) and each kind of tree's\n// bark and leaves (task 019) and a deciduous kind's bare twigs (task 093), made, not photographed, each\n// matched to its references; and each kind's year (task 093).\nexport const SURFACES = {\n${surfaces.join('\n')}\n};\nexport const TREES = {\n${[...trees].map(([tree, parts]) => `  ${tree}: {\n${parts.join('\n')}\n  },`).join('\n')}\n};\n`,
  );
}

// ---- Making them ----

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));
const RECIPES = path.join(ROOT, 'refs', 'textures.json');
const doc = JSON.parse(fs.readFileSync(RECIPES, 'utf8')), recipes = doc.textures;
for (const id of only) if (!recipes.some((t) => t.id === id)) throw new Error(`no texture ${id} in refs/textures.json`);

if (args.includes('--measure')) {
  for (const t of recipes) {
    t.match = await reference(t);
    console.log(`${t.id.padEnd(24)} ${refName(t.ref).padEnd(48)} mean ${t.match.mean.join(', ')}, contrast ${t.match.contrast}`);
  }
  writeRecipes(RECIPES, doc);
  process.exit(0);
}

fs.mkdirSync(WORK, { recursive: true });
// What was made before that no recipe makes now goes: the files are only ever what the recipes say.
const dirOf = (t) => (t.kind === 'surface' ? 'surfaces' : 'trees');
const namesOf = (t) => [...LEVELS, ...Object.values(ULTRA_FILES[t.kind])].map((l) => `${t.id}-${l}.ktx2`);
for (const f of fs.readdirSync(OUT)) {
  const p = path.join(OUT, f);
  if (!['surfaces', 'trees'].includes(f)) { fs.rmSync(p, { recursive: true }); continue; }
  for (const g of fs.readdirSync(p)) if (!recipes.some((t) => dirOf(t) === f && namesOf(t).includes(g))) fs.rmSync(path.join(p, g));
}
const entries = [];
for (const t of recipes) {
  const t0 = Date.now(), dir = dirOf(t);
  const made = { generator: t.generator, ref: refName(t.ref), match: t.match };
  const stale = !only.length || only.includes(t.id) || namesOf(t).some((g) => !fs.existsSync(path.join(OUT, dir, g)));
  const out = t.kind === 'leaves' ? await leaves(t) : t.kind === 'twigs' ? await twigs(t) : texture(t);
  entries.push({ id: t.id, kind: t.kind, place: out.place, made });
  if (!stale) continue;
  console.log(t.id);
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  const sizes = [];
  for (const l of LEVELS) {
    const k = t.kind === 'surface' ? SURFACE[l] / SURFACE.high : TREE[l] / TREE.high;
    const img = await resize(out.img, four(out.img.w * k), four(out.img.h * k));
    const bytes = await ktx2(img);
    fs.writeFileSync(path.join(OUT, dir, `${t.id}-${l}.ktx2`), bytes);
    sizes.push(`${l} ${img.w}×${img.h} ${(bytes.length / 1024).toFixed(0)} KB`);
  }
  // Ultra's, made at its own size (High's above stays as it was), in ETC1S as the others are; its relief
  // in UASTC; a bark's roughness at half its size, as it changes slowly.
  const up = t.kind === 'leaves' ? await leaves(t, ULTRA.tree) : t.kind === 'twigs' ? await twigs(t, ULTRA.tree) : texture(t, t.kind === 'surface' ? ULTRA.surface : ULTRA.tree);
  const write = async (name, img, opts) => {
    const bytes = await ktx2(img, opts);
    fs.writeFileSync(path.join(OUT, dir, `${t.id}-${name}.ktx2`), bytes);
    sizes.push(`${name} ${img.w}×${img.h} ${(bytes.length / 1024).toFixed(0)} KB`);
  };
  await write('ultra', up.img, {});
  if (t.kind === 'surface' || t.kind === 'bark') {
    const r = relief(up.img, t.metres, reliefOf(t));
    await write('ultra-normal', r.normal, { uastc: true, normal: true });
    if (t.kind === 'bark') await write('ultra-rough', await resize(r.roughness, up.img.w / 2, up.img.h / 2), { linear: true });
  }
  if (check) await sharp(out.img.data, { raw: { width: out.img.w, height: out.img.h, channels: out.img.channels ?? 3 } }).png().toFile(path.join(WORK, t.id + '.png'));
  console.log(`  ${sizes.join(', ')} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
writeIndex(entries);
console.log(`${entries.length} textures → ${path.relative(ROOT, OUT)}/`);
