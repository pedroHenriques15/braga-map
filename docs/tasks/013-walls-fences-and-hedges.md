---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 009]
roadmap: Phase 2 · The shape
---

# 013 · Walls, fences, gates, railings and hedges where they stand

## Why

In Minho, nearly every house stands behind a granite wall with a gate, and the hills are held by
retaining walls; blocks of flats have low walls with railings, roads run between long concrete or
painted walls. In the game, buildings stand straight behind the pavement with nothing between, and
the only walls are the plain granite ones party-kart puts where the land stands over a street. The
residential streets read as a city centre. In the shooter's area, walls are where a player takes
cover and climbs, and a kart in free roam hits them.

## What

Split on 2026-10-15: the footways, steps, paths and cycleways went to task 050, and what the ground
is inside a plot (a front garden's lawn, a paved yard, a driveway) to task 016, which classifies
the ground from the orthophoto. This task is what stands: walls, fences, gates, railings and hedges.

Today:

- OpenStreetMap has almost none here: the `barrier` features were never fetched (`tools/fetch.mjs`
  has no query for them), and among the streets fetched, 5 ways in the route's box are tagged
  `barrier=wall` and 4 `fence` (2026-10-13). None in the shooter's area (task 015).
- The LiDAR sees them: the surface model and the terrain model at 50 cm (`MDS-50cm`, `MDT-50cm`,
  fetched for the 20 DGT tiles under the route's box, which holds the open world's area) and the
  point cloud, about 10 points a m², each point classed (`tools/dgt.mjs`, `CLASS`) and with its
  near-infrared. `tools/roofs.mjs` reads the cloud for the buildings already.
- party-kart draws a granite retaining wall wherever the land stands over a street's edge
  (`src/render/streets.ts`, "a granite retaining wall up to it", decision 024), and its karts hit
  the land where it rises more than a step (`src/world/ground.ts`). Nothing else stands between a
  pavement and a building.

Steps:

1. **Fetch** OpenStreetMap's `barrier` ways and nodes (wall, fence, retaining_wall, hedge,
   guard_rail, gate) over the map, into `.cache/osm/` with the rest (`fetch.mjs`), with their
   `height`, `material` and `wall` tags where mapped. Bollards are street furniture (task 020).
2. **Find the walls the map lacks** over the open world's area (the route and the shooter's area
   are in it): from the LiDAR, a narrow ridge over the bare ground, 0.4–4 m high and 0.15–0.6 m
   wide, running at least 3 m, that isn't a building's footprint or a tree's crown (the cloud's
   classes and its near-infrared tell a hedge from a wall); a retaining wall where the ground
   steps more than 0.8 m within half a metre. Each: its line, its height (its top over the ground
   either side, both sides for a retaining wall), its width, and where it came from (`osm`,
   `lidar`).
3. **What each is** (the owner's answer): from its photo where one shows it (task 008's
   reference photos, the viewpoints); else by what's around it: a house's front wall in granite
   blocks, a block of flats' a low rendered wall with a railing on it, a cutting's or a slope's a
   granite retaining wall, a long wall by a fast road in concrete, a hedge where the near-infrared
   says it's growing. Check the rule against the photos that do show walls before using it where
   none does.
4. **Gates:** where a driveway or a path meets a wall (OpenStreetMap's `barrier=gate`, the
   service roads and task 050's paths, and gaps in a found wall a car's width or a door's), a
   gate in it. Shut to a kart. In the shooter's area, open or shut as its photos show
   (`docs/SHOOTER-AREA.md`).
5. **In the tiles:** a `walls` list in the world (`index.d.ts`), each `{ kind, h, w, level, pts,
   source }`, and the gates; on the open world's tiles, as `world.streets` is.
6. **party-kart: draw them and hit them.** Each kind in its material, with a coping stone on a
   granite or rendered wall, railings and fences see-through, hedges in leaf; the gates. Each is a
   wall to a kart (`src/world/ground.ts`), as a building is. Where a found retaining wall stands,
   it replaces the plain one `streets.ts` draws there.
7. **In the shooter's area,** every wall, fence, gate, railing and hedge in its photos, at its
   height and of its kind: the granite walls round the houses, the railings by the river, the
   school's fence (`docs/SHOOTER-AREA.md`).

## Questions

- [x] A wall the LiDAR finds but no photo shows (most of them): what is it drawn as? Options: by
  what's around it; all granite; all rendered and painted. Recommendation: by what's around it.
  > By what's around it (the owner, 2026-10-15): a house's front wall granite, a block of flats' a
  > low rendered wall with a railing, a cutting's a granite retaining wall, a fast road's concrete.

## Read first

- braga-map: `tools/fetch.mjs` (the queries), `tools/dgt.mjs` (`heights`, `points`, `CLASS`),
  `tools/roofs.mjs` (how the cloud is read for the buildings), `tools/world.mjs` (packing the
  tiles), `index.js` and `index.d.ts`.
- party-kart: `src/render/streets.ts` (the retaining walls), `src/world/ground.ts` (the walls a
  kart hits), `src/render/textures.ts`.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, every wall, fence, gate, railing and
  hedge at its height and of its kind, and which gates into the courtyards open.
- `docs/SOURCES.md`: DGT's LiDAR and its licence. Decisions 022 (OpenStreetMap as it is) and 025
  (measured, found, never invented).

## Done when

- [ ] The open world's tiles carry its walls, fences, railings, hedges and gates, each with its
  height, kind and source; a test in `test/` checks the ones the map has are there.
- [ ] The viewpoints whose photos show walls look more like them: along the route `couteiro` (the
  tall wall with a fence on it), `monte-da-forca` (the houses' gates and low walls),
  `bernardo-sequeira` (the low granite wall and hedge), `alvaro-carneiro` (the stone retaining
  wall), `viriato-amaral-nunes` (the long painted wall) and `liberdade` (the hedge); in the
  shooter's area `travessa-fujacal` and `alameda-fujacal`.
- [ ] In the shooter's area, every wall and gate in its photos is in the game, at its height.
- [ ] A kart hits them in party-kart, in a test.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- Footways, steps, paths and cycleways: task 050.
- What the ground is inside a plot (lawn, paving, a driveway): task 016.
- The pavements' surface and pattern: task 018. Buildings' facades: task 017.
- Walls outside the open world's area: when the area grows (task 038).

## Notes

- From task 009: where the ground behind a pavement is higher than its back edge, party-kart draws
  a plain granite wall from the pavement up to the ground (since task 035 in
  `src/render/streets.ts`), so the cuttings along the route already have a wall, of the wrong kind
  in places. This task's walls replace them where they're found.
- From the drafting, 2026-10-15, looking at the viewpoints' photos: `couteiro` has a tall concrete
  wall with a fence on it, `monte-da-forca` rendered walls and gates in front of houses,
  `bernardo-sequeira` a low granite wall under a hedge, `alvaro-carneiro` a stone retaining wall,
  `viriato-amaral-nunes` a long wall painted over, `liberdade` a hedge between the pavement and the
  flats. Not checked: how well the LiDAR's 50 cm models show a wall 0.2 m wide (the point cloud may
  be needed), and how many OSM `barrier` ways there are (not fetched).
