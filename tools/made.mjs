// Textures made, not photographed (task 082, the owner's rule of 2026-10-23: no photograph is drawn in
// a game; photos are references, to measure and to judge by). Each kind of ground, each kind of tree's
// bark and each kind of tree's leaves is drawn here from what it is made of and how it is laid: Braga's
// granite setts in their rows and joints, asphalt's aggregate and its wear, a plane's patches, a pine's
// plates, a lime's heart-shaped leaves. tools/textures.mjs matches each one's mean colour and contrast
// to what its references measure (refs/textures.json's `match`), cuts it for each graphics level and
// compresses it.
//
// Every generator here is seeded, so the same recipe makes the same texture, and seamless: the ground
// and the barks wrap both ways, as a game tiles them over the ground and round a trunk.
import sharp from 'sharp';

// ---- Randomness and noise ----

// A stream of numbers in [0, 1) from a seed (mulberry32).
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A seed from a texture's id.
export const seedOf = (id) => [...id].reduce((v, c) => (Math.imul(v, 31) + c.charCodeAt(0)) >>> 0, 7);

const wrap = (i, p) => ((i % p) + p) % p;
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// Value noise in [-1, 1] on a lattice px × py that wraps: noise(x, y) with x in [0, px), y in [0, py).
function lattice(seed, px, py) {
  const r = rng(seed), v = new Float32Array(px * py);
  for (let i = 0; i < v.length; i++) v[i] = r() * 2 - 1;
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), sx = fade(x - xi), sy = fade(y - yi);
    const x0 = wrap(xi, px), x1 = (x0 + 1) % px, y0 = wrap(yi, py) * px, y1 = ((wrap(yi, py) + 1) % py) * px;
    const a = v[y0 + x0], b = v[y0 + x1], c = v[y1 + x0], d = v[y1 + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// Fractal noise over the texture, u and v in [0, 1): `oct` octaves, the first fx × fy lumps across it,
// each next twice as fine and `gain` times as strong. About [-1, 1].
export function fbm(seed, fx, fy, oct = 4, gain = 0.5) {
  const ns = [], amp = [];
  let norm = 0;
  for (let o = 0, a = 1; o < oct; o++, a *= gain) { ns.push(lattice(seed + o * 1013, fx << o, fy << o)); amp.push(a); norm += a; }
  return (u, v) => {
    let s = 0;
    for (let o = 0; o < oct; o++) s += amp[o] * ns[o](u * (fx << o), v * (fy << o));
    return s / norm;
  };
}

// Cells over the texture, cx × cy of them, a point jittered in each (Worley's): for (u, v), the nearest
// point's distance f1 and the next's f2, in cells, the nearest's id and where the pixel is from it.
export function cells(seed, cx, cy, jitter = 0.9) {
  const r = rng(seed), px = new Float32Array(cx * cy), py = new Float32Array(cx * cy);
  for (let k = 0; k < cx * cy; k++) { px[k] = 0.5 + (r() - 0.5) * jitter; py[k] = 0.5 + (r() - 0.5) * jitter; }
  const out = { f1: 0, f2: 0, id: 0, dx: 0, dy: 0 };
  return (u, v) => {
    const x = u * cx, y = v * cy, xi = Math.floor(x), yi = Math.floor(y);
    let f1 = Infinity, f2 = Infinity, id = 0, dx = 0, dy = 0;
    for (let j = yi - 1; j <= yi + 1; j++) for (let i = xi - 1; i <= xi + 1; i++) {
      const k = wrap(j, cy) * cx + wrap(i, cx), ex = x - (i + px[k]), ey = y - (j + py[k]), d = Math.hypot(ex, ey);
      if (d < f1) { f2 = f1; f1 = d; id = k; dx = ex; dy = ey; } else if (d < f2) f2 = d;
    }
    out.f1 = f1; out.f2 = f2; out.id = id; out.dx = dx; out.dy = dy;
    return out;
  };
}

// A number in [0, 1) for an integer, a cell's own (its tone, say).
const hash = (k, s = 0) => {
  let h = Math.imul((k + 1) ^ Math.imul(s + 7, 0x9e3779b1), 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// ---- Images ----

// An n × n RGB image in floats, sRGB, 0 to 1; each pixel from f(u, v, x, y), u and v its middle in [0, 1).
function paint(n, f) {
  const img = new Float32Array(n * n * 3);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const c = f((x + 0.5) / n, (y + 0.5) / n, x, y), o = (y * n + x) * 3;
    img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
  }
  return img;
}

// A stroke from (x, y), `len` pixels at angle `a`, `w` wide, wrapping round the image's edges, in a
// colour that runs from `c0` at its root to `c1` at its tip, `alpha` over what's there.
function stroke(img, n, x, y, a, len, w, c0, c1, alpha = 1) {
  const steps = Math.max(2, Math.ceil(len * 2)), r = w / 2, ca = Math.cos(a), sa = Math.sin(a);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps, cx = x + ca * len * t, cy = y + sa * len * t, rr = r * (1 - 0.6 * t);
    for (let j = Math.floor(cy - rr); j <= Math.ceil(cy + rr); j++) for (let i = Math.floor(cx - rr); i <= Math.ceil(cx + rr); i++) {
      const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy);
      if (d > rr + 0.5) continue;
      const k = alpha * clamp01(rr + 0.5 - d), o = (wrap(j, n) * n + wrap(i, n)) * 3;
      for (let c = 0; c < 3; c++) img[o + c] = mix(img[o + c], mix(c0[c], c1[c], t), k);
    }
  }
}

