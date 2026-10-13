// A kart track planned on the map (tools/track.mjs): its layout, and what's along it.
import type { Box } from '../index.js';

// A point of the centre line, every 8 m from the start line, in metres (x east, z south, y up).
// Its options apply to the stretch from it to the next, and carry on until a later point changes
// them, except `tag`. `w` is the width kerb to kerb. `lanes` is the lanes painted on it (0 for no
// lines), negative when it's one way. `kerbs` is what's beyond the left and right edges: a
// pavement (its width, positive), a central reservation (its width, negative) or nothing (0).
// `tag` marks a place: the start line, a checkpoint, a row of item boxes or a boost pad.
export interface TrackPoint {
  p: [number, number, number];
  w?: number;
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
  // The easter eggs: beside the road on `side` (-1 left, 1 right) of the point nearest (x, z).
  eggs: { kind: string; x: number; z: number; side: number }[];
  // Each street as the road turns into it, and the landmarks it passes.
  streets: { name: string; x: number; z: number }[];
  landmarks: { name: string; x: number; z: number }[];
  // From the map: zebra crossings and traffic lights on its streets, and the bus stops beside it.
  crossings: [number, number][];
  signals: [number, number][];
  stops: { x: number; z: number; shelter: number }[];
  points: TrackPoint[];
}

declare const track: Track;
export default track;
