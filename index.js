// The map of Braga, for games: the world in 500 m tiles grouped into named sections, and the tracks
// planned on it (tracks/). Everything is in metres from the Praça da República, x east, z south and
// y up, with heights above ELEV0. Made by the scripts in tools/ from OpenStreetMap and DGT's LiDAR
// and orthophoto. © OpenStreetMap contributors (ODbL); the ground, and the buildings' heights and
// roofs: informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).
import BASE from './world/base.js';
import { TILES } from './world/tiles.js';

// A packed part of the map: a JSON header (where each part's numbers start, how many, and what
// else it needs), then 16-bit numbers, in base64.
function unpack(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const hl = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  const head = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + hl)));
  const off = 4 + hl + ((4 - ((hl + 4) % 4)) % 4);
  return { head, nums: new Int16Array(bytes.buffer, off, (bytes.length - off) >> 1) };
}

// Points stepped in half metres, n of them from nums[i]: the first from (x0, z0) (in half metres),
// each after it the step from the one before.
function points(nums, i, n, x0 = 0, z0 = 0) {
  const out = [];
  let x = x0;
  let z = z0;
  for (let k = 0; k < n; k++) {
    x += nums[i + k * 2];
    z += nums[i + k * 2 + 1];
    out.push([x / 2, z / 2]);
  }
  return out;
}

// A grid of heights in metres, from decimetres packed row by row, each less a guess from those
// before it (tools/osm.mjs's packGrid): between the left and the one above, and a quarter of how the
// row above climbs past it; in the last column the left or the above where the one above left says
// there's an edge between them, else a plane through all three; the first row from the left, the
// first column from above.
function grid(nums, g) {
  const nx = g.nx;
  const dm = new Int32Array(nx * g.nz);
  for (let k = 0; k < dm.length; k++) {
    const i = k % nx;
    let guess = 0;
    if (!i) guess = k ? dm[k - nx] : 0;
    else if (k < nx) guess = dm[k - 1];
    else {
      const l = dm[k - 1];
      const u = dm[k - nx];
      const ul = dm[k - nx - 1];
      if (i < nx - 1) guess = Math.round((2 * l + 2 * u + dm[k - nx + 1] - ul) / 4);
      else guess = ul >= Math.max(l, u) ? Math.min(l, u) : ul <= Math.min(l, u) ? Math.max(l, u) : l + u - ul;
    }
    dm[k] = nums[g.at + k] + guess;
  }
  const h = new Float32Array(dm.length);
  for (let k = 0; k < h.length; k++) h[k] = dm[k] / 10;
  return { x0: g.x0, z0: g.z0, step: g.step, nx: g.nx, nz: g.nz, h };
}

// The height at (x, z) on a grid, between its points; beyond its edge, the edge's.
export function heightOn(g, x, z) {
  const fx = Math.max(0, Math.min(g.nx - 1.001, (x - g.x0) / g.step));
  const fz = Math.max(0, Math.min(g.nz - 1.001, (z - g.z0) / g.step));
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const h = (a, b) => g.h[b * g.nx + a];
  return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
}

// The axis of a footprint's smallest rectangle lined up with one of its edges: the long side's
// angle, from 0 to π. The same as tools/osm.mjs's rectAxis, in exact arithmetic but for the last
// step, so it agrees with the map's from the same points: a building's roof runs along it or across.
function rectAxis(pts) {
  let best = null;
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[(k + 1) % pts.length];
    const l = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
    if (l < 0.5) continue;
    const ux = (bx - ax) / l;
    const uz = (bz - az) / l;
    let a0 = Infinity;
    let a1 = -Infinity;
    let b0 = Infinity;
    let b1 = -Infinity;
    for (const [x, z] of pts) {
      const a = x * ux + z * uz;
      const b = -x * uz + z * ux;
      if (a < a0) a0 = a;
      if (a > a1) a1 = a;
      if (b < b0) b0 = b;
      if (b > b1) b1 = b;
    }
    const area = (a1 - a0) * (b1 - b0);
    if (!best || area < best.area) best = { area, ux: a1 - a0 >= b1 - b0 ? ux : -uz, uz: a1 - a0 >= b1 - b0 ? uz : ux };
  }
  if (!best) return 0;
  let { ux, uz } = best;
  if (uz < 0 || (uz === 0 && ux < 0)) {
    ux = -ux;
    uz = -uz;
  }
  return Math.atan2(uz, ux);
}
// The four ways a roof runs from its footprint's axis: along it, back along it, across to its left
// and to its right.
const DIRS = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
// Where a building's footprint is from (tools/world.mjs's SOURCE).
const SOURCES = ['osm', 'lidar', 'microsoft', 'invented'];
// A street's level (tools/world.mjs's LEVEL).
const LEVELS = ['ground', 'bridge', 'tunnel', 'under'];
// What each piece of a street's surfaces is (tools/streets.mjs's STREET): the carriageways' surfaces,
// what's beside them, the kerbs and the markings.
const STREET = ['asphalt', 'setts', 'paving', 'dirt', 'pavement', 'reservation', 'island', 'kerb', 'lane', 'centre', 'zebra', 'stop'];
const DASH = [3, 4];

