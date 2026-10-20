---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-20
depends-on: []
roadmap: Phase 2 · The shape
---

# 078 · A passage under the houses open at both its ends

## Why

The shooter's area has two footways through passages under the houses south of the Rua Doutor José
Vilaça (SHOOTER-AREA.md, "Where the player goes": the courtyard of the flats is reached through one).
On foot (task 073), one of them is shut at both ends by the outlines of the buildings past it, so
nobody gets through; and the other's east mouth is narrowed to 1.2 m by a neighbouring building's
corner.

## What

Today (braga-map 1.29.0): a path under a building is `level: 'under'`, and party-kart cuts the
buildings' walls back at its edges (`trimmed` in `src/world/ground.ts`, with `cuts`).

- **The passage at (-262, 924),** a footway 15 m long and 2 m wide from (-254.8, 922.4) to
  (-269.6, 925): a walker gets 3.7 m in from either end and no further. At its east mouth, a
  building's outline runs right along the passage's end, from (-267.5, 831.5) to (-254.65, 923.4)
  (an edge 92 m long, likely a building the LiDAR found, spanning the block); at its west mouth,
  outlines from (-260, 920.5) to (-270, 921.5) and from (-259.5, 925.5) to (-259.66, 924.28).
- **The passage at (-319, 931),** 14 m long and 2 m wide from (-312.35, 929.35) to (-325.9, 933.25):
  walked through both ways, but only along a lane 0.6 m wide (0.1 to 0.6 m north of its middle): the
  next building's corner at (-312.29, 929.57) stands in its east mouth, leaving 1.2 m.

Steps:

1. From the orthophoto, the photos and OpenStreetMap: where each passage comes out, and how wide its
   mouths are.
2. The buildings' outlines that close or narrow a mouth trimmed back to it, or the passage drawn on
   to where it really comes out; a test that a walker's circle (0.3 m) gets through each passage under
   a building in the open world's area.

## Questions

- [ ] The courtyard's passage, narrowed to 1.2 m at its east mouth by the next building's corner: is
      it so? Options: (a) it's as wide at its mouth as inside, 2 m: the corner is the map's error,
      trimmed back (recommended, unless a photo shows the corner); (b) it narrows: leave it.

## Read first

- `tools/streets.mjs` (`groundPaths`, the paths under buildings) and `tools/buildings.mjs`.
- party-kart's `src/world/ground.ts` (`trimmed`, `cuts`).
- SHOOTER-AREA.md, "Where the player goes".

## Done when

- [ ] A test: a walker gets through every passage under a building in the open world's area, both
      ways.
- [ ] Both passages in the shooter's area walked through in party-kart on foot.

## Out of scope

- Going into a building (decision 031).

## Notes

Found walking Fujacal in task 073, 2026-10-20. The question isn't blocking: 078 can start with the
shut passage.
