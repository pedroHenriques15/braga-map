---
status: blocked
priority: medium
kind: code
repo: braga-map
created: 2026-10-17
depends-on: [026]
roadmap: Phase 1 · See it
---

# 058 · Each viewpoint's camera on the surface its photo was taken from

## Why

Decision 009 stands each viewpoint's camera exactly where Mapillary's reconstruction puts its
photo. Mapillary's positions are a phone's GPS, a few metres off in places. While the map's streets
were off too, some cameras landed on the carriageway by luck and others didn't. Task 026 put the
streets where the LiDAR measured them (decision 039), and the cameras that are off now show it:

- **`imaculada-conceicao`** (-260.7, 726.4): the photo is from a car in the eastbound carriageway's
  right lane, the median's hedge a lane to its left. The camera stands at that carriageway's left
  edge, on the median's grass against the hedge, which fills half the shot. It fell from 3 to 2 in
  026's round ("As ruas no sítio"), the only viewpoint that fell.
- **`bom-jesus`**: the photo is from a car in the road's right lane; the camera stands on the
  pavement, its edge 0.3 m past the kerb the LiDAR measured.
- **`liberdade`**: the photo is from the wide pavement beside the cycle lane; the camera stands on
  the carriageway, by a junction's corner.
- **`alameda-fujacal`**: the photo is from the road; the camera stands on the verge beside the
  wall, 8.75 m off the Alameda's line.

Task 026's Done when expected these four on the surface their photos were taken from once the
streets moved. They didn't move, because the cameras did not.

## What

Today (2026-10-17):

- `refs/viewpoints.json` holds each viewpoint's camera, `x`, `y`, `z` (y the track's height plus
  1.2 m for a kart, or the ground's plus 1.7 m on foot), the point it looks at, `tx`, `ty`, `tz`, its
  `fov`, the photo's credit, and `notes`. `tools/refs.mjs` cuts each photo from its source as the
  camera sees it; party-kart's `scripts/shots.mjs` shoots the game from the same camera.
- `tools/carriageways.mjs --check x,z[,r]` draws the orthophoto round a point with the map's and
  the moved streets' bands, into `.cache/carriageways/`.
- `test/viewpoints.test.js` keeps the cameras away from the friends' houses (decision 009).

Steps:

1. For each viewpoint, find which surface the photo was taken from (a lane, a pavement, a path), and
   which surface the camera stands on in the tiles (`world.streets`, the paths). List those that
   differ, with how far the camera is from the nearest point of the right surface.
2. Move each of those, as the owner answers (Questions), keeping its heading and pitch: the camera
   to the nearest point on the right surface (in a lane, the middle of the lane the photo shows),
   its height from that surface, and its target moved with it. Say so in its `notes`.
3. A test: every viewpoint's camera stands on the surface its photo was taken from (a `surface`
   field per viewpoint, `lane` or `pavement` or `path`).
4. Shoot the moved viewpoints again (party-kart's `scripts/shots.mjs <label> <ids…>`).

## Questions

- [ ] Where Mapillary's position puts a camera off the surface its photo was taken from, is the
  camera moved there? Options: yes, the shortest way onto the surface the photo shows, its heading
  and pitch kept (recommended: it is still the photo's place, within the GPS's error, as task 055
  aimed two cameras as their photos look); or no, Mapillary's position stands, and a camera off its
  surface is a fault of the photo, not the game.

## Read first

- Decision 009 (and task 055's pitch), decision 039, `refs/viewpoints.json`, `tools/refs.mjs`,
  `test/viewpoints.test.js`, party-kart's `scripts/shots.mjs`.

## Done when

- [ ] Every viewpoint's camera stands on the surface its photo was taken from (the test).
- [ ] `imaculada-conceicao`, `bom-jesus`, `liberdade` and `alameda-fujacal` shot again, before and
  after: none lower, and `imaculada-conceicao` back to 3 or more.

## Out of scope

- The viewpoints' headings and pitches: task 055's.
- New viewpoints, or new photos for them.

## Notes

- Found by task 026 (2026-10-17), in its round: the streets moved, these four cameras did not.
  Blocked on the question.