// An image's bytes: RGB, three a pixel.
export function bytes(img) {
  const out = Buffer.alloc(img.length);
  for (let i = 0; i < img.length; i++) out[i] = Math.round(clamp01(img[i]) * 255);
  return out;
}

// ---- Matching a texture to its references ----

// What a picture measures (refs/textures.json's `match`): its mean colour (sRGB) and its contrast, the
// spread (standard deviation) of its luminance in sRGB's bytes, over its pixels that aren't see-through.
export function measure(data, channels = 3) {
  const sum = [0, 0, 0], L = [];
  for (let i = 0; i < data.length; i += channels) {
    if (channels === 4 && data[i + 3] < 128) continue;
    for (let c = 0; c < 3; c++) sum[c] += data[i + c];
    L.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
  }
  const n = L.length, m = L.reduce((a, b) => a + b, 0) / n;
  return { mean: sum.map((v) => Math.round(v / n)), contrast: +Math.sqrt(L.reduce((a, b) => a + (b - m) ** 2, 0) / n).toFixed(1) };
}

// A texture's bytes brought to a mean colour and a contrast: each pixel's difference from the mean
// colour scaled, then each channel's gain, a few times over as the clamping moves them.
export function match(data, channels, want) {
  for (let pass = 0; pass < 4; pass++) {
    const has = measure(data, channels), k = want.contrast / Math.max(0.5, has.contrast);
    const gain = want.mean.map((v, c) => v / Math.max(1, has.mean[c]));
    for (let i = 0; i < data.length; i += channels) {
      if (channels === 4 && data[i + 3] < 128) continue;
      for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round((has.mean[c] + (data[i + c] - has.mean[c]) * k) * gain[c])));
    }
  }
  return measure(data, channels);
}

// ---- The kinds of ground (task 016's kinds), `n` pixels spanning `metres` ----

// Granite's grain, up close: the grey of its quartz and feldspar, the black flecks of its mica, a few
// white crystals. `g` the stone's own tone.
function granite(r, g) {
  const v = r();
  if (v < 0.07) return g * 0.45;
  if (v > 0.96) return Math.min(1, g * 1.35);
  return g * (0.9 + r() * 0.2);
}

