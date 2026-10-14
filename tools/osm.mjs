// What world.mjs and track.mjs share: reading OpenStreetMap's tags (how wide a street is, what an
// area is), the buildings' footprints, a little geometry, and packing numbers for the games.
import { P } from './geo.mjs';

// ---- Streets ----

// No street in the games is narrower than this, kerb to kerb, so eight karts still fit.
export const W_MIN = 9;
const LANE_W = { motorway: 3.6, trunk: 3.5, primary: 3.4, secondary: 3.3, tertiary: 3.2 }; // others 3
const BARE = { motorway: 11, trunk: 10, primary: 10, secondary: 9, tertiary: 8, residential: 6.5, unclassified: 6, living_street: 5, pedestrian: 6, service: 4, track: 3 };
export const isOneway = (t) => t.oneway === 'yes' || t.oneway === '-1' || t.junction === 'roundabout';
// Which way a car may drive a street: 1 only the way it's drawn (a one-way street, a roundabout
// anticlockwise), -1 only against it (`oneway=-1`), 0 both. A car's own `oneway:` tag wins.
export function driven(t = {}) {
  const v = t['oneway:motorcar'] ?? t['oneway:motor_vehicle'] ?? t.oneway;
  if (v === '-1') return -1;
  if (v === 'yes' || v === '1' || v === 'true' || (v == null && (t.junction === 'roundabout' || t.junction === 'circular'))) return 1;
  return 0;
}
// The carriageway, kerb to kerb: the map's width where it gives one, else its lanes, else what that
// kind of street usually is.
export function carriageway(t = {}) {
  const kind = (t.highway || 'residential').replace('_link', '');
  const w = parseFloat(t.width);
  if (w >= 3 && w <= 40) return w;
  const lanes = parseInt(t.lanes);
  if (lanes > 0) return lanes * (LANE_W[kind] ?? 3) + (isOneway(t) ? 0.6 : 1);
  return (BARE[kind] ?? 6) * (isOneway(t) ? 0.65 : 1) * (String(t.highway).endsWith('_link') ? 0.8 : 1);
}
// The lines painted on it: how many lanes (0 for none), and whether it's one way.
export function lanesOf(t = {}) {
  if (t.lane_markings === 'no') return 0;
  const l = parseInt(t.lanes);
  if (l > 0) return Math.min(l, 6);
  return ['primary', 'secondary', 'tertiary'].includes(t.highway) ? (isOneway(t) ? 1 : 2) : 0;
}
export const COBBLE = new Set(['sett', 'cobblestone', 'unhewn_cobblestone', 'paving_stones', 'granite']);
// The classes of street and railway the games draw, numbered: 0 the fast roads, 1 their links,
// 2 primary, 3 secondary, 4 tertiary, 5 residential, 6 pedestrian, 7 service, 8 track, 9 railway.
export const LINE = { trunk: 0, motorway: 0, trunk_link: 1, motorway_link: 1, primary: 2, primary_link: 2, secondary: 3, secondary_link: 3, tertiary: 4, tertiary_link: 4, residential: 5, unclassified: 5, living_street: 5, pedestrian: 6, service: 7, track: 8 };

// ---- Areas ----

// What the ground is, in the order the games paint it.
export const AREA = ['urban', 'industrial', 'farm', 'grass', 'scrub', 'forest', 'park', 'cemetery', 'hospital', 'school', 'sport', 'water', 'plaza'];
export const AREA_OF = (t) => {
  if (t.natural === 'water') return 'water';
  if (t.landuse === 'forest' || t.natural === 'wood') return 'forest';
  if (t.natural === 'scrub' || t.natural === 'heath') return 'scrub';
  if (t.landuse === 'cemetery') return 'cemetery';
  if (['pitch', 'stadium', 'track', 'sports_centre', 'golf_course'].includes(t.leisure)) return 'sport';
  if (t.leisure === 'park' || t.leisure === 'garden') return 'park';
  if (['grass', 'recreation_ground'].includes(t.landuse) || ['grassland', 'grass', 'shrubbery'].includes(t.natural)) return 'grass';
  if (['farmland', 'meadow', 'orchard', 'vineyard'].includes(t.landuse)) return 'farm';
  if (t.landuse === 'industrial') return 'industrial';
  if (t.amenity === 'hospital') return 'hospital';
  if (['university', 'school', 'college'].includes(t.amenity)) return 'school';
  if (t.landuse) return 'urban';
  return null;
};

