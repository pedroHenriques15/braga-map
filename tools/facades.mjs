// What a facade is (task 017, docs/BUILDING-TYPES.md): Braga's kinds of building, each with its real
// proportions, and the words refs/buildings.json says each building's face in: its colour, what its
// walls are made of, its ground floor, its balconies and its shutters. world.mjs packs them into the
// tiles by their place in these lists, and index.js reads them back by name, so a list only grows
// at its end.

// Each kind of building, in the order the tiles number them, with what a game needs to draw it in its
// real proportions, in metres: `storey`, a floor's height; `ground`, the ground floor's; `win`, a
// window's width and height; `sill`, its sill over its floor; `bay`, a window's spacing along a wall
// (its middle to the next's); `balcony`, how far one stands out. The storeys from the LiDAR's eaves
// over the storeys counted in the photos of the buildings seen (docs/BUILDING-TYPES.md says how), the
// windows from the photos.
export const TYPES = [
  { id: 'old-house', storey: 4.0, ground: 4.2, win: [1.05, 2.1], sill: 0.3, bay: 2.8, balcony: 0.45 },
  { id: 'house', storey: 3.0, ground: 3.7, win: [1.4, 1.25], sill: 0.95, bay: 3.6, balcony: 1.2 },
  { id: 'block-1950s', storey: 2.85, ground: 4.8, win: [1.3, 1.4], sill: 0.9, bay: 3.2, balcony: 1.0 },
  { id: 'block-1970s-90s', storey: 2.9, ground: 3.65, win: [1.5, 1.3], sill: 0.95, bay: 3.4, balcony: 1.3 },
  { id: 'block-2000s', storey: 3.0, ground: 4.0, win: [2.2, 2.1], sill: 0.1, bay: 3.6, balcony: 1.6 },
  { id: 'glass-office', storey: 3.6, ground: 4.5, win: [1.5, 3.0], sill: 0.3, bay: 1.5, balcony: 0 },
  { id: 'civic', storey: 3.5, ground: 3.5, win: [2.4, 1.6], sill: 1.0, bay: 3.0, balcony: 0 },
  { id: 'church', storey: 6.0, ground: 6.0, win: [1.2, 3.2], sill: 2.2, bay: 5.0, balcony: 0 },
  { id: 'commercial', storey: 6.0, ground: 6.0, win: [3.0, 2.6], sill: 0.3, bay: 7.5, balcony: 0 },
  { id: 'warehouse', storey: 6.0, ground: 6.0, win: [1.8, 0.9], sill: 4.0, bay: 6.0, balcony: 0 },
  { id: 'annex', storey: 2.8, ground: 2.8, win: [0.6, 0.6], sill: 1.6, bay: 5.0, balcony: 0 },
];
export const TYPE = Object.fromEntries(TYPES.map((t, k) => [t.id, k]));

// The colours a facade is said to be, as they look in the shade on an overcast day (sRGB): a wall's,
// its base's, its shutters'. From the reference photos, each the median of the walls said to be it
// (the doc says how).
export const COLOURS = [
  ['white', [236, 234, 228]],
  ['off-white', [226, 221, 208]],
  ['cream', [230, 216, 180]],
  ['pale-yellow', [232, 214, 146]],
  ['yellow', [222, 186, 80]],
  ['ochre', [200, 154, 85]],
  ['beige', [211, 194, 162]],
  ['sand', [196, 174, 136]],
  ['pale-pink', [228, 198, 186]],
  ['salmon', [215, 154, 130]],
  ['pink', [212, 146, 146]],
  ['terracotta', [181, 101, 74]],
  ['brick', [158, 84, 64]],
  ['brown', [122, 90, 67]],
  ['pale-grey', [204, 202, 196]],
  ['grey', [163, 162, 157]],
  ['dark-grey', [108, 108, 105]],
  ['blue-grey', [142, 154, 163]],
  ['pale-blue', [185, 202, 214]],
  ['blue', [93, 127, 166]],
  ['navy', [47, 61, 92]],
  ['pale-green', [191, 208, 176]],
  ['green', [111, 143, 106]],
  ['dark-green', [63, 90, 72]],
  ['granite', [181, 173, 160]],
  ['dark-granite', [138, 131, 120]],
  ['black', [43, 43, 43]],
  ['glass-blue', [95, 127, 150]],
  ['glass-green', [110, 140, 132]],
  ['glass-dark', [60, 70, 80]],
  // For the shops' signs above all.
  ['red', [178, 40, 38]],
  ['orange', [226, 122, 36]],
  // The 1970s tiles of the Avenida Doutor Porfírio da Silva's blocks, among others.
  ['teal', [58, 118, 118]],
];
export const COLOUR = Object.fromEntries(COLOURS.map(([id], k) => [id, k]));

