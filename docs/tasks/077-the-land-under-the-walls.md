---
status: todo
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

- [ ] A test lists the retaining walls whose lower side is drawn within a step of their top, and the
      walls standing over the land, and they're none but where a cause is recorded.
- [ ] In party-kart, a walker can't step over any retaining wall in the shooter's area from its
      lower side, nor walk under a wall.

## Out of scope

- The steps' land: task 076.
- The pavements' own heights: task 044.

## Notes

Found walking Fujacal in task 073, 2026-10-20.