const GROUND = {
  // Asphalt, weathered: its binder worn back to the aggregate's small stones, pale and dark, in a grey
  // that wears lighter where the wheels run and darker in patches; a few fine cracks.
  asphalt(n, p, seed) {
    const m = p.metres, r = rng(seed), stones = cells(seed + 1, Math.round(m / p.stone), Math.round(m / p.stone));
    const wear = fbm(seed + 2, 3, 3, 5), patch = fbm(seed + 3, 2, 2, 3), crack = fbm(seed + 4, 4, 4, 5), mask = fbm(seed + 5, 2, 2, 2);
    return paint(n, (u, v) => {
      const c = stones(u, v), s = hash(c.id), edge = smooth(0.0, 0.18, c.f2 - c.f1);
      // The stone's own tone where it shows, the binder's between.
      let g = mix(0.33, s < 0.15 ? 0.72 : s < 0.55 ? 0.52 : 0.42, edge * (0.6 + 0.4 * hash(c.id, 1)));
      g = granite(r, g);
      g += wear(u, v) * 0.06 - smooth(0.3, 0.5, patch(u, v)) * 0.03;
      if (Math.abs(crack(u, v)) < 0.01 && mask(u, v) > 0.4) g *= 0.6;
      return [g, g * 0.985, g * 0.97];
    });
  },
  // Concrete, as a yard's or a courtyard's: its cement's fine sand, mottled where it cured and wore, a few
  // pores and stains.
  concrete(n, p, seed) {
    const r = rng(seed), mott = fbm(seed + 1, 4, 4, 6, 0.55), stain = fbm(seed + 2, 2, 2, 4), pores = cells(seed + 3, Math.round(p.metres / 0.02), Math.round(p.metres / 0.02)), grain = fbm(seed + 4, Math.round(p.metres * 60), Math.round(p.metres * 60), 2);
    return paint(n, (u, v) => {
      let g = 0.6 + mott(u, v) * 0.05 + grain(u, v) * 0.05 + (r() - 0.5) * 0.12;
      const s = stain(u, v);
      if (s > 0.3) g -= (s - 0.3) * 0.1;
      const c = pores(u, v);
      if (c.f1 < 0.06 && hash(c.id) < 0.3) g *= 0.7;
      return [g * 1.02, g, g * 0.95];
    });
  },
  // Granite setts (cubos), as Braga's streets and squares have them: rows `row` metres apart, each
  // stone `width` long, irregular and worn round at its edges, set in joints of dark grit.
  setts(n, p, seed) {
    const m = p.metres, r = rng(seed), rows = Math.round(m / p.row), rh = m / rows, row = [];
    for (let k = 0; k < rows; k++) {
      const ws = [];
      let sum = 0;
      while (sum < m - p.width[0]) { const w = mix(p.width[0], p.width[1], r()); ws.push(w); sum += w; }
      const f = m / sum, at = [0];
      for (const w of ws) at.push(at.at(-1) + w * f);
      // Each stone's sides set in by their own amounts, its ends slanted, its corners rounded.
      row.push({ at, shift: r() * m, stone: ws.map(() => ({ l: r(), r: r(), t: r(), b: r(), tone: r(), sl: (r() - 0.5) * 0.3, sr: (r() - 0.5) * 0.3, round: mix(0.1, 0.22, r()) * p.row })) });
    }
    const edge = fbm(seed + 1, 20, 20, 3), wave = fbm(seed + 2, 3, 3, 2), dirt = fbm(seed + 3, 8, 8, 4), face = fbm(seed + 4, 16, 16, 3);
    const j = p.joint;
    return paint(n, (u, v) => {
      // Where the pixel is in metres, its row (the rows wave a little), and its stone.
      const ym = (v * m + wave(u, v) * rh * 0.3 + m) % m, k = Math.floor(ym / rh) % rows, R = row[k];
      const xm = (u * m + R.shift) % m, mid = ym - (k + 0.5) * rh;
      let s = 1;
      while (R.at[s] < xm) s++;
      s -= 1;
      const st = R.stone[s], id = k * 997 + s;
      // How far in from its four sides, each set in by its own amount, its ends slanted; its edge rough.
      const dx = Math.min(xm - R.at[s] - j * (0.2 + 0.6 * st.l) - st.sl * mid, R.at[s + 1] - xm - j * (0.2 + 0.6 * st.r) + st.sr * mid);
      const dy = Math.min(ym - k * rh - j * (0.2 + 0.6 * st.t), (k + 1) * rh - ym - j * (0.2 + 0.6 * st.b));
      const q = st.round, corner = dx < q && dy < q ? q - Math.hypot(q - dx, q - dy) : Math.min(dx, dy);
      const d = corner + edge(u, v) * j * 0.7;
      if (d < 0) {
        const g = 0.2 + dirt(u, v) * 0.06 + (r() - 0.5) * 0.06;
        return [g * 1.08, g * 1.02, g * 0.9];
      }
      // The stone: its own tone, rounded off at its edges, its face uneven and speckled.
      const tone = 0.4 + st.tone * 0.24 + hash(id) * 0.06, round = Math.sqrt(smooth(0, j * 2, d));
      const g0 = tone * (0.72 + 0.28 * round) * (1 + face(u, v) * 0.08), g = mix(g0, granite(r, g0), 0.5);
      return [g, g * 0.99, g * 0.96];
    });
  },
  // A lawn: blades of grass, green and some straw-dry, thick in places and thin in others over the soil.
  grass(n, p, seed) {
    const r = rng(seed), soil = fbm(seed + 1, 8, 8, 4), thick = fbm(seed + 2, 3, 3, 3), dry = fbm(seed + 3, 2, 2, 3);
    const img = paint(n, (u, v) => {
      const g = 0.3 + soil(u, v) * 0.06 + (r() - 0.5) * 0.06;
      return [g * 1.2, g, g * 0.7];
    });
    const px = n / p.metres, blades = Math.round(p.blades * p.metres * p.metres);
    for (let b = 0; b < blades; b++) {
      const x = r() * n, y = r() * n, u = x / n, v = y / n;
      if (r() > 0.55 + thick(u, v) * 0.6) continue;
      const d = clamp01(0.5 + dry(u, v) * 1.4 - 0.35) * (r() < 0.12 ? 1 : 0.35), shade = 0.75 + r() * 0.45;
      const tip = mix3([0.33, 0.52, 0.16], [0.62, 0.56, 0.3], d).map((c) => c * shade), root = tip.map((c) => c * 0.5);
      stroke(img, n, x, y, r() * Math.PI * 2, mix(p.blade[0], p.blade[1], r()) * px, Math.max(1, 0.0025 * px), root, tip, 0.95);
    }
    return img;
  },
  // Bare, dry soil: its clods and their cracks, small stones, and a few bits of dry twig.
  soil(n, p, seed) {
    const r = rng(seed), m = p.metres, clods = cells(seed + 1, Math.round(m / 0.035), Math.round(m / 0.035)), body = fbm(seed + 2, 4, 4, 6, 0.55);
    const stones = cells(seed + 3, Math.round(m / 0.05), Math.round(m / 0.05));
    const img = paint(n, (u, v) => {
      const c = clods(u, v), lit = 1 - 0.25 * smooth(0.0, 0.5, c.f1) + (c.dy < 0 ? 0.04 : -0.04);
      let g = (0.56 + body(u, v) * 0.1) * lit * (0.94 + hash(c.id) * 0.12) * (c.f2 - c.f1 < 0.04 ? 0.82 : 1) + (r() - 0.5) * 0.05;
      const s = stones(u, v);
      const sr = 0.1 + hash(s.id, 1) * 0.12;
      if (hash(s.id) < 0.08 && s.f1 < sr) { const h = Math.sqrt(1 - (s.f1 / sr) ** 2), t = (0.42 + hash(s.id, 2) * 0.2) * (0.6 + 0.4 * h + (-s.dx - s.dy) * 1.2 * h); return [t * 1.05, t, t * 0.9]; }
      return [g * 1.1, g * 0.86, g * 0.62];
    });
    const px = n / m;
    for (let k = 0; k < p.twigs * m * m; k++) stroke(img, n, r() * n, r() * n, r() * Math.PI * 2, (0.02 + r() * 0.05) * px, Math.max(1, 0.003 * px), [0.32, 0.24, 0.17], [0.4, 0.31, 0.22], 0.8);
    return img;
  },
  // Gravel: rounded pebbles of a few greys and buffs, lit from one side, in their dark gaps; smaller ones
  // between the bigger.
  gravel(n, p, seed) {
    const m = p.metres, big = cells(seed + 1, Math.round(m / p.stone), Math.round(m / p.stone)), small = cells(seed + 2, Math.round(m / (p.stone * 0.5)), Math.round(m / (p.stone * 0.5)));
    const r = rng(seed), tones = [[0.72, 0.71, 0.68], [0.6, 0.58, 0.55], [0.82, 0.8, 0.75], [0.5, 0.49, 0.47], [0.7, 0.64, 0.55]];
    const pebble = (c, s) => {
      const rad = 0.42 + hash(c.id, s) * 0.12, gap = c.f2 - c.f1;
      if (gap < 0.08 || c.f1 > rad) return null;
      const h = Math.sqrt(1 - (c.f1 / rad) ** 2) * smooth(0.08, 0.2, gap), lit = 0.55 + 0.45 * h + (-c.dx - c.dy) * 0.35 * h;
      return tones[Math.floor(hash(c.id, s + 1) * tones.length)].map((t) => t * lit * (0.92 + r() * 0.16));
    };
    return paint(n, (u, v) => {
      const a = pebble(big(u, v), 1) ?? pebble(small(u, v), 7);
      if (a) return a;
      const g = 0.22 + r() * 0.08;
      return [g, g * 0.97, g * 0.93];
    });
  },
};

