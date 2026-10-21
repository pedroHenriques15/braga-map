---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-20
depends-on: []
roadmap: Phase 2 · The shape
---

# 077 · The land at a wall's level: a retaining wall's drop, and the terrace a wall stands on

## Why

On foot (task 073), a retaining wall is something a player can drop off but never climb, and a wall
is cover. But where the land drawn under a wall isn't at the wall's own levels, a player steps over a
4 m retaining wall as if it were a kerb, because the land on its lower side is drawn at its top, or
walks under a garden wall standing 4 to 7 m in the air, on a terrace the land doesn't have.

## What

Today (braga-map 1.29.0, task 013's walls): a retaining wall's top is the map's (the LiDAR's) and
its foot its face's height under that; a free-standing wall stands on the land, or at the map's own
level where that's more than 1.5 m off the land (party-kart's `wallSpan`). The land is the tiles'
ground, the 2 m means, which ramps up to a retaining wall's top over 2 m, and doesn't have a narrow
terrace.

Walked on 2026-10-20 (task 073's survey: into the middle of every straight stretch of every wall in
the shooter's area 0.75 m high or more, from 2 m out on each side, running and jumping):

- **Retaining walls** walked through from their lower side: 13 of 153, their top within 0.9 m of the
  land on that side, mostly within 0.45 m: at (-165.8, 715.9), 2.87 m high; (-179.1, 731.6) and
  (-180.7, 726.3), 2.31 m; (-52.3, 704.3), (-59.4, 682.0) and (-60.9, 677.4), 1.23 m; (264.8, 839.9)
  and (281.9, 869.9), 1.17 m; (129.0, 623.6), 2.2 m; and one 4.35 m high at (133.1, 650.1), (127.5,
  651.9), (119.6, 663.4) and (120.9, 669.1), beside the Travessa do Fujacal's 17 steps.
- **Walls** walked under: 4 of 457, standing 4.4 to 7.5 m over the land: at (297.5, 889.3), 1 m
  high; (-316.3, 1080.6) and (-310.7, 1080.0), 1.82 m.
- Every hedge (152) and gate (51) stopped a walker.

Steps:

1. Measure it over the open world's area in a test: for each retaining wall, the land at 1 m and
   3 m out on its lower side against its foot; for each wall at its own level, the land under it
   against that level.
2. For each, from the terrain at 50 cm (`MDT-50cm`) and the LiDAR's points: which is wrong, the
   land or the wall (its side, its height, whether it's a retaining wall at all). A retaining wall
   whose lower side the terrain has lower: the land on that side at the terrain's height, up to the
   wall's face. A wall on a terrace: the terrace in the land.
3. In party-kart, the survey's walls again: none walked through or under but where a cause is
   recorded.

## Read first

- `tools/walls.mjs`: how the walls are measured (task 013).
- party-kart's `src/world/ground.ts` (`wallSpan`, the retaining walls' `HOLD`) and
  `src/game/walker.ts`.

## Done when

- [x] A test lists the retaining walls whose lower side is drawn within a step of their top, and the
      walls standing over the land, and they're none but where a cause is recorded. *(`test/walls.test.js`,
      the shooter's area: 1 of 161 stretches of retaining walls, its cause recorded; 0 of 440 walls)*
- [x] In party-kart, a walker can't step over any retaining wall in the shooter's area from its
      lower side, nor walk under a wall. *(`walk.test.ts`'s survey, task 073's again: 1,026 stretches
      of walls, retaining walls, hedges and gates 0.75 m high or more, run and jumped at from 2 m out,
      none walked through; on 1.31.0 with the old game, 6 retaining walls and 3 walls)*

## Out of scope

- The steps' land: task 076.
- The pavements' own heights: task 044.

## Notes

Found walking Fujacal in task 073, 2026-10-20.

### 2026-10-20: the work (braga-map and party-kart)

What was wrong, from the terrain at 50 cm and the walker survey again (13 stretches of retaining walls
crossed in 073's count of walls, 6 here counted by stretch on 1.31.0; 3 walls walked under, 4 in 073's):

- **The retaining walls: the wall, not the land.** Five of the six were stretches of the map's
  retaining walls where the terrain doesn't step at all: OpenStreetMap gives a way one height (the
  middle of what `measureLine` measured along it), and a retaining wall's face tapers out at its ends,
  runs on past it, or turns a corner where its higher ground changes side (at (-179.6, 729.8) the
  ground was 0.7 m higher on its "lower" side). Of the map's 23 km of retaining walls round the open
  world, 3.0 km had their higher ground on the wrong side and 5.1 km have no step. `walls.mjs`'s
  `stepsOf` now measures each along it every half metre (the terrain from 1.75 m out either side, the
  middle over 2 m): cut where its higher ground changes side (turned) or its step changes height, each
  piece its own `h`; where the terrain doesn't step, a piece as low as it does (0.1 to 0.3 m), which a
  walker climbs as it should. Material stays the whole wall's. 2,443 pieces.
- **The sixth** (264.8, 839.9) and the rest of the shooter's 1 m ones: the map's line is 0.75 m off the
  terrain's step (the median over the open world, either way; not the buildings' shift, which explains
  the LiDAR-found walls' 0.5 m but not the map's), and the tiles' land ramps up to the top over 2 m, so a
  walker ran up the ramp and jumped. Nothing is moved (decision 033). In party-kart, a retaining wall
  from its lower side now stands `HOLD` over its top for a walker as for a kart, where its face is more
  than a step (`overTop` in `ground.ts`, used by the bots' paths too; the wall carries `face`).
- **The walls walked under: the land, in party-kart.** All three stand on the Rio Este's bank by
  Fujacal, where `land.ts` cut the river's bed 12 m wider than the river either side, under them (the
  walker's feet 4 to 7 m under their tops). The bed is now cut no further than a wall, hedge or fence
  standing on the bank (one between a point and the river's middle within 45° of it), nor under one's
  foot whichever way it runs (one runs down the bank to the water). Not a retaining wall: it's the
  channel's side, and the race's jump by Ponte Pedrinha flies the gap between two (with them the
  Volta's lap respawned 86 times).
- **The land carved to the wall's face** (step 2's "the land on that side at the terrain's height")
  wasn't done: the tiles' land is a 2 m grid and party-kart draws it at 2 m, so it can't hold a step at
  the wall, and with the map's lines 0.75 m off it would put the step in the wrong place. The game's
  rule above does what it was for.

Left in the shooter's area (`test/walls.test.js`, with its cause): 1 of 161 stretches of retaining
walls with the land 3 m out on its lower side within a step of its top, (-275, 778.5): the map's wall
along a garden's edge over a pit 3 m wide and 2.8 m deep, which it measures as a retaining wall; and 0
of 440 stretches of walls standing over the land.

party-kart's tests: 98 of 99 pass; "the world as a ground: built in well under a second" takes 2.1 s
with the whole suite running (0.75 s alone), over its 2 s, and did so before these changes too (2.2 s on
this map without them): the machine's load (four Vite dev servers running), left as it is.
`npm run check` passes. braga-map's: 145 pass, 1 skipped.

### 2026-10-20: finished

braga-map 1.32.0 (not tagged); party-kart's `package.json` has `braga-map` at `file:../braga-map` until
it is. Decision 059. No viewpoint changes (the walls are where they were; the land by the river is the
LiDAR's now behind its walls), so no round; the budget: the map's retaining walls are 2,472 pieces round the open world
where they were 422 (14,727 pieces of wall in all, from 12,687), the same length: more ends to draw,
the same faces. Not measured in the game.

