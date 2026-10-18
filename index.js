// The map of Braga, for games: the world in 500 m tiles grouped into named sections, and the tracks
// planned on it (tracks/). Everything is in metres from the Praça da República, x east, z south and
// y up, with heights above ELEV0. Made by the scripts in tools/ from OpenStreetMap and DGT's LiDAR
// and orthophoto. © OpenStreetMap contributors (ODbL); the ground, and the buildings' heights and
// roofs: informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0).
import BASE from './world/base.js';
import { TILES } from './world/tiles.js';
import { CREDITS, SURFACES, TEXTURES, TREES } from './world/textures.js';
import { COVER, KINDS } from './world/cover.js';

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
// A facade's colour, shutters or base that isn't there (tools/world.mjs's NONE).
const NONE = 63;
// A street's level (tools/world.mjs's LEVEL).
const LEVELS = ['ground', 'bridge', 'tunnel', 'under'];
// What each piece of a street's surfaces is (tools/streets.mjs's STREET): the carriageways' surfaces,
// what's beside them, the kerbs and the markings; a roundabout's island its own (task 014), read as an
// island that's round. And a marking's dashes: none, the lanes', or a give-way line's.
const STREET = ['asphalt', 'setts', 'paving', 'dirt', 'pavement', 'reservation', 'island', 'kerb', 'lane', 'centre', 'zebra', 'stop', 'giveway', 'yield', 'roundabout'];
const DASHES = [null, [3, 4], [0.5, 0.5]];
const ROUND = STREET.indexOf('roundabout');
// What each path is, what it's paved with, and its level (tools/streets.mjs's PATH, PATH_SURFACES
// and PATH_LEVELS).
const PATH = ['footway', 'path', 'cycleway', 'steps'];
const PATH_SURFACES = ['calcada', 'paving', 'setts', 'asphalt', 'concrete', 'gravel', 'dirt', 'metal', 'wood'];
const PATH_LEVELS = ['ground', 'bridge', 'tunnel', 'under'];
// What each wall is, and what it's made of (tools/walls.mjs's WALL_KINDS and WALL_MATERIALS).
const WALL_KINDS = ['wall', 'retaining', 'fence', 'railing', 'hedge', 'guard_rail', 'gate', 'bar'];
const WALL_MATERIALS = [null, 'granite', 'rendered', 'concrete', 'metal', 'wood'];

let base = null;
// The facades' lists (tools/facades.mjs), as the base has them, for reading the tiles' buildings.
let facades = null;

// The box round the ring `pts`.
function boxOf(pts) {
  const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const [x, z] of pts) {
    b.x0 = Math.min(b.x0, x);
    b.x1 = Math.max(b.x1, x);
    b.z0 = Math.min(b.z0, z);
    b.z1 = Math.max(b.z1, z);
  }
  return b;
}

// Whether (x, z) is inside the ring `pts` (even-odd).
function inRing(pts, x, z) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i];
    const [xj, zj] = pts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// The sights, the stadium's stands read from their own part: each spoke's heights, in metres.
function sightsOf(list, nums, part) {
  return list.map((s) => {
    if (s.kind !== 'stadium' || !s.stands || !part) return s;
    let i = part.at;
    const spokes = s.stands.from.map((from, k) => {
      const h = Array.from(nums.subarray(i, i + s.stands.n[k]), (v) => v / 10);
      i += s.stands.n[k];
      return { from, h };
    });
    return { ...s, stands: { S: s.stands.S, R0: s.stands.R0, dr: s.stands.dr, spokes } };
  });
}

// How thick a tree's trunk is at a person's height, in metres: as thick as a tree that tall with a crown
// that wide usually is (the LiDAR doesn't see a trunk), or a palm's.
const trunkOf = (kind, h, crown) => Math.round(100 * (kind === 'palm' ? 0.3 + 0.01 * h : Math.max(0.08, Math.min(1.6, 0.012 * h + 0.018 * crown)))) / 100;

