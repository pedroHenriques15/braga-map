---
status: done
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

- [x] At every deck's end and tunnel's mouth in the area, the street on the ground runs level into
  it, and the deck or the tunnel meets it within 5 cm: `test/streets.test.js`.
  > The 20 decks' ends meet the ground within 0.050 m and the 8 tunnels' within 0.036 m; the
  > street runs level into 24 of the 28 ("the street on the ground runs into every deck and tunnel
  > on its own slope"). Not at four walled mouths (`WALLED` in the test), 0.13 to 0.97 m off in
  > their first 2 m: a cutting's wall the 2 m grid takes into the street, task 045's. Ticked with
  > that exception, finishing it at the owner's request (2026-10-15).
- [x] braga-map's `npm test` passes; party-kart's world-ground drive on the new tiles has no
  flight off a deck's end.
  > braga-map's `npm test`: 52 pass (2026-10-15). party-kart on these tiles: not thrown off the
  > Robert Smith's deck (1.48 s before) or at (−272, 1073) (0.92 s); its ground and drive tests
  > pass. Still thrown on the Avenida João XXI over its junction, beside the tunnels' cutting, not
  > off a deck's end: task 045.

## Out of scope

- Where the map puts a bridge's ends, or a deck's real height from the LiDAR's points: task 012.
- party-kart's land and its mouths' concrete (its own change, when it takes the tag).

## Notes

- Found in task 040 (2026-10-15). The owner chose to keep the decks meeting the tiles' ground
  exactly and hold the ground here, for the decks' ends and the tunnels' mouths together.
- **Done, waiting for `/task finish` (2026-10-15).** What changed:
  - `tools/lines.mjs`: `streetLines` split into `streetsOf` (the lines) and `levelHeights` (the
    heights), so world.mjs knows the ends before the ground is made; `meetings`, each end of a
    street on a bridge or in a tunnel at a node a street on the ground shares; `heldGround`, the
    ground held there. `tools/terrain.mjs`'s `mean` takes it; `tools/world.mjs` gives it on the
    FINE tiles only (on a 10 m grid it means nothing).
  - **How, and why not the one-sided mean (step 1).** The squares round the end don't straddle its
    line: a grid point just past it has its square wholly under the deck or over the tunnel, and
    the bilinear between it and the next one out still dips or climbs. And the 50 cm LiDAR itself
    is wrong on the street's side: the portal's face smears 1 to 1.5 m out of a tunnel, and the
    abutment's edge half a metre out of a deck. So the field the means are taken over is held:
    from 2 m out to 6 m under a deck (3 m into a tunnel), the LiDAR's cross-section 2 m out
    carried in at the street's slope (from 2 to 6 m out); between the end's line and 2 m out, at a
    deck the higher of that and the LiDAR's, at a tunnel the lower (what's wrong there is only
    ever lower at a deck, higher at a tunnel, and the street may really sag or rise); past the
    line, falling at the street's slope or, from a metre in, 3%, so it never stands through a deck
    or buries a tunnel's road, and under a deck no lower than the LiDAR's; at a deck, no lower
    across the carriageway than the middle less a 5% camber, and beyond it than the kerb's edge
    (the embankment eats into the street's corners 2 m out). Never on another street's
    carriageway: at first it lowered a service road on the hill over the tunnel at (1627, 1265)
    by 4.7 m, and would have raised the Avenida Miguel Torga by the fork deck at (856, 2045).
  - **6 m under a deck, for party-kart.** Its ground stands a car on the higher of the land and the
    deck and feels the land's slope over 1.5 m either side. Held 3 m in, the embankment beyond
    still came into the 2 m means under the deck's first 2 m, the land at the end line edged the
    deck by a centimetre, and the car was thrown 1.18 s there; held 5 m, level, the land stood a
    few centimetres over the deck 3 m in and threw it 1.68 s. At 6 m, falling 3% from a metre in:
    no flight. So the abutment's top runs up to 4 m further under the five dipping decks than the
    LiDAR has it, hidden under the deck.
  - **A tunnel's end** that meets the streets on the ground, where the ground is held, is at the
    ground at its node, as a deck's, not the lowest from its mouth to 4 m out (task 040): the held
    ground there is the cutting's floor, and a street rising to a mouth would have stepped down
    into it. Task 012's check (`tools/levels.mjs`) has one crossing go from "mouth" to "over".
  - `test/streets.test.js`: the tunnels' ends meet the ground within 5 cm (somewhere in the half
    metre the tiles round a line's point to); a new test, "the street on the ground runs into every
    deck and tunnel on its own slope"; the deck points by ground half a metre off it held to 2.
- **Measured** (braga-map's tests on the new tiles): the 20 decks' ends meet the ground within
  0.050 m (239 points), the 8 tunnels' within 0.036 m; the first 2 m out of 24 of the 28 ends
  within 0.08 m of a line fitted to the tiles' ground from 2 to 6 m out, where before it dipped
  0.17 to 0.57 m at the five decks and climbed 0.5 to 4.5 m at the mouths. The test allows a
  decimetre, not 5 cm: the tiles hold heights in decimetres, and the ends that never dipped
  measure up to 7 cm against such a line (5 cm is what the ends meet the ground to). The deck
  points by ground half a metre off: 32 → 2, both the Largo Santa Justa deck's outer pavement
  corners, where the bank beside its street falls 2 m in the 2 m out, more than the 2 m grid
  turns. The corner of the ground's junction between the Robert Smith's two decks was 8 of the 32;
  the hold covers it now, but the strip is still there: task 046.
- **Left: four walled mouths**, the Liberdade underpass's two west mouths and two of the João
  XXI's narrow bores, 0.13 to 0.97 m off in their first 2 m: a cutting's wall 1.5 to 4 m from the
  street's middle, which the 2 m grid takes into the street there and along the cutting (`WALLED`
  in the test): task 045. "Runs level into it" doesn't hold at those four.
- **party-kart** (owner, 2026-10-15: not in its tree, which another session is working in): a
  worktree of its `f6d2eba` with its own `npm ci`, braga-map's files in its `node_modules`
  replaced with these tiles. Its world-ground drive isn't thrown off the Robert Smith's deck (1.48 s
  before) or at (−272, 1073) (0.92 s); it still is on the Avenida João XXI over its junction,
  0.94 s at (561, 244) and 1.36 s at (602, 219) (1.04 and 0.81 s before), where the tiles' ground
  ripples beside the tunnels' cutting before and after this task (task 045). Its ground and drive
  tests pass (17). Without `openings` its Liberdade underpass test fails (the car goes over the
  avenue, not through): it still needs them, at the walled mouths at least. party-kart's own
  `npm test` and `npm run check` weren't run, it wasn't changed, and it's still on 1.7.0.
- **Budget:** the tiles 7,704 KB, as before; 15 tiles changed (14 FINE tiles' ground and lines, and
  one number in x-1z-1's streets); no new kind of geometry.
- **Not verified:** the viewpoints weren't shot (no game shows this until party-kart takes a new
  tag); the railway's bridges' ends aren't held (streets only, `k ≤ 8`); the 10 m tiles aren't.
- **Released as 1.9.1 (2026-10-15).** The tag `v1.9.0` was pushed by mistake on the version's
  commit before this task's tiles were committed: it holds 1.8.0's tiles. Pin `v1.9.1` or later.
