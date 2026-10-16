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

// parking: a car park on the ground, or the bays and lanes along a street (OpenStreetMap's amenity=parking
// but in a building), task 016.
export type AreaKind = 'urban' | 'industrial' | 'farm' | 'grass' | 'scrub' | 'forest' | 'park' | 'cemetery' | 'hospital' | 'school' | 'sport' | 'water' | 'plaza' | 'parking';

// What the map says the ground is over an outline, less its holes (a clearing in a wood, a pond in a
// park: what a multipolygon's inner rings leave out, task 016), each cut to the tile it's on.
export interface Area {
  kind: AreaKind;
  pts: [number, number][];
  holes: [number, number][][];
}

// A street or the railway. kind: 0 the fast roads, 1 their links, 2 primary, 3 secondary,
// 4 tertiary, 5 residential, 6 pedestrian, 7 service, 8 track, 9 railway. w: its width, kerb to
// kerb, as the map has it: its real width, which the games take it at (decision 019).
// level: on the ground (the ground's height is its own); on a bridge, its deck at `heights`; in a
// tunnel, under the ground's surface, its road at `heights`; or under something at the ground's
// own level, open either side (a building over it, or a bridge's deck). heights: a bridge's or a
// tunnel's, at each point, above elev0: straight between the ground where it ends (`height(x, z)`'s;
// a tunnel's end on the cutting's floor, the lowest of it from its mouth to 4 m out).
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
// Where a deck meets the ground's streets, its end is at `height(x, z)` within 5 cm (where that's
// within half a metre of the deck), with a point every 2 m across it; and where a deck or a tunnel's
// road is within 2 m of the ground, no pavement of one lies over the other's surfaces (task 040).
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

// What's walked or cycled (task 050): every footway, path (a bridleway too), cycleway and flight of
// steps the map has in the open world's area, but the pavements, crossings and islands it draws as
// footways (or cycleways), which are the streets' own, and what's indoors. Each piece cut back to the
// carriageways at its level, the buildings (but a passage under one) and the water, at the map's
// width or what its kind usually is (a footway 2 m, a path 1.5 m, a cycleway 2.5 m or 1.5 m one way,
// steps 2 m). Where two overlap, steps keep their place, then a cycleway, a footway, a path.
// - A footway or a path gives way to the pavements: where it meets a street, it joins the pavement.
// - The pavements give way to a cycleway: where one runs in a pavement it's drawn there, `raised`,
//   flush with the pavement, a kerb over the ground; or where it runs along the carriageway's edge,
//   a lane at the carriageway's level, with a kerb behind it up to the pavement (a Kerb).
// - A flight of steps is a tread between each two risers, each its own piece at its height (ys, the
//   same at every point), from its foot to its top: as many as the map counts, or its rise over
//   16 cm, the first riser at the foot and the last tread at the top's height. Its ends: on a
//   bridge's deck where it ends on one, else DGT's terrain at 50 cm, else the ground as the tiles
//   hold it; but where the map counts the steps and the terrain rises less than 8 cm a step, or the
//   other way from the map's incline, it climbs to something the terrain doesn't have (a door's
//   landing): from its foot at the ground, 16 cm a step. The pavements give way to it.
// level: on the ground (the ground's height), under something at the ground's level (a passage under
// a building, which a game opens as a carriageway's is), a footbridge's deck or a tunnel, those two
// with ys, each point's height above elev0 (a footbridge's ends on the deck DGT's point cloud saw,
// where it's over the ground, as on stairs up to it).
export type PathLevel = 'ground' | 'under' | 'bridge' | 'tunnel';
export interface Path {
  kind: 'footway' | 'path' | 'cycleway' | 'steps';
  surface: 'calcada' | 'paving' | 'setts' | 'asphalt' | 'concrete' | 'gravel' | 'dirt' | 'metal' | 'wood';
  level: PathLevel;
  raised: boolean;
  rings: [number, number][][];
  ys?: number[][];
}

// A handrail along a flight of steps, where the map has one (both sides for `handrail=yes`, else the
// sides it names): 15 cm in from the flight's side, ys its top's height at each point above elev0,
// 0.9 m over the steps' nosing from the first riser to the top.
export interface Handrail {
  level: PathLevel;
  pts: [number, number][];
  ys: number[];
}

export interface Streets {
  carriageways: Carriageway[];
  pavements: Pavement[];
  kerbs: Kerb[];
  markings: Marking[];
  paths: Path[];
  handrails: Handrail[];
}

// filled: planted in a wood or a park, where the map has no trees of its own.
export interface Tree {
  x: number;
  z: number;
  pine: boolean;
  filled: boolean;
}

// Where a street or a path leaves the open world's area, or the shooter's: a game closes it there
// (Party Kart stands road-works barriers across it, "Estrada cortada"). heading: the way it leaves,
// (cos, sin) pointing out of the area (x east, z south); the edge crosses a street square, straight
// across its width (a path as it comes, the edge worked out from the streets). w: its width, kerb to
// kerb.
// k: its kind, a street's as a Line's (0 to 8), or a path's (task 050): 10 a footway, 11 a path, 12 a
// cycleway, 13 a flight of steps. level and y: on the ground, on a bridge's deck, in a tunnel's road
// or under something, as a Line's, and its road's height there above elev0 (a flight's, its
// tread's).
export interface Gate {
  x: number;
  z: number;
  heading: number;
  w: number;
  k: number;
  level: 'ground' | 'bridge' | 'tunnel' | 'under';
  y: number;
}

