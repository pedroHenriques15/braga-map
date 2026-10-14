// The map of Braga, for games. Metres from the Praça da República: x east, z south, y up, heights
// above `elev0`.

export type { Track, TrackPoint } from './tracks/track.js';

export interface Box {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

// Heights in metres on a grid: point (i, j) is at (x0 + i·step, z0 + j·step), at h[j·nx + i].
export interface Grid {
  x0: number;
  z0: number;
  step: number;
  nx: number;
  nz: number;
  h: Float32Array;
}

// A named part of the map, made of whole tiles. Its id is the zone's on the map page.
export interface Section {
  id: string;
  name: string;
  tiles: string[];
}

export interface Landmark {
  id: string;
  name: string;
  x: number;
  z: number;
  section: string;
}

// The sights a Bracarense steers by, with what's needed to build each. `y` is the ground under it.
export type Sight =
  | { kind: 'bomjesus'; x: number; z: number; y: number; angle: number; L: number; W: number; face: number; foot: [number, number]; footY: number }
  | { kind: 'sameiro'; x: number; z: number; y: number; angle: number; L: number; W: number; face: number; statue: [number, number]; statueY: number }
  | { kind: 'cruzeiro'; x: number; z: number; y: number }
  // The Tourigalo: `face` is the way its head points; `sign` is the front of the restaurant behind it.
  | { kind: 'tourigalo'; x: number; z: number; y: number; face: number; sign?: { x: number; z: number; face: number; L: number } }
  | { kind: 'makro' | 'altice'; x: number; z: number; y: number; face: number; L: number }
  | { kind: 'stadium'; x: number; z: number; y: number; angle: number; L: number; W: number };

export type AreaKind = 'urban' | 'industrial' | 'farm' | 'grass' | 'scrub' | 'forest' | 'park' | 'cemetery' | 'hospital' | 'school' | 'sport' | 'water' | 'plaza';

export interface Area {
  kind: AreaKind;
  pts: [number, number][];
}

// A street or the railway. kind: 0 the fast roads, 1 their links, 2 primary, 3 secondary,
// 4 tertiary, 5 residential, 6 pedestrian, 7 service, 8 track, 9 railway. w: its width, kerb to
// kerb, as the map has it (the games take a street at least 9 m wide).
// level: on the ground (the ground's height is its own); on a bridge, its deck at `heights`; in a
// tunnel, under the ground's surface, its road at `heights`; or under something at the ground's
// own level, open either side (a building over it, or a bridge's deck). heights: a bridge's or a
// tunnel's, at each point, above elev0: straight between the ground where it ends.
export interface Line {
  kind: number;
  level: 'ground' | 'bridge' | 'tunnel' | 'under';
  w: number;
  pts: [number, number][];
  heights?: number[];
}

// A building, or a part of one where its roof steps by a storey or more or turns a corner, each part
// with its own outline, height and roof. Measured from DGT's 2025 LiDAR (`measured`), or guessed
// from what the map says where the LiDAR didn't see it, and for the houses filled in.
//
// kind: 0 house, 1 flats, 2 shop, 3 church, 4 civic, from its tag and its height. color: one of 8
// facade colours. y: the ground it stands on, at its lowest corner. h: the height of its eaves (the
// top of its walls) in metres from there, and ridge: of its roof's top. floors: its storeys up to
// the eaves, so windows line up with them.
// roof: 0 flat, 1 hipped, 2 gabled, 3 skillion (one slope). dir: the way its ridge runs, in radians
// (x east, z south: (cos dir, sin dir)), from its first end to its second; for a skillion, the way
// it slopes down; for a flat roof, its long side. ends: which ends of the ridge are hipped (1 the
// first, 2 the second: 3 for a hipped roof, 1 or 2 for half of a semi-detached pair, 0 gabled).
// pitch: in degrees. roofColor: [r, g, b] from the 2025 orthophoto (the nearest of the map's 127
// roofColors), or the map's roof:colour, or null (a game's own). material: 0 tiles, 1 sheets (metal,
// fibre cement, slate), 2 flat.
// source: where its footprint is from: OpenStreetMap; the LiDAR, a building the map lacks, its
// outline squared from where the LiDAR saw building; Microsoft's outline of such a building, where
// it lies closer over the LiDAR's; or invented, a house put on an empty frontage of a built-up
// street where the LiDAR wasn't fetched (filled).
export interface Building {
  kind: number;
  roof: number;
  ends: number;
  color: number;
  y: number;
  h: number;
  ridge: number;
  dir: number;
  pitch: number;
  roofColor: [number, number, number] | null;
  material: number;
  floors: number;
  source: 'osm' | 'lidar' | 'microsoft' | 'invented';
  filled: boolean;
  measured: boolean;
  pts: [number, number][];
}

// Every street as surfaces, in the open world's area (task 033, tools/streets.mjs), each piece cut to
// the tile it's on. level: on the ground, whose heights are the ground's (`height(x, z)`); on a
// bridge's deck or in a tunnel's road, with ys, the height of each point (each ring's) above elev0.
export type StreetLevel = 'ground' | 'bridge' | 'tunnel';

// Where cars drive: each street's carriageway at its real width (the map's `width`, or its lanes, or
// what its kind of street usually is), joined to the others where they meet, each corner rounded as
// a kerb turns it. rings: its outline, then its holes.
export interface Carriageway {
  surface: 'asphalt' | 'setts' | 'paving' | 'dirt';
  level: StreetLevel;
  rings: [number, number][][];
  ys?: number[][];
}

// What's beside the carriageways: a pavement, from the kerb to the buildings, 3.2 m at most (none
// where the map says so, or out in the open, or by a fast road, a service road, a track or a
// pedestrian street); a central reservation between a road's two carriageways; or an island they go
// round (a roundabout's, or a small one with nothing built on it).
export interface Pavement {
  kind: 'pavement' | 'reservation' | 'island';
  level: StreetLevel;
  rings: [number, number][][];
  ys?: number[][];
}

// A kerb along a carriageway's edge, wherever a pavement, a reservation or an island is behind it: h
// high, in metres (0 where it's dropped at a crossing).
export interface Kerb {
  h: number;
  level: StreetLevel;
  pts: [number, number][];
  ys?: number[];
}

// A line painted on a carriageway, w wide: between its lanes (lane), between its two ways (centre),
// a zebra (its line runs across the road at the crossing, and w is how deep it is) or a stop line at
// traffic lights. dash: [on, off] in metres, or null for a solid line.
export interface Marking {
  kind: 'lane' | 'centre' | 'zebra' | 'stop';
  w: number;
  dash: [number, number] | null;
  level: StreetLevel;
  pts: [number, number][];
  ys?: number[];
}

export interface Streets {
  carriageways: Carriageway[];
  pavements: Pavement[];
  kerbs: Kerb[];
  markings: Marking[];
}

// filled: planted in a wood or a park, where the map has no trees of its own.
export interface Tree {
  x: number;
  z: number;
  pine: boolean;
  filled: boolean;
}

// A river's course, each point with its water level.
export interface River {
  pts: [number, number, number][];
}

export interface BragaMap {
  credit: string;
  elev0: number;
  ext: Box;
  tile: number;
  tiles: string[];
  sections: Section[];
  landmarks: Landmark[];
  sights: Sight[];
  areaKinds: AreaKind[];
  // The roofs' colours, 127 standing for all those measured: a building's roofColor is one of them.
  roofColors: [number, number, number][];
  // How tall a storey is, and what a building has besides its storeys (the ground floor's extra,
  // the slab on top), in metres: a building's floors are (h - storey[1]) / storey[0], rounded.
  storey: [number, number];
  // The relief over the whole map every 50 m, and 15 km round it every 250 m. The ground, from DGT's
  // LiDAR on the map and the Terrain Tiles (EU-DEM) beyond it.
  far: Grid;
  horizon: Grid;
  // What the far grid's points are covered with: 0 fields and scrub, 1 woods, 2 town.
  cover: Uint8Array;
  rivers: River[];
  riverHalfWidth: number;
  tileAt(x: number, z: number): string;
  sectionAt(x: number, z: number): string | null;
}

export interface World extends BragaMap {
  // The tiles loaded, and the box they make together.
  tiles: string[];
  box: Box;
  // The ground, from DGT's LiDAR: every 2 m on the tiles loaded within 60 m of a track and over the
  // shooter's area, every 10 m on the other tiles loaded, every 50 m elsewhere. Bridges' decks aren't
  // in it: it's the ground under them.
  height(x: number, z: number): number;
  // In the order they're painted on the ground.
  areas: Area[];
  lines: Line[];
  buildings: Building[];
  trees: Tree[];
  // Every street as surfaces, on the open world's tiles loaded (empty on the others).
  streets: Streets;
}

export function map(): BragaMap;
export function tilesFor(area: Box | { sections: string[] }): string[];
export function loadWorld(area: Box | { sections: string[] }): Promise<World>;
export function heightOn(g: Grid, x: number, z: number): number;