// What a wall is covered with: painted render; small plain ceramic tiles (the 1960s–1990s blocks');
// a mosaic of little glass tiles (pastilha); azulejos, patterned and glazed; granite, dressed; slabs
// of stone (granite or marble, the ground floors of blocks); bare brick; bare concrete; concrete
// blocks; glass (a curtain wall); metal sheets; big panels (composite, ceramic).
export const MATERIALS = ['render', 'tiles', 'mosaic', 'azulejo', 'granite', 'stone', 'brick', 'concrete', 'block', 'glass', 'metal', 'panels'];
export const MATERIAL = Object.fromEntries(MATERIALS.map((m, k) => [m, k]));

// What the ground floor is, on the walls along a street: homes, windows and a door like the floors
// over it; shops, shop windows under a fascia (cafés, banks and offices too); garages, their doors;
// an arcade, set back behind pillars, or open on pilotis; blank, a wall (a warehouse's, a church's
// base); glazed, one glass front (an office's, a showroom's).
export const GROUND = ['housing', 'shops', 'garages', 'arcade', 'blank', 'glazed'];
export const GROUND_OF = Object.fromEntries(GROUND.map((g, k) => [g, k]));

// Its balconies: none; French, a railing across a window, no floor out; projecting, each its own slab
// out from the wall with its railing; continuous, a slab the length of the wall each floor; enclosed,
// glazed in (marquises); recessed, set into the building (loggias).
export const BALCONIES = ['none', 'french', 'projecting', 'continuous', 'enclosed', 'recessed'];
export const BALCONY = Object.fromEntries(BALCONIES.map((b, k) => [b, k]));

// What an opening in a facade is (task 086's layouts): a window, a door into the building, a garage's
// door, a shop's window or glazed front, a door or a full-height window onto a balcony.
export const OPENINGS = ['window', 'door', 'garage', 'shop', 'balcony'];
export const OPENING = Object.fromEntries(OPENINGS.map((o, k) => [o, k]));

// A building's layout (refs/buildings.json's `layout`: each wall read, by its ends `from` and `to`, left to
// right seen from outside, and each storey's openings [kind, its left edge's metres from `from`, its
// width]) on each side of a ring of its outline (a part's, as the world packs it): for each side k, from
// ring[k] to ring[k + 1], null where no wall read runs along it (within 12° and a metre of its line, over
// a metre of it), else each storey's openings on it (null for a storey not read), each [kind, its near
// edge's metres from ring[k], its width], an opening on the side if its middle is.
export function layoutOnRing(layout, ring) {
  const n = ring.length, out = new Array(n).fill(null);
  for (let k = 0; k < n; k++) {
    const a = ring[k], b = ring[(k + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1) continue;
    for (const w of layout) {
      const WL = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), ux = (w.to[0] - w.from[0]) / WL, uz = (w.to[1] - w.from[1]) / WL;
      // Along the wall from `from`, and off its line, of each end of the side.
      const along = (p) => (p[0] - w.from[0]) * ux + (p[1] - w.from[1]) * uz, off = (p) => Math.abs((p[0] - w.from[0]) * uz - (p[1] - w.from[1]) * ux);
      const cos = Math.abs(((b[0] - a[0]) * ux + (b[1] - a[1]) * uz) / L);
      if (cos < Math.cos((12 * Math.PI) / 180) || off(a) > 1 || off(b) > 1) continue;
      const sa = along(a), sb = along(b), lo = Math.max(0, Math.min(sa, sb)), hi = Math.min(WL, Math.max(sa, sb));
      if (hi - lo < 1) continue;
      // The side runs with the wall (sa < sb) or against it.
      const fwd = sb > sa;
      out[k] = w.storeys.map((st) => st && st.filter(([, at, ow]) => { const m = at + ow / 2; return m >= lo && m <= hi; }).map(([kind, at, ow]) => {
        const near = fwd ? at - sa : sa - (at + ow), r = Math.round;
        return [kind, r(Math.max(0, Math.min(L - ow, near)) * 10) / 10, ow];
      }));
      break;
    }
  }
  return out.some(Boolean) ? out : null;
}