// The open world's area (decision 019, task 032): the Volta dos Amigos' and about 150 m round it, and
// the Picoto's top, where a game lets the player drive anywhere. pts: its edge, a ring of [x, z]
// points (closed: the last joins the first), half way between the streets in it and those out of it,
// round the buildings between them. gates: where every street and path crosses it (not the
// railway). tiles:
// the tiles it touches, the ground every 2 m on all of them; seen: those round it, within 500 m, for
// the city seen past its edge.
export interface Open {
  pts: [number, number][];
  gates: Gate[];
  tiles: string[];
  seen: string[];
}

// The shooter's area (decision 003, task 015): Fujacal and Conselheiro Lobato, the five streets and a
// block each side of them, between the Avenida Imaculada Conceição, the Avenida da Liberdade and the
// Rio Este, where the first shooter is played on foot (docs/SHOOTER-AREA.md). A game loads it as the
// section `id` ('fujacal'), which brings the tiles round it too. pts: its edge, a ring of [x, z]
// points (closed: the last joins the first), along the avenues' near kerbs and the river's near bank,
// and on the west half way between the streets in it and those out, round the buildings between
// them. gates: where every street and path crosses it. tiles: the tiles it touches; seen: those round
// it, within 500 m, for the city seen past its edge.
export interface ShooterArea {
  id: string;
  name: string;
  pts: [number, number][];
  gates: Gate[];
  tiles: string[];
  seen: string[];
}

// A river's course, each point with its water level.
export interface River {
  pts: [number, number, number][];
}

// A photo texture (task 007, decision 030), made by tools/textures.mjs: KTX2 files compressed with
// Basis Universal's ETC1S, sRGB, with their mipmaps, row 0 at the top (a game's loader doesn't flip
// them: three.js's KTX2Loader leaves flipY false). One file for each graphics level, each with its
// url (the game's bundler serves it), its size in pixels and in bytes.
export type PhotoLevel = 'high' | 'medium' | 'low';
export interface PhotoFile {
  url: string;
  w: number;
  h: number;
  bytes: number;
}
// Whose photo it's made from: source (DGT, Mapillary or Wikimedia Commons), author, licence (a
// texture made from a CC BY-SA photo is CC BY-SA), url (the photo's page, or the data's record) and
// date. A game shows it where it credits the map, as PhotoCredit does.
export interface PhotoCreditOf {
  source: string;
  author: string;
  licence: string;
  url: string;
  date: string;
}
interface PhotoBase {
  id: string;
  files: Record<PhotoLevel, PhotoFile>;
  credit: PhotoCreditOf;
}
// The 2025 orthophoto over a box (a tile), row 0 to the north (z0), column 0 to the west (x0).
// Its shadows and cars are in it.
export interface GroundPhoto extends PhotoBase {
  kind: 'ground';
  box: { x0: number; z0: number; x1: number; z1: number };
}
// A photo straightened onto a wall: the wall's points (along its building's footprint, left to
// right as the photo faces it), from wall[0] to wall[n - 1] a chord. A point p on the wall is
// s = (p - wall[0]) · the chord's direction along it; the texture spans s from s[0] (its left) to
// s[1] (its right), and heights y[0] (its bottom) to y[1] (its top), above elev0. A wall's front,
// where the photo was taken from, is (-dz, dx) of its chord (dx, dz); each step of the wall facing
// that way, as its own (-dz, dx) says, gets its part of the texture.
export interface FacadePhoto extends PhotoBase {
  kind: 'facade';
  wall: [number, number][];
  s: [number, number];
  y: [number, number];
}
export type PhotoTexture = GroundPhoto | FacadePhoto;
// Every source the photo textures are made from, with the authors of those used and what they
// texture: a game's credits list them.
export interface PhotoCredit {
  source: string;
  licence: string;
  authors: string[];
  kinds: ('ground' | 'facade' | 'surface')[];
}