// ---- The barks (task 019's kinds of tree), `n` pixels spanning `metres`, x round the trunk, y up it ----

const BARK = {
  // Smooth bark, a hackberry's or a young lime's: grey, mottled with lichen, lenticels in short
  // crosswise dashes, a few corky warts.
  smooth(n, p, seed) {
    const m = p.metres, r = rng(seed), mott = fbm(seed + 1, 3, 6, 5), lich = fbm(seed + 2, 4, 4, 4), dash = cells(seed + 3, Math.round(m / 0.03), Math.round(m / 0.012)), wart = fbm(seed + 4, 8, 16, 3);
    return paint(n, (u, v) => {
      let g = 0.5 + mott(u, v) * 0.08 + (r() - 0.5) * 0.04;
      const c = dash(u, v);
      if (hash(c.id) < 0.35 && Math.abs(c.dy) < 0.12 && Math.abs(c.dx) < 0.45) g *= 0.72;
      const w = wart(u, v);
      if (w > 0.45) g *= 0.85 + (w - 0.45);
      const l = smooth(0.2, 0.5, lich(u, v));
      return mix3([g * 1.02, g, g * 0.92], [g * 1.0, g * 1.06, g * 0.86], l * 0.4);
    });
  },
  // A pine's: thick plates, taller than wide, flaking in thin layers of grey over red-brown, split by
  // deep dark furrows that wind up the trunk.
  plates(n, p, seed) {
    const m = p.metres, r = rng(seed), plate = cells(seed + 1, Math.round(m / p.plate[0]), Math.round(m / p.plate[1]), 0.9), flake = fbm(seed + 2, 12, 20, 5, 0.6), warp = fbm(seed + 3, 4, 3, 3), scale = fbm(seed + 4, 40, 40, 2);
    return paint(n, (u, v) => {
      const w = warp(u, v), c = plate((u + w * 0.04 + 1) % 1, (v + w * 0.03 + 1) % 1), gap = c.f2 - c.f1, fur = smooth(0.03, 0.3, gap), f = flake(u, v);
      // The plate's layers: its outer grey flaking off the red-brown under it.
      const layer = smooth(-0.1, 0.15, f + (hash(c.id) - 0.5) * 0.4);
      const top = mix3([0.62, 0.38, 0.25], [0.66, 0.6, 0.55], layer).map((t) => t * (0.9 + scale(u, v) * 0.12));
      const g = (0.25 + 0.75 * fur) * (0.9 + (r() - 0.5) * 0.14);
      return gap < 0.04 ? [0.1, 0.07, 0.05] : top.map((t) => t * g);
    });
  },
  // A blue gum's: smooth and pale where the old bark has peeled, long strips of it still hanging, grey,
  // tan and cream, each strip's edge darker.
  peeling(n, p, seed) {
    const r = rng(seed), strips = fbm(seed + 1, 8, 1, 4), patch = fbm(seed + 2, 4, 2, 4), fine = fbm(seed + 3, 32, 8, 2);
    const layers = [[0.82, 0.8, 0.7], [0.66, 0.65, 0.58], [0.6, 0.47, 0.34], [0.75, 0.7, 0.62]];
    return paint(n, (u, v) => {
      const s = strips(u, v) + patch(u, v) * 0.5, k = Math.max(0, Math.min(3, Math.floor((s + 0.7) * 2.6)));
      const edge = Math.abs(((s + 0.7) * 2.6) % 1 - 0.5) > 0.44 ? 0.6 : 1;
      const g = edge * (0.95 + fine(u, v) * 0.08 + (r() - 0.5) * 0.05);
      return layers[k].map((c) => c * g);
    });
  },
  // A cedar's or a cypress's: stringy, in long fibres up the trunk, reddish, split by narrow furrows that
  // wind and fork.
  fibres(n, p, seed) {
    const r = rng(seed), fib = fbm(seed + 1, 96, 4, 3), fur = fbm(seed + 2, 6, 1, 3), warp = fbm(seed + 3, 4, 2, 3), tone = fbm(seed + 4, 4, 2, 3);
    return paint(n, (u, v) => {
      const w = (u + warp(u, v) * 0.05 + 1) % 1, f = fib(w, v), d = Math.abs(fur(w, v));
      const g = (0.72 + f * 0.35) * (0.35 + 0.65 * smooth(0.01, 0.07, d)) * (0.93 + (r() - 0.5) * 0.14) * (1 + tone(u, v) * 0.12);
      return [0.62 * g, 0.44 * g, 0.32 * g];
    });
  },
  // A poplar's or a willow's: deep furrows that part and meet again in long diamonds between grey-brown
  // ridges, streaked up their length.
  furrows(n, p, seed) {
    const r = rng(seed), net = cells(seed + 1, p.across, p.up, 0.9), warp = fbm(seed + 2, 4, 3, 3), streak = fbm(seed + 3, 64, 6, 2), tone = fbm(seed + 4, 3, 3, 3);
    return paint(n, (u, v) => {
      const w = warp(u, v), c = net((u + w * 0.03 + 1) % 1, (v + w * 0.05 + 1) % 1), d = smooth(0.02, p.furrow, c.f2 - c.f1);
      const g = (0.28 + 0.72 * Math.sqrt(d)) * (0.9 + streak(u, v) * 0.2 + tone(u, v) * 0.1 + (r() - 0.5) * 0.08) * (0.95 + hash(c.id) * 0.1);
      return [0.55 * g, 0.47 * g, 0.4 * g];
    });
  },
  // A palm's trunk: the bases of its fallen fronds in rings round it, each a ridge with a dark scar under
  // it, staggered ring to ring, their fibres across.
  rings(n, p, seed) {
    const m = p.metres, r = rng(seed), bands = Math.round(m / p.band), around = Math.round(p.around), fibre = fbm(seed + 1, 64, 4, 2), wob = fbm(seed + 2, 2, 4, 2);
    return paint(n, (u, v) => {
      const y = v * bands + 0.5 + wob(u, v) * 0.15, k = Math.floor(y), f = y - k;
      const x = u * around + hash(wrap(k, bands)), sx = Math.abs((x % 1) - 0.5) * 2;
      // A ridge at the ring's top, the scar under it, the diamond's sides between two bases.
      let g = 0.55 + 0.35 * Math.sin(f * Math.PI) - (f > 0.82 ? 0.35 : 0) - (sx > 0.9 ? 0.15 : 0);
      g *= 0.9 + fibre(u, v) * 0.16 + (r() - 0.5) * 0.08 + hash(wrap(k, bands) * 31 + wrap(Math.floor(x), around)) * 0.18;
      return [g * 0.62, g * 0.57, g * 0.5];
    });
  },
  // A plane's: flaking in patches, each its own grey, olive, green or cream, their edges a little darker.
  patches(n, p, seed) {
    const r = rng(seed), patch = cells(seed + 1, p.across, p.up, 1), warp = fbm(seed + 2, 4, 6, 4), fine = fbm(seed + 3, 32, 32, 2);
    const tones = [[0.55, 0.56, 0.48], [0.68, 0.68, 0.56], [0.8, 0.78, 0.62], [0.5, 0.54, 0.42], [0.62, 0.6, 0.55], [0.74, 0.72, 0.6]];
    return paint(n, (u, v) => {
      const w = warp(u, v) * 0.12, c = patch((u + w + 1) % 1, (v + w * 0.7 + 1) % 1), edge = 0.94 + 0.06 * smooth(0, 0.12, c.f2 - c.f1);
      const g = edge * (0.96 + fine(u, v) * 0.06 + (r() - 0.5) * 0.04);
      return tones[Math.floor(hash(c.id) * tones.length)].map((t) => t * g);
    });
  },
  // A lime's: shallow ridges that branch and meet in a net up the trunk, grey-brown, darker in their
  // furrows.
  ridges(n, p, seed) {
    const r = rng(seed), net = cells(seed + 1, p.across, p.up, 1), warp = fbm(seed + 2, 4, 3, 3), tone = fbm(seed + 3, 3, 3, 3), fine = fbm(seed + 4, 48, 96, 2);
    return paint(n, (u, v) => {
      const w = warp(u, v), c = net((u + w * 0.04 + 1) % 1, (v + w * 0.06 + 1) % 1), d = smooth(0.0, p.furrow, c.f2 - c.f1);
      const g = (0.62 + 0.38 * d) * (0.93 + tone(u, v) * 0.12 + fine(u, v) * 0.14 + (r() - 0.5) * 0.08) * (0.94 + hash(c.id) * 0.12);
      return [0.56 * g, 0.5 * g, 0.38 * g];
    });
  },
  // A birch's: white, its lenticels in dark crosswise dashes, a few dark rough patches where it cracks.
  white(n, p, seed) {
    const m = p.metres, r = rng(seed), dash = cells(seed + 1, Math.round(m / 0.06), Math.round(m / 0.025)), crack = fbm(seed + 2, 3, 6, 4), grey = fbm(seed + 3, 4, 8, 4);
    return paint(n, (u, v) => {
      let g = 0.9 + grey(u, v) * 0.05 + (r() - 0.5) * 0.03;
      const c = dash(u, v);
      if (hash(c.id) < 0.35 && Math.abs(c.dy) < 0.05 + hash(c.id, 1) * 0.06 && Math.abs(c.dx) < 0.15 + hash(c.id, 2) * 0.4) g = mix(g, 0.35 + hash(c.id, 3) * 0.2, 0.85);
      if (crack(u, v) > 0.42) g = 0.2 + r() * 0.1;
      return [g, g * 0.99, g * 0.96];
    });
  },
};