// What every game needs, whichever part of the map it's in: the extent, the tiles and the
// sections, the relief everywhere and the horizon round it, the rivers, the landmarks and the
// sights, the open world's area with the gates where the streets leave it, and the shooter's.
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
  const { open, shooter } = m;
  facades = m.facades;
  const ob = boxOf(open.pts);
  const sb = boxOf(shooter.pts);
  const sectionOfTile = new Map();
  for (const s of m.sections) for (const id of s.tiles) sectionOfTile.set(id, s.id);
  base = {
    credit: m.credit,
    photoCredits: CREDITS,
    groundKinds: KINDS.map((kind) => ({ kind, texture: SURFACES[kind] ?? null })),
    treeKinds: m.treeKinds.map(({ kind, evergreen }) => ({ kind, evergreen, bark: TREES[kind]?.bark ?? null, leaves: TREES[kind]?.leaves ?? null })),
    elev0: m.elev0,
    ext: m.ext,
    tile: m.tile,
    tiles: m.tiles,
    sections: m.sections,
    landmarks: m.landmarks,
    sights: sightsOf(m.sights, nums, head.stands),
    areaKinds: m.areas,
    roofColors: m.roofColors,
    storey: m.storey,
    plateSize: m.plate,
    facadeTypes: Object.fromEntries(m.facades.types.map(({ id, ...t }) => [id, t])),
    facadeColours: Object.fromEntries(m.facades.colours),
    far: grid(nums, head.far),
    cover: Uint8Array.from(nums.subarray(head.cover.at, head.cover.at + head.cover.n)),
    horizon: grid(nums, head.horizon),
    rivers,
    riverHalfWidth: head.rivers.halfWidth,
    open,
    inOpen: (x, z) => x >= ob.x0 && x <= ob.x1 && z >= ob.z0 && z <= ob.z1 && inRing(open.pts, x, z),
    shooter,
    inShooter: (x, z) => x >= sb.x0 && x <= sb.x1 && z >= sb.z0 && z <= sb.z1 && inRing(shooter.pts, x, z),
    tileAt: (x, z) => `x${Math.floor(x / m.tile)}z${Math.floor(z / m.tile)}`,
    sectionAt: (x, z) => sectionOfTile.get(`x${Math.floor(x / m.tile)}z${Math.floor(z / m.tile)}`) ?? null,
  };
  return base;
}

// The tiles under a box, or making up some sections (the shooter's area among them, with the tiles
// round it), or under the open world's area and round it.
export function tilesFor(area) {
  const m = map();
  if (area.open) return [...m.open.tiles, ...m.open.seen];
  if ('sections' in area) {
    const ids = m.sections.filter((s) => area.sections.includes(s.id)).flatMap((s) => s.tiles);
    if (area.sections.includes(m.shooter.id)) for (const id of [...m.shooter.tiles, ...m.shooter.seen]) if (!ids.includes(id)) ids.push(id);
    return ids;
  }
  const ids = [];
  for (let j = Math.floor(area.z0 / m.tile); j * m.tile < area.z1; j++) {
    for (let i = Math.floor(area.x0 / m.tile); i * m.tile < area.x1; i++) {
      const id = `x${i}z${j}`;
      if (id in TILES) ids.push(id);
    }
  }
  return ids;
}

