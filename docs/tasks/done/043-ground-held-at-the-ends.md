---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-15
depends-on: [040]
roadmap: Now · The open world
---

# 043 · The ground held to the street at a deck's end and a tunnel's mouth

## Why

The tiles' ground is the LiDAR's mean over each 2 m square, so where a street meets a structure it
averages in what's beside it: at a deck's end, the embankment falling away under the deck; at a
tunnel's mouth, the hill over the tunnel. The street on the ground, which takes that height, dips
into the abutment for its last 2 m, or climbs the portal. Task 040 made the decks and tunnels meet
the ground exactly, so the dips now show: a car is thrown 1.5 s into the air off the Robert
Smith's deck. party-kart holds its own land down at the mouths (`src/world/land.ts`'s
`openings`); the data should do it, once, for every game.

## What

Today (2026-10-15, after task 040):

- `tools/world.mjs` packs each tile's ground as `ground.mean` round each point of its grid, every
  2 m on the FINE tiles (`gridDm`, `tileGround`), which `index.js`'s `height` reads between the
  points, and a street on the ground takes. `tools/terrain.mjs`'s `mean` averages the 50 cm LiDAR
  over the square, whatever is in it.
- **A deck's end** (`tools/lines.mjs`'s `streetLines` takes it from `tileGround`). At 5 of the area's
  20 the tiles' ground at the node is 0.12–0.39 m under the LiDAR's, and 0.12–0.48 m higher within
  2 m out along the street: three of the Robert Smith's four, at (1505.5, 1070), (1505, 1078.5) and
  (1562, 1061.5), and the dual bridge's two at (−273.5, 1075.5) and (−276, 1083) (measured with the
  tiles' `height` along the street out from each end, against `terrain().at`). The other 15 agree
  with the LiDAR within 4 cm. At the Robert Smith's west end,
  going west: the deck 42.19 m at its end, the street 42.30 m 2 m on, 42.26 m, 42.20 m; party-kart's
  world-ground drive (`test/drive.test.ts`) is thrown 1.48 s at 122 km/h, from (1505, 1070) to
  (1455, 1079), and 0.92 s at (−272, 1073). The deck stays at its own height across its end where
  the ground is half a metre or more off it (`TWIST` in `tools/streets.mjs`): 32 points of the
  decks' ends, most of them at these five.
- **A tunnel's mouth.** The map's end node is at the portal's face, where the tiles' ground is
  halfway up it: 2 to 5 m over the tunnel's road at 11 of the area's 14 mouths (the João XXI's at
  (532, 253): 25.2 m 2 m in, 23.2 m at the node, 18.8 m 2 m out, the road 18.5 m). A tunnel's end is
  the lowest of the ground from its mouth to 4 m out (task 040), the cutting's floor, so the street
  on the ground climbs the portal for its first 2 m out of it.

Steps:

1. **The ground under a street at a deck's end and a tunnel's mouth, without what's beyond.** For
   the tiles' grid points within a few metres of each end where a deck or a tunnel meets the
   ground's streets (`tools/streets.mjs`'s ends, or `streetLines`' with the ways on the ground that
   share the node), take the mean over only the part of the square on the street's side of the
   end's line: not what's under the deck, nor what's over the tunnel. Or another way that holds the
   street's ground level to its end; say which, and why, in the Notes.
2. Then the ends meet that ground, as task 040 has them: run `npm run world` and its tests.
3. **Tests:** at every deck's end and tunnel's mouth in the area, the tiles' ground along the street
   it meets, out to 6 m, rises or falls no more than the street's own slope beyond (no dip or climb
   over 5 cm in the first 2 m); `test/streets.test.js`'s points by ground half a metre off a deck
   go from 32 to none, or say why each is left.
4. party-kart's world-ground drive, on the new tiles, has no flight off the Robert Smith's deck or
   at (−272, 1073), and its tunnels' mouths need no holding down (`openings`), which can go when
   party-kart takes the new tag (left to party-kart; this task leaves it as it is).

## Read first

- `tools/world.mjs` (`gridDm`, `tileGround`, the tiles' terrain), `tools/terrain.mjs` (`mean`),
  `tools/lines.mjs` (`streetLines`, the ends), `tools/streets.mjs` (the ends, `GRADE`, `TWIST`),
  `test/streets.test.js` (the deck and tunnel ends).
- docs/tasks/done/040-levels-joined-exactly.md, its Notes.
- party-kart's `src/world/land.ts` (`mouths`, `openings`, `firm`): how it holds its land down today.

## Done when

- [ ] At every deck's end and tunnel's mouth in the area, the street on the ground runs level into
  it, and the deck or the tunnel meets it within 5 cm: `test/streets.test.js`.
- [ ] braga-map's `npm test` passes; party-kart's world-ground drive on the new tiles has no
  flight off a deck's end.

## Out of scope

- Where the map puts a bridge's ends, or a deck's real height from the LiDAR's points: task 012.
- party-kart's land and its mouths' concrete (its own change, when it takes the tag).

## Notes

- Found in task 040 (2026-10-15). The owner chose to keep the decks meeting the tiles' ground
  exactly and hold the ground here, for the decks' ends and the tunnels' mouths together.
