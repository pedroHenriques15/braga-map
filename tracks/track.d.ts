// A kart track planned on the map (tools/track.mjs): its layout, and what's along it.
import type { Box } from '../index.js';

// A point of the centre line, every 8 m from the start line (2 m round a ramp and where it lands),
// in metres (x east, z south, y up): the street's own surface in its middle, from the LiDAR. The line
// is the map's line for each street, which its carriageway is drawn round, but where it folds a jog
// at a junction or rounds a corner, 1.2 m or more inside the race's road (`road`). Its options apply
// to the stretch from it to the next, and carry on until a later point changes them, except `tag`.
// `w` is the street's width kerb to kerb, at its real width (decision 019), but never past the race's
// road either side of the line: narrower where it rounds a corner. `bank` is how much the street tips sideways, in radians (+ lifts the right edge), as the
// real one does, up to 0.08. `lanes` is the lanes painted on it (0 for no lines), negative when
// it's one way. `kerbs` is what's beyond the left and right edges: a pavement (its width,
// positive), a central reservation (its width, negative) or nothing (0). `bridge` is a stretch on
// a bridge, crossed straight from end to end: the ground under it is lower. `air` is a ramp's flight
// (Track's `ramps`): no road, kerbs or walls, only what's really there, its height a straight line
// from the lip to the landing. `tag` marks a place: the start line, a checkpoint, a row of item boxes
// or a boost pad.
export interface TrackPoint {
  p: [number, number, number];
  w?: number;
  bank?: number;
  bridge?: boolean;
  air?: boolean;
  walls?: boolean;
  surface?: 'asphalt' | 'cobble';
  lanes?: number;
  kerbs?: [number, number];
  tag?: 'start' | 'cp' | 'items' | 'boost';
}

export interface Track {
  id: string;
  name: string;
  // Metres round, and the height above the sea that y = 0 stands for.
  length: number;
  elev0: number;
  // The sections it runs through, from the start, and the box the games draw round it.
  sections: string[];
  box: Box;
  // The easter eggs, each on its house: (x, z) is the house's own spot, on `side` of the road
  // (-1 left, 1 right, going round). Kinds: dog, dentist, supermarket, smoke, clock.
  eggs: { kind: string; x: number; z: number; side: number }[];
  // Each street as the road turns into it, and the landmarks it passes.
  streets: { name: string; x: number; z: number }[];
  landmarks: { name: string; x: number; z: number }[];
  // From the map: zebra crossings and traffic lights on its streets, and the bus stops beside it.
  crossings: [number, number][];
  signals: [number, number][];
  stops: { x: number; z: number; shelter: number }[];
  // Where the loop jumps, the one way it leaves the streets (decision 027): a ramp the game puts up
  // only for a race, on the street at `foot`, rising straight at `angle` (radians) to its `lip`,
  // `w` wide, `at` metres from the start line (the lip); the kart flies over whatever is really
  // there and comes down on the street past `land`, where the flight meets its middle. `v` is the
  // slowest it may leave the lip at and land there, in m/s, at a kart's 12 m/s² of gravity.
  ramps: { foot: [number, number, number]; lip: [number, number, number]; land: [number, number, number]; w: number; angle: number; v: number; at: number }[];
  // The race's road (decision 019): the route's own streets at their real widths, each a band round
  // the map's line as the streets are drawn (world.streets), the corners between them rounded as a
  // kerb turns them, where the streets drawn have carriageway; and a ramp's flight, as wide as the
  // ramp and 2 m either side, on past the landing as far as a kart flat out comes down, and 6 m more,
  // with the corner between the flight and the landing street within 20 m of the landing, whatever
  // is there (task 057). Its outline is the race's walls: the kerbs, and the closures. Its pieces,
  // each an outline and its holes, rings of [x, z] (closed: the last joins the first).
  road: [number, number][][][];
  // Where the carriageway drawn goes on past the race's road: rows of barriers a game stands only for
  // a race, across each side street's mouth on the line of the route's kerb, and along a road's
  // other carriageway where the two are drawn as one. Each a row along its points, [x, y, z], y the
  // road's height there above elev0.
  closures: [number, number, number][][];
  // Where a race takes the world's walls down while it runs (task 057): its road within 20 m of a
  // ramp's landing, where it takes in the corner between the flight and the landing street. Every
  // piece of the world's walls (`world.walls`) inside it is gone in a race, and stands in free roam.
  // Its pieces, as `road`'s; none for a track without a ramp.
  cleared: [number, number][][][];
  // The road works' boards a game stands for a race along its road's edge round the corner it takes in
  // at a ramp's landing (task 057), across ground that's no street, where the race's wall is. Each a row
  // along its points, [x, y, z], y the ground's height there above elev0.
  boards: [number, number, number][][];
  points: TrackPoint[];
}

declare const track: Track;
export default track;
