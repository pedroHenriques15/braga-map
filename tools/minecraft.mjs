// Makes a Minecraft world (Java Edition) of the map: the whole of it, or a box of it, a block to the
// metre. x east and z south as the map's own, so the Praça da República is at x = 0, z = 0; and y the
// height above the sea, so F3 shows the real altitude (a data pack makes the world 704 blocks tall,
// from 0, as Braga's hills and the Sameiro's top need more than the usual 384).
//
// node tools/minecraft.mjs [--out <folder>] [--box x0,z0,x1,z1] [--force]
//
// - out: the world's folder, by default .cache/minecraft/Braga; copy it into .minecraft/saves (or
//   give that as out). --force replaces a world already there.
// - box: only that part of the map, in the map's metres (the whole map by default).
//
// What's in it, all from loadWorld (index.js), as the games have it:
// - the ground at its height, covered with what the map says it is: the land use, then the streets
//   at their width, then over the open world's area the carriageways, pavements, paths and markings
//   as surfaces; the rivers and ponds as water; the bridges' decks at their heights;
// - the walls, fences, railings and hedges round the open world's area;
// - every building, its walls in the block nearest its facade's colour, a window every two blocks
//   of three on each storey, its floors, and its roof (flat, hipped, gabled or skillion, as the map
//   has it) in the block nearest its roof's colour, half slabs where it's half a block up;
// - every tree, its trunk and crown at their measured sizes, in the wood and leaves nearest its kind.
//
// The chunks are written as Minecraft 1.21.1 saves them (data version 3955), which every later
// version upgrades as it loads them; the data pack is 26.3's (data pack format 121), as that's not
// upgraded. A preview.png, the world from above, goes with it, and its icon.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import sharp from 'sharp';
import { loadWorld, map } from '../index.js';
import { CACHE } from './geo.mjs';

const DATA_VERSION = 3955;
const HEIGHT = 704;

// NBT, as Minecraft saves it: big-endian, each tag its type, its name and its value. A value is a
// plain object (a compound), a string, an array (a list, of compounds or strings) or one of these.
const nbt = {
  byte: (v) => ({ t: 1, v }),
  int: (v) => ({ t: 3, v }),
  long: (v) => ({ t: 4, v }),
  float: (v) => ({ t: 5, v }),
  // Longs as 32-bit words, each long's high word first.
  longs: (words) => ({ t: 12, v: words }),
  list: (et, v) => ({ t: 9, et, v }),
};
const typeOf = (v) => (typeof v === 'string' ? 8 : Array.isArray(v) ? 9 : v.t ?? 10);
class Out {
  constructor() {
    this.buf = Buffer.alloc(1 << 16);
    this.n = 0;
  }
  room(k) {
    if (this.n + k <= this.buf.length) return;
    const b = Buffer.alloc(Math.max(this.buf.length * 2, this.n + k));
    this.buf.copy(b, 0, 0, this.n);
    this.buf = b;
  }
  u8(v) {
    this.room(1);
    this.buf[this.n++] = v;
  }
  u16(v) {
    this.room(2);
    this.buf.writeUInt16BE(v, this.n);
    this.n += 2;
  }
  i32(v) {
    this.room(4);
    this.buf.writeInt32BE(v, this.n);
    this.n += 4;
  }
  u32(v) {
    this.room(4);
    this.buf.writeUInt32BE(v >>> 0, this.n);
    this.n += 4;
  }
  str(s) {
    const b = Buffer.from(s, 'utf8');
    this.u16(b.length);
    this.room(b.length);
    b.copy(this.buf, this.n);
    this.n += b.length;
  }
  done() {
    return this.buf.subarray(0, this.n);
  }
}
function payload(o, v, t = typeOf(v)) {
  switch (t) {
    case 1:
      return o.u8(v.v & 255);
    case 3:
      return o.i32(v.v);
    case 4:
      o.u32(Math.floor(v.v / 2 ** 32));
      return o.u32(v.v % 2 ** 32);
    case 5:
      o.room(4);
      o.buf.writeFloatBE(v.v, o.n);
      o.n += 4;
      return;
    case 8:
      return o.str(v);
    case 9: {
      const items = Array.isArray(v) ? v : v.v;
      const et = Array.isArray(v) ? (items.length ? typeOf(items[0]) : 0) : v.et;
      o.u8(et);
      o.i32(items.length);
      for (const item of items) payload(o, item, et);
      return;
    }
    case 10:
      for (const [k, item] of Object.entries(v)) {
        o.u8(typeOf(item));
        o.str(k);
        payload(o, item);
      }
      return o.u8(0);
    case 12:
      o.i32(v.v.length / 2);
      for (const w of v.v) o.u32(w);
      return;
  }
  throw new Error(`no NBT type ${t}`);
}
const encode = (root) => {
  const o = new Out();
  o.u8(10);
  o.str('');
  payload(o, root);
  return o.done();
};

// The blocks: each state's id, its NBT (name and properties) and its colour seen from above, for
// the preview.
const ids = new Map();
const states = [];
const colours = [];
function block(name, rgb, props = '') {
  const state = props ? `minecraft:${name}[${props}]` : `minecraft:${name}`;
  let id = ids.get(state);
  if (id === undefined) {
    id = states.length;
    ids.set(state, id);
    const Properties = props ? Object.fromEntries(props.split(',').map((p) => p.split('='))) : null;
    states.push(Properties ? { Name: `minecraft:${name}`, Properties } : { Name: `minecraft:${name}` });
    colours.push(rgb);
  }
  return id;
}
const AIR = block('air', null);
const STONE = block('stone', [125, 125, 125]);
const BEDROCK = block('bedrock', [85, 85, 85]);
const DIRT = block('dirt', [134, 96, 67]);
const GRASS = block('grass_block', [109, 153, 72], 'snowy=false');
const GRAVEL = block('gravel', [131, 127, 126]);
const WATER = block('water', [63, 118, 228], 'level=0');
const ASPHALT = block('gray_concrete', [54, 57, 61]);
const WHITE = block('white_concrete', [207, 213, 214]);
const CALCADA = block('polished_diorite', [192, 193, 194]);
const PAVING = block('smooth_stone', [158, 158, 158]);
const SETTS = block('cobblestone', [127, 127, 127]);
const CONCRETE = block('light_gray_concrete', [125, 125, 115]);
const TRACK = block('dirt_path', [148, 122, 65], '');
const COARSE = block('coarse_dirt', [119, 85, 59]);
const PLANKS = block('oak_planks', [162, 130, 78]);
const IRON = block('iron_block', [220, 220, 220]);
const FOUNDATION = block('stone_bricks', [122, 121, 122]);
const FLOOR = block('smooth_stone', [158, 158, 158]);
const GLASS = block('glass', [175, 213, 219]);
const HEDGE = block('oak_leaves', [60, 110, 40], 'distance=7,persistent=true,waterlogged=false');

