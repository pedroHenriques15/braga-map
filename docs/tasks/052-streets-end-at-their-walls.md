---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-16
depends-on: [013, 026]
roadmap: Phase 2 · The shape
---

# 052 · The streets end at their walls

## Why

Task 013 put the walls in the world, and found many of the map's own standing where the world draws
a street: in the open world's area, 4.0 km of OpenStreetMap's 29.6 km of walls, fences and hedges
lie on a carriageway as `tools/streets.mjs` draws it, and 4.8 km on a pavement. A wall on a
carriageway is cut away (as a building in a street is, decision 021), so it's lost; one on a
pavement stands in the middle of it, the pavement going on past it into the garden behind. In Braga
a street ends at its walls: the pavement runs from the kerb to the wall, and where there's no
pavement the carriageway does.

## What

Today (2026-10-16, after task 013):

- `tools/streets.mjs`'s `streetSurfaces` draws each carriageway at the map's `width`, or its lanes,
  or what its kind usually is (`carriageway` in `tools/osm.mjs`), and the pavements 3.2 m out from
  the kerb or to the buildings and the water (its `buildings`, `water`): the walls aren't among what
  stops them.
- `tools/world.mjs` cuts each wall where it would stand on a carriageway or a path on the ground
  (`walls.mjs`'s `cutWalls`): 4.0 km of the map's walls in the area (13.6% of their length) and 0.17
  km on paths. `test/walls.test.js` reports it ("cut away on a carriageway or a path the world
  draws").
- The walls are `.cache/walls.json`'s (`tools/walls.mjs`), made before `world.mjs` runs
  `streetSurfaces`: they can be given to it.

Steps:

1. **The pavements stop at a wall:** `streetSurfaces` takes the walls as it takes the buildings (the
   owner's answer): the map's walls, fences, railings, hedges and retaining walls, and the walls and
   retaining walls the LiDAR found, but not the hedges it found nor the gates. A pavement runs from
   its kerb to the first wall or building behind it, 3.2 m at most.
2. **A carriageway the map's wall stands in gives way to it** (the owner's answer): its edge brought
   back to the wall there, the street no narrower than its lanes (`lanesOf` in `tools/osm.mjs`,
   each at least 2.5 m), so the wall stands at its kerb and isn't cut away. Where the lanes don't fit
   between the wall and the other side, the street keeps its lanes' width and the wall is cut where
   it stands in it, as today, and the test counts those.
3. A path (task 050) stops at a wall as at a building, but where it passes through it (`walls.mjs`
   opens the wall there).
4. party-kart draws and drives what changes (`src/render/streets.ts`, `src/world/ground.ts`): the
   retaining walls the streets draw at their edge where the land is higher already give way to the
   map's (task 013).
5. Shoot the viewpoints where a street runs between walls (`monte-da-forca`, `travessa-fujacal`,
   `alameda-fujacal`, `couteiro`) and measure the budget (task 004).

## Questions

- [x] Where one of the map's walls stands inside a carriageway as the world draws it (the map's
  width, or its kind's usual, is wider than the street there): what gives way? Options: the
  carriageway, its edge brought back to the wall (no narrower than its lanes); the wall, cut away as
  today; both kept, the wall standing in the street. Recommendation: the carriageway, as the wall is
  where the street really ends (decision 019: the street at its real width).
  > The carriageway (the owner, 2026-10-16): its edge brought back to the wall, no narrower than its
  > lanes.
- [x] Do the walls the LiDAR found stop a pavement too, or only the map's? Options: all of them; only
  the map's and the LiDAR's retaining walls; only the map's. Recommendation: all but the hedges the
  LiDAR found (half of those in the contact sheets were scrub).
  > All but the hedges the LiDAR found (the owner, 2026-10-16).

## Read first

- braga-map: `tools/streets.mjs` (`streetSurfaces`, the pavements), `tools/walls.mjs` (`cutWalls`,
  what's in `.cache/walls.json`), `tools/world.mjs`, `test/streets.test.js`, `test/walls.test.js`.
- party-kart: `src/render/streets.ts`, `src/world/ground.ts`.
- Decisions 019 (the streets at their real widths), 021 (a building in a street is cut at the
  kerb), 022 (OpenStreetMap as it is) and 024.

## Done when

- [ ] No pavement runs past a wall into what's behind it; a test in `test/streets.test.js` says how
  much of the walls' length has pavement past them (none, but at a gate or an opening).
- [ ] The map's walls are no longer cut away on a carriageway, but where its lanes don't fit beside
  one, and `test/walls.test.js` counts those.
- [ ] The viewpoints between walls look more like their photos: `monte-da-forca`, `travessa-fujacal`,
  `alameda-fujacal`, `couteiro`.
- [ ] What it changes is measured against the budget (task 004) and recorded in Notes.

## Out of scope

- Every street on its real carriageway, from the map's line off its middle: task 026 (this task
  comes after it, and brings the edge to a wall only where 026 leaves it past one).
- The pavements' heights: task 044.

## Notes

- Both questions answered on 2026-10-16: `todo`, after task 026.
- From task 013, 2026-10-16: measured with its walls in the tiles, over the open world's area: of
  the map's 29.6 km of barriers (but the gates), 24.6 km are in the tiles, 4.0 km cut away on a
  carriageway, 0.17 km on a path, 0.9 km at its openings and gates; 4.8 km of them stand on a
  pavement as the world draws it. Not checked: how much of the LiDAR's walls stand on a pavement.