let base = null;

// What every game needs, whichever part of the map it's in: the extent, the tiles and the
// sections, the relief everywhere and the horizon round it, the rivers, the landmarks and the
// sights.
export function map() {
  if (base) return base;
  const { head, nums } = unpack(BASE);
  const m = head.meta;
  const rivers = [];
  for (let i = head.rivers.at; i < head.rivers.at + head.rivers.n; ) {
    const n = nums[i++];
    const pts = [];
    for (let k = 0; k < n; k++) pts.push([nums[i + k * 3] / 2, nums[i + k * 3 + 1] / 2, nums[i + k * 3 + 2] / 10]);
    rivers.push({ pts });
    i += n * 3;
  }
  const sectionOfTile = new Map();
  for (const s of m.sections) for (const id of s.tiles) sectionOfTile.set(id, s.id);
  base = {
    credit: m.credit,
    elev0: m.elev0,
    ext: m.ext,
    tile: m.tile,
    tiles: m.tiles,
    sections: m.sections,
    landmarks: m.landmarks,
    sights: m.sights,
    areaKinds: m.areas,
    roofColors: m.roofColors,
    storey: m.storey,
    far: grid(nums, head.far),
    cover: Uint8Array.from(nums.subarray(head.cover.at, head.cover.at + head.cover.n)),
    horizon: grid(nums, head.horizon),
    rivers,
    riverHalfWidth: head.rivers.halfWidth,
    tileAt: (x, z) => `x${Math.floor(x / m.tile)}z${Math.floor(z / m.tile)}`,
    sectionAt: (x, z) => sectionOfTile.get(`x${Math.floor(x / m.tile)}z${Math.floor(z / m.tile)}`) ?? null,
  };
  return base;
}

// The tiles under a box, or making up some sections.
export function tilesFor(area) {
  const m = map();
  if ('sections' in area) return m.sections.filter((s) => area.sections.includes(s.id)).flatMap((s) => s.tiles);
  const ids = [];
  for (let j = Math.floor(area.z0 / m.tile); j * m.tile < area.z1; j++) {
    for (let i = Math.floor(area.x0 / m.tile); i * m.tile < area.x1; i++) {
      const id = `x${i}z${j}`;
      if (id in TILES) ids.push(id);
    }
  }
  return ids;
}