// What the ground is, by the map's land use, its streets' kinds, and the surfaces' and paths' own.
const AREA_BLOCK = {
  urban: GRASS, industrial: block('andesite', [136, 136, 136]), farm: GRASS, grass: GRASS, scrub: GRASS, forest: GRASS,
  park: GRASS, cemetery: block('polished_andesite', [132, 134, 133]), hospital: GRASS, school: GRASS, sport: GRASS, plaza: PAVING, parking: ASPHALT,
};
// 0 the fast roads … 5 residential, 6 pedestrian, 7 service, 8 track, 9 railway.
const LINE_BLOCK = [ASPHALT, ASPHALT, ASPHALT, ASPHALT, ASPHALT, ASPHALT, PAVING, ASPHALT, TRACK, GRAVEL];
const SURFACE_BLOCK = { asphalt: ASPHALT, setts: SETTS, paving: PAVING, dirt: COARSE, calcada: CALCADA, concrete: CONCRETE, gravel: GRAVEL, metal: IRON, wood: PLANKS };

// What a wall is built of, by its kind and material; the fences' and railings' blocks join up with
// what's beside them (CONNECTS).
const BARS = Array.from({ length: 16 }, (_, k) => block('iron_bars', [150, 150, 150], `east=${!!(k & 1)},north=${!!(k & 2)},south=${!!(k & 4)},waterlogged=false,west=${!!(k & 8)}`));
const FENCE = Array.from({ length: 16 }, (_, k) => block('oak_fence', [162, 130, 78], `east=${!!(k & 1)},north=${!!(k & 2)},south=${!!(k & 4)},waterlogged=false,west=${!!(k & 8)}`));
const CONNECTS = new Map([...BARS.map((id) => [id, BARS]), ...FENCE.map((id) => [id, FENCE])]);
const WALL_MATERIAL = { granite: FOUNDATION, rendered: WHITE, concrete: CONCRETE, metal: BARS[0], wood: FENCE[0] };
function wallBlock(w) {
  if (w.kind === 'hedge') return HEDGE;
  if (w.kind === 'bar') return null;
  if (w.kind === 'fence' || w.kind === 'railing' || w.kind === 'guard_rail' || w.kind === 'gate') return w.material === 'wood' ? FENCE[0] : BARS[0];
  return WALL_MATERIAL[w.material] ?? FOUNDATION;
}