// What the ground is (task 016, tools/cover.mjs), every 50 cm over the Volta dos Amigos' box: asphalt,
// paving, setts, grass, bare soil, gravel, water, or a building's roof (under its footprint). From DGT's
// 2025 LiDAR (the laser's echo off the ground tells asphalt from paving or grass, in the sun or a shadow;
// its points over the ground are the trees and the cars) and orthophoto with its near-infrared (plants,
// and bare soil and gravel from paving). Where the photo shows a shadow, a car or a tree's crown, the
// ground there is what's round it of the same echo. Setts are only where the map says a street or a path
// is setts (concrete echoes as they do); where the world draws the streets, the classes are the
// streets' own surfaces.
export type GroundKind = 'asphalt' | 'paving' | 'setts' | 'grass' | 'soil' | 'gravel' | 'water' | 'roof';
// A kind of ground's photo (tools/textures.mjs, from Poly Haven, CC0), seamless, to tile over the
// ground: `metres` a side. mean: its mean colour (sRGB, of its mean in linear light), which a game
// divides it by before tinting it with the ground's own colour (GroundCover's colour), so its detail
// stays and its colour is the place's.
export interface GroundTexture {
  id: string;
  metres: number;
  mean: [number, number, number];
  files: Record<PhotoLevel, PhotoFile>;
  credit: PhotoCreditOf;
}
// Each kind, in the order a GroundCover's cell has them: its photo, or null (water, a roof).
export interface GroundKindOf {
  kind: GroundKind;
  texture: GroundTexture | null;
}
// What the ground is on a tile (its box), as files a game fetches at its graphics level:
// - classes: a lossless WebP, a cell a pixel, its byte as its grey (so read without colour conversion),
//   row 0 to the north (z0), column 0 to the west (x0): the kind (groundKinds' index) in the low three
//   bits, and 8 where a tree's crown is over the ground (its shade). 50 cm a cell on High (1000 a
//   side), 1 m on Medium and 2 m on Low, each the kind most of it is.
// - colour: each kind's own colour over the tile, as the orthophoto shows it in the sun, without its
//   cars and shadows: in each square, that kind's median there, filled in where it has none (under the
//   shadows, the cars and the trees, or where the kind isn't) from the nearest squares that have it. A
//   WebP (sRGB), a square every 4 m on High (`squares` 125 a side), 5 m on Medium (100), 10 m on Low
//   (50): each kind's grid padded with its own edge to w a side (a whole number of 16 pixels, so the
//   compression never mixes two kinds), under the one before in groundKinds' order, row 0 to the north;
//   and a ninth, the trees' crowns as the photo shows them from above, so h is 9 × w. A game takes a
//   cell's colour from its own kind's grid, between the squares' middles, so one kind's colour never
//   runs into the next's; and where it draws fewer trees than stand there (far off, say), a crown's
//   cells from the crowns' grid, as the hills' woods look from a distance.
// - cars: the cars DGT's LiDAR saw parked on the tile (July 2025), n of them, in a JSON file a game
//   fetches when it draws them: an array of six numbers each, x, z, the angle of its length (from x
//   towards z, 0 to π: which way it faces isn't known), its length and width in metres, and where it is:
//   0 elsewhere (a drive, a yard), 1 along a street (its middle within 2.5 m of the street's edge, lying
//   along it, or within 5 m, square to it), 2 in a car park (the map's, or five or more within 8 m of each
//   other off the streets). For the bays a game paints and the parked cars it draws. Found as what
//   stands 0.9 to 2.4 m over the ground, not a plant or in a building, split by its size; a low wall or
//   a hedge along a building's front can come out as a row of cars.
export interface GroundCover {
  tile: string;
  box: { x0: number; z0: number; x1: number; z1: number };
  classes: Record<PhotoLevel, PhotoFile>;
  colour: Record<PhotoLevel, PhotoFile & { squares: number }>;
  cars: { url: string; n: number; bytes: number };
  credit: PhotoCreditOf;
}

export interface BragaMap {
  credit: string;
  // The photo textures' sources and authors, over the whole map.
  photoCredits: PhotoCredit[];
  // The kinds of ground a GroundCover's cells say, each with its photo (task 016).
  groundKinds: GroundKindOf[];
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
  open: Open;
  // Whether (x, z) is inside the open world's area.
  inOpen(x: number, z: number): boolean;
  shooter: ShooterArea;
  // Whether (x, z) is inside the shooter's area.
  inShooter(x: number, z: number): boolean;
  tileAt(x: number, z: number): string;
  sectionAt(x: number, z: number): string | null;
}

export interface World extends BragaMap {
  // The tiles loaded, and the box they make together.
  tiles: string[];
  box: Box;
  // The ground, from DGT's LiDAR: every 2 m on the tiles loaded within 60 m of a track, over the
  // shooter's area and under the open world's, every 10 m on the other tiles loaded, every 50 m
  // elsewhere. Bridges' decks aren't in it: it's the ground under them.
  height(x: number, z: number): number;
  // In the order they're painted on the ground.
  areas: Area[];
  lines: Line[];
  buildings: Building[];
  trees: Tree[];
  // Every street as surfaces, and every path, on the open world's tiles loaded (empty on the others).
  streets: Streets;
  // The photo textures on the tiles loaded (task 007): which, where they go, and their files.
  photos: PhotoTexture[];
  // What the ground is on the tiles loaded under the Volta dos Amigos' box (task 016).
  groundCover: GroundCover[];
}

export function map(): BragaMap;
// A box, some sections (the shooter's area, 'fujacal', among them, with the tiles round it), or the
// open world's area and the tiles round it.
export type Region = Box | { sections: string[] } | { open: true };
export function tilesFor(area: Region): string[];
export function loadWorld(area: Region): Promise<World>;
export function heightOn(g: Grid, x: number, z: number): number;
