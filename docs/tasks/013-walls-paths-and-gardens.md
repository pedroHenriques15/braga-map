---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 006]
roadmap: Phase 2 · The shape
---

# 013 · Walls, fences, gates, front gardens, footpaths and steps

## Why

In Minho, nearly every house stands behind a granite wall with a gate, and a front garden or a
driveway between it and the street. In the game, buildings stand straight on the pavement or the
kerb, with nothing between. The residential streets read as a city centre. Footpaths, steps and
squares are missing too (they were never fetched, task 006). For the shooter's area, walls
and steps are also where a player takes cover and climbs.

## What

Today:

- OSM has almost no barriers here: in the track's box, 5 ways tagged `barrier=wall` and 4
  `fence` among the streets fetched (2026-10-13). The `barrier` features themselves were
  never fetched.
- `tools/track.mjs:443-450` makes pavements from `sidewalk` tags, or the room left before
  the buildings, clamped to 1.2–3.2 m. Nothing is drawn between the pavement and a building
  set back from it.
- party-kart draws kerbs and calçada (`src/render/road.ts:139-180`), and no walls or gardens
  (`city.ts`).

Steps:

1. **Fetch** `barrier` (wall, fence, retaining_wall, hedge, gate), `leisure=garden`,
   `landuse=grass`, `amenity=parking`, `highway=footway/steps/path` (with task 006), and
   `area:highway` where mapped.
2. **Find the walls the map lacks** in the track's box and the shooter's area:
   - from the LiDAR surface (task 009): a line of points 1–2.5 m above the ground, 0.2–0.6 m
     wide, along a plot's front;
   - from the orthophoto (task 005): the line between the pavement and a plot;
   - from the photos (task 008): the material (granite blocks, rendered and painted, railings
     on a low wall, hedge) and the height.

   Store what's found as world data (`walls` in the tiles: points, height, kind), with where
   each came from.
3. **Plots:** between a building and the street, fill with garden, paving, driveway or parking,
   from the orthophoto's colours (green, grey) and the photos.
4. **Draw them** in party-kart: walls in their materials with a coping stone, gates where a
   driveway meets the street, hedges, railings; footpaths and steps at their levels.
5. **In the shooter's area,** every wall, step and gate from the photos, at its real height:
   it's where the game is played.

## Read first

- `tools/fetch.mjs`, `tools/world.mjs`, `tools/track.mjs:443-450`.
- `../party-kart/src/render/road.ts:139-180`, `city.ts`.
- Task 005 (the sources), 006 (the footways), 009 (the LiDAR surface).

## Done when

- [ ] The world tiles carry walls, fences and hedges for the track's box, with their source.
- [ ] Along the route, a residential street seen from its viewpoint has its front walls and
  gardens where its photo has them.
- [ ] In the shooter's area, every wall and step in the photos is in the game, checked at its
  foot viewpoints.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- The pavements' surface and pattern: task 018.
- Buildings' own facades: task 017.

## Notes

- From task 009: where the ground behind a pavement is higher than its back edge, party-kart draws
  a plain granite wall from the pavement up to the ground (`edges` in `city.ts`, `wallBetween` in
  `road.ts`), so the cuttings along the route already have a wall, of the wrong kind in places.
  This task's walls replace them where they're found.
- From task 032: the open world's edge (`tools/open.mjs`) gives a gate wherever a street crosses
  it, and the footpaths and steps this task brings should get theirs too: give them a kind in
  `LINE` (`osm.mjs`) and run `npm run open`, `npm run world` and `npm run page` again.