// ---- Buildings ----

// The buildings: one way each, or for the big ones mapped as a multipolygon (the Altice Forum),
// each of its outer rings, with the relation's tags and an id of the relation's times 16 plus the
// ring.
export function footprints(buildingsOsm) {
  return buildingsOsm.elements.flatMap((e) => {
    if (e.type === 'way') return e.geometry ? [e] : [];
    if (e.type !== 'relation') return [];
    const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
    const ways = e.members.filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry).map((m) => m.geometry.slice());
    const rings = [];
    while (ways.length) {
      let ring = ways.shift();
      for (let guard = 0; guard < 50 && !(ring.length > 3 && same(ring[0], ring[ring.length - 1])); guard++) {
        const end = ring[ring.length - 1];
        const k = ways.findIndex((w) => same(w[0], end) || same(w[w.length - 1], end));
        if (k < 0) break;
        const w = ways.splice(k, 1)[0];
        ring = ring.concat(same(w[0], end) ? w.slice(1) : w.reverse().slice(1));
      }
      rings.push(ring);
    }
    return rings.map((g, k) => ({ type: 'way', id: e.id * 16 + k, tags: e.tags, geometry: g }));
  });
}
export const ringOf = (e) => e.geometry.map(P);

// ---- Geometry ----

export const segDist = (px, pz, a, b) => {
  const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / L)) : 0;
  return Math.hypot(px - a.x - t * dx, pz - a.z - t * dz);
};

// Douglas-Peucker on a closed loop: drops the points that only wobble along a straight line.
export function simplify(pts, tol) {
  const open = [...pts, pts[0]];
  const keep = new Uint8Array(open.length);
  keep[0] = keep[open.length - 1] = 1;
  const stack = [[0, open.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = segDist(open[i][0], open[i][1], { x: open[a][0], z: open[a][1] }, { x: open[b][0], z: open[b][1] }); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return open.filter((_, i) => keep[i]).slice(0, -1);
}

// The same on an open line.
export function openThin(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop();
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = segDist(pts[i][0], pts[i][1], { x: pts[a][0], z: pts[a][1] }, { x: pts[b][0], z: pts[b][1] }); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// A moving average round a loop, `k` points either side.
export function blur(vals, k) {
  const n = vals.length, out = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, w = 0;
    for (let j = -k; j <= k; j++) { const g = Math.exp(-(j * j) / (2 * (k / 2) ** 2)); s += vals[(((i + j) % n) + n) % n] * g; w += g; }
    out[i] = s / w;
  }
  return out;
}

export const ringArea = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
export const inside = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
export const bounds = (pts) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
};
export const overlaps = (a, b, m = 0) => a.x0 <= b.x1 + m && a.x1 >= b.x0 - m && a.z0 <= b.z1 + m && a.z1 >= b.z0 - m;

// The smallest rectangle round a footprint: centre, the angle of its long side, its half-sizes.
export function minRect(pts) {
  let best = null;
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], l = Math.hypot(bx - ax, bz - az);
    if (l < 0.5) continue;
    const ux = (bx - ax) / l, uz = (bz - az) / l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of pts) { const a = x * ux + z * uz, b = -x * uz + z * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const area = (a1 - a0) * (b1 - b0);
    if (!best || area < best.area) {
      const am = (a0 + a1) / 2, bm = (b0 + b1) / 2, long = a1 - a0 >= b1 - b0;
      best = { area, x: am * ux - bm * uz, z: am * uz + bm * ux, angle: Math.atan2(long ? uz : ux, long ? ux : -uz), L: Math.max(a1 - a0, b1 - b0) / 2, W: Math.min(a1 - a0, b1 - b0) / 2 };
    }
  }
  return best;
}