// ---- Leaves (task 019's sprays), each drawn from its shape ----

// A leaf's outline, `L` pixels from its stalk's end (at the bottom) to its tip, as SVG; its midrib and
// veins; filled in two tones across it, the fold between, as the light falls on a leaf. The kinds:
// ovate, lanceolate (a eucalyptus's, curved), deltoid (a poplar's), cordate (a lime's, heart-shaped),
// rhombic (a birch's), palmate (a plane's, five lobes), leaflet (a palm's); and needles: a twig of a
// pine's long ones or a fir's short ones, every way round it.
const PROFILE = { ovate: [0.6, 1.0, 0.55], lanceolate: [0.5, 1.3, 0.2], deltoid: [0.25, 1.1, 0.85], cordate: [0.3, 1.0, 0.85], rhombic: [0.8, 0.8, 0.62], leaflet: [0.4, 1.0, 0.1] };
function leafSVG(shape, p, r) {
  const L = 160, S = Math.round(L * 1.2), cx = S / 2, foot = S - 4, stalk = L * (p.stalk ?? 0.12), base = foot - stalk;
  const [a, b] = [p.tones[0], p.tones[1]].map((t) => t.map((v) => Math.round(v * (0.9 + r() * 0.2))));
  const rgb = (c) => `rgb(${c.map((v) => Math.max(0, Math.min(255, v))).join(',')})`;
  const vein = rgb(mix3(a, [230, 235, 190], 0.35)), dark = rgb(a.map((v) => v * 0.7));
  let outline, veins = '', body = L - stalk;
  if (shape === 'needles') {
    // A twig, its needles along it, pointing forward, either side and over it.
    const lines = [`<line x1="${cx}" y1="${foot}" x2="${cx}" y2="${foot - body * 0.6}" stroke="${rgb([70, 66, 42])}" stroke-width="${(L / 40).toFixed(1)}" stroke-linecap="round"/>`];
    for (let k = 0; k < p.needles; k++) {
      const t = 0.08 + 0.75 * (k / p.needles), y = foot - body * t * 0.8, side = k % 2 ? 1 : -1, ang = (p.angle[0] + r() * (p.angle[1] - p.angle[0])) * (Math.PI / 180), len = body * p.length * (0.8 + r() * 0.3) * (1 - 0.4 * t);
      const c = rgb(mix3(a, b, r()));
      lines.push(`<line x1="${cx}" y1="${y.toFixed(1)}" x2="${(cx + side * Math.sin(ang) * len).toFixed(1)}" y2="${(y - Math.cos(ang) * len).toFixed(1)}" stroke="${c}" stroke-width="${(L / 90 * (p.width ?? 1)).toFixed(1)}" stroke-linecap="round"/>`);
    }
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${lines.join('')}</svg>`, S };
  }
  if (shape === 'palmate') {
    // Five lobes from the leaf's heart, each pointed and toothed, its main vein out to its tip.
    const c0 = base - body * 0.4, R = body * 0.6, tips = [-1.85, -0.95, 0, 0.95, 1.85], pts = [];
    for (let k = 0; k <= 160; k++) {
      const th = -2.6 + (5.2 * k) / 160, lobe = Math.max(...tips.map((t, i) => Math.exp(-(((th - t) / 0.3) ** 2)) * (i === 2 ? 1 : i % 2 ? 0.92 : 0.7)));
      const rr = R * (0.38 + 0.62 * lobe) * (1 + (k % 4 === 0 ? 0.03 : 0));
      pts.push([cx + Math.sin(th) * rr, c0 - Math.cos(th) * rr]);
    }
    pts.push([cx, base]);
    outline = pts;
    veins = tips.map((t, i) => `<line x1="${cx}" y1="${base}" x2="${(cx + Math.sin(t) * R * 0.85 * (i === 2 ? 1 : i % 2 ? 0.8 : 0.6)).toFixed(1)}" y2="${(c0 - Math.cos(t) * R * 0.85 * (i === 2 ? 1 : i % 2 ? 0.8 : 0.6)).toFixed(1)}" stroke="${vein}" stroke-width="1.6"/>`).join('');
  } else {
    // Its half-width along it, from its foot to its tip, toothed where it is; curved where it is.
    const [pa, pb, w0] = PROFILE[shape], wr = w0 * (0.88 + r() * 0.24), teeth = p.teeth ?? 0, curve = ((p.curve ?? 0) + (r() - 0.5) * 0.06) * body, right = [], left = [];
    let top = 0;
    for (let k = 0; k <= 60; k++) { const t = k / 60; top = Math.max(top, t ** pa * (1 - t) ** pb); }
    for (let k = 0; k <= 60; k++) {
      const t = k / 60, tooth = teeth ? 1 + 0.06 * Math.abs(((t * teeth) % 1) - 0.5) * 2 : 1;
      let w = ((t ** pa * (1 - t) ** pb) / top) * body * wr * 0.5 * tooth;
      // A heart's base: its two lobes round under where the stalk meets it.
      const dip = shape === 'cordate' && t < 0.15 ? body * 0.12 * (1 - t / 0.15) : 0;
      const y = base - t * body + dip, x = cx + Math.sin(t * Math.PI) * curve;
      if (shape === 'cordate' && t < 0.15) w = Math.max(w, body * wr * 0.35 * (t / 0.15) ** 0.5);
      right.push([x + w, y]); left.unshift([x - w, y]);
    }
    outline = [...right, ...left];
    const mid = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; mid.push([cx + Math.sin(t * Math.PI) * curve, base - t * body]); }
    veins = `<polyline points="${mid.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${vein}" stroke-width="1.6"/>`;
    for (let k = 1; k < (p.veins ?? 0) + 1; k++) {
      const t = k / ((p.veins ?? 0) + 1.5), y = base - t * body, x = cx + Math.sin(t * Math.PI) * curve, w = ((t ** pa * (1 - t) ** pb) / top) * body * wr * 0.42;
      for (const s of [-1, 1]) veins += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + s * w).toFixed(1)}" y2="${(y - body * 0.09).toFixed(1)}" stroke="${vein}" stroke-width="0.9" stroke-opacity="0.7"/>`;
    }
  }
  const d = `M${outline.map((q) => q.map((v) => v.toFixed(1)).join(',')).join('L')}Z`;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${rgb(b)}"/><stop offset="0.5" stop-color="${rgb(a)}"/><stop offset="1" stop-color="${rgb(mix3(a, b, 0.5))}"/></linearGradient></defs><line x1="${cx}" y1="${foot}" x2="${cx}" y2="${base}" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/><path d="${d}" fill="url(#g)" stroke="${dark}" stroke-width="1"/>${veins}</svg>`,
    S,
  };
}