// How many storeys a building of a kind has, from its eaves' height over its ground: its ground floor,
// then its storeys, and 0.6 m more (a parapet, the slab on top).
export const floorsOf = (type, eaves) => {
  const t = TYPES[TYPE[type]];
  return eaves < t.ground + t.storey / 2 ? 1 : 1 + Math.max(0, Math.round((eaves - t.ground - 0.6) / t.storey));
};

// The nearest of the colours to an [r, g, b], or to OpenStreetMap's building:colour ("#rrggbb", "#rgb"
// or a name).
const NAMED = { white: [255, 255, 255], beige: [245, 245, 220], coral: [255, 127, 80], moccasin: [255, 228, 181], lightpink: [255, 182, 193], grey: [128, 128, 128], gray: [128, 128, 128], red: [170, 70, 50], yellow: [230, 200, 80], brown: [120, 80, 60] };
export function nearestColour(c) {
  if (typeof c === 'string') {
    const s = c.trim().toLowerCase(), hex = s.replace(/^#/, '');
    c = /^[0-9a-f]{6}$/.test(hex) ? [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16)) : /^[0-9a-f]{3}$/.test(hex) ? [0, 1, 2].map((k) => parseInt(hex[k] + hex[k], 16)) : NAMED[s];
    if (!c) return null;
  }
  let best = 0, bd = Infinity;
  COLOURS.forEach(([, v], k) => {
    if (COLOURS[k][0].startsWith('glass')) return;
    const d = (c[0] - v[0]) ** 2 + (c[1] - v[1]) ** 2 + (c[2] - v[2]) ** 2;
    if (d < bd) { bd = d; best = k; }
  });
  return COLOURS[best][0];
}
// OpenStreetMap's building:material, in these words.
const OSM_MATERIAL = { plaster: 'render', concrete: 'concrete', stone: 'stone', metal: 'metal', plastic: 'panels', tiles: 'tiles', brick: 'brick', glass: 'glass', wood: 'panels', cement_block: 'block', granite: 'granite' };

