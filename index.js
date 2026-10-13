// The map of Braga, for games: the world in 500 m tiles grouped into named sections, and the tracks
// planned on it (tracks/). Everything is in metres from the Praça da República, x east, z south and
// y up, with heights above ELEV0. Made by the scripts in tools/ from OpenStreetMap and DGT's LiDAR.
// © OpenStreetMap contributors (ODbL); the ground: informação geográfica cedida pela Direção-Geral do
// Território (CC BY 4.0).
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

// Points stepped in half metres, n of them from nums[i]: the first as it is, each after it the
// step from the one before.
function points(nums, i, n) {
  const out = [];
  let x = 0;
  let z = 0;
  for (let k = 0; k < n; k++) {
    x += nums[i + k * 2];
    z += nums[i + k * 2 + 1];
    out.push([x / 2, z / 2]);
  }
  return out;
}

// A grid of heights in metres, from decimetres packed row by row, each the step from the one
// before it in its row, and each row's first the step from the row above's.
function grid(nums, g) {
  const dm = new Int32Array(g.nx * g.nz);
  for (let k = 0; k < dm.length; k++) dm[k] = nums[g.at + k] + (k % g.nx ? dm[k - 1] : k ? dm[k - g.nx] : 0);
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
    const L = head.lines;
    for (let i = L.at; i < L.at + L.n; ) {
      const n = nums[i + 2];
      lines.push({ kind: nums[i], w: nums[i + 1] / 10, pts: points(nums, i + 3, n) });
      i += 3 + n * 2;
    }
    const B = head.buildings;
    for (let i = B.at; i < B.at + B.n; ) {
      const n = nums[i];
      buildings.push({ kind: nums[i + 1], roof: nums[i + 2], color: nums[i + 3], h: nums[i + 4] / 10, filled: nums[i + 5] === 1, y: nums[i + 6] / 10, pts: points(nums, i + 7, n) });
      i += 7 + n * 2;
    }
    const T = head.trees;
    for (let i = T.at; i < T.at + T.n; i += 3) trees.push({ x: nums[i] / 2, z: nums[i + 1] / 2, pine: (nums[i + 2] & 1) === 1, filled: (nums[i + 2] & 2) === 2 });
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
  };
}