// The axis of a footprint's smallest rectangle lined up with one of its edges: the long side's
// angle, from 0 to π. In exact arithmetic but for the last step (no hypot, a strict comparison), so
// index.js, which has the same function, gets the same axis from the same points in any browser: a
// building's roof runs along it or across it.
export function rectAxis(pts) {
  let best = null;
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], l = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
    if (l < 0.5) continue;
    const ux = (bx - ax) / l, uz = (bz - az) / l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of pts) { const a = x * ux + z * uz, b = -x * uz + z * ux; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
    const area = (a1 - a0) * (b1 - b0);
    if (!best || area < best.area) best = { area, ux: a1 - a0 >= b1 - b0 ? ux : -uz, uz: a1 - a0 >= b1 - b0 ? uz : ux };
  }
  if (!best) return 0;
  let { ux, uz } = best;
  if (uz < 0 || (uz === 0 && ux < 0)) { ux = -ux; uz = -uz; }
  return Math.atan2(uz, ux);
}

// A spatial index of things by the cells of a grid `cell` metres square.
export class Grid {
  constructor(cell) { this.cell = cell; this.m = new Map(); }
  key(x, z) { return Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell); }
  add(x, z, v) { const k = this.key(x, z); if (!this.m.has(k)) this.m.set(k, []); this.m.get(k).push(v); }
  // Everything in the cells within `reach` cells of (x, z).
  near(x, z, reach = 1) {
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell), out = [];
    for (let a = -reach; a <= reach; a++) for (let b = -reach; b <= reach; b++) { const l = this.m.get(cx + a + ',' + (cz + b)); if (l) for (const v of l) out.push(v); }
    return out;
  }
}

// Repeatable random numbers: a hash of an id, and a seeded sequence.
export const hash = (id, k) => { let x = (id * 2654435761 + k * 40503) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };
export const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---- Packing ----

export const half = (v) => Math.round(v * 2); // half metres
export const dm = (v) => Math.round(v * 10); // decimetres
// Heights on a grid, row by row, as decimetres: each less a guess from those before it. Between
// the left and the one above, and a quarter of how the row above climbs past it; in the last
// column, LOCO-I's guess (the left or the above where the one above left says there's an edge
// between them, else a plane through all three); the first row from the left, the first column from
// above. Small numbers pack smaller. index.js's grid() undoes it.
export const guessGrid = (h, k, nx) => {
  const i = k % nx;
  if (!i) return k ? h[k - nx] : 0;
  if (k < nx) return h[k - 1];
  const l = h[k - 1], u = h[k - nx], ul = h[k - nx - 1];
  if (i < nx - 1) return Math.round((2 * l + 2 * u + h[k - nx + 1] - ul) / 4);
  return ul >= Math.max(l, u) ? Math.min(l, u) : ul <= Math.min(l, u) ? Math.max(l, u) : l + u - ul;
};
export const packGrid = (h, nx) => h.map((v, k) => v - guessGrid(h, k, nx));
// Points as half metres, the first as it is and each after as the step from the one before.
export const packPts = (pts) => { const o = []; let px = 0, pz = 0; pts.forEach(([x, z], i) => { const hx = half(x), hz = half(z); o.push(i ? hx - px : hx, i ? hz - pz : hz); px = hx; pz = hz; }); return o; };

// Numbers for a game, in parts: `part(name, nums, meta)` adds one, and `encode()` packs them as a
// JSON header (each part's start, count and meta) then 16-bit numbers, in base64.
export class Packer {
  constructor() { this.header = {}; this.data = []; }
  part(name, nums, meta = {}) { this.header[name] = { at: this.data.length, n: nums.length, ...meta }; for (const v of nums) this.data.push(v); }
  encode() {
    const head = Buffer.from(JSON.stringify(this.header), 'utf8');
    const pad = (4 - ((head.length + 4) % 4)) % 4;
    const buf = Buffer.alloc(4 + head.length + pad + this.data.length * 2);
    buf.writeUInt32LE(head.length, 0);
    head.copy(buf, 4);
    const view = new Int16Array(buf.buffer, buf.byteOffset + 4 + head.length + pad, this.data.length);
    this.data.forEach((v, i) => { if (!(v <= 32767 && v >= -32768)) throw new Error(`a number won't fit in 16 bits: ${v}`); view[i] = v; });
    return buf.toString('base64');
  }
}
