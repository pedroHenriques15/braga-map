// A kart track planned on the map (tools/track.mjs): its layout, and what's along it.
import type { Box } from '../index.js';

// A point of the centre line, every 8 m from the start line (2 m round a ramp and where it lands),
// in metres (x east, z south, y up): the street's own surface in its middle, from the LiDAR. Its
// options apply to the stretch from it to the next, and carry on until a later point changes them,
// except `tag`. `w` is the width kerb to kerb. `bank` is how much the street tips sideways, in radians (+ lifts the right edge), as the
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
  points: TrackPoint[];
}

declare const track: Track;
export default track;
