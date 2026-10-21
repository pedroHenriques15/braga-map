---
status: done
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

- [x] The courtyard's passage, narrowed to 1.2 m at its east mouth by the next building's corner: is
      it so? Options: (a) it's as wide at its mouth as inside, 2 m: the corner is the map's error,
      trimmed back (recommended, unless a photo shows the corner); (b) it narrows: leave it.
      > (a), from the data (2026-10-20): the "corner" is the same building's own outline (way
      > 284713312), its edge running across the mouth at a slight angle where OpenStreetMap ends the
      > passage on it; no other building is there. Nothing narrows it on the map.

## Read first

- `tools/streets.mjs` (`groundPaths`, the paths under buildings) and `tools/buildings.mjs`.
- party-kart's `src/world/ground.ts` (`trimmed`, `cuts`).
- SHOOTER-AREA.md, "Where the player goes".

## Done when

- [x] A test: a walker gets through every passage under a building in the open world's area, both
      ways. *(`test/paths.test.js`: 39 of 40 on 1.32.0, 25 of 44 on 1.31.0; the one left with its cause;
      the four on a carriageway are the street's)*
- [x] Both passages in the shooter's area walked through in party-kart on foot. *(`walk.test.ts`'s
      "through both passages…", each from 6 m out of either end to 6 m out of the other, along its
      middle; with the walker in Node, not in a browser)*

## Out of scope

- Going into a building (decision 031).

## Notes

Found walking Fujacal in task 073, 2026-10-20. The question isn't blocking: 078 can start with the
shut passage.

### 2026-10-20: the work (braga-map and party-kart)

Both passages are OpenStreetMap footways tagged `tunnel=building_passage` (ways 383762525 and
525872965) drawn from one corner of their building's outline to another: the east one clean across
the block of flats (way 165861842), the courtyard's across way 284713312. So the passage's floor ended
exactly on the outline, and party-kart, cutting a building back where a passage runs, kept the outline's
edge across each mouth: its middle wasn't in the passage. The tiles round a building's points to half
a metre (a path's to 10 cm), so that edge stood anywhere within 25 cm of the mouth, at an angle: across
the east passage's mouths (shut), across part of the courtyard's (the "corner" narrowing it to 1.2 m is
the same building's own edge; no other building is there, so the question's answer is (a)).

Over the open world's area, a test walking each passage under a building as a game cuts the buildings
back (`test/paths.test.js`) found 19 of 44 shut on 1.31.0, for five reasons, each fixed:

- **A mouth on the outline** (most of them, Fujacal's two among them). `streets.mjs`'s `groundPaths`
  draws a passage on a metre past each mouth that comes out in the open (`mouths`), short of a metre
  where a neighbour's corner stands there; and the passage keeps its place over the footway outside it
  where they meet (it's ranked first).
- **A mouth onto a pavement**, which a footway gives way to, so the floor stopped at the outline again:
  the mouth's metre takes the pavement's place, flush with it (`raised`), as a cycleway in a pavement does.
- **A passage the map ends inside its building**, short of the outline (within 3 m): drawn on out of it.
- **A mouth onto a flight of steps**, whose treads take their place first: party-kart now cuts a
  building back at a flight's treads on the ground too (they stop at the outline as the map has it, so
  this only takes off the tiles' rounding).
- **A passage's floor meeting a carriageway's under the building**: party-kart stood a wall along every
  edge of a cut inside a building, so across the passage where the two meet (and across a road under a
  building at a tile's edge). Now an edge is a wall only where the building is on its other side
  (`trimmed`). And what's left of a passage beside a carriageway under its building narrower than 70 cm
  is dropped: it isn't a way through.

Four footways the map has on a carriageway under a building (a street through a block
at (320, 668) and (340, 663)) are the street's, as the level test already counts them, and walked
along the street.

Left (`test/paths.test.js`, with its cause): the footway at (703.8, 349.3)–(716.2, 371.1) (way
1543796091) runs along the seam between two of the map's buildings, and at its south end the seam
goes straight on: the map has no open ground for it to come out into.

Not done: walking them in a browser. The test is the game's own walker on the game's own ground, in
Node, so it's what a player would meet, but nobody has looked at the mouths on foot on the screen.

### 2026-10-20: finished

braga-map 1.32.0 (not tagged). No viewpoint shows either passage, so no round. The budget: the
passages' floors are a few square metres more, and the buildings a few segments fewer; nothing measured.