// The blocks a building's walls and roof can be, each with its colour: the nearest to its facade's
// colour (its material's own for brick, stone and glass) and to its roof's.
const nearest = (rgb, list) => {
  let best = list[0];
  let bd = Infinity;
  for (const b of list) {
    const d = (b.rgb[0] - rgb[0]) ** 2 * 2 + (b.rgb[1] - rgb[1]) ** 2 * 4 + (b.rgb[2] - rgb[2]) ** 2 * 3;
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  return best;
};
const kinds = (list) => list.map(([name, rgb]) => ({ id: block(name, rgb), rgb }));
const WALLS = kinds([
  ['white_concrete', [207, 213, 214]], ['calcite', [223, 224, 220]], ['quartz_block', [235, 229, 222]], ['smooth_sandstone', [216, 203, 155]],
  ['birch_planks', [192, 175, 121]], ['end_stone_bricks', [218, 224, 162]], ['yellow_terracotta', [186, 133, 35]], ['yellow_concrete', [240, 175, 21]],
  ['white_terracotta', [209, 178, 161]], ['terracotta', [152, 94, 67]], ['orange_terracotta', [161, 83, 37]], ['red_terracotta', [143, 61, 46]],
  ['pink_terracotta', [161, 78, 78]], ['brown_terracotta', [77, 51, 35]], ['light_gray_terracotta', [135, 106, 97]], ['light_gray_concrete', [125, 125, 115]],
  ['gray_concrete', [54, 57, 61]], ['black_concrete', [8, 10, 15]], ['cyan_terracotta', [86, 91, 91]], ['light_blue_terracotta', [113, 108, 137]],
  ['blue_concrete', [44, 46, 143]], ['light_blue_concrete', [35, 137, 198]], ['cyan_concrete', [21, 119, 136]], ['green_terracotta', [76, 83, 42]],
  ['red_concrete', [142, 32, 32]], ['orange_concrete', [224, 97, 0]], ['diorite', [188, 188, 188]], ['polished_andesite', [132, 134, 133]],
]);
const STONES = kinds([['stone_bricks', [122, 121, 122]], ['polished_andesite', [132, 134, 133]], ['diorite', [188, 188, 188]], ['smooth_stone', [158, 158, 158]], ['tuff_bricks', [98, 104, 96]]]);
const GLASSES = kinds([['light_blue_stained_glass', [102, 153, 216]], ['cyan_stained_glass', [76, 127, 153]], ['gray_stained_glass', [76, 76, 76]], ['light_gray_stained_glass', [153, 153, 153]], ['green_stained_glass', [102, 127, 51]]]);
const BRICKS = block('bricks', [150, 97, 83]);
const ROOFS = [
  ['bricks', 'brick_slab', [150, 97, 83]], ['polished_granite', 'polished_granite_slab', [154, 106, 89]], ['waxed_cut_copper', 'waxed_cut_copper_slab', [191, 106, 80]],
  ['acacia_planks', 'acacia_slab', [168, 90, 50]], ['mangrove_planks', 'mangrove_slab', [117, 54, 48]], ['mud_bricks', 'mud_brick_slab', [137, 104, 79]],
  ['spruce_planks', 'spruce_slab', [115, 85, 49]], ['deepslate_tiles', 'deepslate_tile_slab', [54, 54, 55]], ['polished_blackstone', 'polished_blackstone_slab', [53, 48, 56]],
  ['stone', 'stone_slab', [125, 125, 125]], ['smooth_stone', 'smooth_stone_slab', [158, 158, 158]], ['polished_andesite', 'polished_andesite_slab', [132, 134, 133]],
  ['polished_diorite', 'polished_diorite_slab', [192, 193, 194]], ['quartz_block', 'quartz_slab', [235, 229, 222]], ['smooth_sandstone', 'smooth_sandstone_slab', [216, 203, 155]],
  ['dark_prismarine', 'dark_prismarine_slab', [51, 91, 75]],
].map(([full, slab, rgb]) => ({ id: block(full, rgb), slab: block(slab, rgb, 'type=bottom,waterlogged=false'), rgb }));
// A roof the map has no colour for, by what it's made of: tiles, sheets, flat.
const ROOF_OF = [[178, 92, 64], [130, 130, 130], [150, 150, 150]];
// The orthophoto's roofs are paler than they are (the haze, and the tiles' weathering): their colour
// 2.5 times as far from grey, so the tiled ones come out as tiles, and the grey stay grey.
const vivid = (rgb) => {
  const l = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  return rgb.map((v) => l + 2.5 * (v - l));
};

// The trees: each kind's wood and leaves, and its crown's shape.
const leaves = (name, rgb) => block(name, rgb, 'distance=7,persistent=true,waterlogged=false');
const log = (name, rgb) => block(name, rgb, 'axis=y');
const TREE = {
  broadleaf: { log: log('oak_log', [109, 85, 50]), leaves: leaves('oak_leaves', [60, 110, 40]), shape: 'round' },
  plane: { log: log('stripped_birch_log', [196, 176, 118]), leaves: leaves('oak_leaves', [60, 110, 40]), shape: 'round' },
  lime: { log: log('oak_log', [109, 85, 50]), leaves: leaves('birch_leaves', [100, 140, 60]), shape: 'round' },
  birch: { log: log('birch_log', [216, 215, 210]), leaves: leaves('birch_leaves', [100, 140, 60]), shape: 'round' },
  poplar: { log: log('oak_log', [109, 85, 50]), leaves: leaves('oak_leaves', [60, 110, 40]), shape: 'column' },
  pine: { log: log('spruce_log', [58, 37, 16]), leaves: leaves('spruce_leaves', [50, 80, 50]), shape: 'round' },
  conifer: { log: log('spruce_log', [58, 37, 16]), leaves: leaves('spruce_leaves', [50, 80, 50]), shape: 'cone' },
  eucalyptus: { log: log('stripped_birch_log', [196, 176, 118]), leaves: leaves('azalea_leaves', [90, 115, 50]), shape: 'round' },
  palm: { log: log('jungle_log', [85, 67, 25]), leaves: leaves('jungle_leaves', [48, 140, 30]), shape: 'palm' },
};
const LEAVES = new Set([HEDGE, ...Object.values(TREE).map((t) => t.leaves)]);

// The data pack that makes the overworld HEIGHT blocks tall from y = 0: 26.3's own overworld, but
// for that (its jar's data/minecraft/dimension_type/overworld.json).
const OVERWORLD = {
  ambient_light: 0.0,
  attributes: {
    'minecraft:audio/ambient_sounds': { mood: { block_search_extent: 8, offset: 2.0, sound: 'minecraft:ambient.cave', tick_delay: 6000 } },
    'minecraft:audio/background_music': {
      creative: { max_delay: 24000, min_delay: 12000, sound: 'minecraft:music.creative' },
      default: { max_delay: 24000, min_delay: 12000, sound: 'minecraft:music.game' },
    },
    'minecraft:gameplay/bed_rule': { can_set_spawn: 'always', can_sleep: 'when_dark', error_message: { translate: 'block.minecraft.bed.no_sleep' } },
    'minecraft:gameplay/nether_portal_spawns_piglin': true,
    'minecraft:gameplay/respawn_anchor_works': false,
    'minecraft:gameplay/straw_bed_rule': { can_set_spawn: 'never', can_sleep: 'when_dark', destroy_on_leave: true, error_message: { translate: 'block.minecraft.bed.no_sleep' } },
    'minecraft:visual/ambient_light_color': '#0a0a0a',
    'minecraft:visual/cloud_color': '#ccffffff',
    'minecraft:visual/cloud_height': 700.33,
    'minecraft:visual/fog_color': '#c0d8ff',
    'minecraft:visual/sky_color': '#78a7ff',
  },
  coordinate_scale: 1.0,
  default_clock: 'minecraft:overworld',
  has_ceiling: false,
  has_ender_dragon_fight: false,
  has_skylight: true,
  height: HEIGHT,
  infiniburn: '#minecraft:infiniburn_overworld',
  logical_height: HEIGHT,
  min_y: 0,
  monster_spawn_block_light_limit: 0,
  monster_spawn_light_level: { type: 'minecraft:uniform', max_inclusive: 7, min_inclusive: 0 },
  timelines: '#minecraft:in_overworld',
};

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const out = path.resolve(opt('--out') ?? path.join(CACHE, 'minecraft', 'Braga'));
if (fs.existsSync(out) && fs.readdirSync(out).length) {
  if (!args.includes('--force')) throw new Error(`${out} isn't empty: --force replaces it`);
  fs.rmSync(out, { recursive: true });
}

const m = map();
const ELEV0 = m.elev0;
const want = opt('--box')?.split(',').map(Number);
const ext = want ? { x0: Math.max(m.ext.x0, want[0]), z0: Math.max(m.ext.z0, want[1]), x1: Math.min(m.ext.x1, want[2]), z1: Math.min(m.ext.z1, want[3]) } : m.ext;
// The cells, a metre each, over the chunks under the box: cell (i, j) is the block column at
// x = X0 + i, z = Z0 + j, at c = j·W + i.
const X0 = Math.floor(ext.x0 / 16) * 16;
const Z0 = Math.floor(ext.z0 / 16) * 16;
const W = Math.ceil(ext.x1 / 16) * 16 - X0;
const D = Math.ceil(ext.z1 / 16) * 16 - Z0;
const t0 = Date.now();
const log_ = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s  ${s}`);
const world = await loadWorld({ x0: X0, x1: X0 + W, z0: Z0, z1: Z0 + D });
log_(`${world.tiles.length} tiles: ${world.buildings.length} buildings, ${world.trees.length} trees, ${W} × ${D} blocks`);

// Calls fn(i0, i1, j) for each run of cells in row j whose middles are inside the rings (even-odd).
function fillRings(rings, fn) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rings) for (const p of r) (lo = Math.min(lo, p[1])), (hi = Math.max(hi, p[1]));
  const j0 = Math.max(0, Math.ceil(lo - Z0 - 0.5));
  const j1 = Math.min(D - 1, Math.ceil(hi - Z0 - 0.5) - 1);
  if (j1 < j0) return;
  const rows = Array.from({ length: j1 - j0 + 1 }, () => []);
  for (const r of rings) {
    for (let k = 0; k < r.length; k++) {
      const [ax, az] = r[k];
      const [bx, bz] = r[(k + 1) % r.length];
      if (az === bz) continue;
      const ja = Math.max(j0, Math.ceil(Math.min(az, bz) - Z0 - 0.5));
      const jb = Math.min(j1, Math.ceil(Math.max(az, bz) - Z0 - 0.5) - 1);
      for (let j = ja; j <= jb; j++) rows[j - j0].push(ax + ((Z0 + j + 0.5 - az) * (bx - ax)) / (bz - az));
    }
  }
  rows.forEach((xs, k) => {
    xs.sort((a, b) => a - b);
    for (let q = 0; q + 1 < xs.length; q += 2) {
      const i0 = Math.max(0, Math.ceil(xs[q] - X0 - 0.5));
      const i1 = Math.min(W - 1, Math.ceil(xs[q + 1] - X0 - 0.5) - 1);
      if (i1 >= i0) fn(i0, i1, j0 + k);
    }
  });
}
const fillCells = (rings, fn) =>
  fillRings(rings, (i0, i1, j) => {
    for (let i = i0; i <= i1; i++) fn(j * W + i);
  });
// Calls fn(c, k, t, s) for each cell whose middle is within r of the line `pts`: k the segment, t how
// far along it (0 to 1), s how far along the line from its start, in metres.
function alongLine(pts, r, fn) {
  let s0 = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz;
    const i0 = Math.max(0, Math.floor(Math.min(ax, bx) - r - X0));
    const i1 = Math.min(W - 1, Math.floor(Math.max(ax, bx) + r - X0));
    const j0 = Math.max(0, Math.floor(Math.min(az, bz) - r - Z0));
    const j1 = Math.min(D - 1, Math.floor(Math.max(az, bz) + r - Z0));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const px = X0 + i + 0.5;
        const pz = Z0 + j + 0.5;
        const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
        const ex = ax + t * dx - px;
        const ez = az + t * dz - pz;
        if (ex * ex + ez * ez <= r * r) fn(j * W + i, k, t, s0 + t * Math.sqrt(l2));
      }
    }
    s0 += Math.sqrt(l2);
  }
}
const lerp = (a, k, t) => a[k] + t * ((a[k + 1] ?? a[k]) - a[k]);

// The map, a cell a metre: the ground's top block (its height, rounded, less one: you stand at the
// real height), what that block is, the water's surface (0: none), a bridge's deck (its surface and
// block), a wall (its top and block), and which building stands there (-1: none).
const top = new Int16Array(W * D);
const surf = new Uint16Array(W * D).fill(GRASS);
const water = new Int16Array(W * D);
const deckTop = new Int16Array(W * D);
const deckBlock = new Uint16Array(W * D);
const wallTop = new Int16Array(W * D);
const wallBlk = new Uint16Array(W * D);
const bIdx = new Int32Array(W * D).fill(-1);
for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) top[j * W + i] = Math.round(world.height(X0 + i + 0.5, Z0 + j + 0.5) + ELEV0) - 1;
const feet = (y) => Math.round(y + ELEV0);
log_('ground');

for (const a of world.areas) {
  if (a.kind === 'water') fillCells([a.pts, ...a.holes], (c) => (water[c] = top[c] + 1));
  else if (AREA_BLOCK[a.kind] !== undefined) fillCells([a.pts, ...a.holes], (c) => (surf[c] = AREA_BLOCK[a.kind]));
}
for (const l of world.lines) {
  const b = LINE_BLOCK[l.kind];
  const r = Math.max(0.5, l.w / 2);
  if (l.level === 'ground' || l.level === 'under') alongLine(l.pts, r, (c) => (surf[c] = b));
  else if (l.level === 'bridge') {
    alongLine(l.pts, r, (c, k, t) => {
      const y = feet(lerp(l.heights, k, t));
      // Where the deck's within a couple of blocks of the ground, the ground comes up to it.
      if (y - 1 <= top[c] + 2) {
        top[c] = Math.max(top[c], y - 1);
        surf[c] = b;
      } else if (y > deckTop[c]) {
        deckTop[c] = y;
        deckBlock[c] = b;
      }
    });
  }
}
const S = world.streets;
for (const p of S.carriageways) if (p.level === 'ground') fillCells(p.rings, (c) => (surf[c] = SURFACE_BLOCK[p.surface]));
for (const p of S.pavements) if (p.level === 'ground') fillCells(p.rings, (c) => (surf[c] = p.kind === 'pavement' ? CALCADA : GRASS));
for (const p of S.paths) {
  if (p.level !== 'ground' && p.level !== 'under') continue;
  const b = SURFACE_BLOCK[p.surface] ?? PAVING;
  // A flight of steps: each tread at its height.
  const y = p.kind === 'steps' ? feet(p.ys[0][0]) - 1 : null;
  fillCells(p.rings, (c) => {
    surf[c] = b;
    if (y !== null) top[c] = y;
  });
}
for (const mk of S.markings) {
  if (mk.level !== 'ground' || mk.kind === 'yield') continue;
  if (mk.kind === 'zebra') alongLine(mk.pts, Math.max(0.5, mk.w / 2), (c, k, t, s) => Math.floor(s) % 2 === 0 && (surf[c] = WHITE));
  else alongLine(mk.pts, 0.45, (c, k, t, s) => (!mk.dash || s % (mk.dash[0] + mk.dash[1]) < mk.dash[0]) && (surf[c] = WHITE));
}
for (const r of m.rivers) {
  const lv = r.pts.map((p) => p[2]);
  alongLine(r.pts, m.riverHalfWidth, (c, k, t) => (water[c] = feet(lerp(lv, k, t))));
}
for (const w of world.walls) {
  const b = wallBlock(w);
  if (w.level !== 'ground' || b === null) continue;
  alongLine(w.pts, Math.max(0.5, w.w / 2), (c, k, t) => {
    wallTop[c] = Math.max(wallTop[c], feet(lerp(w.ys, k, t)));
    wallBlk[c] = b;
  });
}
log_('the ground covered: areas, streets, water, walls');

// Each building: its floor (where you stand on its ground floor) and its eaves, its storeys, its roof's
// frame (along the ridge a, across it v: their spans over its footprint), and its blocks.
const buildings = world.buildings.map((b) => {
  const F = feet(b.y);
  const E = Math.max(F + 2, feet(b.y + b.h));
  const ux = Math.cos(b.dir);
  const uz = Math.sin(b.dir);
  let a0 = Infinity;
  let a1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (const [x, z] of b.pts) {
    const a = x * ux + z * uz;
    const v = -x * uz + z * ux;
    (a0 = Math.min(a0, a)), (a1 = Math.max(a1, a)), (v0 = Math.min(v0, v)), (v1 = Math.max(v1, v));
  }
  const f = Math.max(1, b.floors || Math.round(b.h / m.storey[0]));
  const rgb = m.facadeColours[b.facade.colour] ?? [200, 200, 200];
  const mat = b.facade.material;
  const glass = mat === 'glass';
  const wall = mat === 'brick' ? BRICKS : glass ? nearest(rgb, GLASSES).id : mat === 'granite' || mat === 'stone' ? nearest(rgb, STONES).id : nearest(rgb, WALLS).id;
  const roof = nearest(b.roofColor ? vivid(b.roofColor) : ROOF_OF[b.material] ?? ROOF_OF[0], ROOFS);
  return {
    F, E, f, sh: (E - F) / f, roof: b.roof, ends: b.ends, rise: Math.max(0, b.ridge - b.h), ux, uz, a0, a1, vm: (v0 + v1) / 2, half: Math.max(0.5, (v1 - v0) / 2),
    wall, glass, shops: b.facade.ground === 'shops' || b.facade.ground === 'glazed', roofId: roof.id, slabId: roof.slab,
  };
});
// How far a building's roof is over its eaves at (x, z), in metres.
function roofOver(b, x, z) {
  if (b.roof === 0 || !b.rise) return 0;
  const a = x * b.ux + z * b.uz;
  const v = -x * b.uz + z * b.ux;
  if (b.roof === 3) return (b.rise * (b.a1 - a)) / Math.max(0.5, b.a1 - b.a0);
  let r = b.rise * (1 - Math.abs(v - b.vm) / b.half);
  const slope = b.rise / b.half;
  if (b.ends & 1) r = Math.min(r, slope * (a - b.a0));
  if (b.ends & 2) r = Math.min(r, slope * (b.a1 - a));
  return Math.max(0, r);
}
// Where its roof's surface is over the cell (i, j), to the half block.
const roofAt = (b, i, j) => (b.roof === 0 ? b.E : Math.round(2 * (b.E + roofOver(b, X0 + i + 0.5, Z0 + j + 0.5))) / 2);
world.buildings.forEach((b, k) => fillCells([b.pts], (c) => (bIdx[c] = k)));
log_('buildings laid out');

// The trees, in the chunks their trunk or crown reaches.
const NCX = W / 16;
const NCZ = D / 16;
const treesIn = new Map();
for (const t of world.trees) {
  const r = Math.max(1, t.crown / 2) + 1;
  const ci0 = Math.max(0, Math.floor((Math.min(t.x, t.cx - r) - X0) / 16));
  const ci1 = Math.min(NCX - 1, Math.floor((Math.max(t.x, t.cx + r) - X0) / 16));
  const cj0 = Math.max(0, Math.floor((Math.min(t.z, t.cz - r) - Z0) / 16));
  const cj1 = Math.min(NCZ - 1, Math.floor((Math.max(t.z, t.cz + r) - Z0) / 16));
  for (let cj = cj0; cj <= cj1; cj++) {
    for (let ci = ci0; ci <= ci1; ci++) {
      const key = cj * NCX + ci;
      if (!treesIn.has(key)) treesIn.set(key, []);
      treesIn.get(key).push(t);
    }
  }
}

// A chunk's blocks, y up from 0: index (y·16 + z)·16 + x.
const vol = new Uint16Array(16 * 16 * HEIGHT);
// What's seen from above at each cell, and how high, for the preview.
const seen = new Uint16Array(W * D);
const seenY = new Int16Array(W * D);

// A section's blocks as Minecraft saves them: its palette, and each block's place in it packed into
// longs, as few bits each as the palette needs (4 at least), none across two longs.
const local = new Int32Array(states.length + 4096).fill(-1);
const pidx = new Uint16Array(4096);
function sectionStates(src, off) {
  const pal = [];
  for (let k = 0; k < 4096; k++) {
    const g = src[off + k];
    let p = local[g];
    if (p < 0) {
      p = local[g] = pal.length;
      pal.push(g);
    }
    pidx[k] = p;
  }
  for (const g of pal) local[g] = -1;
  const palette = nbt.list(10, pal.map((g) => states[g]));
  if (pal.length === 1) return { palette };
  const bits = Math.max(4, 32 - Math.clz32(pal.length - 1));
  const per = Math.floor(64 / bits);
  const words = new Uint32Array(Math.ceil(4096 / per) * 2);
  for (let k = 0; k < 4096; k++) {
    const L = Math.floor(k / per);
    const o = (k % per) * bits;
    const v = pidx[k];
    if (o >= 32) words[2 * L] |= v << (o - 32);
    else {
      words[2 * L + 1] |= v << o;
      if (o + bits > 32) words[2 * L] |= v >>> (32 - o);
    }
  }
  return { palette, data: nbt.longs(words) };
}
const BIOMES = { palette: ['minecraft:plains'] };
// The sections all stone, and the bottom one: bedrock under stone.
const STONE_STATES = sectionStates(new Uint16Array(4096).fill(STONE), 0);
const BOTTOM_STATES = sectionStates(new Uint16Array(4096).fill(STONE).fill(BEDROCK, 0, 256), 0);

// Builds the chunk (cx, cz) (in chunks from x, z = 0), and gives its NBT, or null where it's off the box.
function chunk(cx, cz) {
  const bx = cx * 16;
  const bz = cz * 16;
  const ci = (bx - X0) / 16;
  const cj = (bz - Z0) / 16;
  const cell = (lx, lz) => (bz - Z0 + lz) * W + (bx - X0 + lx);
  // The ground at each column (under a building its floor, under water its bed); the lowest of them.
  const ground = new Int16Array(256);
  let low = Infinity;
  for (let lz = 0; lz < 16; lz++) {
    for (let lx = 0; lx < 16; lx++) {
      const c = cell(lx, lz);
      let g = top[c];
      if (bIdx[c] >= 0) g = Math.min(g, buildings[bIdx[c]].F - 1);
      if (water[c]) g = Math.min(g, water[c] - 3);
      ground[lz * 16 + lx] = g;
      low = Math.min(low, g);
    }
  }
  const sLo = Math.max(1, Math.floor((low - 4) / 16));
  vol.fill(AIR, sLo * 4096);
  let yMax = sLo * 16;
  const set = (lx, y, lz, id) => {
    if (y < sLo * 16 || y >= HEIGHT || lx < 0 || lx > 15 || lz < 0 || lz > 15) return;
    vol[(y * 16 + lz) * 16 + lx] = id;
    if (y > yMax) yMax = y;
  };
  const get = (lx, y, lz) => vol[(y * 16 + lz) * 16 + lx];
  let joins = false;
  for (let lz = 0; lz < 16; lz++) {
    for (let lx = 0; lx < 16; lx++) {
      const c = cell(lx, lz);
      const g = ground[lz * 16 + lx];
      const k = bIdx[c];
      for (let y = sLo * 16; y <= g - 4; y++) set(lx, y, lz, STONE);
      for (let y = Math.max(sLo * 16, g - 3); y < g; y++) set(lx, y, lz, k >= 0 ? STONE : DIRT);
      if (water[c] && k < 0) {
        set(lx, g, lz, GRAVEL);
        for (let y = g + 1; y < water[c]; y++) set(lx, y, lz, WATER);
      } else if (k < 0) set(lx, g, lz, surf[c]);
      if (deckTop[c] && deckTop[c] - 1 > g) set(lx, deckTop[c] - 1, lz, deckBlock[c]);
      if (wallTop[c] && k < 0 && !water[c]) {
        const b = wallBlk[c];
        for (let y = g + 1; y <= Math.max(g + 1, wallTop[c] - 1); y++) set(lx, y, lz, b);
        if (CONNECTS.has(b)) joins = true;
      }
      if (k >= 0) building(k, lx, lz, c, g, set);
    }
  }
  for (const t of treesIn.get(cj * NCX + ci) ?? []) tree(t, bx, bz, set, get);
  // The fences and railings join what's beside them: within the chunk as it's built, beyond it as the
  // map is.
  if (joins) {
    const solidAt = (lx, y, lz) => {
      if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
        const id = get(lx, y, lz);
        return id !== AIR && id !== WATER && !LEAVES.has(id);
      }
      const i = bx - X0 + lx;
      const j = bz - Z0 + lz;
      if (i < 0 || j < 0 || i >= W || j >= D) return false;
      const c = j * W + i;
      return top[c] >= y || (wallTop[c] > y && top[c] < y) || (bIdx[c] >= 0 && y >= buildings[bIdx[c]].F && y < buildings[bIdx[c]].E);
    };
    for (let y = sLo * 16; y <= yMax; y++) {
      for (let lz = 0; lz < 16; lz++) {
        for (let lx = 0; lx < 16; lx++) {
          const set_ = CONNECTS.get(get(lx, y, lz));
          if (!set_) continue;
          const mask = (solidAt(lx + 1, y, lz) ? 1 : 0) | (solidAt(lx, y, lz - 1) ? 2 : 0) | (solidAt(lx, y, lz + 1) ? 4 : 0) | (solidAt(lx - 1, y, lz) ? 8 : 0);
          vol[(y * 16 + lz) * 16 + lx] = set_[mask];
        }
      }
    }
  }
  // What's seen from above.
  for (let lz = 0; lz < 16; lz++) {
    for (let lx = 0; lx < 16; lx++) {
      let y = yMax;
      while (y > sLo * 16 && get(lx, y, lz) === AIR) y--;
      const c = cell(lx, lz);
      seen[c] = get(lx, y, lz);
      seenY[c] = y;
    }
  }
  const sections = [];
  for (let s = 0; s < sLo; s++) sections.push({ Y: nbt.byte(s), block_states: s ? STONE_STATES : BOTTOM_STATES, biomes: BIOMES });
  for (let s = sLo; s <= yMax >> 4; s++) {
    sections.push({ Y: nbt.byte(s), block_states: sectionStates(vol, s * 4096), biomes: BIOMES });
  }
  return {
    DataVersion: nbt.int(DATA_VERSION),
    xPos: nbt.int(cx),
    zPos: nbt.int(cz),
    yPos: nbt.int(0),
    Status: 'minecraft:full',
    LastUpdate: nbt.long(0),
    InhabitedTime: nbt.long(0),
    // Minecraft lights it as it loads it.
    isLightOn: nbt.byte(0),
    sections,
    block_entities: nbt.list(10, []),
    Heightmaps: {},
    structures: { starts: {}, References: {} },
  };
}

// A building's column: under its floor its foundation; round its edge its walls, with windows on
// each storey and up its gables; inside, its floors and its ceiling; and over it its roof.
function building(k, lx, lz, c, g, set) {
  const b = buildings[k];
  const i = c % W;
  const j = (c - i) / W;
  const same = (di, dj) => {
    const ii = i + di;
    const jj = j + dj;
    return ii >= 0 && jj >= 0 && ii < W && jj < D && bIdx[jj * W + ii] === k;
  };
  const edge = !(same(1, 0) && same(-1, 0) && same(0, 1) && same(0, -1));
  for (let y = g + 1; y < b.F - 1; y++) set(lx, y, lz, FOUNDATION);
  set(lx, b.F - 1, lz, edge ? FOUNDATION : FLOOR);
  const R = roofAt(b, i, j);
  const full = Math.floor(R) - 1;
  const x = X0 + i;
  const z = Z0 + j;
  if (edge) {
    for (let y = b.F; y <= (b.roof === 0 ? b.E - 1 : full - 1); y++) {
      let id = b.wall;
      if (!b.glass && y < b.E - 1) {
        const s = Math.min(b.f - 1, Math.floor((y - b.F) / b.sh));
        const r = y - (b.F - 1 + Math.round(s * b.sh));
        const shop = s === 0 && b.shops;
        if ((r === 1 || (r === 2 && (b.sh >= 2.6 || shop))) && (shop ? (x + z) % 4 !== 0 : ((x + z) % 3 + 3) % 3 !== 0)) id = GLASS;
      }
      set(lx, y, lz, id);
    }
  } else {
    for (let s = 1; s < b.f; s++) {
      const y = b.F - 1 + Math.round(s * b.sh);
      if (y < b.E - 1) set(lx, y, lz, FLOOR);
    }
    set(lx, b.E - 1, lz, b.roof === 0 ? b.roofId : FLOOR);
  }
  if (b.roof === 0) return;
  // The roof: down to the lowest of its neighbours' so a steep one has no gaps.
  let from = full;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (same(di, dj)) from = Math.min(from, Math.floor(roofAt(b, i + di, j + dj)));
  for (let y = Math.max(b.E - 1, edge ? full : from); y <= full; y++) set(lx, y, lz, b.roofId);
  if (R % 1) set(lx, Math.floor(R), lz, b.slabId);
}

// A tree: its trunk from the ground up into its crown (leaning to its crown's middle), and its crown,
// round, a column, a cone or a palm's fronds, its leaves only where nothing else is.
function tree(t, bx, bz, set, get) {
  const i = Math.floor(t.x) - X0;
  const j = Math.floor(t.z) - Z0;
  if (i < 0 || j < 0 || i >= W || j >= D || bIdx[j * W + i] >= 0 || water[j * W + i]) return;
  const kind = TREE[t.kind] ?? TREE.broadleaf;
  const base = top[j * W + i] + 1;
  const hTop = base + Math.max(2, Math.round(t.h)) - 1;
  const foot = Math.min(hTop - 1, base + Math.round(t.foot));
  const mid = (foot + hTop + 1) / 2;
  const ry = Math.max(1, (hTop + 1 - foot) / 2);
  let rh = Math.max(1, t.crown / 2);
  if (kind.shape === 'column') rh = Math.min(rh, 1.6);
  const put = (x, y, z, id) => {
    const lx = x - bx;
    const lz = z - bz;
    if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y >= HEIGHT) return;
    if (get(lx, y, lz) === AIR) set(lx, y, lz, id);
  };
  const thick = t.trunk >= 1 ? 2 : 1;
  const trunkTop = kind.shape === 'palm' ? hTop - 1 : Math.round(mid);
  for (let y = base; y <= trunkTop; y++) {
    const f = trunkTop > base ? (y - base) / (trunkTop - base) : 0;
    const x = Math.floor(t.x + f * (t.cx - t.x));
    const z = Math.floor(t.z + f * (t.cz - t.z));
    for (let dz = 0; dz < thick; dz++) for (let dx = 0; dx < thick; dx++) put(x + dx, y, z + dz, kind.log);
  }
  const x0 = Math.floor(t.cx - rh);
  const x1 = Math.floor(t.cx + rh);
  const z0 = Math.floor(t.cz - rh);
  const z1 = Math.floor(t.cz + rh);
  for (let y = foot; y <= hTop; y++) {
    for (let z = Math.max(z0, bz); z <= Math.min(z1, bz + 15); z++) {
      for (let x = Math.max(x0, bx); x <= Math.min(x1, bx + 15); x++) {
        const dx = (x + 0.5 - t.cx) / rh;
        const dz = (z + 0.5 - t.cz) / rh;
        const dy = (y + 0.5 - mid) / ry;
        const rr = dx * dx + dz * dz;
        let inside;
        if (kind.shape === 'cone') inside = rr <= ((hTop + 1 - y) / (hTop + 1 - foot)) ** 2;
        else if (kind.shape === 'palm') inside = y >= hTop - 1 && rr <= (y === hTop ? 0.35 : 1);
        else inside = rr + dy * dy <= 1;
        if (inside) put(x, y, z, kind.leaves);
      }
    }
  }
}

// Each region, 32 by 32 chunks, as an Anvil file: where each chunk is and when it was saved, in 4 KiB
// sectors, then each chunk zlib'd, its length and 2 (zlib) first.
fs.mkdirSync(path.join(out, 'region'), { recursive: true });
const cx0 = X0 / 16;
const cz0 = Z0 / 16;
const cx1 = cx0 + NCX - 1;
const cz1 = cz0 + NCZ - 1;
let chunks = 0;
for (let rz = cz0 >> 5; rz <= cz1 >> 5; rz++) {
  for (let rx = cx0 >> 5; rx <= cx1 >> 5; rx++) {
    const head = Buffer.alloc(8192);
    const parts = [];
    let sector = 2;
    for (let cz = Math.max(cz0, rz * 32); cz <= Math.min(cz1, rz * 32 + 31); cz++) {
      for (let cx = Math.max(cx0, rx * 32); cx <= Math.min(cx1, rx * 32 + 31); cx++) {
        const data = zlib.deflateSync(encode(chunk(cx, cz)));
        const n = Math.ceil((data.length + 5) / 4096);
        const part = Buffer.alloc(n * 4096);
        part.writeUInt32BE(data.length + 1, 0);
        part[4] = 2;
        data.copy(part, 5);
        const at = 4 * ((cx & 31) + (cz & 31) * 32);
        head.writeUInt32BE((sector << 8) | n, at);
        head.writeUInt32BE(Math.floor(Date.now() / 1000), 4096 + at);
        parts.push(part);
        sector += n;
        chunks++;
      }
    }
    fs.writeFileSync(path.join(out, 'region', `r.${rx}.${rz}.mca`), Buffer.concat([head, ...parts]));
    log_(`r.${rx}.${rz}.mca: ${chunks} chunks so far`);
  }
}

// Where you start: the Praça da República, or the box's middle, on what's there.
const sx = ext.x0 <= 0 && ext.x1 > 0 && ext.z0 <= 0 && ext.z1 > 0 ? 0 : Math.floor((ext.x0 + ext.x1) / 2);
const sz = ext.x0 <= 0 && ext.x1 > 0 && ext.z0 <= 0 && ext.z1 > 0 ? 0 : Math.floor((ext.z0 + ext.z1) / 2);
const sy = seenY[(sz - Z0) * W + (sx - X0)] + 1;
const level = {
  Data: {
    DataVersion: nbt.int(DATA_VERSION),
    version: nbt.int(19133),
    Version: { Id: nbt.int(DATA_VERSION), Name: '1.21.1', Series: 'main', Snapshot: nbt.byte(0) },
    LevelName: 'Braga',
    GameType: nbt.int(1),
    Difficulty: nbt.byte(0),
    hardcore: nbt.byte(0),
    allowCommands: nbt.byte(1),
    initialized: nbt.byte(1),
    SpawnX: nbt.int(sx),
    SpawnY: nbt.int(sy),
    SpawnZ: nbt.int(sz),
    SpawnAngle: nbt.float(0),
    Time: nbt.long(0),
    DayTime: nbt.long(6000),
    LastPlayed: nbt.long(Date.now()),
    raining: nbt.byte(0),
    thundering: nbt.byte(0),
    GameRules: { doMobSpawning: 'false', doWeatherCycle: 'false', doFireTick: 'false', doTraderSpawning: 'false', doPatrolSpawning: 'false', doInsomnia: 'false' },
    DataPacks: { Enabled: ['vanilla', 'file/braga'], Disabled: nbt.list(8, []) },
    enabled_features: ['minecraft:vanilla'],
    WorldGenSettings: {
      seed: nbt.long(0),
      generate_features: nbt.byte(0),
      bonus_chest: nbt.byte(0),
      dimensions: {
        // Beyond the map, nothing.
        'minecraft:overworld': {
          type: 'minecraft:overworld',
          generator: { type: 'minecraft:flat', settings: { biome: 'minecraft:the_void', features: nbt.byte(0), lakes: nbt.byte(0), layers: [{ block: 'minecraft:air', height: nbt.int(1) }], structure_overrides: nbt.list(8, []) } },
        },
        'minecraft:the_nether': { type: 'minecraft:the_nether', generator: { type: 'minecraft:noise', settings: 'minecraft:nether', biome_source: { type: 'minecraft:multi_noise', preset: 'minecraft:nether' } } },
        'minecraft:the_end': { type: 'minecraft:the_end', generator: { type: 'minecraft:noise', settings: 'minecraft:end', biome_source: { type: 'minecraft:the_end' } } },
      },
    },
  },
};
fs.writeFileSync(path.join(out, 'level.dat'), zlib.gzipSync(encode(level)));
const pack = path.join(out, 'datapacks', 'braga');
fs.mkdirSync(path.join(pack, 'data', 'minecraft', 'dimension_type'), { recursive: true });
fs.writeFileSync(path.join(pack, 'pack.mcmeta'), JSON.stringify({ pack: { description: `Braga: the world ${HEIGHT} blocks tall, y the height above the sea`, min_format: 121, max_format: 121 } }, null, 2));
fs.writeFileSync(path.join(pack, 'data', 'minecraft', 'dimension_type', 'overworld.json'), JSON.stringify(OVERWORLD, null, 2));

// The preview: each column's top block in its colour, shaded by the slope to the north-west.
const rgb = Buffer.alloc(W * D * 3);
for (let j = 0; j < D; j++) {
  for (let i = 0; i < W; i++) {
    const c = j * W + i;
    const col = colours[seen[c]] ?? [0, 0, 0];
    const dh = i && j ? seenY[c] - (seenY[c - 1] + seenY[c - W]) / 2 : 0;
    const f = Math.max(0.6, Math.min(1.35, 1 + dh * 0.06));
    for (let q = 0; q < 3; q++) rgb[c * 3 + q] = Math.max(0, Math.min(255, col[q] * f));
  }
}
const img = sharp(rgb, { raw: { width: W, height: D, channels: 3 }, limitInputPixels: false });
await img.clone().png().toFile(path.join(out, 'preview.png'));
const cxp = Math.max(0, Math.min(W - 128, sx - X0 - 64));
const czp = Math.max(0, Math.min(D - 128, sz - Z0 - 64));
await img.clone().extract({ left: cxp, top: czp, width: Math.min(128, W), height: Math.min(128, D) }).resize(64, 64).png().toFile(path.join(out, 'icon.png'));
log_(`${chunks} chunks, to ${out}; spawn at ${sx} ${sy} ${sz}`);
