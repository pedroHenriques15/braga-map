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
  | { kind: 'cruzeiro' | 'tourigalo'; x: number; z: number; y: number; face?: number }
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
export interface Line {
  kind: number;
  w: number;
  pts: [number, number][];
}

// kind: 0 house, 1 flats, 2 shop, 3 church, 4 civic. roof: 0 flat, 1 hipped, 2 gabled. color: one
// of 8 facade colours. h: its height in metres. filled: a house the map didn't have, put on an
// empty frontage of a built-up street.
export interface Building {
  kind: number;
  roof: number;
  color: number;
  h: number;
  filled: boolean;
  pts: [number, number][];
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
  // The relief over the whole map every 50 m, and 15 km round it every 250 m.
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
  // The relief: every 10 m on the tiles loaded, every 50 m elsewhere.
  height(x: number, z: number): number;
  // In the order they're painted on the ground.
  areas: Area[];
  lines: Line[];
  buildings: Building[];
  trees: Tree[];
}

export function map(): BragaMap;
export function tilesFor(area: Box | { sections: string[] }): string[];
export function loadWorld(area: Box | { sections: string[] }): Promise<World>;
export function heightOn(g: Grid, x: number, z: number): number;