// The world in a box ({ x0, x1, z0, z1 }), some sections ({ sections: [ids] }; 'fujacal', the
// shooter's area, brings the tiles round it too) or the open world's area ({ open: true }: the tiles
// under it, and those round it for the city seen past its edge): everything map() has, and what's on
// every tile under it, read and put together.
export async function loadWorld(area) {
  const m = map();
  const ids = tilesFor(area);
  const [parts, photos, groundCover] = await Promise.all([
    Promise.all(ids.map((id) => TILES[id]().then((mod) => unpack(mod.default)))),
    // The photo textures' indexes (tools/textures.mjs): where each goes and its files, not the files.
    Promise.all(ids.filter((id) => id in TEXTURES).map((id) => TEXTURES[id]().then((mod) => mod.default))),
    // What the ground is on each (tools/cover.mjs): its files, not the files.
    Promise.all(ids.filter((id) => id in COVER).map((id) => COVER[id]().then((mod) => mod.default))),
  ]);
  const near = new Map();
  const areas = [];
  const lines = [];
  const buildings = [];
  const signs = [];
  const stops = [];
  const plates = [];
  const trees = [];
  const streets = { carriageways: [], pavements: [], kerbs: [], markings: [], paths: [], handrails: [] };
  const walls = [];
  const box = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  parts.forEach(({ head, nums }, t) => {
    const g = grid(nums, head.terrain);
    near.set(ids[t], g);
    box.x0 = Math.min(box.x0, g.x0);
    box.z0 = Math.min(box.z0, g.z0);
    box.x1 = Math.max(box.x1, g.x0 + (g.nx - 1) * g.step);
    box.z1 = Math.max(box.z1, g.z0 + (g.nz - 1) * g.step);
    const A = head.areas;
    // Each area: [rank / 32768, rank % 32768, kind + 16 × its holes, n, ...points, then each hole's n
    // and points] (tools/world.mjs).
    for (let i = A.at; i < A.at + A.n; ) {
      const what = nums[i + 2];
      const n = nums[i + 3];
      const holes = [];
      let j = i + 4 + n * 2;
      for (let h = 0; h < what >> 4; h++) {
        holes.push(points(nums, j + 1, nums[j]));
        j += 1 + nums[j] * 2;
      }
      areas.push({ rank: nums[i] * 32768 + nums[i + 1], kind: m.areaKinds[what & 15], pts: points(nums, i + 4, n), holes });
      i = j;
    }
    // Each line: [what, width, n, ...points, ...heights]: what is its kind, 16 times its level and 64
    // times its name's place in the tile's names (from 1, 0 for none); a bridge's or a tunnel's has
    // each point's height after them (tools/world.mjs).
    const names = head.names?.list ?? [];
    const L = head.lines;
    for (let i = L.at; i < L.at + L.n; ) {
      const level = (nums[i] >> 4) & 3;
      const n = nums[i + 2];
      const line = { kind: nums[i] & 15, level: LEVELS[level], w: nums[i + 1] / 10, name: names[(nums[i] >> 6) - 1] ?? null, pts: points(nums, i + 3, n) };
      i += 3 + n * 2;
      if (level === 1 || level === 2) {
        line.heights = Array.from(nums.subarray(i, i + n), (v) => v / 10);
        i += n;
      }
      lines.push(line);
    }
    // Each building: [n, what, roof, h, y, rise, ...points, face, colours, base] (tools/world.mjs's
    // putBuilding), its ground and first point the step from the one before's, and with four corners,
    // its last less where the other three would put it.
    const B = head.buildings;
    const F = facades;
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
      const j = i + 6 + n * 2;
      const face = nums[j];
      const colours = nums[j + 1];
      const base = nums[j + 2];
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
        floors: (base >> 10) & 31,
        facade: {
          type: F.types[face & 15].id,
          colour: F.colours[colours & 63][0],
          material: F.materials[(face >> 4) & 15],
          ground: F.ground[(face >> 8) & 7],
          base: (base & 63) === NONE ? null : { colour: F.colours[base & 63][0], material: F.materials[(base >> 6) & 15] },
          balconies: F.balconies[(face >> 11) & 7],
          shutters: ((colours >> 6) & 63) === NONE ? null : F.colours[(colours >> 6) & 63][0],
          seen: (face & (1 << 14)) !== 0,
        },
        pts,
      });
      i = j + 3;
    }
    // The shops' signs: [x0, z0, x1, z1, y, h, colour, text] each, in the header.
    for (const [x0, z0, x1, z1, sy, sh, c, text] of head.signs?.list ?? []) signs.push({ text, colour: F.colours[c][0], from: [x0, z0], to: [x1, z1], y: sy, h: sh });
    // The bus stops, [x, z, shelter] each; and the streets' name plates, [name, x, z, face, y, on]
    // each, the name its place in the tile's names (task 042).
    for (const [x, z, shelter] of head.stops?.list ?? []) stops.push({ x, z, shelter: shelter === 1 });
    for (const [n, x, z, face, py, on] of head.plates?.list ?? []) plates.push({ name: names[n - 1], on: on ? 'post' : 'wall', x, z, face, y: py });
    // The trees (tools/world.mjs): [x, z, kind | mapped << 4 | filled << 5 | height << 6, crown, foot,
    // dx, dz] each, in half metres, then decimetres (dx, dz: its crown's middle from its trunk); the
    // third read as 16 bits unsigned.
    const T = head.trees;
    for (let i = T.at; i < T.at + T.n; i += 7) {
      const v = nums[i + 2] & 0xffff, kind = m.treeKinds[v & 15].kind, h = (v >> 6) / 10, crown = nums[i + 3] / 10, x = nums[i] / 2, z = nums[i + 1] / 2;
      trees.push({ x, z, cx: Math.round(x * 10 + nums[i + 5]) / 10, cz: Math.round(z * 10 + nums[i + 6]) / 10, kind, h, crown, foot: nums[i + 4] / 10, trunk: trunkOf(kind, h, crown), mapped: (v & 16) !== 0, filled: (v & 32) !== 0 });
    }
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
      const code = nums[i] & 15;
      const kind = code === ROUND ? 'island' : STREET[code];
      const level = LEVELS[nums[i] >> 4];
      const off = level !== 'ground';
      if (code <= 6 || code === ROUND) {
        const rings = [];
        let j = i + 2;
        for (let r = 0; r < nums[i + 1]; r++) {
          const n = nums[j];
          rings.push(dm(j + 1, n));
          j += 1 + n * 2;
        }
        const piece = code <= 3 ? { surface: kind, level, rings } : code === ROUND ? { kind, round: true, level, rings } : { kind, level, rings };
        if (off) piece.ys = rings.map((r) => r.map(() => nums[j++] / 10));
        (code <= 3 ? streets.carriageways : streets.pavements).push(piece);
        i = j;
      } else {
        const n = nums[i + 3];
        const pts = dm(i + 4, n);
        const piece = kind === 'kerb' ? { h: nums[i + 1] / 100, level, pts } : { kind, w: nums[i + 1] / 100, dash: DASHES[nums[i + 2]] ?? null, level, pts };
        i += 4 + n * 2;
        if (off) {
          piece.ys = Array.from(nums.subarray(i, i + n), (v) => v / 10);
          i += n;
        }
        (kind === 'kerb' ? streets.kerbs : streets.markings).push(piece);
      }
    }
    // The paths (tools/streets.mjs's packPaths): each [what, surface, rings, ...], what its kind, 4 if
    // it's raised and 8 times its level; then a tread's height, in decimetres and the centimetres more,
    // or on a bridge or in a tunnel each point's. And the handrails, each [level, n, points, heights].
    const Pa = head.paths;
    for (let i = Pa ? Pa.at : 0; Pa && i < Pa.at + Pa.n; ) {
      const what = nums[i];
      const kind = PATH[what & 3];
      const level = PATH_LEVELS[what >> 3];
      const rings = [];
      let j = i + 3;
      for (let r = 0; r < nums[i + 2]; r++) {
        const n = nums[j];
        rings.push(dm(j + 1, n));
        j += 1 + n * 2;
      }
      const piece = { kind, surface: PATH_SURFACES[nums[i + 1]], level, raised: (what & 4) !== 0, rings };
      if (kind === 'steps') {
        const y = (nums[j] * 10 + nums[j + 1]) / 100;
        piece.ys = rings.map((r) => r.map(() => y));
        j += 2;
      } else if (level === 'bridge' || level === 'tunnel') piece.ys = rings.map((r) => r.map(() => nums[j++] / 10));
      streets.paths.push(piece);
      i = j;
    }
    const Ra = head.rails;
    for (let i = Ra ? Ra.at : 0; Ra && i < Ra.at + Ra.n; ) {
      const n = nums[i + 1];
      streets.handrails.push({ level: PATH_LEVELS[nums[i]], pts: dm(i + 2, n), ys: Array.from(nums.subarray(i + 2 + n * 2, i + 2 + n * 3), (v) => v / 10) });
      i += 2 + n * 3;
    }
    // The walls (tools/walls.mjs's packWalls): each [what, h, w, n, points, tops]: what its kind and
    // what it's made of, 64 for a railing on it, 128 found by the LiDAR, 256 open, 512 on a bridge; h
    // and w in centimetres, its top at each point in centimetres, each the step from the one before.
    const Wa = head.walls;
    for (let i = Wa ? Wa.at : 0; Wa && i < Wa.at + Wa.n; ) {
      const what = nums[i];
      const n = nums[i + 3];
      const kind = WALL_KINDS[what & 7];
      const ys = [];
      for (let k = 0, y = 0; k < n; k++) ys.push((y += nums[i + 4 + n * 2 + k]) / 100);
      const wall = { kind, material: WALL_MATERIALS[(what >> 3) & 7], on: what & 64 ? 'railing' : null, h: nums[i + 1] / 100, w: nums[i + 2] / 100, level: what & 512 ? 'bridge' : 'ground', source: what & 128 ? 'lidar' : 'osm', pts: dm(i + 4, n), ys };
      if (kind === 'gate' || kind === 'bar') wall.open = (what & 256) !== 0;
      walls.push(wall);
      i += 4 + n * 3;
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
    areas: areas.map(({ kind, pts, holes }) => ({ kind, pts, holes })),
    lines,
    buildings,
    signs,
    stops,
    plates,
    trees,
    streets,
    walls,
    photos: photos.flat(),
    groundCover,
  };
}