// A building's face where nobody has looked at it, from what's known of it and from the buildings
// looked at (`seen`, refs/buildings.json's): its kind from OpenStreetMap's tags, else from its kind
// as the world has it (house, flats, shop, church, civic: from its tags, its footprint and its
// height), its size and its storeys; then each of its colour, material, ground floor, base,
// balconies and shutters picked as often as the buildings of its kind looked at have it, by a hash
// of its name, so the same building is always the same. OpenStreetMap's building:colour and
// building:material where it has them; shops on its ground floor where the map has a shop in it.
export function guesser(seen) {
  const of = (type) => Object.values(seen).filter((e) => e.type === type);
  // How often each value is, over the buildings of a kind looked at.
  const share = (list, f) => {
    const n = new Map();
    for (const e of list) { const v = f(e); if (v != null) n.set(JSON.stringify(v), (n.get(JSON.stringify(v)) ?? 0) + 1); }
    return [...n].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([v, k]) => [JSON.parse(v), k]);
  };
  const DEFAULT = {
    colour: 'off-white', material: 'render', ground: 'housing', base: null, balconies: 'none', shutters: 'white',
  };
  const odds = new Map();
  for (const t of TYPES) {
    const list = of(t.id), o = {};
    for (const f of ['colour', 'material', 'ground', 'base', 'balconies', 'shutters']) o[f] = share(list, (e) => (f === 'base' ? e.base ?? null : e[f]));
    odds.set(t.id, o);
  }
  // Which block a building of flats is, as often as the blocks looked at of about its height are each.
  const blocks = ['block-1950s', 'block-1970s-90s', 'block-2000s'];
  const pick = (opts, u) => {
    const total = opts.reduce((s, [, k]) => s + k, 0);
    let r = u * total;
    for (const [v, k] of opts) if ((r -= k) < 0) return v;
    return opts.length ? opts[opts.length - 1][0] : null;
  };
  const hashOf = (name, k) => {
    let h = 2166136261 ^ k;
    for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const CHURCH = new Set(['church', 'cathedral', 'chapel', 'basilica', 'religious', 'monastery', 'convent']);
  const CIVIC = new Set(['school', 'university', 'college', 'kindergarten', 'hospital', 'public', 'civic', 'government', 'museum', 'fire_station', 'sports_centre', 'sports_hall', 'stadium', 'train_station', 'transportation']);
  const COMMERCIAL = new Set(['retail', 'commercial', 'supermarket', 'kiosk']);
  const WORKS = new Set(['industrial', 'warehouse', 'service', 'manufacture', 'hangar', 'barn', 'farm_auxiliary', 'storage_tank']);
  const ANNEX = new Set(['garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'cabin', 'transformer_tower', 'toilets', 'greenhouse']);
  const HOUSE = new Set(['house', 'detached', 'semidetached_house', 'terrace', 'bungalow', 'duplex']);
  // kind: 0 house, 1 flats, 2 shop, 3 church, 4 civic (world.mjs's KIND). With `type`, the rest is
  // guessed for that kind.
  return (name, { kind, tags = {}, area, eaves, shop, type: known }) => {
    const b = tags.building;
    let type;
    if (known) type = known;
    else if (CHURCH.has(b) || kind === 3) type = 'church';
    else if (CIVIC.has(b) || kind === 4) type = 'civic';
    else if (ANNEX.has(b) || (eaves < 3.6 && area < 80)) type = 'annex';
    else if (COMMERCIAL.has(b)) type = area >= 300 || eaves < 7 ? 'commercial' : 'block-1970s-90s';
    else if (WORKS.has(b)) type = 'warehouse';
    else if (b === 'office') type = eaves >= 14 ? 'glass-office' : 'block-2000s';
    else if (HOUSE.has(b) || kind === 0) type = 'house';
    else if (kind === 1) {
      const near = Object.values(seen).filter((e) => blocks.includes(e.type) && e.floors != null && Math.abs(e.floors - floorsOf('block-1970s-90s', eaves)) <= 1);
      type = pick(share(near.length >= 8 ? near : Object.values(seen).filter((e) => blocks.includes(e.type)), (e) => e.type), hashOf(name, 1)) ?? 'block-1970s-90s';
    } else type = area >= 600 ? (hashOf(name, 2) < 0.5 ? 'warehouse' : 'commercial') : 'warehouse';
    const o = odds.get(type), get = (f, k) => (o[f].length ? pick(o[f], hashOf(name, k)) : DEFAULT[f]);
    const face = {
      type,
      colour: nearestColour(tags['building:colour'] ?? '') ?? get('colour', 3),
      material: OSM_MATERIAL[tags['building:material']] ?? get('material', 4),
      ground: shop ? 'shops' : get('ground', 5),
      base: get('base', 6),
      balconies: get('balconies', 7),
      shutters: get('shutters', 8),
    };
    return face;
  };
}
