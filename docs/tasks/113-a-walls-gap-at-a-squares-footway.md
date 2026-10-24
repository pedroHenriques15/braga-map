---
status: todo
priority: low
kind: code
repo: braga-map
created: 2026-10-24
depends-on: [041]
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 113 · A wall keeps its gap where a footway gives way to a square's paving

## Why

Walls are cut where a carriageway or a path crosses them, so a gate or an opening in a wall stays
open where a way goes through it. A square's paving isn't a path: where a footway gives way to a
square at a wall, the wall's gap for it closes, and a walker meets a wall where the real one has an
opening. Task 041 found one, drawing the squares mapped in parts; a square mapped as one way does
the same.

## What

Today (braga-map 1.35.0, task 041's): `tools/walls.mjs` (task 013, decision 033) cuts the walls where
the carriageways and the paths cross them; the squares (`plaza` areas, from `highway=pedestrian`
ways and, since 041, relations) don't cut them. Found: a 1.2 m gap at (-983, 264) in tile `x-2z0`,
at the square relation 20029700, outside the open world's area.

1. **Count them:** every wall within a metre of a square's edge where a footway, a path or a
   square's own outline crosses it, and whether it's cut there; inside the open world's area first.
2. **Cut them:** a square crossing a wall cuts it where the square's paving meets the wall's line, at
   the width of what crosses (the footway's, else the opening the LiDAR sees in the wall's points).
3. `npm run world`, the tests (`test/walls.test.js`, a case at (-983, 264)), and a shot where one is
   in the open world.

## Read first

- `tools/walls.mjs`, `tools/world.mjs` (the squares), decision 033; task 041's Notes (decision 063).

## Done when

- [ ] No wall closes a footway's way into a square (the test), the count before and after in Notes.
- [ ] `npm test` passes.

## Notes

- Found by worker-3 in task 041 (2026-10-24), drafted by the coordinator.
