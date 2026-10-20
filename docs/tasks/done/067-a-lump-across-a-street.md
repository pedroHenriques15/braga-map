---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-18
depends-on: [045]
roadmap: Now · The open world
---

# 067 · The Rua Padre Francisco de Almeida over its 9 m lump, at its own height

## Why

DGT's LiDAR has a lump 9 m high across the Rua Padre Francisco de Almeida at (874, 1098), the whole
width of the street, and the tiles' ground, which a street on the ground takes, follows it: the
street climbs from 31.3 m to 40.3 m above ELEV0 and down to 30.8 m in 16 m. No street does that. Task
026's `streetBumps` takes a crown or a roof off a street only where it stands over the street's own
height, the median of the ground over its middle half every metre; a lump across the whole width is
taken for the street itself.

## What

Today (2026-10-18, braga-map 1.27.0):

- Along the street's line, (857.5, 1217) to (891.5, 976.5), the tiles' ground every 2 m and the
  LiDAR's: 31.3 at (873, 1104), 32.6 / 32.4 at (874, 1102), 36.6 / 36.1, 40.3 / 40.8 at (874, 1098),
  38.4 / 39.1, 36.0 / 36.2, 34.6 / 36.0, 33.7 / 34.0, 32.5 at (876, 1088), 30.8 at (877, 1084). The
  LiDAR round it falls 4.7 m either side of the street (task 045's survey). The decks the point cloud
  saw (`decks.mjs`) have none there.
- Not checked: what it is. A footbridge or a building over the street the LiDAR's ground kept, a
  crown, or the street really on a bank there.

Steps:

1. What stands there, from the 2025 orthophoto, the point cloud's classes and the map's ways round it.
2. The ground under the street at the street's own height through it, as `streetBumps` does for a
   crown or a roof beside the street's middle (or as a deck, if it's one the map lacks).
3. Every street in the area like it: its own height (the median over its middle half) rising and
   falling more than a metre within 20 m, where the LiDAR either side doesn't.
4. A test: the street at its height through (874, 1098), and no other such lump on the area's streets
   but those listed.

## Read first

- `tools/lines.mjs` (`streetBumps`, `streetBands`), `tools/world.mjs` (the ground's holds).
- docs/tasks/done/045-streets-beside-walls.md, its Notes.

## Done when

- [x] The Rua Padre Francisco de Almeida through (874, 1098) at its own height, within 15 cm of the
  street's either side of the lump; braga-map's `npm test` passes. (30.76–31.24 m through it, the
  street either side 30.85–31.24 m; it was 40.3 m. `test/relief.test.js`; 142 pass.)

## Out of scope

- The streets beside a wall (task 045).

## Notes

- Found by task 045 (2026-10-18), in its survey of the ground under every street: on 1.26.0 as on
  1.27.0.

Done 2026-10-20 (braga-map 1.30.0), for task 072, whose Volta de Lamaçães runs down this street:

1. **What it is:** the map's trees (`.cache/trees.json`, from the LiDAR): five broadleaved trees 25–28 m
   tall either side of the street within 15 m, crowns 17–18 m across meeting over it, their undersides
   about 8 m up; the lump is 9 m. Not checked in the orthophoto or the point cloud's classes. The map
   has no footbridge or building over the street there.
2. **The fix:** `flattenLumps` in `tools/lines.mjs`. Along a street, where its own height (the median
   over its middle half, as `streetBumps` has it) stands more than 4 m over the chord from up to 12 m
   back to as far on, and the ground 3 m past its kerbs either side doesn't stand half as much over its
   own, the street is laid straight from 2 m before the widest such chord to 2 m after it.
   `streetBumps` does it every metre for the world's ground, and `track.mjs` every 2 m for a track's
   heights, which come from the raw terrain. `npm run world` prints them.
3. **Every street like it**, in the world's heights (scratch survey, then the test): over 4 m, five,
   all taken off: (875, 1096) 9.3 m; the Rua Victor de Sá's two at (1610, 1440), 5.4 and 5.5 m, south of
   the area; (-72, -55) and (-818, 1018), 4.6 m, whose ground barely changes (a 10 m tile, and the
   street over the Praça do Condestável's underpass). From 1 to 3.3 m, 21 left: service ramps, and the
   streets round that underpass, which may be what they look like.
4. **The test:** `test/relief.test.js`, the street at its height through the lump, and no lump over 4 m
   on the area's streets. Three tiles changed; the Volta's file and its tests didn't (its tracks.json
   entry is identical).

Decision 054.