// The world in a box ({ x0, x1, z0, z1 }) or some sections ({ sections: [ids] }): everything map()
// has, and what's on every tile under it, read and put together.
export async function loadWorld(area) {
  const m = map();
  const ids = tilesFor(area);
  const parts = await Promise.all(ids.map((id) => TILES[id]().then((mod) => unpack(mod.default))));
  const near = new Map();
  const areas = [];
  const lines = [];
  const buildings = [];
  const trees = [];
  const streets = { carriageways: [], pavements: [], kerbs: [], markings: [] };
  const box = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  parts.forEach(({ head, nums }, t) => {
    const g = grid(nums, head.terrain);
    near.set(ids[t], g);
    box.x0 = Math.min(box.x0, g.x0);
    box.z0 = Math.min(box.z0, g.z0);
    box.x1 = Math.max(box.x1, g.x0 + (g.nx - 1) * g.step);
    box.z1 = Math.max(box.z1, g.z0 + (g.nz - 1) * g.step);
    const A = head.areas;
    for (let i = A.at; i < A.at + A.n; ) {
      const n = nums[i + 3];
      areas.push({ rank: nums[i] * 32768 + nums[i + 1], kind: m.areaKinds[nums[i + 2]], pts: points(nums, i + 4, n) });
      i += 4 + n * 2;
    }
    // Each line: [what, width, n, ...points, ...heights]: what is its kind and 16 times its level;
    // a bridge's or a tunnel's has each point's height after them (tools/world.mjs).
    const L = head.lines;
    for (let i = L.at; i < L.at + L.n; ) {
      const level = nums[i] >> 4;
      const n = nums[i + 2];
      const line = { kind: nums[i] & 15, level: LEVELS[level], w: nums[i + 1] / 10, pts: points(nums, i + 3, n) };
      i += 3 + n * 2;
      if (level === 1 || level === 2) {
        line.heights = Array.from(nums.subarray(i, i + n), (v) => v / 10);
        i += n;
      }
      lines.push(line);
    }
    // Each building: [n, what, roof, h, y, rise, ...points] (tools/world.mjs's putBuilding), its
    // ground and first point the step from the one before's, and with four corners, its last less
    // where the other three would put it.
    const B = head.buildings;
    let y = 0;
    let x0 = 0;
    let z0 = 0;
    for (let i = B.at; i < B.at + B.n; ) {
      const n = nums[i];
      const what = nums[i + 1];
      const roof = nums[i + 2];
      const h = nums[i + 3] / 10;
      y += nums[i + 4];
      x0 += nums[i + 6];
      z0 += nums[i + 7];
      const pts = points(nums, i + 8, n - 1, x0, z0);
      pts.unshift([x0 / 2, z0 / 2]);
      if (n === 4) {
        // As a parallelogram: the last corner is the third's step back along the first side, and
        // what's left of that.
        pts[3][0] -= pts[1][0] - pts[0][0];
        pts[3][1] -= pts[1][1] - pts[0][1];
      }
      const colour = roof >> 8;
      buildings.push({
        kind: what & 7,
        color: (what >> 3) & 7,
        roof: (what >> 6) & 3,
        ends: (what >> 8) & 3,
        material: (what >> 10) & 3,
        measured: (what & (1 << 12)) !== 0,
        source: SOURCES[(what >> 13) & 3],
        filled: ((what >> 13) & 3) === 3,
        y: y / 10,
        h,
        ridge: h + nums[i + 5] / 10,
        dir: rectAxis(pts) + DIRS[(roof >> 6) & 3],
        pitch: roof & 63,
        roofColor: colour === 127 ? null : m.roofColors[colour],
        floors: Math.max(1, Math.round((h - m.storey[1]) / m.storey[0])),
        pts,
      });
      i += 6 + n * 2;
    }
    const T = head.trees;
    for (let i = T.at; i < T.at + T.n; i += 3) trees.push({ x: nums[i] / 2, z: nums[i + 1] / 2, pine: (nums[i + 2] & 1) === 1, filled: (nums[i + 2] & 2) === 2 });
    // The streets as surfaces, in the open world's tiles: each piece [what, ...] (tools/streets.mjs's
    // packStreets), points in decimetres, the first of each ring or line from the tile's corner and
    // each after it the step from the one before, and off the ground each point's height after them.
    const St = head.streets;
    if (!St) return;
    const dm = (i, n) => {
      const pts = [];
      let x = 0;
      let z = 0;
      for (let k = 0; k < n; k++) {
        x += nums[i + k * 2];
        z += nums[i + k * 2 + 1];
        pts.push([(g.x0 * 10 + x) / 10, (g.z0 * 10 + z) / 10]);
      }
      return pts;
    };
    for (let i = St.at; i < St.at + St.n; ) {
      const kind = STREET[nums[i] & 15];
      const level = LEVELS[nums[i] >> 4];
      const off = level !== 'ground';
      if ((nums[i] & 15) <= 6) {
        const rings = [];
        let j = i + 2;
        for (let r = 0; r < nums[i + 1]; r++) {
          const n = nums[j];
          rings.push(dm(j + 1, n));
          j += 1 + n * 2;
        }
        const piece = (nums[i] & 15) <= 3 ? { surface: kind, level, rings } : { kind, level, rings };
        if (off) piece.ys = rings.map((r) => r.map(() => nums[j++] / 10));
        ((nums[i] & 15) <= 3 ? streets.carriageways : streets.pavements).push(piece);
        i = j;
      } else {
        const n = nums[i + 3];
        const pts = dm(i + 4, n);
        const piece = kind === 'kerb' ? { h: nums[i + 1] / 100, level, pts } : { kind, w: nums[i + 1] / 100, dash: nums[i + 2] ? DASH : null, level, pts };
        i += 4 + n * 2;
        if (off) {
          piece.ys = Array.from(nums.subarray(i, i + n), (v) => v / 10);
          i += n;
        }
        (kind === 'kerb' ? streets.kerbs : streets.markings).push(piece);
      }
    }
  });
  // Big areas first and squares last, as the map orders them; the small streets, then the big.
  areas.sort((a, b) => a.rank - b.rank);
  lines.sort((a, b) => b.kind - a.kind);
  return {
    ...m,
    tiles: ids,
    box,
    height: (x, z) => {
      const g = near.get(m.tileAt(x, z));
      return heightOn(g ?? m.far, x, z);
    },
    areas: areas.map(({ kind, pts }) => ({ kind, pts })),
    lines,
    buildings,
    trees,
    streets,
  };
}