// A kind's leaves (refs/textures.json's `leaf`): `variants` of them, each a little different in its
// tones, upright, its stalk at the bottom, cut to what's drawn.
export async function leafSprites(leaf, seed) {
  const r = rng(seed), out = [];
  for (let k = 0; k < (leaf.variants ?? 8); k++) {
    const { svg } = leafSVG(leaf.shape, leaf, r);
    const up = await sharp(Buffer.from(svg)).png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    out.push({ png: up.data, w: up.info.width, h: up.info.height });
  }
  return out;
}

// ---- Twigs (task 093): a deciduous kind's crown when its leaves are down ----

// A card of a kind's bare twigs, laid as its sprays of leaves are (task 019's), fanning up from the
// card's foot over `fan` radians either side of the upright, `len` of the card long: `branches` from it,
// each forking `depth` times (`forks` along each twig, from `from` of
// the way up it), each fork shorter (`shorten`) and thinner, spreading `spread` degrees from its twig,
// wandering (`wander`) and, the further out, hanging (`droop`: a birch's); each twig in a tone between
// the two of `tones`, thinning to its tip, `width` its foot's share of the card; and a plane's seed
// balls hanging from a share of its last twigs (`balls`). `S` pixels a side, as SVG.
export function twigsSVG(p, S, r) {
  const lines = [], rgb = (c) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`, SEG = 6;
  const grow = (x, y, a, len, w, level) => {
    const c = rgb(mix3(p.tones[0], p.tones[1], r())), pts = [[x, y]];
    for (let k = 1; k <= SEG; k++) {
      a += (r() - 0.5) * (p.wander ?? 0.3) + (p.droop ?? 0) * level * Math.cos(a);
      x += (Math.cos(a) * len) / SEG;
      y += (Math.sin(a) * len) / SEG;
      pts.push([x, y]);
    }
    for (let k = 1; k <= SEG; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
      lines.push(`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${c}" stroke-width="${Math.max(0.8, w * (1 - (0.45 * k) / SEG)).toFixed(2)}" stroke-linecap="round"/>`);
    }
    if (level === p.depth) {
      if (p.balls && r() < p.balls) {
        const d = S * 0.035;
        lines.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + d).toFixed(1)}" stroke="${c}" stroke-width="0.8"/><circle cx="${x.toFixed(1)}" cy="${(y + d).toFixed(1)}" r="${(S * 0.011).toFixed(1)}" fill="${rgb(p.tones[0].map((v) => v * 0.8))}"/>`);
      }
      return;
    }
    for (let f = 0; f < p.forks; f++) {
      const at = Math.min(SEG, Math.round(SEG * (p.from + (1 - p.from) * ((f + r() * 0.8) / p.forks)))), side = (f + level) % 2 ? 1 : -1;
      const [fx, fy] = pts[at], [px, py] = pts[at - 1], dir = Math.atan2(fy - py, fx - px);
      grow(fx, fy, dir + (side * (p.spread[0] + r() * (p.spread[1] - p.spread[0])) * Math.PI) / 180, len * p.shorten * (0.8 + r() * 0.4), w * 0.62, level + 1);
    }
  };
  for (let b = 0; b < p.branches; b++) {
    const a = -Math.PI / 2 + (b / Math.max(1, p.branches - 1) - 0.5) * 2 * (p.fan ?? 1) + (r() - 0.5) * 0.25;
    grow(S / 2 + (r() - 0.5) * S * 0.08, S * 0.96, a, S * (p.len ?? 0.45) * (0.9 + r() * 0.3), S * p.width, 0);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${lines.join('')}</svg>`;
}

// ---- What each recipe's `generator` names ----

export const GENERATORS = { ground: Object.keys(GROUND), bark: Object.keys(BARK), leaves: ['spray'], twigs: ['twigs'] };

// A kind of ground's or a bark's texture, n pixels a side: its bytes, RGB.
export function make(kind, generator, n, params, seed) {
  const f = (kind === 'surface' ? GROUND : BARK)[generator];
  if (!f) throw new Error(`no ${kind === 'surface' ? 'ground' : 'bark'} generator ${generator}: ${Object.keys(kind === 'surface' ? GROUND : BARK).join(', ')}`);
  return bytes(f(n, params, seed));
}
